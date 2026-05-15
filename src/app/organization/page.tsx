'use client';
import { useState, useEffect, useRef } from 'react';

type Cfg = Record<string, number>;

function SparkNetworkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<Cfg>({
    nodeCount: 47,
    edgeOpacity: 0.25,
    sparkCount: 28,
    sparkSpeed: 0.7,
    trailLength: 0.37,
    brightness: 0.57,
    hue: 217,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const create = function create(e: HTMLCanvasElement, t: () => Cfg) {let a: number,l=e.getContext("2d")!,i: {x:number,y:number}[]=[],n: {a:number,b:number}[]=[],r: {edge:number,t:number,speed:number,dir:number}[]=[],o=-1,s=-1,h=(t: number)=>{const a=e.width,l=e.height;i=Array.from({length:t},()=>({x:.05*a+.9*Math.random()*a,y:.05*l+.9*Math.random()*l})),n=[];for(let e=0;e<t;e++)i.map((t,a)=>({j:a,d:Math.hypot(t.x-i[e].x,t.y-i[e].y)})).filter(t=>t.j!==e).sort((e,t)=>e.d-t.d).slice(0,3).forEach(({j:t})=>{n.some(a=>a.a===e&&a.b===t||a.a===t&&a.b===e)||n.push({a:e,b:t})});o=t},d=(e: number)=>{r=Array.from({length:e},()=>({edge:Math.floor(Math.random()*Math.max(1,n.length)),t:Math.random(),speed:.5+.5*Math.random(),dir:Math.random()>.5?1:-1})),s=e},m=()=>{const a=e.getBoundingClientRect();e.width=a.width,e.height=a.height,h(Math.floor(t().nodeCount)),d(Math.floor(t().sparkCount))},c=()=>{const m=t(),p=e.width,g=e.height,u=Math.floor(m.nodeCount),b=Math.floor(m.sparkCount);u!==o?(h(u),d(b)):b!==s&&n.length>0&&d(b),l.fillStyle=`rgba(11,22,40,${.15+(1-m.trailLength)*.72})`,l.fillRect(0,0,p,g),n.forEach(e=>{l.beginPath(),l.moveTo(i[e.a].x,i[e.a].y),l.lineTo(i[e.b].x,i[e.b].y),l.strokeStyle=`hsla(${m.hue},60%,60%,${m.edgeOpacity})`,l.lineWidth=.5,l.stroke()}),i.forEach(e=>{l.beginPath(),l.arc(e.x,e.y,1.5,0,2*Math.PI),l.fillStyle=`hsla(${m.hue},60%,70%,${2*m.edgeOpacity})`,l.fill()}),r.forEach(e=>{if(e.edge>=n.length)return;e.t+=m.sparkSpeed*e.speed*e.dir*.006,e.t>1&&(e.t=0,e.dir=Math.random()>.5?1:-1),e.t<0&&(e.t=1,e.dir=Math.random()>.5?1:-1);const t=n[e.edge],a=i[t.a].x+(i[t.b].x-i[t.a].x)*e.t,r=i[t.a].y+(i[t.b].y-i[t.a].y)*e.t,o=l.createRadialGradient(a,r,0,a,r,8);o.addColorStop(0,`hsla(${m.hue+40},100%,95%,${m.brightness})`),o.addColorStop(.4,`hsla(${m.hue},90%,70%,${.4*m.brightness})`),o.addColorStop(1,"rgba(0,0,0,0)"),l.beginPath(),l.arc(a,r,8,0,2*Math.PI),l.fillStyle=o,l.fill()}),a=requestAnimationFrame(c)};m(),c();const p=new ResizeObserver(()=>m());return p.observe(e),()=>{cancelAnimationFrame(a),p.disconnect()}};
    return create(canvas, () => cfgRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0, mixBlendMode:'screen' }}
    />
  );
}

const C = {
  bg: '#0B1628', surf1: '#132038', surf2: '#1A2D4E', surf3: '#213660',
  line: 'rgba(79,156,249,0.08)', lineStrg: 'rgba(79,156,249,0.20)',
  text: '#E8F0FF', text2: 'rgba(232,240,255,0.68)', text3: 'rgba(232,240,255,0.40)',
  text4: 'rgba(232,240,255,0.20)', accent: '#4F9CF9', accentS: 'rgba(79,156,249,0.12)',
};

type Tab = 'workstreams' | 'team' | 'cadence' | 'resources';

