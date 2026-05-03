'use client';
import { useState } from 'react';
import {
  BiodesignState, DeviceProfile, StandardCompliance, ChecklistItem,
  ComplianceStatus, TargetMarket, PatientContactType, PatientContactDuration,
  SterilizationMethod, StandardDef, StandardCategory,
} from './data';
import { STANDARDS, getApplicableStandards, CATEGORY_META, MARKET_META } from './standards';
import { CategoryIcon, CertBadgeIcon, CERT_BADGES } from './icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function seedCompliance(std: StandardDef): StandardCompliance {
  return {
    standardId: std.id,
    status: 'not-started',
    notes: '',
    assignee: '',
    targetDate: '',
    checklist: std.defaultChecklist.map((text: string, i: number) => ({ id: `${std.id}-${i}`, text, done: false })),
  };
}

function checklistProgress(c: StandardCompliance): { done: number; total: number } {
  return { done: c.checklist.filter(i => i.done).length, total: c.checklist.length };
}

function groupByCategory(standards: StandardDef[]): [StandardCategory, StandardDef[]][] {
  const map = new Map<StandardCategory, StandardDef[]>();
  for (const s of standards) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return Array.from(map.entries());
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<ComplianceStatus, { label: string; bg: string; color: string }> = {
  'not-started': { label: 'Not started', bg: 'rgba(120,110,100,0.12)', color: '#8a7d6e' },
  'in-progress':  { label: 'In progress',  bg: 'rgba(184,131,10,0.14)',  color: '#9a7000' },
  'complete':     { label: 'Complete',     bg: 'rgba(61,204,145,0.14)',  color: '#1e8f68' },
  'na':           { label: 'N/A',          bg: 'rgba(120,110,100,0.08)', color: '#6a6060' },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#c04040',
  high:     '#d9a020',
  medium:   '#6a8ab0',
};

function StatusBadge({ status }: { status: ComplianceStatus }) {
  const m = STATUS_META[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 3, fontSize: 11, fontWeight: 600,
      background: m.bg, color: m.color,
      fontFamily: 'var(--mono)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      whiteSpace: 'nowrap',
    }}>{m.label}</span>
  );
}

function Toggle({
  label, value, onChange, sublabel,
}: { label: string; value: boolean; onChange: (v: boolean) => void; sublabel?: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px',
        borderRadius: 2, cursor: 'pointer', textAlign: 'left',
        background: value ? 'rgba(45,114,210,0.11)' : 'var(--surface-1)',
        color: value ? 'var(--accent)' : 'var(--text-2)',
        border: `1px solid ${value ? 'rgba(45,114,210,0.32)' : 'var(--line)'}`,
        transition: 'background 0.1s',
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: 2, flexShrink: 0,
        background: value ? 'var(--accent)' : 'var(--surface-3)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--line-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#fff',
      }}>{value ? '✓' : ''}</span>
      <span style={{ fontSize: 13 }}>
        {label}
        {sublabel && <span style={{ display: 'block', fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>{sublabel}</span>}
      </span>
    </button>
  );
}

