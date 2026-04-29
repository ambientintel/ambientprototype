'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ROOM_PRIORITY: Record<string, 'high' | 'medium' | 'low'> = {
  MOH301: 'high', MOH302: 'medium', MOH303: 'low', MOH304: 'medium',
  MOH305: 'medium', MOH306: 'low',  MOH307: 'medium', MOH308: 'high',
  MOH309: 'low',   MOH310: 'low',
};

const RESIDENTS = [
  { room:'MOH 301', name:'Evelyn Rodriguez',  priority:'High',   lastVisit:'10:23 am', date:'Dec 5', owner:'Dr. Marisol Vega', alerts:3, status:'Active alert'  },
  { room:'MOH 302', name:'Harold Nakamura',   priority:'High',   lastVisit:'9:47 am',  date:'Dec 5', owner:'Dr. Marisol Vega', alerts:2, status:'Active alert'  },
  { room:'MOH 303', name:'Dorothy Okafor',    priority:'Low',    lastVisit:'8:15 am',  date:'Dec 4', owner:'Nurse J. Park',    alerts:0, status:'Stable'        },
  { room:'MOH 304', name:'Margaret Kowalski', priority:'Medium', lastVisit:'11:02 am', date:'Dec 5', owner:'Dr. Marisol Vega', alerts:1, status:'Watch'         },
  { room:'MOH 305', name:'Robert Steinberg',  priority:'High',   lastVisit:'7:58 am',  date:'Dec 5', owner:'Nurse J. Park',    alerts:4, status:'Active alert'  },
  { room:'MOH 306', name:'Agnes Thornton',    priority:'Low',    lastVisit:'9:30 am',  date:'Dec 3', owner:'Dr. Marisol Vega', alerts:0, status:'Stable'        },
  { room:'MOH 307', name:'Walter Chen',       priority:'Medium', lastVisit:'10:45 am', date:'Dec 5', owner:'Nurse J. Park',    alerts:1, status:'Watch'         },
  { room:'MOH 308', name:'Beatrice Fontaine', priority:'Low',    lastVisit:'8:40 am',  date:'Dec 4', owner:'Dr. Marisol Vega', alerts:0, status:'Stable'        },
  { room:'MOH 309', name:'Franklin Oduya',    priority:'High',   lastVisit:'11:18 am', date:'Dec 5', owner:'Nurse J. Park',    alerts:3, status:'Active alert'  },
  { room:'MOH 310', name:'Clara Petersen',    priority:'Medium', lastVisit:'9:05 am',  date:'Dec 4', owner:'Dr. Marisol Vega', alerts:1, status:'Watch'         },
];

const P_STYLE: Record<string,{bg:string;color:string}> = {
  High:   { bg:'rgba(192,57,43,0.10)',  color:'#a02020' },
  Medium: { bg:'rgba(184,131,10,0.10)', color:'#8a6200' },
  Low:    { bg:'rgba(58,155,92,0.08)',  color:'#2e7d4f' },
};

export default function BrowsePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriority] = useState('All');
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
  const visible = RESIDENTS.filter(r => {
    const matchSearch = search === '' || r.name.toLowerCase().includes(search.toLowerCase()) || r.room.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

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
            <Link href="/dashboard/browse" className={"nav-item active"} style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{<><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/></>}</svg>
              Browse
            </Link>
        </nav>
        <nav className="nav-section">
          <div className="nav-label">Rooms</div>
            <div key="MOH 301" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH301')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 301</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH301'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH301'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH301'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH301'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 302" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH302')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 302</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH302'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH302'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH302'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH302'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 303" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH303')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 303</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH303'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH303'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH303'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH303'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 304" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH304')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 304</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH304'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH304'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH304'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH304'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 305" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH305')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 305</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH305'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH305'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH305'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH305'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 306" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH306')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 306</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH306'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH306'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH306'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH306'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 307" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH307')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 307</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH307'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH307'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH307'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH307'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 308" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH308')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 308</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH308'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH308'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH308'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH308'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 309" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH309')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 309</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH309'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH309'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH309'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH309'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
            <div key="MOH 310" className="nav-item" onClick={()=>router.push('/dashboard/room/MOH310')}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/></svg>
              <span style={{ flex:1 }}>MOH 310</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: ROOM_PRIORITY['MOH310'] === 'high' ? '#FF6B6B' : ROOM_PRIORITY['MOH310'] === 'medium' ? '#FFC940' : '#3DCC91', boxShadow: ROOM_PRIORITY['MOH310'] === 'high' ? '0 0 5px #FF6B6B' : ROOM_PRIORITY['MOH310'] === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
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
            <h1 className="page-title">Browse <em>Residents</em></h1>
          </div>
          <div className="tool-group"><a href="/login" className="btn btn-ghost"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5" r="2.5"/><path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round"/></svg>Login</a></div>
        </header>
        <div style={{ padding:'0 40px 40px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or room…" className="search" style={{ flex:1, maxWidth:320 }}/>
            <div style={{ display:'flex', gap:6 }}>
              {['All','High','Medium','Low'].map(p=>(
                <button key={p} onClick={()=>setPriority(p)} style={{ fontFamily:'var(--mono)', fontSize:11, padding:'5px 12px', borderRadius:6, border:'1px solid var(--line)', background: priorityFilter===p ? 'var(--accent)' : 'var(--surface-1)', color: priorityFilter===p ? 'white' : 'var(--text-2)', cursor:'pointer' }}>{p}</button>
              ))}
            </div>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-4)', marginLeft:'auto' }}>{visible.length} residents</span>
          </div>
          <div style={{ border:'1px solid var(--line)', borderRadius:8, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 80px 90px 90px 1fr 60px', gap:16, padding:'10px 20px', background:'var(--surface-2)', borderBottom:'1px solid var(--line)' }}>
              {['Room','Name','Priority','Last Visit','Date','Owner','Alerts'].map(h=>(
                <span key={h} style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-4)' }}>{h}</span>
              ))}
            </div>
            {visible.map((r,i)=>(
              <div key={r.room} style={{ display:'grid', gridTemplateColumns:'100px 1fr 80px 90px 90px 1fr 60px', gap:16, padding:'13px 20px', borderBottom: i<visible.length-1 ? '1px solid var(--line)' : 'none', alignItems:'center', background: r.priority==='High' ? 'rgba(192,57,43,0.03)' : 'transparent' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-2)' }}>{r.room}</span>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{r.name}</span>
                <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:500, background:P_STYLE[r.priority].bg, color:P_STYLE[r.priority].color, fontFamily:'var(--mono)' }}>{r.priority}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{r.lastVisit}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{r.date}</span>
                <span style={{ fontSize:12, color:'var(--text-2)' }}>{r.owner}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:12, color: r.alerts>0 ? '#a02020' : 'var(--text-4)', fontWeight: r.alerts>0 ? 600 : 400 }}>{r.alerts}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
