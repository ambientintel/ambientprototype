'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Module groups ──
const MODULE_GROUPS = [
  {
    key: 'regulatory',
    label: 'Regulatory & Compliance',
    accent: '#C8922A',
    accentDim: 'rgba(200,146,42,0.10)',
    cols: 2,
    modules: [
      { href: '/samd',        tag: 'Regulatory', label: 'SaMD Dashboard',        description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking per IEC 62304 and ISO 14971.', meta: 'IEC 62304 / ISO 14971' },
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
      { href: '/bom',   tag: 'Engineering',    label: 'Bill of Materials',    description: 'Full parts library, assembly BOMs, and build orders for EVT-0.1 hardware. 57 components priced from DigiKey and Mouser.', meta: 'EVT-0.1 · 57 parts' },
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
      { href: '/datascience',   tag: 'Data Science', label: 'Data Science',          description: 'Signal processing pipelines, ML model benchmarks, Parquet data architecture, and sensor fusion analytics for the platform.', meta: 'Parquet · ML · Recharts' },
      { href: '/backgroundlab', tag: 'Design',       label: 'Background Lab',        description: 'Generative backgrounds, motion studies, and ambient UI pattern experiments for the Ambient Intelligence design system.', meta: 'Canvas · Motion · UI' },
      { href: '/brand',         tag: 'Design',       label: 'Brand & Color Picker',  description: 'Interactive color palette with copyable hex values. Brand mark at scale, badge states, and full type scale reference.', meta: 'ambientdesign · interactive' },
      { href: '/colors',        tag: 'Design',       label: 'Color & Typography',    description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and full type scale.', meta: 'globals.css · tokens' },
    ],
  },
];

const TOTAL_MODULES = MODULE_GROUPS.reduce((n, g) => n + g.modules.length, 0);

const C = {
  bg: '#0C0D0F', surface: '#13151A', surface2: '#1C1F26',
  border: 'rgba(255,255,255,0.07)', accent: '#2D72D2',
  accentDim: 'rgba(45,114,210,0.10)', text: '#EDEEF0',
  text2: '#9A9B9D', text3: '#5C5E62',
  green: '#3DCC91', amber: '#FFC940', red: '#FF6B6B',
};

// ── Stats strip ──
const STATS = [
  { value: '42',     label: 'Rooms monitored',    color: C.green  },
  { value: '99.97%', label: 'System uptime',      color: C.accent },
  { value: '35%',    label: 'Sprint 18 complete', color: C.amber  },
  { value: '57',     label: 'BOM components',     color: '#8B6BE8'},
  { value: '62%',    label: '21 CFR 820 closed',  color: C.amber  },
  { value: '7',      label: 'AWS services live',  color: C.green  },
];

// ── Room heatmap ──
type RoomStatus = 'quiet' | 'movement' | 'alert';
const FLOORS: { floor: string; rooms: { id: string; status: RoomStatus }[] }[] = [
  { floor: '3F', rooms: [
    {id:'301',status:'quiet'},{id:'302',status:'quiet'},{id:'303',status:'movement'},{id:'304',status:'quiet'},{id:'305',status:'alert'},
    {id:'306',status:'quiet'},{id:'307',status:'quiet'},{id:'308',status:'movement'},{id:'309',status:'quiet'},{id:'310',status:'quiet'},
    {id:'311',status:'movement'},{id:'312',status:'quiet'},{id:'313',status:'quiet'},{id:'314',status:'quiet'},
  ]},
  { floor: '2F', rooms: [
    {id:'201',status:'quiet'},{id:'202',status:'movement'},{id:'203',status:'quiet'},{id:'204',status:'quiet'},{id:'205',status:'quiet'},
    {id:'206',status:'movement'},{id:'207',status:'alert'},{id:'208',status:'quiet'},{id:'209',status:'movement'},{id:'210',status:'quiet'},
    {id:'211',status:'quiet'},{id:'212',status:'alert'},{id:'213',status:'quiet'},{id:'214',status:'movement'},
  ]},
  { floor: '1F', rooms: [
    {id:'101',status:'quiet'},{id:'102',status:'quiet'},{id:'103',status:'quiet'},{id:'104',status:'movement'},{id:'105',status:'quiet'},
    {id:'106',status:'quiet'},{id:'107',status:'movement'},{id:'108',status:'quiet'},{id:'109',status:'alert'},{id:'110',status:'quiet'},
    {id:'111',status:'movement'},{id:'112',status:'quiet'},{id:'113',status:'quiet'},{id:'114',status:'quiet'},
  ]},
];
const STATUS_COLOR = { quiet: C.green, movement: C.amber, alert: C.red };
const STATUS_DIM   = { quiet: 'rgba(61,204,145,0.12)', movement: 'rgba(255,201,64,0.14)', alert: 'rgba(255,107,107,0.16)' };

// ── Alert timeline ──
const TIMELINE = [0,0,1,0,2,1,0,3,8,12,7,5,9,11,6,8,10,14,9,7,5,3,2,1];

// ── Pipeline ──
const SERVICES = [
  { name: 'Kinesis Ingest',    path: 'Hot path',      latency: 12,   uptime: 99.97 },
  { name: 'Lambda Classifier', path: 'Hot path',      latency: 38,   uptime: 99.91 },
  { name: 'DynamoDB Alerts',   path: 'Hot path',      latency: 4,    uptime: 100   },
  { name: 'S3 Parquet',        path: 'Cold path',     latency: 210,  uptime: 99.99 },
  { name: 'Bedrock / Ella',    path: 'AI narrative',  latency: 1840, uptime: 99.82 },
  { name: 'API Gateway',       path: 'Nurse API',     latency: 22,   uptime: 99.95 },
  { name: 'CloudWatch',        path: 'Observability', latency: null, uptime: 100   },
];

// ── Compliance ──
const RINGS = [
  { label: '21 CFR 820',        sub: 'Gap Analysis',   pct: 62, color: C.accent },
  { label: 'SaMD Verification', sub: 'IEC 62304',      pct: 48, color: C.green  },
  { label: 'Risk Items Closed', sub: 'ISO 14971',      pct: 71, color: C.amber  },
];

// ── Sprint ──
const ENG_SPRINT = {
  num: 18, dates: 'Apr 21 – May 2', totalPts: 96, donePts: 34,
  columns: [
    { label: 'To Do',       count: 5, pts: 29, color: '#5C5E62' },
    { label: 'In Progress', count: 4, pts: 22, color: '#FFC940' },
    { label: 'In Review',   count: 3, pts: 11, color: '#2D72D2' },
    { label: 'Done',        count: 4, pts: 34, color: '#3DCC91' },
  ],
  team: [
    { discipline: 'Electrical', color: '#FB923C', members: ['G','H','P'], memberColors: ['#00B4D8','#F472B6','#FB923C'] },
    { discipline: 'Software',   color: '#818CF8', members: ['I','A'],     memberColors: ['#818CF8','#34D399'] },
    { discipline: 'Cloud Sec',  color: '#22D3EE', members: ['Ab'],        memberColors: ['#22D3EE'] },
  ],
};

// ── Activity rhythm ──
const RHYTHM: number[][] = [
  [0,0,1,0,0,0,0,2,5,8,6,4,7,9,5,6,8,11,7,5,3,1,0,0],
  [0,0,0,1,0,0,0,3,6,9,7,5,8,10,6,7,9,12,8,4,2,1,0,0],
  [0,1,0,0,0,0,1,2,5,7,5,4,6,8,4,5,7,10,6,4,2,1,0,0],
  [0,0,0,0,1,0,0,3,7,10,8,6,9,11,7,8,10,14,9,5,3,1,0,0],
  [0,0,1,0,0,0,0,2,6,8,7,5,7,9,5,7,8,12,7,4,3,2,1,0],
  [0,0,0,1,0,0,1,1,3,5,4,3,5,6,4,4,5,7,5,3,2,1,0,0],
  [0,0,0,0,0,0,0,1,2,4,3,2,4,5,3,3,4,6,4,2,1,0,0,0],
];
const RHYTHM_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const RHYTHM_MAX  = Math.max(...RHYTHM.flat());

// ── Components ────────────────────────────────────────────────────────────────

function Heatmap() {
  const [tip, setTip] = useState<{ id: string; status: string } | null>(null);
  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Floor Activity · 42 Rooms</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {FLOORS.map(f => (
          <div key={f.floor} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, width:20, flexShrink:0 }}>{f.floor}</span>
            <div style={{ display:'flex', gap:4, flex:1 }}>
              {f.rooms.map(r => (
                <div key={r.id}
                  onMouseEnter={() => setTip(r)}
                  onMouseLeave={() => setTip(null)}
                  style={{ flex:1, height:44, borderRadius:3, background:STATUS_DIM[r.status], border:`1px solid ${STATUS_COLOR[r.status]}33`, cursor:'default', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:8, color:STATUS_COLOR[r.status], opacity:0.85 }}>{r.id}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:20, marginTop:16, alignItems:'center' }}>
        {(['quiet','movement','alert'] as const).map(s => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:STATUS_COLOR[s], display:'inline-block' }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, textTransform:'capitalize' }}>{s}</span>
          </div>
        ))}
        {tip && <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text2, marginLeft:'auto' }}>Room {tip.id} · {tip.status}</span>}
      </div>
    </div>
  );
}

