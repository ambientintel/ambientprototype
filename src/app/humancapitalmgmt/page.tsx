"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────
type View = "orgchart" | "directory" | "roles" | "analytics";
type Status = "active" | "onleave" | "contractor" | "open";
type Department = "Executive" | "Engineering" | "Clinical" | "Operations" | "Design" | "Finance" | "Regulatory";
type Level = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
type SortKey = "name" | "role" | "department" | "level" | "status" | "startDate";

interface Person {
  id: string;
  name: string;
  role: string;
  department: Department;
  level: Level;
  managerId: string | null;
  email: string;
  status: Status;
  startDate: string;
  color: string;
  location: string;
}

interface TreeNode {
  person: Person;
  children: TreeNode[];
  x: number;
  y: number;
  subtreeWidth: number;
}

// ── Constants ─────────────────────────────────────────────────────────────
const NODE_W = 172;
const NODE_H = 76;
const GAP_H = 28;
const GAP_V = 72;
const PAD_TOP = 32;
const PAD_H = 60;

const DEPARTMENTS: Department[] = ["Executive","Engineering","Clinical","Operations","Design","Finance","Regulatory"];
const LEVELS: Level[] = ["L1","L2","L3","L4","L5","L6","L7"];

const DEPT_COLORS: Record<Department, string> = {
  Executive:   "#2D72D2",
  Engineering: "#00B4D8",
  Clinical:    "#3DCC91",
  Operations:  "#FB923C",
  Design:      "#A78BFA",
  Finance:     "#FFC940",
  Regulatory:  "#F59E0B",
};

const STATUS_META: Record<Status, { color: string; label: string; bg: string }> = {
  active:     { color:"#3DCC91", label:"Active",     bg:"rgba(61,204,145,0.12)"  },
  onleave:    { color:"#FFC940", label:"On Leave",   bg:"rgba(255,201,64,0.12)"  },
  contractor: { color:"#A78BFA", label:"Contractor", bg:"rgba(167,139,250,0.12)" },
  open:       { color:"rgba(246,247,248,0.38)", label:"Open Role", bg:"rgba(255,255,255,0.06)" },
};

const LEVEL_BAND: Record<Level, string> = {
  L1:"Associate", L2:"Junior", L3:"Mid-Level", L4:"Senior", L5:"Staff", L6:"Director", L7:"Executive",
};

// ── Seed Data ─────────────────────────────────────────────────────────────
const SEED: Person[] = [
  { id:"P001", name:"Elena Vasquez",    role:"Chief Executive Officer",       department:"Executive",   level:"L7", managerId:null,    email:"evasquez@ambient.ai",   status:"active",     startDate:"Jan 2022", color:"#2D72D2", location:"San Francisco, CA" },
  { id:"P002", name:"Marcus Chen",      role:"Chief Technology Officer",       department:"Engineering", level:"L7", managerId:"P001",  email:"mchen@ambient.ai",      status:"active",     startDate:"Mar 2022", color:"#00B4D8", location:"San Francisco, CA" },
  { id:"P003", name:"Sofia Patel",      role:"Chief Medical Officer",          department:"Clinical",    level:"L7", managerId:"P001",  email:"spatel@ambient.ai",     status:"active",     startDate:"May 2022", color:"#3DCC91", location:"Chicago, IL"       },
  { id:"P004", name:"Jordan Kim",       role:"VP Finance",                     department:"Finance",     level:"L6", managerId:"P001",  email:"jkim@ambient.ai",       status:"active",     startDate:"Jun 2022", color:"#FFC940", location:"New York, NY"      },
  { id:"P005", name:"Riley Torres",     role:"VP Operations",                  department:"Operations",  level:"L6", managerId:"P001",  email:"rtorres@ambient.ai",    status:"active",     startDate:"Jul 2022", color:"#FB923C", location:"Denver, CO"        },
  { id:"P006", name:"Nour Khalil",      role:"Head of Design",                 department:"Design",      level:"L5", managerId:"P001",  email:"nkhalil@ambient.ai",    status:"active",     startDate:"Sep 2022", color:"#A78BFA", location:"London, UK"        },
  { id:"P007", name:"Dr. Claire Dubois",role:"VP Regulatory Affairs",          department:"Regulatory",  level:"L6", managerId:"P001",  email:"cdubois@ambient.ai",    status:"active",     startDate:"Apr 2022", color:"#F59E0B", location:"Paris, FR"         },
  { id:"P010", name:"Gavin Wright",     role:"Senior Hardware Engineer",        department:"Engineering", level:"L5", managerId:"P002",  email:"gwright@ambient.ai",    status:"active",     startDate:"Aug 2022", color:"#00B4D8", location:"San Francisco, CA" },
  { id:"P011", name:"Isaac Osei",       role:"Backend Engineer",                department:"Engineering", level:"L4", managerId:"P002",  email:"iosei@ambient.ai",      status:"active",     startDate:"Sep 2022", color:"#818CF8", location:"Remote"            },
  { id:"P012", name:"Hanna Mueller",    role:"Full-Stack Engineer",             department:"Engineering", level:"L4", managerId:"P002",  email:"hmueller@ambient.ai",   status:"active",     startDate:"Oct 2022", color:"#F472B6", location:"Berlin, DE"        },
  { id:"P013", name:"Paulo Santos",     role:"Cloud Infrastructure Engineer",   department:"Engineering", level:"L4", managerId:"P002",  email:"psantos@ambient.ai",    status:"active",     startDate:"Oct 2022", color:"#FB923C", location:"São Paulo, BR"     },
  { id:"P014", name:"Aki Tanaka",       role:"Frontend Engineer",               department:"Engineering", level:"L3", managerId:"P002",  email:"atanaka@ambient.ai",    status:"active",     startDate:"Jan 2023", color:"#34D399", location:"Tokyo, JP"         },
  { id:"P015", name:"Abdul Rahman",     role:"Security Engineer",               department:"Engineering", level:"L4", managerId:"P002",  email:"arahman@ambient.ai",    status:"active",     startDate:"Jan 2023", color:"#22D3EE", location:"Dubai, UAE"        },
  { id:"P016", name:"",                role:"ML Engineer",                      department:"Engineering", level:"L4", managerId:"P002",  email:"",                      status:"open",       startDate:"",         color:"#2D72D2", location:""                  },
  { id:"P020", name:"Dr. Amy Lin",      role:"Clinical Lead",                   department:"Clinical",    level:"L5", managerId:"P003",  email:"alin@ambient.ai",       status:"active",     startDate:"Jun 2022", color:"#3DCC91", location:"Chicago, IL"       },
  { id:"P021", name:"James Okonkwo",    role:"Clinical Informatics Specialist", department:"Clinical",    level:"L3", managerId:"P020",  email:"jokonkwo@ambient.ai",   status:"active",     startDate:"Feb 2023", color:"#3DCC91", location:"Atlanta, GA"       },
  { id:"P022", name:"Maria Rossi",      role:"Nurse Informatics Consultant",    department:"Clinical",    level:"L3", managerId:"P020",  email:"mrossi@ambient.ai",     status:"contractor", startDate:"Mar 2023", color:"#3DCC91", location:"Boston, MA"        },
  { id:"P023", name:"",                role:"Clinical Data Analyst",            department:"Clinical",    level:"L3", managerId:"P003",  email:"",                      status:"open",       startDate:"",         color:"#3DCC91", location:""                  },
  { id:"P030", name:"Sam Park",         role:"UX Designer",                     department:"Design",      level:"L3", managerId:"P006",  email:"spark@ambient.ai",      status:"active",     startDate:"Jan 2023", color:"#A78BFA", location:"Seoul, KR"         },
  { id:"P031", name:"",                role:"Product Designer",                  department:"Design",      level:"L4", managerId:"P006",  email:"",                      status:"open",       startDate:"",         color:"#A78BFA", location:""                  },
  { id:"P040", name:"Thomas Berg",      role:"Regulatory Affairs Specialist",   department:"Regulatory",  level:"L3", managerId:"P007",  email:"tberg@ambient.ai",      status:"active",     startDate:"Aug 2022", color:"#F59E0B", location:"Munich, DE"        },
  { id:"P041", name:"",                role:"Quality Systems Manager",           department:"Regulatory",  level:"L4", managerId:"P007",  email:"",                      status:"open",       startDate:"",         color:"#F59E0B", location:""                  },
  { id:"P050", name:"Priya Sharma",     role:"Senior Financial Analyst",        department:"Finance",     level:"L4", managerId:"P004",  email:"psharma@ambient.ai",    status:"active",     startDate:"Feb 2023", color:"#FFC940", location:"New York, NY"      },
  { id:"P060", name:"Leo Marchetti",    role:"Operations Manager",              department:"Operations",  level:"L4", managerId:"P005",  email:"lmarchetti@ambient.ai", status:"active",     startDate:"Mar 2023", color:"#FB923C", location:"Denver, CO"        },
  { id:"P061", name:"Yuki Sato",        role:"Customer Success Manager",        department:"Operations",  level:"L3", managerId:"P005",  email:"ysato@ambient.ai",      status:"onleave",    startDate:"Apr 2023", color:"#FB923C", location:"Remote"            },
];

