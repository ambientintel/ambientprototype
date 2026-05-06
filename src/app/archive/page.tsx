'use client';
import Link from 'next/link';

type PageEntry = { href: string; label: string; tag: string; tagColor: { bg: string; color: string }; description: string; meta: string };

const GROUPS: { label: string; pages: PageEntry[] }[] = [
  {
    label: 'Investor & Partnerships',
    pages: [
      { href: '/invest',       label: 'Investor Overview',             tag: 'Investor',     tagColor: { bg: 'rgba(79,156,249,0.18)', color: '#4F9CF9' },   description: 'Full investor pitch page — product vision, grant funding, PCT patent, and gener8tor accelerator backing.',            meta: 'ambientinvest · pitch · capital' },
      { href: '/mn',           label: 'Minnesota Partnerships',        tag: 'Partnership',  tagColor: { bg: 'rgba(122,0,25,0.18)',   color: '#C0394B' },   description: 'UMN, Mayo Clinic, and State of MN partnership overview — $248K grant, angel capital, ODT, and tech partners.',       meta: 'ambientmn · UMN · Mayo · gener8tor' },
      { href: '/accelerate',   label: 'Accelerate',                    tag: 'Accelerator',  tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },   description: 'gener8tor accelerator program showcase — portfolio positioning, milestones, and program details.',                   meta: 'ambientaccelerate · gener8tor' },
      { href: '/umn',          label: 'UMN Partnership Milestones',    tag: 'Research',     tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },   description: 'IRB approvals, sensor calibration, pilot deployment, and data-sharing milestones for the UMN collaboration.',       meta: 'ambientresearch · UMN · IRB' },
    ],
  },
  {
    label: 'Product & Clinical',
    pages: [
      { href: '/digitalhealth',    label: 'Digital Health Studio',    tag: 'Product',     tagColor: { bg: 'rgba(63,204,145,0.18)', color: '#3DCC91' },   description: 'SaMD and digital therapeutics workspace — regulatory strategy, clinical evidence, and product lifecycle management.', meta: 'ambientdh · SaMD · DTx' },
      { href: '/samd',             label: 'SaMD / Regulatory',        tag: 'Regulatory',  tagColor: { bg: 'rgba(255,102,128,0.18)', color: '#FF6680' },  description: 'Software as a Medical Device regulatory framework — FDA pathway, risk classification, and predicate analysis.',       meta: 'ambientregulatory · FDA · SaMD' },
      { href: '/biodesign',        label: 'Biodesign Studio',         tag: 'Clinical',    tagColor: { bg: 'rgba(0,180,216,0.18)',  color: '#00B4D8' },   description: 'Stanford Biodesign process tool — needs identification, ideation, feasibility, and implementation phases.',           meta: 'ambientbiodesign · Stanford · clinical' },
      { href: '/clinicalresearch', label: 'Clinical Research',        tag: 'Research',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' },  description: 'IRB study design, protocol development, and clinical evidence generation for ambient sensing validation.',           meta: 'ambientclinical · IRB · evidence' },
      { href: '/agenticstudio',    label: 'Agentic Studio',           tag: 'AI',          tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },   description: 'Electric Forge agentic AI studio — orchestrated multi-agent workflows and automation tooling.',                      meta: 'ambientagentic · AI · agents' },
    ],
  },
  {
    label: 'Operations & Internal',
    pages: [
      { href: '/engineering',      label: 'Engineering Hub',          tag: 'Eng',         tagColor: { bg: 'rgba(45,114,210,0.18)',  color: '#669EFF' },   description: 'Sprint board with stories, tasks, and bugs across sensor fusion, ML pipeline, and cloud services.',                meta: 'ambienteng · sprint tracker' },
      { href: '/cloud',            label: 'Cloud Infrastructure',     tag: 'Infra',       tagColor: { bg: 'rgba(0,180,216,0.18)',  color: '#00B4D8' },   description: 'AWS service map — Ella (Claude on Bedrock), Nurse API (FastAPI + Cognito), Telemetry pipeline, Terraform.',         meta: 'ambientcloud · AWS · Terraform' },
      { href: '/bi',               label: 'Business Intelligence',    tag: 'BI',          tagColor: { bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },   description: 'Facility-level analytics — payer mix, fall rate vs. benchmark, staff ratio, and KPIs for the MOH pilot.',           meta: 'ambientbi · facility metrics' },
      { href: '/humancapitalmgmt', label: 'Human Capital Management', tag: 'HCM',         tagColor: { bg: 'rgba(124,110,173,0.22)', color: '#9C85D4' },  description: 'Org chart, team directory, role definitions, and headcount analytics across all departments.',                     meta: 'ambienthcm · org · directory' },
      { href: '/datascience',      label: 'Data Science Dashboard',   tag: 'ML',          tagColor: { bg: 'rgba(45,114,210,0.18)',  color: '#669EFF' },   description: 'Fall alert distribution, resident risk scores, activity classification metrics, and radar pipeline diagnostics.',   meta: 'ambientml · radar · classification' },
      { href: '/bom',              label: 'Bill of Materials',        tag: 'Hardware',    tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },   description: 'Hardware BOM tracker — sensor components, unit cost, supplier, and revision history for the IoT device stack.',      meta: 'ambienthw · BOM · components' },
      { href: '/control',          label: 'Control Center',           tag: 'Nav',         tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },   description: 'Internal navigation hub — grouped links to all prototype modules across every domain.',                            meta: 'ambientprototype · index' },
      { href: '/contractlab',      label: 'Contract Lab',             tag: 'Legal',       tagColor: { bg: 'rgba(76,144,240,0.18)', color: '#4C90F0' },   description: 'Document management for NDAs, term sheets, and pilot agreements — versioned with status tracking.',                 meta: 'ambientlegal · contracts · NDA' },
      { href: '/gapanalysis',      label: 'Gap Analysis',             tag: 'Strategy',    tagColor: { bg: 'rgba(63,204,145,0.18)', color: '#3DCC91' },   description: 'Competitive and capability gap analysis across regulatory, clinical, and technology dimensions.',                   meta: 'ambientstrategy · gap · competitive' },
    ],
  },
  {
    label: 'Labs & Prototypes',
    pages: [
      { href: '/algorithmlab',  label: 'Algorithm Lab',       tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Live activity classifier visualization — radar epoch plots, color-coded posture states in real time.',         meta: 'ambientalgo · IWR6843AOP · radar' },
      { href: '/backgroundlab', label: 'Background Lab',      tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Animated particle background playground — tune count, speed, radius, and color in real time at 60fps.',        meta: 'ambientdesign · canvas · particles' },
      { href: '/mobilelab',     label: 'Mobile Lab',          tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Mobile nurse dashboard prototype — alert feed, active room count, and resolved events for phone viewports.',   meta: 'ambientmobile · PWA · nurse' },
      { href: '/pitchdecklab',  label: 'Pitch Deck Lab',      tag: 'Lab',    tagColor: { bg: 'rgba(200,150,25,0.22)', color: '#FFC940' },  description: 'Slide-by-slide pitch deck builder with editable copy per frame and full-screen presentation mode.',             meta: 'ambientpitch · deck · slides' },
      { href: '/moneymatrix',   label: 'Money Matrix',        tag: 'Lab',    tagColor: { bg: 'rgba(63,204,145,0.18)', color: '#3DCC91' },  description: 'Financial modeling tool — runway, burn rate, and revenue scenario planning for seed-stage operations.',         meta: 'ambientfinance · model · runway' },
      { href: '/mobile',        label: 'Mobile PWA Setup',    tag: 'Mobile', tagColor: { bg: 'rgba(35,133,81,0.22)',  color: '#3DCC91' },  description: 'Step-by-step iOS and Android install guide for the Ella Memory progressive web app.',                          meta: 'ambientmobile · PWA · iOS · Android' },
    ],
  },
  {
    label: 'Marketing & Design',
    pages: [
      { href: '/landing1', label: 'Landing Page v1',  tag: 'Marketing', tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },  description: 'First-generation marketing landing page — hero copy, feature highlights, and prototype page index.',   meta: 'ambientmarketing · landing · v1' },
      { href: '/landing3', label: 'Landing Page v3',  tag: 'Marketing', tagColor: { bg: 'rgba(95,107,124,0.22)', color: '#8F99A8' },  description: 'Third-generation marketing landing page — refined messaging and updated product positioning.',          meta: 'ambientmarketing · landing · v3' },
      { href: '/pureburger', label: 'Pure Burger',    tag: 'Demo',      tagColor: { bg: 'rgba(240,180,41,0.18)', color: '#F0B429' },  description: 'Demo restaurant app prototype — menu, ordering, and branding for a hypothetical consumer product.',      meta: 'ambientdemo · consumer · restaurant' },
      { href: '/brand',    label: 'Brand',            tag: 'Design',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' }, description: 'Brand identity system — typography, color palette, logo usage, and visual design standards.',           meta: 'ambientdesign · brand · identity' },
      { href: '/colors',   label: 'Color Palette',    tag: 'Design',    tagColor: { bg: 'rgba(130,100,240,0.18)', color: '#8264F0' }, description: 'Design token color palette — all semantic colors, surface levels, and accent values across themes.',    meta: 'ambientdesign · colors · tokens' },
    ],
  },
];

const TOTAL = GROUPS.reduce((s, g) => s + g.pages.length, 0);

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

function PageCard({ page }: { page: PageEntry }) {
  return (
    <Link href={page.href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: 'var(--surface-1)', border: '1px solid var(--line)',
          borderRadius: 12, padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
          height: '100%', transition: 'border-color 0.12s, box-shadow 0.12s', cursor: 'pointer',
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
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{page.href} ↗</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 5 }}>
            {page.label}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6 }}>{page.description}</div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>{page.meta}</div>
      </div>
    </Link>
  );
}

export default function ArchivePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '64px 24px 96px' }}>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.02em' }}>
            Ambient <em>Intelligence</em>
          </span>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '6px 0 0' }}>
            Page Archive · {TOTAL} pages
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>
              ambientprototype.vercel.app
            </p>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 30, margin: 0, letterSpacing: '-0.025em' }}>
              All Pages
            </h1>
          </div>
          <Link href="/home" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
            ← Home
          </Link>
        </div>

        {/* Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          {GROUPS.map(group => (
            <div key={group.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                  {group.pages.length} pages
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {group.pages.map(page => <PageCard key={page.href} page={page} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>
            ambientprototype.vercel.app · {TOTAL} routes
          </span>
          <Link href="/control" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textDecoration: 'none' }}>
            Control Center →
          </Link>
        </div>

      </div>
    </div>
  );
}
