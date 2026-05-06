'use client';
import { useState } from 'react';
import { BiodesignState, RegulatoryPathway, PATHWAY_META } from './data';
import { FlowCanvas } from './flowbg';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReadinessProps {
  state: BiodesignState;
  onNavigate: (phase: string, tab: string) => void;
  onClose: () => void;
}

interface ReadinessItem {
  id: string;
  category: string;
  label: string;
  detail: string;
  check: (s: BiodesignState) => boolean;
  weight: 1 | 2 | 3;
  pathways: RegulatoryPathway[];
  navPhase: string;
  navTab: string;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

const ITEMS: ReadinessItem[] = [
  // ── Foundation ───────────────────────────────────────────────────────────────
  {
    id: 'need-exists',
    category: 'Foundation',
    label: 'Need statement documented',
    detail: 'At least one clinical need identified',
    check: s => s.needs.length > 0,
    weight: 2,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'identify',
    navTab: 'needs',
  },
  {
    id: 'need-validated',
    category: 'Foundation',
    label: 'Need validated or selected',
    detail: 'Need refined through stakeholder feedback',
    check: s => s.needs.some(n => n.status === 'validated' || n.status === 'selected'),
    weight: 3,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'identify',
    navTab: 'needs',
  },
  {
    id: 'concept-exists',
    category: 'Foundation',
    label: 'Device concept defined',
    detail: 'At least one concept in development or selected',
    check: s => s.concepts.some(c => c.status === 'selected' || c.status === 'development'),
    weight: 3,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'invent',
    navTab: 'concepts',
  },
  {
    id: 'indication',
    category: 'Foundation',
    label: 'Indication documented',
    detail: 'Device indication set in project settings',
    check: s => !!s.indication,
    weight: 1,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'identify',
    navTab: 'needs',
  },

  // ── Regulatory ───────────────────────────────────────────────────────────────
  {
    id: 'device-class',
    category: 'Regulatory',
    label: 'Device class determined',
    detail: 'Class I, II, or III must be set',
    check: s => s.regulatory.deviceClass !== 'TBD',
    weight: 3,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'product-code',
    category: 'Regulatory',
    label: 'Product code identified',
    detail: 'FDA 3-letter product code (e.g. DQO)',
    check: s => !!s.regulatory.productCode,
    weight: 2,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'predicate',
    category: 'Regulatory',
    label: 'Predicate device identified',
    detail: 'Named predicate required for substantial equivalence',
    check: s => !!s.regulatory.predicateDevice,
    weight: 3,
    pathways: ['510k'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'predicate-num',
    category: 'Regulatory',
    label: 'Predicate 510(k) number',
    detail: '510(k) number (e.g. K201234)',
    check: s => !!s.regulatory.predicateNumber,
    weight: 2,
    pathways: ['510k'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'intended-use',
    category: 'Regulatory',
    label: 'Intended use drafted',
    detail: 'Intended use statement (min. 20 characters)',
    check: s => s.regulatory.intendedUse.length >= 20,
    weight: 3,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'indications',
    category: 'Regulatory',
    label: 'Indications for use drafted',
    detail: 'Specific clinical indications documented',
    check: s => s.regulatory.indicationsForUse.length >= 20,
    weight: 2,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'se-argument',
    category: 'Regulatory',
    label: 'Substantial equivalence argument',
    detail: 'Same intended use + tech characteristics documented',
    check: s => s.regulatory.substantialEquivalence.length >= 30,
    weight: 3,
    pathways: ['510k'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },
  {
    id: 'clinical-data',
    category: 'Regulatory',
    label: 'Clinical data requirement set',
    detail: 'Bench/clinical/pivotal data level determined',
    check: s => s.regulatory.clinicalData !== 'not required' || s.regulatory.pathway === 'exempt',
    weight: 2,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'regulatory',
  },

  // ── Clinical Evidence ────────────────────────────────────────────────────────
  {
    id: 'primary-ep',
    category: 'Clinical Evidence',
    label: 'Primary endpoint defined',
    detail: 'Specific measurable primary endpoint documented',
    check: s => s.clinical.primaryEndpoint.length >= 10,
    weight: 3,
    pathways: ['pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'strategy',
  },
  {
    id: 'study-design',
    category: 'Clinical Evidence',
    label: 'Study design documented',
    detail: 'RCT, single-arm, OCA, or registry defined',
    check: s => s.clinical.studyDesign.length >= 10,
    weight: 2,
    pathways: ['pma'],
    navPhase: 'implement',
    navTab: 'strategy',
  },
  {
    id: 'sample-size',
    category: 'Clinical Evidence',
    label: 'Sample size estimated',
    detail: 'Enrollment target specified',
    check: s => (s.clinical.sampleSize ?? 0) > 0,
    weight: 2,
    pathways: ['pma'],
    navPhase: 'implement',
    navTab: 'strategy',
  },
  {
    id: 'inclusion',
    category: 'Clinical Evidence',
    label: 'Inclusion/exclusion criteria',
    detail: 'Patient eligibility criteria defined',
    check: s => s.clinical.inclusionCriteria.length >= 10,
    weight: 2,
    pathways: ['pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'strategy',
  },

  // ── Safety & Risk ─────────────────────────────────────────────────────────────
  {
    id: 'risks-5',
    category: 'Safety & Risk',
    label: 'Risk analysis initiated (>=5)',
    detail: 'Minimum 5 risks identified and documented',
    check: s => (s.risks ?? []).length >= 5,
    weight: 3,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'implement',
    navTab: 'risks',
  },
  {
    id: 'no-crit-risks',
    category: 'Safety & Risk',
    label: 'No unmitigated critical risks',
    detail: 'All P×I >=20 risks mitigated or accepted',
    check: s => !(s.risks ?? []).some(r => r.status === 'open' && r.probability * r.impact >= 20),
    weight: 3,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'risks',
  },
  {
    id: 'standards',
    category: 'Safety & Risk',
    label: 'Applicable standards identified',
    detail: 'ISO/IEC standards selected for device profile',
    check: s => Object.keys(s.comply.compliance ?? {}).length > 0,
    weight: 2,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'comply',
    navTab: 'standards',
  },
  {
    id: 'device-profile',
    category: 'Safety & Risk',
    label: 'Device profile completed',
    detail: 'Target markets and device characteristics set',
    check: s => (s.comply.profile.targetMarkets ?? []).length > 0,
    weight: 2,
    pathways: ['510k', 'pma', 'denovo', 'exempt'],
    navPhase: 'comply',
    navTab: 'profile',
  },
  {
    id: 'std-progress',
    category: 'Safety & Risk',
    label: 'Standards work initiated',
    detail: 'At least one standard in-progress or complete',
    check: s =>
      Object.values(s.comply.compliance ?? {}).some(
        c => c.status !== 'not-started' && c.status !== 'na'
      ),
    weight: 2,
    pathways: ['510k', 'pma'],
    navPhase: 'comply',
    navTab: 'standards',
  },

  // ── Design Controls ───────────────────────────────────────────────────────────
  {
    id: 'design-inputs',
    category: 'Design Controls',
    label: 'Design inputs documented',
    detail: 'User needs translated to design requirements',
    check: s => s.designControls.inputs.length > 0,
    weight: 2,
    pathways: ['510k', 'pma'],
    navPhase: 'comply',
    navTab: 'designcontrols',
  },
  {
    id: 'design-outputs',
    category: 'Design Controls',
    label: 'Design outputs documented',
    detail: 'Specifications/drawings addressing inputs',
    check: s => s.designControls.outputs.length > 0,
    weight: 2,
    pathways: ['pma'],
    navPhase: 'comply',
    navTab: 'designcontrols',
  },
  {
    id: 'verification',
    category: 'Design Controls',
    label: 'Verification activities defined',
    detail: 'V&V tests specified for design outputs',
    check: s => s.designControls.verifications.length > 0,
    weight: 1,
    pathways: ['pma'],
    navPhase: 'comply',
    navTab: 'designcontrols',
  },

  // ── IP & Commercial ───────────────────────────────────────────────────────────
  {
    id: 'ip-filing',
    category: 'IP & Commercial',
    label: 'IP filing initiated',
    detail: 'Patent, trademark, or other IP filing started',
    check: s => (s.ipFilings ?? []).length > 0,
    weight: 1,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'ipfilings',
  },
  {
    id: 'reimbursement',
    category: 'IP & Commercial',
    label: 'Reimbursement strategy',
    detail: 'CPT/DRG codes or site of service identified',
    check: s =>
      s.reimbursement.siteOfService !== null || s.reimbursement.cptCodes.length > 0,
    weight: 2,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'reimbursement',
  },
  {
    id: 'business-model',
    category: 'IP & Commercial',
    label: 'Business model documented',
    detail: 'Revenue model and TAM/SAM defined',
    check: s => !!(s.business.revenueModel && s.business.totalAddressableMarket),
    weight: 1,
    pathways: ['510k', 'pma', 'denovo'],
    navPhase: 'implement',
    navTab: 'strategy',
  },
];

// ── Score calculation ─────────────────────────────────────────────────────────

type ScoredItem = ReadinessItem & { passed: boolean };

function calcReadiness(state: BiodesignState): {
  score: number;
  items: ScoredItem[];
  byCategory: Record<string, ScoredItem[]>;
} {
  const pathway = state.regulatory.pathway;
  const applicable = ITEMS.filter(item =>
    pathway === 'tbd' ? true : item.pathways.includes(pathway)
  );
  const scored = applicable.map(item => ({ ...item, passed: item.check(state) }));
  const totalWeight = scored.reduce((sum, i) => sum + i.weight, 0);
  const passedWeight = scored.filter(i => i.passed).reduce((sum, i) => sum + i.weight, 0);
  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;

  const byCategory: Record<string, ScoredItem[]> = {};
  for (const item of scored) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  return { score, items: scored, byCategory };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#52E8B4';
  if (score >= 50) return '#E8A852';
  return '#E87252';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReadinessOverlay({ state, onNavigate, onClose }: ReadinessProps) {
  const { score, items, byCategory } = calcReadiness(state);
  const pathway = state.regulatory.pathway;
  const pathwayMeta = PATHWAY_META[pathway];
  const passedCount = items.filter(i => i.passed).length;
  const totalCount = items.length;
  const color = scoreColor(score);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = Object.keys(byCategory);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'var(--bg)',
        overflowY: 'auto',
      }}
    >
      {/* Constellation background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <FlowCanvas accent="#52E8B4" style={{ zIndex: 0 }} />
      </div>

      {/* Sticky header */}
      <div
        style={{
          background: 'linear-gradient(to bottom, rgba(19,30,44,0.96) 70%, transparent)',
          padding: '20px 40px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* Left: pathway badge + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '3px 8px',
                borderRadius: 3,
                background: pathway === 'tbd'
                  ? 'rgba(138,125,110,0.18)'
                  : `${pathwayMeta.color}22`,
                color: pathway === 'tbd' ? '#8a7d6e' : pathwayMeta.color,
                border: `1px solid ${pathway === 'tbd' ? 'rgba(138,125,110,0.24)' : `${pathwayMeta.color}44`}`,
              }}
            >
              {pathwayMeta.label}
            </span>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            Submission Readiness
          </div>
          {pathway === 'tbd' && (
            <div
              style={{
                fontSize: 11,
                color: '#E8A852',
                marginTop: 4,
                fontFamily: 'var(--mono)',
              }}
            >
              Set your regulatory pathway in Regulatory tab to see pathway-specific requirements
            </div>
          )}
        </div>

        {/* Center: score display */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              fontFamily: 'var(--mono)',
              color,
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--mono)',
              color: 'var(--text-4)',
              marginTop: 4,
            }}
          >
            {passedCount} / {totalCount} requirements met
          </div>
          {/* Progress bar */}
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 2,
              background: 'var(--line)',
              width: 200,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${score}%`,
                borderRadius: 2,
                background: color,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Right: close button */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--line)',
              borderRadius: 3,
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--mono)',
              padding: '7px 16px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Checklist content */}
      <div
        style={{
          padding: '0 40px 60px',
          maxWidth: 860,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {categories.map(category => {
          const catItems = byCategory[category];
          const passedInCat = catItems.filter(i => i.passed).length;
          const totalInCat = catItems.length;

          return (
            <div key={category} style={{ marginBottom: 32 }}>
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    color: 'var(--text-4)',
                  }}
                >
                  {category}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--mono)',
                    color: passedInCat === totalInCat ? '#52E8B4' : 'var(--text-4)',
                  }}
                >
                  {passedInCat}/{totalInCat}
                </span>
              </div>

              {/* Items */}
              {catItems.map(item => {
                const isHovered = hoveredId === item.id;
                const leftBorderStyle =
                  item.weight === 3
                    ? `3px solid ${item.passed ? '#52E8B4' : '#E87252'}`
                    : `1px solid ${item.passed ? 'rgba(82,232,180,0.14)' : 'var(--line)'}`;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.navPhase, item.navTab);
                      onClose();
                    }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      marginBottom: 4,
                      background: isHovered
                        ? item.passed
                          ? 'rgba(82,232,180,0.08)'
                          : 'rgba(255,255,255,0.04)'
                        : item.passed
                          ? 'rgba(82,232,180,0.04)'
                          : 'var(--surface-1)',
                      border: `1px solid ${item.passed ? 'rgba(82,232,180,0.14)' : 'var(--line)'}`,
                      borderLeft: leftBorderStyle,
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Check/circle icon */}
                    <span
                      style={{
                        fontSize: 14,
                        color: item.passed ? '#52E8B4' : 'var(--text-4)',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {item.passed ? '✓' : '○'}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: item.passed ? 'var(--text)' : 'var(--text-2)',
                        }}
                      >
                        {item.label}
                        {item.weight === 3 && (
                          <span
                            style={{
                              fontSize: 9,
                              marginLeft: 6,
                              padding: '1px 5px',
                              borderRadius: 2,
                              background: 'rgba(232,114,82,0.12)',
                              color: '#E87252',
                              fontFamily: 'var(--mono)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}
                          >
                            Required
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-4)',
                          marginTop: 2,
                        }}
                      >
                        {item.detail}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--text-4)',
                        fontFamily: 'var(--mono)',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      → {item.navTab}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Footer note */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            fontSize: 11,
            color: 'var(--text-4)',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.03em',
          }}
        >
          Click any item to navigate to the relevant section. Requirements shown are for your selected pathway.
        </div>
      </div>
    </div>
  );
}
