'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SparkCanvas } from './sparkbg';
import './grants.css';

// ── Static data ───────────────────────────────────────────────────────────────

const MECHANISM_CHIPS = [
  'All', 'R01', 'R21', 'R03', 'R34', 'R61/R33', 'K99/R00', 'K-Awards', 'F-Awards', 'U01', 'P01', 'T32',
];

const CHIP_COLORS: Record<string, { color: string; bg: string }> = {
  'All':      { color:'#F59E0B', bg:'rgba(245,158,11,0.12)' },
  'R01':      { color:'#F59E0B', bg:'rgba(245,158,11,0.12)' },
  'R21':      { color:'#10B981', bg:'rgba(16,185,129,0.12)'  },
  'R03':      { color:'#6366F1', bg:'rgba(99,102,241,0.12)'  },
  'R34':      { color:'#8B5CF6', bg:'rgba(139,92,246,0.12)'  },
  'R61/R33':  { color:'#F59E0B', bg:'rgba(245,158,11,0.12)'  },
  'K99/R00':  { color:'#10B981', bg:'rgba(16,185,129,0.12)'  },
  'K-Awards': { color:'#06B6D4', bg:'rgba(6,182,212,0.12)'   },
  'F-Awards': { color:'#6366F1', bg:'rgba(99,102,241,0.12)'  },
  'U01':      { color:'#8B5CF6', bg:'rgba(139,92,246,0.12)'  },
  'P01':      { color:'#F43F5E', bg:'rgba(244,63,94,0.12)'   },
  'T32':      { color:'#06B6D4', bg:'rgba(6,182,212,0.12)'   },
};

const MECHANISMS = [
  { code:'R01',     name:'Research Project Grant',     color:'#F59E0B', avg:'$544K/yr',  desc:'Standard investigator-initiated grant. Supports hypothesis-driven research for up to 5 years. Most competitive mechanism; requires strong preliminary data.' },
  { code:'R21',     name:'Exploratory / Developmental',color:'#10B981', avg:'$275K/2yr', desc:'Two-year exploratory grants for high-risk, high-reward ideas. No preliminary data required. Max $275K total (direct costs).' },
  { code:'R03',     name:'Small Research Grant',       color:'#6366F1', avg:'$100K/2yr', desc:'Short-term, limited-budget support for pilot/feasibility studies, secondary analyses, and method development. Max $50K/yr direct costs.' },
  { code:'K99/R00', name:'Pathway to Independence',    color:'#10B981', avg:'$249K/yr',  desc:'Two-phase award: mentored K99 (≤2 yrs) then independent R00 (≤3 yrs). Bridges postdoc to faculty. Highly prestigious.' },
  { code:'F31',     name:'Predoctoral Fellowship',     color:'#6366F1', avg:'$35K/yr',   desc:'NRSA fellowship for PhD candidates conducting dissertation research. Covers stipend, tuition, and fees for up to 5 years.' },
  { code:'U01',     name:'Research Project Cooperative',color:'#8B5CF6',avg:'$1.2M/yr', desc:'Cooperative agreement for large multi-site studies where NIH program staff have substantive involvement. Often used for clinical trials.' },
  { code:'P01',     name:'Program Project Grant',      color:'#F43F5E', avg:'$2.1M/yr',  desc:'Multi-project grant supporting 3+ related subprojects under a unifying theme. Requires administrative and scientific cores.' },
  { code:'T32',     name:'Institutional Research Training',color:'#06B6D4',avg:'$600K/yr','desc':'Training grants supporting pre- and postdoctoral trainees. Awarded to institutions, not individuals.' },
];

