'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';



// ── Domain definitions ─────────────────────────────────────────────────────────

const DOMAINS = [
  {
    id: 'firmware',
    href: '/firmware',
    label: 'Firmware',
    subtitle: 'AM62x Linux build chain',
    color: '#2563EB',
    colorBg: '#EFF6FF',
    colorBorder: '#BFDBFE',
    repo: 'ambientintel/ambientfirmware',
    lsKey: 'ambient-fw-checklist-v2',
    checklistTotal: 20,
    checklistDefault: 9,
    stepsTotal: 15,
    stepsDone: 6,
    phases: [
      { label: 'Environment', done: 3, total: 3 },
      { label: 'Build',       done: 3, total: 3 },
      { label: 'Bring-Up',   done: 0, total: 5 },
      { label: 'Production', done: 0, total: 4 },
    ],
    specs: [
      { k: 'Board',   v: 'SK-AM62-LP' },
      { k: 'Module',  v: 'OSD62x-PM' },
      { k: 'SDK',     v: '11.02.08.02' },
      { k: 'OTA',     v: 'Mender' },
    ],
    description: 'TI Processor SDK 11 · Yocto · U-Boot · custom DTB for IWR6843AOP integration. Build → bring-up → OTA.',
    currentStep: '07 · Kernel Patch Management',
    freezeKey: 'ambient-fw-frozen-v1',
    freezeLabel: 'Firmware Freeze',
  },
  {
    id: 'ee',
    href: '/ee',
    label: 'EE Hardware',
    subtitle: 'IWR6843AOP + OSD62x-PM PCB',
    color: '#C2410C',
    colorBg: '#FFF7ED',
    colorBorder: '#FED7AA',
    repo: 'ambientintel/ambientelectrical',
    lsKey: 'ambient-ee-checklist-v1',
    checklistTotal: 22,
    checklistDefault: 13,
    stepsTotal: 12,
    stepsDone: 6,
    phases: [
      { label: 'Design',   done: 4, total: 4 },
      { label: 'Output',   done: 2, total: 2 },
      { label: 'Build',    done: 0, total: 3 },
      { label: 'Validate', done: 0, total: 3 },
    ],
    specs: [
      { k: 'Radar',   v: 'IWR6843AOP' },
      { k: 'SoC',     v: 'OSD62x-PM' },
      { k: 'Rev',     v: 'EVT-0.1' },
      { k: 'Layers',  v: '8-layer' },
    ],
    description: '8-layer controlled-impedance board. Schematic → Gerbers → fab order → EVT bring-up. 21 CFR 820 DHF.',
    currentStep: '07 · Fab Order',
    freezeKey: 'ambient-ee-frozen-v1',
    freezeLabel: 'Design Freeze',
  },
  {
    id: 'mobileapp',
    href: '/mobileapp',
    label: 'Mobile App',
    subtitle: 'Expo SDK 54 · React Native',
    color: '#0D9488',
    colorBg: '#F0FDFA',
    colorBorder: '#99F6E4',
    repo: 'ambientintel/ambientapp',
    lsKey: 'ambient-mobileapp-checklist-v1',
    checklistTotal: 23,
    checklistDefault: 17,
    stepsTotal: 12,
    stepsDone: 11,
    phases: [
      { label: 'Environment',  done: 3, total: 3 },
      { label: 'Development',  done: 3, total: 3 },
      { label: 'Features',     done: 3, total: 3 },
      { label: 'Distribution', done: 2, total: 3 },
    ],
    specs: [
      { k: 'Framework', v: 'Expo 54' },
      { k: 'Auth',      v: 'Cognito SRP' },
      { k: 'Push',      v: 'APNS+FCM' },
      { k: 'Build',     v: 'EAS' },
    ],
    description: 'Nurse fall alert app. Cognito SRP auth + SecureStore session. Alert list, detail, acknowledge, false-positive flag all done. EAS iOS IPA build finished (May 12 2026, build 36dbf33f). Ready to distribute via TestFlight or OTA install link.',
    currentStep: '11 · Distribution',
    freezeKey: 'ambient-mobileapp-frozen-v1',
    freezeLabel: 'Phase I Lock',
  },
  {
    id: 'cloudengineering',
    href: '/cloudengineering',
    label: 'Cloud Engineering',
    subtitle: 'AWS CDK v2 · Python 3.12',
    color: '#4338CA',
    colorBg: '#EEF2FF',
    colorBorder: '#C7D2FE',
    repo: 'ambientintel/ambientcloud',
    lsKey: 'ambient-cloud-checklist-v2',
    checklistTotal: 22,
    checklistDefault: 21,
    stepsTotal: 12,
    stepsDone: 12,
    phases: [
      { label: 'Architect', done: 3, total: 3 },
      { label: 'Infra',     done: 3, total: 3 },
      { label: 'Deploy',    done: 4, total: 4 },
      { label: 'Validate',  done: 2, total: 2 },
    ],
    specs: [
      { k: 'Region',  v: 'us-east-1' },
      { k: 'Runtime', v: 'Python 3.12' },
      { k: 'AI',      v: 'Sonnet 4' },
      { k: 'IaC',     v: 'CDK v2' },
    ],
    description: 'CDK v2 · 11 CloudFormation stacks live · 18 API endpoints · 206 unit tests · 9 smoke tests. MOCAREV-NNNN coded subject IDs per study-mvp.md §1.5. Ella narratives live via Bedrock Sonnet 4 (cross-region inference) — Athena partition-projection fixed. X-Ray tracing, reserved concurrency, HIPAA 7-yr TTL. 5-job CI/CD pipeline.',
    currentStep: '12 · Production Sign-Off',
    freezeKey: 'ambient-cloud-frozen-v1',
    freezeLabel: 'Production Freeze',
  },
  {
    id: 'mechanical',
    href: '/mechanical',
    label: 'Mechanical',
    subtitle: 'IWR6843AOP enclosure · harness · fab',
    color: '#0891B2',
    colorBg: '#ECFEFF',
    colorBorder: '#A5F3FC',
    repo: 'ambientintel/ambientmechanical',
    lsKey: 'ambient-mechanical-checklist-v1',
    checklistTotal: 22,
    checklistDefault: 5,
    stepsTotal: 7,
    stepsDone: 1,
    phases: [
      { label: 'Design',    done: 1, total: 3 },
      { label: 'Enclosure', done: 0, total: 1 },
      { label: 'Fab',       done: 0, total: 2 },
      { label: 'Validate',  done: 0, total: 1 },
    ],
    specs: [
      { k: 'Footprint', v: '100×80 mm' },
      { k: 'Compute',   v: 'OSD62x-PM' },
      { k: 'Radar',     v: 'IWR6843AOP' },
      { k: 'Enclosure', v: 'IP42' },
    ],
    description: 'PCB design, enclosure, cable harness, fabrication, and validation for the Ambient ceiling-mount radar compute node.',
    currentStep: '02 · PCB Design (Altium)',
    freezeKey: 'ambient-mechanical-frozen-v1',
    freezeLabel: 'EVT Freeze',
  },
  {
    id: 'webapp',
    href: '/webapp',
    label: 'Web App',
    subtitle: 'Next.js 16 · pnpm monorepo',
    color: '#7C3AED',
    colorBg: '#F5F3FF',
    colorBorder: '#DDD6FE',
    repo: 'ambientintel/ambientweb',
    lsKey: 'ambient-webapp-checklist-v1',
    checklistTotal: 20,
    checklistDefault: 19,
    stepsTotal: 13,
    stepsDone: 13,
    phases: [
      { label: 'Setup',     done: 4, total: 4 },
      { label: 'Build',     done: 4, total: 4 },
      { label: 'Integrate', done: 2, total: 2 },
      { label: 'Ship',      done: 3, total: 3 },
    ],
    specs: [
      { k: 'Runtime',  v: 'Next.js 16' },
      { k: 'Auth',     v: 'WorkOS' },
      { k: 'Workspace', v: 'pnpm 9' },
      { k: 'Pilot',    v: '12 Rooms' },
    ],
    description: 'Ella Memory nurse dashboard — live at ellamemory.com. WorkOS email/password auth, HIPAA de-identification, nurse keyring AES-GCM unlock (4-hr idle lock, PBKDF2 600k), identity overlay wired into all 10 dashboard pages (Overview, Floor Map, Alerts, Reports, Analytics, Browse, Room detail, Devices, Archive, Engineering board). May 2026 security audit: assertNoPhi guard wired at the /api/ambient proxy boundary, /api/push/send locked behind ella-session, signin/signout fixed for local dev, weak cookie-key padding removed, Next.js patched 16.2.4 → 16.2.6, 8 dead deps pruned (authkit-nextjs, @nivo/*, radix-ui, cva, tailwind-merge), audit 17 → 1 vuln.',
    currentStep: '10 · Pilot Validation',
    freezeKey: 'ambient-webapp-frozen-v1',
    freezeLabel: 'Deployment Lock',
  },
] as const;

