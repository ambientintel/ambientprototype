'use client';
import { useState } from 'react';
import { BiodesignState, ClinicalPlan } from './data';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ClinicalWizardProps {
  state: BiodesignState;
  onResult: (plan: Partial<ClinicalPlan>) => void;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#52E8B4';
const ACCENT_BG = 'rgba(82,232,180,0.06)';
const ACCENT_BORDER = 'rgba(82,232,180,0.25)';
const ACCENT_HOVER_BG = 'rgba(82,232,180,0.04)';
const ACCENT_HOVER_BORDER = 'rgba(82,232,180,0.18)';
const TOTAL_STEPS = 5;

// ── Study type ────────────────────────────────────────────────────────────────

type StudyType = 'ide-feasibility' | 'pilot' | 'pivotal' | 'rwe' | 'bench-only';
type EndpointType = 'safety' | 'efficacy' | 'both';
type DesignType = 'rct' | 'single-arm' | 'oca' | 'registry';

interface ChoiceOption {
  value: string;
  label: string;
  description: string;
}

const STUDY_TYPE_CHOICES: ChoiceOption[] = [
  {
    value: 'ide-feasibility',
    label: 'IDE Feasibility',
    description: 'First-in-human safety study, 10–30 patients, single site',
  },
  {
    value: 'pilot',
    label: 'Pilot / Early Feasibility',
    description: 'Preliminary efficacy signals, 30–80 patients',
  },
  {
    value: 'pivotal',
    label: 'Pivotal Trial',
    description: 'Definitive safety + efficacy for PMA/510(k), 100+ patients',
  },
  {
    value: 'rwe',
    label: 'Real-World Evidence',
    description: 'Registry or retrospective, large N, commercial use',
  },
  {
    value: 'bench-only',
    label: 'Bench / Lab Only',
    description: 'No clinical study required',
  },
];

const ENDPOINT_CHOICES: ChoiceOption[] = [
  {
    value: 'safety',
    label: 'Primary Safety',
    description: 'Adverse events, SAEs, device deficiencies',
  },
  {
    value: 'efficacy',
    label: 'Primary Efficacy',
    description: 'Clinical performance, effectiveness outcomes',
  },
  {
    value: 'both',
    label: 'Co-primary Safety + Efficacy',
    description: 'Dual primary endpoints for both safety and efficacy',
  },
];

const DESIGN_CHOICES: ChoiceOption[] = [
  {
    value: 'rct',
    label: 'Randomized Controlled Trial (RCT)',
    description: 'Prospective randomization with control arm',
  },
  {
    value: 'single-arm',
    label: 'Single-Arm Prospective',
    description: 'All patients receive the device; no concurrent control',
  },
  {
    value: 'oca',
    label: 'OCA (Objective Performance Criteria)',
    description: 'Performance compared to published historical benchmarks',
  },
  {
    value: 'registry',
    label: 'Registry / Post-Market Surveillance',
    description: 'Systematic data collection in routine clinical practice',
  },
];

const ENDPOINT_PLACEHOLDERS: Record<string, string> = {
  safety: 'e.g., Freedom from major adverse events at 30 days (MACE < 5%)',
  efficacy: 'e.g., Reduction in HbA1c of ≥1.0% at 12 weeks vs. baseline',
  both: 'e.g., Freedom from device-related SAEs at 6 months AND ≥80% procedure success',
  '': 'Describe your specific primary endpoint',
};

const SUGGESTED_SAMPLE: Record<StudyType, number> = {
  'ide-feasibility': 15,
  pilot: 50,
  pivotal: 150,
  rwe: 500,
  'bench-only': 0,
};

const STUDY_TYPE_LABELS: Record<StudyType, string> = {
  'ide-feasibility': 'IDE Feasibility',
  pilot: 'Pilot / Early Feasibility',
  pivotal: 'Pivotal Trial',
  rwe: 'Real-World Evidence',
  'bench-only': 'Bench / Lab Only',
};

const DESIGN_LABELS: Record<DesignType, string> = {
  rct: 'Randomized Controlled Trial (RCT)',
  'single-arm': 'Single-Arm Prospective',
  oca: 'OCA (Objective Performance Criteria)',
  registry: 'Registry / Post-Market Surveillance',
};

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--line)',
  borderRadius: 2,
  padding: '8px 10px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'var(--sans)',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

