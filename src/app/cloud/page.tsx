'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

type Tab = 'services' | 'paths' | 'architecture' | 'accounts' | 'runbooks';

const SERVICES = [
  { id: 'ella',       tag: 'AI · Bedrock', label: 'Ella',            path: 'services/ella/',        tests: 11,  desc: 'Twice-daily Claude Sonnet narrative per subject via Bedrock — de-identified summaries stored in DynamoDB for clinical staff.', tf: true },
  { id: 'api',        tag: 'REST API',     label: 'Nurse/Admin API', path: 'services/api/',         tests: 19,  desc: 'FastAPI + Cognito JWT with row-level facility scoping. Twelve endpoints serving staff web and mobile clients.', tf: true },
  { id: 'telemetry',  tag: 'Streaming',    label: 'Telemetry',       path: 'services/telemetry/',   tests: 15,  desc: 'Fall-alert Lambda → SNS for sub-2s staff notification; per-minute aggregates → Firehose → Parquet on S3.', tf: true },
  { id: 'admin-cli',  tag: 'CLI',          label: 'Admin CLI',       path: 'services/admin-cli/',   tests: 28,  desc: 'Operator CLI for device provisioning — mints tenant X.509 certs and registers rooms in DynamoDB.', tf: false },
  { id: 'url-minter', tag: 'Upload',       label: 'URL Minter',      path: 'services/url-minter/',  tests: null, desc: 'Presigned S3 upload URLs for device Parquet batches — eliminates MQTT overhead for analytic cold-path data.', tf: true },
  { id: 'athena',     tag: 'Analytics',    label: 'Athena',          path: 'services/athena/',      tests: null, desc: 'Glue table and partition projection for raw radar frames on the cold path — queryable without ETL.', tf: true },
  { id: 'cloudtrail', tag: 'Audit',        label: 'CloudTrail',      path: 'services/cloudtrail/',  tests: null, desc: 'Data-event audit logging on all sensitive DynamoDB tables — every read/write attributed for HIPAA compliance.', tf: true },
];

const PATHS = [
  { label: 'Hot path',      tag: '< 2s',      flow: ['Device MQTT', 'IoT Rule', 'Lambda', 'DynamoDB', 'SNS → Staff'],                                  desc: 'Fall alerts. QoS 1 guaranteed delivery, sub-2-second latency budget.' },
  { label: 'Cold path',     tag: 'New',        flow: ['Device (5-min Parquet)', 'url-minter', 'Presigned URL', 'S3'],                                   desc: 'Device writes Parquet batches locally and uploads directly to S3 — no MQTT for analytic data.' },
  { label: 'Cold path',     tag: 'Legacy',     flow: ['Device MQTT', 'IoT Rule', 'Firehose', 'S3 (JSON→Parquet)'],                                      desc: 'Being retired. Dual-writes alongside the new path during migration.' },
  { label: 'Narrative',     tag: '12h cadence',flow: ['EventBridge cron', 'SQS fanout', 'Ella Lambda', 'Bedrock Claude', 'DynamoDB'],                   desc: 'De-identified daily summaries generated per subject, surfaced in the Nurse Dashboard.' },
  { label: 'Nurse/Admin API', tag: 'REST',     flow: ['API Gateway', 'Cognito JWT', 'FastAPI Lambda', 'DynamoDB'],                                       desc: 'Twelve endpoints, row-level facility scoping.' },
];

const ACCOUNTS = [
  { label: 'Tenant plane',         count: 'One per org',  items: ['Fall alerts (hot)', 'Telemetry (cold)', 'Ella narratives', 'Nurse/Admin API', 'Tenant CMK (KMS)', 'CloudTrail audit'] },
  { label: 'Control plane',        count: 'One (us)',     items: ['Fleet provisioning', 'Bootstrap cert issuance', 'Tenant registry', 'Service Catalog'] },
  { label: 'Central observability', count: 'One (us)',    items: ['Scalar metrics only', 'No logs or traces', 'No PHI crosses boundary', 'TelemetryDivergence', 'Fall rate per facility'] },
];

