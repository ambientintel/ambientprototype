"use client";
import { useState, useRef } from "react";

type DeckType = "seed" | "series_a" | "series_b" | "product_demo" | "sales" | "partnership" | "investor_update" | "board";
type DeckStatus = "draft" | "ready" | "exported";

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  body: string[];
  type: "cover" | "problem" | "solution" | "market" | "traction" | "team" | "financials" | "ask" | "product" | "go_to_market" | "competition" | "appendix";
  accent?: string;
}

interface PitchDeck {
  id: string;
  title: string;
  company: string;
  type: DeckType;
  status: DeckStatus;
  created: string;
  updated: string;
  slides: Slide[];
  tagline?: string;
}

const DECK_META: Record<DeckType, { label: string; short: string; color: string; icon: string; desc: string }> = {
  seed:             { label: "Seed Round",        short: "Seed",      color: "#4C6EF5", icon: "◈", desc: "Early-stage fundraising deck" },
  series_a:         { label: "Series A",          short: "Series A",  color: "#12B886", icon: "◉", desc: "Growth-stage institutional raise" },
  series_b:         { label: "Series B",          short: "Series B",  color: "#F59F00", icon: "◎", desc: "Scale-stage expansion deck" },
  product_demo:     { label: "Product Demo",      short: "Demo",      color: "#2D72D2", icon: "▣", desc: "Feature showcase for prospects" },
  sales:            { label: "Sales Deck",        short: "Sales",     color: "#F76707", icon: "◆", desc: "Pipeline conversion deck" },
  partnership:      { label: "Partnership",       short: "Partner",   color: "#15AABF", icon: "◇", desc: "Strategic alliance proposal" },
  investor_update:  { label: "Investor Update",   short: "Update",    color: "#A9E34B", icon: "▲", desc: "Quarterly portfolio update" },
  board:            { label: "Board Deck",        short: "Board",     color: "#E64980", icon: "■", desc: "Governance and strategy review" },
};

const STATUS_META: Record<DeckStatus, { color: string; bg: string; label: string }> = {
  draft:    { color: "#9AA0A6", bg: "rgba(154,160,166,0.12)", label: "Draft" },
  ready:    { color: "#12B886", bg: "rgba(18,184,134,0.12)",  label: "Ready" },
  exported: { color: "#4C6EF5", bg: "rgba(76,110,245,0.12)", label: "Exported" },
};

