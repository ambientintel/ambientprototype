"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem("ambient_auth");
      if (s) setUser(JSON.parse(s));
    } catch {}
  }, []);

  function logout() {
    localStorage.removeItem("ambient_auth");
    router.push("/login");
  }

  if (!mounted) return null;

  if (user) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--text-3)" }}>
          {user.name || user.email}
        </span>
        <button onClick={logout} className="btn btn-ghost" style={{ display:"flex", alignItems:"center", gap:7 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
      </div>
    );
  }

  return (
    <a href="/login" className="btn btn-ghost" style={{ display:"flex", alignItems:"center", gap:7 }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="8" cy="5" r="2.5"/>
        <path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round"/>
      </svg>
      Login
    </a>
  );
}
