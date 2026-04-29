'use client';
import Link from 'next/link';

import { useState, useEffect, useCallback } from 'react';
import { SUBPARTS, getAllRequirements, type Status, type Subpart } from './data';

interface RowState {
  status: Status;
  evidence: string;
  comments: string;
  notes: string;
}

type GapState = Record<string, RowState>;

const STORAGE_KEY = 'ambient-gap-analysis-v1';
const STATUS_OPTIONS: { value: Status; label: string; title: string }[] = [
  { value: 'yes',     label: '✅', title: 'Met' },
  { value: 'partial', label: '⚠️', title: 'Partial' },
  { value: 'no',      label: '❌', title: 'Not met' },
  { value: 'na',      label: '—',  title: 'N/A' },
];

function defaultState(): RowState {
  return { status: null, evidence: '', comments: '', notes: '' };
}

function loadState(): GapState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function GapAnalysisPage() {
  const [gapState, setGapState] = useState<GapState>({});
  const [activeSubpart, setActiveSubpart] = useState('A');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setGapState(loadState());
    setLoaded(true);
  }, []);

  const save = useCallback((next: GapState) => {
    setGapState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setStatus = (id: string, status: Status) => {
    const current = gapState[id] ?? defaultState();
    const next = status === current.status
      ? { ...current, status: null }
      : { ...current, status };
    save({ ...gapState, [id]: next });
  };

  const setField = (id: string, field: 'evidence' | 'comments' | 'notes', value: string) => {
    const current = gapState[id] ?? defaultState();
    save({ ...gapState, [id]: { ...current, [field]: value } });
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const all = getAllRequirements();
  const counts = { yes: 0, partial: 0, no: 0, na: 0, unset: 0 };
  for (const req of all) {
    const st = gapState[req.id]?.status ?? null;
    if (st === 'yes') counts.yes++;
    else if (st === 'partial') counts.partial++;
    else if (st === 'no') counts.no++;
    else if (st === 'na') counts.na++;
    else counts.unset++;
  }
  const total = all.length;
  const assessed = total - counts.unset;
  const pct = total > 0 ? Math.round((assessed / total) * 100) : 0;

  const activeData = SUBPARTS.find(sp => sp.letter === activeSubpart);

  if (!loaded) return null;

  return (
    <div className="app">
      {/* Sidebar */}
      <nav className="sidebar">
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">
            <span className="brand-name">Ambient <em>Intelligence</em></span>
          </div>
        </Link>

        <div className="nav-section">
          <p className="nav-label">Subparts</p>
          {SUBPARTS.map(sp => (
            <button
              key={sp.letter}
              className={`nav-item${activeSubpart === sp.letter ? ' active' : ''}`}
              onClick={() => setActiveSubpart(sp.letter)}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.6, marginRight: 6 }}>{sp.letter}</span>
              {sp.title}
            </button>
          ))}
        </div>


        <div className="nav-section">
          <p className="nav-label">Pages</p>
          {([
            ['/dashboard', 'Nurse Dashboard'],
            ['/bom',       'Bill of Materials'],
            ['/gapanalysis','Gap Analysis'],
            ['/samd',      'SaMD'],
            ['/cloud',     'Cloud'],
          ] as [string,string][]).map(([href, label]) => (
            <Link key={href} href={href}
              className={`nav-item${typeof window !== 'undefined' && window.location.pathname === href ? ' active' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p className="nav-label">Progress</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{assessed} of {total} assessed</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              <span>✅ {counts.yes}</span>
              <span>⚠️ {counts.partial}</span>
              <span>❌ {counts.no}</span>
              <span>— {counts.na}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ padding: '32px 40px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
            21 CFR Part 820 · QMS Gap Analysis
          </p>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>
            Subpart {activeData?.letter} — {activeData?.title}
          </h1>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Met', value: counts.yes, color: '#3a9b5c' },
            { label: 'Partial', value: counts.partial, color: '#b8830a' },
            { label: 'Not met', value: counts.no, color: '#c0392b' },
            { label: 'N/A', value: counts.na, color: 'var(--text-3)' },
            { label: 'Unassessed', value: counts.unset, color: 'var(--text-4)' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 500, color: item.color }}>{item.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Sections */}
        {activeData?.sections.map(section => {
          const secReqs = section.requirements;
          const secMet = secReqs.filter(r => gapState[r.id]?.status === 'yes').length;
          return (
            <div key={section.id} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 17, margin: 0, letterSpacing: '-0.01em' }}>
                  {section.label}
                </h2>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)' }}>
                  {secMet}/{secReqs.length}
                </span>
              </div>

              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                {secReqs.map((req, idx) => {
                  const rowState = gapState[req.id] ?? defaultState();
                  const isExpanded = expandedRows.has(req.id);
                  const hasContent = rowState.evidence || rowState.comments || rowState.notes;
                  const isLast = idx === secReqs.length - 1;

                  return (
                    <div
                      key={req.id}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid var(--line)',
                        background: isExpanded ? 'var(--surface-1)' : 'transparent',
                      }}
                    >
                      {/* Row header */}
                      <div style={{ display: 'flex', gap: 12, padding: '10px 14px', alignItems: 'flex-start' }}>
                        {/* Expand toggle */}
                        <button
                          onClick={() => toggleExpand(req.id)}
                          style={{
                            flexShrink: 0,
                            width: 18,
                            height: 18,
                            marginTop: 1,
                            borderRadius: 4,
                            border: '1px solid var(--line-strong)',
                            background: isExpanded ? 'var(--surface-3)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            color: 'var(--text-3)',
                            cursor: 'pointer',
                          }}
                          title={isExpanded ? 'Collapse' : 'Expand to add notes'}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>

                        {/* Requirement text */}
                        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: 'var(--text)' }}>
                          {req.text}
                          {req.cap && (
                            <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                              CAP: {req.cap.length > 120 ? req.cap.slice(0, 120) + '…' : req.cap}
                            </div>
                          )}
                          {hasContent && !isExpanded && (
                            <div style={{ marginTop: 5, fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                              ● has notes
                            </div>
                          )}
                        </div>

                        {/* Status buttons */}
                        <div style={{ flexShrink: 0, display: 'flex', gap: 4, alignItems: 'center' }}>
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value ?? 'null'}
                              onClick={() => setStatus(req.id, opt.value)}
                              title={opt.title}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: rowState.status === opt.value
                                  ? '2px solid var(--accent)'
                                  : '1px solid var(--line-strong)',
                                background: rowState.status === opt.value
                                  ? 'var(--accent-soft)'
                                  : 'transparent',
                                fontSize: 14,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expanded fields */}
                      {isExpanded && (
                        <div style={{ padding: '4px 14px 14px 44px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {([
                            { field: 'evidence', label: 'Evidence of Compliance' },
                            { field: 'comments', label: 'Comments' },
                            { field: 'notes', label: 'Notes' },
                          ] as const).map(({ field, label }) => (
                            <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
                                {label}
                              </label>
                              <textarea
                                value={rowState[field]}
                                onChange={e => setField(req.id, field, e.target.value)}
                                rows={2}
                                placeholder={`Enter ${label.toLowerCase()}…`}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: 6,
                                  border: '1px solid var(--line-strong)',
                                  background: 'var(--surface-2)',
                                  color: 'var(--text)',
                                  fontSize: 13,
                                  fontFamily: 'var(--sans)',
                                  lineHeight: 1.5,
                                  resize: 'vertical',
                                  outline: 'none',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--line-strong)')}
                              />
                            </div>
                          ))}
                          {req.cap && req.cap.length > 120 && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
                              <span style={{ color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CAP (full): </span>
                              {req.cap}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 40 }}>
          All changes saved automatically to browser storage. Source: 21 CFR Part 820 (FDA Quality System Regulation).
        </p>
      </main>
    </div>
  );
}