'use client';
import { useState, useMemo } from 'react';
import { BiodesignState, PATHWAY_META } from './data';
import { FlowCanvas } from './flowbg';

// ── Layout constants ──────────────────────────────────────────────────────────
const COLUMN_W = 200;
const COL_GAP   = 90;
const NODE_H    = 52;
const NODE_GAP  = 10;
const HEADER_H  = 120;
const TOP_PAD   = 80;
const TOTAL_W   = 4 * COLUMN_W + 3 * COL_GAP; // 1070px

const PHASE_COLORS = {
  identify:  '#E8A852',
  invent:    '#A07EE8',
  implement: '#52E8B4',
  comply:    '#E87252',
} as const;

const PHASES = [
  { key: 'identify',  num: '01', label: 'IDENTIFY',  tab: 'needs' },
  { key: 'invent',    num: '02', label: 'INVENT',    tab: 'concepts' },
  { key: 'implement', num: '03', label: 'IMPLEMENT', tab: 'regulatory' },
  { key: 'comply',    num: '04', label: 'COMPLY',    tab: 'standards' },
] as const;

function colX(colIdx: number) {
  return colIdx * (COLUMN_W + COL_GAP);
}

function nodeY(rowIdx: number) {
  return HEADER_H + rowIdx * (NODE_H + NODE_GAP);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Node {
  id: string;
  colIdx: number;
  rowIdx: number;
  label: string;
  sub: string;
  color: string;
  phase: string;
  tab: string;
  isPlaceholder?: boolean;
}

interface Edge {
  from: string;
  to: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface CrossPhaseThreadsProps {
  state: BiodesignState;
  onNavigate: (phase: string, tab: string) => void;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function buildNodes(state: BiodesignState): Node[] {
  const nodes: Node[] = [];

  // Column 0 — Identify
  const needs = state.needs.slice(0, 8);
  if (needs.length === 0) {
    nodes.push({
      id: 'placeholder-identify',
      colIdx: 0, rowIdx: 0,
      label: 'No data yet', sub: '',
      color: PHASE_COLORS.identify,
      phase: 'identify', tab: 'needs',
      isPlaceholder: true,
    });
  } else {
    needs.forEach((need, i) => {
      nodes.push({
        id: need.id,
        colIdx: 0, rowIdx: i,
        label: truncate(need.problem, 35),
        sub: need.status,
        color: PHASE_COLORS.identify,
        phase: 'identify', tab: 'needs',
      });
    });
  }

  // Column 1 — Invent
  const concepts = state.concepts.slice(0, 8);
  if (concepts.length === 0) {
    nodes.push({
      id: 'placeholder-invent',
      colIdx: 1, rowIdx: 0,
      label: 'No data yet', sub: '',
      color: PHASE_COLORS.invent,
      phase: 'invent', tab: 'concepts',
      isPlaceholder: true,
    });
  } else {
    concepts.forEach((concept, i) => {
      nodes.push({
        id: concept.id,
        colIdx: 1, rowIdx: i,
        label: truncate(concept.title, 35),
        sub: concept.status,
        color: PHASE_COLORS.invent,
        phase: 'invent', tab: 'concepts',
      });
    });
  }

  // Column 2 — Implement (single regulatory node)
  const pathway = state.regulatory.pathway;
  const pathwayLabel = PATHWAY_META[pathway]?.label ?? 'Pathway TBD';
  const deviceClass = state.regulatory.deviceClass;
  nodes.push({
    id: 'regulatory-node',
    colIdx: 2, rowIdx: 0,
    label: pathwayLabel,
    sub: `Class ${deviceClass}`,
    color: PHASE_COLORS.implement,
    phase: 'implement', tab: 'regulatory',
  });

  // Column 3 — Comply
  const activeStandards = Object.entries(state.comply.compliance)
    .filter(([, v]) => v.status !== 'not-started')
    .slice(0, 8);
  if (activeStandards.length === 0) {
    nodes.push({
      id: 'placeholder-comply',
      colIdx: 3, rowIdx: 0,
      label: 'No data yet', sub: '',
      color: PHASE_COLORS.comply,
      phase: 'comply', tab: 'standards',
      isPlaceholder: true,
    });
  } else {
    activeStandards.forEach(([key, val], i) => {
      nodes.push({
        id: `std-${key}`,
        colIdx: 3, rowIdx: i,
        label: truncate(key, 35),
        sub: val.status,
        color: PHASE_COLORS.comply,
        phase: 'comply', tab: 'standards',
      });
    });
  }

  return nodes;
}

function buildEdges(state: BiodesignState): Edge[] {
  const edges: Edge[] = [];

  // Need → Concept via concept.needId
  state.concepts
    .filter(c => state.needs.some(n => n.id === c.needId))
    .forEach(c => edges.push({ from: c.needId, to: c.id }));

  // Selected/development concepts → Regulatory
  state.concepts
    .filter(c => c.status === 'selected' || c.status === 'development')
    .forEach(c => edges.push({ from: c.id, to: 'regulatory-node' }));

  // Regulatory → each active compliance standard
  Object.keys(state.comply.compliance)
    .filter(k => state.comply.compliance[k].status !== 'not-started')
    .forEach(k => edges.push({ from: 'regulatory-node', to: `std-${k}` }));

  return edges;
}

// ── Spark delays per edge index ───────────────────────────────────────────────
const SPARK_CONFIGS = [
  { r: 2.5, opacity: 0.85, dur: '2.4s', begin: '0s'   },
  { r: 2.0, opacity: 0.55, dur: '2.4s', begin: '0.8s' },
  { r: 1.6, opacity: 0.35, dur: '2.4s', begin: '1.6s' },
];

// ── Main component ────────────────────────────────────────────────────────────
export function CrossPhaseThreads({ state, onNavigate, onClose }: CrossPhaseThreadsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const nodes = useMemo(() => buildNodes(state), [state]);
  const edges = useMemo(() => buildEdges(state), [state]);

  // Index nodes by id for quick lookup
  const nodeMap = useMemo(() => {
    const m = new Map<string, Node>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  // Per-column node counts for header badges
  const colCounts = useMemo(() => {
    const counts = [0, 0, 0, 0];
    nodes.forEach(n => {
      if (!n.isPlaceholder) counts[n.colIdx]++;
    });
    return counts;
  }, [nodes]);

  // Determine connected IDs for hovered node
  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const ids = new Set<string>([hoveredId]);
    edges.forEach(e => {
      if (e.from === hoveredId) ids.add(e.to);
      if (e.to === hoveredId) ids.add(e.from);
    });
    return ids;
  }, [hoveredId, edges]);

  // Layout sizing
  const maxNodes = useMemo(() => {
    const colMaxes = [0, 0, 0, 0];
    nodes.forEach(n => { colMaxes[n.colIdx] = Math.max(colMaxes[n.colIdx], n.rowIdx + 1); });
    return Math.max(...colMaxes, 1);
  }, [nodes]);

  const totalHeight = HEADER_H + maxNodes * (NODE_H + NODE_GAP) + 60;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'var(--bg)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Constellation background — fills viewport */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <FlowCanvas accent="#52C0E8" style={{ zIndex: 0 }} />
      </div>

      {/* All content above background */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px 16px',
          background: 'linear-gradient(180deg, var(--bg) 70%, transparent 100%)',
          backdropFilter: 'blur(6px)',
        }}>
          <div>
            <div style={{
              fontSize: 9,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.18em',
              color: '#52C0E8',
              textTransform: 'uppercase',
              marginBottom: 6,
              opacity: 0.8,
            }}>
              Stanford Biodesign Framework
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              fontFamily: 'var(--sans)',
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}>
              Cross-Phase Threads
            </h1>
            <div style={{
              fontSize: 12,
              fontFamily: 'var(--sans)',
              color: 'var(--text-4)',
              marginTop: 3,
              letterSpacing: '0.01em',
            }}>
              Trace decisions from need to compliance
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text)',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, border-color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            aria-label="Close cross-phase threads"
          >
            ✕
          </button>
        </div>

        {/* ── Legend strip ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: 24,
          padding: '0 32px 20px',
          position: 'relative',
          zIndex: 1,
        }}>
          {PHASES.map(p => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: PHASE_COLORS[p.key],
                boxShadow: `0 0 6px ${PHASE_COLORS[p.key]}88`,
              }} />
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--mono)',
                color: 'var(--text-4)',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}>
                {p.num} {p.label}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
              <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="3 2" />
            </svg>
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--mono)',
              color: 'var(--text-4)',
              letterSpacing: '0.07em',
            }}>
              thread connection
            </span>
          </div>
        </div>

        {/* ── Visualization canvas ─────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: `0 32px ${TOP_PAD}px`,
          position: 'relative',
          zIndex: 1,
        }}>
          <div
            style={{
              position: 'relative',
              width: TOTAL_W,
              height: totalHeight,
              flexShrink: 0,
            }}
          >
            {/* ── Column headers ─────────────────────────────────────────── */}
            {PHASES.map((p, colIdx) => {
              const color = PHASE_COLORS[p.key];
              const count = colCounts[colIdx];
              return (
                <div
                  key={p.key}
                  style={{
                    position: 'absolute',
                    left: colX(colIdx),
                    top: 0,
                    width: COLUMN_W,
                    height: HEADER_H,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    paddingBottom: 16,
                  }}
                >
                  {/* Accent line */}
                  <div style={{
                    width: 28,
                    height: 2,
                    background: color,
                    borderRadius: 1,
                    marginBottom: 10,
                    boxShadow: `0 0 8px ${color}66`,
                  }} />
                  <div style={{
                    fontSize: 9,
                    fontFamily: 'var(--mono)',
                    color,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    opacity: 0.9,
                  }}>
                    {p.num}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'var(--sans)',
                      color: 'var(--text)',
                      letterSpacing: '0.06em',
                    }}>
                      {p.label}
                    </span>
                    {count > 0 && (
                      <span style={{
                        fontSize: 9,
                        fontFamily: 'var(--mono)',
                        color,
                        background: `${color}18`,
                        border: `1px solid ${color}40`,
                        borderRadius: 10,
                        padding: '1px 6px',
                        letterSpacing: '0.05em',
                      }}>
                        {count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ── SVG edges + sparks ─────────────────────────────────────── */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: TOTAL_W,
                height: totalHeight,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <defs>
                {/* Glow filter for highlighted edges */}
                <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {edges.map((edge, edgeIdx) => {
                const src = nodeMap.get(edge.from);
                const dst = nodeMap.get(edge.to);
                if (!src || !dst) return null;

                const x1 = colX(src.colIdx) + COLUMN_W;
                const y1 = nodeY(src.rowIdx) + NODE_H / 2;
                const x2 = colX(dst.colIdx);
                const y2 = nodeY(dst.rowIdx) + NODE_H / 2;
                const dx = COL_GAP * 0.55;
                const pathD = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
                const pathId = `edge-path-${edgeIdx}`;

                const isHighlighted =
                  hoveredId !== null &&
                  (connectedIds.has(edge.from) && connectedIds.has(edge.to));

                const edgeOpacity = hoveredId === null
                  ? 0.30
                  : isHighlighted ? 0.80 : 0.06;

                const srcColor = src.color;

                return (
                  <g key={edgeIdx}>
                    {/* Invisible wider path for definition (sparks use this) */}
                    <path
                      id={pathId}
                      d={pathD}
                      fill="none"
                      stroke="none"
                    />
                    {/* Visible path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={srcColor}
                      strokeWidth={isHighlighted ? 1.6 : 1.2}
                      strokeOpacity={edgeOpacity}
                      filter={isHighlighted ? 'url(#edge-glow)' : undefined}
                      style={{ transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }}
                    />
                    {/* Animated sparks */}
                    {SPARK_CONFIGS.map((spark, si) => (
                      <circle
                        key={si}
                        r={spark.r}
                        fill={srcColor}
                        opacity={hoveredId === null ? spark.opacity : isHighlighted ? spark.opacity : 0.05}
                        style={{ transition: 'opacity 0.15s' }}
                      >
                        <animateMotion
                          dur={spark.dur}
                          repeatCount="indefinite"
                          rotate="auto"
                          begin={spark.begin}
                        >
                          <mpath xlinkHref={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* ── Node cards ─────────────────────────────────────────────── */}
            {nodes.map(node => {
              const isHovered = hoveredId === node.id;
              const isDimmed = hoveredId !== null && !connectedIds.has(node.id);
              const isConnected = hoveredId !== null && connectedIds.has(node.id) && !isHovered;

              const cardOpacity = isDimmed ? 0.25 : 1;
              const borderColor = isHovered
                ? `${node.color}90`
                : isConnected
                  ? `${node.color}55`
                  : `${node.color}30`;
              const boxShadow = isHovered
                ? `0 0 0 2px ${node.color}, 0 0 16px ${node.color}44`
                : isConnected
                  ? `0 0 8px ${node.color}22`
                  : 'none';

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: colX(node.colIdx),
                    top: nodeY(node.rowIdx),
                    width: COLUMN_W,
                    height: NODE_H,
                    background: node.isPlaceholder
                      ? 'rgba(19, 30, 44, 0.45)'
                      : 'rgba(19, 30, 44, 0.85)',
                    border: `1px solid ${borderColor}`,
                    borderLeft: `3px solid ${node.isPlaceholder ? node.color + '40' : node.color}`,
                    borderRadius: 3,
                    padding: '8px 12px',
                    cursor: node.isPlaceholder ? 'default' : 'pointer',
                    opacity: cardOpacity,
                    boxShadow,
                    transition: 'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 3,
                    backdropFilter: 'blur(4px)',
                  }}
                  onMouseEnter={() => !node.isPlaceholder && setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    if (!node.isPlaceholder) {
                      onNavigate(node.phase, node.tab);
                      onClose();
                    }
                  }}
                >
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--sans)',
                    color: node.isPlaceholder ? 'var(--text-4)' : 'var(--text)',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {node.label}
                  </div>
                  {node.sub && (
                    <div style={{
                      fontSize: 9,
                      fontFamily: 'var(--mono)',
                      color: node.isPlaceholder ? 'var(--text-4)' : `${node.color}cc`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {node.sub}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer hint ──────────────────────────────────────────────────── */}
        <div style={{
          textAlign: 'center',
          padding: '0 32px 28px',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--mono)',
            color: 'var(--text-4)',
            letterSpacing: '0.09em',
            opacity: 0.6,
          }}>
            hover to highlight threads &nbsp;·&nbsp; click any node to navigate
          </span>
        </div>
      </div>
    </div>
  );
}
