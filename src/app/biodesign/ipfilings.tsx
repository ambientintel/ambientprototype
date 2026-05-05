'use client';
import { useState } from 'react';
import { BiodesignState, IPFiling, IPFilingType, IPFilingStatus, IPDeadline } from './data';
import { AiDraftButton } from './aiassist';
import { FlowCanvas } from './flowbg';

function uid() { return Math.random().toString(36).slice(2, 9); }

const TYPE_META: Record<IPFilingType, { label: string; color: string; short: string }> = {
  provisional:   { label: 'Provisional Patent',  color: '#52C0E8', short: 'PROV' },
  utility:       { label: 'Utility Patent',       color: '#9b72cf', short: 'UTIL' },
  pct:           { label: 'PCT Application',      color: '#5a8ac4', short: 'PCT'  },
  trademark:     { label: 'Trademark',            color: '#e87d40', short: 'TM'   },
  copyright:     { label: 'Copyright',            color: '#d9a020', short: '©'    },
  'trade-secret': { label: 'Trade Secret',        color: '#3DCC91', short: 'TS'   },
};

const STATUS_META: Record<IPFilingStatus, { label: string; color: string; bg: string }> = {
  planned:    { label: 'Planned',    color: '#8a9fa8', bg: 'rgba(138,159,168,0.12)' },
  drafted:    { label: 'Drafted',    color: '#d9a020', bg: 'rgba(217,160,32,0.12)'  },
  filed:      { label: 'Filed',      color: '#52C0E8', bg: 'rgba(82,192,232,0.12)'  },
  pending:    { label: 'Pending',    color: '#5a8ac4', bg: 'rgba(90,138,196,0.12)'  },
  published:  { label: 'Published',  color: '#9b72cf', bg: 'rgba(155,114,207,0.12)' },
  allowed:    { label: 'Allowed',    color: '#c0a840', bg: 'rgba(192,168,64,0.12)'  },
  granted:    { label: 'Granted',    color: '#3DCC91', bg: 'rgba(61,204,145,0.12)'  },
  registered: { label: 'Registered', color: '#3DCC91', bg: 'rgba(61,204,145,0.12)'  },
  abandoned:  { label: 'Abandoned',  color: '#c04040', bg: 'rgba(192,64,64,0.12)'   },
  expired:    { label: 'Expired',    color: '#5a5a5a', bg: 'rgba(90,90,90,0.12)'    },
};

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function deadlineUrgency(dateStr: string): { color: string; label: string } | null {
  if (!dateStr) return null;
  const d = daysUntil(dateStr);
  if (d < 0)   return { color: '#c04040', label: 'OVERDUE' };
  if (d <= 14) return { color: '#c04040', label: `${d}d` };
  if (d <= 60) return { color: '#d9a020', label: `${d}d` };
  if (d <= 90) return { color: '#52C0E8', label: `${d}d` };
  return null;
}