function SegmentSelect<T extends string>({
  label, options, value, onChange, nullable = true,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  nullable?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map(o => {
          const active = value === o.value;
          return (
            <button key={o.value}
              onClick={() => onChange(nullable && active ? null : o.value)}
              style={{
                padding: '5px 11px', borderRadius: 2, fontSize: 13, cursor: 'pointer',
                background: active ? 'rgba(45,114,210,0.13)' : 'var(--surface-1)',
                color: active ? 'var(--accent)' : 'var(--text-3)',
                border: `1px solid ${active ? 'rgba(45,114,210,0.35)' : 'var(--line)'}`,
              }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase',
        letterSpacing: '0.14em', fontFamily: 'var(--mono)', marginBottom: 10,
        paddingBottom: 6, borderBottom: '1px solid var(--line)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
      <h2 style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        color: 'var(--text-3)', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>{title}</h2>
      {subtitle && <p style={{ margin: '5px 0 0', fontSize: 14, color: 'var(--text-2)', fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );
}

// ── Certification Panel ───────────────────────────────────────────────────────

function certIsActive(certId: string, profile: DeviceProfile): boolean {
  switch (certId) {
    case 'HIPAA': return (profile.isSaMD || profile.isNetworked) && profile.targetMarkets.includes('us');
    case 'UL':    return profile.isActiveElectrical && (profile.targetMarkets.includes('us') || profile.targetMarkets.includes('canada'));
    case 'FDA':   return profile.targetMarkets.includes('us');
    case 'CE':    return profile.targetMarkets.includes('eu');
    case 'ANSI':  return profile.isActiveElectrical && profile.targetMarkets.includes('us');
    case 'FCC':   return (profile.isActiveElectrical || profile.isNetworked) && profile.targetMarkets.includes('us');
    case 'ISO':   return true;
    case 'TGA':   return profile.targetMarkets.includes('australia');
    case 'PMDA':  return profile.targetMarkets.includes('japan');
    case 'UKCA':  return profile.targetMarkets.includes('uk');
    default:      return false;
  }
}

function CertificationPanel({ profile }: { profile: DeviceProfile }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase',
        letterSpacing: '0.14em', fontFamily: 'var(--mono)', marginBottom: 10,
        paddingBottom: 6, borderBottom: '1px solid var(--line)',
      }}>Certifications Required</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {CERT_BADGES.map(badge => {
          const active = certIsActive(badge.id, profile);
          return (
            <div key={badge.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '10px 8px',
              background: active ? 'var(--surface-1)' : 'transparent',
              border: `1px solid ${active ? 'var(--line-strong)' : 'var(--line)'}`,
              borderRadius: 2,
              opacity: active ? 1 : 0.3,
              transition: 'opacity 0.15s',
            }}>
              <CertBadgeIcon id={badge.id} size={28} color={active ? 'var(--accent)' : 'var(--text-4)'} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: active ? 'var(--text-2)' : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{badge.label}</span>
              <span style={{ fontSize: 9, color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.3 }}>{badge.subtitle}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

export function ProfileTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const profile = state.comply.profile;

  function set(patch: Partial<DeviceProfile>) {
    update({ ...state, comply: { ...state.comply, profile: { ...profile, ...patch } } });
  }

  const applicable = getApplicableStandards(profile);
  const critCount = applicable.filter(s => s.priority === 'critical').length;

  const markets: TargetMarket[] = ['us', 'eu', 'japan', 'canada', 'australia', 'brazil', 'uk'];

  function toggleMarket(m: TargetMarket) {
    const cur = profile.targetMarkets;
    set({ targetMarkets: cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m] });
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <SectionHeader
        title="Device Profile"
        subtitle="Configure device attributes and target markets. The Standards tracker auto-updates to show only applicable standards."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{applicable.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3, fontFamily: 'var(--mono)' }}>Applicable standards</div>
        </div>
        <div style={{ padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: critCount > 0 ? '#c04040' : 'var(--text-4)' }}>{critCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3, fontFamily: 'var(--mono)' }}>Critical requirements</div>
        </div>
      </div>

      <CertificationPanel profile={profile} />

      <ProfileSection title="Software & Intelligence">
        <Toggle label="Contains software" value={profile.hasSoftware} onChange={v => set({ hasSoftware: v })} />
        <Toggle label="Software as Medical Device (SaMD)" value={profile.isSaMD} onChange={v => set({ isSaMD: v })} sublabel="standalone software" />
        <Toggle label="AI / ML algorithm" value={profile.hasAI} onChange={v => set({ hasAI: v })} sublabel="requires PCCP for US" />
      </ProfileSection>

      <ProfileSection title="Electrical & Power">
        <Toggle label="Active electrical device" value={profile.isActiveElectrical} onChange={v => set({ isActiveElectrical: v })} sublabel="IEC 60601-1 applies" />
        <Toggle label="Device has alarms" value={profile.hasAlarms} onChange={v => set({ hasAlarms: v })} sublabel="IEC 60601-1-8 applies" />
        <Toggle label="Battery powered" value={profile.hasBattery} onChange={v => set({ hasBattery: v })} sublabel="lithium cell → IEC 62133" />
        <Toggle label="Intended for home use" value={profile.isHomeUse} onChange={v => set({ isHomeUse: v })} sublabel="IEC 60601-1-11 applies" />
        <Toggle label="Networked / wireless" value={profile.isNetworked} onChange={v => set({ isNetworked: v })} sublabel="FDA cyber guidance" />
      </ProfileSection>

      <ProfileSection title="Patient Contact">
        <Toggle label="Has patient contact" value={profile.hasPatientContact} onChange={v => set({ hasPatientContact: v })} sublabel="ISO 10993 series" />
        <Toggle label="Blood contact" value={profile.bloodContact} onChange={v => set({ bloodContact: v })} sublabel="ISO 10993-4" />
        <Toggle label="Implantable" value={profile.isImplantable} onChange={v => set({ isImplantable: v })} sublabel="ISO 10993-6" />
      </ProfileSection>

      {profile.hasPatientContact && (
        <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SegmentSelect
            label="Contact Category"
            value={profile.patientContactType}
            onChange={v => set({ patientContactType: v as PatientContactType | null })}
            options={[
              { value: 'surface', label: 'Surface' },
              { value: 'external-communicating', label: 'Ext. Communicating' },
              { value: 'implant', label: 'Implant' },
            ]}
          />
          <SegmentSelect
            label="Contact Duration"
            value={profile.patientContactDuration}
            onChange={v => set({ patientContactDuration: v as PatientContactDuration | null })}
            options={[
              { value: 'limited', label: 'Limited (<24h)' },
              { value: 'prolonged', label: 'Prolonged (24h–30d)' },
              { value: 'permanent', label: 'Permanent (>30d)' },
            ]}
          />
        </div>
      )}

      <ProfileSection title="Sterility & Packaging">
        <Toggle label="Provided sterile" value={profile.isSterile} onChange={v => set({ isSterile: v })} sublabel="ISO 11607 always; method-specific below" />
      </ProfileSection>

      {profile.isSterile && (
        <div style={{ marginBottom: 24 }}>
          <SegmentSelect
            label="Sterilization Method"
            value={profile.sterilizationMethod}
            onChange={v => set({ sterilizationMethod: v as SterilizationMethod | null })}
            options={[
              { value: 'eo', label: 'Ethylene oxide' },
              { value: 'radiation', label: 'Radiation (γ / e-beam)' },
              { value: 'steam', label: 'Steam / autoclave' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>
      )}

      <ProfileSection title="Device Classification">
        <Toggle label="In vitro diagnostic (IVD)" value={profile.isIVD} onChange={v => set({ isIVD: v })} sublabel="EU IVDR instead of MDR" />
        <Toggle label="Combination product" value={profile.isCombination} onChange={v => set({ isCombination: v })} sublabel="drug + device or biologic + device" />
      </ProfileSection>

      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase',
          letterSpacing: '0.14em', fontFamily: 'var(--mono)', marginBottom: 10,
          paddingBottom: 6, borderBottom: '1px solid var(--line)',
        }}>Target Markets</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {markets.map(m => {
            const active = profile.targetMarkets.includes(m);
            const meta = MARKET_META[m];
            return (
              <button key={m} onClick={() => toggleMarket(m)}
                style={{
                  padding: '6px 14px', borderRadius: 2, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: active ? 'rgba(45,114,210,0.13)' : 'var(--surface-1)',
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  border: `1px solid ${active ? 'rgba(45,114,210,0.35)' : 'var(--line)'}`,
                }}>{meta.label}</button>
            );
          })}
        </div>
        {profile.targetMarkets.length === 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic' }}>
            Select markets to show market-specific regulations (21 CFR, EU MDR, PMDA, etc.)
          </p>
        )}
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2, fontSize: 12, color: 'var(--text-3)' }}>
        <strong style={{ color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>{applicable.length} standards</strong> apply to this device profile.
        {' '}Switch to the <strong style={{ color: 'var(--text-2)' }}>Standards</strong> tab to track compliance for each.
      </div>
    </div>
  );
}

// ── Standards Tab ─────────────────────────────────────────────────────────────

export function StandardsTab({ state, update }: { state: BiodesignState; update: (s: BiodesignState) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ComplianceStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<StandardCategory | 'all'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const profile = state.comply.profile;
  const compliance = state.comply.compliance;

  function getCompliance(std: StandardDef): StandardCompliance {
    return compliance[std.id] ?? seedCompliance(std);
  }

  function saveCompliance(stdId: string, patch: Partial<StandardCompliance>) {
    const existing = compliance[stdId] ?? seedCompliance(STANDARDS.find(s => s.id === stdId)!);
    update({
      ...state,
      comply: {
        ...state.comply,
        compliance: { ...compliance, [stdId]: { ...existing, ...patch } },
      },
    });
  }

  function toggleChecklistItem(stdId: string, itemId: string) {
    const c = getCompliance(STANDARDS.find(s => s.id === stdId)!);
    saveCompliance(stdId, {
      checklist: c.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item),
    });
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const applicable = getApplicableStandards(profile);

  const stats = {
    total: applicable.length,
    complete: applicable.filter(s => (compliance[s.id]?.status ?? 'not-started') === 'complete').length,
    inProgress: applicable.filter(s => (compliance[s.id]?.status ?? 'not-started') === 'in-progress').length,
    notStarted: applicable.filter(s => (compliance[s.id]?.status ?? 'not-started') === 'not-started').length,
    na: applicable.filter(s => (compliance[s.id]?.status ?? 'not-started') === 'na').length,
  };

  const filtered = applicable.filter(s => {
    const c = compliance[s.id];
    const statusOk = filterStatus === 'all' || (c?.status ?? 'not-started') === filterStatus;
    const catOk = filterCategory === 'all' || s.category === filterCategory;
    return statusOk && catOk;
  });

  const grouped = groupByCategory(filtered);

  const categories = Array.from(new Set(applicable.map(s => s.category))) as StandardCategory[];

  if (applicable.length === 0) {
    return (
      <div>
        <SectionHeader title="Standards Tracker" />
        <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 2, color: 'var(--text-4)', fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No standards applicable yet — configure your device profile first.
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Standards Tracker" subtitle={`${stats.total} applicable standards across ${categories.length} categories`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
        {([
          ['Complete',     stats.complete,    '#1e8f68'],
          ['In Progress',  stats.inProgress,  '#9a7000'],
          ['Not Started',  stats.notStarted,  'var(--text-4)'],
          ['N/A',          stats.na,          'var(--text-4)'],
        ] as const).map(([label, value, color]) => (
          <div key={label} style={{ padding: '10px 14px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3, fontFamily: 'var(--mono)' }}>{label}</div>
          </div>
        ))}
      </div>

      <CertificationPanel profile={profile} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['all', 'not-started', 'in-progress', 'complete', 'na'] as const).map(s => {
            const label = s === 'all' ? 'All' : STATUS_META[s]?.label ?? s;
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{
                  padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: filterStatus === s ? 'var(--surface-3)' : 'transparent',
                  color: filterStatus === s ? 'var(--text-2)' : 'var(--text-4)',
                  border: `1px solid ${filterStatus === s ? 'var(--line-strong)' : 'var(--line)'}`,
                }}>{label}</button>
            );
          })}
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--line)', flexShrink: 0 }} />
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterCategory('all')}
            style={{
              padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
              background: filterCategory === 'all' ? 'var(--surface-3)' : 'transparent',
              color: filterCategory === 'all' ? 'var(--text-2)' : 'var(--text-4)',
              border: `1px solid ${filterCategory === 'all' ? 'var(--line-strong)' : 'var(--line)'}`,
            }}>All</button>
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            return (
              <button key={cat} onClick={() => setFilterCategory(cat === filterCategory ? 'all' : cat)}
                style={{
                  padding: '6px 14px', borderRadius: 2, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: filterCategory === cat ? meta.bg : 'transparent',
                  color: filterCategory === cat ? meta.color : 'var(--text-4)',
                  border: `1px solid ${filterCategory === cat ? meta.color + '44' : 'var(--line)'}`,
                }}>{cat}</button>
            );
          })}
        </div>
      </div>

      {grouped.map(([category, standards]) => {
        const meta = CATEGORY_META[category];
        const collapsed = collapsedCategories.has(category);
        const catComplete = standards.filter(s => (compliance[s.id]?.status ?? 'not-started') === 'complete').length;
        return (
          <div key={category} style={{ marginBottom: 14 }}>
            <button
              onClick={() => toggleCategory(category)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 14px', borderRadius: 2, cursor: 'pointer',
                background: meta.bg, border: `1px solid ${meta.color}2a`,
                marginBottom: collapsed ? 0 : 4,
              }}
            >
              <CategoryIcon category={category} size={14} color={meta.color} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{category}</span>
              <span style={{ fontSize: 11, color: meta.color + '99', marginLeft: 2 }}>{standards.length}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: meta.color, letterSpacing: '0.04em' }}>
                {catComplete}/{standards.length}
              </span>
              <span style={{ color: meta.color, fontSize: 12, fontFamily: 'var(--mono)' }}>{collapsed ? '▶' : '▼'}</span>
            </button>

            {!collapsed && standards.map(std => (
              <StandardRow
                key={std.id}
                std={std}
                compliance={getCompliance(std)}
                isOpen={expanded === std.id}
                onToggle={() => setExpanded(expanded === std.id ? null : std.id)}
                onStatusChange={status => {
                  saveCompliance(std.id, { status });
                  if (!compliance[std.id]) saveCompliance(std.id, { ...seedCompliance(std), status });
                }}
                onFieldChange={(field, val) => saveCompliance(std.id, { [field]: val } as Partial<StandardCompliance>)}
                onChecklistToggle={itemId => toggleChecklistItem(std.id, itemId)}
              />
            ))}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 2, color: 'var(--text-4)', fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          No standards match the current filter.
        </div>
      )}
    </div>
  );
}

