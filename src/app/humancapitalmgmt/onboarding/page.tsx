"use client";
import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "steps" | "docs" | "comp";
type EmployeeType = "w2_full" | "w2_part" | "1099" | "intern" | "international";
type CompFor = "new" | "existing";
type Level = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
type Department = "Executive" | "Engineering" | "Clinical" | "Operations" | "Design" | "Finance" | "Regulatory";

const LEVELS: Level[] = ["L1","L2","L3","L4","L5","L6","L7"];
const DEPARTMENTS: Department[] = ["Executive","Engineering","Clinical","Operations","Design","Finance","Regulatory"];
const LEVEL_BAND: Record<Level,string> = { L1:"Associate", L2:"Junior", L3:"Mid-Level", L4:"Senior", L5:"Staff", L6:"Director", L7:"Executive" };
const DEPT_COLORS: Record<Department,string> = { Executive:"#2D72D2", Engineering:"#00B4D8", Clinical:"#3DCC91", Operations:"#FB923C", Design:"#A78BFA", Finance:"#FFC940", Regulatory:"#F59E0B" };

// ── Comp tables ────────────────────────────────────────────────────────────
const BASE_SALARY: Record<Level,[number,number]> = {
  L1:[65000,85000], L2:[85000,110000], L3:[110000,145000],
  L4:[145000,190000], L5:[190000,250000], L6:[250000,340000], L7:[340000,500000],
};
const BONUS_PCT: Record<Level,number> = { L1:5, L2:8, L3:10, L4:12, L5:15, L6:20, L7:25 };
const EQUITY_4YR: Record<Level,[number,number]> = {
  L1:[0,0], L2:[10000,25000], L3:[25000,75000], L4:[75000,200000],
  L5:[200000,500000], L6:[500000,1200000], L7:[1200000,3000000],
};
const SIGNING: Record<Level,[number,number]> = {
  L1:[0,0], L2:[0,5000], L3:[5000,15000], L4:[15000,30000],
  L5:[25000,50000], L6:[40000,80000], L7:[75000,150000],
};

// ── Onboarding phases ──────────────────────────────────────────────────────
const PHASES = [
  {
    phase: "Pre-Offer",
    color: "#A78BFA",
    steps: [
      { title:"Background Check", desc:"Initiate criminal, employment, and education verification via Checkr or equivalent.", offset:"Day −14" },
      { title:"Reference Verification", desc:"Confirm 2–3 professional references. Document responses in HRIS.", offset:"Day −12" },
      { title:"Compensation Benchmarking", desc:"Run comp model against level, department, and market data. Obtain Finance approval.", offset:"Day −10" },
      { title:"Equity Pool Allocation", desc:"Reserve option pool shares or RSU grant with Finance & Legal sign-off.", offset:"Day −8" },
    ],
  },
  {
    phase: "Offer & Acceptance",
    color: "#2D72D2",
    steps: [
      { title:"Generate Offer Letter", desc:"Issue signed offer letter with title, base salary, start date, and reporting structure.", offset:"Day −7" },
      { title:"Compensation Package Disclosure", desc:"Share full comp summary: base, bonus target, equity grant, signing bonus, and benefits overview.", offset:"Day −7" },
      { title:"Equity Term Sheet", desc:"Disclose option type (ISO/NSO), strike price, vesting schedule (4yr/1yr cliff), and expiration window.", offset:"Day −7" },
      { title:"Countersigned Acceptance", desc:"Obtain candidate signature. Trigger HR and IT provisioning workflows.", offset:"Day −3" },
    ],
  },
  {
    phase: "Pre-Day 1 — Admin",
    color: "#00B4D8",
    steps: [
      { title:"Collect Core Documents", desc:"Request I-9 supporting docs, W-4 (or W-9), state withholding forms, direct deposit info.", offset:"Day −3" },
      { title:"NDA & IP Assignment", desc:"Send and collect Confidentiality Agreement and Proprietary Information & Inventions Assignment.", offset:"Day −3" },
      { title:"Benefits Enrollment Packet", desc:"Initiate enrollment window in HRIS: medical, dental, vision, 401(k), FSA/HSA, commuter.", offset:"Day −2" },
      { title:"Provision System Access", desc:"Create accounts: Google Workspace, Slack, GitHub, Jira, AWS/GCP. Assign role-based permissions.", offset:"Day −1" },
      { title:"Ship Equipment", desc:"Provision laptop, peripherals, and security key. Confirm home delivery or office pickup.", offset:"Day −1" },
      { title:"Send Day 1 Welcome Package", desc:"Email with schedule, buddy name, Slack handle, office access instructions, and first-week agenda.", offset:"Day −1" },
    ],
  },
  {
    phase: "Week 1 — Orientation",
    color: "#3DCC91",
    steps: [
      { title:"Complete I-9 Verification", desc:"HR reviews and signs off on physical or remote I-9 within 3 business days of start.", offset:"Day 1" },
      { title:"HR Policy Orientation", desc:"Review Employee Handbook, PTO policy, code of conduct, anti-harassment policy. Collect signed acknowledgments.", offset:"Day 1" },
      { title:"Security & Compliance Training", desc:"Complete HIPAA (if Clinical), SOC2 awareness, phishing simulation, and acceptable use policy.", offset:"Day 2" },
      { title:"Meet Manager — Set 30/60/90 Goals", desc:"Align on role expectations, key deliverables, and success metrics for the first 90 days.", offset:"Day 3" },
      { title:"Team & Stakeholder Introductions", desc:"Facilitate introductions across Engineering, Clinical, Design, and cross-functional partners.", offset:"Day 3" },
      { title:"Role-Specific Tool Training", desc:"Assign onboarding tasks in Jira, schedule technical ramp sessions, pair with onboarding mentor.", offset:"Day 4" },
    ],
  },
  {
    phase: "30 / 60 / 90-Day Reviews",
    color: "#FFC940",
    steps: [
      { title:"30-Day Check-In", desc:"Manager meets new hire to review acclimation, tool access, team dynamics, and blockers.", offset:"Day 30" },
      { title:"60-Day Performance Pulse", desc:"Mid-point review of goal progress. HR checks benefits enrollment completion and outstanding documents.", offset:"Day 60" },
      { title:"90-Day Formal Review", desc:"Formal evaluation against 30/60/90 plan. Confirm permanent status. Update HRIS record.", offset:"Day 90" },
      { title:"Equity Grant Execution", desc:"Legal executes option agreement or RSU grant. Employee countersigns. Add to cap table.", offset:"Day 90" },
    ],
  },
];

