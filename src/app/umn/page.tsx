'use client';
import { useState } from 'react';
import Link from 'next/link';

type MilestoneStatus = 'complete' | 'in-progress' | 'planned';

const STATUS_STYLE: Record<MilestoneStatus, { bg: string; color: string; label: string }> = {
  'complete':    { bg: 'rgba(58,155,92,0.12)',  color: '#2e7d4f', label: 'Complete' },
  'in-progress': { bg: 'rgba(184,131,10,0.12)', color: '#8a6200', label: 'In Progress' },
  'planned':     { bg: 'rgba(120,110,100,0.10)',color: '#6b6256', label: 'Planned' },
};

const SYSENG_MILESTONES: { phase: string; milestone: string; detail: string; status: MilestoneStatus; date: string }[] = [
  { phase:'Concept',       milestone:'Clinical need definition',        detail:'Identified fall detection and passive monitoring as primary unmet need in skilled nursing facilities. Defined target population: residents 65+ in long-term care.',                                          status:'complete',    date:'Q3 2024' },
  { phase:'Concept',       milestone:'Technology selection',            detail:'Selected TI IWR6843AOP 60 GHz FMCW radar as primary sensing modality. Radar chosen over camera for privacy compliance and through-fabric detection capability.',                                           status:'complete',    date:'Q3 2024' },
  { phase:'Architecture',  milestone:'System architecture v1',          detail:'Defined seven-service AWS cloud backend: Kinesis ingest → Lambda classifier → DynamoDB alerts → S3 Parquet archive → Bedrock/Ella AI narrative → API Gateway → Nurse dashboard.',                       status:'complete',    date:'Q4 2024' },
  { phase:'Architecture',  milestone:'SaMD classification',             detail:'Classified fall-detection algorithm as Software as a Medical Device under FDA guidance. Determined Class II (moderate risk) under 21 CFR 882.5050. IEC 62304 Software Safety Class B applied.',           status:'complete',    date:'Q4 2024' },
  { phase:'Architecture',  milestone:'QMS framework established',       detail:'Initiated 21 CFR Part 820 Quality System Regulation compliance mapping. 15 subparts documented; gap analysis tracker built and maintained at /gapanalysis.',                                            status:'complete',    date:'Q4 2024' },
  { phase:'Hardware',      milestone:'EVT-0.1 bill of materials',       detail:'57-component BOM completed for Engineering Validation Test unit. Priced from DigiKey and Mouser. Includes IWR6843AOP module, power regulation, Ethernet, and enclosure.',                               status:'complete',    date:'Q1 2025' },
  { phase:'Hardware',      milestone:'EVT-0.1 assembly',                detail:'First physical prototype assembled and powered. Radar sensor functional; point-cloud data streaming over USB confirmed.',                                                                                  status:'complete',    date:'Q1 2025' },
  { phase:'Software',      milestone:'Fall detection algorithm v0.1',   detail:'Initial classification model trained on radar point-cloud signatures. Distinguishes fall events from ambulation, sit-to-stand, and stationary postures. F1 score 0.81 on held-out lab data.',           status:'complete',    date:'Q1 2025' },
  { phase:'Software',      milestone:'Ella AI narrative engine',        detail:'AWS Bedrock integration generating plain-language daily summaries per resident. Summarizes movement patterns, alert history, and flag trends for nursing staff review.',                                  status:'complete',    date:'Q2 2025' },
  { phase:'Software',      milestone:'Nurse dashboard v0.1',            detail:'Web-based real-time dashboard deployed on Vercel. Displays resident table, fall alerts, Ella AI summaries, and room-level activity. Accessible at /dashboard.',                                          status:'complete',    date:'Q2 2025' },
  { phase:'Validation',    milestone:'Bench-level algorithm validation', detail:'Controlled fall simulations using instrumented mannequin. Algorithm tested across 6 room configurations and 3 sensor mounting heights. Metrics logged to S3 Parquet cold path.',                        status:'in-progress', date:'Q2–Q3 2025' },
  { phase:'Validation',    milestone:'Pilot site selection',            detail:'Identifying 1–2 skilled nursing facilities in Minnesota for observational pilot. Facility IRB reliance agreements and data use agreements in preparation.',                                               status:'in-progress', date:'Q3 2025' },
  { phase:'Regulatory',    milestone:'Pre-submission (Q-Sub) to FDA',   detail:'Preparing Pre-Sub package to align with FDA on 510(k) pathway, predicate device selection, and clinical evidence requirements prior to formal submission.',                                               status:'planned',     date:'Q4 2025' },
  { phase:'Regulatory',    milestone:'510(k) substantial equivalence',  detail:'Formal 510(k) submission targeting predicate under 21 CFR 882. Requires bench performance data, software documentation per IEC 62304, and risk file per ISO 14971.',                                    status:'planned',     date:'2026' },
  { phase:'Clinical',      milestone:'Observational pilot study',       detail:'Non-interventional study monitoring fall events in consented residents at partner SNF. Primary endpoint: sensitivity and specificity of automated detection vs. staff-reported events.',                  status:'planned',     date:'Q1 2026' },
];

