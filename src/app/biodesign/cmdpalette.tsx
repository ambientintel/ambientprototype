'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BiodesignState } from './data';

// ── Phase colors ──────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  identify:  '#E8A852',
  invent:    '#A07EE8',
  implement: '#52E8B4',
  comply:    '#E87252',
};

// ── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  phase: string;
  tab: string;
  hint: string; // keyboard hint — tab number within phase
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Needs',           phase: 'identify',  tab: 'needs',         hint: '1' },
  { label: 'Stakeholders',    phase: 'identify',  tab: 'stakeholders',  hint: '2' },
  { label: 'Competitive',     phase: 'identify',  tab: 'competitors',   hint: '3' },
  { label: 'Concepts',        phase: 'invent',    tab: 'concepts',      hint: '1' },
  { label: 'Regulatory',      phase: 'implement', tab: 'regulatory',    hint: '1' },
  { label: 'Strategy',        phase: 'implement', tab: 'strategy',      hint: '2' },
  { label: 'Reimbursement',   phase: 'implement', tab: 'reimbursement', hint: '3' },
  { label: 'Timeline',        phase: 'implement', tab: 'timeline',      hint: '4' },
  { label: 'Risks',           phase: 'implement', tab: 'risks',         hint: '5' },
  { label: 'IP Portfolio',    phase: 'implement', tab: 'ipfilings',     hint: '6' },
  { label: 'Device Profile',  phase: 'comply',    tab: 'profile',       hint: '1' },
  { label: 'Standards',       phase: 'comply',    tab: 'standards',     hint: '2' },
  { label: 'Design Controls', phase: 'comply',    tab: 'designcontrols', hint: '3' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CommandPaletteProps {
  state: BiodesignState;
  phase: string;
  tab: string;
  onNavigate: (phase: string, tab: string) => void;
  onClose: () => void;
}

// ── Result item types ─────────────────────────────────────────────────────────

type ResultItem =
  | { kind: 'nav';  nav: NavItem }
  | { kind: 'need'; id: string; snippet: string }
  | { kind: 'concept'; id: string; title: string }
  | { kind: 'risk'; id: string; title: string }
  | { kind: 'milestone'; id: string; title: string };

interface Section {
  label: string;
  items: ResultItem[];
}

// ── Phase badge ───────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: string }) {
  const color = PHASE_COLORS[phase] ?? '#8a7d6e';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '1px 6px',
      borderRadius: 10,
      fontSize: 9,
      fontFamily: 'var(--mono)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      background: color + '22',
      color,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      {phase}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CommandPalette({ state, onNavigate, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  // Build sections based on query
  const sections: Section[] = (() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Empty query — show all nav items grouped by phase
      const byPhase: Record<string, NavItem[]> = {};
      for (const nav of NAV_ITEMS) {
        if (!byPhase[nav.phase]) byPhase[nav.phase] = [];
        byPhase[nav.phase].push(nav);
      }
      return Object.entries(byPhase).map(([phase, navs]) => ({
        label: phase.charAt(0).toUpperCase() + phase.slice(1),
        items: navs.map(nav => ({ kind: 'nav' as const, nav })),
      }));
    }

    // Non-empty query — search across nav + project data
    const results: Section[] = [];

    // Nav items
    const navMatches = NAV_ITEMS.filter(n => n.label.toLowerCase().includes(q) || n.phase.toLowerCase().includes(q) || n.tab.toLowerCase().includes(q));
    if (navMatches.length > 0) {
      results.push({
        label: 'Navigation',
        items: navMatches.map(nav => ({ kind: 'nav' as const, nav })),
      });
    }

    // Needs
    const needMatches = (state.needs ?? []).filter(n =>
      n.problem.toLowerCase().includes(q) || n.population.toLowerCase().includes(q)
    );
    if (needMatches.length > 0) {
      results.push({
        label: 'Needs',
        items: needMatches.map(n => ({
          kind: 'need' as const,
          id: n.id,
          snippet: n.problem.length > 64 ? n.problem.slice(0, 64) + '…' : n.problem,
        })),
      });
    }

    // Concepts
    const conceptMatches = (state.concepts ?? []).filter(c =>
      c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
    if (conceptMatches.length > 0) {
      results.push({
        label: 'Concepts',
        items: conceptMatches.map(c => ({ kind: 'concept' as const, id: c.id, title: c.title })),
      });
    }

    // Risks
    const riskMatches = (state.risks ?? []).filter(r =>
      r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
    if (riskMatches.length > 0) {
      results.push({
        label: 'Risks',
        items: riskMatches.map(r => ({ kind: 'risk' as const, id: r.id, title: r.title })),
      });
    }

    // Milestones
    const milestoneMatches = (state.milestones ?? []).filter(m =>
      m.title.toLowerCase().includes(q)
    );
    if (milestoneMatches.length > 0) {
      results.push({
        label: 'Milestones',
        items: milestoneMatches.map(m => ({ kind: 'milestone' as const, id: m.id, title: m.title })),
      });
    }

    return results;
  })();

  // Flat list of all items for keyboard nav
  const flatItems: ResultItem[] = sections.flatMap(s => s.items);

  // Clamp selection when list changes
  useEffect(() => {
    setSelectedIndex(prev => Math.min(prev, Math.max(0, flatItems.length - 1)));
  }, [flatItems.length]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Activate the currently selected item
  const activate = useCallback((item: ResultItem) => {
    if (item.kind === 'nav') {
      onNavigate(item.nav.phase, item.nav.tab);
    } else if (item.kind === 'need') {
      onNavigate('identify', 'needs');
    } else if (item.kind === 'concept') {
      onNavigate('invent', 'concepts');
    } else if (item.kind === 'risk') {
      onNavigate('implement', 'risks');
    } else if (item.kind === 'milestone') {
      onNavigate('implement', 'timeline');
    }
    onClose();
  }, [onNavigate, onClose]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) activate(item);
    }
  }, [flatItems, selectedIndex, activate, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Build a cumulative offset map for each section so we know global index of each item
  let globalIdx = 0;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 100,
      }}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 160px)',
        }}
      >
        {/* Search input */}
        <div style={{
          borderBottom: '1px solid var(--line-strong)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
        }}>
          {/* Search icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--text-4)' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tabs, needs, concepts…"
            style={{
              flex: 1,
              height: 52,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 16,
              fontFamily: 'var(--mono)',
            }}
          />
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--text-4)',
            padding: '2px 6px',
            border: '1px solid var(--line-strong)',
            borderRadius: 3,
            flexShrink: 0,
          }}>ESC</span>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            flex: 1,
            paddingBottom: 8,
          }}
        >
          {flatItems.length === 0 && (
            <div style={{
              padding: '32px 20px',
              textAlign: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--text-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              No results
            </div>
          )}

          {sections.map(section => {
            return (
              <div key={section.label}>
                {/* Section header */}
                <div style={{
                  padding: '12px 16px 4px',
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  userSelect: 'none',
                }}>
                  {section.label}
                </div>

                {/* Items */}
                {section.items.map(item => {
                  const itemIdx = globalIdx++;
                  const isSelected = itemIdx === selectedIndex;

                  let label = '';
                  let sublabel = '';
                  let phase = '';
                  let hint = '';

                  if (item.kind === 'nav') {
                    label = item.nav.label;
                    phase = item.nav.phase;
                    hint = item.nav.hint;
                  } else if (item.kind === 'need') {
                    label = 'Need';
                    sublabel = item.snippet;
                    phase = 'identify';
                  } else if (item.kind === 'concept') {
                    label = 'Concept';
                    sublabel = item.title;
                    phase = 'invent';
                  } else if (item.kind === 'risk') {
                    label = 'Risk';
                    sublabel = item.title;
                    phase = 'implement';
                  } else if (item.kind === 'milestone') {
                    label = 'Milestone';
                    sublabel = item.title;
                    phase = 'implement';
                  }

                  const phaseColor = PHASE_COLORS[phase] ?? '#8a7d6e';

                  return (
                    <div
                      key={`${item.kind}-${item.kind === 'nav' ? item.nav.tab : (item as { id: string }).id}`}
                      data-selected={isSelected}
                      onClick={() => activate(item)}
                      onMouseEnter={() => setSelectedIndex(itemIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(82,192,232,0.08)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <PhaseBadge phase={phase} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 13,
                          color: 'var(--text)',
                          fontFamily: 'var(--sans)',
                        }}>
                          {label}
                        </span>
                        {sublabel && (
                          <span style={{
                            fontSize: 13,
                            color: 'var(--text-3)',
                            marginLeft: 6,
                          }}>
                            — {sublabel}
                          </span>
                        )}
                      </div>

                      {hint && (
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          color: 'var(--text-4)',
                          padding: '1px 6px',
                          border: '1px solid var(--line)',
                          borderRadius: 3,
                          flexShrink: 0,
                        }}>
                          {hint}
                        </span>
                      )}

                      {!hint && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, color: isSelected ? phaseColor : 'var(--text-4)', opacity: 0.6 }}>
                          <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '7px 16px',
          display: 'flex',
          gap: 16,
          flexShrink: 0,
        }}>
          {[
            { keys: ['↑', '↓'], label: 'navigate' },
            { keys: ['↵'], label: 'open' },
            { keys: ['ESC'], label: 'close' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {keys.map(k => (
                <span key={k} style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--text-4)',
                  padding: '1px 5px',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 2,
                }}>{k}</span>
              ))}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
