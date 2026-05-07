import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

const BLOB_PATH = 'eng/state.json';

type DomainState = { checked: number[]; frozen: string | null };
type EngState = Record<string, DomainState>;

async function readState(): Promise<EngState> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (!blobs.length) return {};
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    return await res.json();
  } catch {
    return {};
  }
}

export async function GET() {
  const state = await readState();
  return NextResponse.json(state, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function PATCH(req: Request) {
  const body = await req.json() as { domain: string; checked: number[]; frozen: string | null };
  const current = await readState();
  const updated: EngState = {
    ...current,
    [body.domain]: { checked: body.checked, frozen: body.frozen },
  };
  await put(BLOB_PATH, JSON.stringify(updated), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  return NextResponse.json({ ok: true });
}
