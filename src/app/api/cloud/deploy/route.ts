import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.GITHUB_TOKEN;
const CLOUD_REPO = 'ambientintel/ambientcloud';

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 503 });

  const { service, lambdaFn } = await req.json() as { service: string; lambdaFn: string };

  if (!service || !lambdaFn) {
    return NextResponse.json({ error: 'service and lambdaFn required' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${CLOUD_REPO}/actions/workflows/lambda-deploy.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { service, lambda_function: lambdaFn },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    let msg = 'Workflow dispatch failed';
    try { msg = (JSON.parse(text) as { message?: string }).message ?? msg; } catch { /* ignore */ }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Deploying ${service} → ${lambdaFn}` });
}
