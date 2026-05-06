'use client';
import React, { useState, useMemo } from 'react';
import { BiodesignState, PATHWAY_META, RegulatoryPathway } from './data';
import { FlowCanvas } from './flowbg';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoadmapEvent {
  id: string;
  phase: string;
  phaseColor: string;
  type: 'internal' | 'fda-meeting' | 'fda-submission' | 'fda-review' | 'fda-decision' | 'post-market';
  side: 'left' | 'right' | 'spine';
  label: string;
  monthStart: number;
  monthEnd: number;
  durationLabel: string;
  description: string;
  keyRequirements: string[];
  tip: string;
  regulationRef: string;
  critical: boolean;
}

// ── Colors ────────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<RoadmapEvent['type'], string> = {
  'internal':        '#E8A852',
  'fda-meeting':     '#E87252',
  'fda-submission':  '#52C0E8',
  'fda-review':      '#A07EE8',
  'fda-decision':    '#52E8B4',
  'post-market':     'rgba(214,233,248,0.35)',
};

const TYPE_LABEL: Record<RoadmapEvent['type'], string> = {
  'internal':        'Internal',
  'fda-meeting':     'FDA Meeting',
  'fda-submission':  'Submission',
  'fda-review':      'FDA Review',
  'fda-decision':    'Decision',
  'post-market':     'Post-Market',
};

// ── Pathway Roadmap Data ──────────────────────────────────────────────────────

const ROADMAP_510K: RoadmapEvent[] = [
  // Phase: Discovery & Classification
  {
    id: 'c1', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Device Concept & Need Validation',
    monthStart: 0, monthEnd: 1, durationLabel: '2-4 weeks',
    description: 'Validate the clinical unmet need and define device concept scope.',
    keyRequirements: [
      'Document primary clinical need',
      'Define intended use and indications',
      'Survey existing solutions and limitations',
    ],
    tip: 'The more specific your need statement, the cleaner your predicate comparison will be.',
    regulationRef: '21 CFR 820 (QSR)',
    critical: true,
  },
  {
    id: 'c2', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Device Classification & Product Code',
    monthStart: 0, monthEnd: 2, durationLabel: '2-4 weeks',
    description: 'Search FDA\'s 510(k) database and product code database to identify device type, classification, and any relevant guidance documents.',
    keyRequirements: [
      'Search FDA Product Classification Database',
      'Identify applicable product code(s)',
      'Confirm Class II (non-exempt) classification',
      'Review any device-specific guidance documents',
    ],
    tip: 'Use FDA\'s 510(k) database to find cleared devices similar to yours — this doubles as predicate research.',
    regulationRef: '21 CFR Part 862-892; FDA Product Code Database',
    critical: true,
  },
  {
    id: 'c3', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Predicate Device Identification',
    monthStart: 1, monthEnd: 3, durationLabel: '4-6 weeks',
    description: 'Identify one or more predicate devices from cleared 510(k)s. Build initial substantial equivalence argument.',
    keyRequirements: [
      'Identify ≥1 cleared 510(k) predicate with same intended use',
      'Compare technological characteristics',
      'Draft preliminary substantial equivalence narrative',
      'Document predicate 510(k) numbers (K-numbers)',
    ],
    tip: 'Use a "split predicate" strategy only when necessary — FDA prefers a single predicate with same intended use AND same tech characteristics.',
    regulationRef: 'FDA Guidance: The 510(k) Program (2014)',
    critical: true,
  },
  // Phase: Regulatory Strategy
  {
    id: 'r1', phase: 'Regulatory Strategy', phaseColor: '#E87252',
    type: 'fda-meeting', side: 'right',
    label: 'Q-Submission — Regulatory Strategy',
    monthStart: 2, monthEnd: 4, durationLabel: '70 days to meeting (MDUFA V)',
    description: 'Submit a Q-Sub package to FDA requesting a meeting to confirm regulatory pathway, predicate strategy, and testing approach. This is the first formal FDA touchpoint.',
    keyRequirements: [
      'Cover letter with specific questions (≤10)',
      'Device description and intended use',
      'Proposed predicate and SE argument',
      'Questions on testing approach and labeling',
    ],
    tip: 'Ask FDA to concur on your predicate selection in writing — this significantly reduces 510(k) review risk. Limit to 5-7 focused questions.',
    regulationRef: 'FDA Guidance: Q-Submission Program (2023)',
    critical: true,
  },
  {
    id: 'r2', phase: 'Regulatory Strategy', phaseColor: '#E87252',
    type: 'fda-review', side: 'spine',
    label: 'FDA Q-Sub Review & Meeting',
    monthStart: 3, monthEnd: 5, durationLabel: '70 calendar days from ack (14 days ack + 56 days to meeting)',
    description: 'FDA acknowledges within 14 days; meeting scheduled within 70 days of acknowledgment. Written response within 30 days of meeting.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V Performance Goals',
    critical: false,
  },
  // Phase: Design & Development
  {
    id: 'd1', phase: 'Design & Development', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Design & Development Phase',
    monthStart: 3, monthEnd: 10, durationLabel: '4-8 months',
    description: 'Core device design work including mechanical, electrical, software engineering. Formal design controls (Design History File) must begin here.',
    keyRequirements: [
      'Establish Design History File (DHF)',
      'Define design inputs from verified need',
      'Document design outputs',
      'Design reviews at major milestones',
    ],
    tip: 'Design controls are not just for compliance — DHF documentation built correctly now becomes your 510(k) submission content.',
    regulationRef: '21 CFR 820.30 (Design Controls)',
    critical: true,
  },
  {
    id: 'd2', phase: 'Design & Development', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Biocompatibility Testing',
    monthStart: 4, monthEnd: 8, durationLabel: '3-6 months (lab-dependent)',
    description: 'Conduct ISO 10993 biocompatibility evaluation for all patient-contacting materials. This is a common 510(k) hold item — start early.',
    keyRequirements: [
      'ISO 10993-1 risk-based biocompatibility evaluation',
      'Cytotoxicity, sensitization, irritation testing',
      'Systemic toxicity if implant or prolonged contact',
      'Biocompatibility report summary for 510(k)',
    ],
    tip: 'If your materials are used in a cleared predicate, you may be able to leverage ISO 10993 equivalence — ask your Q-Sub.',
    regulationRef: 'FDA Guidance: Use of ISO 10993-1 (2020)',
    critical: true,
  },
  {
    id: 'd3', phase: 'Design & Development', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Electrical Safety & EMC Testing',
    monthStart: 5, monthEnd: 9, durationLabel: '3-5 months',
    description: 'IEC 60601-1 electrical safety and IEC 60601-1-2 EMC testing for active medical devices. Required for most electronic/powered devices.',
    keyRequirements: [
      'IEC 60601-1 general safety testing',
      'IEC 60601-1-2 EMC (4th edition)',
      'IEC 60601-1-6 usability engineering',
      'Device-specific collateral standards',
    ],
    tip: 'Use an ISO 17025-accredited test lab — FDA is less likely to question accredited results in review.',
    regulationRef: 'IEC 60601-1:2005+A1:2012; FDA Guidance on EMC (2014)',
    critical: false,
  },
  {
    id: 'd4', phase: 'Design & Development', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Software V&V (if applicable)',
    monthStart: 4, monthEnd: 9, durationLabel: '3-6 months',
    description: 'Software verification and validation per FDA Software Guidance. Establish Software Level of Concern and complete V&V testing.',
    keyRequirements: [
      'Determine Software Level of Concern (Major/Minor/Negligible)',
      'Software Description Document',
      'Software V&V protocols and reports',
      'Anomaly/bug tracking and resolution',
    ],
    tip: 'For AI/ML software, file the Predetermined Change Control Plan (PCCP) in your 510(k) to allow post-clearance updates.',
    regulationRef: 'FDA Guidance: Software as a Medical Device (2022)',
    critical: false,
  },
  {
    id: 'd5', phase: 'Design & Development', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Performance / Bench Testing',
    monthStart: 6, monthEnd: 11, durationLabel: '3-5 months',
    description: 'Device-specific performance testing to demonstrate safety and effectiveness equivalent to predicate. Standards vary by device type.',
    keyRequirements: [
      'Device-specific performance standards (ASTM, ISO, IEC)',
      'Test protocols pre-approved with Q-Sub if possible',
      'Statistical analysis of test results',
      'Worst-case testing (worst materials, worst dimensions)',
    ],
    tip: 'Pre-agree on acceptance criteria with FDA in your Q-Sub — changing acceptance criteria during review triggers additional information requests.',
    regulationRef: 'Device-specific guidance documents; ASTM/ISO standards',
    critical: true,
  },
  // Phase: Pre-Submission Preparation
  {
    id: 'p1', phase: 'Pre-Submission Preparation', phaseColor: '#A07EE8',
    type: 'fda-meeting', side: 'right',
    label: 'Pre-510(k) Q-Submission',
    monthStart: 9, monthEnd: 12, durationLabel: '70 days to meeting',
    description: 'Second Q-Sub meeting to get FDA concurrence on final testing data, SE argument, and labeling before writing the 510(k) submission. Prevents major surprises during review.',
    keyRequirements: [
      'Performance test summaries (final or near-final)',
      'Final substantial equivalence comparison table',
      'Draft indications for use',
      'Final questions on any open items',
    ],
    tip: 'This meeting catches issues before the 90-day review clock starts. Teams that skip this step get more AI requests.',
    regulationRef: 'FDA Guidance: Q-Submission Program (2023)',
    critical: true,
  },
  {
    id: 'p2', phase: 'Pre-Submission Preparation', phaseColor: '#A07EE8',
    type: 'fda-review', side: 'spine',
    label: 'Pre-510(k) Q-Sub Review',
    monthStart: 10, monthEnd: 13, durationLabel: '70 calendar days',
    description: 'FDA review of pre-510(k) Q-Sub.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V',
    critical: false,
  },
  {
    id: 'p3', phase: 'Pre-Submission Preparation', phaseColor: '#A07EE8',
    type: 'internal', side: 'left',
    label: '510(k) Submission Preparation',
    monthStart: 11, monthEnd: 15, durationLabel: '2-3 months',
    description: 'Compile the full 510(k) submission in iMDRF table of contents format. All testing must be complete before submission.',
    keyRequirements: [
      'iMDRF Table of Contents (21 sections)',
      'SE comparison table',
      'All test reports (final signed copies)',
      'Labeling (IFU, labeling artwork)',
      'eStar eSubmitter or CDRH Direct eSub format',
    ],
    tip: 'Use the FDA 510(k) Review Paradigm — match your SE argument structure to exactly how reviewers evaluate it.',
    regulationRef: '21 CFR 807.87; FDA Guidance: 510(k) Submission Format',
    critical: true,
  },
  // Phase: FDA 510(k) Review
  {
    id: 's1', phase: 'FDA 510(k) Review', phaseColor: '#52C0E8',
    type: 'fda-submission', side: 'right',
    label: '510(k) Submission to FDA',
    monthStart: 15, monthEnd: 15, durationLabel: 'Day 0 of 90-day clock',
    description: 'Submit 510(k) via FDA CDRH Direct eSub or eStar. Track acknowledgment within 15 days.',
    keyRequirements: [
      'Complete 510(k) in eStar or CDRH Direct eSub',
      'User fee payment (MDUFA fee — ~$21,760 in FY2025 for standard)',
      'Establishment registration (if not already registered)',
      'FDA acknowledgment within 15 business days',
    ],
    tip: 'File in eStar — it has better tracking than email submission. Note the official submission date carefully as the 90-day clock reference.',
    regulationRef: '21 CFR 807; FDA eStar Portal',
    critical: true,
  },
  {
    id: 's2', phase: 'FDA 510(k) Review', phaseColor: '#52C0E8',
    type: 'fda-review', side: 'spine',
    label: 'Administrative Acceptance Review',
    monthStart: 15, monthEnd: 15.5, durationLabel: '15 calendar days',
    description: 'FDA determines if submission is administratively complete. Refuse to Accept (RTA) if not complete.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'FDA RTA Checklist',
    critical: false,
  },
  {
    id: 's3', phase: 'FDA 510(k) Review', phaseColor: '#52C0E8',
    type: 'fda-review', side: 'spine',
    label: '90-Day Substantive Review',
    monthStart: 16, monthEnd: 19, durationLabel: '90 calendar days (MDUFA V goal: 90% in 90 days)',
    description: 'FDA substantive review of 510(k). Reviewer may issue Additional Information (AI) request which tolls the clock.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V Performance Goals',
    critical: false,
  },
  {
    id: 's4', phase: 'FDA 510(k) Review', phaseColor: '#52C0E8',
    type: 'fda-decision', side: 'right',
    label: '510(k) Clearance — K-number Issued',
    monthStart: 18, monthEnd: 20, durationLabel: 'Decision at end of review',
    description: 'FDA issues Substantial Equivalence decision. Device cleared for marketing as a Class II device.',
    keyRequirements: [
      'K-number issued and posted on FDA 510(k) database',
      'Clearance order received',
    ],
    tip: 'Once cleared, your K-number becomes a public record and can be used as a predicate by competitors. File IP before submission.',
    regulationRef: '21 CFR 807.100',
    critical: true,
  },
  // Phase: Post-Market
  {
    id: 'pm1', phase: 'Post-Market', phaseColor: '#3DCC91',
    type: 'post-market', side: 'right',
    label: 'Establishment Registration & Device Listing',
    monthStart: 18, monthEnd: 19, durationLabel: 'Within 30 days of clearance',
    description: 'Register manufacturing facility and list cleared device with FDA.',
    keyRequirements: [
      'FDA Establishment Registration (annual renewal)',
      'Device Listing (510(k) number required)',
      'DUNS number for facility',
    ],
    tip: 'Registration and listing are annual requirements — set calendar reminders.',
    regulationRef: '21 CFR 807 Subpart B & C',
    critical: true,
  },
  {
    id: 'pm2', phase: 'Post-Market', phaseColor: '#3DCC91',
    type: 'post-market', side: 'left',
    label: 'MDR Procedures & QMS Activation',
    monthStart: 18, monthEnd: 20, durationLabel: 'Ongoing',
    description: 'Activate Medical Device Reporting (MDR) procedures per 21 CFR Part 803. Full QMS must be operational at first commercial distribution.',
    keyRequirements: [
      'MDR reporting procedures (30-day, 5-day reports)',
      'QMS (21 CFR Part 820) fully operational',
      'Post-market surveillance plan initiated',
      'Complaint handling procedures',
    ],
    tip: 'MDR is strictly enforced — a single unreported device malfunction that resulted in injury can trigger a Warning Letter.',
    regulationRef: '21 CFR Part 803 (MDR); 21 CFR Part 820',
    critical: true,
  },
];

