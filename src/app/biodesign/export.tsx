import { BiodesignState, needScore, conceptScore, PATHWAY_META } from './data';

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
      <span style={{ minWidth: 180, fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{String(value)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32, breakInside: 'avoid' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2D72D2', borderBottom: '1px solid #e0e0e0', paddingBottom: 6 }}>{title}</h3>
      {children}
    </div>
  );
}

export function ProjectExportView({ state }: { state: BiodesignState }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      color: '#1a1a1a',
      background: '#fff',
      padding: '48px 56px',
      maxWidth: 860,
      margin: '0 auto',
      lineHeight: 1.5,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40, borderBottom: '2px solid #1a1a1a', paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#2D72D2', marginBottom: 8 }}>
              Ambient Intelligence — Biodesign Platform
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: '#1a1a1a' }}>
              {state.projectName || 'Untitled Project'}
            </h1>
            {state.indication && (
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#555' }}>{state.indication}</p>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#888' }}>
            <div>Exported {today}</div>
          </div>
        </div>
        {state.projectDescription && (
          <p style={{ margin: '16px 0 0', fontSize: 13, color: '#444', lineHeight: 1.7 }}>{state.projectDescription}</p>
        )}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 40 }}>
        {[
          { label: 'Needs', value: state.needs.length },
          { label: 'Stakeholders', value: state.stakeholders.length },
          { label: 'Concepts', value: state.concepts.length },
          { label: 'IP Filings', value: state.ipFilings.length },
          { label: 'Standards', value: Object.keys(state.comply.compliance).length },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2D72D2' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Phase 1: Identify */}
      {(state.needs.length > 0 || state.stakeholders.length > 0) && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3DCC91', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: 4, background: '#3DCC91', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</span>
            Phase 1 — Identify
          </h2>

          {state.needs.length > 0 && (
            <Section title={`Need Statements (${state.needs.length})`}>
              {state.needs.map((n, i) => {
                const score = needScore(n);
                return (
                  <div key={n.id} style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid #e8e8e8', borderRadius: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>#{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#f0f0f0', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{n.status}</span>
                      {score !== null && <span style={{ fontSize: 11, color: '#2D72D2', fontWeight: 600 }}>Score: {score}/5</span>}
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                      A way to {n.problem || '—'}
                    </p>
                    {n.population && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#555' }}>For: {n.population}</p>}
                    {n.setting && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#555' }}>In: {n.setting}</p>}
                    {n.outcome && <p style={{ margin: 0, fontSize: 12, color: '#555' }}>So that: {n.outcome}</p>}
                  </div>
                );
              })}
            </Section>
          )}

          {state.stakeholders.length > 0 && (
            <Section title={`Stakeholders (${state.stakeholders.length})`}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {state.stakeholders.map(s => (
                  <div key={s.id} style={{ padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.role} · Influence {s.influence}/5 · Interest {s.interest}/5</div>
                    {s.painPoints && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{s.painPoints}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Phase 2: Invent */}
      {state.concepts.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2D72D2', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: 4, background: '#2D72D2', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>2</span>
            Phase 2 — Invent
          </h2>
          <Section title={`Concepts (${state.concepts.length})`}>
            {state.concepts.map((c, i) => {
              const score = conceptScore(c);
              return (
                <div key={c.id} style={{ marginBottom: 14, padding: '12px 14px', border: '1px solid #e8e8e8', borderRadius: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>#{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#f0f0f0', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.status}</span>
                    {score !== null && <span style={{ fontSize: 11, color: '#2D72D2', fontWeight: 600 }}>Score: {score}/5</span>}
                  </div>
                  {c.description && <p style={{ margin: '0 0 4px', fontSize: 12, color: '#444' }}>{c.description}</p>}
                  {c.mechanism && <p style={{ margin: 0, fontSize: 12, color: '#666', fontStyle: 'italic' }}>{c.mechanism}</p>}
                </div>
              );
            })}
          </Section>
        </div>
      )}

      {/* Phase 3: Implement */}
      {(state.regulatory.pathway !== 'tbd' || state.ipFilings.length > 0 || state.business.targetMarketDescription) && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9B59B6', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: 4, background: '#9B59B6', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>3</span>
            Phase 3 — Implement
          </h2>

          <Section title="Regulatory Strategy">
            <Row label="Device Class" value={state.regulatory.deviceClass} />
            <Row label="Pathway" value={PATHWAY_META[state.regulatory.pathway].label} />
            <Row label="Product Code" value={state.regulatory.productCode} />
            <Row label="Predicate Device" value={state.regulatory.predicateDevice} />
            <Row label="Predicate Number" value={state.regulatory.predicateNumber} />
            <Row label="Intended Use" value={state.regulatory.intendedUse} />
            <Row label="Indications for Use" value={state.regulatory.indicationsForUse} />
            <Row label="Clinical Data" value={state.regulatory.clinicalData} />
            <Row label="Timeline" value={state.regulatory.estimatedTimelineMonths ? `${state.regulatory.estimatedTimelineMonths} months` : null} />
            <Row label="Estimated Cost" value={state.regulatory.estimatedCost} />
          </Section>

          {state.ipFilings.length > 0 && (
            <Section title={`IP Portfolio (${state.ipFilings.length} filings)`}>
              {state.ipFilings.map((f, i) => (
                <div key={f.id} style={{ display: 'flex', gap: 12, marginBottom: 8, padding: '8px 12px', border: '1px solid #e8e8e8', borderRadius: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888', paddingTop: 2 }}>#{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{f.title || 'Untitled'}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{f.type.toUpperCase()} · {f.status} {f.applicationNumber ? `· ${f.applicationNumber}` : ''}</div>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {state.business.targetMarketDescription && (
            <Section title="Business Model">
              <Row label="Target Market" value={state.business.targetMarketDescription} />
              <Row label="TAM" value={state.business.totalAddressableMarket} />
              <Row label="SAM" value={state.business.serviceableMarket} />
              <Row label="Revenue Model" value={state.business.revenueModel} />
              <Row label="ASP" value={state.business.averageSellingPrice} />
              <Row label="COGS" value={state.business.costOfGoods} />
              <Row label="Reimbursement" value={state.business.reimbursementCode} />
            </Section>
          )}

          {state.clinical.primaryEndpoint && (
            <Section title="Clinical Plan">
              <Row label="Primary Endpoint" value={state.clinical.primaryEndpoint} />
              <Row label="Study Design" value={state.clinical.studyDesign} />
              <Row label="Sample Size" value={state.clinical.sampleSize} />
              <Row label="Sites" value={state.clinical.sites} />
              <Row label="Duration" value={state.clinical.durationMonths ? `${state.clinical.durationMonths} months` : null} />
            </Section>
          )}
        </div>
      )}

      {/* Phase 4: Comply */}
      {Object.keys(state.comply.compliance).length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E8A838', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: 4, background: '#E8A838', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>4</span>
            Phase 4 — Comply
          </h2>
          <Section title="Standards Compliance">
            {Object.entries(state.comply.compliance).slice(0, 20).map(([id, c]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 99,
                  background: c.status === 'complete' ? '#3DCC9120' : c.status === 'in-progress' ? '#2D72D220' : '#88888820',
                  color: c.status === 'complete' ? '#3DCC91' : c.status === 'in-progress' ? '#2D72D2' : '#888',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{c.status}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{id}</span>
                {c.assignee && <span style={{ fontSize: 11, color: '#888' }}>{c.assignee}</span>}
              </div>
            ))}
          </Section>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
        <span>Ambient Intelligence — Biodesign Platform</span>
        <span>Generated {today}</span>
      </div>
    </div>
  );
}
