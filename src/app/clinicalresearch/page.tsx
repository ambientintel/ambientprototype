'use client';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SparkCanvas } from './sparkbg';
import './clinicalresearch.css';

// ── Static data ───────────────────────────────────────────────────────────────

const IRB_TYPES = [
  { abbr: 'FBR',   name: 'Full Board Review',          color: '#10B981', count: 1240, pct: 22, turnaround: '~14 days', delay: '0s',   dur: '3.2s' },
  { abbr: 'EXP',   name: 'Expedited Review',           color: '#06B6D4', count: 3820, pct: 68, turnaround: '~7 days',  delay: '0.6s', dur: '2.8s' },
  { abbr: 'EXMPT', name: 'Exempt Research',            color: '#8B5CF6', count: 5640, pct: 100,turnaround: '~3 days',  delay: '1.2s', dur: '3.5s' },
  { abbr: 'CR',    name: 'Continuing Review',          color: '#F59E0B', count: 2180, pct: 39, turnaround: '~10 days', delay: '1.8s', dur: '2.9s' },
  { abbr: 'AMD',   name: 'Protocol Amendment',         color: '#10B981', count: 4320, pct: 77, turnaround: '~5 days',  delay: '0.4s', dur: '3.1s' },
  { abbr: 'AE',    name: 'Adverse Event Report',       color: '#F43F5E', count: 892,  pct: 16, turnaround: '~3 days',  delay: '1.0s', dur: '2.6s' },
  { abbr: 'DSMB',  name: 'Data Safety Monitoring',    color: '#06B6D4', count: 318,  pct: 6,  turnaround: '~21 days', delay: '1.6s', dur: '3.8s' },
  { abbr: 'sIRB',  name: 'Single IRB (NIH Policy)',   color: '#8B5CF6', count: 1560, pct: 28, turnaround: '~21 days', delay: '2.2s', dur: '3.3s' },
];

const PHASE_CHIPS = [
  'All', 'Phase I', 'Phase II', 'Phase III', 'Phase IV',
  'Observational', 'Device', 'Drug', 'Biologics', 'Behavioral', 'Registry', 'Adaptive',
];

