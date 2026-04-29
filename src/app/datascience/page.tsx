"use client";
import Link from "next/link";
import { useEffect } from "react";
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart,
  ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  Treemap,
  FunnelChart, Funnel, LabelList,
  Sankey,
  SunburstChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:       '#1C2127',
  s1:       '#252A31',
  s2:       '#2F343C',
  s3:       '#383E47',
  line:     'rgba(255,255,255,0.07)',
  lineS:    'rgba(255,255,255,0.14)',
  text:     '#F6F7F8',
  text2:    'rgba(246,247,248,0.65)',
  text3:    'rgba(246,247,248,0.42)',
  text4:    'rgba(246,247,248,0.26)',
  accent:   '#2D72D2',
  sage:     '#3DCC91',
  amber:    '#FFC940',
  red:      '#FF6B6B',
  purple:   '#7C6EAD',
  coral:    '#E06C75',
};

// ── Dataset: 24-hour activity levels (all rooms averaged) ──────
const HOURLY_ACTIVITY = [
  { h:'00',quiet:82,movement:14,fall:4 },
  { h:'01',quiet:88,movement:10,fall:2 },
  { h:'02',quiet:91,movement:8, fall:1 },
  { h:'03',quiet:93,movement:6, fall:1 },
  { h:'04',quiet:89,movement:9, fall:2 },
  { h:'05',quiet:78,movement:20,fall:2 },
  { h:'06',quiet:61,movement:36,fall:3 },
  { h:'07',quiet:44,movement:51,fall:5 },
  { h:'08',quiet:38,movement:57,fall:5 },
  { h:'09',quiet:42,movement:52,fall:6 },
  { h:'10',quiet:45,movement:49,fall:6 },
  { h:'11',quiet:48,movement:46,fall:6 },
  { h:'12',quiet:52,movement:43,fall:5 },
  { h:'13',quiet:55,movement:40,fall:5 },
  { h:'14',quiet:50,movement:45,fall:5 },
  { h:'15',quiet:46,movement:48,fall:6 },
  { h:'16',quiet:49,movement:45,fall:6 },
  { h:'17',quiet:53,movement:42,fall:5 },
  { h:'18',quiet:58,movement:37,fall:5 },
  { h:'19',quiet:65,movement:32,fall:3 },
  { h:'20',quiet:72,movement:24,fall:4 },
  { h:'21',quiet:78,movement:19,fall:3 },
  { h:'22',quiet:83,movement:14,fall:3 },
  { h:'23',quiet:86,movement:12,fall:2 },
];

// ── Dataset: 7-day sensor event totals ────────────────────────
const WEEKLY_EVENTS = [
  { day:'Mon', detections:142, alerts:8,  falls:3, response:4.2 },
  { day:'Tue', detections:158, alerts:11, falls:4, response:3.8 },
  { day:'Wed', detections:134, alerts:7,  falls:2, response:5.1 },
  { day:'Thu', detections:167, alerts:13, falls:5, response:3.4 },
  { day:'Fri', detections:149, alerts:9,  falls:3, response:4.6 },
  { day:'Sat', detections:121, alerts:6,  falls:2, response:5.8 },
  { day:'Sun', detections:118, alerts:5,  falls:1, response:6.2 },
];

// ── Dataset: per-room fall incidents this week ─────────────────
const ROOM_INCIDENTS = [
  { room:'MOH 301', falls:3, movement:47, quiet:82 },
  { room:'MOH 302', falls:1, movement:51, quiet:80 },
  { room:'MOH 303', falls:0, movement:38, quiet:94 },
  { room:'MOH 304', falls:2, movement:44, quiet:86 },
  { room:'MOH 305', falls:2, movement:29, quiet:101 },
  { room:'MOH 306', falls:0, movement:52, quiet:80 },
  { room:'MOH 307', falls:1, movement:48, quiet:83 },
  { room:'MOH 308', falls:3, movement:22, quiet:107 },
  { room:'MOH 309', falls:0, movement:43, quiet:89 },
  { room:'MOH 310', falls:1, movement:45, quiet:86 },
];

