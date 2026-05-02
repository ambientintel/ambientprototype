'use client';
import Link from 'next/link';

const GROUPS: {
  label: string;
  color: string;
  skills: { cmd: string; desc: string }[];
}[] = [
  {
    label: 'Browse & QA',
    color: '#2D72D2',
    skills: [
      { cmd: '/browse', desc: 'Headless browser — navigate URLs, click, fill forms, take screenshots, diff before/after. ~100ms per command.' },
      { cmd: '/connect-chrome', desc: 'Launch a visible AI-controlled Chromium window with a live sidebar. Watch every action in real time.' },
      { cmd: '/qa', desc: 'Systematically QA test a web app, then iteratively fix bugs found and re-verify each one.' },
      { cmd: '/qa-only', desc: 'Report-only QA — produces a structured health report with screenshots and repro steps, never fixes.' },
      { cmd: '/setup-browser-cookies', desc: 'Import cookies from your real Chromium browser into the headless session for authenticated testing.' },
      { cmd: '/canary', desc: 'Post-deploy canary monitoring — watch the live app for errors and regressions against pre-deploy baselines.' },
      { cmd: '/benchmark', desc: 'Performance regression detection — baselines page load, Core Web Vitals, and resource sizes before/after PRs.' },
    ],
  },
  {
    label: 'Plan Reviews',
    color: '#C8922A',
    skills: [
      { cmd: '/plan-ceo-review', desc: 'CEO/founder-mode plan review — rethinks the problem, finds the 10-star product, challenges premises.' },
      { cmd: '/plan-eng-review', desc: 'Eng manager plan review — locks in architecture, data flow, edge cases, test coverage, and performance.' },
      { cmd: '/plan-design-review', desc: "Designer's eye plan review — rates each design dimension 0–10 and fixes the plan to reach 10." },
      { cmd: '/plan-devex-review', desc: 'Developer experience plan review — explores DX personas, benchmarks competitors, designs magical moments.' },
      { cmd: '/autoplan', desc: 'Runs CEO, design, eng, and DX reviews sequentially with auto-decisions, surfacing only taste calls.' },
    ],
  },
  {
    label: 'Design',
    color: '#7C6EAD',
    skills: [
      { cmd: '/design-consultation', desc: 'Proposes a complete design system — aesthetic, typography, color, layout — and generates preview pages.' },
      { cmd: '/design-shotgun', desc: 'Generates multiple AI design variants, opens a comparison board, collects feedback, and iterates.' },
      { cmd: '/design-html', desc: 'Generates production-quality HTML/CSS from approved mockups or a description. Text reflows, layouts are dynamic.' },
      { cmd: '/design-review', desc: 'Live design audit of the running site — screenshots every page, scores against the design system.' },
    ],
  },
  {
    label: 'Code & Ship',
    color: '#3DCC91',
    skills: [
      { cmd: '/review', desc: 'Pre-landing PR review — checks SQL safety, LLM trust boundaries, conditional side effects, and structural issues.' },
      { cmd: '/ship', desc: 'Full ship workflow: merge base, run tests, review diff, bump version, update changelog, create PR.' },
      { cmd: '/land-and-deploy', desc: 'Merges the PR, waits for CI and deploy, then verifies production health via canary checks.' },
      { cmd: '/codex', desc: 'OpenAI Codex CLI wrapper — code review, adversarial challenge mode, or consult with session continuity.' },
      { cmd: '/investigate', desc: 'Systematic root-cause debugging across four phases: investigate, analyze, hypothesize, implement. No fixes without root cause.' },
    ],
  },
  {
    label: 'Safety',
    color: '#FF6B6B',
    skills: [
      { cmd: '/careful', desc: 'Warns before rm -rf, DROP TABLE, force-push, and similar destructive ops. User can override each warning.' },
      { cmd: '/freeze', desc: 'Restricts Edit and Write to a specific directory for the session — prevents accidental out-of-scope changes.' },
      { cmd: '/guard', desc: 'Full safety mode: combines /careful (destructive warnings) + /freeze (scoped edits) simultaneously.' },
      { cmd: '/unfreeze', desc: 'Removes the active /freeze restriction, restoring normal edit access.' },
      { cmd: '/cso', desc: 'Chief Security Officer audit — secrets archaeology, supply chain, CI/CD, LLM security, OWASP Top 10, STRIDE.' },
    ],
  },
  {
    label: 'Project & Team',
    color: '#00B4D8',
    skills: [
      { cmd: '/office-hours', desc: 'YC Office Hours simulation — forcing questions that expose demand reality, wedge, and future-fit.' },
      { cmd: '/retro', desc: 'Weekly engineering retro — analyzes commits, work patterns, and code quality with per-person breakdowns.' },
      { cmd: '/devex-review', desc: 'Live DX audit — navigates docs, tries the getting started flow, times TTHW, screenshots errors.' },
      { cmd: '/document-release', desc: 'Post-ship docs update — cross-references the diff, updates README/ARCHITECTURE/CLAUDE.md, polishes changelog.' },
      { cmd: '/learn', desc: 'Manage project learnings — review, search, prune, and export what gstack has learned across sessions.' },
    ],
  },
  {
    label: 'Setup & Maintenance',
    color: 'rgba(246,247,248,0.42)',
    skills: [
      { cmd: '/setup-deploy', desc: 'Configure /land-and-deploy — detects your platform (Vercel, Fly.io, Render…), production URL, and health checks.' },
      { cmd: '/setup-gbrain', desc: 'Install and configure gbrain: local PGLite or Supabase brain, MCP registration, per-remote trust policy.' },
      { cmd: '/gstack-upgrade', desc: 'Upgrade gstack to the latest version and show what\'s new.' },
    ],
  },
];