type Domain = typeof DOMAINS[number];

const INTEGRATIONS = [
  { from: 'Firmware', to: 'EE Hardware',      desc: 'Custom DTB targets OSD62x-PM BGA carrier; IWR6843AOP GPIO/SPI pin assignments from schematic' },
  { from: 'Firmware', to: 'Cloud Engineering', desc: 'Device publishes to ambient/v1/alerts/fall/{deviceId} (MQTT QoS 1) → IoT rule → alerts-enricher Lambda → SNS. Parquet frames uploaded via url-minter presigned URLs.' },
  { from: 'EE Hardware', to: 'Firmware',       desc: 'Power rail sequencing, JTAG header, UART debug pin positions — PCB stackup drives DTB addresses' },
  { from: 'Cloud Engineering', to: 'Mobile App', desc: 'FastAPI + Cognito JWT auth; SNS → APNS/FCM push; facility-scoped alert endpoints feed the app' },
  { from: 'Mechanical', to: 'EE Hardware', desc: 'PCB outline and mounting hole pattern locks enclosure form factor; ceiling bracket bolt pattern matches PCB stackup' },
  { from: 'Cloud Engineering', to: 'Web App', desc: 'Ella narrative API + REST alert endpoints; WorkOS JWT validated server-side; Parquet cold path feeds analytics charts' },
];

