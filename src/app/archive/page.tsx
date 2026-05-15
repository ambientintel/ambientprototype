'use client';
import React from 'react';
import Link from 'next/link';

type PageEntry = { href: string; label: string; tag: string; tagColor: { bg: string; color: string }; description: string; meta: string };

const GROUPS: { label: string; pages: PageEntry[] }[] = [
  {
    label: 'Investor & Partnerships',
    pages: [
      { href: '/invest',       label: 'Investor Overview',             tag: 'Investor',     tagColor: { bg: 'rgba(79,156,249,0.18)', color: '#4F9CF9' },   description: 'Full investor pitch page — product vision, grant funding, PCT patent, and gener8tor accelerator backing.',            meta: 'ambientinvest · pitch · capital' },
      { href: '/carlson',      label: 'Carlson Pitch',                 tag: 'Investor',     tagColor: { bg: 'rgba(122,0,25,0.18)',   color: '#C0394B' },   description: 'UMN Carlson School Founder\'s Day 2026 pitch — problem framing, solution, TAM/SAM, technology, and flagship product with UMN maroon/gold editorial layout.',  meta: 'ambientcarlson · UMN · Carlson · pitch' },
      { href: '/mn',           label: 'Minnesota Partnerships',        tag: 'Partnership',  tagColor: { bg: 'rgba(122,0,25,0.18)',   color: '#C0394B' },   description: 'UMN, Mayo Clinic, and State of MN partnership overview — $248K grant, angel capital, ODT, and tech partners.',       meta: 'ambientmn · UMN · Mayo · gener8tor' },
      { href: '/accelerate',   label: 'Accelerate',                    tag: 'Accelerator',  tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },   description: 'gener8tor accelerator program showcase — portfolio positioning, milestones, and program details.',                   meta: 'ambientaccelerate · gener8tor' },
      { href: '/umn',          label: 'UMN Partnership Milestones',    tag: 'Research',     tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },   description: 'IRB approvals, sensor calibration, pilot deployment, and data-sharing milestones for the UMN collaboration.',       meta: 'ambientresearch · UMN · IRB' },
      { href: '/grants',       label: 'NIH Grant Mechanisms',          tag: 'Grants',       tagColor: { bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' },   description: 'Reference guide for NIH funding mechanisms — R01, R21, R03, K99/R00, U01, P01, T32 — with budget ranges and institute coverage.',  meta: 'ambientgrants · NIH · R01 · funding' },
    ],
  },
  {
    label: 'Product & Clinical',
    pages: [
      { href: '/digitalhealth',    label: 'Digital Health Studio',    tag: 'Product',     tagColor: { bg: 'rgba(63,204,145,0.18)', color: '#3DCC91' },   description: 'SaMD and digital therapeutics workspace — regulatory strategy, clinical evidence, and product lifecycle management.', meta: 'ambientdh · SaMD · DTx' },
      { href: '/samd',             label: 'SaMD / Regulatory',        tag: 'Regulatory',  tagColor: { bg: 'rgba(255,102,128,0.18)', color: '#FF6680' },  description: 'Software as a Medical Device regulatory framework — FDA pathway, risk classification, and predicate analysis.',       meta: 'ambientregulatory · FDA · SaMD' },
      { href: '/biodesign',        label: 'Biodesign Studio',         tag: 'Clinical',    tagColor: { bg: 'rgba(0,180,216,0.18)',  color: '#00B4D8' },   description: 'Stanford Biodesign process tool — needs identification, ideation, feasibility, and implementation phases.',           meta: 'ambientbiodesign · Stanford · clinical' },
      { href: '/clinicalresearch', label: 'Clinical Research',        tag: 'Research',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' },  description: 'IRB study design, protocol development, and clinical evidence generation for ambient sensing validation.',           meta: 'ambientclinical · IRB · evidence' },
      { href: '/methodology',      label: 'Algorithm Methodology',    tag: 'Research',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' },  description: 'Ambient Intelligence naming taxonomy — eight composite indices (Activity, Sleep, Gait, Sedentary, Recovery, Circadian, Metabolic, Risk) with mathematical definitions and raw field naming conventions.',  meta: 'ambientmethodology · indices · taxonomy · algorithm' },
      { href: '/agenticstudio',    label: 'Agentic Studio',           tag: 'AI',          tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },   description: 'Electric Forge agentic AI studio — orchestrated multi-agent workflows and automation tooling.',                      meta: 'ambientagentic · AI · agents' },
    ],
  },
  {
    label: 'Operations & Internal',
    pages: [
      { href: '/engineering',      label: 'Engineering Hub',           tag: 'Eng',      tagColor: { bg: 'rgba(45,114,210,0.18)',  color: '#669EFF' },   description: 'Sprint board with stories, tasks, and bugs across sensor fusion, ML pipeline, and cloud services.',                meta: 'ambienteng · sprint tracker' },
      { href: '/eng',              label: 'Engineering Build Tracker', tag: 'Eng',      tagColor: { bg: 'rgba(45,114,210,0.18)',  color: '#669EFF' },   description: 'Cross-discipline build dashboard — Firmware (AM62x Linux), EE Hardware (IWR6843AOP), Mobile App (Expo), and Cloud Engineering phase progress.',  meta: 'ambienteng · build · phases' },
      { href: '/cloud',            label: 'Cloud Infrastructure',      tag: 'Infra',    tagColor: { bg: 'rgba(0,180,216,0.18)',  color: '#00B4D8' },   description: 'AWS service map — Ella (Claude on Bedrock), Nurse API (FastAPI + Cognito), Telemetry pipeline, Terraform.',         meta: 'ambientcloud · AWS · Terraform' },
      { href: '/cloudengineering', label: 'Cloud Engineering Runbook', tag: 'Infra',    tagColor: { bg: 'rgba(0,180,216,0.18)',  color: '#00B4D8' },   description: 'Step-by-step cloud build guide — architecture review, IaC scaffold, VPC/IAM/KMS, five AWS data paths, and HIPAA coded-data validation.',  meta: 'ambientcloud · IaC · HIPAA · AWS' },
      { href: '/cybersecurity',    label: 'Cybersecurity Runbook',     tag: 'Security', tagColor: { bg: 'rgba(255,102,128,0.18)', color: '#FF6680' },   description: 'AWS security pipeline runbook — Security Hub CSPM findings → EventBridge filter → Lambda formatter → Google Chat alerts, with IAM zero-trust and Terraform GitOps.',  meta: 'ambientcyber · Security Hub · IAM · Terraform' },
      { href: '/webapp',           label: 'Web App Runbook',           tag: 'Web',      tagColor: { bg: 'rgba(45,114,210,0.18)',  color: '#669EFF' },   description: 'ambientweb monorepo setup guide — Next.js Turbopack, WorkOS auth, push notifications, de-identification pipeline, and Vercel deploy.',  meta: 'ambientweb · Next.js · WorkOS · Vercel' },
      { href: '/mobileapp',        label: 'Mobile App Runbook',        tag: 'Mobile',   tagColor: { bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },   description: 'ambientmobile Expo SDK 54 setup — Cognito auth, SNS push notifications, alert list and detail screens, EAS build for TestFlight.',  meta: 'ambientmobile · Expo · Cognito · EAS' },
      { href: '/organization',     label: 'Organization',              tag: 'Org',      tagColor: { bg: 'rgba(124,110,173,0.22)', color: '#9C85D4' },  description: 'Workstreams, core team, open roles, cadence, and strategic resources — internal org overview in deep navy.',                         meta: 'ambientorg · team · workstreams' },
      { href: '/bi',               label: 'Business Intelligence',     tag: 'BI',       tagColor: { bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },   description: 'Facility-level analytics — payer mix, fall rate vs. benchmark, staff ratio, and KPIs for the MOH pilot.',           meta: 'ambientbi · facility metrics' },
      { href: '/humancapitalmgmt', label: 'Human Capital Management',  tag: 'HCM',      tagColor: { bg: 'rgba(124,110,173,0.22)', color: '#9C85D4' },  description: 'Org chart, team directory, role definitions, and headcount analytics across all departments.',                     meta: 'ambienthcm · org · directory' },
      { href: '/datascience',      label: 'Data Science Dashboard',    tag: 'ML',       tagColor: { bg: 'rgba(45,114,210,0.18)',  color: '#669EFF' },   description: 'Fall alert distribution, resident risk scores, activity classification metrics, and radar pipeline diagnostics.',   meta: 'ambientml · radar · classification' },
      { href: '/bom',              label: 'Bill of Materials',         tag: 'Hardware', tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },   description: 'Hardware BOM tracker — sensor components, unit cost, supplier, and revision history for the IoT device stack.',      meta: 'ambienthw · BOM · components' },
      { href: '/control',          label: 'Control Center',            tag: 'Nav',      tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },   description: 'Internal navigation hub — grouped links to all prototype modules across every domain.',                            meta: 'ambientprototype · index' },
      { href: '/contractlab',      label: 'Contract Lab',              tag: 'Legal',    tagColor: { bg: 'rgba(76,144,240,0.18)', color: '#4C90F0' },   description: 'Document management for NDAs, term sheets, and pilot agreements — versioned with status tracking.',                 meta: 'ambientlegal · contracts · NDA' },
      { href: '/gapanalysis',      label: 'Gap Analysis',              tag: 'Strategy', tagColor: { bg: 'rgba(63,204,145,0.18)', color: '#3DCC91' },   description: 'Competitive and capability gap analysis across regulatory, clinical, and technology dimensions.',                   meta: 'ambientstrategy · gap · competitive' },
    ],
  },
  {
    label: 'Hardware & Firmware',
    pages: [
      { href: '/firmware',    label: 'Firmware Development',   tag: 'Firmware',   tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },  description: 'AM62x Linux build chain runbook — TI Processor SDK 11, Yocto, U-Boot, custom DTB for IWR6843AOP integration. Build → bring-up → OTA.',  meta: 'ambientfirmware · AM62x · Yocto · IWR6843AOP' },
      { href: '/ee',          label: 'EE Hardware Validation', tag: 'EE',         tagColor: { bg: 'rgba(245,158,11,0.18)', color: '#F59E0B' },  description: 'IWR6843AOP + OSD62x-PM PCB validation runbook — schematic, Gerbers, fab order, and EVT→DVT→PVT→MP bring-up phases with 21 CFR 820 DHF.',  meta: 'ambientee · IWR6843AOP · OSD62x · EVT' },
      { href: '/mechanical',  label: 'Mechanical Engineering', tag: 'Mechanical', tagColor: { bg: 'rgba(251,146,60,0.18)', color: '#FB923C' },  description: 'System definition and PCB design runbook — power budget, interface matrix, mechanical constraints, and Altium Designer PCB layout workflow.',  meta: 'ambientmechanical · Altium · PCB · enclosure' },
    ],
  },
  {
    label: 'Labs & Prototypes',
    pages: [
      { href: '/algorithmlab',  label: 'Algorithm Lab',     tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Live activity classifier visualization — radar epoch plots, color-coded posture states in real time.',         meta: 'ambientalgo · IWR6843AOP · radar' },
      { href: '/backgroundlab', label: 'Background Lab',    tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Animated particle background playground — tune count, speed, radius, and color in real time at 60fps.',        meta: 'ambientdesign · canvas · particles' },
      { href: '/mobilelab',     label: 'Mobile Lab',        tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Mobile nurse dashboard prototype — alert feed, active room count, and resolved events for phone viewports.',   meta: 'ambientmobile · PWA · nurse' },
      { href: '/pitchdecklab',  label: 'Pitch Deck Lab',    tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Slide-by-slide pitch deck builder with editable copy per frame and full-screen presentation mode.',             meta: 'ambientpitch · deck · slides' },
      { href: '/moneymatrix',   label: 'Money Matrix',      tag: 'Lab',    tagColor: { bg: 'rgba(63,204,145,0.18)', color: '#3DCC91' },  description: 'Financial modeling tool — runway, burn rate, and revenue scenario planning for seed-stage operations.',         meta: 'ambientfinance · model · runway' },
      { href: '/mobile',        label: 'Mobile PWA Setup',  tag: 'Mobile', tagColor: { bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },  description: 'Step-by-step iOS and Android install guide for the Ella Memory progressive web app.',                          meta: 'ambientmobile · PWA · iOS · Android' },
    ],
  },
  {
    label: 'Marketing & Design',
    pages: [
      { href: '/home',       label: 'Home',            tag: 'Home',      tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },  description: 'Primary landing page — nurse dashboard hero, featured modules, and quick-access links to all major prototype sections.',  meta: 'ambienthome · landing · dashboard' },
      { href: '/landing1',   label: 'Landing Page v1', tag: 'Marketing', tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },  description: 'First-generation marketing landing page — hero copy, feature highlights, and prototype page index.',   meta: 'ambientmarketing · landing · v1' },
      { href: '/landing3',   label: 'Landing Page v3', tag: 'Marketing', tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },  description: 'Third-generation marketing landing page — refined messaging and updated product positioning.',          meta: 'ambientmarketing · landing · v3' },
      { href: '/pureburger', label: 'Pure Burger',     tag: 'Demo',      tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },  description: 'Demo restaurant app prototype — menu, ordering, and branding for a hypothetical consumer product.',      meta: 'ambientdemo · consumer · restaurant' },
      { href: '/brand',      label: 'Brand',           tag: 'Design',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' }, description: 'Brand identity system — typography, color palette, logo usage, and visual design standards.',           meta: 'ambientdesign · brand · identity' },
      { href: '/colors',     label: 'Color Palette',   tag: 'Design',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' }, description: 'Design token color palette — all semantic colors, surface levels, and accent values across themes.',    meta: 'ambientdesign · colors · tokens' },
    ],
  },
];

const TOTAL = GROUPS.reduce((s, g) => s + g.pages.length, 0);

const C = {
  bg:    '#0B1628',
  line:  'rgba(79,156,249,0.10)',
  text:  '#E8F0FF',
  t2:    'rgba(232,240,255,0.58)',
  t3:    'rgba(232,240,255,0.28)',
};

function OfferingRow({ page }: { page: PageEntry }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link href={page.href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 24,
          padding: '36px 0 36px 0',
          borderBottom: `1px solid ${C.line}`,
          borderLeft: `2px solid ${hovered ? page.tagColor.color : 'transparent'}`,
          paddingLeft: hovered ? 18 : 0,
          transition: 'border-color 0.15s, padding-left 0.15s',
          cursor: 'pointer',
        }}
      >
        {/* Arrow */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 16, color: C.t3,
          flexShrink: 0, marginTop: 4, letterSpacing: 0,
          transition: 'color 0.15s',
          ...(hovered ? { color: page.tagColor.color } : {}),
        }}>↳</span>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, letterSpacing: '-0.02em', color: C.text, marginBottom: 10, lineHeight: 1.15 }}>
            {page.label}
          </div>
          <div style={{ fontSize: 16, color: C.t2, lineHeight: 1.7, maxWidth: 680 }}>
            {page.description}
          </div>
        </div>

        {/* Right meta */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 3 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
            padding: '3px 9px', borderRadius: 99,
            background: page.tagColor.bg, color: page.tagColor.color,
          }}>{page.tag}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.t3 }}>
            {page.href}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ArchivePage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '88px 64px 120px' }}>

        {/* Top nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 80 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.t3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Ambient Intelligence
          </span>
          <Link href="/home" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.t3, textDecoration: 'none', letterSpacing: '0.04em' }}>
            ← Home
          </Link>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 96 }}>
          <h1 style={{
            fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 80,
            letterSpacing: '-0.04em', margin: '0 0 32px', lineHeight: 0.95,
            color: C.text,
          }}>
            All Pages
          </h1>
          <p style={{ fontSize: 19, color: C.t2, lineHeight: 1.7, maxWidth: 660, margin: 0 }}>
            Prototype modules spanning regulatory compliance, clinical research, infrastructure, hardware engineering, and AI tooling — built for the Ambient Intelligence platform.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 28 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.t3 }}>
              {TOTAL} routes
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.t3 }}>
              {GROUPS.length} sections
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.t3 }}>
              ambientprototype.vercel.app
            </span>
          </div>
        </div>

        {/* Offerings */}
        {GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 80 }}>

            {/* Section header */}
            <div style={{
              borderTop: `1px solid ${gi === 0 ? 'rgba(79,156,249,0.22)' : C.line}`,
              paddingTop: 36, marginBottom: 8,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
            }}>
              <h2 style={{
                fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 40,
                letterSpacing: '-0.025em', color: C.text,
                margin: 0, lineHeight: 1.1,
              }}>
                {group.label}
              </h2>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.t3, paddingBottom: 6, flexShrink: 0 }}>
                {group.pages.length} pages
              </span>
            </div>

            {/* Rows */}
            <div>
              {group.pages.map(page => (
                <OfferingRow key={page.href} page={page} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.line}`, paddingTop: 24, marginTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.t3 }}>
            {TOTAL} routes · ambientprototype.vercel.app
          </span>
          <Link href="/control" style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.t3, textDecoration: 'none' }}>
            Control Center →
          </Link>
        </div>

      </div>
    </div>
  );
}