// ── Document requirements ──────────────────────────────────────────────────
interface DocItem { name:string; desc:string; deadline:string; required:boolean; category:string }

const DOCS: Record<EmployeeType,DocItem[]> = {
  w2_full: [
    { name:"Form I-9 (Employment Eligibility)", desc:"Verify identity and work authorization. Must be completed within 3 business days of start.", deadline:"Day 3", required:true, category:"Federal" },
    { name:"Form W-4 (Federal Withholding)", desc:"Employee completes for federal income tax withholding elections.", deadline:"Day 1", required:true, category:"Federal" },
    { name:"State Withholding Form", desc:"Equivalent W-4 for state of employment (e.g., CA DE-4, NY IT-2104). Check each state.", deadline:"Day 1", required:true, category:"State" },
    { name:"Direct Deposit Authorization", desc:"Bank routing and account info for payroll processing.", deadline:"Day 1", required:true, category:"Payroll" },
    { name:"Benefits Enrollment Form", desc:"Medical, dental, vision, 401(k), FSA/HSA, life insurance, and commuter elections.", deadline:"Day 30", required:true, category:"Benefits" },
    { name:"Non-Disclosure Agreement (NDA)", desc:"Confidentiality agreement covering trade secrets, customer data, and proprietary information.", deadline:"Before start", required:true, category:"Legal" },
    { name:"PIIA — IP Assignment Agreement", desc:"Assigns work-product and inventions created during employment to the company.", deadline:"Before start", required:true, category:"Legal" },
    { name:"Employee Handbook Acknowledgment", desc:"Signed acknowledgment that employee has read and agrees to all company policies.", deadline:"Day 1", required:true, category:"Compliance" },
    { name:"Emergency Contact Form", desc:"Primary and secondary emergency contacts with relationship and phone number.", deadline:"Day 5", required:true, category:"HR" },
    { name:"Background Check Consent", desc:"Signed authorization for criminal, credit (if applicable), and employment history checks.", deadline:"Pre-offer", required:true, category:"Pre-Hire" },
    { name:"Reference Check Authorization", desc:"Consent to contact professional references.", deadline:"Pre-offer", required:true, category:"Pre-Hire" },
    { name:"Non-Compete / Non-Solicitation", desc:"Restricted activity agreement post-employment (enforceability varies by state).", deadline:"Before start", required:false, category:"Legal" },
    { name:"HIPAA Training Acknowledgment", desc:"Required for roles with access to PHI. Annual renewal mandated.", deadline:"Week 1", required:false, category:"Compliance" },
    { name:"401(k) Beneficiary Designation", desc:"Designate primary and contingent beneficiaries for retirement account.", deadline:"Day 30", required:false, category:"Benefits" },
    { name:"Stock Option / RSU Grant Agreement", desc:"Countersigned equity grant agreement issued per offer terms.", deadline:"Day 90", required:false, category:"Equity" },
  ],
  w2_part: [
    { name:"Form I-9 (Employment Eligibility)", desc:"Required for all employees regardless of hours worked.", deadline:"Day 3", required:true, category:"Federal" },
    { name:"Form W-4 (Federal Withholding)", desc:"Federal income tax withholding for part-time employees.", deadline:"Day 1", required:true, category:"Federal" },
    { name:"State Withholding Form", desc:"State income tax withholding form per state of employment.", deadline:"Day 1", required:true, category:"State" },
    { name:"Direct Deposit Authorization", desc:"Banking information for payroll processing.", deadline:"Day 1", required:true, category:"Payroll" },
    { name:"ACA Benefits Eligibility Notice", desc:"Notification of eligibility or ineligibility for employer-sponsored health coverage per ACA.", deadline:"Day 1", required:true, category:"Benefits" },
    { name:"NDA & IP Assignment (PIIA)", desc:"Same confidentiality and IP obligations as full-time employees.", deadline:"Before start", required:true, category:"Legal" },
    { name:"Employee Handbook Acknowledgment", desc:"Written acknowledgment of company policies applicable to part-time staff.", deadline:"Day 1", required:true, category:"Compliance" },
    { name:"Emergency Contact Form", desc:"Required HR record for all employees.", deadline:"Day 5", required:true, category:"HR" },
    { name:"Background Check Consent", desc:"Same screening requirements as full-time roles.", deadline:"Pre-offer", required:true, category:"Pre-Hire" },
  ],
  "1099": [
    { name:"Form W-9 (Taxpayer ID)", desc:"Contractor provides their TIN/EIN. Required before any payment. Retained by company for 4 years.", deadline:"Before first payment", required:true, category:"Federal" },
    { name:"Independent Contractor Agreement", desc:"Master services agreement establishing contractor relationship, liability, and IP ownership.", deadline:"Before start", required:true, category:"Contract" },
    { name:"Statement of Work (SOW)", desc:"Defines scope, deliverables, timeline, rate, and payment milestones. Both parties sign.", deadline:"Before start", required:true, category:"Contract" },
    { name:"NDA / Confidentiality Agreement", desc:"Mutual or one-way NDA covering project-related trade secrets and client data.", deadline:"Before start", required:true, category:"Legal" },
    { name:"IP Assignment / Work-for-Hire Clause", desc:"Explicit assignment of all work product to company; scoped within the SOW.", deadline:"Before start", required:true, category:"Legal" },
    { name:"ACH / Payment Information", desc:"Bank details for wire or ACH payment. Verify identity to prevent fraud.", deadline:"Before first payment", required:true, category:"Payroll" },
    { name:"Certificate of Insurance (COI)", desc:"Proof of general liability and professional liability (E&O) insurance. $1M per occurrence minimum.", deadline:"Before start", required:false, category:"Insurance" },
    { name:"Business Entity Verification", desc:"Business registration, EIN letter, or similar confirming contractor's legal entity structure.", deadline:"Before start", required:false, category:"Compliance" },
    { name:"Non-Solicitation Clause", desc:"Limits contractor from soliciting employees or clients during and after engagement.", deadline:"Before start", required:false, category:"Legal" },
    { name:"Form 1099-NEC (Annual IRS Filing)", desc:"Company issues annually for contractors paid ≥ $600. Must file with IRS by January 31.", deadline:"Jan 31 annually", required:true, category:"Federal" },
    { name:"State Nexus / Tax Registration Review", desc:"Verify whether contractor's activity creates state tax nexus obligations for the company.", deadline:"Before start", required:false, category:"State" },
  ],
  intern: [
    { name:"Internship Offer Letter", desc:"Defines internship terms, hours, stipend or hourly rate, start/end dates, and credit if applicable.", deadline:"Before start", required:true, category:"Contract" },
    { name:"Form I-9", desc:"Required for paid interns. Unpaid interns may also require based on state law.", deadline:"Day 3", required:true, category:"Federal" },
    { name:"Form W-4 (Paid Intern)", desc:"Federal withholding for paid internship stipends or hourly wages.", deadline:"Day 1", required:true, category:"Federal" },
    { name:"NDA & IP Assignment", desc:"Same obligations as full-time employees — especially critical for product or research interns.", deadline:"Before start", required:true, category:"Legal" },
    { name:"Employee Handbook Acknowledgment", desc:"Policy acknowledgment covering intern-specific conduct expectations.", deadline:"Day 1", required:true, category:"Compliance" },
    { name:"Emergency Contact Form", desc:"Required for all workers regardless of classification.", deadline:"Day 5", required:true, category:"HR" },
    { name:"Academic Credit Authorization", desc:"If for academic credit: letter from university confirming the internship aligns with degree requirements.", deadline:"Before start", required:false, category:"Education" },
    { name:"Minor Work Permit", desc:"If intern is under 18, obtain state-required work permit or parental consent.", deadline:"Before start", required:false, category:"Compliance" },
    { name:"FERPA Waiver", desc:"If intern will access education records, a FERPA waiver may be required by their institution.", deadline:"Before start", required:false, category:"Compliance" },
    { name:"Background Check Consent", desc:"Required for interns with access to sensitive systems, patient data, or financial information.", deadline:"Pre-offer", required:false, category:"Pre-Hire" },
  ],
  international: [
    { name:"Form I-9 + Visa Documentation", desc:"Verify specific visa category: H-1B, L-1, O-1, TN, OPT/CPT for F-1. Check all expiration dates.", deadline:"Day 3", required:true, category:"Federal" },
    { name:"Work Authorization Document", desc:"Visa stamp, I-797 approval notice, EAD card, or I-20 (OPT). Must be unexpired on start date.", deadline:"Before start", required:true, category:"Immigration" },
    { name:"USCIS I-129 Petition (H-1B/L-1)", desc:"Filed by employer prior to employment. Maintain in public access file for duration of status.", deadline:"Pre-hire", required:true, category:"Immigration" },
    { name:"LCA (Labor Condition Application)", desc:"DOL public access file required for H-1B workers. Must be posted or made available to employees.", deadline:"Before H-1B start", required:true, category:"Immigration" },
    { name:"Form W-4 or Form 8233", desc:"W-4 for most workers; Form 8233 for non-resident aliens claiming a tax treaty exemption.", deadline:"Day 1", required:true, category:"Federal" },
    { name:"Form 1042-S (NRA)", desc:"Non-resident alien income subject to withholding. Company must issue annually.", deadline:"Annual (March 15)", required:true, category:"Federal" },
    { name:"State Tax Withholding Form", desc:"Withholding based on state of work location, regardless of visa type.", deadline:"Day 1", required:true, category:"State" },
    { name:"Tax Treaty Review", desc:"Legal or payroll reviews applicable income tax treaty for reduced withholding rates.", deadline:"Before Day 1", required:false, category:"Tax" },
    { name:"OFAC Sanctions Screening", desc:"Verify individual is not listed on OFAC's Specially Designated Nationals (SDN) list.", deadline:"Pre-offer", required:true, category:"Compliance" },
    { name:"NDA & IP Assignment (PIIA)", desc:"Standard documents; confirm jurisdiction and applicable law for enforcement.", deadline:"Before start", required:true, category:"Legal" },
    { name:"EOR / PEO Agreement (if applicable)", desc:"If employing via Employer of Record (Deel, Remote.com, etc.), local employment agreement governs.", deadline:"Before start", required:false, category:"Contract" },
    { name:"Passport Copy on File", desc:"On-file copy of passport for travel, immigration records, and visa renewal management.", deadline:"Day 1", required:true, category:"HR" },
  ],
};

