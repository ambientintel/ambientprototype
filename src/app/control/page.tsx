'use client';
import { useState } from 'react';
import Link from 'next/link';

const MODULES = [
  { href: '/bom', tag: 'Engineering', label: 'Bill of Materials', description: 'Full parts library, assembly BOMs, and build orders for EVT-0.1 hardware. 57 components priced from DigiKey and Mouser.', meta: 'EVT-0.1 · 57 parts' },
  { href: '/gapanalysis', tag: 'Compliance', label: '21 CFR 820 Gap Analysis', description: 'Interactive tracker for all 15 subparts of 21 CFR Part 820. Mark evidence, add notes, auto-persisted.', meta: 'FDA QSR · 15 subparts' },
  { href: '/samd', tag: 'Regulatory', label: 'SaMD Dashboard', description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking per IEC 62304 and ISO 14971.', meta: 'IEC 62304 / ISO 14971' },
  { href: '/cloud', tag: 'Infrastructure', label: 'Cloud Infrastructure', description: 'AWS backend — seven services across fall-alert hot path, Parquet cold path, Ella AI narratives, and the Nurse API.', meta: 'ambientcloud · AWS · Terraform' },
  { href: '/colors', tag: 'Design', label: 'Color & Typography', description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and full type scale.', meta: 'globals.css · tokens' },
  { href: '/brand', tag: 'Design', label: 'Brand & Color Picker', description: 'Interactive color palette with copyable hex values. Brand mark at scale, badge states, and type scale reference.', meta: 'ambientdesign · interactive' },
];

const C = {
  bg: '#0C0D0F', surface: '#13151A', surface2: '#1C1F26',
  border: 'rgba(255,255,255,0.07)', accent: '#2D72D2',
  accentDim: 'rgba(45,114,210,0.10)', text: '#EDEEF0',
  text2: '#9A9B9D', text3: '#5C5E62',
  green: '#3DCC91', amber: '#FFC940', red: '#FF6B6B',
};

// ── Room heatmap data ──
const FLOORS: { floor: string; rooms: { id: string; status: 'quiet'|'movement'|'alert' }[] }[] = [
  { floor: '3F', rooms: Array.from({length:14},(_,i)=>({ id:`3${String(i+1).padStart(2,'0')}`, status: ([,'quiet','quiet','movement','quiet','alert','quiet','quiet','movement','quiet','quiet','movement','quiet','quiet'] as const)[i+1] })) },
  { floor: '2F', rooms: Array.from({length:14},(_,i)=>({ id:`2${String(i+1).padStart(2,'0')}`, status: ([,'quiet','movement','quiet','quiet','quiet','movement','alert','quiet','movement','quiet','quiet','alert','quiet','movement'] as const)[i+1] })) },
  { floor: '1F', rooms: Array.from({length:14},(_,i)=>({ id:`1${String(i+1).padStart(2,'0')}`, status: ([,'quiet','quiet','quiet','movement','quiet','quiet','movement','quiet','alert','quiet','movement','quiet','quiet','quiet'] as const)[i+1] })) },
];

const STATUS_COLOR = { quiet: C.green, movement: C.amber, alert: C.red };
const STATUS_DIM   = { quiet: 'rgba(61,204,145,0.12)', movement: 'rgba(255,201,64,0.14)', alert: 'rgba(255,107,107,0.16)' };

// ── Alert timeline data (24h, by hour) ──
const TIMELINE = [0,0,1,0,2,1,0,3,8,12,7,5,9,11,6,8,10,14,9,7,5,3,2,1];

// ── Pipeline services ──
const SERVICES = [
  { name:'Kinesis Ingest',  path:'Hot path',      latency:12,  uptime:99.97 },
  { name:'Lambda Classifier',path:'Hot path',     latency:38,  uptime:99.91 },
  { name:'DynamoDB Alerts', path:'Hot path',      latency:4,   uptime:100   },
  { name:'S3 Parquet',      path:'Cold path',     latency:210, uptime:99.99 },
  { name:'Bedrock / Ella',  path:'AI narrative',  latency:1840,uptime:99.82 },
  { name:'API Gateway',     path:'Nurse API',     latency:22,  uptime:99.95 },
  { name:'CloudWatch',      path:'Observability', latency:null,   uptime:100   },
];

// ── Compliance rings ──
const RINGS = [
  { label:'21 CFR 820', sub:'Gap Analysis', pct:62, color: C.accent },
  { label:'SaMD Verification', sub:'IEC 62304', pct:48, color: C.green },
  { label:'Risk Items Closed', sub:'ISO 14971', pct:71, color: C.amber },
];

function SectionLabel({ left, right }: { left: string; right?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', paddingBottom:20, borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
      <span style={{ fontFamily:'var(--serif)', fontSize:'clamp(16px,1.5vw,22px)', fontWeight:300, letterSpacing:'-0.01em', color:C.text }}>{left}</span>
      {right && <span style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:C.text3 }}>{right}</span>}
    </div>
  );
}

