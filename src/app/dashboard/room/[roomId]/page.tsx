"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// ── Room profiles ──────────────────────────────────────────────
interface RoomProfile {
  resident: string;
  initial: string;
  alertLabel: string;
  alertType: 'fall' | 'movement' | 'quiet';
  priority: 'high' | 'medium' | 'low';
  ellaEyebrow: string;
  ellaNarrative: [string, string];
  ellaCallout: string;
  walking: number; walkingDelta: number;
  sitting: number; sittingDelta: number;
  falls: number;   fallsDelta: number;
  chartDelta: string;
  chartPath: string;
  chartPrev: string;
}

const ROOMS: Record<string, RoomProfile> = {
  MOH301: {
    resident: 'Evelyn Rodriguez', initial: 'E',
    alertLabel: 'Detected', alertType: 'fall', priority: 'high',
    ellaEyebrow: 'Overnight summary · 11:00 PM → 10:30 AM',
    ellaNarrative: [
      'Evelyn had a calm and positive night. She settled into bed shortly after 11 PM and remained peacefully asleep until around 4:30 AM, when the height sensor shows she got up briefly — likely a bathroom visit — before returning to bed without incident.',
      'She rose for the day just before 7 AM, which is her usual pattern. Since getting up, her overall activity has been excellent: the tracker shows a steady and strong upward trend through the morning, reaching the highest levels we\'ve seen from her all week.',
    ],
    ellaCallout: '+21% above her 7-day average by late morning.',
    walking: 53, walkingDelta: -21, sitting: 201, sittingDelta: 10, falls: 1, fallsDelta: 1,
    chartDelta: '+21',
    chartPath: 'M48,225 L100,222 L150,228 L200,226 L250,224 L300,210 L350,160 L400,165 L450,148 L500,140 L550,120 L600,108 L650,90 L700,72 L750,55 L800,48 L860,40',
    chartPrev: 'M48,170 C140,168 220,164 320,160 C420,156 520,152 620,150 C720,148 820,144 860,142',
  },
  MOH302: {
    resident: 'Harold Nakamura', initial: 'H',
    alertLabel: 'Active', alertType: 'movement', priority: 'medium',
    ellaEyebrow: 'Morning summary · 6:00 AM → 10:30 AM',
    ellaNarrative: [
      'Harold slept through the night without interruption, with no movement events recorded between 10:45 PM and 6:10 AM. He rose at his typical time and completed his morning routine independently.',
      'Activity levels this morning are slightly below his weekly average, though within normal variance. No fall events detected. Gait pattern consistent with prior week readings.',
    ],
    ellaCallout: 'Activity 8% below 7-day average — within normal range.',
    walking: 41, walkingDelta: -8, sitting: 187, sittingDelta: -4, falls: 0, fallsDelta: 0,
    chartDelta: '−8',
    chartPath: 'M48,200 L100,198 L150,202 L200,200 L250,195 L300,190 L350,185 L400,182 L450,178 L500,172 L550,168 L600,162 L650,155 L700,150 L750,148 L800,145 L860,142',
    chartPrev: 'M48,160 C140,158 220,155 320,152 C420,149 520,147 620,145 C720,143 820,140 860,138',
  },
  MOH303: {
    resident: 'Dorothy Okafor', initial: 'D',
    alertLabel: 'None', alertType: 'quiet', priority: 'low',
    ellaEyebrow: 'Overnight summary · 10:30 PM → 10:15 AM',
    ellaNarrative: [
      'Dorothy had an excellent night — one of her best this week. She went to bed at 10:30 PM and slept uninterrupted until 7:20 AM, a full 8h 50m rest period with no nighttime movement events.',
      'Morning activity is trending positively. She completed her walk to the dining room independently and has been engaged in social activity for the past 45 minutes. No alerts of any kind.',
    ],
    ellaCallout: 'Zero alerts in the past 7 days — best streak this month.',
    walking: 68, walkingDelta: 14, sitting: 165, sittingDelta: -12, falls: 0, fallsDelta: 0,
    chartDelta: '+14',
    chartPath: 'M48,215 L100,210 L150,205 L200,195 L250,180 L300,165 L350,150 L400,138 L450,125 L500,115 L550,105 L600,95 L650,82 L700,70 L750,60 L800,52 L860,45',
    chartPrev: 'M48,190 C140,185 220,178 320,170 C420,162 520,155 620,148 C720,142 820,138 860,135',
  },
  MOH304: {
    resident: 'Margaret Kowalski', initial: 'M',
    alertLabel: 'Watch', alertType: 'movement', priority: 'medium',
    ellaEyebrow: 'Overnight summary · 11:30 PM → 10:00 AM',
    ellaNarrative: [
      'Margaret had a disrupted night with elevated movement events between 1:15 AM and 3:40 AM. The sensor recorded 7 position changes during this window, suggesting sleep disruption or discomfort. No fall events occurred.',
      'Morning activity is reduced compared to her baseline, likely related to the overnight disruption. She has been seated since 8:45 AM. A nursing check-in is recommended.',
    ],
    ellaCallout: 'Nighttime movement events up 3× vs. 7-day average.',
    walking: 29, walkingDelta: -34, sitting: 218, sittingDelta: 22, falls: 0, fallsDelta: 0,
    chartDelta: '−34',
    chartPath: 'M48,180 L100,182 L150,185 L200,190 L250,195 L300,200 L350,205 L400,208 L450,210 L500,205 L550,200 L600,195 L650,192 L700,188 L750,185 L800,183 L860,180',
    chartPrev: 'M48,150 C140,148 220,145 320,142 C420,139 520,138 620,137 C720,136 820,135 860,134',
  },
  MOH305: {
    resident: 'Robert Chen', initial: 'R',
    alertLabel: 'Resolved', alertType: 'fall', priority: 'medium',
    ellaEyebrow: 'Fall event summary · 7:42 AM',
    ellaNarrative: [
      'Robert experienced a fall event at 7:42 AM near the bathroom entry. Staff responded within 90 seconds; no injury was reported. The resident was assisted back to a seated position and assessed on-site.',
      'Activity since the event has been minimal — Robert has remained seated as a precaution. Gait instability near the bathroom has been noted twice this week. Physical therapy consult is recommended.',
    ],
    ellaCallout: 'Second fall event this week — PT consult flagged.',
    walking: 18, walkingDelta: -55, sitting: 230, sittingDelta: 31, falls: 1, fallsDelta: 1,
    chartDelta: '−55',
    chartPath: 'M48,210 L100,208 L150,205 L200,200 L250,195 L300,188 L350,190 L400,220 L450,225 L500,218 L550,215 L600,212 L650,210 L700,208 L750,206 L800,204 L860,202',
    chartPrev: 'M48,165 C140,162 220,158 320,155 C420,152 520,150 620,148 C720,146 820,144 860,143',
  },
  MOH306: {
    resident: 'Frances Williams', initial: 'F',
    alertLabel: 'None', alertType: 'quiet', priority: 'low',
    ellaEyebrow: 'Morning summary · 6:30 AM → 10:30 AM',
    ellaNarrative: [
      'Frances had a stable and restful night. Movement events were minimal and all within expected ranges. She woke at 6:30 AM and completed her morning hygiene routine without assistance.',
      'Activity this morning is consistent with her weekly average. She participated in the group exercise session from 9:00–9:45 AM — her third consecutive week of attendance. No alerts.',
    ],
    ellaCallout: 'Consistent routine maintained — third week of exercise attendance.',
    walking: 72, walkingDelta: 9, sitting: 155, sittingDelta: -8, falls: 0, fallsDelta: 0,
    chartDelta: '+9',
    chartPath: 'M48,200 L100,195 L150,188 L200,178 L250,165 L300,152 L350,142 L400,132 L450,122 L500,112 L550,102 L600,92 L650,82 L700,75 L750,68 L800,62 L860,58',
    chartPrev: 'M48,175 C140,170 220,165 320,158 C420,152 520,147 620,142 C720,138 820,135 860,133',
  },
  MOH307: {
    resident: 'James Murphy', initial: 'J',
    alertLabel: 'Active', alertType: 'movement', priority: 'medium',
    ellaEyebrow: 'Overnight summary · 10:00 PM → 9:45 AM',
    ellaNarrative: [
      'James had moderate overnight activity. Two bathroom visits were recorded at 12:30 AM and 4:10 AM — consistent with his historical pattern. He returned to bed without incident on both occasions.',
      'Morning activity is near average. He has been ambulatory since 8:15 AM with good gait consistency. No fall events. Medication administration confirmed at 9:00 AM.',
    ],
    ellaCallout: 'Activity within normal range — no intervention needed.',
    walking: 47, walkingDelta: 3, sitting: 192, sittingDelta: 5, falls: 0, fallsDelta: 0,
    chartDelta: '+3',
    chartPath: 'M48,205 L100,200 L150,198 L200,195 L250,188 L300,178 L350,168 L400,158 L450,148 L500,140 L550,132 L600,125 L650,118 L700,112 L750,108 L800,104 L860,100',
    chartPrev: 'M48,168 C140,165 220,162 320,158 C420,155 520,152 620,150 C720,148 820,146 860,145',
  },
  MOH308: {
    resident: 'Alice Thompson', initial: 'A',
    alertLabel: 'Detected', alertType: 'fall', priority: 'high',
    ellaEyebrow: 'Fall event summary · 9:12 AM',
    ellaNarrative: [
      'Alice experienced a fall event at 9:12 AM in the room near the bed. Staff responded within 2 minutes. A minor abrasion was noted on her right forearm; wound care was applied. She is currently resting in bed.',
      'This is Alice\'s first fall event this month. Prior to this morning, her activity levels had been trending positively. Close monitoring is advised for the next 24 hours. Family has been notified.',
    ],
    ellaCallout: 'First fall event this month — family notified, monitoring increased.',
    walking: 12, walkingDelta: -68, sitting: 245, sittingDelta: 40, falls: 1, fallsDelta: 1,
    chartDelta: '−68',
    chartPath: 'M48,195 L100,190 L150,185 L200,178 L250,170 L300,162 L350,155 L400,148 L450,225 L500,222 L550,220 L600,218 L650,216 L700,215 L750,214 L800,213 L860,212',
    chartPrev: 'M48,155 C140,150 220,145 320,140 C420,136 520,133 620,130 C720,128 820,126 860,125',
  },
  MOH309: {
    resident: 'George Martinez', initial: 'G',
    alertLabel: 'None', alertType: 'quiet', priority: 'low',
    ellaEyebrow: 'Morning summary · 7:00 AM → 10:30 AM',
    ellaNarrative: [
      'George had an unremarkable and restful night. No movement events outside of two brief position adjustments around 3 AM, both within normal range. He woke naturally at 7:00 AM.',
      'Morning activity is slightly above his weekly average, driven by a longer ambulation session before breakfast. He is currently in the common area. No alerts in the past 5 days.',
    ],
    ellaCallout: 'Five consecutive alert-free days — positive trend.',
    walking: 61, walkingDelta: 7, sitting: 172, sittingDelta: -6, falls: 0, fallsDelta: 0,
    chartDelta: '+7',
    chartPath: 'M48,208 L100,202 L150,195 L200,185 L250,172 L300,160 L350,148 L400,138 L450,128 L500,118 L550,108 L600,98 L650,90 L700,82 L750,76 L800,70 L860,65',
    chartPrev: 'M48,172 C140,168 220,163 320,158 C420,154 520,150 620,147 C720,144 820,142 860,140',
  },
  MOH310: {
    resident: 'Helen Park', initial: 'H',
    alertLabel: 'Active', alertType: 'movement', priority: 'low',
    ellaEyebrow: 'Morning summary · 6:45 AM → 10:30 AM',
    ellaNarrative: [
      'Helen had a quiet and uninterrupted night. She woke at 6:45 AM, slightly earlier than her typical 7:15 AM pattern. Movement to the bathroom was recorded at 7:00 AM; she returned to bed briefly before rising for the day.',
      'Activity this morning is consistent with her weekly average. No fall events or alerts. She attended the morning social hour and returned to her room at 10:05 AM.',
    ],
    ellaCallout: 'Consistent pattern — no concerns flagged.',
    walking: 44, walkingDelta: 2, sitting: 180, sittingDelta: 3, falls: 0, fallsDelta: 0,
    chartDelta: '+2',
    chartPath: 'M48,202 L100,198 L150,194 L200,188 L250,180 L300,170 L350,162 L400,154 L450,146 L500,138 L550,130 L600,122 L650,115 L700,110 L750,106 L800,102 L860,99',
    chartPrev: 'M48,165 C140,162 220,158 320,154 C420,151 520,148 620,146 C720,144 820,142 860,141',
  },
};

