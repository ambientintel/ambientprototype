"use client";
import { useState } from "react";

const schemes: Record<string, Record<string, string>> = {
  // — originals —
  Warm: {
    "--bg": "#F5F1EB",
    "--surface-1": "#FAF7F2",
    "--surface-2": "#EDE7DD",
    "--surface-3": "#E4DDD0",
    "--line": "rgba(40,30,20,0.08)",
    "--line-strong": "rgba(40,30,20,0.16)",
    "--text": "#1F1B16",
    "--text-2": "rgba(31,27,22,0.68)",
    "--text-3": "rgba(31,27,22,0.48)",
    "--text-4": "rgba(31,27,22,0.30)",
    "--accent": "#D97757",
    "--accent-soft": "rgba(217,119,87,0.14)",
    "--sage": "oklch(0.55 0.07 150)",
  },
  Cool: {
    "--bg": "#EEF1F5",
    "--surface-1": "#F4F6FA",
    "--surface-2": "#DDE3ED",
    "--surface-3": "#D0D8E4",
    "--line": "rgba(20,30,40,0.08)",
    "--line-strong": "rgba(20,30,40,0.16)",
    "--text": "#161C22",
    "--text-2": "rgba(22,28,34,0.68)",
    "--text-3": "rgba(22,28,34,0.48)",
    "--text-4": "rgba(22,28,34,0.30)",
    "--accent": "#4A7FC1",
    "--accent-soft": "rgba(74,127,193,0.14)",
    "--sage": "oklch(0.55 0.07 200)",
  },
  Dark: {
    "--bg": "#141414",
    "--surface-1": "#1C1C1C",
    "--surface-2": "#252525",
    "--surface-3": "#2E2E2E",
    "--line": "rgba(255,255,255,0.07)",
    "--line-strong": "rgba(255,255,255,0.14)",
    "--text": "#EDEDE9",
    "--text-2": "rgba(237,237,233,0.68)",
    "--text-3": "rgba(237,237,233,0.48)",
    "--text-4": "rgba(237,237,233,0.30)",
    "--accent": "#D97757",
    "--accent-soft": "rgba(217,119,87,0.18)",
    "--sage": "oklch(0.65 0.07 150)",
  },
  Slate: {
    "--bg": "#F0F0EE",
    "--surface-1": "#F7F7F5",
    "--surface-2": "#E4E4E0",
    "--surface-3": "#D8D8D3",
    "--line": "rgba(30,30,28,0.08)",
    "--line-strong": "rgba(30,30,28,0.16)",
    "--text": "#1A1A18",
    "--text-2": "rgba(26,26,24,0.68)",
    "--text-3": "rgba(26,26,24,0.48)",
    "--text-4": "rgba(26,26,24,0.30)",
    "--accent": "#7C6EAD",
    "--accent-soft": "rgba(124,110,173,0.14)",
    "--sage": "oklch(0.55 0.07 155)",
  },
  // — brand-inspired —
  Palantir: {
    "--bg": "#0A0A0A",
    "--surface-1": "#111111",
    "--surface-2": "#1A1A1A",
    "--surface-3": "#222222",
    "--line": "rgba(255,255,255,0.06)",
    "--line-strong": "rgba(255,255,255,0.12)",
    "--text": "#F0F0EE",
    "--text-2": "rgba(240,240,238,0.65)",
    "--text-3": "rgba(240,240,238,0.42)",
    "--text-4": "rgba(240,240,238,0.26)",
    "--accent": "#00C27A",
    "--accent-soft": "rgba(0,194,122,0.14)",
    "--sage": "oklch(0.65 0.12 155)",
  },
  Apple: {
    "--bg": "#FFFFFF",
    "--surface-1": "#F5F5F7",
    "--surface-2": "#FFFFFF",
    "--surface-3": "#E8E8ED",
    "--line": "rgba(0,0,0,0.06)",
    "--line-strong": "rgba(0,0,0,0.12)",
    "--text": "#1D1D1F",
    "--text-2": "rgba(29,29,31,0.65)",
    "--text-3": "rgba(29,29,31,0.44)",
    "--text-4": "rgba(29,29,31,0.28)",
    "--accent": "#0071E3",
    "--accent-soft": "rgba(0,113,227,0.10)",
    "--sage": "oklch(0.55 0.07 240)",
  },
  Mayo: {
    "--bg": "#FFFFFF",
    "--surface-1": "#F4F7FB",
    "--surface-2": "#EAF0F8",
    "--surface-3": "#D6E4F0",
    "--line": "rgba(0,70,140,0.08)",
    "--line-strong": "rgba(0,70,140,0.16)",
    "--text": "#0D1F2D",
    "--text-2": "rgba(13,31,45,0.68)",
    "--text-3": "rgba(13,31,45,0.46)",
    "--text-4": "rgba(13,31,45,0.28)",
    "--accent": "#005EB8",
    "--accent-soft": "rgba(0,94,184,0.10)",
    "--sage": "oklch(0.50 0.09 200)",
  },
  OpenAI: {
    "--bg": "#0D0D0D",
    "--surface-1": "#161616",
    "--surface-2": "#1E1E1E",
    "--surface-3": "#272727",
    "--line": "rgba(255,255,255,0.07)",
    "--line-strong": "rgba(255,255,255,0.13)",
    "--text": "#ECECEC",
    "--text-2": "rgba(236,236,236,0.65)",
    "--text-3": "rgba(236,236,236,0.42)",
    "--text-4": "rgba(236,236,236,0.26)",
    "--accent": "#10A37F",
    "--accent-soft": "rgba(16,163,127,0.15)",
    "--sage": "oklch(0.62 0.10 160)",
  },
  Nike: {
    "--bg": "#111111",
    "--surface-1": "#181818",
    "--surface-2": "#212121",
    "--surface-3": "#2C2C2C",
    "--line": "rgba(255,255,255,0.07)",
    "--line-strong": "rgba(255,255,255,0.14)",
    "--text": "#FFFFFF",
    "--text-2": "rgba(255,255,255,0.65)",
    "--text-3": "rgba(255,255,255,0.42)",
    "--text-4": "rgba(255,255,255,0.26)",
    "--accent": "#FA5400",
    "--accent-soft": "rgba(250,84,0,0.15)",
    "--sage": "oklch(0.65 0.14 35)",
  },
  Arcteryx: {
    "--bg": "#F8F8F6",
    "--surface-1": "#FFFFFF",
    "--surface-2": "#EFEFED",
    "--surface-3": "#E4E4E1",
    "--line": "rgba(0,0,0,0.07)",
    "--line-strong": "rgba(0,0,0,0.13)",
    "--text": "#111111",
    "--text-2": "rgba(17,17,17,0.65)",
    "--text-3": "rgba(17,17,17,0.44)",
    "--text-4": "rgba(17,17,17,0.28)",
    "--accent": "#C43B00",
    "--accent-soft": "rgba(196,59,0,0.10)",
    "--sage": "oklch(0.55 0.07 42)",
  },
  "Stone Island": {
    "--bg": "#F2F0EB",
    "--surface-1": "#FAFAF8",
    "--surface-2": "#E8E5DE",
    "--surface-3": "#DDD9CF",
    "--line": "rgba(40,35,25,0.08)",
    "--line-strong": "rgba(40,35,25,0.15)",
    "--text": "#1C1A15",
    "--text-2": "rgba(28,26,21,0.68)",
    "--text-3": "rgba(28,26,21,0.46)",
    "--text-4": "rgba(28,26,21,0.28)",
    "--accent": "#CF4520",
    "--accent-soft": "rgba(207,69,32,0.12)",
    "--sage": "oklch(0.55 0.07 38)",
  },
  Porsche: {
    "--bg": "#FFFFFF",
    "--surface-1": "#F8F8F8",
    "--surface-2": "#F0F0F0",
    "--surface-3": "#E4E4E4",
    "--line": "rgba(0,0,0,0.07)",
    "--line-strong": "rgba(0,0,0,0.13)",
    "--text": "#000000",
    "--text-2": "rgba(0,0,0,0.62)",
    "--text-3": "rgba(0,0,0,0.42)",
    "--text-4": "rgba(0,0,0,0.26)",
    "--accent": "#D5001C",
    "--accent-soft": "rgba(213,0,28,0.09)",
    "--sage": "oklch(0.50 0.10 20)",
  },
  Patek: {
    "--bg": "#FAF8F3",
    "--surface-1": "#FFFDF8",
    "--surface-2": "#F0EDE4",
    "--surface-3": "#E5E1D7",
    "--line": "rgba(50,40,20,0.08)",
    "--line-strong": "rgba(50,40,20,0.15)",
    "--text": "#1A1510",
    "--text-2": "rgba(26,21,16,0.68)",
    "--text-3": "rgba(26,21,16,0.46)",
    "--text-4": "rgba(26,21,16,0.28)",
    "--accent": "#8B6914",
    "--accent-soft": "rgba(139,105,20,0.12)",
    "--sage": "oklch(0.55 0.08 85)",
  },
};

