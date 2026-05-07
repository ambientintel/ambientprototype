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
      { a: 2, b: 3, cx: 0.10, cy: 0.20, r: 120, ph: 0.3 },
      { a: 3, b: 4, cx: 0.52, cy: 0.10, r: 145, ph: 0.7 },
      { a: 5, b: 3, cx: 0.82, cy: 0.30, r: 110, ph: 1.1 },
      { a: 1, b: 3, cx: 0.25, cy: 0.72, r: 100, ph: 0.0 },
      { a: 4, b: 5, cx: 0.65, cy: 0.60, r: 140, ph: 0.5 },
      { a: 3, b: 2, cx: 0.88, cy: 0.82, r: 90,  ph: 1.6 },
      { a: 5, b: 4, cx: 0.40, cy: 0.90, r: 120, ph: 2.0 },
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
        ctx.strokeStyle = 'rgba(37,99,235,0.06)';
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
  'PWA':    { bg: '#EFF6FF', color: '#1D4ED8' },
  'Native': { bg: '#F0FDF4', color: '#15803D' },
  'iOS':    { bg: '#FFF7ED', color: '#C2410C' },
  'Ship':   { bg: '#FAF5FF', color: '#7E22CE' },
};

const PIPELINE_PHASES = [
  { label: 'PWA',    ids: ['manifest', 'service-worker', 'web-push', 'mobile-ui'] },
  { label: 'Native', ids: ['capacitor', 'ios-build', 'android-build'] },
  { label: 'iOS',    ids: ['signing', 'apns', 'enterprise-dist'] },
  { label: 'Ship',   ids: ['testflight', 'prod-build', 'pilot-validation'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'manifest', phase: '01', title: 'PWA Manifest', status: 'done', tag: 'PWA', time: '~2 hrs',
    summary: 'manifest.json configures the PWA identity: name, icons, theme color, display mode, and orientation. Required for Add to Home Screen on iOS and Android and for the install prompt on Chrome.',
    sections: [
      {
        heading: 'manifest.json spec',
        artifacts: [
          { file: 'apps/web/public/manifest.json', role: 'PWA manifest. name, short_name, icons (192×192 + 512×512), theme_color #0C0D0F, display: standalone.' },
          { file: 'apps/web/public/icon-192.png',  role: '192×192 maskable icon. Used by Android launcher and as push notification badge.' },
          { file: 'apps/web/public/icon-512.png',  role: '512×512 splash icon. Required for iOS full-screen launch image.' },
        ],
        commands: [
          { label: 'verify manifest is linked in layout', code: '// apps/web/src/app/layout.tsx\nexport const metadata: Metadata = {\n  manifest: "/manifest.json",\n  appleWebApp: {\n    capable: true,\n    statusBarStyle: "black-translucent",\n    title: "Ambient Alert",\n  },\n};' },
          { label: 'check manifest parses correctly', code: '# Start dev server then inspect:\ncurl http://localhost:3000/manifest.json | jq .\n# Must return valid JSON with name, icons, display fields' },
        ],
      },
      {
        heading: 'iOS meta tags',
        body: 'iOS Safari does not fully respect the manifest for home screen apps. apple-mobile-web-app-capable and apple-touch-icon meta tags must be set explicitly in the <head>. These are wired in apps/web/src/app/layout.tsx via the Next.js Metadata API.',
        table: {
          cols: ['Meta tag', 'Value', 'Purpose'],
          rows: [
            ['apple-mobile-web-app-capable',    'yes',                   'Enables full-screen mode on iOS home screen launch'],
            ['apple-mobile-web-app-status-bar-style', 'black-translucent', 'Extends content under the notch'],
            ['apple-touch-icon',                '/icon-192.png?v=5',     'Home screen icon — must be PNG, no transparency'],
            ['theme-color',                     '#0C0D0F',               'Browser chrome color on Android Chrome'],
          ],
        },
        warnings: [
          'iOS caches the apple-touch-icon aggressively. Append a cache-busting query param (?v=N) when changing the icon — otherwise nurses see the old icon until they delete and reinstall the PWA.',
        ],
      },
      {
        heading: 'PWA install prompt (Android / Chrome)',
        commands: [
          { label: 'capture beforeinstallprompt', code: '// apps/web/src/components/InstallBanner.tsx\nwindow.addEventListener("beforeinstallprompt", (e) => {\n  e.preventDefault();\n  setDeferredPrompt(e);\n  setShowBanner(true);\n});\n\n// When nurse taps "Add to home screen":\nawait deferredPrompt.prompt();\nconst { outcome } = await deferredPrompt.userChoice;\n// outcome: "accepted" | "dismissed"' },
        ],
        warnings: [
          'beforeinstallprompt does not fire on iOS Safari — Apple requires manual Add to Home Screen from the share sheet. The /mobile install guide page covers the step-by-step iOS flow for nurse onboarding.',
        ],
      },
    ],
  },
  {
    id: 'service-worker', phase: '02', title: 'Service Worker', status: 'done', tag: 'PWA', time: '~1 day',
    summary: 'The service worker handles three responsibilities: push event display, offline shell caching (CacheFirst), and API request queuing when offline (NetworkFirst with fallback).',
    sections: [
      {
        heading: 'Registration',
        body: 'The service worker is registered in apps/web/src/app/layout.tsx via an inline script that fires on window load. This ensures registration does not block the initial render.',
        artifacts: [
          { file: 'apps/web/public/sw.js', role: 'Service worker. Push handler, install/activate lifecycle, cache strategy, notification click routing.' },
        ],
        commands: [
          { label: 'sw.js — install + cache shell', code: 'const CACHE = "ambient-v2";\nconst SHELL = [\n  "/",\n  "/dashboard/overview",\n  "/icon-192.png",\n  "/manifest.json",\n];\n\nself.addEventListener("install", e => {\n  e.waitUntil(\n    caches.open(CACHE).then(c => c.addAll(SHELL))\n  );\n  self.skipWaiting();\n});\n\nself.addEventListener("activate", e => {\n  e.waitUntil(\n    caches.keys().then(keys =>\n      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))\n    )\n  );\n  self.clients.claim();\n});' },
          { label: 'sw.js — fetch strategy', code: '// Shell routes: CacheFirst\n// API routes: NetworkFirst, fall back to cached\nself.addEventListener("fetch", e => {\n  const url = new URL(e.request.url);\n  if (url.pathname.startsWith("/api/")) {\n    e.respondWith(\n      fetch(e.request).catch(() =>\n        caches.match(e.request)\n      )\n    );\n  } else {\n    e.respondWith(\n      caches.match(e.request).then(cached =>\n        cached ?? fetch(e.request)\n      )\n    );\n  }\n});' },
        ],
      },
      {
        heading: 'Push event handler',
        commands: [
          { label: 'sw.js — push + notificationclick', code: 'self.addEventListener("push", e => {\n  const d = e.data?.json() ?? {};\n  e.waitUntil(\n    self.registration.showNotification(d.title ?? "Ambient Alert", {\n      body:      d.body,\n      icon:      "/icon-192.png",\n      badge:     "/icon-192.png",\n      tag:       d.roomId,\n      renotify:  true,\n      data:      { url: d.url },\n      // Vibration pattern: 200ms on, 100ms off, 200ms on\n      vibrate:   [200, 100, 200],\n    })\n  );\n});\n\nself.addEventListener("notificationclick", e => {\n  e.notification.close();\n  e.waitUntil(\n    clients.matchAll({ type: "window" }).then(list => {\n      const match = list.find(c => c.url.includes(e.notification.data.url));\n      return match ? match.focus() : clients.openWindow(e.notification.data.url);\n    })\n  );\n});' },
        ],
        warnings: [
          'Vibration patterns are silenced when the device is in Do Not Disturb mode. For critical fall alerts, consider also triggering a native sound via the Notification API sound property — though iOS PWA ignores custom sounds.',
        ],
      },
    ],
  },
  {
    id: 'web-push', phase: '03', title: 'Web Push', status: 'done', tag: 'PWA', time: '~1 day',
    summary: 'VAPID-authenticated Web Push. The browser subscribes once per device/profile. The ambientcloud backend POSTs fall events to /api/push/send which fans out to all stored subscriptions.',
    sections: [
      {
        heading: 'Permission request flow',
        commands: [
          { label: 'request permission + subscribe', code: '// Request permission first — must be in response to user gesture\nconst permission = await Notification.requestPermission();\nif (permission !== "granted") return;\n\nconst reg = await navigator.serviceWorker.ready;\nconst sub = await reg.pushManager.subscribe({\n  userVisibleOnly: true,\n  applicationServerKey: urlBase64ToUint8Array(\n    process.env.NEXT_PUBLIC_VAPID_KEY!\n  ),\n});\n\nawait fetch("/api/push/subscribe", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(sub),\n});' },
          { label: 'urlBase64ToUint8Array helper', code: 'function urlBase64ToUint8Array(base64: string) {\n  const padding = "=".repeat((4 - (base64.length % 4)) % 4);\n  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");\n  const raw = atob(b64);\n  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));\n}' },
        ],
        warnings: [
          'Push permission prompts on iOS require the app to be running in standalone mode (installed to home screen). If Notification.requestPermission() is called in Safari browser tab, it will silently fail without error. Gate the subscribe call behind a check for window.navigator.standalone === true on iOS.',
        ],
      },
      {
        heading: 'Server-side send (ambientcloud webhook)',
        commands: [
          { label: '/api/push/send — fan out to all subscribers', code: 'import webpush from "web-push";\n\nwebpush.setVapidDetails(\n  "mailto:eng@ambientintel.com",\n  process.env.NEXT_PUBLIC_VAPID_KEY!,\n  process.env.VAPID_PRIVATE_KEY!\n);\n\n// Fan out to all stored subscriptions\nawait Promise.allSettled(\n  subscriptions.map(sub =>\n    webpush.sendNotification(sub, JSON.stringify({\n      title: `Fall Alert — Room ${roomId}`,\n      body:  `${eventType} detected at ${timestamp}`,\n      roomId,\n      url:   `/dashboard/room/${roomId}`,\n    }))\n  )\n);' },
        ],
        artifacts: [
          { file: 'apps/web/src/app/api/push/subscribe/route.ts', role: 'POST — upserts browser PushSubscription into server-side store (keyed by subscription endpoint).' },
          { file: 'apps/web/src/app/api/push/send/route.ts',      role: 'POST — receives webhook from ambientcloud, verifies HMAC sig, fans out push to all subscribers.' },
        ],
      },
    ],
  },
  {
    id: 'mobile-ui', phase: '04', title: 'Mobile UI', status: 'done', tag: 'PWA', time: '~2 days',
    summary: 'Responsive layout adapted for nurse phones and tablets. Safe area insets for notch/Dynamic Island, 44px touch targets per Apple HIG, bottom nav bar for one-thumb operation.',
    sections: [
      {
        heading: 'Safe area insets',
        commands: [
          { label: 'apply safe area in CSS', code: '/* globals.css — applied to the bottom nav and full-screen containers */\n.safe-bottom {\n  padding-bottom: env(safe-area-inset-bottom);\n}\n.safe-top {\n  padding-top: env(safe-area-inset-top);\n}\n\n/* In the PWA shell — avoid content under the notch */\nbody {\n  padding-top: env(safe-area-inset-top);\n  /* Don\'t pad bottom — bottom nav handles that */\n}' },
        ],
        body: 'The viewport meta tag must include viewport-fit=cover for safe area insets to take effect. This is set in apps/web/src/app/layout.tsx via the Next.js Viewport export.',
        warnings: [
          'Without viewport-fit=cover, env(safe-area-inset-*) returns 0 on all devices. Verify this is set in the Viewport export — not in a <meta> tag, since Next.js deduplicates viewport meta.',
        ],
      },
      {
        heading: 'Touch targets and bottom nav',
        table: {
          cols: ['Component', 'Min touch target', 'Notes'],
          rows: [
            ['Room card tap area',    '44×44px', 'Apple HIG minimum. Expand tap area beyond visible element if needed.'],
            ['Alert acknowledge btn', '44×44px', 'Critical action — must be thumb-reachable in bottom 40% of screen.'],
            ['Bottom nav items',      '48×48px', 'Material Design 3 minimum for bottom nav.'],
            ['Ella speak button',     '44×44px', 'Audio play — single tap, no long press.'],
            ['Dismiss alert',         '44×44px', 'Destructive — confirm dialog on tap, not swipe.'],
          ],
        },
        artifacts: [
          { file: 'apps/web/src/components/BottomNav.tsx', role: 'Mobile bottom navigation bar: Overview, Alerts, Room List, Settings. Shown only in standalone PWA mode.' },
        ],
      },
      {
        heading: 'Standalone mode detection',
        commands: [
          { label: 'detect PWA standalone vs browser', code: '// Use to show/hide bottom nav and adjust padding\nconst isStandalone =\n  window.matchMedia("(display-mode: standalone)").matches ||\n  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;\n\n// React hook:\nfunction useIsStandalone() {\n  const [standalone, setStandalone] = useState(false);\n  useEffect(() => {\n    setStandalone(\n      window.matchMedia("(display-mode: standalone)").matches ||\n      (window.navigator as Navigator & { standalone?: boolean }).standalone === true\n    );\n  }, []);\n  return standalone;\n}' },
        ],
      },
    ],
  },
  {
    id: 'capacitor', phase: '05', title: 'Capacitor Init', status: 'pending', tag: 'Native', time: '~2 hrs',
    summary: 'Capacitor 6 wraps the Next.js PWA in a native iOS/Android shell. The static export of the web app is bundled into the native binary, enabling App Store distribution and native plugin access.',
    sections: [
      {
        heading: 'Install and initialize',
        commands: [
          { label: 'add capacitor to the web app', code: 'cd apps/web\npnpm add @capacitor/core @capacitor/cli\npnpm add @capacitor/ios @capacitor/android\n\n# Initialize (run once)\nnpx cap init "Ambient Nurse" "com.ambientintel.nurse" \\\n  --web-dir out\n\n# Verify capacitor.config.ts was created\ncat capacitor.config.ts' },
          { label: 'capacitor.config.ts', code: 'import { CapacitorConfig } from "@capacitor/cli";\n\nconst config: CapacitorConfig = {\n  appId:    "com.ambientintel.nurse",\n  appName:  "Ambient Nurse",\n  webDir:   "out",           // Next.js static export output\n  server: {\n    androidScheme: "https", // Required for Android cookies\n  },\n  ios: {\n    contentInset: "always", // Respect safe areas\n  },\n};\n\nexport default config;' },
        ],
        warnings: [
          'Capacitor requires a static export (next export or output: "export" in next.config). The ambientweb app currently uses server-side API routes (/api/*) which are incompatible with static export. API routes must be moved to a separate backend (ambientcloud) before Capacitor bundling.',
          'WorkOS SSO uses server-side cookie manipulation in /api/auth/callback. This must be replaced with a mobile-compatible OAuth flow (in-app browser + deep-link callback) before the Capacitor build will work end-to-end.',
        ],
      },
      {
        heading: 'Add platforms and sync',
        commands: [
          { label: 'add iOS and Android targets', code: 'cd apps/web\nnpx cap add ios\nnpx cap add android\n\n# After every web build:\nnext build && next export\nnpx cap sync\n# Copies out/ into ios/App/public and android/app/src/main/assets/public' },
          { label: 'open in Xcode / Android Studio', code: 'npx cap open ios      # Opens ios/ in Xcode\nnpx cap open android  # Opens android/ in Android Studio' },
        ],
        artifacts: [
          { file: 'apps/web/ios/',     role: 'Xcode project. Generated by cap add ios — do not hand-edit. Managed by cap sync.' },
          { file: 'apps/web/android/', role: 'Gradle project. Generated by cap add android — do not hand-edit. Managed by cap sync.' },
        ],
      },
    ],
  },
  {
    id: 'ios-build', phase: '06', title: 'iOS Build', status: 'pending', tag: 'Native', time: '~1 day',
    summary: 'Xcode build targeting iOS 16+. Bundle ID com.ambientintel.nurse. Requires an Apple Developer Program membership and a provisioning profile for device testing.',
    sections: [
      {
        heading: 'Xcode project setup',
        commands: [
          { label: 'open and configure the Xcode project', code: 'cd apps/web\nnpx cap open ios\n# In Xcode:\n# 1. Select "App" target → Signing & Capabilities\n# 2. Set Team: Ambient Intelligence, Inc.\n# 3. Bundle Identifier: com.ambientintel.nurse\n# 4. Deployment Target: iOS 16.0\n# 5. Check "Automatically manage signing"' },
          { label: 'build for device from CLI', code: 'cd apps/web/ios\nxcodebuild -workspace App.xcworkspace \\\n  -scheme App \\\n  -configuration Release \\\n  -destination "generic/platform=iOS" \\\n  -archivePath build/App.xcarchive \\\n  archive\n\nxcodebuild -exportArchive \\\n  -archivePath build/App.xcarchive \\\n  -exportOptionsPlist ExportOptions.plist \\\n  -exportPath build/ipa/' },
        ],
        table: {
          cols: ['Build setting', 'Value', 'Notes'],
          rows: [
            ['Bundle ID',        'com.ambientintel.nurse',  'Must match App Store Connect and push certificate'],
            ['Version',          '1.0.0',                   'Semantic version shown in Settings → General'],
            ['Build number',     'Auto-increment in CI',    'App Store Connect requires unique build per upload'],
            ['Deployment target','iOS 16.0',                'Covers 97%+ of active devices as of 2026'],
            ['Capabilities',     'Push Notifications, Background Modes (Remote notifications)', 'Both required for fall alerts'],
          ],
        },
        warnings: [
          'Push Notifications capability must be added in both Xcode (Signing & Capabilities) and the Apple Developer Portal (Identifiers → com.ambientintel.nurse). Missing either causes silent push delivery failure.',
        ],
      },
    ],
  },
  {
    id: 'android-build', phase: '07', title: 'Android Build', status: 'pending', tag: 'Native', time: '~1 day',
    summary: 'Gradle build targeting Android 10+ (API 29). Signed AAB for Google Play or APK for enterprise sideload. Keystore stored in Vercel env vars for CI builds.',
    sections: [
      {
        heading: 'Keystore setup',
        commands: [
          { label: 'generate release keystore (one time)', code: 'keytool -genkey -v \\\n  -keystore ambient-nurse.keystore \\\n  -alias ambientnurse \\\n  -keyalg RSA -keysize 2048 \\\n  -validity 10000\n\n# Store keystore password + key password in Vercel env vars:\n# ANDROID_KEYSTORE_BASE64  ← base64-encoded .keystore file\n# ANDROID_KEY_ALIAS        ← ambientnurse\n# ANDROID_KEY_PASSWORD     ← key password\n# ANDROID_STORE_PASSWORD   ← store password' },
          { label: 'build signed AAB', code: 'cd apps/web/android\n./gradlew bundleRelease \\\n  -Pandroid.injected.signing.store.file=../ambient-nurse.keystore \\\n  -Pandroid.injected.signing.store.password=$ANDROID_STORE_PASSWORD \\\n  -Pandroid.injected.signing.key.alias=$ANDROID_KEY_ALIAS \\\n  -Pandroid.injected.signing.key.password=$ANDROID_KEY_PASSWORD\n\n# Output: app/build/outputs/bundle/release/app-release.aab' },
        ],
        warnings: [
          'Never commit ambient-nurse.keystore to git. Loss of the keystore means you cannot publish updates to the same app on Google Play — the app must be relisted under a new package ID. Store it in a password manager and in encrypted Vercel env vars.',
        ],
      },
      {
        heading: 'Enterprise APK sideload',
        body: 'For the MOH pilot, enterprise sideloading via MDM is simpler than a Play Store listing. Build a signed APK (not AAB), distribute via the facility MDM profile.',
        commands: [
          { label: 'build signed APK for sideload', code: 'cd apps/web/android\n./gradlew assembleRelease\n\n# Output: app/build/outputs/apk/release/app-release.apk\n# Upload to MDM or distribute directly for manual install' },
        ],
      },
    ],
  },
  {
    id: 'signing', phase: '08', title: 'Code Signing', status: 'pending', tag: 'iOS', time: '~2 hrs',
    summary: 'Apple Developer Enterprise Program signing for facility iPad distribution. Provisioning profile locked to com.ambientintel.nurse, distributed via MDM rather than the App Store.',
    sections: [
      {
        heading: 'Certificate types',
        table: {
          cols: ['Certificate', 'Program required', 'Distribution method', 'Use case'],
          rows: [
            ['Development',           'Standard ($99/yr)',     'Device UDID allowlist',    'Engineer devices, internal testing'],
            ['App Store Distribution','Standard ($99/yr)',     'App Store / TestFlight',   'Public release, TestFlight beta'],
            ['Enterprise (In-House)', 'Enterprise ($299/yr)', 'MDM / direct install URL', 'MOH pilot iPads — no App Store'],
          ],
        },
        commands: [
          { label: 'create provisioning profile in developer portal', code: '# 1. developer.apple.com → Certificates, IDs & Profiles\n# 2. Identifiers → Register App ID: com.ambientintel.nurse\n# 3. Add capabilities: Push Notifications\n# 4. Profiles → New Profile → In-House (Enterprise)\n# 5. Select App ID: com.ambientintel.nurse\n# 6. Select Distribution Certificate → Generate\n# 7. Download: AmbientNurse_Enterprise.mobileprovision\n# 8. Double-click to install in Xcode' },
        ],
        warnings: [
          'Enterprise (In-House) distribution requires an Apple Developer Enterprise Program account ($299/yr, requires DUNS number and business verification). Standard Developer accounts cannot distribute outside the App Store or TestFlight.',
          'Enterprise-signed apps must be re-signed annually when the provisioning profile expires. Plan a calendar reminder 30 days before expiry — expired profiles cause the app to crash on launch with no visible error on the device.',
        ],
      },
    ],
  },
  {
    id: 'apns', phase: '09', title: 'APNs Push', status: 'pending', tag: 'iOS', time: '~1 day',
    summary: 'Native APNs push for the Capacitor-wrapped iOS app. Replaces Web Push (VAPID) for installed app builds. Requires APNs auth key and the @capacitor/push-notifications plugin.',
    sections: [
      {
        heading: 'APNs key setup',
        commands: [
          { label: 'create APNs auth key in developer portal', code: '# developer.apple.com → Keys → Create a Key\n# Check "Apple Push Notifications service (APNs)"\n# Name: Ambient Nurse Push\n# Download: AuthKey_XXXXXXXXXX.p8\n# Note: Key ID + Team ID (shown in top-right of developer portal)\n\n# Store securely — can only be downloaded once' },
          { label: 'configure push plugin in capacitor', code: 'cd apps/web\npnpm add @capacitor/push-notifications\nnpx cap sync\n\n// In your app init code:\nimport { PushNotifications } from "@capacitor/push-notifications";\n\nawait PushNotifications.requestPermissions();\nawait PushNotifications.register();\n\nPushNotifications.addListener("registration", ({ value: token }) => {\n  // Send APNs device token to ambientcloud\n  fetch("/api/push/register-apns", {\n    method: "POST",\n    body: JSON.stringify({ token, platform: "ios" }),\n    headers: { "Content-Type": "application/json" },\n  });\n});\n\nPushNotifications.addListener("pushNotificationReceived", notification => {\n  // App is foregrounded — show in-app alert\n  showInAppAlert(notification);\n});' },
        ],
        warnings: [
          'APNs device tokens change after app reinstall, OS upgrade, and sometimes after backup restore. Always upsert the token on app launch — never assume the stored token is current.',
          'Web Push (VAPID) and APNs push are separate stacks. For the Capacitor iOS build, use @capacitor/push-notifications (APNs). For the PWA browser install, use the Web Push API. The ambientcloud fanout must route to the correct stack based on the subscription type.',
        ],
      },
    ],
  },
  {
    id: 'enterprise-dist', phase: '10', title: 'Enterprise Distribution', status: 'pending', tag: 'iOS', time: '~1 day',
    summary: 'Apple Business Manager + MDM push to facility iPads. The IPA is signed with the Enterprise certificate and distributed via the facility MDM profile without App Store review.',
    sections: [
      {
        heading: 'MDM distribution flow',
        checklist: [
          'Apple Developer Enterprise Program account active (com.ambientintel.nurse)',
          'IPA signed with Enterprise Distribution provisioning profile',
          'Facility IT has enrolled iPads in Apple Business Manager',
          'MDM server (Jamf / Mosyle / Kandji) configured for the facility',
          'App uploaded to MDM as a custom in-house app',
          'MDM policy pushes app automatically to all enrolled nurse iPads',
          'Push notification permission granted via MDM policy (no user prompt required)',
        ],
        commands: [
          { label: 'build IPA for enterprise distribution', code: '# ExportOptions.plist for enterprise:\n# method: enterprise\n# teamID: YOUR_TEAM_ID\n# provisioningProfiles:\n#   com.ambientintel.nurse: AmbientNurse_Enterprise\n\nxcodebuild -exportArchive \\\n  -archivePath build/App.xcarchive \\\n  -exportOptionsPlist ExportOptions-Enterprise.plist \\\n  -exportPath build/enterprise-ipa/' },
        ],
      },
      {
        heading: 'Manifest URL distribution (alternative)',
        body: 'If MDM is not available, an HTTPS manifest URL can be used for OTA install. Host the IPA and a manifest.plist on a TLS server and share the itms-services:// URL with nurses.',
        commands: [
          { label: 'manifest.plist for OTA install', code: '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>\n<plist version="1.0"><dict>\n  <key>items</key><array><dict>\n    <key>assets</key><array><dict>\n      <key>kind</key><string>software-package</string>\n      <key>url</key><string>https://dist.ambientintel.com/ambient-nurse-1.0.ipa</string>\n    </dict></array>\n    <key>metadata</key><dict>\n      <key>bundle-identifier</key><string>com.ambientintel.nurse</string>\n      <key>bundle-version</key><string>1.0.0</string>\n      <key>kind</key><string>software</string>\n      <key>title</key><string>Ambient Nurse</string>\n    </dict>\n  </dict></array>\n</dict></plist>' },
        ],
        warnings: [
          'OTA install via manifest URL requires HTTPS with a valid certificate chain on the hosting server. Self-signed certs cause a silent install failure on iOS.',
        ],
      },
    ],
  },
  {
    id: 'testflight', phase: '11', title: 'TestFlight', status: 'pending', tag: 'Ship', time: '~2 hrs',
    summary: 'Internal TestFlight distribution for engineering team testing before enterprise rollout. Up to 100 internal testers, no App Store review. 90-day build expiry.',
    sections: [
      {
        heading: 'Upload to App Store Connect',
        commands: [
          { label: 'upload IPA via Transporter or CLI', code: '# Option 1: Xcode Organizer → Distribute App → TestFlight\n\n# Option 2: xcrun altool (deprecated but still works)\nxcrun altool --upload-app \\\n  -f build/ipa/App.ipa \\\n  -t ios \\\n  -u $APPLE_ID \\\n  -p $APP_SPECIFIC_PASSWORD\n\n# Option 3: Transporter CLI\ntransporter -u $APPLE_ID -p $APP_SPECIFIC_PASSWORD -f build/ipa/App.ipa' },
        ],
        checklist: [
          'App record created in App Store Connect (appstoreconnect.apple.com)',
          'Bundle ID com.ambientintel.nurse matches Xcode project',
          'Build uploaded and processed (5–15 min after upload)',
          'Internal testing group created: Ambient Engineering',
          'All engineers added as internal testers by Apple ID',
          'TestFlight invite emails accepted by all testers',
          'App installed from TestFlight on at least one iPhone and one iPad',
        ],
      },
      {
        heading: 'Build expiry',
        body: 'TestFlight builds expire after 90 days. Set a calendar reminder to upload a new build before expiry — nurses cannot launch an expired TestFlight build and will see a confusing error. Production will use the Enterprise distribution path, not TestFlight.',
        warnings: [
          'TestFlight internal builds do not require App Store review. External TestFlight (up to 10,000 testers) requires a review. For the MOH pilot we stay internal and ship via Enterprise distribution — no external TestFlight needed.',
        ],
      },
    ],
  },
  {
    id: 'prod-build', phase: '12', title: 'Production Build', status: 'pending', tag: 'Ship', time: '~1 hr',
    summary: 'Full CI build: pnpm build → next export → cap sync → xcodebuild release → Gradle release. All artifacts versioned and stored in GitHub Actions.',
    sections: [
      {
        heading: 'CI build sequence',
        commands: [
          { label: 'full mobile production build', code: '# Step 1: build Next.js static export\ncd apps/web\npnpm build\n# Requires next.config.js: output: "export"\n# Output: apps/web/out/\n\n# Step 2: sync to Capacitor\nnpx cap sync ios\nnpx cap sync android\n\n# Step 3: iOS archive\ncd ios\nxcodebuild -workspace App.xcworkspace \\\n  -scheme App -configuration Release \\\n  -destination "generic/platform=iOS" \\\n  -archivePath ../build/App.xcarchive archive\n\n# Step 4: Android AAB\ncd ../android\n./gradlew bundleRelease' },
        ],
        warnings: [
          'next export is incompatible with API routes and dynamic server-side rendering. All /api/* routes must be hosted on ambientcloud before the Capacitor build will produce a working app. The web PWA (apps/web) continues to work with server-side routes — only the native Capacitor build requires the static export.',
        ],
      },
    ],
  },
  {
    id: 'pilot-validation', phase: '13', title: 'Pilot Validation', status: 'pending', tag: 'Ship', time: '~1 week',
    summary: 'On-device smoke test on one iPhone and one iPad. Covers auth, keyring unlock, fall alert push notification (APNs), Ella TTS, and alert acknowledge — end-to-end on real hardware.',
    sections: [
      {
        heading: 'On-device test checklist',
        checklist: [
          'PWA installs to home screen on iPhone (Safari share sheet → Add to Home Screen)',
          'PWA installs to home screen on iPad',
          'Standalone mode active — no browser chrome visible on launch',
          'WorkOS SSO sign-in completes without redirect errors in standalone mode',
          'Keyring unlock modal appears and decrypts correctly with pilot passphrase',
          'Dashboard overview loads with room grid and alert table',
          'Fall alert push notification received within 5 seconds of test event',
          'Tapping notification opens correct room detail page',
          'Ella narrative loads and TTS plays correctly',
          'Alert acknowledge action works without page reload',
          'Bottom nav bar visible and all tabs navigate correctly',
          'Safe area insets correct on iPhone 16 Pro (Dynamic Island) and iPad',
          'App works offline: shell loads from cache, alert table shows last state',
        ],
      },
      {
        heading: 'APNs vs Web Push verification',
        commands: [
          { label: 'trigger test push via ambientcloud webhook', code: '# Send test fall event to /api/push/send\ncurl -X POST https://ellamemory.com/api/push/send \\\n  -H "Content-Type: application/json" \\\n  -H "x-ambient-sig: $TEST_WEBHOOK_SIG" \\\n  -d \'{ "roomId": "301", "eventType": "Fall Detected", "timestamp": "2026-05-07T14:30:00Z" }\'\n\n# Expected:\n# 1. Capacitor iOS app (APNs): native lock-screen notification\n# 2. PWA browser tab (Web Push): browser notification\n# 3. Both appear within 5 seconds' },
        ],
        warnings: [
          'APNs delivery requires the Capacitor app to be signed with a provisioning profile that has Push Notifications enabled. If push fails silently, check Xcode console for "APNs registration failed" — this almost always means the capability is missing from the provisioning profile.',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const APP_SPECS = [
  { label: 'PWA Stack',  value: 'Next.js 16',        sub: 'Service Worker · Web Push · Standalone' },
  { label: 'Native',     value: 'Capacitor 6',        sub: 'iOS 16+ · Android 10+' },
  { label: 'Push',       value: 'APNs + VAPID',       sub: 'Native iOS · PWA browser' },
  { label: 'Distribution', value: 'Enterprise MDM',  sub: 'Apple Business Manager · Jamf' },
  { label: 'Bundle ID',  value: 'com.ambientintel.nurse', sub: 'Nurse fall-alert app' },
];

const CHECKLIST_ITEMS = [
  'manifest.json verified — name, icons, display: standalone',
  'apple-touch-icon and PWA meta tags in layout.tsx',
  'Service worker registered and caching shell routes',
  'Push permission flow working on Android Chrome',
  'Push permission working on iOS (standalone mode required)',
  'Web Push VAPID subscription stored per-device',
  'Fall alert push notification delivered within 5 sec',
  'Mobile layout: safe area insets applied',
  'Touch targets: all interactive elements ≥ 44×44px',
  'Bottom nav bar visible in standalone mode',
  'Capacitor initialized: capacitor.config.ts created',
  'iOS platform added: apps/web/ios/ directory present',
  'Android platform added: apps/web/android/ directory present',
  'iOS code signing configured: com.ambientintel.nurse',
  'Push Notifications capability added in Xcode',
  'APNs auth key created and stored securely',
  '@capacitor/push-notifications device token registered',
  'Enterprise provisioning profile generated',
  'IPA built and installed on pilot iPad via MDM or OTA',
  'End-to-end: fall event → APNs notification → room detail',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 6, 7, 8]);

const OPEN_DECISIONS = [
  'API route migration: /api/* must move to ambientcloud before Capacitor static export is possible — timeline undefined',
  'WorkOS mobile OAuth: replace server-side cookie auth with in-app browser + deep-link callback for Capacitor compatibility',
  'APNs vs Web Push fanout: ambientcloud must route push by subscription type (APNs token vs VAPID endpoint) — architecture pending',
  'MDM provider: Jamf Pro vs Mosyle Business for the MOH iPad fleet — pending IT procurement decision',
  'Android strategy: enterprise APK sideload via MDM vs Google Play private app — Play requires business verification',
];

// ── Page component ─────────────────────────────────────────────────────────────

const LS_KEY = 'ambient-mobileapp-checklist-v1';

export default function MobileAppPage() {
  const [active, setActive]       = useState('manifest');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [checked, setChecked]     = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag] = useState('All');
  const [shipFrozen, setShipFrozen] = useState(false);

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

  function toggleSection(key: string) { setCollapsed(p => ({ ...p, [key]: !p[key] })); }
  function expandAll() { setCollapsed({}); }
  function collapseAll() {
    const all: Record<string, boolean> = {};
    step.sections.forEach((_, i) => { all[`${active}-${i}`] = true; });
    setCollapsed(prev => ({ ...prev, ...all }));
  }

  const TAGS = ['All', 'PWA', 'Native', 'iOS', 'Ship'];
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => { warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0); });

  function isSectionOpen(key: string) { return focusMode ? true : collapsed[key] !== true; }

  return (
    <div className="app" style={{ background: '#F1F3F6', minHeight: '100vh', position: 'relative' }}>
      <LissajousCanvas />

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: 18 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px', marginBottom: 14 }}>
              <div style={{ width: 27, height: 27, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="4" height="4" rx="1" fill="#2563EB"/>
                  <rect x="8" y="2" width="4" height="4" rx="1" fill="#2563EB" opacity="0.5"/>
                  <rect x="2" y="8" width="4" height="4" rx="1" fill="#2563EB" opacity="0.5"/>
                  <rect x="8" y="8" width="4" height="4" rx="1" fill="#2563EB" opacity="0.3"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#6B7280' }}>Mobile App</em>
              </span>
            </div>
          </Link>

          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #059669, #2563EB)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: filterTag === tag ? '#EFF6FF' : '#FFFFFF', color: filterTag === tag ? '#2563EB' : '#6B7280', transition: 'all 0.12s' }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PIPELINE_PHASES.map(phase => {
            const phaseSteps = phase.ids.map(id => STEPS.find(s => s.id === id)!).filter(s => filterTag === 'All' || s.tag === filterTag);
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
                      {warns > 0 && <span title={`${warns} warning${warns > 1 ? 's' : ''}`} style={{ fontSize: 9, background: '#FEF9C3', color: '#A16207', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--mono)', flexShrink: 0 }}>⚠{warns}</span>}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

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

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 22, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · Mobile</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              Nurse <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Mobile App</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 500, lineHeight: 1.6 }}>
              PWA build, Capacitor native wrapper, and enterprise iOS distribution runbook for the Ambient fall-alert nurse app.
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
                      <span key={id} style={{ display: 'flex', alignItems: 'center' }}>
                        {si > 0 && <span style={{ display: 'inline-block', width: 12, height: 1, background: '#E5E7EB', margin: '0 -2px' }} />}
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

            {/* App Store milestone */}
            {(() => {
              const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);
              const ready = doneCount === CHECKLIST_ITEMS.length;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 24, height: 1, background: ready ? 'linear-gradient(90deg, #E5E7EB, #2563EB)' : '#E5E7EB' }} />
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke={ready ? '#2563EB' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: shipFrozen ? '#059669' : ready ? '#2563EB' : '#9CA3AF' }}>
                      {shipFrozen ? 'Milestone' : 'Goal'}
                    </div>
                    <button onClick={() => ready || shipFrozen ? setShipFrozen(f => !f) : undefined}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9, cursor: ready || shipFrozen ? 'pointer' : 'default', border: shipFrozen ? '1.5px solid #059669' : ready ? '1.5px solid #2563EB' : '1.5px dashed #D1D5DB', background: shipFrozen ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : ready ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : '#F9FAFB', transition: 'all 0.2s', boxShadow: shipFrozen ? '0 0 0 3px rgba(5,150,105,0.12)' : ready ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none' }}>
                      {shipFrozen ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke="#059669" strokeWidth="1.6" strokeLinecap="round"/><circle cx="8" cy="8" r="2" fill="#059669" opacity="0.3"/></svg>
                      ) : ready ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14M3.05 3.05l9.9 9.9M12.95 3.05l-9.9 9.9" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round"/><circle cx="8" cy="8" r="2" fill="#2563EB" opacity="0.3"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#9CA3AF" strokeWidth="1.4"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: shipFrozen ? '#059669' : ready ? '#1D4ED8' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                          {shipFrozen ? 'Shipped ✓' : 'App Ship'}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: shipFrozen ? '#059669' : ready ? '#2563EB' : '#9CA3AF' }}>
                          {shipFrozen ? 'v1.0 on MDM' : ready ? 'Ready — click to confirm' : `${pct}% complete`}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })()}
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
                      <button onClick={() => setFocusMode(f => !f)} style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #2563EB' : '1px solid #E5E7EB', background: focusMode ? '#EFF6FF' : '#FFFFFF', color: focusMode ? '#2563EB' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
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
                            <thead><tr style={{ background: '#F8FAFC' }}>
                              {sec.table.cols.map((col, ci) => <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>)}
                            </tr></thead>
                            <tbody>{sec.table.rows.map((row, ri) => (
                              <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                {row.map((cell, ci) => <td key={ci} style={{ padding: '9px 13px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.55, verticalAlign: 'top' }}>{cell}</td>)}
                              </tr>
                            ))}</tbody>
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
            <div style={{ padding: '16px 16px 14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Ship Checklist</div>
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
}
