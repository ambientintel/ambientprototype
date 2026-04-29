import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface Pending {
  name: string;
  email: string;
  role: string;
  createdAt: number;
}

// Module-level map — persists across requests in the same serverless instance.
// Suitable for prototype; replace with Redis/DB for production.
const pending = new Map<string, Pending>();

// Clean expired tokens (>24h) on each request
function purge() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of pending) if (v.createdAt < cutoff) pending.delete(k);
}

export async function POST(req: NextRequest) {
  purge();
  const { name, email, role } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const token = randomUUID();
  pending.set(token, { name, email, role: role || "engineer", createdAt: Date.now() });

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const verifyUrl = `${base}/verify?token=${token}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const from = process.env.RESEND_FROM || "Ambient Demo <onboarding@resend.dev>";
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#F0F0EE;color:#1A1A18;">
        <div style="margin-bottom:32px;">
          <span style="font-size:20px;font-weight:300;letter-spacing:-0.01em;">Ambient <em style="font-style:italic;color:#888;">Demo</em></span>
        </div>
        <h1 style="font-size:26px;font-weight:300;margin:0 0 8px;letter-spacing:-0.02em;">Confirm your <em style="font-style:italic;color:#888;">account</em></h1>
        <p style="font-size:14px;color:#555;margin:0 0 28px;line-height:1.6;">Hi ${name}, click the button below to confirm your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#7C6EAD;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;">Confirm account</a>
        <p style="font-size:12px;color:#999;margin-top:28px;">Or copy this link: <a href="${verifyUrl}" style="color:#7C6EAD;">${verifyUrl}</a></p>
        <p style="font-size:11px;color:#bbb;margin-top:32px;border-top:1px solid #ddd;padding-top:16px;">This link expires in 24 hours. If you did not request this, ignore this email.</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject: "Confirm your Ambient Demo account", html }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: "Failed to send confirmation email.", detail: err }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // No API key — dev mode: return the verify URL directly so it can be shown in the UI
  return NextResponse.json({ success: true, devVerifyUrl: verifyUrl });
}
