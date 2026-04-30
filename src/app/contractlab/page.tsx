"use client";
import { useState, useRef, useEffect, useCallback } from "react";

type DocCategory = "nda" | "termsheet" | "employment" | "consulting" | "service" | "partnership" | "licensing" | "contractor" | "loi";
type SignerStatus = "pending" | "viewed" | "signed" | "declined";
type DocStatus = "draft" | "sent" | "completed" | "declined";
type SignMode = "draw" | "type";
type RightTab = "sign" | "share" | "export";
type StatusFilter = "all" | "draft" | "sent" | "completed";

interface Signer {
  id: string; name: string; email: string; role: string;
  status: SignerStatus; color: string; signedAt?: string; signature?: string;
}
interface ContractDoc {
  id: string; title: string; category: DocCategory; status: DocStatus;
  created: string; updated: string; signers: Signer[]; content: string;
}

const SIGNER_COLORS = ["#818CF8","#34D399","#FFC940","#FB923C","#22D3EE","#F472B6"];

const CAT_META: Record<DocCategory,{label:string;icon:string;color:string}> = {
  nda:         {label:"Non-Disclosure Agreement", icon:"🔒", color:"#818CF8"},
  termsheet:   {label:"Term Sheet",               icon:"📋", color:"#34D399"},
  employment:  {label:"Employment Agreement",     icon:"👤", color:"#FFC940"},
  consulting:  {label:"Consulting Agreement",     icon:"💼", color:"#FB923C"},
  service:     {label:"Service Agreement",        icon:"⚙️", color:"#22D3EE"},
  partnership: {label:"Partnership Agreement",    icon:"🤝", color:"#F472B6"},
  licensing:   {label:"License Agreement",        icon:"©️", color:"#00B4D8"},
  contractor:  {label:"Contractor Agreement",     icon:"🔧", color:"#A78BFA"},
  loi:         {label:"Letter of Intent",         icon:"📝", color:"#FF6B6B"},
};

const STATUS_META: Record<DocStatus,{color:string;label:string}> = {
  draft:     {color:"var(--text-3)", label:"Draft"},
  sent:      {color:"#FFC940",       label:"Sent for Signing"},
  completed: {color:"#3DCC91",       label:"Completed"},
  declined:  {color:"#FF6B6B",       label:"Declined"},
};

const SIGNER_STATUS: Record<SignerStatus,{color:string;label:string}> = {
  pending:  {color:"var(--text-3)", label:"Pending"},
  viewed:   {color:"#FFC940",       label:"Viewed"},
  signed:   {color:"#3DCC91",       label:"Signed"},
  declined: {color:"#FF6B6B",       label:"Declined"},
};

