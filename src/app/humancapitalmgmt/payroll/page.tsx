"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, CartesianGrid, ReferenceLine,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
type Status     = "active" | "onleave" | "contractor" | "open";
type Department = "Executive"|"Engineering"|"Clinical"|"Operations"|"Design"|"Finance"|"Regulatory";
type Level      = "L1"|"L2"|"L3"|"L4"|"L5"|"L6"|"L7";
type SortField  = "name"|"dept"|"level"|"base"|"total";

interface Person {
  id: string; name: string; role: string; department: Department;
  level: Level; email: string; status: Status; startDate: string;
  color: string; location: string; managerId: string | null;
}
interface PersonCost {
  person: Person;
  base: number; benefits: number; bonus: number; equity: number;
  contractorPremium: number; total: number;
}
interface BurnPoint {
  month: string; salary: number; benefits: number; bonus: number; equity: number;
  total: number; projected: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────
const DEPARTMENTS: Department[] = ["Executive","Engineering","Clinical","Operations","Design","Finance","Regulatory"];
const LEVELS: Level[]           = ["L1","L2","L3","L4","L5","L6","L7"];
const LEVEL_BAND: Record<Level,string> = { L1:"Associate", L2:"Junior", L3:"Mid-Level", L4:"Senior", L5:"Staff", L6:"Director", L7:"Executive" };
const DEPT_COLORS: Record<Department,string> = {
  Executive:"#2D72D2", Engineering:"#00B4D8", Clinical:"#3DCC91",
  Operations:"#FB923C", Design:"#A78BFA", Finance:"#FFC940", Regulatory:"#F59E0B",
};
const STATUS_META: Record<Status,{label:string;color:string}> = {
  active:     { label:"Active",     color:"#3DCC91" },
  onleave:    { label:"On Leave",   color:"#FFC940" },
  contractor: { label:"Contractor", color:"#A78BFA" },
  open:       { label:"Open Role",  color:"rgba(246,247,248,0.38)" },
};

// Comp model — midpoints of known salary bands
const BASE_MID: Record<Level,number> = { L1:75000, L2:97500, L3:127500, L4:167500, L5:220000, L6:295000, L7:420000 };
const BONUS_P:  Record<Level,number> = { L1:5, L2:8, L3:10, L4:12, L5:15, L6:20, L7:25 };
const EQ_ANN:   Record<Level,number> = { L1:0, L2:4375, L3:12500, L4:34375, L5:87500, L6:212500, L7:525000 };
const BEN_FLAT  = 18000;   // medical/dental/vision/401k/commuter
const FICA_RATE = 0.0765;  // employer share

const CAT_COLORS = {
  salary:   "#3DCC91",
  benefits: "#00B4D8",
  bonus:    "#FFC940",
  equity:   "#2D72D2",
};

// Seed people for fallback
const SEED: Person[] = [
  { id:"P001", name:"Elena Vasquez",     role:"Chief Executive Officer",       department:"Executive",   level:"L7", managerId:null,   email:"evasquez@ambient.ai",   status:"active",     startDate:"Jan 2022", color:"#2D72D2", location:"San Francisco, CA" },
  { id:"P002", name:"Marcus Chen",       role:"Chief Technology Officer",       department:"Engineering", level:"L7", managerId:"P001", email:"mchen@ambient.ai",      status:"active",     startDate:"Mar 2022", color:"#00B4D8", location:"San Francisco, CA" },
  { id:"P003", name:"Sofia Patel",       role:"Chief Medical Officer",          department:"Clinical",    level:"L7", managerId:"P001", email:"spatel@ambient.ai",     status:"active",     startDate:"May 2022", color:"#3DCC91", location:"Chicago, IL" },
  { id:"P004", name:"Jordan Kim",        role:"VP Finance",                     department:"Finance",     level:"L6", managerId:"P001", email:"jkim@ambient.ai",       status:"active",     startDate:"Jun 2022", color:"#FFC940", location:"New York, NY" },
  { id:"P005", name:"Riley Torres",      role:"VP Operations",                  department:"Operations",  level:"L6", managerId:"P001", email:"rtorres@ambient.ai",    status:"active",     startDate:"Jul 2022", color:"#FB923C", location:"Denver, CO" },
  { id:"P006", name:"Nour Khalil",       role:"Head of Design",                 department:"Design",      level:"L5", managerId:"P001", email:"nkhalil@ambient.ai",    status:"active",     startDate:"Sep 2022", color:"#A78BFA", location:"London, UK" },
  { id:"P007", name:"Dr. Claire Dubois", role:"VP Regulatory Affairs",          department:"Regulatory",  level:"L6", managerId:"P001", email:"cdubois@ambient.ai",    status:"active",     startDate:"Apr 2022", color:"#F59E0B", location:"Paris, FR" },
  { id:"P010", name:"Gavin Wright",      role:"Senior Hardware Engineer",        department:"Engineering", level:"L5", managerId:"P002", email:"gwright@ambient.ai",    status:"active",     startDate:"Aug 2022", color:"#00B4D8", location:"San Francisco, CA" },
  { id:"P011", name:"Isaac Osei",        role:"Backend Engineer",                department:"Engineering", level:"L4", managerId:"P002", email:"iosei@ambient.ai",      status:"active",     startDate:"Sep 2022", color:"#818CF8", location:"Remote" },
  { id:"P012", name:"Hanna Mueller",     role:"Full-Stack Engineer",             department:"Engineering", level:"L4", managerId:"P002", email:"hmueller@ambient.ai",   status:"active",     startDate:"Oct 2022", color:"#F472B6", location:"Berlin, DE" },
  { id:"P013", name:"Paulo Santos",      role:"Cloud Infrastructure Engineer",   department:"Engineering", level:"L4", managerId:"P002", email:"psantos@ambient.ai",    status:"active",     startDate:"Oct 2022", color:"#FB923C", location:"São Paulo, BR" },
  { id:"P014", name:"Aki Tanaka",        role:"Frontend Engineer",               department:"Engineering", level:"L3", managerId:"P002", email:"atanaka@ambient.ai",    status:"active",     startDate:"Jan 2023", color:"#34D399", location:"Tokyo, JP" },
  { id:"P015", name:"Abdul Rahman",      role:"Security Engineer",               department:"Engineering", level:"L4", managerId:"P002", email:"arahman@ambient.ai",    status:"active",     startDate:"Jan 2023", color:"#22D3EE", location:"Dubai, UAE" },
  { id:"P016", name:"",                role:"ML Engineer",                      department:"Engineering", level:"L4", managerId:"P002", email:"",                      status:"open",       startDate:"",         color:"#2D72D2", location:"" },
  { id:"P020", name:"Dr. Amy Lin",       role:"Clinical Lead",                   department:"Clinical",    level:"L5", managerId:"P003", email:"alin@ambient.ai",       status:"active",     startDate:"Jun 2022", color:"#3DCC91", location:"Chicago, IL" },
  { id:"P021", name:"James Okonkwo",     role:"Clinical Informatics Specialist", department:"Clinical",    level:"L3", managerId:"P020", email:"jokonkwo@ambient.ai",   status:"active",     startDate:"Feb 2023", color:"#3DCC91", location:"Atlanta, GA" },
  { id:"P022", name:"Maria Rossi",       role:"Nurse Informatics Consultant",    department:"Clinical",    level:"L3", managerId:"P020", email:"mrossi@ambient.ai",     status:"contractor", startDate:"Mar 2023", color:"#3DCC91", location:"Boston, MA" },
  { id:"P023", name:"",                role:"Clinical Data Analyst",            department:"Clinical",    level:"L3", managerId:"P003", email:"",                      status:"open",       startDate:"",         color:"#3DCC91", location:"" },
  { id:"P030", name:"Sam Park",          role:"UX Designer",                     department:"Design",      level:"L3", managerId:"P006", email:"spark@ambient.ai",      status:"active",     startDate:"Jan 2023", color:"#A78BFA", location:"Seoul, KR" },
  { id:"P031", name:"",                role:"Product Designer",                  department:"Design",      level:"L4", managerId:"P006", email:"",                      status:"open",       startDate:"",         color:"#A78BFA", location:"" },
  { id:"P040", name:"Thomas Berg",       role:"Regulatory Affairs Specialist",   department:"Regulatory",  level:"L3", managerId:"P007", email:"tberg@ambient.ai",      status:"active",     startDate:"Aug 2022", color:"#F59E0B", location:"Munich, DE" },
  { id:"P041", name:"",                role:"Quality Systems Manager",           department:"Regulatory",  level:"L4", managerId:"P007", email:"",                      status:"open",       startDate:"",         color:"#F59E0B", location:"" },
  { id:"P050", name:"Priya Sharma",      role:"Senior Financial Analyst",        department:"Finance",     level:"L4", managerId:"P004", email:"psharma@ambient.ai",    status:"active",     startDate:"Feb 2023", color:"#FFC940", location:"New York, NY" },
  { id:"P060", name:"Leo Marchetti",     role:"Operations Manager",              department:"Operations",  level:"L4", managerId:"P005", email:"lmarchetti@ambient.ai", status:"active",     startDate:"Mar 2023", color:"#FB923C", location:"Denver, CO" },
  { id:"P061", name:"Yuki Sato",         role:"Customer Success Manager",        department:"Operations",  level:"L3", managerId:"P005", email:"ysato@ambient.ai",      status:"onleave",    startDate:"Apr 2023", color:"#FB923C", location:"Remote" },
];

// ── Cost calculations ──────────────────────────────────────────────────────
function calcCost(p: Person): PersonCost {
  const base = BASE_MID[p.level];
  if (p.status === "open") {
    const benEst = BEN_FLAT + Math.round(base * FICA_RATE);
    return { person:p, base, benefits:benEst, bonus:0, equity:0, contractorPremium:0, total:base+benEst };
  }
  if (p.status === "contractor") {
    const contractorTotal = Math.round(base * 1.3);
    return { person:p, base, benefits:0, bonus:0, equity:0, contractorPremium:Math.round(base*0.3), total:contractorTotal };
  }
  const benefits = BEN_FLAT + Math.round(base * FICA_RATE);
  const bonus    = Math.round(base * BONUS_P[p.level] / 100);
  const equity   = EQ_ANN[p.level];
  return { person:p, base, benefits, bonus, equity, contractorPremium:0, total:base+benefits+bonus+equity };
}

function parseStartDate(s: string): Date | null {
  if (!s) return null;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [m, y] = s.split(" ");
  const mi = MONTHS.indexOf(m);
  if (mi === -1 || !y) return null;
  return new Date(parseInt(y), mi, 1);
}

function buildBurnData(people: Person[]): BurnPoint[] {
  const pivotDate = new Date(2026, 4, 1); // May 2026 = "today"
  const startDate = new Date(2022, 0, 1);
  const endDate   = new Date(2026, 10, 1); // 6-month projection
  const data: BurnPoint[] = [];
  const cur = new Date(startDate);
  let projMultiplier = 1;

  while (cur <= endDate) {
    const isProjected = cur > pivotDate;
    if (isProjected) projMultiplier += 0.015; // ~1.5% mo growth for projection

    const activePeople = people.filter(p => {
      const sd = parseStartDate(p.startDate);
      return sd && sd <= cur && p.status !== "open";
    });

    let salary = 0, benefits = 0, bonus = 0, equity = 0;
    for (const p of activePeople) {
      const c = calcCost(p);
      if (p.status === "contractor") {
        salary += c.total / 12;
      } else {
        salary    += c.base     / 12;
        benefits  += c.benefits / 12;
        bonus     += c.bonus    / 12;
        equity    += c.equity   / 12;
      }
    }

    const mult = isProjected ? projMultiplier : 1;
    data.push({
      month:     cur.toLocaleDateString("en-US", { month:"short", year:"2-digit" }),
      salary:    Math.round(salary    * mult),
      benefits:  Math.round(benefits  * mult),
      bonus:     Math.round(bonus     * mult),
      equity:    Math.round(equity    * mult),
      total:     Math.round((salary + benefits + bonus + equity) * mult),
      projected: isProjected,
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return data;
}

function fmtM(n: number): string {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(n%100000===0?1:2)}M`;
  if (n >= 1000)      return `$${(n/1000).toFixed(0)}K`;
  return `$${n}`;
}
function fmtMDecimal(n: number): string {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1000)      return `$${(n/1000).toFixed(1)}K`;
  return `$${n}`;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  list:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="2.5" width="13" height="2" rx=".5"/><rect x="1.5" y="7" width="13" height="2" rx=".5"/><rect x="1.5" y="11.5" width="13" height="2" rx=".5"/></svg>,
  org:     <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".75"/><rect x="1" y="11" width="4" height="3" rx=".75"/><rect x="6" y="11" width="4" height="3" rx=".75"/><rect x="11" y="11" width="4" height="3" rx=".75"/><path d="M8 4.5v3M3 11V9h10V8" strokeLinecap="round"/></svg>,
  steps:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8h4v6H2zM6 5h4v9H6zM10 2h4v12h-4z" strokeLinejoin="round"/></svg>,
  flame:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 14C4.7 14 2.5 12 2.5 9c0-2.5 2-4 2-6 1 1.5 1.5 2 2.5 2.5C7 3.5 7 2 8 1c0 3 3.5 3.5 3.5 6.5C11.5 11.5 10.5 14 8 14z" strokeLinejoin="round"/></svg>,
  down:    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sort:    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h8M5 8h6M6 11h4" strokeLinecap="round"/></svg>,
  person:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="2.8"/><path d="M2 13.5c0-2.8 2.7-5 6-5s6 2.2 6 5" strokeLinecap="round"/></svg>,
  export:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 11v2.5h12V11M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ── Recharts custom tooltip ────────────────────────────────────────────────
function BurnTooltip({ active, payload, label }: { active?:boolean; payload?:{ value:number; name:string; fill:string }[]; label?:string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{ background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:8, padding:"12px 14px", fontFamily:"var(--mono)", fontSize:10.5, minWidth:160 }}>
      <div style={{ color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontSize:9.5 }}>{label}</div>
      {payload.slice().reverse().map(p => (
        <div key={p.name} style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom:4 }}>
          <span style={{ color:"var(--text-3)" }}>{p.name.charAt(0).toUpperCase()+p.name.slice(1)}</span>
          <span style={{ color:p.fill, fontWeight:500 }}>{fmtM(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid var(--line)", paddingTop:6, marginTop:4, display:"flex", justifyContent:"space-between" }}>
        <span style={{ color:"var(--text-2)", fontWeight:500 }}>Total</span>
        <span style={{ color:"var(--text)", fontWeight:600 }}>{fmtM(total)}</span>
      </div>
    </div>
  );
}

function DeptTooltip({ active, payload, label }: { active?:boolean; payload?:{ value:number; fill:string }[]; label?:string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:7, padding:"10px 12px", fontFamily:"var(--mono)", fontSize:10.5 }}>
      <div style={{ color:"var(--text-2)", marginBottom:4 }}>{label}</div>
      <div style={{ color:payload[0].fill, fontWeight:500 }}>{fmtM(payload[0].value * 12)} / yr</div>
      <div style={{ color:"var(--text-4)", fontSize:9.5 }}>{fmtM(payload[0].value)} / mo</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function PayrollPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [sortBy,  setSortBy]  = useState<SortField>("total");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [deptFilter, setDeptFilter] = useState<Department|"all">("all");
  const [showOpen, setShowOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hcm_people_v2");
      setPeople(raw ? JSON.parse(raw) : SEED);
    } catch { setPeople(SEED); }
  }, []);

  const costs = useMemo(() => people.map(calcCost), [people]);
  const burnData = useMemo(() => buildBurnData(people), [people]);

  const activeCosts = costs.filter(c => showOpen ? true : c.person.status !== "open");
  const filteredCosts = deptFilter === "all" ? activeCosts : activeCosts.filter(c => c.person.department === deptFilter);

  // Aggregate totals
  const totals = useMemo(() => {
    const all = showOpen ? costs : costs.filter(c => c.person.status !== "open");
    return {
      salary:   all.reduce((s, c) => s + (c.person.status === "contractor" ? c.base : c.base), 0),
      benefits: all.reduce((s, c) => s + c.benefits, 0),
      bonus:    all.reduce((s, c) => s + c.bonus, 0),
      equity:   all.reduce((s, c) => s + c.equity, 0),
      total:    all.reduce((s, c) => s + c.total, 0),
      headcount: all.filter(c => c.person.status !== "open" && c.person.name).length,
      openRoles: costs.filter(c => c.person.status === "open").length,
      contractors: all.filter(c => c.person.status === "contractor").length,
    };
  }, [costs, showOpen]);

  const monthly = Math.round(totals.total / 12);
  const avgPerEmployee = totals.headcount > 0 ? Math.round(totals.total / totals.headcount) : 0;
  const benefitsBurdenPct = totals.total > 0 ? Math.round((totals.benefits / totals.total) * 100) : 0;
  const equityPct         = totals.total > 0 ? Math.round((totals.equity   / totals.total) * 100) : 0;

  // Category ring data
  const ringData = [
    { name:"Salaries",   value:totals.salary,   fill:CAT_COLORS.salary   },
    { name:"Benefits",   value:totals.benefits,  fill:CAT_COLORS.benefits },
    { name:"Bonuses",    value:totals.bonus,     fill:CAT_COLORS.bonus    },
    { name:"Equity",     value:totals.equity,    fill:CAT_COLORS.equity   },
  ].filter(d => d.value > 0);

  // Department totals for bar chart
  const deptData = DEPARTMENTS.map(dept => {
    const dc = costs.filter(c => c.person.department === dept && (showOpen ? true : c.person.status !== "open"));
    return {
      dept,
      label: dept.slice(0,4).toUpperCase(),
      total: dc.reduce((s,c) => s+c.total, 0),
      monthly: Math.round(dc.reduce((s,c) => s+c.total, 0) / 12),
      headcount: dc.filter(c => c.person.name && c.person.status !== "open").length,
      color: DEPT_COLORS[dept],
    };
  }).filter(d => d.total > 0).sort((a,b) => b.total - a.total);

  // Sorted employee table
  const sortedCosts = useMemo(() => {
    const arr = [...filteredCosts];
    arr.sort((a, b) => {
      let av: string|number, bv: string|number;
      if (sortBy === "name")  { av = a.person.name;            bv = b.person.name; }
      else if (sortBy === "dept")  { av = a.person.department; bv = b.person.department; }
      else if (sortBy === "level") { av = a.person.level;      bv = b.person.level; }
      else if (sortBy === "base")  { av = a.base;              bv = b.base; }
      else                         { av = a.total;             bv = b.total; }
      if (typeof av === "string") return sortDir==="asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? (av - (bv as number)) : ((bv as number) - av);
    });
    return arr;
  }, [filteredCosts, sortBy, sortDir]);

  // Level breakdown
  const levelData = LEVELS.map(l => {
    const lc = costs.filter(c => c.person.level === l && c.person.status !== "open");
    return { level:l, band:LEVEL_BAND[l], total:lc.reduce((s,c)=>s+c.total,0), count:lc.length };
  }).filter(d => d.count > 0);

  const maxLevelTotal = Math.max(...levelData.map(d => d.total), 1);

  function toggleSort(f: SortField) {
    if (sortBy === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(f); setSortDir("desc"); }
  }

  // Sidebar styles
  const navLabel:  React.CSSProperties = { fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", padding:"0 8px", marginBottom:8 };
  const navBase:   React.CSSProperties = { display:"flex", alignItems:"center", gap:10, padding:"7px 8px 7px 10px", fontSize:13, color:"var(--text-2)", borderRadius:4, cursor:"pointer", textDecoration:"none" };
  const navActive: React.CSSProperties = { ...navBase, background:"var(--surface-2)", color:"var(--text)", fontWeight:500 };

  // Current burn point (latest non-projected)
  const currentBurn = burnData.filter(b => !b.projected).slice(-1)[0];

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
            <div style={navBase as React.CSSProperties}><span style={{ opacity:0.65 }}>{Icon.list}</span>Dashboard</div>
          </Link>
          <Link href="/humancapitalmgmt/orgchart" style={{ textDecoration:"none" }}>
            <div style={navBase as React.CSSProperties}><span style={{ opacity:0.65 }}>{Icon.org}</span>Org Chart</div>
          </Link>
          <Link href="/humancapitalmgmt/onboarding" style={{ textDecoration:"none" }}>
            <div style={navBase as React.CSSProperties}><span style={{ opacity:0.65 }}>{Icon.steps}</span>Onboarding</div>
          </Link>
          <div style={navActive}><span>{Icon.flame}</span>Payroll & Burn</div>
        </div>

        {/* Dept filter */}
        <div>
          <div style={navLabel}>Department</div>
          {(["all", ...DEPARTMENTS] as (Department|"all")[]).map(d => (
            <div key={d}
              style={{ ...navBase, color:deptFilter===d?"var(--text)":"var(--text-2)", background:deptFilter===d?"var(--surface-2)":"transparent", cursor:"pointer" }}
              onClick={() => setDeptFilter(d)}>
              {d !== "all" && <span style={{ width:6, height:6, borderRadius:2, background:DEPT_COLORS[d as Department], flexShrink:0 }}/>}
              <span style={{ flex:1, fontSize:12.5 }}>{d === "all" ? "All Departments" : d}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>
                {d === "all"
                  ? costs.filter(c=>c.person.name&&c.person.status!=="open").length
                  : costs.filter(c=>c.person.department===d&&c.person.name&&c.person.status!=="open").length}
              </span>
            </div>
          ))}
        </div>

        {/* Open roles toggle */}
        <div style={{ marginTop:"auto" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", letterSpacing:"0.04em", padding:"8px 8px" }}>
            <input type="checkbox" checked={showOpen} onChange={e => setShowOpen(e.target.checked)} style={{ accentColor:"var(--accent)" }}/>
            Include Open Roles
          </label>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", padding:"0 10px", lineHeight:1.7 }}>
            <div>Monthly burn</div>
            <div style={{ fontSize:14, color:"var(--accent)", fontWeight:500 }}>{fmtM(monthly)}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, overflowX:"hidden" }}>
        {/* Header */}
        <div style={{ borderBottom:"1px solid var(--line)", padding:"18px 32px", position:"sticky", top:0, zIndex:10, background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:4 }}>Human Capital Management</div>
            <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
              Payroll <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>& Burn Rate</em>
            </h1>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", textAlign:"right", lineHeight:1.6 }}>
              <div>Estimates based on level midpoints</div>
              <div style={{ color:"var(--text-3)" }}>Period: FY 2026 · May</div>
            </div>
            <button style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:6, color:"var(--text-3)", fontFamily:"var(--mono)", fontSize:10, cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase" }}>
              {Icon.export} Export
            </button>
          </div>
        </div>

        <div style={{ padding:"28px 32px 64px", display:"flex", flexDirection:"column", gap:28 }}>

          {/* ── Hero Metrics ─────────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
            <HeroCard
              label="Annual Run Rate"
              value={fmtMDecimal(totals.total)}
              sub={`${fmtM(monthly)}/mo`}
              color="#3DCC91"
              accent
            />
            <HeroCard label="Monthly Burn" value={fmtM(monthly)} sub={currentBurn ? `${fmtM(currentBurn.total)} current` : ""} color="#00B4D8"/>
            <HeroCard label="Avg / Employee" value={fmtM(avgPerEmployee)} sub={`${totals.headcount} active headcount`} color="#A78BFA"/>
            <HeroCard label="Benefits Burden" value={`${benefitsBurdenPct}%`} sub={`${fmtM(totals.benefits)}/yr`} color="#FFC940"/>
            <HeroCard label="Equity / Total" value={`${equityPct}%`} sub={`${fmtM(totals.equity)}/yr amortized`} color="#2D72D2"/>
          </div>

          {/* ── Burn Chart + Category Ring ────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16, alignItems:"start" }}>
            {/* Burn Timeline */}
            <div style={{ padding:"20px 20px 16px", background:"var(--surface-1)", borderRadius:12, border:"1px solid var(--line)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:5 }}>Monthly Burn Rate</div>
                  <div style={{ fontSize:13, color:"var(--text-2)" }}>Jan 2022 — present + 6-month projection</div>
                </div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  {Object.entries(CAT_COLORS).map(([k,v]) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:v }}/>
                      {k.charAt(0).toUpperCase()+k.slice(1)}
                    </div>
                  ))}
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>
                    <div style={{ width:16, height:1, borderTop:"1px dashed var(--text-4)" }}/>
                    Projected
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={burnData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                  <defs>
                    {Object.entries(CAT_COLORS).map(([k,v]) => (
                      <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={v} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={v} stopOpacity={0.04}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontFamily:"var(--mono)", fontSize:9, fill:"var(--text-4)" }} tickLine={false} axisLine={false} interval={5}/>
                  <YAxis tickFormatter={v => `$${Math.round(v/1000)}K`} tick={{ fontFamily:"var(--mono)", fontSize:9, fill:"var(--text-4)" }} tickLine={false} axisLine={false} width={48}/>
                  <Tooltip content={<BurnTooltip/>}/>
                  <ReferenceLine x={burnData.findIndex(b => b.projected) > 0 ? burnData.find(b => b.projected)?.month : undefined} stroke="var(--line-strong)" strokeDasharray="4 4"/>
                  <Area type="monotone" dataKey="salary"   stackId="1" stroke={CAT_COLORS.salary}   fill={`url(#grad-salary)`}   strokeWidth={1.5}/>
                  <Area type="monotone" dataKey="benefits" stackId="1" stroke={CAT_COLORS.benefits} fill={`url(#grad-benefits)`} strokeWidth={1.5}/>
                  <Area type="monotone" dataKey="bonus"    stackId="1" stroke={CAT_COLORS.bonus}    fill={`url(#grad-bonus)`}    strokeWidth={1.5}/>
                  <Area type="monotone" dataKey="equity"   stackId="1" stroke={CAT_COLORS.equity}   fill={`url(#grad-equity)`}   strokeWidth={1.5}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Ring */}
            <div style={{ padding:"20px", background:"var(--surface-1)", borderRadius:12, border:"1px solid var(--line)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:16 }}>Annual Cost by Category</div>
              <div style={{ position:"relative" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={ringData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={2} strokeWidth={0}>
                      {ringData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
                    </Pie>
                    <Tooltip formatter={(v) => [fmtM(v as number), ""]} contentStyle={{ background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:6, fontFamily:"var(--mono)", fontSize:10.5 }}/>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                  <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:22, letterSpacing:"-0.01em" }}>{fmtM(totals.total)}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Annual Total</div>
                </div>
              </div>
              {/* Legend */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:14 }}>
                {ringData.map(d => (
                  <div key={d.name} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:d.fill, flexShrink:0 }}/>
                    <div style={{ flex:1, fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)" }}>{d.name}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:11, color:d.fill, fontWeight:500 }}>{fmtM(d.value)}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", minWidth:32, textAlign:"right" }}>
                      {totals.total > 0 ? `${Math.round(d.value/totals.total*100)}%` : "—"}
                    </div>
                  </div>
                ))}
              </div>
              {/* Monthly equivalent */}
              <div style={{ marginTop:16, padding:"12px 14px", background:"var(--surface-2)", borderRadius:8, border:"1px solid var(--line)" }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Monthly Breakdown</div>
                {ringData.map(d => (
                  <div key={d.name} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{d.name}</span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-2)" }}>{fmtM(Math.round(d.value/12))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Department Breakdown ─────────────────────────────────── */}
          <div style={{ background:"var(--surface-1)", borderRadius:12, border:"1px solid var(--line)", padding:"20px 24px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:4 }}>Department Spend</div>
                <div style={{ fontSize:13, color:"var(--text-2)" }}>Annual people cost by department — sorted by total</div>
              </div>
            </div>

            {/* Department cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10, marginBottom:24 }}>
              {deptData.map(d => (
                <div key={d.dept} style={{ padding:"14px 16px", background:"var(--bg)", borderRadius:9, border:`1px solid ${d.color}30`, cursor:"pointer", transition:"border-color 0.15s" }}
                  onClick={() => setDeptFilter(deptFilter === d.dept ? "all" : d.dept)}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:d.color }}/>
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:d.color }}>{d.dept}</span>
                  </div>
                  <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:22, letterSpacing:"-0.01em", color:"var(--text)", marginBottom:2 }}>{fmtM(d.total)}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", marginBottom:10 }}>{fmtM(d.monthly)}/mo · {d.headcount} people</div>
                  <div style={{ height:2, background:"var(--surface-3)", borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${Math.round(d.total/totals.total*100)}%`, background:d.color, borderRadius:2, transition:"width 0.4s" }}/>
                  </div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", marginTop:4 }}>
                    {totals.total > 0 ? `${Math.round(d.total/totals.total*100)}%` : "—"} of total
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={deptData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                <XAxis dataKey="label" tick={{ fontFamily:"var(--mono)", fontSize:9, fill:"var(--text-4)" }} tickLine={false} axisLine={false}/>
                <YAxis tickFormatter={v => `$${Math.round(v/1000)}K`} tick={{ fontFamily:"var(--mono)", fontSize:9, fill:"var(--text-4)" }} tickLine={false} axisLine={false} width={44}/>
                <Tooltip content={<DeptTooltip/>}/>
                <Bar dataKey="monthly" radius={[4,4,0,0]}>
                  {deptData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Level Analysis ───────────────────────────────────────── */}
          <div style={{ background:"var(--surface-1)", borderRadius:12, border:"1px solid var(--line)", padding:"20px 24px" }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:20 }}>Cost by Level Band</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {levelData.slice().reverse().map(d => (
                <div key={d.level} style={{ display:"grid", gridTemplateColumns:"80px 1fr 120px 80px", alignItems:"center", gap:12 }}>
                  <div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:500, color:"var(--text)" }}>{d.level}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{d.band}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:10, background:"var(--surface-3)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round(d.total/maxLevelTotal*100)}%`, background:`linear-gradient(90deg, #2D72D2, #3DCC91)`, borderRadius:3, transition:"width 0.4s" }}/>
                    </div>
                  </div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-2)", textAlign:"right" }}>{fmtM(d.total)}/yr</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", textAlign:"right" }}>{d.count} {d.count===1?"person":"people"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Employee Cost Table ──────────────────────────────────── */}
          <div style={{ background:"var(--surface-1)", borderRadius:12, border:"1px solid var(--line)", padding:"20px 0 4px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 24px 16px" }}>
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:4 }}>Employee Cost Breakdown</div>
                <div style={{ fontSize:13, color:"var(--text-2)" }}>
                  {sortedCosts.length} {deptFilter !== "all" ? deptFilter + " " : ""}records · click column to sort
                </div>
              </div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>
                Total: <span style={{ color:"#3DCC91", fontWeight:500 }}>{fmtM(filteredCosts.reduce((s,c)=>s+c.total,0))}/yr</span>
              </div>
            </div>

            {/* Table header */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1.6fr 0.7fr 0.8fr 100px 100px 100px 110px", gap:0, padding:"0 16px 8px 24px", borderBottom:"1px solid var(--line)" }}>
              {([["name","Employee"],["dept","Department"],["level","Level"],["","Status"],["base","Base"],["","Benefits"],["","Equity"],["total","Total Annual"]] as [SortField|"",string][]).map(([f,lbl]) => (
                <div key={lbl}
                  style={{ fontFamily:"var(--mono)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:sortBy===f&&f?"var(--text-2)":"var(--text-4)", cursor:f?"pointer":"default", display:"flex", alignItems:"center", gap:4, padding:"0 4px" }}
                  onClick={() => f && toggleSort(f)}>
                  {lbl}{f && sortBy===f && <span style={{ opacity:0.7 }}>{sortDir==="asc"?"↑":"↓"}</span>}
                </div>
              ))}
            </div>

            {/* Table rows */}
            <div style={{ maxHeight:480, overflowY:"auto" }}>
              {sortedCosts.map((c, idx) => {
                const dc = DEPT_COLORS[c.person.department] || "#2D72D2";
                const sm = STATUS_META[c.person.status];
                const ini = (n: string) => { if (!n) return "?"; const pts = n.split(" ").filter(Boolean); return pts.length===1?pts[0][0].toUpperCase():(pts[0][0]+pts[pts.length-1][0]).toUpperCase(); };
                const pctOfTotal = totals.total > 0 ? Math.round(c.total / totals.total * 100) : 0;
                return (
                  <div key={c.person.id}
                    style={{ display:"grid", gridTemplateColumns:"2fr 1.6fr 0.7fr 0.8fr 100px 100px 100px 110px", gap:0, padding:"10px 16px 10px 24px", borderBottom:"1px solid var(--line)", transition:"background 0.1s",
                      background:idx%2===0?"transparent":"rgba(255,255,255,0.015)" }}
                    onMouseEnter={e => (e.currentTarget.style.background="var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background=idx%2===0?"transparent":"rgba(255,255,255,0.015)")}>
                    {/* Name */}
                    <div style={{ display:"flex", alignItems:"center", gap:9, padding:"0 4px" }}>
                      <div style={{ width:26, height:26, borderRadius:6, background:`${dc}22`, border:`1px solid ${dc}45`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:9.5, color:dc, fontWeight:700, flexShrink:0 }}>
                        {ini(c.person.name)}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.person.name || `Open — ${c.person.role}`}</div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.person.role}</div>
                      </div>
                    </div>
                    {/* Dept */}
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"0 4px" }}>
                      <div style={{ width:5, height:5, borderRadius:1.5, background:dc, flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:"var(--text-3)" }}>{c.person.department}</span>
                    </div>
                    {/* Level */}
                    <div style={{ display:"flex", alignItems:"center", padding:"0 4px" }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-2)" }}>{c.person.level}</span>
                    </div>
                    {/* Status */}
                    <div style={{ display:"flex", alignItems:"center", padding:"0 4px" }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:9.5, padding:"2px 7px", borderRadius:3, background:`${sm.color}15`, color:sm.color, border:`1px solid ${sm.color}30` }}>{sm.label}</span>
                    </div>
                    {/* Base */}
                    <div style={{ display:"flex", alignItems:"center", padding:"0 4px" }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-2)", fontVariantNumeric:"tabular-nums" }}>{fmtM(c.base)}</span>
                    </div>
                    {/* Benefits */}
                    <div style={{ display:"flex", alignItems:"center", padding:"0 4px" }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)", fontVariantNumeric:"tabular-nums" }}>{c.benefits > 0 ? fmtM(c.benefits) : "—"}</span>
                    </div>
                    {/* Equity */}
                    <div style={{ display:"flex", alignItems:"center", padding:"0 4px" }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)", fontVariantNumeric:"tabular-nums" }}>{c.equity > 0 ? fmtM(c.equity) : "—"}</span>
                    </div>
                    {/* Total + bar */}
                    <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:4, padding:"0 4px" }}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text)", fontWeight:500, fontVariantNumeric:"tabular-nums" }}>{fmtM(c.total)}</span>
                      <div style={{ height:2.5, background:"var(--surface-3)", borderRadius:2 }}>
                        <div style={{ height:"100%", width:`${pctOfTotal * 3}%`, maxWidth:"100%", background:dc, borderRadius:2, transition:"width 0.3s" }}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table footer */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1.6fr 0.7fr 0.8fr 100px 100px 100px 110px", gap:0, padding:"12px 16px 12px 24px", borderTop:"1px solid var(--line-strong)", background:"var(--surface-2)" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:10.5, fontWeight:500, color:"var(--text)", padding:"0 4px" }}>
                Totals ({sortedCosts.length})
              </div>
              <div/><div/><div/>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#3DCC91", fontWeight:500, padding:"0 4px" }}>{fmtM(filteredCosts.reduce((s,c)=>s+c.base,0))}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#00B4D8", fontWeight:500, padding:"0 4px" }}>{fmtM(filteredCosts.reduce((s,c)=>s+c.benefits,0))}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#2D72D2", fontWeight:500, padding:"0 4px" }}>{fmtM(filteredCosts.reduce((s,c)=>s+c.equity,0))}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--text)", fontWeight:600, padding:"0 4px" }}>{fmtM(filteredCosts.reduce((s,c)=>s+c.total,0))}</div>
            </div>
          </div>

          {/* ── Footnote ─────────────────────────────────────────────── */}
          <div style={{ padding:"12px 16px", background:"rgba(255,201,64,0.05)", border:"1px solid rgba(255,201,64,0.18)", borderRadius:8 }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"#FFC940", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Methodology</div>
            <div style={{ fontSize:11.5, color:"var(--text-4)", lineHeight:1.7 }}>
              Estimates based on level band midpoints. Benefits loading includes $18,000 flat (medical/dental/vision/401k/commuter) + 7.65% employer FICA. Equity reflects annualized 4-year grant midpoints. Contractor costs use a 1.3× base multiplier (no benefits or equity). Bonus reflects target percentages and may not be paid in full. Open role costs represent budget allocations. All figures are estimates for planning purposes only.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function HeroCard({ label, value, sub, color, accent }: { label:string; value:string; sub:string; color:string; accent?:boolean }) {
  return (
    <div style={{ padding:"20px 20px 18px", background:accent?"var(--surface-2)":"var(--surface-1)", borderRadius:12, border:`1px solid ${accent?color+"30":"var(--line)"}`, position:"relative", overflow:"hidden" }}>
      {accent && <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at top right, ${color}08, transparent 70%)`, pointerEvents:"none" }}/>}
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:accent?36:28, letterSpacing:"-0.02em", color, lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-4)" }}>{sub}</div>
    </div>
  );
}
