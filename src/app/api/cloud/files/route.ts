import { NextRequest, NextResponse } from 'next/server';

const TOKEN = process.env.GITHUB_TOKEN;
const CLOUD_REPO = 'ambientintel/ambientcloud';

const GH_HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

export async function GET(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 503 });

  const { searchParams } = req.nextUrl;
  const service = searchParams.get('service');
  const filePath = searchParams.get('path');
  const list = searchParams.get('list');

  if (!service) return NextResponse.json({ error: 'service required' }, { status: 400 });

  const serviceBase = `services/${service}`;

  if (list) {
    const res = await fetch(
      `https://api.github.com/repos/${CLOUD_REPO}/git/trees/HEAD?recursive=1`,
      { headers: GH_HEADERS, cache: 'no-store' }
    );
    if (!res.ok) return NextResponse.json({ error: 'GitHub tree fetch failed' }, { status: 500 });
    const data = await res.json() as { tree: { path: string; type: string }[] };
    const files = data.tree
      .filter(f => f.type === 'blob' && f.path.startsWith(serviceBase + '/'))
      .map(f => f.path.slice(serviceBase.length + 1));
    return NextResponse.json({ files });
  }

  if (!filePath) return NextResponse.json({ error: 'path required' }, { status: 400 });

  const fullPath = `${serviceBase}/${filePath}`;
  const res = await fetch(`https://api.github.com/repos/${CLOUD_REPO}/contents/${fullPath}`, {
    headers: GH_HEADERS,
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });
  const data = await res.json() as { content: string; sha: string };
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return NextResponse.json({ content, sha: data.sha, path: filePath });
}

export async function PUT(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 503 });

  const { service, path: filePath, content, sha, message } = await req.json() as {
    service: string;
    path: string;
    content: string;
    sha: string;
    message?: string;
  };

  if (!service || !filePath || content === undefined || !sha) {
    return NextResponse.json({ error: 'service, path, content, sha required' }, { status: 400 });
  }

  const fullPath = `services/${service}/${filePath}`;
  const encoded = Buffer.from(content, 'utf-8').toString('base64');

  const res = await fetch(`https://api.github.com/repos/${CLOUD_REPO}/contents/${fullPath}`, {
    method: 'PUT',
    headers: { ...GH_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message ?? `cloud: edit ${filePath}`,
      content: encoded,
      sha,
    }),
  });

  if (res.status === 409) {
    return NextResponse.json({ error: 'SHA conflict — reload file and retry' }, { status: 409 });
  }
  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? 'GitHub write failed' }, { status: 500 });
  }

  const data = await res.json() as { content?: { sha: string } };
  return NextResponse.json({ sha: data.content?.sha });
}