const IRB_MILESTONES: { step: string; detail: string; status: MilestoneStatus; date: string }[] = [
  { step:'Protocol development',         detail:'Research protocol drafted defining study objectives, population (residents 65+ in SNF), data collection procedures (radar point-cloud, de-identified), and analysis plan. Minimal risk determination documented.',           status:'complete',    date:'Q1 2025' },
  { step:'HIPAA & privacy analysis',     detail:'Legal and privacy review completed. Radar point-cloud data determined not to constitute PHI under HIPAA. No biometric identifiers captured. Data retention and de-identification procedures specified.',                   status:'complete',    date:'Q1 2025' },
  { step:'Consent form development',     detail:'Informed consent document drafted for resident and legally authorized representative (LAR). Covers study purpose, data use, voluntary participation, and right to withdraw. Plain-language grade 8 reading level.',        status:'complete',    date:'Q2 2025' },
  { step:'IRB application preparation',  detail:'Application materials prepared for University of Minnesota IRB: protocol, consent forms, data security plan, conflict of interest disclosures, and investigator credentials. Targeting expedited review category.',        status:'in-progress', date:'Q2–Q3 2025' },
  { step:'IRB submission',               detail:'Full application package to be submitted to UMN IRB. Anticipate expedited review given minimal risk determination and no direct patient intervention. Target 30-day review cycle.',                                         status:'planned',     date:'Q3 2025' },
  { step:'IRB approval',                 detail:'IRB approval anticipated for observational, minimal-risk protocol. Approval triggers study initiation authorization and facility onboarding.',                                                                             status:'planned',     date:'Q3–Q4 2025' },
  { step:'Facility IRB reliance',        detail:'Partner SNF institution to cede IRB oversight to UMN via standard reliance agreement. Data use agreement (DUA) to be executed in parallel.',                                                                              status:'planned',     date:'Q4 2025' },
  { step:'Study initiation',             detail:'Site activation following IRB approval and executed agreements. Study coordinator training, sensor installation, and first participant enrollment.',                                                                        status:'planned',     date:'Q1 2026' },
  { step:'Ongoing compliance reporting', detail:'Annual continuing review submissions to IRB. Protocol amendments filed as needed. Adverse event and unanticipated problem reporting procedures in place per 21 CFR 56.',                                                  status:'planned',     date:'2026+' },
];

const OVERVIEW_STATS = [
  { value:'EVT-0.1', label:'Hardware revision' },
  { value:'57',      label:'BOM components' },
  { value:'Class B', label:'IEC 62304 SW class' },
  { value:'Class II',label:'FDA device class' },
  { value:'15',      label:'21 CFR 820 subparts' },
  { value:'Q3 2025', label:'Target IRB submission' },
];

type Tab = 'overview' | 'syseng' | 'irb';