const TEMPLATES: Record<DocCategory,string> = {
nda:`# MUTUAL NON-DISCLOSURE AGREEMENT

**Effective Date:** [DATE]
**Between:** [PARTY A NAME], a [STATE] [ENTITY TYPE] ("Disclosing Party")
**And:** [PARTY B NAME], a [STATE] [ENTITY TYPE] ("Receiving Party")

---

## 1. Purpose

The parties wish to explore a potential business relationship (the "Purpose"). Each party may disclose confidential information to the other in connection with the Purpose.

## 2. Definition of Confidential Information

"Confidential Information" means any information disclosed by either party, directly or indirectly, in writing, orally, or by inspection, that is designated as "Confidential" or that reasonably should be understood to be confidential.

## 3. Obligations

The Receiving Party agrees to:

(a) Hold all Confidential Information in strict confidence using the same degree of care it uses to protect its own confidential information, but no less than reasonable care;

(b) Not disclose any Confidential Information to third parties without prior written consent;

(c) Use Confidential Information solely for the Purpose described herein;

(d) Limit access to those employees or contractors who need to know for the Purpose.

## 4. Exclusions

Obligations do not apply to information that: (a) becomes publicly known through no breach of this Agreement; (b) was rightfully known before disclosure; (c) is independently developed; (d) is required to be disclosed by law.

## 5. Term

This Agreement shall remain in effect for **two (2) years** from the Effective Date.

## 6. Return of Information

Upon request, the Receiving Party shall promptly return or destroy all Confidential Information.

## 7. Governing Law

This Agreement is governed by the laws of the State of **[STATE]**.

---

**[PARTY A NAME]**

Signature: ___________________________ Date: ____________
Name: ______________________________ Title: ____________

**[PARTY B NAME]**

Signature: ___________________________ Date: ____________
Name: ______________________________ Title: ____________`,

termsheet:`# TERM SHEET

**Date:** [DATE]
**Company:** [COMPANY NAME] (the "Company")
**Investor:** [INVESTOR NAME] (the "Investor")

*This term sheet is non-binding except where expressly indicated.*

---

## Investment Summary

| Term | Detail |
|------|--------|
| Investment Amount | $[AMOUNT] |
| Pre-Money Valuation | $[VALUATION] |
| Security Type | Series [A/B] Preferred Stock |
| Price Per Share | $[PRICE] |
| Post-Money Valuation | $[POST-MONEY] |

---

## 1. Securities

The Company will issue [SHARES] shares of Series [X] Preferred Stock at $[PRICE] per share for aggregate proceeds of $[AMOUNT].

## 2. Dividends

Non-cumulative dividends at [8]% per annum when declared by the Board.

## 3. Liquidation Preference

[1x] the Original Issue Price plus declared dividends, in preference to common stockholders.

## 4. Conversion

Convertible at the holder's option into [1] share of Common Stock, subject to standard adjustments.

## 5. Anti-Dilution

Weighted-average anti-dilution protection.

## 6. Board Composition

[5] directors: [2] by Investor, [2] by common holders, [1] independent.

## 7. Information Rights

Audited annual financials within 120 days; unaudited quarterly within 45 days.

## 8. Pro Rata Rights

Investor may participate in future rounds to maintain ownership percentage.

## 9. Exclusivity *[BINDING]*

[30] days exclusivity following execution — Company shall not solicit alternative proposals.

## 10. Expenses

Company pays reasonable Investor legal fees up to $[25,000].

---

**[COMPANY NAME]** By: _______________________ Date: _________

**[INVESTOR NAME]** By: _______________________ Date: _________`,

employment:`# EMPLOYMENT AGREEMENT

**Effective Date:** [START DATE]
**Employer:** [COMPANY NAME] ("Company")
**Employee:** [EMPLOYEE FULL NAME] ("Employee")

---

## 1. Position and Duties

Company employs Employee as **[JOB TITLE]**, reporting to [MANAGER]. Employee shall perform all duties associated with this role and such other duties as assigned.

## 2. Compensation

**Base Salary:** $[ANNUAL SALARY] per year, paid on standard payroll schedule.

**Performance Bonus:** Up to [X]% of base salary annually, at Company's discretion.

**Equity:** Options to purchase [SHARES] shares at fair market value, vesting over 4 years with a 1-year cliff, subject to Board approval.

## 3. Benefits

- Health, dental, and vision insurance (Company pays [80]% of premiums)
- [15] days paid vacation per year
- [10] days paid sick leave per year
- 401(k) with [4]% Company match
- $[2,500] annual professional development stipend

## 4. At-Will Employment

This is an at-will employment relationship. Either party may terminate at any time, with or without cause, subject to Section 5.

## 5. Termination Notice

(a) For Cause by Company: Immediate, no severance.
(b) Without Cause by Company: [4] weeks written notice or equivalent pay.
(c) Resignation by Employee: [2] weeks written notice.

## 6. Confidentiality and IP

Employee agrees to execute the Company's Confidential Information and Invention Assignment Agreement as a condition of employment.

## 7. Non-Solicitation

During employment and [12] months after, Employee shall not solicit Company employees or customers.

## 8. Governing Law

Laws of **[STATE]**.

---

**[COMPANY NAME]**

By: _________________________ Name: _________________ Title: _____________ Date: _________

**Employee:**

Signature: _____________________ Name: [EMPLOYEE NAME] Date: _________`,

consulting:`# CONSULTING AGREEMENT

**Effective Date:** [DATE]
**Client:** [CLIENT NAME] ("Client")
**Consultant:** [CONSULTANT NAME] ("Consultant")

---

## 1. Services

Consultant will provide consulting services as described in Statement of Work attached as **Exhibit A**.

## 2. Term

Commences [START DATE] and continues until [END DATE], unless earlier terminated.

## 3. Compensation

**Rate:** $[RATE] per [hour/day/project]
**Invoicing:** [Monthly] invoices submitted to [BILLING CONTACT]
**Payment:** Net [30] days from invoice receipt
**Late Fee:** 1.5% per month on overdue amounts

## 4. Independent Contractor

Consultant is an independent contractor, not an employee. Consultant is responsible for all taxes on compensation received.

## 5. Intellectual Property

All work product and deliverables are "work made for hire" owned by Client. Consultant assigns all rights to Client.

## 6. Confidentiality

Consultant shall maintain strict confidentiality of all Client information, during and after this Agreement.

## 7. Termination

Either party may terminate upon [14] days written notice.

## 8. Limitation of Liability

IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.

---

**CLIENT:** _________________________ Date: _________

**CONSULTANT:** ____________________ Date: _________`,

service:`# SERVICE AGREEMENT

**Agreement Date:** [DATE]
**Provider:** [PROVIDER NAME] ("Provider")
**Client:** [CLIENT NAME] ("Client")

---

## 1. Services

Provider will perform services per the **Statement of Work (SOW)** attached as Exhibit A.

## 2. Term

Effective [START DATE] through [END DATE], auto-renewing for [12]-month terms with [60] days written notice to cancel.

## 3. Fees and Payment

**Fee:** $[AMOUNT] per [month/project]
**Invoicing:** Monthly in advance
**Due:** [30] days from invoice
**Late Payment:** 1.5% per month after [10]-day grace period

## 4. Service Levels

Provider shall meet SLAs in Exhibit B. Failures entitle Client to service credits per Exhibit B.

## 5. Change Orders

Changes to scope require written Change Order before implementation.

## 6. Intellectual Property

Pre-existing IP remains with its original owner. Client-specific deliverables owned by Client upon full payment.

## 7. Termination

(a) For material breach: [30] days written notice if uncured.
(b) For convenience by Client: [60] days written notice.
(c) Provider shall deliver all Client data within [10] business days of termination.

## 8. Limitation of Liability

Provider's aggregate liability shall not exceed fees paid in the preceding [3] months.

---

**PROVIDER:** _______________________ Date: _________

**CLIENT:** _________________________ Date: _________`,

partnership:`# GENERAL PARTNERSHIP AGREEMENT

**Effective Date:** [DATE]

**Partners:**
1. [PARTNER 1 NAME] ("Partner 1")
2. [PARTNER 2 NAME] ("Partner 2")

---

## 1. Formation

The partners form a general partnership under the laws of **[STATE]**.

## 2. Business Name

The Partnership shall operate as **[BUSINESS NAME]**.

## 3. Purpose

**[DESCRIBE BUSINESS PURPOSE]**

## 4. Capital Contributions

| Partner | Contribution | Ownership % |
|---------|-------------|-------------|
| Partner 1 | $[AMOUNT] | [X]% |
| Partner 2 | $[AMOUNT] | [Y]% |

## 5. Profits and Losses

Allocated in proportion to ownership percentages.

## 6. Management

Equal management rights. Decisions requiring unanimous consent: amendments to this Agreement, admission of new partners, transactions exceeding $[THRESHOLD], sale or dissolution.

## 7. Compensation

Partners may draw $[AMOUNT] per year by unanimous approval. Distributions made [quarterly] from available cash flow.

## 8. Partner Withdrawal

[90] days written notice required. Remaining partners have right of first refusal to purchase the interest at fair market value.

## 9. Dissolution

Upon: (a) unanimous written consent; (b) death, incapacity, or withdrawal without succession; (c) judicial decree.

---

**PARTNER 1:** _______________________ Date: _________

**PARTNER 2:** _______________________ Date: _________`,

licensing:`# SOFTWARE LICENSE AGREEMENT

**Effective Date:** [DATE]
**Licensor:** [LICENSOR NAME] ("Licensor")
**Licensee:** [LICENSEE NAME] ("Licensee")

---

## 1. Grant of License

Licensor grants Licensee a **[non-exclusive / exclusive]**, non-transferable, worldwide license to use **[SOFTWARE NAME]** (the "Software") solely for **[PERMITTED USE]**.

## 2. Restrictions

Licensee shall NOT: (a) sublicense, sell, or transfer the Software; (b) reverse engineer or decompile; (c) remove proprietary notices; (d) use to develop competing products.

## 3. License Fee

**Fee:** $[AMOUNT] per [user/year]
**Payment:** [Annually] in advance, non-refundable

## 4. Term

**[1] year**, automatically renewing unless either party provides [30] days written notice of non-renewal.

## 5. Ownership

The Software remains the exclusive property of Licensor. No ownership rights are granted to Licensee.

## 6. Warranty Disclaimer

THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

## 7. Termination

Either party may terminate upon [30] days written notice of material breach not cured within such period.

---

**LICENSOR:** ________________________ Date: _________

**LICENSEE:** ________________________ Date: _________`,

contractor:`# INDEPENDENT CONTRACTOR AGREEMENT

**Date:** [DATE]
**Company:** [COMPANY NAME] ("Company")
**Contractor:** [CONTRACTOR NAME] ("Contractor")

---

## 1. Services

Contractor agrees to provide services as described in **Schedule A**.

## 2. Compensation

**Rate:** $[AMOUNT] per [hour/project]
**Invoicing:** [Bi-weekly] invoices to [CONTACT]
**Payment:** Within [15] business days of approved invoice

## 3. Independent Contractor Status

Contractor is an independent contractor, not an employee. No employer-employee, agency, or joint venture relationship is created.

## 4. No Benefits

Contractor is NOT entitled to employee benefits of any kind.

## 5. Taxes

Contractor is solely responsible for all federal, state, and local taxes. Company will issue Form 1099-NEC as required.

## 6. Work Product

All deliverables are "work made for hire" and owned exclusively by Company. Contractor assigns all rights.

## 7. Confidentiality

Contractor shall maintain strict confidentiality of all Company information.

## 8. Non-Solicitation

For [6] months after termination, Contractor shall not solicit Company's employees or clients.

## 9. Termination

Either party may terminate with [7] days written notice. Company may terminate immediately for cause.

---

**COMPANY:**

By: _________________________ Title: _____________ Date: _________

**CONTRACTOR:**

Signature: _____________________ Date: _________`,

loi:`# LETTER OF INTENT

**Date:** [DATE]
**To:** [TARGET COMPANY NAME]
**From:** [ACQUIRER/SENDER NAME]
**Re:** [DEAL DESCRIPTION]

---

Dear [RECIPIENT NAME],

This Letter of Intent ("LOI") sets forth the principal terms under which **[ACQUIRER]** ("Buyer") proposes to acquire **[TARGET]** ("Seller").

---

## 1. Transaction Structure

Buyer proposes to acquire [100%] of the outstanding equity interests of Seller through a [stock purchase / asset purchase / merger].

## 2. Purchase Price

**Total Consideration:** $[AMOUNT]

- $[AMOUNT] cash at closing
- $[AMOUNT] seller notes over [X] years at [X]% interest
- $[AMOUNT] earnout tied to [METRIC] over [X] years

## 3. Due Diligence

Buyer requires **[45] days** to complete legal, financial, and operational due diligence.

## 4. Conditions to Closing

(a) Satisfactory completion of due diligence; (b) Execution of definitive agreements; (c) Required consents and regulatory approvals; (d) No material adverse change.

## 5. Representations and Warranties

Standard reps and warranties with indemnification cap of [X]% of purchase price; [12]-month survival period.

## 6. Exclusivity *[BINDING]*

**[45] days** exclusivity — Seller shall not solicit or entertain alternative proposals.

## 7. Confidentiality *[BINDING]*

Both parties shall keep this LOI and all discussions strictly confidential.

## 8. Non-Binding

Except Sections 6, 7, and 8, **this LOI is non-binding**.

---

**[ACQUIRER/SENDER]:**

By: _________________________ Name: _____________ Title: _____________ Date: _________

**ACCEPTED AND AGREED:**

By: _________________________ Name: _____________ Title: _____________ Date: _________`,
};

