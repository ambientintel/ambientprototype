import type { Metadata } from "next";
import { ArrowRight, CheckCircle, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Minnesota — Ambient Intelligence",
  description: "Rooted in Minnesota's world-class research institutions. Backed by the state's innovation ecosystem.",
  robots: { index: false, follow: false },
};

// ── Design tokens (matches globals.css dark theme / ellamemory dashboard) ────
const T = {
  bg:        "#1C2127",
  bg2:       "#111319",
  surf1:     "#252A31",
  surf2:     "#2F343C",
  surf3:     "#383E47",
  line:      "rgba(255,255,255,0.07)",
  lineStrg:  "rgba(255,255,255,0.14)",
  text:      "#F6F7F8",
  text2:     "rgba(246,247,248,0.65)",
  text3:     "rgba(246,247,248,0.42)",
  text4:     "rgba(246,247,248,0.26)",
  accent:    "#2D72D2",
  accentBg:  "rgba(45,114,210,0.15)",
  sage:      "#3DCC91",
  sageBg:    "rgba(61,204,145,0.12)",
  maroon:    "#7A0019",
  maroonBg:  "rgba(122,0,25,0.15)",
  gold:      "#FFCC33",
  goldBg:    "rgba(255,204,51,0.12)",
  mayo:      "#006BB6",
  mayoBg:    "rgba(0,107,182,0.15)",
  mnBlue:    "#003865",
  mnBlueBg:  "rgba(0,56,101,0.15)",
};

// ── SVG Logos ─────────────────────────────────────────────────────────────────

function UMNLogo({ size = 72 }: { size?: number }) {
  const h = Math.round(size * 0.82);
  return (
    <svg width={size} height={h} viewBox="0 0 100 82" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="University of Minnesota">
      {/* Classic Block M */}
      <path d="M0 82V0H19L50 50L81 0H100V82H81V26L50 70L19 26V82H0Z" fill="#7A0019"/>
    </svg>
  );
}

function MayoLogo({ size = 72 }: { size?: number }) {
  const w = Math.round(size * 1.5);
  return (
    <svg width={w} height={size} viewBox="0 0 150 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mayo Clinic">
      {/* Three shields — left */}
      <path d="M4 8H42V60Q23 80 4 94Z" fill="#006BB6" opacity="0.72"/>
      {/* Center shield (front) */}
      <path d="M46 2H104V65Q75 88 46 100Z" fill="#006BB6"/>
      {/* Right shield */}
      <path d="M108 8H146V60Q127 80 108 94Z" fill="#006BB6" opacity="0.72"/>
      {/* Cross on center shield */}
      <rect x="66" y="16" width="18" height="48" rx="4" fill="white"/>
      <rect x="52" y="30" width="46" height="18" rx="4" fill="white"/>
    </svg>
  );
}

function MNStateLogo({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="State of Minnesota">
      {/* Outer ring */}
      <circle cx="50" cy="50" r="47" stroke="#003865" strokeWidth="2" fill="rgba(0,56,101,0.08)"/>
      {/* Star of the North — 5-pointed */}
      <polygon points="50,10 58,36 86,36 63,52 72,78 50,62 28,78 37,52 14,36 42,36" fill="#003865"/>
      {/* Gold MN text */}
      <text x="50" y="57" textAnchor="middle" fontSize="13" fontWeight="900" fill="#FFCC33" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">MN</text>
    </svg>
  );
}

function Gener8torMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size * 2.2} height={size * 0.6} viewBox="0 0 220 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="gener8tor">
      <text x="0" y="46" fontSize="48" fontWeight="900" fill={T.text} fontFamily="Arial Black, Arial, sans-serif" letterSpacing="-1">
        gener
      </text>
      <text x="126" y="46" fontSize="48" fontWeight="900" fill={T.accent} fontFamily="Arial Black, Arial, sans-serif">
        8
      </text>
      <text x="152" y="46" fontSize="48" fontWeight="900" fill={T.text} fontFamily="Arial Black, Arial, sans-serif" letterSpacing="-1">
        tor
      </text>
    </svg>
  );
}

// ── Sparkline chart (reused from invest page pattern) ─────────────────────────

