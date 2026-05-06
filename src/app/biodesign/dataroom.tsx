'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  BiodesignState,
  PATHWAY_META,
  NEED_STATUS_META,
  CONCEPT_STATUS_META,
  STAKEHOLDER_ROLE_META,
  needScore,
  conceptScore,
} from './data';

// ── Props ─────────────────────────────────────────────────────────────────────

interface DataRoomProps {
  state: BiodesignState;
  onNavigate: (phase: string, tab: string) => void;
  onClose: () => void;
}

// ── Section definitions ───────────────────────────────────────────────────────

interface SectionDef {
  id: string;
  num: number;
  label: string;
  color: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'exec',       num: 1,  label: 'Executive Summary',          color: '#52C0E8' },
  { id: 'need',       num: 2,  label: 'Unmet Need & Target Market',  color: '#E8A852' },
  { id: 'solution',   num: 3,  label: 'Solution Overview',           color: '#A07EE8' },
  { id: 'regulatory', num: 4,  label: 'Regulatory Strategy',         color: '#E87252' },
  { id: 'clinical',   num: 5,  label: 'Clinical Evidence Plan',      color: '#A07EE8' },
  { id: 'ip',         num: 6,  label: 'Intellectual Property',        color: '#52E8B4' },
  { id: 'financial',  num: 7,  label: 'Financial Overview',           color: '#E8A852' },
  { id: 'risk',       num: 8,  label: 'Risk Assessment',              color: '#E87252' },
  { id: 'timeline',   num: 9,  label: 'Development Timeline',         color: '#52C0E8' },
  { id: 'quality',    num: 10, label: 'Quality & Compliance',         color: '#52E8B4' },
  { id: 'appendix',   num: 11, label: 'Appendix — Project Notes',     color: 'var(--text-3)' },
];

// ── Completeness ──────────────────────────────────────────────────────────────

function getSectionCompletion(id: string, state: BiodesignState): 'complete' | 'partial' | 'empty' {
  switch (id) {
    case 'exec':
      if (state.projectName && state.indication) return 'complete';
      if (state.projectName || state.indication) return 'partial';
      return 'empty';
    case 'need':
      if (state.needs.length > 0 && state.stakeholders.length > 0) return 'complete';
      if (state.needs.length > 0 || state.stakeholders.length > 0) return 'partial';
      return 'empty';
    case 'solution':
      if (state.concepts.length > 0) return 'complete';
      return 'empty';
    case 'regulatory':
      if (state.regulatory.pathway !== 'tbd') return 'complete';
      return 'empty';
    case 'clinical':
      if (state.clinical.studyDesign !== '') return 'complete';
      return 'empty';
    case 'ip':
      if (state.ipFilings.length > 0) return 'complete';
      return 'empty';
    case 'financial':
      if (state.business.totalAddressableMarket !== '') return 'complete';
      return 'empty';
    case 'risk':
      if (state.risks.length > 0) return 'complete';
      return 'empty';
    case 'timeline':
      if (state.milestones.length > 0) return 'complete';
      return 'empty';
    case 'quality':
      if (state.comply.profile.targetMarkets.length > 0) return 'complete';
      return 'empty';
    case 'appendix': {
      const hasNotes = !!(state.regulatory.notes || state.clinical.notes);
      return hasNotes ? 'complete' : 'empty';
    }
    default:
      return 'empty';
  }
}

function completionDot(status: 'complete' | 'partial' | 'empty'): string {
  if (status === 'complete') return '#52E8B4';
  if (status === 'partial') return '#E8A852';
  return 'rgba(214,233,248,0.18)';
}

// ── Shared mini-components ────────────────────────────────────────────────────

function DR_KV({ label, value, missing }: { label: string; value?: string | number | null; missing?: boolean }) {
  const val = value ?? '';
  const isEmpty = val === '' || val === null || val === undefined;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: isEmpty && missing ? 'var(--text-4)' : 'var(--text)', fontStyle: isEmpty && missing ? 'italic' : 'normal', lineHeight: 1.55 }}>
        {isEmpty && missing ? '[not set]' : String(val)}
      </span>
    </div>
  );
}

