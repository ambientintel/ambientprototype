'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import './digitalhealth.css';

const PHASES = [
  {
    num: '01',
    label: 'Discover',
    color: '#10B981',
    desc: 'Validate the clinical problem through evidence review, user research, and competitive analysis before building anything.',
    features: ['Problem Framework', 'User Personas', 'Evidence Review', 'Competitive Landscape'],
  },
  {
    num: '02',
    label: 'Define',
    color: '#8B5CF6',
    desc: 'Classify your product, map regulatory pathways, and build the clinical evidence and privacy strategy before a line of code.',
    features: ['Regulatory Classification', 'SaMD / DTx Pathway', 'Privacy Framework', 'Evidence Design'],
  },
  {
    num: '03',
    label: 'Develop',
    color: '#3B82F6',
    desc: 'Track build milestones, validation studies, interoperability standards, and security posture across the development lifecycle.',
    features: ['Milestone Tracker', 'Validation Studies', 'FHIR / Interop', 'Security Checklist'],
  },
  {
    num: '04',
    label: 'Deploy',
    color: '#F59E0B',
    desc: 'Navigate reimbursement codes, payer strategy, go-to-market execution, and post-market surveillance obligations.',
    features: ['Reimbursement Strategy', 'Payer Landscape', 'Launch Checklist', 'Post-Market KPIs'],
  },
] as const;

const CAPABILITIES = [
  {
    num: '01',
    label: 'Problem Framework',
    desc: 'Structure your clinical problem using validated frameworks — Jobs to Be Done, PESTLE analysis, and the WHO Health Technology Assessment model.',
  },
  {
    num: '02',
    label: 'User Research',
    desc: 'Build patient and provider personas, map care journeys, and document stakeholder pain points with structured research templates.',
  },
  {
    num: '03',
    label: 'Regulatory Classification',
    desc: 'Classify your product as SaMD, DTx, wellness, or RPM. Navigate FDA, CE Mark, and MDR pathways with guided decision trees.',
  },
  {
    num: '04',
    label: 'Clinical Evidence',
    desc: 'Design study endpoints, enrollment criteria, and analysis plans. Compare RCT vs. real-world evidence strategies for your indication.',
  },
  {
    num: '05',
    label: 'Privacy & Security',
    desc: 'Map your HIPAA obligations, GDPR requirements, data governance framework, and SOC 2 readiness across your data architecture.',
  },
  {
    num: '06',
    label: 'Interoperability',
    desc: 'Design HL7 FHIR resources, API contracts, and EHR integration points. Track SMART on FHIR, CDS Hooks, and IHE profiles.',
  },
  {
    num: '07',
    label: 'Reimbursement Strategy',
    desc: 'Map CPT codes, HCPCS codes, value-based care opportunities, and payer mix. Model health economics and ROI for payers.',
  },
  {
    num: '08',
    label: 'Post-Market Surveillance',
    desc: 'Track adverse events, real-world performance metrics, user feedback loops, and continuous improvement obligations.',
  },
] as const;

const STATS = [
  { value: '4', label: 'Phases' },
  { value: '8', label: 'Modules' },
  { value: '3', label: 'Pathways' },
  { value: '50+', label: 'Standards' },
  { value: '6', label: 'Markets' },
  { value: '∞', label: 'Products' },
];

