'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const ROOMS = [
  { id:'MOH 301', name:'Evelyn Rodriguez',  status:'alert',    last:'10:23 am', activity:82 },
  { id:'MOH 302', name:'Harold Nakamura',   status:'alert',    last:'9:47 am',  activity:71 },
  { id:'MOH 303', name:'Dorothy Okafor',    status:'quiet',    last:'8:15 am',  activity:24 },
  { id:'MOH 304', name:'Margaret Kowalski', status:'movement', last:'11:02 am', activity:55 },
  { id:'MOH 305', name:'Robert Steinberg',  status:'alert',    last:'7:58 am',  activity:90 },
  { id:'MOH 306', name:'Agnes Thornton',    status:'quiet',    last:'9:30 am',  activity:18 },
  { id:'MOH 307', name:'Walter Chen',       status:'movement', last:'10:45 am', activity:48 },
  { id:'MOH 308', name:'Beatrice Fontaine', status:'quiet',    last:'8:40 am',  activity:12 },
  { id:'MOH 309', name:'Franklin Oduya',    status:'alert',    last:'11:18 am', activity:88 },
  { id:'MOH 310', name:'Clara Petersen',    status:'movement', last:'9:05 am',  activity:41 },
];

const STATUS = {
  alert:    { label:'Alert',    bg:'rgba(192,57,43,0.10)',  border:'rgba(192,57,43,0.25)',  dot:'#C0392B', text:'#a02020' },
  movement: { label:'Movement', bg:'rgba(184,131,10,0.10)', border:'rgba(184,131,10,0.22)', dot:'#b88a00', text:'#8a6200' },
  quiet:    { label:'Quiet',    bg:'rgba(58,155,92,0.08)',  border:'rgba(58,155,92,0.18)',  dot:'#2e7d4f', text:'#2e7d4f' },
};

export default function FloorMap() {
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
            <Link href="/dashboard/floormap" className={"nav-item active"} style={{ textDecoration:'none', color:'inherit' }}>
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
            <Link href="/dashboard/analytics" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
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
            <h1 className="page-title">Floor <em>Map</em></h1>
          </div>
        </header>
        <div style={{ padding:'32px 40px', display:'flex', flexDirection:'column', gap:24 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {ROOMS.map(r => {
              const s = STATUS[r.status as keyof typeof STATUS];
              return (
                <div key={r.id} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:'20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', marginBottom:4 }}>{r.id}</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{r.name}</div>
                    </div>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'white', border:`1px solid ${s.border}`, borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:500, color:s.text }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, display:'inline-block' }}/>
                      {s.label}
                    </span>
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:5 }}>
                      <span>Activity level</span><span style={{ fontFamily:'var(--mono)' }}>{r.activity}%</span>
                    </div>
                    <div style={{ height:4, background:'var(--line)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:`${r.activity}%`, height:'100%', background: r.status==='alert' ? '#C0392B' : r.status==='movement' ? '#b88a00' : '#2e7d4f', borderRadius:2 }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>Last movement · <span style={{ fontFamily:'var(--mono)' }}>{r.last}</span></div>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:20, padding:'16px 0', borderTop:'1px solid var(--line)' }}>
            {Object.entries(STATUS).map(([k,s])=>(
              <div key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:s.dot, display:'inline-block' }}/>
                <span style={{ fontSize:12, color:'var(--text-3)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
