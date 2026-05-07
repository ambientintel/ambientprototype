'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Lissajous background ───────────────────────────────────────────────────────

function LissajousCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const el = canvas;
    const ctx = el.getContext('2d')!;
    let raf: number;
    let t = 0;
    const figs = [
      { a: 2, b: 3, cx: 0.12, cy: 0.22, r: 130, ph: 0.0 },
      { a: 3, b: 5, cx: 0.55, cy: 0.08, r: 155, ph: 0.5 },
      { a: 5, b: 4, cx: 0.85, cy: 0.28, r: 115, ph: 1.1 },
      { a: 4, b: 3, cx: 0.18, cy: 0.75, r: 105, ph: 1.6 },
      { a: 3, b: 2, cx: 0.70, cy: 0.62, r: 145, ph: 0.8 },
      { a: 5, b: 3, cx: 0.90, cy: 0.80, r: 95,  ph: 0.3 },
      { a: 2, b: 5, cx: 0.42, cy: 0.90, r: 125, ph: 2.0 },
    ];
    function resize() { el.width = el.offsetWidth; el.height = el.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    function draw() {
      ctx.clearRect(0, 0, el.width, el.height);
      t += 0.003;
      figs.forEach(f => {
        const cx = f.cx * el.width, cy = f.cy * el.height;
        const delta = f.ph + t * 0.18;
        ctx.beginPath();
        for (let i = 0; i <= 420; i++) {
          const u = (i / 420) * Math.PI * 2;
          const x = cx + f.r * Math.sin(f.a * u + delta);
          const y = cy + f.r * Math.sin(f.b * u);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(124,58,237,0.055)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState('ok');
      setTimeout(() => setState('idle'), 1600);
    } catch { setState('err'); setTimeout(() => setState('idle'), 1600); }
  }
  return (
    <button onClick={copy} title="Copy to clipboard" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, border: state === 'ok' ? '1px solid #34D399' : '1px solid rgba(255,255,255,0.14)', background: state === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: state === 'ok' ? '#34D399' : '#94A3B8', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em' }}>
      {state === 'ok'
        ? <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
        : <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v6.5A1.5 1.5 0 002.5 12H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>Copy</>}
    </button>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'pending' | 'blocked' | 'warning';
interface Step { id: string; phase: string; title: string; status: StepStatus; tag: string; time?: string; summary: string; sections: Section[]; }
interface Section { heading?: string; body?: string; commands?: Cmd[]; artifacts?: Artifact[]; warnings?: string[]; table?: { cols: string[]; rows: string[][] }; checklist?: string[]; }
interface Cmd { label?: string; code: string; }
interface Artifact { file: string; role: string; size?: string; }

const SC: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',  bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#059669' },
  pending: { label: 'Pending',   bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', dot: '#D97706' },
  blocked: { label: 'Blocked',   bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '#DC2626' },
  warning: { label: 'Attention', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', dot: '#EA580C' },
};

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  'Setup':       { bg: '#EFF6FF', color: '#1D4ED8' },
  'Development': { bg: '#F0FDF4', color: '#15803D' },
  'Feature':     { bg: '#FAF5FF', color: '#7E22CE' },
  'Production':  { bg: '#FFF7ED', color: '#C2410C' },
};

const PIPELINE_PHASES = [
  { label: 'Environment', ids: ['repo', 'env', 'auth'] },
  { label: 'Development', ids: ['dev', 'api', 'realtime'] },
  { label: 'Features',    ids: ['dashboard', 'ella', 'deident'] },
  { label: 'Production',  ids: ['build', 'deploy', 'ci'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'repo', phase: '01', title: 'Repository Setup', status: 'done', tag: 'Setup', time: '< 5 min',
    summary: 'pnpm 9 monorepo. apps/web is the Next.js 16 + React 19 nurse dashboard. packages/ui is the shared component library.',
    sections: [
      {
        heading: 'Clone and install',
        commands: [
          { label: 'clone the repo', code: 'git clone https://github.com/ambientintel/ambientweb.git\ncd ambientweb\npnpm install' },
          { label: 'verify workspace packages', code: 'pnpm list --filter @ambient/web --depth 1' },
        ],
        body: 'Node 20 is required — pinned in .nvmrc. Use nvm or fnm to switch. pnpm 9 is the package manager; npm/yarn will produce incorrect lockfiles.',
      },
      {
        heading: 'Workspace layout',
        table: {
          cols: ['Path', 'Contents'],
          rows: [
            ['apps/web/', 'Next.js 16 app — nurse dashboard (App Router, Turbopack)'],
            ['apps/web/src/app/', 'Route tree — dashboard/, login/, api/, etc.'],
            ['packages/ui/', 'Shared component library (@ambient/ui)'],
            ['docs/architecture.md', 'ADRs, stack decisions, adjacent repo map'],
            ['docs/deidentification.md', 'PHI boundary and identity-overlay pattern'],
          ],
        },
      },
      {
        heading: 'Adjacent repos',
        table: {
          cols: ['Repo', 'Role'],
          rows: [
            ['ambientintel/ambientcloud', 'Terraform AWS backend — FastAPI + Cognito surface'],
            ['ambientintel/ambientapp', 'Device-side Python agent on TI AM62x'],
            ['ambientintel/ambientfirmware', 'TI AM62x + IWR6843AOP firmware'],
          ],
        },
      },
    ],
  },
  {
    id: 'env', phase: '02', title: 'Environment Variables', status: 'done', tag: 'Setup', time: '~15 min',
    summary: 'Copy .env.example to .env.local in apps/web. Five required variables; WorkOS and VAPID keys must be provisioned before the dev server will auth.',
    sections: [
      {
        heading: 'Required variables',
        commands: [
          { label: 'start from the example', code: 'cp apps/web/.env.example apps/web/.env.local' },
        ],
        table: {
          cols: ['Variable', 'Description', 'Where to get it'],
          rows: [
            ['WORKOS_API_KEY', 'WorkOS secret key', 'WorkOS dashboard → API Keys'],
            ['WORKOS_CLIENT_ID', 'WorkOS OAuth client ID', 'WorkOS dashboard → Applications'],
            ['WORKOS_REDIRECT_URI', 'OAuth callback — use http://localhost:3000/callback in dev', 'Set to match your WorkOS app settings'],
            ['NEXT_PUBLIC_API_URL', 'ambientcloud FastAPI base URL', 'ambientcloud Terraform outputs → api_url'],
            ['VAPID_PRIVATE_KEY', 'Web Push private key for fall alert push notifications', 'Generate with: npx web-push generate-vapid-keys'],
            ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'Web Push public key sent to browser', 'Paired with VAPID_PRIVATE_KEY above'],
          ],
        },
        warnings: [
          'Never commit .env.local. It is in .gitignore by default but double-check before every commit.',
          'WORKOS_REDIRECT_URI must exactly match the redirect URI registered in your WorkOS application — including trailing slashes and http vs https.',
        ],
      },
      {
        heading: 'Generate VAPID keys',
        commands: [{ code: 'npx web-push generate-vapid-keys\n# Outputs:\n# Public Key:  Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n# Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n# → paste into .env.local' }],
      },
    ],
  },
  {
    id: 'auth', phase: '03', title: 'WorkOS AuthKit', status: 'done', tag: 'Setup', time: '~20 min',
    summary: 'SSO via WorkOS AuthKit. No PHI attributes in the user pool — identity is resolved server-side against the facility roster at request time.',
    sections: [
      {
        heading: 'WorkOS dev app setup',
        body: 'Create a new application in the WorkOS dashboard. Set the redirect URI to http://localhost:3000/callback for local development. Under "User Management" enable AuthKit (hosted auth). Copy the API key and client ID to .env.local.',
        checklist: [
          'Create WorkOS application in dashboard',
          'Set redirect URI: http://localhost:3000/callback',
          'Enable AuthKit under User Management',
          'Copy WORKOS_API_KEY and WORKOS_CLIENT_ID to .env.local',
          'Add a test user in WorkOS → Users',
        ],
      },
      {
        heading: 'Auth flow',
        body: 'The app uses @workos-inc/authkit-nextjs. The middleware at apps/web/src/middleware.ts protects all /dashboard/* routes. Unauthenticated requests are redirected to the WorkOS-hosted sign-in page. The callback at /callback exchanges the code for a session and sets an encrypted cookie.',
        commands: [
          { label: 'middleware protects these paths', code: 'export const config = {\n  matcher: [\'/dashboard/:path*\'],\n}' },
        ],
        warnings: [
          'WorkOS AuthKit stores the session in an encrypted cookie — no session table or Redis required for the pilot. Re-evaluate for scale.',
          'PHI never flows through WorkOS. The user pool stores only role and facility assignment. Resident identity mapping lives in the ambientcloud backend.',
        ],
      },
    ],
  },
  {
    id: 'dev', phase: '04', title: 'Development Server', status: 'done', tag: 'Development', time: '< 1 min start',
    summary: 'Next.js 16 with Turbopack. HMR on all routes. pnpm dev from repo root starts both apps/web and watches packages/ui.',
    sections: [
      {
        heading: 'Start the dev server',
        commands: [
          { label: 'from repo root — starts all workspace apps', code: 'pnpm dev' },
          { label: 'or target web app only', code: 'pnpm --filter @ambient/web dev' },
        ],
        body: 'Opens at http://localhost:3000. Redirects unauthenticated users to WorkOS sign-in. After login, lands on /dashboard/overview.',
      },
      {
        heading: 'Route map',
        table: {
          cols: ['Route', 'Purpose'],
          rows: [
            ['/dashboard/overview',      'Floor-level status grid + live alert feed'],
            ['/dashboard/floormap',      'Room layout with live status indicators'],
            ['/dashboard/alerts',        'Chronological alert log with filter controls'],
            ['/dashboard/reports',       'Shift and weekly summary reports'],
            ['/dashboard/analytics',     'Activity trends across residents (Nivo + Recharts)'],
            ['/dashboard/browse',        'Search and filter room history'],
            ['/dashboard/room/[roomId]', 'Per-room detail with Ella Memory narrative'],
          ],
        },
      },
      {
        heading: 'Shared UI package',
        body: 'packages/ui exports @ambient/ui. Components added via shadcn CLI land in packages/ui/src/components/ — not apps/web. This ensures the family-facing app and any future surfaces share the same design tokens.',
        commands: [
          { label: 'add a shadcn component to packages/ui', code: 'cd packages/ui\npnpm dlx shadcn@latest add button\n# adds to packages/ui/src/components/ui/button.tsx' },
        ],
        warnings: ['Never run the shadcn CLI inside apps/web directly. Components must live in packages/ui to be shareable.'],
      },
    ],
  },
  {
    id: 'api', phase: '05', title: 'API Integration', status: 'pending', tag: 'Development', time: 'reference',
    summary: 'ambientcloud FastAPI backend behind Cognito. The web app calls it with JWT bearer tokens derived from the WorkOS session.',
    sections: [
      {
        heading: 'Auth token flow',
        body: 'WorkOS AuthKit issues a session cookie. Server components extract the session and exchange it for a Cognito JWT via the identity-overlay helper. API calls are made server-side (Route Handlers or Server Components) — the Cognito JWT never reaches the browser.',
        commands: [
          { label: 'example server-side API call', code: `// apps/web/src/lib/api.ts
import { getSession } from '@workos-inc/authkit-nextjs';

export async function fetchRoomEvents(roomId: string) {
  const { accessToken } = await getSession();
  const res = await fetch(
    \`\${process.env.NEXT_PUBLIC_API_URL}/rooms/\${roomId}/events\`,
    { headers: { Authorization: \`Bearer \${accessToken}\` }, cache: 'no-store' },
  );
  if (!res.ok) throw new Error(\`API \${res.status}\`);
  return res.json();
}` }],
        warnings: ['NEXT_PUBLIC_API_URL is public only because Server Components need it at runtime. The actual API calls are server-side — the URL is not sensitive.'],
      },
      {
        heading: 'Key API endpoints (ambientcloud)',
        table: {
          cols: ['Endpoint', 'Returns'],
          rows: [
            ['GET /floors/{floorId}/rooms', 'Room list with live presence status'],
            ['GET /rooms/{roomId}/events', 'Sensor event stream for a room (cursor-paginated)'],
            ['GET /rooms/{roomId}/narrative', 'Ella Memory overnight narrative for the room'],
            ['GET /alerts', 'Active alert feed — fall, absence, distress'],
            ['GET /analytics/trends', 'Aggregated movement trends (anonymized)'],
          ],
        },
      },
    ],
  },
  {
    id: 'realtime', phase: '06', title: 'Real-Time Alerts', status: 'pending', tag: 'Development', time: '~2 hr setup',
    summary: 'Fall alerts reach nurses via Web Push (background) and a WebSocket-backed live feed on the dashboard (foreground). Both paths are independent.',
    sections: [
      {
        heading: 'Web Push — background alerts',
        body: 'The browser subscribes to push via the /api/push/subscribe route. The subscription is forwarded to ambientcloud which holds it and triggers a push when a fall is confirmed. The service worker at apps/web/public/sw.js shows a native notification.',
        commands: [
          { label: 'subscribe flow (client)', code: `const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
});
await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify(sub),
});` },
          { label: 'test a push from the server', code: "curl -X POST https://<your-api>/push/test \\\n  -H 'Authorization: Bearer <token>' \\\n  -d '{\"roomId\": \"312\", \"type\": \"fall\"}'" },
        ],
        warnings: ['Push subscriptions expire. Re-subscribe on every dashboard load and update ambientcloud if the subscription endpoint changes.'],
      },
      {
        heading: 'WebSocket live feed',
        body: 'The /dashboard/overview page opens a WebSocket connection to ambientcloud on mount. Events arrive within 500 ms of sensor ingestion. The connection is managed in a custom useAlertFeed hook — it reconnects automatically on drop.',
        commands: [{ label: 'useAlertFeed hook sketch', code: `// apps/web/src/hooks/useAlertFeed.ts
export function useAlertFeed() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  useEffect(() => {
    const ws = new WebSocket(\`\${WS_BASE}/alerts/stream\`);
    ws.onmessage = e => setEvents(prev => [JSON.parse(e.data), ...prev].slice(0, 200));
    ws.onerror = () => setTimeout(() => { /* reconnect */ }, 2000);
    return () => ws.close();
  }, []);
  return events;
}` }],
        warnings: ['Do not use Server-Sent Events for the live feed — ambientcloud uses a bidirectional protocol. SSE only works for the read-only alert stream.'],
      },
    ],
  },
  {
    id: 'dashboard', phase: '07', title: 'Dashboard Features', status: 'pending', tag: 'Feature', time: 'ongoing',
    summary: 'Seven routes covering floor status, alert log, reports, analytics, and per-room drill-down. All routes are server-rendered with client-side hydration for live data.',
    sections: [
      {
        heading: 'Overview + floor map',
        body: 'The overview grid shows every room as a status card: green = quiet, amber = movement, red = alert. Clicking a card navigates to /dashboard/room/[roomId]. The floor map renders an SVG room layout with the same color coding — room positions are configurable in admin.',
        checklist: [
          'Room status cards render with correct color coding',
          'Live WebSocket feed updates cards without full-page refresh',
          'Clicking a room card navigates to the room detail page',
          'Floor map SVG positions match the physical room layout',
          'Quiet-time badge shows correctly after page refresh (avoid client-only timer — derive from API)',
        ],
      },
      {
        heading: 'Alerts + reports',
        body: 'The alert log is filterable by type (fall / absence / distress), room, and time range. Reports are generated server-side on demand — a PDF export button triggers /api/reports/[type] which calls ambientcloud and returns a signed S3 URL to the generated PDF.',
        warnings: [
          'Alert deduplication window is 800 ms in the sensor pipeline — a UI-level dedup is still needed for the WebSocket feed to handle network retransmission.',
          'PDF generation is async — poll /api/reports/status/[jobId] and show a loading state; do not block the UI on the initial request.',
        ],
      },
      {
        heading: 'Analytics charts',
        body: 'The analytics view uses Nivo for the resident heatmap (24-hour hourly breakdown) and Recharts for trend lines. All chart data is aggregated and anonymized — no room IDs or resident handles appear in chart API responses.',
        commands: [{ label: 'example Nivo heatmap config', code: `<HeatMap
  data={hourlyData}
  keys={HOURS}
  indexBy="day"
  colors={{ scheme: 'blues' }}
  margin={{ top: 20, right: 60, bottom: 60, left: 80 }}
  axisTop={null}
  axisBottom={{ tickSize: 0, legend: 'Hour of day' }}
/>` }],
        warnings: ['Nivo charts break on Safari 17 due to a linearGradient scoping issue. Move gradientUnits to userSpaceOnUse in any SVG gradients.'],
      },
    ],
  },
  {
    id: 'ella', phase: '08', title: 'Ella Memory Narrative', status: 'pending', tag: 'Feature', time: 'reference',
    summary: 'Plain-language overnight summary per resident generated from sensor data. Surfaces on /dashboard/room/[roomId] to give nurses context before entering.',
    sections: [
      {
        heading: 'What it shows',
        body: 'The narrative is a 3–5 sentence summary: when the resident was last active, sleep quality estimate (based on movement frequency 10 PM–6 AM), whether any alerts fired overnight, and a one-line recommendation (e.g. "Restless night — check in early"). Generated by ambientcloud on a nightly cron and cached per room.',
        table: {
          cols: ['Field', 'Source', 'Notes'],
          rows: [
            ['Last active time', 'Sensor event stream', 'Time of last confirmed movement'],
            ['Sleep quality', 'Movement frequency model', 'Low/Medium/High — not a medical assessment'],
            ['Overnight alerts', 'Alert log', 'Count + types — links to alert detail'],
            ['Recommendation', 'Rule-based + LLM', 'Short action prompt for nursing staff'],
          ],
        },
        warnings: [
          'The narrative is a care-coordination aid, not a clinical assessment. Display a disclaimer and do not use medical language.',
          'Narrative generation runs at 6 AM local time. If a nurse views the page before that, show the previous night\'s narrative with a staleness indicator.',
        ],
      },
      {
        heading: 'Fetching the narrative',
        commands: [{ label: 'room detail server component', code: `// apps/web/src/app/dashboard/room/[roomId]/page.tsx
import { fetchRoomNarrative } from '@/lib/api';

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const { narrative, generatedAt } = await fetchRoomNarrative(params.roomId);
  return (
    <section>
      <p className="text-sm text-muted-foreground">
        Generated {formatRelative(generatedAt)}
      </p>
      <p className="text-base leading-relaxed">{narrative}</p>
    </section>
  );
}` }],
      },
    ],
  },
  {
    id: 'deident', phase: '09', title: 'De-identification', status: 'done', tag: 'Feature', time: 'reference',
    summary: 'PHI never touches the web app server. Resident names are resolved client-side from an encrypted per-session keyring unlocked at shift start.',
    sections: [
      {
        heading: 'PHI boundary',
        body: 'The ambientcloud backend stores room IDs and sensor data — no resident names, DOBs, or identifiers. The identity-overlay maps room IDs to resident names inside the browser using a session-scoped keyring. The keyring is loaded from the facility EMR at shift start, encrypted with the nurse\'s session key, and never sent to the web app server.',
        table: {
          cols: ['Layer', 'Stores', 'Never stores'],
          rows: [
            ['ambientcloud (server)', 'Room IDs, sensor events, alert records', 'Resident names, DOBs, MRNs'],
            ['ambientweb server', 'Auth sessions, WorkOS tokens', 'Any PHI — not even room-to-resident mapping'],
            ['Browser (session)', 'Encrypted identity keyring', 'Plaintext PHI outside the keyring'],
          ],
        },
        warnings: [
          'The identity overlay is the only place resident names appear in the UI. If the keyring is not loaded (shift not started), the UI shows room IDs only.',
          'Do not log or persist any data that passes through the identity overlay — it is PHI. Console.log, Sentry, and analytics tools must be audited before enabling.',
        ],
      },
      {
        heading: 'Shift-start unlock flow',
        checklist: [
          'Nurse logs in via WorkOS AuthKit',
          'Dashboard prompts "Start shift" on first /dashboard visit',
          'Shift-start modal fetches encrypted keyring from EMR integration endpoint',
          'Keyring decrypted in-browser with nurse\'s session key — never sent to server',
          'ResidentBadge component reads from the in-memory keyring to render names',
          'Keyring is cleared from memory on logout or session expiry',
        ],
      },
    ],
  },
  {
    id: 'build', phase: '10', title: 'Production Build', status: 'pending', tag: 'Production', time: '~2–3 min',
    summary: 'next build via pnpm. TypeScript strict mode + noUncheckedIndexedAccess — the build fails on type errors. Bundle analysis via @next/bundle-analyzer.',
    sections: [
      {
        heading: 'Build and type-check',
        commands: [
          { label: 'production build', code: 'pnpm --filter @ambient/web build' },
          { label: 'type-check without building', code: 'pnpm --filter @ambient/web typecheck\n# runs: tsc --noEmit' },
          { label: 'lint', code: 'pnpm --filter @ambient/web lint' },
        ],
        warnings: [
          'noUncheckedIndexedAccess is enabled — array[i] is T | undefined, not T. Pattern: const item = arr[i]; if (!item) return;',
          'React 19 strict mode double-invokes effects in dev. Effects that call APIs must be idempotent or use AbortController to cancel the second invocation.',
        ],
      },
      {
        heading: 'Bundle analysis',
        commands: [
          { label: 'enable analyzer then build', code: 'ANALYZE=true pnpm --filter @ambient/web build\n# Opens .next/analyze/ — check client bundle for Nivo/Recharts size' },
        ],
        body: 'Nivo imports must be tree-shaken — import { HeatMap } from \'@nivo/heatmap\', not from \'@nivo/core\'. Recharts is imported the same way. Verify neither is bundled in full in the client chunk.',
        artifacts: [
          { file: '.next/analyze/client.html',  role: 'Client-side bundle treemap — check chart library sizes', size: 'open in browser' },
          { file: '.next/analyze/nodejs.html',  role: 'Server-side bundle — check for accidental PHI libraries', size: 'open in browser' },
        ],
      },
    ],
  },
  {
    id: 'deploy', phase: '11', title: 'Vercel Deployment', status: 'pending', tag: 'Production', time: '~3 min',
    summary: 'Deployed to Vercel. Preview deploys on every PR. Production on merge to main. Environment variables managed in Vercel dashboard, not in the repo.',
    sections: [
      {
        heading: 'Initial Vercel setup',
        commands: [
          { label: 'link to Vercel project', code: 'cd apps/web\nvercel link\n# Select the ambientweb project or create new' },
          { label: 'set environment variables', code: 'vercel env add WORKOS_API_KEY production\nvercel env add WORKOS_CLIENT_ID production\nvercel env add WORKOS_REDIRECT_URI production\nvercel env add NEXT_PUBLIC_API_URL production\nvercel env add VAPID_PRIVATE_KEY production\nvercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production' },
        ],
        body: 'The Vercel project root must be set to apps/web (not the monorepo root) in the Vercel project settings. Install command: pnpm install --frozen-lockfile. Build command: pnpm build.',
        warnings: ['WORKOS_REDIRECT_URI for production must be https://ellamemory.com/callback — update in WorkOS dashboard and Vercel env simultaneously.'],
      },
      {
        heading: 'Preview vs production',
        table: {
          cols: ['Trigger', 'Environment', 'WorkOS redirect URI'],
          rows: [
            ['Push to feature branch', 'Preview', 'https://<preview-url>.vercel.app/callback'],
            ['Merge to main', 'Production', 'https://ellamemory.com/callback'],
          ],
        },
        warnings: ['WorkOS applications support only one redirect URI per environment. Add preview deploy URLs individually — or use a wildcard domain if WorkOS supports it for your plan.'],
      },
    ],
  },
  {
    id: 'ci', phase: '12', title: 'CI Pipeline', status: 'pending', tag: 'Production', time: '~1 hr setup',
    summary: 'GitHub Actions runs type-check, lint, and build on every PR. Vercel preview deploy is the integration check — no separate test runner yet.',
    sections: [
      {
        heading: 'GitHub Actions workflow',
        commands: [{ label: '.github/workflows/web-ci.yml', code: `name: Web CI
on:
  push:    { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm --filter @ambient/web typecheck

      - name: Lint
        run: pnpm --filter @ambient/web lint

      - name: Build
        run: pnpm --filter @ambient/web build
        env:
          WORKOS_API_KEY: \${{ secrets.WORKOS_API_KEY }}
          WORKOS_CLIENT_ID: \${{ secrets.WORKOS_CLIENT_ID }}
          WORKOS_REDIRECT_URI: https://ellamemory.com/callback
          NEXT_PUBLIC_API_URL: https://api.ellamemory.com
          VAPID_PRIVATE_KEY: \${{ secrets.VAPID_PRIVATE_KEY }}
          NEXT_PUBLIC_VAPID_PUBLIC_KEY: \${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}` }],
      },
      {
        heading: 'Secrets setup',
        commands: [
          { label: 'add secrets to GitHub repo', code: 'gh secret set WORKOS_API_KEY\ngh secret set WORKOS_CLIENT_ID\ngh secret set VAPID_PRIVATE_KEY\ngh secret set NEXT_PUBLIC_VAPID_PUBLIC_KEY' },
        ],
        warnings: [
          'Do not add NEXT_PUBLIC_* keys as GitHub secrets if they appear in build output — they will be visible in the Vercel deployment anyway. Only WORKOS_API_KEY, VAPID_PRIVATE_KEY, and WORKOS_CLIENT_ID need to be secrets.',
          'Add E2E tests (Playwright) before the pilot goes live. The CI build check catches type errors but not runtime regressions in the WebSocket feed or identity overlay.',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const STACK_SPECS = [
  { label: 'Framework',  value: 'Next.js 16',      sub: 'App Router · Turbopack · React 19' },
  { label: 'Language',   value: 'TypeScript 5.6',  sub: 'Strict · noUncheckedIndexedAccess' },
  { label: 'Styling',    value: 'Tailwind CSS 4',  sub: 'shadcn/ui new-york · @ambient/ui' },
  { label: 'Auth',       value: 'WorkOS AuthKit',  sub: 'SSO · no PHI in user pool' },
  { label: 'Charts',     value: 'Nivo + Recharts', sub: 'Activity trends · heatmaps' },
  { label: 'Push',       value: 'Web Push API',    sub: 'VAPID · fall alert notifications' },
];

const CHECKLIST_ITEMS = [
  'Node 20 + pnpm 9 installed',
  '.env.local configured from .env.example',
  'WorkOS dev application created',
  'VAPID keys generated and added to .env.local',
  'pnpm install clean',
  'Dev server running at localhost:3000',
  'WorkOS SSO login working',
  'Dashboard overview rendering',
  'Floor map rendering',
  'Alert log rendering',
  'Room detail page rendering',
  'Ella Memory narrative fetching',
  'Web Push subscription working',
  'WebSocket alert feed live',
  'API integration connected (ambientcloud)',
  'Identity overlay / shift-start tested',
  'TypeScript build clean (no errors)',
  'ESLint passing',
  'Production build (next build) succeeds',
  'Vercel preview deploy working',
  'Vercel production deploy live at ellamemory.com',
  'CI pipeline passing on every PR',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4, 5, 6]);

const OPEN_DECISIONS = [
  'Real-time strategy: WebSocket direct to ambientcloud vs. Vercel Edge Event Stream for alert feed',
  'Resident ID overlay: session-scoped keyring (current) vs. server-side per-request resolution with encrypted audit log',
  'Offline support: service worker + cached floor map for intermittent hospital Wi-Fi',
  'E2E testing: Playwright on Vercel preview deploys vs. manual QA for pilot',
  'i18n: English-only MVP or early multilingual prep for Spanish-speaking nursing staff',
];

// ── Page component ─────────────────────────────────────────────────────────────

const LS_KEY = 'ambient-webapp-checklist-v1';

export default function WebAppPage() {
  const [active, setActive]       = useState('repo');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [checked, setChecked]     = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag] = useState('All');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  function toggleChecked(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const navigate = useCallback((dir: 1 | -1) => {
    setActive(prev => {
      const idx = STEPS.findIndex(s => s.id === prev);
      const next = idx + dir;
      return next >= 0 && next < STEPS.length ? STEPS[next].id : prev;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'j') navigate(1);
      if (e.key === 'k') navigate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  function toggleSection(key: string) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }
  function expandAll()  { setCollapsed({}); }
  function collapseAll() {
    const all: Record<string, boolean> = {};
    step.sections.forEach((_, i) => { all[`${active}-${i}`] = true; });
    setCollapsed(prev => ({ ...prev, ...all }));
  }

  const TAGS = ['All', 'Setup', 'Development', 'Feature', 'Production'];
  const visibleSteps = filterTag === 'All' ? STEPS : STEPS.filter(s => s.tag === filterTag);
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => {
    warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0);
  });

  function isSectionOpen(key: string) {
    return focusMode ? true : collapsed[key] !== true;
  }

  return (
    <div className="app" style={{ background: '#F1F3F6', minHeight: '100vh', position: 'relative' }}>
      <LissajousCanvas />

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '4px 6px', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#6B7280' }}>Web App</em>
              </span>
            </div>
          </Link>

          {/* Progress bar */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7C3AED', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #7C3AED, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #7C3AED' : '1px solid #E5E7EB', background: filterTag === tag ? '#FAF5FF' : '#FFFFFF', color: filterTag === tag ? '#7C3AED' : '#6B7280', transition: 'all 0.12s' }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PIPELINE_PHASES.map(phase => {
            const phaseSteps = phase.ids
              .map(id => STEPS.find(s => s.id === id)!)
              .filter(s => filterTag === 'All' || s.tag === filterTag);
            if (phaseSteps.length === 0) return null;
            return (
              <div key={phase.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', padding: '0 8px', marginBottom: 5 }}>{phase.label}</div>
                {phaseSteps.map(s => {
                  const sc = SC[s.status];
                  const isActive = active === s.id;
                  const warns = warnCounts[s.id] ?? 0;
                  return (
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? '#FAF5FF' : 'transparent', border: isActive ? '1px solid #DDD6FE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#7C3AED' : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? '#111827' : '#374151', fontWeight: isActive ? 500 : 400, lineHeight: 1.3 }}>{s.title}</span>
                      {warns > 0 && (
                        <span title={`${warns} warning${warns > 1 ? 's' : ''}`} style={{ fontSize: 9, background: '#FEF9C3', color: '#A16207', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--mono)', flexShrink: 0 }}>⚠{warns}</span>
                      )}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />
            <a href="https://github.com/ambientintel/ambientweb" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientweb</a>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['j','k'] as const).map(k => (
              <kbd key={k} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, background: '#F9FAFB', border: '1px solid #E5E7EB', fontFamily: 'var(--mono)', fontSize: 11, color: '#6B7280', boxShadow: '0 1px 0 #D1D5DB' }}>{k}</kbd>
            ))}
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>navigate steps</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ padding: '24px 36px 60px', maxWidth: 1200, width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 22, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · Nurse Dashboard</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              Ella Memory <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Web App</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 500, lineHeight: 1.6 }}>
              Development, deployment, and feature guide for the ambientweb nurse dashboard.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/engineering" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Engineering
            </Link>
            <a href="https://github.com/ambientintel/ambientweb" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              ambientintel/ambientweb
            </a>
          </div>
        </div>

        {/* Pipeline strip */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content' }}>
            {PIPELINE_PHASES.map((phase, pi) => (
              <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: pi === 0 ? '0 24px 0 0' : '0 24px', borderRight: pi < PIPELINE_PHASES.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>{phase.label}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {phase.ids.map((id, si) => {
                    const s = STEPS.find(x => x.id === id)!;
                    const sc = SC[s.status];
                    const isActive = active === id;
                    return (
                      <span key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        {si > 0 && <span style={{ display: 'inline-block', width: 12, height: 1, background: '#E5E7EB', margin: '0 -2px', alignSelf: 'center' }} />}
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? '1.5px solid #7C3AED' : `1px solid ${sc.border}`, background: isActive ? '#FAF5FF' : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? '#7C3AED' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stack spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 22 }}>
          {STACK_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '13px 15px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 4 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Main two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 22, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = SC[step.status];
              const tagStyle = TAG_STYLE[step.tag] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div style={{ padding: '20px 24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#7C3AED', background: '#FAF5FF', border: '1px solid #DDD6FE', borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #7C3AED' : '1px solid #E5E7EB', background: focusMode ? '#FAF5FF' : '#FFFFFF', color: focusMode ? '#7C3AED' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h2M9 6h2M6 1v2M6 9v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                        {focusMode ? 'Focus ON' : 'Focus'}
                      </button>
                      <button onClick={expandAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Expand all</button>
                      <button onClick={collapseAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Collapse all</button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sc.label}</span>
                      </div>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: '0 0 8px', color: '#111827', letterSpacing: '-0.01em' }}>{step.title}</h2>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: 13.5, lineHeight: 1.65 }}>{step.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {step.sections.map((sec, si) => {
              const key = `${step.id}-${si}`;
              const isOpen = isSectionOpen(key);
              const hasContent = !!(sec.commands?.length || sec.artifacts?.length || sec.warnings?.length || sec.table || sec.checklist);
              const hasOnlyBody = !hasContent && !!sec.body;
              if (focusMode && hasOnlyBody) return null;

              return (
                <div key={key} style={{ marginBottom: 10, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {sec.heading && (
                    <button onClick={() => toggle(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: isOpen ? '#FAFBFC' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none', textAlign: 'left' }}>
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? '#7C3AED' : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
                      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>{sec.heading}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 13, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
                    </button>
                  )}
                  {isOpen && (
                    <div style={{ padding: '16px 18px 18px' }}>
                      {!focusMode && sec.body && <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.7 }}>{sec.body}</p>}

                      {sec.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>$ {cmd.label}</div>}
                          <div style={{ position: 'relative', background: '#1E2433', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '14px 48px 14px 18px' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{cmd.code}</pre>
                            <CopyBtn code={cmd.code} />
                          </div>
                        </div>
                      ))}

                      {sec.artifacts && sec.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7 }}>Artifacts</div>
                          {sec.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#FAF5FF', border: '1px solid #DDD6FE', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#7C3AED', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#6D28D9', marginBottom: 2 }}>{a.file}</div>
                                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{a.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.table && (
                        <div style={{ marginTop: 14, borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC' }}>
                                {sec.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '9px 13px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.55, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {!focusMode && sec.checklist && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {sec.checklist.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 7 }}>
                              <span style={{ color: '#7C3AED', fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
                              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 10, padding: '10px 13px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginTop: 9 }}>
                          <span style={{ color: '#D97706', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
                          <p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Prev / Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {stepIdx > 0
                ? <button onClick={() => setActive(STEPS[stepIdx - 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    ← <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>k</kbd> {STEPS[stepIdx - 1].title}
                  </button>
                : <div />}
              {stepIdx < STEPS.length - 1
                ? <button onClick={() => setActive(STEPS[stepIdx + 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {STEPS[stepIdx + 1].title} <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>j</kbd> →
                  </button>
                : <div />}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ position: 'sticky', top: 24 }}>

            {/* Interactive checklist */}
            <div style={{ padding: '16px 16px 14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Launch Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#7C3AED' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 11.5, color: done ? '#374151' : '#9CA3AF', lineHeight: 1.45, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#D1D5DB' }}>{item}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 11, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#7C3AED', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #7C3AED, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D97706', marginBottom: 11 }}>Open Decisions</div>
              {OPEN_DECISIONS.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#D97706', opacity: 0.7, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  function toggle(key: string) { toggleSection(key); }
}
