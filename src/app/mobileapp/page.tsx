'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Constellation / neural-net background ─────────────────────────────────────

function ConstellationCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (!el) return;
    const ctx = el.getContext('2d')!;
    let raf: number;

    type P = { x:number; y:number; vx:number; vy:number; r:number; pulse:number; pulseSpd:number };
    let pts: P[] = [];

    function init() {
      const n = Math.max(55, Math.min(85, Math.floor(el.width * el.height / 16000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * el.width,
        y: Math.random() * el.height,
        vx: (Math.random() - 0.5) * 0.30,
        vy: (Math.random() - 0.5) * 0.30,
        r: Math.random() < 0.14 ? 2.6 : Math.random() * 1.1 + 0.7,
        pulse: Math.random() * Math.PI * 2,
        pulseSpd: 0.012 + Math.random() * 0.018,
      }));
    }

    function resize() { el.width = el.offsetWidth; el.height = el.offsetHeight; init(); }
    resize();
    window.addEventListener('resize', resize);

    function frame() {
      const W = el.width, H = el.height;
      ctx.clearRect(0, 0, W, H);
      const maxD = Math.min(W, H) * 0.19;

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(8,12,26,0.022)';
      const gx = W / 11, gy = H / 8;
      for (let i = 1; i < 11; i++) { ctx.beginPath(); ctx.moveTo(i*gx,0); ctx.lineTo(i*gx,H); ctx.stroke(); }
      for (let j = 1; j < 8;  j++) { ctx.beginPath(); ctx.moveTo(0,j*gy); ctx.lineTo(W,j*gy); ctx.stroke(); }

      pts.forEach(p => {
        p.x = ((p.x + p.vx) + W) % W;
        p.y = ((p.y + p.vy) + H) % H;
        p.pulse += p.pulseSpd;
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < maxD) {
            const t = 1 - d / maxD;
            const act = 0.5 + 0.5 * Math.sin(pts[i].pulse) * Math.sin(pts[j].pulse);
            const alpha = t * (0.09 + act * 0.06);
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(8,12,26,${alpha.toFixed(3)})`; ctx.lineWidth = t * 1.1; ctx.stroke();
          }
        }
      }

      pts.forEach(p => {
        const glow = 0.5 + 0.5 * Math.sin(p.pulse);
        const glowR = p.r * (3.5 + glow * 2.5);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, `rgba(8,12,26,${(0.08 + glow * 0.06).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(8,12,26,0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + glow * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8,12,26,${(0.28 + glow * 0.14).toFixed(3)})`; ctx.fill();
      });

      raf = requestAnimationFrame(frame);
    }
    frame();
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
  'Environment': { bg: '#F0FDFA', color: '#0F766E' },
  'Development': { bg: '#ECFDF5', color: '#15803D' },
  'Features':    { bg: '#EFF6FF', color: '#1D4ED8' },
  'Distribution':{ bg: '#FFF7ED', color: '#C2410C' },
};

const PIPELINE_PHASES = [
  { label: 'Environment',  ids: ['repo', 'env', 'auth'] },
  { label: 'Development',  ids: ['dev', 'push', 'alerts'] },
  { label: 'Features',     ids: ['alertlist', 'alertdetail', 'phi'] },
  { label: 'Distribution', ids: ['build', 'distribute', 'ci'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'repo', phase: '01', title: 'Repository Setup', status: 'done', tag: 'Environment', time: '< 5 min',
    summary: 'Expo SDK 54 managed workflow, TypeScript 5.9 strict, pnpm. Initialized 2026-04-21 — scaffold only. Implementation begins in subsequent sessions per ambientcloud/docs/study-mvp.md §12.',
    sections: [
      {
        heading: 'Clone and install',
        commands: [
          { label: 'clone and install', code: 'git clone https://github.com/ambientintel/ambientmobile.git\ncd ambientmobile\npnpm install' },
          { label: 'verify Expo CLI', code: 'npx expo --version\n# → 54.x.x' },
        ],
        body: 'Node 20+ required. pnpm is the package manager — consistent with ambientweb. No monorepo structure: this is a flat single-app repo with a root package.json.',
      },
      {
        heading: 'Repo layout',
        table: {
          cols: ['Path', 'Contents'],
          rows: [
            ['App.tsx',                'Root React Native component — entry point for screens'],
            ['index.ts',              'Expo entry point — registers App as the root'],
            ['app.json',             'Expo configuration — name, slug, icon, splash, permissions'],
            ['docs/deidentification.md', 'PHI handling policy — what reaches the device and what never does'],
            ['.env.example',         'Cognito + API + pilot site environment variables'],
            ['assets/',              'App icons, splash screen, adaptive icon'],
          ],
        },
      },
      {
        heading: 'Related repos',
        table: {
          cols: ['Repo', 'Role'],
          rows: [
            ['ambientintel/ambientcloud',    'AWS backend — Cognito user pool, IoT Core, FastAPI'],
            ['ambientintel/ambientweb',      'Nurse dashboard (Next.js) — name-hydrated views'],
            ['ambientintel/ambientfirmware', 'TI AM62x + IWR6843AOP device firmware'],
          ],
        },
      },
    ],
  },
  {
    id: 'env', phase: '02', title: 'Environment Variables', status: 'done', tag: 'Environment', time: '~10 min',
    summary: 'Copy .env.example to .env. Cognito pool and client ID from ambientcloud Terraform outputs. All values are non-PHI infrastructure references.',
    sections: [
      {
        heading: 'Required variables',
        commands: [
          { label: 'create local env file', code: 'cp .env.example .env' },
        ],
        table: {
          cols: ['Variable', 'Description', 'Where to get it'],
          rows: [
            ['EXPO_PUBLIC_COGNITO_REGION',       'AWS region of the Cognito user pool',       'ambientcloud Terraform outputs → cognito_region'],
            ['EXPO_PUBLIC_COGNITO_USER_POOL_ID', 'Shared user pool ID (same as ambientweb)',  'ambientcloud Terraform outputs → user_pool_id'],
            ['EXPO_PUBLIC_COGNITO_CLIENT_ID',    'Mobile app OAuth client (no secret)',       'Cognito console → App clients → ambientmobile'],
            ['EXPO_PUBLIC_API_URL',              'ambientcloud FastAPI base URL',             'ambientcloud Terraform outputs → api_url'],
            ['EXPO_PUBLIC_PILOT_SITE',           'Coded pilot site prefix — mocarev',         'Hardcode: mocarev'],
          ],
        },
        warnings: [
          'Never commit .env — it is in .gitignore. The Cognito client for mobile must have no client secret (public client) since secrets cannot be safely stored in a mobile app bundle.',
          'EXPO_PUBLIC_* variables are bundled into the client app at build time and visible to anyone who installs the app. Never put secrets in EXPO_PUBLIC_* variables.',
        ],
      },
      {
        heading: 'Cognito mobile client setup',
        body: 'The mobile app uses a separate Cognito app client from ambientweb — no client secret, auth flow: USER_SRP_AUTH. The Cognito user pool is shared (same nurse accounts log in on both web and mobile).',
        commands: [
          { label: 'verify client in AWS CLI', code: 'aws cognito-idp describe-user-pool-client \\\n  --user-pool-id $COGNITO_USER_POOL_ID \\\n  --client-id $COGNITO_CLIENT_ID \\\n  --query "UserPoolClient.{Flow:ExplicitAuthFlows,Secret:ClientSecret}"' },
        ],
        warnings: ['ExplicitAuthFlows must include ALLOW_USER_SRP_AUTH and ALLOW_REFRESH_TOKEN_AUTH. ClientSecret must be null for a public mobile client.'],
      },
    ],
  },
  {
    id: 'auth', phase: '03', title: 'Cognito Authentication', status: 'pending', tag: 'Environment', time: '~2 hr implementation',
    summary: 'Login via AWS Cognito — shared user pool with ambientweb. Same nurse credentials work on both platforms. SRP auth, no client secret.',
    sections: [
      {
        heading: 'Auth library',
        body: 'Use aws-amplify/auth (Auth v6) or amazon-cognito-identity-js directly. Amplify Auth is recommended for Phase I — it handles SRP, token refresh, and secure storage via SecureStore on iOS / EncryptedSharedPreferences on Android.',
        commands: [
          { label: 'install auth dependencies', code: 'pnpm add aws-amplify\npnpm add @aws-amplify/react-native\npnpm add @react-native-async-storage/async-storage\npnpm add react-native-get-random-values' },
          { label: 'configure Amplify in App.tsx', code: `import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!,
      loginWith: { email: true },
    },
  },
});` },
        ],
        warnings: [
          'react-native-get-random-values must be imported before aws-amplify in the entry file (index.ts). Missing it causes a "crypto.getRandomValues is not a function" crash at startup.',
          'Amplify v6 requires AsyncStorage to be configured explicitly for React Native. Pass it via Amplify.configure({ Storage: { AsyncStorage } }).',
        ],
      },
      {
        heading: 'Login screen',
        body: 'Phase I login screen: email + password fields, sign-in button, error state for wrong credentials. No sign-up flow — nurse accounts are provisioned by the study coordinator via the Cognito admin CLI.',
        checklist: [
          'Email + password fields with secure text entry on password',
          'Loading state during signIn call',
          'Error message for NotAuthorizedException and UserNotFoundException',
          'On success: store session, navigate to alerts list',
          'Token refresh on app foreground (AppState listener)',
        ],
        warnings: ['Do not implement "Forgot password" in Phase I — password reset goes through the study coordinator. A self-service flow risks PHI exposure if email is compromised.'],
      },
    ],
  },
  {
    id: 'dev', phase: '04', title: 'Development Server', status: 'done', tag: 'Development', time: '< 1 min start',
    summary: 'expo start launches Metro bundler. Use Expo Go on a physical device for fastest iteration; iOS Simulator and Android Emulator for push notification testing (Simulator does not support APNS).',
    sections: [
      {
        heading: 'Start Metro',
        commands: [
          { label: 'start dev server', code: 'pnpm start\n# or target a platform directly:\npnpm ios      # opens iOS Simulator\npnpm android  # opens Android Emulator' },
          { label: 'open on physical device (fastest)', code: '# Install Expo Go from App Store / Play Store\n# Scan QR code shown in terminal after `pnpm start`\n# Or: press s to switch to Expo Go mode' },
        ],
        warnings: [
          'APNS push notifications do not work in the iOS Simulator. Use a physical iOS device (connected over USB or on the same Wi-Fi) for end-to-end push testing.',
          'Android Emulator supports FCM push but requires Google Play Services — use a Pixel emulator image with Play Store, not the AOSP image.',
        ],
      },
      {
        heading: 'TypeScript in Expo managed workflow',
        body: 'tsconfig.json extends expo/tsconfig.base with strict: true. Type-check without building:',
        commands: [
          { label: 'type-check', code: 'npx tsc --noEmit' },
        ],
        artifacts: [
          { file: 'tsconfig.json', role: 'Extends expo/tsconfig.base — strict mode, no emit, React Native types', size: '' },
        ],
      },
    ],
  },
  {
    id: 'push', phase: '05', title: 'Push Notifications', status: 'pending', tag: 'Development', time: '~3 hr setup',
    summary: 'APNS (iOS) and FCM (Android) via Expo Notifications. Device push token sent to ambientcloud at login. Fall alert payload contains coded ID only — no PHI.',
    sections: [
      {
        heading: 'Install and configure expo-notifications',
        commands: [
          { label: 'install', code: 'npx expo install expo-notifications expo-device' },
          { label: 'register for push token', code: `import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // Simulator — skip
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  })).data;
  // Send token to ambientcloud
  await fetch(\`\${process.env.EXPO_PUBLIC_API_URL}/push/register\`, {
    method: 'POST',
    headers: { Authorization: \`Bearer \${cognitoAccessToken}\` },
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
  return token;
}` },
        ],
        warnings: [
          'APNS requires an Apple Developer account and a provisioning profile with push capability. In managed Expo workflow, run `eas credentials` to provision automatically.',
          'Re-register the push token on every app launch — tokens rotate and an expired token in ambientcloud means missed alerts. Check for token changes with getExpoPushTokenAsync and only re-POST if the token changed.',
        ],
      },
      {
        heading: 'Alert payload structure',
        body: 'ambientcloud sends push payloads with coded identifiers only. The push notification body never contains resident names, room numbers, or any PHI.',
        table: {
          cols: ['Payload field', 'Type', 'Example', 'Notes'],
          rows: [
            ['alert_id',  'string', '"ALT-20260507-0042"',  'Unique alert ID for deduplication'],
            ['coded_id',  'string', '"MOCAREV-0014"',       'Coded resident ID — no PHI'],
            ['type',      'string', '"fall"',               'fall | absence | distress'],
            ['confidence','number', '0.94',                 '0–1 sensor confidence score'],
            ['ts',        'number', '1746641284',           'Unix timestamp UTC'],
          ],
        },
        commands: [
          { label: 'test a push from CLI (ambientcloud)', code: "curl -X POST $API_URL/push/test \\\n  -H 'Authorization: Bearer <admin-token>' \\\n  -d '{\"coded_id\": \"MOCAREV-0014\", \"type\": \"fall\"}'" },
        ],
      },
      {
        heading: 'Foreground notification handler',
        commands: [{ code: `// Show an in-app alert banner when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});` }],
        warnings: ['iOS will not show a notification banner when the app is in the foreground unless setNotificationHandler is configured. Without it, foreground alerts are silently dropped.'],
      },
    ],
  },
  {
    id: 'alerts', phase: '06', title: 'Alert Handling', status: 'pending', tag: 'Development', time: '~2 hr implementation',
    summary: 'Tap a push notification to deep-link into the app at the alert detail screen. Handle both cold-start (app not running) and warm-start (app backgrounded) cases.',
    sections: [
      {
        heading: 'Notification tap → deep link',
        commands: [{ code: `import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useNotificationNavigation() {
  const navigation = useNavigation();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Warm start: app backgrounded, notification tapped
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { alert_id } = response.notification.request.content.data as { alert_id: string };
      navigation.navigate('AlertDetail', { alertId: alert_id });
    });

    // Cold start: app launched from notification tap
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const { alert_id } = response.notification.request.content.data as { alert_id: string };
      navigation.navigate('AlertDetail', { alertId: alert_id });
    });

    return () => responseListener.current?.remove();
  }, [navigation]);
}` }],
        warnings: [
          'getLastNotificationResponseAsync only returns a value once per cold start. Clear it after consuming or you will navigate on every hot reload during development.',
          'Navigation must be ready before calling navigate — wrap in a useEffect that runs after the navigation container mounts.',
        ],
      },
      {
        heading: 'Alert deduplication',
        body: 'The sensor pipeline has an 800 ms dedup window, but network retransmission can still deliver duplicates. Maintain a Set of seen alert_ids in memory (and persist to AsyncStorage) and skip rendering duplicates.',
        commands: [{ label: 'dedup on receive', code: `const seenAlerts = useRef(new Set<string>());

function onNewAlert(payload: AlertPayload) {
  if (seenAlerts.current.has(payload.alert_id)) return;
  seenAlerts.current.add(payload.alert_id);
  setAlerts(prev => [payload, ...prev].slice(0, 50));
}` }],
      },
    ],
  },
  {
    id: 'alertlist', phase: '07', title: 'Recent Alerts List', status: 'pending', tag: 'Features', time: '~2 hr implementation',
    summary: 'Scrollable list of the last 50 alerts — coded ID, type badge, confidence, timestamp. Pull-to-refresh fetches from the ambientcloud alerts API.',
    sections: [
      {
        heading: 'List design',
        body: 'Each row shows: alert type badge (fall / absence / distress), coded resident ID (MOCAREV-NNNN), time elapsed since alert, and an acknowledge indicator. Unacknowledged alerts are visually distinct (bold, colored left border).',
        table: {
          cols: ['Element', 'Value source', 'Notes'],
          rows: [
            ['Type badge', 'payload.type',       'Color-coded: fall=red, absence=amber, distress=orange'],
            ['Coded ID',   'payload.coded_id',   'Never resolve to a name on mobile in Phase I'],
            ['Time',       'payload.ts',          'Display as relative time: "3 min ago"'],
            ['Confidence', 'payload.confidence', 'Show only when < 0.80 — grey warning label'],
            ['Status dot', 'acknowledged field', 'Green = ack\'d, amber = pending'],
          ],
        },
        warnings: ['Do not display resident names or room numbers on this screen in Phase I. Mobile shows coded IDs only — nurses use ambientweb in a browser for name-hydrated views.'],
      },
      {
        heading: 'Fetch from API',
        commands: [{ label: 'GET /alerts', code: `const res = await fetch(\`\${API_URL}/alerts?site=mocarev&limit=50\`, {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});
const { alerts } = await res.json() as { alerts: AlertPayload[] };
// alerts are already coded — no PHI` }],
      },
    ],
  },
  {
    id: 'alertdetail', phase: '08', title: 'Alert Detail', status: 'pending', tag: 'Features', time: '~2 hr implementation',
    summary: 'Per-alert screen reached by tapping a list row or a push notification. Shows alert context, acknowledge button, and false-positive flag. Coded IDs only.',
    sections: [
      {
        heading: 'Detail screen',
        body: 'Shows: alert type, coded resident ID, timestamp, sensor confidence, sensor location (coded zone — e.g. "Zone 3"), and action buttons. Two actions: Acknowledge (marks alert resolved in ambientcloud) and Flag as false positive (sends feedback to improve the model).',
        checklist: [
          'Coded resident ID displayed prominently',
          'Alert type with color-coded badge',
          'Timestamp formatted in local time (not UTC)',
          'Sensor confidence displayed — warn if < 0.80',
          'Coded zone label (not room number)',
          'Acknowledge button — calls PATCH /alerts/{alert_id}/acknowledge',
          'Flag false positive — calls PATCH /alerts/{alert_id}/flag',
          'Both actions optimistically update the UI, then sync',
          'Loading and error states for both actions',
        ],
      },
      {
        heading: 'Acknowledge + flag API calls',
        commands: [
          { label: 'acknowledge', code: `await fetch(\`\${API_URL}/alerts/\${alertId}/acknowledge\`, {
  method: 'PATCH',
  headers: { Authorization: \`Bearer \${accessToken}\` },
});` },
          { label: 'flag as false positive', code: `await fetch(\`\${API_URL}/alerts/\${alertId}/flag\`, {
  method: 'PATCH',
  headers: { Authorization: \`Bearer \${accessToken}\` },
  body: JSON.stringify({ reason: 'false_positive' }),
});` },
        ],
        warnings: [
          'Optimistic updates must be rolled back on API error — show a toast and restore the previous state.',
          'False-positive flags are PHI-adjacent study data and must be timestamped server-side. Do not timestamp client-side — device clocks drift.',
        ],
      },
    ],
  },
  {
    id: 'phi', phase: '09', title: 'PHI Boundary', status: 'done', tag: 'Features', time: 'reference',
    summary: 'Coded-data design under HIPAA §164.514(c). All API responses and push payloads use MOCAREV-NNNN identifiers. No names, MRNs, DOBs, or room numbers ever reach the device in Phase I.',
    sections: [
      {
        heading: 'What reaches the device',
        table: {
          cols: ['Data', 'On-device?', 'Notes'],
          rows: [
            ['Coded resident ID (MOCAREV-NNNN)', 'Yes', 'De-identified per HIPAA §164.514(c)'],
            ['Alert type (fall / absence / distress)', 'Yes', 'Not PHI'],
            ['Sensor confidence score', 'Yes', 'Not PHI'],
            ['Timestamp (UTC)', 'Yes', 'Not PHI when not linked to a named individual'],
            ['Coded zone label', 'Yes', 'Zone numbers, not room numbers'],
            ['Resident name', 'Never', 'Name hydration only in ambientweb (browser, encrypted keyring)'],
            ['Room number', 'Never', 'Coded zone only in Phase I'],
            ['DOB / MRN / contact info', 'Never', 'Not transmitted at any layer'],
          ],
        },
        warnings: [
          'Any change that would cause a name or MRN to appear in the app — even in a log, a crash report, or a comment — requires IRB amendment review before implementation.',
          'Sentry, Crashlytics, and analytics SDKs must be audited before adding. Breadcrumbs and crash payloads must never capture screen content that could show coded IDs linked to names.',
        ],
      },
      {
        heading: 'API response guards',
        body: 'ambientcloud\'s alert API runs a server-side PHI strip before responding. The mobile client should also defensively verify that no unexpected PHI fields appear in API responses during development.',
        commands: [{ label: 'dev-only PHI guard (remove before production)', code: `function assertNoPHI(obj: unknown, path = '') {
  const PHI_KEYS = ['name', 'firstName', 'lastName', 'dob', 'mrn', 'ssn', 'address', 'phone', 'email'];
  if (typeof obj !== 'object' || !obj) return;
  for (const [k, v] of Object.entries(obj)) {
    if (PHI_KEYS.some(p => k.toLowerCase().includes(p))) {
      console.warn(\`PHI key detected at \${path}.\${k} — strip before shipping\`);
    }
    if (typeof v === 'object') assertNoPHI(v, \`\${path}.\${k}\`);
  }
}` }],
      },
      {
        heading: 'Phase II considerations',
        body: 'The coded-ID-only design is a deliberate Phase I constraint, not a permanent limitation. Phase II may introduce an encrypted identity overlay on mobile (parity with ambientweb). Any such change requires IRB protocol amendment and a security review of the on-device keyring.',
        checklist: [
          'Phase II identity overlay requires IRB amendment — budget 4–6 weeks for review',
          'If keyring is added, use iOS Keychain / Android Keystore via Expo SecureStore — never AsyncStorage for PHI',
          'Phase II scope not yet approved — do not implement identity overlay code in Phase I branches',
        ],
      },
    ],
  },
  {
    id: 'build', phase: '10', title: 'EAS Build', status: 'pending', tag: 'Distribution', time: '~20–40 min per build',
    summary: 'Expo Application Services (EAS) Build for iOS (.ipa) and Android (.apk/.aab). Credentials managed by EAS — no local Xcode keychain needed.',
    sections: [
      {
        heading: 'EAS setup',
        commands: [
          { label: 'install EAS CLI', code: 'npm install -g eas-cli\neas login\neas init   # links to Expo project, sets projectId in app.json' },
          { label: 'eas.json', code: `{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "ios": { "buildConfiguration": "Release" },
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "dev@ambientintel.co", "ascAppId": "XXXXXXXXXX" }
    }
  }
}` },
        ],
        warnings: ['EAS Build runs on Expo\'s cloud infrastructure. The first iOS build requires provisioning — run `eas credentials` to generate certificates and profiles automatically. Do not create them manually in the Apple Developer portal first.'],
      },
      {
        heading: 'Trigger a build',
        commands: [
          { label: 'iOS preview build', code: 'eas build --platform ios --profile preview' },
          { label: 'Android preview build', code: 'eas build --platform android --profile preview' },
          { label: 'both platforms', code: 'eas build --platform all --profile preview' },
        ],
        artifacts: [
          { file: 'eas.json', role: 'EAS build profiles — development, preview, production', size: '' },
          { file: 'app.json', role: 'Expo config — bundleIdentifier (iOS), package (Android), EAS projectId', size: '' },
        ],
      },
    ],
  },
  {
    id: 'distribute', phase: '11', title: 'Distribution', status: 'pending', tag: 'Distribution', time: '~1 hr setup',
    summary: 'iOS via TestFlight (study coordinator sends invitations). Android via Firebase App Distribution (internal testing track). No public App Store or Play Store release in Phase I.',
    sections: [
      {
        heading: 'iOS — TestFlight',
        commands: [
          { label: 'submit to App Store Connect (TestFlight)', code: 'eas submit --platform ios --profile production\n# Uses appleId + ascAppId from eas.json submit config' },
          { label: 'add internal testers via App Store Connect', code: '# Open App Store Connect → TestFlight → Internal Testing\n# Add nurse UDIDs or invite via email\n# OR: use study coordinator\'s Apple account to manage invitations' },
        ],
        body: 'All study participants (nurses at Mount Olivet Careview Home) must be added as TestFlight internal testers before installation. The study coordinator manages the invite list. External TestFlight is not needed for Phase I.',
        warnings: [
          'TestFlight builds expire after 90 days. Schedule a rebuild at the start of Phase I and again at the 80-day mark if the study runs longer.',
          'The App Store Connect app record must have a privacy policy URL before TestFlight can be enabled — use the Ambient Intelligence privacy policy URL. No App Store listing is required for internal testing only.',
        ],
      },
      {
        heading: 'Android — Firebase App Distribution',
        commands: [
          { label: 'install Firebase CLI and distribute', code: 'npm install -g firebase-tools\nfirebase login\n\n# After EAS Android build completes:\neas build --platform android --profile production\n\n# Download the .apk from EAS, then distribute:\nfirebase appdistribution:distribute app-release.apk \\\n  --app $FIREBASE_APP_ID \\\n  --groups "phase1-nurses" \\\n  --release-notes "Ambient Phase I build"' },
        ],
        warnings: [
          'Add nurse Android device email addresses to the "phase1-nurses" Firebase App Distribution group before the first distribute call.',
          'Android devices must have unknown sources installation enabled (or be enrolled in MDM) to install from Firebase App Distribution. Instruct nurses or the IT team accordingly.',
        ],
      },
    ],
  },
  {
    id: 'ci', phase: '12', title: 'CI Pipeline', status: 'pending', tag: 'Distribution', time: '~1 hr setup',
    summary: 'GitHub Actions runs type-check and triggers EAS Build on merge to main. EAS handles the cloud build queue — no self-hosted runner or macOS agent needed.',
    sections: [
      {
        heading: 'GitHub Actions workflow',
        commands: [{ label: '.github/workflows/mobile-ci.yml', code: `name: Mobile CI
on:
  push:    { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: npx tsc --noEmit

  eas-build:
    needs: typecheck
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: \${{ secrets.EXPO_TOKEN }}

      - name: EAS Build (preview)
        run: eas build --platform all --profile preview --non-interactive` }],
      },
      {
        heading: 'Secrets setup',
        commands: [
          { label: 'add Expo token to GitHub', code: '# Generate at expo.dev → Account Settings → Access Tokens\ngh secret set EXPO_TOKEN' },
        ],
        warnings: [
          'EAS Build minutes are metered on the Expo free tier. Use the preview profile (not production) for CI to conserve minutes — production builds should be triggered manually before TestFlight submission.',
          'Do not run EAS Build on every PR — only on merge to main. PR checks only need type-check and lint.',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const STACK_SPECS = [
  { label: 'Framework',  value: 'Expo SDK 54',       sub: 'Managed workflow · React Native 0.81.5' },
  { label: 'Language',   value: 'TypeScript 5.9',    sub: 'Strict mode · expo/tsconfig.base' },
  { label: 'Auth',       value: 'AWS Cognito',       sub: 'Shared pool with ambientweb · SRP auth' },
  { label: 'Push',       value: 'APNS + FCM',        sub: 'iOS TestFlight · Android Firebase Dist.' },
  { label: 'Build',      value: 'EAS Build',         sub: 'Cloud iOS + Android · eas.json profiles' },
  { label: 'Study',      value: '1R41AG097177-01',   sub: 'NIH STTR Phase I · NIA · Mount Olivet' },
];

const CHECKLIST_ITEMS = [
  'Node 20+ and pnpm installed',
  '.env configured from .env.example',
  'pnpm install clean',
  'Expo CLI available (npx expo --version)',
  'Dev server running (pnpm start)',
  'App loads on iOS Simulator',
  'App loads on Android Emulator',
  'Cognito login working (nurse test account)',
  'Push token registered on physical iOS device',
  'Push token registered on Android device',
  'Test fall alert push received',
  'Notification tap → alert detail screen',
  'Alert list rendering (coded IDs only)',
  'Alert detail rendering',
  'Acknowledge action working',
  'False-positive flag working',
  'PHI guard: no names/MRNs in any API response',
  'TypeScript build clean (npx tsc --noEmit)',
  'EAS credentials provisioned (iOS)',
  'Preview build uploaded to TestFlight',
  'Preview build on Firebase App Distribution',
  'Nurse TestFlight invitations sent',
  'CI pipeline passing on main',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4]);

const OPEN_DECISIONS = [
  'Offline alert queue: cache unacknowledged alerts in AsyncStorage when connectivity drops in the care facility',
  'Biometric unlock: Face ID / fingerprint for faster re-auth after session expiry vs. Cognito password re-entry',
  'Alert sound: custom urgent clinical tone vs. iOS/Android system notification sounds',
  'Android MDM: Firebase App Distribution (Phase I) vs. hospital-managed MDM for Phase II scale',
  'Phase II identity overlay: encrypted on-device keyring parity with ambientweb — requires IRB amendment',
];

// ── Page component ─────────────────────────────────────────────────────────────

const LS_KEY        = 'ambient-mobileapp-checklist-v1';
const LS_FREEZE_KEY = 'ambient-mobileapp-frozen-v1';

export default function MobileAppPage() {
  const [active, setActive]           = useState('repo');
  const [collapsed, setCollapsed]     = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode]     = useState(false);
  const [checked, setChecked]         = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag]     = useState('All');
  const [designFrozen, setDesignFrozen] = useState(false);
  const [frozenDate, setFrozenDate]     = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setDesignFrozen(true); setFrozenDate(p.date); }
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

  function toggleSection(key: string) { setCollapsed(p => ({ ...p, [key]: !p[key] })); }
  function expandAll()  { setCollapsed({}); }
  function collapseAll() {
    const all: Record<string, boolean> = {};
    step.sections.forEach((_, i) => { all[`${active}-${i}`] = true; });
    setCollapsed(prev => ({ ...prev, ...all }));
  }

  const TAGS = ['All', 'Environment', 'Development', 'Features', 'Distribution'];
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const ready = doneCount === CHECKLIST_ITEMS.length;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => { warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0); });

  function isSectionOpen(key: string) { return focusMode ? true : collapsed[key] !== true; }

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
      @keyframes dfFlow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes dfGlow {
        0%, 100% { box-shadow: 0 0 0 2px rgba(13,148,136,0.18), 0 2px 8px rgba(13,148,136,0.10); }
        50%       { box-shadow: 0 0 0 5px rgba(13,148,136,0.28), 0 4px 24px rgba(13,148,136,0.20); }
      }
      .df-ready {
        background: linear-gradient(-45deg, #0D9488, #0F766E, #2563EB, #0D9488);
        background-size: 300% 300%;
        animation: dfFlow 3s ease infinite;
        border: 1.5px solid transparent;
      }
      .df-ready .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-ready .df-sub   { color: rgba(255,255,255,0.82); }
      .df-frozen {
        background: linear-gradient(-45deg, #0F766E, #0D9488, #14B8A6, #5EEAD4, #0D9488, #0F766E);
        background-size: 300% 300%;
        animation: dfFlow 4s ease infinite, dfGlow 2.5s ease-in-out infinite;
        border: 1.5px solid transparent;
      }
      .df-frozen .df-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .df-frozen .df-sub   { color: rgba(255,255,255,0.82); }
    `}} />
    <div className="app" style={{ background: '#F1F3F6', minHeight: '100vh', position: 'relative' }}>
      <ConstellationCanvas />

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '4px 6px', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#6B7280' }}>Mobile</em>
              </span>
            </div>
          </Link>

          {/* Progress bar */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#0D9488', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #0D9488, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #0D9488' : '1px solid #E5E7EB', background: filterTag === tag ? '#F0FDFA' : '#FFFFFF', color: filterTag === tag ? '#0D9488' : '#6B7280', transition: 'all 0.12s' }}>
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
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? '#F0FDFA' : 'transparent', border: isActive ? '1px solid #99F6E4' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#0D9488' : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
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
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0D9488', flexShrink: 0 }} />
            <a href="https://github.com/ambientintel/ambientmobile" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientmobile</a>
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · NIH STTR Phase I</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              Ambient <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Mobile</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 520, lineHeight: 1.6 }}>
              Fall alert delivery to nursing staff via APNS and FCM. NIH STTR grant 1R41AG097177-01 · Mount Olivet Careview Home pilot.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/engineering" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              Engineering
            </Link>
            <a href="https://github.com/ambientintel/ambientmobile" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              ambientintel/ambientmobile
            </a>
          </div>
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
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? '1.5px solid #0D9488' : `1px solid ${sc.border}`, background: isActive ? '#F0FDFA' : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? '#0D9488' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Study Launch milestone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 24, height: 1, background: designFrozen ? 'linear-gradient(90deg,#E5E7EB,#0D9488)' : ready ? 'linear-gradient(90deg,#E5E7EB,#0D9488)' : '#E5E7EB' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l4 4-4 4" stroke={designFrozen ? '#0D9488' : ready ? '#0D9488' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: designFrozen ? '#0D9488' : ready ? '#0D9488' : '#9CA3AF' }}>
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
                        <path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke={designFrozen ? '#0D9488' : '#0D9488'} strokeWidth="1.6" strokeLinecap="round"/>
                        <circle cx="8" cy="8" r="2.2" fill={designFrozen ? '#0D9488' : '#0D9488'} fillOpacity="0.25"/>
                      </>
                    ) : (
                      <>
                        <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span className="df-title" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: designFrozen ? '#0D9488' : ready ? '#0F766E' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {designFrozen ? 'Launched ✓' : 'Study Launch'}
                    </span>
                    <span className="df-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: designFrozen ? '#0D9488' : ready ? '#0D9488' : '#9CA3AF' }}>
                      {designFrozen ? (frozenDate ? `Locked ${frozenDate}` : 'Phase I locked') : ready ? 'Ready — click to lock' : `${Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}% complete`}
                    </span>
                  </div>
                </button>
              </div>
            </div>
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
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#0D9488', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #0D9488' : '1px solid #E5E7EB', background: focusMode ? '#F0FDFA' : '#FFFFFF', color: focusMode ? '#0D9488' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
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
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? '#0D9488' : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
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
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#0D9488', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#0F766E', marginBottom: 2 }}>{a.file}</div>
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
                              <span style={{ color: '#0D9488', fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
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
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Study Launch Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#0D9488' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
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
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#0D9488', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #0D9488, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
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
