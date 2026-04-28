'use client';
import { useState } from 'react';
import Link from 'next/link';

const C = {
  bg:        '#0C0D0F',
  surface:   '#13151A',
  surface2:  '#1C1F26',
  surface3:  '#22262F',
  border:    'rgba(255,255,255,0.07)',
  accent:    '#A6F2CC',
  accentDim: 'rgba(166,242,204,0.10)',
  accentGlow:'rgba(166,242,204,0.06)',
  amber:     '#F2C94C',
  amberDim:  'rgba(242,201,76,0.10)',
  blue:      '#7EB8F7',
  blueDim:   'rgba(126,184,247,0.10)',
  red:       '#F28B82',
  text:      '#EDEEF0',
  text2:     '#9A9B9D',
  text3:     '#5C5E62',
  grid:      'rgba(255,255,255,0.025)',
};

const SERVICES = [
  {
    id: 'ella',
    tag: 'AI · Bedrock',
    label: 'Ella',
    description: 'Twice-daily Claude Sonnet narrative per subject via Bedrock — de-identified summaries stored in DynamoDB for clinical staff.',
    path: 'services/ella/',
    tests: 11,
    infra: true,
    color: C.accent,
    colorDim: C.accentDim,
  },
  {
    id: 'api',
    tag: 'REST API',
    label: 'Nurse/Admin API',
    description: 'FastAPI + Cognito JWT with row-level facility scoping. Twelve endpoints serving staff web and mobile clients via API Gateway.',
    path: 'services/api/',
    tests: 19,
    infra: true,
    color: C.blue,
    colorDim: C.blueDim,
  },
  {
    id: 'telemetry',
    tag: 'Streaming',
    label: 'Telemetry',
    description: 'Fall-alert Lambda → SNS for sub-2s staff notification; per-minute aggregates → Firehose → Parquet on S3.',
    path: 'services/telemetry/',
    tests: 15,
    infra: true,
    color: C.amber,
    colorDim: C.amberDim,
  },
  {
    id: 'admin-cli',
    tag: 'CLI',
    label: 'Admin CLI',
    description: 'Operator CLI (`ambientcloud-admin`) for device provisioning — mints tenant X.509 certs and registers rooms in DynamoDB.',
    path: 'services/admin-cli/',
    tests: 28,
    infra: false,
    color: C.accent,
    colorDim: C.accentDim,
  },
  {
    id: 'url-minter',
    tag: 'Upload',
    label: 'URL Minter',
    description: 'Presigned S3 upload URLs for device Parquet batches — eliminates MQTT overhead for analytic cold-path data.',
    path: 'services/url-minter/',
    tests: null,
    infra: true,
    color: C.blue,
    colorDim: C.blueDim,
  },
  {
    id: 'athena',
    tag: 'Analytics',
    label: 'Athena',
    description: 'Glue table and partition projection for raw radar frames on the cold path — queryable without ETL.',
    path: 'services/athena/',
    tests: null,
    infra: true,
    color: C.amber,
    colorDim: C.amberDim,
  },
  {
    id: 'cloudtrail',
    tag: 'Audit',
    label: 'CloudTrail',
    description: 'Data-event audit logging on all sensitive DynamoDB tables — every read/write attributed for HIPAA compliance.',
    path: 'services/cloudtrail/',
    tests: null,
    infra: true,
    color: C.text2,
    colorDim: 'rgba(154,155,157,0.10)',
  },
];

const PATHS = [
  {
    label: 'Hot path',
    tag: '< 2s',
    tagColor: C.accent,
    flow: ['Device MQTT', 'IoT Rule', 'Lambda', 'DynamoDB', 'SNS → Staff'],
    description: 'Fall alerts. QoS 1 guaranteed delivery, sub-2-second latency budget.',
  },
  {
    label: 'Cold path',
    tag: 'New',
    tagColor: C.blue,
    flow: ['Device (5-min Parquet)', 'url-minter', 'Presigned URL', 'S3'],
    description: 'Device writes Parquet batches locally and uploads directly to S3 — no MQTT for analytic data.',
  },
  {
    label: 'Cold path',
    tag: 'Legacy',
    tagColor: C.amber,
    flow: ['Device MQTT', 'IoT Rule', 'Firehose', 'S3 (JSON→Parquet)'],
    description: 'Being retired. Dual-writes alongside the new path during migration.',
  },
  {
    label: 'Narrative path',
    tag: '12h cadence',
    tagColor: C.accent,
    flow: ['EventBridge cron', 'SQS fanout', 'Ella Lambda', 'Bedrock Claude', 'DynamoDB'],
    description: 'De-identified daily summaries generated per subject, surfaced in the Nurse Dashboard.',
  },
  {
    label: 'Nurse/Admin API',
    tag: 'REST',
    tagColor: C.blue,
    flow: ['API Gateway', 'Cognito JWT', 'FastAPI Lambda', 'DynamoDB'],
    description: 'Twelve endpoints, row-level facility scoping, served to staff web and mobile clients.',
  },
];

