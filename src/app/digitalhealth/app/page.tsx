'use client';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import '../digitalhealth.css';

// ── Types ──────────────────────────────────────────────────────────────────────

type ProductType = 'samd' | 'dtx' | 'wellness' | 'rpm' | 'telehealth' | 'ai-ml' | 'other';
type RegulatoryPathway = 'fda-510k' | 'fda-pma' | 'fda-de-novo' | 'fda-exempt' | 'ce-mark' | 'dtx-alliance' | 'wellness-exempt' | 'tbd';
type EvidenceType = 'rct' | 'rwe' | 'single-arm' | 'registry' | 'retrospective' | 'none';
type PrivacyFramework = 'hipaa' | 'gdpr' | 'both' | 'neither';
type RiskCategory = 'clinical' | 'security' | 'privacy' | 'operational' | 'regulatory';
type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed';
type ResidualLevel = 'low' | 'medium' | 'high' | 'unacceptable';
type StandardStatus = 'not-started' | 'in-progress' | 'compliant' | 'not-applicable';

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

interface SoftwareRisk {
  id: string;
  description: string;
  category: RiskCategory;
  severity: 1 | 2 | 3 | 4 | 5;
  probability: 1 | 2 | 3 | 4 | 5;
  mitigation: string;
  residualLevel: ResidualLevel;
  status: RiskStatus;
  createdAt: string;
}

interface AdverseEvent {
  id: string;
  date: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'reported-to-fda';
}

interface Improvement {
  id: string;
  title: string;
  type: 'bug' | 'enhancement' | 'safety' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'planned' | 'in-progress' | 'done';
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

  interop: {
    fhirResources: string[];
    ehrTargets: string[];
    integrationMethods: string[];
    authMethod: string;
    apiBaseUrl: string;
    notes: string;
  };

  risks: SoftwareRisk[];

  postMarket: {
    adverseEvents: AdverseEvent[];
    improvements: Improvement[];
    adoptionNotes: string;
    outcomesNotes: string;
    surveillancePlan: string;
  };

  standards: Record<string, StandardStatus>;
  standardNotes: Record<string, string>;
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
  interop: { fhirResources: [], ehrTargets: [], integrationMethods: [], authMethod: '', apiBaseUrl: '', notes: '' },
  risks: [],
  postMarket: { adverseEvents: [], improvements: [], adoptionNotes: '', outcomesNotes: '', surveillancePlan: '' },
  standards: {},
  standardNotes: {},
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
    return {
      ...DEFAULT_STATE,
      ...parsed,
      problem: { ...DEFAULT_STATE.problem, ...(parsed.problem ?? {}) },
      regulatory: { ...DEFAULT_STATE.regulatory, ...(parsed.regulatory ?? {}) },
      evidence: { ...DEFAULT_STATE.evidence, ...(parsed.evidence ?? {}) },
      privacy: { ...DEFAULT_STATE.privacy, ...(parsed.privacy ?? {}) },
      reimbursement: { ...DEFAULT_STATE.reimbursement, ...(parsed.reimbursement ?? {}) },
      milestones: parsed.milestones ?? [],
      interop: { ...DEFAULT_STATE.interop, ...(parsed.interop ?? {}) },
      risks: parsed.risks ?? [],
      postMarket: { ...DEFAULT_STATE.postMarket, ...(parsed.postMarket ?? {}), adverseEvents: parsed.postMarket?.adverseEvents ?? [], improvements: parsed.postMarket?.improvements ?? [] },
      standards: parsed.standards ?? {},
      standardNotes: parsed.standardNotes ?? {},
    };
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

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 2,
      fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      background: bg, color,
    }}>{label}</span>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0' }}>
      <div style={{
        width: 14, height: 14, borderRadius: 2, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'transparent',
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--line-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 12, color: checked ? 'var(--text-2)' : 'var(--text-3)' }}>{label}</span>
    </div>
  );
}

// ── Static data ────────────────────────────────────────────────────────────────

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
const PHASE_COLOR: Record<string, string> = { discover: '#10B981', define: '#8B5CF6', develop: '#3B82F6', deploy: '#F59E0B' };

