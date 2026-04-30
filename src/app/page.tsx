'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const HERO_MODULE = {
  href: '/dashboard/room/MOH301',
  tag: 'Operations',
  label: 'Nurse Dashboard',
  description: 'Real-time resident activity monitoring, fall-detection alerts, and AI-generated clinical summaries across all floors. The operational core of the Ambient Intelligence platform.',
  meta: 'IWR6843AOP · Live',
};

const MODULE_GROUPS = [
  {
    key: 'regulatory',
    label: 'Regulatory & Compliance',
    accent: '#C8922A',
    accentDim: 'rgba(200,146,42,0.10)',
    cols: 2,
    modules: [
      { href: '/samd', tag: 'Regulatory', label: 'SaMD Dashboard', description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking per IEC 62304 and ISO 14971.', meta: 'IEC 62304 / ISO 14971' },
      { href: '/gapanalysis', tag: 'Compliance', label: '21 CFR 820 Gap Analysis', description: 'Interactive tracker for all 15 subparts of 21 CFR Part 820. Mark evidence, add notes, auto-persisted.', meta: 'FDA QSR · 15 subparts' },
    ],
  },
  {
    key: 'infrastructure',
    label: 'Infrastructure & Hardware',
    accent: '#2D72D2',
    accentDim: 'rgba(45,114,210,0.10)',
    cols: 2,
    modules: [
      { href: '/bom', tag: 'Engineering', label: 'Bill of Materials', description: 'Full parts library, assembly BOMs, and build orders for EVT-0.1 hardware. 57 components priced from DigiKey and Mouser.', meta: 'EVT-0.1 · 57 parts' },
      { href: '/cloud', tag: 'Infrastructure', label: 'Cloud Infrastructure', description: 'AWS backend — seven services across fall-alert hot path, Parquet cold path, Ella AI narratives, and the Nurse API. Architecture v4.', meta: 'ambientcloud · AWS · Terraform' },
    ],
  },
  {
    key: 'tools',
    label: 'Design & Tools',
    accent: '#8B6BE8',
    accentDim: 'rgba(139,107,232,0.10)',
    cols: 4,
    modules: [
      { href: '/datascience', tag: 'Data Science', label: 'Data Science', description: 'Signal processing pipelines, ML model benchmarks, Parquet data architecture, and sensor fusion analytics for the platform.', meta: 'Parquet · ML · Recharts' },
      { href: '/backgroundlab', tag: 'Design', label: 'Background Lab', description: 'Generative backgrounds, motion studies, and ambient UI pattern experiments for the Ambient Intelligence design system.', meta: 'Canvas · Motion · UI' },
      { href: '/brand', tag: 'Design', label: 'Brand & Color Picker', description: 'Interactive color palette with copyable hex values. Brand mark at scale, badge states, and full type scale reference.', meta: 'ambientdesign · interactive' },
      { href: '/colors', tag: 'Design', label: 'Color & Typography', description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and full type scale.', meta: 'globals.css · tokens' },
    ],
  },
];


// ── Ticker events ──
const TICKER_EVENTS = [
  { room:'201', type:'movement', label:'Movement detected', ago:'2s' },
  { room:'305', type:'alert',    label:'Fall alert',        ago:'14s' },
  { room:'118', type:'movement', label:'Movement detected', ago:'31s' },
  { room:'212', type:'quiet',    label:'Room quiet',        ago:'48s' },
  { room:'307', type:'alert',    label:'Fall alert',        ago:'1m 2s' },
  { room:'104', type:'movement', label:'Movement detected', ago:'1m 19s' },
  { room:'220', type:'quiet',    label:'Room quiet',        ago:'1m 44s' },
  { room:'311', type:'movement', label:'Movement detected', ago:'2m 3s' },
  { room:'109', type:'alert',    label:'Fall alert resolved', ago:'2m 28s' },
  { room:'215', type:'movement', label:'Movement detected', ago:'2m 51s' },
  { room:'302', type:'quiet',    label:'Room quiet',        ago:'3m 10s' },
  { room:'107', type:'movement', label:'Movement detected', ago:'3m 33s' },
];

const TICK_COLOR: Record<string,string> = { movement:'#FFC940', alert:'#FF6B6B', quiet:'#3DCC91' };

// ── Pipeline nodes ──
const PIPELINE = [
  { id:'sensor',   label:'IWR6843AOP', sub:'Radar sensor',    group:'device' },
  { id:'kinesis',  label:'Kinesis',    sub:'Ingest stream',   group:'aws' },
  { id:'lambda',   label:'Lambda',     sub:'Classifier',      group:'aws' },
  { id:'dynamo',   label:'DynamoDB',   sub:'Alert store',     group:'aws' },
  { id:'bedrock',  label:'Bedrock',    sub:'Ella AI',         group:'aws' },
  { id:'api',      label:'API GW',     sub:'Nurse API',       group:'aws' },
  { id:'dash',     label:'Dashboard',  sub:'Nurse display',   group:'app' },
];

function Ticker() {
  const [offset, setOffset] = React.useState(0);
  React.useEffect(()=>{
    const id = setInterval(()=>setOffset(o=>(o+1)%TICKER_EVENTS.length), 2800);
    return ()=>clearInterval(id);
  },[]);
  const visible = [...TICKER_EVENTS, ...TICKER_EVENTS].slice(offset, offset+5);
  return (
    <div style={{ overflow:'hidden' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {visible.map((e,i)=>(
          <div key={`${e.room}-${offset}-${i}`} style={{
            display:'flex', alignItems:'center', gap:16,
            padding:'13px 0',
            borderBottom:`1px solid rgba(255,255,255,0.05)`,
            opacity: i===0 ? 1 : 1-(i*0.15),
            transition:'opacity 0.4s ease',
          }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:TICK_COLOR[e.type], flexShrink:0, boxShadow: e.type==='alert' ? `0 0 6px ${TICK_COLOR[e.type]}` : 'none' }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'#9A9B9D', letterSpacing:'0.06em', width:60, flexShrink:0 }}>Room {e.room}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color: i===0 ? '#EDEEF0' : '#9A9B9D', letterSpacing:'0.04em', flex:1 }}>{e.label}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'#5C5E62', letterSpacing:'0.06em' }}>{e.ago} ago</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pipeline() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(()=>{
    const id = setInterval(()=>setTick(t=>t+1), 600);
    return ()=>clearInterval(id);
  },[]);
  const GROUP_COLOR: Record<string,{bg:string,border:string,text:string}> = {
    device: { bg:'rgba(45,114,210,0.12)', border:'rgba(45,114,210,0.4)', text:'#2D72D2' },
    aws:    { bg:'rgba(255,201,64,0.08)', border:'rgba(255,201,64,0.25)', text:'#FFC940' },
    app:    { bg:'rgba(61,204,145,0.10)', border:'rgba(61,204,145,0.35)', text:'#3DCC91' },
  };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto' }}>
      {PIPELINE.map((node,i)=>{
        const gc = GROUP_COLOR[node.group];
        const active = tick % PIPELINE.length === i;
        return (
          <React.Fragment key={node.id}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
              <div style={{
                padding:'14px 20px', borderRadius:3,
                background: active ? gc.bg : 'rgba(255,255,255,0.03)',
                border:`1px solid ${active ? gc.border : 'rgba(255,255,255,0.07)'}`,
                transition:'all 0.3s ease', minWidth:110, textAlign:'center',
              }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color: active ? gc.text : '#9A9B9D', fontWeight:500, letterSpacing:'0.06em', marginBottom:4, transition:'color 0.3s' }}>
                  {node.label}
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  {node.sub}
                </div>
              </div>
            </div>
            {i < PIPELINE.length-1 && (
              <div style={{ flex:1, display:'flex', alignItems:'center', padding:'0 4px', minWidth:24, position:'relative', overflow:'hidden' }}>
                <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.08)', position:'relative' }}>
                  <div style={{
                    position:'absolute', top:-2, width:5, height:5, borderRadius:'50%',
                    background:'#2D72D2', boxShadow:'0 0 6px #2D72D2',
                    left: `${((tick % (PIPELINE.length)) === i ? 80 : (tick % (PIPELINE.length)) > i ? 100 : 0)}%`,
                    transition:'left 0.55s ease', opacity: (tick % PIPELINE.length) >= i ? 1 : 0.2,
                  }}/>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}


// ── Viz data ──
type RoomStatus = 'quiet'|'movement'|'alert';
const VIZ_FLOORS: { floor: string; rooms: { id: string; status: RoomStatus }[] }[] = [
  { floor:'3F', rooms:[
    {id:'301',status:'quiet'},{id:'302',status:'quiet'},{id:'303',status:'movement'},{id:'304',status:'quiet'},{id:'305',status:'alert'},
    {id:'306',status:'quiet'},{id:'307',status:'quiet'},{id:'308',status:'movement'},{id:'309',status:'quiet'},{id:'310',status:'quiet'},
    {id:'311',status:'movement'},{id:'312',status:'quiet'},{id:'313',status:'quiet'},{id:'314',status:'quiet'},
  ]},
  { floor:'2F', rooms:[
    {id:'201',status:'quiet'},{id:'202',status:'movement'},{id:'203',status:'quiet'},{id:'204',status:'quiet'},{id:'205',status:'quiet'},
    {id:'206',status:'movement'},{id:'207',status:'alert'},{id:'208',status:'quiet'},{id:'209',status:'movement'},{id:'210',status:'quiet'},
    {id:'211',status:'quiet'},{id:'212',status:'alert'},{id:'213',status:'quiet'},{id:'214',status:'movement'},
  ]},
  { floor:'1F', rooms:[
    {id:'101',status:'quiet'},{id:'102',status:'quiet'},{id:'103',status:'quiet'},{id:'104',status:'movement'},{id:'105',status:'quiet'},
    {id:'106',status:'quiet'},{id:'107',status:'movement'},{id:'108',status:'quiet'},{id:'109',status:'alert'},{id:'110',status:'quiet'},
    {id:'111',status:'movement'},{id:'112',status:'quiet'},{id:'113',status:'quiet'},{id:'114',status:'quiet'},
  ]},
];
const VIZ_STATUS_COLOR: Record<RoomStatus,string> = { quiet:'#3DCC91', movement:'#FFC940', alert:'#FF6B6B' };
const VIZ_STATUS_DIM:   Record<RoomStatus,string> = { quiet:'rgba(61,204,145,0.12)', movement:'rgba(255,201,64,0.14)', alert:'rgba(255,107,107,0.16)' };
const VIZ_RINGS = [
  { label:'21 CFR 820', sub:'Gap Analysis',       pct:62, color:'#2D72D2' },
  { label:'SaMD Verified', sub:'IEC 62304',        pct:48, color:'#3DCC91' },
  { label:'Risk Closed',  sub:'ISO 14971',          pct:71, color:'#FFC940' },
];

function LandingHeatmap() {
  const [tip, setTip] = React.useState<{id:string;status:string}|null>(null);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {VIZ_FLOORS.map(f=>(
        <div key={f.floor} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#5C5E62', width:20, flexShrink:0 }}>{f.floor}</span>
          <div style={{ display:'flex', gap:4, flex:1 }}>
            {f.rooms.map(r=>(
              <div key={r.id}
                onMouseEnter={()=>setTip(r)} onMouseLeave={()=>setTip(null)}
                style={{ flex:1, height:32, borderRadius:2, background:VIZ_STATUS_DIM[r.status], border:`1px solid ${VIZ_STATUS_COLOR[r.status]}44`, cursor:'default', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:7.5, color:VIZ_STATUS_COLOR[r.status], opacity:0.85 }}>{r.id}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:16, marginTop:8, alignItems:'center' }}>
        {(['quiet','movement','alert'] as RoomStatus[]).map(s=>(
          <div key={s} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:7, height:7, borderRadius:1, background:VIZ_STATUS_COLOR[s], display:'inline-block' }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62', textTransform:'capitalize' }}>{s}</span>
          </div>
        ))}
        {tip && <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#9A9B9D', marginLeft:'auto' }}>Room {tip.id} · {tip.status}</span>}
      </div>
    </div>
  );
}


function LandingDonut({ pct, color, size=88 }: { pct:number; color:string; size?:number }) {
  const r = (size/2)-9;
  const circ = 2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
}


// ── Activity rhythm data (7 days × 24 hours) ──
const RHYTHM_DATA: number[][] = [
  [0,0,1,0,0,0,0,2,5,8,6,4,7,9,5,6,8,11,7,5,3,1,0,0],  // Mon
  [0,0,0,1,0,0,0,3,6,9,7,5,8,10,6,7,9,12,8,4,2,1,0,0], // Tue
  [0,1,0,0,0,0,1,2,5,7,5,4,6,8,4,5,7,10,6,4,2,1,0,0],  // Wed
  [0,0,0,0,1,0,0,3,7,10,8,6,9,11,7,8,10,14,9,5,3,1,0,0],// Thu
  [0,0,1,0,0,0,0,2,6,8,7,5,7,9,5,7,8,12,7,4,3,2,1,0],  // Fri
  [0,0,0,1,0,0,1,1,3,5,4,3,5,6,4,4,5,7,5,3,2,1,0,0],   // Sat
  [0,0,0,0,0,0,0,1,2,4,3,2,4,5,3,3,4,6,4,2,1,0,0,0],   // Sun
];
const RHYTHM_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const RHYTHM_MAX = Math.max(...RHYTHM_DATA.flat());


function ActivityRhythm() {
  const [tip, setTip] = React.useState<{day:string;hour:number;val:number}|null>(null);
  const nowH = new Date().getHours();
  const nowD = new Date().getDay(); // 0=Sun
  const todayIdx = nowD===0 ? 6 : nowD-1;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {/* Hour labels */}
      <div style={{ display:'flex', gap:3, paddingLeft:32 }}>
        {Array.from({length:24},(_,h)=>(
          <div key={h} style={{ flex:1, textAlign:'center' }}>
            {h%6===0 && <span style={{ fontFamily:'var(--mono)', fontSize:7.5, color:'#5C5E62' }}>{String(h).padStart(2,'0')}</span>}
          </div>
        ))}
      </div>
      {/* Grid */}
      {RHYTHM_DATA.map((row,d)=>(
        <div key={d} style={{ display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color: d===todayIdx ? '#EDEEF0' : '#5C5E62', width:28, flexShrink:0, textAlign:'right' }}>{RHYTHM_DAYS[d]}</span>
          {row.map((val,h)=>{
            const intensity = val/RHYTHM_MAX;
            const isNow = d===todayIdx && h===nowH;
            return (
              <div key={h}
                onMouseEnter={()=>setTip({day:RHYTHM_DAYS[d],hour:h,val})}
                onMouseLeave={()=>setTip(null)}
                style={{ flex:1, height:18, borderRadius:2, cursor:'default',
                  background: isNow ? '#2D72D2' : val===0 ? 'rgba(255,255,255,0.04)' : `rgba(45,114,210,${0.12+intensity*0.75})`,
                  border: isNow ? '1px solid #2D72D2' : '1px solid transparent',
                  transition:'background 0.15s',
                }}/>
            );
          })}
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:7, height:7, borderRadius:1, background:'#2D72D2', display:'inline-block' }}/>
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62' }}>Current hour</span>
        </div>
        {tip
          ? <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#9A9B9D' }}>{tip.day} {String(tip.hour).padStart(2,'0')}:00 · {tip.val} alerts</span>
          : <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62' }}>Hover to inspect</span>
        }
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62' }}>Low</span>
          {[0.1,0.3,0.55,0.75,1].map(o=>(
            <span key={o} style={{ width:10, height:10, borderRadius:1, background:`rgba(45,114,210,${o})`, display:'inline-block' }}/>
          ))}
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62' }}>High</span>
        </div>
      </div>
    </div>
  );
}




function ParticleField() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; layer: number;
      pulse: number; pulseSpeed: number;
    }

    const N            = 62;
    const SPEED        = 0.38;
    const GLOW_RADIUS  = 13.5;
    const CONNECT      = 165;
    const CONNECT_OPQ  = 0.47;
    const BRIGHTNESS   = 0.41;
    const PULSE_SPEED  = 0.043;
    const VIGNETTE     = 0.44;

    let particles: Particle[] = [];

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const init = () => {
      particles = Array.from({ length: N }, () => {
        const layer = Math.random();
        const angle = Math.random() * Math.PI * 2;
        return {
          x:          Math.random() * canvas.width,
          y:          Math.random() * canvas.height,
          vx:         Math.cos(angle),
          vy:         Math.sin(angle),
          r:          0.6 + layer * 1.8,
          alpha:      0.15 + layer * 0.45,
          layer,
          pulse:      Math.random() * Math.PI * 2,
          pulseSpeed: PULSE_SPEED,
        };
      });
    };

    const draw = () => {
      const cw = canvas.width, ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      // Connection lines
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT) {
            const depth  = (particles[i].layer + particles[j].layer) / 2;
            const alpha  = (1 - d / CONNECT) * CONNECT_OPQ * depth;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100,150,255,${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // Particles — soft glowing orbs
      particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const pf  = 0.85 + 0.15 * Math.sin(p.pulse);
        const r   = p.r * pf;
        const al  = p.alpha * pf * (BRIGHTNESS / 0.45);
        const gs  = r * GLOW_RADIUS;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
        g.addColorStop(0,    `rgba(110,165,255,${al * 0.55})`);
        g.addColorStop(0.45, `rgba(80,130,220,${al * 0.15})`);
        g.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, gs, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,215,255,${al})`;
        ctx.fill();

        p.x += p.vx * SPEED; p.y += p.vy * SPEED;
        if (p.x < -10)      p.x = cw + 10;
        if (p.x > cw + 10)  p.x = -10;
        if (p.y < -10)      p.y = ch + 10;
        if (p.y > ch + 10)  p.y = -10;
      });

      // Vignette
      const vign = ctx.createRadialGradient(cw/2, ch*0.44, ch*0.04, cw/2, ch*0.44, ch*0.52);
      vign.addColorStop(0,   `rgba(12,13,15,${VIGNETTE})`);
      vign.addColorStop(0.5, `rgba(12,13,15,${VIGNETTE * 0.25})`);
      vign.addColorStop(1,   'rgba(12,13,15,0)');
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, cw, ch);

      animId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    const ro = new ResizeObserver(() => { resize(); init(); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

const STATS = [
  { value: '57', label: 'Hardware components' },
  { value: '15', label: 'CFR Part 820 subparts' },
  { value: '6', label: 'Active modules' },
  { value: '142', label: 'Rooms monitored' },
];

const ENG_SPRINT = {
  num: 18,
  dates: 'Apr 21 – May 2',
  totalIssues: 16,
  totalPts: 96,
  donePts: 34,
  columns: [
    { id: 'todo',       label: 'To Do',       count: 5, pts: 29, color: '#5C5E62' },
    { id: 'inprogress', label: 'In Progress',  count: 4, pts: 22, color: '#FFC940' },
    { id: 'review',     label: 'In Review',    count: 3, pts: 11, color: '#2D72D2' },
    { id: 'done',       label: 'Done',         count: 4, pts: 34, color: '#3DCC91' },
  ],
  critical: {
    id: 'ENG-144',
    title: 'Fall alert fires twice when sensor resets mid-event',
    assignee: 'Abdul',
    assigneeInitial: 'A',
    assigneeColor: '#22D3EE',
    labels: ['alerts', 'sensors'],
  },
  team: [
    { discipline: 'Electrical',        color: '#FB923C', members: [{ name:'Gavin', initial:'G', color:'#00B4D8' },{ name:'Hanna', initial:'H', color:'#F472B6' },{ name:'Paulo', initial:'P', color:'#FB923C' }] },
    { discipline: 'Software',          color: '#818CF8', members: [{ name:'Isaac', initial:'I', color:'#818CF8' },{ name:'Aki',   initial:'A', color:'#34D399' }] },
    { discipline: 'Cloud Security',    color: '#22D3EE', members: [{ name:'Abdul', initial:'A', color:'#22D3EE' }] },
  ],
};

const C = {
  bg:        '#0C0D0F',
  surface:   '#13151A',
  surface2:  '#1C1F26',
  border:    'rgba(255,255,255,0.07)',
  borderHov: 'rgba(45,114,210,0.25)',
  accent:    '#2D72D2',
  accentDim: 'rgba(45,114,210,0.10)',
  text:      '#EDEEF0',
  text2:     '#9A9B9D',
  text3:     '#5C5E62',
  grid:      'rgba(255,255,255,0.025)',
};

function LiveNav() {
  const [now, setNow] = React.useState(new Date());
  const [pulse, setPulse] = React.useState(true);
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const p = setInterval(() => setPulse(v => !v), 900);
    return () => { clearInterval(t); clearInterval(p); };
  }, []);
  const cst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hh = String(cst.getHours()).padStart(2, '0');
  const mm = String(cst.getMinutes()).padStart(2, '0');
  const ss = String(cst.getSeconds()).padStart(2, '0');

  const stats = [
    { label: 'Active alerts', value: '2', color: '#FF6B6B', dot: true },
    { label: 'Rooms live',    value: '142', color: '#3DCC91', dot: false },
    { label: 'Avg confidence', value: '94%', color: '#2D72D2', dot: false },
    { label: 'Sprint 18',    value: '35% done', color: '#FFC940', dot: false },
    { label: 'Pipeline',     value: 'NOMINAL', color: '#3DCC91', dot: false },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 20px',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>
          {s.dot && (
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: s.color,
              boxShadow: pulse ? `0 0 7px ${s.color}` : 'none',
              transition: 'box-shadow 0.4s ease',
              flexShrink: 0,
            }} />
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 2 }}>{s.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: s.color, fontWeight: 600, letterSpacing: '0.04em' }}>{s.value}</span>
        </div>
      ))}
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>CST</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}>{hh}:{mm}:{ss}</span>
      </div>
    </div>
  );
}

export default function Landing1() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [heroHovered, setHeroHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .l1-fadeup { animation: fadeUp 0.55s ease both; }
        .l1-card-arrow { transition: transform 0.2s ease; }
        .l1-card:hover .l1-card-arrow { transform: translate(3px,-3px); }
        .l1-nav-link { transition: color 0.2s ease; }
        .l1-nav-link:hover { color: #EDEEF0 !important; }
        .l1-stat-val { font-variant-numeric: tabular-nums; }
        .l1-cta-primary {
          background: #2D72D2; color: #fff;
          border: none; border-radius: 2px;
          padding: 13px 28px; font-size: 13px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; transition: opacity 0.2s ease;
          font-family: inherit;
        }
        .l1-cta-primary:hover { opacity: 0.88; }
        .l1-cta-ghost {
          background: transparent; color: #EDEEF0;
          border: 1px solid rgba(255,255,255,0.18); border-radius: 2px;
          padding: 13px 28px; font-size: 13px; font-weight: 500;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; transition: border-color 0.2s, color 0.2s;
          font-family: inherit;
        }
        .l1-cta-ghost:hover { border-color: #2D72D2; color: #2D72D2; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(12,13,15,0.88)',
          backdropFilter: 'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: C.text }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <LiveNav />
          <Link href="/control" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '5px 12px', borderRadius: 2 }}>
              View Control Center
            </span>
          </Link>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 48px',
          position: 'relative', overflow: 'hidden',
          backgroundImage: `
            linear-gradient(${C.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}>
          <ParticleField />
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 400, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(45,114,210,0.08) 0%, transparent 70%)',
          }} />

          <div style={{ maxWidth: 900, position: 'relative', zIndex: 1 }}>
            <div className="l1-fadeup" style={{ animationDelay: '0.05s', marginBottom: 24 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: C.accent,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
                Ambient Intelligence · Prototype Platform
              </span>
            </div>

            <h1 className="l1-fadeup" style={{
              animationDelay: '0.15s',
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.05,
              letterSpacing: '-0.03em', margin: '0 0 28px',
              color: C.text,
            }}>
              Intelligence at the<br />
              <em style={{ color: C.accent, fontStyle: 'italic' }}>point of care.</em>
            </h1>

            <p className="l1-fadeup" style={{
              animationDelay: '0.25s',
              fontSize: 18, lineHeight: 1.6, color: C.text2,
              maxWidth: 540, margin: '0 0 44px', fontWeight: 300,
            }}>
              Turning operational sensor data into clinical action — hardware, compliance, and AI in a single platform.
            </p>

            <div className="l1-fadeup" style={{ animationDelay: '0.35s', display: 'flex', gap: 12 }}>
              <Link href="/dashboard/overview" style={{ textDecoration: 'none' }}>
                <button className="l1-cta-primary">Nurse Dashboard</button>
              </Link>
              <Link href="/control" style={{ textDecoration: 'none' }}>
                <button className="l1-cta-ghost">View Control Center</button>
              </Link>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 40, left: 48, zIndex: 1,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.text3,
          }}>
            Scroll to explore ↓
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '36px 48px',
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
            }}>
              <div className="l1-stat-val" style={{
                fontFamily: 'var(--mono)', fontSize: 40, fontWeight: 500,
                color: C.text, letterSpacing: '-0.02em', lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.text3, marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* ── Live Intelligence ── */}
        <section style={{ borderTop:`1px solid rgba(255,255,255,0.07)` }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:320 }}>
            {/* Ticker */}
            <div style={{ padding:'48px 48px', borderRight:`1px solid rgba(255,255,255,0.07)` }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'#2D72D2', marginBottom:8 }}>Live feed</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:300, letterSpacing:'-0.02em', color:'#EDEEF0', marginBottom:28 }}>
                Events as they happen.
              </div>
              <Ticker/>
            </div>
            {/* Pipeline */}
            <div style={{ padding:'48px 48px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'#2D72D2', marginBottom:8 }}>Data pipeline</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:300, letterSpacing:'-0.02em', color:'#EDEEF0', marginBottom:36 }}>
                Sensor to screen.
              </div>
              <Pipeline/>
              <div style={{ display:'flex', gap:20, marginTop:28 }}>
                {[['Device','#2D72D2'],['AWS','#FFC940'],['App','#3DCC91']].map(([label,color])=>(
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:7, height:7, borderRadius:1, background:color, display:'inline-block' }}/>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#5C5E62', textTransform:'uppercase', letterSpacing:'0.12em' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Engineering ── */}
        <section style={{ borderTop:`1px solid ${C.border}`, padding:'80px 48px', background: C.surface }}>
          {/* Header row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:48 }}>
            <div>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'#2D72D2', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#3DCC91', boxShadow:'0 0 8px #3DCC91' }}/>
                Engineering · Sprint {ENG_SPRINT.num}
              </div>
              <h2 style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:'clamp(28px,3.5vw,48px)', letterSpacing:'-0.03em', margin:0, color:C.text, lineHeight:1.1 }}>
                Building the platform,<br/>
                <em style={{ fontStyle:'italic', color:'#2D72D2' }}>issue by issue.</em>
              </h2>
            </div>
            <Link href="/engineering" style={{ textDecoration:'none', flexShrink:0, marginTop:4 }}>
              <button className="l1-cta-ghost" style={{ display:'flex', alignItems:'center', gap:8 }}>
                View Engineering Console
                <span style={{ fontSize:16, lineHeight:1 }}>↗</span>
              </button>
            </Link>
          </div>

          {/* Sprint progress bar */}
          <div style={{ marginBottom:48, padding:'28px 32px', border:`1px solid ${C.border}`, borderRadius:2, background:C.bg, display:'flex', alignItems:'center', gap:32 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'#5C5E62', whiteSpace:'nowrap' }}>{ENG_SPRINT.dates}</div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round((ENG_SPRINT.donePts/ENG_SPRINT.totalPts)*100)}%`, background:'linear-gradient(90deg, #2D72D2, #3DCC91)', borderRadius:2, transition:'width 0.8s ease' }}/>
              </div>
              <div style={{ display:'flex', gap:20 }}>
                {ENG_SPRINT.columns.map(col => (
                  <div key={col.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:col.color, flexShrink:0 }}/>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#5C5E62', textTransform:'uppercase', letterSpacing:'0.1em' }}>{col.label}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:col.color, fontWeight:600 }}>{col.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.text, whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
              {Math.round((ENG_SPRINT.donePts/ENG_SPRINT.totalPts)*100)}%
              <span style={{ fontSize:10, color:'#5C5E62', marginLeft:8 }}>{ENG_SPRINT.donePts} / {ENG_SPRINT.totalPts} pts</span>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'#5C5E62', whiteSpace:'nowrap' }}>
              {ENG_SPRINT.columns.find(c=>c.id==='done')?.count} of {ENG_SPRINT.totalIssues} issues done
            </div>
          </div>

          {/* 3-panel grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', border:`1px solid ${C.border}` }}>

            {/* Panel 1: Team */}
            <div style={{ padding:'36px 36px', borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase', color:'#5C5E62', marginBottom:28 }}>Team</div>
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                {ENG_SPRINT.team.map(d => (
                  <div key={d.discipline}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                      <span style={{ width:5, height:5, borderRadius:1, background:d.color, flexShrink:0 }}/>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.14em', color:d.color, fontWeight:600 }}>{d.discipline}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, paddingLeft:12 }}>
                      {d.members.map(m => (
                        <div key={m.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:m.color+'22', border:`1px solid ${m.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:m.color }}>{m.initial}</div>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'#9A9B9D' }}>{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 2: Board columns */}
            <div style={{ padding:'36px 36px', borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase', color:'#5C5E62', marginBottom:28 }}>Sprint Board</div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {ENG_SPRINT.columns.map((col, i) => (
                  <div key={col.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 20px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius:2 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:col.color, flexShrink:0 }}/>
                      <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color: col.id === 'inprogress' ? col.color : '#9A9B9D', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight: col.id === 'inprogress' ? 600 : 400 }}>{col.label}</span>
                    </span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:500, color: col.id === 'inprogress' ? col.color : C.text, letterSpacing:'-0.03em', lineHeight:1 }}>{col.count}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#5C5E62', whiteSpace:'nowrap' }}>{col.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: Critical issue */}
            <div style={{ padding:'36px 36px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase', color:'#5C5E62', marginBottom:28 }}>Active Critical</div>
              <div style={{ border:'1px solid rgba(255,107,107,0.25)', borderRadius:3, padding:'24px', background:'rgba(255,107,107,0.04)', display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#FF6B6B', boxShadow:'0 0 8px #FF6B6B', flexShrink:0 }}/>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#FF6B6B', textTransform:'uppercase', letterSpacing:'0.16em', fontWeight:600 }}>Critical</span>
                  <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:'rgba(255,107,107,0.6)' }}>{ENG_SPRINT.critical.id}</span>
                </div>
                <p style={{ margin:0, fontFamily:'var(--serif)', fontSize:16, fontWeight:300, lineHeight:1.5, color:C.text, letterSpacing:'-0.01em' }}>
                  {ENG_SPRINT.critical.title}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:ENG_SPRINT.critical.assigneeColor+'22', border:`1px solid ${ENG_SPRINT.critical.assigneeColor}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:ENG_SPRINT.critical.assigneeColor }}>
                    {ENG_SPRINT.critical.assigneeInitial}
                  </div>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'#9A9B9D' }}>{ENG_SPRINT.critical.assignee}</span>
                  <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
                    {ENG_SPRINT.critical.labels.map(l => (
                      <span key={l} style={{ fontFamily:'var(--mono)', fontSize:8.5, color:'rgba(255,107,107,0.6)', background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.15)', padding:'2px 7px', borderRadius:2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</span>
                    ))}
                  </div>
                </div>
                <Link href="/engineering" style={{ textDecoration:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--mono)', fontSize:9.5, color:'rgba(255,107,107,0.7)', textTransform:'uppercase', letterSpacing:'0.14em', transition:'color 0.2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.color='#FF6B6B')}
                    onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,107,107,0.7)')}>
                    Open issue ↗
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Modules ── */}
        <section style={{ padding: '96px 48px' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
              Platform modules
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em', margin: 0, color: C.text }}>
              Every tool your team needs.
            </h2>
          </div>

          {/* ── Featured: Nurse Dashboard ── */}
          <Link href={HERO_MODULE.href} className="l1-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 1 }}
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}>
            <div style={{
              padding: '48px 48px',
              background: heroHovered ? C.surface2 : C.surface,
              border: `1px solid ${heroHovered ? 'rgba(45,114,210,0.18)' : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.2s ease, border-color 0.2s ease',
              gap: 48,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: C.accent,
                    background: C.accentDim, padding: '3px 8px', borderRadius: 2,
                  }}>{HERO_MODULE.tag}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
                    Primary module
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 2.5vw, 34px)', fontWeight: 400, letterSpacing: '-0.02em', color: C.text, marginBottom: 14 }}>
                  {HERO_MODULE.label}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: C.text2, fontWeight: 300, maxWidth: 560 }}>
                  {HERO_MODULE.description}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20, flexShrink: 0 }}>
                <span className="l1-card-arrow" style={{ color: C.text3, fontSize: 22 }}>↗</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
                    {HERO_MODULE.meta}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* ── Supporting modules label ── */}
          <div style={{ padding: '28px 0 24px', borderTop: `1px solid ${C.border}`, marginTop: 40, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(16px, 1.5vw, 22px)', fontWeight: 300, letterSpacing: '-0.01em', color: C.text }}>
              Ambient Intelligence Control Center
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text3 }}>
              {MODULE_GROUPS.reduce((n, g) => n + g.modules.length, 0)} modules
            </span>
          </div>

          {/* ── Grouped sections ── */}
          {MODULE_GROUPS.map(group => (
            <div key={group.key} style={{ marginBottom: 28 }}>

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 14px', borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: group.accent, background: group.accentDim, padding: '3px 9px', borderRadius: 2 }}>
                  {group.key}
                </span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300, color: C.text2, letterSpacing: '-0.01em' }}>
                  {group.label}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
                  {group.modules.length} modules
                </span>
              </div>

              {/* Cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.cols}, 1fr)`, gap: 1, border: `1px solid ${C.border}` }}>
                {group.modules.map((mod, i) => (
                  <Link key={mod.href} href={mod.href} className="l1-card" style={{ textDecoration: 'none', color: 'inherit' }}
                    onMouseEnter={() => setHovered(mod.href)}
                    onMouseLeave={() => setHovered(null)}>
                    <div style={{
                      padding: '26px 24px',
                      background: hovered === mod.href ? C.surface2 : C.surface,
                      borderRight: (i % group.cols !== group.cols - 1) ? `1px solid ${C.border}` : 'none',
                      display: 'flex', flexDirection: 'column', gap: 12,
                      transition: 'background 0.2s ease',
                      minHeight: 180,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: group.accent,
                          background: group.accentDim, padding: '3px 8px', borderRadius: 2,
                        }}>{mod.tag}</span>
                        <span className="l1-card-arrow" style={{ color: C.text3, fontSize: 14 }}>↗</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 8 }}>
                          {mod.label}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.65, color: C.text2, fontWeight: 300 }}>
                          {mod.description}
                        </div>
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: group.accent }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: C.text3 }}>
                          {mod.meta}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Platform Intelligence ── */}
        <section style={{ borderTop:`1px solid ${C.border}`, padding:'80px 48px' }}>
          <div style={{ marginBottom:48 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:C.accent, marginBottom:14 }}>Platform intelligence</div>
            <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
              <h2 style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:'clamp(26px,3vw,38px)', letterSpacing:'-0.02em', margin:0, color:C.text }}>
                One platform. Full visibility.
              </h2>
              <Link href="/control" style={{ textDecoration:'none' }}>
                <button className="l1-cta-primary" style={{ whiteSpace:'nowrap' }}>View Control Center</button>
              </Link>
            </div>
          </div>

          {/* Row 1: heatmap full width */}
          <div style={{ border:`1px solid ${C.border}`, marginBottom:1 }}>
            <div style={{ padding:'36px 36px', background:C.surface }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Floor activity · 42 rooms</div>
              <LandingHeatmap/>
            </div>
          </div>

          {/* Row 2: activity rhythm full width */}
          <div style={{ border:`1px solid ${C.border}`, marginBottom:1 }}>
            <div style={{ padding:'36px 36px', background:C.surface }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Alert rhythm · 7 days × 24 hours</div>
              <ActivityRhythm/>
            </div>
          </div>

          {/* Row 3: compliance rings full width */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:C.text3, marginBottom:32 }}>Regulatory compliance</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0 }}>
              {VIZ_RINGS.map((r,i)=>(
                <div key={r.label} style={{ display:'flex', alignItems:'center', gap:28, padding:'0 32px', borderRight: i<2 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ position:'relative', width:88, height:88, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <LandingDonut pct={r.pct} color={r.color}/>
                    <span style={{ position:'absolute', fontFamily:'var(--mono)', fontSize:16, fontWeight:500, color:C.text, letterSpacing:'-0.03em' }}>{r.pct}%</span>
                  </div>
                  <div>
                    <div style={{ fontFamily:'var(--serif)', fontSize:16, color:C.text, marginBottom:6 }}>{r.label}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, textTransform:'uppercase', letterSpacing:'0.12em' }}>{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          padding: '80px 48px', borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.surface,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
              Ready to begin
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(24px, 2.5vw, 36px)', letterSpacing: '-0.02em', margin: 0, color: C.text }}>
              Access the control center.
            </h3>
          </div>
          <Link href="/control" style={{ textDecoration: 'none' }}>
            <button className="l1-cta-primary">View Control Center</button>
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          padding: '28px 48px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3 }}>
            Ambient Intelligence · Not for clinical use
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
            ambientprototype.vercel.app
          </span>
        </footer>

      </div>
    </>
  );
}

