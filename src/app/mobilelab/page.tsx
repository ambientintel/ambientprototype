'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const C = {
  bg: '#0C0D0F', surface: '#13151A', surface2: '#1C1F26', surface3: '#23272F',
  border: 'rgba(255,255,255,0.07)', borderMid: 'rgba(255,255,255,0.12)',
  accent: '#2D72D2', accentDim: 'rgba(45,114,210,0.12)',
  text: '#EDEEF0', text2: '#9A9B9D', text3: '#5C5E62',
  green: '#3DCC91', greenDim: 'rgba(61,204,145,0.12)',
  amber: '#FFC940', amberDim: 'rgba(255,201,64,0.12)',
  red: '#FF6B6B', redDim: 'rgba(255,107,107,0.15)',
  purple: '#8B6BE8', purpleDim: 'rgba(139,107,232,0.12)',
};

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertStatus = 'active' | 'acknowledged' | 'resolved';
type ActiveView = 'dashboard' | 'alerts' | 'rooms' | 'profile';
type LayoutMode = 'compact' | 'comfortable' | 'large';
type ThemeMode = 'dark' | 'dim' | 'light';

interface FallAlert {
  id: string;
  room: string;
  patient: string;
  floor: string;
  severity: AlertSeverity;
  status: AlertStatus;
  time: string;
  confidence: number;
  sensor: string;
}

const INITIAL_ALERTS: FallAlert[] = [
  { id: 'a1', room: '305', patient: 'M. Chen', floor: '3F', severity: 'critical', status: 'active',       time: '14:22', confidence: 97, sensor: 'Radar + IMU' },
  { id: 'a2', room: '207', patient: 'R. Patel', floor: '2F', severity: 'warning',  status: 'acknowledged', time: '14:18', confidence: 82, sensor: 'Radar' },
  { id: 'a3', room: '109', patient: 'L. Torres', floor: '1F', severity: 'critical', status: 'active',       time: '14:09', confidence: 94, sensor: 'Radar + Camera' },
  { id: 'a4', room: '212', patient: 'J. Kim',   floor: '2F', severity: 'info',     status: 'resolved',     time: '13:55', confidence: 71, sensor: 'IMU' },
];

const ROOMS = [
  { id: '301', floor: '3F', patient: 'A. Park',   status: 'quiet',    risk: 'low' },
  { id: '302', floor: '3F', patient: 'B. Singh',  status: 'quiet',    risk: 'medium' },
  { id: '303', floor: '3F', patient: 'C. Russo',  status: 'movement', risk: 'high' },
  { id: '305', floor: '3F', patient: 'M. Chen',   status: 'alert',    risk: 'critical' },
  { id: '207', floor: '2F', patient: 'R. Patel',  status: 'movement', risk: 'high' },
  { id: '208', floor: '2F', patient: 'D. Okafor', status: 'quiet',    risk: 'low' },
  { id: '212', floor: '2F', patient: 'J. Kim',    status: 'quiet',    risk: 'medium' },
  { id: '109', floor: '1F', patient: 'L. Torres', status: 'alert',    risk: 'critical' },
  { id: '110', floor: '1F', patient: 'E. Walsh',  status: 'quiet',    risk: 'low' },
];

function severityColor(s: AlertSeverity) {
  return s === 'critical' ? C.red : s === 'warning' ? C.amber : C.accent;
}
function severityBg(s: AlertSeverity) {
  return s === 'critical' ? C.redDim : s === 'warning' ? C.amberDim : C.accentDim;
}
function riskColor(r: string) {
  return r === 'critical' ? C.red : r === 'high' ? C.amber : r === 'medium' ? C.accent : C.text3;
}
function statusColor(s: string) {
  return s === 'alert' ? C.red : s === 'movement' ? C.amber : C.text3;
}

// ── Push notification toast ──
interface Toast {
  id: string;
  room: string;
  patient: string;
  severity: AlertSeverity;
  confidence: number;
  time: string;
}

