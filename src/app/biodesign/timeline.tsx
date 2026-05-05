'use client';
import { useState } from 'react';
import { FlowCanvas } from './flowbg';
import { BiodesignState, Milestone, MilestoneCategory, MilestoneStatus } from './data';

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  regulatory:    '#52C0E8',
  clinical:      '#3DCC91',
  reimbursement: '#d9a020',
  ip:            '#9b72cf',
  commercial:    '#e87d40',
  manufacturing: '#5a8ac4',
  operational:   '#8a9fa8',
};

const STATUS_META: Record<MilestoneStatus, { label: string; color: string; bg: string }> = {
  upcoming:      { label: 'Upcoming',    color: '#8a9fa8', bg: 'rgba(138,159,168,0.12)' },
  'in-progress': { label: 'In Progress', color: '#52C0E8', bg: 'rgba(82,192,232,0.12)' },
  complete:      { label: 'Complete',    color: '#3DCC91', bg: 'rgba(61,204,145,0.12)' },
  delayed:       { label: 'Delayed',     color: '#c04040', bg: 'rgba(192,64,64,0.12)' },
  'at-risk':     { label: 'At Risk',     color: '#d9a020', bg: 'rgba(217,160,32,0.12)' },
};

function uid() { return Math.random().toString(36).slice(2, 9); }

export function TimelineTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Milestone>>({ category: 'regulatory', status: 'upcoming', critical: false });
  const [filterCat, setFilterCat] = useState<MilestoneCategory | 'all'>('all');

  const milestones = state.milestones ?? [];

  function saveMilestone() {
    if (!draft.title) return;
    const m: Milestone = {
      id: editId ?? uid(),
      title: draft.title!,
      category: (draft.category as MilestoneCategory) ?? 'regulatory',
      targetDate: draft.targetDate ?? '',
      completedDate: draft.completedDate ?? '',
      status: (draft.status as MilestoneStatus) ?? 'upcoming',
      owner: draft.owner ?? '',
      critical: draft.critical ?? false,
      notes: draft.notes ?? '',
    };
    if (editId) {
      update({ ...state, milestones: milestones.map(ms => ms.id === editId ? m : ms) });
      setEditId(null);
    } else {
      update({ ...state, milestones: [...milestones, m] });
    }
    setDraft({ category: 'regulatory', status: 'upcoming', critical: false });
    setAdding(false);
  }

  function startEdit(m: Milestone) {
    setDraft({ ...m });
    setEditId(m.id);
    setAdding(true);
  }

  const cats: MilestoneCategory[] = ['regulatory', 'clinical', 'reimbursement', 'ip', 'commercial', 'manufacturing', 'operational'];
  const statuses: MilestoneStatus[] = ['upcoming', 'in-progress', 'complete', 'delayed', 'at-risk'];

  const filtered = milestones
    .filter(m => filterCat === 'all' || m.category === filterCat)
    .sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999'));

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
          <div style={{ fontSize: 9, color: '#52E8B4', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--mono)', marginBottom: 8 }}>03 / Implement · Timeline</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Project Timeline</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>Milestones across regulatory, clinical, and commercial workstreams.</div>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
        {statuses.map(s => {
          const count = milestones.filter(m => m.status === s).length;
          const meta = STATUS_META[s];
          return (
            <div key={s} style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? meta.color : 'var(--text-4)' }}>{count}</div>
              <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...cats] as const).map(c => {
          const col = c !== 'all' ? CATEGORY_COLORS[c] : undefined;
          const active = filterCat === c;
          return (
            <button key={c} onClick={() => setFilterCat(c as typeof filterCat)}
              style={{
                padding: '4px 10px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: active ? (col ? col + '22' : 'var(--surface-3)') : 'transparent',
                color: active ? (col ?? 'var(--text-2)') : 'var(--text-4)',
                border: `1px solid ${active ? (col ? col + '55' : 'var(--line-strong)') : 'var(--line)'}`,
              }}>{c === 'all' ? 'All' : c}</button>
          );
        })}
      </div>

      {/* Milestone list */}
      {filtered.length === 0 && !adding && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No milestones yet
        </div>
      )}

      {filtered.map(m => {
        const sm = STATUS_META[m.status];
        const cc = CATEGORY_COLORS[m.category];
        return (
          <div key={m.id} style={{ display: 'flex', marginBottom: 6 }}>
            <div style={{ width: 4, background: cc, borderRadius: '2px 0 0 2px', flexShrink: 0 }} />
            <div style={{ flex: 1, background: 'var(--surface-1)', border: '1px solid var(--line)', borderLeft: 'none', borderRadius: '0 2px 2px 0', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: cc + '22', color: cc, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.category}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sm.label}</span>
                    {m.critical && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: 'rgba(192,64,64,0.12)', color: '#c04040', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Critical Path</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.title}</div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', flexWrap: 'wrap' }}>
                    {m.targetDate && <span>Target: {m.targetDate}</span>}
                    {m.completedDate && <span>Done: {m.completedDate}</span>}
                    {m.owner && <span>Owner: {m.owner}</span>}
                  </div>
                  {m.notes && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{m.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => startEdit(m)} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text-4)', cursor: 'pointer', fontSize: 11, padding: '4px 10px', fontFamily: 'var(--mono)' }}>Edit</button>
                  <button onClick={() => update({ ...state, milestones: milestones.filter(x => x.id !== m.id) })} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 15, padding: '0 4px' }}>×</button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add / Edit form */}
      {adding ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: 20, marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 14 }}>{editId ? 'Edit Milestone' : 'New Milestone'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Title</label>
              <input value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Milestone title" style={{ ...inputStyle, height: 36 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as MilestoneCategory }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                {cats.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as MilestoneStatus }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                {statuses.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Target Date</label>
              <input type="date" value={draft.targetDate ?? ''} onChange={e => setDraft(d => ({ ...d, targetDate: e.target.value }))} style={{ ...inputStyle, height: 36 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Completed Date</label>
              <input type="date" value={draft.completedDate ?? ''} onChange={e => setDraft(d => ({ ...d, completedDate: e.target.value }))} style={{ ...inputStyle, height: 36 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Owner</label>
              <input value={draft.owner ?? ''} onChange={e => setDraft(d => ({ ...d, owner: e.target.value }))} placeholder="Responsible party" style={{ ...inputStyle, height: 36 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="ms-critical" checked={draft.critical ?? false} onChange={e => setDraft(d => ({ ...d, critical: e.target.checked }))} style={{ width: 14, height: 14, accentColor: '#c04040' }} />
              <label htmlFor="ms-critical" style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>Critical Path</label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Dependencies, blockers, context…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveMilestone} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>{editId ? 'Save Changes' : 'Add Milestone'}</button>
            <button onClick={() => { setAdding(false); setEditId(null); setDraft({ category: 'regulatory', status: 'upcoming', critical: false }); }}
              style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          + Add milestone
        </button>
      )}
    </div>
  );
}
