'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ── existing data ──────────────────────────────────────────────────────────────
const ROOM_PRIORITY: Record<string, 'high' | 'medium' | 'low'> = {
  MOH301: 'high', MOH302: 'medium', MOH303: 'low', MOH304: 'medium',
  MOH305: 'medium', MOH306: 'low',  MOH307: 'medium', MOH308: 'high',
  MOH309: 'low',   MOH310: 'low',
};

const WEEKLY = [12,8,14,6,10,9,11,7,13,15,9,8,12,10,14,7,11,8,13,9,11,14,8,12,10,9,7,13,11,14];
const BY_ROOM = [
  { room:'MOH 301', alerts:14, color:'#a02020' },
  { room:'MOH 302', alerts:11, color:'#a02020' },
  { room:'MOH 305', alerts:10, color:'#a02020' },
  { room:'MOH 309', alerts:9,  color:'#a02020' },
  { room:'MOH 304', alerts:6,  color:'#8a6200' },
  { room:'MOH 307', alerts:5,  color:'#8a6200' },
  { room:'MOH 310', alerts:4,  color:'#8a6200' },
  { room:'MOH 303', alerts:2,  color:'#2e7d4f' },
  { room:'MOH 306', alerts:2,  color:'#2e7d4f' },
  { room:'MOH 308', alerts:1,  color:'#2e7d4f' },
];
const RESPONSE = [
  { bucket:'< 2 min', count:8  },
  { bucket:'2–5 min', count:24 },
  { bucket:'5–10 min',count:12 },
  { bucket:'10+ min', count:3  },
];

// ── new visualisation data ────────────────────────────────────────────────────
const HM_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HEATMAP: number[][] = [
  [3,4,5,4,2,1,0,0,1,2,3,2,1,1,2,3,2,1,2,3,3,4,4,4],
  [4,3,4,5,3,2,1,0,1,2,3,3,2,1,1,2,3,2,3,3,4,3,4,4],
  [2,3,4,3,2,1,0,0,1,2,2,3,2,2,1,2,2,3,2,3,3,4,3,3],
  [3,4,3,4,3,2,1,1,2,2,3,2,2,1,2,3,3,2,3,4,4,4,4,3],
  [4,4,5,4,3,2,1,0,1,2,3,3,2,2,2,3,3,2,3,3,4,3,3,4],
  [2,3,3,3,2,1,0,0,1,1,2,2,2,1,1,2,2,2,2,3,3,3,3,3],
  [3,3,4,3,2,1,0,0,1,2,2,2,1,1,1,2,2,2,3,3,3,4,3,3],
];

const CONFIDENCE_TREND = [
  { day:'Nov 1',  score:94.2 },
  { day:'Nov 5',  score:93.5 },
  { day:'Nov 10', score:95.1 },
  { day:'Nov 15', score:94.8 },
  { day:'Nov 20', score:93.2 },
  { day:'Nov 25', score:96.0 },
  { day:'Dec 1',  score:94.7 },
  { day:'Dec 5',  score:95.3 },
];

const ALERT_CATS = [
  { name:'Fall Event',   value:28, color:'#a02020' },
  { name:'Movement',     value:18, color:'#8a6200' },
  { name:'Inactivity',   value:12, color:'#7C6EAD' },
  { name:'Sensor Error', value:6,  color:'rgba(26,26,24,0.25)' },
];

const ROOM_RISK = [
  { room:'301', fall:82, mobility:65, cognitive:78, care:72, level:'high'   },
  { room:'302', fall:68, mobility:58, cognitive:61, care:65, level:'medium' },
  { room:'303', fall:31, mobility:40, cognitive:35, care:38, level:'low'    },
  { room:'304', fall:55, mobility:62, cognitive:50, care:55, level:'medium' },
  { room:'305', fall:74, mobility:70, cognitive:68, care:69, level:'high'   },
  { room:'306', fall:25, mobility:30, cognitive:28, care:32, level:'low'    },
  { room:'307', fall:60, mobility:55, cognitive:63, care:58, level:'medium' },
  { room:'308', fall:15, mobility:22, cognitive:18, care:20, level:'low'    },
  { room:'309', fall:78, mobility:72, cognitive:80, care:75, level:'high'   },
  { room:'310', fall:42, mobility:45, cognitive:39, care:44, level:'medium' },
];

