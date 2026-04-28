'use client';
import { useState } from 'react';
import Link from 'next/link';

const MODULES = [
  {
    href: '/dashboard',
    tag: 'Operations',
    label: 'Nurse Dashboard',
    description: 'Real-time resident activity monitoring, fall-detection alerts, and AI-generated clinical summaries across all floors.',
    meta: 'IWR6843AOP · Live',
    featured: true,
  },
  {
    href: '/bom',
    tag: 'Engineering',
    label: 'Bill of Materials',
    description: 'Full parts library, assembly BOMs, and build orders for EVT-0.1 hardware. 57 components priced from DigiKey and Mouser.',
    meta: 'EVT-0.1 · 57 parts',
  },
  {
    href: '/gapanalysis',
    tag: 'Compliance',
    label: '21 CFR 820 Gap Analysis',
    description: 'Interactive tracker for all 15 subparts of 21 CFR Part 820. Mark evidence, add notes, auto-persisted.',
    meta: 'FDA QSR · 15 subparts',
  },
  {
    href: '/samd',
    tag: 'Regulatory',
    label: 'SaMD Dashboard',
    description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking per IEC 62304 and ISO 14971.',
    meta: 'IEC 62304 / ISO 14971',
  },
  {
    href: '/cloud',
    tag: 'Infrastructure',
    label: 'Cloud Infrastructure',
    description: 'AWS backend — seven services across fall-alert hot path, Parquet cold path, Ella AI narratives, and the Nurse API.',
    meta: 'ambientcloud · AWS · Terraform',
  },
  {
    href: '/colors',
    tag: 'Design',
    label: 'Color & Typography',
    description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and full type scale.',
    meta: 'globals.css · tokens',
  },
  {
    href: '/brand',
    tag: 'Design',
    label: 'Brand & Color Picker',
    description: 'Interactive color palette with copyable hex values. Brand mark at scale, badge states, and type scale reference.',
    meta: 'ambientdesign · interactive',
  },
];

const C = {
  bg:        '#0C0D0F',
  surface:   '#13151A',
  surface2:  '#1C1F26',
  border:    'rgba(255,255,255,0.07)',
  accent:    '#2D72D2',
  accentDim: 'rgba(45,114,210,0.10)',
  text:      '#EDEEF0',
  text2:     '#9A9B9D',
  text3:     '#5C5E62',
};

export default function ControlCenter() {
  const [hovered, setHovered] = useState<string | null>(null);
  const featured = MODULES.filter(m => m.featured);
  const supporting = MODULES.filter(m => !m.featured);

  return (
    <>
      <style>{`
        .cc-card-arrow { transition: transform 0.2s ease; }
        .cc-card:hover .cc-card-arrow { transform: translate(3px,-3px); }
        .cc-nav-link { transition: color 0.2s ease; }
        .cc-nav-link:hover { color: #EDEEF0 !important; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(12,13,15,0.92)',
          backdropFilter: 'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: C.text }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[['Dashboard','/dashboard'],['BOM','/bom'],['Gap Analysis','/gapanalysis'],['SaMD','/samd'],['Cloud','/cloud'],['Colors','/colors'],['Brand','/brand']].map(([label, href]) => (
              <Link key={href} href={href} className="cc-nav-link" style={{ textDecoration: 'none', color: C.text2, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, padding: '5px 12px' }}>
              ← Back
            </span>
          </Link>
        </nav>

        {/* ── Header ── */}
        <div style={{ padding: '64px 48px 48px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
            Ambient Intelligence
          </div>
          <h1 style={{
            fontFamily: 'var(--serif)', fontWeight: 300,
            fontSize: 'clamp(32px, 4vw, 54px)', letterSpacing: '-0.03em',
            margin: '0 0 12px', color: C.text, lineHeight: 1.1,
          }}>
            Control Center
          </h1>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, fontWeight: 300 }}>
            {MODULES.length} modules · Prototype platform
          </p>
        </div>

        {/* ── Modules ── */}
        <div style={{ padding: '48px 48px 96px' }}>

          {/* Featured */}
          {featured.map(mod => (
            <Link key={mod.href} href={mod.href} className="cc-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 40 }}
              onMouseEnter={() => setHovered(mod.href)}
              onMouseLeave={() => setHovered(null)}>
              <div style={{
                padding: '40px 44px',
                background: hovered === mod.href ? C.surface2 : C.surface,
                border: `1px solid ${hovered === mod.href ? 'rgba(45,114,210,0.3)' : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48,
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.accent,
                      background: C.accentDim, padding: '3px 8px', borderRadius: 2,
                    }}>{mod.tag}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
                      Primary module
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px, 2vw, 30px)', fontWeight: 400, letterSpacing: '-0.02em', color: C.text, marginBottom: 12 }}>
                    {mod.label}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.text2, fontWeight: 300, maxWidth: 520 }}>
                    {mod.description}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16, flexShrink: 0 }}>
                  <span className="cc-card-arrow" style={{ color: C.text3, fontSize: 20 }}>↗</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>{mod.meta}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Supporting label */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 1 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(16px, 1.5vw, 22px)', fontWeight: 300, letterSpacing: '-0.01em', color: C.text }}>
              Supporting modules
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text3 }}>
              {supporting.length} modules
            </span>
          </div>

          {/* Supporting grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: `1px solid ${C.border}` }}>
            {supporting.map((mod, i) => (
              <Link key={mod.href} href={mod.href} className="cc-card" style={{ textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={() => setHovered(mod.href)}
                onMouseLeave={() => setHovered(null)}>
                <div style={{
                  padding: '32px 28px',
                  background: hovered === mod.href ? C.surface2 : C.surface,
                  borderRight: (i % 3 !== 2) ? `1px solid ${C.border}` : 'none',
                  borderBottom: (i < 3) ? `1px solid ${C.border}` : 'none',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  transition: 'background 0.2s ease',
                  minHeight: 200,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.accent,
                      background: C.accentDim, padding: '3px 8px', borderRadius: 2,
                    }}>{mod.tag}</span>
                    <span className="cc-card-arrow" style={{ color: C.text3, fontSize: 15 }}>↗</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 8 }}>
                      {mod.label}
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.65, color: C.text2, fontWeight: 300 }}>
                      {mod.description}
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>{mod.meta}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{
          padding: '24px 48px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3 }}>
            Ambient Intelligence · Not for clinical use
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
            ambientprototype.vercel.app
          </span>
        </footer>

      </div>
    </>
  );
}
