import { withAuth } from '@workos-inc/authkit-nextjs';
import { list, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

function blobPath(userId: string, projectId: string) {
  return `biodesign/${userId}/${projectId}.json`;
}

// GET: list all projects for the authenticated user
export async function GET() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { blobs } = await list({ prefix: `biodesign/${user.id}/` });

  const projects = await Promise.all(
    blobs.map(async blob => {
      const id = blob.pathname.split('/').pop()!.replace('.json', '');
      try {
        const res = await fetch(blob.url, { cache: 'no-store' });
        const state = await res.json();
        return {
          id,
          name: state.projectName || 'Untitled Project',
          indication: state.indication || '',
          updatedAt: blob.uploadedAt.toISOString(),
          blobUrl: blob.url,
        };
      } catch {
        return { id, name: 'Untitled Project', indication: '', updatedAt: blob.uploadedAt.toISOString(), blobUrl: blob.url };
      }
    })
  );

  return NextResponse.json({ projects });
}

// POST: create or update a project
export async function POST(req: NextRequest) {
  const { user } = await withAuth({ ensureSignedIn: true });
  const { id, state } = await req.json();
  if (!id || !state) return NextResponse.json({ error: 'Missing id or state' }, { status: 400 });

  const blob = await put(blobPath(user.id, id), JSON.stringify(state), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  return NextResponse.json({ url: blob.url });
}
