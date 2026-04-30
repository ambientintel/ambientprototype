"use client";
import React from "react";
import Link from "next/link";
import {
  AreaChart, Area,
  BarChart, Bar,
  Line,
  ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:     '#0C0D0F',
  s1:     '#13151A',
  s2:     '#1C1F26',
  s3:     '#252A31',
  line:   'rgba(255,255,255,0.07)',
  lineS:  'rgba(255,255,255,0.14)',
  text:   '#EDEEF0',
  text2:  'rgba(237,238,240,0.65)',
  text3:  'rgba(237,238,240,0.42)',
  text4:  'rgba(237,238,240,0.26)',
  accent: '#2D72D2',
  sage:   '#3DCC91',
  amber:  '#FFC940',
  red:    '#FF6B6B',
  purple: '#7C6EAD',
  teal:   '#00B4D8',
};

const TT: React.CSSProperties = {
  background: C.s1,
  border: `1px solid ${C.lineS}`,
  borderRadius: 8,
  color: C.text,
  fontFamily: 'var(--mono)',
  fontSize: 11,
  padding: '8px 12px',
};

// ── Datasets ───────────────────────────────────────────────────

const MONTHLY_PL = [
  { month:'Jan', revenue:487200, cost:341040, margin:146160, forecast:false },
  { month:'Feb', revenue:462800, cost:324960, margin:137840, forecast:false },
  { month:'Mar', revenue:510300, cost:357210, margin:153090, forecast:false },
  { month:'Apr', revenue:496800, cost:347760, margin:149040, forecast:false },
  { month:'May', revenue:524000, cost:366800, margin:157200, forecast:true  },
  { month:'Jun', revenue:541600, cost:379120, margin:162480, forecast:true  },
];

const PAYER_MIX = [
  { name:'Medicare',    value:38, color:C.accent  },
  { name:'Medicaid',    value:27, color:C.purple  },
  { name:'Private Pay', value:22, color:C.sage    },
  { name:'Insurance',   value:13, color:C.amber   },
];

const CENSUS = [
  { day:'Mon', occupied:39, capacity:42 },
  { day:'Tue', occupied:40, capacity:42 },
  { day:'Wed', occupied:38, capacity:42 },
  { day:'Thu', occupied:41, capacity:42 },
  { day:'Fri', occupied:40, capacity:42 },
  { day:'Sat', occupied:37, capacity:42 },
  { day:'Sun', occupied:36, capacity:42 },
];

const DEPT_COSTS = [
  { month:'Jan', staffing:195000, facilities:68000, technology:31000, medical:28000, admin:19040 },
  { month:'Feb', staffing:187000, facilities:65000, technology:31000, medical:24000, admin:17960 },
  { month:'Mar', staffing:204000, facilities:70000, technology:31000, medical:31000, admin:21210 },
  { month:'Apr', staffing:199000, facilities:68000, technology:31000, medical:29000, admin:20760 },
];

const FALL_SAVINGS = [
  { month:'Jan', monthly:48000,  cumulative:48000  },
  { month:'Feb', monthly:36000,  cumulative:84000  },
  { month:'Mar', monthly:60000,  cumulative:144000 },
  { month:'Apr', monthly:48000,  cumulative:192000 },
];

const STAFF_EFF = [
  { week:'W14', alerts:142, fte:8.0, ratio:17.8 },
  { week:'W15', alerts:158, fte:8.5, ratio:18.6 },
  { week:'W16', alerts:134, fte:7.5, ratio:17.9 },
  { week:'W17', alerts:167, fte:9.0, ratio:18.6 },
  { week:'W18', alerts:149, fte:8.0, ratio:18.6 },
];

const RADAR_DATA = [
  { metric:'Occupancy',    facility:92, benchmark:88 },
  { metric:'Rev/Bed',      facility:86, benchmark:80 },
  { metric:'Fall Rate',    facility:91, benchmark:75 },
  { metric:'Staff Ratio',  facility:84, benchmark:82 },
  { metric:'Satisfaction', facility:89, benchmark:85 },
  { metric:'Response',     facility:93, benchmark:78 },
];

const REV_MIX = [
  { month:'Jan', roomBoard:381000, ancillary:62000, other:44200 },
  { month:'Feb', roomBoard:361000, ancillary:59000, other:42800 },
  { month:'Mar', roomBoard:399000, ancillary:66000, other:45300 },
  { month:'Apr', roomBoard:388000, ancillary:64000, other:44800 },
];