const ROADMAP_DENOVO: RoadmapEvent[] = [
  {
    id: 'dn_c1', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Device Concept & Need Validation',
    monthStart: 0, monthEnd: 1, durationLabel: '2-4 weeks',
    description: 'Validate the clinical unmet need and define device concept scope. Confirm no predicate exists.',
    keyRequirements: [
      'Document primary clinical need',
      'Define intended use and indications',
      'Confirm no substantially equivalent predicate exists in cleared 510(k)s',
      'Survey existing solutions and limitations',
    ],
    tip: 'De Novo requires demonstrating no suitable predicate — document your predicate search thoroughly.',
    regulationRef: '21 CFR 820 (QSR); 21 CFR 513(f)(2)',
    critical: true,
  },
  {
    id: 'dn_c2', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Novel Device Classification Research',
    monthStart: 1, monthEnd: 3, durationLabel: '4-6 weeks',
    description: 'Confirm no suitable predicate exists. Propose new product code and device classification. Assess risk level to propose Class I or II.',
    keyRequirements: [
      'Exhaustive 510(k) predicate search documentation',
      'Proposed new product code and classification regulation',
      'Risk-based classification argument (Class I vs II)',
      'Proposed special controls to mitigate Class II risks',
    ],
    tip: 'De Novo is the pathway for novel, low-to-moderate risk devices without a predicate. The outcome creates a new product code.',
    regulationRef: '21 CFR 513(f)(2); FDA Guidance: De Novo Classification (2021)',
    critical: true,
  },
  {
    id: 'dn_r1', phase: 'Regulatory Strategy', phaseColor: '#E87252',
    type: 'fda-meeting', side: 'right',
    label: 'Q-Sub — Novel Classification Strategy',
    monthStart: 2, monthEnd: 4, durationLabel: '70 days to meeting (MDUFA V)',
    description: 'Submit a Q-Sub to FDA requesting a meeting to propose a new product code, risk-based classification argument, and proposed special controls. First formal FDA touchpoint.',
    keyRequirements: [
      'Cover letter with specific questions (≤10)',
      'Device description and intended use',
      'Proposed product code and classification regulation',
      'Proposed special controls for Class II',
      'Questions on classification and performance criteria',
    ],
    tip: 'Ask FDA if they agree with your proposed classification and special controls framework — written concurrence dramatically improves De Novo outcome.',
    regulationRef: 'FDA Guidance: Q-Submission Program (2023)',
    critical: true,
  },
  {
    id: 'dn_r2', phase: 'Regulatory Strategy', phaseColor: '#E87252',
    type: 'fda-review', side: 'spine',
    label: 'FDA Q-Sub Review & Meeting',
    monthStart: 3, monthEnd: 5, durationLabel: '70 calendar days from ack',
    description: 'FDA acknowledges within 14 days; meeting scheduled within 70 days. Written response within 30 days post-meeting.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V Performance Goals',
    critical: false,
  },
  {
    id: 'dn_d1', phase: 'Design & Testing', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Design & Development Phase',
    monthStart: 4, monthEnd: 12, durationLabel: '5-8 months',
    description: 'Core device design work with formal design controls. De Novo requires same rigor as 510(k) for design documentation.',
    keyRequirements: [
      'Establish Design History File (DHF)',
      'Define design inputs from verified need',
      'Document design outputs',
      'Design reviews at major milestones',
    ],
    tip: 'Design controls documentation doubles as De Novo submission content — build it submission-ready.',
    regulationRef: '21 CFR 820.30 (Design Controls)',
    critical: true,
  },
  {
    id: 'dn_d2', phase: 'Design & Testing', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Biocompatibility & Bench Testing',
    monthStart: 5, monthEnd: 13, durationLabel: '4-8 months',
    description: 'Complete all testing per proposed special controls performance criteria. De Novo requires demonstrating performance criteria that become binding special controls.',
    keyRequirements: [
      'ISO 10993-1 biocompatibility evaluation',
      'Device-specific performance testing vs. proposed performance criteria',
      'Electrical safety testing (if active device)',
      'All test reports demonstrating special controls efficacy',
    ],
    tip: 'Test against the performance criteria you proposed to FDA — these become your special controls and future predicates must meet them.',
    regulationRef: 'ISO 10993-1; IEC 60601-1; device-specific standards',
    critical: true,
  },
  {
    id: 'dn_p1', phase: 'Pre-Submission', phaseColor: '#A07EE8',
    type: 'fda-meeting', side: 'right',
    label: 'De Novo Pre-Submission',
    monthStart: 12, monthEnd: 15, durationLabel: '70 days to meeting',
    description: 'Comprehensive pre-submission meeting on proposed special controls, performance criteria, and labeling before writing the De Novo request. More complex and critical than pre-510(k).',
    keyRequirements: [
      'Complete proposed special controls framework',
      'Performance criteria for each special control',
      'Final testing data summaries',
      'Draft labeling and intended use',
      'Questions on any open classification items',
    ],
    tip: 'This meeting is more critical than in a 510(k) path — De Novo review is less precedented and FDA feedback prevents major deficiency letters.',
    regulationRef: 'FDA Guidance: Q-Submission Program (2023)',
    critical: true,
  },
  {
    id: 'dn_p2', phase: 'Pre-Submission', phaseColor: '#A07EE8',
    type: 'fda-review', side: 'spine',
    label: 'Pre-De Novo Q-Sub Review',
    monthStart: 13, monthEnd: 16, durationLabel: '70 calendar days',
    description: 'FDA review of De Novo pre-submission package.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V',
    critical: false,
  },
  {
    id: 'dn_p3', phase: 'Pre-Submission', phaseColor: '#A07EE8',
    type: 'internal', side: 'left',
    label: 'De Novo Request Preparation',
    monthStart: 15, monthEnd: 19, durationLabel: '2-4 months',
    description: 'Compile the full De Novo Request with classification rationale, performance data, proposed special controls and performance criteria.',
    keyRequirements: [
      'Classification rationale and risk analysis',
      'Proposed special controls — each linked to a specific risk',
      'Performance criteria for each special control',
      'All testing data demonstrating performance criteria are met',
      'Draft labeling',
    ],
    tip: 'Special controls must be specific enough to be enforceable — vague controls are rejected. Each must cite a specific risk it mitigates.',
    regulationRef: '21 CFR 513(f)(2); FDA Guidance: De Novo Classification (2021)',
    critical: true,
  },
  {
    id: 'dn_s1', phase: 'De Novo Submission', phaseColor: '#A07EE8',
    type: 'fda-submission', side: 'right',
    label: 'De Novo Request Submission',
    monthStart: 18, monthEnd: 20, durationLabel: 'Day 0 of review clock',
    description: 'Submit De Novo Request via FDA CDRH Direct eSub. Full application with classification rationale, performance data, proposed special controls and performance criteria.',
    keyRequirements: [
      'De Novo Request in CDRH Direct eSub format',
      'User fee payment (MDUFA fee for De Novo)',
      'Complete special controls and performance criteria package',
      'All test reports (final signed copies)',
    ],
    tip: 'De Novo fee is separate from 510(k) fee. Verify current MDUFA fee schedule before submission.',
    regulationRef: '21 CFR 513(f)(2); 21 CFR Part 807',
    critical: true,
  },
  {
    id: 'dn_s2', phase: 'De Novo Submission', phaseColor: '#A07EE8',
    type: 'fda-review', side: 'spine',
    label: 'De Novo Administrative Review',
    monthStart: 20, monthEnd: 21, durationLabel: '15 days',
    description: 'FDA administrative completeness review. Refuse to Accept if not complete.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'FDA De Novo RTA Checklist',
    critical: false,
  },
  {
    id: 'dn_s3', phase: 'De Novo Submission', phaseColor: '#A07EE8',
    type: 'fda-review', side: 'spine',
    label: 'De Novo Substantive Review',
    monthStart: 21, monthEnd: 30, durationLabel: '150-day FDA goal (direct De Novo)',
    description: 'FDA substantive review of De Novo request. Longer than 510(k) — typically 150 days for direct De Novo. Reviewer evaluates proposed classification and special controls.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V Performance Goals',
    critical: false,
  },
  {
    id: 'dn_s4', phase: 'De Novo Submission', phaseColor: '#A07EE8',
    type: 'fda-decision', side: 'right',
    label: 'De Novo Granted',
    monthStart: 28, monthEnd: 34, durationLabel: 'Decision at end of review',
    description: 'FDA grants De Novo classification. Device classified as new product code. Classification order published — device becomes a predicate for future 510(k) submissions.',
    keyRequirements: [
      'New product code created and published',
      'Classification regulation issued',
      'Device cleared as Class I or II with special controls',
    ],
    tip: 'Once granted, your De Novo classification order becomes a published predicate — this creates a competitive moat AND a public record.',
    regulationRef: '21 CFR 513(f)(2)',
    critical: true,
  },
  {
    id: 'dn_pm1', phase: 'Post-Market', phaseColor: '#3DCC91',
    type: 'post-market', side: 'right',
    label: 'Establishment Registration & Device Listing',
    monthStart: 30, monthEnd: 31, durationLabel: 'Within 30 days of grant',
    description: 'Register manufacturing facility and list cleared device with FDA.',
    keyRequirements: [
      'FDA Establishment Registration (annual renewal)',
      'Device Listing (De Novo order number required)',
      'DUNS number for facility',
    ],
    tip: 'Registration and listing are annual requirements — set calendar reminders.',
    regulationRef: '21 CFR 807 Subpart B & C',
    critical: true,
  },
  {
    id: 'dn_pm2', phase: 'Post-Market', phaseColor: '#3DCC91',
    type: 'post-market', side: 'left',
    label: 'MDR Procedures & QMS Activation',
    monthStart: 30, monthEnd: 34, durationLabel: 'Ongoing',
    description: 'Activate MDR procedures per 21 CFR Part 803. Full QMS must be operational at first commercial distribution.',
    keyRequirements: [
      'MDR reporting procedures (30-day, 5-day reports)',
      'QMS (21 CFR Part 820) fully operational',
      'Post-market surveillance plan for novel device class',
      'Special controls implementation monitoring',
    ],
    tip: 'As the first device in a new classification, you may face additional scrutiny on special controls implementation.',
    regulationRef: '21 CFR Part 803 (MDR); 21 CFR Part 820',
    critical: true,
  },
];

