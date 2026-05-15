'use client';
import React, { useState, useRef } from 'react';
import { BiodesignState, ProjectComment } from './data';
import { FlowCanvas } from './flowbg';

interface CollabProps {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  currentPhase: string;
  currentTab: string;
  onNavigate: (phase: string, tab: string) => void;
  onClose: () => void;
}

const PHASE_COLORS: Record<string, string> = {
  identify: '#E8A852',
  invent: '#A07EE8',
  implement: '#52E8B4',
  comply: '#E87252',
};

const ROLES = ['Regulatory Affairs', 'Clinical', 'Engineering', 'Legal/IP', 'Business/Finance', 'Advisor', 'Investor', 'Other'];

function uid() { return Math.random().toString(36).slice(2, 9); }

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function CommentCard({
  comment, onResolve, onDelete, onNavigate, onClose,
}: {
  comment: ProjectComment;
  onResolve: () => void;
  onDelete: () => void;
  onNavigate: (phase: string, tab: string) => void;
  onClose: () => void;
}) {
  const phaseColor = PHASE_COLORS[comment.phase] ?? 'var(--accent)';
  return (
    <div style={{
      position: 'relative',
      background: comment.resolved ? 'transparent' : 'var(--surface-1)',
      border: `1px solid ${comment.resolved ? 'var(--line)' : 'var(--line-strong)'}`,
      borderLeft: `3px solid ${comment.resolved ? 'var(--line)' : phaseColor}`,
      borderRadius: 4,
      padding: '12px 14px',
      opacity: comment.resolved ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: phaseColor + '22', border: `1px solid ${phaseColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 11, color: phaseColor, fontWeight: 700,
        }}>
          {comment.author.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>
            {comment.author}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
            {comment.role} · {formatTime(comment.createdAt)}
          </div>
        </div>
        <button
          onClick={() => { onNavigate(comment.phase, comment.tab); onClose(); }}
          title={`Go to ${comment.phase} / ${comment.tab}`}
          style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px',
            background: phaseColor + '18', color: phaseColor,
            border: `1px solid ${phaseColor}40`, borderRadius: 3, cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
          {comment.phase}/{comment.tab}
        </button>
        <button onClick={onResolve} title={comment.resolved ? 'Reopen' : 'Resolve'} style={{
          fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px',
          background: comment.resolved ? 'var(--surface-2)' : 'rgba(82,232,180,0.12)',
          color: comment.resolved ? 'var(--text-3)' : '#52E8B4',
          border: `1px solid ${comment.resolved ? 'var(--line)' : 'rgba(82,232,180,0.3)'}`,
          borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {comment.resolved ? 'Reopen' : 'Resolve'}
        </button>
        <button onClick={onDelete} title="Delete" style={{
          width: 22, height: 22, background: 'transparent', border: 'none',
          color: 'var(--text-4)', cursor: 'pointer', fontSize: 14, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {comment.text}
      </p>
    </div>
  );
}

export function CollaborationOverlay({ state, update, currentPhase, currentTab, onNavigate, onClose }: CollabProps) {
  const [innerTab, setInnerTab] = useState<'comments' | 'share' | 'collaborators'>('comments');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState(false);

  // New comment form
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentPhase, setCommentPhase] = useState(currentPhase);
  const [commentTab, setCommentTab] = useState(currentTab);
  const [adding, setAdding] = useState(false);

  // Share
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState(false);

  // Collaborators
  const [emailInput, setEmailInput] = useState('');

  const collab = state.collaboration ?? { collaborators: [], comments: [] };

  function updateCollab(patch: Partial<typeof collab>) {
    update({ ...state, collaboration: { ...collab, ...patch } });
  }

  function addComment() {
    if (!author.trim() || !commentText.trim()) return;
    const c: ProjectComment = {
      id: uid(), author: author.trim(), role: role || 'Collaborator',
      text: commentText.trim(), phase: commentPhase, tab: commentTab,
      createdAt: new Date().toISOString(), resolved: false,
    };
    updateCollab({ comments: [c, ...collab.comments] });
    setCommentText('');
    setAdding(false);
  }

  function resolveComment(id: string) {
    updateCollab({ comments: collab.comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c) });
  }

  function deleteComment(id: string) {
    updateCollab({ comments: collab.comments.filter(c => c.id !== id) });
  }

  function addCollaborator() {
    const email = emailInput.trim().toLowerCase();
    if (!email || collab.collaborators.includes(email)) return;
    updateCollab({ collaborators: [...collab.collaborators, email] });
    setEmailInput('');
  }

  function removeCollaborator(email: string) {
    updateCollab({ collaborators: collab.collaborators.filter(e => e !== email) });
  }

  async function generateShareLink() {
    setSharing(true);
    setShareError('');
    try {
      const res = await fetch('/api/biodesign/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setShareUrl(data.url);
    } catch {
      setShareError('Failed to generate link. Check your connection.');
    } finally {
      setSharing(false);
    }
  }

  async function copyLink(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: select input */ }
  }

  const filteredComments = collab.comments.filter(c => {
    if (!filterResolved && c.resolved) return false;
    if (filterPhase !== 'all' && c.phase !== filterPhase) return false;
    return true;
  });

  const openCount = collab.comments.filter(c => !c.resolved).length;
  const resolvedCount = collab.comments.filter(c => c.resolved).length;

  const PHASES = ['identify', 'invent', 'implement', 'comply'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9300,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
    }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <FlowCanvas accent="#52C0E8" />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(19,30,44,0.82)' }} />
      </div>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 32px', height: 58,
        background: 'var(--sidebar-bg)',
        borderBottom: '1px solid var(--line-strong)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Team Collaboration</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
            {state.projectName || 'Untitled Project'} · {collab.collaborators.length} collaborators · {openCount} open comments
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Inner tabs */}
        {(['comments', 'share', 'collaborators'] as const).map(t => (
          <button key={t} onClick={() => setInnerTab(t)} style={{
            padding: '0 16px', height: 58, background: 'transparent',
            border: 'none', borderBottom: `2px solid ${innerTab === t ? 'var(--accent)' : 'transparent'}`,
            color: innerTab === t ? 'var(--accent)' : 'var(--text-4)',
            fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '0.1em', cursor: 'pointer', transition: 'color 0.15s',
            fontWeight: 600,
          }}>
            {t === 'comments' ? `Comments${openCount > 0 ? ` (${openCount})` : ''}` : t === 'collaborators' ? `Collaborators${collab.collaborators.length > 0 ? ` (${collab.collaborators.length})` : ''}` : 'Share'}
          </button>
        ))}
        <button onClick={onClose} style={{
          width: 32, height: 32, background: 'transparent',
          border: '1px solid var(--line)', borderRadius: 3,
          color: 'var(--text-3)', cursor: 'pointer', fontSize: 16,
        }}>×</button>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '28px 40px', maxWidth: 900, width: '100%', margin: '0 auto' }}>

        {/* ── COMMENTS TAB ────────────────────────────────────────────── */}
        {innerTab === 'comments' && (
          <div>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Open', value: openCount, color: '#52C0E8' },
                { label: 'Resolved', value: resolvedCount, color: '#52E8B4' },
                { label: 'Total', value: collab.comments.length, color: 'var(--text-3)' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: 'var(--surface-1)', border: '1px solid var(--line)',
                  borderRadius: 4, padding: '12px 16px',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            {!adding ? (
              <button onClick={() => setAdding(true)} style={{
                width: '100%', padding: '12px 16px', marginBottom: 20,
                background: 'var(--surface-1)', border: '1px dashed var(--line-strong)',
                borderRadius: 4, color: 'var(--text-3)', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.08em', textAlign: 'left', transition: 'border-color 0.15s',
              }}>
                + Add Comment or Feedback
              </button>
            ) : (
              <div style={{
                background: 'var(--surface-1)', border: '1px solid var(--line-strong)',
                borderRadius: 4, padding: '16px 18px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Your Name</div>
                    <input
                      value={author} onChange={e => setAuthor(e.target.value)}
                      placeholder="e.g. Dr. Sarah Chen"
                      style={{
                        width: '100%', padding: '7px 10px', background: 'var(--surface-2)',
                        border: '1px solid var(--line)', borderRadius: 2,
                        color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Role</div>
                    <select
                      value={role} onChange={e => setRole(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', background: 'var(--surface-2)',
                        border: '1px solid var(--line)', borderRadius: 2,
                        color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
                      }}
                    >
                      <option value="">Select role…</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Phase</div>
                    <select value={commentPhase} onChange={e => setCommentPhase(e.target.value)} style={{ width: '100%', padding: '7px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}>
                      {PHASES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Tab</div>
                    <input
                      value={commentTab} onChange={e => setCommentTab(e.target.value)}
                      placeholder={currentTab}
                      style={{ width: '100%', padding: '7px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Comment</div>
                  <textarea
                    value={commentText} onChange={e => setCommentText(e.target.value)}
                    placeholder="Share feedback, flag an issue, or leave a note for the team…"
                    rows={4}
                    style={{
                      width: '100%', padding: '8px 10px', background: 'var(--surface-2)',
                      border: '1px solid var(--line)', borderRadius: 2,
                      color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setAdding(false)} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 3, color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  <button onClick={addComment} disabled={!author.trim() || !commentText.trim()} style={{
                    padding: '7px 20px', background: author.trim() && commentText.trim() ? 'var(--accent)' : 'var(--surface-2)',
                    border: 'none', borderRadius: 3, color: author.trim() && commentText.trim() ? '#0E1622' : 'var(--text-4)',
                    cursor: author.trim() && commentText.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>Post Comment</button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter:</span>
              {['all', ...PHASES].map(p => (
                <button key={p} onClick={() => setFilterPhase(p)} style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: filterPhase === p ? (PHASE_COLORS[p] ?? 'var(--accent)') + '22' : 'transparent',
                  color: filterPhase === p ? (PHASE_COLORS[p] ?? 'var(--accent)') : 'var(--text-3)',
                  border: `1px solid ${filterPhase === p ? (PHASE_COLORS[p] ?? 'var(--accent)') + '55' : 'var(--line)'}`,
                }}>{p === 'all' ? 'All Phases' : p}</button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={() => setFilterResolved(v => !v)} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: filterResolved ? 'rgba(82,232,180,0.12)' : 'transparent',
                color: filterResolved ? '#52E8B4' : 'var(--text-3)',
                border: `1px solid ${filterResolved ? 'rgba(82,232,180,0.3)' : 'var(--line)'}`,
              }}>Show Resolved</button>
            </div>

            {/* Comment list */}
            {filteredComments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                {collab.comments.length === 0 ? 'No comments yet. Add the first one above.' : 'No comments match the current filter.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredComments.map(c => (
                  <CommentCard
                    key={c.id} comment={c}
                    onResolve={() => resolveComment(c.id)}
                    onDelete={() => deleteComment(c.id)}
                    onNavigate={onNavigate}
                    onClose={onClose}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SHARE TAB ───────────────────────────────────────────────── */}
        {innerTab === 'share' && (
          <div style={{ maxWidth: 620 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Share Project</h2>
              <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Generate a read-only snapshot link to share this project with advisors, investors, or the regulatory team. The link captures the current state — generate a new one to share updates.
              </p>
            </div>

            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 4, padding: '20px 22px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Share Link</div>
              {shareUrl ? (
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      readOnly value={shareUrl}
                      style={{
                        flex: 1, padding: '8px 12px', background: 'var(--surface-2)',
                        border: '1px solid var(--line)', borderRadius: 2, color: 'var(--text)',
                        fontSize: 12, fontFamily: 'var(--mono)',
                      }}
                    />
                    <button onClick={() => copyLink(shareUrl)} style={{
                      padding: '8px 18px', background: copied ? 'rgba(82,232,180,0.15)' : 'var(--accent)',
                      border: 'none', borderRadius: 3, color: copied ? '#52E8B4' : '#0E1622',
                      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>Read-only snapshot — recipients cannot edit.</div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '0 0 14px' }}>No link generated yet for this session.</p>
                  <button onClick={generateShareLink} disabled={sharing} style={{
                    padding: '9px 22px', background: sharing ? 'var(--surface-2)' : 'var(--accent)',
                    border: 'none', borderRadius: 3, color: sharing ? 'var(--text-4)' : '#0E1622',
                    fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                    cursor: sharing ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {sharing ? 'Generating…' : 'Generate Share Link'}
                  </button>
                  {shareError && <div style={{ color: '#E87252', fontSize: 12, marginTop: 8 }}>{shareError}</div>}
                </div>
              )}
            </div>

            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 4, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>What&rsquo;s included in the share</div>
              {[
                ['Project overview', 'Name, indication, description'],
                ['Regulatory strategy', 'Pathway, device class, predicate, notes'],
                ['Needs & concepts', 'All needs and concepts with scores'],
                ['IP portfolio', 'All IP filings and deadlines'],
                ['Risk register', 'All risks with mitigations'],
                ['Timeline', 'Project milestones'],
                ['Clinical plan', 'Study design and endpoints'],
              ].map(([label, detail]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: '#52E8B4', fontSize: 12, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COLLABORATORS TAB ───────────────────────────────────────── */}
        {innerTab === 'collaborators' && (
          <div style={{ maxWidth: 580 }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Collaborators</h2>
              <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                Track who is working on this project. Use the Share tab to generate and send them a link.
              </p>
            </div>

            {/* Add collaborator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                value={emailInput} onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCollaborator()}
                placeholder="email@example.com"
                type="email"
                style={{
                  flex: 1, padding: '9px 12px', background: 'var(--surface-1)',
                  border: '1px solid var(--line-strong)', borderRadius: 2,
                  color: 'var(--text)', fontSize: 13,
                }}
              />
              <button onClick={addCollaborator} disabled={!emailInput.trim()} style={{
                padding: '9px 20px', background: emailInput.trim() ? 'var(--accent)' : 'var(--surface-2)',
                border: 'none', borderRadius: 3,
                color: emailInput.trim() ? '#0E1622' : 'var(--text-4)',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                cursor: emailInput.trim() ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Add</button>
            </div>

            {/* Collaborator list */}
            {collab.collaborators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                No collaborators added yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {collab.collaborators.map(email => {
                  const initials = email.split('@')[0].slice(0, 2).toUpperCase();
                  const commentCount = collab.comments.filter(c => c.author.toLowerCase().includes(email.split('@')[0].toLowerCase())).length;
                  return (
                    <div key={email} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: 'var(--surface-1)',
                      border: '1px solid var(--line)', borderRadius: 4,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(82,192,232,0.15)', border: '1px solid rgba(82,192,232,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700,
                      }}>{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{email}</div>
                        {commentCount > 0 && (
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{commentCount} comment{commentCount !== 1 ? 's' : ''}</div>
                        )}
                      </div>
                      <button onClick={() => removeCollaborator(email)} style={{
                        padding: '4px 10px', background: 'transparent',
                        border: '1px solid var(--line)', borderRadius: 3,
                        color: 'var(--text-4)', cursor: 'pointer', fontSize: 11,
                        fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>Remove</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