// ── Helpers ────────────────────────────────────────────────────

function fmt$(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${(n / 1_000).toFixed(0)}K`;
}

// ── Sub-components ─────────────────────────────────────────────

function KpiCard({ label, value, sub, color, delta }: {
  label: string; value: string; sub: string; color: string; delta?: string;
}) {
  const up = delta?.startsWith('+');
  return (
    <div style={{ background:C.s1, border:`1px solid ${C.line}`, borderRadius:12, padding:'20px 22px' }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:28, color, letterSpacing:'-0.02em', lineHeight:1 }}>{value}</div>
      {delta && (
        <div style={{ fontFamily:'var(--mono)', fontSize:11, color: up ? C.sage : C.red, marginTop:6 }}>{delta}</div>
      )}
      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:C.text4, marginTop:4 }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, sub, badge, full, children }: {
  title: string; sub: string; badge?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.s1,
      border: `1px solid ${C.line}`,
      borderRadius: 14,
      padding: '28px 28px 24px',
      gridColumn: full ? '1 / -1' : undefined,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'var(--serif)', fontWeight:300, fontSize:22, letterSpacing:'-0.01em', marginBottom:4 }}>{title}</div>
          <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3 }}>{sub}</div>
        </div>
        {badge && (
          <span style={{ display:'inline-flex', alignItems:'center', padding:'5px 11px', borderRadius:999, background:'rgba(45,114,210,0.14)', border:'1px solid rgba(45,114,210,0.35)', color:C.accent, fontFamily:'var(--mono)', fontSize:11 }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function BIPage() {
  const NAV: [string, string, React.ReactNode][] = [
    ['/dashboard/overview', 'Dashboard',
      <path key="d" d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/>],
    ['/bom', 'BOM',
      <><rect key="b1" x="3" y="2.5" width="10" height="11" rx="1"/><path key="b2" d="M5.5 6h5M5.5 8.5h5M5.5 11h3" strokeLinecap="round"/></>],
    ['/gapanalysis', 'Gap Analysis',
      <><path key="g1" d="M2.5 12.5h11M5 12.5V9M8 12.5V5.5M11 12.5V8" strokeLinecap="round"/></>],
    ['/datascience', 'Data Science',
      <><circle key="ds1" cx="5" cy="5" r="2.5"/><circle key="ds2" cx="11" cy="11" r="2.5"/><path key="ds3" d="M11 5.5a2.5 2.5 0 110 0z" strokeLinejoin="round"/><path key="ds4" d="M5 11a2.5 2.5 0 110 0z"/></>],
    ['/bi', 'Business Intel',
      <><path key="bi1" d="M3 12.5h2.5V8.5H3zM6.75 12.5h2.5V5.5h-2.5zM10.5 12.5H13V3H10.5z" strokeLinejoin="round"/><path key="bi2" d="M3 5.5l3.5-2.5 3 2 3-4" strokeLinecap="round"/></>],
  ];

  return (
    <div className="app" style={{ color:C.text }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link href="/" style={{ textDecoration:'none', color:'inherit' }}>
          <div className="brand">
            <div className="brand-name">Ambient <em>Intelligence</em></div>
          </div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Platform</div>
          {NAV.map(([href, label, icon]) => (
            <Link key={String(label)} href={href}
              className={`nav-item${href === '/bi' ? ' active' : ''}`}
              style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </Link>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Sections</div>
          {['Revenue & Growth','Patient Operations','Cost Analysis','Clinical Impact','Facility Benchmark'].map(name => (
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
          <span>recharts · vercel · bi</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <header className="topbar" style={{ marginBottom:32 }}>
          <div>
            <div className="crumb">Ambient Intelligence · Business Intelligence</div>
            <h1 className="page-title">Business <em>Intelligence</em></h1>
          </div>
          <div className="tool-group">
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3 }}>MOH · Q1 2026 actuals + Q2 forecast</span>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.sage, boxShadow:`0 0 5px ${C.sage}`, display:'inline-block' }}/>
          </div>
        </header>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:36 }}>
          <KpiCard label="Monthly Revenue"  value="$496.8K" sub="Apr 2026 actuals"      color={C.accent} delta="+7.4% vs Jan"  />
          <KpiCard label="Rev / Bed / Day"  value="$394"    sub="42-bed facility"        color={C.sage}   delta="+3.1% MoM"    />
          <KpiCard label="Occupancy Rate"   value="92.2%"   sub="7-day rolling avg"      color={C.amber}  delta="+2.3 pp"      />
          <KpiCard label="Falls Prevented"  value="16"      sub="Q1 · $192K saved"       color={C.teal}   delta="+$192K ROI"   />
          <KpiCard label="Staff Efficiency" value="18.4"    sub="alerts / FTE / week"    color={C.purple} delta="+6.2% util"   />
          <KpiCard label="Net Margin"       value="30.0%"   sub="Apr 2026"               color={C.sage}   delta="+0.4 pp"      />
        </div>

        {/* ── Revenue & Growth ── */}
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:48, marginBottom:18 }}>
          <h2 className="section-title">Revenue &amp; <em>Growth</em></h2>
          <span className="section-meta">3 charts · actuals + forecast</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          <ChartCard title="Revenue Trend" sub="Monthly revenue · Jan–Jun 2026 (May–Jun forecast)" badge="6-month">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={MONTHLY_PL} margin={{ top:8, right:16, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.accent} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="month" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={52}/>
                <Tooltip contentStyle={TT} formatter={(v) => [typeof v === 'number' ? fmt$(v) : String(v ?? ''), '']}/>
                <ReferenceLine x="May" stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value:'Forecast', fill:C.amber, fontFamily:'var(--mono)', fontSize:9 }}/>
                <Area dataKey="revenue" stroke={C.accent} strokeWidth={2} fill="url(#g-rev)" dot={false} name="Revenue"/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="P&L Overview" sub="Revenue vs. cost vs. net margin · Jan–Jun 2026" badge="30% margin">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={MONTHLY_PL} margin={{ top:8, right:40, bottom:0, left:0 }}>
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="month" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="l" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={52}/>
                <YAxis yAxisId="r" orientation="right" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={52}/>
                <Tooltip contentStyle={TT} formatter={(v) => [typeof v === 'number' ? fmt$(v) : String(v ?? ''), '']}/>
                <Bar yAxisId="l" dataKey="revenue" fill={C.accent}  fillOpacity={0.22} radius={[4,4,0,0]} name="Revenue"/>
                <Bar yAxisId="l" dataKey="cost"    fill={C.red}     fillOpacity={0.22} radius={[4,4,0,0]} name="Cost"/>
                <Line yAxisId="r" dataKey="margin" stroke={C.sage}  strokeWidth={2}    dot={{ fill:C.sage, r:3 }} name="Net Margin $"/>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue Mix" sub="Room & board vs. ancillary vs. other · Jan–Apr 2026" full>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={REV_MIX} margin={{ top:8, right:16, bottom:0, left:0 }}>
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="month" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={52}/>
                <Tooltip contentStyle={TT} formatter={(v) => [typeof v === 'number' ? fmt$(v) : String(v ?? ''), '']}/>
                <Legend wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3 }}/>
                <Bar dataKey="roomBoard"  stackId="a" fill={C.accent} fillOpacity={0.85} name="Room & Board"/>
                <Bar dataKey="ancillary" stackId="a" fill={C.teal}   fillOpacity={0.85} name="Ancillary"/>
                <Bar dataKey="other"     stackId="a" fill={C.purple} fillOpacity={0.85} name="Other" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* ── Patient Operations ── */}
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:48, marginBottom:18 }}>
          <h2 className="section-title">Patient <em>Operations</em></h2>
          <span className="section-meta">2 charts · census + payer mix</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          <ChartCard title="Weekly Census" sub="Occupied beds vs. 42-bed capacity · 7-day view">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CENSUS} margin={{ top:8, right:16, bottom:0, left:0 }} barCategoryGap="30%">
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="day" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,44]} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={28}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="capacity" fill={C.s3}    radius={[4,4,0,0]} name="Capacity"/>
                <Bar dataKey="occupied" fill={C.accent} fillOpacity={0.85} radius={[4,4,0,0]} name="Occupied"/>
                <ReferenceLine y={42} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.6}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Payer Mix" sub="Revenue distribution by payer type · Apr 2026">
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ flex:'0 0 auto' }}>
                <ResponsiveContainer width={200} height={260}>
                  <PieChart>
                    <Pie data={PAYER_MIX} cx="50%" cy="50%" innerRadius={64} outerRadius={96} paddingAngle={3} dataKey="value">
                      {PAYER_MIX.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85}/>)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v) => [typeof v === 'number' ? `${v}%` : String(v ?? ''), '']}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
                {PAYER_MIX.map(p => (
                  <div key={p.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:p.color, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:13, color:C.text }}>{p.name}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text3 }}>{p.value}% of revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

        </div>

        {/* ── Cost Analysis ── */}
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:48, marginBottom:18 }}>
          <h2 className="section-title">Cost <em>Analysis</em></h2>
          <span className="section-meta">2 charts · department + benchmark</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          <ChartCard title="Department Costs" sub="Stacked monthly cost by category · Jan–Apr 2026">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DEPT_COSTS} margin={{ top:8, right:16, bottom:0, left:0 }}>
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="month" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={44}/>
                <Tooltip contentStyle={TT} formatter={(v) => [typeof v === 'number' ? fmt$(v) : String(v ?? ''), '']}/>
                <Legend wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3 }}/>
                <Bar dataKey="staffing"   stackId="a" fill={C.accent}  fillOpacity={0.85} name="Staffing"/>
                <Bar dataKey="facilities" stackId="a" fill={C.purple}  fillOpacity={0.85} name="Facilities"/>
                <Bar dataKey="technology" stackId="a" fill={C.teal}    fillOpacity={0.85} name="Technology"/>
                <Bar dataKey="medical"    stackId="a" fill={C.amber}   fillOpacity={0.85} name="Medical"/>
                <Bar dataKey="admin"      stackId="a" fill={C.text4}   fillOpacity={0.85} name="Admin" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Facility Benchmark" sub="Performance vs. industry benchmark · percentile scores">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={RADAR_DATA} margin={{ top:8, right:24, bottom:8, left:24 }}>
                <PolarGrid stroke={C.line}/>
                <PolarAngleAxis dataKey="metric" tick={{ fill:C.text3, fontFamily:'var(--mono)', fontSize:10 }}/>
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:9 }}/>
                <Radar name="Facility"   dataKey="facility"  stroke={C.accent} fill={C.accent} fillOpacity={0.15} strokeWidth={2}/>
                <Radar name="Benchmark"  dataKey="benchmark" stroke={C.amber}  fill={C.amber}  fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3"/>
                <Tooltip contentStyle={TT}/>
                <Legend wrapperStyle={{ fontFamily:'var(--mono)', fontSize:10, color:C.text3 }}/>
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        {/* ── Clinical Impact ── */}
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginTop:48, marginBottom:18 }}>
          <h2 className="section-title">Clinical <em>Impact</em></h2>
          <span className="section-meta">2 charts · ROI + staffing</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          <ChartCard title="Fall Prevention ROI" sub="Monthly + cumulative savings · $12K avg cost per incident" badge="$192K Q1">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={FALL_SAVINGS} margin={{ top:8, right:40, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="g-sav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.sage} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={C.sage} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="month" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="l" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={44}/>
                <YAxis yAxisId="r" orientation="right" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={44}/>
                <Tooltip contentStyle={TT} formatter={(v) => [typeof v === 'number' ? fmt$(v) : String(v ?? ''), '']}/>
                <Bar     yAxisId="l" dataKey="monthly"    fill={C.sage}  fillOpacity={0.3}  radius={[3,3,0,0]} name="Monthly Savings"/>
                <Area    yAxisId="r" dataKey="cumulative" stroke={C.sage} strokeWidth={2}    fill="url(#g-sav)" dot={{ fill:C.sage, r:4 }} name="Cumulative"/>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Staff Efficiency" sub="Total alerts handled vs. alerts per FTE per week · W14–W18">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={STAFF_EFF} margin={{ top:8, right:40, bottom:0, left:0 }}>
                <CartesianGrid stroke={C.line}/>
                <XAxis dataKey="week" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="l" tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={32}/>
                <YAxis yAxisId="r" orientation="right" domain={[0,25]} tick={{ fill:C.text4, fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={32}/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine yAxisId="r" y={18} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={0.6}/>
                <Bar  yAxisId="l" dataKey="alerts" fill={C.accent}  fillOpacity={0.28} radius={[3,3,0,0]} name="Total Alerts"/>
                <Line yAxisId="r" dataKey="ratio"  stroke={C.purple} strokeWidth={2}   dot={{ fill:C.purple, r:4 }} name="Alerts/FTE"/>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

        <div className="agent-note" style={{ marginTop:48 }}>
          — Ambient Intelligence · Business Intelligence · MOH facility · Q1 2026 actuals + Q2 forecast —
        </div>
      </main>
    </div>
  );
}
