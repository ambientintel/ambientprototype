"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────
type Status = "active" | "onleave" | "contractor" | "open";
type Department = "Executive" | "Engineering" | "Clinical" | "Operations" | "Design" | "Finance" | "Regulatory";
type Level = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
type SortKey = "name" | "role" | "department" | "level" | "status" | "startDate" | "tenure";

interface Person {
  id: string; name: string; role: string; department: Department;
  level: Level; managerId: string | null; email: string;
  status: Status; startDate: string; color: string; location: string;
}

// ── Constants ─────────────────────────────────────────────────────────────
const DEPARTMENTS: Department[] = ["Executive","Engineering","Clinical","Operations","Design","Finance","Regulatory"];
const LEVELS: Level[] = ["L1","L2","L3","L4","L5","L6","L7"];

const DEPT_COLORS: Record<Department, string> = {
  Executive:"#2D72D2", Engineering:"#00B4D8", Clinical:"#3DCC91",
  Operations:"#FB923C", Design:"#A78BFA", Finance:"#FFC940", Regulatory:"#F59E0B",
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
  { id:"P016", name:"",               role:"ML Engineer",                      department:"Engineering", level:"L4", managerId:"P002",  email:"",                      status:"open",       startDate:"",         color:"#2D72D2", location:""                  },
  { id:"P020", name:"Dr. Amy Lin",      role:"Clinical Lead",                   department:"Clinical",    level:"L5", managerId:"P003",  email:"alin@ambient.ai",       status:"active",     startDate:"Jun 2022", color:"#3DCC91", location:"Chicago, IL"       },
  { id:"P021", name:"James Okonkwo",    role:"Clinical Informatics Specialist", department:"Clinical",    level:"L3", managerId:"P020",  email:"jokonkwo@ambient.ai",   status:"active",     startDate:"Feb 2023", color:"#3DCC91", location:"Atlanta, GA"       },
  { id:"P022", name:"Maria Rossi",      role:"Nurse Informatics Consultant",    department:"Clinical",    level:"L3", managerId:"P020",  email:"mrossi@ambient.ai",     status:"contractor", startDate:"Mar 2023", color:"#3DCC91", location:"Boston, MA"        },
  { id:"P023", name:"",               role:"Clinical Data Analyst",            department:"Clinical",    level:"L3", managerId:"P003",  email:"",                      status:"open",       startDate:"",         color:"#3DCC91", location:""                  },
  { id:"P030", name:"Sam Park",         role:"UX Designer",                     department:"Design",      level:"L3", managerId:"P006",  email:"spark@ambient.ai",      status:"active",     startDate:"Jan 2023", color:"#A78BFA", location:"Seoul, KR"         },
  { id:"P031", name:"",               role:"Product Designer",                  department:"Design",      level:"L4", managerId:"P006",  email:"",                      status:"open",       startDate:"",         color:"#A78BFA", location:""                  },
  { id:"P040", name:"Thomas Berg",      role:"Regulatory Affairs Specialist",   department:"Regulatory",  level:"L3", managerId:"P007",  email:"tberg@ambient.ai",      status:"active",     startDate:"Aug 2022", color:"#F59E0B", location:"Munich, DE"        },
  { id:"P041", name:"",               role:"Quality Systems Manager",           department:"Regulatory",  level:"L4", managerId:"P007",  email:"",                      status:"open",       startDate:"",         color:"#F59E0B", location:""                  },
  { id:"P050", name:"Priya Sharma",     role:"Senior Financial Analyst",        department:"Finance",     level:"L4", managerId:"P004",  email:"psharma@ambient.ai",    status:"active",     startDate:"Feb 2023", color:"#FFC940", location:"New York, NY"      },
  { id:"P060", name:"Leo Marchetti",    role:"Operations Manager",              department:"Operations",  level:"L4", managerId:"P005",  email:"lmarchetti@ambient.ai", status:"active",     startDate:"Mar 2023", color:"#FB923C", location:"Denver, CO"        },
  { id:"P061", name:"Yuki Sato",        role:"Customer Success Manager",        department:"Operations",  level:"L3", managerId:"P005",  email:"ysato@ambient.ai",      status:"onleave",    startDate:"Apr 2023", color:"#FB923C", location:"Remote"            },
];