const DEMO_DOCS: ContractDoc[] = [
  {
    id:"doc-001", title:"Acme Corp — Mutual NDA", category:"nda", status:"sent",
    created:"Apr 25, 2026", updated:"Apr 28, 2026",
    signers:[
      {id:"s1",name:"Brian Bradley",email:"bribradley@gmail.com",role:"Disclosing Party",status:"signed",color:"#818CF8",signedAt:"Apr 28, 2026"},
      {id:"s2",name:"Sarah Chen",email:"sarah@acme.com",role:"Receiving Party",status:"pending",color:"#34D399"},
    ],
    content: TEMPLATES.nda,
  },
  {
    id:"doc-002", title:"Series A Term Sheet — Draft", category:"termsheet", status:"draft",
    created:"Apr 27, 2026", updated:"Apr 30, 2026",
    signers:[], content: TEMPLATES.termsheet,
  },
  {
    id:"doc-003", title:"Senior Engineer Offer Letter", category:"employment", status:"completed",
    created:"Apr 20, 2026", updated:"Apr 22, 2026",
    signers:[
      {id:"s3",name:"Brian Bradley",email:"bribradley@gmail.com",role:"Employer",status:"signed",color:"#818CF8",signedAt:"Apr 22, 2026",signature:"Brian Bradley"},
      {id:"s4",name:"Alex Rivera",email:"alex@example.com",role:"Employee",status:"signed",color:"#FFC940",signedAt:"Apr 22, 2026",signature:"Alex Rivera"},
    ],
    content: TEMPLATES.employment,
  },
  {
    id:"doc-004", title:"Design Agency Consulting Agreement", category:"consulting", status:"draft",
    created:"Apr 29, 2026", updated:"Apr 30, 2026",
    signers:[], content: TEMPLATES.consulting,
  },
];

const CAT_GROUPS = [
  {label:"Agreements",   cats:["nda","service","consulting","licensing"] as DocCategory[]},
  {label:"Corporate",    cats:["termsheet","partnership","loi"] as DocCategory[]},
  {label:"Employment",   cats:["employment","contractor"] as DocCategory[]},
];

