'use client';
import React, { useState, useEffect, useRef } from 'react';
import { BiodesignState, RegulatoryPathway, PATHWAY_META } from './data';
import { FlowCanvas } from './flowbg';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCENT = '#E87252';
const FDA_510K_BASE = 'https://api.fda.gov/device/510k.json';
const TODAY_REF = new Date('2026-05-05');
const ONE_YEAR_AGO = new Date(TODAY_REF);
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

// ── Shared styles ──────────────────────────────────────────────────────────────

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: 'var(--text-4)',
  marginBottom: 5,
};

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
  boxSizing: 'border-box' as const,
};

const pillBase: React.CSSProperties = {
  padding: '4px 11px',
  borderRadius: 2,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.10em',
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--text-3)',
  transition: 'all 0.14s',
};

// ── Inner tabs ─────────────────────────────────────────────────────────────────

type InnerTab = 'clearances' | 'guidance' | 'warnings';

const INNER_TABS: Array<{ key: InnerTab; label: string }> = [
  { key: 'clearances', label: 'Recent Clearances' },
  { key: 'guidance',   label: 'FDA Guidance' },
  { key: 'warnings',   label: 'Warning Letters' },
];

// ── FDA 510(k) result type ─────────────────────────────────────────────────────

interface FDAResult510k {
  k_number: string;
  applicant: string;
  device_name: string;
  decision_date: string;
  decision_description: string;
  product_code: string;
  third_party_flag: string;
}