function generateSlides(type: DeckType, company: string, tagline: string): Slide[] {
  const c = company || "Acme Corp";
  const t = tagline || "Redefining the industry";

  const coverSlide = (subtitle: string): Slide => ({
    id: "s-cover", title: c, subtitle, type: "cover",
    body: [t, new Date().getFullYear().toString()], accent: DECK_META[type].color,
  });

  const templates: Record<DeckType, Slide[]> = {
    seed: [
      coverSlide("Seed Round — Confidential"),
      { id: "s-problem", title: "The Problem", type: "problem", body: ["The market is fragmented and underserved.", "Current solutions are too expensive, too complex, or too slow.", "Customers are losing $[X]M annually to this gap."] },
      { id: "s-solution", title: "Our Solution", type: "solution", body: [`${c} is a [category] platform that [core value prop].`, "We eliminate friction by [key mechanism].", "Result: 10x faster, 80% cheaper, fully automated."] },
      { id: "s-market", title: "Market Opportunity", type: "market", body: ["TAM: $[X]B global addressable market.", "SAM: $[X]M immediately serviceable.", "SOM: $[X]M target in 24 months.", "Growing at [X]% CAGR driven by [trend]."] },
      { id: "s-product", title: "Product", type: "product", body: ["Core Module 1: [Feature A]", "Core Module 2: [Feature B]", "Core Module 3: [Feature C]", "Built on [tech stack]. SOC 2 Type II in progress."] },
      { id: "s-traction", title: "Traction", type: "traction", body: ["[X] customers in [X] months", "[X]% MoM revenue growth", "NPS: [X] | CAC: $[X] | LTV: $[X]", "Key design partners: [Name], [Name], [Name]"] },
      { id: "s-team", title: "Team", type: "team", body: ["CEO: [Name] — [X] yrs [domain], prev [Co]", "CTO: [Name] — [X] yrs [domain], prev [Co]", "Advisor: [Name] — [Title], [Co]", "Backed by [accelerator/angels]"] },
      { id: "s-ask", title: "The Ask", type: "ask", body: ["Raising $[X]M at $[X]M pre-money.", "Use of funds: 60% eng, 25% GTM, 15% ops.", "Milestone: [X] customers / $[X]M ARR in 18 months.", "Close date: [Month YYYY]"], accent: DECK_META[type].color },
    ],
    series_a: [
      coverSlide("Series A — $[X]M — Confidential"),
      { id: "s-problem", title: "The Problem We Solve", type: "problem", body: ["[Market segment] spends $[X]B on broken workflows.", "Incumbent tools weren't built for [specific shift].", "The cost: lost revenue, churn, compliance risk."] },
      { id: "s-solution", title: "The Platform", type: "solution", body: [`${c} is the operating system for [category].`, "Three pillars: Ingest · Analyze · Act.", "Deploys in [X] days. ROI positive in 30 days."] },
      { id: "s-market", title: "Market Sizing", type: "market", body: ["TAM: $[X]B", "SAM: $[X]M (enterprise segment)", "SOM: $[X]M (current pipeline + expansion)", "Category growing at [X]% CAGR"] },
      { id: "s-traction", title: "Momentum", type: "traction", body: ["ARR: $[X]M — [X]% YoY", "Customers: [X] enterprise, [X] mid-market", "Net Revenue Retention: [X]%", "Pipeline: $[X]M (3.5x coverage)"] },
      { id: "s-go_to_market", title: "Go-To-Market", type: "go_to_market", body: ["Motion: PLG → enterprise expansion", "Channels: direct, partner, marketplace", "ACV: $[X]K | Sales cycle: [X] weeks", "Key accounts: [Logo], [Logo], [Logo]"] },
      { id: "s-competition", title: "Competitive Landscape", type: "competition", body: ["Legacy: [Competitor A] — slow, expensive, on-prem", "Point solutions: [Competitor B] — narrow scope", `${c}: full-stack, AI-native, 10x ROI at half the cost`, "Moat: proprietary data, network effects, switching cost"] },
      { id: "s-financials", title: "Financials", type: "financials", body: ["FY[X] ARR: $[X]M | Burn: $[X]M | Runway: [X] mo", "FY[X+1] Plan: $[X]M ARR, [X]% gross margin", "Unit economics: CAC $[X]K | LTV $[X]K | Payback [X] mo", "Path to profitability: Q[X] [YYYY]"] },
      { id: "s-team", title: "Team", type: "team", body: ["[X] FTEs. Leadership avg [X] yrs enterprise SaaS.", "CEO · CTO · CPO · VP Sales · VP Eng", "Board: [Name] ([Fund]), [Name] ([Fund])", "Advisors: [Name], [Name]"] },
      { id: "s-ask", title: "The Round", type: "ask", body: ["Raising $[X]M Series A.", "Lead investor sought. $[X]M committed.", "Use: 50% S&M, 30% R&D, 20% G&A.", "Milestone: $[X]M ARR, [X] enterprise logos."], accent: DECK_META[type].color },
    ],
    series_b: [
      coverSlide("Series B — $[X]M — Confidential"),
      { id: "s-thesis", title: "Why Now", type: "problem", body: ["[Macro trend] is accelerating adoption.", `${c} is the category leader with [X]% market share.`, "This raise fuels international expansion + platform depth."] },
      { id: "s-traction", title: "Scale", type: "traction", body: ["ARR: $[X]M (+[X]% YoY)", "Customers: [X]+ in [X] countries", "NRR: [X]% | Gross Margin: [X]%", "Rule of 40: [X]"] },
      { id: "s-market", title: "Expanded Market", type: "market", body: ["Core market: $[X]B TAM", "Adjacent expansion: +$[X]B (platform play)", "International: [X]% of TAM untapped", "Category CAGR: [X]%"] },
      { id: "s-product", title: "Platform Evolution", type: "product", body: ["V1: [Core product]", "V2 (current): [Expanded platform]", "V3 (roadmap): [AI/API layer]", "Data flywheel: [X]M events/day"] },
      { id: "s-go_to_market", title: "GTM at Scale", type: "go_to_market", body: ["[X] AEs closing avg $[X]K ACV", "Partner ecosystem: [X] VARs, [X] SIs", "Land & expand: 3x avg expansion in 18 mo", "Entering: EMEA · APAC · LatAm"] },
      { id: "s-financials", title: "Unit Economics", type: "financials", body: ["CAC: $[X]K | LTV: $[X]K | LTV:CAC: [X]x", "Payback: [X] months", "Gross margin: [X]% | EBITDA margin: [X]%", "FCF positive by Q[X] [YYYY]"] },
      { id: "s-ask", title: "The Opportunity", type: "ask", body: ["Raising $[X]M Series B.", "Valuation: $[X]M post-money.", "Investors: [Existing], [New Lead TBD]", "Close: [Month YYYY]. SAFE → priced preferred."], accent: DECK_META[type].color },
    ],
    product_demo: [
      coverSlide("Product Overview"),
      { id: "s-problem", title: "What We Solve", type: "problem", body: ["Before [Product]: [pain state]", "Manual, error-prone, time-consuming.", "Your team deserves better tooling."] },
      { id: "s-product", title: "The Platform", type: "product", body: ["One unified interface.", "Real-time data. Zero configuration.", "Integrates with your existing stack in minutes."] },
      { id: "s-solution", title: "Core Workflows", type: "solution", body: ["Workflow 1: [Task A] — [benefit]", "Workflow 2: [Task B] — [benefit]", "Workflow 3: [Task C] — [benefit]"] },
      { id: "s-traction", title: "What Customers Say", type: "traction", body: ['"[Testimonial quote]" — [Name], [Title] at [Co]', "[X]% reduction in [metric]", "[X] hours saved per [user/week]", "Deployed at [Logo], [Logo], [Logo]"] },
      { id: "s-ask", title: "Get Started", type: "ask", body: ["Free trial: [X] days, no credit card.", "Onboarding: live session + dedicated CSM.", "Pricing: starts at $[X]/mo.", "Book a demo: [url]"], accent: DECK_META[type].color },
    ],
    sales: [
      coverSlide("Proposal — Confidential"),
      { id: "s-problem", title: "Your Challenges", type: "problem", body: ["[Customer Name] is facing:", "· [Pain point 1]", "· [Pain point 2]", "· [Pain point 3]"] },
      { id: "s-solution", title: "Our Approach", type: "solution", body: ["Phase 1: Discovery + audit (Week 1–2)", "Phase 2: Configuration + pilot (Week 3–6)", "Phase 3: Full rollout (Week 7–12)", "Dedicated implementation team included."] },
      { id: "s-product", title: "What You Get", type: "product", body: ["✓ [Feature / module A]", "✓ [Feature / module B]", "✓ [Feature / module C]", "✓ 24/7 enterprise support + SLA"] },
      { id: "s-traction", title: "Proof Points", type: "traction", body: ["[Similar company] reduced [metric] by [X]%", "[Similar company] achieved ROI in [X] months", "[X]+ enterprise customers trust us", "G2: [X]/5 | Gartner: [recognition]"] },
      { id: "s-financials", title: "Investment", type: "financials", body: ["Base: $[X]K/year (up to [X] seats)", "Enterprise: $[X]K/year (unlimited seats)", "Implementation: included", "ROI guarantee: [X]x in [X] months"] },
      { id: "s-ask", title: "Proposed Next Steps", type: "ask", body: ["1. Sign MSA — [Date]", "2. Kick-off call — [Date]", "3. Pilot launch — [Date]", "Questions? [name@company.com]"], accent: DECK_META[type].color },
    ],
    partnership: [
      coverSlide("Partnership Proposal"),
      { id: "s-problem", title: "The Opportunity", type: "problem", body: ["[Market gap] creates a joint opportunity.", "Neither party can address it alone.", "Together, we unlock $[X]M in new value."] },
      { id: "s-solution", title: "Partnership Model", type: "solution", body: ["Joint offering: [Product A] + [Product B]", "Revenue share: [X]% / [X]%", "Co-marketing: [channels]", "Integration depth: [API / OEM / reseller]"] },
      { id: "s-market", title: "Shared Market", type: "market", body: ["Combined customer base: [X]M users", "Overlap: [X]% of accounts", "Upsell potential: $[X]M ARR", "Target segment: [description]"] },
      { id: "s-traction", title: "Why Us", type: "traction", body: [`${c}: [X] customers, $[X]M ARR`, "[Partner]: [X] customers, [X]M users", "Cultural alignment: [shared values]", "Prior collaboration: [reference]"] },
      { id: "s-ask", title: "Proposed Terms", type: "ask", body: ["Pilot: [X] months, [X] joint accounts", "Revenue share: [structure]", "Integration timeline: [X] weeks", "Decision by: [Date]"], accent: DECK_META[type].color },
    ],
    investor_update: [
      coverSlide(`Q${Math.ceil((new Date().getMonth()+1)/3)} ${new Date().getFullYear()} Investor Update`),
      { id: "s-traction", title: "Highlights", type: "traction", body: ["ARR: $[X]M (+[X]% QoQ)", "[X] new logos | [X] expansions", "Key win: [customer / milestone]", "Product: [shipped feature/launch]"] },
      { id: "s-financials", title: "Financials", type: "financials", body: ["Revenue: $[X]M (vs $[X]M plan)", "Burn: $[X]M/mo | Runway: [X] mo", "Cash: $[X]M", "Gross margin: [X]%"] },
      { id: "s-go_to_market", title: "GTM Progress", type: "go_to_market", body: ["Pipeline: $[X]M (vs $[X]M last Q)", "Win rate: [X]% | ACV: $[X]K", "Churn: [X]% gross | NRR: [X]%", "Hiring: [X] open roles"] },
      { id: "s-product", title: "Product Roadmap", type: "product", body: ["Shipped: [Feature A], [Feature B]", "In progress: [Feature C]", "Q[X] target: [major milestone]", "Eng team: [X] FTEs"] },
      { id: "s-ask", title: "Asks & Intros", type: "ask", body: ["Intro ask 1: [Prospect/Partner]", "Intro ask 2: [Hire/Advisor]", "Feedback wanted on: [strategic decision]", "Next update: [Month YYYY]"], accent: DECK_META[type].color },
    ],
    board: [
      coverSlide(`Board Meeting — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`),
      { id: "s-traction", title: "Scorecard", type: "traction", body: ["ARR: $[X]M | Plan: $[X]M | [X]%", "Burn: $[X]M | Plan: $[X]M | [X]%", "Headcount: [X] | Plan: [X]", "Cash: $[X]M | Runway: [X] mo"] },
      { id: "s-financials", title: "Financial Review", type: "financials", body: ["P&L summary vs budget", "Revenue bridge: [waterfall]", "Gross margin trend: [X]% → [X]%", "FCF: $[X]M | EBITDA: $[X]M"] },
      { id: "s-go_to_market", title: "GTM Review", type: "go_to_market", body: ["New ARR: $[X]M | Churn: $[X]M", "Pipeline health: [X]x coverage", "CAC trend: $[X]K (+/- [X]%)", "Top deals: [Account], [Account]"] },
      { id: "s-product", title: "Product & Eng", type: "product", body: ["Shipped: [milestone]", "KPIs: [DAU / MAU / NPS]", "Reliability: [X]% uptime", "Next quarter priorities"] },
      { id: "s-ask", title: "Decisions Required", type: "ask", body: ["1. [Decision / vote item]", "2. [Budget approval]", "3. [Strategic direction]", "Next meeting: [Date]"], accent: DECK_META[type].color },
    ],
  };

  return templates[type];
}