function renderMarkdown(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return <h1 key={i} style={{fontSize:22,fontWeight:700,margin:"0 0 20px",color:"var(--text)",fontFamily:"var(--serif)",letterSpacing:"-0.02em"}}>{line.slice(2)}</h1>;
    if (line.startsWith("## "))
      return <h2 key={i} style={{fontSize:14,fontWeight:700,margin:"28px 0 10px",color:"var(--text)",borderBottom:"1px solid var(--line)",paddingBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{line.slice(3)}</h2>;
    if (line.startsWith("### "))
      return <h3 key={i} style={{fontSize:13,fontWeight:600,margin:"20px 0 6px",color:"var(--text)"}}>{line.slice(4)}</h3>;
    if (line.startsWith("---"))
      return <hr key={i} style={{border:"none",borderTop:"1px solid var(--line)",margin:"20px 0"}}/>;
    if (line.startsWith("| "))
      return <div key={i} style={{fontSize:12,color:"var(--text-2)",fontFamily:"var(--mono)",marginBottom:2,lineHeight:1.6}}>{line}</div>;
    if (/^(\(a\)|\(b\)|\(c\)|\(d\)|- )/.test(line))
      return <div key={i} style={{fontSize:13,color:"var(--text-2)",marginBottom:5,paddingLeft:16,lineHeight:1.7}}>{line}</div>;
    if (line.trim()==="") return <div key={i} style={{height:10}}/>;
    const bold = line.split(/(\*\*[^*]+\*\*)/).map((p,j) =>
      p.startsWith("**")&&p.endsWith("**")
        ? <strong key={j} style={{color:"var(--text)",fontWeight:600}}>{p.slice(2,-2)}</strong>
        : p
    );
    return <p key={i} style={{fontSize:13,color:"var(--text-2)",lineHeight:1.75,margin:"0 0 6px"}}>{bold}</p>;
  });
}

