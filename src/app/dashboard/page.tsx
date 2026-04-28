"use client";
import Link from "next/link";

import { useState, useEffect } from "react";

export default function PatientDashboard() {
  const [activeNav, setActiveNav] = useState("Home");
  const [activeView, setActiveView] = useState("list");
  const [speaking, setSpeaking] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h = now.getHours();
  const timeOfDay =
    h < 5  ? 'Late night' :
    h < 8  ? 'Early morning' :
    h < 10 ? 'Morning' :
    h < 12 ? 'Late morning' :
    h < 13 ? 'Midday' :
    h < 15 ? 'Afternoon' :
    h < 17 ? 'Mid afternoon' :
    h < 19 ? 'Late afternoon' :
    h < 21 ? 'Evening' : 'Night';
  const crumb = `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()} · ${timeOfDay}`;

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
    '--sage':        'oklch(0.55 0.07 155)',
    color:           'var(--text)',
  } as React.CSSProperties;

  return (
    <div className="app notion-theme" style={notion}>

      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/home" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">
            <div className="brand-name">Ambient <em>Demo</em></div>
          </div>
        </Link>

        <nav className="nav-section">
          <div className="nav-label">Views</div>
          {[
            { label: "Overview",   icon: <path d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round" /> },
            { label: "Floor Map",  icon: <><rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M2.5 7h11M7 2.5v11"/></> },
            { label: "Alerts",     icon: <><path d="M3.5 12.5h9l-1.5-2V7a3.5 3.5 0 10-7 0v3.5l-1.5 2z" strokeLinejoin="round"/><path d="M6.5 13.5a1.5 1.5 0 003 0" strokeLinecap="round"/></> },
            { label: "Browse",     icon: <><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L13.5 13.5" strokeLinecap="round"/></> },
            { label: "Reports",    icon: <><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></> },
            { label: "Analytics",  icon: <><path d="M2.5 12.5h11M5 12.5V8.5M8 12.5V5M11 12.5V9.5" strokeLinecap="round"/></> },
          ].map(({ label, icon }) => (
            <div
              key={label}
              className={`nav-item${activeNav === label ? " active" : ""}`}
              onClick={() => setActiveNav(label)}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </div>
          ))}
        </nav>

        <nav className="nav-section">
          <div className="nav-label">Rooms</div>
          {[
            "MOH 301","MOH 302","MOH 303","MOH 304","MOH 305",
            "MOH 306","MOH 307","MOH 308","MOH 309","MOH 310",
          ].map((room) => (
            <div
              key={room}
              className={`nav-item${activeNav === room ? " active" : ""}`}
              onClick={() => setActiveNav(room)}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3" y="2.5" width="10" height="11" rx="1"/>
                <path d="M6.5 13.5V10a1.5 1.5 0 013 0v3.5" strokeLinecap="round"/>
              </svg>
              {room}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Sensors online · 142 rooms</span>
        </div>
      </aside>

      {/* Main */}
      <main className="main">

        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="crumb">{crumb}</div>
            <h1 className="page-title">Nurse <em>Dashboard</em></h1>
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
              <input type="text" placeholder="Search residents, rooms, events…" />
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
              { id: "list", title: "List view", icon: <path d="M3 4.5h10M3 8h10M3 11.5h10" strokeLinecap="round"/> },
              { id: "grid", title: "Grid view", icon: <><rect x="3" y="3" width="4" height="4" rx="0.5"/><rect x="9" y="3" width="4" height="4" rx="0.5"/><rect x="3" y="9" width="4" height="4" rx="0.5"/><rect x="9" y="9" width="4" height="4" rx="0.5"/></> },
              { id: "cal", title: "Calendar view", icon: <><rect x="2.5" y="3.5" width="11" height="10" rx="1"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" strokeLinecap="round"/></> },
            ].map(({ id, title, icon }) => (
              <button
                key={id}
                title={title}
                className={activeView === id ? "active" : ""}
                onClick={() => setActiveView(id)}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              </button>
            ))}
          </div>
        </div>

        {/* Resident table */}
        <div className="table">
          <div className="table-header">
            <div>Room</div>
            <div>Name</div>
            <div>Last Visit</div>
            <div>Priority</div>
            <div>Date</div>
            <div>Owner</div>
          </div>
          <div className="table-row selected">
            <div className="room">201</div>
            <div className="resident">
              <div className="resident-avatar">E</div>
              <div className="resident-name">Evelyn Rodriguez</div>
            </div>
            <div>10:23 am</div>
            <div>
              <span className="priority high">
                <span className="priority-dot" />
                High
              </span>
            </div>
            <div>Dec 5</div>
            <div className="owner">
              <div className="owner-avatar" />
              <span>Dr. Marisol Vega</span>
            </div>
          </div>
        </div>

        {/* Ella AI Daily Update */}
        <div className="section-head">
          <h2 className="section-title">Ella AI <em>daily update</em></h2>
          <div className="section-meta">Generated 10:48 am · Confidence 0.94</div>
        </div>

        <article className="ella">
          <div className="portrait">
            <div className="silhouette" />
            <div className="badge">Evelyn · Room 201</div>
          </div>
          <div className="ella-body">
            <div className="ella-eyebrow">
              <span className="pulse" />
              Overnight summary · 11:00 PM → 10:30 AM
            </div>

            <div className="narrative">
              <p>Evelyn had a <em>calm and positive</em> night. She settled into bed shortly after 11 PM and remained peacefully asleep until around 4:30 AM, when the height sensor shows she got up briefly (likely a bathroom visit) before returning to bed without incident.</p>
              <p>She rose for the day just before 7 AM, which is her usual pattern. Since getting up, her overall activity has been <em>excellent</em>: the tracker shows a steady and strong upward trend through the morning, reaching the highest levels we&apos;ve seen from her all week <span className="accent-text">(+21% above her 7-day average by late morning).</span></p>
            </div>

            <div className="ella-actions">
              <button className="speak-btn" onClick={() => setSpeaking(s => !s)}>
                <span className="play-circle">
                  <svg viewBox="0 0 12 12" fill="currentColor">
                    {speaking
                      ? <><rect x="3.5" y="3" width="2" height="6"/><rect x="6.5" y="3" width="2" height="6"/></>
                      : <path d="M3 2l7 4-7 4z"/>
                    }
                  </svg>
                </span>
                {speaking ? "Pause" : "Speak"}
              </button>
              <span className="speak-meta">1 min 14 sec · Ella v3</span>
            </div>
          </div>
        </article>

        {/* Activity chart */}
        <div className="chart-card">
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Activity</h3>
              <div className="chart-sub">23 Nov → today · hourly</div>
            </div>
            <div className="delta-badge">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2.5 8L6 4.5L9.5 8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              +21
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
            <path className="trend-prev" d="M48,170 C140,168 220,164 320,160 C420,156 520,152 620,150 C720,148 820,144 860,142"/>
            <path className="trend-area" d="M48,225 L100,222 L150,228 L200,226 L250,224 L300,210 L350,160 L400,165 L450,148 L500,140 L550,120 L600,108 L650,90 L700,72 L750,55 L800,48 L860,40 L860,230 L48,230 Z"/>
            <path className="trend" d="M48,225 L100,222 L150,228 L200,226 L250,224 L300,210 L350,160 L400,165 L450,148 L500,140 L550,120 L600,108 L650,90 L700,72 L750,55 L800,48 L860,40"/>
            <circle className="point" cx="860" cy="40" r="4.5"/>
            <text className="label-callout" x="848" y="28" textAnchor="end">+21%</text>
            <text className="axis-label" x="48"  y="252">12 AM</text>
            <text className="axis-label" x="200" y="252">3 AM</text>
            <text className="axis-label" x="350" y="252">6 AM</text>
            <text className="axis-label" x="500" y="252">8 AM</text>
            <text className="axis-label" x="650" y="252">10 AM</text>
            <text className="axis-label" x="855" y="252" textAnchor="end">12 PM</text>
          </svg>

          <div className="chart-legend">
            <div className="legend-item"><span className="legend-swatch solid" /> Today · Dec 5</div>
            <div className="legend-item"><span className="legend-swatch dashed" /> 7-day average</div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="stats">
          <div className="stat is-accent">
            <div className="stat-label">Walking</div>
            <div className="stat-value">53</div>
            <div className="stat-unit">Estimated minutes</div>
            <div className="stat-foot">
              <span className="stat-delta down">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2.5 4L6 7.5L9.5 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                −21
              </span>
              <svg className="stat-spark" viewBox="0 0 80 28" preserveAspectRatio="none">
                <path d="M2,12 L12,10 L22,16 L32,8 L42,14 L52,18 L62,22 L72,20 L78,24"/>
              </svg>
            </div>
          </div>

          <div className="stat is-accent">
            <div className="stat-label">Sitting</div>
            <div className="stat-value">201</div>
            <div className="stat-unit">Estimated minutes</div>
            <div className="stat-foot">
              <span className="stat-delta up">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2.5 8L6 4.5L9.5 8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                +10
              </span>
              <svg className="stat-spark" viewBox="0 0 80 28" preserveAspectRatio="none">
                <path d="M2,20 L12,18 L22,15 L32,16 L42,12 L52,10 L62,8 L72,6 L78,4"/>
              </svg>
            </div>
          </div>

          <div className="stat">
            <div className="stat-label">Falls</div>
            <div className="stat-value">0</div>
            <div className="stat-unit">Estimated falls</div>
            <div className="stat-foot">
              <span className="stat-delta flat">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2.5 6L9.5 6" strokeLinecap="round"/>
                </svg>
                +0
              </span>
              <svg className="stat-spark" viewBox="0 0 80 28" preserveAspectRatio="none">
                <path d="M2,22 L12,22 L22,22 L32,22 L42,22 L52,22 L62,22 L72,22 L78,22"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="agent-note">— Ambient Intelligence · contactless monitoring · v3 preview —</div>

      </main>
    </div>
  );
}