function Badge({ status }: { status: MilestoneStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:500, background:s.bg, color:s.color, fontFamily:'var(--mono)', letterSpacing:'0.03em', whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
}

function ProgressBar({ milestones }: { milestones: { status: MilestoneStatus }[] }) {
  const complete = milestones.filter(m=>m.status==='complete').length;
  const inprog   = milestones.filter(m=>m.status==='in-progress').length;
  const total    = milestones.length;
  const pctC = (complete/total)*100;
  const pctI = (inprog/total)*100;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ height:4, background:'var(--line)', borderRadius:2, overflow:'hidden', display:'flex' }}>
        <div style={{ width:`${pctC}%`, background:'#2e7d4f', transition:'width 0.4s' }}/>
        <div style={{ width:`${pctI}%`, background:'#8a6200', transition:'width 0.4s' }}/>
      </div>
      <div style={{ display:'flex', gap:16, fontSize:11, fontFamily:'var(--mono)', color:'var(--text-3)' }}>
        <span><span style={{ color:'#2e7d4f' }}>{complete}</span> complete</span>
        <span><span style={{ color:'#8a6200' }}>{inprog}</span> in progress</span>
        <span>{total - complete - inprog} planned</span>
        <span style={{ marginLeft:'auto' }}>{Math.round(pctC)}% done</span>
      </div>
    </div>
  );
}

