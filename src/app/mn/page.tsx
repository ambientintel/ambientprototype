'use client';

// ── Design tokens (matches globals.css dark theme / ellamemory dashboard) ────
const T = {
  bg:       "#1C2127",
  bg2:      "#111319",
  surf1:    "#252A31",
  surf2:    "#2F343C",
  line:     "rgba(255,255,255,0.07)",
  lineStrg: "rgba(255,255,255,0.14)",
  text:     "#F6F7F8",
  text2:    "rgba(246,247,248,0.65)",
  text3:    "rgba(246,247,248,0.42)",
  text4:    "rgba(246,247,248,0.26)",
  accent:   "#2D72D2",
  accentBg: "rgba(45,114,210,0.15)",
  sage:     "#3DCC91",
  sageBg:   "rgba(61,204,145,0.12)",
  maroon:   "#7A0019",
  maroonBg: "rgba(122,0,25,0.15)",
  mayo:     "#006BB6",
  mayoBg:   "rgba(0,107,182,0.15)",
  mnBlue:   "#003865",
  mnBlueBg: "rgba(0,56,101,0.15)",
};

// ── Inline icon SVGs ──────────────────────────────────────────────────────────

function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function IconCheck({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

// ── SVG Partner Logos ─────────────────────────────────────────────────────────

function UMNLogo({ size = 72 }: { size?: number }) {
  const h = Math.round(size * 0.82);
  return (
    <svg width={size} height={h} viewBox="0 0 100 82" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="University of Minnesota">
      <path d="M0 82V0H19L50 50L81 0H100V82H81V26L50 70L19 26V82H0Z" fill="#7A0019"/>
    </svg>
  );
}

function MayoLogo({ size = 72 }: { size?: number }) {
  const w = Math.round(size * 1.5);
  return (
    <svg width={w} height={size} viewBox="0 0 150 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mayo Clinic">
      <path d="M4 8H42V60Q23 80 4 94Z" fill="#006BB6" opacity="0.72"/>
      <path d="M46 2H104V65Q75 88 46 100Z" fill="#006BB6"/>
      <path d="M108 8H146V60Q127 80 108 94Z" fill="#006BB6" opacity="0.72"/>
      <rect x="66" y="16" width="18" height="48" rx="4" fill="white"/>
      <rect x="52" y="30" width="46" height="18" rx="4" fill="white"/>
    </svg>
  );
}

function MNStateLogo({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="State of Minnesota">
      <circle cx="50" cy="50" r="47" stroke="#003865" strokeWidth="2" fill="rgba(0,56,101,0.08)"/>
      <polygon points="50,10 58,36 86,36 63,52 72,78 50,62 28,78 37,52 14,36 42,36" fill="#003865"/>
      <text x="50" y="57" textAnchor="middle" fontSize="13" fontWeight="900" fill="#FFCC33" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">MN</text>
    </svg>
  );
}

function Gener8torMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size * 2.2} height={size * 0.6} viewBox="0 0 220 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="gener8tor">
      <text x="0"   y="46" fontSize="48" fontWeight="900" fill={T.text}   fontFamily="Arial Black, Arial, sans-serif" letterSpacing="-1">gener</text>
      <text x="126" y="46" fontSize="48" fontWeight="900" fill={T.accent} fontFamily="Arial Black, Arial, sans-serif">8</text>
      <text x="152" y="46" fontSize="48" fontWeight="900" fill={T.text}   fontFamily="Arial Black, Arial, sans-serif" letterSpacing="-1">tor</text>
    </svg>
  );
}

