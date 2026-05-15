'use client';
import React, { useState, useEffect, useRef } from 'react';
import { BiodesignState } from './data';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PredicateSearchProps {
  state: BiodesignState;
  onSelect: (predicateNumber: string, deviceName: string, applicant: string, productCode: string) => void;
  onClose: () => void;
}

interface FDAResult {
  k_number: string;
  applicant: string;
  device_name: string;
  decision_date: string;
  decision_description: string;
  product_code: string;
  device_class: string;
  statement_or_summary: string;
  third_party_flag: string;
  expedited_review_flag: string;
}

type DecisionFilter = 'all' | 'cleared' | 'not-cleared';
type SortMode = 'recent' | 'name' | 'applicant';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#E87252';
const FDA_BASE = 'https://api.fda.gov/device/510k.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(query: string, productCode: string): string {
  const parts: string[] = [];
  if (query.trim()) {
    parts.push(`device_name:"${query.trim()}"`);
  }
  if (productCode.trim()) {
    parts.push(`product_code:${productCode.trim().toUpperCase()}`);
  }
  const search = parts.join('+AND+');
  const params = new URLSearchParams({
    limit: '20',
    sort: 'decision_date:desc',
  });
  if (search) params.set('search', search);
  return `${FDA_BASE}?${params.toString()}`;
}

