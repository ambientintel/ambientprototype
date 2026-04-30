'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const C = {
  bg: '#0C0D0F', surface: '#13151A', surface2: '#1C1F26',
  border: 'rgba(255,255,255,0.07)', accent: '#2D72D2', accentDim: 'rgba(45,114,210,0.12)',
  text: '#EDEEF0', text2: '#9A9B9D', text3: '#5C5E62',
  green: '#3DCC91', greenDim: 'rgba(61,204,145,0.12)',
  amber: '#FFC940', amberDim: 'rgba(255,201,64,0.12)',
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
  { icon: '🌐', text: 'Open this page in Safari (not Chrome)' },
  { icon: '□↑', text: 'Tap the Share button at the bottom of the screen', mono: true },
  { icon: '＋', text: 'Tap "Add to Home Screen"' },
  { icon: '✓',  text: 'Tap "Add" in the top-right corner' },
  { icon: '🔔', text: 'Open the app and allow notifications when prompted' },
];

const ANDROID_STEPS = [
  { icon: '🌐', text: 'Open this page in Chrome' },
  { icon: '⋮',  text: 'Tap the three-dot menu in the top-right corner', mono: true },
  { icon: '＋', text: 'Tap "Add to Home screen" or "Install app"' },
  { icon: '✓',  text: 'Tap "Install" to confirm' },
  { icon: '🔔', text: 'Open the app and allow notifications when prompted' },
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

export default function MobilePage() {
  const [os, setOs] = useState<OS>('unknown');
  const [tab, setTab] = useState<'ios' | 'android'>('ios');
  const [mounted, setMounted] = useState(false);
  const [notifAvailable, setNotifAvailable] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'subscribing'>('unknown');
  const [inAppAlert, setInAppAlert] = useState<InAppAlert | null>(null);

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
      // Unsubscribe from any stale subscription first
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

  const steps = tab === 'ios' ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
    }}>
      <style>{`* { box-sizing: border-box; } @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      {/* In-app alert banner — shown when app is open and foreground */}
      {inAppAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: inAppAlert.severity === 'critical' ? '#1a0a0a' : '#1a1400',
          borderBottom: `3px solid ${inAppAlert.severity === 'critical' ? C.red : C.amber}`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          animation: 'slideDown 0.25s ease',
          boxShadow: `0 4px 24px ${inAppAlert.severity === 'critical' ? 'rgba(255,107,107,0.25)' : 'rgba(255,201,64,0.2)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: inAppAlert.severity === 'critical' ? C.redDim : C.amberDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: inAppAlert.severity === 'critical' ? C.red : C.amber, textTransform: 'uppercase', marginBottom: 2 }}>
                {inAppAlert.severity === 'critical' ? 'Fall Detected' : 'Fall Alert'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Room {inAppAlert.room} · {inAppAlert.patient}</div>
              <div style={{ fontSize: 11, color: C.text2 }}>{inAppAlert.confidence}% confidence</div>
            </div>
          </div>
          <button onClick={() => setInAppAlert(null)} style={{
            background: 'transparent', border: 'none', color: C.text3,
            fontSize: 20, cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
          }}>×</button>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo / wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${C.accent}, #8B6BE8)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 32px rgba(45,114,210,0.35)',
          }}>⚡</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Ambient Intelligence</div>
          <div style={{ fontSize: 14, color: C.text2, marginTop: 6 }}>Nurse Fall Alert App</div>
        </div>

        {/* OS detected banner */}
        {os !== 'unknown' && (
          <div style={{
            background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 10,
            padding: '10px 16px', marginBottom: 24, textAlign: 'center',
            fontSize: 13, color: C.green, fontWeight: 600,
          }}>
            {os === 'ios' ? '📱 iPhone detected — follow the steps below' : '🤖 Android detected — follow the steps below'}
          </div>
        )}

        {/* Notification section — only rendered client-side after mount */}
        {mounted && (
          <>
            {notifStatus === 'granted' && (
              <div style={{
                background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 12,
                padding: '16px', marginBottom: 24, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: C.green, fontWeight: 700, marginBottom: 12 }}>
                  ✓ Notifications enabled
                </div>
                <button onClick={sendTestPush} style={{
                  background: 'transparent', border: `1px solid ${C.green}55`, borderRadius: 8,
                  color: C.green, fontSize: 12, fontWeight: 600, padding: '8px 20px', cursor: 'pointer', width: '100%',
                }}>
                  Send test notification to this device
                </button>
              </div>
            )}

            {notifStatus === 'denied' && (
              <div style={{
                background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B', marginBottom: 4 }}>Notifications blocked</div>
                <div style={{ fontSize: 12, color: C.text2 }}>
                  {os === 'ios'
                    ? 'Go to Settings → Ambient → Notifications and turn on Allow Notifications.'
                    : 'Go to Settings → Apps → Chrome → Notifications and allow.'}
                </div>
              </div>
            )}

            {notifStatus === 'unknown' && !notifAvailable && (
              <div style={{
                background: C.amberDim, border: `1px solid ${C.amber}33`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 4 }}>Install first</div>
                <div style={{ fontSize: 12, color: C.text2 }}>
                  Push notifications require the app to be installed to your home screen. Follow the steps below, then return here.
                </div>
              </div>
            )}

            {notifStatus === 'unknown' && notifAvailable && (
              <div style={{
                background: C.accentDim, border: `1px solid ${C.accent}44`,
                borderRadius: 12, padding: '20px 16px', marginBottom: 24, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
                  Tap below to receive fall alerts on this device.
                </div>
                <button onClick={enableNotifications} style={{
                  background: C.accent, border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 32px',
                  cursor: 'pointer', width: '100%',
                }}>
                  Enable Fall Alert Notifications
                </button>
              </div>
            )}

            {notifStatus === 'subscribing' && (
              <div style={{
                background: C.accentDim, border: `1px solid ${C.accent}44`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'center',
                fontSize: 13, color: C.accent,
              }}>
                Enabling notifications…
              </div>
            )}
          </>
        )}

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 4, marginBottom: 24, gap: 4,
        }}>
          {(['ios', 'android'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: tab === t ? C.surface2 : 'transparent',
              border: `1px solid ${tab === t ? C.border : 'transparent'}`,
              borderRadius: 9, color: tab === t ? C.text : C.text2,
              fontSize: 13, fontWeight: tab === t ? 700 : 400,
              padding: '10px 0', cursor: 'pointer', transition: 'all 0.15s',
            }}>{t === 'ios' ? '📱  iPhone · iPad' : '🤖  Android'}</button>
          ))}
        </div>

        {/* Steps */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '20px 20px', marginBottom: 20,
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              paddingBottom: i < steps.length - 1 ? 18 : 0,
              marginBottom: i < steps.length - 1 ? 18 : 0,
              borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: C.accentDim, border: `1px solid ${C.accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: s.mono ? 15 : 18, fontWeight: 700, color: C.accent,
                fontFamily: s.mono ? 'monospace' : 'inherit',
              }}>{s.icon}</div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 2 }}>Step {i + 1}</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.45 }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{
          background: C.amberDim, border: `1px solid ${C.amber}33`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 32,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Important</div>
          <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: 13, color: C.text2, lineHeight: 1.8 }}>
            <li>You <strong style={{ color: C.text }}>must allow notifications</strong> to receive fall alerts</li>
            <li>Alerts arrive even when the app is closed or screen is locked</li>
            <li>Tap "Respond" on any alert to open directly to that room</li>
          </ul>
        </div>

        {/* URL copy box */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 32,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: C.text2, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ambientprototype.vercel.app/mobile
          </span>
          <button
            onClick={() => navigator.clipboard?.writeText('https://ambientprototype.vercel.app/mobile')}
            style={{
              background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 7,
              color: C.accent, fontSize: 11, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', flexShrink: 0,
            }}
          >Copy link</button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/mobilelab" style={{ fontSize: 12, color: C.text3, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}>
            Mobile Lab (design tools)
          </Link>
          <span style={{ color: C.text3, margin: '0 10px' }}>·</span>
          <Link href="/control" style={{ fontSize: 12, color: C.text3, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}>
            View Control Center
          </Link>
        </div>
      </div>
    </div>
  );
}
