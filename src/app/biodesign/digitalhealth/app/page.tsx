'use client';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import '../../digitalhealth.css';

// ── Types ──────────────────────────────────────────────────────────────────────

type ProductType = 'samd' | 'dtx' | 'wellness' | 'rpm' | 'telehealth' | 'ai-ml' | 'other';
type RegulatoryPathway = 'fda-510k' | 'fda-pma' | 'fda-de-novo' | 'fda-exempt' | 'ce-mark' | 'dtx-alliance' | 'wellness-exempt' | 'tbd';
type EvidenceType = 'rct' | 'rwe' | 'single-arm' | 'registry' | 'retrospective' | 'none';
type PrivacyFramework = 'hipaa' | 'gdpr' | 'both' | 'neither';

interface Persona {
  id: string;
  role: string;
  description: string;
  painPoints: string;
  needs: string;
  createdAt: string;
}

interface Milestone {
  id: string;
  title: string;
  phase: 'discover' | 'define' | 'develop' | 'deploy';
  status: 'planned' | 'in-progress' | 'complete' | 'blocked';
  targetDate: string;
  notes: string;
}

interface DHState {
  projectName: string;
  indication: string;
  productType: ProductType;
  description: string;

  problem: {
    patientProblem: string;
    clinicalContext: string;
    targetPopulation: string;
    currentSolutions: string;
    unmetNeed: string;
    jobToBeDone: string;
  };

  personas: Persona[];

  regulatory: {
    pathway: RegulatoryPathway;
    intendedUse: string;
    indicationForUse: string;
    samdCategory: string;
    predicateDevice: string;
    submissionTimeline: string;
    notes: string;
  };

  evidence: {
    type: EvidenceType;
    primaryEndpoint: string;
    secondaryEndpoints: string;
    sampleSize: string;
    duration: string;
    irbRequired: boolean;
    clinicalSites: string;
    notes: string;
  };

  privacy: {
    framework: PrivacyFramework;
    phiElements: string;
    dataResidency: string;
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    soc2Target: boolean;
    hipaaBusinessAssociate: boolean;
    gdprDPA: boolean;
    notes: string;
  };

  reimbursement: {
    cptCodes: string;
    hcpcsCodes: string;
    targetPayers: string;
    valueProposition: string;
    healthEconomics: string;
    rtmStrategy: string;
    notes: string;
  };

  milestones: Milestone[];
}

const DEFAULT_STATE: DHState = {
  projectName: '',
  indication: '',
  productType: 'samd',
  description: '',
  problem: { patientProblem: '', clinicalContext: '', targetPopulation: '', currentSolutions: '', unmetNeed: '', jobToBeDone: '' },
  personas: [],
  regulatory: { pathway: 'tbd', intendedUse: '', indicationForUse: '', samdCategory: '', predicateDevice: '', submissionTimeline: '', notes: '' },
  evidence: { type: 'rct', primaryEndpoint: '', secondaryEndpoints: '', sampleSize: '', duration: '', irbRequired: true, clinicalSites: '', notes: '' },
  privacy: { framework: 'hipaa', phiElements: '', dataResidency: '', encryptionAtRest: true, encryptionInTransit: true, soc2Target: false, hipaaBusinessAssociate: true, gdprDPA: false, notes: '' },
  reimbursement: { cptCodes: '', hcpcsCodes: '', targetPayers: '', valueProposition: '', healthEconomics: '', rtmStrategy: '', notes: '' },
  milestones: [],
};

// ── Storage ────────────────────────────────────────────────────────────────────

const PROJECTS_KEY = 'ambient-dh-projects';
const PROJECT_KEY  = (id: string) => `ambient-dh-project-${id}`;
const ACTIVE_KEY   = 'ambient-dh-active';

interface ProjectMeta { id: string; name: string; indication: string; productType: ProductType; updatedAt: string; createdAt: string; }

function uid() { return Math.random().toString(36).slice(2, 9); }

function loadProjects(): { projects: ProjectMeta[]; activeId: string | null } {
  if (typeof window === 'undefined') return { projects: [], activeId: null };
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      const projects: ProjectMeta[] = JSON.parse(raw);
      const activeId = localStorage.getItem(ACTIVE_KEY) ?? projects[0]?.id ?? null;
      return { projects, activeId };
    }
    return { projects: [], activeId: null };
  } catch { return { projects: [], activeId: null }; }
}

