'use client';
import { useState } from 'react';
import { FlowCanvas } from './flowbg';
import {
  BiodesignState, ReimbursementStrategy, ReimbCode,
  SiteOfService, CoverageStatus, ReimbPathway,
} from './data';

// ── Recommendation engine ─────────────────────────────────────────────────────

interface Recommendation {
  priority: 'high' | 'medium' | 'info';
  title: string;
  body: string;
  codeType?: string;
}

export function buildRecommendations(state: BiodesignState): Recommendation[] {
  const recs: Recommendation[] = [];
  const p    = state.comply.profile;
  const reg  = state.regulatory;
  const r    = state.reimbursement;
  const inUS = p.targetMarkets.includes('us');

  if (!inUS && p.targetMarkets.length === 0) {
    recs.push({ priority: 'info', title: 'Set target markets in Device Profile', body: 'Reimbursement recommendations are market-specific. Configure your target markets under Comply → Device Profile to enable tailored guidance.' });
    return recs;
  }

  if (!r.siteOfService) {
    recs.push({ priority: 'high', title: 'Set site of service', body: 'Site of service determines the applicable Medicare payment system: MS-DRG (inpatient), APC/OPPS (outpatient hospital), RBRVS (physician office), DME benefit (home), or ASC fee schedule.' });
  }

  if (inUS) {
    if (r.siteOfService === 'inpatient') {
      recs.push({ priority: 'high', codeType: 'MS-DRG', title: 'Identify applicable MS-DRG(s)', body: "Inpatient hospital payment uses Medicare Severity Diagnosis Related Groups (MS-DRGs). Your device's procedures drive DRG assignment via ICD-10-PCS procedure codes. Review the top 10 DRGs for your indication by volume. If your device is a new technology offering substantial clinical improvement, apply for New Technology Add-on Payment (NTAP) — CMS accepts applications each spring for the following fiscal year." });
    }
    if (r.siteOfService === 'outpatient-hospital') {
      recs.push({ priority: 'high', codeType: 'APC / CPT', title: 'Map to Ambulatory Payment Classification (APC)', body: 'Hospital outpatient services are paid under the Outpatient Prospective Payment System (OPPS) via APCs. CPT and HCPCS Level II codes drive APC assignment. Determine whether your procedure maps to an existing APC or requires a new CPT code. New implants may qualify for OPPS pass-through payment (C-codes) for 2–3 years, covering full device cost.' });
    }
    if (r.siteOfService === 'physician-office') {
      recs.push({ priority: 'high', codeType: 'CPT', title: 'Identify CPT code under RBRVS', body: 'Physician services are paid under the Resource-Based Relative Value Scale (RBRVS). A CPT code is required. If no existing Category I code covers your procedure, apply for a Category III (emerging technology) code as a bridging mechanism — Category III tracks utilization and supports future Category I promotion. AMA CPT Editorial Panel review takes 12–18 months; submit 18 months before desired effective date.' });
    }
    if (r.siteOfService === 'asc') {
      recs.push({ priority: 'high', codeType: 'CPT / ASC', title: 'Verify ASC covered procedure list', body: 'The ASC Covered Procedures List (CPL) determines Medicare payment in ambulatory surgery centers. Payment is based on the ASC fee schedule, which is a percentage of OPPS rates. Confirm that the CPT code(s) for your procedure are on the CPL; if not, petition CMS to add them through the annual OPPS/ASC rulemaking.' });
    }
    if (r.siteOfService === 'home') {
      recs.push({ priority: 'high', codeType: 'HCPCS Level II', title: 'Determine DME benefit category', body: 'Home-use devices typically bill under the Durable Medical Equipment (DME) benefit using HCPCS Level II codes. CMS requires devices to meet the DME definition (durable, primarily medical, home-use, expected use ≥3 years). If no HCPCS code exists, apply through the HCPCS National Panel (annual cycle). Consider whether Remote Physiologic Monitoring codes (CPT 99453–99458) apply for connected devices.' });
    }
    if (r.siteOfService === 'snf') {
      recs.push({ priority: 'medium', codeType: 'SNF PPS', title: 'SNF bundled payment under PDPM', body: 'Skilled nursing facility services are paid under the Patient Driven Payment Model (PDPM), a case-mix adjusted per-diem system. Most device costs are bundled into the SNF rate. Assess whether your device cost is recoverable within SNF margins or requires a value-based contract with the facility.' });
    }

    if (p.isSaMD) {
      recs.push({ priority: 'high', codeType: 'CPT', title: 'SaMD: CPT Category III and digital health codes', body: 'Software as a Medical Device typically requires a new CPT code. Category III (emerging technology) codes are the standard bridge. Additionally, evaluate Remote Physiologic Monitoring (RPM: 99453–99458), Remote Therapeutic Monitoring (RTM: 98975–98981), Principal Care Management (PCM: 99424–99427), and Chronic Care Management (CCM: 99490–99491) for software that supports ongoing monitoring or care coordination.' });
    }

    if (p.isImplantable) {
      recs.push({ priority: 'high', codeType: 'HCPCS / CPT', title: 'Implantable device: HCPCS device code + CPT procedure code', body: 'Implantable devices require both a device code (HCPCS Level II, often C-codes under OPPS) and a procedure code (CPT/ICD-10-PCS). Under OPPS, new implantable devices may qualify for transitional pass-through status (C-codes), providing full device cost reimbursement for 2–3 years. Track C-code expiration and plan for bundling into APC payment.' });
    }

    if (p.isActiveElectrical && !p.isImplantable) {
      recs.push({ priority: 'medium', codeType: 'HCPCS / CPT', title: 'Active electrical device: verify HCPCS classification', body: 'Non-implantable active devices used by patients may qualify for DME coverage (HCPCS Level II) or may be billed as a supply incident to a procedure (CPT). Clarify billing site and whether the device is separately billable or bundled into a procedure payment.' });
    }

    if (p.hasAI) {
      recs.push({ priority: 'high', codeType: 'CPT / AMA', title: 'AI/ML algorithm: new CPT code likely required', body: 'CMS and AMA have established a pathway for AI-assisted diagnostic and analytical software. Category III CPT codes now exist for several AI radiology applications (e.g., 0691T–0695T for AI coronary artery analysis). Check existing Category I/III codes before filing a new application. CMS also issued Digital Health Coverage Policy for FDA-authorized AI/ML devices — engage early.' });
    }

    if (r.technologyStatus === 'new-technology') {
      recs.push({ priority: 'high', title: 'Plan a 3–5 year reimbursement roadmap', body: 'New technologies typically face a 3–5 year gap between FDA clearance and broad commercial coverage. Milestones: (1) Temporary/unlisted code for early access, (2) Category III CPT or HCPCS Level II application (12–18 months), (3) Real-world evidence collection, (4) LCD or NCD coverage determination, (5) Category I CPT promotion. Budget for market access resources at each stage.' });
    }

    if (reg.deviceClass === 'III') {
      recs.push({ priority: 'high', codeType: 'NCD', title: 'Class III PMA: pursue CMS Parallel Review', body: 'The FDA-CMS Parallel Review Program allows concurrent review of your PMA and a National Coverage Analysis (NCA) — reducing post-approval coverage lag by 1–2 years. CMS typically requires RCT evidence for Class III device coverage. Engage CMS through the Breakthrough Devices Program for early coverage discussions. Note: many Class III devices launch under Coverage with Evidence Development (CED), which requires a registry or prospective study as a condition of coverage.' });
    }

    if (reg.pathway === '510k' && reg.deviceClass === 'II' && r.technologyStatus === 'new-technology') {
      recs.push({ priority: 'medium', title: 'Evaluate Breakthrough Device Designation', body: 'If your device provides more effective treatment for a life-threatening or irreversibly debilitating condition, FDA Breakthrough Device Designation accelerates review and enables early CMS engagement under the Transitional Coverage for Emerging Technologies (TCET) pathway, which can reduce the coverage determination timeline by 1–2 years.' });
    }

    if (reg.pathway === 'pma') {
      recs.push({ priority: 'medium', codeType: 'NCD / LCD', title: 'PMA device: national vs. local coverage determination', body: 'High-risk PMA devices often require a National Coverage Determination (NCD) or Local Coverage Determination (LCD) before Medicare will pay. NCDs are binding across all MACs; LCDs vary by jurisdiction. Engage Medicare Administrative Contractors (MACs) early — a positive LCD in a major MAC jurisdiction (e.g., Palmetto GBA, CGS, Novitas) can drive commercial coverage as well.' });
    }

    recs.push({ priority: 'info', codeType: 'ICD-10-CM', title: 'Document ICD-10-CM diagnosis codes', body: 'Map the primary and secondary ICD-10-CM codes for the conditions your device treats. These codes: (1) appear in LCD/NCD coverage criteria, (2) determine DRG assignment, (3) drive commercial prior authorization requirements, and (4) define your clinical trial enrollment criteria. Check the ICD-10-CM tabular list and CMS LCD databases for specific code requirements.' });

    recs.push({ priority: 'info', title: 'Medicaid reimbursement follows Medicare, with variation', body: 'Most states adopt Medicare coverage policies for medical devices, but payment rates and prior authorization rules vary significantly. The 50-state Medicaid landscape requires individual MAC/state review for high-volume procedures. Priority states by Medicaid volume: CA, NY, TX, FL, OH. Managed Medicaid plans (MCOs) may have separate formularies.' });
  }

  if (p.targetMarkets.includes('eu')) {
    recs.push({ priority: 'medium', title: 'EU: reimbursement is member-state specific', body: 'EU CE Mark does not confer reimbursement. Key markets: Germany (GBA additional benefit assessment — Nutzenbewertung — required within 3 months of launch; NUB for new inpatient technologies), France (CNEDiMTS assessment for implants), UK (NICE MedTech evaluation programme), Netherlands (ZIN). Budget 2–3 years post-CE Mark for first reimbursed EU market.' });
  }

  if (p.targetMarkets.includes('japan')) {
    recs.push({ priority: 'medium', title: 'Japan: NHI price listing after PMDA approval', body: 'Japan requires separate NHI (National Health Insurance) price listing after PMDA approval. New medical devices are listed at 2-year NHI price revision cycles. "Significantly innovative" devices may qualify for premium pricing. Typical timeline: 6–12 months post-PMDA approval for initial listing. Engage a local reimbursement consultant familiar with MHLW pricing criteria.' });
  }

  return recs;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2,
  padding: '9px 12px', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--sans)', outline: 'none',
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
      <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</h2>
      {subtitle && <p style={{ margin: '5px 0 0', fontSize: 14, color: 'var(--text-2)', fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );
}

function SubHead({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'var(--mono)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--line)' }}>
      {label}
    </div>
  );
}

