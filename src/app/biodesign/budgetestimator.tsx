'use client';
import React, { useState } from 'react';
import { BiodesignState, RegulatoryPathway, PATHWAY_META } from './data';
import { FlowCanvas } from './flowbg';

// ── Data model ────────────────────────────────────────────────────────────────

interface BudgetLine {
  id: string;
  category: string;
  label: string;
  lowK: number;   // in $1,000s
  highK: number;  // in $1,000s
  enabled: boolean;
  note: string;
  pathways: RegulatoryPathway[];
  required: boolean;
}

// ── Category metadata ──────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { color: string }> = {
  'FDA Fees':                  { color: '#E87252' },
  'Regulatory Affairs':        { color: '#E8A852' },
  'Testing & Validation':      { color: '#52C0E8' },
  'Clinical':                  { color: '#A07EE8' },
  'Legal & IP':                { color: '#52E8B4' },
  'Quality & Manufacturing':   { color: 'rgba(214,233,248,0.70)' },
  'Post-Market':               { color: '#7EA8E8' },
};

const ALL_NON_EXEMPT: RegulatoryPathway[] = ['510k', 'pma', 'denovo'];
const ALL_PATHWAYS: RegulatoryPathway[] = ['510k', 'pma', 'denovo', 'exempt'];

// ── Default budget lines ───────────────────────────────────────────────────