// ── Priority tasks per domain ──────────────────────────────────────────────────

const PRIORITY_TASKS: Record<string, { task: string; owner: string }[]> = {
  firmware: [
    { task: 'Boot custom DTB on OSD62x-PM carrier — confirm IWR6843AOP GPIO/SPI pin assignments', owner: 'BSP' },
    { task: 'Validate IWR6843AOP SPI data path in Linux userspace (mmWave SDK driver)', owner: 'BSP' },
    { task: 'Integrate Mender OTA client and run a remote update end-to-end', owner: 'DevOps' },
    { task: 'Complete bring-up test sequence steps 08–11 (power rails, UART, JTAG, clocks)', owner: 'HW+BSP' },
    { task: 'Sign off EVT bring-up checklist to unlock Production phase', owner: 'Lead' },
  ],
  ee: [
    { task: 'Submit Gerber package to fab — confirm 8-layer stackup, drill files, impedance spec', owner: 'Layout' },
    { task: 'Place BOM order: IWR6843AOP, OSD62x-PM, decoupling network, connectors', owner: 'Procurement' },
    { task: 'Assemble EVT-0.1 boards and perform power rail sequencing bring-up', owner: 'HW' },
    { task: 'Validate JTAG, UART debug headers, and IWR6843AOP SPI connectivity on bench', owner: 'HW' },
    { task: 'Open DHF and begin 21 CFR 820 design history documentation', owner: 'QA' },
  ],
  mobileapp: [
    { task: 'Distribute iOS IPA: send EAS OTA install link to pilot nurses (13-day window, build 36dbf33f)', owner: 'Mobile' },
    { task: 'Set up Firebase project → google-services.json → setup_android_push.sh → eas build --platform android', owner: 'Mobile+DevOps' },
    { task: 'Distribute to nurses: TestFlight invitations (iOS) + APK download link (Android)', owner: 'Mobile' },
    { task: 'Switch Lambda APNS_PLATFORM_APP_ARN from ella-apns-sandbox to ella-apns-prod before App Store submission', owner: 'DevOps' },
    { task: 'Resolve Apple Developer account -20209 lock via Apple Support for future direct portal access', owner: 'Mobile' },
  ],
  cloudengineering: [
    { task: 'Approve Bedrock model access in us-east-2 and us-west-2 (Ella cross-region inference — DLQ accumulating until resolved)', owner: 'Cloud' },
    { task: 'Re-seed DynamoDB with MOCAREV-NNNN records and drain Ella SQS DLQ after Bedrock access approved', owner: 'Cloud' },
    { task: 'Verify dual-write reconciler — TelemetryDivergence alarm, promote FAC-MOCAREV-001 to parquet_only', owner: 'Cloud' },
    { task: 'Production sign-off checklist — runbooks dry-run, CloudTrail data event verification', owner: 'Cloud+Security' },
    { task: 'Smoke test suite run against dev tenant post-deploy (pytest -m smoke)', owner: 'Cloud+Security' },
  ],
  mechanical: [
    { task: 'Complete PCB layout in Altium — route controlled-impedance traces, run DRC to zero errors', owner: 'Layout' },
    { task: 'Finalize BOM — confirm IWR6843AOP, OSD62x-PM, and all critical passives are in stock', owner: 'Procurement' },
    { task: 'Complete SolidWorks enclosure assembly and print FDM prototype for ceiling-mount fit-check', owner: 'ME' },
    { task: 'Generate Gerber package and submit for DFM review with fab house', owner: 'Layout' },
    { task: 'Resolve PoE+ vs barrel jack decision before Rev B — affects power routing and BOM cost', owner: 'Lead' },
  ],
  webapp: [
    { task: 'Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in Vercel — push notifications are dark until configured', owner: 'FE+DevOps' },
    { task: 'Set EDGE_CONFIG_ID + VERCEL_TOKEN in Vercel to persist push subscriptions across deploys (Edge Config ambient-push ecfg_wsm…)', owner: 'FE+DevOps' },
    { task: 'Set OPENAI_API_KEY in Vercel to activate the Ella TTS speak button on /dashboard/room/[roomId]', owner: 'FE+DevOps' },
    { task: 'Run pilot validation: nurse auth, Ella narrative, fall alert ACK, web push delivery across MOH 301–312', owner: 'Product+FE' },
    { task: 'Seed real room assignments from pilot coordinator — use Devices page PATCH to assign roomId + zone per device', owner: 'Product+FE' },
    { task: 'Verify device management page with admin Cognito account — confirm GET /admin/devices + PATCH /admin/devices/{id} respond 200', owner: 'FE+Cloud' },
    { task: 'Monitor /api/ambient proxy for 502s — keep AMBIENT_WEB_SVC_PASSWORD in sync with Cognito; new assertNoPhi guard will 502 if cloud returns a forbidden field', owner: 'DevOps' },
  ],
};