const ROADMAP_PMA: RoadmapEvent[] = [
  {
    id: 'pma_c1', phase: 'Discovery', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Device Concept & Unmet Need',
    monthStart: 0, monthEnd: 2, durationLabel: '4-8 weeks',
    description: 'Define device concept and clinical unmet need for a high-risk (Class III) device. PMA devices require valid scientific evidence of safety and effectiveness.',
    keyRequirements: [
      'Clinical unmet need statement with epidemiology',
      'Class III device classification confirmation',
      'Benefit-risk preliminary framework',
      'Literature review of current standard of care',
    ],
    tip: 'PMA requires a pivotal clinical trial — define the primary endpoint in terms FDA will accept as valid scientific evidence of effectiveness.',
    regulationRef: '21 CFR Part 814; 21 CFR 860.7',
    critical: true,
  },
  {
    id: 'pma_c2', phase: 'Discovery', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Device Classification Confirmation',
    monthStart: 1, monthEnd: 4, durationLabel: '6-8 weeks',
    description: 'Confirm Class III designation and that PMA is required. Assess if Breakthrough Device Designation could apply.',
    keyRequirements: [
      'Confirm Class III under 21 CFR 860',
      'Assess Breakthrough Device Designation eligibility',
      'Evaluate PMA vs. de novo strategy',
      'Begin regulatory affairs team assembly',
    ],
    tip: 'Apply for Breakthrough Device Designation early — it provides more frequent FDA interaction and can compress the timeline by 12-24 months.',
    regulationRef: '21 CFR 860; 21st Century Cures Act (Breakthrough)',
    critical: true,
  },
  {
    id: 'pma_r1', phase: 'Early FDA Strategy', phaseColor: '#E87252',
    type: 'fda-meeting', side: 'right',
    label: 'Q-Sub — IDE/Classification Confirmation',
    monthStart: 2, monthEnd: 6, durationLabel: '70 days to meeting',
    description: 'Early Q-Sub to confirm classification, IDE pathway, and general clinical strategy with FDA. Establish regulatory relationship.',
    keyRequirements: [
      'Device description and intended use',
      'Classification rationale and IDE intent',
      'Preliminary benefit-risk framework',
      'Questions on classification and clinical study approach',
    ],
    tip: 'Early FDA engagement on classification prevents expensive pivots. Even a brief Q-Sub to confirm Class III status saves time.',
    regulationRef: 'FDA Guidance: Q-Submission Program (2023)',
    critical: true,
  },
  {
    id: 'pma_r2', phase: 'Early FDA Strategy', phaseColor: '#E87252',
    type: 'fda-review', side: 'spine',
    label: 'Q-Sub Review & Meeting',
    monthStart: 3, monthEnd: 6, durationLabel: '70 calendar days from ack',
    description: 'FDA Q-Sub review and meeting on classification and early strategy.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V Performance Goals',
    critical: false,
  },
  {
    id: 'pma_ide1', phase: 'IDE Preparation', phaseColor: '#E87252',
    type: 'fda-meeting', side: 'right',
    label: 'Pre-IDE Q-Submission',
    monthStart: 6, monthEnd: 9, durationLabel: '70 days to meeting',
    description: 'Most critical meeting in the PMA path. Get FDA concurrence on clinical protocol design, primary endpoint, statistical analysis plan, and device description. Mistakes here cascade through entire trial.',
    keyRequirements: [
      'Draft clinical investigation plan (CIP)',
      'Primary and secondary endpoints',
      'Proposed statistical analysis plan (SAP)',
      'Subject selection criteria',
      'Device description and labeling',
      'Risk/benefit assessment framework',
    ],
    tip: 'This is the most important meeting in the entire PMA journey. Do not submit an IDE without FDA concurrence on your primary endpoint and statistical approach.',
    regulationRef: 'FDA Guidance: Pre-IDE Program (2004); 21 CFR Part 812',
    critical: true,
  },
  {
    id: 'pma_ide2', phase: 'IDE Preparation', phaseColor: '#E87252',
    type: 'fda-review', side: 'spine',
    label: 'Pre-IDE Q-Sub Review',
    monthStart: 7, monthEnd: 10, durationLabel: '70 calendar days',
    description: 'FDA review of Pre-IDE Q-Sub.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V',
    critical: false,
  },
  {
    id: 'pma_ide3', phase: 'IDE Preparation', phaseColor: '#A07EE8',
    type: 'internal', side: 'left',
    label: 'IDE Submission Preparation',
    monthStart: 8, monthEnd: 12, durationLabel: '3-4 months',
    description: 'Compile the Investigational Device Exemption application. IDE must be approved by FDA before enrolling subjects in a Significant Risk study.',
    keyRequirements: [
      'Investigational plan (protocol, risk analysis, device description)',
      'Informed consent process and IRB plan',
      'Monitoring procedures',
      'Manufacturing and quality procedures',
      'Prior investigations summary',
    ],
    tip: 'IDE review is 30 days — plan device manufacturing and IRB submission in parallel so trial can start promptly after approval.',
    regulationRef: '21 CFR Part 812; 21 CFR 812.20',
    critical: true,
  },
  {
    id: 'pma_ide4', phase: 'IDE Preparation', phaseColor: '#A07EE8',
    type: 'fda-submission', side: 'right',
    label: 'IDE Submission',
    monthStart: 10, monthEnd: 12, durationLabel: 'Day 0 of 30-day IDE clock',
    description: 'Submit IDE to FDA. FDA has 30 days to approve, approve with conditions, or disapprove. Effective approval if no response in 30 days.',
    keyRequirements: [
      'Complete IDE application via FDA CDRH eSub',
      'IRB approval at lead site (or IRB letter)',
      'IDE user fee (if applicable)',
    ],
    tip: 'IDE approval by default after 30 days of silence ("deemed approved") — but confirm with your FDA contact.',
    regulationRef: '21 CFR 812.30; 21 CFR 812.35',
    critical: true,
  },
  {
    id: 'pma_ide5', phase: 'IDE Preparation', phaseColor: '#A07EE8',
    type: 'fda-review', side: 'spine',
    label: 'IDE Review',
    monthStart: 12, monthEnd: 14, durationLabel: '30-day FDA review clock',
    description: 'FDA substantive review of IDE application. May be approved, approved with conditions, or disapproved.',
    keyRequirements: [],
    tip: '',
    regulationRef: '21 CFR 812.30',
    critical: false,
  },
  {
    id: 'pma_ide6', phase: 'IDE Preparation', phaseColor: '#A07EE8',
    type: 'fda-decision', side: 'right',
    label: 'IDE Approval',
    monthStart: 14, monthEnd: 15, durationLabel: '30 days from submission',
    description: 'FDA approves IDE for significant risk device study. Clinical trial may begin enrollment after approval and IRB approvals at all sites.',
    keyRequirements: [
      'IDE approval letter received',
      'IRB approvals at all study sites',
      'Site initiation visits completed',
    ],
    tip: 'IDE approval with conditions is common — address conditions immediately. Do not begin enrollment until all conditions are resolved.',
    regulationRef: '21 CFR 812.30; 21 CFR 812.43',
    critical: true,
  },
  // Clinical Trial
  {
    id: 'pma_ct1', phase: 'Clinical Trial', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Site Initiation & IRB Approval',
    monthStart: 14, monthEnd: 16, durationLabel: '2-4 months',
    description: 'Initiate clinical sites, obtain IRB approvals at all sites, and begin enrolling subjects.',
    keyRequirements: [
      'IRB approvals at all participating sites',
      'Site initiation visits (SIVs)',
      'Investigator and coordinator training',
      'Regulatory file setup at each site',
    ],
    tip: 'Multi-site trials require IRB at each site — plan 6-8 weeks per site for IRB review. Use central IRB where possible.',
    regulationRef: '21 CFR 56 (IRB); 21 CFR 812.40',
    critical: true,
  },
  {
    id: 'pma_ct2', phase: 'Clinical Trial', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Subject Enrollment',
    monthStart: 16, monthEnd: 48, durationLabel: '18-36 months (variable)',
    description: 'Active subject enrollment period. Duration highly dependent on disease prevalence, site count, and enrollment rate.',
    keyRequirements: [
      'Enrollment tracking against projections',
      'Monthly monitoring visits per protocol',
      'Real-time safety reporting (AEs, SAEs)',
      'IDE Annual Reports to FDA',
      'Protocol deviations tracked and reported',
    ],
    tip: 'Enrollment almost always takes longer than projected. Buffer 50% on enrollment timeline estimates. Under-enrollment is the #1 clinical trial failure mode.',
    regulationRef: '21 CFR 812.150 (IDE Reports)',
    critical: true,
  },
  {
    id: 'pma_ct3', phase: 'Clinical Trial', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Interim Safety Reviews',
    monthStart: 24, monthEnd: 36, durationLabel: 'Per DSMB charter',
    description: 'Data Safety Monitoring Board (DSMB) interim safety analyses. Required for higher-risk trials.',
    keyRequirements: [
      'DSMB charter and composition',
      'Interim analysis plan pre-specified in SAP',
      'Unblinding procedures if applicable',
      'DSMB report to FDA if safety concerns',
    ],
    tip: 'DSMB findings must be reported to FDA promptly. Establish clear stopping rules in the charter before trial begins.',
    regulationRef: 'FDA Guidance: Establishment of DSMB (2006)',
    critical: false,
  },
  {
    id: 'pma_ct4', phase: 'Clinical Trial', phaseColor: '#52C0E8',
    type: 'fda-meeting', side: 'right',
    label: 'Pre-Lock SAP Q-Submission',
    monthStart: 48, monthEnd: 50, durationLabel: '70 days to meeting',
    description: 'Critical Q-Sub to get FDA to agree on statistical analysis plan before locking study data. Changing analysis after lock without pre-agreement is a major deficiency.',
    keyRequirements: [
      'Final Statistical Analysis Plan (SAP)',
      'Primary endpoint analysis methodology',
      'Handling of missing data and dropouts',
      'Multiple comparison adjustments',
      'Sensitivity analyses plan',
    ],
    tip: 'This Q-Sub is critical — if FDA disagrees with your analysis after data lock, you may need to re-analyze or run additional analysis, adding months.',
    regulationRef: 'FDA Guidance: Adaptive Designs, Statistical Guidance; ICH E9',
    critical: true,
  },
  {
    id: 'pma_ct5', phase: 'Clinical Trial', phaseColor: '#52C0E8',
    type: 'fda-review', side: 'spine',
    label: 'Pre-Lock SAP Q-Sub Review',
    monthStart: 49, monthEnd: 52, durationLabel: '70 calendar days',
    description: 'FDA review of pre-lock SAP Q-Sub.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V',
    critical: false,
  },
  {
    id: 'pma_ct6', phase: 'Clinical Trial', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Database Lock & Statistical Analysis',
    monthStart: 50, monthEnd: 54, durationLabel: '3-4 months',
    description: 'Final patient follow-up completion, database lock, and statistical analysis per pre-specified SAP.',
    keyRequirements: [
      'Final patient follow-up completion',
      'Data cleaning and query resolution',
      'Database lock (no changes after lock)',
      'Statistical analysis per pre-specified SAP',
      'Clinical study report (CSR) authoring',
    ],
    tip: 'The CSR is the foundation of your PMA clinical section — allocate 3-4 months for authoring, internal review, and approval.',
    regulationRef: 'ICH E3 (CSR Structure)',
    critical: true,
  },
  // Pre-PMA
  {
    id: 'pma_pp1', phase: 'Pre-PMA Strategy', phaseColor: '#A07EE8',
    type: 'fda-meeting', side: 'right',
    label: 'Pre-PMA Q-Submission',
    monthStart: 56, monthEnd: 60, durationLabel: '70 days to meeting',
    description: 'Comprehensive pre-PMA meeting to review clinical data topline results, manufacturing information, and labeling before writing the PMA. Last chance to resolve FDA issues before submission.',
    keyRequirements: [
      'Clinical study topline results',
      'Benefit-risk analysis summary',
      'Manufacturing information summary',
      'Draft labeling and indications',
      'Any unresolved questions from IDE history',
    ],
    tip: 'Present your benefit-risk framework proactively — if FDA disagrees with your benefit-risk conclusion, surface it now rather than during review.',
    regulationRef: 'FDA Guidance: Q-Submission Program (2023)',
    critical: true,
  },
  {
    id: 'pma_pp2', phase: 'Pre-PMA Strategy', phaseColor: '#A07EE8',
    type: 'fda-review', side: 'spine',
    label: 'Pre-PMA Q-Sub Review',
    monthStart: 58, monthEnd: 62, durationLabel: '70 calendar days',
    description: 'FDA review of pre-PMA Q-Sub.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V',
    critical: false,
  },
  {
    id: 'pma_pp3', phase: 'Pre-PMA Strategy', phaseColor: '#A07EE8',
    type: 'internal', side: 'left',
    label: 'PMA Submission Preparation',
    monthStart: 58, monthEnd: 64, durationLabel: '4-6 months',
    description: 'Compile the full PMA application — the largest regulatory submission in US medical devices, typically thousands of pages.',
    keyRequirements: [
      'Device description and design controls summary',
      'Manufacturing information (GMP compliance)',
      'Clinical study CSR and statistical analysis',
      'Non-clinical testing summary (bench, biocompatibility)',
      'Benefit-risk determination',
      'Proposed labeling',
    ],
    tip: 'Modular PMA submission allows you to submit manufacturing and non-clinical modules before clinical data is final — use this to compress overall timeline.',
    regulationRef: '21 CFR 814.20; FDA Guidance: PMA Format (2019)',
    critical: true,
  },
  // PMA Review
  {
    id: 'pma_s1', phase: 'PMA Review', phaseColor: '#E87252',
    type: 'fda-submission', side: 'right',
    label: 'PMA Submission',
    monthStart: 64, monthEnd: 64, durationLabel: 'Day 0 of PMA clock',
    description: 'Submit PMA application to FDA via CDRH Direct eSub. Largest regulatory submission in the US medical device system.',
    keyRequirements: [
      'Complete PMA in CDRH Direct eSub format',
      'PMA user fee payment (~$400K for standard, ~$100K for small business)',
      'All modules complete (non-clinical, clinical, manufacturing)',
    ],
    tip: 'PMA user fees are substantial — verify current MDUFA fee schedule and confirm small business eligibility for reduced fees.',
    regulationRef: '21 CFR 814.20; FDA PMA Portal',
    critical: true,
  },
  {
    id: 'pma_s2', phase: 'PMA Review', phaseColor: '#E87252',
    type: 'fda-review', side: 'spine',
    label: '45-Day Filing Review',
    monthStart: 64, monthEnd: 67, durationLabel: '45 calendar days',
    description: 'FDA determines if PMA is filed (administratively complete). Refusal to File (RTF) if not substantially complete.',
    keyRequirements: [],
    tip: '',
    regulationRef: '21 CFR 814.42',
    critical: false,
  },
  {
    id: 'pma_s3', phase: 'PMA Review', phaseColor: '#E87252',
    type: 'fda-review', side: 'spine',
    label: '180-Day Substantive PMA Review',
    monthStart: 67, monthEnd: 79, durationLabel: '180-day MDUFA goal',
    description: 'FDA substantive review of PMA. Multidisciplinary review team. May issue Major Deficiency Letter (MDL) which stops clock.',
    keyRequirements: [],
    tip: '',
    regulationRef: 'MDUFA V Performance Goals',
    critical: false,
  },
  {
    id: 'pma_s4', phase: 'PMA Review', phaseColor: '#E87252',
    type: 'fda-meeting', side: 'right',
    label: 'Advisory Panel Meeting',
    monthStart: 70, monthEnd: 73, durationLabel: 'If convened (varies)',
    description: 'FDA may convene an advisory panel (advisory committee) to provide external expert recommendation on approvability. Not always required.',
    keyRequirements: [
      'Panel presentation preparation (typically 30-min presentation)',
      'Executive summary for panel members',
      'Responses to panel questions prepared',
    ],
    tip: 'Advisory panels are public — competitors will see your clinical data. File IP before the panel date. Prepare extensively for panel Q&A.',
    regulationRef: '21 CFR Part 14 (Advisory Committees)',
    critical: false,
  },
  {
    id: 'pma_s5', phase: 'PMA Review', phaseColor: '#E87252',
    type: 'internal', side: 'left',
    label: 'Major Deficiency Response',
    monthStart: 72, monthEnd: 76, durationLabel: '90+ days (variable)',
    description: 'If FDA issues a Major Deficiency Letter (MDL), respond with additional data or analysis. Clock restarts after complete response.',
    keyRequirements: [
      'Point-by-point response to each deficiency',
      'Additional data or analysis if required',
      'Updated benefit-risk analysis if needed',
    ],
    tip: 'MDL responses require the same rigor as original submission. Budget 3-6 months to address a complex MDL — plan for it in your timeline.',
    regulationRef: '21 CFR 814.44',
    critical: false,
  },
  {
    id: 'pma_s6', phase: 'PMA Review', phaseColor: '#E87252',
    type: 'fda-decision', side: 'right',
    label: 'PMA Approval — P-number Issued',
    monthStart: 78, monthEnd: 84, durationLabel: 'Decision at end of review',
    description: 'FDA approves PMA. P-number issued. Device approved for marketing as a Class III device.',
    keyRequirements: [
      'P-number (approval number) issued',
      'Approval order with conditions',
      'Post-approval study requirements specified',
    ],
    tip: 'PMA approval almost always includes post-approval study requirements. Budget for these in your commercialization plan — they can cost millions.',
    regulationRef: '21 CFR 814.44; 21 CFR 814.82',
    critical: true,
  },
  // Post-Approval
  {
    id: 'pma_pa1', phase: 'Post-Approval', phaseColor: '#3DCC91',
    type: 'post-market', side: 'right',
    label: 'Post-Approval Studies',
    monthStart: 82, monthEnd: 96, durationLabel: 'Per approval conditions',
    description: 'Conduct required post-approval studies per approval order conditions. Often 5-10 year follow-up.',
    keyRequirements: [
      'Post-approval study protocol per approval order',
      'Annual progress reports to FDA',
      'Real-world performance monitoring',
    ],
    tip: 'Post-approval study non-compliance can result in withdrawal of approval — treat these like a second trial.',
    regulationRef: '21 CFR 814.82 (Post-Approval Requirements)',
    critical: true,
  },
  {
    id: 'pma_pa2', phase: 'Post-Approval', phaseColor: '#3DCC91',
    type: 'post-market', side: 'left',
    label: 'Annual PMA Reports & Supplements',
    monthStart: 82, monthEnd: 96, durationLabel: 'Annual, ongoing',
    description: 'Annual PMA reports required every anniversary of approval. PMA Supplements required for changes to device, manufacturing, or labeling.',
    keyRequirements: [
      'Annual PMA Report (changes, complaints, MDRs summary)',
      'PMA Supplement for significant changes (pre-approval)',
      'PMA Supplement for moderate changes (30-day notice)',
      'PMA Annual Report for minor changes',
    ],
    tip: 'PMA supplements for device modifications can take 6-12 months. Plan modification cycles carefully.',
    regulationRef: '21 CFR 814.84 (Annual Reports); 21 CFR 814.39 (Supplements)',
    critical: false,
  },
  {
    id: 'pma_pa3', phase: 'Post-Approval', phaseColor: '#3DCC91',
    type: 'post-market', side: 'right',
    label: 'Enhanced MDR & QMS',
    monthStart: 82, monthEnd: 96, durationLabel: 'Ongoing',
    description: 'Enhanced post-market surveillance requirements for Class III devices. Full QMS operational at commercial distribution.',
    keyRequirements: [
      'MDR reporting (30-day, 5-day, baseline reports)',
      'QMS (21 CFR Part 820) operational',
      'Complaint handling — all complaints evaluated for MDR reportability',
      'Field corrective action (recall) procedures',
    ],
    tip: 'Class III devices face the highest scrutiny in MDR reporting. Every complaint must be evaluated for reportability — document the evaluation.',
    regulationRef: '21 CFR Part 803; 21 CFR Part 820; 21 CFR Part 806',
    critical: true,
  },
];

