'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';


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
  'Setup':     { bg: '#EFF6FF', color: '#1D4ED8' },
  'Build':     { bg: '#F0FDF4', color: '#15803D' },
  'Integrate': { bg: '#FFF7ED', color: '#C2410C' },
  'Ship':      { bg: '#FAF5FF', color: '#7E22CE' },
};

const PIPELINE_PHASES = [
  { label: 'Setup',     ids: ['monorepo', 'env-config', 'ui-pkg', 'auth'] },
  { label: 'Build',     ids: ['deident', 'dashboard', 'ella-room', 'analytics'] },
  { label: 'Integrate', ids: ['web-push', 'api-routes'] },
  { label: 'Ship',      ids: ['prod-build', 'deploy', 'pilot-validation'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'monorepo', phase: '01', title: 'Monorepo Bootstrap', status: 'done', tag: 'Setup', time: '~30 min',
    summary: 'pnpm 9 workspace with two packages: apps/web (Next.js 16 nurse dashboard) and packages/ui (shared design tokens and components). Node 20 required.',
    sections: [
      {
        heading: 'Clone and install',
        commands: [
          { label: 'clone repo', code: 'git clone https://github.com/ambientintel/ambientweb\ncd ambientweb\ncorepack enable\npnpm install' },
          { label: 'verify workspace packages', code: 'pnpm list -r --depth=0\n# Should show:\n#   ambientweb (root)\n#   @ambient/web   → apps/web\n#   @ambient/ui    → packages/ui' },
        ],
        artifacts: [
          { file: 'pnpm-workspace.yaml',      role: 'Declares workspace packages: apps/* and packages/*.' },
          { file: 'apps/web/package.json',    role: 'Next.js 16 app. Depends on @ambient/ui via workspace:*.' },
          { file: 'packages/ui/package.json', role: 'Shared design tokens, CSS variables, and base components.' },
        ],
      },
      {
        heading: 'Dev server',
        commands: [
          { label: 'start dev server (Turbopack)', code: 'pnpm --filter @ambient/web dev\n# Starts at http://localhost:3000\n# Uses Next.js Turbopack for fast HMR' },
          { label: 'build ui package first if types fail', code: 'pnpm --filter @ambient/ui build\npnpm --filter @ambient/web dev' },
        ],
        warnings: [
          'The root package.json dev script runs the web app only. To rebuild the ui package on changes, run pnpm --filter @ambient/ui build --watch in a second terminal.',
        ],
      },
      {
        heading: 'TypeScript strict mode',
        body: 'apps/web/tsconfig.json enables strict, noUncheckedIndexedAccess, and exactOptionalPropertyTypes. All array index access returns T | undefined — guard all index reads before use.',
        artifacts: [
          { file: 'apps/web/tsconfig.json', role: 'Strict TypeScript config. noUncheckedIndexedAccess will surface bugs hidden by loose array access.' },
        ],
      },
    ],
  },
  {
    id: 'env-config', phase: '02', title: 'Environment Config', status: 'done', tag: 'Setup', time: '~1 hr',
    summary: 'Seven environment variables required. WorkOS and OpenAI keys provisioned per environment. Never commit .env.local to git.',
    sections: [
      {
        heading: 'Required variables',
        table: {
          cols: ['Variable', 'Source', 'Required for'],
          rows: [
            ['WORKOS_API_KEY',           'WorkOS dashboard → API Keys',           'Auth — all environments'],
            ['WORKOS_CLIENT_ID',         'WorkOS dashboard → Applications',        'Auth — all environments'],
            ['WORKOS_REDIRECT_URI',      'Set to https://<domain>/callback',       'Auth — must match WorkOS app config'],
            ['WORKOS_COOKIE_PASSWORD',   '32+ char random string',                 'Session cookie encryption'],
            ['OPENAI_API_KEY',           'OpenAI dashboard → API Keys',            'TTS playback (/api/speak)'],
            ['NEXT_PUBLIC_VAPID_KEY',    'Generated via web-push (see step 09)',   'Web Push — browser subscription'],
            ['VAPID_PRIVATE_KEY',        'Generated via web-push (see step 09)',   'Web Push — server send'],
          ],
        },
        commands: [
          { label: 'create .env.local', code: 'cp apps/web/.env.example apps/web/.env.local\n# Edit apps/web/.env.local with your values\n# NEVER commit .env.local — it is in .gitignore' },
        ],
      },
      {
        heading: 'Vercel environment variables',
        commands: [
          { label: 'push env vars to Vercel', code: 'vercel env add WORKOS_API_KEY production\nvercel env add WORKOS_CLIENT_ID production\nvercel env add WORKOS_REDIRECT_URI production\nvercel env add WORKOS_COOKIE_PASSWORD production\nvercel env add OPENAI_API_KEY production\nvercel env add NEXT_PUBLIC_VAPID_KEY production\nvercel env add VAPID_PRIVATE_KEY production\n\n# Verify:\nvercel env ls' },
          { label: 'pull env vars to local', code: 'vercel env pull apps/web/.env.local\n# Merges Vercel env vars into your local .env.local' },
        ],
        warnings: [
          'WORKOS_REDIRECT_URI must exactly match the URI configured in the WorkOS application. A mismatch causes a silent redirect_uri_mismatch error after SSO. For local dev use http://localhost:3000/callback.',
          'WORKOS_COOKIE_PASSWORD must be at least 32 characters. Rotating it invalidates all active sessions — coordinate with the pilot team before changing in production.',
        ],
      },
      {
        heading: 'WorkOS application setup',
        checklist: [
          'WorkOS application created for Ambient Intelligence in the WorkOS dashboard',
          'Redirect URI set to https://ellamemory.com/callback (production)',
          'Redirect URI set to http://localhost:3000/callback (development)',
          'AuthKit enabled on the WorkOS application',
          'Allowed domains configured for nurse user provisioning',
        ],
      },
    ],
  },
  {
    id: 'ui-pkg', phase: '03', title: 'UI Package', status: 'done', tag: 'Setup', time: '~2 hrs',
    summary: 'packages/ui exports Notion-inspired design tokens as CSS custom properties and a small set of base components used across the dashboard.',
    sections: [
      {
        heading: 'Design tokens',
        body: 'All tokens are CSS custom properties defined in packages/ui/src/tokens.css. The nurse dashboard uses a dark theme: --bg #1C2127, --surface-1 through --surface-3, --text through --text-4, --accent #2D72D2, and --sage #3DCC91 for resolved alerts.',
        artifacts: [
          { file: 'packages/ui/src/tokens.css',       role: 'Root CSS custom properties — background, surface, text, accent, status colors.' },
          { file: 'packages/ui/src/components/',       role: 'Base React components: Card, Badge, Spinner, StatusDot. Consumed by apps/web.' },
          { file: 'packages/ui/src/index.ts',          role: 'Package entry point — re-exports all components and token types.' },
        ],
      },
      {
        heading: 'Status color system',
        table: {
          cols: ['Status', 'CSS variable / hex', 'Usage'],
          rows: [
            ['Fall / High',   '#FF6B6B',          'Active fall alert, high-priority room indicator'],
            ['Movement / Med', '#FFC940',          'Motion detected, medium-priority alert'],
            ['Quiet / Low',   '#3DCC91 (--sage)',  'Room stable, resolved alert, Ella confirmed'],
            ['Offline',       'rgba(246,247,248,0.26) (--text-4)', 'Sensor offline, room unreachable'],
          ],
        },
      },
      {
        heading: 'Build and link',
        commands: [
          { label: 'build the ui package', code: 'pnpm --filter @ambient/ui build\n# Outputs to packages/ui/dist/\n# apps/web resolves @ambient/ui via workspace:* — no publish needed' },
          { label: 'type-check the package', code: 'pnpm --filter @ambient/ui tsc --noEmit' },
        ],
      },
    ],
  },
  {
    id: 'auth', phase: '04', title: 'WorkOS Auth', status: 'done', tag: 'Setup', time: '~2 hrs',
    summary: 'AuthKit SSO integration via WorkOS SDK. Three API routes handle sign-in, callback, sign-out, and session reads. Sessions are encrypted in an HttpOnly cookie.',
    sections: [
      {
        heading: 'Auth API routes',
        artifacts: [
          { file: 'apps/web/src/app/api/auth/signin/route.ts',   role: 'Redirects to WorkOS hosted SSO login page with PKCE.' },
          { file: 'apps/web/src/app/api/auth/callback/route.ts', role: 'Handles OAuth callback, exchanges code for session, sets encrypted cookie.' },
          { file: 'apps/web/src/app/api/auth/signout/route.ts',  role: 'Clears session cookie and redirects to WorkOS logout endpoint.' },
          { file: 'apps/web/src/app/api/auth/me/route.ts',       role: 'Returns current user session as JSON. Used by AuthButton to hydrate the UI.' },
        ],
      },
      {
        heading: 'AuthButton component',
        body: 'The AuthButton is a client component that fetches /api/auth/me on mount. It renders a sign-in link when unauthenticated and an avatar + sign-out link when authenticated. It never exposes session data to the page-level server component.',
        artifacts: [
          { file: 'apps/web/src/components/AuthButton.tsx', role: 'Client component. Polls /api/auth/me, renders user avatar or sign-in CTA.' },
        ],
        commands: [
          { label: 'test auth flow locally', code: '# 1. Start dev server\npnpm --filter @ambient/web dev\n\n# 2. Visit http://localhost:3000\n# 3. Click "Sign in" → WorkOS hosted login\n# 4. Complete SSO → redirected to /callback\n# 5. Verify session: curl http://localhost:3000/api/auth/me' },
        ],
      },
      {
        heading: 'Session cookie spec',
        table: {
          cols: ['Attribute', 'Value', 'Reason'],
          rows: [
            ['Name',     'wos-session',   'WorkOS SDK default'],
            ['HttpOnly', 'true',          'Prevents XSS access to session token'],
            ['SameSite', 'Lax',           'CSRF protection for redirect flows'],
            ['Secure',   'true (prod)',   'HTTPS-only in production'],
            ['Encryption', 'AES-256-GCM', 'WORKOS_COOKIE_PASSWORD as key material via jose'],
          ],
        },
        warnings: [
          'The session cookie contains a WorkOS access token. The token is not a HIPAA identifier by itself, but the combination of session + keyring unlock constitutes PHI access. Ensure Secure and HttpOnly are enforced in production — Vercel sets these automatically on HTTPS.',
        ],
      },
    ],
  },
  {
    id: 'deident', phase: '05', title: 'De-identification Keyring', status: 'done', tag: 'Build', time: '~1 day',
    summary: 'Zero-cloud de-identification boundary: the API only returns coded PILOT-NNNN identifiers. Nurses load an AES-GCM encrypted keyring file at shift start. Name resolution happens in the browser — no PHI leaves the workstation.',
    sections: [
      {
        heading: 'Architecture',
        body: 'The ambientcloud backend assigns each resident a coded ID (PILOT-0001 through PILOT-0010) and never transmits names over the wire. The nurse\'s workstation holds an encrypted keyring file (keyring.enc) that maps coded IDs to resident names. At shift start, the nurse provides a passphrase; the app derives an AES-GCM key, decrypts the keyring in memory, and hydrates the UI. The passphrase and plaintext keyring are never persisted.',
        artifacts: [
          { file: 'apps/web/src/lib/keyring.ts',               role: 'AES-GCM encrypt/decrypt, PBKDF2 key derivation, in-memory identity map.' },
          { file: 'apps/web/src/components/KeyringUnlock.tsx',  role: 'Shift-start modal. Accepts passphrase, decrypts keyring, stores map in React context.' },
          { file: 'apps/web/src/context/IdentityContext.tsx',   role: 'React context that holds the decrypted PILOT-ID → name map for the session.' },
        ],
      },
      {
        heading: 'Keyring file format',
        commands: [
          { label: 'generate a keyring for the pilot', code: '# Run the provisioning script (requires Node 20):\nnode scripts/provision-keyring.mjs \\\n  --passphrase "shift-passphrase-here" \\\n  --map \'{"PILOT-0001":"Room 301 Resident","PILOT-0002":"Room 302 Resident",...}\'\n  --out keyring.enc\n\n# keyring.enc: base64(iv + ciphertext + authTag)\n# Distribute securely — do NOT commit to git' },
          { label: 'verify decryption', code: 'node scripts/verify-keyring.mjs \\\n  --passphrase "shift-passphrase-here" \\\n  --keyring keyring.enc\n# Prints resolved names to stdout — for verification only' },
        ],
        warnings: [
          'keyring.enc must be distributed out-of-band (USB, encrypted email). Never store in git, Vercel env vars, or any cloud service. Compromise of keyring.enc + passphrase constitutes a HIPAA breach.',
          'The PBKDF2 iteration count is set to 310,000 (NIST SP 800-132 minimum for SHA-256). Do not reduce this — brute-force resistance is the only safeguard if keyring.enc is exfiltrated.',
        ],
      },
      {
        heading: 'De-identification compliance',
        table: {
          cols: ['Method', '45 CFR §164.514', 'How we comply'],
          rows: [
            ['Safe Harbor',    '§164.514(b)',  '18 identifiers removed from API response. Coded IDs are non-inferrable.'],
            ['Expert Method',  '§164.514(b)',  'Not used — Safe Harbor is sufficient for this pilot scope.'],
            ['Re-identification', '§164.514(c)', 'Keyring enables authorized re-identification on the local device only.'],
            ['Audit log',      '§164.312(b)',  'Shift unlock events logged to ambientcloud with user ID and timestamp.'],
          ],
        },
      },
    ],
  },
  {
    id: 'dashboard', phase: '06', title: 'Dashboard Overview', status: 'done', tag: 'Build', time: '~3 days',
    summary: 'Floor-level status grid showing all 10 MOH pilot rooms. Quick-stats bar, active alerts table, room card grid, and a live-feed ticker for real-time event awareness.',
    sections: [
      {
        heading: 'Route structure',
        artifacts: [
          { file: 'apps/web/src/app/dashboard/overview/page.tsx', role: 'Floor overview: stats bar, alerts table, room grid, live feed ticker.' },
          { file: 'apps/web/src/app/dashboard/alerts/page.tsx',   role: 'Full chronological alert log with status filter (All / Active / Ack / Resolved).' },
          { file: 'apps/web/src/app/dashboard/floormap/page.tsx', role: 'SVG heat-map of MOH 301–310 with per-room activity level and status color.' },
          { file: 'apps/web/src/app/dashboard/layout.tsx',        role: 'Shared layout: persistent left sidebar nav + rooms list with priority indicators.' },
        ],
      },
      {
        heading: 'Quick-stats bar',
        table: {
          cols: ['Stat', 'Data source', 'Update cadence'],
          rows: [
            ['Residents monitored', 'Length of ROOMS array',               'Static (pilot = 10)'],
            ['Active alerts',       'ALERTS.filter(a => a.status === "active")', 'Client state'],
            ['Falls today',         'ALERTS.filter today + fall type',     'Client state'],
            ['Stable rooms',        'ROOMS with no active alert',          'Derived'],
          ],
        },
      },
      {
        heading: 'Sidebar navigation',
        body: 'The dashboard layout sidebar has two sections: Views (Overview, Floor Map, Alerts, Reports, Analytics, Browse) and Rooms (MOH 301–310). Each room entry shows a priority dot — red for active fall, amber for motion, green for stable. Rooms are listed in room-number order.',
        warnings: [
          'Room data and alert data are currently hardcoded in component state. Connecting to the ambientcloud backend API is a pending step — see open decisions.',
        ],
      },
    ],
  },
  {
    id: 'ella-room', phase: '07', title: 'Room Detail + Ella', status: 'done', tag: 'Build', time: '~2 days',
    summary: 'Per-room view with active alert status, Ella AI daily narrative, text-to-speech playback, SVG activity sparkline, and acknowledge/dismiss actions.',
    sections: [
      {
        heading: 'Route and components',
        artifacts: [
          { file: 'apps/web/src/app/dashboard/room/[roomId]/page.tsx', role: 'Dynamic route. Renders room detail: alert card, Ella article, activity stats, sparkline.' },
          { file: 'apps/web/src/components/EllaArticle.tsx',           role: 'Ella Memory narrative: portrait, eyebrow (time range), paragraphs, accent callout, speak button.' },
          { file: 'apps/web/src/app/api/speak/route.ts',               role: 'POST /api/speak — proxies text to OpenAI TTS API, streams audio back as audio/mpeg.' },
        ],
      },
      {
        heading: 'Ella narrative',
        body: 'The Ella narrative is a two-paragraph AI-generated plain-language summary of the room\'s overnight sensor data. It is generated server-side (ambientcloud) and stored as structured JSON with eyebrow, paragraphs[], and callout fields. The EllaArticle component renders it with a decorative portrait and a speak button that triggers TTS playback.',
        commands: [
          { label: 'test TTS endpoint locally', code: 'curl -X POST http://localhost:3000/api/speak \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text":"Mrs. Chen had a calm night. No falls detected."}\' \\\n  --output test-audio.mp3\nopen test-audio.mp3' },
        ],
        warnings: [
          'OpenAI TTS audio may include the resident name if the keyring has been applied and the narrative text contains the resolved name. Treat TTS output as PHI — do not cache or log audio responses.',
        ],
      },
      {
        heading: 'Activity sparkline',
        body: 'The activity chart is a pure SVG sparkline comparing today\'s per-hour activity (walking minutes) against the 7-day average. It is rendered client-side from hardcoded mock data. The SVG viewBox is 300×80; today is a solid blue line, average is a dashed gray baseline.',
        commands: [
          { label: 'sparkline data shape', code: '// activityData: { hour: number; today: number; avg: number }[]\n// 24 entries — hours 0–23\n// today: walking minutes in that hour (0–60)\n// avg: 7-day rolling average for that hour' },
        ],
      },
      {
        heading: 'Alert actions',
        checklist: [
          'Acknowledge button: moves alert from active → acknowledged, records nurse ID + timestamp',
          'Dismiss button: moves alert to resolved with reason "dismissed by nurse"',
          'Action is optimistic in UI — server sync is pending ambientcloud API integration',
          'Acknowledged alerts stay visible in the room detail view until end-of-shift',
          'Fall alerts require acknowledge — dismiss is disabled for fall-type events',
        ],
      },
    ],
  },
  {
    id: 'analytics', phase: '08', title: 'Analytics & Charts', status: 'done', tag: 'Build', time: '~2 days',
    summary: 'Recharts for activity trends and response times. Nivo for alert distribution donut chart and risk heatmap. All charts use the @ambient/ui dark theme tokens.',
    sections: [
      {
        heading: 'Chart library split',
        table: {
          cols: ['Chart', 'Library', 'Route', 'Notes'],
          rows: [
            ['Activity trend (7-day)',       'Recharts AreaChart',     '/dashboard/analytics', 'Area fill uses --accent opacity gradient'],
            ['Alert distribution by room',   'Nivo ResponsivePie',     '/dashboard/analytics', 'Per-room slice color matches priority status'],
            ['Response time histogram',      'Recharts BarChart',      '/dashboard/analytics', 'X: response time buckets, Y: alert count'],
            ['Confidence trend',             'Recharts LineChart',     '/dashboard/analytics', 'Radar confidence score 0–1 over 30 days'],
            ['Risk score matrix',            'Nivo ResponsiveHeatMap', '/dashboard/analytics', 'Rooms × hours, color = composite risk score'],
          ],
        },
      },
      {
        heading: 'Theming Recharts',
        commands: [
          { label: 'use CSS variables in Recharts fills', code: '// Recharts does not read CSS vars directly in fill/stroke.\n// Read them at render time:\nconst accent = getComputedStyle(document.documentElement)\n  .getPropertyValue("--accent").trim();\n// → "#2D72D2"\n\n<Area fill={accent} fillOpacity={0.18} stroke={accent} strokeWidth={1.5} />' },
        ],
        artifacts: [
          { file: 'apps/web/src/app/dashboard/analytics/page.tsx', role: 'Full analytics page — imports Recharts and Nivo, wires chart data, applies dark theme.' },
        ],
        warnings: [
          'Nivo ResponsiveHeatMap requires a parent container with an explicit height. Wrap it in a div with style={{ height: 320 }} or the chart renders at 0px.',
        ],
      },
    ],
  },
  {
    id: 'web-push', phase: '09', title: 'Web Push', status: 'warning', tag: 'Integrate', time: '~1 day',
    summary: 'VAPID keys generated and deployed to Vercel. sw.js live at /public/sw.js. Bell toggle in overview header. New-alert detection on 30s poll fires /api/push/send. Subscribe/send routes live. Blocked on VERCEL_TOKEN: Edge Config ambient-push ecfg_wsm… needs a Vercel personal access token to persist subscriptions across sessions.',
    sections: [
      {
        heading: 'Generate VAPID keys',
        commands: [
          { label: 'generate VAPID key pair (one time)', code: 'node -e "\nconst webpush = require(\'web-push\');\nconst keys = webpush.generateVAPIDKeys();\nconsole.log(\'NEXT_PUBLIC_VAPID_KEY=\' + keys.publicKey);\nconsole.log(\'VAPID_PRIVATE_KEY=\' + keys.privateKey);\n"\n# Copy both keys to apps/web/.env.local\n# Add to Vercel env vars (see step 02)' },
          { label: 'register for push in the browser', code: '// In apps/web/src/lib/push.ts:\nconst reg = await navigator.serviceWorker.ready;\nconst sub = await reg.pushManager.subscribe({\n  userVisibleOnly: true,\n  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,\n});\nawait fetch(\'/api/push/subscribe\', {\n  method: \'POST\',\n  body: JSON.stringify(sub),\n  headers: { \'Content-Type\': \'application/json\' },\n});' },
        ],
        artifacts: [
          { file: 'apps/web/src/app/api/push/subscribe/route.ts', role: 'Stores browser push subscription (endpoint + keys) in server-side subscription store.' },
          { file: 'apps/web/src/app/api/push/send/route.ts',      role: 'POST /api/push/send — receives fall event from ambientcloud webhook, fans out to all subscribed browsers.' },
          { file: 'public/sw.js',                                  role: 'Service worker. Listens for push events, displays notification with room + alert type.' },
        ],
      },
      {
        heading: 'Service worker push handler',
        commands: [
          { label: 'push event handler (public/sw.js)', code: 'self.addEventListener(\'push\', event => {\n  const data = event.data?.json() ?? {};\n  event.waitUntil(\n    self.registration.showNotification(data.title ?? \'Ambient Alert\', {\n      body: data.body,\n      icon: \'/icon-192.png\',\n      badge: \'/icon-192.png\',\n      tag: data.roomId,           // deduplicates per room\n      renotify: true,             // vibrate again even if tag exists\n      data: { url: data.url },\n    })\n  );\n});\n\nself.addEventListener(\'notificationclick\', event => {\n  event.notification.close();\n  event.waitUntil(clients.openWindow(event.notification.data.url));\n});' },
        ],
        warnings: [
          'iOS Safari requires a PWA add-to-home-screen before push permissions are available. Nurses using Safari on iPad must install the PWA from the share sheet first. The manifest.json and apple-touch-icon are already wired in the layout.',
          'Web Push subscriptions expire. The subscribe endpoint should upsert, not insert — re-subscribe on app launch and update the stored subscription if the endpoint changes.',
        ],
      },
    ],
  },
  {
    id: 'api-routes', phase: '10', title: 'API Routes', status: 'done', tag: 'Integrate', time: '~1 day',
    summary: 'Implemented. Next.js catch-all proxy at /api/ambient/[...path] (GET/POST/PATCH) authenticates via USER_PASSWORD_AUTH (ella-web service Cognito account, custom:role=admin) and forwards to ambientcloud REST API. All dashboard pages now connected to live data. Health check endpoint at /api/health.',
    sections: [
      {
        heading: 'Route inventory',
        table: {
          cols: ['Route', 'Method', 'Auth required', 'Purpose'],
          rows: [
            ['/api/auth/signin',         'GET',   'No',  'Redirects to WorkOS SSO login'],
            ['/api/auth/callback',       'GET',   'No',  'OAuth callback — sets session cookie'],
            ['/api/auth/signout',        'GET',   'Yes', 'Clears cookie, redirects to WorkOS logout'],
            ['/api/auth/me',             'GET',   'No',  'Returns session user JSON or 401'],
            ['/api/speak',               'POST',  'Yes', 'Proxies text to OpenAI TTS, returns audio/mpeg'],
            ['/api/push/subscribe',      'POST/DELETE', 'Yes', 'Upserts/removes browser push subscription in Edge Config'],
            ['/api/push/send',           'POST',  'Internal', 'Fans out push to all subscribers — called by overview poll'],
            ['/api/ambient/[...path]',   'GET/POST/PATCH', 'service-account JWT', 'Full proxy to ambientcloud REST API'],
            ['/api/health',              'GET',   'No',  'Checks VAPID, VERCEL_TOKEN, Edge Config, service auth'],
          ],
        },
      },
      {
        heading: 'JWT validation with jose',
        commands: [
          { label: 'verify WorkOS session token', code: 'import { jwtVerify } from \'jose\';\n\nconst { payload } = await jwtVerify(\n  token,\n  new TextEncoder().encode(process.env.WORKOS_COOKIE_PASSWORD),\n  { algorithms: [\'HS256\'] }\n);\n// payload.sub = WorkOS user ID' },
        ],
        warnings: [
          '/api/speak does not require per-request auth validation — it relies on the session cookie. Ensure the route reads and validates the session before calling OpenAI, otherwise unauthenticated users can run up TTS costs.',
        ],
      },
      {
        heading: 'Webhook secret for push/send',
        commands: [
          { label: 'verify ambientcloud webhook signature', code: '// apps/web/src/app/api/push/send/route.ts\nconst sig = request.headers.get(\'x-ambient-sig\');\nconst expected = await hmacSHA256(\n  process.env.AMBIENT_WEBHOOK_SECRET!,\n  await request.text()\n);\nif (sig !== expected) return new Response(\'Unauthorized\', { status: 401 });' },
        ],
      },
    ],
  },
  {
    id: 'prod-build', phase: '11', title: 'Production Build', status: 'done', tag: 'Ship', time: '~30 min',
    summary: 'pnpm build passes with zero TypeScript errors and zero ESLint errors. Canvas effect TypeScript null narrowing fixed (const cvs = canvas pattern for nested closure). Build is clean and deployed to Vercel production.',
    sections: [
      {
        heading: 'Build sequence',
        commands: [
          { label: 'full monorepo build', code: '# Build ui package first, then the web app:\npnpm --filter @ambient/ui build\npnpm --filter @ambient/web build\n\n# Or from root (runs in dependency order):\npnpm build' },
          { label: 'type check only', code: 'pnpm --filter @ambient/web exec tsc --noEmit\n# Must exit 0 — strict mode + noUncheckedIndexedAccess\n# All array index access must be guarded' },
          { label: 'lint', code: 'pnpm --filter @ambient/web lint\n# Uses Next.js ESLint config + @typescript-eslint/recommended\n# Zero errors required for deployment' },
        ],
        artifacts: [
          { file: 'apps/web/.next/', role: 'Next.js build output. Static assets, server bundles, and route manifests. Not committed to git.' },
        ],
      },
      {
        heading: 'Bundle size targets',
        table: {
          cols: ['Route', 'First load JS target', 'Notes'],
          rows: [
            ['/dashboard/overview',   '< 120 kB gzip', 'No chart libraries — only status dots and tables'],
            ['/dashboard/analytics',  '< 280 kB gzip', 'Recharts + Nivo adds ~150 kB — lazy load these routes'],
            ['/dashboard/room/[id]',  '< 140 kB gzip', 'EllaArticle + sparkline SVG — no external chart deps'],
          ],
        },
        warnings: [
          'Recharts and Nivo together add ~180 kB gzip. Use next/dynamic with ssr: false for the analytics page to prevent server-rendering these heavy bundles and to keep the first-load JS budget under control.',
        ],
      },
    ],
  },
  {
    id: 'deploy', phase: '12', title: 'Vercel Deploy', status: 'done', tag: 'Ship', time: '~1 hr',
    summary: 'Live at ellamemory.com. Vercel production deploy on main branch. Service account (ella-web-service) Cognito password synced. Room sidebar loads from /api/ambient/subjects?facility_id=FAC-PILOT-001. WorkOS SSO active. Preview deploys on every PR.',
    sections: [
      {
        heading: 'Vercel project setup',
        commands: [
          { label: 'link project and deploy', code: 'cd apps/web\nvercel link\n# Select: ambientintel → ambientweb\n# Framework preset: Next.js\n# Root directory: apps/web\n\nvercel --prod\n# Deploys main branch to ellamemory.com' },
          { label: 'verify deployment', code: 'vercel ls\n# Shows recent deployments and their URLs\n\ncurl -I https://ellamemory.com/api/auth/me\n# → HTTP 401 (unauthenticated) — confirms route is live' },
        ],
        artifacts: [
          { file: 'apps/web/vercel.json', role: 'Vercel config: framework=nextjs, root=apps/web, build command, output directory.' },
        ],
      },
      {
        heading: 'Domain and DNS',
        table: {
          cols: ['Record type', 'Name', 'Value', 'Notes'],
          rows: [
            ['A',     'ellamemory.com',     '76.76.21.21',     'Vercel\'s global anycast IP'],
            ['CNAME', 'www.ellamemory.com', 'cname.vercel-dns.com', 'Apex redirect to www'],
          ],
        },
        commands: [
          { label: 'add domain to Vercel project', code: 'vercel domains add ellamemory.com\n# Vercel auto-provisions TLS certificate via Let\'s Encrypt' },
        ],
      },
      {
        heading: 'Preview deploys',
        body: 'Every pull request to ambientintel/ambientweb gets a preview deployment at a unique URL (*.vercel.app). Preview deploys use the Preview environment variables — ensure WORKOS_REDIRECT_URI includes the preview domain or use a wildcard callback in WorkOS.',
        warnings: [
          'WorkOS does not support wildcard redirect URIs. For PR preview deploys, add a dedicated development redirect URI in the WorkOS dashboard or use a fixed preview subdomain (e.g., preview.ellamemory.com).',
        ],
      },
    ],
  },
  {
    id: 'pilot-validation', phase: '13', title: 'Pilot Validation', status: 'pending', tag: 'Ship', time: '~1 week',
    summary: 'End-to-end smoke tests covering the full nurse workflow: auth, keyring unlock, dashboard overview, fall alert push notification, room detail + Ella TTS, and alert acknowledge.',
    sections: [
      {
        heading: 'Auth smoke test',
        commands: [
          { label: 'sign-in flow', code: '# 1. Visit https://ellamemory.com\n# 2. Click "Sign in" → WorkOS hosted login\n# 3. Authenticate with pilot nurse credentials\n# 4. Verify redirect to /dashboard/overview\n# 5. Verify user avatar appears in sidebar\n# 6. curl https://ellamemory.com/api/auth/me → { "id": "...", "email": "..." }' },
          { label: 'sign-out flow', code: '# 1. Click user avatar → "Sign out"\n# 2. Verify redirect to WorkOS logout\n# 3. Verify return to ellamemory.com home\n# 4. curl https://ellamemory.com/api/auth/me → 401' },
        ],
      },
      {
        heading: 'Fall alert E2E test',
        checklist: [
          'Push notification received in browser within 5 seconds of test fall event sent to /api/push/send',
          'Notification shows correct room number (MOH 3XX) and alert type (Fall Detected)',
          'Tapping notification opens correct room detail page (/dashboard/room/301)',
          'Active alert card visible at top of room detail page with Acknowledge button',
          'Acknowledge action moves alert to Acknowledged status without page reload',
          'Room sidebar indicator updates from red dot to amber dot after acknowledge',
        ],
      },
      {
        heading: 'Ella TTS validation',
        commands: [
          { label: 'test TTS on production', code: '# 1. Navigate to any room detail page\n# 2. Click the "Speak" button on the Ella article\n# 3. Verify audio plays within 3 seconds\n# 4. Verify audio contains the narrative text\n# 5. Check server logs — no PHI in request logs\n# 6. Verify speak button shows duration (e.g., "0:42")' },
        ],
        warnings: [
          'OpenAI TTS latency averages 1–3 seconds for a 200-word narrative. If latency exceeds 5 seconds in production, consider pre-generating audio at narrative-creation time and caching the audio URL in ambientcloud.',
          'Confirm that no resident names appear in Vercel function logs. The /api/speak route must not log the input text — only log the room ID and character count.',
        ],
      },
      {
        heading: 'Keyring unlock test',
        checklist: [
          'Keyring unlock modal appears on first dashboard load after fresh session',
          'Correct passphrase decrypts keyring and displays resolved names in room list',
          'Incorrect passphrase shows error — does not leak cipher details',
          'Browser refresh preserves session but re-requires keyring unlock (keyring is not persisted)',
          'Sign-out clears both session and in-memory keyring',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const APP_SPECS = [
  { label: 'Runtime',   value: 'Next.js 16',     sub: 'React 19 · App Router · Turbopack' },
  { label: 'Auth',      value: 'WorkOS',         sub: 'AuthKit SSO · PKCE · HttpOnly cookie' },
  { label: 'Workspace', value: 'pnpm 9',         sub: 'Monorepo · apps/web + packages/ui' },
  { label: 'Pilot',     value: '10 Rooms',       sub: 'MOH 301–310 · fall detection' },
  { label: 'Compliance', value: 'HIPAA §164.514', sub: 'Safe Harbor de-identification' },
];

const CHECKLIST_ITEMS = [
  'Monorepo cloned and pnpm install passes',
  'Workspace packages linked (apps/web, packages/ui)',
  'Environment variables configured (.env.local + Vercel)',
  'WorkOS application created and REDIRECT_URI set',
  'AuthKit SSO flow working (sign in / sign out)',
  'De-identification keyring implemented (AES-GCM)',
  'Pilot ID map created (PILOT-0001 to PILOT-0010)',
  'Dashboard overview renders with room grid + alerts',
  'Floor map heatmap functional',
  'Room detail: Ella narrative loads',
  'TTS playback working (/api/speak)',
  'Activity sparkline rendering correctly',
  'Analytics charts: Recharts + Nivo rendering',
  'Web Push VAPID keys generated',
  'Service worker registered (public/sw.js)',
  'Push notifications firing on fall events',
  'pnpm build passes with zero errors',
  'TypeScript strict mode: zero type errors',
  'ESLint: zero lint errors',
  'Vercel production deploy: ellamemory.com live',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 19]);

const OPEN_DECISIONS = [
  'Web Push VAPID: browser push is still pending — decide whether to implement before or after initial pilot validation run',
  'Keyring UX: per-shift AES-GCM unlock vs persistent browser credential storage (WebAuthn PRF) — security vs usability',
  'Push reliability: Web Push vs native mobile push (APNs) for critical fall alerts on nurse iPads',
  'Analytics persistence: client-side session state vs server-side aggregation for shift summary reports',
  'Floor map: static room layout vs dynamic configuration loaded from ambientcloud room registry',
];

// ── Page component ─────────────────────────────────────────────────────────────

const LS_KEY        = 'ambient-webapp-checklist-v1';
const LS_FREEZE_KEY = 'ambient-webapp-frozen-v1';

export default function WebAppPage() {
  const [active, setActive]           = useState('monorepo');
  const [collapsed, setCollapsed]     = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode]     = useState(false);
  const [checked, setChecked]         = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag]     = useState('All');
  const [designFrozen, setDesignFrozen] = useState(false);
  const [frozenDate, setFrozenDate]     = useState<string | null>(null);
  const isMounted = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setDesignFrozen(true); setFrozenDate(p.date); }
    } catch { /* ignore */ }
    fetch('/api/eng/state').then(r => r.json()).then((all) => {
      const d = all['webapp'];
      if (!d) return;
      if (Array.isArray(d.checked)) { setChecked(new Set(d.checked)); try { localStorage.setItem(LS_KEY, JSON.stringify(d.checked)); } catch { /* ignore */ } }
      if (typeof d.frozen === 'string') { setDesignFrozen(true); setFrozenDate(d.frozen); try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date: d.frozen })); } catch { /* ignore */ } }
      else if (d.frozen === null) { setDesignFrozen(false); setFrozenDate(null); try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ } }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/eng/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'webapp', checked: [...checked], frozen: designFrozen ? frozenDate : null }),
      }).catch(() => {});
    }, 800);
  }, [checked, designFrozen, frozenDate]);

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

  const TAGS = ['All', 'Setup', 'Build', 'Integrate', 'Ship'];
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const ready = doneCount === CHECKLIST_ITEMS.length;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => {
    warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0);
  });

  function isSectionOpen(key: string) {
    return focusMode ? true : collapsed[key] !== true;
  }

  function toggleFreeze() {
    if (!ready && !designFrozen) return;
    setDesignFrozen(f => {
      const next = !f;
      if (next) {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setFrozenDate(date);
        try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date })); } catch { /* ignore */ }
      } else {
        setFrozenDate(null);
        try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ }
      }
      return next;
    });
  }

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      .df-ready {
        background: #7C3AED;
        border: 1.5px solid transparent;
      }
      .df-ready .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-ready .df-sub   { color: rgba(255,255,255,0.82); }
      .df-frozen {
        background: #6D28D9;
        border: 1.5px solid transparent;
      }
      .df-frozen .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-frozen .df-sub   { color: rgba(255,255,255,0.82); }
    `}} />
    <div className="app" style={{ background: '#F1F3F6', minHeight: '100vh', position: 'relative' }}>

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <Link href="/engineering" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '3px 6px' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#9CA3AF' }}>Engineering</span>
          </Link>
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
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: filterTag === tag ? '#EFF6FF' : '#FFFFFF', color: filterTag === tag ? '#2563EB' : '#6B7280', transition: 'all 0.12s' }}>
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
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? '#EFF6FF' : 'transparent', border: isActive ? '1px solid #BFDBFE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#2563EB' : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
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
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
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
              Ella <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Memory</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 500, lineHeight: 1.6 }}>
              Deployment runbook for the ambientweb nurse dashboard — monorepo setup, HIPAA de-identification, WorkOS auth, and Vercel pilot deploy.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientweb" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientweb
          </a>
        </div>

        {/* Pipeline strip */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content' }}>
            {PIPELINE_PHASES.map((phase, pi) => (
              <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: pi === 0 ? '0 24px 0 0' : '0 24px', borderRight: '1px solid #E5E7EB' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>{phase.label}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {phase.ids.map((id, si) => {
                    const s = STEPS.find(x => x.id === id)!;
                    const sc = SC[s.status];
                    const isActive = active === id;
                    return (
                      <span key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        {si > 0 && <span style={{ display: 'inline-block', width: 12, height: 1, background: '#E5E7EB', margin: '0 -2px', alignSelf: 'center' }} />}
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? '1.5px solid #2563EB' : `1px solid ${sc.border}`, background: isActive ? '#EFF6FF' : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? '#2563EB' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pilot Launch milestone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 24, height: 1, background: designFrozen || ready ? 'linear-gradient(90deg,#E5E7EB,#7C3AED)' : '#E5E7EB' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l4 4-4 4" stroke={designFrozen || ready ? '#7C3AED' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: designFrozen ? '#7C3AED' : ready ? '#7C3AED' : '#9CA3AF' }}>
                  {designFrozen ? 'Saved ✓' : 'Goal'}
                </div>
                <button
                  onClick={toggleFreeze}
                  className={designFrozen ? 'df-frozen' : ready ? 'df-ready' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 16px', borderRadius: 9,
                    cursor: ready || designFrozen ? 'pointer' : 'default',
                    ...(!(designFrozen || ready) && { background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }),
                    transition: 'all 0.25s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    {designFrozen || ready ? (
                      <>
                        <path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round"/>
                        <circle cx="8" cy="8" r="2.2" fill="#7C3AED" fillOpacity="0.25"/>
                      </>
                    ) : (
                      <>
                        <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span className="df-title" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: designFrozen ? '#7C3AED' : ready ? '#6D28D9' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {designFrozen ? 'Deployed ✓' : 'Pilot Launch'}
                    </span>
                    <span className="df-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: designFrozen ? '#7C3AED' : ready ? '#7C3AED' : '#9CA3AF' }}>
                      {designFrozen ? (frozenDate ? `Locked ${frozenDate}` : 'Deployment locked') : ready ? 'Ready — click to lock' : `${Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}% complete`}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* App spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 22 }}>
          {APP_SPECS.map(spec => (
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
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: focusMode ? '#EFF6FF' : '#FFFFFF', color: focusMode ? '#2563EB' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
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
                    <button onClick={() => toggleSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: isOpen ? '#FAFBFC' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none', textAlign: 'left' }}>
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? '#2563EB' : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
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
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2563EB', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#1D4ED8', marginBottom: 2 }}>{a.file}</div>
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
                              <span style={{ color: '#2563EB', fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
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
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Pilot Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#059669' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
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
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
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
    </>
  );
}
