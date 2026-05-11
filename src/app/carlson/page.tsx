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

/* ── FlowGlow hero background (from Background Lab) ─────────────────────────── */
type Cfg = Record<string, number>;

function FlowGlowBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<Cfg>({
    cornerRadius: 0,
    speed:        0.22,
    blobSize:     0.66,
    intensity:    0.71,
    strokeWidth:  10.5,
    padding:      25,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let flowT = 0, borderAngle = 0, lastTs = performance.now();

    const COLORS: [number, number, number][] = [
      [188,130,243],[245,185,234],[141,159,255],[255,103,120],[255,186,113],[198,134,255],
    ];
    const BLOBS = [
      { fx: 0.31, fy: 0.47, px: 0,              py: Math.PI * 0.50 },
      { fx: 0.53, fy: 0.29, px: Math.PI,        py: Math.PI * 1.20 },
      { fx: 0.41, fy: 0.67, px: Math.PI * 0.70, py: 0              },
      { fx: 0.23, fy: 0.53, px: Math.PI * 1.50, py: Math.PI * 0.80 },
      { fx: 0.59, fy: 0.37, px: Math.PI * 0.30, py: Math.PI * 1.70 },
      { fx: 0.43, fy: 0.61, px: Math.PI * 1.10, py: Math.PI * 0.30 },
    ];

    const BASE_HEX = ['#BC82F3','#F5B9EA','#8D9FFF','#FF6778','#FFBA71','#C686FF'];
    let curC = [...BASE_HEX], tgtC = [...BASE_HEX], lerpT = 1.0, nextSwap = 0.45;

    const hexToRgb = (h: string): [number, number, number] => {
      const v = parseInt(h.replace('#', ''), 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    };
    const lerpHex = (a: string, b: string, t: number) => {
      const [ar,ag,ab] = hexToRgb(a), [br,bg,bb] = hexToRgb(b);
      return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width  = r.width  || window.innerWidth;
      canvas.height = r.height || window.innerHeight;
    };

    const rrectPath = (x: number, y: number, w: number, h: number, r: number) => {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
      ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
      ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
      ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
      ctx.closePath();
    };

    type CC = CanvasRenderingContext2D & { createConicGradient: (a: number, x: number, y: number) => CanvasGradient };

    const draw = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      const cfg = cfgRef.current;
      const cw = canvas.width, ch = canvas.height;
      const cx = cw / 2, cy = ch / 2;
      const sc = Math.min(cw, ch);

      flowT       += cfg.speed * dt;
      borderAngle += 0.4 * dt;
      lerpT = Math.min(1, lerpT + dt / 0.55);
      nextSwap -= dt;
      if (nextSwap <= 0 && lerpT >= 1) {
        nextSwap = 0.4 + Math.random() * 0.15;
        curC = [...tgtC]; lerpT = 0;
        tgtC = [...BASE_HEX].sort(() => Math.random() - 0.5);
      }
      const borderCols = curC.map((a, i) => lerpHex(a, tgtC[i], lerpT));

      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, cw, ch);

      const pad = cfg.padding, sw = cfg.strokeWidth, gi = cfg.intensity;
      const rx = pad, ry = pad, rw = cw - pad * 2, rh = ch - pad * 2;
      const cr = cfg.cornerRadius, blobR = sc * cfg.blobSize;

      ctx.save();
      rrectPath(rx, ry, rw, rh, cr);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      BLOBS.forEach((blob, i) => {
        const [rr,gg,bb] = COLORS[i];
        const bx = cx + rw * 0.40 * Math.sin(flowT * blob.fx + blob.px);
        const by = cy + rh * 0.40 * Math.cos(flowT * blob.fy + blob.py);
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blobR);
        grad.addColorStop(0,    `rgba(${rr},${gg},${bb},${gi * 0.82})`);
        grad.addColorStop(0.42, `rgba(${rr},${gg},${bb},${gi * 0.36})`);
        grad.addColorStop(1,    `rgba(${rr},${gg},${bb},0)`);
        ctx.beginPath(); ctx.arc(bx, by, blobR, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      });
      ctx.restore();

      const makeBorderGrad = () => {
        const g = (ctx as CC).createConicGradient(borderAngle - Math.PI / 2, cx, cy);
        borderCols.forEach((col, i) => g.addColorStop(i / borderCols.length, col));
        g.addColorStop(1, borderCols[0]);
        return g;
      };
      const drawBorder = (lw: number, blur: number, alpha: number) => {
        ctx.save();
        if (blur > 0) ctx.filter = `blur(${blur}px)`;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = makeBorderGrad();
        ctx.lineWidth = lw; ctx.lineCap = 'round';
        rrectPath(rx, ry, rw, rh, cr); ctx.stroke();
        ctx.restore();
      };
      drawBorder(sw * 4.5, 26 * gi, 0.30 * gi);
      drawBorder(sw * 2.8, 14 * gi, 0.50 * gi);
      drawBorder(sw * 1.6,  5 * gi, 0.72 * gi);
      drawBorder(sw,         0,     1.0);

      animId = requestAnimationFrame(draw);
    };

    resize();
    animId = requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
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
    <div style={{ background: C.bg, color: C.text, fontFamily: C.sans, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
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
        <div className="carlson-nav-meta" style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.text3 }}>
          Carlson Founder&apos;s Day &middot; May 13, 2026 &middot; Toaster Innovation Hub
        </div>
        <a href="mailto:bribradley@gmail.com" className="carlson-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 999, background: C.maroon, color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em', transition: 'background 0.15s' }}>
          Connect
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: 680, display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#080810' }}>
        <FlowGlowBg />

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

                  {/* animated walking person — stick figure with alternating leg/arm poses */}
                  <g>
                    <animateMotion dur="13s" repeatCount="indefinite" calcMode="linear"
                      path="M 278,420 L 365,382 L 410,455 L 390,575 L 312,675 L 214,692 L 160,628 L 163,515 Z"
                    />
                    {/* outer ambient glow */}
                    <circle cx="0" cy="-20" r="32" fill="rgba(79,156,249,0.10)" />
                    {/* ground shadow */}
                    <ellipse cx="0" cy="14" rx="16" ry="5" fill="rgba(79,156,249,0.28)" />

                    {/* bobbing wrapper — rises slightly on each step */}
                    <g>
                      <animateTransform attributeName="transform" type="translate"
                        values="0,0; 0,-4; 0,0; 0,-4; 0,0"
                        keyTimes="0;0.25;0.5;0.75;1"
                        dur="0.52s" repeatCount="indefinite" />

                      {/* pose A — right foot forward */}
                      <g>
                        <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.47;0.5;0.97;1" dur="0.52s" repeatCount="indefinite" />
                        <line x1="3"  y1="-6" x2="11" y2="13"   stroke="#1b3f8a" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="-3" y1="-6" x2="-7" y2="11"   stroke="#1b3f8a" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="2"  y1="-22" x2="13" y2="-12" stroke="#1b3f8a" strokeWidth="3"   strokeLinecap="round" />
                        <line x1="-2" y1="-22" x2="-13" y2="-12" stroke="#1b3f8a" strokeWidth="3"  strokeLinecap="round" />
                      </g>

                      {/* pose B — left foot forward */}
                      <g opacity="0">
                        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.47;0.5;0.97;1" dur="0.52s" repeatCount="indefinite" />
                        <line x1="-3" y1="-6" x2="-11" y2="13"  stroke="#1b3f8a" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="3"  y1="-6" x2="7"   y2="11"  stroke="#1b3f8a" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="-2" y1="-22" x2="-13" y2="-12" stroke="#1b3f8a" strokeWidth="3"  strokeLinecap="round" />
                        <line x1="2"  y1="-22" x2="13" y2="-12" stroke="#1b3f8a" strokeWidth="3"   strokeLinecap="round" />
                      </g>

                      {/* torso */}
                      <line x1="0" y1="-28" x2="0" y2="-6" stroke="#1b3f8a" strokeWidth="4" strokeLinecap="round" />
                      {/* head glow */}
                      <circle cx="0" cy="-38" r="13" fill="rgba(79,156,249,0.22)" />
                      {/* head */}
                      <circle cx="0" cy="-38" r="10" fill="#1b3f8a" stroke="#4F9CF9" strokeWidth="2" />
                    </g>
                  </g>
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

      {/* ── EVENT DETAILS GRID ───────────────────────────────────────────────── */}
      <section className="carlson-section" style={{ padding: '72px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: '0 0 36px' }}>Event Details</p>

          <div className="carlson-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>

            <div style={{ padding: '32px 32px 28px', background: C.surf1, border: `1px solid ${C.lineStrg}`, borderRadius: 14 }}>
              <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.gold, margin: '0 0 16px' }}>When</p>
              <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.2 }}>
                Wednesday<br/>May 13, 2026
              </p>
              <p style={{ fontSize: 16, color: C.text2, margin: '0 0 20px' }}>4:30 PM – 7:00 PM</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse-green 2.2s ease-out infinite' }} />
                <span style={{ fontFamily: C.mono, fontSize: 10, color: C.green, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Free Admission</span>
              </div>
            </div>

            <div style={{ padding: '32px 32px 28px', background: C.surf1, border: `1px solid ${C.lineStrg}`, borderRadius: 14 }}>
              <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.maroon, margin: '0 0 16px' }}>Where</p>
              <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.2 }}>
                Walter Library<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>&amp; Toaster Hub</em>
              </p>
              <p style={{ fontSize: 14, color: C.text2, margin: '0 0 20px', fontStyle: 'italic' }}>117 Pleasant St SE<br/>Minneapolis, MN 55455</p>
              <Tag color={C.accent} bg={C.accentSoft}>University of Minnesota Campus</Tag>
            </div>

            <div style={{ padding: '32px 32px 28px', background: C.surf1, border: `1px solid ${C.lineStrg}`, borderRadius: 14 }}>
              <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.accent, margin: '0 0 16px' }}>What&apos;s Happening</p>
              <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 22, letterSpacing: '-0.015em', margin: '0 0 18px', lineHeight: 1.3 }}>
                Innovation &amp; Entrepreneurship Showcase
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['MVP Challenge — 25 student projects', 'Startup Showcase — UMN spinouts', 'Entrepreneurship Awards ceremony', 'Networking at the Toaster Hub'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: C.accent, fontSize: 12, marginTop: 2, flexShrink: 0 }}>—</span>
                    <span style={{ fontSize: 13.5, color: C.text2 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <Divider />

      {/* ── VISIT OUR TABLE ──────────────────────────────────────────────────── */}
      <section className="carlson-section" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }} className="carlson-tech-grid">

            <div>
              <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4, margin: '0 0 18px' }}>Visit Our Table</p>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(36px, 4.5vw, 54px)', lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 22px' }}>
                Ambient Intelligence<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>at the Toaster Hub</em>
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.72, color: C.text2, margin: '0 0 28px' }}>
                We&apos;re showcasing our ambient sensor platform for skilled nursing care — live demonstrations, early performance data, and a conversation about the future of passive patient monitoring in Minnesota.
              </p>
              <a href="mailto:bribradley@gmail.com" className="carlson-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 999, background: C.maroon, color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.01em', transition: 'background 0.15s' }}>
                Schedule a Conversation
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>

            <div className="carlson-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                {
                  color: C.accent, bg: C.accentSoft,
                  title: 'Ella AI Nurse Assistant',
                  desc:  'Live demonstration of our ambient intelligence platform generating plain-language care summaries from radar-based motion data.',
                  tags:  ['Live Demo', 'AI', 'Care Workflow'],
                  icon:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="2.5" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21.5" y2="12"/></svg>,
                },
                {
                  color: C.gold, bg: C.goldSoft,
                  title: '60 GHz Radar Sensor',
                  desc:  'Our EVT-0.1 hardware prototype — a TI IWR6843AOP mmWave sensor that detects falls and motion with no cameras and no wearables.',
                  tags:  ['Hardware', 'Privacy-First', 'Non-Contact'],
                  icon:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4m12 0h4M12 2v4m0 12v4"/><path d="M6.3 6.3l2.8 2.8m5.6 5.6l2.8 2.8M6.3 17.7l2.8-2.8m5.6-5.6l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>,
                },
                {
                  color: C.green, bg: C.greenSoft,
                  title: 'Clinical Validation',
                  desc:  'F1 0.81 on held-out lab data. IRB application in preparation with UMN for our Minneapolis skilled nursing pilot launching Summer 2026.',
                  tags:  ['IRB', 'MN Pilot', 'Class II'],
                  icon:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                },
              ].map(card => (
                <div key={card.title} className="carlson-feature-card" style={{ padding: '28px 24px 24px', background: C.surf1, border: `1px solid ${C.lineStrg}`, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ color: card.color, width: 36, height: 36, borderRadius: 9, background: card.bg, border: `1px solid ${card.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 18, letterSpacing: '-0.01em', margin: '0 0 10px', lineHeight: 1.25 }}>{card.title}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: C.text2, margin: 0 }}>{card.desc}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                    {card.tags.map(tag => <Tag key={tag} color={card.color} bg={card.bg}>{tag}</Tag>)}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <Divider />

      {/* ── STATS STRIP ──────────────────────────────────────────────────────── */}
      <section style={{ background: C.surf1, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="carlson-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
            <StatCell value="60 GHz"  label="mmWave radar"        color={C.accent}  />
            <StatCell value="Class B" label="IEC 62304 software"  color={C.text}    />
            <StatCell value="F1 0.81" label="Fall detection"       color={C.green}   />
            <StatCell value="EVT-0.1" label="Hardware revision"    color={C.text}    />
            <StatCell value="57"      label="BOM components"       color={C.gold}    />
            <StatCell value="2026"    label="MN pilot launch"      color={C.maroon}  />
          </div>
        </div>
      </section>

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
            Come see what<br/><em style={{ fontStyle: 'italic', color: C.text2 }}>room-scale AI looks like.</em>
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