// ── Sprint focus (this week) ───────────────────────────────────────────────────

const SPRINT_FOCUS: Record<string, string[]> = {
  firmware: [
    'Patch DTB for OSD62x-PM — target first boot with IWR SPI GPIO mapped',
    'Run kernel CI on SK-AM62-LP, confirm mmWave driver loads at boot',
  ],
  ee: [
    'Final Gerber review — stackup, drill files, controlled-impedance spec sign-off',
    'Place BOM order at DigiKey — confirm IWR6843AOP + OSD62x-PM lead times',
  ],
  mobileapp: [
    'Distribute iOS IPA to pilot nurses: send EAS OTA install link (13-day window) or submit to TestFlight',
    'Set up Firebase + Android FCM build: google-services.json → setup_android_push.sh → eas build android',
  ],
  cloudengineering: [
    'Approve Bedrock model access (us-east-2 + us-west-2) → drain Ella DLQ → verify narrative generation end-to-end',
    'Promote FAC-MOCAREV-001 to parquet_only after reconciler shows 0% divergence over 24h',
  ],
  mechanical: [
    'Route all Altium traces, run DRC to zero errors, export preliminary Gerber',
    'Finalize ceiling-mount bracket geometry and print FDM prototype for fit-check',
  ],
  webapp: [
    'Add the three VAPID env vars + OPENAI_API_KEY in Vercel so push and TTS turn on (currently dark)',
    'Set EDGE_CONFIG_ID + VERCEL_TOKEN to persist push subscriptions across deploys, then confirm push delivery end-to-end',
    'Verify Devices page with admin Cognito account — GET /admin/devices + PATCH /admin/devices/{id}',
  ],
};

// ── Open decisions ─────────────────────────────────────────────────────────────

