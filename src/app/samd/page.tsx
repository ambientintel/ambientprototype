'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const MODULES = [
  {
    num: '01',
    label: 'Requirements',
    desc: 'Draft, review, approve, and verify software requirements with full lifecycle tracking and traceability.',
    features: ['Draft & Review', 'Approval Workflow', 'Verification Tracing', 'Status Lifecycle'],
  },
  {
    num: '02',
    label: 'Risk Analysis',
    desc: 'Map hazards, assign severity and probability scores, implement risk controls, and track residual risk to ISO 14971.',
    features: ['Hazard Register', 'Severity Scoring', 'Risk Controls', 'Residual Risk'],
  },
  {
    num: '03',
    label: 'SOUP Tracking',
    desc: 'Catalog all Software of Unknown Provenance (SOUP) with version control, scope classification, and anomaly tracking.',
    features: ['Version Control', 'Scope Classification', 'Anomaly Review', 'License Tracking'],
  },
  {
    num: '04',
    label: 'Verification',
    desc: 'Design and execute verification tests with pass/fail tracking, test protocol management, and evidence collection.',
    features: ['Test Protocols', 'Pass/Fail Tracking', 'CI Integration', 'Coverage Reports'],
  },
  {
    num: '05',
    label: 'Release Mgmt',
    desc: 'Manage software releases from Draft through Released with approval workflows and version history.',
    features: ['Release Lifecycle', 'Approval Gates', 'SBOM Generation', 'Version History'],
  },
] as const;

const STATS = [
  { value: 'SRS', label: 'Requirements' },
  { value: 'ISO', label: 'Hazards' },
  { value: 'SOUP', label: 'SOUP Items' },
  { value: 'VnV', label: 'Test Cases' },
  { value: 'CM', label: 'Releases' },
];

const STANDARDS = [
  { id: 'IEC 62304', desc: 'Medical device software lifecycle' },
  { id: 'ISO 14971', desc: 'Risk management for medical devices' },
  { id: 'FDA SaMD', desc: 'Software as a Medical Device guidance' },
  { id: 'IEC 62366', desc: 'Usability engineering' },
];

