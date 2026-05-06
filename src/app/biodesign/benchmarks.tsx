'use client';
import React, { useState } from 'react';
import { BiodesignState, RegulatoryPathway, PATHWAY_META } from './data';
import { FlowCanvas } from './flowbg';

// ── Benchmark data constants ──────────────────────────────────────────────────

const MDUFA_PERFORMANCE: Record<string, {
  goal: number;
  actual2024: number;
  medianDays: number;
  p90Days: number;
  totalSubmissions2024: number;
  aiRequestRate?: number;
  refuseToAcceptRate?: number;
  majorDeficiencyRate?: number;
  panelRate?: number;
  conditionalApprovalRate?: number;
  goalDesc: string;
}> = {
  '510k': {
    goal: 90,
    actual2024: 88.2,
    medianDays: 83,
    p90Days: 97,
    aiRequestRate: 24,
    refuseToAcceptRate: 8.4,
    totalSubmissions2024: 3847,
    goalDesc: '90% cleared in 90 days',
  },
  'pma': {
    goal: 90,
    actual2024: 79.1,
    medianDays: 168,
    p90Days: 310,
    majorDeficiencyRate: 62,
    panelRate: 18,
    totalSubmissions2024: 51,
    goalDesc: '90% approved in 180 days',
  },
  'denovo': {
    goal: 90,
    actual2024: 72.3,
    medianDays: 194,
    p90Days: 390,
    totalSubmissions2024: 188,
    goalDesc: '90% decided in 150 days',
  },
  'ide': {
    goal: 95,
    actual2024: 96.4,
    medianDays: 22,
    p90Days: 30,
    conditionalApprovalRate: 68,
    totalSubmissions2024: 0,
    goalDesc: '95% decided in 30 days',
  },
};

interface PhaseEntry {
  phase: string;
  months: string;
  note: string;
}

interface TimelineBenchmark {
  p25Months: number;
  p50Months: number;
  p75Months: number;
  quickestMonths: number;
  phases: PhaseEntry[];
}

const TIMELINE_BENCHMARKS: Record<string, TimelineBenchmark> = {
  '510k': {
    p25Months: 14,
    p50Months: 22,
    p75Months: 36,
    quickestMonths: 8,
    phases: [
      { phase: 'Concept & Classification', months: '1–3', note: 'Product code, predicate identification' },
      { phase: 'Q-Sub Strategy Meeting', months: '2–4', note: 'First FDA touchpoint; 70 days' },
      { phase: 'Design & Verification', months: '4–10', note: 'DHF, bench testing, biocompatibility' },
      { phase: 'Pre-510(k) Q-Sub', months: '2–4', note: 'Highly recommended; reduces review risk' },
      { phase: '510(k) Preparation', months: '2–4', note: 'iMDRF format, all testing complete' },
      { phase: 'FDA Review', months: '3–6', note: '90-day MDUFA goal + AI request buffer' },
    ],
  },
  'pma': {
    p25Months: 60,
    p50Months: 84,
    p75Months: 120,
    quickestMonths: 36,
    phases: [
      { phase: 'IDE Preparation & Q-Sub', months: '6–12', note: 'Pre-IDE meeting critical for trial design' },
      { phase: 'IDE Review', months: '1–3', note: '30-day FDA goal; conditional common' },
      { phase: 'Clinical Trial', months: '24–60', note: 'Highly variable by indication and design' },
      { phase: 'Pre-PMA Q-Sub', months: '2–4', note: 'Final alignment before submission' },
      { phase: 'PMA Preparation', months: '6–12', note: 'Manufacturing, clinical summary, benefit-risk' },
      { phase: 'PMA Review', months: '6–18', note: '180-day goal; major deficiency adds ~90 days' },
    ],
  },
  'denovo': {
    p25Months: 22,
    p50Months: 30,
    p75Months: 48,
    quickestMonths: 14,
    phases: [
      { phase: 'Novel Classification Analysis', months: '2–4', note: 'Confirm no predicate; propose product code' },
      { phase: 'De Novo Q-Sub', months: '2–4', note: 'Special controls + criteria discussion' },
      { phase: 'Testing & Development', months: '6–14', note: 'Must meet proposed performance criteria' },
      { phase: 'De Novo Submission', months: '2–4', note: 'Full classification rationale required' },
      { phase: 'FDA Review', months: '5–18', note: '150-day goal; complex devices take longer' },
    ],
  },
  'exempt': {
    p25Months: 4,
    p50Months: 8,
    p75Months: 14,
    quickestMonths: 2,
    phases: [
      { phase: 'Classification Verification', months: '1–2', note: 'Confirm exempt status and limitations' },
      { phase: 'Design & Testing', months: '2–6', note: 'Appropriate for risk level' },
      { phase: 'Registration & Listing', months: '1', note: 'Annual requirement' },
    ],
  },
};