function DR_Badge({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: 2,
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.09em',
      color,
      background: bg ?? `${color}18`,
      border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function DR_SectionHeading({ def }: { def: SectionDef }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      paddingBottom: 14, marginBottom: 20,
      borderBottom: `1px solid ${def.color}30`,
    }}>
      <div style={{ width: 3, height: 28, background: def.color, borderRadius: 1, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.12em', minWidth: 22 }}>
        {String(def.num).padStart(2, '0')}
      </span>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>
        {def.label}
      </h2>
    </div>
  );
}

function DR_EmptyState({ text, phase, tab, tabLabel, onNavigate }: {
  text: string;
  phase: string;
  tab: string;
  tabLabel: string;
  onNavigate: (phase: string, tab: string) => void;
}) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--line)',
      borderRadius: 2,
      padding: '18px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>{text}</span>
      <button
        onClick={() => onNavigate(phase, tab)}
        style={{
          padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
          background: 'none', color: 'var(--accent)',
          border: '1px solid var(--accent)', flexShrink: 0,
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.09em',
        }}
      >Go to {tabLabel} →</button>
    </div>
  );
}

function DR_Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: 'var(--surface-1)' }}>
          {headers.map((h, i) => (
            <th key={i} style={{
              padding: '7px 10px', textAlign: 'left',
              fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--text-4)',
              border: '1px solid var(--line)',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding: '7px 10px', verticalAlign: 'top',
                color: 'var(--text)', lineHeight: 1.5,
                border: '1px solid var(--line)',
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? (value / 5) * 100 : 0;
  const color = !value ? 'var(--line)' : value >= 4 ? '#52E8B4' : value >= 3 ? '#E8A852' : '#E87252';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', width: 130, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: value ? color : 'var(--text-4)', minWidth: 20, textAlign: 'right' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ── Section renderers ─────────────────────────────────────────────────────────

function Section1_Exec({ state }: { state: BiodesignState }) {
  const reg = state.regulatory;
  const pathwayMeta = reg.pathway !== 'tbd' ? PATHWAY_META[reg.pathway] : null;
  const pathwayLine = pathwayMeta
    ? `${pathwayMeta.label} | Class ${reg.deviceClass} | Est. ${reg.estimatedTimelineMonths ?? '?'} months to ${reg.pathway === 'pma' ? 'approval' : 'clearance'}`
    : null;

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
        {state.projectName || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>[not set]</span>}
      </h1>
      {(state.indication || !state.indication) && (
        <div style={{ fontSize: 15, color: '#52C0E8', fontWeight: 600, marginBottom: 16 }}>
          {state.indication || <span style={{ color: 'var(--text-4)', fontStyle: 'italic', fontSize: 13, fontWeight: 400 }}>[indication not set]</span>}
        </div>
      )}
      {state.projectDescription && (
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 680 }}>
          {state.projectDescription}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {pathwayLine && (
          <DR_KV label="Regulatory Summary" value={pathwayLine} />
        )}
        <DR_KV label="Intended Use" value={reg.intendedUse || null} missing />
        <DR_KV label="Project Name" value={state.projectName || null} missing />
        <DR_KV label="Indication" value={state.indication || null} missing />
        <DR_KV label="Description" value={state.projectDescription || null} missing />
      </div>
    </div>
  );
}

function Section2_Need({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const topNeeds = [...state.needs]
    .filter(n => n.status === 'validated' || n.status === 'selected')
    .sort((a, b) => (needScore(b) ?? 0) - (needScore(a) ?? 0))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Validated needs */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Validated Needs
        </div>
        {topNeeds.length === 0 ? (
          <DR_EmptyState
            text="No validated or selected need statements."
            phase="identify" tab="needs" tabLabel="Needs"
            onNavigate={onNavigate}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topNeeds.map(n => {
              const statusM = NEED_STATUS_META[n.status];
              const score = needScore(n);
              return (
                <div key={n.id} style={{
                  background: 'var(--surface-1)', border: '1px solid var(--line)',
                  borderRadius: 2, padding: '14px 18px',
                  borderLeft: `3px solid ${statusM.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.65, flex: 1 }}>
                      A way to <strong>{n.problem}</strong> for <strong>{n.population}</strong>
                      {n.setting ? ` in ${n.setting}` : ''}{n.outcome ? ` so that ${n.outcome}` : ''}.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <DR_Badge label={statusM.label} color={statusM.color} />
                      {score !== null && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>Score: {score}/5</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stakeholders table */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Key Stakeholders
        </div>
        {state.stakeholders.length === 0 ? (
          <DR_EmptyState
            text="No stakeholders mapped."
            phase="identify" tab="stakeholders" tabLabel="Stakeholders"
            onNavigate={onNavigate}
          />
        ) : (
          <DR_Table
            headers={['Role', 'Name', 'Organization / Context', 'Influence']}
            rows={state.stakeholders.map(s => {
              const roleMeta = STAKEHOLDER_ROLE_META[s.role];
              const infColor = s.influence >= 4 ? '#E87252' : s.influence >= 3 ? '#E8A852' : '#52E8B4';
              return [
                <DR_Badge key="r" label={roleMeta.label} color={roleMeta.color} />,
                <span key="n" style={{ fontWeight: 600 }}>{s.name || '—'}</span>,
                <span key="o">{s.painPoints || '—'}</span>,
                <DR_Badge key="i" label={`${s.influence}/5`} color={infColor} />,
              ];
            })}
          />
        )}
      </div>
    </div>
  );
}

function Section3_Solution({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const topConcepts = [...state.concepts]
    .filter(c => c.status === 'selected' || c.status === 'development')
    .sort((a, b) => (conceptScore(b) ?? 0) - (conceptScore(a) ?? 0))
    .slice(0, 3);

  const topCompetitors = (state.competitors ?? []).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Concepts */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Selected Concepts
        </div>
        {topConcepts.length === 0 ? (
          <DR_EmptyState
            text="No selected or in-development concepts."
            phase="invent" tab="concepts" tabLabel="Concepts"
            onNavigate={onNavigate}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topConcepts.map(c => {
              const statusM = CONCEPT_STATUS_META[c.status];
              const linkedNeed = c.needId ? state.needs.find(n => n.id === c.needId) : null;
              const s = c.screening;
              return (
                <div key={c.id} style={{
                  background: 'var(--surface-1)', border: '1px solid var(--line)',
                  borderRadius: 2, padding: '16px 20px',
                  borderLeft: `3px solid ${statusM.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{c.title}</div>
                      {c.description && (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>{c.description}</p>
                      )}
                      {linkedNeed && (
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                          Addresses: {linkedNeed.problem}
                        </div>
                      )}
                    </div>
                    <DR_Badge label={statusM.label} color={statusM.color} />
                  </div>
                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                      Screening Scores
                    </div>
                    <ScoreBar label="Technical Feasibility" value={s.technicalFeasibility} />
                    <ScoreBar label="IP Freedom" value={s.ipFreedom} />
                    <ScoreBar label="Regulatory Risk" value={s.regulatoryRisk} />
                    <ScoreBar label="Reimbursement" value={s.reimbursementViability} />
                    <ScoreBar label="Clinical Adoption" value={s.clinicalAdoption} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Competitive positioning */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Competitive Positioning
        </div>
        {topCompetitors.length === 0 ? (
          <DR_EmptyState
            text="No competitors mapped."
            phase="implement" tab="competitive" tabLabel="Competitive"
            onNavigate={onNavigate}
          />
        ) : (
          <DR_Table
            headers={['Company / Device', 'FDA Status', 'Strengths', 'Weaknesses']}
            rows={topCompetitors.map(comp => [
              <div key="c">
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{comp.company}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{comp.device}</div>
              </div>,
              <span key="s">{comp.fdaStatus || '—'}</span>,
              <span key="st">{comp.strengths || '—'}</span>,
              <span key="w">{comp.weaknesses || '—'}</span>,
            ])}
          />
        )}
      </div>
    </div>
  );
}

function Section4_Regulatory({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const reg = state.regulatory;
  const pathwayMeta = reg.pathway !== 'tbd' ? PATHWAY_META[reg.pathway] : null;
  const meetings = state.preSubmission?.meetings ?? [];

  if (reg.pathway === 'tbd') {
    return (
      <DR_EmptyState
        text="Regulatory pathway not yet defined."
        phase="implement" tab="regulatory" tabLabel="Regulatory"
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Pathway summary */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        {pathwayMeta && <DR_Badge label={pathwayMeta.label} color={pathwayMeta.color} />}
        {reg.deviceClass !== 'TBD' && <DR_Badge label={`Class ${reg.deviceClass}`} color="var(--text-3)" />}
        <DR_Badge label={reg.clinicalData} color={reg.clinicalData === 'not required' ? '#52E8B4' : reg.clinicalData === 'pivotal trial' ? '#E87252' : '#E8A852'} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <DR_KV label="Intended Use" value={reg.intendedUse || null} missing />
        <DR_KV label="Indications for Use" value={reg.indicationsForUse || null} missing />
        {(reg.pathway === '510k' || reg.pathway === 'denovo') && (
          <>
            <DR_KV label="Predicate Device" value={reg.predicateDevice || null} missing />
            <DR_KV label="K-Number" value={reg.predicateNumber || null} missing />
            {reg.substantialEquivalence && (
              <DR_KV label="SE Argument" value={reg.substantialEquivalence} />
            )}
          </>
        )}
        {reg.specialControls.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 1 }}>
              Special Controls
            </span>
            <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
              {reg.specialControls.map((sc, i) => <li key={i}>{sc}</li>)}
            </ul>
          </div>
        )}
        <DR_KV label="Est. Timeline" value={reg.estimatedTimelineMonths ? `${reg.estimatedTimelineMonths} months` : null} missing />
        <DR_KV label="Est. Cost" value={reg.estimatedCost || null} missing />
        {reg.notes && <DR_KV label="Notes" value={reg.notes} />}
      </div>

      {/* FDA Pre-Sub meetings */}
      {meetings.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            FDA Pre-Submission Meetings
          </div>
          <DR_Table
            headers={['Type', 'Title', 'Status', 'Q-Sub #']}
            rows={meetings.map(m => [
              <span key="t" style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.type}</span>,
              <span key="ti">{m.title}</span>,
              <span key="s" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#52C0E8' }}>{m.status}</span>,
              <span key="q" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{m.qSubNumber || '—'}</span>,
            ])}
          />
        </div>
      )}
    </div>
  );
}

function Section5_Clinical({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const c = state.clinical;
  const isNotRequired = state.regulatory.clinicalData === 'not required' || state.regulatory.clinicalData === 'bench only';

  if (isNotRequired && !c.studyDesign) {
    return (
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 2,
          background: 'rgba(82,232,180,0.08)', border: '1px solid rgba(82,232,180,0.25)',
          marginBottom: 16,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#52E8B4', fontWeight: 700 }}>
            No clinical data required for this pathway
          </span>
        </div>
        <DR_EmptyState
          text="Clinical evidence plan not yet populated."
          phase="implement" tab="clinical" tabLabel="Clinical"
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  if (!c.studyDesign) {
    return (
      <DR_EmptyState
        text="Clinical evidence plan not yet defined."
        phase="implement" tab="clinical" tabLabel="Clinical"
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <DR_KV label="Study Design" value={c.studyDesign} />
      <DR_KV label="Primary Endpoint" value={c.primaryEndpoint || null} missing />
      <DR_KV label="Sample Size" value={c.sampleSize ?? null} missing />
      <DR_KV label="Sites" value={c.sites ?? null} missing />
      <DR_KV label="Duration" value={c.durationMonths ? `${c.durationMonths} months` : null} missing />
      <DR_KV label="Inclusion Criteria" value={c.inclusionCriteria || null} missing />
      <DR_KV label="Exclusion Criteria" value={c.exclusionCriteria || null} missing />
      <DR_KV label="Primary Sponsor" value={c.primarySponsor || null} missing />
      {c.notes && <DR_KV label="Notes" value={c.notes} />}
    </div>
  );
}

function Section6_IP({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const filings = state.ipFilings ?? [];
  const today = new Date();
  const in90 = new Date(today);
  in90.setDate(in90.getDate() + 90);

  const upcomingDeadlines = filings.flatMap(f =>
    f.deadlines
      .filter(d => !d.done && d.date)
      .map(d => ({ ...d, filingTitle: f.title }))
  ).filter(d => {
    const dt = new Date(d.date);
    return dt >= today && dt <= in90;
  }).sort((a, b) => a.date.localeCompare(b.date));

  if (filings.length === 0) {
    return (
      <DR_EmptyState
        text="No IP filings recorded."
        phase="implement" tab="ip" tabLabel="IP"
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DR_Table
        headers={['Type', 'Title', 'Status', 'Filed', 'Jurisdictions']}
        rows={filings.map(f => [
          <DR_Badge key="t" label={f.type} color="#52E8B4" />,
          <span key="ti" style={{ fontWeight: 600 }}>{f.title || '—'}</span>,
          <DR_Badge key="s" label={f.status} color={f.status === 'granted' || f.status === 'registered' ? '#52E8B4' : f.status === 'pending' || f.status === 'filed' ? '#52C0E8' : 'var(--text-3)'} />,
          <span key="d" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{f.filingDate || '—'}</span>,
          <span key="j">{f.jurisdictions.join(', ') || '—'}</span>,
        ])}
      />

      {upcomingDeadlines.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#E8A852', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Upcoming Deadlines (Next 90 Days)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcomingDeadlines.map(d => {
              const daysLeft = Math.ceil((new Date(d.date).getTime() - today.getTime()) / 86400000);
              return (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 14px', borderRadius: 2,
                  background: daysLeft <= 14 ? 'rgba(232,114,82,0.08)' : 'rgba(232,168,82,0.06)',
                  border: `1px solid ${daysLeft <= 14 ? 'rgba(232,114,82,0.3)' : 'rgba(232,168,82,0.2)'}`,
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: daysLeft <= 14 ? '#E87252' : '#E8A852', fontWeight: 700, minWidth: 60 }}>
                    {daysLeft}d
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.filingTitle}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Section7_Financial({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const b = state.business;

  if (!b.totalAddressableMarket && !b.serviceableMarket && !b.revenueModel) {
    return (
      <DR_EmptyState
        text="Financial and market data not yet entered."
        phase="implement" tab="business" tabLabel="Business"
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <DR_KV label="TAM" value={b.totalAddressableMarket || null} missing />
      <DR_KV label="SAM" value={b.serviceableMarket || null} missing />
      <DR_KV label="Revenue Model" value={b.revenueModel || null} missing />
      <DR_KV label="Avg Selling Price" value={b.averageSellingPrice || null} missing />
      <DR_KV label="COGS" value={b.costOfGoods || null} missing />
      <DR_KV label="Reimbursement Code" value={b.reimbursementCode || null} missing />
      <DR_KV label="Payer Mix" value={b.payerMix || null} missing />
      <DR_KV label="Go-to-Market" value={b.goToMarketStrategy || null} missing />
      <DR_KV label="Key Partnerships" value={b.keyPartnerships || null} missing />
      <DR_KV label="Competitive Advantage" value={b.competitiveAdvantage || null} missing />
    </div>
  );
}

function Section8_Risk({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const risks = [...(state.risks ?? [])]
    .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact))
    .slice(0, 8);

  if (risks.length === 0) {
    return (
      <DR_EmptyState
        text="No risks registered."
        phase="implement" tab="risks" tabLabel="Risks"
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <DR_Table
      headers={['Category', 'Risk', 'P×I', 'Status', 'Mitigation']}
      rows={risks.map(r => {
        const score = r.probability * r.impact;
        const scoreColor = score >= 16 ? '#E87252' : score >= 9 ? '#E8A852' : '#52E8B4';
        const statusColor = r.status === 'open' ? '#E87252' : r.status === 'mitigated' ? '#52E8B4' : 'var(--text-3)';
        return [
          <DR_Badge key="c" label={r.category} color="var(--text-3)" />,
          <div key="t">
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{r.title}</div>
            {r.description && <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{r.description}</div>}
          </div>,
          <span key="s" style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: scoreColor }}>{score}</span>,
          <DR_Badge key="st" label={r.status} color={statusColor} />,
          <span key="m" style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.mitigation || '—'}</span>,
        ];
      })}
    />
  );
}

function Section9_Timeline({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const milestones = [...(state.milestones ?? [])]
    .sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999'));

  if (milestones.length === 0) {
    return (
      <DR_EmptyState
        text="No milestones defined."
        phase="implement" tab="milestones" tabLabel="Milestones"
        onNavigate={onNavigate}
      />
    );
  }

  const statusColors: Record<string, string> = {
    upcoming: '#52C0E8',
    'in-progress': '#E8A852',
    complete: '#52E8B4',
    delayed: '#E87252',
    'at-risk': '#E8A852',
  };

  return (
    <DR_Table
      headers={['Category', 'Milestone', 'Target Date', 'Status', 'Owner']}
      rows={milestones.map(m => {
        const sc = statusColors[m.status] ?? 'var(--text-3)';
        return [
          <DR_Badge key="c" label={m.category} color="var(--text-3)" />,
          <div key="t">
            <div style={{ fontWeight: m.critical ? 700 : 500 }}>{m.title}</div>
            {m.critical && (
              <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: '#E87252', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Critical</span>
            )}
          </div>,
          <span key="d" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{m.targetDate || '—'}</span>,
          <DR_Badge key="s" label={m.status} color={sc} />,
          <span key="o">{m.owner || '—'}</span>,
        ];
      })}
    />
  );
}

function Section10_Quality({ state, onNavigate }: { state: BiodesignState; onNavigate: (p: string, t: string) => void }) {
  const profile = state.comply.profile;
  const compliance = state.comply.compliance ?? {};
  const dc = state.designControls;

  if (profile.targetMarkets.length === 0) {
    return (
      <DR_EmptyState
        text="Device profile not configured."
        phase="comply" tab="profile" tabLabel="Comply"
        onNavigate={onNavigate}
      />
    );
  }

  const activeCompliance = Object.values(compliance).filter(
    c => c.status === 'in-progress' || c.status === 'complete'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Device profile */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Device Profile
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <DR_KV label="Target Markets" value={profile.targetMarkets.join(', ').toUpperCase()} />
          <DR_KV label="Intended Environment" value={profile.isHomeUse ? 'Home Use' : 'Clinical / Hospital'} />
          {profile.hasPatientContact && (
            <DR_KV label="Patient Contact" value={`${profile.patientContactType ?? '—'} / ${profile.patientContactDuration ?? '—'}`} />
          )}
          {profile.isSaMD && <DR_KV label="Software" value="SaMD" />}
          {profile.hasAI && <DR_KV label="AI/ML" value="Yes" />}
          {profile.isImplantable && <DR_KV label="Implantable" value="Yes" />}
        </div>
      </div>

      {/* Compliance items */}
      {activeCompliance.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Active Compliance Items
          </div>
          <DR_Table
            headers={['Standard', 'Status', 'Assignee', 'Target Date']}
            rows={activeCompliance.map(ci => {
              const sc = ci.status === 'complete' ? '#52E8B4' : '#E8A852';
              return [
                <span key="s" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{ci.standardId}</span>,
                <DR_Badge key="st" label={ci.status} color={sc} />,
                <span key="a">{ci.assignee || '—'}</span>,
                <span key="d" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{ci.targetDate || '—'}</span>,
              ];
            })}
          />
        </div>
      )}

      {/* Design controls summary */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Design Controls (DHF Summary)
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Inputs', count: dc.inputs.length },
            { label: 'Outputs', count: dc.outputs.length },
            { label: 'Verifications', count: dc.verifications.length },
            { label: 'Validations', count: dc.validations.length },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, minWidth: 100,
              background: 'var(--surface-1)', border: '1px solid var(--line)',
              borderRadius: 2, padding: '12px 16px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: '#52E8B4', lineHeight: 1, marginBottom: 4 }}>
                {item.count}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section11_Appendix({ state }: { state: BiodesignState }) {
  const notes: Array<{ label: string; text: string }> = [];
  if (state.regulatory.notes) notes.push({ label: 'Regulatory Notes', text: state.regulatory.notes });
  if (state.clinical.notes) notes.push({ label: 'Clinical Notes', text: state.clinical.notes });
  if ((state.reimbursement?.notes)) notes.push({ label: 'Reimbursement Notes', text: state.reimbursement.notes });

  if (notes.length === 0) {
    return (
      <div style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic' }}>
        No supplementary notes.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {notes.map(n => (
        <div key={n.label}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            {n.label}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{n.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  .bd-dataroom-print, .bd-dataroom-print * { visibility: visible !important; }
  .bd-dataroom-print {
    position: fixed !important;
    inset: 0 !important;
    background: #fff !important;
    color: #1a1a1a !important;
    overflow: visible !important;
  }
  .bd-dataroom-sidebar { display: none !important; }
  .bd-dataroom-section { page-break-inside: avoid; }
  .bd-dataroom-section[data-pagebreak="true"] { page-break-before: always; }
}
`;

// ── Main Component ────────────────────────────────────────────────────────────

export function DataRoomOverlay({ state, onNavigate, onClose }: DataRoomProps) {
  const [activeSection, setActiveSection] = useState<string>('exec');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mainRef = useRef<HTMLDivElement>(null);

  const completions = Object.fromEntries(
    SECTIONS.map(s => [s.id, getSectionCompletion(s.id, state)])
  );

  function scrollToSection(id: string) {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    if (el && mainRef.current) {
      mainRef.current.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' });
    }
  }

  // Track active section on scroll
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    function onScroll() {
      const scrollTop = main!.scrollTop + 60;
      let current = SECTIONS[0].id;
      for (const sec of SECTIONS) {
        const el = sectionRefs.current[sec.id];
        if (el && el.offsetTop <= scrollTop) current = sec.id;
      }
      setActiveSection(current);
    }
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  const PAGE_BREAK_SECTIONS = new Set(['exec', 'regulatory', 'clinical', 'risk']);

  return (
    <div
      className="bd-dataroom-print"
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--sans)',
      }}
    >
      <style>{PRINT_STYLES}</style>

      {/* Fixed header — not printed */}
      <div className="bd-dataroom-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderBottom: '1px solid var(--line)',
        gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3 }}>
            Investor Data Room
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {state.projectName || 'Untitled Project'}
            {state.indication && (
              <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-3)', marginLeft: 10 }}>
                — {state.indication}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '6px 16px', borderRadius: 2, cursor: 'pointer',
              background: '#52C0E8', color: '#fff', border: 'none',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.09em',
            }}
          >Export PDF</button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
              background: 'none', color: 'var(--text-3)',
              border: '1px solid var(--line)',
              fontFamily: 'var(--mono)', fontSize: 13,
            }}
          >×</button>
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar */}
        <div
          className="bd-dataroom-sidebar"
          style={{
            width: 220, flexShrink: 0,
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--line)',
            overflowY: 'auto',
            padding: '20px 0',
          }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '0 18px 12px' }}>
            Sections
          </div>
          {SECTIONS.map(sec => {
            const isActive = activeSection === sec.id;
            const comp = completions[sec.id];
            const dot = completionDot(comp);
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 18px', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(82,192,232,0.07)' : 'transparent',
                  borderLeft: isActive ? `2px solid ${sec.color}` : '2px solid transparent',
                  transition: 'all 0.12s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', minWidth: 18 }}>
                  {String(sec.num).padStart(2, '0')}
                </span>
                <span style={{
                  flex: 1, fontSize: 11, fontWeight: isActive ? 600 : 400,
                  color: isActive ? sec.color : 'var(--text-3)',
                  lineHeight: 1.3,
                }}>
                  {sec.label}
                </span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: dot,
                  boxShadow: comp === 'complete' ? `0 0 5px ${dot}` : 'none',
                }} />
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div
          ref={mainRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '32px 48px',
            maxWidth: 900,
          }}
        >
          {SECTIONS.map(sec => (
            <div
              key={sec.id}
              className="bd-dataroom-section"
              data-pagebreak={PAGE_BREAK_SECTIONS.has(sec.id) ? 'true' : 'false'}
              ref={el => { sectionRefs.current[sec.id] = el; }}
              style={{ marginBottom: 56 }}
            >
              <DR_SectionHeading def={sec} />

              {sec.id === 'exec'       && <Section1_Exec state={state} />}
              {sec.id === 'need'       && <Section2_Need state={state} onNavigate={onNavigate} />}
              {sec.id === 'solution'   && <Section3_Solution state={state} onNavigate={onNavigate} />}
              {sec.id === 'regulatory' && <Section4_Regulatory state={state} onNavigate={onNavigate} />}
              {sec.id === 'clinical'   && <Section5_Clinical state={state} onNavigate={onNavigate} />}
              {sec.id === 'ip'         && <Section6_IP state={state} onNavigate={onNavigate} />}
              {sec.id === 'financial'  && <Section7_Financial state={state} onNavigate={onNavigate} />}
              {sec.id === 'risk'       && <Section8_Risk state={state} onNavigate={onNavigate} />}
              {sec.id === 'timeline'   && <Section9_Timeline state={state} onNavigate={onNavigate} />}
              {sec.id === 'quality'    && <Section10_Quality state={state} onNavigate={onNavigate} />}
              {sec.id === 'appendix'   && <Section11_Appendix state={state} />}
            </div>
          ))}

          {/* Footer */}
          <div style={{
            paddingTop: 24, marginTop: 16,
            borderTop: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)',
          }}>
            <span>Generated by Ambient Intelligence — Medical Device Innovation</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
