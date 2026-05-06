import { withAuth } from '@workos-inc/authkit-nextjs';
import { list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; timestamp: string }> }
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id, timestamp } = await params;

  const { blobs } = await list({ prefix: `biodesign-snaps/${user.id}/${id}/${timestamp}.json` });
  if (!blobs.length) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });

  const res = await fetch(blobs[0].url, { cache: 'no-store' });
  const raw = await res.json();
  // Strip internal snapshot metadata before returning
  const { _snapshotLabel: _, ...state } = raw;
  return NextResponse.json({ state });
}
