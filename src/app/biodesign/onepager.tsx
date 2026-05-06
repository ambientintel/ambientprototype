'use client';
import { BiodesignState, needScore, conceptScore, PATHWAY_META } from './data';

interface Props {
  state: BiodesignState;
  onClose: () => void;
}

export function InvestorOnePager({ state, onClose }: Props) {
  const topNeed = [...state.needs]
    .filter(n => n.status === 'selected' || n.status === 'validated')
    .sort((a, b) => (needScore(b) ?? 0) - (needScore(a) ?? 0))[0]
    ?? state.needs.sort((a, b) => (needScore(b) ?? 0) - (needScore(a) ?? 0))[0];

  const topConcept = [...state.concepts]
    .filter(c => c.status === 'selected' || c.status === 'development')
    .sort((a, b) => (conceptScore(b) ?? 0) - (conceptScore(a) ?? 0))[0]
    ?? state.concepts.sort((a, b) => (conceptScore(b) ?? 0) - (conceptScore(a) ?? 0))[0];

  const reg = state.regulatory;
  const biz = state.business;
  const reimb = state.reimbursement;
  const openRisks = (state.risks ?? []).filter(r => r.status === 'open');
  const criticalRisks = openRisks.filter(r => r.probability * r.impact >= 16);
  const upcomingMilestones = [...(state.milestones ?? [])]
    .filter(m => m.status === 'upcoming' || m.status === 'in-progress')
    .sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999'))
    .slice(0, 5);
  const competitors = state.competitors ?? [];

  const pathwayMeta = reg.pathway !== 'tbd' ? PATHWAY_META[reg.pathway] : null;

  const allCodes = [
    ...reimb.cptCodes.map(c => `CPT ${c.code}`),
    ...reimb.drgCodes.map(c => `DRG ${c.code}`),
    ...reimb.hcpcsCodes.map(c => `HCPCS ${c.code}`),
  ].slice(0, 4);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 20px', overflowY: 'auto',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bd-onepager-print" style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 2, overflow: 'hidden' }}>
        {/* Modal toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#131E2C', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(214,233,248,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Investor One-Pager</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()} style={{
              padding: '5px 14px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
              background: '#52C0E8', color: '#fff', border: 'none',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>Print / Save PDF</button>
            <button onClick={onClose} style={{ padding: '5px 12px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'none', color: 'rgba(214,233,248,0.5)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'var(--mono)' }}>Close</button>
          </div>
        </div>

        {/* One-pager content */}
        <div id="bd-onepager" style={{ padding: '44px 48px', color: '#1a1a2e', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
          {/* Header */}
          <div style={{ borderBottom: '3px solid #52C0E8', paddingBottom: 20, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#131E2C', letterSpacing: '-0.02em' }}>
                  {state.projectName || 'Untitled Project'}
                </h1>
                {state.indication && (
                  <div style={{ marginTop: 6, fontSize: 14, color: '#52C0E8', fontWeight: 600 }}>{state.indication}</div>
                )}
                {state.projectDescription && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#4a5568', lineHeight: 1.6, maxWidth: 500 }}>{state.projectDescription}</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                {pathwayMeta && (
                  <div style={{ padding: '4px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, background: pathwayMeta.color + '18', color: pathwayMeta.color, border: `1px solid ${pathwayMeta.color}44`, fontFamily: 'monospace' }}>
                    {pathwayMeta.label}
                  </div>
                )}
                {reg.deviceClass !== 'TBD' && (
                  <div style={{ padding: '4px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, background: '#131E2C18', color: '#131E2C', border: '1px solid #131E2C44', fontFamily: 'monospace' }}>
                    Class {reg.deviceClass}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Clinical Need */}
              <Section title="Clinical Need">
                {topNeed ? (
                  <>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: '#2d3748', fontStyle: 'italic' }}>
                      "A way to <strong>{topNeed.problem}</strong> for <strong>{topNeed.population}</strong>
                      {topNeed.setting ? ` in ${topNeed.setting}` : ''} so that <strong>{topNeed.outcome}</strong>."
                    </p>
                    <NeedsList needs={state.needs.filter(n => n.status === 'selected' || n.status === 'validated').slice(0, 3)} />
                  </>
                ) : <EmptyVal>No need statements defined</EmptyVal>}
              </Section>

              {/* Solution */}
              <Section title="Solution">
                {topConcept ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#131E2C', marginBottom: 5 }}>{topConcept.title}</div>
                    {topConcept.description && <p style={{ margin: 0, fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>{topConcept.description}</p>}
                    {topConcept.mechanism && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#718096', lineHeight: 1.6 }}>{topConcept.mechanism}</p>}
                  </div>
                ) : <EmptyVal>No concept selected</EmptyVal>}
              </Section>

              {/* Regulatory Pathway */}
              <Section title="Regulatory Pathway">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {reg.pathway !== 'tbd' && (
                    <KV label="Pathway">{pathwayMeta?.label} — Class {reg.deviceClass}</KV>
                  )}
                  {reg.intendedUse && <KV label="Intended Use">{reg.intendedUse}</KV>}
                  {reg.estimatedTimelineMonths && <KV label="Est. Timeline">{reg.estimatedTimelineMonths} months</KV>}
                  {reg.estimatedCost && <KV label="Est. Cost">{reg.estimatedCost}</KV>}
                  {reg.clinicalData !== 'not required' && <KV label="Clinical Evidence">{reg.clinicalData}</KV>}
                  {!reg.intendedUse && reg.pathway === 'tbd' && <EmptyVal>Regulatory strategy not yet defined</EmptyVal>}
                </div>
              </Section>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Market Opportunity */}
              <Section title="Market Opportunity">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {biz.totalAddressableMarket && <KV label="TAM">{biz.totalAddressableMarket}</KV>}
                  {biz.serviceableMarket && <KV label="SAM">{biz.serviceableMarket}</KV>}
                  {biz.revenueModel && <KV label="Revenue Model">{biz.revenueModel}</KV>}
                  {biz.averageSellingPrice && <KV label="ASP">{biz.averageSellingPrice}</KV>}
                  {!biz.totalAddressableMarket && !biz.serviceableMarket && <EmptyVal>Market sizing not entered</EmptyVal>}
                </div>
              </Section>

              {/* Reimbursement */}
              <Section title="Reimbursement Strategy">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {reimb.siteOfService && <KV label="Site of Service">{reimb.siteOfService.replace(/-/g, ' ')}</KV>}
                  {allCodes.length > 0 && <KV label="Codes">{allCodes.join(' · ')}</KV>}
                  {reimb.estimatedPayment && <KV label="Est. Payment">{reimb.estimatedPayment}</KV>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    {(['Medicare', 'Medicaid', 'Commercial'] as const).map(payer => {
                      const status = payer === 'Medicare' ? reimb.medicareCoverage : payer === 'Medicaid' ? reimb.medicaidCoverage : reimb.commercialCoverage;
                      const color = status === 'covered' ? '#1e8f68' : status === 'non-covered' ? '#a02020' : '#8a7d6e';
                      return (
                        <span key={payer} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: color + '18', color, border: `1px solid ${color}33`, fontFamily: 'monospace', fontWeight: 700 }}>
                          {payer}: {status}
                        </span>
                      );
                    })}
                  </div>
                  {!reimb.siteOfService && allCodes.length === 0 && <EmptyVal>Reimbursement strategy not entered</EmptyVal>}
                </div>
              </Section>

              {/* Competitive Position */}
              <Section title="Competitive Position">
                {competitors.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 8 }}>
                      {competitors.length} device{competitors.length > 1 ? 's' : ''} mapped across {new Set(competitors.map(c => c.company).filter(Boolean)).size} competitor{competitors.length > 1 ? 's' : ''}
                    </div>
                    {biz.competitiveAdvantage && (
                      <KV label="Differentiation">{biz.competitiveAdvantage}</KV>
                    )}
                  </div>
                ) : (
                  biz.competitiveAdvantage
                    ? <KV label="Advantage">{biz.competitiveAdvantage}</KV>
                    : <EmptyVal>Competitive analysis not entered</EmptyVal>
                )}
              </Section>
            </div>
          </div>

          {/* Full-width bottom sections */}
          {upcomingMilestones.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <SectionTitle>Next Milestones</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginTop: 10 }}>
                {upcomingMilestones.map(m => (
                  <div key={m.id} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 3 }}>
                    <div style={{ fontSize: 9, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 3 }}>{m.category}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a202c' }}>{m.title}</div>
                    {m.targetDate && <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{m.targetDate}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {openRisks.length > 0 && (
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: 3 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#744210', marginBottom: 4, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Risk Summary
              </div>
              <div style={{ fontSize: 12, color: '#744210' }}>
                {openRisks.length} open risk{openRisks.length > 1 ? 's' : ''}
                {criticalRisks.length > 0 ? ` · ${criticalRisks.length} critical` : ''}
                {criticalRisks.length > 0 && ': '}
                {criticalRisks.map(r => r.title).join(', ')}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 36, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: '#a0aec0', fontFamily: 'monospace' }}>Generated by Ambient Intelligence — Medical Device Innovation</div>
            <div style={{ fontSize: 11, color: '#a0aec0', fontFamily: 'monospace' }}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, color: '#52C0E8', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'monospace', marginBottom: 8, borderLeft: '3px solid #52C0E8', paddingLeft: 8 }}>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div>{children}</div>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12 }}>
      <span style={{ fontWeight: 700, color: '#4a5568', minWidth: 120, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: '#2d3748', lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

function EmptyVal({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#a0aec0', fontStyle: 'italic' }}>{children}</div>;
}

function NeedsList({ needs }: { needs: { id: string; status: string }[] }) {
  if (needs.length <= 1) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 11, color: '#718096' }}>
      +{needs.length - 1} additional validated need{needs.length - 1 > 1 ? 's' : ''}
    </div>
  );
}
