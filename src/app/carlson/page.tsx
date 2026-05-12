'use client';
import { useEffect, useRef } from 'react';

/* ── Palette ─────────────────────────────────────────────────────────────────── */
const C = {
  bg:         '#080808',
  bg2:        '#0F0F0F',
  surf1:      '#161616',
  line:       'rgba(255,255,255,0.08)',
  lineStrg:   'rgba(255,255,255,0.14)',
  text:       '#FFFFFF',
  text2:      'rgba(255,255,255,0.52)',
  text3:      'rgba(255,255,255,0.34)',
  text4:      'rgba(255,255,255,0.22)',
  maroon:     '#7A0019',
  gold:       '#F0B429',
  accent:     '#4F9CF9',
  green:      '#3DCC91',
  serif:      'var(--serif, Georgia, serif)',
  mono:       'var(--mono, monospace)',
  sans:       'var(--sans, -apple-system, sans-serif)',
};

/* ── FlowGlow background ─────────────────────────────────────────────────────── */
type Cfg = Record<string, number>;

function FlowGlowBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<Cfg>({ cornerRadius: 3, speed: 0.72, blobSize: 0.78, intensity: 0.73, strokeWidth: 23.5, padding: 0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const create = function create(e: HTMLCanvasElement, t: () => Cfg) {
      // @ts-ignore — minified canvas engine
      let a,l=e.getContext("2d"),i=0,n=0,r=performance.now(),o=[[188,130,243],[245,185,234],[141,159,255],[255,103,120],[255,186,113],[198,134,255]],s=[{fx:.31,fy:.47,px:0,py:.5*Math.PI},{fx:.53,fy:.29,px:Math.PI,py:1.2*Math.PI},{fx:.41,fy:.67,px:.7*Math.PI,py:0},{fx:.23,fy:.53,px:1.5*Math.PI,py:.8*Math.PI},{fx:.59,fy:.37,px:.3*Math.PI,py:1.7*Math.PI},{fx:.43,fy:.61,px:1.1*Math.PI,py:.3*Math.PI}],h=["#BC82F3","#F5B9EA","#8D9FFF","#FF6778","#FFBA71","#C686FF"],d=[...h],m=[...h],c=1,p=.45,g=e=>{let t=parseInt(e.replace("#",""),16);return[t>>16&255,t>>8&255,255&t]},u=()=>{let t=e.getBoundingClientRect();e.width=t.width||window.innerWidth,e.height=t.height||window.innerHeight},b=(e,t,a,i,n)=>{n=Math.max(0,Math.min(n,a/2,i/2)),l.beginPath(),l.moveTo(e+n,t),l.lineTo(e+a-n,t),l.arcTo(e+a,t,e+a,t+n,n),l.lineTo(e+a,t+i-n),l.arcTo(e+a,t+i,e+a-n,t+i,n),l.lineTo(e+n,t+i),l.arcTo(e,t+i,e,t+i-n,n),l.lineTo(e,t+n),l.arcTo(e,t,e+n,t,n),l.closePath()},f=u=>{let y=Math.min((u-r)/1e3,.05);r=u;let M=t(),x=e.width,w=e.height,k=x/2,S=w/2,v=Math.min(x,w);i+=M.speed*y,n+=.4*y,c=Math.min(1,c+y/.55),(p-=y)<=0&&c>=1&&(p=.4+.15*Math.random(),d=[...m],c=0,m=[...h].sort(()=>Math.random()-.5));let C=d.map((e,t)=>((e,t,a)=>{let[l,i,n]=g(e),[r,o,s]=g(t);return`rgb(${Math.round(l+(r-l)*a)},${Math.round(i+(o-i)*a)},${Math.round(n+(s-n)*a)})`})(e,m[t],c));l.clearRect(0,0,x,w),l.fillStyle="#080808",l.fillRect(0,0,x,w);let R=M.padding,F=M.strokeWidth,A=M.intensity,I=x-2*R,P=w-2*R,$=M.cornerRadius,z=v*M.blobSize;l.save(),b(R,R,I,P,$),l.clip(),l.globalCompositeOperation="screen",s.forEach((e,t)=>{let[a,n,r]=o[t],s=k+.4*I*Math.sin(i*e.fx+e.px),h=S+.4*P*Math.cos(i*e.fy+e.py),d=l.createRadialGradient(s,h,0,s,h,z);d.addColorStop(0,`rgba(${a},${n},${r},${.82*A})`),d.addColorStop(.42,`rgba(${a},${n},${r},${.36*A})`),d.addColorStop(1,`rgba(${a},${n},${r},0)`),l.beginPath(),l.arc(s,h,z,0,2*Math.PI),l.fillStyle=d,l.fill()}),l.restore();let B=(e,t,a)=>{let i;l.save(),t>0&&(l.filter=`blur(${t}px)`),l.globalAlpha=a,i=l.createConicGradient(n-Math.PI/2,k,S),C.forEach((e,t)=>i.addColorStop(t/C.length,e)),i.addColorStop(1,C[0]),l.strokeStyle=i,l.lineWidth=e,l.lineCap="round",b(R,R,I,P,$),l.stroke(),l.restore()};B(4.5*F,26*A,.3*A),B(2.8*F,14*A,.5*A),B(1.6*F,5*A,.72*A),B(F,0,1),a=requestAnimationFrame(f)};u(),a=requestAnimationFrame(f);let y=new ResizeObserver(()=>u());return y.observe(e),()=>{cancelAnimationFrame(a),y.disconnect()}
    };
    return create(canvas, () => cfgRef.current);
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

/* ── Primitives ──────────────────────────────────────────────────────────────── */
function Rule() {
  return <div style={{ height: 1, background: C.line, width: '100%' }} />;
}

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 2, fontSize: 10, fontFamily: C.mono, letterSpacing: '0.06em', color, background: bg, border: `1px solid ${color}28` }}>
      {children}
    </span>
  );
}

