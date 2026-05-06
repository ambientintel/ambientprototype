'use client';
import { useState } from 'react';
import { BiodesignState } from './data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIDraftDocsProps {
  state: BiodesignState;
  onClose: () => void;
}

interface DocType {
  id: string;
  label: string;
  category: string;
  color: string;
  desc: string;
  fields: string[];
  prompt: (s: BiodesignState) => string;
}

// ── Document type definitions ─────────────────────────────────────────────────

const DOC_TYPES: DocType[] = [
  {
    id: 'qsub-cover',
    label: 'Q-Sub Cover Letter',
    category: 'Pre-Submission',
    color: '#E87252',
    desc: 'Formal cover letter for a Q-Submission package to FDA requesting a meeting',
    fields: ['projectName', 'indication', 'regulatory.pathway', 'regulatory.deviceClass', 'regulatory.intendedUse'],
    prompt: (s: BiodesignState) => `Write a professional FDA Q-Submission (Q-Sub) cover letter for the following medical device project:\n\nDevice/Product Name: ${s.projectName || '[Device Name]'}\nIndication: ${s.indication || '[Indication for Use]'}\nRegulatory Pathway: ${s.regulatory.pathway}\nDevice Class: ${s.regulatory.deviceClass}\nIntended Use: ${s.regulatory.intendedUse || '[Intended Use Statement]'}\n\nThe letter should:\n1. Identify the submitting company and contact\n2. Describe the device briefly\n3. State the purpose of the Q-Sub (regulatory strategy meeting request)\n4. List 3-5 specific questions (placeholder questions appropriate for this device type)\n5. Request a teleconference meeting format\n6. Include standard FDA Q-Sub program references\n\nFormat as a formal business letter. Use [COMPANY NAME], [ADDRESS], [DATE] placeholders where needed.`
  },
  {
    id: 'substantial-equivalence',
    label: 'Substantial Equivalence Summary',
    category: '510(k)',
    color: '#52C0E8',
    desc: 'SE argument comparing device to predicate — Section 9 of the 510(k)',
    fields: ['regulatory.intendedUse', 'regulatory.predicateDevice', 'regulatory.predicateNumber', 'regulatory.substantialEquivalence'],
    prompt: (s: BiodesignState) => `Write a Substantial Equivalence Summary for a 510(k) submission for this medical device:\n\nDevice: ${s.projectName || '[Subject Device]'}\nIndication: ${s.indication || '[Indication]'}\nIntended Use: ${s.regulatory.intendedUse || '[Intended Use]'}\nPredicate Device: ${s.regulatory.predicateDevice || '[Predicate Device Name]'} (${s.regulatory.predicateNumber || 'K-number'})\nExisting SE argument notes: ${s.regulatory.substantialEquivalence || '[none provided]'}\n\nWrite a formal 510(k) Substantial Equivalence Summary that:\n1. States the intended use comparison (same/different)\n2. States the technological characteristics comparison (same/different)\n3. If different tech characteristics: argues they don't raise new safety/effectiveness questions and device is at least as safe and effective\n4. Concludes with a clear SE determination statement\n\nUse formal FDA 510(k) language.`
  },
  {
    id: 'indications-for-use',
    label: 'Indications for Use Statement',
    category: '510(k)',
    color: '#52C0E8',
    desc: 'Formal FDA Indications for Use statement (Form FDA 3881)',
    fields: ['indication', 'regulatory.intendedUse', 'regulatory.deviceClass'],
    prompt: (s: BiodesignState) => `Write a formal FDA Indications for Use statement (for FDA Form 3881) for this medical device:\n\nDevice: ${s.projectName || '[Device Name]'}\nIndication area: ${s.indication || '[Indication]'}\nIntended Use: ${s.regulatory.intendedUse || '[Intended Use]'}\n\nWrite a concise, formal Indications for Use statement that:\n1. States what the device is intended to do\n2. Specifies the patient population\n3. Specifies the clinical setting if relevant\n4. Avoids claims of superiority or unsubstantiated efficacy claims\n5. Is appropriate for a Class ${s.regulatory.deviceClass} device\n\nAlso provide a shorter "Intended Use" statement version (1-2 sentences) for the cover sheet.`
  },
  {
    id: 'risk-summary',
    label: 'Risk Summary (ISO 14971)',
    category: 'Safety',
    color: '#E8A852',
    desc: 'Executive risk summary per ISO 14971 risk management framework',
    fields: ['risks'],
    prompt: (s: BiodesignState) => {
      const topRisks = (s.risks || []).slice(0, 10).map(r => `- ${r.description} (Likelihood: ${r.probability}/5, Severity: ${r.impact}/5) | Mitigation: ${r.mitigation || 'not specified'}`).join('\n');
      return `Write an executive risk summary for a medical device regulatory submission based on ISO 14971 risk management framework.\n\nDevice: ${s.projectName || '[Device Name]'}\nIndication: ${s.indication || '[Indication]'}\n\nIdentified risks (from risk log):\n${topRisks || 'No risks logged yet — generate representative risks for this device type'}\n\nWrite a 1-2 page risk summary that:\n1. States the risk management approach (ISO 14971:2019)\n2. Summarizes the overall residual risk conclusion\n3. Lists top risks in a table format with risk control measures\n4. States the benefit-risk determination\n5. Confirms residual risks are acceptable`;
    }
  },
  {
    id: 'clinical-protocol-outline',
    label: 'Clinical Protocol Outline',
    category: 'Clinical',
    color: '#A07EE8',
    desc: 'IDE/pivotal study protocol outline with key sections',
    fields: ['clinical', 'indication'],
    prompt: (s: BiodesignState) => `Write a clinical study protocol outline for an FDA IDE / pivotal study for this device:\n\nDevice: ${s.projectName || '[Device Name]'}\nIndication: ${s.indication || '[Indication]'}\nStudy design: ${s.clinical.studyDesign || '[Not specified — suggest appropriate design]'}\nPrimary endpoint: ${s.clinical.primaryEndpoint || '[Not specified]'}\nSample size: ${s.clinical.sampleSize || '[TBD]'} patients\nStudy duration: ${s.clinical.durationMonths || '[TBD]'} months\nSites: ${s.clinical.sites || '[TBD]'}\nInclusion criteria: ${s.clinical.inclusionCriteria || '[Not specified]'}\nExclusion criteria: ${s.clinical.exclusionCriteria || '[Not specified]'}\n\nWrite a structured clinical protocol outline with these sections:\n1. Title and Protocol Number\n2. Synopsis (objectives, design, endpoints, population)\n3. Introduction and Background\n4. Study Objectives and Endpoints\n5. Study Design\n6. Subject Selection (inclusion/exclusion)\n7. Study Procedures\n8. Statistical Considerations\n9. Safety Monitoring\n10. Ethical Considerations\n\nUse placeholder brackets where specific data is needed.`
  },
  {
    id: 'exec-summary',
    label: 'Executive Summary — Regulatory',
    category: 'Strategy',
    color: '#52E8B4',
    desc: 'High-level regulatory strategy executive summary for board or investors',
    fields: ['regulatory', 'indication', 'projectName'],
    prompt: (s: BiodesignState) => `Write a regulatory strategy executive summary for investors and board members for this medical device:\n\nDevice: ${s.projectName || '[Device Name]'}\nIndication: ${s.indication || '[Indication]'}\nPathway: ${s.regulatory.pathway} (${s.regulatory.deviceClass === 'TBD' ? 'device class TBD' : 'Class ' + s.regulatory.deviceClass})\nIntended Use: ${s.regulatory.intendedUse || '[Not specified]'}\nEstimated timeline: ${s.regulatory.estimatedTimelineMonths ? s.regulatory.estimatedTimelineMonths + ' months' : 'TBD'}\nEstimated cost: ${s.regulatory.estimatedCost || 'TBD'}\n\nWrite a 1-page executive summary covering:\n1. Device overview and unmet need\n2. Regulatory pathway rationale (why this pathway was chosen)\n3. Key regulatory risks and mitigations\n4. Timeline to clearance/approval\n5. Estimated regulatory investment\n6. Post-market requirements\n\nWrite in a professional tone appropriate for sophisticated investors. Be specific about FDA process and timeline.`
  },
  {
    id: 'predicate-comparison',
    label: 'Predicate Comparison Table',
    category: '510(k)',
    color: '#52C0E8',
    desc: 'Side-by-side comparison table of subject device vs predicate (Section 9)',
    fields: ['regulatory.predicateDevice', 'regulatory.intendedUse'],
    prompt: (s: BiodesignState) => `Create a predicate device comparison table for a 510(k) submission.\n\nSubject Device: ${s.projectName || '[Subject Device]'}\nIntended Use: ${s.regulatory.intendedUse || '[Intended Use]'}\nPredicate Device: ${s.regulatory.predicateDevice || '[Predicate Device]'} (${s.regulatory.predicateNumber || '[K-number]'})\n\nCreate a formatted comparison table with these rows:\n1. Intended Use\n2. Indications for Use\n3. Device Description (key components)\n4. Principle of Operation\n5. Materials (patient-contacting)\n6. Energy Source (if applicable)\n7. Software (if applicable)\n8. Sterilization Method\n9. Shelf Life\n10. Labeling\n\nFor each row: Subject Device | Predicate Device | Same/Different | Notes\n\nAfter the table, write a 2-paragraph SE conclusion statement.`
  },
  {
    id: 'benefit-risk',
    label: 'Benefit-Risk Determination',
    category: 'PMA',
    color: '#A07EE8',
    desc: 'Structured benefit-risk framework summary for PMA submissions',
    fields: ['indication', 'risks', 'clinical'],
    prompt: (s: BiodesignState) => `Write a benefit-risk determination framework summary for a PMA submission.\n\nDevice: ${s.projectName || '[Device Name]'}\nIndication: ${s.indication || '[Indication]'}\nClinical evidence: ${s.clinical.studyDesign ? s.clinical.studyDesign + ', n=' + (s.clinical.sampleSize || 'TBD') : '[Clinical data TBD]'}\nPrimary endpoint: ${s.clinical.primaryEndpoint || '[Not specified]'}\n\nWrite a structured benefit-risk determination per FDA's benefit-risk framework that covers:\n1. Probable Benefits (magnitude, probability, duration)\n2. Probable Risks (characterize each serious risk)\n3. Patient Perspective (unmet need severity, alternatives available)\n4. Risk Mitigation Measures\n5. Overall Benefit-Risk Conclusion\n\nUse FDA PMA benefit-risk language throughout.`
  },
];

