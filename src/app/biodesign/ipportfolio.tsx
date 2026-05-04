'use client';
import { useState } from 'react';
import {
  BiodesignState, IPFiling, IPFilingType, IPFilingStatus, IPDeadline,
} from './data';

// ── Metadata ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<IPFilingType, { label: string; short: string; color: string; bg: string; desc: string }> = {
  provisional:    { label: 'Provisional Patent',  short: 'PRO', color: '#2D72D2', bg: 'rgba(45,114,210,0.12)',  desc: '12-month priority date placeholder' },
  utility:        { label: 'Utility Patent',       short: 'PAT', color: '#1e8f68', bg: 'rgba(30,143,104,0.12)', desc: 'Full non-provisional application' },
  pct:            { label: 'PCT Application',      short: 'PCT', color: '#7a4a9a', bg: 'rgba(122,74,154,0.12)', desc: 'International patent via Patent Cooperation Treaty' },
  trademark:      { label: 'Trademark',            short: 'TM',  color: '#9a7000', bg: 'rgba(154,112,0,0.12)',  desc: 'Word mark, logo, or trade dress' },
  copyright:      { label: 'Copyright',            short: '©',   color: '#7a5a2a', bg: 'rgba(122,90,42,0.12)',  desc: 'Software, design, documentation' },
  'trade-secret': { label: 'Trade Secret',         short: 'TS',  color: '#8a3030', bg: 'rgba(138,48,48,0.12)', desc: 'Proprietary processes and know-how' },
};

const STATUS_META: Record<IPFilingStatus, { label: string; color: string }> = {
  planned:    { label: 'Planned',    color: '#8a7d6e' },
  drafted:    { label: 'Drafted',    color: '#9a7000' },
  filed:      { label: 'Filed',      color: '#2D72D2' },
  pending:    { label: 'Pending',    color: '#2a7a9a' },
  published:  { label: 'Published',  color: '#6a4a9a' },
  allowed:    { label: 'Allowed',    color: '#2a8a50' },
  granted:    { label: 'Granted',    color: '#1e8f68' },
  registered: { label: 'Registered', color: '#1e8f68' },
  abandoned:  { label: 'Abandoned',  color: '#8a3030' },
  expired:    { label: 'Expired',    color: '#6a6060' },
};

const TYPE_STATUSES: Record<IPFilingType, IPFilingStatus[]> = {
  provisional:    ['planned', 'drafted', 'filed', 'abandoned'],
  utility:        ['planned', 'drafted', 'filed', 'pending', 'published', 'allowed', 'granted', 'abandoned', 'expired'],
  pct:            ['planned', 'drafted', 'filed', 'pending', 'published', 'abandoned'],
  trademark:      ['planned', 'filed', 'pending', 'published', 'registered', 'abandoned', 'expired'],
  copyright:      ['planned', 'filed', 'registered', 'abandoned'],
  'trade-secret': ['planned', 'filed', 'abandoned'],
};

const FILING_TYPES: IPFilingType[] = ['provisional', 'utility', 'pct', 'trademark', 'copyright', 'trade-secret'];

// ── Document section definitions ──────────────────────────────────────────────

interface DocSection {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  rows: number;
  maxWords?: number;
}

