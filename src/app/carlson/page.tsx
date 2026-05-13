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
  serif:      '"Times New Roman", Times, serif',
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
      let a,l=e.getContext("2d"),i=0,n=0,r=performance.now(),o=[[188,130,243],[245,185,234],[141,159,255],[255,103,120],[255,186,113],[198,134,255]],s=[{fx:.31,fy:.47,px:0,py:.5*Math.PI},{fx:.53,fy:.29,px:Math.PI,py:1.2*Math.PI},{fx:.41,fy:.67,px:.7*Math.PI,py:0},{fx:.23,fy:.53,px:1.5*Math.PI,py:.8*Math.PI},{fx:.59,fy:.37,px:.3*Math.PI,py:1.7*Math.PI},{fx:.43,fy:.61,px:1.1*Math.PI,py:.3*Math.PI}],h=["#BC82F3","#F5B9EA","#8D9FFF","#FF6778","#FFBA71","#C686FF"],d=[...h],m=[...h],c=1,p=.45,g=e=>{let t=parseInt(e.replace("#",""),16);return[t>>16&255,t>>8&255,255&t]},u=()=>{let t=e.getBoundingClientRect(),q=window.devicePixelRatio||1;e.width=(t.width||window.innerWidth)*q,e.height=(t.height||window.innerHeight)*q,l.setTransform(q,0,0,q,0,0)},b=(e,t,a,i,n)=>{n=Math.max(0,Math.min(n,a/2,i/2)),l.beginPath(),l.moveTo(e+n,t),l.lineTo(e+a-n,t),l.arcTo(e+a,t,e+a,t+n,n),l.lineTo(e+a,t+i-n),l.arcTo(e+a,t+i,e+a-n,t+i,n),l.lineTo(e+n,t+i),l.arcTo(e,t+i,e,t+i-n,n),l.lineTo(e,t+n),l.arcTo(e,t,e+n,t,n),l.closePath()},f=u=>{let y=Math.min((u-r)/1e3,.05);r=u;let M=t(),_q=window.devicePixelRatio||1,x=e.width/_q,w=e.height/_q,k=x/2,S=w/2,v=Math.min(x,w);i+=M.speed*y,n+=.4*y,c=Math.min(1,c+y/.55),(p-=y)<=0&&c>=1&&(p=.4+.15*Math.random(),d=[...m],c=0,m=[...h].sort(()=>Math.random()-.5));let C=d.map((e,t)=>((e,t,a)=>{let[l,i,n]=g(e),[r,o,s]=g(t);return`rgb(${Math.round(l+(r-l)*a)},${Math.round(i+(o-i)*a)},${Math.round(n+(s-n)*a)})`})(e,m[t],c));l.clearRect(0,0,x,w),l.fillStyle="#080808",l.fillRect(0,0,x,w);let R=M.padding,F=M.strokeWidth,A=M.intensity,I=x-2*R,P=w-2*R,$=M.cornerRadius,z=v*M.blobSize;l.save(),b(R,R,I,P,$),l.clip(),l.globalCompositeOperation="screen",s.forEach((e,t)=>{let[a,n,r]=o[t],s=k+.4*I*Math.sin(i*e.fx+e.px),h=S+.4*P*Math.cos(i*e.fy+e.py),d=l.createRadialGradient(s,h,0,s,h,z);d.addColorStop(0,`rgba(${a},${n},${r},${.82*A})`),d.addColorStop(.42,`rgba(${a},${n},${r},${.36*A})`),d.addColorStop(1,`rgba(${a},${n},${r},0)`),l.beginPath(),l.arc(s,h,z,0,2*Math.PI),l.fillStyle=d,l.fill()}),l.restore();let B=(e,t,a)=>{let i;l.save(),t>0&&(l.filter=`blur(${t}px)`),l.globalAlpha=a,i=l.createConicGradient(n-Math.PI/2,k,S),C.forEach((e,t)=>i.addColorStop(t/C.length,e)),i.addColorStop(1,C[0]),l.strokeStyle=i,l.lineWidth=e,l.lineCap="round",b(R,R,I,P,$),l.stroke(),l.restore()};B(4.5*F,26*A,.3*A),B(2.8*F,14*A,.5*A),B(1.6*F,5*A,.72*A),B(F,0,1),a=requestAnimationFrame(f)};u(),a=requestAnimationFrame(f);let y=new ResizeObserver(()=>u());return y.observe(e),()=>{cancelAnimationFrame(a),y.disconnect()}
    };
    return create(canvas, () => ({ ...cfgRef.current, strokeWidth: window.innerWidth < 1100 ? 15 : cfgRef.current.strokeWidth, intensity: window.innerWidth < 1100 ? 0.58 : cfgRef.current.intensity }));
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