interface RejectionReason {
  reason: string;
  pct: number;
}

interface SuccessRateEntry {
  clearanceRate: number;
  aiRequestRate?: number;
  rtaRate?: number;
  majorDeficiencyRate?: number;
  panelRate?: number;
  topRejectionReasons: RejectionReason[];
  breakthroughImpact: string;
}

const SUCCESS_RATES: Record<string, SuccessRateEntry> = {
  '510k': {
    clearanceRate: 91.4,
    aiRequestRate: 24.0,
    rtaRate: 8.4,
    topRejectionReasons: [
      { reason: 'Insufficient performance testing', pct: 28 },
      { reason: 'SE argument not substantiated', pct: 22 },
      { reason: 'Labeling deficiencies', pct: 18 },
      { reason: 'Biocompatibility gaps', pct: 15 },
      { reason: 'Software documentation', pct: 12 },
      { reason: 'Other', pct: 5 },
    ],
    breakthroughImpact: 'Not applicable (510k path)',
  },
  'pma': {
    clearanceRate: 76.5,
    majorDeficiencyRate: 62.0,
    panelRate: 18.0,
    topRejectionReasons: [
      { reason: 'Inadequate clinical evidence', pct: 35 },
      { reason: 'Manufacturing/quality issues', pct: 25 },
      { reason: 'Benefit-risk framework gaps', pct: 20 },
      { reason: 'Labeling deficiencies', pct: 12 },
      { reason: 'Other', pct: 8 },
    ],
    breakthroughImpact: 'Breakthrough designation: ~35% faster review, interactive review process',
  },
  'denovo': {
    clearanceRate: 83.2,
    topRejectionReasons: [
      { reason: 'Insufficient special controls rationale', pct: 30 },
      { reason: 'Performance criteria not met', pct: 25 },
      { reason: 'Classification category issues', pct: 22 },
      { reason: 'Labeling deficiencies', pct: 15 },
      { reason: 'Other', pct: 8 },
    ],
    breakthroughImpact: 'Not typically applicable',
  },
  'exempt': {
    clearanceRate: 100,
    topRejectionReasons: [],
    breakthroughImpact: 'Not applicable',
  },
};

interface CostCategory {
  category: string;
  pct: number;
  note: string;
}

interface CostBenchmarkEntry {
  p25k: number;
  p50k: number;
  p75k: number;
  breakdown: CostCategory[];
}

const COST_BENCHMARKS: Record<string, CostBenchmarkEntry> = {
  '510k': {
    p25k: 350,
    p50k: 750,
    p75k: 1800,
    breakdown: [
      { category: 'Regulatory Affairs', pct: 18, note: 'Strategy, Q-Sub, submission writing' },
      { category: 'Testing & Validation', pct: 35, note: 'Bio, EMC, bench, software V&V' },
      { category: 'FDA Fees', pct: 3, note: 'MDUFA submission fee ~$22K' },
      { category: 'Legal & IP', pct: 12, note: 'Patents, FTO, regulatory counsel' },
      { category: 'Quality & Manufacturing', pct: 25, note: 'QMS, ISO 13485, process validation' },
      { category: 'Post-Market Setup', pct: 7, note: 'MDR, registration, surveillance' },
    ],
  },
  'pma': {
    p25k: 15000,
    p50k: 45000,
    p75k: 120000,
    breakdown: [
      { category: 'Clinical Trial', pct: 55, note: 'Dominant cost — sites, CRO, patients' },
      { category: 'Regulatory Affairs', pct: 15, note: 'IDE, pre-PMA, submission writing' },
      { category: 'Testing & Validation', pct: 12, note: 'Bench, biocompatibility, software' },
      { category: 'FDA Fees', pct: 1, note: 'PMA fee ~$425K (small biz discount available)' },
      { category: 'Legal & IP', pct: 8, note: 'Patents, FTO, regulatory counsel' },
      { category: 'Quality & Manufacturing', pct: 9, note: 'Manufacturing validation, QMS' },
    ],
  },
  'denovo': {
    p25k: 800,
    p50k: 2000,
    p75k: 6000,
    breakdown: [
      { category: 'Regulatory Affairs', pct: 25, note: 'Classification rationale, special controls' },
      { category: 'Testing & Validation', pct: 40, note: 'Must meet proposed performance criteria' },
      { category: 'FDA Fees', pct: 1, note: 'De Novo fee ~$5.5K' },
      { category: 'Legal & IP', pct: 15, note: 'Creating new product code has IP implications' },
      { category: 'Quality & Manufacturing', pct: 19, note: 'Same as 510k path' },
    ],
  },
  'exempt': {
    p25k: 50,
    p50k: 150,
    p75k: 400,
    breakdown: [
      { category: 'Testing & Validation', pct: 35, note: 'Appropriate bench testing' },
      { category: 'Quality & Manufacturing', pct: 40, note: 'QMS, manufacturing validation' },
      { category: 'Legal & IP', pct: 15, note: 'Patents, labeling compliance' },
      { category: 'Registration', pct: 5, note: 'FDA registration fees' },
      { category: 'Other', pct: 5, note: '' },
    ],
  },
};

