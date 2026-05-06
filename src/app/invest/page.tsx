'use client';
import { useId } from 'react';
import Link from 'next/link';

// ── Inline SVG chart helpers ──────────────────────────────────────────────────

function toPoints(values: number[], w: number, h: number, max: number) {
  return values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
}

function VitalsTrend() {
  const id = useId();
  const g1 = `vt-g1-${id}`;
  const g2 = `vt-g2-${id}`;
  const a = [42, 58, 53, 67, 61, 75, 68, 82, 77, 89, 72, 80, 86, 78, 91];
  const b = [30, 38, 34, 44, 40, 52, 47, 59, 54, 63, 50, 57, 62, 55, 67];
  const w = 400; const h = 90; const max = 100;
  const pa = toPoints(a, w, h, max);
  const pb = toPoints(b, w, h, max);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:'100%', height:'100%', display:'block' }}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D72D2" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2D72D2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3DCC91" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3DCC91" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pa} ${w},${h}`} fill={`url(#${g1})`} />
      <polyline points={pa} fill="none" stroke="#2D72D2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${h} ${pb} ${w},${h}`} fill={`url(#${g2})`} />
      <polyline points={pb} fill="none" stroke="#3DCC91" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
    </svg>
  );
}

function AnomalyChart() {
  const id = useId();
  const gid = `an-g-${id}`;
  const base = [48, 51, 49, 52, 50, 53, 51, 49, 52, 50, 51, 50, 48, 52, 51];
  const pts = base.map((v, i) => i === 9 ? 79 : i === 10 ? 83 : v);
  const w = 400; const h = 90; const max = 100;
  const path = toPoints(pts, w, h, max);
  const markers = [9, 10].map(i => ({
    cx: (i / (pts.length - 1)) * w,
    cy: h - ((pts[i] ?? 0) / max) * h,
  }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:'100%', height:'100%', display:'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(246,247,248,0.08)" />
          <stop offset="100%" stopColor="rgba(246,247,248,0)" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline points={path} fill="none" stroke="rgba(246,247,248,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {markers.map((m, i) => (
        <circle key={i} cx={m.cx} cy={m.cy} r="4.5" fill="#FF6B6B" stroke="#1C2127" strokeWidth="2" />
      ))}
    </svg>
  );
}