const ROADMAP_EXEMPT: RoadmapEvent[] = [
  {
    id: 'ex_c1', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Device Classification Confirmation',
    monthStart: 0, monthEnd: 1, durationLabel: '1-2 weeks',
    description: 'Confirm device is Class I Exempt under 21 CFR. Verify no limitation on exemption applies (e.g., device not intended for specific uses).',
    keyRequirements: [
      'Confirm Class I Exempt classification in 21 CFR Part 862-892',
      'Verify no limitation on exemption applies',
      'Confirm device is not a "reserved" exempt category requiring 510(k)',
      'Review product code for exempt status',
    ],
    tip: 'Double-check exemption limitations in 21 CFR — some Class I exempt categories are explicitly excluded if the device has certain features (e.g., software).',
    regulationRef: '21 CFR Part 862-892 (device-specific exemption regulation)',
    critical: true,
  },
  {
    id: 'ex_c2', phase: 'Discovery & Classification', phaseColor: '#E8A852',
    type: 'internal', side: 'left',
    label: 'Intended Use & Labeling Review',
    monthStart: 0, monthEnd: 2, durationLabel: '2-3 weeks',
    description: 'Confirm intended use stays within exempt device boundaries. Adding features or uses that create a new risk profile may require 510(k) clearance.',
    keyRequirements: [
      'Define intended use and indications for use precisely',
      'Confirm intended use does not create a new risk class',
      'Draft labeling per 21 CFR 801',
      'Confirm no prescription-only or Rx labeling requirements',
    ],
    tip: 'Adding software control to an otherwise exempt device may require a 510(k). Confirm software classification impact before proceeding.',
    regulationRef: '21 CFR 801 (Labeling); 21 CFR 807.65',
    critical: true,
  },
  {
    id: 'ex_d1', phase: 'Design & Manufacturing', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Design & Development',
    monthStart: 1, monthEnd: 5, durationLabel: '2-4 months',
    description: 'Most Class I exempt devices do not require full 21 CFR 820.30 design controls, but good practice to follow. Some Class I devices require design controls (e.g., Class I with software).',
    keyRequirements: [
      'Simplified design documentation',
      'Material selection with supplier documentation',
      'Prototype development and testing',
      'User needs and design requirements',
    ],
    tip: 'Even though design controls may not be legally required, maintaining documented evidence of design decisions protects you in recalls.',
    regulationRef: '21 CFR 820.30 (design controls exempt for Class I)',
    critical: false,
  },
  {
    id: 'ex_d2', phase: 'Design & Manufacturing', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Good Manufacturing Practices',
    monthStart: 3, monthEnd: 6, durationLabel: '1-2 months',
    description: 'Class I exempt devices are still subject to Good Manufacturing Practices (GMP) under 21 CFR Part 820 (Quality System), excluding design controls.',
    keyRequirements: [
      'Basic QMS documentation (procedures)',
      'Document and record controls',
      'Purchasing controls (supplier qualification)',
      'Corrective action procedures',
    ],
    tip: 'GMP applies even to exempt devices. FDA inspections check basic GMP compliance regardless of class.',
    regulationRef: '21 CFR Part 820 (excluding 820.30 for most Class I)',
    critical: false,
  },
  {
    id: 'ex_d3', phase: 'Design & Manufacturing', phaseColor: '#52C0E8',
    type: 'internal', side: 'left',
    label: 'Labeling Compliance',
    monthStart: 4, monthEnd: 6, durationLabel: '2-4 weeks',
    description: 'Prepare compliant labeling per 21 CFR Part 801. Device labeling must include required elements.',
    keyRequirements: [
      'Device name and intended use',
      'Manufacturer name and address',
      'Adequate directions for use (or Rx-only designation)',
      'Warning and precaution statements',
      'UDI label (if applicable)',
    ],
    tip: 'UDI (Unique Device Identification) is required for most Class I devices — verify your labeling date requirements.',
    regulationRef: '21 CFR Part 801; 21 CFR Part 830 (UDI)',
    critical: true,
  },
  {
    id: 'ex_r1', phase: 'FDA Registration', phaseColor: '#52E8B4',
    type: 'fda-submission', side: 'right',
    label: 'Establishment Registration & Device Listing',
    monthStart: 5, monthEnd: 6, durationLabel: 'Before commercial distribution',
    description: 'Register manufacturing establishment and list device with FDA. Required even for exempt devices before first commercial distribution.',
    keyRequirements: [
      'FDA Establishment Registration (annual renewal — October 1)',
      'Device Listing via FDA Unified Registration and Listing System (FURLS)',
      'DUNS number for facility',
      'Establishment registration fee',
    ],
    tip: 'Registration must be renewed every year between October 1–December 31. Mark your calendar — late registration is a 21 CFR 807 violation.',
    regulationRef: '21 CFR 807 Subpart B & C',
    critical: true,
  },
  {
    id: 'ex_r2', phase: 'FDA Registration', phaseColor: '#52E8B4',
    type: 'fda-decision', side: 'right',
    label: 'Commercial Distribution Begins',
    monthStart: 6, monthEnd: 8, durationLabel: 'Upon registration completion',
    description: 'Exempt device may be distributed commercially once registration and listing are complete. No FDA clearance or approval required.',
    keyRequirements: [
      'Registration confirmed',
      'Device listing confirmed',
      'Labeling compliant with 21 CFR 801',
      'MDR procedures in place',
    ],
    tip: 'Keep documentation of your exemption analysis. If FDA or a customer questions your classification, you need to show your work.',
    regulationRef: '21 CFR 807 Subpart B & C',
    critical: true,
  },
  {
    id: 'ex_pm1', phase: 'Post-Market', phaseColor: '#3DCC91',
    type: 'post-market', side: 'left',
    label: 'MDR Procedures',
    monthStart: 6, monthEnd: 12, durationLabel: 'Ongoing',
    description: 'Medical Device Reporting (MDR) per 21 CFR Part 803 applies to all device classes, including Class I exempt. All serious adverse events must be reported.',
    keyRequirements: [
      'MDR procedures (30-day death/serious injury reports)',
      'Complaint handling system',
      'MDR decision documentation',
    ],
    tip: 'Class I exempt status does not exempt you from MDR reporting. A missed MDR report can trigger a Warning Letter.',
    regulationRef: '21 CFR Part 803 (MDR)',
    critical: true,
  },
  {
    id: 'ex_pm2', phase: 'Post-Market', phaseColor: '#3DCC91',
    type: 'post-market', side: 'right',
    label: 'Annual Registration Renewal',
    monthStart: 9, monthEnd: 12, durationLabel: 'Annual (Oct-Dec)',
    description: 'Annual renewal of FDA Establishment Registration. Due October 1 each year. Device listing updates required if device information changes.',
    keyRequirements: [
      'Renew registration by December 31',
      'Update device listing if changes occurred',
      'Pay annual registration fee',
    ],
    tip: 'Set a recurring calendar reminder for October 1 — late registration is a common FDA compliance finding during inspections.',
    regulationRef: '21 CFR 807 Subpart B & C',
    critical: false,
  },
];