function SegBtn<T extends string>({ value, active, onClick, children }: { value: T; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 2, fontSize: 13, cursor: 'pointer',
      background: active ? 'rgba(82,192,232,0.13)' : 'var(--surface-1)',
      color: active ? 'var(--accent)' : 'var(--text-3)',
      border: `1px solid ${active ? 'rgba(82,192,232,0.35)' : 'var(--line)'}`,
    }}>{children}</button>
  );
}

// ── Code section ──────────────────────────────────────────────────────────────

function CodeSection({
  label, codes, onChange, placeholder,
}: {
  label: string;
  codes: ReimbCode[];
  onChange: (codes: ReimbCode[]) => void;
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ code: '', description: '', notes: '' });
  const uid = () => Math.random().toString(36).slice(2, 9);

  function add() {
    if (!draft.code && !draft.description) return;
    onChange([...codes, { id: uid(), code: draft.code, description: draft.description, isPrimary: codes.length === 0, notes: draft.notes }]);
    setDraft({ code: '', description: '', notes: '' });
    setAdding(false);
  }

  function remove(id: string) { onChange(codes.filter(c => c.id !== id)); }
  function setPrimary(id: string) { onChange(codes.map(c => ({ ...c, isPrimary: c.id === id }))); }
  function patch(id: string, field: keyof ReimbCode, val: string) { onChange(codes.map(c => c.id === id ? { ...c, [field]: val } : c)); }

  return (
    <div style={{ marginBottom: 24 }}>
      <SubHead label={label} />
      {codes.length === 0 && !adding && (
        <div style={{ padding: '18px', border: '1px dashed var(--line)', borderRadius: 2, color: 'var(--text-4)', fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          No {label} codes added
        </div>
      )}
      {codes.map(c => (
        <div key={c.id} style={{ background: 'var(--surface-1)', border: `1px solid ${c.isPrimary ? 'rgba(82,192,232,0.3)' : 'var(--line)'}`, borderRadius: 2, padding: '12px 14px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8 }}>
              <input value={c.code} onChange={e => patch(c.id, 'code', e.target.value)} placeholder={placeholder}
                style={{ ...inputStyle, fontSize: 13, fontFamily: 'var(--mono)' }} />
              <input value={c.description} onChange={e => patch(c.id, 'description', e.target.value)} placeholder="Description"
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
              <button onClick={() => setPrimary(c.id)} style={{
                padding: '4px 9px', borderRadius: 2, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: c.isPrimary ? 'rgba(82,192,232,0.13)' : 'transparent',
                color: c.isPrimary ? 'var(--accent)' : 'var(--text-4)',
                border: `1px solid ${c.isPrimary ? 'rgba(82,192,232,0.3)' : 'var(--line)'}`,
              }}>{c.isPrimary ? '★ Primary' : 'Set primary'}</button>
              <button onClick={() => remove(c.id)} style={{ padding: '4px 8px', borderRadius: 2, fontSize: 11, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>✕</button>
            </div>
          </div>
          {c.isPrimary && (
            <input value={c.notes} onChange={e => patch(c.id, 'notes', e.target.value)} placeholder="Notes (evidence, source, gaps…)"
              style={{ ...inputStyle, width: '100%', marginTop: 8, fontSize: 13 }} />
          )}
        </div>
      ))}
      {adding ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 2, padding: '12px 14px', marginBottom: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, marginBottom: 8 }}>
            <input autoFocus value={draft.code} onChange={e => setDraft(d => ({ ...d, code: e.target.value }))} placeholder={placeholder}
              style={{ ...inputStyle, fontSize: 13, fontFamily: 'var(--mono)' }} />
            <input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description"
              style={inputStyle} onKeyDown={e => e.key === 'Enter' && add()} />
          </div>
          <input value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Notes"
            style={{ ...inputStyle, width: '100%', marginBottom: 8, fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={add} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--mono)' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding: '6px 12px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px solid var(--line)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '8px', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: 'none', color: 'var(--text-4)', border: '1px dashed var(--line)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          + Add {label} code
        </button>
      )}
    </div>
  );
}

// ── Coverage grid ─────────────────────────────────────────────────────────────

const COVERAGE_META: Record<CoverageStatus, { label: string; color: string; bg: string }> = {
  unknown:     { label: 'Unknown',     color: 'var(--text-4)',  bg: 'var(--surface-1)' },
  covered:     { label: 'Covered',     color: '#1e8f68',        bg: 'rgba(61,204,145,0.12)' },
  'non-covered': { label: 'Non-covered', color: '#c04040',      bg: 'rgba(192,64,64,0.10)' },
  lcd:         { label: 'LCD',         color: '#52C0E8',        bg: 'rgba(82,192,232,0.12)' },
  ncd:         { label: 'NCD',         color: '#52C0E8',        bg: 'rgba(82,192,232,0.16)' },
  ced:         { label: 'CED',         color: '#d9a020',        bg: 'rgba(217,160,32,0.12)' },
  'no-policy': { label: 'No policy',   color: '#8a7d6e',        bg: 'rgba(120,110,100,0.10)' },
};

function CoverageRow({ label, value, onChange }: { label: string; value: CoverageStatus; onChange: (v: CoverageStatus) => void }) {
  const statuses: CoverageStatus[] = ['unknown', 'covered', 'non-covered', 'lcd', 'ncd', 'ced', 'no-policy'];
  const m = COVERAGE_META[value];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {statuses.map(s => {
          const sm = COVERAGE_META[s];
          const active = value === s;
          return (
            <button key={s} onClick={() => onChange(s)} style={{
              padding: '3px 10px', borderRadius: 2, fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
              background: active ? sm.bg : 'transparent',
              color: active ? sm.color : 'var(--text-4)',
              border: `1px solid ${active ? sm.color + '55' : 'var(--line)'}`,
            }}>{sm.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Recommendation panel ──────────────────────────────────────────────────────

const REC_META = {
  high:   { color: '#c04040', bg: 'rgba(192,64,64,0.10)',   label: 'High priority' },
  medium: { color: '#d9a020', bg: 'rgba(217,160,32,0.10)', label: 'Medium priority' },
  info:   { color: 'var(--text-3)', bg: 'var(--surface-1)', label: 'Note' },
};

function RecommendationPanel({ state }: { state: BiodesignState }) {
  const [open, setOpen] = useState<number | null>(null);
  const recs = buildRecommendations(state);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recommendations</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Based on your device profile, regulatory pathway, and target markets — {recs.filter(r => r.priority === 'high').length} high priority item{recs.filter(r => r.priority === 'high').length !== 1 ? 's' : ''}.
          </div>
        </div>
      </div>
      {recs.map((rec, i) => {
        const m = REC_META[rec.priority];
        const isOpen = open === i;
        return (
          <div key={i} onClick={() => setOpen(isOpen ? null : i)} style={{
            background: isOpen ? m.bg : 'var(--surface-1)',
            border: `1px solid ${isOpen ? m.color + '44' : 'var(--line)'}`,
            borderLeft: `3px solid ${m.color}`,
            borderRadius: 2, padding: '12px 16px', marginBottom: 6, cursor: 'pointer',
            transition: 'background 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</span>
                {rec.codeType && (
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: 'var(--surface-2)', color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rec.codeType}</span>
                )}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{rec.title}</span>
              </div>
              <span style={{ color: 'var(--text-4)', fontSize: 11, fontFamily: 'var(--mono)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{rec.body}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function ReimbursementTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const r = state.reimbursement;

  function set(patch: Partial<ReimbursementStrategy>) {
    update({ ...state, reimbursement: { ...r, ...patch } });
  }

  const siteOptions: { value: SiteOfService; label: string }[] = [
    { value: 'inpatient',          label: 'Inpatient' },
    { value: 'outpatient-hospital',label: 'Outpatient Hospital' },
    { value: 'asc',                label: 'ASC' },
    { value: 'physician-office',   label: 'Physician Office' },
    { value: 'home',               label: 'Home' },
    { value: 'snf',                label: 'SNF' },
  ];

  const pathwayOptions: { value: NonNullable<ReimbPathway>; label: string; desc: string }[] = [
    { value: 'existing-codes',       label: 'Existing codes adequate',    desc: 'Current CPT/HCPCS codes cover the procedure and device.' },
    { value: 'new-code-needed',      label: 'New code needed',            desc: 'No existing code covers this procedure; AMA or CMS application required.' },
    { value: 'coverage-determination', label: 'Coverage determination',   desc: 'Codes exist but Medicare coverage policy (LCD/NCD) is absent or unfavorable.' },
    { value: 'breakthrough',         label: 'Breakthrough / TCET',        desc: 'FDA Breakthrough designation enables Transitional Coverage for Emerging Technologies.' },
  ];

  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, marginBottom: 24, height: 114 }}>
        <FlowCanvas accent="#52E8B4" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(19,30,44,0.88) 45%, transparent)' }} />
        <div style={{ position: 'relative', padding: '22px 28px' }}>
          <div style={{ fontSize: 9, color: '#52E8B4', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--mono)', marginBottom: 8 }}>03 / Implement · Reimbursement</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reimbursement Strategy</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>Codes, coverage pathways, and payer strategy.</div>
        </div>
      </div>

      {/* Recommendations — always visible, always fresh */}
      <RecommendationPanel state={state} />

      {/* Context */}
      <div style={{ marginBottom: 28 }}>
        <SubHead label="Device Context" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Site of service</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {siteOptions.map(o => (
                <SegBtn key={o.value} value={o.value} active={r.siteOfService === o.value}
                  onClick={() => set({ siteOfService: r.siteOfService === o.value ? null : o.value })}>
                  {o.label}
                </SegBtn>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Technology status</div>
            <div style={{ display: 'flex', gap: 5 }}>
              <SegBtn value="new-technology" active={r.technologyStatus === 'new-technology'} onClick={() => set({ technologyStatus: r.technologyStatus === 'new-technology' ? null : 'new-technology' })}>New technology</SegBtn>
              <SegBtn value="established" active={r.technologyStatus === 'established'} onClick={() => set({ technologyStatus: r.technologyStatus === 'established' ? null : 'established' })}>Established category</SegBtn>
            </div>
          </div>
        </div>
      </div>

      {/* Code tracker */}
      <div style={{ marginBottom: 28 }}>
        <SubHead label="Code Tracker" />
        <CodeSection label="CPT" codes={r.cptCodes} onChange={v => set({ cptCodes: v })} placeholder="e.g. 93000" />
        <CodeSection label="ICD-10-CM" codes={r.icdCodes} onChange={v => set({ icdCodes: v })} placeholder="e.g. I50.9" />
        <CodeSection label="MS-DRG" codes={r.drgCodes} onChange={v => set({ drgCodes: v })} placeholder="e.g. DRG 291" />
        <CodeSection label="HCPCS Level II" codes={r.hcpcsCodes} onChange={v => set({ hcpcsCodes: v })} placeholder="e.g. A4556" />
      </div>

      {/* Coverage status */}
      <div style={{ marginBottom: 28 }}>
        <SubHead label="Payer Coverage Status" />
        <CoverageRow label="Medicare" value={r.medicareCoverage} onChange={v => set({ medicareCoverage: v })} />
        <CoverageRow label="Medicaid" value={r.medicaidCoverage} onChange={v => set({ medicaidCoverage: v })} />
        <CoverageRow label="Commercial" value={r.commercialCoverage} onChange={v => set({ commercialCoverage: v })} />
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Coverage gaps and notes</div>
          <textarea value={r.coverageNotes} onChange={e => set({ coverageNotes: e.target.value })}
            placeholder="Known coverage gaps, prior auth requirements, LCD/NCD citations, MAC contacts…"
            rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
        </div>
      </div>

      {/* Pathway + payment */}
      <div style={{ marginBottom: 28 }}>
        <SubHead label="Reimbursement Pathway" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {pathwayOptions.map(o => {
            const active = r.pathway === o.value;
            return (
              <button key={o.value} onClick={() => set({ pathway: active ? null : o.value })} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 2, cursor: 'pointer', textAlign: 'left',
                background: active ? 'rgba(82,192,232,0.08)' : 'var(--surface-1)',
                border: `1px solid ${active ? 'rgba(82,192,232,0.35)' : 'var(--line)'}`,
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background 0.1s',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: active ? 'var(--accent)' : 'var(--surface-3)', border: `1px solid ${active ? 'var(--accent)' : 'var(--line-strong)'}` }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text-2)' }}>{o.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{o.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Estimated Medicare payment</div>
            <input value={r.estimatedPayment} onChange={e => set({ estimatedPayment: e.target.value })} placeholder="e.g. $1,200 (APC 5115)"
              style={{ ...inputStyle, width: '100%', height: 38 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Key barriers</div>
            <input value={r.barriers} onChange={e => set({ barriers: e.target.value })} placeholder="e.g. No existing CPT, CED requirement"
              style={{ ...inputStyle, width: '100%', height: 38 }} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <SubHead label="Notes" />
        <textarea value={r.notes} onChange={e => set({ notes: e.target.value })}
          placeholder="Reimbursement consultant contacts, payer meeting notes, market access timeline, reference links…"
          rows={5} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
      </div>
    </div>
  );
}
