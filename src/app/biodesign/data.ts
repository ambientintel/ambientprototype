// Biodesign process types — mirrors Stanford Biodesign framework

export type Phase = 'identify' | 'invent' | 'implement' | 'comply';

// ── Compliance types (used by Phase 4) ───────────────────────────────────────

export type TargetMarket = 'us' | 'eu' | 'japan' | 'canada' | 'australia' | 'brazil' | 'uk';
export type PatientContactType = 'surface' | 'external-communicating' | 'implant';
export type PatientContactDuration = 'limited' | 'prolonged' | 'permanent';
export type SterilizationMethod = 'eo' | 'radiation' | 'steam' | 'other';
export type StandardCategory =
  | 'QMS' | 'Risk' | 'Software' | 'Electrical' | 'Battery'
  | 'Biocompatibility' | 'Sterilization' | 'Usability' | 'Clinical'
  | 'Labeling' | 'Market Regulatory' | 'Cybersecurity' | 'Privacy' | 'Safety Certification';
export type StandardPriority = 'critical' | 'high' | 'medium';
export type ComplianceStatus = 'not-started' | 'in-progress' | 'complete' | 'na';

export interface DeviceProfile {
  hasSoftware: boolean;
  isSaMD: boolean;
  hasAI: boolean;
  isActiveElectrical: boolean;
  hasAlarms: boolean;
  isHomeUse: boolean;
  hasBattery: boolean;
  hasPatientContact: boolean;
  patientContactType: PatientContactType | null;
  patientContactDuration: PatientContactDuration | null;
  bloodContact: boolean;
  isImplantable: boolean;
  isSterile: boolean;
  sterilizationMethod: SterilizationMethod | null;
  isNetworked: boolean;
  isIVD: boolean;
  isCombination: boolean;
  hasAlarmsEnabled: boolean;
  targetMarkets: TargetMarket[];
}

export const DEFAULT_DEVICE_PROFILE: DeviceProfile = {
  hasSoftware: false,
  isSaMD: false,
  hasAI: false,
  isActiveElectrical: false,
  hasAlarms: false,
  isHomeUse: false,
  hasBattery: false,
  hasPatientContact: false,
  patientContactType: null,
  patientContactDuration: null,
  bloodContact: false,
  isImplantable: false,
  isSterile: false,
  sterilizationMethod: null,
  isNetworked: false,
  isIVD: false,
  isCombination: false,
  hasAlarmsEnabled: false,
  targetMarkets: [],
};

export interface StandardDef {
  id: string;
  number: string;
  title: string;
  category: StandardCategory;
  description: string;
  markets: TargetMarket[] | 'global';
  priority: StandardPriority;
  appliesWhen: (profile: DeviceProfile) => boolean;
  defaultChecklist: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface StandardCompliance {
  standardId: string;
  status: ComplianceStatus;
  notes: string;
  assignee: string;
  targetDate: string;
  checklist: ChecklistItem[];
}

export interface ComplyState {
  profile: DeviceProfile;
  compliance: Record<string, StandardCompliance>;
}
export type NeedStatus = 'draft' | 'refined' | 'validated' | 'selected';
export type ConceptStatus = 'idea' | 'screening' | 'development' | 'selected' | 'eliminated';
export type RegulatoryPathway = '510k' | 'pma' | 'denovo' | 'exempt' | 'tbd';
export type DeviceClass = 'I' | 'II' | 'III' | 'TBD';
export type StakeholderRole = 'patient' | 'clinician' | 'payer' | 'hospital' | 'regulator' | 'caregiver';

// ── Need Statement ─────────────────────────────────────────────────────────────

export interface NeedStatement {
  id: string;
  problem: string;         // what the user cannot do / pain point
  population: string;      // who has the problem
  setting: string;         // where it occurs
  outcome: string;         // desired outcome / goal
  status: NeedStatus;
  criteria: NeedCriteria;
  observations: string[];
  createdAt: string;
}

export interface NeedCriteria {
  diseaseStateScore: number | null;    // 1-5
  marketScore: number | null;          // 1-5
  regulatoryScore: number | null;      // 1-5
  businessScore: number | null;        // 1-5
  notes: string;
}

// ── Stakeholders ───────────────────────────────────────────────────────────────

export interface Stakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  influence: number;   // 1-5
  interest: number;    // 1-5
  painPoints: string;
  successMetrics: string;
}

// ── Concepts ──────────────────────────────────────────────────────────────────

export interface Concept {
  id: string;
  needId: string;
  title: string;
  description: string;
  mechanism: string;
  status: ConceptStatus;
  screening: ConceptScreening;
  createdAt: string;
}

export interface ConceptScreening {
  technicalFeasibility: number | null;  // 1-5
  ipFreedom: number | null;             // 1-5
  regulatoryRisk: number | null;        // 1-5 (5=low risk)
  reimbursementViability: number | null;// 1-5
  clinicalAdoption: number | null;      // 1-5
  notes: string;
}

// ── Regulatory ────────────────────────────────────────────────────────────────

export interface RegulatoryProfile {
  deviceClass: DeviceClass;
  pathway: RegulatoryPathway;
  productCode: string;
  predicateDevice: string;
  predicateNumber: string;
  intendedUse: string;
  indicationsForUse: string;
  substantialEquivalence: string;
  specialControls: string[];
  clinicalData: 'not required' | 'bench only' | 'limited clinical' | 'pivotal trial';
  estimatedTimelineMonths: number | null;
  estimatedCost: string;
  notes: string;
}

// ── IP Landscape ─────────────────────────────────────────────────────────────