export default function SamdLanding() {
  const [activeModule, setActiveModule] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveModule(m => (m + 1) % MODULES.length);
      setTick(t => t + 1);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--sans)',
      overflowX: 'hidden',
    }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes samd-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes samd-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes samd-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .samd-module-card:hover {
          background: rgba(45,114,210,0.05) !important;
          border-color: rgba(45,114,210,0.22) !important;
        }
        .samd-std-card:hover {
          background: var(--surface-2) !important;
          border-color: rgba(45,114,210,0.2) !important;
        }
        .samd-cta-btn {
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .samd-cta-btn:hover {
          box-shadow: 0 0 52px rgba(45,114,210,0.55) !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        background: 'rgba(6,8,12,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-name">Ambient <em>Intelligence</em></span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
            textTransform: 'uppercase', letterSpacing: '0.16em',
          }}>SaMD Compliance Platform</span>
          <Link href="/samd/app" className="samd-cta-btn" style={{
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
        padding: '120px 40px 160px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Blue radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 65% 55% at 50% 42%, rgba(45,114,210,0.12) 0%, rgba(45,114,210,0.04) 45%, transparent 70%)',
        }} />
        {/* Scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(45,114,210,0.15) 30%, rgba(45,114,210,0.3) 50%, rgba(45,114,210,0.15) 70%, transparent 100%)',
          zIndex: 0,
          animation: 'samd-scan 9s linear infinite',
        }} />
        {/* Corner accent lines */}
        <div style={{ position: 'absolute', top: 72, left: 40, width: 80, height: 80, borderTop: '1px solid rgba(45,114,210,0.18)', borderLeft: '1px solid rgba(45,114,210,0.18)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 72, right: 40, width: 80, height: 80, borderTop: '1px solid rgba(45,114,210,0.18)', borderRight: '1px solid rgba(45,114,210,0.18)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 160, left: 40, width: 80, height: 80, borderBottom: '1px solid rgba(45,114,210,0.18)', borderLeft: '1px solid rgba(45,114,210,0.18)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 160, right: 40, width: 80, height: 80, borderBottom: '1px solid rgba(45,114,210,0.18)', borderRight: '1px solid rgba(45,114,210,0.18)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 880 }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '7px 18px',
            border: '1px solid rgba(45,114,210,0.3)',
            borderRadius: 2,
            background: 'rgba(45,114,210,0.07)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#2D72D2', display: 'inline-block',
              boxShadow: '0 0 10px #2D72D2',
              animation: 'samd-pulse 2.4s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.2em',
            }}>IEC 62304 · ISO 14971 · FDA SaMD Guidance</span>
          </div>

          {/* Headline */}
          <h1 style={{ margin: '0 0 28px', lineHeight: 1.04, letterSpacing: '-0.025em', fontFamily: 'var(--sans)' }}>
            <span style={{
              fontSize: 'clamp(42px, 6.5vw, 78px)', fontWeight: 800,
              display: 'block', color: 'var(--text)',
            }}>
              IEC 62304 Compliance
            </span>
            <span style={{
              fontSize: 'clamp(38px, 5.8vw, 70px)', fontWeight: 700,
              color: 'var(--accent)', display: 'block',
            }}>
              for Software Teams.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            margin: '0 0 56px',
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-3)',
            lineHeight: 1.8,
            maxWidth: 620,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            A structured SaMD development platform for medical software teams — manage software requirements, conduct risk analysis, track SOUP dependencies, run verification tests, and manage releases to IEC 62304 and FDA guidance.
          </p>

          {/* CTA row */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center',
            alignItems: 'center', flexWrap: 'wrap', marginBottom: 64,
          }}>
            <Link href="/samd/app" className="samd-cta-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '15px 44px',
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              textDecoration: 'none', borderRadius: 2,
              boxShadow: '0 0 40px rgba(45,114,210,0.4)',
            }}>
              Open Platform →
            </Link>
            <div style={{ display: 'flex', gap: 20 }}>
              {['IEC 62304 aligned', 'ISO 14971 risk', 'FDA guidance'].map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#2D72D2', fontSize: 12 }}>✓</span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>{t}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Module selectors */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {MODULES.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
                background: activeModule === i ? 'rgba(45,114,210,0.10)' : 'transparent',
                border: `1px solid ${activeModule === i ? 'rgba(45,114,210,0.4)' : 'var(--line)'}`,
                transition: 'all 0.25s',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 2, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                  background: activeModule === i ? 'var(--accent)' : 'var(--surface-2)',
                  color: activeModule === i ? '#fff' : 'var(--text-4)',
                  boxShadow: activeModule === i ? '0 0 10px rgba(45,114,210,0.6)' : 'none',
                  transition: 'all 0.25s',
                }}>{m.num}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activeModule === i ? 'var(--accent)' : 'var(--text-4)',
                  transition: 'color 0.25s',
                }}>{m.label}</span>
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
              padding: '18px 0', flex: 1, maxWidth: 160,
              borderRight: i < STATS.length - 1 ? '1px solid var(--line)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700,
                color: 'var(--accent)', lineHeight: 1,
                letterSpacing: '0.05em',
              }}>{s.value}</div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
                textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 6,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules section ── */}
      <section style={{
        padding: '120px 40px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18,
            }}>Five Modules</div>
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
            }}>
              <h2 style={{
                margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 500,
              }}>
                Every Document.<br />One Platform.
              </h2>
              <p style={{
                margin: 0, fontSize: 14, color: 'var(--text-3)',
                maxWidth: 360, lineHeight: 1.75,
              }}>
                Purpose-built modules covering the complete IEC 62304 software lifecycle — from requirements through release.
              </p>
            </div>
          </div>

          {/* Module grid — 5 columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0,
            border: '1px solid var(--line)',
          }}>
            {MODULES.map((mod, i) => {
              const isActive = activeModule === i;
              return (
                <div
                  key={i}
                  className="samd-module-card"
                  onClick={() => setActiveModule(i)}
                  style={{
                    padding: '32px 24px 28px',
                    background: isActive ? 'rgba(45,114,210,0.06)' : 'var(--surface-1)',
                    borderRight: i < 4 ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background 0.25s, border-color 0.25s',
                  }}
                >
                  {/* Active top bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: isActive
                      ? 'linear-gradient(90deg, transparent, var(--accent), rgba(45,114,210,0.5), transparent)'
                      : 'transparent',
                    transition: 'background 0.3s',
                  }} />
                  {/* Number badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 2, marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800,
                    background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                    color: isActive ? '#fff' : 'var(--text-4)',
                    boxShadow: isActive ? '0 0 20px rgba(45,114,210,0.5)' : 'none',
                    transition: 'all 0.3s',
                  }}>{mod.num}</div>
                  {/* Label */}
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: isActive ? 'var(--accent)' : 'var(--text-3)',
                    marginBottom: 12,
                    transition: 'color 0.3s',
                  }}>{mod.label}</div>
                  {/* Description */}
                  <p style={{
                    margin: '0 0 20px', fontSize: 12, color: 'var(--text-3)',
                    lineHeight: 1.7,
                  }}>{mod.desc}</p>
                  {/* Feature bullets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mod.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
                          background: isActive ? 'var(--accent)' : 'var(--text-4)',
                          boxShadow: isActive ? '0 0 5px rgba(45,114,210,0.7)' : 'none',
                          transition: 'all 0.3s',
                        }} />
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 10,
                          color: isActive ? 'var(--text-2)' : 'var(--text-4)',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          transition: 'color 0.3s',
                        }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Standards compliance section ── */}
      <section style={{
        padding: '120px 40px',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(45,114,210,0.05) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18,
            }}>Standards</div>
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
            }}>
              <h2 style={{
                margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 480,
              }}>
                Built for Regulated<br />Software Development.
              </h2>
              <p style={{
                margin: 0, fontSize: 14, color: 'var(--text-3)',
                maxWidth: 360, lineHeight: 1.75,
              }}>
                Built around IEC 62304, ISO 14971, and FDA Software guidance — the core framework for medical device software compliance.
              </p>
            </div>
          </div>

          {/* Standards grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0, border: '1px solid var(--line)', marginBottom: 64,
          }}>
            {STANDARDS.map((std, i) => (
              <div
                key={i}
                className="samd-std-card"
                style={{
                  padding: '28px 26px',
                  background: 'var(--surface-1)',
                  borderRight: i < 3 ? '1px solid var(--line)' : 'none',
                  transition: 'background 0.2s, border-color 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg, var(--accent), transparent)',
                  opacity: 0.4,
                }} />
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800,
                  color: 'var(--accent)', marginBottom: 10, letterSpacing: '0.04em',
                }}>{std.id}</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65 }}>{std.desc}</p>
              </div>
            ))}
          </div>

          {/* How it works steps */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, border: '1px solid var(--line)',
          }}>
            {[
              {
                step: '01',
                title: 'Define your software item',
                body: 'Set the package name, safety class (A/B/C), regulatory status, and applicable standards. The platform auto-structures your documentation framework.',
              },
              {
                step: '02',
                title: 'Work through the modules',
                body: 'Navigate requirements, risk analysis, SOUP inventory, verification tests, and releases at your own pace with structured forms and guidance.',
              },
              {
                step: '03',
                title: 'Ship with confidence',
                body: 'Every release includes full traceability — from requirements through test evidence — giving you the audit trail regulators expect.',
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
                  background: `linear-gradient(90deg, var(--accent), transparent)`,
                }} />
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800,
                  color: 'var(--accent)', marginBottom: 24, lineHeight: 1,
                  opacity: 0.25,
                }}>{item.step}</div>
                <h3 style={{
                  margin: '0 0 14px', fontSize: 17, fontWeight: 700,
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
        background: 'var(--sidebar-bg)',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,114,210,0.08) 0%, transparent 70%)',
        }} />
        {/* Decorative rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 640, height: 640, border: '1px solid rgba(45,114,210,0.06)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 420, height: 420, border: '1px solid rgba(45,114,210,0.09)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, border: '1px solid rgba(45,114,210,0.13)', borderRadius: '50%', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '6px 16px',
            border: '1px solid rgba(45,114,210,0.28)',
            borderRadius: 2,
            background: 'rgba(45,114,210,0.07)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)', display: 'inline-block',
              boxShadow: '0 0 10px var(--accent)',
              animation: 'samd-pulse 2.4s ease-in-out infinite',
              animationDelay: '0.8s',
            }} />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.18em',
            }}>Ready for your software item</span>
          </div>

          <h2 style={{
            margin: '0 0 28px',
            fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 800,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>
            Start Your SaMD
            <br />
            <span style={{ color: 'var(--accent)' }}>Documentation.</span>
          </h2>

          <p style={{
            margin: '0 0 16px', fontSize: 16, color: 'var(--text-3)', lineHeight: 1.8,
          }}>
            IEC 62304 · ISO 14971 · FDA Software Guidance
          </p>
          <p style={{
            margin: '0 0 56px', fontSize: 15, color: 'var(--text-4)', lineHeight: 1.75,
          }}>
            All five modules. Full audit trail. No setup required.
          </p>

          <Link href="/samd/app" className="samd-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '18px 60px',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.16em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 60px rgba(45,114,210,0.45)',
          }}>
            Open Platform →
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
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)',
          textTransform: 'uppercase', letterSpacing: '0.14em',
        }}>
          SaMD Platform · IEC 62304 · ISO 14971 · FDA Software Guidance
        </span>
        <Link href="/samd/app" style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Open App →</Link>
      </footer>
    </div>
  );
}
