"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to WorkOS AuthKit hosted login
    router.replace("/api/auth/signin");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0C0D0F",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--mono, monospace)",
      color: "rgba(255,255,255,0.4)",
      fontSize: 13,
      letterSpacing: "0.08em",
    }}>
      Redirecting…
    </div>
  );
}
