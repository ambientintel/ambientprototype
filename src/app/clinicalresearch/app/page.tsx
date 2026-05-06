'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import '../clinicalresearch.css';
import './app.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type StudyPhase   = 'phase-1' | 'phase-1-2' | 'phase-2' | 'phase-2-3' | 'phase-3' | 'phase-4' | 'na';
type StudyType    = 'interventional' | 'observational' | 'expanded-access';
type DesignType   = 'parallel-rct' | 'crossover' | 'factorial' | 'cluster-rct' | 'single-arm' | 'dose-escalation' | 'adaptive' | 'platform' | 'registry' | 'cohort' | 'case-control';
type Randomization= 'not-applicable' | '1:1' | '2:1' | '1:1:1' | 'stratified' | 'minimization' | 'unequal';
type Blinding     = 'open-label' | 'single-blind' | 'double-blind' | 'triple-blind';
type IRBType      = 'full-board' | 'expedited' | 'exempt' | 'sirb';
type IRBStatus    = 'not-submitted' | 'submitted' | 'under-review' | 'approved' | 'continuing-review' | 'expired';
type FDAPathway   = 'none' | 'ind' | 'ide' | 'pre-sub' | 'bla' | 'nda' | 'pma' | '510k' | 'de-novo';
type SAPStatus    = 'not-started' | 'draft' | 'under-review' | 'finalized' | 'fda-agreed';
type MilestoneStatus = 'planned' | 'in-progress' | 'done' | 'blocked';
type AESeverity   = 'grade-1' | 'grade-2' | 'grade-3' | 'grade-4' | 'grade-5';
type AERelation   = 'unrelated' | 'unlikely' | 'possible' | 'probable' | 'definite';
type AEStatus     = 'open' | 'resolved' | 'ongoing' | 'fatal';
type Tab          = 'dashboard' | 'hypothesis' | 'endpoints' | 'design' | 'stats' | 'irb' | 'regulatory' | 'sites' | 'safety' | 'milestones' | 'diagram';

interface StudyArm     { id: string; name: string; n: string; description: string; }
interface Milestone    { id: string; title: string; targetDate: string; status: MilestoneStatus; phase: 'protocol' | 'regulatory' | 'operations' | 'close-out'; }
interface AdverseEvent { id: string; date: string; description: string; severity: AESeverity; relation: AERelation; status: AEStatus; susar: boolean; }
interface Site         { id: string; name: string; pi: string; country: string; target: string; enrolled: string; status: 'pending' | 'active' | 'closed'; }

