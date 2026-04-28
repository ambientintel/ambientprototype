'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';

// ── Color schemes ─────────────────────────────────────────────────────────────

const SCHEMES: Record<string, Record<string, string>> = {
  Warm: {
    '--bg': '#F5F1EB', '--surface-1': '#FAF7F2', '--surface-2': '#EDE7DD', '--surface-3': '#E4DDD0',
    '--line': 'rgba(40,30,20,0.08)', '--line-strong': 'rgba(40,30,20,0.16)',
    '--text': '#1F1B16', '--text-2': 'rgba(31,27,22,0.68)', '--text-3': 'rgba(31,27,22,0.48)', '--text-4': 'rgba(31,27,22,0.30)',
    '--accent': '#D97757', '--accent-soft': 'rgba(217,119,87,0.14)', '--sage': 'oklch(0.55 0.07 150)',
  },
  Cool: {
    '--bg': '#EEF1F5', '--surface-1': '#F4F6FA', '--surface-2': '#DDE3ED', '--surface-3': '#D0D8E4',
    '--line': 'rgba(20,30,40,0.08)', '--line-strong': 'rgba(20,30,40,0.16)',
    '--text': '#161C22', '--text-2': 'rgba(22,28,34,0.68)', '--text-3': 'rgba(22,28,34,0.48)', '--text-4': 'rgba(22,28,34,0.30)',
    '--accent': '#4A7FC1', '--accent-soft': 'rgba(74,127,193,0.14)', '--sage': 'oklch(0.55 0.07 200)',
  },
  Dark: {
    '--bg': '#141414', '--surface-1': '#1C1C1C', '--surface-2': '#252525', '--surface-3': '#2E2E2E',
    '--line': 'rgba(255,255,255,0.07)', '--line-strong': 'rgba(255,255,255,0.14)',
    '--text': '#EDEDE9', '--text-2': 'rgba(237,237,233,0.68)', '--text-3': 'rgba(237,237,233,0.48)', '--text-4': 'rgba(237,237,233,0.30)',
    '--accent': '#D97757', '--accent-soft': 'rgba(217,119,87,0.18)', '--sage': 'oklch(0.65 0.07 150)',
  },
  Slate: {
    '--bg': '#F0F0EE', '--surface-1': '#F7F7F5', '--surface-2': '#E4E4E0', '--surface-3': '#D8D8D3',
    '--line': 'rgba(30,30,28,0.08)', '--line-strong': 'rgba(30,30,28,0.16)',
    '--text': '#1A1A18', '--text-2': 'rgba(26,26,24,0.68)', '--text-3': 'rgba(26,26,24,0.48)', '--text-4': 'rgba(26,26,24,0.30)',
    '--accent': '#7C6EAD', '--accent-soft': 'rgba(124,110,173,0.14)', '--sage': 'oklch(0.55 0.07 155)',
  },
  Blueprint: {
    '--bg': '#1C2127', '--surface-1': '#252A31', '--surface-2': '#2F343C', '--surface-3': '#383E47',
    '--line': 'rgba(255,255,255,0.07)', '--line-strong': 'rgba(255,255,255,0.14)',
    '--text': '#F6F7F8', '--text-2': 'rgba(246,247,248,0.65)', '--text-3': 'rgba(246,247,248,0.42)', '--text-4': 'rgba(246,247,248,0.26)',
    '--accent': '#2D72D2', '--accent-soft': 'rgba(45,114,210,0.18)', '--sage': '#3DCC91',
  },
  Palantir: {
    '--bg': '#0A0A0A', '--surface-1': '#111111', '--surface-2': '#1A1A1A', '--surface-3': '#222222',
    '--line': 'rgba(255,255,255,0.06)', '--line-strong': 'rgba(255,255,255,0.12)',
    '--text': '#F0F0EE', '--text-2': 'rgba(240,240,238,0.65)', '--text-3': 'rgba(240,240,238,0.42)', '--text-4': 'rgba(240,240,238,0.26)',
    '--accent': '#00C27A', '--accent-soft': 'rgba(0,194,122,0.14)', '--sage': 'oklch(0.65 0.12 155)',
  },
  Apple: {
    '--bg': '#FFFFFF', '--surface-1': '#F5F5F7', '--surface-2': '#FFFFFF', '--surface-3': '#E8E8ED',
    '--line': 'rgba(0,0,0,0.06)', '--line-strong': 'rgba(0,0,0,0.12)',
    '--text': '#1D1D1F', '--text-2': 'rgba(29,29,31,0.65)', '--text-3': 'rgba(29,29,31,0.44)', '--text-4': 'rgba(29,29,31,0.28)',
    '--accent': '#0071E3', '--accent-soft': 'rgba(0,113,227,0.10)', '--sage': 'oklch(0.55 0.07 240)',
  },
  Mayo: {
    '--bg': '#FFFFFF', '--surface-1': '#F4F7FB', '--surface-2': '#EAF0F8', '--surface-3': '#D6E4F0',
    '--line': 'rgba(0,70,140,0.08)', '--line-strong': 'rgba(0,70,140,0.16)',
    '--text': '#0D1F2D', '--text-2': 'rgba(13,31,45,0.68)', '--text-3': 'rgba(13,31,45,0.46)', '--text-4': 'rgba(13,31,45,0.28)',
    '--accent': '#005EB8', '--accent-soft': 'rgba(0,94,184,0.10)', '--sage': 'oklch(0.50 0.09 200)',
  },
  OpenAI: {
    '--bg': '#0D0D0D', '--surface-1': '#161616', '--surface-2': '#1E1E1E', '--surface-3': '#272727',
    '--line': 'rgba(255,255,255,0.07)', '--line-strong': 'rgba(255,255,255,0.13)',
    '--text': '#ECECEC', '--text-2': 'rgba(236,236,236,0.65)', '--text-3': 'rgba(236,236,236,0.42)', '--text-4': 'rgba(236,236,236,0.26)',
    '--accent': '#10A37F', '--accent-soft': 'rgba(16,163,127,0.15)', '--sage': 'oklch(0.62 0.10 160)',
  },
  Nike: {
    '--bg': '#111111', '--surface-1': '#181818', '--surface-2': '#212121', '--surface-3': '#2C2C2C',
    '--line': 'rgba(255,255,255,0.07)', '--line-strong': 'rgba(255,255,255,0.14)',
    '--text': '#FFFFFF', '--text-2': 'rgba(255,255,255,0.65)', '--text-3': 'rgba(255,255,255,0.42)', '--text-4': 'rgba(255,255,255,0.26)',
    '--accent': '#FA5400', '--accent-soft': 'rgba(250,84,0,0.15)', '--sage': 'oklch(0.65 0.14 35)',
  },
  Arcteryx: {
    '--bg': '#F8F8F6', '--surface-1': '#FFFFFF', '--surface-2': '#EFEFED', '--surface-3': '#E4E4E1',
    '--line': 'rgba(0,0,0,0.07)', '--line-strong': 'rgba(0,0,0,0.13)',
    '--text': '#111111', '--text-2': 'rgba(17,17,17,0.65)', '--text-3': 'rgba(17,17,17,0.44)', '--text-4': 'rgba(17,17,17,0.28)',
    '--accent': '#C43B00', '--accent-soft': 'rgba(196,59,0,0.10)', '--sage': 'oklch(0.55 0.07 42)',
  },
  'Stone Island': {
    '--bg': '#F2F0EB', '--surface-1': '#FAFAF8', '--surface-2': '#E8E5DE', '--surface-3': '#DDD9CF',
    '--line': 'rgba(40,35,25,0.08)', '--line-strong': 'rgba(40,35,25,0.15)',
    '--text': '#1C1A15', '--text-2': 'rgba(28,26,21,0.68)', '--text-3': 'rgba(28,26,21,0.46)', '--text-4': 'rgba(28,26,21,0.28)',
    '--accent': '#CF4520', '--accent-soft': 'rgba(207,69,32,0.12)', '--sage': 'oklch(0.55 0.07 38)',
  },
  Porsche: {
    '--bg': '#FFFFFF', '--surface-1': '#F8F8F8', '--surface-2': '#F0F0F0', '--surface-3': '#E4E4E4',
    '--line': 'rgba(0,0,0,0.07)', '--line-strong': 'rgba(0,0,0,0.13)',
    '--text': '#000000', '--text-2': 'rgba(0,0,0,0.62)', '--text-3': 'rgba(0,0,0,0.42)', '--text-4': 'rgba(0,0,0,0.26)',
    '--accent': '#D5001C', '--accent-soft': 'rgba(213,0,28,0.09)', '--sage': 'oklch(0.50 0.10 20)',
  },
  Patek: {
    '--bg': '#FAF8F3', '--surface-1': '#FFFDF8', '--surface-2': '#F0EDE4', '--surface-3': '#E5E1D7',
    '--line': 'rgba(50,40,20,0.08)', '--line-strong': 'rgba(50,40,20,0.15)',
    '--text': '#1A1510', '--text-2': 'rgba(26,21,16,0.68)', '--text-3': 'rgba(26,21,16,0.46)', '--text-4': 'rgba(26,21,16,0.28)',
    '--accent': '#8B6914', '--accent-soft': 'rgba(139,105,20,0.12)', '--sage': 'oklch(0.55 0.08 85)',
  },
};