const RUNBOOKS = [
  'API 5xx', 'Auth login failure', 'Cost spike', 'Device offline',
  'Escalation', 'Fall alert — false positive', 'Fall alert — missed',
  'IRB data request', 'Narrative broken', 'Telemetry gap',
];

const MERMAID_CONTENT = `flowchart LR
    subgraph Factory["Factory &amp; Control Plane (separate AWS account)"]
        FleetProv["IoT Fleet Provisioning<br/>• bootstrap cert → tenant cert<br/>• tenant registry lookup<br/>• one-time at first boot"]
        TenantRegistry[("Tenant Registry<br/>device UUID → tenant_id<br/>DDB + CloudTrail")]
    end

    subgraph Device["Ambient Device (3 per room)"]
        Radar["mmWave Radar + Actigraphy<br/>IWR6843AOP on AM62x"]
        Agent["ambientapp agent<br/>• on-device fall detection<br/>• per-minute aggregator<br/>• WAL + spool (500 MB cap)<br/>• 5-min Parquet writer (ZSTD)"]
        Radar --> Agent
    end

    subgraph TenantPlane["Tenant Account (one per organization — see tenancy.md)"]
        subgraph IoTCore["AWS IoT Core (mTLS, X.509)"]
            CredProvider["Credentials Provider<br/>role alias → temp AWS creds"]
            RuleAlerts["IoT Rule: fall enricher<br/>$aws/rules/fall-enricher/<br/>ambient/v1/alerts/fall/+<br/>(Basic Ingest — see §7.1)"]
            RuleTelemetryLegacy["IoT Rule: telemetry (legacy)<br/>ambient/v1/telemetry/+<br/>retired after dual-write"]
            Shadow[("Device Shadow<br/>desired: facility/subject/<br/>room/zone/telemetry_mode")]
        end

        subgraph Hot["Hot path — fall alerts &lt;2s"]
            AlertLambda["Lambda: alert enricher<br/>• DDB lookup<br/>• audit write<br/>• SNS publish"]
            AlertsDDB[("DynamoDB: alerts<br/>PK: subject_date<br/>GSI: facility-time, eventId")]
            SNS{{"SNS: fall-alerts<br/>filter by facilityId"}}
            Staff["Medical Staff<br/>SMS + push + web"]
        end

        subgraph ColdNew["Cold path (new) — device-side Parquet"]
            URLMinter["Lambda: url-minter<br/>• SigV4 auth<br/>• Shadow scope check<br/>• 5-min presigned PUT<br/>• sha256 + CMK pinned"]
            S3New[("S3: ambient-TENANT-parquet<br/>raw-device/date=/facility=/<br/>subject=/device=/*.parquet<br/>SSE-KMS with tenant CMK")]
        end

        subgraph ColdLegacy["Cold path (legacy) — retiring"]
            Firehose["Kinesis Firehose<br/>5 min / 128 MB buffer<br/>JSON → Parquet (ZSTD)"]
            S3Legacy[("S3: same bucket<br/>raw/ prefix<br/>retired post-migration")]
        end

        subgraph ColdShared["Cold path (shared) — query"]
            Reconciler["Lambda: reconciler<br/>• every 15 min<br/>• Athena row-count delta<br/>• CloudWatch metric:<br/>TelemetryDivergence"]
            Glue[("Glue Data Catalog<br/>partition projection<br/>UNION ALL view")]
            Athena["Amazon Athena<br/>10 GB scan cap per query"]
        end

        subgraph Narrative["Narrative path — 12h cadence"]
            Schedule{{"EventBridge<br/>cron: 7am + 7pm"}}
            SQS[("SQS: ella-fanout<br/>DLQ on 3x failure")]
            Ella["Lambda: Ella<br/>• Athena aggregates<br/>• DDB fall counts<br/>• Bedrock call<br/>• de-id system prompt"]
            Bedrock[["AWS Bedrock<br/>Claude Sonnet 4.5<br/>(4.6 upgrade path available)<br/>HIPAA eligible, no egress"]]
            UpdatesDDB[("DynamoDB: daily-updates<br/>PK: subjectId<br/>90-day TTL")]
        end

        subgraph API["Nurse / Admin API"]
            APIGW["API Gateway HTTP API<br/>JWT authorizer"]
            Cognito["Cognito User Pool<br/>email + MFA<br/>custom:role, custom:facilityIds<br/>admin-create only"]
            APILambda["Lambda: FastAPI<br/>row-level facility scope<br/>admin vs nurse roles<br/>12 endpoints"]
            DevicesDDB[("DynamoDB: devices<br/>PK: deviceId<br/>GSI: facility-index")]
        end

        subgraph Audit["Audit &amp; Governance"]
            CloudTrail["CloudTrail<br/>multi-region<br/>DDB + S3 data events<br/>7-year Glacier retention"]
            Admin["ambientcloud-admin CLI<br/>• telemetry mode &lt;device&gt;<br/>• telemetry migrate &lt;facility&gt;<br/>• PILOT-XXXX enforcement<br/>• forbidden-attribute guard"]
            KMS[("KMS: tenant CMK<br/>SSE-KMS on all buckets<br/>key does not cross accounts")]
        end
    end

    subgraph ControlObs["Central Observability (metrics only, no PHI)"]
        MetricStream["CloudWatch Metric Stream<br/>scalar metrics only<br/>logs stay in tenant account"]
    end

    %% Factory / first-boot
    Agent -.->|"first boot only<br/>bootstrap cert"| FleetProv
    FleetProv -.-> TenantRegistry
    FleetProv -.->|"provision into<br/>tenant account"| CredProvider

    %% Device — steady state
    Agent -->|"MQTT QoS 1<br/>fall alerts"| RuleAlerts
    Agent -->|"MQTT QoS 0<br/>legacy only during dual-write"| RuleTelemetryLegacy
    Agent -->|"HTTPS POST<br/>request presigned URL"| URLMinter
    Agent -->|"HTTPS PUT<br/>200–400 KB parquet<br/>(5-min batch)"| S3New
    Agent <-.->|"shadow sync<br/>incl. telemetry_mode"| Shadow
    Agent -.->|"temp creds via mTLS"| CredProvider

    %% url-minter scope check
    URLMinter -.->|"Shadow facility/subject<br/>must match requested key"| Shadow

    %% Hot path
    RuleAlerts --> AlertLambda
    AlertLambda --> AlertsDDB
    AlertLambda -.->|"lookup"| DevicesDDB
    AlertLambda --> SNS
    SNS --> Staff

    %% Cold path
    RuleTelemetryLegacy --> Firehose
    Firehose --> S3Legacy
    S3New -.-> Glue
    S3Legacy -.-> Glue
    Glue -.-> Athena

    %% Reconciler (dual-write validation)
    Reconciler -.->|"compare row counts<br/>telemetry_device vs telemetry_firehose"| Athena

    %% Narrative
    Schedule --> Ella
    Ella -->|"fanout per subject"| SQS
    SQS --> Ella
    Ella -.-> Athena
    Ella -.-> AlertsDDB
    Ella --> Bedrock
    Ella --> UpdatesDDB

    %% API
    Staff -->|"login + JWT"| Cognito
    Cognito -.-> APIGW
    Staff --> APIGW
    APIGW --> APILambda
    APILambda -.-> AlertsDDB
    APILambda -.-> UpdatesDDB
    APILambda -.-> DevicesDDB
    APILambda -.-> Athena
    APILambda -.->|"on-demand narrative"| Ella

    %% Admin
    Admin --> DevicesDDB
    Admin --> Shadow

    %% Encryption
    KMS -.->|"CMK"| S3New
    KMS -.->|"CMK"| S3Legacy
    KMS -.->|"CMK"| AlertsDDB
    KMS -.->|"CMK"| UpdatesDDB
    KMS -.->|"CMK"| DevicesDDB

    %% Audit
    CloudTrail -.-> AlertsDDB
    CloudTrail -.-> UpdatesDDB
    CloudTrail -.-> DevicesDDB
    CloudTrail -.-> S3New
    CloudTrail -.-> S3Legacy

    %% Central observability (scalar metrics only)
    Reconciler -.->|"TelemetryDivergence"| MetricStream
    URLMinter -.->|"issuance rate"| MetricStream
    AlertLambda -.->|"fall rate"| MetricStream

    %% Styling
    classDef factory  fill:#fce4ec,stroke:#880e4f,stroke-width:2px,color:#000
    classDef device   fill:#f0f0f0,stroke:#374151,stroke-width:2px,color:#000
    classDef iot      fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    classDef hot      fill:#ffe6e6,stroke:#d32f2f,stroke-width:2px,color:#000
    classDef coldnew  fill:#e6f4e6,stroke:#2e7d32,stroke-width:2px,color:#000
    classDef coldold  fill:#e0e0e0,stroke:#616161,stroke-width:2px,color:#000,stroke-dasharray: 5 5
    classDef llm      fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000
    classDef api      fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000
    classDef audit    fill:#fff9c4,stroke:#827717,stroke-width:2px,color:#000
    classDef obs      fill:#e8eaf6,stroke:#283593,stroke-width:2px,color:#000

    class FleetProv,TenantRegistry factory
    class Radar,Agent device
    class CredProvider,RuleAlerts,RuleTelemetryLegacy,Shadow iot
    class AlertLambda,AlertsDDB,SNS,Staff hot
    class URLMinter,S3New,Reconciler,Glue,Athena coldnew
    class Firehose,S3Legacy coldold
    class Schedule,SQS,Ella,Bedrock,UpdatesDDB llm
    class APIGW,Cognito,APILambda,DevicesDDB api
    class CloudTrail,Admin,KMS audit
    class MetricStream obs`;

