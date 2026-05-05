'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BiodesignState, Milestone, MilestoneCategory, MilestoneStatus } from './data';
import { FlowCanvas } from './flowbg';

// ── Constants ─────────────────────────────────────────────────────────────────

const GANTT_ACCENT = '#52C0E8';

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  regulatory:    '#E87252',
  clinical:      '#A07EE8',
  reimbursement: '#52C0E8',
  ip:            '#52E8B4',
  commercial:    '#E8A852',
  manufacturing: 'var(--text-3)',
  operational:   'var(--text-2)',
};

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  regulatory:    'Regulatory',
  clinical:      'Clinical',
  reimbursement: 'Reimbursement',
  ip:            'IP',
  commercial:    'Commercial',
  manufacturing: 'Manufacturing',
  operational:   'Operational',
};

const STATUS_META: Record<MilestoneStatus, { label: string; color: string; bg: string }> = {
  upcoming:      { label: 'Upcoming',    color: 'var(--text-3)', bg: 'rgba(138,159,168,0.12)' },
  'in-progress': { label: 'In Progress', color: '#52C0E8',       bg: 'rgba(82,192,232,0.12)' },
  complete:      { label: 'Complete',    color: '#52E8B4',       bg: 'rgba(82,232,180,0.12)' },
  delayed:       { label: 'Delayed',     color: '#E87252',       bg: 'rgba(232,114,82,0.12)' },
  'at-risk':     { label: 'At Risk',     color: '#E8A852',       bg: 'rgba(232,168,82,0.12)' },
};

const ALL_CATEGORIES: MilestoneCategory[] = [
  'regulatory', 'clinical', 'reimbursement', 'ip', 'commercial', 'manufacturing', 'operational',
];
const ALL_STATUSES: MilestoneStatus[] = ['upcoming', 'in-progress', 'complete', 'delayed', 'at-risk'];

const DEFAULT_DURATION_DAYS = 14;
const ROW_HEIGHT = 36;
const CAT_HEADER_HEIGHT = 28;
const LABEL_COL_WIDTH = 200;

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function toDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function fmtDate(str: string): string {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function datePct(date: Date, viewStart: Date, viewEnd: Date): number {
  const total = viewEnd.getTime() - viewStart.getTime();
  if (total <= 0) return 0;
  return (date.getTime() - viewStart.getTime()) / total * 100;
}

function computeViewRange(milestones: Milestone[]): { viewStart: Date; viewEnd: Date } {
  const today = new Date();
  const dates: Date[] = [];
  for (const m of milestones) {
    const t = toDate(m.targetDate);
    if (t) dates.push(t);
    const c = toDate(m.completedDate);
    if (c) dates.push(c);
  }
  if (dates.length === 0) {
    return {
      viewStart: addDays(today, -30),
      viewEnd: addDays(today, 335),
    };
  }
  const min = new Date(Math.min(...dates.map(d => d.getTime())));
  const max = new Date(Math.max(...dates.map(d => d.getTime())));
  return {
    viewStart: addDays(min, -30),
    viewEnd: addDays(max, 30),
  };
}

function setZoomWindow(zoom: '3M' | '6M' | '1Y' | '2Y'): { viewStart: Date; viewEnd: Date } {
  const today = new Date();
  const months = zoom === '3M' ? 3 : zoom === '6M' ? 6 : zoom === '1Y' ? 12 : 24;
  const halfDays = Math.round(months * 15.22);
  return {
    viewStart: addDays(today, -halfDays),
    viewEnd: addDays(today, halfDays),
  };
}

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--line)',
  borderRadius: 2,
  padding: '7px 10px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
};

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
  marginBottom: 5,
};

// ── Milestone Form ────────────────────────────────────────────────────────────