export const DEFAULT_BUDGET_LINES: BudgetLine[] = [
  // ── FDA Fees ──
  {
    id: 'fda-510k-fee',
    category: 'FDA Fees',
    label: '510(k) user fee',
    lowK: 21, highK: 22,
    enabled: true, required: true,
    pathways: ['510k'],
    note: 'FY2025 MDUFA fee: $21,760 (small business: $5,440)',
  },
  {
    id: 'fda-denovo-fee',
    category: 'FDA Fees',
    label: 'De Novo user fee',
    lowK: 5, highK: 6,
    enabled: true, required: true,
    pathways: ['denovo'],
    note: 'FY2025 fee: $5,546',
  },
  {
    id: 'fda-pma-fee',
    category: 'FDA Fees',
    label: 'PMA user fee',
    lowK: 425, highK: 435,
    enabled: true, required: true,
    pathways: ['pma'],
    note: 'FY2025 MDUFA fee: $425,760 (small business: $106,440)',
  },
  {
    id: 'fda-ide-fee',
    category: 'FDA Fees',
    label: 'IDE fee',
    lowK: 8, highK: 9,
    enabled: true, required: true,
    pathways: ['pma'],
    note: 'Required if clinical trial needed',
  },
  {
    id: 'fda-registration',
    category: 'FDA Fees',
    label: 'Establishment Registration (annual)',
    lowK: 7, highK: 7,
    enabled: true, required: true,
    pathways: ALL_PATHWAYS,
    note: 'Annual FDA registration fee',
  },
  {
    id: 'fda-postmarket-surveillance',
    category: 'FDA Fees',
    label: 'Post-market surveillance (annual)',
    lowK: 5, highK: 15,
    enabled: true, required: false,
    pathways: ['510k', 'denovo', 'pma'],
    note: '',
  },
  // ── Regulatory Affairs ──
  {
    id: 'ra-consultant',
    category: 'Regulatory Affairs',
    label: 'Regulatory strategy consultant',
    lowK: 25, highK: 75,
    enabled: true, required: false,
    pathways: ALL_NON_EXEMPT,
    note: 'RA consultant for pathway strategy, Q-Sub, submission writing',
  },
  {
    id: 'ra-qsub',
    category: 'Regulatory Affairs',
    label: 'Q-Submission preparation',
    lowK: 15, highK: 45,
    enabled: true, required: false,
    pathways: ALL_NON_EXEMPT,
    note: '',
  },
  {
    id: 'ra-510k-writing',
    category: 'Regulatory Affairs',
    label: '510(k) submission writing',
    lowK: 40, highK: 120,
    enabled: true, required: false,
    pathways: ['510k'],
    note: '',
  },
  {
    id: 'ra-pma-writing',
    category: 'Regulatory Affairs',
    label: 'PMA submission writing',
    lowK: 150, highK: 400,
    enabled: true, required: false,
    pathways: ['pma'],
    note: '',
  },
  {
    id: 'ra-denovo-writing',
    category: 'Regulatory Affairs',
    label: 'De Novo request preparation',
    lowK: 60, highK: 150,
    enabled: true, required: false,
    pathways: ['denovo'],
    note: '',
  },
  {
    id: 'ra-fda-meeting',
    category: 'Regulatory Affairs',
    label: 'FDA meeting preparation',
    lowK: 10, highK: 30,
    enabled: true, required: false,
    pathways: ALL_NON_EXEMPT,
    note: '',
  },
  // ── Testing & Validation ──
  {
    id: 'test-biocompat',
    category: 'Testing & Validation',
    label: 'Biocompatibility testing (ISO 10993)',
    lowK: 30, highK: 80,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: 'Required for patient-contacting devices',
  },
  {
    id: 'test-elec-safety',
    category: 'Testing & Validation',
    label: 'Electrical safety & EMC (IEC 60601)',
    lowK: 25, highK: 60,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: 'Required for active/powered devices',
  },
  {
    id: 'test-bench',
    category: 'Testing & Validation',
    label: 'Performance / bench testing',
    lowK: 20, highK: 100,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'test-sw-vv',
    category: 'Testing & Validation',
    label: 'Software V&V',
    lowK: 30, highK: 150,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: 'Scales with software complexity and risk',
  },
  {
    id: 'test-sterile',
    category: 'Testing & Validation',
    label: 'Sterilization validation',
    lowK: 20, highK: 60,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: 'Required if device is sterile',
  },
  {
    id: 'test-hfe',
    category: 'Testing & Validation',
    label: 'Usability engineering / HFE',
    lowK: 15, highK: 50,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'test-dhf',
    category: 'Testing & Validation',
    label: 'Design controls / DHF',
    lowK: 20, highK: 60,
    enabled: true, required: true,
    pathways: ALL_PATHWAYS,
    note: 'Required for Class II and III',
  },
  // ── Clinical ──
  {
    id: 'clin-ide',
    category: 'Clinical',
    label: 'IDE application',
    lowK: 30, highK: 75,
    enabled: true, required: false,
    pathways: ['pma'],
    note: '',
  },
  {
    id: 'clin-trial-ops',
    category: 'Clinical',
    label: 'Clinical trial operations (per site)',
    lowK: 100, highK: 300,
    enabled: true, required: false,
    pathways: ['pma'],
    note: 'Per clinical site per year; multiply by site count',
  },
  {
    id: 'clin-cro',
    category: 'Clinical',
    label: 'CRO services',
    lowK: 200, highK: 600,
    enabled: true, required: false,
    pathways: ['pma'],
    note: 'Contract Research Organization for trial management',
  },
  {
    id: 'clin-irb',
    category: 'Clinical',
    label: 'IRB fees',
    lowK: 10, highK: 30,
    enabled: true, required: false,
    pathways: ['pma'],
    note: '',
  },
  {
    id: 'clin-data-mgmt',
    category: 'Clinical',
    label: 'Clinical data management',
    lowK: 50, highK: 150,
    enabled: true, required: false,
    pathways: ['pma'],
    note: '',
  },
  {
    id: 'clin-biostats',
    category: 'Clinical',
    label: 'Biostatistics',
    lowK: 30, highK: 80,
    enabled: true, required: false,
    pathways: ['pma', 'denovo'],
    note: '',
  },
  // ── Legal & IP ──
  {
    id: 'ip-provisional',
    category: 'Legal & IP',
    label: 'Patent application (provisional)',
    lowK: 5, highK: 15,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'ip-utility',
    category: 'Legal & IP',
    label: 'Patent application (utility)',
    lowK: 20, highK: 50,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'ip-prosecution',
    category: 'Legal & IP',
    label: 'Patent prosecution',
    lowK: 10, highK: 30,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'ip-fto',
    category: 'Legal & IP',
    label: 'Freedom-to-operate analysis',
    lowK: 15, highK: 40,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'ip-legal-counsel',
    category: 'Legal & IP',
    label: 'Regulatory legal counsel',
    lowK: 20, highK: 60,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  // ── Quality & Manufacturing ──
  {
    id: 'qms-impl',
    category: 'Quality & Manufacturing',
    label: 'QMS implementation (21 CFR 820)',
    lowK: 30, highK: 100,
    enabled: true, required: true,
    pathways: ALL_PATHWAYS,
    note: 'Design controls, DHF, QSR compliance',
  },
  {
    id: 'qms-iso13485',
    category: 'Quality & Manufacturing',
    label: 'ISO 13485 certification',
    lowK: 30, highK: 80,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'qms-mfg-validation',
    category: 'Quality & Manufacturing',
    label: 'Manufacturing process validation',
    lowK: 25, highK: 100,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'qms-supply-chain',
    category: 'Quality & Manufacturing',
    label: 'Supply chain qualification',
    lowK: 15, highK: 50,
    enabled: true, required: false,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  // ── Post-Market ──
  {
    id: 'pm-mdr',
    category: 'Post-Market',
    label: 'MDR/surveillance system setup',
    lowK: 10, highK: 30,
    enabled: true, required: true,
    pathways: ALL_PATHWAYS,
    note: '',
  },
  {
    id: 'pm-pmcf',
    category: 'Post-Market',
    label: 'Post-market clinical follow-up',
    lowK: 20, highK: 100,
    enabled: true, required: false,
    pathways: ['pma'],
    note: '',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtK(k: number): string {
  if (k >= 1000) return `$${(k / 1000).toFixed(1)}M`;
  return `$${k}k`;
}

function fmtKRange(lo: number, hi: number): string {
  return `${fmtK(lo)} — ${fmtK(hi)}`;
}

const PATHWAY_LABELS: Record<RegulatoryPathway, string> = {
  exempt:  'Exempt',
  '510k':  '510(k)',
  denovo:  'De Novo',
  pma:     'PMA',
  tbd:     'TBD',
};

const SELECTOR_PATHWAYS: RegulatoryPathway[] = ['exempt', '510k', 'denovo', 'pma'];

// ── Shared styles ──────────────────────────────────────────────────────────

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
  marginBottom: 5,
};

// ── Note Tooltip ──────────────────────────────────────────────────────────

function NoteIcon({ note }: { note: string }) {
  const [visible, setVisible] = useState(false);
  if (!note) return null;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, borderRadius: '50%',
          border: '1px solid var(--line-strong)',
          fontFamily: 'var(--mono)', fontSize: 8,
          color: 'var(--text-4)', cursor: 'default',
          flexShrink: 0,
        }}
      >i</span>
      {visible && (
        <div style={{
          position: 'absolute', left: 20, top: -4, zIndex: 100,
          background: 'var(--surface-3)',
          border: '1px solid var(--line-strong)',
          borderRadius: 2, padding: '6px 10px',
          fontSize: 11, color: 'var(--text-2)',
          lineHeight: 1.6, whiteSpace: 'nowrap', maxWidth: 280,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>{note}</div>
      )}
    </div>
  );
}

// ── Number input ───────────────────────────────────────────────────────────

function KInput({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      min={0}
      onChange={e => {
        const n = parseFloat(e.target.value);
        if (!isNaN(n) && n >= 0) onChange(n);
      }}
      style={{
        width: 72, background: 'transparent',
        border: 'none', borderBottom: '1px solid var(--line)',
        color: 'var(--text)', fontFamily: 'var(--mono)',
        fontSize: 12, padding: '2px 4px',
        outline: 'none', textAlign: 'right',
        borderRadius: 0,
      }}
    />
  );
}

// ── Category Section ───────────────────────────────────────────────────────

function CategorySection({
  category, lines, onToggle, onChangeLow, onChangeHigh,
}: {
  category: string;
  lines: BudgetLine[];
  onToggle: (id: string) => void;
  onChangeLow: (id: string, v: number) => void;
  onChangeHigh: (id: string, v: number) => void;
}) {
  const meta = CATEGORY_META[category] ?? { color: 'var(--text-2)' };
  const enabledLines = lines.filter(l => l.enabled);
  const subLow = enabledLines.reduce((s, l) => s + l.lowK, 0);
  const subHigh = enabledLines.reduce((s, l) => s + l.highK, 0);
  const rgb = meta.color.startsWith('#') ? hexToRgbaStyle(meta.color, 0.06) : 'rgba(214,233,248,0.04)';

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Category header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: rgb,
        borderLeft: `3px solid ${meta.color}`,
        marginBottom: 2,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.14em',
          color: meta.color,
        }}>{category}</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          color: subLow === 0 && subHigh === 0 ? 'var(--text-4)' : 'var(--text-2)',
        }}>
          {enabledLines.length > 0 ? fmtKRange(subLow, subHigh) : <span style={{ color: 'var(--text-4)' }}>—</span>}
        </div>
      </div>

      {/* Budget lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {lines.map(line => {
          const dimmed = !line.enabled;
          return (
            <div
              key={line.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px',
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                opacity: dimmed ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {/* Toggle / Lock */}
              <div style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {line.required ? (
                  <span style={{ fontSize: 11, color: 'var(--text-4)' }}>•</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={() => onToggle(line.id)}
                    style={{ width: 13, height: 13, cursor: 'pointer', accentColor: meta.color }}
                  />
                )}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                {line.label}
              </div>

              {/* Note icon */}
              <NoteIcon note={line.note} />

              {/* Low input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>$</span>
                <KInput value={line.lowK} onChange={v => onChangeLow(line.id, v)} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>K</span>
              </div>

              {/* Separator */}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>—</span>

              {/* High input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>$</span>
                <KInput value={line.highK} onChange={v => onChangeHigh(line.id, v)} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>K</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Utility: hex to rgba ───────────────────────────────────────────────────

function hexToRgbaStyle(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Summary Panel ──────────────────────────────────────────────────────────

function SummaryPanel({
  lines, pathway, contingency, onToggleContingency, onExportCSV,
}: {
  lines: BudgetLine[];
  pathway: RegulatoryPathway;
  contingency: boolean;
  onToggleContingency: () => void;
  onExportCSV: () => void;
}) {
  const enabled = lines.filter(l => l.enabled);
  const rawLow = enabled.reduce((s, l) => s + l.lowK, 0);
  const rawHigh = enabled.reduce((s, l) => s + l.highK, 0);
  const totalLow = contingency ? Math.round(rawLow * 1.2) : rawLow;
  const totalHigh = contingency ? Math.round(rawHigh * 1.2) : rawHigh;

  // Category breakdown
  const categories = Object.keys(CATEGORY_META);
  const catData = categories.map(cat => {
    const catLines = lines.filter(l => l.category === cat && l.enabled);
    const lo = catLines.reduce((s, l) => s + l.lowK, 0);
    const hi = catLines.reduce((s, l) => s + l.highK, 0);
    return { cat, lo, hi, color: CATEGORY_META[cat]?.color ?? 'var(--text-2)' };
  }).filter(d => d.hi > 0);

  // Pathway comparison
  const pathwayComparison = SELECTOR_PATHWAYS.map(p => {
    const pLines = DEFAULT_BUDGET_LINES.filter(l => l.pathways.includes(p) && l.enabled);
    const lo = pLines.reduce((s, l) => s + l.lowK, 0);
    const hi = pLines.reduce((s, l) => s + l.highK, 0);
    return { p, lo, hi };
  });

  const maxHigh = Math.max(...pathwayComparison.map(d => d.hi), 1);

  return (
    <div style={{
      width: 280, flexShrink: 0,
      position: 'sticky', top: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Total range card */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line-strong)',
        borderRadius: 4, padding: '20px 18px',
      }}>
        <div style={{ ...monoLabel, marginBottom: 12, color: '#E8A852' }}>Total Estimated Range</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 800,
          color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-0.02em',
          marginBottom: 2,
        }}>
          {fmtK(totalLow)}
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-3)',
          marginBottom: 16,
        }}>
          to {fmtK(totalHigh)}
        </div>

        {/* Low / High cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Low Estimate', val: totalLow, col: '#52E8B4' },
            { label: 'High Estimate', val: totalHigh, col: '#E87252' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--surface-2)', borderRadius: 2, padding: '10px 12px',
              border: `1px solid ${item.col}22`,
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: item.col, lineHeight: 1, marginBottom: 4 }}>
                {fmtK(item.val)}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: '#E8A852', lineHeight: 1 }}>{enabled.length}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(232,168,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 3 }}>Line Items</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: '#E8A852', lineHeight: 1 }}>
              {PATHWAY_LABELS[pathway]}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(232,168,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 3 }}>Pathway</div>
          </div>
        </div>

        {/* Contingency toggle */}
        <button
          onClick={onToggleContingency}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 2,
            background: contingency ? 'rgba(232,168,82,0.09)' : 'var(--surface-2)',
            border: contingency ? '1px solid rgba(232,168,82,0.3)' : '1px solid var(--line)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: 2, flexShrink: 0,
            background: contingency ? '#E8A852' : 'transparent',
            border: contingency ? 'none' : '1px solid var(--line-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {contingency && <span style={{ color: '#131E2C', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
            color: contingency ? '#E8A852' : 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Add contingency (20%)</span>
        </button>
      </div>

      {/* Category breakdown */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 4, padding: '16px 18px',
      }}>
        <div style={{ ...monoLabel, marginBottom: 12 }}>By Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {catData.map(({ cat, lo, hi, color }) => {
            const pct = totalHigh > 0 ? hi / (contingency ? totalHigh / 1.2 : totalHigh) * 100 : 0;
            return (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1 }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)' }}>{fmtK(lo)}—{fmtK(hi)}</span>
                </div>
                <div style={{ height: 3, background: 'var(--line)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 1,
                    width: `${Math.min(pct, 100)}%`,
                    background: color.startsWith('#') ? color : 'rgba(214,233,248,0.5)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pathway comparison */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 4, padding: '16px 18px',
      }}>
        <div style={{ ...monoLabel, marginBottom: 12 }}>Pathway Comparison</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pathwayComparison.map(({ p, lo, hi }) => {
            const pMeta = PATHWAY_META[p];
            const isActive = p === pathway;
            const pct = hi / maxHigh * 100;
            return (
              <div key={p} style={{ opacity: isActive ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: isActive ? 700 : 400,
                    color: isActive ? pMeta.color : 'var(--text-4)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>{PATHWAY_LABELS[p]}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: isActive ? 'var(--text-2)' : 'var(--text-4)' }}>
                    {fmtK(lo)}—{fmtK(hi)}
                  </span>
                </div>
                <div style={{ height: 2, background: 'var(--line)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 1,
                    width: `${pct}%`,
                    background: pMeta.color,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export CSV */}
      <button
        onClick={onExportCSV}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 2,
          background: 'transparent',
          border: '1px solid var(--line)',
          cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
          color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          (e.target as HTMLButtonElement).style.borderColor = 'rgba(232,168,82,0.5)';
          (e.target as HTMLButtonElement).style.color = '#E8A852';
        }}
        onMouseLeave={e => {
          (e.target as HTMLButtonElement).style.borderColor = 'var(--line)';
          (e.target as HTMLButtonElement).style.color = 'var(--text-3)';
        }}
      >
        Export as CSV
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function BudgetEstimatorTab({ state, update }: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const statePathway = state.regulatory?.pathway ?? 'tbd';
  const defaultPathway: RegulatoryPathway =
    statePathway !== 'tbd' ? statePathway : '510k';

  const [activePathway, setActivePathway] = useState<RegulatoryPathway>(defaultPathway);
  const [contingency, setContingency] = useState(false);
  const [lines, setLines] = useState<BudgetLine[]>(() =>
    DEFAULT_BUDGET_LINES.map(l => ({ ...l }))
  );

  // Filter lines to current pathway
  const filteredLines = lines.filter(l => l.pathways.includes(activePathway));

  // Enabled sums
  const enabledLines = filteredLines.filter(l => l.enabled);
  const totalLow = enabledLines.reduce((s, l) => s + l.lowK, 0);
  const totalHigh = enabledLines.reduce((s, l) => s + l.highK, 0);
  const displayLow = contingency ? Math.round(totalLow * 1.2) : totalLow;
  const displayHigh = contingency ? Math.round(totalHigh * 1.2) : totalHigh;

  // Group filtered lines by category
  const categories = Array.from(new Set(filteredLines.map(l => l.category)));

  function toggleLine(id: string) {
    setLines(prev => prev.map(l =>
      l.id === id && !l.required ? { ...l, enabled: !l.enabled } : l
    ));
  }

  function changeLow(id: string, v: number) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, lowK: v } : l));
  }

  function changeHigh(id: string, v: number) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, highK: v } : l));
  }

  function exportCSV() {
    const header = 'Category,Label,Low ($K),High ($K),Enabled,Required,Note';
    const rows = filteredLines.map(l =>
      [
        `"${l.category}"`,
        `"${l.label}"`,
        l.lowK,
        l.highK,
        l.enabled ? 'Yes' : 'No',
        l.required ? 'Yes' : 'No',
        `"${l.note.replace(/"/g, '""')}"`,
      ].join(',')
    );
    const totalsSection = [
      '',
      `"TOTALS — ${PATHWAY_LABELS[activePathway]}",,${displayLow},${displayHigh},"${contingency ? 'Includes 20% contingency' : ''}"`,
    ];
    const csv = [header, ...rows, ...totalsSection].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-estimate-${activePathway}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Update state.regulatory.pathway when user selects a different pathway
  function selectPathway(p: RegulatoryPathway) {
    setActivePathway(p);
    if (p !== 'tbd' && state.regulatory.pathway !== p) {
      update({ ...state, regulatory: { ...state.regulatory, pathway: p } });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 28, minHeight: 164, flexShrink: 0 }}>
        <FlowCanvas accent="#E8A852" />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px' }}>
          <div style={{ ...monoLabel, color: '#E8A852', fontSize: 9, marginBottom: 10 }}>
            Development Budget Estimator
          </div>
          <h2 style={{
            margin: '0 0 8px', fontSize: 26, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15,
          }}>
            Development Budget Estimator
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 460 }}>
            Pathway-calibrated cost ranges for FDA clearance / approval
          </p>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Estimated Range', value: fmtKRange(displayLow, displayHigh) },
              { label: 'Line Items', value: enabledLines.length },
              { label: 'Pathway', value: PATHWAY_LABELS[activePathway] },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: '#E8A852', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(232,168,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pathway selector */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <div style={{ ...monoLabel, marginBottom: 10 }}>
          {statePathway === 'tbd' ? 'Select your regulatory pathway to calibrate estimates:' : 'Regulatory pathway:'}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SELECTOR_PATHWAYS.map(p => {
            const pMeta = PATHWAY_META[p];
            const isActive = activePathway === p;
            return (
              <button
                key={p}
                onClick={() => selectPathway(p)}
                style={{
                  padding: '7px 18px', borderRadius: 20,
                  background: isActive ? hexToRgbaStyle(pMeta.color, 0.14) : 'var(--surface-2)',
                  border: isActive ? `1px solid ${pMeta.color}66` : '1px solid var(--line)',
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? pMeta.color : 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  transition: 'all 0.15s',
                }}
              >
                {PATHWAY_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flex: 1, minHeight: 0 }}>

        {/* Left: line editor */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          {categories.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              lines={filteredLines.filter(l => l.category === cat)}
              onToggle={toggleLine}
              onChangeLow={changeLow}
              onChangeHigh={changeHigh}
            />
          ))}
        </div>

        {/* Right: summary panel */}
        <SummaryPanel
          lines={filteredLines}
          pathway={activePathway}
          contingency={contingency}
          onToggleContingency={() => setContingency(c => !c)}
          onExportCSV={exportCSV}
        />
      </div>
    </div>
  );
}