// ── Mobile phone frame ──
function PhoneFrame({ children, layout }: { children: React.ReactNode; layout: LayoutMode }) {
  const scale = layout === 'large' ? 1.08 : layout === 'compact' ? 0.88 : 1;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.3s ease',
        width: 320,
        background: '#111318',
        borderRadius: 40,
        border: '2px solid rgba(255,255,255,0.13)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          height: 28, background: '#0a0b0e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, paddingTop: 4,
        }}>
          <div style={{ width: 60, height: 6, borderRadius: 3, background: '#222' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1a1e', border: '1px solid #333' }} />
        </div>
        {/* Screen */}
        <div style={{ height: 620, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
        {/* Home bar */}
        <div style={{ height: 24, background: '#0a0b0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: '#2a2a2e' }} />
        </div>
      </div>
    </div>
  );
}

// ── Mobile nurse dashboard content ──
function NurseDashboardMobile({
  activeView, setActiveView, alerts, acknowledgeAlert, layout, theme,
}: {
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  alerts: FallAlert[];
  acknowledgeAlert: (id: string) => void;
  layout: LayoutMode;
  theme: ThemeMode;
}) {
  const textScale = layout === 'large' ? 1.1 : layout === 'compact' ? 0.88 : 1;
  const padScale  = layout === 'compact' ? 10 : 14;
  const bg        = theme === 'light' ? '#f4f5f7' : theme === 'dim' ? '#181920' : C.bg;
  const surf      = theme === 'light' ? '#ffffff'  : theme === 'dim' ? '#1f2028' : C.surface;
  const txt       = theme === 'light' ? '#1a1b1e'  : C.text;
  const txt2      = theme === 'light' ? '#6b6c70'  : C.text2;
  const brd       = theme === 'light' ? 'rgba(0,0,0,0.09)' : C.border;

  const activeAlerts  = alerts.filter(a => a.status === 'active');
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontSize: `${13 * textScale}px`, color: txt }}>
      {/* Status bar */}
      <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: txt2 }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {activeAlerts.length > 0 && (
            <div style={{
              background: C.red, borderRadius: 8, padding: '1px 6px',
              fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.02em',
            }}>{activeAlerts.length} ALERT{activeAlerts.length > 1 ? 'S' : ''}</div>
          )}
          <span>●●●</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: `${padScale}px` }}>
        {activeView === 'dashboard' && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: txt2, marginBottom: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Good afternoon</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Nurse Carter</div>
            </div>

            {/* Active alert banner */}
            {activeAlerts.length > 0 && (
              <div style={{
                background: C.redDim, border: `1px solid ${C.red}55`,
                borderRadius: 12, padding: 12, marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: C.red,
                    boxShadow: `0 0 6px ${C.red}`,
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: '0.06em' }}>
                    {activeAlerts.length} FALL ALERT{activeAlerts.length > 1 ? 'S' : ''} ACTIVE
                  </span>
                </div>
                {activeAlerts.slice(0, 2).map(a => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,107,107,0.08)', borderRadius: 8, padding: '7px 10px', marginBottom: 4,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Room {a.room} · {a.patient}</div>
                      <div style={{ fontSize: 10, color: txt2 }}>{a.floor} · {a.confidence}% confidence · {a.sensor}</div>
                    </div>
                    <button onClick={() => acknowledgeAlert(a.id)} style={{
                      background: C.red, border: 'none', borderRadius: 6,
                      color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 8px', cursor: 'pointer',
                    }}>ACK</button>
                  </div>
                ))}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'My Rooms', value: '14', color: C.accent },
                { label: 'Active Alerts', value: `${activeAlerts.length}`, color: activeAlerts.length > 0 ? C.red : C.green },
                { label: 'Resolved', value: `${resolvedCount}`, color: C.green },
              ].map(s => (
                <div key={s.label} style={{
                  background: surf, border: `1px solid ${brd}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: txt2, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent rooms */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: txt2, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Room Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROOMS.slice(0, 5).map(r => (
                  <div key={r.id} style={{
                    background: surf, border: `1px solid ${brd}`, borderRadius: 10,
                    padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Room {r.id}</span>
                      <span style={{ color: txt2, marginLeft: 6, fontSize: 11 }}>{r.patient}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: txt2 }}>{r.floor}</span>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: statusColor(r.status),
                        boxShadow: r.status === 'alert' ? `0 0 5px ${C.red}` : undefined,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'alerts' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.01em' }}>Fall Alerts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map(a => (
                <div key={a.id} style={{
                  background: surf, border: `1px solid ${a.status === 'active' ? severityColor(a.severity) + '44' : brd}`,
                  borderRadius: 12, padding: 12,
                  opacity: a.status === 'resolved' ? 0.55 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Room {a.room} · {a.patient}</div>
                      <div style={{ fontSize: 10, color: txt2, marginTop: 1 }}>{a.floor} · {a.time} · {a.sensor}</div>
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      background: severityBg(a.severity), color: severityColor(a.severity),
                      borderRadius: 6, padding: '3px 7px', textTransform: 'uppercase',
                    }}>{a.severity}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: txt2 }}>
                      Confidence: <span style={{ color: severityColor(a.severity), fontWeight: 600 }}>{a.confidence}%</span>
                    </div>
                    {a.status === 'active' && (
                      <button onClick={() => acknowledgeAlert(a.id)} style={{
                        background: 'transparent', border: `1px solid ${severityColor(a.severity)}55`,
                        borderRadius: 6, color: severityColor(a.severity),
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', cursor: 'pointer',
                      }}>Acknowledge</button>
                    )}
                    {a.status === 'acknowledged' && (
                      <span style={{ fontSize: 10, color: C.amber, fontWeight: 600 }}>● Acknowledged</span>
                    )}
                    {a.status === 'resolved' && (
                      <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>✓ Resolved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'rooms' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.01em' }}>All Rooms</div>
            {['3F', '2F', '1F'].map(floor => (
              <div key={floor} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: txt2, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Floor {floor}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {ROOMS.filter(r => r.floor === floor).map(r => (
                    <div key={r.id} style={{
                      background: surf, border: `1px solid ${r.status === 'alert' ? C.red + '44' : brd}`,
                      borderRadius: 10, padding: '10px 10px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.id}</span>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: statusColor(r.status),
                          boxShadow: r.status === 'alert' ? `0 0 6px ${C.red}` : undefined,
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: txt2 }}>{r.patient}</div>
                      <div style={{
                        fontSize: 9, color: riskColor(r.risk), marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>{r.risk} risk</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'profile' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 8 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#fff',
              }}>NC</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Nurse Carter</div>
              <div style={{ fontSize: 12, color: txt2, marginTop: 2 }}>3rd Floor · Shift A</div>
            </div>
            {[
              { label: 'Alert notifications', value: 'Push + Sound' },
              { label: 'Shift hours', value: '07:00 – 19:00' },
              { label: 'Rooms assigned', value: '14 rooms' },
              { label: 'Alerts today', value: '3 received' },
            ].map(row => (
              <div key={row.label} style={{
                background: surf, border: `1px solid ${brd}`, borderRadius: 10,
                padding: '12px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: 6,
              }}>
                <span style={{ fontSize: 12, color: txt2 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        background: theme === 'light' ? '#fff' : surf,
        borderTop: `1px solid ${brd}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        padding: '8px 0 4px',
      }}>
        {([
          { view: 'dashboard' as ActiveView, icon: '⌂', label: 'Home' },
          { view: 'alerts'    as ActiveView, icon: '⚡', label: 'Alerts', badge: activeAlerts.length },
          { view: 'rooms'     as ActiveView, icon: '⊞', label: 'Rooms' },
          { view: 'profile'   as ActiveView, icon: '○', label: 'Profile' },
        ]).map(tab => (
          <button key={tab.view} onClick={() => setActiveView(tab.view)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: activeView === tab.view ? C.accent : txt2,
            padding: 4, position: 'relative',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontWeight: activeView === tab.view ? 700 : 400 }}>{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <div style={{
                position: 'absolute', top: 0, right: '50%', marginRight: -18,
                background: C.red, borderRadius: '50%', width: 14, height: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, color: '#fff',
              }}>{tab.badge}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Push notification overlay ──
function PushNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 100,
      background: '#1a1c22', border: `1px solid ${toast.severity === 'critical' ? C.red + '55' : C.amber + '55'}`,
      borderRadius: 16, padding: '14px 18px', maxWidth: 320, minWidth: 260,
      boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset`,
      animation: 'slideIn 0.25s ease',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: toast.severity === 'critical' ? C.redDim : C.amberDim,
          border: `1px solid ${toast.severity === 'critical' ? C.red + '44' : C.amber + '44'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: toast.severity === 'critical' ? C.red : C.amber, letterSpacing: '0.06em' }}>
              FALL {toast.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: C.text2 }}>{toast.time}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Room {toast.room} · {toast.patient}</div>
          <div style={{ fontSize: 11, color: C.text2 }}>Confidence: {toast.confidence}% · Nurse notified</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={onDismiss} style={{
          flex: 1, background: toast.severity === 'critical' ? C.red : C.amber,
          border: 'none', borderRadius: 8, color: '#000', fontSize: 11, fontWeight: 700,
          padding: '7px 0', cursor: 'pointer',
        }}>Respond</button>
        <button onClick={onDismiss} style={{
          flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
          borderRadius: 8, color: C.text2, fontSize: 11, fontWeight: 600, padding: '7px 0', cursor: 'pointer',
        }}>Dismiss</button>
      </div>
    </div>
  );
}

export default function MobileLab() {
  const [alerts, setAlerts]               = useState<FallAlert[]>(INITIAL_ALERTS);
  const [activeView, setActiveView]       = useState<ActiveView>('dashboard');
  const [layout, setLayout]               = useState<LayoutMode>('comfortable');
  const [theme, setTheme]                 = useState<ThemeMode>('dark');
  const [toast, setToast]                 = useState<Toast | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [vibrate, setVibrate]             = useState(true);
  const [sound, setSound]                 = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [showPanel, setShowPanel]         = useState<'customization' | 'alertConfig' | 'install'>('customization');

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  };

  const triggerFallAlert = async () => {
    const rooms = ['301', '304', '206', '110', '213'];
    const patients = ['S. Nguyen', 'A. Müller', 'F. López', 'C. Osei', 'Y. Kim'];
    const idx = Math.floor(Math.random() * rooms.length);
    const sev: AlertSeverity = Math.random() > 0.4 ? 'critical' : 'warning';
    const newAlert: FallAlert = {
      id:         `a${Date.now()}`,
      room:       rooms[idx],
      patient:    patients[idx],
      floor:      idx < 2 ? '3F' : idx < 4 ? '2F' : '1F',
      severity:   sev,
      status:     'active',
      time:       new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      confidence: 75 + Math.floor(Math.random() * 23),
      sensor:     ['Radar + IMU', 'Radar', 'Radar + Camera', 'IMU'][Math.floor(Math.random() * 4)],
    };
    setAlerts(prev => [newAlert, ...prev]);
    if (alertsEnabled) {
      setToast({ id: newAlert.id, room: newAlert.room, patient: newAlert.patient, severity: sev, confidence: newAlert.confidence, time: newAlert.time });
      // Send real push notification to all subscribed nurse devices
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: newAlert.room, patient: newAlert.patient, floor: newAlert.floor,
          severity: newAlert.severity, confidence: newAlert.confidence, sensor: newAlert.sensor,
        }),
      }).catch(() => null);
    }
  };

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  const toggle = (label: string, val: boolean, set: (v: boolean) => void) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: C.text2 }}>{label}</span>
      <div
        onClick={() => set(!val)}
        style={{
          width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          background: val ? C.accent : 'rgba(255,255,255,0.08)',
          border: `1px solid ${val ? C.accent : C.border}`,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: val ? 20 : 2, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes slideIn { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Push notification */}
      {toast && <PushNotification toast={toast} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${C.border}`, padding: '18px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: C.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/control" style={{ color: C.text3, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← <span style={{ borderBottom: `1px solid ${C.border}` }}>View Control Center</span>
          </Link>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Mobile Lab</div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 1 }}>Nurse Dashboard · Mobile Design & Alert Delivery</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeAlertCount > 0 && (
            <div style={{
              background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8,
              padding: '5px 12px', fontSize: 12, color: C.red, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, animation: 'pulse 1.2s infinite' }} />
              {activeAlertCount} Active Alert{activeAlertCount > 1 ? 's' : ''}
            </div>
          )}
          <button onClick={triggerFallAlert} style={{
            background: C.red, border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 18px', cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>Trigger Fall Alert</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', gap: 0, height: 'calc(100vh - 65px)' }}>

        {/* Left panel — Customization */}
        <div style={{
          borderRight: `1px solid ${C.border}`, padding: 20,
          overflowY: 'auto', background: C.surface,
        }}>
          {/* Panel tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {([
              { key: 'customization', label: 'Layout' },
              { key: 'alertConfig',   label: 'Alerts' },
              { key: 'install',       label: 'Install' },
            ] as const).map(p => (
              <button key={p.key} onClick={() => setShowPanel(p.key)} style={{
                flex: 1, background: showPanel === p.key ? C.accentDim : 'transparent',
                border: `1px solid ${showPanel === p.key ? C.accent + '55' : C.border}`,
                borderRadius: 8, color: showPanel === p.key ? C.accent : C.text2,
                fontSize: 11, fontWeight: showPanel === p.key ? 700 : 400,
                padding: '7px 4px', cursor: 'pointer', letterSpacing: '0.02em',
              }}>{p.label}</button>
            ))}
          </div>

          {showPanel === 'customization' && (
            <>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Layout density</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                {(['compact', 'comfortable', 'large'] as LayoutMode[]).map(l => (
                  <button key={l} onClick={() => setLayout(l)} style={{
                    background: layout === l ? C.accentDim : 'transparent',
                    border: `1px solid ${layout === l ? C.accent + '55' : C.border}`,
                    borderRadius: 8, color: layout === l ? C.accent : C.text2,
                    fontSize: 12, fontWeight: layout === l ? 700 : 400,
                    padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                    textTransform: 'capitalize',
                  }}>{l}</button>
                ))}
              </div>

              <div style={{ width: '100%', height: 1, background: C.border, margin: '16px 0' }} />
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Color theme</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                {(['dark', 'dim', 'light'] as ThemeMode[]).map(t => (
                  <button key={t} onClick={() => setTheme(t)} style={{
                    background: theme === t ? C.accentDim : 'transparent',
                    border: `1px solid ${theme === t ? C.accent + '55' : C.border}`,
                    borderRadius: 8, color: theme === t ? C.accent : C.text2,
                    fontSize: 12, fontWeight: theme === t ? 700 : 400,
                    padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                    textTransform: 'capitalize',
                  }}>{t}</button>
                ))}
              </div>

              <div style={{ width: '100%', height: 1, background: C.border, margin: '16px 0' }} />
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Preview view</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(['dashboard', 'alerts', 'rooms', 'profile'] as ActiveView[]).map(v => (
                  <button key={v} onClick={() => setActiveView(v)} style={{
                    background: activeView === v ? C.accentDim : 'transparent',
                    border: `1px solid ${activeView === v ? C.accent + '55' : C.border}`,
                    borderRadius: 8, color: activeView === v ? C.accent : C.text2,
                    fontSize: 12, fontWeight: activeView === v ? 700 : 400,
                    padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                    textTransform: 'capitalize',
                  }}>{v}</button>
                ))}
              </div>
            </>
          )}

          {showPanel === 'alertConfig' && (
            <>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Delivery settings</div>
              {toggle('Push alerts enabled', alertsEnabled, setAlertsEnabled)}
              {toggle('Vibration', vibrate, setVibrate)}
              {toggle('Sound', sound, setSound)}

              <div style={{ width: '100%', height: 1, background: C.border, margin: '16px 0' }} />
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Filter by floor</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                {['all', '3F', '2F', '1F'].map(f => (
                  <button key={f} onClick={() => setSelectedFloor(f)} style={{
                    background: selectedFloor === f ? C.accentDim : 'transparent',
                    border: `1px solid ${selectedFloor === f ? C.accent + '55' : C.border}`,
                    borderRadius: 8, color: selectedFloor === f ? C.accent : C.text2,
                    fontSize: 12, fontWeight: selectedFloor === f ? 700 : 400,
                    padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                  }}>{f === 'all' ? 'All floors' : `Floor ${f}`}</button>
                ))}
              </div>

              <div style={{ width: '100%', height: 1, background: C.border, margin: '16px 0' }} />
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Confidence threshold</div>
              <div style={{ fontSize: 12, color: C.text2, marginBottom: 6 }}>Minimum alert confidence: <span style={{ color: C.accent, fontWeight: 700 }}>70%</span></div>
              <input type="range" min={50} max={99} defaultValue={70} style={{ width: '100%', accentColor: C.accent }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.text3, marginTop: 4 }}>
                <span>50%</span><span>99%</span>
              </div>
            </>
          )}
        </div>

          {showPanel === 'install' && (
            <>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Install on iPhone</div>
              {[
                { step: '1', text: 'Open Safari and go to ambientprototype.vercel.app/mobilelab' },
                { step: '2', text: 'Tap the Share button (□↑) at the bottom of the screen' },
                { step: '3', text: 'Scroll down and tap "Add to Home Screen"' },
                { step: '4', text: 'Tap "Add" — the app icon appears on your home screen' },
                { step: '5', text: 'Open the app and allow notifications when prompted' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: C.accentDim, border: `1px solid ${C.accent}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: C.accent,
                  }}>{s.step}</div>
                  <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, paddingTop: 2 }}>{s.text}</span>
                </div>
              ))}

              <div style={{ width: '100%', height: 1, background: C.border, margin: '16px 0' }} />
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Install on Android</div>
              {[
                { step: '1', text: 'Open Chrome and go to ambientprototype.vercel.app/mobilelab' },
                { step: '2', text: 'Tap the three-dot menu (⋮) in the top-right corner' },
                { step: '3', text: 'Tap "Add to Home screen" or "Install app"' },
                { step: '4', text: 'Tap "Install" to confirm' },
                { step: '5', text: 'Open the app and allow notifications when prompted' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: C.greenDim, border: `1px solid ${C.green}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: C.green,
                  }}>{s.step}</div>
                  <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, paddingTop: 2 }}>{s.text}</span>
                </div>
              ))}

              <div style={{ width: '100%', height: 1, background: C.border, margin: '16px 0' }} />
              <div style={{
                background: C.amberDim, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 6 }}>After installing</div>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: C.text2, lineHeight: 1.8 }}>
                  <li>Allow notifications to receive fall alerts</li>
                  <li>Keep the app on your home screen for quick access</li>
                  <li>Alerts arrive even when the app is closed</li>
                  <li>Tap "Respond" on any alert notification to open the app</li>
                </ul>
              </div>
            </>
          )}

        {/* Center — phone preview */}
        <div style={{ padding: '32px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Device label */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              fontSize: 11, color: C.text3, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '4px 10px', letterSpacing: '0.06em',
            }}>iPhone 15 Pro · 393×852</div>
            <div style={{
              fontSize: 11, color: C.text2, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '4px 10px',
            }}>{layout} · {theme}</div>
          </div>

          <PhoneFrame layout={layout}>
            <NurseDashboardMobile
              activeView={activeView}
              setActiveView={setActiveView}
              alerts={alerts}
              acknowledgeAlert={acknowledgeAlert}
              layout={layout}
              theme={theme}
            />
          </PhoneFrame>

          {/* Simulate button below phone */}
          <button onClick={triggerFallAlert} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.text2, fontSize: 12, fontWeight: 600,
            padding: '10px 24px', cursor: 'pointer', letterSpacing: '0.02em',
          }}>Simulate fall alert →</button>
        </div>

        {/* Right panel — Alert log */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: 20,
          overflowY: 'auto', background: C.surface,
        }}>
          <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Alert log</div>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
            {[
              { label: 'Active', value: alerts.filter(a => a.status === 'active').length, color: C.red },
              { label: 'Acked', value: alerts.filter(a => a.status === 'acknowledged').length, color: C.amber },
              { label: 'Resolved', value: alerts.filter(a => a.status === 'resolved').length, color: C.green },
              { label: 'Total', value: alerts.length, color: C.accent },
            ].map(s => (
              <div key={s.label} style={{
                background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: C.text2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Notification delivery preview */}
          <div style={{
            background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 12, marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Delivery channel</div>
            {[
              { channel: 'Push notification', icon: '📱', enabled: alertsEnabled, color: C.accent },
              { channel: 'Vibration',          icon: '📳', enabled: vibrate,       color: C.green },
              { channel: 'Sound alert',        icon: '🔔', enabled: sound,         color: C.amber },
            ].map(ch => (
              <div key={ch.channel} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
              }}>
                <span style={{ fontSize: 14 }}>{ch.icon}</span>
                <span style={{ flex: 1, fontSize: 12, color: C.text2 }}>{ch.channel}</span>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                  color: ch.enabled ? ch.color : C.text3,
                }}>{ch.enabled ? 'ON' : 'OFF'}</div>
              </div>
            ))}
          </div>

          {/* Alert list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(selectedFloor === 'all' ? alerts : alerts.filter(a => a.floor === selectedFloor)).map(a => (
              <div key={a.id} style={{
                background: C.surface2,
                border: `1px solid ${a.status === 'active' ? severityColor(a.severity) + '44' : C.border}`,
                borderRadius: 10, padding: '10px 12px',
                opacity: a.status === 'resolved' ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Room {a.room}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                    background: severityBg(a.severity), color: severityColor(a.severity),
                    borderRadius: 5, padding: '2px 6px', textTransform: 'uppercase',
                  }}>{a.severity}</span>
                </div>
                <div style={{ fontSize: 11, color: C.text2, marginBottom: 3 }}>{a.patient} · {a.floor} · {a.time}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.text3 }}>{a.sensor} · {a.confidence}%</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: a.status === 'active' ? C.red : a.status === 'acknowledged' ? C.amber : C.green,
                  }}>
                    {a.status === 'active' ? '● Active' : a.status === 'acknowledged' ? '● Acked' : '✓ Done'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nurse install instructions — full width */}
      <div style={{
        borderTop: `1px solid ${C.border}`, background: C.surface,
        padding: '28px 32px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Installing on your phone</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 3 }}>Add Ambient to your home screen to receive fall alerts — no App Store required.</div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              background: C.greenDim, color: C.green, border: `1px solid ${C.green}33`,
              borderRadius: 6, padding: '5px 12px',
            }}>Free · No download</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* iPhone */}
            <div style={{
              background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: C.accentDim,
                  border: `1px solid ${C.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>📱</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>iPhone · iPad</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>Safari required</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: '1', text: 'Open Safari and visit this page' },
                  { step: '2', text: 'Tap the Share button (□↑) at the bottom' },
                  { step: '3', text: 'Tap "Add to Home Screen"' },
                  { step: '4', text: 'Tap "Add" to confirm' },
                  { step: '5', text: 'Open from home screen and allow notifications' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: C.accentDim, border: `1px solid ${C.accent}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: C.accent,
                    }}>{s.step}</div>
                    <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, paddingTop: 2 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Android */}
            <div style={{
              background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: C.greenDim,
                  border: `1px solid ${C.green}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Android</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>Chrome required</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: '1', text: 'Open Chrome and visit this page' },
                  { step: '2', text: 'Tap the three-dot menu (⋮) top-right' },
                  { step: '3', text: 'Tap "Add to Home screen" or "Install app"' },
                  { step: '4', text: 'Tap "Install" to confirm' },
                  { step: '5', text: 'Open from home screen and allow notifications' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: C.greenDim, border: `1px solid ${C.green}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: C.green,
                    }}>{s.step}</div>
                    <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, paddingTop: 2 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* After-install tips */}
          <div style={{
            marginTop: 16, background: C.amberDim, border: `1px solid ${C.amber}33`,
            borderRadius: 12, padding: '14px 20px',
            display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, minWidth: 100, paddingTop: 1 }}>After installing</div>
            {[
              'Allow notifications when the app asks — required for fall alerts',
              'Alerts arrive even when the app is closed or your screen is locked',
              'Tap "Respond" on any notification to open directly to that room',
              'Keep the app on your first home screen for fastest access',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', minWidth: 180, flex: 1 }}>
                <span style={{ color: C.amber, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