const OPEN_DECISIONS: { domain: string; urgency: 'high' | 'medium' | 'low'; text: string }[] = [
  { domain: 'Mechanical',        urgency: 'high',   text: 'PoE+ vs barrel jack — affects power routing, BOM cost, and enclosure cutout geometry.' },
  { domain: 'EE Hardware',       urgency: 'high',   text: 'Fab house selection — 4-week lead time risk if Gerbers not submitted by end of sprint.' },
  { domain: 'Firmware',          urgency: 'high',   text: 'Mender vs SWUpdate for OTA — Mender adds ~8 MB to rootfs; SWUpdate is lighter but less managed.' },
  { domain: 'Cloud Engineering', urgency: 'low',    text: 'Firehose retirement timeline — 90-day window after all facilities reach parquet_only; not yet contractually nailed down.' },
  { domain: 'Web App',           urgency: 'medium', text: 'Ella narrative poll interval — 30 s vs WebSocket for real-time nurse alert delivery.' },
  { domain: 'Firmware',          urgency: 'low',    text: 'Kernel version pin: 6.1 LTS vs 6.6 LTS — both supported by TI SDK 11, no urgency.' },
  { domain: 'Mechanical',        urgency: 'low',    text: 'Enclosure finish: matte vs glossy ABS — cosmetic only, deferred to Rev B.' },
];

// ── Cross-domain blockers ──────────────────────────────────────────────────────

