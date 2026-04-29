"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
type Priority = "critical" | "high" | "medium" | "low";
type IssueType = "story" | "bug" | "task" | "epic";
type Column = "todo" | "inprogress" | "review" | "done";

interface Issue {
  id: string;
  type: IssueType;
  title: string;
  priority: Priority;
  points: number;
  assignee: string;
  assigneeInitial: string;
  assigneeColor: string;
  labels: string[];
  column: Column;
  description: string;
  created: string;
  updated: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const INITIAL_ISSUES: Issue[] = [
  { id:"ENG-142", type:"story",  title:"Sensor fusion: merge radar + PIR confidence scores",        priority:"high",     points:8,  assignee:"Priya S.",   assigneeInitial:"P", assigneeColor:"#7C6EAD", labels:["ml","sensors"],    column:"todo",       description:"Combine radar motion confidence with PIR interrupt signals to produce a unified presence score per room. Output should feed the alert engine.", created:"Apr 22", updated:"Apr 27" },
  { id:"ENG-143", type:"task",   title:"Add pagination to /api/events endpoint",                    priority:"medium",   points:3,  assignee:"Marcus T.",  assigneeInitial:"M", assigneeColor:"#2D72D2", labels:["api"],              column:"todo",       description:"The events endpoint returns all records unbounded. Add cursor-based pagination with a default page size of 50.", created:"Apr 23", updated:"Apr 26" },
  { id:"ENG-144", type:"bug",    title:"Fall alert fires twice when sensor resets mid-event",       priority:"critical", points:5,  assignee:"Lena K.",    assigneeInitial:"L", assigneeColor:"#FF6B6B", labels:["alerts","sensors"], column:"todo",       description:"Repro: sensor hard-reset during a fall event causes a duplicate alert within 800ms. Root cause suspected in event dedup window.", created:"Apr 24", updated:"Apr 28" },
  { id:"ENG-145", type:"story",  title:"Resident activity heatmap — hourly breakdown view",         priority:"medium",   points:5,  assignee:"Jin W.",     assigneeInitial:"J", assigneeColor:"#3DCC91", labels:["frontend","viz"],  column:"todo",       description:"Build a 24-hour heatmap grid per resident showing movement intensity by hour. Should match the palette used in the floor map.", created:"Apr 21", updated:"Apr 25" },
  { id:"ENG-146", type:"task",   title:"Migrate sensor config from YAML to DB-backed admin panel",  priority:"low",      points:8,  assignee:"Priya S.",   assigneeInitial:"P", assigneeColor:"#7C6EAD", labels:["infra","admin"],   column:"todo",       description:"Replace static sensor-config.yaml with a DB table. Admin UI should allow field staff to update thresholds without a deploy.", created:"Apr 22", updated:"Apr 22" },

  { id:"ENG-133", type:"story",  title:"Real-time WebSocket feed for live floor events",            priority:"high",     points:13, assignee:"Marcus T.",  assigneeInitial:"M", assigneeColor:"#2D72D2", labels:["api","realtime"],  column:"inprogress", description:"Establish a WS channel that pushes new events to connected dashboard clients within 500ms of sensor ingestion. Backpressure strategy TBD.", created:"Apr 14", updated:"Apr 28" },
  { id:"ENG-137", type:"bug",    title:"Room quiet badge disappears after browser refresh",         priority:"high",     points:2,  assignee:"Lena K.",    assigneeInitial:"L", assigneeColor:"#FF6B6B", labels:["frontend"],        column:"inprogress", description:"Quiet status derived from client-side timer; on refresh the initial state is unknown until the next WS message arrives.", created:"Apr 18", updated:"Apr 29" },
  { id:"ENG-138", type:"story",  title:"Night-mode alert suppression rules (10 PM – 6 AM)",        priority:"medium",   points:5,  assignee:"Jin W.",     assigneeInitial:"J", assigneeColor:"#3DCC91", labels:["alerts"],          column:"inprogress", description:"Between configurable night hours, suppress non-critical motion alerts to avoid waking staff for expected nighttime movement.", created:"Apr 19", updated:"Apr 27" },
  { id:"ENG-139", type:"task",   title:"Write runbook: on-call response for fall alerts",          priority:"medium",   points:2,  assignee:"Sara O.",    assigneeInitial:"S", assigneeColor:"#FFC940", labels:["docs","oncall"],   column:"inprogress", description:"Document escalation steps, expected response SLA, and who to page for confirmed fall events vs. sensor anomalies.", created:"Apr 20", updated:"Apr 26" },

  { id:"ENG-128", type:"story",  title:"Export resident report as PDF — weekly summary",           priority:"medium",   points:5,  assignee:"Sara O.",    assigneeInitial:"S", assigneeColor:"#FFC940", labels:["reports","pdf"],   column:"review",     description:"Generate a one-page weekly summary PDF per resident: fall count, avg walk score, alert history. Triggered manually from the Reports tab.", created:"Apr 10", updated:"Apr 28" },
  { id:"ENG-129", type:"bug",    title:"Analytics chart renders blank on Safari 17",               priority:"high",     points:3,  assignee:"Lena K.",    assigneeInitial:"L", assigneeColor:"#FF6B6B", labels:["frontend","safari"],column:"review",     description:"The SVG path gradient in analytics breaks on Safari 17 due to a linearGradient scoping bug. Fix: move gradientUnits to userSpaceOnUse.", created:"Apr 11", updated:"Apr 29" },
  { id:"ENG-131", type:"task",   title:"Add Datadog APM spans to ingestion pipeline",              priority:"low",      points:3,  assignee:"Marcus T.",  assigneeInitial:"M", assigneeColor:"#2D72D2", labels:["observability"],   column:"review",     description:"Instrument the sensor-to-event pipeline with Datadog APM. Key spans: ingest, dedup, enrich, persist, notify.", created:"Apr 13", updated:"Apr 27" },

  { id:"ENG-120", type:"epic",   title:"v1.2 Auth — role-based access (admin / nurse / viewer)",   priority:"high",     points:21, assignee:"Priya S.",   assigneeInitial:"P", assigneeColor:"#7C6EAD", labels:["auth","epic"],     column:"done",       description:"Full RBAC rollout: three roles, JWT claims, middleware enforcement on all protected routes.", created:"Apr 1",  updated:"Apr 25" },
  { id:"ENG-122", type:"bug",    title:"Login redirect loop when session token expires mid-nav",   priority:"critical", points:3,  assignee:"Jin W.",     assigneeInitial:"J", assigneeColor:"#3DCC91", labels:["auth"],            column:"done",       description:"Expired token during a client-side navigation caused an infinite redirect. Fixed with token refresh interception in middleware.", created:"Apr 3",  updated:"Apr 24" },
  { id:"ENG-124", type:"story",  title:"Floor map — drag-to-reorder room cards",                  priority:"low",      points:5,  assignee:"Lena K.",    assigneeInitial:"L", assigneeColor:"#FF6B6B", labels:["frontend"],        column:"done",       description:"Nurse staff can reorder floor map rooms to match physical layout. Order persisted per-user in localStorage.", created:"Apr 5",  updated:"Apr 26" },
  { id:"ENG-127", type:"task",   title:"Upgrade Next.js 14 → 15 and resolve breaking changes",   priority:"medium",   points:5,  assignee:"Marcus T.",  assigneeInitial:"M", assigneeColor:"#2D72D2", labels:["infra","upgrade"], column:"done",       description:"Updated Next.js, fixed async params usage, migrated cookies() calls to the new API surface.", created:"Apr 8",  updated:"Apr 23" },
];

const COLUMNS: { id: Column; label: string; color: string }[] = [
  { id:"todo",       label:"To Do",      color:"var(--text-3)" },
  { id:"inprogress", label:"In Progress", color:"#FFC940" },
  { id:"review",     label:"In Review",   color:"#2D72D2" },
  { id:"done",       label:"Done",        color:"#3DCC91" },
];

const PRIORITY_META: Record<Priority, { color: string; label: string }> = {
  critical: { color:"#FF6B6B", label:"Critical" },
  high:     { color:"#FF6B6B", label:"High" },
  medium:   { color:"#FFC940", label:"Medium" },
  low:      { color:"var(--text-3)", label:"Low" },
};

const TYPE_META: Record<IssueType, { color: string; symbol: string }> = {
  story: { color:"#7C6EAD", symbol:"◆" },
  bug:   { color:"#FF6B6B", symbol:"⬟" },
  task:  { color:"#2D72D2", symbol:"■" },
  epic:  { color:"#FFC940", symbol:"⬡" },
};

const TEAM = [
  { name:"Priya S.",  initial:"P", color:"#7C6EAD" },
  { name:"Marcus T.", initial:"M", color:"#2D72D2" },
  { name:"Lena K.",   initial:"L", color:"#FF6B6B" },
  { name:"Jin W.",    initial:"J", color:"#3DCC91" },
  { name:"Sara O.",   initial:"S", color:"#FFC940" },
  { name:"Gavin",     initial:"G", color:"#00B4D8" },
  { name:"Hanna",     initial:"H", color:"#F472B6" },
  { name:"Paulo",     initial:"P", color:"#FB923C" },
  { name:"Isaac",     initial:"I", color:"#818CF8" },
  { name:"Aki",       initial:"A", color:"#34D399" },
];

const DISCIPLINES = [
  { name:"Electrical", color:"#FB923C", members:["Gavin","Hanna","Paulo"] },
  { name:"Software",   color:"#818CF8", members:["Isaac","Aki"] },
];

// ── Create issue form state type ───────────────────────────────────────────
interface NewIssueForm {
  title: string;
  type: IssueType;
  priority: Priority;
  points: string;
  assignee: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function EngineeringPage() {
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [view, setView] = useState<"board" | "backlog">("board");
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<Issue | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState<NewIssueForm>({ title:"", type:"task", priority:"medium", points:"3", assignee:"Priya S." });
  const [movingIssue, setMovingIssue] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setSelected(null);
      }
    };
    if (selected) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const filtered = issues.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
    const matchAssignee = filterAssignee === "all" || i.assignee === filterAssignee;
    const matchType = filterType === "all" || i.type === filterType;
    return matchSearch && matchAssignee && matchType;
  });

  const byColumn = (col: Column) => filtered.filter(i => i.column === col);

  const totalPoints = issues.reduce((a, i) => a + i.points, 0);
  const donePoints  = issues.filter(i => i.column === "done").reduce((a, i) => a + i.points, 0);
  const progress    = Math.round((donePoints / totalPoints) * 100);

  function moveIssue(id: string, col: Column) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, column: col } : i));
    setMovingIssue(null);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, column: col } : null);
  }

  function createIssue() {
    if (!newForm.title.trim()) return;
    const t = TEAM.find(t => t.name === newForm.assignee)!;
    const next: Issue = {
      id: `ENG-${150 + issues.length - INITIAL_ISSUES.length + 1}`,
      type: newForm.type,
      title: newForm.title,
      priority: newForm.priority,
      points: parseInt(newForm.points) || 3,
      assignee: t.name,
      assigneeInitial: t.initial,
      assigneeColor: t.color,
      labels: [],
      column: "todo",
      description: "",
      created: "Apr 29",
      updated: "Apr 29",
    };
    setIssues(prev => [next, ...prev]);
    setNewForm({ title:"", type:"task", priority:"medium", points:"3", assignee:"Priya S." });
    setShowCreate(false);
  }

  const s: Record<string, React.CSSProperties> = {
    page:       { display:"flex", minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--sans)" },
    sidebar:    { width:224, flexShrink:0, borderRight:"1px solid var(--line)", padding:"28px 22px 32px", display:"flex", flexDirection:"column", gap:32, position:"sticky", top:0, height:"100vh", overflowY:"auto" },
    main:       { flex:1, display:"flex", flexDirection:"column", minWidth:0 },
    topbar:     { borderBottom:"1px solid var(--line)", padding:"20px 32px 0", display:"flex", flexDirection:"column", gap:12 },
    topbarRow:  { display:"flex", alignItems:"center", gap:12, justifyContent:"space-between" },
    content:    { flex:1, padding:"24px 32px 48px", overflowX:"auto" },
    board:      { display:"flex", gap:16, alignItems:"flex-start", minWidth:900 },
    col:        { flex:1, minWidth:200, display:"flex", flexDirection:"column", gap:8 },
    colHead:    { display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"0 2px" },
    card:       { background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"border-color 0.15s, box-shadow 0.15s" },
    cardTitle:  { fontSize:13, lineHeight:1.45, color:"var(--text)", marginBottom:10 },
    cardMeta:   { display:"flex", alignItems:"center", gap:6, justifyContent:"space-between" },
    badge:      { fontFamily:"var(--mono)", fontSize:9, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, padding:"3px 7px", borderRadius:4, background:"var(--surface-2)" },
    avatar:     { width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:10, fontWeight:700, flexShrink:0 },
    pts:        { fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", background:"var(--surface-2)", padding:"2px 7px", borderRadius:4 },
    filterBar:  { display:"flex", alignItems:"center", gap:10, padding:"14px 32px", borderBottom:"1px solid var(--line)", flexWrap:"wrap" as const },
    input:      { background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"7px 12px", fontSize:13, color:"var(--text)", fontFamily:"var(--sans)", outline:"none", width:220 },
    select:     { background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"6px 10px", fontSize:12, color:"var(--text-2)", fontFamily:"var(--mono)", outline:"none", cursor:"pointer" },
    btn:        { display:"inline-flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:6, border:"1px solid var(--line)", fontSize:13, fontFamily:"var(--sans)", cursor:"pointer", background:"var(--surface-2)", color:"var(--text-2)", transition:"background 0.15s, border-color 0.15s" },
    btnPrimary: { display:"inline-flex", alignItems:"center", gap:7, padding:"7px 16px", borderRadius:6, border:"none", fontSize:13, fontFamily:"var(--sans)", cursor:"pointer", background:"var(--accent)", color:"#fff", fontWeight:500 },
    sprint:     { display:"flex", alignItems:"center", gap:16, padding:"12px 0 16px" },
    navLabel:   { fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.14em", color:"var(--text-4)", padding:"0 8px", marginBottom:8 },
    navItem:    { display:"flex", alignItems:"center", gap:10, padding:"7px 10px", fontSize:13, color:"var(--text-2)", borderRadius:4, cursor:"pointer", textDecoration:"none" },
    drawer:     { position:"fixed", top:0, right:0, bottom:0, width:480, background:"var(--surface-1)", borderLeft:"1px solid var(--line)", zIndex:50, display:"flex", flexDirection:"column", overflowY:"auto" },
    overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:49 },
    modal:      { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:480, background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:14, zIndex:60, padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:20 },
    formRow:    { display:"flex", flexDirection:"column" as const, gap:6 },
    formLabel:  { fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.12em", color:"var(--text-3)" },
    formInput:  { background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"9px 12px", fontSize:13, color:"var(--text)", fontFamily:"var(--sans)", outline:"none" },
    formSelect: { background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"8px 12px", fontSize:13, color:"var(--text)", fontFamily:"var(--sans)", outline:"none", cursor:"pointer" },
    progress:   { height:4, borderRadius:4, background:"var(--surface-2)", overflow:"hidden", flex:1 },
  };

  return (
    <div style={s.page}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <Link href="/" style={{ textDecoration:"none", color:"inherit" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 6px" }}>
            <div style={{ fontFamily:"var(--serif)", fontWeight:400, fontSize:18, letterSpacing:"-0.01em" }}>
              Ambient <em style={{ fontStyle:"italic", color:"var(--text-2)", fontWeight:300 }}>Demo</em>
            </div>
          </div>
        </Link>

        {/* Project */}
        <div>
          <div style={s.navLabel}>Project</div>
          {[
            { label:"Board",    icon:<path d="M2.5 2.5h4v11h-4zM9.5 2.5h4v6h-4zM9.5 11.5h4v2h-4z" strokeLinejoin="round"/>, v:"board" as const },
            { label:"Backlog",  icon:<><rect x="2.5" y="3" width="11" height="1.5" rx=".75"/><rect x="2.5" y="6.5" width="11" height="1.5" rx=".75"/><rect x="2.5" y="10" width="11" height="1.5" rx=".75"/></>, v:"backlog" as const },
          ].map(({ label, icon, v }) => (
            <div key={label} style={{ ...s.navItem, background: view === v ? "var(--surface-2)" : "transparent", color: view === v ? "var(--text)" : "var(--text-2)" }} onClick={() => setView(v)}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </div>
          ))}
          {[
            { label:"Reports",  href:"/dashboard/reports",   icon:<><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></> },
            { label:"Dashboard",href:"/dashboard/overview",  icon:<path d="M2.5 7L8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z" strokeLinejoin="round"/> },
          ].map(({ label, href, icon }) => (
            <Link key={label} href={href} style={{ ...s.navItem }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{icon}</svg>
              {label}
            </Link>
          ))}
        </div>

        {/* Disciplines */}
        <div>
          <div style={s.navLabel}>Disciplines</div>
          {DISCIPLINES.map(d => (
            <div key={d.name}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px 3px", marginBottom:2 }}>
                <span style={{ width:6, height:6, borderRadius:2, background:d.color, flexShrink:0 }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.1em", color:d.color }}>{d.name}</span>
              </div>
              {d.members.map(name => {
                const t = TEAM.find(tm => tm.name === name)!;
                return (
                  <div key={name} style={{ ...s.navItem, paddingLeft:20, cursor:"pointer" }}
                    onClick={() => setFilterAssignee(filterAssignee === name ? "all" : name)}>
                    <div style={{ ...s.avatar, background: t.color + "33", color: t.color, width:18, height:18, fontSize:8 }}>{t.initial}</div>
                    <span style={{ flex:1, fontSize:12.5 }}>{name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#3DCC91", boxShadow:"0 0 6px #3DCC91", flexShrink:0 }}/>
            Engineering · Sprint 14
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>

        {/* Topbar */}
        <header style={s.topbar}>
          <div style={s.topbarRow}>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>Engineering / Sprint 14</div>
              <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
                Sprint <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>Board</em>
              </h1>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={s.btn} onClick={() => setShowCreate(true)}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>
                Create Issue
              </button>
            </div>
          </div>

          {/* Sprint bar */}
          <div style={s.sprint}>
            <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>Apr 21 – May 2</div>
            <div style={{ ...s.progress }}><div style={{ height:"100%", width:`${progress}%`, background:"var(--accent)", borderRadius:4, transition:"width 0.4s" }}/></div>
            <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-2)", whiteSpace:"nowrap" }}>{progress}% · {donePoints}/{totalPoints} pts</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", marginLeft:8 }}>
              {issues.filter(i => i.column === "done").length} of {issues.length} issues done
            </div>
          </div>

          {/* View tabs */}
          <div style={{ display:"flex", gap:0, borderBottom:"none", marginTop:-4 }}>
            {(["board","backlog"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 16px 12px", fontSize:13, fontFamily:"var(--sans)", color: view===v ? "var(--text)" : "var(--text-3)", borderBottom: view===v ? "2px solid var(--accent)" : "2px solid transparent", transition:"color 0.15s", textTransform:"capitalize" }}>
                {v === "board" ? "Board" : "Backlog"}
              </button>
            ))}
          </div>
        </header>

        {/* Filter bar */}
        <div style={s.filterBar}>
          <div style={{ position:"relative" }}>
            <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L13 13" strokeLinecap="round"/></svg>
            <input style={{ ...s.input, paddingLeft:32 }} placeholder="Search issues…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select style={s.select} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="all">All Assignees</option>
            {TEAM.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <select style={s.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="story">Story</option>
            <option value="bug">Bug</option>
            <option value="task">Task</option>
            <option value="epic">Epic</option>
          </select>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", marginLeft:"auto" }}>
            {filtered.length} issue{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Board View ── */}
        {view === "board" && (
          <div style={{ ...s.content, flex:1 }}>

            {/* Team roster */}
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:12 }}>Team</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {DISCIPLINES.map(d => (
                  <div key={d.name} style={{ background:"var(--surface-1)", border:`1px solid ${d.color}30`, borderRadius:10, padding:"14px 18px", display:"flex", flexDirection:"column", gap:10, minWidth:200 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ width:7, height:7, borderRadius:2, background:d.color, flexShrink:0 }}/>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:d.color, fontWeight:600 }}>{d.name}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {d.members.map(name => {
                        const t = TEAM.find(tm => tm.name === name)!;
                        const active = filterAssignee === name;
                        return (
                          <button key={name} onClick={() => setFilterAssignee(active ? "all" : name)}
                            style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px 6px 7px", borderRadius:6, border:`1px solid ${active ? t.color + "60" : "var(--line)"}`, background: active ? t.color + "18" : "var(--surface-2)", cursor:"pointer", transition:"all 0.15s" }}>
                            <span style={{ width:24, height:24, borderRadius:"50%", background: t.color + "33", color: t.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:10, fontWeight:700, flexShrink:0 }}>{t.initial}</span>
                            <span style={{ fontSize:12.5, color: active ? "var(--text)" : "var(--text-2)", fontFamily:"var(--sans)" }}>{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.board}>
              {COLUMNS.map(col => {
                const colIssues = byColumn(col.id);
                const colPts    = colIssues.reduce((a, i) => a + i.points, 0);
                return (
                  <div key={col.id} style={s.col}>
                    {/* Column header */}
                    <div style={s.colHead}>
                      <span style={{ width:8, height:8, borderRadius:2, background:col.color, flexShrink:0 }}/>
                      <span style={{ fontSize:12, fontWeight:600, color:"var(--text-2)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"var(--mono)" }}>{col.label}</span>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", marginLeft:"auto" }}>{colIssues.length} · {colPts}pts</span>
                    </div>

                    {/* Cards */}
                    {colIssues.map(issue => (
                      <IssueCard key={issue.id} issue={issue} onSelect={() => setSelected(issue)}/>
                    ))}

                    {colIssues.length === 0 && (
                      <div style={{ border:"1px dashed var(--line)", borderRadius:10, padding:"20px 16px", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", textAlign:"center", letterSpacing:"0.1em" }}>
                        EMPTY
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Backlog View ── */}
        {view === "backlog" && (
          <div style={{ ...s.content, flex:1, minWidth:0, overflowX:"visible" }}>
            {/* Sprint issues */}
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-2)" }}>Sprint 14</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)" }}>Apr 21 – May 2 · {issues.length} issues</span>
              </div>
              <BacklogTable issues={filtered} onSelect={setSelected}/>
            </div>
          </div>
        )}
      </main>

      {/* ── Issue drawer ── */}
      {selected && (
        <>
          <div style={s.overlay} onClick={() => setSelected(null)}/>
          <div ref={drawerRef} style={s.drawer}>
            <div style={{ padding:"24px 28px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:TYPE_META[selected.type].color, fontWeight:700 }}>{TYPE_META[selected.type].symbol}</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{selected.id}</span>
              </div>
              <button style={{ ...s.btn, padding:"5px 10px", fontSize:12 }} onClick={() => setSelected(null)}>✕ Close</button>
            </div>
            <div style={{ padding:"24px 28px", flex:1, overflowY:"auto" }}>
              <h2 style={{ margin:"0 0 20px", fontFamily:"var(--serif)", fontWeight:300, fontSize:21, lineHeight:1.3, letterSpacing:"-0.01em" }}>{selected.title}</h2>

              {/* Move to column */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:8 }}>Move to column</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {COLUMNS.map(col => (
                    <button key={col.id} onClick={() => moveIssue(selected.id, col.id)}
                      style={{ ...s.btn, fontSize:11, padding:"5px 12px", borderColor: selected.column === col.id ? col.color : "var(--line)", color: selected.column === col.id ? col.color : "var(--text-3)", background: selected.column === col.id ? col.color + "18" : "var(--surface-2)" }}>
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meta grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                {[
                  { label:"Assignee",  value: <span style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ ...s.avatar, background:selected.assigneeColor+"33", color:selected.assigneeColor, fontSize:9 }}>{selected.assigneeInitial}</span>{selected.assignee}</span> },
                  { label:"Priority",  value: <span style={{ color:PRIORITY_META[selected.priority].color, fontFamily:"var(--mono)", fontSize:12 }}>● {PRIORITY_META[selected.priority].label}</span> },
                  { label:"Type",      value: <span style={{ fontFamily:"var(--mono)", fontSize:12, color:TYPE_META[selected.type].color }}>{selected.type}</span> },
                  { label:"Points",    value: <span style={{ fontFamily:"var(--mono)", fontSize:12 }}>{selected.points} pts</span> },
                  { label:"Created",   value: <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{selected.created}</span> },
                  { label:"Updated",   value: <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{selected.updated}</span> },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
                    <div style={{ fontSize:13 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Labels */}
              {selected.labels.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:8 }}>Labels</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {selected.labels.map(l => (
                      <span key={l} style={{ fontFamily:"var(--mono)", fontSize:10, padding:"3px 8px", borderRadius:4, background:"var(--surface-2)", color:"var(--text-3)", border:"1px solid var(--line)" }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:10 }}>Description</div>
                  <p style={{ margin:0, fontSize:13.5, color:"var(--text-2)", lineHeight:1.6 }}>{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Create issue modal ── */}
      {showCreate && (
        <>
          <div style={{ ...s.overlay, zIndex:59 }} onClick={() => setShowCreate(false)}/>
          <div style={s.modal}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:20 }}>Create <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>Issue</em></h3>
              <button style={{ ...s.btn, padding:"4px 10px" }} onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div style={s.formRow}>
              <label style={s.formLabel}>Title</label>
              <input style={s.formInput} placeholder="Issue title…" value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} autoFocus/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={s.formRow}>
                <label style={s.formLabel}>Type</label>
                <select style={s.formSelect} value={newForm.type} onChange={e => setNewForm(p => ({ ...p, type: e.target.value as IssueType }))}>
                  <option value="task">Task</option>
                  <option value="story">Story</option>
                  <option value="bug">Bug</option>
                  <option value="epic">Epic</option>
                </select>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Priority</label>
                <select style={s.formSelect} value={newForm.priority} onChange={e => setNewForm(p => ({ ...p, priority: e.target.value as Priority }))}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Story Points</label>
                <select style={s.formSelect} value={newForm.points} onChange={e => setNewForm(p => ({ ...p, points: e.target.value }))}>
                  {[1,2,3,5,8,13,21].map(n => <option key={n} value={String(n)}>{n}</option>)}
                </select>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Assignee</label>
                <select style={s.formSelect} value={newForm.assignee} onChange={e => setNewForm(p => ({ ...p, assignee: e.target.value }))}>
                  {TEAM.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
              <button style={s.btn} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={createIssue}>Create Issue</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── IssueCard ──────────────────────────────────────────────────────────────
function IssueCard({ issue, onSelect }: { issue: Issue; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const pm = PRIORITY_META[issue.priority];
  const tm = TYPE_META[issue.type];
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        background:"var(--surface-1)",
        border:`1px solid ${hovered ? "var(--line-strong)" : "var(--line)"}`,
        borderRadius:10, padding:"13px 15px", cursor:"pointer",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.2)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
        transition:"border-color 0.15s, box-shadow 0.15s, transform 0.15s",
      }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:tm.color, fontWeight:700, marginTop:1, flexShrink:0 }}>{tm.symbol}</span>
        <p style={{ margin:0, fontSize:13, lineHeight:1.4, color:"var(--text)", flex:1 }}>{issue.title}</p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{issue.id}</span>
        <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          {issue.priority !== "low" && (
            <span style={{ width:6, height:6, borderRadius:"50%", background:pm.color, flexShrink:0 }}/>
          )}
          <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", background:"var(--surface-2)", padding:"2px 7px", borderRadius:4 }}>
            {issue.points}pt
          </span>
          <span style={{ width:20, height:20, borderRadius:"50%", background:issue.assigneeColor+"33", color:issue.assigneeColor, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:9, fontWeight:700 }}>
            {issue.assigneeInitial}
          </span>
        </span>
      </div>
      {issue.labels.length > 0 && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
          {issue.labels.slice(0,2).map(l => (
            <span key={l} style={{ fontFamily:"var(--mono)", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--surface-2)", color:"var(--text-4)" }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BacklogTable ───────────────────────────────────────────────────────────
function BacklogTable({ issues, onSelect }: { issues: Issue[]; onSelect: (i: Issue) => void }) {
  return (
    <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:12, overflow:"hidden" }}>
      <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 90px 90px 90px 80px", gap:12, padding:"10px 20px", borderBottom:"1px solid var(--line)", fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em" }}>
        <div>Key</div><div>Title</div><div>Assignee</div><div>Status</div><div>Priority</div><div style={{ textAlign:"right" }}>Points</div>
      </div>
      {issues.map((issue, idx) => {
        const col = COLUMNS.find(c => c.id === issue.column)!;
        const pm  = PRIORITY_META[issue.priority];
        const tm  = TYPE_META[issue.type];
        return (
          <div key={issue.id} onClick={() => onSelect(issue)}
            style={{ display:"grid", gridTemplateColumns:"80px 1fr 90px 90px 90px 80px", gap:12, padding:"12px 20px", borderBottom: idx < issues.length-1 ? "1px solid var(--line)" : "none", alignItems:"center", cursor:"pointer", transition:"background 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ color:tm.color }}>{tm.symbol}</span> {issue.id}
            </div>
            <div style={{ fontSize:13, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{issue.title}</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:20, height:20, borderRadius:"50%", background:issue.assigneeColor+"33", color:issue.assigneeColor, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:9, fontWeight:700 }}>{issue.assigneeInitial}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)" }}>{issue.assignee.split(" ")[0]}</span>
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:col.color, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:col.color, flexShrink:0 }}/>
              {col.label}
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:pm.color }}>
              {pm.label}
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", textAlign:"right" }}>{issue.points}pt</div>
          </div>
        );
      })}
    </div>
  );
}
