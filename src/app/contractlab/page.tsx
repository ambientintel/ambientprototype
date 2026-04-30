"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
type DocCategory =
  | "nda" | "termsheet" | "employment" | "consulting"
  | "service" | "partnership" | "licensing" | "contractor"
  | "loi" | "custom";

type SignerStatus = "pending" | "signed" | "declined";
type DocStatus    = "draft" | "review" | "signed" | "archived";
type SignMode     = "draw" | "type";
type RightTab     = "signers" | "activity" | "details";
type StatusFilter = "all" | DocStatus;

interface Signer {
  id: string;
  name: string;
  email: string;
  status: SignerStatus;
  signedAt?: string;
}

interface ContractDoc {
  id: string;
  name: string;
  category: DocCategory;
  status: DocStatus;
  content: string;
  createdAt: string;
  updatedAt: string;
  signers: Signer[];
  githubPath?: string;
  githubSha?: string;
}

// ── Category metadata ────────────────────────────────────────────────────────
const CAT_META: Record<DocCategory, { label: string; color: string; icon: string }> = {
  nda:         { label: "NDA",            color: "#4C90F0", icon: "🔒" },
  termsheet:   { label: "Term Sheet",     color: "#2ECC71", icon: "📊" },
  employment:  { label: "Employment",     color: "#F0B429", icon: "👤" },
  consulting:  { label: "Consulting",     color: "#A78BFA", icon: "💼" },
  service:     { label: "Service Agmt",   color: "#34D399", icon: "⚙️" },
  partnership: { label: "Partnership",    color: "#F97316", icon: "🤝" },
  licensing:   { label: "Licensing",      color: "#60A5FA", icon: "📄" },
  contractor:  { label: "1099 Contractor",color: "#94A3B8", icon: "🔧" },
  loi:         { label: "LOI",            color: "#EC4899", icon: "✉️" },
  custom:      { label: "My Documents",   color: "#E2E8F0", icon: "📁" },
};

// ── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES: Record<Exclude<DocCategory, "custom">, string> = {

nda: `MUTUAL NON-DISCLOSURE AGREEMENT
(Based on Y Combinator Standard NDA)

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] between [PARTY A], a [STATE] [ENTITY TYPE] ("Company A"), and [PARTY B], a [STATE] [ENTITY TYPE] ("Company B") (each a "Party," collectively the "Parties").

1. PURPOSE
The Parties wish to explore a potential business relationship (the "Purpose") and may disclose to each other certain confidential and proprietary information.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either Party to the other Party, either directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as "Confidential," "Proprietary," or similar designation, or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information does not include information that: (a) was publicly known prior to disclosure; (b) becomes publicly known through no wrongful act; (c) was rightfully received from a third party without restriction; (d) was independently developed without use of Confidential Information; or (e) is required to be disclosed by law or court order.

3. NON-USE AND NON-DISCLOSURE
Each Party agrees not to use any Confidential Information of the other Party for any purpose except to evaluate and engage in discussions concerning the Purpose. Each Party agrees not to disclose any Confidential Information of the other Party to third parties or to employees other than those with a need to know and who are bound by confidentiality obligations no less protective than this Agreement.

4. RETURN OF CONFIDENTIAL INFORMATION
All documents and other tangible objects containing or representing Confidential Information shall be promptly returned or destroyed upon request.

5. NO LICENSE
Nothing herein grants either Party any rights in the Confidential Information of the other Party except as expressly set forth herein.

6. TERM
This Agreement shall remain in effect for two (2) years from the date first written above. Obligations as to Confidential Information that constitutes a trade secret shall continue until such information no longer qualifies as a trade secret.

7. GENERAL
This Agreement shall be governed by the laws of the State of Delaware. This Agreement constitutes the entire agreement between the Parties concerning its subject matter and supersedes all prior agreements. This Agreement may be modified only by a written amendment signed by both Parties.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

[PARTY A]                           [PARTY B]

By: ___________________________     By: ___________________________
Name:                               Name:
Title:                              Title:
Date:                               Date:`,

termsheet: `SERIES A PREFERRED STOCK TERM SHEET
(Based on NVCA Model Term Sheet)

[COMPANY NAME] (the "Company")
Summary of Terms for Series A Preferred Stock Financing

Date: [DATE]
Investors: [LEAD INVESTOR] and [CO-INVESTORS]
Amount Raised: $[AMOUNT]

═══════════════════════════════════════════════
TERMS OF SERIES A PREFERRED STOCK
═══════════════════════════════════════════════

OFFERING TERMS

Securities Offered:     Series A Preferred Stock ("Series A Preferred")
Pre-Money Valuation:    $[PRE-MONEY VALUATION]
Investment Amount:      $[INVESTMENT AMOUNT]
Price Per Share:        $[PRICE] (the "Original Issue Price"), based on a
                        pre-money valuation of $[PRE-MONEY] on a fully-
                        diluted basis including an employee option pool
                        representing [15-20]% of the post-financing shares.
Capitalization:         See attached Capitalization Table.

─────────────────────────────────────────────
CHARTER
─────────────────────────────────────────────

Dividends:              [8]% non-cumulative dividends, payable when and if
                        declared by the Board. Dividends on Series A
                        Preferred accrue prior to any dividends on Common.

Liquidation Preference: In the event of any liquidation, dissolution or
                        winding up of the Company, or Deemed Liquidation
                        Event, the holders of Series A Preferred shall
                        receive in preference to Common Stock an amount
                        per share equal to [1x] the Original Issue Price
                        plus any declared but unpaid dividends.
                        [Non-participating preferred.]

Conversion:             Each share of Series A Preferred is convertible
                        into one share of Common Stock at any time at
                        the option of the holder, subject to anti-dilution
                        adjustment. Mandatory conversion upon (i) IPO at
                        price ≥ [3x] Original Issue Price with proceeds
                        ≥ $[50M], or (ii) vote of [majority/supermajority]
                        of Series A Preferred.

Anti-dilution:          Weighted average anti-dilution protection, subject
                        to standard exceptions (employee options, strategic
                        partners, equipment leasing, etc.). Formula:
                        NCP = OCP × (OS + OD) / (OS + ND), where NCP =
                        New Conversion Price, OCP = Old Conversion Price,
                        OS = Outstanding Shares (fully diluted), OD =
                        Dollar Amount of New Issue / OCP, ND = Shares
                        Actually Issued.

Voting:                 Series A Preferred votes as-converted with Common.
                        Protective provisions require consent of [majority]
                        of Series A Preferred for: (i) adverse change to
                        rights of Series A; (ii) creation of senior/pari
                        passu securities; (iii) authorization of merger,
                        acquisition, or sale of substantially all assets;
                        (iv) liquidation or winding up; (v) increase or
                        decrease authorized Series A; (vi) any action that
                        results in payment of dividends.

─────────────────────────────────────────────
INVESTOR RIGHTS AGREEMENT
─────────────────────────────────────────────

Information Rights:     Audited annual financials within 120 days of
                        fiscal year end; unaudited monthly financials
                        within 30 days of month end; annual budget 30 days
                        before fiscal year end. Rights terminate upon IPO.

Pro-Rata Rights:        Right to participate in future equity financings
                        up to pro-rata share based on fully diluted
                        ownership. Terminates upon IPO.

Registration Rights:    Two S-1 demand registrations after IPO lock-up.
                        Unlimited piggyback rights. One S-3 shelf demand
                        per year. Underwriter cutback in underwritten
                        offerings. Company pays registration expenses.

─────────────────────────────────────────────
RIGHT OF FIRST REFUSAL / CO-SALE AGREEMENT
─────────────────────────────────────────────

Right of First Refusal: Company, then investors (pro-rata), have right of
                        first refusal on founder share transfers. Standard
                        ROFR notice/exercise periods.

Co-Sale Right:          If founders propose to sell shares, Series A
                        investors have right to participate in such sale
                        pro-rata.

─────────────────────────────────────────────
VOTING AGREEMENT
─────────────────────────────────────────────

Board Composition:      [5] member board: [2] Common designees (founders),
                        [1] Series A designee ([LEAD INVESTOR DESIGNEE]),
                        [1] independent mutually agreed, [1] CEO.

Drag-Along:             If a majority of Series A Preferred and a majority
                        of Common (voting separately) approve a transaction,
                        all other shareholders will vote in favor.

─────────────────────────────────────────────
OTHER TERMS
─────────────────────────────────────────────

Employee Pool:          [15-20]% post-financing option pool in place prior
                        to close.

Vesting:                All employee/founder equity subject to 4-year
                        vesting, 1-year cliff. Single trigger acceleration
                        for involuntary termination following acquisition.

Expenses:               Company pays reasonable legal fees up to $[35,000].
Exclusivity:            30-day no-shop from date of signed term sheet.
Governing Law:          Delaware.

[LEAD INVESTOR]                     [COMPANY]

By: ___________________________     By: ___________________________
Name:                               Name:
Title:                              Title:`,

