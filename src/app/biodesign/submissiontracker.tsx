'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  BiodesignState,
  SubmissionRecord,
  SubmissionCorrespondence,
  SubmissionType,
  SubmissionStatus,
  CorrespondenceType,
} from './data';
import { FlowCanvas } from './flowbg';

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function today() { return new Date().toISOString().slice(0, 10); }

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<SubmissionType, { label: string; color: string; clockDays: number | null; desc: string }> = {
  '510k':           { label: '510(k)',         color: '#52C0E8', clockDays: 90,  desc: 'Premarket Notification — substantial equivalence' },
  'pma':            { label: 'PMA',            color: '#E87252', clockDays: 180, desc: 'Premarket Approval — Class III devices' },
  'denovo':         { label: 'De Novo',        color: '#A07EE8', clockDays: 150, desc: 'De Novo Classification Request' },
  'ide':            { label: 'IDE',            color: '#E8A852', clockDays: 30,  desc: 'Investigational Device Exemption' },
  'ide-supplement': { label: 'IDE Supplement', color: '#E8A852', clockDays: 30,  desc: 'IDE Supplement for protocol changes' },
  'pma-supplement': { label: 'PMA Supplement', color: '#E87252', clockDays: 180, desc: 'PMA Supplement for device changes' },
  'q-sub':          { label: 'Q-Submission',   color: '#52E8B4', clockDays: 70,  desc: 'Q-Sub meeting request or written feedback' },
  'breakthrough':   { label: 'Breakthrough',   color: '#52E8B4', clockDays: 60,  desc: 'Breakthrough Device Designation request' },
  'other':          { label: 'Other',          color: 'var(--text-3)', clockDays: null, desc: 'Other FDA submission' },
};

const STATUS_META: Record<SubmissionStatus, { label: string; color: string; step: number }> = {
  'preparing':    { label: 'Preparing',    color: 'var(--text-3)', step: 0 },
  'submitted':    { label: 'Submitted',    color: '#52C0E8',       step: 1 },
  'accepted':     { label: 'Accepted',     color: '#52C0E8',       step: 2 },
  'under-review': { label: 'Under Review', color: '#A07EE8',       step: 3 },
  'ai-request':   { label: 'AI Request',   color: '#E8A852',       step: 3 },
  'ai-response':  { label: 'AI Responded', color: '#E8A852',       step: 3 },
  'cleared':      { label: 'Cleared',      color: '#52E8B4',       step: 4 },
  'approved':     { label: 'Approved',     color: '#52E8B4',       step: 4 },
  'not-cleared':  { label: 'Not Cleared',  color: '#E87252',       step: 4 },
  'withdrawn':    { label: 'Withdrawn',    color: 'var(--text-4)', step: 4 },
};

const CORR_META: Record<CorrespondenceType, { label: string; color: string }> = {
  'submission':  { label: 'Submission Filed', color: '#52C0E8' },
  'fda-letter':  { label: 'FDA Letter',       color: '#A07EE8' },
  'ai-request':  { label: 'AI Request',       color: '#E8A852' },
  'ai-response': { label: 'AI Response',      color: '#52E8B4' },
  'meeting':     { label: 'Meeting',          color: '#E87252' },
  'phone-call':  { label: 'Phone Call',       color: '#E87252' },
  'other':       { label: 'Other',            color: 'var(--text-3)' },
};

const STATUS_ORDER: SubmissionStatus[] = [
  'preparing', 'submitted', 'accepted', 'under-review', 'ai-request',
  'ai-response', 'cleared', 'approved', 'not-cleared', 'withdrawn',
];

