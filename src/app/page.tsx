'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const HERO_MODULE = {
  href: '/dashboard',
  tag: 'Operations',
  label: 'Nurse Dashboard',
  description: 'Real-time resident activity monitoring, fall-detection alerts, and AI-generated clinical summaries across all floors. The operational core of the Ambient Intelligence platform.',
  meta: 'IWR6843AOP · Live',
};

const MODULES = [
  {
    href: '/bom',
    tag: 'Engineering',
    label: 'Bill of Materials',
    description: 'Full parts library, assembly BOMs, and build orders for EVT-0.1 hardware. 57 components priced from DigiKey and Mouser.',
    meta: 'EVT-0.1 · 57 parts',
  },
  {
    href: '/gapanalysis',
    tag: 'Compliance',
    label: '21 CFR 820 Gap Analysis',
    description: 'Interactive tracker for all 15 subparts of 21 CFR Part 820. Mark evidence, add notes, auto-persisted.',
    meta: 'FDA QSR · 15 subparts',
  },
  {
    href: '/samd',
    tag: 'Regulatory',
    label: 'SaMD Dashboard',
    description: 'Requirements, risk register, SOUP inventory, verification status, and release tracking per IEC 62304 and ISO 14971.',
    meta: 'IEC 62304 / ISO 14971',
  },
  {
    href: '/cloud',
    tag: 'Infrastructure',
    label: 'Cloud Infrastructure',
    description: 'AWS backend — seven services across fall-alert hot path, Parquet cold path, Ella AI narratives, and the Nurse API. Architecture v4.',
    meta: 'ambientcloud · AWS · Terraform',
  },
  {
    href: '/colors',
    tag: 'Design',
    label: 'Color & Typography',
    description: 'Design token reference — CSS custom properties, color palette, badge states, type families, and full type scale.',
    meta: 'globals.css · tokens',
  },
  {
    href: '/brand',
    tag: 'Design',
    label: 'Brand & Color Picker',
    description: 'Interactive color palette with copyable hex values. Brand mark at scale, badge states, and type scale reference.',
    meta: 'ambientdesign · interactive',
  },
];


// ── Ticker events ──
const TICKER_EVENTS = [
  { room:'201', type:'movement', label:'Movement detected', ago:'2s' },
  { room:'305', type:'alert',    label:'Fall alert',        ago:'14s' },
  { room:'118', type:'movement', label:'Movement detected', ago:'31s' },
  { room:'212', type:'quiet',    label:'Room quiet',        ago:'48s' },
  { room:'307', type:'alert',    label:'Fall alert',        ago:'1m 2s' },
  { room:'104', type:'movement', label:'Movement detected', ago:'1m 19s' },
  { room:'220', type:'quiet',    label:'Room quiet',        ago:'1m 44s' },
  { room:'311', type:'movement', label:'Movement detected', ago:'2m 3s' },
  { room:'109', type:'alert',    label:'Fall alert resolved', ago:'2m 28s' },
  { room:'215', type:'movement', label:'Movement detected', ago:'2m 51s' },
  { room:'302', type:'quiet',    label:'Room quiet',        ago:'3m 10s' },
  { room:'107', type:'movement', label:'Movement detected', ago:'3m 33s' },
];

const TICK_COLOR: Record<string,string> = { movement:'#FFC940', alert:'#FF6B6B', quiet:'#3DCC91' };

// ── Pipeline nodes ──
const PIPELINE = [
  { id:'sensor',   label:'IWR6843AOP', sub:'Radar sensor',    group:'device' },
  { id:'kinesis',  label:'Kinesis',    sub:'Ingest stream',   group:'aws' },
  { id:'lambda',   label:'Lambda',     sub:'Classifier',      group:'aws' },
  { id:'dynamo',   label:'DynamoDB',   sub:'Alert store',     group:'aws' },
  { id:'bedrock',  label:'Bedrock',    sub:'Ella AI',         group:'aws' },
  { id:'api',      label:'API GW',     sub:'Nurse API',       group:'aws' },
  { id:'dash',     label:'Dashboard',  sub:'Nurse display',   group:'app' },
];