const FHIR_RESOURCES = ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'DiagnosticReport', 'Encounter', 'Procedure', 'AllergyIntolerance', 'ImmunizationRecord', 'CarePlan', 'Device', 'DocumentReference'];
const EHR_TARGETS = ['Epic', 'Oracle Cerner', 'MEDITECH', 'Allscripts', 'athenahealth', 'eClinicalWorks', 'NextGen', 'Veradigm'];
const INTEGRATION_METHODS = ['SMART on FHIR', 'CDS Hooks', 'Direct API', 'HL7 v2 Interface', 'C-CDA / CCD', 'X12 EDI', 'DICOM Web', 'Bulk FHIR'];

const RISK_CATEGORY_COLOR: Record<RiskCategory, string> = {
  clinical: '#F43F5E', security: '#F59E0B', privacy: '#8B5CF6', operational: '#3B82F6', regulatory: '#10B981',
};
const RISK_CATEGORY_BG: Record<RiskCategory, string> = {
  clinical: 'rgba(244,63,94,0.12)', security: 'rgba(245,158,11,0.12)', privacy: 'rgba(139,92,246,0.12)', operational: 'rgba(59,130,246,0.12)', regulatory: 'rgba(16,185,129,0.12)',
};

const RESIDUAL_COLOR: Record<ResidualLevel, string> = { low: '#10B981', medium: '#F59E0B', high: '#F43F5E', unacceptable: '#8B5CF6' };
const RESIDUAL_BG: Record<ResidualLevel, string> = { low: 'rgba(16,185,129,0.12)', medium: 'rgba(245,158,11,0.12)', high: 'rgba(244,63,94,0.12)', unacceptable: 'rgba(139,92,246,0.12)' };

const SEV_COLOR = (score: number) => score >= 15 ? '#F43F5E' : score >= 8 ? '#F59E0B' : '#10B981';

const SEVERITY_COLOR: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#F43F5E', critical: '#8B5CF6' };
const SEVERITY_BG: Record<string, string> = { low: 'rgba(16,185,129,0.12)', medium: 'rgba(245,158,11,0.12)', high: 'rgba(244,63,94,0.12)', critical: 'rgba(139,92,246,0.12)' };

const STANDARDS_LIST = [
  { id: 'iec62304', name: 'IEC 62304', desc: 'Medical device software — software lifecycle processes' },
  { id: 'iec82304', name: 'IEC 82304-1', desc: 'Health software — general requirements for product safety' },
  { id: 'iso13485', name: 'ISO 13485', desc: 'Medical devices — quality management system requirements' },
  { id: 'iso14971', name: 'ISO 14971', desc: 'Application of risk management to medical devices' },
  { id: 'iec62443', name: 'IEC 62443', desc: 'Industrial cybersecurity — operational technology security' },
  { id: 'nistcsf', name: 'NIST CSF 2.0', desc: 'Cybersecurity framework for critical infrastructure' },
  { id: 'soc2', name: 'SOC 2 Type II', desc: 'Service organization controls for security and availability' },
  { id: 'hipaa-security', name: 'HIPAA Security Rule', desc: 'Administrative, physical, and technical safeguards for ePHI' },
  { id: 'fda-samd', name: 'FDA SaMD Guidance', desc: 'FDA guidance on software as a medical device (2019)' },
  { id: 'fda-aiml', name: 'FDA AI/ML Action Plan', desc: 'Predetermined change control plan for AI/ML-based SaMD' },
  { id: 'uscdi', name: 'ONC USCDI v3', desc: 'United States Core Data for Interoperability standard dataset' },
  { id: 'fhir-r4', name: 'HL7 FHIR R4', desc: 'Fast Healthcare Interoperability Resources — data exchange standard' },
  { id: 'dicom', name: 'DICOM', desc: 'Digital imaging and communications in medicine standard' },
  { id: 'loinc', name: 'LOINC / SNOMED CT', desc: 'Clinical terminology standards for observations and diagnoses' },
];

const STANDARD_STATUS_COLOR: Record<StandardStatus, string> = {
  'not-started': 'var(--text-4)',
  'in-progress': '#3B82F6',
  'compliant': '#10B981',
  'not-applicable': 'var(--text-4)',
};

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
        <button onClick={() => setAdding(true)} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>+ Add Persona</button>
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