interface CRState {
  protocolTitle:   string;
  protocolNumber:  string;
  indication:      string;
  sponsor:         string;
  phase:           StudyPhase;
  studyType:       StudyType;
  hypothesis: {
    population: string; intervention: string;
    comparator: string; primaryOutcome: string;
    timeframe: string; rationale: string;
  };
  endpoints: {
    primary: string; primaryTimepoint: string;
    secondary: string; safety: string; exploratory: string; proInstruments: string;
  };
  design: {
    designType: DesignType; randomization: Randomization; blinding: Blinding;
    treatmentDuration: string; followUpDuration: string;
    adaptiveFeatures: string; arms: StudyArm[];
  };
  stats: {
    primaryAnalysis: string; alpha: string; power: string;
    sampleSizeTotal: string; dropoutRate: string;
    analysisSets: string; interimAnalyses: string;
    sapStatus: SAPStatus; statistician: string;
  };
  irb: {
    irbType: IRBType; irbStatus: IRBStatus;
    irbNumber: string; approvalDate: string; expirationDate: string;
    protocolVersion: string; icfVersion: string;
    waiverOfConsent: boolean; sIRB: boolean; sIRBLeadSite: string;
    notes: string;
  };
  regulatory: {
    fdaPathway: FDAPathway; indNumber: string; ideNumber: string;
    ctGovId: string; eudraCtNumber: string;
    preIndMeeting: boolean; preIndDate: string;
    typeBMeeting: boolean; typeBDate: string; typeBNotes: string;
    notes: string;
  };
  enrollment: {
    target: string; enrolled: string;
    screenFailRate: string; enrollmentRate: string;
    projectedFPI: string; projectedLPI: string; projectedDBL: string;
    notes: string;
  };
  sites:    Site[];
  safety:   { adverseEvents: AdverseEvent[]; dsmbRequired: boolean; dsmbFrequency: string; stoppingRules: string; };
  milestones: Milestone[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASES:          [StudyPhase,    string][] = [['phase-1','Phase I'],['phase-1-2','Phase I/II'],['phase-2','Phase II'],['phase-2-3','Phase II/III'],['phase-3','Phase III'],['phase-4','Phase IV'],['na','N/A']];
const STUDY_TYPES:     [StudyType,     string][] = [['interventional','Interventional'],['observational','Observational'],['expanded-access','Expanded Access']];
const DESIGN_TYPES:    [DesignType,    string][] = [['parallel-rct','Parallel RCT'],['crossover','Crossover'],['factorial','Factorial'],['cluster-rct','Cluster RCT'],['single-arm','Single-Arm'],['dose-escalation','Dose Escalation'],['adaptive','Adaptive'],['platform','Platform Trial'],['registry','Registry'],['cohort','Cohort'],['case-control','Case-Control']];
const RAND_TYPES:      [Randomization, string][] = [['not-applicable','N/A'],['1:1','1:1'],['2:1','2:1'],['1:1:1','1:1:1'],['stratified','Stratified'],['minimization','Minimization'],['unequal','Unequal']];
const BLIND_TYPES:     [Blinding,      string][] = [['open-label','Open-Label'],['single-blind','Single-Blind'],['double-blind','Double-Blind'],['triple-blind','Triple-Blind']];
const IRB_TYPES:       [IRBType,       string][] = [['full-board','Full Board'],['expedited','Expedited'],['exempt','Exempt'],['sirb','Single IRB']];
const IRB_STATUSES:    [IRBStatus,     string][] = [['not-submitted','Not Submitted'],['submitted','Submitted'],['under-review','Under Review'],['approved','Approved'],['continuing-review','Continuing Review'],['expired','Expired']];
const FDA_PATHWAYS:    [FDAPathway,    string][] = [['none','None'],['ind','IND'],['ide','IDE'],['pre-sub','Pre-Sub'],['bla','BLA'],['nda','NDA'],['pma','PMA'],['510k','510(k)'],['de-novo','De Novo']];
const SAP_STATUSES:    [SAPStatus,     string][] = [['not-started','Not Started'],['draft','Draft'],['under-review','Under Review'],['finalized','Finalized'],['fda-agreed','FDA-Agreed']];
const AE_SEVERITIES:   [AESeverity,    string][] = [['grade-1','Grade 1'],['grade-2','Grade 2'],['grade-3','Grade 3'],['grade-4','Grade 4'],['grade-5','Grade 5 (Fatal)']];
const AE_RELATIONS:    [AERelation,    string][] = [['unrelated','Unrelated'],['unlikely','Unlikely'],['possible','Possible'],['probable','Probable'],['definite','Definite']];
const AE_STATUSES:     [AEStatus,      string][] = [['open','Open'],['resolved','Resolved'],['ongoing','Ongoing'],['fatal','Fatal']];
const M_PHASES:        string[]                  = ['protocol','regulatory','operations','close-out'];

const PHASE_COLOR: Record<StudyPhase, string>  = { 'phase-1':'#10B981','phase-1-2':'#10B981','phase-2':'#06B6D4','phase-2-3':'#06B6D4','phase-3':'#8B5CF6','phase-4':'#F59E0B','na':'#10B981' };
const IRB_STATUS_COLOR: Record<IRBStatus, { bg: string; color: string }> = {
  'not-submitted': { bg:'rgba(226,245,238,.07)', color:'#4B7063' },
  'submitted':     { bg:'rgba(6,182,212,.12)',   color:'#06B6D4' },
  'under-review':  { bg:'rgba(245,158,11,.12)',  color:'#F59E0B' },
  'approved':      { bg:'rgba(16,185,129,.15)',  color:'#10B981' },
  'continuing-review':{ bg:'rgba(139,92,246,.12)',color:'#8B5CF6'},
  'expired':       { bg:'rgba(244,63,94,.12)',   color:'#F43F5E' },
};
const AE_SEV_COLOR: Record<AESeverity, string> = { 'grade-1':'#10B981','grade-2':'#06B6D4','grade-3':'#F59E0B','grade-4':'#F43F5E','grade-5':'#8B5CF6' };
const MILESTONE_STATUS_NEXT: Record<MilestoneStatus, MilestoneStatus> = { 'planned':'in-progress','in-progress':'done','done':'blocked','blocked':'planned' };

const DEFAULT_MILESTONES: Omit<Milestone,'id'>[] = [
  { title:'Protocol Draft Complete', targetDate:'', status:'planned', phase:'protocol'   },
  { title:'Statistical Analysis Plan', targetDate:'', status:'planned', phase:'protocol' },
  { title:'IRB Submission', targetDate:'', status:'planned', phase:'regulatory'          },
  { title:'IRB Approval', targetDate:'', status:'planned', phase:'regulatory'            },
  { title:'IND / IDE Filing', targetDate:'', status:'planned', phase:'regulatory'        },
  { title:'CT.gov Registration', targetDate:'', status:'planned', phase:'regulatory'     },
  { title:'First Site Activated', targetDate:'', status:'planned', phase:'operations'    },
  { title:'First Patient In (FPI)', targetDate:'', status:'planned', phase:'operations'  },
  { title:'Last Patient In (LPI)', targetDate:'', status:'planned', phase:'operations'   },
  { title:'Database Lock', targetDate:'', status:'planned', phase:'close-out'            },
  { title:'Top-Line Results', targetDate:'', status:'planned', phase:'close-out'         },
  { title:'Primary Publication', targetDate:'', status:'planned', phase:'close-out'      },
];

const DEFAULT_STATE: CRState = {
  protocolTitle:'', protocolNumber:'', indication:'', sponsor:'', phase:'phase-2', studyType:'interventional',
  hypothesis:{ population:'', intervention:'', comparator:'', primaryOutcome:'', timeframe:'', rationale:'' },
  endpoints:{ primary:'', primaryTimepoint:'', secondary:'', safety:'', exploratory:'', proInstruments:'' },
  design:{ designType:'parallel-rct', randomization:'1:1', blinding:'double-blind', treatmentDuration:'', followUpDuration:'', adaptiveFeatures:'', arms:[] },
  stats:{ primaryAnalysis:'', alpha:'0.05', power:'80%', sampleSizeTotal:'', dropoutRate:'', analysisSets:'ITT, mITT, Per-Protocol, Safety', interimAnalyses:'', sapStatus:'not-started', statistician:'' },
  irb:{ irbType:'full-board', irbStatus:'not-submitted', irbNumber:'', approvalDate:'', expirationDate:'', protocolVersion:'1.0', icfVersion:'1.0', waiverOfConsent:false, sIRB:false, sIRBLeadSite:'', notes:'' },
  regulatory:{ fdaPathway:'ind', indNumber:'', ideNumber:'', ctGovId:'', eudraCtNumber:'', preIndMeeting:false, preIndDate:'', typeBMeeting:false, typeBDate:'', typeBNotes:'', notes:'' },
  enrollment:{ target:'', enrolled:'0', screenFailRate:'', enrollmentRate:'', projectedFPI:'', projectedLPI:'', projectedDBL:'', notes:'' },
  sites:[], safety:{ adverseEvents:[], dsmbRequired:false, dsmbFrequency:'Every 6 months', stoppingRules:'' },
  milestones: DEFAULT_MILESTONES.map(m => ({ ...m, id: Math.random().toString(36).slice(2) })),
};

interface ProjectMeta { id: string; title: string; indication: string; phase: StudyPhase; updatedAt: string; }
const PROJECTS_KEY = 'ambient-cr-projects';
const PROJECT_KEY  = (id: string) => `ambient-cr-project-${id}`;
const ACTIVE_KEY   = 'ambient-cr-active';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function loadProjects(): { projects: ProjectMeta[]; activeId: string | null } {
  try {
    const ps  = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '[]') as ProjectMeta[];
    const aid = localStorage.getItem(ACTIVE_KEY);
    return { projects: ps, activeId: aid };
  } catch { return { projects: [], activeId: null }; }
}

function loadProjectData(id: string): CRState {
  try {
    const raw = JSON.parse(localStorage.getItem(PROJECT_KEY(id)) ?? '{}') as Partial<CRState>;
    return { ...DEFAULT_STATE, ...raw,
      hypothesis:  { ...DEFAULT_STATE.hypothesis,  ...(raw.hypothesis  ?? {}) },
      endpoints:   { ...DEFAULT_STATE.endpoints,   ...(raw.endpoints   ?? {}) },
      design:      { ...DEFAULT_STATE.design,      ...(raw.design      ?? {}) },
      stats:       { ...DEFAULT_STATE.stats,       ...(raw.stats       ?? {}) },
      irb:         { ...DEFAULT_STATE.irb,         ...(raw.irb         ?? {}) },
      regulatory:  { ...DEFAULT_STATE.regulatory,  ...(raw.regulatory  ?? {}) },
      enrollment:  { ...DEFAULT_STATE.enrollment,  ...(raw.enrollment  ?? {}) },
      safety:      { ...DEFAULT_STATE.safety,      ...(raw.safety      ?? {}) },
    };
  } catch { return DEFAULT_STATE; }
}

function persistProject(id: string, s: CRState, ps: ProjectMeta[]): ProjectMeta[] {
  localStorage.setItem(PROJECT_KEY(id), JSON.stringify(s));
  const updated = ps.map(p => p.id === id
    ? { ...p, title: s.protocolTitle || 'Untitled Protocol', indication: s.indication, phase: s.phase, updatedAt: new Date().toISOString() }
    : p
  );
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  return updated;
}

// ── Primitive components ──────────────────────────────────────────────────────

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="cra-field">
      <span className="cra-label">{label}</span>
      {hint && <span className="cra-hint">{hint}</span>}
      {children}
    </div>
  );
}

