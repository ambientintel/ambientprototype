'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FlowCanvas } from './flowbg';
import './biodesign.css';

const PHASES = [
  {
    num: '01',
    label: 'Identify',
    color: '#3DCC91',
    desc: 'Discover and filter high-value clinical needs through structured observation, stakeholder mapping, and evidence-based prioritization.',
    features: ['Need Statements', 'Stakeholder Mapping', 'Filtering Criteria', 'Observation Log'],
  },
  {
    num: '02',
    label: 'Invent',
    color: '#2D72D2',
    desc: 'Generate diverse solution concepts and systematically screen them across technical, regulatory, and commercial dimensions.',
    features: ['Concept Generation', 'Screening Matrix', 'Score Ranking', 'Stage Tracking'],
  },
  {
    num: '03',
    label: 'Implement',
    color: '#9B59B6',
    desc: 'Build the regulatory strategy, IP portfolio, clinical evidence plan, and business model required for commercialization.',
    features: ['Regulatory Strategy', 'IP Portfolio', 'Business Model', 'Clinical Plan'],
  },
  {
    num: '04',
    label: 'Comply',
    color: '#E8A838',
    desc: 'Navigate global standards and compliance frameworks with auto-selected requirements based on your device profile.',
    features: ['Device Profile', '50+ Standards', '8 Markets', 'Checklist Tracking'],
  },
] as const;

const CAPABILITIES = [
  {
    num: '01',
    label: 'Need Statements',
    desc: 'Structure clinical observations into actionable need statements using the Stanford format: a way to [solve problem] for [population] in [setting].',
  },
  {
    num: '02',
    label: 'Concept Screening',
    desc: 'Score concepts across 5 dimensions — technical feasibility, IP freedom, regulatory risk, reimbursement viability, clinical adoption.',
  },
  {
    num: '03',
    label: 'Regulatory Strategy',
    desc: '510(k), PMA, De Novo, Exempt — define your FDA pathway with predicate analysis, product code, and timeline estimation.',
  },
  {
    num: '04',
    label: 'IP Portfolio',
    desc: 'Track provisional patents, utility patents, PCT applications, trademarks, copyrights, and trade secrets with deadline management.',
  },
  {
    num: '05',
    label: 'Compliance Tracking',
    desc: 'Auto-select applicable ISO and IEC standards from your device profile. Track status, assignees, and completion across 8 global markets.',
  },
  {
    num: '06',
    label: 'Clinical Planning',
    desc: 'Design study endpoints, enrollment criteria, sample sizes, and site requirements for IDE and pivotal trial planning.',
  },
  {
    num: '07',
    label: 'Business Model',
    desc: 'Map TAM/SAM, revenue model, ASP, COGS, reimbursement codes, payer mix, and go-to-market strategy in one workspace.',
  },
  {
    num: '08',
    label: 'Document Drafting',
    desc: 'Generate structured patent claims, trademark applications, PCT summaries, and copyright registrations with guided templates.',
  },
] as const;

const STATS = [
  { value: '4', label: 'Phases' },
  { value: '8', label: 'Modules' },
  { value: '50+', label: 'Standards' },
  { value: '6', label: 'IP Types' },
  { value: '8', label: 'Markets' },
  { value: '∞', label: 'Projects' },
];

