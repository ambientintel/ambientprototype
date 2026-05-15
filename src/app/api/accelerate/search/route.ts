import { NextRequest, NextResponse } from 'next/server';

const GG_URL = 'https://apply07.grants.gov/grantsws/rest/opportunities/search/';

// Grants.gov agency codes
const AGENCY_CODES: Record<string, string> = {
  NIH:      'HHS-NIH',
  NSF:      'NSF',
  DOD:      'DOD',
  DOE:      'DOE',
  NASA:     'NASA',
  CDC:      'HHS-CDC',
  BARDA:    'HHS-ASPR',
  DARPA:    'DOD-DARPA',
  AFOSR:    'DOD-USAF',
  ONR:      'DOD-NAVY',
  'ARPA-H': 'HHS-ARPA-H',
};

function fmt(n: number | null | undefined): string {
  if (!n) return '';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
  } catch { return d; }
}

 
function agencyColor(code: string): string {
  if (code.includes('NIH'))  return '#4F9CF9';
  if (code === 'NSF')        return '#3DCC91';
  if (code.includes('CDC'))  return '#3DCC91';
  if (code.startsWith('DOD') || code.includes('DARPA') || code.includes('USAF') || code.includes('NAVY')) return '#FF6680';
  if (code === 'DOE')        return '#F0B429';
  if (code === 'NASA')       return '#F0B429';
  if (code.includes('ASPR') || code.includes('BARDA')) return '#52C0E8';
  if (code.includes('ARPA-H')) return '#8264F0';
  return '#4F9CF9';
}

export async function POST(req: NextRequest) {
  const { query, agency } = (await req.json()) as { query: string; agency: string };

  const agencyFilter = agency && agency !== 'All' && AGENCY_CODES[agency]
    ? [AGENCY_CODES[agency]]
    : [];

  const payload = {
    keyword:        (query ?? '').trim(),
    oppNum:         '',
    cfda:           '',
    agencies:       agencyFilter,
    dateRange:      'custom',
    startDate:      '',
    endDate:        '',
    oppStatuses:    'posted|forecasted',
    rows:           12,
    startRecordNum: 0,
    sortBy:         'closeDate|asc',
  };

  try {
    const res = await fetch(GG_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        'User-Agent':   'AmbientIntelligence/1.0',
      },
      body:   JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache:  'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ opportunities: [], total: 0, error: `Grants.gov returned ${res.status}` });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hits: any[] = json.oppHits ?? [];

    const opportunities = hits.map(h => {
      const ceiling = h.awardCeiling ?? h.award_ceiling ?? null;
      const floor   = h.awardFloor   ?? h.award_floor   ?? null;
      const code    = h.agencyCode   ?? h.agency_code   ?? '';
      const award   = ceiling
        ? (floor && floor !== ceiling ? `${fmt(floor)} – ${fmt(ceiling)}` : fmt(ceiling))
        : 'See announcement';

      return {
        id:          h.id ?? '',
        title:       h.title ?? 'Untitled',
        number:      h.number ?? h.opportunityNumber ?? '',
        agencyCode:  code,
        agencyName:  h.agencyName ?? h.agency_name ?? code,
        closeDate:   fmtDate(h.closeDate ?? h.close_date),
        openDate:    fmtDate(h.openDate  ?? h.open_date),
        award,
        status:      h.oppStatus ?? h.opp_status ?? '',
        description: (h.synopsis ?? h.description ?? '').slice(0, 280),
        category:    h.oppCategory?.description ?? h.fundingInstrumentTypesDescription ?? '',
        color:       agencyColor(code),
        url:         `https://www.grants.gov/search-results-detail/${h.id}`,
      };
    });

    return NextResponse.json({
      opportunities,
      total: (json.hitCount as number) ?? opportunities.length,
    });

  } catch (err) {
    console.error('[accelerate/search]', err);
    return NextResponse.json({
      opportunities: [],
      total: 0,
      error: 'Search temporarily unavailable — Grants.gov may be rate-limiting. Try again in a moment.',
    });
  }
}
