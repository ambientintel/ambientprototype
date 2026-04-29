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

export default function MobilePage() {
  const [os, setOs] = useState<OS>('unknown');
  const [tab, setTab] = useState<'ios' | 'android'>('ios');

  useEffect(() => {
    const detected = detectOS();
    setOs(detected);
    if (detected === 'android') setTab('android');
  }, []);

  const steps = tab === 'ios' ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
    }}>
      <style>{`* { box-sizing: border-box; }`}</style>

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
