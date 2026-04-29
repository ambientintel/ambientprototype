"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Floor data ──────────────────────────────────────────────────
const FLOOR_ROOMS = [
  { id:'MOH301', resident:'Evelyn Rodriguez',  initial:'E', status:'fall',     priority:'high',   lastEvent:'Fall detected',        ago:'2m',  walking:53,  falls:1 },
  { id:'MOH302', resident:'Harold Nakamura',   initial:'H', status:'movement', priority:'medium',  lastEvent:'Movement active',      ago:'4m',  walking:41,  falls:0 },
  { id:'MOH303', resident:'Dorothy Okafor',    initial:'D', status:'quiet',    priority:'low',    lastEvent:'Room quiet',           ago:'12m', walking:68,  falls:0 },
  { id:'MOH304', resident:'Margaret Kowalski', initial:'M', status:'movement', priority:'medium',  lastEvent:'Restlessness flagged', ago:'8m',  walking:29,  falls:0 },
  { id:'MOH305', resident:'Robert Chen',       initial:'R', status:'fall',     priority:'medium',  lastEvent:'Fall resolved',        ago:'31m', walking:18,  falls:1 },
  { id:'MOH306', resident:'Frances Williams',  initial:'F', status:'quiet',    priority:'low',    lastEvent:'Room quiet',           ago:'19m', walking:72,  falls:0 },
  { id:'MOH307', resident:'James Murphy',      initial:'J', status:'movement', priority:'medium',  lastEvent:'Movement detected',    ago:'6m',  walking:47,  falls:0 },
  { id:'MOH308', resident:'Alice Thompson',    initial:'A', status:'fall',     priority:'high',   lastEvent:'Fall detected',        ago:'18m', walking:12,  falls:1 },
  { id:'MOH309', resident:'George Martinez',   initial:'G', status:'quiet',    priority:'low',    lastEvent:'Room quiet',           ago:'25m', walking:61,  falls:0 },
  { id:'MOH310', resident:'Helen Park',        initial:'H', status:'movement', priority:'low',    lastEvent:'Movement detected',    ago:'9m',  walking:44,  falls:0 },
];

const LIVE_FEED = [
  { room:'MOH301', type:'fall',     label:'Fall detected',             ago:'2m ago' },
  { room:'MOH308', type:'fall',     label:'Fall detected',             ago:'18m ago' },
  { room:'MOH307', type:'movement', label:'Movement detected',         ago:'6m ago' },
  { room:'MOH310', type:'movement', label:'Movement detected',         ago:'9m ago' },
  { room:'MOH304', type:'movement', label:'Restlessness flagged',      ago:'8m ago' },
  { room:'MOH305', type:'fall',     label:'Fall resolved · no injury', ago:'31m ago' },
  { room:'MOH302', type:'movement', label:'Bathroom visit',            ago:'34m ago' },
  { room:'MOH303', type:'quiet',    label:'Room quiet · 12m',          ago:'12m ago' },
  { room:'MOH306', type:'quiet',    label:'Room quiet · stable',       ago:'19m ago' },
  { room:'MOH309', type:'quiet',    label:'Room quiet · 25m',          ago:'25m ago' },
];

const STATUS_COLOR: Record<string,string> = {
  fall:     '#FF6B6B',
  movement: '#FFC940',
  quiet:    '#3DCC91',
};

const PRIORITY_STYLE: Record<string,{bg:string,border:string,color:string}> = {
  high:   { bg:'rgba(255,107,107,0.12)', border:'rgba(255,107,107,0.35)', color:'#FF6B6B' },
  medium: { bg:'rgba(255,201,64,0.12)',  border:'rgba(255,201,64,0.35)',  color:'#FFC940' },
  low:    { bg:'rgba(61,204,145,0.12)',  border:'rgba(61,204,145,0.35)',  color:'#3DCC91' },
};

