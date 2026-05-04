"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
type Status     = "active" | "onleave" | "contractor" | "open";
type Department = "Executive" | "Engineering" | "Clinical" | "Operations" | "Design" | "Finance" | "Regulatory";
type Level      = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
type EmployeeType = "w2_full" | "w2_part" | "1099" | "intern" | "international";
type DocStatus  = "pending" | "submitted" | "verified";

interface Person {
  id: string; name: string; role: string; department: Department;
  level: Level; email: string; status: Status; startDate: string;
  color: string; location: string; managerId: string | null;
}
interface OnboardingProfile {
  id: string; personId: string; employmentType: EmployeeType;
  createdAt: string; stepProgress: Record<string, boolean>;
  documents: ProfileDoc[];
}
interface ProfileDoc {
  name: string; required: boolean; category: string; deadline: string;
  status: DocStatus; uploadedAt?: string; fileName?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const DEPT_COLORS: Record<Department, string> = {
  Executive:"#2D72D2", Engineering:"#00B4D8", Clinical:"#3DCC91",
  Operations:"#FB923C", Design:"#A78BFA", Finance:"#FFC940", Regulatory:"#F59E0B",
};
const STATUS_META: Record<Status, { color:string; label:string }> = {
  active:     { color:"#3DCC91", label:"Active"      },
  onleave:    { color:"#FFC940", label:"On Leave"    },
  contractor: { color:"#A78BFA", label:"Contractor"  },
  open:       { color:"rgba(246,247,248,0.38)", label:"Open Role" },
};
const LEVEL_BAND: Record<Level, string> = {
  L1:"Associate", L2:"Junior", L3:"Mid-Level", L4:"Senior", L5:"Staff", L6:"Director", L7:"Executive",
};
const EMP_META: Record<EmployeeType, { label:string; color:string; bg:string }> = {
  w2_full:       { label:"W-2 Full-Time",   color:"#3DCC91", bg:"rgba(61,204,145,0.12)"   },
  w2_part:       { label:"W-2 Part-Time",   color:"#00B4D8", bg:"rgba(0,180,216,0.12)"    },
  "1099":        { label:"1099 Contractor", color:"#A78BFA", bg:"rgba(167,139,250,0.12)"  },
  intern:        { label:"Intern",          color:"#FFC940", bg:"rgba(255,201,64,0.12)"   },
  international: { label:"International",  color:"#F59E0B", bg:"rgba(245,158,11,0.12)"   },
};
const DOC_STATUS_META: Record<DocStatus, { color:string; label:string; bg:string }> = {
  pending:   { color:"var(--text-4)",  label:"Pending",   bg:"var(--surface-2)"              },
  submitted: { color:"#2D72D2",        label:"Submitted", bg:"rgba(45,114,210,0.12)"         },
  verified:  { color:"#3DCC91",        label:"Verified",  bg:"rgba(61,204,145,0.12)"         },
};

const PHASES = [
  { phase:"Pre-Offer", color:"#A78BFA", steps:[
    { title:"Background Check", desc:"Initiate criminal, employment, and education verification.", offset:"Day −14" },
    { title:"Reference Verification", desc:"Confirm 2–3 professional references.", offset:"Day −12" },
    { title:"Compensation Benchmarking", desc:"Run comp model against level, department, and market data.", offset:"Day −10" },
    { title:"Equity Pool Allocation", desc:"Reserve option pool shares or RSU grant with Finance & Legal.", offset:"Day −8" },
  ]},
  { phase:"Offer & Acceptance", color:"#2D72D2", steps:[
    { title:"Generate Offer Letter", desc:"Issue signed offer letter with title, base salary, and start date.", offset:"Day −7" },
    { title:"Compensation Package Disclosure", desc:"Share full comp summary: base, bonus, equity, signing, benefits.", offset:"Day −7" },
    { title:"Equity Term Sheet", desc:"Disclose option type, strike price, and vesting schedule.", offset:"Day −7" },
    { title:"Countersigned Acceptance", desc:"Obtain candidate signature. Trigger HR and IT provisioning.", offset:"Day −3" },
  ]},
  { phase:"Pre-Day 1 — Admin", color:"#00B4D8", steps:[
    { title:"Collect Core Documents", desc:"Request I-9 supporting docs, W-4, state withholding, direct deposit.", offset:"Day −3" },
    { title:"NDA & IP Assignment", desc:"Send and collect Confidentiality Agreement and PIIA.", offset:"Day −3" },
    { title:"Benefits Enrollment Packet", desc:"Initiate enrollment in HRIS: medical, dental, vision, 401(k).", offset:"Day −2" },
    { title:"Provision System Access", desc:"Create accounts: Google Workspace, Slack, GitHub, Jira.", offset:"Day −1" },
    { title:"Ship Equipment", desc:"Provision laptop, peripherals, and security key.", offset:"Day −1" },
    { title:"Send Day 1 Welcome Package", desc:"Email with schedule, buddy name, Slack handle, and agenda.", offset:"Day −1" },
  ]},
  { phase:"Week 1 — Orientation", color:"#3DCC91", steps:[
    { title:"Complete I-9 Verification", desc:"HR reviews and signs off on I-9 within 3 business days.", offset:"Day 1" },
    { title:"HR Policy Orientation", desc:"Review Handbook, PTO policy, code of conduct.", offset:"Day 1" },
    { title:"Security & Compliance Training", desc:"Complete HIPAA (if Clinical), SOC2 awareness, phishing sim.", offset:"Day 2" },
    { title:"Meet Manager — Set 30/60/90 Goals", desc:"Align on role expectations and success metrics.", offset:"Day 3" },
    { title:"Team & Stakeholder Introductions", desc:"Facilitate introductions across cross-functional partners.", offset:"Day 3" },
    { title:"Role-Specific Tool Training", desc:"Assign onboarding tasks in Jira, schedule technical ramp.", offset:"Day 4" },
  ]},
  { phase:"30 / 60 / 90-Day Reviews", color:"#FFC940", steps:[
    { title:"30-Day Check-In", desc:"Manager meets new hire to review acclimation and blockers.", offset:"Day 30" },
    { title:"60-Day Performance Pulse", desc:"Mid-point review of goal progress and benefits completion.", offset:"Day 60" },
    { title:"90-Day Formal Review", desc:"Formal evaluation against 30/60/90 plan. Confirm permanent status.", offset:"Day 90" },
    { title:"Equity Grant Execution", desc:"Legal executes option agreement or RSU grant.", offset:"Day 90" },
  ]},
];

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  list:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="2.5" width="13" height="2" rx=".5"/><rect x="1.5" y="7" width="13" height="2" rx=".5"/><rect x="1.5" y="11.5" width="13" height="2" rx=".5"/></svg>,
  org:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".75"/><rect x="1" y="11" width="4" height="3" rx=".75"/><rect x="6" y="11" width="4" height="3" rx=".75"/><rect x="11" y="11" width="4" height="3" rx=".75"/><path d="M8 4.5v3M3 11V9h10V8" strokeLinecap="round"/></svg>,
  steps:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8h4v6H2zM6 5h4v9H6zM10 2h4v12h-4z" strokeLinejoin="round"/></svg>,
  doc:    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 1.5h5.5L12 4v10.5H4V1.5z" strokeLinejoin="round"/><path d="M9.5 1.5V4H12" strokeLinejoin="round"/><path d="M6 7h4M6 9.5h4M6 12h2"/></svg>,
  person: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="2.8"/><path d="M2 13.5c0-2.8 2.7-5 6-5s6 2.2 6 5" strokeLinecap="round"/></svg>,
  back:   <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 11V3M5 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" strokeLinecap="round"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11.5 2.5l2 2-8 8H3.5V11l8-8.5z" strokeLinejoin="round"/></svg>,
  email:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M1.5 5l6.5 4.5L14.5 5"/></svg>,
  pin:    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 1.5a4 4 0 014 4c0 3-4 9-4 9S4 8.5 4 5.5a4 4 0 014-4z" strokeLinejoin="round"/><circle cx="8" cy="5.5" r="1.5"/></svg>,
};

