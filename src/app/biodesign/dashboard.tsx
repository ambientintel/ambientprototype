'use client';
import { useState } from 'react';
import { BiodesignState, DEFAULT_STATE, PATHWAY_META } from './data';

function calcHealthScore(s: BiodesignState): number {
  const checks = [
    !!s.projectName,
    !!s.indication,
    s.needs.length > 0,
    s.needs.length >= 3,
    s.needs.some(n => n.status === 'selected' || n.status === 'validated'),
    s.stakeholders.length > 0,
    s.competitors.length > 0,
    s.concepts.length > 0,
    s.concepts.length >= 2,
    s.concepts.some(c => c.status === 'selected' || c.status === 'development'),
    s.regulatory.pathway !== 'tbd',
    s.regulatory.deviceClass !== 'TBD',
    s.milestones.length > 0,
    s.risks.length > 0,
    (s.ipFilings ?? []).length > 0,
    (s.reimbursement.cptCodes.length > 0 || !!s.reimbursement.siteOfService),
    (s.comply.profile.targetMarkets ?? []).length > 0,
    Object.keys(s.comply.compliance ?? {}).length > 0,
    s.designControls.inputs.length > 0,
    !!(s.business.revenueModel),
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

const PROJECT_KEY = (id: string) => `ambient-biodesign-project-${id}`;

function loadState(id: string): BiodesignState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, comply: { ...DEFAULT_STATE.comply, ...(parsed.comply ?? {}) }, designControls: { ...DEFAULT_STATE.designControls, ...(parsed.designControls ?? {}) } };
  } catch { return DEFAULT_STATE; }
}

interface ProjectMeta { id: string; name: string; indication: string; createdAt: string; updatedAt: string; }
interface AuthUser { email: string; firstName: string | null; lastName: string | null; profilePictureUrl: string | null; }

interface Props {
  projects: ProjectMeta[];
  authUser: AuthUser | null;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => Promise<string | null>;
}

