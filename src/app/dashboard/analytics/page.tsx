'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function AnalyticsPage() {
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
            <div className="brand-name">Ambient <em>Demo</em></div>
          </div>
        </Link>
        <nav className="nav-section">
          <div className="nav-label">Views</div>
            <Link href="/dashboard/room/MOH301" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<path d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round" />}</svg>
              Overview
            </Link>
            <Link href="/dashboard/floormap" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M2.5 7h11M7 2.5v11"/></>}</svg>
              Floor Map
            </Link>
            <Link href="/dashboard/alerts" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><path d="M3.5 12.5h9l-1.5-2V7a3.5 3.5 0 10-7 0v3.5l-1.5 2z" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 003 0" strokeLinecap="round"/></>}</svg>
              Alerts
            </Link>
            <Link href="/dashboard/reports" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></>}</svg>
              Reports
            </Link>
            <Link href="/dashboard/analytics" className={"nav-item active"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><path d="M2.5 12.5h11M5 12.5V8.5M8 12.5V5M11 12.5V9.5" strokeLinecap="round"/></>}</svg>
              Analytics
            </Link>
            <Link href="/dashboard/browse" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/></>}</svg>
              Browse
            </Link>
        </nav>
        <nav className="nav-section">
          <div className="nav-label">Rooms</div>
            <div key="MOH 301" className="nav-item" onClick={()=>setActiveRoom('MOH 301')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 301
            </div>
            <div key="MOH 302" className="nav-item" onClick={()=>setActiveRoom('MOH 302')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 302
            </div>
            <div key="MOH 303" className="nav-item" onClick={()=>setActiveRoom('MOH 303')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 303
            </div>
            <div key="MOH 304" className="nav-item" onClick={()=>setActiveRoom('MOH 304')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 304
            </div>
            <div key="MOH 305" className="nav-item" onClick={()=>setActiveRoom('MOH 305')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 305
            </div>
            <div key="MOH 306" className="nav-item" onClick={()=>setActiveRoom('MOH 306')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 306
            </div>
            <div key="MOH 307" className="nav-item" onClick={()=>setActiveRoom('MOH 307')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 307
            </div>
            <div key="MOH 308" className="nav-item" onClick={()=>setActiveRoom('MOH 308')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 308
            </div>
            <div key="MOH 309" className="nav-item" onClick={()=>setActiveRoom('MOH 309')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 309
            </div>
            <div key="MOH 310" className="nav-item" onClick={()=>setActiveRoom('MOH 310')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 310
            </div>
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Sensors online · MOH 301–310</span>
        </div>
      </nav>
      <main className="main">
        <header className="topbar">
          <div>
            <div className="crumb">{crumb}</div>
            <h1 className="page-title">Analytics <em>&amp; Trends</em></h1>
          </div>
        </header>
        <div style={{ padding:'32px 40px', display:'flex', flexDirection:'column', gap:24 }}>

          {/* Stat strip */}
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

          {/* 30-day trend */}
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
        </div>
      </main>
    </div>
  );
}