// ── Step dot indicator ────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        const upcoming = i > current;
        return (
          <div
            key={i}
            style={{
              width: done ? 8 : active ? 10 : 8,
              height: done ? 8 : active ? 10 : 8,
              borderRadius: '50%',
              background: done ? ACCENT : active ? 'transparent' : 'var(--line-strong)',
              border: active
                ? `2px solid ${ACCENT}`
                : done
                ? 'none'
                : '1px solid var(--line-strong)',
              boxShadow: active ? `0 0 0 3px rgba(82,232,180,0.2)` : 'none',
              transition: 'all 0.25s',
              animation: active ? 'clinwiz-pulse 2s ease-in-out infinite' : 'none',
              opacity: upcoming ? 0.4 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Answer card ───────────────────────────────────────────────────────────────

function AnswerCard({
  choice,
  selected,
  onSelect,
}: {
  choice: ChoiceOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        padding: '16px 20px',
        textAlign: 'left',
        background: selected
          ? ACCENT_BG
          : hovered
          ? ACCENT_HOVER_BG
          : 'var(--surface-1)',
        border: `1px solid ${
          selected ? ACCENT_BORDER : hovered ? ACCENT_HOVER_BORDER : 'var(--line)'
        }`,
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Radio circle */}
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: `2px solid ${selected ? ACCENT : 'var(--line-strong)'}`,
            background: selected ? ACCENT : 'transparent',
            flexShrink: 0,
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {selected && (
            <div
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg)' }}
            />
          )}
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: selected ? 'var(--text)' : 'var(--text-2)',
              fontFamily: 'var(--sans)',
              marginBottom: 3,
            }}
          >
            {choice.label}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-3)',
              lineHeight: 1.5,
              fontFamily: 'var(--sans)',
            }}
          >
            {choice.description}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        color: 'var(--text-4)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.16em',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

// ── Wizard state ──────────────────────────────────────────────────────────────

interface WizardData {
  studyType: StudyType | null;
  endpointType: EndpointType | null;
  endpointText: string;
  designType: DesignType | null;
  sampleSize: string;
  durationMonths: string;
  sites: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
  primarySponsor: string;
  notes: string;
}

const EMPTY_DATA: WizardData = {
  studyType: null,
  endpointType: null,
  endpointText: '',
  designType: null,
  sampleSize: '',
  durationMonths: '',
  sites: '',
  inclusionCriteria: '',
  exclusionCriteria: '',
  primarySponsor: '',
  notes: '',
};

// ── Step headers ──────────────────────────────────────────────────────────────

const STEP_HEADERS = [
  { title: 'Study Type', prompt: 'What kind of clinical study are you planning?' },
  { title: 'Primary Endpoint', prompt: 'What will you measure to determine success?' },
  { title: 'Study Design', prompt: 'What methodology will govern the trial?' },
  { title: 'Enrollment', prompt: 'Define patient population and study logistics.' },
  { title: 'Operations', prompt: 'Sponsorship, logistics, and key assumptions.' },
];