const DOC_SECTIONS: Record<IPFilingType, DocSection[]> = {
  provisional: [
    { key: 'field',       label: 'Field of Invention',          rows: 2, placeholder: 'This invention relates to the field of…' },
    { key: 'background',  label: 'Background of the Invention', rows: 4, placeholder: 'Conventional approaches suffer from the following limitations…' },
    { key: 'summary',     label: 'Summary of the Invention',    rows: 4, placeholder: 'The present invention provides a device/method/system for…' },
    { key: 'description', label: 'Detailed Description',        rows: 8, placeholder: 'In one embodiment of the present invention, the device comprises…' },
    { key: 'claims',      label: 'Informal Claims',             rows: 6, placeholder: 'What is claimed:\n1. A device comprising:\n   a) …\n   b) …',
      hint: 'Provisional claims are informal. They establish scope for the future non-provisional.' },
    { key: 'abstract',    label: 'Abstract',                    rows: 3, placeholder: 'A [device/system/method] for [purpose]. The invention includes…' },
  ],
  utility: [
    { key: 'field',       label: 'Field of Invention',                   rows: 2,  placeholder: 'This invention relates to…' },
    { key: 'background',  label: 'Background of the Invention',          rows: 4,  placeholder: 'Prior art and their limitations…' },
    { key: 'summary',     label: 'Summary of the Invention',             rows: 4,  placeholder: 'The present invention provides…' },
    { key: 'drawings',    label: 'Brief Description of the Drawings',    rows: 3,  placeholder: 'FIG. 1 is a perspective view of…\nFIG. 2 is a cross-sectional view showing…' },
    { key: 'description', label: 'Detailed Description of Embodiments',  rows: 10, placeholder: 'Referring now to FIG. 1, the device 100 comprises…' },
    { key: 'claims',      label: 'Claims',                               rows: 8,  placeholder: '1. A device comprising:\n   a) a first element configured to…\n   b) a second element…\n\n2. The device of claim 1, wherein…',
      hint: 'Independent claims define broad scope. Dependent claims add specificity. Consult a registered patent attorney.' },
    { key: 'abstract',    label: 'Abstract',                             rows: 3,  placeholder: 'A [device/system/method] comprising… addresses [problem] by [approach].' },
  ],
  pct: [
    { key: 'priority',    label: 'Priority Claim',       rows: 2,  placeholder: 'This application claims priority to U.S. Provisional Application No. XX/XXX,XXX, filed [DATE], incorporated herein by reference.' },
    { key: 'field',       label: 'Field of Invention',   rows: 2,  placeholder: 'This invention relates to…' },
    { key: 'background',  label: 'Background',           rows: 4,  placeholder: 'Prior art discussion…' },
    { key: 'summary',     label: 'Summary',              rows: 4,  placeholder: 'The present invention…' },
    { key: 'description', label: 'Detailed Description', rows: 8,  placeholder: 'Detailed embodiments…' },
    { key: 'claims',      label: 'Claims',               rows: 6,  placeholder: '1. A device comprising…' },
    { key: 'abstract',    label: 'Abstract',             rows: 3,  placeholder: 'A [device/system/method] for…', maxWords: 150,
      hint: 'PCT Abstract: 150 words maximum per Rule 8.' },
  ],
  trademark: [
    { key: 'markDesc',    label: 'Identification & Description of Mark',  rows: 2, placeholder: 'The mark consists of the word "AMBIENT" in standard characters.' },
    { key: 'goods',       label: 'Identification of Goods / Services',    rows: 4, placeholder: 'Medical devices for monitoring patient vital signs, in International Class 10.\nSoftware for healthcare data analytics, in International Class 42.' },
    { key: 'firstUse',    label: 'Date of First Use in Commerce',         rows: 2, placeholder: 'The mark was first used in commerce on [DATE] in connection with the goods/services identified above.' },
    { key: 'specimen',    label: 'Specimen Description',                  rows: 2, placeholder: 'Specimen is a screenshot of the applicant\'s website showing the mark in use in connection with the identified services.' },
    { key: 'declaration', label: 'Applicant Declaration (Notes)',         rows: 2, placeholder: 'The applicant believes itself to be the owner of the mark sought to be registered and that the mark is in use in commerce.' },
  ],
  copyright: [
    { key: 'workDesc',    label: 'Description of the Work',       rows: 3, placeholder: 'This work consists of [software source code / design files / documentation] created for [purpose].' },
    { key: 'authorship',  label: 'Statement of Authorship',       rows: 2, placeholder: 'This work was created by [Author/Organization] as [employee work / work made for hire / independent creation].' },
    { key: 'publication', label: 'First Publication / Disclosure', rows: 2, placeholder: 'This work was first published / disclosed on [DATE] via [method / channel].' },
    { key: 'scope',       label: 'Scope of Copyright Claim',      rows: 2, placeholder: 'The copyright claim covers: original source code, UI design files, and technical documentation comprising this work.' },
    { key: 'exclusions',  label: 'Material Excluded from Claim',  rows: 2, placeholder: 'This claim does not extend to: third-party libraries, standard algorithms, or non-copyrightable functional elements.' },
  ],
  'trade-secret': [
    { key: 'identification', label: 'Identification of Trade Secret',           rows: 3, placeholder: 'The trade secret consists of the following proprietary information: [algorithms, formulas, processes, designs, or compilations of information]…' },
    { key: 'value',          label: 'Commercial Value & Competitive Advantage', rows: 3, placeholder: 'This information derives independent economic value from not being generally known or readily ascertainable because…' },
    { key: 'protection',     label: 'Reasonable Protective Measures',          rows: 4, placeholder: 'Measures taken to maintain secrecy:\n(1) Non-disclosure agreements with all personnel having access\n(2) Access controls and role-based permissions\n(3) Encrypted storage and secure transmission' },
    { key: 'access',         label: 'Authorized Access List',                  rows: 3, placeholder: 'Access is restricted to:\n- [Name / Role]\n- [Name / Role]' },
    { key: 'disclosure',     label: 'Controlled Disclosure History',           rows: 2, placeholder: 'This information has been disclosed only to the following parties under binding NDA: [Party, Date, Purpose]' },
  ],
};

