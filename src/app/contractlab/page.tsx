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

const SIGNER_COLORS = ["#4C6EF5","#12B886","#F59F00","#F76707","#15AABF","#E64980"];

const CAT_META: Record<DocCategory,{label:string;short:string;color:string}> = {
  nda:         {label:"Non-Disclosure Agreement", short:"NDA",         color:"#4C6EF5"},
  termsheet:   {label:"Term Sheet",               short:"Term Sheet",  color:"#12B886"},
  employment:  {label:"Employment Agreement",     short:"Employment",  color:"#F59F00"},
  consulting:  {label:"Consulting Agreement",     short:"Consulting",  color:"#F76707"},
  service:     {label:"Service Agreement",        short:"Service",     color:"#15AABF"},
  partnership: {label:"Partnership Agreement",    short:"Partnership", color:"#E64980"},
  licensing:   {label:"License Agreement",        short:"License",     color:"#748FFC"},
  contractor:  {label:"Contractor Agreement",     short:"Contractor",  color:"#A9E34B"},
  loi:         {label:"Letter of Intent",         short:"LOI",         color:"#FF6B6B"},
};

const STATUS_META: Record<DocStatus,{color:string;bg:string;label:string}> = {
  draft:     {color:"#9AA0A6", bg:"rgba(154,160,166,0.12)", label:"Draft"},
  sent:      {color:"#F59F00", bg:"rgba(245,159,0,0.12)",   label:"Sent"},
  completed: {color:"#12B886", bg:"rgba(18,184,134,0.12)",  label:"Completed"},
  declined:  {color:"#FF6B6B", bg:"rgba(255,107,107,0.12)", label:"Declined"},
};

const SIGNER_STATUS: Record<SignerStatus,{color:string;label:string}> = {
  pending:  {color:"#9AA0A6", label:"Pending"},
  viewed:   {color:"#F59F00", label:"Viewed"},
  signed:   {color:"#12B886", label:"Signed"},
  declined: {color:"#FF6B6B", label:"Declined"},
};