function initials(n: string): string {
  if (!n) return "?";
  const pts = n.split(" ").filter(Boolean);
  return pts.length === 1 ? pts[0][0].toUpperCase() : (pts[0][0] + pts[pts.length-1][0]).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function EmployeeDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [person,  setPerson]  = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [docFilter, setDocFilter] = useState<"all" | DocStatus>("all");
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    const profiles: OnboardingProfile[] = JSON.parse(localStorage.getItem("hcm_onboarding_v1") || "[]");
    const people:   Person[]            = JSON.parse(localStorage.getItem("hcm_people_v2")      || "[]");
    const p  = profiles.find(p => p.id === id) || null;
    const pe = p ? (people.find(pe => pe.id === p.personId) || null) : null;
    setProfile(p);
    setPerson(pe);
    setLoading(false);
    if (p) {
      const init: Record<string, boolean> = {};
      PHASES.forEach((ph, i) => { init[ph.phase] = i === 0; });
      setExpanded(init);
    }
  }, [id]);

  function saveProfile(next: OnboardingProfile) {
    setProfile(next);
    const profiles: OnboardingProfile[] = JSON.parse(localStorage.getItem("hcm_onboarding_v1") || "[]");
    localStorage.setItem("hcm_onboarding_v1", JSON.stringify(profiles.map(p => p.id === id ? next : p)));
  }

  function toggleStep(key: string) {
    if (!profile) return;
    saveProfile({ ...profile, stepProgress: { ...profile.stepProgress, [key]: !profile.stepProgress[key] } });
  }

  function updateDoc(name: string, status: DocStatus, fileName?: string) {
    if (!profile) return;
    const documents = profile.documents.map(d =>
      d.name === name
        ? { ...d, status, fileName: fileName ?? d.fileName, uploadedAt: status !== "pending" ? new Date().toISOString() : undefined }
        : d
    );
    saveProfile({ ...profile, documents });
  }

  // ── Sidebar nav styles ────────────────────────────────────────────────
  const navLabel:  React.CSSProperties = { fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", padding:"0 8px", marginBottom:8 };
  const navBase:   React.CSSProperties = { display:"flex", alignItems:"center", gap:10, padding:"7px 8px 7px 10px", fontSize:13, color:"var(--text-2)", borderRadius:4, cursor:"pointer", textDecoration:"none" };

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:"var(--bg)", color:"var(--text-4)", fontFamily:"var(--mono)", fontSize:11 }}>
      Loading profile…
    </div>
  );

  if (!profile || !person) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background:"var(--bg)", flexDirection:"column", gap:16 }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Profile not found</div>
      <Link href="/humancapitalmgmt/onboarding" style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--accent)", textDecoration:"none" }}>← Back to Onboarding</Link>
    </div>
  );

  const dc         = DEPT_COLORS[person.department] || "#2D72D2";
  const sm         = STATUS_META[person.status];
  const em         = EMP_META[profile.employmentType];
  const totalSteps = PHASES.reduce((s, ph) => s + ph.steps.length, 0);
  const doneSteps  = Object.values(profile.stepProgress).filter(Boolean).length;
  const stepPct    = totalSteps > 0 ? Math.round(doneSteps / totalSteps * 100) : 0;
  const totalDocs  = profile.documents.length;
  const submittedDocs = profile.documents.filter(d => d.status !== "pending").length;
  const verifiedDocs  = profile.documents.filter(d => d.status === "verified").length;
  const daysSince  = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000);

  const nextStep = (() => {
    for (const ph of PHASES) {
      for (let i = 0; i < ph.steps.length; i++) {
        if (!profile.stepProgress[`${ph.phase}-${i}`]) return ph.steps[i].title;
      }
    }
    return "All complete!";
  })();

  const filteredDocs = profile.documents.filter(d => docFilter === "all" || d.status === docFilter);

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
          <Link href="/humancapitalmgmt/payroll" style={{ textDecoration:"none" }}>
            <div style={navBase as React.CSSProperties}><span style={{ opacity:0.65 }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 14C4.7 14 2.5 12 2.5 9c0-2.5 2-4 2-6 1 1.5 1.5 2 2.5 2.5C7 3.5 7 2 8 1c0 3 3.5 3.5 3.5 6.5C11.5 11.5 10.5 14 8 14z" strokeLinejoin="round"/></svg></span>Payroll & Burn</div>
          </Link>
        </div>
        <div>
          <div style={navLabel}>Employee</div>
          <div style={{ ...navBase, background:"var(--surface-2)", color:"var(--text)", fontWeight:500 } as React.CSSProperties}>
            <span>{Icon.person}</span>{person.name.split(" ")[0]}
          </div>
        </div>
        {/* Progress summary */}
        <div style={{ marginTop:"auto" }}>
          <div style={{ padding:"14px", background:"var(--surface-1)", borderRadius:8, border:"1px solid var(--line)" }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:10 }}>Profile Progress</div>
            <MiniBar label="Steps" value={doneSteps} total={totalSteps} color="#3DCC91"/>
            <div style={{ marginTop:8 }}>
              <MiniBar label="Docs" value={submittedDocs} total={totalDocs} color="#2D72D2"/>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* Sticky header */}
        <div style={{ borderBottom:"1px solid var(--line)", padding:"14px 32px 16px", position:"sticky", top:0, zIndex:10, background:"var(--bg)" }}>
          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>
            <Link href="/humancapitalmgmt" style={{ color:"var(--text-4)", textDecoration:"none" }}>HCM</Link>
            <span>/</span>
            <Link href="/humancapitalmgmt/onboarding" style={{ color:"var(--text-4)", textDecoration:"none" }}>Onboarding</Link>
            <span>/</span>
            <span style={{ color:"var(--text-2)" }}>{person.name}</span>
          </div>
          {/* Employee row */}
          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
            <div style={{ width:44, height:44, borderRadius:11, background:`${dc}22`, border:`2px solid ${dc}60`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:15, color:dc, fontWeight:700, flexShrink:0 }}>
              {initials(person.name)}
            </div>
            <div>
              <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:24, letterSpacing:"-0.02em", lineHeight:1 }}>{person.name}</div>
              <div style={{ fontSize:13, color:"var(--text-3)", marginTop:3 }}>{person.role}</div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginLeft:4 }}>
              <Badge color={dc} bg={`${dc}18`}>{person.department}</Badge>
              <Badge color="var(--text-3)" bg="var(--surface-2)">{person.level} · {LEVEL_BAND[person.level]}</Badge>
              <Badge color={sm.color} bg={`${sm.color}18`}>{sm.label}</Badge>
              <Badge color={em.color} bg={em.bg}>{em.label}</Badge>
            </div>
          </div>
        </div>

        <div style={{ flex:1, padding:"28px 32px 56px", minWidth:0 }}>
          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:28 }}>
            <StatCard label="Onboarding Progress" main={`${stepPct}%`} sub={`${doneSteps} / ${totalSteps} steps`} color="#3DCC91"/>
            <StatCard label="Documents" main={`${submittedDocs}/${totalDocs}`} sub={`${verifiedDocs} verified`} color="#2D72D2"/>
            <StatCard label="Days Active" main={String(daysSince)} sub="since created" color="#A78BFA"/>
            <StatCard label="Next Step" main="" sub={nextStep} color="#FFC940" small/>
          </div>

          {/* 2-column layout */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 440px", gap:20, alignItems:"start" }}>
            {/* Left: Onboarding checklist */}
            <div>
              <SectionHeader title="Onboarding Checklist" sub={`${doneSteps} of ${totalSteps} steps complete`} color="#3DCC91" pct={stepPct}/>
              <div style={{ position:"relative", marginTop:8 }}>
                <div style={{ position:"absolute", left:19, top:0, bottom:0, width:2, background:"var(--line)" }}/>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {PHASES.map((ph) => {
                    const isOpen = expanded[ph.phase] !== false;
                    const phDone = ph.steps.filter((_, i) => profile.stepProgress[`${ph.phase}-${i}`]).length;
                    return (
                      <div key={ph.phase} style={{ position:"relative" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px 10px 14px", background:"var(--surface-1)", borderRadius:8, border:`1px solid var(--line)`, cursor:"pointer", position:"relative", zIndex:1 }}
                          onClick={() => setExpanded(prev => ({ ...prev, [ph.phase]: !isOpen }))}>
                          <div style={{ width:12, height:12, borderRadius:"50%", background:ph.color, flexShrink:0, boxShadow:`0 0 8px ${ph.color}60` }}/>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"var(--mono)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:ph.color, fontWeight:500 }}>{ph.phase}</div>
                          </div>
                          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:phDone===ph.steps.length?"#3DCC91":"var(--text-4)" }}>{phDone}/{ph.steps.length}</span>
                          <div style={{ color:"var(--text-4)", transition:"transform 0.2s", transform:isOpen?"rotate(90deg)":"none" }}>
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ marginLeft:40, marginTop:4, display:"flex", flexDirection:"column", gap:3 }}>
                            {ph.steps.map((step, sIdx) => {
                              const key   = `${ph.phase}-${sIdx}`;
                              const done  = !!profile.stepProgress[key];
                              return (
                                <div key={key}
                                  style={{ display:"flex", gap:12, padding:"11px 14px", background:done?"rgba(61,204,145,0.04)":"var(--bg)", borderRadius:6, border:`1px solid ${done?"rgba(61,204,145,0.2)":"var(--line)"}`, position:"relative", cursor:"pointer", transition:"all 0.15s" }}
                                  onClick={() => toggleStep(key)}>
                                  <div style={{ position:"absolute", left:-28, top:"50%", width:28, height:1, background:"var(--line-strong)", transform:"translateY(-0.5px)" }}/>
                                  {/* Checkbox */}
                                  <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:done?`${ph.color}20`:"transparent", border:`1.5px solid ${done?ph.color:"var(--line-strong)"}`, transition:"all 0.15s" }}>
                                    {done && <span style={{ color:ph.color }}>{Icon.check}</span>}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13, fontWeight:500, marginBottom:2, color:done?"var(--text-2)":"var(--text)", textDecoration:done?"line-through":"none", opacity:done?0.7:1 }}>{step.title}</div>
                                    <div style={{ fontSize:11.5, color:"var(--text-4)", lineHeight:1.5 }}>{step.desc}</div>
                                  </div>
                                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", whiteSpace:"nowrap", paddingTop:2 }}>{step.offset}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Documents + Info */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Employee info card */}
              <div style={{ padding:"16px 18px", background:"var(--surface-1)", borderRadius:10, border:"1px solid var(--line)" }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:14 }}>Employee Info</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {person.email && (
                    <InfoRow icon={Icon.email} label="Email" value={person.email}/>
                  )}
                  {person.location && (
                    <InfoRow icon={Icon.pin} label="Location" value={person.location}/>
                  )}
                  <InfoRow icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 1.5v7l4 2.5"/><circle cx="8" cy="8" r="6.5"/></svg>} label="Started" value={person.startDate || "TBD"}/>
                  <InfoRow icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8h4v6H2zM6 5h4v9H6zM10 2h4v12h-4z" strokeLinejoin="round"/></svg>} label="Level" value={`${person.level} · ${LEVEL_BAND[person.level]}`}/>
                </div>
              </div>

              {/* Documents panel */}
              <div style={{ padding:"16px 18px", background:"var(--surface-1)", borderRadius:10, border:"1px solid var(--line)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)" }}>Documents</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>
                    <span style={{ color:"#3DCC91" }}>{verifiedDocs}</span> verified · <span style={{ color:"#2D72D2" }}>{submittedDocs - verifiedDocs}</span> submitted · {totalDocs - submittedDocs} pending
                  </div>
                </div>

                {/* Filter */}
                <div style={{ display:"flex", gap:4, marginBottom:12, flexWrap:"wrap" }}>
                  {(["all","pending","submitted","verified"] as const).map(f => (
                    <button key={f} onClick={() => setDocFilter(f)}
                      style={{ padding:"3px 10px", borderRadius:99, border:"1px solid", fontSize:10, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s",
                        background:docFilter===f?"var(--surface-3)":"transparent",
                        borderColor:docFilter===f?"var(--text-3)":"var(--line)",
                        color:docFilter===f?"var(--text)":"var(--text-4)" }}>
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:480, overflowY:"auto" }}>
                  {filteredDocs.map(doc => (
                    <DocRow key={doc.name} doc={doc} onUpdate={updateDoc}/>
                  ))}
                  {filteredDocs.length === 0 && (
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", padding:"12px 0", textAlign:"center" }}>No documents match filter</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Badge({ color, bg, children }: { color:string; bg:string; children:React.ReactNode }) {
  return (
    <span style={{ display:"inline-flex", padding:"3px 9px", borderRadius:4, background:bg, border:`1px solid ${color}35`, fontFamily:"var(--mono)", fontSize:10, color, letterSpacing:"0.05em" }}>
      {children}
    </span>
  );
}

function StatCard({ label, main, sub, color, small }: { label:string; main:string; sub:string; color:string; small?:boolean }) {
  return (
    <div style={{ padding:"16px 18px", background:"var(--surface-1)", borderRadius:10, border:"1px solid var(--line)" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:8 }}>{label}</div>
      {main && <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:small?18:30, color, lineHeight:1, marginBottom:4 }}>{main}</div>}
      <div style={{ fontFamily:"var(--mono)", fontSize:11, color:small?color:"var(--text-3)" }}>{sub}</div>
    </div>
  );
}

function SectionHeader({ title, sub, color, pct }: { title:string; sub:string; color:string; pct:number }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:500, marginBottom:2 }}>{title}</div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{sub}</div>
      </div>
      <div style={{ width:36, height:36, position:"relative", flexShrink:0 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface-3)" strokeWidth="4"/>
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${pct * 0.879} 87.9`} strokeDashoffset="22" strokeLinecap="round" transform="rotate(-90 18 18)"/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:8, color }}>{pct}%</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon:React.ReactNode; label:string; value:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ color:"var(--text-4)", flexShrink:0 }}>{icon}</span>
      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", minWidth:52 }}>{label}</span>
      <span style={{ fontSize:12.5, color:"var(--text-2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</span>
    </div>
  );
}

function MiniBar({ label, value, total, color }: { label:string; value:number; total:number; color:string }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)" }}>
        <span>{label}</span><span style={{ color:pct===100?color:"var(--text-4)" }}>{value}/{total}</span>
      </div>
      <div style={{ height:2.5, background:"var(--surface-3)", borderRadius:2 }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2 }}/>
      </div>
    </div>
  );
}

function DocRow({ doc, onUpdate }: { doc:ProfileDoc; onUpdate:(name:string, status:DocStatus, fileName?:string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sm = DOC_STATUS_META[doc.status];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpdate(doc.name, "submitted", file.name);
    e.target.value = "";
  }

  return (
    <div style={{ padding:"10px 12px", background:"var(--bg)", borderRadius:7, border:`1px solid ${doc.status !== "pending" ? (doc.status === "verified" ? "rgba(61,204,145,0.25)" : "rgba(45,114,210,0.25)") : "var(--line)"}`, transition:"border-color 0.15s" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        {/* Required indicator */}
        <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center",
          background:doc.required?"rgba(61,204,145,0.12)":"var(--surface-2)",
          border:`1px solid ${doc.required?"rgba(61,204,145,0.35)":"var(--line)"}`,
          color:doc.required?"#3DCC91":"var(--text-4)" }}>
          {doc.required
            ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.5v4M8 5.5v.5" strokeLinecap="round"/></svg>
          }
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name}</div>
          <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", padding:"1px 6px", borderRadius:2, background:"var(--surface-2)", border:"1px solid var(--line)" }}>{doc.category}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)" }}>Due: {doc.deadline}</span>
            {doc.fileName && <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", maxWidth:120 }}>{doc.fileName}</span>}
          </div>
        </div>
        {/* Status + action */}
        <div style={{ display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
          <span style={{ padding:"2px 8px", borderRadius:3, background:sm.bg, fontFamily:"var(--mono)", fontSize:9, color:sm.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{sm.label}</span>
          {doc.status === "pending" && (
            <>
              <input ref={fileRef} type="file" style={{ display:"none" }} onChange={handleFileChange}/>
              <button onClick={() => fileRef.current?.click()}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:4, fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-3)", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                {Icon.upload} Upload
              </button>
            </>
          )}
          {doc.status === "submitted" && (
            <button onClick={() => onUpdate(doc.name, "verified")}
              style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"rgba(61,204,145,0.1)", border:"1px solid rgba(61,204,145,0.3)", borderRadius:4, fontFamily:"var(--mono)", fontSize:9.5, color:"#3DCC91", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.05em" }}>
              {Icon.check} Verify
            </button>
          )}
          {doc.status === "verified" && (
            <button onClick={() => onUpdate(doc.name, "pending")}
              style={{ padding:"3px 8px", background:"transparent", border:"1px solid var(--line)", borderRadius:4, fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", cursor:"pointer" }}>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