function ActivityHeatmap() {
  const seed = [
    [0.1,0.2,0.3,0.5,0.8,0.9,0.7,0.6,0.5,0.7,0.8,0.6,0.4,0.2],
    [0.05,0.1,0.2,0.4,0.7,0.95,0.9,0.8,0.7,0.85,0.9,0.7,0.3,0.15],
    [0.1,0.15,0.25,0.45,0.75,0.85,0.8,0.75,0.65,0.8,0.85,0.65,0.35,0.1],
    [0.08,0.12,0.22,0.42,0.72,0.82,0.78,0.72,0.62,0.78,0.82,0.62,0.32,0.12],
    [0.05,0.1,0.18,0.35,0.65,0.78,0.72,0.65,0.55,0.72,0.78,0.58,0.28,0.1],
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      {seed.map((row, r) => (
        <div key={r} style={{ display:'flex', gap:3 }}>
          {row.map((v, c) => (
            <div key={c} style={{ flex:1, aspectRatio:'1', borderRadius:2, background:`rgba(45,114,210,${(0.08 + v * 0.82).toFixed(2)})` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CircleGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const id = useId();
  const r = 26; const circ = 2 * Math.PI * r; const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <svg key={id} width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 34 34)" />
        <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="600" fill="#F6F7F8" fontFamily="var(--mono)">{value}%</text>
      </svg>
      <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
    </div>
  );
}

function ReturnChart() {
  const bars = [
    { label:'Seed Post-Money', amount:'$12M', pct:8, color:'#4A5568', note:'2026 · Baseline' },
    { label:'Series A Pre-Money', amount:'$35M', pct:23, color:'#2D72D2', note:'~18 months · ~3× seed' },
    { label:'5-Year Exit Target', amount:'$150M+', pct:100, color:'#3DCC91', note:'Acquisition / IPO · 12–15× seed' },
  ];
  return (
    <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:14, padding:'28px 32px' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
              <span style={{ fontSize:13, color:'var(--text-2)' }}>{b.label}</span>
              <span style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--mono)' }}>{b.note}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:b.color }}>{b.amount}</span>
              </span>
            </div>
            <div style={{ height:10, background:'var(--surface-2)', borderRadius:5, overflow:'hidden' }}>
              <div style={{ width:`${b.pct}%`, height:'100%', background:b.color, borderRadius:5, opacity:0.85, transition:'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11.5, color:'var(--text-3)', marginTop:20, marginBottom:0, lineHeight:1.6 }}>
        Series A and exit figures are forward-looking estimates based on comparable digital health and medtech transactions. Not a guarantee of returns.
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvestPage() {
  return (
    <div style={{ background:'var(--bg)', color:'var(--text)', fontFamily:'var(--sans)', minHeight:'100vh' }}>

      {/* ── NAV ── */}
      <nav style={{ position:'sticky', top:0, zIndex:50, borderBottom:'1px solid var(--line)', background:'rgba(28,33,39,0.92)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', padding:'0 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:400, letterSpacing:'-0.01em' }}>
              Ambient <em style={{ fontStyle:'italic', color:'var(--text-2)', fontWeight:300 }}>Intelligence</em>
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {[
              { id:'platform', label:'Platform' },
              { id:'pilot', label:'Pilot' },
              { id:'ip', label:'Patent IP' },
              { id:'engineering', label:'Engineering' },
              { id:'backing', label:'Backed' },
              { id:'raise', label:'Raise' },
            ].map(s => (
              <a key={s.id} href={`#${s.id}`} className="invest-nav-link">{s.label}</a>
            ))}
            <a href="#contact" className="btn btn-light" style={{ padding:'7px 18px', fontSize:12.5 }}>Connect</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', overflow:'hidden', borderBottom:'1px solid var(--line)', padding:'80px 44px 72px' }}>
        <div style={{ pointerEvents:'none', position:'absolute', inset:0, opacity:0.025,
          backgroundImage:'linear-gradient(rgba(246,247,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(246,247,248,1) 1px, transparent 1px)',
          backgroundSize:'48px 48px' }} />
        {/* motion graphic: aurora orbs + sensor network */}
        <div style={{ pointerEvents:'none', position:'absolute', inset:0, overflow:'hidden' }}>
          <div className="animate-hero-orb-1" style={{ position:'absolute', left:'-8%', top:'-40%', width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,114,210,0.22) 0%, transparent 65%)', filter:'blur(90px)' }} />
          <div className="animate-hero-orb-2" style={{ position:'absolute', bottom:'-30%', right:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,60,200,0.17) 0%, transparent 65%)', filter:'blur(90px)' }} />
          <div className="animate-hero-orb-3" style={{ position:'absolute', right:0, top:'20%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(20,160,160,0.14) 0%, transparent 65%)', filter:'blur(90px)' }} />
          <svg style={{ position:'absolute', width:'100%', height:'100%' }} viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <style>{`
              /* faint permanent backbone */
              .sb { stroke: rgba(246,247,248,1); stroke-width: 0.5; fill: none; opacity: 0.05; }
              /* traveling spark — short dash, huge gap so only one visible at a time */
              .sl { stroke: rgba(246,247,248,1); stroke-width: 1.1; fill: none; stroke-dasharray: 18 600; }
              .sl1  { animation: sp 7.0s linear infinite;                         opacity: 0.22; }
              .sl2  { animation: sp 9.5s linear infinite; animation-delay:-3.1s;  opacity: 0.18; }
              .sl3  { animation: sp 6.2s linear infinite; animation-delay:-1.4s;  opacity: 0.24; }
              .sl4  { animation: sp 8.8s linear infinite; animation-delay:-5.2s;  opacity: 0.18; }
              .sl5  { animation: sp 8.0s linear infinite; animation-delay:-2.7s;  opacity: 0.20; }
              .sl6  { animation: sp 6.8s linear infinite; animation-delay:-0.9s;  opacity: 0.22; }
              .sl7  { animation: sp 9.2s linear infinite; animation-delay:-4.5s;  opacity: 0.20; }
              .sl8  { animation: sp 7.4s linear infinite; animation-delay:-1.8s;  opacity: 0.18; }
              .sl9  { animation: sp 8.3s linear infinite; animation-delay:-6.1s;  opacity: 0.20; }
              .sl10 { animation: sp 6.5s linear infinite; animation-delay:-2.3s;  opacity: 0.22; }
              @keyframes sp { from { stroke-dashoffset: 618; } to { stroke-dashoffset: 0; } }
              /* static nodes */
              .sn { fill: rgba(246,247,248,1); opacity: 0.12; }
            `}</style>
            {/* backbone */}
            <line x1="180" y1="140" x2="520" y2="100" className="sb" />
            <line x1="180" y1="140" x2="380" y2="340" className="sb" />
            <line x1="520" y1="100" x2="720" y2="260" className="sb" />
            <line x1="380" y1="340" x2="720" y2="260" className="sb" />
            <line x1="520" y1="100" x2="880" y2="120" className="sb" />
            <line x1="720" y1="260" x2="880" y2="120" className="sb" />
            <line x1="720" y1="260" x2="1060" y2="380" className="sb" />
            <line x1="880" y1="120" x2="1200" y2="180" className="sb" />
            <line x1="1060" y1="380" x2="1200" y2="180" className="sb" />
            <line x1="1200" y1="180" x2="1350" y2="320" className="sb" />
            {/* sparks */}
            <line x1="180" y1="140" x2="520" y2="100" className="sl sl1" />
            <line x1="180" y1="140" x2="380" y2="340" className="sl sl2" />
            <line x1="520" y1="100" x2="720" y2="260" className="sl sl3" />
            <line x1="380" y1="340" x2="720" y2="260" className="sl sl4" />
            <line x1="520" y1="100" x2="880" y2="120" className="sl sl5" />
            <line x1="720" y1="260" x2="880" y2="120" className="sl sl6" />
            <line x1="720" y1="260" x2="1060" y2="380" className="sl sl7" />
            <line x1="880" y1="120" x2="1200" y2="180" className="sl sl8" />
            <line x1="1060" y1="380" x2="1200" y2="180" className="sl sl9" />
            <line x1="1200" y1="180" x2="1350" y2="320" className="sl sl10" />
            {/* nodes */}
            <circle cx="180"  cy="140" r="2.5" className="sn" />
            <circle cx="380"  cy="340" r="2"   className="sn" />
            <circle cx="520"  cy="100" r="2.5" className="sn" />
            <circle cx="720"  cy="260" r="3"   className="sn" />
            <circle cx="880"  cy="120" r="2.5" className="sn" />
            <circle cx="1060" cy="380" r="2"   className="sn" />
            <circle cx="1200" cy="180" r="3"   className="sn" />
            <circle cx="1350" cy="320" r="2"   className="sn" />
          </svg>
        </div>
        <div style={{ maxWidth:1280, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:999, border:'1px solid var(--line-strong)', background:'var(--surface-1)', marginBottom:24 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--sage)', boxShadow:'0 0 0 3px rgba(61,204,145,0.18)' }} />
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.14em' }}>Pilot Ready · Minneapolis · Summer 2026</span>
          </div>
          <h1 className="page-title" style={{ marginBottom:20, fontSize:'clamp(36px,5vw,64px)' }}>
            Ambient Intelligence<br /><em>the Future of Memory Care</em>
          </h1>
          <p style={{ maxWidth:600, fontSize:17, lineHeight:1.65, color:'var(--text-2)', marginBottom:40 }}>
            We transform ordinary care environments into intelligent, sensor-rich ecosystems —
            continuously monitoring patient wellbeing through ambient AI and IoT, without disrupting
            the human moments that matter most.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
            <a href="#platform" className="btn btn-light" style={{ padding:'11px 22px', fontSize:13.5, borderRadius:999 }}>Explore the Platform →</a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost" style={{ padding:'11px 22px', fontSize:13.5, borderRadius:999 }}>Visit Ella Memory</a>
          </div>
          <div style={{ marginTop:56, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, maxWidth:800 }}>
            {[
              { value:'PCT', label:'Patent Filed', sub:'University of Minnesota OTC' },
              { value:'2026', label:'Pilot Launch', sub:'Minneapolis, MN' },
              { value:'24/7', label:'Passive Monitoring', sub:'No wearables required' },
              { value:'AI', label:'Native Architecture', sub:'ML at every layer' },
            ].map(s => (
              <div key={s.value} style={{ padding:'18px 20px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:12 }}>
                <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:36, letterSpacing:'-0.03em', margin:'0 0 4px', lineHeight:1 }}>{s.value}</p>
                <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-2)', margin:'0 0 3px' }}>{s.label}</p>
                <p style={{ fontSize:11.5, color:'var(--text-3)', margin:0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEVIN ELLICH PERSONAL ── */}
      <section style={{ position:'relative', overflow:'hidden', height:340, borderBottom:'1px solid var(--line)', padding:'0 44px' }}>
        {/* Page background — blends seamlessly */}
        <div style={{ position:'absolute', inset:0, background:'var(--bg)' }} />
        {/* Soft blue orb behind the pulse point */}
        <div style={{ pointerEvents:'none', position:'absolute', right:'20%', top:'50%',
          transform:'translateY(-50%)', width:340, height:340, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(45,114,210,0.09) 0%, transparent 65%)',
          filter:'blur(50px)' }} />

        {/* Topographic contour — mathematical visualization */}
        <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
          viewBox="0 0 1440 340" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            .teb { fill:none; stroke:rgba(246,247,248,0.9); }
            .te0 { fill:none; stroke:rgba(45,114,210,0.76); stroke-dasharray:14 96;   animation:te0a  5s linear infinite; }
            .te1 { fill:none; stroke:rgba(45,114,210,0.68); stroke-dasharray:14 195;  animation:te1a  7s linear infinite; animation-delay:-2.1s; }
            .te2 { fill:none; stroke:rgba(45,114,210,0.61); stroke-dasharray:14 302;  animation:te2a  9s linear infinite; animation-delay:-4.3s; }
            .te3 { fill:none; stroke:rgba(45,114,210,0.55); stroke-dasharray:14 414;  animation:te3a 11s linear infinite; animation-delay:-1.7s; }
            .te4 { fill:none; stroke:rgba(45,114,210,0.49); stroke-dasharray:14 544;  animation:te4a 13s linear infinite; animation-delay:-6.5s; }
            .te5 { fill:none; stroke:rgba(45,114,210,0.43); stroke-dasharray:14 690;  animation:te5a 16s linear infinite; animation-delay:-3.2s; }
            .te6 { fill:none; stroke:rgba(45,114,210,0.37); stroke-dasharray:14 854;  animation:te6a 19s linear infinite; animation-delay:-8.1s; }
            .te7 { fill:none; stroke:rgba(45,114,210,0.31); stroke-dasharray:14 1037; animation:te7a 23s linear infinite; animation-delay:-5.4s; }
            @keyframes te0a { from{stroke-dashoffset:110;}  to{stroke-dashoffset:0;} }
            @keyframes te1a { from{stroke-dashoffset:209;}  to{stroke-dashoffset:0;} }
            @keyframes te2a { from{stroke-dashoffset:316;}  to{stroke-dashoffset:0;} }
            @keyframes te3a { from{stroke-dashoffset:428;}  to{stroke-dashoffset:0;} }
            @keyframes te4a { from{stroke-dashoffset:558;}  to{stroke-dashoffset:0;} }
            @keyframes te5a { from{stroke-dashoffset:704;}  to{stroke-dashoffset:0;} }
            @keyframes te6a { from{stroke-dashoffset:868;}  to{stroke-dashoffset:0;} }
            @keyframes te7a { from{stroke-dashoffset:1051;} to{stroke-dashoffset:0;} }
            .wr { fill:none; stroke:rgba(45,114,210,0.65); stroke-width:1;
                  transform-box:fill-box; transform-origin:center; }
            .wr1 { animation:wrp 4.8s ease-out infinite; }
            .wr2 { animation:wrp 4.8s ease-out infinite; animation-delay:-1.6s; }
            .wr3 { animation:wrp 4.8s ease-out infinite; animation-delay:-3.2s; }
            @keyframes wrp {
              0%   { transform:scale(0.2); opacity:0.6; }
              100% { transform:scale(6.5); opacity:0; }
            }
            .wca { animation:wcap 3.0s ease-in-out infinite; }
            @keyframes wcap { 0%,100% { opacity:0.85; } 50% { opacity:0.35; } }
          `}</style>

          {/* Mathematical field — faint iso-curves spanning full width */}
          <path d="M 0,82 Q 105,62 210,82 T 420,82 T 630,82 T 840,82 T 1050,82 T 1260,82 T 1470,82"
            fill="none" stroke="rgba(246,247,248,0.9)" strokeWidth="0.45" opacity="0.03"/>
          <path d="M 0,148 Q 120,133 240,148 T 480,148 T 720,148 T 960,148 T 1200,148 T 1440,148"
            fill="none" stroke="rgba(246,247,248,0.9)" strokeWidth="0.5"  opacity="0.04"/>
          <path d="M 0,205 Q 95,229 190,205 T 380,205 T 570,205 T 760,205 T 950,205 T 1140,205 T 1330,205 T 1520,205"
            fill="none" stroke="rgba(246,247,248,0.9)" strokeWidth="0.45" opacity="0.03"/>
          <path d="M 0,268 Q 113,280 225,268 T 450,268 T 675,268 T 900,268 T 1125,268 T 1350,268 T 1575,268"
            fill="none" stroke="rgba(246,247,248,0.9)" strokeWidth="0.4"  opacity="0.03"/>

          {/* Topographic contour backbones — 8 nested tilted ellipses (outermost → innermost) */}
          <ellipse cx="1060" cy="170" rx="196" ry="136" transform="rotate(-38,1060,170)"
            className="teb" strokeWidth="0.5"  opacity="0.055"/>
          <ellipse cx="1060" cy="170" rx="162" ry="112" transform="rotate(18,1060,170)"
            className="teb" strokeWidth="0.5"  opacity="0.065"/>
          <ellipse cx="1060" cy="170" rx="132" ry="90"  transform="rotate(-28,1060,170)"
            className="teb" strokeWidth="0.55" opacity="0.075"/>
          <ellipse cx="1060" cy="170" rx="104" ry="72"  transform="rotate(42,1060,170)"
            className="teb" strokeWidth="0.55" opacity="0.085"/>
          <ellipse cx="1060" cy="170" rx="80"  ry="55"  transform="rotate(-10,1060,170)"
            className="teb" strokeWidth="0.6"  opacity="0.09"/>
          <ellipse cx="1060" cy="170" rx="58"  ry="42"  transform="rotate(35,1060,170)"
            className="teb" strokeWidth="0.6"  opacity="0.10"/>
          <ellipse cx="1060" cy="170" rx="38"  ry="28"  transform="rotate(-20,1060,170)"
            className="teb" strokeWidth="0.65" opacity="0.11"/>
          <ellipse cx="1060" cy="170" rx="20"  ry="15"  transform="rotate(15,1060,170)"
            className="teb" strokeWidth="0.65" opacity="0.12"/>

          {/* Traveling sparks — one per contour ring, each orbiting its own ellipse */}
          <ellipse cx="1060" cy="170" rx="20"  ry="15"  transform="rotate(15,1060,170)"  className="te0" strokeWidth="2.5"/>
          <ellipse cx="1060" cy="170" rx="38"  ry="28"  transform="rotate(-20,1060,170)" className="te1" strokeWidth="2.2"/>
          <ellipse cx="1060" cy="170" rx="58"  ry="42"  transform="rotate(35,1060,170)"  className="te2" strokeWidth="2.0"/>
          <ellipse cx="1060" cy="170" rx="80"  ry="55"  transform="rotate(-10,1060,170)" className="te3" strokeWidth="1.8"/>
          <ellipse cx="1060" cy="170" rx="104" ry="72"  transform="rotate(42,1060,170)"  className="te4" strokeWidth="1.6"/>
          <ellipse cx="1060" cy="170" rx="132" ry="90"  transform="rotate(-28,1060,170)" className="te5" strokeWidth="1.4"/>
          <ellipse cx="1060" cy="170" rx="162" ry="112" transform="rotate(18,1060,170)"  className="te6" strokeWidth="1.2"/>
          <ellipse cx="1060" cy="170" rx="196" ry="136" transform="rotate(-38,1060,170)" className="te7" strokeWidth="1.0"/>

          {/* Sonar pulse */}
          <circle cx="1060" cy="170" r="26" className="wr wr1"/>
          <circle cx="1060" cy="170" r="26" className="wr wr2"/>
          <circle cx="1060" cy="170" r="26" className="wr wr3"/>
          <circle cx="1060" cy="170" r="10" fill="rgba(45,114,210,0.14)"/>
          <circle cx="1060" cy="170" r="6"  fill="#2D72D2" opacity="0.78" className="wca"/>
          <circle cx="1060" cy="170" r="2.5" fill="rgba(246,247,248,0.92)"/>
        </svg>

        {/* Left fade — text stays readable, waves emerge to the right */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to right, var(--bg) 30%, transparent 74%)' }} />

        {/* Text — aligned with page content grid (padding on section, not inner div) */}
        <div style={{ position:'relative', height:'100%', maxWidth:1280, margin:'0 auto',
          display:'flex', alignItems:'center' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)',
                display:'inline-block', boxShadow:'0 0 0 3px rgba(45,114,210,0.22)' }} />
              <span style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase',
                letterSpacing:'0.18em', color:'var(--accent)', opacity:0.88 }}>
                Investor Presentation · Prepared Exclusively For
              </span>
            </div>
            <h2 style={{ fontFamily:'var(--serif)', fontWeight:300,
              fontSize:'clamp(44px, 5vw, 72px)', letterSpacing:'-0.03em',
              color:'var(--text)', margin:'0 0 14px', lineHeight:1 }}>
              Kevin Ellich
            </h2>
            <div style={{ width:56, height:2,
              background:'linear-gradient(90deg, #2D72D2, rgba(45,114,210,0.22))',
              borderRadius:1, marginBottom:22 }} />
            <p style={{ fontSize:15, color:'var(--text-2)', lineHeight:1.65,
              marginBottom:26, maxWidth:440 }}>
              A complete investor brief for Ambient Intelligence — ambient IoT and AI for memory care,
              prepared for your review.
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['Seed Round · $2M', 'Minneapolis · 2026', 'PCT Protected', 'Confidential'].map(tag => (
                <span key={tag} style={{ padding:'5px 13px', borderRadius:999,
                  background:'rgba(45,114,210,0.1)', border:'1px solid rgba(45,114,210,0.22)',
                  fontFamily:'var(--mono)', fontSize:11, color:'rgba(45,114,210,0.9)',
                  letterSpacing:'0.04em' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OPPORTUNITY ── */}
      <section style={{ borderBottom:'1px solid var(--line)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>The Opportunity</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>
            <div>
              <h2 className="section-title" style={{ fontSize:32, marginBottom:16 }}>
                Care is falling behind<br /><em>the data it generates</em>
              </h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)', marginBottom:20 }}>
                Modern care facilities produce vast streams of environmental and behavioral signals —
                yet the tools to interpret them remain manual, fragmented, and delayed. Ambient Intelligence
                closes that gap with continuous, passive AI at the point of care.
              </p>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)' }}>
                We don&apos;t add burden to nursing staff — we reduce it. Every insight surfaces only when
                it matters, informed by each resident&apos;s personal behavioral baseline built over months
                of continuous observation.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { icon:'◉', color:'#2D72D2', title:'Passive Sensing', body:'Room-level IoT sensors capture motion, audio events, and behavioral patterns — no buttons, no wearables.' },
                { icon:'◈', color:'#3DCC91', title:'ML Inference', body:'On-device and cloud models detect anomalies, predict risk, and surface early warnings before events escalate.' },
                { icon:'◎', color:'#FFC940', title:'Nurse-Centered', body:'Every alert and dashboard view is filtered through clinical workflow — designed with nurses, for nurses.' },
                { icon:'◆', color:'#FF6B6B', title:'PHI by Design', body:'Subject-coded pipelines enforce identity separation at the SDK layer. Compliance built in, not bolted on.' },
              ].map(c => (
                <div key={c.title} style={{ padding:'20px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:12 }}>
                  <span style={{ fontSize:18, color:c.color }}>{c.icon}</span>
                  <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', margin:'10px 0 6px' }}>{c.title}</p>
                  <p style={{ fontSize:13, lineHeight:1.6, color:'var(--text-2)', margin:0 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM ── */}
      <section id="platform" style={{ borderBottom:'1px solid var(--line)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>Flagship Product</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'start' }}>
            <div>
              <h2 className="section-title" style={{ fontSize:36, marginBottom:16 }}>Ella Memory</h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)', marginBottom:20 }}>
                Ella Memory is our patient-facing intelligent care companion — a purpose-built platform
                that continuously observes, learns, and communicates meaningful patterns to care teams in real time.
                Available at{' '}
                <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer"
                  style={{ color:'var(--accent)', textDecoration:'none', borderBottom:'1px solid rgba(45,114,210,0.4)' }}>
                  ellamemory.com
                </a>.
              </p>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 28px', display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  'Ambient room sensors — no cameras, no wearables',
                  'Nurse dashboard with prioritized resident list and live vitals',
                  'Behavioral trend analysis over days, weeks, and months',
                  'Secure, coded data pipeline with PHI isolation by design',
                  'Mobile-ready clinical interface for on-the-go care teams',
                ].map(item => (
                  <li key={item} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:'var(--text-2)' }}>
                    <span style={{ color:'var(--sage)', marginTop:2, flexShrink:0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer"
                className="btn btn-light" style={{ fontSize:13 }}>Visit Ella Memory →</a>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="chart-card" style={{ margin:0, padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <p className="chart-title" style={{ fontSize:16 }}>Resident Vitals — Live Feed</p>
                    <p style={{ fontSize:12, color:'var(--text-3)', margin:'2px 0 0', fontFamily:'var(--mono)' }}>Activity index + rest quality</p>
                  </div>
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--mono)', fontSize:11, color:'var(--sage)' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--sage)', display:'inline-block' }} />
                    Active
                  </span>
                </div>
                <div style={{ height:90 }}><VitalsTrend /></div>
                <div style={{ display:'flex', gap:18, marginTop:12, paddingTop:12, borderTop:'1px solid var(--line)' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>
                    <span style={{ width:16, height:2, background:'#2D72D2', borderRadius:2, display:'inline-block' }} /> Activity Index
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>
                    <span style={{ width:16, height:2, background:'#3DCC91', borderRadius:2, display:'inline-block', opacity:0.7 }} /> Rest Quality
                  </span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="chart-card" style={{ margin:0, padding:18 }}>
                  <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:10 }}>Anomaly Detection</p>
                  <div style={{ height:72 }}><AnomalyChart /></div>
                  <p style={{ fontSize:11, color:'var(--text-3)', marginTop:8, fontFamily:'var(--mono)' }}>Z-score threshold events</p>
                </div>
                <div className="chart-card" style={{ margin:0, padding:18 }}>
                  <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:10 }}>Activity Heatmap</p>
                  <div style={{ paddingTop:4 }}><ActivityHeatmap /></div>
                  <p style={{ fontSize:11, color:'var(--text-3)', marginTop:8, fontFamily:'var(--mono)' }}>14-day behavioral grid</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[
                  { v:'< 2s', l:'Avg. Response' },
                  { v:'99.9%', l:'Uptime SLA' },
                  { v:'12', l:'Residents/Node' },
                ].map(m => (
                  <div key={m.l} style={{ padding:'12px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:10, textAlign:'center' }}>
                    <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:22, letterSpacing:'-0.02em', margin:'0 0 3px' }}>{m.v}</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', margin:0 }}>{m.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PILOT STUDY ── */}
      <section id="pilot" style={{ borderBottom:'1px solid var(--line)', background:'var(--surface-1)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>Clinical Validation</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>
            <div>
              <h2 className="section-title" style={{ fontSize:32, marginBottom:16 }}>
                Minneapolis<br /><em>Pilot Study</em>
              </h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)', marginBottom:28 }}>
                Ella Memory enters a formal clinical pilot in Minneapolis in Summer 2026.
                The study will measure care team efficiency, early event detection rates,
                and resident quality-of-life outcomes across participating facilities.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {[
                  { n:1, phase:'Phase 1', title:'Site Prep & Sensor Deployment', timing:'Spring 2026', detail:'Hardware installation, network config, staff orientation, baseline data collection.', active:true },
                  { n:2, phase:'Phase 2', title:'Active Pilot — Monitored Cohort', timing:'Summer 2026', detail:'Full ambient monitoring with care team using the Ella Memory dashboard in real workflows.', active:true },
                  { n:3, phase:'Phase 3', title:'Analysis & Outcome Reporting', timing:'Fall 2026', detail:'IRB-reviewed outcomes, model refinement, and preparation of peer-reviewed findings.', active:false },
                  { n:4, phase:'Phase 4', title:'Multi-Site Expansion', timing:'2027', detail:'Scale to additional facilities informed by pilot learnings and validated model performance.', active:false },
                ].map((s, i) => (
                  <div key={s.n} style={{ display:'flex', gap:16 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                        background: s.active ? 'var(--accent)' : 'var(--surface-2)',
                        border: s.active ? '2px solid var(--accent)' : '2px solid var(--line-strong)',
                        fontFamily:'var(--mono)', fontSize:12, fontWeight:600,
                        color: s.active ? '#fff' : 'var(--text-3)' }}>
                        {s.n}
                      </div>
                      {i < 3 && <div style={{ width:1, background:'var(--line)', minHeight:32, margin:'4px 0' }} />}
                    </div>
                    <div style={{ paddingBottom: i < 3 ? 20 : 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.phase}</span>
                        <span style={{ padding:'1px 8px', borderRadius:999, background:'var(--surface-2)', fontFamily:'var(--mono)', fontSize:10.5, color:'var(--text-3)' }}>{s.timing}</span>
                      </div>
                      <p style={{ fontSize:14, fontWeight:500, margin:'0 0 3px' }}>{s.title}</p>
                      <p style={{ fontSize:12.5, color:'var(--text-3)', lineHeight:1.5, margin:0 }}>{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ padding:'22px 24px', background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:12 }}>
                <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:8 }}>Location</p>
                <p style={{ fontSize:16, fontWeight:500, margin:'0 0 6px' }}>Minneapolis, MN</p>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, margin:0 }}>
                  Partnering with care facilities in the greater Minneapolis metropolitan area
                  for the inaugural real-world deployment of Ella Memory.
                </p>
              </div>
              <div style={{ padding:'22px 24px', background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:12 }}>
                <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:12 }}>Key Study Metrics</p>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
                  {['Early event detection rate','Nurse response latency improvement','Resident fall prevention efficacy','Care team workload reduction','Family satisfaction scores'].map(m => (
                    <li key={m} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-2)' }}>
                      <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }} />{m}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ padding:'18px 24px', background:'rgba(61,204,145,0.05)', border:'1px solid rgba(61,204,145,0.2)', borderRadius:12 }}>
                <p style={{ fontSize:14, fontWeight:500, color:'#3DCC91', margin:'0 0 5px' }}>IRB-Guided Protocol</p>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, margin:0 }}>
                  Pilot designed in alignment with institutional review standards and HIPAA-compliant data governance from day one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IP / PATENT ── */}
      <section id="ip" style={{ borderBottom:'1px solid var(--line)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>Intellectual Property</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center' }}>
            <div>
              <h2 className="section-title" style={{ fontSize:32, marginBottom:16 }}>PCT Patent<br /><em>Filing</em></h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)', marginBottom:24 }}>
                Our core ambient sensing and machine learning pipeline technology is protected under a
                PCT (Patent Cooperation Treaty) filing, managed in partnership with the{' '}
                <strong style={{ color:'var(--text)', fontWeight:500 }}>Office of Technology Commercialization
                at the University of Minnesota</strong>. The PCT establishes international priority
                across member nations — a strong foundation for global commercialization.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { label:'Filing Type', value:'PCT — Patent Cooperation Treaty' },
                  { label:'Partner', value:'University of Minnesota OTC' },
                  { label:'Scope', value:'Ambient ML sensing pipeline' },
                  { label:'Coverage', value:'PCT member nations — international priority' },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', alignItems:'center', gap:16, padding:'11px 16px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', width:100, flexShrink:0 }}>{r.label}</span>
                    <span style={{ fontSize:13.5, color:'var(--text)', fontWeight:500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <div style={{ maxWidth:320, width:'100%', padding:40, background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:20, textAlign:'center' }}>
                <div style={{ width:80, height:80, borderRadius:'50%', border:'3px solid var(--accent)', background:'rgba(45,114,210,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 4L6 10v10c0 9.2 6 17.7 14 20 8-2.3 14-10.8 14-20V10L20 4z" fill="rgba(45,114,210,0.15)" stroke="#2D72D2" strokeWidth="1.8" />
                    <path d="M14 20l4 4 8-8" stroke="#2D72D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:22, letterSpacing:'-0.01em', margin:'0 0 4px' }}>PCT Protected</p>
                <p style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 20px' }}>Patent Cooperation Treaty</p>
                <div style={{ borderTop:'1px solid var(--line)', paddingTop:18 }}>
                  <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, marginBottom:14 }}>
                    Filed through the <strong style={{ color:'var(--text)', fontWeight:500 }}>University of Minnesota
                    Office of Technology Commercialization</strong> — one of the nation&apos;s leading university technology transfer programs.
                  </p>
                  <div style={{ padding:'12px 16px', background:'rgba(45,114,210,0.07)', border:'1px solid rgba(45,114,210,0.2)', borderRadius:10 }}>
                    <p style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 3px', fontWeight:500 }}>University of Minnesota OTC</p>
                    <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>Technology Transfer Partner</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY ── */}
      <section style={{ borderBottom:'1px solid var(--line)', background:'var(--surface-1)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>Technology</p>
          <h2 className="section-title" style={{ fontSize:32, marginBottom:8 }}>AI at the Core</h2>
          <p style={{ fontSize:15, color:'var(--text-2)', marginBottom:40, maxWidth:560, lineHeight:1.7 }}>
            Every layer of the Ambient Intelligence platform is built with machine learning as a first-class citizen —
            from edge firmware through cloud inference to the clinical dashboard.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            <div className="chart-card" style={{ margin:0, padding:20 }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:10 }}>Signal Processing</p>
              <div style={{ height:72 }}><VitalsTrend /></div>
              <p style={{ fontSize:11.5, color:'var(--text-3)', marginTop:10 }}>FFT + moving average on continuous sensor streams</p>
            </div>
            <div className="chart-card" style={{ margin:0, padding:20 }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:10 }}>Anomaly Detection</p>
              <div style={{ height:72 }}><AnomalyChart /></div>
              <p style={{ fontSize:11.5, color:'var(--text-3)', marginTop:10 }}>Z-score and IQR outlier models with clinical thresholds</p>
            </div>
            <div className="chart-card" style={{ margin:0, padding:20 }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:10 }}>Behavioral Patterns</p>
              <div style={{ paddingTop:4 }}><ActivityHeatmap /></div>
              <p style={{ fontSize:11.5, color:'var(--text-3)', marginTop:10 }}>14-day activity grids reveal individual baselines</p>
            </div>
            <div className="chart-card" style={{ margin:0, padding:20 }}>
              <p style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:10 }}>Model Accuracy</p>
              <div style={{ display:'flex', justifyContent:'space-around', paddingTop:8 }}>
                <CircleGauge value={94} label="Detection" color="#2D72D2" />
                <CircleGauge value={87} label="Precision" color="#3DCC91" />
              </div>
              <p style={{ fontSize:11.5, color:'var(--text-3)', marginTop:6 }}>Benchmark on labeled clinical event dataset</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { icon:'⬡', color:'#2D72D2', title:'Edge Computing', body:'Sensor-level ML inference with sub-100ms latency. Local processing keeps sensitive signals off the network.' },
              { icon:'⬟', color:'#3DCC91', title:'Real-Time Pipeline', body:'Streaming architecture processes thousands of sensor events per second across multiple facilities simultaneously.' },
              { icon:'◆', color:'#FFC940', title:'Adaptive Models', body:'Per-resident baselines trained continuously. The system gets smarter the longer it observes.' },
              { icon:'◈', color:'#FF6B6B', title:'Secure by Design', body:'PHI isolation enforced at the SDK layer. Real identity lives only in a browser-local keyring.' },
            ].map(c => (
              <div key={c.title} style={{ padding:'20px', background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:12 }}>
                <span style={{ fontSize:20, color:c.color }}>{c.icon}</span>
                <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', margin:'10px 0 6px' }}>{c.title}</p>
                <p style={{ fontSize:13, lineHeight:1.6, color:'var(--text-2)', margin:0 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGINEERING ── */}
      <section id="engineering" style={{ borderBottom:'1px solid var(--line)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>Engineering Culture</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'start' }}>
            <div>
              <h2 className="section-title" style={{ fontSize:32, marginBottom:16 }}>
                Built to Move Fast,<br /><em>Designed to Last</em>
              </h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)', marginBottom:24 }}>
                We operate as an AI-native engineering organization. From code review to deployment,
                AI tooling is woven into every stage of the development lifecycle — accelerating
                iteration without sacrificing quality or compliance.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:28 }}>
                {[
                  { icon:'◈', color:'#2D72D2', title:'AI-Assisted Development', body:'LLM-driven code review, automated test generation, and intelligent incident triage reduce cycle time and human error.' },
                  { icon:'⬡', color:'#3DCC91', title:'Modern Stack', body:'Next.js 16, React 19, TypeScript — best-in-class tools for velocity. Vercel edge-first infrastructure.' },
                  { icon:'◆', color:'#FFC940', title:'Security-First CI/CD', body:'PHI checks, dependency audits, and compliance gates run on every pull request before any code reaches production.' },
                ].map(item => (
                  <div key={item.title} style={{ display:'flex', gap:14 }}>
                    <span style={{ fontSize:18, color:item.color, flexShrink:0, marginTop:2 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize:14, fontWeight:500, margin:'0 0 4px' }}>{item.title}</p>
                      <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, margin:0 }}>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/engineering" className="btn btn-ghost" style={{ fontSize:13, textDecoration:'none' }}>
                View Engineering Board →
              </Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { value:'< 48h', label:'Feature to Staging', sub:'Median cycle time' },
                { value:'100%', label:'Type Coverage', sub:'Full TypeScript' },
                { value:'AI-Native', label:'Org Design', sub:'LLM in every workflow' },
                { value:'Zero', label:'PHI in Transit', sub:'Architectural guarantee' },
                { value:'99.9%', label:'Target Uptime', sub:'Production SLA' },
                { value:'Vercel', label:'Infrastructure', sub:'Edge-first deployment' },
              ].map(m => (
                <div key={m.label} style={{ padding:'16px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:12 }}>
                  <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:22, letterSpacing:'-0.02em', margin:'0 0 3px', lineHeight:1 }}>{m.value}</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-2)', margin:'0 0 2px' }}>{m.label}</p>
                  <p style={{ fontSize:11, color:'var(--text-3)', margin:0 }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY NOW ── */}
      <section style={{ borderBottom:'1px solid var(--line)', background:'var(--surface-1)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12, textAlign:'center' }}>Why Now</p>
          <h2 className="section-title" style={{ fontSize:32, textAlign:'center', marginBottom:12 }}>The Convergence <em>Is Here</em></h2>
          <p style={{ fontSize:15, color:'var(--text-2)', textAlign:'center', maxWidth:560, margin:'0 auto 48px', lineHeight:1.7 }}>
            Three forces have aligned to make ambient care intelligence inevitable: IoT sensor costs have collapsed,
            time-series ML has crossed clinical-grade reliability, and the care staffing crisis demands
            automation that augments — not replaces — human caregivers.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:900, margin:'0 auto' }}>
            {[
              { title:'IoT Sensor Cost', before:'$200+/node', after:'< $30/node', label:'85% cost reduction in 5 years' },
              { title:'ML Model Accuracy', before:'Research-grade', after:'Clinical-grade', label:'Anomaly detection now production-ready' },
              { title:'Care Staffing Gap', before:'Growing crisis', after:'Tech imperative', label:'700K+ nursing shortage projected by 2035' },
            ].map(t => (
              <div key={t.title} style={{ padding:'28px 24px', background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:14, textAlign:'center' }}>
                <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:14 }}>{t.title}</p>
                <p style={{ fontSize:15, color:'var(--text-3)', textDecoration:'line-through', margin:'0 0 6px' }}>{t.before}</p>
                <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:26, letterSpacing:'-0.02em', color:'var(--accent)', margin:'0 0 10px' }}>{t.after}</p>
                <p style={{ fontSize:12, color:'var(--text-3)', margin:0 }}>{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONAL BACKING ── */}
      <section id="backing" style={{ position:'relative', borderBottom:'1px solid var(--line)', background:'var(--bg)', padding:'72px 44px', overflow:'hidden' }}>
        {/* Subtle grid */}
        <div style={{ pointerEvents:'none', position:'absolute', inset:0, opacity:0.02,
          backgroundImage:'linear-gradient(rgba(246,247,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(246,247,248,1) 1px, transparent 1px)',
          backgroundSize:'48px 48px' }} />
        {/* Ambient orbs — lime left, maroon right */}
        <div style={{ pointerEvents:'none', position:'absolute', inset:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', left:'-8%', top:'5%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(163,230,53,0.055) 0%, transparent 65%)', filter:'blur(80px)' }} />
          <div style={{ position:'absolute', right:'-8%', top:'5%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(122,0,25,0.08) 0%, transparent 65%)', filter:'blur(80px)' }} />
        </div>
        {/* Dual-brand gradient top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
          background:'linear-gradient(90deg, transparent 0%, rgba(163,230,53,0.6) 18%, rgba(163,230,53,0.12) 38%, rgba(26,82,118,0.12) 62%, rgba(36,113,163,0.6) 82%, transparent 100%)' }} />

        <div style={{ maxWidth:1280, margin:'0 auto', position:'relative' }}>
          <p className="crumb" style={{ marginBottom:12, textAlign:'center' }}>Institutional Validation</p>
          <h2 className="section-title" style={{ fontSize:32, textAlign:'center', marginBottom:12 }}>
            Backed by <em>Institutions That Matter</em>
          </h2>
          <p style={{ fontSize:15, color:'var(--text-2)', textAlign:'center', maxWidth:600, margin:'0 auto 48px', lineHeight:1.7 }}>
            $348K in institutional capital — top-tier accelerator investment and a tripartite
            public-university research grant — validates our technology before a single seed dollar is raised.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:20 }}>

            {/* GENER8TOR */}
            <div style={{ position:'relative', overflow:'hidden', borderRadius:20, border:'1px solid rgba(163,230,53,0.2)', background:'var(--surface-1)' }}>
              <div style={{ height:3, background:'linear-gradient(90deg, #A3E635 0%, #65A30D 100%)' }} />
              <div style={{ pointerEvents:'none', position:'absolute', top:-100, right:-60, width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(163,230,53,0.09) 0%, transparent 65%)', filter:'blur(40px)' }} />
              <div style={{ position:'relative', padding:'32px 32px 28px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'rgba(10,12,8,0.95)', border:'1.5px solid rgba(163,230,53,0.32)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'#A3E635', letterSpacing:'-0.02em' }}>g8r</span>
                    </div>
                    <div>
                      <p style={{ fontSize:15, fontWeight:600, color:'var(--text)', margin:'0 0 2px', letterSpacing:'-0.01em' }}>gener8tor</p>
                      <p style={{ fontSize:11.5, color:'var(--text-3)', margin:0 }}>National Startup Accelerator</p>
                    </div>
                  </div>
                  <div style={{ padding:'4px 12px', borderRadius:999, background:'rgba(163,230,53,0.08)', border:'1px solid rgba(163,230,53,0.2)', flexShrink:0 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'#A3E635', textTransform:'uppercase', letterSpacing:'0.1em' }}>Portfolio Co.</span>
                  </div>
                </div>
                <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:60, letterSpacing:'-0.04em', color:'#A3E635', margin:'0 0 5px', lineHeight:1 }}>$100K</p>
                <p style={{ fontFamily:'var(--mono)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--text-3)', margin:'0 0 24px' }}>Seed Investment · Accelerator Program</p>
                <p style={{ fontSize:13, fontStyle:'italic', color:'var(--text-3)', margin:'0 0 16px', paddingLeft:14, borderLeft:'2px solid rgba(163,230,53,0.35)' }}>
                  &ldquo;Accelerating the Best &amp; Brightest&rdquo;
                </p>
                <p style={{ fontSize:13.5, lineHeight:1.7, color:'var(--text-2)', margin:'0 0 24px' }}>
                  Selected for the gener8tor accelerator program — one of the top-ranked startup accelerators
                  in the United States, with 600+ portfolio companies spanning capital, coaching, and
                  corporate innovation programs nationwide.
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {['Top 10 U.S. Accelerator', '600+ Portfolio Cos.', 'Capital & Coaching'].map(tag => (
                    <span key={tag} style={{ padding:'4px 10px', borderRadius:6, background:'rgba(163,230,53,0.06)', border:'1px solid rgba(163,230,53,0.15)', fontSize:11, color:'rgba(163,230,53,0.65)', fontFamily:'var(--mono)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* MINNESOTA PARTNERSHIP */}
            <div style={{ position:'relative', overflow:'hidden', borderRadius:20, border:'1px solid rgba(36,113,163,0.2)', background:'var(--surface-1)' }}>
              {/* Three-institution color bar */}
              <div style={{ height:3, display:'flex' }}>
                <div style={{ flex:1, background:'#7A0019' }} />
                <div style={{ flex:1, background:'#1A5276' }} />
                <div style={{ flex:1, background:'#2471A3' }} />
              </div>
              <div style={{ pointerEvents:'none', position:'absolute', top:-100, right:-60, width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(36,113,163,0.09) 0%, transparent 65%)', filter:'blur(40px)' }} />
              <div style={{ position:'relative', padding:'32px 32px 28px' }}>
                {/* Institution badges */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:'rgba(122,0,25,0.12)', border:'1px solid rgba(122,0,25,0.28)' }}>
                    <div style={{ width:18, height:18, borderRadius:3, background:'#7A0019', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontFamily:'var(--serif)', fontSize:12, fontWeight:800, color:'#FFCC33', lineHeight:1 }}>M</span>
                    </div>
                    <span style={{ fontSize:11, color:'#c0392b', fontFamily:'var(--mono)', fontWeight:500, whiteSpace:'nowrap' }}>U of Minnesota</span>
                  </div>
                  <span style={{ color:'var(--line-strong)', fontSize:12, flexShrink:0 }}>·</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:'rgba(26,82,118,0.12)', border:'1px solid rgba(26,82,118,0.28)' }}>
                    <div style={{ width:18, height:18, borderRadius:3, background:'#1A5276', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1v8M1 5h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize:11, color:'#2e86c1', fontFamily:'var(--mono)', fontWeight:500, whiteSpace:'nowrap' }}>Mayo Clinic</span>
                  </div>
                  <span style={{ color:'var(--line-strong)', fontSize:12, flexShrink:0 }}>·</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:8, background:'rgba(36,113,163,0.12)', border:'1px solid rgba(36,113,163,0.28)' }}>
                    <div style={{ width:18, height:18, borderRadius:3, background:'#2471A3', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polygon points="5,1 6.2,3.8 9.5,4.1 7.2,6.2 8,9.5 5,7.8 2,9.5 2.8,6.2 0.5,4.1 3.8,3.8" fill="white"/>
                      </svg>
                    </div>
                    <span style={{ fontSize:11, color:'#2471a3', fontFamily:'var(--mono)', fontWeight:500, whiteSpace:'nowrap' }}>State of MN</span>
                  </div>
                </div>
                <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:60, letterSpacing:'-0.04em', color:'var(--text)', margin:'0 0 5px', lineHeight:1 }}>$248K</p>
                <p style={{ fontFamily:'var(--mono)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'0.14em', color:'var(--text-3)', margin:'0 0 24px' }}>Research Grant · Non-Dilutive</p>
                <p style={{ fontSize:13, fontStyle:'italic', color:'var(--text-3)', margin:'0 0 16px', paddingLeft:14, borderLeft:'2px solid rgba(36,113,163,0.38)', lineHeight:1.55 }}>
                  Minnesota Partnership for Biotechnology<br/>and Medical Genomics
                </p>
                <p style={{ fontSize:13.5, lineHeight:1.7, color:'var(--text-2)', margin:'0 0 24px' }}>
                  Awarded by the Minnesota Partnership — a tripartite initiative of the University of Minnesota,
                  Mayo Clinic, and the State of Minnesota — funding breakthrough innovation in
                  biomedical technology and medical genomics.
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {['Non-Dilutive Capital', 'Medical Genomics', 'Public-University Grant'].map(tag => (
                    <span key={tag} style={{ padding:'4px 10px', borderRadius:6, background:'rgba(36,113,163,0.06)', border:'1px solid rgba(36,113,163,0.15)', fontSize:11, color:'rgba(100,170,210,0.75)', fontFamily:'var(--mono)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Summary bar */}
          <div style={{ padding:'18px 28px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--sage)', boxShadow:'0 0 0 3px rgba(61,204,145,0.18)', flexShrink:0, display:'inline-block' }} />
              <span style={{ fontSize:13.5, color:'var(--text-2)' }}>
                $348K in institutional capital secured before seed round opens — accelerator investment plus non-dilutive grant
              </span>
            </div>
            <div style={{ display:'flex', gap:28, flexShrink:0 }}>
              {[
                { val:'$348K', label:'Secured' },
                { val:'4', label:'Institutions' },
                { val:'$248K', label:'Non-Dilutive' },
              ].map(m => (
                <div key={m.label} style={{ textAlign:'center' }}>
                  <p style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:'var(--text)', margin:'0 0 1px', lineHeight:1 }}>{m.val}</p>
                  <p style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.1em', margin:0 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INVESTMENT TERMS ── */}
      <section id="raise" style={{ borderBottom:'1px solid var(--line)', padding:'72px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="crumb" style={{ marginBottom:12 }}>Seed Round · 2026</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'start', marginBottom:56 }}>
            <div>
              <h2 className="section-title" style={{ fontSize:32, marginBottom:16 }}>
                Investment Terms <em>&amp; Return Path</em>
              </h2>
              <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text-2)', marginBottom:32 }}>
                Raising $2M to complete the Minneapolis pilot, achieve first revenue,
                and position for FDA Breakthrough Device Designation — with a clear 18-month
                path to Series A at demonstrated clinical outcomes.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {[
                  { value:'$2M', label:'Target Raise', sub:'Seed round' },
                  { value:'$10M', label:'Pre-Money', sub:'Valuation' },
                  { value:'$12M', label:'Post-Money', sub:'Valuation' },
                  { value:'~17%', label:'Investor Equity', sub:'Priced round' },
                ].map(s => (
                  <div key={s.label} style={{ padding:'18px 20px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:12 }}>
                    <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:30, letterSpacing:'-0.03em', margin:'0 0 4px', lineHeight:1 }}>{s.value}</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-2)', margin:'0 0 3px' }}>{s.label}</p>
                    <p style={{ fontSize:11.5, color:'var(--text-3)', margin:0 }}>{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:16 }}>Use of Funds</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { label:'Engineering & AI Platform', pct:35, color:'#2D72D2', amount:'$700K' },
                  { label:'Clinical Pilot & Operations', pct:35, color:'#3DCC91', amount:'$700K' },
                  { label:'Regulatory & IP Prosecution', pct:20, color:'#FFC940', amount:'$400K' },
                  { label:'G&A, Legal & Compliance', pct:10, color:'#FF6B6B', amount:'$200K' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <span style={{ fontSize:13, color:'var(--text-2)' }}>{f.label}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:12, color:f.color }}>{f.amount} · {f.pct}%</span>
                    </div>
                    <div style={{ height:6, background:'var(--surface-2)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${f.pct}%`, height:'100%', background:f.color, borderRadius:3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:24, padding:'16px 18px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:10 }}>
                <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', margin:'0 0 5px' }}>Lead Investor</p>
                <p style={{ fontSize:13, color:'var(--text-2)', margin:0, lineHeight:1.6 }}>Seeking a $500K–$1.5M lead check. Strategic partners with digital health, medtech, or senior care experience preferred.</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom:56 }}>
            <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:20 }}>Valuation Path &amp; Investor Returns</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
              {[
                { label:'Seed Post-Money', value:'$12M', sub:'2026 · Baseline', mult:'1×', color:'var(--text-2)' },
                { label:'Series A Pre-Money', value:'$35M', sub:'18 months post-seed', mult:'~3× seed', color:'var(--accent)' },
                { label:'Exit Target (Yr 5)', value:'$150M+', sub:'Acquisition or IPO', mult:'12–15× seed', color:'var(--sage)' },
              ].map(v => (
                <div key={v.label} style={{ padding:'24px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:14, textAlign:'center' }}>
                  <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', margin:'0 0 10px' }}>{v.label}</p>
                  <p style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:32, letterSpacing:'-0.03em', color:v.color, margin:'0 0 4px', lineHeight:1 }}>{v.value}</p>
                  <p style={{ fontSize:12, color:'var(--text-3)', margin:'0 0 14px' }}>{v.sub}</p>
                  <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:v.color, padding:'4px 14px', background:'rgba(255,255,255,0.05)', borderRadius:999, border:'1px solid var(--line)' }}>{v.mult}</span>
                </div>
              ))}
            </div>
            <ReturnChart />
          </div>

          <div>
            <p style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', marginBottom:28 }}>Milestones Funded by Seed Capital</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
              {[
                { q:'Q3 2026', title:'Pilot Complete', body:'Minneapolis 50-resident study delivers IRB-validated 6-month behavioral outcomes dataset.', color:'#3DCC91', icon:'◉' },
                { q:'Q4 2026', title:'First Customer', body:'First paying SNF facility contract signed. Operational MRR established; pipeline of 5+ LOIs.', color:'#2D72D2', icon:'◆' },
                { q:'Q1 2027', title:'FDA Filing', body:'Breakthrough Device Designation application submitted. 510(k) de novo pathway initiated.', color:'#FFC940', icon:'◈' },
                { q:'Q2 2027', title:'Mfg. Scale-Up', body:'Sensor node manufacturing partner selected. Per-unit cost locked at volume pricing.', color:'#FF6B6B', icon:'⬡' },
                { q:'Q2 2027', title:'IP Prosecution', body:'PCT national phase entries filed: US, EU, Japan. Co-filing with University of Minnesota OTC.', color:'#3DCC91', icon:'◎' },
                { q:'Q3 2027', title:'Series A Raise', body:'$10M at $35M pre-money. Triggered by $1M+ ARR and peer-reviewed clinical validation.', color:'#2D72D2', icon:'◆' },
                { q:'Q4 2027', title:'Multi-State Ops', body:'10+ facilities across MN, WI, and IA. Channel partnerships with regional SNF operators.', color:'#FFC940', icon:'◉' },
                { q:'2028', title:'510(k) Clearance', body:'FDA device clearance unlocks hospital-grade deployment and CMS reimbursement pathways.', color:'#FF6B6B', icon:'◈' },
              ].map((m, i) => (
                <div key={i} style={{ padding:'20px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', border:`1.5px solid ${m.color}`, background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, fontSize:15, color:m.color }}>
                    {m.icon}
                  </div>
                  <p style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', color:m.color, margin:'0 0 5px' }}>{m.q}</p>
                  <p style={{ fontSize:14, fontWeight:600, color:'var(--text)', margin:'0 0 7px', lineHeight:1.3 }}>{m.title}</p>
                  <p style={{ fontSize:12.5, color:'var(--text-3)', lineHeight:1.55, margin:0 }}>{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" style={{ padding:'80px 44px' }}>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', border:'2px solid var(--accent)', background:'rgba(45,114,210,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="5" fill="#2D72D2" opacity="0.9" />
              <circle cx="14" cy="14" r="10" stroke="#2D72D2" strokeWidth="1.5" opacity="0.5" />
              <circle cx="14" cy="14" r="13" stroke="#2D72D2" strokeWidth="1" opacity="0.25" />
            </svg>
          </div>
          <h2 className="section-title" style={{ fontSize:36, marginBottom:16 }}>
            Ready to Transform Care <em>Together?</em>
          </h2>
          <p style={{ fontSize:15, color:'var(--text-2)', lineHeight:1.7, marginBottom:32 }}>
            We&apos;re selective about our investment partners — we want people who understand that
            the intersection of AI, IoT, and clinical care is not a feature, it&apos;s a paradigm shift.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <a href="mailto:bribradley@gmail.com" className="btn btn-light" style={{ padding:'12px 28px', fontSize:14, borderRadius:999 }}>Get in Touch →</a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost" style={{ padding:'12px 28px', fontSize:14, borderRadius:999 }}>Explore Ella Memory</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'1px solid var(--line)', padding:'24px 44px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:20, height:20, borderRadius:4, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="2" fill="white" opacity="0.9" />
                <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
            <span style={{ fontFamily:'var(--serif)', fontSize:14 }}>Ambient Intelligence</span>
          </div>
          <p className="agent-note" style={{ margin:0 }}>
            PCT patent filed · University of Minnesota OTC · Ella Memory pilot · Minneapolis · Summer 2026
          </p>
          <div style={{ display:'flex', gap:20 }}>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.1em' }}>ellamemory.com</a>
            <Link href="/engineering" style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.1em' }}>Engineering</Link>
            <Link href="/" style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.1em' }}>Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