const EMPTY_DECKS: PitchDeck[] = [];

const SLIDE_TYPE_COLOR: Record<string, string> = {
  cover: "#4C6EF5", problem: "#FF6B6B", solution: "#12B886", market: "#F59F00",
  traction: "#2D72D2", team: "#15AABF", financials: "#A9E34B", ask: "#E64980",
  product: "#748FFC", go_to_market: "#F76707", competition: "#FF8CC8", appendix: "#868E96",
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function deckId() { return "deck-" + Math.random().toString(36).slice(2, 9); }
function slideId() { return "s-" + Math.random().toString(36).slice(2, 9); }

export default function PitchDeckLab() {
  const [decks, setDecks] = useState<PitchDeck[]>(EMPTY_DECKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [rightTab, setRightTab] = useState<"generate" | "edit" | "export">("generate");
  const [genType, setGenType] = useState<DeckType>("seed");
  const [genCompany, setGenCompany] = useState("");
  const [genTagline, setGenTagline] = useState("");
  const [genTitle, setGenTitle] = useState("");
  const [filterType, setFilterType] = useState<"all" | DeckType>("all");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);

  const activeDeck = decks.find(d => d.id === activeId) ?? null;
  const activeSlide = activeDeck?.slides[activeSlideIdx] ?? null;

  const filteredDecks = decks.filter(d => filterType === "all" || d.type === filterType);

  function createDeck() {
    if (!genCompany.trim()) return;
    const now = new Date().toISOString();
    const deck: PitchDeck = {
      id: deckId(),
      title: genTitle || `${genCompany} — ${DECK_META[genType].label}`,
      company: genCompany,
      type: genType,
      status: "draft",
      created: now,
      updated: now,
      slides: generateSlides(genType, genCompany, genTagline),
      tagline: genTagline,
    };
    setDecks(prev => [deck, ...prev]);
    setActiveId(deck.id);
    setActiveSlideIdx(0);
    setRightTab("edit");
    setGenCompany("");
    setGenTagline("");
    setGenTitle("");
  }

  function deleteDeck(id: string) {
    setDecks(prev => prev.filter(d => d.id !== id));
    if (activeId === id) { setActiveId(null); setActiveSlideIdx(0); }
  }

  function updateSlideBody(deckId: string, slideIdx: number, lineIdx: number, value: string) {
    setDecks(prev => prev.map(d => {
      if (d.id !== deckId) return d;
      const slides = d.slides.map((s, si) => {
        if (si !== slideIdx) return s;
        const body = [...s.body];
        body[lineIdx] = value;
        return { ...s, body };
      });
      return { ...d, slides, updated: new Date().toISOString(), status: "draft" as DeckStatus };
    }));
  }

  function updateSlideTitle(deckId: string, slideIdx: number, value: string) {
    setDecks(prev => prev.map(d => {
      if (d.id !== deckId) return d;
      const slides = d.slides.map((s, si) => si !== slideIdx ? s : { ...s, title: value });
      return { ...d, slides, updated: new Date().toISOString() };
    }));
  }

  function updateDeckMeta(deckId: string, field: "title" | "company" | "tagline", value: string) {
    setDecks(prev => prev.map(d => d.id !== deckId ? d : { ...d, [field]: value, updated: new Date().toISOString() }));
  }

  function markReady(id: string) {
    setDecks(prev => prev.map(d => d.id !== id ? d : { ...d, status: "ready" }));
  }

  function exportMarkdown(deck: PitchDeck) {
    const lines: string[] = [`# ${deck.title}`, `**Type:** ${DECK_META[deck.type].label}`, `**Created:** ${formatDate(deck.created)}`, ""];
    deck.slides.forEach((s, i) => {
      lines.push(`---\n\n## Slide ${i + 1}: ${s.title}`);
      if (s.subtitle) lines.push(`*${s.subtitle}*`);
      lines.push("");
      s.body.forEach(b => lines.push(`- ${b}`));
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setDecks(prev => prev.map(d => d.id !== deck.id ? d : { ...d, status: "exported" }));
  }

  function exportJSON(deck: PitchDeck) {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportHTML(deck: PitchDeck) {
    const accentColor = DECK_META[deck.type].color;
    const slideHtml = deck.slides.map((s, i) => `
      <div class="slide" style="page-break-after: always;">
        <div class="slide-num">0${i + 1}</div>
        <h2 class="slide-title">${s.title}</h2>
        ${s.subtitle ? `<p class="slide-subtitle">${s.subtitle}</p>` : ""}
        <ul>${s.body.map(b => `<li>${b}</li>`).join("")}</ul>
      </div>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${deck.title}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#111;color:#f0f0f0;margin:0;padding:0;}
  .cover{background:${accentColor}22;padding:80px 64px;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;}
  h1{font-size:48px;font-weight:300;letter-spacing:-0.02em;color:#fff;margin:0 0 16px;}
  .tagline{font-size:20px;color:rgba(255,255,255,0.6);}
  .slide{padding:64px;min-height:600px;border-bottom:1px solid rgba(255,255,255,0.08);}
  .slide-num{font-family:monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${accentColor};margin-bottom:32px;}
  .slide-title{font-size:36px;font-weight:300;letter-spacing:-0.02em;margin:0 0 8px;color:#fff;}
  .slide-subtitle{font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 32px;}
  ul{list-style:none;padding:0;margin:0;}
  li{padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:16px;color:rgba(255,255,255,0.8);}
  li:before{content:"—";color:${accentColor};margin-right:12px;}
</style>
</head><body>
<div class="cover"><div><h1>${deck.company}</h1><p class="tagline">${deck.tagline || DECK_META[deck.type].label}</p></div></div>
${slideHtml}
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setDecks(prev => prev.map(d => d.id !== deck.id ? d : { ...d, status: "exported" }));
  }

  const accentColor = activeDeck ? DECK_META[activeDeck.type].color : "#2D72D2";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 300px", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sans)" }}>
      {/* LEFT: Deck Library */}
      <div style={{ borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", marginBottom: 10 }}>Pitch Deck Lab</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text)", letterSpacing: "-0.01em" }}>Deck Library</div>
        </div>

        {/* Filter */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(["all", ...Object.keys(DECK_META)] as ("all" | DeckType)[]).map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              style={{ padding: "3px 8px", borderRadius: 3, fontSize: 11, fontFamily: "var(--mono)",
                background: filterType === f ? (f === "all" ? "rgba(255,255,255,0.1)" : DECK_META[f as DeckType]?.color + "22") : "transparent",
                color: filterType === f ? (f === "all" ? "var(--text)" : DECK_META[f as DeckType]?.color) : "var(--text-3)",
                border: "1px solid " + (filterType === f ? (f === "all" ? "var(--line-strong)" : DECK_META[f as DeckType]?.color + "44") : "transparent"),
                cursor: "pointer", transition: "all 0.15s" }}>
              {f === "all" ? "All" : DECK_META[f as DeckType].short}
            </button>
          ))}
        </div>

        {/* Deck list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filteredDecks.length === 0 && (
            <div style={{ padding: "24px 18px", color: "var(--text-4)", fontSize: 12, fontFamily: "var(--mono)", textAlign: "center", lineHeight: 1.7 }}>
              No decks yet.<br />Generate one →
            </div>
          )}
          {filteredDecks.map(deck => {
            const meta = DECK_META[deck.type];
            const sMeta = STATUS_META[deck.status];
            const isActive = deck.id === activeId;
            return (
              <div key={deck.id} onClick={() => { setActiveId(deck.id); setActiveSlideIdx(0); setRightTab("edit"); }}
                style={{ padding: "10px 14px", cursor: "pointer", borderLeft: `2px solid ${isActive ? meta.color : "transparent"}`,
                  background: isActive ? meta.color + "0A" : "transparent", transition: "all 0.12s", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: meta.color }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 18 }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: meta.color, background: meta.color + "18", padding: "1px 5px", borderRadius: 2 }}>{meta.short}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: sMeta.color }}>{sMeta.label}</span>
                  <span style={{ fontSize: 10, color: "var(--text-4)", marginLeft: "auto" }}>{deck.slides.length}s</span>
                </div>
                {isActive && (
                  <button onClick={e => { e.stopPropagation(); deleteDeck(deck.id); }}
                    style={{ position: "absolute", top: 8, right: 10, fontSize: 11, color: "var(--text-4)", padding: "1px 4px", borderRadius: 2, cursor: "pointer", background: "transparent", border: "none" }}
                    title="Delete">✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: Slide Viewer */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--line)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, minHeight: 54 }}>
          {activeDeck ? (
            <>
              <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: accentColor, background: accentColor + "18", padding: "2px 7px", borderRadius: 3 }}>
                {DECK_META[activeDeck.type].icon} {DECK_META[activeDeck.type].short}
              </span>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, letterSpacing: "-0.01em" }}>{activeDeck.title}</span>
              <span style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "var(--mono)" }}>{activeDeck.slides.length} slides</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: STATUS_META[activeDeck.status].color, fontFamily: "var(--mono)" }}>
                {STATUS_META[activeDeck.status].label}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-4)", fontFamily: "var(--mono)" }}>No deck selected</span>
          )}
        </div>

        {/* Slide area */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 24px" }}>
          {!activeDeck && (
            <div style={{ marginTop: 80, textAlign: "center", color: "var(--text-4)" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Pitch Deck Lab</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>Generate a deck to get started</div>
            </div>
          )}
          {activeDeck && activeSlide && (
            <div ref={exportRef} style={{ width: "100%", maxWidth: 760 }}>
              {/* Slide card */}
              <div style={{
                background: activeSlide.type === "cover"
                  ? `linear-gradient(135deg, ${accentColor}18 0%, var(--surface-1) 60%)`
                  : "var(--surface-1)",
                border: `1px solid ${activeSlide.type === "cover" ? accentColor + "33" : "var(--line)"}`,
                borderRadius: 6,
                minHeight: 420,
                padding: "48px 52px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Corner decoration */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120,
                  background: `radial-gradient(circle at top right, ${accentColor}14 0%, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 20, right: 20, fontFamily: "var(--mono)", fontSize: 10,
                  color: "var(--text-4)", letterSpacing: "0.12em" }}>
                  {String(activeSlideIdx + 1).padStart(2, "0")} / {String(activeDeck.slides.length).padStart(2, "0")}
                </div>

                {/* Type badge */}
                <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 20, background: SLIDE_TYPE_COLOR[activeSlide.type] || accentColor, borderRadius: 2 }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em",
                    color: SLIDE_TYPE_COLOR[activeSlide.type] || accentColor }}>
                    {activeSlide.type.replace("_", " ")}
                  </span>
                </div>

                {/* Title */}
                <div style={{ marginBottom: activeSlide.subtitle ? 8 : 32 }}>
                  {rightTab === "edit" && activeDeck && activeSlideIdx !== undefined ? (
                    <input value={activeSlide.title} onChange={e => updateSlideTitle(activeDeck.id, activeSlideIdx, e.target.value)}
                      style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--line-strong)",
                        color: activeSlide.type === "cover" ? "var(--text)" : "var(--text)", fontSize: activeSlide.type === "cover" ? 36 : 28,
                        fontWeight: 300, letterSpacing: "-0.02em", fontFamily: "var(--serif)", width: "100%", outline: "none", padding: "2px 0" }} />
                  ) : (
                    <h2 style={{ fontSize: activeSlide.type === "cover" ? 36 : 28, fontWeight: 300, letterSpacing: "-0.02em",
                      margin: 0, fontFamily: "var(--serif)", color: "var(--text)" }}>{activeSlide.title}</h2>
                  )}
                </div>

                {activeSlide.subtitle && (
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 32, fontFamily: "var(--mono)", letterSpacing: "0.04em" }}>
                    {activeSlide.subtitle}
                  </div>
                )}

                {/* Body lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {activeSlide.body.map((line, li) => (
                    <div key={li} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0",
                      borderBottom: li < activeSlide.body.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: accentColor, marginTop: 8, flexShrink: 0 }} />
                      {rightTab === "edit" ? (
                        <input value={line} onChange={e => updateSlideBody(activeDeck.id, activeSlideIdx, li, e.target.value)}
                          style={{ background: "transparent", border: "none", color: "var(--text-2)", fontSize: 15,
                            fontFamily: "var(--sans)", width: "100%", outline: "none", lineHeight: 1.6 }} />
                      ) : (
                        <span style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6 }}>{line}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide navigator */}
              <div style={{ display: "flex", gap: 4, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
                {activeDeck.slides.map((s, i) => (
                  <button key={s.id} onClick={() => setActiveSlideIdx(i)}
                    style={{ flexShrink: 0, width: 88, height: 52, borderRadius: 4, border: `1px solid ${i === activeSlideIdx ? accentColor + "66" : "var(--line)"}`,
                      background: i === activeSlideIdx ? accentColor + "14" : "var(--surface-2)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start",
                      justifyContent: "flex-end", padding: "6px 8px", gap: 2, transition: "all 0.12s" }}>
                    <div style={{ width: 16, height: 2, background: SLIDE_TYPE_COLOR[s.type] || accentColor, borderRadius: 1 }} />
                    <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: i === activeSlideIdx ? "var(--text-2)" : "var(--text-4)",
                      textTransform: "uppercase", letterSpacing: "0.1em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                      {String(i + 1).padStart(2, "0")} {s.type.replace("_", " ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Controls */}
      <div style={{ borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>
        {/* Tab switcher */}
        <div style={{ borderBottom: "1px solid var(--line)", display: "flex" }}>
          {(["generate", "edit", "export"] as const).map(tab => (
            <button key={tab} onClick={() => setRightTab(tab)}
              style={{ flex: 1, padding: "13px 0", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase",
                letterSpacing: "0.12em", color: rightTab === tab ? "var(--text)" : "var(--text-4)",
                background: rightTab === tab ? "var(--surface-2)" : "transparent",
                borderBottom: rightTab === tab ? `2px solid ${accentColor}` : "2px solid transparent",
                border: "none", cursor: "pointer", transition: "all 0.12s" }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
          {/* GENERATE tab */}
          {rightTab === "generate" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 12 }}>Deck Type</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(Object.keys(DECK_META) as DeckType[]).map(t => (
                    <button key={t} onClick={() => setGenType(t)}
                      style={{ padding: "9px 12px", borderRadius: 4, border: `1px solid ${genType === t ? DECK_META[t].color + "55" : "var(--line)"}`,
                        background: genType === t ? DECK_META[t].color + "12" : "var(--surface-2)",
                        cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: DECK_META[t].color }}>{DECK_META[t].icon}</span>
                        <div>
                          <div style={{ fontSize: 12, color: genType === t ? "var(--text)" : "var(--text-2)", fontWeight: 500 }}>{DECK_META[t].label}</div>
                          <div style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--mono)" }}>{DECK_META[t].desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 8 }}>Company Name *</div>
                <input value={genCompany} onChange={e => setGenCompany(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createDeck()}
                  placeholder="Acme Corp"
                  style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4,
                    color: "var(--text)", fontSize: 13, padding: "8px 10px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 8 }}>Tagline</div>
                <input value={genTagline} onChange={e => setGenTagline(e.target.value)}
                  placeholder="Redefining the industry"
                  style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4,
                    color: "var(--text)", fontSize: 13, padding: "8px 10px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 8 }}>Deck Title (optional)</div>
                <input value={genTitle} onChange={e => setGenTitle(e.target.value)}
                  placeholder={genCompany ? `${genCompany} — ${DECK_META[genType].label}` : "Auto-generated"}
                  style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4,
                    color: "var(--text)", fontSize: 13, padding: "8px 10px", outline: "none", boxSizing: "border-box" }} />
              </div>

              <button onClick={createDeck} disabled={!genCompany.trim()}
                style={{ padding: "11px 0", borderRadius: 4, border: "none",
                  background: genCompany.trim() ? `linear-gradient(135deg, ${DECK_META[genType].color} 0%, ${DECK_META[genType].color}CC 100%)` : "var(--surface-3)",
                  color: genCompany.trim() ? "#fff" : "var(--text-4)", fontFamily: "var(--mono)", fontSize: 11,
                  textTransform: "uppercase", letterSpacing: "0.14em", cursor: genCompany.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.15s", fontWeight: 500 }}>
                Generate Deck
              </button>

              {/* Stats */}
              {decks.length > 0 && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 4 }}>Library</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>Total decks</span>
                    <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--mono)" }}>{decks.length}</span>
                  </div>
                  {(["draft", "ready", "exported"] as DeckStatus[]).map(st => (
                    <div key={st} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: STATUS_META[st].color, fontFamily: "var(--mono)" }}>{STATUS_META[st].label}</span>
                      <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--mono)" }}>{decks.filter(d => d.status === st).length}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EDIT tab */}
          {rightTab === "edit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!activeDeck ? (
                <div style={{ color: "var(--text-4)", fontSize: 12, fontFamily: "var(--mono)", textAlign: "center", marginTop: 40 }}>
                  Select a deck to edit
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 6 }}>Deck Title</div>
                    <input value={activeDeck.title} onChange={e => updateDeckMeta(activeDeck.id, "title", e.target.value)}
                      style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4,
                        color: "var(--text)", fontSize: 13, padding: "8px 10px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 6 }}>Company</div>
                    <input value={activeDeck.company} onChange={e => updateDeckMeta(activeDeck.id, "company", e.target.value)}
                      style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 4,
                        color: "var(--text)", fontSize: 13, padding: "8px 10px", outline: "none", boxSizing: "border-box" }} />
                  </div>

                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 10 }}>
                      Slide {activeSlideIdx + 1} — {activeSlide?.type.replace("_", " ")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
                      Click any text on the slide to edit inline. Use the slide navigator to switch slides.
                    </div>
                  </div>

                  {/* Slide list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {activeDeck.slides.map((s, i) => (
                      <button key={s.id} onClick={() => setActiveSlideIdx(i)}
                        style={{ padding: "8px 10px", borderRadius: 4, border: `1px solid ${i === activeSlideIdx ? accentColor + "44" : "var(--line)"}`,
                          background: i === activeSlideIdx ? accentColor + "10" : "var(--surface-2)",
                          cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 3, height: 14, background: SLIDE_TYPE_COLOR[s.type] || accentColor, borderRadius: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-4)", width: 16 }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ fontSize: 12, color: i === activeSlideIdx ? "var(--text)" : "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                      </button>
                    ))}
                  </div>

                  <button onClick={() => markReady(activeDeck.id)}
                    style={{ padding: "10px 0", borderRadius: 4, border: `1px solid ${accentColor}44`,
                      background: accentColor + "14", color: accentColor, fontFamily: "var(--mono)", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.14em", cursor: "pointer" }}>
                    Mark as Ready
                  </button>
                </>
              )}
            </div>
          )}

          {/* EXPORT tab */}
          {rightTab === "export" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {!activeDeck ? (
                <div style={{ color: "var(--text-4)", fontSize: 12, fontFamily: "var(--mono)", textAlign: "center", marginTop: 40 }}>
                  Select a deck to export
                </div>
              ) : (
                <>
                  <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: 4, border: "1px solid var(--line)", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, marginBottom: 4 }}>{activeDeck.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                      {activeDeck.slides.length} slides · {DECK_META[activeDeck.type].label}
                    </div>
                  </div>

                  {[
                    { label: "Export Markdown", desc: ".md — universal, version-control friendly", fn: () => exportMarkdown(activeDeck), color: "#4C6EF5" },
                    { label: "Export HTML", desc: ".html — styled, print-ready, shareable", fn: () => exportHTML(activeDeck), color: "#12B886" },
                    { label: "Export JSON", desc: ".json — structured data, re-importable", fn: () => exportJSON(activeDeck), color: "#F59F00" },
                  ].map(({ label, desc, fn, color }) => (
                    <button key={label} onClick={fn}
                      style={{ padding: "12px 14px", borderRadius: 4, border: `1px solid ${color}33`,
                        background: color + "0A", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}>
                      <div style={{ fontSize: 12, color: color, fontFamily: "var(--mono)", fontWeight: 500, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-4)" }}>{desc}</div>
                    </button>
                  ))}

                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 4 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 8 }}>All Decks</div>
                    <button onClick={() => {
                      const blob = new Blob([JSON.stringify(decks, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = "pitch_decks_library.json"; a.click(); URL.revokeObjectURL(url);
                    }} style={{ width: "100%", padding: "10px 0", borderRadius: 4, border: "1px solid var(--line)",
                      background: "var(--surface-2)", color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
                      Export Full Library
                    </button>
                  </div>

                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 8 }}>Slide Outline</div>
                    {activeDeck.slides.map((s, i) => (
                      <div key={s.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--line)", display: "flex", gap: 10 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", width: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-2)" }}>{s.title}</div>
                          <div style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--mono)" }}>{s.type.replace("_", " ")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