function AlertTimeline() {
  const max = Math.max(...TIMELINE);
  const now = new Date().getHours();
  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Alert Volume · 24h</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:100 }}>
        {TIMELINE.map((v, h) => (
          <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{
              width:'100%', borderRadius:'2px 2px 0 0',
              background: h === now ? C.accent : 'rgba(45,114,210,0.3)',
              height: max > 0 ? `${Math.round((v/max)*90)+4}px` : '4px',
              border: h === now ? `1px solid ${C.accent}` : 'none',
            }}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
        {[0,6,12,18,23].map(h => (
          <span key={h} style={{ fontFamily:'var(--mono)', fontSize:8.5, color:C.text3 }}>{String(h).padStart(2,'0')}:00</span>
        ))}
      </div>
      <div style={{ display:'flex', gap:20, marginTop:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:1, background:C.accent, display:'inline-block' }}/>
          <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3 }}>Current hour</span>
        </div>
        <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text2, marginLeft:'auto' }}>
          {TIMELINE.reduce((a,b)=>a+b,0)} total alerts today
        </span>
      </div>
    </div>
  );
}

function ActivityRhythm() {
  const [tip, setTip] = useState<{ day: string; hour: number; val: number } | null>(null);
  const nowH = new Date().getHours();
  const nowD = new Date().getDay();
  const todayIdx = nowD === 0 ? 6 : nowD - 1;
  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Alert Rhythm · 7 Days × 24 Hours</div>
      <div style={{ display:'flex', gap:3, paddingLeft:32, marginBottom:6 }}>
        {Array.from({ length:24 }, (_,h) => (
          <div key={h} style={{ flex:1, textAlign:'center' }}>
            {h % 6 === 0 && <span style={{ fontFamily:'var(--mono)', fontSize:7.5, color:C.text3 }}>{String(h).padStart(2,'0')}</span>}
          </div>
        ))}
      </div>
      {RHYTHM.map((row, d) => (
        <div key={d} style={{ display:'flex', alignItems:'center', gap:3, marginBottom:3 }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color: d === todayIdx ? C.text : C.text3, width:28, flexShrink:0, textAlign:'right' }}>{RHYTHM_DAYS[d]}</span>
          {row.map((val, h) => {
            const intensity = val / RHYTHM_MAX;
            const isNow = d === todayIdx && h === nowH;
            return (
              <div key={h}
                onMouseEnter={() => setTip({ day:RHYTHM_DAYS[d], hour:h, val })}
                onMouseLeave={() => setTip(null)}
                style={{ flex:1, height:18, borderRadius:2, cursor:'default',
                  background: isNow ? C.accent : val === 0 ? 'rgba(255,255,255,0.04)' : `rgba(45,114,210,${0.12+intensity*0.75})`,
                  border: isNow ? `1px solid ${C.accent}` : '1px solid transparent',
                }}/>
            );
          })}
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:7, height:7, borderRadius:1, background:C.accent, display:'inline-block' }}/>
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>Current hour</span>
        </div>
        {tip
          ? <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text2 }}>{tip.day} {String(tip.hour).padStart(2,'0')}:00 · {tip.val} alerts</span>
          : <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>Hover to inspect</span>}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>Low</span>
          {[0.1,0.3,0.55,0.75,1].map(o => (
            <span key={o} style={{ width:10, height:10, borderRadius:1, background:`rgba(45,114,210,${o})`, display:'inline-block' }}/>
          ))}
          <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>High</span>
        </div>
      </div>
    </div>
  );
}

