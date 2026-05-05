'use client';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BiodesignState, DEFAULT_STATE, NeedStatement, Stakeholder, Concept,
  Patent, NeedStatus, ConceptStatus, StakeholderRole, RegulatoryPathway,
  DeviceClass, needScore, conceptScore,
  NEED_STATUS_META, CONCEPT_STATUS_META, PATHWAY_META, STAKEHOLDER_ROLE_META,
} from '../data';
import { ProfileTab, StandardsTab } from '../comply';
import { ReimbursementTab } from '../reimburse';
import { TimelineTab } from '../timeline';
import { RisksTab } from '../risks';
import { CompetitiveTab } from '../competitive';
import { DesignControlsTab } from '../designcontrols';
import { IPFilingsTab } from '../ipfilings';
import { InvestorOnePager } from '../onepager';
import { AiDraftButton } from '../aiassist';
import { ProjectDashboard } from '../dashboard';
import { HistoryModal } from '../history';
import { FlowCanvas } from '../flowbg';
import { CommandPalette } from '../cmdpalette';
import { RegulatoryWizard } from '../regwizard';
import '../biodesign.css';

function getPhaseCompletion(state: BiodesignState, phaseKey: string): number {
  let pts: boolean[];
  switch (phaseKey) {
    case 'identify':
      pts = [
        state.needs.length > 0,
        state.needs.some(n => n.status === 'selected' || n.status === 'validated'),
        state.stakeholders.length > 0,
        state.competitors.length > 0,
      ];
      break;
    case 'invent':
      pts = [
        state.concepts.length > 0,
        state.concepts.length >= 2,
        state.concepts.some(c => c.status === 'selected' || c.status === 'development'),
      ];
      break;
    case 'implement':
      pts = [
        state.regulatory.pathway !== 'tbd',
        state.regulatory.deviceClass !== 'TBD',
        state.milestones.length > 0,
        state.risks.length > 0,
        (state.ipFilings ?? []).length > 0,
        (state.reimbursement.cptCodes.length > 0 || !!state.reimbursement.siteOfService),
      ];
      break;
    case 'comply':
      pts = [
        (state.comply.profile.targetMarkets ?? []).length > 0,
        Object.keys(state.comply.compliance ?? {}).length > 0,
        Object.values(state.comply.compliance ?? {}).some(s => s.status === 'complete'),
        state.designControls.inputs.length > 0,
      ];
      break;
    default:
      return 0;
  }
  return Math.round(pts.filter(Boolean).length / pts.length * 100);
}

// ── Storage ────────────────────────────────────────────────────────────────────

const LEGACY_KEY    = 'ambient-biodesign-v2';
const PROJECTS_KEY  = 'ambient-biodesign-projects';
const PROJECT_KEY   = (id: string) => `ambient-biodesign-project-${id}`;
const ACTIVE_KEY    = 'ambient-biodesign-active';

interface ProjectMeta {
  id: string;
  name: string;
  indication: string;
  createdAt: string;
  updatedAt: string;
}

function parseRaw(raw: string): BiodesignState {
  const parsed = JSON.parse(raw);
  return {
    ...DEFAULT_STATE,
    ...parsed,
    comply: { ...DEFAULT_STATE.comply, ...(parsed.comply ?? {}) },
    designControls: { ...DEFAULT_STATE.designControls, ...(parsed.designControls ?? {}) },
    milestones: parsed.milestones ?? [],
    risks: parsed.risks ?? [],
    competitors: parsed.competitors ?? [],
  };
}

function loadProjectData(id: string): BiodesignState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id));
    return raw ? parseRaw(raw) : DEFAULT_STATE;
  } catch { return DEFAULT_STATE; }
}

function loadProjectsAndActive(): { projects: ProjectMeta[]; activeId: string | null } {
  if (typeof window === 'undefined') return { projects: [], activeId: null };
  try {
    const existing = localStorage.getItem(PROJECTS_KEY);
    if (existing) {
      const projects: ProjectMeta[] = JSON.parse(existing);
      const activeId = localStorage.getItem(ACTIVE_KEY) ?? projects[0]?.id ?? null;
      return { projects, activeId };
    }
    // Migrate legacy single-project save
    const legacy = localStorage.getItem(LEGACY_KEY) ?? localStorage.getItem('ambient-biodesign-v1');
    if (legacy) {
      const state = parseRaw(legacy);
      const id = uid();
      const meta: ProjectMeta = { id, name: state.projectName || 'Untitled Project', indication: state.indication, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([meta]));
      localStorage.setItem(PROJECT_KEY(id), legacy);
      localStorage.setItem(ACTIVE_KEY, id);
      return { projects: [meta], activeId: id };
    }
    return { projects: [], activeId: null };
  } catch { return { projects: [], activeId: null }; }
}

function persistProject(id: string, state: BiodesignState, projects: ProjectMeta[]): ProjectMeta[] {
  localStorage.setItem(PROJECT_KEY(id), JSON.stringify(state));
  const updated = projects.map(p => p.id === id
    ? { ...p, name: state.projectName || 'Untitled Project', indication: state.indication, updatedAt: new Date().toISOString() }
    : p);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  return updated;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

// ── Sub-components ─────────────────────────────────────────────────────────────

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 3, fontSize: 10, fontWeight: 600,
      background: bg, color,
      fontFamily: 'var(--mono)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function ScoreBar({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value === null) return <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>—</span>;
  const pct = (value / max) * 100;
  const color = pct >= 70 ? '#3DCC91' : pct >= 40 ? '#d9a020' : '#c04040';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 1, background: 'var(--line-strong)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 1, background: color, transition: 'width 0.3s' }} />
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

const fieldInputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
  borderRadius: 2, padding: '9px 12px', color: 'var(--text)', fontSize: 14,
  fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical',
};