// ── Standard Row ──────────────────────────────────────────────────────────────

function StandardRow({
  std, compliance, isOpen, onToggle, onStatusChange, onFieldChange, onChecklistToggle,
}: {
  std: StandardDef;
  compliance: StandardCompliance;
  isOpen: boolean;
  onToggle: () => void;
  onStatusChange: (s: ComplianceStatus) => void;
  onFieldChange: (field: keyof StandardCompliance, val: string) => void;
  onChecklistToggle: (itemId: string) => void;
}) {
  const prog = checklistProgress(compliance);
  const catMeta = CATEGORY_META[std.category];
  const priorityColor = PRIORITY_COLOR[std.priority];
  const progressPct = prog.total > 0 ? (prog.done / prog.total) * 100 : 0;

  const checklist: ChecklistItem[] = compliance.checklist.length > 0
    ? compliance.checklist
    : std.defaultChecklist.map((text: string, i: number) => ({ id: `${std.id}-${i}`, text, done: false }));

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 2,
      marginBottom: 4, overflow: 'hidden',
      borderLeft: `3px solid ${priorityColor}`,
    }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{std.number}</span>
            {std.markets !== 'global' && (std.markets as TargetMarket[]).map((m: TargetMarket) => (
              <span key={m} style={{
                fontFamily: 'var(--mono)', fontSize: 9, padding: '1px 5px', borderRadius: 2,
                background: catMeta.bg, color: catMeta.color,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>{MARKET_META[m].label}</span>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2, lineHeight: 1.3 }}>{std.title}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {prog.total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 44, height: 3, borderRadius: 1, background: 'var(--surface-3)' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 1, background: progressPct === 100 ? '#3DCC91' : '#2D72D2', transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{prog.done}/{prog.total}</span>
            </div>
          )}
          <StatusBadge status={compliance.status} />
          <span style={{ color: 'var(--text-4)', fontSize: 12, fontFamily: 'var(--mono)' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: '12px 0' }}>{std.description}</p>

          {/* Status selector */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
            {(['not-started', 'in-progress', 'complete', 'na'] as ComplianceStatus[]).map(s => {
              const m = STATUS_META[s];
              return (
                <button key={s} onClick={() => onStatusChange(s)}
                  style={{
                    padding: '3px 10px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                    fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: compliance.status === s ? m.bg : 'transparent',
                    color: compliance.status === s ? m.color : 'var(--text-4)',
                    border: `1px solid ${compliance.status === s ? m.color + '55' : 'var(--line)'}`,
                  }}>{m.label}</button>
              );
            })}
          </div>

          {/* Checklist */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', marginBottom: 8 }}>Checklist</div>
            {checklist.map(item => (
              <label key={item.id}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 8, cursor: 'pointer' }}
                onClick={() => onChecklistToggle(item.id)}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: 2, flexShrink: 0, marginTop: 1,
                  background: item.done ? '#3DCC91' : 'var(--surface-2)',
                  border: `1px solid ${item.done ? '#3DCC91' : 'var(--line-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff',
                }}>{item.done ? '✓' : ''}</span>
                <span style={{ fontSize: 13, color: item.done ? 'var(--text-3)' : 'var(--text-2)', lineHeight: 1.5, textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          {/* Meta fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Assignee</label>
              <input value={compliance.assignee} onChange={e => onFieldChange('assignee', e.target.value)}
                placeholder="Owner / responsible party"
                style={{ width: '100%', height: 32, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Target Date</label>
              <input type="date" value={compliance.targetDate} onChange={e => onFieldChange('targetDate', e.target.value)}
                style={{ width: '100%', height: 32, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '0 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none', colorScheme: 'dark' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={compliance.notes} onChange={e => onFieldChange('notes', e.target.value)}
              placeholder="Evidence links, open questions, lab contacts, audit notes…"
              rows={3}
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '7px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical' }} />
          </div>
        </div>
      )}
    </div>
  );
}
