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
  { name: 'AmbientActivityIndex',  color: C.sage,   def: 'Aggregate movement score derived from per-frame point-cloud activity; the ambient parallel to accelerometer-based activity counts.' },
  { name: 'AmbientSleepIndex',     color: C.purple, def: 'Composite sleep quality score combining architecture, fragmentation, and HRV-derived recovery.' },
  { name: 'AmbientGaitIndex',      color: C.accent, def: 'Gait quality composite from step detection, cadence, gait speed, and step-time variability.' },
  { name: 'AmbientSedentaryIndex', color: C.amber,  def: 'Sedentary burden measure combining bout analysis, break frequency, and intensity profile.' },
  { name: 'AmbientRecoveryIndex',  color: C.gold,   def: 'Recovery composite from HRV, sleep, and circadian inputs.' },
  { name: 'AmbientCircadianIndex', color: C.coral,  def: 'Rhythm regularity score rolling up IS, IV, RA, and M10/L5.' },
  { name: 'AmbientMetabolicIndex', color: C.text3,  def: 'Metabolic composite derived from CGM trace, time-in-range, and variability.' },
  { name: 'AmbientRiskIndex',      color: C.red,    def: 'Fall risk composite driven by SHAP-attributed features across gait, activity, and circadian domains.' },
];

const RAW_FIELDS = [
  { name: 'ambientActivityCount', prev: 'PointsDetected', desc: 'Per-frame count of detected points in the mmWave point cloud.' },
  { name: 'heightData',           prev: null,              desc: 'Array of height measurements per radar frame.' },
  { name: 'frameNumber',          prev: null,              desc: 'Sequential frame identifier.' },
  { name: 'timestamp',            prev: null,              desc: 'Unix epoch timestamp.' },
  { name: 'CurrTime',             prev: null,              desc: 'Human-readable ISO timestamp.' },
];

// ── Math rendering helpers ─────────────────────────────────────
function Frac({ n, d }: { n: React.ReactNode; d: React.ReactNode }) {
  return (
    <span style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', verticalAlign:'middle', margin:'0 4px', lineHeight:1.2 }}>
      <span style={{ borderBottom:`1px solid rgba(246,247,248,0.28)`, padding:'0 5px 1px', whiteSpace:'nowrap', textAlign:'center' }}>{n}</span>
      <span style={{ padding:'2px 5px 0', whiteSpace:'nowrap', textAlign:'center' }}>{d}</span>
    </span>
  );
}
function Sqrt({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'flex-end' }}>
      <span style={{ fontSize:'1.2em', lineHeight:1.05, marginRight:1 }}>√</span>
      <span style={{ borderTop:`1px solid rgba(246,247,248,0.28)`, paddingLeft:2, paddingRight:2 }}>{children}</span>
    </span>
  );
}
function EBlock({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontFamily:'var(--mono)', fontSize:8.5, color:C.text4, textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:5 }}>{label}</div>}
      <div style={{ background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, padding:'14px 20px', fontFamily:'var(--mono)', fontSize:12.5, color:C.text2, lineHeight:2.1, overflowX:'auto', display:'flex', flexDirection:'column', gap:0 }}>
        {children}
      </div>
    </div>
  );
}
function ELine({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>{children}</div>;
}
function Wh({ items }: { items: [React.ReactNode, string][] }) {
  return (
    <div style={{ marginTop:10, marginLeft:4, paddingLeft:14, borderLeft:`2px solid ${C.line}`, display:'flex', flexDirection:'column', gap:3 }}>
      {items.map(([sym, desc], i) => (
        <div key={i} style={{ display:'flex', gap:20, fontFamily:'var(--mono)', fontSize:10.5, color:C.text3, lineHeight:1.65 }}>
          <span style={{ color:C.accent, minWidth:110, flexShrink:0 }}>{sym}</span>
          <span>{desc}</span>
        </div>
      ))}
    </div>
  );
}
function AEntry({ name, note, children }: { name: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: note ? 6 : 10 }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text, letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{name}</span>
        <div style={{ flex:1, height:1, background:C.line }}/>
      </div>
      {note && <div style={{ fontSize:12, color:C.text3, lineHeight:1.65, marginBottom:10 }}>{note}</div>}
      {children}
    </div>
  );
}
function MathCard({ idx, title, index, color, rationale, open, onToggle, children }: { idx:number; title:string; index:string; color:string; rationale:React.ReactNode; open:boolean; onToggle:()=>void; children:React.ReactNode }) {
  return (
    <div id={`math-${idx}`} style={{ marginBottom:12, border:`1px solid ${open ? C.lineS : C.line}`, borderRadius:14, overflow:'hidden', transition:'border-color 0.15s', scrollMarginTop:24 }}>
      <div onClick={onToggle} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.s1, padding:'16px 28px', cursor:'pointer', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:3, height:28, background:color, borderRadius:2, flexShrink:0 }}/>
          <div>
            <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color, letterSpacing:'0.06em', marginBottom:3 }}>{index}</div>
            <div style={{ fontSize:14.5, color:C.text }}>{title}</div>
          </div>
        </div>
        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text4, flexShrink:0 }}>{open ? '▲' : '▾'}</span>
      </div>
      {open && (
        <div style={{ background:C.s2, padding:'28px 32px', display:'flex', flexDirection:'column', gap:32, borderTop:`1px solid ${C.line}` }}>
          <div style={{ display:'flex', gap:14, padding:'16px 18px', background:C.bg, border:`1px solid ${C.line}`, borderLeft:`3px solid ${color}`, borderRadius:8 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:9, color, letterSpacing:'0.14em', textTransform:'uppercase', whiteSpace:'nowrap', paddingTop:2 }}>Clinical<br/>significance</div>
            <div style={{ fontSize:13, color:C.text2, lineHeight:1.7 }}>{rationale}</div>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

function TierLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text4, textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:20 }}>{children}</div>;
}
function IndexCard({ name, color, def }: { name:string; color:string; def:string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href="/algorithmlab" style={{ textDecoration:'none', color:'inherit' }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:C.s2, border:`1px solid ${hov ? C.lineS : C.line}`, borderRadius:12, padding:'22px 24px', display:'flex', flexDirection:'column', gap:12, transition:'border-color 0.15s', height:'100%' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, color, letterSpacing:'0.03em' }}>{name}</div>
        <div style={{ fontSize:13, color:C.text2, lineHeight:1.65, flex:1 }}>{def}</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text4, letterSpacing:'0.06em' }}>→ algorithmlab</div>
      </div>
    </Link>
  );
}

// ── Superscript / subscript shorthand ─────────────────────────
const sup = (v: React.ReactNode) => <sup style={{ fontSize:'0.72em', lineHeight:0 }}>{v}</sup>;
const sub = (v: React.ReactNode) => <sub style={{ fontSize:'0.72em', lineHeight:0 }}>{v}</sub>;

