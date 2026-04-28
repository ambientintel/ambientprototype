'use client';

import Link from 'next/link';

const PALETTE = [
  {
    group: 'Background',
    tokens: [
      { name: '--bg',        value: '#1C2127', label: 'App background' },
      { name: '--surface-1', value: '#252A31', label: 'Card / panel' },
      { name: '--surface-2', value: '#2F343C', label: 'Table header / raised' },
      { name: '--surface-3', value: '#383E47', label: 'Hover / active state' },
    ],
  },
  {
    group: 'Borders',
    tokens: [
      { name: '--line',        value: 'rgba(255,255,255,0.07)', label: 'Default divider' },
      { name: '--line-strong', value: 'rgba(255,255,255,0.14)', label: 'Emphasis border' },
    ],
  },
  {
    group: 'Text',
    tokens: [
      { name: '--text',   value: '#F6F7F8',                   label: 'Primary' },
      { name: '--text-2', value: 'rgba(246,247,248,0.65)',    label: 'Secondary' },
      { name: '--text-3', value: 'rgba(246,247,248,0.42)',    label: 'Tertiary' },
      { name: '--text-4', value: 'rgba(246,247,248,0.26)',    label: 'Disabled / meta' },
    ],
  },
  {
    group: 'Accent',
    tokens: [
      { name: '--accent',      value: '#2D72D2', label: 'Blueprint blue — primary CTA, links' },
      { name: '--accent-soft', value: 'rgba(45,114,210,0.18)', label: 'Soft wash' },
      { name: '--accent-hover',value: '#215DB0', label: 'Pressed / hover' },
    ],
  },
  {
    group: 'Status',
    tokens: [
      { name: 'success',  value: '#3DCC91', label: 'Active · Released · OK' },
      { name: 'warning',  value: '#FFC940', label: 'NRND · In-review' },
      { name: 'danger',   value: '#FF7373', label: 'EOL · Shortage · Error' },
      { name: 'neutral',  value: '#8F99A8', label: 'Obsolete · Draft · Disabled' },
      { name: 'in-progress', value: '#669EFF', label: 'In Progress · Building' },
    ],
  },
  {
    group: 'Semantic backgrounds (badges)',
    tokens: [
      { name: 'success-bg',     value: 'rgba(35,133,81,0.22)',  label: 'Active badge fill' },
      { name: 'warning-bg',     value: 'rgba(200,150,25,0.22)', label: 'NRND badge fill' },
      { name: 'danger-bg',      value: 'rgba(205,66,70,0.22)',  label: 'EOL badge fill' },
      { name: 'neutral-bg',     value: 'rgba(95,107,124,0.22)', label: 'Obsolete badge fill' },
      { name: 'in-progress-bg', value: 'rgba(45,114,210,0.22)', label: 'In Progress badge fill' },
    ],
  },
];

const TYPOGRAPHY = [
  { name: '--serif', value: 'Newsreader, Iowan Old Style, Georgia, serif',        role: 'Display · headlines · narratives' },
  { name: '--sans',  value: 'Inter Tight, -apple-system, Helvetica, Arial, sans', role: 'Body · UI labels · descriptions' },
  { name: '--mono',  value: 'JetBrains Mono, ui-monospace, SFMono, Menlo',        role: 'Part numbers · data · badges · meta' },
];

const TYPE_SCALE = [
  { label: 'Display', size: 44, weight: 300, font: 'serif', sample: 'Ambient Intelligence' },
  { label: 'H1', size: 28, weight: 300, font: 'serif', sample: 'Parts Library' },
  { label: 'H2', size: 22, weight: 300, font: 'serif', sample: 'Assembly BOM' },
  { label: 'Body', size: 14, weight: 400, font: 'sans', sample: 'Resident-facing fall detection with 76–81 GHz mmWave radar.' },
  { label: 'Small', size: 13, weight: 400, font: 'sans', sample: 'Active · EVT-0.1 · DigiKey' },
  { label: 'Mono', size: 12, weight: 400, font: 'mono', sample: 'AMB-001-001 · LP87524JRNFRQ1 · $0.006' },
  { label: 'Label', size: 10.5, weight: 500, font: 'mono', sample: 'TOTAL UNIT COST · PLM · PARTS · LIFECYCLE' },
];