function buildDocumentText(filing: IPFiling, sections: DocSection[], ext: 'txt' | 'md'): string {
  const m = TYPE_META[filing.type];
  const doc = filing.document ?? {};
  const ismd = ext === 'md';
  const rule = ismd ? '\n---\n' : '\n' + '─'.repeat(60) + '\n';

  const lines: string[] = [];
  lines.push(ismd ? `# ${m.label}` : m.label.toUpperCase(), rule);

  const meta: [string, string][] = [];
  if (filing.title)               meta.push(['Title', filing.title]);
  if (filing.inventors)           meta.push(['Inventor(s) / Author(s)', filing.inventors]);
  if (filing.attorney)            meta.push(['Attorney / Agent', filing.attorney]);
  if (filing.applicationNumber)   meta.push(['Application No.', filing.applicationNumber]);
  if (filing.filingDate)          meta.push(['Filed', formatDate(filing.filingDate)]);
  if (filing.registrationNumber)  meta.push(['Registration No.', filing.registrationNumber]);
  if (filing.jurisdictions.length) meta.push(['Jurisdiction(s)', filing.jurisdictions.join(', ')]);
  meta.forEach(([k, v]) => lines.push(ismd ? `**${k}:** ${v}` : `${k}: ${v}`));
  lines.push(rule);

  sections.forEach(s => {
    lines.push(ismd ? `## ${s.label}` : s.label.toUpperCase(), '');
    lines.push((doc[s.key] ?? '').trim() || `[${s.label} — not yet drafted]`);
    lines.push('');
  });

  return lines.join('\n');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface AutoDeadline { label: string; date: string; critical: boolean }

function getAutoDeadlines(f: IPFiling): AutoDeadline[] {
  const list: AutoDeadline[] = [];
  if (f.type === 'provisional' && f.filingDate && f.status === 'filed') {
    list.push({ label: 'File non-provisional or PCT', date: addMonths(f.filingDate, 12), critical: true });
  }
  if (f.type === 'pct' && f.filingDate && f.status !== 'abandoned') {
    list.push({ label: 'National phase entry (30 mo.)', date: addMonths(f.filingDate, 30), critical: true });
    list.push({ label: 'ISR written opinion deadline', date: addMonths(f.filingDate, 16), critical: false });
  }
  if (f.type === 'trademark' && f.status === 'published' && f.filingDate) {
    list.push({ label: 'Opposition period ends', date: addMonths(f.filingDate, 1), critical: false });
  }
  return list;
}

function newFiling(type: IPFilingType): IPFiling {
  return {
    id: uid(), type, title: '', description: '',
    filingDate: '', applicationNumber: '', registrationNumber: '',
    inventors: '', attorney: '', status: 'planned',
    relatedFilingId: null, jurisdictions: [],
    niceClasses: '', markType: '', workType: '',
    deadlines: [], notes: '',
    createdAt: new Date().toISOString(),
  };
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, multiline = false, placeholder = '', inputType = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; inputType?: string;
}) {
  const base = {
    width: '100%', background: 'var(--surface-1)' as const, border: '1px solid var(--line)',
    borderRadius: 2, color: 'var(--text)' as const, fontSize: 12,
    fontFamily: 'var(--sans)', outline: 'none',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
            style={{ ...base, padding: '6px 9px', resize: 'vertical' }} />
        : <input type={inputType} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...base, height: 32, padding: '0 9px', colorScheme: inputType === 'date' ? 'dark' : undefined } as React.CSSProperties} />
      }
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
      <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</h2>
      {subtitle && <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );
}

function TypeBadge({ type }: { type: IPFilingType }) {
  const m = TYPE_META[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 3, fontSize: 10, fontWeight: 700,
      background: m.bg, color: m.color,
      fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>{m.short}</span>
  );
}