function formatDecisionDate(raw: string): string {
  if (!raw || raw.length < 8) return '—';
  const year = raw.slice(0, 4);
  const month = parseInt(raw.slice(4, 6), 10) - 1;
  const day = parseInt(raw.slice(6, 8), 10);
  const date = new Date(parseInt(year), month, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isCleared(result: FDAResult): boolean {
  return result.decision_description?.toUpperCase().includes('SUBSTANTIALLY EQUIVALENT') ?? false;
}

function sortResults(results: FDAResult[], mode: SortMode): FDAResult[] {
  const copy = [...results];
  if (mode === 'name') {
    copy.sort((a, b) => a.device_name.localeCompare(b.device_name));
  } else if (mode === 'applicant') {
    copy.sort((a, b) => a.applicant.localeCompare(b.applicant));
  }
  // 'recent' — leave as-is (already sorted by decision_date:desc from API)
  return copy;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--line-strong)',
  borderRadius: 2,
  padding: '10px 13px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
  marginBottom: 5,
};

const pillBase: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 2,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.10em',
  border: '1px solid var(--line-strong)',
  background: 'transparent',
  color: 'var(--text-3)',
  transition: 'all 0.14s',
};

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--line)' }}>
      {[120, 260, 160, 70, 90, 110, 100].map((w, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <div style={{
            height: 10,
            width: w,
            maxWidth: '100%',
            borderRadius: 2,
            background: 'var(--surface-2)',
            animation: 'pred-skeleton 1.4s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ── Decision badge ────────────────────────────────────────────────────────────

function DecisionBadge({ cleared, label }: { cleared: boolean; label: string }) {
  const color = cleared ? '#52E8B4' : '#E05050';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 2,
      background: cleared ? 'rgba(82,232,180,0.10)' : 'rgba(224,80,80,0.10)',
      border: `1px solid ${color}44`,
      fontFamily: 'var(--mono)',
      fontSize: 9,
      fontWeight: 700,
      color,
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
      whiteSpace: 'nowrap',
    }}>
      {cleared ? 'Cleared' : label.length > 0 ? 'Not Cleared' : 'Unknown'}
    </span>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────

export function PredicateSearchOverlay({ state, onSelect, onClose }: PredicateSearchProps) {
  const [query, setQuery] = useState(state.indication?.trim() ?? '');
  const [productCode, setProductCode] = useState(state.regulatory?.productCode?.trim() ?? '');
  const [results, setResults] = useState<FDAResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const abortRef = useRef<AbortController | null>(null);
  const currentPredicateNumber = state.regulatory?.predicateNumber ?? '';

  // Auto-search: debounce on query or productCode changes
  useEffect(() => {
    const trimmedQuery = query.trim();
    const trimmedCode = productCode.trim();

    // Need at least 3 chars in device name, or a product code, to auto-search
    if (trimmedQuery.length < 3 && trimmedCode.length === 0) return;

    const timer = setTimeout(() => {
      doSearch(trimmedQuery, trimmedCode);
    }, 300);

    return () => clearTimeout(timer);
     
  }, [query, productCode]);

  // Auto-search on mount if we have pre-filled values
  useEffect(() => {
    const trimmedQuery = query.trim();
    const trimmedCode = productCode.trim();
    if (trimmedQuery.length >= 3 || trimmedCode.length > 0) {
      doSearch(trimmedQuery, trimmedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(q: string, code: string) {
    if (q.length < 3 && code.length === 0) return;

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    setSearched(true);
    setLastQuery(q || code);

    try {
      const url = buildUrl(q, code);
      const res = await fetch(url, { signal: ctrl.signal });

      if (!res.ok) {
        // 404 means no results, not a hard error
        if (res.status === 404) {
          setResults([]);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (json.error) {
        // FDA API returned an error object — treat as no results
        setResults([]);
        setLoading(false);
        return;
      }

      setResults(json.results ?? []);
      setLoading(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(true);
      setLoading(false);
    }
  }

  function handleSearchClick() {
    doSearch(query.trim(), productCode.trim());
  }

  function handleSelect(r: FDAResult) {
    onSelect(r.k_number, r.device_name, r.applicant, r.product_code);
    onClose();
  }

  // Filter + sort
  const filteredResults = sortResults(
    results.filter(r => {
      if (decisionFilter === 'cleared') return isCleared(r);
      if (decisionFilter === 'not-cleared') return !isCleared(r);
      return true;
    }),
    sortMode,
  );

  // Example searches based on indication
  const indication = state.indication?.trim() ?? '';
  const exampleSearches = indication
    ? [indication, `${indication} monitor`, `${indication} sensor`]
    : ['glucose monitor', 'cardiac catheter', 'pulse oximeter'];

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const hasInput = query.trim().length > 0 || productCode.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes pred-skeleton {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
        .pred-row:hover { background: var(--surface-2) !important; }
        .pred-row:hover .pred-use-btn { opacity: 1 !important; }
        .pred-use-btn { transition: opacity 0.15s; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 9500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        {/* Modal box */}
        <div style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '20px 28px 16px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{ ...monoLabel, color: ACCENT, marginBottom: 6 }}>
                510(k) Predicate Search
              </div>
              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                510(k) Predicate Search
              </h2>
              <p style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: 'var(--text-3)',
                lineHeight: 1.6,
              }}>
                Search the FDA 510(k) database to identify cleared predicates
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 2,
                color: 'var(--text-3)',
                fontSize: 20,
                lineHeight: 1,
                width: 34,
                height: 34,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'color 0.14s, border-color 0.14s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line-strong)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
              }}
            >
              ×
            </button>
          </div>

          {/* Search bar — sticky inside modal */}
          <div style={{
            padding: '16px 28px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
            background: 'var(--bg)',
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {/* Device name input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by device name..."
                  style={{ ...inputStyle, fontSize: 15, padding: '11px 14px' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearchClick(); }}
                />
              </div>
              {/* Product code input */}
              <div style={{ width: 200, flexShrink: 0 }}>
                <input
                  value={productCode}
                  onChange={e => setProductCode(e.target.value)}
                  placeholder="Product code (e.g. DYN)"
                  style={{
                    ...inputStyle,
                    fontSize: 13,
                    fontFamily: 'var(--mono)',
                    textTransform: 'uppercase',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearchClick(); }}
                />
              </div>
              {/* Search button */}
              <button
                onClick={handleSearchClick}
                disabled={!hasInput && !loading}
                style={{
                  padding: '11px 22px',
                  borderRadius: 2,
                  background: ACCENT,
                  color: '#fff',
                  border: 'none',
                  cursor: hasInput ? 'pointer' : 'default',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  flexShrink: 0,
                  opacity: hasInput ? 1 : 0.45,
                  transition: 'opacity 0.14s',
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Filter + sort pills */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Decision filter */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ ...monoLabel, marginBottom: 0, marginRight: 3 }}>Decision</span>
                {(['all', 'cleared', 'not-cleared'] as DecisionFilter[]).map(f => {
                  const active = decisionFilter === f;
                  const labels: Record<DecisionFilter, string> = { all: 'All', cleared: 'Cleared', 'not-cleared': 'Not Cleared' };
                  return (
                    <button
                      key={f}
                      onClick={() => setDecisionFilter(f)}
                      style={{
                        ...pillBase,
                        background: active ? `${ACCENT}18` : 'transparent',
                        border: active ? `1px solid ${ACCENT}55` : '1px solid var(--line)',
                        color: active ? ACCENT : 'var(--text-3)',
                      }}
                    >{labels[f]}</button>
                  );
                })}
              </div>

              {/* Sort */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ ...monoLabel, marginBottom: 0, marginRight: 3 }}>Sort</span>
                {([
                  { key: 'recent', label: 'Most Recent' },
                  { key: 'name',   label: 'Device Name' },
                  { key: 'applicant', label: 'Applicant' },
                ] as { key: SortMode; label: string }[]).map(s => {
                  const active = sortMode === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSortMode(s.key)}
                      style={{
                        ...pillBase,
                        background: active ? `${ACCENT}18` : 'transparent',
                        border: active ? `1px solid ${ACCENT}55` : '1px solid var(--line)',
                        color: active ? ACCENT : 'var(--text-3)',
                      }}
                    >{s.label}</button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results area — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>

            {/* Suggestions (empty state, no search yet) */}
            {!searched && !loading && (
              <div style={{
                padding: '40px 0 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 4,
                }}>
                  Start typing to search the FDA 510(k) database
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, textAlign: 'center' }}>
                  Find 510(k)-cleared predicates by device name or product code.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 420, marginTop: 16 }}>
                  <div style={{ ...monoLabel, textAlign: 'center' }}>Try a search:</div>
                  {exampleSearches.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(ex); }}
                      style={{
                        background: 'var(--surface-1)',
                        border: '1px solid var(--line)',
                        borderRadius: 2,
                        padding: '9px 16px',
                        cursor: 'pointer',
                        color: 'var(--text-2)',
                        fontSize: 13,
                        textAlign: 'left',
                        transition: 'background 0.14s, border-color 0.14s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACCENT}44`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-1)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
                      }}
                    >
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: ACCENT, marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Try</span>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div style={{
                padding: '36px 0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: '#E05050',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}>
                  Connection Error
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, maxWidth: 360, lineHeight: 1.7 }}>
                  Could not reach FDA database. Check your connection and try again.
                </p>
                <button
                  onClick={handleSearchClick}
                  style={{
                    marginTop: 4,
                    padding: '8px 22px',
                    borderRadius: 2,
                    background: 'transparent',
                    color: ACCENT,
                    border: `1px solid ${ACCENT}55`,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >Retry</button>
              </div>
            )}

            {/* Loading — skeleton rows */}
            {loading && !error && (
              <div style={{ paddingTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      {['K-Number', 'Device Name', 'Applicant', 'Product Code', 'Decision Date', 'Decision', 'Action'].map(col => (
                        <th key={col} style={{
                          padding: '8px 14px',
                          textAlign: 'left',
                          fontFamily: 'var(--mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: 'var(--text-4)',
                          whiteSpace: 'nowrap',
                        }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
                  </tbody>
                </table>
              </div>
            )}

            {/* Results table */}
            {searched && !loading && !error && filteredResults.length > 0 && (
              <div style={{ paddingTop: 12 }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                }}>
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for &ldquo;{lastQuery}&rdquo;
                </div>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'auto',
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      {['K-Number', 'Device Name', 'Applicant', 'Prod. Code', 'Decision Date', 'Decision', 'Action'].map(col => (
                        <th key={col} style={{
                          padding: '8px 14px',
                          textAlign: 'left',
                          fontFamily: 'var(--mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: 'var(--text-4)',
                          whiteSpace: 'nowrap',
                        }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map(r => {
                      const cleared = isCleared(r);
                      const isCurrentPredicate = currentPredicateNumber &&
                        r.k_number.toUpperCase() === currentPredicateNumber.toUpperCase();
                      return (
                        <tr
                          key={r.k_number}
                          className="pred-row"
                          style={{
                            borderBottom: '1px solid var(--line)',
                            borderLeft: isCurrentPredicate ? `3px solid #E8A852` : '3px solid transparent',
                            background: 'transparent',
                            transition: 'background 0.12s',
                          }}
                        >
                          {/* K-Number */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <a
                              href={`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${r.k_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 12,
                                fontWeight: 700,
                                color: ACCENT,
                                textDecoration: 'none',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              {r.k_number}
                            </a>
                          </td>
                          {/* Device Name */}
                          <td style={{ padding: '12px 14px', maxWidth: 240 }}>
                            <span style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--text)',
                              lineHeight: 1.5,
                              display: 'block',
                            }}>
                              {r.device_name}
                            </span>
                          </td>
                          {/* Applicant */}
                          <td style={{ padding: '12px 14px', maxWidth: 160 }}>
                            <span style={{
                              fontSize: 12,
                              color: 'var(--text-2)',
                              display: 'block',
                            }}>
                              {r.applicant}
                            </span>
                          </td>
                          {/* Product Code */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 2,
                              background: 'var(--surface-2)',
                              border: '1px solid var(--line)',
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--text-2)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}>
                              {r.product_code}
                            </span>
                          </td>
                          {/* Decision Date */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              color: 'var(--text-3)',
                            }}>
                              {formatDecisionDate(r.decision_date)}
                            </span>
                          </td>
                          {/* Decision */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <DecisionBadge
                              cleared={cleared}
                              label={r.decision_description ?? ''}
                            />
                          </td>
                          {/* Action */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <button
                              className="pred-use-btn"
                              onClick={() => handleSelect(r)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 2,
                                background: 'transparent',
                                color: ACCENT,
                                border: `1px solid ${ACCENT}55`,
                                cursor: 'pointer',
                                fontFamily: 'var(--mono)',
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.09em',
                                opacity: 0,
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = `${ACCENT}18`;
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              }}
                            >
                              Use as Predicate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* No results */}
            {searched && !loading && !error && filteredResults.length === 0 && results.length === 0 && (
              <div style={{
                padding: '40px 0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}>
                  No results
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-3)',
                  margin: 0,
                  maxWidth: 420,
                  lineHeight: 1.7,
                }}>
                  No 510(k) submissions found for &ldquo;{lastQuery}&rdquo;. Try broader search terms or a different product code.
                </p>
              </div>
            )}

            {/* No results after filter but results exist */}
            {searched && !loading && !error && filteredResults.length === 0 && results.length > 0 && (
              <div style={{
                padding: '36px 0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}>
                  No matches for current filter
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.7 }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} exist — try selecting &ldquo;All&rdquo; in the Decision filter.
                </p>
                <button
                  onClick={() => setDecisionFilter('all')}
                  style={{
                    marginTop: 4,
                    padding: '7px 18px',
                    borderRadius: 2,
                    background: 'transparent',
                    color: 'var(--text-3)',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >Show All</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
