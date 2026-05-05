'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import './agenticstudio.css';

// ── Spark canvas background ──────────────────────────────────────────────────
function SparkCanvas() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const W = svg.clientWidth || window.innerWidth;
    const H = svg.clientHeight || 700;

    // Backbone nodes
    const nodes = [
      { x: W * 0.12, y: H * 0.25 }, { x: W * 0.28, y: H * 0.18 },
      { x: W * 0.42, y: H * 0.55 }, { x: W * 0.58, y: H * 0.22 },
      { x: W * 0.50, y: H * 0.70 }, { x: W * 0.70, y: H * 0.45 },
      { x: W * 0.82, y: H * 0.20 }, { x: W * 0.90, y: H * 0.65 },
      { x: W * 0.22, y: H * 0.72 }, { x: W * 0.65, y: H * 0.78 },
      { x: W * 0.35, y: H * 0.38 }, { x: W * 0.76, y: H * 0.32 },
    ];

    const edges = [
      [0,1],[1,10],[10,2],[2,4],[1,3],[3,11],[11,5],[5,6],[5,7],
      [9,7],[4,9],[0,8],[8,4],[3,5],[2,5],[6,11],
    ];

    // Backbone lines
    edges.forEach(([a, b]) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(nodes[a].x));
      line.setAttribute('y1', String(nodes[a].y));
      line.setAttribute('x2', String(nodes[b].x));
      line.setAttribute('y2', String(nodes[b].y));
      line.setAttribute('stroke', 'rgba(255,107,53,0.07)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    });

    // Spark lines
    edges.forEach(([a, b], i) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(nodes[a].x));
      line.setAttribute('y1', String(nodes[a].y));
      line.setAttribute('x2', String(nodes[b].x));
      line.setAttribute('y2', String(nodes[b].y));
      const colors = ['rgba(255,107,53,0.9)', 'rgba(245,158,11,0.9)', 'rgba(6,182,212,0.7)'];
      line.setAttribute('stroke', colors[i % 3]);
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-linecap', 'round');
      line.classList.add('as-spark-line');
      const dur = 6 + (i % 5) * 0.8;
      const delay = -(i * 1.1);
      line.style.animationDuration = `${dur}s`;
      line.style.animationDelay = `${delay}s`;
      svg.appendChild(line);
    });

    // Nodes
    nodes.forEach(({ x, y }) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(x));
      c.setAttribute('cy', String(y));
      c.setAttribute('r', '2.5');
      c.setAttribute('fill', 'rgba(255,107,53,0.25)');
      svg.appendChild(c);
    });
  }, []);

  return (
    <svg
      ref={ref}
      className="as-hero-canvas"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    />
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const MODELS = [
  { name: 'Claude 4', maker: 'Anthropic', color: '#FF6B35' },
  { name: 'GPT-4o', maker: 'OpenAI', color: '#10A37F' },
  { name: 'Gemini 2.5', maker: 'Google', color: '#4285F4' },
  { name: 'Mistral', maker: 'Mistral AI', color: '#F59E0B' },
  { name: 'Llama 3.3', maker: 'Meta', color: '#0668E1' },
  { name: 'Command R+', maker: 'Cohere', color: '#39C5BB' },
];

const FEATURES = [
  {
    num: '01',
    title: 'Agent Builder',
    desc: 'Design multi-step agentic workflows with a visual node editor. Wire tools, memory, sub-agents, and decision branches without writing orchestration boilerplate.',
    tags: ['tool-use', 'orchestration', 'visual'],
    color: '#FF6B35',
  },
  {
    num: '02',
    title: 'Tool Use Studio',
    desc: 'Build, validate, and test JSON tool schemas interactively. Live sandbox runs actual Claude API calls so you see exact tool_use blocks before shipping.',
    tags: ['tool-use', 'JSON schema', 'sandbox'],
    color: '#F59E0B',
  },
  {
    num: '03',
    title: 'MCP Server Builder',
    desc: 'Scaffold Model Context Protocol servers from a template library. Define resources, tools, and prompts then deploy to Vercel or Docker with one click.',
    tags: ['MCP', 'server', 'deploy'],
    color: '#06B6D4',
  },
  {
    num: '04',
    title: 'Multi-Agent Orchestration',
    desc: 'Chain specialized sub-agents with typed state handoffs, retry logic, and parallel fan-out. Visualize execution graphs and inspect every message passed between agents.',
    tags: ['parallel', 'state', 'sub-agents'],
    color: '#A78BFA',
  },
  {
    num: '05',
    title: 'Prompt Engineering Lab',
    desc: 'A/B test prompts across multiple models simultaneously. Score outputs with custom rubrics or model-as-judge, track regressions, and export winning variants.',
    tags: ['eval', 'A/B test', 'multi-model'],
    color: '#34D399',
  },
  {
    num: '06',
    title: 'Memory & Context Manager',
    desc: 'Connect vector stores, summarize long contexts automatically, and manage episodic memory across sessions. Supports Pinecone, pgvector, and in-memory backends.',
    tags: ['RAG', 'vector', 'context'],
    color: '#F472B6',
  },
  {
    num: '07',
    title: 'Evaluation Framework',
    desc: 'Define evals as code: expected outputs, rubric graders, factual-consistency checks, and latency SLOs. Run in CI/CD to catch regressions before every release.',
    tags: ['evals', 'CI/CD', 'grading'],
    color: '#FB923C',
  },
  {
    num: '08',
    title: 'API Gateway & Cost Tracker',
    desc: 'Unified API key management across providers. Route requests by cost, latency, or capability. Real-time token burn dashboards with per-project budgets and alerts.',
    tags: ['routing', 'cost', 'observability'],
    color: '#818CF8',
  },
] as const;

const STEPS = [
  {
    num: '01',
    title: 'Define your agent',
    desc: 'Describe the goal, select a model, and attach tools from our library or your own schemas.',
  },
  {
    num: '02',
    title: 'Wire up context',
    desc: 'Connect memory, documents, APIs, and sub-agents as context sources with typed handoffs.',
  },
  {
    num: '03',
    title: 'Test in sandbox',
    desc: 'Run live loops against real model APIs. Inspect every message, tool call, and state transition.',
  },
  {
    num: '04',
    title: 'Evaluate & iterate',
    desc: 'Score outputs with rubrics. Track regressions across versions. Ship with confidence.',
  },
  {
    num: '05',
    title: 'Deploy & monitor',
    desc: 'Export to TypeScript, Python, or deploy as a hosted endpoint. Monitor cost and latency live.',
  },
] as const;

const DEEP_MODELS = [
  {
    name: 'Claude 4 (Opus / Sonnet)',
    maker: 'Anthropic',
    accentColor: '#FF6B35',
    features: ['Extended tool use & computer use', 'MCP native support', 'Prompt caching up to 90% cost reduction', 'Vision + document understanding'],
  },
  {
    name: 'GPT-4o & o3',
    maker: 'OpenAI',
    accentColor: '#10A37F',
    features: ['Structured outputs via JSON mode', 'Function calling + parallel tools', 'Assistants API thread management', 'Real-time audio + vision'],
  },
  {
    name: 'Gemini 2.5 Pro',
    maker: 'Google',
    accentColor: '#4285F4',
    features: ['1M token context window', 'Native code execution sandbox', 'Grounding with Google Search', 'Multimodal inputs (video, audio)'],
  },
  {
    name: 'Mistral & Llama 3',
    maker: 'Open Source',
    accentColor: '#F59E0B',
    features: ['Self-hosted on your infrastructure', 'Fine-tuning workflows built in', 'GGUF / vLLM / Ollama support', 'Privacy-first, no data egress'],
  },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AgenticStudioPage() {
  return (
    <div className="as-root">

      {/* Nav */}
      <nav className="as-nav">
        <Link href="/agenticstudio" className="as-nav-logo">
          <span className="as-nav-logo-mark">AS</span>
          AgenticStudio
        </Link>
        <ul className="as-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#models">Models</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="https://github.com/john3913/agenticstudio" target="_blank" rel="noopener">GitHub</a></li>
        </ul>
        <a href="#features" className="as-nav-cta">Get started</a>
      </nav>

      {/* Hero */}
      <section className="as-hero">
        <SparkCanvas />
        <div className="as-hero-content">
          <div className="as-hero-eyebrow">
            <span className="as-hero-eyebrow-dot" />
            Agentic AI Development Platform
          </div>
          <h1 className="as-hero-h1">
            Build <em>autonomous agents</em><br />that actually ship
          </h1>
          <p className="as-hero-sub">
            AgenticStudio is the full-stack workspace for designing, testing, and deploying
            agentic AI features — for Claude, GPT-4, Gemini, and beyond.
          </p>
          <div className="as-hero-actions">
            <a href="#features" className="as-btn-primary">
              Explore features →
            </a>
            <a
              href="https://github.com/john3913/agenticstudio"
              target="_blank"
              rel="noopener"
              className="as-btn-secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Model strip */}
      <div className="as-models">
        <span className="as-models-label">Works with</span>
        <div className="as-model-chips">
          {MODELS.map((m) => (
            <div key={m.name} className="as-model-chip">
              <span className="as-model-dot" style={{ background: m.color }} />
              {m.name}
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="as-features" id="features">
        <div className="as-features-header">
          <div>
            <div className="as-section-label">Platform features</div>
            <h2 className="as-section-title">
              Everything you need to build production agents
            </h2>
          </div>
          <p className="as-section-body">
            From visual workflow design to live evals and cost monitoring —
            AgenticStudio covers the full development lifecycle so you ship
            reliable agentic systems, not prototypes.
          </p>
        </div>
        <div className="as-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.num} className="as-feature-card">
              <div className="as-feature-num">{f.num}</div>
              <h3 className="as-feature-title">{f.title}</h3>
              <p className="as-feature-desc">{f.desc}</p>
              <div className="as-feature-tags">
                {f.tags.map((t) => (
                  <span key={t} className="as-tag">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="as-steps" id="how">
        <div className="as-steps-inner">
          <div className="as-section-label">How it works</div>
          <h2 className="as-section-title">From idea to production in 5 steps</h2>
          <div className="as-steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="as-step">
                <div className="as-step-num">{s.num}</div>
                <div className="as-step-title">{s.title}</div>
                <div className="as-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models deep dive */}
      <section className="as-section" id="models">
        <div className="as-section-label">Supported models</div>
        <h2 className="as-section-title">Every frontier model. One workspace.</h2>
        <p className="as-section-body">
          AgenticStudio normalizes API differences across providers so you can
          swap models, compare outputs, and pick the best fit for each task —
          without rewriting your agent logic.
        </p>
        <div className="as-model-grid">
          {DEEP_MODELS.map((m) => (
            <div key={m.name} className="as-model-card">
              <div
                className="as-model-card-accent"
                style={{ background: m.accentColor }}
              />
              <div className="as-model-card-name">{m.name}</div>
              <div className="as-model-card-maker">{m.maker}</div>
              <ul className="as-model-card-features">
                {m.features.map((feat) => (
                  <li
                    key={feat}
                    style={
                      { '--dot-color': m.accentColor } as React.CSSProperties
                    }
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 4, height: 4,
                        borderRadius: '50%',
                        background: m.accentColor,
                        flexShrink: 0,
                      }}
                    />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="as-cta">
        <div className="as-cta-glow" />
        <div className="as-cta-inner">
          <h2 className="as-cta-title">
            Start building your first agent today
          </h2>
          <p className="as-cta-sub">
            Open source, free to use. Star the repo and follow along as
            AgenticStudio evolves — new features ship every week.
          </p>
          <div className="as-hero-actions">
            <a
              href="https://github.com/john3913/agenticstudio"
              target="_blank"
              rel="noopener"
              className="as-btn-primary"
            >
              Star on GitHub →
            </a>
            <Link href="/biodesign" className="as-btn-secondary">
              See other tools
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="as-footer">
        <span className="as-footer-copy">
          © 2026 AgenticStudio · Built on Ambient Intelligence
        </span>
        <div className="as-footer-links">
          <a href="https://github.com/john3913/agenticstudio" target="_blank" rel="noopener">GitHub</a>
          <a href="https://ambientprototype.vercel.app/biodesign">Biodesign</a>
          <a href="https://ambientprototype.vercel.app/digitalhealth">Digital Health</a>
        </div>
      </footer>
    </div>
  );
}
