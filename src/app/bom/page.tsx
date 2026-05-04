'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const FEATURES = [
  {
    num: '01',
    label: 'Parts Library',
    color: '#2D72D2',
    desc: 'Centralized component database with lifecycle status tracking (Active, NRND, EOL, Obsolete), supplier info, and full part metadata.',
    bullets: ['Lifecycle Status', 'Supplier & MPN', 'Unit Cost Tracking', 'Category Filtering'],
  },
  {
    num: '02',
    label: 'BOM Tree View',
    color: '#3DCC91',
    desc: 'Visualize nested assembly structures with expandable BOM trees, quantities, reference designators, and real-time lifecycle alerts.',
    bullets: ['Nested Assemblies', 'Ref Designators', 'Expandable Tree', 'EOL Alerts'],
  },
  {
    num: '03',
    label: 'Build Orders',
    color: '#9B59B6',
    desc: 'Track production runs from Draft through Complete with date management and assembly-level status visibility.',
    bullets: ['Draft → Complete', 'Target Dates', 'Shortage Flags', 'Assembly Status'],
  },
] as const;

const STATS = [
  { value: '47', label: 'Parts', sub: 'catalog' },
  { value: '3', label: 'Assemblies', sub: 'managed' },
  { value: '4', label: 'Builds', sub: 'tracked' },
];

