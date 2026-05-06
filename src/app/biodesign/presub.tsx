'use client';
import React, { useState } from 'react';
import {
  BiodesignState, PreSubMeeting, PreSubMeetingType, PreSubStatus,
  PreSubQuestion, PreSubDocument, PreSubQuestionCategory,
  PreSubDocStatus, PATHWAY_META,
} from './data';
import { FlowCanvas } from './flowbg';

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#E87252';

const MEETING_TYPE_META: Record<PreSubMeetingType, { label: string; desc: string; when: string }> = {
  'q-sub':        { label: 'Q-Submission',            desc: 'General pre-submission meeting with FDA', when: 'Anytime during development' },
  'pre-ide':      { label: 'Pre-IDE',                 desc: 'Investigational Device Exemption planning', when: 'Before first-in-human trials' },
  'pre-pma':      { label: 'Pre-PMA',                 desc: 'Pre-market approval pathway strategy', when: '12–18 months before PMA submission' },
  'pre-510k':     { label: 'Pre-510(k)',               desc: 'Substantial equivalence strategy review', when: '6–12 months before 510(k) submission' },
  'de-novo-pre':  { label: 'De Novo Pre-Sub',         desc: 'De Novo classification request strategy', when: 'Early — before De Novo submission' },
  'breakthrough': { label: 'Breakthrough',            desc: 'Breakthrough Device designation strategy', when: 'Early development; designation can be obtained anytime' },
  'study-risk':   { label: 'Study Risk Determination',desc: 'FDA assessment of significant/non-significant risk', when: 'Before clinical study enrollment' },
  'sap-review':   { label: 'SAP Review',              desc: 'Statistical Analysis Plan review', when: 'Before study lock' },
};

const STATUS_META: Record<PreSubStatus, { label: string; color: string }> = {
  'planning':         { label: 'Planning',          color: 'var(--text-3)' },
  'drafting':         { label: 'Drafting Package',  color: '#E8A852' },
  'submitted':        { label: 'Submitted',         color: '#52C0E8' },
  'acknowledged':     { label: 'Acknowledged',      color: '#A07EE8' },
  'scheduled':        { label: 'Meeting Scheduled', color: '#A07EE8' },
  'meeting-held':     { label: 'Meeting Held',      color: '#52E8B4' },
  'written-response': { label: 'Response Received', color: '#52E8B4' },
};

const DOC_STATUS_META: Record<PreSubDocStatus, { label: string; color: string; bg: string }> = {
  'not-started': { label: 'Not Started', color: 'var(--text-4)', bg: 'rgba(120,120,120,0.10)' },
  'in-progress': { label: 'In Progress', color: '#E8A852',       bg: 'rgba(232,168,82,0.12)'  },
  'complete':    { label: 'Complete',    color: '#52E8B4',       bg: 'rgba(82,232,180,0.12)'  },
  'na':          { label: 'N/A',         color: 'var(--text-4)', bg: 'rgba(120,120,120,0.08)' },
};

const Q_STATUS_META: Record<'draft' | 'final' | 'answered', { label: string; color: string }> = {
  draft:    { label: 'Draft',    color: 'var(--text-3)' },
  final:    { label: 'Final',    color: '#52C0E8' },
  answered: { label: 'Answered', color: '#52E8B4' },
};

const Q_CAT_META: Record<PreSubQuestionCategory, { label: string; color: string }> = {
  regulatory:    { label: 'Regulatory',    color: ACCENT },
  clinical:      { label: 'Clinical',      color: '#52C0E8' },
  technical:     { label: 'Technical',     color: '#A07EE8' },
  manufacturing: { label: 'Manufacturing', color: '#E8A852' },
  labeling:      { label: 'Labeling',      color: '#52E8B4' },
};

// FDA MDUFA V performance goals (calendar days from submission)
const MDUFA_TIMELINE = [
  { key: 'submitted',        label: 'Package Submitted',  fdaDays: 0,   desc: 'Q-Sub package sent to FDA' },
  { key: 'acknowledged',     label: 'FDA Acknowledgment', fdaDays: 14,  desc: 'FDA acknowledges receipt (14 calendar days)' },
  { key: 'scheduled',        label: 'Meeting Scheduled',  fdaDays: 50,  desc: 'Meeting confirmed on FDA calendar' },
  { key: 'meeting-held',     label: 'Meeting Held',       fdaDays: 70,  desc: 'FDA goal: meeting within 70 days of ack' },
  { key: 'written-response', label: 'Written Response',   fdaDays: 100, desc: 'FDA goal: written feedback 30 days post-meeting' },
];

// ── Default document templates ────────────────────────────────────────────────