const BLOCKERS: { blocked: string; blocking: string; issue: string }[] = [
  { blocked: 'Firmware',          blocking: 'EE Hardware',  issue: 'Custom DTB pin assignments can\'t be locked until PCB Gerbers are finalized' },
  { blocked: 'Mobile App',        blocking: 'Apple',        issue: 'Apple account -20209 lock still blocking direct Apple Developer Portal API — workaround (Admin ASC API key) in use; build queued' },
  { blocked: 'Mechanical',        blocking: 'EE Hardware',  issue: 'PCB outline dimensions needed to finalize enclosure form factor in SolidWorks' },
  { blocked: 'Cloud Engineering', blocking: 'AWS Console',  issue: 'Bedrock model access form pending in us-east-2 and us-west-2 — Ella SQS fanout fails until cross-region inference approved in all three regions' },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EngDashboard() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [frozen, setFrozen] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const p: Record<string, number> = {};
    const f: Record<string, string | null> = {};
    DOMAINS.forEach(d => {
      try {
        const raw = localStorage.getItem(d.lsKey);
        const done = raw ? (JSON.parse(raw) as number[]).length : d.checklistDefault;
        p[d.id] = done;
      } catch { p[d.id] = d.checklistDefault; }
      try {
        const fz = localStorage.getItem(d.freezeKey);
        f[d.id] = fz ? (JSON.parse(fz) as { date?: string }).date ?? 'Locked' : null;
      } catch { f[d.id] = null; }
    });
    setProgress(p);
    setFrozen(f);
    // Overlay with server-side shared state
    const domainKeyMap: Record<string, string> = {
      firmware: 'firmware', ee: 'ee', mobileapp: 'mobileapp', cloudengineering: 'cloud', mechanical: 'mechanical', webapp: 'webapp',
    };
    fetch('/api/eng/state').then(r => r.json()).then((all) => {
      const sp: Record<string, number> = {};
      const sf: Record<string, string | null> = {};
      DOMAINS.forEach(d => {
        const key = domainKeyMap[d.id];
        const serverDomain = key ? all[key] : undefined;
        if (serverDomain) {
          if (Array.isArray(serverDomain.checked)) sp[d.id] = serverDomain.checked.length;
          sf[d.id] = typeof serverDomain.frozen === 'string' ? serverDomain.frozen : null;
        }
      });
      setProgress(prev => ({ ...prev, ...sp }));
      setFrozen(prev => ({ ...prev, ...sf }));
    }).catch(() => {});
  }, []);

  const totalSteps  = DOMAINS.reduce((s, d) => s + d.stepsTotal, 0);
  const doneSteps   = DOMAINS.reduce((s, d) => s + d.stepsDone, 0);
  const totalItems  = DOMAINS.reduce((s, d) => s + d.checklistTotal, 0);
  const doneItems   = DOMAINS.reduce((s, d) => s + (progress[d.id] ?? d.checklistDefault), 0);
  const overallPct  = Math.round((doneItems / totalItems) * 100);

  return (
    <div style={{ minHeight: '100vh', background: '#F1F3F6', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto', padding: '36px 40px 80px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 22, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 8 }}>
              Ambient Intelligence · Engineering
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#111827' }}>
              Platform <em style={{ color: '#6B7280' }}>Status</em>
            </h1>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 13.5, lineHeight: 1.6, maxWidth: 480 }}>
              Fall-detection platform across four engineering domains. Firmware · EE Hardware · Mobile · Cloud.
            </p>
          </div>
          <Link href="/engineering" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            ← Engineering
          </Link>
        </div>

        {/* ── Aggregate stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Steps complete',   value: `${doneSteps} / ${totalSteps}`,   sub: `${Math.round((doneSteps/totalSteps)*100)}% across all domains`, color: '#059669' },
            { label: 'Checklist items',  value: `${doneItems} / ${totalItems}`,   sub: `${overallPct}% platform readiness`,                             color: '#2563EB' },
            { label: 'Domains active',   value: '4 / 4',                          sub: 'Firmware · EE · Mobile · Cloud',                               color: '#7C3AED' },
            { label: 'IRB protocol',     value: 'HIPAA §164.514(c)',              sub: 'Coded data · no PII in any path',                              color: '#D97706' },
          ].map(stat => (
            <div key={stat.label} style={{ padding: '14px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 5 }}>{stat.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: stat.color, marginBottom: 3 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Domain cards 2×2 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>
          {DOMAINS.map(d => {
            const done = progress[d.id] ?? d.checklistDefault;
            const pct = Math.round((done / d.checklistTotal) * 100);
            const isFrozen = !!frozen[d.id];
            return (
              <div key={d.id} style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>

                {/* Card header accent */}
                <div style={{ height: 3, background: d.color, borderRadius: '16px 16px 0 0' }} />

                <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <Link href={d.href} style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, color: '#111827', letterSpacing: '-0.01em', textDecoration: 'none' }}>{d.label} <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: d.color }}>↗</span></Link>
                        {isFrozen && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 999, padding: '2px 8px' }}>
                            {frozen[d.id]!.startsWith('Locked') || frozen[d.id]!.match(/[A-Za-z]+ \d/) ? `✓ ${d.freezeLabel}` : `✓ ${d.freezeLabel}`}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#9CA3AF', letterSpacing: '0.04em' }}>{d.subtitle}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: d.color, lineHeight: 1 }}>{pct}%</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{done}/{d.checklistTotal} items</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB', marginBottom: 16 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: d.color, width: `${pct}%`, transition: 'width 0.4s ease', opacity: 0.85 }} />
                  </div>

                  {/* Description */}
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>{d.description}</p>

                  {/* Phase pipeline */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {d.phases.map(ph => {
                      const phPct = ph.done / ph.total;
                      const allDone = ph.done === ph.total;
                      const started = ph.done > 0;
                      return (
                        <div key={ph.label} style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: allDone ? d.color : '#9CA3AF', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ph.label}</div>
                          <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, background: allDone ? d.color : started ? d.color : '#E5E7EB', width: `${phPct * 100}%`, opacity: allDone ? 1 : 0.5, transition: 'width 0.3s ease' }} />
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: allDone ? d.color : '#9CA3AF', marginTop: 3 }}>{ph.done}/{ph.total}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Specs row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                    {d.specs.map(spec => (
                      <div key={spec.k} style={{ padding: '7px 8px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 7 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 2 }}>{spec.k}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#111827', fontWeight: 600 }}>{spec.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Priority tasks */}
                  <div style={{ marginBottom: 16, background: d.colorBg, border: `1px solid ${d.colorBorder}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: d.color, fontWeight: 700, marginBottom: 10 }}>▸ Priority Tasks</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {(PRIORITY_TASKS[d.id] ?? []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#FFFFFF', fontWeight: 700, flexShrink: 0, background: d.color, borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, marginTop: 1 }}>{i + 1}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12.5, color: '#111827', lineHeight: 1.5 }}>{item.task}</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: d.color, marginLeft: 7, opacity: 0.7 }}>{item.owner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', marginBottom: 2 }}>Current step</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#374151' }}>{d.currentStep}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{d.stepsDone}/{d.stepsTotal} steps</div>
                      <a href={`https://github.com/${d.repo}/issues`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', textDecoration: 'none' }}>
                        Issues
                      </a>
                      <a href={`https://github.com/${d.repo}/pulls`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.08)', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', textDecoration: 'none' }}>
                        PRs
                      </a>
                      <Link href={d.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 7, background: d.colorBg, border: `1px solid ${d.colorBorder}`, color: d.color, fontSize: 12, fontFamily: 'var(--mono)', textDecoration: 'none', fontWeight: 500, transition: 'all 0.12s' }}>
                        Runbook →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sprint Focus (This Week) ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 16 }}>This Week · Sprint Focus</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {DOMAINS.map(d => (
              <div key={d.id} style={{ borderLeft: `3px solid ${d.color}`, paddingLeft: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700, color: d.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(SPRINT_FOCUS[d.id] ?? []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: d.color, flexShrink: 0, marginTop: 2 }}>▸</span>
                      <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cross-domain Blockers ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 14 }}>Cross-Domain Blockers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {BLOCKERS.map((b, i) => {
              const blockedDom  = DOMAINS.find(d => d.label === b.blocked);
              const blockingDom = DOMAINS.find(d => d.label === b.blocking);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '148px 30px 160px 1fr', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: i < BLOCKERS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, background: blockedDom?.colorBg ?? '#F8FAFC', color: blockedDom?.color ?? '#374151', border: `1px solid ${blockedDom?.colorBorder ?? '#E5E7EB'}`, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', display: 'inline-block' }}>{b.blocked}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#EF4444', textAlign: 'center' }}>⊘</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, background: blockingDom?.colorBg ?? '#F8FAFC', color: blockingDom?.color ?? '#374151', border: `1px solid ${blockingDom?.colorBorder ?? '#E5E7EB'}`, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', display: 'inline-block' }}>needs {b.blocking}</span>
                  <span style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.55 }}>{b.issue}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Cross-domain integration ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 14 }}>Cross-Domain Integration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {INTEGRATIONS.map((row, i) => {
              const fromDomain = DOMAINS.find(d => d.label === row.from)!;
              const toDomain   = DOMAINS.find(d => d.label === row.to)!;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 20px 130px 1fr', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: i < INTEGRATIONS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: fromDomain.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: fromDomain.color, fontWeight: 600 }}>{row.from}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: toDomain.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: toDomain.color, fontWeight: 600 }}>{row.to}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.55 }}>{row.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Open Decisions ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 16 }}>Open Decisions</div>
          {(['high', 'medium', 'low'] as const).map(urgency => {
            const items = OPEN_DECISIONS.filter(item => item.urgency === urgency);
            if (!items.length) return null;
            const urgencyColor  = urgency === 'high' ? '#EF4444' : urgency === 'medium' ? '#D97706' : '#9CA3AF';
            const urgencyBg     = urgency === 'high' ? '#FEF2F2' : urgency === 'medium' ? '#FFFBEB' : '#F8FAFC';
            const urgencyBorder = urgency === 'high' ? '#FECACA' : urgency === 'medium' ? '#FDE68A' : '#E5E7EB';
            return (
              <div key={urgency} style={{ marginBottom: urgency !== 'low' ? 16 : 0 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', background: urgencyBg, color: urgencyColor, border: `1px solid ${urgencyBorder}`, borderRadius: 999, padding: '2px 9px' }}>{urgency} priority</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {items.map((item, i) => {
                    const dom = DOMAINS.find(d => d.label === item.domain);
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: dom?.color ?? '#6B7280', background: dom?.colorBg ?? '#F8FAFC', border: `1px solid ${dom?.colorBorder ?? '#E5E7EB'}`, borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.domain}</span>
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Overall platform progress bar ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF' }}>Platform Readiness</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: overallPct >= 80 ? '#059669' : overallPct >= 50 ? '#D97706' : '#374151' }}>{overallPct}%</div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #2563EB 0%, #0D9488 33%, #C2410C 66%, #4338CA 100%)', width: `${overallPct}%`, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {DOMAINS.map(d => {
              const done = progress[d.id] ?? d.checklistDefault;
              const pct = Math.round((done / d.checklistTotal) * 100);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: d.color, fontWeight: 600 }}>{d.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: '#E5E7EB' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: d.color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