function Swatch({ value, size = 32 }: { value: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      background: value,
      border: '1px solid rgba(255,255,255,0.10)',
    }} />
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      {children}
    </div>
  );
}

export default function ColorsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 48px 80px', maxWidth: 900, margin: '0 auto' }}>

      {/* Back */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', textDecoration: 'none', marginBottom: 40 }}>
        ← Home
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 8px' }}>
          Design System · Tokens
        </p>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          Color <em style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>& Typography</em>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, maxWidth: 480 }}>
          Palantir Blueprint dark theme. All values are CSS custom properties defined in <code style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>globals.css</code>.
        </p>
      </div>

      {/* Palette groups */}
      {PALETTE.map(group => (
        <div key={group.group} style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 4px', fontWeight: 500 }}>
            {group.group}
          </h2>
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '0 16px', padding: '8px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Token</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Usage</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Value</span>
            </div>
            {group.tokens.map((t, i) => (
              <div key={t.name} style={{
                display: 'grid', gridTemplateColumns: '180px 1fr auto',
                gap: '0 16px', alignItems: 'center',
                padding: '10px 16px',
                borderBottom: i < group.tokens.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Swatch value={t.value} size={26} />
                  <code style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent)' }}>{t.name}</code>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t.label}</span>
                <code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{t.value}</code>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Live badge preview */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 4px', fontWeight: 500 }}>
          Badge preview
        </h2>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '20px', background: 'var(--surface-1)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Active',      bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
            { label: 'NRND',        bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
            { label: 'EOL',         bg: 'rgba(205,66,70,0.22)',  color: '#FF7373' },
            { label: 'Obsolete',    bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },
            { label: 'Released',    bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
            { label: 'In Progress', bg: 'rgba(45,114,210,0.22)', color: '#669EFF' },
            { label: 'Draft',       bg: 'rgba(95,107,124,0.20)', color: '#8F99A8' },
            { label: 'Complete',    bg: 'rgba(35,133,81,0.35)',  color: '#3DCC91' },
            { label: 'Shortage',    bg: 'rgba(205,66,70,0.22)',  color: '#FF7373' },
            { label: 'OK',          bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
          ].map(b => (
            <span key={b.label} style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
              borderRadius: 99, fontSize: 11.5, fontWeight: 500,
              background: b.bg, color: b.color,
              fontFamily: 'var(--mono)', letterSpacing: '0.03em',
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 4px', fontWeight: 500 }}>
          Type families
        </h2>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-1)' }}>
          {TYPOGRAPHY.map((t, i) => (
            <div key={t.name} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr',
              gap: '0 20px', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < TYPOGRAPHY.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{t.name}</code>
              <div>
                <div style={{ fontSize: 13 }}>{t.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type scale */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 4px', fontWeight: 500 }}>
          Type scale
        </h2>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '72px 60px 1fr', gap: '0 16px', padding: '8px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {['Role', 'Size', 'Sample'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>{h}</span>
            ))}
          </div>
          {TYPE_SCALE.map((t, i) => (
            <div key={t.label} style={{
              display: 'grid', gridTemplateColumns: '72px 60px 1fr',
              gap: '0 16px', alignItems: 'baseline',
              padding: '14px 16px',
              borderBottom: i < TYPE_SCALE.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{t.size}px / {t.weight}</span>
              <span style={{
                fontFamily: `var(--${t.font})`,
                fontSize: Math.min(t.size, 28),
                fontWeight: t.weight,
                letterSpacing: t.size > 20 ? '-0.02em' : undefined,
                lineHeight: 1.2,
              }}>{t.sample}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginTop: 40 }}>
        ambientintel · design tokens · not for clinical use
      </p>
    </div>
  );
}