export function IPFilingsTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<IPFiling>>({ type: 'provisional', status: 'planned', deadlines: [], jurisdictions: [] });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<IPFilingType | 'all'>('all');
  const [deadlineDraft, setDeadlineDraft] = useState({ label: '', date: '' });
  const [showDeadlines, setShowDeadlines] = useState(false);

  const filings = state.ipFilings ?? [];

  function saveFiling() {
    if (!draft.title) return;
    const existing = filings.find(f => f.id === editId);
    const f: IPFiling = {
      id: editId ?? uid(),
      type: (draft.type as IPFilingType) ?? 'provisional',
      title: draft.title!,
      description: draft.description ?? '',
      filingDate: draft.filingDate ?? '',
      applicationNumber: draft.applicationNumber ?? '',
      registrationNumber: draft.registrationNumber ?? '',
      inventors: draft.inventors ?? '',
      attorney: draft.attorney ?? '',
      status: (draft.status as IPFilingStatus) ?? 'planned',
      relatedFilingId: draft.relatedFilingId ?? null,
      jurisdictions: draft.jurisdictions ?? [],
      niceClasses: draft.niceClasses ?? '',
      markType: draft.markType ?? '',
      workType: draft.workType ?? '',
      deadlines: draft.deadlines ?? [],
      notes: draft.notes ?? '',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (editId) {
      update({ ...state, ipFilings: filings.map(x => x.id === editId ? f : x) });
      setEditId(null);
    } else {
      update({ ...state, ipFilings: [...filings, f] });
    }
    setDraft({ type: 'provisional', status: 'planned', deadlines: [], jurisdictions: [] });
    setAdding(false);
  }

  function startEdit(f: IPFiling) {
    setDraft({ ...f });
    setEditId(f.id);
    setExpanded(null);
    setAdding(true);
  }

  function addDeadline() {
    if (!deadlineDraft.label || !deadlineDraft.date) return;
    const d: IPDeadline = { id: uid(), label: deadlineDraft.label, date: deadlineDraft.date, done: false };
    setDraft(x => ({ ...x, deadlines: [...(x.deadlines ?? []), d] }));
    setDeadlineDraft({ label: '', date: '' });
  }

  function toggleDeadlineDone(id: string) {
    setDraft(x => ({ ...x, deadlines: (x.deadlines ?? []).map(d => d.id === id ? { ...d, done: !d.done } : d) }));
  }

  function toggleDeadlineDoneGlobal(filingId: string, deadlineId: string) {
    update({
      ...state,
      ipFilings: (state.ipFilings ?? []).map(f =>
        f.id === filingId
          ? { ...f, deadlines: f.deadlines.map(d => d.id === deadlineId ? { ...d, done: !d.done } : d) }
          : f
      ),
    });
  }

  // Deadlines across all filings, not done, sorted
  const allDeadlines = filings
    .flatMap(f => (f.deadlines ?? []).filter(d => !d.done).map(d => ({ ...d, filingTitle: f.title, filingType: f.type })))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    .slice(0, 8);

  const filtered = filings.filter(f => filterType === 'all' || f.type === filterType);
  const types: IPFilingType[] = ['provisional', 'utility', 'pct', 'trademark', 'copyright', 'trade-secret'];
  const statuses: IPFilingStatus[] = ['planned', 'drafted', 'filed', 'pending', 'published', 'allowed', 'granted', 'registered', 'abandoned', 'expired'];

  const isPatent = (t: IPFilingType) => t === 'provisional' || t === 'utility' || t === 'pct';
  const draftType = (draft.type as IPFilingType) ?? 'provisional';

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
    borderRadius: 2, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--sans)', outline: 'none',
  };

  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, marginBottom: 24, height: 114 }}>
        <FlowCanvas accent="#52E8B4" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)' }} />
        <div style={{ position: 'relative', padding: '22px 28px' }}>
          <div style={{ fontSize: 9, color: '#52E8B4', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--mono)', marginBottom: 8 }}>03 / Implement · IP</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>IP Portfolio</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>Patent filings, trademarks, and prosecution deadlines.</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 20 }}>
        {types.map(t => {
          const count = filings.filter(f => f.type === t).length;
          const meta = TYPE_META[t];
          return (
            <div key={t} style={{ padding: '8px 10px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer' }}
              onClick={() => setFilterType(filterType === t ? 'all' : t)}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: count > 0 ? meta.color : 'var(--text-4)' }}>{count}</div>
              <div style={{ fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginTop: 2 }}>{meta.short}</div>
            </div>
          );
        })}
      </div>

      {/* Upcoming deadlines */}
      {allDeadlines.length > 0 && (
        <div style={{ marginBottom: 20, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 10 }}>Upcoming Deadlines</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allDeadlines.map(d => {
              const urg = deadlineUrgency(d.date);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 10, marginRight: 6 }}>{TYPE_META[d.filingType].short}</span>
                    {d.label}
                    <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 6 }}>— {d.filingTitle}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{d.date}</span>
                    {urg && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: urg.color + '20', color: urg.color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{urg.label}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['filings', 'deadlines'] as const).map(m => (
          <button key={m} onClick={() => setShowDeadlines(m === 'deadlines')} style={{
            padding: '4px 14px', borderRadius: 20, fontSize: 10, cursor: 'pointer',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
            background: (showDeadlines ? m === 'deadlines' : m === 'filings') ? 'rgba(82,232,180,0.10)' : 'transparent',
            color: (showDeadlines ? m === 'deadlines' : m === 'filings') ? '#52E8B4' : 'var(--text-4)',
            border: (showDeadlines ? m === 'deadlines' : m === 'filings') ? '1px solid rgba(82,232,180,0.25)' : '1px solid var(--line)',
          }}>{m}</button>
        ))}
      </div>

      {showDeadlines ? (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allDeadlinesAll = filings
          .flatMap(f => (f.deadlines ?? []).map(d => ({
            ...d,
            filingTitle: f.title || f.type,
            filingType: f.type,
            filingId: f.id,
          })))
          .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

        const groups = {
          overdue:  allDeadlinesAll.filter(d => !d.done && d.date && new Date(d.date) < today),
          soon:     allDeadlinesAll.filter(d => !d.done && d.date && new Date(d.date) >= today && new Date(d.date) <= new Date(today.getTime() + 30 * 86400000)),
          upcoming: allDeadlinesAll.filter(d => !d.done && d.date && new Date(d.date) > new Date(today.getTime() + 30 * 86400000) && new Date(d.date) <= new Date(today.getTime() + 90 * 86400000)),
          later:    allDeadlinesAll.filter(d => !d.done && d.date && new Date(d.date) > new Date(today.getTime() + 90 * 86400000)),
          done:     allDeadlinesAll.filter(d => d.done),
          nodates:  allDeadlinesAll.filter(d => !d.date),
        };

        const groupDefs: { key: keyof typeof groups; label: string; color: string }[] = [
          { key: 'overdue',  label: 'Overdue',          color: '#E87252' },
          { key: 'soon',     label: 'Due Soon',         color: '#E8A852' },
          { key: 'upcoming', label: 'Upcoming (30-90d)', color: '#52C0E8' },
          { key: 'later',    label: 'Later',             color: 'var(--text-4)' },
          { key: 'done',     label: 'Done',              color: 'var(--text-4)' },
          { key: 'nodates',  label: 'No Date',           color: 'var(--text-4)' },
        ];

        return (
          <div>
            {/* Summary bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[
                { label: 'Overdue',  count: groups.overdue.length,  color: '#E87252' },
                { label: 'Due Soon', count: groups.soon.length,     color: '#E8A852' },
                { label: 'Upcoming', count: groups.upcoming.length, color: '#52C0E8' },
                { label: 'Done',     count: groups.done.length,     color: 'var(--text-4)' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, padding: '8px 10px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: count > 0 ? color : 'var(--text-4)' }}>{count}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {allDeadlinesAll.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
                No deadlines added yet. Open a filing to add prosecution deadlines.
              </div>
            ) : (
              groupDefs.map(({ key, label, color }) => {
                const group = groups[key];
                if (group.length === 0) return null;
                return (
                  <div key={key}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color, textTransform: 'uppercase', letterSpacing: '0.14em', padding: '12px 0 6px' }}>
                      {label} ({group.length})
                    </div>
                    {group.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, marginBottom: 4 }}>
                        <button
                          onClick={() => toggleDeadlineDoneGlobal(item.filingId, item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.done ? '#3DCC91' : 'var(--text-4)', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
                        >
                          {item.done ? '✓' : '○'}
                        </button>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color, width: 72, flexShrink: 0 }}>
                          {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                        </span>
                        <span style={{ flex: 1, fontSize: 12, color: item.done ? 'var(--text-4)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-4)', padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 2, flexShrink: 0, textTransform: 'uppercase' }}>
                          {item.filingTitle.slice(0, 18)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        );
      })() : (
      <>
      {/* Type filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all', ...types] as const).map(t => {
          const meta = t !== 'all' ? TYPE_META[t] : null;
          const active = filterType === t;
          return (
            <button key={t} onClick={() => setFilterType(t as typeof filterType)}
              style={{
                padding: '4px 10px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: active ? (meta ? meta.color + '20' : 'var(--surface-3)') : 'transparent',
                color: active ? (meta ? meta.color : 'var(--text-2)') : 'var(--text-4)',
                border: `1px solid ${active ? (meta ? meta.color + '55' : 'var(--line-strong)') : 'var(--line)'}`,
              }}>{t === 'all' ? 'All' : TYPE_META[t].label}</button>
          );
        })}
      </div>

      {/* Filing list */}
      {filtered.length === 0 && !adding && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No IP filings yet
        </div>
      )}

      {filtered.map(f => {
        const tm = TYPE_META[f.type];
        const sm = STATUS_META[f.status];
        const isOpen = expanded === f.id;
        const pendingDeadlines = (f.deadlines ?? []).filter(d => !d.done && d.date);
        const urgentDl = pendingDeadlines.map(d => ({ ...d, urgency: deadlineUrgency(d.date) })).filter(d => d.urgency).sort((a, b) => (a.date).localeCompare(b.date))[0];
        return (
          <div key={f.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, marginBottom: 6 }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : f.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: tm.color + '20', color: tm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tm.short}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sm.label}</span>
                  {urgentDl && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: urgentDl.urgency!.color + '20', color: urgentDl.urgency!.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {urgentDl.label} · {urgentDl.urgency!.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', flexWrap: 'wrap' }}>
                  {f.applicationNumber && <span>{f.applicationNumber}</span>}
                  {f.filingDate && <span>Filed: {f.filingDate}</span>}
                  {f.inventors && <span>{f.inventors.split(',')[0].trim()}{f.inventors.includes(',') ? ' et al.' : ''}</span>}
                  {f.jurisdictions?.length > 0 && <span>{f.jurisdictions.join(', ')}</span>}
                </div>
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 14, fontFamily: 'var(--mono)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--line)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {f.description && (
                  <div>
                    <LabelSm>Description</LabelSm>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.description}</div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {f.applicationNumber && <KVSm label="Application #">{f.applicationNumber}</KVSm>}
                  {f.registrationNumber && <KVSm label="Registration #">{f.registrationNumber}</KVSm>}
                  {f.filingDate && <KVSm label="Filing Date">{f.filingDate}</KVSm>}
                  {f.inventors && <KVSm label="Inventors">{f.inventors}</KVSm>}
                  {f.attorney && <KVSm label="Attorney / Agent">{f.attorney}</KVSm>}
                  {f.jurisdictions?.length > 0 && <KVSm label="Jurisdictions">{f.jurisdictions.join(', ')}</KVSm>}
                  {f.niceClasses && <KVSm label="Nice Classes">{f.niceClasses}</KVSm>}
                  {f.markType && <KVSm label="Mark Type">{f.markType}</KVSm>}
                  {f.workType && <KVSm label="Work Type">{f.workType}</KVSm>}
                </div>
                {/* Deadlines */}
                {(f.deadlines ?? []).length > 0 && (
                  <div>
                    <LabelSm>Prosecution Deadlines</LabelSm>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {f.deadlines.map(d => {
                        const urg = deadlineUrgency(d.date);
                        return (
                          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: d.done ? 0.45 : 1 }}>
                            <input type="checkbox" checked={d.done} readOnly style={{ accentColor: '#3DCC91', cursor: 'default' }} />
                            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', textDecoration: d.done ? 'line-through' : 'none' }}>{d.label}</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{d.date}</span>
                            {urg && !d.done && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px', borderRadius: 3, background: urg.color + '20', color: urg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{urg.label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {f.notes && (
                  <div>
                    <LabelSm>Notes</LabelSm>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.notes}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(f)} style={{ padding: '5px 12px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Edit</button>
                  <button onClick={() => update({ ...state, ipFilings: filings.filter(x => x.id !== f.id) })}
                    style={{ padding: '5px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>Remove</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add / Edit form */}
      {adding ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: 20, marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 16 }}>{editId ? 'Edit Filing' : 'New IP Filing'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Filing Type</label>
              <select value={draftType} onChange={e => setDraft(d => ({ ...d, type: e.target.value as IPFilingType }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                {types.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={draft.status ?? 'planned'} onChange={e => setDraft(d => ({ ...d, status: e.target.value as IPFilingStatus }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                {statuses.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Title</label>
              <input value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder={isPatent(draftType) ? 'Apparatus and method for…' : draftType === 'trademark' ? 'Mark name / wordmark' : 'Copyright or trade secret title'} style={{ ...inputStyle, height: 36 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description of the IP…" />
            </div>
            {isPatent(draftType) && (<>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Application Number</label>
                <input value={draft.applicationNumber ?? ''} onChange={e => setDraft(d => ({ ...d, applicationNumber: e.target.value }))} placeholder="e.g. 18/123,456" style={{ ...inputStyle, height: 36 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Filing Date</label>
                <input type="date" value={draft.filingDate ?? ''} onChange={e => setDraft(d => ({ ...d, filingDate: e.target.value }))} style={{ ...inputStyle, height: 36 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Inventors</label>
                <input value={draft.inventors ?? ''} onChange={e => setDraft(d => ({ ...d, inventors: e.target.value }))} placeholder="First Last, First Last…" style={{ ...inputStyle, height: 36 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Jurisdictions</label>
                <input value={draft.jurisdictions?.join(', ') ?? ''} onChange={e => setDraft(d => ({ ...d, jurisdictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="US, EP, JP, CN…" style={{ ...inputStyle, height: 36 }} />
              </div>
            </>)}
            {draftType === 'trademark' && (<>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Mark Type</label>
                <input value={draft.markType ?? ''} onChange={e => setDraft(d => ({ ...d, markType: e.target.value }))} placeholder="Wordmark, Design mark, Sound…" style={{ ...inputStyle, height: 36 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Nice Classes</label>
                <input value={draft.niceClasses ?? ''} onChange={e => setDraft(d => ({ ...d, niceClasses: e.target.value }))} placeholder="e.g. 10, 44" style={{ ...inputStyle, height: 36 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Registration Number</label>
                <input value={draft.registrationNumber ?? ''} onChange={e => setDraft(d => ({ ...d, registrationNumber: e.target.value }))} placeholder="If registered" style={{ ...inputStyle, height: 36 }} />
              </div>
            </>)}
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Attorney / Agent</label>
              <input value={draft.attorney ?? ''} onChange={e => setDraft(d => ({ ...d, attorney: e.target.value }))} placeholder="Firm or attorney name" style={{ ...inputStyle, height: 36 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Claims summary, prosecution notes, strategy…" />
            </div>
          </div>

          {/* AI assist for patent description */}
          {isPatent(draftType) && (
            <div style={{ marginBottom: 14 }}>
              <AiDraftButton
                type="ip-filing"
                context={{ type: draftType, title: draft.title ?? '', indication: state.indication, description: draft.description ?? '' }}
                onResult={r => setDraft(d => ({ ...d, description: r.field ? `Field: ${r.field}\n\nBackground: ${r.background ?? ''}\n\nSummary: ${r.summary ?? ''}` : d.description, notes: r.claims_preview ? `Claims preview: ${r.claims_preview}` : d.notes }))}
                label="Draft patent sections"
              />
            </div>
          )}

          {/* Deadlines */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 8 }}>Prosecution Deadlines</label>
            {(draft.deadlines ?? []).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <input type="checkbox" checked={d.done} onChange={() => toggleDeadlineDone(d.id)} style={{ accentColor: '#3DCC91' }} />
                <span style={{ flex: 1, fontSize: 12, color: d.done ? 'var(--text-4)' : 'var(--text-2)', textDecoration: d.done ? 'line-through' : 'none' }}>{d.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{d.date}</span>
                <button onClick={() => setDraft(x => ({ ...x, deadlines: (x.deadlines ?? []).filter(x => x.id !== d.id) }))} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={deadlineDraft.label} onChange={e => setDeadlineDraft(d => ({ ...d, label: e.target.value }))} placeholder="Deadline label" style={{ flex: 1, ...inputStyle, height: 32, fontSize: 12 }} />
              <input type="date" value={deadlineDraft.date} onChange={e => setDeadlineDraft(d => ({ ...d, date: e.target.value }))} style={{ width: 140, ...inputStyle, height: 32, fontSize: 12 }} />
              <button onClick={addDeadline} style={{ padding: '0 12px', height: 32, borderRadius: 2, background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 12 }}>Add</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveFiling} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>{editId ? 'Save Changes' : 'Add Filing'}</button>
            <button onClick={() => { setAdding(false); setEditId(null); setDraft({ type: 'provisional', status: 'planned', deadlines: [], jurisdictions: [] }); }}
              style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          + Add IP filing
        </button>
      )}
      </>
      )}
    </div>
  );
}

function LabelSm({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 5 }}>{children}</div>;
}

function KVSm({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <LabelSm>{label}</LabelSm>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{children}</div>
    </div>
  );
}
