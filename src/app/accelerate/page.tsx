'use client';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SparkCanvas } from './sparkbg';
import './accelerate.css';

// ── Static data ───────────────────────────────────────────────────────────────

const AGENCIES = [
  { abbr: 'NIH',    name: 'National Institutes of Health',             color: '#4F9CF9', count: 2840, budget: '$48.1B' },
  { abbr: 'NSF',    name: 'National Science Foundation',               color: '#3DCC91', count: 1205, budget: '$9.9B'  },
  { abbr: 'DOD',    name: 'Dept. of Defense',                          color: '#FF6680', count: 892,  budget: '$3.2B'  },
  { abbr: 'DOE',    name: 'Dept. of Energy',                           color: '#F0B429', count: 614,  budget: '$2.8B'  },
  { abbr: 'ARPA-H', name: 'Advanced Research Projects Agency – Health', color: '#8264F0', count: 88,   budget: '$1.5B'  },
  { abbr: 'BARDA',  name: 'Biomedical Advanced R&D Authority',         color: '#52C0E8', count: 143,  budget: '$820M'  },
  { abbr: 'NASA',   name: 'National Aeronautics & Space Admin.',       color: '#F0B429', count: 327,  budget: '$1.1B'  },
  { abbr: 'CDC',    name: 'Centers for Disease Control',               color: '#3DCC91', count: 438,  budget: '$640M'  },
];

const AGENCY_CHIPS = ['All', 'NIH', 'NSF', 'DOD', 'DOE', 'ARPA-H', 'BARDA', 'NASA', 'CDC', 'DARPA', 'AFOSR', 'ONR'];

const CHIP_COLORS: Record<string, { color: string; bg: string }> = {
  NIH:     { color: '#4F9CF9', bg: 'rgba(79,156,249,0.12)'  },
  NSF:     { color: '#3DCC91', bg: 'rgba(63,204,145,0.12)'  },
  DOD:     { color: '#FF6680', bg: 'rgba(255,102,128,0.12)' },
  DOE:     { color: '#F0B429', bg: 'rgba(240,180,41,0.12)'  },
  'ARPA-H':{ color: '#8264F0', bg: 'rgba(130,100,240,0.12)' },
  BARDA:   { color: '#52C0E8', bg: 'rgba(82,192,232,0.12)'  },
  NASA:    { color: '#F0B429', bg: 'rgba(240,180,41,0.12)'  },
  CDC:     { color: '#3DCC91', bg: 'rgba(63,204,145,0.12)'  },
  DARPA:   { color: '#FF6680', bg: 'rgba(255,102,128,0.12)' },
  AFOSR:   { color: '#8264F0', bg: 'rgba(130,100,240,0.12)' },
  ONR:     { color: '#4F9CF9', bg: 'rgba(79,156,249,0.12)'  },
  All:     { color: '#4F9CF9', bg: 'rgba(79,156,249,0.12)'  },
};

