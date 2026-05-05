'use client';
import React, { useState } from 'react';
import { BiodesignState, RegulatoryPathway } from './data';
import { FlowCanvas } from './flowbg';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ExportSuiteProps {
  state: BiodesignState;
  onOpenDataRoom: () => void;
  onClose: () => void;
}

// ── CSV / File utilities ──────────────────────────────────────────────────────

function generateCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Print utility for regulatory summary ─────────────────────────────────────

function printRegSummary(state: BiodesignState) {
  const existing = document.getElementById('bd-regsummary-print');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'bd-regsummary-print';
  div.className = 'bd-regsummary-print';
  div.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        .bd-regsummary-print, .bd-regsummary-print * { visibility: visible !important; }
        .bd-regsummary-print { position: fixed !important; inset: 0 !important; background: #fff !important; color: #111 !important; padding: 40px !important; font-family: Georgia, serif; font-size: 13px; line-height: 1.7; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 15px; margin: 20px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        .label { font-size: 11px; font-family: monospace; text-transform: uppercase; color: #666; }
        .value { margin-bottom: 12px; }
      }
    </style>
    <h1>${state.projectName || 'Untitled Project'}</h1>
    <div class="label">Indication</div><div class="value">${state.indication || '—'}</div>
    <h2>Regulatory Strategy</h2>
    <div class="label">Pathway</div><div class="value">${state.regulatory.pathway.toUpperCase()}</div>
    <div class="label">Device Class</div><div class="value">Class ${state.regulatory.deviceClass}</div>
    <div class="label">Product Code</div><div class="value">${state.regulatory.productCode || '—'}</div>
    <div class="label">Intended Use</div><div class="value">${state.regulatory.intendedUse || '—'}</div>
    <div class="label">Indications for Use</div><div class="value">${state.regulatory.indicationsForUse || '—'}</div>
    ${state.regulatory.pathway === '510k' ? `<div class="label">Predicate Device</div><div class="value">${state.regulatory.predicateDevice || '—'} (${state.regulatory.predicateNumber || 'K-number not set'})</div>` : ''}
    ${state.regulatory.substantialEquivalence ? `<div class="label">Substantial Equivalence Argument</div><div class="value">${state.regulatory.substantialEquivalence}</div>` : ''}
    <div class="label">Estimated Timeline</div><div class="value">${state.regulatory.estimatedTimelineMonths ? state.regulatory.estimatedTimelineMonths + ' months' : '—'}</div>
    <div class="label">Estimated Cost</div><div class="value">${state.regulatory.estimatedCost || '—'}</div>
    ${state.regulatory.notes ? `<div class="label">Notes</div><div class="value">${state.regulatory.notes}</div>` : ''}
  `;
  document.body.appendChild(div);
  window.print();
  setTimeout(() => div.remove(), 1000);
}

// ── Budget line items keyed by pathway ───────────────────────────────────────

interface BudgetLine {
  category: string;
  item: string;
  lowK: number;
  highK: number;
  required: boolean;
  pathways: RegulatoryPathway[] | 'all';
  notes: string;
}

const BUDGET_LINES: BudgetLine[] = [
  { category: 'Regulatory', item: 'FDA Submission Fee',         lowK: 5,    highK: 20,   required: true,  pathways: ['510k', 'pma', 'denovo'], notes: 'MDUFA small business rates may apply' },
  { category: 'Regulatory', item: 'Regulatory Consultant',      lowK: 30,   highK: 120,  required: true,  pathways: 'all',                     notes: 'Strategy + submission writing' },
  { category: 'Regulatory', item: 'Q-Submission Meetings',      lowK: 5,    highK: 20,   required: false, pathways: 'all',                     notes: 'Per meeting preparation cost' },
  { category: 'Testing',    item: 'Biocompatibility (ISO 10993)',lowK: 20,   highK: 60,   required: false, pathways: ['510k', 'pma', 'denovo'], notes: 'Required if patient-contacting' },
  { category: 'Testing',    item: 'Bench/Performance Testing',   lowK: 30,   highK: 120,  required: true,  pathways: ['510k', 'pma', 'denovo'], notes: 'Per applicable performance standards' },
  { category: 'Testing',    item: 'Electrical Safety (IEC 60601)',lowK: 15,  highK: 50,   required: false, pathways: ['510k', 'pma'],           notes: 'Required for active electrical devices' },
  { category: 'Testing',    item: 'Usability / HFE Testing',    lowK: 40,   highK: 120,  required: false, pathways: ['510k', 'pma'],           notes: 'Summative study typically required' },
  { category: 'Clinical',   item: 'Clinical Study — Pilot',     lowK: 100,  highK: 500,  required: false, pathways: ['510k', 'denovo'],        notes: 'If limited clinical data required' },
  { category: 'Clinical',   item: 'Clinical Study — Pivotal',   lowK: 1000, highK: 5000, required: true,  pathways: ['pma'],                   notes: 'PMA pivotal trial' },
  { category: 'Clinical',   item: 'IRB / ClinicalTrials.gov',   lowK: 5,    highK: 25,   required: false, pathways: ['510k', 'pma', 'denovo'], notes: 'Registration and ethics fees' },
  { category: 'IP',         item: 'Provisional Patent Filing',  lowK: 3,    highK: 8,    required: false, pathways: 'all',                     notes: 'Per provisional application' },
  { category: 'IP',         item: 'Utility Patent Filing',      lowK: 15,   highK: 40,   required: false, pathways: 'all',                     notes: 'Per US utility patent' },
  { category: 'Quality',    item: 'QMS Implementation (ISO 13485)',lowK: 30, highK: 100,  required: true,  pathways: ['510k', 'pma'],           notes: 'Design controls + DHF' },
  { category: 'Quality',    item: 'Risk Management (ISO 14971)',  lowK: 15,  highK: 45,   required: true,  pathways: ['510k', 'pma', 'denovo'], notes: 'Full risk file development' },
  { category: 'Manufacturing', item: 'Pilot Manufacturing Runs', lowK: 50,  highK: 300,  required: false, pathways: 'all',                     notes: 'For device validation builds' },
];

function getBudgetLines(pathway: RegulatoryPathway): BudgetLine[] {
  return BUDGET_LINES.filter(l =>
    l.pathways === 'all' || (l.pathways as RegulatoryPathway[]).includes(pathway)
  );
}

// ── Export actions ────────────────────────────────────────────────────────────

function exportRiskCSV(state: BiodesignState) {
  const risks = state.risks ?? [];
  const headers = ['ID', 'Category', 'Description', 'Likelihood (1-5)', 'Severity (1-5)', 'Risk Score', 'Mitigation', 'Owner', 'Status'];
  const rows = risks.map(r => [
    r.id,
    r.category,
    r.title + (r.description ? ' — ' + r.description : ''),
    r.probability,
    r.impact,
    r.probability * r.impact,
    r.mitigation,
    r.owner,
    r.status,
  ]);
  const csv = generateCSV(headers, rows);
  downloadFile(`${state.projectName || 'project'}-risk-register.csv`, csv, 'text/csv');
}

function exportIPCSV(state: BiodesignState) {
  const filings = state.ipFilings ?? [];
  const headers = ['Filing ID', 'Type', 'Title', 'Status', 'Filing Date', 'Jurisdiction', 'Expiry Date', 'Deadlines', 'Notes'];
  const rows = filings.map(f => [
    f.id,
    f.type,
    f.title,
    f.status,
    f.filingDate,
    f.jurisdictions.join('; '),
    f.deadlines.filter(d => !d.done).map(d => d.label).join('; '),
    f.notes,
  ]);
  const csv = generateCSV(headers, rows);
  downloadFile(`${state.projectName || 'project'}-ip-portfolio.csv`, csv, 'text/csv');
}

function exportBudgetCSV(state: BiodesignState) {
  const pathway = state.regulatory?.pathway ?? 'tbd';
  const lines = getBudgetLines(pathway);
  const headers = ['Category', 'Item', 'Low Estimate ($K)', 'High Estimate ($K)', 'Required', 'Notes'];
  const rows = lines.map(l => [
    l.category,
    l.item,
    l.lowK,
    l.highK,
    l.required ? 'Yes' : 'No',
    l.notes,
  ]);
  const csv = generateCSV(headers, rows);
  downloadFile(`${state.projectName || 'project'}-budget-estimate.csv`, csv, 'text/csv');
}

function exportMilestonesCSV(state: BiodesignState) {
  const milestones = state.milestones ?? [];
  const headers = ['ID', 'Title', 'Category', 'Target Date', 'Completed Date', 'Status', 'Owner', 'Critical', 'Notes'];
  const rows = milestones.map(m => [
    m.id,
    m.title,
    m.category,
    m.targetDate,
    m.completedDate,
    m.status,
    m.owner,
    m.critical ? 'Yes' : 'No',
    m.notes,
  ]);
  const csv = generateCSV(headers, rows);
  downloadFile(`${state.projectName || 'project'}-milestones.csv`, csv, 'text/csv');
}

function exportProjectJSON(state: BiodesignState) {
  const json = JSON.stringify(state, null, 2);
  const slug = (state.projectName || 'project').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  downloadFile(`${slug}-biodesign-export.json`, json, 'application/json');
}

function exportQSubTXT(state: BiodesignState) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const meetings = state.preSubmission?.meetings ?? [];
  const activeMeeting = meetings[0] ?? null;
  const questions = activeMeeting?.questions ?? [];

  const STANDARD_DOCS = [
    'Cover Letter',
    'Device Description',
    'Intended Use / Indications for Use',
    'Device Classification',
    'Specific Questions List',
    'Predicate Comparison (if 510k)',
    'Performance Testing Summary',
    'Clinical Protocol (if applicable)',
    'Risk Analysis Summary',
    'Statistical Analysis Plan (if applicable)',
  ];

  const meetingLines = meetings.length > 0
    ? meetings.map((m, i) =>
        `  ${i + 1}. ${m.title} [${m.type.toUpperCase()}] — Status: ${m.status}${m.meetingDate ? ` — Meeting: ${m.meetingDate}` : ''}`
      ).join('\n')
    : '  No meetings created yet.';

  const docLines = STANDARD_DOCS.map(doc => {
    const found = activeMeeting?.documents.find(d => d.name.toLowerCase().includes(doc.split(' ')[0].toLowerCase()));
    const status = found ? (found.status === 'complete' ? '[COMPLETE]' : found.status === 'in-progress' ? '[IN PROGRESS]' : '[NOT STARTED]') : '[ ]';
    return `  ${status} ${doc}`;
  }).join('\n');

  const questionLines = questions.length > 0
    ? questions.map((q, i) =>
        `  Q${i + 1} [${q.category.toUpperCase()} / P${q.priority}] ${q.text || '(draft — text not entered)'}` +
        (q.fdaResponse ? `\n       FDA Response: ${q.fdaResponse}` : '')
      ).join('\n\n')
    : '  No questions logged yet.';

  const content = [
    'FDA Q-SUBMISSION PACKAGE CHECKLIST',
    `${state.projectName || 'Untitled Project'} — ${today}`,
    '=====================================',
    '',
    'DEVICE INFORMATION',
    `Device Name: ${state.projectName || '—'}`,
    `Indication: ${state.indication || '—'}`,
    `Pathway: ${state.regulatory?.pathway?.toUpperCase() ?? '—'}`,
    `Device Class: ${state.regulatory?.deviceClass ?? '—'}`,
    `Intended Use: ${state.regulatory?.intendedUse || '—'}`,
    '',
    'Q-SUB MEETINGS',
    meetingLines,
    '',
    'DOCUMENTS STATUS',
    docLines,
    '',
    `QUESTIONS (${questions.length} of 10 recommended max)`,
    questionLines,
    '',
    '=====================================',
    `Generated by Ambient Intelligence — ${today}`,
  ].join('\n');

  const slug = (state.projectName || 'project').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  downloadFile(`${slug}-qsub-checklist.txt`, content, 'text/plain');
}

// ── Completeness helpers ──────────────────────────────────────────────────────

function countDataRoomSections(state: BiodesignState): number {
  let count = 0;
  if (state.projectName || state.projectDescription || state.indication) count++;
  if (state.needs?.length > 0) count++;
  if (state.concepts?.length > 0) count++;
  if (state.regulatory?.intendedUse || state.regulatory?.pathway !== 'tbd') count++;
  if (state.clinical?.primaryEndpoint) count++;
  if (state.business?.totalAddressableMarket || state.business?.revenueModel) count++;
  if (state.ipFilings?.length > 0 || state.patents?.length > 0) count++;
  if (state.reimbursement?.siteOfService || state.reimbursement?.cptCodes?.length > 0) count++;
  if (state.risks?.length > 0) count++;
  if (state.milestones?.length > 0) count++;
  if (state.competitors?.length > 0) count++;
  return count;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
};

// ── Export Card ───────────────────────────────────────────────────────────────

interface ExportCardProps {
  color: string;
  category: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'CSV' | 'JSON' | 'TXT';
  buttonLabel: string;
  completeness: string;
  onClick: () => void;
}

function ExportCard({ color, category, title, description, fileType, buttonLabel, completeness, onClick }: ExportCardProps) {
  const [active, setActive] = useState(false);

  function handleClick() {
    setActive(true);
    onClick();
    setTimeout(() => setActive(false), 1800);
  }

  const fileTypeBg: Record<string, string> = {
    PDF: 'rgba(232,114,82,0.12)',
    CSV: 'rgba(232,168,82,0.12)',
    JSON: 'rgba(82,192,232,0.12)',
    TXT: 'rgba(160,126,232,0.12)',
  };
  const fileTypeColor: Record<string, string> = {
    PDF: '#E87252',
    CSV: '#E8A852',
    JSON: '#52C0E8',
    TXT: '#A07EE8',
  };

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--line)',
      borderLeft: `3px solid ${color}`,
      borderRadius: 4,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      transition: 'border-color 0.15s',
    }}>
      {/* Category badge + file type */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.14em',
          color: color,
          background: color + '18',
          border: `1px solid ${color}33`,
          padding: '2px 7px',
          borderRadius: 2,
        }}>{category}</span>
        <span style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 2,
          background: fileTypeBg[fileType] ?? 'rgba(120,120,120,0.10)',
          color: fileTypeColor[fileType] ?? 'var(--text-4)',
          border: `1px solid ${fileTypeColor[fileType] ?? 'rgba(120,120,120,0.2)'}33`,
        }}>{fileType}</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{title}</div>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, flex: 1 }}>{description}</div>

      {/* Export button */}
      <button
        onClick={handleClick}
        style={{
          width: '100%',
          padding: '10px 0',
          border: 'none',
          borderRadius: 2,
          cursor: 'pointer',
          background: active ? color + 'cc' : color,
          color: '#fff',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.12em',
          transition: 'background 0.15s, transform 0.1s',
          transform: active ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        {active ? 'Exporting...' : buttonLabel}
      </button>

      {/* Completeness */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-4)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}>{completeness}</div>
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────

export function ExportSuiteOverlay({ state, onOpenDataRoom, onClose }: ExportSuiteProps) {
  const risks = state.risks ?? [];
  const riskCategories = new Set(risks.map(r => r.category));
  const ipFilings = state.ipFilings ?? [];
  const upcomingDeadlines = ipFilings.flatMap(f => f.deadlines.filter(d => !d.done));
  const milestones = state.milestones ?? [];
  const completeMilestones = milestones.filter(m => m.status === 'complete');
  const meetings = state.preSubmission?.meetings ?? [];
  const allQuestions = meetings.flatMap(m => m.questions);
  const pathway = state.regulatory?.pathway ?? 'tbd';
  const budgetLines = getBudgetLines(pathway);
  const sectionsPopulated = countDataRoomSections(state);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9100,
        background: 'var(--bg)',
        overflowY: 'auto',
      }}
      className="biodesign-root"
    >
      {/* Canvas underlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <FlowCanvas accent="#52E8B4" />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(19,30,44,0.88)',
        }} />
      </div>

      {/* Fixed header bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9110,
        background: 'rgba(14,22,34,0.96)',
        borderBottom: '1px solid var(--line)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 64,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            Export Suite
          </div>
          <div style={{ ...monoLabel, color: '#52E8B4', marginTop: 2 }}>
            {state.projectName || 'Untitled Project'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '7px 18px',
            borderRadius: 2,
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Close
        </button>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 96, paddingBottom: 64, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...monoLabel, color: '#52E8B4', marginBottom: 10 }}>8 Export Formats</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Export your project data
            </h2>
            <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 560 }}>
              Download investor packages, regulatory filings, risk registers, and more. Most exports are generated client-side — no server required.
            </p>
          </div>

          {/* Card grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
            className="es-card-grid"
          >
            {/* Card 1: Investor Data Room (PDF) */}
            <ExportCard
              color="#52E8B4"
              category="Investor"
              title="Investor Data Room"
              description="11-section PDF package: executive summary, regulatory strategy, clinical plan, IP, financials, risks, and more."
              fileType="PDF"
              buttonLabel="Open Data Room"
              completeness={`${sectionsPopulated} of 11 sections populated`}
              onClick={() => { onOpenDataRoom(); onClose(); }}
            />

            {/* Card 2: Regulatory Summary (PDF) */}
            <ExportCard
              color="#E87252"
              category="Regulatory"
              title="Regulatory Summary"
              description="Regulatory pathway, device class, predicate, intended use, SE argument, and development timeline."
              fileType="PDF"
              buttonLabel="Print / Save PDF"
              completeness={
                state.regulatory.pathway !== 'tbd'
                  ? `${state.regulatory.pathway.toUpperCase()} pathway · Class ${state.regulatory.deviceClass}`
                  : 'Regulatory pathway not yet selected'
              }
              onClick={() => printRegSummary(state)}
            />

            {/* Card 3: Risk Register (CSV) */}
            <ExportCard
              color="#E8A852"
              category="Risk Management"
              title="Risk Register"
              description="Full ISO 14971 risk register with likelihood, severity, risk score, and mitigations."
              fileType="CSV"
              buttonLabel="Download CSV"
              completeness={
                risks.length > 0
                  ? `${risks.length} risk${risks.length !== 1 ? 's' : ''} across ${riskCategories.size} categor${riskCategories.size !== 1 ? 'ies' : 'y'}`
                  : 'No risks logged yet'
              }
              onClick={() => exportRiskCSV(state)}
            />

            {/* Card 4: IP Portfolio (CSV) */}
            <ExportCard
              color="#52E8B4"
              category="Intellectual Property"
              title="IP Portfolio"
              description="All IP filings with type, status, jurisdictions, and upcoming deadlines."
              fileType="CSV"
              buttonLabel="Download CSV"
              completeness={
                ipFilings.length > 0
                  ? `${ipFilings.length} filing${ipFilings.length !== 1 ? 's' : ''}, ${upcomingDeadlines.length} upcoming deadline${upcomingDeadlines.length !== 1 ? 's' : ''}`
                  : 'No IP filings logged yet'
              }
              onClick={() => exportIPCSV(state)}
            />

            {/* Card 5: Development Budget (CSV) */}
            <ExportCard
              color="#E8A852"
              category="Financial"
              title="Development Budget"
              description="Pathway-calibrated cost estimates by category with low and high ranges."
              fileType="CSV"
              buttonLabel="Download CSV"
              completeness={`Based on ${pathway.toUpperCase()} pathway, ${budgetLines.length} line items`}
              onClick={() => exportBudgetCSV(state)}
            />

            {/* Card 6: Project Milestones (CSV) */}
            <ExportCard
              color="#52C0E8"
              category="Timeline"
              title="Project Timeline"
              description="All milestones with target dates, owners, status, and critical path flags."
              fileType="CSV"
              buttonLabel="Download CSV"
              completeness={
                milestones.length > 0
                  ? `${milestones.length} milestone${milestones.length !== 1 ? 's' : ''}, ${completeMilestones.length} complete`
                  : 'No milestones entered yet'
              }
              onClick={() => exportMilestonesCSV(state)}
            />

            {/* Card 7: Full Project JSON */}
            <ExportCard
              color="var(--accent)"
              category="Backup"
              title="Full Project Data"
              description="Complete project export in JSON format. Use to back up or transfer your project to another session."
              fileType="JSON"
              buttonLabel="Download JSON"
              completeness={`Full project snapshot as of ${today}`}
              onClick={() => exportProjectJSON(state)}
            />

            {/* Card 8: Q-Sub Package Summary (TXT) */}
            <ExportCard
              color="#E87252"
              category="FDA Pre-Submission"
              title="Q-Sub Package Checklist"
              description="Pre-submission meeting package checklist with your project data pre-filled."
              fileType="TXT"
              buttonLabel="Download TXT"
              completeness={
                meetings.length > 0
                  ? `${meetings.length} Q-Sub meeting${meetings.length !== 1 ? 's' : ''}, ${allQuestions.length} question${allQuestions.length !== 1 ? 's' : ''} logged`
                  : 'No Q-Sub meetings created yet'
              }
              onClick={() => exportQSubTXT(state)}
            />
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#52E8B4', boxShadow: '0 0 6px #52E8B4', marginTop: 5, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.7 }}>
              All exports are generated in your browser — no data is transmitted to external servers. JSON exports can be re-imported to restore your project state.
            </div>
          </div>
        </div>
      </div>

      {/* Responsive style */}
      <style>{`
        @media (max-width: 640px) {
          .es-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
