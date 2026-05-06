'use client';
import { useId } from 'react';

// ── Data visualizations (from /invest Flagship Product section) ───────────────

function toPoints(values: number[], w: number, h: number, max: number) {
  return values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
}

function VitalsTrend() {
  const id = useId();
  const g1 = `vt-g1-${id}`; const g2 = `vt-g2-${id}`;
  const a = [42, 58, 53, 67, 61, 75, 68, 82, 77, 89, 72, 80, 86, 78, 91];
  const b = [30, 38, 34, 44, 40, 52, 47, 59, 54, 63, 50, 57, 62, 55, 67];
  const w = 400; const h = 90; const max = 100;
  const pa = toPoints(a, w, h, max); const pb = toPoints(b, w, h, max);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.35"/><stop offset="100%" stopColor="#4F9CF9" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3DCC91" stopOpacity="0.22"/><stop offset="100%" stopColor="#3DCC91" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pa} ${w},${h}`} fill={`url(#${g1})`}/>
      <polyline points={pa} fill="none" stroke="#4F9CF9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <polygon points={`0,${h} ${pb} ${w},${h}`} fill={`url(#${g2})`}/>
      <polyline points={pb} fill="none" stroke="#3DCC91" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
    </svg>
  );
}

function AnomalyChart() {
  const id = useId(); const gid = `an-g-${id}`;
  const base = [48,51,49,52,50,53,51,49,52,50,51,50,48,52,51];
  const pts = base.map((v, i) => i === 9 ? 79 : i === 10 ? 83 : v);
  const w = 400; const h = 90; const max = 100;
  const path = toPoints(pts, w, h, max);
  const markers = [9, 10].map(i => ({ cx: (i / (pts.length - 1)) * w, cy: h - ((pts[i] ?? 0) / max) * h }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,240,255,0.08)"/><stop offset="100%" stopColor="rgba(232,240,255,0)"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill={`url(#${gid})`}/>
      <polyline points={path} fill="none" stroke="rgba(232,240,255,0.38)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {markers.map((m, i) => <circle key={i} cx={m.cx} cy={m.cy} r="4.5" fill="#FF6680" stroke="#0E1830" strokeWidth="2"/>)}
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
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
      {seed.map((row, r) => (
        <div key={r} style={{ display: 'flex', gap: 3 }}>
          {row.map((v, c) => (
            <div key={c} style={{ flex: 1, aspectRatio: '1', borderRadius: 2, background: `rgba(79,156,249,${(0.08 + v * 0.82).toFixed(2)})` }}/>
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
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
      <svg key={id} width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(232,240,255,0.07)" strokeWidth="6"/>
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 34 34)"/>
        <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="600" fill="#E8F0FF" fontFamily="var(--mono, monospace)">{value}%</text>
      </svg>
      <span style={{ fontSize: 10, fontFamily: 'var(--mono, monospace)', color: 'rgba(232,240,255,0.42)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:       '#0E1830',
  surf1:    '#152240',
  surf2:    '#1C2C50',
  surf3:    '#233660',
  line:     'rgba(79,156,249,0.08)',
  lineStrg: 'rgba(79,156,249,0.16)',
  text:     '#E8F0FF',
  text2:    'rgba(232,240,255,0.68)',
  text3:    'rgba(232,240,255,0.42)',
  text4:    'rgba(232,240,255,0.24)',
  accent:   '#4F9CF9',
  accentSoft:'rgba(79,156,249,0.12)',
  gold:     '#F0B429',
  goldSoft: 'rgba(240,180,41,0.12)',
  green:    '#3DCC91',
  greenSoft:'rgba(63,204,145,0.12)',
  violet:   '#8264F0',
  violetSoft:'rgba(130,100,240,0.12)',
  maroon:   '#7A0019',
  maroonSoft:'rgba(122,0,25,0.12)',
  mayo:     '#1A5276',
  mayoSoft: 'rgba(26,82,118,0.12)',
  mnBlue:   '#2471A3',
  mnBlueSoft:'rgba(36,113,163,0.12)',
};

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ padding: '4px 11px', borderRadius: 6, background: bg, border: `1px solid ${color}33`, fontSize: 11, color, fontFamily: 'var(--mono, monospace)', fontWeight: 500, whiteSpace: 'nowrap' as const }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.line, margin: '0' }} />;
}

export default function MNPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: "var(--sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)" }}>

      <style>{`
        /* Top accent bar */
        .mn-top-bar::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #7A0019 20%, #2471A3 50%, #4F9CF9 80%, transparent 100%);
          z-index: 200;
          pointer-events: none;
          animation: mn-bar 8s linear infinite;
        }
        @keyframes mn-bar { 0%,100%{opacity:0.7} 50%{opacity:1} }

        /* Traveling spark network */
        .mn-spark-line { fill: none; stroke: rgba(79,156,249,0.18); stroke-width: 0.7; stroke-dasharray: 8 6; }
        .sp1{animation:sda 5s linear infinite}
        .sp2{animation:sdb 7s linear infinite;animation-delay:-2.1s}
        .sp3{animation:sdc 4.6s linear infinite;animation-delay:-1s}
        .sp4{animation:sdd 6.2s linear infinite;animation-delay:-3s}
        .sp5{animation:sde 5.4s linear infinite;animation-delay:-0.6s}
        .sp6{animation:sdf 8s linear infinite;animation-delay:-4s}
        .sp7{animation:sdg 4.2s linear infinite;animation-delay:-1.7s}
        .sp8{animation:sdh 6.8s linear infinite;animation-delay:-2.4s}
        @keyframes sda{from{stroke-dashoffset:56}to{stroke-dashoffset:0}}
        @keyframes sdb{from{stroke-dashoffset:84}to{stroke-dashoffset:0}}
        @keyframes sdc{from{stroke-dashoffset:42}to{stroke-dashoffset:0}}
        @keyframes sdd{from{stroke-dashoffset:70}to{stroke-dashoffset:0}}
        @keyframes sde{from{stroke-dashoffset:56}to{stroke-dashoffset:0}}
        @keyframes sdf{from{stroke-dashoffset:98}to{stroke-dashoffset:0}}
        @keyframes sdg{from{stroke-dashoffset:42}to{stroke-dashoffset:0}}
        @keyframes sdh{from{stroke-dashoffset:70}to{stroke-dashoffset:0}}
        .mn-node-pulse { fill: none; stroke: rgba(79,156,249,0.12); stroke-width: 0.8; animation: mnring 4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        .mn-node-pulse.d2{animation-delay:-2s;animation-duration:5s}
        .mn-node-pulse.d3{animation-delay:-1s;animation-duration:3.8s}
        @keyframes mnring{0%{transform:scale(1);opacity:0.3}100%{transform:scale(7);opacity:0}}

        /* Orbs */
        @keyframes mn-orb-a{0%,100%{transform:translate(0,0)}35%{transform:translate(55px,-45px)}70%{transform:translate(-30px,25px)}}
        @keyframes mn-orb-b{0%,100%{transform:translate(0,0)}45%{transform:translate(-50px,40px)}80%{transform:translate(35px,-20px)}}
        .mn-orb-a{animation:mn-orb-a 24s ease-in-out infinite}
        .mn-orb-b{animation:mn-orb-b 30s ease-in-out infinite}

        @keyframes mn-live{0%,100%{opacity:1}50%{opacity:0.4}}
        .mn-live{animation:mn-live 2s ease-in-out infinite}

        .mn-card-hover{transition:border-color 0.2s,background 0.2s}
        .mn-card-hover:hover{border-color:rgba(79,156,249,0.28)!important;background:rgba(79,156,249,0.04)!important}

        .mn-nav-link{color:rgba(232,240,255,0.42);text-decoration:none;font-family:var(--mono,monospace);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;transition:color 0.15s}
        .mn-nav-link:hover{color:#E8F0FF}
        .mn-text-link{color:#4F9CF9;text-decoration:none}
        .mn-text-link:hover{text-decoration:underline}
      `}</style>

      <div className="mn-top-bar" />

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 60, background: `rgba(14,24,48,0.84)`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.line}` }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 15, fontWeight: 300, color: C.text, letterSpacing: '-0.01em' }}>Ambient <em style={{ fontStyle: 'italic', color: C.text2 }}>Intelligence</em></span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#network"     className="mn-nav-link">Network</a>
          <a href="#patent"      className="mn-nav-link">IP</a>
          <a href="#accelerator" className="mn-nav-link">gener8tor</a>
          <a href="#contact"     className="mn-nav-link">Contact</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '140px 48px 100px', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
        {/* Gradient bg */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 12% 55%, rgba(122,0,25,0.14) 0%, transparent 48%), radial-gradient(ellipse at 85% 25%, rgba(79,156,249,0.12) 0%, transparent 48%), ${C.bg}` }}/>

        {/* Orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div className="mn-orb-a" style={{ position: 'absolute', left: -180, top: -60, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,0,25,0.16), transparent 65%)', filter: 'blur(90px)' }}/>
          <div className="mn-orb-b" style={{ position: 'absolute', right: -120, bottom: -60, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,156,249,0.12), transparent 65%)', filter: 'blur(90px)' }}/>

          {/* Network */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.7 }} viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
            <line x1="200" y1="180" x2="520" y2="120" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="200" y1="180" x2="380" y2="420" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="520" y1="120" x2="760" y2="280" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="760" y1="280" x2="920" y2="140" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="920" y1="140" x2="1200" y2="200" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="760" y1="280" x2="1060" y2="400" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="1200" y1="200" x2="1380" y2="340" stroke="rgba(79,156,249,0.06)" strokeWidth="0.8"/>
            <line x1="200" y1="180" x2="520" y2="120" className="mn-spark-line sp1"/>
            <line x1="520" y1="120" x2="760" y2="280" className="mn-spark-line sp2"/>
            <line x1="380" y1="420" x2="760" y2="280" className="mn-spark-line sp3"/>
            <line x1="760" y1="280" x2="920" y2="140" className="mn-spark-line sp4"/>
            <line x1="920" y1="140" x2="1200" y2="200" className="mn-spark-line sp5"/>
            <line x1="760" y1="280" x2="1060" y2="400" className="mn-spark-line sp6"/>
            <line x1="1060" y1="400" x2="1200" y2="200" className="mn-spark-line sp7"/>
            <line x1="1200" y1="200" x2="1380" y2="340" className="mn-spark-line sp8"/>
            {[
              [200,180,3.5],[380,420,3],[520,120,3.5],[760,280,5],[920,140,4],[1060,400,3.5],[1200,200,4.5],[1380,340,3]
            ].map(([cx,cy,r],i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(79,156,249,0.18)"/>
            ))}
            <circle cx="200"  cy="180" r="9" className="mn-node-pulse"/>
            <circle cx="760"  cy="280" r="9" className="mn-node-pulse d2"/>
            <circle cx="1200" cy="200" r="9" className="mn-node-pulse d3"/>
          </svg>
        </div>

        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <span className="mn-live" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }}/>
            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text3 }}>Minnesota Ecosystem · Pilot Ready 2026</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(44px, 6.5vw, 76px)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 28px', maxWidth: 900 }}>
            Built in Minnesota.<br/>
            <em style={{ fontStyle: 'italic', color: C.text2 }}>Backed by its greatest institutions.</em>
          </h1>

          {/* Subhead — from invest copy */}
          <p style={{ fontSize: 20, lineHeight: 1.7, color: C.text2, maxWidth: 680, margin: '0 0 40px' }}>
            We transform ordinary care environments into intelligent, sensor-rich ecosystems —
            continuously monitoring patient wellbeing through ambient AI and IoT, without disrupting
            the human moments that matter most.
          </p>

          {/* Institution chips — text only, no icons */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 8, marginBottom: 52 }}>
            <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, marginRight: 4 }}>With</span>
            {[
              { label: 'U of Minnesota', color: '#c0392b', bg: C.maroonSoft, border: 'rgba(122,0,25,0.28)' },
              { label: 'Mayo Clinic',    color: '#2e86c1', bg: C.mayoSoft,   border: 'rgba(26,82,118,0.28)' },
              { label: 'State of MN',   color: '#2471a3', bg: C.mnBlueSoft,  border: 'rgba(36,113,163,0.28)' },
              { label: 'gener8tor',     color: '#9ccc65', bg: 'rgba(156,204,101,0.10)', border: 'rgba(156,204,101,0.25)' },
            ].map(({ label, color, bg, border }) => (
              <span key={label} style={{ padding: '5px 12px', borderRadius: 8, background: bg, border: `1px solid ${border}`, fontSize: 12, color, fontFamily: 'var(--mono, monospace)', fontWeight: 500 }}>{label}</span>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, maxWidth: 860 }}>
            {[
              { value: 'PCT',  label: 'Patent Filed',           sub: 'University of Minnesota OTC' },
              { value: '24/7', label: 'Passive Monitoring',     sub: 'No wearables required' },
              { value: '2026', label: 'Pilot Launch',           sub: 'Minneapolis, MN' },
              { value: '$248K',label: 'Research Grant',         sub: 'Non-dilutive · MN Partnership' },
            ].map((s) => (
              <div key={s.value} style={{ border: `1px solid ${C.lineStrg}`, background: 'rgba(79,156,249,0.04)', borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 36, fontWeight: 300, letterSpacing: '-0.03em', margin: '0 0 4px', lineHeight: 1, color: C.text }}>{s.value}</p>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, margin: '0 0 3px' }}>{s.label}</p>
                <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider/>

      {/* ── NETWORK — Three institutions ── */}
      <section id="network" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, alignItems: 'start' }}>
            <div>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Institutional Network</p>
              <h2 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(30px, 3.5vw, 46px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 20px' }}>
                Minnesota&apos;s health innovation<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>ecosystem.</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.text2, margin: 0 }}>
                A tripartite initiative of the University of Minnesota, Mayo Clinic, and the State of Minnesota —
                funding breakthrough innovation in biomedical technology and medical genomics.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0, border: `1px solid ${C.lineStrg}`, borderRadius: 20, overflow: 'hidden' }}>
              {/* Three-institution color bar */}
              <div style={{ height: 3, display: 'flex' }}>
                <div style={{ flex: 1, background: '#7A0019' }}/>
                <div style={{ flex: 1, background: '#1A5276' }}/>
                <div style={{ flex: 1, background: '#2471A3' }}/>
              </div>

              {[
                {
                  name: 'University of Minnesota',
                  role: 'IP & Research Partner',
                  mono: 'U of Minnesota · Twin Cities',
                  color: '#c0392b',
                  bg: C.maroonSoft,
                  border: 'rgba(122,0,25,0.15)',
                  body: 'Our core technology is protected under a PCT patent filing managed through the UMN Office of Technology Commercialization — one of the nation\'s leading university technology transfer programs.',
                  tags: ['PCT Patent', 'OTC Partner', 'Research Collaboration'],
                  tagColor: '#c0392b',
                  tagBg: C.maroonSoft,
                },
                {
                  name: 'Mayo Clinic',
                  role: 'Clinical Partner',
                  mono: 'Mayo Clinic · Rochester, MN',
                  color: '#2e86c1',
                  bg: C.mayoSoft,
                  border: 'rgba(26,82,118,0.15)',
                  body: 'The world\'s #1 ranked hospital is in our backyard. The Minnesota Partnership for Biotechnology and Medical Genomics — a formal collaboration between UMN and Mayo — accelerates health innovation statewide.',
                  tags: ['MN Partnership', 'Clinical Validation', 'Health Innovation'],
                  tagColor: '#2e86c1',
                  tagBg: C.mayoSoft,
                },
                {
                  name: 'State of Minnesota',
                  role: 'State Support',
                  mono: 'State of MN · Saint Paul',
                  color: '#2471a3',
                  bg: C.mnBlueSoft,
                  border: 'rgba(36,113,163,0.15)',
                  body: 'Minnesota\'s 87-county care network and its commitment to health technology innovation create the ideal launchpad — with state-level support for digital health and public-university grants.',
                  tags: ['87-County Network', 'Digital Health', 'Public-University Grant'],
                  tagColor: '#2471a3',
                  tagBg: C.mnBlueSoft,
                },
              ].map((inst, i) => (
                <div key={inst.name} className="mn-card-hover" style={{ padding: '28px 32px', borderTop: i > 0 ? `1px solid ${C.line}` : 'none', background: C.surf1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: inst.color, margin: '0 0 5px' }}>{inst.mono}</p>
                      <p style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.015em' }}>{inst.name}</p>
                    </div>
                    <span style={{ padding: '4px 11px', borderRadius: 6, background: inst.bg, border: `1px solid ${inst.color}33`, fontSize: 11, color: inst.color, fontFamily: 'var(--mono, monospace)', fontWeight: 500, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{inst.role}</span>
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: C.text2, margin: '0 0 16px' }}>{inst.body}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {inst.tags.map(tag => (
                      <span key={tag} style={{ padding: '3px 9px', borderRadius: 5, background: inst.tagBg, border: `1px solid ${inst.tagColor}33`, fontSize: 11, color: inst.tagColor, fontFamily: 'var(--mono, monospace)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider/>

      {/* ── MINNESOTA PARTNERSHIP grant ── */}
      <section style={{ padding: '80px 48px', background: C.surf1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40, alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Research Grant · Non-Dilutive</p>
            <p style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(56px, 7vw, 88px)', letterSpacing: '-0.04em', color: C.text, margin: '0 0 6px', lineHeight: 1 }}>$248K</p>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text3, margin: '0 0 28px' }}>Minnesota Partnership for Biotechnology<br/>and Medical Genomics</p>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text3, margin: '0 0 16px', paddingLeft: 14, borderLeft: '2px solid rgba(36,113,163,0.4)', lineHeight: 1.6 }}>
              Awarded by the Minnesota Partnership — a tripartite initiative of the University of Minnesota,
              Mayo Clinic, and the State of Minnesota — funding breakthrough innovation in biomedical technology
              and medical genomics.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
              {['Non-Dilutive Capital', 'Medical Genomics', 'Public-University Grant'].map(tag => (
                <Tag key={tag} color="rgba(100,170,210,0.75)" bg={C.mnBlueSoft}>{tag}</Tag>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Seed Capital · Accelerator</p>
            <p style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(56px, 7vw, 88px)', letterSpacing: '-0.04em', color: '#9ccc65', margin: '0 0 6px', lineHeight: 1 }}>$100K</p>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text3, margin: '0 0 28px' }}>Seed Investment · gener8tor Program</p>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text3, margin: '0 0 16px', paddingLeft: 14, borderLeft: '2px solid rgba(163,230,53,0.35)', lineHeight: 1.6 }}>
              &ldquo;Accelerating the Best &amp; Brightest&rdquo;
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text2, margin: '0 0 20px' }}>
              Selected for the gener8tor accelerator program — one of the top-ranked startup accelerators
              in the United States, with 600+ portfolio companies spanning capital, coaching, and
              corporate innovation programs nationwide.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
              {['Top 10 U.S. Accelerator', '600+ Portfolio Cos.', 'Capital & Coaching'].map(tag => (
                <Tag key={tag} color="rgba(163,230,53,0.65)" bg="rgba(156,204,101,0.10)">{tag}</Tag>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Angel Investment · Early Stage</p>
            <p style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(56px, 7vw, 88px)', letterSpacing: '-0.04em', color: C.gold, margin: '0 0 6px', lineHeight: 1 }}>$50K</p>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text3, margin: '0 0 28px' }}>Strategic Angel Investors</p>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text3, margin: '0 0 16px', paddingLeft: 14, borderLeft: `2px solid rgba(240,180,41,0.4)`, lineHeight: 1.6 }}>
              Backed by experienced operators and clinicians who bring capital, network, and domain expertise
              to accelerate commercialization.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.text2, margin: '0 0 20px' }}>
              Greg Shultz — Gasket Studios<br/>
              Dr. Simon Mittal, MD
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
              {['Angel Capital', 'Operator Network', 'Clinical Expertise'].map(tag => (
                <Tag key={tag} color="rgba(240,180,41,0.75)" bg="rgba(240,180,41,0.10)">{tag}</Tag>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider/>

      {/* ── PCT PATENT ── */}
      <section id="patent" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Intellectual Property</p>
            <h2 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px' }}>
              PCT Patent<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>Filing</em>
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: C.text2, margin: '0 0 28px' }}>
              Our core ambient sensing and machine learning pipeline technology is protected under a{' '}
              PCT (Patent Cooperation Treaty) filing, managed in partnership with the{' '}
              <strong style={{ color: C.text, fontWeight: 500 }}>Office of Technology Commercialization
              at the University of Minnesota</strong>. The PCT establishes international priority
              across member nations, providing a strong foundation for global commercialization.
            </p>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: C.text3, paddingLeft: 14, borderLeft: `2px solid ${C.accentSoft}`, lineHeight: 1.6, margin: '0 0 28px' }}>
              Filed through the University of Minnesota Office of Technology Commercialization —
              one of the nation&apos;s leading university technology transfer programs.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0, border: `1px solid ${C.lineStrg}`, borderRadius: 16, overflow: 'hidden', background: C.surf1 }}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.line}` }}>
              <p style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 4px' }}>PCT Protected</p>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, margin: 0 }}>Patent Cooperation Treaty</p>
            </div>
            {[
              { label: 'Filing Type',         value: 'PCT — Patent Cooperation Treaty' },
              { label: 'Partner Institution',  value: 'University of Minnesota OTC' },
              { label: 'Protection Scope',     value: 'Ambient ML sensing pipeline' },
              { label: 'Coverage',             value: 'PCT member nations — international priority' },
            ].map((row, i) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 28px', borderBottom: i < 3 ? `1px solid ${C.line}` : 'none' }}>
                <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.text4, width: 160, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{row.value}</span>
              </div>
            ))}
            <div style={{ padding: '20px 28px', background: C.maroonSoft, borderTop: `1px solid rgba(122,0,25,0.2)` }}>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: '#c0392b', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 3px', fontWeight: 500 }}>University of Minnesota OTC</p>
              <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>Technology Transfer Partner</p>
            </div>
          </div>
        </div>
      </section>

      <Divider/>

      {/* ── GENER8TOR ── */}
      <section id="accelerator" style={{ padding: '80px 48px', background: C.surf1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            <div>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Startup Accelerator</p>
              <h2 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px' }}>
                Backed by<br/><em style={{ fontStyle: 'italic', color: '#9ccc65' }}>gener8tor.</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: C.text2, margin: '0 0 20px' }}>
                Selected for the gener8tor accelerator program — one of the top-ranked startup accelerators
                in the United States, with 600+ portfolio companies spanning capital, coaching, and corporate
                innovation programs nationwide.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: C.text2, margin: '0 0 28px' }}>
                Gener8tor&apos;s deep Midwest roots and growing Minnesota health tech presence make it a
                natural partner as we build toward our Summer 2026 clinical pilot.
              </p>
              <a href="https://www.gener8tor.com/" target="_blank" rel="noopener noreferrer" className="mn-text-link" style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                gener8tor.com ↗
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              {[
                { value: 'Top 10',  label: 'U.S. Accelerator Ranking',  color: '#9ccc65' },
                { value: '600+',    label: 'Portfolio Companies',        color: C.accent  },
                { value: '$100K',   label: 'Seed Investment',            color: '#9ccc65' },
                { value: '12 wk',   label: 'Intensive Program',          color: C.accent  },
              ].map((m) => (
                <div key={m.label} className="mn-card-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', border: `1px solid ${C.lineStrg}`, borderRadius: 14, background: C.surf2 }}>
                  <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, color: C.text3, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{m.label}</span>
                  <span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 32, fontWeight: 300, letterSpacing: '-0.03em', color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider/>

      {/* ── ELLA AI NURSE ASSISTANT ── */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'end', marginBottom: 48 }}>
            <div>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 16px' }}>Flagship Product</p>
              <h2 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 20px' }}>
                Ella AI <em style={{ fontStyle: 'italic', color: C.text2 }}>Nurse Assistant</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: C.text2, margin: 0 }}>
                Our patient-facing intelligent care companion — a purpose-built platform that continuously
                observes, learns, and communicates meaningful patterns to care teams in real time,
                without disrupting the human moments that matter most.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {[
                'Ambient room sensors — no cameras, no wearables',
                'Nurse dashboard with prioritized resident list and live vitals',
                'Behavioral trend analysis over days, weeks, and months',
                'Privacy by architecture — PHI never in transit',
                'Minneapolis pilot launching Summer 2026',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: C.green, fontSize: 14, marginTop: 2, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 15, color: C.text2 }}>{item}</span>
                </div>
              ))}
              <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" className="mn-text-link" style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginTop: 8 }}>
                ellamemory.com ↗
              </a>
            </div>
          </div>

          {/* Dashboard preview */}
          <div style={{ border: `1px solid ${C.lineStrg}`, borderRadius: 20, overflow: 'hidden', background: C.surf1 }}>
            {/* Header bar */}
            <div style={{ padding: '18px 28px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.text3 }}>Ella AI Nurse Assistant · Live Dashboard</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.text3 }}>
                <span className="mn-live" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green }}/>
                Active
              </span>
            </div>

            {/* Vitals chart — full width */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, margin: 0 }}>Resident Vitals — Live Feed</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.text3 }}>
                    <span style={{ display: 'inline-block', width: 20, height: 2, background: C.accent, borderRadius: 2 }}/>Activity Index
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.text3 }}>
                    <span style={{ display: 'inline-block', width: 20, height: 2, background: C.green, borderRadius: 2, opacity: 0.7 }}/>Rest Quality
                  </span>
                </div>
              </div>
              <div style={{ height: 90 }}><VitalsTrend/></div>
            </div>

            {/* Second row: anomaly + heatmap + gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${C.line}` }}>
              <div style={{ padding: '20px 24px', borderRight: `1px solid ${C.line}` }}>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, margin: '0 0 12px' }}>Anomaly Detection</p>
                <div style={{ height: 72 }}><AnomalyChart/></div>
                <p style={{ fontSize: 11, color: C.text4, margin: '8px 0 0' }}>Z-score threshold events</p>
              </div>
              <div style={{ padding: '20px 24px', borderRight: `1px solid ${C.line}` }}>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, margin: '0 0 12px' }}>Activity Heatmap</p>
                <div style={{ paddingTop: 4 }}><ActivityHeatmap/></div>
                <p style={{ fontSize: 11, color: C.text4, margin: '8px 0 0' }}>14-day behavioral grid</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.text3, margin: '0 0 12px', alignSelf: 'flex-start' }}>Model Accuracy</p>
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <CircleGauge value={94} label="Detection" color={C.accent}/>
                  <CircleGauge value={87} label="Precision" color={C.green}/>
                </div>
              </div>
            </div>

            {/* Footer bar */}
            <div style={{ padding: '14px 28px', background: C.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0, fontWeight: 500 }}>Minneapolis Pilot · Summer 2026</p>
              <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>IRB-guided · HIPAA-compliant · Real care facilities · Real outcomes</p>
            </div>
          </div>
        </div>
      </section>

      <Divider/>

      {/* ── CTA ── */}
      <section id="contact" style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' as const }}>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text4, margin: '0 0 20px' }}>Get in touch</p>
          <h2 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontWeight: 300, fontSize: 'clamp(34px, 4.5vw, 58px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 22px' }}>
            Minnesota&apos;s moment<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>in health tech is now.</em>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: C.text2, margin: '0 0 44px' }}>
            We have the partnerships, the patent, the accelerator backing, and the team.
            If you are a care facility, researcher, investor, or partner — let&apos;s talk.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <a href="mailto:bribradley@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accent, color: '#fff', borderRadius: 999, padding: '14px 32px', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Get in Touch
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.lineStrg}`, color: C.text2, borderRadius: 999, padding: '14px 32px', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Explore Ella Memory
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '24px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${C.accent}, ${C.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.3"/><circle cx="7" cy="7" r="2.2" fill="white"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 14, fontWeight: 300 }}>Ambient Intelligence</span>
          </div>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.text4, margin: 0, textAlign: 'center' as const }}>
            PCT patent · UMN OTC · Minneapolis 2026 · gener8tor portfolio
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              ['https://www.ellamemory.com/', 'ellamemory.com'],
              ['/invest', 'Investor Info'],
              ['https://www.minnesotapartnership.info/', 'MN Partnership'],
            ].map(([href, label]) => (
              <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.text4, textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