const ACCOUNTS = [
  {
    label: 'Tenant plane',
    count: 'One per org',
    color: C.accent,
    colorDim: C.accentDim,
    items: ['Fall alerts', 'Telemetry (hot + cold)', 'Ella narratives', 'Nurse API', 'Tenant CMK (KMS)', 'CloudTrail audit'],
  },
  {
    label: 'Control plane',
    count: 'One (us)',
    color: C.blue,
    colorDim: C.blueDim,
    items: ['Fleet provisioning', 'Bootstrap cert issuance', 'Tenant registry', 'Service Catalog'],
  },
  {
    label: 'Central observability',
    count: 'One (us)',
    color: C.amber,
    colorDim: C.amberDim,
    items: ['Scalar metrics only', 'No logs or traces', 'No PHI ever crosses', 'TelemetryDivergence', 'Fall rate per facility'],
  },
];

const STATS = [
  { value: '73', label: 'Tests passing' },
  { value: '7', label: 'Services' },
  { value: '11', label: 'Runbooks' },
  { value: '3', label: 'Account types' },
];

export default function CloudPage() {
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cl-fadeup { animation: fadeUp 0.5s ease both; }
        .cl-nav-link { transition: color 0.2s; }
        .cl-nav-link:hover { color: #EDEEF0 !important; }
        .cl-arrow { transition: transform 0.2s; }
        .cl-svc:hover .cl-arrow { transform: translate(3px,-3px); }
        .cl-svc { transition: background 0.18s; }
        .cl-flow-node {
          padding: 5px 12px; border-radius: 2px;
          font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .cl-flow-arrow { color: #5C5E62; font-size: 12px; }
        .cl-cta {
          display: inline-block; padding: 13px 28px; border-radius: 2px;
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 500; cursor: pointer;
          transition: opacity 0.2s; text-decoration: none;
          background: #A6F2CC; color: #0C0D0F; border: none;
        }
        .cl-cta:hover { opacity: 0.85; }
        .cl-cta-ghost {
          display: inline-block; padding: 12px 28px; border-radius: 2px;
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; font-weight: 500; cursor: pointer;
          transition: border-color 0.2s, color 0.2s; text-decoration: none;
          background: transparent; color: #9A9B9D;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .cl-cta-ghost:hover { border-color: #A6F2CC; color: #A6F2CC; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'var(--sans)' }}>

        {/* ── Nav ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(12,13,15,0.9)', backdropFilter: 'blur(12px)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', color: C.text }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500 }}>
              Ambient Intelligence
            </span>
          </Link>
          <div style={{ display: 'flex', gap: 32 }}>
            {[['Dashboard','/dashboard'],['BOM','/bom'],['Cloud','#'],['SaMD','/samd']].map(([l, h]) => (
              <Link key={h} href={h} className="cl-nav-link" style={{ textDecoration: 'none', color: h === '#' ? C.accent : C.text2, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</Link>
            ))}
          </div>
          <a href="https://github.com/ambientintel/ambientcloud" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '5px 12px', borderRadius: 2 }}>
              GitHub ↗
            </span>
          </a>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          paddingTop: 160, paddingBottom: 100, paddingLeft: 48, paddingRight: 48,
          position: 'relative', overflow: 'hidden',
          backgroundImage: `linear-gradient(${C.grid} 1px,transparent 1px),linear-gradient(90deg,${C.grid} 1px,transparent 1px)`,
          backgroundSize: '64px 64px',
        }}>
          <div style={{ position: 'absolute', top: '30%', right: '10%', width: 500, height: 400, pointerEvents: 'none', background: `radial-gradient(ellipse at center, ${C.accentGlow} 0%, transparent 70%)` }} />

          <div style={{ maxWidth: 820 }}>
            <div className="cl-fadeup" style={{ animationDelay: '0.05s', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
                ambientintel/ambientcloud · AWS Architecture v4
              </span>
            </div>

            <h1 className="cl-fadeup" style={{ animationDelay: '0.12s', fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(44px,6vw,80px)', lineHeight: 1.06, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
              Cloud infrastructure<br />
              <em style={{ color: C.accent, fontStyle: 'italic' }}>for senior care.</em>
            </h1>

            <p className="cl-fadeup" style={{ animationDelay: '0.2s', fontSize: 17, lineHeight: 1.65, color: C.text2, maxWidth: 560, margin: '0 0 16px', fontWeight: 300 }}>
              AWS backend for fall-detection at scale — seven independently deployable services across hot alerts, cold telemetry, AI narratives, and a REST API.
            </p>
            <p className="cl-fadeup" style={{ animationDelay: '0.22s', fontFamily: 'var(--mono)', fontSize: 10.5, color: C.text3, letterSpacing: '0.08em', margin: '0 0 40px' }}>
              IRB-approved research pilot · HIPAA §164.514(c) coded data · One AWS account per tenant
            </p>

            <div className="cl-fadeup" style={{ animationDelay: '0.3s', display: 'flex', gap: 12 }}>
              <a href="https://github.com/ambientintel/ambientcloud" target="_blank" rel="noreferrer" className="cl-cta">View on GitHub</a>
              <Link href="/dashboard" className="cl-cta-ghost">Nurse Dashboard →</Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '32px 48px', borderRight: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 38, fontWeight: 500, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: C.text3, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Services ── */}
        <section style={{ padding: '88px 48px' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 14 }}>Services</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-0.02em', margin: 0 }}>Seven independently deployable services.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, border: `1px solid ${C.border}` }}>
            {SERVICES.map((svc, i) => (
              <a key={svc.id} href={`https://github.com/ambientintel/ambientcloud/tree/main/${svc.path}`} target="_blank" rel="noreferrer"
                className="cl-svc" style={{ textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={() => setHoveredService(svc.id)}
                onMouseLeave={() => setHoveredService(null)}>
                <div style={{
                  padding: '32px 28px', minHeight: 200,
                  background: hoveredService === svc.id ? C.surface2 : C.surface,
                  borderRight: (i % 3 !== 2) ? `1px solid ${C.border}` : 'none',
                  borderBottom: (i < SERVICES.length - (SERVICES.length % 3 || 3)) ? `1px solid ${C.border}` : 'none',
                  display: 'flex', flexDirection: 'column', gap: 14, transition: 'background 0.18s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: svc.color, background: svc.colorDim, padding: '3px 8px', borderRadius: 2 }}>{svc.tag}</span>
                    <span className="cl-arrow" style={{ color: C.text3, fontSize: 16 }}>↗</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 8 }}>{svc.label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: C.text2, fontWeight: 300 }}>{svc.description}</div>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {svc.tests !== null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, letterSpacing: '0.08em' }}>{svc.tests} tests</span>
                      </span>
                    )}
                    {svc.infra && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, letterSpacing: '0.08em' }}>Terraform</span>
                    )}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.text3, letterSpacing: '0.06em', marginLeft: 'auto' }}>{svc.path}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Data paths ── */}
        <section style={{ padding: '0 48px 88px' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 14 }}>Architecture</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-0.02em', margin: 0 }}>Five data paths.</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: `1px solid ${C.border}` }}>
            {PATHS.map((p, i) => (
              <div key={i} style={{ background: C.surface, borderBottom: i < PATHS.length - 1 ? `1px solid ${C.border}` : 'none', padding: '28px 32px', display: 'grid', gridTemplateColumns: '200px 1fr 260px', alignItems: 'center', gap: 32 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: p.tagColor, background: `${p.tagColor}18`, padding: '2px 7px', borderRadius: 2 }}>{p.tag}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, letterSpacing: '-0.01em', color: C.text }}>{p.label}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.flow.map((node, ni) => (
                    <span key={ni} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="cl-flow-node" style={{ background: C.surface2, color: C.text2, border: `1px solid ${C.border}` }}>{node}</span>
                      {ni < p.flow.length - 1 && <span className="cl-flow-arrow">→</span>}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: C.text3, fontWeight: 300 }}>{p.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Account model ── */}
        <section style={{ padding: '0 48px 88px' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 14 }}>Isolation model</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(26px,3vw,40px)', letterSpacing: '-0.02em', margin: 0 }}>One AWS account per tenant.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {ACCOUNTS.map((acc, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, padding: '32px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: acc.color, background: acc.colorDim, padding: '3px 8px', borderRadius: 2 }}>{acc.count}</span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 20 }}>{acc.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {acc.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: acc.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.text2, letterSpacing: '0.04em' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Runbooks ── */}
        <section style={{ padding: '0 48px 88px' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, padding: '40px 40px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 32 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>Incident response</div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 24, letterSpacing: '-0.02em', color: C.text, marginBottom: 12 }}>11 runbooks. Ready for on-call.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['API 5xx','Auth failure','Cost spike','Device offline','Escalation','Fall alert — false positive','Fall alert — missed','IRB data request','Narrative broken','Telemetry gap'].map(rb => (
                  <span key={rb} style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: C.text3, background: C.surface2, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 2 }}>{rb}</span>
                ))}
              </div>
            </div>
            <a href="https://github.com/ambientintel/ambientcloud/tree/main/docs/runbooks" target="_blank" rel="noreferrer" className="cl-cta" style={{ whiteSpace: 'nowrap' }}>View runbooks ↗</a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ padding: '28px 48px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3 }}>
            Ambient Intelligence · Not for clinical use
          </span>
          <Link href="/" style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: C.text3 }}>
            ← Control Center
          </Link>
        </footer>

      </div>
    </>
  );
}
