'use client';
import { useState } from 'react';
import { BiodesignState, PATHWAY_META } from './data';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface RegulatoryWizardProps {
  state: BiodesignState;
  onResult: (pathway: string, deviceClass: string, reasoning: string) => void;
  onClose: () => void;
}

// ── Question definitions ──────────────────────────────────────────────────────

interface Choice {
  label: string;
  description?: string;
  value: string;
}

interface Question {
  id: string;
  title: string;
  prompt: string;
  choices: Choice[];
}

const QUESTIONS: Question[] = [
  {
    id: 'risk',
    title: 'Device Risk',
    prompt: 'Does your device sustain life, have permanent contact with the body, or pose high risk if it fails?',
    choices: [
      { value: 'high',     label: 'Yes — high risk',        description: 'Life-sustaining, permanent implant, or critical failure risk' },
      { value: 'moderate', label: 'Possibly — moderate risk', description: 'Significant but not life-critical consequences if device fails' },
      { value: 'low',      label: 'No — low risk',           description: 'Minimal patient risk, non-critical function' },
    ],
  },
  {
    id: 'software',
    title: 'Software',
    prompt: 'Is your device primarily software-based (SaMD / AI diagnostic)?',
    choices: [
      { value: 'samd',     label: 'Yes, standalone software', description: 'SaMD or AI/ML diagnostic — software is the device' },
      { value: 'partial',  label: 'Partially (software component)', description: 'Embedded software or firmware, hardware-primary device' },
      { value: 'hardware', label: 'No, hardware device',     description: 'Traditional hardware device without significant software' },
    ],
  },
  {
    id: 'predicate',
    title: 'Predicate',
    prompt: 'Does a substantially equivalent legally marketed device already exist (same intended use, similar technology)?',
    choices: [
      { value: 'clear',  label: 'Yes, clear predicate exists',   description: 'Legally marketed device with same intended use and similar technology' },
      { value: 'similar', label: 'Similar but novel technology', description: 'Same intended use, but different technological characteristics' },
      { value: 'novel',  label: 'No, truly novel device',        description: 'First-of-kind — no substantially equivalent predicate' },
    ],
  },
  {
    id: 'evidence',
    title: 'Clinical Evidence',
    prompt: 'What level of clinical evidence do you have or plan to generate?',
    choices: [
      { value: 'rct',       label: 'Full RCT / IDE study',            description: 'Randomized controlled trial or IDE study with pivotal data' },
      { value: 'limited',   label: 'Bench testing + limited clinical', description: 'Bench/analytical testing with some clinical validation' },
      { value: 'predicate', label: 'Predicate data only',              description: 'Relying on published predicate device clinical data' },
    ],
  },
  {
    id: 'timeline',
    title: 'Timeline',
    prompt: 'What is your commercialization timeline target?',
    choices: [
      { value: 'fast',   label: '< 18 months',           description: 'Rapid path to market required' },
      { value: 'medium', label: '18 – 36 months',         description: 'Standard development and clearance timeline' },
      { value: 'long',   label: '3 – 5 years acceptable', description: 'Can absorb longer regulatory review and study requirements' },
    ],
  },
];

// ── Scoring logic ─────────────────────────────────────────────────────────────

type PathwayKey = '510k' | 'pma' | 'denovo' | 'exempt';
type AnswerMap = Record<string, string>;

interface Recommendation {
  pathway: PathwayKey;
  deviceClass: 'I' | 'II' | 'III';
  bullets: string[];
}

