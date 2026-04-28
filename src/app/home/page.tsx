'use client';
import Link from 'next/link';

const HERO = {
  href: '/dashboard',
  label: 'Nurse Dashboard',
  tag: 'Demo',
  tagColor: { bg: 'rgba(45,114,210,0.18)', color: '#669EFF' },
  description: 'Resident activity monitoring, Ella AI daily update, fall and activity stats.',
  meta: 'ambientapp · IWR6843AOP',
};

const PAGES = [
  {
    href: '/bom',
    label: 'Bill of Materials',
    tag: 'PLM',
    tagColor: { bg: 'rgba(45,114,210,0.18)', color: '#669EFF' },
    description: 'Parts library, assembly BOM, and build orders for the EVT-0.1 hardware revision. 57 parts, lifecycle tracking, priced from DigiKey / Mouser.',
    meta: 'ambientelectrical · EVT-0.1',
  },
  {
    href: '/gapanalysis',
    label: '21 CFR 820 Gap Analysis',
    tag: 'QMS',
    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
    description: 'Interactive compliance tracker for all 15 subparts of 21 CFR Part 820 — mark status, add evidence notes, auto-saved to localStorage.',
    meta: 'ambientqa · FDA QSR',
  },
  {
    href: '/samd',
    label: 'SaMD Regulatory Dashboard',
    tag: 'SaMD',
    tagColor: { bg: 'rgba(35,133,81,0.22)', color: '#3DCC91' },
    description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking for the regulated fall-detection algorithm package.',
    meta: 'ambientsamd · IEC 62304 / ISO 14971',
  },
  {
    href: '/colors',
    label: 'Color & Typography',
    tag: 'Design',
    tagColor: { bg: 'rgba(45,114,210,0.18)', color: '#669EFF' },
    description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and type scale for the Palantir Blueprint dark theme.',
    meta: 'ambientdesign · tokens · globals.css',
  },
  {
    href: '/brand',
    label: 'Brand & Color Picker',
    tag: 'Design',
    tagColor: { bg: 'rgba(45,114,210,0.18)', color: '#669EFF' },
    description: 'Interactive color palette — click any swatch to copy its value. Brand mark at scale, badge states, and type scale.',
    meta: 'ambientdesign · brand · interactive',
  },
];

function Tag({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 99, fontSize: 10.5, fontWeight: 500,
      background: style.bg, color: style.color,
      fontFamily: 'var(--mono)', letterSpacing: '0.04em',
    }}>{label}</span>
  );
}

function PageCard({ page }: { page: typeof PAGES[0] }) {
  return (
    <Link href={page.href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: '100%',
        transition: 'border-color 0.12s, box-shadow 0.12s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-strong)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tag label={page.tag} style={page.tagColor} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
            {page.href} ↗
          </span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 6 }}>
            {page.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
            {page.description}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 2 }}>
          {page.meta}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '64px 24px 80px',
    }}>

      {/* Brand */}
      <div style={{ marginBottom: 52, textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.02em' }}>
          Ambient <em>Intelligence</em>
        </span>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '6px 0 0' }}>
          Prototype · Internal tools
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 780 }}>

        {/* Hero — full width */}
        <PageCard page={HERO} />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-4)', whiteSpace: 'nowrap',
          }}>
            Ambient Intelligence Control Center
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {/* Two-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}>
          {PAGES.map(page => <PageCard key={page.href} page={page} />)}
        </div>

      </div>

      {/* Footer */}
      <p style={{
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginTop: 56,
      }}>
        ambientintel · not for clinical use
      </p>
    </div>
  );
}