export function ProjectDashboard({ projects, authUser, syncStatus, onOpen, onNew, onDelete, onShare }: Props) {
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});
  const [sharing, setSharing] = useState<string | null>(null);

  async function handleShare(id: string) {
    if (shareUrls[id]) { navigator.clipboard.writeText(shareUrls[id]).catch(() => {}); return; }
    setSharing(id);
    const url = await onShare(id);
    if (url) {
      setShareUrls(s => ({ ...s, [id]: url }));
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setSharing(null);
  }

  return (
    <div className="biodesign-root" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--line)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Ambient</span>
          <span style={{ color: 'var(--line-strong)', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Biodesign</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {authUser && syncStatus !== 'idle' && (
            <span style={{ fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: syncStatus === 'saving' ? '#d9a020' : syncStatus === 'saved' ? '#3DCC91' : '#c04040' }}>
              {syncStatus === 'saving' ? '↑ Saving…' : syncStatus === 'saved' ? '✓ Synced' : '✗ Sync Error'}
            </span>
          )}
          {authUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {authUser.profilePictureUrl ? (
                <img src={authUser.profilePictureUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                  {(authUser.firstName?.[0] ?? authUser.email[0]).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                {authUser.firstName ?? authUser.email.split('@')[0]}
              </span>
              <a href="/api/auth/signout" style={{ fontSize: 10, color: 'var(--text-4)', textDecoration: 'none', fontFamily: 'var(--mono)' }}>Sign out</a>
            </div>
          )}
          <button onClick={onNew} style={{
            padding: '7px 16px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', border: 'none',
            fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>+ New Project</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {projects.length === 0 ? (
          <EmptyState onNew={onNew} />
        ) : (
          <>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20 }}>
              {projects.length} Project{projects.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  meta={p}
                  state={loadState(p.id)}
                  shareUrl={shareUrls[p.id]}
                  sharing={sharing === p.id}
                  onOpen={() => onOpen(p.id)}
                  onDelete={() => { if (confirm(`Delete "${p.name || 'Untitled Project'}"? This cannot be undone.`)) onDelete(p.id); }}
                  onShare={() => handleShare(p.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ meta, state, shareUrl, sharing, onOpen, onDelete, onShare }: {
  meta: ProjectMeta; state: BiodesignState; shareUrl?: string; sharing: boolean;
  onOpen: () => void; onDelete: () => void; onShare: () => void;
}) {
  const reg = state.regulatory;
  const pathwayMeta = reg.pathway !== 'tbd' ? PATHWAY_META[reg.pathway] : null;
  const openRisks = (state.risks ?? []).filter(r => r.status === 'open').length;
  const critRisks = (state.risks ?? []).filter(r => r.status === 'open' && r.probability * r.impact >= 16).length;
  const upcoming = (state.milestones ?? []).filter(m => m.status === 'upcoming' || m.status === 'in-progress').length;
  const selectedNeeds = state.needs.filter(n => n.status === 'selected' || n.status === 'validated').length;
  const selectedConcepts = state.concepts.filter(c => c.status === 'selected' || c.status === 'development').length;
  const updated = new Date(meta.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const health = calcHealthScore(state);
  const healthColor = health >= 75 ? '#52E8B4' : health >= 40 ? '#E8A852' : '#E87252';

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 3, background: pathwayMeta ? pathwayMeta.color : 'var(--line-strong)' }} />

      <div style={{ padding: '20px', flex: 1, cursor: 'pointer' }} onClick={onOpen}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {meta.name || 'Untitled Project'}
            </div>
            {meta.indication && (
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.indication}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {pathwayMeta && (
              <span style={{ fontSize: 9, padding: '3px 7px', borderRadius: 2, background: pathwayMeta.color + '18', color: pathwayMeta.color, border: `1px solid ${pathwayMeta.color}44`, fontFamily: 'var(--mono)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {pathwayMeta.label}
              </span>
            )}
            <div title="Project health score (0–100)" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--mono)', color: healthColor, lineHeight: 1 }}>{health}</span>
              <span style={{ fontSize: 7, fontFamily: 'var(--mono)', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>health</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 12 }}>
          {state.needs.length > 0 && <Stat label="needs" value={state.needs.length} sub={selectedNeeds > 0 ? `${selectedNeeds} validated` : undefined} />}
          {state.concepts.length > 0 && <Stat label="concepts" value={state.concepts.length} sub={selectedConcepts > 0 ? `${selectedConcepts} selected` : undefined} />}
          {openRisks > 0 && <Stat label="risks" value={openRisks} warn={critRisks > 0} sub={critRisks > 0 ? `${critRisks} critical` : undefined} />}
          {upcoming > 0 && <Stat label="milestones" value={upcoming} />}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{updated}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={e => { e.stopPropagation(); onShare(); }} style={{
            padding: '4px 10px', borderRadius: 2, fontSize: 9, cursor: 'pointer', fontFamily: 'var(--mono)',
            background: shareUrl ? 'rgba(61,204,145,0.1)' : 'transparent',
            color: shareUrl ? '#3DCC91' : 'var(--text-4)',
            border: `1px solid ${shareUrl ? 'rgba(61,204,145,0.3)' : 'var(--line)'}`,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {sharing ? '…' : shareUrl ? '✓ Copied' : '↗ Share'}
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{
            padding: '4px 10px', borderRadius: 2, fontSize: 9, cursor: 'pointer', fontFamily: 'var(--mono)',
            background: 'transparent', color: 'var(--text-4)', border: '1px solid var(--line)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Delete</button>
          <button onClick={e => { e.stopPropagation(); onOpen(); }} style={{
            padding: '4px 10px', borderRadius: 2, fontSize: 9, cursor: 'pointer', fontFamily: 'var(--mono)',
            background: 'var(--accent)', color: '#fff', border: 'none',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Open →</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>
      <span style={{ color: warn ? '#d9a020' : 'var(--text-2)', fontWeight: 600 }}>{value}</span>
      <span style={{ color: 'var(--text-4)' }}> {label}</span>
      {sub && <span style={{ color: warn ? '#d9a020' : 'var(--text-4)', opacity: 0.7 }}> · {sub}</span>}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2, fontFamily: 'var(--mono)' }}>⬡</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--mono)', marginBottom: 8 }}>No projects yet</div>
      <div style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 28 }}>Start your first medical device development project.</div>
      <button onClick={onNew} style={{
        padding: '10px 28px', borderRadius: 2, fontSize: 12, cursor: 'pointer',
        background: 'var(--accent)', color: '#fff', border: 'none',
        fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>Create First Project</button>
    </div>
  );
}
