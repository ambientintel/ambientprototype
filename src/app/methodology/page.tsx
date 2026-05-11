"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const C = {
  bg:     '#1C2127',
  s1:     '#252A31',
  s2:     '#2F343C',
  s3:     '#383E47',
  line:   'rgba(255,255,255,0.07)',
  lineS:  'rgba(255,255,255,0.14)',
  text:   '#F6F7F8',
  text2:  'rgba(246,247,248,0.65)',
  text3:  'rgba(246,247,248,0.42)',
  text4:  'rgba(246,247,248,0.26)',
  accent: '#2D72D2',
  sage:   '#3DCC91',
  amber:  '#FFC940',
  red:    '#FF6B6B',
  purple: '#7C6EAD',
  coral:  '#E06C75',
  gold:   '#E0C97A',
};

const INDICES = [
  {
    name: 'AmbientActivityIndex',
    color: C.sage,
    def: 'Aggregate movement score derived from per-frame point-cloud activity; the ambient parallel to accelerometer-based activity counts.',
  },
  {
    name: 'AmbientSleepIndex',
    color: C.purple,
    def: 'Composite sleep quality score combining architecture, fragmentation, and HRV-derived recovery.',
  },
  {
    name: 'AmbientGaitIndex',
    color: C.accent,
    def: 'Gait quality composite from step detection, cadence, gait speed, and step-time variability.',
  },
  {
    name: 'AmbientSedentaryIndex',
    color: C.amber,
    def: 'Sedentary burden measure combining bout analysis, break frequency, and intensity profile.',
  },
  {
    name: 'AmbientRecoveryIndex',
    color: C.gold,
    def: 'Recovery composite from HRV, sleep, and circadian inputs.',
  },
  {
    name: 'AmbientCircadianIndex',
    color: C.coral,
    def: 'Rhythm regularity score rolling up IS, IV, RA, and M10/L5.',
  },
  {
    name: 'AmbientMetabolicIndex',
    color: C.text3,
    def: 'Metabolic composite derived from CGM trace, time-in-range, and variability.',
  },
  {
    name: 'AmbientRiskIndex',
    color: C.red,
    def: 'Fall risk composite driven by SHAP-attributed features across gait, activity, and circadian domains.',
  },
];

const RAW_FIELDS = [
  { name: 'ambientActivityCount', prev: 'PointsDetected', desc: 'Per-frame count of detected points in the mmWave point cloud.' },
  { name: 'heightData',           prev: null,              desc: 'Array of height measurements per radar frame.' },
  { name: 'frameNumber',          prev: null,              desc: 'Sequential frame identifier.' },
  { name: 'timestamp',            prev: null,              desc: 'Unix epoch timestamp.' },
  { name: 'CurrTime',             prev: null,              desc: 'Human-readable ISO timestamp.' },
];

function TierLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 20 }}>
      {children}
    </div>
  );
}

function IndexCard({ name, color, def }: { name: string; color: string; def: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href="/algorithmlab" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.s2,
          border: `1px solid ${hov ? C.lineS : C.line}`,
          borderRadius: 12,
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          transition: 'border-color 0.15s',
          height: '100%',
        }}
      >
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color, letterSpacing: '0.03em' }}>{name}</div>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.65, flex: 1 }}>{def}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: C.text4, letterSpacing: '0.06em' }}>
          → algorithmlab
        </div>
      </div>
    </Link>
  );
}

