"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token found."); return; }
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setName(data.name); setStatus("success"); }
        else { setMessage(data.error || "Verification failed."); setStatus("error"); }
      })
      .catch(() => { setMessage("Network error. Please try again."); setStatus("error"); });
  }, [token]);

  const notion: React.CSSProperties = {
    "--bg": "#F0F0EE", "--surface-1": "#F7F7F5", "--line-strong": "rgba(30,30,28,0.16)",
    "--text": "#1A1A18", "--text-2": "rgba(26,26,24,0.72)", "--text-3": "rgba(26,26,24,0.55)",
    "--text-4": "rgba(26,26,24,0.40)", "--accent": "#7C6EAD",
    color: "var(--text)", minHeight: "100vh", background: "#F0F0EE",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "40px 20px", fontFamily: "var(--sans)",
  } as React.CSSProperties;

  return (
    <div style={notion}>
      <Link href="/" style={{ textDecoration:"none", color:"inherit", marginBottom:40, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        <div style={{ fontFamily:"var(--serif)", fontWeight:400, fontSize:22, letterSpacing:"-0.01em" }}>
          Ambient <em style={{ fontStyle:"italic", fontWeight:300, color:"var(--text-2)" }}>Demo</em>
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.14em", color:"var(--text-4)" }}>
          Ambient Intelligence · Prototype
        </div>
      </Link>

      <div style={{ background:"var(--surface-1)", border:"1px solid var(--line-strong)", borderRadius:16, padding:"48px 44px", width:"100%", maxWidth:420, boxShadow:"0 4px 40px rgba(30,30,28,0.07)", display:"flex", flexDirection:"column", alignItems:"center", gap:20, textAlign:"center" }}>
        {status === "loading" && (
          <>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ animation:"spin 0.7s linear infinite" }}>
              <circle cx="20" cy="20" r="16" stroke="rgba(124,110,173,0.2)" strokeWidth="3"/>
              <path d="M20 4a16 16 0 0116 16" stroke="#7C6EAD" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize:16, fontWeight:500, marginBottom:6 }}>Verifying your account…</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>Just a moment</div>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(61,204,145,0.12)", border:"1px solid rgba(61,204,145,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3DCC91" strokeWidth="2.2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:"var(--serif)", fontWeight:300, fontSize:26, letterSpacing:"-0.02em", marginBottom:6 }}>
                Welcome{name ? `, ${name}` : ""}
              </div>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                Account confirmed
              </div>
            </div>
            <p style={{ fontSize:13.5, color:"var(--text-2)", lineHeight:1.6, margin:0 }}>
              Your email has been verified. You can now sign in to the dashboard.
            </p>
            <Link href="/login" style={{ background:"var(--accent)", color:"#fff", textDecoration:"none", padding:"12px 28px", borderRadius:8, fontSize:13, fontWeight:500, marginTop:4 }}>
              Sign in →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:500, marginBottom:6 }}>Verification failed</div>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#FF6B6B" }}>{message}</div>
            </div>
            <p style={{ fontSize:13, color:"var(--text-3)", lineHeight:1.6, margin:0 }}>
              The link may have expired or already been used. Try creating a new account.
            </p>
            <Link href="/login" style={{ background:"var(--accent)", color:"#fff", textDecoration:"none", padding:"12px 28px", borderRadius:8, fontSize:13, fontWeight:500, marginTop:4 }}>
              Back to login
            </Link>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyInner /></Suspense>;
}