const TEMPLATES: Record<DocCategory,string> = {
nda:`# MUTUAL NON-DISCLOSURE AGREEMENT

**Effective Date:** [DATE]
**Between:** [PARTY A NAME], a [STATE] [ENTITY TYPE] ("Disclosing Party")
**And:** [PARTY B NAME], a [STATE] [ENTITY TYPE] ("Receiving Party")

---

## 1. Purpose

The parties wish to explore a potential business relationship (the "Purpose"). Each party may disclose Confidential Information to the other in connection with the Purpose.

## 2. Definition of Confidential Information

"Confidential Information" means any information disclosed by either party, directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as "Confidential" or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.

## 3. Obligations of Receiving Party

The Receiving Party agrees to:

(a) Hold all Confidential Information in strict confidence using at least the same degree of care it uses to protect its own confidential information, but no less than reasonable care;

(b) Not disclose any Confidential Information to any third parties without prior written consent of the Disclosing Party;

(c) Use Confidential Information solely for the Purpose described herein;

(d) Limit access to Confidential Information to employees or contractors who need to know for the Purpose and are bound by confidentiality obligations no less restrictive than this Agreement.

## 4. Exclusions

Obligations do not apply to information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully known before disclosure; (c) is independently developed without use of Confidential Information; (d) is required to be disclosed by applicable law or court order, provided the Receiving Party gives prompt written notice.

## 5. Term

This Agreement shall remain in effect for **two (2) years** from the Effective Date, unless earlier terminated by mutual written agreement.

## 6. Return or Destruction

Upon written request or termination, the Receiving Party shall promptly return or destroy all Confidential Information and certify such return or destruction in writing.

## 7. Injunctive Relief

The parties acknowledge that breach would cause irreparable harm for which monetary damages would be inadequate. The Disclosing Party shall be entitled to seek equitable relief without posting bond or other security.

## 8. Governing Law

This Agreement is governed by the laws of the State of **[STATE]**, without regard to conflict of law principles. Disputes shall be resolved in the courts of [COUNTY], [STATE].

---

**IN WITNESS WHEREOF**, the parties have executed this Agreement as of the Effective Date.

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

*This term sheet is non-binding except where expressly indicated as binding below.*

---

## Investment Summary

| Term | Detail |
|------|--------|
| Investment Amount | $[AMOUNT] |
| Pre-Money Valuation | $[VALUATION] |
| Security Type | Series [A/B] Preferred Stock |
| Price Per Share | $[PRICE] |
| Post-Money Valuation | $[POST-MONEY] |
| Closing Date | [DATE] |

---

## 1. Type and Amount

The Company will issue and sell [SHARES] shares of Series [X] Preferred Stock at $[PRICE] per share for aggregate proceeds of $[AMOUNT].

## 2. Dividends

Non-cumulative dividends at [8]% per annum when and as declared by the Board.

## 3. Liquidation Preference

[1x] the Original Issue Price plus declared but unpaid dividends, in preference to common stockholders upon any liquidation or winding-up event.

## 4. Conversion

Convertible at the holder's option, at any time, into [1] share of Common Stock per Preferred share, subject to standard adjustments for splits, dividends, and recapitalizations.

## 5. Anti-Dilution

Weighted-average anti-dilution protection. No anti-dilution protection for issuances at or above the then-current conversion price.

## 6. Board Composition

[5] directors: [2] designated by Investor, [2] elected by common stockholders, and [1] independent director mutually agreed upon by both groups.

## 7. Information Rights

Audited annual financials within 120 days of fiscal year end; unaudited quarterly financials within 45 days of each quarter end.

## 8. Pro Rata Rights

Investor has the right to participate in subsequent equity financings on a pro-rata basis to maintain ownership percentage.

## 9. Exclusivity *[BINDING]*

For [30] days following execution of this term sheet, the Company shall not solicit, encourage, or entertain alternative acquisition, merger, or financing proposals from third parties.

## 10. Expenses

The Company shall pay reasonable legal fees and expenses of the Investor's counsel, up to $[25,000], at closing.

---

**[COMPANY NAME]**
By: _______________________ Name: _____________ Title: _____________ Date: _________

**[INVESTOR NAME]**
By: _______________________ Name: _____________ Title: _____________ Date: _________`,

employment:`# EMPLOYMENT AGREEMENT

**Effective Date:** [START DATE]
**Employer:** [COMPANY NAME], a [STATE] [ENTITY TYPE] ("Company")
**Employee:** [EMPLOYEE FULL NAME] ("Employee")

---

## 1. Position and Duties

The Company employs Employee in the position of **[JOB TITLE]**, reporting to [MANAGER TITLE]. Employee shall devote Employee's full business time and attention to performing all duties associated with this position and such other duties as reasonably assigned.

## 2. Start Date

Employment commences on **[START DATE]**.

## 3. Compensation

**Base Salary:** $[ANNUAL SALARY] per year, payable in accordance with the Company's standard payroll schedule (currently [bi-weekly / semi-monthly]).

**Annual Bonus:** Employee is eligible for a discretionary performance bonus of up to [X]% of base salary, based on achievement of individual and Company performance goals as determined by the Board.

**Equity Grant:** Subject to Board approval, Employee will be granted an option to purchase [SHARES] shares of Common Stock under the Company's [Year] Equity Incentive Plan, at an exercise price equal to the fair market value per share on the grant date. Shares vest over four (4) years, with a one (1)-year cliff.

## 4. Benefits

Employee shall be eligible for:

(a) Health, dental, and vision insurance (Company pays [80]% of Employee premiums);
(b) [15] days of paid vacation per year, accruing monthly, increasing to [20] days after three years;
(c) [10] days of paid sick leave per year;
(d) 401(k) plan with Company match of [4]% of eligible compensation;
(e) $[2,500] annual professional development and learning stipend.

## 5. At-Will Employment

Employee's employment with the Company is at-will. Either party may terminate the employment relationship at any time, with or without cause or prior notice, subject to Section 6.

## 6. Termination and Severance

(a) **Termination for Cause by Company:** Immediate termination; no severance.
(b) **Termination without Cause by Company:** [4] weeks written notice, or equivalent base salary in lieu thereof.
(c) **Resignation by Employee:** [2] weeks written notice.

## 7. Confidentiality and IP Assignment

As a condition of employment, Employee agrees to execute the Company's standard Confidential Information and Invention Assignment Agreement ("CIIA").

## 8. Non-Solicitation

During the term of employment and for [12] months following termination, Employee shall not directly or indirectly solicit or induce any Company employee to leave the Company, or solicit any Company customer or client.

## 9. Governing Law

This Agreement is governed by the laws of **[STATE]**.

---

**[COMPANY NAME]**

By: _________________________ Name: _________________ Title: _____________ Date: _________

**Employee Acknowledgment and Agreement:**

Signature: _____________________ Printed Name: [EMPLOYEE FULL NAME] Date: _________`,

consulting:`# CONSULTING AGREEMENT

**Effective Date:** [DATE]
**Client:** [CLIENT NAME], a [STATE] [ENTITY TYPE] ("Client")
**Consultant:** [CONSULTANT NAME / COMPANY] ("Consultant")

---

## 1. Services

Consultant agrees to provide the consulting services described in the **Statement of Work** attached hereto as **Exhibit A** (the "Services"). The Services and all deliverables, milestones, and acceptance criteria are set forth in Exhibit A.

## 2. Term

This Agreement commences on **[START DATE]** and continues through **[END DATE]**, unless earlier terminated pursuant to Section 8.

## 3. Compensation and Payment

**Rate:** $[RATE] per [hour / day / project milestone]
**Invoicing:** Consultant shall submit invoices [weekly / monthly] to [BILLING CONTACT / EMAIL]
**Payment Terms:** Net [30] days from Client's receipt of undisputed invoice
**Late Payment:** Overdue balances accrue interest at 1.5% per month (18% per annum)

## 4. Expenses

Reasonable, pre-approved, documented business expenses will be reimbursed by Client within [15] days of submission with supporting receipts.

## 5. Independent Contractor Relationship

Consultant is an independent contractor. Nothing in this Agreement creates an employer-employee, agency, joint venture, or partnership relationship. Consultant has no authority to bind Client to any obligation.

## 6. Intellectual Property

All work product, inventions, discoveries, developments, and deliverables created by Consultant in connection with the Services shall be deemed "work made for hire" and shall be owned exclusively by Client. To the extent any work product is not deemed work for hire by operation of law, Consultant hereby irrevocably assigns all rights, title, and interest thereto to Client.

## 7. Confidentiality

Consultant acknowledges that in the course of performing Services, Consultant may have access to Client's Confidential Information. Consultant agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party; (c) use Confidential Information solely to perform the Services.

## 8. Termination

Either party may terminate this Agreement upon [14] days written notice to the other party. Client may terminate immediately upon written notice for Consultant's material breach.

## 9. Limitation of Liability

IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. EACH PARTY'S TOTAL LIABILITY SHALL NOT EXCEED FEES PAID IN THE [3] MONTHS PRECEDING THE CLAIM.

---

**CLIENT:**
By: _________________________ Name: _________________ Title: _____________ Date: _________

**CONSULTANT:**
By: _________________________ Name: _________________ Date: _________`,

service:`# SERVICE AGREEMENT

**Agreement Date:** [DATE]
**Service Provider:** [PROVIDER NAME] ("Provider")
**Client:** [CLIENT NAME] ("Client")

---

## 1. Services

Provider shall perform the professional services described in the **Statement of Work ("SOW")** attached as **Exhibit A**. Any changes to the SOW require a mutually executed Change Order per Section 5.

## 2. Term

This Agreement is effective as of **[START DATE]** and continues through **[END DATE]**, with automatic renewal for successive [12]-month terms unless either party provides [60] days written notice of non-renewal prior to the then-current term's expiration.

## 3. Fees and Payment

**Service Fee:** $[AMOUNT] per [month / quarter / project]
**Invoicing:** Monthly in advance, issued on the 1st of each month
**Payment Due:** Within [30] days of invoice receipt
**Late Payment:** 1.5% per month on balances outstanding beyond a [10]-day grace period
**Disputed Invoices:** Client must notify Provider in writing within [10] days of receipt

## 4. Service Levels

Provider shall meet the service levels set forth in **Exhibit B (SLA)**. Failure to meet applicable SLAs entitles Client to service credits as specified in Exhibit B, as Client's sole and exclusive remedy for SLA failures.

## 5. Change Orders

Any modification to the scope, timeline, or fees requires a written Change Order signed by authorized representatives of both parties prior to implementation.

## 6. Intellectual Property

Pre-existing IP owned by either party remains the property of that party. Client-specific deliverables created and paid for under this Agreement shall be owned by Client upon receipt of full payment.

## 7. Termination

(a) **For Cause:** Either party may terminate upon [30] days written notice if a material breach remains uncured.
(b) **For Convenience:** Client may terminate upon [60] days written notice; Client shall pay fees through the effective termination date.
(c) **Data Return:** Provider shall deliver all Client data within [10] business days of any termination.

## 8. Limitation of Liability

Provider's aggregate liability under this Agreement shall not exceed fees paid by Client in the [3] months immediately preceding the event giving rise to liability.

---

**PROVIDER:** _________________________ Date: _________

**CLIENT:** ___________________________ Date: _________`,

partnership:`# GENERAL PARTNERSHIP AGREEMENT

**Effective Date:** [DATE]
**Partners:**
1. [PARTNER 1 NAME], an individual residing at [ADDRESS] ("Partner 1")
2. [PARTNER 2 NAME], an individual residing at [ADDRESS] ("Partner 2")

---

## 1. Formation

The Partners hereby form a general partnership (the "Partnership") under and pursuant to the laws of the State of **[STATE]**.

## 2. Business Name

The Partnership shall conduct business under the name **[BUSINESS NAME]**.

## 3. Principal Place of Business

The Partnership's principal place of business shall be located at **[ADDRESS]**.

## 4. Purpose

The Partnership is formed for the purpose of: **[DESCRIBE BUSINESS PURPOSE AND ACTIVITIES]**, and any other lawful activities mutually agreed upon by the Partners.

## 5. Capital Contributions

| Partner | Initial Contribution | Ownership Percentage |
|---------|---------------------|---------------------|
| Partner 1 | $[AMOUNT] | [X]% |
| Partner 2 | $[AMOUNT] | [Y]% |

Additional capital contributions shall require unanimous written consent of all Partners.

## 6. Profits and Losses

Partnership profits and losses shall be allocated among the Partners in proportion to their respective Ownership Percentages as set forth above.

## 7. Management and Decision-Making

Each Partner shall have equal management rights. The following decisions require unanimous written consent of all Partners: (a) amendments to this Agreement; (b) admission of new partners; (c) individual transactions exceeding $[THRESHOLD]; (d) sale of all or substantially all Partnership assets; (e) dissolution of the Partnership.

## 8. Partner Compensation

Partners may receive a management salary of $[AMOUNT] per year, subject to unanimous approval. Distributions from available cash flow shall be made [quarterly] in proportion to Ownership Percentages.

## 9. Books, Records, and Accounting

The Partnership shall maintain complete and accurate books and records. Books shall be maintained on a [cash / accrual] basis with a fiscal year ending December 31. Each Partner shall have access to all Partnership books and records.

## 10. Partner Withdrawal and Buyout

A withdrawing Partner shall provide [90] days written notice. Remaining Partners shall have the right of first refusal to purchase the withdrawing Partner's interest at fair market value as determined by a mutually agreed independent appraiser.

## 11. Dissolution

The Partnership shall be dissolved upon: (a) unanimous written consent of all Partners; (b) death, incapacity, or withdrawal of a Partner without succession; (c) judicial decree of dissolution.

---

**PARTNER 1:**
Signature: _____________________ Name: [PARTNER 1 NAME] Date: _________

**PARTNER 2:**
Signature: _____________________ Name: [PARTNER 2 NAME] Date: _________`,

licensing:`# SOFTWARE LICENSE AGREEMENT

**Effective Date:** [DATE]
**Licensor:** [LICENSOR NAME], a [STATE] [ENTITY TYPE] ("Licensor")
**Licensee:** [LICENSEE NAME], a [STATE] [ENTITY TYPE] ("Licensee")

---

## 1. Grant of License

Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee a **[non-exclusive / exclusive]**, non-transferable, non-sublicensable license to install and use the software product known as **[SOFTWARE NAME]**, including all associated documentation (collectively, the "Software"), solely for **[PERMITTED USE / PURPOSE]** during the Term.

## 2. License Restrictions

Licensee shall NOT, directly or indirectly:

(a) Sublicense, sell, resell, rent, lease, transfer, assign, or otherwise dispose of the Software or any rights therein;
(b) Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Software;
(c) Modify, translate, adapt, or create derivative works based on the Software;
(d) Remove, obscure, or alter any proprietary rights notices or labels on the Software;
(e) Use the Software to develop a competing product or service;
(f) Use the Software in any manner that violates applicable laws or regulations.

## 3. License Fees

**Annual License Fee:** $[AMOUNT] per [user seat / deployment / organization]
**Payment:** Due annually in advance, non-refundable

## 4. Term and Renewal

This Agreement is effective for an initial term of **[1] year** and shall automatically renew for successive [1]-year terms unless either party provides [30] days written notice of non-renewal prior to the expiration of the then-current term.

## 5. Ownership

The Software and all copies thereof, including all intellectual property rights therein, are and shall remain the exclusive property of Licensor. No title or ownership rights are transferred to Licensee under this Agreement.

## 6. Updates and Support

Licensor shall provide [Standard / Premium] support as described in the Support Addendum attached hereto. Major version upgrades may require additional licensing fees.

## 7. Disclaimer of Warranties

THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NONINFRINGEMENT.

## 8. Termination

Either party may terminate this Agreement upon [30] days written notice if the other party materially breaches this Agreement and fails to cure such breach within such notice period. Upon termination, Licensee must immediately uninstall and destroy all copies of the Software.

---

**LICENSOR:**
By: _________________________ Name: _________________ Title: _____________ Date: _________

**LICENSEE:**
By: _________________________ Name: _________________ Title: _____________ Date: _________`,

contractor:`# INDEPENDENT CONTRACTOR AGREEMENT

**Date:** [DATE]
**Company:** [COMPANY NAME], a [STATE] [ENTITY TYPE] ("Company")
**Contractor:** [CONTRACTOR NAME / ENTITY] ("Contractor")

---

## 1. Services

Contractor agrees to provide the services described in **Schedule A** attached hereto (the "Services"). Contractor shall perform the Services in a professional and workmanlike manner consistent with industry standards.

## 2. Compensation

**Rate:** $[AMOUNT] per [hour / project / milestone]
**Invoicing:** Contractor shall submit invoices [bi-weekly / monthly] to [CONTACT / EMAIL]
**Payment:** Company shall pay undisputed invoices within [15] business days of receipt

## 3. Independent Contractor Status

Contractor's relationship with Company is that of an independent contractor. Nothing in this Agreement shall be construed to create an employer-employee, agency, joint venture, or partnership relationship. Contractor shall have no authority to bind Company to any obligation, contract, or commitment.

## 4. No Employee Benefits

As an independent contractor, Contractor is NOT entitled to and shall not receive any employee benefits from Company, including but not limited to: health, dental, or vision insurance; vacation, sick, or holiday pay; workers' compensation; retirement benefits; or participation in any Company employee benefit plan or program.

## 5. Taxes and Withholding

Contractor is solely responsible for all applicable federal, state, and local taxes, including self-employment taxes, arising from compensation received under this Agreement. Company will not withhold any taxes from amounts paid to Contractor. Company shall issue IRS Form 1099-NEC for all payments as required by applicable law.

## 6. Work Product and Intellectual Property

All work product, deliverables, inventions, and developments created by Contractor in connection with the Services shall constitute "work made for hire" owned exclusively by Company. To the extent any work product does not qualify as work for hire, Contractor hereby irrevocably assigns all rights, title, and interest therein to Company.

## 7. Confidentiality

Contractor acknowledges access to Company Confidential Information and agrees to: (a) maintain strict confidentiality; (b) not disclose to any third party; (c) use solely to perform the Services; (d) return or destroy upon request.

## 8. Non-Solicitation

For a period of [6] months following termination of this Agreement, Contractor shall not directly or indirectly solicit, hire, or engage any Company employee, contractor, or customer with whom Contractor had contact during the engagement.

## 9. Term and Termination

Either party may terminate this Agreement upon [7] days written notice. Company may terminate immediately for Contractor's material breach.

---

**COMPANY:**
By: _________________________ Name: _________________ Title: _____________ Date: _________

**CONTRACTOR:**
Signature: _____________________ Name: _________________ Date: _________`,

loi:`# LETTER OF INTENT

**Date:** [DATE]
**To:** [TARGET COMPANY NAME]
**From:** [ACQUIRER / SENDER NAME]
**Re:** Proposed [Acquisition / Investment / Transaction] — [DEAL DESCRIPTION]

---

Dear [RECIPIENT NAME],

This Letter of Intent ("LOI") sets forth the principal terms and conditions under which **[ACQUIRER]** ("Buyer") proposes to acquire **[TARGET]** ("Seller"). This LOI is intended to facilitate the negotiation of a definitive agreement and is non-binding except where expressly stated otherwise below.

---

## 1. Transaction Structure

Buyer proposes to acquire [100% / XX%] of the outstanding equity interests of Seller through a [stock purchase / asset purchase / merger] (the "Transaction").

## 2. Consideration

**Total Purchase Price:** $[AMOUNT]

- $[AMOUNT] in cash at closing ([X]% of total);
- $[AMOUNT] in seller notes, payable over [X] years at [X]% interest per annum; and
- $[AMOUNT] in earnout consideration, contingent on [REVENUE / EBITDA / other] targets over [X] years post-closing.

## 3. Conditions to Closing

The Transaction is conditioned upon: (a) satisfactory completion of legal, financial, tax, and operational due diligence; (b) negotiation and execution of a definitive purchase agreement and all ancillary transaction documents; (c) receipt of all required third-party and regulatory consents and approvals; and (d) no material adverse change in Seller's business, assets, financial condition, or results of operations.

## 4. Representations and Warranties

Seller will provide customary representations and warranties in the definitive agreement. Indemnification for breaches shall be capped at [X]% of the purchase price and shall survive for [12] months post-closing.

## 5. Due Diligence

Buyer requires **[45] calendar days** following execution of this LOI to complete its due diligence review. Seller shall provide Buyer and its advisors with reasonable access to books, records, facilities, and key personnel.

## 6. Exclusivity *[BINDING]*

For **[45] calendar days** following execution of this LOI, Seller and its representatives shall not, directly or indirectly, solicit, initiate, encourage, facilitate, or participate in discussions or negotiations with any other party regarding any acquisition, merger, recapitalization, or similar transaction involving Seller.

## 7. Confidentiality *[BINDING]*

Each party shall keep strictly confidential the existence and contents of this LOI and all related discussions, negotiations, and due diligence materials. The parties' existing Confidentiality Agreement, dated [DATE], is hereby incorporated by reference.

## 8. Transaction Expenses

Each party shall bear its own legal fees, advisory fees, and other transaction expenses. [If applicable: A break-up fee of $[AMOUNT] shall be payable by [party] if [condition].]

## 9. Non-Binding Nature

Except for Sections 6 (Exclusivity), 7 (Confidentiality), and 8 (Transaction Expenses), which are intended to be legally binding, **this LOI does not constitute a legally binding obligation** on either party and is subject to the negotiation, execution, and delivery of a mutually acceptable definitive agreement.

---

Please execute this LOI where indicated below to confirm your agreement with the foregoing.

**[ACQUIRER / SENDER]:**
By: _________________________ Name: _________________ Title: _____________ Date: _________

**ACCEPTED AND AGREED:**
By: _________________________ Name: _________________ Title: _____________ Date: _________`,
};