employment: `OFFER LETTER
(Y Combinator-Style Startup Offer Letter)

[DATE]

[CANDIDATE NAME]
[ADDRESS]

Dear [CANDIDATE NAME],

[COMPANY NAME], Inc. (the "Company") is pleased to offer you employment on the following terms:

POSITION AND START DATE
You will serve as [TITLE], reporting to [MANAGER TITLE]. Your anticipated start date is [START DATE]. This is a full-time position based at [LOCATION / REMOTE].

COMPENSATION
Base Salary: $[AMOUNT] per year, payable in accordance with the Company's standard payroll practices.
Bonus: You will be eligible for an annual discretionary bonus targeted at [X]% of base salary, based on individual and company performance.
Benefits: You will be eligible to participate in the Company's standard benefit plans, including health, dental, and vision insurance, 401(k), and [X] days PTO, subject to the terms of those plans.

EQUITY
Subject to approval by the Company's Board of Directors, you will be granted an option to purchase [NUMBER] shares of the Company's Common Stock at a per share exercise price equal to the fair market value on the date of grant (as determined by a 409A valuation). The option will be subject to the terms of the Company's [YEAR] Equity Incentive Plan and your option agreement.

Vesting Schedule: 25% of the shares vest on the one-year anniversary of your vesting commencement date (the "Cliff"); the remaining 75% vest monthly over the following 36 months, for a total 4-year vesting period. Vesting is contingent on continued employment.

Early Exercise: [The option will include an early exercise right, allowing you to exercise prior to vesting subject to a right of repurchase by the Company.]

[DOUBLE TRIGGER ACCELERATION: In the event of a Change of Control of the Company and your Involuntary Termination within 12 months following such Change of Control, 100% of your then-unvested shares shall immediately vest ("Double Trigger Acceleration").]

AT-WILL EMPLOYMENT
Your employment with the Company is at-will, meaning either you or the Company may terminate the employment relationship at any time and for any reason, with or without cause or notice.

CONFIDENTIALITY AND INVENTION ASSIGNMENT
As a condition of employment, you must sign and comply with the Company's standard Confidential Information and Invention Assignment Agreement ("CIIA"), a copy of which is enclosed. You represent that you are not subject to any prior agreement that would restrict your ability to perform your duties for the Company, and that you will not use or disclose any proprietary information of any former employer.

CONDITIONS OF EMPLOYMENT
This offer is contingent upon: (i) your execution of the CIIA; (ii) satisfactory completion of a background check; (iii) your eligibility to work in the United States (I-9 verification); and (iv) Board of Directors approval of your equity grant.

ENTIRE AGREEMENT
This letter, together with the CIIA and any equity documents, forms the complete and exclusive statement of your employment terms, superseding any prior representations. This agreement is governed by California law.

Please sign and return this letter by [DEADLINE]. We look forward to you joining the team.

Sincerely,

___________________________
[CEO NAME], CEO
[COMPANY NAME], Inc.

I accept this offer of employment:

___________________________     _______________
[CANDIDATE NAME]                Date`,

consulting: `CONSULTING AGREEMENT

This Consulting Agreement (the "Agreement") is entered into as of [DATE] between [COMPANY NAME], Inc., a Delaware corporation (the "Company"), and [CONSULTANT NAME / ENTITY] ("Consultant").

1. SERVICES
Consultant agrees to perform consulting services as described in Exhibit A (the "Services"). Consultant may perform the Services at any time and place of Consultant's choosing, and using equipment, tools, and materials of Consultant's choosing, provided the Services are completed by any agreed deadlines. The Company shall not control the manner or means by which Consultant performs the Services.

2. COMPENSATION
The Company shall pay Consultant $[RATE] per [hour/month/project]. Consultant shall submit invoices [weekly/monthly], and the Company shall pay within [Net-30] days. The Company shall reimburse Consultant for pre-approved, reasonable expenses.

3. INDEPENDENT CONTRACTOR STATUS
Consultant is an independent contractor and is not an employee, agent, partner, or joint venturer of the Company. Consultant is solely responsible for all taxes, withholdings, and other statutory or contractual obligations of any sort, including worker's compensation. Consultant is not entitled to any employee benefits.

4. INTELLECTUAL PROPERTY
Consultant agrees that any work product, inventions, or deliverables created by Consultant under this Agreement (the "Work Product") shall be considered "work made for hire" to the maximum extent permitted by law. To the extent any Work Product is not deemed work for hire, Consultant hereby irrevocably assigns to the Company all right, title, and interest in and to such Work Product, including all intellectual property rights therein.

5. CONFIDENTIALITY
Consultant agrees to keep all Company Confidential Information strictly confidential and not to disclose it to any third party without the Company's prior written consent. "Confidential Information" means all non-public information of the Company. This obligation survives termination of this Agreement.

6. REPRESENTATIONS AND WARRANTIES
Consultant represents that: (a) Consultant has full authority to enter into this Agreement; (b) performance of the Services will not violate any other agreement; (c) the Work Product will not infringe any third-party intellectual property rights; and (d) Consultant is not debarred, suspended, or excluded from any government contract.

7. TERM AND TERMINATION
This Agreement commences on the date above and continues until [END DATE / "completion of the Services"], unless terminated earlier. Either party may terminate this Agreement upon [30] days' written notice. The Company may terminate immediately for Consultant's material breach. Sections 4, 5, 7, and 8 survive termination.

8. LIMITATION OF LIABILITY
NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES. THE COMPANY'S TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID IN THE THREE MONTHS PRECEDING THE CLAIM.

9. GOVERNING LAW
This Agreement is governed by the laws of the State of Delaware.

COMPANY                             CONSULTANT

By: ___________________________     By: ___________________________
Name:                               Name:
Title:                              Date:
Date:

EXHIBIT A — SCOPE OF SERVICES
[Describe specific deliverables, timelines, and acceptance criteria]`,