function SectionMeta({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ marginBottom: 64 }}>
      <span style={{ fontFamily: C.mono, fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 300, letterSpacing: '0.12em', color: C.text3, display: 'block', marginBottom: 18 }}>{n}</span>
      <p style={{ fontFamily: C.sans, fontWeight: 500, fontSize: 'clamp(48px, 6vw, 72px)', letterSpacing: '-0.03em', lineHeight: 1.06, color: C.text, margin: 0 }}>{label}</p>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function CarlsonPage() {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: C.sans, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: ${C.bg}; margin: 0; }
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes pulse-gold {
          0%,100% { box-shadow: 0 0 0 0 rgba(240,180,41,0.5); }
          60%      { box-shadow: 0 0 0 7px rgba(240,180,41,0); }
        }
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 0 0 0 rgba(61,204,145,0.5); }
          60%      { box-shadow: 0 0 0 7px rgba(61,204,145,0); }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .c-e { animation: fade-up 0.8s 0.1s ease both; }
        .c-h { animation: fade-up 0.85s 0.25s ease both; }
        .c-s { animation: fade-up 0.85s 0.4s ease both; }
        .c-p { animation: fade-up 0.85s 0.55s ease both; }
        .c-chip:hover { border-color:rgba(255,255,255,0.26)!important; color:rgba(240,241,242,0.88)!important; }
        .c-primary:hover { background:#5d0012!important; }
        .c-ghost:hover { border-color:rgba(255,255,255,0.24)!important; color:${C.text}!important; }
        .c-nav-link:hover { color:rgba(240,241,242,0.88)!important; }
        @media(max-width:960px){
          .c-two { grid-template-columns:1fr!important; }
          .c-three { grid-template-columns:1fr 1fr!important; }
          .c-hero { padding:108px 36px 84px!important; }
          .c-sec { padding:80px 36px!important; }
          .c-stat-row { grid-template-columns:1fr 1fr!important; }
        }
        @media(max-width:600px){
          .c-three { grid-template-columns:1fr!important; }
          .c-sec { padding:64px 24px!important; }
          .c-stat-row { grid-template-columns:1fr 1fr!important; }
        }
      ` }} />

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 80px', background: 'rgba(8,8,8,0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 15, letterSpacing: '-0.01em' }}>
          Ambient <em style={{ fontStyle: 'italic', color: C.text2 }}>Intelligence</em>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4 }}>Founder&apos;s Day 2026</span>
          <a href="mailto:bribradley@gmail.com" className="c-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 2, background: C.maroon, color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.02em', transition: 'background 0.15s' }}>
            Connect
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <FlowGlowBg />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,8,8,0.52) 0%,rgba(7,9,14,0.08) 35%,rgba(7,9,14,0.08) 65%,rgba(8,8,8,0.90) 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <div className="c-hero" style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '148px 56px 120px', width: '100%' }}>
          <p className="c-e" style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.24em', color: C.gold, margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.gold, animation: 'pulse-gold 2s ease-out infinite', flexShrink: 0 }} />
            Carlson School of Management &middot; University of Minnesota
          </p>
          <h1 className="c-h" style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(58px, 8vw, 108px)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 32px', maxWidth: 900 }}>
            Founder&apos;s Day{' '}
            <em style={{ fontStyle: 'italic', color: C.text2 }}>2026</em>
          </h1>
          <p className="c-s" style={{ fontSize: 'clamp(18px, 2vw, 23px)', lineHeight: 1.64, color: C.text2, margin: '0 0 56px', maxWidth: 540 }}>
            24/7 contactless and noninvasive monitoring engineered for memory care.
          </p>
          <div className="c-p" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Wed, May 13, 2026', '4:30 – 7:00 PM', 'Walter Library · Toaster Hub', 'Free Admission'].map(chip => (
              <span key={chip} className="c-chip" style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 18px', borderRadius: 2, border: `1px solid ${C.lineStrg}`, background: 'rgba(255,255,255,0.04)', fontFamily: C.mono, fontSize: 11, color: C.text2, letterSpacing: '0.06em', cursor: 'default', transition: 'border-color 0.15s, color 0.15s' }}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ───────────────────────────────────────────────────────── */}
      <Rule />
      <section style={{ background: C.bg2, padding: '96px 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="01" label="The Problem" />
          <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(30px, 4.2vw, 54px)', lineHeight: 1.36, letterSpacing: '-0.018em', color: C.text, margin: '0 0 64px' }}>
            Two-thirds of memory care incidents happen at night — unwitnessed, in the minutes between rounds. We built a system that is always present without ever being intrusive.
          </p>
          <div className="c-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${C.line}`, paddingTop: 56 }}>
            {[
              { n: '60 GHz',  label: 'Radar frequency'              },
              { n: '<50 ms',  label: 'Detection latency'            },
              { n: '100%',    label: 'Camera-free'                  },
              { n: '0',       label: 'Resident interactions needed' },
            ].map((s, i) => (
              <div key={s.n} style={{ paddingRight: 32, borderRight: i < 3 ? `1px solid ${C.line}` : 'none', paddingLeft: i > 0 ? 32 : 0 }}>
                <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(44px, 5.5vw, 72px)', lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 12px', color: C.text }}>{s.n}</p>
                <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 01: HOW IT WORKS ─────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="02" label="How It Works" />
          <div className="c-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 60px)', lineHeight: 1.1, letterSpacing: '-0.026em', margin: '0 0 28px' }}>
                The resident moves freely.<br/>
                <em style={{ fontStyle: 'italic', color: C.text2 }}>We never interfere.</em>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.76, color: C.text2, margin: '0 0 40px' }}>
                Small sensors mount unobtrusively in the room and continuously map motion through space — covering the bedroom and bathroom without cameras, wearables, or any interaction from residents or staff.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { text: 'Sensors mount in corners — out of sight, out of mind',    color: C.accent  },
                  { text: 'Full coverage including bathroom and transition zones',     color: C.gold    },
                  { text: 'Detects falls, posture changes, gait, and sleep patterns', color: C.green   },
                  { text: 'No wearable, no camera, no resident interaction required', color: C.maroon  },
                ].map((item, i) => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 0, borderTop: `1px solid ${C.line}`, padding: '18px 0' }}>
                    <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.12em', color: item.color, marginRight: 20, marginTop: 3, flexShrink: 0, paddingRight: 20, borderRight: `1px solid ${C.line}` }}>0{i+1}</span>
                    <span style={{ fontSize: 16, color: C.text2, lineHeight: 1.58 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.line}`, background: '#f5f6f8', width: '100%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/figure8.png" alt="Isometric room diagram" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <svg viewBox="0 0 752 1376" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}>
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
                        <animate attributeName="r" from="12" to="130" dur={`${s.dur}s`} begin={`${(s.delay + j * s.dur / 3).toFixed(2)}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.8" to="0" dur={`${s.dur}s`} begin={`${(s.delay + j * s.dur / 3).toFixed(2)}s`} repeatCount="indefinite" />
                        <animate attributeName="stroke-width" from="3" to="0.4" dur={`${s.dur}s`} begin={`${(s.delay + j * s.dur / 3).toFixed(2)}s`} repeatCount="indefinite" />
                      </circle>
                    ))
                  )}
                </svg>
              </div>
              <p style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.text4, margin: 0, textAlign: 'center' }}>
                Fig. 8 — Sensor coverage · Patent pending · UMN OTC
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERSTITIAL STATEMENT ───────────────────────────────────────────── */}
      <Rule />
      <section style={{ background: C.bg2, padding: '80px 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'baseline', gap: 48 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.text4, flexShrink: 0 }}>The technology</span>
          <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(24px, 3vw, 42px)', lineHeight: 1.44, letterSpacing: '-0.016em', color: C.text2, margin: 0 }}>
            A 60 GHz FMCW radar sensor sees motion through fabric — detecting posture, gait, and falls — without ever capturing an image.
          </p>
        </div>
      </section>

      {/* ── 02: TECHNOLOGY ───────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="03" label="Technology" />
          <div className="c-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 60px)', lineHeight: 1.1, letterSpacing: '-0.026em', margin: '0 0 28px' }}>
                Passive sensing.<br/>
                <em style={{ fontStyle: 'italic', color: C.text2 }}>Active intelligence.</em>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.76, color: C.text2, margin: '0 0 40px' }}>
                Point-cloud data flows through AWS Kinesis into a Bedrock-powered AI model that generates plain-language summaries for the nurse dashboard in real time. No images. No identifiable data in transit.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['IWR6843AOP Radar', 'AWS Kinesis', 'Bedrock AI', 'HIPAA Compliant', 'No Camera', 'No Wearable', 'PCT Patent Filed'].map(tag => (
                  <Tag key={tag} color={C.text3} bg="rgba(255,255,255,0.04)">{tag}</Tag>
                ))}
              </div>
            </div>
            <div>
              <svg viewBox="0 0 480 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <filter id="cf-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                {Array.from({ length: 8 }, (_, i) => <line key={`vg${i}`} x1={i*68} y1="0" x2={i*68} y2="320" stroke="rgba(79,156,249,0.03)" strokeWidth="1"/>)}
                {Array.from({ length: 6 }, (_, i) => <line key={`hg${i}`} x1="0" y1={i*64} x2="480" y2={i*64} stroke="rgba(79,156,249,0.03)" strokeWidth="1"/>)}
                <line x1="80" y1="160" x2="190" y2="160" stroke="rgba(79,156,249,0.12)" strokeWidth="1"/>
                <line x1="290" y1="160" x2="400" y2="160" stroke="rgba(79,156,249,0.12)" strokeWidth="1"/>
                <line x1="240" y1="100" x2="240" y2="220" stroke="rgba(240,180,41,0.10)" strokeWidth="1" strokeDasharray="3 3"/>
                <g filter="url(#cf-glow)">
                  <circle cx="80" cy="160" r="28" fill="rgba(122,0,25,0.15)" stroke="#7A0019" strokeWidth="1.2"/>
                  <circle cx="80" cy="160" r="18" fill="rgba(122,0,25,0.25)"/>
                  <circle cx="80" cy="160" r="8"  fill="#7A0019" opacity="0.9"/>
                  <circle cx="80" cy="160" r="4"  fill="#fff" opacity="0.5"/>
                </g>
                <text x="80" y="204" textAnchor="middle" fill="rgba(240,241,242,0.55)" fontSize="9" fontFamily="var(--mono,monospace)" letterSpacing="0.1em">RADAR SENSOR</text>
                <text x="80" y="217" textAnchor="middle" fill="rgba(122,0,25,0.9)" fontSize="8" fontFamily="var(--mono,monospace)" letterSpacing="0.08em">IWR6843AOP</text>
                <g filter="url(#cf-glow)">
                  <circle cx="240" cy="160" r="28" fill="rgba(240,180,41,0.12)" stroke="#F0B429" strokeWidth="1.2"/>
                  <circle cx="240" cy="160" r="18" fill="rgba(240,180,41,0.2)"/>
                  <circle cx="240" cy="160" r="8"  fill="#F0B429" opacity="0.85"/>
                  <circle cx="240" cy="160" r="4"  fill="#fff" opacity="0.5"/>
                </g>
                <text x="240" y="204" textAnchor="middle" fill="rgba(240,241,242,0.55)" fontSize="9" fontFamily="var(--mono,monospace)" letterSpacing="0.1em">CLOUD AI</text>
                <text x="240" y="217" textAnchor="middle" fill="rgba(240,180,41,0.9)" fontSize="8" fontFamily="var(--mono,monospace)" letterSpacing="0.08em">AWS BEDROCK</text>
                <g filter="url(#cf-glow)">
                  <circle cx="400" cy="160" r="28" fill="rgba(79,156,249,0.12)" stroke="#4F9CF9" strokeWidth="1.2"/>
                  <circle cx="400" cy="160" r="18" fill="rgba(79,156,249,0.2)"/>
                  <circle cx="400" cy="160" r="8"  fill="#4F9CF9" opacity="0.85"/>
                  <circle cx="400" cy="160" r="4"  fill="#fff" opacity="0.5"/>
                </g>
                <text x="400" y="204" textAnchor="middle" fill="rgba(240,241,242,0.55)" fontSize="9" fontFamily="var(--mono,monospace)" letterSpacing="0.1em">NURSE DASHBOARD</text>
                <text x="400" y="217" textAnchor="middle" fill="rgba(79,156,249,0.9)" fontSize="8" fontFamily="var(--mono,monospace)" letterSpacing="0.08em">ELLA AI</text>
                {[36,46,58].map((rv, i) => (
                  <circle key={rv} cx="80" cy="160" r={rv} fill="none" stroke="rgba(122,0,25,0.18)" strokeWidth="0.7" opacity="0">
                    <animate attributeName="r" from="28" to={rv+12} dur={`${2.2+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.45" to="0" dur={`${2.2+i*0.6}s`} begin={`${i*0.5}s`} repeatCount="indefinite"/>
                  </circle>
                ))}
                <circle r="3" fill="#F0B429" opacity="0.9"><animateMotion dur="2.4s" repeatCount="indefinite" path="M80,160 L240,160"/><animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.9;1" dur="2.4s" repeatCount="indefinite"/></circle>
                <circle r="2" fill="#4F9CF9" opacity="0.7"><animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite" path="M80,160 L240,160"/><animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1" dur="2.4s" begin="-1.2s" repeatCount="indefinite"/></circle>
                <circle r="3" fill="#4F9CF9" opacity="0.9"><animateMotion dur="2s" begin="-0.6s" repeatCount="indefinite" path="M240,160 L400,160"/><animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.9;1" dur="2s" begin="-0.6s" repeatCount="indefinite"/></circle>
                <circle r="2" fill="#3DCC91" opacity="0.7"><animateMotion dur="2s" begin="-1.6s" repeatCount="indefinite" path="M240,160 L400,160"/><animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1" dur="2s" begin="-1.6s" repeatCount="indefinite"/></circle>
                <circle r="2" fill="rgba(122,0,25,0.7)"><animateMotion dur="4s" repeatCount="indefinite" path="M45,125 A35,35 0 1,1 115,125 A35,35 0 1,1 45,125"/></circle>
                <circle r="1.5" fill="rgba(240,180,41,0.7)"><animateMotion dur="3.2s" begin="-1s" repeatCount="indefinite" path="M205,125 A35,35 0 1,1 275,125 A35,35 0 1,1 205,125"/></circle>
                <circle r="1.5" fill="rgba(79,156,249,0.7)"><animateMotion dur="3.8s" begin="-2s" repeatCount="indefinite" path="M365,125 A35,35 0 1,1 435,125 A35,35 0 1,1 365,125"/></circle>
                <text x="160" y="150" textAnchor="middle" fill="rgba(240,241,242,0.18)" fontSize="7.5" fontFamily="var(--mono,monospace)" letterSpacing="0.08em">KINESIS</text>
                <text x="320" y="150" textAnchor="middle" fill="rgba(240,241,242,0.18)" fontSize="7.5" fontFamily="var(--mono,monospace)" letterSpacing="0.08em">API GATEWAY</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03: ELLA AI ──────────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ background: C.bg2, padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="04" label="Flagship Product" />
          <div className="c-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'start' }}>

            {/* Dashboard card — left */}
            <div style={{ background: C.surf1, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
              <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.28"/>
                      <stop offset="100%" stopColor="#4F9CF9" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <polygon points="0,60 28,42 56,36 84,28 112,22 140,32 168,18 196,24 224,30 252,16 280,26 308,20 336,32 364,24 392,14 400,18 400,60" fill="url(#ella-grad)"/>
                  <polyline points="28,42 56,36 84,28 112,22 140,32 168,18 196,24 224,30 252,16 280,26 308,20 336,32 364,24 392,14" fill="none" stroke="#4F9CF9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="252" cy="16" r="3.5" fill="#FF6680" stroke={C.surf1} strokeWidth="1.5"/>
                </svg>
              </div>
              {[
                { room: '114A', name: 'M. Johansson', status: 'Elevated', color: '#FF6680' },
                { room: '116B', name: 'R. Chen',      status: 'Normal',   color: C.green   },
                { room: '118A', name: 'E. Okonkwo',   status: 'Normal',   color: C.green   },
              ].map(r => (
                <div key={r.room} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, width: 30 }}>{r.room}</span>
                  <span style={{ fontFamily: C.serif, fontSize: 14, fontWeight: 400, flex: 1 }}>{r.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: r.color }}>
                    <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: r.color }} />
                    {r.status}
                  </span>
                </div>
              ))}
              <div style={{ padding: '18px 20px', borderLeft: `2px solid ${C.accent}` }}>
                <p style={{ fontFamily: C.mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, margin: '0 0 12px' }}>Ella AI · Room 114A Summary</p>
                <p style={{ fontFamily: C.serif, fontSize: 13.5, lineHeight: 1.66, color: C.text2, margin: 0, fontStyle: 'italic' }}>
                  &ldquo;Mrs. Johansson showed increased nighttime movement between 2:00 and 4:00 AM. No fall events detected. Recommend checking in this morning.&rdquo;
                </p>
              </div>
            </div>

            {/* Text — right */}
            <div style={{ paddingTop: 8 }}>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 60px)', lineHeight: 1.1, letterSpacing: '-0.026em', margin: '0 0 28px' }}>
                Ella AI<br/>
                <em style={{ fontStyle: 'italic', color: C.text2 }}>Nurse Assistant</em>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.76, color: C.text2, margin: '0 0 36px' }}>
                Ella is the AI layer that makes ambient sensor data meaningful. It continuously analyzes motion patterns and generates plain-language summaries — surfacing what matters to the care team without requiring any interaction from residents or nurses.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 40 }}>
                {[
                  { text: 'Plain-language resident summaries via AWS Bedrock', color: C.accent  },
                  { text: 'Prioritized alert queue with anomaly detection',      color: C.gold   },
                  { text: 'Behavioral trend analysis — days, weeks, months',     color: C.green  },
                  { text: 'Privacy by architecture — PHI never in transit',      color: C.maroon },
                ].map((item, i) => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 0, borderTop: `1px solid ${C.line}`, padding: '17px 0' }}>
                    <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.12em', color: item.color, marginRight: 20, marginTop: 3, flexShrink: 0, paddingRight: 20, borderRight: `1px solid ${C.line}` }}>0{i+1}</span>
                    <span style={{ fontSize: 16, color: C.text2, lineHeight: 1.58 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ fontFamily: C.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.accent, textDecoration: 'none' }}>
                ellamemory.com ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04: MINNESOTA ────────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="05" label="Minnesota Roots" />
          <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(40px, 4.5vw, 60px)', lineHeight: 1.08, letterSpacing: '-0.028em', margin: '0 0 64px', maxWidth: 640 }}>
            Built in Minnesota.<br/>
            <em style={{ fontStyle: 'italic', color: C.text2 }}>For Minnesota care.</em>
          </h2>
          <div className="c-three" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${C.line}` }}>
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
            ].map((card, i) => (
              <div key={card.title} style={{ padding: '36px 32px 32px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ width: 24, height: 2, background: card.color, marginBottom: 24, opacity: 0.7 }} />
                <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: card.color, margin: '0 0 14px', opacity: 0.85 }}>{card.label}</p>
                <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 21, letterSpacing: '-0.012em', margin: '0 0 16px', lineHeight: 1.28, color: C.text }}>{card.title}</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.72, color: C.text2, margin: '0 0 24px' }}>{card.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {card.tags.map(t => <Tag key={t} color={card.color} bg={`${card.color}15`}>{t}</Tag>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────────── */}
      <Rule />
      <section style={{ background: C.bg2, padding: '120px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'center' }} className="c-two">
          <div>
            <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.text4, margin: '0 0 24px' }}>May 13 · Toaster Innovation Hub</p>
            <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 62px)', lineHeight: 1.06, letterSpacing: '-0.032em', margin: '0 0 24px' }}>
              Engineered for<br/>
              <em style={{ fontStyle: 'italic', color: C.text2 }}>Memory Care.</em>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.76, color: C.text2, margin: 0 }}>
              We&apos;ll have a live demo running at our table — radar sensor data flowing into Ella AI, surfacing insights in real time. No pitch deck. Just the actual product.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <a href="mailto:bribradley@gmail.com" className="c-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: C.maroon, color: '#fff', borderRadius: 2, padding: '16px 36px', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s', letterSpacing: '0.01em' }}>
              Get in Touch
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" className="c-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${C.lineStrg}`, color: C.text2, borderRadius: 2, padding: '16px 36px', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}>
              Explore Ella Memory
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────────── */}
      <Rule />
      <footer style={{ padding: '28px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontFamily: C.serif, fontSize: 14, fontWeight: 300, color: C.text2 }}>Ambient Intelligence</span>
          <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text4, margin: 0, textAlign: 'center' }}>
            PCT Patent · UMN OTC · Minneapolis 2026 · gener8tor
          </p>
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              ['https://www.ellamemory.com/', 'ellamemory.com'],
              ['/mn', 'Investor Info'],
              ['https://carlsonschool.umn.edu/events/20260513-founders-day-2026', "Founder's Day"],
            ].map(([href, label]) => (
              <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className="c-nav-link" style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text4, textDecoration: 'none', transition: 'color 0.15s' }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