// ── Summary row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--text-4)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          width: 130,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--sans)', lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function ClinicalWizard({ state: _state, onResult, onClose }: ClinicalWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY_DATA);

  const isBenchOnly = data.studyType === 'bench-only';
  const isRwe = data.studyType === 'rwe';

  // Determine if the current step is valid (can proceed)
  function stepValid(s: number): boolean {
    if (s === 0) return data.studyType !== null;
    if (s === 1) {
      if (isBenchOnly) return true;
      return data.endpointType !== null && data.endpointText.trim().length > 0;
    }
    if (s === 2) {
      if (isBenchOnly || isRwe) return true;
      return data.designType !== null;
    }
    if (s === 3) return true; // enrollment fields are optional
    if (s === 4) return true;
    return true;
  }

  // Step visibility: some steps are effectively auto-skipped for bench-only
  function effectiveStep(raw: number): number {
    return raw; // we always show all 5 steps but adapt content
  }

  function setField<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      applyResult();
    }
  }

  function goBack() {
    if (step > 0) setStep(s => s - 1);
  }

  function applyResult() {
    // Build study design string
    let studyDesign = '';
    if (data.studyType) {
      const typeLabel = STUDY_TYPE_LABELS[data.studyType];
      if (data.designType && !isBenchOnly && !isRwe) {
        studyDesign = `${typeLabel} — ${DESIGN_LABELS[data.designType]}`;
      } else {
        studyDesign = typeLabel;
      }
    }

    const plan: Partial<ClinicalPlan> = {
      primaryEndpoint: data.endpointText || '',
      studyDesign,
      sampleSize: data.sampleSize ? parseInt(data.sampleSize, 10) : null,
      durationMonths: data.durationMonths ? parseInt(data.durationMonths, 10) : null,
      sites: data.sites ? parseInt(data.sites, 10) : null,
      inclusionCriteria: data.inclusionCriteria,
      exclusionCriteria: data.exclusionCriteria,
      primarySponsor: data.primarySponsor,
      notes: data.notes,
    };

    onResult(plan);
    onClose();
  }

  const header = STEP_HEADERS[step];
  const canProceed = stepValid(step);
  const suggestedSample = data.studyType ? SUGGESTED_SAMPLE[data.studyType] : null;

  return (
    <>
      <style>{`
        @keyframes clinwiz-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(82,232,180,0.2); }
          50%       { box-shadow: 0 0 0 5px rgba(82,232,180,0.07); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 80,
          paddingBottom: 80,
          overflowY: 'auto',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 560,
            background: 'var(--bg)',
            border: '1px solid var(--line-strong)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Header bar */}
          <div
            style={{
              padding: '24px 28px 20px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: ACCENT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  marginBottom: 5,
                }}
              >
                Clinical Study Design
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontFamily: 'var(--sans)',
                  marginBottom: 2,
                }}
              >
                {header.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-3)',
                  fontFamily: 'var(--sans)',
                }}
              >
                {header.prompt}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 4,
                color: 'var(--text-4)',
                cursor: 'pointer',
                fontSize: 18,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
                marginLeft: 16,
              }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 28px 24px' }}>
            {/* Step dots */}
            <StepDots total={TOTAL_STEPS} current={step} />

            {/* ── Step 1: Study Type ───────────────────────────────────────── */}
            {step === 0 && (
              <div>
                {STUDY_TYPE_CHOICES.map(choice => (
                  <AnswerCard
                    key={choice.value}
                    choice={choice}
                    selected={data.studyType === choice.value}
                    onSelect={() => setField('studyType', choice.value as StudyType)}
                  />
                ))}
              </div>
            )}

            {/* ── Step 2: Primary Endpoint ─────────────────────────────────── */}
            {step === 1 && (
              <div>
                {isBenchOnly ? (
                  <div
                    style={{
                      padding: '20px 20px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--line)',
                      borderRadius: 4,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-3)',
                        fontFamily: 'var(--sans)',
                        lineHeight: 1.6,
                      }}
                    >
                      Bench/Lab Only studies do not require a clinical primary endpoint.
                      You can skip this step.
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      {ENDPOINT_CHOICES.map(choice => (
                        <AnswerCard
                          key={choice.value}
                          choice={choice}
                          selected={data.endpointType === choice.value}
                          onSelect={() => setField('endpointType', choice.value as EndpointType)}
                        />
                      ))}
                    </div>
                    <div>
                      <SectionLabel>Describe your specific primary endpoint</SectionLabel>
                      <textarea
                        value={data.endpointText}
                        onChange={e => setField('endpointText', e.target.value)}
                        placeholder={
                          ENDPOINT_PLACEHOLDERS[data.endpointType ?? ''] ||
                          ENDPOINT_PLACEHOLDERS['']
                        }
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 3: Study Design ─────────────────────────────────────── */}
            {step === 2 && (
              <div>
                {isBenchOnly || isRwe ? (
                  <div
                    style={{
                      padding: '20px 20px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--line)',
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-3)',
                        fontFamily: 'var(--sans)',
                        lineHeight: 1.6,
                      }}
                    >
                      {isBenchOnly
                        ? 'Bench/Lab Only studies do not require a formal study design. You can skip this step.'
                        : 'Real-World Evidence studies use registry or retrospective designs. A specific RCT-style design is not required.'}
                    </div>
                  </div>
                ) : (
                  <>
                    {DESIGN_CHOICES.map(choice => (
                      <AnswerCard
                        key={choice.value}
                        choice={choice}
                        selected={data.designType === choice.value}
                        onSelect={() => setField('designType', choice.value as DesignType)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── Step 4: Enrollment ───────────────────────────────────────── */}
            {step === 3 && (
              <div>
                {/* Three number inputs side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <SectionLabel>Sample Size</SectionLabel>
                    <input
                      type="number"
                      min={0}
                      value={data.sampleSize}
                      onChange={e => setField('sampleSize', e.target.value)}
                      placeholder={suggestedSample != null ? String(suggestedSample) : ''}
                      style={{ ...inputStyle }}
                    />
                    {suggestedSample != null && (
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-4)',
                          fontFamily: 'var(--mono)',
                          marginTop: 4,
                        }}
                      >
                        Suggested: ~{suggestedSample}
                      </div>
                    )}
                  </div>
                  <div>
                    <SectionLabel>Duration (months)</SectionLabel>
                    <input
                      type="number"
                      min={0}
                      value={data.durationMonths}
                      onChange={e => setField('durationMonths', e.target.value)}
                      placeholder="e.g. 24"
                      style={{ ...inputStyle }}
                    />
                  </div>
                  <div>
                    <SectionLabel>Number of Sites</SectionLabel>
                    <input
                      type="number"
                      min={0}
                      value={data.sites}
                      onChange={e => setField('sites', e.target.value)}
                      placeholder="e.g. 5"
                      style={{ ...inputStyle }}
                    />
                  </div>
                </div>

                {/* Inclusion criteria */}
                <div style={{ marginBottom: 14 }}>
                  <SectionLabel>Inclusion Criteria</SectionLabel>
                  <textarea
                    value={data.inclusionCriteria}
                    onChange={e => setField('inclusionCriteria', e.target.value)}
                    placeholder="e.g. Adults 18–80 years, diagnosed with Type 2 diabetes, HbA1c ≥7.5%…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Exclusion criteria */}
                <div>
                  <SectionLabel>Exclusion Criteria</SectionLabel>
                  <textarea
                    value={data.exclusionCriteria}
                    onChange={e => setField('exclusionCriteria', e.target.value)}
                    placeholder="e.g. Prior device implant, active pregnancy, renal insufficiency (eGFR < 30)…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {/* ── Step 5: Operations + Summary ─────────────────────────────── */}
            {step === 4 && (
              <div>
                {/* Sponsor */}
                <div style={{ marginBottom: 14 }}>
                  <SectionLabel>Primary Sponsor</SectionLabel>
                  <input
                    type="text"
                    value={data.primarySponsor}
                    onChange={e => setField('primarySponsor', e.target.value)}
                    placeholder="Company / Institution name"
                    style={{ ...inputStyle }}
                  />
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 24 }}>
                  <SectionLabel>Notes</SectionLabel>
                  <textarea
                    value={data.notes}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="Key assumptions, open questions, CRO considerations…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Summary */}
                <div
                  style={{
                    background: 'var(--surface-1)',
                    border: `1px solid ${ACCENT_BORDER}`,
                    borderRadius: 4,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      color: ACCENT,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      marginBottom: 10,
                    }}
                  >
                    Study Summary
                  </div>

                  <SummaryRow
                    label="Study Type"
                    value={data.studyType ? STUDY_TYPE_LABELS[data.studyType] : ''}
                  />
                  <SummaryRow
                    label="Endpoint Type"
                    value={
                      data.endpointType
                        ? ENDPOINT_CHOICES.find(c => c.value === data.endpointType)?.label ?? ''
                        : isBenchOnly
                        ? 'N/A — Bench Only'
                        : ''
                    }
                  />
                  <SummaryRow
                    label="Primary Endpoint"
                    value={data.endpointText}
                  />
                  <SummaryRow
                    label="Study Design"
                    value={
                      data.designType && !isBenchOnly && !isRwe
                        ? DESIGN_LABELS[data.designType]
                        : isBenchOnly
                        ? 'N/A — Bench Only'
                        : isRwe
                        ? 'Real-World Evidence / Registry'
                        : ''
                    }
                  />
                  <SummaryRow
                    label="Sample Size"
                    value={data.sampleSize ? `N = ${data.sampleSize}` : ''}
                  />
                  <SummaryRow
                    label="Duration"
                    value={data.durationMonths ? `${data.durationMonths} months` : ''}
                  />
                  <SummaryRow
                    label="Sites"
                    value={data.sites ? `${data.sites} site${parseInt(data.sites, 10) !== 1 ? 's' : ''}` : ''}
                  />
                  <SummaryRow
                    label="Sponsor"
                    value={data.primarySponsor}
                  />
                </div>
              </div>
            )}

            {/* ── Navigation ───────────────────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                marginTop: 28,
              }}
            >
              {step > 0 && (
                <button
                  onClick={goBack}
                  style={{
                    padding: '10px 18px',
                    background: 'transparent',
                    color: 'var(--text-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={goNext}
                disabled={!canProceed}
                style={{
                  padding: '10px 24px',
                  background: canProceed ? ACCENT : 'var(--surface-2)',
                  color: canProceed ? '#0E1622' : 'var(--text-4)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: canProceed ? 'pointer' : 'default',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  transition: 'all 0.15s',
                }}
              >
                {step < TOTAL_STEPS - 1 ? 'Next →' : 'Apply to Project →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