const PATHWAY_ROADMAP: Record<RegulatoryPathway, RoadmapEvent[]> = {
  '510k':  ROADMAP_510K,
  denovo:  ROADMAP_DENOVO,
  pma:     ROADMAP_PMA,
  exempt:  ROADMAP_EXEMPT,
  tbd:     [],
};

// ── Stats computation ─────────────────────────────────────────────────────────

function computeStats(events: RoadmapEvent[]) {
  if (events.length === 0) return { months: '—', fdaInteractions: 0, submissions: 0 };
  const maxMonth = Math.max(...events.map(e => e.monthEnd));
  const fdaInteractions = events.filter(e => e.type === 'fda-meeting' || e.type === 'fda-review' || e.type === 'fda-decision').length;
  const submissions = events.filter(e => e.type === 'fda-submission').length;
  return { months: `~${maxMonth} months`, fdaInteractions, submissions };
}

// ── Reverse planning computation ──────────────────────────────────────────────

function computeReversePlan(events: RoadmapEvent[], targetDateStr: string): Array<{ label: string; date: string }> {
  if (!targetDateStr || events.length === 0) return [];
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return [];

  // Find max month
  const maxMonth = Math.max(...events.map(e => e.monthEnd));
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;

  // Key milestones to reverse-plan: last submission, first submission, first Q-Sub
  const milestones: Array<{ label: string; month: number }> = [];

  const submissions = events.filter(e => e.type === 'fda-submission');
  if (submissions.length > 0) {
    const lastSub = submissions[submissions.length - 1];
    milestones.push({ label: `Submit ${lastSub.label}`, month: lastSub.monthStart });
  }

  const fstMeeting = events.find(e => e.type === 'fda-meeting');
  if (fstMeeting) {
    milestones.push({ label: `File Q-Sub (${fstMeeting.label})`, month: fstMeeting.monthStart });
  }

  const firstInternal = events.find(e => e.type === 'internal' && e.critical);
  if (firstInternal) {
    milestones.push({ label: `Begin ${firstInternal.label}`, month: firstInternal.monthStart });
  }

  return milestones.map(m => {
    const offsetMs = (maxMonth - m.month) * msPerMonth;
    const d = new Date(target.getTime() - offsetMs);
    return {
      label: m.label,
      date: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };
  });
}