service: `MASTER SERVICES AGREEMENT
(SaaS / Technology Services)

This Master Services Agreement ("MSA") is entered into as of [DATE] between [VENDOR NAME], Inc. ("Vendor") and [CUSTOMER NAME] ("Customer").

1. SERVICES AND ORDER FORMS
Vendor will provide the services described in one or more Order Forms referencing this MSA (each an "Order Form"). Each Order Form is incorporated herein by reference. In the event of a conflict, the Order Form prevails.

2. SUBSCRIPTIONS AND ACCESS
Subject to payment of all fees, Vendor grants Customer a limited, non-exclusive, non-transferable right to access and use the Vendor platform and services ("Platform") during the Subscription Term solely for Customer's internal business purposes. Customer may not sublicense, resell, or permit unauthorized access to the Platform.

3. FEES AND PAYMENT
Customer shall pay the fees set forth in each Order Form. Fees are due [Net-30] days from invoice. Overdue amounts accrue interest at 1.5% per month. Vendor may suspend access on [15] days' notice for non-payment. All fees are non-refundable except as expressly stated herein.

4. SERVICE LEVEL AGREEMENT (SLA)
Vendor shall use commercially reasonable efforts to ensure Platform availability of at least 99.9% measured monthly, excluding Scheduled Maintenance. "Downtime" means unavailability exceeding 5 consecutive minutes.

  SLA Credit Schedule:
  ─────────────────────────────────────────
  Monthly Uptime %      Credit (of MRR)
  ─────────────────────────────────────────
  99.0% – 99.9%         10%
  95.0% – 99.0%         25%
  Below 95.0%           50%
  ─────────────────────────────────────────

  Credits are Customer's sole remedy for SLA failures. Credits expire if not claimed within [60] days. Scheduled Maintenance: Vendor will provide [72] hours' notice for maintenance windows expected to exceed [30] minutes.

5. DATA AND PRIVACY
Customer owns all Customer Data. Vendor processes Customer Data solely to provide the Services and as set forth in the Data Processing Addendum ("DPA"), incorporated herein. Vendor shall maintain reasonable security measures including encryption at rest and in transit, SOC 2 Type II certification, and annual penetration testing.

6. CONFIDENTIALITY
Each party agrees to keep the other's Confidential Information confidential using at least the same degree of care it uses for its own confidential information (but no less than reasonable care), and not to disclose it except to employees and contractors with a need to know. Obligations survive [3] years post-termination, or indefinitely for trade secrets.

7. INTELLECTUAL PROPERTY
Vendor retains all rights in the Platform and any Vendor IP. Customer retains all rights in Customer Data and Customer IP. Feedback and suggestions provided by Customer to Vendor may be used by Vendor without restriction.

8. WARRANTIES
Each party warrants it has the authority to enter this Agreement. Vendor warrants the Platform will perform materially as described in the applicable documentation. EXCEPT AS EXPRESSLY SET FORTH HEREIN, ALL WARRANTIES ARE DISCLAIMED.

9. INDEMNIFICATION
Each party shall indemnify the other against third-party claims arising from its gross negligence or willful misconduct. Vendor shall additionally indemnify Customer against claims that the Platform infringes a third-party IP right.

10. LIMITATION OF LIABILITY
NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. EACH PARTY'S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE FEES PAID IN THE TWELVE MONTHS PRECEDING THE CLAIM.

11. TERM AND TERMINATION
This MSA commences on the Effective Date and continues until all Order Forms expire or are terminated. Either party may terminate for material breach upon [30] days' notice and failure to cure.

12. GENERAL
Governing Law: Delaware. Entire Agreement. Amendments in writing. No waiver. Severability.

VENDOR                              CUSTOMER

By: ___________________________     By: ___________________________
Name:                               Name:
Title:                              Title:
Date:                               Date:`,

partnership: `PARTNERSHIP AGREEMENT
(Strategic Partnership / Joint Go-to-Market)

This Strategic Partnership Agreement ("Agreement") is entered into as of [DATE] between [COMPANY A], Inc. ("Partner A") and [COMPANY B], Inc. ("Partner B") (collectively the "Parties").

1. PURPOSE
The Parties desire to establish a strategic partnership to [describe purpose: e.g., jointly market, integrate, or co-develop products/services] (the "Partnership").

2. RESPONSIBILITIES
Partner A shall: [List specific obligations, e.g., provide API access, co-marketing budget, dedicated technical resources]
Partner B shall: [List specific obligations, e.g., integrate Partner A product, provide customer introductions, joint sales activities]

3. REVENUE SHARING
[Option A – Referral Fee]: Partner A shall pay Partner B a referral fee of [X]% of net revenue collected from customers referred by Partner B, for a period of [12] months from first conversion.
[Option B – Revenue Share]: Net revenue from the Partnership shall be split [X]% to Partner A and [Y]% to Partner B, payable [quarterly], based on mutually agreed attribution methodology.
Payments are due within [30] days of the end of each quarter. Each Party shall maintain records sufficient to verify revenue calculations and provide the other Party the right to audit upon [30] days' notice.

4. INTELLECTUAL PROPERTY
Each Party retains ownership of its pre-existing IP. Any jointly developed IP ("Joint IP") shall be jointly owned, with each Party having the right to exploit Joint IP without accounting to the other, unless otherwise agreed in writing.

5. BRANDING AND MARKETING
Each Party grants the other a limited, non-exclusive license to use its trademarks and logos solely in connection with Partnership marketing activities approved in advance by the licensor. Each Party shall comply with the other's brand guidelines.

6. EXCLUSIVITY
[Optional] During the Term, neither Party shall enter into a substantially similar partnership with [identify competitors / category], without prior written consent.

7. CONFIDENTIALITY
The Parties shall keep all Partnership terms and shared information confidential. Standard NDA provisions apply for a period of [3] years post-termination.

8. TERM AND TERMINATION
Initial Term: [12] months, automatically renewing for successive [12]-month periods unless either Party provides [60] days' written notice of non-renewal. Either Party may terminate immediately upon the other's material breach that remains uncured after [30] days' notice.

9. LIMITATION OF LIABILITY
NEITHER PARTY SHALL BE LIABLE FOR INDIRECT OR CONSEQUENTIAL DAMAGES. TOTAL LIABILITY SHALL NOT EXCEED AMOUNTS PAID IN THE PRECEDING [12] MONTHS.

10. GOVERNING LAW
This Agreement is governed by the laws of the State of Delaware.

PARTNER A                           PARTNER B

By: ___________________________     By: ___________________________
Name:                               Name:
Title:                              Title:
Date:                               Date:`,

licensing: `INTELLECTUAL PROPERTY LICENSE AGREEMENT

This Intellectual Property License Agreement ("Agreement") is entered into as of [DATE] between [LICENSOR NAME], Inc. ("Licensor") and [LICENSEE NAME] ("Licensee").

1. GRANT OF LICENSE
Subject to the terms and conditions of this Agreement and payment of all fees, Licensor hereby grants to Licensee a [non-exclusive / exclusive], [non-transferable / transferable], [non-sublicensable / sublicensable] license to use the Licensor's [describe: software, patents, trademarks, copyrighted content, technology] (the "Licensed IP") solely for [describe permitted use] in [territory] during the License Term.

2. LICENSE FEES AND ROYALTIES
Upfront License Fee: $[AMOUNT] due upon execution.
Royalties: [X]% of net revenue attributable to products or services incorporating the Licensed IP, payable [quarterly], within [30] days of quarter-end. Licensee shall provide quarterly royalty reports.
Minimum Annual Royalty: $[AMOUNT] per year, regardless of actual royalties earned, commencing in Year [2].
Audit Rights: Licensor may audit Licensee's royalty records upon [30] days' notice, no more than once per year. If audit reveals underpayment of more than [5]%, Licensee shall reimburse audit costs.

3. INTELLECTUAL PROPERTY OWNERSHIP
Licensor retains all right, title, and interest in and to the Licensed IP. Nothing herein transfers ownership of the Licensed IP to Licensee. Licensee shall not challenge the validity or enforceability of the Licensed IP.

4. SUBLICENSING
[If sublicensing permitted]: Licensee may sublicense the Licensed IP to [describe permitted sublicensees], provided each sublicense is in writing, no less protective than this Agreement, and Licensee remains liable for any sublicensee's breach.

5. IMPROVEMENTS
[Licensor owns all improvements]: Any improvements, modifications, or derivative works of the Licensed IP created by or for Licensee ("Improvements") shall be owned by Licensor, and Licensee hereby assigns all rights thereto to Licensor.
[Licensee retains improvements]: Licensee retains ownership of Improvements. Licensee hereby grants Licensor a perpetual, irrevocable, royalty-free license to use any Improvements.

6. CONFIDENTIALITY
Licensee shall keep the Licensed IP and all related technical documentation confidential using at least the same degree of care as its own confidential information.

7. WARRANTIES AND DISCLAIMER
Licensor warrants that it has the right to grant the license herein and that, to its knowledge, use of the Licensed IP as licensed herein does not infringe any third-party rights. EXCEPT AS EXPRESSLY STATED, ALL WARRANTIES ARE DISCLAIMED.

8. INDEMNIFICATION
Licensor shall indemnify Licensee against third-party claims that the Licensed IP, as used within the scope of this license, infringes any patent, copyright, or trademark.

9. TERM AND TERMINATION
License Term: [X] years from the Effective Date. Licensor may terminate immediately if Licensee (a) materially breaches and fails to cure within [30] days; (b) challenges the Licensed IP; or (c) becomes insolvent.

10. GOVERNING LAW
This Agreement is governed by the laws of the State of Delaware.

LICENSOR                            LICENSEE

By: ___________________________     By: ___________________________
Name:                               Name:
Title:                              Title:
Date:                               Date:`,

