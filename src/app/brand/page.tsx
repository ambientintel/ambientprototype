'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';

// ── Palette data ──────────────────────────────────────────────────────────────

const PALETTE = [
  {
    group: 'Surfaces',
    cols: 4,
    tokens: [
      { token: '--bg',        hex: '#1C2127', label: 'App background' },
      { token: '--surface-1', hex: '#252A31', label: 'Card / panel' },
      { token: '--surface-2', hex: '#2F343C', label: 'Table header' },
      { token: '--surface-3', hex: '#383E47', label: 'Hover / active' },
    ],
  },
  {
    group: 'Accent',
    cols: 3,
    tokens: [
      { token: '--accent',       hex: '#2D72D2', label: 'Primary CTA · links' },
      { token: '--accent-soft',  hex: 'rgba(45,114,210,0.18)', label: 'Soft wash' },
      { token: '--accent-hover', hex: '#215DB0', label: 'Pressed' },
    ],
  },
  {
    group: 'Status',
    cols: 5,
    tokens: [
      { token: 'success',     hex: '#3DCC91', label: 'Active · Released' },
      { token: 'warning',     hex: '#FFC940', label: 'NRND · Review' },
      { token: 'danger',      hex: '#FF7373', label: 'EOL · Error' },
      { token: 'neutral',     hex: '#8F99A8', label: 'Draft · Disabled' },
      { token: 'in-progress', hex: '#669EFF', label: 'In Progress' },
    ],
  },
  {
    group: 'Status backgrounds',
    cols: 5,
    tokens: [
      { token: 'success-bg',     hex: 'rgba(35,133,81,0.22)',  label: 'Active badge fill' },
      { token: 'warning-bg',     hex: 'rgba(200,150,25,0.22)', label: 'NRND badge fill' },
      { token: 'danger-bg',      hex: 'rgba(205,66,70,0.22)',  label: 'EOL badge fill' },
      { token: 'neutral-bg',     hex: 'rgba(95,107,124,0.22)', label: 'Obsolete badge fill' },
      { token: 'in-progress-bg', hex: 'rgba(45,114,210,0.22)', label: 'In Progress fill' },
    ],
  },
  {
    group: 'Text',
    cols: 4,
    tokens: [
      { token: '--text',   hex: '#F6F7F8',                label: 'Primary' },
      { token: '--text-2', hex: 'rgba(246,247,248,0.65)', label: 'Secondary' },
      { token: '--text-3', hex: 'rgba(246,247,248,0.42)', label: 'Tertiary' },
      { token: '--text-4', hex: 'rgba(246,247,248,0.26)', label: 'Disabled / meta' },
    ],
  },
  {
    group: 'Borders',
    cols: 2,
    tokens: [
      { token: '--line',        hex: 'rgba(255,255,255,0.07)', label: 'Default divider' },
      { token: '--line-strong', hex: 'rgba(255,255,255,0.14)', label: 'Emphasis border' },
    ],
  },
];