export default function BiodesignLanding() {
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActivePhase(p => (p + 1) % 4), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="biodesign-root" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 2, left: 0, right: 0, zIndex: 100,
        height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        background: 'rgba(13,22,34,0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-name">Ambient <em>Intelligence</em></span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Biodesign Platform</span>
          <Link href="/biodesign/app" className="bd-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 20px',
            background: 'var(--accent)', color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 24px rgba(82,192,232,0.25)',
          }}>Launch →</Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 160px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <FlowCanvas accent="#52C0E8" style={{ zIndex: 0 }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(82,192,232,0.10) 0%, rgba(82,192,232,0.04) 40%, transparent 70%)',
        }} />
        {/* Scan animation */}
        <div className="bd-scan" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        {/* Corner accent lines */}
        <div style={{ position: 'absolute', top: 72, left: 40, width: 80, height: 80, borderTop: '1px solid rgba(82,192,232,0.2)', borderLeft: '1px solid rgba(82,192,232,0.2)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 72, right: 40, width: 80, height: 80, borderTop: '1px solid rgba(82,192,232,0.2)', borderRight: '1px solid rgba(82,192,232,0.2)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 160, left: 40, width: 80, height: 80, borderBottom: '1px solid rgba(82,192,232,0.2)', borderLeft: '1px solid rgba(82,192,232,0.2)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 160, right: 40, width: 80, height: 80, borderBottom: '1px solid rgba(82,192,232,0.2)', borderRight: '1px solid rgba(82,192,232,0.2)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 860 }}>
          {/* Framework badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '7px 18px',
            border: '1px solid rgba(82,192,232,0.3)',
            borderRadius: 2,
            background: 'rgba(82,192,232,0.07)',
          }}>
            <span className="bd-pulse-dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#52C0E8', display: 'inline-block',
              boxShadow: '0 0 10px #52C0E8',
            }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Medical Device Innovation</span>
          </div>

          {/* Headline */}
          <h1 style={{
            margin: '0 0 28px',
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            fontFamily: 'var(--sans)',
          }}>
            <span className="bd-shimmer-text" style={{ fontSize: 'clamp(44px, 6.5vw, 80px)', fontWeight: 800, display: 'block' }}>
              From Need to Market.
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
            A structured workspace for medical device teams navigating the Stanford Biodesign process — from clinical need identification through regulatory strategy, IP protection, and standards compliance.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/biodesign/app" className="bd-cta-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '15px 40px',
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.14em',
              textDecoration: 'none', borderRadius: 2,
              boxShadow: '0 0 40px rgba(82,192,232,0.4)',
            }}>
              Launch Platform →
            </Link>
            <div style={{ display: 'flex', gap: 20 }}>
              {['No account required', 'Stored locally', 'Free to use'].map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#3DCC91', fontSize: 12 }}>✓</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Phase indicators */}
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
          background: 'rgba(13,22,34,0.78)',
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

      {/* ── Phases ─────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 40px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--line)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>The Process</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <h2 style={{
                margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1,
                maxWidth: 500,
              }}>
                Four Phases.<br />One Cohesive Workflow.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.7 }}>
                Built around the Stanford Biodesign process — the gold standard for systematic medical device innovation.
              </p>
            </div>
          </div>

          {/* Phase grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
            {PHASES.map((phase, i) => {
              const isActive = activePhase === i;
              return (
                <div
                  key={i}
                  className="bd-phase-card"
                  onClick={() => setActivePhase(i)}
                  style={{
                    padding: '36px 28px 32px',
                    background: isActive ? `${phase.color}0b` : 'var(--surface-1)',
                    borderRight: i < 3 ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Active top bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: isActive
                      ? `linear-gradient(90deg, transparent, ${phase.color}, ${phase.color}88, transparent)`
                      : 'transparent',
                    transition: 'background 0.3s',
                  }} />
                  {/* Number badge */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 2, marginBottom: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800,
                    background: isActive ? phase.color : 'var(--surface-2)',
                    color: isActive ? '#000' : 'var(--text-4)',
                    boxShadow: isActive ? `0 0 24px ${phase.color}66` : 'none',
                    transition: 'all 0.3s',
                  }}>{phase.num}</div>
                  {/* Label */}
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: isActive ? phase.color : 'var(--text-3)',
                    marginBottom: 14,
                    transition: 'color 0.3s',
                  }}>{phase.label}</div>
                  {/* Description */}
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.65 }}>{phase.desc}</p>
                  {/* Features */}
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

      {/* ── Capabilities ───────────────────────────────────────── */}
      <section style={{
        padding: '120px 40px',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="biodesign-dots" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6 }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(82,192,232,0.05) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18 }}>Capabilities</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <h2 style={{
                margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 460,
              }}>
                Every Tool You Need.<br />Nothing You Don't.
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.7 }}>
                Eight purpose-built modules covering the complete medical device development lifecycle.
              </p>
            </div>
          </div>

          {/* Capabilities grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
            {CAPABILITIES.map((cap, i) => (
              <div
                key={i}
                className="bd-cap-card"
                style={{
                  padding: '28px 26px',
                  background: 'var(--surface-1)',
                  borderRight: (i % 4) < 3 ? '1px solid var(--line)' : 'none',
                  borderBottom: i < 4 ? '1px solid var(--line)' : 'none',
                  cursor: 'default',
                }}
              >
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
                  letterSpacing: '0.16em', marginBottom: 14,
                }}>{cap.num}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'var(--text)', marginBottom: 12,
                }}>{cap.label}</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
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
                title: 'Name your project',
                body: 'Give your project a name and clinical indication. All data saves automatically to your browser — no account, no server, no sync required.',
                color: '#3DCC91',
              },
              {
                step: '02',
                title: 'Work through the phases',
                body: 'Navigate the four phases at your own pace. Each module guides you with structured forms, scoring rubrics, and built-in biodesign methodology.',
                color: '#2D72D2',
              },
              {
                step: '03',
                title: 'Export your work',
                body: 'Draft IP filings, download structured documents, and export your compliance checklist. Take your work wherever it needs to go.',
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
                  opacity: 0.35,
                }}>{item.step}</div>
                <h3 style={{
                  margin: '0 0 14px', fontSize: 18, fontWeight: 700,
                  letterSpacing: '-0.01em', color: 'var(--text)',
                }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section style={{
        padding: '140px 40px',
        borderTop: '1px solid var(--line)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="biodesign-dots" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(82,192,232,0.09) 0%, transparent 70%)',
        }} />
        {/* Decorative lines */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, border: '1px solid rgba(82,192,232,0.07)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, border: '1px solid rgba(82,192,232,0.1)', borderRadius: '50%', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, border: '1px solid rgba(82,192,232,0.14)', borderRadius: '50%', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 44,
            padding: '6px 16px',
            border: '1px solid rgba(61,204,145,0.25)',
            borderRadius: 2,
            background: 'rgba(61,204,145,0.06)',
          }}>
            <span className="bd-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#3DCC91', display: 'inline-block', boxShadow: '0 0 10px #3DCC91', animationDelay: '1s' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#3DCC91', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Ready when you are</span>
          </div>

          <h2 style={{
            margin: '0 0 28px',
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>
            Start Your Biodesign
            <br />
            <span style={{ color: 'var(--accent)' }}>Project Now.</span>
          </h2>

          <p style={{ margin: '0 0 56px', fontSize: 17, color: 'var(--text-3)', lineHeight: 1.75 }}>
            Free to use. All data stays in your browser.
            No login, no setup. Autosaved as you work.
          </p>

          <Link href="/biodesign/app" className="bd-cta-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '18px 56px',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.16em',
            textDecoration: 'none', borderRadius: 2,
            boxShadow: '0 0 60px rgba(82,192,232,0.45)',
          }}>
            Launch Platform →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
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
          Biodesign Platform · Built on the Medical Device Innovation
        </span>
        <Link href="/biodesign/app" style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)',
          textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Open App →</Link>
      </footer>
    </div>
  );
}