function SparkLine({ color }: { color: string }) {
  const pts = [30, 45, 38, 60, 52, 70, 65, 80, 72, 85, 78, 90, 82, 88, 95];
  const h = 48; const w = 300; const max = 100;
  const path = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const uid = color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: "100%", width: "100%" }}>
      <defs>
        <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill={`url(#sg${uid})`}/>
      <polyline points={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MNPage() {
  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "var(--sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)", minHeight: "100vh" }}>

      <style>{`
        @keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(60px,-50px) scale(1.06)} 70%{transform:translate(-30px,30px) scale(0.96)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-60px,40px) scale(1.08)} 80%{transform:translate(40px,-25px) scale(0.94)} }
        @keyframes orb-c { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(30px,55px) scale(1.05)} 65%{transform:translate(-40px,-30px) scale(0.97)} }
        .mn-orb-a { animation: orb-a 22s ease-in-out infinite; }
        .mn-orb-b { animation: orb-b 28s ease-in-out infinite; }
        .mn-orb-c { animation: orb-c 19s ease-in-out infinite; }
        @keyframes mn-pulse { 0%{box-shadow:0 0 0 0 rgba(61,204,145,0.7)} 70%{box-shadow:0 0 0 10px rgba(61,204,145,0)} 100%{box-shadow:0 0 0 0 rgba(61,204,145,0)} }
        .mn-pulse { animation: mn-pulse 2.4s ease-out infinite; }
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
        .mnp{fill:none;stroke:rgba(246,247,248,0.10);stroke-width:0.8;animation:mnpr 4s ease-out infinite;transform-box:fill-box;transform-origin:center}
        .mnp2{animation-delay:-2s;animation-duration:5s}
        .mnp3{animation-delay:-1s;animation-duration:3.5s}
        @keyframes mnpr{0%{transform:scale(1);opacity:0.3}100%{transform:scale(6);opacity:0}}
        .mn-card { transition: border-color 0.2s ease; }
        .mn-card:hover { border-color: rgba(255,255,255,0.22) !important; }
        .mn-link:hover { opacity: 0.75; }
        .mn-nav-link { color: rgba(246,247,248,0.55); text-decoration: none; font-size: 16px; transition: color 0.15s; }
        .mn-nav-link:hover { color: #F6F7F8; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${T.line}`, background: `${T.bg}ee`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: T.accent, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.5"/><circle cx="9" cy="9" r="3" fill="white"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>Ambient Intelligence</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#partners"    className="mn-nav-link">Partners</a>
            <a href="#patent"      className="mn-nav-link">IP</a>
            <a href="#accelerator" className="mn-nav-link">gener8tor</a>
            <a href="#contact" style={{ background: T.accent, color: T.text, borderRadius: 999, padding: "8px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Connect</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "96px 24px 80px" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 15% 60%, rgba(122,0,25,0.22) 0%, transparent 50%), radial-gradient(ellipse at 82% 28%, rgba(0,107,182,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(255,204,51,0.07) 0%, transparent 50%), ${T.bg2}` }}/>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div className="mn-orb-a" style={{ position: "absolute", left: -160, top: -40, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,0,25,0.20), transparent 65%)", filter: "blur(80px)" }}/>
          <div className="mn-orb-b" style={{ position: "absolute", bottom: -40, right: -40, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,107,182,0.20), transparent 65%)", filter: "blur(80px)" }}/>
          <div className="mn-orb-c" style={{ position: "absolute", left: "40%", top: "30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,204,51,0.07), transparent 65%)", filter: "blur(80px)" }}/>
          <svg style={{ position: "absolute", width: "100%", height: "100%" }} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice">
            <style>{`
              .nb2{stroke:rgba(246,247,248,0.07);stroke-width:0.8;fill:none}
              .nss{fill:none;stroke:rgba(246,247,248,0.20);stroke-width:0.7;stroke-dasharray:8 6}
              .nd2{fill:rgba(246,247,248,0.16)}
            `}</style>
            <line x1="160" y1="150" x2="480" y2="90"  className="nb2"/><line x1="160" y1="150" x2="340" y2="360" className="nb2"/>
            <line x1="480" y1="90"  x2="720" y2="230" className="nb2"/><line x1="480" y1="90"  x2="860" y2="110" className="nb2"/>
            <line x1="340" y1="360" x2="720" y2="230" className="nb2"/><line x1="720" y1="230" x2="860" y2="110" className="nb2"/>
            <line x1="720" y1="230" x2="1040" y2="370" className="nb2"/><line x1="860" y1="110" x2="1180" y2="170" className="nb2"/>
            <line x1="1040" y1="370" x2="1180" y2="170" className="nb2"/><line x1="1180" y1="170" x2="1380" y2="300" className="nb2"/>
            <line x1="160" y1="150" x2="480" y2="90"  className={`nss ns1`}/><line x1="480" y1="90"  x2="720" y2="230" className={`nss ns2`}/>
            <line x1="340" y1="360" x2="720" y2="230" className={`nss ns3`}/><line x1="720" y1="230" x2="860" y2="110" className={`nss ns4`}/>
            <line x1="860" y1="110" x2="1180" y2="170" className={`nss ns5`}/><line x1="720" y1="230" x2="1040" y2="370" className={`nss ns6`}/>
            <line x1="1040" y1="370" x2="1180" y2="170" className={`nss ns7`}/><line x1="1180" y1="170" x2="1380" y2="300" className={`nss ns8`}/>
            <circle cx="160"  cy="150" r="4"   className="nd2"/><circle cx="340"  cy="360" r="3.5" className="nd2"/>
            <circle cx="480"  cy="90"  r="4"   className="nd2"/><circle cx="720"  cy="230" r="5"   className="nd2"/>
            <circle cx="860"  cy="110" r="4"   className="nd2"/><circle cx="1040" cy="370" r="3.5" className="nd2"/>
            <circle cx="1180" cy="170" r="4.5" className="nd2"/><circle cx="1380" cy="300" r="3.5" className="nd2"/>
            <circle cx="160"  cy="150" r="8" className="mnp"/><circle cx="720" cy="230" r="8" className="mnp mnp2"/><circle cx="1180" cy="170" r="8" className="mnp mnp3"/>
          </svg>
        </div>

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 999, border: `1px solid ${T.lineStrg}`, background: "rgba(246,247,248,0.05)", padding: "8px 16px", marginBottom: 28 }}>
            <span className="mn-pulse" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: T.sage, flexShrink: 0 }}/>
            <span style={{ color: T.text2, fontFamily: "var(--mono, monospace)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Minnesota Ecosystem · Pilot Ready 2026</span>
          </div>

          <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 300, lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 24px", fontFamily: "var(--serif, Georgia, serif)", maxWidth: 860 }}>
            Built in Minnesota.<br/>
            <em style={{ color: T.text2, fontStyle: "italic" }}>Backed by its greatest institutions.</em>
          </h1>

          <p style={{ fontSize: 20, lineHeight: 1.65, color: T.text2, marginBottom: 36, maxWidth: 720 }}>
            Ambient Intelligence is a Minnesota health technology company transforming how care facilities
            monitor patients — partnered with the University of Minnesota, Mayo Clinic, and the State of Minnesota
            to bring the future of care to life.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20, marginBottom: 40 }}>
            <span style={{ color: T.text4, fontFamily: "var(--mono, monospace)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em" }}>In partnership with</span>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32 }}>
              {([
                { logo: <UMNLogo size={28}/>, name: "University of Minnesota" },
                { logo: <MayoLogo size={24}/>, name: "Mayo Clinic" },
                { logo: <MNStateLogo size={28}/>, name: "State of Minnesota" },
              ] as const).map(({ logo, name }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
                  {logo}
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.text2 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 56 }}>
            <a href="#partners" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.accent, color: T.text, borderRadius: 999, padding: "14px 28px", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
              Our Partnerships <IconArrow/>
            </a>
            <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.lineStrg}`, color: T.text2, borderRadius: 999, padding: "14px 28px", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
              MN Partnership Info <IconExternal/>
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { value: "PCT",  label: "Patent Filed",           sub: "UMN Office of Technology Commercialization" },
              { value: "2026", label: "Pilot Launch",           sub: "Minneapolis, Minnesota" },
              { value: "3",    label: "Institutional Partners", sub: "UMN · Mayo · State of MN" },
              { value: "#1",   label: "Ranked Hospital",        sub: "Mayo Clinic — US News & World Report" },
            ].map((s) => (
              <div key={s.value} style={{ border: `1px solid ${T.lineStrg}`, background: "rgba(246,247,248,0.04)", borderRadius: 16, padding: "20px 22px" }}>
                <p style={{ fontSize: 40, fontWeight: 700, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</p>
                <p style={{ fontSize: 16, fontWeight: 600, margin: "6px 0 4px" }}>{s.label}</p>
                <p style={{ fontSize: 13, margin: 0, color: T.text3 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section id="partners" style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 720, marginBottom: 56 }}>
            <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>Institutional Partners</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 18px" }}>
              World-class institutions,<br/>one shared mission.
            </h2>
            <p style={{ fontSize: 19, lineHeight: 1.65, color: T.text2, margin: 0 }}>
              Minnesota is home to a unique concentration of health innovation. We have built deep partnerships
              with the institutions that define it — creating a foundation no competitor can replicate.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {/* UMN */}
            <div className="mn-card" style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderTop: `3px solid ${T.maroon}`, borderRadius: 20, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ background: "rgba(122,0,25,0.12)", border: "1px solid rgba(122,0,25,0.25)", borderRadius: 14, padding: 16 }}>
                  <UMNLogo size={52}/>
                </div>
                <span style={{ background: T.maroonBg, color: "#FF8888", border: "1px solid rgba(122,0,25,0.3)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>IP Partner</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>University of Minnesota</h3>
              <p style={{ fontSize: 14, color: T.text3, margin: "0 0 18px" }}>Twin Cities · Research Partner</p>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: T.text2, margin: "0 0 22px" }}>
                Our core ambient sensing and AI pipeline is protected under a PCT patent filing managed through
                the <strong style={{ color: T.text }}>UMN Office of Technology Commercialization</strong> —
                one of the nation&apos;s leading university tech transfer programs.
              </p>
              {["PCT patent co-filed & managed by UMN OTC","Research collaboration on ML inference","IRB protocol design support","Access to UMN clinical research network"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <IconCheck color="#FF8888"/><span style={{ fontSize: 16, color: T.text2 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Mayo */}
            <div className="mn-card" style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderTop: `3px solid ${T.mayo}`, borderRadius: 20, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ background: "rgba(0,107,182,0.12)", border: "1px solid rgba(0,107,182,0.25)", borderRadius: 14, padding: 16 }}>
                  <MayoLogo size={48}/>
                </div>
                <span style={{ background: T.mayoBg, color: "#6BC4FF", border: "1px solid rgba(0,107,182,0.3)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>Clinical Partner</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Mayo Clinic</h3>
              <p style={{ fontSize: 14, color: T.text3, margin: "0 0 18px" }}>Rochester, MN · Clinical Excellence</p>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: T.text2, margin: "0 0 22px" }}>
                The <strong style={{ color: T.text }}>world&apos;s #1 ranked hospital</strong> is in our backyard.
                Mayo Clinic&apos;s collaboration platform at{" "}
                <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ color: "#6BC4FF", textDecoration: "underline" }}>minnesotapartnership.info</a>{" "}
                connects Minnesota&apos;s leading research institutions to accelerate health innovation.
              </p>
              {["Minnesota Partnership for Biotechnology","Access to world-class clinical validation","Collaborative health technology ecosystem","Research pathway to clinical deployment"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <IconCheck color="#6BC4FF"/><span style={{ fontSize: 16, color: T.text2 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* State of MN */}
            <div className="mn-card" style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderTop: `3px solid ${T.mnBlue}`, borderRadius: 20, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ background: "rgba(0,56,101,0.15)", border: "1px solid rgba(0,56,101,0.3)", borderRadius: 14, padding: 16 }}>
                  <MNStateLogo size={52}/>
                </div>
                <span style={{ background: T.mnBlueBg, color: "#7BC8FF", border: "1px solid rgba(0,56,101,0.35)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>State Support</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>State of Minnesota</h3>
              <p style={{ fontSize: 14, color: T.text3, margin: "0 0 18px" }}>Saint Paul, MN · Innovation Ecosystem</p>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: T.text2, margin: "0 0 22px" }}>
                Minnesota&apos;s commitment to health innovation and its <strong style={{ color: T.text }}>87-county care network</strong>{" "}
                creates the ideal launchpad for ambient care technology. The state actively supports health tech
                companies connecting to its extensive care infrastructure.
              </p>
              {["Minnesota health tech innovation ecosystem","State-supported care facility network","Access to MN rural health programs","Legislative support for digital health"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <IconCheck color="#7BC8FF"/><span style={{ fontSize: 16, color: T.text2 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.surf2, border: `1px solid ${T.lineStrg}`, borderRadius: 16, padding: "22px 28px", marginTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>Minnesota Partnership for Biotechnology and Medical Genomics</p>
              <p style={{ fontSize: 16, color: T.text2, margin: 0 }}>The formal collaboration between University of Minnesota and Mayo Clinic — driving health research statewide.</p>
            </div>
            <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" className="mn-link" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.accentBg, color: T.accent, border: `1px solid rgba(45,114,210,0.3)`, borderRadius: 999, padding: "12px 22px", fontSize: 15, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
              minnesotapartnership.info <IconExternal/>
            </a>
          </div>
        </div>
      </section>

      {/* ── PCT PATENT ── */}
      <section id="patent" style={{ borderBottom: `1px solid ${T.line}`, background: T.bg2, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 56, alignItems: "center" }}>
          <div>
            <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>Intellectual Property</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 20px" }}>PCT Patent Protected</h2>
            <p style={{ fontSize: 19, lineHeight: 1.65, color: T.text2, marginBottom: 28 }}>
              Our core technology — the ambient sensing and machine learning pipeline powering Ella Memory —
              is protected under an international <strong style={{ color: T.text }}>PCT (Patent Cooperation Treaty)</strong> filing,
              managed with the <strong style={{ color: T.text }}>University of Minnesota Office of Technology Commercialization</strong>.
            </p>
            {[
              { label: "Filing Type",         value: "PCT — Patent Cooperation Treaty" },
              { label: "Partner Institution",  value: "University of Minnesota OTC" },
              { label: "Technology Protected", value: "Ambient ML sensing pipeline" },
              { label: "Geographic Coverage",  value: "International — PCT member nations" },
            ].map((row) => (
              <div key={row.label} style={{ border: `1px solid ${T.lineStrg}`, background: "rgba(246,247,248,0.03)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                <span style={{ width: 170, flexShrink: 0, fontSize: 15, color: T.text3 }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ border: `1px solid ${T.lineStrg}`, background: T.surf1, borderRadius: 28, padding: 40, textAlign: "center", maxWidth: 380, width: "100%" }}>
              <div style={{ margin: "0 auto 24px", width: 96, height: 96, borderRadius: "50%", background: "rgba(122,0,25,0.12)", border: "2px solid rgba(122,0,25,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 12V28C6 38 14 45 24 48C34 45 42 38 42 28V12L24 4Z" fill="#7A0019" opacity="0.85"/>
                  <text x="24" y="32" textAnchor="middle" fontSize="13" fontWeight="900" fill="white" fontFamily="Arial Black, Arial">PCT</text>
                </svg>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Internationally Protected</p>
              <p style={{ fontSize: 17, color: T.text2, margin: "0 0 24px" }}>Patent Cooperation Treaty Filing</p>
              <div style={{ borderTop: `1px solid ${T.line}`, marginBottom: 24 }}/>
              <div style={{ background: T.maroonBg, border: "1px solid rgba(122,0,25,0.25)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <UMNLogo size={44}/>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>University of Minnesota</p>
                <p style={{ fontSize: 15, color: T.text2, margin: "0 0 4px" }}>Office of Technology Commercialization</p>
                <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Technology Transfer Partner</p>
              </div>
              <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6, margin: "20px 0 0" }}>
                UMN OTC has transferred more than $500M in technology to commercial partners — among the most active university tech transfer programs in the nation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GENER8TOR ── */}
      <section id="accelerator" style={{ borderBottom: `1px solid ${T.line}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 56, alignItems: "center" }}>
          <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderRadius: 28, padding: 36 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
              <Gener8torMark size={30}/>
              <span style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(45,114,210,0.3)`, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>Accelerator</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.line}`, marginBottom: 28 }}/>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { value: "Top 10", label: "US Accelerator Ranking" },
                { value: "$1B+",   label: "Follow-on Funding Raised" },
                { value: "180+",   label: "Portfolio Companies" },
                { value: "22",     label: "States Across the US" },
              ].map((m) => (
                <div key={m.label} style={{ background: T.surf2, border: `1px solid ${T.line}`, borderRadius: 14, padding: "16px 18px" }}>
                  <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{m.value}</p>
                  <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>{m.label}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${T.line}`, margin: "28px 0 12px" }}/>
            <div style={{ height: 48 }}><SparkLine color={T.accent}/></div>
            <p style={{ fontSize: 12, color: T.text3, fontFamily: "var(--mono, monospace)", margin: "8px 0 0" }}>Portfolio company valuation trajectory</p>
          </div>
          <div>
            <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>Startup Accelerator</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 20px" }}>Backed by gener8tor</h2>
            <p style={{ fontSize: 19, lineHeight: 1.65, color: T.text2, marginBottom: 18 }}>
              Ambient Intelligence is supported by <strong style={{ color: T.text }}>gener8tor</strong>, one of America&apos;s
              top-ranked startup accelerators. Known for a rigorous 12-week program, world-class mentor network,
              and a track record of building companies that raise hundreds of millions in follow-on funding.
            </p>
            <p style={{ fontSize: 19, lineHeight: 1.65, color: T.text2, marginBottom: 28 }}>
              Gener8tor&apos;s deep Midwest roots and growing presence in Minnesota health technology make it
              a natural partner as we build toward our Summer 2026 pilot launch.
            </p>
            {[
              "12-week intensive program with dedicated mentorship",
              "Curated investor network across healthcare and enterprise tech",
              "Seed-stage capital and operational support",
              "National cohort of 5–6 companies for deep focus",
              "Access to $1B+ in follow-on investor relationships",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <IconCheck color={T.sage}/><span style={{ fontSize: 17, color: T.text2 }}>{item}</span>
              </div>
            ))}
            <a href="https://www.gener8tor.com/" target="_blank" rel="noopener noreferrer" className="mn-link" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.lineStrg}`, color: T.text2, borderRadius: 999, padding: "12px 22px", fontSize: 16, fontWeight: 600, textDecoration: "none", marginTop: 8 }}>
              Learn about gener8tor <IconExternal/>
            </a>
          </div>
        </div>
      </section>

      {/* ── ELLA MEMORY ── */}
      <section style={{ borderBottom: `1px solid ${T.line}`, background: T.bg2, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ background: T.surf1, border: `1px solid ${T.lineStrg}`, borderRadius: 28, padding: "48px 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48, alignItems: "center" }}>
              <div>
                <p style={{ color: T.text3, fontFamily: "var(--mono, monospace)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>Flagship Product</p>
                <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 18px" }}>Ella Memory</h2>
                <p style={{ fontSize: 18, lineHeight: 1.65, color: T.text2, marginBottom: 24 }}>
                  Our patient-facing intelligent care companion. Ella Memory continuously observes patient
                  behavior using ambient room sensors — no cameras, no wearables — and surfaces meaningful patterns to care teams in real time.
                </p>
                {["Ambient room sensors — completely passive monitoring","Nurse dashboard with live resident status and alerts","AI-powered behavioral trend analysis","Privacy by architecture — PHI never in transit","Mobile-ready for on-the-go care teams"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <IconCheck color={T.sage}/><span style={{ fontSize: 16, color: T.text2 }}>{item}</span>
                  </div>
                ))}
                <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.accent, color: T.text, borderRadius: 999, padding: "14px 26px", fontSize: 16, fontWeight: 600, textDecoration: "none", marginTop: 16 }}>
                  Visit ellamemory.com <IconExternal/>
                </a>
              </div>
              <div>
                <div style={{ background: T.surf2, border: `1px solid ${T.lineStrg}`, borderRadius: 18, padding: 22, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Resident Activity — Live</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.text3 }}>
                      <span className="mn-pulse" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: T.sage, flexShrink: 0 }}/>
                      Active
                    </span>
                  </div>
                  <div style={{ height: 64 }}><SparkLine color={T.accent}/></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  {[{ label: "Avg Response", value: "< 2s" },{ label: "Uptime", value: "99.9%" },{ label: "Detection", value: "94%" }].map((m) => (
                    <div key={m.label} style={{ background: T.surf2, border: `1px solid ${T.line}`, borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{m.value}</p>
                      <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.sageBg, border: "1px solid rgba(61,204,145,0.2)", borderRadius: 14, padding: "16px 20px" }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: T.sage, margin: "0 0 4px" }}>Minneapolis Pilot — Summer 2026</p>
                  <p style={{ fontSize: 15, color: T.text2, margin: 0 }}>IRB-guided protocol. HIPAA-compliant. Real care facilities. Real outcomes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: T.accentBg, border: `2px solid rgba(45,114,210,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="8" fill={T.accent}/>
              <circle cx="22" cy="22" r="14" stroke={T.accent} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4"/>
              <circle cx="22" cy="22" r="20" stroke={T.accent} strokeWidth="1" opacity="0.2"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 20px" }}>
            Minnesota&apos;s moment in health tech is now.
          </h2>
          <p style={{ fontSize: 20, lineHeight: 1.65, color: T.text2, marginBottom: 36 }}>
            We have the partnerships, the patent, the accelerator backing, and the team.
            If you are a care facility, researcher, investor, or partner who wants to be part
            of what is next for Minnesota health care — let&apos;s talk.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <a href="mailto:bribradley@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.accent, color: T.text, borderRadius: 999, padding: "16px 36px", fontSize: 18, fontWeight: 600, textDecoration: "none" }}>
              Get in Touch <IconArrow/>
            </a>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.lineStrg}`, color: T.text2, borderRadius: 999, padding: "16px 36px", fontSize: 18, fontWeight: 600, textDecoration: "none" }}>
              Explore Ella Memory
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${T.line}`, padding: "28px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: T.accent, width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.2"/><circle cx="7" cy="7" r="2.2" fill="white"/></svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Ambient Intelligence</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <UMNLogo size={18}/><MayoLogo size={16}/><MNStateLogo size={18}/>
            </div>
          </div>
          <p style={{ fontSize: 13, color: T.text3, textAlign: "center", margin: 0 }}>
            PCT patent filed with UMN OTC · Minneapolis pilot, Summer 2026 · gener8tor portfolio
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="https://www.ellamemory.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: T.text3, textDecoration: "none" }}>ellamemory.com</a>
            <a href="/invest" style={{ fontSize: 13, color: T.text3, textDecoration: "none" }}>Investor Info</a>
            <a href="https://www.minnesotapartnership.info/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: T.text3, textDecoration: "none" }}>MN Partnership</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
