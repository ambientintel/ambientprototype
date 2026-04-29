"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "create">("signin");

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create account state
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cConfirm, setCConfirm] = useState("");
  const [cRole, setCRole] = useState("engineer");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");
  const [cSuccess, setCSuccess] = useState(false);

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

  const inputStyle: React.CSSProperties = {
    background: "var(--bg)",
    border: "1px solid var(--line-strong)",
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 14,
    color: "var(--text)",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "var(--sans)",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-3)",
  };

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); router.push("/dashboard/overview"); }, 900);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCError("");
    if (!cName.trim()) { setCError("Please enter your name."); return; }
    if (!cEmail.trim()) { setCError("Please enter an email address."); return; }
    if (cPassword.length < 6) { setCError("Password must be at least 6 characters."); return; }
    if (cPassword !== cConfirm) { setCError("Passwords do not match."); return; }
    setCLoading(true);
    setTimeout(() => {
      setCLoading(false);
      setCSuccess(true);
      setTimeout(() => { router.push("/dashboard/overview"); }, 1400);
    }, 1000);
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
      <div style={{ background: "var(--surface-1)", border: "1px solid var(--line-strong)", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 4px 40px rgba(30,30,28,0.07)", overflow: "hidden" }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--line-strong)" }}>
          {([["signin", "Sign In"], ["create", "Create Account"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setError(""); setCError(""); setCSuccess(false); }}
              style={{ flex: 1, padding: "16px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 13, fontWeight: tab === id ? 500 : 400, color: tab === id ? "var(--text)" : "var(--text-3)", borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: -1, transition: "color 0.15s, border-color 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "36px 44px 40px" }}>

          {/* ── Sign In ── */}
          {tab === "signin" && (
            <>
              <h1 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                Sign <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--text-2)" }}>in</em>
              </h1>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", margin: "0 0 28px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Secure Access
              </p>
              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}/>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={labelStyle}>Password</label>
                    <Link href="/forgot-password" style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textDecoration: "none", letterSpacing: "0.06em" }}>Forgot password?</Link>
                  </div>
                  <input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}/>
                </div>
                {error && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#FF6B6B", padding: "10px 14px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 6 }}>{error}</div>}
                <button type="submit" disabled={loading}
                  style={{ marginTop: 8, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 13, fontWeight: 500, fontFamily: "var(--sans)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s, background 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#6B5E9A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}>
                  {loading ? (<><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.7s linear infinite" }}><circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/><path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>Signing in…</>) : "Sign in"}
                </button>
              </form>
            </>
          )}

          {/* ── Create Account ── */}
          {tab === "create" && (
            <>
              <h1 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
                Create <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--text-2)" }}>account</em>
              </h1>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", margin: "0 0 28px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Join the team
              </p>

              {cSuccess ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "24px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(61,204,145,0.12)", border: "1px solid rgba(61,204,145,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3DCC91" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>Account created</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>Redirecting to dashboard…</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>Full Name</label>
                    <input type="text" autoComplete="name" placeholder="Your name" value={cName} onChange={e => setCName(e.target.value)} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" autoComplete="email" placeholder="you@example.com" value={cEmail} onChange={e => setCEmail(e.target.value)} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>Role</label>
                    <select value={cRole} onChange={e => setCRole(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "none" as const }}>
                      <option value="engineer">Engineer</option>
                      <option value="electrical">Electrical</option>
                      <option value="software">Software</option>
                      <option value="cloud_cybersecurity">Cloud Cybersecurity</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={labelStyle}>Password</label>
                      <input type="password" autoComplete="new-password" placeholder="••••••••" value={cPassword} onChange={e => setCPassword(e.target.value)} style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}/>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={labelStyle}>Confirm</label>
                      <input type="password" autoComplete="new-password" placeholder="••••••••" value={cConfirm} onChange={e => setCConfirm(e.target.value)} style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--line-strong)")}/>
                    </div>
                  </div>
                  {cError && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#FF6B6B", padding: "10px 14px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 6 }}>{cError}</div>}
                  <button type="submit" disabled={cLoading}
                    style={{ marginTop: 6, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 13, fontWeight: 500, fontFamily: "var(--sans)", cursor: cLoading ? "not-allowed" : "pointer", opacity: cLoading ? 0.7 : 1, transition: "opacity 0.15s, background 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onMouseEnter={e => { if (!cLoading) e.currentTarget.style.background = "#6B5E9A"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}>
                    {cLoading ? (<><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.7s linear infinite" }}><circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/><path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>Creating account…</>) : "Create account"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 32, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        — Ambient Intelligence · contactless monitoring · v3 preview —
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--text-4); }
        select option { background: #F7F7F5; color: #1A1A18; }
      `}</style>
    </div>
  );
}