// ── Data ──────────────────────────────────────────────────────────────────────
const ODAT = [
  { name: 'Brian Johnson', role: 'Strategic Advisor',   focus: 'Vision · Funding strategy · Ecosystem leadership', color: '#2D72D2' },
  { name: 'Randy Ross',    role: 'Chief of Staff',      focus: 'People systems · Structure · Execution · TLI',     color: '#A78BFA' },
  { name: 'Greg Schultze', role: 'Marketing & Sales',   focus: 'Go-to-market strategy · Problem solving',          color: '#FB923C' },
];
const CORE = [
  { name: 'Isaac',    role: 'Software & Data Science', focus: 'Development · Data science · Firmware', color: '#4F9CF9', badge: '→ FTE' },
  { name: 'Gavin',    role: 'Electrical Engineering',  focus: 'Circuit board and hardware design',      color: '#00B4D8' },
  { name: 'Johannes', role: 'Mechanical Engineering',  focus: 'Mechanical design and integration',      color: '#F59E0B' },
  { name: 'Abdul',    role: 'Cloud Infrastructure',    focus: 'Cloud services · APIs · Infrastructure', color: '#3DCC91' },
  { name: 'Paulo',    role: 'Firmware Engineering',    focus: 'Device firmware and reliability',        color: '#FFC940' },
];
const OPEN_ROLES = [
  { role: 'Senior Firmware Lead',      area: 'Engineering', priority: 'critical' as const, note: 'Critical commercialization risk — senior expertise required', color: '#F59E0B' },
  { role: 'Finance & Legal Lead',      area: 'Leadership',  priority: 'high'     as const, note: 'Venture strategy, federal funding, legal operations',         color: '#FFC940' },
  { role: 'Clinical Research Captain', area: 'Clinical',    priority: 'high'     as const, note: 'IRB coordination, research partnerships, advisor engagement',  color: '#3DCC91' },
];
const ENG_DISCIPLINES = [
  { name: 'Firmware',   lead: 'Isaac',              color: '#F59E0B', note: 'previously Paulo'     },
  { name: 'Mechanical', lead: 'Johannes',           color: '#FB923C', note: 'design & integration' },
  { name: 'EE',         lead: 'Gavin',              color: '#00B4D8', note: 'boards & hardware'    },
  { name: 'Mobile App', lead: 'Schultze / Johnson', color: '#A78BFA', note: 'iOS & Android'        },
  { name: 'Web App',    lead: 'Schultze / Johnson', color: '#4F9CF9', note: 'dashboard & analytics'},
  { name: 'Cloud',      lead: 'Abdul / Isaac',      color: '#3DCC91', note: 'infrastructure & APIs'},
];
const WORKSTREAMS = [
  { name: 'Organizational / Team', num: 'WS-2', color: '#A78BFA', captain: 'Randy Ross',           captainRole: 'Chief of Staff',       open: false,
    items: ['Investigate future stock option approaches','Develop and maintain talent portfolio system','Prototype compensation and reward structures','Build long-term health plan concepts','Organizational capability and structure plans','Finalize short-term employment plan for Isaac'] },
  { name: 'Clinical & Research',   num: 'WS-3', color: '#3DCC91', captain: 'TBD',                  captainRole: 'Research Lead',        open: true,
    items: ['IRB process coordination','Develop clinical research partnerships','Engage nursing and physician advisors','Potential collaborations with medical leaders'] },
  { name: 'Legal / Finance',       num: 'WS-4', color: '#FFC940', captain: 'Open — need to hire',  captainRole: 'Finance & Legal Lead', open: true,
    items: ['Develop venture and private equity strategy','Map federal funding opportunities and timelines','Create capital deployment plans','Build future advisor ecosystem','Engage investors, experts, strategic partners'] },
];
const MEETING_TIERS = [
  { name: 'ODAT Leadership Team', tier: 'Tier 1', freq: 'Weekly',    freqColor: '#4F9CF9', purpose: 'Strategic decisions and funding alignment',      members: ['Brian Johnson','Greg Schultze','Randy Ross','Legal / Finance (TBD)'] },
  { name: 'Engineering Team',     tier: 'Tier 2', freq: '2× Weekly', freqColor: '#3DCC91', purpose: 'Technical alignment and sprint execution',        members: ['Isaac','Gavin','Abdul','Johannes','Paulo','+ Leadership'] },
  { name: 'Extended Ecosystem',   tier: 'Tier 3', freq: 'Monthly',   freqColor: '#A78BFA', purpose: 'Relationship building and updates',               members: ['Advisors','Supporters','Friends & family'] },
  { name: 'Leadership Coaching',  tier: 'Tier 4', freq: 'Bi-weekly', freqColor: '#FFC940', purpose: 'Leadership focus and coaching',                   members: ['Brian Johnson','Randy Ross'] },
];
const RESOURCES = [
  { name: 'GitHub Enterprise',     tag: 'Source Control',  area: 'Engineering', color: '#00B4D8', status: 'Active'  as const, desc: 'Monorepo for firmware, cloud services, and web clients.' },
  { name: 'AWS Multi-Tenant',      tag: 'Cloud',           area: 'Engineering', color: '#00B4D8', status: 'Active'  as const, desc: 'Tenant-isolated accounts; IoT Core, DynamoDB, Lambda, S3, KMS.' },
  { name: 'Terraform Cloud',       tag: 'IaC',             area: 'Engineering', color: '#4F9CF9', status: 'Active'  as const, desc: 'Remote plan/apply with state locking; workspace-per-service.' },
  { name: 'Linear',                tag: 'Sprint Tracking', area: 'Engineering', color: '#4F9CF9', status: 'Active'  as const, desc: '2-week sprint cycles aligned to the twice-weekly engineering cadence.' },
  { name: 'REDCap',                tag: 'Clinical Data',   area: 'Clinical',    color: '#3DCC91', status: 'Active'  as const, desc: 'IRB-approved data capture for observational and research studies.' },
  { name: 'Veeva Vault',           tag: 'Regulatory',      area: 'Clinical',    color: '#3DCC91', status: 'Active'  as const, desc: 'Document management for FDA submissions, QMS, and regulatory dossiers.' },
  { name: 'IRB Manager',           tag: 'Compliance',      area: 'Clinical',    color: '#3DCC91', status: 'Planned' as const, desc: 'Protocol and amendment timeline tracking for research workstream.' },
  { name: 'Rippling',              tag: 'HR / Payroll',    area: 'Org',         color: '#A78BFA', status: 'Active'  as const, desc: 'Payroll, benefits, onboarding — supports Isaac FTE transition.' },
  { name: 'Notion',                tag: 'Knowledge',       area: 'Org',         color: '#A78BFA', status: 'Active'  as const, desc: 'Company wiki, talent portfolio, OKRs, and ecosystem workstream map.' },
  { name: 'Slack',                 tag: 'Comms',           area: 'Org',         color: '#A78BFA', status: 'Active'  as const, desc: 'Primary async comms; #on-call auto-pages from AWS SNS.' },
  { name: 'Cap Table Manager',     tag: 'Equity',          area: 'Finance',     color: '#FFC940', status: 'Planned' as const, desc: 'Stock option exploration and cap table management — WS-2 dependency.' },
  { name: 'Federal Grants Portal', tag: 'Funding',         area: 'Finance',     color: '#FFC940', status: 'Planned' as const, desc: 'NIH, NSF, and SBIR opportunity tracking for federal funding roadmap.' },
];
const PRIORITIES = [
  { n: '01', label: 'Hardware',   text: 'Complete DVT validation — IWR6843AOP + OSD62x-PM PCB' },
  { n: '02', label: 'Cloud',      text: 'Ship Ella v1 — Claude on Bedrock, HIPAA-validated nurse API' },
  { n: '03', label: 'Clinical',   text: 'Advance IRB protocols for ambient sensing pilot deployment' },
  { n: '04', label: 'Team',       text: 'Finalize Isaac FTE transition · Hire Senior Firmware Lead' },
  { n: '05', label: 'Funding',    text: 'Submit SBIR Phase I aligned to $248K MN grant roadmap' },
  { n: '06', label: 'Regulatory', text: 'Establish SaMD FDA pathway · Populate Veeva Vault QMS' },
];
const THEMES = [
  { label: 'Derisk Commercialization', color: '#4F9CF9' },
  { label: 'Build Repeatable Systems',  color: '#3DCC91' },
  { label: 'Create Talent Ecosystem',   color: '#A78BFA' },
  { label: 'Develop Future Structure',  color: '#FFC940' },
  { label: 'Ship Clinical Validation',  color: '#F43F5E' },
  { label: 'Secure Federal Funding',    color: '#FB923C' },
];
const EXEC_SECTIONS = [
  { n:'01', label:'Inflection Point',    thesis:'Ambient Intelligence stands at an inflection point.',    body:'Converging funding opportunities and accelerating market interest create a narrow window to move from promising research to commercial reality—but only if we act decisively this summer.' },
  { n:'02', label:'The Opportunity',     thesis:'The opportunity is real, and it is time-bound.',         body:'Multiple funding pathways are emerging in parallel: federal funding programs aligned with our technical roadmap, alongside active private equity interest seeking near-term commercialization plays. These channels rarely open simultaneously, and each carries its own diligence timeline. Missing this window means waiting another fiscal cycle—or longer—for comparable conditions to return.' },
  { n:'03', label:'The Sprint',          thesis:'Capturing it requires a summer sprint.',                  body:'To meet investor and agency expectations, we must compress our delivery timeline and reach commercialization readiness within the next quarter. This means prioritizing ruthlessly, locking scope on the demonstrations that matter most to funders, and front-loading the technical milestones that de-risk the platform in the eyes of external evaluators.' },
  { n:'04', label:'Stronger Fundamentals',thesis:'Execution depends on stronger fundamentals.',           body:'The pace ahead exceeds what our current operating model can sustain. We need clearer organizational structure with defined ownership, tighter process discipline around decisions and deliverables, and more deliberate ecosystem management—actively cultivating the partners, customers, and advocates whose engagement will validate our story to funders. Without these foundations, the sprint will produce activity without traction.' },
  { n:'05', label:'The Path Forward',    thesis:'The path forward is clear.',                              body:'Aligning the team behind a focused summer plan, supported by the structural improvements outlined in this document, positions Ambient Intelligence to convert this moment of opportunity into durable commercial momentum.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function ini(name: string) {
  const p = name.split(' ').filter(Boolean);
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
}
function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Glow ring */}
      <div style={{ position:'absolute', inset:-3, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}30` }}/>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`${color}18`, border:`1.5px solid ${color}55` }}/>
      <span style={{ position:'relative', fontFamily:'var(--mono)', fontSize:size*0.29, fontWeight:500, color, letterSpacing:'0.04em' }}>{ini(name)}</span>
    </div>
  );
}
function SecHead({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
      <div style={{ width:2, height:20, borderRadius:2, background:color }}/>
      <span style={{ fontFamily:'var(--sans)', fontSize:14, fontWeight:600, color:C.text }}>{label}</span>
      <div style={{ flex:1, height:1, background:`${color}18` }}/>
      <span style={{ fontFamily:'var(--serif)', fontSize:24, fontWeight:400, color, lineHeight:1 }}>{count}</span>
    </div>
  );
}

// ── Flow Glow (exec summary background) ──────────────────────────────────────
function FlowGlowBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<Cfg>({
    cornerRadius: 0,
    speed: 0.19,
    blobSize: 0.66,
    intensity: 0.27,
    strokeWidth: 10.5,
    padding: 25,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const create = function create(e: HTMLCanvasElement, t: () => Cfg) {let a: number,l=e.getContext("2d")!,i=0,n=0,r=performance.now(),o: [number,number,number][]= [[188,130,243],[245,185,234],[141,159,255],[255,103,120],[255,186,113],[198,134,255]],s=[{fx:.31,fy:.47,px:0,py:.5*Math.PI},{fx:.53,fy:.29,px:Math.PI,py:1.2*Math.PI},{fx:.41,fy:.67,px:.7*Math.PI,py:0},{fx:.23,fy:.53,px:1.5*Math.PI,py:.8*Math.PI},{fx:.59,fy:.37,px:.3*Math.PI,py:1.7*Math.PI},{fx:.43,fy:.61,px:1.1*Math.PI,py:.3*Math.PI}],h=["#BC82F3","#F5B9EA","#8D9FFF","#FF6778","#FFBA71","#C686FF"],d=[...h],m=[...h],c=1,p=.45,g=(e: string)=>{const t=parseInt(e.replace("#",""),16);return[t>>16&255,t>>8&255,255&t] as [number,number,number]},u=()=>{const t=e.getBoundingClientRect();e.width=t.width||window.innerWidth,e.height=t.height||window.innerHeight},b=(e: number,t: number,a: number,i: number,n: number)=>{n=Math.max(0,Math.min(n,a/2,i/2)),l.beginPath(),l.moveTo(e+n,t),l.lineTo(e+a-n,t),l.arcTo(e+a,t,e+a,t+n,n),l.lineTo(e+a,t+i-n),l.arcTo(e+a,t+i,e+a-n,t+i,n),l.lineTo(e+n,t+i),l.arcTo(e,t+i,e,t+i-n,n),l.lineTo(e,t+n),l.arcTo(e,t,e+n,t,n),l.closePath()},f=(u: number)=>{const y=Math.min((u-r)/1e3,.05);r=u;const M=t(),x=e.width,w=e.height,k=x/2,S=w/2,v=Math.min(x,w);i+=M.speed*y,n+=.4*y,c=Math.min(1,c+y/.55),(p-=y)<=0&&c>=1&&(p=.4+.15*Math.random(),d=[...m],c=0,m=[...h].sort(()=>Math.random()-.5));const C=d.map((e,t)=>((e: string,t: string,a: number)=>{const[l,i,n]=g(e),[r,o,s]=g(t);return`rgb(${Math.round(l+(r-l)*a)},${Math.round(i+(o-i)*a)},${Math.round(n+(s-n)*a)})`})(e,m[t],c));l.clearRect(0,0,x,w),l.fillStyle="#0B1628",l.fillRect(0,0,x,w);const R=M.padding,F=M.strokeWidth,A=M.intensity,I=x-2*R,P=w-2*R,$=M.cornerRadius,z=v*M.blobSize;l.save(),b(R,R,I,P,$),l.clip(),l.globalCompositeOperation="screen",s.forEach((e,t)=>{const[a,n,rr]=o[t],ss=k+.4*I*Math.sin(i*e.fx+e.px),hh=S+.4*P*Math.cos(i*e.fy+e.py),dd=l.createRadialGradient(ss,hh,0,ss,hh,z);dd.addColorStop(0,`rgba(${a},${n},${rr},${.82*A})`),dd.addColorStop(.42,`rgba(${a},${n},${rr},${.36*A})`),dd.addColorStop(1,`rgba(${a},${n},${rr},0)`),l.beginPath(),l.arc(ss,hh,z,0,2*Math.PI),l.fillStyle=dd,l.fill()}),l.restore();const B=(ee: number,t: number,a: number)=>{let ii: CanvasGradient;l.save(),t>0&&(l.filter=`blur(${t}px)`),l.globalAlpha=a,ii=l.createConicGradient(n-Math.PI/2,k,S),C.forEach((e,t)=>ii.addColorStop(t/C.length,e)),ii.addColorStop(1,C[0]),l.strokeStyle=ii,l.lineWidth=ee,l.lineCap="round",b(R,R,I,P,$),l.stroke(),l.restore()};B(4.5*F,26*A,.3*A),B(2.8*F,14*A,.5*A),B(1.6*F,5*A,.72*A),B(F,0,1),a=requestAnimationFrame(f)};u(),a=requestAnimationFrame(f);const y=new ResizeObserver(()=>u());return y.observe(e),()=>{cancelAnimationFrame(a),y.disconnect()}};
    return create(canvas, () => cfgRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}
    />
  );
}

// ── Spark Network (hero background) ──────────────────────────────────────────
function SparkNet() {
  const nodes = [
    [200,180],[520,120],[760,280],[920,140],[1200,200],
    [380,420],[1060,400],[1380,340],[100,540],[600,580],
    [880,620],[1100,550],[1350,640],[1450,180],[300,640],
  ] as [number,number][];
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[4,6],[2,6],[6,7],[0,5],[5,8],[5,2],
    [2,9],[9,10],[10,11],[11,12],[6,10],[7,12],[4,13],[8,14],[9,14],
  ];
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.65 }} viewBox="0 0 1440 780" preserveAspectRatio="xMidYMid slice">
      <defs>
        <style>{`
          .sn-bb{fill:none;stroke:rgba(79,156,249,0.06);stroke-width:0.8}
          .sn-sp{fill:none;stroke:rgba(79,156,249,0.22);stroke-width:0.9;stroke-dasharray:9 7}
          .sn-sp:nth-child(20){animation:snda 5.1s linear infinite}
          .sn-sp:nth-child(21){animation:sndb 6.8s linear infinite;animation-delay:-1.6s}
          .sn-sp:nth-child(22){animation:sndc 4.4s linear infinite;animation-delay:-0.9s}
          .sn-sp:nth-child(23){animation:sndd 7.2s linear infinite;animation-delay:-3.1s}
          .sn-sp:nth-child(24){animation:snde 5.8s linear infinite;animation-delay:-2.0s}
          .sn-sp:nth-child(25){animation:sndf 4.9s linear infinite;animation-delay:-1.2s}
          .sn-sp:nth-child(26){animation:sndg 6.3s linear infinite;animation-delay:-3.7s}
          .sn-sp:nth-child(27){animation:sndh 5.5s linear infinite;animation-delay:-0.5s}
          .sn-sp:nth-child(28){animation:sndi 4.7s linear infinite;animation-delay:-2.3s}
          .sn-sp:nth-child(29){animation:sndj 6.0s linear infinite;animation-delay:-1.8s}
          .sn-sp:nth-child(30){animation:sndk 5.3s linear infinite;animation-delay:-3.4s}
          @keyframes snda{from{stroke-dashoffset:54}to{stroke-dashoffset:0}}
          @keyframes sndb{from{stroke-dashoffset:81}to{stroke-dashoffset:0}}
          @keyframes sndc{from{stroke-dashoffset:45}to{stroke-dashoffset:0}}
          @keyframes sndd{from{stroke-dashoffset:72}to{stroke-dashoffset:0}}
          @keyframes snde{from{stroke-dashoffset:54}to{stroke-dashoffset:0}}
          @keyframes sndf{from{stroke-dashoffset:45}to{stroke-dashoffset:0}}
          @keyframes sndg{from{stroke-dashoffset:72}to{stroke-dashoffset:0}}
          @keyframes sndh{from{stroke-dashoffset:54}to{stroke-dashoffset:0}}
          @keyframes sndi{from{stroke-dashoffset:81}to{stroke-dashoffset:0}}
          @keyframes sndj{from{stroke-dashoffset:54}to{stroke-dashoffset:0}}
          @keyframes sndk{from{stroke-dashoffset:45}to{stroke-dashoffset:0}}
          .sn-node{fill:rgba(79,156,249,0.18);stroke:rgba(79,156,249,0.35);stroke-width:0.8}
          .sn-ring{fill:none;stroke:rgba(79,156,249,0.09);stroke-width:0.7;
            animation:snring 5.2s ease-out infinite;transform-box:fill-box;transform-origin:center}
          .sn-ring.r2{animation-delay:-2.6s;animation-duration:6.2s}
          .sn-ring.r3{animation-delay:-1.1s;animation-duration:4.1s}
          @keyframes snring{0%{transform:scale(1);opacity:0.28}100%{transform:scale(9);opacity:0}}
        `}</style>
      </defs>
      {edges.map(([a,b],i) => (
        <line key={`bb${i}`} className="sn-bb"
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}/>
      ))}
      {edges.slice(0,11).map(([a,b],i) => (
        <line key={`sp${i}`} className="sn-sp"
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}/>
      ))}
      {nodes.map(([x,y],i) => (
        <g key={`n${i}`}>
          {i < 5 && <circle cx={x} cy={y} r={24} className="sn-ring"/>}
          {i < 3 && <circle cx={x} cy={y} r={18} className="sn-ring r2"/>}
          {i === 2 && <circle cx={x} cy={y} r={13} className="sn-ring r3"/>}
          <circle cx={x} cy={y} r={i < 4 ? 3.5 : 2.2} className="sn-node"/>
        </g>
      ))}
    </svg>
  );
}

// ── Orbital Canvas (hero right panel) ────────────────────────────────────────
function OrbitalCanvas() {
  const W = 620, H = 580, cx = 310, cy = 290;
  const RINGS = [
    { id:'oc1', rx:82,  ry:36,  color:'#4F9CF9', dur:7,  nDots:1, label:'ODAT'        },
    { id:'oc2', rx:154, ry:68,  color:'#00B4D8', dur:12, nDots:2, label:'Engineering' },
    { id:'oc3', rx:226, ry:100, color:'#3DCC91', dur:18, nDots:2, label:'Ecosystem'   },
    { id:'oc4', rx:285, ry:126, color:'#A78BFA', dur:26, nDots:1, label:'Advisory'    },
  ];
  // Dot: outer group translates to center, inner group rotates (animateTransform),
  // then scale Y to make ellipse, translate to orbital radius, counter-scale dot.
  type DotSpec = { key:string; ring: typeof RINGS[0]; fromDeg:number; opacity:number; r:number };
  const dots: DotSpec[] = RINGS.flatMap(ring =>
    Array.from({ length: ring.nDots }, (_, i): DotSpec => ({
      key:`${ring.id}_${i}`, ring,
      fromDeg: i === 0 ? 0 : 180,
      opacity: i === 0 ? 0.92 : 0.48,
      r: i === 0 ? 4.5 : 3,
    }))
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'100%' }} aria-hidden>
      <defs>
        <filter id="oc-bloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="oc-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="oc-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent"/>
          <stop offset="100%" stopColor={C.bg}/>
        </radialGradient>
      </defs>

      {/* Star field */}
      {Array.from({length:42},(_,i)=>(
        <circle key={`st${i}`} cx={(i*139.3)%W} cy={(i*97.7)%H} r={0.55+(i%3)*0.3} fill="white" opacity={0.05+(i%7)*0.018}/>
      ))}

      {/* Orbital rings */}
      {RINGS.map((r,i)=>(
        <ellipse key={r.id} cx={cx} cy={cy} rx={r.rx} ry={r.ry}
          fill="none" stroke={r.color} strokeWidth={0.75}
          strokeDasharray={i===0?undefined:`${3+i*1.5} ${6+i*2}`}
          opacity={0.30-i*0.04}/>
      ))}

      {/* Ring labels */}
      {RINGS.map(r=>(
        <text key={`lbl${r.id}`} x={cx+r.rx+9} y={cy+4.5}
          fill={r.color} opacity={0.55} fontSize={8.5} fontFamily="var(--mono)"
          letterSpacing="0.09em">{r.label.toUpperCase()}</text>
      ))}

      {/* Center glow */}
      <circle cx={cx} cy={cy} r={46} fill={`rgba(79,156,249,0.06)`} filter="url(#oc-glow)"/>
      <circle cx={cx} cy={cy} r={28} fill="rgba(79,156,249,0.10)" filter="url(#oc-bloom)"/>
      <circle cx={cx} cy={cy} r={15} fill={C.surf1} stroke="rgba(79,156,249,0.6)" strokeWidth="1.5"/>
      <text x={cx} y={cy+5} textAnchor="middle" fill={C.text} fontSize={11} fontFamily="var(--serif)" fontStyle="italic" opacity={0.92}>AI</text>

      {/* Orbital dots using animateTransform */}
      {dots.map(({key,ring,fromDeg,opacity,r})=>(
        <g key={key} transform={`translate(${cx},${cy})`}>
          <g>
            <animateTransform attributeName="transform" type="rotate"
              from={`${fromDeg}`} to={`${fromDeg+360}`}
              dur={`${ring.dur}s`} repeatCount="indefinite"/>
            <g transform={`scale(1,${ring.ry/ring.rx})`}>
              <g transform={`translate(${ring.rx},0)`}>
                <circle r={r} fill={ring.color} opacity={opacity}
                  transform={`scale(1,${ring.rx/ring.ry})`}
                  filter="url(#oc-bloom)"/>
              </g>
            </g>
          </g>
        </g>
      ))}

      {/* Edge vignette */}
      <rect x={0} y={0} width={W} height={H} fill="url(#oc-vignette)" pointerEvents="none"/>
    </svg>
  );
}

// ── Ecosystem Map (workstreams hub-spoke) ────────────────────────────────────
function EcosystemMap() {
  const W = 860, H = 320, cx = 430, cy = 160;
  const NODES = [
    { id:'eng',  label:'Engineering',         sub:'WS-1 · 6 Disciplines', color:'#00B4D8', x:430, y:44  },
    { id:'org',  label:'Org / Team',          sub:'WS-2 · Randy Ross',    color:'#A78BFA', x:756, y:160 },
    { id:'clin', label:'Clinical & Research', sub:'WS-3 · Captain TBD',   color:'#3DCC91', x:430, y:276 },
    { id:'leg',  label:'Legal / Finance',     sub:'WS-4 · Open Role',     color:'#FFC940', x:104, y:160 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:320 }} aria-hidden>
      <defs>
        <filter id="em-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <style>{`
          .em-bb{fill:none;stroke-width:0.7}
          .em-sp{fill:none;stroke-width:1;stroke-dasharray:8 8}
          .em-s1{animation:em1 2.8s linear infinite}
          .em-s2{animation:em2 3.4s linear infinite;animation-delay:-1.2s}
          .em-s3{animation:em3 2.5s linear infinite;animation-delay:-0.7s}
          .em-s4{animation:em4 3.7s linear infinite;animation-delay:-2s}
          @keyframes em1{from{stroke-dashoffset:48}to{stroke-dashoffset:0}}
          @keyframes em2{from{stroke-dashoffset:64}to{stroke-dashoffset:0}}
          @keyframes em3{from{stroke-dashoffset:48}to{stroke-dashoffset:0}}
          @keyframes em4{from{stroke-dashoffset:64}to{stroke-dashoffset:0}}
          .em-node-ring{fill:none;stroke-width:0.8;animation:em-ring 3.5s ease-out infinite;transform-box:fill-box;transform-origin:center}
          @keyframes em-ring{0%{transform:scale(1);opacity:0.3}100%{transform:scale(2.8);opacity:0}}
        `}</style>
      </defs>

      {/* Backbone lines */}
      {NODES.map(n=>(
        <line key={`bb${n.id}`} className="em-bb" x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={n.color} opacity={0.15}/>
      ))}
      {/* Traveling sparks */}
      {NODES.map((n,i)=>(
        <line key={`sp${n.id}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
          className={`em-sp em-s${i+1}`} stroke={n.color} opacity={0.55}/>
      ))}

      {/* Workstream nodes */}
      {NODES.map(n=>(
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={36} className="em-node-ring" stroke={n.color} opacity={0.25}/>
          <circle cx={n.x} cy={n.y} r={28} fill={`${n.color}12`} stroke={n.color} strokeWidth={1} opacity={0.6}/>
          <circle cx={n.x} cy={n.y} r={28} fill={`${n.color}08`}/>
          <text x={n.x} y={n.y-4} textAnchor="middle" fill={n.color} fontSize={11} fontFamily="var(--sans)" fontWeight={600}>{n.label}</text>
          <text x={n.x} y={n.y+10} textAnchor="middle" fill={n.color} fontSize={7.5} fontFamily="var(--mono)" opacity={0.6} letterSpacing="0.06em">{n.sub.toUpperCase()}</text>
        </g>
      ))}

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={42} fill={`rgba(79,156,249,0.06)`} filter="url(#em-glow)"/>
      <circle cx={cx} cy={cy} r={30} fill={C.surf2} stroke="rgba(79,156,249,0.55)" strokeWidth="1.5"/>
      <text x={cx} y={cy-4} textAnchor="middle" fill={C.text} fontSize={9.5} fontFamily="var(--serif)" fontStyle="italic" opacity={0.9}>Ambient</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={C.text3} fontSize={7} fontFamily="var(--mono)" letterSpacing="0.12em">INTELLIGENCE</text>
    </svg>
  );
}