export default function DigitalHealthLanding() {
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActivePhase(p => (p + 1) % 4), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dh-root" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 2, left: 0, right: 0, zIndex: 100,
        height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        background: 'rgba(11,9,23,0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-name">Ambient <em>Intelligence</em></span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Digital Health Studio</span>
          <Link href="/biodesign/digitalhealth/app" className="dh-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 20px',
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 24px var(--accent-glow)',
          }}>Launch →</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 160px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="dh-dots" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
        }} />
        <div className="dh-scan" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* Corner accent lines */}
        <div style={{ position: 'absolute', top: 72, left: 40, width: 80, height: 80, borderTop: '1px solid rgba(139,92,246,0.2)', borderLeft: '1px solid rgba(139,92,246,0.2)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 72, right: 40, width: 80, height: 80, borderTop: '1px solid rgba(139,92,246,0.2)', borderRight: '1px solid rgba(139,92,246,0.2)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 160, left: 40, width: 80, height: 80, borderBottom: '1px solid rgba(139,92,246,0.2)', borderLeft: '1px solid rgba(139,92,246,0.2)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 160, right: 40, width: 80, height: 80, borderBottom: '1px solid rgba(139,92,246,0.2)', borderRight: '1px solid rgba(139,92,246,0.2)', zIndex: 0 }} />

        {/* Orbit rings */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', zIndex: 0,
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          border: '1px solid rgba(139,92,246,0.06)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', zIndex: 0,
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400,
          border: '1px solid rgba(139,92,246,0.09)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', zIndex: 0,
          transform: 'translate(-50%, -50%)',
          width: 220, height: 220,
          border: '1px solid rgba(139,92,246,0.13)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 860 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '7px 18px',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 2,
            background: 'rgba(139,92,246,0.07)',
          }}>
            <span className="dh-pulse-dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#8B5CF6', display: 'inline-block',
              boxShadow: '0 0 10px #8B5CF6',
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Digital Health Innovation</span>
          </div>

          {/* Headline */}
          <h1 style={{ margin: '0 0 28px', lineHeight: 1.04, letterSpacing: '-0.025em', fontFamily: 'var(--sans)' }}>
            <span className="dh-shimmer-text" style={{ fontSize: 'clamp(44px, 6.5vw, 80px)', fontWeight: 800, display: 'block' }}>
              From Concept to Clinic.
            </span>
            <span style={{ fontSize: 'clamp(40px, 6vw, 74px)', fontWeight: 700, color: 'var(--text-2)', display: 'block' }}>
              One Platform.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            margin: '0 0 56px',
            fontSize: 'clamp(15px, 2vw, 19px)',
            color: 'var(--text-3)',
            lineHeight: 1.75,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            A structured workspace for digital health teams building software as a medical device, digital therapeutics, and health AI — from clinical problem validation through regulatory clearance, privacy compliance, and market access.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/biodesign/digitalhealth/app" className="dh-cta-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '15px 40px',
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              textDecoration: 'none', borderRadius: 2,
              boxShadow: '0 0 40px var(--accent-glow)',
            }}>
              Launch Studio →
            </Link>
            <div style={{ display: 'flex', gap: 20 }}>
              {['No account required', 'Stored locally', 'Free to use'].map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#10B981', fontSize: 12 }}>✓</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Phase pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {PHASES.map((p, i) => (
              <button key={i} onClick={() => setActivePhase(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
                  background: activePhase === i ? `${p.color}14` : 'transparent',
                  border: `1px solid ${activePhase === i ? p.color + '44' : 'var(--line)'}`,
                  transition: 'all 0.25s',
                }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 2, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                  background: activePhase === i ? p.color : 'var(--surface-2)',
                  color: activePhase === i ? '#000' : 'var(--text-4)',
                  boxShadow: activePhase === i ? `0 0 12px ${p.color}88` : 'none',
                  transition: 'all 0.25s',
                }}>{p.num}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activePhase === i ? p.color : 'var(--text-4)',
                  transition: 'color 0.25s',
                }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          borderTop: '1px solid var(--line)',
          background: 'rgba(11,9,23,0.80)',
          backdropFilter: 'blur(12px)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '18px 0', flex: 1, maxWidth: 160,
              borderRight: i < STATS.length - 1 ? '1px solid var(--line)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Phases ────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 40px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--line)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>The Process</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 500 }}>
                Four Phases.<br />One Cohesive Workflow.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.7 }}>
                Built for digital health teams navigating the full product lifecycle — from clinical insight to sustainable market access.
              </p>
            </div>
          </div>

          <div className="dh-phase-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
            {PHASES.map((phase, i) => {
              const isActive = activePhase === i;
              return (
                <div key={i} className="dh-phase-card" onClick={() => setActivePhase(i)} style={{
                  padding: '36px 28px 32px',
                  background: isActive ? `${phase.color}0b` : 'var(--surface-1)',
                  borderRight: i < 3 ? '1px solid var(--line)' : 'none',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: isActive ? `linear-gradient(90deg, transparent, ${phase.color}, ${phase.color}88, transparent)` : 'transparent',
                    transition: 'background 0.3s',
                  }} />
                  <div style={{
                    width: 40, height: 40, borderRadius: 2, marginBottom: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800,
                    background: isActive ? phase.color : 'var(--surface-2)',
                    color: isActive ? '#000' : 'var(--text-4)',
                    boxShadow: isActive ? `0 0 24px ${phase.color}66` : 'none',
                    transition: 'all 0.3s',
                  }}>{phase.num}</div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: isActive ? phase.color : 'var(--text-3)',
                    marginBottom: 14, transition: 'color 0.3s',
                  }}>{phase.label}</div>
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>{phase.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {phase.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                          background: isActive ? phase.color : 'var(--text-4)',
                          boxShadow: isActive ? `0 0 6px ${phase.color}` : 'none',
                          transition: 'all 0.3s',
                        }} />
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 10,
                          color: isActive ? 'var(--text-2)' : 'var(--text-4)',
                          textTransform: 'uppercase', letterSpacing: '0.09em',
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

      {/* ── Capabilities ──────────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 40px',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="dh-dots" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6 }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>Capabilities</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 460 }}>
                Every Tool You Need.<br />Nothing You Don&apos;t.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.7 }}>
                Eight purpose-built modules covering the complete digital health product development lifecycle.
              </p>
            </div>
          </div>

          <div className="dh-cap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
            {CAPABILITIES.map((cap, i) => (
              <div key={i} className="dh-cap-card" style={{
                padding: '28px 26px',
                background: 'var(--surface-1)',
                borderRight: (i % 4) < 3 ? '1px solid var(--line)' : 'none',
                borderBottom: i < 4 ? '1px solid var(--line)' : 'none',
                cursor: 'default',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em', marginBottom: 14 }}>{cap.num}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text)', marginBottom: 12 }}>{cap.label}</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 40px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>How It Works</div>
          <h2 style={{ margin: '0 0 72px', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Start Immediately.<br />No Setup Required.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid var(--line)' }}>
            {[
              {
                step: '01',
                title: 'Define your product',
                body: 'Name your project, select the product type — SaMD, DTx, wellness app, RPM — and set your therapeutic area. Data autosaves to your browser with no account required.',
                color: '#10B981',
              },
              {
                step: '02',
                title: 'Work through the modules',
                body: 'Navigate the four phases at your own pace. Each module guides you through the decisions that matter: regulatory pathway, evidence design, privacy obligations, and reimbursement strategy.',
                color: '#8B5CF6',
              },
              {
                step: '03',
                title: 'Export and share',
                body: 'Generate structured documents for regulatory submissions, investor decks, and compliance audits. Export your work in the format that fits your workflow.',
                color: '#3B82F6',
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
                  color: item.color, marginBottom: 24, lineHeight: 1, opacity: 0.35,
                }}>{item.step}</div>
                <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '140px 40px',
        borderTop: '1px solid var(--line)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="dh-dots" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(139,92,246,0.09) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, border: '1px solid rgba(139,92,246,0.07)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, border: '1px solid rgba(139,92,246,0.10)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, border: '1px solid rgba(139,92,246,0.14)', borderRadius: '50%', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '6px 16px',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 2,
            background: 'rgba(16,185,129,0.06)',
          }}>
            <span className="dh-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 10px #10B981', animationDelay: '1s' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Ready when you are</span>
          </div>

          <h2 style={{
            margin: '0 0 28px',
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>
            Start Your Digital Health
            <br />
            <span style={{ color: 'var(--accent)' }}>Project Now.</span>
          </h2>

          <p style={{ margin: '0 0 56px', fontSize: 17, color: 'var(--text-3)', lineHeight: 1.75 }}>
            Free to use. All data stays in your browser.<br />No login, no setup. Autosaved as you work.
          </p>

          <Link href="/biodesign/digitalhealth/app" className="dh-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '18px 56px',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.16em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 60px var(--accent-glow)',
          }}>
            Launch Studio →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
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
          Digital Health Studio · Built for SaMD, DTx, and Health AI Teams
        </span>
        <Link href="/biodesign/digitalhealth/app" style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Open Studio →</Link>
      </footer>
    </div>
  );
}
