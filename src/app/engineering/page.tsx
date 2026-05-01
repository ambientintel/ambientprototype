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
  { id:"ENG-142", type:"story",  title:"Sensor fusion: merge radar + PIR confidence scores",        priority:"high",     points:8,  assignee:"Gavin",  assigneeInitial:"G", assigneeColor:"#00B4D8", labels:["ml","sensors"],    column:"todo",       description:"Combine radar motion confidence with PIR interrupt signals to produce a unified presence score per room. Output should feed the alert engine.", created:"Apr 22", updated:"Apr 27" },
  { id:"ENG-143", type:"task",   title:"Add pagination to /api/events endpoint",                    priority:"medium",   points:3,  assignee:"Isaac",  assigneeInitial:"I", assigneeColor:"#818CF8", labels:["api"],              column:"todo",       description:"The events endpoint returns all records unbounded. Add cursor-based pagination with a default page size of 50.", created:"Apr 23", updated:"Apr 26" },
  { id:"ENG-144", type:"bug",    title:"Fall alert fires twice when sensor resets mid-event",       priority:"critical", points:5,  assignee:"Abdul",  assigneeInitial:"A", assigneeColor:"#22D3EE", labels:["alerts","sensors"], column:"todo",       description:"Repro: sensor hard-reset during a fall event causes a duplicate alert within 800ms. Root cause suspected in event dedup window.", created:"Apr 24", updated:"Apr 28" },
  { id:"ENG-145", type:"story",  title:"Resident activity heatmap — hourly breakdown view",         priority:"medium",   points:5,  assignee:"Aki",    assigneeInitial:"A", assigneeColor:"#34D399", labels:["frontend","viz"],  column:"todo",       description:"Build a 24-hour heatmap grid per resident showing movement intensity by hour. Should match the palette used in the floor map.", created:"Apr 21", updated:"Apr 25" },
  { id:"ENG-146", type:"task",   title:"Migrate sensor config from YAML to DB-backed admin panel",  priority:"low",      points:8,  assignee:"Hanna",  assigneeInitial:"H", assigneeColor:"#F472B6", labels:["infra","admin"],   column:"todo",       description:"Replace static sensor-config.yaml with a DB table. Admin UI should allow field staff to update thresholds without a deploy.", created:"Apr 22", updated:"Apr 22" },

  { id:"ENG-133", type:"story",  title:"Real-time WebSocket feed for live floor events",            priority:"high",     points:13, assignee:"Isaac",  assigneeInitial:"I", assigneeColor:"#818CF8", labels:["api","realtime"],  column:"inprogress", description:"Establish a WS channel that pushes new events to connected dashboard clients within 500ms of sensor ingestion. Backpressure strategy TBD.", created:"Apr 14", updated:"Apr 28" },
  { id:"ENG-137", type:"bug",    title:"Room quiet badge disappears after browser refresh",         priority:"high",     points:2,  assignee:"Aki",    assigneeInitial:"A", assigneeColor:"#34D399", labels:["frontend"],        column:"inprogress", description:"Quiet status derived from client-side timer; on refresh the initial state is unknown until the next WS message arrives.", created:"Apr 18", updated:"Apr 29" },
  { id:"ENG-138", type:"story",  title:"Night-mode alert suppression rules (10 PM – 6 AM)",        priority:"medium",   points:5,  assignee:"Paulo",  assigneeInitial:"P", assigneeColor:"#FB923C", labels:["alerts"],          column:"inprogress", description:"Between configurable night hours, suppress non-critical motion alerts to avoid waking staff for expected nighttime movement.", created:"Apr 19", updated:"Apr 27" },
  { id:"ENG-139", type:"task",   title:"Write runbook: on-call response for fall alerts",          priority:"medium",   points:2,  assignee:"Abdul",  assigneeInitial:"A", assigneeColor:"#22D3EE", labels:["docs","oncall"],   column:"inprogress", description:"Document escalation steps, expected response SLA, and who to page for confirmed fall events vs. sensor anomalies.", created:"Apr 20", updated:"Apr 26" },

  { id:"ENG-128", type:"story",  title:"Export resident report as PDF — weekly summary",           priority:"medium",   points:5,  assignee:"Hanna",  assigneeInitial:"H", assigneeColor:"#F472B6", labels:["reports","pdf"],   column:"review",     description:"Generate a one-page weekly summary PDF per resident: fall count, avg walk score, alert history. Triggered manually from the Reports tab.", created:"Apr 10", updated:"Apr 28" },
  { id:"ENG-129", type:"bug",    title:"Analytics chart renders blank on Safari 17",               priority:"high",     points:3,  assignee:"Aki",    assigneeInitial:"A", assigneeColor:"#34D399", labels:["frontend","safari"],column:"review",     description:"The SVG path gradient in analytics breaks on Safari 17 due to a linearGradient scoping bug. Fix: move gradientUnits to userSpaceOnUse.", created:"Apr 11", updated:"Apr 29" },
  { id:"ENG-131", type:"task",   title:"Add Datadog APM spans to ingestion pipeline",              priority:"low",      points:3,  assignee:"Gavin",  assigneeInitial:"G", assigneeColor:"#00B4D8", labels:["observability"],   column:"review",     description:"Instrument the sensor-to-event pipeline with Datadog APM. Key spans: ingest, dedup, enrich, persist, notify.", created:"Apr 13", updated:"Apr 27" },

  { id:"ENG-120", type:"epic",   title:"v1.2 Auth — role-based access (admin / nurse / viewer)",   priority:"high",     points:21, assignee:"Abdul",  assigneeInitial:"A", assigneeColor:"#22D3EE", labels:["auth","epic"],     column:"done",       description:"Full RBAC rollout: three roles, JWT claims, middleware enforcement on all protected routes.", created:"Apr 1",  updated:"Apr 25" },
  { id:"ENG-122", type:"bug",    title:"Login redirect loop when session token expires mid-nav",   priority:"critical", points:3,  assignee:"Isaac",  assigneeInitial:"I", assigneeColor:"#818CF8", labels:["auth"],            column:"done",       description:"Expired token during a client-side navigation caused an infinite redirect. Fixed with token refresh interception in middleware.", created:"Apr 3",  updated:"Apr 24" },
  { id:"ENG-124", type:"story",  title:"Floor map — drag-to-reorder room cards",                  priority:"low",      points:5,  assignee:"Hanna",  assigneeInitial:"H", assigneeColor:"#F472B6", labels:["frontend"],        column:"done",       description:"Nurse staff can reorder floor map rooms to match physical layout. Order persisted per-user in localStorage.", created:"Apr 5",  updated:"Apr 26" },
  { id:"ENG-127", type:"task",   title:"Upgrade Next.js 14 → 15 and resolve breaking changes",   priority:"medium",   points:5,  assignee:"Paulo",  assigneeInitial:"P", assigneeColor:"#FB923C", labels:["infra","upgrade"], column:"done",       description:"Updated Next.js, fixed async params usage, migrated cookies() calls to the new API surface.", created:"Apr 8",  updated:"Apr 23" },
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
  { name:"Gavin",  initial:"G", color:"#00B4D8", discipline:"Electrical" },
  { name:"Hanna",  initial:"H", color:"#F472B6", discipline:"Electrical" },
  { name:"Paulo",  initial:"P", color:"#FB923C", discipline:"Electrical" },
  { name:"Isaac",  initial:"I", color:"#818CF8", discipline:"Software" },
  { name:"Aki",    initial:"A", color:"#34D399", discipline:"Software" },
  { name:"Abdul",  initial:"A", color:"#22D3EE", discipline:"Cloud Cybersecurity" },
];

