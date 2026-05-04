'use client';
import { useState } from 'react';
import { BiodesignState, Risk, RiskCategory, RiskStatus } from './data';

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  technical:     '#52C0E8',
  regulatory:    '#9b72cf',
  clinical:      '#3DCC91',
  commercial:    '#e87d40',
  ip:            '#d9a020',
  manufacturing: '#5a8ac4',
  reimbursement: '#c0a840',
  cybersecurity: '#c04040',
};

const STATUS_META: Record<RiskStatus, { label: string; color: string; bg: string }> = {
  open:      { label: 'Open',      color: '#c04040', bg: 'rgba(192,64,64,0.12)' },
  mitigated: { label: 'Mitigated', color: '#d9a020', bg: 'rgba(217,160,32,0.12)' },
  accepted:  { label: 'Accepted',  color: '#52C0E8', bg: 'rgba(82,192,232,0.12)' },
  closed:    { label: 'Closed',    color: '#3DCC91', bg: 'rgba(61,204,145,0.12)' },
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function riskLevel(score: number): { label: string; color: string } {
  if (score >= 20) return { label: 'Critical', color: '#c04040' };
  if (score >= 12) return { label: 'High',     color: '#e87d40' };
  if (score >= 6)  return { label: 'Medium',   color: '#d9a020' };
  return             { label: 'Low',      color: '#3DCC91' };
}

function heatColor(p: number, impact: number): string {
  const score = p * impact;
  if (score >= 20) return 'rgba(192,64,64,0.55)';
  if (score >= 12) return 'rgba(232,125,64,0.45)';
  if (score >= 6)  return 'rgba(217,160,32,0.35)';
  if (score >= 3)  return 'rgba(82,192,232,0.22)';
  return 'rgba(61,204,145,0.18)';
}

export function RisksTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Risk>>({ category: 'technical', status: 'open', probability: 3, impact: 3 });
  const [showMatrix, setShowMatrix] = useState(true);
  const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all');

  const risks = state.risks ?? [];
  const cats: RiskCategory[] = ['technical', 'regulatory', 'clinical', 'commercial', 'ip', 'manufacturing', 'reimbursement', 'cybersecurity'];
  const statuses: RiskStatus[] = ['open', 'mitigated', 'accepted', 'closed'];

  function saveRisk() {
    if (!draft.title) return;
    const existing = risks.find(r => r.id === editId);
    const r: Risk = {
      id: editId ?? uid(),
      title: draft.title!,
      description: draft.description ?? '',
      category: (draft.category as RiskCategory) ?? 'technical',
      probability: draft.probability ?? 3,
      impact: draft.impact ?? 3,
      mitigation: draft.mitigation ?? '',
      owner: draft.owner ?? '',
      status: (draft.status as RiskStatus) ?? 'open',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (editId) {
      update({ ...state, risks: risks.map(rv => rv.id === editId ? r : rv) });
      setEditId(null);
    } else {
      update({ ...state, risks: [...risks, r] });
    }
    setDraft({ category: 'technical', status: 'open', probability: 3, impact: 3 });
    setAdding(false);
  }

  function startEdit(r: Risk) {
    setDraft({ ...r });
    setEditId(r.id);
    setAdding(true);
  }

  const filtered = risks
    .filter(r => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
    borderRadius: 2, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--sans)', outline: 'none',
  };

  const criticalCount = risks.filter(r => r.status !== 'closed' && r.probability * r.impact >= 20).length;

  return (
    <div>
      <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Risk Register</h2>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>Identify, score, and track project risks across technical, regulatory, and commercial dimensions.</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
        {statuses.map(s => {
          const count = risks.filter(r => r.status === s).length;
          const meta = STATUS_META[s];
          return (
            <div key={s} style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? meta.color : 'var(--text-4)' }}>{count}</div>
              <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      {criticalCount > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(192,64,64,0.08)', border: '1px solid rgba(192,64,64,0.25)', borderRadius: 2, marginBottom: 16, fontSize: 12, color: '#e08080' }}>
          {criticalCount} critical risk{criticalCount > 1 ? 's' : ''} require immediate attention.
        </div>
      )}

      {/* Matrix toggle */}
      {risks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowMatrix(m => !m)} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text-3)', fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--mono)' }}>
            {showMatrix ? 'Hide' : 'Show'} Risk Matrix
          </button>
        </div>
      )}

      {/* 5×5 Heat Map */}
      {showMatrix && risks.length > 0 && (
        <div style={{ marginBottom: 24, overflowX: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Probability × Impact Heat Map</div>
          <div style={{ display: 'inline-grid', gap: 3, gridTemplateColumns: 'auto repeat(5, 56px)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'flex-end', paddingBottom: 4, paddingRight: 8 }}>P \ I →</div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--mono)', paddingBottom: 4 }}>{i}</div>
            ))}
            {[5, 4, 3, 2, 1].map(p => (
              <>
                <div key={`lbl-${p}`} style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', paddingRight: 8 }}>{p}</div>
                {[1, 2, 3, 4, 5].map(impact => {
                  const cell = risks.filter(r => r.probability === p && r.impact === impact && r.status !== 'closed');
                  return (
                    <div key={`${p}-${impact}`} style={{
                      width: 56, height: 44, background: heatColor(p, impact), borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontFamily: 'var(--mono)', fontWeight: 700,
                      color: cell.length > 0 ? '#fff' : 'rgba(255,255,255,0.15)',
                    }}>
                      {cell.length > 0 ? cell.length : ''}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['all', ...statuses] as const).map(s => {
          const meta = s !== 'all' ? STATUS_META[s] : null;
          const active = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(s as typeof filterStatus)}
              style={{
                padding: '4px 10px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: active ? (meta ? meta.bg : 'var(--surface-3)') : 'transparent',
                color: active ? (meta ? meta.color : 'var(--text-2)') : 'var(--text-4)',
                border: `1px solid ${active ? (meta ? meta.color + '55' : 'var(--line-strong)') : 'var(--line)'}`,
              }}>{s === 'all' ? 'All' : STATUS_META[s].label}</button>
          );
        })}
      </div>

      {filtered.length === 0 && !adding && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No risks logged
        </div>
      )}

      {filtered.map(r => {
        const score = r.probability * r.impact;
        const level = riskLevel(score);
        const catColor = CATEGORY_COLORS[r.category];
        const sm = STATUS_META[r.status];
        return (
          <div key={r.id} style={{ display: 'flex', marginBottom: 6 }}>
            <div style={{ width: 4, background: level.color, borderRadius: '2px 0 0 2px', flexShrink: 0 }} />
            <div style={{ flex: 1, background: 'var(--surface-1)', border: '1px solid var(--line)', borderLeft: 'none', borderRadius: '0 2px 2px 0', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: catColor + '22', color: catColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.category}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sm.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: level.color + '20', color: level.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{level.label} · {score}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.title}</div>
                  {r.description && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{r.description}</div>}
                  <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
                    <span>P={r.probability}</span><span>I={r.impact}</span>
                    {r.owner && <span>Owner: {r.owner}</span>}
                  </div>
                  {r.mitigation && (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 2, fontSize: 12, color: 'var(--text-2)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 3 }}>Mitigation</span>
                      {r.mitigation}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => startEdit(r)} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text-4)', cursor: 'pointer', fontSize: 11, padding: '4px 10px', fontFamily: 'var(--mono)' }}>Edit</button>
                  <button onClick={() => update({ ...state, risks: risks.filter(rv => rv.id !== r.id) })} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 15, padding: '0 4px' }}>×</button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add / Edit form */}
      {adding ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: 20, marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 14 }}>{editId ? 'Edit Risk' : 'Log Risk'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Risk Title</label>
              <input value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Brief risk description" style={{ ...inputStyle, height: 36 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as RiskCategory }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                {cats.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as RiskStatus }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                {statuses.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Probability (1–5): {draft.probability ?? 3}</label>
              <input type="range" min={1} max={5} step={1} value={draft.probability ?? 3} onChange={e => setDraft(d => ({ ...d, probability: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 6 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Impact (1–5): {draft.impact ?? 3}</label>
              <input type="range" min={1} max={5} step={1} value={draft.impact ?? 3} onChange={e => setDraft(d => ({ ...d, impact: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 6 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {(() => {
                const sc = (draft.probability ?? 3) * (draft.impact ?? 3);
                const lv = riskLevel(sc);
                return (
                  <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 2, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: lv.color }}>{sc}</div>
                    <div style={{ fontSize: 9, color: lv.color, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lv.label} risk</div>
                  </div>
                );
              })()}
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Owner</label>
              <input value={draft.owner ?? ''} onChange={e => setDraft(d => ({ ...d, owner: e.target.value }))} placeholder="Responsible party" style={{ ...inputStyle, height: 36 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describe the risk in detail…" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Mitigation Plan</label>
              <textarea value={draft.mitigation ?? ''} onChange={e => setDraft(d => ({ ...d, mitigation: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="How will you reduce this risk?" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveRisk} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>{editId ? 'Save Changes' : 'Log Risk'}</button>
            <button onClick={() => { setAdding(false); setEditId(null); setDraft({ category: 'technical', status: 'open', probability: 3, impact: 3 }); }}
              style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          + Log risk
        </button>
      )}
    </div>
  );
}
