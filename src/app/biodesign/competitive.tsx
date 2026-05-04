'use client';
import { useState } from 'react';
import { BiodesignState, Competitor } from './data';

function uid() { return Math.random().toString(36).slice(2, 9); }

const CLASS_COLORS: Record<string, string> = {
  I: '#3DCC91', II: '#52C0E8', III: '#c04040', '': '#8a9fa8',
};

export function CompetitiveTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Competitor>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const competitors = state.competitors ?? [];

  function saveCompetitor() {
    if (!draft.company && !draft.device) return;
    const c: Competitor = {
      id: editId ?? uid(),
      company: draft.company ?? '',
      device: draft.device ?? '',
      fdaStatus: draft.fdaStatus ?? '',
      deviceClass: draft.deviceClass ?? '',
      indication: draft.indication ?? '',
      clearanceNumber: draft.clearanceNumber ?? '',
      marketShare: draft.marketShare ?? '',
      listPrice: draft.listPrice ?? '',
      strengths: draft.strengths ?? '',
      weaknesses: draft.weaknesses ?? '',
      reimbursement: draft.reimbursement ?? '',
      notes: draft.notes ?? '',
    };
    if (editId) {
      update({ ...state, competitors: competitors.map(cp => cp.id === editId ? c : cp) });
      setEditId(null);
    } else {
      update({ ...state, competitors: [...competitors, c] });
    }
    setDraft({});
    setAdding(false);
  }

  function startEdit(c: Competitor) {
    setDraft({ ...c });
    setEditId(c.id);
    setExpanded(null);
    setAdding(true);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
    borderRadius: 2, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--sans)', outline: 'none',
  };

  const classDistrib = ['I', 'II', 'III'].map(cls => ({
    cls, count: competitors.filter(c => c.deviceClass === cls).length,
  }));

  return (
    <div>
      <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Competitive Landscape</h2>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>Map existing solutions, predicate devices, and market incumbents.</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 20 }}>
        <div style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: competitors.length > 0 ? 'var(--text)' : 'var(--text-4)' }}>{competitors.length}</div>
          <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>Devices</div>
        </div>
        <div style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>{new Set(competitors.map(c => c.company).filter(Boolean)).size}</div>
          <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>Companies</div>
        </div>
        {classDistrib.map(({ cls, count }) => (
          <div key={cls} style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? CLASS_COLORS[cls] : 'var(--text-4)' }}>{count}</div>
            <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>Class {cls}</div>
          </div>
        ))}
      </div>

      {competitors.length === 0 && !adding && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No competitors logged yet
        </div>
      )}

      {competitors.map(c => {
        const isOpen = expanded === c.id;
        const cls = c.deviceClass;
        const clsColor = CLASS_COLORS[cls] ?? '#8a9fa8';
        return (
          <div key={c.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, marginBottom: 6 }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : c.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  {cls && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: clsColor + '22', color: clsColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Class {cls}</span>}
                  {c.clearanceNumber && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{c.clearanceNumber}</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.company}</div>
                {c.device && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.device}</div>}
                {c.indication && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.indication}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {c.listPrice && <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{c.listPrice}</span>}
                <span style={{ color: 'var(--text-4)', fontSize: 14, fontFamily: 'var(--mono)' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--line)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {c.fdaStatus && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>FDA Status</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.fdaStatus}</div>
                    </div>
                  )}
                  {c.marketShare && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>Market Share</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.marketShare}</div>
                    </div>
                  )}
                  {c.reimbursement && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>Reimbursement Codes</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.reimbursement}</div>
                    </div>
                  )}
                  {c.listPrice && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>List Price</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.listPrice}</div>
                    </div>
                  )}
                </div>
                {c.strengths && (
                  <div>
                    <div style={{ fontSize: 10, color: '#3DCC91', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>Strengths</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.strengths}</div>
                  </div>
                )}
                {c.weaknesses && (
                  <div>
                    <div style={{ fontSize: 10, color: '#d9a020', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>Weaknesses / Gaps</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.weaknesses}</div>
                  </div>
                )}
                {c.notes && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 3 }}>Notes</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.notes}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(c)} style={{ padding: '5px 12px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Edit</button>
                  <button onClick={() => update({ ...state, competitors: competitors.filter(cp => cp.id !== c.id) })}
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
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 14 }}>{editId ? 'Edit Competitor' : 'Add Competitor'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {([
              ['company', 'Company', 'e.g. Medtronic', false],
              ['device', 'Device / Product', 'e.g. WATCHMAN FLX', false],
              ['fdaStatus', 'FDA Status', 'e.g. 510(k) cleared 2021', false],
              ['deviceClass', 'Device Class', 'I, II, or III', false],
              ['clearanceNumber', 'Clearance / Approval #', 'e.g. K201234', false],
              ['indication', 'Indication', 'Primary indication for use', true],
              ['marketShare', 'Market Share', 'e.g. ~35% US market', false],
              ['listPrice', 'List Price', 'e.g. $8,500 per unit', false],
              ['reimbursement', 'Reimbursement Codes', 'CPT / DRG codes used', false],
            ] as [keyof Competitor, string, string, boolean][]).map(([field, label, ph, full]) => (
              <div key={field} style={full ? { gridColumn: '1 / -1' } : {}}>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input value={(draft[field] ?? '') as string} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))} placeholder={ph} style={{ ...inputStyle, height: 36 }} />
              </div>
            ))}
            {(['strengths', 'weaknesses', 'notes'] as (keyof Competitor)[]).map(field => (
              <div key={field} style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>
                  {field === 'weaknesses' ? 'Weaknesses / Gaps' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <textarea value={(draft[field] ?? '') as string} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))} rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder={field === 'strengths' ? 'Clinical data, brand, workflow integration…' : field === 'weaknesses' ? 'Unmet needs, gaps your device can address…' : 'Sources, additional context…'} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveCompetitor} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>{editId ? 'Save Changes' : 'Add Competitor'}</button>
            <button onClick={() => { setAdding(false); setEditId(null); setDraft({}); }}
              style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          + Add competitor
        </button>
      )}
    </div>
  );
}