function Heatmap() {
  const [tip, setTip] = useState<{id:string;status:string}|null>(null);
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'32px 32px 28px' }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Floor Activity · 42 rooms</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {FLOORS.map(f=>(
          <div key={f.floor} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, width:20, flexShrink:0 }}>{f.floor}</span>
            <div style={{ display:'flex', gap:5, flex:1 }}>
              {f.rooms.map(r=>(
                <div key={r.id}
                  onMouseEnter={()=>setTip(r)}
                  onMouseLeave={()=>setTip(null)}
                  style={{ flex:1, height:36, borderRadius:3, background:STATUS_DIM[r.status], border:`1px solid ${STATUS_COLOR[r.status]}33`, cursor:'default', transition:'background 0.15s', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:8, color:STATUS_COLOR[r.status], opacity:0.8 }}>{r.id}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:20, marginTop:20 }}>
        {(['quiet','movement','alert'] as const).map(s=>(
          <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:STATUS_COLOR[s], display:'inline-block' }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, textTransform:'capitalize' }}>{s}</span>
          </div>
        ))}
        {tip && <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text2, marginLeft:'auto' }}>Room {tip.id} · {tip.status}</span>}
      </div>
    </div>
  );
}

function AlertTimeline() {
  const max = Math.max(...TIMELINE);
  const now = new Date().getHours();
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'32px 32px 28px' }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>Alert Volume · 24h</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:100 }}>
        {TIMELINE.map((v,h)=>(
          <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:'100%', background: h===now ? C.accent : `rgba(45,114,210,0.35)`, borderRadius:'2px 2px 0 0', height: max>0 ? `${Math.round((v/max)*90)+4}px` : '4px', transition:'height 0.3s', border: h===now ? `1px solid ${C.accent}` : 'none' }}/>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
        {[0,6,12,18,23].map(h=>(
          <span key={h} style={{ fontFamily:'var(--mono)', fontSize:8.5, color:C.text3 }}>{String(h).padStart(2,'0')}:00</span>
        ))}
      </div>
      <div style={{ display:'flex', gap:20, marginTop:16, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:1, background:C.accent, display:'inline-block' }}/>
          <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3 }}>Current hour</span>
        </div>
        <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text2, marginLeft:'auto' }}>
          {TIMELINE.reduce((a,b)=>a+b,0)} total alerts today
        </span>
      </div>
    </div>
  );
}

function Pipeline() {
  const maxL = 2000;
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'32px 32px 28px' }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:20 }}>System Pipeline · AWS</div>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {SERVICES.map((s,i)=>{
          const latencyColor = typeof s.latency === 'number'
            ? s.latency < 50 ? C.green : s.latency < 500 ? C.amber : C.red
            : C.text3;
          return (
            <div key={s.name} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', alignItems:'center', gap:16, padding:'12px 0', borderBottom: i<SERVICES.length-1 ? `1px solid ${C.border}` : 'none' }}>
              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:C.text, marginBottom:2 }}>{s.name}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3 }}>{s.path}</div>
              </div>
              <div style={{ width:120 }}>
                {typeof s.latency === 'number' ? (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>p50</span>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9, color:latencyColor }}>{s.latency}ms</span>
                    </div>
                    <div style={{ height:3, background:C.surface2, borderRadius:2 }}>
                      <div style={{ height:'100%', width:`${Math.min((s.latency/maxL)*100,100)}%`, background:latencyColor, borderRadius:2, transition:'width 0.4s' }}/>
                    </div>
                  </>
                ) : (
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3 }}>passive</span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: s.uptime===100 ? C.green : s.uptime>99.9 ? C.amber : C.red, display:'inline-block', boxShadow: s.uptime===100 ? `0 0 5px ${C.green}` : 'none' }}/>
                <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text2 }}>{s.uptime}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutRing({ pct, color, size=96 }: { pct:number; color:string; size?:number }) {
  const r = (size/2)-10;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.surface2} strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"/>
    </svg>
  );
}

