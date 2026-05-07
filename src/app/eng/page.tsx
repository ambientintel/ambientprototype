'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Constellation background ───────────────────────────────────────────────────

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
        x: Math.random() * el.width, y: Math.random() * el.height,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() < 0.14 ? 2.6 : Math.random() * 1.1 + 0.7,
        pulse: Math.random() * Math.PI * 2, pulseSpd: 0.011 + Math.random() * 0.017,
      }));
    }
    function resize() { el.width = el.offsetWidth; el.height = el.offsetHeight; init(); }
    resize();
    window.addEventListener('resize', resize);
    function frame() {
      const W = el.width, H = el.height;
      ctx.clearRect(0, 0, W, H);
      const maxD = Math.min(W, H) * 0.19;
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(8,12,26,0.018)';
      const gx = W/11, gy = H/8;
      for (let i=1;i<11;i++){ctx.beginPath();ctx.moveTo(i*gx,0);ctx.lineTo(i*gx,H);ctx.stroke();}
      for (let j=1;j<8;j++){ctx.beginPath();ctx.moveTo(0,j*gy);ctx.lineTo(W,j*gy);ctx.stroke();}
      pts.forEach(p => { p.x=((p.x+p.vx)+W)%W; p.y=((p.y+p.vy)+H)%H; p.pulse+=p.pulseSpd; });
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if (d<maxD) { const t=1-d/maxD, act=0.5+0.5*Math.sin(pts[i].pulse)*Math.sin(pts[j].pulse);
          ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(8,12,26,${(t*(0.08+act*0.05)).toFixed(3)})`;ctx.lineWidth=t*1.1;ctx.stroke(); }
      }
      pts.forEach(p => {
        const glow=0.5+0.5*Math.sin(p.pulse), glowR=p.r*(3.5+glow*2.5);
        const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,glowR);
        grad.addColorStop(0,`rgba(8,12,26,${(0.07+glow*0.05).toFixed(3)})`);grad.addColorStop(1,'rgba(8,12,26,0)');
        ctx.beginPath();ctx.arc(p.x,p.y,glowR,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
        ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+glow*0.18),0,Math.PI*2);
        ctx.fillStyle=`rgba(8,12,26,${(0.26+glow*0.13).toFixed(3)})`;ctx.fill();
      });
      raf=requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
}

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
    checklistDefault: 5,
    stepsTotal: 12,
    stepsDone: 4,
    phases: [
      { label: 'Environment',  done: 2, total: 3 },
      { label: 'Development',  done: 1, total: 3 },
      { label: 'Features',     done: 1, total: 3 },
      { label: 'Distribution', done: 0, total: 3 },
    ],
    specs: [
      { k: 'Framework', v: 'Expo 54' },
      { k: 'Auth',      v: 'Cognito' },
      { k: 'Push',      v: 'APNS+FCM' },
      { k: 'Build',     v: 'EAS' },
    ],
    description: 'Nurse-facing fall alert app. Cognito auth, push notifications via SNS, alert list + detail, EAS build for TestFlight.',
    currentStep: '03 · Cognito Authentication',
    freezeKey: 'ambient-mobileapp-frozen-v1',
    freezeLabel: 'Phase I Lock',
  },
  {
    id: 'cloudengineering',
    href: '/cloudengineering',
    label: 'Cloud Engineering',
    subtitle: 'AWS · Python 3.12 · Terraform',
    color: '#4338CA',
    colorBg: '#EEF2FF',
    colorBorder: '#C7D2FE',
    repo: 'ambientintel/ambientcloud',
    lsKey: 'ambient-cloud-checklist-v1',
    checklistTotal: 22,
    checklistDefault: 13,
    stepsTotal: 12,
    stepsDone: 7,
    phases: [
      { label: 'Architect', done: 3, total: 3 },
      { label: 'Infra',     done: 3, total: 3 },
      { label: 'Deploy',    done: 1, total: 4 },
      { label: 'Validate',  done: 0, total: 2 },
    ],
    specs: [
      { k: 'Region',  v: 'us-east-1' },
      { k: 'Runtime', v: 'Python 3.12' },
      { k: 'AI',      v: 'Sonnet 4.5' },
      { k: 'IaC',     v: 'Terraform' },
    ],
    description: 'Five AWS data paths: fall alerts, Parquet cold path, Ella narrative, nurse API, CloudTrail audit. HIPAA coded data.',
    currentStep: '08 · Cold Path Deploy',
    freezeKey: 'ambient-cloud-frozen-v1',
    freezeLabel: 'Production Freeze',
  },
] as const;

type Domain = typeof DOMAINS[number];

const INTEGRATIONS = [
  { from: 'Firmware', to: 'EE Hardware',      desc: 'Custom DTB targets OSD62x-PM BGA carrier; IWR6843AOP GPIO/SPI pin assignments from schematic' },
  { from: 'Firmware', to: 'Cloud Engineering', desc: 'Device agent publishes MQTT fall events + uploads Parquet batches via url-minter presigned URLs' },
  { from: 'EE Hardware', to: 'Firmware',       desc: 'Power rail sequencing, JTAG header, UART debug pin positions — PCB stackup drives DTB addresses' },
  { from: 'Cloud Engineering', to: 'Mobile App', desc: 'FastAPI + Cognito JWT auth; SNS → APNS/FCM push; facility-scoped alert endpoints feed the app' },
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
      firmware: 'firmware', ee: 'ee', mobileapp: 'mobileapp', cloudengineering: 'cloud',
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
      <ConstellationCanvas />
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
                        <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 20, color: '#111827', letterSpacing: '-0.01em' }}>{d.label}</span>
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

                  {/* Footer row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', marginBottom: 2 }}>Current step</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#374151' }}>{d.currentStep}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF' }}>{d.stepsDone}/{d.stepsTotal} steps</div>
                      <Link href={d.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: d.colorBg, border: `1px solid ${d.colorBorder}`, color: d.color, fontSize: 12, fontFamily: 'var(--mono)', textDecoration: 'none', fontWeight: 500, transition: 'all 0.12s' }}>
                        Runbook →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