// ── Dataset: current room status distribution ──────────────────
const STATUS_PIE = [
  { name:'Quiet',    value:4, color:C.sage },
  { name:'Movement', value:4, color:C.amber },
  { name:'Fall Alert', value:3, color:C.red },  // includes resolved
];

// ── Dataset: compliance completion ────────────────────────────
const COMPLIANCE_RADIAL = [
  { name:'FDA 820',  fill:C.accent,  value:62,  total:100 },
  { name:'SaMD',     fill:C.purple,  value:48,  total:100 },
  { name:'Risk Mgmt',fill:C.sage,    value:71,  total:100 },
  { name:'IEC 62304',fill:C.amber,   value:55,  total:100 },
];

// ── Dataset: resident mobility radar ──────────────────────────
const MOBILITY_RADAR = [
  { metric:'Walking',   Evelyn:68, Harold:82, Dorothy:55, Margaret:44, Robert:31 },
  { metric:'Stability', Evelyn:52, Harold:71, Dorothy:78, Margaret:60, Robert:42 },
  { metric:'Range',     Evelyn:45, Harold:65, Dorothy:60, Margaret:38, Robert:28 },
  { metric:'Night',     Evelyn:30, Harold:58, Dorothy:72, Margaret:50, Robert:35 },
  { metric:'Response',  Evelyn:88, Harold:79, Dorothy:91, Margaret:83, Robert:76 },
  { metric:'Duration',  Evelyn:61, Harold:73, Dorothy:66, Margaret:55, Robert:40 },
];

// ── Dataset: scatter – walking distance vs fall risk ──────────
const SCATTER_DATA = [
  { walk:68, risk:12, name:'Evelyn R.',   room:'301' },
  { walk:82, risk: 6, name:'Harold N.',   room:'302' },
  { walk:55, risk: 8, name:'Dorothy O.',  room:'303' },
  { walk:44, risk:18, name:'Margaret K.', room:'304' },
  { walk:31, risk:28, name:'Robert C.',   room:'305' },
  { walk:52, risk: 7, name:'Frances W.',  room:'306' },
  { walk:47, risk:14, name:'James M.',    room:'307' },
  { walk:29, risk:34, name:'Alice T.',    room:'308' },
  { walk:61, risk: 9, name:'George M.',   room:'309' },
  { walk:44, risk:16, name:'Helen P.',    room:'310' },
];

// ── Dataset: activity heatmap (7 days × 8 time blocks) ────────
const HEATMAP_HOURS = ['12a','3a','6a','9a','12p','3p','6p','9p'];
const HEATMAP_DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HEATMAP_RAW = [
  [2,1,2,18,22,20,18,12],
  [1,2,3,21,25,23,20,14],
  [2,1,2,17,20,19,17,11],
  [3,2,4,24,28,25,22,16],
  [2,1,3,19,23,21,18,13],
  [1,1,2,14,18,16,14, 9],
  [1,1,2,13,17,15,13, 8],
];

// ── Dataset: treemap – time-in-state by room ──────────────────
const TREEMAP_DATA = [
  { name:'MOH 301 – Evelyn',  size:47,  color:C.red    },
  { name:'MOH 302 – Harold',  size:82,  color:C.amber  },
  { name:'MOH 303 – Dorothy', size:94,  color:C.sage   },
  { name:'MOH 304 – Margaret',size:44,  color:C.amber  },
  { name:'MOH 305 – Robert',  size:31,  color:C.red    },
  { name:'MOH 306 – Frances', size:88,  color:C.sage   },
  { name:'MOH 307 – James',   size:73,  color:C.amber  },
  { name:'MOH 308 – Alice',   size:29,  color:C.red    },
  { name:'MOH 309 – George',  size:85,  color:C.sage   },
  { name:'MOH 310 – Helen',   size:71,  color:C.amber  },
];

// ── Shared tooltip style ───────────────────────────────────────
const TT_STYLE = {
  backgroundColor: '#1C2127',
  border: `1px solid rgba(255,255,255,0.14)`,
  borderRadius: 8,
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: '#F6F7F8',
  padding: '10px 14px',
};