const tokens = [
  "--bg", "--surface-1", "--surface-2", "--surface-3",
  "--line", "--line-strong",
  "--text", "--text-2", "--text-3", "--text-4",
  "--accent", "--accent-soft", "--sage",
];

const groups = [
  { label: "Original", names: ["Warm", "Cool", "Dark", "Slate"] },
  { label: "Brand-inspired", names: ["Palantir", "Apple", "Mayo", "OpenAI", "Nike", "Arcteryx", "Stone Island", "Porsche", "Patek"] },
];

export default function ColorsPage() {
  const [active, setActive] = useState("Warm");
  const vars = schemes[active];

  return (
    <div style={{ ...Object.fromEntries(Object.entries(vars)) as React.CSSProperties, background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--sans)", padding: "48px 40px", color: "var(--text)" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ambient Intelligence</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: "0 0 28px" }}>Color schemes</h1>

        {/* Grouped switcher */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {groups.map(({ label, names }) => (
            <div key={label}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 8 }}>{label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {names.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActive(name)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: active === name ? "var(--accent)" : "var(--line-strong)",
                      background: active === name ? "var(--accent-soft)" : "var(--surface-1)",
                      color: active === name ? "var(--accent)" : "var(--text-2)",
                      fontFamily: "inherit",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: active === name ? 500 : 400,
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, maxWidth: 900 }}>
        {/* Token swatches */}
        <section>
          <h2 style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16, fontWeight: 500 }}>Tokens</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tokens.map((token) => (
              <div key={token} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 22, borderRadius: 4, background: `var(${token})`, border: "1px solid var(--line-strong)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--mono)" }}>{token}</span>
                <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: "auto", fontFamily: "var(--mono)" }}>{vars[token]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* UI preview */}
        <section>
          <h2 style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16, fontWeight: 500 }}>Preview</h2>

          <div style={{ background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Card */}
            <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: 16, border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Patient · Room 214</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>Eleanor Voss</div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>Last event: 2 min ago</div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 500 }}>Alert</span>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "var(--surface-3)", color: "var(--text-3)" }}>Stable</span>
              </div>
            </div>

            {/* Typography */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Heading</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>Body text at default size</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Secondary / caption text</div>
              <div style={{ fontSize: 11, color: "var(--text-4)" }}>Tertiary / disabled text</div>
            </div>

            {/* Buttons */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", gap: 8 }}>
              <button style={{ padding: "7px 16px", borderRadius: 6, background: "var(--accent)", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Primary</button>
              <button style={{ padding: "7px 16px", borderRadius: 6, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--line-strong)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Secondary</button>
              <button style={{ padding: "7px 16px", borderRadius: 6, background: "transparent", color: "var(--text-2)", border: "1px solid var(--line)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Ghost</button>
            </div>

            {/* Input */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <input
                placeholder="Search patients…"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line-strong)", background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>

            {/* Accent bar */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Accent</span>
                <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>var(--accent)</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
                <div style={{ width: "62%", height: "100%", background: "var(--accent)", borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