const DISCIPLINES = [
  { name:"Electrical",        color:"#FB923C", members:["Gavin","Hanna","Paulo"] },
  { name:"Software",          color:"#818CF8", members:["Isaac","Aki"] },
  { name:"Cloud Cybersecurity", color:"#22D3EE", members:["Abdul"] },
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
  const [view, setView] = useState<"board" | "backlog" | "people">("board");
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<Issue | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState<NewIssueForm>({ title:"", type:"task", priority:"medium", points:"3", assignee:"Gavin" });
  const [movingIssue, setMovingIssue] = useState<string | null>(null);
  const [colInputs, setColInputs] = useState<Record<string, string>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Column | null>(null);
  const [history, setHistory] = useState<Issue[]>([]);
  const colCounter = useRef(200);

  const weekNum = (() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  })();
  const [personalTasks, setPersonalTasks] = useState<Record<string, string[]>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<string, string[]>>({});
  const [personalInputs, setPersonalInputs] = useState<Record<string, string>>({});
  const [engineerColSelect, setEngineerColSelect] = useState<Record<string, Column>>({});
  const [weekStatus, setWeekStatus] = useState<Record<string, Record<string, "yes"|"no"|null>>>({});
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptName, setPromptName] = useState<string|null>(null);
  const [team, setTeam] = useState<{name:string; initial:string; color:string; discipline?:string}[]>(TEAM);
  const [showAddEng, setShowAddEng] = useState(false);
  const [newEng, setNewEng] = useState({ name:"", color:"#A78BFA", discipline:"" });
  const [editEng, setEditEng] = useState<{original:string; name:string; color:string; discipline:string}|null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const DAYS = ["Mon","Tue","Wed","Thu","Fri"];
  const todayIdx = Math.min(4, Math.max(0, new Date().getDay() - 1));
  const todayKey = new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
  const boardShaRef    = useRef<string | null>(null);
  const saveTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountingRef  = useRef(true);
  const apiEnabledRef  = useRef(false);

  const LS_KEY = "eng_board_v2";

  function lsLoad() {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function lsSave(board: object) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(board)); } catch {}
  }

  // ── Load: API first → localStorage fallback → INITIAL_ISSUES ─────────────
  useEffect(() => {
    (async () => {
      type BoardData = { issues: Issue[]; personalTasks: Record<string,string[]>; completedTasks: Record<string,string[]>; history: Issue[]; weekStatus: Record<string,Record<string,"yes"|"no"|null>>; team?: {name:string;initial:string;color:string;discipline?:string}[] };
      let loaded: BoardData | null = null;
      try {
        const res  = await fetch("/api/engineering");
        const data = await res.json() as { board: BoardData | null; sha: string | null; configured: boolean };
        if (data.configured) apiEnabledRef.current = true;
        if (data.board) {
          loaded = data.board;
          boardShaRef.current = data.sha;
        }
      } catch {}
      if (!loaded) loaded = lsLoad();
      if (loaded) {
        setIssues(loaded.issues       ?? INITIAL_ISSUES);
        setPersonalTasks(loaded.personalTasks   ?? {});
        setCompletedTasks(loaded.completedTasks ?? {});
        setHistory(loaded.history     ?? []);
        setWeekStatus(loaded.weekStatus ?? {});
        if (loaded.team?.length) setTeam(loaded.team);
      }
      // Show daily prompt at noon or later if not yet answered today
      const todayKeyLocal = new Date().toISOString().slice(0, 10);
      const nowHour = new Date().getHours();
      if (nowHour >= 12 && !localStorage.getItem(`eng_prompt_${todayKeyLocal}`)) setShowPrompt(true);
      setLoading(false);
      isMountingRef.current = false;
    })();
  }, []);

  // ── Auto-save: always localStorage + GitHub when configured ───────────────
  useEffect(() => {
    if (isMountingRef.current || loading) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      const board = { issues, personalTasks, completedTasks, history, weekStatus, team };
      // Always persist locally first — instant, no network
      lsSave(board);
      if (!apiEnabledRef.current) { setSyncStatus("saved"); setTimeout(() => setSyncStatus("idle"), 1500); return; }
      try {
        const res  = await fetch("/api/engineering", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board, sha: boardShaRef.current }),
        });
        const data = await res.json() as { sha?: string; error?: string };
        if (res.status === 409) {
          setSyncStatus("conflict");
          const latest = await fetch("/api/engineering");
          const ld = await latest.json() as { sha: string | null };
          boardShaRef.current = ld.sha;
          return;
        }
        if (!res.ok) { setSyncStatus("error"); return; }
        boardShaRef.current = data.sha ?? boardShaRef.current;
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 2000);
      } catch { setSyncStatus("error"); }
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [issues, personalTasks, completedTasks, history, weekStatus, team, loading]);

  // ── Poll for remote changes every 30s (only when API is configured) ────────
  useEffect(() => {
    if (loading) return;
    const id = setInterval(async () => {
      if (!apiEnabledRef.current || saveTimerRef.current) return;
      try {
        const res  = await fetch("/api/engineering");
        const data = await res.json() as { board: null | { issues: Issue[]; personalTasks: Record<string,string[]>; completedTasks: Record<string,string[]>; history: Issue[]; weekStatus: Record<string,Record<string,"yes"|"no"|null>>; team?: {name:string;initial:string;color:string;discipline?:string}[] }; sha: string | null };
        if (data.sha && data.sha !== boardShaRef.current && data.board) {
          isMountingRef.current = true;
          setIssues(data.board.issues       ?? INITIAL_ISSUES);
          setPersonalTasks(data.board.personalTasks   ?? {});
          setCompletedTasks(data.board.completedTasks ?? {});
          setHistory(data.board.history     ?? []);
          setWeekStatus(data.board.weekStatus ?? {});
          if (data.board.team?.length) setTeam(data.board.team);
          boardShaRef.current = data.sha;
          lsSave(data.board);
          setSyncStatus("saved");
          setTimeout(() => { isMountingRef.current = false; setSyncStatus("idle"); }, 100);
        }
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, [loading]);

  // addPersonalTask is inlined per-engineer inside the map to guarantee fresh closure

  function completePersonalTask(name: string, idx: number) {
    const task = (personalTasks[name] || [])[idx];
    setPersonalTasks(p => ({ ...p, [name]: (p[name] || []).filter((_, i) => i !== idx) }));
    setCompletedTasks(p => ({ ...p, [name]: [...(p[name] || []), task] }));
  }

  function removePersonalTask(name: string, idx: number) {
    setPersonalTasks(p => ({ ...p, [name]: (p[name] || []).filter((_, i) => i !== idx) }));
  }

  function removeCompletedTask(name: string, idx: number) {
    setCompletedTasks(p => ({ ...p, [name]: (p[name] || []).filter((_, i) => i !== idx) }));
  }

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

  function addToColumn(col: Column) {
    const title = (colInputs[col] || "").trim();
    if (!title) return;
    const id = `ENG-${colCounter.current++}`;
    const today = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
    setIssues(prev => [...prev, {
      id, type:"task", title, priority:"medium", points:1,
      assignee:"—", assigneeInitial:"", assigneeColor:"var(--text-3)",
      labels:[], column:col, description:"", created:today, updated:today,
    }]);
    setColInputs(p => ({ ...p, [col]:"" }));
  }

  function moveIssueStep(id: string, direction: 1 | -1) {
    const colOrder: Column[] = ["todo","inprogress","review","done"];
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      const idx = colOrder.indexOf(i.column);
      const next = colOrder[idx + direction];
      return next ? { ...i, column: next } : i;
    }));
    if (selected?.id === id) {
      setSelected(prev => {
        if (!prev) return null;
        const colOrder: Column[] = ["todo","inprogress","review","done"];
        const idx = colOrder.indexOf(prev.column);
        const next = colOrder[idx + direction];
        return next ? { ...prev, column: next } : prev;
      });
    }
  }

  function deleteIssue(id: string) {
    setIssues(prev => prev.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function archiveIssue(id: string) {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    const today = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
    setHistory(prev => [{ ...issue, updated: today }, ...prev]);
    setIssues(prev => prev.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function clearColumn(col: Column) {
    const toRemove = issues.filter(i => i.column === col);
    if (col === "done") {
      const today = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
      setHistory(prev => [...toRemove.map(i => ({ ...i, updated: today })), ...prev]);
    }
    setIssues(prev => prev.filter(i => i.column !== col));
  }

  function createIssue() {
    if (!newForm.title.trim()) return;
    const t = team.find(t => t.name === newForm.assignee)!;
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
    setNewForm({ title:"", type:"task", priority:"medium", points:"3", assignee:"Gavin" });
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

  // ── Noon prompt: fire when clock crosses 12:00 ─────────────────────────────
  useEffect(() => {
    if (loading) return;
    const tick = setInterval(() => {
      const n = new Date();
      if (n.getHours() >= 12 && !localStorage.getItem(`eng_prompt_${n.toISOString().slice(0,10)}`)) {
        setShowPrompt(true);
      }
    }, 60_000);
    return () => clearInterval(tick);
  }, [loading]);

  // ── Week status helpers ────────────────────────────────────────────────────
  function setDayStatus(name: string, day: string, val: "yes"|"no"|null) {
    setWeekStatus(p => ({ ...p, [name]: { ...(p[name] ?? {}), [day]: val } }));
  }
  function answerPrompt(val: "yes"|"no") {
    if (!promptName) return;
    const todayDay = DAYS[todayIdx];
    setDayStatus(promptName, todayDay, val);
    localStorage.setItem(`eng_prompt_${todayKey}`, val);
    setShowPrompt(false);
    setPromptName(null);
  }

  if (loading) return (
    <div style={{ ...s.page, alignItems:"center", justifyContent:"center" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <div style={{ width:32, height:32, border:"2px solid var(--line)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)", letterSpacing:"0.12em", textTransform:"uppercase" }}>Loading board…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={s.page}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <Link href="/" style={{ textDecoration:"none", color:"inherit" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 6px" }}>
            <div style={{ fontFamily:"var(--serif)", fontWeight:400, fontSize:18, letterSpacing:"-0.01em" }}>
              Ambient <em style={{ fontStyle:"italic", color:"var(--text-2)", fontWeight:300 }}>Intelligence</em>
            </div>
          </div>
        </Link>

        {/* Project */}
        <div>
          <div style={s.navLabel}>Project</div>
          {[
            { label:"Board",    icon:<path d="M2.5 2.5h4v11h-4zM9.5 2.5h4v6h-4zM9.5 11.5h4v2h-4z" strokeLinejoin="round"/>, v:"board" as const },
            { label:"Backlog",  icon:<><rect x="2.5" y="3" width="11" height="1.5" rx=".75"/><rect x="2.5" y="6.5" width="11" height="1.5" rx=".75"/><rect x="2.5" y="10" width="11" height="1.5" rx=".75"/></>, v:"backlog" as const },
            { label:"People",   icon:<><circle cx="5" cy="5.5" r="2.5"/><circle cx="11" cy="5.5" r="2.5"/><path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round"/></>, v:"people" as const },
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
          {(() => {
            const discMap: Record<string, {color:string; members:typeof team}> = {};
            team.forEach(t => {
              const dName = t.discipline || "Other";
              const dColor = DISCIPLINES.find(d => d.name === dName)?.color ?? "var(--text-3)";
              if (!discMap[dName]) discMap[dName] = { color: dColor, members: [] };
              discMap[dName].members.push(t);
            });
            return Object.entries(discMap).map(([dName, { color, members }]) => (
              <div key={dName}>
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px 3px", marginBottom:2 }}>
                  <span style={{ width:6, height:6, borderRadius:2, background:color, flexShrink:0 }}/>
                  <span style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.1em", color }}>{dName}</span>
                </div>
                {members.map(t => (
                  <div key={t.name} style={{ ...s.navItem, paddingLeft:20, cursor:"pointer" }}
                    onClick={() => setFilterAssignee(filterAssignee === t.name ? "all" : t.name)}>
                    <div style={{ ...s.avatar, background: t.color + "33", color: t.color, width:18, height:18, fontSize:8 }}>{t.initial}</div>
                    <span style={{ flex:1, fontSize:12.5 }}>{t.name}</span>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>

        {/* Footer */}
        <div style={{ marginTop:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#3DCC91", boxShadow:"0 0 6px #3DCC91", flexShrink:0 }}/>
            Engineering · Sprint {weekNum}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>

        {/* Topbar */}
        <header style={s.topbar}>
          <div style={s.topbarRow}>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>Engineering / Sprint {weekNum}</div>
              <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
                Sprint <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>{weekNum} · Board</em>
              </h1>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {syncStatus !== "idle" && (
                <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.08em", color: syncStatus === "error" ? "#FF6B6B" : syncStatus === "conflict" ? "#FFC940" : "#3DCC91", display:"flex", alignItems:"center", gap:5 }}>
                  {syncStatus === "saving"   && <><span style={{ width:6, height:6, borderRadius:"50%", background:"#FFC940", animation:"pulse 1s infinite" }}/> Saving…</>}
                  {syncStatus === "saved"    && <><span style={{ width:6, height:6, borderRadius:"50%", background:"#3DCC91" }}/> Synced</>}
                  {syncStatus === "error"    && <><span style={{ width:6, height:6, borderRadius:"50%", background:"#FF6B6B" }}/> Save error</>}
                  {syncStatus === "conflict" && <><span style={{ width:6, height:6, borderRadius:"50%", background:"#FFC940" }}/> Conflict — retrying</>}
                </span>
              )}
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

          {/* ── Shot Clock ── */}
          <ShotClock/>

          {/* View tabs */}
          <div style={{ display:"flex", gap:0, borderBottom:"none", marginTop:-4 }}>
            {(["board","backlog","people"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 16px 12px", fontSize:13, fontFamily:"var(--sans)", color: view===v ? "var(--text)" : "var(--text-3)", borderBottom: view===v ? "2px solid var(--accent)" : "2px solid transparent", transition:"color 0.15s", textTransform:"capitalize" }}>
                {v === "board" ? "Board" : v === "backlog" ? "Backlog" : "People"}
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
            {team.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
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

            {/* ── Engineer personal lanes ── */}
            <div style={{ marginBottom:32 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:12 }}>Engineer Lanes</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
                {team.map(t => {
                  const name = t.name;
                  const disc = DISCIPLINES.find(d => d.name === t.discipline);
                  const tasks = personalTasks[name] || [];
                  const inputVal = personalInputs[name] || "";
                  const selectedCol: Column = engineerColSelect[name] || "todo";

                  const handleAdd = () => {
                    const val = inputVal.trim();
                    if (!val) return;
                    const today = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
                    const id = `ENG-L${Date.now()}`;
                    setIssues(prev => [...prev, {
                      id, type:"task" as IssueType, title:val, priority:"medium" as Priority, points:1,
                      assignee:name, assigneeInitial:t.initial, assigneeColor:t.color,
                      labels:[], column:selectedCol, description:"", created:today, updated:today,
                    }]);
                    setPersonalTasks(p => ({ ...p, [name]: [...(p[name] || []), val] }));
                    setPersonalInputs(p => ({ ...p, [name]: "" }));
                  };

                  return (
                    <div key={name} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {/* Column header */}
                      <div style={{ display:"flex", alignItems:"center", gap:7, padding:"0 2px" }}>
                        <span style={{ width:22, height:22, borderRadius:"50%", background: t.color + "33", color: t.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:10, fontWeight:700, flexShrink:0 }}>{t.initial}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, fontWeight:500, color:"var(--text)", lineHeight:1.2 }}>{name}</div>
                          {disc && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:disc.color, textTransform:"uppercase", letterSpacing:"0.1em" }}>{disc.name}</div>}
                        </div>
                        {/* Week status dots */}
                        <div style={{ display:"flex", gap:3, alignItems:"center", flexShrink:0 }}>
                          {DAYS.map((day, di) => {
                            const st = weekStatus[name]?.[day] ?? null;
                            const isToday = di === todayIdx;
                            const dotColor = st === "yes" ? "#3DCC91" : st === "no" ? "#FF6B6B" : isToday ? t.color + "55" : "var(--line)";
                            return (
                              <button key={day} title={`${day}: ${st ?? "no response"}`}
                                onClick={() => { const next = st === null ? "yes" : st === "yes" ? "no" : null; setDayStatus(name, day, next); }}
                                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"1px", borderRadius:3, transition:"transform 0.13s" }}
                                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                                <span style={{ fontFamily:"var(--mono)", fontSize:7, color: isToday ? t.color : "var(--text-4)", fontWeight: isToday ? 700 : 400, lineHeight:1 }}>{day[0]}</span>
                                <span style={{ width:6, height:6, borderRadius:"50%", background: dotColor, boxShadow: st === "yes" ? `0 0 5px ${dotColor}` : st === "no" ? `0 0 5px ${dotColor}` : "none", transition:"all 0.18s ease", display:"block" }}/>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Task input */}
                      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                        <input
                          value={inputVal}
                          onChange={e => setPersonalInputs(p => ({ ...p, [name]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
                          placeholder="Add task…"
                          style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"6px 9px", fontSize:12, color:"var(--text)", fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" }}
                        />
                        <div style={{ display:"flex", gap:3 }}>
                          {COLUMNS.map(col => {
                            const active = selectedCol === col.id;
                            return (
                              <button key={col.id}
                                onClick={() => setEngineerColSelect(p => ({ ...p, [name]: col.id }))}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = col.color + "88"; e.currentTarget.style.color = col.color; e.currentTarget.style.background = col.color + "18"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 3px 10px ${col.color}30`; } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text-4)"; e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } }}
                                onMouseDown={e => { e.currentTarget.style.transform = "translateY(0) scale(0.93)"; }}
                                onMouseUp={e => { e.currentTarget.style.transform = active ? "translateY(0)" : "translateY(-1px)"; }}
                                style={{ flex:1, padding:"4px 2px", borderRadius:4, border:`1px solid ${active ? col.color : "var(--line)"}`, background: active ? col.color + "22" : "var(--surface-2)", color: active ? col.color : "var(--text-4)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:8.5, textTransform:"uppercase", letterSpacing:"0.06em", transition:"all 0.15s ease", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", boxShadow: active ? `0 0 8px ${col.color}40` : "none", fontWeight: active ? 700 : 400 }}>
                                {col.label}
                              </button>
                            );
                          })}
                          <button onClick={handleAdd}
                            style={{ flexShrink:0, width:26, borderRadius:4, border:"1px solid var(--line)", background:"var(--accent)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Active task bucket */}
                      <div style={{ background:"var(--surface-1)", border:`1px solid ${t.color}22`, borderRadius:10, padding: tasks.length ? "8px" : "16px 12px", minHeight:56, display:"flex", flexDirection:"column", gap:5 }}>
                        {tasks.length === 0 && (
                          <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", textAlign:"center", letterSpacing:"0.08em" }}>EMPTY</div>
                        )}
                        {tasks.map((task, idx) => (
                          <div key={idx}
                            style={{ display:"flex", alignItems:"center", gap:6, background:"var(--surface-2)", borderRadius:6, padding:"7px 9px", border:"1px solid var(--line)", transition:"all 0.16s ease" }}
                            onMouseEnter={e => { e.currentTarget.style.background = t.color + "12"; e.currentTarget.style.borderColor = t.color + "55"; e.currentTarget.style.transform = "translateX(2px)"; e.currentTarget.style.boxShadow = `inset 2px 0 0 ${t.color}, 0 2px 10px ${t.color}1A`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                            <button onClick={() => completePersonalTask(name, idx)} title="Mark complete"
                              style={{ flexShrink:0, width:16, height:16, borderRadius:4, border:`1.5px solid ${t.color}55`, background:"transparent", cursor:"pointer", marginTop:0, transition:"all 0.15s ease", display:"flex", alignItems:"center", justifyContent:"center" }}
                              onMouseEnter={e => { e.currentTarget.style.background = t.color + "28"; e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = "scale(1.18)"; e.currentTarget.style.boxShadow = `0 0 7px ${t.color}55`; const s = e.currentTarget.querySelector("svg") as HTMLElement | null; if (s) s.style.opacity = "1"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = t.color + "55"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; const s = e.currentTarget.querySelector("svg") as HTMLElement | null; if (s) s.style.opacity = "0"; }}>
                              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0, transition:"opacity 0.13s" }}><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
                            </button>
                            <span style={{ flex:1, fontSize:12, color:"var(--text-2)", lineHeight:1.4 }}>{task}</span>
                            <button onClick={() => removePersonalTask(name, idx)}
                              onMouseEnter={e => { const b = e.currentTarget; b.style.opacity="1"; b.style.background="rgba(255,107,107,0.12)"; b.style.borderColor="rgba(255,107,107,0.28)"; b.style.color="#FF6B6B"; b.style.transform="scale(1.1)"; }}
                              onMouseLeave={e => { const b = e.currentTarget; b.style.opacity="0.35"; b.style.background="transparent"; b.style.borderColor="transparent"; b.style.color="var(--text-4)"; b.style.transform="scale(1)"; }}
                              onMouseDown={e => (e.currentTarget.style.transform="scale(0.88)")}
                              onMouseUp={e => (e.currentTarget.style.transform="scale(1.1)")}
                              style={{ flexShrink:0, width:20, height:20, borderRadius:"50%", border:"1px solid transparent", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", opacity:0.35, transition:"all 0.16s ease" }}>
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Completed task bucket */}
                      {(() => {
                        const done = completedTasks[name] || [];
                        return (
                          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 2px 0" }}>
                              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--text-4)" strokeWidth="1.8"><path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span style={{ fontFamily:"var(--mono)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-4)" }}>Done · {done.length}</span>
                            </div>
                            <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, padding: done.length ? "8px" : "12px", minHeight:44, display:"flex", flexDirection:"column", gap:5, opacity:0.75 }}>
                              {done.length === 0 && (
                                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", textAlign:"center", letterSpacing:"0.08em" }}>EMPTY</div>
                              )}
                              {done.map((task, idx) => (
                                <div key={idx}
                                  style={{ display:"flex", alignItems:"center", gap:6, borderRadius:6, padding:"6px 9px", transition:"background 0.14s ease" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = t.color + "08")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <span style={{ flexShrink:0, width:16, height:16, borderRadius:4, border:`1.5px solid ${t.color}44`, background: t.color + "18", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke={t.color} strokeWidth="1.8"><path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </span>
                                  <span style={{ flex:1, fontSize:12, color:"var(--text-3)", lineHeight:1.4, textDecoration:"line-through" }}>{task}</span>
                                  <button onClick={() => removeCompletedTask(name, idx)}
                                    onMouseEnter={e => { const b = e.currentTarget; b.style.opacity="1"; b.style.background="rgba(255,107,107,0.12)"; b.style.borderColor="rgba(255,107,107,0.28)"; b.style.color="#FF6B6B"; b.style.transform="scale(1.1)"; }}
                                    onMouseLeave={e => { const b = e.currentTarget; b.style.opacity="0.3"; b.style.background="transparent"; b.style.borderColor="transparent"; b.style.color="var(--text-4)"; b.style.transform="scale(1)"; }}
                                    onMouseDown={e => (e.currentTarget.style.transform="scale(0.88)")}
                                    onMouseUp={e => (e.currentTarget.style.transform="scale(1.1)")}
                                    style={{ flexShrink:0, width:20, height:20, borderRadius:"50%", border:"1px solid transparent", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", opacity:0.3, transition:"all 0.16s ease" }}>
                                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

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
                        const t = team.find(tm => tm.name === name)!;
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
              {COLUMNS.map((col, colIdx) => {
                const colIssues = byColumn(col.id);
                const colPts    = colIssues.reduce((a, i) => a + i.points, 0);
                const isOver    = dragOverCol === col.id;
                return (
                  <div key={col.id} style={s.col}
                    onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={e => {
                      e.preventDefault();
                      if (draggedId) moveIssue(draggedId, col.id);
                      setDraggedId(null);
                      setDragOverCol(null);
                    }}>
                    {/* Column header */}
                    <div style={s.colHead}>
                      <span style={{ width:8, height:8, borderRadius:2, background:col.color, flexShrink:0 }}/>
                      <span style={{ fontSize:12, fontWeight:600, color:"var(--text-2)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"var(--mono)" }}>{col.label}</span>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{colIssues.length} · {colPts}pts</span>
                      {colIssues.length > 0 && (
                        <button onClick={() => clearColumn(col.id)} title={col.id === "done" ? "Move all to History" : "Clear column"}
                          style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.08em", padding:"2px 6px", borderRadius:4, transition:"color 0.12s, background 0.12s" }}
                          onMouseEnter={e => { e.currentTarget.style.color = col.id === "done" ? "#3DCC91" : "#FF6B6B"; e.currentTarget.style.background = "var(--surface-2)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-4)"; e.currentTarget.style.background = "none"; }}>
                          {col.id === "done" ? "→ History" : "Clear"}
                        </button>
                      )}
                    </div>

                    {/* Drop zone + cards */}
                    <div style={{ flex:1, minHeight:80, borderRadius:10, border: isOver ? `2px dashed ${col.color}` : "2px solid transparent", transition:"border-color 0.15s", padding:isOver ? 4 : 0, display:"flex", flexDirection:"column", gap:8 }}>
                      {colIssues.map(issue => (
                        <IssueCard key={issue.id} issue={issue}
                          colIndex={colIdx}
                          onSelect={() => setSelected(issue)}
                          onMoveBack={() => moveIssueStep(issue.id, -1)}
                          onMoveForward={() => moveIssueStep(issue.id, 1)}
                          onArchive={() => archiveIssue(issue.id)}
                          onClear={() => deleteIssue(issue.id)}
                          onDragStart={() => setDraggedId(issue.id)}
                          onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                          isDragging={draggedId === issue.id}
                        />
                      ))}
                      {colIssues.length === 0 && !isOver && (
                        <div style={{ border:"1px dashed var(--line)", borderRadius:10, padding:"20px 16px", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", textAlign:"center", letterSpacing:"0.1em" }}>
                          EMPTY
                        </div>
                      )}
                    </div>

                    {/* Column text entry */}
                    <div style={{ display:"flex", gap:5, marginTop:4 }}>
                      <input
                        value={colInputs[col.id] || ""}
                        onChange={e => setColInputs(p => ({ ...p, [col.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addToColumn(col.id)}
                        placeholder={`Add to ${col.label}…`}
                        style={{ flex:1, background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"7px 10px", fontSize:12, color:"var(--text)", fontFamily:"var(--sans)", outline:"none", minWidth:0 }}
                      />
                      <button onClick={() => addToColumn(col.id)}
                        style={{ flexShrink:0, width:28, height:28, borderRadius:5, border:"1px solid var(--line)", background:"var(--surface-2)", color:"var(--text-3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── History ── */}
        {history.length > 0 && (
          <div style={{ padding:"0 32px 40px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)" }}>History · {history.length}</div>
              <button onClick={() => setHistory([])}
                style={{ fontFamily:"var(--mono)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-4)", background:"none", border:"none", cursor:"pointer", padding:"2px 6px", borderRadius:4, transition:"color 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FF6B6B")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}>
                Clear History
              </button>
            </div>
            <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden", opacity:0.75 }}>
              {history.map((item, idx) => {
                const tm = TYPE_META[item.type];
                return (
                  <div key={`${item.id}-${idx}`} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 18px", borderBottom: idx < history.length - 1 ? "1px solid var(--line)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11, color:tm.color, fontWeight:700, flexShrink:0 }}>{tm.symbol}</span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", flexShrink:0, width:72 }}>{item.id}</span>
                    <span style={{ fontSize:12.5, color:"var(--text-3)", textDecoration:"line-through", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</span>
                    {item.assigneeInitial && (
                      <span style={{ width:20, height:20, borderRadius:"50%", background:item.assigneeColor+"33", color:item.assigneeColor, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:8.5, fontWeight:700, flexShrink:0 }}>
                        {item.assigneeInitial}
                      </span>
                    )}
                    <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", flexShrink:0 }}>Archived {item.updated}</span>
                    <button
                      onClick={() => setHistory(h => h.filter((_, i) => i !== idx))}
                      onMouseEnter={e => {
                        const b = e.currentTarget;
                        b.style.opacity = "1";
                        b.style.background = "rgba(255,107,107,0.12)";
                        b.style.borderColor = "rgba(255,107,107,0.28)";
                        b.style.color = "#FF6B6B";
                        b.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={e => {
                        const b = e.currentTarget;
                        b.style.opacity = "0.4";
                        b.style.background = "transparent";
                        b.style.borderColor = "transparent";
                        b.style.color = "var(--text-4)";
                        b.style.transform = "scale(1)";
                      }}
                      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.88)")}
                      onMouseUp={e => (e.currentTarget.style.transform = "scale(1.1)")}
                      style={{
                        flexShrink: 0,
                        width: 26, height: 26,
                        borderRadius: "50%",
                        border: "1px solid transparent",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-4)",
                        opacity: 0.4,
                        transition: "all 0.16s ease",
                      }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/>
                      </svg>
                    </button>
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
                <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-2)" }}>Sprint {weekNum}</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)" }}>Apr 21 – May 2 · {issues.length} issues</span>
              </div>
              <BacklogTable issues={filtered} onSelect={setSelected}/>
            </div>
          </div>
        )}

        {/* ── People View ── */}
        {view === "people" && (
          <div style={{ ...s.content, flex:1 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:20, minWidth:900 }}>
              {team.map(t => {
                const name = t.name;
                const disc = DISCIPLINES.find(d => d.members.includes(name));
                const myIssues = issues.filter(i => i.assignee === name);
                const myDone   = myIssues.filter(i => i.column === "done").length;
                const myPts    = myIssues.reduce((a, i) => a + i.points, 0);
                const myDonePts = myIssues.filter(i => i.column === "done").reduce((a, i) => a + i.points, 0);
                const tasks    = personalTasks[name] || [];
                const done     = completedTasks[name] || [];
                const inputVal = personalInputs[name] || "";
                const selectedCol: Column = engineerColSelect[name] || "todo";

                const handleAdd = () => {
                  const val = inputVal.trim();
                  if (!val) return;
                  const today = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" });
                  const id = `ENG-L${Date.now()}`;
                  setIssues(prev => [...prev, {
                    id, type:"task" as IssueType, title:val, priority:"medium" as Priority, points:1,
                    assignee:name, assigneeInitial:t.initial, assigneeColor:t.color,
                    labels:[], column:selectedCol, description:"", created:today, updated:today,
                  }]);
                  setPersonalTasks(p => ({ ...p, [name]: [...(p[name] || []), val] }));
                  setPersonalInputs(p => ({ ...p, [name]: "" }));
                };

                return (
                  <div key={name}
                    style={{ background:"var(--surface-1)", border:`1px solid ${t.color}28`, borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", transition:"all 0.2s ease" }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = t.color + "70"; el.style.transform = "translateY(-3px)"; el.style.boxShadow = `0 12px 36px ${t.color}22`; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = t.color + "28"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}>
                    {/* Header */}
                    <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid var(--line)", background:`linear-gradient(135deg, ${t.color}0A 0%, transparent 60%)` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <span style={{ width:34, height:34, borderRadius:"50%", background: t.color + "33", color: t.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:13, fontWeight:700, flexShrink:0, border:`1.5px solid ${t.color}50` }}>{t.initial}</span>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600, color:"var(--text)", lineHeight:1.2 }}>{name}</div>
                          {disc && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:disc.color, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:1 }}>{disc.name}</div>}
                        </div>
                        <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-2)", fontWeight:600 }}>{myDone}/{myIssues.length} done</div>
                            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{myDonePts}/{myPts} pts</div>
                          </div>
                          <div style={{ display:"flex", gap:5 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setEditEng({ original:name, name, color:t.color, discipline:t.discipline||"" }); }}
                              title="Edit engineer"
                              style={{ fontFamily:"var(--mono)", fontSize:8, textTransform:"uppercase" as const, letterSpacing:"0.1em", color:"var(--text-4)", background:"none", border:"1px solid transparent", borderRadius:4, padding:"2px 6px", cursor:"pointer", transition:"all 0.14s ease" }}
                              onMouseEnter={e => { e.currentTarget.style.color=t.color; e.currentTarget.style.borderColor=t.color+"44"; e.currentTarget.style.background=t.color+"10"; }}
                              onMouseLeave={e => { e.currentTarget.style.color="var(--text-4)"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.background="none"; }}>
                              Edit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); if (confirm(`Remove ${name} from the team?`)) setTeam(prev => prev.filter(tm => tm.name !== name)); }}
                              title="Remove engineer"
                              style={{ fontFamily:"var(--mono)", fontSize:8, textTransform:"uppercase" as const, letterSpacing:"0.1em", color:"var(--text-4)", background:"none", border:"1px solid transparent", borderRadius:4, padding:"2px 6px", cursor:"pointer", transition:"all 0.14s ease" }}
                              onMouseEnter={e => { e.currentTarget.style.color="#FF6B6B"; e.currentTarget.style.borderColor="rgba(255,107,107,0.3)"; e.currentTarget.style.background="rgba(255,107,107,0.08)"; }}
                              onMouseLeave={e => { e.currentTarget.style.color="var(--text-4)"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.background="none"; }}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      <div style={{ height:3, background:"var(--surface-2)", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${myIssues.length ? (myDone/myIssues.length)*100 : 0}%`, background:t.color, borderRadius:2, transition:"width 0.4s" }}/>
                      </div>
                    </div>

                    {/* Mini kanban columns */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0, borderBottom:"1px solid var(--line)" }}>
                      {COLUMNS.map((col, ci) => {
                        const colIssues = myIssues.filter(i => i.column === col.id);
                        return (
                          <div key={col.id} style={{ borderRight: ci < 3 ? "1px solid var(--line)" : "none", padding:"10px 8px", display:"flex", flexDirection:"column", gap:5, minHeight:80 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:3 }}>
                              <span style={{ width:5, height:5, borderRadius:1, background:col.color, flexShrink:0 }}/>
                              <span style={{ fontFamily:"var(--mono)", fontSize:8.5, color:col.color, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, lineHeight:1 }}>{col.label}</span>
                              {colIssues.length > 0 && <span style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--text-4)", marginLeft:"auto" }}>{colIssues.length}</span>}
                            </div>
                            {colIssues.length === 0 && (
                              <div style={{ fontFamily:"var(--mono)", fontSize:8.5, color:"var(--text-4)", textAlign:"center", paddingTop:8, letterSpacing:"0.08em" }}>—</div>
                            )}
                            {colIssues.map(issue => {
                              const tm = TYPE_META[issue.type];
                              const pm = PRIORITY_META[issue.priority];
                              return (
                                <div key={issue.id} onClick={() => setSelected(issue)}
                                  style={{ background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, padding:"7px 8px", cursor:"pointer", transition:"border-color 0.12s, box-shadow 0.12s" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + "66"; e.currentTarget.style.boxShadow = `0 2px 8px ${t.color}18`; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}>
                                  <div style={{ display:"flex", alignItems:"flex-start", gap:4, marginBottom:5 }}>
                                    <span style={{ fontFamily:"var(--mono)", fontSize:9, color:tm.color, fontWeight:700, flexShrink:0, lineHeight:1.4 }}>{tm.symbol}</span>
                                    <span style={{ fontSize:11, lineHeight:1.4, color:"var(--text)", flex:1 }}>{issue.title}</span>
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                    <span style={{ fontFamily:"var(--mono)", fontSize:8.5, color:"var(--text-4)" }}>{issue.id}</span>
                                    {issue.priority !== "low" && <span style={{ width:5, height:5, borderRadius:"50%", background:pm.color, flexShrink:0, marginLeft:"auto" }}/>}
                                    <span style={{ fontFamily:"var(--mono)", fontSize:8.5, color:"var(--text-4)", background:"var(--surface-1)", padding:"1px 5px", borderRadius:3 }}>{issue.points}pt</span>
                                  </div>
                                  {/* Move buttons */}
                                  <div style={{ display:"flex", gap:3, marginTop:6 }}>
                                    <button onClick={e => { e.stopPropagation(); moveIssueStep(issue.id, -1); }}
                                      disabled={ci === 0}
                                      style={{ flex:1, padding:"3px 0", borderRadius:4, border:"1px solid var(--line)", background:"transparent", color: ci > 0 ? "var(--text-3)" : "var(--text-4)", cursor: ci > 0 ? "pointer" : "default", fontFamily:"var(--mono)", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                      ‹
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); moveIssueStep(issue.id, 1); }}
                                      disabled={ci === 3}
                                      style={{ flex:1, padding:"3px 0", borderRadius:4, border:"1px solid var(--line)", background:"transparent", color: ci < 3 ? "var(--text-3)" : "var(--text-4)", cursor: ci < 3 ? "pointer" : "default", fontFamily:"var(--mono)", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                      ›
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Personal tasks */}
                    <div style={{ padding:"10px 12px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                        <span style={{ fontFamily:"var(--mono)", fontSize:8.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)" }}>Personal tasks</span>
                        {tasks.length > 0 && <span style={{ fontFamily:"var(--mono)", fontSize:8.5, color:t.color }}>{tasks.length}</span>}
                        {done.length > 0 && <span style={{ fontFamily:"var(--mono)", fontSize:8.5, color:"var(--text-4)" }}>· {done.length} done</span>}
                      </div>

                      {/* Quick add row */}
                      <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                        <input
                          value={inputVal}
                          onChange={e => setPersonalInputs(p => ({ ...p, [name]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
                          placeholder="Add task…"
                          style={{ flex:1, background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:5, padding:"5px 8px", fontSize:11, color:"var(--text)", fontFamily:"var(--sans)", outline:"none" }}
                        />
                        <div style={{ display:"flex", gap:2 }}>
                          {COLUMNS.map(col => {
                            const active = selectedCol === col.id;
                            return (
                              <button key={col.id}
                                onClick={() => setEngineerColSelect(p => ({ ...p, [name]: col.id }))}
                                title={col.label}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = col.color + "88"; e.currentTarget.style.background = col.color + "22"; e.currentTarget.style.transform = "scale(1.15)"; e.currentTarget.style.boxShadow = `0 0 8px ${col.color}50`; const dot = e.currentTarget.querySelector("span") as HTMLElement|null; if (dot) dot.style.background = col.color; } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; const dot = e.currentTarget.querySelector("span") as HTMLElement|null; if (dot) dot.style.background = "var(--text-4)"; } }}
                                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.88)"; }}
                                onMouseUp={e => { e.currentTarget.style.transform = active ? "scale(1)" : "scale(1.15)"; }}
                                style={{ width:18, height:18, borderRadius:3, border:`1px solid ${active ? col.color : "var(--line)"}`, background: active ? col.color + "22" : "transparent", cursor:"pointer", flexShrink:0, transition:"all 0.15s ease", boxShadow: active ? `0 0 8px ${col.color}44` : "none" }}>
                                <span style={{ width:6, height:6, borderRadius:1, background: active ? col.color : "var(--text-4)", display:"block", margin:"auto", transition:"background 0.15s" }}/>
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={handleAdd}
                          style={{ width:24, height:24, borderRadius:4, border:"none", background:t.color, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>
                        </button>
                      </div>

                      {/* Active tasks */}
                      {tasks.map((task, idx) => (
                        <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--surface-2)", borderRadius:5, padding:"6px 8px", border:"1px solid var(--line)" }}>
                          <button onClick={() => completePersonalTask(name, idx)}
                            style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${t.color}55`, background:"transparent", cursor:"pointer", flexShrink:0, transition:"all 0.15s ease", display:"flex", alignItems:"center", justifyContent:"center" }}
                            onMouseEnter={e => { e.currentTarget.style.background = t.color + "28"; e.currentTarget.style.borderColor = t.color; e.currentTarget.style.transform = "scale(1.18)"; e.currentTarget.style.boxShadow = `0 0 6px ${t.color}55`; const s = e.currentTarget.querySelector("svg") as HTMLElement | null; if (s) s.style.opacity = "1"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = t.color + "55"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; const s = e.currentTarget.querySelector("svg") as HTMLElement | null; if (s) s.style.opacity = "0"; }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0, transition:"opacity 0.13s" }}><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
                          </button>
                          <span style={{ flex:1, fontSize:11.5, color:"var(--text-2)", lineHeight:1.4 }}>{task}</span>
                          <button onClick={() => removePersonalTask(name, idx)}
                            onMouseEnter={e => { const b = e.currentTarget; b.style.opacity="1"; b.style.background="rgba(255,107,107,0.12)"; b.style.borderColor="rgba(255,107,107,0.28)"; b.style.color="#FF6B6B"; b.style.transform="scale(1.1)"; }}
                            onMouseLeave={e => { const b = e.currentTarget; b.style.opacity="0.35"; b.style.background="transparent"; b.style.borderColor="transparent"; b.style.color="var(--text-4)"; b.style.transform="scale(1)"; }}
                            onMouseDown={e => (e.currentTarget.style.transform="scale(0.88)")}
                            onMouseUp={e => (e.currentTarget.style.transform="scale(1.1)")}
                            style={{ flexShrink:0, width:20, height:20, borderRadius:"50%", border:"1px solid transparent", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", opacity:0.35, transition:"all 0.16s ease" }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>
                          </button>
                        </div>
                      ))}

                      {/* Completed tasks */}
                      {done.length > 0 && (
                        <div style={{ display:"flex", flexDirection:"column", gap:3, opacity:0.65 }}>
                          {done.map((task, idx) => (
                            <div key={idx}
                              style={{ display:"flex", alignItems:"center", gap:6, borderRadius:5, padding:"5px 8px", transition:"background 0.14s ease" }}
                              onMouseEnter={e => (e.currentTarget.style.background = t.color + "08")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <span style={{ flexShrink:0, width:14, height:14, borderRadius:3, border:`1.5px solid ${t.color}44`, background: t.color + "18", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke={t.color} strokeWidth="1.8"><path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </span>
                              <span style={{ flex:1, fontSize:11, color:"var(--text-4)", textDecoration:"line-through", lineHeight:1.4 }}>{task}</span>
                              <button onClick={() => removeCompletedTask(name, idx)}
                                onMouseEnter={e => { const b = e.currentTarget; b.style.opacity="1"; b.style.background="rgba(255,107,107,0.12)"; b.style.borderColor="rgba(255,107,107,0.28)"; b.style.color="#FF6B6B"; b.style.transform="scale(1.1)"; }}
                                onMouseLeave={e => { const b = e.currentTarget; b.style.opacity="0.3"; b.style.background="transparent"; b.style.borderColor="transparent"; b.style.color="var(--text-4)"; b.style.transform="scale(1)"; }}
                                onMouseDown={e => (e.currentTarget.style.transform="scale(0.88)")}
                                onMouseUp={e => (e.currentTarget.style.transform="scale(1.1)")}
                                style={{ flexShrink:0, width:20, height:20, borderRadius:"50%", border:"1px solid transparent", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", opacity:0.3, transition:"all 0.16s ease" }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {tasks.length === 0 && done.length === 0 && (
                        <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", letterSpacing:"0.1em", textAlign:"center", padding:"8px 0" }}>NO PERSONAL TASKS</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ── Add Engineer card ── */}
              <button onClick={() => { setNewEng({ name:"", color:"#A78BFA", discipline:"" }); setShowAddEng(true); }}
                style={{ background:"var(--surface-1)", border:"1px dashed var(--line)", borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"32px 20px", cursor:"pointer", transition:"all 0.18s ease", color:"var(--text-4)", minHeight:160 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text-4)"; e.currentTarget.style.background = "var(--surface-1)"; }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/><path d="M19 3v6M16 6h6" strokeLinecap="round"/></svg>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase" }}>Add Engineer</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Add Engineer Modal ── */}
      {showAddEng && (
        <>
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:70 }} onClick={() => setShowAddEng(false)}/>
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:71, width:380, background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:14, padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:20, boxShadow:"0 20px 60px rgba(0,0,0,0.45)" }}>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:6 }}>People / New</div>
              <h2 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:22, letterSpacing:"-0.02em" }}>Add <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>engineer</em></h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={s.formRow}>
                <label style={s.formLabel}>Name</label>
                <input autoFocus value={newEng.name} onChange={e => setNewEng(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { const n = newEng.name.trim(); if (!n) return; const initial = n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); setTeam(prev => [...prev, { name:n, initial, color:newEng.color, discipline:newEng.discipline||undefined }]); setShowAddEng(false); }}}
                  style={s.formInput} placeholder="Full name"/>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Discipline</label>
                <input value={newEng.discipline} onChange={e => setNewEng(p => ({ ...p, discipline: e.target.value }))}
                  style={s.formInput} placeholder="e.g. Software, Electrical…"/>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Color</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["#00B4D8","#F472B6","#FB923C","#818CF8","#34D399","#22D3EE","#A78BFA","#FCD34D","#F87171","#4ADE80","#38BDF8","#E879F9"].map(c => (
                    <button key={c} onClick={() => setNewEng(p => ({ ...p, color: c }))}
                      style={{ width:24, height:24, borderRadius:"50%", background:c, border: newEng.color === c ? `2px solid white` : "2px solid transparent", cursor:"pointer", boxShadow: newEng.color === c ? `0 0 0 2px ${c}` : "none", transition:"all 0.14s ease" }}/>
                  ))}
                </div>
              </div>
              {/* Preview */}
              {newEng.name.trim() && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, background:"var(--surface-2)", border:"1px solid var(--line)" }}>
                  <span style={{ width:32, height:32, borderRadius:"50%", background: newEng.color + "33", color: newEng.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:12, fontWeight:700, border:`1.5px solid ${newEng.color}50` }}>
                    {newEng.name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </span>
                  <span style={{ fontSize:14, fontWeight:500, color:"var(--text)" }}>{newEng.name.trim()}</span>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setShowAddEng(false)} style={{ ...s.btn }}>Cancel</button>
              <button onClick={() => {
                const n = newEng.name.trim();
                if (!n) return;
                const initial = n.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
                setTeam(prev => [...prev, { name:n, initial, color:newEng.color, discipline:newEng.discipline||undefined }]);
                setShowAddEng(false);
              }} style={{ ...s.btnPrimary, opacity: newEng.name.trim() ? 1 : 0.4 }}>Add Engineer</button>
            </div>
          </div>
        </>
      )}

      {/* ── Edit Engineer Modal ── */}
      {editEng && (
        <>
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:70 }} onClick={() => setEditEng(null)}/>
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:71, width:380, background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:14, padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:20, boxShadow:"0 20px 60px rgba(0,0,0,0.45)" }}>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:6 }}>People / Edit</div>
              <h2 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:22, letterSpacing:"-0.02em" }}>Edit <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>{editEng.original}</em></h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={s.formRow}>
                <label style={s.formLabel}>Name</label>
                <input autoFocus value={editEng.name} onChange={e => setEditEng(p => p ? { ...p, name: e.target.value } : p)}
                  style={s.formInput} placeholder="Full name"/>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Discipline</label>
                <input value={editEng.discipline} onChange={e => setEditEng(p => p ? { ...p, discipline: e.target.value } : p)}
                  style={s.formInput} placeholder="e.g. Software, Electrical…"/>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Color</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["#00B4D8","#F472B6","#FB923C","#818CF8","#34D399","#22D3EE","#A78BFA","#FCD34D","#F87171","#4ADE80","#38BDF8","#E879F9"].map(c => (
                    <button key={c} onClick={() => setEditEng(p => p ? { ...p, color: c } : p)}
                      style={{ width:24, height:24, borderRadius:"50%", background:c, border: editEng.color === c ? "2px solid white" : "2px solid transparent", cursor:"pointer", boxShadow: editEng.color === c ? `0 0 0 2px ${c}` : "none", transition:"all 0.14s ease" }}/>
                  ))}
                </div>
              </div>
              {editEng.name.trim() && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, background:"var(--surface-2)", border:"1px solid var(--line)" }}>
                  <span style={{ width:32, height:32, borderRadius:"50%", background: editEng.color + "33", color: editEng.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:12, fontWeight:700, border:`1.5px solid ${editEng.color}50` }}>
                    {editEng.name.trim().split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:"var(--text)" }}>{editEng.name.trim()}</div>
                    {editEng.discipline && <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:2 }}>{editEng.discipline}</div>}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setEditEng(null)} style={{ ...s.btn }}>Cancel</button>
              <button onClick={() => {
                const n = editEng.name.trim();
                if (!n) return;
                const initial = n.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
                setTeam(prev => prev.map(tm => tm.name === editEng.original ? { ...tm, name:n, initial, color:editEng.color, discipline:editEng.discipline||undefined } : tm));
                setEditEng(null);
              }} style={{ ...s.btnPrimary, opacity: editEng.name.trim() ? 1 : 0.4 }}>Save Changes</button>
            </div>
          </div>
        </>
      )}

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

      {/* ── Daily Prompt Modal ── */}
      {showPrompt && (
        <>
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(6px)", zIndex:80 }} onClick={() => setShowPrompt(false)}/>
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:81, width:460, background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:16, padding:"36px 36px 28px", display:"flex", flexDirection:"column", gap:24, boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>
            {!promptName ? (
              <>
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:8 }}>Daily Check-In · {DAYS[todayIdx]}</div>
                  <h2 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:24, letterSpacing:"-0.02em" }}>Who are <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>you?</em></h2>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {team.map(t => (
                    <button key={t.name} onClick={() => setPromptName(t.name)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + "88"; e.currentTarget.style.background = t.color + "14"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${t.color}25`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, border:"1px solid var(--line)", background:"var(--surface-2)", cursor:"pointer", transition:"all 0.16s ease" }}>
                      <span style={{ width:30, height:30, borderRadius:"50%", background: t.color + "30", color: t.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:12, fontWeight:700, flexShrink:0, border:`1.5px solid ${t.color}50` }}>{t.initial}</span>
                      <span style={{ fontSize:13, fontWeight:500, color:"var(--text)" }}>{t.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowPrompt(false)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", transition:"color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}>
                  Skip for today
                </button>
              </>
            ) : (
              <>
                {(() => { const t = team.find(tm => tm.name === promptName)!; return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <span style={{ width:44, height:44, borderRadius:"50%", background: t.color + "30", color: t.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:16, fontWeight:700, border:`2px solid ${t.color}55`, flexShrink:0 }}>{t.initial}</span>
                      <div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:4 }}>{DAYS[todayIdx]} · Daily Check-In</div>
                        <h2 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:22, letterSpacing:"-0.02em" }}>{t.name}, are you <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>on target?</em></h2>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:12 }}>
                      <button onClick={() => answerPrompt("yes")}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(61,204,145,0.2)"; e.currentTarget.style.borderColor = "#3DCC91"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(61,204,145,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(61,204,145,0.08)"; e.currentTarget.style.borderColor = "rgba(61,204,145,0.4)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
                        onMouseUp={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                        style={{ flex:1, padding:"16px 0", borderRadius:10, border:"1px solid rgba(61,204,145,0.4)", background:"rgba(61,204,145,0.08)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:15, fontWeight:600, color:"#3DCC91", letterSpacing:"0.01em", transition:"all 0.16s ease" }}>
                        Yes ✓
                      </button>
                      <button onClick={() => answerPrompt("no")}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.2)"; e.currentTarget.style.borderColor = "#FF6B6B"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,107,107,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,107,0.08)"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.4)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
                        onMouseUp={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                        style={{ flex:1, padding:"16px 0", borderRadius:10, border:"1px solid rgba(255,107,107,0.4)", background:"rgba(255,107,107,0.08)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:15, fontWeight:600, color:"#FF6B6B", letterSpacing:"0.01em", transition:"all 0.16s ease" }}>
                        Not yet
                      </button>
                    </div>
                    <button onClick={() => setPromptName(null)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", transition:"color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}>
                      ← Back
                    </button>
                  </>
                ); })()}
              </>
            )}
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
                  {team.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
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
function IssueCard({ issue, colIndex, onSelect, onMoveBack, onMoveForward, onArchive, onClear, onDragStart, onDragEnd, isDragging }: {
  issue: Issue;
  colIndex: number;
  onSelect: () => void;
  onMoveBack: () => void;
  onMoveForward: () => void;
  onArchive: () => void;
  onClear: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pm = PRIORITY_META[issue.priority];
  const tm = TYPE_META[issue.type];
  const canBack    = colIndex > 0;
  const canForward = colIndex < 3;
  const colShadows = ["rgba(160,160,180,0.18)","rgba(255,201,64,0.22)","rgba(45,114,210,0.22)","rgba(61,204,145,0.22)"];
  const colShadow  = colShadows[colIndex] ?? "rgba(0,0,0,0.18)";

  return (
    <div
      draggable
      onDragStart={e => { onDragStart(); e.dataTransfer.effectAllowed = "move"; }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        background: hovered ? "var(--surface-2)" : "var(--surface-1)",
        border:`1px solid ${hovered ? "var(--line-strong)" : "var(--line)"}`,
        borderRadius:10, padding:"13px 15px", cursor:"grab",
        boxShadow: hovered ? `0 6px 24px ${colShadow}` : "none",
        transform: isDragging ? "rotate(2deg) scale(0.97)" : hovered ? "translateY(-2px)" : "none",
        opacity: isDragging ? 0.5 : 1,
        transition:"all 0.18s ease",
      }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:tm.color, fontWeight:700, marginTop:1, flexShrink:0 }}>{tm.symbol}</span>
        <p style={{ margin:0, fontSize:13, lineHeight:1.4, color:"var(--text)", flex:1 }}>{issue.title}</p>
        <button onClick={e => { e.stopPropagation(); onClear(); }}
          style={{ flexShrink:0, width:22, height:22, borderRadius:5, border:"1px solid var(--line)", background:"var(--surface-2)", cursor:"pointer", color:"var(--text-3)", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.12s, border-color 0.12s, color 0.12s", marginTop:-1 }}
          onMouseEnter={e => { e.currentTarget.style.background="#FF6B6B22"; e.currentTarget.style.borderColor="#FF6B6B55"; e.currentTarget.style.color="#FF6B6B"; }}
          onMouseLeave={e => { e.currentTarget.style.background="var(--surface-2)"; e.currentTarget.style.borderColor="var(--line)"; e.currentTarget.style.color="var(--text-3)"; }}>✕</button>
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
          {issue.assigneeInitial && (
            <span style={{ width:20, height:20, borderRadius:"50%", background:issue.assigneeColor+"33", color:issue.assigneeColor, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:9, fontWeight:700 }}>
              {issue.assigneeInitial}
            </span>
          )}
        </span>
      </div>
      {issue.labels.length > 0 && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
          {issue.labels.slice(0,2).map(l => (
            <span key={l} style={{ fontFamily:"var(--mono)", fontSize:9, padding:"2px 6px", borderRadius:3, background:"var(--surface-2)", color:"var(--text-4)" }}>{l}</span>
          ))}
        </div>
      )}
      {/* Move buttons */}
      {hovered && (
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:10 }} onClick={e => e.stopPropagation()}>
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={onMoveBack} disabled={!canBack}
              style={{ flex:1, padding:"4px 0", borderRadius:5, border:"1px solid var(--line)", background:"var(--surface-2)", color: canBack ? "var(--text-2)" : "var(--text-4)", cursor: canBack ? "pointer" : "default", fontFamily:"var(--mono)", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
            <button onClick={onMoveForward} disabled={!canForward}
              style={{ flex:1, padding:"4px 0", borderRadius:5, border:"1px solid var(--line)", background:"var(--surface-2)", color: canForward ? "var(--text-2)" : "var(--text-4)", cursor: canForward ? "pointer" : "default", fontFamily:"var(--mono)", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
              Forward
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          {colIndex === 3 && (
            <button onClick={onArchive}
              style={{ width:"100%", padding:"4px 0", borderRadius:5, border:"1px solid rgba(61,204,145,0.3)", background:"rgba(61,204,145,0.08)", color:"#3DCC91", cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 5h12v9H2zM2 5l2-3h8l2 3M6 9h4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Move to History
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ShotClock ─────────────────────────────────────────────────────────────
// 24-hour daily shot clock — resets at midnight, counts down to end of day
function ShotClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Count down to next noon (12:00 PM)
  const nextNoon = new Date(now);
  nextNoon.setHours(12, 0, 0, 0);
  if (now >= nextNoon) nextNoon.setDate(nextNoon.getDate() + 1);
  const prevNoon = new Date(nextNoon); prevNoon.setDate(prevNoon.getDate() - 1);

  const total     = 86400000; // 24h cycle noon-to-noon
  const elapsed   = now.getTime() - prevNoon.getTime();
  const remaining = nextNoon.getTime() - now.getTime();
  const pct       = Math.min(100, (elapsed / total) * 100);

  const hrs  = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  // urgency ramps in final 2h and final 30min
  const urgency = remaining < 1800000 ? "#FF6B6B" : remaining < 2 * 3600000 ? "#FFC940" : "#3DCC91";

  const pad = (n: number) => String(n).padStart(2, "0");

  // label: time of day
  const label = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 0 8px", borderTop:"1px solid var(--line)" }}>
      {/* Label */}
      <div style={{ display:"flex", flexDirection:"column" as const, flexShrink:0 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:9, textTransform:"uppercase" as const, letterSpacing:"0.14em", color:"var(--text-4)", lineHeight:1.2 }}>Shot Clock</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--text-4)", letterSpacing:"0.08em", opacity:0.6 }}>{label}</span>
      </div>

      {/* Countdown */}
      <div style={{ display:"flex", alignItems:"baseline", gap:4, flexShrink:0 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:700, color:urgency, letterSpacing:"0.04em", lineHeight:1, transition:"color 0.6s ease" }}>{pad(hrs)}</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>h</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:700, color:urgency, letterSpacing:"0.04em", lineHeight:1 }}>{pad(mins)}</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>m</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:700, color:urgency, letterSpacing:"0.04em", lineHeight:1 }}>{pad(secs)}</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>s</span>
      </div>

      {/* Progress bar */}
      <div style={{ flex:1, height:4, borderRadius:4, background:"var(--surface-2)", overflow:"hidden", position:"relative" }}>
        <div style={{
          position:"absolute", left:0, top:0, bottom:0,
          width:`${pct}%`,
          background: `linear-gradient(90deg, #3DCC91, ${urgency})`,
          borderRadius:4,
          transition:"width 1s linear, background 0.6s ease",
          boxShadow: `0 0 8px ${urgency}55`,
        }}/>
      </div>

      {/* Pct elapsed */}
      <div style={{ fontFamily:"var(--mono)", fontSize:10, color:urgency, whiteSpace:"nowrap", flexShrink:0, transition:"color 0.6s ease" }}>
        {Math.round(pct)}% elapsed
      </div>

      {/* Target */}
      <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--text-4)", whiteSpace:"nowrap", flexShrink:0, opacity:0.7 }}>
        → noon
      </div>
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

