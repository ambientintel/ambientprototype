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
    index: 0,
  },
  {
    href: '/bom',
    tag: 'Engineering',
    label: 'Bill of Materials',
    description: 'Full parts library, assembly BOMs, and build orders for EVT-0.1 hardware. 57 components priced from DigiKey and Mouser.',
    meta: 'EVT-0.1 · 57 parts',
    index: 1,
  },
  {
    href: '/gapanalysis',
    tag: 'Compliance',
    label: '21 CFR 820 Gap Analysis',
    description: 'Interactive tracker for all 15 subparts of 21 CFR Part 820. Mark evidence, add notes, auto-persisted.',
    meta: 'FDA QSR · 15 subparts',
    index: 2,
  },
  {
    href: '/samd',
    tag: 'Regulatory',
    label: 'SaMD Dashboard',
    description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking per IEC 62304 and ISO 14971.',
    meta: 'IEC 62304 / ISO 14971',
    index: 3,
  },
  {
    href: '/colors',
    tag: 'Design',
    label: 'Color & Typography',
    description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and full type scale.',
    meta: 'globals.css · tokens',
    index: 4,
  },
  {
    href: '/brand',
    tag: 'Design',
    label: 'Brand & Color Picker',
    description: 'Interactive color palette with copyable hex values. Brand mark at scale, badge states, and type scale reference.',
    meta: 'ambientdesign · interactive',
    index: 5,
  },
];

const STATS = [
  { value: '57', label: 'Hardware components' },
  { value: '15', label: 'CFR Part 820 subparts' },
  { value: '6', label: 'Active modules' },
  { value: '142', label: 'Rooms monitored' },
];

const C = {
  bg:        '#0C0D0F',
  surface:   '#13151A',
  surface2:  '#1C1F26',
  border:    'rgba(255,255,255,0.07)',
  borderHov: 'rgba(166,242,204,0.25)',
  accent:    '#A6F2CC',
  accentDim: 'rgba(166,242,204,0.10)',
  text:      '#EDEEF0',
  text2:     '#9A9B9D',
  text3:     '#5C5E62',
  grid:      'rgba(255,255,255,0.025)',
};

export default function Landing1() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .l1-fadeup { animation: fadeUp 0.55s ease both; }
        .l1-card-arrow { transition: transform 0.2s ease; }
        .l1-card:hover .l1-card-arrow { transform: translate(3px,-3px); }
        .l1-nav-link { transition: color 0.2s ease; }
        .l1-nav-link:hover { color: #EDEEF0 !important; }
        .l1-stat-val { font-variant-numeric: tabular-nums; }
        .l1-cta-primary {
          background: #A6F2CC; color: #0C0D0F;
          border: none; border-radius: 2px;
          padding: 13px 28px; font-size: 13px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; transition: opacity 0.2s ease;
          font-family: inherit;
        }
        .l1-cta-primary:hover { opacity: 0.88; }
        .l1-cta-ghost {
          background: transparent; color: #EDEEF0;
          border: 1px solid rgba(255,255,255,0.18); border-radius: 2px;
          padding: 13px 28px; font-size: 13px; font-weight: 500;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; transition: border-color 0.2s, color 0.2s;
          font-family: inherit;
        }
        .l1-cta-ghost:hover { border-color: #A6F2CC; color: #A6F2CC; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(12,13,15,0.88)',
          backdropFilter: 'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: C.text }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[['Nurse Dashboard','/dashboard'],['BOM','/bom'],['Compliance','/gapanalysis'],['SaMD','/samd']].map(([label, href]) => (
              <Link key={href} href={href} className="l1-nav-link" style={{ textDecoration: 'none', color: C.text2, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '5px 12px', borderRadius: 2 }}>
              Control Center
            </span>
          </Link>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 48px',
          position: 'relative', overflow: 'hidden',
          backgroundImage: `
            linear-gradient(${C.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 400, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(166,242,204,0.06) 0%, transparent 70%)',
          }} />

          <div style={{ maxWidth: 900, position: 'relative' }}>
            <div className="l1-fadeup" style={{ animationDelay: '0.05s', marginBottom: 24 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: C.accent,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
                Ambient Intelligence · Prototype Platform
              </span>
            </div>

            <h1 className="l1-fadeup" style={{
              animationDelay: '0.15s',
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.05,
              letterSpacing: '-0.03em', margin: '0 0 28px',
              color: C.text,
            }}>
              Intelligence at the<br />
              <em style={{ color: C.accent, fontStyle: 'italic' }}>point of care.</em>
            </h1>

            <p className="l1-fadeup" style={{
              animationDelay: '0.25s',
              fontSize: 18, lineHeight: 1.6, color: C.text2,
              maxWidth: 540, margin: '0 0 44px', fontWeight: 300,
            }}>
              Turning operational sensor data into clinical action — hardware, compliance, and AI in a single platform.
            </p>

            <div className="l1-fadeup" style={{ animationDelay: '0.35s', display: 'flex', gap: 12 }}>
              <Link href="/dashboard/overview" style={{ textDecoration: 'none' }}>
                <button className="l1-cta-primary">Nurse Dashboard</button>
              </Link>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <button className="l1-cta-ghost">View all modules</button>
              </Link>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{
            position: 'absolute', bottom: 40, left: 48,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.text3,
          }}>
            Scroll to explore ↓
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '36px 48px',
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
            }}>
              <div className="l1-stat-val" style={{
                fontFamily: 'var(--mono)', fontSize: 40, fontWeight: 500,
                color: C.text, letterSpacing: '-0.02em', lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.text3, marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* ── Modules ── */}
        <section style={{ padding: '96px 48px' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
              Platform modules
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em', margin: 0, color: C.text }}>
              Every tool your team needs.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: `1px solid ${C.border}` }}>
            {MODULES.map((mod, i) => (
              <Link key={mod.href} href={mod.href} className="l1-card" style={{ textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}>
                <div style={{
                  padding: '36px 32px',
                  background: hovered === i ? C.surface2 : C.surface,
                  borderRight: (i % 3 !== 2) ? `1px solid ${C.border}` : 'none',
                  borderBottom: (i < 3) ? `1px solid ${C.border}` : 'none',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  transition: 'background 0.2s ease',
                  minHeight: 220,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.accent,
                      background: C.accentDim, padding: '3px 8px', borderRadius: 2,
                    }}>{mod.tag}</span>
                    <span className="l1-card-arrow" style={{ color: C.text3, fontSize: 16 }}>↗</span>
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 10 }}>
                      {mod.label}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: C.text2, fontWeight: 300 }}>
                      {mod.description}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
                      {mod.meta}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          padding: '80px 48px', borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.surface,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
              Ready to begin
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(24px, 2.5vw, 36px)', letterSpacing: '-0.02em', margin: 0, color: C.text }}>
              Access the control center.
            </h3>
          </div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="l1-cta-primary">Go to Control Center</button>
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          padding: '28px 48px',
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