function score(answers: AnswerMap): Recommendation {
  const scores: Record<PathwayKey, number> = { exempt: 0, '510k': 0, denovo: 0, pma: 0 };

  // ── Risk ──────────────────────────────────────────────────────────────────
  if (answers.risk === 'high')     { scores.pma    += 4; scores.denovo += 1; }
  if (answers.risk === 'moderate') { scores['510k'] += 3; scores.denovo += 2; }
  if (answers.risk === 'low')      { scores.exempt  += 4; scores['510k'] += 2; }

  // ── Software ──────────────────────────────────────────────────────────────
  if (answers.software === 'samd')     { scores.denovo += 2; scores['510k'] += 1; }
  if (answers.software === 'partial')  { /* neutral */ }
  if (answers.software === 'hardware') { /* neutral */ }

  // ── Predicate ─────────────────────────────────────────────────────────────
  if (answers.predicate === 'clear')   { scores['510k'] += 4; }
  if (answers.predicate === 'similar') { scores.denovo  += 3; scores['510k'] += 1; }
  if (answers.predicate === 'novel')   { scores.pma     += 3; scores.denovo  += 2; }

  // ── Evidence ──────────────────────────────────────────────────────────────
  if (answers.evidence === 'rct')       { scores.pma    += 3; scores.denovo += 1; }
  if (answers.evidence === 'limited')   { scores['510k'] += 2; scores.denovo += 2; }
  if (answers.evidence === 'predicate') { scores['510k'] += 3; }

  // ── Timeline ──────────────────────────────────────────────────────────────
  if (answers.timeline === 'fast')   { scores.exempt  += 2; scores['510k'] += 2; }
  if (answers.timeline === 'medium') { scores['510k'] += 1; scores.denovo  += 1; }
  if (answers.timeline === 'long')   { scores.pma     += 2; }

  // Pick winner
  const entries = Object.entries(scores) as [PathwayKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const winner = entries[0][0];

  // Device class
  const deviceClass: 'I' | 'II' | 'III' =
    winner === 'pma'    ? 'III' :
    winner === 'exempt' ? 'I'   : 'II';

  // Build reasoning bullets
  const bullets: string[] = [];

  // Risk bullet
  if (answers.risk === 'high')     bullets.push('High device risk profile aligns with Class III classification and PMA requirements.');
  if (answers.risk === 'moderate') bullets.push('Moderate device risk is consistent with Class II and the 510(k) or De Novo pathway.');
  if (answers.risk === 'low')      bullets.push('Low risk profile supports Class I Exempt or expedited 510(k) clearance.');

  // Software bullet
  if (answers.software === 'samd')    bullets.push('Standalone software (SaMD/AI) typically requires De Novo or 510(k) with special controls per FDA Digital Health guidance.');
  if (answers.software === 'partial') bullets.push('Embedded software may require a Software Bill of Materials (SBOM) and IEC 62304 compliance documentation.');

  // Predicate bullet
  if (answers.predicate === 'clear')   bullets.push('A clear predicate device enables a 510(k) substantial equivalence argument.');
  if (answers.predicate === 'similar') bullets.push('Novel technology with an existing intended-use predicate suggests De Novo as the appropriate pathway.');
  if (answers.predicate === 'novel')   bullets.push('No predicate exists — PMA with clinical data or De Novo classification is required for a novel device.');

  // Evidence bullet
  if (answers.evidence === 'rct')       bullets.push('Full RCT / IDE study data can satisfy PMA or De Novo clinical requirements.');
  if (answers.evidence === 'limited')   bullets.push('Limited clinical data is typically sufficient for 510(k) or De Novo if predicate performance benchmarks are met.');
  if (answers.evidence === 'predicate') bullets.push('Relying on predicate clinical data is acceptable for a traditional 510(k) submission.');

  // Timeline bullet
  if (answers.timeline === 'fast')   bullets.push('A sub-18-month timeline is achievable for Exempt devices or well-supported 510(k) submissions with a strong predicate.');
  if (answers.timeline === 'medium') bullets.push('An 18–36 month timeline aligns with a 510(k) or De Novo review cycle including device testing.');
  if (answers.timeline === 'long')   bullets.push('A 3–5 year horizon accommodates PMA clinical studies, IDE approval, and full FDA review.');

  return { pathway: winner, deviceClass, bullets };
}

// ── Step dot indicator ────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => {
        const done    = i < current;
        const active  = i === current;
        const upcoming = i > current;
        return (
          <div
            key={i}
            style={{
              width: done ? 8 : active ? 10 : 8,
              height: done ? 8 : active ? 10 : 8,
              borderRadius: '50%',
              background: done ? 'var(--accent)' : active ? 'transparent' : 'var(--line-strong)',
              border: active ? '2px solid var(--accent)' : done ? 'none' : '1px solid var(--line-strong)',
              boxShadow: active ? '0 0 0 3px rgba(82,192,232,0.2)' : 'none',
              transition: 'all 0.25s',
              animation: active ? 'regwiz-pulse 2s ease-in-out infinite' : 'none',
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
  choice: Choice;
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
        padding: 16,
        textAlign: 'left',
        background: selected
          ? 'rgba(82,192,232,0.10)'
          : hovered
          ? 'rgba(82,192,232,0.05)'
          : 'var(--surface-1)',
        border: `1px solid ${selected ? 'var(--accent)' : hovered ? 'rgba(82,192,232,0.3)' : 'var(--line-strong)'}`,
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Radio circle */}
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${selected ? 'var(--accent)' : 'var(--line-strong)'}`,
          background: selected ? 'var(--accent)' : 'transparent',
          flexShrink: 0,
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {selected && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg)' }} />
          )}
        </div>
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: selected ? 'var(--text)' : 'var(--text-2)',
            fontFamily: 'var(--sans)',
            marginBottom: choice.description ? 4 : 0,
          }}>
            {choice.label}
          </div>
          {choice.description && (
            <div style={{
              fontSize: 12,
              color: 'var(--text-3)',
              lineHeight: 1.5,
              fontFamily: 'var(--sans)',
            }}>
              {choice.description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Result screen ─────────────────────────────────────────────────────────────

function ResultScreen({
  recommendation,
  onApply,
  onStartOver,
}: {
  recommendation: Recommendation;
  onApply: () => void;
  onStartOver: () => void;
}) {
  const { pathway, deviceClass, bullets } = recommendation;
  const meta = PATHWAY_META[pathway];
  const color = meta?.color ?? '#8a7d6e';

  return (
    <div>
      {/* Recommended pathway badge */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 40px',
          background: color + '18',
          border: `1px solid ${color}55`,
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginBottom: 8,
          }}>
            Recommended Pathway
          </div>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 36,
            fontWeight: 800,
            color,
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {meta?.label ?? pathway.toUpperCase()}
          </div>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: color + 'bb',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>
            FDA Class {deviceClass} Device
          </div>
        </div>

        {/* Class detail pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: 'var(--surface-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 20,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Device Class {deviceClass} · {
              deviceClass === 'I' ? 'General Controls' :
              deviceClass === 'II' ? 'General + Special Controls' :
              'Premarket Approval'
            }
          </span>
        </div>
      </div>

      {/* Reasoning bullets */}
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: '16px 20px',
        marginBottom: 28,
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--text-4)',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          marginBottom: 14,
        }}>
          Reasoning
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
                marginTop: 7,
              }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, fontFamily: 'var(--sans)' }}>
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-4)',
        lineHeight: 1.5,
        fontFamily: 'var(--sans)',
        padding: '10px 12px',
        background: 'rgba(232,114,82,0.06)',
        border: '1px solid rgba(232,114,82,0.15)',
        borderRadius: 4,
        marginBottom: 24,
      }}>
        This recommendation is a starting point only. FDA regulatory pathway determination requires consultation with a qualified regulatory professional.
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onApply}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          Apply to Project
        </button>
        <button
          onClick={onStartOver}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            color: 'var(--text-3)',
            border: '1px solid var(--line-strong)',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function RegulatoryWizard({ state: _state, onResult, onClose }: RegulatoryWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = QUESTIONS[step];
  const selectedAnswer = answers[currentQuestion?.id ?? ''] ?? null;
  const recommendation = showResult ? score(answers) : null;

  function selectAnswer(value: string) {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  }

  function goNext() {
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      setShowResult(true);
    }
  }

  function goBack() {
    if (showResult) {
      setShowResult(false);
    } else if (step > 0) {
      setStep(s => s - 1);
    }
  }

  function startOver() {
    setStep(0);
    setAnswers({});
    setShowResult(false);
  }

  function handleApply() {
    if (!recommendation) return;
    const meta = PATHWAY_META[recommendation.pathway];
    onResult(
      recommendation.pathway,
      recommendation.deviceClass,
      recommendation.bullets.join('\n')
    );
    onClose();
  }

  return (
    <>
      {/* Pulse animation */}
      <style>{`
        @keyframes regwiz-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(82,192,232,0.2); }
          50%       { box-shadow: 0 0 0 5px rgba(82,192,232,0.08); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 60,
          paddingBottom: 60,
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
            borderRadius: 8,
            padding: '32px 32px 28px',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                marginBottom: 4,
              }}>
                FDA Regulatory Wizard
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                fontFamily: 'var(--sans)',
              }}>
                Pathway Recommendation
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
              }}
            >
              ×
            </button>
          </div>

          {/* Progress dots — shown during questions only */}
          {!showResult && (
            <StepDots total={QUESTIONS.length} current={step} />
          )}

          {/* Content */}
          {showResult && recommendation ? (
            <ResultScreen
              recommendation={recommendation}
              onApply={handleApply}
              onStartOver={startOver}
            />
          ) : (
            <>
              {/* Question */}
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 12,
                }}>
                  Question {step + 1} of {QUESTIONS.length} · {currentQuestion.title}
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--text)',
                  lineHeight: 1.4,
                  fontFamily: 'var(--sans)',
                }}>
                  {currentQuestion.prompt}
                </div>
              </div>

              {/* Answer cards */}
              <div style={{ marginBottom: 24 }}>
                {currentQuestion.choices.map(choice => (
                  <AnswerCard
                    key={choice.value}
                    choice={choice}
                    selected={selectedAnswer === choice.value}
                    onSelect={() => selectAnswer(choice.value)}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {step > 0 && (
                  <button
                    onClick={goBack}
                    style={{
                      padding: '10px 18px',
                      background: 'transparent',
                      color: 'var(--text-3)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Back
                  </button>
                )}
                <div style={{ flex: 1 }} />
                <button
                  onClick={goNext}
                  disabled={!selectedAnswer}
                  style={{
                    padding: '10px 24px',
                    background: selectedAnswer ? 'var(--accent)' : 'var(--surface-2)',
                    color: selectedAnswer ? '#fff' : 'var(--text-4)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: selectedAnswer ? 'pointer' : 'default',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    transition: 'all 0.15s',
                  }}
                >
                  {step < QUESTIONS.length - 1 ? 'Next →' : 'Get Recommendation →'}
                </button>
              </div>
            </>
          )}

          {/* Back button on result screen */}
          {showResult && (
            <button
              onClick={goBack}
              style={{
                marginTop: 12,
                display: 'block',
                background: 'none',
                border: 'none',
                color: 'var(--text-4)',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '4px 0',
              }}
            >
              ← Back to questions
            </button>
          )}
        </div>
      </div>
    </>
  );
}