const GROUPS = [
  { label: 'Original', names: ['Warm', 'Cool', 'Dark', 'Slate', 'Blueprint'] },
  { label: 'Brand-inspired', names: ['Palantir', 'Apple', 'Mayo', 'OpenAI', 'Nike', 'Arcteryx', 'Stone Island', 'Porsche', 'Patek'] },
];

const TOKENS = [
  '--bg', '--surface-1', '--surface-2', '--surface-3',
  '--line', '--line-strong',
  '--text', '--text-2', '--text-3', '--text-4',
  '--accent', '--accent-soft', '--sage',
];

// ── Swatch (click-to-copy) ────────────────────────────────────────────────────

function Swatch({ hex, token, label }: { hex: string; token: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [hex]);

  return (
    <button
      onClick={copy}
      title={`Click to copy: ${hex}`}
      style={{
        all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column',
        borderRadius: 10, overflow: 'hidden',
        border: '1px solid rgba(128,128,128,0.18)',
        flex: '1 1 0', minWidth: 0,
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ background: hex, height: 60, display: 'flex', alignItems: 'flex-end', padding: '6px 8px' }}>
        {copied && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(128,128,128,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.25)', padding: '2px 5px', borderRadius: 3 }}>Copied</span>}
      </div>
      <div style={{ background: 'var(--surface-2)', padding: '7px 8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{token}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </button>
  );
}

const SWATCH_PALETTE = [
  { group: 'Surfaces', tokens: [
    { token: '--bg', label: 'App bg' }, { token: '--surface-1', label: 'Card' },
    { token: '--surface-2', label: 'Header' }, { token: '--surface-3', label: 'Hover' },
  ]},
  { group: 'Accent', tokens: [
    { token: '--accent', label: 'Primary' }, { token: '--accent-soft', label: 'Soft wash' }, { token: '--sage', label: 'Sage' },
  ]},
  { group: 'Text', tokens: [
    { token: '--text', label: 'Primary' }, { token: '--text-2', label: 'Secondary' },
    { token: '--text-3', label: 'Tertiary' }, { token: '--text-4', label: 'Disabled' },
  ]},
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BrandPage() {
  const [active, setActive] = useState('Blueprint');
  const vars = SCHEMES[active];

  const cssVars = Object.fromEntries(Object.entries(vars)) as React.CSSProperties;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', padding: '40px 48px 80px', maxWidth: 980, margin: '0 auto' }}>

      {/* Back */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', textDecoration: 'none', marginBottom: 40 }}>
        ← Home
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-4)', margin: '0 0 8px' }}>
          Design System · Brand
        </p>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
          Color <em style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>& Identity</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Select a theme to preview. Click any swatch to copy its value.
        </p>
      </div>

      {/* Theme switcher */}
      <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {GROUPS.map(({ label, names }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 8 }}>{label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {names.map(name => (
                <button
                  key={name}
                  onClick={() => setActive(name)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, border: '1px solid',
                    borderColor: active === name ? 'var(--accent)' : 'var(--line-strong)',
                    background: active === name ? 'var(--accent-soft)' : 'var(--surface-1)',
                    color: active === name ? 'var(--accent)' : 'var(--text-2)',
                    fontFamily: 'var(--sans)', fontSize: 12.5, cursor: 'pointer',
                    fontWeight: active === name ? 500 : 400, transition: 'all 0.12s',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Theme preview + tokens — scoped to selected scheme */}
      <div style={{ ...cssVars, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 48 }}>

        {/* Token list */}
        <section>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 12, fontWeight: 500 }}>Tokens — {active}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {TOKENS.map(token => (
              <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 18, borderRadius: 4, background: `var(${token})`, border: '1px solid var(--line-strong)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{token}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginLeft: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{vars[token]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Live UI preview */}
        <section>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 12, fontWeight: 500 }}>Preview</div>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Card */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 14, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Patient · Room 214</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, marginBottom: 2, letterSpacing: '-0.01em' }}>Eleanor Voss</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>Last event: 2 min ago</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 500, fontFamily: 'var(--mono)' }}>Alert</span>
                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: 'var(--surface-3)', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>Stable</span>
              </div>
            </div>

            {/* Text scale */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 4 }}>Heading text</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 3 }}>Body text at default size</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 3 }}>Secondary / caption</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Meta · Mono label</div>
            </div>

            {/* Buttons */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={{ padding: '7px 16px', borderRadius: 6, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Primary</button>
              <button style={{ padding: '7px 16px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--line-strong)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Secondary</button>
              <button style={{ padding: '7px 16px', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--line)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Ghost</button>
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <input placeholder="Search patients…" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--line-strong)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            {/* Accent bar */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Accent</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>{vars['--accent']}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)' }}>
                <div style={{ width: '62%', height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--line)', marginBottom: 40 }} />

      {/* Swatch palette for active scheme */}
      {SWATCH_PALETTE.map(group => (
        <div key={group.group} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10, fontWeight: 500 }}>{group.group}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {group.tokens.map(t => (
              <Swatch key={t.token} hex={vars[t.token]} token={t.token} label={t.label} />
            ))}
          </div>
        </div>
      ))}

      {/* Type scale */}
      <div style={{ marginTop: 12, marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10, fontWeight: 500 }}>Type scale</div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface-1)' }}>
          {[
            { label: 'Display', size: 40, weight: 300, font: 'var(--serif)', sample: 'Ambient Intelligence' },
            { label: 'H1',      size: 26, weight: 300, font: 'var(--serif)', sample: 'Parts Library' },
            { label: 'Body',    size: 14, weight: 400, font: 'var(--sans)',  sample: 'Contactless fall detection with 76–81 GHz mmWave radar.' },
            { label: 'Small',   size: 13, weight: 400, font: 'var(--sans)',  sample: 'Active · EVT-0.1 · DigiKey' },
            { label: 'Mono',    size: 12, weight: 400, font: 'var(--mono)', sample: 'AMB-IC-001 · IWR6843ARQGALP · $39.730' },
            { label: 'Label',   size: 10.5, weight: 500, font: 'var(--mono)', sample: 'TOTAL UNIT COST · LIFECYCLE · PLM' },
          ].map((t, i, arr) => (
            <div key={t.label} style={{
              display: 'grid', gridTemplateColumns: '68px 68px 1fr',
              gap: '0 16px', alignItems: 'baseline',
              padding: '13px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{t.size}px · {t.weight}</span>
              <span style={{ fontFamily: t.font, fontSize: Math.min(t.size, 26), fontWeight: t.weight, letterSpacing: t.size > 18 ? '-0.02em' : undefined, lineHeight: 1.2, color: 'var(--text)' }}>{t.sample}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginTop: 32 }}>
        ambientintel · design tokens · not for clinical use
      </p>
    </div>
  );
}