const TIME_DRIVERS: Record<string, string[]> = {
  '510k': [
    'Predicate selection quality — poor predicate choice is the #1 delay driver',
    'Completeness of testing package — AI requests toll the clock by weeks',
    'Q-Sub usage — pre-510(k) Q-Subs reduce review risk measurably',
    'Software documentation maturity — underestimated for SaMD submissions',
  ],
  'pma': [
    'Clinical trial enrollment rate — site activation and patient accrual dominate',
    'FDA reviewer caseload — OHT office capacity varies significantly',
    'Advisory panel scheduling — adds 60–120 days if required',
    'Major deficiency response quality — each round adds ~90 days',
  ],
  'denovo': [
    'Novelty of proposed classification — novel devices trigger longer review',
    'Completeness of special controls rationale — incomplete rationale is top rejection reason',
    'Whether FDA has seen similar devices — familiarity shortens review significantly',
    'Performance criteria alignment — misalignment with FDA expectations causes rework',
  ],
  'exempt': [
    'Manufacturing readiness — production processes must be validated before listing',
    'QMS maturity — ISO 13485 readiness determines time to first customer',
    'Labeling compliance — accurate indications and contraindications',
    'Annual registration — recurring requirement, not a one-time milestone',
  ],
  'tbd': [
    'Pathway selection is the first critical decision — consult a regulatory strategist',
    'Q-Sub for pathway determination: FDA will classify your device and recommend a path',
    'Device complexity and risk level drive pathway more than any other factor',
  ],
};

// ── Shared style helpers ──────────────────────────────────────────────────────

const ACCENT = '#E8A852';

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
  marginBottom: 5,
};

const statCard: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  padding: '16px 18px',
};

// Category colors for the donut breakdown bars
const CAT_COLORS = [
  '#E8A852', '#52C0E8', '#A07EE8', '#52E8B4', '#E87252', '#8adf72',
];

function perfColor(pct: number): string {
  if (pct >= 85) return '#52E8B4';
  if (pct >= 70) return '#E8A852';
  return '#E87252';
}

function fmtCost(k: number): string {
  if (k >= 1000) return `$${(k / 1000).toFixed(k % 1000 === 0 ? 0 : 1)}M`;
  return `$${k}K`;
}

// ── Pathway selector pills ────────────────────────────────────────────────────

type BenchPathway = '510k' | 'pma' | 'denovo' | 'exempt';
const BENCH_PATHWAYS: Array<{ key: BenchPathway; label: string }> = [
  { key: 'exempt', label: 'Exempt' },
  { key: '510k',   label: '510(k)' },
  { key: 'denovo', label: 'De Novo' },
  { key: 'pma',    label: 'PMA' },
];