contractor: `INDEPENDENT CONTRACTOR AGREEMENT
(IRS Section 530 / 1099 Compliant)

This Independent Contractor Agreement ("Agreement") is entered into as of [DATE] between [COMPANY NAME], Inc. ("Company") and [CONTRACTOR NAME / ENTITY] ("Contractor").

1. INDEPENDENT CONTRACTOR RELATIONSHIP
Contractor is and shall at all times be an independent contractor and not an employee, partner, agent, or joint venturer of the Company. The Company shall not have the right to control the manner, means, or method by which Contractor performs services. Contractor retains the right to perform services for other clients during the Term, provided such work does not create a conflict of interest or breach any confidentiality obligation.

BEHAVIORAL CONTROL: Company provides the desired result, not step-by-step instructions. Contractor uses its own training, tools, and judgment.
FINANCIAL CONTROL: Contractor invoices for completed work; is not reimbursed for ordinary business expenses without written pre-approval; bears risk of profit and loss.
TYPE OF RELATIONSHIP: No employee benefits are provided. This is a project-based engagement; no expectation of ongoing work.

2. SERVICES
Contractor shall perform the services described in Exhibit A (the "Services"). Deliverables, timelines, and acceptance criteria are specified in Exhibit A. Contractor may engage subcontractors to assist, provided Contractor remains responsible for deliverable quality and subcontractors are bound by confidentiality obligations no less protective than this Agreement.

3. COMPENSATION
Company shall pay Contractor $[RATE] per [hour/project milestone]. Contractor shall submit invoices [bi-weekly/monthly], and Company shall pay within [Net-30] days. Company shall issue IRS Form 1099-NEC for payments totaling $600 or more in a calendar year. Contractor is solely responsible for all federal, state, and local taxes, including self-employment tax (currently 15.3% on net self-employment income up to the Social Security wage base).

4. EXPENSES
Company shall reimburse only expenses expressly pre-approved in writing. Contractor shall submit receipts within [30] days of incurring any approved expense.

5. INTELLECTUAL PROPERTY AND WORK PRODUCT
All work product, deliverables, inventions, and materials created by Contractor in the course of performing Services (the "Work Product") shall, to the maximum extent permitted by applicable law, constitute works made for hire for Company. To the extent any Work Product does not qualify as work made for hire, Contractor hereby irrevocably assigns to Company all right, title, and interest therein, including all intellectual property rights worldwide, in perpetuity.

Contractor represents that the Work Product will not infringe any third-party intellectual property rights. Contractor shall not incorporate any open-source software subject to a copyleft or "viral" license into the Work Product without prior written approval.

6. CONFIDENTIALITY
Contractor shall keep all Company Confidential Information strictly confidential and shall not use it for any purpose other than performing the Services. This obligation continues for [2] years post-termination and indefinitely for trade secrets.

7. NO SOLICITATION
During the Term and for [12] months thereafter, Contractor shall not directly solicit Company employees or contractors for other engagements.

8. TERM AND TERMINATION
This Agreement commences on the date above and continues until [DATE / completion of Services described in Exhibit A]. Either party may terminate upon [14] days' written notice. Company may terminate immediately for Contractor's material breach or failure to deliver Work Product meeting the specifications in Exhibit A. Upon termination, Contractor shall deliver all Work Product (whether completed or in progress) and return all Company property.

9. REPRESENTATIONS AND WARRANTIES
Contractor represents: (a) it has full legal authority to enter this Agreement; (b) performance will not violate any other agreement; (c) no prior IP encumbers the Work Product; (d) Contractor is legally authorized to work in the United States; and (e) Contractor carries appropriate business liability insurance.

10. LIMITATION OF LIABILITY
NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. COMPANY'S TOTAL LIABILITY SHALL NOT EXCEED FEES PAID IN THE [3] MONTHS PRECEDING THE CLAIM.

11. GOVERNING LAW
This Agreement is governed by the laws of the State of [DELAWARE / CALIFORNIA].

COMPANY                             CONTRACTOR

By: ___________________________     Signature: ___________________________
Name:                               Name:
Title:                              EIN / SSN: ___-__-____ (for 1099)
Date:                               Date:

EXHIBIT A — SCOPE OF WORK
Project Title:
Deliverables:
Timeline / Milestones:
Acceptance Criteria:`,