const RISK_RADAR = [
  { metric:'Fall Risk',   r301:82, r305:74, r309:78, avg:55 },
  { metric:'Mobility',    r301:65, r305:70, r309:72, avg:52 },
  { metric:'Cognitive',   r301:78, r305:68, r309:80, avg:50 },
  { metric:'Care Needs',  r301:72, r305:69, r309:75, avg:58 },
  { metric:'Hist. Falls', r301:85, r305:72, r309:82, avg:48 },
  { metric:'Response',    r301:68, r305:65, r309:71, avg:60 },
];

const RISK_COLOR = { high:'#a02020', medium:'#8a6200', low:'#2e7d4f' } as const;
const RISK_BG    = { high:'rgba(160,32,32,0.09)', medium:'rgba(138,98,0,0.09)', low:'rgba(46,125,79,0.09)' } as const;

const NOTION_TT: React.CSSProperties = {
  background:'#F7F7F5', border:'1px solid rgba(30,30,28,0.16)',
  borderRadius:6, color:'#1A1A18', fontFamily:'var(--mono)', fontSize:11, padding:'8px 12px',
};

// ── helpers ───────────────────────────────────────────────────────────────────
function riskScore(r: typeof ROOM_RISK[0]) {
  return Math.round((r.fall + r.mobility + r.cognitive + r.care) / 4);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeRoom, setActiveRoom] = useState('');
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setNow(new Date()),60000); return ()=>clearInterval(id); },[]);
  useEffect(()=>{ document.body.style.background='#F0F0EE'; return ()=>{ document.body.style.background=''; }; },[]);
  const cst=new Date(now.toLocaleString('en-US',{timeZone:'America/Chicago'}));
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h=cst.getHours(); const hh=h%12||12; const mm=String(cst.getMinutes()).padStart(2,'0'); const ampm=h<12?'AM':'PM';
  const crumb=`${DAYS[cst.getDay()]} · ${MONTHS[cst.getMonth()]} ${cst.getDate()} · ${hh}:${mm} ${ampm} CST`;
  const notion: React.CSSProperties = {
    '--bg':          '#F0F0EE',
    '--surface-1':   '#F7F7F5',
    '--surface-2':   '#E4E4E0',
    '--surface-3':   '#D8D8D3',
    '--line':        'rgba(30,30,28,0.08)',
    '--line-strong': 'rgba(30,30,28,0.16)',
    '--text':        '#1A1A18',
    '--text-2':      'rgba(26,26,24,0.72)',
    '--text-3':      'rgba(26,26,24,0.55)',
    '--text-4':      'rgba(26,26,24,0.40)',
    '--accent':      '#7C6EAD',
    '--accent-soft': 'rgba(124,110,173,0.14)',
    '--sage':        'oklch(0.55 0.07 155)',
    color:           'var(--text)',
  } as React.CSSProperties;
  const maxW = Math.max(...WEEKLY);
  const maxR = Math.max(...BY_ROOM.map(r=>r.alerts));
  const maxResp = Math.max(...RESPONSE.map(r=>r.count));

  return (
    <div className="app notion-theme" style={notion}>
      <nav className="sidebar">
        <Link href="/" style={{ textDecoration:"none", color:"inherit" }}>
          <div className="brand">
            <div className="brand-name">Ambient <em>Intelligence</em></div>
          </div>
        </Link>
        <nav className="nav-section">
          <div className="nav-label">Views</div>
          <Link href="/dashboard/overview" className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/></svg>
            Overview
          </Link>
          <Link href="/dashboard/floormap" className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M2.5 7h11M7 2.5v11"/></svg>
            Floor Map
          </Link>
          <Link href="/dashboard/alerts" className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3.5 12.5h9l-1.5-2V7a3.5 3.5 0 10-7 0v3.5l-1.5 2z" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 003 0" strokeLinecap="round"/></svg>
            Alerts
          </Link>
          <Link href="/dashboard/reports" className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></svg>
            Reports
          </Link>
          <Link href="/dashboard/analytics" className="nav-item active" style={{ textDecoration:'none', color:'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 12.5h11M5 12.5V8.5M8 12.5V5M11 12.5V9.5" strokeLinecap="round"/></svg>
            Analytics
          </Link>
          <Link href="/dashboard/browse" className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/></svg>
            Browse
          </Link>
        </nav>
        <nav className="nav-section">
          <div className="nav-label">Rooms</div>
          {Object.keys(ROOM_PRIORITY).map(id => {
            const label = `MOH ${id.slice(3)}`;
            const p = ROOM_PRIORITY[id];
            return (
              <div key={id} className="nav-item" onClick={() => router.push(`/dashboard/room/${id}`)} style={{ cursor:'pointer' }}>
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
                <span style={{ flex:1 }}>{label}</span>
                <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                  background: p==='high' ? '#FF6B6B' : p==='medium' ? '#FFC940' : '#3DCC91',
                  boxShadow: p==='high' ? '0 0 5px #FF6B6B' : p==='low' ? '0 0 4px #3DCC91' : 'none' }}/>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot"/>
          <span>Sensors online · MOH 301–310</span>
        </div>
      </nav>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="crumb">{crumb}</div>
            <h1 className="page-title">Analytics <em>&amp; Trends</em></h1>
          </div>
          <div className="tool-group"><AuthButton /></div>
        </header>

        <div style={{ padding:'32px 40px', display:'flex', flexDirection:'column', gap:24 }}>

          {/* ── Stat strip ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              { label:'Alerts this week', value:'64',    sub:'↑ 12% vs last week' },
              { label:'Avg response time',value:'4.2m',  sub:'Target < 5 min ✓' },
              { label:'Fall events (30d)', value:'28',    sub:'2 unresolved' },
              { label:'Sensor uptime',    value:'99.9%', sub:'All rooms online' },
            ].map(s=>(
              <div key={s.label} style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:500, color:'var(--text)', marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:11, color:'var(--text-4)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── 30-day trend ── */}
          <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>Alert volume · 30 days</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
              {WEEKLY.map((v,i)=>(
                <div key={i} style={{ flex:1, background:'var(--accent)', opacity:0.6+(v/maxW)*0.4, borderRadius:'2px 2px 0 0', height:`${Math.round((v/maxW)*76)+4}px` }}/>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:'var(--mono)', fontSize:10, color:'var(--text-4)' }}>
              <span>Nov 1</span><span>Nov 15</span><span>Dec 1</span><span>Dec 5</span>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Alerts by room */}
            <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>Alerts by room · 30 days</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {BY_ROOM.map(r=>(
                  <div key={r.room} style={{ display:'grid', gridTemplateColumns:'80px 1fr 28px', alignItems:'center', gap:10 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>{r.room}</span>
                    <div style={{ height:6, background:'var(--line)', borderRadius:3 }}>
                      <div style={{ width:`${(r.alerts/maxR)*100}%`, height:'100%', background:r.color, borderRadius:3 }}/>
                    </div>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-2)', textAlign:'right' }}>{r.alerts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>Alert response time distribution</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {RESPONSE.map(r=>(
                  <div key={r.bucket} style={{ display:'grid', gridTemplateColumns:'80px 1fr 28px', alignItems:'center', gap:10 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>{r.bucket}</span>
                    <div style={{ height:20, background:'var(--line)', borderRadius:3 }}>
                      <div style={{ width:`${(r.count/maxResp)*100}%`, height:'100%', background:'var(--accent)', borderRadius:3, opacity:0.7 }}/>
                    </div>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-2)', textAlign:'right' }}>{r.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, fontSize:12, color:'var(--text-3)' }}>Median response: <strong style={{ color:'var(--text)' }}>4.2 min</strong> · Target: 5 min</div>
            </div>
          </div>

          {/* ── Alert heatmap ── */}
          <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>
              Alert heatmap · hour of day × day of week · higher activity overnight
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:3, paddingTop:22 }}>
                {HM_DAYS.map(d => (
                  <div key={d} style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-4)', width:26, height:16, display:'flex', alignItems:'center' }}>{d}</div>
                ))}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', marginBottom:4 }}>
                  {Array.from({length:24},(_,h) => (
                    <div key={h} style={{ flex:1, fontFamily:'var(--mono)', fontSize:9, color:'var(--text-4)', textAlign:'center' }}>
                      {h % 6 === 0 ? `${h}h` : ''}
                    </div>
                  ))}
                </div>
                {HEATMAP.map((row, di) => (
                  <div key={di} style={{ display:'flex', gap:2, marginBottom:3 }}>
                    {row.map((val, hi) => (
                      <div key={hi} title={`${HM_DAYS[di]} ${hi}:00 · ${val} alert${val!==1?'s':''}`} style={{
                        flex:1, height:16, borderRadius:3, cursor:'default',
                        background: val === 0
                          ? 'rgba(30,30,28,0.06)'
                          : `rgba(124,110,173,${0.12 + (val / 5) * 0.78})`,
                        transition:'opacity 0.15s',
                      }}/>
                    ))}
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, justifyContent:'flex-end' }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-4)' }}>Quiet</span>
                  {[0,1,2,3,4,5].map(v => (
                    <div key={v} style={{ width:16, height:16, borderRadius:3,
                      background: v === 0 ? 'rgba(30,30,28,0.06)' : `rgba(124,110,173,${0.12 + (v/5)*0.78})` }}/>
                  ))}
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-4)' }}>Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Confidence trend + Category donut ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

            <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>
                Sensor confidence score · 35-day trend
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={CONFIDENCE_TREND} margin={{ top:8, right:8, bottom:0, left:0 }}>
                  <defs>
                    <linearGradient id="conf-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C6EAD" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#7C6EAD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(30,30,28,0.07)"/>
                  <XAxis dataKey="day" tick={{ fill:'rgba(26,26,24,0.4)', fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[91,97]} tickFormatter={(v:number) => `${v}%`} tick={{ fill:'rgba(26,26,24,0.4)', fontFamily:'var(--mono)', fontSize:10 }} axisLine={false} tickLine={false} width={38}/>
                  <Tooltip contentStyle={NOTION_TT} formatter={(v:unknown) => [typeof v === 'number' ? `${v.toFixed(1)}%` : String(v ?? ''), 'Confidence']}/>
                  <ReferenceLine y={94} stroke="rgba(138,98,0,0.45)" strokeDasharray="4 3"/>
                  <Area dataKey="score" stroke="#7C6EAD" strokeWidth={2} fill="url(#conf-grad)" dot={{ r:3, fill:'#7C6EAD', strokeWidth:0 }} name="Confidence"/>
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ marginTop:12, fontFamily:'var(--mono)', fontSize:10, color:'rgba(26,26,24,0.4)' }}>
                Dashed line = 94% floor · all readings within spec
              </div>
            </div>

            <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>
                Alert categories · 30 days
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:24 }}>
                <div style={{ flex:'0 0 auto' }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={ALERT_CATS} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                        {ALERT_CATS.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.88}/>)}
                      </Pie>
                      <Tooltip contentStyle={NOTION_TT} formatter={(v:unknown) => [typeof v === 'number' ? `${v} alerts` : String(v ?? ''), '']}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
                  {ALERT_CATS.map(c => {
                    const total = ALERT_CATS.reduce((a,x)=>a+x.value,0);
                    return (
                      <div key={c.name}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ width:8, height:8, borderRadius:2, background:c.color, flexShrink:0, display:'inline-block' }}/>
                            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text)' }}>{c.name}</span>
                          </div>
                          <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>{c.value}</span>
                        </div>
                        <div style={{ height:3, background:'rgba(30,30,28,0.08)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${(c.value/total)*100}%`, background:c.color, borderRadius:2 }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ── Room risk matrix ── */}
          <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)' }}>
                Room risk matrix · fall · mobility · cognitive · care
              </div>
              <div style={{ display:'flex', gap:16 }}>
                {(['high','medium','low'] as const).map(l => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:RISK_COLOR[l], display:'inline-block' }}/>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-4)', textTransform:'uppercase' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
              {ROOM_RISK.map(r => {
                const score = riskScore(r);
                const lvl = r.level as 'high'|'medium'|'low';
                return (
                  <div key={r.room} style={{
                    border:`1px solid ${RISK_COLOR[lvl]}44`,
                    background: RISK_BG[lvl],
                    borderRadius:8, padding:'14px 16px',
                    cursor:'pointer',
                  }} onClick={() => router.push(`/dashboard/room/MOH${r.room}`)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:600, color:'var(--text)' }}>MOH {r.room}</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:10, color:RISK_COLOR[lvl], textTransform:'uppercase', letterSpacing:'0.08em' }}>{r.level}</span>
                    </div>
                    {/* mini bar grid */}
                    {[['Fall',r.fall],['Mob.',r.mobility],['Cog.',r.cognitive],['Care',r.care]].map(([label,val]) => (
                      <div key={String(label)} style={{ display:'grid', gridTemplateColumns:'32px 1fr', alignItems:'center', gap:6, marginBottom:5 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-4)' }}>{label}</span>
                        <div style={{ height:4, background:'rgba(30,30,28,0.08)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${val}%`, background:RISK_COLOR[lvl], borderRadius:2, opacity:0.75 }}/>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop:8, fontFamily:'var(--mono)', fontSize:16, fontWeight:600, color:RISK_COLOR[lvl], letterSpacing:'-0.02em' }}>
                      {score}<span style={{ fontSize:10, fontWeight:400, color:'var(--text-4)', marginLeft:2 }}>/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── High-risk room radar ── */}
          <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', marginBottom:20 }}>
              High-risk room profile · MOH 301 · 305 · 309 vs. floor average
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={RISK_RADAR} margin={{ top:8, right:40, bottom:8, left:40 }}>
                <PolarGrid stroke="rgba(30,30,28,0.09)"/>
                <PolarAngleAxis dataKey="metric" tick={{ fill:'rgba(26,26,24,0.55)', fontFamily:'var(--mono)', fontSize:11 }}/>
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fill:'rgba(26,26,24,0.35)', fontFamily:'var(--mono)', fontSize:9 }}/>
                <Radar name="MOH 301" dataKey="r301" stroke="#a02020" fill="#a02020" fillOpacity={0.12} strokeWidth={2}/>
                <Radar name="MOH 305" dataKey="r305" stroke="#8a6200" fill="#8a6200" fillOpacity={0.08} strokeWidth={2}/>
                <Radar name="MOH 309" dataKey="r309" stroke="#7C6EAD" fill="#7C6EAD" fillOpacity={0.10} strokeWidth={2}/>
                <Radar name="Floor avg" dataKey="avg" stroke="rgba(30,30,28,0.3)" fill="rgba(30,30,28,0.05)" fillOpacity={1} strokeWidth={1.5} strokeDasharray="4 3"/>
                <Tooltip contentStyle={NOTION_TT}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </main>
    </div>
  );
}