function StatusBadge({ status }: { status: IPFilingStatus }) {
  const m = STATUS_META[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 3, fontSize: 10, fontWeight: 600,
      background: m.color + '1a', color: m.color,
      fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>{m.label}</span>
  );
}

function DeadlineChip({
  label, date, critical, done, onToggle,
}: {
  label: string; date: string; critical: boolean; done?: boolean; onToggle?: () => void;
}) {
  const days = daysUntil(date);
  const overdue  = days !== null && days < 0;
  const urgent   = days !== null && days >= 0 && days <= 30;
  const soon     = days !== null && days > 30 && days <= 90;
  const color    = overdue || urgent ? '#c04040' : soon ? '#d9a020' : 'var(--text-3)';
  const bg       = overdue || urgent ? 'rgba(192,64,64,0.08)' : soon ? 'rgba(217,160,32,0.07)' : 'var(--surface-1)';

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        background: bg, border: `1px solid ${color}22`, borderRadius: 2,
        cursor: onToggle ? 'pointer' : 'default',
        opacity: done ? 0.45 : 1, flex: 1,
      }}
    >
      {onToggle && (
        <span style={{
          width: 13, height: 13, borderRadius: 2, flexShrink: 0,
          background: done ? '#3DCC91' : 'var(--surface-3)',
          border: `1px solid ${done ? '#3DCC91' : 'var(--line-strong)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, color: '#fff',
        }}>{done ? '✓' : ''}</span>
      )}
      {critical && !done && <span style={{ color, fontSize: 10, flexShrink: 0 }}>⚑</span>}
      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color, whiteSpace: 'nowrap' }}>
        {date ? formatDate(date) : '—'}
      </span>
      {days !== null && !done && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, padding: '1px 5px', borderRadius: 2,
          background: color + '22', color, whiteSpace: 'nowrap', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {overdue ? `${Math.abs(days)}d over` : days === 0 ? 'today' : `${days}d`}
        </span>
      )}
    </div>
  );
}

// ── Document Draft ────────────────────────────────────────────────────────────

function DocumentDraft({ filing, onChange }: {
  filing: IPFiling;
  onChange: (patch: Partial<IPFiling>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const sections = DOC_SECTIONS[filing.type];
  const doc = filing.document ?? {};

  function set(key: string, val: string) {
    onChange({ document: { ...doc, [key]: val } });
  }

  function download(ext: 'txt' | 'md') {
    const text = buildDocumentText(filing, sections, ext);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(filing.title || filing.type).replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyAll() {
    const text = buildDocumentText(filing, sections, 'md');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {/* Export controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
        <span style={{ flex: 1, fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Export document
        </span>
        <button onClick={copyAll}
          style={{ padding: '4px 11px', borderRadius: 2, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
            background: copied ? 'rgba(61,204,145,0.12)' : 'var(--surface-3)',
            color: copied ? '#3DCC91' : 'var(--text-3)',
            border: `1px solid ${copied ? '#3DCC9144' : 'var(--line)'}` }}>
          {copied ? '✓ Copied' : 'Copy .md'}
        </button>
        <button onClick={() => download('txt')}
          style={{ padding: '4px 11px', borderRadius: 2, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-3)', color: 'var(--text-3)', border: '1px solid var(--line)' }}>
          .txt
        </button>
        <button onClick={() => download('md')}
          style={{ padding: '4px 11px', borderRadius: 2, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-3)', color: 'var(--text-3)', border: '1px solid var(--line)' }}>
          .md
        </button>
      </div>

      {/* Document sections */}
      {sections.map(s => {
        const val = doc[s.key] ?? '';
        const wordCount = val.trim() ? val.trim().split(/\s+/).length : 0;
        const overLimit = s.maxWords !== undefined && wordCount > s.maxWords;
        return (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{s.label}</label>
              {s.maxWords !== undefined && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: overLimit ? '#c04040' : 'var(--text-4)' }}>
                  {wordCount} / {s.maxWords} words
                </span>
              )}
            </div>
            {s.hint && <p style={{ margin: '0 0 5px', fontSize: 10, color: 'var(--text-4)', fontStyle: 'italic', lineHeight: 1.4 }}>{s.hint}</p>}
            <textarea
              value={val}
              onChange={e => set(s.key, e.target.value)}
              placeholder={s.placeholder}
              rows={s.rows}
              style={{
                width: '100%', background: 'var(--surface-2)',
                border: `1px solid ${overLimit ? 'rgba(192,64,64,0.4)' : 'var(--line)'}`,
                borderRadius: 2, padding: '7px 9px', color: 'var(--text)', fontSize: 12,
                fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical', lineHeight: 1.7,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Filing Detail (expanded row) ──────────────────────────────────────────────

function FilingDetail({
  filing, allFilings, onChange, onDelete,
}: {
  filing: IPFiling;
  allFilings: IPFiling[];
  onChange: (patch: Partial<IPFiling>) => void;
  onDelete: () => void;
}) {
  const [addingDeadline, setAddingDeadline] = useState(false);
  const [dlDraft, setDlDraft] = useState({ label: '', date: '' });
  const [showDraft, setShowDraft] = useState(false);

  const typeMeta = TYPE_META[filing.type];
  const statuses = TYPE_STATUSES[filing.type];
  const autoDeadlines = getAutoDeadlines(filing);
  const otherFilings = allFilings.filter(f => f.id !== filing.id);

  function addDeadline() {
    if (!dlDraft.label || !dlDraft.date) return;
    onChange({ deadlines: [...filing.deadlines, { id: uid(), label: dlDraft.label, date: dlDraft.date, done: false }] });
    setDlDraft({ label: '', date: '' });
    setAddingDeadline(false);
  }

  const isPatent = filing.type === 'provisional' || filing.type === 'utility' || filing.type === 'pct';

  return (
    <div style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Title */}
      <Field label="Title" value={filing.title} onChange={v => onChange({ title: v })}
        placeholder={`${typeMeta.label} title…`} />

      {/* Status selector */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 7 }}>Status</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {statuses.map(s => {
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => onChange({ status: s })}
                style={{
                  padding: '3px 10px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: filing.status === s ? m.color + '1e' : 'transparent',
                  color: filing.status === s ? m.color : 'var(--text-4)',
                  border: `1px solid ${filing.status === s ? m.color + '44' : 'var(--line)'}`,
                }}>{m.label}</button>
            );
          })}
        </div>
      </div>

      {/* Core date + number fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Filing Date" value={filing.filingDate} onChange={v => onChange({ filingDate: v })} inputType="date" />
        <Field label={filing.type === 'trademark' ? 'Serial Number' : 'Application Number'}
          value={filing.applicationNumber} onChange={v => onChange({ applicationNumber: v })}
          placeholder={filing.type === 'utility' ? 'e.g. US18/123,456' : filing.type === 'pct' ? 'e.g. PCT/US2025/012345' : filing.type === 'trademark' ? 'e.g. 98765432' : 'App. number'} />
        {(filing.type === 'utility' || filing.type === 'trademark' || filing.type === 'copyright') && (
          <Field label={filing.type === 'utility' ? 'Patent Number' : 'Registration Number'}
            value={filing.registrationNumber} onChange={v => onChange({ registrationNumber: v })}
            placeholder={filing.type === 'utility' ? 'e.g. US12,345,678' : 'Reg. number when issued'} />
        )}
        {(isPatent || filing.type === 'trademark') && (
          <Field label="Attorney / Agent" value={filing.attorney} onChange={v => onChange({ attorney: v })} placeholder="Firm or individual" />
        )}
      </div>

      {/* Patent-specific fields */}
      {isPatent && (
        <Field label="Inventors" value={filing.inventors} onChange={v => onChange({ inventors: v })}
          placeholder="Full names, comma-separated" />
      )}

      {filing.type === 'pct' && (
        <Field label="Designated States / Regions"
          value={filing.jurisdictions.join(', ')}
          onChange={v => onChange({ jurisdictions: v.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="e.g. US, EP, JP, CN, CA, AU, KR" />
      )}

      {/* Description / abstract */}
      {(filing.type === 'provisional' || filing.type === 'utility' || filing.type === 'pct') && (
        <Field label="Abstract / Summary" value={filing.description} onChange={v => onChange({ description: v })}
          multiline placeholder="Brief description of the invention…" />
      )}

      {/* Trademark-specific */}
      {filing.type === 'trademark' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 6 }}>Mark Type</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['word', 'logo', 'trade-dress', 'sound'] as const).map(t => (
                  <button key={t} onClick={() => onChange({ markType: t })}
                    style={{
                      padding: '3px 9px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
                      background: filing.markType === t ? typeMeta.bg : 'var(--surface-1)',
                      color: filing.markType === t ? typeMeta.color : 'var(--text-3)',
                      border: `1px solid ${filing.markType === t ? typeMeta.color + '44' : 'var(--line)'}`,
                    }}>{t}</button>
                ))}
              </div>
            </div>
            <Field label="Nice Class(es)" value={filing.niceClasses} onChange={v => onChange({ niceClasses: v })} placeholder="e.g. 10, 42" />
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Goods / Services Description" value={filing.description} onChange={v => onChange({ description: v })}
                multiline placeholder="Describe the goods or services covered by this mark…" />
            </div>
            <Field label="Jurisdiction(s)" value={filing.jurisdictions.join(', ')}
              onChange={v => onChange({ jurisdictions: v.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="e.g. US, EU, CN" />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 6 }}>Filing Basis</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['ITU', 'Use-based'] as const).map(b => (
                  <button key={b} onClick={() => onChange({ workType: b })}
                    style={{
                      padding: '3px 9px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
                      background: filing.workType === b ? typeMeta.bg : 'var(--surface-1)',
                      color: filing.workType === b ? typeMeta.color : 'var(--text-3)',
                      border: `1px solid ${filing.workType === b ? typeMeta.color + '44' : 'var(--line)'}`,
                    }}>{b}</button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Copyright-specific */}
      {filing.type === 'copyright' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 6 }}>Type of Work</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['software', 'design', 'documentation', 'other'] as const).map(t => (
                <button key={t} onClick={() => onChange({ workType: t })}
                  style={{
                    padding: '3px 9px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
                    background: filing.workType === t ? typeMeta.bg : 'var(--surface-1)',
                    color: filing.workType === t ? typeMeta.color : 'var(--text-3)',
                    border: `1px solid ${filing.workType === t ? typeMeta.color + '44' : 'var(--line)'}`,
                  }}>{t}</button>
              ))}
            </div>
          </div>
          <Field label="Author(s)" value={filing.inventors} onChange={v => onChange({ inventors: v })} placeholder="Author or company" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Work Description" value={filing.description} onChange={v => onChange({ description: v })}
              multiline placeholder="Brief description of the copyrighted work…" />
          </div>
        </div>
      )}

      {/* Trade secret-specific */}
      {filing.type === 'trade-secret' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Custodian / Owner" value={filing.inventors} onChange={v => onChange({ inventors: v })} placeholder="Person or team" />
          <Field label="Protection Measures" value={filing.attorney} onChange={v => onChange({ attorney: v })} placeholder="NDA, access controls, encryption…" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Description" value={filing.description} onChange={v => onChange({ description: v })}
              multiline placeholder="What proprietary knowledge or process does this cover?" />
          </div>
        </div>
      )}

      {/* Related filing */}
      {otherFilings.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 6 }}>Related Filing</div>
          <select value={filing.relatedFilingId ?? ''}
            onChange={e => onChange({ relatedFilingId: e.target.value || null })}
            style={{ width: '100%', height: 32, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }}>
            <option value="">— None —</option>
            {otherFilings.map(f => (
              <option key={f.id} value={f.id}>{TYPE_META[f.type].short} · {f.title || 'Untitled'}</option>
            ))}
          </select>
          {filing.relatedFilingId && (() => {
            const rel = otherFilings.find(f => f.id === filing.relatedFilingId);
            if (!rel) return null;
            const hints: Record<string, string> = {
              provisional: 'Provisional → this utility/PCT relationship sets the priority date.',
              pct: 'PCT filing claims priority from the related provisional.',
              utility: 'Non-provisional converted from related provisional.',
            };
            return rel && hints[rel.type]
              ? <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic' }}>{hints[rel.type]}</p>
              : null;
          })()}
        </div>
      )}

      {/* Deadlines */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Deadlines</div>

        {autoDeadlines.length === 0 && filing.deadlines.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic', margin: '0 0 6px' }}>
            {filing.type === 'provisional' && filing.status !== 'filed' ? 'Set status to "Filed" + add a filing date to see the 12-month conversion deadline.' : 'No deadlines yet.'}
          </p>
        )}

        {autoDeadlines.map((dl, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <DeadlineChip label={dl.label} date={dl.date} critical={dl.critical} />
          </div>
        ))}

        {filing.deadlines.map(dl => (
          <div key={dl.id} style={{ marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
            <DeadlineChip label={dl.label} date={dl.date} critical={false} done={dl.done}
              onToggle={() => onChange({ deadlines: filing.deadlines.map(d => d.id === dl.id ? { ...d, done: !d.done } : d) })} />
            <button onClick={() => onChange({ deadlines: filing.deadlines.filter(d => d.id !== dl.id) })}
              style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0 }}>×</button>
          </div>
        ))}

        {addingDeadline ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 6, alignItems: 'end', marginTop: 6 }}>
            <input value={dlDraft.label} onChange={e => setDlDraft(d => ({ ...d, label: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addDeadline()}
              placeholder="Deadline label…"
              style={{ height: 32, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
            <input type="date" value={dlDraft.date} onChange={e => setDlDraft(d => ({ ...d, date: e.target.value }))}
              style={{ height: 32, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 8px', color: 'var(--text)', fontSize: 12, outline: 'none', colorScheme: 'dark' } as React.CSSProperties} />
            <button onClick={addDeadline}
              style={{ height: 32, padding: '0 12px', borderRadius: 2, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Add</button>
            <button onClick={() => { setAddingDeadline(false); setDlDraft({ label: '', date: '' }); }}
              style={{ height: 32, padding: '0 10px', borderRadius: 2, background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 12 }}>×</button>
          </div>
        ) : (
          <button onClick={() => setAddingDeadline(true)}
            style={{ marginTop: 6, fontSize: 10, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            + Add deadline
          </button>
        )}
      </div>

      {/* Document Draft — toggle */}
      <div>
        <button
          onClick={() => setShowDraft(d => !d)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '9px 12px', borderRadius: 2, cursor: 'pointer',
            background: showDraft ? typeMeta.bg : 'var(--surface-1)',
            border: `1px solid ${showDraft ? typeMeta.color + '33' : 'var(--line)'}`,
            borderLeft: `3px solid ${typeMeta.color}`,
          }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: typeMeta.color, textTransform: 'uppercase', letterSpacing: '0.12em', flex: 1, textAlign: 'left' }}>
            ✎ Draft {typeMeta.label} Document
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: typeMeta.color }}>{showDraft ? '▲ close' : '▼ open'}</span>
        </button>
        {showDraft && (
          <div style={{ padding: '14px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 2px 2px' }}>
            <DocumentDraft filing={filing} onChange={onChange} />
          </div>
        )}
      </div>

      <Field label="Notes" value={filing.notes} onChange={v => onChange({ notes: v })}
        multiline placeholder="Prosecution history, strategy notes, claim scope, examiner name, open items…" />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onDelete}
          style={{ padding: '5px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export function IPPortfolioTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<IPFilingType | 'all'>('all');

  const filings = state.ipFilings ?? [];

  function addFiling(type: IPFilingType) {
    const f = newFiling(type);
    update({ ...state, ipFilings: [...filings, f] });
    setExpanded(f.id);
  }

  function updateFiling(id: string, patch: Partial<IPFiling>) {
    update({ ...state, ipFilings: filings.map(f => f.id === id ? { ...f, ...patch } : f) });
  }

  function deleteFiling(id: string) {
    update({ ...state, ipFilings: filings.filter(f => f.id !== id) });
    if (expanded === id) setExpanded(null);
  }

  // Aggregate upcoming deadlines across all filings
  interface UpcomingEntry { label: string; date: string; critical: boolean; filingTitle: string; filingType: IPFilingType; days: number }
  const upcoming: UpcomingEntry[] = [];
  filings.forEach(f => {
    getAutoDeadlines(f).forEach(dl => {
      const days = daysUntil(dl.date);
      if (days !== null && days >= 0 && days <= 90)
        upcoming.push({ ...dl, filingTitle: f.title || TYPE_META[f.type].label, filingType: f.type, days });
    });
    f.deadlines.filter(dl => !dl.done).forEach(dl => {
      const days = daysUntil(dl.date);
      if (days !== null && days >= 0 && days <= 90)
        upcoming.push({ label: dl.label, date: dl.date, critical: false, filingTitle: f.title || TYPE_META[f.type].label, filingType: f.type, days });
    });
  });
  upcoming.sort((a, b) => a.days - b.days);

  const filtered = filterType === 'all' ? filings : filings.filter(f => f.type === filterType);

  return (
    <div>
      <SectionHeader
        title="IP Portfolio"
        subtitle="Track provisional patents, utility patents, PCT, trademarks, copyrights, and trade secrets. Deadlines auto-computed from filing dates."
      />

      {/* Stats / type filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, marginBottom: 20 }}>
        {FILING_TYPES.map(t => {
          const m = TYPE_META[t];
          const count = filings.filter(f => f.type === t).length;
          const active = filterType === t;
          return (
            <button key={t} onClick={() => setFilterType(active ? 'all' : t)}
              style={{
                padding: '10px 6px', borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                background: active ? m.bg : 'var(--surface-1)',
                border: `1px solid ${active ? m.color + '55' : 'var(--line)'}`,
              }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? m.color : 'var(--text-4)' }}>{count}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: active ? m.color : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{m.short}</div>
            </button>
          );
        })}
      </div>

      {/* Upcoming deadline alert strip */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(192,64,64,0.06)', border: '1px solid rgba(192,64,64,0.22)', borderRadius: 2 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#c04040', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 10 }}>
            ⚑ Upcoming — Next 90 Days
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {upcoming.map((dl, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TypeBadge type={dl.filingType} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{dl.filingTitle}</span>
                <DeadlineChip label={dl.label} date={dl.date} critical={dl.critical} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filing rows */}
      {filtered.map(f => {
        const m = TYPE_META[f.type];
        const isOpen = expanded === f.id;

        const urgentCount = (() => {
          let n = 0;
          getAutoDeadlines(f).forEach(dl => { const d = daysUntil(dl.date); if (d !== null && d >= 0 && d <= 30) n++; });
          f.deadlines.filter(dl => !dl.done).forEach(dl => { const d = daysUntil(dl.date); if (d !== null && d >= 0 && d <= 30) n++; });
          return n;
        })();

        const relatedFiling = f.relatedFilingId ? filings.find(x => x.id === f.relatedFilingId) : null;

        return (
          <div key={f.id} style={{
            background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2,
            marginBottom: 5, overflow: 'hidden',
            borderLeft: `3px solid ${m.color}`,
          }}>
            <div onClick={() => setExpanded(isOpen ? null : f.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}>
              <TypeBadge type={f.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: f.title ? 'var(--text)' : 'var(--text-4)', fontStyle: f.title ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.title || `Untitled ${m.label}`}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 2, fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
                  {f.applicationNumber && <span>{f.applicationNumber}</span>}
                  {f.filingDate && <span>{formatDate(f.filingDate)}</span>}
                  {f.inventors && <span>{f.inventors.split(',')[0].trim()}{f.inventors.includes(',') ? ' et al.' : ''}</span>}
                  {relatedFiling && <span style={{ color: 'var(--text-3)' }}>→ {TYPE_META[relatedFiling.type].short} {relatedFiling.title || 'related'}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {urgentCount > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 2, background: 'rgba(192,64,64,0.14)', color: '#c04040', fontWeight: 700 }}>
                    ⚑ {urgentCount}
                  </span>
                )}
                <StatusBadge status={f.status} />
                <span style={{ color: 'var(--text-4)', fontSize: 12, fontFamily: 'var(--mono)' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <FilingDetail
                filing={f}
                allFilings={filings}
                onChange={patch => updateFiling(f.id, patch)}
                onDelete={() => deleteFiling(f.id)}
              />
            )}
          </div>
        );
      })}

      {filtered.length === 0 && filings.length > 0 && (
        <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 2, marginBottom: 12, color: 'var(--text-4)', fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No filings match the selected type.
        </div>
      )}

      {/* Add filing */}
      <div style={{ marginTop: filings.length > 0 ? 16 : 0 }}>
        {filings.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 2, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>No IP filings yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5 }}>Add a filing below to start tracking your IP portfolio and deadlines.</div>
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Add filing</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {FILING_TYPES.map(t => {
            const m = TYPE_META[t];
            return (
              <button key={t} onClick={() => addFiling(t)}
                style={{
                  padding: '10px 12px', borderRadius: 2, cursor: 'pointer', textAlign: 'left',
                  background: 'var(--surface-1)', border: '1px solid var(--line)',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = m.color + '66')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: m.color }}>{m.short} — {m.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-4)', lineHeight: 1.3 }}>{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