function HowItWorksDiagram() {
  const rx = 48, ry = 52, rw = 504, rh = 720;
  const bwX = 352, bwY = 290;
  const maroon = '#7A0019', accent = '#4F9CF9', gold = '#F0B429', green = '#3DCC91';
  const personPath = 'M 224 388 C 158 270 104 330 142 488 C 180 648 314 676 392 566 C 456 468 424 292 346 242 C 268 192 200 310 224 388 Z';
  const sNodes = [
    { cx: rx,    cy: ry,    id: 'A', color: accent, sweepFrom: '0',   sweepTo: '360',  sweepDur: '5s',   lx: rx+13,    ly: ry-13,    anchor: 'start' as const },
    { cx: rx+rw, cy: ry,    id: 'B', color: gold,   sweepFrom: '180', sweepTo: '-180', sweepDur: '6.5s', lx: rx+rw-13, ly: ry-13,    anchor: 'end'   as const },
    { cx: rx,    cy: ry+rh, id: 'C', color: green,  sweepFrom: '0',   sweepTo: '360',  sweepDur: '7.5s', lx: rx+13,    ly: ry+rh+18, anchor: 'start' as const },
    { cx: rx+rw, cy: ry+rh, id: 'D', color: maroon, sweepFrom: '180', sweepTo: '-180', sweepDur: '9s',   lx: rx+rw-13, ly: ry+rh+18, anchor: 'end'   as const },
  ];
  const pktPaths = [
    `M ${rx} ${ry} Q 180 20 300 16`,
    `M ${rx+rw} ${ry} Q 420 20 300 16`,
    `M ${rx} ${ry+rh} Q 120 200 300 16`,
    `M ${rx+rw} ${ry+rh} Q 480 200 300 16`,
  ];
  const trailDelays = [0.4, 0.8, 1.2, 1.6];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <svg viewBox="0 0 600 900" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <filter id="hiw-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="hiw-glow-sm" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="hiw-scan" x="-5%" y="-400%" width="110%" height="900%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="hiw-clip">
            <rect x={rx} y={ry} width={rw} height={rh}/>
          </clipPath>
          <pattern id="hiw-grid" width="48" height="48" patternUnits="userSpaceOnUse" x={rx} y={ry}>
            <circle cx="24" cy="24" r="1.1" fill="rgba(255,255,255,0.07)"/>
          </pattern>
          <radialGradient id="hiw-ca" cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hiw-cb" cx="100%" cy="0%" r="100%">
            <stop offset="0%" stopColor={gold} stopOpacity="0.14"/>
            <stop offset="100%" stopColor={gold} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hiw-cc" cx="0%" cy="100%" r="100%">
            <stop offset="0%" stopColor={green} stopOpacity="0.14"/>
            <stop offset="100%" stopColor={green} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="hiw-cd" cx="100%" cy="100%" r="100%">
            <stop offset="0%" stopColor={maroon} stopOpacity="0.17"/>
            <stop offset="100%" stopColor={maroon} stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="hiw-scanline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0"/>
            <stop offset="40%" stopColor={accent} stopOpacity="0.85"/>
            <stop offset="60%" stopColor={accent} stopOpacity="1"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="hiw-bed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)"/>
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="600" height="490" fill="#080808"/>

        {/* Dot grid inside room */}
        <rect x={rx} y={ry} width={rw} height={rh} fill="url(#hiw-grid)"/>

        {/* Coverage zones */}
        <rect x={rx} y={ry} width={rw} height={rh} fill="url(#hiw-ca)"/>
        <rect x={rx} y={ry} width={rw} height={rh} fill="url(#hiw-cb)"/>
        <rect x={rx} y={ry} width={rw} height={rh} fill="url(#hiw-cc)"/>
        <rect x={rx} y={ry} width={rw} height={rh} fill="url(#hiw-cd)"/>

        {/* Radar sweeps — all 4 sensors, clipped to room */}
        <g clipPath="url(#hiw-clip)">
          {sNodes.map((s) => (
            <g key={`sw-${s.id}`} transform={`translate(${s.cx},${s.cy})`}>
              <line x1={0} y1={0} x2={0} y2={900} stroke={s.color} strokeWidth={1.5} opacity={0.2}>
                <animateTransform attributeName="transform" type="rotate" from={s.sweepFrom} to={s.sweepTo} dur={s.sweepDur} repeatCount="indefinite"/>
              </line>
              <line x1={0} y1={0} x2={0} y2={900} stroke={s.color} strokeWidth={10} opacity={0.04}>
                <animateTransform attributeName="transform" type="rotate" from={s.sweepFrom} to={s.sweepTo} dur={s.sweepDur} repeatCount="indefinite"/>
              </line>
            </g>
          ))}
        </g>

        {/* Scan line */}
        <g clipPath="url(#hiw-clip)" filter="url(#hiw-scan)">
          <rect x={rx} y={ry} width={rw} height={2} fill="url(#hiw-scanline)">
            <animate attributeName="y" from={ry} to={ry+rh} dur="4s" repeatCount="indefinite"/>
          </rect>
          <rect x={rx} y={ry-36} width={rw} height={36} fill="url(#hiw-scanline)" opacity={0.07}>
            <animate attributeName="y" from={ry-36} to={ry+rh} dur="4s" repeatCount="indefinite"/>
          </rect>
        </g>

        {/* Bed silhouette */}
        <g clipPath="url(#hiw-clip)">
          <rect x={296} y={588} width={252} height={178} rx={5} fill="url(#hiw-bed)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.2}/>
          <rect x={507} y={588} width={41} height={178} rx={5} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
          <rect x={492} y={596} width={30} height={74} rx={3} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.07)" strokeWidth={0.7}/>
          <rect x={492} y={686} width={30} height={74} rx={3} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.07)" strokeWidth={0.7}/>
        </g>

        {/* Person + trail */}
        <g clipPath="url(#hiw-clip)">
          {trailDelays.map((delay, i) => (
            <circle key={`trail${i}`} r={4.5 - i*0.7} fill="#FFFFFF" opacity={0.17 - i*0.035} filter={i < 2 ? 'url(#hiw-glow-sm)' : undefined}>
              <animateMotion dur="14s" repeatCount="indefinite" begin={`${delay}s`} path={personPath}/>
            </circle>
          ))}
          <circle r={7.5} fill="#FFFFFF" opacity={0.95} filter="url(#hiw-glow)">
            <animateMotion dur="14s" repeatCount="indefinite" path={personPath}/>
          </circle>
          {/* Detection ping ring — follows person */}
          <circle r={8} fill="none" stroke={accent} strokeWidth={2}>
            <animateMotion dur="14s" repeatCount="indefinite" path={personPath}/>
            <animate attributeName="r" from="8" to="48" dur="2.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.75" to="0" dur="2.2s" repeatCount="indefinite"/>
            <animate attributeName="stroke-width" from="2.5" to="0.3" dur="2.2s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Room outline */}
        <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.2}/>
        {/* Bathroom walls */}
        <line x1={bwX} y1={ry} x2={bwX} y2={bwY} stroke="rgba(255,255,255,0.1)" strokeWidth={1.2}/>
        <line x1={bwX} y1={bwY} x2={rx+rw} y2={bwY} stroke="rgba(255,255,255,0.1)" strokeWidth={1.2}/>
        {/* Door arc */}
        <path d={`M ${bwX} ${bwY-48} A 48 48 0 0 1 ${bwX+48} ${bwY}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} strokeDasharray="3,6"/>

        {/* Room labels */}
        <text x={200} y={440} textAnchor="middle" fontFamily="monospace" fontSize={10} fill="rgba(255,255,255,0.1)" letterSpacing={6}>BEDROOM</text>
        <text x={452} y={171} textAnchor="middle" fontFamily="monospace" fontSize={9} fill="rgba(255,255,255,0.08)" letterSpacing={4}>BATH</text>

        {/* Data packets */}
        {pktPaths.map((path, i) => (
          <circle key={`pkt${i}`} r={3} fill={sNodes[i].color} opacity={0.9} filter="url(#hiw-glow-sm)">
            <animateMotion dur={`${2.3 + i*0.35}s`} begin={`${i*0.68}s`} repeatCount="indefinite" path={path}/>
          </circle>
        ))}

        {/* AWS cloud node */}
        <g filter="url(#hiw-glow-sm)">
          <rect x={252} y={4} width={96} height={24} rx={4} fill="rgba(79,156,249,0.12)" stroke={accent} strokeWidth={1}/>
          <text x={300} y={20} textAnchor="middle" fontFamily="monospace" fontSize={8} fill={accent} letterSpacing={2.5}>AWS · KINESIS</text>
        </g>
        <circle cx={247} cy={16} r={2.8} fill={green}>
          <animate attributeName="opacity" values="1;0.15;1" dur="1.8s" repeatCount="indefinite"/>
        </circle>

        {/* Sensor nodes */}
        {sNodes.map((s) => (
          <g key={s.id}>
            {[0,1,2].map(j => (
              <circle key={j} cx={s.cx} cy={s.cy} r={6} fill="none" stroke={s.color} strokeWidth={1.5}>
                <animate attributeName="r" from="6" to="72" dur="3.2s" begin={`${j * 1.07}s`} repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.75" to="0" dur="3.2s" begin={`${j * 1.07}s`} repeatCount="indefinite"/>
                <animate attributeName="stroke-width" from="2.5" to="0.3" dur="3.2s" begin={`${j * 1.07}s`} repeatCount="indefinite"/>
              </circle>
            ))}
            <circle cx={s.cx} cy={s.cy} r={6} fill={s.color} opacity={0.9} filter="url(#hiw-glow)"/>
            <circle cx={s.cx} cy={s.cy} r={2.8} fill="#FFFFFF" opacity={0.95}/>
            <polyline
              points={`${s.cx + (s.id==='B'||s.id==='D' ? -17 : 17)},${s.cy} ${s.cx},${s.cy} ${s.cx},${s.cy + (s.id==='C'||s.id==='D' ? -17 : 17)}`}
              fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth={1.5}
            />
            <text x={s.lx} y={s.ly} textAnchor={s.anchor} fontFamily="monospace" fontSize={8.5} fill="rgba(255,255,255,0.38)" letterSpacing={2}>
              {`SENSOR ${s.id}`}
            </text>
          </g>
        ))}

        {/* Readout strip */}
        <line x1={rx} y1={791} x2={rx+rw} y2={791} stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
        <text x={rx+10} y={808} fontFamily="monospace" fontSize={8.5} fill="rgba(255,255,255,0.25)" letterSpacing={2}>MOTION: AMBULATORY</text>
        <text x={rx+10} y={826} fontFamily="monospace" fontSize={7.5} fill="rgba(255,255,255,0.14)" letterSpacing={2}>GAIT: NORMAL · FALL RISK: LOW · PATENT PENDING</text>
        <text x={rx+rw-10} y={808} textAnchor="end" fontFamily="monospace" fontSize={8.5} fill="rgba(255,255,255,0.25)" letterSpacing={2}>IWR6843AOP</text>
        <text x={rx+rw-10} y={826} textAnchor="end" fontFamily="monospace" fontSize={7.5} fill="rgba(255,255,255,0.14)" letterSpacing={2}>60 GHz FMCW · UMN OTC</text>

        {/* LIVE indicator */}
        <g transform={`translate(${rx+rw/2}, 844)`}>
          <circle r={3.5} fill={green} cx={-28}>
            <animate attributeName="opacity" values="1;0.15;1" dur="1.4s" repeatCount="indefinite"/>
          </circle>
          <text x={-19} y={4} fontFamily="monospace" fontSize={9} fill={green} letterSpacing={3}>LIVE</text>
          <circle r={3.5} fill={green} cx={28}>
            <animate attributeName="opacity" values="1;0.15;1" dur="1.4s" begin="0.7s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Heartbeat waveform */}
        <polyline
          points={`${rx+10},844 ${rx+55},844 ${rx+68},844 ${rx+76},828 ${rx+84},860 ${rx+92},836 ${rx+100},844 ${rx+150},844 ${rx+163},844 ${rx+171},828 ${rx+179},860 ${rx+187},836 ${rx+195},844 ${rx+240},844`}
          fill="none" stroke={accent} strokeWidth={1.2} opacity={0.22}
        />
      </svg>
      <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', margin: 0, textAlign: 'center' }}>
        Fig. 8 — Sensor coverage · Patent pending · UMN OTC
      </p>
    </div>
  );
}

function TechDiagram() {
  const W = (o: number) => `rgba(255,255,255,${o})`;
  // Radar center cx=72, cy=100; viz zone y=26..174
  const blips: Array<[number, number, string]> = [
    [93, 70, '-0.4s'], [50, 110, '-1.1s'], [100, 98, '-2.2s'],
  ];
  const inY:  number[] = [54, 72, 90, 108];
  const hidY: number[] = [62, 90, 118];
  const outY: number[] = [72, 110];
  const dots = [
    { p: 'M 165 72 L 218 62',  b: '0s'     },
    { p: 'M 165 108 L 218 118',b: '-0.32s' },
    { p: 'M 165 54 L 218 90',  b: '-0.56s' },
    { p: 'M 218 62 L 271 72',  b: '-0.14s' },
    { p: 'M 218 118 L 271 110',b: '-0.44s' },
    { p: 'M 165 90 L 218 62',  b: '-0.68s' },
    { p: 'M 165 72 L 218 118', b: '-0.88s' },
    { p: 'M 218 90 L 271 72',  b: '-0.22s' },
  ];
  const ecg = (bx: number) =>
    `${bx},86 ${bx+12},86 ${bx+15},93 ${bx+19},54 ${bx+23},104 ${bx+27},86 ${bx+33},78 ${bx+39},70 ${bx+45},78 ${bx+50},86 ${bx+64},86`;
  const resp = (bx: number) =>
    `${bx},138 ${bx+10},126 ${bx+20},118 ${bx+30},126 ${bx+40},138 ${bx+50},150 ${bx+60},158 ${bx+70},150 ${bx+80},138`;
  return (
    <svg viewBox="0 0 440 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <clipPath id="tc-v1"><rect x="6"   y="26" width="132" height="148"/></clipPath>
        <clipPath id="tc-v2"><rect x="152" y="26" width="132" height="148"/></clipPath>
        <clipPath id="tc-v3"><rect x="298" y="26" width="132" height="148"/></clipPath>
      </defs>
      <rect width="440" height="320" fill="#080808"/>

      {/* ── Card 1 · AMBIENT SENSORS ── */}
      <rect x="6"   y="8" width="132" height="304" fill="#131313" stroke={W(0.14)} strokeWidth="0.8" rx="2"/>
      <rect x="6"   y="8" width="132" height="2"   fill={W(0.45)}/>
      <text x="14"  y="22" fontFamily="monospace" fontSize="7" fill={W(0.3)} letterSpacing="2">01</text>
      <g clipPath="url(#tc-v1)">
        <circle cx="72" cy="100" r="20" fill="none" stroke={W(0.14)} strokeDasharray="2,3" strokeWidth="0.8"/>
        <circle cx="72" cy="100" r="38" fill="none" stroke={W(0.10)} strokeDasharray="2,3" strokeWidth="0.8"/>
        <circle cx="72" cy="100" r="56" fill="none" stroke={W(0.07)} strokeDasharray="2,3" strokeWidth="0.7"/>
        <line x1="16" y1="100" x2="128" y2="100" stroke={W(0.07)} strokeWidth="0.5"/>
        <line x1="72" y1="44"  x2="72"  y2="156" stroke={W(0.07)} strokeWidth="0.5"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 72 100" to="360 72 100" dur="3.5s" repeatCount="indefinite"/>
          <path d="M 72 100 L 72 44 A 56 56 0 0 0 38 62 Z" fill={W(0.09)}/>
          <line x1="72" y1="100" x2="72" y2="44" stroke={W(0.14)} strokeWidth="1"   transform="rotate(-40 72 100)"/>
          <line x1="72" y1="100" x2="72" y2="44" stroke={W(0.28)} strokeWidth="1.2" transform="rotate(-22 72 100)"/>
          <line x1="72" y1="100" x2="72" y2="44" stroke={W(0.52)} strokeWidth="1.4" transform="rotate(-10 72 100)"/>
          <line x1="72" y1="100" x2="72" y2="44" stroke={W(0.90)} strokeWidth="1.6"/>
        </g>
        <circle cx="72" cy="100" r="3.5" fill={W(0.92)}/>
        <circle cx="72" cy="100" r="1.4" fill="#131313"/>
        {blips.map(([bx, by, begin], i) => (
          <g key={i}>
            <circle cx={bx} cy={by} r="3.5" fill={W(0.90)}>
              <animate attributeName="opacity" values="0;0;0.90;0.45;0;0" keyTimes="0;0.04;0.10;0.28;0.45;1" dur="3.5s" begin={begin} repeatCount="indefinite"/>
            </circle>
            <circle cx={bx} cy={by} r="3.5" fill="none" stroke={W(0.65)} strokeWidth="1">
              <animate attributeName="opacity" values="0;0;0.65;0;0;0"  keyTimes="0;0.04;0.14;0.38;0.55;1" dur="3.5s" begin={begin} repeatCount="indefinite"/>
              <animate attributeName="r"       values="3.5;3.5;7;14;14;3.5" keyTimes="0;0.04;0.14;0.38;0.55;1" dur="3.5s" begin={begin} repeatCount="indefinite"/>
            </circle>
          </g>
        ))}
      </g>
      <line x1="6"  y1="178" x2="138" y2="178" stroke={W(0.10)} strokeWidth="0.6"/>
      <text x="14"  y="196" fontFamily="monospace" fontSize="9"   fill={W(0.92)} letterSpacing="1"   fontWeight="600">AMBIENT SENSORS</text>
      <text x="14"  y="210" fontFamily="monospace" fontSize="6.5" fill={W(0.48)} letterSpacing="0.8">60 GHz FMCW</text>
      <text x="14"  y="222" fontFamily="monospace" fontSize="6"   fill={W(0.32)} letterSpacing="0.5">IWR6843AOP</text>
      <line x1="14" y1="234" x2="130" y2="234" stroke={W(0.08)} strokeWidth="0.5"/>
      <circle cx="16" cy="248" r="2.5" fill={W(0.72)}>
        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="24"  y="251" fontFamily="monospace" fontSize="6.5" fill={W(0.45)} letterSpacing="1">ACTIVE</text>

      {/* ── Card 2 · CLOUD AI ── */}
      <rect x="152" y="8" width="132" height="304" fill="#131313" stroke={W(0.14)} strokeWidth="0.8" rx="2"/>
      <rect x="152" y="8" width="132" height="2"   fill={W(0.45)}/>
      <text x="160" y="22" fontFamily="monospace" fontSize="7" fill={W(0.3)} letterSpacing="2">02</text>
      <g clipPath="url(#tc-v2)">
        {inY.flatMap(iy => hidY.map(hy => (
          <line key={`ih${iy}${hy}`} x1="165" y1={iy} x2="218" y2={hy} stroke={W(0.18)} strokeWidth="0.7"/>
        )))}
        {hidY.flatMap(hy => outY.map(oy => (
          <line key={`ho${hy}${oy}`} x1="218" y1={hy} x2="271" y2={oy} stroke={W(0.18)} strokeWidth="0.7"/>
        )))}
        {inY.map(iy  => <circle key={iy}  cx="165" cy={iy}  r="5"   fill={W(0.10)} stroke={W(0.55)} strokeWidth="1.2"/>)}
        {hidY.map(hy => <circle key={hy}  cx="218" cy={hy}  r="6"   fill={W(0.14)} stroke={W(0.65)} strokeWidth="1.4"/>)}
        {outY.map(oy => <circle key={oy}  cx="271" cy={oy}  r="7.5" fill={W(0.18)} stroke={W(0.80)} strokeWidth="1.6"/>)}
        {dots.map((d, i) => (
          <circle key={i} r="3" fill={W(0.95)}>
            <animateMotion dur="0.9s" begin={d.b} repeatCount="indefinite" path={d.p}/>
            <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.12;0.88;1" dur="0.9s" begin={d.b} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>
      <line x1="152" y1="178" x2="284" y2="178" stroke={W(0.10)} strokeWidth="0.6"/>
      <text x="160" y="196" fontFamily="monospace" fontSize="9"   fill={W(0.92)} letterSpacing="1"   fontWeight="600">CLOUD AI</text>
      <text x="160" y="210" fontFamily="monospace" fontSize="6.5" fill={W(0.48)} letterSpacing="0.8">AWS BEDROCK</text>
      <text x="160" y="222" fontFamily="monospace" fontSize="6"   fill={W(0.32)} letterSpacing="0.5">FOUNDATION MODEL</text>
      <line x1="160" y1="234" x2="276" y2="234" stroke={W(0.08)} strokeWidth="0.5"/>
      <g>
        <animate attributeName="opacity" values="1;0.18;1" dur="1.8s" repeatCount="indefinite"/>
        <circle cx="162" cy="248" r="2.5" fill={W(0.65)}/>
        <text x="170" y="251" fontFamily="monospace" fontSize="6.5" fill={W(0.45)} letterSpacing="1">INFERENCING</text>
      </g>

      {/* ── Card 3 · ELLA AI ── */}
      <rect x="298" y="8" width="132" height="304" fill="#131313" stroke={W(0.14)} strokeWidth="0.8" rx="2"/>
      <rect x="298" y="8" width="132" height="2"   fill={W(0.45)}/>
      <text x="306" y="22" fontFamily="monospace" fontSize="7" fill={W(0.3)} letterSpacing="2">03</text>
      <g clipPath="url(#tc-v3)">
        <line x1="298" y1="100" x2="430" y2="100" stroke={W(0.10)} strokeWidth="0.6"/>
        <line x1="298" y1="86"  x2="430" y2="86"  stroke={W(0.05)} strokeWidth="0.4"/>
        <line x1="298" y1="138" x2="430" y2="138" stroke={W(0.05)} strokeWidth="0.4"/>
        <text x="427" y="40"  textAnchor="end" fontFamily="monospace" fontSize="6" fill={W(0.38)} letterSpacing="1">ECG</text>
        <text x="427" y="120" textAnchor="end" fontFamily="monospace" fontSize="6" fill={W(0.28)} letterSpacing="1">RESP</text>
        <g>
          <animateTransform attributeName="transform" type="translate" from="0 0" to="-64 0" dur="2s" repeatCount="indefinite"/>
          {([234,298,362,426,490] as number[]).map(bx => (
            <polyline key={bx} points={ecg(bx)} fill="none" stroke={W(0.82)} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
        </g>
        <g>
          <animateTransform attributeName="transform" type="translate" from="0 0" to="-80 0" dur="3.2s" repeatCount="indefinite"/>
          {([218,298,378,458,538] as number[]).map(bx => (
            <polyline key={bx} points={resp(bx)} fill="none" stroke={W(0.55)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
        </g>
      </g>
      <line x1="298" y1="178" x2="430" y2="178" stroke={W(0.10)} strokeWidth="0.6"/>
      <text x="306" y="196" fontFamily="monospace" fontSize="9"   fill={W(0.92)} letterSpacing="1"   fontWeight="600">ELLA AI</text>
      <text x="306" y="210" fontFamily="monospace" fontSize="6.5" fill={W(0.48)} letterSpacing="0.8">NURSE ASSISTANT</text>
      <text x="306" y="222" fontFamily="monospace" fontSize="6"   fill={W(0.32)} letterSpacing="0.5">HIPAA COMPLIANT</text>
      <line x1="306" y1="234" x2="422" y2="234" stroke={W(0.08)} strokeWidth="0.5"/>
      <circle cx="308" cy="248" r="2.5" fill={W(0.82)}>
        <animate attributeName="opacity" values="1;0.12;1" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <text x="316" y="251" fontFamily="monospace" fontSize="6.5" fill={W(0.55)} letterSpacing="1">ALERT · ROOM 204</text>
    </svg>
  );
}


/* ── Card FlowGlow background ────────────────────────────────────────────────── */
function CardFlowGlowBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<Cfg>({ cornerRadius: 0, speed: 0.22, blobSize: 0.66, intensity: 0.71, strokeWidth: 4.5, padding: 25 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // @ts-ignore
    const create = function create(e,t){let a,l=e.getContext("2d"),i=0,n=0,r=performance.now(),o=[[188,130,243],[245,185,234],[141,159,255],[255,103,120],[255,186,113],[198,134,255]],s=[{fx:.31,fy:.47,px:0,py:.5*Math.PI},{fx:.53,fy:.29,px:Math.PI,py:1.2*Math.PI},{fx:.41,fy:.67,px:.7*Math.PI,py:0},{fx:.23,fy:.53,px:1.5*Math.PI,py:.8*Math.PI},{fx:.59,fy:.37,px:.3*Math.PI,py:1.7*Math.PI},{fx:.43,fy:.61,px:1.1*Math.PI,py:.3*Math.PI}],h=["#BC82F3","#F5B9EA","#8D9FFF","#FF6778","#FFBA71","#C686FF"],d=[...h],m=[...h],c=1,p=.45,g=e=>{let t=parseInt(e.replace("#",""),16);return[t>>16&255,t>>8&255,255&t]},u=()=>{let t=e.getBoundingClientRect();e.width=t.width||window.innerWidth,e.height=t.height||window.innerHeight},b=(e,t,a,i,n)=>{n=Math.max(0,Math.min(n,a/2,i/2)),l.beginPath(),l.moveTo(e+n,t),l.lineTo(e+a-n,t),l.arcTo(e+a,t,e+a,t+n,n),l.lineTo(e+a,t+i-n),l.arcTo(e+a,t+i,e+a-n,t+i,n),l.lineTo(e+n,t+i),l.arcTo(e,t+i,e,t+i-n,n),l.lineTo(e,t+n),l.arcTo(e,t,e+n,t,n),l.closePath()},f=u=>{let y=Math.min((u-r)/1e3,.05);r=u;let M=t(),x=e.width,w=e.height,k=x/2,S=w/2,v=Math.min(x,w);i+=M.speed*y,n+=.4*y,c=Math.min(1,c+y/.55),(p-=y)<=0&&c>=1&&(p=.4+.15*Math.random(),d=[...m],c=0,m=[...h].sort(()=>Math.random()-.5));let C=d.map((e,t)=>((e,t,a)=>{let[l,i,n]=g(e),[r,o,s]=g(t);return`rgb(${Math.round(l+(r-l)*a)},${Math.round(i+(o-i)*a)},${Math.round(n+(s-n)*a)})`})(e,m[t],c));l.clearRect(0,0,x,w),l.fillStyle="#080810",l.fillRect(0,0,x,w);let A=M.padding,R=M.strokeWidth,F=M.intensity,I=x-2*A,P=w-2*A,$=M.cornerRadius,z=v*M.blobSize;l.save(),b(A,A,I,P,$),l.clip(),l.globalCompositeOperation="screen",s.forEach((e,t)=>{let[a,n,r]=o[t],s=k+.4*I*Math.sin(i*e.fx+e.px),h=S+.4*P*Math.cos(i*e.fy+e.py),d=l.createRadialGradient(s,h,0,s,h,z);d.addColorStop(0,`rgba(${a},${n},${r},${.82*F})`),d.addColorStop(.42,`rgba(${a},${n},${r},${.36*F})`),d.addColorStop(1,`rgba(${a},${n},${r},0)`),l.beginPath(),l.arc(s,h,z,0,2*Math.PI),l.fillStyle=d,l.fill()}),l.restore();let T=(e,t,a)=>{let i;l.save(),t>0&&(l.filter=`blur(${t}px)`),l.globalAlpha=a,i=l.createConicGradient(n-Math.PI/2,k,S),C.forEach((e,t)=>i.addColorStop(t/C.length,e)),i.addColorStop(1,C[0]),l.strokeStyle=i,l.lineWidth=e,l.lineCap="round",b(A,A,I,P,$),l.stroke(),l.restore()};T(4.5*R,26*F,.3*F),T(2.8*R,14*F,.5*F),T(1.6*R,5*F,.72*F),T(R,0,1),a=requestAnimationFrame(f)};u(),a=requestAnimationFrame(f);let y=new ResizeObserver(()=>u());return y.observe(e),()=>{cancelAnimationFrame(a),y.disconnect()}};
    return create(canvas, () => cfgRef.current);
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
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
        .c-primary { background:#ffffff!important; color:#0d0d0d!important; border-radius:6px!important; border:none!important; font-weight:500!important; }
        .c-primary:hover { background:#d6d6d6!important; }
        .c-ghost { background:rgba(255,255,255,0.06)!important; border:1px solid rgba(255,255,255,0.18)!important; border-radius:6px!important; color:rgba(255,255,255,0.70)!important; font-weight:500!important; }
        .c-ghost:hover { background:rgba(255,255,255,0.11)!important; border-color:rgba(255,255,255,0.36)!important; color:#fff!important; }
        .c-nav-link:hover { color:rgba(240,241,242,0.88)!important; }
        .c-hero-section { height:92vh; height:92dvh; }
        @media(min-width:961px) and (max-width:1100px){
          .c-hero { padding:88px 56px 72px!important; }
        }
        @media(max-width:1100px){
          .c-two { gap:56px!important; }
          .c-pull { padding:72px 48px!important; }
          .c-cta  { padding:88px 48px!important; }
        }
        @media(max-width:960px){
          .c-two { grid-template-columns:1fr!important; gap:48px!important; }
          .c-three { grid-template-columns:1fr 1fr!important; }
          .c-hero { padding:108px 36px 84px!important; }
          .c-sec { padding:80px 36px!important; }
          .c-pull { padding:64px 36px!important; }
          .c-cta  { padding:80px 36px!important; }
          .c-stat-row { grid-template-columns:1fr 1fr!important; }
          .c-nav { padding:0 36px!important; }
          .c-nav-label { display:none!important; }
        }
        @media(max-width:600px){
          .c-two { gap:36px!important; }
          .c-three { grid-template-columns:1fr!important; }
          .c-sec { padding:56px 20px!important; }
          .c-pull { padding:52px 20px!important; }
          .c-cta  { padding:64px 20px!important; }
          .c-nav { padding:0 20px!important; }
          .c-mn-card { border-left:none!important; border-top:1px solid rgba(255,255,255,0.08); }
          .c-mn-card:first-child { border-top:none!important; }
        }
      ` }} />

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="c-nav" style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 80px', background: 'rgba(8,8,8,0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 15, letterSpacing: '-0.01em' }}>
          Ambient <em style={{ fontStyle: 'italic', color: C.text2 }}>Intelligence</em>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span className="c-nav-label" style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text4 }}>Founder&apos;s Day 2026</span>
          <a href="mailto:bribradley@gmail.com" className="c-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', fontSize: 13, textDecoration: 'none', letterSpacing: '0.01em', transition: 'background 0.15s' }}>
            Connect
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="c-hero-section" style={{ position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <FlowGlowBg />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,8,8,0.52) 0%,rgba(8,8,8,0.06) 35%,rgba(8,8,8,0) 100%)', pointerEvents: 'none', zIndex: 1 }} />
        <div className="c-hero" style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '148px 56px 120px', width: '100%' }}>
          <p className="c-e" style={{ fontFamily: C.mono, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.82)', margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.gold, animation: 'pulse-gold 2s ease-out infinite', flexShrink: 0 }} />
            Carlson School of Management &middot; Office of Technology Commercialization &middot; University of Minnesota
          </p>
          <h1 className="c-h" style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(58px, 8vw, 108px)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 32px', maxWidth: 900 }}>
            Founder&apos;s Day{' '}
            <em style={{ fontStyle: 'italic', color: C.text2 }}>2026</em>
          </h1>
          <p className="c-s" style={{ fontSize: 'clamp(26px, 3.2vw, 40px)', lineHeight: 1.32, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.75)', margin: '0 0 56px' }}>
            24/7 contactless and noninvasive monitoring<br/>engineered for memory care.
          </p>
          <div className="c-p" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'R&D',    value: 'Office of Discovery and Translation' },
              { label: 'ENDURE', value: 'Bakken Medical Devices Center' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'stretch', background: 'transparent', border: '1px solid rgba(255,255,255,0.22)' }}>
                <div style={{ width: 3, background: 'rgba(255,255,255,0.95)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '13px 20px' }}>
                  <span style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: '0.20em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontFamily: C.sans, fontSize: 15, color: '#ffffff', letterSpacing: '-0.01em', fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ───────────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-pull" style={{ background: C.surf1, padding: '96px 56px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="01" label="The Problem" />
          <p style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(30px, 4.2vw, 54px)', lineHeight: 1.36, letterSpacing: '-0.018em', color: C.text, margin: '0 0 64px' }}>
            The growing nursing shortage in the U.S. and abroad demands new tools to extend what limited staff can do. We built a system that monitors complex patient movement patterns for both falls and longitudinal changes over time.
          </p>
        </div>
      </section>

      {/* ── 01: HOW IT WORKS ─────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="c-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'start' }}>
            <div>
              <SectionMeta n="02" label="How It Works" />
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 60px)', lineHeight: 1.1, letterSpacing: '-0.026em', margin: '0 0 28px' }}>
                The resident moves freely.<br/>
                <em style={{ fontStyle: 'italic', color: C.text2 }}>We never interfere.</em>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.76, color: C.text2, margin: '0 0 40px' }}>
                Ambient sensors are installed in the room and continuously map motion through space without cameras, wearables, or any interaction from residents or staff.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { text: 'Sensors mount in corners — out of sight, out of mind',    color: C.accent  },
                  { text: 'Full coverage including bathroom and transition zones',     color: C.gold    },
                  { text: 'Detects falls and movement patterns', color: C.green   },
                  { text: 'No wearable, no camera, no resident interaction required', color: C.maroon  },
                ].map((item, i) => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 0, borderTop: `1px solid ${C.line}`, padding: '18px 0' }}>
                    <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.12em', color: item.color, marginRight: 20, marginTop: 3, flexShrink: 0, paddingRight: 20, borderRight: `1px solid ${C.line}` }}>0{i+1}</span>
                    <span style={{ fontSize: 16, color: C.text2, lineHeight: 1.58 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
              <HowItWorksDiagram />
          </div>
        </div>
      </section>


      {/* ── 02: TECHNOLOGY ───────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ background: C.surf1, padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="03" label="Technology" />
          <div className="c-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 60px)', lineHeight: 1.1, letterSpacing: '-0.026em', margin: '0 0 28px' }}>
                Passive sensing.<br/>
                <em style={{ fontStyle: 'italic', color: C.text2 }}>Active intelligence.</em>
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.76, color: C.text2, margin: '0 0 40px' }}>
                Ambient device data flows securely through the cloud, where an AI model translates it into summaries on the nurse dashboard in real time. Nurses see what matters without sifting through raw signals and unnecessary alerts.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['IWR6843AOP Radar', 'AWS Kinesis', 'Bedrock AI', 'HIPAA Compliant', 'No Camera', 'No Wearable', 'PCT Patent Filed'].map(tag => (
                  <Tag key={tag} color={C.text3} bg="rgba(255,255,255,0.04)">{tag}</Tag>
                ))}
              </div>
            </div>
            <TechDiagram />
          </div>
        </div>
      </section>

      {/* ── 03: ELLA AI ──────────────────────────────────────────────────────── */}
      <Rule />
      <section className="c-sec" style={{ padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="04" label="Flagship Product" />
          <div className="c-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'start' }}>

            {/* FlowGlow card — left */}
            <div style={{ width: '75%' }}>
              <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4' }}>
                <CardFlowGlowBg />
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
                  { text: 'Daily AI summaries for nurses',                        color: C.accent  },
                  { text: 'Prioritized alert queue with anomaly detection',      color: C.gold   },
                  { text: 'Behavioral trend analysis — days, weeks, months',     color: C.green  },
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
      <section className="c-sec" style={{ background: C.surf1, padding: '128px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionMeta n="05" label="Minnesota Roots" />
          <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(40px, 4.5vw, 60px)', lineHeight: 1.08, letterSpacing: '-0.028em', margin: '0 0 32px', maxWidth: 640 }}>
            Built in Minnesota.<br/>
            <em style={{ fontStyle: 'italic', color: C.text2 }}>For Minnesota care.</em>
          </h2>
          <p style={{ fontFamily: C.sans, fontSize: 'clamp(22px, 2.6vw, 32px)', lineHeight: 1.58, color: C.text2, margin: '0 0 64px' }}>
            The Minnesota Partnership for Biotechnology and Medical Genomics is a unique collaborative venture among the Mayo Clinic, University of Minnesota, and State of Minnesota. The Partnership seeks to position Minnesota as a world leader in biotechnology and medical genomics applications that will result in important new medical discoveries, thereby improving health care for patients and supporting the development of new business and jobs in Minnesota.
          </p>
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
              <div key={card.title} className="c-mn-card" style={{ padding: '36px 32px 32px', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none' }}>
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
      <section className="c-cta" style={{ background: C.bg2, padding: '120px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 104, alignItems: 'center' }} className="c-two">
          <div>
            <p style={{ fontFamily: C.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.text4, margin: '0 0 24px' }}>May 13 · Toaster Innovation Hub</p>
            <h2 style={{ fontFamily: C.serif, fontWeight: 300, fontSize: 'clamp(38px, 4.5vw, 62px)', lineHeight: 1.06, letterSpacing: '-0.032em', margin: '0 0 24px' }}>
              Engineered for<br/>
              <em style={{ fontStyle: 'italic', color: C.text2 }}>Memory Care.</em>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <a href="mailto:bribradley@gmail.com" className="c-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 32px', fontSize: 15, textDecoration: 'none', transition: 'background 0.15s', letterSpacing: '0.01em' }}>
              Get in Touch
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" className="c-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 32px', fontSize: 15, textDecoration: 'none', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}>
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
