import { list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { blobs } = await list({ prefix: `biodesign-shares/${id}.json` });
  if (!blobs.length) return NextResponse.json({ error: 'Share not found' }, { status: 404 });

  const res = await fetch(blobs[0].url, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}
