"use client";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
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
        {submitted ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(61,204,145,0.14)", border: "1px solid rgba(61,204,145,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3DCC91" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 10 8 14 16 6"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                Check your <em style={{ fontStyle: "italic", color: "var(--text-2)" }}>email</em>
              </h2>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", margin: 0, lineHeight: 1.7 }}>
                If an account exists for <strong style={{ color: "var(--text-2)" }}>{email}</strong>, a reset link has been sent.
              </p>
            </div>
            <Link href="/login" style={{
              marginTop: 8,
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--accent)",
              textDecoration: "none",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M8 6H2M4.5 3.5L2 6l2.5 2.5"/>
              </svg>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 30, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
              Reset <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--text-2)" }}>password</em>
            </h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", margin: "0 0 32px", lineHeight: 1.7 }}>
              Enter your email and we&apos;ll send a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  marginTop: 4,
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 20px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--sans)",
                  cursor: loading || !email ? "not-allowed" : "pointer",
                  opacity: loading || !email ? 0.6 : 1,
                  transition: "opacity 0.15s, background 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={e => { if (!loading && email) e.currentTarget.style.background = "#6B5E9A"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <Link href="/login" style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text-3)",
                textDecoration: "none",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 4,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M8 6H2M4.5 3.5L2 6l2.5 2.5"/>
                </svg>
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 32, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        — Ambient Intelligence · contactless monitoring · v3 preview —
      </div>

      <style>{`input::placeholder { color: var(--text-4); }`}</style>
    </div>
  );
}
