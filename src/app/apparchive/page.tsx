'use client';
import Link from 'next/link';

const PAGES: {
  href: string;
  label: string;
  tag: string;
  tagColor: { bg: string; color: string };
  description: string;
  meta: string;
}[] = [
  {
    href: '/engineering',
    label: 'Engineering Hub',
    tag: 'Eng',
    tagColor: { bg: 'rgba(45,114,210,0.18)', color: '#669EFF' },
    description: 'Sprint board with stories, tasks, and bugs across sensor fusion, ML pipeline, and cloud services. Assignee tracking, labels, and column-based workflow.',
    meta: 'ambienteng · sprint tracker',
  },
  {
    href: '/cloud',
    label: 'Cloud Infrastructure',
    tag: 'Infra',
    tagColor: { bg: 'rgba(0,180,216,0.18)', color: '#00B4D8' },
    description: 'AWS service map — Ella (Claude on Bedrock), Nurse API (FastAPI + Cognito), Telemetry pipeline (SNS → Firehose → S3), and Terraform coverage per module.',
    meta: 'ambientcloud · AWS · Terraform',
  },
  {
    href: '/bi',
    label: 'Business Intelligence',
    tag: 'BI',
    tagColor: { bg: 'rgba(35,133,81,0.22)', color: '#3DCC91' },
    description: 'Facility-level analytics — payer mix breakdown, fall rate vs. benchmark, staff ratio, and key performance indicators for the MOH pilot.',
    meta: 'ambientbi · facility metrics',
  },
  {
    href: '/humancapitalmgmt',
    label: 'Human Capital Management',
    tag: 'HCM',
    tagColor: { bg: 'rgba(124,110,173,0.22)', color: '#9C85D4' },
    description: 'Org chart, team directory, role definitions, and headcount analytics by department and level across Engineering, Clinical, Regulatory, and Operations.',
    meta: 'ambienthcm · org · directory',
  },
  {
    href: '/datascience',
    label: 'Data Science Dashboard',
    tag: 'ML',
    tagColor: { bg: 'rgba(45,114,210,0.18)', color: '#669EFF' },
    description: 'Fall alert distribution, resident risk scores, activity classification metrics, and model performance diagnostics for the IWR6843AOP radar pipeline.',
    meta: 'ambientml · radar · classification',
  },
  {
    href: '/algorithmlab',
    label: 'Algorithm Lab',
    tag: 'Lab',
    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
    description: 'Live activity classifier visualization — plots mean height and speed per radar epoch, color-codes sitting, standing, walking, and fall states in real time.',
    meta: 'ambientalgo · IWR6843AOP · radar',
  },
  {
    href: '/umn',
    label: 'UMN Partnership Milestones',
    tag: 'Research',
    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
    description: 'IRB approvals, sensor calibration, pilot deployment, and data-sharing milestone tracker for the University of Minnesota fall-detection research collaboration.',
    meta: 'ambientresearch · UMN · IRB',
  },
  {
    href: '/control',
    label: 'Control Center',
    tag: 'Nav',
    tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },
    description: 'Internal navigation hub — grouped links to all prototype modules across Regulatory, Infrastructure, Hardware, Clinical, and Design.',
    meta: 'ambientprototype · index',
  },
  {
    href: '/contractlab',
    label: 'Contract Lab',
    tag: 'Legal',
    tagColor: { bg: 'rgba(76,144,240,0.18)', color: '#4C90F0' },
    description: 'Document management prototype for NDAs, term sheets, and pilot agreements — categorized, versioned, with status tracking and signature workflow.',
    meta: 'ambientlegal · contracts · NDA',
  },
  {
    href: '/mobilelab',
    label: 'Mobile Lab',
    tag: 'Lab',
    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
    description: 'Mobile nurse dashboard prototype — alert feed, active room count, and resolved events in a compact card layout optimized for phone-sized viewports.',
    meta: 'ambientmobile · PWA · nurse',
  },
  {
    href: '/pitchdecklab',
    label: 'Pitch Deck Lab',
    tag: 'Lab',
    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
    description: 'Slide-by-slide pitch deck builder with editable title, subtitle, and body copy per frame. Supports full-screen presentation mode.',
    meta: 'ambientpitch · deck · slides',
  },
  {
    href: '/backgroundlab',
    label: 'Background Lab',
    tag: 'Lab',
    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },
    description: 'Animated particle background playground — tune count, speed, radius, connection distance, and color in real time. Canvas-rendered, 60fps.',
    meta: 'ambientdesign · canvas · particles',
  },
  {
    href: '/mobile',
    label: 'Mobile PWA Setup',
    tag: 'Mobile',
    tagColor: { bg: 'rgba(35,133,81,0.22)', color: '#3DCC91' },
    description: 'Step-by-step iOS and Android install guide for the Ella Memory progressive web app — add-to-home-screen flow with platform-specific screenshots.',
    meta: 'ambientmobile · PWA · iOS · Android',
  },
  {
    href: '/landing1',
    label: 'Landing Page v1',
    tag: 'Marketing',
    tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },
    description: 'First-generation marketing landing page — hero copy, feature highlights, and prototype page index for early investor and partner reviews.',
    meta: 'ambientmarketing · landing · v1',
  },
];

function Tag({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 99, fontSize: 10.5, fontWeight: 500,
      background: style.bg, color: style.color,
      fontFamily: 'var(--mono)', letterSpacing: '0.04em',
    }}>{label}</span>
  );
}

function PageCard({ page }: { page: typeof PAGES[0] }) {
  return (
    <Link href={page.href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          height: '100%',
          transition: 'border-color 0.12s, box-shadow 0.12s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-strong)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tag label={page.tag} style={page.tagColor} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
            {page.href} ↗
          </span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 6 }}>
            {page.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
            {page.description}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 2 }}>
          {page.meta}
        </div>
      </div>
    </Link>
  );
}

export default function AppArchivePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '64px 24px 80px',
    }}>

      {/* Brand */}
      <div style={{ marginBottom: 52, textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.02em' }}>
          Ambient <em>Intelligence</em>
        </span>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '6px 0 0' }}>
          App Archive · {PAGES.length} pages
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 780 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
              Prototype · Internal tools
            </p>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>
              App Archive
            </h1>
          </div>
          <Link href="/home" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
            ← Active pages
          </Link>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 28px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
            Archived Prototypes
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {PAGES.map(page => <PageCard key={page.href} page={page} />)}
        </div>

      </div>
    </div>
  );
}