loi: `LETTER OF INTENT
(Acquisition / Strategic Transaction)

[DATE]

[TARGET COMPANY NAME]
Attn: [CEO NAME]
[ADDRESS]

Dear [CEO NAME]:

This Letter of Intent ("LOI") sets forth the principal terms under which [ACQUIRER NAME], Inc. or its designated affiliate ("Acquirer") proposes to acquire [TARGET COMPANY NAME] ("Company") (the "Transaction"). This LOI is intended to facilitate further negotiations and is subject to the execution of a definitive agreement.

─────────────────────────────────────────────────
SECTION I — NON-BINDING TERMS
─────────────────────────────────────────────────
(The following terms are non-binding and subject to due diligence and definitive documentation)

1. STRUCTURE OF TRANSACTION
The Transaction will be structured as a [merger / stock acquisition / asset acquisition] pursuant to which Acquirer will acquire [100% / ___%] of the outstanding equity interests (or all or substantially all assets) of the Company.

2. PURCHASE PRICE
Total enterprise value of approximately $[AMOUNT] (the "Purchase Price"), subject to adjustment for:
  (a) Cash and cash equivalents at closing
  (b) Indebtedness and transaction expenses
  (c) Net working capital adjustment relative to a target of $[NWC TARGET]
  (d) A customary indemnification escrow of [10]% of Purchase Price held for [18] months

3. EARNOUT
[Optional] Up to $[EARNOUT AMOUNT] in additional consideration contingent upon achievement of the following milestones:
  Year 1 Target: $[REVENUE/METRIC] → $[PAYMENT]
  Year 2 Target: $[REVENUE/METRIC] → $[PAYMENT]
  Earnout metrics will be calculated in accordance with GAAP, consistently applied.

4. CONSIDERATION MIX
  Cash at Closing:   $[AMOUNT] ([___]% of Purchase Price)
  Stock Consideration: [___] shares of Acquirer common stock (valued at $[PRICE] per share, subject to registration rights)
  Earnout:           Up to $[EARNOUT AMOUNT] as described above

5. KEY EMPLOYEE RETENTION
Key employees identified in Exhibit A will be offered employment agreements with retention packages totaling $[AMOUNT], to vest over [2-4] years from closing.

6. DUE DILIGENCE
Acquirer will conduct customary due diligence covering financial, legal, technical, and commercial matters. Target shall provide access to books, records, management, facilities, and systems. Estimated diligence period: [30-45] days.

7. CONDITIONS TO CLOSING
  (a) Negotiation and execution of definitive Transaction documents
  (b) Satisfactory completion of due diligence
  (c) Required regulatory approvals (including HSR Act filing if applicable)
  (d) Third-party consents as required
  (e) No material adverse change in the business

8. REPRESENTATIONS, WARRANTIES, AND INDEMNIFICATION
The definitive agreement will contain customary representations, warranties, and indemnification provisions, including survival periods of [18] months and a [10]% deductible basket on a [tipping / non-tipping] basis.

─────────────────────────────────────────────────
SECTION II — BINDING TERMS
─────────────────────────────────────────────────
(The following provisions are legally binding upon execution)

9. EXCLUSIVITY
During the period beginning on the date hereof and ending [45] days thereafter (the "Exclusivity Period"), the Company, its shareholders, officers, directors, and representatives shall not, directly or indirectly, solicit, initiate, encourage, or enter into discussions with any other party regarding any acquisition, merger, sale of assets, or similar transaction. The Exclusivity Period may be extended by mutual written agreement.

10. CONFIDENTIALITY
Each party shall keep the terms of this LOI and all information shared in connection with the Transaction strictly confidential, except as required by law.

11. NO SHOP / NO HIRE
During the Exclusivity Period, neither party shall solicit the other party's employees or customers.

12. COSTS AND EXPENSES
Each party shall bear its own costs and expenses related to this LOI and the Transaction, unless otherwise agreed in writing.

13. TERMINATION
Either party may terminate this LOI upon [5] days' written notice if a definitive agreement has not been executed by [OUTSIDE DATE].

14. GOVERNING LAW
This LOI shall be governed by the laws of the State of Delaware.

This LOI does not constitute a binding agreement to consummate the Transaction, except with respect to Sections 9–14. Either party may walk away from the Transaction prior to execution of a definitive agreement, without liability, except with respect to the binding provisions.

Sincerely,

___________________________
[AUTHORIZED SIGNATORY]
[ACQUIRER NAME], Inc.

AGREED AND ACCEPTED:

___________________________     _______________
[CEO / AUTHORIZED SIGNATORY]    Date
[TARGET COMPANY NAME]`,
};

// ── Seed docs ────────────────────────────────────────────────────────────────
function makeSeed(): ContractDoc[] {
  const now = new Date().toISOString();
  return (Object.keys(TEMPLATES) as Exclude<DocCategory, "custom">[]).map((cat) => ({
    id: `seed-${cat}`,
    name: CAT_META[cat].label,
    category: cat,
    status: "draft" as DocStatus,
    content: TEMPLATES[cat],
    createdAt: now,
    updatedAt: now,
    signers: [],
  }));
}

function load(): ContractDoc[] {
  if (typeof window === "undefined") return makeSeed();
  try {
    const s = localStorage.getItem("contractlab-docs-v4");
    return s ? JSON.parse(s) : makeSeed();
  } catch { return makeSeed(); }
}

function save(docs: ContractDoc[]) {
  try { localStorage.setItem("contractlab-docs-v4", JSON.stringify(docs)); } catch {}
}