// ── Utilities ─────────────────────────────────────────────────────────────
function initials(name: string): string {
  if (!name) return "?";
  const p = name.split(" ").filter(Boolean);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
}
let _idc = 200;
function newId(): string { return `P${Date.now()}${_idc++}`; }
const LS_KEY = "hcm_people_v2";
function lsLoad(): Person[] | null { try { const d = localStorage.getItem(LS_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }
function lsSave(p: Person[]): void { try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {} }
function blank(o?: Partial<Person>): Person {
  return { id:newId(), name:"", role:"", department:"Engineering", level:"L3", managerId:null, email:"", status:"active", startDate:"", color:"#2D72D2", location:"", ...o };
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseTenureMonths(startDate: string): number | null {
  if (!startDate) return null;
  const [mon, yr] = startDate.split(" ");
  const mIdx = MONTH_NAMES.indexOf(mon);
  const y = parseInt(yr);
  if (mIdx < 0 || isNaN(y)) return null;
  const start = new Date(y, mIdx);
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

function formatTenure(months: number | null): string {
  if (months === null) return "—";
  if (months < 1) return "<1m";
  const y = Math.floor(months / 12), m = months % 12;
  if (y === 0) return `${m}m`;
  if (m === 0) return `${y}y`;
  return `${y}y ${m}m`;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  list:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="2.5" width="13" height="2" rx=".5"/><rect x="1.5" y="7" width="13" height="2" rx=".5"/><rect x="1.5" y="11.5" width="13" height="2" rx=".5"/></svg>,
  org:      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".75"/><rect x="1" y="11" width="4" height="3" rx=".75"/><rect x="6" y="11" width="4" height="3" rx=".75"/><rect x="11" y="11" width="4" height="3" rx=".75"/><path d="M8 4.5v3M3 11V9h10V8" strokeLinecap="round"/></svg>,
  plus:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>,
  close:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11 2l3 3-9 9H2v-3L11 2z" strokeLinejoin="round"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5M3 4l1 10h8l1-10" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M10.5 10.5l3 3" strokeLinecap="round"/></svg>,
  download: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" strokeLinecap="round"/></svg>,
  chevron:  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 6l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function OrgChartPage() {
  const [people, setPeople] = useState<Person[]>(() => lsLoad() ?? SEED);
  const [selected, setSelected] = useState<Person | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addManagerId, setAddManagerId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Person | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deptFilter, setDeptFilter] = useState<Department | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPerson, setNewPerson] = useState<Person>(blank());
  const [clock, setClock] = useState("");

  useEffect(() => { lsSave(people); }, [people]);
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const headcount = people.filter(p => p.status !== "open").length;
  const openRoles = people.filter(p => p.status === "open").length;

  function addPerson() {
    const p = { ...newPerson, id:newId(), managerId:addManagerId, color:DEPT_COLORS[newPerson.department] };
    setPeople(prev => [...prev, p]); setShowAdd(false); setNewPerson(blank()); setAddManagerId(null);
  }
  function updatePerson(p: Person) {
    setPeople(prev => prev.map(x => x.id === p.id ? p : x)); setSelected(p); setEditDraft(null); setIsEditing(false);
  }
  function deletePerson(id: string) {
    setPeople(prev => {
      const target = prev.find(p => p.id === id);
      return prev.filter(p => p.id !== id).map(p => p.managerId === id ? { ...p, managerId:target?.managerId ?? null } : p);
    });
    setSelected(null); setConfirmDelete(false);
  }
  function openAdd(managerId: string | null) {
    setAddManagerId(managerId); setNewPerson(blank({ managerId })); setShowAdd(true);
  }

  const navLabel: React.CSSProperties = { fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", padding:"0 8px", marginBottom:8 };
  const navItem:  React.CSSProperties = { display:"flex", alignItems:"center", gap:10, padding:"7px 8px 7px 10px", fontSize:13, color:"var(--text-2)", borderRadius:4, cursor:"pointer", transition:"all 0.15s" };
  const navActive: React.CSSProperties = { ...navItem, background:"var(--surface-2)", color:"var(--text)", fontWeight:500 };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--sans)" }}>
      {/* Sidebar */}
      <aside style={{ width:220, flexShrink:0, borderRight:"1px solid var(--line)", padding:"28px 20px 32px", display:"flex", flexDirection:"column", gap:32, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <Link href="/" style={{ textDecoration:"none", color:"inherit" }}>
          <div style={{ fontFamily:"var(--serif)", fontWeight:400, fontSize:18, letterSpacing:"-0.01em", padding:"0 6px" }}>
            Ambient <em style={{ fontStyle:"italic", color:"var(--text-2)", fontWeight:300 }}>Intelligence</em>
          </div>
        </Link>

        <div>
          <div style={navLabel}>Human Capital</div>
          <Link href="/humancapitalmgmt" style={{ textDecoration:"none" }}>
            <div style={navItem}><span style={{ opacity:0.65 }}>{Icon.list}</span>Dashboard</div>
          </Link>
          <div style={navActive}><span>{Icon.org}</span>Org Chart</div>
        </div>

        <div>
          <div style={navLabel}>Department</div>
          {(["all",...DEPARTMENTS] as (Department|"all")[]).map(d => {
            const count = d === "all" ? people.filter(p=>p.status!=="open").length : people.filter(p=>p.department===d&&p.status!=="open").length;
            return (
              <div key={d} style={{ ...navItem, color:deptFilter===d?"var(--text)":"var(--text-2)", background:deptFilter===d?"var(--surface-2)":"transparent" }}
                onClick={() => setDeptFilter(d as Department|"all")}>
                {d !== "all" && <span style={{ width:6, height:6, borderRadius:2, background:DEPT_COLORS[d as Department], flexShrink:0 }}/>}
                <span style={{ flex:1, fontSize:12.5 }}>{d==="all"?"All Departments":d}</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{count}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:"auto" }}>
          <button onClick={() => openAdd(null)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"9px 12px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>
            {Icon.plus} Add Person
          </button>
          <div style={{ marginTop:20, fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
            <div>Org Chart · {headcount} people</div>
            <div style={{ marginTop:4, fontVariantNumeric:"tabular-nums" }}>{clock}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, overflowY:"auto" }}>
        {/* Sticky Header */}
        <div style={{ borderBottom:"1px solid var(--line)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg)", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:4 }}>People Operations</div>
            <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
              Org <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>Chart</em>
            </h1>
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            {[
              { label:"Headcount", value:headcount, color:"var(--text)" },
              { label:"Open Roles", value:openRoles, color:"#FFC940" },
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

        {/* Org Hierarchy */}
        <div style={{ padding:"24px 32px", borderBottom:"2px solid var(--line)" }}>
          <OrgHierarchy people={people} deptFilter={deptFilter} onSelect={setSelected} onAdd={openAdd}/>
        </div>

        {/* Directory Table */}
        <div style={{ padding:"24px 32px 48px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:16 }}>Directory</div>
          <DirectoryTable
            people={people}
            search={search} setSearch={setSearch}
            sortKey={sortKey} setSortKey={setSortKey}
            sortAsc={sortAsc} setSortAsc={setSortAsc}
            deptFilter={deptFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            onSelect={setSelected}
            onAdd={() => openAdd(null)}
          />
        </div>
      </main>

      {/* Person Drawer */}
      {selected && (
        <PersonDrawer
          person={editDraft ?? selected} isEditing={isEditing} confirmDelete={confirmDelete} people={people}
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

      {showAdd && (
        <AddModal person={newPerson} onChange={setNewPerson} onSave={addPerson}
          onClose={() => { setShowAdd(false); setNewPerson(blank()); setAddManagerId(null); }}
          people={people} managerId={addManagerId}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Org Hierarchy — collapsible tree rows, fully readable at any size
// ═══════════════════════════════════════════════════════════════════════════
function OrgHierarchy({ people, deptFilter, onSelect, onAdd }: {
  people: Person[]; deptFilter: Department | "all";
  onSelect: (p: Person) => void; onAdd: (managerId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    people.filter(p => !p.managerId).forEach(r => s.add(r.id));
    return s;
  });

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function expandAll() { setExpanded(new Set(people.map(p => p.id))); }
  function collapseToRoot() {
    const s = new Set<string>();
    people.filter(p => !p.managerId).forEach(r => s.add(r.id));
    setExpanded(s);
  }

  function renderBranch(parentId: string | null, depth: number): React.ReactNode {
    const children = people
      .filter(p => p.managerId === parentId)
      .filter(p => {
        if (deptFilter === "all") return true;
        if (p.department === deptFilter) return true;
        return people.some(q => q.managerId === p.id && q.department === deptFilter);
      })
      .sort((a, b) => {
        const levelOrder = { L7:0, L6:1, L5:2, L4:3, L3:4, L2:5, L1:6 };
        return (levelOrder[a.level]??7) - (levelOrder[b.level]??7);
      });
    if (!children.length) return null;

    return (
      <div style={{ marginLeft: depth === 0 ? 0 : 28, borderLeft: depth > 0 ? "1px solid var(--line)" : "none" }}>
        {children.map(person => {
          const hasChildren = people.some(p => p.managerId === person.id);
          const isExp = expanded.has(person.id);
          const dc = DEPT_COLORS[person.department];
          const sm = STATUS_META[person.status];
          const isOpen = person.status === "open";
          const tenure = formatTenure(parseTenureMonths(person.startDate));
          const reports = people.filter(p => p.managerId === person.id).length;

          return (
            <div key={person.id}>
              <HierarchyRow
                person={person} depth={depth} dc={dc} sm={sm} isOpen={isOpen}
                hasChildren={hasChildren} isExpanded={isExp} reports={reports} tenure={tenure}
                onToggle={() => toggle(person.id)}
                onSelect={() => onSelect(person)}
                onAdd={() => onAdd(person.id)}
              />
              {isExp && renderBranch(person.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  }

  const totalShown = people.filter(p => deptFilter === "all" || p.department === deptFilter).length;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)" }}>
          {totalShown} people · {people.filter(p=>p.status==="open"&&(deptFilter==="all"||p.department===deptFilter)).length} open roles
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          {Object.entries(STATUS_META).map(([s, m]) => (
            <span key={s} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"var(--mono)", fontSize:9, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:m.color }}/>{m.label}
            </span>
          ))}
          <div style={{ width:1, height:14, background:"var(--line)", margin:"0 4px" }}/>
          <button onClick={expandAll} style={{ padding:"4px 10px", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:4, color:"var(--text-3)", fontSize:10.5, fontFamily:"var(--mono)", cursor:"pointer" }}>Expand all</button>
          <button onClick={collapseToRoot} style={{ padding:"4px 10px", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:4, color:"var(--text-3)", fontSize:10.5, fontFamily:"var(--mono)", cursor:"pointer" }}>Collapse</button>
          <button onClick={() => onAdd(null)} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"var(--accent)", border:0, borderRadius:4, color:"#fff", fontSize:10.5, fontFamily:"var(--mono)", cursor:"pointer" }}>
            {Icon.plus} Add
          </button>
        </div>
      </div>

      {/* Tree */}
      <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
        {renderBranch(null, 0)}
        {totalShown === 0 && (
          <div style={{ padding:"40px", textAlign:"center", fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.14em" }}>No people</div>
        )}
      </div>
    </div>
  );
}

function HierarchyRow({ person: p, depth, dc, sm, isOpen, hasChildren, isExpanded, reports, tenure, onToggle, onSelect, onAdd }: {
  person: Person; depth: number; dc: string; sm: { color: string; label: string; bg: string };
  isOpen: boolean; hasChildren: boolean; isExpanded: boolean; reports: number; tenure: string;
  onToggle: () => void; onSelect: () => void; onAdd: () => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:"flex", alignItems:"center", gap:0, borderBottom:"1px solid var(--line)", background:hov?"var(--surface-2)":"transparent", transition:"background 0.12s", position:"relative" }}>
      {/* Indent spacer */}
      {depth > 0 && <div style={{ width: depth * 28, flexShrink:0 }}/>}

      {/* Expand toggle */}
      <div style={{ width:40, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", alignSelf:"stretch", borderRight:"1px solid var(--line)" }}>
        {hasChildren ? (
          <button onClick={e => { e.stopPropagation(); onToggle(); }} style={{ width:20, height:20, borderRadius:4, background:isExpanded?"var(--surface-3)":"var(--surface-2)", border:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text-3)", transform:isExpanded?"rotate(0deg)":"rotate(-90deg)", transition:"transform 0.18s" }}>
            {Icon.chevron}
          </button>
        ) : (
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--line-strong)", opacity:0.5 }}/>
        )}
      </div>

      {/* Dept stripe */}
      <div style={{ width:3, alignSelf:"stretch", background:dc, flexShrink:0, opacity:0.7 }}/>

      {/* Main content — clickable */}
      <div onClick={onSelect} style={{ flex:1, display:"flex", alignItems:"center", gap:14, padding:"12px 16px", cursor:"pointer", minWidth:0 }}>
        {/* Avatar */}
        <div style={{ width:34, height:34, borderRadius:8, background:isOpen?"var(--surface-3)":`${dc}22`, color:isOpen?"var(--text-4)":dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0, border:isOpen?`1.5px dashed var(--line-strong)`:"none" }}>
          {isOpen?"?":initials(p.name)}
        </div>

        {/* Name + Role */}
        <div style={{ flex:"0 0 220px", minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:isOpen?400:500, color:isOpen?"var(--text-3)":"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {isOpen?<em style={{ fontStyle:"italic" }}>Open Role</em>:p.name}
          </div>
          <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.role}</div>
        </div>

        {/* Dept */}
        <div style={{ flex:"0 0 100px" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4, background:`${dc}15`, border:`1px solid ${dc}30`, fontFamily:"var(--mono)", fontSize:9, color:dc, textTransform:"uppercase", letterSpacing:"0.07em" }}>
            <span style={{ width:4, height:4, borderRadius:"50%", background:dc }}/>{p.department.slice(0,4)}
          </span>
        </div>

        {/* Level */}
        <div style={{ flex:"0 0 60px", fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>
          {p.level} <span style={{ color:"var(--text-4)", fontSize:9.5 }}>· {LEVEL_BAND[p.level]}</span>
        </div>

        {/* Status */}
        <div style={{ flex:"0 0 90px", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:sm.color, flexShrink:0 }}/>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:sm.color }}>{sm.label}</span>
        </div>

        {/* Reports */}
        {hasChildren && (
          <div style={{ flex:"0 0 70px", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>
            {reports} report{reports !== 1 ? "s" : ""}
          </div>
        )}

        {/* Tenure + location */}
        <div style={{ marginLeft:"auto", display:"flex", gap:20, alignItems:"center" }}>
          {!isOpen && tenure !== "—" && (
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>{tenure}</span>
          )}
          {p.location && (
            <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-4)", whiteSpace:"nowrap" }}>{p.location}</span>
          )}
        </div>
      </div>

      {/* Add direct report (on hover) */}
      {hov && !isOpen && (
        <button onClick={e => { e.stopPropagation(); onAdd(); }}
          style={{ flexShrink:0, marginRight:14, display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"transparent", border:"1px dashed var(--line-strong)", borderRadius:4, color:"var(--text-4)", fontSize:10.5, fontFamily:"var(--mono)", cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--line-strong)"; e.currentTarget.style.color="var(--text-4)"; }}>
          {Icon.plus} Add report
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Directory Table
// ═══════════════════════════════════════════════════════════════════════════
function DirectoryTable({ people, search, setSearch, sortKey, setSortKey, sortAsc, setSortAsc, deptFilter, statusFilter, setStatusFilter, onSelect, onAdd }: {
  people: Person[]; search: string; setSearch:(s:string)=>void;
  sortKey: SortKey; setSortKey:(k:SortKey)=>void;
  sortAsc: boolean; setSortAsc:(a:boolean)=>void;
  deptFilter: Department|"all"; statusFilter: Status|"all"; setStatusFilter:(s:Status|"all")=>void;
  onSelect:(p:Person)=>void; onAdd:()=>void;
}) {
  const filtered = people
    .filter(p => deptFilter === "all" || p.department === deptFilter)
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => !search || [p.name,p.role,p.email,p.location].some(f => f.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sortKey === "tenure") {
        const am = parseTenureMonths(a.startDate) ?? -1;
        const bm = parseTenureMonths(b.startDate) ?? -1;
        return sortAsc ? am - bm : bm - am;
      }
      const av = String(a[sortKey as keyof Person] ?? "");
      const bv = String(b[sortKey as keyof Person] ?? "");
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); }
  }

  function exportCsv() {
    const headers = ["ID","Name","Role","Department","Level","Status","Email","Manager","Location","Start Date","Tenure"];
    const rows = filtered.map(p => {
      const mgr = people.find(q => q.id === p.managerId);
      return [p.id, p.name, p.role, p.department, p.level, p.status, p.email, mgr?.name??"", p.location, p.startDate, formatTenure(parseTenureMonths(p.startDate))];
    });
    const csv = [headers,...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="people-export.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const colHdr = (k: SortKey, label: string, flex = 1) => (
    <div key={k} style={{ flex, display:"flex", alignItems:"center", gap:4, cursor:"pointer", userSelect:"none" as const, color:sortKey===k?"var(--text)":"var(--text-3)" }}
      onClick={() => toggleSort(k)}>
      <span style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em" }}>{label}</span>
      {sortKey===k && <span style={{ fontSize:9, opacity:0.7 }}>{sortAsc?"↑":"↓"}</span>}
    </div>
  );

  const statusCounts = (["active","contractor","onleave","open"] as Status[]).map(s => ({
    key:s, ...STATUS_META[s], count:people.filter(p=>p.status===s&&(deptFilter==="all"||p.department===deptFilter)).length
  }));

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:10, alignItems:"center" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", opacity:0.4 }}>{Icon.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, role, location…"
            style={{ width:"100%", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:6, padding:"8px 12px 8px 30px", color:"var(--text)", fontSize:13, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", whiteSpace:"nowrap" }}>{filtered.length} records</div>
        <button onClick={exportCsv} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:6, color:"var(--text-3)", fontSize:12, cursor:"pointer", fontFamily:"var(--mono)", letterSpacing:"0.04em" }}>
          {Icon.download} Export CSV
        </button>
        <button onClick={onAdd} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>
          {Icon.plus} Add Person
        </button>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={() => setStatusFilter("all")} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, border:"1px solid", fontSize:11, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s", background:statusFilter==="all"?"var(--surface-2)":"transparent", borderColor:statusFilter==="all"?"var(--text-3)":"var(--line)", color:statusFilter==="all"?"var(--text)":"var(--text-4)" }}>
          All · {people.filter(p=>deptFilter==="all"||p.department===deptFilter).length}
        </button>
        {statusCounts.map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, border:"1px solid", fontSize:11, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s", background:statusFilter===s.key?s.bg:"transparent", borderColor:statusFilter===s.key?s.color:"var(--line)", color:statusFilter===s.key?s.color:"var(--text-4)" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
            {s.label} · {s.count}
          </button>
        ))}
      </div>

      <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
        <div style={{ display:"flex", padding:"10px 18px", borderBottom:"1px solid var(--line)", gap:12 }}>
          {colHdr("name","Name",2)}
          {colHdr("role","Role",2.5)}
          {colHdr("department","Dept",1)}
          {colHdr("level","Lvl",0.6)}
          {colHdr("status","Status",1)}
          <div style={{ flex:1.5, fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-3)" }}>Manager</div>
          <div style={{ flex:1.2, fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-3)" }}>Location</div>
          {colHdr("tenure","Tenure",0.7)}
          {colHdr("startDate","Started",0.8)}
        </div>

        {filtered.map((p, i) => {
          const dc = DEPT_COLORS[p.department];
          const sm = STATUS_META[p.status];
          const mgr = people.find(q => q.id === p.managerId);
          const isOpen = p.status === "open";
          const tenureStr = isOpen ? "—" : formatTenure(parseTenureMonths(p.startDate));
          return (
            <div key={p.id} style={{ display:"flex", padding:"11px 18px", gap:12, borderBottom: i < filtered.length-1 ? "1px solid var(--line)" : "none", cursor:"pointer", background:"transparent", transition:"background 0.12s", alignItems:"center" }}
              onMouseEnter={e => (e.currentTarget.style.background="var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background="transparent")}
              onClick={() => onSelect(p)}>
              <div style={{ flex:2, display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:isOpen?"var(--surface-3)":`${dc}25`, color:isOpen?"var(--text-4)":dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0, border:isOpen?"1.5px dashed var(--line-strong)":"none" }}>
                  {isOpen?"?":initials(p.name)}
                </div>
                <span style={{ fontSize:13, fontWeight:isOpen?400:500, color:isOpen?"var(--text-3)":"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {isOpen?<em style={{ fontStyle:"italic" }}>Open Role</em>:p.name}
                </span>
              </div>
              <div style={{ flex:2.5, fontSize:12.5, color:"var(--text-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.role}</div>
              <div style={{ flex:1 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4, background:`${dc}18`, border:`1px solid ${dc}35`, fontFamily:"var(--mono)", fontSize:9, color:dc, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:dc }}/>{p.department.slice(0,4)}
                </span>
              </div>
              <div style={{ flex:0.6, fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{p.level}</div>
              <div style={{ flex:1 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:99, background:sm.bg, fontFamily:"var(--mono)", fontSize:9, color:sm.color, letterSpacing:"0.05em" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:sm.color }}/>{sm.label}
                </span>
              </div>
              <div style={{ flex:1.5, fontSize:12, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{mgr?.name??"—"}</div>
              <div style={{ flex:1.2, fontSize:11.5, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.location||"—"}</div>
              <div style={{ flex:0.7, fontFamily:"var(--mono)", fontSize:11, color:isOpen?"var(--text-4)":"var(--text-3)" }}>{tenureStr}</div>
              <div style={{ flex:0.8, fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>{p.startDate||"—"}</div>
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
// Person Drawer
// ═══════════════════════════════════════════════════════════════════════════
function PersonDrawer({ person, isEditing, confirmDelete, people, onClose, onEdit, onChange, onSave, onCancel, onDelete, onConfirmDelete, onCancelDelete, onAddDirectReport }: {
  person: Person; isEditing: boolean; confirmDelete: boolean; people: Person[];
  onClose: () => void; onEdit: () => void; onChange: (p: Person) => void;
  onSave: () => void; onCancel: () => void; onDelete: () => void;
  onConfirmDelete: () => void; onCancelDelete: () => void; onAddDirectReport: () => void;
}) {
  const dc = DEPT_COLORS[person.department];
  const sm = STATUS_META[person.status];
  const isOpen = person.status === "open";
  const manager = people.find(p => p.id === person.managerId);
  const reports = people.filter(p => p.managerId === person.id);

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:40 }} onClick={onClose}/>
      <div style={{ position:"fixed", right:0, top:0, bottom:0, width:380, background:"var(--surface-1)", borderLeft:"1px solid var(--line)", zIndex:50, display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:isOpen?"var(--surface-3)":`${dc}28`, color:isOpen?"var(--text-4)":dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, fontFamily:"var(--mono)", border:isOpen?"1.5px dashed var(--line-strong)":"none" }}>
              {isOpen?"?":initials(person.name)}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>{isOpen?"Open Role":person.name}</div>
              <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:1 }}>{person.id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:0, color:"var(--text-3)", cursor:"pointer", padding:4 }}>{Icon.close}</button>
        </div>
        <div style={{ flex:1, padding:"20px", display:"flex", flexDirection:"column", gap:20 }}>
          {isEditing ? <EditForm person={person} people={people} onChange={onChange}/> : (
            <>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
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
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:4 }}>Role</div>
                <div style={{ fontSize:16, fontWeight:500, lineHeight:1.3 }}>{person.role}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[{ label:"Email", value:person.email||"—" },{ label:"Location", value:person.location||"—" },{ label:"Started", value:person.startDate||"—" },{ label:"Tenure", value:formatTenure(parseTenureMonths(person.startDate)) },{ label:"Manager", value:manager?.name||"No manager" }].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:12.5, color:"var(--text-2)" }}>{value}</div>
                  </div>
                ))}
              </div>
              {reports.length > 0 && (
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:10 }}>Direct Reports ({reports.length})</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {reports.map(r => (
                      <div key={r.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"var(--surface-2)", borderRadius:6, border:"1px solid var(--line)" }}>
                        <div style={{ width:22, height:22, borderRadius:5, background:`${DEPT_COLORS[r.department]}25`, color:DEPT_COLORS[r.department], display:"flex", alignItems:"center", justifyContent:"center", fontSize:8.5, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0 }}>
                          {r.status==="open"?"?":initials(r.name)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:r.status==="open"?"var(--text-3)":"var(--text)" }}>{r.status==="open"?"Open Role":r.name}</div>
                          <div style={{ fontSize:11, color:"var(--text-4)" }}>{r.role}</div>
                        </div>
                        <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{r.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={onAddDirectReport} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", background:"transparent", border:"1px dashed var(--line-strong)", borderRadius:6, color:"var(--text-3)", fontSize:12.5, cursor:"pointer", fontFamily:"var(--sans)", transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--line-strong)"; e.currentTarget.style.color="var(--text-3)"; }}>
                {Icon.plus} Add Direct Report
              </button>
            </>
          )}
        </div>
        <div style={{ padding:"16px 20px", borderTop:"1px solid var(--line)", display:"flex", gap:8 }}>
          {confirmDelete ? (
            <>
              <div style={{ flex:1, fontSize:12, color:"#FF6B6B", display:"flex", alignItems:"center" }}>Delete {isOpen?"this role":person.name}?</div>
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
              <button onClick={onDelete} style={{ padding:"7px 10px", background:"transparent", border:"1px solid var(--line)", borderRadius:5, color:"var(--text-4)", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"var(--sans)" }}>{Icon.trash}</button>
              <button onClick={onEdit} style={{ flex:1, padding:"7px 14px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:5, color:"var(--text-2)", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontFamily:"var(--sans)" }}>{Icon.edit} Edit</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function EditForm({ person, people, onChange }: { person: Person; people: Person[]; onChange: (p: Person) => void }) {
  const fld = (label: string, key: keyof Person, type = "text") => (
    <div key={key}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
      <input type={type} value={String(person[key]??"")} onChange={e => onChange({ ...person, [key]:e.target.value })}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
    </div>
  );
  const sel = (label: string, key: keyof Person, opts: string[]) => (
    <div key={key}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
      <select value={String(person[key]??"")} onChange={e => { const val=e.target.value; const u: Partial<Person>={[key]:val}; if(key==="department") u.color=DEPT_COLORS[val as Department]; onChange({...person,...u}); }}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  const managers = people.filter(p => p.id !== person.id && p.status !== "open");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {fld("Full Name","name")} {fld("Job Title / Role","role")}
      {sel("Department","department",DEPARTMENTS)} {sel("Level","level",LEVELS)}
      {sel("Employment Status","status",["active","contractor","onleave","open"] as Status[])}
      <div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>Manager</div>
        <select value={person.managerId??""} onChange={e => onChange({...person,managerId:e.target.value||null})}
          style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}>
          <option value="">No manager (top level)</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
        </select>
      </div>
      {fld("Email","email","email")} {fld("Location","location")} {fld("Start Date","startDate")}
    </div>
  );
}

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
        <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:3 }}>New Position</div>
            <div style={{ fontSize:16, fontWeight:500 }}>{managerName?`Add Report to ${managerName}`:"Add to Organization"}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:0, color:"var(--text-3)", cursor:"pointer", padding:4 }}>{Icon.close}</button>
        </div>
        <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:14, maxHeight:"65vh", overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormField label="Full Name" value={person.name} onChange={v => onChange({...person,name:v})} placeholder="Jane Smith"/>
            <FormField label="Email" value={person.email} onChange={v => onChange({...person,email:v})} placeholder="jsmith@ambient.ai" type="email"/>
          </div>
          <FormField label="Job Title / Role" value={person.role} onChange={v => onChange({...person,role:v})} placeholder="Software Engineer" required/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormSelect label="Department" value={person.department} onChange={v => onChange({...person,department:v as Department,color:DEPT_COLORS[v as Department]})} options={DEPARTMENTS}/>
            <FormSelect label="Level" value={person.level} onChange={v => onChange({...person,level:v as Level})} options={LEVELS}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FormSelect label="Status" value={person.status} onChange={v => onChange({...person,status:v as Status})} options={["active","contractor","onleave","open"]}/>
            <FormField label="Start Date" value={person.startDate} onChange={v => onChange({...person,startDate:v})} placeholder="Jan 2024"/>
          </div>
          <FormField label="Location" value={person.location} onChange={v => onChange({...person,location:v})} placeholder="San Francisco, CA"/>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>Reports To</div>
            <select value={person.managerId??""} onChange={e => onChange({...person,managerId:e.target.value||null})}
              style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none" }}>
              <option value="">No manager (top level)</option>
              {people.filter(p => p.status!=="open").map(m => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding:"14px 22px", borderTop:"1px solid var(--line)", display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ padding:"9px 18px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, color:"var(--text-2)", fontSize:13, cursor:"pointer", fontFamily:"var(--sans)" }}>Cancel</button>
          <button onClick={onSave} disabled={!isValid} style={{ flex:1, padding:"9px 18px", background:isValid?"var(--accent)":"var(--surface-3)", border:0, borderRadius:6, color:isValid?"#fff":"var(--text-4)", fontSize:13, fontWeight:500, cursor:isValid?"pointer":"not-allowed", fontFamily:"var(--sans)", transition:"all 0.15s" }}>
            Add to Org
          </button>
        </div>
      </div>
    </>
  );
}

function FormField({ label, value, onChange, placeholder, type="text", required=false }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; required?:boolean;
}) {
  return (
    <div>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>
        {label}{required&&<span style={{ color:"#FF6B6B", marginLeft:3 }}>*</span>}
      </div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label:string; value:string; onChange:(v:string)=>void; options:string[] }) {
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