const MDUFA_CONTEXT: Partial<Record<SubmissionType, { goal: string; rate: string; note: string }>> = {
  '510k':    { goal: '90% cleared within 90 days', rate: '88%', note: 'As of Q1 2025, FDA is meeting 510(k) goals at 88% rate' },
  'pma':     { goal: '90% approved within 180 days', rate: '92%', note: 'PMA MDUFA V goal: 180-day substantive review' },
  'denovo':  { goal: '90% decisions within 150 days', rate: '85%', note: 'De Novo pathway; FDA targeting 150-day decisions' },
  'ide':     { goal: '30-day review', rate: '95%', note: 'FDA must act within 30 days of IDE receipt' },
  'ide-supplement': { goal: '30-day review', rate: '95%', note: 'IDE Supplement: 30-day MDUFA clock' },
  'pma-supplement': { goal: '180-day review', rate: '90%', note: 'PMA Supplement: 180-day MDUFA goal' },
  'q-sub':   { goal: '70 days to meeting from acknowledgment', rate: '90%', note: 'Q-Sub: FDA goal is 70 days from acknowledgment to meeting' },
  'breakthrough': { goal: '60-day designation decision', rate: '93%', note: 'Breakthrough Device: FDA aims to respond within 60 days' },
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--line)',
  borderRadius: 2,
  padding: '8px 11px',
  color: 'var(--text)',
  fontSize: 13,
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

// ── Badge components ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: SubmissionType }) {
  const meta = TYPE_META[type];
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: meta.color, background: `${meta.color}18`,
      border: `1px solid ${meta.color}44`,
      padding: '2px 7px', borderRadius: 2, whiteSpace: 'nowrap',
    }}>{meta.label}</span>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.09em',
      color: meta.color, background: `${meta.color}14`,
      border: `1px solid ${meta.color}33`,
      padding: '2px 7px', borderRadius: 2, whiteSpace: 'nowrap',
    }}>{meta.label}</span>
  );
}

// ── Review Clock Widget (compact, for list view) ──────────────────────────────