const FEATURED = [
  { agency:'NIH',    agencyColor:'#4F9CF9', agencyBg:'rgba(79,156,249,0.10)',   title:'AI-Driven Early Detection of Neurodegenerative Disease',         desc:"Supports ML methods for early biomarker identification in Alzheimer's and Parkinson's using multi-modal imaging and genomics.", mechanism:'R01',                     deadline:'Jun 5, 2026',  award:'$500K / yr',       duration:'5 years',          tags:['Neuroscience','Machine Learning','Biomarkers','Imaging'] },
  { agency:'ARPA-H', agencyColor:'#8264F0', agencyBg:'rgba(130,100,240,0.10)',  title:'Resilient Biosurveillance Networks for Emerging Pathogens',       desc:'Scalable sensor networks and AI analytics platforms detecting novel pathogen emergence weeks ahead of clinical case reporting.',  mechanism:'BAA',                     deadline:'Jul 18, 2026', award:'$3M–$12M',          duration:'3 years',          tags:['Biosurveillance','Pandemic Preparedness','Sensor Networks'] },
  { agency:'NSF',    agencyColor:'#3DCC91', agencyBg:'rgba(63,204,145,0.10)',   title:'Quantum Sensing for Precision Medicine Applications',             desc:'Exploratory research at the intersection of quantum information science and biomedical sensing, including NV-center magnetometry.', mechanism:'CAREER',                  deadline:'Aug 2, 2026',  award:'$550K total',       duration:'5 years',          tags:['Quantum Sensing','Neural Imaging','Precision Medicine'] },
  { agency:'DOD',    agencyColor:'#FF6680', agencyBg:'rgba(255,102,128,0.10)',  title:'Autonomous Triage Systems for Mass Casualty Events',              desc:'SBIR Phase II for miniaturized platforms combining physiological monitoring and AI decision support for combat medic triage.',        mechanism:'SBIR Phase II',           deadline:'Jun 30, 2026', award:'$1.25M',            duration:'2 years',          tags:['Military Medicine','Autonomous Systems','SBIR','Triage'] },
  { agency:'BARDA',  agencyColor:'#52C0E8', agencyBg:'rgba(82,192,232,0.10)',   title:'MCM Platform Technologies for Broad-Spectrum Antivirals',         desc:'Late-stage development of novel antiviral scaffolds with activity against CDC Category A/B pathogens, emphasizing oral bioavailability.', mechanism:'Contract (OTA)',          deadline:'Rolling',      award:'Up to $50M',        duration:'4 years',          tags:['Antivirals','MCM','Pandemic Preparedness','CBRN'] },
  { agency:'DOE',    agencyColor:'#F0B429', agencyBg:'rgba(240,180,41,0.10)',   title:'Protein Structure Prediction at Exascale for Drug Discovery',     desc:'Collaborative research leveraging DOE leadership computing for cryo-EM guided molecular dynamics and free-energy perturbation.',     mechanism:'INCITE',                  deadline:'Sep 15, 2026', award:'Compute allocation', duration:'1 year (renewable)', tags:['Computational Biology','Exascale','Drug Discovery','HPC'] },
];

