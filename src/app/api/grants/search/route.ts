import { NextRequest, NextResponse } from 'next/server';

const NIH_URL = 'https://api.reporter.nih.gov/v2/projects/search';

const INCLUDE_FIELDS = [
  'ProjectNum', 'ProjectTitle', 'Organization', 'PrincipalInvestigators',
  'AbstractText', 'TotalCost', 'FiscalYear', 'ProjectStartDate',
  'ProjectEndDate', 'ActivityCode', 'Terms',
];

const MECH_MAP: Record<string, string[]> = {
  'R01':    ['R01'],
  'R21':    ['R21'],
  'R03':    ['R03'],
  'R34':    ['R34'],
  'R61/R33':['R61','R33'],
  'K99/R00':['K99','R00'],
  'K-Awards':['K01','K08','K23','K99'],
  'F-Awards':['F30','F31','F32'],
  'U01':    ['U01'],
  'P01':    ['P01'],
  'T32':    ['T32'],
};

function fmtCost(n: number | null | undefined): string {
  if (!n) return '';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return '';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(s));
  } catch { return s; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGrant(raw: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pis: string[] = (raw.principal_investigators ?? []).map((p: any) => p.full_name ?? '').filter(Boolean);
  return {
    id:           raw.project_num ?? '',
    projectNum:   raw.project_num ?? '',
    title:        raw.project_title ?? 'Untitled',
    org:          raw.organization?.org_name ?? '',
    pis:          pis.join(', '),
    abstract:     (raw.abstract_text ?? '').slice(0, 320).replace(/\n/g, ' '),
    cost:         fmtCost(raw.total_cost),
    fiscalYear:   raw.fiscal_year ?? '',
    startDate:    fmtDate(raw.project_start_date),
    endDate:      fmtDate(raw.project_end_date),
    activityCode: raw.activity_code ?? '',
    url:          `https://reporter.nih.gov/project-details/${raw.core_project_num ?? raw.project_num ?? ''}`,
  };
}

export async function POST(req: NextRequest) {
  const { query, mechanism } = (await req.json()) as { query: string; mechanism: string };

  const activityCodes = mechanism && mechanism !== 'All'
    ? (MECH_MAP[mechanism] ?? [mechanism])
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const criteria: Record<string, any> = {
    fiscal_years: [2024, 2025],
  };

  if (activityCodes.length) criteria.activity_codes = activityCodes;

  if ((query ?? '').trim()) {
    criteria.advanced_text_search = {
      operator: 'and',
      search_field: 'terms,projecttitle,abstracttext',
      search_text: query.trim(),
    };
  }

  const body = {
    criteria,
    offset: 0,
    limit: 12,
    sort_field: 'fiscal_year',
    sort_order: 'desc',
    include_fields: INCLUDE_FIELDS,
  };

  try {
    const res = await fetch(NIH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ grants: [], total: 0, error: `NIH Reporter returned ${res.status}. Try again.` });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = json.results ?? [];
    const total: number = json.meta?.total ?? raw.length;

    return NextResponse.json({ grants: raw.map(extractGrant), total });

  } catch (err) {
    console.error('[grants/search]', err);
    return NextResponse.json({ grants: [], total: 0, error: 'Search temporarily unavailable. Try again in a moment.' });
  }
}