function getDefaultDocuments(type: PreSubMeetingType): PreSubDocument[] {
  const base: Array<[string, boolean, string]> = [
    ['Cover Letter', true, 'cover'],
    ['Device Description', true, 'device'],
    ['Intended Use / Indications for Use', true, 'device'],
    ['Regulatory History', false, 'regulatory'],
    ['Device Classification', true, 'regulatory'],
    ['Specific Questions List', true, 'questions'],
  ];
  const extras: Record<PreSubMeetingType, Array<[string, boolean, string]>> = {
    'pre-510k':    [['Predicate Device Comparison Table', true, 'regulatory'], ['Performance Testing Summary', false, 'testing']],
    'pre-pma':     [['Clinical Protocol Draft', true, 'clinical'], ['Benefit-Risk Framework', true, 'clinical'], ['Statistical Analysis Plan', false, 'clinical']],
    'pre-ide':     [['Clinical Investigation Plan', true, 'clinical'], ['Risk Analysis Summary', true, 'safety'], ['Investigator Qualifications', false, 'clinical']],
    'de-novo-pre': [['Classification Regulation Rationale', true, 'regulatory'], ['Proposed Special Controls', true, 'regulatory']],
    'breakthrough': [['Breakthrough Criteria Justification', true, 'regulatory'], ['Interactive Review Plan', false, 'regulatory']],
    'study-risk':  [['Study Protocol', true, 'clinical'], ['Risk Categorization Rationale', true, 'safety']],
    'sap-review':  [['Statistical Analysis Plan', true, 'clinical'], ['Study Protocol', true, 'clinical']],
    'q-sub':       [],
  };
  return [...base, ...(extras[type] ?? [])].map(([name, required, section], i) => ({
    id: `doc-${i}`, name, section, required, status: 'not-started' as PreSubDocStatus, notes: '',
  }));
}

// ── Pathway strategy tips ─────────────────────────────────────────────────────

const PATHWAY_TIPS: Record<string, { title: string; tips: string[] }> = {
  '510k': {
    title: '510(k) Strategy',
    tips: [
      'Focus on predicate selection and SE argument — FDA needs to concur with your predicate choice.',
      'Ask about performance testing standards (which standards apply, what pass/fail criteria).',
      'Clarify labeling and intended use — ambiguities here cause most 510(k) deficiencies.',
      'Avoid vague questions. FDA responds best to specific, binary, yes/no-answerable questions.',
    ],
  },
  pma: {
    title: 'PMA Strategy',
    tips: [
      'Focus on clinical trial design and primary endpoints — get FDA concurrence before enrolling.',
      'Discuss benefit-risk framework and what level of evidence FDA expects.',
      'Request FDA concurrence on your Statistical Analysis Plan before study lock.',
      'Ask about modular PMA strategy to reduce overall review time.',
    ],
  },
  denovo: {
    title: 'De Novo Strategy',
    tips: [
      'Clarify proposed classification and risk reasoning — confirm no predicate exists.',
      'Discuss special controls adequacy — FDA will need to see how they mitigate each risk.',
      'Define performance criteria and what testing will demonstrate each special control.',
      'Ask about the De Novo timeline and whether FDA has seen similar devices.',
    ],
  },
  exempt: {
    title: 'Exempt Device',
    tips: [
      'Pre-submission meetings are rarely needed for exempt devices.',
      'If needed, focus on confirmation of exempt status and labeling compliance.',
      'Ask if any intended uses would change the classification or require clearance.',
    ],
  },
  tbd: {
    title: 'Pathway TBD',
    tips: [
      'Select your regulatory pathway in the Regulatory tab to see tailored strategy.',
      'A Q-Sub is ideal for pathway determination — FDA will classify your device and recommend a pathway.',
      'Come prepared with your device description, intended use, and IFU draft.',
    ],
  },
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
};

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
  marginBottom: 5,
};

// ── Inner tab bar ─────────────────────────────────────────────────────────────

type InnerTab = 'overview' | 'timeline' | 'documents' | 'questions';

const INNER_TABS: Array<{ key: InnerTab; label: string }> = [
  { key: 'overview',  label: 'Overview' },
  { key: 'timeline',  label: 'Timeline' },
  { key: 'documents', label: 'Documents' },
  { key: 'questions', label: 'Questions' },
];

// ── No-selection prompt ───────────────────────────────────────────────────────