export default function ContractLabPage() {
  const [docs, setDocs] = useState<ContractDoc[]>(DEMO_DOCS);
  const [selectedId, setSelectedId] = useState("doc-001");
  const [rightTab, setRightTab] = useState<RightTab>("sign");
  const [showRight, setShowRight] = useState(true);
  const [catFilter, setCatFilter] = useState<DocCategory|"all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigMode, setSigMode] = useState<SignMode>("draw");
  const [typedSig, setTypedSig] = useState("");
  const [activeSigner, setActiveSigner] = useState<string|null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocCat, setNewDocCat] = useState<DocCategory>("nda");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newSignerName, setNewSignerName] = useState("");
  const [newSignerEmail, setNewSignerEmail] = useState("");
  const [newSignerRole, setNewSignerRole] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selected = docs.find(d=>d.id===selectedId) || docs[0];

  useEffect(()=>{try{const s=localStorage.getItem("contractlab_docs");if(s)setDocs(JSON.parse(s));}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem("contractlab_docs",JSON.stringify(docs));}catch{};},[docs]);
  useEffect(()=>{
    if(selected){
      setEmailSubject(`Please sign: ${selected.title}`);
      setEmailMsg(`Hi,\n\nPlease review and sign the attached document:\n\n"${selected.title}"\n\nThank you.`);
    }
  },[selectedId]);

  const startDraw = useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current; if(!c)return;
    const ctx=c.getContext("2d"); if(!ctx)return;
    setIsDrawing(true); setHasDrawing(true);
    const r=c.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX-r.left,e.clientY-r.top);
  },[]);
  const draw = useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(!isDrawing)return;
    const c=canvasRef.current; if(!c)return;
    const ctx=c.getContext("2d"); if(!ctx)return;
    const r=c.getBoundingClientRect();
    ctx.lineTo(e.clientX-r.left,e.clientY-r.top);
    ctx.strokeStyle="#2D72D2"; ctx.lineWidth=2; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.stroke();
  },[isDrawing]);
  const endDraw = useCallback(()=>setIsDrawing(false),[]);
  const clearCanvas = ()=>{
    const c=canvasRef.current; if(!c)return;
    c.getContext("2d")?.clearRect(0,0,c.width,c.height);
    setHasDrawing(false);
  };

  const applySignature = ()=>{
    if(!activeSigner||!selected)return;
    const sigValue = sigMode==="draw" ? (canvasRef.current?.toDataURL()||"") : typedSig;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{
      ...d,
      signers:d.signers.map(s=>s.id!==activeSigner?s:
        {...s,status:"signed" as SignerStatus,signature:sigValue,signedAt:"Apr 30, 2026"}),
      status:d.signers.filter(s=>s.id!==activeSigner).every(s=>s.status==="signed")?"completed":"sent" as DocStatus,
    }));
    setShowSigModal(false); setActiveSigner(null); setHasDrawing(false); setTypedSig("");
  };

  const addSigner = ()=>{
    if(!newSignerName||!newSignerEmail||!selected)return;
    const idx=selected.signers.length;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{
      ...d,
      signers:[...d.signers,{
        id:`s-${Date.now()}`,name:newSignerName,email:newSignerEmail,
        role:newSignerRole||"Signer",status:"pending",color:SIGNER_COLORS[idx%SIGNER_COLORS.length],
      }],
    }));
    setNewSignerName(""); setNewSignerEmail(""); setNewSignerRole("");
  };

  const removeSigner = (sid:string)=>{
    if(!selected)return;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{...d,signers:d.signers.filter(s=>s.id!==sid)}));
  };

  const sendForSigning = ()=>{
    if(!selected||selected.signers.length===0)return;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{...d,status:"sent"}));
    setEmailSent(true); setTimeout(()=>setEmailSent(false),3500);
  };

  const createDoc = ()=>{
    if(!newDocTitle)return;
    const doc:ContractDoc={
      id:`doc-${Date.now()}`,title:newDocTitle,category:newDocCat,status:"draft",
      created:"Apr 30, 2026",updated:"Apr 30, 2026",signers:[],content:TEMPLATES[newDocCat],
    };
    setDocs(prev=>[...prev,doc]); setSelectedId(doc.id);
    setShowNewDoc(false); setNewDocTitle("");
  };

  const deleteDoc = (id:string)=>{
    setDocs(prev=>prev.filter(d=>d.id!==id));
    if(selectedId===id){const rem=docs.filter(d=>d.id!==id);if(rem.length)setSelectedId(rem[0].id);}
  };

  const flash = (msg:string)=>{ setExportMsg(msg); setTimeout(()=>setExportMsg(""),3500); };

  const exportMd = ()=>{
    if(!selected)return;
    const b=new Blob([selected.content],{type:"text/markdown"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(b);
    a.download=`${selected.title}.md`; a.click(); flash("Markdown downloaded");
  };
  const exportTxt = ()=>{
    if(!selected)return;
    const plain=selected.content.replace(/#{1,6}\s/g,"").replace(/\*\*/g,"");
    const b=new Blob([plain],{type:"text/plain"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(b);
    a.download=`${selected.title}.txt`; a.click(); flash("Plain text downloaded");
  };
  const exportPdf = ()=>{ window.print(); flash("Print dialog opened — save as PDF"); };
  const exportGoogleDocs = ()=>{ window.open("https://docs.google.com/document/create","_blank"); flash("Opened Google Docs — paste to import"); };

  const filteredDocs = docs.filter(d=>{
    const mc = catFilter==="all"||d.category===catFilter;
    const ms = statusFilter==="all"||d.status===statusFilter;
    const mq = !search||d.title.toLowerCase().includes(search.toLowerCase());
    return mc&&ms&&mq;
  });

  const tmeta = CAT_META[selected?.category||"nda"];
  const canSign = sigMode==="draw"?hasDrawing:typedSig.trim().length>0;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--sans)",overflow:"hidden"}}>

      {/* Topbar */}
      <header style={{display:"flex",alignItems:"center",gap:14,padding:"0 20px",height:52,borderBottom:"1px solid var(--line)",background:"var(--surface-1)",flexShrink:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,borderRadius:8,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2.5" y="1.5" width="10" height="12" rx="1.5" stroke="white" strokeWidth="1.3"/><path d="M5 5.5h5M5 8h5M5 10.5h3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <span style={{fontSize:14,fontWeight:700,letterSpacing:"-0.02em"}}>ContractLab</span>
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>setShowNewDoc(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:7,background:"var(--accent)",border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:"-0.01em"}}>
          <span style={{fontSize:17,lineHeight:1,marginTop:-1}}>+</span> New Document
        </button>
        <button onClick={()=>setShowRight(v=>!v)} style={{padding:"6px 12px",borderRadius:7,background:showRight?"var(--accent-soft)":"var(--surface-2)",border:`1px solid ${showRight?"var(--accent)":"var(--line)"}`,color:showRight?"var(--accent)":"var(--text-3)",fontSize:11,cursor:"pointer",fontWeight:500}}>
          {showRight?"Hide Panel":"Show Panel"}
        </button>
      </header>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Left Sidebar */}
        <aside style={{width:236,background:"var(--surface-1)",borderRight:"1px solid var(--line)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
          <div style={{padding:"10px 10px 0"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents…"
              style={{width:"100%",padding:"7px 10px",borderRadius:7,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text)",fontSize:12,boxSizing:"border-box",outline:"none"}}/>
          </div>
          {/* Status filter chips */}
          <div style={{display:"flex",gap:4,padding:"8px 10px",flexWrap:"wrap"}}>
            {(["all","draft","sent","completed"] as StatusFilter[]).map(sf=>(
              <button key={sf} onClick={()=>setStatusFilter(sf)} style={{padding:"3px 8px",borderRadius:5,background:statusFilter===sf?"var(--accent-soft)":"transparent",border:`1px solid ${statusFilter===sf?"var(--accent)":"var(--line)"}`,color:statusFilter===sf?"var(--accent)":"var(--text-3)",fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
                {sf==="all"?"All":sf.charAt(0).toUpperCase()+sf.slice(1)}
              </button>
            ))}
          </div>
          {/* Category nav */}
          <div style={{overflowY:"auto",flex:1,padding:"0 6px 6px"}}>
            <button onClick={()=>setCatFilter("all")} style={{width:"100%",textAlign:"left",padding:"6px 8px",borderRadius:6,background:catFilter==="all"?"var(--accent-soft)":"transparent",border:"none",color:catFilter==="all"?"var(--accent)":"var(--text-2)",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontWeight:600}}>All Documents</span>
              <span style={{fontSize:10,opacity:0.6}}>{docs.length}</span>
            </button>
            {CAT_GROUPS.map(g=>(
              <div key={g.label}>
                <div style={{padding:"10px 8px 4px",fontSize:10,fontWeight:600,letterSpacing:"0.07em",color:"var(--text-4)",textTransform:"uppercase"}}>{g.label}</div>
                {g.cats.map(cat=>{
                  const m=CAT_META[cat]; const cnt=docs.filter(d=>d.category===cat).length;
                  return (
                    <button key={cat} onClick={()=>setCatFilter(cat)} style={{width:"100%",textAlign:"left",padding:"6px 8px",borderRadius:6,background:catFilter===cat?"var(--accent-soft)":"transparent",border:"none",color:catFilter===cat?"var(--accent)":"var(--text-2)",fontSize:11.5,cursor:"pointer",display:"flex",alignItems:"center",gap:7,marginBottom:1}}>
                      <span style={{fontSize:13}}>{m.icon}</span>
                      <span style={{flex:1}}>{m.label}</span>
                      {cnt>0&&<span style={{fontSize:10,opacity:0.5}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Document list */}
          <div style={{borderTop:"1px solid var(--line)",overflowY:"auto",maxHeight:280,padding:"6px 6px 8px"}}>
            <div style={{padding:"4px 8px 5px",fontSize:10,fontWeight:600,letterSpacing:"0.07em",color:"var(--text-4)",textTransform:"uppercase"}}>Documents</div>
            {filteredDocs.map(doc=>{
              const sm=STATUS_META[doc.status]; const cm=CAT_META[doc.category];
              const active=doc.id===selectedId;
              return (
                <div key={doc.id} style={{position:"relative",marginBottom:2}}>
                  <button onClick={()=>setSelectedId(doc.id)} style={{width:"100%",textAlign:"left",padding:"8px 28px 8px 8px",borderRadius:7,background:active?"var(--surface-2)":"transparent",border:active?"1px solid var(--line-strong)":"1px solid transparent",color:"var(--text)",fontSize:12,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:13}}>{cm.icon}</span>
                      <span style={{fontSize:11,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.title}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:sm.color,flexShrink:0}}/>
                      <span style={{fontSize:10,color:sm.color}}>{sm.label}</span>
                      <span style={{fontSize:10,color:"var(--text-4)",marginLeft:"auto"}}>{doc.updated}</span>
                    </div>
                  </button>
                  <button onClick={()=>deleteDoc(doc.id)} title="Delete" style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"var(--text-4)",fontSize:14,cursor:"pointer",padding:"2px 4px",opacity:0,transition:"opacity 0.15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.opacity="1")} onMouseLeave={e=>(e.currentTarget.style.opacity="0")}>
                    ×
                  </button>
                </div>
              );
            })}
            {filteredDocs.length===0&&<div style={{padding:"12px 8px",fontSize:11,color:"var(--text-4)",textAlign:"center"}}>No documents found</div>}
          </div>
        </aside>

        {/* Main document area */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {selected?(
            <>
              {/* Doc header bar */}
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 24px",borderBottom:"1px solid var(--line)",background:"var(--surface-1)",flexShrink:0}}>
                <span style={{fontSize:22}}>{tmeta.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                    <span style={{fontSize:11,color:"var(--text-3)"}}>{tmeta.label}</span>
                    <span style={{color:"var(--line-strong)"}}>·</span>
                    <span style={{width:6,height:6,borderRadius:"50%",background:STATUS_META[selected.status].color}}/>
                    <span style={{fontSize:11,color:STATUS_META[selected.status].color}}>{STATUS_META[selected.status].label}</span>
                    <span style={{color:"var(--line-strong)"}}>·</span>
                    <span style={{fontSize:11,color:"var(--text-4)"}}>Updated {selected.updated}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {selected.signers.map(s=>(
                    <div key={s.id} title={`${s.name} — ${SIGNER_STATUS[s.status].label}`}
                      style={{width:28,height:28,borderRadius:"50%",background:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",border:`2px solid ${s.status==="signed"?"#3DCC91":"var(--surface-1)"}`,flexShrink:0,cursor:"default"}}>
                      {s.name.charAt(0)}
                    </div>
                  ))}
                  <span style={{fontSize:11,color:"var(--text-4)",marginLeft:4}}>{selected.signers.filter(s=>s.status==="signed").length}/{selected.signers.length} signed</span>
                </div>
              </div>

              {/* Document body */}
              <div id="doc-print-area" style={{flex:1,overflowY:"auto",padding:"36px 48px",background:"var(--bg)"}}>
                <div style={{maxWidth:680,margin:"0 auto",background:"var(--surface-1)",borderRadius:12,padding:"52px 60px",border:"1px solid var(--line)",boxShadow:"0 4px 32px rgba(0,0,0,0.35)"}}>
                  {renderMarkdown(selected.content)}
                  {selected.signers.some(s=>s.status==="signed"&&s.signature)&&(
                    <div style={{marginTop:40,paddingTop:28,borderTop:"1px solid var(--line)"}}>
                      <div style={{fontSize:10,color:"var(--text-4)",marginBottom:14,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>Electronic Signatures</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:14}}>
                        {selected.signers.filter(s=>s.status==="signed"&&s.signature).map(s=>(
                          <div key={s.id} style={{background:"var(--surface-2)",borderRadius:10,padding:"14px 18px",border:`1px solid ${s.color}30`,minWidth:160}}>
                            {s.signature?.startsWith("data:")
                              ? <img src={s.signature} style={{height:44,marginBottom:6,display:"block"}} alt="sig"/>
                              : <div style={{fontFamily:"Georgia,serif",fontSize:24,color:s.color,marginBottom:6,fontStyle:"italic"}}>{s.signature}</div>
                            }
                            <div style={{fontSize:11,color:"var(--text-2)",fontWeight:600}}>{s.name}</div>
                            <div style={{fontSize:10,color:"var(--text-3)"}}>{s.role}</div>
                            <div style={{fontSize:10,color:"var(--text-4)",marginTop:3}}>✓ Signed {s.signedAt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom export bar */}
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderTop:"1px solid var(--line)",background:"var(--surface-1)",flexShrink:0}}>
                <span style={{fontSize:11,color:"var(--text-4)",marginRight:2}}>Export:</span>
                {[
                  {label:"PDF",    action:exportPdf},
                  {label:"Google Docs", action:exportGoogleDocs},
                  {label:"Markdown",   action:exportMd},
                  {label:"Plain Text", action:exportTxt},
                ].map(opt=>(
                  <button key={opt.label} onClick={opt.action} style={{padding:"5px 11px",borderRadius:6,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text-2)",fontSize:11,cursor:"pointer"}}>
                    {opt.label}
                  </button>
                ))}
                {exportMsg&&<span style={{fontSize:11,color:"#3DCC91",marginLeft:6}}>✓ {exportMsg}</span>}
              </div>
            </>
          ):(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",fontSize:14}}>Select a document</div>
          )}
        </main>

        {/* Right Panel */}
        {showRight&&selected&&(
          <aside style={{width:304,background:"var(--surface-1)",borderLeft:"1px solid var(--line)",display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{display:"flex",borderBottom:"1px solid var(--line)"}}>
              {(["sign","share","export"] as RightTab[]).map(tab=>(
                <button key={tab} onClick={()=>setRightTab(tab)} style={{flex:1,padding:"11px 0",background:"transparent",border:"none",borderBottom:rightTab===tab?"2px solid var(--accent)":"2px solid transparent",color:rightTab===tab?"var(--accent)":"var(--text-3)",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.03em",textTransform:"uppercase"}}>
                  {tab==="sign"?"Signatures":tab==="share"?"Share & Send":"Export"}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16}}>

              {/* Signatures Tab */}
              {rightTab==="sign"&&(
                <div>
                  <p style={{fontSize:12,color:"var(--text-3)",marginBottom:16,lineHeight:1.5}}>Add signers, track status, and apply electronic signatures.</p>
                  {selected.signers.map(signer=>(
                    <div key={signer.id} style={{background:"var(--surface-2)",borderRadius:8,padding:"10px 12px",marginBottom:8,border:"1px solid var(--line)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:signer.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{signer.name.charAt(0)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{signer.name}</div>
                          <div style={{fontSize:10,color:"var(--text-3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{signer.email}</div>
                        </div>
                        <button onClick={()=>removeSigner(signer.id)} style={{background:"transparent",border:"none",color:"var(--text-4)",fontSize:15,cursor:"pointer",padding:"2px 5px",flexShrink:0}}>×</button>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:SIGNER_STATUS[signer.status].color}}/>
                          <span style={{fontSize:11,color:SIGNER_STATUS[signer.status].color}}>{SIGNER_STATUS[signer.status].label}</span>
                          {signer.signedAt&&<span style={{fontSize:10,color:"var(--text-4)"}}>· {signer.signedAt}</span>}
                        </div>
                        {signer.status!=="signed"&&(
                          <button onClick={()=>{setActiveSigner(signer.id);setShowSigModal(true);}} style={{padding:"3px 10px",borderRadius:5,background:"var(--accent-soft)",border:"1px solid var(--accent)",color:"var(--accent)",fontSize:10,cursor:"pointer",fontWeight:700}}>
                            Sign Now
                          </button>
                        )}
                      </div>
                      {signer.role&&<div style={{fontSize:10,color:"var(--text-4)",marginTop:5}}>Role: {signer.role}</div>}
                    </div>
                  ))}
                  <div style={{background:"var(--surface-2)",borderRadius:8,padding:12,border:"1px dashed var(--line-strong)",marginTop:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Add Signer</div>
                    {[
                      {val:newSignerName,set:setNewSignerName,ph:"Full name"},
                      {val:newSignerEmail,set:setNewSignerEmail,ph:"Email address"},
                      {val:newSignerRole, set:setNewSignerRole, ph:"Role (e.g. Buyer, Employee)"},
                    ].map(({val,set,ph})=>(
                      <input key={ph} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                        style={{width:"100%",padding:"7px 9px",borderRadius:6,background:"var(--surface-3)",border:"1px solid var(--line)",color:"var(--text)",fontSize:11,marginBottom:6,boxSizing:"border-box" as const,outline:"none"}}/>
                    ))}
                    <button onClick={addSigner} disabled={!newSignerName||!newSignerEmail}
                      style={{width:"100%",padding:"8px",borderRadius:6,background:newSignerName&&newSignerEmail?"var(--accent)":"var(--surface-3)",border:"none",color:newSignerName&&newSignerEmail?"#fff":"var(--text-4)",fontSize:11,fontWeight:700,cursor:newSignerName&&newSignerEmail?"pointer":"default"}}>
                      Add Signer
                    </button>
                  </div>
                  {selected.signers.some(s=>s.signedAt)&&(
                    <div style={{marginTop:18}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text-4)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.07em"}}>Audit Trail</div>
                      {selected.signers.filter(s=>s.signedAt).map(s=>(
                        <div key={s.id} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:"#3DCC91",marginTop:4,flexShrink:0}}/>
                          <div><div style={{fontSize:11,color:"var(--text-2)"}}><strong>{s.name}</strong> signed</div><div style={{fontSize:10,color:"var(--text-4)"}}>{s.signedAt} · {s.role}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Share Tab */}
              {rightTab==="share"&&(
                <div>
                  <p style={{fontSize:12,color:"var(--text-3)",marginBottom:16,lineHeight:1.5}}>Send this document to recipients for review or signature.</p>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Recipients</div>
                    {selected.signers.length>0?selected.signers.map(s=>(
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"var(--surface-2)",borderRadius:6,marginBottom:4,border:"1px solid var(--line)"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{s.name.charAt(0)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                          <div style={{fontSize:10,color:"var(--text-3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.email}</div>
                        </div>
                        <span style={{width:5,height:5,borderRadius:"50%",background:SIGNER_STATUS[s.status].color,flexShrink:0}}/>
                      </div>
                    )):(
                      <div style={{padding:"10px",background:"var(--surface-2)",borderRadius:6,fontSize:11,color:"var(--text-4)",textAlign:"center"}}>Add signers in the Signatures tab first</div>
                    )}
                  </div>
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Subject</div>
                    <input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)}
                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text)",fontSize:12,boxSizing:"border-box" as const,outline:"none"}}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Message</div>
                    <textarea value={emailMsg} onChange={e=>setEmailMsg(e.target.value)} rows={4}
                      style={{width:"100%",padding:"8px 10px",borderRadius:6,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text)",fontSize:12,boxSizing:"border-box" as const,outline:"none",resize:"vertical",fontFamily:"var(--sans)"}}/>
                  </div>
                  <button onClick={sendForSigning} disabled={selected.signers.length===0}
                    style={{width:"100%",padding:"10px",borderRadius:8,background:selected.signers.length>0?"var(--accent)":"var(--surface-2)",border:"none",color:selected.signers.length>0?"#fff":"var(--text-4)",fontSize:12,fontWeight:700,cursor:selected.signers.length>0?"pointer":"default",marginBottom:8}}>
                    {emailSent?"✓ Sent for Signing":"Send for Signing"}
                  </button>
                  <button onClick={()=>{const e=selected.signers.map(s=>s.email).join(",");window.open(`mailto:${e}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMsg)}`);}}
                    style={{width:"100%",padding:"8px",borderRadius:8,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text-2)",fontSize:12,cursor:"pointer"}}>
                    Open in Email Client
                  </button>
                  {emailSent&&(
                    <div style={{marginTop:12,padding:"10px 12px",borderRadius:8,background:"rgba(61,204,145,0.1)",border:"1px solid rgba(61,204,145,0.3)",fontSize:12,color:"#3DCC91"}}>
                      ✓ Document sent to {selected.signers.length} recipient{selected.signers.length>1?"s":""}
                    </div>
                  )}
                </div>
              )}

              {/* Export Tab */}
              {rightTab==="export"&&(
                <div>
                  <p style={{fontSize:12,color:"var(--text-3)",marginBottom:16,lineHeight:1.5}}>Download or export your document in multiple formats.</p>
                  {[
                    {label:"PDF Document",     desc:"Print-ready via browser dialog",         icon:"📄",color:"#FF6B6B",action:exportPdf},
                    {label:"Google Docs",      desc:"Open new doc to paste content",          icon:"G", color:"#4285F4",action:exportGoogleDocs},
                    {label:"Markdown (.md)",   desc:"Raw markdown source file",               icon:"#", color:"#818CF8",action:exportMd},
                    {label:"Plain Text (.txt)",desc:"Unformatted text file",                  icon:"T", color:"var(--text-3)",action:exportTxt},
                  ].map(opt=>(
                    <button key={opt.label} onClick={opt.action} style={{width:"100%",textAlign:"left",padding:"12px 14px",borderRadius:8,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text)",fontSize:12,cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:34,height:34,borderRadius:8,background:`${opt.color}18`,border:`1px solid ${opt.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:opt.color,fontWeight:700,flexShrink:0}}>{opt.icon}</div>
                      <div><div style={{fontWeight:600,marginBottom:2}}>{opt.label}</div><div style={{fontSize:10,color:"var(--text-4)"}}>{opt.desc}</div></div>
                    </button>
                  ))}
                  {exportMsg&&<div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:"rgba(61,204,145,0.1)",border:"1px solid rgba(61,204,145,0.3)",fontSize:12,color:"#3DCC91"}}>✓ {exportMsg}</div>}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Signature Modal */}
      {showSigModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:"var(--surface-1)",borderRadius:16,padding:26,width:480,border:"1px solid var(--line)",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>Apply Electronic Signature</div>
                <div style={{fontSize:12,color:"var(--text-3)",marginTop:2}}>{activeSigner&&selected?.signers.find(s=>s.id===activeSigner)?.name}</div>
              </div>
              <button onClick={()=>setShowSigModal(false)} style={{background:"transparent",border:"none",color:"var(--text-3)",fontSize:20,cursor:"pointer",padding:"4px 8px"}}>×</button>
            </div>
            <div style={{display:"flex",gap:4,marginBottom:16,background:"var(--surface-2)",borderRadius:8,padding:3}}>
              {(["draw","type"] as SignMode[]).map(m=>(
                <button key={m} onClick={()=>setSigMode(m)} style={{flex:1,padding:"7px",borderRadius:6,background:sigMode===m?"var(--surface-3)":"transparent",border:sigMode===m?"1px solid var(--line-strong)":"1px solid transparent",color:sigMode===m?"var(--text)":"var(--text-3)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {m==="draw"?"Draw Signature":"Type Signature"}
                </button>
              ))}
            </div>
            {sigMode==="draw"?(
              <div>
                <canvas ref={canvasRef} width={428} height={160}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  style={{width:"100%",height:160,borderRadius:8,background:"#ffffff",border:"1px solid var(--line)",cursor:"crosshair",display:"block"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                  <span style={{fontSize:11,color:"var(--text-4)"}}>Draw your signature with the mouse</span>
                  <button onClick={clearCanvas} style={{padding:"4px 10px",borderRadius:5,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text-3)",fontSize:11,cursor:"pointer"}}>Clear</button>
                </div>
              </div>
            ):(
              <div>
                <input value={typedSig} onChange={e=>setTypedSig(e.target.value)} placeholder="Type your full name"
                  style={{width:"100%",padding:"16px 20px",borderRadius:8,background:"#ffffff",border:"1px solid var(--line)",color:"#1a1a1a",fontSize:28,fontFamily:"Georgia,'Times New Roman',serif",fontStyle:"italic",boxSizing:"border-box" as const,outline:"none"}}/>
                <div style={{fontSize:11,color:"var(--text-4)",marginTop:7}}>Your typed name will appear as your signature on the document</div>
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={()=>setShowSigModal(false)} style={{flex:1,padding:"10px",borderRadius:8,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text-2)",fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={applySignature} disabled={!canSign}
                style={{flex:2,padding:"10px",borderRadius:8,background:canSign?"var(--accent)":"var(--surface-3)",border:"none",color:canSign?"#fff":"var(--text-4)",fontSize:12,fontWeight:700,cursor:canSign?"pointer":"default"}}>
                Apply Signature
              </button>
            </div>
            <div style={{marginTop:14,padding:"10px 12px",borderRadius:8,background:"rgba(45,114,210,0.08)",border:"1px solid rgba(45,114,210,0.2)",fontSize:11,color:"var(--text-3)",lineHeight:1.5}}>
              By clicking "Apply Signature" you agree that your electronic signature has the same legal force as a handwritten signature under applicable law.
            </div>
          </div>
        </div>
      )}

      {/* New Document Modal */}
      {showNewDoc&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:"var(--surface-1)",borderRadius:16,padding:26,width:540,border:"1px solid var(--line)",boxShadow:"0 24px 80px rgba(0,0,0,0.6)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700}}>New Document</div>
              <button onClick={()=>setShowNewDoc(false)} style={{background:"transparent",border:"none",color:"var(--text-3)",fontSize:20,cursor:"pointer",padding:"4px 8px"}}>×</button>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.05em"}}>Document Title</div>
              <input value={newDocTitle} onChange={e=>setNewDocTitle(e.target.value)} placeholder="e.g., Acme Corp — Mutual NDA"
                style={{width:"100%",padding:"9px 12px",borderRadius:8,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text)",fontSize:13,boxSizing:"border-box" as const,outline:"none"}}/>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text-3)",marginBottom:9,textTransform:"uppercase",letterSpacing:"0.05em"}}>Template</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {(Object.entries(CAT_META) as [DocCategory,typeof CAT_META[DocCategory]][]).map(([cat,m])=>(
                  <button key={cat} onClick={()=>setNewDocCat(cat)}
                    style={{padding:"11px 8px",borderRadius:9,background:newDocCat===cat?"var(--accent-soft)":"var(--surface-2)",border:newDocCat===cat?"1px solid var(--accent)":"1px solid var(--line)",color:newDocCat===cat?"var(--accent)":"var(--text-2)",fontSize:11,cursor:"pointer",textAlign:"center" as const}}>
                    <div style={{fontSize:20,marginBottom:5}}>{m.icon}</div>
                    <div style={{fontWeight:600,lineHeight:1.3}}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowNewDoc(false)} style={{flex:1,padding:"10px",borderRadius:8,background:"var(--surface-2)",border:"1px solid var(--line)",color:"var(--text-2)",fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={createDoc} disabled={!newDocTitle}
                style={{flex:2,padding:"10px",borderRadius:8,background:newDocTitle?"var(--accent)":"var(--surface-3)",border:"none",color:newDocTitle?"#fff":"var(--text-4)",fontSize:12,fontWeight:700,cursor:newDocTitle?"pointer":"default"}}>
                Create from Template
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body > * { display: none !important; }
          #doc-print-area { display: block !important; position: fixed; inset: 0; overflow: auto; background: white !important; }
          #doc-print-area > div { box-shadow: none !important; border: none !important; background: white !important; color: black !important; max-width: 100% !important; padding: 40px !important; }
          #doc-print-area h1, #doc-print-area h2, #doc-print-area p, #doc-print-area div { color: black !important; }
        }
        input::placeholder, textarea::placeholder { color: var(--text-4) !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 2px; }
      `}</style>
    </div>
  );
}

