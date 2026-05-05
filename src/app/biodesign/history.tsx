'use client';
import { useState, useEffect } from 'react';
import { BiodesignState } from './data';

interface Snapshot { timestamp: string; projectName: string; label?: string; }

interface Props {
  projectId: string | null;
  currentState: BiodesignState;
  onRestore: (state: BiodesignState) => void;
  onClose: () => void;
}

export function HistoryModal({ projectId, currentState, onRestore, onClose }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/biodesign/projects/${projectId}/history`)
      .then(r => r.json())
      .then(d => { setSnapshots(d.snapshots ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function createCheckpoint() {
    if (!projectId) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/biodesign/projects/${projectId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: currentState }),
      });
      const { snapshot } = await res.json();
      setSnapshots(s => [snapshot, ...s]);
      setJustCreated(snapshot.timestamp);
      setTimeout(() => setJustCreated(null), 3000);
    } catch { /* best-effort */ }
    finally { setCreating(false); }
  }

  async function restore(timestamp: string) {
    if (!projectId) return;
    if (!confirm('Restore this checkpoint? Your current work will be replaced.')) return;
    setRestoring(timestamp);
    try {
      const res = await fetch(`/api/biodesign/projects/${projectId}/history/${timestamp}`);
      const { state } = await res.json();
      onRestore(state);
      onClose();
    } catch { alert('Failed to restore checkpoint.'); }
    finally { setRestoring(null); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 480, background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 3, display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sidebar-bg)', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)' }}>Version History</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createCheckpoint} disabled={creating} style={{
              padding: '5px 14px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{creating ? 'Saving…' : '+ Checkpoint'}</button>
            <button onClick={onClose} style={{ padding: '5px 10px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)', fontFamily: 'var(--mono)' }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>Loading…</div>
          ) : snapshots.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginBottom: 6 }}>No checkpoints saved</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', opacity: 0.6 }}>Click "+ Checkpoint" to save a snapshot of the current state.</div>
            </div>
          ) : (
            snapshots.map(snap => {
              const d = new Date(snap.timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z').replace(/T(\d{2})-(\d{2})-(\d{2})\./, 'T$1:$2:$3.'));
              const isNew = snap.timestamp === justCreated;
              return (
                <div key={snap.timestamp} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', borderBottom: '1px solid var(--line)',
                  background: isNew ? 'rgba(61,204,145,0.06)' : 'transparent',
                  transition: 'background 0.4s',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
                      {snap.label || snap.projectName || 'Checkpoint'}
                      {isNew && <span style={{ marginLeft: 8, fontSize: 9, color: '#3DCC91', fontWeight: 700 }}>✓ SAVED</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2, fontFamily: 'var(--mono)' }}>
                      {isNaN(d.getTime()) ? snap.timestamp : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                    </div>
                  </div>
                  <button onClick={() => restore(snap.timestamp)} disabled={restoring === snap.timestamp} style={{
                    padding: '5px 12px', borderRadius: 2, fontSize: 10, cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--line)',
                    fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{restoring === snap.timestamp ? '…' : 'Restore'}</button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