function MilestoneForm({
  initial,
  onSave,
  onCancel,
  saveLabel,
}: {
  initial: Partial<Milestone>;
  onSave: (m: Partial<Milestone>) => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const [draft, setDraft] = useState<Partial<Milestone>>(initial);
  const set = (patch: Partial<Milestone>) => setDraft(d => ({ ...d, ...patch }));

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: `1px solid ${GANTT_ACCENT}44`,
      borderRadius: 2,
      padding: 20,
    }}>
      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <div style={monoLabel}>Title</div>
        <input
          value={draft.title ?? ''}
          onChange={e => set({ title: e.target.value })}
          placeholder="Milestone title..."
          style={inputStyle}
        />
      </div>

      {/* Category pills */}
      <div style={{ marginBottom: 14 }}>
        <div style={monoLabel}>Category</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map(cat => {
            const active = draft.category === cat;
            const color = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => set({ category: cat })}
                style={{
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                  background: active ? `${color}22` : 'var(--surface-2)',
                  color: active ? color : 'var(--text-3)',
                  border: active ? `1px solid ${color}55` : '1px solid var(--line)',
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: active ? 700 : 400,
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  transition: 'all 0.13s',
                } as React.CSSProperties}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status pills */}
      <div style={{ marginBottom: 14 }}>
        <div style={monoLabel}>Status</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(st => {
            const active = draft.status === st;
            const meta = STATUS_META[st];
            return (
              <button
                key={st}
                onClick={() => set({ status: st })}
                style={{
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                  background: active ? meta.bg : 'var(--surface-2)',
                  color: active ? meta.color : 'var(--text-3)',
                  border: active ? `1px solid ${meta.color}55` : '1px solid var(--line)',
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: active ? 700 : 400,
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  transition: 'all 0.13s',
                } as React.CSSProperties}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={monoLabel}>Target Date</div>
          <input
            type="date"
            value={draft.targetDate ?? ''}
            onChange={e => set({ targetDate: e.target.value })}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
        <div>
          <div style={monoLabel}>Completed Date</div>
          <input
            type="date"
            value={draft.completedDate ?? ''}
            onChange={e => set({ completedDate: e.target.value })}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Owner */}
      <div style={{ marginBottom: 14 }}>
        <div style={monoLabel}>Owner</div>
        <input
          value={draft.owner ?? ''}
          onChange={e => set({ owner: e.target.value })}
          placeholder="Owner or team..."
          style={inputStyle}
        />
      </div>

      {/* Critical + Notes */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={draft.critical ?? false}
            onChange={e => set({ critical: e.target.checked })}
            style={{ accentColor: '#E87252', width: 14, height: 14 }}
          />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: draft.critical ? '#E87252' : 'var(--text-3)' }}>
            Critical Path
          </span>
        </label>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={monoLabel}>Notes</div>
        <textarea
          value={draft.notes ?? ''}
          onChange={e => set({ notes: e.target.value })}
          placeholder="Notes..."
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', fontSize: 12 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSave(draft)}
          disabled={!draft.title?.trim()}
          style={{
            padding: '8px 22px', borderRadius: 2,
            background: GANTT_ACCENT, color: '#0d1622', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            opacity: draft.title?.trim() ? 1 : 0.4,
          }}
        >{saveLabel}</button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px', borderRadius: 2,
            background: 'transparent', color: 'var(--text-3)',
            border: '1px solid var(--line)', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function MilestoneTooltip({
  m, x, y, visible,
}: { m: Milestone; x: number; y: number; visible: boolean }) {
  if (!visible) return null;
  const meta = STATUS_META[m.status];
  return (
    <div style={{
      position: 'fixed',
      left: x + 14,
      top: y - 8,
      zIndex: 9999,
      background: 'var(--surface-3)',
      border: '1px solid var(--line-strong)',
      borderRadius: 3,
      padding: '10px 14px',
      minWidth: 200,
      maxWidth: 280,
      pointerEvents: 'none',
      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: CATEGORY_COLORS[m.category], textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
        {CATEGORY_LABELS[m.category]}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>{m.title}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: meta.color, background: meta.bg,
          padding: '1px 6px', borderRadius: 2,
        }}>{meta.label}</span>
        {m.critical && (
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#E87252', background: 'rgba(232,114,82,0.12)',
            padding: '1px 6px', borderRadius: 2,
          }}>Critical</span>
        )}
      </div>
      {m.targetDate && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>
          Target: {fmtDate(m.targetDate)}
        </div>
      )}
      {m.completedDate && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#52E8B4', marginBottom: 2 }}>
          Completed: {fmtDate(m.completedDate)}
        </div>
      )}
      {m.owner && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', marginBottom: 2 }}>
          Owner: {m.owner}
        </div>
      )}
      {m.notes && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
          {m.notes.length > 120 ? m.notes.slice(0, 120) + '…' : m.notes}
        </div>
      )}
    </div>
  );
}

// ── Gantt Row Bar ─────────────────────────────────────────────────────────────