// ── Radial Cadence ────────────────────────────────────────────────────────────
function RadialCadence() {
  const W = 560, H = 560, cx = 280, cy = 280;
  const RADIAL = [
    { label:'Engineering Team',    freq:'2× Weekly', color:'#3DCC91', r:65,  dots:8  },
    { label:'ODAT Leadership',     freq:'Weekly',    color:'#4F9CF9', r:118, dots:4  },
    { label:'Leadership Coaching', freq:'Bi-weekly', color:'#FFC940', r:171, dots:2  },
    { label:'Extended Ecosystem',  freq:'Monthly',   color:'#A78BFA', r:218, dots:1  },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', maxWidth:560 }} aria-hidden>
      <defs>
        <radialGradient id="rc-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(79,156,249,0.08)"/>
          <stop offset="100%" stopColor="rgba(79,156,249,0)"/>
        </radialGradient>
        <filter id="rc-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <style>{`
          .rc-dot{filter:url(#rc-glow)}
          .rc-ring-pulse{fill:none;stroke-width:0.6;animation:rcring 4s ease-out infinite;transform-box:fill-box;transform-origin:center}
          @keyframes rcring{0%{transform:scale(1);opacity:0.2}100%{transform:scale(1.08);opacity:0}}
        `}</style>
      </defs>

      {/* Ambient glow center */}
      <circle cx={cx} cy={cy} r={W/2-10} fill="url(#rc-bg)"/>

      {/* Rings + dots */}
      {RADIAL.map((ring,ri)=>(
        <g key={ring.label}>
          <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke={ring.color} strokeWidth={0.7} opacity={0.2}/>
          <circle cx={cx} cy={cy} r={ring.r} className="rc-ring-pulse" stroke={ring.color} style={{ animationDelay:`${ri*0.9}s` }}/>
          {/* Meeting dots */}
          {Array.from({length:ring.dots},(_,i)=>{
            const a = (i/ring.dots)*2*Math.PI - Math.PI/2;
            return (
              <circle key={i} className="rc-dot"
                cx={cx+ring.r*Math.cos(a)} cy={cy+ring.r*Math.sin(a)}
                r={ring.dots>=6?3:4} fill={ring.color} opacity={0.85}/>
            );
          })}
          {/* Label at right edge */}
          <text x={cx+ring.r+10} y={cy-3} fill={ring.color} opacity={0.75} fontSize={9.5} fontFamily="var(--mono)" letterSpacing="0.08em">{ring.freq.toUpperCase()}</text>
          <text x={cx+ring.r+10} y={cy+10} fill={ring.color} opacity={0.40} fontSize={7.5} fontFamily="var(--mono)" letterSpacing="0.06em">{ring.label.toUpperCase()}</text>
        </g>
      ))}

      {/* Center node */}
      <circle cx={cx} cy={cy} r={38} fill={`rgba(79,156,249,0.06)`}/>
      <circle cx={cx} cy={cy} r={24} fill={C.surf1} stroke="rgba(79,156,249,0.45)" strokeWidth="1.2"/>
      <text x={cx} y={cy-3} textAnchor="middle" fill={C.text3} fontSize={7.5} fontFamily="var(--mono)" letterSpacing="0.12em">AMBIENT</text>
      <text x={cx} y={cy+9} textAnchor="middle" fill={C.text3} fontSize={7.5} fontFamily="var(--mono)" letterSpacing="0.12em">INTEL</text>

      {/* Legend */}
      <text x={cx} y={H-14} textAnchor="middle" fill={C.text3} fontSize={8} fontFamily="var(--mono)" letterSpacing="0.08em">
        DOTS = MEETINGS / MONTH · INNER RING = HIGHEST FREQUENCY
      </text>
    </svg>
  );
}

// ── Executive Summary ─────────────────────────────────────────────────────────
const EXEC_PARAGRAPHS = [
  `Ambient Intelligence stands at an inflection point. Converging funding opportunities and accelerating market interest create a narrow window to move from promising research to commercial reality, but only if we act decisively this summer. Multiple funding pathways are emerging in parallel, including federal programs aligned with our technical roadmap and active private equity interest seeking near-term commercialization plays. These channels rarely open simultaneously, each carries its own diligence timeline, and missing this window means waiting another fiscal cycle for comparable conditions to return.`,
  `Capturing the moment requires a summer sprint. To meet investor and agency expectations, we must compress our delivery timeline and reach commercialization readiness within the next quarter. That means prioritizing ruthlessly, locking scope on the demonstrations that matter most to funders, and front-loading the technical milestones that de-risk the platform. Execution depends on stronger fundamentals. The pace ahead exceeds what our current operating model can sustain, requiring clearer organizational structure, tighter process discipline, and deliberate ecosystem management to cultivate the partners, customers, and advocates who will validate our story to funders.`,
  `Aligning the team behind a focused summer plan, supported by the structural improvements outlined in this document, positions Ambient Intelligence to convert this moment of opportunity into durable commercial momentum.`,
];

function ExecSummary() {
  return (
    <div style={{ position:'relative', overflow:'hidden', borderTop:`1px solid ${C.line}`, padding:'64px 0 72px' }}>
      {/* Animated gradient matching hero */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 5% 50%, rgba(45,114,210,0.13) 0%, transparent 52%), radial-gradient(ellipse at 92% 20%, rgba(0,180,216,0.09) 0%, transparent 48%), radial-gradient(ellipse at 50% 90%, rgba(167,139,250,0.07) 0%, transparent 44%), ${C.bg}`, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div className="org-orb-a" style={{ position:'absolute', left:-180, top:-60, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,114,210,0.12), transparent 65%)', filter:'blur(80px)' }}/>
        <div className="org-orb-b" style={{ position:'absolute', right:-120, bottom:-60, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.09), transparent 65%)', filter:'blur(80px)' }}/>
        <div className="org-orb-c" style={{ position:'absolute', left:'55%', top:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.07), transparent 65%)', filter:'blur(90px)' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:1300, margin:'0 auto', padding:'0 48px' }}>
        {/* Eyebrow */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <div style={{ width:2, height:18, background:C.accent, borderRadius:1 }}/>
          <span style={{ fontFamily:'var(--mono)', fontSize:14, textTransform:'uppercase', letterSpacing:'0.12em', color:C.text2 }}>Executive Summary</span>
        </div>

        {/* Prose — 2 columns */}
        <div style={{ columns:2, columnGap:52 }}>
          {EXEC_PARAGRAPHS.map((p, i) => (
            <p key={i} style={{
              margin: '0 0 20px',
              fontFamily: 'var(--serif)',
              fontSize: i === 0 ? 20 : 17,
              fontWeight: 300,
              color: i === 0 ? C.text : C.text2,
              lineHeight: 1.84,
              letterSpacing: '0.008em',
              breakInside: 'avoid',
            }}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Workstreams Tab ───────────────────────────────────────────────────────────
function WorkstreamsTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {/* Ecosystem hub-spoke overview */}
      <div style={{ background:C.surf1, borderRadius:16, border:`1px solid ${C.line}`, padding:'28px 0 12px', overflow:'hidden' }}>
        <div style={{ padding:'0 28px 16px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:2, height:16, background:C.accent, borderRadius:1 }}/>
          <span style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', color:C.text3 }}>Ecosystem Overview</span>
        </div>
        <EcosystemMap/>
      </div>

      {/* Engineering — full width */}
      <div style={{ background:C.surf1, borderRadius:16, border:'1px solid rgba(0,180,216,0.20)', overflow:'hidden' }}>
        <div style={{ height:3, background:'linear-gradient(90deg,#00B4D8,rgba(0,180,216,0.2))' }}/>
        <div style={{ padding:'26px 30px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:22 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'#00B4D8', textTransform:'uppercase', letterSpacing:'0.12em' }}>Workstream 1 · Active</span>
              </div>
              <h3 style={{ margin:'0 0 6px', fontSize:22, fontWeight:600, color:C.text, fontFamily:'var(--sans)', letterSpacing:'-0.01em' }}>Engineering</h3>
              <p style={{ margin:0, fontSize:13, color:C.text2, lineHeight:1.6 }}>Core technical execution across 6 disciplines — firmware through cloud, all feeding the summer sprint.</p>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:56, fontWeight:300, color:'#00B4D8', lineHeight:1 }}>6</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:C.text3, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>disciplines</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:10 }}>
            {ENG_DISCIPLINES.map(d=>(
              <div key={d.name} style={{ background:C.surf2, borderRadius:10, border:`1px solid ${C.line}`, borderLeft:`3px solid ${d.color}`, padding:'13px 15px' }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, fontFamily:'var(--sans)', marginBottom:3 }}>{d.name}</div>
                <div style={{ fontSize:11, color:d.color, fontFamily:'var(--mono)', marginBottom:d.note?4:0 }}>{d.lead}</div>
                {d.note && <div style={{ fontSize:9.5, color:C.text3, fontFamily:'var(--mono)' }}>{d.note}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, padding:'12px 16px', borderRadius:9, background:'rgba(255,201,64,0.06)', border:'1px solid rgba(255,201,64,0.16)' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:9.5, color:'#FFC940' }}>Note — </span>
            <span style={{ fontSize:12, color:C.text3, lineHeight:1.55 }}>Treat as an experiment requiring intentional derisking, mentoring, and process discipline. Undergraduate contributors may underestimate system complexity.</span>
          </div>
        </div>
      </div>

      {/* WS 2–4 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
        {WORKSTREAMS.map(ws=>(
          <div key={ws.name} className="org-card" style={{ background:C.surf1, borderRadius:14, border:`1px solid ${C.line}`, overflow:'hidden' }}>
            <div style={{ height:3, background:`linear-gradient(90deg,${ws.color},${ws.color}40)` }}/>
            <div style={{ padding:'22px 24px' }}>
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:ws.color, textTransform:'uppercase', letterSpacing:'0.12em' }}>{ws.num}</span>
                  {ws.open && <span style={{ padding:'2px 8px', borderRadius:4, background:'rgba(255,201,64,0.08)', border:'1px solid rgba(255,201,64,0.26)', fontSize:9, color:'#FFC940', fontFamily:'var(--mono)' }}>Captain needed</span>}
                </div>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, fontFamily:'var(--sans)', marginBottom:3 }}>{ws.name}</div>
                <div style={{ fontSize:11, fontFamily:'var(--mono)', color:ws.open?'rgba(255,201,64,0.50)':ws.color }}>{ws.captain}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {ws.items.map((item,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10, color:ws.color, flexShrink:0, marginTop:2 }}>{String(i+1).padStart(2,'0')}</span>
                    <span style={{ fontSize:12, color:C.text2, lineHeight:1.55 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
function TeamTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:44 }}>
      <div>
        <SecHead label="ODAT Advisors" color={C.accent} count={ODAT.length}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
          {ODAT.map(p=>(
            <div key={p.name} className="org-card" style={{ background:C.surf1, border:`1px solid ${C.line}`, borderRadius:14, padding:'22px 24px', display:'flex', alignItems:'flex-start', gap:16 }}>
              <Avatar name={p.name} color={p.color} size={52}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:600, color:C.text, fontFamily:'var(--sans)', marginBottom:3 }}>{p.name}</div>
                <div style={{ fontSize:11, color:p.color, fontFamily:'var(--mono)', marginBottom:9, letterSpacing:'0.02em' }}>{p.role}</div>
                <div style={{ fontSize:12, color:C.text3, lineHeight:1.65 }}>{p.focus}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SecHead label="Core Team" color="#00B4D8" count={CORE.length}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(275px,1fr))', gap:14 }}>
          {CORE.map(p=>(
            <div key={p.name} className="org-card" style={{ background:C.surf1, border:`1px solid ${C.line}`, borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
              <Avatar name={p.name} color={p.color} size={46}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text, fontFamily:'var(--sans)' }}>{p.name}</div>
                  {p.badge && <span style={{ padding:'1px 7px', borderRadius:4, background:'rgba(61,204,145,0.10)', border:'1px solid rgba(61,204,145,0.30)', fontSize:9, color:'#3DCC91', fontFamily:'var(--mono)' }}>{p.badge}</span>}
                </div>
                <div style={{ fontSize:10.5, color:p.color, fontFamily:'var(--mono)', marginBottom:7 }}>{p.role}</div>
                <div style={{ fontSize:11.5, color:C.text3, lineHeight:1.6 }}>{p.focus}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SecHead label="Open Roles" color="#FFC940" count={OPEN_ROLES.length}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(275px,1fr))', gap:14 }}>
          {OPEN_ROLES.map(r=>(
            <div key={r.role} style={{ background:C.surf1, borderRadius:12, opacity:0.88, border:`1px dashed ${r.priority==='critical'?'rgba(245,158,11,0.44)':'rgba(255,201,64,0.28)'}`, padding:'18px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, background:`${r.color}10`, border:`1.5px dashed ${r.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:`${r.color}45`, fontFamily:'var(--mono)' }}>?</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, color:C.text2, fontFamily:'var(--sans)' }}>{r.role}</div>
                  {r.priority==='critical' && <span style={{ padding:'1px 7px', borderRadius:4, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.35)', fontSize:9, color:'#F59E0B', fontFamily:'var(--mono)' }}>Critical</span>}
                </div>
                <div style={{ fontSize:10, color:r.color+'80', fontFamily:'var(--mono)', marginBottom:6 }}>{r.area}</div>
                <div style={{ fontSize:11.5, color:C.text3, lineHeight:1.55 }}>{r.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Cadence Tab ───────────────────────────────────────────────────────────────
function CadenceTab() {
  return (
    <div>
      <p style={{ fontSize:14, color:C.text2, lineHeight:1.75, maxWidth:560, margin:'0 0 36px', fontWeight:300 }}>
        Four communication tiers structure the Ambient ecosystem. Each dot in the diagram below represents one meeting per month — innermost rings meet most frequently.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, alignItems:'start' }}>
        {/* Left: radial diagram */}
        <div style={{ background:C.surf1, borderRadius:16, border:`1px solid ${C.line}`, padding:'32px 24px', display:'flex', justifyContent:'center' }}>
          <RadialCadence/>
        </div>
        {/* Right: tier cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {MEETING_TIERS.map((t,i)=>(
            <div key={t.name} className="org-card" style={{ background:C.surf1, borderRadius:12, border:`1px solid ${C.line}`, overflow:'hidden' }}>
              <div style={{ height:2.5, background:`linear-gradient(90deg,${t.freqColor},${t.freqColor}30)` }}/>
              <div style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                  <div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9.5, color:C.text3, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:3 }}>{t.tier}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text, fontFamily:'var(--sans)' }}>{t.name}</div>
                  </div>
                  <span style={{ padding:'4px 12px', borderRadius:20, flexShrink:0, background:`${t.freqColor}16`, border:`1px solid ${t.freqColor}38`, fontSize:11, color:t.freqColor, fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>{t.freq}</span>
                </div>
                <p style={{ fontSize:12, color:C.text2, lineHeight:1.55, margin:'0 0 10px' }}>{t.purpose}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {t.members.map(m=>(
                    <span key={m} style={{ padding:'2px 9px', borderRadius:4, background:C.surf2, border:`1px solid ${C.line}`, fontSize:10, color:C.text2, fontFamily:'var(--mono)' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Resources Tab ─────────────────────────────────────────────────────────────
function ResourcesTab() {
  const AREAS = [
    { key:'Engineering', label:'Engineering & Development', color:'#00B4D8' },
    { key:'Clinical',    label:'Clinical & Regulatory',     color:'#3DCC91' },
    { key:'Org',         label:'Organizational & Ops',      color:'#A78BFA' },
    { key:'Finance',     label:'Finance & Legal',           color:'#FFC940' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:36 }}>
      {AREAS.map(({ key, label, color })=>{
        const items = RESOURCES.filter(r=>r.area===key);
        if (!items.length) return null;
        return (
          <div key={key}>
            <SecHead label={label} color={color} count={items.length}/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {items.map(r=>(
                <div key={r.name} className="org-card" style={{ background:C.surf1, border:`1px solid ${C.line}`, borderRadius:12, padding:'16px 18px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:600, color:C.text, fontFamily:'var(--sans)', marginBottom:4 }}>{r.name}</div>
                      <span style={{ padding:'2px 8px', borderRadius:4, display:'inline-block', background:`${color}12`, border:`1px solid ${color}26`, fontSize:9.5, color, fontFamily:'var(--mono)' }}>{r.tag}</span>
                    </div>
                    <span style={{ padding:'3px 9px', borderRadius:5, flexShrink:0, background:r.status==='Active'?'rgba(61,204,145,0.10)':'rgba(255,201,64,0.10)', border:`1px solid ${r.status==='Active'?'rgba(61,204,145,0.28)':'rgba(255,201,64,0.28)'}`, fontSize:9.5, color:r.status==='Active'?'#3DCC91':'#FFC940', fontFamily:'var(--mono)' }}>{r.status}</span>
                  </div>
                  <p style={{ fontSize:12, color:C.text2, lineHeight:1.65, margin:0 }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrganizationPage() {
  const [tab, setTab] = useState<Tab>('workstreams');
  const TABS: { id: Tab; label: string; count: number | string }[] = [
    { id:'workstreams', label:'Workstreams', count:4 },
    { id:'team',        label:'Team',        count:`${ODAT.length+CORE.length}+${OPEN_ROLES.length}` },
    { id:'cadence',     label:'Cadence',     count:4 },
    { id:'resources',   label:'Resources',   count:RESOURCES.length },
  ];

  return (
    <div style={{ background:C.bg, color:C.text, minHeight:'100vh', fontFamily:'var(--sans)' }}>
      <style>{`
        .org-topbar::before{content:'';position:fixed;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent 0%,#2D72D2 16%,#4F9CF9 38%,#3DCC91 62%,#A78BFA 82%,transparent 100%);
          z-index:200;pointer-events:none;animation:org-bar 10s linear infinite}
        @keyframes org-bar{0%,100%{opacity:0.55}50%{opacity:1}}
        @keyframes org-orb-a{0%,100%{transform:translate(0,0)}40%{transform:translate(55px,-42px)}75%{transform:translate(-28px,20px)}}
        @keyframes org-orb-b{0%,100%{transform:translate(0,0)}38%{transform:translate(-52px,36px)}72%{transform:translate(28px,-18px)}}
        @keyframes org-orb-c{0%,100%{transform:translate(0,0)}30%{transform:translate(24px,42px)}68%{transform:translate(-36px,-22px)}}
        .org-orb-a{animation:org-orb-a 28s ease-in-out infinite}
        .org-orb-b{animation:org-orb-b 36s ease-in-out infinite}
        .org-orb-c{animation:org-orb-c 44s ease-in-out infinite}
        .org-card{transition:border-color 0.18s,background 0.18s}
        .org-card:hover{border-color:rgba(79,156,249,0.30)!important;background:rgba(79,156,249,0.04)!important}
        .org-nav-link{color:rgba(232,240,255,0.40);text-decoration:none;font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:0.08em;transition:color 0.15s}
        .org-nav-link:hover{color:#E8F0FF}
      `}</style>

      <div className="org-topbar"/>

      {/* NAV */}
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 48px',height:60,background:'rgba(11,22,40,0.88)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:`1px solid ${C.line}` }}>
        <a href="/" style={{ textDecoration:'none' }}>
          <span style={{ fontFamily:'var(--serif)',fontSize:15,fontWeight:300,color:C.text,letterSpacing:'-0.01em' }}>Ambient <em style={{ fontStyle:'italic',color:C.text2 }}>Intelligence</em></span>
        </a>
        <div style={{ display:'flex',gap:30 }}>
          {[['HR','/humancapitalmgmt'],['Cloud','/cloud'],['Firmware','/firmware'],['Research','/clinicalresearch'],['MN','/mn']].map(([l,h])=>(
            <a key={l} href={h} className="org-nav-link">{l}</a>
          ))}
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{
        position:'relative', overflow:'hidden',
        padding:'138px 0 88px', minHeight:'60vh', display:'flex', alignItems:'center',
      }}>
        {/* Background gradient */}
        <div style={{ position:'absolute', inset:0, background:`#070e1c` }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(79,156,249,0.04) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
        {/* Orbs */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div className="org-orb-a" style={{ position:'absolute', left:-220, top:-100, width:720, height:720, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,114,210,0.15), transparent 65%)', filter:'blur(90px)' }}/>
          <div className="org-orb-b" style={{ position:'absolute', right:-160, bottom:-80, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.11), transparent 65%)', filter:'blur(90px)' }}/>
          <div className="org-orb-c" style={{ position:'absolute', left:'44%', top:'35%', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.08), transparent 65%)', filter:'blur(100px)' }}/>
          <SparkNetworkBg/>
        </div>

        {/* Content */}
        <div style={{ position:'relative', zIndex:2, width:'100%' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 48px' }}>
        <div style={{ maxWidth:680 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:2, height:18, background:C.accent, borderRadius:1 }}/>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.14em', color:C.text3 }}>ODAT · Ambient Ecosystem · Summer 2026</span>
          </div>

          <h1 style={{ margin:'0 0 16px', fontSize:'clamp(30px,5vw,58px)', fontWeight:300, fontFamily:'var(--serif)', lineHeight:1.1, letterSpacing:'-0.025em', color:C.text }}>
            Ambient Intelligence<br/>
            <em style={{ fontStyle:'italic', color:C.text2 }}>Ecosystem</em>
          </h1>

          <p style={{ margin:'0 0 44px', fontSize:16, color:C.text2, lineHeight:1.72, maxWidth:540, fontFamily:'var(--sans)', fontWeight:300 }}>
            A focused summer sprint to finish development, build organizational systems, and position Ambient for commercialization and funding.
          </p>

          {/* Stats row */}
          <div style={{ display:'flex', gap:44, flexWrap:'wrap', marginBottom:28 }}>
            {[
              { v: ODAT.length + CORE.length, label:'Team members', color: C.accent   },
              { v: 4,                          label:'Workstreams',  color: '#3DCC91'  },
              { v: 6,                          label:'Disciplines',  color: '#00B4D8'  },
              { v: OPEN_ROLES.length,          label:'Open roles',   color: '#FFC940'  },
              { v: 4,                          label:'Meeting tiers',color: '#A78BFA'  },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:'var(--serif)', fontSize:40, fontWeight:400, color:s.color, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.11em', color:C.text3, marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Strategic themes */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {THEMES.map(t => (
              <span key={t.label} style={{
                padding:'9px 18px', borderRadius:8,
                background:`${t.color}12`,
                border:`1px solid ${t.color}40`,
                boxShadow:`0 0 18px ${t.color}10`,
                fontSize:12, fontWeight:500, color:t.color,
                fontFamily:'var(--sans)', letterSpacing:'0.01em',
                cursor:'default',
              }}>{t.label}</span>
            ))}
          </div>
        </div>
        </div>
        </div>
      </section>

      {/* NEXT CHAPTER */}
      <section style={{ position:'relative', overflow:'hidden', borderTop:`1px solid ${C.line}`, padding:'88px 0 96px' }}>
        {/* Dot grid background */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(79,156,249,0.07) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
        {/* Gradient vignette over grid */}
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 20% 50%, rgba(0,180,216,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(167,139,250,0.06) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(61,204,145,0.05) 0%, transparent 48%), linear-gradient(to bottom, ${C.bg} 0%, ${C.surf1}44 50%, ${C.bg} 100%)`, pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:1300, margin:'0 auto', padding:'0 48px' }}>

          {/* Title block */}
          <div style={{ marginBottom:72 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:2, height:14, background:C.accent, borderRadius:1 }}/>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.16em', color:C.accent }}>Summer 2026 · Ambient Intelligence</span>
            </div>
            <h2 style={{ margin:'0 0 24px', fontFamily:'var(--serif)', fontWeight:300, lineHeight:1.1, letterSpacing:'-0.03em', color:C.text }}>
              <span style={{ fontSize:'clamp(32px,4.5vw,62px)', display:'block' }}>The Next Chapter<span style={{ color:C.text3 }}>:</span></span>
              <em style={{ fontStyle:'italic', color:C.text2, fontSize:'clamp(32px,4.5vw,62px)', whiteSpace:'nowrap', display:'block' }}>AI Across Device, Cloud, and Organization</em>
            </h2>
          </div>

          {/* Three pillars */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2 }}>
            {[
              {
                num:'01', label:'Device', color:'#00B4D8',
                stat:'IWR6843AOP', statSub:'mmWave Radar · 60 GHz',
                headline:'Sensing the invisible at the edge.',
                body:'Custom firmware on AM62x Linux drives real-time radar signal processing for ambient sensing in clinical environments — validated from EVT through production.',
                tags:['AM62x','IWR6843AOP','Yocto','TI SDK 11','Altium','OSD62x-PM'],
                specs:[{v:'EVT→MP',l:'Hardware phases'},{v:'60 GHz',l:'mmWave band'},{v:'Linux',l:'AM62x embedded'}],
                items:['Firmware-level AI inference on embedded Linux','Sensor fusion and real-time signal processing','Schematic-to-manufacturing PCB validation','Yocto bootchain + TI Processor SDK 11','Critical hire: Senior Firmware Lead'],
              },
              {
                num:'02', label:'Cloud', color:'#3DCC91',
                stat:'5 Data Paths', statSub:'HIPAA-Validated · AWS',
                headline:'Clinical-grade infrastructure at scale.',
                body:'Ella, powered by Claude on AWS Bedrock, runs through a HIPAA-validated multi-tenant architecture with VPC/IAM/KMS isolation, Terraform IaC, and a full de-identification pipeline.',
                tags:['AWS Bedrock','FastAPI','Cognito','Terraform','KMS','Expo SDK 54'],
                specs:[{v:'HIPAA',l:'Validated'},{v:'Claude',l:'on Bedrock'},{v:'Terraform',l:'IaC per service'}],
                items:['Ella: Claude on Bedrock, nurse-facing FastAPI','AWS tenant isolation — IoT Core, DynamoDB, Lambda','REDCap + Veeva Vault for clinical and regulatory data','Next.js Turbopack web + Expo SDK 54 mobile','TestFlight pipeline, WorkOS auth, SNS push'],
              },
              {
                num:'03', label:'Organization', color:'#A78BFA',
                stat:'$248K', statSub:'MN Grant · PCT Filed',
                headline:'Patent-filed, accelerator-backed, IRB-approved.',
                body:'Backed by gener8tor with $248K in Minnesota grant funding, active IRB approvals, and clinical research partnerships across UMN, Mayo Clinic, and the State of MN.',
                tags:['PCT Patent','IRB Approved','gener8tor','UMN','Mayo Clinic','State of MN'],
                specs:[{v:'4',l:'Workstreams'},{v:'IRB',l:'Approved'},{v:'gen8tr',l:'Accelerator'}],
                items:['Stanford Biodesign framework for product development','IRB approvals for ambient sensing validation studies','Mayo Clinic and UMN research partnerships','4 workstreams: Engineering, Org, Clinical, Legal/Finance','Randy Ross driving people systems and team structure'],
              },
            ].map((col, ci) => (
              <div key={col.label} style={{ background:`linear-gradient(160deg, ${C.surf2}cc, ${C.surf1}cc)`, borderRadius: ci===0?'16px 0 0 16px': ci===2?'0 16px 16px 0':'0', border:`1px solid ${C.line}`, borderLeft: ci>0?'none':undefined, padding:'36px 32px 32px', display:'flex', flexDirection:'column', gap:0 }}>
                {/* Number + label */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                  <span style={{ fontFamily:'var(--serif)', fontSize:48, fontWeight:300, color:`${col.color}20`, lineHeight:1, letterSpacing:'-0.04em' }}>{col.num}</span>
                  <div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.16em', color:col.color, marginBottom:2 }}>{col.label}</div>
                    <div style={{ width:28, height:2, background:col.color, borderRadius:1 }}/>
                  </div>
                </div>

                {/* Hero stat */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:34, fontWeight:300, color:col.color, lineHeight:1, letterSpacing:'-0.02em', marginBottom:4 }}>{col.stat}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.12em', color:`${col.color}80` }}>{col.statSub}</div>
                </div>

                {/* Headline */}
                <div style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:400, fontStyle:'italic', color:C.text, lineHeight:1.42, marginBottom:14 }}>{col.headline}</div>

                {/* Body */}
                <p style={{ margin:'0 0 20px', fontFamily:'var(--sans)', fontSize:13, color:C.text2, lineHeight:1.72, fontWeight:300 }}>{col.body}</p>

                {/* Specs row */}
                <div style={{ display:'flex', gap:16, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.line}` }}>
                  {col.specs.map(s=>(
                    <div key={s.l}>
                      <div style={{ fontFamily:'var(--serif)', fontSize:18, fontWeight:400, color:col.color, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:8.5, textTransform:'uppercase', letterSpacing:'0.1em', color:C.text3, marginTop:2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Stack tags */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
                  {col.tags.map(t=>(
                    <span key={t} style={{ padding:'3px 9px', borderRadius:6, background:`${col.color}10`, border:`1px solid ${col.color}28`, fontSize:10.5, color:col.color, fontFamily:'var(--mono)', letterSpacing:'0.02em' }}>{t}</span>
                  ))}
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXEC SUMMARY */}
      <ExecSummary/>

      {/* ELLA SECTION */}
      <section style={{ position:'relative', overflow:'hidden', borderTop:`1px solid ${C.line}`, padding:'88px 0 96px' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(79,156,249,0.07) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 20% 50%, rgba(0,180,216,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(167,139,250,0.06) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(61,204,145,0.05) 0%, transparent 48%), linear-gradient(to bottom, ${C.bg} 0%, ${C.surf1}44 50%, ${C.bg} 100%)`, pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:1300, margin:'0 auto', padding:'0 48px' }}>
          <div style={{ marginBottom:64 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:2, height:14, background:'#3DCC91', borderRadius:1 }}/>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.16em', color:'#3DCC91' }}>Summer 2026 · Ambient Intelligence</span>
            </div>
            <h2 style={{ margin:0, fontFamily:'var(--serif)', fontWeight:300, lineHeight:1.1, letterSpacing:'-0.03em', color:C.text }}>
              <span style={{ fontSize:'clamp(32px,4.5vw,62px)', display:'block' }}>Ella AI Nurse Assistant<span style={{ color:C.text3 }}>,</span></span>
              <em style={{ fontStyle:'italic', color:C.text2, fontSize:'clamp(32px,4.5vw,62px)', whiteSpace:'nowrap', display:'block' }}>Bringing AI to Memory Care</em>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2 }}>
            {[
              { num:'01', label:'Ambient Sensing', color:'#00B4D8',
                stat:'IWR6843AOP', statSub:'mmWave · Passive · Non-wearable',
                headline:'Invisible sensing for residents who can\'t wear devices.',
                body:'Ella\'s foundation is the IWR6843AOP mmWave radar — detecting falls, motion, and presence without cameras, wearables, or interaction from residents with cognitive impairment.',
                tags:['IWR6843AOP','60 GHz','AM62x','Passive Detection','Non-wearable'],
                specs:[{v:'60 GHz',l:'mmWave band'},{v:'Passive',l:'No wearable'},{v:'Edge',l:'On-device AI'}] },
              { num:'02', label:'Clinical AI', color:'#3DCC91',
                stat:'Claude', statSub:'on AWS Bedrock · HIPAA-Validated',
                headline:'A nurse assistant that understands the clinical context.',
                body:'Ella uses Claude on AWS Bedrock to synthesize resident sensor data, alert history, and care notes into actionable clinical summaries — surfaced through a nurse-facing FastAPI dashboard.',
                tags:['Claude','AWS Bedrock','FastAPI','Cognito','HIPAA','SNS Alerts'],
                specs:[{v:'HIPAA',l:'Validated'},{v:'Claude',l:'on Bedrock'},{v:'Real-time',l:'Alert pipeline'}] },
              { num:'03', label:'Care Setting', color:'#A78BFA',
                stat:'Memory Care', statSub:'Skilled Nursing · Pilot Ready',
                headline:'Designed for the highest-acuity care environment.',
                body:'Memory care and skilled nursing facilities face the highest fall risk, lowest staffing ratios, and least tolerance for missed events. Ella is purpose-built for this population — piloted with IRB approval.',
                tags:['Memory Care','Skilled Nursing','IRB Approved','Fall Detection','Activity Classification'],
                specs:[{v:'IRB',l:'Approved'},{v:'Pilot',l:'Ready'},{v:'MOH',l:'Pilot focus'}] },
            ].map((col, ci) => (
              <div key={col.label} style={{ background:`linear-gradient(160deg, ${C.surf2}cc, ${C.surf1}cc)`, borderRadius: ci===0?'16px 0 0 16px': ci===2?'0 16px 16px 0':'0', border:`1px solid ${C.line}`, borderLeft: ci>0?'none':undefined, padding:'36px 32px 32px', display:'flex', flexDirection:'column', gap:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                  <span style={{ fontFamily:'var(--serif)', fontSize:48, fontWeight:300, color:`${col.color}20`, lineHeight:1, letterSpacing:'-0.04em' }}>{col.num}</span>
                  <div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.16em', color:col.color, marginBottom:2 }}>{col.label}</div>
                    <div style={{ width:28, height:2, background:col.color, borderRadius:1 }}/>
                  </div>
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:34, fontWeight:300, color:col.color, lineHeight:1, letterSpacing:'-0.02em', marginBottom:4 }}>{col.stat}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.12em', color:`${col.color}80` }}>{col.statSub}</div>
                </div>
                <div style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:400, fontStyle:'italic', color:C.text, lineHeight:1.42, marginBottom:14 }}>{col.headline}</div>
                <p style={{ margin:'0 0 20px', fontFamily:'var(--sans)', fontSize:13, color:C.text2, lineHeight:1.72, fontWeight:300 }}>{col.body}</p>
                <div style={{ display:'flex', gap:16, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.line}` }}>
                  {col.specs.map(s=>(
                    <div key={s.l}>
                      <div style={{ fontFamily:'var(--serif)', fontSize:18, fontWeight:400, color:col.color, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:8.5, textTransform:'uppercase', letterSpacing:'0.1em', color:C.text3, marginTop:2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {col.tags.map(t=>(
                    <span key={t} style={{ padding:'3px 9px', borderRadius:6, background:`${col.color}10`, border:`1px solid ${col.color}28`, fontSize:10.5, color:col.color, fontFamily:'var(--mono)', letterSpacing:'0.02em' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPRINT STRIP */}
      <div style={{ borderTop:`1px solid ${C.lineStrg}`,borderBottom:`1px solid ${C.line}`,background:C.surf1,padding:'16px 48px',overflowX:'auto' }}>
        <div style={{ display:'flex',alignItems:'center',gap:24,minWidth:'max-content' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <div style={{ width:2,height:16,background:C.accent,borderRadius:1 }}/>
            <span style={{ fontFamily:'var(--mono)',fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.15em',color:C.accent }}>Summer Sprint · 2026</span>
          </div>
          <div style={{ width:1,height:24,background:C.lineStrg,flexShrink:0 }}/>
          {PRIORITIES.map((p,i)=>(
            <div key={p.n} style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontFamily:'var(--serif)',fontSize:18,fontWeight:400,color:'rgba(79,156,249,0.35)',lineHeight:1 }}>{p.n}</span>
              <span style={{ fontFamily:'var(--mono)',fontSize:8.5,textTransform:'uppercase',letterSpacing:'0.10em',color:C.accent,background:C.accentS,border:`1px solid rgba(79,156,249,0.18)`,padding:'2px 7px',borderRadius:4,whiteSpace:'nowrap' }}>{p.label}</span>
              <span style={{ fontFamily:'var(--sans)',fontSize:13,color:C.text2,whiteSpace:'nowrap',fontWeight:300 }}>{p.text}</span>
              {i < PRIORITIES.length-1 && <div style={{ width:1,height:16,background:C.line,marginLeft:4,flexShrink:0 }}/>}
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div>
      <div style={{ maxWidth:1340,margin:'0 auto',padding:'0 48px 80px' }}>
        <div style={{ display:'flex',borderBottom:`1px solid ${C.line}`,marginBottom:40 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'16px 26px',cursor:'pointer',border:'none',background:'none',fontFamily:'var(--sans)',fontSize:13.5,fontWeight:500,color:tab===t.id?C.text:C.text3,borderBottom:tab===t.id?`2px solid ${C.accent}`:'2px solid transparent',transition:'all 0.15s',display:'flex',alignItems:'center',gap:8 }}>
              {t.label}
              <span style={{ padding:'1px 7px',borderRadius:10,fontSize:10,fontFamily:'var(--mono)',background:tab===t.id?C.accentS:C.surf1,color:tab===t.id?C.accent:C.text3,border:`1px solid ${tab===t.id?'rgba(79,156,249,0.28)':C.line}` }}>{t.count}</span>
            </button>
          ))}
        </div>
        {tab==='workstreams' && <WorkstreamsTab/>}
        {tab==='team'        && <TeamTab/>}
        {tab==='cadence'     && <CadenceTab/>}
        {tab==='resources'   && <ResourcesTab/>}
      </div>
      </div>

    </div>
  );
}
