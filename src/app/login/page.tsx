"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const notion: React.CSSProperties = {
    "--bg": "#F0F0EE",
    "--surface-1": "#F7F7F5",
    "--surface-2": "#E4E4E0",
    "--line": "rgba(30,30,28,0.08)",
    "--line-strong": "rgba(30,30,28,0.16)",
    "--text": "#1A1A18",
    "--text-2": "rgba(26,26,24,0.72)",
    "--text-3": "rgba(26,26,24,0.55)",
    "--text-4": "rgba(26,26,24,0.40)",
    "--accent": "#7C6EAD",
    "--accent-soft": "rgba(124,110,173,0.14)",
    color: "var(--text)",
    minHeight: "100vh",
    background: "#F0F0EE",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "var(--sans)",
  } as React.CSSProperties;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard/overview");
    }, 900);
  }

  return (
    <div style={notion}>

      {/* Brand */}
      <Link href="/" style={{ textDecoration: "none", color: "inherit", marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 22, letterSpacing: "-0.01em" }}>
          Ambient <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--text-2)" }}>Demo</em>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)" }}>
          Ambient Intelligence · Prototype
        </div>
      </Link>

      {/* Card */}
      <div style={{
        background: "var(--surface-1)",
        border: "1px solid var(--line-strong)",
        borderRadius: 16,
        padding: "40px 44px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 4px 40px rgba(30,30,28,0.07)",
      }}>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 30, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          Sign <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--text-2)" }}>in</em>
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", margin: "0 0 32px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          MOH Nurse Dashboard · Secure Access
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="nurse@moh.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line-strong)",
                borderRadius: 8,
                padding: "11px 14px",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
                transition: "border-color 0.15s",
                fontFamily: "var(--sans)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)" }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textDecoration: "none", letterSpacing: "0.06em" }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line-strong)",
                borderRadius: 8,
                padding: "11px 14px",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
                transition: "border-color 0.15s",
                fontFamily: "var(--sans)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#FF6B6B", padding: "10px 14px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 6 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--sans)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s, background 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#6B5E9A"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.7s linear infinite" }}>
                  <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                  <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 32, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        — Ambient Intelligence · contactless monitoring · v3 preview —
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--text-4); }
      `}</style>
    </div>
  );
}
