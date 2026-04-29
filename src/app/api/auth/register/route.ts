import { NextRequest, NextResponse } from "next/server";

function getStore() {
  if (!globalThis.__ambientPending) {
    globalThis.__ambientPending = new Map();
  }
  return globalThis.__ambientPending;
}

function purge() {
  const store = getStore();
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expires < now) store.delete(k);
  }
}

export async function POST(req: NextRequest) {
  const { name, email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  purge();

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const store = getStore();
  store.set(email.toLowerCase(), { code, name, email, role, expires: Date.now() + 15 * 60 * 1000 });

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ambient <onboarding@resend.dev>",
        to: email,
        subject: `${code} is your Ambient Demo code`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
            <p style="font-size:14px;color:#888;margin-bottom:8px;">Ambient Intelligence</p>
            <h1 style="font-size:32px;font-weight:700;letter-spacing:0.1em;color:#fff;margin:0 0 8px;">${code}</h1>
            <p style="font-size:14px;color:#aaa;margin:0 0 24px;">Enter this code to confirm your account. Expires in 15 minutes.</p>
            <p style="font-size:12px;color:#555;">If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true, devCode: code });
}