function PathwayPills({
  value,
  onChange,
}: {
  value: BenchPathway;
  onChange: (p: BenchPathway) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {BENCH_PATHWAYS.map(p => {
        const active = p.key === value;
        const color = PATHWAY_META[p.key as RegulatoryPathway]?.color ?? ACCENT;
        return (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            style={{
              padding: '5px 14px',
              border: active ? `1px solid ${color}88` : '1px solid var(--line)',
              borderRadius: 4,
              background: active ? `${color}18` : 'transparent',
              color: active ? color : 'var(--text-3)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Inner tab 1: Review Performance ──────────────────────────────────────────

function ReviewPerformanceTab({
  pathway,
  state,
}: {
  pathway: BenchPathway;
  state: BiodesignState;
}) {
  const [simDate, setSimDate] = useState('');
  const perf = MDUFA_PERFORMANCE[pathway] ?? MDUFA_PERFORMANCE['510k'];

  // Clock simulation
  function addDays(base: string, days: number): string {
    if (!base) return '';
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Project Q-Sub lookup
  const hasSubmittedQSub = state.preSubmission?.meetings?.some(m => !!m.submittedDate) ?? false;
  const earliestSubmit = state.preSubmission?.meetings
    ?.filter(m => !!m.submittedDate)
    ?.map(m => m.submittedDate)
    ?.sort()[0];

  const projectDaysElapsed = earliestSubmit
    ? Math.floor((Date.now() - new Date(earliestSubmit).getTime()) / 86400000)
    : null;

  const scoreCards: Array<{ label: string; value: string; sub?: string; color?: string }> = [
    { label: 'MDUFA V Goal', value: perf.goalDesc },
    {
      label: 'Actual Performance (2024)',
      value: `${perf.actual2024}%`,
      sub: perf.actual2024 >= 85 ? 'Meeting goal' : perf.actual2024 >= 70 ? 'Near goal' : 'Below goal',
      color: perfColor(perf.actual2024),
    },
    { label: 'Median Days to Decision', value: `${perf.medianDays} days` },
    {
      label: '90th Percentile',
      value: `${perf.p90Days} days`,
      sub: 'Worst-case benchmark',
      color: 'var(--text-3)',
    },
    { label: 'Total 2024 Submissions', value: perf.totalSubmissions2024.toLocaleString(), sub: 'Market activity indicator' },
  ];

  if (perf.aiRequestRate !== undefined) {
    scoreCards.push({
      label: 'AI Request Rate',
      value: `${perf.aiRequestRate}%`,
      sub: '~1 in 4 submissions receive an Additional Information request, tolling the clock',
      color: '#E8A852',
    });
  }
  if (perf.refuseToAcceptRate !== undefined) {
    scoreCards.push({
      label: 'Refuse to Accept Rate',
      value: `${perf.refuseToAcceptRate}%`,
      sub: 'Submissions rejected at intake',
      color: '#E87252',
    });
  }
  if (perf.majorDeficiencyRate !== undefined) {
    scoreCards.push({
      label: 'Major Deficiency Rate',
      value: `${perf.majorDeficiencyRate}%`,
      sub: 'Submissions receiving major deficiency letter; adds ~90 days',
      color: '#E87252',
    });
  }
  if (perf.panelRate !== undefined) {
    scoreCards.push({
      label: 'Advisory Panel Rate',
      value: `${perf.panelRate}%`,
      sub: 'Require advisory panel review; adds 60–120 days',
      color: '#E8A852',
    });
  }
  if (perf.conditionalApprovalRate !== undefined) {
    scoreCards.push({
      label: 'Conditional Approval Rate',
      value: `${perf.conditionalApprovalRate}%`,
      sub: 'IDEs approved with conditions attached',
      color: '#E8A852',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* MDUFA V Scorecard */}
      <div>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>MDUFA V Scorecard — {pathway.toUpperCase()}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {scoreCards.map((card, i) => (
            <div key={i} style={statCard}>
              <div style={{ ...monoLabel, marginBottom: 8 }}>{card.label}</div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: i < 2 ? 18 : 28,
                fontWeight: 700,
                color: card.color ?? 'var(--text)',
                lineHeight: 1.1,
                marginBottom: card.sub ? 6 : 0,
              }}>
                {card.value}
              </div>
              {card.sub && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>{card.sub}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance bar */}
      <div style={statCard}>
        <div style={{ ...monoLabel, marginBottom: 12 }}>Goal attainment — {perf.actual2024}% of {perf.goal}% target</div>
        <div style={{ position: 'relative', height: 8, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
          {/* Goal marker */}
          <div style={{
            position: 'absolute',
            left: `${perf.goal}%`,
            top: 0, bottom: 0,
            width: 1,
            background: 'rgba(255,255,255,0.15)',
            zIndex: 2,
          }} />
          {/* Actual fill */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${perf.actual2024}%`,
            background: `linear-gradient(90deg, ${perfColor(perf.actual2024)}, ${perfColor(perf.actual2024)}aa)`,
            transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>0%</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>Goal: {perf.goal}%</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>100%</span>
        </div>
      </div>

      {/* Clock simulation */}
      <div style={statCard}>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>Clock Simulation</div>
        <div style={{ marginBottom: 14 }}>
          <div style={monoLabel}>Hypothetical Submission Date</div>
          <input
            type="date"
            value={simDate}
            onChange={e => setSimDate(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 2,
              padding: '7px 10px',
              color: 'var(--text)',
              fontSize: 13,
              fontFamily: 'var(--sans)',
              outline: 'none',
              colorScheme: 'dark',
              width: 180,
            }}
          />
        </div>
        {simDate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Acceptance Decision', days: 15, note: 'RTA review complete' },
              { label: 'Median Decision (50th pct)', days: perf.medianDays, note: `${perf.medianDays} day MDUFA target` },
              { label: 'Worst-Case Decision (90th pct)', days: perf.p90Days, note: 'With AI request buffer' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px',
                background: 'var(--surface-2)',
                borderRadius: 2,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.note}</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: ACCENT, textAlign: 'right' }}>
                  {addDays(simDate, row.days)}
                </div>
              </div>
            ))}
          </div>
        )}
        {!simDate && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textAlign: 'center', padding: '12px 0' }}>
            Enter a submission date to project key milestones
          </div>
        )}
      </div>

      {/* Project position */}
      {hasSubmittedQSub && projectDaysElapsed !== null && (
        <div style={{
          ...statCard,
          background: 'rgba(82,232,180,0.05)',
          borderColor: 'rgba(82,232,180,0.2)',
        }}>
          <div style={{ ...monoLabel, color: '#52E8B4', marginBottom: 10 }}>Your Project vs. Benchmark</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: '#52E8B4', lineHeight: 1 }}>
                Day {projectDaysElapsed}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.6 }}>
                Since first Q-Sub submission
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  left: `${Math.min((projectDaysElapsed / perf.p90Days) * 100, 100)}%`,
                  top: -2, bottom: -2, width: 2,
                  background: '#52E8B4',
                }} />
                <div style={{
                  position: 'absolute',
                  left: `${(perf.medianDays / perf.p90Days) * 100}%`,
                  top: 0, bottom: 0, width: 1,
                  background: 'rgba(255,255,255,0.2)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>Median: Day {perf.medianDays}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>P90: Day {perf.p90Days}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inner tab 2: Time to Market ───────────────────────────────────────────────

function TimeToMarketTab({ pathway }: { pathway: BenchPathway }) {
  const tb = TIMELINE_BENCHMARKS[pathway];
  const drivers = TIME_DRIVERS[pathway] ?? TIME_DRIVERS['tbd'];
  const maxMonths = Math.max(
    TIMELINE_BENCHMARKS['pma'].p75Months,
    1
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Timeline comparison bars */}
      <div>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>Timeline Percentiles — All Pathways</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(['exempt', '510k', 'denovo', 'pma'] as const).map(pw => {
            const t = TIMELINE_BENCHMARKS[pw];
            const color = PATHWAY_META[pw as RegulatoryPathway]?.color ?? ACCENT;
            const isSelected = pw === pathway;
            return (
              <div key={pw} style={{
                background: isSelected ? `${color}08` : 'transparent',
                border: isSelected ? `1px solid ${color}22` : '1px solid transparent',
                borderRadius: 2,
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: isSelected ? color : 'var(--text-3)',
                    minWidth: 60,
                  }}>
                    {PATHWAY_META[pw as RegulatoryPathway]?.label ?? pw}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                    {/* P25 bar */}
                    <div style={{
                      position: 'absolute', left: 0, height: 6,
                      width: `${(t.p25Months / maxMonths) * 100}%`,
                      background: `${color}33`,
                      borderRadius: 1,
                    }} />
                    {/* Median bar */}
                    <div style={{
                      position: 'absolute', left: 0, height: 10,
                      width: `${(t.p50Months / maxMonths) * 100}%`,
                      background: `${color}66`,
                      borderRadius: 1,
                    }} />
                    {/* P75 bar */}
                    <div style={{
                      position: 'absolute', left: 0, height: 6, top: 7,
                      width: `${(t.p75Months / maxMonths) * 100}%`,
                      background: `${color}33`,
                      borderRadius: 1,
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, minWidth: 200 }}>
                    {[
                      { label: 'P25', val: t.p25Months },
                      { label: 'Median', val: t.p50Months },
                      { label: 'P75', val: t.p75Months },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: isSelected ? color : 'var(--text-2)' }}>
                          {stat.val}mo
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>
                        {t.quickestMonths}mo
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Best
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingLeft: 70 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 1 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)' }}>P25/P75</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 1 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)' }}>Median</span>
          </span>
        </div>
      </div>

      {/* Phase breakdown table */}
      <div>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>
          Phase Breakdown — {PATHWAY_META[pathway as RegulatoryPathway]?.label ?? pathway}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tb.phases.map((ph, i) => {
            const color = PATHWAY_META[pathway as RegulatoryPathway]?.color ?? ACCENT;
            // Extract max months from range string for bar sizing
            const rangeMatch = ph.months.match(/(\d+)/g);
            const maxPhaseMo = rangeMatch ? parseInt(rangeMatch[rangeMatch.length - 1]) : 1;
            const barWidth = Math.min((maxPhaseMo / 24) * 100, 100);
            return (
              <div key={i} style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 2,
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'start',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{ph.phase}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{ph.note}</div>
                  <div style={{ marginTop: 8, height: 3, background: 'var(--surface-2)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}88)`,
                      borderRadius: 1,
                    }} />
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: color,
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}>
                  {ph.months} mo
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key time drivers */}
      <div style={statCard}>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>Key Time Drivers for {PATHWAY_META[pathway as RegulatoryPathway]?.label ?? pathway}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drivers.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color: ACCENT, fontFamily: 'var(--mono)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>—</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inner tab 3: Success Rates ────────────────────────────────────────────────

function SuccessRatesTab({
  pathway,
  state,
}: {
  pathway: BenchPathway;
  state: BiodesignState;
}) {
  const sr = SUCCESS_RATES[pathway];

  // Risk profile analysis
  const riskFlags: Array<{ risk: string; advice: string }> = [];

  if (pathway === '510k') {
    const hasPredicate = !!(state.regulatory?.predicateDevice || state.regulatory?.predicateNumber);
    if (!hasPredicate) {
      riskFlags.push({
        risk: 'No predicate device identified',
        advice: 'Risk: Substantial equivalence argument may be challenging — identify a predicate early and confirm FDA concurrence via Q-Sub.',
      });
    }
    const hasBenchTesting = state.milestones?.some(m =>
      m.title.toLowerCase().includes('test') || m.title.toLowerCase().includes('bench')
    );
    if (!hasBenchTesting) {
      riskFlags.push({
        risk: 'No bench testing milestone found',
        advice: 'Risk: Testing completeness is the most commonly cited issue in AI requests — plan testing milestones explicitly.',
      });
    }
    const hasPreSub = state.preSubmission?.meetings?.some(m =>
      m.type === 'pre-510k' || m.type === 'q-sub'
    );
    if (!hasPreSub) {
      riskFlags.push({
        risk: 'No Q-Sub meeting planned',
        advice: 'Consider: Pre-510(k) Q-Sub reduces review risk by ~30% — plan one 6–12 months before submission.',
      });
    }
  }

  if (pathway === 'pma') {
    const hasClinicalPlan = !!(state.clinical?.primaryEndpoint || state.clinical?.studyDesign);
    if (!hasClinicalPlan) {
      riskFlags.push({
        risk: 'No clinical plan defined',
        advice: 'Risk: Clinical evidence gaps are the #1 reason for PMA major deficiency letters — define your primary endpoint and study design early.',
      });
    }
    const hasIDE = state.preSubmission?.meetings?.some(m => m.type === 'pre-ide');
    if (!hasIDE) {
      riskFlags.push({
        risk: 'No pre-IDE meeting planned',
        advice: 'Risk: Trial design errors discovered late add 24+ months — get FDA concurrence on your protocol before enrolling.',
      });
    }
  }

  if (pathway === 'denovo') {
    const hasSpecialControls = (state.regulatory?.specialControls?.length ?? 0) > 0;
    if (!hasSpecialControls) {
      riskFlags.push({
        risk: 'No special controls defined',
        advice: 'Risk: Incomplete special controls rationale is the top De Novo rejection reason — define proposed special controls and how they mitigate each risk.',
      });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Clearance rate gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
        <div style={{ ...statCard, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '28px 18px' }}>
          <div style={{ ...monoLabel, marginBottom: 14, textAlign: 'center' }}>Clearance Rate</div>
          <div style={{
            width: 100, height: 100,
            borderRadius: '50%',
            border: `8px solid ${perfColor(sr.clearanceRate)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${perfColor(sr.clearanceRate)}10`,
            boxShadow: `0 0 24px ${perfColor(sr.clearanceRate)}33`,
            marginBottom: 14,
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              fontWeight: 800,
              color: perfColor(sr.clearanceRate),
              lineHeight: 1,
            }}>
              {sr.clearanceRate}%
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6, maxWidth: 180 }}>
            Of accepted {PATHWAY_META[pathway as RegulatoryPathway]?.label ?? pathway} submissions that receive clearance
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            sr.aiRequestRate !== undefined && { label: 'AI Request Rate', value: `${sr.aiRequestRate}%`, color: '#E8A852', note: 'Clock-tolling info requests' },
            sr.rtaRate !== undefined && { label: 'RTA Rate', value: `${sr.rtaRate}%`, color: '#E87252', note: 'Refused to accept at intake' },
            sr.majorDeficiencyRate !== undefined && { label: 'Major Deficiency Rate', value: `${sr.majorDeficiencyRate}%`, color: '#E87252', note: 'Adds ~90 days per round' },
            sr.panelRate !== undefined && { label: 'Advisory Panel Rate', value: `${sr.panelRate}%`, color: '#E8A852', note: 'Adds 60–120 days' },
          ].filter(Boolean).map((card, i) => {
            if (!card) return null;
            return (
              <div key={i} style={statCard}>
                <div style={{ ...monoLabel, marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: card.color, lineHeight: 1, marginBottom: 4 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{card.note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection reasons chart */}
      {sr.topRejectionReasons.length > 0 && (
        <div>
          <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>Top Deficiency / Rejection Reasons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sr.topRejectionReasons.map((r, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.reason}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#E87252' }}>{r.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${r.pct}%`,
                    background: `linear-gradient(90deg, #E87252, #E87252aa)`,
                    borderRadius: 1,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk profile */}
      {riskFlags.length > 0 && (
        <div>
          <div style={{ ...monoLabel, color: '#E8A852', marginBottom: 14 }}>Your Risk Profile</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {riskFlags.map((flag, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                background: 'rgba(232,168,82,0.06)',
                border: '1px solid rgba(232,168,82,0.25)',
                borderRadius: 2,
                borderLeft: '3px solid #E8A852',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#E8A852', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                  {flag.risk}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>{flag.advice}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskFlags.length === 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(82,232,180,0.05)',
          border: '1px solid rgba(82,232,180,0.2)',
          borderRadius: 2,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#52E8B4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            No immediate risk flags
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Continue populating your project data to receive more specific risk analysis.
          </div>
        </div>
      )}

      {/* Breakthrough impact */}
      <div style={statCard}>
        <div style={{ ...monoLabel, marginBottom: 8 }}>Breakthrough Device Designation Impact</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{sr.breakthroughImpact}</div>
      </div>
    </div>
  );
}

// ── Inner tab 4: Cost Benchmarks ─────────────────────────────────────────────

function CostBenchmarksTab({ pathway }: { pathway: BenchPathway }) {
  const cb = COST_BENCHMARKS[pathway];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Cost range display */}
      <div style={statCard}>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 18 }}>Development Cost Range — {PATHWAY_META[pathway as RegulatoryPathway]?.label ?? pathway}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ ...monoLabel, marginBottom: 4 }}>25th Percentile</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-3)' }}>
              {fmtCost(cb.p25k)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...monoLabel, marginBottom: 4 }}>Median</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, color: ACCENT, lineHeight: 1 }}>
              {fmtCost(cb.p50k)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...monoLabel, marginBottom: 4 }}>75th Percentile</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-3)' }}>
              {fmtCost(cb.p75k)}
            </div>
          </div>
        </div>
        {/* Graduated scale bar */}
        <div style={{ position: 'relative', height: 12, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: '100%',
            background: `linear-gradient(90deg, ${ACCENT}44, ${ACCENT}cc, ${ACCENT}44)`,
          }} />
          {/* P25 marker */}
          <div style={{
            position: 'absolute',
            left: `${(cb.p25k / cb.p75k) * 100}%`,
            top: 0, bottom: 0, width: 2,
            background: 'rgba(255,255,255,0.4)',
          }} />
          {/* Median marker */}
          <div style={{
            position: 'absolute',
            left: `${(cb.p50k / cb.p75k) * 100}%`,
            top: 0, bottom: 0, width: 2,
            background: '#fff',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{fmtCost(cb.p25k)} (P25)</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{fmtCost(cb.p50k)} (median)</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{fmtCost(cb.p75k)} (P75)</span>
        </div>
      </div>

      {/* Category breakdown stacked bar */}
      <div>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>Cost Category Breakdown</div>
        {/* Stacked horizontal bar */}
        <div style={{ display: 'flex', height: 28, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
          {cb.breakdown.map((cat, i) => (
            <div
              key={cat.category}
              title={`${cat.category}: ${cat.pct}%`}
              style={{
                width: `${cat.pct}%`,
                background: CAT_COLORS[i % CAT_COLORS.length],
                opacity: 0.85,
                transition: 'opacity 0.15s',
                cursor: 'default',
              }}
            />
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {cb.breakdown.map((cat, i) => (
            <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 1, background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cat.category}
              </span>
            </div>
          ))}
        </div>
        {/* Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {cb.breakdown.map((cat, i) => (
            <div key={cat.category} style={{
              display: 'grid',
              gridTemplateColumns: '12px 1fr 40px',
              gap: 10,
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--surface-1)',
              border: '1px solid var(--line)',
              borderRadius: 2,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 1, background: CAT_COLORS[i % CAT_COLORS.length] }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{cat.category}</div>
                {cat.note && <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{cat.note}</div>}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: CAT_COLORS[i % CAT_COLORS.length], textAlign: 'right' }}>
                {cat.pct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pathway cost comparison */}
      <div>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 14 }}>Pathway Cost Comparison</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {(['exempt', '510k', 'denovo', 'pma'] as const).map(pw => {
            const c = COST_BENCHMARKS[pw];
            const color = PATHWAY_META[pw as RegulatoryPathway]?.color ?? ACCENT;
            const isSelected = pw === pathway;
            return (
              <div key={pw} style={{
                ...statCard,
                borderColor: isSelected ? `${color}55` : 'var(--line)',
                background: isSelected ? `${color}08` : 'var(--surface-1)',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: isSelected ? color : 'var(--text-3)',
                  marginBottom: 8,
                }}>
                  {PATHWAY_META[pw as RegulatoryPathway]?.label ?? pw}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: isSelected ? color : 'var(--text-2)', lineHeight: 1, marginBottom: 6 }}>
                  {fmtCost(c.p50k)}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>
                  {fmtCost(c.p25k)} – {fmtCost(c.p75k)}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'rgba(232,168,82,0.05)',
          border: '1px solid rgba(232,168,82,0.15)',
          borderRadius: 2,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            PMA development costs are approximately {Math.round(COST_BENCHMARKS['pma'].p50k / COST_BENCHMARKS['510k'].p50k)}x higher than 510(k), driven primarily by clinical trial expenses which represent ~55% of total PMA cost.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inner tab bar ─────────────────────────────────────────────────────────────

type BenchInnerTab = 'review' | 'timeline' | 'success' | 'cost';

const BENCH_INNER_TABS: Array<{ key: BenchInnerTab; label: string }> = [
  { key: 'review',   label: 'Review Performance' },
  { key: 'timeline', label: 'Time to Market' },
  { key: 'success',  label: 'Success Rates' },
  { key: 'cost',     label: 'Cost Benchmarks' },
];

// ── Main export ───────────────────────────────────────────────────────────────

export function BenchmarksTab({
  state,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const statePathway = state.regulatory?.pathway;
  const defaultPathway: BenchPathway =
    statePathway === '510k' || statePathway === 'pma' || statePathway === 'denovo' || statePathway === 'exempt'
      ? statePathway
      : '510k';

  const [innerTab, setInnerTab] = useState<BenchInnerTab>('review');
  const [pathway, setPathway] = useState<BenchPathway>(defaultPathway);

  const perf = MDUFA_PERFORMANCE[pathway] ?? MDUFA_PERFORMANCE['510k'];
  const tb = TIMELINE_BENCHMARKS[pathway];
  const sr = SUCCESS_RATES[pathway];
  const cb = COST_BENCHMARKS[pathway];

  const heroStats = [
    { label: 'Pathway', value: PATHWAY_META[pathway as RegulatoryPathway]?.label ?? pathway },
    { label: 'Median Timeline', value: `${tb.p50Months} months` },
    { label: 'Median Dev Cost', value: fmtCost(cb.p50k) },
    { label: 'Clearance Rate', value: `${sr.clearanceRate}%` },
    { label: 'Median Review', value: `${perf.medianDays} days` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 0, minHeight: 172, flexShrink: 0 }}>
        <FlowCanvas accent={ACCENT} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px 24px' }}>
          <div style={{ ...monoLabel, color: ACCENT, fontSize: 9, marginBottom: 10 }}>
            Benchmarks — MDUFA V + Industry Data
          </div>
          <h2 style={{
            margin: '0 0 6px',
            fontSize: 26, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.025em', lineHeight: 1.15,
          }}>
            Development Benchmarks
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 460 }}>
            How your project compares to industry standards — calibrated to your pathway.
          </p>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 18 }}>
            {heroStats.map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(232,168,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Pathway selector */}
          <PathwayPills value={pathway} onChange={setPathway} />
        </div>
      </div>

      {/* Inner tab bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--line)',
        marginBottom: 24,
        flexShrink: 0,
      }}>
        {BENCH_INNER_TABS.map(tab => {
          const isActive = innerTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setInnerTab(tab.key)}
              style={{
                padding: '10px 18px',
                borderRadius: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? ACCENT : 'var(--text-3)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                transition: 'all 0.15s',
                marginBottom: -1,
                whiteSpace: 'nowrap' as const,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
        {innerTab === 'review' && (
          <ReviewPerformanceTab pathway={pathway} state={state} />
        )}
        {innerTab === 'timeline' && (
          <TimeToMarketTab pathway={pathway} />
        )}
        {innerTab === 'success' && (
          <SuccessRatesTab pathway={pathway} state={state} />
        )}
        {innerTab === 'cost' && (
          <CostBenchmarksTab pathway={pathway} />
        )}
      </div>
    </div>
  );
}