function ReviewClockWidget({ sub }: { sub: SubmissionRecord }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!sub.clockStartDate) return null;

  const elapsed = daysSince(sub.clockStartDate);
  const goal = sub.clockDaysGoal ?? TYPE_META[sub.type].clockDays;
  if (!goal) return null;

  const pct = Math.min(elapsed / goal, 1);
  const pctDisplay = Math.round(pct * 100);
  const barColor = pct > 0.9 ? '#E87252' : pct > 0.7 ? '#E8A852' : '#52E8B4';
  const tollCount = sub.correspondence.filter(c => c.clockTolled).length;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: barColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Day {elapsed} of {goal} — MDUFA Clock
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{pctDisplay}%</span>
      </div>
      <div style={{ height: 3, background: 'var(--line)', borderRadius: 1, overflow: 'hidden' }}>
        <div
          ref={barRef}
          style={{
            height: '100%',
            width: mounted ? `${pctDisplay}%` : '0%',
            background: `linear-gradient(to right, ${barColor}99, ${barColor})`,
            borderRadius: 1,
            transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      {tollCount > 0 && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#E8A852', marginTop: 4 }}>
          Clock tolled {tollCount} time{tollCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ── List View Hero ─────────────────────────────────────────────────────────────

function ListHero({ submissions }: { submissions: SubmissionRecord[] }) {
  const ACTIVE_STATUSES: SubmissionStatus[] = ['submitted', 'accepted', 'under-review', 'ai-request', 'ai-response'];
  const total = submissions.length;
  const active = submissions.filter(s => ACTIVE_STATUSES.includes(s.status)).length;
  const cleared = submissions.filter(s => s.status === 'cleared' || s.status === 'approved').length;
  const pendingAI = submissions.reduce((n, s) => n + s.aiRequestCount, 0);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 28, minHeight: 168 }}>
      <FlowCanvas accent="#52C0E8" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px' }}>
        <div style={{ ...monoLabel, color: '#52C0E8', fontSize: 9, marginBottom: 10 }}>04 / Comply — FDA Submissions</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
          Submission Tracker
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 480 }}>
          Track every FDA submission, review clock, and correspondence in one place.
        </p>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Submissions', value: total, color: '#52C0E8' },
            { label: 'Active Reviews',    value: active, color: '#A07EE8' },
            { label: 'Cleared / Approved', value: cleared, color: '#52E8B4' },
            { label: 'Pending AI Requests', value: pendingAI, color: '#E8A852' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: `${stat.color}66`, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (sub: SubmissionRecord) => void;
}) {
  const [draftType, setDraftType] = useState<SubmissionType>('510k');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNumber, setDraftNumber] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftNotes, setDraftNotes] = useState('');

  function handleCreate() {
    if (!draftTitle.trim()) return;
    const meta = TYPE_META[draftType];
    const sub: SubmissionRecord = {
      id: uid(),
      type: draftType,
      title: draftTitle.trim(),
      status: draftDate ? 'submitted' : 'preparing',
      submissionNumber: draftNumber.trim(),
      submittedDate: draftDate,
      acceptedDate: '',
      clockStartDate: '',
      targetDecisionDate: '',
      actualDecisionDate: '',
      clockDaysGoal: meta.clockDays,
      aiRequestCount: 0,
      correspondence: [],
      notes: draftNotes.trim(),
    };
    onCreate(sub);
  }

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid rgba(82,192,232,0.25)',
      borderRadius: 2, padding: 24, marginTop: 12,
    }}>
      <div style={{ ...monoLabel, color: '#52C0E8', fontSize: 10, marginBottom: 18 }}>New Submission</div>

      {/* Type grid */}
      <div style={{ marginBottom: 18 }}>
        <div style={monoLabel}>Submission Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {(Object.keys(TYPE_META) as SubmissionType[]).map(type => {
            const meta = TYPE_META[type];
            const active = draftType === type;
            return (
              <div
                key={type}
                onClick={() => setDraftType(type)}
                style={{
                  padding: '10px 14px', borderRadius: 2, cursor: 'pointer',
                  background: active ? `${meta.color}0d` : 'var(--surface-2)',
                  border: active ? `1px solid ${meta.color}55` : '1px solid var(--line)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  color: active ? meta.color : 'var(--text-2)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3,
                }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{meta.desc}</div>
                {meta.clockDays !== null && (
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
                    marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.09em',
                  }}>MDUFA: {meta.clockDays}d</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <div style={monoLabel}>Submission Title</div>
        <input
          value={draftTitle}
          onChange={e => setDraftTitle(e.target.value)}
          placeholder="e.g., CardioSense 510(k) — Initial Submission"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={monoLabel}>Submission Number (optional)</div>
          <input
            value={draftNumber}
            onChange={e => setDraftNumber(e.target.value)}
            placeholder="e.g., K240001"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={monoLabel}>Submitted Date</div>
          <input
            type="date"
            value={draftDate}
            onChange={e => setDraftDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={monoLabel}>Notes</div>
        <textarea
          value={draftNotes}
          onChange={e => setDraftNotes(e.target.value)}
          placeholder="Context, strategy notes, predicate numbers..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleCreate}
          disabled={!draftTitle.trim()}
          style={{
            padding: '9px 24px', borderRadius: 2,
            background: draftTitle.trim() ? '#52C0E8' : 'var(--surface-2)',
            color: draftTitle.trim() ? '#fff' : 'var(--text-4)',
            border: 'none', cursor: draftTitle.trim() ? 'pointer' : 'default',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}
        >Create Submission →</button>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 18px', borderRadius: 2,
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

// ── List View ──────────────────────────────────────────────────────────────────

function ListView({
  state,
  update,
  onSelect,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  onSelect: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const submissions = state.submissions ?? [];

  function handleCreate(sub: SubmissionRecord) {
    update({ ...state, submissions: [...submissions, sub] });
    setCreating(false);
    onSelect(sub.id);
  }

  return (
    <div>
      <ListHero submissions={submissions} />

      {/* Empty state */}
      {submissions.length === 0 && !creating && (
        <div style={{
          textAlign: 'center', padding: '52px 24px',
          border: '1px dashed var(--line)', borderRadius: 2, marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
            No submissions yet
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.7 }}>
            Track 510(k), PMA, IDE, De Novo, and Q-Sub submissions along with their MDUFA review clocks and correspondence.
          </p>
          <button
            onClick={() => setCreating(true)}
            style={{
              padding: '9px 24px', borderRadius: 2,
              background: '#52C0E8', color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}
          >Add First Submission</button>
        </div>
      )}

      {/* Submission cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {submissions.map(sub => {
          const typeMeta = TYPE_META[sub.type];
          const statusMeta = STATUS_META[sub.status];
          const hasAI = sub.aiRequestCount > 0;
          return (
            <div
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderLeft: `4px solid ${typeMeta.color}`,
                borderRadius: 2,
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-1)')}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <TypeBadge type={sub.type} />
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                  color: sub.submissionNumber ? '#E87252' : 'var(--text-4)',
                }}>
                  {sub.submissionNumber || 'No number yet'}
                </span>
                <StatusBadge status={sub.status} />
                {hasAI && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                    color: '#E8A852', background: 'rgba(232,168,82,0.12)',
                    border: '1px solid rgba(232,168,82,0.3)',
                    padding: '2px 7px', borderRadius: 2,
                  }}>{sub.aiRequestCount} AI Request{sub.aiRequestCount !== 1 ? 's' : ''}</span>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1, minWidth: 160 }}>{sub.title}</span>
              </div>

              {/* Date row */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: sub.clockStartDate ? 0 : 0 }}>
                {sub.submittedDate && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                    Submitted: {fmtDate(sub.submittedDate)}
                  </span>
                )}
                {sub.acceptedDate && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                    Accepted: {fmtDate(sub.acceptedDate)}
                  </span>
                )}
                {sub.targetDecisionDate && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                    Target: {fmtDate(sub.targetDecisionDate)}
                  </span>
                )}
              </div>

              {/* Clock widget */}
              <ReviewClockWidget sub={sub} />
            </div>
          );
        })}
      </div>

      {!creating && submissions.length > 0 && (
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: '8px 20px', borderRadius: 2,
            background: 'transparent', color: '#52C0E8',
            border: '1px solid rgba(82,192,232,0.4)', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}
        >+ New Submission</button>
      )}

      {creating && (
        <CreateForm
          onCancel={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ── Review Clock Panel (full, detail view) ────────────────────────────────────

const CLOCK_STEPS = [
  { key: 'submitted',  label: 'Submitted',   step: 1 },
  { key: 'accepted',   label: 'Accepted',    step: 2 },
  { key: 'review',     label: 'Under Review', step: 3 },
  { key: 'decision',   label: 'Decision',    step: 4 },
];

function ReviewClockPanel({
  sub,
  onPatch,
}: {
  sub: SubmissionRecord;
  onPatch: (patch: Partial<SubmissionRecord>) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [sub.id]);

  const goal = sub.clockDaysGoal ?? TYPE_META[sub.type].clockDays;
  const elapsed = sub.clockStartDate ? daysSince(sub.clockStartDate) : null;
  const pct = (goal && elapsed !== null) ? Math.min(elapsed / goal, 1) : 0;
  const pctDisplay = Math.round(pct * 100);
  const barColor = pct > 0.9 ? '#E87252' : pct > 0.7 ? '#E8A852' : '#52E8B4';
  const remaining = (goal && elapsed !== null) ? goal - elapsed : null;
  const isOverdue = remaining !== null && remaining < 0;

  const currentStep = STATUS_META[sub.status].step;

  const stepDates: Record<string, string> = {
    submitted: sub.submittedDate,
    accepted:  sub.acceptedDate,
    review:    sub.clockStartDate,
    decision:  sub.actualDecisionDate || sub.targetDecisionDate,
  };

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--line)',
      borderRadius: 2, padding: 24, marginBottom: 20,
    }}>
      <div style={{ ...monoLabel, color: '#52C0E8', marginBottom: 20 }}>MDUFA Review Clock</div>

      {/* 4-step progress track */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 28, overflowX: 'auto' }}>
        {CLOCK_STEPS.map((step, i) => {
          const isPast = currentStep > step.step;
          const isCurrent = currentStep === step.step && sub.status !== 'preparing';
          const dotColor = isPast ? '#52E8B4' : isCurrent ? '#52C0E8' : 'var(--surface-2)';
          const dateStr = fmtDate(stepDates[step.key] ?? '');
          return (
            <React.Fragment key={step.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 80 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: dotColor,
                  border: `2px solid ${isPast ? '#52E8B4' : isCurrent ? '#52C0E8' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 2,
                  boxShadow: isCurrent ? '0 0 14px rgba(82,192,232,0.6)' : isPast ? '0 0 8px rgba(82,232,180,0.3)' : 'none',
                  animation: isCurrent ? 'st-pulse 2.2s ease-in-out infinite' : 'none',
                }}>
                  {isPast && <span style={{ color: '#0d1622', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  {isCurrent && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', padding: '0 2px' }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: isPast ? '#52E8B4' : isCurrent ? '#52C0E8' : 'var(--text-4)',
                    marginBottom: 3,
                  }}>{step.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{dateStr}</div>
                </div>
              </div>
              {i < CLOCK_STEPS.length - 1 && (
                <div style={{
                  height: 2, flex: 0.3, alignSelf: 'flex-start', marginTop: 13,
                  background: isPast ? '#52E8B4' : 'var(--line)',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Center clock display */}
      {goal && elapsed !== null && (
        <div style={{
          textAlign: 'center', marginBottom: 20,
          padding: '20px', background: 'var(--surface-2)', borderRadius: 2,
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 48, fontWeight: 700, lineHeight: 1,
            color: isOverdue ? '#E87252' : barColor,
            marginBottom: 6,
          }}>
            {elapsed}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Day {elapsed} of {goal} MDUFA goal
          </div>
          {isOverdue ? (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#E87252', marginTop: 6, fontWeight: 700 }}>
              {Math.abs(remaining!)} days past MDUFA goal
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              {remaining} days remaining
            </div>
          )}
        </div>
      )}

      {/* Clock bar */}
      {goal && elapsed !== null && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 6, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              ref={barRef}
              style={{
                height: '100%',
                width: mounted ? `${pctDisplay}%` : '0%',
                background: `linear-gradient(to right, ${barColor}88, ${barColor})`,
                borderRadius: 2,
                transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>Day 0</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: barColor }}>{pctDisplay}% used</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>Day {goal}</span>
          </div>
        </div>
      )}

      {/* Date edit fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {[
          { label: 'Submitted Date',       field: 'submittedDate' as const,      value: sub.submittedDate },
          { label: 'Accepted Date',        field: 'acceptedDate' as const,       value: sub.acceptedDate },
          { label: 'Clock Start Date',     field: 'clockStartDate' as const,     value: sub.clockStartDate },
          { label: 'Target Decision Date', field: 'targetDecisionDate' as const, value: sub.targetDecisionDate },
          { label: 'Actual Decision Date', field: 'actualDecisionDate' as const, value: sub.actualDecisionDate },
          { label: 'MDUFA Days Goal',      field: null,                           value: String(sub.clockDaysGoal ?? '') },
        ].map(({ label, field, value }) => (
          <div key={label}>
            <div style={monoLabel}>{label}</div>
            {field ? (
              <input
                type="date"
                value={value}
                onChange={e => onPatch({ [field]: e.target.value })}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            ) : (
              <input
                type="number"
                value={value}
                onChange={e => onPatch({ clockDaysGoal: e.target.value ? parseInt(e.target.value) : null })}
                placeholder={String(TYPE_META[sub.type].clockDays ?? '')}
                style={inputStyle}
              />
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes st-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(82,192,232,0.5); }
          50%       { box-shadow: 0 0 22px rgba(82,192,232,0.9); }
        }
      `}</style>
    </div>
  );
}

// ── AI Request Counter ─────────────────────────────────────────────────────────

function AIRequestPanel({ sub, onPatch }: { sub: SubmissionRecord; onPatch: (patch: Partial<SubmissionRecord>) => void }) {
  const goal = sub.clockDaysGoal ?? TYPE_META[sub.type].clockDays;
  const elapsed = sub.clockStartDate ? daysSince(sub.clockStartDate) : null;
  const remaining = (goal && elapsed !== null) ? goal - elapsed : null;

  return (
    <div style={{
      background: 'rgba(232,168,82,0.07)',
      border: '1px solid rgba(232,168,82,0.25)',
      borderRadius: 2, padding: 20, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#E8A852', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
            Additional Information (AI) Requests
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, color: '#E8A852', lineHeight: 1 }}>
            {sub.aiRequestCount}
            <span style={{ fontSize: 14, color: 'rgba(232,168,82,0.5)', fontWeight: 400, marginLeft: 6 }}>request{sub.aiRequestCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onPatch({ aiRequestCount: Math.max(0, sub.aiRequestCount - 1) })}
            disabled={sub.aiRequestCount === 0}
            style={{
              width: 36, height: 36, borderRadius: 2, border: '1px solid rgba(232,168,82,0.35)',
              background: 'transparent', color: sub.aiRequestCount === 0 ? 'var(--text-4)' : '#E8A852',
              cursor: sub.aiRequestCount === 0 ? 'default' : 'pointer',
              fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, lineHeight: 1,
            }}
          >−</button>
          <button
            onClick={() => onPatch({ aiRequestCount: sub.aiRequestCount + 1 })}
            style={{
              width: 36, height: 36, borderRadius: 2, border: '1px solid rgba(232,168,82,0.35)',
              background: 'rgba(232,168,82,0.10)', color: '#E8A852',
              cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, lineHeight: 1,
            }}
          >+</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7, marginBottom: remaining !== null ? 8 : 0 }}>
        AI requests toll the MDUFA clock. The clock stops when FDA sends a request and resumes when FDA receives the response.
      </div>
      {remaining !== null && remaining > 0 && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#E8A852', marginTop: 4 }}>
          FDA has {remaining} days remaining on the current review clock.
        </div>
      )}
    </div>
  );
}

// ── Correspondence Log ─────────────────────────────────────────────────────────

function CorrespondenceLog({
  sub,
  onPatch,
}: {
  sub: SubmissionRecord;
  onPatch: (patch: Partial<SubmissionRecord>) => void;
}) {
  const [addingForm, setAddingForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState(today());
  const [draftType, setDraftType] = useState<CorrespondenceType>('fda-letter');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftTolled, setDraftTolled] = useState(false);

  const sorted = [...sub.correspondence].sort((a, b) => b.date.localeCompare(a.date));

  function addCorrespondence() {
    if (!draftSubject.trim()) return;
    const entry: SubmissionCorrespondence = {
      id: uid(),
      date: draftDate,
      type: draftType,
      subject: draftSubject.trim(),
      notes: draftNotes.trim(),
      clockTolled: draftTolled,
    };
    onPatch({ correspondence: [...sub.correspondence, entry] });
    setDraftSubject('');
    setDraftNotes('');
    setDraftTolled(false);
    setDraftDate(today());
    setDraftType('fda-letter');
    setAddingForm(false);
  }

  function removeCorrespondence(id: string) {
    onPatch({ correspondence: sub.correspondence.filter(c => c.id !== id) });
  }

  return (
    <div>
      <div style={{ ...monoLabel, color: '#52C0E8', marginBottom: 16 }}>Correspondence Log</div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        {sorted.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '28px 16px',
            border: '1px dashed var(--line)', borderRadius: 2,
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>
            No correspondence entries yet
          </div>
        )}
        {sorted.length > 0 && (
          <div style={{
            borderLeft: '1px solid var(--line)',
            marginLeft: 60, paddingLeft: 20,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {sorted.map(entry => {
              const meta = CORR_META[entry.type];
              const isExpanded = expandedId === entry.id;
              return (
                <div key={entry.id} style={{ position: 'relative', paddingBottom: 12 }}>
                  {/* Date in left margin */}
                  <div style={{
                    position: 'absolute', left: -82, top: 4, width: 60,
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
                    textAlign: 'right', lineHeight: 1.4,
                  }}>
                    {fmtDate(entry.date).replace(',', '\n')}
                  </div>
                  {/* Dot on timeline */}
                  <div style={{
                    position: 'absolute', left: -26, top: 6,
                    width: 10, height: 10, borderRadius: '50%',
                    background: meta.color,
                    boxShadow: `0 0 6px ${meta.color}66`,
                  }} />
                  {/* Entry card */}
                  <div style={{
                    background: 'var(--surface-1)', border: '1px solid var(--line)',
                    borderRadius: 2, padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: meta.color, background: `${meta.color}14`,
                        border: `1px solid ${meta.color}33`,
                        padding: '1px 5px', borderRadius: 2,
                      }}>{meta.label}</span>
                      {entry.clockTolled && (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                          color: '#E8A852', background: 'rgba(232,168,82,0.10)',
                          border: '1px solid rgba(232,168,82,0.25)',
                          padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.09em',
                        }}>Clock Tolled</span>
                      )}
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{entry.subject}</span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
                          padding: '2px 4px',
                        }}
                      >{isExpanded ? '▲' : '▼'}</button>
                      <button
                        onClick={() => removeCorrespondence(entry.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-4)', fontSize: 14, padding: '0 4px', lineHeight: 1,
                        }}
                      >×</button>
                    </div>
                    {isExpanded && entry.notes && (
                      <div style={{
                        marginTop: 8, fontSize: 12, color: 'var(--text-3)',
                        lineHeight: 1.7, paddingTop: 8, borderTop: '1px solid var(--line)',
                      }}>{entry.notes}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add form */}
      {!addingForm && (
        <button
          onClick={() => setAddingForm(true)}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 2,
            background: 'transparent', color: 'var(--text-3)',
            border: '1px dashed var(--line)', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}
        >+ Add Correspondence</button>
      )}

      {addingForm && (
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--line-strong)',
          borderRadius: 2, padding: 18,
        }}>
          <div style={{ ...monoLabel, color: '#52C0E8', fontSize: 10, marginBottom: 14 }}>New Entry</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={monoLabel}>Date</div>
              <input
                type="date"
                value={draftDate}
                onChange={e => setDraftDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
            <div>
              <div style={monoLabel}>Type</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(Object.keys(CORR_META) as CorrespondenceType[]).map(ct => {
                  const m = CORR_META[ct];
                  const active = draftType === ct;
                  return (
                    <button
                      key={ct}
                      onClick={() => setDraftType(ct)}
                      style={{
                        padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
                        background: active ? `${m.color}14` : 'transparent',
                        border: `1px solid ${active ? m.color + '55' : 'var(--line)'}`,
                        fontFamily: 'var(--mono)', fontSize: 8,
                        color: active ? m.color : 'var(--text-4)',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        transition: 'all 0.12s',
                      }}
                    >{m.label}</button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={monoLabel}>Subject</div>
            <input
              value={draftSubject}
              onChange={e => setDraftSubject(e.target.value)}
              placeholder="e.g., Acceptance Review Letter, AI Request #1"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={monoLabel}>Notes</div>
            <textarea
              value={draftNotes}
              onChange={e => setDraftNotes(e.target.value)}
              placeholder="Key points, action items, deadlines..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10,
              color: draftTolled ? '#E8A852' : 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              <input
                type="checkbox"
                checked={draftTolled}
                onChange={e => setDraftTolled(e.target.checked)}
                style={{ accentColor: '#E8A852', width: 14, height: 14 }}
              />
              Clock Tolled (AI request stops the MDUFA clock)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addCorrespondence}
              disabled={!draftSubject.trim()}
              style={{
                padding: '8px 18px', borderRadius: 2,
                background: draftSubject.trim() ? '#52C0E8' : 'var(--surface-2)',
                color: draftSubject.trim() ? '#fff' : 'var(--text-4)',
                border: 'none', cursor: draftSubject.trim() ? 'pointer' : 'default',
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}
            >Add Entry</button>
            <button
              onClick={() => setAddingForm(false)}
              style={{
                padding: '8px 14px', borderRadius: 2,
                background: 'transparent', color: 'var(--text-3)',
                border: '1px solid var(--line)', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.09em',
              }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MDUFA Context Sidebar ──────────────────────────────────────────────────────

function MDUFASidebar({ type }: { type: SubmissionType }) {
  const ctx = MDUFA_CONTEXT[type];
  const typeMeta = TYPE_META[type];

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--line)',
      borderRadius: 2, padding: 18,
      position: 'sticky', top: 16,
    }}>
      <div style={{
        ...monoLabel, color: typeMeta.color, marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeMeta.color, boxShadow: `0 0 6px ${typeMeta.color}` }} />
        MDUFA V Performance
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
        color: typeMeta.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
      }}>{typeMeta.label} Goals</div>

      {ctx ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>MDUFA Goal</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{ctx.goal}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>FDA Meeting Rate</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: '#52E8B4', lineHeight: 1, marginBottom: 4 }}>{ctx.rate}</div>
          </div>
          <div style={{
            padding: '10px 12px', background: 'var(--surface-2)',
            border: '1px solid var(--line)', borderRadius: 2,
            fontSize: 11, color: 'var(--text-3)', lineHeight: 1.65,
          }}>{ctx.note}</div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
          No specific MDUFA V performance goals defined for {typeMeta.label} submissions. Refer to FDA MDUFA V commitment letter for applicable goals.
        </div>
      )}

      {/* Clock notes */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Clock Notes</div>
        {[
          'AI requests toll (stop) the MDUFA clock',
          'Clock resumes when FDA receives the response',
          'Clock tolling days do not count toward the MDUFA goal',
          'Submission withdrawal terminates the clock',
        ].map((note, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 7 }}>
            <span style={{ color: '#52C0E8', fontSize: 9, flexShrink: 0, marginTop: 2 }}>—</span>
            <span style={{ fontSize: 10, color: 'var(--text-4)', lineHeight: 1.6 }}>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail View ────────────────────────────────────────────────────────────────

function DetailView({
  sub,
  onBack,
  onPatch,
}: {
  sub: SubmissionRecord;
  onBack: () => void;
  onPatch: (patch: Partial<SubmissionRecord>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(sub.title);
  const [editNumber, setEditNumber] = useState(sub.submissionNumber);
  const [editNotes, setEditNotes] = useState(sub.notes);

  const typeMeta = TYPE_META[sub.type];
  const statusMeta = STATUS_META[sub.status];

  function advanceStatus() {
    const idx = STATUS_ORDER.indexOf(sub.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onPatch({ status: next });
  }

  function saveEdit() {
    onPatch({ title: editTitle.trim(), submissionNumber: editNumber.trim(), notes: editNotes.trim() });
    setEditing(false);
  }

  function cancelEdit() {
    setEditTitle(sub.title);
    setEditNumber(sub.submissionNumber);
    setEditNotes(sub.notes);
    setEditing(false);
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          padding: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >← All Submissions</button>

      {/* Header */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderLeft: `4px solid ${typeMeta.color}`,
        borderRadius: 2, padding: '18px 22px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <TypeBadge type={sub.type} />
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                color: sub.submissionNumber ? '#E87252' : 'var(--text-4)',
              }}>
                {editing
                  ? <input value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="Submission number" style={{ ...inputStyle, width: 140, padding: '3px 8px', fontSize: 12 }} />
                  : (sub.submissionNumber || 'No number yet')
                }
              </span>
              <button
                onClick={advanceStatus}
                title="Click to advance status"
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                <StatusBadge status={sub.status} />
              </button>
            </div>
            {editing ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                style={{ ...inputStyle, fontSize: 18, fontWeight: 600, marginBottom: 8 }}
              />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em', marginBottom: 6 }}>{sub.title}</div>
            )}
            {editing && (
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Notes..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', marginTop: 6 }}
              />
            )}
            {!editing && sub.notes && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7, marginTop: 4 }}>{sub.notes}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {editing ? (
              <>
                <button onClick={saveEdit} style={{
                  padding: '7px 16px', borderRadius: 2,
                  background: '#52C0E8', color: '#fff', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>Save</button>
                <button onClick={cancelEdit} style={{
                  padding: '7px 12px', borderRadius: 2,
                  background: 'transparent', color: 'var(--text-3)',
                  border: '1px solid var(--line)', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                }}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} style={{
                padding: '7px 16px', borderRadius: 2,
                background: 'transparent', color: statusMeta.color,
                border: `1px solid ${statusMeta.color}44`, cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>Edit</button>
            )}
          </div>
        </div>
      </div>

      {/* Two-column detail layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 260px',
        gap: 20,
        alignItems: 'flex-start',
      }}>
        {/* Main column */}
        <div style={{ minWidth: 0 }}>
          <ReviewClockPanel sub={sub} onPatch={onPatch} />
          <AIRequestPanel sub={sub} onPatch={onPatch} />
          <CorrespondenceLog sub={sub} onPatch={onPatch} />
        </div>

        {/* Sidebar */}
        <MDUFASidebar type={sub.type} />
      </div>

      {/* Mobile: stack sidebar below main */}
      <style>{`
        @media (max-width: 860px) {
          .st-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export function SubmissionTrackerTab({
  state,
  update,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const submissions = state.submissions ?? [];
  const selectedSub = selectedId ? submissions.find(s => s.id === selectedId) ?? null : null;

  function patchSubmission(id: string, patch: Partial<SubmissionRecord>) {
    update({
      ...state,
      submissions: submissions.map(s => s.id === id ? { ...s, ...patch } : s),
    });
  }

  return (
    <div className="bd-tab-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selectedSub ? (
          <DetailView
            sub={selectedSub}
            onBack={() => setSelectedId(null)}
            onPatch={(patch) => patchSubmission(selectedSub.id, patch)}
          />
        ) : (
          <ListView
            state={state}
            update={update}
            onSelect={setSelectedId}
          />
        )}
      </div>
    </div>
  );
}
