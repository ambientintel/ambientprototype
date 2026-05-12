'use client';
import { useEffect, useRef } from 'react';

/* ── Palette ─────────────────────────────────────────────────────────────────── */
const C = {
  bg:         '#07090E',
  surf1:      '#0D111A',
  surf2:      '#111827',
  line:       'rgba(255,255,255,0.06)',
  lineStrg:   'rgba(255,255,255,0.12)',
  text:       '#F6F7F8',
  text2:      'rgba(246,247,248,0.65)',
  text3:      'rgba(246,247,248,0.42)',
  text4:      'rgba(246,247,248,0.25)',
  maroon:     '#7A0019',
  maroonSoft: 'rgba(122,0,25,0.10)',
  gold:       '#F0B429',
  goldSoft:   'rgba(240,180,41,0.10)',
  accent:     '#4F9CF9',
  accentSoft: 'rgba(79,156,249,0.10)',
  green:      '#3DCC91',
  greenSoft:  'rgba(61,204,145,0.10)',
  serif:      'var(--serif, Georgia, serif)',
  mono:       'var(--mono, monospace)',
  sans:       'var(--sans, -apple-system, sans-serif)',
};

/* ── Pendulum Wave full-page background ──────────────────────────────────────── */
type Cfg = Record<string, number>;

function PendulumWaveBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<Cfg>({
    count: 19,
    speed: 0.1,
    amplitude: 0.43,
    trailLength: 0.92,
    hue: 192,
    spread: 2.45,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const create = function create(e: HTMLCanvasElement, t: () => Cfg) {
      let a=e.getContext("2d")!,l: number,i=0,n: {freq:number,trail:number[][]}[]=[],r=-1;
      const o=(c: number)=>{n=Array.from({length:c},(_,idx)=>({freq:2+.18*idx,trail:[]}));r=c;};
      const s=()=>{let b=e.getBoundingClientRect();e.width=b.width;e.height=b.height;n.forEach(p=>p.trail=[]);};
      const h=()=>{
        let cfg=t(),d=e.width,m=e.height,c=Math.floor(cfg.count);
        c!==r&&o(c);
        i+=.007*cfg.speed;
        a.fillStyle=`rgba(8,10,14,${.04+(1-cfg.trailLength)*.6})`;
        a.fillRect(0,0,d,m);
        let p=.12*m,g=m*cfg.amplitude,u=d/(c+1),b=Math.round(300*cfg.trailLength+30);
        a.beginPath();
        n.forEach((nd,t2)=>{
          let freq=nd.freq*cfg.spread,nx=(t2+1)*u,ny=.55*m+g*Math.sin(freq*i);
          t2===0?a.moveTo(nx,ny):a.lineTo(nx,ny);
        });
        a.strokeStyle=`hsla(${cfg.hue},70%,65%,0.18)`;a.lineWidth=1;a.stroke();
        n.forEach((nd,t2)=>{
          let freq=nd.freq*cfg.spread,nx=(t2+1)*u,ny=.55*m+g*Math.sin(freq*i),hue2=(cfg.hue+120/c*t2)%360;
          nd.trail.push([nx,ny]);nd.trail.length>b&&nd.trail.shift();
          a.beginPath();a.moveTo(nx,p);a.lineTo(nx,ny);
          a.strokeStyle=`hsla(${hue2},50%,55%,0.15)`;a.lineWidth=.6;a.stroke();
          if(nd.trail.length>1){
            a.beginPath();
            nd.trail.forEach(([tx,ty],li)=>li===0?a.moveTo(tx,ty):a.lineTo(tx,ty));
            a.strokeStyle=`hsla(${hue2},75%,65%,0.4)`;a.lineWidth=1;a.stroke();
          }
          let gr=a.createRadialGradient(nx,ny,0,nx,ny,6);
          gr.addColorStop(0,`hsla(${hue2},85%,85%,0.95)`);gr.addColorStop(1,"rgba(0,0,0,0)");
          a.beginPath();a.arc(nx,ny,6,0,2*Math.PI);a.fillStyle=gr;a.fill();
          a.beginPath();a.arc(nx,p,1.5,0,2*Math.PI);
          a.fillStyle=`hsla(${hue2},60%,60%,0.4)`;a.fill();
        });
        a.beginPath();a.moveTo(.5*u,p);a.lineTo(u*(c+.5),p);
        a.strokeStyle="rgba(255,255,255,0.06)";a.lineWidth=1;a.stroke();
        l=requestAnimationFrame(h);
      };
      s();o(Math.floor(t().count));h();
      const ro=new ResizeObserver(()=>s());ro.observe(e);
      return ()=>{cancelAnimationFrame(l);ro.disconnect();};
    };
    return create(canvas, () => cfgRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

/* ── Small reusable bits ─────────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: C.line, margin: '0 48px' }} />;
}

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontFamily: C.mono, letterSpacing: '0.04em', color, background: bg, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function StatCell({ value, label, color = C.text }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ padding: '36px 32px', borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em', margin: 0, color }}>
        {value}
      </p>
      <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.text3, margin: 0 }}>
        {label}
      </p>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function CarlsonPage() {
  return (
    <div style={{ position: 'relative', zIndex: 1, color: C.text, fontFamily: C.sans, minHeight: '100vh' }}>
      <PendulumWaveBg />
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: ${C.bg}; }
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(240,180,41,0.5); }
          60%       { box-shadow: 0 0 0 7px rgba(240,180,41,0); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(61,204,145,0.5); }
          60%       { box-shadow: 0 0 0 7px rgba(61,204,145,0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .carlson-hero-content { animation: fade-up 0.9s ease both; }
        .carlson-chips         { animation: fade-up 0.9s 0.2s ease both; }
        .carlson-chip:hover   { border-color: rgba(255,255,255,0.28) !important; color: rgba(246,247,248,0.88) !important; }
        .carlson-btn-primary:hover { background: #600015 !important; }
        .carlson-btn-ghost:hover   { border-color: rgba(255,255,255,0.22) !important; color: ${C.text} !important; }
        .carlson-feature-card { transition: border-color 0.2s ease, transform 0.2s ease; }
        .carlson-feature-card:hover { border-color: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
        @media (max-width: 768px) {
          .carlson-hero-main { padding: 80px 24px 72px !important; }
          .carlson-stat-grid { grid-template-columns: 1fr 1fr !important; }
          .carlson-info-grid { grid-template-columns: 1fr !important; }
          .carlson-feat-grid { grid-template-columns: 1fr !important; }
          .carlson-tech-grid { grid-template-columns: 1fr !important; }
          .carlson-nav-meta  { display: none !important; }
          .carlson-section   { padding: 60px 24px !important; }
          .carlson-divider   { margin: 0 24px !important; }
        }
      ` }} />

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(8,8,16,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 15, letterSpacing: '-0.005em' }}>
          Ambient <em style={{ fontStyle: 'italic', color: C.text2, fontWeight: 300 }}>Intelligence</em>
        </span>
        {/* ── NAV MOTION GRAPHIC ── scrolling waveform, no text */}
        <div className="carlson-nav-meta" style={{
          lineHeight: 0,
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, white 10%, white 90%, transparent 100%)',
          maskImage:       'linear-gradient(90deg, transparent 0%, white 10%, white 90%, transparent 100%)',
        }}>
          <svg viewBox="0 0 360 16" width="360" height="16" style={{ display: 'block', overflow: 'hidden' }}>

            {/* faint zero-line */}
            <line x1="0" y1="8" x2="360" y2="8" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>

            {/* carrier wave — period 90, amplitude 6, maroon, slow */}
            <g>
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="-90,0" dur="2.2s" repeatCount="indefinite" calcMode="linear"/>
              <path fill="none" stroke="rgba(122,0,25,0.30)" strokeWidth="1.4"
                d="M -90,8 C -75,2 -60,2 -45,8 C -30,14 -15,14 0,8 C 15,2 30,2 45,8 C 60,14 75,14 90,8 C 105,2 120,2 135,8 C 150,14 165,14 180,8 C 195,2 210,2 225,8 C 240,14 255,14 270,8 C 285,2 300,2 315,8 C 330,14 345,14 360,8 C 375,2 390,2 405,8 C 420,14 435,14 450,8"/>
            </g>

            {/* data wave — period 60, amplitude 7, accent blue, faster */}
            <g>
              <animateTransform attributeName="transform" type="translate"
                from="0,0" to="-60,0" dur="0.85s" repeatCount="indefinite" calcMode="linear"/>
              <path fill="none" stroke="rgba(79,156,249,0.52)" strokeWidth="1.1"
                d="M -60,8 C -50,1 -40,1 -30,8 C -20,15 -10,15 0,8 C 10,1 20,1 30,8 C 40,15 50,15 60,8 C 70,1 80,1 90,8 C 100,15 110,15 120,8 C 130,1 140,1 150,8 C 160,15 170,15 180,8 C 190,1 200,1 210,8 C 220,15 230,15 240,8 C 250,1 260,1 270,8 C 280,15 290,15 300,8 C 310,1 320,1 330,8 C 340,15 350,15 360,8 C 370,1 380,1 390,8 C 400,15 410,15 420,8"/>
            </g>

            {/* gold dot — glow halo riding the data wave */}
            <circle r="5" fill="rgba(240,180,41,0.20)">
              <animateMotion dur="4.5s" repeatCount="indefinite" calcMode="spline"
                keyTimes="0;1" keySplines="0.42 0 0.58 1"
                path="M 0,8 C 10,1 20,1 30,8 C 40,15 50,15 60,8 C 70,1 80,1 90,8 C 100,15 110,15 120,8 C 130,1 140,1 150,8 C 160,15 170,15 180,8 C 190,1 200,1 210,8 C 220,15 230,15 240,8 C 250,1 260,1 270,8 C 280,15 290,15 300,8 C 310,1 320,1 330,8 C 340,15 350,15 360,8"/>
              <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.07;0.91;1" dur="4.5s" repeatCount="indefinite"/>
            </circle>

            {/* gold dot — core */}
            <circle r="2.2" fill="#F0B429">
              <animateMotion dur="4.5s" repeatCount="indefinite" calcMode="spline"
                keyTimes="0;1" keySplines="0.42 0 0.58 1"
                path="M 0,8 C 10,1 20,1 30,8 C 40,15 50,15 60,8 C 70,1 80,1 90,8 C 100,15 110,15 120,8 C 130,1 140,1 150,8 C 160,15 170,15 180,8 C 190,1 200,1 210,8 C 220,15 230,15 240,8 C 250,1 260,1 270,8 C 280,15 290,15 300,8 C 310,1 320,1 330,8 C 340,15 350,15 360,8"/>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.07;0.91;1" dur="4.5s" repeatCount="indefinite"/>
            </circle>

          </svg>
        </div>
        <a href="mailto:bribradley@gmail.com" className="carlson-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 999, background: C.maroon, color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em', transition: 'background 0.15s' }}>
          Connect
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: 680, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

        {/* Text legibility veil — dark at top and bottom, clear in center */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,16,0.62) 0%, rgba(8,8,16,0.18) 28%, rgba(8,8,16,0.18) 68%, rgba(8,8,16,0.62) 100%)', pointerEvents: 'none' }} />

        <div className="carlson-hero-main" style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '128px 48px 112px', width: '100%' }}>

          <p className="carlson-hero-content" style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.gold, margin: '0 0 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.gold, animation: 'pulse-gold 2s ease-out infinite', flexShrink: 0 }} />
            Carlson School of Management &middot; University of Minnesota
          </p>

          <h1 className="carlson-hero-content" style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(52px, 7vw, 92px)', lineHeight: 1.04, letterSpacing: '-0.03em', margin: '0 0 26px', maxWidth: 820 }}>
            Founder&apos;s Day{' '}
            <em style={{ fontStyle: 'italic', color: C.text2 }}>2026</em>
          </h1>

          <p className="carlson-hero-content" style={{ fontSize: 24, lineHeight: 1.6, color: C.text2, margin: '0 0 48px', maxWidth: 620 }}>
            24/7 contactless and noninvasive monitoring engineered for memory care.
          </p>

          <div className="carlson-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Wed, May 13, 2026', '4:30 – 7:00 PM', 'Walter Library · Toaster Hub', 'Free Admission'].map(chip => (
              <span key={chip} className="carlson-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 999, border: `1px solid ${C.lineStrg}`, background: 'rgba(255,255,255,0.04)', fontFamily: C.mono, fontSize: 11, color: C.text2, letterSpacing: '0.05em', cursor: 'default', transition: 'border-color 0.15s, color 0.15s' }}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROOM SENSOR DIAGRAM ─────────────────────────────────────────────── */}
      <section className="carlson-section" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="carlson-tech-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

            <div>
              <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: '0 0 18px' }}>How It Works</p>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(34px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px' }}>
                The resident moves freely.<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>We never interfere.</em>
              </h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.text2, margin: '0 0 32px' }}>
                Small sensors mount unobtrusively in the room and continuously map motion through space — covering the bedroom and bathroom without cameras, wearables, or any interaction from residents or staff.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  { text: 'Sensors mount in corners — out of sight, out of mind',       color: C.accent  },
                  { text: 'Full coverage including bathroom and transition zones',        color: C.gold    },
                  { text: 'Detects falls, posture changes, gait, and sleep patterns',    color: C.green   },
                  { text: 'No wearable, no camera, no resident interaction required',    color: C.maroon  },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: item.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>—</span>
                    <span style={{ fontSize: 14.5, color: C.text2, lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{
                position: 'relative',
                borderRadius: 18,
                overflow: 'hidden',
                border: `1px solid rgba(79,156,249,0.22)`,
                boxShadow: '0 0 48px rgba(79,156,249,0.10), 0 0 96px rgba(122,0,25,0.08)',
                background: '#f5f6f8',
                width: '100%',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/figure8.png"
                  alt="Isometric room diagram showing sensor coverage zones and a resident moving freely"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                {/* animated SVG overlay — sensor echoes + walking person */}
                <svg
                  viewBox="0 0 752 1376"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                >
                  {/* sensor echo rings — 3 staggered expanding rings per sensor */}
                  {([
                    { cx: 175, cy: 62,   delay: 0.0, dur: 2.8 },
                    { cx: 113, cy: 338,  delay: 0.6, dur: 2.4 },
                    { cx: 525, cy: 398,  delay: 1.1, dur: 2.6 },
                    { cx: 575, cy: 505,  delay: 0.4, dur: 2.5 },
                    { cx: 638, cy: 714,  delay: 0.9, dur: 2.7 },
                    { cx: 87,  cy: 1006, delay: 1.4, dur: 2.3 },
                    { cx: 384, cy: 1192, delay: 0.7, dur: 2.6 },
                  ] as Array<{ cx: number; cy: number; delay: number; dur: number }>).map((s, si) =>
                    [0, 1, 2].map(j => (
                      <circle key={`echo-${si}-${j}`} cx={s.cx} cy={s.cy} r={12} fill="none" stroke="#4F9CF9" strokeWidth={2.5}>
                        <animate attributeName="r"            from="12"  to="130" dur={`${s.dur}s`} begin={`${(s.delay + j * s.dur / 3).toFixed(2)}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity"      from="0.8" to="0"   dur={`${s.dur}s`} begin={`${(s.delay + j * s.dur / 3).toFixed(2)}s`} repeatCount="indefinite" />
                        <animate attributeName="stroke-width" from="3"   to="0.4" dur={`${s.dur}s`} begin={`${(s.delay + j * s.dur / 3).toFixed(2)}s`} repeatCount="indefinite" />
                      </circle>
                    ))
                  )}

                </svg>
              </div>
              <p style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.13em', color: C.text4, margin: 0, textAlign: 'center' }}>
                Fig. 8 &mdash; Sensor coverage · Patent pending · UMN OTC
              </p>
            </div>

          </div>
        </div>
      </section>

      <Divider />

      {/* ── TECHNOLOGY OVERVIEW ──────────────────────────────────────────────── */}
      <section className="carlson-section" style={{ padding: '88px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="carlson-tech-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

            <div>
              <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: '0 0 18px' }}>Technology</p>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(34px, 4vw, 50px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px' }}>
                Passive sensing.<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>Active intelligence.</em>
              </h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.text2, margin: '0 0 32px' }}>
                A 60 GHz FMCW radar sensor mounts in the corner of a resident room. It sees motion through fabric — detecting posture, gait, and falls — without capturing any images. Point-cloud data flows through AWS Kinesis into a Bedrock-powered AI model that generates plain-language summaries for the nurse dashboard in real time.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['IWR6843AOP Radar', 'AWS Kinesis', 'Bedrock AI', 'HIPAA Compliant', 'No Camera', 'No Wearable', 'PCT Patent Filed'].map(tag => (
                  <Tag key={tag} color={C.text3} bg="rgba(255,255,255,0.05)">{tag}</Tag>
                ))}
              </div>
            </div>

            {/* SVG data flow diagram */}
            <div>
              <svg viewBox="0 0 480 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <filter id="cf-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {Array.from({ length: 8 }, (_, i) => (
                  <line key={`vg${i}`} x1={i * 68} y1="0" x2={i * 68} y2="320" stroke="rgba(79,156,249,0.03)" strokeWidth="1"/>
                ))}
                {Array.from({ length: 6 }, (_, i) => (
                  <line key={`hg${i}`} x1="0" y1={i * 64} x2="480" y2={i * 64} stroke="rgba(79,156,249,0.03)" strokeWidth="1"/>
                ))}

                <line x1="80" y1="160" x2="190" y2="160" stroke="rgba(79,156,249,0.12)" strokeWidth="1"/>
                <line x1="290" y1="160" x2="400" y2="160" stroke="rgba(79,156,249,0.12)" strokeWidth="1"/>
                <line x1="240" y1="100" x2="240" y2="220" stroke="rgba(240,180,41,0.10)" strokeWidth="1" strokeDasharray="3 3"/>

                <g filter="url(#cf-glow)">
                  <circle cx="80" cy="160" r="28" fill="rgba(122,0,25,0.15)" stroke="#7A0019" strokeWidth="1.2"/>
                  <circle cx="80" cy="160" r="18" fill="rgba(122,0,25,0.25)"/>
                  <circle cx="80" cy="160" r="8"  fill="#7A0019" opacity="0.9"/>
                  <circle cx="80" cy="160" r="4"  fill="#fff" opacity="0.5"/>
                </g>
                <text x="80" y="204" textAnchor="middle" fill="rgba(246,247,248,0.6)" fontSize="9" fontFamily="var(--mono, monospace)" letterSpacing="0.1em">RADAR SENSOR</text>
                <text x="80" y="217" textAnchor="middle" fill="rgba(122,0,25,0.9)" fontSize="8" fontFamily="var(--mono, monospace)" letterSpacing="0.08em">IWR6843AOP</text>

                <g filter="url(#cf-glow)">
                  <circle cx="240" cy="160" r="28" fill="rgba(240,180,41,0.12)" stroke="#F0B429" strokeWidth="1.2"/>
                  <circle cx="240" cy="160" r="18" fill="rgba(240,180,41,0.2)"/>
                  <circle cx="240" cy="160" r="8"  fill="#F0B429" opacity="0.85"/>
                  <circle cx="240" cy="160" r="4"  fill="#fff" opacity="0.5"/>
                </g>
                <text x="240" y="204" textAnchor="middle" fill="rgba(246,247,248,0.6)" fontSize="9" fontFamily="var(--mono, monospace)" letterSpacing="0.1em">CLOUD AI</text>
                <text x="240" y="217" textAnchor="middle" fill="rgba(240,180,41,0.9)" fontSize="8" fontFamily="var(--mono, monospace)" letterSpacing="0.08em">AWS BEDROCK</text>

                <g filter="url(#cf-glow)">
                  <circle cx="400" cy="160" r="28" fill="rgba(79,156,249,0.12)" stroke="#4F9CF9" strokeWidth="1.2"/>
                  <circle cx="400" cy="160" r="18" fill="rgba(79,156,249,0.2)"/>
                  <circle cx="400" cy="160" r="8"  fill="#4F9CF9" opacity="0.85"/>
                  <circle cx="400" cy="160" r="4"  fill="#fff" opacity="0.5"/>
                </g>
                <text x="400" y="204" textAnchor="middle" fill="rgba(246,247,248,0.6)" fontSize="9" fontFamily="var(--mono, monospace)" letterSpacing="0.1em">NURSE DASHBOARD</text>
                <text x="400" y="217" textAnchor="middle" fill="rgba(79,156,249,0.9)" fontSize="8" fontFamily="var(--mono, monospace)" letterSpacing="0.08em">ELLA AI</text>

                {[36, 46, 58].map((r, i) => (
                  <circle key={r} cx="80" cy="160" r={r} fill="none" stroke="rgba(122,0,25,0.18)" strokeWidth="0.7" opacity="0">
                    <animate attributeName="r" from="28" to={r + 12} dur={`${2.2 + i * 0.6}s`} begin={`${i * 0.5}s`} repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.45" to="0" dur={`${2.2 + i * 0.6}s`} begin={`${i * 0.5}s`} repeatCount="indefinite"/>
                  </circle>
                ))}

                <circle r="3" fill="#F0B429" opacity="0.9">
                  <animateMotion dur="2.4s" repeatCount="indefinite" path="M80,160 L240,160"/>
                  <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.9;1" dur="2.4s" repeatCount="indefinite"/>
                </circle>
                <circle r="2" fill="#4F9CF9" opacity="0.7">
                  <animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite" path="M80,160 L240,160"/>
                  <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1" dur="2.4s" begin="-1.2s" repeatCount="indefinite"/>
                </circle>
                <circle r="3" fill="#4F9CF9" opacity="0.9">
                  <animateMotion dur="2s" begin="-0.6s" repeatCount="indefinite" path="M240,160 L400,160"/>
                  <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.9;1" dur="2s" begin="-0.6s" repeatCount="indefinite"/>
                </circle>
                <circle r="2" fill="#3DCC91" opacity="0.7">
                  <animateMotion dur="2s" begin="-1.6s" repeatCount="indefinite" path="M240,160 L400,160"/>
                  <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1" dur="2s" begin="-1.6s" repeatCount="indefinite"/>
                </circle>

                <circle r="2" fill="rgba(122,0,25,0.7)">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M45,125 A35,35 0 1,1 115,125 A35,35 0 1,1 45,125"/>
                </circle>
                <circle r="1.5" fill="rgba(240,180,41,0.7)">
                  <animateMotion dur="3.2s" begin="-1s" repeatCount="indefinite" path="M205,125 A35,35 0 1,1 275,125 A35,35 0 1,1 205,125"/>
                </circle>
                <circle r="1.5" fill="rgba(79,156,249,0.7)">
                  <animateMotion dur="3.8s" begin="-2s" repeatCount="indefinite" path="M365,125 A35,35 0 1,1 435,125 A35,35 0 1,1 365,125"/>
                </circle>

                <text x="160" y="150" textAnchor="middle" fill="rgba(246,247,248,0.2)" fontSize="7.5" fontFamily="var(--mono, monospace)" letterSpacing="0.08em">KINESIS</text>
                <text x="320" y="150" textAnchor="middle" fill="rgba(246,247,248,0.2)" fontSize="7.5" fontFamily="var(--mono, monospace)" letterSpacing="0.08em">API GATEWAY</text>
              </svg>
            </div>

          </div>
        </div>
      </section>

      <Divider />

      {/* ── ELLA AI ───────────────────────────────────────────────────────────── */}
      <section className="carlson-section" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: '0 0 18px' }}>Flagship Product</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="carlson-tech-grid">

            <div>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(34px, 4.5vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px' }}>
                Ella AI<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>Nurse Assistant</em>
              </h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.75, color: C.text2, margin: '0 0 28px' }}>
                Ella is the AI layer that makes ambient sensor data meaningful. It continuously analyzes motion patterns across a resident&apos;s room and generates plain-language summaries — surfacing what matters to the care team without requiring any interaction from residents or nurses.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {[
                  { text: 'Generates plain-language resident summaries via AWS Bedrock', color: C.accent },
                  { text: 'Prioritized alert queue with anomaly detection', color: C.gold },
                  { text: 'Behavioral trend analysis over days, weeks, and months', color: C.green },
                  { text: 'Privacy by architecture — PHI never in transit', color: C.maroon },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: item.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>—</span>
                    <span style={{ fontSize: 14.5, color: C.text2, lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ fontFamily: C.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, textDecoration: 'none' }}>
                ellamemory.com ↗
              </a>
            </div>

            {/* Mini dashboard card */}
            <div style={{ background: C.surf1, border: `1px solid ${C.lineStrg}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3 }}>Ella AI · Live Dashboard</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.green }}>
                  <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.green, animation: 'pulse-green 2s ease-out infinite' }} />
                  Active
                </span>
              </div>

              <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${C.line}` }}>
                <p style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text4, margin: '0 0 8px' }}>Resident Activity · 24h</p>
                <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
                  <defs>
                    <linearGradient id="ella-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#4F9CF9" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <polygon points="0,60 28,42 56,36 84,28 112,22 140,32 168,18 196,24 224,30 252,16 280,26 308,20 336,32 364,24 392,14 400,18 400,60" fill="url(#ella-grad)"/>
                  <polyline points="28,42 56,36 84,28 112,22 140,32 168,18 196,24 224,30 252,16 280,26 308,20 336,32 364,24 392,14" fill="none" stroke="#4F9CF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="252" cy="16" r="3.5" fill="#FF6680" stroke={C.surf1} strokeWidth="1.5"/>
                </svg>
              </div>

              <div>
                {[
                  { room: '114A', name: 'M. Johansson', status: 'Elevated', color: '#FF6680' },
                  { room: '116B', name: 'R. Chen',      status: 'Normal',   color: C.green   },
                  { room: '118A', name: 'E. Okonkwo',   status: 'Normal',   color: C.green   },
                ].map(r => (
                  <div key={r.room} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, width: 30 }}>{r.room}</span>
                    <span style={{ fontFamily: C.serif, fontSize: 14, fontWeight: 400, flex: 1 }}>{r.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: r.color }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: r.color }} />
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 20px', background: C.accentSoft }}>
                <p style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, margin: '0 0 8px' }}>Ella AI · Room 114A Summary</p>
                <p style={{ fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.6, color: C.text2, margin: 0, fontStyle: 'italic' }}>
                  &ldquo;Mrs. Johansson showed increased nighttime movement between 2:00 and 4:00 AM. No fall events detected. Recommend checking in this morning.&rdquo;
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Divider />

      {/* ── MINNESOTA ROOTS ───────────────────────────────────────────────────── */}
      <section className="carlson-section" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: '0 0 18px' }}>Minnesota Roots</p>
          <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 48px' }}>
            Built in Minnesota.<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>For Minnesota care.</em>
          </h2>

          <div className="carlson-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                label: 'University of Minnesota', color: C.maroon,
                title: 'Office of Discovery & Translation',
                desc:  'UMN OTC is supporting our PCT patent filing and commercialization pathway. We are preparing for a Q3 2025 IRB submission for our Minneapolis pilot study.',
                tags:  ['PCT Patent', 'IRB Pending', 'Commercialization'],
              },
              {
                label: 'Accelerator', color: C.gold,
                title: 'gener8tor Portfolio',
                desc:  'Backed by gener8tor — the nationally recognized accelerator that connects founders to capital, mentors, and enterprise partners across the Midwest.',
                tags:  ['gener8tor', 'Accelerator', 'Midwest Network'],
              },
              {
                label: 'Pilot Site', color: C.green,
                title: 'Minneapolis Summer 2026',
                desc:  'Targeting 1–2 skilled nursing facilities in Minnesota for an observational pilot study. Real care environments. Real outcomes. IRB-guided and HIPAA-compliant.',
                tags:  ['Minneapolis', 'Summer 2026', 'SNF Pilot'],
              },
            ].map(card => (
              <div key={card.title} style={{ padding: '28px 28px 24px', background: C.surf1, border: `1px solid ${C.lineStrg}`, borderRadius: 14 }}>
                <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: card.color, margin: '0 0 14px', opacity: 0.85 }}>{card.label}</p>
                <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 22, letterSpacing: '-0.015em', margin: '0 0 14px', lineHeight: 1.25 }}>{card.title}</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: C.text2, margin: '0 0 20px', fontStyle: 'italic' }}>{card.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {card.tags.map(t => <Tag key={t} color={card.color} bg={`${card.color}18`}>{t}</Tag>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 48px', background: C.surf1, borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.text4, margin: '0 0 20px' }}>May 13 · Toaster Innovation Hub</p>
          <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 22px' }}>
            Engineered for<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>Memory Care.</em>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.72, color: C.text2, margin: '0 0 44px' }}>
            We&apos;ll have a live demo running at our table — radar sensor data flowing into Ella AI, surfacing insights in real time. No pitch deck. Just the actual product.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <a href="mailto:bribradley@gmail.com" className="carlson-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: C.maroon, color: '#fff', borderRadius: 999, padding: '14px 32px', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s' }}>
              Get in Touch
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" className="carlson-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: `1px solid ${C.lineStrg}`, color: C.text2, borderRadius: 999, padding: '14px 32px', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}>
              Explore Ella Memory
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.line}`, padding: '22px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ fontFamily: C.serif, fontSize: 14, fontWeight: 300 }}>Ambient Intelligence</span>
          <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text4, margin: 0, textAlign: 'center' }}>
            PCT Patent · UMN OTC · Minneapolis 2026 · gener8tor Portfolio
          </p>
          <div style={{ display: 'flex', gap: 22 }}>
            {[
              ['https://www.ellamemory.com/', 'ellamemory.com'],
              ['/mn', 'Investor Info'],
              ['https://carlsonschool.umn.edu/events/20260513-founders-day-2026', "Founder's Day"],
            ].map(([href, label]) => (
              <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text4, textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
