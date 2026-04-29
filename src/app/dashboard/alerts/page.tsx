'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ALERTS = [
  { time:'11:18 am', room:'MOH 309', name:'Franklin Oduya',    type:'Fall detected',      priority:'High',   status:'Active',       response:'-'    },
  { time:'10:23 am', room:'MOH 301', name:'Evelyn Rodriguez',  type:'Fall detected',      priority:'High',   status:'Active',       response:'-'    },
  { time:'10:45 am', room:'MOH 307', name:'Walter Chen',       type:'Prolonged inactivity',priority:'Medium', status:'Acknowledged', response:'4 min'},
  { time:'9:47 am',  room:'MOH 302', name:'Harold Nakamura',   type:'Fall detected',      priority:'High',   status:'Active',       response:'-'    },
  { time:'9:05 am',  room:'MOH 310', name:'Clara Petersen',    type:'Prolonged inactivity',priority:'Medium', status:'Acknowledged', response:'7 min'},
  { time:'8:40 am',  room:'MOH 308', name:'Beatrice Fontaine', type:'Night wandering',    priority:'Medium', status:'Resolved',     response:'3 min'},
  { time:'8:15 am',  room:'MOH 303', name:'Dorothy Okafor',    type:'Night wandering',    priority:'Low',    status:'Resolved',     response:'9 min'},
  { time:'7:58 am',  room:'MOH 305', name:'Robert Steinberg',  type:'Fall detected',      priority:'High',   status:'Resolved',     response:'2 min'},
  { time:'7:12 am',  room:'MOH 304', name:'Margaret Kowalski', type:'Prolonged inactivity',priority:'Medium', status:'Resolved',     response:'6 min'},
  { time:'6:44 am',  room:'MOH 306', name:'Agnes Thornton',    type:'Night wandering',    priority:'Low',    status:'Resolved',     response:'11 min'},
  { time:'4:30 am',  room:'MOH 301', name:'Evelyn Rodriguez',  type:'Night wandering',    priority:'Low',    status:'Resolved',     response:'5 min'},
  { time:'2:15 am',  room:'MOH 309', name:'Franklin Oduya',    type:'Prolonged inactivity',priority:'Medium', status:'Resolved',     response:'8 min'},
];

const P_STYLE: Record<string,{bg:string;color:string}> = {
  High:   { bg:'rgba(192,57,43,0.10)',  color:'#a02020' },
  Medium: { bg:'rgba(184,131,10,0.10)', color:'#8a6200' },
  Low:    { bg:'rgba(58,155,92,0.08)',  color:'#2e7d4f' },
};
const S_STYLE: Record<string,{color:string}> = {
  Active:       { color:'#a02020' },
  Acknowledged: { color:'#8a6200' },
  Resolved:     { color:'#2e7d4f' },
};

export default function AlertsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
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
  const filters = ['All','Active','Acknowledged','Resolved','High Priority'];
  const visible = ALERTS.filter(a =>
    filter === 'All' ? true :
    filter === 'High Priority' ? a.priority === 'High' :
    a.status === filter
  );

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
            <Link href="/dashboard/overview" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<path d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round" />}</svg>
              Overview
            </Link>
            <Link href="/dashboard/floormap" className={"nav-item"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M2.5 7h11M7 2.5v11"/></>}</svg>
              Floor Map
            </Link>
            <Link href="/dashboard/alerts" className={"nav-item active"} style={{ textDecoration:'none', color:'inherit' }}>
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
            <div key="MOH 301" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH301')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 301
            </div>
            <div key="MOH 302" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH302')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 302
            </div>
            <div key="MOH 303" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH303')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 303
            </div>
            <div key="MOH 304" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH304')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 304
            </div>
            <div key="MOH 305" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH305')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 305
            </div>
            <div key="MOH 306" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH306')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 306
            </div>
            <div key="MOH 307" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH307')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 307
            </div>
            <div key="MOH 308" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH308')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 308
            </div>
            <div key="MOH 309" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH309')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              MOH 309
            </div>
            <div key="MOH 310" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH310')}>
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
            <h1 className="page-title">Alerts <em>Feed</em></h1>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {filters.map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{ fontFamily:'var(--mono)', fontSize:11, padding:'5px 12px', borderRadius:6, border:'1px solid var(--line)', background: filter===f ? 'var(--accent)' : 'var(--surface-1)', color: filter===f ? 'white' : 'var(--text-2)', cursor:'pointer' }}>{f}</button>
            ))}
            <a href="/login" className="btn btn-ghost"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5" r="2.5"/><path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round"/></svg>Login</a>
          </div>
        </header>
        <div style={{ padding:'0 40px 40px' }}>
          <div style={{ border:'1px solid var(--line)', borderRadius:8, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'90px 100px 1fr 1fr 90px 100px 90px', gap:16, padding:'10px 20px', background:'var(--surface-2)', borderBottom:'1px solid var(--line)' }}>
              {['Time','Room','Resident','Type','Priority','Status','Response'].map(h=>(
                <span key={h} style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-4)' }}>{h}</span>
              ))}
            </div>
            {visible.map((a,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'90px 100px 1fr 1fr 90px 100px 90px', gap:16, padding:'13px 20px', borderBottom: i<visible.length-1 ? '1px solid var(--line)' : 'none', alignItems:'center', background: a.status==='Active' ? 'rgba(192,57,43,0.04)' : 'transparent' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{a.time}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-2)' }}>{a.room}</span>
                <span style={{ fontSize:13, color:'var(--text)' }}>{a.name}</span>
                <span style={{ fontSize:13, color:'var(--text-2)' }}>{a.type}</span>
                <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:500, background:P_STYLE[a.priority].bg, color:P_STYLE[a.priority].color, fontFamily:'var(--mono)' }}>{a.priority}</span>
                <span style={{ fontSize:12, fontWeight:500, color:S_STYLE[a.status].color }}>{a.status}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{a.response}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:12, color:'var(--text-3)', fontFamily:'var(--mono)' }}>{visible.length} alerts · Today · MOH Floor</div>
        </div>
      </main>
    </div>
  );
}
