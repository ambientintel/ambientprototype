'use client';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SparkCanvas } from './sparkbg';
import './clinicalresearch.css';

// ── Static data ───────────────────────────────────────────────────────────────

const IRB_TYPES = [
  { abbr: 'FBR',   name: 'Full Board Review',             color: '#10B981', count: 1240, turnaround: '~14 days' },
  { abbr: 'EXP',   name: 'Expedited Review',              color: '#06B6D4', count: 3820, turnaround: '~7 days'  },
  { abbr: 'EXMPT', name: 'Exempt Research',               color: '#8B5CF6', count: 5640, turnaround: '~3 days'  },
  { abbr: 'CR',    name: 'Continuing Review',             color: '#F59E0B', count: 2180, turnaround: '~10 days' },
  { abbr: 'AMD',   name: 'Protocol Amendment',            color: '#10B981', count: 4320, turnaround: '~5 days'  },
  { abbr: 'AE',    name: 'Adverse Event Report',          color: '#F43F5E', count: 892,  turnaround: '~3 days'  },
  { abbr: 'DSMB',  name: 'Data Safety Monitoring',        color: '#06B6D4', count: 318,  turnaround: '~21 days' },
  { abbr: 'sIRB',  name: 'Single IRB (NIH Policy)',       color: '#8B5CF6', count: 1560, turnaround: '~21 days' },
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

const FEATURED = [
  {
    phase: 'Phase II', phaseColor: '#06B6D4', phaseBg: 'rgba(6,182,212,0.10)',
    title: 'SGLT2 Inhibitor for HFpEF: Double-Blind Placebo-Controlled RCT',
    desc: 'Evaluates empagliflozin in patients with HFpEF. Primary endpoint: 6-minute walk distance at 24 weeks. Pre-IND meeting with FDA completed.',
    irbType: 'Full Board Review',
    deadline: 'Sep 15, 2026', participants: 'N=340', duration: '24 weeks',
    tags: ['RCT', 'HFpEF', 'SGLT2', 'Cardiology'],
  },
  {
    phase: 'Observational', phaseColor: '#10B981', phaseBg: 'rgba(16,185,129,0.10)',
    title: 'Real-World Performance of AI Diagnostic Algorithms in Emergency Radiology',
    desc: 'Prospective cohort study across 12 academic sites assessing sensitivity/specificity of FDA-cleared AI versus radiologist reads for acute PE and intracranial hemorrhage.',
    irbType: 'Expedited Review',
    deadline: 'Rolling enrollment', participants: 'N=8,400', duration: '18 months',
    tags: ['Radiology AI', 'SaMD', 'Real-World Evidence', 'Multi-site'],
  },
  {
    phase: 'Phase I', phaseColor: '#10B981', phaseBg: 'rgba(16,185,129,0.10)',
    title: 'First-in-Human CAR-T Cell Therapy in Microsatellite-Stable Colorectal Cancer',
    desc: '3+3 dose-escalation design with DLT window of 28 days. DSMB oversight required. IND filed under 21 CFR 312. Bridging strategy for EU CTR concurrent submission.',
    irbType: 'Full Board Review',
    deadline: 'Aug 1, 2026', participants: 'N=18–24 (escalation)', duration: '12 months per cohort',
    tags: ['CAR-T', 'Oncology', 'IND', 'FIH', 'DSMB'],
  },
  {
    phase: 'Adaptive', phaseColor: '#F43F5E', phaseBg: 'rgba(244,63,94,0.10)',
    title: 'Seamless Phase II/III Adaptive Platform Trial for Sepsis Adjunctive Therapies',
    desc: 'Master Protocol with 4 experimental arms; RAR with pre-specified interim analyses at 20%, 50%, and 75% enrollment. Approved SAP with FDA Type B meeting.',
    irbType: 'Full Board Review',
    deadline: 'Oct 30, 2026', participants: 'N≤1,600 (adaptive max)', duration: '36 months',
    tags: ['Adaptive Design', 'Platform Trial', 'Critical Care', 'RAR'],
  },
  {
    phase: 'Device', phaseColor: '#06B6D4', phaseBg: 'rgba(6,182,212,0.10)',
    title: 'IDE Study: Closed-Loop Insulin Delivery System in Type 1 Diabetes (Pediatric)',
    desc: 'Pivotal IDE trial, randomized 2:1 vs. standard-of-care CGM+pump. Primary endpoint: TIR at 26 weeks. Pediatric Study Plan accepted by FDA.',
    irbType: 'Full Board Review',
    deadline: 'Jul 12, 2026', participants: 'N=210', duration: '26 weeks',
    tags: ['IDE', 'Closed-Loop', 'Pediatric', 'CGM', 'Pivotal'],
  },
  {
    phase: 'Registry', phaseColor: '#8B5CF6', phaseBg: 'rgba(139,92,246,0.10)',
    title: 'Natural History Registry: Rare Monogenic Pulmonary Fibrosis (SFTPC / ABCA3)',
    desc: 'Longitudinal registry collecting clinical, genomic, and patient-reported outcomes across 20 rare disease centers. Data submitted to NCATS RDCA-DAP.',
    irbType: 'Expedited Review',
    deadline: 'Ongoing', participants: 'N≥500 over 5 yrs', duration: '5 years',
    tags: ['Rare Disease', 'Natural History', 'Genomics', 'PRO', 'Registry'],
  },
];

const DESIGN_CATEGORIES = [
  {
    label: 'Randomized Controlled Trials',
    desc: 'Parallel, crossover, factorial, and cluster-randomized designs with allocation concealment and blinding strategy templates.',
    count: '8 protocol templates',
    color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9H9M9 9H15M9 9V3M9 9V15" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/><circle cx="9" cy="9" r="6.5" stroke="#10B981" strokeWidth="1.4"/></svg>,
  },
  {
    label: 'Observational Studies',
    desc: 'Prospective cohort, retrospective cohort, case-control, cross-sectional, and nested case-control design frameworks.',
    count: '6 protocol templates',
    color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke="#06B6D4" strokeWidth="1.4"/><path d="M2 9C2 9 4.5 4 9 4C13.5 4 16 9 16 9C16 9 13.5 14 9 14C4.5 14 2 9 2 9Z" stroke="#06B6D4" strokeWidth="1.4"/></svg>,
  },
  {
    label: 'Adaptive & Platform Trials',
    desc: 'Seamless Phase II/III, master protocol, response-adaptive randomization, and Bayesian adaptive design templates with SAP frameworks.',
    count: '5 protocol templates',
    color: '#F43F5E', bg: 'rgba(244,63,94,0.08)',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14L6 8L10 11L14 4" stroke="#F43F5E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="4" r="1.5" fill="#F43F5E"/></svg>,
  },
  {
    label: 'Device IDE Studies',
    desc: 'Pivotal and feasibility IDE study designs under 21 CFR 812, including Breakthrough Device pathway templates and PMA-track SAPs.',
    count: '4 protocol templates',
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="6" width="12" height="8" rx="2" stroke="#8B5CF6" strokeWidth="1.4"/><path d="M6 6V5C6 3.9 7 3 9 3C11 3 12 3.9 12 5V6" stroke="#8B5CF6" strokeWidth="1.4" strokeLinecap="round"/><circle cx="9" cy="10" r="1.5" fill="#8B5CF6"/></svg>,
  },
  {
    label: 'First-in-Human / Phase I',
    desc: '3+3, mTPI-2, BOIN, and CRM dose-escalation design templates. DLT criteria frameworks, DSMB charter templates, and SUSAR reporting workflows.',
    count: '7 protocol templates',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2V9L13 13" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="7" stroke="#F59E0B" strokeWidth="1.4"/></svg>,
  },
  {
    label: 'Registries & Natural History',
    desc: 'Longitudinal registry design, data dictionary standards (CDASH/CDISC), patient-reported outcome instrument selection, and RDCA-DAP submission templates.',
    count: '4 protocol templates',
    color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="2" stroke="#10B981" strokeWidth="1.4"/><path d="M6 7H12M6 10H10" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudyResult {
  id: string;
  title: string;
  nctId: string;
  phase: string;
  status: string;
  sponsor: string;
  startDate: string;
  completionDate: string;
  enrollment: string;
  description: string;
  conditions: string[];
  interventions: string[];
  color: string;
  url: string;
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
      <div className="cr-skeleton-line" style={{ height: 14, width: '75%' }} />
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
    <a
      className="cr-result-card"
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ['--result-color' as string]: r.color }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span
          className="cr-phase-badge"
          style={{ color: r.color, background: bg, border: `1px solid ${border}` }}
        >
          {r.phase || 'N/A'}
        </span>
        {r.nctId && <span className="cr-result-number">{r.nctId}</span>}
      </div>
      <div className="cr-result-title">{r.title}</div>
      {r.description && <div className="cr-result-desc">{r.description}</div>}
      <div className="cr-result-meta">
        {r.status && (
          <div className="cr-result-meta-item">
            <span className="cr-result-meta-label">Status</span>
            <span className="cr-result-meta-val" style={{ textTransform: 'capitalize' }}>{r.status}</span>
          </div>
        )}
        {r.enrollment && (
          <div className="cr-result-meta-item">
            <span className="cr-result-meta-label">Enrollment</span>
            <span className="cr-result-meta-val">{r.enrollment}</span>
          </div>
        )}
        {r.completionDate && (
          <div className="cr-result-meta-item">
            <span className="cr-result-meta-label">Completion</span>
            <span className="cr-result-meta-val is-deadline">{r.completionDate}</span>
          </div>
        )}
        {r.sponsor && (
          <div className="cr-result-meta-item">
            <span className="cr-result-meta-label">Sponsor</span>
            <span className="cr-result-meta-val">{r.sponsor}</span>
          </div>
        )}
      </div>
    </a>
  );
}

function FeaturedCard({ proto }: { proto: typeof FEATURED[number] }) {
  return (
    <div className="cr-proto-card">
      <div className="cr-proto-card-header">
        <span
          className="cr-phase-badge"
          style={{ color: proto.phaseColor, background: proto.phaseBg, border: `1px solid ${proto.phaseColor}33` }}
        >
          {proto.phase}
        </span>
        <span className="cr-irb-type-label">{proto.irbType}</span>
      </div>
      <div className="cr-proto-title">{proto.title}</div>
      <div className="cr-proto-desc">{proto.desc}</div>
      <div className="cr-proto-tags">
        {proto.tags.map(t => <span key={t} className="cr-proto-tag">{t}</span>)}
      </div>
      <div className="cr-proto-meta">
        <div className="cr-proto-meta-item">
          <span className="cr-proto-meta-label">Submission</span>
          <span className={`cr-proto-meta-val${proto.deadline !== 'Rolling enrollment' && proto.deadline !== 'Ongoing' ? ' highlight' : ''}`}>
            {proto.deadline}
          </span>
        </div>
        <div className="cr-proto-meta-item">
          <span className="cr-proto-meta-label">Participants</span>
          <span className="cr-proto-meta-val">{proto.participants}</span>
        </div>
        <div className="cr-proto-meta-item">
          <span className="cr-proto-meta-label">Duration</span>
          <span className="cr-proto-meta-val">{proto.duration}</span>
        </div>
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
    setLoading(true);
    setError('');
    setHasSearched(true);
    setLastQuery(q);

    try {
      const res = await fetch('/api/clinicalresearch/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: q, phase }),
      });
      const data = await res.json() as { studies: StudyResult[]; total: number; error?: string };
      if (data.error) setError(data.error);
      setResults(data.studies ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Network error. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    runSearch(query, selectedPhase);
  }, [query, selectedPhase, runSearch]);

  const handleChip = useCallback((chip: string) => {
    setSelectedPhase(chip);
    if (hasSearched) runSearch(query, chip);
  }, [hasSearched, query, runSearch]);

  const handleClear = useCallback(() => {
    setHasSearched(false);
    setResults([]);
    setError('');
    setQuery('');
    setSelectedPhase('All');
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

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
            <input
              ref={inputRef}
              className="cr-search-box"
              type="text"
              placeholder="Search trials, conditions, interventions, sponsors…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="cr-search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="cr-phase-chips">
            {PHASE_CHIPS.map(chip => {
              const colors = CHIP_COLORS[chip] ?? CHIP_COLORS['All'];
              const sel = selectedPhase === chip;
              return (
                <button
                  key={chip}
                  className={`cr-chip${sel ? ' selected' : ''}`}
                  style={{
                    ['--chip-color' as string]: colors.color,
                    ['--chip-bg'   as string]: colors.bg,
                  }}
                  onClick={() => handleChip(chip)}
                >
                  <span className="cr-chip-dot" />
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="cr-stats">
          {[
            { num: '15.2', sup: 'K', label: 'Active CT.gov Studies'     },
            { num: '47',   sup: '',  label: 'Protocol Templates'         },
            { num: '8',    sup: '',  label: 'Regulatory Pathways'        },
            { num: '21',   sup: '',  label: 'ICH / FDA Guidances'        },
            { num: '2.4',  sup: 'K', label: 'New Studies / Month'        },
          ].map(s => (
            <div className="cr-stat" key={s.label}>
              <span className="cr-stat-num">{s.num}<span>{s.sup}</span></span>
              <span className="cr-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <main className="cr-main">

        {/* IRB Review Type tiles */}
        <div className="cr-section-head">
          <h2 className="cr-section-title">IRB Review Types</h2>
          <span className="cr-section-sub">8 review pathways</span>
        </div>
        <div className="cr-irb-tiles">
          {IRB_TYPES.map(irb => (
            <div
              key={irb.abbr}
              className="cr-irb-tile"
              style={{ ['--tile-color' as string]: irb.color }}
            >
              <div className="cr-irb-tile-abbr">{irb.abbr}</div>
              <div className="cr-irb-tile-name">{irb.name}</div>
              <div className="cr-irb-tile-count">
                <span className="cr-irb-tile-num">{irb.count.toLocaleString()}</span>
                <span className="cr-irb-tile-unit">submissions</span>
              </div>
              <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 11, color: irb.color, opacity: 0.85 }}>
                {irb.turnaround} avg
              </div>
            </div>
          ))}
        </div>

        {/* Search results OR featured protocols */}
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
              <button className="cr-clear-btn" onClick={handleClear}>
                ✕ Clear search
              </button>
            </div>

            <div className="cr-protos">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : results.length > 0 ? (
                results.map(r => <ResultCard key={r.id || r.title} r={r} />)
              ) : (
                <div className="cr-empty">
                  <SearchIcon className={undefined} />
                  <div className="cr-empty-title">No studies found</div>
                  <div className="cr-empty-sub">
                    Try different keywords or adjust the phase filter. You can also search directly on ClinicalTrials.gov.
                  </div>
                  <a
                    href="https://clinicaltrials.gov/search"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cr-btn-secondary"
                    style={{ marginTop: 8, textDecoration: 'none' }}
                  >
                    Browse ClinicalTrials.gov →
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="cr-section-head">
              <h2 className="cr-section-title">Featured Protocols</h2>
              <span className="cr-section-sub">Curated · May 2026</span>
            </div>
            <div className="cr-protos">
              {FEATURED.map(proto => <FeaturedCard key={proto.title} proto={proto} />)}
            </div>
          </>
        )}

        {/* Study Design Categories */}
        <div className="cr-section-head">
          <h2 className="cr-section-title">By Study Design</h2>
          <span className="cr-section-sub">Design types &amp; templates</span>
        </div>
        <div className="cr-cats">
          {DESIGN_CATEGORIES.map(cat => (
            <div
              key={cat.label}
              className="cr-cat-card"
              style={{ ['--cat-color' as string]: cat.color, ['--cat-bg' as string]: cat.bg }}
            >
              <div className="cr-cat-icon" style={{ background: cat.bg }}>{cat.icon}</div>
              <div className="cr-cat-label">{cat.label}</div>
              <div className="cr-cat-desc">{cat.desc}</div>
              <div className="cr-cat-count">{cat.count}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cr-cta">
          <div className="cr-cta-glow" />
          <div className="cr-cta-glow-2" />
          <div className="cr-cta-text">
            <h2 className="cr-cta-h2">Ready to <em>design</em> your study?</h2>
            <p className="cr-cta-p">
              Generate IRB-ready protocol templates, build statistical analysis plans,
              navigate FDA pre-submission pathways, and collaborate with your team —
              from hypothesis to site activation.
            </p>
          </div>
          <div className="cr-cta-btns">
            <button className="cr-btn-primary">Get Early Access</button>
            <button className="cr-btn-secondary">Learn More</button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--line)', padding: '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1160, margin: '0 auto', width: '100%',
      }}>
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