export default function BomLanding() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveFeature(f => (f + 1) % 3);
      setTick(t => t + 1);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const feature = FEATURES[activeFeature];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>

      <style>{`
        @keyframes bom-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes bom-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px currentColor; }
          50%       { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
        @keyframes bom-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bom-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .bom-feature-card:hover {
          background: rgba(45,114,210,0.06) !important;
          border-color: rgba(45,114,210,0.25) !important;
        }
        .bom-cta-btn:hover {
          box-shadow: 0 0 56px rgba(45,114,210,0.6) !important;
          transform: translateY(-1px);
        }
        .bom-cta-btn { transition: all 0.2s; }
        .bom-cap-card:hover .bom-cap-num { color: var(--accent) !important; }
        .bom-cap-card:hover { background: var(--surface-2) !important; }
        .bom-cap-card { transition: background 0.2s; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        background: 'rgba(6,8,12,0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-name">Ambient <em>Intelligence</em></span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
            Bill of Materials
          </span>
          <Link href="/bom/app" className="bom-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 20px',
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 24px rgba(45,114,210,0.3)',
          }}>Launch →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 180px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Dot grid background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(45,114,210,0.11) 0%, rgba(45,114,210,0.04) 40%, transparent 70%)',
        }} />

        {/* Scanning line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1, zIndex: 1,
          background: 'linear-gradient(90deg, transparent, rgba(45,114,210,0.5), rgba(45,114,210,0.8), rgba(45,114,210,0.5), transparent)',
          animation: 'bom-scan 8s linear infinite',
          top: 0,
        }} />

        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 72, left: 40, width: 72, height: 72, borderTop: '1px solid rgba(45,114,210,0.22)', borderLeft: '1px solid rgba(45,114,210,0.22)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 72, right: 40, width: 72, height: 72, borderTop: '1px solid rgba(45,114,210,0.22)', borderRight: '1px solid rgba(45,114,210,0.22)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 180, left: 40, width: 72, height: 72, borderBottom: '1px solid rgba(45,114,210,0.22)', borderLeft: '1px solid rgba(45,114,210,0.22)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 180, right: 40, width: 72, height: 72, borderBottom: '1px solid rgba(45,114,210,0.22)', borderRight: '1px solid rgba(45,114,210,0.22)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 840 }}>

          {/* Status badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '7px 18px',
            border: '1px solid rgba(45,114,210,0.28)',
            borderRadius: 2,
            background: 'rgba(45,114,210,0.07)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#2D72D2', display: 'inline-block',
              boxShadow: '0 0 10px #2D72D2',
              animation: 'bom-pulse 2.4s ease-in-out infinite',
              color: '#2D72D2',
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Hardware PLM · Bill of Materials
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            margin: '0 0 28px',
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            fontFamily: 'var(--sans)',
          }}>
            <span style={{
              fontSize: 'clamp(40px, 6vw, 74px)', fontWeight: 800, display: 'block',
              background: 'linear-gradient(135deg, #CAD2DB 0%, #ffffff 50%, #CAD2DB 100%)',
              backgroundSize: '400px 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'bom-shimmer 4s linear infinite',
            }}>
              Track Every Component.
            </span>
            <span style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', fontWeight: 700, color: 'var(--text-2)', display: 'block' }}>
              Build with Confidence.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            margin: '0 0 56px',
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-3)',
            lineHeight: 1.8,
            maxWidth: 580,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            A structured Bill of Materials platform for hardware teams — manage your parts library,
            visualize assembly trees, and track build orders from prototype to production.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/bom/app" className="bom-cta-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '15px 44px',
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              textDecoration: 'none', borderRadius: 2,
              boxShadow: '0 0 40px rgba(45,114,210,0.4)',
            }}>
              Launch BOM Tool →
            </Link>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Parts Library', 'BOM Tree', 'Build Orders'].map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#2D72D2', fontSize: 11 }}>◆</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Feature selector tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 16px', borderRadius: 2, cursor: 'pointer',
                background: activeFeature === i ? `${f.color}12` : 'transparent',
                border: `1px solid ${activeFeature === i ? f.color + '44' : 'var(--line)'}`,
                transition: 'all 0.25s',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 2, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                  background: activeFeature === i ? f.color : 'var(--surface-2)',
                  color: activeFeature === i ? '#000' : 'var(--text-4)',
                  boxShadow: activeFeature === i ? `0 0 10px ${f.color}88` : 'none',
                  transition: 'all 0.25s',
                }}>{f.num}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activeFeature === i ? f.color : 'var(--text-4)',
                  transition: 'color 0.25s',
                }}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          borderTop: '1px solid var(--line)',
          background: 'rgba(6,8,12,0.72)',
          backdropFilter: 'blur(12px)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '18px 0', flex: 1, maxWidth: 180,
              borderRight: i < STATS.length - 1 ? '1px solid var(--line)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 5 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        padding: '120px 40px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>
              Core Modules
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <h2 style={{
                margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 480,
              }}>
                Three Modules.<br />One Unified Workflow.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.75 }}>
                From raw component catalog through structured assemblies to production build orders — everything hardware teams need in one place.
              </p>
            </div>
          </div>

          {/* Feature cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
            {FEATURES.map((feat, i) => {
              const isActive = activeFeature === i;
              return (
                <div
                  key={i}
                  className="bom-feature-card"
                  onClick={() => setActiveFeature(i)}
                  style={{
                    padding: '36px 28px 32px',
                    background: isActive ? `${feat.color}0a` : 'var(--surface-1)',
                    borderRight: i < 2 ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background 0.3s',
                  }}
                >
                  {/* Active top bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: isActive
                      ? `linear-gradient(90deg, transparent, ${feat.color}, ${feat.color}88, transparent)`
                      : 'transparent',
                    transition: 'background 0.3s',
                  }} />

                  {/* Number badge */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 2, marginBottom: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800,
                    background: isActive ? feat.color : 'var(--surface-2)',
                    color: isActive ? '#000' : 'var(--text-4)',
                    boxShadow: isActive ? `0 0 24px ${feat.color}66` : 'none',
                    transition: 'all 0.3s',
                  }}>{feat.num}</div>

                  {/* Label */}
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: isActive ? feat.color : 'var(--text-3)',
                    marginBottom: 14,
                    transition: 'color 0.3s',
                  }}>{feat.label}</div>

                  {/* Description */}
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7 }}>{feat.desc}</p>

                  {/* Bullet points */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {feat.bullets.map((b, bi) => (
                      <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                          background: isActive ? feat.color : 'var(--text-4)',
                          boxShadow: isActive ? `0 0 6px ${feat.color}` : 'none',
                          transition: 'all 0.3s',
                        }} />
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 10,
                          color: isActive ? 'var(--text-2)' : 'var(--text-4)',
                          textTransform: 'uppercase', letterSpacing: '0.09em',
                          transition: 'color 0.3s',
                        }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Detail section — active feature callout ── */}
      <section style={{
        padding: '120px 40px',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 50% 60% at 50% 50%, ${feature.color}08 0%, transparent 70%)`,
          transition: 'background 0.5s',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>
            In Depth
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div style={{ animation: 'bom-fade-in 0.4s ease both' }} key={activeFeature}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32,
                padding: '6px 14px',
                border: `1px solid ${feature.color}33`,
                borderRadius: 2,
                background: `${feature.color}0a`,
              }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  color: feature.color, textTransform: 'uppercase', letterSpacing: '0.14em',
                }}>{feature.num} — {feature.label}</span>
              </div>
              <h2 style={{
                margin: '0 0 20px',
                fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.15,
              }}>{feature.label}</h2>
              <p style={{ margin: '0 0 36px', fontSize: 15, color: 'var(--text-3)', lineHeight: 1.8 }}>
                {feature.desc}
              </p>
              <Link href="/bom/app" className="bom-cta-btn" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '11px 28px',
                background: feature.color,
                color: feature.color === '#2D72D2' ? '#fff' : '#000',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                textDecoration: 'none', borderRadius: 2,
                boxShadow: `0 0 28px ${feature.color}44`,
                transition: 'all 0.2s',
              }}>
                Open {feature.label} →
              </Link>
            </div>

            {/* Feature detail card */}
            <div style={{
              border: `1px solid ${feature.color}22`,
              borderRadius: 4,
              background: 'var(--surface-1)',
              overflow: 'hidden',
              animation: 'bom-fade-in 0.4s ease both',
            }} key={`card-${activeFeature}`}>
              {/* Card header */}
              <div style={{
                padding: '12px 18px',
                borderBottom: `1px solid var(--line)`,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: feature.color,
                  boxShadow: `0 0 8px ${feature.color}`,
                }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  {feature.label} · Preview
                </span>
              </div>
              {/* Simulated data rows */}
              <div style={{ padding: '0' }}>
                {feature.bullets.map((bullet, bi) => (
                  <div key={bi} style={{
                    padding: '14px 18px',
                    borderBottom: bi < feature.bullets.length - 1 ? '1px solid var(--line)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 2, flexShrink: 0,
                      background: `${feature.color}18`,
                      border: `1px solid ${feature.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                      color: feature.color,
                    }}>
                      {String(bi + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                        {bullet}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>
                        {feature.label} · Module Feature
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px',
                        borderRadius: 99, fontSize: 10, fontWeight: 500,
                        background: `${feature.color}18`, color: feature.color,
                        fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                        border: `1px solid ${feature.color}22`,
                      }}>Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        padding: '120px 40px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>Workflow</div>
          <h2 style={{ margin: '0 0 72px', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            From Parts to Production.<br />No Setup Required.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
            {[
              {
                step: '01',
                title: 'Catalog your parts',
                body: 'Add components to the parts library with MPN, manufacturer, lifecycle status, and pricing. Filter by category or lifecycle to stay ahead of EOL risks.',
                color: '#2D72D2',
              },
              {
                step: '02',
                title: 'Build your assembly tree',
                body: 'Compose assemblies from your parts catalog, define quantities and reference designators, and nest sub-assemblies. Lifecycle risks surface automatically.',
                color: '#3DCC91',
              },
              {
                step: '03',
                title: 'Manage build orders',
                body: 'Create build orders against any assembly revision. Track status from Draft through In Progress to Complete. Flag shortages before they stall production.',
                color: '#9B59B6',
              },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '40px 36px',
                background: 'var(--surface-1)',
                borderRight: i < 2 ? '1px solid var(--line)' : 'none',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${item.color}, transparent)`,
                }} />
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800,
                  color: item.color, marginBottom: 24, lineHeight: 1,
                  opacity: 0.3,
                }}>{item.step}</div>
                <h3 style={{
                  margin: '0 0 14px', fontSize: 18, fontWeight: 700,
                  letterSpacing: '-0.01em', color: 'var(--text)',
                }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.75 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '140px 40px',
        borderTop: '1px solid var(--line)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,114,210,0.09) 0%, transparent 70%)',
        }} />
        {/* Concentric rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, border: '1px solid rgba(45,114,210,0.07)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, border: '1px solid rgba(45,114,210,0.10)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, border: '1px solid rgba(45,114,210,0.14)', borderRadius: '50%', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '6px 16px',
            border: '1px solid rgba(45,114,210,0.28)',
            borderRadius: 2,
            background: 'rgba(45,114,210,0.07)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#2D72D2', display: 'inline-block',
              boxShadow: '0 0 10px #2D72D2',
              animation: 'bom-pulse 2.4s ease-in-out infinite',
              color: '#2D72D2',
              animationDelay: '0.8s',
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              Ready to use
            </span>
          </div>

          <h2 style={{
            margin: '0 0 24px',
            fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>
            Start Managing
            <br />
            <span style={{ color: 'var(--accent)' }}>Your BOM Now.</span>
          </h2>

          <p style={{ margin: '0 0 52px', fontSize: 17, color: 'var(--text-3)', lineHeight: 1.75 }}>
            Parts library, assembly trees, and build orders — all in one
            structured workspace built for hardware teams.
          </p>

          <Link href="/bom/app" className="bom-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '18px 56px',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.16em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 60px rgba(45,114,210,0.45)',
          }}>
            Launch BOM Tool →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '28px 40px',
        borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--sidebar-bg)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-name" style={{ fontSize: 15 }}>Ambient <em>Intelligence</em></span>
        </Link>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Bill of Materials · Hardware PLM Platform
        </span>
        <Link href="/bom/app" style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Open App →</Link>
      </footer>

    </div>
  );
}