// ── Tree utilities ─────────────────────────────────────────────────────────
function buildChildren(people: Person[], parentId: string | null): TreeNode[] {
  return people.filter(p => p.managerId === parentId).map(p => ({
    person: p, children: buildChildren(people, p.id), x:0, y:0, subtreeWidth:0,
  }));
}

function measureWidth(n: TreeNode): void {
  n.children.forEach(measureWidth);
  n.subtreeWidth = n.children.length === 0
    ? NODE_W + GAP_H
    : Math.max(NODE_W + GAP_H, n.children.reduce((s, c) => s + c.subtreeWidth, 0));
}

function placeNodes(n: TreeNode, left: number, depth: number): void {
  n.y = PAD_TOP + depth * (NODE_H + GAP_V);
  n.x = left + n.subtreeWidth / 2 - NODE_W / 2;
  let cl = left;
  for (const c of n.children) { placeNodes(c, cl, depth + 1); cl += c.subtreeWidth; }
}

function flatten(n: TreeNode): TreeNode[] {
  return [n, ...n.children.flatMap(flatten)];
}

function layoutTree(people: Person[]): { nodes: TreeNode[]; width: number; height: number } {
  const roots = buildChildren(people, null);
  if (!roots.length) return { nodes:[], width:800, height:400 };
  let offset = PAD_H;
  roots.forEach(r => { measureWidth(r); placeNodes(r, offset, 0); offset += r.subtreeWidth + GAP_H * 2; });
  const all = roots.flatMap(flatten);
  const w = offset + PAD_H;
  const h = all.reduce((m, n) => Math.max(m, n.y + NODE_H), 0) + 60;
  return { nodes: all, width: w, height: h };
}