const CHIP_COLORS: Record<string, { color: string; bg: string }> = {
  'All':          { color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  'Phase I':      { color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  'Phase II':     { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'   },
  'Phase III':    { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  'Phase IV':     { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  'Observational':{ color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  'Device':       { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'   },
  'Drug':         { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  'Biologics':    { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  'Behavioral':   { color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  'Registry':     { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'   },
  'Adaptive':     { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)'   },
};

// First item becomes the hero card; rest go in the sub-grid
const FEATURED = [
  {
    phase: 'Phase II', phaseColor: '#06B6D4', phaseBg: 'rgba(6,182,212,0.10)',
    title: 'SGLT2 Inhibitor for HFpEF: Double-Blind Placebo-Controlled RCT',
    desc: 'Evaluates empagliflozin 10 mg daily versus placebo in 340 patients with HFpEF (EF ≥ 50%). Primary endpoint: 6-minute walk distance at 24 weeks. Secondary endpoints: NT-proBNP, KCCQ-TSS, and composite HF hospitalization. Pre-IND meeting with FDA completed; Type B meeting minutes received.',
    irbType: 'Full Board Review',
    deadline: 'Sep 15, 2026', participants: 'N=340', duration: '24 weeks', sites: '18 sites',
    tags: ['RCT', 'HFpEF', 'SGLT2', 'Cardiology', 'FDA Type B'],
  },
  {
    phase: 'Observational', phaseColor: '#10B981', phaseBg: 'rgba(16,185,129,0.10)',
    title: 'Real-World AI Diagnostic Performance in Emergency Radiology',
    desc: 'Prospective cohort across 12 academic sites assessing sensitivity/specificity of FDA-cleared AI vs. radiologist reads for acute PE and intracranial hemorrhage.',
    irbType: 'Expedited Review',
    deadline: 'Rolling enrollment', participants: 'N=8,400', duration: '18 months', sites: '12 sites',
    tags: ['Radiology AI', 'SaMD', 'Real-World', 'Multi-site'],
  },
  {
    phase: 'Phase I', phaseColor: '#10B981', phaseBg: 'rgba(16,185,129,0.10)',
    title: 'First-in-Human CAR-T Cell Therapy in Microsatellite-Stable Colorectal Cancer',
    desc: '3+3 dose-escalation with 28-day DLT window. IND filed under 21 CFR 312. Concurrent EU CTR bridging strategy under EMA/CAT review.',
    irbType: 'Full Board Review',
    deadline: 'Aug 1, 2026', participants: 'N=18–24', duration: '12 mo / cohort', sites: '4 sites',
    tags: ['CAR-T', 'Oncology', 'IND', 'FIH', 'DSMB'],
  },
  {
    phase: 'Adaptive', phaseColor: '#F43F5E', phaseBg: 'rgba(244,63,94,0.10)',
    title: 'Seamless Phase II/III Platform Trial for Sepsis Adjunctive Therapies',
    desc: 'Master Protocol with 4 experimental arms; RAR with pre-specified interim analyses at 20%, 50%, and 75% enrollment. Approved SAP with FDA Type B minutes.',
    irbType: 'Full Board Review',
    deadline: 'Oct 30, 2026', participants: 'N≤1,600', duration: '36 months', sites: '32 sites',
    tags: ['Adaptive Design', 'Platform', 'Critical Care', 'RAR'],
  },
  {
    phase: 'Device', phaseColor: '#06B6D4', phaseBg: 'rgba(6,182,212,0.10)',
    title: 'Pivotal IDE: Closed-Loop Insulin Delivery in Pediatric Type 1 Diabetes',
    desc: 'Randomized 2:1 vs. standard-of-care CGM+pump. Primary endpoint: TIR at 26 weeks. Pediatric Study Plan accepted by FDA.',
    irbType: 'Full Board Review',
    deadline: 'Jul 12, 2026', participants: 'N=210', duration: '26 weeks', sites: '14 sites',
    tags: ['IDE', 'Closed-Loop', 'Pediatric', 'CGM', 'Pivotal'],
  },
  {
    phase: 'Registry', phaseColor: '#8B5CF6', phaseBg: 'rgba(139,92,246,0.10)',
    title: 'Natural History Registry: Rare Monogenic Pulmonary Fibrosis',
    desc: 'Longitudinal registry (SFTPC / ABCA3) collecting clinical, genomic, and PRO data across 20 rare disease centers. Data submitted to NCATS RDCA-DAP.',
    irbType: 'Expedited Review',
    deadline: 'Ongoing', participants: 'N≥500, 5 yrs', duration: '5 years', sites: '20 sites',
    tags: ['Rare Disease', 'Natural History', 'Genomics', 'PRO'],
  },
];

const REG_PATHWAYS = [
  {
    type: 'Drug / Biologic (IND)',
    color: '#10B981',
    steps: [
      { num: '01', label: 'Pre-IND\nMeeting',  time: '30-60 days'  },
      { num: '02', label: 'IND\nFiling',        time: '30 days'     },
      { num: '03', label: 'Phase I\nSafety',    time: '1-3 years'   },
      { num: '04', label: 'Phase II\nEfficacy', time: '2-4 years'   },
      { num: '05', label: 'Phase III\nPivotal', time: '3-5 years'   },
      { num: '06', label: 'NDA / BLA\nFiling',  time: '6-24 months' },
    ],
    terminal: '✓',
    terminalLabel: 'Approval',
  },
  {
    type: 'Medical Device (IDE / PMA)',
    color: '#06B6D4',
    steps: [
      { num: '01', label: 'Pre-Sub\nMeeting',   time: '45-90 days'  },
      { num: '02', label: 'IDE\nApproval',       time: '~90 days'    },
      { num: '03', label: 'Feasibility\nStudy',  time: '6-12 months' },
      { num: '04', label: 'Pivotal\nTrial',      time: '12-24 months'},
      { num: '05', label: 'PMA / 510(k)\nFiling','time': '6-12 months'},
    ],
    terminal: '✓',
    terminalLabel: 'Clearance',
  },
];

const DESIGN_BENTO = [
  {
    num: '8',
    label: 'Randomized Controlled Trials',
    desc: 'Parallel, crossover, factorial, and cluster-randomized designs with allocation concealment and blinding strategy templates.',
    count: '8 protocol templates',
    color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10H10M10 10H17M10 10V3M10 10V17" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="7.5" stroke="#10B981" strokeWidth="1.3"/></svg>,
  },
  {
    num: '6',
    label: 'Observational Studies',
    desc: 'Prospective cohort, retrospective cohort, case-control, cross-sectional, and nested case-control design frameworks with DAG templates.',
    count: '6 protocol templates',
    color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.5" stroke="#06B6D4" strokeWidth="1.4"/><path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#06B6D4" strokeWidth="1.3"/></svg>,
  },
  {
    num: '5',
    label: 'Adaptive & Platform',
    desc: 'Seamless Phase II/III, master protocol, RAR, and Bayesian adaptive design templates with SAP and DSMB charter frameworks.',
    count: '5 protocol templates',
    color: '#F43F5E', bg: 'rgba(244,63,94,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 16L6 9L11 13L16 4" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="4" r="1.8" fill="#F43F5E"/></svg>,
  },
  {
    num: '4',
    label: 'Device IDE Studies',
    desc: 'Pivotal and feasibility IDE study designs under 21 CFR 812, Breakthrough Device pathway templates, and PMA-track statistical analysis plans.',
    count: '4 protocol templates',
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="9" rx="2" stroke="#8B5CF6" strokeWidth="1.4"/><path d="M7 7V6C7 4.3 8 3 10 3C12 3 13 4.3 13 6V7" stroke="#8B5CF6" strokeWidth="1.4" strokeLinecap="round"/><circle cx="10" cy="11.5" r="1.8" fill="#8B5CF6"/></svg>,
  },
  {
    num: '7',
    label: 'First-in-Human / Phase I',
    desc: '3+3, mTPI-2, BOIN, and CRM dose-escalation templates. DLT criteria, DSMB charter templates, SUSAR reporting, and dose-response modeling frameworks.',
    count: '7 protocol templates',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2V10M10 2L7 5M10 2L13 5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10H15L13.5 17.5H6.5L5 10Z" stroke="#F59E0B" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  },
  {
    num: '4',
    label: 'Registries & Natural History',
    desc: 'Longitudinal registry design, CDASH/CDISC data standards, PRO instrument selection, RDCA-DAP submission templates, and site qualification checklists.',
    count: '4 protocol templates',
    color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="#10B981" strokeWidth="1.4"/><path d="M7 8H13M7 11.5H11" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudyResult {
  id: string; title: string; nctId: string; phase: string;
  status: string; sponsor: string; startDate: string;
  completionDate: string; enrollment: string; description: string;
  conditions: string[]; interventions: string[]; color: string; url: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'cr-search-icon'} width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="cr-skeleton">
      <div className="cr-skeleton-line" style={{ height: 14, width: '30%' }} />
      <div className="cr-skeleton-line" style={{ height: 18, width: '85%' }} />
      <div className="cr-skeleton-line" style={{ height: 14, width: '60%' }} />
      <div style={{ marginTop: 4, display: 'flex', gap: 12 }}>
        <div className="cr-skeleton-line" style={{ height: 32, flex: 1 }} />
        <div className="cr-skeleton-line" style={{ height: 32, flex: 1 }} />
        <div className="cr-skeleton-line" style={{ height: 32, flex: 1 }} />
      </div>
    </div>
  );
}

function ResultCard({ r }: { r: StudyResult }) {
  const bg     = r.color.replace(')', ',0.10)').replace('rgb', 'rgba');
  const border = r.color + '33';
  return (
    <a className="cr-result-card" href={r.url} target="_blank" rel="noopener noreferrer"
      style={{ ['--result-color' as string]: r.color }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span className="cr-phase-badge" style={{ color: r.color, background: bg, border: `1px solid ${border}` }}>
          {r.phase || 'N/A'}
        </span>
        {r.nctId && <span className="cr-result-number">{r.nctId}</span>}
      </div>
      <div className="cr-result-title">{r.title}</div>
      {r.description && <div className="cr-result-desc">{r.description}</div>}
      <div className="cr-result-meta">
        {r.status     && <div className="cr-result-meta-item"><span className="cr-result-meta-label">Status</span><span className="cr-result-meta-val" style={{ textTransform: 'capitalize' }}>{r.status}</span></div>}
        {r.enrollment && <div className="cr-result-meta-item"><span className="cr-result-meta-label">Enrollment</span><span className="cr-result-meta-val">{r.enrollment}</span></div>}
        {r.completionDate && <div className="cr-result-meta-item"><span className="cr-result-meta-label">Completion</span><span className="cr-result-meta-val is-deadline">{r.completionDate}</span></div>}
        {r.sponsor    && <div className="cr-result-meta-item"><span className="cr-result-meta-label">Sponsor</span><span className="cr-result-meta-val">{r.sponsor}</span></div>}
      </div>
    </a>
  );
}

function IrbPanel({ irb }: { irb: typeof IRB_TYPES[number] }) {
  return (
    <div className="cr-irb-panel"
      style={{
        ['--panel-color' as string]: irb.color,
        ['--sweep-delay' as string]: irb.delay,
        ['--sweep-dur'   as string]: irb.dur,
      }}>
      <div className="cr-irb-panel-accent" />
      <div className="cr-irb-panel-body">
        <div className="cr-irb-panel-top">
          <span className="cr-irb-panel-abbr">{irb.abbr}</span>
          <span className="cr-irb-panel-live">
            <span className="cr-irb-panel-live-dot" />
            Active
          </span>
        </div>
        <div className="cr-irb-panel-name">{irb.name}</div>
        <div className="cr-irb-panel-count">{irb.count.toLocaleString()}</div>
        <div className="cr-irb-panel-bar">
          <div className="cr-irb-panel-bar-fill" style={{ width: `${irb.pct}%` }} />
        </div>
        <div className="cr-irb-panel-footer">
          <span className="cr-irb-panel-footer-label">Avg turnaround</span>
          <span className="cr-irb-panel-turnaround">{irb.turnaround}</span>
        </div>
      </div>
    </div>
  );
}

function ProtoHeroCard({ proto }: { proto: typeof FEATURED[number] }) {
  return (
    <div className="cr-proto-hero" style={{ ['--hero-color' as string]: proto.phaseColor }}>
      <div className="cr-proto-hero-left">
        <div className="cr-proto-hero-header">
          <span className="cr-phase-badge" style={{ color: proto.phaseColor, background: proto.phaseBg, border: `1px solid ${proto.phaseColor}33` }}>
            {proto.phase}
          </span>
          <span className="cr-proto-hero-irb-badge">{proto.irbType}</span>
        </div>
        <div className="cr-proto-hero-title">{proto.title}</div>
        <div className="cr-proto-hero-desc">{proto.desc}</div>
        <div className="cr-proto-hero-tags">
          {proto.tags.map(t => <span key={t} className="cr-proto-hero-tag">{t}</span>)}
        </div>
      </div>
      <div className="cr-proto-hero-right">
        <div className="cr-proto-hero-meta-grid">
          <div className="cr-proto-hero-meta-item">
            <span className="cr-proto-hero-meta-label">Submission</span>
            <span className={`cr-proto-hero-meta-val${proto.deadline !== 'Rolling enrollment' && proto.deadline !== 'Ongoing' ? ' highlight' : ''}`}>{proto.deadline}</span>
          </div>
          <div className="cr-proto-hero-meta-item">
            <span className="cr-proto-hero-meta-label">Participants</span>
            <span className="cr-proto-hero-meta-val">{proto.participants}</span>
          </div>
          <div className="cr-proto-hero-meta-item">
            <span className="cr-proto-hero-meta-label">Duration</span>
            <span className="cr-proto-hero-meta-val">{proto.duration}</span>
          </div>
          <div className="cr-proto-hero-meta-item">
            <span className="cr-proto-hero-meta-label">Sites</span>
            <span className="cr-proto-hero-meta-val">{proto.sites}</span>
          </div>
        </div>
        <div className="cr-proto-hero-divider" />
        <div className="cr-proto-hero-irb-row">
          <span className="cr-proto-hero-irb-key">IRB Pathway</span>
          <span className="cr-proto-hero-irb-val">{proto.irbType}</span>
        </div>
      </div>
    </div>
  );
}

function ProtoCard({ proto }: { proto: typeof FEATURED[number] }) {
  return (
    <div className="cr-proto-card" style={{ ['--card-color' as string]: proto.phaseColor }}>
      <div className="cr-proto-card-stripe" />
      <div className="cr-proto-card-body">
        <div className="cr-proto-card-top">
          <span className="cr-phase-badge" style={{ color: proto.phaseColor, background: proto.phaseBg, border: `1px solid ${proto.phaseColor}33` }}>
            {proto.phase}
          </span>
          <span className="cr-proto-card-irb">{proto.irbType}</span>
        </div>
        <div className="cr-proto-card-title">{proto.title}</div>
        <div className="cr-proto-card-desc">{proto.desc}</div>
        <div className="cr-proto-card-tags">
          {proto.tags.map(t => <span key={t} className="cr-proto-card-tag">{t}</span>)}
        </div>
      </div>
      <div className="cr-proto-card-footer">
        <div className="cr-proto-card-stat">
          <span className="cr-proto-card-stat-label">Submission</span>
          <span className="cr-proto-card-stat-val">{proto.deadline}</span>
        </div>
        <div className="cr-proto-card-stat">
          <span className="cr-proto-card-stat-label">N</span>
          <span className="cr-proto-card-stat-val">{proto.participants}</span>
        </div>
        <div className="cr-proto-card-stat">
          <span className="cr-proto-card-stat-label">Sites</span>
          <span className="cr-proto-card-stat-val">{proto.sites}</span>
        </div>
      </div>
    </div>
  );
}

function RegulatoryPathways() {
  return (
    <div className="cr-reg-section">
      <div className="cr-reg-section-header">
        <div>
          <div className="cr-section-eyebrow">FDA / ICH Navigator</div>
          <div className="cr-reg-section-title">Regulatory Intelligence</div>
        </div>
        <span className="cr-reg-section-label">2 Pathways</span>
      </div>
      <div className="cr-reg-paths">
        {REG_PATHWAYS.map((path, pi) => (
          <div key={path.type}>
            <div className="cr-reg-path-header">
              <span className="cr-reg-path-type-badge" style={{ ['--path-color' as string]: path.color }}>
                {path.type}
              </span>
              <div className="cr-reg-path-rule" />
            </div>
            <div className="cr-reg-track">
              {path.steps.map((step, si) => (
                <div key={step.num} style={{ display: 'contents' }}>
                  <div className="cr-reg-step">
                    <div className="cr-reg-step-node" style={{ ['--node-color' as string]: path.color }}>
                      {step.num}
                    </div>
                    <div className="cr-reg-step-label" style={{ whiteSpace: 'pre-line' }}>{step.label}</div>
                    <div className="cr-reg-step-time">{step.time}</div>
                  </div>
                  <div
                    className="cr-reg-connector"
                    style={{
                      ['--connector-color' as string]: path.color,
                      ['--travel-delay'    as string]: `${si * 0.4 + pi * 0.2}s`,
                      ['--travel-dur'      as string]: '2.2s',
                    }}
                  />
                </div>
              ))}
              <div className="cr-reg-step">
                <div className="cr-reg-step-node is-terminal" style={{ ['--node-color' as string]: path.color }}>
                  {path.terminal}
                </div>
                <div className="cr-reg-step-label">{path.terminalLabel}</div>
                <div className="cr-reg-step-time">&nbsp;</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoCard({ cat }: { cat: typeof DESIGN_BENTO[number] }) {
  return (
    <div className="cr-bento-card" style={{ ['--bento-color' as string]: cat.color }}>
      <div className="cr-bento-icon">{cat.icon}</div>
      <div className="cr-bento-label">{cat.label}</div>
      <div className="cr-bento-desc">{cat.desc}</div>
      <div className="cr-bento-num">{cat.num}</div>
      <div className="cr-bento-footer">
        <span className="cr-bento-count">{cat.count}</span>
        <span className="cr-bento-arrow">→</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClinicalResearchPage() {
  const [selectedPhase, setSelectedPhase] = useState('All');
  const [query, setQuery]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [results, setResults]             = useState<StudyResult[]>([]);
  const [total, setTotal]                 = useState(0);
  const [error, setError]                 = useState('');
  const [hasSearched, setHasSearched]     = useState(false);
  const [lastQuery, setLastQuery]         = useState('');
  const inputRef                          = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string, phase: string) => {
    setLoading(true); setError(''); setHasSearched(true); setLastQuery(q);
    try {
      const res  = await fetch('/api/clinicalresearch/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, phase }),
      });
      const data = await res.json() as { studies: StudyResult[]; total: number; error?: string };
      if (data.error) setError(data.error);
      setResults(data.studies ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Network error. Please try again.'); setResults([]);
    } finally { setLoading(false); }
  }, []);

  const handleSearch  = useCallback(() => { runSearch(query, selectedPhase); }, [query, selectedPhase, runSearch]);
  const handleChip    = useCallback((chip: string) => { setSelectedPhase(chip); if (hasSearched) runSearch(query, chip); }, [hasSearched, query, runSearch]);
  const handleClear   = useCallback(() => { setHasSearched(false); setResults([]); setError(''); setQuery(''); setSelectedPhase('All'); inputRef.current?.focus(); }, []);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); }, [handleSearch]);

  const [heroProto, ...subProtos] = FEATURED;

  return (
    <div className="cr-root">

      {/* Nav */}
      <nav className="cr-nav">
        <Link href="/" className="cr-nav-brand">
          <span className="cr-nav-name">Ambient <em>Intelligence</em></span>
        </Link>
        <div className="cr-nav-links">
          <Link href="/digitalhealth"    className="cr-nav-link">Digital Health</Link>
          <Link href="/biodesign"        className="cr-nav-link">Biodesign</Link>
          <Link href="/accelerate"       className="cr-nav-link">Accelerate</Link>
          <Link href="/clinicalresearch" className="cr-nav-link active">Clinical Research</Link>
          <Link href="/invest"           className="cr-nav-link">Invest</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="cr-hero">
        <div className="cr-hero-bg" />
        <SparkCanvas />
        <div className="cr-hero-content">
          <div className="cr-hero-badge">
            <div className="cr-hero-badge-dot" />
            IRB &amp; Clinical Research Design
          </div>
          <h1 className="cr-hero-h1">
            Design research that<br /><em>advances the science</em>
          </h1>
          <p className="cr-hero-sub">
            Search ClinicalTrials.gov, build IRB-ready protocol templates, and navigate FDA
            regulatory pathways — all in one intelligent workspace.
          </p>
          <div className="cr-search-wrap">
            <SearchIcon />
            <input ref={inputRef} className="cr-search-box" type="text"
              placeholder="Search trials, conditions, interventions, sponsors…"
              value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
            <button className="cr-search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
          <div className="cr-phase-chips">
            {PHASE_CHIPS.map(chip => {
              const colors = CHIP_COLORS[chip] ?? CHIP_COLORS['All'];
              return (
                <button key={chip}
                  className={`cr-chip${selectedPhase === chip ? ' selected' : ''}`}
                  style={{ ['--chip-color' as string]: colors.color, ['--chip-bg' as string]: colors.bg }}
                  onClick={() => handleChip(chip)}>
                  <span className="cr-chip-dot" />{chip}
                </button>
              );
            })}
          </div>
        </div>
        <div className="cr-stats">
          {[
            { num: '15.2', sup: 'K', label: 'Active CT.gov Studies'  },
            { num: '47',   sup: '',  label: 'Protocol Templates'      },
            { num: '8',    sup: '',  label: 'Regulatory Pathways'     },
            { num: '21',   sup: '',  label: 'ICH / FDA Guidances'     },
            { num: '2.4',  sup: 'K', label: 'New Studies / Month'     },
          ].map(s => (
            <div className="cr-stat" key={s.label}>
              <span className="cr-stat-num">{s.num}<span>{s.sup}</span></span>
              <span className="cr-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main */}
      <main className="cr-main">

        {/* IRB Operational Panels */}
        <div className="cr-section-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="cr-section-eyebrow">Review Pathways</div>
            <h2 className="cr-section-title">IRB Review Types</h2>
          </div>
          <span className="cr-section-sub">8 active pathways</span>
        </div>
        <div className="cr-irb-panels">
          {IRB_TYPES.map(irb => <IrbPanel key={irb.abbr} irb={irb} />)}
        </div>

        {/* Featured Protocols or Search Results */}
        {hasSearched ? (
          <>
            <div className="cr-results-head">
              <div className="cr-results-count">
                {loading
                  ? 'Searching ClinicalTrials.gov…'
                  : error
                  ? <span style={{ color: 'var(--rose)' }}>{error}</span>
                  : <><strong>{total.toLocaleString()}</strong> {total === 1 ? 'study' : 'studies'} for &ldquo;{lastQuery || selectedPhase}&rdquo;</>
                }
              </div>
              <button className="cr-clear-btn" onClick={handleClear}>✕ Clear search</button>
            </div>
            <div className="cr-results-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : results.length > 0
                ? results.map(r => <ResultCard key={r.id || r.title} r={r} />)
                : (
                  <div className="cr-empty">
                    <SearchIcon className={undefined} />
                    <div className="cr-empty-title">No studies found</div>
                    <div className="cr-empty-sub">Try different keywords or adjust the phase filter. You can also search directly on ClinicalTrials.gov.</div>
                    <a href="https://clinicaltrials.gov/search" target="_blank" rel="noopener noreferrer" className="cr-btn-secondary" style={{ marginTop: 8, textDecoration: 'none' }}>Browse ClinicalTrials.gov →</a>
                  </div>
                )
              }
            </div>
          </>
        ) : (
          <>
            <div className="cr-section-head" style={{ marginBottom: 20 }}>
              <div>
                <div className="cr-section-eyebrow">May 2026 Selection</div>
                <h2 className="cr-section-title">Featured Protocols</h2>
              </div>
              <span className="cr-section-sub">6 curated studies</span>
            </div>
            <ProtoHeroCard proto={heroProto} />
            <div className="cr-protos-grid">
              {subProtos.map(p => <ProtoCard key={p.title} proto={p} />)}
            </div>
          </>
        )}

        {/* Regulatory Intelligence */}
        <div className="cr-section-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="cr-section-eyebrow">Drug · Biologic · Device</div>
            <h2 className="cr-section-title">Regulatory Pathways</h2>
          </div>
          <span className="cr-section-sub">FDA / ICH navigator</span>
        </div>
        <RegulatoryPathways />

        {/* Study Design Bento */}
        <div className="cr-section-head" style={{ marginBottom: 20 }}>
          <div>
            <div className="cr-section-eyebrow">34 Templates Total</div>
            <h2 className="cr-section-title">By Study Design</h2>
          </div>
          <span className="cr-section-sub">6 design categories</span>
        </div>
        <div className="cr-bento">
          {DESIGN_BENTO.map((cat, i) => (
            <div key={cat.label} className="cr-bento-item">
              <BentoCard cat={cat} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cr-cta">
          <div className="cr-cta-bg" />
          <div className="cr-cta-grid" />
          <div className="cr-cta-glow-1" />
          <div className="cr-cta-glow-2" />
          <div className="cr-cta-inner">
            <div className="cr-cta-left">
              <div className="cr-cta-eyebrow">Research Intelligence Platform</div>
              <h2 className="cr-cta-h2">Ready to <em>design</em><br />your study?</h2>
              <div className="cr-cta-benefits">
                <div className="cr-cta-benefit">
                  <div className="cr-cta-benefit-num">47</div>
                  <div className="cr-cta-benefit-title">IRB Templates</div>
                  <div className="cr-cta-benefit-desc">Pre-built, IRB-ready protocol templates for every study design and review type.</div>
                </div>
                <div className="cr-cta-benefit">
                  <div className="cr-cta-benefit-num">8</div>
                  <div className="cr-cta-benefit-title">FDA Pathways</div>
                  <div className="cr-cta-benefit-desc">Interactive regulatory navigator covering IND, IDE, BLA, NDA, 510(k), and PMA tracks.</div>
                </div>
                <div className="cr-cta-benefit">
                  <div className="cr-cta-benefit-num">21</div>
                  <div className="cr-cta-benefit-title">ICH Guidances</div>
                  <div className="cr-cta-benefit-desc">Embedded ICH E6, E8, E9, E10 guidance mapped directly to your protocol sections.</div>
                </div>
              </div>
            </div>
            <div className="cr-cta-right">
              <Link href="/clinicalresearch/app" className="cr-btn-primary">Launch Workspace →</Link>
              <button className="cr-btn-secondary">View Templates</button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="cr-footer">
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
          Ambient Intelligence — Clinical Research
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
          Live data · ClinicalTrials.gov API
        </span>
      </footer>
    </div>
  );
}
