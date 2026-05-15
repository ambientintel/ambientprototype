'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BiodesignState, PATHWAY_META } from '../../data';
import '../../biodesign.css';

interface ShareData {
  shareId: string;
  sharedBy: string | null;
  sharedAt: string;
  state: BiodesignState;
}

export default function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const [shareId, setShareId] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forking, setForking] = useState(false);
  const [forked, setForked] = useState(false);

  useEffect(() => {
    params.then(p => setShareId(p.shareId));
  }, [params]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/biodesign/share/${shareId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  async function forkToWorkspace() {
    if (!data) return;
    setForking(true);
    try {
      // Save to localStorage and redirect to app
      const id = Math.random().toString(36).slice(2, 9);
      const PROJECTS_KEY = 'ambient-biodesign-projects';
      const PROJECT_KEY = `ambient-biodesign-project-${id}`;
      const ACTIVE_KEY = 'ambient-biodesign-active';
      const state = data.state;

      const existing = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '[]');
      const meta = { id, name: (state.projectName ?? 'Imported Project') + ' (shared)', indication: state.indication ?? '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([...existing, meta]));
      localStorage.setItem(PROJECT_KEY, JSON.stringify(state));
      localStorage.setItem(ACTIVE_KEY, id);
      setForked(true);
      setTimeout(() => { window.location.href = '/biodesign/app'; }, 800);
    } catch {
      setForking(false);
    }
  }

  if (loading) {
    return (
      <div className="biodesign-root" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-4)' }}>Loading…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="biodesign-root" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>This share link is invalid or has expired.</div>
        <Link href="/biodesign/app" style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)', textDecoration: 'none' }}>← Open Biodesign App</Link>
      </div>
    );
  }

  const { state } = data;
  const reg = state.regulatory;
  const pathwayMeta = reg.pathway !== 'tbd' ? PATHWAY_META[reg.pathway] : null;
  const topNeeds = state.needs.filter(n => n.status === 'selected' || n.status === 'validated').slice(0, 3);
  const topConcepts = state.concepts.filter(c => c.status === 'selected' || c.status === 'development').slice(0, 3);
  const openRisks = (state.risks ?? []).filter(r => r.status === 'open').length;
  const sharedDate = new Date(data.sharedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="biodesign-root" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--line)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Ambient</span>
          <span style={{ color: 'var(--line-strong)', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Shared Project</span>
        </div>
        <button onClick={forkToWorkspace} disabled={forking || forked} style={{
          padding: '8px 18px', borderRadius: 2, fontSize: 11, cursor: forked ? 'default' : 'pointer',
          background: forked ? 'rgba(61,204,145,0.12)' : 'var(--accent)',
          color: forked ? '#3DCC91' : '#fff', border: forked ? '1px solid rgba(61,204,145,0.3)' : 'none',
          fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {forked ? '✓ Opening workspace…' : forking ? '…' : '↓ Fork to my workspace'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '40px', maxWidth: 820, margin: '0 auto', width: '100%' }}>
        {/* Project header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>
                {state.projectName || 'Untitled Project'}
              </h1>
              {state.indication && (
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{state.indication}</div>
              )}
            </div>
            {pathwayMeta && (
              <span style={{ marginTop: 4, fontSize: 10, padding: '4px 10px', borderRadius: 2, background: pathwayMeta.color + '18', color: pathwayMeta.color, border: `1px solid ${pathwayMeta.color}44`, fontFamily: 'var(--mono)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {pathwayMeta.label}
              </span>
            )}
          </div>
          {state.projectDescription && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 600 }}>{state.projectDescription}</p>
          )}
          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
            Shared {sharedDate}{data.sharedBy ? ` by ${data.sharedBy}` : ''}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Needs */}
          {topNeeds.length > 0 && (
            <Section title="Validated Needs">
              {topNeeds.map((n, i) => (
                <div key={n.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: '2px solid var(--accent)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, fontStyle: 'italic' }}>
                    &ldquo;A way to {n.problem} for {n.population}{n.setting ? ` in ${n.setting}` : ''} so that {n.outcome}.&rdquo;
                  </div>
                </div>
              ))}
              {state.needs.length > topNeeds.length && (
                <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>+{state.needs.length - topNeeds.length} more</div>
              )}
            </Section>
          )}

          {/* Concepts */}
          {topConcepts.length > 0 && (
            <Section title="Selected Concepts">
              {topConcepts.map(c => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 3 }}>{c.title}</div>
                  {c.description && <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.55 }}>{c.description}</div>}
                </div>
              ))}
            </Section>
          )}

          {/* Regulatory */}
          {(reg.intendedUse || reg.pathway !== 'tbd') && (
            <Section title="Regulatory Strategy">
              {pathwayMeta && <KV label="Pathway">{pathwayMeta.label} — Class {reg.deviceClass}</KV>}
              {reg.intendedUse && <KV label="Intended Use">{reg.intendedUse}</KV>}
              {reg.estimatedTimelineMonths && <KV label="Timeline">{reg.estimatedTimelineMonths} months</KV>}
            </Section>
          )}

          {/* Market */}
          {(state.business.totalAddressableMarket || state.business.revenueModel) && (
            <Section title="Market Opportunity">
              {state.business.totalAddressableMarket && <KV label="TAM">{state.business.totalAddressableMarket}</KV>}
              {state.business.serviceableMarket && <KV label="SAM">{state.business.serviceableMarket}</KV>}
              {state.business.revenueModel && <KV label="Revenue Model">{state.business.revenueModel}</KV>}
            </Section>
          )}
        </div>

        {/* Summary stats */}
        <div style={{ marginTop: 32, padding: '14px 20px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 3, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Stat label="Needs" value={state.needs.length} />
          <Stat label="Concepts" value={state.concepts.length} />
          {(state.risks?.length ?? 0) > 0 && <Stat label="Open Risks" value={openRisks} warn={openRisks > 0} />}
          {(state.milestones?.length ?? 0) > 0 && <Stat label="Milestones" value={state.milestones!.length} />}
          {(state.competitors?.length ?? 0) > 0 && <Stat label="Competitors" value={state.competitors!.length} />}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button onClick={forkToWorkspace} disabled={forking || forked} style={{
            padding: '10px 28px', borderRadius: 2, fontSize: 12, cursor: forked ? 'default' : 'pointer',
            background: forked ? 'rgba(61,204,145,0.12)' : 'var(--accent)',
            color: forked ? '#3DCC91' : '#fff', border: forked ? '1px solid rgba(61,204,145,0.3)' : 'none',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {forked ? '✓ Opening workspace…' : forking ? '…' : '↓ Fork to my workspace'}
          </button>
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
            Creates a copy you can edit — original is unaffected
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--mono)', marginBottom: 10, borderLeft: '3px solid var(--accent)', paddingLeft: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 5 }}>
      <span style={{ fontWeight: 700, color: 'var(--text-3)', minWidth: 110, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: 'var(--text-2)', lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
      <span style={{ fontWeight: 700, color: warn ? '#d9a020' : 'var(--text-2)' }}>{value}</span>
      <span style={{ color: 'var(--text-4)' }}> {label}</span>
    </div>
  );
}