const BADGES = [
  { label: 'Active',      bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
  { label: 'NRND',        bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
  { label: 'EOL',         bg: 'rgba(205,66,70,0.22)',  color: '#FF7373' },
  { label: 'Obsolete',    bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },
  { label: 'Released',    bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
  { label: 'In Progress', bg: 'rgba(45,114,210,0.22)', color: '#669EFF' },
  { label: 'Draft',       bg: 'rgba(95,107,124,0.20)', color: '#8F99A8' },
  { label: 'Approved',    bg: 'rgba(45,114,210,0.20)', color: '#669EFF' },
  { label: 'Verified',    bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
  { label: 'Shortage',    bg: 'rgba(205,66,70,0.22)',  color: '#FF7373' },
  { label: 'OK',          bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },
  { label: 'TBD',         bg: 'rgba(95,107,124,0.20)', color: '#8F99A8' },
];

const TYPE_SCALE = [
  { label: 'Display',  size: 44, weight: 300, font: 'var(--serif)', sample: 'Ambient Intelligence' },
  { label: 'H1',       size: 28, weight: 300, font: 'var(--serif)', sample: 'Parts Library' },
  { label: 'H2',       size: 22, weight: 300, font: 'var(--serif)', sample: 'Assembly & BOMs' },
  { label: 'Body',     size: 14, weight: 400, font: 'var(--sans)',  sample: 'Contactless fall detection with 76–81 GHz mmWave radar.' },
  { label: 'Small',    size: 13, weight: 400, font: 'var(--sans)',  sample: 'Active · EVT-0.1 · DigiKey' },
  { label: 'Mono',     size: 12, weight: 400, font: 'var(--mono)', sample: 'AMB-IC-001 · IWR6843ARQGALP · $39.730' },
  { label: 'Label',    size: 10.5, weight: 500, font: 'var(--mono)', sample: 'TOTAL UNIT COST · PLM · PARTS · LIFECYCLE' },
];

// ── Swatch component ──────────────────────────────────────────────────────────

function Swatch({ hex, token, label }: { hex: string; token: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [hex]);

  const isLight = hex.startsWith('rgba(246') || hex === '#F6F7F8';
  const textColor = isLight ? '#1C2127' : '#F6F7F8';

  return (
    <button
      onClick={copy}
      title={`Click to copy: ${hex}`}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.10)',
        flex: '1 1 0',
        minWidth: 0,
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {/* Color block */}
      <div style={{
        background: hex,
        height: 72,
        display: 'flex',
        alignItems: 'flex-end',
        padding: '8px 10px',
      }}>
        {copied && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: textColor, opacity: 0.85, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Copied
          </span>
        )}
      </div>
      {/* Info block */}
      <div style={{
        background: 'var(--surface-2)',
        padding: '8px 10px 9px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--accent)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {token}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hex}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </div>
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase',
      letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 12px', fontWeight: 500,
    }}>{children}</h2>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 48px 80px', maxWidth: 960, margin: '0 auto' }}>

      {/* Back */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', textDecoration: 'none', marginBottom: 40 }}>
        ← Home
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 8px' }}>
          Design System · Brand
        </p>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          Color <em style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>& Identity</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, maxWidth: 480 }}>
          Palantir Blueprint dark theme. Click any swatch to copy its value.
          Tokens defined in <code style={{ fontFamily: 'var(--mono)', fontSize: 11.5, background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>globals.css</code>.
        </p>
      </div>

      {/* Brand mark */}
      <div style={{ marginBottom: 48 }}>
        <SectionHead>Brand mark</SectionHead>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '24px 28px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 12 }}>
          {[22, 32, 44, 60].map(size => (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: size, height: size, borderRadius: size * 0.32,
                background: 'radial-gradient(circle at 32% 32%, #5C93E5 0%, transparent 55%), radial-gradient(circle at 70% 70%, #1A4A8A 0%, transparent 65%), #2D72D2',
                border: '1px solid rgba(45,114,210,0.35)',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{size}px</span>
            </div>
          ))}
          <div style={{ marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'radial-gradient(circle at 32% 32%, #5C93E5 0%, transparent 55%), radial-gradient(circle at 70% 70%, #1A4A8A 0%, transparent 65%), #2D72D2', border: '1px solid rgba(45,114,210,0.35)' }} />
              <span style={{ fontFamily: 'var(--serif)', fontSize: 20, letterSpacing: '-0.01em' }}>Ambient <em>Intelligence</em></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'radial-gradient(circle at 32% 32%, #5C93E5 0%, transparent 55%), radial-gradient(circle at 70% 70%, #1A4A8A 0%, transparent 65%), #2D72D2', border: '1px solid rgba(45,114,210,0.35)' }} />
              <span style={{ fontFamily: 'var(--serif)', fontSize: 16, letterSpacing: '-0.01em', color: 'var(--text-2)' }}>Ambient <em>Demo</em></span>
            </div>
          </div>
        </div>
      </div>

      {/* Color palette */}
      {PALETTE.map(group => (
        <div key={group.group} style={{ marginBottom: 36 }}>
          <SectionHead>{group.group}</SectionHead>
          <div style={{ display: 'flex', gap: 10 }}>
            {group.tokens.map(t => (
              <Swatch key={t.token} hex={t.hex} token={t.token} label={t.label} />
            ))}
          </div>
        </div>
      ))}

      {/* Badge preview */}
      <div style={{ marginBottom: 40 }}>
        <SectionHead>Badge states</SectionHead>
        <div style={{ padding: '20px 22px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {BADGES.map(b => (
            <span key={b.label} style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
              borderRadius: 99, fontSize: 11.5, fontWeight: 500,
              background: b.bg, color: b.color,
              fontFamily: 'var(--mono)', letterSpacing: '0.03em',
            }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Type families */}
      <div style={{ marginBottom: 36 }}>
        <SectionHead>Type families</SectionHead>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-1)' }}>
          {[
            { token: '--serif', stack: 'Newsreader, Iowan Old Style, Georgia, serif',        role: 'Display · headlines · narratives' },
            { token: '--sans',  stack: 'Inter Tight, -apple-system, Helvetica Neue, sans',   role: 'Body · UI labels · descriptions' },
            { token: '--mono',  stack: 'JetBrains Mono, ui-monospace, SFMono, Menlo',         role: 'Part numbers · data · badges · meta' },
          ].map((t, i, arr) => (
            <div key={t.token} style={{
              display: 'grid', gridTemplateColumns: '130px 1fr',
              gap: '0 20px', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{t.token}</code>
              <div>
                <div style={{ fontSize: 13 }}>{t.stack}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type scale */}
      <div style={{ marginBottom: 40 }}>
        <SectionHead>Type scale</SectionHead>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '76px 72px 1fr', gap: '0 16px', padding: '8px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            {['Role', 'Size / Wt', 'Sample'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>{h}</span>
            ))}
          </div>
          {TYPE_SCALE.map((t, i) => (
            <div key={t.label} style={{
              display: 'grid', gridTemplateColumns: '76px 72px 1fr',
              gap: '0 16px', alignItems: 'baseline',
              padding: '13px 16px',
              borderBottom: i < TYPE_SCALE.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)' }}>{t.size}px · {t.weight}</span>
              <span style={{
                fontFamily: t.font,
                fontSize: Math.min(t.size, 28),
                fontWeight: t.weight,
                letterSpacing: t.size > 20 ? '-0.02em' : undefined,
                lineHeight: 1.2,
              }}>{t.sample}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginTop: 40 }}>
        ambientintel · design tokens · not for clinical use
      </p>
    </div>
  );
}