const CAT_GROUPS = [
  {label:"Agreements",   cats:["nda","service","consulting","licensing"] as DocCategory[]},
  {label:"Corporate",    cats:["termsheet","partnership","loi"] as DocCategory[]},
  {label:"Employment",   cats:["employment","contractor"] as DocCategory[]},
];

const DEMO_DOCS: ContractDoc[] = [
  {
    id:"doc-001", title:"Acme Corp — Mutual NDA", category:"nda", status:"sent",
    created:"Apr 25, 2026", updated:"Apr 28, 2026",
    signers:[
      {id:"s1",name:"Brian Bradley",email:"bribradley@gmail.com",role:"Disclosing Party",status:"signed",color:"#4C6EF5",signedAt:"Apr 28, 2026"},
      {id:"s2",name:"Sarah Chen",email:"sarah@acme.com",role:"Receiving Party",status:"pending",color:"#12B886"},
    ],
    content:TEMPLATES.nda,
  },
  {
    id:"doc-002", title:"Series A Term Sheet", category:"termsheet", status:"draft",
    created:"Apr 27, 2026", updated:"Apr 30, 2026",
    signers:[], content:TEMPLATES.termsheet,
  },
  {
    id:"doc-003", title:"Senior Engineer Offer Letter", category:"employment", status:"completed",
    created:"Apr 20, 2026", updated:"Apr 22, 2026",
    signers:[
      {id:"s3",name:"Brian Bradley",email:"bribradley@gmail.com",role:"Employer",status:"signed",color:"#4C6EF5",signedAt:"Apr 22, 2026",signature:"Brian Bradley"},
      {id:"s4",name:"Alex Rivera",email:"alex@example.com",role:"Employee",status:"signed",color:"#F59F00",signedAt:"Apr 22, 2026",signature:"Alex Rivera"},
    ],
    content:TEMPLATES.employment,
  },
  {
    id:"doc-004", title:"Design Agency Consulting Agreement", category:"consulting", status:"draft",
    created:"Apr 29, 2026", updated:"Apr 30, 2026",
    signers:[], content:TEMPLATES.consulting,
  },
];