function GanttBar({
  m,
  viewStart,
  viewEnd,
}: {
  m: Milestone;
  viewStart: Date;
  viewEnd: Date;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const totalMs = viewEnd.getTime() - viewStart.getTime();

  const targetDate = toDate(m.targetDate);
  const completedDate = toDate(m.completedDate);

  if (!targetDate && !completedDate) {
    return (
      <div style={{ height: ROW_HEIGHT, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', paddingLeft: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          No date
        </span>
      </div>
    );
  }

  const barEndDate = targetDate ?? completedDate!;
  const barStartDate = addDays(barEndDate, -DEFAULT_DURATION_DAYS);

  const startPct = Math.max(0, Math.min(100, datePct(barStartDate, viewStart, viewEnd)));
  const endPct = Math.max(0, Math.min(100, datePct(barEndDate, viewStart, viewEnd)));
  const widthPct = Math.max(0, endPct - startPct);

  const color = CATEGORY_COLORS[m.category];
  const resolvedColor = color.startsWith('var(') ? (color === 'var(--text-3)' ? 'rgba(214,233,248,0.45)' : 'rgba(214,233,248,0.70)') : color;

  let barBg = resolvedColor;
  let barOverlay: string | null = null;

  if (m.status === 'complete') {
    barBg = resolvedColor;
    barOverlay = null;
  } else if (m.status === 'in-progress') {
    barBg = `${resolvedColor}55`;
    barOverlay = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.10) 4px, rgba(255,255,255,0.10) 8px)';
  } else if (m.status === 'upcoming') {
    barBg = 'transparent';
    barOverlay = null;
  } else if (m.status === 'delayed') {
    barBg = '#E87252';
    barOverlay = null;
  } else if (m.status === 'at-risk') {
    barBg = '#E8A852';
    barOverlay = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.10) 4px, rgba(255,255,255,0.10) 8px)';
  }

  const barBorder = m.status === 'upcoming' ? `1px solid ${resolvedColor}88` : 'none';

  // In-progress: show 50% fill
  const progressFill = m.status === 'in-progress' ? 50 : null;

  // Completed diamond position
  let diamondPct: number | null = null;
  if (completedDate) {
    diamondPct = datePct(completedDate, viewStart, viewEnd);
  }

  // If bar is entirely out of view range, skip rendering but keep row height
  if (widthPct <= 0 && diamondPct === null) {
    return <div style={{ height: ROW_HEIGHT }} />;
  }

  return (
    <div
      style={{ height: ROW_HEIGHT, position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, visible: true })}
      onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
    >
      {/* Bar */}
      {widthPct > 0 && (
        <div style={{
          position: 'absolute',
          left: `${startPct}%`,
          width: `${Math.max(widthPct, 0.5)}%`,
          height: 18,
          borderRadius: 2,
          background: barBg,
          border: barBorder,
          overflow: 'hidden',
          cursor: 'default',
          minWidth: 8,
        }}>
          {/* Stripe overlay for in-progress / at-risk */}
          {barOverlay && (
            <div style={{
              position: 'absolute', inset: 0,
              background: barOverlay,
            }} />
          )}
          {/* Progress fill for in-progress */}
          {progressFill !== null && (
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${progressFill}%`,
              background: `${resolvedColor}88`,
              borderRadius: 2,
            }} />
          )}
          {/* Critical badge */}
          {m.critical && (
            <div style={{
              position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: '#E87252',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 7, color: '#fff', fontWeight: 700,
              flexShrink: 0,
              zIndex: 1,
            }}>!</div>
          )}
        </div>
      )}

      {/* Completed diamond */}
      {diamondPct !== null && diamondPct >= 0 && diamondPct <= 100 && (
        <div style={{
          position: 'absolute',
          left: `${diamondPct}%`,
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: '#52E8B4',
          lineHeight: 1,
          zIndex: 2,
          textShadow: '0 0 6px rgba(82,232,180,0.6)',
        }}>◆</div>
      )}

      <MilestoneTooltip m={m} x={tooltip.x} y={tooltip.y} visible={tooltip.visible} />
    </div>
  );
}

// ── Gantt View ────────────────────────────────────────────────────────────────

function GanttView({
  state,
  update,
  onSwitchToList,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  onSwitchToList: () => void;
}) {
  const milestones = state.milestones ?? [];
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);
  const [zoom, setZoom] = useState<'3M' | '6M' | '1Y' | '2Y' | null>(null);

  const computed = computeViewRange(milestones);
  const [viewStart, setViewStart] = useState<Date>(computed.viewStart);
  const [viewEnd, setViewEnd] = useState<Date>(computed.viewEnd);

  // Resize observer
  const updateWidth = useCallback(() => {
    if (chartRef.current) {
      setChartWidth(chartRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (chartRef.current) ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, [updateWidth]);

  const today = new Date();
  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / 86400000;
  const minChartWidth = Math.max(chartWidth, totalDays * 3);
  const todayPct = datePct(today, viewStart, viewEnd);

  // Month header ticks
  const monthTicks: Array<{ label: string; pct: number }> = [];
  {
    const cursor = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);
    while (cursor <= viewEnd) {
      const pct = datePct(cursor, viewStart, viewEnd);
      if (pct >= 0 && pct <= 100) {
        monthTicks.push({ label: fmtMonthYear(cursor), pct });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  // Stats
  const total = milestones.length;
  const onTrack = milestones.filter(m => m.status === 'complete' || m.status === 'in-progress' || m.status === 'upcoming').length;
  const delayed = milestones.filter(m => m.status === 'delayed').length;
  const critical = milestones.filter(m => m.critical).length;

  // Group by category
  const grouped = ALL_CATEGORIES
    .map(cat => ({
      cat,
      items: milestones
        .filter(m => m.category === cat)
        .sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999')),
    }))
    .filter(g => g.items.length > 0);

  function handleZoom(z: '3M' | '6M' | '1Y' | '2Y') {
    setZoom(z);
    const { viewStart: vs, viewEnd: ve } = setZoomWindow(z);
    setViewStart(vs);
    setViewEnd(ve);
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 24, minHeight: 140 }}>
        <FlowCanvas accent={GANTT_ACCENT} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: GANTT_ACCENT, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
            Project Timeline
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Project Timeline
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 440 }}>
            Visual milestone Gantt chart — track progress across all development phases.
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Milestones', value: total },
              { label: 'On Track', value: onTrack },
              { label: 'Delayed', value: delayed },
              { label: 'Critical', value: critical },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: GANTT_ACCENT, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(82,192,232,0.50)', textTransform: 'uppercase', letterSpacing: '0.13em', marginTop: 3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginRight: 4 }}>Zoom</span>
        {(['3M', '6M', '1Y', '2Y'] as const).map(z => (
          <button
            key={z}
            onClick={() => handleZoom(z)}
            style={{
              padding: '4px 12px', borderRadius: 2, cursor: 'pointer', border: 'none',
              background: zoom === z ? GANTT_ACCENT : 'var(--surface-2)',
              color: zoom === z ? '#0d1622' : 'var(--text-3)',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: zoom === z ? 700 : 400,
              textTransform: 'uppercase', letterSpacing: '0.09em',
              transition: 'all 0.13s',
            }}
          >{z}</button>
        ))}
      </div>

      {/* Empty state */}
      {milestones.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '56px 24px',
          border: '1px dashed var(--line)', borderRadius: 2,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
            No milestones yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.7 }}>
            Switch to List view to add your first milestone.
          </div>
          <button
            onClick={onSwitchToList}
            style={{
              padding: '8px 22px', borderRadius: 2,
              background: GANTT_ACCENT, color: '#0d1622', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}
          >Switch to List View</button>
        </div>
      )}

      {/* Gantt chart */}
      {milestones.length > 0 && (
        <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 2, overflow: 'hidden' }}>
          {/* Label column */}
          <div style={{ width: LABEL_COL_WIDTH, flexShrink: 0, borderRight: '1px solid var(--line)' }}>
            {/* Header cell */}
            <div style={{
              height: CAT_HEADER_HEIGHT,
              display: 'flex', alignItems: 'center',
              padding: '0 12px',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--line)',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                Milestone
              </span>
            </div>

            {/* Category groups */}
            {grouped.map(({ cat, items }) => (
              <React.Fragment key={cat}>
                {/* Category header */}
                <div style={{
                  height: CAT_HEADER_HEIGHT,
                  display: 'flex', alignItems: 'center',
                  padding: '0 12px',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--line)',
                  borderLeft: `3px solid ${CATEGORY_COLORS[cat].startsWith('var(') ? 'var(--text-3)' : CATEGORY_COLORS[cat]}`,
                }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: CATEGORY_COLORS[cat].startsWith('var(') ? 'var(--text-3)' : CATEGORY_COLORS[cat],
                  }}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>

                {/* Milestone rows */}
                {items.map(m => {
                  const meta = STATUS_META[m.status];
                  return (
                    <div
                      key={m.id}
                      style={{
                        height: ROW_HEIGHT,
                        display: 'flex', alignItems: 'center',
                        padding: '0 10px',
                        gap: 6,
                        borderBottom: '1px solid var(--line)',
                        background: 'var(--surface-1)',
                        transition: 'background 0.13s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'; }}
                    >
                      {/* Status dot */}
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: meta.color,
                        boxShadow: `0 0 4px ${meta.color}88`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, color: 'var(--text)', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {m.title}
                        </div>
                        {m.owner && (
                          <div style={{
                            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {m.owner}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Chart area — scrollable */}
          <div ref={chartRef} style={{ flex: 1, overflowX: 'auto' }}>
            <div style={{ minWidth: minChartWidth, position: 'relative' }}>
              {/* Month header row */}
              <div style={{
                height: CAT_HEADER_HEIGHT,
                position: 'relative',
                background: 'var(--surface-2)',
                borderBottom: '1px solid var(--line)',
                overflow: 'hidden',
              }}>
                {monthTicks.map((tick, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: `${tick.pct}%`,
                    top: 0, bottom: 0,
                    display: 'flex', alignItems: 'center',
                    paddingLeft: 6,
                  }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                      {tick.label}
                    </span>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: 1, background: 'var(--line)',
                    }} />
                  </div>
                ))}

                {/* Today line — header portion */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div style={{
                    position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
                    width: 1, background: '#E87252',
                    zIndex: 3,
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 2,
                      fontFamily: 'var(--mono)', fontSize: 7, color: '#E87252',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      whiteSpace: 'nowrap',
                    }}>Today</div>
                  </div>
                )}
              </div>

              {/* Category + milestone rows */}
              {grouped.map(({ cat, items }) => (
                <React.Fragment key={cat}>
                  {/* Category header row — chart side */}
                  <div style={{
                    height: CAT_HEADER_HEIGHT,
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--line)',
                    position: 'relative',
                  }}>
                    {/* Month grid lines */}
                    {monthTicks.map((tick, i) => (
                      <div key={i} style={{
                        position: 'absolute', left: `${tick.pct}%`, top: 0, bottom: 0,
                        width: 1, background: 'var(--line)',
                      }} />
                    ))}
                    {/* Category connector line (vertical, at left edge of first bar) */}
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div style={{
                        position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
                        width: 1, background: 'rgba(232,114,82,0.3)',
                        zIndex: 2,
                      }} />
                    )}
                  </div>

                  {/* Milestone rows */}
                  {items.map((m, idx) => (
                    <div
                      key={m.id}
                      style={{
                        height: ROW_HEIGHT,
                        position: 'relative',
                        borderBottom: '1px solid var(--line)',
                        background: 'var(--surface-1)',
                      }}
                    >
                      {/* Month grid lines */}
                      {monthTicks.map((tick, ti) => (
                        <div key={ti} style={{
                          position: 'absolute', left: `${tick.pct}%`, top: 0, bottom: 0,
                          width: 1, background: 'var(--line)',
                          zIndex: 0,
                        }} />
                      ))}

                      {/* Today line */}
                      {todayPct >= 0 && todayPct <= 100 && (
                        <div style={{
                          position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
                          width: 1, background: '#E87252',
                          zIndex: 2,
                          opacity: 0.6,
                        }} />
                      )}

                      {/* Category connector — vertical line at left of bars for same-category */}
                      {items.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          left: 0, top: 0, bottom: idx < items.length - 1 ? 0 : '50%',
                          width: 2,
                          background: `${CATEGORY_COLORS[cat].startsWith('var(') ? 'rgba(214,233,248,0.20)' : CATEGORY_COLORS[cat]}33`,
                          zIndex: 1,
                        }} />
                      )}

                      {/* Bar */}
                      <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                        <GanttBar m={m} viewStart={viewStart} viewEnd={viewEnd} />
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {milestones.length > 0 && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16, padding: '12px 0' }}>
          {[
            { color: '#52E8B4', label: 'Complete (◆ = completed date)' },
            { color: '#52C0E8', label: 'In Progress (striped)' },
            { color: 'var(--text-3)', label: 'Upcoming (outline)' },
            { color: '#E87252', label: 'Delayed' },
            { color: '#E8A852', label: 'At Risk' },
            { color: '#E87252', label: '! Critical' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 8, borderRadius: 1, background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({
  state,
  update,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const milestones = state.milestones ?? [];
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<MilestoneCategory | 'all'>('all');

  const filtered = milestones
    .filter(m => filterCat === 'all' || m.category === filterCat)
    .sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999'));

  const onTrack = milestones.filter(m => m.status !== 'delayed' && m.status !== 'at-risk').length;
  const delayed = milestones.filter(m => m.status === 'delayed').length;
  const critical = milestones.filter(m => m.critical).length;
  const complete = milestones.filter(m => m.status === 'complete').length;

  function handleAdd(draft: Partial<Milestone>) {
    if (!draft.title?.trim()) return;
    const m: Milestone = {
      id: uid(),
      title: draft.title.trim(),
      category: (draft.category as MilestoneCategory) ?? 'regulatory',
      targetDate: draft.targetDate ?? '',
      completedDate: draft.completedDate ?? '',
      status: (draft.status as MilestoneStatus) ?? 'upcoming',
      owner: draft.owner ?? '',
      critical: draft.critical ?? false,
      notes: draft.notes ?? '',
    };
    update({ ...state, milestones: [...milestones, m] });
    setAdding(false);
  }

  function handleEdit(draft: Partial<Milestone>) {
    if (!draft.title?.trim() || !editId) return;
    const m: Milestone = {
      id: editId,
      title: draft.title.trim(),
      category: (draft.category as MilestoneCategory) ?? 'regulatory',
      targetDate: draft.targetDate ?? '',
      completedDate: draft.completedDate ?? '',
      status: (draft.status as MilestoneStatus) ?? 'upcoming',
      owner: draft.owner ?? '',
      critical: draft.critical ?? false,
      notes: draft.notes ?? '',
    };
    update({ ...state, milestones: milestones.map(ms => ms.id === editId ? m : ms) });
    setEditId(null);
  }

  function deleteMilestone(id: string) {
    update({ ...state, milestones: milestones.filter(m => m.id !== id) });
    if (editId === id) setEditId(null);
  }

  const editingMilestone = editId ? milestones.find(m => m.id === editId) : null;

  return (
    <div>
      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap',
        marginBottom: 20, padding: '14px 18px',
        background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2,
      }}>
        {[
          { label: 'Total', value: milestones.length, color: GANTT_ACCENT },
          { label: 'Complete', value: complete, color: '#52E8B4' },
          { label: 'On Track', value: onTrack, color: '#52E8B4' },
          { label: 'Delayed', value: delayed, color: '#E87252' },
          { label: 'Critical', value: critical, color: '#E87252' },
        ].map(stat => (
          <div key={stat.label}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 3 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ marginBottom: 20 }}>
          <MilestoneForm
            initial={{ category: 'regulatory', status: 'upcoming', critical: false }}
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            saveLabel="Add Milestone"
          />
        </div>
      )}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            marginBottom: 20, padding: '8px 20px', borderRadius: 2,
            background: GANTT_ACCENT, color: '#0d1622', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}
        >+ Add Milestone</button>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setFilterCat('all')}
          style={{
            padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
            background: filterCat === 'all' ? 'rgba(82,192,232,0.15)' : 'var(--surface-2)',
            color: filterCat === 'all' ? GANTT_ACCENT : 'var(--text-3)',
            border: filterCat === 'all' ? `1px solid ${GANTT_ACCENT}55` : '1px solid var(--line)',
            fontFamily: 'var(--mono)', fontSize: 9, fontWeight: filterCat === 'all' ? 700 : 400,
            textTransform: 'uppercase', letterSpacing: '0.09em',
            transition: 'all 0.13s',
          }}
        >All</button>
        {ALL_CATEGORIES.map(cat => {
          const active = filterCat === cat;
          const color = CATEGORY_COLORS[cat];
          const resolvedColor = color.startsWith('var(') ? 'var(--text-3)' : color;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                background: active ? `${resolvedColor}22` : 'var(--surface-2)',
                color: active ? resolvedColor : 'var(--text-3)',
                border: active ? `1px solid ${resolvedColor}55` : '1px solid var(--line)',
                fontFamily: 'var(--mono)', fontSize: 9, fontWeight: active ? 700 : 400,
                textTransform: 'uppercase', letterSpacing: '0.09em',
                transition: 'all 0.13s',
              } as React.CSSProperties}
            >{CATEGORY_LABELS[cat]}</button>
          );
        })}
      </div>

      {/* Milestone table */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          border: '1px dashed var(--line)', borderRadius: 2,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            {milestones.length === 0 ? 'No milestones yet' : 'No milestones in this category'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '24px 1fr 110px 100px 100px 60px 80px',
            gap: 8, padding: '6px 12px',
            borderBottom: '1px solid var(--line)',
          }}>
            {['', 'Title', 'Category', 'Target', 'Owner', 'Critical', 'Actions'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{h}</div>
            ))}
          </div>

          {filtered.map(m => {
            const meta = STATUS_META[m.status];
            const catColor = CATEGORY_COLORS[m.category];
            const resolvedCatColor = catColor.startsWith('var(') ? 'var(--text-3)' : catColor;
            const isEditing = editId === m.id;

            return (
              <div key={m.id}>
                {/* Row */}
                <div
                  onClick={() => setEditId(isEditing ? null : m.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 110px 100px 100px 60px 80px',
                    gap: 8, padding: '8px 12px',
                    background: isEditing ? 'var(--surface-2)' : 'var(--surface-1)',
                    border: isEditing ? `1px solid ${GANTT_ACCENT}33` : '1px solid transparent',
                    borderRadius: 2, cursor: 'pointer',
                    transition: 'background 0.13s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'; }}
                >
                  {/* Status dot */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, boxShadow: `0 0 4px ${meta.color}88` }} />
                  </div>

                  {/* Title */}
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </div>
                    {m.notes && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                        {m.notes.length > 50 ? m.notes.slice(0, 50) + '…' : m.notes}
                      </div>
                    )}
                  </div>

                  {/* Category badge */}
                  <div>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.09em',
                      color: resolvedCatColor,
                      background: `${resolvedCatColor}18`,
                      border: `1px solid ${resolvedCatColor}33`,
                      padding: '2px 7px', borderRadius: 2,
                      whiteSpace: 'nowrap',
                    }}>{CATEGORY_LABELS[m.category]}</span>
                  </div>

                  {/* Target date */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                    {m.targetDate ? fmtDate(m.targetDate) : '—'}
                  </div>

                  {/* Owner */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.owner || '—'}
                  </div>

                  {/* Critical */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.critical && (
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                        color: '#E87252', background: 'rgba(232,114,82,0.12)',
                        border: '1px solid rgba(232,114,82,0.30)',
                        padding: '1px 5px', borderRadius: 2,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>!</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setEditId(isEditing ? null : m.id)}
                      style={{
                        background: 'none', border: `1px solid var(--line)`, borderRadius: 2, cursor: 'pointer',
                        color: 'var(--text-3)', fontSize: 10, padding: '3px 7px',
                        fontFamily: 'var(--mono)', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}
                    >{isEditing ? 'Done' : 'Edit'}</button>
                    <button
                      onClick={() => deleteMilestone(m.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-4)', fontSize: 15, padding: '0 4px', lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && editingMilestone && (
                  <div style={{ padding: '0 0 12px 0' }}>
                    <MilestoneForm
                      initial={{ ...editingMilestone }}
                      onSave={handleEdit}
                      onCancel={() => setEditId(null)}
                      saveLabel="Save Changes"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

type GanttInnerTab = 'gantt' | 'list';

const INNER_TABS: Array<{ key: GanttInnerTab; label: string }> = [
  { key: 'gantt', label: 'Gantt' },
  { key: 'list',  label: 'List' },
];

export function GanttTab({ state, update }: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const [innerTab, setInnerTab] = useState<GanttInnerTab>('gantt');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Inner tab bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--line)',
        marginBottom: 24,
        flexShrink: 0,
      }}>
        {INNER_TABS.map(tab => {
          const isActive = innerTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setInnerTab(tab.key)}
              style={{
                padding: '10px 20px', borderRadius: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${GANTT_ACCENT}` : '2px solid transparent',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? GANTT_ACCENT : 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="bd-tab-in">
        {innerTab === 'gantt' && (
          <GanttView
            state={state}
            update={update}
            onSwitchToList={() => setInnerTab('list')}
          />
        )}
        {innerTab === 'list' && (
          <ListView
            state={state}
            update={update}
          />
        )}
      </div>
    </div>
  );
}