// ── Tab: Standards ─────────────────────────────────────────────────────────────

function StandardsTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const compliantCount = STANDARDS_LIST.filter(s => (state.standards[s.id] ?? 'not-started') === 'compliant').length;

  function setStatus(id: string, val: StandardStatus) {
    update({ ...state, standards: { ...state.standards, [id]: val } });
  }

  function setNote(id: string, val: string) {
    update({ ...state, standardNotes: { ...state.standardNotes, [id]: val } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Standards & Compliance" accent="#10B981" />

      <Card style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: '#10B981', lineHeight: 1 }}>{compliantCount}</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.12em' }}>of {STANDARDS_LIST.length} compliant</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Update each standard as you complete certification or assessment</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--line)' }}>
        {STANDARDS_LIST.map((std, i) => {
          const status: StandardStatus = state.standards[std.id] ?? 'not-started';
          const note = state.standardNotes[std.id] ?? '';
          return (
            <div key={std.id} style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              gap: 12, padding: '14px 18px',
              background: i % 2 === 0 ? 'var(--surface-1)' : 'var(--surface-2)',
              borderBottom: i < STANDARDS_LIST.length - 1 ? '1px solid var(--line)' : 'none',
              alignItems: 'start',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{std.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: STANDARD_STATUS_COLOR[status], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{status.replace(/-/g, ' ')}</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{std.desc}</p>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(std.id, e.target.value)}
                  placeholder="Notes..."
                  style={{ ...fieldStyle, height: 30, fontSize: 11, padding: '4px 10px' }}
                />
              </div>
              <select
                value={status}
                onChange={e => setStatus(std.id, e.target.value as StandardStatus)}
                style={{ ...fieldStyle, height: 34, fontSize: 11, width: 160, cursor: 'pointer', color: STANDARD_STATUS_COLOR[status] }}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="compliant">Compliant</option>
                <option value="not-applicable">Not Applicable</option>
              </select>
            </div>
          );
        })}
      </div>
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

// ── Tab: Interop ───────────────────────────────────────────────────────────────

function InteropTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const io = state.interop;

  function toggleArr(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
  }

  function setIo<K extends keyof typeof io>(k: K, v: typeof io[K]) {
    update({ ...state, interop: { ...io, [k]: v } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Interoperability & Data Standards" accent="#3B82F6" />

      <Card style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#3B82F6' }}>
          {io.fhirResources.length} FHIR resources · {io.ehrTargets.length} EHR targets · {io.integrationMethods.length} integration methods
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>FHIR Resources</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {FHIR_RESOURCES.map(r => (
            <CheckItem
              key={r} label={r}
              checked={io.fhirResources.includes(r)}
              onToggle={() => setIo('fhirResources', toggleArr(io.fhirResources, r))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>EHR Target Systems</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
          {EHR_TARGETS.map(r => (
            <CheckItem
              key={r} label={r}
              checked={io.ehrTargets.includes(r)}
              onToggle={() => setIo('ehrTargets', toggleArr(io.ehrTargets, r))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Integration Methods</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
          {INTEGRATION_METHODS.map(r => (
            <CheckItem
              key={r} label={r}
              checked={io.integrationMethods.includes(r)}
              onToggle={() => setIo('integrationMethods', toggleArr(io.integrationMethods, r))}
            />
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="API Base URL" value={io.apiBaseUrl} onChange={v => setIo('apiBaseUrl', v)} placeholder="https://api.yourplatform.com/fhir/R4" />
        <Field label="Auth Method" value={io.authMethod} onChange={v => setIo('authMethod', v)} placeholder="e.g. SMART on FHIR OAuth 2.0, API Key, mTLS" />
      </div>
      <Field label="Notes" value={io.notes} onChange={v => setIo('notes', v)} multiline placeholder="Integration notes, data mapping decisions, known limitations..." />
    </div>
  );
}

// ── Tab: Risk ──────────────────────────────────────────────────────────────────

function RiskTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<SoftwareRisk, 'id' | 'createdAt'>>({
    description: '', category: 'clinical', severity: 3, probability: 3,
    mitigation: '', residualLevel: 'medium', status: 'open',
  });

  function addRisk() {
    if (!draft.description) return;
    const r: SoftwareRisk = { id: uid(), ...draft, createdAt: new Date().toISOString() };
    update({ ...state, risks: [...state.risks, r] });
    setDraft({ description: '', category: 'clinical', severity: 3, probability: 3, mitigation: '', residualLevel: 'medium', status: 'open' });
    setAdding(false);
  }

  function deleteRisk(id: string) { update({ ...state, risks: state.risks.filter(r => r.id !== id) }); }
  function updateRiskStatus(id: string, status: RiskStatus) {
    update({ ...state, risks: state.risks.map(r => r.id === id ? { ...r, status } : r) });
  }

  const counts: Record<ResidualLevel, number> = { low: 0, medium: 0, high: 0, unacceptable: 0 };
  state.risks.forEach(r => counts[r.residualLevel]++);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Software Risk Management" subtitle="ISO 14971 / IEC 62304 — identify, assess, and mitigate software risks." accent="#F43F5E" />

      <Card style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#F43F5E', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Risk Matrix Summary</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {(Object.entries(counts) as [ResidualLevel, number][]).map(([level, count]) => (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: RESIDUAL_COLOR[level] }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: RESIDUAL_COLOR[level], fontWeight: 700 }}>{count}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{level}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{state.risks.length} risk{state.risks.length !== 1 ? 's' : ''} identified</span>
        <button onClick={() => setAdding(true)} style={{ padding: '7px 16px', background: '#F43F5E', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>+ Add Risk</button>
      </div>

      {adding && (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Description" value={draft.description} onChange={v => setDraft(d => ({ ...d, description: v }))} placeholder="Describe the risk scenario and potential harm..." />
            </div>
            <SelectField label="Category" value={draft.category} onChange={v => setDraft(d => ({ ...d, category: v as RiskCategory }))} options={[
              { value: 'clinical', label: 'Clinical' },
              { value: 'security', label: 'Security' },
              { value: 'privacy', label: 'Privacy' },
              { value: 'operational', label: 'Operational' },
              { value: 'regulatory', label: 'Regulatory' },
            ]} />
            <SelectField label="Residual Level" value={draft.residualLevel} onChange={v => setDraft(d => ({ ...d, residualLevel: v as ResidualLevel }))} options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'unacceptable', label: 'Unacceptable' },
            ]} />
            <SelectField label="Severity (1–5)" value={String(draft.severity)} onChange={v => setDraft(d => ({ ...d, severity: Number(v) as SoftwareRisk['severity'] }))} options={[1,2,3,4,5].map(n => ({ value: String(n), label: String(n) }))} />
            <SelectField label="Probability (1–5)" value={String(draft.probability)} onChange={v => setDraft(d => ({ ...d, probability: Number(v) as SoftwareRisk['probability'] }))} options={[1,2,3,4,5].map(n => ({ value: String(n), label: String(n) }))} />
            <SelectField label="Status" value={draft.status} onChange={v => setDraft(d => ({ ...d, status: v as RiskStatus }))} options={[
              { value: 'open', label: 'Open' },
              { value: 'mitigated', label: 'Mitigated' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'closed', label: 'Closed' },
            ]} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Mitigation" value={draft.mitigation} onChange={v => setDraft(d => ({ ...d, mitigation: v }))} multiline placeholder="Describe the mitigation measures and controls..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addRisk} style={{ padding: '7px 16px', background: '#F43F5E', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>Save Risk</button>
            <button onClick={() => setAdding(false)} style={{ padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>Cancel</button>
          </div>
        </Card>
      )}

      {state.risks.length === 0 && !adding && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-4)', fontSize: 12, border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No risks identified yet
        </div>
      )}

      {state.risks.map(risk => {
        const score = risk.severity * risk.probability;
        return (
          <Card key={risk.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={risk.category} bg={RISK_CATEGORY_BG[risk.category]} color={RISK_CATEGORY_COLOR[risk.category]} />
                <Badge label={risk.residualLevel} bg={RESIDUAL_BG[risk.residualLevel]} color={RESIDUAL_COLOR[risk.residualLevel]} />
                <Badge label={risk.status} bg="var(--surface-2)" color="var(--text-3)" />
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  color: SEV_COLOR(score), padding: '2px 8px',
                  background: `${SEV_COLOR(score)}14`, borderRadius: 2,
                }}>
                  {risk.severity} × {risk.probability} = {score}
                </span>
              </div>
              <button onClick={() => deleteRisk(risk.id)} style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px', flexShrink: 0 }}>✕</button>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text)', fontWeight: 500, lineHeight: 1.5 }}>{risk.description}</p>
            {risk.mitigation && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Mitigation</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{risk.mitigation}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['open', 'mitigated', 'accepted', 'closed'] as RiskStatus[]).filter(s => s !== risk.status).map(s => (
                <button key={s} onClick={() => updateRiskStatus(risk.id, s)} style={{ padding: '2px 8px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 9, cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>→ {s}</button>
              ))}
            </div>
          </Card>
        );
      })}
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

// ── Tab: Post-Market ───────────────────────────────────────────────────────────

function PostMarketTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const pm = state.postMarket;
  const [addingEvent, setAddingEvent] = useState(false);
  const [addingImprove, setAddingImprove] = useState(false);
  const [eventDraft, setEventDraft] = useState<Omit<AdverseEvent, 'id'>>({ date: '', description: '', severity: 'low', status: 'open' });
  const [improveDraft, setImproveDraft] = useState<Omit<Improvement, 'id'>>({ title: '', type: 'bug', priority: 'medium', status: 'backlog', notes: '' });

  function setPm<K extends keyof typeof pm>(k: K, v: typeof pm[K]) {
    update({ ...state, postMarket: { ...pm, [k]: v } });
  }

  function addEvent() {
    if (!eventDraft.description) return;
    const e: AdverseEvent = { id: uid(), ...eventDraft };
    setPm('adverseEvents', [...pm.adverseEvents, e]);
    setEventDraft({ date: '', description: '', severity: 'low', status: 'open' });
    setAddingEvent(false);
  }

  function deleteEvent(id: string) { setPm('adverseEvents', pm.adverseEvents.filter(e => e.id !== id)); }

  function addImprovement() {
    if (!improveDraft.title) return;
    const imp: Improvement = { id: uid(), ...improveDraft };
    setPm('improvements', [...pm.improvements, imp]);
    setImproveDraft({ title: '', type: 'bug', priority: 'medium', status: 'backlog', notes: '' });
    setAddingImprove(false);
  }

  function deleteImprovement(id: string) { setPm('improvements', pm.improvements.filter(i => i.id !== id)); }

  function cycleImprovementStatus(id: string) {
    const order: Improvement['status'][] = ['backlog', 'planned', 'in-progress', 'done'];
    setPm('improvements', pm.improvements.map(i => {
      if (i.id !== id) return i;
      const idx = order.indexOf(i.status);
      return { ...i, status: order[(idx + 1) % order.length] };
    }));
  }

  const TYPE_COLOR: Record<string, string> = { bug: '#F43F5E', enhancement: '#3B82F6', safety: '#F59E0B', compliance: '#10B981' };
  const TYPE_BG: Record<string, string> = { bug: 'rgba(244,63,94,0.12)', enhancement: 'rgba(59,130,246,0.12)', safety: 'rgba(245,158,11,0.12)', compliance: 'rgba(16,185,129,0.12)' };
  const IMP_STATUS_COLOR: Record<string, string> = { backlog: 'var(--text-4)', planned: '#8B5CF6', 'in-progress': '#3B82F6', done: '#10B981' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Post-Market Surveillance" accent="#F59E0B" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Adoption & Engagement Notes" value={pm.adoptionNotes} onChange={v => setPm('adoptionNotes', v)} multiline placeholder="Active users, engagement rates, retention metrics, NPS..." />
        <Field label="Clinical Outcomes Notes" value={pm.outcomesNotes} onChange={v => setPm('outcomesNotes', v)} multiline placeholder="Real-world outcome data, registry findings, comparative effectiveness..." />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Surveillance Plan" value={pm.surveillancePlan} onChange={v => setPm('surveillancePlan', v)} multiline placeholder="Describe your post-market surveillance methodology, data sources, review cadence, and FDA MDR reporting triggers..." />
        </div>
      </div>

      {/* Adverse Events */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ borderLeft: '3px solid #F43F5E', paddingLeft: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Adverse Events</div>
          </div>
          <button onClick={() => setAddingEvent(true)} style={{ padding: '6px 14px', background: '#F43F5E', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>+ Add Event</button>
        </div>

        {addingEvent && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field label="Date" value={eventDraft.date} onChange={v => setEventDraft(d => ({ ...d, date: v }))} placeholder="e.g. 2026-04-15" />
              <SelectField label="Severity" value={eventDraft.severity} onChange={v => setEventDraft(d => ({ ...d, severity: v as AdverseEvent['severity'] }))} options={[
                { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
              ]} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Description" value={eventDraft.description} onChange={v => setEventDraft(d => ({ ...d, description: v }))} multiline placeholder="Describe the adverse event, patient impact, and initial assessment..." />
              </div>
              <SelectField label="Status" value={eventDraft.status} onChange={v => setEventDraft(d => ({ ...d, status: v as AdverseEvent['status'] }))} options={[
                { value: 'open', label: 'Open' }, { value: 'investigating', label: 'Investigating' },
                { value: 'resolved', label: 'Resolved' }, { value: 'reported-to-fda', label: 'Reported to FDA' },
              ]} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addEvent} style={{ padding: '7px 16px', background: '#F43F5E', color: '#fff', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>Save</button>
              <button onClick={() => setAddingEvent(false)} style={{ padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>Cancel</button>
            </div>
          </Card>
        )}

        {pm.adverseEvents.length === 0 && !addingEvent && (
          <div style={{ padding: '20px', border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>No adverse events recorded</div>
        )}

        {pm.adverseEvents.map(ev => (
          <Card key={ev.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Badge label={ev.severity} bg={SEVERITY_BG[ev.severity]} color={SEVERITY_COLOR[ev.severity]} />
                  <Badge label={ev.status.replace(/-/g, ' ')} bg="var(--surface-2)" color="var(--text-3)" />
                  {ev.date && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{ev.date}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{ev.description}</p>
              </div>
              <button onClick={() => deleteEvent(ev.id)} style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px', flexShrink: 0 }}>✕</button>
            </div>
          </Card>
        ))}
      </div>

      {/* Continuous Improvement */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ borderLeft: '3px solid #10B981', paddingLeft: 10 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Continuous Improvement</div>
          </div>
          <button onClick={() => setAddingImprove(true)} style={{ padding: '6px 14px', background: '#10B981', color: '#000', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>+ Add Item</button>
        </div>

        {addingImprove && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Title" value={improveDraft.title} onChange={v => setImproveDraft(d => ({ ...d, title: v }))} placeholder="Brief description of the improvement item..." />
              </div>
              <SelectField label="Type" value={improveDraft.type} onChange={v => setImproveDraft(d => ({ ...d, type: v as Improvement['type'] }))} options={[
                { value: 'bug', label: 'Bug' }, { value: 'enhancement', label: 'Enhancement' },
                { value: 'safety', label: 'Safety' }, { value: 'compliance', label: 'Compliance' },
              ]} />
              <SelectField label="Priority" value={improveDraft.priority} onChange={v => setImproveDraft(d => ({ ...d, priority: v as Improvement['priority'] }))} options={[
                { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
              ]} />
              <SelectField label="Status" value={improveDraft.status} onChange={v => setImproveDraft(d => ({ ...d, status: v as Improvement['status'] }))} options={[
                { value: 'backlog', label: 'Backlog' }, { value: 'planned', label: 'Planned' },
                { value: 'in-progress', label: 'In Progress' }, { value: 'done', label: 'Done' },
              ]} />
              <Field label="Notes" value={improveDraft.notes} onChange={v => setImproveDraft(d => ({ ...d, notes: v }))} placeholder="Additional context or acceptance criteria..." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addImprovement} style={{ padding: '7px 16px', background: '#10B981', color: '#000', border: 'none', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', borderRadius: 2 }}>Save</button>
              <button onClick={() => setAddingImprove(false)} style={{ padding: '7px 14px', background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', borderRadius: 2 }}>Cancel</button>
            </div>
          </Card>
        )}

        {pm.improvements.length === 0 && !addingImprove && (
          <div style={{ padding: '20px', border: '1px dashed var(--line)', borderRadius: 2, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>No improvement items yet</div>
        )}

        {pm.improvements.map(imp => (
          <Card key={imp.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Badge label={imp.type} bg={TYPE_BG[imp.type]} color={TYPE_COLOR[imp.type]} />
                  <Badge label={imp.priority} bg={SEVERITY_BG[imp.priority]} color={SEVERITY_COLOR[imp.priority]} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: IMP_STATUS_COLOR[imp.status], textTransform: 'uppercase', letterSpacing: '0.08em' }}>{imp.status.replace(/-/g, ' ')}</span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{imp.title}</p>
                {imp.notes && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{imp.notes}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => cycleImprovementStatus(imp.id)} style={{ padding: '3px 8px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 9, cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next →</button>
                <button onClick={() => deleteImprovement(imp.id)} style={{ color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}>✕</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Milestones ────────────────────────────────────────────────────────────

function MilestonesTab({ state, update }: { state: DHState; update: (s: DHState) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Milestone, 'id'>>({ title: '', phase: 'discover', status: 'planned', targetDate: '', notes: '' });

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

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 3, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
    </div>
  );
}

function Dashboard({ state }: { state: DHState }) {
  const productMeta = PRODUCT_TYPES.find(p => p.value === state.productType);
  const pathwayMeta = PATHWAYS.find(p => p.value === state.regulatory.pathway);
  const frameworkMeta = PRIVACY_FRAMEWORKS.find(p => p.value === state.privacy.framework);
  const evidenceMeta = EVIDENCE_TYPES.find(p => p.value === state.evidence.type);
  const complete = state.milestones.filter(m => m.status === 'complete').length;
  const total = state.milestones.length;
  const openRisks = state.risks.filter(r => r.status === 'open').length;
  const compliantStandards = STANDARDS_LIST.filter(s => (state.standards[s.id] ?? 'not-started') === 'compliant').length;

  // Section progress percentages
  const problemFields = [state.problem.patientProblem, state.problem.clinicalContext, state.problem.targetPopulation, state.problem.currentSolutions, state.problem.unmetNeed, state.problem.jobToBeDone];
  const problemPct = Math.round((problemFields.filter(Boolean).length / 6) * 100);
  const regulatoryPct = Math.round(([(state.regulatory.pathway !== 'tbd' ? 1 : 0), (state.regulatory.intendedUse ? 1 : 0)].reduce((a, b) => a + b, 0) / 2) * 100);
  const evidencePct = state.evidence.primaryEndpoint ? 100 : 0;
  const privacyPct = Math.round(([(state.privacy.framework !== 'hipaa' || state.privacy.phiElements ? 1 : 0), (state.privacy.phiElements ? 1 : 0)].reduce((a, b) => a + b, 0) / 2) * 100);
  const reimbPct = state.reimbursement.targetPayers ? 100 : 0;
  const interopPct = state.interop.fhirResources.length > 0 ? 100 : 0;

  const sections = [
    { label: 'Problem', pct: problemPct, color: '#10B981' },
    { label: 'Regulatory', pct: regulatoryPct, color: '#8B5CF6' },
    { label: 'Evidence', pct: evidencePct, color: '#3B82F6' },
    { label: 'Privacy', pct: privacyPct, color: '#F59E0B' },
    { label: 'Reimbursement', pct: reimbPct, color: '#F43F5E' },
    { label: 'Interop', pct: interopPct, color: '#3B82F6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Project Overview" subtitle={state.projectName || 'Unnamed Project'} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, border: '1px solid var(--line)' }}>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)', borderRight: '1px solid var(--line)' }}><Stat label="Milestones" value={`${complete}/${total}`} color="#8B5CF6" /></div>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)', borderRight: '1px solid var(--line)' }}><Stat label="Open Risks" value={openRisks} color="#F43F5E" /></div>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)', borderRight: '1px solid var(--line)' }}><Stat label="Standards" value={`${compliantStandards}/14`} color="#10B981" /></div>
        <div style={{ padding: '20px 18px', background: 'var(--surface-1)' }}><Stat label="Personas" value={state.personas.length} color="#3B82F6" /></div>
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
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 10 }}>{item.value}</div>
            <div style={{ height: 2, background: 'var(--line)' }}>
              <div style={{ height: '100%', width: item.value !== '—' && item.value !== 'To be determined' ? '100%' : '0%', background: item.color, transition: 'width 0.5s', borderRadius: 1 }} />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Section Progress</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sections.map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: s.pct === 100 ? s.color : 'var(--text-4)' }}>{s.pct}%</span>
              </div>
              <ProgressBar pct={s.pct} color={s.color} />
            </div>
          ))}
        </div>
      </Card>

      {state.problem.patientProblem && (
        <Card>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Patient Problem Statement</div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{state.problem.patientProblem}</p>
        </Card>
      )}
    </div>
  );
}

// ── Tab type & nav structure ───────────────────────────────────────────────────

type Tab = 'dashboard' | 'problem' | 'users' | 'regulatory' | 'evidence' | 'standards' | 'privacy' | 'interop' | 'risks' | 'reimbursement' | 'postmarket' | 'milestones';

const NAV_GROUPS: { heading: string; color?: string; items: { id: Tab; label: string; color: string }[] }[] = [
  {
    heading: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', color: 'var(--accent)' },
      { id: 'milestones', label: 'Milestones', color: 'var(--accent)' },
    ],
  },
  {
    heading: 'Discover',
    color: '#10B981',
    items: [
      { id: 'problem', label: 'Problem Framework', color: '#10B981' },
      { id: 'users', label: 'User Research', color: '#10B981' },
    ],
  },
  {
    heading: 'Define',
    color: '#8B5CF6',
    items: [
      { id: 'regulatory', label: 'Regulatory', color: '#8B5CF6' },
      { id: 'evidence', label: 'Clinical Evidence', color: '#8B5CF6' },
      { id: 'standards', label: 'Standards', color: '#10B981' },
    ],
  },
  {
    heading: 'Develop',
    color: '#3B82F6',
    items: [
      { id: 'privacy', label: 'Privacy & Security', color: '#F59E0B' },
      { id: 'interop', label: 'Interoperability', color: '#3B82F6' },
      { id: 'risks', label: 'Risk Management', color: '#F43F5E' },
    ],
  },
  {
    heading: 'Deploy',
    color: '#F59E0B',
    items: [
      { id: 'reimbursement', label: 'Reimbursement', color: '#F43F5E' },
      { id: 'postmarket', label: 'Post-Market', color: '#F59E0B' },
    ],
  },
];

// ── Main App ───────────────────────────────────────────────────────────────────

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

  const SIDEBAR_W = 220;
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
          <Link href="/digitalhealth" style={{ textDecoration: 'none' }}>
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

        {/* Nav groups */}
        <div style={{ padding: '12px 12px', flex: 1 }}>
          {NAV_GROUPS.map(group => (
            <div key={group.heading} style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                color: group.color ?? 'var(--text-4)',
                padding: '0 6px', marginBottom: 4,
              }}>{group.heading}</div>
              {group.items.map(t => {
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
                  </button>
                );
              })}
            </div>
          ))}
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
            {tab === 'dashboard'     && <Dashboard state={state} />}
            {tab === 'problem'       && <ProblemTab state={state} update={update} />}
            {tab === 'users'         && <UserResearchTab state={state} update={update} />}
            {tab === 'regulatory'    && <RegulatoryTab state={state} update={update} />}
            {tab === 'evidence'      && <EvidenceTab state={state} update={update} />}
            {tab === 'standards'     && <StandardsTab state={state} update={update} />}
            {tab === 'privacy'       && <PrivacyTab state={state} update={update} />}
            {tab === 'interop'       && <InteropTab state={state} update={update} />}
            {tab === 'risks'         && <RiskTab state={state} update={update} />}
            {tab === 'reimbursement' && <ReimbursementTab state={state} update={update} />}
            {tab === 'postmarket'    && <PostMarketTab state={state} update={update} />}
            {tab === 'milestones'    && <MilestonesTab state={state} update={update} />}
          </div>
        )}
      </div>
    </div>
  );
}