export interface Patent {
  id: string;
  number: string;
  title: string;
  assignee: string;
  status: 'active' | 'expired' | 'pending' | 'abandoned';
  relevance: 'blocking' | 'relevant' | 'background' | 'expired';
  ftoRisk: 'high' | 'medium' | 'low' | 'cleared';
  notes: string;
}

// ── Clinical ──────────────────────────────────────────────────────────────────

export interface ClinicalPlan {
  primaryEndpoint: string;
  secondaryEndpoints: string[];
  studyDesign: string;
  sampleSize: number | null;
  sites: number | null;
  durationMonths: number | null;
  inclusionCriteria: string;
  exclusionCriteria: string;
  primarySponsor: string;
  notes: string;
}

// ── Business Model ─────────────────────────────────────────────────────────────

export interface BusinessModel {
  targetMarketDescription: string;
  totalAddressableMarket: string;
  serviceableMarket: string;
  revenueModel: string;
  averageSellingPrice: string;
  costOfGoods: string;
  reimbursementCode: string;
  payerMix: string;
  goToMarketStrategy: string;
  keyPartnerships: string;
  competitiveAdvantage: string;
}

// ── Root state ────────────────────────────────────────────────────────────────

export interface BiodesignState {
  projectName: string;
  projectDescription: string;
  indication: string;
  needs: NeedStatement[];
  selectedNeedId: string | null;
  stakeholders: Stakeholder[];
  concepts: Concept[];
  regulatory: RegulatoryProfile;
  patents: Patent[];
  clinical: ClinicalPlan;
  business: BusinessModel;
  comply: ComplyState;
}

export const DEFAULT_STATE: BiodesignState = {
  projectName: '',
  projectDescription: '',
  indication: '',
  needs: [],
  selectedNeedId: null,
  stakeholders: [],
  concepts: [],
  regulatory: {
    deviceClass: 'TBD',
    pathway: 'tbd',
    productCode: '',
    predicateDevice: '',
    predicateNumber: '',
    intendedUse: '',
    indicationsForUse: '',
    substantialEquivalence: '',
    specialControls: [],
    clinicalData: 'not required',
    estimatedTimelineMonths: null,
    estimatedCost: '',
    notes: '',
  },
  patents: [],
  clinical: {
    primaryEndpoint: '',
    secondaryEndpoints: [],
    studyDesign: '',
    sampleSize: null,
    sites: null,
    durationMonths: null,
    inclusionCriteria: '',
    exclusionCriteria: '',
    primarySponsor: '',
    notes: '',
  },
  business: {
    targetMarketDescription: '',
    totalAddressableMarket: '',
    serviceableMarket: '',
    revenueModel: '',
    averageSellingPrice: '',
    costOfGoods: '',
    reimbursementCode: '',
    payerMix: '',
    goToMarketStrategy: '',
    keyPartnerships: '',
    competitiveAdvantage: '',
  },
  comply: {
    profile: DEFAULT_DEVICE_PROFILE,
    compliance: {},
  },
};

export function needScore(n: NeedStatement): number | null {
  const vals = [n.criteria.diseaseStateScore, n.criteria.marketScore, n.criteria.regulatoryScore, n.criteria.businessScore];
  const filled = vals.filter((v): v is number => v !== null);
  if (filled.length === 0) return null;
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10;
}

export function conceptScore(c: Concept): number | null {
  const s = c.screening;
  const vals = [s.technicalFeasibility, s.ipFreedom, s.regulatoryRisk, s.reimbursementViability, s.clinicalAdoption];
  const filled = vals.filter((v): v is number => v !== null);
  if (filled.length === 0) return null;
  return Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10;
}

export const NEED_STATUS_META: Record<NeedStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: 'rgba(120,110,100,0.12)', color: '#8a7d6e' },
  refined:   { label: 'Refined',   bg: 'rgba(184,131,10,0.14)',  color: '#9a7000' },
  validated: { label: 'Validated', bg: 'rgba(45,114,210,0.14)',  color: '#2a5fa0' },
  selected:  { label: 'Selected',  bg: 'rgba(61,204,145,0.14)',  color: '#1e8f68' },
};

export const CONCEPT_STATUS_META: Record<ConceptStatus, { label: string; bg: string; color: string }> = {
  idea:        { label: 'Idea',        bg: 'rgba(120,110,100,0.12)', color: '#8a7d6e' },
  screening:   { label: 'Screening',   bg: 'rgba(184,131,10,0.14)',  color: '#9a7000' },
  development: { label: 'Development', bg: 'rgba(45,114,210,0.14)',  color: '#2a5fa0' },
  selected:    { label: 'Selected',    bg: 'rgba(61,204,145,0.14)',  color: '#1e8f68' },
  eliminated:  { label: 'Eliminated',  bg: 'rgba(192,57,43,0.12)',   color: '#a02020' },
};

export const PATHWAY_META: Record<RegulatoryPathway, { label: string; color: string }> = {
  '510k':  { label: '510(k)',    color: '#2a5fa0' },
  pma:     { label: 'PMA',       color: '#8a3030' },
  denovo:  { label: 'De Novo',   color: '#6a4a9a' },
  exempt:  { label: 'Exempt',    color: '#1e8f68' },
  tbd:     { label: 'TBD',       color: '#8a7d6e' },
};

export const STAKEHOLDER_ROLE_META: Record<StakeholderRole, { label: string; color: string }> = {
  patient:    { label: 'Patient',    color: '#2a5fa0' },
  clinician:  { label: 'Clinician',  color: '#1e8f68' },
  payer:      { label: 'Payer',      color: '#9a7000' },
  hospital:   { label: 'Hospital',   color: '#6a4a9a' },
  regulator:  { label: 'Regulator',  color: '#8a3030' },
  caregiver:  { label: 'Caregiver',  color: '#2a7a9a' },
};