// ── Chart card wrapper ─────────────────────────────────────────
function ChartCard({ title, sub, badge, children, full }: {
  title: string; sub: string; badge?: string; children: React.ReactNode; full?: boolean;
}) {
  return (
    <div style={{
      background: C.s1,
      border: `1px solid ${C.line}`,
      borderRadius: 14,
      padding: '28px 28px 24px',
      gridColumn: full ? '1 / -1' : undefined,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:22, letterSpacing:'-0.01em', marginBottom:4 }}>{title}</div>
          <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3 }}>{sub}</div>
        </div>
        {badge && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:999, background:`rgba(45,114,210,0.14)`, border:`1px solid rgba(45,114,210,0.35)`, color:C.accent, fontFamily:'var(--mono)', fontSize:11 }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Heatmap cell ──────────────────────────────────────────────
function HeatCell({ value }: { value: number }) {
  const norm = Math.min(1, value / 28);
  const bg = norm < 0.15 ? C.s3
    : norm < 0.35 ? `rgba(45,114,210,0.25)`
    : norm < 0.55 ? `rgba(45,114,210,0.50)`
    : norm < 0.75 ? `rgba(45,114,210,0.75)`
    : C.accent;
  return (
    <div title={`${value} events`} style={{
      width:'100%', aspectRatio:'1', borderRadius:4, background:bg,
      border:`1px solid rgba(255,255,255,0.04)`, cursor:'default',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--mono)', fontSize:9, color: norm > 0.5 ? '#fff' : C.text4,
    }}>{value > 0 ? value : ''}</div>
  );
}

// ── Dataset: funnel – alert resolution pipeline ───────────────
const FUNNEL_DATA = [
  { name:'Sensor Detections', value:141, fill:C.accent  },
  { name:'Events Classified',  value:112, fill:C.purple  },
  { name:'Alerts Triggered',   value: 38, fill:C.amber   },
  { name:'Nurse Notified',     value: 35, fill:C.coral   },
  { name:'Resolved',           value: 31, fill:C.sage    },
];

// ── Dataset: sankey – data pipeline flow ─────────────────────
const SANKEY_DATA = {
  nodes: [
    { name:'Radar A' },   // 0
    { name:'Radar B' },   // 1
    { name:'Radar C' },   // 2
    { name:'Kinesis' },   // 3
    { name:'Lambda' },    // 4
    { name:'DynamoDB' },  // 5
    { name:'Bedrock AI' },// 6
    { name:'Dashboard' }, // 7
    { name:'Alerts' },    // 8
  ],
  links: [
    { source:0, target:3, value:48 },
    { source:1, target:3, value:51 },
    { source:2, target:3, value:43 },
    { source:3, target:4, value:142 },
    { source:4, target:5, value:110 },
    { source:4, target:8, value:32  },
    { source:5, target:6, value:110 },
    { source:6, target:7, value:110 },
  ],
};

// ── Dataset: sunburst – activity hierarchy ────────────────────
const SUNBURST_DATA = {
  name:'MOH Floor',
  fill: C.s2,
  children: [
    {
      name:'High Risk', fill:C.red,
      children:[
        { name:'MOH 301', value:47, fill:'rgba(255,107,107,0.75)' },
        { name:'MOH 305', value:31, fill:'rgba(255,107,107,0.60)' },
        { name:'MOH 308', value:29, fill:'rgba(255,107,107,0.50)' },
      ],
    },
    {
      name:'Active', fill:C.amber,
      children:[
        { name:'MOH 302', value:82, fill:'rgba(255,201,64,0.75)' },
        { name:'MOH 304', value:44, fill:'rgba(255,201,64,0.60)' },
        { name:'MOH 307', value:73, fill:'rgba(255,201,64,0.50)' },
        { name:'MOH 310', value:71, fill:'rgba(255,201,64,0.45)' },
      ],
    },
    {
      name:'Stable', fill:C.sage,
      children:[
        { name:'MOH 303', value:94, fill:'rgba(61,204,145,0.75)' },
        { name:'MOH 306', value:88, fill:'rgba(61,204,145,0.60)' },
        { name:'MOH 309', value:85, fill:'rgba(61,204,145,0.50)' },
      ],
    },
  ],
};