function Field({
  label, value, onChange, multiline = false, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={fieldInputStyle} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...fieldInputStyle, height: 38, resize: undefined }} />
      }
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
      <h2 style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        color: 'var(--text-3)', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>{title}</h2>
      {subtitle && <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--line)',
      borderRadius: 2, padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', color: 'var(--text-4)', fontSize: 12,
      border: '1px dashed var(--line)', borderRadius: 2,
      fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
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
    {/* Identify hero */}
    <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 28, borderRadius: 4, background: 'rgba(14,22,34,0.55)', border: '1px solid rgba(180,215,240,0.07)', minHeight: state.needs.length === 0 && !adding ? 268 : 114 }}>
      <FlowCanvas accent="#E8A852" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 18%, rgba(14,22,34,0.94) 78%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: state.needs.length === 0 && !adding ? '38px 38px 34px' : '22px 30px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#E8A852', marginBottom: 12 }}>
          01 / Identify
        </div>
        {state.needs.length === 0 && !adding ? (
          <>
            <h2 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
              Clinical Need<br/>Discovery
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.8, maxWidth: 460 }}>
              Observe before inventing. Capture unmet clinical needs using the Stanford Biodesign framework before exploring solutions — needs drive concepts, regulatory strategy, and market fit.
            </p>
            <div style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(232,168,82,0.62)', fontFamily: 'var(--mono)', marginBottom: 26 }}>
              "A way to [problem] for [population] in [setting] so that [outcome]."
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <AiDraftButton
                type="need"
                context={{ indication: state.indication }}
                onResult={r => { setDraft(d => ({ ...d, ...r })); setAdding(true); }}
                label="Draft first need"
              />
              <button onClick={() => setAdding(true)} style={{ padding: '6px 18px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: 'var(--text-3)', border: '1px solid rgba(180,215,240,0.10)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Add manually
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Clinical Need Discovery</h2>
              <p style={{ margin: '5px 0 0', fontSize: 11, color: 'rgba(232,168,82,0.58)', fontFamily: 'var(--mono)', fontStyle: 'italic' }}>
                "A way to [problem] for [population] in [setting] so that [outcome]."
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--mono)', flexShrink: 0 }}>
              <span><strong style={{ color: 'var(--text-2)', fontSize: 18, fontWeight: 700 }}>{state.needs.length}</strong><span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>needs</span></span>
              <span><strong style={{ color: '#3DCC91', fontSize: 18, fontWeight: 700 }}>{state.needs.filter(n => n.status === 'selected').length}</strong><span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>selected</span></span>
            </div>
          </div>
        )}
      </div>
    </div>

      {state.needs.map(n => {
        const score = needScore(n);
        const isOpen = expanded === n.id;
        const meta = NEED_STATUS_META[n.status];
        return (
          <Card key={n.id} style={{ marginBottom: 6 }}>
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
              onClick={() => setExpanded(isOpen ? null : n.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
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
              <span style={{ color: 'var(--text-4)', fontSize: 14, marginTop: 2, fontFamily: 'var(--mono)' }}>{isOpen ? '▲' : '▼'}</span>
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
                    <span style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Status</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {statusOptions.map(s => {
                        const m = NEED_STATUS_META[s];
                        return (
                          <button key={s} onClick={() => updateNeed(n.id, { status: s })}
                            style={{
                              padding: '3px 10px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                              background: n.status === s ? m.bg : 'transparent',
                              color: n.status === s ? m.color : 'var(--text-4)',
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
                  <div style={{ marginBottom: 10, fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Need Filtering Criteria</div>
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
                      padding: '5px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer',
                      background: state.selectedNeedId === n.id ? 'rgba(61,204,145,0.12)' : 'var(--surface-2)',
                      color: state.selectedNeedId === n.id ? '#3DCC91' : 'var(--text-2)',
                      border: `1px solid ${state.selectedNeedId === n.id ? '#3DCC9144' : 'var(--line)'}`,
                    }}
                  >
                    {state.selectedNeedId === n.id ? '✓ Active need' : 'Set as active need'}
                  </button>
                  <button onClick={() => deleteNeed(n.id)}
                    style={{ padding: '5px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
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
          <div style={{ marginBottom: 12 }}>
            <AiDraftButton
              type="need"
              context={{ problem: draft.problem, population: draft.population, setting: draft.setting, outcome: draft.outcome, indication: state.indication }}
              onResult={r => setDraft(d => ({ ...d, ...r }))}
              label="Draft need statement"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <Field label="Problem" value={draft.problem} onChange={v => setDraft(d => ({ ...d, problem: v }))} placeholder="cannot do X / pain point" />
            <Field label="Population" value={draft.population} onChange={v => setDraft(d => ({ ...d, population: v }))} placeholder="patients with Y" />
            <Field label="Setting" value={draft.setting} onChange={v => setDraft(d => ({ ...d, setting: v }))} placeholder="during procedure / at home" />
            <Field label="Desired Outcome" value={draft.outcome} onChange={v => setDraft(d => ({ ...d, outcome: v }))} placeholder="reduce X, improve Y" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 14, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 2 }}>
            "A way to <strong style={{ color: 'var(--text-2)' }}>{draft.problem || '…'}</strong> for <strong style={{ color: 'var(--text-2)' }}>{draft.population || '…'}</strong> in <strong style={{ color: 'var(--text-2)' }}>{draft.setting || '…'}</strong> so that <strong style={{ color: 'var(--text-2)' }}>{draft.outcome || '…'}</strong>"
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addNeed} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add Need</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </Card>
      ) : state.needs.length > 0 ? (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 4, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          + Add need statement
        </button>
      ) : null}
    </div>
  );
}

function ObservationsEditor({ observations, onAdd, onRemove }: { observations: string[]; onAdd: (s: string) => void; onRemove: (i: number) => void }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Observations</div>
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
          style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '6px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none' }}
        />
        <button onClick={() => { if (val.trim()) { onAdd(val); setVal(''); } }}
          style={{ padding: '6px 12px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--line)' }}>
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
    {/* Identify hero — Stakeholders */}
    <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 24, borderRadius: 4, background: 'rgba(14,22,34,0.55)', border: '1px solid rgba(180,215,240,0.07)', minHeight: state.stakeholders.length === 0 && !adding ? 220 : 110 }}>
      <FlowCanvas accent="#E8A852" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 18%, rgba(14,22,34,0.94) 78%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: state.stakeholders.length === 0 && !adding ? '34px 34px 28px' : '20px 28px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#E8A852', marginBottom: 10 }}>01 / Identify · Stakeholders</div>
        {state.stakeholders.length === 0 && !adding ? (
          <>
            <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Stakeholder Mapping</h2>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.8, maxWidth: 460 }}>
              Map everyone who influences adoption, reimbursement, and outcomes. Competing priorities define your design constraints before a solution exists.
            </p>
            <button onClick={() => setAdding(true)} style={{ padding: '7px 20px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)', border: '1px solid rgba(180,215,240,0.12)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Add stakeholder
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Stakeholder Mapping</h2>
            <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--mono)', flexShrink: 0 }}>
              <span><strong style={{ color: 'var(--text-2)', fontSize: 18, fontWeight: 700 }}>{state.stakeholders.length}</strong><span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>mapped</span></span>
              <span><strong style={{ color: '#E8A852', fontSize: 18, fontWeight: 700 }}>{new Set(state.stakeholders.map(s => s.role)).size}</strong><span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>roles</span></span>
            </div>
          </div>
        )}
      </div>
    </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 20 }}>
        {roles.map(role => {
          const count = state.stakeholders.filter(s => s.role === role).length;
          const meta = STAKEHOLDER_ROLE_META[role];
          return (
            <div key={role} style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
              <div style={{ fontSize: 10, color: meta.color, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{meta.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? 'var(--text)' : 'var(--text-4)' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {state.stakeholders.map(s => {
        const meta = STAKEHOLDER_ROLE_META[s.role];
        const isOpen = expanded === s.id;
        return (
          <Card key={s.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : s.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Badge label={meta.label} bg={meta.color + '1e'} color={meta.color} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
                  <span>Influence {s.influence}/5</span>
                  <span>Interest {s.interest}/5</span>
                </div>
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 14, fontFamily: 'var(--mono)' }}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Name / Title" value={s.name} onChange={v => updateStakeholder(s.id, { name: v })} />
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>Role</label>
                    <select value={s.role} onChange={e => updateStakeholder(s.id, { role: e.target.value as StakeholderRole })}
                      style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13 }}>
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
                    style={{ padding: '5px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
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
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>Role</label>
              <select value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value as StakeholderRole }))}
                style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13 }}>
                {roles.map(r => <option key={r} value={r}>{STAKEHOLDER_ROLE_META[r].label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addStakeholder} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 4, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
    {/* Invent hero — Concepts */}
    <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 24, borderRadius: 4, background: 'rgba(14,22,34,0.55)', border: '1px solid rgba(160,126,232,0.10)', minHeight: state.concepts.length === 0 && !adding ? 248 : 110 }}>
      <FlowCanvas accent="#A07EE8" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 18%, rgba(14,22,34,0.94) 78%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: state.concepts.length === 0 && !adding ? '36px 36px 30px' : '20px 28px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#A07EE8', marginBottom: 12 }}>02 / Invent</div>
        {state.concepts.length === 0 && !adding ? (
          <>
            <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.025em' }}>
              Concept Generation
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.8, maxWidth: 460 }}>
              From validated needs to creative solutions. Generate diverse device concepts and screen them rigorously before committing resources to development.
            </p>
            {state.selectedNeedId && (() => {
              const n = state.needs.find(n => n.id === state.selectedNeedId);
              return n ? (
                <div style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(160,126,232,0.6)', fontFamily: 'var(--mono)', marginBottom: 22 }}>
                  "A way to {n.problem} for {n.population}{n.setting ? ` in ${n.setting}` : ''} so that {n.outcome}"
                </div>
              ) : null;
            })()}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <AiDraftButton
                type="concept"
                context={{ indication: state.indication, need: state.needs.find(n => n.id === state.selectedNeedId)?.problem ?? '' }}
                onResult={r => { setDraft(d => ({ ...d, ...r })); setAdding(true); }}
                label="Draft first concept"
              />
              <button onClick={() => setAdding(true)} style={{ padding: '6px 18px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: 'var(--text-3)', border: '1px solid rgba(160,126,232,0.15)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Add manually
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Concept Generation</h2>
              {state.selectedNeedId && (() => {
                const n = state.needs.find(n => n.id === state.selectedNeedId);
                return n ? <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(160,126,232,0.55)', fontFamily: 'var(--mono)', fontStyle: 'italic' }}>Active: {n.problem.slice(0, 55)}{n.problem.length > 55 ? '…' : ''}</p> : null;
              })()}
            </div>
            <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--mono)', flexShrink: 0 }}>
              <span><strong style={{ color: 'var(--text-2)', fontSize: 18, fontWeight: 700 }}>{state.concepts.length}</strong><span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>concepts</span></span>
              <span><strong style={{ color: '#A07EE8', fontSize: 18, fontWeight: 700 }}>{state.concepts.filter(c => c.status === 'development' || c.status === 'selected').length}</strong><span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>active</span></span>
            </div>
          </div>
        )}
      </div>
    </div>

      {sorted.map(c => {
        const score = conceptScore(c);
        const meta = CONCEPT_STATUS_META[c.status];
        const isOpen = expanded === c.id;
        return (
          <Card key={c.id} style={{ marginBottom: 6, opacity: c.status === 'eliminated' ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : c.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Badge label={meta.label} bg={meta.bg} color={meta.color} />
                  {score !== null && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>score {score}/5</span>}
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.title}</p>
                {c.description && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '…' : ''}</p>}
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 14, marginTop: 2, fontFamily: 'var(--mono)' }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Concept Name" value={c.title} onChange={v => updateConcept(c.id, { title: v })} />
                <Field label="Description" value={c.description} onChange={v => updateConcept(c.id, { description: v })} multiline placeholder="What does this solution do?" />
                <Field label="Mechanism / How It Works" value={c.mechanism} onChange={v => updateConcept(c.id, { mechanism: v })} multiline placeholder="Describe the mechanism of action or technical approach" />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Stage</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {statusOptions.map(s => {
                        const m = CONCEPT_STATUS_META[s];
                        return (
                          <button key={s} onClick={() => updateConcept(c.id, { status: s })}
                            style={{
                              padding: '3px 10px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                              background: c.status === s ? m.bg : 'transparent',
                              color: c.status === s ? m.color : 'var(--text-4)',
                              border: `1px solid ${c.status === s ? m.color + '44' : 'var(--line)'}`,
                            }}>{m.label}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 12 }}>Concept Screening</div>
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
                    style={{ padding: '5px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>
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
          <div style={{ marginBottom: 12 }}>
            <AiDraftButton
              type="concept"
              context={{
                title: draft.title, description: draft.description, mechanism: draft.mechanism,
                indication: state.indication,
                need: (() => { const n = state.needs.find(x => x.id === state.selectedNeedId); return n ? `${n.problem} for ${n.population}` : ''; })(),
              }}
              onResult={r => setDraft(d => ({ ...d, ...r }))}
              label="Draft concept"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <Field label="Concept Name" value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} placeholder="Short name for this solution idea" />
            <Field label="Description" value={draft.description} onChange={v => setDraft(d => ({ ...d, description: v }))} multiline placeholder="Brief description of what it does" />
            <Field label="Mechanism" value={draft.mechanism} onChange={v => setDraft(d => ({ ...d, mechanism: v }))} multiline placeholder="How does it work?" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addConcept} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add Concept</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 4, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, marginBottom: 24, height: 114 }}>
        <FlowCanvas accent="#52E8B4" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)' }} />
        <div style={{ position: 'relative', padding: '22px 28px' }}>
          <div style={{ fontSize: 9, color: '#52E8B4', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--mono)', marginBottom: 8 }}>03 / Implement · Regulatory</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Regulatory Strategy</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>FDA classification, pathway, and submission plan.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Device Class</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {deviceClasses.map(cls => (
              <button key={cls} onClick={() => set({ deviceClass: cls })}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 2, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--mono)',
                  background: reg.deviceClass === cls ? 'rgba(45,114,210,0.16)' : 'var(--surface-1)',
                  color: reg.deviceClass === cls ? 'var(--accent)' : 'var(--text-3)',
                  border: `1px solid ${reg.deviceClass === cls ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
                }}>{cls}</button>
            ))}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>{classInfo[reg.deviceClass]}</p>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Pathway</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {pathways.map(p => {
              const meta = PATHWAY_META[p];
              return (
                <button key={p} onClick={() => set({ pathway: p })}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 2, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)',
                    background: reg.pathway === p ? meta.color + '1e' : 'var(--surface-1)',
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

        {/* FDA database quick links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={reg.predicateNumber ? `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${reg.predicateNumber.replace(/\s/g, '')}` : 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm'}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)', textDecoration: 'none', padding: '4px 10px', border: '1px solid rgba(82,192,232,0.3)', borderRadius: 2, background: 'rgba(82,192,232,0.06)' }}
          >
            {reg.predicateNumber ? `View ${reg.predicateNumber} on FDA ↗` : 'Search 510(k) DB ↗'}
          </a>
          <a
            href={reg.productCode ? `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?ID=${reg.productCode}` : 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm'}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)', textDecoration: 'none', padding: '4px 10px', border: '1px solid rgba(82,192,232,0.3)', borderRadius: 2, background: 'rgba(82,192,232,0.06)' }}
          >
            {reg.productCode ? `Product Code ${reg.productCode} ↗` : 'Product Code DB ↗'}
          </a>
          <a href="https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--line)', borderRadius: 2 }}>
            FDA 510(k) Search ↗
          </a>
        </div>

        <AiDraftButton
          type="regulatory"
          context={{ deviceClass: reg.deviceClass, pathway: reg.pathway, predicateDevice: reg.predicateDevice, indication: state.indication, intendedUse: reg.intendedUse, indicationsForUse: reg.indicationsForUse }}
          onResult={r => set({ intendedUse: r.intendedUse ?? reg.intendedUse, indicationsForUse: r.indicationsForUse ?? reg.indicationsForUse, substantialEquivalence: r.substantialEquivalence ?? reg.substantialEquivalence })}
          label="Draft regulatory language"
        />

        <Field label="Intended Use" value={reg.intendedUse} onChange={v => set({ intendedUse: v })} multiline placeholder="Describe the intended use of the device…" />
        <Field label="Indications for Use" value={reg.indicationsForUse} onChange={v => set({ indicationsForUse: v })} multiline placeholder="Specific conditions, populations, anatomical sites…" />
        <Field label="Substantial Equivalence Argument" value={reg.substantialEquivalence} onChange={v => set({ substantialEquivalence: v })} multiline placeholder="Same intended use + same technological characteristics, or different tech w/ no new safety questions…" />

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Clinical Data Required</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['not required', 'bench only', 'limited clinical', 'pivotal trial'] as const).map(opt => (
              <button key={opt} onClick={() => set({ clinicalData: opt })}
                style={{
                  padding: '6px 12px', borderRadius: 2, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: reg.clinicalData === opt ? 'rgba(45,114,210,0.16)' : 'var(--surface-1)',
                  color: reg.clinicalData === opt ? 'var(--accent)' : 'var(--text-3)',
                  border: `1px solid ${reg.clinicalData === opt ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
                }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>Est. Timeline (months)</label>
            <input type="number" min={1} max={120}
              value={reg.estimatedTimelineMonths ?? ''} onChange={e => set({ estimatedTimelineMonths: e.target.value ? Number(e.target.value) : null })}
              style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
          <Field label="Estimated Cost" value={reg.estimatedCost} onChange={v => set({ estimatedCost: v })} placeholder="e.g. $200K–$500K" />
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Special Controls</div>
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
                style={{ flex: 1, height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              <button onClick={addControl} style={{ padding: '0 14px', borderRadius: 2, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add</button>
              <button onClick={() => { setAddingControl(false); setControlDraft(''); }} style={{ padding: '0 12px', borderRadius: 2, background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
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

  const reg = state.regulatory;
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
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, marginBottom: 24, height: 114 }}>
        <FlowCanvas accent="#52E8B4" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)' }} />
        <div style={{ position: 'relative', padding: '22px 28px' }}>
          <div style={{ fontSize: 9, color: '#52E8B4', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--mono)', marginBottom: 8 }}>03 / Implement · Strategy</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Implementation Strategy</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>Clinical evidence, IP landscape, and business model.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {(['clinical', 'ip', 'business'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            style={{
              padding: '7px 16px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
              background: section === s ? 'rgba(45,114,210,0.16)' : 'var(--surface-1)',
              color: section === s ? 'var(--accent)' : 'var(--text-3)',
              border: `1px solid ${section === s ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
            }}>{s === 'ip' ? 'IP Landscape' : s === 'clinical' ? 'Clinical Plan' : 'Business Model'}</button>
        ))}
      </div>

      {section === 'clinical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AiDraftButton
            type="clinical"
            context={{ indication: state.indication, deviceClass: reg.deviceClass, pathway: reg.pathway, primaryEndpoint: clin.primaryEndpoint, studyDesign: clin.studyDesign }}
            onResult={r => setClin({ primaryEndpoint: r.primaryEndpoint ?? clin.primaryEndpoint, studyDesign: r.studyDesign ?? clin.studyDesign, inclusionCriteria: r.inclusionCriteria ?? clin.inclusionCriteria, exclusionCriteria: r.exclusionCriteria ?? clin.exclusionCriteria })}
            label="Draft clinical plan"
          />
          <Field label="Primary Endpoint" value={clin.primaryEndpoint} onChange={v => setClin({ primaryEndpoint: v })} multiline placeholder="e.g. Reduction in 30-day readmission rate vs. standard of care (non-inferiority margin 5%)" />

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Secondary Endpoints</div>
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
                  style={{ flex: 1, height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
                <button onClick={addSecondaryEndpoint} style={{ padding: '0 14px', borderRadius: 2, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Add</button>
                <button onClick={() => setAddingEndpoint(false)} style={{ padding: '0 12px', borderRadius: 2, background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingEndpoint(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>+ Add endpoint</button>
            )}
          </div>

          <Field label="Study Design" value={clin.studyDesign} onChange={v => setClin({ studyDesign: v })} multiline placeholder="e.g. Prospective, multi-center, single-arm feasibility study" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {([['sampleSize', 'Sample Size (n)', ''], ['sites', 'Clinical Sites', ''], ['durationMonths', 'Duration (months)', '']] as const).map(([field, label]) => (
              <div key={field}>
                <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>{label}</label>
                <input type="number" min={0} value={clin[field] ?? ''}
                  onChange={e => setClin({ [field]: e.target.value ? Number(e.target.value) : null } as never)}
                  style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
            {(['high', 'medium', 'low', 'cleared'] as Patent['ftoRisk'][]).map(risk => {
              const count = state.patents.filter(p => p.ftoRisk === risk).length;
              return (
                <div key={risk} style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
                  <div style={{ fontSize: 10, color: ftoColors[risk], fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>FTO {risk}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: count > 0 ? 'var(--text)' : 'var(--text-4)' }}>{count}</div>
                </div>
              );
            })}
          </div>

          {state.patents.map(p => (
            <Card key={p.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>{p.number || 'No. TBD'}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', borderRadius: 3, background: ftoColors[p.ftoRisk] + '1e', color: ftoColors[p.ftoRisk], textTransform: 'uppercase', letterSpacing: '0.06em' }}>FTO {p.ftoRisk}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.status}</span>
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
                    <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 5 }}>{label}</label>
                    <select value={(patentDraft as never)[field]} onChange={e => setPatentDraft(d => ({ ...d, [field]: e.target.value }))}
                      style={{ width: '100%', height: 34, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 13 }}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <Field label="Notes / FTO Analysis" value={patentDraft.notes ?? ''} onChange={v => setPatentDraft(d => ({ ...d, notes: v }))} multiline placeholder="Claim analysis, design-around options…" />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={addPatent} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>Add Patent</button>
                <button onClick={() => setAddingPatent(false)} style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
              </div>
            </Card>
          ) : (
            <button onClick={() => setAddingPatent(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 4, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
    <div style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: accent ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3, fontFamily: 'var(--mono)' }}>{label}</div>
    </div>
  );
}

// ── Phase definitions ─────────────────────────────────────────────────────────

const PHASES = [
  { key: 'identify',  label: 'Identify',  sub: 'Needs finding & filtering',      color: '#E8A852' },
  { key: 'invent',    label: 'Invent',    sub: 'Concept generation & screening',  color: '#A07EE8' },
  { key: 'implement', label: 'Implement', sub: 'Strategy & commercialization',    color: '#52E8B4' },
  { key: 'comply',    label: 'Comply',    sub: 'Standards & compliance tracking', color: '#E87252' },
] as const;

// ── Main Page ─────────────────────────────────────────────────────────────────

interface AuthUser { email: string; firstName: string | null; lastName: string | null; profilePictureUrl: string | null; }

export default function BiodesignPage() {
  const [state, setStateRaw] = useState<BiodesignState>(DEFAULT_STATE);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<'identify' | 'invent' | 'implement' | 'comply'>('identify');
  const [tab, setTab] = useState<'needs' | 'stakeholders' | 'concepts' | 'regulatory' | 'strategy' | 'reimbursement' | 'profile' | 'standards' | 'competitors' | 'timeline' | 'risks' | 'designcontrols' | 'ipfilings'>('needs');
  const [showOnePager, setShowOnePager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [view, setView] = useState<'dashboard' | 'workspace'>('workspace');
  const [shareToast, setShareToast] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Stable refs for use inside callbacks without stale closures
  const authUserRef = useRef<AuthUser | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { authUserRef.current = authUser; }, [authUser]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // ── Cloud sync helpers ────────────────────────────────────────────────────────

  async function cloudSave(projectId: string, projectState: BiodesignState) {
    setSyncStatus('saving');
    try {
      const res = await fetch('/api/biodesign/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, state: projectState }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus(s => s === 'saved' ? 'idle' : s), 2500);
    } catch {
      setSyncStatus('error');
    }
  }

  async function cloudDelete(projectId: string) {
    try {
      await fetch(`/api/biodesign/projects/${projectId}`, { method: 'DELETE' });
    } catch { /* best-effort */ }
  }

  // ── Bootstrap: auth + cloud merge ─────────────────────────────────────────────

  useEffect(() => {
    // 1. Load local state immediately
    const { projects: localPs, activeId: localAid } = loadProjectsAndActive();
    let localProjects = localPs;
    let initialActiveId = localAid;

    if (!localAid) {
      const id = uid();
      const meta: ProjectMeta = { id, name: '', indication: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      localProjects = [meta];
      initialActiveId = id;
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(localProjects));
      localStorage.setItem(ACTIVE_KEY, id);
    }

    setProjects(localProjects);
    setActiveId(initialActiveId);
    setStateRaw(initialActiveId ? loadProjectData(initialActiveId) : DEFAULT_STATE);
    setLoaded(true);

    // 2. Fetch auth user
    fetch('/api/biodesign/me')
      .then(r => r.json())
      .then(async d => {
        if (!d.user) return;
        setAuthUser(d.user);
        authUserRef.current = d.user;

        // 3. Merge cloud projects
        try {
          const cloudRes = await fetch('/api/biodesign/projects');
          if (!cloudRes.ok) return;
          const { projects: cloudMetas } = await cloudRes.json() as {
            projects: { id: string; name: string; indication: string; updatedAt: string; blobUrl: string }[]
          };

          const localIds = new Set(localProjects.map(p => p.id));
          const cloudIds = new Set(cloudMetas.map(p => p.id));

          // Download cloud projects not yet in localStorage
          const toDownload = cloudMetas.filter(p => !localIds.has(p.id));
          for (const meta of toDownload) {
            try {
              const stateRes = await fetch(meta.blobUrl, { cache: 'no-store' });
              const cloudState = await stateRes.json();
              const parsed = parseRaw(JSON.stringify(cloudState));
              const pm: ProjectMeta = { id: meta.id, name: meta.name, indication: meta.indication, createdAt: meta.updatedAt, updatedAt: meta.updatedAt };
              localProjects = [...localProjects, pm];
              localStorage.setItem(PROJECT_KEY(meta.id), JSON.stringify(parsed));
            } catch { /* skip bad blob */ }
          }

          // Upload local projects not yet in cloud
          const toUpload = localProjects.filter(p => !cloudIds.has(p.id));
          for (const pm of toUpload) {
            const s = loadProjectData(pm.id);
            fetch('/api/biodesign/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pm.id, state: s }) }).catch(() => {});
          }

          if (toDownload.length > 0) {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(localProjects));
            setProjects(localProjects);
          }
        } catch { /* cloud unavailable, stay local */ }
      })
      .catch(() => {});
  }, []);

  // ── State update + debounced cloud save ────────────────────────────────────────

  const update = useCallback((next: BiodesignState) => {
    setStateRaw(next);
    setActiveId(id => {
      if (!id) return id;
      setProjects(ps => persistProject(id, next, ps));
      localStorage.setItem(ACTIVE_KEY, id);

      // Debounced cloud save
      if (authUserRef.current) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSyncStatus('saving');
        saveTimerRef.current = setTimeout(() => cloudSave(id, next), 2000);
      }

      return id;
    });
  }, []);

  function newProject() {
    const id = uid();
    const meta: ProjectMeta = { id, name: '', indication: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setProjects(ps => {
      const updated = [...ps, meta];
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
    setStateRaw(DEFAULT_STATE);
    setPhase('identify');
    setTab('needs');
    if (authUserRef.current) cloudSave(id, DEFAULT_STATE);
  }

  function deleteProject(id: string) {
    setProjects(ps => {
      const updated = ps.filter(p => p.id !== id);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
      localStorage.removeItem(PROJECT_KEY(id));
      return updated;
    });
    if (authUserRef.current) cloudDelete(id);
    // Switch to another project or create new
    setActiveId(prev => {
      if (prev !== id) return prev;
      const remaining = projects.filter(p => p.id !== id);
      if (remaining.length > 0) {
        const next = remaining[0];
        localStorage.setItem(ACTIVE_KEY, next.id);
        setStateRaw(loadProjectData(next.id));
        return next.id;
      }
      const newId = uid();
      const meta: ProjectMeta = { id: newId, name: '', indication: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setProjects([meta]);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([meta]));
      localStorage.setItem(ACTIVE_KEY, newId);
      setStateRaw(DEFAULT_STATE);
      return newId;
    });
    setPhase('identify');
    setTab('needs');
  }

  function switchProject(id: string) {
    // Auto-checkpoint current project before switching (if authenticated and has content)
    if (authUserRef.current && activeIdRef.current && activeIdRef.current !== id) {
      const cur = loadProjectData(activeIdRef.current);
      if (cur.needs.length > 0 || cur.concepts.length > 0) {
        fetch(`/api/biodesign/projects/${activeIdRef.current}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: cur }),
        }).catch(() => {});
      }
    }
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
    setStateRaw(loadProjectData(id));
    setSyncStatus('idle');
    setPhase('identify');
    setTab('needs');
  }

  async function shareProject(id: string): Promise<string | null> {
    const projectState = loadProjectData(id);
    try {
      const res = await fetch('/api/biodesign/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: projectState }),
      });
      const { url } = await res.json();
      return url ?? null;
    } catch { return null; }
  }

  const phaseTabMap: Record<typeof phase, (typeof tab)[]> = {
    identify:  ['needs', 'stakeholders', 'competitors'],
    invent:    ['concepts'],
    implement: ['regulatory', 'strategy', 'reimbursement', 'timeline', 'risks', 'ipfilings'],
    comply:    ['profile', 'standards', 'designcontrols'],
  };

  const tabMeta: Record<typeof tab, { label: string; icon: string }> = {
    needs:          { label: 'Needs',          icon: '◎' },
    stakeholders:   { label: 'Stakeholders',   icon: '◉' },
    competitors:    { label: 'Competitive',    icon: '⊡' },
    concepts:       { label: 'Concepts',       icon: '◆' },
    regulatory:     { label: 'Regulatory',     icon: '⬡' },
    strategy:       { label: 'Strategy',       icon: '▸' },
    reimbursement:  { label: 'Reimbursement',  icon: '⊛' },
    timeline:       { label: 'Timeline',       icon: '⊙' },
    risks:          { label: 'Risks',          icon: '△' },
    profile:        { label: 'Device Profile', icon: '▣' },
    standards:      { label: 'Standards',      icon: '≡' },
    designcontrols: { label: 'Design Controls',icon: '⊞' },
    ipfilings:      { label: 'IP Portfolio',   icon: '◈' },
  };

  function switchPhase(p: typeof phase) {
    setPhase(p);
    setTab(phaseTabMap[p][0]);
  }

  useEffect(() => {
    if (view !== 'workspace') return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(p => !p);
        return;
      }
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      const tabs = phaseTabMap[phase];
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= tabs.length) {
        e.preventDefault();
        setTab(tabs[num - 1]);
        return;
      }
      if (e.key === '[') {
        const idx = PHASES.findIndex(p => p.key === phase);
        if (idx > 0) switchPhase(PHASES[idx - 1].key as typeof phase);
      }
      if (e.key === ']') {
        const idx = PHASES.findIndex(p => p.key === phase);
        if (idx < PHASES.length - 1) switchPhase(PHASES[idx + 1].key as typeof phase);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return null;

  if (view === 'dashboard') {
    return (
      <>
        <ProjectDashboard
          projects={projects}
          authUser={authUser}
          syncStatus={syncStatus}
          onOpen={id => { switchProject(id); setView('workspace'); }}
          onNew={() => { newProject(); setView('workspace'); }}
          onDelete={deleteProject}
          onShare={shareProject}
        />
        {showHistory && <HistoryModal projectId={activeId} currentState={state} onRestore={s => { update(s); setShowHistory(false); }} onClose={() => setShowHistory(false)} />}
      </>
    );
  }

  return (
    <>
    <div className="biodesign-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 236, borderRight: '1px solid var(--line)',
        background: 'var(--sidebar-bg)',
        padding: '24px 0 32px',
        position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo / project */}
        <div style={{ padding: '0 20px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Link href="/biodesign" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="brand-name">Ambient <em>Intelligence</em></span>
            </Link>
            <button onClick={() => setView('dashboard')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', padding: 0,
            }}>⊞ All</button>
          </div>
          <input
            value={state.projectName}
            onChange={e => update({ ...state, projectName: e.target.value })}
            placeholder="Project name…"
            style={{
              width: '100%', background: 'transparent', border: 'none',
              borderBottom: '1px solid var(--line-strong)',
              color: 'var(--text)', fontSize: 13, fontWeight: 600, padding: '4px 0', outline: 'none',
              fontFamily: 'var(--mono)',
            }}
          />
          {state.indication && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{state.indication}</p>
          )}
        </div>

        {/* Phase nav */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PHASES.map((p, i) => {
            const active = phase === p.key;
            return (
              <button key={p.key} onClick={() => switchPhase(p.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 20px',
                  paddingLeft: active ? 17 : 20,
                  borderRadius: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: active ? p.color + '10' : 'transparent',
                  border: 'none',
                  borderLeft: active ? `3px solid ${p.color}` : '3px solid transparent',
                  transition: 'background 0.1s',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, flexShrink: 0,
                  background: active ? p.color : 'var(--surface-2)',
                  color: active ? '#0E1622' : 'var(--text-4)',
                  letterSpacing: 0,
                }}>{i + 1}</div>
                <div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', fontFamily: 'var(--mono)',
                    color: active ? 'var(--text)' : 'var(--text-3)',
                  }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>{p.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Project info */}
        <div style={{ margin: '24px 0 0', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--mono)', padding: '0 20px', marginBottom: 8 }}>Project Info</div>
          <div style={{ padding: '0 20px' }}>
            <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>Indication</label>
            <input value={state.indication} onChange={e => update({ ...state, indication: e.target.value })} placeholder="e.g. Heart failure monitoring"
              style={{ display: 'block', width: '100%', marginTop: 4, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '5px 8px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
        </div>

        {/* Projects list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '20px 0 0', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--mono)' }}>Projects</span>
              {authUser && syncStatus !== 'idle' && (
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: syncStatus === 'saving' ? '#d9a020' : syncStatus === 'saved' ? '#3DCC91' : '#c04040',
                }}>
                  {syncStatus === 'saving' ? '↑ Saving…' : syncStatus === 'saved' ? '✓ Saved' : '✗ Error'}
                </span>
              )}
              {authUser && syncStatus === 'idle' && (
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-4)', opacity: 0.5 }}>☁</span>
              )}
            </div>
            <button onClick={newProject} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>+ New</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {projects.map(p => {
              const isActive = p.id === activeId;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'stretch', borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent' }}>
                  <button onClick={() => switchProject(p.id)} style={{
                    flex: 1, textAlign: 'left', minWidth: 0,
                    padding: '8px 8px 8px 17px',
                    background: isActive ? 'rgba(82,192,232,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--text)' : 'var(--text-3)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name || 'Untitled Project'}
                    </div>
                    {p.indication && (
                      <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.indication}
                      </div>
                    )}
                  </button>
                  {projects.length > 1 && (
                    <button onClick={() => { if (confirm(`Delete "${p.name || 'Untitled Project'}"?`)) deleteProject(p.id); }}
                      title="Delete project"
                      style={{ padding: '0 8px', background: 'transparent', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 14, flexShrink: 0, opacity: 0.5 }}>
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* One-pager + export/import */}
        <div style={{ padding: '10px 20px 0', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setShowOnePager(true)} style={{
            width: '100%', padding: '8px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
            background: 'rgba(82,192,232,0.08)', color: 'var(--accent)',
            border: '1px solid rgba(82,192,232,0.25)',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.09em',
          }}>✦ Investor One-Pager</button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => {
              const name = (state.projectName || 'biodesign-project').toLowerCase().replace(/\s+/g, '-');
              const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `${name}.json`; a.click();
              URL.revokeObjectURL(url);
            }} style={{
              flex: 1, padding: '6px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
              background: 'var(--surface-1)', color: 'var(--text-3)',
              border: '1px solid var(--line)',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>↓ Export</button>
            <label style={{
              flex: 1, padding: '6px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
              background: 'var(--surface-1)', color: 'var(--text-3)',
              border: '1px solid var(--line)',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
              textAlign: 'center',
            }}>
              ↑ Import
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const imported = parseRaw(ev.target?.result as string);
                    const id = uid();
                    const meta: ProjectMeta = { id, name: imported.projectName || 'Imported Project', indication: imported.indication, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                    setProjects(ps => { const updated = [...ps, meta]; localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated)); return updated; });
                    localStorage.setItem(PROJECT_KEY(id), JSON.stringify(imported));
                    localStorage.setItem(ACTIVE_KEY, id);
                    setActiveId(id); setStateRaw(imported); setPhase('identify'); setTab('needs');
                  } catch { alert('Invalid project file.'); }
                };
                reader.readAsText(file);
                e.target.value = '';
              }} />
            </label>
          </div>
        </div>

        {/* History + Share */}
        <div style={{ padding: '8px 20px 0', borderTop: '1px solid var(--line)', display: 'flex', gap: 6 }}>
          <button onClick={() => setShowHistory(true)} style={{
            flex: 1, padding: '6px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
            background: 'var(--surface-1)', color: 'var(--text-3)',
            border: '1px solid var(--line)',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>History</button>
          <button onClick={async () => {
            if (!activeId) return;
            const url = await shareProject(activeId);
            if (url) {
              navigator.clipboard.writeText(url).catch(() => {});
              setShareToast(true);
              setTimeout(() => setShareToast(false), 2500);
            }
          }} style={{
            flex: 1, padding: '6px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
            background: shareToast ? 'rgba(61,204,145,0.1)' : 'var(--surface-1)',
            color: shareToast ? '#3DCC91' : 'var(--text-3)',
            border: shareToast ? '1px solid rgba(61,204,145,0.3)' : '1px solid var(--line)',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
            transition: 'all 0.2s',
          }}>{shareToast ? '✓ Copied' : '↗ Share'}</button>
        </div>

        {/* Footer stats */}
        <div style={{ padding: '10px 20px 0', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            <span>{state.needs.length} needs</span>
            <span style={{ color: 'var(--line-strong)' }}>·</span>
            <span>{state.concepts.length} concepts</span>
            {(state.risks?.length ?? 0) > 0 && <>
              <span style={{ color: 'var(--line-strong)' }}>·</span>
              <span style={{ color: (state.risks ?? []).some(r => r.status === 'open' && r.probability * r.impact >= 12) ? '#d9a020' : 'inherit' }}>{state.risks!.length} risks</span>
            </>}
            {(state.milestones?.length ?? 0) > 0 && <>
              <span style={{ color: 'var(--line-strong)' }}>·</span>
              <span>{state.milestones!.length} milestones</span>
            </>}
          </div>
        </div>

        {/* User identity */}
        {authUser && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--line)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {authUser.profilePictureUrl ? (
              <img src={authUser.profilePictureUrl} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(authUser.firstName?.[0] ?? authUser.email[0]).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {authUser.firstName ? `${authUser.firstName}${authUser.lastName ? ' ' + authUser.lastName : ''}` : authUser.email}
              </div>
              <a href="/api/auth/signout" style={{ fontSize: 10, color: 'var(--text-4)', textDecoration: 'none', fontFamily: 'var(--mono)' }}>Sign out</a>
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Phase completion rail */}
        <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)', padding: '7px 24px', display: 'flex', gap: 8, flexShrink: 0 }}>
          {PHASES.map(p => {
            const pct = getPhaseCompletion(state, p.key);
            const isActive = p.key === phase;
            return (
              <button key={p.key} onClick={() => switchPhase(p.key as typeof phase)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: isActive ? p.color : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s' }}>{p.label}</span>
                  <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: pct === 100 ? p.color : 'var(--text-4)' }}>{pct}%</span>
                </div>
                <div style={{ height: 3, background: 'var(--line)', borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 2, transition: 'width 0.5s, opacity 0.2s', opacity: isActive ? 1 : 0.4 }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab bar */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--line)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, height: 58, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            {/* Phase badge */}
            {(() => {
              const pm = PHASES.find(p => p.key === phase)!;
              const phaseIdx = PHASES.findIndex(p => p.key === phase);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--text-4)', letterSpacing: '0.08em' }}>
                    {String(phaseIdx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', color: pm.color, padding: '4px 10px', borderRadius: 3, background: pm.color + '14', border: `1px solid ${pm.color}30` }}>
                    {pm.label}
                  </span>
                </div>
              );
            })()}
            {/* Divider */}
            <div style={{ width: 1, height: 18, background: 'var(--line)', flexShrink: 0 }} />
            {/* Pill tabs */}
            <div className="bd-tab-scroll" style={{ display: 'flex', gap: 3, overflowX: 'auto', alignItems: 'center', paddingBottom: 1 }}>
              {phaseTabMap[phase].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '8px 18px', borderRadius: 20,
                    fontSize: 11, cursor: 'pointer',
                    fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.10em',
                    background: tab === t ? 'rgba(82,192,232,0.12)' : 'transparent',
                    color: tab === t ? 'var(--accent)' : 'var(--text-4)',
                    border: tab === t ? '1px solid rgba(82,192,232,0.28)' : '1px solid transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {tabMeta[t].label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => setShowWizard(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(168,126,232,0.10)', color: '#A07EE8',
                border: '1px solid rgba(168,126,232,0.28)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
              <span>Reg Wizard</span>
            </button>
            <button onClick={() => setShowPalette(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'transparent', color: 'var(--text-4)',
                border: '1px solid var(--line)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
              <span style={{ opacity: 0.5, fontSize: 9 }}>⌘K</span>
            </button>
            <button onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'transparent', color: 'var(--text-4)',
                border: '1px solid var(--line)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
              <span>↓ PDF</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div key={`${phase}-${tab}`} className="bd-tab-in" style={{ flex: 1, padding: '28px 40px', overflowY: 'auto' }}>
          {tab === 'needs'          && <NeedsTab state={state} update={update} />}
          {tab === 'stakeholders'   && <StakeholdersTab state={state} update={update} />}
          {tab === 'competitors'    && <CompetitiveTab state={state} update={update} />}
          {tab === 'concepts'       && <ConceptsTab state={state} update={update} />}
          {tab === 'regulatory'     && <RegulatoryTab state={state} update={update} />}
          {tab === 'strategy'       && <StrategyTab state={state} update={update} />}
          {tab === 'reimbursement'  && <ReimbursementTab state={state} update={update} />}
          {tab === 'timeline'       && <TimelineTab state={state} update={update} />}
          {tab === 'risks'          && <RisksTab state={state} update={update} />}
          {tab === 'profile'        && <ProfileTab state={state} update={update} />}
          {tab === 'standards'      && <StandardsTab state={state} update={update} />}
          {tab === 'designcontrols' && <DesignControlsTab state={state} update={update} />}
          {tab === 'ipfilings'      && <IPFilingsTab state={state} update={update} />}
        </div>
      </div>
    </div>

    {showOnePager && <InvestorOnePager state={state} onClose={() => setShowOnePager(false)} />}
    {showHistory && <HistoryModal projectId={activeId} currentState={state} onRestore={s => { update(s); setShowHistory(false); }} onClose={() => setShowHistory(false)} />}
    {showPalette && (
      <CommandPalette
        state={state}
        phase={phase}
        tab={tab}
        onNavigate={(p, t) => { switchPhase(p as typeof phase); setTab(t as typeof tab); }}
        onClose={() => setShowPalette(false)}
      />
    )}
    {showWizard && (
      <RegulatoryWizard
        state={state}
        onResult={(pathway, deviceClass, reasoning) => {
          update({
            ...state,
            regulatory: {
              ...state.regulatory,
              pathway: pathway as typeof state.regulatory.pathway,
              deviceClass: deviceClass as typeof state.regulatory.deviceClass,
              notes: state.regulatory.notes
                ? state.regulatory.notes + '\n\n[Wizard] ' + reasoning
                : '[Wizard] ' + reasoning,
            },
          });
          setShowWizard(false);
          switchPhase('implement');
          setTab('regulatory');
        }}
        onClose={() => setShowWizard(false)}
      />
    )}
    </>
  );
}
