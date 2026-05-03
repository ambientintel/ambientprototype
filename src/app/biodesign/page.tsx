'use client';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import {
  BiodesignState, DEFAULT_STATE, NeedStatement, Stakeholder, Concept,
  Patent, NeedStatus, ConceptStatus, StakeholderRole, RegulatoryPathway,
  DeviceClass, needScore, conceptScore,
  NEED_STATUS_META, CONCEPT_STATUS_META, PATHWAY_META, STAKEHOLDER_ROLE_META,
} from './data';
import { ProfileTab, StandardsTab } from './comply';

// ── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ambient-biodesign-v2';

function loadState(): BiodesignState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('ambient-biodesign-v1');
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      comply: { ...DEFAULT_STATE.comply, ...(parsed.comply ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: BiodesignState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

// ── Sub-components ─────────────────────────────────────────────────────────────

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: bg, color, fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function ScoreBar({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value === null) return <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>—</span>;
  const pct = (value / max) * 100;
  const color = pct >= 70 ? '#3DCC91' : pct >= 40 ? '#d9a020' : '#c04040';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--line-strong)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color, minWidth: 24 }}>{value.toFixed(1)}</span>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const active = (hover ?? value ?? 0) >= i;
        return (
          <button
            key={i}
            onClick={() => onChange(value === i ? 0 : i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: active ? '#d9a020' : 'var(--text-4)', fontSize: 14, transition: 'color 0.1s',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >★</button>
        );
      })}
    </div>
  );
}

function Field({
  label, value, onChange, multiline = false, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  const style: React.CSSProperties = {
    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
    borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={style} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...style, height: 34 }} />
      }
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{title}</h2>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--line)',
      borderRadius: 8, padding: 16, ...style,
    }}>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', color: 'var(--text-4)', fontSize: 13,
      border: '1px dashed var(--line)', borderRadius: 8,
    }}>{label}</div>
  );
}

// ── Tab: Identify — Needs ─────────────────────────────────────────────────────

function NeedsTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ problem: '', population: '', setting: '', outcome: '' });

  function addNeed() {
    if (!draft.problem) return;
    const n: NeedStatement = {
      id: uid(), problem: draft.problem, population: draft.population,
      setting: draft.setting, outcome: draft.outcome,
      status: 'draft', observations: [],
      criteria: { diseaseStateScore: null, marketScore: null, regulatoryScore: null, businessScore: null, notes: '' },
      createdAt: new Date().toISOString(),
    };
    update({ ...state, needs: [...state.needs, n] });
    setDraft({ problem: '', population: '', setting: '', outcome: '' });
    setAdding(false);
  }

  function updateNeed(id: string, patch: Partial<NeedStatement>) {
    update({ ...state, needs: state.needs.map(n => n.id === id ? { ...n, ...patch } : n) });
  }

  function updateCriteria(id: string, field: string, val: number | null | string) {
    update({
      ...state,
      needs: state.needs.map(n => n.id === id
        ? { ...n, criteria: { ...n.criteria, [field]: val } }
        : n),
    });
  }

  function deleteNeed(id: string) {
    update({ ...state, needs: state.needs.filter(n => n.id !== id), selectedNeedId: state.selectedNeedId === id ? null : state.selectedNeedId });
  }

  function addObservation(id: string, obs: string) {
    const n = state.needs.find(n => n.id === id);
    if (!n || !obs.trim()) return;
    updateNeed(id, { observations: [...n.observations, obs.trim()] });
  }

  function removeObservation(needId: string, idx: number) {
    const n = state.needs.find(n => n.id === needId);
    if (!n) return;
    updateNeed(needId, { observations: n.observations.filter((_, i) => i !== idx) });
  }

  const statusOptions: NeedStatus[] = ['draft', 'refined', 'validated', 'selected'];

  return (
    <div>
      <SectionHeader
        title="Need Statements"
        subtitle="A way to [solve problem] for [population] in [setting] so that [outcome]."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        <StatMini label="Total needs" value={state.needs.length} />
        <StatMini label="Selected" value={state.needs.filter(n => n.status === 'selected').length} accent="#3DCC91" />
      </div>

      {state.needs.map(n => {
        const score = needScore(n);
        const isOpen = expanded === n.id;
        const meta = NEED_STATUS_META[n.status];
        return (
          <Card key={n.id} style={{ marginBottom: 8 }}>
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
              onClick={() => setExpanded(isOpen ? null : n.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge label={meta.label} bg={meta.bg} color={meta.color} />
                  {score !== null && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      score {score}/5
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
                  A way to {n.problem || '…'}
                </p>
                {n.population && (
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
                    for {n.population}{n.setting ? ` · in ${n.setting}` : ''}
                  </p>
                )}
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 16, marginTop: 2 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Problem" value={n.problem} onChange={v => updateNeed(n.id, { problem: v })} placeholder="solve what?" />
                  <Field label="Population" value={n.population} onChange={v => updateNeed(n.id, { population: v })} placeholder="for whom?" />
                  <Field label="Setting" value={n.setting} onChange={v => updateNeed(n.id, { setting: v })} placeholder="where / context?" />
                  <Field label="Desired Outcome" value={n.outcome} onChange={v => updateNeed(n.id, { outcome: v })} placeholder="so that?" />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>Status</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {statusOptions.map(s => {
                        const m = NEED_STATUS_META[s];
                        return (
                          <button key={s} onClick={() => updateNeed(n.id, { status: s })}
                            style={{
                              padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                              background: n.status === s ? m.bg : 'transparent',
                              color: n.status === s ? m.color : 'var(--text-3)',
                              border: `1px solid ${n.status === s ? m.color + '44' : 'var(--line)'}`,
                            }}>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: 10, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>Need Filtering Criteria</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {([
                      ['diseaseStateScore', 'Disease State'],
                      ['marketScore', 'Market Opportunity'],
                      ['regulatoryScore', 'Regulatory Feasibility'],
                      ['businessScore', 'Business Viability'],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
                          <StarRating value={n.criteria[field]} onChange={v => updateCriteria(n.id, field, v || null)} />
                        </div>
                        <ScoreBar value={n.criteria[field]} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Field label="Filter Notes" value={n.criteria.notes} onChange={v => updateCriteria(n.id, 'notes', v)} multiline placeholder="Rationale for scores…" />
                  </div>
                </div>

                <ObservationsEditor
                  observations={n.observations}
                  onAdd={obs => addObservation(n.id, obs)}
                  onRemove={idx => removeObservation(n.id, idx)}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => update({ ...state, selectedNeedId: state.selectedNeedId === n.id ? null : n.id })}
                    style={{
                      padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      background: state.selectedNeedId === n.id ? 'rgba(61,204,145,0.15)' : 'var(--surface-2)',
                      color: state.selectedNeedId === n.id ? '#3DCC91' : 'var(--text-2)',
                      border: `1px solid ${state.selectedNeedId === n.id ? '#3DCC9144' : 'var(--line)'}`,
                    }}
                  >
                    {state.selectedNeedId === n.id ? '✓ Active need' : 'Set as active need'}
                  </button>
                  <button onClick={() => deleteNeed(n.id)}
                    style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {adding ? (
        <Card style={{ marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <Field label="Problem" value={draft.problem} onChange={v => setDraft(d => ({ ...d, problem: v }))} placeholder="cannot do X / pain point" />
            <Field label="Population" value={draft.population} onChange={v => setDraft(d => ({ ...d, population: v }))} placeholder="patients with Y" />
            <Field label="Setting" value={draft.setting} onChange={v => setDraft(d => ({ ...d, setting: v }))} placeholder="during procedure / at home" />
            <Field label="Desired Outcome" value={draft.outcome} onChange={v => setDraft(d => ({ ...d, outcome: v }))} placeholder="reduce X, improve Y" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 14, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6 }}>
            "A way to <strong style={{ color: 'var(--text-2)' }}>{draft.problem || '…'}</strong> for <strong style={{ color: 'var(--text-2)' }}>{draft.population || '…'}</strong> in <strong style={{ color: 'var(--text-2)' }}>{draft.setting || '…'}</strong> so that <strong style={{ color: 'var(--text-2)' }}>{draft.outcome || '…'}</strong>"
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addNeed} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add Need</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px dashed var(--line)', marginTop: 4 }}>
          + Add need statement
        </button>
      )}
    </div>
  );
}

function ObservationsEditor({ observations, onAdd, onRemove }: { observations: string[]; onAdd: (s: string) => void; onRemove: (i: number) => void }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Observations</div>
      {observations.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '0 0 8px' }}>No observations logged.</p>}
      {observations.map((obs, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-4)', fontSize: 11, marginTop: 2, fontFamily: 'var(--mono)' }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{obs}</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 13, padding: 0, marginTop: 1 }}>×</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val); setVal(''); } }}
          placeholder="Log an observation (Enter to add)"
          style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none' }}
        />
        <button onClick={() => { if (val.trim()) { onAdd(val); setVal(''); } }}
          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
          Add
        </button>
      </div>
    </div>
  );
}

// ── Tab: Stakeholders ─────────────────────────────────────────────────────────

function StakeholdersTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Stakeholder>>({ role: 'clinician', influence: 3, interest: 3 });

  function addStakeholder() {
    if (!draft.name) return;
    const s: Stakeholder = {
      id: uid(), name: draft.name!, role: draft.role as StakeholderRole ?? 'clinician',
      influence: draft.influence ?? 3, interest: draft.interest ?? 3,
      painPoints: draft.painPoints ?? '', successMetrics: draft.successMetrics ?? '',
    };
    update({ ...state, stakeholders: [...state.stakeholders, s] });
    setDraft({ role: 'clinician', influence: 3, interest: 3 });
    setAdding(false);
  }

  function updateStakeholder(id: string, patch: Partial<Stakeholder>) {
    update({ ...state, stakeholders: state.stakeholders.map(s => s.id === id ? { ...s, ...patch } : s) });
  }

  const roles: StakeholderRole[] = ['patient', 'clinician', 'payer', 'hospital', 'regulator', 'caregiver'];

  return (
    <div>
      <SectionHeader title="Stakeholder Map" subtitle="Identify all parties who influence adoption and use." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {roles.map(role => {
          const count = state.stakeholders.filter(s => s.role === role).length;
          const meta = STAKEHOLDER_ROLE_META[role];
          return (
            <div key={role} style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: meta.color, fontFamily: 'var(--mono)', marginBottom: 2 }}>{meta.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? 'var(--text)' : 'var(--text-4)' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {state.stakeholders.map(s => {
        const meta = STAKEHOLDER_ROLE_META[s.role];
        const isOpen = expanded === s.id;
        return (
          <Card key={s.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : s.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Badge label={meta.label} bg={meta.color + '22'} color={meta.color} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
                  <span>Influence {s.influence}/5</span>
                  <span>Interest {s.interest}/5</span>
                </div>
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Name / Title" value={s.name} onChange={v => updateStakeholder(s.id, { name: v })} />
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>Role</label>
                    <select value={s.role} onChange={e => updateStakeholder(s.id, { role: e.target.value as StakeholderRole })}
                      style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13 }}>
                      {roles.map(r => <option key={r} value={r}>{STAKEHOLDER_ROLE_META[r].label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Influence</span>
                      <StarRating value={s.influence} onChange={v => updateStakeholder(s.id, { influence: v || 1 })} />
                    </div>
                    <ScoreBar value={s.influence} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Interest</span>
                      <StarRating value={s.interest} onChange={v => updateStakeholder(s.id, { interest: v || 1 })} />
                    </div>
                    <ScoreBar value={s.interest} />
                  </div>
                </div>
                <Field label="Pain Points & Unmet Needs" value={s.painPoints} onChange={v => updateStakeholder(s.id, { painPoints: v })} multiline placeholder="What frustrates them? What do they wish worked better?" />
                <Field label="Success Metrics" value={s.successMetrics} onChange={v => updateStakeholder(s.id, { successMetrics: v })} multiline placeholder="How will they judge success? What outcome matters to them?" />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => update({ ...state, stakeholders: state.stakeholders.filter(sh => sh.id !== s.id) })}
                    style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
                    Remove
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {adding ? (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <Field label="Name / Title" value={draft.name ?? ''} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="e.g. Interventional Cardiologist" />
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>Role</label>
              <select value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value as StakeholderRole }))}
                style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13 }}>
                {roles.map(r => <option key={r} value={r}>{STAKEHOLDER_ROLE_META[r].label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addStakeholder} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px dashed var(--line)', marginTop: 4 }}>
          + Add stakeholder
        </button>
      )}
    </div>
  );
}

// ── Tab: Concepts ─────────────────────────────────────────────────────────────

function ConceptsTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', mechanism: '' });

  function addConcept() {
    if (!draft.title) return;
    const c: Concept = {
      id: uid(), needId: state.selectedNeedId ?? '',
      title: draft.title, description: draft.description, mechanism: draft.mechanism,
      status: 'idea',
      screening: { technicalFeasibility: null, ipFreedom: null, regulatoryRisk: null, reimbursementViability: null, clinicalAdoption: null, notes: '' },
      createdAt: new Date().toISOString(),
    };
    update({ ...state, concepts: [...state.concepts, c] });
    setDraft({ title: '', description: '', mechanism: '' });
    setAdding(false);
  }

  function updateConcept(id: string, patch: Partial<Concept>) {
    update({ ...state, concepts: state.concepts.map(c => c.id === id ? { ...c, ...patch } : c) });
  }

  function updateScreening(id: string, field: string, val: number | null | string) {
    update({
      ...state,
      concepts: state.concepts.map(c => c.id === id
        ? { ...c, screening: { ...c.screening, [field]: val } }
        : c),
    });
  }

  const statusOptions: ConceptStatus[] = ['idea', 'screening', 'development', 'selected', 'eliminated'];

  const sorted = [...state.concepts].sort((a, b) => {
    const sa = conceptScore(a) ?? 0, sb = conceptScore(b) ?? 0;
    return sb - sa;
  });

  return (
    <div>
      <SectionHeader title="Concept Inventory" subtitle="Generate and screen solution concepts against the active need." />

      {state.selectedNeedId && (() => {
        const n = state.needs.find(n => n.id === state.selectedNeedId);
        return n ? (
          <div style={{ padding: '10px 14px', background: 'rgba(45,114,210,0.10)', border: '1px solid rgba(45,114,210,0.25)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Active Need</span>
            "A way to {n.problem} for {n.population}{n.setting ? ` in ${n.setting}` : ''} so that {n.outcome}"
          </div>
        ) : null;
      })()}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        <StatMini label="Total concepts" value={state.concepts.length} />
        <StatMini label="In development" value={state.concepts.filter(c => c.status === 'development').length} accent="#2D72D2" />
        <StatMini label="Selected" value={state.concepts.filter(c => c.status === 'selected').length} accent="#3DCC91" />
      </div>

      {sorted.map(c => {
        const score = conceptScore(c);
        const meta = CONCEPT_STATUS_META[c.status];
        const isOpen = expanded === c.id;
        return (
          <Card key={c.id} style={{ marginBottom: 8, opacity: c.status === 'eliminated' ? 0.55 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : c.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge label={meta.label} bg={meta.bg} color={meta.color} />
                  {score !== null && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>score {score}/5</span>}
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.title}</p>
                {c.description && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '…' : ''}</p>}
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 16, marginTop: 2 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Concept Name" value={c.title} onChange={v => updateConcept(c.id, { title: v })} />
                <Field label="Description" value={c.description} onChange={v => updateConcept(c.id, { description: v })} multiline placeholder="What does this solution do?" />
                <Field label="Mechanism / How It Works" value={c.mechanism} onChange={v => updateConcept(c.id, { mechanism: v })} multiline placeholder="Describe the mechanism of action or technical approach" />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>Stage</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {statusOptions.map(s => {
                        const m = CONCEPT_STATUS_META[s];
                        return (
                          <button key={s} onClick={() => updateConcept(c.id, { status: s })}
                            style={{
                              padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer',
                              background: c.status === s ? m.bg : 'transparent',
                              color: c.status === s ? m.color : 'var(--text-3)',
                              border: `1px solid ${c.status === s ? m.color + '44' : 'var(--line)'}`,
                            }}>{m.label}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 12 }}>Concept Screening</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {([
                      ['technicalFeasibility', 'Technical Feasibility'],
                      ['ipFreedom', 'IP Freedom to Operate'],
                      ['regulatoryRisk', 'Regulatory Risk (5=low)'],
                      ['reimbursementViability', 'Reimbursement Viability'],
                      ['clinicalAdoption', 'Clinical Adoption Likelihood'],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
                          <StarRating value={c.screening[field]} onChange={v => updateScreening(c.id, field, v || null)} />
                        </div>
                        <ScoreBar value={c.screening[field]} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Field label="Screening Notes" value={c.screening.notes} onChange={v => updateScreening(c.id, 'notes', v)} multiline placeholder="Key risks, assumptions, open questions…" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => update({ ...state, concepts: state.concepts.filter(cc => cc.id !== c.id) })}
                    style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {state.concepts.length === 0 && !adding && <EmptyState label="No concepts yet — add your first idea" />}

      {adding ? (
        <Card style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <Field label="Concept Name" value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} placeholder="Short name for this solution idea" />
            <Field label="Description" value={draft.description} onChange={v => setDraft(d => ({ ...d, description: v }))} multiline placeholder="Brief description of what it does" />
            <Field label="Mechanism" value={draft.mechanism} onChange={v => setDraft(d => ({ ...d, mechanism: v }))} multiline placeholder="How does it work?" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addConcept} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add Concept</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px dashed var(--line)', marginTop: 4 }}>
          + Add concept
        </button>
      )}
    </div>
  );
}

// ── Tab: Regulatory ────────────────────────────────────────────────────────────

function RegulatoryTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const reg = state.regulatory;
  function set(patch: Partial<typeof reg>) {
    update({ ...state, regulatory: { ...reg, ...patch } });
  }

  const pathways: RegulatoryPathway[] = ['510k', 'pma', 'denovo', 'exempt', 'tbd'];
  const deviceClasses: DeviceClass[] = ['I', 'II', 'III', 'TBD'];

  const classInfo: Record<DeviceClass, string> = {
    I: 'General controls only. Low risk.',
    II: 'General + special controls. Moderate risk.',
    III: 'PMA required. High risk / life-sustaining.',
    TBD: 'Not yet determined.',
  };

  const pathwayInfo: Record<RegulatoryPathway, string> = {
    '510k': 'Premarket Notification — demonstrate substantial equivalence to a predicate.',
    pma: 'Premarket Approval — valid scientific evidence of safety and effectiveness.',
    denovo: 'De Novo — novel low-to-moderate risk device with no predicate.',
    exempt: 'Exempt from premarket notification. Subject to general controls.',
    tbd: 'Regulatory pathway not yet determined.',
  };

  const [addingControl, setAddingControl] = useState(false);
  const [controlDraft, setControlDraft] = useState('');

  function addControl() {
    if (!controlDraft.trim()) return;
    set({ specialControls: [...(reg.specialControls ?? []), controlDraft.trim()] });
    setControlDraft('');
    setAddingControl(false);
  }

  return (
    <div>
      <SectionHeader title="Regulatory Strategy" subtitle="Define FDA classification, pathway, and submission plan." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Device Class</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {deviceClasses.map(cls => (
              <button key={cls} onClick={() => set({ deviceClass: cls })}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--mono)',
                  background: reg.deviceClass === cls ? 'rgba(45,114,210,0.18)' : 'var(--surface-1)',
                  color: reg.deviceClass === cls ? 'var(--accent)' : 'var(--text-3)',
                  border: `1px solid ${reg.deviceClass === cls ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
                }}>{cls}</button>
            ))}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>{classInfo[reg.deviceClass]}</p>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Pathway</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {pathways.map(p => {
              const meta = PATHWAY_META[p];
              return (
                <button key={p} onClick={() => set({ pathway: p })}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)',
                    background: reg.pathway === p ? meta.color + '22' : 'var(--surface-1)',
                    color: reg.pathway === p ? meta.color : 'var(--text-3)',
                    border: `1px solid ${reg.pathway === p ? meta.color + '44' : 'var(--line)'}`,
                  }}>{meta.label}</button>
              );
            })}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>{pathwayInfo[reg.pathway]}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Product Code" value={reg.productCode} onChange={v => set({ productCode: v })} placeholder="e.g. DQO" />
          <Field label="Predicate Device" value={reg.predicateDevice} onChange={v => set({ predicateDevice: v })} placeholder="Device name" />
          <Field label="Predicate 510(k) #" value={reg.predicateNumber} onChange={v => set({ predicateNumber: v })} placeholder="e.g. K201234" />
        </div>

        <Field label="Intended Use" value={reg.intendedUse} onChange={v => set({ intendedUse: v })} multiline placeholder="Describe the intended use of the device…" />
        <Field label="Indications for Use" value={reg.indicationsForUse} onChange={v => set({ indicationsForUse: v })} multiline placeholder="Specific conditions, populations, anatomical sites…" />
        <Field label="Substantial Equivalence Argument" value={reg.substantialEquivalence} onChange={v => set({ substantialEquivalence: v })} multiline placeholder="Same intended use + same technological characteristics, or different tech w/ no new safety questions…" />

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Clinical Data Required</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['not required', 'bench only', 'limited clinical', 'pivotal trial'] as const).map(opt => (
              <button key={opt} onClick={() => set({ clinicalData: opt })}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: reg.clinicalData === opt ? 'rgba(45,114,210,0.18)' : 'var(--surface-1)',
                  color: reg.clinicalData === opt ? 'var(--accent)' : 'var(--text-3)',
                  border: `1px solid ${reg.clinicalData === opt ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
                }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>Est. Timeline (months)</label>
            <input type="number" min={1} max={120}
              value={reg.estimatedTimelineMonths ?? ''} onChange={e => set({ estimatedTimelineMonths: e.target.value ? Number(e.target.value) : null })}
              style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
          <Field label="Estimated Cost" value={reg.estimatedCost} onChange={v => set({ estimatedCost: v })} placeholder="e.g. $200K–$500K" />
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Special Controls</div>
          {(reg.specialControls ?? []).map((ctrl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', minWidth: 20 }}>{i + 1}.</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>{ctrl}</span>
              <button onClick={() => set({ specialControls: reg.specialControls.filter((_, j) => j !== i) })}
                style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          ))}
          {addingControl ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={controlDraft} onChange={e => setControlDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addControl()}
                placeholder="e.g. Performance standards per IEC 60601-1…"
                style={{ flex: 1, height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              <button onClick={addControl} style={{ padding: '0 14px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add</button>
              <button onClick={() => { setAddingControl(false); setControlDraft(''); }} style={{ padding: '0 12px', borderRadius: 6, background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingControl(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Add special control</button>
          )}
        </div>

        <Field label="Notes" value={reg.notes} onChange={v => set({ notes: v })} multiline placeholder="Regulatory strategy notes, open items, Q-submission plan…" />
      </div>
    </div>
  );
}

// ── Tab: Strategy ─────────────────────────────────────────────────────────────

function StrategyTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [section, setSection] = useState<'clinical' | 'ip' | 'business'>('clinical');
  const biz = state.business;
  const clin = state.clinical;

  function setBiz(patch: Partial<typeof biz>) { update({ ...state, business: { ...biz, ...patch } }); }
  function setClin(patch: Partial<typeof clin>) { update({ ...state, clinical: { ...clin, ...patch } }); }

  const [addingEndpoint, setAddingEndpoint] = useState(false);
  const [epDraft, setEpDraft] = useState('');
  const [addingPatent, setAddingPatent] = useState(false);
  const [patentDraft, setPatentDraft] = useState<Partial<Patent>>({ status: 'active', relevance: 'relevant', ftoRisk: 'medium' });

  function addSecondaryEndpoint() {
    if (!epDraft.trim()) return;
    setClin({ secondaryEndpoints: [...clin.secondaryEndpoints, epDraft.trim()] });
    setEpDraft('');
    setAddingEndpoint(false);
  }

  function addPatent() {
    const p: Patent = {
      id: uid(), number: patentDraft.number ?? '', title: patentDraft.title ?? '',
      assignee: patentDraft.assignee ?? '', status: patentDraft.status as Patent['status'] ?? 'active',
      relevance: patentDraft.relevance as Patent['relevance'] ?? 'relevant',
      ftoRisk: patentDraft.ftoRisk as Patent['ftoRisk'] ?? 'medium',
      notes: patentDraft.notes ?? '',
    };
    update({ ...state, patents: [...state.patents, p] });
    setPatentDraft({ status: 'active', relevance: 'relevant', ftoRisk: 'medium' });
    setAddingPatent(false);
  }

  function updatePatent(id: string, patch: Partial<Patent>) {
    update({ ...state, patents: state.patents.map(p => p.id === id ? { ...p, ...patch } : p) });
  }

  const ftoColors: Record<Patent['ftoRisk'], string> = { high: '#a02020', medium: '#9a7000', low: '#1e8f68', cleared: '#2a5fa0' };

  return (
    <div>
      <SectionHeader title="Implementation Strategy" subtitle="Clinical evidence, IP landscape, and business model." />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['clinical', 'ip', 'business'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            style={{
              padding: '7px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
              background: section === s ? 'rgba(45,114,210,0.18)' : 'var(--surface-1)',
              color: section === s ? 'var(--accent)' : 'var(--text-3)',
              border: `1px solid ${section === s ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
            }}>{s === 'ip' ? 'IP Landscape' : s === 'clinical' ? 'Clinical Plan' : 'Business Model'}</button>
        ))}
      </div>

      {section === 'clinical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Primary Endpoint" value={clin.primaryEndpoint} onChange={v => setClin({ primaryEndpoint: v })} multiline placeholder="e.g. Reduction in 30-day readmission rate vs. standard of care (non-inferiority margin 5%)" />

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Secondary Endpoints</div>
            {clin.secondaryEndpoints.map((ep, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', minWidth: 20, paddingTop: 1 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>{ep}</span>
                <button onClick={() => setClin({ secondaryEndpoints: clin.secondaryEndpoints.filter((_, j) => j !== i) })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ))}
            {addingEndpoint ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={epDraft} onChange={e => setEpDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSecondaryEndpoint()}
                  placeholder="Add secondary endpoint…"
                  style={{ flex: 1, height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
                <button onClick={addSecondaryEndpoint} style={{ padding: '0 14px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add</button>
                <button onClick={() => setAddingEndpoint(false)} style={{ padding: '0 12px', borderRadius: 6, background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingEndpoint(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>+ Add endpoint</button>
            )}
          </div>

          <Field label="Study Design" value={clin.studyDesign} onChange={v => setClin({ studyDesign: v })} multiline placeholder="e.g. Prospective, multi-center, single-arm feasibility study" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {([['sampleSize', 'Sample Size (n)', ''], ['sites', 'Clinical Sites', ''], ['durationMonths', 'Duration (months)', '']] as const).map(([field, label]) => (
              <div key={field}>
                <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>{label}</label>
                <input type="number" min={0} value={clin[field] ?? ''}
                  onChange={e => setClin({ [field]: e.target.value ? Number(e.target.value) : null } as never)}
                  style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              </div>
            ))}
          </div>

          <Field label="Inclusion Criteria" value={clin.inclusionCriteria} onChange={v => setClin({ inclusionCriteria: v })} multiline placeholder="Who qualifies for enrollment?" />
          <Field label="Exclusion Criteria" value={clin.exclusionCriteria} onChange={v => setClin({ exclusionCriteria: v })} multiline placeholder="Who is excluded from enrollment?" />
          <Field label="Primary Sponsor / CRO" value={clin.primarySponsor} onChange={v => setClin({ primarySponsor: v })} placeholder="e.g. Sponsor company or CRO name" />
          <Field label="Notes" value={clin.notes} onChange={v => setClin({ notes: v })} multiline placeholder="IDE requirement? IRB strategy? KOL sites?" />
        </div>
      )}

      {section === 'ip' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {(['high', 'medium', 'low', 'cleared'] as Patent['ftoRisk'][]).map(risk => {
              const count = state.patents.filter(p => p.ftoRisk === risk).length;
              return (
                <div key={risk} style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: ftoColors[risk], fontFamily: 'var(--mono)', textTransform: 'capitalize', marginBottom: 2 }}>FTO {risk}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? 'var(--text)' : 'var(--text-4)' }}>{count}</div>
                </div>
              );
            })}
          </div>

          {state.patents.map(p => (
            <Card key={p.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{p.number || 'No. TBD'}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 7px', borderRadius: 99, background: ftoColors[p.ftoRisk] + '22', color: ftoColors[p.ftoRisk] }}>FTO {p.ftoRisk}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'var(--surface-2)', color: 'var(--text-3)' }}>{p.status}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.title || 'Untitled patent'}</p>
                  {p.assignee && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{p.assignee}</p>}
                  {p.notes && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{p.notes}</p>}
                </div>
                <button onClick={() => update({ ...state, patents: state.patents.filter(pp => pp.id !== p.id) })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </Card>
          ))}

          {state.patents.length === 0 && !addingPatent && <EmptyState label="No patents logged — add patents to assess FTO" />}

          {addingPatent ? (
            <Card style={{ marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <Field label="Patent Number" value={patentDraft.number ?? ''} onChange={v => setPatentDraft(d => ({ ...d, number: v }))} placeholder="US10,000,000" />
                <Field label="Assignee" value={patentDraft.assignee ?? ''} onChange={v => setPatentDraft(d => ({ ...d, assignee: v }))} placeholder="Company or inventor" />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Title" value={patentDraft.title ?? ''} onChange={v => setPatentDraft(d => ({ ...d, title: v }))} placeholder="Patent title" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                {([
                  ['status', 'Status', ['active', 'expired', 'pending', 'abandoned']],
                  ['relevance', 'Relevance', ['blocking', 'relevant', 'background', 'expired']],
                  ['ftoRisk', 'FTO Risk', ['high', 'medium', 'low', 'cleared']],
                ] as const).map(([field, label, opts]) => (
                  <div key={field}>
                    <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>{label}</label>
                    <select value={(patentDraft as never)[field]} onChange={e => setPatentDraft(d => ({ ...d, [field]: e.target.value }))}
                      style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 6, padding: '0 10px', color: 'var(--text)', fontSize: 13 }}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <Field label="Notes / FTO Analysis" value={patentDraft.notes ?? ''} onChange={v => setPatentDraft(d => ({ ...d, notes: v }))} multiline placeholder="Claim analysis, design-around options…" />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={addPatent} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add Patent</button>
                <button onClick={() => setAddingPatent(false)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
              </div>
            </Card>
          ) : (
            <button onClick={() => setAddingPatent(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px dashed var(--line)', marginTop: 4 }}>
              + Add patent
            </button>
          )}
        </div>
      )}

      {section === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Target Market Description" value={biz.targetMarketDescription} onChange={v => setBiz({ targetMarketDescription: v })} multiline placeholder="Who are you selling to? US hospitals? IDNs? Ambulatory surgery centers?" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Total Addressable Market" value={biz.totalAddressableMarket} onChange={v => setBiz({ totalAddressableMarket: v })} placeholder="e.g. $2.4B US annually" />
            <Field label="Serviceable Market" value={biz.serviceableMarket} onChange={v => setBiz({ serviceableMarket: v })} placeholder="Segment you can realistically capture" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Revenue Model" value={biz.revenueModel} onChange={v => setBiz({ revenueModel: v })} placeholder="Capital + disposable / SaaS / per-procedure" />
            <Field label="Average Selling Price" value={biz.averageSellingPrice} onChange={v => setBiz({ averageSellingPrice: v })} placeholder="e.g. $8,500 capital + $250/procedure" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Cost of Goods" value={biz.costOfGoods} onChange={v => setBiz({ costOfGoods: v })} placeholder="Target COGS at volume" />
            <Field label="Reimbursement Code" value={biz.reimbursementCode} onChange={v => setBiz({ reimbursementCode: v })} placeholder="CPT / DRG / new code strategy" />
          </div>
          <Field label="Payer Mix" value={biz.payerMix} onChange={v => setBiz({ payerMix: v })} placeholder="Medicare / commercial / self-pay split; coverage status" />
          <Field label="Go-to-Market Strategy" value={biz.goToMarketStrategy} onChange={v => setBiz({ goToMarketStrategy: v })} multiline placeholder="Direct sales, distribution, clinical champion strategy, geography…" />
          <Field label="Key Partnerships" value={biz.keyPartnerships} onChange={v => setBiz({ keyPartnerships: v })} multiline placeholder="Strategic partners, co-development, distribution agreements…" />
          <Field label="Competitive Advantage" value={biz.competitiveAdvantage} onChange={v => setBiz({ competitiveAdvantage: v })} multiline placeholder="What makes this defensible? IP, clinical data, workflow integration, switching costs…" />
        </div>
      )}
    </div>
  );
}

// ── Stat Mini ─────────────────────────────────────────────────────────────────

function StatMini({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: accent ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Phase badge ────────────────────────────────────────────────────────────────

const PHASES = [
  { key: 'identify',  label: 'Identify',  sub: 'Needs finding & filtering' },
  { key: 'invent',    label: 'Invent',    sub: 'Concept generation & screening' },
  { key: 'implement', label: 'Implement', sub: 'Strategy & commercialization' },
  { key: 'comply',    label: 'Comply',    sub: 'Standards & compliance tracking' },
] as const;

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BiodesignPage() {
  const [state, setStateRaw] = useState<BiodesignState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<'identify' | 'invent' | 'implement' | 'comply'>('identify');
  const [tab, setTab] = useState<'needs' | 'stakeholders' | 'concepts' | 'regulatory' | 'strategy' | 'profile' | 'standards'>('needs');

  useEffect(() => {
    setStateRaw(loadState());
    setLoaded(true);
  }, []);

  const update = useCallback((next: BiodesignState) => {
    setStateRaw(next);
    saveState(next);
  }, []);

  const phaseTabMap: Record<typeof phase, (typeof tab)[]> = {
    identify:  ['needs', 'stakeholders'],
    invent:    ['concepts'],
    implement: ['regulatory', 'strategy'],
    comply:    ['profile', 'standards'],
  };

  const tabMeta: Record<typeof tab, { label: string }> = {
    needs:        { label: 'Needs' },
    stakeholders: { label: 'Stakeholders' },
    concepts:     { label: 'Concepts' },
    regulatory:   { label: 'Regulatory' },
    strategy:     { label: 'Strategy' },
    profile:      { label: 'Device Profile' },
    standards:    { label: 'Standards' },
  };

  function switchPhase(p: typeof phase) {
    setPhase(p);
    setTab(phaseTabMap[p][0]);
  }

  if (!loaded) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 240, borderRight: '1px solid var(--line)', padding: '24px 0 32px',
        position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', marginBottom: 16 }}>
            <span style={{ fontSize: 18, color: 'var(--text-4)' }}>←</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--text-2)' }}>Ambient</span>
          </Link>
          <input
            value={state.projectName}
            onChange={e => update({ ...state, projectName: e.target.value })}
            placeholder="Project name…"
            style={{
              width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line)',
              color: 'var(--text)', fontSize: 14, fontWeight: 500, padding: '4px 0', outline: 'none',
              fontFamily: 'var(--sans)',
            }}
          />
          {state.indication && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{state.indication}</p>
          )}
        </div>

        {/* Phase nav */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PHASES.map((p, i) => {
            const active = phase === p.key;
            return (
              <button key={p.key} onClick={() => switchPhase(p.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                  borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: active ? 'rgba(45,114,210,0.12)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(45,114,210,0.25)' : 'transparent'}`,
                }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, flexShrink: 0,
                  background: active ? 'var(--accent)' : 'var(--surface-2)',
                  color: active ? '#fff' : 'var(--text-4)',
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--text)' : 'var(--text-2)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{p.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ margin: '20px 12px 0', borderTop: '1px solid var(--line)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', padding: '0 8px', marginBottom: 6 }}>Project Info</div>
          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Indication</label>
              <input value={state.indication} onChange={e => update({ ...state, indication: e.target.value })} placeholder="e.g. Heart failure monitoring"
                style={{ display: 'block', width: '100%', marginTop: 3, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 4, padding: '4px 7px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-4)' }}>
            <span>{state.needs.length} needs</span>
            <span>·</span>
            <span>{state.concepts.length} concepts</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Phase header */}
        <div style={{ borderBottom: '1px solid var(--line)', padding: '14px 28px 0' }}>
          <div style={{ display: 'flex', gap: 2, marginBottom: 0 }}>
            {phaseTabMap[phase].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: '8px 18px', fontSize: 13, cursor: 'pointer', borderRadius: '6px 6px 0 0',
                  background: tab === t ? 'var(--surface-1)' : 'transparent',
                  color: tab === t ? 'var(--text)' : 'var(--text-3)',
                  border: tab === t ? '1px solid var(--line)' : '1px solid transparent',
                  borderBottom: tab === t ? '1px solid var(--surface-1)' : '1px solid transparent',
                  marginBottom: tab === t ? -1 : 0,
                }}>{tabMeta[t].label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: 860 }}>
          {tab === 'needs'        && <NeedsTab state={state} update={update} />}
          {tab === 'stakeholders' && <StakeholdersTab state={state} update={update} />}
          {tab === 'concepts'     && <ConceptsTab state={state} update={update} />}
          {tab === 'regulatory'   && <RegulatoryTab state={state} update={update} />}
          {tab === 'strategy'     && <StrategyTab state={state} update={update} />}
          {tab === 'profile'      && <ProfileTab state={state} update={update} />}
          {tab === 'standards'    && <StandardsTab state={state} update={update} />}
        </div>
      </div>
    </div>
  );
}