function loadProjectData(id: string): DHState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, problem: { ...DEFAULT_STATE.problem, ...(parsed.problem ?? {}) }, regulatory: { ...DEFAULT_STATE.regulatory, ...(parsed.regulatory ?? {}) }, evidence: { ...DEFAULT_STATE.evidence, ...(parsed.evidence ?? {}) }, privacy: { ...DEFAULT_STATE.privacy, ...(parsed.privacy ?? {}) }, reimbursement: { ...DEFAULT_STATE.reimbursement, ...(parsed.reimbursement ?? {}) }, milestones: parsed.milestones ?? [] };
  } catch { return DEFAULT_STATE; }
}

function persistProject(id: string, state: DHState, projects: ProjectMeta[]): ProjectMeta[] {
  localStorage.setItem(PROJECT_KEY(id), JSON.stringify(state));
  const updated = projects.map(p => p.id === id ? { ...p, name: state.projectName || 'Untitled', indication: state.indication, productType: state.productType, updatedAt: new Date().toISOString() } : p);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  return updated;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-1)', border: '1px solid var(--line)',
  borderRadius: 2, padding: '9px 12px', color: 'var(--text)', fontSize: 13,
  fontFamily: 'var(--sans)', outline: 'none',
};

function Field({ label, value, onChange, multiline = false, placeholder = '', hint = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{label}</label>
      {hint && <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--text-4)', lineHeight: 1.5 }}>{hint}</p>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...fieldStyle, resize: 'vertical' }} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...fieldStyle, height: 38 }} />
      }
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={() => onChange(!value)} style={{
        width: 38, height: 22, borderRadius: 11, position: 'relative',
        background: value ? 'var(--accent)' : 'var(--surface-3)',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 18 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...fieldStyle, height: 38, cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionHeader({ title, subtitle, accent }: { title: string; subtitle?: string; accent?: string }) {
  return (
    <div style={{ marginBottom: 24, borderLeft: `3px solid ${accent ?? 'var(--accent)'}`, paddingLeft: 12 }}>
      <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</h2>
      {subtitle && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-2)' }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: color ?? 'var(--accent)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    </div>
  );
}

// ── Product type options ───────────────────────────────────────────────────────

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'samd', label: 'Software as a Medical Device (SaMD)' },
  { value: 'dtx', label: 'Digital Therapeutic (DTx)' },
  { value: 'wellness', label: 'Wellness / Consumer Health App' },
  { value: 'rpm', label: 'Remote Patient Monitoring (RPM)' },
  { value: 'telehealth', label: 'Telehealth Platform' },
  { value: 'ai-ml', label: 'AI / ML Health Tool' },
  { value: 'other', label: 'Other' },
];

const PATHWAYS: { value: RegulatoryPathway; label: string }[] = [
  { value: 'tbd', label: 'To be determined' },
  { value: 'fda-510k', label: 'FDA 510(k) Premarket Notification' },
  { value: 'fda-pma', label: 'FDA Premarket Approval (PMA)' },
  { value: 'fda-de-novo', label: 'FDA De Novo Classification' },
  { value: 'fda-exempt', label: 'FDA Exempt (Class I)' },
  { value: 'ce-mark', label: 'CE Mark (EU MDR)' },
  { value: 'dtx-alliance', label: 'DTx Alliance Framework' },
  { value: 'wellness-exempt', label: 'Wellness / Not a Medical Device' },
];

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'rct', label: 'Randomized Controlled Trial (RCT)' },
  { value: 'rwe', label: 'Real-World Evidence (RWE)' },
  { value: 'single-arm', label: 'Single-Arm Study' },
  { value: 'registry', label: 'Patient Registry Study' },
  { value: 'retrospective', label: 'Retrospective Analysis' },
  { value: 'none', label: 'No clinical study planned' },
];

const PRIVACY_FRAMEWORKS: { value: PrivacyFramework; label: string }[] = [
  { value: 'hipaa', label: 'HIPAA (US)' },
  { value: 'gdpr', label: 'GDPR (EU/EEA)' },
  { value: 'both', label: 'HIPAA + GDPR' },
  { value: 'neither', label: 'Neither (not handling PHI)' },
];