// ── Status colours ───────────────────────────────────────────────────────────
const STATUS_COLOR: Record<DocStatus, string> = {
  draft:    "#94A3B8",
  review:   "#F0B429",
  signed:   "#2ECC71",
  archived: "#64748B",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function ContractLab() {
  const [docs, setDocs]               = useState<ContractDoc[]>([]);
  const [selectedId, setSelectedId]   = useState<string>("");
  const [catFilter, setCatFilter]     = useState<DocCategory | "all">("all");
  const [statusFilter, setStatus]     = useState<StatusFilter>("all");
  const [rightTab, setRightTab]       = useState<RightTab>("signers");
  const [showRight, setShowRight]     = useState(true);
  const [showSigModal, setShowSig]    = useState(false);
  const [showNewDoc, setShowNewDoc]   = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [sigMode, setSigMode]         = useState<SignMode>("draw");
  const [typedSig, setTypedSig]       = useState("");
  const [signerName, setSignerName]   = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [emailTo, setEmailTo]         = useState("");
  const [editMode, setEditMode]       = useState(false);
  const [editContent, setEditContent] = useState("");
  const [savingToGH, setSavingToGH]   = useState(false);
  const [ghStatus, setGhStatus]       = useState("");
  const [ghConfigured, setGhConfigured] = useState(true);

  // Upload modal state
  const [uploadTab, setUploadTab]     = useState<"computer" | "github">("computer");
  const [uploadName, setUploadName]   = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadGHUrl, setUploadGHUrl] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);

  // Load docs + fetch GitHub-saved docs
  useEffect(() => {
    const local = load();
    setDocs(local);
    if (local.length) setSelectedId(local[0].id);

    // Fetch GitHub-stored custom docs
    fetch("/api/contracts")
      .then(r => r.json())
      .then((data: { files?: { name: string; path: string; sha: string; content: string }[]; configured?: boolean }) => {
        if (data.configured === false) { setGhConfigured(false); return; }
        if (!data.files?.length) return;
        setDocs(prev => {
          const next = [...prev];
          for (const f of data.files!) {
            const existing = next.find(d => d.githubPath === f.path);
            if (existing) {
              existing.content = f.content;
              existing.githubSha = f.sha;
            } else {
              next.push({
                id: `gh-${f.name}`,
                name: f.name.replace(/\.(md|txt)$/, ""),
                category: "custom",
                status: "draft",
                content: f.content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                signers: [],
                githubPath: f.path,
                githubSha: f.sha,
              });
            }
          }
          save(next);
          return next;
        });
      })
      .catch(() => {});
  }, []);

  const selected = docs.find(d => d.id === selectedId);

  const visible = docs.filter(d => {
    if (catFilter !== "all" && d.category !== catFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  function updateDoc(id: string, patch: Partial<ContractDoc>) {
    setDocs(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d);
      save(next);
      return next;
    });
  }

  function addDoc(doc: ContractDoc) {
    setDocs(prev => { const next = [doc, ...prev]; save(next); return next; });
    setSelectedId(doc.id);
  }

  function deleteDoc(id: string) {
    setDocs(prev => { const next = prev.filter(d => d.id !== id); save(next); return next; });
    setSelectedId(docs.find(d => d.id !== id)?.id ?? "");
  }

  // ── Signature canvas ─────────────────────────────────────────────────────
  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const r = canvasRef.current!.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  }
  function doDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const r = canvasRef.current!.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.stroke();
  }
  function stopDraw() { drawing.current = false; }
  function clearCanvas() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function applySignature() {
    if (!selected) return;
    const newSigner: Signer = {
      id: Date.now().toString(),
      name: signerName || "Unknown",
      email: signerEmail || "",
      status: "signed",
      signedAt: new Date().toISOString(),
    };
    updateDoc(selected.id, {
      signers: [...selected.signers, newSigner],
      status: "signed",
    });
    setShowSig(false);
    setSignerName("");
    setSignerEmail("");
    clearCanvas();
    setTypedSig("");
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function exportPDF() { window.print(); }

  function exportMD() {
    if (!selected) return;
    const blob = new Blob([selected.content], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.name}.md`;
    a.click();
  }

  function exportTXT() {
    if (!selected) return;
    const blob = new Blob([selected.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.name}.txt`;
    a.click();
  }

  // ── Save to GitHub ────────────────────────────────────────────────────────
  async function saveToGitHub() {
    if (!selected) return;
    setSavingToGH(true);
    setGhStatus("");
    try {
      const filename = selected.name.replace(/[^a-zA-Z0-9_-]/g, "_") + ".md";
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: selected.content, sha: selected.githubSha }),
      });
      const data = await res.json() as { sha?: string; path?: string; error?: string };
      if (data.error) { setGhStatus(`Error: ${data.error}`); return; }
      updateDoc(selected.id, { githubSha: data.sha, githubPath: data.path });
      setGhStatus("Saved to GitHub");
    } catch (e) {
      setGhStatus("Network error");
    } finally {
      setSavingToGH(false);
      setTimeout(() => setGhStatus(""), 3000);
    }
  }

  // ── Upload handlers ───────────────────────────────────────────────────────
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadName) setUploadName(file.name.replace(/\.(md|txt)$/, ""));
    const reader = new FileReader();
    reader.onload = ev => setUploadContent(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  async function fetchGHUrl() {
    if (!uploadGHUrl) return;
    setUploadLoading(true);
    try {
      let url = uploadGHUrl;
      if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
        url = url
          .replace("github.com", "raw.githubusercontent.com")
          .replace("/blob/", "/");
      }
      const r = await fetch(url);
      const text = await r.text();
      setUploadContent(text);
      if (!uploadName) {
        const parts = url.split("/");
        setUploadName(parts[parts.length - 1].replace(/\.(md|txt)$/, ""));
      }
    } catch {
      alert("Failed to fetch file. Make sure the URL is a public raw GitHub URL.");
    } finally {
      setUploadLoading(false);
    }
  }

  function confirmUpload() {
    if (!uploadName || !uploadContent) return;
    const doc: ContractDoc = {
      id: `custom-${Date.now()}`,
      name: uploadName,
      category: "custom",
      status: "draft",
      content: uploadContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signers: [],
    };
    addDoc(doc);
    setShowUpload(false);
    setUploadName("");
    setUploadContent("");
    setUploadGHUrl("");
    setUploadTab("computer");
    setCatFilter("custom");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const bg        = "#1C2127";
  const surf1     = "#252A31";
  const surf2     = "#2F343C";
  const surf3     = "#383E47";
  const line      = "rgba(255,255,255,0.08)";
  const lineStr   = "rgba(255,255,255,0.14)";
  const text1     = "#E2E8F0";
  const text2     = "#94A3B8";
  const text3     = "#64748B";
  const accent    = "#2D72D2";
  const mono      = "'JetBrains Mono', 'SF Mono', monospace";
  const serif     = "'Newsreader', 'Georgia', serif";
  const sans      = "'Inter Tight', 'Inter', system-ui, sans-serif";

  return (
    <div style={{ display: "flex", height: "100vh", background: bg, color: text1, fontFamily: sans, overflow: "hidden" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 228, background: surf1, borderRight: `1px solid ${line}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${line}` }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", color: text3, textTransform: "uppercase", marginBottom: 8 }}>CONTRACT LAB</div>
          <button
            onClick={() => setShowNewDoc(true)}
            style={{ width: "100%", padding: "7px 0", background: accent, color: "#fff", border: "none", borderRadius: 4, fontFamily: mono, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer" }}
          >+ NEW DOCUMENT</button>
        </div>

        {/* Status filter */}
        <div style={{ padding: "8px 12px 4px", borderBottom: `1px solid ${line}` }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: text3, textTransform: "uppercase", marginBottom: 6 }}>STATUS</div>
          {(["all","draft","review","signed","archived"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "4px 8px", marginBottom: 1, background: statusFilter === s ? surf3 : "transparent", border: "none", borderRadius: 3, color: statusFilter === s ? text1 : text2, fontFamily: mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>

        {/* Category nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: text3, textTransform: "uppercase", marginBottom: 6, padding: "0 4px" }}>CATEGORIES</div>
          {(["all", ...Object.keys(CAT_META)] as (DocCategory | "all")[]).map(cat => {
            const meta = cat === "all" ? null : CAT_META[cat];
            const count = cat === "all" ? docs.length : docs.filter(d => d.category === cat).length;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "5px 8px", marginBottom: 1, background: catFilter === cat ? surf3 : "transparent", border: "none", borderRadius: 3, cursor: "pointer", textAlign: "left" }}>
                {meta && <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />}
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.05em", color: catFilter === cat ? text1 : text2, flex: 1, textTransform: "uppercase" }}>
                  {cat === "all" ? "ALL" : meta!.label}
                </span>
                <span style={{ fontFamily: mono, fontSize: 9, color: text3 }}>{count}</span>
              </button>
            );
          })}
        </nav>

        {/* Upload button */}
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${line}` }}>
          <button onClick={() => setShowUpload(true)}
            style={{ width: "100%", padding: "6px 0", background: surf3, color: text2, border: `1px solid ${lineStr}`, borderRadius: 4, fontFamily: mono, fontSize: 10, letterSpacing: "0.06em", cursor: "pointer" }}>
            ↑ UPLOAD DOCUMENT
          </button>
        </div>
      </aside>

      {/* ── Doc list ────────────────────────────────────────────────────── */}
      <div style={{ width: 260, background: surf1, borderRight: `1px solid ${line}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${line}` }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: text3, textTransform: "uppercase" }}>
            {visible.length} DOCUMENT{visible.length !== 1 ? "S" : ""}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {visible.map(doc => {
            const meta = CAT_META[doc.category];
            const isActive = doc.id === selectedId;
            return (
              <div key={doc.id} onClick={() => { setSelectedId(doc.id); setEditMode(false); }}
                style={{ padding: "12px 16px", borderBottom: `1px solid ${line}`, cursor: "pointer", background: isActive ? surf2 : "transparent", borderLeft: isActive ? `2px solid ${meta.color}` : "2px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: mono, fontSize: 9, color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{meta.label}</span>
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, color: isActive ? text1 : text2, fontWeight: 500, marginBottom: 3, lineHeight: 1.3 }}>{doc.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 6px", borderRadius: 10, background: `${STATUS_COLOR[doc.status]}18` }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: STATUS_COLOR[doc.status] }} />
                    <span style={{ fontFamily: mono, fontSize: 8, color: STATUS_COLOR[doc.status], letterSpacing: "0.06em", textTransform: "uppercase" }}>{doc.status}</span>
                  </span>
                  {doc.githubPath && <span style={{ fontFamily: mono, fontSize: 8, color: text3 }}>⎇ GH</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selected ? (
          <>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: `1px solid ${line}`, background: surf1, flexShrink: 0 }}>
              <span style={{ fontFamily: mono, fontSize: 9, color: CAT_META[selected.category].color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {CAT_META[selected.category].label}
              </span>
              <span style={{ color: text3, fontSize: 12 }}>›</span>
              <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: text1, flex: 1 }}>{selected.name}</span>

              {/* Status selector */}
              <select value={selected.status} onChange={e => updateDoc(selected.id, { status: e.target.value as DocStatus })}
                style={{ background: surf2, border: `1px solid ${lineStr}`, color: text2, padding: "4px 8px", borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer" }}>
                {(["draft","review","signed","archived"] as DocStatus[]).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>

              <button onClick={() => { setEditMode(!editMode); if (!editMode) setEditContent(selected.content); }}
                style={{ padding: "4px 12px", background: editMode ? accent : surf3, color: editMode ? "#fff" : text2, border: `1px solid ${lineStr}`, borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.05em" }}>
                {editMode ? "EDITING" : "EDIT"}
              </button>
              {editMode && (
                <button onClick={() => { updateDoc(selected.id, { content: editContent }); setEditMode(false); }}
                  style={{ padding: "4px 12px", background: "#2ECC71", color: "#fff", border: "none", borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.05em" }}>
                  SAVE
                </button>
              )}
              <button onClick={() => setShowSig(true)}
                style={{ padding: "4px 12px", background: surf3, color: text2, border: `1px solid ${lineStr}`, borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.05em" }}>
                ✍ SIGN
              </button>
              <button onClick={() => setShowRight(!showRight)}
                style={{ padding: "4px 10px", background: showRight ? surf3 : "transparent", color: text2, border: `1px solid ${lineStr}`, borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer" }}>
                ⊞
              </button>
            </div>

            {/* Document */}
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: bg }} className="print-area">
              <div style={{ maxWidth: 760, margin: "0 auto", background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.4)" }}>
                <div style={{ height: 5, background: CAT_META[selected.category].color }} />
                <div style={{ padding: "40px 52px 52px" }}>
                  {editMode ? (
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                      style={{ width: "100%", minHeight: 600, fontFamily: mono, fontSize: 12, lineHeight: 1.7, border: "1px solid #E2E8F0", borderRadius: 4, padding: 12, color: "#1C2127", resize: "vertical", outline: "none" }} />
                  ) : (
                    <pre style={{ fontFamily: serif, fontSize: 14, lineHeight: 1.8, color: "#1A202C", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                      {selected.content}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Export bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderTop: `1px solid ${line}`, background: surf1, flexShrink: 0 }}>
              <span style={{ fontFamily: mono, fontSize: 9, color: text3, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 8 }}>EXPORT</span>
              <button onClick={exportPDF} style={exportBtn(surf2, lineStr, text2, mono)}>PDF</button>
              <button onClick={exportMD}  style={exportBtn(surf2, lineStr, text2, mono)}>.MD</button>
              <button onClick={exportTXT} style={exportBtn(surf2, lineStr, text2, mono)}>TXT</button>
              <div style={{ flex: 1 }} />
              {ghStatus && <span style={{ fontFamily: mono, fontSize: 10, color: "#2ECC71" }}>{ghStatus}</span>}
              {!ghConfigured && <span style={{ fontFamily: mono, fontSize: 9, color: "#F0B429" }}>Set GITHUB_TOKEN in Vercel to enable cloud save</span>}
              <button onClick={saveToGitHub} disabled={savingToGH}
                style={{ ...exportBtn(surf2, lineStr, text2, mono), opacity: savingToGH ? 0.5 : 1 }}>
                {savingToGH ? "SAVING…" : "⎇ SAVE TO GITHUB"}
              </button>
              <button onClick={() => {
                if (emailTo && selected) {
                  const subject = encodeURIComponent(`Document: ${selected.name}`);
                  const body = encodeURIComponent(selected.content.substring(0, 2000));
                  window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`);
                }
              }} style={exportBtn(surf2, lineStr, text2, mono)}>✉ SEND</button>
              <input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@email.com"
                style={{ background: surf2, border: `1px solid ${lineStr}`, color: text2, padding: "4px 10px", borderRadius: 4, fontFamily: mono, fontSize: 10, width: 180, outline: "none" }} />
              <button onClick={() => deleteDoc(selected.id)}
                style={{ ...exportBtn(surf2, lineStr, "#EF4444", mono), marginLeft: 8 }}>✕ DELETE</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: text3, fontFamily: mono, fontSize: 12, letterSpacing: "0.08em" }}>
            NO DOCUMENT SELECTED
          </div>
        )}
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      {showRight && selected && (
        <aside style={{ width: 288, background: surf1, borderLeft: `1px solid ${line}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${line}` }}>
            {(["signers","activity","details"] as RightTab[]).map(t => (
              <button key={t} onClick={() => setRightTab(t)}
                style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", borderBottom: rightTab === t ? `2px solid ${accent}` : "2px solid transparent", color: rightTab === t ? text1 : text3, fontFamily: mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {rightTab === "signers" && (
              <>
                {selected.signers.length === 0 && (
                  <div style={{ fontFamily: mono, fontSize: 10, color: text3, textAlign: "center", marginTop: 32 }}>NO SIGNERS YET</div>
                )}
                {selected.signers.map(s => (
                  <div key={s.id} style={{ padding: "10px 12px", background: surf2, borderRadius: 6, marginBottom: 8, border: `1px solid ${line}` }}>
                    <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: text1, marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: text3, marginBottom: 6 }}>{s.email}</div>
                    <span style={{ padding: "2px 8px", borderRadius: 10, background: s.status === "signed" ? "#2ECC7120" : "#94A3B820", fontFamily: mono, fontSize: 9, color: s.status === "signed" ? "#2ECC71" : text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {s.status}
                    </span>
                    {s.signedAt && <div style={{ fontFamily: mono, fontSize: 9, color: text3, marginTop: 4 }}>{new Date(s.signedAt).toLocaleDateString()}</div>}
                  </div>
                ))}
                <button onClick={() => setShowSig(true)}
                  style={{ width: "100%", padding: "8px 0", background: surf2, color: text2, border: `1px solid ${lineStr}`, borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer", marginTop: 8 }}>
                  + ADD SIGNATURE
                </button>
              </>
            )}
            {rightTab === "activity" && (
              <div>
                <div style={{ padding: "8px 0", borderBottom: `1px solid ${line}` }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: text3, marginBottom: 2 }}>CREATED</div>
                  <div style={{ fontFamily: sans, fontSize: 12, color: text2 }}>{new Date(selected.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ padding: "8px 0", borderBottom: `1px solid ${line}` }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: text3, marginBottom: 2 }}>LAST UPDATED</div>
                  <div style={{ fontFamily: sans, fontSize: 12, color: text2 }}>{new Date(selected.updatedAt).toLocaleDateString()}</div>
                </div>
                {selected.githubPath && (
                  <div style={{ padding: "8px 0" }}>
                    <div style={{ fontFamily: mono, fontSize: 9, color: text3, marginBottom: 2 }}>GITHUB PATH</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: text2, wordBreak: "break-all" }}>{selected.githubPath}</div>
                  </div>
                )}
              </div>
            )}
            {rightTab === "details" && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: text3, marginBottom: 6, textTransform: "uppercase" }}>NAME</div>
                  <input defaultValue={selected.name}
                    onBlur={e => updateDoc(selected.id, { name: e.target.value })}
                    style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "6px 10px", borderRadius: 4, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: text3, marginBottom: 6, textTransform: "uppercase" }}>CATEGORY</div>
                  <select value={selected.category} onChange={e => updateDoc(selected.id, { category: e.target.value as DocCategory })}
                    style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text2, padding: "6px 10px", borderRadius: 4, fontFamily: mono, fontSize: 11, cursor: "pointer" }}>
                    {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── New Doc Modal ────────────────────────────────────────────────── */}
      {showNewDoc && <Modal onClose={() => setShowNewDoc(false)} title="NEW DOCUMENT" surf1={surf1} surf2={surf2} line={line} lineStr={lineStr} text1={text1} text2={text2} text3={text3} mono={mono} sans={sans} accent={accent}>
        <NewDocForm onAdd={(doc) => { addDoc(doc); setShowNewDoc(false); }}
          surf2={surf2} line={line} lineStr={lineStr} text1={text1} text2={text2} text3={text3} mono={mono} sans={sans} accent={accent} />
      </Modal>}

      {/* ── Upload Modal ─────────────────────────────────────────────────── */}
      {showUpload && <Modal onClose={() => setShowUpload(false)} title="UPLOAD DOCUMENT" surf1={surf1} surf2={surf2} line={line} lineStr={lineStr} text1={text1} text2={text2} text3={text3} mono={mono} sans={sans} accent={accent}>
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: `1px solid ${lineStr}` }}>
            {(["computer","github"] as ("computer"|"github")[]).map(t => (
              <button key={t} onClick={() => setUploadTab(t)}
                style={{ padding: "8px 18px", background: "transparent", border: "none", borderBottom: uploadTab === t ? `2px solid ${accent}` : "2px solid transparent", color: uploadTab === t ? text1 : text3, fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                {t === "computer" ? "FROM COMPUTER" : "FROM GITHUB"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: mono, fontSize: 9, color: text3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>DOCUMENT NAME</label>
            <input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g., Series A NDA"
              style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "7px 10px", borderRadius: 4, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          {uploadTab === "computer" ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: mono, fontSize: 9, color: text3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>SELECT FILE (.md or .txt)</label>
              <input type="file" accept=".md,.txt" onChange={handleFileUpload}
                style={{ fontFamily: mono, fontSize: 10, color: text2, background: surf2, border: `1px solid ${lineStr}`, borderRadius: 4, padding: "6px 10px", width: "100%", boxSizing: "border-box", cursor: "pointer" }} />
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: mono, fontSize: 9, color: text3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>GITHUB URL (raw or blob)</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={uploadGHUrl} onChange={e => setUploadGHUrl(e.target.value)}
                  placeholder="https://github.com/org/repo/blob/main/contracts/nda.md"
                  style={{ flex: 1, background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "7px 10px", borderRadius: 4, fontFamily: mono, fontSize: 10, outline: "none" }} />
                <button onClick={fetchGHUrl} disabled={uploadLoading}
                  style={{ padding: "7px 14px", background: accent, color: "#fff", border: "none", borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer", opacity: uploadLoading ? 0.5 : 1 }}>
                  {uploadLoading ? "…" : "FETCH"}
                </button>
              </div>
            </div>
          )}

          {uploadContent && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: "#2ECC71", marginBottom: 4 }}>✓ CONTENT LOADED ({uploadContent.length} chars)</div>
              <pre style={{ background: surf2, border: `1px solid ${lineStr}`, borderRadius: 4, padding: "8px 10px", fontFamily: mono, fontSize: 10, color: text3, maxHeight: 100, overflowY: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
                {uploadContent.substring(0, 300)}{uploadContent.length > 300 ? "…" : ""}
              </pre>
            </div>
          )}

          <button onClick={confirmUpload} disabled={!uploadName || !uploadContent}
            style={{ width: "100%", padding: "10px 0", background: !uploadName || !uploadContent ? surf2 : accent, color: !uploadName || !uploadContent ? text3 : "#fff", border: "none", borderRadius: 4, fontFamily: mono, fontSize: 11, letterSpacing: "0.06em", cursor: !uploadName || !uploadContent ? "default" : "pointer" }}>
            ADD TO MY DOCUMENTS
          </button>
        </div>
      </Modal>}

      {/* ── Signature Modal ──────────────────────────────────────────────── */}
      {showSigModal && <Modal onClose={() => setShowSig(false)} title="ADD SIGNATURE" surf1={surf1} surf2={surf2} line={line} lineStr={lineStr} text1={text1} text2={text2} text3={text3} mono={mono} sans={sans} accent={accent}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Full Name"
              style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "7px 10px", borderRadius: 4, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} placeholder="Email Address"
              style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "7px 10px", borderRadius: 4, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: `1px solid ${lineStr}` }}>
            {(["draw","type"] as SignMode[]).map(m => (
              <button key={m} onClick={() => setSigMode(m)}
                style={{ padding: "7px 20px", background: "transparent", border: "none", borderBottom: sigMode === m ? `2px solid ${accent}` : "2px solid transparent", color: sigMode === m ? text1 : text3, fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                {m === "draw" ? "DRAW" : "TYPE"}
              </button>
            ))}
          </div>
          {sigMode === "draw" ? (
            <div style={{ marginBottom: 16 }}>
              <canvas ref={canvasRef} width={380} height={120} onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                style={{ background: surf2, border: `1px solid ${lineStr}`, borderRadius: 4, cursor: "crosshair", display: "block" }} />
              <button onClick={clearCanvas} style={{ marginTop: 6, fontFamily: mono, fontSize: 9, color: text3, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}>CLEAR</button>
            </div>
          ) : (
            <input value={typedSig} onChange={e => setTypedSig(e.target.value)} placeholder="Type your signature"
              style={{ width: "100%", fontFamily: serif, fontSize: 24, background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "12px 14px", borderRadius: 4, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
          )}
          <button onClick={applySignature}
            style={{ width: "100%", padding: "10px 0", background: accent, color: "#fff", border: "none", borderRadius: 4, fontFamily: mono, fontSize: 11, letterSpacing: "0.06em", cursor: "pointer" }}>
            APPLY SIGNATURE
          </button>
        </div>
      </Modal>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; position: fixed; inset: 0; overflow: auto; background: #fff; }
        }
      `}</style>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────
function exportBtn(bg: string, border: string, color: string, mono: string): React.CSSProperties {
  return { padding: "4px 12px", background: bg, color, border: `1px solid ${border}`, borderRadius: 4, fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.05em" };
}

interface ModalProps {
  onClose: () => void; title: string; children: React.ReactNode;
  surf1: string; surf2: string; line: string; lineStr: string;
  text1: string; text2: string; text3: string; mono: string; sans: string; accent: string;
}
function Modal({ onClose, title, children, surf1, line, lineStr, text1, text3, mono }: ModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: surf1, border: `1px solid ${lineStr}`, borderRadius: 8, padding: 24, width: 440, maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: text1, textTransform: "uppercase" }}>{title}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: text3, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface NewDocFormProps {
  onAdd: (doc: ContractDoc) => void;
  surf2: string; line: string; lineStr: string;
  text1: string; text2: string; text3: string; mono: string; sans: string; accent: string;
}
function NewDocForm({ onAdd, surf2, lineStr, text1, text3, mono, sans, accent }: NewDocFormProps) {
  const [name, setName]       = useState("");
  const [cat, setCat]         = useState<DocCategory>("nda");
  const [useTemplate, setUT]  = useState(true);

  function create() {
    if (!name) return;
    const content = useTemplate && cat !== "custom" ? TEMPLATES[cat as Exclude<DocCategory,"custom">] : "";
    const doc: ContractDoc = {
      id: Date.now().toString(),
      name,
      category: cat,
      status: "draft",
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signers: [],
    };
    onAdd(doc);
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontFamily: mono, fontSize: 9, color: text3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>DOCUMENT NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Acme Corp NDA"
          style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "7px 10px", borderRadius: 4, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontFamily: mono, fontSize: 9, color: text3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>CATEGORY</label>
        <select value={cat} onChange={e => setCat(e.target.value as DocCategory)}
          style={{ width: "100%", background: surf2, border: `1px solid ${lineStr}`, color: text1, padding: "7px 10px", borderRadius: 4, fontFamily: mono, fontSize: 11, cursor: "pointer" }}>
          {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }}>
        <input type="checkbox" checked={useTemplate} onChange={e => setUT(e.target.checked)} />
        <span style={{ fontFamily: mono, fontSize: 10, color: text3, textTransform: "uppercase" }}>USE TEMPLATE</span>
      </label>
      <button onClick={create} disabled={!name}
        style={{ width: "100%", padding: "10px 0", background: name ? accent : surf2, color: name ? "#fff" : text3, border: "none", borderRadius: 4, fontFamily: mono, fontSize: 11, letterSpacing: "0.06em", cursor: name ? "pointer" : "default" }}>
        CREATE DOCUMENT
      </button>
    </div>
  );
}
