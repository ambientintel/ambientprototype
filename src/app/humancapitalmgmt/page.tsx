"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, AreaChart, Area,
} from "recharts";

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
let _idc = 300;
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

function computeTimeline(people: Person[]): { label: string; n: number }[] {
  const hires: number[] = [];
  people.filter(p => p.startDate && p.status !== "open").forEach(p => {
    const [mon, yr] = p.startDate.split(" ");
    const mIdx = MONTH_NAMES.indexOf(mon);
    const y = parseInt(yr);
    if (mIdx >= 0 && !isNaN(y)) hires.push(new Date(y, mIdx, 1).getTime());
  });
  if (hires.length < 2) return [];
  hires.sort((a, b) => a - b);
  const first = new Date(hires[0]);
  const last  = new Date(hires[hires.length - 1]);
  const result: { label: string; n: number }[] = [];
  let cur = new Date(first.getFullYear(), first.getMonth(), 1);
  while (cur <= last) {
    result.push({ label:`${MONTH_NAMES[cur.getMonth()]} '${String(cur.getFullYear()).slice(2)}`, n: hires.filter(h => h <= cur.getTime()).length });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return result;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  list:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="2.5" width="13" height="2" rx=".5"/><rect x="1.5" y="7" width="13" height="2" rx=".5"/><rect x="1.5" y="11.5" width="13" height="2" rx=".5"/></svg>,
  org:      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".75"/><rect x="1" y="11" width="4" height="3" rx=".75"/><rect x="6" y="11" width="4" height="3" rx=".75"/><rect x="11" y="11" width="4" height="3" rx=".75"/><path d="M8 4.5v3M3 11V9h10V8" strokeLinecap="round"/></svg>,
  plus:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>,
  close:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11 2l3 3-9 9H2v-3L11 2z" strokeLinejoin="round"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M5.5 4V2.5h5V4M6 7v5M10 7v5M3 4l1 10h8l1-10" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrow:    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  download: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h12" strokeLinecap="round"/></svg>,
  search:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M10.5 10.5l3 3" strokeLinecap="round"/></svg>,
  globe:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="6.5"/><path d="M8 1.5C8 1.5 5 4 5 8s3 6.5 3 6.5M8 1.5C8 1.5 11 4 11 8s-3 6.5-3 6.5M1.5 8h13" strokeLinecap="round"/></svg>,
};

const ttStyle = { background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:6, fontFamily:"var(--mono)", fontSize:10 };

// ── Chart: Dept Headcount ─────────────────────────────────────────────────
function DeptBarChart({ people }: { people: Person[] }) {
  const data = DEPARTMENTS.map(d => ({
    dept: d.slice(0,4).toUpperCase(), fullDept: d,
    filled: people.filter(p => p.department === d && p.status !== "open").length,
    open:   people.filter(p => p.department === d && p.status === "open").length,
    color:  DEPT_COLORS[d],
  })).filter(d => d.filled + d.open > 0).sort((a,b) => (b.filled+b.open)-(a.filled+a.open));

  return (
    <div style={{ padding:"18px 20px 12px" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:14 }}>Headcount by Dept</div>
      <ResponsiveContainer width="100%" height={172}>
        <BarChart data={data} layout="vertical" margin={{ top:0, right:28, bottom:0, left:4 }}>
          <XAxis type="number" hide domain={[0,"dataMax"]}/>
          <YAxis type="category" dataKey="dept" tick={{ fontFamily:"var(--mono)", fontSize:9, fill:"var(--text-4)" }} width={32} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={ttStyle} labelStyle={{ color:"var(--text-2)" }} itemStyle={{ color:"var(--text-3)" }} formatter={(val, name) => [val, name === "filled" ? "Filled" : "Open"]}/>
          <Bar dataKey="filled" stackId="a" radius={0}>
            {data.map((e, i) => <Cell key={i} fill={e.color}/>)}
          </Bar>
          <Bar dataKey="open" stackId="a" radius={[0,3,3,0]}>
            {data.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.22}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Chart: Level × Dept Heatmap ───────────────────────────────────────────
function LevelHeatmap({ people }: { people: Person[] }) {
  const active = people.filter(p => p.status !== "open");
  const cells = LEVELS.map(l => DEPARTMENTS.map(d => active.filter(p => p.level === l && p.department === d).length));
  const globalMax = Math.max(1, ...cells.flat());
  const CW = 28, CH = 18, LW = 56;

  return (
    <div style={{ padding:"18px 20px 12px" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:14 }}>Level × Dept Matrix</div>
      <div style={{ overflowX:"auto" }}>
        <svg width={LW + DEPARTMENTS.length * CW + 4} height={24 + LEVELS.length * CH} style={{ display:"block" }}>
          {/* Dept column headers */}
          {DEPARTMENTS.map((d, j) => (
            <text key={d} x={LW + j*CW + CW/2} y={12} textAnchor="middle" style={{ fontFamily:"var(--mono)", fontSize:7.5, fill:"rgba(167,182,194,0.6)", textTransform:"uppercase" }}>
              {d.slice(0,3)}
            </text>
          ))}
          {/* Level rows */}
          {LEVELS.map((l, i) => (
            <g key={l}>
              <text x={LW - 5} y={24 + i*CH + CH/2 + 3} textAnchor="end" style={{ fontFamily:"var(--mono)", fontSize:8, fill:"var(--text-4)" }}>{l}</text>
              {DEPARTMENTS.map((d, j) => {
                const count = cells[i][j];
                const intensity = count === 0 ? 0 : 0.14 + (count/globalMax) * 0.78;
                return (
                  <g key={d}>
                    <rect x={LW + j*CW + 1} y={24 + i*CH + 1} width={CW-2} height={CH-2} rx={2}
                      fill={DEPT_COLORS[d]} fillOpacity={count === 0 ? 0.04 : intensity}/>
                    {count > 0 && (
                      <text x={LW + j*CW + CW/2} y={24 + i*CH + CH/2 + 3} textAnchor="middle"
                        style={{ fontFamily:"var(--mono)", fontSize:8, fill: intensity > 0.5 ? DEPT_COLORS[d] : "rgba(167,182,194,0.7)" }}>
                        {count}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 12px", marginTop:12 }}>
        {DEPARTMENTS.map(d => (
          <span key={d} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"var(--mono)", fontSize:8, color:"var(--text-4)", textTransform:"uppercase" }}>
            <span style={{ width:7, height:7, borderRadius:1, background:DEPT_COLORS[d], flexShrink:0, opacity:0.7 }}/>{d.slice(0,3)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Chart: Status Donut ───────────────────────────────────────────────────
function StatusRing({ people }: { people: Person[] }) {
  const segments = [
    { label:"Active",     count:people.filter(p=>p.status==="active").length,     color:"#3DCC91" },
    { label:"Contractor", count:people.filter(p=>p.status==="contractor").length,  color:"#A78BFA" },
    { label:"On Leave",   count:people.filter(p=>p.status==="onleave").length,     color:"#FFC940" },
    { label:"Open Role",  count:people.filter(p=>p.status==="open").length,        color:"rgba(246,247,248,0.3)" },
  ].filter(s => s.count > 0);
  const total = segments.reduce((s,x) => s+x.count, 0);
  const headcount = people.filter(p=>p.status!=="open").length;
  const fillRate = total ? Math.round(headcount/total*100) : 0;

  return (
    <div style={{ padding:"18px 20px 12px" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:14 }}>Team Composition</div>
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ position:"relative", width:140, height:140, flexShrink:0 }}>
          <PieChart width={140} height={140}>
            <Pie data={segments} cx={70} cy={70} innerRadius={46} outerRadius={66}
              paddingAngle={2} dataKey="count" startAngle={90} endAngle={-270} strokeWidth={0}>
              {segments.map((_, i) => <Cell key={i} fill={segments[i].color}/>)}
            </Pie>
          </PieChart>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
            <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:30, lineHeight:1, color:"var(--text)", fontVariantNumeric:"tabular-nums" }}>{headcount}</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:3 }}>FTE</div>
          </div>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:9 }}>
          {segments.map(s => (
            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
              <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-2)", flex:1 }}>{s.label}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)", minWidth:20, textAlign:"right" }}>{s.count}</span>
            </div>
          ))}
          <div style={{ marginTop:4, paddingTop:8, borderTop:"1px solid var(--line)" }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", display:"flex", justifyContent:"space-between" }}>
              <span>Fill rate</span>
              <span style={{ color:"#3DCC91", fontWeight:500 }}>{fillRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chart: Headcount Trend ────────────────────────────────────────────────
function HeadcountSpark({ people }: { people: Person[] }) {
  const data = computeTimeline(people);
  if (data.length < 3) return null;
  const first = data[0].n, last = data[data.length-1].n;
  const delta = last - first;

  return (
    <div style={{ padding:"14px 20px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", gap:24 }}>
      <div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:4 }}>Growth Trend</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
          <span style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:28, color:"var(--text)", lineHeight:1 }}>{last}</span>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"#3DCC91" }}>+{delta} since {data[0].label}</span>
        </div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <ResponsiveContainer width="100%" height={52}>
          <AreaChart data={data} margin={{ top:4, right:4, bottom:0, left:4 }}>
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D72D2" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#2D72D2" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="n" stroke="#2D72D2" strokeWidth={1.5} fill="url(#sparkFill)" dot={false} activeDot={{ r:3, fill:"#2D72D2", stroke:"var(--bg)", strokeWidth:1.5 }}/>
            <XAxis dataKey="label" hide/>
            <YAxis hide domain={[0,"dataMax+2"]}/>
            <Tooltip contentStyle={ttStyle} labelStyle={{ color:"var(--text-2)", marginBottom:2 }} itemStyle={{ color:"#2D72D2" }} formatter={(v) => [v, "Headcount"]}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Chart: Location Distribution ──────────────────────────────────────────
function LocationChart({ people }: { people: Person[] }) {
  const locs: Record<string, number> = {};
  people.filter(p => p.status !== "open" && p.location).forEach(p => { locs[p.location] = (locs[p.location]||0)+1; });
  const locData = Object.entries(locs).sort((a,b) => b[1]-a[1]).slice(0,8);
  if (!locData.length) return null;
  const maxCount = locData[0][1];

  return (
    <div style={{ padding:"18px 20px 12px" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", marginBottom:14 }}>Top Locations</div>
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {locData.map(([loc, count]) => (
          <div key={loc} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ opacity:0.4, flexShrink:0 }}>{Icon.globe}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-2)", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{loc}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-3)", minWidth:18, textAlign:"right" }}>{count}</span>
            <div style={{ width:50, height:3, borderRadius:2, background:"var(--surface-3)", flexShrink:0 }}>
              <div style={{ width:`${(count/maxCount)*100}%`, height:"100%", background:"var(--accent)", borderRadius:2 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function HumanCapitalMgmt() {
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
  const [rosterView, setRosterView] = useState<"table"|"roster">("table");

  useEffect(() => { lsSave(people); }, [people]);
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const headcount  = people.filter(p => p.status !== "open").length;
  const openRoles  = people.filter(p => p.status === "open").length;
  const contractors = people.filter(p => p.status === "contractor").length;
  const onLeave    = people.filter(p => p.status === "onleave").length;
  const fillRate   = (headcount + openRoles) > 0 ? Math.round((headcount / (headcount + openRoles)) * 100) : 0;

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
          <div style={navActive}><span>{Icon.list}</span>Dashboard</div>
          <Link href="/humancapitalmgmt/orgchart" style={{ textDecoration:"none" }}>
            <div style={navItem}><span style={{ opacity:0.65 }}>{Icon.org}</span>Org Chart</div>
          </Link>
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
            <div>HCM · Sprint 18</div>
            <div style={{ marginTop:4, fontVariantNumeric:"tabular-nums" }}>{clock}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* Sticky Header */}
        <div style={{ borderBottom:"1px solid var(--line)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg)", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:4 }}>People Operations</div>
            <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
              Human Capital <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>Management</em>
            </h1>
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            {[
              { label:"Headcount",  value:headcount,   color:"var(--text)" },
              { label:"Open Roles", value:openRoles,   color:"#FFC940"     },
              { label:"Fill Rate",  value:`${fillRate}%`, color:"#3DCC91"  },
              { label:"Contractors",value:contractors, color:"#A78BFA"     },
              { label:"On Leave",   value:onLeave,     color:"#FB923C"     },
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

        {/* Visualization strip — 4 panels */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", borderBottom:"1px solid var(--line)" }}>
          <DeptBarChart people={people}/>
          <div style={{ borderLeft:"1px solid var(--line)" }}><LevelHeatmap people={people}/></div>
          <div style={{ borderLeft:"1px solid var(--line)" }}><StatusRing people={people}/></div>
          <div style={{ borderLeft:"1px solid var(--line)" }}><LocationChart people={people}/></div>
        </div>

        {/* Trend sparkline */}
        <HeadcountSpark people={people}/>

        {/* Directory */}
        <div style={{ flex:1, padding:"20px 32px 40px" }}>
          {/* View toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)" }}>Directory</div>
            <div style={{ display:"flex", gap:2, background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:6, padding:2 }}>
              {(["table","roster"] as const).map(v => (
                <button key={v} onClick={() => setRosterView(v)} style={{ padding:"5px 14px", borderRadius:4, border:0, fontSize:11, fontFamily:"var(--mono)", letterSpacing:"0.07em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s", background:rosterView===v?"var(--surface-3)":"transparent", color:rosterView===v?"var(--text)":"var(--text-4)", fontWeight:rosterView===v?500:400 }}>
                  {v === "table" ? "Table" : "Roster"}
                </button>
              ))}
            </div>
          </div>
          {rosterView === "table" ? (
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
          ) : (
            <DeptRosterView
              people={people} setPeople={setPeople}
              deptFilter={deptFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              search={search} setSearch={setSearch}
              onSelect={setSelected} onAdd={() => openAdd(null)}
            />
          )}
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
      {/* Toolbar row 1: search + export + add */}
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

      {/* Toolbar row 2: status chips */}
      <div style={{ display:"flex", gap:6, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
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

      {/* Table */}
      <div style={{ background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:10, overflow:"hidden" }}>
        {/* Header */}
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

        {/* Rows */}
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
              {/* Name */}
              <div style={{ flex:2, display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:isOpen?"var(--surface-3)":`${dc}25`, color:isOpen?"var(--text-4)":dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0, border:isOpen?"1.5px dashed var(--line-strong)":"none" }}>
                  {isOpen?"?":initials(p.name)}
                </div>
                <span style={{ fontSize:13, fontWeight:isOpen?400:500, color:isOpen?"var(--text-3)":"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {isOpen?<em style={{ fontStyle:"italic" }}>Open Role</em>:p.name}
                </span>
              </div>
              {/* Role */}
              <div style={{ flex:2.5, fontSize:12.5, color:"var(--text-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.role}</div>
              {/* Dept */}
              <div style={{ flex:1 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4, background:`${dc}18`, border:`1px solid ${dc}35`, fontFamily:"var(--mono)", fontSize:9, color:dc, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:dc }}/>{p.department.slice(0,4)}
                </span>
              </div>
              {/* Level */}
              <div style={{ flex:0.6, fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{p.level}</div>
              {/* Status */}
              <div style={{ flex:1 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:99, background:sm.bg, fontFamily:"var(--mono)", fontSize:9, color:sm.color, letterSpacing:"0.05em" }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:sm.color }}/>{sm.label}
                </span>
              </div>
              {/* Manager */}
              <div style={{ flex:1.5, fontSize:12, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{mgr?.name??"—"}</div>
              {/* Location */}
              <div style={{ flex:1.2, fontSize:11.5, color:"var(--text-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.location||"—"}</div>
              {/* Tenure */}
              <div style={{ flex:0.7, fontFamily:"var(--mono)", fontSize:11, color:isOpen?"var(--text-4)":"var(--text-3)" }}>{tenureStr}</div>
              {/* Started */}
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
// Dept Roster View (kanban-style, drag-and-drop between departments)
// ═══════════════════════════════════════════════════════════════════════════
function DeptRosterView({ people, setPeople, deptFilter, statusFilter, setStatusFilter, search, setSearch, onSelect, onAdd }: {
  people: Person[]; setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  deptFilter: Department|"all"; statusFilter: Status|"all"; setStatusFilter:(s:Status|"all")=>void;
  search: string; setSearch:(s:string)=>void;
  onSelect:(p:Person)=>void; onAdd:()=>void;
}) {
  const [draggedId, setDraggedId] = useState<string|null>(null);
  const [dropDept, setDropDept] = useState<Department|null>(null);

  const depts = deptFilter === "all" ? DEPARTMENTS : [deptFilter as Department];

  const filtered = people
    .filter(p => deptFilter === "all" || p.department === deptFilter)
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => !search || [p.name,p.role,p.email,p.location].some(f => f.toLowerCase().includes(search.toLowerCase())));

  function changeDept(id: string, dept: Department) {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, department:dept, color:DEPT_COLORS[dept] } : p));
  }

  const statusCounts = (["active","contractor","onleave","open"] as Status[]).map(s => ({
    key:s, ...STATUS_META[s], count:people.filter(p=>p.status===s&&(deptFilter==="all"||p.department===deptFilter)).length
  }));

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:10, alignItems:"center" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", opacity:0.4 }}>{Icon.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, role, location…"
            style={{ width:"100%", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:6, padding:"8px 12px 8px 30px", color:"var(--text)", fontSize:13, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", whiteSpace:"nowrap" }}>{filtered.length} records</div>
        <button onClick={onAdd} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--accent)", color:"#fff", border:0, borderRadius:6, fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--sans)" }}>
          {Icon.plus} Add Person
        </button>
      </div>
      {/* Status chips */}
      <div style={{ display:"flex", gap:6, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={() => setStatusFilter("all")} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, border:"1px solid", fontSize:11, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s", background:statusFilter==="all"?"var(--surface-2)":"transparent", borderColor:statusFilter==="all"?"var(--text-3)":"var(--line)", color:statusFilter==="all"?"var(--text)":"var(--text-4)" }}>
          All · {people.filter(p=>deptFilter==="all"||p.department===deptFilter).length}
        </button>
        {statusCounts.map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, border:"1px solid", fontSize:11, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s", background:statusFilter===s.key?s.bg:"transparent", borderColor:statusFilter===s.key?s.color:"var(--line)", color:statusFilter===s.key?s.color:"var(--text-4)" }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
            {s.label} · {s.count}
          </button>
        ))}
        <div style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Drag cards to reassign department</div>
      </div>

      {/* Department lanes */}
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {depts.map(dept => {
          const dc = DEPT_COLORS[dept];
          const deptFiltered = filtered.filter(p => p.department === dept);
          const allInDept = people.filter(p => p.department === dept);
          const filled = allInDept.filter(p => p.status !== "open").length;
          const fillPct = allInDept.length ? (filled/allInDept.length)*100 : 0;
          const isDrop = dropDept === dept;
          if (!deptFiltered.length && !isDrop) return null;

          return (
            <div key={dept} style={{ marginBottom:1, borderRadius:10, overflow:"hidden", border:`1px solid ${isDrop ? dc : "var(--line)"}`, transition:"border-color 0.15s" }}
              onDragOver={e => { e.preventDefault(); setDropDept(dept); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropDept(null); }}
              onDrop={e => {
                e.preventDefault(); setDropDept(null);
                if (draggedId) changeDept(draggedId, dept);
                setDraggedId(null);
              }}>
              {/* Dept header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px", background:isDrop?`${dc}10`:"var(--surface-1)", borderBottom:`1px solid ${isDrop?dc:"var(--line)"}`, transition:"all 0.15s" }}>
                <span style={{ width:8, height:8, borderRadius:2, background:dc, flexShrink:0 }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.14em", color:dc, flex:1, fontWeight:500 }}>{dept}</span>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:80, height:3, borderRadius:2, background:"var(--surface-3)" }}>
                    <div style={{ width:`${fillPct}%`, height:"100%", background:dc, borderRadius:2, transition:"width 0.3s" }}/>
                  </div>
                  <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", minWidth:42, textAlign:"right" }}>{filled}/{allInDept.length}</span>
                  {isDrop && (
                    <span style={{ fontFamily:"var(--mono)", fontSize:9, color:dc, letterSpacing:"0.08em", paddingLeft:8, borderLeft:`1px solid ${dc}40` }}>Drop to move</span>
                  )}
                </div>
              </div>

              {/* Person cards grid */}
              {deptFiltered.length > 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:1, background:"var(--line)" }}>
                  {deptFiltered.map(p => (
                    <PersonCard key={p.id} person={p} deptColor={dc}
                      isDragging={draggedId === p.id}
                      onDragStart={() => setDraggedId(p.id)}
                      onDragEnd={() => { setDraggedId(null); setDropDept(null); }}
                      onSelect={() => onSelect(p)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ padding:"24px", textAlign:"center", fontFamily:"var(--mono)", fontSize:10, color:dc, textTransform:"uppercase", letterSpacing:"0.12em", opacity:0.6, background:"var(--bg)" }}>
                  Drop here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PersonCard({ person: p, deptColor: dc, isDragging, onDragStart, onDragEnd, onSelect }: {
  person: Person; deptColor: string; isDragging: boolean;
  onDragStart:()=>void; onDragEnd:()=>void; onSelect:()=>void;
}) {
  const [hov, setHov] = useState(false);
  const sm = STATUS_META[p.status];
  const isOpen = p.status === "open";
  const tenureStr = isOpen ? null : formatTenure(parseTenureMonths(p.startDate));

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onSelect}
      style={{ display:"flex", flexDirection:"column", padding:"14px 16px", background:hov?"var(--surface-2)":isDragging?"var(--surface-3)":"var(--bg)", cursor:isDragging?"grabbing":"pointer", opacity:isDragging?0.45:1, transition:"background 0.12s, opacity 0.15s", borderLeft:`3px solid ${hov?dc:"transparent"}`, position:"relative" }}>
      {/* Drag handle */}
      <div style={{ position:"absolute", top:10, right:10, display:"flex", gap:2.5, opacity:hov?0.35:0, transition:"opacity 0.15s", cursor:"grab" }}>
        {[0,1].map(c => <div key={c} style={{ display:"flex", flexDirection:"column", gap:2 }}>{[0,1,2].map(r => <div key={r} style={{ width:2, height:2, borderRadius:"50%", background:"var(--text-3)" }}/>)}</div>)}
      </div>
      {/* Top row: avatar + name + status */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:isOpen?"var(--surface-3)":`${dc}25`, color:isOpen?"var(--text-4)":dc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, fontFamily:"var(--mono)", flexShrink:0, border:isOpen?"1.5px dashed var(--line-strong)":"none" }}>
          {isOpen?"?":initials(p.name)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:isOpen?400:500, color:isOpen?"var(--text-3)":"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.3 }}>
            {isOpen?<em style={{ fontStyle:"italic" }}>Open Role</em>:p.name}
          </div>
          <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.role}</div>
        </div>
        <span style={{ width:6, height:6, borderRadius:"50%", background:sm.color, flexShrink:0, marginTop:5 }}/>
      </div>
      {/* Bottom row: level + status + tenure */}
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        <span style={{ display:"inline-flex", padding:"2px 7px", borderRadius:3, background:`${dc}18`, border:`1px solid ${dc}35`, fontFamily:"var(--mono)", fontSize:9, color:dc, textTransform:"uppercase", letterSpacing:"0.07em" }}>{p.level}</span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 7px", borderRadius:99, background:sm.bg, fontFamily:"var(--mono)", fontSize:9, color:sm.color, letterSpacing:"0.05em" }}>
          <span style={{ width:4, height:4, borderRadius:"50%", background:sm.color }}/>{sm.label}
        </span>
        {tenureStr && <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", marginLeft:"auto" }}>{tenureStr}</span>}
        {p.location && <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>{p.location}</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Person Drawer
// ═══════════════════════════════════════════════════════════════════════════
function PersonDrawer({ person, isEditing, confirmDelete, people, onClose, onEdit, onChange, onSave, onCancel, onDelete, onConfirmDelete, onCancelDelete, onAddDirectReport }: {
  person: Person; isEditing: boolean; confirmDelete: boolean; people: Person[];
  onClose:()=>void; onEdit:()=>void; onChange:(p:Person)=>void; onSave:()=>void;
  onCancel:()=>void; onDelete:()=>void; onConfirmDelete:()=>void; onCancelDelete:()=>void;
  onAddDirectReport:()=>void;
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
      <input type={type} value={String(person[key]??"")} onChange={e => onChange({...person,[key]:e.target.value})}
        style={{ width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box" as const }}/>
    </div>
  );
  const sel = (label: string, key: keyof Person, opts: string[]) => (
    <div key={key}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{label}</div>
      <select value={String(person[key]??"")} onChange={e => { const val=e.target.value; const u:Partial<Person>={[key]:val}; if(key==="department") u.color=DEPT_COLORS[val as Department]; onChange({...person,...u}); }}
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
  person: Person; onChange:(p:Person)=>void; onSave:()=>void;
  onClose:()=>void; people:Person[]; managerId:string|null;
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