function Pipeline() {
  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>System Pipeline · AWS</div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {SERVICES.map((s, i) => {
          const lc = typeof s.latency === 'number'
            ? s.latency < 50 ? C.green : s.latency < 500 ? C.amber : C.red
            : C.text3;
          return (
            <div key={s.name} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'center', gap:16, padding:'13px 0', borderBottom: i < SERVICES.length-1 ? `1px solid ${C.border}` : 'none' }}>
              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text, marginBottom:2 }}>{s.name}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3 }}>{s.path}</div>
              </div>
              <div style={{ width:130 }}>
                {typeof s.latency === 'number' ? (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>p50</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9, color:lc }}>{s.latency}ms</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                      <div style={{ height:'100%', width:`${Math.min((s.latency/2000)*100,100)}%`, background:lc, borderRadius:2 }}/>
                    </div>
                  </>
                ) : (
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>passive</span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: s.uptime===100 ? C.green : s.uptime>99.9 ? C.amber : C.red, display:'inline-block', boxShadow: s.uptime===100 ? `0 0 5px ${C.green}` : 'none' }}/>
                <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text2 }}>{s.uptime}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutRing({ pct, color, size=96 }: { pct:number; color:string; size?:number }) {
  const r = (size/2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (pct/100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"/>
    </svg>
  );
}

function ComplianceRings() {
  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:28 }}>Regulatory Compliance</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
        {RINGS.map((r, i) => (
          <div key={r.label} style={{ display:'flex', alignItems:'center', gap:24, padding:'0 28px', borderRight: i<2 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ position:'relative', width:96, height:96, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <DonutRing pct={r.pct} color={r.color}/>
              <span style={{ position:'absolute', fontFamily:'var(--mono)', fontSize:18, fontWeight:500, color:C.text, letterSpacing:'-0.03em' }}>{r.pct}%</span>
            </div>
            <div>
              <div style={{ fontFamily:'var(--serif)', fontSize:15, color:C.text, marginBottom:5 }}>{r.label}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, textTransform:'uppercase', letterSpacing:'0.12em' }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SprintOverview() {
  const pct = Math.round((ENG_SPRINT.donePts / ENG_SPRINT.totalPts) * 100);
  return (
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:C.green, boxShadow:`0 0 6px ${C.green}` }}/>
        Engineering · Sprint {ENG_SPRINT.num}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3, whiteSpace:'nowrap' }}>{ENG_SPRINT.dates}</div>
        <div style={{ flex:1, height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${C.accent},${C.green})`, borderRadius:2 }}/>
        </div>
        <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.text, letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>
          {pct}% <span style={{ fontSize:10, color:C.text3, marginLeft:6 }}>{ENG_SPRINT.donePts} / {ENG_SPRINT.totalPts} pts</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        {ENG_SPRINT.columns.map(col => (
          <div key={col.label} style={{ border:`1px solid ${col.color}22`, borderRadius:3, padding:'20px 20px 16px', background:`${col.color}08` }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:32, fontWeight:500, color:col.color, letterSpacing:'-0.04em', lineHeight:1, marginBottom:10 }}>{col.count}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:C.text3, marginBottom:4 }}>{col.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:col.color, opacity:0.7 }}>{col.pts} pts</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
        {ENG_SPRINT.team.map(d => (
          <div key={d.discipline} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:1, background:d.color, flexShrink:0 }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:d.color, textTransform:'uppercase', letterSpacing:'0.1em' }}>{d.discipline}</span>
            <div style={{ display:'flex', gap:4 }}>
              {d.members.map((m, i) => (
                <span key={m} style={{ width:22, height:22, borderRadius:'50%', background:d.memberColors[i]+'22', border:`1px solid ${d.memberColors[i]}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:d.memberColors[i] }}>{m}</span>
              ))}
            </div>
          </div>
        ))}
        <Link href="/engineering" style={{ marginLeft:'auto', textDecoration:'none', fontFamily:'var(--mono)', fontSize:9.5, color:C.accent, textTransform:'uppercase', letterSpacing:'0.14em', display:'flex', alignItems:'center', gap:5 }}>
          View board ↗
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ControlCenter() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <style>{`
        .cc-card-arrow { transition: transform 0.2s ease; }
        .cc-card:hover .cc-card-arrow { transform: translate(3px,-3px); }
        .cc-nav-link { transition: color 0.2s ease; }
        .cc-nav-link:hover { color: #EDEEF0 !important; }
      `}</style>

      <div style={{ background: C.bg, minHeight:'100vh', color:C.text, fontFamily:'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position:'sticky', top:0, zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 48px', height:60,
          borderBottom:`1px solid ${C.border}`,
          background:'rgba(12,13,15,0.92)',
          backdropFilter:'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration:'none', color:C.text }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:28 }}>
            {[['Engineering','/engineering'],['BOM','/bom'],['Gap','/gapanalysis'],['SaMD','/samd'],['Cloud','/cloud'],['Data','/datascience'],['Brand','/brand']].map(([label,href]) => (
              <Link key={href} href={href} className="cc-nav-link" style={{ textDecoration:'none', color:C.text2, fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/" style={{ textDecoration:'none' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:C.text3, padding:'5px 12px' }}>
              ← Back
            </span>
          </Link>
        </nav>

        {/* ── Header ── */}
        <div style={{
          padding:'64px 48px 56px', borderBottom:`1px solid ${C.border}`,
          position:'relative', overflow:'hidden',
          backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
          backgroundSize:'64px 64px',
        }}>
          <div style={{ position:'absolute', top:'10%', right:'8%', width:520, height:340, pointerEvents:'none',
            background:'radial-gradient(ellipse at center,rgba(45,114,210,0.07) 0%,transparent 70%)' }}/>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:C.accent, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}` }}/>
            Ambient Intelligence · Live
          </div>
          <h1 style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:'clamp(36px,5vw,64px)', letterSpacing:'-0.03em', margin:'0 0 40px', color:C.text, lineHeight:1.05 }}>
            Control Center
          </h1>
          {/* Stats strip */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:0 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ paddingRight:40, borderRight:`1px solid ${C.border}`, paddingLeft: i>0 ? 40 : 0, paddingBottom:8 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:30, fontWeight:500, color:s.color, letterSpacing:'-0.03em', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.14em', color:C.text3, marginTop:7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Engineering ── */}
        <section style={{ borderBottom:`1px solid ${C.border}`, padding:'64px 48px', background:C.surface }}>
          {/* Header row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:44 }}>
            <div>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'#2D72D2', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}` }}/>
                Engineering · Sprint {ENG_SPRINT.num}
              </div>
              <h2 style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:'clamp(26px,3vw,42px)', letterSpacing:'-0.03em', margin:0, color:C.text, lineHeight:1.1 }}>
                Building the platform,<br/>
                <em style={{ fontStyle:'italic', color:'#2D72D2' }}>issue by issue.</em>
              </h2>
            </div>
            <Link href="/engineering" style={{ textDecoration:'none', flexShrink:0, marginTop:4 }}>
              <button style={{ display:'flex', alignItems:'center', gap:8, background:'transparent', color:C.text, border:`1px solid rgba(255,255,255,0.18)`, borderRadius:2, padding:'13px 28px', fontSize:13, fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit' }}>
                View Engineering Board <span style={{ fontSize:16, lineHeight:1 }}>↗</span>
              </button>
            </Link>
          </div>

          {/* Sprint progress bar */}
          <div style={{ marginBottom:40, padding:'24px 28px', border:`1px solid ${C.border}`, borderRadius:2, background:C.bg, display:'flex', alignItems:'center', gap:28 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3, whiteSpace:'nowrap' }}>{ENG_SPRINT.dates}</div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round((ENG_SPRINT.donePts/ENG_SPRINT.totalPts)*100)}%`, background:`linear-gradient(90deg,${C.accent},${C.green})`, borderRadius:2 }}/>
              </div>
              <div style={{ display:'flex', gap:16 }}>
                {ENG_SPRINT.columns.map(col => (
                  <div key={col.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:col.color, flexShrink:0 }}/>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3, textTransform:'uppercase', letterSpacing:'0.1em' }}>{col.label}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9, color:col.color, fontWeight:600 }}>{col.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.text, whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
              {Math.round((ENG_SPRINT.donePts/ENG_SPRINT.totalPts)*100)}%
              <span style={{ fontSize:10, color:C.text3, marginLeft:8 }}>{ENG_SPRINT.donePts} / {ENG_SPRINT.totalPts} pts</span>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3, whiteSpace:'nowrap' }}>
              {ENG_SPRINT.columns.find(c=>c.label==='Done')?.count} of {ENG_SPRINT.columns.reduce((a,c)=>a+c.count,0)} issues done
            </div>
          </div>

          {/* 3-panel grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', border:`1px solid ${C.border}` }}>

            {/* Team */}
            <div style={{ padding:'32px', borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase', color:C.text3, marginBottom:24 }}>Team</div>
              <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
                {ENG_SPRINT.team.map(d => (
                  <div key={d.discipline}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                      <span style={{ width:5, height:5, borderRadius:1, background:d.color, flexShrink:0 }}/>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.14em', color:d.color, fontWeight:600 }}>{d.discipline}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, paddingLeft:12 }}>
                      {d.members.map((m, i) => (
                        <div key={m} style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:d.memberColors[i]+'22', border:`1px solid ${d.memberColors[i]}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:d.memberColors[i] }}>{m}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Board columns */}
            <div style={{ padding:'32px', borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase', color:C.text3, marginBottom:24 }}>Sprint Board</div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {ENG_SPRINT.columns.map((col, i) => (
                  <div key={col.label} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius:2 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:col.color, flexShrink:0 }}/>
                      <span style={{ fontFamily:'var(--mono)', fontSize:10, color: col.label==='In Progress' ? col.color : C.text2, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight: col.label==='In Progress' ? 600 : 400 }}>{col.label}</span>
                    </span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:500, color: col.label==='In Progress' ? col.color : C.text, letterSpacing:'-0.03em', lineHeight:1 }}>{col.count}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, whiteSpace:'nowrap' }}>{col.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical issue */}
            <div style={{ padding:'32px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.2em', textTransform:'uppercase', color:C.text3, marginBottom:24 }}>Active Critical</div>
              <div style={{ border:'1px solid rgba(255,107,107,0.25)', borderRadius:3, padding:'22px', background:'rgba(255,107,107,0.04)', display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:C.red, boxShadow:`0 0 8px ${C.red}`, flexShrink:0 }}/>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.red, textTransform:'uppercase', letterSpacing:'0.16em', fontWeight:600 }}>Critical</span>
                  <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:'rgba(255,107,107,0.55)' }}>ENG-144</span>
                </div>
                <p style={{ margin:0, fontFamily:'var(--serif)', fontSize:15, fontWeight:300, lineHeight:1.5, color:C.text, letterSpacing:'-0.01em' }}>
                  Fall alert fires twice when sensor resets mid-event
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'#22D3EE22', border:'1px solid #22D3EE44', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:8.5, fontWeight:700, color:'#22D3EE' }}>A</div>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text2 }}>Abdul</span>
                  <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
                    {['alerts','sensors'].map(l => (
                      <span key={l} style={{ fontFamily:'var(--mono)', fontSize:8.5, color:'rgba(255,107,107,0.6)', background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.15)', padding:'2px 7px', borderRadius:2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</span>
                    ))}
                  </div>
                </div>
                <Link href="/engineering" style={{ textDecoration:'none' }}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'rgba(255,107,107,0.7)', textTransform:'uppercase', letterSpacing:'0.14em' }}
                    onMouseEnter={e=>(e.currentTarget.style.color=C.red)}
                    onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,107,107,0.7)')}>
                    Open issue ↗
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div style={{ padding:'56px 48px 96px', display:'flex', flexDirection:'column', gap:64 }}>

          {/* ── Platform Intelligence ── */}
          <div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', paddingBottom:20, borderBottom:`1px solid ${C.border}`, marginBottom:1 }}>
              <span style={{ fontFamily:'var(--serif)', fontSize:'clamp(16px,1.5vw,22px)', fontWeight:300, letterSpacing:'-0.01em', color:C.text }}>Platform Intelligence</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:C.text3 }}>Live · Simulated</span>
            </div>

            {/* Row 1: heatmap full width */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px 32px', marginBottom:1 }}>
              <Heatmap/>
            </div>

            {/* Row 2: alert timeline | activity rhythm */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, marginBottom:1 }}>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px 32px' }}>
                <AlertTimeline/>
              </div>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px 32px' }}>
                <ActivityRhythm/>
              </div>
            </div>

            {/* Row 3: pipeline | compliance */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, marginBottom:1 }}>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px 32px' }}>
                <Pipeline/>
              </div>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px 32px' }}>
                <ComplianceRings/>
              </div>
            </div>

            {/* Row 4: sprint overview full width */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'36px 36px 32px' }}>
              <SprintOverview/>
            </div>
          </div>

          {/* ── Ambient Intelligence Control Center ── */}
          <div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', paddingBottom:20, borderBottom:`1px solid ${C.border}`, marginBottom:32 }}>
              <span style={{ fontFamily:'var(--serif)', fontSize:'clamp(16px,1.5vw,22px)', fontWeight:300, letterSpacing:'-0.01em', color:C.text }}>Ambient Intelligence Control Center</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:C.text3 }}>{TOTAL_MODULES} modules</span>
            </div>

            {MODULE_GROUPS.map(group => (
              <div key={group.key} style={{ marginBottom:28 }}>
                {/* Group header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0 14px', borderTop:`1px solid ${C.border}` }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:group.accent, background:group.accentDim, padding:'3px 9px', borderRadius:2 }}>
                    {group.key}
                  </span>
                  <span style={{ fontFamily:'var(--serif)', fontSize:15, fontWeight:300, color:C.text2, letterSpacing:'-0.01em' }}>
                    {group.label}
                  </span>
                  <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:C.text3 }}>
                    {group.modules.length} modules
                  </span>
                </div>

                {/* Card grid */}
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${group.cols},1fr)`, gap:1, border:`1px solid ${C.border}` }}>
                  {group.modules.map((mod, i) => (
                    <Link key={mod.href} href={mod.href} className="cc-card" style={{ textDecoration:'none', color:'inherit' }}
                      onMouseEnter={() => setHovered(mod.href)}
                      onMouseLeave={() => setHovered(null)}>
                      <div style={{
                        padding:'26px 24px',
                        background: hovered === mod.href ? C.surface2 : C.surface,
                        borderRight: (i % group.cols !== group.cols-1) ? `1px solid ${C.border}` : 'none',
                        display:'flex', flexDirection:'column', gap:12,
                        transition:'background 0.2s ease', minHeight:180,
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:group.accent, background:group.accentDim, padding:'3px 8px', borderRadius:2 }}>{mod.tag}</span>
                          <span className="cc-card-arrow" style={{ color:C.text3, fontSize:14 }}>↗</span>
                        </div>
                        <div>
                          <div style={{ fontFamily:'var(--serif)', fontSize:18, fontWeight:400, letterSpacing:'-0.01em', color:C.text, marginBottom:8 }}>{mod.label}</div>
                          <div style={{ fontSize:12, lineHeight:1.65, color:C.text2, fontWeight:300 }}>{mod.description}</div>
                        </div>
                        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:group.accent }}/>
                          <span style={{ fontFamily:'var(--mono)', fontSize:9.5, letterSpacing:'0.1em', color:C.text3 }}>{mod.meta}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── Footer ── */}
        <footer style={{ padding:'24px 48px', borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:C.text3 }}>Ambient Intelligence · Not for clinical use</span>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.1em', color:C.text3 }}>ambientprototype.vercel.app</span>
        </footer>

      </div>
    </>
  );
}