export default function CloudPage() {
  const [tab, setTab] = useState<Tab>('services');
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramLoaded, setDiagramLoaded] = useState(false);

  useEffect(() => {
    if (tab !== 'architecture') return;
    if (diagramLoaded) return;

    const existing = document.querySelector('script[data-mermaid]');
    const render = (m: any) => {
      m.initialize({ startOnLoad: false, theme: 'neutral', flowchart: { htmlLabels: true, curve: 'linear' } });
      m.render('arch-v4', MERMAID_CONTENT).then(({ svg }: { svg: string }) => {
        if (diagramRef.current) { diagramRef.current.innerHTML = svg; setDiagramLoaded(true); }
      }).catch(console.error);
    };

    if (existing) { render((window as any).mermaid); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.setAttribute('data-mermaid', '1');
    script.async = true;
    script.onload = () => render((window as any).mermaid);
    document.head.appendChild(script);
  }, [tab, diagramLoaded]);

  const navItems: { key: Tab; label: string }[] = [
    { key: 'services',      label: 'Services' },
    { key: 'paths',         label: 'Data Paths' },
    { key: 'architecture',  label: 'Architecture' },
    { key: 'accounts',      label: 'Account Model' },
    { key: 'runbooks',      label: 'Runbooks' },
  ];

  const totalTests = SERVICES.reduce((s, svc) => s + (svc.tests ?? 0), 0);

  return (
    <div className="app">

      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand">
            <span className="brand-name">Ambient <em>Intelligence</em></span>
          </div>
        </Link>

        <div className="nav-section">
          <p className="nav-label">Cloud</p>
          {navItems.map(item => (
            <button key={item.key} className={`nav-item${tab === item.key ? ' active' : ''}`} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p className="nav-label">Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
            {[
              { label: 'Services',      value: `${SERVICES.length}` },
              { label: 'Tests passing', value: `${totalTests}` },
              { label: 'Runbooks',      value: `${RUNBOOKS.length}` },
              { label: 'Account types', value: '3' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-3)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--accent)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ padding: '32px 40px', overflowY: 'auto' }}>

        {/* Header card */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 20px', marginBottom: 28, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Repo</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)' }}>ambientintel/ambientcloud</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Architecture</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text-2)' }}>v4 · 2026-04-21</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Data handling</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>IRB-approved · HIPAA §164.514(c) coded data · No names, DOBs, or MRNs</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            {['Terraform 1.14+', 'Python 3.12', 'FastAPI', 'AWS Bedrock'].map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px' }}>{tag}</span>
            ))}
            <a href="https://github.com/ambientintel/ambientcloud" target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: 1 }}>github ↗</a>
          </div>
        </div>

        {/* ── Services ── */}
        {tab === 'services' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · AWS</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Services</h1>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Services',  value: SERVICES.length },
                { label: 'Tests',     value: totalTests },
                { label: 'With Terraform', value: SERVICES.filter(s => s.tf).length },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Service', 'Type', 'Description', 'Tests', 'Infra'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((svc, i) => (
                    <tr key={svc.id} style={{ borderBottom: '1px solid var(--line)', background: 'transparent' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <a href={`https://github.com/ambientintel/ambientcloud/tree/main/${svc.path}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>{svc.label} ↗</a>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px' }}>{svc.tag}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 400 }}>{svc.desc}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: svc.tests ? 'var(--text)' : 'var(--text-4)', textAlign: 'center' }}>
                        {svc.tests ?? '—'}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 13, color: svc.tf ? 'var(--accent)' : 'var(--text-4)' }}>{svc.tf ? '✓' : '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Data Paths ── */}
        {tab === 'paths' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · Architecture v4</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Data Paths</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PATHS.map((p, i) => (
                <div key={i} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400 }}>{p.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em' }}>{p.tag}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {p.flow.map((node, ni) => (
                      <span key={ni} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '4px 10px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{node}</span>
                        {ni < p.flow.length - 1 && <span style={{ color: 'var(--text-4)', fontSize: 12 }}>→</span>}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Architecture ── */}
        {tab === 'architecture' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · architecture-v4.mmd</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Architecture Diagram</h1>
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'auto', background: '#F8F9FA', padding: 24 }}>
              <div ref={diagramRef} style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                Loading diagram…
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 10 }}>
              Mermaid flowchart · v4 · 2026-04-21 ·{' '}
              <a href="https://github.com/ambientintel/ambientcloud/blob/main/docs/architecture-v4.mmd" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>view source ↗</a>
            </p>
          </>
        )}

        {/* ── Account Model ── */}
        {tab === 'accounts' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · tenancy.md</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Account Isolation Model</h1>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
              One AWS account per tenant organization — the strongest isolation boundary AWS offers and the correct default for HIPAA workloads handling PHI from distinct covered entities.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              {ACCOUNTS.map((acc) => (
                <div key={acc.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 20px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em', display: 'inline-block', marginBottom: 12 }}>{acc.count}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, marginBottom: 14 }}>{acc.label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {acc.items.map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 10 }}>What crosses account boundaries</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px' }}>
                {[
                  ['✓ Scalar CloudWatch metrics (no strings)', 'var(--text-2)'],
                  ['✓ First-boot device provisioning (once)', 'var(--text-2)'],
                  ['✗ Logs, traces, or any PHI', '#a02020'],
                  ['✗ KMS keys (tenant CMK stays in tenant acct)', '#a02020'],
                  ['✗ Device telemetry or fall events', '#a02020'],
                  ['✗ Narrative content or API responses', '#a02020'],
                ].map(([text, color]) => (
                  <div key={text as string} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: color as string }}>{text as string}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Runbooks ── */}
        {tab === 'runbooks' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · docs/runbooks/</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Incident Runbooks</h1>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
              {RUNBOOKS.length} runbooks covering all major failure modes — written to be followed on-call without prior system knowledge.
            </p>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Runbook', 'Path', 'Source'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RUNBOOKS.map((rb, i) => {
                    const slug = rb.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13 }}>{rb}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>docs/runbooks/{slug}.md</td>
                        <td style={{ padding: '11px 14px' }}>
                          <a href={`https://github.com/ambientintel/ambientcloud/blob/main/docs/runbooks/${slug}.md`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>view ↗</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
