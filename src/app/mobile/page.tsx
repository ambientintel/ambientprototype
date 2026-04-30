'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const C = {
  bg:         '#060708',
  surface:    '#0D0F13',
  surface2:   '#131619',
  border:     'rgba(255,255,255,0.06)',
  borderMid:  'rgba(255,255,255,0.11)',
  accent:     '#2B6BE0',
  accentDim:  'rgba(43,107,224,0.10)',
  accentLine: 'rgba(43,107,224,0.35)',
  text:       '#D8DADF',
  text2:      '#7A7D85',
  text3:      '#44474D',
  green:      '#2ECC8A',
  greenDim:   'rgba(46,204,138,0.10)',
  greenLine:  'rgba(46,204,138,0.30)',
  amber:      '#E8AA2A',
  amberDim:   'rgba(232,170,42,0.10)',
  amberLine:  'rgba(232,170,42,0.30)',
  red:        '#E05252',
  redDim:     'rgba(224,82,82,0.10)',
  redLine:    'rgba(224,82,82,0.30)',
  mono:       "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  sans:       "'Inter', -apple-system, sans-serif",
};

type OS = 'ios' | 'android' | 'unknown';

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'unknown';
}

const IOS_STEPS = [
  'Open this page in Safari — not Chrome or other browsers',
  'Tap the Share button at the bottom of the screen',
  'Select "Add to Home Screen" from the share sheet',
  'Tap "Add" in the top-right corner to confirm',
  'Open the installed app and allow notifications when prompted',
];

const ANDROID_STEPS = [
  'Open this page in Chrome',
  'Tap the three-dot menu in the top-right corner',
  'Select "Add to Home screen" or "Install app"',
  'Tap "Install" to confirm',
  'Open the installed app and allow notifications when prompted',
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
    ),
  });
}

interface InAppAlert {
  id: string;
  room: string;
  patient: string;
  severity: 'critical' | 'warning';
  confidence: number;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', color: C.text3, textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '0' }} />;
}