function formatDecisionDate(raw: string): string {
  if (!raw || raw.length < 8) return '—';
  const year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10) - 1;
  const day = parseInt(raw.slice(6, 8), 10);
  return new Date(year, month, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isCleared(r: FDAResult510k): boolean {
  return r.decision_description?.toUpperCase().includes('SUBSTANTIALLY EQUIVALENT') ?? false;
}

// ── Guidance documents ─────────────────────────────────────────────────────────

interface GuidanceDoc {
  id: string;
  category: string;
  title: string;
  date: string;
  pathway: RegulatoryPathway[];
  desc: string;
  url: string;
}

const GUIDANCE_DOCS: GuidanceDoc[] = [
  // Software & Digital Health
  { id:'g1', category:'Software & Digital Health', title:'Software as a Medical Device (SaMD): Clinical Evaluation', date:'2022-09-27', pathway:['510k','pma','denovo'], desc:'Framework for clinical evaluation of SaMD products across the total product lifecycle.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/software-medical-device-samd-clinical-evaluation' },
  { id:'g2', category:'Software & Digital Health', title:'Predetermined Change Control Plan for AI/ML-Based SaMD', date:'2024-03-22', pathway:['510k','denovo'], desc:'Guidance on submitting PCCPs to allow post-market algorithm changes without a new submission.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligencemachine' },
  { id:'g3', category:'Software & Digital Health', title:'Cybersecurity in Medical Devices', date:'2023-09-26', pathway:['510k','pma','denovo'], desc:'Recommendations for cybersecurity design and premarket submission content for medical devices.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions' },
  { id:'g4', category:'Software & Digital Health', title:'Clinical Decision Support Software', date:'2022-09-28', pathway:['510k','denovo','exempt'], desc:'Defines when CDS software meets the device definition and what submission is required.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software' },
  // Biocompatibility
  { id:'g5', category:'Biocompatibility', title:'Use of ISO 10993-1 Biocompatibility Evaluation', date:'2020-09-04', pathway:['510k','pma','denovo'], desc:'Guidance on evaluating and documenting biocompatibility of medical devices per ISO 10993-1:2018.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/use-international-standard-iso-10993-1-biological-evaluation-medical-devices-part-1-evaluation-and' },
  { id:'g6', category:'Biocompatibility', title:'Biocompatibility Testing Framework for Certain SaMD', date:'2023-08-01', pathway:['510k','denovo'], desc:'Risk-based framework for biocompatibility evaluation when physical contact with patient is indirect.', url:'https://www.fda.gov' },
  // 510(k) Program
  { id:'g7', category:'510(k) Program', title:'The 510(k) Program: Evaluating Substantial Equivalence', date:'2014-07-28', pathway:['510k'], desc:'Core guidance defining how FDA evaluates substantial equivalence in 510(k) submissions.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/510k-program-evaluating-substantial-equivalence-premarket-notification-submissions' },
  { id:'g8', category:'510(k) Program', title:'Refuse to Accept Policy for 510(k)s', date:'2019-09-13', pathway:['510k'], desc:'FDA acceptance checklist — what causes RTA and how to avoid it.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/refuse-accept-policy-510ks' },
  { id:'g9', category:'510(k) Program', title:'Recommended Content and Format of Non-Clinical Bench Performance Testing in 510(k)s', date:'2019-04-17', pathway:['510k'], desc:'How to structure and present bench testing data in 510(k) submissions.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/recommended-content-and-format-non-clinical-bench-performance-testing-information-premarket' },
  // De Novo
  { id:'g10', category:'De Novo', title:'De Novo Classification Process (Evaluation of Automatic Class III Designation)', date:'2021-10-05', pathway:['denovo'], desc:'Comprehensive guidance on preparing and submitting De Novo classification requests.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/de-novo-classification-process-evaluation-automatic-class-iii-designation' },
  // PMA
  { id:'g11', category:'PMA', title:'Submissions for Breakthrough Device Designation', date:'2023-11-02', pathway:['pma','denovo'], desc:'How to request and leverage Breakthrough Device designation for expedited review.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/requests-feedback-and-meetings-medical-device-submissions-q-submission-program' },
  { id:'g12', category:'PMA', title:'Design Considerations for Pivotal Clinical Investigations', date:'2013-11-21', pathway:['pma'], desc:'FDA expectations for pivotal trial design including endpoints, controls, and statistical approach.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-pivotal-clinical-investigations-medical-devices' },
  // Q-Submission
  { id:'g13', category:'Q-Submission', title:'Q-Submission Program Guidance', date:'2023-11-02', pathway:['510k','pma','denovo'], desc:'Current guidance on requesting pre-submission meetings, written feedback, and study risk determinations.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/requests-feedback-and-meetings-medical-device-submissions-q-submission-program' },
  // Usability & HF
  { id:'g14', category:'Usability & HF', title:'Applying Human Factors and Usability Engineering to Medical Devices', date:'2016-02-03', pathway:['510k','pma','denovo'], desc:'FDA expectations for human factors engineering and usability testing in device submissions.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/applying-human-factors-and-usability-engineering-medical-devices' },
  // Post-Market
  { id:'g15', category:'Post-Market', title:'Postmarket Surveillance Under Section 522 of the FD&C Act', date:'2016-05-13', pathway:['510k','pma'], desc:'When FDA can order post-approval studies and what they require.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/postmarket-surveillance-under-section-522-federal-food-drug-and-cosmetic-act' },
  { id:'g16', category:'Post-Market', title:'Medical Device Reporting (MDR): How to Report', date:'2023-01-01', pathway:['510k','pma','denovo','exempt'], desc:'Requirements for reporting device malfunctions, serious injuries, and deaths to FDA.', url:'https://www.fda.gov/medical-devices/mandatory-reporting-requirements-manufacturers-importers-and-device-user-facilities' },
  // Quality Systems
  { id:'g17', category:'Quality Systems', title:'Quality System Regulation (21 CFR Part 820)', date:'2024-02-02', pathway:['510k','pma','denovo','exempt'], desc:'Updated QSR now harmonized with ISO 13485:2016. Effective February 2026.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/quality-management-system-regulation' },
  // Labeling
  { id:'g18', category:'Labeling', title:'Labeling Recommendations for Single-Use Devices', date:'2023-04-01', pathway:['510k','pma','denovo'], desc:'Requirements for SUD labeling, reprocessing claims, and symbols.', url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/labeling-recommendations-single-use-devices' },
];

// ── Warning themes ─────────────────────────────────────────────────────────────

interface WarningTheme {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  category: string;
  issue: string;
  desc: string;
  examples: string[];
  year: number;
}

const WARNING_THEMES: WarningTheme[] = [
  { id:'w1', severity:'critical', category:'Quality Systems', issue:'QMS Design Control Deficiencies', desc:'Inadequate design controls under 21 CFR 820.30 remain the most common 483 observation. FDA expects documented design inputs, outputs, reviews, verification, and validation.', examples:['Design changes made without formal change control', 'DHF not maintained or incomplete', 'Design verification and validation not documented'], year:2024 },
  { id:'w2', severity:'critical', category:'MDR Reporting', issue:'Failure to File MDR Reports', desc:'Failing to submit 30-day MDR reports for device malfunctions that could cause serious injury is a top enforcement priority.', examples:['Complaint investigations not triggering MDR evaluation', 'MDR files not maintained', 'Late reporting beyond 30-day window'], year:2024 },
  { id:'w3', severity:'high', category:'Software', issue:'Software Changes Without New 510(k)', desc:'Making significant software changes to a cleared device without determining if a new 510(k) is required.', examples:['Algorithm changes affecting intended use', 'New AI/ML functionality added post-clearance', 'Security patches that alter device behavior'], year:2024 },
  { id:'w4', severity:'high', category:'Labeling', issue:'False or Misleading Labeling Claims', desc:'Promotional materials and labeling making uncleared claims or off-label use promotion.', examples:['Claims beyond cleared intended use', 'Superiority claims without supporting data', 'Social media promotion of off-label uses'], year:2023 },
  { id:'w5', severity:'high', category:'Sterility', issue:'Sterility Assurance / Contamination Control', desc:'Inadequate sterility validation, sterility testing failures, or contamination control issues.', examples:['Bioburden testing failures not triggering CAPA', 'Sterility assurance level not validated', 'Environmental monitoring gaps'], year:2024 },
  { id:'w6', severity:'medium', category:'CAPA', issue:'Inadequate CAPA System', desc:'Corrective and preventive action systems that fail to identify root causes or prevent recurrence.', examples:['CAPAs closed without verifying effectiveness', 'Recurring complaints not escalated to CAPA', 'Root cause analysis too superficial'], year:2023 },
  { id:'w7', severity:'medium', category:'Registration', issue:'Failure to Register / List Device', desc:'Operating without proper FDA establishment registration or device listing.', examples:['New products added without listing update', 'Annual registration not renewed', 'Contract manufacturers not registered'], year:2023 },
  { id:'w8', severity:'medium', category:'Clinical', issue:'IDE Violations / Clinical Trial Misconduct', desc:'Failure to comply with IDE requirements including informed consent, IRB oversight, and progress reports.', examples:['Enrolling subjects before IDE approval', 'Protocol deviations not reported', 'Annual progress reports not filed'], year:2024 },
  { id:'w9', severity:'high', category:'Cybersecurity', issue:'Inadequate Cybersecurity Controls', desc:'Networked medical devices with unpatched vulnerabilities or lacking cybersecurity documentation in submissions.', examples:['No coordinated vulnerability disclosure policy', 'Unaddressed CVEs in device software', 'Cybersecurity not addressed in 510(k)'], year:2024 },
  { id:'w10', severity:'medium', category:'AI/ML', issue:'AI/ML Algorithm Changes Without Regulatory Review', desc:'Post-market algorithm updates that constitute a new intended use without FDA authorization.', examples:['Retraining models on new patient populations', 'Adding new diagnostic outputs', 'Changing performance specifications'], year:2024 },
];

// ── Severity config ────────────────────────────────────────────────────────────

const SEVERITY_META: Record<'critical' | 'high' | 'medium', { label: string; color: string; border: string }> = {
  critical: { label: 'Critical', color: ACCENT,    border: ACCENT },
  high:     { label: 'High',     color: '#E8A852', border: '#E8A852' },
  medium:   { label: 'Medium',   color: '#52C0E8', border: '#52C0E8' },
};

// ── How-to-avoid tips ─────────────────────────────────────────────────────────

function getAvoidTip(category: string): string {
  const tips: Record<string, string> = {
    'Quality Systems': 'Establish a formal DHF from day one. Use design review gates and ensure all design changes go through documented change control.',
    'MDR Reporting': 'Train your complaint handling team on MDR trigger criteria. Build MDR evaluation into every complaint investigation workflow.',
    'Software': 'Document all software changes against the predicate cleared IFU. Use the FDA Software Change guidance decision tree before every release.',
    'Labeling': 'Audit all promotional materials against cleared IFU. Ensure marketing team approves no claims outside cleared indications.',
    'Sterility': 'Validate sterility assurance levels (SAL 10-6) before commercial launch. Integrate bioburden results into your CAPA system.',
    'CAPA': 'Require root cause analysis for every CAPA. Schedule effectiveness checks 90 days after closure. Never close a CAPA without verified recurrence prevention.',
    'Registration': 'Calendar annual registration renewal (October 1 – December 31). List every new device within 30 days of first commercial distribution.',
    'Clinical': 'Submit IDE application before any first-in-human use. Assign a clinical compliance officer to track protocol deviations and progress report deadlines.',
    'Cybersecurity': 'Include cybersecurity risk analysis in your DHF. Maintain a SBOM and establish a coordinated vulnerability disclosure policy before submission.',
    'AI/ML': 'Evaluate all algorithm updates against your cleared algorithm change protocol. Document any retraining datasets and performance thresholds.',
  };
  return tips[category] ?? 'Review applicable FDA guidance and consult with a regulatory specialist before making changes to cleared devices.';
}

// ── Device type relevance ─────────────────────────────────────────────────────

function isRelevant(category: string, state: BiodesignState): boolean {
  const hasSoftware = state.comply?.profile?.hasSoftware ?? false;
  const isSaMD = state.comply?.profile?.isSaMD ?? false;
  const hasAI = state.comply?.profile?.hasAI ?? false;
  const isSterile = state.comply?.profile?.isSterile ?? false;
  const isNetworked = state.comply?.profile?.isNetworked ?? false;
  const indication = (state.indication ?? '').toLowerCase();

  if (category === 'Software' && (hasSoftware || isSaMD)) return true;
  if (category === 'AI/ML' && hasAI) return true;
  if (category === 'Sterility' && isSterile) return true;
  if (category === 'Cybersecurity' && isNetworked) return true;
  if (category === 'Software & Digital Health' && (hasSoftware || isSaMD || hasAI)) return true;
  if (category === 'Clinical' && indication.length > 0) return true;
  if (category === 'Quality Systems') return true;
  if (category === 'MDR Reporting') return true;
  return false;
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function RegIntelHero({ state }: { state: BiodesignState }) {
  const pathway = state.regulatory?.pathway ?? 'tbd';
  const productCode = state.regulatory?.productCode?.trim() || null;
  const deviceClass = state.regulatory?.deviceClass ?? 'TBD';
  const pathwayMeta = PATHWAY_META[pathway];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 28, minHeight: 164 }}>
      <FlowCanvas accent={ACCENT} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '28px 32px' }}>
        <div style={{ ...monoLabel, color: ACCENT, fontSize: 9, marginBottom: 10 }}>
          Regulatory Intelligence
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
          Regulatory Intelligence
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 480 }}>
          Live FDA clearances, current guidance, and enforcement trends for your device category.
        </p>
        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Product code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(232,114,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Product Code</div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
              color: productCode ? ACCENT : 'var(--text-4)',
              letterSpacing: '0.08em',
            }}>
              {productCode ?? 'Not set'}
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(232,114,82,0.2)' }} />
          {/* Pathway badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(232,114,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Pathway</div>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px', borderRadius: 2,
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              background: `${pathwayMeta.color}18`,
              border: `1px solid ${pathwayMeta.color}44`,
              color: pathwayMeta.color,
              textTransform: 'uppercase', letterSpacing: '0.09em',
            }}>
              {pathwayMeta.label}
            </span>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(232,114,82,0.2)' }} />
          {/* Device class badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(232,114,82,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Device Class</div>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px', borderRadius: 2,
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              background: 'rgba(214,233,248,0.07)',
              border: '1px solid rgba(214,233,248,0.12)',
              color: 'var(--text-2)',
              textTransform: 'uppercase', letterSpacing: '0.09em',
            }}>
              Class {deviceClass}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Recent Clearances ──────────────────────────────────────────────────

function ClearancesTab({ state }: { state: BiodesignState }) {
  const stateProductCode = state.regulatory?.productCode?.trim() ?? '';

  const [localCode, setLocalCode] = useState(stateProductCode);
  const [inputCode, setInputCode] = useState(stateProductCode);
  const [results, setResults] = useState<FDAResult510k[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-fetch on mount if product code exists
  useEffect(() => {
    if (stateProductCode) {
      doFetch(stateProductCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doFetch(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    setSearched(true);
    setLocalCode(trimmed);

    const url = `${FDA_510K_BASE}?search=product_code:${trimmed}&limit=15&sort=decision_date:desc`;

    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        if (res.status === 404) { setResults([]); setLoading(false); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.error) { setResults([]); setLoading(false); return; }
      setResults(json.results ?? []);
      setLoading(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(true);
      setLoading(false);
    }
  }

  function handleSearch() {
    doFetch(inputCode);
  }

  return (
    <div>
      {/* Product code input if not set */}
      {!stateProductCode && (
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--line)',
          borderRadius: 2, padding: '16px 20px', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={monoLabel}>Enter Product Code</div>
            <input
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g., DYN, QBS, MDF"
              style={{ ...inputStyle, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!inputCode.trim()}
            style={{
              padding: '8px 20px', borderRadius: 2,
              background: inputCode.trim() ? ACCENT : 'var(--surface-2)',
              color: inputCode.trim() ? '#fff' : 'var(--text-4)',
              border: 'none', cursor: inputCode.trim() ? 'pointer' : 'default',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              transition: 'all 0.14s',
            }}
          >
            Search
          </button>
        </div>
      )}

      {/* Results summary + refresh */}
      {searched && !loading && !error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 14, flexWrap: 'wrap',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.11em' }}>
            Showing <span style={{ color: ACCENT, fontWeight: 700 }}>{results.length}</span> recent clearances for product code{' '}
            <span style={{ color: 'var(--text-2)', fontWeight: 700 }}>{localCode}</span>
          </div>
          <button
            onClick={() => doFetch(localCode)}
            style={{
              padding: '5px 14px', borderRadius: 2,
              background: 'transparent', color: 'var(--text-3)',
              border: '1px solid var(--line)', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}
          >
            Refresh
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              height: 48, borderRadius: 2,
              background: 'var(--surface-1)',
              border: '1px solid var(--line)',
              animation: 'ri-skeleton 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
            }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#E05050', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
            Connection Error
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.7 }}>
            Could not reach FDA database. Check your connection and try again.
          </p>
          <button
            onClick={() => doFetch(localCode)}
            style={{
              padding: '8px 22px', borderRadius: 2,
              background: 'transparent', color: ACCENT,
              border: `1px solid ${ACCENT}55`, cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}
          >Retry</button>
        </div>
      )}

      {/* Results table */}
      {!loading && !error && searched && results.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 2, border: '1px solid var(--line)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-1)' }}>
                {['K-Number', 'Device Name', 'Applicant', 'Decision Date', 'Decision', '3rd Party'].map(col => (
                  <th key={col} style={{
                    padding: '8px 14px', textAlign: 'left',
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: 'var(--text-4)', whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => {
                const cleared = isCleared(r);
                return (
                  <tr
                    key={r.k_number}
                    style={{
                      borderBottom: idx < results.length - 1 ? '1px solid var(--line)' : 'none',
                      background: 'transparent',
                      transition: 'background 0.12s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    {/* K-Number */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <a
                        href={`https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${r.k_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                          color: ACCENT, textDecoration: 'none',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                      >
                        {r.k_number}
                      </a>
                    </td>
                    {/* Device Name */}
                    <td style={{ padding: '11px 14px', maxWidth: 240 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, display: 'block' }}>
                        {r.device_name}
                      </span>
                    </td>
                    {/* Applicant */}
                    <td style={{ padding: '11px 14px', maxWidth: 160 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.applicant}</span>
                    </td>
                    {/* Decision Date */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                        {formatDecisionDate(r.decision_date)}
                      </span>
                    </td>
                    {/* Decision */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 2,
                        background: cleared ? 'rgba(82,232,180,0.10)' : 'rgba(224,80,80,0.10)',
                        border: `1px solid ${cleared ? 'rgba(82,232,180,0.3)' : 'rgba(224,80,80,0.3)'}`,
                        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                        color: cleared ? '#52E8B4' : '#E05050',
                        textTransform: 'uppercase', letterSpacing: '0.09em',
                      }}>
                        {cleared ? 'Cleared' : 'Not Cleared'}
                      </span>
                    </td>
                    {/* Third Party */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      {r.third_party_flag === 'Y' && (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                          color: '#A07EE8', background: 'rgba(160,126,232,0.10)',
                          border: '1px solid rgba(160,126,232,0.3)',
                          padding: '2px 7px', borderRadius: 2,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>3P</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && searched && results.length === 0 && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
            No clearances found
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, margin: 0 }}>
            No clearances found for product code <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{localCode}</span>. Try a different code.
          </p>
        </div>
      )}

      {/* Insight box */}
      {searched && !loading && !error && results.length > 0 && (
        <div style={{
          marginTop: 16,
          padding: '14px 18px', borderRadius: 2,
          background: 'rgba(232,168,82,0.06)',
          border: '1px solid rgba(232,168,82,0.28)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: '#E8A852', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            What This Tells You
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.75 }}>
            Recent clearances for your product code show active competition and validated regulatory pathways. Review K-numbers to identify strong predicates.
          </p>
        </div>
      )}

      {/* Initial state — no search yet */}
      {!searched && !loading && (
        <div style={{
          padding: '52px 24px', textAlign: 'center',
          border: '1px dashed var(--line)', borderRadius: 2,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
            Enter a product code to load recent clearances
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, margin: 0 }}>
            Set a product code in the Regulatory tab to auto-load, or enter one above.
          </p>
        </div>
      )}

      <style>{`
        @keyframes ri-skeleton {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

// ── Tab 2: FDA Guidance ────────────────────────────────────────────────────────

function GuidanceTab({ state }: { state: BiodesignState }) {
  const pathway = state.regulatory?.pathway ?? 'tbd';

  const categories = ['All', ...Array.from(new Set(GUIDANCE_DOCS.map(d => d.category)))];

  const [activeCategory, setActiveCategory] = useState('All');
  const [showAllPathways, setShowAllPathways] = useState(false);

  const filtered = GUIDANCE_DOCS.filter(doc => {
    const catMatch = activeCategory === 'All' || doc.category === activeCategory;
    const pathwayMatch = showAllPathways || pathway === 'tbd' || doc.pathway.includes(pathway);
    return catMatch && pathwayMatch;
  });

  function isNew(dateStr: string): boolean {
    return new Date(dateStr) >= ONE_YEAR_AGO;
  }

  return (
    <div>
      {/* Pathway filter toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.11em' }}>
          {showAllPathways
            ? 'Showing all pathways'
            : `Filtered to ${PATHWAY_META[pathway].label} guidance`}
        </div>
        {pathway !== 'tbd' && (
          <button
            onClick={() => setShowAllPathways(v => !v)}
            style={{
              padding: '4px 12px', borderRadius: 2, cursor: 'pointer',
              background: showAllPathways ? 'rgba(214,233,248,0.07)' : `${ACCENT}18`,
              border: showAllPathways ? '1px solid var(--line)' : `1px solid ${ACCENT}44`,
              color: showAllPathways ? 'var(--text-3)' : ACCENT,
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'all 0.14s',
            }}
          >
            {showAllPathways ? 'Show pathway-relevant only' : 'Show all pathways'}
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {categories.map(cat => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...pillBase,
                background: active ? `${ACCENT}18` : 'transparent',
                border: active ? `1px solid ${ACCENT}55` : '1px solid var(--line)',
                color: active ? ACCENT : 'var(--text-3)',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Guidance cards */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: '1px dashed var(--line)', borderRadius: 2,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            No guidance documents match current filters
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(doc => {
            const docIsNew = isNew(doc.date);
            return (
              <div
                key={doc.id}
                style={{
                  background: 'var(--surface-1)', border: '1px solid var(--line)',
                  borderRadius: 4, padding: '14px 18px',
                  transition: 'border-color 0.14s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-strong)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Category badge */}
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      color: ACCENT, background: 'rgba(232,114,82,0.10)',
                      border: `1px solid ${ACCENT}33`,
                      padding: '2px 7px', borderRadius: 2,
                      textTransform: 'uppercase', letterSpacing: '0.09em',
                      whiteSpace: 'nowrap',
                    }}>{doc.category}</span>
                    {/* NEW badge */}
                    {docIsNew && (
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                        color: '#E8A852', background: 'rgba(232,168,82,0.10)',
                        border: '1px solid rgba(232,168,82,0.35)',
                        padding: '2px 7px', borderRadius: 2,
                        textTransform: 'uppercase', letterSpacing: '0.09em',
                      }}>New</span>
                    )}
                  </div>
                  {/* Date */}
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9,
                    color: 'var(--text-4)', whiteSpace: 'nowrap',
                    letterSpacing: '0.06em',
                  }}>
                    Updated {doc.date}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>
                  {doc.title}
                </div>

                {/* Description */}
                <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                  {doc.desc}
                </p>

                {/* Link */}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: ACCENT, fontSize: 12, fontFamily: 'var(--mono)',
                    fontWeight: 600, textDecoration: 'none',
                    letterSpacing: '0.06em',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                >
                  View Guidance →
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Warning Letters ────────────────────────────────────────────────────

function WarningsTab({ state }: { state: BiodesignState }) {
  type SeverityFilter = 'all' | 'critical' | 'high' | 'medium';
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const filtered = WARNING_THEMES.filter(w =>
    severityFilter === 'all' || w.severity === severityFilter
  );

  // Frequency summary counts
  const counts = {
    critical: WARNING_THEMES.filter(w => w.severity === 'critical').length,
    high: WARNING_THEMES.filter(w => w.severity === 'high').length,
    medium: WARNING_THEMES.filter(w => w.severity === 'medium').length,
  };
  const maxCount = Math.max(counts.critical, counts.high, counts.medium);

  return (
    <div>
      {/* Summary header */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 4, padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
          Most Common Warning Letter Issues — 2024
        </div>
        {/* Bar chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['critical', 'high', 'medium'] as const).map(sev => {
            const meta = SEVERITY_META[sev];
            const count = counts[sev];
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.1em', width: 52, flexShrink: 0 }}>
                  {meta.label}
                </div>
                <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${pct}%`,
                    background: meta.color,
                    opacity: 0.75,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: meta.color, fontWeight: 700, width: 16, textAlign: 'right', flexShrink: 0 }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Severity filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['all', 'critical', 'high', 'medium'] as SeverityFilter[]).map(sev => {
          const active = severityFilter === sev;
          const meta = sev !== 'all' ? SEVERITY_META[sev] : null;
          const activeColor = meta?.color ?? ACCENT;
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                ...pillBase,
                background: active ? `${activeColor}18` : 'transparent',
                border: active ? `1px solid ${activeColor}55` : '1px solid var(--line)',
                color: active ? activeColor : 'var(--text-3)',
              }}
            >
              {sev === 'all' ? 'All Issues' : SEVERITY_META[sev].label}
            </button>
          );
        })}
      </div>

      {/* Warning cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(w => {
          const meta = SEVERITY_META[w.severity];
          const relevant = isRelevant(w.category, state);
          const avoidTip = getAvoidTip(w.category);

          return (
            <div
              key={w.id}
              style={{
                background: 'var(--surface-1)', border: '1px solid var(--line)',
                borderLeft: `3px solid ${meta.border}`,
                borderRadius: 4, padding: '14px 18px',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Severity badge */}
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                    color: meta.color, background: `${meta.color}14`,
                    border: `1px solid ${meta.color}44`,
                    padding: '2px 7px', borderRadius: 2,
                    textTransform: 'uppercase', letterSpacing: '0.09em',
                    whiteSpace: 'nowrap',
                  }}>{meta.label}</span>
                  {/* Category badge */}
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                    color: 'var(--text-3)', background: 'rgba(214,233,248,0.06)',
                    border: '1px solid var(--line)',
                    padding: '2px 7px', borderRadius: 2,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>{w.category}</span>
                  {/* Relevance badge */}
                  {relevant && (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      color: ACCENT, background: 'rgba(232,114,82,0.10)',
                      border: `1px solid ${ACCENT}44`,
                      padding: '2px 7px', borderRadius: 2,
                      textTransform: 'uppercase', letterSpacing: '0.09em',
                      whiteSpace: 'nowrap',
                    }}>Relevant to your device</span>
                  )}
                </div>
                {/* Year */}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', flexShrink: 0 }}>
                  {w.year}
                </span>
              </div>

              {/* Issue title */}
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4 }}>
                {w.issue}
              </div>

              {/* Description */}
              <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.75 }}>
                {w.desc}
              </p>

              {/* Examples */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  Common Examples
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {w.examples.map((ex, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{ex}</li>
                  ))}
                </ul>
              </div>

              {/* How to avoid */}
              <div style={{
                padding: '10px 14px', borderRadius: 2,
                background: 'rgba(82,192,232,0.05)',
                border: '1px solid rgba(82,192,232,0.15)',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: '#52C0E8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>
                  How to Avoid
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                  {avoidTip}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export function RegIntelTab({ state }: {
  state: BiodesignState;
  update: (s: BiodesignState) => void;
}) {
  const [innerTab, setInnerTab] = useState<InnerTab>('clearances');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hero */}
      <RegIntelHero state={state} />

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
                padding: '10px 18px', borderRadius: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? ACCENT : 'var(--text-3)',
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

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="bd-tab-in">
          {innerTab === 'clearances' && <ClearancesTab state={state} />}
          {innerTab === 'guidance'   && <GuidanceTab state={state} />}
          {innerTab === 'warnings'   && <WarningsTab state={state} />}
        </div>
      </div>
    </div>
  );
}