// ── Month label formatter ─────────────────────────────────────────────────────

function fmtMonths(start: number, end: number): string {
  if (start === end) return `Month ${start}`;
  return `M${start}–${end}`;
}

// ── Phase header ──────────────────────────────────────────────────────────────

function PhaseHeader({ phase, color }: { phase: string; color: string }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex', alignItems: 'center', gap: 0,
      margin: '28px 0 4px',
    }}>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(to right, ${color}55, ${color}11)`,
      }} />
      <div style={{
        padding: '4px 18px',
        background: `${color}14`,
        border: `1px solid ${color}33`,
        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.18em',
        color: color,
        whiteSpace: 'nowrap',
      }}>
        {phase}
      </div>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(to left, ${color}55, ${color}11)`,
      }} />
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: RoadmapEvent;
  expanded: boolean;
  completed: boolean;
  isCurrent: boolean;
  onExpand: () => void;
  onComplete: () => void;
  onSetCurrent: () => void;
}

function EventCard({ event, expanded, completed, isCurrent, onExpand, onComplete, onSetCurrent }: EventCardProps) {
  const color = TYPE_COLOR[event.type];
  const typeLabel = TYPE_LABEL[event.type];
  const isPostMarket = event.type === 'post-market';

  return (
    <div style={{
      background: completed ? 'rgba(19,30,44,0.4)' : 'var(--surface-1)',
      border: isCurrent ? `1px solid ${color}` : completed ? '1px solid rgba(180,215,240,0.04)' : '1px solid var(--line)',
      borderLeft: `3px solid ${completed ? color + '44' : color}`,
      borderRadius: 2,
      opacity: completed ? 0.55 : 1,
      transition: 'all 0.15s',
    }}>
      {/* Collapsed header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        cursor: 'pointer',
      }} onClick={onExpand}>
        {/* Complete toggle */}
        <button
          onClick={e => { e.stopPropagation(); onComplete(); }}
          style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            background: completed ? color : 'transparent',
            border: `1.5px solid ${completed ? color : color + '66'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            fontSize: 9, color: completed ? '#131E2C' : 'transparent',
            transition: 'all 0.15s',
          }}
        >✓</button>

        {/* Type badge */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: isPostMarket ? 'var(--text-4)' : color,
          background: isPostMarket ? 'rgba(120,120,120,0.08)' : `${color}14`,
          border: `1px solid ${isPostMarket ? 'rgba(180,215,240,0.06)' : color + '33'}`,
          padding: '2px 5px', borderRadius: 2, flexShrink: 0,
        }}>{typeLabel}</span>

        {/* Critical badge */}
        {event.critical && !completed && (
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 7, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#E87252', background: 'rgba(232,114,82,0.10)',
            border: '1px solid rgba(232,114,82,0.25)',
            padding: '1px 5px', borderRadius: 2, flexShrink: 0,
          }}>Critical</span>
        )}

        {/* Label */}
        <div style={{
          flex: 1, minWidth: 0,
          fontSize: 13, fontWeight: 600,
          color: completed ? 'var(--text-3)' : 'var(--text)',
          lineHeight: 1.25,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{event.label}</div>

        {/* Duration pill */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 8,
          color: isPostMarket ? 'var(--text-4)' : color,
          background: isPostMarket ? 'rgba(120,120,120,0.06)' : `${color}10`,
          padding: '2px 6px', borderRadius: 2, flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>{event.durationLabel}</span>

        {/* You are here button */}
        {!completed && (
          <button
            onClick={e => { e.stopPropagation(); onSetCurrent(); }}
            style={{
              padding: '2px 7px', borderRadius: 2, flexShrink: 0,
              background: isCurrent ? `${color}22` : 'transparent',
              border: `1px solid ${isCurrent ? color : 'transparent'}`,
              fontFamily: 'var(--mono)', fontSize: 7, fontWeight: 700,
              color: isCurrent ? color : 'var(--text-4)',
              cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'all 0.15s',
            }}
          >{isCurrent ? '▸ HERE' : '▸ Mark'}</button>
        )}

        {/* Expand icon */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10,
          color: 'var(--text-4)', flexShrink: 0,
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s',
          display: 'inline-block',
        }}>›</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          padding: '0 12px 14px',
          borderTop: '1px solid var(--line)',
          marginTop: 0,
        }}>
          {/* Description */}
          <p style={{
            margin: '10px 0 10px',
            fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7,
          }}>{event.description}</p>

          {/* Requirements */}
          {event.keyRequirements.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                color: 'var(--text-4)', marginBottom: 6,
              }}>Key Requirements</div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {event.keyRequirements.map((req, i) => (
                  <li key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: color, fontSize: 9, flexShrink: 0, marginTop: 3, lineHeight: 1 }}>—</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategic tip */}
          {event.tip && (
            <div style={{
              padding: '7px 10px',
              background: `${color}08`,
              border: `1px solid ${color}22`,
              borderRadius: 2, marginBottom: 8,
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: color, marginRight: 6,
              }}>TIP:</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.65 }}>{event.tip}</span>
            </div>
          )}

          {/* Reg ref */}
          {event.regulationRef && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9,
              color: 'var(--text-4)', lineHeight: 1.5,
            }}>
              REF: {event.regulationRef}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Spine band (fda-review) ───────────────────────────────────────────────────

function SpineBand({ event, expanded, onExpand }: { event: RoadmapEvent; expanded: boolean; onExpand: () => void }) {
  const color = TYPE_COLOR['fda-review'];
  const duration = Math.max(event.monthEnd - event.monthStart, 0.5);
  const bandHeight = Math.max(duration * 44, 32);

  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 72, minHeight: bandHeight, flexShrink: 0,
    }}>
      {/* Colored band */}
      <div
        onClick={onExpand}
        style={{
          width: 12, height: '100%', minHeight: bandHeight,
          background: `linear-gradient(to bottom, ${color}55, ${color}33)`,
          border: `1px solid ${color}55`,
          borderRadius: 2, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 2,
          transition: 'background 0.15s',
        }}
        title={event.label}
      >
        {/* Thin inner stripe */}
        <div style={{
          width: 2, height: '80%',
          background: `${color}88`,
          borderRadius: 1,
        }} />
      </div>

      {/* Duration label — floats to right */}
      <div style={{
        position: 'absolute', left: 18,
        fontFamily: 'var(--mono)', fontSize: 8,
        color: color, whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: 'var(--bg)',
        padding: '2px 4px',
        border: `1px solid ${color}22`,
        borderRadius: 2,
        maxWidth: 160,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        zIndex: 3,
      }} onClick={onExpand} title={event.label}>
        {event.label}
        <span style={{ color: 'var(--text-4)', marginLeft: 4 }}>{event.durationLabel}</span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          position: 'absolute', left: 20, top: 0, zIndex: 10,
          background: 'var(--surface-2)',
          border: `1px solid ${color}44`,
          borderRadius: 2,
          padding: '10px 14px',
          width: 260,
          boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: color, marginBottom: 6,
          }}>FDA Review Window</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{event.label}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: color, marginBottom: 8 }}>{event.durationLabel}</div>
          {event.description && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 8 }}>{event.description}</div>
          )}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>REF: {event.regulationRef}</div>
          <button
            onClick={e => { e.stopPropagation(); onExpand(); }}
            style={{
              marginTop: 8, padding: '3px 8px', borderRadius: 2,
              background: 'transparent', border: `1px solid ${color}33`,
              fontFamily: 'var(--mono)', fontSize: 8,
              color: 'var(--text-4)', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >Close</button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FDARoadmapTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [pathway, setPathway] = useState<RegulatoryPathway>(state.regulatory.pathway);
  const [targetDate, setTargetDate] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);

  const events = PATHWAY_ROADMAP[pathway] ?? [];
  const stats = useMemo(() => computeStats(events), [events]);
  const reversePlan = useMemo(() => computeReversePlan(events, targetDate), [events, targetDate]);

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleComplete(id: string) {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleCurrent(id: string) {
    setCurrentId(prev => prev === id ? null : id);
  }

  // Group events by phase
  const phases = useMemo(() => {
    const phaseMap = new Map<string, { color: string; events: RoadmapEvent[] }>();
    for (const ev of events) {
      if (!phaseMap.has(ev.phase)) {
        phaseMap.set(ev.phase, { color: ev.phaseColor, events: [] });
      }
      phaseMap.get(ev.phase)!.events.push(ev);
    }
    return phaseMap;
  }, [events]);

  // ── Empty state (tbd) ────────────────────────────────────────────────────────

  if (pathway === 'tbd') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Hero */}
        <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 32, minHeight: 164 }}>
          <FlowCanvas accent="#E87252" />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#E87252', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
              FDA Development Roadmap
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
              FDA Development Roadmap
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 460 }}>
              Complete journey from concept to clearance — calibrated to your pathway
            </p>
          </div>
        </div>

        {/* Empty state */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '0 0 40px' }}>
            <div style={{
              textAlign: 'center', marginBottom: 32,
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)',
              textTransform: 'uppercase', letterSpacing: '0.14em',
            }}>
              Select your regulatory pathway to load the FDA development roadmap
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {(['exempt', '510k', 'denovo', 'pma'] as RegulatoryPathway[]).map(pw => {
                const meta = PATHWAY_META[pw];
                const descs: Record<string, string> = {
                  exempt:  'Class I Exempt — no premarket submission required. Fastest path to market for lower-risk devices.',
                  '510k':  'Class II 510(k) — substantial equivalence to a predicate device. 18-24 month typical journey.',
                  denovo:  'Class II De Novo — novel low-to-moderate risk device without predicate. 28-36 months.',
                  pma:     'Class III PMA — high-risk devices requiring clinical trial evidence. 60-96 month journey.',
                };
                const durations: Record<string, string> = {
                  exempt: '6–12 months', '510k': '18–24 months',
                  denovo: '28–36 months', pma: '60–96 months',
                };
                return (
                  <div
                    key={pw}
                    onClick={() => setPathway(pw)}
                    style={{
                      padding: '20px 22px', borderRadius: 2, cursor: 'pointer',
                      background: 'var(--surface-1)', border: `1px solid var(--line)`,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = meta.color + '66';
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)';
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-1)';
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                      color: meta.color, textTransform: 'uppercase',
                      letterSpacing: '0.12em', marginBottom: 6,
                    }}>{meta.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 10 }}>{durations[pw]}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65 }}>{descs[pw]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Full roadmap layout ───────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 0, minHeight: 164, flexShrink: 0 }}>
        <FlowCanvas accent="#E87252" />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#E87252', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
            FDA Development Roadmap
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            FDA Development Roadmap
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 420 }}>
            Complete journey from concept to clearance — calibrated to your pathway
          </p>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'Total Journey', value: stats.months },
              { label: 'FDA Interactions', value: stats.fdaInteractions },
              { label: 'Submissions', value: stats.submissions },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: '#E87252', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(232,114,82,0.5)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pathway selector + target date bar */}
      <div style={{
        flexShrink: 0,
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--line)',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Pathway pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['exempt', '510k', 'denovo', 'pma'] as RegulatoryPathway[]).map(pw => {
            const meta = PATHWAY_META[pw];
            const active = pathway === pw;
            return (
              <button
                key={pw}
                onClick={() => setPathway(pw)}
                style={{
                  padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
                  background: active ? `${meta.color}18` : 'transparent',
                  border: active ? `1px solid ${meta.color}` : '1px solid var(--line)',
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? meta.color : 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  transition: 'all 0.15s',
                }}
              >{meta.label}</button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Target date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Target Clearance:
          </span>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              borderRadius: 2, padding: '4px 8px', color: 'var(--text)',
              fontSize: 11, fontFamily: 'var(--mono)', outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>

      {/* Reverse planning banner */}
      {reversePlan.length > 0 && (
        <div style={{
          flexShrink: 0,
          background: 'rgba(232,114,82,0.06)',
          border: '1px solid rgba(232,114,82,0.18)',
          borderTop: 'none',
          padding: '8px 24px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          overflow: 'hidden',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#E87252', textTransform: 'uppercase', letterSpacing: '0.14em', flexShrink: 0 }}>
            Working Backwards →
          </span>
          {reversePlan.map((m, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 9 }}>→</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>
                <span style={{ color: '#E87252', fontWeight: 700 }}>{m.date}</span>
                <span style={{ color: 'var(--text-4)', marginLeft: 5 }}>{m.label}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        flexShrink: 0,
        padding: '6px 24px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {(Object.entries(TYPE_COLOR) as Array<[RoadmapEvent['type'], string]>).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: type === 'fda-review' ? 6 : 7, height: type === 'fda-review' ? 14 : 7,
              background: color, borderRadius: type === 'fda-review' ? 2 : '50%', flexShrink: 0,
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {TYPE_LABEL[type]}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Left = your work &nbsp;|&nbsp; Right = FDA interactions &nbsp;|&nbsp; Center = FDA review window
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '8px 24px 48px' }}>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', gap: 0, marginBottom: 4, marginTop: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', textAlign: 'right', paddingRight: 16 }}>
              Your Work — Internal Milestones
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(160,126,232,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
              Spine
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', paddingLeft: 16 }}>
              FDA Interactions
            </div>
          </div>

          {/* Spine line container */}
          <div style={{ position: 'relative' }}>
            {/* Continuous spine line */}
            <div style={{
              position: 'absolute',
              left: 'calc(50% - 1px)',
              top: 0, bottom: 0,
              width: 2,
              background: 'rgba(82,192,232,0.12)',
              zIndex: 0,
            }} />

            {/* Phase groups */}
            {Array.from(phases.entries()).map(([phaseName, phaseData]) => {
              const leftEvents = phaseData.events.filter(e => e.side === 'left');
              const rightEvents = phaseData.events.filter(e => e.side === 'right');
              const spineEvents = phaseData.events.filter(e => e.side === 'spine');

              // Interleave events by monthStart ordering
              const allSided = [...leftEvents, ...rightEvents].sort((a, b) => a.monthStart - b.monthStart);
              // Build rows: each row = { left?, spine?, right?, monthLabel }
              // Strategy: render each non-spine event as its own row, spine events shown at their position
              const allRows: Array<{ event: RoadmapEvent; spineAtMonth?: number }> = allSided.map(e => ({ event: e }));

              return (
                <div key={phaseName}>
                  {/* Phase header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', position: 'relative', zIndex: 1 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <PhaseHeader phase={phaseName} color={phaseData.color} />
                    </div>
                  </div>

                  {/* Spine-only events (review bands) shown once per phase */}
                  {spineEvents.map(se => {
                    const isExpanded = expandedIds.has(se.id);
                    return (
                      <div key={se.id} style={{
                        display: 'grid', gridTemplateColumns: '1fr 72px 1fr',
                        position: 'relative', zIndex: 1,
                        marginBottom: 4,
                      }}>
                        {/* Month label in left gutter */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          paddingRight: 16,
                        }}>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 8,
                            color: 'var(--text-4)',
                          }}>{fmtMonths(se.monthStart, se.monthEnd)}</span>
                        </div>
                        {/* Spine band */}
                        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                          <SpineBand
                            event={se}
                            expanded={isExpanded}
                            onExpand={() => toggleExpand(se.id)}
                          />
                        </div>
                        <div />
                      </div>
                    );
                  })}

                  {/* Side events */}
                  {allRows.map(({ event: ev }) => {
                    const isExpanded = expandedIds.has(ev.id);
                    const isCompleted = completedIds.has(ev.id);
                    const isCurrent = currentId === ev.id;
                    const isLeft = ev.side === 'left';

                    return (
                      <div key={ev.id} style={{
                        display: 'grid', gridTemplateColumns: '1fr 72px 1fr',
                        position: 'relative', zIndex: 1,
                        marginBottom: 6,
                      }}>
                        {/* Left column */}
                        <div style={{
                          paddingRight: 16,
                          display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                          {isLeft && (
                            <>
                              {/* Month label */}
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textAlign: 'right', marginBottom: 2 }}>
                                {fmtMonths(ev.monthStart, ev.monthEnd)}
                              </div>
                              <EventCard
                                event={ev}
                                expanded={isExpanded}
                                completed={isCompleted}
                                isCurrent={isCurrent}
                                onExpand={() => toggleExpand(ev.id)}
                                onComplete={() => toggleComplete(ev.id)}
                                onSetCurrent={() => toggleCurrent(ev.id)}
                              />
                            </>
                          )}
                        </div>

                        {/* Spine node */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: isLeft ? 28 : 28, position: 'relative', zIndex: 2 }}>
                          {isCurrent ? (
                            <div style={{ position: 'relative' }}>
                              <div style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: '#E87252',
                                boxShadow: '0 0 12px #E87252',
                                animation: 'roadmap-pulse 2s ease-in-out infinite',
                              }} />
                              <div style={{
                                position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                                fontFamily: 'var(--mono)', fontSize: 6, fontWeight: 700,
                                color: '#E87252', textTransform: 'uppercase', letterSpacing: '0.1em',
                                whiteSpace: 'nowrap',
                                background: 'var(--bg)', padding: '1px 4px',
                              }}>Here</div>
                            </div>
                          ) : (
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: isCompleted ? TYPE_COLOR[ev.type] : 'var(--surface-2)',
                              border: `1.5px solid ${isCompleted ? TYPE_COLOR[ev.type] : TYPE_COLOR[ev.type] + '44'}`,
                            }} />
                          )}
                        </div>

                        {/* Right column */}
                        <div style={{
                          paddingLeft: 16,
                          display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                          {!isLeft && (
                            <>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', marginBottom: 2 }}>
                                {fmtMonths(ev.monthStart, ev.monthEnd)}
                              </div>
                              <EventCard
                                event={ev}
                                expanded={isExpanded}
                                completed={isCompleted}
                                isCurrent={isCurrent}
                                onExpand={() => toggleExpand(ev.id)}
                                onComplete={() => toggleComplete(ev.id)}
                                onSetCurrent={() => toggleCurrent(ev.id)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes roadmap-pulse {
          0%, 100% { box-shadow: 0 0 8px #E87252aa; transform: scale(1); }
          50% { box-shadow: 0 0 18px #E87252; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
