import { withAuth } from '@workos-inc/authkit-nextjs';
import { del, list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;
  const { blobs } = await list({ prefix: `biodesign/${user.id}/${id}.json` });
  if (blobs.length > 0) await del(blobs[0].url);
  return NextResponse.json({ ok: true });
}