export default function UMNPage() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="app">
      <nav className="sidebar">
        <Link href="/" style={{ textDecoration:'none', color:'inherit' }}>
          <div className="brand">
            <span className="brand-name">Ambient <em>Intelligence</em></span>
          </div>
        </Link>

        <div className="nav-section">
          <p className="nav-label">OTC Report</p>
          {(['overview','syseng','irb'] as Tab[]).map(t => (
            <button key={t} className={`nav-item${tab===t?' active':''}`} onClick={()=>setTab(t)}>
              {t==='overview' ? 'Overview' : t==='syseng' ? 'System Engineering' : 'IRB Process'}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <p className="nav-label">Pages</p>
          {([
            ['/dashboard','Nurse Dashboard'],
            ['/bom','Bill of Materials'],
            ['/gapanalysis','Gap Analysis'],
            ['/samd','SaMD'],
            ['/cloud','Cloud'],
          ] as [string,string][]).map(([href,label])=>(
            <Link key={href} href={href} className="nav-item" style={{ textDecoration:'none', color:'inherit' }}>{label}</Link>
          ))}
        </div>

        <div style={{ marginTop:'auto' }}>
          <p className="nav-label">Progress</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'0 8px' }}>
            {[
              { label:'Sys Eng',  milestones: SYSENG_MILESTONES },
              { label:'IRB',      milestones: IRB_MILESTONES },
            ].map(({ label, milestones }) => {
              const c = milestones.filter(m=>m.status==='complete').length;
              return (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text-3)' }}>{label}</span>
                  <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'#2e7d4f' }}>{c}/{milestones.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">UMN Office of Technology Commercialization</h1>
            <p style={{ margin:0, fontSize:12, color:'var(--text-3)', fontFamily:'var(--mono)' }}>
              Research Progress Report · Ambient Intelligence Fall Detection System
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>Last updated</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text)', background:'var(--surface-1)', border:'1px solid var(--line)', padding:'3px 10px', borderRadius:6 }}>Q2 2025</span>
          </div>
        </header>

        <div style={{ padding:'32px 40px', display:'flex', flexDirection:'column', gap:32 }}>

          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <>
              {/* Stat strip */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 }}>
                {OVERVIEW_STATS.map(s=>(
                  <div key={s.label} style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'12px 16px' }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:500, color:'var(--text)', marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:10.5, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'28px 32px', display:'flex', flexDirection:'column', gap:20 }}>
                <h2 style={{ margin:0, fontSize:16, fontWeight:600, color:'var(--text)' }}>Project Summary</h2>
                <p style={{ margin:0, fontSize:13.5, lineHeight:1.75, color:'var(--text-2)' }}>
                  Ambient Intelligence is developing a passive fall-detection and resident monitoring system for skilled nursing facilities (SNFs) using 60 GHz FMCW radar sensors (TI IWR6843AOP). The system captures radar point-cloud data, classifies activity and fall events using a custom machine learning algorithm, and surfaces real-time alerts and AI-generated narrative summaries to nursing staff via a web dashboard.
                </p>
                <p style={{ margin:0, fontSize:13.5, lineHeight:1.75, color:'var(--text-2)' }}>
                  The fall-detection algorithm is classified as Software as a Medical Device (SaMD) under FDA guidance, targeting 510(k) clearance under 21 CFR 882. The development process follows IEC 62304 software lifecycle requirements and ISO 14971 risk management, with quality system documentation structured against 21 CFR Part 820.
                </p>
                <p style={{ margin:0, fontSize:13.5, lineHeight:1.75, color:'var(--text-2)' }}>
                  The current phase focuses on bench validation of the detection algorithm, IRB protocol preparation for an observational pilot study at a partner SNF, and pre-submission engagement with FDA. Technology commercialization strategy is being developed in parallel with UMN OTC.
                </p>
              </div>

              {/* Progress summaries */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--text)' }}>System Engineering</h3>
                    <button className="nav-item" style={{ fontSize:11, padding:'2px 10px' }} onClick={()=>setTab('syseng')}>View →</button>
                  </div>
                  <ProgressBar milestones={SYSENG_MILESTONES}/>
                  <p style={{ margin:0, fontSize:12.5, color:'var(--text-3)', lineHeight:1.6 }}>
                    Hardware EVT-0.1 assembled. Algorithm v0.1 trained. Cloud pipeline operational. Bench validation in progress.
                  </p>
                </div>
                <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <h3 style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--text)' }}>IRB Approval Process</h3>
                    <button className="nav-item" style={{ fontSize:11, padding:'2px 10px' }} onClick={()=>setTab('irb')}>View →</button>
                  </div>
                  <ProgressBar milestones={IRB_MILESTONES}/>
                  <p style={{ margin:0, fontSize:12.5, color:'var(--text-3)', lineHeight:1.6 }}>
                    Protocol and privacy analysis complete. Application preparation in progress. IRB submission targeted Q3 2025.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── System Engineering Tab ── */}
          {tab === 'syseng' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--text)' }}>System Engineering Milestones</h2>
                <ProgressBar milestones={SYSENG_MILESTONES}/>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid var(--line)', borderRadius:8, overflow:'hidden' }}>
                {/* Header */}
                <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 100px 90px', gap:16, padding:'10px 20px', background:'var(--surface-2)', borderBottom:'1px solid var(--line)' }}>
                  {['Phase','Milestone','Status','Date'].map(h=>(
                    <span key={h} style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', fontWeight:500 }}>{h}</span>
                  ))}
                </div>
                {SYSENG_MILESTONES.map((m,i)=>(
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 100px 90px', gap:16, padding:'16px 20px', borderBottom: i<SYSENG_MILESTONES.length-1 ? '1px solid var(--line)' : 'none', background: m.status==='in-progress' ? 'rgba(184,131,10,0.04)' : 'transparent', alignItems:'start' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:10.5, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em', paddingTop:2 }}>{m.phase}</span>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{m.milestone}</span>
                      <span style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.6 }}>{m.detail}</span>
                    </div>
                    <div style={{ paddingTop:2 }}><Badge status={m.status}/></div>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:'var(--text-3)', paddingTop:3 }}>{m.date}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── IRB Tab ── */}
          {tab === 'irb' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <h2 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--text)' }}>IRB Approval Process</h2>
                <ProgressBar milestones={IRB_MILESTONES}/>
              </div>

              <div style={{ background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:8, padding:'20px 24px', fontSize:13, color:'var(--text-2)', lineHeight:1.7 }}>
                The study protocol is designed as a <strong style={{ color:'var(--text)' }}>minimal risk, observational</strong> investigation. No clinical intervention is performed. Radar point-cloud data does not constitute PHI under HIPAA. The study targets expedited IRB review under 45 CFR 46.110 category (b)(2). UMN will serve as the single IRB of record for all participating sites.
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid var(--line)', borderRadius:8, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 90px', gap:16, padding:'10px 20px', background:'var(--surface-2)', borderBottom:'1px solid var(--line)' }}>
                  {['Step','Status','Target'].map(h=>(
                    <span key={h} style={{ fontFamily:'var(--mono)', fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-3)', fontWeight:500 }}>{h}</span>
                  ))}
                </div>
                {IRB_MILESTONES.map((m,i)=>(
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 100px 90px', gap:16, padding:'16px 20px', borderBottom: i<IRB_MILESTONES.length-1 ? '1px solid var(--line)' : 'none', background: m.status==='in-progress' ? 'rgba(184,131,10,0.04)' : 'transparent', alignItems:'start' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{m.step}</span>
                      <span style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.6 }}>{m.detail}</span>
                    </div>
                    <div style={{ paddingTop:2 }}><Badge status={m.status}/></div>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:'var(--text-3)', paddingTop:3 }}>{m.date}</span>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