const EMP_TYPE_META: Record<EmployeeType, { label:string; color:string; bg:string; sub:string }> = {
  w2_full:       { label:"W-2 Full-Time",    color:"#3DCC91", bg:"rgba(61,204,145,0.12)",   sub:"Regular full-time employee" },
  w2_part:       { label:"W-2 Part-Time",    color:"#00B4D8", bg:"rgba(0,180,216,0.12)",    sub:"Part-time or reduced hours" },
  "1099":        { label:"1099 Contractor",  color:"#A78BFA", bg:"rgba(167,139,250,0.12)",  sub:"Independent contractor" },
  intern:        { label:"Intern",           color:"#FFC940", bg:"rgba(255,201,64,0.12)",   sub:"Paid or unpaid internship" },
  international: { label:"International",   color:"#F59E0B", bg:"rgba(245,158,11,0.12)",   sub:"Visa-sponsored or EOR worker" },
};

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  list:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.5" y="2.5" width="13" height="2" rx=".5"/><rect x="1.5" y="7" width="13" height="2" rx=".5"/><rect x="1.5" y="11.5" width="13" height="2" rx=".5"/></svg>,
  org:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".75"/><rect x="1" y="11" width="4" height="3" rx=".75"/><rect x="6" y="11" width="4" height="3" rx=".75"/><rect x="11" y="11" width="4" height="3" rx=".75"/><path d="M8 4.5v3M3 11V9h10V8" strokeLinecap="round"/></svg>,
  steps: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 8h4v6H2zM6 5h4v9H6zM10 2h4v12h-4z" strokeLinejoin="round"/></svg>,
  doc:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 1.5h5.5L12 4v10.5H4V1.5z" strokeLinejoin="round"/><path d="M9.5 1.5V4H12" strokeLinejoin="round"/><path d="M6 7h4M6 9.5h4M6 12h2"/></svg>,
  comp:  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v1M8 10.5v1M6.5 6a1.5 1.5 0 011.5-1.5A1.5 1.5 0 019.5 6c0 2-3 2-3 4h3" strokeLinecap="round"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  info:  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.5v4M8 5.5v.5" strokeLinecap="round"/></svg>,
  dollar:<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 2v12M5.5 5A2.5 2.5 0 018 3h.5a2 2 0 010 4H7a2.5 2.5 0 000 5h1A2.5 2.5 0 0110.5 10" strokeLinecap="round"/></svg>,
  equity:<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 12l4-5 3 3 5-7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(n%1_000_000===0?0:1)}M`;
  if (n >= 1000) return `$${(n/1000).toFixed(0)}K`;
  return `$${n}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const [tab, setTab] = useState<Tab>("steps");

  const navLabel: React.CSSProperties = { fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)", padding:"0 8px", marginBottom:8 };
  const navBase:  React.CSSProperties = { display:"flex", alignItems:"center", gap:10, padding:"7px 8px 7px 10px", fontSize:13, color:"var(--text-2)", borderRadius:4, cursor:"pointer", textDecoration:"none" };
  const navActive: React.CSSProperties = { ...navBase, background:"var(--surface-2)", color:"var(--text)", fontWeight:500 };

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
          <div style={navActive}><span>{Icon.steps}</span>Onboarding</div>
        </div>

        <div>
          <div style={navLabel}>Sections</div>
          {([
            { id:"steps", label:"Onboarding Steps", icon:Icon.steps },
            { id:"docs",  label:"Document Requirements", icon:Icon.doc },
            { id:"comp",  label:"Compensation Builder", icon:Icon.comp },
          ] as { id:Tab; label:string; icon:React.ReactNode }[]).map(s => (
            <div key={s.id}
              style={{ ...navBase, background:tab===s.id?"var(--surface-2)":"transparent", color:tab===s.id?"var(--text)":"var(--text-2)", fontWeight:tab===s.id?500:400 }}
              onClick={() => setTab(s.id)}>
              <span style={{ opacity:tab===s.id?1:0.55 }}>{s.icon}</span>{s.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop:"auto", fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", letterSpacing:"0.1em", textTransform:"uppercase", padding:"0 2px" }}>
          <div>HCM · Sprint 18</div>
          <div style={{ marginTop:4, color:"var(--text-3)" }}>Onboarding & Comp</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ borderBottom:"1px solid var(--line)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg)", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:4 }}>Human Capital Management</div>
            <h1 style={{ margin:0, fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em" }}>
              Employee <em style={{ fontStyle:"italic", color:"var(--text-2)" }}>Onboarding</em>
            </h1>
          </div>
          {/* Tab bar */}
          <div style={{ display:"flex", gap:2, background:"var(--surface-1)", padding:3, borderRadius:8, border:"1px solid var(--line)" }}>
            {([
              { id:"steps", label:"Steps" },
              { id:"docs",  label:"Documents" },
              { id:"comp",  label:"Compensation" },
            ] as { id:Tab; label:string }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:"6px 18px", borderRadius:6, border:0, fontFamily:"var(--mono)", fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s",
                  background:tab===t.id?"var(--surface-3)":"transparent",
                  color:tab===t.id?"var(--text)":"var(--text-4)",
                  fontWeight:tab===t.id?500:400 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, padding:"28px 32px 48px", minWidth:0 }}>
          {tab === "steps" && <OnboardingSteps/>}
          {tab === "docs"  && <DocumentRequirements/>}
          {tab === "comp"  && <CompensationBuilder/>}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1 — Onboarding Steps
// ═══════════════════════════════════════════════════════════════════════════
function OnboardingSteps() {
  const [expanded, setExpanded] = useState<Record<string,boolean>>({ "Pre-Offer":true });
  const totalSteps = PHASES.reduce((s,p) => s+p.steps.length, 0);

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:8 }}>Employee Lifecycle</div>
        <p style={{ margin:"0 0 20px", fontSize:14, color:"var(--text-2)", lineHeight:1.7, maxWidth:680 }}>
          End-to-end onboarding workflow covering pre-offer through 90-day review. Each phase includes compliance checkpoints, document collection, and system provisioning milestones.
        </p>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          <StatPill label="Phases" value={PHASES.length} color="#2D72D2"/>
          <StatPill label="Total Steps" value={totalSteps} color="#3DCC91"/>
          <StatPill label="Day 1 Critical" value={PHASES.slice(0,3).reduce((s,p)=>s+p.steps.length,0)} color="#FFC940"/>
        </div>
      </div>

      {/* Timeline connector */}
      <div style={{ position:"relative" }}>
        {/* Vertical rail */}
        <div style={{ position:"absolute", left:19, top:20, bottom:0, width:2, background:"var(--line)" }}/>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {PHASES.map((ph, phIdx) => {
            const isOpen = expanded[ph.phase] !== false;
            return (
              <div key={ph.phase} style={{ position:"relative" }}>
                {/* Phase header */}
                <div
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 18px 11px 14px", background:"var(--surface-1)", borderRadius:8, border:`1px solid var(--line)`, cursor:"pointer", position:"relative", zIndex:1 }}
                  onClick={() => setExpanded(prev => ({ ...prev, [ph.phase]:!isOpen }))}>
                  {/* Phase dot */}
                  <div style={{ width:12, height:12, borderRadius:"50%", background:ph.color, flexShrink:0, boxShadow:`0 0 8px ${ph.color}60` }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.12em", color:ph.color, fontWeight:500 }}>{ph.phase}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{ph.steps.length} steps</span>
                    <div style={{ width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", transition:"transform 0.2s", transform:isOpen?"rotate(90deg)":"rotate(0deg)" }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                {isOpen && (
                  <div style={{ marginLeft:40, marginTop:4, display:"flex", flexDirection:"column", gap:4 }}>
                    {ph.steps.map((step, sIdx) => (
                      <div key={step.title} style={{ display:"flex", gap:12, padding:"12px 16px", background:"var(--bg)", borderRadius:6, border:"1px solid var(--line)", position:"relative" }}>
                        {/* Step connector to rail */}
                        <div style={{ position:"absolute", left:-28, top:"50%", width:28, height:1, background:"var(--line-strong)", transform:"translateY(-0.5px)" }}/>
                        {/* Step number */}
                        <div style={{ width:22, height:22, borderRadius:5, background:`${ph.color}18`, border:`1px solid ${ph.color}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"var(--mono)", fontSize:9, color:ph.color, fontWeight:600 }}>
                          {sIdx+1}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{step.title}</div>
                          <div style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.6 }}>{step.desc}</div>
                        </div>
                        <div style={{ flexShrink:0, fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", whiteSpace:"nowrap", paddingTop:2 }}>{step.offset}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", background:"var(--surface-1)", border:"1px solid var(--line)", borderRadius:99 }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:16, fontWeight:500, color, fontVariantNumeric:"tabular-nums" }}>{value}</div>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-4)" }}>{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2 — Document Requirements
// ═══════════════════════════════════════════════════════════════════════════
function DocumentRequirements() {
  const [selected, setSelected] = useState<EmployeeType>("w2_full");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [showOptional, setShowOptional] = useState(true);

  const docs = DOCS[selected];
  const meta = EMP_TYPE_META[selected];
  const categories = ["all", ...Array.from(new Set(docs.map(d => d.category)))];

  const filtered = docs
    .filter(d => catFilter === "all" || d.category === catFilter)
    .filter(d => showOptional || d.required);

  const required = filtered.filter(d => d.required).length;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:8 }}>Document Checklist</div>
        <p style={{ margin:"0 0 20px", fontSize:14, color:"var(--text-2)", lineHeight:1.7, maxWidth:680 }}>
          Select an employment classification to view all required and recommended documents. Requirements vary significantly by worker type, visa status, and state of employment.
        </p>
      </div>

      {/* Employment type selector */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8, marginBottom:24 }}>
        {(Object.entries(EMP_TYPE_META) as [EmployeeType, typeof EMP_TYPE_META[EmployeeType]][]).map(([key, m]) => (
          <button key={key} onClick={() => { setSelected(key); setCatFilter("all"); }}
            style={{ padding:"12px 10px", background:selected===key?m.bg:"var(--surface-1)", border:`1px solid ${selected===key?m.color:"var(--line)"}`, borderRadius:8, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:500, color:selected===key?m.color:"var(--text-2)", marginBottom:4, letterSpacing:"0.04em" }}>{m.label}</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", flex:1 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:"3px 10px", borderRadius:99, border:"1px solid", fontSize:10.5, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s",
                background:catFilter===c?"var(--surface-3)":"transparent",
                borderColor:catFilter===c?"var(--text-3)":"var(--line)",
                color:catFilter===c?"var(--text)":"var(--text-4)" }}>
              {c === "all" ? "All Categories" : c}
            </button>
          ))}
        </div>
        <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)", letterSpacing:"0.04em" }}>
          <input type="checkbox" checked={showOptional} onChange={e => setShowOptional(e.target.checked)} style={{ accentColor:"var(--accent)" }}/>
          Show Optional
        </label>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>
          {required} required · {filtered.length - required} optional
        </div>
      </div>

      {/* Document list */}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(doc => (
          <div key={doc.name} style={{ display:"flex", gap:14, padding:"14px 16px", background:"var(--surface-1)", borderRadius:8, border:`1px solid var(--line)`, transition:"border-color 0.12s" }}>
            {/* Required/optional indicator */}
            <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center",
              background:doc.required?"rgba(61,204,145,0.15)":"var(--surface-2)",
              border:`1px solid ${doc.required?"rgba(61,204,145,0.4)":"var(--line-strong)"}`,
              color:doc.required?"#3DCC91":"var(--text-4)" }}>
              {doc.required ? Icon.check : Icon.info}
            </div>
            {/* Content */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{doc.name}</span>
                <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:3, background:"var(--surface-2)", border:"1px solid var(--line-strong)", fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  {doc.category}
                </span>
                {!doc.required && (
                  <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:3, background:"rgba(255,201,64,0.1)", border:"1px solid rgba(255,201,64,0.3)", fontFamily:"var(--mono)", fontSize:9, color:"#FFC940", letterSpacing:"0.06em" }}>
                    Recommended
                  </span>
                )}
              </div>
              <div style={{ fontSize:12.5, color:"var(--text-3)", lineHeight:1.6 }}>{doc.desc}</div>
            </div>
            {/* Deadline */}
            <div style={{ flexShrink:0, textAlign:"right" }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>Deadline</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:doc.required?"var(--text-2)":"var(--text-4)", whiteSpace:"nowrap" }}>{doc.deadline}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop:20, padding:"12px 16px", background:"rgba(255,201,64,0.06)", border:"1px solid rgba(255,201,64,0.2)", borderRadius:8 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"#FFC940", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Legal Notice</div>
        <div style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.6 }}>
          This checklist is a reference guide. Requirements vary by state, municipality, and applicable law. Consult qualified employment counsel before finalizing onboarding documentation for any specific hire. This is not legal advice.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3 — Compensation Builder
// ═══════════════════════════════════════════════════════════════════════════
function CompensationBuilder() {
  const [compFor, setCompFor] = useState<CompFor>("new");
  const [level, setLevel] = useState<Level>("L4");
  const [dept, setDept] = useState<Department>("Engineering");
  const [empType, setEmpType] = useState<"w2"|"1099"|"intern">("w2");
  const [salaryPct, setSalaryPct] = useState(50);
  const [equityPct, setEquityPct] = useState(50);
  const [includeEquity, setIncludeEquity] = useState(true);
  const [includeSigning, setIncludeSigning] = useState(true);
  const [vestingSchedule, setVestingSchedule] = useState<"4y1c"|"3y1c"|"rsu">("4y1c");
  const [meritPct, setMeritPct] = useState(5);
  const [promoLevel, setPromoLevel] = useState<Level>("L5");

  const isContractor = empType === "1099";
  const isIntern = empType === "intern";

  const [baseLo, baseHi] = BASE_SALARY[level];
  const base = Math.round(baseLo + (baseHi - baseLo) * salaryPct / 100);
  const bonusPct = BONUS_PCT[level];
  const bonusTarget = isContractor || isIntern ? 0 : Math.round(base * bonusPct / 100);
  const [eqLo, eqHi] = EQUITY_4YR[level];
  const equity4yr = isContractor || isIntern ? 0 : Math.round(eqLo + (eqHi - eqLo) * equityPct / 100);
  const [sigLo, sigHi] = SIGNING[level];
  const signing = isContractor || isIntern ? 0 : Math.round(sigLo + (sigHi - sigLo) * 0.5);
  const benefitsValue = isContractor || isIntern ? 0 : 18000;

  // Contractor rate estimate
  const contractorRate = isContractor ? Math.round((base * 1.3) / 2080) : 0;

  // Existing employee
  const meritBase = Math.round(base * (1 + meritPct/100));
  const [promoBaseLo, promoBaseHi] = BASE_SALARY[promoLevel];
  const promoBase = Math.round(promoBaseLo + (promoBaseHi - promoBaseLo) * 0.3);

  const totalComp = base + bonusTarget + (includeEquity ? equity4yr / 4 : 0) + (includeSigning && compFor === "new" ? signing / 4 : 0);

  const dc = DEPT_COLORS[dept];

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.16em", color:"var(--text-4)", marginBottom:8 }}>Compensation Modeler</div>
        <p style={{ margin:"0 0 20px", fontSize:14, color:"var(--text-2)", lineHeight:1.7, maxWidth:680 }}>
          Model total compensation packages for new hires and existing employees. Includes base salary, target bonus, equity (ISO/NSO/RSU), signing bonus, and benefits value.
        </p>
        {/* New / Existing toggle */}
        <div style={{ display:"inline-flex", gap:2, background:"var(--surface-1)", padding:3, borderRadius:8, border:"1px solid var(--line)", marginBottom:4 }}>
          {([["new","New Hire"],["existing","Existing Employee"]] as [CompFor,string][]).map(([id,label]) => (
            <button key={id} onClick={() => setCompFor(id)}
              style={{ padding:"7px 22px", borderRadius:6, border:0, fontFamily:"var(--mono)", fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s",
                background:compFor===id?"var(--surface-3)":"transparent",
                color:compFor===id?"var(--text)":"var(--text-4)",
                fontWeight:compFor===id?500:400 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>
        {/* Left — controls */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Role config */}
          <Section title="Role Configuration" color={dc}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <FieldLabel>Level</FieldLabel>
                <select value={level} onChange={e => setLevel(e.target.value as Level)} style={selectStyle}>
                  {LEVELS.map(l => <option key={l} value={l}>{l} — {LEVEL_BAND[l]}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Department</FieldLabel>
                <select value={dept} onChange={e => setDept(e.target.value as Department)} style={selectStyle}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>Employment Type</FieldLabel>
              <div style={{ display:"flex", gap:4 }}>
                {([["w2","W-2 Employee"],["1099","1099 Contractor"],["intern","Intern"]] as [typeof empType, string][]).map(([v,l]) => (
                  <button key={v} onClick={() => setEmpType(v)}
                    style={{ flex:1, padding:"6px 8px", borderRadius:5, border:"1px solid", fontSize:11, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.04em", transition:"all 0.12s",
                      background:empType===v?"var(--surface-3)":"transparent",
                      borderColor:empType===v?"var(--text-3)":"var(--line)",
                      color:empType===v?"var(--text)":"var(--text-4)" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Salary */}
          <Section title="Base Salary" color="#3DCC91">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-4)" }}>Market range for {level} · {LEVEL_BAND[level]}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"#3DCC91", fontWeight:500 }}>{fmt(base)}</div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{fmt(baseLo)}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{fmt(baseHi)}</span>
            </div>
            <input type="range" min={0} max={100} value={salaryPct} onChange={e => setSalaryPct(Number(e.target.value))}
              style={{ width:"100%", accentColor:"#3DCC91" }}/>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", marginTop:4 }}>
              Positioning: {salaryPct < 33 ? "Below mid" : salaryPct < 66 ? "Mid-range" : "Top of band"}
            </div>
            {isContractor && (
              <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:6 }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"#A78BFA", marginBottom:3 }}>Equivalent Contractor Rate</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:18, color:"#A78BFA", fontWeight:500 }}>${contractorRate}/hr</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", marginTop:2 }}>Base annualized × 1.3 overhead ÷ 2,080 hrs</div>
              </div>
            )}
          </Section>

          {/* Equity */}
          {!isContractor && !isIntern && (
            <Section title="Equity" color="#2D72D2">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)" }}>
                    <input type="checkbox" checked={includeEquity} onChange={e => setIncludeEquity(e.target.checked)} style={{ accentColor:"var(--accent)" }}/>
                    Include Equity Grant
                  </label>
                </div>
                {includeEquity && <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"#2D72D2", fontWeight:500 }}>{fmt(equity4yr)} over 4yr</div>}
              </div>
              {includeEquity && eqHi > 0 && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{fmt(eqLo)}</span>
                    <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{fmt(eqHi)}</span>
                  </div>
                  <input type="range" min={0} max={100} value={equityPct} onChange={e => setEquityPct(Number(e.target.value))}
                    style={{ width:"100%", accentColor:"#2D72D2" }}/>
                  <div style={{ marginTop:12 }}>
                    <FieldLabel>Grant Type / Vesting Schedule</FieldLabel>
                    <div style={{ display:"flex", gap:4 }}>
                      {([
                        ["4y1c","4yr · 1yr cliff (ISO/NSO)"],
                        ["3y1c","3yr · 1yr cliff"],
                        ["rsu","RSUs · 4yr quarterly"],
                      ] as [typeof vestingSchedule, string][]).map(([v,l]) => (
                        <button key={v} onClick={() => setVestingSchedule(v)}
                          style={{ flex:1, padding:"6px 8px", borderRadius:5, border:"1px solid", fontSize:10, fontFamily:"var(--mono)", cursor:"pointer", letterSpacing:"0.03em", transition:"all 0.12s",
                            background:vestingSchedule===v?"var(--surface-3)":"transparent",
                            borderColor:vestingSchedule===v?"#2D72D2":"var(--line)",
                            color:vestingSchedule===v?"#2D72D2":"var(--text-4)" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <EquityScheduleViz equity4yr={equity4yr} schedule={vestingSchedule}/>
                </>
              )}
              {includeEquity && eqHi === 0 && (
                <div style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-4)", padding:"8px 0" }}>Equity not typically offered at {level} ({LEVEL_BAND[level]}) level.</div>
              )}
            </Section>
          )}

          {/* Signing & existing employee extras */}
          {compFor === "new" && !isContractor && !isIntern && sigHi > 0 && (
            <Section title="Signing Bonus" color="#FFC940">
              <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-3)" }}>
                <input type="checkbox" checked={includeSigning} onChange={e => setIncludeSigning(e.target.checked)} style={{ accentColor:"#FFC940" }}/>
                Include signing bonus
              </label>
              {includeSigning && (
                <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", padding:"10px 12px", background:"rgba(255,201,64,0.08)", border:"1px solid rgba(255,201,64,0.2)", borderRadius:6 }}>
                  <div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"#FFC940", marginBottom:2 }}>Suggested Amount</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:18, color:"#FFC940", fontWeight:500 }}>{fmt(signing)}</div>
                  </div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", textAlign:"right" }}>
                    <div>Range: {fmt(sigLo)} – {fmt(sigHi)}</div>
                    <div style={{ marginTop:4 }}>Typically 1yr clawback</div>
                  </div>
                </div>
              )}
            </Section>
          )}

          {compFor === "existing" && !isContractor && !isIntern && (
            <Section title="Merit & Promotion" color="#FB923C">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <FieldLabel>Merit Increase %</FieldLabel>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input type="range" min={0} max={20} value={meritPct} onChange={e => setMeritPct(Number(e.target.value))}
                      style={{ flex:1, accentColor:"#FB923C" }}/>
                    <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"#FB923C", minWidth:30 }}>{meritPct}%</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>
                    <span>Current: {fmt(base)}</span>
                    <span style={{ color:"#FB923C" }}>New: {fmt(meritBase)}</span>
                  </div>
                </div>
                <div>
                  <FieldLabel>Promotion Target Level</FieldLabel>
                  <select value={promoLevel} onChange={e => setPromoLevel(e.target.value as Level)} style={selectStyle}>
                    {LEVELS.filter(l => l > level).map(l => <option key={l} value={l}>{l} — {LEVEL_BAND[l]}</option>)}
                  </select>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", marginTop:6 }}>
                    New base: <span style={{ color:"#FB923C" }}>{fmt(promoBase)}+</span>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Right — summary card */}
        <div style={{ position:"sticky", top:100 }}>
          <Section title="Total Compensation Summary" color={dc}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
              <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:38, lineHeight:1, color:"var(--text)", fontVariantNumeric:"tabular-nums" }}>{fmt(Math.round(totalComp))}</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)", textTransform:"uppercase" }}>/yr total</div>
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:dc, marginBottom:20 }}>
              {level} · {LEVEL_BAND[level]} · {dept}
            </div>

            {/* Comp breakdown bars */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              <CompRow label="Base Salary" value={base} pct={Math.round(base/totalComp*100)} color="#3DCC91"/>
              {!isContractor && !isIntern && bonusTarget > 0 && (
                <CompRow label={`Target Bonus (${bonusPct}%)`} value={bonusTarget} pct={Math.round(bonusTarget/totalComp*100)} color="#FFC940"/>
              )}
              {includeEquity && !isContractor && !isIntern && equity4yr > 0 && (
                <CompRow label={`Equity (${fmt(equity4yr)} / 4yr)`} value={Math.round(equity4yr/4)} pct={Math.round(equity4yr/4/totalComp*100)} color="#2D72D2"/>
              )}
              {includeSigning && compFor === "new" && !isContractor && !isIntern && signing > 0 && (
                <CompRow label="Signing Bonus (yr 1)" value={signing} pct={Math.round(signing/totalComp*100)} color="#A78BFA" note="Year 1 only"/>
              )}
              {!isContractor && !isIntern && (
                <CompRow label="Benefits Value (est.)" value={benefitsValue} pct={Math.round(benefitsValue/totalComp*100)} color="#FB923C" note="Medical/dental/vision"/>
              )}
            </div>

            <div style={{ borderTop:"1px solid var(--line)", paddingTop:14, display:"flex", flexDirection:"column", gap:8 }}>
              {isContractor ? (
                <>
                  <InfoRow label="Hourly Rate" value={`$${contractorRate}/hr`}/>
                  <InfoRow label="Annualized (2,080 hrs)" value={fmt(contractorRate*2080)}/>
                  <InfoRow label="No benefits / equity" value="Self-funded"/>
                  <InfoRow label="Gross-up vs W-2" value="~1.3× base equivalent"/>
                </>
              ) : isIntern ? (
                <>
                  <InfoRow label="Hourly / Stipend" value={`~$${Math.round(base/2080)}/hr`}/>
                  <InfoRow label="Duration" value="Typically 10–16 weeks"/>
                  <InfoRow label="Benefits" value="Not typically offered"/>
                  <InfoRow label="Equity" value="Not typically offered"/>
                </>
              ) : (
                <>
                  <InfoRow label="Vesting Schedule" value={vestingSchedule === "4y1c" ? "4yr / 1yr cliff" : vestingSchedule === "3y1c" ? "3yr / 1yr cliff" : "4yr RSU quarterly"}/>
                  <InfoRow label="Bonus Timing" value="Annual, Q1 payout"/>
                  <InfoRow label="Benefits Enrollment" value="Within 30 days of start"/>
                  <InfoRow label={compFor === "new" ? "Offer Expiration" : "Review Cycle"} value={compFor === "new" ? "5–7 business days" : "Annual in Q4"}/>
                </>
              )}
            </div>

            {/* Approval chain */}
            {!isContractor && !isIntern && (
              <div style={{ marginTop:16, padding:"12px 14px", background:"var(--surface-2)", borderRadius:6, border:"1px solid var(--line)" }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:10 }}>Approval Chain</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {getApprovalChain(level, equity4yr, includeEquity).map((step, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", background:`${dc}20`, border:`1px solid ${dc}40`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--mono)", fontSize:8, color:dc, flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-2)" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Stock option explainer */}
          {includeEquity && !isContractor && !isIntern && equity4yr > 0 && (
            <div style={{ marginTop:12, padding:"14px 16px", background:"rgba(45,114,210,0.06)", border:"1px solid rgba(45,114,210,0.18)", borderRadius:8 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"#2D72D2", marginBottom:10 }}>Equity Grant Detail</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <EquityRow label="Grant Type" value={vestingSchedule === "rsu" ? "RSUs (Restricted Stock Units)" : level >= "L5" ? "ISOs + NSOs (above ISO limit)" : "ISOs (Incentive Stock Options)"}/>
                <EquityRow label="4-Year Total" value={fmt(equity4yr)}/>
                <EquityRow label="Yr 1 (post-cliff)" value={fmt(Math.round(equity4yr * 0.25))}/>
                <EquityRow label="Quarterly Vest" value={fmt(Math.round(equity4yr / 16))}/>
                <EquityRow label="Cliff" value={vestingSchedule === "rsu" ? "None (quarterly from grant)" : "12 months from start"}/>
                <EquityRow label="Expiration" value={vestingSchedule === "rsu" ? "N/A (settle on vest)" : "10 years from grant date"}/>
                <EquityRow label="Exercise Window" value={vestingSchedule === "rsu" ? "N/A" : "90 days post-termination"}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comp sub-components ────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = { width:"100%", background:"var(--surface-2)", border:"1px solid var(--line-strong)", borderRadius:5, padding:"7px 10px", color:"var(--text)", fontSize:12.5, fontFamily:"var(--sans)", outline:"none" };

function Section({ title, color, children }: { title:string; color:string; children:React.ReactNode }) {
  return (
    <div style={{ padding:"16px 18px", background:"var(--surface-1)", borderRadius:10, border:"1px solid var(--line)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
        <div style={{ width:6, height:6, borderRadius:2, background:color, flexShrink:0 }}/>
        <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)" }}>{title}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children:React.ReactNode }) {
  return <div style={{ fontFamily:"var(--mono)", fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--text-4)", marginBottom:5 }}>{children}</div>;
}

function CompRow({ label, value, pct, color, note }: { label:string; value:number; pct:number; color:string; note?:string }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <div>
          <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>{label}</span>
          {note && <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--text-4)", marginLeft:6 }}>{note}</span>}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"baseline" }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)" }}>{pct}%</span>
          <span style={{ fontFamily:"var(--mono)", fontSize:13, color, fontWeight:500, fontVariantNumeric:"tabular-nums" }}>{fmt(value)}</span>
        </div>
      </div>
      <div style={{ height:3, borderRadius:2, background:"var(--surface-3)" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.3s" }}/>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--text-4)" }}>{label}</span>
      <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--text-2)", textAlign:"right" }}>{value}</span>
    </div>
  );
}

function EquityRow({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
      <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(45,114,210,0.7)" }}>{label}</span>
      <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"#2D72D2", textAlign:"right" }}>{value}</span>
    </div>
  );
}

function EquityScheduleViz({ equity4yr, schedule }: { equity4yr:number; schedule:string }) {
  if (equity4yr === 0) return null;
  const perQtr = equity4yr / 16;
  const bars = Array.from({ length:16 }, (_, i) => {
    if (schedule === "rsu") return { val:perQtr, cliff:false };
    const cliffQ = 4;
    if (i < cliffQ) return { val:0, cliff:i===cliffQ-1 };
    return { val: i===cliffQ ? equity4yr*0.25 : perQtr, cliff:false };
  });
  const maxVal = Math.max(...bars.map(b => b.val));

  return (
    <div style={{ marginTop:14 }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Vesting Timeline</div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:48 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <div style={{ width:"100%", borderRadius:2, background:b.val>0?"#2D72D2":"var(--surface-3)", height:b.val>0?`${Math.max(4,(b.val/maxVal)*40)}px`:"4px", transition:"height 0.2s", opacity:b.cliff?0.4:1 }}/>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontFamily:"var(--mono)", fontSize:8.5, color:"var(--text-4)" }}>
        <span>Q1 Yr1</span>
        <span>Cliff</span>
        <span>Q4 Yr4</span>
      </div>
    </div>
  );
}

function getApprovalChain(level: Level, equity: number, includeEquity: boolean): string[] {
  const chain = ["Hiring Manager — initial offer terms"];
  if (level >= "L4") chain.push("Department VP — level and comp approval");
  if (level >= "L6" || (includeEquity && equity >= 500000)) chain.push("CFO / Finance — compensation budget sign-off");
  if (level >= "L7" || (includeEquity && equity >= 1000000)) chain.push("CEO — executive offer approval");
  if (includeEquity && equity > 0) chain.push("Legal / General Counsel — equity grant execution");
  chain.push("HR / People Ops — final documentation and HRIS entry");
  return chain;
}