export default function MethodologyPage() {
  const [devOpen, setDevOpen] = useState(false);
  useEffect(() => {
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ''; };
  }, []);

  return (
    <div className="app" style={{ color: C.text }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand"><div className="brand-name">Ambient <em>Intelligence</em></div></div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Platform</div>
          {([
            ['/algorithmlab', 'Algorithm Lab',  <><path key="a1" d="M3 13L6 8l3 3 3-5 3 3" strokeLinecap="round" strokeLinejoin="round"/><circle key="a2" cx="13" cy="9" r="1.5" fill="currentColor"/></>],
            ['/datascience',  'Data Science',   <><circle key="ds1" cx="5" cy="5" r="2.5"/><circle key="ds2" cx="11" cy="11" r="2.5"/><path key="ds3" d="M11 5.5a2.5 2.5 0 110 0z"/><path key="ds4" d="M5 11a2.5 2.5 0 110 0z"/></>],
            ['/methodology',  'Methodology',    <><path key="m1" d="M4 8h3" strokeLinecap="round"/><circle key="m2" cx="11" cy="5" r="1.5"/><circle key="m3" cx="11" cy="11" r="1.5"/><path key="m4" d="M7 8V5h1.5M7 8v3h1.5" strokeLinecap="round" strokeLinejoin="round"/></>],
          ] as [string, string, React.ReactNode][]).map(([href, label, icon]) => (
            <Link key={label} href={href} className={`nav-item${href === '/methodology' ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </Link>
          ))}
          <a href="https://ellamemory.com" target="_blank" rel="noopener noreferrer" className="nav-item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="9" r="2"/>
              <path d="M5 6.2a4.2 4.2 0 0 1 6 0" strokeLinecap="round"/>
              <path d="M3 4a7.5 7.5 0 0 1 10 0" strokeLinecap="round"/>
            </svg>
            Ella Memory
          </a>
        </nav>

        <nav className="nav-section">
          <div className="nav-label">On this page</div>
          {([
            ['#overview',    'Platform Overview'],
            ['#taxonomy',    'Naming Taxonomy'],
            ['#positioning', 'Positioning'],
            ['#developer',   'Developer Reference'],
          ] as [string, string][]).map(([href, label]) => (
            <a key={href} href={href} className="nav-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              {label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"/>
          <span>naming taxonomy · v1</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <header className="topbar" style={{ marginBottom: 56 }}>
          <div>
            <div className="crumb">Ambient Intelligence · Methodology · Naming Taxonomy</div>
            <h1 className="page-title">Naming <em>Taxonomy</em></h1>
          </div>
        </header>

        {/* ── Section 1: Platform overview ── */}
        <section id="overview" style={{ marginBottom: 72 }}>
          <div className="section-head">
            <h2 className="section-title">Ambient <em>Intelligence</em></h2>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.text3, letterSpacing: '0.04em', marginBottom: 20 }}>
            Passive health monitoring, derived from the environment.
          </div>
          <div style={{ maxWidth: 760, fontSize: 15, color: C.text2, lineHeight: 1.8, borderLeft: `2px solid ${C.line}`, paddingLeft: 24 }}>
            Ambient Intelligence is a passive, sensor-based health monitoring platform that derives clinically meaningful indices from ambient lidar and radar signals — no wearables required. Where traditional digital health relies on what a person chooses to wear, Ambient Intelligence measures what a space observes: movement, gait, sleep, sedentary behavior, circadian rhythm, and fall risk, all inferred from point-cloud and height-signal data captured continuously in the background of daily life.
          </div>
        </section>

        {/* ── Section 2: Naming taxonomy ── */}
        <section id="taxonomy" style={{ marginBottom: 72 }}>
          <div className="section-head">
            <h2 className="section-title">Naming <em>Taxonomy</em></h2>
            <div className="section-meta">Four tiers · platform → index → metric → field</div>
          </div>

          {/* Tier 1 */}
          <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '32px 36px', marginBottom: 20 }}>
            <TierLabel>Tier 1 · Platform</TierLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                Ambient <em style={{ fontStyle: 'italic', color: C.text2 }}>Intelligence</em>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.text4, textAlign: 'right', maxWidth: 220, lineHeight: 1.7 }}>
                One global namespace.<br/>All composite indices derive from this root.
              </div>
            </div>
          </div>

          {/* Tier 2 */}
          <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '32px 36px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
              <TierLabel>Tier 2 · Domain Indices</TierLabel>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: C.text4, letterSpacing: '0.08em' }}>→ algorithmlab for interactive exploration</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {INDICES.map(idx => <IndexCard key={idx.name} {...idx} />)}
            </div>
          </div>

          {/* Tier 3 */}
          <div style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '32px 36px', marginBottom: 20 }}>
            <TierLabel>Tier 3 · Component Metrics</TierLabel>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.text3, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 2 }}>
              — ASTP · SATP · IS · IV · RA · M10/L5 · AGRU · SHAP · cadence · gait speed · step detection · step-time variability · TUG · METs · breaks/hour · LF/HF · Poincaré · stress index · TIR · AGP · CV% · MAGE · sleep architecture · SII · HRV · recovery · chronotype · fragmentation —
            </div>
          </div>

          {/* Tier 4 */}
          <div id="developer" style={{ background: C.s1, border: `1px solid ${C.line}`, borderRadius: 14, padding: '32px 36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: devOpen ? 28 : 0 }}>
              <TierLabel>Tier 4 · Raw Signal Fields</TierLabel>
              <button
                onClick={() => setDevOpen(o => !o)}
                style={{
                  fontFamily: 'var(--mono)', fontSize: 11, color: C.text3,
                  padding: '6px 14px', borderRadius: 999,
                  border: `1px solid ${C.lineS}`,
                  cursor: 'pointer', transition: 'color 0.15s',
                  letterSpacing: '0.06em',
                }}
              >
                For developers {devOpen ? '▲' : '▾'}
              </button>
            </div>
            {devOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.line}` }}>
                {/* header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 160px', gap: 24, padding: '10px 16px', background: C.s2, fontFamily: 'var(--mono)', fontSize: 9.5, color: C.text4, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  <div>Field name</div>
                  <div>Description</div>
                  <div>Formerly</div>
                </div>
                {RAW_FIELDS.map(f => (
                  <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 160px', gap: 24, padding: '14px 16px', background: C.bg, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.accent }}>{f.name}</div>
                    <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{f.desc}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.text4 }}>{f.prev ?? '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Positioning ── */}
        <section id="positioning" style={{ marginBottom: 72 }}>
          <div className="section-head">
            <h2 className="section-title">Market <em>Positioning</em></h2>
          </div>
          <div style={{
            background: C.s1,
            border: `1px solid ${C.line}`,
            borderLeft: `3px solid ${C.accent}`,
            borderRadius: 14,
            padding: '40px 44px',
          }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 22, fontStyle: 'italic', lineHeight: 1.65, color: C.text2, maxWidth: 700 }}>
              Apple Health has Cardio Fitness. Oura has Readiness. Whoop has Strain. Ambient Intelligence has a family of Ambient Indices — the same clinical-grade composites, derived passively from the environment instead of the wrist.
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 20 }}>
              {([
                ['Apple Health', 'Cardio Fitness', C.text4],
                ['Oura',         'Readiness',       C.text4],
                ['Whoop',        'Strain',          C.text4],
                ['Ambient',      'Ambient Indices', C.accent],
              ] as [string, string, string][]).map(([brand, metric, color]) => (
                <div key={brand} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.text4 }}>
                  <div style={{ color: C.text3, marginBottom: 4 }}>{brand}</div>
                  <div style={{ color }}>{metric}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="agent-note" style={{ marginTop: 48 }}>
          — Ambient Intelligence · Methodology · AmbientActivityIndex · AmbientSleepIndex · AmbientGaitIndex · AmbientSedentaryIndex · AmbientRecoveryIndex · AmbientCircadianIndex · AmbientMetabolicIndex · AmbientRiskIndex —
        </div>
      </main>
    </div>
  );
}