function Chips<T extends string>({ options, value, onChange, colorMap }: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  colorMap?: Record<string, string>;
}) {
  return (
    <div className="cra-chips">
      {options.map(([v, label]) => {
        const color = colorMap?.[v] ?? 'var(--accent)';
        return (
          <button key={v}
            className={`cra-chip-opt${value === v ? ' sel' : ''}`}
            style={{ ['--opt-color' as string]: color }}
            onClick={() => onChange(v)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="cra-toggle-row" onClick={() => onChange(!on)}>
      <div className={`cra-toggle-track${on ? ' on' : ''}`}>
        <div className="cra-toggle-thumb" />
      </div>
      <span className="cra-toggle-label">{label}</span>
    </div>
  );
}

function Pill({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return <span className="cra-pill" style={{ background: bg, color }}>{children}</span>;
}

// ── Tab components ────────────────────────────────────────────────────────────

function DashboardTab({ s }: { s: CRState }) {
  const enrolled  = parseInt(s.enrollment.enrolled) || 0;
  const target    = parseInt(s.enrollment.target)   || 1;
  const pct       = Math.min(100, Math.round((enrolled / target) * 100));
  const doneMs    = s.milestones.filter(m => m.status === 'done').length;
  const openAEs   = s.safety.adverseEvents.filter(a => a.status === 'open').length;
  const grade3Plus= s.safety.adverseEvents.filter(a => ['grade-3','grade-4','grade-5'].includes(a.severity)).length;
  const irbSt     = IRB_STATUS_COLOR[s.irb.irbStatus];

  const sections: [string, number, string][] = [
    ['Hypothesis / PICO', s.hypothesis.population && s.hypothesis.primaryOutcome ? 100 : s.hypothesis.population ? 50 : 0, '#10B981'],
    ['Endpoints', s.endpoints.primary ? 100 : 0, '#06B6D4'],
    ['Study Design', s.design.designType ? (s.design.arms.length ? 100 : 60) : 0, '#8B5CF6'],
    ['Statistical Plan', s.stats.primaryAnalysis ? (s.stats.sapStatus === 'finalized' || s.stats.sapStatus === 'fda-agreed' ? 100 : 60) : 0, '#F59E0B'],
    ['IRB / Ethics', s.irb.irbStatus === 'approved' ? 100 : s.irb.irbStatus !== 'not-submitted' ? 50 : 0, '#10B981'],
    ['Regulatory', s.regulatory.fdaPathway !== 'none' && s.regulatory.ctGovId ? 100 : s.regulatory.fdaPathway !== 'none' ? 40 : 0, '#06B6D4'],
    ['Sites & Enrollment', s.sites.length ? Math.min(100, pct) : 0, '#8B5CF6'],
  ];

  return (
    <div>
      <p className="cra-section-title">Protocol <em>Overview</em></p>

      <div className="cra-grid-4" style={{ marginBottom: 28 }}>
        <div className="cra-kpi" style={{ ['--kpi-color' as string]: '#10B981' }}>
          <span className="cra-kpi-label">Enrollment</span>
          <span className="cra-kpi-value">{pct}<span>%</span></span>
          <span className="cra-kpi-sub">{enrolled.toLocaleString()} / {target.toLocaleString()} participants</span>
          <div className="cra-kpi-bar"><div className="cra-kpi-bar-fill" style={{ width:`${pct}%` }} /></div>
        </div>
        <div className="cra-kpi" style={{ ['--kpi-color' as string]: '#F59E0B' }}>
          <span className="cra-kpi-label">Open AEs</span>
          <span className="cra-kpi-value">{openAEs}<span></span></span>
          <span className="cra-kpi-sub">Grade 3+: {grade3Plus}</span>
        </div>
        <div className="cra-kpi" style={{ ['--kpi-color' as string]: '#06B6D4' }}>
          <span className="cra-kpi-label">Milestones</span>
          <span className="cra-kpi-value">{doneMs}<span>/{s.milestones.length}</span></span>
          <span className="cra-kpi-sub">complete</span>
          <div className="cra-kpi-bar"><div className="cra-kpi-bar-fill" style={{ width:`${s.milestones.length ? (doneMs/s.milestones.length*100) : 0}%` }} /></div>
        </div>
        <div className="cra-kpi" style={{ ['--kpi-color' as string]: irbSt.color }}>
          <span className="cra-kpi-label">IRB Status</span>
          <span className="cra-kpi-value" style={{ fontSize:16, marginTop:4 }}>
            <Pill bg={irbSt.bg} color={irbSt.color}>{s.irb.irbStatus.replace(/-/g,' ')}</Pill>
          </span>
          <span className="cra-kpi-sub">{s.irb.irbNumber || 'No number assigned'}</span>
        </div>
      </div>

      <div className="cra-divider" />
      <p className="cra-subsection">Protocol Completion</p>
      <div>
        {sections.map(([label, pct, color]) => (
          <div key={label} className="cra-progress-row" style={{ ['--prog-color' as string]: color }}>
            <span className="cra-progress-label">{label}</span>
            <div className="cra-progress-track"><div className="cra-progress-fill" style={{ width:`${pct}%` }} /></div>
            <span className="cra-progress-val">{pct}%</span>
          </div>
        ))}
      </div>

      {s.regulatory.ctGovId && (
        <>
          <div className="cra-divider" />
          <p className="cra-subsection">Registry</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <a href={`https://clinicaltrials.gov/study/${s.regulatory.ctGovId}`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--cyan)', textDecoration:'none' }}>
              {s.regulatory.ctGovId} ↗
            </a>
            {s.regulatory.eudraCtNumber && <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-3)' }}>{s.regulatory.eudraCtNumber}</span>}
          </div>
        </>
      )}
    </div>
  );
}

function HypothesisTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const h = s.hypothesis;
  const set = (k: keyof typeof h) => (e: React.ChangeEvent<HTMLTextAreaElement|HTMLInputElement>) =>
    update({ ...s, hypothesis: { ...h, [k]: e.target.value } });
  return (
    <div>
      <p className="cra-section-title">Clinical <em>Hypothesis</em></p>
      <p className="cra-subsection">PICO Framework</p>
      <div className="cra-stack">
        <F label="P — Population / Participants" hint="Who is the target patient population? Include key inclusion criteria.">
          <textarea className="cra-textarea" value={h.population} onChange={set('population')}
            placeholder="Adults ≥18 years with confirmed HFpEF (EF ≥50%), NYHA class II–III, elevated NT-proBNP…" />
        </F>
        <F label="I — Intervention" hint="What is the experimental treatment or exposure?">
          <textarea className="cra-textarea" value={h.intervention} onChange={set('intervention')}
            placeholder="Empagliflozin 10 mg daily orally for 24 weeks…" style={{ minHeight:64 }} />
        </F>
        <F label="C — Comparator / Control" hint="What is the comparison group?">
          <textarea className="cra-textarea" value={h.comparator} onChange={set('comparator')}
            placeholder="Matching placebo once daily for 24 weeks…" style={{ minHeight:64 }} />
        </F>
        <F label="O — Primary Outcome" hint="What is the primary efficacy or safety outcome?">
          <textarea className="cra-textarea" value={h.primaryOutcome} onChange={set('primaryOutcome')}
            placeholder="Change in 6-minute walk distance from baseline to week 24…" style={{ minHeight:64 }} />
        </F>
        <F label="T — Timeframe" hint="What is the primary assessment timepoint?">
          <input className="cra-input" value={h.timeframe} onChange={set('timeframe')} placeholder="Week 24 (6 months)" />
        </F>
        <div className="cra-divider" />
        <F label="Scientific Rationale" hint="Why this intervention, why now, why this population?">
          <textarea className="cra-textarea" value={h.rationale} onChange={set('rationale')}
            placeholder="Describe the mechanistic basis, prior clinical evidence, and unmet need…" style={{ minHeight:120 }} />
        </F>
      </div>
    </div>
  );
}

function EndpointsTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const e = s.endpoints;
  const set = (k: keyof typeof e) => (ev: React.ChangeEvent<HTMLTextAreaElement|HTMLInputElement>) =>
    update({ ...s, endpoints: { ...e, [k]: ev.target.value } });
  return (
    <div>
      <p className="cra-section-title">Study <em>Endpoints</em></p>
      <div className="cra-stack">
        <div className="cra-grid-2">
          <F label="Primary Endpoint">
            <textarea className="cra-textarea" value={e.primary} onChange={set('primary')}
              placeholder="Change in 6MWD from baseline…" style={{ minHeight:72 }} />
          </F>
          <F label="Primary Assessment Timepoint">
            <input className="cra-input" value={e.primaryTimepoint} onChange={set('primaryTimepoint')} placeholder="Week 24" />
          </F>
        </div>
        <F label="Secondary Endpoints" hint="Separate each endpoint with a new line.">
          <textarea className="cra-textarea" value={e.secondary} onChange={set('secondary')}
            placeholder="• Change in NT-proBNP from baseline to week 24&#10;• KCCQ Total Symptom Score&#10;• Time to first HF hospitalization or CV death" style={{ minHeight:100 }} />
        </F>
        <F label="Safety Endpoints">
          <textarea className="cra-textarea" value={e.safety} onChange={set('safety')}
            placeholder="• Incidence of serious adverse events&#10;• AE-related discontinuations&#10;• Lab abnormalities (eGFR, potassium)…" style={{ minHeight:80 }} />
        </F>
        <F label="Exploratory / Biomarker Endpoints">
          <textarea className="cra-textarea" value={e.exploratory} onChange={set('exploratory')}
            placeholder="• Change in cardiac MRI–derived ECV fraction&#10;• Circulating biomarkers (hs-CRP, IL-6)…" style={{ minHeight:72 }} />
        </F>
        <F label="Patient-Reported Outcome (PRO) Instruments" hint="List validated instruments and their assessment schedule.">
          <input className="cra-input" value={e.proInstruments} onChange={set('proInstruments')} placeholder="KCCQ-12 (baseline, week 12, week 24); EQ-5D-5L (baseline, week 24)" />
        </F>
      </div>
    </div>
  );
}

function DesignTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const d = s.design;
  const set = (k: keyof typeof d) => (v: unknown) => update({ ...s, design: { ...d, [k]: v } });
  const setStr = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => update({ ...s, design: { ...d, [k]: e.target.value } });
  const addArm = () => update({ ...s, design: { ...d, arms: [...d.arms, { id: uid(), name:'', n:'', description:'' }] } });
  const delArm = (id: string) => update({ ...s, design: { ...d, arms: d.arms.filter(a => a.id !== id) } });
  const setArm = (id: string, k: keyof StudyArm, v: string) =>
    update({ ...s, design: { ...d, arms: d.arms.map(a => a.id === id ? { ...a, [k]: v } : a) } });
  return (
    <div>
      <p className="cra-section-title">Study <em>Design</em></p>
      <div className="cra-stack">
        <F label="Design Type"><Chips options={DESIGN_TYPES} value={d.designType} onChange={set('designType') as (v: DesignType) => void} /></F>
        <div className="cra-grid-2">
          <F label="Randomization"><Chips options={RAND_TYPES} value={d.randomization} onChange={set('randomization') as (v: Randomization) => void} /></F>
          <F label="Blinding"><Chips options={BLIND_TYPES} value={d.blinding} onChange={set('blinding') as (v: Blinding) => void} /></F>
        </div>
        <div className="cra-grid-2">
          <F label="Treatment Duration"><input className="cra-input" value={d.treatmentDuration} onChange={setStr('treatmentDuration')} placeholder="24 weeks" /></F>
          <F label="Follow-Up Duration"><input className="cra-input" value={d.followUpDuration} onChange={setStr('followUpDuration')} placeholder="12 months post-treatment" /></F>
        </div>
        <F label="Adaptive Features" hint="Describe interim analyses, adaptive sample-size re-estimation, arm dropping, etc.">
          <textarea className="cra-textarea" value={d.adaptiveFeatures} onChange={setStr('adaptiveFeatures')}
            placeholder="Pre-specified interim analysis at 50% enrollment for futility only (Lan-DeMets spending function, O'Brien-Fleming boundary)…" />
        </F>
        <div className="cra-divider" />
        <p className="cra-subsection">Study Arms</p>
        {d.arms.map(arm => (
          <div key={arm.id} className="cra-list-row">
            <div className="cra-list-row-body">
              <div className="cra-grid-2" style={{ gap:10, marginBottom:8 }}>
                <input className="cra-input" value={arm.name} onChange={e => setArm(arm.id,'name',e.target.value)} placeholder="Arm name (e.g., Empagliflozin 10 mg)" />
                <input className="cra-input" value={arm.n} onChange={e => setArm(arm.id,'n',e.target.value)} placeholder="Target N" />
              </div>
              <input className="cra-input" value={arm.description} onChange={e => setArm(arm.id,'description',e.target.value)} placeholder="Description of intervention/comparator…" />
            </div>
            <button className="cra-list-del" onClick={() => delArm(arm.id)}>×</button>
          </div>
        ))}
        <button className="cra-add-row" onClick={addArm}>+ Add Arm</button>
      </div>
    </div>
  );
}

function StatsTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const st = s.stats;
  const set = (k: keyof typeof st) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    update({ ...s, stats: { ...st, [k]: e.target.value } });
  return (
    <div>
      <p className="cra-section-title">Statistical <em>Plan</em></p>
      <div className="cra-stack">
        <F label="Primary Statistical Analysis" hint="Method, model specification, covariates, and multiplicity strategy.">
          <textarea className="cra-textarea" value={st.primaryAnalysis} onChange={set('primaryAnalysis')}
            placeholder="Mixed-model repeated measures (MMRM) with baseline as covariate, treatment, visit, treatment×visit interaction; unstructured covariance matrix…" style={{ minHeight:100 }} />
        </F>
        <div className="cra-grid-3">
          <F label="Alpha (Two-Sided)"><input className="cra-input" value={st.alpha} onChange={set('alpha')} placeholder="0.05" /></F>
          <F label="Power"><input className="cra-input" value={st.power} onChange={set('power')} placeholder="80%" /></F>
          <F label="Total Sample Size"><input className="cra-input" value={st.sampleSizeTotal} onChange={set('sampleSizeTotal')} placeholder="340" /></F>
        </div>
        <div className="cra-grid-2">
          <F label="Assumed Dropout Rate"><input className="cra-input" value={st.dropoutRate} onChange={set('dropoutRate')} placeholder="15%" /></F>
          <F label="Lead Statistician"><input className="cra-input" value={st.statistician} onChange={set('statistician')} placeholder="Dr. Name, Institution" /></F>
        </div>
        <F label="Analysis Sets" hint="e.g., ITT, modified ITT, Per-Protocol, Safety">
          <input className="cra-input" value={st.analysisSets} onChange={set('analysisSets')} />
        </F>
        <F label="Interim Analyses" hint="Timing, boundaries, DSMB review, adaptive rules.">
          <textarea className="cra-textarea" value={st.interimAnalyses} onChange={set('interimAnalyses')}
            placeholder="One pre-specified interim at 50% information fraction for futility only (O'Brien-Fleming boundary, alpha not spent)…" />
        </F>
        <F label="SAP Status">
          <select className="cra-select" value={st.sapStatus} onChange={set('sapStatus') as React.ChangeEventHandler<HTMLSelectElement>}>
            {SAP_STATUSES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </F>
      </div>
    </div>
  );
}

function IRBTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const irb = s.irb;
  const set  = (k: keyof typeof irb) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    update({ ...s, irb: { ...irb, [k]: e.target.value } });
  const setBool = (k: keyof typeof irb) => (v: boolean) => update({ ...s, irb: { ...irb, [k]: v } });
  const st   = IRB_STATUS_COLOR[irb.irbStatus];
  return (
    <div>
      <p className="cra-section-title">IRB <em>Submission</em></p>
      <div className="cra-stack">
        <div className="cra-grid-2">
          <F label="IRB Review Type"><Chips options={IRB_TYPES} value={irb.irbType} onChange={v => update({ ...s, irb:{ ...irb, irbType: v as IRBType } })} /></F>
          <F label="IRB Status">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <select className="cra-select" value={irb.irbStatus} onChange={set('irbStatus') as React.ChangeEventHandler<HTMLSelectElement>}>
                {IRB_STATUSES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Pill bg={st.bg} color={st.color}>{irb.irbStatus.replace(/-/g,' ')}</Pill>
            </div>
          </F>
        </div>
        <div className="cra-grid-3">
          <F label="IRB Number"><input className="cra-input" value={irb.irbNumber} onChange={set('irbNumber')} placeholder="IRB-2026-0412" /></F>
          <F label="Approval Date"><input className="cra-input" type="date" value={irb.approvalDate} onChange={set('approvalDate')} /></F>
          <F label="Expiration Date"><input className="cra-input" type="date" value={irb.expirationDate} onChange={set('expirationDate')} /></F>
        </div>
        <div className="cra-grid-2">
          <F label="Protocol Version"><input className="cra-input" value={irb.protocolVersion} onChange={set('protocolVersion')} placeholder="1.0" /></F>
          <F label="Informed Consent Form Version"><input className="cra-input" value={irb.icfVersion} onChange={set('icfVersion')} placeholder="1.0" /></F>
        </div>
        <div className="cra-divider" />
        <Toggle on={irb.waiverOfConsent} onChange={setBool('waiverOfConsent')} label="Waiver of Informed Consent Requested" />
        <Toggle on={irb.sIRB} onChange={setBool('sIRB')} label="Single IRB (sIRB) — NIH Policy Applies" />
        {irb.sIRB && (
          <F label="sIRB Lead Institution">
            <input className="cra-input" value={irb.sIRBLeadSite} onChange={set('sIRBLeadSite')} placeholder="Lead academic medical center name" />
          </F>
        )}
        <F label="IRB Notes">
          <textarea className="cra-textarea" value={irb.notes} onChange={set('notes')} placeholder="Conditions of approval, special requirements, correspondence notes…" />
        </F>
      </div>
    </div>
  );
}

function RegulatoryTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const reg = s.regulatory;
  const set  = (k: keyof typeof reg) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    update({ ...s, regulatory: { ...reg, [k]: e.target.value } });
  const setBool = (k: keyof typeof reg) => (v: boolean) => update({ ...s, regulatory: { ...reg, [k]: v } });
  return (
    <div>
      <p className="cra-section-title">FDA <em>Regulatory</em></p>
      <div className="cra-stack">
        <F label="FDA Pathway">
          <Chips options={FDA_PATHWAYS} value={reg.fdaPathway} onChange={v => update({ ...s, regulatory:{ ...reg, fdaPathway: v as FDAPathway } })} />
        </F>
        <div className="cra-grid-2">
          {(reg.fdaPathway === 'ind' || reg.fdaPathway === 'bla' || reg.fdaPathway === 'nda') && (
            <F label="IND Number"><input className="cra-input" value={reg.indNumber} onChange={set('indNumber')} placeholder="IND 123456" /></F>
          )}
          {reg.fdaPathway === 'ide' && (
            <F label="IDE Number"><input className="cra-input" value={reg.ideNumber} onChange={set('ideNumber')} placeholder="G240001" /></F>
          )}
          <F label="ClinicalTrials.gov NCT ID"><input className="cra-input" value={reg.ctGovId} onChange={set('ctGovId')} placeholder="NCT01234567" /></F>
          <F label="EudraCT / EUCTR Number"><input className="cra-input" value={reg.eudraCtNumber} onChange={set('eudraCtNumber')} placeholder="2026-000000-00" /></F>
        </div>
        <div className="cra-divider" />
        <p className="cra-subsection">FDA Meeting History</p>
        <div className="cra-grid-2">
          <div className="cra-stack-sm">
            <Toggle on={reg.preIndMeeting} onChange={setBool('preIndMeeting')} label="Pre-IND Meeting Completed" />
            {reg.preIndMeeting && <F label="Pre-IND Meeting Date"><input className="cra-input" type="date" value={reg.preIndDate} onChange={set('preIndDate')} /></F>}
          </div>
          <div className="cra-stack-sm">
            <Toggle on={reg.typeBMeeting} onChange={setBool('typeBMeeting')} label="Type B Meeting Completed" />
            {reg.typeBMeeting && (
              <>
                <F label="Type B Meeting Date"><input className="cra-input" type="date" value={reg.typeBDate} onChange={set('typeBDate')} /></F>
                <F label="Key Agreements / Minutes Summary">
                  <textarea className="cra-textarea" value={reg.typeBNotes} onChange={set('typeBNotes')} placeholder="FDA agreed to: primary endpoint, statistical approach, proposed labeling strategy…" style={{ minHeight:72 }} />
                </F>
              </>
            )}
          </div>
        </div>
        <F label="Regulatory Strategy Notes">
          <textarea className="cra-textarea" value={reg.notes} onChange={set('notes')} placeholder="Breakthrough Therapy designation, Fast Track status, accelerated approval strategy…" />
        </F>
      </div>
    </div>
  );
}

function SitesTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const en = s.enrollment;
  const setEn = (k: keyof typeof en) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    update({ ...s, enrollment: { ...en, [k]: e.target.value } });
  const addSite = () => update({ ...s, sites: [...s.sites, { id:uid(), name:'', pi:'', country:'United States', target:'', enrolled:'0', status:'pending' }] });
  const delSite = (id: string) => update({ ...s, sites: s.sites.filter(si => si.id !== id) });
  const setSite = (id: string, k: keyof Site, v: string) =>
    update({ ...s, sites: s.sites.map(si => si.id === id ? { ...si, [k]: v } : si) });
  const totalEnrolled = s.sites.reduce((sum, si) => sum + (parseInt(si.enrolled)||0), 0);
  return (
    <div>
      <p className="cra-section-title">Sites &amp; <em>Enrollment</em></p>
      <p className="cra-subsection">Enrollment Tracking</p>
      <div className="cra-grid-3" style={{ marginBottom:24 }}>
        <F label="Enrollment Target"><input className="cra-input" value={en.target} onChange={setEn('target')} placeholder="340" /></F>
        <F label="Currently Enrolled"><input className="cra-input" value={en.enrolled} onChange={setEn('enrolled')} placeholder="0" /></F>
        <F label="Screen Fail Rate"><input className="cra-input" value={en.screenFailRate} onChange={setEn('screenFailRate')} placeholder="30%" /></F>
        <F label="Projected FPI"><input className="cra-input" type="date" value={en.projectedFPI} onChange={setEn('projectedFPI')} /></F>
        <F label="Projected LPI"><input className="cra-input" type="date" value={en.projectedLPI} onChange={setEn('projectedLPI')} /></F>
        <F label="Projected Database Lock"><input className="cra-input" type="date" value={en.projectedDBL} onChange={setEn('projectedDBL')} /></F>
      </div>
      <div className="cra-divider" />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <p className="cra-subsection" style={{ margin:0 }}>Sites ({s.sites.length}) — {totalEnrolled.toLocaleString()} enrolled</p>
      </div>
      {s.sites.map(site => (
        <div key={site.id} className="cra-list-row">
          <div className="cra-list-row-body">
            <div className="cra-grid-3" style={{ gap:10 }}>
              <input className="cra-input" value={site.name} onChange={e => setSite(site.id,'name',e.target.value)} placeholder="Site / Institution name" />
              <input className="cra-input" value={site.pi} onChange={e => setSite(site.id,'pi',e.target.value)} placeholder="Principal Investigator" />
              <input className="cra-input" value={site.country} onChange={e => setSite(site.id,'country',e.target.value)} placeholder="Country" />
            </div>
            <div className="cra-grid-3" style={{ gap:10, marginTop:8 }}>
              <input className="cra-input" value={site.target} onChange={e => setSite(site.id,'target',e.target.value)} placeholder="Target N" />
              <input className="cra-input" value={site.enrolled} onChange={e => setSite(site.id,'enrolled',e.target.value)} placeholder="Enrolled" />
              <select className="cra-select" value={site.status} onChange={e => setSite(site.id,'status',e.target.value)}>
                <option value="pending">Pending Activation</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <button className="cra-list-del" onClick={() => delSite(site.id)}>×</button>
        </div>
      ))}
      <button className="cra-add-row" onClick={addSite}>+ Add Site</button>
      <F label="Enrollment Notes" hint="Recruitment strategies, site performance, competing trials.">
        <textarea className="cra-textarea" value={en.notes} onChange={setEn('notes')} placeholder="Site selection rationale, recruitment strategies, competing protocols…" />
      </F>
    </div>
  );
}

function SafetyTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const sf = s.safety;
  const setSf  = (k: keyof typeof sf) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    update({ ...s, safety: { ...sf, [k]: e.target.value } });
  const addAE  = () => update({ ...s, safety: { ...sf, adverseEvents: [...sf.adverseEvents, { id:uid(), date:'', description:'', severity:'grade-1', relation:'possible', status:'open', susar:false }] } });
  const delAE  = (id: string) => update({ ...s, safety: { ...sf, adverseEvents: sf.adverseEvents.filter(a => a.id !== id) } });
  const setAE  = (id: string, k: keyof AdverseEvent, v: unknown) =>
    update({ ...s, safety: { ...sf, adverseEvents: sf.adverseEvents.map(a => a.id === id ? { ...a, [k]: v } : a) } });
  return (
    <div>
      <p className="cra-section-title">Safety <em>Monitoring</em></p>
      <div className="cra-stack" style={{ marginBottom:24 }}>
        <Toggle on={sf.dsmbRequired} onChange={v => update({ ...s, safety:{ ...sf, dsmbRequired:v } })} label="DSMB / Safety Monitoring Committee Required" />
        {sf.dsmbRequired && (
          <div className="cra-grid-2">
            <F label="DSMB Meeting Frequency"><input className="cra-input" value={sf.dsmbFrequency} onChange={setSf('dsmbFrequency')} placeholder="Every 6 months" /></F>
          </div>
        )}
        <F label="Pre-Specified Stopping Rules">
          <textarea className="cra-textarea" value={sf.stoppingRules} onChange={setSf('stoppingRules')}
            placeholder="• ≥3 Grade 4 AEs causally related to study drug&#10;• 2 treatment-related deaths&#10;• Futility at interim per Lan-DeMets boundary…" />
        </F>
      </div>
      <div className="cra-divider" />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <p className="cra-subsection" style={{ margin:0 }}>Adverse Events ({sf.adverseEvents.length})</p>
      </div>
      {sf.adverseEvents.length === 0 && <div className="cra-empty-state">No adverse events recorded</div>}
      {sf.adverseEvents.map(ae => (
        <div key={ae.id} className="cra-list-row">
          <div className="cra-list-row-body">
            <div className="cra-grid-3" style={{ gap:10 }}>
              <input className="cra-input" type="date" value={ae.date} onChange={e => setAE(ae.id,'date',e.target.value)} />
              <select className="cra-select" value={ae.severity} onChange={e => setAE(ae.id,'severity',e.target.value)}>
                {AE_SEVERITIES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select className="cra-select" value={ae.relation} onChange={e => setAE(ae.id,'relation',e.target.value)}>
                {AE_RELATIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <input className="cra-input" value={ae.description} onChange={e => setAE(ae.id,'description',e.target.value)}
              placeholder="Adverse event description…" style={{ marginTop:8 }} />
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:8 }}>
              <select className="cra-select" value={ae.status} onChange={e => setAE(ae.id,'status',e.target.value)} style={{ flex:1 }}>
                {AE_STATUSES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Toggle on={ae.susar} onChange={v => setAE(ae.id,'susar',v)} label="SUSAR" />
              <Pill bg={`${AE_SEV_COLOR[ae.severity]}22`} color={AE_SEV_COLOR[ae.severity]}>{ae.severity.replace('-',' ')}</Pill>
            </div>
          </div>
          <button className="cra-list-del" onClick={() => delAE(ae.id)}>×</button>
        </div>
      ))}
      <button className="cra-add-row" onClick={addAE}>+ Log Adverse Event</button>
    </div>
  );
}

function MilestonesTab({ s, update }: { s: CRState; update: (v: CRState) => void }) {
  const cycle = (id: string) => update({ ...s, milestones: s.milestones.map(m => m.id === id ? { ...m, status: MILESTONE_STATUS_NEXT[m.status] } : m) });
  const setDate = (id: string, v: string) => update({ ...s, milestones: s.milestones.map(m => m.id === id ? { ...m, targetDate: v } : m) });
  const STATUS_ICON: Record<MilestoneStatus, string> = { planned:'', 'in-progress':'◑', done:'✓', blocked:'!' };
  const STATUS_COLOR: Record<MilestoneStatus, string> = { planned:'var(--text-4)', 'in-progress':'var(--cyan)', done:'var(--accent)', blocked:'var(--rose)' };
  return (
    <div>
      <p className="cra-section-title">Study <em>Milestones</em></p>
      <p style={{ fontSize:12, color:'var(--text-4)', marginBottom:20, fontFamily:'var(--mono)' }}>Click a milestone to cycle its status.</p>
      {M_PHASES.map(phase => {
        const items = s.milestones.filter(m => m.phase === phase);
        if (!items.length) return null;
        return (
          <div key={phase} style={{ marginBottom:24 }}>
            <p className="cra-subsection">{phase.replace('-',' ')}</p>
            {items.map(m => (
              <div key={m.id} className={`cra-milestone ${m.status}`} onClick={() => cycle(m.id)}>
                <div className="cra-milestone-check" style={{ color: STATUS_COLOR[m.status], borderColor: STATUS_COLOR[m.status] }}>
                  {STATUS_ICON[m.status]}
                </div>
                <span className="cra-milestone-title">{m.title}</span>
                <input
                  type="date"
                  className="cra-input"
                  value={m.targetDate}
                  style={{ width:140, padding:'4px 8px', fontSize:11 }}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setDate(m.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── CONSORT Diagram ───────────────────────────────────────────────────────────

function DiagramTab({ s }: { s: CRState }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const arms = s.design.arms.length > 0 ? s.design.arms : [
    { id:'a', name:'Treatment Arm', n:'', description:'' },
    { id:'b', name:'Control Arm',   n:'', description:'' },
  ];
  const enrollment = s.enrollment.target ? `N = ${s.enrollment.target}` : 'N = ?';
  const isSingleArm = s.design.designType === 'single-arm' || s.design.designType === 'dose-escalation';

  const W = 760, H = 520;
  const CX = 380, BW = 200, BH = 48;
  const A0X = 55, A1X = 505, AW = 195, AH = 58;
  const a0cx = A0X + AW / 2, a1cx = A1X + AW / 2;

  function downloadSvg() {
    if (!svgRef.current) return;
    const data = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'consort-diagram.svg'; a.click();
    URL.revokeObjectURL(url);
  }

  const Box = ({ x, y, w=BW, h=BH, lines, color='#10B981' }: {
    x:number; y:number; w?:number; h?:number; lines:[string,string?]; color?:string;
  }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5}
        fill="rgba(7,21,16,0.9)" stroke={color} strokeWidth={1.2} />
      <text x={x+w/2} y={y+h/2-(lines[1]?7:0)} textAnchor="middle"
        fill="#D1FAE5" fontSize={10.5} fontFamily="'SF Mono',monospace" fontWeight={500}>
        {lines[0]}
      </text>
      {lines[1] && (
        <text x={x+w/2} y={y+h/2+10} textAnchor="middle"
          fill="#6B8F7E" fontSize={9.5} fontFamily="'SF Mono',monospace">
          {lines[1]}
        </text>
      )}
    </g>
  );

  const Arrow = ({ x1,y1,x2,y2 }: {x1:number;y1:number;x2:number;y2:number}) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="rgba(16,185,129,0.4)" strokeWidth={1.5} markerEnd="url(#arr)" />
  );
  const Conn = ({ x1,y1,x2,y2 }: {x1:number;y1:number;x2:number;y2:number}) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="rgba(16,185,129,0.25)" strokeWidth={1.5} />
  );

  const PhaseLabel = ({ label, y, color }: { label:string; y:number; color:string }) => (
    <g>
      <rect x={0} y={y} width={48} height={20} rx={3} fill={`${color}18`} />
      <text x={24} y={y+13} textAnchor="middle" fill={color}
        fontSize={8} fontFamily="'SF Mono',monospace" fontWeight={600} letterSpacing={1}>
        {label}
      </text>
    </g>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <p className="cra-section-title" style={{ margin:0 }}>CONSORT <em>Flow Diagram</em></p>
        <button className="cra-ghost-btn" onClick={downloadSvg}>↓ Export SVG</button>
      </div>
      <p style={{ fontSize:11, color:'var(--text-4)', fontFamily:'var(--mono)', marginBottom:20 }}>
        Auto-generated from your study design. Add arms in the Design tab to update.
      </p>
      <div className="cra-diagram-wrap">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block' }}
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arr" markerWidth={7} markerHeight={7} refX={4} refY={2} orient="auto">
              <path d="M0,0 L0,4 L6,2 z" fill="rgba(16,185,129,0.5)" />
            </marker>
            <pattern id="dotgrid" x={0} y={0} width={20} height={20} patternUnits="userSpaceOnUse">
              <circle cx={1} cy={1} r={0.6} fill="rgba(16,185,129,0.07)" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width={W} height={H} fill="url(#dotgrid)" rx={8} />

          {/* Phase band backgrounds */}
          <rect x={0} y={0}   width={W} height={178} rx={0} fill="rgba(16,185,129,0.03)" />
          <rect x={0} y={183} width={W} height={97}  fill="rgba(6,182,212,0.03)"   />
          <rect x={0} y={285} width={W} height={115} fill="rgba(139,92,246,0.03)"  />
          <rect x={0} y={405} width={W} height={115} fill="rgba(245,158,11,0.03)"  />

          {/* Dividers */}
          {[178,280,400].map(y => (
            <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          ))}

          {/* Phase labels */}
          <PhaseLabel label="ENROLL" y={76}  color="#10B981" />
          <PhaseLabel label="ALLOC"  y={218} color="#06B6D4" />
          <PhaseLabel label="FOLLOW" y={322} color="#8B5CF6" />
          <PhaseLabel label="ANAL"   y={440} color="#F59E0B" />

          {isSingleArm ? (
            /* ── Single-arm flow ── */
            <>
              <Box x={CX-100} y={18}  lines={[`Assessed for eligibility`, enrollment]} color="#10B981" />
              <Arrow x1={CX} y1={66} x2={CX} y2={130} />
              <Box x={CX-100} y={130} lines={[`Enrolled (${enrollment})`]}           color="#10B981" />
              <Box x={CX-100} y={200} h={58} lines={[`Allocated to ${arms[0]?.name || 'Intervention'}`, arms[0]?.n ? `n = ${arms[0].n}` : 'n = ?']} color="#06B6D4" />
              <Arrow x1={CX} y1={178} x2={CX} y2={200} />
              <Box x={CX-100} y={320} lines={[`Lost to follow-up`, 'n = ?']}         color="#8B5CF6" />
              <Arrow x1={CX} y1={258} x2={CX} y2={320} />
              <Box x={CX-100} y={440} lines={[`Analysed`, 'n = ?']}                  color="#F59E0B" />
              <Arrow x1={CX} y1={388} x2={CX} y2={440} />
            </>
          ) : (
            /* ── Multi-arm flow ── */
            <>
              {/* ENROLLMENT */}
              <Box x={CX-100} y={18} lines={['Assessed for eligibility', enrollment]} color="#10B981" />
              {/* fork line down from assessed */}
              <Conn x1={CX} y1={66} x2={CX} y2={100} />
              {/* fork right to excluded */}
              <Conn x1={CX} y1={100} x2={510} y2={100} />
              <Arrow x1={510} y1={100} x2={510} y2={90} />
              {/* excluded box */}
              <rect x={510} y={66} width={220} height={68} rx={5}
                fill="rgba(7,21,16,0.9)" stroke="rgba(244,63,94,0.5)" strokeWidth={1} />
              <text x={620} y={88} textAnchor="middle" fill="#F43F5E"
                fontSize={9.5} fontFamily="'SF Mono',monospace" fontWeight={600}>Excluded (n = ?)</text>
              <text x={620} y={103} textAnchor="middle" fill="#6B4E52"
                fontSize={9} fontFamily="'SF Mono',monospace">Not meeting criteria (n = ?)</text>
              <text x={620} y={117} textAnchor="middle" fill="#6B4E52"
                fontSize={9} fontFamily="'SF Mono',monospace">Declined participation (n = ?)</text>
              {/* continue down from fork to randomized */}
              <Arrow x1={CX} y1={100} x2={CX} y2={130} />
              <Box x={CX-100} y={130} lines={['Randomized', enrollment]} color="#10B981" />

              {/* ALLOCATION — split fork */}
              <Conn x1={CX} y1={178} x2={CX} y2={198} />
              <Conn x1={a0cx} y1={198} x2={a1cx} y2={198} />
              <Arrow x1={a0cx} y1={198} x2={a0cx} y2={200} />
              <Arrow x1={a1cx} y1={198} x2={a1cx} y2={200} />
              <Box x={A0X} y={200} w={AW} h={AH}
                lines={[arms[0]?.name || 'Arm A', arms[0]?.n ? `n = ${arms[0].n}` : 'n = ?']}
                color="#06B6D4" />
              <Box x={A1X} y={200} w={AW} h={AH}
                lines={[arms[1]?.name || 'Arm B', arms[1]?.n ? `n = ${arms[1].n}` : 'n = ?']}
                color="#06B6D4" />

              {/* FOLLOW-UP */}
              <Arrow x1={a0cx} y1={258} x2={a0cx} y2={312} />
              <Arrow x1={a1cx} y1={258} x2={a1cx} y2={312} />
              <Box x={A0X} y={312} w={AW} h={58}
                lines={['Lost to follow-up', 'n = ?']} color="#8B5CF6" />
              <Box x={A1X} y={312} w={AW} h={58}
                lines={['Lost to follow-up', 'n = ?']} color="#8B5CF6" />

              {/* ANALYSIS */}
              <Arrow x1={a0cx} y1={370} x2={a0cx} y2={430} />
              <Arrow x1={a1cx} y1={370} x2={a1cx} y2={430} />
              <Box x={A0X} y={430} w={AW}
                lines={['Analysed', arms[0]?.n ? `n = ${arms[0].n}` : 'n = ?']} color="#F59E0B" />
              <Box x={A1X} y={430} w={AW}
                lines={['Analysed', arms[1]?.n ? `n = ${arms[1].n}` : 'n = ?']} color="#F59E0B" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── AI Protocol Assistant ─────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Draft my PICO statement',
  'Suggest primary endpoints',
  'Flag IRB risks',
  'Generate inclusion/exclusion criteria',
  'Review statistical plan',
  'FDA submission strategy',
  'Write consent language',
  'CONSORT checklist',
];

function FloatingChat({ s, open, onClose }: { s: CRState; open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content: string }[]>([]);
  const [input, setInput]       = useState('');
  const [streaming, setStreaming] = useState(false);
  const [current, setCurrent]   = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, current]);

  async function send(msg: string) {
    if (!msg.trim() || streaming) return;
    const userMsg = { role: 'user' as const, content: msg.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setCurrent('');
    try {
      const res = await fetch('/api/clinicalresearch/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context: s }),
      });
      if (!res.ok || !res.body) throw new Error('Stream error');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setCurrent(text);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      setCurrent('');
    } catch { /* noop */ } finally { setStreaming(false); }
  }

  return (
    <div className={`cra-chat-drawer${open ? ' open' : ''}`}>
      <div className="cra-chat-header">
        <div>
          <div className="cra-chat-title">Protocol <em>Assistant</em></div>
          <div className="cra-chat-sub">Powered by Claude Opus</div>
        </div>
        <button className="cra-chat-close" onClick={onClose}>×</button>
      </div>

      <div className="cra-chat-messages">
        {messages.length === 0 && !streaming && (
          <div className="cra-chat-empty">
            <div style={{ fontSize:28, opacity:.15, marginBottom:10 }}>◎</div>
            <div style={{ fontSize:12, color:'var(--text-4)', fontFamily:'var(--mono)' }}>
              Ask me anything about your protocol — design, endpoints, IRB, regulatory strategy.
            </div>
            <div className="cra-chat-quick-btns">
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="cra-chat-quick" onClick={() => send(p)}>{p}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`cra-chat-msg ${m.role}`}>
            <div className="cra-chat-role">{m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div className="cra-chat-content">{m.content}</div>
          </div>
        ))}
        {streaming && (
          <div className="cra-chat-msg assistant">
            <div className="cra-chat-role">Assistant</div>
            <div className="cra-chat-content">{current || <span className="cra-chat-cursor" />}</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="cra-chat-input-row">
        <textarea
          className="cra-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about design, endpoints, IRB, regulations…"
          rows={2}
          disabled={streaming}
        />
        <button className="cra-chat-send" onClick={() => send(input)} disabled={streaming || !input.trim()}>
          {streaming ? '…' : '↑'}
        </button>
      </div>
    </div>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV: { heading: string; color: string; items: { id: Tab; label: string }[] }[] = [
  { heading:'Overview',    color:'#10B981', items:[{ id:'dashboard',  label:'Dashboard' }, { id:'milestones', label:'Timeline' }, { id:'diagram', label:'CONSORT Diagram' }] },
  { heading:'Discover',    color:'#06B6D4', items:[{ id:'hypothesis', label:'PICO / Hypothesis' }, { id:'endpoints', label:'Endpoints' }] },
  { heading:'Design',      color:'#8B5CF6', items:[{ id:'design',     label:'Study Design' }, { id:'stats',      label:'Statistical Plan' }] },
  { heading:'Regulatory',  color:'#F59E0B', items:[{ id:'irb',        label:'IRB & Ethics' }, { id:'regulatory', label:'FDA Pathway' }] },
  { heading:'Operations',  color:'#F43F5E', items:[{ id:'sites',      label:'Sites & Enrollment' }, { id:'safety', label:'Safety Monitoring' }] },
];

const PHASE_BG: Record<StudyPhase, string> = { 'phase-1':'rgba(16,185,129,.12)','phase-1-2':'rgba(16,185,129,.12)','phase-2':'rgba(6,182,212,.12)','phase-2-3':'rgba(6,182,212,.12)','phase-3':'rgba(139,92,246,.12)','phase-4':'rgba(245,158,11,.12)','na':'rgba(16,185,129,.12)' };

// ── Main App ──────────────────────────────────────────────────────────────────

export default function ClinicalResearchApp() {
  const [tab,       setTab]       = useState<Tab>('dashboard');
  const [projects,  setProjects]  = useState<ProjectMeta[]>([]);
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [state,     setState]     = useState<CRState>(DEFAULT_STATE);
  const [creating,  setCreating]  = useState(false);
  const [newTitle,  setNewTitle]  = useState('');
  const [hydrated,  setHydrated]  = useState(false);
  const [chatOpen,  setChatOpen]  = useState(false);

  useEffect(() => {
    const { projects: ps, activeId: aid } = loadProjects();
    setProjects(ps);
    setActiveId(aid);
    if (aid) setState(loadProjectData(aid));
    setHydrated(true);
  }, []);

  const update = useCallback((next: CRState) => {
    setState(next);
    if (activeId) setProjects(ps => persistProject(activeId, next, ps));
  }, [activeId]);

  function createProject() {
    if (!newTitle.trim()) return;
    const id   = uid();
    const meta: ProjectMeta = { id, title: newTitle.trim(), indication:'', phase:'phase-2', updatedAt: new Date().toISOString() };
    const ps   = [...projects, meta];
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(ps));
    const fresh = { ...DEFAULT_STATE, protocolTitle: newTitle.trim() };
    localStorage.setItem(PROJECT_KEY(id), JSON.stringify(fresh));
    localStorage.setItem(ACTIVE_KEY, id);
    setProjects(ps); setActiveId(id); setState(fresh); setCreating(false); setNewTitle(''); setTab('dashboard');
  }

  function switchProject(id: string) {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id); setState(loadProjectData(id)); setTab('dashboard');
  }

  function deleteProject(id: string) {
    const ps = projects.filter(p => p.id !== id);
    localStorage.removeItem(PROJECT_KEY(id));
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(ps));
    setProjects(ps);
    if (activeId === id) {
      const next = ps[0] ?? null;
      setActiveId(next?.id ?? null);
      setState(next ? loadProjectData(next.id) : DEFAULT_STATE);
      if (next) localStorage.setItem(ACTIVE_KEY, next.id);
      else localStorage.removeItem(ACTIVE_KEY);
    }
  }

  if (!hydrated) return null;

  const phaseLabel = PHASES.find(([v]) => v === state.phase)?.[1] ?? '';
  const phaseColor = PHASE_COLOR[state.phase] ?? '#10B981';
  const phaseBg    = PHASE_BG[state.phase] ?? 'rgba(16,185,129,.12)';

  return (
    <div className="cra-root cr-root">
      {/* Sidebar */}
      <aside className="cra-sidebar">
        <div className="cra-sidebar-logo">
          <Link href="/clinicalresearch" style={{ textDecoration:'none' }}>
            <div className="cra-sidebar-logo-name">Ambient <em style={{ fontStyle:'italic', color:'var(--text-2)' }}>Intelligence</em></div>
            <div className="cra-sidebar-logo-sub">Clinical Research</div>
          </Link>
        </div>

        <div className="cra-sidebar-projects">
          {creating ? (
            <div style={{ display:'flex', gap:6 }}>
              <input className="cra-input" style={{ fontSize:11, padding:'6px 8px' }} autoFocus
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') createProject(); if (e.key==='Escape') setCreating(false); }}
                placeholder="Protocol title…" />
              <button className="cra-action-btn" style={{ height:32, padding:'0 12px', fontSize:10 }} onClick={createProject}>Add</button>
            </div>
          ) : (
            <button className="cra-new-btn" onClick={() => setCreating(true)}>+ New Protocol</button>
          )}
          <div className="cra-project-list">
            {projects.map(p => (
              <div key={p.id} className={`cra-project-row${p.id === activeId ? ' active' : ''}`} onClick={() => switchProject(p.id)}>
                <div className="cra-project-dot" />
                <span className="cra-project-name">{p.title || 'Untitled Protocol'}</span>
                <button className="cra-project-del" onClick={e => { e.stopPropagation(); deleteProject(p.id); }}>×</button>
              </div>
            ))}
          </div>
        </div>

        <nav className="cra-sidebar-nav">
          {NAV.map(group => (
            <div key={group.heading}>
              <div className="cra-nav-heading">
                <span className="cra-nav-heading-dot" style={{ background: group.color }} />
                {group.heading}
              </div>
              {group.items.map(item => (
                <button key={item.id}
                  className={`cra-nav-tab${tab === item.id ? ' active' : ''}`}
                  onClick={() => setTab(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Body */}
      <div className="cra-body">
        <header className="cra-topbar">
          <div className="cra-topbar-left">
            <span className="cra-topbar-title">{state.protocolTitle || 'Untitled Protocol'}</span>
            {state.indication && <>
              <span className="cra-topbar-sep">·</span>
              <span className="cra-topbar-indication">{state.indication}</span>
            </>}
          </div>
          <div className="cra-topbar-right">
            {state.phase !== 'na' && (
              <span className="cra-badge" style={{ color: phaseColor, background: phaseBg }}>
                {phaseLabel}
              </span>
            )}
            {state.studyType && (
              <span className="cra-badge" style={{ color:'var(--text-3)', background:'var(--surface-2)', textTransform:'capitalize' }}>
                {state.studyType}
              </span>
            )}
            {state.irb.irbStatus === 'approved' && (
              <span className="cra-badge" style={{ color:'#10B981', background:'rgba(16,185,129,.12)' }}>IRB ✓</span>
            )}
            <button className="cra-ai-btn" onClick={() => setChatOpen(o => !o)}>
              ◎ AI Assistant
            </button>
          </div>
        </header>

        <FloatingChat s={state} open={chatOpen} onClose={() => setChatOpen(false)} />
        <main className={`cra-main${chatOpen ? ' chat-open' : ''}`}>
          {!activeId ? (
            <div className="cra-empty-workspace">
              <div style={{ fontSize:48, opacity:.15 }}>◎</div>
              <div className="cra-empty-title">No protocol selected</div>
              <div className="cra-empty-sub">Create a new protocol to start building your study design, IRB submission, and regulatory strategy.</div>
              <button className="cra-action-btn" onClick={() => setCreating(true)}>+ New Protocol</button>
            </div>
          ) : (
            <>
              {/* Protocol metadata strip */}
              {tab !== 'dashboard' && (
                <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' }}>
                  <div style={{ flex:2, minWidth:180 }}>
                    <label className="cra-label">Protocol Title</label>
                    <input className="cra-input" style={{ marginTop:5 }} value={state.protocolTitle}
                      onChange={e => update({ ...state, protocolTitle: e.target.value })} placeholder="Full protocol title…" />
                  </div>
                  <div style={{ flex:1, minWidth:120 }}>
                    <label className="cra-label">Indication</label>
                    <input className="cra-input" style={{ marginTop:5 }} value={state.indication}
                      onChange={e => update({ ...state, indication: e.target.value })} placeholder="e.g., HFpEF" />
                  </div>
                  <div style={{ flex:1, minWidth:120 }}>
                    <label className="cra-label">Phase</label>
                    <select className="cra-select" style={{ marginTop:5 }} value={state.phase}
                      onChange={e => update({ ...state, phase: e.target.value as StudyPhase })}>
                      {PHASES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1, minWidth:120 }}>
                    <label className="cra-label">Study Type</label>
                    <select className="cra-select" style={{ marginTop:5 }} value={state.studyType}
                      onChange={e => update({ ...state, studyType: e.target.value as StudyType })}>
                      {STUDY_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {tab === 'dashboard'  && <DashboardTab s={state} />}
              {tab === 'hypothesis' && <HypothesisTab s={state} update={update} />}
              {tab === 'endpoints'  && <EndpointsTab  s={state} update={update} />}
              {tab === 'design'     && <DesignTab     s={state} update={update} />}
              {tab === 'stats'      && <StatsTab      s={state} update={update} />}
              {tab === 'irb'        && <IRBTab         s={state} update={update} />}
              {tab === 'regulatory' && <RegulatoryTab  s={state} update={update} />}
              {tab === 'sites'      && <SitesTab       s={state} update={update} />}
              {tab === 'safety'     && <SafetyTab      s={state} update={update} />}
              {tab === 'milestones' && <MilestonesTab  s={state} update={update} />}
              {tab === 'diagram'    && <DiagramTab     s={state} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