// ── Custom treemap cell ────────────────────────────────────────
function TreemapCell(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; size?: number; color?: string;
}) {
  const { x=0, y=0, width=0, height=0, name='', size=0, color=C.accent } = props;
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={color} fillOpacity={0.18} stroke={color} strokeOpacity={0.45} strokeWidth={1}/>
      {height > 36 && (
        <>
          <text x={x+10} y={y+18} fontFamily="var(--mono)" fontSize={9} fill={color} opacity={0.9} textAnchor="start">{name.split('–')[0].trim()}</text>
          {height > 52 && <text x={x+10} y={y+32} fontFamily="var(--mono)" fontSize={10} fill="rgba(246,247,248,0.55)" textAnchor="start">{size}m walk</text>}
        </>
      )}
    </g>
  );
}

export default function DataSciencePage() {
  useEffect(() => {
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ''; };
  }, []);

  return (
    <div className="app" style={{ color:C.text }}>

      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/home" style={{ textDecoration:'none', color:'inherit' }}>
          <div className="brand">
            <div className="brand-name">Ambient <em>Demo</em></div>
          </div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Platform</div>
          {([
            ['/dashboard/overview', 'Dashboard',       <path key="d" d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/>],
            ['/bom',               'BOM',              <><rect key="b1" x="3" y="2.5" width="10" height="11" rx="1"/><path key="b2" d="M5.5 6h5M5.5 8.5h5M5.5 11h3" strokeLinecap="round"/></>],
            ['/gapanalysis',       'Gap Analysis',     <><path key="g1" d="M2.5 12.5h11M5 12.5V9M8 12.5V5.5M11 12.5V8" strokeLinecap="round"/></>],
            ['/datascience',       'Data Science',     <><circle key="ds1" cx="5" cy="5" r="2.5"/><circle key="ds2" cx="11" cy="11" r="2.5"/><path key="ds3" d="M11 5.5a2.5 2.5 0 110 0z" strokeLinejoin="round"/><path key="ds4" d="M5 11a2.5 2.5 0 110 0z"/></>],
          ] as [string, string, React.ReactNode][]).map(([href, label, icon]) => {
            const active = href === '/datascience';
            return (
              <Link key={label} href={href} className={`nav-item${active ? ' active' : ''}`} style={{ textDecoration:'none', color:'inherit' }}>
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
                {label}
              </Link>
            );
          })}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Chart Types</div>
          {[
            'Line Chart','Area Chart','Bar Chart','Stacked Bar',
            'Composed','Scatter Plot','Radar Chart','Pie Chart',
            'Radial Bar','Treemap','Heatmap','Funnel Chart',
            'Sankey','Sunburst Chart',
          ].map(name => (
            <div key={name} className="nav-item" style={{ fontSize:12, color:C.text3 }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              {name}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"/>
          <span>recharts · vercel · v3</span>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar" style={{ marginBottom:32 }}>
          <div>
            <div className="crumb">Ambient Intelligence · Sensor Analytics</div>
            <h1 className="page-title">Data <em>Science</em></h1>
          </div>
          <div className="tool-group">
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3 }}>MOH 301–310 · Live data</span>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.sage, boxShadow:`0 0 5px ${C.sage}`, display:'inline-block' }}/>
          </div>
        </header>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:36 }}>
          {[
            { label:'Total Detections',  value:'7d avg 141', color:C.accent  },
            { label:'Fall Incidents',    value:'20 this week', color:C.red   },
            { label:'Avg Response',      value:'4.7 min',     color:C.amber  },
            { label:'Active Rooms',      value:'10 / 10',     color:C.sage   },
            { label:'Sensor Uptime',     value:'99.4%',       color:C.purple },
          ].map(s => (
            <div key={s.label} style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{s.label}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:600, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Grid of charts ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* 1 · Line Chart – 24h activity breakdown */}
          <ChartCard title="Line Chart" sub="24-hour activity distribution · all rooms" badge="Hourly" full>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={HOURLY_ACTIVITY} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                <XAxis dataKey="h" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={TT_STYLE} cursor={{ stroke:C.lineS }}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, paddingTop:12 }}/>
                <Line type="monotone" dataKey="quiet"    stroke={C.sage}   strokeWidth={1.8} dot={false} name="Quiet %"/>
                <Line type="monotone" dataKey="movement" stroke={C.amber}  strokeWidth={1.8} dot={false} name="Movement %"/>
                <Line type="monotone" dataKey="fall"     stroke={C.red}    strokeWidth={1.8} dot={false} name="Fall Alert %"/>
                <ReferenceLine x="07" stroke={C.text4} strokeDasharray="3 3" label={{ value:'Wake', fontFamily:'var(--mono)', fontSize:9, fill:C.text4 }}/>
                <ReferenceLine x="21" stroke={C.text4} strokeDasharray="3 3" label={{ value:'Sleep', fontFamily:'var(--mono)', fontSize:9, fill:C.text4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2 · Area Chart – weekly sensor events */}
          <ChartCard title="Area Chart" sub="7-day sensor detection events">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={WEEKLY_EVENTS} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="areaDetect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="areaAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.red} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.red} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                <XAxis dataKey="day" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={TT_STYLE}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, paddingTop:12 }}/>
                <Area type="monotone" dataKey="detections" stroke={C.accent} fill="url(#areaDetect)" strokeWidth={1.8} name="Detections"/>
                <Area type="monotone" dataKey="alerts"     stroke={C.red}    fill="url(#areaAlerts)" strokeWidth={1.8} name="Alerts"/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3 · Bar Chart – falls by room */}
          <ChartCard title="Bar Chart" sub="Fall incidents per room · this week">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ROOM_INCIDENTS} margin={{ top:4, right:8, left:-20, bottom:0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false}/>
                <XAxis dataKey="room" tick={{ fontFamily:'var(--mono)', fontSize:9, fill:C.text4 }} tickLine={false} axisLine={false} interval={0}/>
                <YAxis tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={TT_STYLE}/>
                <Bar dataKey="falls" name="Falls" radius={[4,4,0,0]}>
                  {ROOM_INCIDENTS.map((entry, i) => (
                    <Cell key={i} fill={entry.falls === 0 ? C.sage : entry.falls >= 3 ? C.red : C.amber}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4 · Stacked Bar – activity hours by room */}
          <ChartCard title="Stacked Bar" sub="Activity type breakdown by room (hours/week)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ROOM_INCIDENTS} margin={{ top:4, right:8, left:-20, bottom:0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false}/>
                <XAxis dataKey="room" tick={{ fontFamily:'var(--mono)', fontSize:9, fill:C.text4 }} tickLine={false} axisLine={false} interval={0}/>
                <YAxis tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={TT_STYLE}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, paddingTop:12 }}/>
                <Bar dataKey="quiet"    name="Quiet"    stackId="a" fill={C.sage}  radius={[0,0,0,0]}/>
                <Bar dataKey="movement" name="Movement" stackId="a" fill={C.amber} radius={[0,0,0,0]}/>
                <Bar dataKey="falls"    name="Falls"    stackId="a" fill={C.red}   radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 5 · Composed Chart – detections, falls, response time */}
          <ChartCard title="Composed Chart" sub="Detections + falls + response time overlay · 7 days">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={WEEKLY_EVENTS} margin={{ top:4, right:28, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                <XAxis dataKey="day" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <YAxis yAxisId="left"  tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <YAxis yAxisId="right" orientation="right" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false} domain={[0,10]}/>
                <Tooltip contentStyle={TT_STYLE}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, paddingTop:12 }}/>
                <Area yAxisId="left"  type="monotone" dataKey="detections" fill={`rgba(45,114,210,0.12)`} stroke={C.accent} strokeWidth={1.5} name="Detections"/>
                <Bar  yAxisId="left"  dataKey="falls" fill={C.red} fillOpacity={0.7} name="Falls" radius={[3,3,0,0]} barSize={12}/>
                <Line yAxisId="right" type="monotone" dataKey="response" stroke={C.amber} strokeWidth={2} dot={{ r:3, fill:C.amber }} name="Resp (min)"/>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 6 · Scatter Plot – walking vs fall risk */}
          <ChartCard title="Scatter Plot" sub="Daily walking distance (m) vs fall risk score">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line}/>
                <XAxis dataKey="walk" name="Walking (m)" type="number" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false} label={{ value:'Walk m', position:'insideBottom', offset:-4, fontFamily:'var(--mono)', fontSize:9, fill:C.text4 }}/>
                <YAxis dataKey="risk" name="Risk Score"  type="number" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text4 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={TT_STYLE} cursor={{ strokeDasharray:'3 3' }}
                  formatter={(val, name) => [val, name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                />
                <Scatter name="Residents" data={SCATTER_DATA}>
                  {SCATTER_DATA.map((d, i) => (
                    <Cell key={i} fill={d.risk > 25 ? C.red : d.risk > 15 ? C.amber : C.sage} fillOpacity={0.85}/>
                  ))}
                </Scatter>
                <ReferenceLine y={20} stroke={C.red} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value:'High risk', fontFamily:'var(--mono)', fontSize:9, fill:C.red, position:'right' }}/>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 7 · Radar Chart – resident mobility profiles */}
          <ChartCard title="Radar Chart" sub="Resident mobility profile across 6 dimensions">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={MOBILITY_RADAR} margin={{ top:12, right:32, bottom:12, left:32 }}>
                <PolarGrid stroke={C.line}/>
                <PolarAngleAxis dataKey="metric" tick={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text3 }}/>
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontFamily:'var(--mono)', fontSize:9, fill:C.text4 }} tickCount={4}/>
                <Radar name="Evelyn" dataKey="Evelyn"   stroke={C.accent} fill={C.accent} fillOpacity={0.15} strokeWidth={1.5}/>
                <Radar name="Harold" dataKey="Harold"   stroke={C.sage}   fill={C.sage}   fillOpacity={0.10} strokeWidth={1.5}/>
                <Radar name="Alice"  dataKey="Alice"    stroke={C.red}    fill={C.red}    fillOpacity={0.10} strokeWidth={1.5}/>
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, paddingTop:8 }}/>
                <Tooltip contentStyle={TT_STYLE}/>
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 8 · Pie Chart – room status distribution */}
          <ChartCard title="Pie Chart" sub="Current room status distribution · 10 rooms">
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:24 }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={STATUS_PIE} cx="50%" cy="50%"
                    innerRadius={0} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`}
                    labelLine={{ stroke:C.text4, strokeWidth:1 }}
                  >
                    {STATUS_PIE.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} stroke={C.s1} strokeWidth={2}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:12, paddingRight:8 }}>
                {STATUS_PIE.map(s => (
                  <div key={s.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text2 }}>{s.name}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:s.color }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* 9 · Radial Bar – compliance progress */}
          <ChartCard title="Radial Bar" sub="Regulatory compliance completion rates">
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:16 }}>
              <ResponsiveContainer width="100%" height={260}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={30} outerRadius={110} data={COMPLIANCE_RADIAL} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill:C.s2 }}>
                    {COMPLIANCE_RADIAL.map((entry, i) => (
                      <Cell key={i} fill={entry.fill}/>
                    ))}
                  </RadialBar>
                  <Tooltip contentStyle={TT_STYLE} formatter={(val) => [`${val}%`, 'Completion']}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10 }}/>
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:14, paddingRight:8 }}>
                {COMPLIANCE_RADIAL.map(c => (
                  <div key={c.name}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{c.name}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:600, color:c.fill }}>{c.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* 10 · Treemap – active movement by resident */}
          <ChartCard title="Treemap" sub="Daily walking distance proportional area by resident">
            <ResponsiveContainer width="100%" height={260}>
              <Treemap
                data={TREEMAP_DATA}
                dataKey="size"
                aspectRatio={4/3}
                content={<TreemapCell />}
              >
                <Tooltip contentStyle={TT_STYLE} formatter={(val, _name, props) => [`${val}m`, props.payload?.name]}/>
              </Treemap>
            </ResponsiveContainer>
          </ChartCard>

          {/* 11 · Heatmap – activity by hour × day (CSS) */}
          <ChartCard title="Heatmap" sub="Movement events by time-of-day and day-of-week" full>
            <div style={{ display:'grid', gridTemplateColumns:`60px repeat(${HEATMAP_HOURS.length},1fr)`, gap:4, alignItems:'center' }}>
              {/* Header row */}
              <div/>
              {HEATMAP_HOURS.map(h => (
                <div key={h} style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text4, textAlign:'center', paddingBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
              ))}
              {/* Data rows */}
              {HEATMAP_DAYS.map((day, di) => (
                <>
                  <div key={`label-${day}`} style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3, paddingRight:8, textAlign:'right' }}>{day}</div>
                  {HEATMAP_RAW[di].map((val, hi) => (
                    <HeatCell key={`${di}-${hi}`} value={val}/>
                  ))}
                </>
              ))}
            </div>
            {/* Legend */}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:16, justifyContent:'flex-end' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text4 }}>Low</span>
              {[0.05, 0.25, 0.5, 0.75, 1].map(n => (
                <div key={n} style={{ width:18, height:18, borderRadius:3,
                  background: n < 0.15 ? C.s3 : n < 0.35 ? `rgba(45,114,210,0.25)` : n < 0.55 ? `rgba(45,114,210,0.50)` : n < 0.75 ? `rgba(45,114,210,0.75)` : C.accent
                }}/>
              ))}
              <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text4 }}>High</span>
            </div>
          </ChartCard>

          {/* 12 · Funnel Chart – alert resolution pipeline */}
          <ChartCard title="Funnel Chart" sub="Alert resolution pipeline · daily average">
            <ResponsiveContainer width="100%" height={260}>
              <FunnelChart margin={{ top:4, right:8, bottom:4, left:8 }}>
                <Tooltip contentStyle={TT_STYLE}/>
                <Funnel dataKey="value" data={FUNNEL_DATA} isAnimationActive>
                  {FUNNEL_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.82} stroke={C.s1} strokeWidth={2}/>
                  ))}
                  <LabelList dataKey="name" position="right" style={{ fontFamily:'var(--mono)', fontSize:10, fill:C.text3 }}/>
                  <LabelList dataKey="value" position="center" style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:600, fill:C.text }}/>
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 13 · Sankey – sensor data pipeline flow */}
          <ChartCard title="Sankey" sub="Sensor data pipeline · events per day">
            <ResponsiveContainer width="100%" height={260}>
              <Sankey
                data={SANKEY_DATA}
                nodePadding={18}
                nodeWidth={14}
                linkCurvature={0.5}
                margin={{ top:8, right:80, bottom:8, left:8 }}
                node={{ fill:C.accent, fillOpacity:0.85, stroke:'none', rx:3 }}
                link={{ fill:C.accent, fillOpacity:0.12, stroke:'none' }}
              >
                <Tooltip contentStyle={TT_STYLE}/>
              </Sankey>
            </ResponsiveContainer>
          </ChartCard>

          {/* 14 · Sunburst – room activity hierarchy */}
          <ChartCard title="Sunburst Chart" sub="Floor → risk tier → room · walking minutes" full>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <SunburstChart
                width={560} height={320}
                data={SUNBURST_DATA}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                padding={2}
                ringPadding={4}
                stroke={C.s1}
              >
                <Tooltip contentStyle={TT_STYLE}/>
              </SunburstChart>
            </div>
          </ChartCard>

        </div>

        <div className="agent-note" style={{ marginTop:48 }}>
          — Ambient Intelligence · sensor analytics · 14 chart types · recharts on Vercel —
        </div>
      </main>
    </div>
  );
}
