import { withAuth } from '@workos-inc/authkit-nextjs';
import { list, put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SNAPSHOTS = 20;

function snapPrefix(userId: string, projectId: string) {
  return `biodesign-snaps/${userId}/${projectId}/`;
}
function snapPath(userId: string, projectId: string, timestamp: string) {
  return `${snapPrefix(userId, projectId)}${timestamp}.json`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;
  const { blobs } = await list({ prefix: snapPrefix(user.id, id) });

  const snapshots = await Promise.all(
    blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map(async b => {
        const timestamp = b.pathname.split('/').pop()!.replace('.json', '');
        try {
          const res = await fetch(b.url, { cache: 'no-store' });
          const data = await res.json();
          return { timestamp, projectName: data.projectName ?? '', label: data._snapshotLabel ?? null };
        } catch {
          return { timestamp, projectName: '', label: null };
        }
      })
  );

  return NextResponse.json({ snapshots });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;
  const { state, label } = await req.json();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const payload = label ? { ...state, _snapshotLabel: label } : state;

  await put(snapPath(user.id, id, timestamp), JSON.stringify(payload), {
    access: 'public', addRandomSuffix: false, contentType: 'application/json',
  });

  // Prune oldest snapshots beyond limit
  const { blobs } = await list({ prefix: snapPrefix(user.id, id) });
  if (blobs.length > MAX_SNAPSHOTS) {
    const oldest = blobs
      .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
      .slice(0, blobs.length - MAX_SNAPSHOTS);
    await del(oldest.map(b => b.url));
  }

  return NextResponse.json({ snapshot: { timestamp, projectName: state.projectName ?? '', label: label ?? null } });
}
