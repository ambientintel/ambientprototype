'use client';
import { useState } from 'react';
import {
  BiodesignState, DesignControls, DesignInput, DesignOutput,
  DesignVerification, DesignValidation,
  DesignInputCategory, DesignInputPriority, DesignControlStatus,
  DEFAULT_DESIGN_CONTROLS,
} from './data';

function uid() { return Math.random().toString(36).slice(2, 9); }

const PRIORITY_META: Record<DesignInputPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#c04040' },
  major:    { label: 'Major',    color: '#d9a020' },
  minor:    { label: 'Minor',    color: '#8a9fa8' },
};

const STATUS_META: Record<DesignControlStatus, { label: string; color: string; bg: string }> = {
  planned:       { label: 'Planned',     color: '#8a9fa8', bg: 'rgba(138,159,168,0.12)' },
  'in-progress': { label: 'In Progress', color: '#52C0E8', bg: 'rgba(82,192,232,0.12)' },
  complete:      { label: 'Complete',    color: '#3DCC91', bg: 'rgba(61,204,145,0.12)' },
  approved:      { label: 'Approved',    color: '#9b72cf', bg: 'rgba(155,114,207,0.12)' },
  failed:        { label: 'Failed',      color: '#c04040', bg: 'rgba(192,64,64,0.12)' },
};

const inputCategories: DesignInputCategory[] = ['functional', 'performance', 'safety', 'regulatory', 'user', 'interface', 'labeling'];
const dcStatuses: DesignControlStatus[] = ['planned', 'in-progress', 'complete', 'approved', 'failed'];

type SubTab = 'inputs' | 'outputs' | 'verifications' | 'validations';

