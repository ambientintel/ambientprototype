import { NextRequest, NextResponse } from 'next/server';

const CT_URL = 'https://clinicaltrials.gov/api/v2/studies';

// Fields we actually render — keeps payload small
const FIELDS = [
  'NCTId',
  'BriefTitle',
  'OverallStatus',
  'Phase',
  'LeadSponsorName',
  'StartDate',
  'CompletionDate',
  'EnrollmentCount',
  'BriefSummary',
  'Condition',
  'InterventionType',
  'InterventionName',
  'StudyType',
  'StudyUrl',
].join(',');

type PhaseFilter = {
  phases?: string[];            // filter.phase
  studyType?: string;           // filter.studyType
  interventionType?: string;    // filter.interventionType
  extraTerm?: string;           // appended to query.term
};

const PHASE_MAP: Record<string, PhaseFilter> = {
  'Phase I':       { phases: ['PHASE1']                           },
  'Phase II':      { phases: ['PHASE2']                           },
  'Phase III':     { phases: ['PHASE3']                           },
  'Phase IV':      { phases: ['PHASE4']                           },
  'Observational': { studyType: 'OBSERVATIONAL'                   },
  'Registry':      { studyType: 'OBSERVATIONAL', extraTerm: 'registry' },
  'Device':        { interventionType: 'DEVICE'                   },
  'Drug':          { interventionType: 'DRUG'                     },
  'Biologics':     { interventionType: 'BIOLOGICAL'               },
  'Behavioral':    { interventionType: 'BEHAVIORAL'               },
  'Adaptive':      { extraTerm: 'adaptive'                        },
};

function phaseColor(phases: string[]): string {
  const p = phases[0] ?? '';
  if (p === 'PHASE1' || p === 'EARLY_PHASE1') return '#10B981';
  if (p === 'PHASE2')                          return '#06B6D4';
  if (p === 'PHASE3')                          return '#8B5CF6';
  if (p === 'PHASE4')                          return '#F59E0B';
  return '#10B981';
}

function studyTypeColor(type: string): string {
  if (type === 'OBSERVATIONAL') return '#06B6D4';
  if (type === 'EXPANDED_ACCESS') return '#F43F5E';
  return '#10B981';
}

function fmtDate(d: string | undefined): string {
  if (!d) return '';
  try {
    const date = new Date(d.length === 7 ? d + '-01' : d);
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  } catch { return d; }
}

function fmtPhase(phases: string[]): string {
  const map: Record<string, string> = {
    EARLY_PHASE1: 'Early Phase I', PHASE1: 'Phase I',
    PHASE2: 'Phase II', PHASE3: 'Phase III', PHASE4: 'Phase IV', NA: 'N/A',
  };
  return phases.map(p => map[p] ?? p).join(' / ') || 'N/A';
}

function fmtStatus(s: string): string {
  return (s ?? '').toLowerCase().replace(/_/g, ' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractStudy(raw: any) {
  const p   = raw.protocolSection ?? {};
  const id  = p.identificationModule ?? {};
  const st  = p.statusModule ?? {};
  const sp  = p.sponsorCollaboratorsModule ?? {};
  const des = p.descriptionModule ?? {};
  const con = p.conditionsModule ?? {};
  const des2= p.designModule ?? {};
  const inv = p.interventionsModule ?? {};

  const phases: string[]       = des2.phases ?? [];
  const studyType: string      = des2.studyType ?? '';
  const interventions: string[]= (inv.interventions ?? []).map((i: { type: string }) => i.type ?? '');
  const nctId: string          = id.nctId ?? '';

  let color = phaseColor(phases);
  if (!phases.length) color = studyTypeColor(studyType);

  return {
    id:             nctId,
    title:          id.briefTitle ?? id.officialTitle ?? 'Untitled',
    nctId,
    phase:          fmtPhase(phases),
    status:         fmtStatus(st.overallStatus ?? ''),
    sponsor:        sp.leadSponsor?.name ?? '',
    startDate:      fmtDate(st.startDateStruct?.date),
    completionDate: fmtDate(st.completionDateStruct?.date),
    enrollment:     des2.enrollmentInfo?.count ? `N=${des2.enrollmentInfo.count.toLocaleString()}` : '',
    description:    (des.briefSummary ?? '').slice(0, 300).replace(/\n/g, ' '),
    conditions:     con.conditions ?? [],
    interventions,
    color,
    url:            `https://clinicaltrials.gov/study/${nctId}`,
  };
}

export async function POST(req: NextRequest) {
  const { query, phase } = (await req.json()) as { query: string; phase: string };

  const filter = PHASE_MAP[phase] ?? {};

  // Build query params
  const params = new URLSearchParams();

  const termParts: string[] = [];
  if ((query ?? '').trim()) termParts.push(query.trim());
  if (filter.extraTerm)     termParts.push(filter.extraTerm);
  if (termParts.length)     params.set('query.term', termParts.join(' '));

  if (filter.phases?.length)      params.set('filter.phase', filter.phases.join(','));
  if (filter.studyType)           params.set('filter.studyType', filter.studyType);
  if (filter.interventionType)    params.set('query.intr', filter.interventionType);

  // Only recruiting + active studies
  params.set('filter.overallStatus', 'RECRUITING,ACTIVE_NOT_RECRUITING,NOT_YET_RECRUITING,ENROLLING_BY_INVITATION');
  params.set('pageSize', '12');
  params.set('format', 'json');
  params.set('fields', FIELDS);
  params.set('sort', 'LastUpdatePostDate:desc');

  // Need at least a term or a filter — if neither, search open interventional studies
  if (!params.has('query.term') && !params.has('filter.phase') && !params.has('filter.studyType') && !params.has('query.intr')) {
    params.set('filter.studyType', 'INTERVENTIONAL');
  }

  try {
    const res = await fetch(`${CT_URL}?${params.toString()}`, {
      method:  'GET',
      headers: {
        'Accept':     'application/json',
        'User-Agent': 'AmbientIntelligence/1.0',
      },
      signal: AbortSignal.timeout(10_000),
      next:   { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      return NextResponse.json({
        studies: [], total: 0,
        error: `ClinicalTrials.gov returned ${res.status}. Try again.`,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawStudies: any[] = json.studies ?? [];
    const total: number     = json.totalCount ?? rawStudies.length;

    const studies = rawStudies.map(extractStudy);

    return NextResponse.json({ studies, total });

  } catch (err) {
    console.error('[clinicalresearch/search]', err);
    return NextResponse.json({
      studies: [],
      total: 0,
      error: 'Search temporarily unavailable. Try again in a moment.',
    });
  }
}