const MILESTONE_PHASES = ['discover', 'define', 'develop', 'deploy'] as const;
const MILESTONE_STATUSES = ['planned', 'in-progress', 'complete', 'blocked'] as const;
const STATUS_COLOR: Record<string, string> = { planned: '#8B5CF6', 'in-progress': '#3B82F6', complete: '#10B981', blocked: '#F43F5E' };
const STATUS_BG: Record<string, string> = { planned: 'rgba(139,92,246,0.12)', 'in-progress': 'rgba(59,130,246,0.12)', complete: 'rgba(16,185,129,0.12)', blocked: 'rgba(244,63,94,0.12)' };

// ── Tab: Problem ───────────────────────────────────────────────────────────────

function ProblemTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const p = state.problem;
  const set = (k: keyof typeof p) => (v: string) => update({ ...state, problem: { ...p, [k]: v } });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Clinical Problem Framework" subtitle="Define the patient problem before designing a solution." accent="#10B981" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Patient Problem" value={p.patientProblem} onChange={set('patientProblem')} multiline placeholder="What specific clinical problem does the patient experience?" hint="Be precise — avoid 'patients need X' framing." />
        <Field label="Clinical Context" value={p.clinicalContext} onChange={set('clinicalContext')} multiline placeholder="Where and when does this problem occur in the care pathway?" />
        <Field label="Target Population" value={p.targetPopulation} onChange={set('targetPopulation')} placeholder="Age, diagnosis, care setting, payer type..." />
        <Field label="Current Solutions" value={p.currentSolutions} onChange={set('currentSolutions')} multiline placeholder="How is this problem addressed today? What do patients and providers currently use?" />
        <Field label="Unmet Need" value={p.unmetNeed} onChange={set('unmetNeed')} multiline placeholder="What gaps do current solutions leave? Why are they insufficient?" />
        <Field label="Job to Be Done" value={p.jobToBeDone} onChange={set('jobToBeDone')} multiline placeholder="When [situation], patients want to [motivation] so they can [expected outcome]." hint="JTBD framework — focus on the underlying goal, not the feature." />
      </div>
    </div>
  );
}

// ── Tab: User Research ─────────────────────────────────────────────────────────

function UserResearchTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ role: '', description: '', painPoints: '', needs: '' });

  function addPersona() {
    if (!draft.role) return;
    const p: Persona = { id: uid(), ...draft, createdAt: new Date().toISOString() };
    update({ ...state, personas: [...state.personas, p] });
    setDraft({ role: '', description: '', painPoints: '', needs: '' });
    setAdding(false);
  }

  function deletePersona(id: string) {
    update({ ...state, personas: state.personas.filter(p => p.id !== id) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="User Research & Personas" subtitle="Map the people who will use and benefit from your product." accent="#10B981" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{state.personas.length} persona{state.personas.length !== 1 ? 's' : ''} defined</span>
        <button onClick={() => setAdding(true)} style={{
          padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none',
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2,
        }}>+ Add Persona</button>
      </div>

      {adding && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="Role" value={draft.role} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Cardiologist, Chronic Disease Patient, Care Coordinator" />
            <Field label="Brief Description" value={draft.description} onChange={v => setDraft(d => ({ ...d, description: v }))} placeholder="Key demographics, context, and motivations" />
            <Field label="Pain Points" value={draft.painPoints} onChange={v => setDraft(d => ({ ...d, painPoints: v }))} multiline placeholder="What frustrates them today?" />
            <Field label="Key Needs" value={draft.needs} onChange={v => setDraft(d => ({ ...d, needs: v }))} multiline placeholder="What do they need your product to do?" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addPersona} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>Cancel</button>
          </div>
        </Card>
      )}

      {state.personas.map(persona => (
        <Card key={persona.id}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{persona.role}</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{persona.description}</p>
            </div>
            <button onClick={() => deletePersona(persona.id)} style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>✕</button>
          </div>
          {(persona.painPoints || persona.needs) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {persona.painPoints && (
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Pain Points</div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{persona.painPoints}</p>
                </div>
              )}
              {persona.needs && (
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Key Needs</div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{persona.needs}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {state.personas.length === 0 && !adding && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No personas yet — add your first user
        </div>
      )}
    </div>
  );
}

// ── Tab: Regulatory ────────────────────────────────────────────────────────────

function RegulatoryTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const r = state.regulatory;
  const setR = (k: keyof typeof r) => (v: string) => update({ ...state, regulatory: { ...r, [k]: v } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Regulatory Classification" subtitle="Determine your regulatory pathway before building." accent="#8B5CF6" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SelectField label="Regulatory Pathway" value={r.pathway} onChange={setR('pathway')} options={PATHWAYS} />
        <Field label="SaMD Category" value={r.samdCategory} onChange={setR('samdCategory')} placeholder="e.g. Class IIb, Treat / Diagnose, Critical situation" hint="IMDRF SaMD risk framework: significance of information × healthcare situation" />
        <Field label="Intended Use" value={r.intendedUse} onChange={setR('intendedUse')} multiline placeholder="The general purpose of the device and the conditions of use for which it is designed." />
        <Field label="Indication for Use" value={r.indicationForUse} onChange={setR('indicationForUse')} multiline placeholder="The clinical conditions and patient population for which the device is intended." />
        <Field label="Predicate Device / Comparator" value={r.predicateDevice} onChange={setR('predicateDevice')} placeholder="510(k) predicate, CE-marked comparator, or De Novo reference" />
        <Field label="Estimated Submission Timeline" value={r.submissionTimeline} onChange={setR('submissionTimeline')} placeholder="e.g. Q3 2026 — 510(k) pre-submission" />
        <Field label="Notes & Open Questions" value={r.notes} onChange={setR('notes')} multiline placeholder="Key uncertainties, pending FDA guidance, regulatory counsel notes..." />
      </div>

      {/* Pathway reference */}
      <Card style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Pathway Quick Reference</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { name: '510(k)', note: 'Substantial equivalence to predicate. Most SaMD Class II. 3–12 months.', color: '#8B5CF6' },
            { name: 'De Novo', note: 'Novel low-to-moderate risk device without a predicate. 12–24 months.', color: '#3B82F6' },
            { name: 'DTx / Wellness', note: 'No FDA clearance if not meeting device definition. Validate against FDCA §201(h).', color: '#10B981' },
          ].map((p, i) => (
            <div key={i} style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 2, borderLeft: `3px solid ${p.color}` }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 6 }}>{p.name}</div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.55 }}>{p.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Evidence ──────────────────────────────────────────────────────────────

function EvidenceTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const e = state.evidence;
  const setE = (k: keyof typeof e) => (v: string | boolean) => update({ ...state, evidence: { ...e, [k]: v } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Clinical Evidence Plan" subtitle="Design the study that will support your regulatory submission and payer negotiations." accent="#3B82F6" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SelectField label="Study Type" value={e.type} onChange={v => setE('type')(v)} options={EVIDENCE_TYPES} />
        <Field label="Sample Size" value={e.sampleSize} onChange={v => setE('sampleSize')(v)} placeholder="e.g. N=240 (80% power, α=0.05, δ=15%)" />
        <Field label="Primary Endpoint" value={e.primaryEndpoint} onChange={v => setE('primaryEndpoint')(v)} multiline placeholder="The single pre-specified outcome that defines trial success." />
        <Field label="Secondary Endpoints" value={e.secondaryEndpoints} onChange={v => setE('secondaryEndpoints')(v)} multiline placeholder="Supporting outcomes — QoL, health economics, safety signals..." />
        <Field label="Study Duration" value={e.duration} onChange={v => setE('duration')(v)} placeholder="e.g. 12-week intervention, 6-month follow-up" />
        <Field label="Clinical Sites" value={e.clinicalSites} onChange={v => setE('clinicalSites')(v)} placeholder="Number and type of sites, geographic scope" />
        <Field label="Notes" value={e.notes} onChange={v => setE('notes')(v)} multiline placeholder="IRB considerations, enrollment challenges, interim analyses..." />
      </div>
      <Card>
        <Toggle label="IRB / Ethics Board approval required" value={e.irbRequired} onChange={v => setE('irbRequired')(v)} />
      </Card>
    </div>
  );
}

// ── Tab: Privacy ───────────────────────────────────────────────────────────────

function PrivacyTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const p = state.privacy;
  const setP = (k: keyof typeof p) => (v: string | boolean) => update({ ...state, privacy: { ...p, [k]: v } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Privacy & Security" subtitle="Map your obligations before handling any health data." accent="#F59E0B" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SelectField label="Privacy Framework" value={p.framework} onChange={v => setP('framework')(v)} options={PRIVACY_FRAMEWORKS} />
        <Field label="PHI / Personal Data Elements" value={p.phiElements} onChange={v => setP('phiElements')(v)} multiline placeholder="List every category of health or personal data you collect: diagnosis codes, vitals, location, demographics..." />
        <Field label="Data Residency Requirements" value={p.dataResidency} onChange={v => setP('dataResidency')(v)} placeholder="e.g. US-only (AWS us-east-1), EU data within EEA" />
        <Field label="Notes & Open Questions" value={p.notes} onChange={v => setP('notes')(v)} multiline placeholder="BAA vendors, consent workflow, data retention policy, breach notification plan..." />
      </div>

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Toggle label="Encryption at rest" value={p.encryptionAtRest} onChange={v => setP('encryptionAtRest')(v)} />
          <Toggle label="Encryption in transit (TLS 1.2+)" value={p.encryptionInTransit} onChange={v => setP('encryptionInTransit')(v)} />
          <Toggle label="SOC 2 Type II target" value={p.soc2Target} onChange={v => setP('soc2Target')(v)} />
          <Toggle label="HIPAA Business Associate Agreement (BAA)" value={p.hipaaBusinessAssociate} onChange={v => setP('hipaaBusinessAssociate')(v)} />
          <Toggle label="GDPR Data Processing Agreement (DPA)" value={p.gdprDPA} onChange={v => setP('gdprDPA')(v)} />
        </div>
      </Card>

      <Card style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Security Baseline Checklist</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'OWASP Top 10 mitigations in place',
            'Penetration test completed (annual)',
            'Vulnerability management program active',
            'Access control: role-based, least-privilege',
            'Audit logging for all PHI access',
            'Incident response plan documented and tested',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-3)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab: Reimbursement ─────────────────────────────────────────────────────────

function ReimbursementTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const r = state.reimbursement;
  const setR = (k: keyof typeof r) => (v: string) => update({ ...state, reimbursement: { ...r, [k]: v } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Reimbursement Strategy" subtitle="Map the path from regulatory clearance to paid adoption." accent="#F43F5E" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="CPT Codes" value={r.cptCodes} onChange={setR('cptCodes')} placeholder="e.g. 99453, 99454, 99457 (RPM); 96127 (digital mental health screening)" hint="Remote Patient Monitoring: 99453–99458. Remote Therapeutic Monitoring: 98975–98981." />
        <Field label="HCPCS Codes" value={r.hcpcsCodes} onChange={setR('hcpcsCodes')} placeholder="e.g. G2025, G2010, G0511" />
        <Field label="Target Payers" value={r.targetPayers} onChange={setR('targetPayers')} multiline placeholder="Medicare, Medicaid, commercial (Blues, Aetna, UHC), employer self-insured, direct-to-consumer" />
        <Field label="Value Proposition for Payers" value={r.valueProposition} onChange={setR('valueProposition')} multiline placeholder="What outcomes does your product deliver that payers value? Cost avoidance, readmission reduction, quality metrics..." />
        <Field label="Health Economics Model" value={r.healthEconomics} onChange={setR('healthEconomics')} multiline placeholder="ICER, QALYs, cost-per-outcome, budget impact model assumptions..." />
        <Field label="Real-Time or Asynchronous Model (RTM/RPM)" value={r.rtmStrategy} onChange={setR('rtmStrategy')} placeholder="How does your delivery model map to billable time and complexity?" />
      </div>
    </div>
  );
}

// ── Tab: Milestones ────────────────────────────────────────────────────────────

function MilestonesTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Milestone, 'id' | 'createdAt'>>({ title: '', phase: 'discover', status: 'planned', targetDate: '', notes: '' });

  function addMilestone() {
    if (!draft.title) return;
    const m: Milestone = { id: uid(), ...draft };
    update({ ...state, milestones: [...state.milestones, m] });
    setDraft({ title: '', phase: 'discover', status: 'planned', targetDate: '', notes: '' });
    setAdding(false);
  }

  function updateMilestone(id: string, patch: Partial<Milestone>) {
    update({ ...state, milestones: state.milestones.map(m => m.id === id ? { ...m, ...patch } : m) });
  }

  function deleteMilestone(id: string) {
    update({ ...state, milestones: state.milestones.filter(m => m.id !== id) });
  }

  const byPhase = MILESTONE_PHASES.map(phase => ({
    phase,
    items: state.milestones.filter(m => m.phase === phase),
  }));

  const PHASE_COLOR: Record<string, string> = { discover: '#10B981', define: '#8B5CF6', develop: '#3B82F6', deploy: '#F59E0B' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Project Milestones" subtitle="Track progress across the four development phases." accent="#3B82F6" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
          {state.milestones.filter(m => m.status === 'complete').length}/{state.milestones.length} complete
        </span>
        <button onClick={() => setAdding(true)} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>+ Add Milestone</button>
      </div>

      {adding && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Milestone" value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} placeholder="e.g. IRB approval received" />
            <Field label="Target Date" value={draft.targetDate} onChange={v => setDraft(d => ({ ...d, targetDate: v }))} placeholder="e.g. Q2 2026" />
            <SelectField label="Phase" value={draft.phase} onChange={v => setDraft(d => ({ ...d, phase: v as typeof d.phase }))} options={MILESTONE_PHASES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
            <SelectField label="Status" value={draft.status} onChange={v => setDraft(d => ({ ...d, status: v as typeof d.status }))} options={MILESTONE_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Notes" value={draft.notes} onChange={v => setDraft(d => ({ ...d, notes: v }))} placeholder="Additional context, dependencies..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addMilestone} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>Save</button>
            <button onClick={() => setAdding(false)} style={{ padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>Cancel</button>
          </div>
        </Card>
      )}

      {byPhase.map(({ phase, items }) => (
        <div key={phase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: PHASE_COLOR[phase], boxShadow: `0 0 6px ${PHASE_COLOR[phase]}` }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: PHASE_COLOR[phase], textTransform: 'uppercase', letterSpacing: '0.12em' }}>{phase}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>({items.length})</span>
          </div>
          {items.length === 0 && (
            <div style={{ padding: '14px 16px', border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No milestones</div>
          )}
          {items.map(m => (
            <Card key={m.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 2, fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em', background: STATUS_BG[m.status], color: STATUS_COLOR[m.status] }}>{m.status}</span>
                    {m.targetDate && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{m.targetDate}</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{m.title}</p>
                  {m.notes && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{m.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {MILESTONE_STATUSES.filter(s => s !== m.status).map(s => (
                    <button key={s} onClick={() => updateMilestone(m.id, { status: s })} style={{ padding: '2px 6px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 9, cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</button>
                  ))}
                  <button onClick={() => deleteMilestone(m.id)} style={{ padding: '2px 6px', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard({ state }: { state: DHState }) {
  const productMeta = PRODUCT_TYPES.find(p => p.value === state.productType);
  const pathwayMeta = PATHWAYS.find(p => p.value === state.regulatory.pathway);
  const frameworkMeta = PRIVACY_FRAMEWORKS.find(p => p.value === state.privacy.framework);
  const evidenceMeta = EVIDENCE_TYPES.find(p => p.value === state.evidence.type);
  const complete = state.milestones.filter(m => m.status === 'complete').length;
  const total = state.milestones.length;
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;

  const filled = [
    !!state.problem.patientProblem,
    state.personas.length > 0,
    state.regulatory.pathway !== 'tbd',
    !!state.evidence.primaryEndpoint,
    !!state.privacy.phiElements,
    !!state.reimbursement.targetPayers,
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Project Overview" subtitle={state.projectName || 'Unnamed Project'} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, border: '1px solid var(--line)' }}>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)', borderRight: '1px solid var(--line)' }}><Stat label="Milestones" value={`${complete}/${total}`} color="#8B5CF6" /></div>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)', borderRight: '1px solid var(--line)' }}><Stat label="% Complete" value={`${pct}%`} color="#10B981" /></div>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)', borderRight: '1px solid var(--line)' }}><Stat label="Personas" value={state.personas.length} color="#3B82F6" /></div>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)' }}><Stat label="Modules Filled" value={`${filled}/6`} color="#F59E0B" /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Product Type', value: productMeta?.label ?? '—', color: '#10B981' },
          { label: 'Regulatory Pathway', value: pathwayMeta?.label ?? '—', color: '#8B5CF6' },
          { label: 'Evidence Strategy', value: evidenceMeta?.label ?? '—', color: '#3B82F6' },
          { label: 'Privacy Framework', value: frameworkMeta?.label ?? '—', color: '#F59E0B' },
        ].map((item, i) => (
          <Card key={i}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item.value}</div>
            <div style={{ marginTop: 10, height: 2, background: 'var(--line)' }}>
              <div style={{ height: '100%', width: item.value !== '—' && item.value !== 'To be determined' ? '100%' : '0%', background: item.color, transition: 'width 0.5s', borderRadius: 1 }} />
            </div>
          </Card>
        ))}
      </div>

      {state.problem.patientProblem && (
        <Card>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Patient Problem</div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{state.problem.patientProblem}</p>
        </Card>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'problem' | 'users' | 'regulatory' | 'evidence' | 'privacy' | 'reimbursement' | 'milestones';

const TABS: { id: Tab; label: string; phase: string; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', phase: '', color: 'var(--accent)' },
  { id: 'problem', label: 'Problem', phase: 'Discover', color: '#10B981' },
  { id: 'users', label: 'User Research', phase: 'Discover', color: '#10B981' },
  { id: 'regulatory', label: 'Regulatory', phase: 'Define', color: '#8B5CF6' },
  { id: 'evidence', label: 'Evidence', phase: 'Define', color: '#3B82F6' },
  { id: 'privacy', label: 'Privacy & Security', phase: 'Develop', color: '#F59E0B' },
  { id: 'reimbursement', label: 'Reimbursement', phase: 'Deploy', color: '#F43F5E' },
  { id: 'milestones', label: 'Milestones', phase: '', color: 'var(--accent)' },
];

export default function DigitalHealthApp() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [state, setState] = useState<DHState>(DEFAULT_STATE);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndication, setNewIndication] = useState('');
  const [newType, setNewType] = useState<ProductType>('samd');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { projects: ps, activeId: aid } = loadProjects();
    setProjects(ps);
    setActiveId(aid);
    if (aid) setState(loadProjectData(aid));
    setHydrated(true);
  }, []);

  const update = useCallback((next: DHState) => {
    setState(next);
    if (activeId) setProjects(p => persistProject(activeId, next, p));
  }, [activeId]);

  function createProject() {
    if (!newName) return;
    const id = uid();
    const meta: ProjectMeta = { id, name: newName, indication: newIndication, productType: newType, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const initial: DHState = { ...DEFAULT_STATE, projectName: newName, indication: newIndication, productType: newType };
    const updated = [...projects, meta];
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
    localStorage.setItem(PROJECT_KEY(id), JSON.stringify(initial));
    localStorage.setItem(ACTIVE_KEY, id);
    setProjects(updated);
    setActiveId(id);
    setState(initial);
    setCreating(false);
    setNewName('');
    setNewIndication('');
    setNewType('samd');
  }

  function switchProject(id: string) {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
    setState(loadProjectData(id));
    setTab('dashboard');
  }

  function deleteProject(id: string) {
    localStorage.removeItem(PROJECT_KEY(id));
    const updated = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
    setProjects(updated);
    if (activeId === id) {
      const next = updated[0] ?? null;
      if (next) { localStorage.setItem(ACTIVE_KEY, next.id); setActiveId(next.id); setState(loadProjectData(next.id)); }
      else { localStorage.removeItem(ACTIVE_KEY); setActiveId(null); setState(DEFAULT_STATE); }
    }
  }

  if (!hydrated) return null;

  const SIDEBAR_W = 216;
  const CONTENT_MAX = 820;

  return (
    <div className="dh-root" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', display: 'flex' }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--line)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--line)' }}>
          <Link href="/biodesign/digitalhealth" style={{ textDecoration: 'none' }}>
            <span className="brand-name" style={{ fontSize: 14 }}>Ambient <em>Intelligence</em></span>
          </Link>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 5 }}>Digital Health Studio</div>
        </div>

        {/* Project switcher */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, padding: '0 6px' }}>Projects</div>
          {projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => switchProject(p.id)} className="dh-sidebar-tab" style={{
                flex: 1, minWidth: 0,
                background: p.id === activeId ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: p.id === activeId ? 'var(--accent)' : 'var(--text-3)',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: p.id === activeId ? 'var(--accent)' : 'var(--text-4)',
                  boxShadow: p.id === activeId ? '0 0 6px var(--accent)' : 'none',
                }} />
                <span style={{ fontSize: 12, fontWeight: p.id === activeId ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
              <button onClick={() => deleteProject(p.id)} style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 4px', flexShrink: 0 }}>✕</button>
            </div>
          ))}
          {creating ? (
            <div style={{ padding: '10px 6px' }}>
              <input
                autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createProject(); if (e.key === 'Escape') setCreating(false); }}
                placeholder="Project name"
                style={{ ...fieldStyle, width: '100%', fontSize: 12, marginBottom: 6, height: 34 }}
              />
              <input value={newIndication} onChange={e => setNewIndication(e.target.value)} placeholder="Therapeutic area" style={{ ...fieldStyle, width: '100%', fontSize: 12, marginBottom: 6, height: 34 }} />
              <select value={newType} onChange={e => setNewType(e.target.value as ProductType)} style={{ ...fieldStyle, width: '100%', fontSize: 12, height: 34, marginBottom: 8 }}>
                {PRODUCT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={createProject} style={{ flex: 1, padding: '5px', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 2 }}>Create</button>
                <button onClick={() => setCreating(false)} style={{ padding: '5px 8px', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '6px 10px', background: 'none', border: '1px dashed var(--line)',
              color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 10,
              cursor: 'pointer', borderRadius: 2, marginTop: 4,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>+ New Project</button>
          )}
        </div>

        {/* Nav tabs */}
        <div style={{ padding: '12px 12px', flex: 1 }}>
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="dh-sidebar-tab" style={{
                width: '100%', marginBottom: 1,
                background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? t.color : 'transparent',
                  border: isActive ? 'none' : '1px solid var(--line)',
                  boxShadow: isActive ? `0 0 6px ${t.color}` : 'none',
                }} />
                <span style={{ fontSize: 13, color: isActive ? 'var(--text)' : 'var(--text-3)', fontWeight: isActive ? 600 : 400, flex: 1 }}>{t.label}</span>
                {t.phase && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: isActive ? t.color : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.phase}</span>}
              </button>
            );
          })}
        </div>

        {/* Bottom status */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Autosaved locally</span>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, padding: '0 0 80px' }}>
        {/* Top bar */}
        <div style={{
          height: 52, display: 'flex', alignItems: 'center', padding: '0 40px',
          borderBottom: '1px solid var(--line)',
          background: 'rgba(11,9,23,0.85)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{state.projectName || 'Untitled Project'}</span>
            {state.indication && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginLeft: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{state.indication}</span>}
          </div>
          <div style={{ flex: 1 }} />
          {activeId && (
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>{PRODUCT_TYPES.find(p => p.value === state.productType)?.label?.split('(')[0]?.trim() ?? '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pathway</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>{PATHWAYS.find(p => p.value === state.regulatory.pathway)?.label?.split('(')[0]?.split('FDA ')[1]?.trim() ?? PATHWAYS.find(p => p.value === state.regulatory.pathway)?.label ?? '—'}</div>
              </div>
            </div>
          )}
        </div>

        {/* No project state */}
        {!activeId && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 'calc(100vh - 52px)', gap: 20, textAlign: 'center', padding: 40,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>+</div>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>No project yet</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>Create your first digital health project to get started.</p>
            </div>
            <button onClick={() => setCreating(true)} style={{
              padding: '12px 32px', background: 'var(--accent)', color: '#fff', border: 'none',
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              cursor: 'pointer', borderRadius: 2, boxShadow: '0 0 24px var(--accent-glow)',
            }}>Create Project</button>
          </div>
        )}

        {/* Tab content */}
        {activeId && (
          <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto', padding: '40px 40px' }}>
            {tab === 'dashboard' && <Dashboard state={state} />}
            {tab === 'problem' && <ProblemTab state={state} update={update} />}
            {tab === 'users' && <UserResearchTab state={state} update={update} />}
            {tab === 'regulatory' && <RegulatoryTab state={state} update={update} />}
            {tab === 'evidence' && <EvidenceTab state={state} update={update} />}
            {tab === 'privacy' && <PrivacyTab state={state} update={update} />}
            {tab === 'reimbursement' && <ReimbursementTab state={state} update={update} />}
            {tab === 'milestones' && <MilestonesTab state={state} update={update} />}
          </div>
        )}
      </div>
    </div>
  );
}