// ── Markdown renderer — white paper aesthetic ──────────────────────────────
function renderDoc(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return <h1 key={i} style={{fontFamily:"var(--serif)",fontSize:19,fontWeight:400,letterSpacing:"-0.01em",textAlign:"center",color:"#111827",margin:"0 0 36px",lineHeight:1.3}}>{line.slice(2)}</h1>;
    if (line.startsWith("## "))
      return <h2 key={i} style={{fontFamily:"var(--sans)",fontSize:9.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#6B7280",margin:"36px 0 14px",paddingBottom:8,borderBottom:"1px solid #E5E7EB"}}>{line.slice(3)}</h2>;
    if (line.startsWith("---"))
      return <hr key={i} style={{border:"none",borderTop:"1px solid #E5E7EB",margin:"28px 0"}}/>;
    if (line.startsWith("| "))
      return <div key={i} style={{fontFamily:"var(--mono)",fontSize:11.5,color:"#374151",marginBottom:2,lineHeight:1.7,borderBottom:"1px solid #F3F4F6",paddingBottom:2}}>{line}</div>;
    if (/^\(([a-d])\)/.test(line))
      return <div key={i} style={{fontFamily:"var(--serif)",fontSize:13.5,color:"#374151",marginBottom:6,paddingLeft:20,lineHeight:1.75}}>{line}</div>;
    if (line.startsWith("- "))
      return <div key={i} style={{fontFamily:"var(--serif)",fontSize:13.5,color:"#374151",marginBottom:5,paddingLeft:16,lineHeight:1.75,display:"flex",gap:10}}><span style={{color:"#9CA3AF",flexShrink:0}}>—</span><span>{line.slice(2)}</span></div>;
    if (line.trim()==="") return <div key={i} style={{height:10}}/>;
    const bold = line.split(/(\*\*[^*]+\*\*)/).map((p,j)=>
      p.startsWith("**")&&p.endsWith("**")
        ? <strong key={j} style={{color:"#111827",fontWeight:600}}>{p.slice(2,-2)}</strong>
        : p.startsWith("*")&&p.endsWith("*")&&p.length>2
          ? <em key={j} style={{color:"#4B5563"}}>{p.slice(1,-1)}</em>
          : p
    );
    return <p key={i} style={{fontFamily:"var(--serif)",fontSize:13.5,color:"#374151",lineHeight:1.8,margin:"0 0 6px"}}>{bold}</p>;
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

  const selected = docs.find(d=>d.id===selectedId) ?? docs[0];

  useEffect(()=>{try{const s=localStorage.getItem("cl_docs_v2");if(s)setDocs(JSON.parse(s));}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem("cl_docs_v2",JSON.stringify(docs));}catch{};},[docs]);
  useEffect(()=>{
    if(selected){setEmailSubject(`Signature required: ${selected.title}`);setEmailMsg(`Hi,\n\nPlease review and sign the following document:\n\n"${selected.title}"\n\nThank you.`);}
  },[selectedId]);

  const startDraw = useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");if(!ctx)return;
    setIsDrawing(true);setHasDrawing(true);
    const r=c.getBoundingClientRect();
    ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);
  },[]);
  const draw = useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(!isDrawing)return;
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");if(!ctx)return;
    const r=c.getBoundingClientRect();
    ctx.lineTo(e.clientX-r.left,e.clientY-r.top);
    ctx.strokeStyle="#111827";ctx.lineWidth=1.8;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
  },[isDrawing]);
  const endDraw = useCallback(()=>setIsDrawing(false),[]);
  const clearCanvas = ()=>{
    const c=canvasRef.current;if(!c)return;
    c.getContext("2d")?.clearRect(0,0,c.width,c.height);
    setHasDrawing(false);
  };

  const applySignature = ()=>{
    if(!activeSigner||!selected)return;
    const sigValue=sigMode==="draw"?(canvasRef.current?.toDataURL()||""):typedSig;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{
      ...d,
      signers:d.signers.map(s=>s.id!==activeSigner?s:{...s,status:"signed" as SignerStatus,signature:sigValue,signedAt:"Apr 30, 2026"}),
      status:d.signers.filter(s=>s.id!==activeSigner).every(s=>s.status==="signed")?"completed":"sent" as DocStatus,
    }));
    setShowSigModal(false);setActiveSigner(null);setHasDrawing(false);setTypedSig("");
  };

  const addSigner = ()=>{
    if(!newSignerName||!newSignerEmail||!selected)return;
    const idx=selected.signers.length;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{
      ...d,signers:[...d.signers,{id:`s-${Date.now()}`,name:newSignerName,email:newSignerEmail,role:newSignerRole||"Signer",status:"pending",color:SIGNER_COLORS[idx%SIGNER_COLORS.length]}],
    }));
    setNewSignerName("");setNewSignerEmail("");setNewSignerRole("");
  };

  const removeSigner=(sid:string)=>{if(!selected)return;setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{...d,signers:d.signers.filter(s=>s.id!==sid)}));};

  const sendForSigning=()=>{
    if(!selected||selected.signers.length===0)return;
    setDocs(prev=>prev.map(d=>d.id!==selected.id?d:{...d,status:"sent"}));
    setEmailSent(true);setTimeout(()=>setEmailSent(false),3500);
  };

  const createDoc=()=>{
    if(!newDocTitle)return;
    const doc:ContractDoc={id:`doc-${Date.now()}`,title:newDocTitle,category:newDocCat,status:"draft",created:"Apr 30, 2026",updated:"Apr 30, 2026",signers:[],content:TEMPLATES[newDocCat]};
    setDocs(prev=>[...prev,doc]);setSelectedId(doc.id);setShowNewDoc(false);setNewDocTitle("");
  };

  const deleteDoc=(id:string)=>{setDocs(prev=>prev.filter(d=>d.id!==id));if(selectedId===id){const r=docs.filter(d=>d.id!==id);if(r.length)setSelectedId(r[0].id);}};

  const flash=(msg:string)=>{setExportMsg(msg);setTimeout(()=>setExportMsg(""),3500);};
  const exportMd=()=>{if(!selected)return;const b=new Blob([selected.content],{type:"text/markdown"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`${selected.title}.md`;a.click();flash("Markdown downloaded");};
  const exportTxt=()=>{if(!selected)return;const b=new Blob([selected.content.replace(/#{1,6}\s/g,"").replace(/\*\*/g,"")],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`${selected.title}.txt`;a.click();flash("Plain text downloaded");};
  const exportPdf=()=>{window.print();flash("Print dialog opened");};
  const exportGoogleDocs=()=>{window.open("https://docs.google.com/document/create","_blank");flash("Opened Google Docs");};

  const filteredDocs=docs.filter(d=>{
    const mc=catFilter==="all"||d.category===catFilter;
    const ms=statusFilter==="all"||d.status===statusFilter;
    const mq=!search||d.title.toLowerCase().includes(search.toLowerCase());
    return mc&&ms&&mq;
  });

  const tmeta=CAT_META[selected?.category??"nda"];
  const smeta=STATUS_META[selected?.status??"draft"];
  const canSign=sigMode==="draw"?hasDrawing:typedSig.trim().length>0;
  const signedCount=selected?.signers.filter(s=>s.status==="signed").length??0;

  const inp:React.CSSProperties={width:"100%",padding:"8px 11px",borderRadius:6,background:"var(--surface-2)",border:"1px solid var(--line-strong)",color:"var(--text)",fontSize:12,fontFamily:"var(--sans)",outline:"none",boxSizing:"border-box"};

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--sans)",overflow:"hidden"}}>

      {/* ── Top bar ── */}
      <header style={{display:"flex",alignItems:"center",gap:0,height:48,borderBottom:"1px solid var(--line)",background:"var(--surface-1)",flexShrink:0,zIndex:10}}>
        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 20px",height:"100%",borderRight:"1px solid var(--line)"}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" rx="3" stroke="var(--accent)" strokeWidth="1.3"/>
            <path d="M5 6h8M5 9h8M5 12h5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{fontFamily:"var(--sans)",fontSize:13,fontWeight:600,letterSpacing:"-0.01em"}}>ContractLab</span>
        </div>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 16px",fontFamily:"var(--mono)",fontSize:11,color:"var(--text-4)",letterSpacing:"0.03em"}}>
          <span>Documents</span>
          {selected&&<><span style={{opacity:0.4}}>/</span><span style={{color:"var(--text-3)"}}>{selected.title}</span></>}
        </div>
        <div style={{flex:1}}/>
        {/* Status pill */}
        {selected&&(
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:4,background:smeta.bg,border:`1px solid ${smeta.color}30`,marginRight:12}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:smeta.color,flexShrink:0}}/>
            <span style={{fontFamily:"var(--mono)",fontSize:10.5,color:smeta.color,fontWeight:500,letterSpacing:"0.04em"}}>{smeta.label.toUpperCase()}</span>
          </div>
        )}
        {/* Signer avatars */}
        {selected?.signers.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:4,marginRight:12}}>
            {selected.signers.map(s=>(
              <div key={s.id} title={`${s.name} — ${SIGNER_STATUS[s.status].label}`}
                style={{width:26,height:26,borderRadius:"50%",background:`${s.color}22`,border:`1.5px solid ${s.status==="signed"?s.color:"var(--line-strong)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:s.color,cursor:"default",fontFamily:"var(--sans)"}}>
                {s.name.charAt(0)}
              </div>
            ))}
            <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text-4)",marginLeft:4}}>{signedCount}/{selected.signers.length}</span>
          </div>
        )}
        <button onClick={()=>setShowNewDoc(true)} style={{display:"flex",alignItems:"center",gap:7,height:"100%",padding:"0 18px",background:"var(--accent)",border:"none",borderLeft:"1px solid rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--sans)",letterSpacing:"-0.01em"}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          New Document
        </button>
      </header>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── Left sidebar ── */}
        <aside style={{width:228,background:"var(--surface-1)",borderRight:"1px solid var(--line)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
          {/* Search */}
          <div style={{padding:"12px 12px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--surface-2)",border:"1px solid var(--line-strong)",borderRadius:6,padding:"7px 10px"}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,color:"var(--text-4)"}}>
                <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:12,color:"var(--text)",fontFamily:"var(--sans)"}}/>
            </div>
          </div>
          {/* Status filters */}
          <div style={{display:"flex",gap:3,padding:"10px 12px 8px",flexWrap:"wrap"}}>
            {(["all","draft","sent","completed"] as StatusFilter[]).map(sf=>(
              <button key={sf} onClick={()=>setStatusFilter(sf)}
                style={{padding:"3px 8px",borderRadius:3,background:statusFilter===sf?"var(--accent)":"transparent",border:`1px solid ${statusFilter===sf?"var(--accent)":"var(--line-strong)"}`,color:statusFilter===sf?"#fff":"var(--text-3)",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.04em",textTransform:"uppercase"}}>
                {sf==="all"?"All":sf}
              </button>
            ))}
          </div>
          {/* Category nav */}
          <div style={{overflowY:"auto",flex:1,padding:"4px 8px 6px"}}>
            <button onClick={()=>setCatFilter("all")}
              style={{width:"100%",textAlign:"left",padding:"6px 8px",borderRadius:5,background:catFilter==="all"?"rgba(45,114,210,0.12)":"transparent",border:"none",color:catFilter==="all"?"var(--accent)":"var(--text-3)",fontSize:11.5,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4,fontFamily:"var(--sans)"}}>
              <span style={{fontWeight:catFilter==="all"?600:400}}>All Documents</span>
              <span style={{fontFamily:"var(--mono)",fontSize:10,opacity:0.6}}>{docs.length}</span>
            </button>
            {CAT_GROUPS.map(g=>(
              <div key={g.label}>
                <div style={{padding:"10px 8px 4px",fontFamily:"var(--mono)",fontSize:9.5,fontWeight:600,letterSpacing:"0.1em",color:"var(--text-4)",textTransform:"uppercase"}}>{g.label}</div>
                {g.cats.map(cat=>{
                  const m=CAT_META[cat];const cnt=docs.filter(d=>d.category===cat).length;
                  return (
                    <button key={cat} onClick={()=>setCatFilter(cat)}
                      style={{width:"100%",textAlign:"left",padding:"5px 8px",borderRadius:5,background:catFilter===cat?"rgba(45,114,210,0.12)":"transparent",border:"none",color:catFilter===cat?"var(--accent)":"var(--text-2)",fontSize:11.5,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:1,fontFamily:"var(--sans)"}}>
                      <span style={{width:6,height:6,borderRadius:1,background:m.color,flexShrink:0,opacity:0.8}}/>
                      <span style={{flex:1,fontWeight:catFilter===cat?600:400}}>{m.label}</span>
                      {cnt>0&&<span style={{fontFamily:"var(--mono)",fontSize:9.5,opacity:0.45}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Document list */}
          <div style={{borderTop:"1px solid var(--line)",overflowY:"auto",maxHeight:300,padding:"6px 8px 8px"}}>
            <div style={{padding:"4px 8px 6px",fontFamily:"var(--mono)",fontSize:9.5,fontWeight:600,letterSpacing:"0.1em",color:"var(--text-4)",textTransform:"uppercase"}}>Recent</div>
            {filteredDocs.map(doc=>{
              const sm=STATUS_META[doc.status];const cm=CAT_META[doc.category];
              const active=doc.id===selectedId;
              return (
                <div key={doc.id} style={{position:"relative",marginBottom:2}}>
                  <button onClick={()=>setSelectedId(doc.id)}
                    style={{width:"100%",textAlign:"left",padding:"8px 26px 8px 8px",borderRadius:6,background:active?"var(--surface-2)":"transparent",border:active?"1px solid var(--line-strong)":"1px solid transparent",color:"var(--text)",fontSize:12,cursor:"pointer",fontFamily:"var(--sans)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{width:6,height:6,borderRadius:1,background:cm.color,flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:active?600:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.title}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,paddingLeft:12}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:9.5,color:sm.color}}>{sm.label}</span>
                      <span style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",marginLeft:"auto"}}>{doc.updated}</span>
                    </div>
                  </button>
                  <button onClick={()=>deleteDoc(doc.id)} title="Delete"
                    style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"var(--text-4)",fontSize:13,cursor:"pointer",padding:"2px 5px",opacity:0,transition:"opacity 0.15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.opacity="1")} onMouseLeave={e=>(e.currentTarget.style.opacity="0")}>×</button>
                </div>
              );
            })}
            {filteredDocs.length===0&&<div style={{padding:"12px 8px",fontSize:11,color:"var(--text-4)",textAlign:"center",fontFamily:"var(--mono)"}}>No documents</div>}
          </div>
        </aside>

        {/* ── Document area ── */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,background:"#F0F2F5"}}>
          {selected?(
            <>
              {/* Document toolbar */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 20px",height:44,background:"var(--surface-1)",borderBottom:"1px solid var(--line)",flexShrink:0}}>
                <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text-3)",letterSpacing:"0.06em",textTransform:"uppercase"}}>{tmeta.short}</span>
                <span style={{color:"var(--line-strong)"}}>·</span>
                <span style={{fontSize:12,fontWeight:500,color:"var(--text-2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.title}</span>
                <div style={{flex:1}}/>
                <button onClick={()=>setShowRight(v=>!v)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:5,background:showRight?"rgba(45,114,210,0.12)":"transparent",border:`1px solid ${showRight?"rgba(45,114,210,0.3)":"var(--line-strong)"}`,color:showRight?"var(--accent)":"var(--text-3)",fontSize:10.5,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.04em",textTransform:"uppercase",fontWeight:600}}>
                  {showRight?"Hide Panel":"Show Panel"}
                </button>
              </div>
              {/* Paper document */}
              <div id="doc-print-area" style={{flex:1,overflowY:"auto",padding:"40px 48px"}}>
                <div style={{maxWidth:660,margin:"0 auto",background:"#FFFFFF",borderRadius:3,padding:"72px 80px",boxShadow:"0 1px 3px rgba(0,0,0,0.08),0 8px 32px rgba(0,0,0,0.1),0 24px 64px rgba(0,0,0,0.06)",position:"relative"}}>
                  {/* Document top rule */}
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${tmeta.color}, ${tmeta.color}88)`,borderRadius:"3px 3px 0 0"}}/>
                  {/* Category badge */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:40}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:9.5,letterSpacing:"0.12em",textTransform:"uppercase",color:tmeta.color,fontWeight:600}}>{tmeta.label}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"#9CA3AF",letterSpacing:"0.06em"}}>Updated {selected.updated}</div>
                  </div>
                  {renderDoc(selected.content)}
                  {/* Signatures section */}
                  {selected.signers.some(s=>s.status==="signed"&&s.signature)&&(
                    <div style={{marginTop:52,paddingTop:32,borderTop:"2px solid #111827"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"#6B7280",marginBottom:20,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>Electronic Signatures</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:16}}>
                        {selected.signers.filter(s=>s.status==="signed"&&s.signature).map(s=>(
                          <div key={s.id} style={{borderTop:`2px solid ${s.color}`,paddingTop:14}}>
                            {s.signature?.startsWith("data:")
                              ? <img src={s.signature} style={{height:36,marginBottom:8,display:"block"}} alt="sig"/>
                              : <div style={{fontFamily:"Georgia,serif",fontSize:22,fontStyle:"italic",color:"#111827",marginBottom:8,lineHeight:1.2}}>{s.signature}</div>
                            }
                            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"#374151",fontWeight:600}}>{s.name}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"#9CA3AF",marginTop:2}}>{s.role}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#D1D5DB",marginTop:3}}>Signed {s.signedAt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Export bar */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 20px",borderTop:"1px solid var(--line)",background:"var(--surface-1)",flexShrink:0}}>
                <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text-4)",letterSpacing:"0.06em",textTransform:"uppercase",marginRight:4}}>Export</span>
                {[{l:"PDF",a:exportPdf},{l:"Google Docs",a:exportGoogleDocs},{l:"Markdown",a:exportMd},{l:"Plain Text",a:exportTxt}].map(o=>(
                  <button key={o.l} onClick={o.a}
                    style={{padding:"5px 11px",borderRadius:4,background:"var(--surface-2)",border:"1px solid var(--line-strong)",color:"var(--text-3)",fontSize:11,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.03em",transition:"color 0.15s,border-color 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="var(--text)";e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="var(--text-3)";e.currentTarget.style.borderColor="var(--line-strong)";}}>
                    {o.l}
                  </button>
                ))}
                {exportMsg&&<span style={{fontFamily:"var(--mono)",fontSize:10.5,color:"#12B886",marginLeft:8}}>✓ {exportMsg}</span>}
              </div>
            </>
          ):(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",fontSize:13,fontFamily:"var(--mono)"}}>Select a document</div>
          )}
        </main>

        {/* ── Right panel ── */}
        {showRight&&selected&&(
          <aside style={{width:288,background:"var(--surface-1)",borderLeft:"1px solid var(--line)",display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{display:"flex",borderBottom:"1px solid var(--line)"}}>
              {(["sign","share","export"] as RightTab[]).map(tab=>(
                <button key={tab} onClick={()=>setRightTab(tab)}
                  style={{flex:1,padding:"12px 0",background:"transparent",border:"none",borderBottom:rightTab===tab?"2px solid var(--accent)":"2px solid transparent",color:rightTab===tab?"var(--accent)":"var(--text-4)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.07em",textTransform:"uppercase",transition:"color 0.15s"}}>
                  {tab==="sign"?"Signatures":tab==="share"?"Send":"Export"}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:18}}>

              {/* Signatures tab */}
              {rightTab==="sign"&&(
                <div>
                  {selected.signers.length===0&&(
                    <div style={{padding:"20px 0 16px",fontFamily:"var(--mono)",fontSize:10.5,color:"var(--text-4)",textAlign:"center",lineHeight:1.7}}>No signers added yet.<br/>Add signers below to begin.</div>
                  )}
                  {selected.signers.map(signer=>(
                    <div key={signer.id} style={{background:"var(--surface-2)",borderRadius:6,padding:"10px 12px",marginBottom:8,borderLeft:`2px solid ${signer.color}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:`${signer.color}20`,border:`1.5px solid ${signer.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:signer.color,flexShrink:0,fontFamily:"var(--sans)"}}>{signer.name.charAt(0)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,fontFamily:"var(--sans)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{signer.name}</div>
                          <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{signer.email}</div>
                        </div>
                        <button onClick={()=>removeSigner(signer.id)} style={{background:"transparent",border:"none",color:"var(--text-4)",fontSize:14,cursor:"pointer",padding:"2px 4px",flexShrink:0}}>×</button>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span style={{width:4,height:4,borderRadius:"50%",background:SIGNER_STATUS[signer.status].color}}/>
                          <span style={{fontFamily:"var(--mono)",fontSize:9.5,color:SIGNER_STATUS[signer.status].color,letterSpacing:"0.04em"}}>{SIGNER_STATUS[signer.status].label.toUpperCase()}</span>
                          {signer.signedAt&&<span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--text-4)"}}>· {signer.signedAt}</span>}
                        </div>
                        {signer.status!=="signed"&&(
                          <button onClick={()=>{setActiveSigner(signer.id);setShowSigModal(true);}}
                            style={{padding:"3px 10px",borderRadius:3,background:"var(--accent)",border:"none",color:"#fff",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"var(--mono)",letterSpacing:"0.04em"}}>
                            SIGN
                          </button>
                        )}
                      </div>
                      {signer.role&&<div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",marginTop:6,paddingTop:6,borderTop:"1px solid var(--line)"}}>{signer.role}</div>}
                    </div>
                  ))}
                  <div style={{background:"var(--surface-2)",borderRadius:6,padding:12,border:"1px dashed var(--line-strong)",marginTop:8}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Add Signer</div>
                    {[{val:newSignerName,set:setNewSignerName,ph:"Full name"},{val:newSignerEmail,set:setNewSignerEmail,ph:"Email address"},{val:newSignerRole,set:setNewSignerRole,ph:"Role (e.g. Buyer, Employee)"}].map(({val,set,ph})=>(
                      <input key={ph} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{...inp,marginBottom:6}}/>
                    ))}
                    <button onClick={addSigner} disabled={!newSignerName||!newSignerEmail}
                      style={{width:"100%",padding:"8px",borderRadius:5,background:newSignerName&&newSignerEmail?"var(--accent)":"var(--surface-3)",border:"none",color:newSignerName&&newSignerEmail?"#fff":"var(--text-4)",fontSize:11,fontWeight:700,cursor:newSignerName&&newSignerEmail?"pointer":"default",fontFamily:"var(--mono)",letterSpacing:"0.04em"}}>
                      ADD SIGNER
                    </button>
                  </div>
                  {selected.signers.some(s=>s.signedAt)&&(
                    <div style={{marginTop:20}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Audit Trail</div>
                      {selected.signers.filter(s=>s.signedAt).map(s=>(
                        <div key={s.id} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                          <div style={{width:1,background:s.color,alignSelf:"stretch",flexShrink:0,marginLeft:4}}/>
                          <div><div style={{fontSize:11,fontFamily:"var(--sans)",color:"var(--text-2)"}}>{s.name} <span style={{color:"var(--text-4)"}}>signed</span></div><div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",marginTop:2}}>{s.signedAt}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Share tab */}
              {rightTab==="share"&&(
                <div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Recipients</div>
                  {selected.signers.length>0?selected.signers.map(s=>(
                    <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"var(--surface-2)",borderRadius:5,marginBottom:4,borderLeft:`2px solid ${s.color}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11.5,fontWeight:600,fontFamily:"var(--sans)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.email}</div>
                      </div>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:SIGNER_STATUS[s.status].color,letterSpacing:"0.04em"}}>{SIGNER_STATUS[s.status].label.toUpperCase()}</span>
                    </div>
                  )):(
                    <div style={{padding:"12px",background:"var(--surface-2)",borderRadius:5,fontFamily:"var(--mono)",fontSize:10,color:"var(--text-4)",textAlign:"center"}}>Add signers first</div>
                  )}
                  <div style={{marginTop:16,marginBottom:8}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Subject</div>
                    <input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)} style={inp}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Message</div>
                    <textarea value={emailMsg} onChange={e=>setEmailMsg(e.target.value)} rows={4}
                      style={{...inp,resize:"vertical",fontFamily:"var(--sans)",lineHeight:1.5}}/>
                  </div>
                  <button onClick={sendForSigning} disabled={selected.signers.length===0}
                    style={{width:"100%",padding:"10px",borderRadius:5,background:selected.signers.length>0?"var(--accent)":"var(--surface-2)",border:"none",color:selected.signers.length>0?"#fff":"var(--text-4)",fontSize:11,fontWeight:700,cursor:selected.signers.length>0?"pointer":"default",fontFamily:"var(--mono)",letterSpacing:"0.05em",marginBottom:8}}>
                    {emailSent?"✓ SENT FOR SIGNING":"SEND FOR SIGNING"}
                  </button>
                  <button onClick={()=>{const e=selected.signers.map(s=>s.email).join(",");window.open(`mailto:${e}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMsg)}`);}}
                    style={{width:"100%",padding:"8px",borderRadius:5,background:"transparent",border:"1px solid var(--line-strong)",color:"var(--text-3)",fontSize:11,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.04em"}}>
                    OPEN EMAIL CLIENT
                  </button>
                  {emailSent&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:5,background:"rgba(18,184,134,0.1)",border:"1px solid rgba(18,184,134,0.3)",fontFamily:"var(--mono)",fontSize:10.5,color:"#12B886"}}>✓ Sent to {selected.signers.length} recipient{selected.signers.length>1?"s":""}</div>}
                </div>
              )}

              {/* Export tab */}
              {rightTab==="export"&&(
                <div>
                  {[
                    {l:"PDF Document",     d:"Print dialog → Save as PDF",icon:"PDF",  c:"#FF6B6B",a:exportPdf},
                    {l:"Google Docs",      d:"Opens new doc to paste into",icon:"G",    c:"#4285F4",a:exportGoogleDocs},
                    {l:"Markdown",         d:"Raw .md source file",        icon:"MD",  c:"var(--accent)",a:exportMd},
                    {l:"Plain Text",       d:"Unformatted .txt file",       icon:"TXT", c:"var(--text-3)",a:exportTxt},
                  ].map(o=>(
                    <button key={o.l} onClick={o.a}
                      style={{width:"100%",textAlign:"left",padding:"12px 14px",borderRadius:6,background:"var(--surface-2)",border:"1px solid var(--line-strong)",color:"var(--text)",fontSize:12,cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:12,transition:"border-color 0.15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.2)")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--line-strong)")}>
                      <div style={{width:32,height:32,borderRadius:5,background:`${o.c}15`,border:`1px solid ${o.c}30`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--mono)",fontSize:9,color:o.c,fontWeight:700,flexShrink:0,letterSpacing:"0.03em"}}>{o.icon}</div>
                      <div><div style={{fontWeight:600,fontSize:12,marginBottom:2}}>{o.l}</div><div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)"}}>{o.d}</div></div>
                    </button>
                  ))}
                  {exportMsg&&<div style={{marginTop:4,padding:"10px 12px",borderRadius:5,background:"rgba(18,184,134,0.1)",border:"1px solid rgba(18,184,134,0.3)",fontFamily:"var(--mono)",fontSize:10.5,color:"#12B886"}}>✓ {exportMsg}</div>}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── Signature modal ── */}
      {showSigModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
          <div style={{background:"var(--surface-1)",borderRadius:10,padding:28,width:480,border:"1px solid var(--line-strong)",boxShadow:"0 32px 96px rgba(0,0,0,0.7)"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
              <div>
                <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Electronic Signature</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--sans)"}}>{activeSigner&&selected?.signers.find(s=>s.id===activeSigner)?.name}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--text-4)",marginTop:3}}>{activeSigner&&selected?.signers.find(s=>s.id===activeSigner)?.role}</div>
              </div>
              <button onClick={()=>setShowSigModal(false)} style={{background:"transparent",border:"none",color:"var(--text-4)",fontSize:20,cursor:"pointer",padding:"4px 8px",lineHeight:1}}>×</button>
            </div>
            {/* Mode toggle */}
            <div style={{display:"flex",gap:0,marginBottom:16,background:"var(--surface-2)",borderRadius:5,padding:2}}>
              {(["draw","type"] as SignMode[]).map(m=>(
                <button key={m} onClick={()=>setSigMode(m)}
                  style={{flex:1,padding:"7px",borderRadius:4,background:sigMode===m?"var(--surface-3)":"transparent",border:sigMode===m?"1px solid var(--line-strong)":"1px solid transparent",color:sigMode===m?"var(--text)":"var(--text-3)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.05em",textTransform:"uppercase"}}>
                  {m==="draw"?"Draw":"Type"}
                </button>
              ))}
            </div>
            {sigMode==="draw"?(
              <div>
                <canvas ref={canvasRef} width={424} height={160}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  style={{width:"100%",height:160,borderRadius:6,background:"#fafaf8",border:"1px solid #e5e7eb",cursor:"crosshair",display:"block"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)"}}>Draw your signature above</span>
                  <button onClick={clearCanvas} style={{padding:"3px 10px",borderRadius:4,background:"transparent",border:"1px solid var(--line-strong)",color:"var(--text-3)",fontSize:10,cursor:"pointer",fontFamily:"var(--mono)"}}>Clear</button>
                </div>
              </div>
            ):(
              <div>
                <input value={typedSig} onChange={e=>setTypedSig(e.target.value)} placeholder="Type your full name"
                  style={{width:"100%",padding:"16px 20px",borderRadius:6,background:"#fafaf8",border:"1px solid #e5e7eb",color:"#111827",fontSize:28,fontFamily:"Georgia,'Times New Roman',serif",fontStyle:"italic",boxSizing:"border-box",outline:"none"}}/>
                <div style={{fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",marginTop:8}}>Typed name will appear as your signature</div>
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={()=>setShowSigModal(false)} style={{flex:1,padding:"10px",borderRadius:6,background:"transparent",border:"1px solid var(--line-strong)",color:"var(--text-2)",fontSize:11,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.04em",fontWeight:600}}>CANCEL</button>
              <button onClick={applySignature} disabled={!canSign}
                style={{flex:2,padding:"10px",borderRadius:6,background:canSign?"var(--accent)":"var(--surface-3)",border:"none",color:canSign?"#fff":"var(--text-4)",fontSize:11,fontWeight:700,cursor:canSign?"pointer":"default",fontFamily:"var(--mono)",letterSpacing:"0.04em"}}>
                APPLY SIGNATURE
              </button>
            </div>
            <div style={{marginTop:14,padding:"10px 12px",borderRadius:5,background:"rgba(45,114,210,0.06)",border:"1px solid rgba(45,114,210,0.15)",fontFamily:"var(--mono)",fontSize:9.5,color:"var(--text-4)",lineHeight:1.6,letterSpacing:"0.01em"}}>
              By applying your signature you agree it has the same legal effect as a handwritten signature under applicable electronic signature law.
            </div>
          </div>
        </div>
      )}

      {/* ── New document modal ── */}
      {showNewDoc&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
          <div style={{background:"var(--surface-1)",borderRadius:10,padding:28,width:560,border:"1px solid var(--line-strong)",boxShadow:"0 32px 96px rgba(0,0,0,0.7)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
              <div>
                <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>New Document</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--sans)"}}>Choose a Template</div>
              </div>
              <button onClick={()=>setShowNewDoc(false)} style={{background:"transparent",border:"none",color:"var(--text-4)",fontSize:20,cursor:"pointer",padding:"4px 8px",lineHeight:1}}>×</button>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Document Title</div>
              <input value={newDocTitle} onChange={e=>setNewDocTitle(e.target.value)} placeholder="e.g., Acme Corp — Mutual NDA" style={{...inp,fontSize:13,padding:"10px 12px"}}/>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9.5,fontWeight:700,color:"var(--text-4)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Template</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {(Object.entries(CAT_META) as [DocCategory,typeof CAT_META[DocCategory]][]).map(([cat,m])=>(
                  <button key={cat} onClick={()=>setNewDocCat(cat)}
                    style={{padding:"12px 10px",borderRadius:6,background:newDocCat===cat?"rgba(45,114,210,0.12)":"var(--surface-2)",border:newDocCat===cat?`1px solid var(--accent)`:"1px solid var(--line-strong)",color:newDocCat===cat?"var(--accent)":"var(--text-2)",fontSize:11,cursor:"pointer",textAlign:"left",transition:"all 0.15s",position:"relative",overflow:"hidden"}}>
                    <div style={{width:3,height:"100%",position:"absolute",left:0,top:0,background:m.color,borderRadius:"6px 0 0 6px"}}/>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:m.color,marginBottom:5,letterSpacing:"0.06em",paddingLeft:8}}>{m.short.toUpperCase()}</div>
                    <div style={{fontWeight:600,fontSize:11,lineHeight:1.3,paddingLeft:8,fontFamily:"var(--sans)"}}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowNewDoc(false)} style={{flex:1,padding:"10px",borderRadius:6,background:"transparent",border:"1px solid var(--line-strong)",color:"var(--text-2)",fontSize:11,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.04em",fontWeight:600}}>CANCEL</button>
              <button onClick={createDoc} disabled={!newDocTitle}
                style={{flex:2,padding:"10px",borderRadius:6,background:newDocTitle?"var(--accent)":"var(--surface-3)",border:"none",color:newDocTitle?"#fff":"var(--text-4)",fontSize:11,fontWeight:700,cursor:newDocTitle?"pointer":"default",fontFamily:"var(--mono)",letterSpacing:"0.04em"}}>
                CREATE DOCUMENT
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body > * { display: none !important; }
          #doc-print-area { display: block !important; position: fixed; inset: 0; overflow: auto; background: white !important; }
          #doc-print-area > div { box-shadow: none !important; max-width: 100% !important; padding: 48px !important; }
        }
        *::-webkit-scrollbar { width: 3px; height: 3px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: var(--text-4) !important; font-family: var(--sans); }
      `}</style>
    </div>
  );
}