function ComplianceRings() {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:'32px 32px 28px' }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:C.text3, marginBottom:28 }}>Compliance Progress</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
        {RINGS.map(r=>(
          <div key={r.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ position:'relative', width:96, height:96, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <DonutRing pct={r.pct} color={r.color}/>
              <span style={{ position:'absolute', fontFamily:'var(--mono)', fontSize:18, fontWeight:500, color:C.text, letterSpacing:'-0.03em' }}>{r.pct}%</span>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:14, color:C.text, marginBottom:4 }}>{r.label}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, textTransform:'uppercase', letterSpacing:'0.12em' }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ControlCenter() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <style>{`
        .cc-card-arrow { transition: transform 0.2s ease; }
        .cc-card:hover .cc-card-arrow { transform: translate(3px,-3px); }
        .cc-nav-link { transition: color 0.2s ease; }
        .cc-nav-link:hover { color: #EDEEF0 !important; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(12,13,15,0.92)',
          backdropFilter: 'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: C.text }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[['Dashboard','/dashboard'],['BOM','/bom'],['Gap Analysis','/gapanalysis'],['SaMD','/samd'],['Cloud','/cloud'],['Colors','/colors'],['Brand','/brand']].map(([label, href]) => (
              <Link key={href} href={href} className="cc-nav-link" style={{ textDecoration: 'none', color: C.text2, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, padding: '5px 12px' }}>
              ← Back
            </span>
          </Link>
        </nav>

        {/* ── Header ── */}
        <div style={{ padding: '64px 48px 48px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
            Ambient Intelligence
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(32px, 4vw, 54px)', letterSpacing: '-0.03em', margin: '0 0 12px', color: C.text, lineHeight: 1.1 }}>
            Control Center
          </h1>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, fontWeight: 300 }}>
            {MODULES.length} modules · 42 rooms · Live
          </p>
        </div>

        <div style={{ padding: '48px 48px 96px', display: 'flex', flexDirection: 'column', gap: 64 }}>

          {/* ── Module grid ── */}
          <div>
            <SectionLabel left="Ambient Intelligence Control Center" right={`${MODULES.length} modules`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: `1px solid ${C.border}` }}>
              {MODULES.map((mod, i) => (
                <Link key={mod.href} href={mod.href} className="cc-card" style={{ textDecoration: 'none', color: 'inherit' }}
                  onMouseEnter={() => setHovered(mod.href)}
                  onMouseLeave={() => setHovered(null)}>
                  <div style={{
                    padding: '32px 28px',
                    background: hovered === mod.href ? C.surface2 : C.surface,
                    borderRight: (i % 3 !== 2) ? `1px solid ${C.border}` : 'none',
                    borderBottom: (i < 3) ? `1px solid ${C.border}` : 'none',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    transition: 'background 0.2s ease', minHeight: 200,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent, background: C.accentDim, padding: '3px 8px', borderRadius: 2 }}>{mod.tag}</span>
                      <span className="cc-card-arrow" style={{ color: C.text3, fontSize: 15 }}>↗</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 8 }}>{mod.label}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: C.text2, fontWeight: 300 }}>{mod.description}</div>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>{mod.meta}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Visualizations ── */}
          <div>
            <SectionLabel left="Platform Intelligence" right="Live · Simulated" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: `1px solid ${C.border}`, marginBottom: 1 }}>
              <Heatmap />
              <AlertTimeline />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: `1px solid ${C.border}` }}>
              <Pipeline />
              <ComplianceRings />
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <footer style={{ padding: '24px 48px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3 }}>Ambient Intelligence · Not for clinical use</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>ambientprototype.vercel.app</span>
        </footer>

      </div>
    </>
  );
}