export function DesignControlsTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [subTab, setSubTab] = useState<SubTab>('inputs');
  const [addingInput, setAddingInput] = useState(false);
  const [addingOutput, setAddingOutput] = useState(false);
  const [addingVerif, setAddingVerif] = useState(false);
  const [addingValid, setAddingValid] = useState(false);
  const [inputDraft, setInputDraft] = useState<Partial<DesignInput>>({ category: 'functional', priority: 'major' });
  const [outputDraft, setOutputDraft] = useState<Partial<DesignOutput>>({ status: 'planned' });
  const [verifDraft, setVerifDraft] = useState<Partial<DesignVerification>>({ status: 'planned' });
  const [validDraft, setValidDraft] = useState<Partial<DesignValidation>>({ status: 'planned' });

  const dc: DesignControls = state.designControls ?? DEFAULT_DESIGN_CONTROLS;
  function setDC(patch: Partial<DesignControls>) {
    update({ ...state, designControls: { ...dc, ...patch } });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
    borderRadius: 2, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
    fontFamily: 'var(--sans)', outline: 'none',
  };

  const subTabs: { key: SubTab; label: string; count: number }[] = [
    { key: 'inputs',        label: 'Inputs',        count: dc.inputs.length },
    { key: 'outputs',       label: 'Outputs',       count: dc.outputs.length },
    { key: 'verifications', label: 'Verification',  count: dc.verifications.length },
    { key: 'validations',   label: 'Validation',    count: dc.validations.length },
  ];

  const totalApproved = [...dc.outputs, ...dc.verifications, ...dc.validations].filter(x => x.status === 'approved').length;

  return (
    <div>
      <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Design Controls (DHF)</h2>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>21 CFR 820.30 scaffold — design inputs, outputs, verification, and validation.</p>
      </div>

      {/* DHF meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>DHF Location / Doc System</label>
          <input value={dc.dhfLocation} onChange={e => setDC({ dhfLocation: e.target.value })} placeholder="e.g. Greenlight Guru / SharePoint / Confluence" style={{ ...inputStyle, height: 36 }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Design Review Notes</label>
          <input value={dc.designReviewNotes} onChange={e => setDC({ designReviewNotes: e.target.value })} placeholder="Last review date, open actions…" style={{ ...inputStyle, height: 36 }} />
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
        {subTabs.map(t => (
          <div key={t.key} style={{ padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: t.count > 0 ? 'var(--text)' : 'var(--text-4)' }}>{t.count}</div>
            <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {totalApproved > 0 && (
        <div style={{ padding: '8px 14px', background: 'rgba(155,114,207,0.08)', border: '1px solid rgba(155,114,207,0.2)', borderRadius: 2, marginBottom: 16, fontSize: 12, color: '#c0a0e0' }}>
          {totalApproved} document{totalApproved > 1 ? 's' : ''} approved in the DHF.
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            style={{
              padding: '9px 16px 7px', fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
              background: 'transparent',
              color: subTab === t.key ? 'var(--text)' : 'var(--text-4)',
              border: 'none',
              borderBottom: subTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0, marginBottom: -1,
              whiteSpace: 'nowrap',
            }}>{t.label}{t.count > 0 ? ` (${t.count})` : ''}</button>
        ))}
      </div>

      {/* ── Design Inputs ─────────────────────────────────────────────────────────── */}
      {subTab === 'inputs' && (
        <div>
          {dc.inputs.length === 0 && !addingInput && (
            <EmptyDHF label="No design inputs — add requirements the design must satisfy" />
          )}
          {dc.inputs.map((inp, i) => {
            const pm = PRIORITY_META[inp.priority];
            return (
              <div key={inp.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '12px 16px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>DI-{String(i + 1).padStart(3, '0')}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: pm.color + '20', color: pm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pm.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: 'var(--surface-2)', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{inp.category}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{inp.requirement}</div>
                    {inp.acceptanceCriteria && (
                      <div style={{ marginTop: 5, fontSize: 12, color: 'var(--text-3)' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AC: </span>{inp.acceptanceCriteria}
                      </div>
                    )}
                    {inp.source && <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-4)' }}>Source: {inp.source}</div>}
                  </div>
                  <button onClick={() => setDC({ inputs: dc.inputs.filter(x => x.id !== inp.id) })}
                    style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 15, padding: '0 4px', flexShrink: 0 }}>×</button>
                </div>
              </div>
            );
          })}
          {addingInput ? (
            <DHFForm onCancel={() => { setAddingInput(false); setInputDraft({ category: 'functional', priority: 'major' }); }}
              onSave={() => {
                if (!inputDraft.requirement) return;
                const inp: DesignInput = { id: uid(), requirement: inputDraft.requirement!, source: inputDraft.source ?? '', category: (inputDraft.category as DesignInputCategory) ?? 'functional', priority: (inputDraft.priority as DesignInputPriority) ?? 'major', acceptanceCriteria: inputDraft.acceptanceCriteria ?? '', notes: inputDraft.notes ?? '' };
                setDC({ inputs: [...dc.inputs, inp] });
                setInputDraft({ category: 'functional', priority: 'major' });
                setAddingInput(false);
              }}
              saveLabel="Add Design Input">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Requirement (The device shall…)</DHFLabel>
                  <textarea value={inputDraft.requirement ?? ''} onChange={e => setInputDraft(d => ({ ...d, requirement: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="The device shall withstand sterilization by EO at 55°C for 12 hours without degradation…" />
                </div>
                <div>
                  <DHFLabel>Category</DHFLabel>
                  <select value={inputDraft.category} onChange={e => setInputDraft(d => ({ ...d, category: e.target.value as DesignInputCategory }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                    {inputCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <DHFLabel>Priority</DHFLabel>
                  <select value={inputDraft.priority} onChange={e => setInputDraft(d => ({ ...d, priority: e.target.value as DesignInputPriority }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                    {(['critical', 'major', 'minor'] as DesignInputPriority[]).map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Acceptance Criteria</DHFLabel>
                  <input value={inputDraft.acceptanceCriteria ?? ''} onChange={e => setInputDraft(d => ({ ...d, acceptanceCriteria: e.target.value }))} placeholder="Measurable, testable pass/fail criterion" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Source</DHFLabel>
                  <input value={inputDraft.source ?? ''} onChange={e => setInputDraft(d => ({ ...d, source: e.target.value }))} placeholder="Standard, user need, or regulation" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Notes</DHFLabel>
                  <input value={inputDraft.notes ?? ''} onChange={e => setInputDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Additional context" style={{ ...inputStyle, height: 36 }} />
                </div>
              </div>
            </DHFForm>
          ) : (
            <AddButton onClick={() => setAddingInput(true)} label="+ Add design input" />
          )}
        </div>
      )}

      {/* ── Design Outputs ─────────────────────────────────────────────────────────── */}
      {subTab === 'outputs' && (
        <div>
          {dc.outputs.length === 0 && !addingOutput && (
            <EmptyDHF label="No design outputs — add design documents and drawings" />
          )}
          {dc.outputs.map((out, i) => {
            const sm = STATUS_META[out.status];
            return (
              <div key={out.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>DO-{String(i + 1).padStart(3, '0')}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sm.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{out.title}</div>
                  {out.documentRef && <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{out.documentRef}</div>}
                  {out.notes && <div style={{ marginTop: 5, fontSize: 12, color: 'var(--text-3)' }}>{out.notes}</div>}
                </div>
                <button onClick={() => setDC({ outputs: dc.outputs.filter(x => x.id !== out.id) })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 15, padding: '0 4px' }}>×</button>
              </div>
            );
          })}
          {addingOutput ? (
            <DHFForm onCancel={() => { setAddingOutput(false); setOutputDraft({ status: 'planned' }); }}
              onSave={() => {
                if (!outputDraft.title) return;
                const out: DesignOutput = { id: uid(), title: outputDraft.title!, documentRef: outputDraft.documentRef ?? '', linkedInputIds: [], status: (outputDraft.status as DesignControlStatus) ?? 'planned', notes: outputDraft.notes ?? '' };
                setDC({ outputs: [...dc.outputs, out] });
                setOutputDraft({ status: 'planned' });
                setAddingOutput(false);
              }}
              saveLabel="Add Design Output">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Document / Output Title</DHFLabel>
                  <input value={outputDraft.title ?? ''} onChange={e => setOutputDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Design Specification Rev A" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Document Reference</DHFLabel>
                  <input value={outputDraft.documentRef ?? ''} onChange={e => setOutputDraft(d => ({ ...d, documentRef: e.target.value }))} placeholder="e.g. DS-001 Rev A" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Status</DHFLabel>
                  <select value={outputDraft.status ?? 'planned'} onChange={e => setOutputDraft(d => ({ ...d, status: e.target.value as DesignControlStatus }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                    {dcStatuses.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Notes</DHFLabel>
                  <textarea value={outputDraft.notes ?? ''} onChange={e => setOutputDraft(d => ({ ...d, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </DHFForm>
          ) : (
            <AddButton onClick={() => setAddingOutput(true)} label="+ Add design output" />
          )}
        </div>
      )}

      {/* ── Verifications ─────────────────────────────────────────────────────────── */}
      {subTab === 'verifications' && (
        <div>
          {dc.verifications.length === 0 && !addingVerif && (
            <EmptyDHF label="No verification activities — add bench tests and analyses" />
          )}
          {dc.verifications.map((v, i) => {
            const sm = STATUS_META[v.status];
            return (
              <div key={v.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '12px 16px', marginBottom: 6, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>VER-{String(i + 1).padStart(3, '0')}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sm.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{v.title}</div>
                  {v.method && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase' }}>Method: </span>{v.method}</div>}
                  {v.acceptanceCriteria && <div style={{ marginTop: 3, fontSize: 12, color: 'var(--text-3)' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase' }}>AC: </span>{v.acceptanceCriteria}</div>}
                  {v.result && <div style={{ marginTop: 5, fontSize: 12, color: '#3DCC91', fontWeight: 500 }}>Result: {v.result}</div>}
                </div>
                <button onClick={() => setDC({ verifications: dc.verifications.filter(x => x.id !== v.id) })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 15, padding: '0 4px' }}>×</button>
              </div>
            );
          })}
          {addingVerif ? (
            <DHFForm onCancel={() => { setAddingVerif(false); setVerifDraft({ status: 'planned' }); }}
              onSave={() => {
                if (!verifDraft.title) return;
                const v: DesignVerification = { id: uid(), title: verifDraft.title!, method: verifDraft.method ?? '', acceptanceCriteria: verifDraft.acceptanceCriteria ?? '', linkedOutputIds: [], status: (verifDraft.status as DesignControlStatus) ?? 'planned', result: verifDraft.result ?? '', notes: '' };
                setDC({ verifications: [...dc.verifications, v] });
                setVerifDraft({ status: 'planned' });
                setAddingVerif(false);
              }}
              saveLabel="Add Verification">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Test / Verification Title</DHFLabel>
                  <input value={verifDraft.title ?? ''} onChange={e => setVerifDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Tensile strength per ASTM F2781" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Method</DHFLabel>
                  <input value={verifDraft.method ?? ''} onChange={e => setVerifDraft(d => ({ ...d, method: e.target.value }))} placeholder="Bench test, analysis, inspection…" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Status</DHFLabel>
                  <select value={verifDraft.status ?? 'planned'} onChange={e => setVerifDraft(d => ({ ...d, status: e.target.value as DesignControlStatus }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                    {dcStatuses.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Acceptance Criteria</DHFLabel>
                  <input value={verifDraft.acceptanceCriteria ?? ''} onChange={e => setVerifDraft(d => ({ ...d, acceptanceCriteria: e.target.value }))} placeholder="Measured value shall be ≥ X" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Result (if complete)</DHFLabel>
                  <input value={verifDraft.result ?? ''} onChange={e => setVerifDraft(d => ({ ...d, result: e.target.value }))} placeholder="Test result summary…" style={{ ...inputStyle, height: 36 }} />
                </div>
              </div>
            </DHFForm>
          ) : (
            <AddButton onClick={() => setAddingVerif(true)} label="+ Add verification activity" />
          )}
        </div>
      )}

      {/* ── Validations ─────────────────────────────────────────────────────────── */}
      {subTab === 'validations' && (
        <div>
          {dc.validations.length === 0 && !addingValid && (
            <EmptyDHF label="No validation activities — add human factors and clinical validation" />
          )}
          {dc.validations.map((v, i) => {
            const sm = STATUS_META[v.status];
            return (
              <div key={v.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: '12px 16px', marginBottom: 6, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>VAL-{String(i + 1).padStart(3, '0')}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 3, background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sm.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{v.title}</div>
                  {v.method && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-3)' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase' }}>Method: </span>{v.method}</div>}
                  {v.population && <div style={{ marginTop: 3, fontSize: 12, color: 'var(--text-3)' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase' }}>Population: </span>{v.population}</div>}
                  {v.acceptanceCriteria && <div style={{ marginTop: 3, fontSize: 12, color: 'var(--text-3)' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase' }}>AC: </span>{v.acceptanceCriteria}</div>}
                  {v.result && <div style={{ marginTop: 5, fontSize: 12, color: '#3DCC91', fontWeight: 500 }}>Result: {v.result}</div>}
                </div>
                <button onClick={() => setDC({ validations: dc.validations.filter(x => x.id !== v.id) })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 15, padding: '0 4px' }}>×</button>
              </div>
            );
          })}
          {addingValid ? (
            <DHFForm onCancel={() => { setAddingValid(false); setValidDraft({ status: 'planned' }); }}
              onSave={() => {
                if (!validDraft.title) return;
                const v: DesignValidation = { id: uid(), title: validDraft.title!, method: validDraft.method ?? '', population: validDraft.population ?? '', acceptanceCriteria: validDraft.acceptanceCriteria ?? '', status: (validDraft.status as DesignControlStatus) ?? 'planned', result: validDraft.result ?? '', notes: '' };
                setDC({ validations: [...dc.validations, v] });
                setValidDraft({ status: 'planned' });
                setAddingValid(false);
              }}
              saveLabel="Add Validation">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Validation Study Title</DHFLabel>
                  <input value={validDraft.title ?? ''} onChange={e => setValidDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Summative Human Factors Validation" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Method</DHFLabel>
                  <input value={validDraft.method ?? ''} onChange={e => setValidDraft(d => ({ ...d, method: e.target.value }))} placeholder="Summative usability / clinical trial…" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div>
                  <DHFLabel>Status</DHFLabel>
                  <select value={validDraft.status ?? 'planned'} onChange={e => setValidDraft(d => ({ ...d, status: e.target.value as DesignControlStatus }))} style={{ ...inputStyle, height: 36, padding: '0 10px' }}>
                    {dcStatuses.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <DHFLabel>Target Population</DHFLabel>
                  <input value={validDraft.population ?? ''} onChange={e => setValidDraft(d => ({ ...d, population: e.target.value }))} placeholder="Intended users, patient population…" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Acceptance Criteria</DHFLabel>
                  <input value={validDraft.acceptanceCriteria ?? ''} onChange={e => setValidDraft(d => ({ ...d, acceptanceCriteria: e.target.value }))} placeholder="Success threshold or primary endpoint…" style={{ ...inputStyle, height: 36 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <DHFLabel>Result (if complete)</DHFLabel>
                  <input value={validDraft.result ?? ''} onChange={e => setValidDraft(d => ({ ...d, result: e.target.value }))} placeholder="Summary of outcomes…" style={{ ...inputStyle, height: 36 }} />
                </div>
              </div>
            </DHFForm>
          ) : (
            <AddButton onClick={() => setAddingValid(true)} label="+ Add validation activity" />
          )}
        </div>
      )}
    </div>
  );
}

function DHFLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

function DHFForm({ children, onSave, onCancel, saveLabel }: { children: React.ReactNode; onSave: () => void; onCancel: () => void; saveLabel: string }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: 20, marginTop: 8 }}>
      <div style={{ marginBottom: 12 }}>{children}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>{saveLabel}</button>
        <button onClick={onCancel} style={{ padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)' }}>Cancel</button>
      </div>
    </div>
  );
}

function EmptyDHF({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
      {label}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', padding: '10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', marginTop: 8, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </button>
  );
}