function initials(name: string): string {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let _idCounter = 100;
function newId(): string { return `P${Date.now()}${_idCounter++}`; }

const LS_KEY = "hcm_people_v2";
function lsLoad(): Person[] | null {
  try { const d = localStorage.getItem(LS_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}
function lsSave(p: Person[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
}

// ── Blank person factory ───────────────────────────────────────────────────
function blank(overrides?: Partial<Person>): Person {
  return {
    id: newId(), name:"", role:"", department:"Engineering", level:"L3",
    managerId:null, email:"", status:"active", startDate:"", color:"#2D72D2", location:"",
    ...overrides,
  };
}

// ── Inline SVG icons ───────────────────────────────────────────────────────
const Icon = {
  org:    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".75"/><rect x="1" y="11" width="4" height="3" rx=".75"/><rect x="6" y="11" width="4" height="3" rx=".75"/><rect x="11" y="11" width="4" height="3" rx=".75"/><path d="M8 4.5v3M3 11V9h10V8" strokeLinecap="round"/></svg>,
  list:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="2.5" width="13" height="2" rx=".5"/><rect x="1.5" y="7" width="13" height="2" rx=".5"/><rect x="1.5" y="11.5" width="13" height="2" rx=".5"/></svg>,
  roles:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/></svg>,
  chart:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="9" width="3" height="5.5" rx=".5"/><rect x="6.5" y="5" width="3" height="9.5" rx=".5"/><rect x="11.5" y="1.5" width="3" height="13" rx=".5"/></svg>,
  plus:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>,
  close:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11 2l3 3-9 9H2v-3L11 2z" strokeLinejoin="round"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5M3 4l1 10h8l1-10" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrow:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  globe:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="6.5"/><path d="M8 1.5C8 1.5 5 4 5 8s3 6.5 3 6.5M8 1.5C8 1.5 11 4 11 8s-3 6.5-3 6.5M1.5 8h13" strokeLinecap="round"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════
export default function HumanCapitalMgmt() {
  const [people, setPeople] = useState<Person[]>(() => lsLoad() ?? SEED);
  const [view, setView] = useState<View>("orgchart");
  const [selected, setSelected] = useState<Person | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addManagerId, setAddManagerId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Person | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deptFilter, setDeptFilter] = useState<Department | "all">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPerson, setNewPerson] = useState<Person>(blank());
  const [clock, setClock] = useState("");

  // Persist
  useEffect(() => { lsSave(people); }, [people]);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Derived
  const headcount = people.filter(p => p.status !== "open").length;
  const openRoles  = people.filter(p => p.status === "open").length;
  const contractors = people.filter(p => p.status === "contractor").length;
  const onLeave    = people.filter(p => p.status === "onleave").length;

  function addPerson() {
    const p = { ...newPerson, id: newId(), managerId: addManagerId, color: DEPT_COLORS[newPerson.department] };
    setPeople(prev => [...prev, p]);
    setShowAdd(false);
    setNewPerson(blank());
    setAddManagerId(null);
  }

  function updatePerson(p: Person) {
    setPeople(prev => prev.map(x => x.id === p.id ? p : x));
    setSelected(p);
    setEditDraft(null);
    setIsEditing(false);
  }

  function deletePerson(id: string) {
    // Reassign direct reports to deleted person's manager
    setPeople(prev => {
      const target = prev.find(p => p.id === id);
      return prev.filter(p => p.id !== id).map(p =>
        p.managerId === id ? { ...p, managerId: target?.managerId ?? null } : p
      );
    });
    setSelected(null);
    setConfirmDelete(false);
  }

  function openAdd(managerId: string | null) {
    setAddManagerId(managerId);
    setNewPerson(blank({ managerId }));
    setShowAdd(true);
  }

  // ── Styles ─────────────────────────────────────────────────────────────
  const s = {
    page:    { display:"flex", minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--sans)" } as React.CSSProperties,
    sidebar: { width:220, flexShrink:0, borderRight:"1px solid var(--line)", padding:"28px 20px 32px", display:"flex", flexDirection:"column" as const, gap:32, position:"sticky" as const, top:0, height:"100vh", overflowY:"auto" as const },
    main:    { flex:1, minWidth:0, display:"flex", flexDirection:"column" as const },
    navLabel:{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase" as const, letterSpacing:"0.14em", color:"var(--text-4)", padding:"0 8px", marginBottom:8 },
    navItem: { display:"flex", alignItems:"center", gap:10, padding:"7px 8px 7px 10px", fontSize:13, color:"var(--text-2)", borderRadius:4, cursor:"pointer", transition:"all 0.15s" } as React.CSSProperties,
  };

  const navItems: { label:string; view:View; icon:React.ReactNode }[] = [
    { label:"Org Chart",   view:"orgchart",   icon:Icon.org   },
    { label:"Directory",   view:"directory",  icon:Icon.list  },
    { label:"Roles",       view:"roles",      icon:Icon.roles },
    { label:"Analytics",   view:"analytics",  icon:Icon.chart },
  ];

  return (
    <div style={s.page}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <Link href="/" style={{ textDecoration:"none", color:"inherit" }}>
          <div style={{ fontFamily:"var(--serif)", fontWeight:400, fontSize:18, letterSpacing:"-0.01em", padding:"0 6px" }}>
            Ambient <em style={{ fontStyle:"italic", color:"var(--text-2)", fontWeight:300 }}>Intelligence</em>
          </div>
        </Link>

        {/* Navigation */}
        <div>
          <div style={s.navLabel}>Human Capital</div>
          {navItems.map(({ label, view:v, icon }) => (
            <div key={v} style={{ ...s.navItem, background: view===v ? "var(--surface-2)" : "transparent", color: view===v ? "var(--text)" : "var(--text-2)", fontWeight: view===v ? 500 : 400 }}
              onClick={() => setView(v)}>
              <span style={{ opacity: view===v ? 1 : 0.65 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Dept filter */}
        <div>
          <div style={s.navLabel}>Department</div>
          {(["all", ...DEPARTMENTS] as (Department | "all")[]).map(d => {
            const count = d === "all" ? people.filter(p => p.status !== "open").length : people.filter(p => p.department === d && p.status !== "open").length;
            return (
              <div key={d} style={{ ...s.navItem, color: deptFilter===d ? "var(--text)" : "var(--text-2)", background: deptFilter===d ? "var(--surface-2)" : "transparent" }}
                onClick={() => setDeptFilter(d as Department | "all")}>
                {d !== "all" && <span style={{ width:6, height:6, borderRadius:2, background:DEPT_COLORS[d as Department], flexShrink:0 }}/>}
                <span style={{ flex:1, fontSize:12.5 }}>{d === "all" ? "All Departments" : d}</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Add person CTA */}
        <div style={{ marginTop:"auto" }}>
          <button onClick={() => openAdd(null)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"9px 12px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)", letterSpacing:0 }}>
            {Icon.plus} Add Person
          </button>
          <div style={{ marginTop:20, fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
            <div>HCM · Sprint 18</div>
            <div style={{ marginTop:4, color:"var(--text-4)", fontVariantNumeric:"tabular-nums" }}>{clock}</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        {/* Header */}
        <div style={{ borderBottom:"1px solid var(--line)", padding:"18px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg)", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:4 }}>People Operations</div>
            <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
              Human Capital <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>Management</em>
            </h1>
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            {[
              { label:"Headcount", value:headcount, color:"var(--text)" },
              { label:"Open Roles", value:openRoles, color:"#FFC940" },
              { label:"Contractors", value:contractors, color:"#A78BFA" },
              { label:"On Leave", value:onLeave, color:"#FB923C" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:18, fontWeight:500, color, fontVariantNumeric:"tabular-nums" }}>{value}</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)" }}>{label}</div>
              </div>
            ))}
            <button onClick={() => openAdd(null)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>
              {Icon.plus} Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {view === "orgchart"  && <OrgChartView people={people} deptFilter={deptFilter} onSelect={setSelected} onAddUnder={openAdd} />}
          {view === "directory" && <DirectoryView people={people} search={search} setSearch={setSearch} sortKey={sortKey} setSortKey={setSortKey} sortAsc={sortAsc} setSortAsc={setSortAsc} deptFilter={deptFilter} onSelect={setSelected} onAdd={() => openAdd(null)} />}
          {view === "roles"     && <RolesView people={people} deptFilter={deptFilter} onSelect={setSelected} onAdd={() => openAdd(null)} />}
          {view === "analytics" && <AnalyticsView people={people} />}
        </div>
      </main>

      {/* ── Person Drawer ── */}
      {selected && (
        <PersonDrawer
          person={editDraft ?? selected}
          isEditing={isEditing}
          confirmDelete={confirmDelete}
          people={people}
          onClose={() => { setSelected(null); setIsEditing(false); setEditDraft(null); setConfirmDelete(false); }}
          onEdit={() => { setIsEditing(true); setEditDraft({ ...selected }); }}
          onChange={p => setEditDraft(p)}
          onSave={() => editDraft && updatePerson(editDraft)}
          onCancel={() => { setIsEditing(false); setEditDraft(null); }}
          onDelete={() => setConfirmDelete(true)}
          onConfirmDelete={() => deletePerson(selected.id)}
          onCancelDelete={() => setConfirmDelete(false)}
          onAddDirectReport={() => openAdd(selected.id)}
        />
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <AddModal
          person={newPerson}
          onChange={setNewPerson}
          onSave={addPerson}
          onClose={() => { setShowAdd(false); setNewPerson(blank()); setAddManagerId(null); }}
          people={people}
          managerId={addManagerId}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Org Chart View
// ═══════════════════════════════════════════════════════════════════════════
function OrgChartView({ people, deptFilter, onSelect, onAddUnder }: {
  people: Person[];
  deptFilter: Department | "all";
  onSelect: (p: Person) => void;
  onAddUnder: (managerId: string | null) => void;
}) {
  const filtered = deptFilter === "all" ? people : people.filter(p => {
    if (p.department === deptFilter) return true;
    return people.some(q => q.department === deptFilter && q.managerId === p.id);
  });

  const { nodes, width, height } = layoutTree(deptFilter === "all" ? people : filtered);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.75);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center the root node
  useEffect(() => {
    if (!scrollRef.current || !nodes.length) return;
    const root = nodes.find(n => !n.person.managerId);
    if (!root) return;
    const container = scrollRef.current;
    const rootCenterX = (root.x + NODE_W / 2) * zoom;
    const scrollLeft = rootCenterX - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, scrollLeft);
    container.scrollTop = 0;
  }, [nodes, zoom]);

  // Fit-to-screen zoom
  function fitZoom() {
    if (!scrollRef.current) return;
    const containerW = scrollRef.current.clientWidth;
    const containerH = scrollRef.current.clientHeight;
    const zw = (containerW - 40) / Math.max(width, 1);
    const zh = (containerH - 40) / Math.max(height, 1);
    setZoom(Math.min(Math.max(Math.min(zw, zh), 0.25), 1));
  }

  // Connector paths
  const paths: { d: string; color: string }[] = [];
  for (const n of nodes) {
    if (!n.person.managerId) continue;
    const parent = nodes.find(m => m.person.id === n.person.managerId);
    if (!parent) continue;
    const px = parent.x + NODE_W / 2;
    const py = parent.y + NODE_H;
    const cx = n.x + NODE_W / 2;
    const cy = n.y;
    const my = (py + cy) / 2;
    paths.push({ d:`M${px},${py} C${px},${my} ${cx},${my} ${cx},${cy}`, color: DEPT_COLORS[n.person.department] });
  }

  const scaledW = Math.max(width * zoom, 600);
  const scaledH = Math.max(height * zoom, 400);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 24px", borderBottom:"1px solid var(--line)", flexShrink:0 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)" }}>
          {nodes.filter(n => n.person.status !== "open").length} people · {nodes.filter(n => n.person.status === "open").length} open roles
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginLeft:"auto" }}>
          {Object.entries(STATUS_META).map(([s, m]) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:m.color, flexShrink:0 }}/>
              {m.label}
            </div>
          ))}
          <div style={{ width:1, height:16, background:"var(--line)", margin:"0 4px" }}/>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.25))} style={{ padding:"4px 8px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:4, color:"var(--text-2)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:12, lineHeight:1 }}>−</button>
          <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)", minWidth:36, textAlign:"center" }}>{Math.round(zoom*100)}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} style={{ padding:"4px 8px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:4, color:"var(--text-2)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:12, lineHeight:1 }}>+</button>
          <button onClick={fitZoom} style={{ padding:"4px 10px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:4, color:"var(--text-3)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Fit</button>
          <button onClick={() => setZoom(1)} style={{ padding:"4px 10px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:4, color:"var(--text-3)", cursor:"pointer", fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.08em" }}>1:1</button>
          <button onClick={() => onAddUnder(null)} style={{ padding:"4px 10px", background:"var(--accent)", border:0, borderRadius:4, color:"#fff", cursor:"pointer", fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.08em", display:"flex", alignItems:"center", gap:5 }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>Add
          </button>
        </div>
      </div>

      {/* Scrollable canvas */}
      <div ref={scrollRef} style={{ overflow:"auto", flex:1, position:"relative" }}>
        {/* Scroll area sized to scaled canvas */}
        <div style={{ width:scaledW + 80, height:scaledH + 60, position:"relative", flexShrink:0 }}>
          {/* Scaled canvas */}
          <div style={{ position:"absolute", top:0, left:0, width, height, transform:`scale(${zoom})`, transformOrigin:"top left" }}>
            {/* SVG connectors */}
            <svg style={{ position:"absolute", top:0, left:0, width, height, pointerEvents:"none", overflow:"visible" }}>
              {paths.map((p, i) => (
                <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={1.8} strokeOpacity={0.35}/>
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map(n => (
              <OrgNode key={n.person.id} node={n} isHovered={hoverId === n.person.id}
                onHover={setHoverId} onSelect={onSelect} onAdd={onAddUnder}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgNode({ node, isHovered, onHover, onSelect, onAdd }: {
  node: TreeNode;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (p: Person) => void;
  onAdd: (managerId: string | null) => void;
}) {
  const p = node.person;
  const deptColor = DEPT_COLORS[p.department];
  const statusMeta = STATUS_META[p.status];
  const isOpen = p.status === "open";

  return (
    <div style={{
      position:"absolute", left:node.x, top:node.y, width:NODE_W, height:NODE_H,
      background: isHovered ? "var(--surface-2)" : "var(--surface-1)",
      border:`1px solid ${isHovered ? "var(--line-strong)" : "var(--line)"}`,
      borderLeft:`3px solid ${deptColor}`,
      borderRadius:8, padding:"10px 12px",
      cursor:"pointer", transition:"all 0.18s ease",
      boxShadow: isHovered ? "0 4px 20px rgba(0,0,0,0.4)" : "none",
      display:"flex", flexDirection:"column", gap:5,
    }}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(p)}
    >
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        {/* Avatar */}
        <div style={{ width:26, height:26, borderRadius:6, background: isOpen ? "var(--surface-3)" : `${deptColor}28`, color: isOpen ? "var(--text-4)" : deptColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0, border: isOpen ? "1.5px dashed var(--line-strong)" : "none" }}>
          {isOpen ? "?" : initials(p.name)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500, color: isOpen ? "var(--text-3)" : "var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {isOpen ? "Open Role" : p.name}
          </div>
        </div>
        {/* Status dot */}
        <span style={{ width:6, height:6, borderRadius:"50%", background:statusMeta.color, flexShrink:0, opacity: isOpen ? 0.5 : 1 }}/>
      </div>

      <div style={{ fontSize:11, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", paddingLeft:33 }}>
        {p.role}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, paddingLeft:33 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:deptColor, opacity:0.8, textTransform:"uppercase", letterSpacing:"0.08em" }}>{p.level}</span>
        <span style={{ color:"var(--line-strong)", fontSize:9 }}>·</span>
        <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{p.department.slice(0,4)}</span>
      </div>

      {/* Add direct report button */}
      {isHovered && (
        <button onClick={e => { e.stopPropagation(); onAdd(p.id); }} style={{
          position:"absolute", bottom:-12, left:"50%", transform:"translateX(-50%)",
          width:22, height:22, borderRadius:"50%", background:"var(--accent)", border:"2px solid var(--bg)",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:5,
          color:"#fff",
        }}>
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Directory View
// ═══════════════════════════════════════════════════════════════════════════
function DirectoryView({ people, search, setSearch, sortKey, setSortKey, sortAsc, setSortAsc, deptFilter, onSelect, onAdd }: {
  people: Person[]; search: string; setSearch: (s: string) => void;
  sortKey: SortKey; setSortKey: (k: SortKey) => void;
  sortAsc: boolean; setSortAsc: (a: boolean) => void;
  deptFilter: Department | "all"; onSelect: (p: Person) => void; onAdd: () => void;
}) {
  const filtered = people
    .filter(p => deptFilter === "all" || p.department === deptFilter)
    .filter(p => !search || [p.name,p.role,p.email,p.location].some(f => f.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      const av = a[sortKey as keyof Person] as string ?? "";
      const bv = b[sortKey as keyof Person] as string ?? "";
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(true); }
  }

  const colHdr = (k: SortKey, label: string, flex = 1) => (
    <div key={k} style={{ flex, display:"flex", alignItems:"center", gap:4, cursor:"pointer", userSelect:"none" as const, color: sortKey===k ? "var(--text)" : "var(--text-3)" }}
      onClick={() => toggleSort(k)}>
      <span style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em" }}>{label}</span>
      {sortKey===k && <span style={{ fontSize:9, opacity:0.7 }}>{sortAsc?"↑":"↓"}</span>}
    </div>
  );

  const manager = (p: Person) => people.find(q => q.id === p.managerId);

  return (
    <div style={{ padding:"24px 32px" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
        <div style={{ flex:1, position:"relative" as const }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", opacity:0.4 }} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M10.5 10.5l3 3" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, role, location…"
            style={{ width:"100%", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:6, padding:"8px 12px 8px 30px", color:"var(--text)", fontSize:13, fontFamily:"var(--sans)", outline:"none" }}/>
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)" }}>{filtered.length} records</div>
        <button onClick={onAdd} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>
          {Icon.plus} Add Person
        </button>
      </div>

      {/* Table */}
      <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", padding:"10px 18px", borderBottom:"1px solid var(--line)", gap:16 }}>
          {colHdr("name", "Name", 2)}
          {colHdr("role", "Role", 2)}
          {colHdr("department", "Dept", 1.2)}
          {colHdr("level", "Level", 0.7)}
          {colHdr("status", "Status", 1)}
          <div style={{ flex:1.5, fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-3)" }}>Manager</div>
          <div style={{ flex:1.2, fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-3)" }}>Location</div>
          {colHdr("startDate", "Started", 0.8)}
        </div>

        {/* Rows */}
        {filtered.map((p, i) => {
          const dc = DEPT_COLORS[p.department];
          const sm = STATUS_META[p.status];
          const mgr = manager(p);
          const isOpen = p.status === "open";
          return (
            <div key={p.id} style={{ display:"flex", padding:"11px 18px", gap:16, borderBottom: i < filtered.length-1 ? "1px solid var(--line)" : "none", cursor:"pointer", background:"transparent", transition:"background 0.12s", alignItems:"center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => onSelect(p)}>
              {/* Name + avatar */}
              <div style={{ flex:2, display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                <div style={{ width:28, height:28, borderRadius:7, background: isOpen ? "var(--surface-3)" : `${dc}25`, color: isOpen ? "var(--text-4)" : dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0, border: isOpen ? "1.5px dashed var(--line-strong)" : "none" }}>
                  {isOpen ? "?" : initials(p.name)}
                </div>
                <span style={{ fontSize:13, fontWeight: isOpen ? 400 : 500, color: isOpen ? "var(--text-3)" : "var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {isOpen ? <em style={{ fontStyle:"italic" }}>Open Role</em> : p.name}
                </span>
              </div>
              {/* Role */}
              <div style={{ flex:2, fontSize:12.5, color:"var(--text-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.role}</div>
              {/* Dept */}
              <div style={{ flex:1.2 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:4, background:`${dc}18`, border:`1px solid ${dc}35`, fontFamily:"var(--mono)", fontSize:9.5, color:dc, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:dc, flexShrink:0 }}/>{p.department.slice(0,4)}
                </span>
              </div>
              {/* Level */}
              <div style={{ flex:0.7, fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{p.level}</div>
              {/* Status */}
              <div style={{ flex:1 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:99, background:sm.bg, fontFamily:"var(--mono)", fontSize:9.5, color:sm.color, letterSpacing:"0.06em" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:sm.color, flexShrink:0 }}/>{sm.label}
                </span>
              </div>
              {/* Manager */}
              <div style={{ flex:1.5, fontSize:12, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{mgr?.name ?? "—"}</div>
              {/* Location */}
              <div style={{ flex:1.2, fontSize:11.5, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.location || "—"}</div>
              {/* Start date */}
              <div style={{ flex:0.8, fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>{p.startDate || "—"}</div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding:"48px 32px", textAlign:"center", color:"var(--text-4)", fontFamily:"var(--mono)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.14em" }}>No results</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Roles View
// ═══════════════════════════════════════════════════════════════════════════
function RolesView({ people, deptFilter, onSelect, onAdd }: {
  people: Person[]; deptFilter: Department | "all"; onSelect: (p: Person) => void; onAdd: () => void;
}) {
  const depts = deptFilter === "all" ? DEPARTMENTS : [deptFilter];

  return (
    <div style={{ padding:"24px 32px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)" }}>
          Role Registry · {people.length} positions · {people.filter(p => p.status === "open").length} open
        </div>
        <button onClick={onAdd} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>
          {Icon.plus} Add Role
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {depts.map(dept => {
          const deptPeople = people.filter(p => p.department === dept);
          if (!deptPeople.length) return null;
          const dc = DEPT_COLORS[dept];
          const filled = deptPeople.filter(p => p.status !== "open").length;
          const total  = deptPeople.length;

          return (
            <div key={dept} style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
              {/* Dept header */}
              <div style={{ padding:"14px 20px 12px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:dc }}/>
                <div style={{ fontFamily:"var(--mono)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.14em", color:dc, flex:1 }}>{dept}</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{filled}/{total} filled</div>
                {/* Headcount bar */}
                <div style={{ width:80, height:4, borderRadius:2, background:"var(--surface-3)" }}>
                  <div style={{ width:`${(filled/total)*100}%`, height:"100%", background:dc, borderRadius:2, transition:"width 0.3s" }}/>
                </div>
              </div>

              {/* Role rows */}
              {deptPeople.map((p, i) => {
                const sm = STATUS_META[p.status];
                const isOpen = p.status === "open";
                return (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 20px", borderBottom: i < deptPeople.length-1 ? "1px solid var(--line)" : "none", cursor:"pointer", transition:"background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => onSelect(p)}>
                    <div style={{ flex:2.5 }}>
                      <div style={{ fontSize:13, fontWeight: isOpen ? 400 : 500, color: isOpen ? "var(--text-3)" : "var(--text)" }}>
                        {isOpen ? <em style={{ fontStyle:"italic" }}>Open Role</em> : p.name}
                      </div>
                      <div style={{ fontSize:12, color:"var(--text-3)", marginTop:2 }}>{p.role}</div>
                    </div>
                    <div style={{ flex:0.8, fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)" }}>
                      {p.level} · {LEVEL_BAND[p.level]}
                    </div>
                    <div style={{ flex:1 }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:99, background:sm.bg, fontFamily:"var(--mono)", fontSize:9.5, color:sm.color }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:sm.color }}/>{sm.label}
                      </span>
                    </div>
                    <div style={{ flex:1, fontSize:11.5, color:"var(--text-4)" }}>{p.location || "—"}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{p.startDate || (isOpen ? "Hiring" : "—")}</div>
                    <span style={{ color:"var(--text-4)", opacity:0.5 }}>{Icon.arrow}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Analytics View
// ═══════════════════════════════════════════════════════════════════════════
function AnalyticsView({ people }: { people: Person[] }) {
  const active = people.filter(p => p.status !== "open");
  const open   = people.filter(p => p.status === "open");

  // Dept breakdown
  const deptData = DEPARTMENTS.map(d => ({
    dept: d, color: DEPT_COLORS[d],
    filled: people.filter(p => p.department === d && p.status !== "open").length,
    open:   people.filter(p => p.department === d && p.status === "open").length,
  })).filter(d => d.filled + d.open > 0).sort((a,b) => (b.filled+b.open)-(a.filled+a.open));

  const maxDept = Math.max(...deptData.map(d => d.filled + d.open));

  // Level distribution
  const levelData = LEVELS.map(l => ({
    level: l, count: active.filter(p => p.level === l).length, band: LEVEL_BAND[l],
  })).filter(d => d.count > 0);

  // Location breakdown
  const locs: Record<string, number> = {};
  active.forEach(p => { const l = p.location || "Unknown"; locs[l] = (locs[l]||0) + 1; });
  const locData = Object.entries(locs).sort((a,b) => b[1]-a[1]).slice(0,8);

  // Status breakdown
  const statusData = [
    { label:"Active",     count: people.filter(p => p.status==="active").length,     color:"#3DCC91" },
    { label:"Contractor", count: people.filter(p => p.status==="contractor").length,  color:"#A78BFA" },
    { label:"On Leave",   count: people.filter(p => p.status==="onleave").length,     color:"#FFC940" },
    { label:"Open Role",  count: open.length,                                          color:"rgba(246,247,248,0.3)" },
  ].filter(s => s.count > 0);

  const total = people.length;
  const sCard = { background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, padding:"22px 24px" } as const;

  return (
    <div style={{ padding:"24px 32px" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:20 }}>
        People Analytics · {active.length} active · {open.length} open positions
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Headcount", value:active.length, sub:"FTE + contractors", color:"var(--text)" },
          { label:"Open Roles",      value:open.length, sub:`${Math.round((open.length/total)*100)}% of positions`, color:"#FFC940" },
          { label:"Departments",     value:deptData.length, sub:"functional units", color:"var(--accent)" },
          { label:"Locations",       value:Object.keys(locs).length, sub:"cities / remote", color:"#3DCC91" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={sCard}>
            <div style={{ fontFamily:"var(--mono)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:8 }}>{label}</div>
            <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:48, lineHeight:1, color, fontVariantNumeric:"tabular-nums", marginBottom:6 }}>{value}</div>
            <div style={{ fontSize:11.5, color:"var(--text-3)" }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* Dept headcount */}
        <div style={sCard}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:18 }}>Headcount by Department</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {deptData.map(({ dept, color, filled, open: o }) => (
              <div key={dept}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ width:6, height:6, borderRadius:2, background:color, flexShrink:0 }}/>
                    <span style={{ fontSize:12.5, color:"var(--text-2)" }}>{dept}</span>
                  </div>
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>
                    {filled}{o>0 && <span style={{ color:"#FFC940" }}> +{o} open</span>}
                  </span>
                </div>
                <div style={{ height:5, borderRadius:3, background:"var(--surface-3)", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${((filled+o)/maxDept)*100}%`, background:`${color}55`, borderRadius:3, position:"relative" as const }}>
                    <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${filled/(filled+o)*100}%`, background:color, borderRadius:3 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level distribution */}
        <div style={sCard}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:18 }}>Level Distribution</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:140, marginBottom:16 }}>
            {LEVELS.map(l => {
              const count = active.filter(p => p.level === l).length;
              const pct = count / (active.length || 1);
              return (
                <div key={l} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5, height:"100%" }}>
                  <div style={{ fontSize:10, fontFamily:"var(--mono)", color:"var(--text-4)", marginTop:"auto" }}>{count > 0 ? count : ""}</div>
                  <div style={{ width:"100%", background:"var(--accent)", borderRadius:"3px 3px 0 0", height:`${pct*130+2}px`, minHeight: count > 0 ? 6 : 0, opacity: count > 0 ? 1 : 0.15 }}/>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{l}</div>
                </div>
              );
            })}
          </div>
          <div style={{ paddingTop:12, borderTop:"1px solid var(--line)" }}>
            {LEVELS.slice().reverse().filter(l => active.filter(p => p.level===l).length>0).slice(0,4).map(l => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11.5, color:"var(--text-3)" }}>{LEVEL_BAND[l]}</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-4)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Status breakdown */}
        <div style={sCard}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:18 }}>Workforce Status</div>
          {statusData.map(({ label, count, color }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
              <span style={{ fontSize:12.5, color:"var(--text-2)", flex:1 }}>{label}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)", minWidth:24, textAlign:"right" }}>{count}</span>
              <div style={{ width:80, height:4, borderRadius:2, background:"var(--surface-3)" }}>
                <div style={{ width:`${(count/total)*100}%`, height:"100%", background:color, borderRadius:2 }}/>
              </div>
              <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", minWidth:32, textAlign:"right" }}>{Math.round((count/total)*100)}%</span>
            </div>
          ))}
        </div>

        {/* Locations */}
        <div style={sCard}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:18 }}>Top Locations</div>
          {locData.map(([loc, count]) => (
            <div key={loc} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ opacity:0.5 }}>{Icon.globe}</span>
              <span style={{ fontSize:12, color:"var(--text-2)", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{loc}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{count}</span>
              <div style={{ width:60, height:3, borderRadius:2, background:"var(--surface-3)" }}>
                <div style={{ width:`${(count/locData[0][1])*100}%`, height:"100%", background:"var(--accent)", borderRadius:2 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Person Drawer
// ═══════════════════════════════════════════════════════════════════════════
function PersonDrawer({ person, isEditing, confirmDelete, people, onClose, onEdit, onChange, onSave, onCancel, onDelete, onConfirmDelete, onCancelDelete, onAddDirectReport }: {
  person: Person; isEditing: boolean; confirmDelete: boolean; people: Person[];
  onClose: () => void; onEdit: () => void; onChange: (p: Person) => void;
  onSave: () => void; onCancel: () => void; onDelete: () => void;
  onConfirmDelete: () => void; onCancelDelete: () => void;
  onAddDirectReport: () => void;
}) {
  const dc = DEPT_COLORS[person.department];
  const sm = STATUS_META[person.status];
  const isOpen = person.status === "open";
  const manager = people.find(p => p.id === person.managerId);
  const reports = people.filter(p => p.managerId === person.id);

  return (
    <>
      {/* Backdrop */}
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:40 }} onClick={onClose}/>
      {/* Drawer */}
      <div style={{ position:"fixed", right:0, top:0, bottom:0, width:380, background:"var(--surface-1)", borderLeft:"1px solid var(--line)", zIndex:50, display:"flex", flexDirection:"column", overflowY:"auto" }}>
        {/* Top bar */}
        <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background: isOpen ? "var(--surface-3)" : `${dc}28`, color: isOpen ? "var(--text-4)" : dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, fontFamily:"var(--mono)", border: isOpen ? "1.5px dashed var(--line-strong)" : "none" }}>
              {isOpen ? "?" : initials(person.name)}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>{isOpen ? "Open Role" : person.name}</div>
              <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:1 }}>{person.id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:0, color:"var(--text-3)", cursor:"pointer", padding:4 }}>{Icon.close}</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, padding:"20px", display:"flex", flexDirection:"column", gap:20 }}>
          {isEditing ? (
            <EditForm person={person} people={people} onChange={onChange}/>
          ) : (
            <>
              {/* Status + dept */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:99, background:sm.bg, fontFamily:"var(--mono)", fontSize:10, color:sm.color, letterSpacing:"0.06em" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:sm.color }}/>{sm.label}
                </span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:4, background:`${dc}18`, border:`1px solid ${dc}35`, fontFamily:"var(--mono)", fontSize:10, color:dc, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:dc }}/>{person.department}
                </span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:4, background:"var(--surface-2)", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)" }}>
                  {person.level} · {LEVEL_BAND[person.level]}
                </span>
              </div>

              {/* Role */}
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:4 }}>Role</div>
                <div style={{ fontSize:16, fontWeight:500, lineHeight:1.3 }}>{person.role}</div>
              </div>

              {/* Details grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { label:"Email",    value:person.email || "—"     },
                  { label:"Location", value:person.location || "—"  },
                  { label:"Started",  value:person.startDate || "—" },
                  { label:"Manager",  value:manager?.name || "No manager" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:12.5, color:"var(--text-2)" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Direct reports */}
              {reports.length > 0 && (
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:10 }}>
                    Direct Reports ({reports.length})
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {reports.map(r => (
                      <div key={r.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"var(--surface-2)", borderRadius:6, border:"1px solid var(--line)" }}>
                        <div style={{ width:22, height:22, borderRadius:5, background:`${DEPT_COLORS[r.department]}25`, color:DEPT_COLORS[r.department], display:"flex", alignItems:"center", justifyContent:"center", fontSize:8.5, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0 }}>
                          {r.status==="open" ? "?" : initials(r.name)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:500, color: r.status==="open"?"var(--text-3)":"var(--text)" }}>{r.status==="open" ? "Open Role" : r.name}</div>
                          <div style={{ fontSize:11, color:"var(--text-4)" }}>{r.role}</div>
                        </div>
                        <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{r.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add direct report */}
              <button onClick={onAddDirectReport} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", background:"transparent", border:"1px dashed var(--line-strong)", borderRadius:6, color:"var(--text-3)", fontSize:12.5, cursor:"pointer", fontFamily:"var(--sans)", transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.color = "var(--text-3)"; }}>
                {Icon.plus} Add Direct Report
              </button>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding:"16px 20px", borderTop:"1px solid var(--line)", display:"flex", gap:8 }}>
          {confirmDelete ? (
            <>
              <div style={{ flex:1, fontSize:12, color:"#FF6B6B", display:"flex", alignItems:"center" }}>Delete {isOpen ? "this role" : person.name}?</div>
              <button onClick={onCancelDelete} style={{ padding:"7px 14px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:5, color:"var(--text-2)", fontSize:12, cursor:"pointer", fontFamily:"var(--sans)" }}>Cancel</button>
              <button onClick={onConfirmDelete} style={{ padding:"7px 14px", background:"rgba(255,107,107,0.15)", border:"1px solid rgba(255,107,107,0.35)", borderRadius:5, color:"#FF6B6B", fontSize:12, cursor:"pointer", fontFamily:"var(--sans)" }}>Confirm Delete</button>
            </>
          ) : isEditing ? (
            <>
              <button onClick={onCancel} style={{ padding:"7px 14px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:5, color:"var(--text-2)", fontSize:12, cursor:"pointer", fontFamily:"var(--sans)" }}>Cancel</button>
              <button onClick={onSave} style={{ flex:1, padding:"7px 14px", background:"var(--accent)", border:0, borderRadius:5, color:"#fff", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>Save Changes</button>
            </>
          ) : (
            <>
              <button onClick={onDelete} style={{ padding:"7px 10px", background:"transparent", border:"1px solid var(--line)", borderRadius:5, color:"var(--text-4)", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"var(--sans)" }}>
                {Icon.trash}
              </button>
              <button onClick={onEdit} style={{ flex:1, padding:"7px 14px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:5, color:"var(--text-2)", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontFamily:"var(--sans)" }}>
                {Icon.edit} Edit
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Edit Form (inside drawer)
// ═══════════════════════════════════════════════════════════════════════════
function EditForm({ person, people, onChange }: {
  person: Person; people: Person[]; onChange: (p: Person) => void;
}) {
  const field = (label: string, key: keyof Person, type = "text") => (
    <div key={key}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
      <input type={type} value={String(person[key] ?? "")} onChange={e => onChange({ ...person, [key]: e.target.value })}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
    </div>
  );

  const select = (label: string, key: keyof Person, options: string[]) => (
    <div key={key}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
      <select value={String(person[key] ?? "")} onChange={e => {
        const val = e.target.value;
        const update: Partial<Person> = { [key]: val };
        if (key === "department") update.color = DEPT_COLORS[val as Department];
        onChange({ ...person, ...update });
      }} style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const managers = people.filter(p => p.id !== person.id && p.status !== "open");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {field("Full Name", "name")}
      {field("Job Title / Role", "role")}
      {select("Department", "department", DEPARTMENTS)}
      {select("Level", "level", LEVELS)}
      {select("Employment Status", "status", ["active","contractor","onleave","open"] as Status[])}
      <div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>Manager</div>
        <select value={person.managerId ?? ""} onChange={e => onChange({ ...person, managerId: e.target.value || null })}
          style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}>
          <option value="">No manager (top level)</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
        </select>
      </div>
      {field("Email", "email", "email")}
      {field("Location", "location")}
      {field("Start Date", "startDate")}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Add Modal
// ═══════════════════════════════════════════════════════════════════════════
function AddModal({ person, onChange, onSave, onClose, people, managerId }: {
  person: Person; onChange: (p: Person) => void; onSave: () => void;
  onClose: () => void; people: Person[]; managerId: string | null;
}) {
  const managerName = managerId ? people.find(p => p.id === managerId)?.name : null;
  const isValid = person.role.trim().length > 0;

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:60 }} onClick={onClose}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:460, background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:14, zIndex:70, display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:3 }}>New Position</div>
            <div style={{ fontSize:16, fontWeight:500 }}>
              {managerName ? `Add Report to ${managerName}` : "Add to Organization"}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:0, color:"var(--text-3)", cursor:"pointer", padding:4 }}>{Icon.close}</button>
        </div>

        {/* Form */}
        <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:14, maxHeight:"65vh", overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="Full Name" value={person.name} onChange={v => onChange({ ...person, name:v })} placeholder="Jane Smith" />
            <FormField label="Email" value={person.email} onChange={v => onChange({ ...person, email:v })} placeholder="jsmith@ambient.ai" type="email" />
          </div>
          <FormField label="Job Title / Role" value={person.role} onChange={v => onChange({ ...person, role:v })} placeholder="Software Engineer" required />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormSelect label="Department" value={person.department} onChange={v => onChange({ ...person, department:v as Department, color:DEPT_COLORS[v as Department] })} options={DEPARTMENTS} />
            <FormSelect label="Level" value={person.level} onChange={v => onChange({ ...person, level:v as Level })} options={LEVELS} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormSelect label="Status" value={person.status} onChange={v => onChange({ ...person, status:v as Status })} options={["active","contractor","onleave","open"]} />
            <FormField label="Start Date" value={person.startDate} onChange={v => onChange({ ...person, startDate:v })} placeholder="Jan 2024" />
          </div>
          <FormField label="Location" value={person.location} onChange={v => onChange({ ...person, location:v })} placeholder="San Francisco, CA" />
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>Reports To</div>
            <select value={person.managerId ?? ""} onChange={e => onChange({ ...person, managerId:e.target.value || null })}
              style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none" }}>
              <option value="">No manager (top level)</option>
              {people.filter(p => p.status !== "open").map(m => (
                <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ padding:"9px 18px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, color:"var(--text-2)", fontSize:13, cursor:"pointer", fontFamily:"var(--sans)" }}>Cancel</button>
          <button onClick={onSave} disabled={!isValid} style={{ flex:1, padding:"9px 18px", background: isValid ? "var(--accent)" : "var(--surface-3)", border:0, borderRadius:6, color: isValid ? "#fff" : "var(--text-4)", fontSize:13, fontWeight:500, cursor: isValid ? "pointer" : "not-allowed", fontFamily:"var(--sans)", transition:"all 0.15s" }}>
            Add to Org
          </button>
        </div>
      </div>
    </>
  );
}

// ── Mini form helpers ──────────────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder, type="text", required=false }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; required?:boolean;
}) {
  return (
    <div>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>
        {label}{required && <span style={{ color:"#FF6B6B", marginLeft:3 }}>*</span>}
      </div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: {
  label:string; value:string; onChange:(v:string)=>void; options:string[];
}) {
  return (
    <div>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