export default function MobilePage() {
  const [os, setOs]               = useState<OS>('unknown');
  const [tab, setTab]             = useState<'ios' | 'android'>('ios');
  const [mounted, setMounted]     = useState(false);
  const [notifAvailable, setNotifAvailable] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'subscribing'>('unknown');
  const [inAppAlert, setInAppAlert] = useState<InAppAlert | null>(null);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    setMounted(true);
    const detected = detectOS();
    setOs(detected);
    if (detected === 'android') setTab('android');

    const hasNotif = typeof Notification !== 'undefined';
    const hasPush  = 'PushManager' in window;
    setNotifAvailable(hasNotif && hasPush);

    if (hasNotif) {
      if (Notification.permission === 'granted') setNotifStatus('granted');
      else if (Notification.permission === 'denied') setNotifStatus('denied');
      else setNotifStatus('unknown');
    }

    if ('serviceWorker' in navigator) {
      const handler = (e: MessageEvent) => {
        if (e.data?.type !== 'PUSH_ALERT') return;
        const d = e.data.payload ?? {};
        setInAppAlert({ id: `${Date.now()}`, room: d.room ?? '—', patient: d.patient ?? 'Unknown', severity: d.severity === 'critical' ? 'critical' : 'warning', confidence: d.confidence ?? 0 });
        setTimeout(() => setInAppAlert(null), 8000);
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  async function enableNotifications() {
    setNotifStatus('subscribing');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setNotifStatus('denied'); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const sub = await subscribeToPush();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
      }
      setNotifStatus('granted');
    } catch {
      setNotifStatus('granted');
    }
  }

  async function sendTestPush() {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: 'TEST', patient: 'Test alert', floor: '—', severity: 'warning', confidence: 100, sensor: 'Manual' }),
    });
  }

  function copyLink() {
    navigator.clipboard?.writeText('https://ambientprototype.vercel.app/mobile');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = tab === 'ios' ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.sans }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes slideDown { from { transform: translateY(-110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* In-app alert banner */}
      {inAppAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: inAppAlert.severity === 'critical' ? '#110808' : '#110D03',
          borderBottom: `2px solid ${inAppAlert.severity === 'critical' ? C.red : C.amber}`,
          padding: '12px 16px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          animation: 'slideDown 0.2s ease',
          boxShadow: `0 8px 32px ${inAppAlert.severity === 'critical' ? 'rgba(224,82,82,0.2)' : 'rgba(232,170,42,0.15)'}`,
        }}>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: inAppAlert.severity === 'critical' ? C.red : C.amber, marginBottom: 4 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: inAppAlert.severity === 'critical' ? C.red : C.amber, marginRight: 6, verticalAlign: 'middle', animation: 'pulse 1s infinite' }} />
              {inAppAlert.severity === 'critical' ? 'FALL DETECTED' : 'FALL ALERT'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Room {inAppAlert.room} &mdash; {inAppAlert.patient}</div>
            <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text2, marginTop: 2 }}>{inAppAlert.confidence}% CONFIDENCE</div>
          </div>
          <button onClick={() => setInAppAlert(null)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.text2, fontSize: 13, cursor: 'pointer', padding: '6px 10px', fontFamily: C.mono, flexShrink: 0 }}>
            DISMISS
          </button>
        </div>
      )}

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '48px 20px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: '0.12em', marginBottom: 10 }}>
            AMBIENT INTELLIGENCE // MOBILE CLIENT
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: C.text }}>
            Fall Alert<br />Notification Setup
          </div>
          <div style={{ height: 2, width: 32, background: C.accent, marginTop: 16 }} />
        </div>

        {/* OS detected status strip */}
        {os !== 'unknown' && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.green}`,
            padding: '10px 14px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.green, letterSpacing: '0.06em' }}>
              {os === 'ios' ? 'iPHONE / iPAD DETECTED' : 'ANDROID DETECTED'}
            </span>
            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text3, marginLeft: 'auto' }}>
              {os.toUpperCase()}
            </span>
          </div>
        )}

        {/* Notification status block */}
        {mounted && (
          <div style={{ marginBottom: 28 }}>
            {notifStatus === 'granted' && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.green}` }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Label>Notification Status</Label>
                    <div style={{ fontFamily: C.mono, fontSize: 13, color: C.green, fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.green, marginRight: 7, verticalAlign: 'middle' }} />
                      ACTIVE
                    </div>
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>SUBSCRIBED</div>
                </div>
                <Divider />
                <div style={{ padding: '12px 16px' }}>
                  <button onClick={sendTestPush} style={{
                    background: 'transparent', border: `1px solid ${C.borderMid}`,
                    color: C.text2, fontFamily: C.mono, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.06em', padding: '10px 0', cursor: 'pointer', width: '100%',
                  }}>
                    RUN TEST ALERT
                  </button>
                </div>
              </div>
            )}

            {notifStatus === 'denied' && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.red}`, padding: '16px' }}>
                <Label>Notification Status</Label>
                <div style={{ fontFamily: C.mono, fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 10 }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.red, marginRight: 7, verticalAlign: 'middle' }} />
                  BLOCKED
                </div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
                  {os === 'ios'
                    ? 'Settings → Ambient Intelligence → Notifications → Allow Notifications'
                    : 'Settings → Apps → Chrome → Notifications → Allow'}
                </div>
              </div>
            )}

            {notifStatus === 'unknown' && !notifAvailable && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.amber}`, padding: '16px' }}>
                <Label>Notification Status</Label>
                <div style={{ fontFamily: C.mono, fontSize: 13, color: C.amber, fontWeight: 700, marginBottom: 10 }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.amber, marginRight: 7, verticalAlign: 'middle' }} />
                  PENDING INSTALL
                </div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
                  Push notifications require the app installed to your home screen. Complete the steps below, then return here.
                </div>
              </div>
            )}

            {notifStatus === 'unknown' && notifAvailable && (
              <div style={{ background: C.surface, border: `1px solid ${C.accentLine}` }}>
                <div style={{ padding: '16px' }}>
                  <Label>Notification Status</Label>
                  <div style={{ fontFamily: C.mono, fontSize: 13, color: C.accent, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.accent, marginRight: 7, verticalAlign: 'middle', animation: 'pulse 2s infinite' }} />
                    AUTHORIZATION REQUIRED
                  </div>
                  <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, marginTop: 8 }}>
                    Tap below to register this device for fall alert notifications.
                  </div>
                </div>
                <Divider />
                <div style={{ padding: '12px 16px' }}>
                  <button onClick={enableNotifications} style={{
                    background: C.accent, border: 'none',
                    color: '#fff', fontFamily: C.mono, fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.08em', padding: '14px 0', cursor: 'pointer', width: '100%',
                  }}>
                    ENABLE FALL ALERT NOTIFICATIONS
                  </button>
                </div>
              </div>
            )}

            {notifStatus === 'subscribing' && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.accent, animation: 'pulse 0.8s infinite' }} />
                <span style={{ fontFamily: C.mono, fontSize: 12, color: C.accent, letterSpacing: '0.06em' }}>REGISTERING DEVICE…</span>
              </div>
            )}
          </div>
        )}

        {/* Platform selector */}
        <div style={{ marginBottom: 2 }}>
          <Label>Platform</Label>
        </div>
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, marginBottom: 1 }}>
          {(['ios', 'android'] as const).map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              background: tab === t ? C.surface2 : 'transparent',
              borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
              borderTop: 'none', borderRight: 'none', borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
              color: tab === t ? C.text : C.text2,
              fontFamily: C.mono, fontSize: 11, fontWeight: tab === t ? 700 : 400,
              letterSpacing: '0.08em',
              padding: '11px 0', cursor: 'pointer',
            }}>{t === 'ios' ? 'iPHONE / iPAD' : 'ANDROID'}</button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 20 }}>
          {steps.map((text, i) => (
            <div key={i}>
              {i > 0 && <Divider />}
              <div style={{ display: 'flex', gap: 16, padding: '16px' }}>
                <div style={{
                  fontFamily: C.mono, fontSize: 13, fontWeight: 800,
                  color: C.accent, minWidth: 24, paddingTop: 1, flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 28 }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
            <Label>Requirements</Label>
          </div>
          {[
            { label: 'Notifications', value: 'Must be allowed when prompted' },
            { label: 'Background delivery', value: 'Alerts fire when app is closed or screen locked' },
            { label: 'Alert response', value: 'Tap any alert to open the room directly' },
          ].map((r, i) => (
            <div key={i}>
              {i > 0 && <Divider />}
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.amber, letterSpacing: '0.06em', flexShrink: 0, paddingTop: 1 }}>{r.label.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: C.text2, textAlign: 'right', lineHeight: 1.4 }}>{r.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 36 }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
            <Label>Share this link</Label>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ambientprototype.vercel.app/mobile
            </span>
            <button onClick={copyLink} style={{
              background: 'transparent', border: `1px solid ${C.borderMid}`,
              color: copied ? C.green : C.text2,
              fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
              transition: 'color 0.2s',
            }}>
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <Link href="/mobilelab" style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, textDecoration: 'none', letterSpacing: '0.08em' }}>
            MOBILE LAB
          </Link>
          <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>//</span>
          <Link href="/control" style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, textDecoration: 'none', letterSpacing: '0.08em' }}>
            CONTROL CENTER
          </Link>
        </div>

      </div>
    </div>
  );
}