function SparkLine({ color }: { color: string }) {
  const pts = [30, 45, 38, 60, 52, 70, 65, 80, 72, 85, 78, 90, 82, 88, 95];
  const h = 48; const w = 300; const max = 100;
  const path = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill={`url(#sg-${color.replace("#","")})`}/>
      <polyline points={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MNPage() {
  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "var(--sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)" }} className="min-h-screen">

      {/* ── GLOBAL ANIMATION STYLES ── */}
      <style>{`
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(60px,-50px) scale(1.06)} 70%{transform:translate(-30px,30px) scale(0.96)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-60px,40px) scale(1.08)} 80%{transform:translate(40px,-25px) scale(0.94)} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(30px,55px) scale(1.05)} 65%{transform:translate(-40px,-30px) scale(0.97)} }
        .orb-a{animation:orb-a 22s ease-in-out infinite}
        .orb-b{animation:orb-b 28s ease-in-out infinite}
        .orb-c{animation:orb-c 19s ease-in-out infinite}
        @keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(61,204,145,0.7)} 70%{box-shadow:0 0 0 10px rgba(61,204,145,0)} 100%{box-shadow:0 0 0 0 rgba(61,204,145,0)} }
        .pulse-dot{animation:pulse-dot 2.4s ease-out infinite}
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up-1{animation:fade-up 0.8s ease-out 0.1s both}
        .fade-up-2{animation:fade-up 0.8s ease-out 0.25s both}
        .fade-up-3{animation:fade-up 0.8s ease-out 0.4s both}
        .fade-up-4{animation:fade-up 0.8s ease-out 0.55s both}
        @keyframes node-pulse { 0%,100%{r:4;opacity:0.6} 50%{r:6;opacity:1} }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${T.line}`, background: `${T.bg}ee`, backdropFilter: "blur(12px)" }} className="sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div style={{ background: T.accent }} className="flex h-8 w-8 items-center justify-center rounded-md">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/><circle cx="9" cy="9" r="3" fill="white"/></svg>
            </div>
            <span style={{ color: T.text }} className="text-base font-semibold tracking-tight">Ambient Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            {[["#partners","Partners"],["#patent","IP"],["#accelerator","gener8tor"],["#contact","Contact"]].map(([href, label]) => (
              <a key={href} href={href} style={{ color: T.text2 }} className="hidden text-base transition-opacity hover:opacity-60 sm:block">{label}</a>
            ))}
            <a href="#contact" style={{ background: T.accent, color: T.text }} className="rounded-full px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-85">
              Connect
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 py-28">
        {/* Dark aurora background */}
        <div style={{ background: `radial-gradient(ellipse at 15% 60%, rgba(122,0,25,0.22) 0%, transparent 50%), radial-gradient(ellipse at 82% 28%, rgba(0,107,182,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(255,204,51,0.08) 0%, transparent 50%), ${T.bg2}` }} className="absolute inset-0" />

        {/* Animated orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb-a absolute -left-40 top-0 h-[600px] w-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(122,0,25,0.20), transparent 65%)", filter: "blur(80px)" }}/>
          <div className="orb-b absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,107,182,0.20), transparent 65%)", filter: "blur(80px)" }}/>
          <div className="orb-c absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,204,51,0.08), transparent 65%)", filter: "blur(80px)" }}/>

          {/* Network SVG with traveling sparks */}
          <svg className="absolute h-full w-full" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <style>{`
                .nb{stroke:rgba(246,247,248,0.08);stroke-width:0.8;fill:none}
                .nd{fill:rgba(246,247,248,0.18)}
                .ns{fill:none;stroke:rgba(246,247,248,0.22);stroke-width:0.6;stroke-dasharray:8 6}
                .ns1{animation:sd1 5s linear infinite}
                .ns2{animation:sd2 7s linear infinite;animation-delay:-2s}
                .ns3{animation:sd3 4.5s linear infinite;animation-delay:-1s}
                .ns4{animation:sd4 6s linear infinite;animation-delay:-3s}
                .ns5{animation:sd5 5.5s linear infinite;animation-delay:-0.5s}
                .ns6{animation:sd6 8s linear infinite;animation-delay:-4s}
                .ns7{animation:sd7 4s linear infinite;animation-delay:-1.8s}
                .ns8{animation:sd8 6.5s linear infinite;animation-delay:-2.5s}
                @keyframes sd1{from{stroke-dashoffset:56}to{stroke-dashoffset:0}}
                @keyframes sd2{from{stroke-dashoffset:84}to{stroke-dashoffset:0}}
                @keyframes sd3{from{stroke-dashoffset:42}to{stroke-dashoffset:0}}
                @keyframes sd4{from{stroke-dashoffset:70}to{stroke-dashoffset:0}}
                @keyframes sd5{from{stroke-dashoffset:56}to{stroke-dashoffset:0}}
                @keyframes sd6{from{stroke-dashoffset:98}to{stroke-dashoffset:0}}
                @keyframes sd7{from{stroke-dashoffset:42}to{stroke-dashoffset:0}}
                @keyframes sd8{from{stroke-dashoffset:70}to{stroke-dashoffset:0}}
                .np{fill:none;stroke:rgba(246,247,248,0.10);stroke-width:0.8;animation:pr 4s ease-out infinite;transform-box:fill-box;transform-origin:center}
                .np2{animation-delay:-2s;animation-duration:5s}
                .np3{animation-delay:-1s;animation-duration:3.5s}
                @keyframes pr{0%{transform:scale(1);opacity:0.3}100%{transform:scale(6);opacity:0}}
              `}</style>
            </defs>
            {/* Backbone lines */}
            <line x1="160" y1="150" x2="480" y2="90"  className="nb"/>
            <line x1="160" y1="150" x2="340" y2="360" className="nb"/>
            <line x1="480" y1="90"  x2="720" y2="230" className="nb"/>
            <line x1="480" y1="90"  x2="860" y2="110" className="nb"/>
            <line x1="340" y1="360" x2="720" y2="230" className="nb"/>
            <line x1="720" y1="230" x2="860" y2="110" className="nb"/>
            <line x1="720" y1="230" x2="1040" y2="370" className="nb"/>
            <line x1="860" y1="110" x2="1180" y2="170" className="nb"/>
            <line x1="1040" y1="370" x2="1180" y2="170" className="nb"/>
            <line x1="1180" y1="170" x2="1380" y2="300" className="nb"/>
            {/* Traveling sparks */}
            <line x1="160" y1="150" x2="480" y2="90"  className="ns ns1"/>
            <line x1="480" y1="90"  x2="720" y2="230" className="ns ns2"/>
            <line x1="340" y1="360" x2="720" y2="230" className="ns ns3"/>
            <line x1="720" y1="230" x2="860" y2="110" className="ns ns4"/>
            <line x1="860" y1="110" x2="1180" y2="170" className="ns ns5"/>
            <line x1="720" y1="230" x2="1040" y2="370" className="ns ns6"/>
            <line x1="1040" y1="370" x2="1180" y2="170" className="ns ns7"/>
            <line x1="1180" y1="170" x2="1380" y2="300" className="ns ns8"/>
            {/* Nodes */}
            <circle cx="160"  cy="150" r="4"   className="nd"/>
            <circle cx="340"  cy="360" r="3.5" className="nd"/>
            <circle cx="480"  cy="90"  r="4"   className="nd"/>
            <circle cx="720"  cy="230" r="5"   className="nd"/>
            <circle cx="860"  cy="110" r="4"   className="nd"/>
            <circle cx="1040" cy="370" r="3.5" className="nd"/>
            <circle cx="1180" cy="170" r="4.5" className="nd"/>
            <circle cx="1380" cy="300" r="3.5" className="nd"/>
            {/* Pulse rings */}
            <circle cx="160"  cy="150" r="8" className="np"/>
            <circle cx="720"  cy="230" r="8" className="np np2"/>
            <circle cx="1180" cy="170" r="8" className="np np3"/>
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative mx-auto max-w-6xl">
          {/* Eyebrow */}
          <div className="fade-up-1 mb-6 inline-flex items-center gap-2.5 rounded-full px-4 py-2" style={{ border: `1px solid ${T.lineStrg}`, background: "rgba(246,247,248,0.05)" }}>
            <span className="pulse-dot inline-block h-2 w-2 rounded-full" style={{ background: T.sage }}/>
            <span style={{ color: T.text2, fontFamily: "var(--mono, monospace)" }} className="text-sm uppercase tracking-widest">Minnesota Ecosystem · Pilot Ready 2026</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-2 mb-6 max-w-4xl text-6xl font-bold leading-tight tracking-tight" style={{ color: T.text, fontFamily: "var(--serif, Georgia, serif)", fontWeight: 300 }}>
            Built in Minnesota.<br/>
            <em style={{ color: T.text2, fontStyle: "italic" }}>Backed by its greatest institutions.</em>
          </h1>

          {/* Subheadline */}
          <p className="fade-up-3 mb-10 max-w-3xl text-xl leading-relaxed" style={{ color: T.text2 }}>
            Ambient Intelligence is a Minnesota health technology company transforming how care facilities
            monitor patients — partnered with the University of Minnesota, Mayo Clinic, and the State of Minnesota
            to bring the future of care to life.
          </p>

          {/* Partner logo strip */}
          <div className="fade-up-4 mb-12 flex flex-wrap items-center gap-6">
            <span style={{ color: T.text4, fontFamily: "var(--mono, monospace)" }} className="text-xs uppercase tracking-widest">In partnership with</span>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100">
                <UMNLogo size={32}/>
                <span style={{ color: T.text2 }} className="text-sm font-semibold">University of Minnesota</span>
              </div>
              <div className="flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100">
                <MayoLogo size={28}/>
                <span style={{ color: T.text2 }} className="text-sm font-semibold">Mayo Clinic</span>
              </div>
              <div className="flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100">
                <MNStateLogo size={32}/>
                <span style={{ color: T.text2 }} className="text-sm font-semibold">State of Minnesota</span>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="fade-up-4 flex flex-wrap gap-4">
            <a href="#partners" style={{ background: T.accent, color: T.text }} className="flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold transition-opacity hover:opacity-85">
              Our Partnerships <ArrowRight className="h-5 w-5"/>
            </a>
            <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ border: `1px solid ${T.lineStrg}`, color: T.text2 }} className="flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold transition-colors hover:opacity-80">
              MN Partnership Info <ExternalLink className="h-4 w-4"/>
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: "PCT", label: "Patent Filed", sub: "UMN Office of Technology Commercialization" },
              { value: "2026", label: "Pilot Launch", sub: "Minneapolis, Minnesota" },
              { value: "3", label: "Institutional Partners", sub: "UMN · Mayo · State of MN" },
              { value: "#1", label: "Healthcare State", sub: "Mayo Clinic ranked #1 hospital" },
            ].map((s) => (
              <div key={s.value} style={{ border: `1px solid ${T.lineStrg}`, background: "rgba(246,247,248,0.04)" }} className="rounded-2xl px-5 py-5">
                <p className="text-4xl font-bold" style={{ color: T.text }}>{s.value}</p>
                <p className="mt-1 text-base font-semibold" style={{ color: T.text }}>{s.label}</p>
                <p className="mt-1 text-sm" style={{ color: T.text3 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section id="partners" style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-3xl">
            <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)" }} className="mb-4 text-xs uppercase tracking-widest">Institutional Partners</p>
            <h2 className="mb-5 text-5xl font-bold tracking-tight" style={{ color: T.text }}>World-class institutions,<br/>one shared mission.</h2>
            <p className="text-xl leading-relaxed" style={{ color: T.text2 }}>
              Minnesota is home to a unique concentration of health innovation. We've built deep, formal
              partnerships with the institutions that define it — creating a foundation no competitor can replicate.
            </p>
          </div>

          {/* Three partner cards */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* UMN Card */}
            <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderTop: `3px solid ${T.maroon}` }} className="rounded-2xl p-8">
              <div className="mb-6 flex items-start justify-between">
                <div style={{ background: "rgba(122,0,25,0.12)", border: `1px solid rgba(122,0,25,0.25)` }} className="rounded-xl p-4">
                  <UMNLogo size={56}/>
                </div>
                <span style={{ background: T.maroonBg, color: "#FF6B6B", border: "1px solid rgba(122,0,25,0.3)" }} className="rounded-full px-3 py-1 text-xs font-semibold">IP Partner</span>
              </div>
              <h3 className="mb-1 text-2xl font-bold" style={{ color: T.text }}>University of Minnesota</h3>
              <p className="mb-4 text-sm font-medium" style={{ color: T.text3 }}>Twin Cities · Research Partner</p>
              <p className="mb-6 text-lg leading-relaxed" style={{ color: T.text2 }}>
                Our core ambient sensing and AI pipeline technology is protected under a PCT patent filing
                managed through the <strong style={{ color: T.text }}>UMN Office of Technology Commercialization</strong> —
                one of the nation's leading university tech transfer programs.
              </p>
              <ul className="space-y-3">
                {[
                  "PCT patent co-filed & managed by UMN OTC",
                  "Research collaboration on ML inference",
                  "IRB protocol design support",
                  "Access to UMN clinical research network",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#FF6B6B" }}/>
                    <span className="text-base" style={{ color: T.text2 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mayo Clinic Card */}
            <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderTop: `3px solid ${T.mayo}` }} className="rounded-2xl p-8">
              <div className="mb-6 flex items-start justify-between">
                <div style={{ background: "rgba(0,107,182,0.12)", border: "1px solid rgba(0,107,182,0.25)" }} className="rounded-xl p-4">
                  <MayoLogo size={52}/>
                </div>
                <span style={{ background: T.mayoBg, color: "#5BB5F5", border: "1px solid rgba(0,107,182,0.3)" }} className="rounded-full px-3 py-1 text-xs font-semibold">Clinical Partner</span>
              </div>
              <h3 className="mb-1 text-2xl font-bold" style={{ color: T.text }}>Mayo Clinic</h3>
              <p className="mb-4 text-sm font-medium" style={{ color: T.text3 }}>Rochester, MN · Clinical Excellence</p>
              <p className="mb-6 text-lg leading-relaxed" style={{ color: T.text2 }}>
                The <strong style={{ color: T.text }}>world's #1 ranked hospital</strong> is in our backyard.
                Mayo Clinic's platform at{" "}
                <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ color: "#5BB5F5" }} className="underline underline-offset-2">
                  minnesotapartnership.info
                </a>{" "}
                connects Minnesota's leading research institutions to accelerate health innovation.
              </p>
              <ul className="space-y-3">
                {[
                  "Minnesota Partnership for Biotechnology",
                  "Access to world-class clinical validation",
                  "Collaborative health technology ecosystem",
                  "Research pathway to clinical deployment",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#5BB5F5" }}/>
                    <span className="text-base" style={{ color: T.text2 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* State of MN Card */}
            <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderTop: `3px solid ${T.mnBlue}` }} className="rounded-2xl p-8">
              <div className="mb-6 flex items-start justify-between">
                <div style={{ background: "rgba(0,56,101,0.15)", border: "1px solid rgba(0,56,101,0.3)" }} className="rounded-xl p-4">
                  <MNStateLogo size={56}/>
                </div>
                <span style={{ background: T.mnBlueBg, color: "#6BB8FF", border: "1px solid rgba(0,56,101,0.35)" }} className="rounded-full px-3 py-1 text-xs font-semibold">State Support</span>
              </div>
              <h3 className="mb-1 text-2xl font-bold" style={{ color: T.text }}>State of Minnesota</h3>
              <p className="mb-4 text-sm font-medium" style={{ color: T.text3 }}>Saint Paul, MN · Innovation Ecosystem</p>
              <p className="mb-6 text-lg leading-relaxed" style={{ color: T.text2 }}>
                Minnesota's commitment to health innovation and its <strong style={{ color: T.text }}>87-county care network</strong>{" "}
                creates the ideal launchpad for ambient care technology. The state actively supports
                health tech companies connecting to its extensive care infrastructure.
              </p>
              <ul className="space-y-3">
                {[
                  "Minnesota health tech innovation ecosystem",
                  "State-supported care facility network",
                  "Access to MN rural health programs",
                  "Legislative support for digital health",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#6BB8FF" }}/>
                    <span className="text-base" style={{ color: T.text2 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* MN Partnership link */}
          <div style={{ background: T.surf2, border: `1px solid ${T.lineStrg}` }} className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-semibold" style={{ color: T.text }}>Minnesota Partnership for Biotechnology and Medical Genomics</p>
              <p className="mt-1 text-base" style={{ color: T.text2 }}>The formal collaboration between University of Minnesota and Mayo Clinic — driving health research and innovation statewide.</p>
            </div>
            <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(45,114,210,0.3)`, whiteSpace: "nowrap" }} className="flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-opacity hover:opacity-80">
              minnesotapartnership.info <ExternalLink className="h-4 w-4"/>
            </a>
          </div>
        </div>
      </section>

      {/* ── PCT PATENT ── */}
      <section id="patent" style={{ borderBottom: `1px solid ${T.line}`, background: T.bg2 }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)" }} className="mb-4 text-xs uppercase tracking-widest">Intellectual Property</p>
              <h2 className="mb-5 text-5xl font-bold tracking-tight" style={{ color: T.text }}>PCT Patent Protected</h2>
              <p className="mb-8 text-xl leading-relaxed" style={{ color: T.text2 }}>
                Our core technology — the ambient sensing and machine learning pipeline that powers Ella Memory —
                is protected under an international <strong style={{ color: T.text }}>PCT (Patent Cooperation Treaty)</strong> filing.
                Filed and managed in partnership with the{" "}
                <strong style={{ color: T.text }}>University of Minnesota Office of Technology Commercialization</strong>,
                this establishes priority across PCT member nations worldwide.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Filing Type",          value: "PCT — Patent Cooperation Treaty" },
                  { label: "Partner Institution",   value: "University of Minnesota OTC" },
                  { label: "Technology Protected",  value: "Ambient ML sensing pipeline" },
                  { label: "Geographic Coverage",   value: "International — PCT member nations" },
                  { label: "OTC Ranking",           value: "Top-tier US university tech transfer" },
                ].map((row) => (
                  <div key={row.label} style={{ border: `1px solid ${T.lineStrg}`, background: "rgba(246,247,248,0.03)" }} className="flex items-center gap-4 rounded-xl px-5 py-4">
                    <span className="w-44 shrink-0 text-base" style={{ color: T.text3 }}>{row.label}</span>
                    <span className="text-base font-semibold" style={{ color: T.text }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* IP visual */}
            <div className="flex flex-col items-center">
              <div style={{ border: `1px solid ${T.lineStrg}`, background: T.surf1 }} className="w-full max-w-md rounded-3xl p-10 text-center">
                {/* Shield icon with UMN colors */}
                <div style={{ background: "rgba(122,0,25,0.12)", border: `2px solid rgba(122,0,25,0.3)` }} className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4L6 12V28C6 38 14 45 24 48C34 45 42 38 42 28V12L24 4Z" fill="#7A0019" opacity="0.8"/>
                    <path d="M24 4L6 12V28C6 38 14 45 24 48C34 45 42 38 42 28V12L24 4Z" stroke="rgba(122,0,25,0.5)" strokeWidth="1" fill="none"/>
                    <text x="24" y="32" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="Arial Black, Arial">PCT</text>
                  </svg>
                </div>
                <p className="mb-1 text-3xl font-bold" style={{ color: T.text }}>Internationally Protected</p>
                <p className="mb-6 text-lg" style={{ color: T.text2 }}>Patent Cooperation Treaty Filing</p>
                <div style={{ borderTop: `1px solid ${T.line}` }} className="my-6"/>
                <div style={{ background: T.maroonBg, border: "1px solid rgba(122,0,25,0.25)" }} className="rounded-xl p-5">
                  <div className="mb-4 flex justify-center">
                    <UMNLogo size={48}/>
                  </div>
                  <p className="text-base font-bold" style={{ color: T.text }}>University of Minnesota</p>
                  <p className="mt-1 text-base" style={{ color: T.text2 }}>Office of Technology Commercialization</p>
                  <p className="mt-2 text-sm" style={{ color: T.text3 }}>Technology Transfer Partner</p>
                </div>
                <p className="mt-6 text-sm leading-relaxed" style={{ color: T.text3 }}>
                  The UMN OTC has transferred more than $500M in technology to commercial partners.
                  It is among the most active university tech transfer programs in the nation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GENER8TOR ── */}
      <section id="accelerator" style={{ borderBottom: `1px solid ${T.line}` }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left: gener8tor visual */}
            <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}` }} className="rounded-3xl p-10">
              <div className="mb-8 flex items-start justify-between">
                <Gener8torMark size={36}/>
                <span style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(45,114,210,0.3)` }} className="rounded-full px-3 py-1 text-xs font-semibold">Accelerator</span>
              </div>
              <div style={{ borderTop: `1px solid ${T.line}` }} className="mb-8"/>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "Top 10", label: "US Accelerator Ranking" },
                  { value: "$1B+", label: "Follow-on Funding Raised" },
                  { value: "180+", label: "Portfolio Companies" },
                  { value: "22", label: "States Across the US" },
                ].map((m) => (
                  <div key={m.label} style={{ background: T.surf2, border: `1px solid ${T.line}` }} className="rounded-xl p-4">
                    <p className="text-3xl font-bold" style={{ color: T.text }}>{m.value}</p>
                    <p className="mt-1 text-sm" style={{ color: T.text2 }}>{m.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${T.line}` }} className="mt-8 pt-6">
                <div className="h-12 w-full">
                  <SparkLine color={T.accent}/>
                </div>
                <p className="mt-2 text-sm" style={{ color: T.text3, fontFamily: "var(--mono, monospace)" }}>Portfolio company valuation trajectory</p>
              </div>
            </div>

            {/* Right: content */}
            <div>
              <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)" }} className="mb-4 text-xs uppercase tracking-widest">Startup Accelerator</p>
              <h2 className="mb-5 text-5xl font-bold tracking-tight" style={{ color: T.text }}>Backed by gener8tor</h2>
              <p className="mb-6 text-xl leading-relaxed" style={{ color: T.text2 }}>
                Ambient Intelligence is supported by <strong style={{ color: T.text }}>gener8tor</strong>, one of America's
                top-ranked startup accelerators. Nationally recognized for its rigorous 12-week program,
                mentor network, and track record of building companies that go on to raise hundreds of millions
                in follow-on funding.
              </p>
              <p className="mb-8 text-xl leading-relaxed" style={{ color: T.text2 }}>
                Gener8tor's deep Midwest roots and its growing presence in Minnesota health technology make
                it a natural partner for Ambient Intelligence as we build toward our Summer 2026 pilot launch.
              </p>
              <ul className="space-y-4">
                {[
                  "12-week intensive accelerator program with dedicated mentorship",
                  "Curated investor network across healthcare and enterprise tech",
                  "Seed-stage capital and operational support",
                  "National cohort of 5–6 companies per program for deep focus",
                  "Access to $1B+ in follow-on investor relationships",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.sage }}/>
                    <span className="text-lg" style={{ color: T.text2 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="https://www.gener8tor.com/" target="_blank" rel="noopener noreferrer" style={{ border: `1px solid ${T.lineStrg}`, color: T.text2 }} className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-opacity hover:opacity-75">
                Learn about gener8tor <ExternalLink className="h-4 w-4"/>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ELLA MEMORY CALLOUT ── */}
      <section style={{ borderBottom: `1px solid ${T.line}`, background: T.bg2 }} className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}` }} className="rounded-3xl p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)" }} className="mb-4 text-xs uppercase tracking-widest">Flagship Product</p>
                <h2 className="mb-4 text-5xl font-bold tracking-tight" style={{ color: T.text }}>Ella Memory</h2>
                <p className="mb-8 text-xl leading-relaxed" style={{ color: T.text2 }}>
                  Our patient-facing intelligent care companion. Ella Memory continuously observes patient
                  behavior using ambient room sensors — no cameras, no wearables — and surfaces meaningful
                  patterns to care teams in real time.
                </p>
                <ul className="mb-8 space-y-4">
                  {[
                    "Ambient room sensors — completely passive monitoring",
                    "Nurse dashboard with live resident status and alerts",
                    "AI-powered behavioral trend analysis",
                    "Privacy by architecture — PHI never in transit",
                    "Mobile-ready for on-the-go care teams",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: T.sage }}/>
                      <span className="text-lg" style={{ color: T.text2 }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ background: T.accent, color: T.text }} className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold transition-opacity hover:opacity-85">
                  Visit ellamemory.com <ExternalLink className="h-4 w-4"/>
                </a>
              </div>

              {/* Live preview mockup */}
              <div className="space-y-4">
                <div style={{ background: T.surf2, border: `1px solid ${T.lineStrg}` }} className="rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-semibold" style={{ color: T.text }}>Resident Activity — Live</span>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: T.text3 }}>
                      <span className="pulse-dot inline-block h-2 w-2 rounded-full" style={{ background: T.sage }}/>
                      Active
                    </span>
                  </div>
                  <div className="h-16 w-full">
                    <SparkLine color={T.accent}/>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Avg Response", value: "< 2s" },
                    { label: "Uptime", value: "99.9%" },
                    { label: "Detection", value: "94%" },
                  ].map((m) => (
                    <div key={m.label} style={{ background: T.surf2, border: `1px solid ${T.line}` }} className="rounded-xl px-4 py-4 text-center">
                      <p className="text-2xl font-bold" style={{ color: T.text }}>{m.value}</p>
                      <p className="mt-1 text-sm" style={{ color: T.text3 }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.sageBg, border: `1px solid rgba(61,204,145,0.2)` }} className="rounded-xl px-5 py-4">
                  <p className="text-base font-semibold" style={{ color: T.sage }}>Minneapolis Pilot — Summer 2026</p>
                  <p className="mt-1 text-base" style={{ color: T.text2 }}>IRB-guided protocol. HIPAA-compliant data governance. Real care facilities. Real outcomes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="px-6 py-28">
        <div className="mx-auto max-w-4xl text-center">
          {/* Animated node cluster */}
          <div className="relative mx-auto mb-10 h-24 w-24">
            <div style={{ background: T.accentBg, border: `2px solid rgba(45,114,210,0.3)` }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="8" fill={T.accent}/>
                <circle cx="22" cy="22" r="14" stroke={T.accent} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4"/>
                <circle cx="22" cy="22" r="20" stroke={T.accent} strokeWidth="1" opacity="0.2"/>
              </svg>
            </div>
          </div>

          <h2 className="mb-5 text-5xl font-bold tracking-tight" style={{ color: T.text }}>
            Minnesota's moment in health tech is now.
          </h2>
          <p className="mb-10 text-xl leading-relaxed" style={{ color: T.text2 }}>
            We have the partnerships, the patent, the accelerator backing, and the team.
            If you're a care facility, researcher, investor, or partner who wants to be part
            of what's next for Minnesota health care — let's talk.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="mailto:bribradley@gmail.com" style={{ background: T.accent, color: T.text }} className="flex items-center gap-2 rounded-full px-10 py-4 text-lg font-semibold transition-opacity hover:opacity-85">
              Get in Touch <ArrowRight className="h-5 w-5"/>
            </a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ border: `1px solid ${T.lineStrg}`, color: T.text2 }} className="flex items-center gap-2 rounded-full px-10 py-4 text-lg font-semibold transition-opacity hover:opacity-75">
              Explore Ella Memory
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${T.line}` }} className="px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div style={{ background: T.accent }} className="flex h-6 w-6 items-center justify-center rounded-md">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.2"/><circle cx="7" cy="7" r="2.2" fill="white"/></svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: T.text }}>Ambient Intelligence</span>
            </div>
            <div className="hidden items-center gap-5 sm:flex">
              <UMNLogo size={20}/>
              <MayoLogo size={18}/>
              <MNStateLogo size={20}/>
            </div>
          </div>
          <p className="text-sm text-center" style={{ color: T.text3 }}>
            PCT patent filed with University of Minnesota OTC · Minneapolis pilot, Summer 2026 · gener8tor portfolio company
          </p>
          <div className="flex gap-5">
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ color: T.text3 }} className="text-sm transition-colors hover:opacity-100">ellamemory.com</a>
            <a href="/invest" style={{ color: T.text3 }} className="text-sm transition-colors hover:opacity-100">Investor Info</a>
            <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ color: T.text3 }} className="text-sm transition-colors hover:opacity-100">MN Partnership</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