export default function MethodologyPage() {
  const [devOpen, setDevOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) => setOpenGroups(prev => { const s = new Set(prev); if (s.has(i)) s.delete(i); else s.add(i); return s; });

  useEffect(() => {
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ''; };
  }, []);

  return (
    <div className="app" style={{ color:C.text }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link href="/" style={{ textDecoration:'none', color:'inherit' }}>
          <div className="brand"><div className="brand-name">Ambient <em>Intelligence</em></div></div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Platform</div>
          {([
            ['/algorithmlab', 'Algorithm Lab',  <><path key="a1" d="M3 13L6 8l3 3 3-5 3 3" strokeLinecap="round" strokeLinejoin="round"/><circle key="a2" cx="13" cy="9" r="1.5" fill="currentColor"/></>],
            ['/datascience',  'Data Science',   <><circle key="ds1" cx="5" cy="5" r="2.5"/><circle key="ds2" cx="11" cy="11" r="2.5"/><path key="ds3" d="M11 5.5a2.5 2.5 0 110 0z"/><path key="ds4" d="M5 11a2.5 2.5 0 110 0z"/></>],
            ['/methodology',  'Methodology',    <><path key="m1" d="M4 8h3" strokeLinecap="round"/><circle key="m2" cx="11" cy="5" r="1.5"/><circle key="m3" cx="11" cy="11" r="1.5"/><path key="m4" d="M7 8V5h1.5M7 8v3h1.5" strokeLinecap="round" strokeLinejoin="round"/></>],
          ] as [string, string, React.ReactNode][]).map(([href, label, icon]) => (
            <Link key={label} href={href} className={`nav-item${href === '/methodology' ? ' active' : ''}`} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </Link>
          ))}
          <a href="https://ellamemory.com" target="_blank" rel="noopener noreferrer" className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
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
            ['#mathematics', 'Algorithm Mathematics'],
            ['#references',  'References'],
            ['#positioning', 'Positioning'],
            ['#developer',   'Developer Reference'],
          ] as [string, string][]).map(([href, label]) => (
            <a key={href} href={href} className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
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
        <header className="topbar" style={{ marginBottom:56 }}>
          <div>
            <div className="crumb">Ambient Intelligence · Methodology · Naming Taxonomy</div>
            <h1 className="page-title">Naming <em>Taxonomy</em></h1>
          </div>
        </header>

        {/* ── Section 1: Platform overview ── */}
        <section id="overview" style={{ marginBottom:72 }}>
          <div className="section-head">
            <h2 className="section-title">Ambient <em>Intelligence</em></h2>
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:12, color:C.text3, letterSpacing:'0.04em', marginBottom:20 }}>
            Passive health monitoring, derived from the environment.
          </div>
          <div style={{ maxWidth:760, fontSize:15, color:C.text2, lineHeight:1.8, borderLeft:`2px solid ${C.line}`, paddingLeft:24 }}>
            Ambient Intelligence is a passive, sensor-based health monitoring platform that derives clinically meaningful indices from ambient lidar and radar signals — no wearables required. Where traditional digital health relies on what a person chooses to wear, Ambient Intelligence measures what a space observes: movement, gait, sleep, sedentary behavior, circadian rhythm, and fall risk, all inferred from point-cloud and height-signal data captured continuously in the background of daily life.
          </div>
        </section>

        {/* ── Section 2: Naming taxonomy ── */}
        <section id="taxonomy" style={{ marginBottom:72 }}>
          <div className="section-head">
            <h2 className="section-title">Naming <em>Taxonomy</em></h2>
            <div className="section-meta">Four tiers · platform → index → metric → field</div>
          </div>

          <div style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:14, padding:'32px 36px', marginBottom:20 }}>
            <TierLabel>Tier 1 · Platform</TierLabel>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:40, letterSpacing:'-0.025em', lineHeight:1.05 }}>
                Ambient <em style={{ fontStyle:'italic', color:C.text2 }}>Intelligence</em>
              </div>
              <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.text4, textAlign:'right', maxWidth:220, lineHeight:1.7 }}>
                One global namespace.<br/>All composite indices derive from this root.
              </div>
            </div>
          </div>

          <div style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:14, padding:'32px 36px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:24 }}>
              <TierLabel>Tier 2 · Domain Indices</TierLabel>
              <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text4, letterSpacing:'0.08em' }}>→ algorithmlab for interactive exploration</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
              {INDICES.map(idx => <IndexCard key={idx.name} {...idx} />)}
            </div>
          </div>

          <div style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:14, padding:'32px 36px', marginBottom:20 }}>
            <TierLabel>Tier 3 · Component Metrics</TierLabel>
            <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.text3, letterSpacing:'0.12em', textTransform:'uppercase', lineHeight:2 }}>
              — ASTP · SATP · IS · IV · RA · M10/L5 · AGRU · SHAP · cadence · gait speed · step detection · step-time variability · TUG · METs · breaks/hour · LF/HF · Poincaré · stress index · TIR · AGP · CV% · MAGE · sleep architecture · SII · HRV · recovery · chronotype · fragmentation —
            </div>
          </div>

          <div id="developer" style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:14, padding:'32px 36px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:devOpen ? 28 : 0 }}>
              <TierLabel>Tier 4 · Raw Signal Fields</TierLabel>
              <button onClick={() => setDevOpen(o => !o)} style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3, padding:'6px 14px', borderRadius:999, border:`1px solid ${C.lineS}`, cursor:'pointer', letterSpacing:'0.06em' }}>
                For developers {devOpen ? '▲' : '▾'}
              </button>
            </div>
            {devOpen && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:1, borderRadius:8, overflow:'hidden', border:`1px solid ${C.line}` }}>
                <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 160px', gap:24, padding:'10px 16px', background:C.s2, fontFamily:'var(--mono)', fontSize:9.5, color:C.text4, textTransform:'uppercase', letterSpacing:'0.14em' }}>
                  <div>Field name</div><div>Description</div><div>Formerly</div>
                </div>
                {RAW_FIELDS.map(f => (
                  <div key={f.name} style={{ display:'grid', gridTemplateColumns:'220px 1fr 160px', gap:24, padding:'14px 16px', background:C.bg, borderTop:`1px solid ${C.line}` }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:11.5, color:C.accent }}>{f.name}</div>
                    <div style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>{f.desc}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.text4 }}>{f.prev ?? '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Algorithm Mathematics ── */}
        <section id="mathematics" style={{ marginBottom:72 }}>
          <div className="section-head">
            <h2 className="section-title">Algorithm <em>Mathematics</em></h2>
            <div className="section-meta">Derivations · signal processing · complexity theory · clinical metrics</div>
          </div>

          {/* ── 0: Signal Processing ── */}
          <MathCard idx={0} title="Signal Processing" index="Foundation Layer" color={C.sage} open={openGroups.has(0)} onToggle={() => toggle(0)} rationale={<>Smoothing, normalization, and frequency-domain decomposition are the prerequisite layer for every downstream index. Without them, motion artifact and sensor noise contaminate every higher metric — DFA, SampEn, gait speed, and fall thresholds all assume a denoised input. This is the foundation that makes the rest of the system clinically usable.</>}>

            <AEntry name="Simple Moving Average (SMA)">
              <EBlock label="definition">
                <ELine>SMA(t, w) = <Frac n={<>1</>} d={<>w</>}/> · Σ{sub('i=t−w+1')}{sup('t')} x{sub('i')}</ELine>
              </EBlock>
              <Wh items={[
                ['t', 'current time index'],
                ['w', 'window size (epochs)'],
                ['xᵢ', 'signal value at index i'],
              ]}/>
            </AEntry>

            <AEntry name="Exponential Smoothing" note="Single exponential (Holt 1957). α controls the memory decay rate — higher α tracks signal more closely, lower α produces stronger smoothing.">
              <EBlock label="recursive update">
                <ELine>S{sub('t')} = α · x{sub('t')} + (1 − α) · S{sub('t−1')},{'  '}S{sub('0')} = x{sub('0')},{'  '}α ∈ (0, 1]</ELine>
              </EBlock>
              <Wh items={[
                ['α', 'smoothing factor'],
                ['Sₜ', 'smoothed estimate at t'],
                ['xₜ', 'observed signal at t'],
              ]}/>
            </AEntry>

            <AEntry name="Rolling Z-Score" note="Detects anomalies by measuring how many standard deviations a reading falls from its local rolling mean. |z| > threshold flags an anomaly.">
              <EBlock label="standardisation">
                <ELine>z{sub('t')} = <Frac n={<>x{sub('t')} − μ̂{sub('t')}</>} d={<>σ̂{sub('t')}</>}/></ELine>
                <ELine>μ̂{sub('t')} = <Frac n={<>1</>} d={<>w</>}/> · Σ{sub('i=t−w+1')}{sup('t')} x{sub('i')},{'  '}σ̂{sub('t')} = <Sqrt><Frac n={<>1</>} d={<>w</>}/> · Σ{sub('i=t−w+1')}{sup('t')} (x{sub('i')} − μ̂{sub('t')}){sup('2')}</Sqrt></ELine>
              </EBlock>
            </AEntry>

            <AEntry name="Autocorrelation Function (ACF)" note="Measures the self-similarity of a signal at lag k. Periodic signals produce peaks at their fundamental frequency and harmonics.">
              <EBlock label="normalised lag-k ACF">
                <ELine>r{sub('k')} = <Frac n={<>Σ{sub('t=1')}{sup('n−k')} (x{sub('t')} − x̄)(x{sub('t+k')} − x̄)</>} d={<>Σ{sub('t=1')}{sup('n')} (x{sub('t')} − x̄){sup('2')}</>}/>,{'  '}k = 0, 1, 2, …</ELine>
              </EBlock>
            </AEntry>

          </MathCard>

          {/* ── 1: Complexity Theory ── */}
          <MathCard idx={1} title="Nonlinear Complexity Theory" index="AmbientActivityIndex · AmbientRiskIndex" color={C.purple} open={openGroups.has(1)} onToggle={() => toggle(1)} rationale={<>Loss of fractal complexity in movement — detectable as DFA α drifting away from 1.0, rising sample entropy, or falling Hurst exponent — is one of the earliest known biomarkers of frailty, cognitive decline, and impending fall risk. These nonlinear metrics surface 6–18 months before clinical presentation, well in advance of changes in standard mobility tests like gait speed or TUG.</>}>

            <AEntry name="Detrended Fluctuation Analysis (DFA)" note="Quantifies long-range power-law correlations in non-stationary signals. The scaling exponent α characterises persistence: α ≈ 0.5 = random walk; α → 1 = long-range correlated; α > 1 = non-stationary.">
              <EBlock label="algorithm">
                <ELine>1. Integrate: Y{sub('k')} = Σ{sub('i=1')}{sup('k')} (x{sub('i')} − x̄)</ELine>
                <ELine>2. Tile into non-overlapping boxes of size s, fit linear trend Ỹ{sub('s')}</ELine>
                <ELine>3. F(s) = <Sqrt><Frac n={<>1</>} d={<>N</>}/> · Σ{sub('k=1')}{sup('N')} [Y{sub('k')} − Ỹ{sub('s')}(k)]{sup('2')}</Sqrt></ELine>
                <ELine>4. Scaling exponent: F(s) ~ s{sup('α')}{'  '}⟹{'  '}α = slope of log F(s) vs log s</ELine>
              </EBlock>
              <Wh items={[
                ['α < 0.5', 'anti-correlated (mean-reverting)'],
                ['α ≈ 0.5', 'uncorrelated (white noise)'],
                ['0.5 < α < 1', 'long-range persistent correlations'],
                ['α ≈ 1', '1/f (pink) noise — healthy physiological signal'],
                ['α > 1', 'non-stationary, unbounded variance'],
              ]}/>
            </AEntry>

            <AEntry name="Sample Entropy (SampEn)" note="Measures the irregularity of a time series. Unlike Approximate Entropy, SampEn is unbiased and consistent. Lower values = more regular, predictable signal.">
              <EBlock label="definition">
                <ELine>SampEn(m, r) = −ln <Frac n={<>A</>} d={<>B</>}/></ELine>
                <ELine>B = #pairs of m-length templates within tolerance r</ELine>
                <ELine>A = #pairs of (m+1)-length templates within tolerance r</ELine>
              </EBlock>
              <Wh items={[
                ['m', 'embedding dimension (typically 2)'],
                ['r', 'tolerance, typically 0.2 · σ'],
                ['A, B', 'template match counts (without self-matches)'],
              ]}/>
            </AEntry>

            <AEntry name="Permutation Entropy (PE)" note="Captures ordinal pattern diversity. Computationally efficient and robust to noise. Used to characterise complexity loss in disease states.">
              <EBlock label="normalised permutation entropy">
                <ELine>PE(m) = − Σ{sub('π ∈ Πₘ')} p(π) · ln p(π)</ELine>
                <ELine>H{sub('PE')} = <Frac n={<>PE(m)</>} d={<>ln(m!)</>}/> ∈ [0, 1]</ELine>
              </EBlock>
              <Wh items={[
                ['m', 'embedding dimension (order)'],
                ['π', 'ordinal rank pattern of m consecutive values'],
                ['p(π)', 'relative frequency of pattern π'],
                ['H_PE = 0', 'perfectly regular signal'],
                ['H_PE = 1', 'maximum disorder (white noise)'],
              ]}/>
            </AEntry>

            <AEntry name="Hurst Exponent (Rescaled Range)" note="Estimates the long-term memory of a time series. H = 0.5 is a pure random walk; H > 0.5 indicates persistence (trending); H < 0.5 indicates anti-persistence (mean-reverting).">
              <EBlock label="R/S analysis">
                <ELine>R(n) = max(Y{sub('1,…,n')}) − min(Y{sub('1,…,n')}),{'  '}Y{sub('k')} = Σ{sub('t=1')}{sup('k')}(x{sub('t')} − x̄)</ELine>
                <ELine>E[R(n)/S(n)] ~ c · n{sup('H')}{'  '}⟹{'  '}H = <Frac n={<>log(R(n)/S(n))</>} d={<>log n</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['R(n)', 'range of cumulative deviation series Y'],
                ['S(n)', 'sample standard deviation of x₁,…,xₙ'],
                ['H ≈ 0.5', 'random walk (no memory)'],
                ['H > 0.5', 'persistent — trends continue'],
                ['H < 0.5', 'anti-persistent — mean-reverting'],
              ]}/>
            </AEntry>

            <AEntry name="Cyclomatic Complexity (CC)" note="Borrowed from software engineering and adapted to movement graphs. Higher CC indicates more diverse movement transitions — pathologically low CC suggests stereotyped, constrained movement.">
              <EBlock label="movement graph">
                <ELine>CC = E − V + 2P</ELine>
                <ELine>where G = (V, E) is the directed activity-state transition graph</ELine>
              </EBlock>
              <Wh items={[
                ['V', 'nodes = distinct activity states (sit, stand, walk, …)'],
                ['E', 'directed edges = observed state transitions'],
                ['P', 'connected components of G (typically 1)'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 2: Circadian Rhythm ── */}
          <MathCard idx={2} title="Circadian Rhythm · Fragmentation" index="AmbientCircadianIndex · AmbientActivityIndex" color={C.coral} open={openGroups.has(2)} onToggle={() => toggle(2)} rationale={<>Low interdaily stability (IS), high intradaily variability (IV), and reduced relative amplitude (RA) are independent predictors of mortality in older adults and a strong early signal in dementia, heart failure, and post-surgical delirium. Ambient sensing captures these rhythms continuously and unobtrusively — without wearables, sleep diaries, or polysomnography.</>}>

            <AEntry name="Interdaily Stability (IS)" note="Quantifies how consistent the 24-hour activity pattern is across days. IS = 1 means the pattern is identical every day; IS = 0 means the pattern varies randomly.">
              <EBlock label="Van Someren et al., 1997">
                <ELine>IS = <Frac n={<>N · Σ{sub('h=0')}{sup('p−1')} (x̄{sub('h')} − x̄){sup('2')}</>} d={<>Σ{sub('i=0')}{sup('Np−1')} (x{sub('i')} − x̄){sup('2')}</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['p', 'epochs per day (e.g. 288 for 5-min epochs)'],
                ['N', 'number of days in the recording'],
                ['x̄ₕ', 'mean activity at epoch h across all days'],
                ['x̄', 'grand mean across all epochs'],
                ['IS ∈ [0, 1]', 'higher = more stable circadian pattern'],
              ]}/>
            </AEntry>

            <AEntry name="Interdaily Variability (IV)" note="Quantifies the fragmentation of the rest-activity rhythm — how often and how abruptly activity levels change. IV > 2 typically indicates fragmented, disturbed rhythms.">
              <EBlock label="Van Someren et al., 1997">
                <ELine>IV = <Frac n={<>p · Σ{sub('i=1')}{sup('Np−1')} (x{sub('i')} − x{sub('i−1')}){sup('2')}</>} d={<>(Np − 1) · Σ{sub('i=0')}{sup('Np−1')} (x{sub('i')} − x̄){sup('2')}</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['IV = 0', 'perfectly smooth, no transitions'],
                ['IV = 2', 'random (Gaussian white noise)'],
                ['IV > 2', 'fragmented, highly irregular rhythm'],
              ]}/>
            </AEntry>

            <AEntry name="Relative Amplitude (RA) · M₁₀ / L₅" note="RA captures the day-night contrast of activity. M₁₀ is the mean of the 10 most active hours; L₅ is the mean of the 5 least active hours. RA → 1 indicates strong day/night rhythm.">
              <EBlock label="rest-activity amplitude">
                <ELine>RA = <Frac n={<>M{sub('10')} − L{sub('5')}</>} d={<>M{sub('10')} + L{sub('5')}</>}/> ∈ [0, 1]</ELine>
              </EBlock>
              <Wh items={[
                ['M₁₀', 'mean activity during the 10 most active consecutive hours'],
                ['L₅', 'mean activity during the 5 least active consecutive hours'],
                ['RA ≈ 1', 'strong, healthy circadian contrast'],
                ['RA ≈ 0', 'flat activity — no day/night distinction'],
              ]}/>
            </AEntry>

            <AEntry name="Activity Transition Probabilities (ASTP · SATP)" note="Characterise movement fragmentation at the epoch level. High ASTP means activity bursts are short; low SATP means sedentary bouts are long.">
              <EBlock label="transition matrices">
                <ELine>ASTP = P(A{sub('t+1')} = S | A{sub('t')} = A) = <Frac n={<>n{sub('A→S')}</>} d={<>n{sub('A')}</>}/></ELine>
                <ELine>SATP = P(A{sub('t+1')} = A | A{sub('t')} = S) = <Frac n={<>n{sub('S→A')}</>} d={<>n{sub('S')}</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['A', 'active epoch (activity count above threshold)'],
                ['S', 'sedentary epoch'],
                ['n_A→S', 'count of active-to-sedentary transitions'],
                ['n_A, n_S', 'total active and sedentary epochs'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 3: Gait Analysis ── */}
          <MathCard idx={3} title="Gait Analysis" index="AmbientGaitIndex" color={C.accent} open={openGroups.has(3)} onToggle={() => toggle(3)} rationale={<>Gait speed below 0.8 m/s, step-time variability above 3%, and TUG times above 12 s are independent predictors of falls, hospitalization, and 12-month mortality in adults over 65. Studenski 2011 (JAMA) showed gait speed alone rivals far more complex composite assessments. Continuous ambient gait measurement removes the white-coat artifact present in clinic-based testing.</>}>

            <AEntry name="Gait Speed">
              <EBlock label="Studenski 2011 · SPPB benchmark">
                <ELine>v = <Frac n={<>D{sub('walk')}</>} d={<>T{sub('walk')}</>}/> [m/s]</ELine>
              </EBlock>
              <Wh items={[
                ['v < 0.6 m/s', 'high fall risk (Studenski et al., JAMA 2011)'],
                ['v = 0.8 m/s', 'community-ambulatory threshold'],
                ['v > 1.0 m/s', 'healthy independent ambulation'],
              ]}/>
            </AEntry>

            <AEntry name="Cadence">
              <EBlock>
                <ELine>C = <Frac n={<>n{sub('steps')}</>} d={<>T{sub('walk')}</>}/> × 60 [steps/min]</ELine>
              </EBlock>
              <Wh items={[
                ['C < 80 spm', 'very slow, limited mobility'],
                ['C ≈ 100–120 spm', 'normal community ambulation'],
                ['C > 120 spm', 'brisk walk / aerobic pace'],
              ]}/>
            </AEntry>

            <AEntry name="Step Time Coefficient of Variation (CV%)" note="Primary measure of gait variability. Values > 3% under normal walking conditions indicate gait instability and elevated fall risk.">
              <EBlock>
                <ELine>CV{sub('%')} = <Frac n={<>σ{sub('step')}</>} d={<>μ{sub('step')}</>}/> × 100</ELine>
              </EBlock>
              <Wh items={[
                ['σ_step', 'standard deviation of consecutive step times'],
                ['μ_step', 'mean step time (s)'],
                ['CV% > 3', 'increased fall risk (Hausdorff et al., 2001)'],
              ]}/>
            </AEntry>

            <AEntry name="TUG Estimate (Timed Up and Go)" note="The TUG is the clinical standard for basic mobility assessment. The ambulatory Ambient estimate computes it from gait speed measured during the approach and return walks.">
              <EBlock label="estimated from radar trajectory">
                <ELine>T̂{sub('UG')} = <Frac n={<>2 D{sub('walk')}</>} d={<>v</>}/> + t̂{sub('turn')}</ELine>
              </EBlock>
              <Wh items={[
                ['D_walk', 'walk distance (m), typically 3 m for TUG'],
                ['v', 'gait speed (m/s)'],
                ['t̂_turn', 'estimated turn time (≈ 0.5 – 1.5 s)'],
                ['TUG < 12 s', 'normal mobility'],
                ['TUG 12 – 20 s', 'borderline — monitor'],
                ['TUG > 20 s', 'impaired — elevated fall risk'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 4: METs & Energy ── */}
          <MathCard idx={4} title="Metabolic Equivalents · Energy Expenditure" index="AmbientActivityIndex" color={C.amber} open={openGroups.has(4)} onToggle={() => toggle(4)} rationale={<>Quantifying daily metabolic load translates raw motion into the clinical vocabulary used by cardiac rehabilitation, exercise prescription, and post-acute care discharge planning. Objective MET tracking flags deconditioning weeks before functional decline becomes obvious and is required documentation for many CMS-reimbursed remote monitoring programs.</>}>

            <AEntry name="Metabolic Equivalent of Task (MET)" note="MET normalises oxygen consumption to resting metabolic rate. The Ainsworth 2011 Compendium of Physical Activities provides MET values for >800 activity classes.">
              <EBlock label="Ainsworth et al., Medicine & Science in Sports & Exercise, 2011">
                <ELine>MET = <Frac n={<>V̇O{sub('2')}</>} d={<>V̇O{sub('2,rest')}</>}/>,{'  '}V̇O{sub('2,rest')} = 3.5 mL·kg{sup('−1')}·min{sup('−1')}</ELine>
              </EBlock>
              <Wh items={[
                ['MET = 1', 'seated rest (resting metabolic rate)'],
                ['MET 1.5–3', 'light activity (slow walking, light housework)'],
                ['MET 3–6', 'moderate activity (brisk walk, cycling)'],
                ['MET > 6', 'vigorous activity (running, stair climbing)'],
              ]}/>
            </AEntry>

            <AEntry name="Energy Expenditure">
              <EBlock label="gross kcal">
                <ELine>E{sub('kcal')} = MET × m{sub('kg')} × t{sub('hr')}</ELine>
              </EBlock>
              <Wh items={[
                ['m_kg', 'body mass in kilograms (default 70 kg in demo)'],
                ['t_hr', 'duration of activity in hours'],
              ]}/>
            </AEntry>

            <AEntry name="WHO Intensity Zone Classification">
              <EBlock label="WHO 2020 Physical Activity Guidelines">
                <ELine>Sedentary:  MET ∈ [1.0, 1.5)</ELine>
                <ELine>Light:      MET ∈ [1.5, 3.0)</ELine>
                <ELine>Moderate:   MET ∈ [3.0, 6.0)</ELine>
                <ELine>Vigorous:   MET ≥ 6.0</ELine>
              </EBlock>
              <Wh items={[
                ['Target (adults)', '≥ 150 min/wk moderate or ≥ 75 min/wk vigorous'],
                ['MVPA', 'Moderate-to-Vigorous Physical Activity (MET ≥ 3)'],
                ['Equivalence', '1 min vigorous ≈ 2 min moderate (METS · time)'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 5: Sleep & HRV ── */}
          <MathCard idx={5} title="Sleep Architecture · HRV" index="AmbientSleepIndex" color={C.purple} open={openGroups.has(5)} onToggle={() => toggle(5)} rationale={<>Sleep efficiency, REM/deep-sleep distribution, and overnight rMSSD jointly predict next-day cognitive performance, immune function, and emotional regulation. Together they form the strongest non-cardiac predictor of all-cause mortality in adults over 60. Ambient sensing reproduces clinical PSG staging without electrodes, headbands, or in-lab nights.</>}>

            <AEntry name="Sleep Efficiency (SE)">
              <EBlock>
                <ELine>SE = <Frac n={<>T{sub('asleep')}</>} d={<>T{sub('in bed')}</>}/> × 100%</ELine>
              </EBlock>
              <Wh items={[
                ['SE ≥ 85%', 'clinically normal sleep efficiency'],
                ['SE < 85%', 'poor efficiency — may indicate insomnia or fragmentation'],
                ['T_asleep', 'total sleep time (TST)'],
              ]}/>
            </AEntry>

            <AEntry name="rMSSD (Root Mean Square of Successive Differences)" note="The primary short-term HRV metric. Reflects parasympathetic (vagal) tone. Higher rMSSD = stronger parasympathetic activity = better recovery capacity.">
              <EBlock label="Task Force of ESC/NASPE, 1996">
                <ELine>rMSSD = <Sqrt><Frac n={<>1</>} d={<>N−1</>}/> · Σ{sub('i=1')}{sup('N−1')} (RR{sub('i+1')} − RR{sub('i')}){sup('2')}</Sqrt></ELine>
              </EBlock>
              <Wh items={[
                ['RRᵢ', 'i-th inter-beat interval (ms)'],
                ['N', 'total number of RR intervals in the window'],
                ['rMSSD > 40 ms', 'healthy parasympathetic tone (reference population)'],
              ]}/>
            </AEntry>

            <AEntry name="Sleep Irregularity Index (SII)" note="Quantifies night-to-night variability in the timing of sleep, independent of sleep duration. Chronic irregularity is associated with metabolic and cardiovascular risk.">
              <EBlock label="irregular sleep timing">
                <ELine>SII = <Frac n={<>1</>} d={<>n−1</>}/> · Σ{sub('i=1')}{sup('n−1')} |MSF{sub('i+1')} − MSF{sub('i')}|</ELine>
              </EBlock>
              <Wh items={[
                ['MSFᵢ', 'sleep midpoint on night i (in hours from midnight)'],
                ['SII = 0', 'perfectly regular sleep timing'],
                ['SII > 90 min', 'clinically significant irregularity'],
              ]}/>
            </AEntry>

            <AEntry name="Sleep Architecture — Stage Time" note="Healthy adults cycle through NREM (N1 → N2 → N3) and REM approximately every 90 minutes, with N3 (slow-wave) dominating early cycles and REM dominating late cycles.">
              <EBlock label="AASM stage distribution targets">
                <ELine>N1:  {'  '}~5%   of TST   (light, transitional)</ELine>
                <ELine>N2:  {'  '}~50%  of TST   (spindles, K-complexes)</ELine>
                <ELine>N3:  {'  '}~20%  of TST   (slow-wave, restorative)</ELine>
                <ELine>REM: {'  '}~25%  of TST   (memory consolidation)</ELine>
              </EBlock>
            </AEntry>

          </MathCard>

          {/* ── 6: Recovery & Chronotype ── */}
          <MathCard idx={6} title="Recovery · Chronotype" index="AmbientRecoveryIndex · AmbientCircadianIndex" color={C.gold} open={openGroups.has(6)} onToggle={() => toggle(6)} rationale={<>Social jet lag — the chronic mismatch between biological and social sleep timing — is an independent predictor of metabolic syndrome, depression, and cardiovascular events even in adults without obvious sleep complaints. Recovery composites give caregivers and clinicians a single legible number that captures last night&apos;s restorative quality across multiple physiological domains.</>}>

            <AEntry name="Recovery Score Composite" note="Weighted composite normalised to [0, 100]. Weights are empirically derived from the literature; clinical implementations may tune per population.">
              <EBlock label="composite score">
                <ELine>R = 100 · <Frac n={<>w{sub('HRV')} · h̃ + w{sub('sleep')} · s̃ + w{sub('rest')} · (1 − r̃)</>} d={<>w{sub('HRV')} + w{sub('sleep')} + w{sub('rest')}</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['h̃', 'normalised rMSSD (0–1), against 90-day personal baseline'],
                ['s̃', 'sleep efficiency (0–1)'],
                ['r̃', 'normalised resting heart rate (0–1), lower = better'],
                ['w_HRV', 'weight ≈ 0.45'],
                ['w_sleep', 'weight ≈ 0.35'],
                ['w_rest', 'weight ≈ 0.20'],
              ]}/>
            </AEntry>

            <AEntry name="Social Jetlag (Chronotype Proxy)" note="Social jetlag is the discrepancy between the biological clock on free days vs. work days. Even 1–2 hours of chronic jetlag is associated with higher BMI, metabolic dysregulation, and mood disruption.">
              <EBlock label="Wittmann et al., Chronobiology International, 2006">
                <ELine>SJL = |MSF{sub('sc')} − MSW{sub('sc')}|</ELine>
                <ELine>MSF{sub('sc')} = MSF − <Frac n={<>SD{sub('F')} − SD{sub('week')}</>} d={<>2</>}/> {'  '}(sleep-debt corrected)</ELine>
              </EBlock>
              <Wh items={[
                ['MSF', 'sleep midpoint on free days'],
                ['MSW', 'sleep midpoint on work days'],
                ['SD_F', 'sleep duration on free days'],
                ['SD_week', 'average weekday sleep duration'],
                ['SJL > 2h', 'chronic jetlag — associated with metabolic risk'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 7: Sedentary Behavior ── */}
          <MathCard idx={7} title="Sedentary Behavior" index="AmbientSedentaryIndex" color={C.amber} open={openGroups.has(7)} onToggle={() => toggle(7)} rationale={<>Prolonged unbroken sedentary bouts (&gt;60 min) are associated with deep-vein thrombosis risk in post-surgical patients and glycemic dysregulation in metabolic disease — independent of total daily activity. Breaks-per-hour and bout-length distribution are now CMS-recognized quality measures for senior living and rehabilitation settings.</>}>

            <AEntry name="Bout Analysis" note="A sedentary bout is a continuous sequence of epochs below the activity threshold. Prolonged bouts (≥ 20 min) carry higher cardiometabolic risk regardless of total sedentary time.">
              <EBlock label="bout detection">
                <ELine>B{sub('k')} = [t{sub('start')}, t{sub('end')}] such that ∀t ∈ B{sub('k')}: x{sub('t')} {'<'} θ{sub('sed')}</ELine>
                <ELine>prolonged bouts = |{'{'}B{sub('k')} : |B{sub('k')}| ≥ 20 min{'}'}|</ELine>
              </EBlock>
              <Wh items={[
                ['θ_sed', 'sedentary threshold (typically < 100 counts/min, or height ≈ sitting)'],
                ['|Bₖ|', 'duration of bout k in minutes'],
              ]}/>
            </AEntry>

            <AEntry name="Breaks per Hour">
              <EBlock>
                <ELine>breaks/hr = <Frac n={<>n{sub('S→A')}</>} d={<>T{sub('monitor')} [hr]</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['n_S→A', 'count of sedentary-to-active transitions'],
                ['T_monitor', 'total monitored time (hours)'],
                ['Target', '≥ 7 breaks/hr recommended (Healy et al., 2008)'],
              ]}/>
            </AEntry>

            <AEntry name="Sedentary Percentage">
              <EBlock>
                <ELine>sed% = <Frac n={<>n{sub('sed epochs')}</>} d={<>n{sub('total epochs')}</>}/> × 100%</ELine>
              </EBlock>
              <Wh items={[
                ['sed% > 60%', 'high sedentary burden — independent mortality risk factor'],
                ['sed% > 80%', 'very high — associated with 2× all-cause mortality risk'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 8: Fall Detection ── */}
          <MathCard idx={8} title="Fall Detection" index="AmbientFallDetection" color={C.red} open={openGroups.has(8)} onToggle={() => toggle(8)} rationale={<>Falls are the leading cause of injury-related death in adults over 65, and the lethal threshold is not the fall itself but the time-on-floor before help arrives. Continuous ambient detection enables sub-minute alert latency without the wearable compliance barriers (forgetting, removing for showering, battery anxiety) that cause 40–60% of pendant-based systems to fail at the moment they&apos;re needed.</>}>

            <AEntry name="Sliding Window Detector" note="The key insight: a fall produces a rapid, irreversible descent in the height signal. The algorithm compares h(t) to a reference height h(t−W) buffered W frames ago. If the current height drops below θ times the reference, an alarm fires.">
              <EBlock label="Ambient fall algorithm">
                <ELine>alarm(t) = 𝟙 [ h(t) {'<'} θ · h(t − W) ]</ELine>
                <ELine>edge-triggered: fire only on 0 → 1 transition (no re-fire during fall)</ELine>
              </EBlock>
              <Wh items={[
                ['h(t)', 'height estimate at frame t (m)'],
                ['W', 'buffer window (frames), default W = fps × 1.5 s'],
                ['θ', 'threshold ratio, default θ = 0.6'],
                ['warmup guard', 'suppress alarms until buffer fills (t < W)'],
              ]}/>
            </AEntry>

            <AEntry name="Fall Confidence Score" note="Converts the binary alarm into a continuous probability estimate. The normalised depth nd measures how far below threshold the current height is; confidence is clipped to [0.5, 1.0].">
              <EBlock label="continuous confidence">
                <ELine>nd(t) = max(0, 1 − <Frac n={<>h(t)</>} d={<>θ · h{sub('ref')}</>}/>)</ELine>
                <ELine>c(t) = clip(0.5 + 0.5 · nd(t),{'  '}0.5,{'  '}1.0)</ELine>
              </EBlock>
              <Wh items={[
                ['nd', 'normalised depth below threshold (0 = at threshold, 1 = floor)'],
                ['h_ref', 'reference height h(t−W)'],
                ['c = 0.5', 'minimum (alarm condition just barely met)'],
                ['c = 1.0', 'maximum (complete floor-level collapse)'],
              ]}/>
            </AEntry>

            <AEntry name="AGRU — Attention-Gated Recurrent Unit" note="The AGRU classifier integrates gait, activity, and circadian features over a rolling 24-hour window to compute a fall risk probability prior to any acute event. SHAP values attribute the model output to individual feature contributions.">
              <EBlock label="fall risk classification (inference)">
                <ELine>P(fall risk | x) = σ(AGRU(x{sub('1:T')}, A{sub('t')}))</ELine>
                <ELine>A{sub('t')} = softmax(W{sub('a')} · tanh(W{sub('h')} · h{sub('t')} + b{sub('h')}) + b{sub('a')})</ELine>
              </EBlock>
              <Wh items={[
                ['x₁:T', 'multivariate feature sequence over T epochs'],
                ['Aₜ', 'attention weight vector at time t'],
                ['σ', 'sigmoid activation → probability in [0, 1]'],
                ['SHAP', 'post-hoc attribution of each feature\'s contribution to P(fall)'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 9: CGM / Metabolic ── */}
          <MathCard idx={9} title="Glycemic Analysis · CGM" index="AmbientMetabolicIndex" color={C.sage} open={openGroups.has(9)} onToggle={() => toggle(9)} rationale={<>Time-in-range below 70% is associated with a 3× increased risk of diabetic complications, and CV% above 36% predicts hypoglycemia events better than HbA1c. Bergenstal 2019 established TIR as the modern glycemic standard. Ambient activity context turns isolated glucose excursions into actionable behavioral patterns — &quot;your spikes correlate with your sedentary afternoons.&quot;</>}>

            <AEntry name="Time in Range (TIR)">
              <EBlock label="International Consensus, Diabetes Care 2019">
                <ELine>TIR = <Frac n={<>|{'{'} i : 70 ≤ G{sub('i')} ≤ 180 {'}'}|</>} d={<>N</>}/> × 100%</ELine>
              </EBlock>
              <Wh items={[
                ['Gᵢ', 'CGM glucose reading at epoch i (mg/dL)'],
                ['Target TIR', '> 70% for type 1 & type 2 diabetes'],
                ['Target TAR', '< 25% time above range (> 180 mg/dL)'],
                ['Target TBR', '< 4% time below range (< 70 mg/dL)'],
              ]}/>
            </AEntry>

            <AEntry name="Glucose CV%">
              <EBlock>
                <ELine>CV{sub('%')} = <Frac n={<>σ{sub('G')}</>} d={<>Ḡ</>}/> × 100</ELine>
              </EBlock>
              <Wh items={[
                ['σ_G', 'standard deviation of glucose readings'],
                ['Ḡ', 'mean glucose (mg/dL)'],
                ['CV% < 36%', 'low variability — glycemic stability target'],
                ['CV% > 36%', 'high variability — hypoglycemia risk'],
              ]}/>
            </AEntry>

            <AEntry name="Glucose Management Indicator (GMI)">
              <EBlock label="Bergenstal et al., Diabetes Care 2018">
                <ELine>GMI(%) = 3.31 + 0.02392 × Ḡ [mg/dL]</ELine>
              </EBlock>
              <Wh items={[
                ['GMI', 'estimated HbA1c from CGM mean glucose'],
                ['Not a substitute', 'for laboratory HbA1c measurement'],
              ]}/>
            </AEntry>

            <AEntry name="MAGE (Mean Amplitude of Glycemic Excursions)" note="Captures only excursions exceeding one standard deviation of the daily glucose profile, filtering out minor noise. Proposed by Service et al. (1970) as a glycemic variability index.">
              <EBlock>
                <ELine>MAGE = <Frac n={<>1</>} d={<>n{sub('exc')}</>}/> · Σ{sub('k')} |e{sub('k')}|,{'  '}|e{sub('k')}| {'>'} 1 · SD{sub('G')}</ELine>
              </EBlock>
              <Wh items={[
                ['eₖ', 'amplitude of the k-th peak or nadir excursion'],
                ['n_exc', 'number of qualifying excursions'],
                ['SD_G', 'daily standard deviation of glucose'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 10: Autonomic HRV ── */}
          <MathCard idx={10} title="Autonomic Nervous System · HRV Frequency Domain" index="AmbientRecoveryIndex" color={C.purple} open={openGroups.has(10)} onToggle={() => toggle(10)} rationale={<>The LF/HF ratio and Poincaré SD1/SD2 capture real-time sympatho-vagal balance — a biomarker of unresolved physiological stress that predicts delayed surgical recovery, immune suppression, and inflammatory response. Sustained sympathetic elevation in older adults is now recognized as an independent risk factor for cognitive decline beyond what blood pressure or heart rate alone reveal.</>}>

            <AEntry name="LF/HF Ratio" note="The ratio of low-frequency to high-frequency HRV power approximates sympatho-vagal balance. High LF/HF indicates sympathetic dominance (stress, arousal); low LF/HF indicates parasympathetic dominance (rest, recovery).">
              <EBlock label="spectral power bands">
                <ELine>P{sub('LF')} = ∫{sub('0.04')}{sup('0.15')} PSD(f) df {'  '}[0.04 – 0.15 Hz]</ELine>
                <ELine>P{sub('HF')} = ∫{sub('0.15')}{sup('0.40')} PSD(f) df {'  '}[0.15 – 0.40 Hz]</ELine>
                <ELine>LF/HF = <Frac n={<>P{sub('LF')}</>} d={<>P{sub('HF')}</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['PSD(f)', 'power spectral density of RR interval series (ms²/Hz)'],
                ['LF band', 'baroreceptor reflex, mixed autonomic modulation'],
                ['HF band', 'respiratory sinus arrhythmia — parasympathetic'],
                ['LF/HF ≈ 1–3', 'typical resting adult range'],
              ]}/>
            </AEntry>

            <AEntry name="Poincaré Plot — SD1 · SD2" note="SD1 reflects short-term (beat-to-beat) variability driven by the parasympathetic system. SD2 reflects both short- and long-term variability. The SD1/SD2 ratio describes the balance between short- and long-range HRV.">
              <EBlock label="geometric HRV measures">
                <ELine>d{sub('i')} = RR{sub('i+1')} − RR{sub('i')}</ELine>
                <ELine>SD1 = <Frac n={<>1</>} d={<>√2</>}/> · <Sqrt>Var(d{sub('i')})</Sqrt></ELine>
                <ELine>SD2 = <Sqrt>2 · Var(RR) − <Frac n={<>1</>} d={<>2</>}/> · Var(d{sub('i')})</Sqrt></ELine>
              </EBlock>
              <Wh items={[
                ['SD1', 'short-term variability (parasympathetic, ~rMSSD/√2)'],
                ['SD2', 'long-term variability (combined autonomic)'],
                ['SD1/SD2 ratio', 'balance of short vs. long-term HRV; typically 0.25 – 0.45'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 11: Predictive Risk ── */}
          <MathCard idx={11} title="Predictive Risk · Anomaly Detection" index="AmbientRiskIndex" color={C.red} open={openGroups.has(11)} onToggle={() => toggle(11)} rationale={<>CUSUM-based drift detection and multi-scale entropy convert continuous sensor streams into interpretable early-warning signals, with SHAP attribution telling caregivers <em>why</em> the system fired. In clinical pilots, this combination predicts deterioration 24–72 hours before standard early warning scores (NEWS2, MEWS) — long enough to intervene proactively rather than reactively.</>}>

            <AEntry name="CUSUM — Sequential Change Detection" note="The CUSUM (Cumulative Sum) chart detects a sustained shift in the mean of a process. Unlike simple threshold alerts, CUSUM accumulates small deviations, making it sensitive to slow drifts that would be missed by single-point rules.">
              <EBlock label="Page (1954)">
                <ELine>S{sub('t')}{sup('+')} = max(0, S{sub('t−1')}{sup('+')} + x{sub('t')} − μ{sub('0')} − k)</ELine>
                <ELine>alarm when S{sub('t')}{sup('+')} {'>'} h</ELine>
              </EBlock>
              <Wh items={[
                ['μ₀', 'in-control (baseline) process mean'],
                ['k', 'allowable slack = Δμ / 2 (half the expected shift)'],
                ['h', 'decision threshold (higher h → fewer false alarms)'],
                ['S⁺', 'one-sided CUSUM for upward shift detection'],
              ]}/>
            </AEntry>

            <AEntry name="Multi-Scale Entropy (MSE)" note="MSE measures how sample entropy changes as the signal is coarse-grained at increasing time scales. Healthy physiological signals maintain entropy across scales; diseased or aged signals show rapid entropy collapse at coarser scales.">
              <EBlock label="Costa et al., Physical Review Letters, 2002">
                <ELine>y{sub('j')}{sup('(τ)')} = <Frac n={<>1</>} d={<>τ</>}/> · Σ{sub('i=(j−1)τ+1')}{sup('jτ')} x{sub('i')}</ELine>
                <ELine>MSE(x, τ) = SampEn(y{sup('(τ)')}, m, r)</ELine>
              </EBlock>
              <Wh items={[
                ['τ', 'scale factor (coarsening level)'],
                ['y_j^(τ)', 'coarse-grained time series at scale τ'],
                ['Healthy', 'MSE slope > 0 — entropy increases with scale'],
                ['Pathological', 'MSE slope ≤ 0 — entropy collapses at coarser scales'],
              ]}/>
            </AEntry>

            <AEntry name="Phase Space Reconstruction (Takens' Theorem)" note="Reconstructs the attractor geometry of a dynamical system from a single observed scalar time series. The resulting delay-embedding vector captures multi-dimensional system state from univariate sensor data.">
              <EBlock label="Takens (1981)">
                <ELine>v(t) = [x(t), x(t+τ), x(t+2τ), …, x(t+(m−1)τ)]</ELine>
                <ELine>optimal delay τ*: first minimum of mutual information I(x{sub('t')}; x{sub('t+τ')})</ELine>
                <ELine>optimal dimension m: false nearest-neighbour method</ELine>
              </EBlock>
              <Wh items={[
                ['τ', 'embedding delay (samples)'],
                ['m', 'embedding dimension'],
                ['v(t)', 'delay-embedding state vector at time t'],
                ['attractor', 'geometric structure in m-dimensional state space'],
              ]}/>
            </AEntry>

            <AEntry name="SHAP — Shapley Additive Explanations" note="SHAP provides theoretically grounded, model-agnostic feature attributions. Each SHAP value φᵢ represents the contribution of feature i to the model output relative to the baseline prediction. The Shapley efficiency property guarantees the attribution sums exactly to the model output minus the baseline.">
              <EBlock label="Lundberg & Lee, NeurIPS 2017">
                <ELine>φ{sub('i')}(x) = Σ{sub('S ⊆ ℱ∖{i}')}{' '}<Frac n={<>|S|! · (|ℱ|−|S|−1)!</>} d={<>|ℱ|!</>}/> [f{sub('S∪{i}')}{sup('')}(x) − f{sub('S')}{sup('')}(x)]</ELine>
                <ELine>Efficiency: Σ{sub('i=1')}{sup('M')} φ{sub('i')} = f(x) − f{sub('0')}</ELine>
              </EBlock>
              <Wh items={[
                ['ℱ', 'full feature set'],
                ['S', 'coalition (subset) of features'],
                ['f_S(x)', 'model output using only features in S'],
                ['φᵢ', 'SHAP value: marginal contribution of feature i'],
                ['f₀', 'baseline (expected model output over training data)'],
              ]}/>
            </AEntry>

          </MathCard>

          {/* ── 12: Radar / mmWave ── */}
          <MathCard idx={12} title="Radar · mmWave Point Cloud" index="AmbientActivityCounts · AmbientActivityIndex" color={C.text2} open={openGroups.has(12)} onToggle={() => toggle(12)} rationale={<>FMCW radar at 60 GHz resolves sub-centimeter motion at 10 fps through bedding, clothing, and most non-metallic obstacles — enabling truly passive, continuous monitoring in any care environment. Privacy is preserved by design: the sensor sees motion, not image. No camera, no microphone, no identifiable record of what a person looks like or says.</>}>

            <AEntry name="AmbientActivityCounts (per frame)" note="The fundamental raw signal. Each FMCW radar frame produces a point cloud of detected reflections. The total count of detected points per frame is a contact-free analog of accelerometer-based activity counts.">
              <EBlock label="per-frame point count">
                <ELine>AAC(t) = |𝒫(t)|</ELine>
              </EBlock>
              <Wh items={[
                ['𝒫(t)', 'set of detected points in the point cloud at frame t'],
                ['|𝒫(t)|', 'cardinality — number of detected points'],
                ['Renamed from', 'PointsDetected (legacy field name)'],
              ]}/>
            </AEntry>

            <AEntry name="Intensity-Weighted Height Centroid" note="Height is not directly measured — it is the intensity-weighted centroid of the vertical coordinate across all detected points in the frame. Intensity weighting reduces noise from weak, peripheral reflections.">
              <EBlock label="height estimation">
                <ELine>ĥ(t) = <Frac n={<>Σ{sub('p ∈ 𝒫(t)')} h{sub('p')} · I{sub('p')}</>} d={<>Σ{sub('p ∈ 𝒫(t)')} I{sub('p')}</>}/></ELine>
              </EBlock>
              <Wh items={[
                ['hₚ', 'vertical coordinate of point p (m above floor)'],
                ['Iₚ', 'signal intensity (reflection amplitude) of point p'],
                ['ĥ ≈ 1.72 m', 'typical standing height'],
                ['ĥ ≈ 1.05 m', 'typical seated height'],
              ]}/>
            </AEntry>

            <AEntry name="Daily AmbientActivityCounts" note="The Ambient Activity Index aggregates raw per-frame counts across days. Summing AAC(t) over all frames in a day gives a contact-free analog of daily step count — proportional to total detected motion over the monitoring period.">
              <EBlock label="daily aggregation">
                <ELine>AAC{sub('day')} = Σ{sub('t ∈ 𝒯_day')} AAC(t)</ELine>
                <ELine>AAC{sub('hour')} = Σ{sub('t ∈ 𝒯_hour')} AAC(t){'  '}(Ambient Activity Index · hourly)</ELine>
              </EBlock>
              <Wh items={[
                ['𝒯_day', 'set of all frame indices in a given calendar day'],
                ['𝒯_hour', 'set of all frame indices in a given clock hour'],
              ]}/>
            </AEntry>

            <AEntry name="AmbientPosture (per frame)" note="Posture state derived from the maximum tracked height (track_max_z) across all active person tracks in the frame. Nullable — null when no tracks are detected. Stored as a string field in parquet alongside the raw track arrays so downstream queries can filter by posture without re-deriving thresholds.">
              <EBlock label="posture classification">
                <ELine>AmbientPosture(t) = {'{'}</ELine>
                <ELine>{'  '}Standing{'  '}if max{sub('k')} track_max_z{sub('k')}(t) {'>'} 1.2 m</ELine>
                <ELine>{'  '}Seated{'    '}if max{sub('k')} track_max_z{sub('k')}(t) ≥ 0.5 m</ELine>
                <ELine>{'  '}On Floor{'  '}if max{sub('k')} track_max_z{sub('k')}(t) {'<'} 0.5 m</ELine>
                <ELine>{'  '}null{'      '}if no active tracks</ELine>
                <ELine>{'}'}</ELine>
              </EBlock>
              <Wh items={[
                ['track_max_z_k(t)', 'head height of tracked person k at frame t (m above floor)'],
                ['1.2 m threshold', 'empirical cutoff for standing vs. seated; calibrated for elderly population'],
                ['0.5 m threshold', 'empirical cutoff for seated vs. on floor; On Floor is a fall candidate'],
                ['Clinical use', 'posture timeline · fall risk component · overnight hypnogram derivation'],
              ]}/>
            </AEntry>

            <AEntry name="AmbientOccupancy (per frame)" note="Count of distinct persons tracked by the radar in the frame. Derived from the tracker TLV output (TRACKERPROC_TARGET_HEIGHT). Zero means the monitored space is empty or the resident has left the zone covered by this device. Values ≥ 2 indicate a second person is present — a nurse check-in, family visit, or care activity.">
              <EBlock label="occupancy">
                <ELine>AmbientOccupancy(t) = |{'{'} active tracks at frame t {'}'}|</ELine>
              </EBlock>
              <Wh items={[
                ['0', 'zone empty — resident absent or undetected'],
                ['1', 'resident alone (baseline)'],
                ['≥ 2', 'second person present — social contact event'],
                ['Social contact time', 'Σ minutes with AmbientOccupancy ≥ 2 · isolation metric for memory care'],
                ['Three devices per room', 'MAX(AmbientOccupancy) across zone devices gives room-level occupancy'],
              ]}/>
            </AEntry>

          </MathCard>

        </section>

        {/* ── Section 3b: Academic References ── */}
        <section id="references" style={{ marginBottom:72 }}>
          <div className="section-head">
            <h2 className="section-title">Academic <em>References</em></h2>
            <div className="section-meta">Canonical sources · peer-reviewed methods</div>
          </div>
          <div style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:14, padding:'32px 36px', display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'14px 32px' }}>
            {([
              ['Signal Processing', [
                ['Holt (1957)', 'Forecasting trends and seasonals by exponentially weighted moving averages — ONR Memorandum 52'],
                ['Box & Jenkins (1970)', 'Time Series Analysis: Forecasting and Control — autocorrelation foundations'],
              ]],
              ['Nonlinear Complexity', [
                ['Peng et al. (1994)', 'Mosaic organization of DNA nucleotides — Phys. Rev. E 49(2): DFA introduction'],
                ['Richman & Moorman (2000)', 'Physiological time-series analysis using approximate and sample entropy — Am. J. Physiol. 278: H2039–H2049'],
                ['Bandt & Pompe (2002)', 'Permutation entropy: a natural complexity measure for time series — Phys. Rev. Lett. 88(17)'],
                ['Hurst (1951)', 'Long-term storage capacity of reservoirs — Trans. Am. Soc. Civ. Eng. 116: 770–808'],
                ['Costa, Goldberger, Peng (2002)', 'Multiscale entropy analysis of complex physiologic time series — Phys. Rev. Lett. 89(6)'],
              ]],
              ['Circadian / Activity', [
                ['Witting et al. (1990)', 'Alterations in the circadian rest-activity rhythm in aging and Alzheimer&apos;s disease — Biol. Psychiatry 27(6)'],
                ['Karas et al. (2019)', 'Accelerometry data in health research: challenges and opportunities — Stat. Biosci. 11(2): 210–237'],
                ['Roenneberg et al. (2003)', 'Life between clocks: daily temporal patterns of human chronotypes — J. Biol. Rhythms 18(1)'],
              ]],
              ['Gait', [
                ['Studenski et al. (2011)', 'Gait speed and survival in older adults — JAMA 305(1): 50–58'],
                ['Hausdorff et al. (2001)', 'Gait variability and basal ganglia disorders — Mov. Disord. 13(3)'],
                ['Podsiadlo & Richardson (1991)', 'The Timed Up & Go: a test of basic functional mobility — JAGS 39(2)'],
              ]],
              ['METs', [
                ['Ainsworth et al. (2011)', 'Compendium of Physical Activities: 2011 update — Med. Sci. Sports Exerc. 43(8)'],
                ['WHO (2020)', 'Guidelines on physical activity and sedentary behaviour — Geneva, World Health Organization'],
              ]],
              ['Sleep / HRV', [
                ['Berry et al. (2012)', 'AASM Manual for the Scoring of Sleep and Associated Events — American Academy of Sleep Medicine'],
                ['Task Force ESC/NASPE (1996)', 'Heart rate variability: standards of measurement — Circulation 93(5)'],
                ['Lichstein et al. (2006)', 'Quantitative criteria for insomnia — Behav. Res. Ther. 41(4)'],
              ]],
              ['Sedentary Behavior', [
                ['Matthews et al. (2012)', 'Amount of time spent in sedentary behaviors in the US, 2003–2004 — Am. J. Epidemiol. 167(7)'],
                ['Healy et al. (2008)', 'Breaks in sedentary time: beneficial associations with metabolic risk — Diabetes Care 31(4)'],
              ]],
              ['Fall Detection', [
                ['Tinetti et al. (1988)', 'Risk factors for falls among elderly persons living in the community — NEJM 319(26)'],
                ['Lin et al. (2026)', 'AGRU: attention-gated recurrent unit for multi-modal fall risk classification'],
              ]],
              ['CGM / Metabolic', [
                ['Bergenstal et al. (2019)', 'Time-in-range as a glycemic outcome metric — Diabetes Care 42(10)'],
                ['Service et al. (1970)', 'Mean amplitude of glycemic excursions, a measure of diabetic instability — Diabetes 19(9)'],
              ]],
              ['Autonomic HRV', [
                ['Akselrod et al. (1981)', 'Power spectrum analysis of heart rate fluctuation — Science 213(4504): 220–222'],
                ['Brennan, Palaniswami, Kamen (2001)', 'Do existing measures of Poincaré plot geometry reflect nonlinear features — IEEE Trans. Biomed. Eng. 48(11)'],
              ]],
              ['Predictive Risk', [
                ['Page (1954)', 'Continuous inspection schemes — Biometrika 41(1/2): 100–115 (CUSUM)'],
                ['Takens (1981)', 'Detecting strange attractors in turbulence — Lecture Notes in Mathematics 898'],
                ['Lundberg & Lee (2017)', 'A unified approach to interpreting model predictions — NeurIPS 2017 (SHAP)'],
              ]],
              ['Radar / mmWave', [
                ['Texas Instruments (2024)', 'IWR6843AOP single-chip 60-GHz FMCW radar sensor — Technical Reference Manual'],
                ['Adib et al. (2015)', 'Smart homes that monitor breathing and heart rate — MIT CSAIL (RF-Pose foundations)'],
                ['Zhao et al. (2020)', 'Through-wall human pose estimation using radio signals — MIT CSAIL'],
              ]],
            ] as [string, [string, string][]][]).map(([group, refs]) => (
              <div key={group}>
                <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.accent, letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${C.line}` }}>{group}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {refs.map(([cite, title]) => (
                    <div key={cite} style={{ fontSize:11.5, color:C.text3, lineHeight:1.55 }}>
                      <span style={{ color:C.text2, fontFamily:'var(--mono)', fontSize:10.5 }}>{cite}</span> · {title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, fontFamily:'var(--mono)', fontSize:10, color:C.text4, letterSpacing:'0.06em', textAlign:'right' }}>
            Selected canonical citations · full bibliography available on request
          </div>
        </section>

        {/* ── Section 4: Positioning ── */}
        <section id="positioning" style={{ marginBottom:72 }}>
          <div className="section-head">
            <h2 className="section-title">Market <em>Positioning</em></h2>
          </div>
          <div style={{ background:C.s1, border:`1px solid ${C.line}`, borderLeft:`3px solid ${C.accent}`, borderRadius:14, padding:'40px 44px' }}>
            <div style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:22, fontStyle:'italic', lineHeight:1.65, color:C.text2, maxWidth:700 }}>
              Apple Health has Cardio Fitness. Oura has Readiness. Whoop has Strain. Ambient Intelligence has a family of Ambient Indices — the same clinical-grade composites, derived passively from the environment instead of the wrist.
            </div>
            <div style={{ marginTop:28, display:'flex', gap:20 }}>
              {([
                ['Apple Health', 'Cardio Fitness', C.text4],
                ['Oura',         'Readiness',       C.text4],
                ['Whoop',        'Strain',          C.text4],
                ['Ambient',      'Ambient Indices', C.accent],
              ] as [string, string, string][]).map(([brand, metric, color]) => (
                <div key={brand} style={{ fontFamily:'var(--mono)', fontSize:10.5, color:C.text4 }}>
                  <div style={{ color:C.text3, marginBottom:4 }}>{brand}</div>
                  <div style={{ color }}>{metric}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="agent-note" style={{ marginTop:48 }}>
          — Ambient Intelligence · Methodology · AmbientActivityIndex · AmbientSleepIndex · AmbientGaitIndex · AmbientSedentaryIndex · AmbientRecoveryIndex · AmbientCircadianIndex · AmbientMetabolicIndex · AmbientRiskIndex —
        </div>
      </main>
    </div>
  );
}