export default function OverviewPage() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [feedIdx, setFeedIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setFeedIdx(i => (i + 1) % LIVE_FEED.length), 3200);
    return () => clearInterval(id);
  }, []);

  const cst   = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h     = cst.getHours();
  const hh    = h % 12 || 12;
  const mm    = String(cst.getMinutes()).padStart(2,'0');
  const ampm  = h < 12 ? 'AM' : 'PM';
  const crumb = `${DAYS[cst.getDay()]} · ${MONTHS[cst.getMonth()]} ${cst.getDate()} · ${hh}:${mm} ${ampm} CST`;

  useEffect(() => {
    document.body.style.background = '#F0F0EE';
    return () => { document.body.style.background = ''; };
  }, []);

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
    color:           'var(--text)',
  } as React.CSSProperties;

  const activeAlerts  = FLOOR_ROOMS.filter(r => r.status === 'fall');
  const needsWatch    = FLOOR_ROOMS.filter(r => r.priority === 'medium');
  const stableRooms   = FLOOR_ROOMS.filter(r => r.priority === 'low');
  const totalFalls    = FLOOR_ROOMS.reduce((a,r) => a + r.falls, 0);

  const visibleFeed = [...LIVE_FEED, ...LIVE_FEED].slice(feedIdx, feedIdx + 5);

  return (
    <div className="app notion-theme" style={notion}>

      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/" style={{ textDecoration:'none', color:'inherit' }}>
          <div className="brand">
            <div className="brand-name">Ambient <em>Intelligence</em></div>
          </div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Views</div>
          {([
            ['/dashboard/overview', 'Overview',  <path key="ov" d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/>],
            ['/dashboard/floormap', 'Floor Map', <><rect key="fr" x="2.5" y="2.5" width="11" height="11" rx="1"/><path key="fp" d="M2.5 7h11M7 2.5v11"/></>],
            ['/dashboard/alerts',   'Alerts',    <><path key="al" d="M3.5 12.5h9l-1.5-2V7a3.5 3.5 0 10-7 0v3.5l-1.5 2z" strokeLinejoin="round"/><path key="ab" d="M6.5 13.5a1.5 1.5 0 003 0" strokeLinecap="round"/></>],
            ['/dashboard/reports',  'Reports',   <><rect key="re" x="3" y="2" width="10" height="12" rx="1"/><path key="rp" d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></>],
            ['/dashboard/analytics','Analytics', <><path key="an" d="M2.5 12.5h11M5 12.5V8.5M8 12.5V5M11 12.5V9.5" strokeLinecap="round"/></>],
            ['/dashboard/browse',   'Browse',    <><circle key="bc" cx="7" cy="7" r="4.5"/><path key="bp" d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/></>],
          ] as [string, string, React.ReactNode][]).map(([href, label, icon]) => {
            const active = href === '/dashboard/overview';
            return (
              <Link key={label} href={href} className={`nav-item${active ? ' active' : ''}`} style={{ textDecoration:'none', color:'inherit' }}>
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
                {label}
              </Link>
            );
          })}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Rooms</div>
          {FLOOR_ROOMS.map(r => (
            <div key={r.id} className="nav-item" style={{ cursor:'pointer' }}
              onClick={() => router.push(`/dashboard/room/${r.id}`)}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3" y="2.5" width="10" height="11" rx="1"/>
                <path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/>
              </svg>
              <span style={{ flex:1 }}>{r.id.replace('MOH','MOH ')}</span>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                background: r.priority === 'high' ? '#FF6B6B' : r.priority === 'medium' ? '#FFC940' : '#3DCC91',
                boxShadow: r.priority === 'high' ? '0 0 5px #FF6B6B' : r.priority === 'low' ? '0 0 4px #3DCC91' : 'none' }}/>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"/>
          <span>Sensors online · MOH 301–310</span>
        </div>
      </aside>

      {/* Main */}
      <main className="main">

        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="crumb">{crumb}</div>
            <h1 className="page-title">Floor <em>Overview</em></h1>
          </div>
          <div className="tool-group">
            <a href="/login" className="btn btn-ghost">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="8" cy="5" r="2.5"/>
                <path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round"/>
              </svg>
              Login
            </a>
          </div>
        </header>

        {/* ── Status strip ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          {[
            { label:'Residents',    value:'10', sub:'MOH 301–310',         color:'var(--accent)' },
            { label:'Active Alerts',value:String(activeAlerts.length),  sub:'Require attention', color:'#FF6B6B' },
            { label:'Falls Today',  value:String(totalFalls),            sub:'Across all rooms',  color:'#FF6B6B' },
            { label:'Stable Rooms', value:String(stableRooms.length),   sub:'No alerts',         color:'#3DCC91' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:12, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{s.label}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:28, fontWeight:600, color:s.color, lineHeight:1, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-4)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Active Alerts ── */}
        <div className="section-head">
          <h2 className="section-title">Active Alerts</h2>
          <div className="section-meta">{activeAlerts.length} requiring response</div>
        </div>
        <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:14, padding:'0 28px', marginBottom:28 }}>
          <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr 100px 120px', gap:16, padding:'12px 0', borderBottom:'1px solid var(--line)', fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            <div>Room</div><div>Resident</div><div>Event</div><div>Time</div><div style={{ textAlign:'right' }}>Priority</div>
          </div>
          {FLOOR_ROOMS.filter(r => r.priority !== 'low').map((r, i, arr) => {
            const ps = PRIORITY_STYLE[r.priority];
            return (
              <div key={r.id}
                onClick={() => router.push(`/dashboard/room/${r.id}`)}
                style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr 100px 120px', gap:16, padding:'16px 0', borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 'none', alignItems:'center', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(124,110,173,0.04)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
              >
                <div style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:600 }}>{r.id.replace('MOH','MOH ')}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:10, fontWeight:600, color:'var(--text-2)', flexShrink:0 }}>{r.initial}</div>
                  <span style={{ fontSize:13 }}>{r.resident}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_COLOR[r.status], display:'inline-block',
                    boxShadow: r.status==='fall' ? `0 0 5px ${STATUS_COLOR[r.status]}` : 'none' }}/>
                  <span style={{ fontFamily:'var(--mono)', fontSize:12, color:STATUS_COLOR[r.status] }}>{r.lastEvent}</span>
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{r.ago} ago</div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:4, border:`1px solid ${ps.border}`, background:ps.bg, color:ps.color, fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.06em' }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:ps.color, display:'inline-block' }}/>
                    {r.priority.charAt(0).toUpperCase()+r.priority.slice(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Room Status Grid + Live Feed ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, marginBottom:28 }}>

          {/* Room grid */}
          <div>
            <div className="section-head">
              <h2 className="section-title">Room Status</h2>
              <div className="section-meta">All 10 rooms</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {FLOOR_ROOMS.map(r => {
                const ps = PRIORITY_STYLE[r.priority];
                return (
                  <div key={r.id}
                    onClick={() => router.push(`/dashboard/room/${r.id}`)}
                    style={{ background:'var(--surface-1)', border:`1px solid var(--line)`, borderRadius:10, padding:'16px 18px', cursor:'pointer', transition:'all 0.15s', position:'relative', overflow:'hidden' }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor=ps.border)}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--line)')}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:600, color:'var(--text-2)' }}>{r.id.replace('MOH','MOH ')}</span>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[r.status], display:'inline-block',
                        boxShadow: r.status==='fall' ? `0 0 6px ${STATUS_COLOR[r.status]}` : 'none' }}/>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text)', marginBottom:6 }}>{r.resident}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)' }}>{r.lastEvent} · {r.ago} ago</div>
                    <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:3, borderRadius:2, background:'var(--surface-2)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(100,(r.walking/80)*100)}%`, background:STATUS_COLOR[r.status], borderRadius:2, transition:'width 0.5s' }}/>
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-4)' }}>{r.walking}m walk</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live feed */}
          <div>
            <div className="section-head">
              <h2 className="section-title">Live Feed</h2>
              <div className="section-meta" style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#3DCC91', display:'inline-block', boxShadow:'0 0 4px #3DCC91' }}/>
                Real-time
              </div>
            </div>
            <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:14, padding:'8px 20px', overflow:'hidden' }}>
              {visibleFeed.map((e, i) => (
                <div key={`${e.room}-${feedIdx}-${i}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i < visibleFeed.length-1 ? '1px solid var(--line)' : 'none', opacity: i===0 ? 1 : 1-(i*0.14), transition:'opacity 0.4s' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_COLOR[e.type], flexShrink:0,
                    boxShadow: e.type==='fall' ? `0 0 5px ${STATUS_COLOR[e.type]}` : 'none' }}/>
                  <span
                    style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--accent)', cursor:'pointer', flexShrink:0, letterSpacing:'0.04em' }}
                    onClick={() => router.push(`/dashboard/room/${e.room}`)}>
                    {e.room.replace('MOH','MOH ')}
                  </span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color: i===0 ? 'var(--text)' : 'var(--text-3)', flex:1 }}>{e.label}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-4)', flexShrink:0 }}>{e.ago}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="agent-note">— Ambient Intelligence · contactless monitoring · v3 preview —</div>
      </main>
    </div>
  );
}
