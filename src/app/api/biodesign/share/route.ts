import { withAuth } from '@workos-inc/authkit-nextjs';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

function genId() {
  return (Math.random().toString(36).slice(2, 7) + Math.random().toString(36).slice(2, 7)).toUpperCase();
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth({ ensureSignedIn: false });
  const { state } = await req.json();

  const shareId = genId();
  const payload = {
    shareId,
    sharedBy: user?.email ?? null,
    sharedAt: new Date().toISOString(),
    state,
  };

  await put(`biodesign-shares/${shareId}.json`, JSON.stringify(payload), {
    access: 'public', addRandomSuffix: false, contentType: 'application/json',
  });

  const origin = req.headers.get('origin') ?? '';
  return NextResponse.json({ shareId, url: `${origin}/biodesign/share/${shareId}` });
}