const NIH_INSTITUTES = [
  { abbr:'NCI',   name:'National Cancer Institute',              budget:'$7.2B' },
  { abbr:'NHLBI', name:'National Heart, Lung, and Blood Institute', budget:'$4.0B' },
  { abbr:'NIGMS', name:'National Institute of General Medical Sciences', budget:'$3.1B' },
  { abbr:'NIAID', name:'National Institute of Allergy and Infectious Diseases', budget:'$6.5B' },
  { abbr:'NICHD', name:'Eunice Kennedy Shriver NICHD',          budget:'$1.8B' },
  { abbr:'NIMH',  name:'National Institute of Mental Health',   budget:'$2.2B' },
  { abbr:'NIDDK', name:'Nat. Institute of Diabetes, Digestive & Kidney', budget:'$2.3B' },
  { abbr:'NINDS', name:'National Institute of Neurological Disorders', budget:'$2.7B' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Grant {
  id: string; projectNum: string; title: string; org: string; pis: string;
  abstract: string; cost: string; fiscalYear: number; startDate: string; endDate: string;
  activityCode: string; url: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="gr-card" style={{ gap:12 }}>
      <div className="gr-skeleton" style={{ width:'40%', height:12 }} />
      <div className="gr-skeleton" style={{ width:'90%', height:14, marginTop:4 }} />
      <div className="gr-skeleton" style={{ width:'75%', height:14 }} />
      <div className="gr-skeleton" style={{ width:'55%', height:12, marginTop:4 }} />
      <div className="gr-skeleton" style={{ width:'100%', height:12 }} />
      <div className="gr-skeleton" style={{ width:'88%', height:12 }} />
    </div>
  );
}

function GrantCard({ g }: { g: Grant }) {
  const cc = CHIP_COLORS[g.activityCode] ?? { color:'#F59E0B', bg:'rgba(245,158,11,0.12)' };
  return (
    <div className="gr-card">
      <div className="gr-card-top">
        <span className="gr-card-code" style={{ color: cc.color, background: cc.bg }}>{g.activityCode}</span>
        <span className="gr-card-fiscal">FY{g.fiscalYear}</span>
        {g.cost && <span className="gr-card-cost">{g.cost}</span>}
      </div>
      <div className="gr-card-title">{g.title}</div>
      {g.org && <div className="gr-card-org">{g.org}</div>}
      {g.pis && <div className="gr-card-pi">{g.pis}</div>}
      {g.abstract && <div className="gr-card-abstract">{g.abstract}{g.abstract.length >= 319 ? '…' : ''}</div>}
      <a href={g.url} target="_blank" rel="noreferrer" className="gr-card-link">
        View on NIH Reporter →
      </a>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GrantsPage() {
  const [query,      setQuery]      = useState('');
  const [mechanism,  setMechanism]  = useState('All');
  const [loading,    setLoading]    = useState(false);
  const [results,    setResults]    = useState<Grant[]>([]);
  const [total,      setTotal]      = useState(0);
  const [error,      setError]      = useState('');
  const [searched,   setSearched]   = useState(false);

  const search = useCallback(async (q: string, mech: string) => {
    setLoading(true); setError(''); setSearched(true);
    try {
      const res = await fetch('/api/grants/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mechanism: mech }),
      });
      const data = await res.json() as { grants: Grant[]; total: number; error?: string };
      if (data.error) { setError(data.error); setResults([]); setTotal(0); }
      else { setResults(data.grants); setTotal(data.total); }
    } catch { setError('Search unavailable. Try again.'); }
    finally { setLoading(false); }
  }, []);

  function handleSearch() { search(query, mechanism); }
  function pickMechanism(m: string) {
    setMechanism(m);
    if (searched) search(query, m);
  }

  return (
    <div className="gr-root">
      <SparkCanvas />

      {/* Nav */}
      <nav className="gr-nav">
        <Link href="/" className="gr-nav-logo">Ambient <em>Intelligence</em></Link>
        <div className="gr-nav-links">
          <Link href="/digitalhealth"    className="gr-nav-link">Digital Health</Link>
          <Link href="/accelerate"       className="gr-nav-link">Biodesign</Link>
          <Link href="/clinicalresearch" className="gr-nav-link">Clinical Research</Link>
          <Link href="/grants"           className="gr-nav-link active">Grants</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="gr-hero">
        <div className="gr-hero-eyebrow">NIH · NSF · PCORI · DoD Funding Intelligence</div>
        <h1 className="gr-hero-h1">
          Fund your<br /><em>discovery.</em>
        </h1>
        <p className="gr-hero-sub">
          Live search across $47B+ in active NIH-funded projects. Find funded precedents,
          understand review criteria, and identify the right mechanism for your science.
        </p>

        <div className="gr-search-bar">
          <input
            className="gr-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search funded projects — e.g., SGLT2 heart failure, RNA editing, Alzheimer biomarkers…"
          />
          <button className="gr-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? '…' : 'Search'}
          </button>
        </div>

        <div className="gr-chips">
          {MECHANISM_CHIPS.map(m => {
            const cc = CHIP_COLORS[m] ?? CHIP_COLORS['All'];
            const active = mechanism === m;
            return (
              <button
                key={m}
                className="gr-chip"
                style={{
                  color:            active ? cc.color : 'var(--text-4)',
                  background:       active ? cc.bg : 'transparent',
                  borderColor:      active ? cc.color : 'rgba(245,158,11,0.15)',
                }}
                onClick={() => pickMechanism(m)}
              >{m}</button>
            );
          })}
        </div>
      </section>

      {/* Stats bar */}
      <div className="gr-stats">
        {[
          { num:'$47.5B',  label:'NIH FY2024 Budget'         },
          { num:'~55K',    label:'Active Funded Projects'    },
          { num:'$544K',   label:'Avg R01 Award / Year'      },
          { num:'27.1%',   label:'R01 Payline (Median)'      },
          { num:'8',       label:'NIH Priority Areas'        },
        ].map(s => (
          <div key={s.label} className="gr-stat">
            <div className="gr-stat-num">{s.num}</div>
            <div className="gr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search results */}
      {searched && (
        <section className="gr-section">
          <div className="gr-section-eyebrow">NIH Reporter — Live Results</div>
          <h2 className="gr-section-h2">Funded <em>Projects</em></h2>
          {!loading && !error && total > 0 && (
            <p className="gr-section-sub">{total.toLocaleString()} projects found · showing top 12</p>
          )}
          {error && <div className="gr-error">{error}</div>}
          {!error && (
            <div className="gr-results-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : results.length > 0
                  ? results.map(g => <GrantCard key={g.id} g={g} />)
                  : <div className="gr-empty">No results — try a different search term or mechanism.</div>
              }
            </div>
          )}
        </section>
      )}

      {/* Mechanism guide */}
      <section className="gr-section">
        <div className="gr-section-eyebrow">Mechanism Intelligence</div>
        <h2 className="gr-section-h2">Choose the right <em>mechanism</em></h2>
        <p className="gr-section-sub">NIH offers 30+ activity codes. These eight cover 80% of funded projects for biomedical researchers.</p>
        <div className="gr-mechs">
          {MECHANISMS.map(m => (
            <div
              key={m.code}
              className={`gr-mech${mechanism === m.code ? ' active' : ''}`}
              style={{ '--mech-color': m.color } as React.CSSProperties}
              onClick={() => pickMechanism(m.code)}
            >
              <div className="gr-mech-code">{m.code}</div>
              <div className="gr-mech-name">{m.name}</div>
              <div className="gr-mech-desc">{m.desc}</div>
              <div className="gr-mech-avg">Avg: {m.avg}</div>
            </div>
          ))}
        </div>
      </section>

      {/* NIH Institutes */}
      <section className="gr-section" style={{ paddingTop:0 }}>
        <div className="gr-section-eyebrow">By Institute</div>
        <h2 className="gr-section-h2">NIH <em>Institute</em> Landscape</h2>
        <p className="gr-section-sub">27 institutes and centers. Target the one whose mission aligns with your science.</p>
        <div className="gr-inst-grid">
          {NIH_INSTITUTES.map(inst => (
            <div key={inst.abbr} className="gr-inst">
              <div className="gr-inst-abbr">{inst.abbr}</div>
              <div className="gr-inst-name">{inst.name}</div>
              <div className="gr-inst-budget">{inst.budget} FY2024</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gr-cta">
        <div className="gr-cta-inner">
          <div>
            <div className="gr-cta-eyebrow">Grant Writing Workspace</div>
            <h2 className="gr-cta-h2">From <em>idea</em> to Specific Aims.</h2>
            <p className="gr-cta-sub">AI-assisted Specific Aims page, budget builder, biosketches, and submission timeline — all in one workspace.</p>
          </div>
          <div className="gr-cta-actions">
            <Link href="/clinicalresearch/app" className="gr-btn-primary">Launch Protocol Workspace →</Link>
            <button className="gr-btn-secondary">Browse Templates</button>
          </div>
        </div>
      </section>

      <footer className="gr-footer">
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-4)' }}>
          Ambient Intelligence — Grants & Funding
        </span>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-4)' }}>
          Live data · NIH Reporter v2 API
        </span>
      </footer>
    </div>
  );
}