// ── Category grouping ─────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['Pre-Submission', '510(k)', 'Safety', 'Clinical', 'Strategy', 'PMA'];

// ── Field label map ───────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  projectName: 'Project Name',
  indication: 'Indication',
  'regulatory.pathway': 'Regulatory Pathway',
  'regulatory.deviceClass': 'Device Class',
  'regulatory.intendedUse': 'Intended Use',
  'regulatory.predicateDevice': 'Predicate Device',
  'regulatory.predicateNumber': 'Predicate K-Number',
  'regulatory.substantialEquivalence': 'SE Argument Notes',
  'regulatory.estimatedTimelineMonths': 'Estimated Timeline',
  'regulatory.estimatedCost': 'Estimated Cost',
  regulatory: 'Regulatory Profile',
  risks: 'Risk Register',
  clinical: 'Clinical Plan',
};

// ── Field value resolver ──────────────────────────────────────────────────────

function getFieldValue(state: BiodesignState, field: string): string {
  const parts = field.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = state;
  for (const part of parts) {
    if (val == null) return '';
    val = val[part];
  }
  if (val == null) return '';
  if (typeof val === 'object') {
    // arrays
    if (Array.isArray(val)) return val.length > 0 ? `${val.length} item${val.length !== 1 ? 's' : ''}` : '';
    // objects — count non-empty keys
    const filled = Object.values(val).filter(v => v !== '' && v !== null && v !== undefined && v !== 'tbd' && v !== 'TBD').length;
    return filled > 0 ? `${filled} field${filled !== 1 ? 's' : ''} filled` : '';
  }
  return String(val);
}