const PRIORITY_STYLE: Record<string,{bg:string,border:string,color:string}> = {
  high:   { bg:'rgba(255,107,107,0.12)', border:'rgba(255,107,107,0.35)', color:'#FF6B6B' },
  medium: { bg:'rgba(255,201,64,0.12)',  border:'rgba(255,201,64,0.35)',  color:'#FFC940' },
  low:    { bg:'rgba(61,204,145,0.12)',  border:'rgba(61,204,145,0.35)',  color:'#3DCC91' },
};

const ALERT_COLOR: Record<string,string> = {
  fall:     '#FF6B6B',
  movement: '#FFC940',
  quiet:    '#3DCC91',
};

const ROOMS_LIST = [
  'MOH301','MOH302','MOH303','MOH304','MOH305',
  'MOH306','MOH307','MOH308','MOH309','MOH310',
];

export default function RoomDashboard() {
  const params   = useParams();
  const router   = useRouter();
  const roomId   = (Array.isArray(params.roomId) ? params.roomId[0] : params.roomId) ?? 'MOH301';
  const room     = ROOMS[roomId] ?? ROOMS['MOH301'];

  const [activeView,  setActiveView]  = useState('list');
  const [speaking,    setSpeaking]    = useState(false);
  const [alertOpen,   setAlertOpen]   = useState(false);
  const [acknowledged,setAcknowledged]= useState(false);
  const [now,         setNow]         = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Reset state when room changes
  useEffect(() => {
    setAlertOpen(false);
    setAcknowledged(false);
    setSpeaking(false);
  }, [roomId]);

  const cst   = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h     = cst.getHours();
  const hh    = h % 12 || 12;
  const mm    = String(cst.getMinutes()).padStart(2,'0');
  const ampm  = h < 12 ? 'AM' : 'PM';
  const crumb = `${DAYS[cst.getDay()]} · ${MONTHS[cst.getMonth()]} ${cst.getDate()} · ${hh}:${mm} ${ampm} CST`;
  const todayLabel = `${MONTHS[cst.getMonth()]} ${cst.getDate()}`;
  const chartSub   = `${MONTHS[cst.getMonth()]} ${cst.getDate()} · hourly`;

  const ps = PRIORITY_STYLE[room.priority];

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

  return (
    <div className="app notion-theme" style={notion}>

      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/home" style={{ textDecoration:'none', color:'inherit' }}>
          <div className="brand">
            <div className="brand-name">Ambient <em>Demo</em></div>
          </div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Views</div>
          {([
            ['/dashboard/overview',         'Overview',  <path key="ov" d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/>],
            ['/dashboard/floormap',        'Floor Map', <><rect key="fr" x="2.5" y="2.5" width="11" height="11" rx="1"/><path key="fp" d="M2.5 7h11M7 2.5v11"/></>],
            ['/dashboard/alerts',          'Alerts',    <><path key="al" d="M3.5 12.5h9l-1.5-2V7a3.5 3.5 0 10-7 0v3.5l-1.5 2z" strokeLinejoin="round"/><path key="ab" d="M6.5 13.5a1.5 1.5 0 003 0" strokeLinecap="round"/></>],
            ['/dashboard/reports',         'Reports',   <><rect key="re" x="3" y="2" width="10" height="12" rx="1"/><path key="rp" d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></>],
            ['/dashboard/analytics',       'Analytics', <><path key="an" d="M2.5 12.5h11M5 12.5V8.5M8 12.5V5M11 12.5V9.5" strokeLinecap="round"/></>],
            ['/dashboard/browse',          'Browse',    <><circle key="bc" cx="7" cy="7" r="4.5"/><path key="bp" d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/></>],
          ] as [string, string, React.ReactNode][]).map(([href, label, icon]) => (
            <Link key={label} href={href} className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </Link>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Rooms</div>
          {ROOMS_LIST.map(id => {
            const r = ROOMS[id];
            const isActive = id === roomId;
            return (
              <div
                key={id}
                className={`nav-item${isActive ? ' active' : ''}`}
                style={{ cursor:'pointer' }}
                onClick={() => router.push(`/dashboard/room/${id}`)}
              >
                <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <rect x="3" y="2.5" width="10" height="11" rx="1"/>
                  <path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/>
                </svg>
                <span style={{ flex:1 }}>{id.replace('MOH','MOH ')}</span>
                {r.priority !== 'low' && (
                  <span style={{
                    width:6, height:6, borderRadius:'50%', flexShrink:0,
                    background: r.priority === 'high' ? '#FF6B6B' : '#FFC940',
                    boxShadow: r.priority === 'high' ? '0 0 5px #FF6B6B' : 'none',
                  }}/>
                )}
              </div>
            );
          })}
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
            <h1 className="page-title">{roomId.replace('MOH','MOH ')} <em>· {room.resident}</em></h1>
          </div>
          <div className="tool-group">
            <a href="/" className="btn btn-ghost">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="8" cy="5" r="2.5"/>
                <path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round"/>
              </svg>
              Login
            </a>
          </div>
        </header>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="tool-group">
            <div className="search">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="4.5"/>
                <path d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search residents, rooms, events…"/>
            </div>
            <button className="btn btn-ghost">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M2.5 4h11M4.5 8h7M6.5 12h3" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
          </div>
          <div className="view-toggle">
            {[
              { id:'list', title:'List view',     icon:<path d="M3 4.5h10M3 8h10M3 11.5h10" strokeLinecap="round"/> },
              { id:'grid', title:'Grid view',     icon:<><rect x="3" y="3" width="4" height="4" rx="0.5"/><rect x="9" y="3" width="4" height="4" rx="0.5"/><rect x="3" y="9" width="4" height="4" rx="0.5"/><rect x="9" y="9" width="4" height="4" rx="0.5"/></> },
              { id:'cal',  title:'Calendar view', icon:<><rect x="2.5" y="3.5" width="11" height="10" rx="1"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" strokeLinecap="round"/></> },
            ].map(({ id, title, icon }) => (
              <button key={id} title={title} className={activeView===id ? 'active' : ''} onClick={()=>setActiveView(id)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              </button>
            ))}
          </div>
        </div>

        {/* ── Alerts section ── */}
        <div className="section-head">
          <h2 className="section-title">Alerts</h2>
        </div>

        <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:14, padding:'0 28px', marginBottom:24 }}>
          {/* Header row */}
          <div style={{ display:'flex', gap:24, alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--line)', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            <div style={{ width:90, flexShrink:0 }}>Room</div>
            <div style={{ flex:1 }}>Fall</div>
            <div style={{ flex:1 }}>Time</div>
            <div style={{ flex:1 }}>Date</div>
            <div style={{ marginLeft:'auto' }}>Priority</div>
          </div>

          {/* Data row */}
          <div style={{ display:'flex', gap:24, alignItems:'center', padding:'18px 0', fontSize:14 }}>
            <div style={{ width:90, flexShrink:0, fontFamily:'var(--mono)', fontSize:12, fontWeight:500 }}>{roomId.replace('MOH','MOH ')}</div>
            <div style={{ flex:1 }}>
              <span className={`priority ${room.alertType==='fall' ? 'high' : room.alertType==='movement' ? 'medium' : ''}`} style={{ color: ALERT_COLOR[room.alertType] }}>
                <span className="priority-dot" style={{ background: ALERT_COLOR[room.alertType] }}/>
                {room.alertLabel}
              </span>
            </div>
            <div style={{ flex:1, fontFamily:'var(--mono)', fontSize:13 }}>{`${hh}:${mm} ${ampm}`}</div>
            <div style={{ flex:1, fontFamily:'var(--mono)', fontSize:13 }}>{todayLabel}</div>
            <div style={{ marginLeft:'auto' }}>
              <button
                onClick={() => setAlertOpen(o=>!o)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:4, border:`1px solid ${ps.border}`, background: acknowledged ? 'rgba(61,204,145,0.12)' : ps.bg, color: acknowledged ? '#3DCC91' : ps.color, fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.08em', cursor:'pointer', fontWeight:500, transition:'all 0.2s' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: acknowledged ? '#3DCC91' : ps.color, display:'inline-block', flexShrink:0 }}/>
                {acknowledged ? 'Acknowledged' : room.priority.charAt(0).toUpperCase()+room.priority.slice(1)}
              </button>
            </div>
          </div>

          {/* Expandable alert detail */}
          {alertOpen && (
            <div style={{ borderTop:'1px solid var(--line)', padding:'20px 0 24px', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', gap:32 }}>
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Sensor ID</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13 }}>IWR6843-{roomId}</div>
                </div>
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Event type</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13, textTransform:'capitalize' }}>{room.alertType} detection</div>
                </div>
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Response time</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13 }}>1m 34s</div>
                </div>
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Status</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13, color: acknowledged ? '#3DCC91' : ps.color }}>{acknowledged ? 'Acknowledged' : 'Awaiting response'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {!acknowledged && (
                  <button
                    onClick={()=>{ setAcknowledged(true); setAlertOpen(false); }}
                    style={{ padding:'8px 20px', borderRadius:6, border:'1px solid rgba(61,204,145,0.4)', background:'rgba(61,204,145,0.1)', color:'#3DCC91', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.08em', cursor:'pointer' }}>
                    Acknowledge alert
                  </button>
                )}
                <button
                  onClick={()=>setAlertOpen(false)}
                  style={{ padding:'8px 20px', borderRadius:6, border:'1px solid var(--line)', background:'transparent', color:'var(--text-3)', fontFamily:'var(--mono)', fontSize:11, letterSpacing:'0.08em', cursor:'pointer' }}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Ella AI Daily Update ── */}
        <div className="section-head">
          <h2 className="section-title">Ella AI <em>daily update</em></h2>
          <div className="section-meta">Generated {`${hh}:${mm} ${ampm}`} · Confidence 0.94</div>
        </div>

        <article className="ella">
          <div className="portrait">
            <div className="silhouette"/>
            <div className="badge">{room.resident.split(' ')[0]} · {roomId.replace('MOH','Room ')}</div>
          </div>
          <div className="ella-body">
            <div className="ella-eyebrow">
              <span className="pulse"/>
              {room.ellaEyebrow}
            </div>
            <div className="narrative">
              <p>{room.ellaNarrative[0]}</p>
              <p>{room.ellaNarrative[1]} <span className="accent-text">({room.ellaCallout})</span></p>
            </div>
            <div className="ella-actions">
              <button className="speak-btn" onClick={()=>setSpeaking(s=>!s)}>
                <span className="play-circle">
                  <svg viewBox="0 0 12 12" fill="currentColor">
                    {speaking
                      ? <><rect x="3.5" y="3" width="2" height="6"/><rect x="6.5" y="3" width="2" height="6"/></>
                      : <path d="M3 2l7 4-7 4z"/>}
                  </svg>
                </span>
                {speaking ? 'Pause' : 'Speak'}
              </button>
              <span className="speak-meta">1 min 14 sec · Ella v3</span>
            </div>
          </div>
        </article>

        {/* ── Activity chart ── */}
        <div className="chart-card">
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Activity</h3>
              <div className="chart-sub">{chartSub}</div>
            </div>
            <div className="delta-badge">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d={room.chartDelta.startsWith('+') ? 'M2.5 8L6 4.5L9.5 8' : 'M2.5 4L6 7.5L9.5 4'} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {room.chartDelta}
            </div>
          </div>
          <svg className="chart" viewBox="0 0 880 260" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97757" stopOpacity="0.20"/>
                <stop offset="100%" stopColor="#D97757" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <line className="grid-line" x1="48" y1="30"  x2="860" y2="30"/>
            <line className="grid-line" x1="48" y1="85"  x2="860" y2="85"/>
            <line className="grid-line" x1="48" y1="140" x2="860" y2="140"/>
            <line className="grid-line" x1="48" y1="195" x2="860" y2="195"/>
            <line className="grid-line" x1="48" y1="230" x2="860" y2="230"/>
            <text className="axis-label" x="38" y="34"  textAnchor="end">1000</text>
            <text className="axis-label" x="38" y="89"  textAnchor="end">750</text>
            <text className="axis-label" x="38" y="144" textAnchor="end">500</text>
            <text className="axis-label" x="38" y="199" textAnchor="end">250</text>
            <text className="axis-label" x="38" y="234" textAnchor="end">0</text>
            <path className="trend-prev" d={room.chartPrev}/>
            <path className="trend" d={room.chartPath}/>
            <text className="axis-label" x="48"  y="252">12 AM</text>
            <text className="axis-label" x="200" y="252">3 AM</text>
            <text className="axis-label" x="350" y="252">6 AM</text>
            <text className="axis-label" x="500" y="252">8 AM</text>
            <text className="axis-label" x="650" y="252">10 AM</text>
            <text className="axis-label" x="855" y="252" textAnchor="end">12 PM</text>
          </svg>
          <div className="chart-legend">
            <div className="legend-item"><span className="legend-swatch solid"/> Today · {todayLabel}</div>
            <div className="legend-item"><span className="legend-swatch dashed"/> 7-day average</div>
          </div>
        </div>

        {/* ── Stat tiles ── */}
        <div className="stats">
          <div className="stat is-accent">
            <div className="stat-label">Walking</div>
            <div className="stat-value">{room.walking}</div>
            <div className="stat-unit">Estimated minutes</div>
            <div className="stat-foot">
              <span className={`stat-delta ${room.walkingDelta >= 0 ? 'up' : 'down'}`}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d={room.walkingDelta>=0 ? 'M2.5 8L6 4.5L9.5 8' : 'M2.5 4L6 7.5L9.5 4'} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {room.walkingDelta >= 0 ? '+' : ''}{room.walkingDelta}
              </span>
            </div>
          </div>
          <div className="stat is-accent">
            <div className="stat-label">Sitting</div>
            <div className="stat-value">{room.sitting}</div>
            <div className="stat-unit">Estimated minutes</div>
            <div className="stat-foot">
              <span className={`stat-delta ${room.sittingDelta >= 0 ? 'up' : 'down'}`}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d={room.sittingDelta>=0 ? 'M2.5 8L6 4.5L9.5 8' : 'M2.5 4L6 7.5L9.5 4'} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {room.sittingDelta >= 0 ? '+' : ''}{room.sittingDelta}
              </span>
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Falls</div>
            <div className="stat-value">{room.falls}</div>
            <div className="stat-unit">Detected today</div>
            <div className="stat-foot">
              <span className={`stat-delta ${room.fallsDelta === 0 ? 'flat' : 'down'}`}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d={room.fallsDelta===0 ? 'M2.5 6L9.5 6' : 'M2.5 4L6 7.5L9.5 4'} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {room.fallsDelta === 0 ? '+0' : `+${room.fallsDelta}`}
              </span>
            </div>
          </div>
        </div>

        <div className="agent-note">— Ambient Intelligence · contactless monitoring · v3 preview —</div>

      </main>
    </div>
  );
}