const CATEGORIES = [
  { label:'SBIR / STTR',          desc:'Small Business Innovation Research and Technology Transfer programs across all federal agencies.', count:'3,400+ active solicitations', color:'#4F9CF9', bg:'rgba(79,156,249,0.08)',   icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="#4F9CF9" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="9" cy="9" r="2.5" stroke="#4F9CF9" strokeWidth="1.4"/></svg> },
  { label:'R01 / R21',            desc:'NIH research project grants — the primary NIH mechanism for investigator-initiated research.',     count:'2,100+ open PAs',             color:'#3DCC91', bg:'rgba(63,204,145,0.08)',   icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="9" rx="2" stroke="#3DCC91" strokeWidth="1.4"/><path d="M6 5V4C6 3 7 2 9 2C11 2 12 3 12 4V5" stroke="#3DCC91" strokeWidth="1.4" strokeLinecap="round"/><line x1="6" y1="9" x2="12" y2="9" stroke="#3DCC91" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { label:'BAA / Other Transaction', desc:'Broad Agency Announcements and Other Transaction Authority from DOD, DARPA, and ARPA-H.',        count:'890+ active BAAs',            color:'#FF6680', bg:'rgba(255,102,128,0.08)', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L11.5 7H16.5L12.5 10.5L14 16L9 13L4 16L5.5 10.5L1.5 7H6.5L9 2Z" stroke="#FF6680" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
  { label:'P01 / U01 Centers',    desc:'Multi-project program and cooperative agreement grants for large collaborative research networks.',   count:'420+ open announcements',     color:'#8264F0', bg:'rgba(130,100,240,0.08)', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke="#8264F0" strokeWidth="1.4"/><circle cx="3" cy="5" r="1.5" stroke="#8264F0" strokeWidth="1.4"/><circle cx="15" cy="5" r="1.5" stroke="#8264F0" strokeWidth="1.4"/><circle cx="3" cy="13" r="1.5" stroke="#8264F0" strokeWidth="1.4"/><circle cx="15" cy="13" r="1.5" stroke="#8264F0" strokeWidth="1.4"/></svg> },
  { label:'CAREER / MURI',        desc:'NSF CAREER awards and DoD Multidisciplinary University Research Initiatives for early-career faculty.', count:'180+ annual solicitations',  color:'#F0B429', bg:'rgba(240,180,41,0.08)',   icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L9 10M9 2L6 5M9 2L12 5" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 10H14L13 16H5L4 10Z" stroke="#F0B429" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
  { label:'Contracts & OTAs',     desc:'DOD, DHS, and VA acquisition contracts and Other Transaction Agreements for prototype development.', count:'1,600+ active solicitations', color:'#52C0E8', bg:'rgba(82,192,232,0.08)',  icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="#52C0E8" strokeWidth="1.4"/><path d="M6 7H12M6 10H10" stroke="#52C0E8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  number: string;
  agencyCode: string;
  agencyName: string;
  closeDate: string;
  openDate: string;
  award: string;
  status: string;
  description: string;
  category: string;
  color: string;
  url: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'acc-search-icon'} width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="acc-skeleton">
      <div className="acc-skeleton-line" style={{ height: 14, width: '30%' }} />
      <div className="acc-skeleton-line" style={{ height: 18, width: '85%' }} />
      <div className="acc-skeleton-line" style={{ height: 14, width: '60%' }} />
      <div className="acc-skeleton-line" style={{ height: 14, width: '75%' }} />
      <div style={{ marginTop: 4, display: 'flex', gap: 12 }}>
        <div className="acc-skeleton-line" style={{ height: 32, flex: 1 }} />
        <div className="acc-skeleton-line" style={{ height: 32, flex: 1 }} />
        <div className="acc-skeleton-line" style={{ height: 32, flex: 1 }} />
      </div>
    </div>
  );
}

function ResultCard({ r }: { r: SearchResult }) {
  const bg = r.color.replace(')', ',0.10)').replace('rgb', 'rgba');
  const border = r.color + '33';
  return (
    <a
      className="acc-result-card"
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ['--result-color' as string]: r.color }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span
          className="acc-opp-agency-badge"
          style={{ color: r.color, background: bg, border: `1px solid ${border}` }}
        >
          {r.agencyCode || r.agencyName}
        </span>
        {r.number && <span className="acc-result-number">{r.number}</span>}
      </div>
      <div className="acc-result-title">{r.title}</div>
      {r.description && <div className="acc-result-desc">{r.description}</div>}
      <div className="acc-result-meta">
        {r.closeDate && (
          <div className="acc-result-meta-item">
            <span className="acc-result-meta-label">Deadline</span>
            <span className="acc-result-meta-val is-deadline">{r.closeDate}</span>
          </div>
        )}
        {r.award && r.award !== 'See announcement' && (
          <div className="acc-result-meta-item">
            <span className="acc-result-meta-label">Award</span>
            <span className="acc-result-meta-val">{r.award}</span>
          </div>
        )}
        {r.status && (
          <div className="acc-result-meta-item">
            <span className="acc-result-meta-label">Status</span>
            <span className="acc-result-meta-val" style={{ textTransform: 'capitalize' }}>{r.status}</span>
          </div>
        )}
        {r.openDate && (
          <div className="acc-result-meta-item">
            <span className="acc-result-meta-label">Posted</span>
            <span className="acc-result-meta-val">{r.openDate}</span>
          </div>
        )}
      </div>
    </a>
  );
}

function FeaturedCard({ opp }: { opp: typeof FEATURED[number] }) {
  return (
    <div className="acc-opp-card">
      <div className="acc-opp-card-header">
        <span className="acc-opp-agency-badge" style={{ color: opp.agencyColor, background: opp.agencyBg, border: `1px solid ${opp.agencyColor}33` }}>
          {opp.agency}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, flexShrink: 0 }}>
          {opp.mechanism}
        </span>
      </div>
      <div className="acc-opp-title">{opp.title}</div>
      <div className="acc-opp-desc">{opp.desc}</div>
      <div className="acc-opp-tags">
        {opp.tags.map(t => <span key={t} className="acc-opp-tag">{t}</span>)}
      </div>
      <div className="acc-opp-meta">
        <div className="acc-opp-meta-item">
          <span className="acc-opp-meta-label">Deadline</span>
          <span className={`acc-opp-meta-val${opp.deadline !== 'Rolling' ? ' deadline' : ''}`}>{opp.deadline}</span>
        </div>
        <div className="acc-opp-meta-item">
          <span className="acc-opp-meta-label">Award</span>
          <span className="acc-opp-meta-val">{opp.award}</span>
        </div>
        <div className="acc-opp-meta-item">
          <span className="acc-opp-meta-label">Duration</span>
          <span className="acc-opp-meta-val">{opp.duration}</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AcceleratePage() {
  const [selectedAgency, setSelectedAgency] = useState('All');
  const [query, setQuery]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [results, setResults]               = useState<SearchResult[]>([]);
  const [total, setTotal]                   = useState(0);
  const [error, setError]                   = useState('');
  const [hasSearched, setHasSearched]       = useState(false);
  const [lastQuery, setLastQuery]           = useState('');
  const inputRef                            = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string, agency: string) => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    setLastQuery(q);

    try {
      const res = await fetch('/api/accelerate/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: q, agency }),
      });
      const data = await res.json() as { opportunities: SearchResult[]; total: number; error?: string };
      if (data.error) setError(data.error);
      setResults(data.opportunities ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Network error. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    runSearch(query, selectedAgency);
  }, [query, selectedAgency, runSearch]);

  const handleChip = useCallback((chip: string) => {
    setSelectedAgency(chip);
    if (hasSearched) runSearch(query, chip);
  }, [hasSearched, query, runSearch]);

  const handleClear = useCallback(() => {
    setHasSearched(false);
    setResults([]);
    setError('');
    setQuery('');
    setSelectedAgency('All');
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="acc-root">
      {/* Nav */}
      <nav className="acc-nav">
        <Link href="/" className="acc-nav-brand">
          <span className="acc-nav-name">Ambient <em>Intelligence</em></span>
        </Link>
        <div className="acc-nav-links">
          <Link href="/digitalhealth" className="acc-nav-link">Digital Health</Link>
          <Link href="/biodesign"     className="acc-nav-link">Biodesign</Link>
          <Link href="/accelerate"    className="acc-nav-link active">Accelerate</Link>
          <Link href="/invest"        className="acc-nav-link">Invest</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="acc-hero">
        <div className="acc-hero-bg" />
        <SparkCanvas />

        <div className="acc-hero-content">
          <div className="acc-hero-badge">
            <div className="acc-hero-badge-dot" />
            Federal Funding Intelligence
          </div>

          <h1 className="acc-hero-h1">
            Find grants that<br /><em>accelerate your science</em>
          </h1>
          <p className="acc-hero-sub">
            Search NIH, NSF, DOD, DOE, ARPA-H, and 40+ federal agencies in one place.
            Live data from Grants.gov — updated daily.
          </p>

          <div className="acc-search-wrap">
            <SearchIcon />
            <input
              ref={inputRef}
              className="acc-search-box"
              type="text"
              placeholder="Search grants, mechanisms, topics, agencies…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="acc-search-btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="acc-agency-chips">
            {AGENCY_CHIPS.map(chip => {
              const colors = CHIP_COLORS[chip] ?? CHIP_COLORS['All'];
              const sel = selectedAgency === chip;
              return (
                <button
                  key={chip}
                  className={`acc-chip${sel ? ' selected' : ''}`}
                  style={{
                    ['--chip-color' as string]: colors.color,
                    ['--chip-bg'   as string]: colors.bg,
                  }}
                  onClick={() => handleChip(chip)}
                >
                  <span className="acc-chip-dot" />
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="acc-stats">
          {[
            { num: '9,800', sup: '+', label: 'Active Opportunities' },
            { num: '$68',   sup: 'B', label: 'Total Federal R&D Budget' },
            { num: '42',    sup: '',  label: 'Federal Agencies' },
            { num: '98',    sup: '%', label: 'Grants.gov Coverage' },
            { num: '1.4',   sup: 'K', label: 'New Grants / Month' },
          ].map(s => (
            <div className="acc-stat" key={s.label}>
              <span className="acc-stat-num">{s.num}<span>{s.sup}</span></span>
              <span className="acc-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <main className="acc-main">

        {/* Agency tiles */}
        <div className="acc-section-head">
          <h2 className="acc-section-title">Agencies</h2>
          <span className="acc-section-sub">8 primary funders shown</span>
        </div>
        <div className="acc-agencies">
          {AGENCIES.map(ag => (
            <div
              key={ag.abbr}
              className="acc-agency-tile"
              style={{ ['--tile-color' as string]: ag.color, cursor: 'pointer' }}
              onClick={() => { handleChip(ag.abbr); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <div className="acc-agency-tile-abbr">{ag.abbr}</div>
              <div className="acc-agency-tile-name">{ag.name}</div>
              <div className="acc-agency-tile-count">
                <span className="acc-agency-tile-num">{ag.count.toLocaleString()}</span>
                <span className="acc-agency-tile-unit">active</span>
              </div>
              <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 11, color: ag.color, opacity: 0.8 }}>
                {ag.budget} / yr
              </div>
            </div>
          ))}
        </div>

        {/* Search results OR featured opportunities */}
        {hasSearched ? (
          <>
            <div className="acc-results-head">
              <div className="acc-results-count">
                {loading
                  ? 'Searching Grants.gov…'
                  : error
                  ? <span style={{ color: 'var(--rose)' }}>{error}</span>
                  : <><strong>{total.toLocaleString()}</strong> {total === 1 ? 'result' : 'results'} for &ldquo;{lastQuery || selectedAgency}&rdquo;</>
                }
              </div>
              <button className="acc-clear-btn" onClick={handleClear}>
                ✕ Clear search
              </button>
            </div>

            <div className="acc-opps">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : results.length > 0 ? (
                results.map(r => <ResultCard key={r.id || r.title} r={r} />)
              ) : (
                <div className="acc-empty">
                  <SearchIcon className={undefined} />
                  <div className="acc-empty-title">No results found</div>
                  <div className="acc-empty-sub">
                    Try different keywords or select a different agency filter. You can also browse all open opportunities directly on Grants.gov.
                  </div>
                  <a href="https://www.grants.gov/search-grants" target="_blank" rel="noopener noreferrer" className="acc-btn-secondary" style={{ marginTop: 8, textDecoration: 'none' }}>
                    Browse Grants.gov →
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="acc-section-head">
              <h2 className="acc-section-title">Featured Opportunities</h2>
              <span className="acc-section-sub">Curated · May 2026</span>
            </div>
            <div className="acc-opps">
              {FEATURED.map(opp => <FeaturedCard key={opp.title} opp={opp} />)}
            </div>
          </>
        )}

        {/* Categories */}
        <div className="acc-section-head">
          <h2 className="acc-section-title">By Mechanism</h2>
          <span className="acc-section-sub">Grant types &amp; categories</span>
        </div>
        <div className="acc-cats">
          {CATEGORIES.map(cat => (
            <div
              key={cat.label}
              className="acc-cat-card"
              style={{ ['--cat-color' as string]: cat.color, ['--cat-bg' as string]: cat.bg }}
            >
              <div className="acc-cat-icon" style={{ background: cat.bg }}>{cat.icon}</div>
              <div className="acc-cat-label">{cat.label}</div>
              <div className="acc-cat-desc">{cat.desc}</div>
              <div className="acc-cat-count">{cat.count}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="acc-cta">
          <div className="acc-cta-glow" />
          <div className="acc-cta-glow-2" />
          <div className="acc-cta-text">
            <h2 className="acc-cta-h2">Ready to <em>accelerate</em>?</h2>
            <p className="acc-cta-p">
              Set up AI-matched grant alerts, deadline reminders, and collaborative workspaces
              for your team. Connect directly with program officers and track your portfolio
              from pre-submission to award.
            </p>
          </div>
          <div className="acc-cta-btns">
            <button className="acc-btn-primary">Get Early Access</button>
            <button className="acc-btn-secondary">Learn More</button>
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
          Ambient Intelligence — Accelerate
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
          Live data · Grants.gov public API
        </span>
      </footer>
    </div>
  );
}