const INSTALL_STEPS = [
  { label: 'Clone', code: 'git clone --single-branch --depth 1 \\\n  https://github.com/garrytan/gstack.git \\\n  ~/.claude/skills/gstack' },
  { label: 'Install bun', code: 'curl -fsSL https://bun.sh/install | bash' },
  { label: 'Build', code: 'cd ~/.claude/skills/gstack && ./setup' },
  { label: 'Configure', code: '# Add to ~/.claude/CLAUDE.md:\n# Use /browse for all web browsing.\n# Never use mcp__claude-in-chrome__* tools.' },
];

export default function GstackPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--line)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: 13 }}>← Home</Link>
        <span style={{ color: 'var(--line-strong)' }}>·</span>
        <span style={{ color: 'var(--text-3)', fontSize: 13 }}>gstack</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{
              background: 'rgba(45,114,210,0.15)',
              color: '#2D72D2',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
            }}>Claude Code Skill Pack</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            gstack
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 560 }}>
            A collection of skills for Claude Code — headless browsing, QA testing, plan reviews,
            design, shipping, and safety. Type a slash command in any Claude Code session to invoke.
          </p>
        </div>

        {/* Install */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Installation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {INSTALL_STEPS.map((step, i) => (
              <div key={i} style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: 'var(--surface-3)',
                    color: 'var(--text-3)',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{step.label}</span>
                </div>
                <pre style={{
                  margin: 0,
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--text-2)',
                  background: 'var(--surface-2)',
                  borderRadius: 5,
                  padding: '10px 12px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                }}>{step.code}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[
              { title: 'CLAUDE.md injection', body: 'Each skill has a SKILL.md. Claude Code loads it into context when you invoke the slash command, giving the model its instructions.' },
              { title: 'Compiled binaries', body: 'The setup script builds native binaries (browse, design, pdf) via bun. The /browse skill runs headless Chromium via Playwright under the hood.' },
              { title: 'Slash command trigger', body: 'Type /browse, /ship, /qa, etc. in any Claude Code session. The skill file is loaded and Claude follows its protocol.' },
            ].map((item) => (
              <div key={item.title} style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '20px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills reference */}
        <section>
          <h2 style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Skills reference
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {GROUPS.map((group) => (
              <div key={group.label}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.04em' }}>{group.label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.skills.map((skill, i) => (
                    <div key={skill.cmd} style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 1fr',
                      gap: 16,
                      padding: '11px 14px',
                      background: i % 2 === 0 ? 'var(--surface-1)' : 'transparent',
                      borderRadius: 6,
                      alignItems: 'baseline',
                    }}>
                      <code style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 12,
                        color: group.color,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}>{skill.cmd}</code>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{skill.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Run <code style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>/gstack-upgrade</code> anytime to get the latest version.
          </span>
          <a
            href="https://github.com/garrytan/gstack"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
          >
            github.com/garrytan/gstack →
          </a>
        </div>
      </div>
    </div>
  );
}
