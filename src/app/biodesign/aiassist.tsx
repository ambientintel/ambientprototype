'use client';
import { useState } from 'react';

type AssistType = 'need' | 'concept' | 'regulatory' | 'clinical' | 'ip-filing';

interface AiDraftButtonProps {
  type: AssistType;
  context: Record<string, string>;
  onResult: (result: Record<string, string>) => void;
  label?: string;
}

const FIELD_LABELS: Record<string, string> = {
  problem:                  'Problem',
  population:               'Population',
  setting:                  'Setting',
  outcome:                  'Outcome',
  title:                    'Title',
  description:              'Description',
  mechanism:                'Mechanism',
  intendedUse:              'Intended Use',
  indicationsForUse:        'Indications for Use',
  substantialEquivalence:   'Substantial Equivalence',
  primaryEndpoint:          'Primary Endpoint',
  studyDesign:              'Study Design',
  inclusionCriteria:        'Inclusion Criteria',
  exclusionCriteria:        'Exclusion Criteria',
};

export function AiDraftButton({ type, context, onResult, label = 'Draft with AI' }: AiDraftButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function draft() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/biodesign/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed');
      setResult(data.suggestions);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI assist failed');
      setStatus('error');
    }
  }

  function apply() {
    if (result) { onResult(result); setStatus('idle'); setResult(null); }
  }

  function dismiss() { setStatus('idle'); setResult(null); setError(null); }

  if (status === 'loading') {
    return (
      <button disabled style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px',
        borderRadius: 2, fontSize: 11, background: 'rgba(82,192,232,0.06)',
        color: 'var(--text-4)', border: '1px solid var(--line)',
        fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
        cursor: 'default',
      }}>
        <span style={{ opacity: 0.6 }}>◌</span> Drafting…
      </button>
    );
  }

  if (status === 'done' && result) {
    return (
      <div style={{ background: 'rgba(82,192,232,0.06)', border: '1px solid rgba(82,192,232,0.22)', borderRadius: 2, padding: '12px 14px' }}>
        <div style={{ fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--mono)', marginBottom: 10 }}>✦ AI Draft</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {Object.entries(result).map(([key, val]) => (
            <div key={key}>
              <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', marginBottom: 2 }}>
                {FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{String(val)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={apply} style={{ padding: '5px 14px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Apply</button>
          <button onClick={draft} style={{ padding: '5px 12px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'none', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)' }}>Retry</button>
          <button onClick={dismiss} style={{ padding: '5px 10px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)', fontFamily: 'var(--mono)' }}>Dismiss</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={draft} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px',
        borderRadius: 2, fontSize: 11, cursor: 'pointer',
        background: 'rgba(82,192,232,0.1)', color: 'var(--accent)',
        border: '1px solid rgba(82,192,232,0.3)',
        fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
        transition: 'box-shadow 0.15s',
      }}>
        ✦ {label}
      </button>
      {status === 'error' && error && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#e08080' }}>{error}</div>
      )}
    </div>
  );
}