function hasFieldData(state: BiodesignState, field: string): boolean {
  const val = getFieldValue(state, field);
  return val !== '' && val !== 'tbd' && val !== 'TBD';
}

// ── Skeleton lines ────────────────────────────────────────────────────────────

function SkeletonLines() {
  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[100, 85, 92, 70, 88, 60, 95, 75, 82, 65, 90, 55, 78].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            width: `${w}%`,
            background: 'var(--surface-2)',
            borderRadius: 2,
            animation: `aidraft-skeleton 1.6s ease-in-out ${(i * 0.08).toFixed(2)}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes aidraft-skeleton {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.70; }
        }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AIDraftDocsOverlay({ state, onClose }: AIDraftDocsProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedDoc = DOC_TYPES.find(d => d.id === selectedDocId) ?? null;

  // Group doc types by category
  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    docs: DOC_TYPES.filter(d => d.category === cat),
  })).filter(g => g.docs.length > 0);

  function selectDoc(id: string) {
    if (id !== selectedDocId) {
      setSelectedDocId(id);
      setOutput(null);
      setError(null);
      setGeneratedAt(null);
    }
  }

  async function generate() {
    if (!selectedDoc) return;
    setGenerating(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetch('/api/biodesign/draftdoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: selectedDoc.prompt(state), projectId: 'draft-doc' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed');
      setOutput(data.text ?? '');
      setGeneratedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: no-op
    }
  }

  function clear() {
    setOutput(null);
    setError(null);
    setGeneratedAt(null);
  }

  // Format time
  function fmtTime(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9200,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 54,
        borderBottom: '1px solid var(--line)',
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            AI Document Drafting
          </span>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 8,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#E87252',
            background: 'rgba(232,114,82,0.12)',
            border: '1px solid rgba(232,114,82,0.3)',
            padding: '2px 6px',
            borderRadius: 2,
          }}>
            BETA
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: '1px solid var(--line)',
            borderRadius: 2,
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            padding: '5px 14px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          Close
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel — doc type selector */}
        <div style={{
          width: 300,
          flexShrink: 0,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--line)',
          overflowY: 'auto',
          padding: '20px 0',
        }}>
          {grouped.map(group => (
            <div key={group.category} style={{ marginBottom: 4 }}>
              {/* Category header */}
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'var(--text-4)',
                padding: '8px 20px 6px',
              }}>
                {group.category}
              </div>

              {/* Doc type cards */}
              {group.docs.map(doc => {
                const isActive = selectedDocId === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => selectDoc(doc.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 20px 10px 17px',
                      background: isActive ? 'var(--surface-2)' : 'var(--surface-1)',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${doc.color}` : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      marginBottom: 1,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-1)';
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--text)' : 'var(--text-2)',
                      marginBottom: 3,
                      letterSpacing: '-0.005em',
                    }}>
                      {doc.label}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-3)',
                      lineHeight: 1.5,
                    }}>
                      {doc.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right panel — content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Empty state */}
          {!selectedDoc && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 14,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, opacity: 0.10 }}>▣</div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--text-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
              }}>
                Select a document type to generate
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--text-3)',
                maxWidth: 380,
                lineHeight: 1.7,
              }}>
                Choose from {DOC_TYPES.length} FDA and regulatory document types. The AI will populate each document with your project data.
              </div>
            </div>
          )}

          {/* Doc selected — not yet generated */}
          {selectedDoc && !generating && !output && (
            <div style={{ maxWidth: 720 }}>
              {/* Doc header */}
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: selectedDoc.color,
                    boxShadow: `0 0 8px ${selectedDoc.color}`,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    color: selectedDoc.color,
                  }}>
                    {selectedDoc.category}
                  </span>
                </div>
                <h2 style={{
                  margin: '0 0 8px',
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                }}>
                  {selectedDoc.label}
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'var(--text-3)',
                  lineHeight: 1.65,
                }}>
                  {selectedDoc.desc}
                </p>
              </div>

              {/* Required data section */}
              <div style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 2,
                padding: 20,
                marginBottom: 20,
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: 'var(--text-4)',
                  marginBottom: 14,
                }}>
                  Required project data
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedDoc.fields.map(field => {
                    const has = hasFieldData(state, field);
                    const val = getFieldValue(state, field);
                    const label = FIELD_LABELS[field] ?? field;
                    return (
                      <div
                        key={field}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          color: has ? '#52E8B4' : 'var(--text-4)',
                          flexShrink: 0,
                          marginTop: 1,
                        }}>
                          {has ? '✓' : '○'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            fontWeight: 600,
                            color: has ? 'var(--text-2)' : 'var(--text-4)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 2,
                          }}>
                            {label}
                          </div>
                          {has && (
                            <div style={{
                              fontSize: 12,
                              color: 'var(--text-3)',
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {val}
                            </div>
                          )}
                          {!has && (
                            <div style={{ fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic' }}>
                              Not filled — AI will use placeholders
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(200,60,60,0.08)',
                  border: '1px solid rgba(200,60,60,0.25)',
                  borderRadius: 2,
                  marginBottom: 16,
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: '#e08080',
                }}>
                  {error}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={generate}
                style={{
                  padding: '13px 32px',
                  background: '#E87252',
                  color: '#0E1622',
                  border: 'none',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 20,
                  transition: 'opacity 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(232,114,82,0.45)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
              >
                Generate Document
              </button>

              {/* Disclaimer */}
              <div style={{
                fontSize: 11,
                color: 'var(--text-4)',
                lineHeight: 1.65,
                fontStyle: 'italic',
              }}>
                AI-generated draft. Review carefully — always have qualified regulatory counsel review before submission.
              </div>
            </div>
          )}

          {/* Generating state */}
          {generating && (
            <div style={{ maxWidth: 720 }}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ animation: 'aidraft-spin 1.2s linear infinite', display: 'inline-block' }}>◌</span>
                Generating…
              </div>
              <div style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 2,
              }}>
                <SkeletonLines />
              </div>
              <style>{`
                @keyframes aidraft-spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Generated output */}
          {selectedDoc && !generating && output && (
            <div style={{ maxWidth: 720 }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                gap: 12,
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: selectedDoc.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    marginBottom: 4,
                  }}>
                    {selectedDoc.category}
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text)',
                    letterSpacing: '-0.02em',
                  }}>
                    {selectedDoc.label}
                  </div>
                </div>
                {generatedAt && (
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: 'var(--text-4)',
                    textAlign: 'right',
                  }}>
                    Generated {fmtTime(generatedAt)}
                  </div>
                )}
              </div>

              {/* Warning banner */}
              <div style={{
                padding: '10px 14px',
                background: 'rgba(232,168,82,0.08)',
                border: '1px solid rgba(232,168,82,0.25)',
                borderRadius: 2,
                marginBottom: 16,
                fontSize: 11,
                color: '#E8A852',
                lineHeight: 1.6,
                fontFamily: 'var(--mono)',
              }}>
                This is an AI-generated draft. Do not submit without qualified regulatory review.
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '7px 18px',
                    background: copied ? 'rgba(82,232,180,0.12)' : 'var(--surface-2)',
                    color: copied ? '#52E8B4' : 'var(--text-2)',
                    border: copied ? '1px solid rgba(82,232,180,0.3)' : '1px solid var(--line)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    transition: 'all 0.15s',
                  }}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={generate}
                  style={{
                    padding: '7px 18px',
                    background: 'transparent',
                    color: 'var(--text-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Regenerate
                </button>
                <button
                  onClick={clear}
                  style={{
                    padding: '7px 16px',
                    background: 'transparent',
                    color: 'var(--text-4)',
                    border: '1px solid var(--line)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Document output */}
              <div style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 2,
                padding: 28,
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                lineHeight: 1.7,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
              }}>
                {output}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