function Ticker() {
  const [offset, setOffset] = React.useState(0);
  React.useEffect(()=>{
    const id = setInterval(()=>setOffset(o=>(o+1)%TICKER_EVENTS.length), 2800);
    return ()=>clearInterval(id);
  },[]);
  const visible = [...TICKER_EVENTS, ...TICKER_EVENTS].slice(offset, offset+5);
  return (
    <div style={{ overflow:'hidden' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {visible.map((e,i)=>(
          <div key={`${e.room}-${offset}-${i}`} style={{
            display:'flex', alignItems:'center', gap:16,
            padding:'13px 0',
            borderBottom:`1px solid rgba(255,255,255,0.05)`,
            opacity: i===0 ? 1 : 1-(i*0.15),
            transition:'opacity 0.4s ease',
          }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:TICK_COLOR[e.type], flexShrink:0, boxShadow: e.type==='alert' ? `0 0 6px ${TICK_COLOR[e.type]}` : 'none' }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'#9A9B9D', letterSpacing:'0.06em', width:60, flexShrink:0 }}>Room {e.room}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color: i===0 ? '#EDEEF0' : '#9A9B9D', letterSpacing:'0.04em', flex:1 }}>{e.label}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'#5C5E62', letterSpacing:'0.06em' }}>{e.ago} ago</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pipeline() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(()=>{
    const id = setInterval(()=>setTick(t=>t+1), 600);
    return ()=>clearInterval(id);
  },[]);
  const GROUP_COLOR: Record<string,{bg:string,border:string,text:string}> = {
    device: { bg:'rgba(45,114,210,0.12)', border:'rgba(45,114,210,0.4)', text:'#2D72D2' },
    aws:    { bg:'rgba(255,201,64,0.08)', border:'rgba(255,201,64,0.25)', text:'#FFC940' },
    app:    { bg:'rgba(61,204,145,0.10)', border:'rgba(61,204,145,0.35)', text:'#3DCC91' },
  };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto' }}>
      {PIPELINE.map((node,i)=>{
        const gc = GROUP_COLOR[node.group];
        const active = tick % PIPELINE.length === i;
        return (
          <React.Fragment key={node.id}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
              <div style={{
                padding:'14px 20px', borderRadius:3,
                background: active ? gc.bg : 'rgba(255,255,255,0.03)',
                border:`1px solid ${active ? gc.border : 'rgba(255,255,255,0.07)'}`,
                transition:'all 0.3s ease', minWidth:110, textAlign:'center',
              }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color: active ? gc.text : '#9A9B9D', fontWeight:500, letterSpacing:'0.06em', marginBottom:4, transition:'color 0.3s' }}>
                  {node.label}
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'#5C5E62', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  {node.sub}
                </div>
              </div>
            </div>
            {i < PIPELINE.length-1 && (
              <div style={{ flex:1, display:'flex', alignItems:'center', padding:'0 4px', minWidth:24, position:'relative', overflow:'hidden' }}>
                <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.08)', position:'relative' }}>
                  <div style={{
                    position:'absolute', top:-2, width:5, height:5, borderRadius:'50%',
                    background:'#2D72D2', boxShadow:'0 0 6px #2D72D2',
                    left: `${((tick % (PIPELINE.length)) === i ? 80 : (tick % (PIPELINE.length)) > i ? 100 : 0)}%`,
                    transition:'left 0.55s ease', opacity: (tick % PIPELINE.length) >= i ? 1 : 0.2,
                  }}/>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const STATS = [
  { value: '57', label: 'Hardware components' },
  { value: '15', label: 'CFR Part 820 subparts' },
  { value: '6', label: 'Active modules' },
  { value: '142', label: 'Rooms monitored' },
];

const C = {
  bg:        '#0C0D0F',
  surface:   '#13151A',
  surface2:  '#1C1F26',
  border:    'rgba(255,255,255,0.07)',
  borderHov: 'rgba(45,114,210,0.25)',
  accent:    '#2D72D2',
  accentDim: 'rgba(45,114,210,0.10)',
  text:      '#EDEEF0',
  text2:     '#9A9B9D',
  text3:     '#5C5E62',
  grid:      'rgba(255,255,255,0.025)',
};

export default function Landing1() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [heroHovered, setHeroHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .l1-fadeup { animation: fadeUp 0.55s ease both; }
        .l1-card-arrow { transition: transform 0.2s ease; }
        .l1-card:hover .l1-card-arrow { transform: translate(3px,-3px); }
        .l1-nav-link { transition: color 0.2s ease; }
        .l1-nav-link:hover { color: #EDEEF0 !important; }
        .l1-stat-val { font-variant-numeric: tabular-nums; }
        .l1-cta-primary {
          background: #2D72D2; color: #fff;
          border: none; border-radius: 2px;
          padding: 13px 28px; font-size: 13px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; transition: opacity 0.2s ease;
          font-family: inherit;
        }
        .l1-cta-primary:hover { opacity: 0.88; }
        .l1-cta-ghost {
          background: transparent; color: #EDEEF0;
          border: 1px solid rgba(255,255,255,0.18); border-radius: 2px;
          padding: 13px 28px; font-size: 13px; font-weight: 500;
          letter-spacing: 0.04em; text-transform: uppercase;
          cursor: pointer; transition: border-color 0.2s, color 0.2s;
          font-family: inherit;
        }
        .l1-cta-ghost:hover { border-color: #2D72D2; color: #2D72D2; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(12,13,15,0.88)',
          backdropFilter: 'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: C.text }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[['Dashboard','/dashboard'],['BOM','/bom'],['Gap Analysis','/gapanalysis'],['SaMD','/samd'],['Cloud','/cloud'],['Colors','/colors'],['Brand','/brand']].map(([label, href]) => (
              <Link key={href} href={href} className="l1-nav-link" style={{ textDecoration: 'none', color: C.text2, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/control" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '5px 12px', borderRadius: 2 }}>
              Control Center
            </span>
          </Link>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 48px',
          position: 'relative', overflow: 'hidden',
          backgroundImage: `
            linear-gradient(${C.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}>
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 400, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(45,114,210,0.06) 0%, transparent 70%)',
          }} />

          <div style={{ maxWidth: 900, position: 'relative' }}>
            <div className="l1-fadeup" style={{ animationDelay: '0.05s', marginBottom: 24 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: C.accent,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
                Ambient Intelligence · Prototype Platform
              </span>
            </div>

            <h1 className="l1-fadeup" style={{
              animationDelay: '0.15s',
              fontFamily: 'var(--serif)', fontWeight: 300,
              fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.05,
              letterSpacing: '-0.03em', margin: '0 0 28px',
              color: C.text,
            }}>
              Intelligence at the<br />
              <em style={{ color: C.accent, fontStyle: 'italic' }}>point of care.</em>
            </h1>

            <p className="l1-fadeup" style={{
              animationDelay: '0.25s',
              fontSize: 18, lineHeight: 1.6, color: C.text2,
              maxWidth: 540, margin: '0 0 44px', fontWeight: 300,
            }}>
              Turning operational sensor data into clinical action — hardware, compliance, and AI in a single platform.
            </p>

            <div className="l1-fadeup" style={{ animationDelay: '0.35s', display: 'flex', gap: 12 }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="l1-cta-primary">Enter Dashboard</button>
              </Link>
              <Link href="/control" style={{ textDecoration: 'none' }}>
                <button className="l1-cta-ghost">View all modules</button>
              </Link>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 40, left: 48,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.text3,
          }}>
            Scroll to explore ↓
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '36px 48px',
              borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
            }}>
              <div className="l1-stat-val" style={{
                fontFamily: 'var(--mono)', fontSize: 40, fontWeight: 500,
                color: C.text, letterSpacing: '-0.02em', lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.text3, marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* ── Live Intelligence ── */}
        <section style={{ borderTop:`1px solid rgba(255,255,255,0.07)` }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:320 }}>
            {/* Ticker */}
            <div style={{ padding:'48px 48px', borderRight:`1px solid rgba(255,255,255,0.07)` }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'#2D72D2', marginBottom:8 }}>Live feed</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:300, letterSpacing:'-0.02em', color:'#EDEEF0', marginBottom:28 }}>
                Events as they happen.
              </div>
              <Ticker/>
            </div>
            {/* Pipeline */}
            <div style={{ padding:'48px 48px' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'#2D72D2', marginBottom:8 }}>Data pipeline</div>
              <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:300, letterSpacing:'-0.02em', color:'#EDEEF0', marginBottom:36 }}>
                Sensor to screen.
              </div>
              <Pipeline/>
              <div style={{ display:'flex', gap:20, marginTop:28 }}>
                {[['Device','#2D72D2'],['AWS','#FFC940'],['App','#3DCC91']].map(([label,color])=>(
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:7, height:7, borderRadius:1, background:color, display:'inline-block' }}/>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#5C5E62', textTransform:'uppercase', letterSpacing:'0.12em' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Modules ── */}
        <section style={{ padding: '96px 48px' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
              Platform modules
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-0.02em', margin: 0, color: C.text }}>
              Every tool your team needs.
            </h2>
          </div>

          {/* ── Featured: Nurse Dashboard ── */}
          <Link href={HERO_MODULE.href} className="l1-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 1 }}
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}>
            <div style={{
              padding: '48px 48px',
              background: heroHovered ? C.surface2 : C.surface,
              border: `1px solid ${heroHovered ? 'rgba(45,114,210,0.18)' : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.2s ease, border-color 0.2s ease',
              gap: 48,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: C.accent,
                    background: C.accentDim, padding: '3px 8px', borderRadius: 2,
                  }}>{HERO_MODULE.tag}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
                    Primary module
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 2.5vw, 34px)', fontWeight: 400, letterSpacing: '-0.02em', color: C.text, marginBottom: 14 }}>
                  {HERO_MODULE.label}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: C.text2, fontWeight: 300, maxWidth: 560 }}>
                  {HERO_MODULE.description}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20, flexShrink: 0 }}>
                <span className="l1-card-arrow" style={{ color: C.text3, fontSize: 22 }}>↗</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
                    {HERO_MODULE.meta}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* ── Supporting modules label ── */}
          <div style={{ padding: '28px 0 20px', borderTop: `1px solid ${C.border}`, marginTop: 40, marginBottom: 0, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(16px, 1.5vw, 22px)', fontWeight: 300, letterSpacing: '-0.01em', color: C.text }}>
              Ambient Intelligence Control Center
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text3 }}>
              Supporting modules
            </span>
          </div>

          {/* ── 3-column grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: `1px solid ${C.border}` }}>
            {MODULES.map((mod, i) => (
              <Link key={mod.href} href={mod.href} className="l1-card" style={{ textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}>
                <div style={{
                  padding: '36px 32px',
                  background: hovered === i ? C.surface2 : C.surface,
                  borderRight: (i % 3 !== 2) ? `1px solid ${C.border}` : 'none',
                  borderBottom: (i < 3) ? `1px solid ${C.border}` : 'none',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  transition: 'background 0.2s ease',
                  minHeight: 220,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.accent,
                      background: C.accentDim, padding: '3px 8px', borderRadius: 2,
                    }}>{mod.tag}</span>
                    <span className="l1-card-arrow" style={{ color: C.text3, fontSize: 16 }}>↗</span>
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 10 }}>
                      {mod.label}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: C.text2, fontWeight: 300 }}>
                      {mod.description}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
                      {mod.meta}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          padding: '80px 48px', borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.surface,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
              Ready to begin
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(24px, 2.5vw, 36px)', letterSpacing: '-0.02em', margin: 0, color: C.text }}>
              Access the control center.
            </h3>
          </div>
          <Link href="/control" style={{ textDecoration: 'none' }}>
            <button className="l1-cta-primary">Go to Control Center</button>
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          padding: '28px 48px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3 }}>
            Ambient Intelligence · Not for clinical use
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
            ambientprototype.vercel.app
          </span>
        </footer>

      </div>
    </>
  );
}