function NoSelection({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '72px 24px', gap: 16,
    }}>
      <div style={{ fontSize: 32, opacity: 0.18 }}>▣</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', textAlign: 'center' }}>
        No meeting selected
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', maxWidth: 320, lineHeight: 1.7 }}>
        Select a meeting from the Overview tab, or create your first Q-Sub to get started.
      </div>
      <button onClick={onSwitch} style={{
        marginTop: 8, padding: '8px 22px', borderRadius: 2,
        background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>Go to Overview</button>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  state, update, selectedId, setSelectedId, switchTab,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  switchTab: (t: InnerTab) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftType, setDraftType] = useState<PreSubMeetingType>('q-sub');
  const [draftFormat, setDraftFormat] = useState<'in-person' | 'teleconference' | 'written-only'>('teleconference');
  const [draftSubmitDate, setDraftSubmitDate] = useState('');

  const meetings = state.preSubmission?.meetings ?? [];

  const totalQs = meetings.reduce((a, m) => a + m.questions.length, 0);
  const totalDocs = meetings.reduce((a, m) => a + m.documents.length, 0);
  const completeDocs = meetings.reduce((a, m) => a + m.documents.filter(d => d.status === 'complete').length, 0);
  const docsPercent = totalDocs > 0 ? Math.round(completeDocs / totalDocs * 100) : 0;

  function createMeeting() {
    if (!draftTitle.trim()) return;
    const newMeeting: PreSubMeeting = {
      id: uid(),
      type: draftType,
      title: draftTitle.trim(),
      status: 'planning',
      meetingFormat: draftFormat,
      submittedDate: draftSubmitDate,
      acknowledgedDate: '',
      meetingDate: '',
      responseDate: '',
      qSubNumber: '',
      fdaContact: '',
      questions: [],
      documents: getDefaultDocuments(draftType),
      notes: '',
    };
    update({ ...state, preSubmission: { meetings: [...meetings, newMeeting] } });
    setSelectedId(newMeeting.id);
    setCreating(false);
    setDraftTitle('');
    setDraftType('q-sub');
    setDraftFormat('teleconference');
    setDraftSubmitDate('');
    switchTab('documents');
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 28, minHeight: 164 }}>
        <FlowCanvas accent={ACCENT} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(19,30,44,0.92) 48%, rgba(19,30,44,0.60) 72%, transparent)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px' }}>
          <div style={{ ...monoLabel, color: ACCENT, fontSize: 9, marginBottom: 10 }}>04 / Comply — FDA Pre-Submission</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            FDA Pre-Submission Strategy
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 460 }}>
            Structured Q-Sub management. Track meetings with FDA, build your question package, manage required documents, and record responses — aligned with MDUFA V performance goals.
          </p>
          {/* Stat row */}
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Meetings', value: meetings.length },
              { label: 'Open Questions', value: totalQs },
              { label: 'Docs Complete', value: `${docsPercent}%` },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(232,114,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meeting list */}
      {meetings.length === 0 && !creating && (
        <div style={{
          textAlign: 'center', padding: '52px 24px',
          border: '1px dashed var(--line)', borderRadius: 2,
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
            No pre-submission meetings yet
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.7 }}>
            FDA Q-Sub meetings are your most valuable regulatory asset. Start early — even before your design is finalized.
          </p>
          <button onClick={() => setCreating(true)} style={{
            padding: '9px 24px', borderRadius: 2,
            background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>Schedule First Meeting</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {meetings.map(m => {
          const isSelected = m.id === selectedId;
          const statusMeta = STATUS_META[m.status];
          const typeMeta = MEETING_TYPE_META[m.type];
          const docsTotal = m.documents.length;
          const docsDone = m.documents.filter(d => d.status === 'complete').length;
          const docPct = docsTotal > 0 ? docsDone / docsTotal : 0;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedId(isSelected ? null : m.id)}
              style={{
                background: 'var(--surface-1)',
                border: isSelected ? `1px solid ${ACCENT}` : '1px solid var(--line)',
                borderRadius: 2,
                padding: '14px 18px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: ACCENT,
                }} />
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    {/* Type badge */}
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: ACCENT, background: 'rgba(232,114,82,0.10)',
                      border: `1px solid ${ACCENT}44`,
                      padding: '2px 7px', borderRadius: 2,
                    }}>{typeMeta.label}</span>
                    {/* Status badge */}
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                      color: statusMeta.color, background: `${statusMeta.color}14`,
                      border: `1px solid ${statusMeta.color}33`,
                      padding: '2px 7px', borderRadius: 2,
                      textTransform: 'uppercase', letterSpacing: '0.09em',
                    }}>{statusMeta.label}</span>
                    {/* Format */}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {m.meetingFormat === 'in-person' ? 'In-Person' : m.meetingFormat === 'teleconference' ? 'Teleconference' : 'Written Only'}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{m.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                    {m.meetingDate && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                        Meeting: {fmtDate(m.meetingDate)}
                      </span>
                    )}
                    {m.qSubNumber && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                        Q{m.qSubNumber}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                      {m.questions.length} question{m.questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {/* Doc progress */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                    Docs {docsDone}/{docsTotal}
                  </div>
                  <div style={{ height: 3, background: 'var(--line)', borderRadius: 1, width: 80 }}>
                    <div style={{
                      height: '100%', borderRadius: 1,
                      width: `${docPct * 100}%`,
                      background: docPct === 1 ? '#52E8B4' : docPct > 0.5 ? '#E8A852' : ACCENT,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!creating && meetings.length > 0 && (
        <button onClick={() => setCreating(true)} style={{
          padding: '8px 20px', borderRadius: 2,
          background: 'transparent', color: ACCENT,
          border: `1px solid ${ACCENT}55`, cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>+ New Meeting</button>
      )}

      {/* Create form */}
      {creating && (
        <div style={{
          background: 'var(--surface-1)', border: `1px solid ${ACCENT}44`,
          borderRadius: 2, padding: 24, marginTop: 12,
        }}>
          <div style={{ ...monoLabel, color: ACCENT, fontSize: 10, marginBottom: 18 }}>New Pre-Submission Meeting</div>

          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <div style={monoLabel}>Meeting Title</div>
            <input
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              placeholder="e.g., Pre-IDE Meeting — Cardiac Monitoring System"
              style={inputStyle}
            />
          </div>

          {/* Type selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={monoLabel}>Meeting Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(Object.keys(MEETING_TYPE_META) as PreSubMeetingType[]).map(type => {
                const meta = MEETING_TYPE_META[type];
                const active = draftType === type;
                return (
                  <div
                    key={type}
                    onClick={() => setDraftType(type)}
                    style={{
                      padding: '10px 14px', borderRadius: 2, cursor: 'pointer',
                      background: active ? 'rgba(232,114,82,0.09)' : 'var(--surface-2)',
                      border: active ? `1px solid ${ACCENT}55` : '1px solid var(--line)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: active ? ACCENT : 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 4 }}>{meta.desc}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{meta.when}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format + date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
            <div>
              <div style={monoLabel}>Meeting Format</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['in-person', 'teleconference', 'written-only'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setDraftFormat(fmt)}
                    style={{
                      flex: 1, padding: '7px 6px', borderRadius: 2, cursor: 'pointer',
                      background: draftFormat === fmt ? 'rgba(232,114,82,0.09)' : 'var(--surface-2)',
                      border: draftFormat === fmt ? `1px solid ${ACCENT}55` : '1px solid var(--line)',
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                      color: draftFormat === fmt ? ACCENT : 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.09em',
                      transition: 'all 0.15s',
                    }}
                  >
                    {fmt === 'in-person' ? 'In-Person' : fmt === 'teleconference' ? 'Telecon' : 'Written'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={monoLabel}>Target Submit Date</div>
              <input
                type="date"
                value={draftSubmitDate}
                onChange={e => setDraftSubmitDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={createMeeting} style={{
              padding: '9px 24px', borderRadius: 2,
              background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>Create Meeting →</button>
            <button onClick={() => setCreating(false)} style={{
              padding: '9px 18px', borderRadius: 2,
              background: 'transparent', color: 'var(--text-3)',
              border: '1px solid var(--line)', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

function TimelineTab({
  state, update, selectedId, onSwitchToOverview,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  selectedId: string | null;
  onSwitchToOverview: () => void;
}) {
  const meetings = state.preSubmission?.meetings ?? [];
  const meeting = meetings.find(m => m.id === selectedId) ?? null;

  if (!meeting) return <NoSelection onSwitch={onSwitchToOverview} />;

  const activeMeeting: PreSubMeeting = meeting;
  const today = new Date().toISOString().slice(0, 10);

  // Calculate projected dates from submit date
  const projectedDates: Record<string, string> = {};
  if (activeMeeting.submittedDate) {
    for (const node of MDUFA_TIMELINE) {
      projectedDates[node.key] = addDays(activeMeeting.submittedDate, node.fdaDays);
    }
  }

  // Actual dates map
  const actualDates: Record<string, string> = {
    submitted: activeMeeting.submittedDate,
    acknowledged: activeMeeting.acknowledgedDate,
    'meeting-held': activeMeeting.meetingDate,
    'written-response': activeMeeting.responseDate,
  };

  // Status order for progress
  const statusOrder: PreSubStatus[] = ['planning', 'drafting', 'submitted', 'acknowledged', 'scheduled', 'meeting-held', 'written-response'];

  function patchMeeting(patch: Partial<PreSubMeeting>) {
    update({
      ...state,
      preSubmission: {
        meetings: meetings.map(m => m.id === activeMeeting.id ? { ...m, ...patch } : m),
      },
    });
  }

  // Timeline node status
  function nodeState(key: string): 'past' | 'current' | 'future' {
    const node = MDUFA_TIMELINE.find(n => n.key === key);
    if (!node) return 'future';
    const actual = actualDates[key];
    if (actual && actual <= today) return 'past';
    if (activeMeeting.status === key) return 'current';
    const idx = MDUFA_TIMELINE.indexOf(node);
    const currentNodeIdx = MDUFA_TIMELINE.findIndex(n => n.key === activeMeeting.status);
    if (idx <= currentNodeIdx) return 'past';
    return 'future';
  }

  function displayDate(key: string): string {
    const actual = actualDates[key];
    if (actual) return fmtDate(actual);
    if (projectedDates[key]) return `~${fmtDate(projectedDates[key])}`;
    return '—';
  }

  function daysToNext(): { label: string; days: number; onTrack: boolean } | null {
    for (const node of MDUFA_TIMELINE) {
      const ns = nodeState(node.key);
      if (ns === 'future' || (ns === 'current' && !actualDates[node.key])) {
        const targetDate = actualDates[node.key] || projectedDates[node.key];
        if (!targetDate) return null;
        const days = daysUntil(targetDate);
        const projected = projectedDates[node.key];
        const onTrack = !projected || targetDate <= projected;
        return { label: node.label, days, onTrack };
      }
    }
    return null;
  }

  const nextMilestone = daysToNext();

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Meeting header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ ...monoLabel, color: ACCENT }}>
            {MEETING_TYPE_META[activeMeeting.type].label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.015em' }}>{activeMeeting.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Status selector */}
          <select
            value={activeMeeting.status}
            onChange={e => patchMeeting({ status: e.target.value as PreSubStatus })}
            style={{
              ...inputStyle, width: 'auto', padding: '6px 10px',
              fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em',
              color: STATUS_META[activeMeeting.status].color,
            }}
          >
            {statusOrder.map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Next milestone insight */}
      {nextMilestone && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 18px', marginBottom: 28,
          background: nextMilestone.onTrack ? 'rgba(82,232,180,0.06)' : 'rgba(232,114,82,0.07)',
          border: `1px solid ${nextMilestone.onTrack ? 'rgba(82,232,180,0.2)' : 'rgba(232,114,82,0.25)'}`,
          borderRadius: 2,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: nextMilestone.onTrack ? '#52E8B4' : ACCENT,
            boxShadow: `0 0 8px ${nextMilestone.onTrack ? '#52E8B4' : ACCENT}`,
          }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: nextMilestone.onTrack ? '#52E8B4' : ACCENT, fontWeight: 700 }}>
              Next: {nextMilestone.label}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginLeft: 10 }}>
              {nextMilestone.days === Infinity ? 'No date set' : nextMilestone.days < 0 ? `${Math.abs(nextMilestone.days)} days overdue` : `${nextMilestone.days} days away`}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {nextMilestone.onTrack ? 'On Track' : 'Check Timeline'}
          </div>
        </div>
      )}

      {/* Visual timeline */}
      <div style={{ position: 'relative', marginBottom: 36, overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: 560, paddingBottom: 8 }}>
          {MDUFA_TIMELINE.map((node, i) => {
            const ns = nodeState(node.key);
            const nodeColor = ns === 'past' ? '#52E8B4' : ns === 'current' ? ACCENT : 'var(--surface-2)';
            const lineColor = ns === 'past' ? '#52E8B4' : 'var(--line)';
            const dateStr = displayDate(node.key);
            return (
              <React.Fragment key={node.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                  {/* Circle */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: ns === 'past' ? '#52E8B4' : ns === 'current' ? ACCENT : 'var(--surface-1)',
                    border: `2px solid ${nodeColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2, position: 'relative',
                    boxShadow: ns === 'current' ? `0 0 14px ${ACCENT}88` : ns === 'past' ? '0 0 8px rgba(82,232,180,0.35)' : 'none',
                    animation: ns === 'current' ? 'psub-pulse 2s ease-in-out infinite' : 'none',
                  }}>
                    {ns === 'past' && (
                      <span style={{ color: '#0d1622', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>
                    )}
                    {ns === 'current' && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ marginTop: 8, textAlign: 'center', padding: '0 4px' }}>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: ns === 'future' ? 'var(--text-4)' : ns === 'current' ? ACCENT : '#52E8B4',
                      marginBottom: 3,
                    }}>{node.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 4 }}>{dateStr}</div>
                    {/* MDUFA days badge */}
                    {node.fdaDays > 0 && (
                      <div style={{
                        display: 'inline-block',
                        padding: '1px 5px', borderRadius: 2,
                        fontFamily: 'var(--mono)', fontSize: 8,
                        background: 'rgba(232,114,82,0.10)',
                        color: 'rgba(232,114,82,0.65)',
                        border: '1px solid rgba(232,114,82,0.18)',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>+{node.fdaDays}d</div>
                    )}
                  </div>
                </div>
                {/* Connector line */}
                {i < MDUFA_TIMELINE.length - 1 && (
                  <div style={{
                    height: 2, flex: 0.4, alignSelf: 'flex-start', marginTop: 13,
                    background: lineColor, transition: 'background 0.3s',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Editable date fields */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 2, padding: 20, marginBottom: 24,
      }}>
        <div style={{ ...monoLabel, color: ACCENT, marginBottom: 16 }}>Milestone Dates</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { label: 'Package Submitted', field: 'submittedDate' as const, value: activeMeeting.submittedDate },
            { label: 'FDA Acknowledged', field: 'acknowledgedDate' as const, value: activeMeeting.acknowledgedDate },
            { label: 'Meeting Date', field: 'meetingDate' as const, value: activeMeeting.meetingDate },
            { label: 'Written Response Received', field: 'responseDate' as const, value: activeMeeting.responseDate },
          ].map(({ label, field, value }) => (
            <div key={field}>
              <div style={monoLabel}>{label}</div>
              <input
                type="date"
                value={value}
                onChange={e => patchMeeting({ [field]: e.target.value })}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
          ))}
        </div>

        {/* Extra fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
          <div>
            <div style={monoLabel}>Q-Sub Number</div>
            <input
              value={activeMeeting.qSubNumber}
              onChange={e => patchMeeting({ qSubNumber: e.target.value })}
              placeholder="e.g., Q250001"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={monoLabel}>FDA Contact / Division</div>
            <input
              value={activeMeeting.fdaContact}
              onChange={e => patchMeeting({ fdaContact: e.target.value })}
              placeholder="e.g., CDRH / OHT1"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* MDUFA V Goals reference */}
      <div>
        <div style={{ ...monoLabel, color: 'var(--text-4)', marginBottom: 12 }}>MDUFA V Performance Goals (Reference)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Acknowledgment', value: '14 days', desc: 'From submission' },
            { label: 'Meeting', value: '70 days', desc: 'From acknowledgment' },
            { label: 'Written Response', value: '30 days', desc: 'Post-meeting' },
            { label: 'Total Cycle', value: '~114 days', desc: 'Submission to response' },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, minWidth: 130,
              padding: '12px 16px',
              background: 'var(--surface-1)', border: '1px solid var(--line)',
              borderRadius: 2,
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: ACCENT, lineHeight: 1, marginBottom: 4 }}>{item.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes psub-pulse {
          0%, 100% { box-shadow: 0 0 10px ${ACCENT}66; }
          50% { box-shadow: 0 0 22px ${ACCENT}cc; }
        }
      `}</style>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab({
  state, update, selectedId, onSwitchToOverview,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  selectedId: string | null;
  onSwitchToOverview: () => void;
}) {
  const meetings = state.preSubmission?.meetings ?? [];
  const meeting = meetings.find(m => m.id === selectedId) ?? null;
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  if (!meeting) return <NoSelection onSwitch={onSwitchToOverview} />;

  function patchDoc(docId: string, patch: Partial<PreSubDocument>) {
    update({
      ...state,
      preSubmission: {
        meetings: meetings.map(m => m.id === meeting!.id
          ? { ...m, documents: m.documents.map(d => d.id === docId ? { ...d, ...patch } : d) }
          : m),
      },
    });
  }

  function addCustomDoc() {
    if (!newDocName.trim()) return;
    const doc: PreSubDocument = {
      id: uid(), name: newDocName.trim(), section: 'custom',
      required: false, status: 'not-started', notes: '',
    };
    update({
      ...state,
      preSubmission: {
        meetings: meetings.map(m => m.id === meeting!.id
          ? { ...m, documents: [...m.documents, doc] }
          : m),
      },
    });
    setNewDocName('');
    setAddingDoc(false);
  }

  function removeDoc(docId: string) {
    update({
      ...state,
      preSubmission: {
        meetings: meetings.map(m => m.id === meeting!.id
          ? { ...m, documents: m.documents.filter(d => d.id !== docId) }
          : m),
      },
    });
  }

  // Group by section
  const sections = Array.from(new Set(meeting.documents.map(d => d.section)));
  const total = meeting.documents.length;
  const complete = meeting.documents.filter(d => d.status === 'complete').length;
  const pct = total > 0 ? Math.round(complete / total * 100) : 0;

  const sectionLabels: Record<string, string> = {
    cover: 'Cover Materials',
    device: 'Device Description',
    regulatory: 'Regulatory',
    questions: 'Questions',
    clinical: 'Clinical',
    testing: 'Testing & Performance',
    safety: 'Safety',
    custom: 'Custom Documents',
  };

  return (
    <div>
      {/* Progress bar */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 2, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Package Completeness
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: pct === 100 ? '#52E8B4' : ACCENT }}>
              {complete} / {total} complete
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--line)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${pct}%`,
              background: pct === 100 ? '#52E8B4' : pct > 66 ? '#E8A852' : ACCENT,
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: pct === 100 ? '#52E8B4' : ACCENT, minWidth: 52, textAlign: 'right' }}>
          {pct}%
        </div>
      </div>

      {/* Document groups */}
      {sections.map(section => {
        const sectionDocs = meeting.documents.filter(d => d.section === section);
        return (
          <div key={section} style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.16em',
              color: 'var(--text-4)', padding: '6px 0', marginBottom: 6,
              borderBottom: '1px solid var(--line)',
            }}>
              {sectionLabels[section] ?? section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sectionDocs.map(doc => {
                const statusM = DOC_STATUS_META[doc.status];
                const notesOpen = expandedNotes === doc.id;
                return (
                  <div key={doc.id} style={{
                    background: 'var(--surface-1)', border: '1px solid var(--line)',
                    borderRadius: 2, padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Required badge */}
                      {doc.required ? (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: ACCENT, background: 'rgba(232,114,82,0.10)',
                          border: `1px solid ${ACCENT}33`,
                          padding: '1px 5px', borderRadius: 2, flexShrink: 0,
                        }}>Req</span>
                      ) : (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 8,
                          color: 'var(--text-4)',
                          padding: '1px 5px', borderRadius: 2, flexShrink: 0,
                          border: '1px solid transparent',
                        }}>Opt</span>
                      )}
                      {/* Doc name */}
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{doc.name}</div>
                      {/* Status selector */}
                      <select
                        value={doc.status}
                        onChange={e => patchDoc(doc.id, { status: e.target.value as PreSubDocStatus })}
                        style={{
                          background: statusM.bg,
                          border: `1px solid ${statusM.color}33`,
                          borderRadius: 2, padding: '3px 8px',
                          fontFamily: 'var(--mono)', fontSize: 9,
                          color: statusM.color, outline: 'none', cursor: 'pointer',
                          textTransform: 'uppercase', letterSpacing: '0.09em',
                        }}
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="complete">Complete</option>
                        <option value="na">N/A</option>
                      </select>
                      {/* Notes toggle */}
                      <button
                        onClick={() => setExpandedNotes(notesOpen ? null : doc.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)',
                          padding: '2px 6px',
                        }}
                      >{notesOpen ? '▲' : '▼'}</button>
                      {/* Delete */}
                      <button
                        onClick={() => removeDoc(doc.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-4)', fontSize: 14, padding: '2px 4px', lineHeight: 1,
                        }}
                      >×</button>
                    </div>
                    {notesOpen && (
                      <textarea
                        value={doc.notes}
                        onChange={e => patchDoc(doc.id, { notes: e.target.value })}
                        placeholder="Notes about this document..."
                        rows={2}
                        style={{
                          ...inputStyle, marginTop: 8, resize: 'vertical',
                          fontSize: 12, color: 'var(--text-3)',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add custom document */}
      {addingDoc ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={newDocName}
            onChange={e => setNewDocName(e.target.value)}
            placeholder="Document name..."
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') addCustomDoc(); if (e.key === 'Escape') setAddingDoc(false); }}
            autoFocus
          />
          <button onClick={addCustomDoc} style={{
            padding: '8px 16px', borderRadius: 2,
            background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Add</button>
          <button onClick={() => setAddingDoc(false)} style={{
            padding: '8px 12px', borderRadius: 2,
            background: 'transparent', color: 'var(--text-3)',
            border: '1px solid var(--line)', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10,
          }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAddingDoc(true)} style={{
          marginTop: 8, padding: '7px 18px', borderRadius: 2,
          background: 'transparent', color: 'var(--text-3)',
          border: '1px dashed var(--line)', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          width: '100%',
        }}>+ Add Custom Document</button>
      )}
    </div>
  );
}

// ── Questions Tab ─────────────────────────────────────────────────────────────

function QuestionsTab({
  state, update, selectedId, onSwitchToOverview,
}: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
  selectedId: string | null;
  onSwitchToOverview: () => void;
}) {
  const meetings = state.preSubmission?.meetings ?? [];
  const meeting = meetings.find(m => m.id === selectedId) ?? null;
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);

  if (!meeting) return <NoSelection onSwitch={onSwitchToOverview} />;

  const pathway = state.regulatory?.pathway ?? 'tbd';
  const tips = PATHWAY_TIPS[pathway] ?? PATHWAY_TIPS.tbd;
  const qCount = meeting.questions.length;
  const qCountColor = qCount > 10 ? '#c04040' : qCount > 8 ? '#d9a020' : 'var(--text-2)';

  function patchMeeting(patch: Partial<PreSubMeeting>) {
    update({
      ...state,
      preSubmission: {
        meetings: meetings.map(m => m.id === meeting!.id ? { ...m, ...patch } : m),
      },
    });
  }

  function patchQuestion(qId: string, patch: Partial<PreSubQuestion>) {
    patchMeeting({
      questions: meeting!.questions.map(q => q.id === qId ? { ...q, ...patch } : q),
    });
  }

  function addQuestion() {
    const newQ: PreSubQuestion = {
      id: uid(), text: '', category: 'regulatory', priority: 1,
      fdaResponse: '', status: 'draft',
    };
    patchMeeting({ questions: [...meeting!.questions, newQ] });
  }

  function removeQuestion(qId: string) {
    patchMeeting({ questions: meeting!.questions.filter(q => q.id !== qId) });
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--line)',
          borderRadius: 2, padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Question Package</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                FDA recommends 10 or fewer focused questions. Questions should be specific and answerable.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: qCountColor, lineHeight: 1 }}>
                {qCount}
                <span style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 400 }}>/10</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>
                Questions
              </div>
            </div>
          </div>
          {qCount > 8 && (
            <div style={{
              marginTop: 10, padding: '7px 12px', borderRadius: 2,
              background: qCount > 10 ? 'rgba(192,64,64,0.08)' : 'rgba(217,160,32,0.08)',
              border: `1px solid ${qCount > 10 ? 'rgba(192,64,64,0.3)' : 'rgba(217,160,32,0.3)'}`,
              fontFamily: 'var(--mono)', fontSize: 10, color: qCount > 10 ? '#c04040' : '#d9a020',
            }}>
              {qCount > 10
                ? 'Over 10 questions — FDA may deprioritize or decline to answer some. Consolidate before submitting.'
                : 'Approaching limit — consider consolidating related questions before submitting.'}
            </div>
          )}
        </div>

        {/* Question cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {meeting.questions.map((q, idx) => {
            const catMeta = Q_CAT_META[q.category];
            const statusM = Q_STATUS_META[q.status];
            const responseOpen = expandedResponse === q.id;
            const priorityColors: Record<1 | 2 | 3, string> = { 1: ACCENT, 2: '#E8A852', 3: 'var(--text-4)' };
            return (
              <div key={q.id} style={{
                background: 'var(--surface-1)', border: '1px solid var(--line)',
                borderRadius: 2, padding: '14px 16px',
                borderLeft: `3px solid ${catMeta.color}`,
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {/* Number */}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', minWidth: 22 }}>Q{idx + 1}</span>
                  {/* Priority toggle */}
                  <button
                    onClick={() => patchQuestion(q.id, { priority: q.priority === 3 ? 1 : (q.priority + 1) as 1 | 2 | 3 })}
                    style={{
                      padding: '2px 8px', borderRadius: 2, cursor: 'pointer', border: 'none',
                      background: `${priorityColors[q.priority]}18`,
                      color: priorityColors[q.priority],
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}
                  >P{q.priority}</button>
                  {/* Category pills */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(Object.keys(Q_CAT_META) as PreSubQuestionCategory[]).map(cat => (
                      <button
                        key={cat}
                        onClick={() => patchQuestion(q.id, { category: cat })}
                        style={{
                          padding: '1px 7px', borderRadius: 2, cursor: 'pointer',
                          border: `1px solid ${cat === q.category ? Q_CAT_META[cat].color + '66' : 'transparent'}`,
                          background: cat === q.category ? `${Q_CAT_META[cat].color}14` : 'transparent',
                          fontFamily: 'var(--mono)', fontSize: 8,
                          color: cat === q.category ? Q_CAT_META[cat].color : 'var(--text-4)',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                      >{Q_CAT_META[cat].label}</button>
                    ))}
                  </div>
                  {/* Status */}
                  <button
                    onClick={() => {
                      const cycle: Array<'draft' | 'final' | 'answered'> = ['draft', 'final', 'answered'];
                      const next = cycle[(cycle.indexOf(q.status) + 1) % cycle.length];
                      patchQuestion(q.id, { status: next });
                    }}
                    style={{
                      marginLeft: 'auto',
                      padding: '2px 8px', borderRadius: 2, cursor: 'pointer', border: 'none',
                      background: `${statusM.color}14`,
                      color: statusM.color,
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.09em',
                    }}
                  >{statusM.label}</button>
                  {/* Delete */}
                  <button
                    onClick={() => removeQuestion(q.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                  >×</button>
                </div>
                {/* Question text */}
                <textarea
                  value={q.text}
                  onChange={e => patchQuestion(q.id, { text: e.target.value })}
                  placeholder="Enter your specific, binary question for FDA..."
                  rows={3}
                  style={{
                    ...inputStyle, resize: 'vertical', marginBottom: 8,
                    fontSize: 14, fontWeight: 500,
                    borderColor: q.text ? 'var(--line)' : `${ACCENT}33`,
                  }}
                />
                {/* FDA Response section */}
                <div>
                  <button
                    onClick={() => setExpandedResponse(responseOpen ? null : q.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}
                  >
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: q.fdaResponse ? '#52E8B4' : 'var(--text-4)' }} />
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                      color: q.fdaResponse ? '#52E8B4' : 'var(--text-4)',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                    }}>
                      {q.fdaResponse ? 'FDA Response Recorded' : 'Record FDA Response'}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{responseOpen ? '▲' : '▼'}</span>
                  </button>
                  {responseOpen && (
                    <textarea
                      value={q.fdaResponse}
                      onChange={e => patchQuestion(q.id, { fdaResponse: e.target.value })}
                      placeholder="Record FDA's response, feedback, or concurrence here..."
                      rows={4}
                      style={{
                        ...inputStyle, marginTop: 8, resize: 'vertical',
                        fontSize: 13,
                        borderLeft: `3px solid #52E8B4`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={addQuestion} style={{
          width: '100%', padding: '11px 0', borderRadius: 2,
          background: 'transparent', color: qCount >= 10 ? '#d9a020' : 'var(--text-3)',
          border: `1px dashed ${qCount >= 10 ? 'rgba(217,160,32,0.4)' : 'var(--line)'}`,
          cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>+ Add Question{qCount >= 10 ? ' (over recommended limit)' : ''}</button>
      </div>

      {/* Strategy sidebar */}
      <div style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 2, padding: 18,
        position: 'sticky', top: 16,
      }}>
        <div style={{
          ...monoLabel, color: ACCENT, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
          Strategy
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: PATHWAY_META[pathway as keyof typeof PATHWAY_META]?.color ?? 'var(--text-3)',
          marginBottom: 12,
        }}>
          {tips.title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tips.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: 'var(--surface-2)', border: `1px solid ${ACCENT}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 8, color: ACCENT, fontWeight: 700, marginTop: 1,
              }}>{i + 1}</div>
              <span style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.65 }}>{tip}</span>
            </div>
          ))}
        </div>
        {/* Best practices */}
        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Best Practices</div>
          {[
            'Be specific — avoid "Does FDA agree with our approach?"',
            'Binary questions get binary answers',
            'Group related questions under one umbrella',
            'Attach supporting data for each question',
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 7 }}>
              <span style={{ color: ACCENT, fontSize: 9, flexShrink: 0, marginTop: 2 }}>—</span>
              <span style={{ fontSize: 10, color: 'var(--text-4)', lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PreSubTab({ state, update }: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const [innerTab, setInnerTab] = useState<InnerTab>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          // Add dot indicators for meetings/docs count
          let badge: number | null = null;
          const meetings = state.preSubmission?.meetings ?? [];
          if (tab.key === 'overview') badge = meetings.length || null;
          if (tab.key === 'questions' && selectedId) {
            const m = meetings.find(m => m.id === selectedId);
            badge = m ? m.questions.length : null;
          }
          if (tab.key === 'documents' && selectedId) {
            const m = meetings.find(m => m.id === selectedId);
            const incomplete = m ? m.documents.filter(d => d.status !== 'complete' && d.status !== 'na').length : 0;
            badge = incomplete > 0 ? incomplete : null;
          }
          return (
            <button
              key={tab.key}
              onClick={() => setInnerTab(tab.key)}
              style={{
                padding: '10px 18px', borderRadius: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? ACCENT : 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: -1,
              }}
            >
              {tab.label}
              {badge !== null && badge > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%',
                  background: isActive ? ACCENT : 'var(--surface-2)',
                  color: isActive ? '#fff' : 'var(--text-3)',
                  fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {innerTab === 'overview' && (
          <OverviewTab
            state={state}
            update={update}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            switchTab={setInnerTab}
          />
        )}
        {innerTab === 'timeline' && (
          <TimelineTab
            state={state}
            update={update}
            selectedId={selectedId}
            onSwitchToOverview={() => setInnerTab('overview')}
          />
        )}
        {innerTab === 'documents' && (
          <DocumentsTab
            state={state}
            update={update}
            selectedId={selectedId}
            onSwitchToOverview={() => setInnerTab('overview')}
          />
        )}
        {innerTab === 'questions' && (
          <QuestionsTab
            state={state}
            update={update}
            selectedId={selectedId}
            onSwitchToOverview={() => setInnerTab('overview')}
          />
        )}
      </div>
    </div>
  );
}
