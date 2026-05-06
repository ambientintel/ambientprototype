'use client';
import Link from 'next/link';
import { useState, Fragment } from 'react';
import dynamic from 'next/dynamic';

const ServiceEditor = dynamic(() => import('./ServiceEditor'), { ssr: false });

type Tab = 'services' | 'paths' | 'architecture' | 'accounts' | 'runbooks' | 'editor' | 'metrics' | 'tenants' | 'fleet' | 'pipeline' | 'costs' | 'security' | 'incidents' | 'models' | 'releases' | 'iac';
type TfFile = 'main.tf' | 'backend.tf' | 'dev.tfvars' | 'prod.tfvars';
type ActionStatus = 'idle' | 'running' | 'ok' | 'error';
type TenantStatus = 'healthy' | 'degraded' | 'provisioning';
type DeviceStatus = 'online' | 'offline' | 'degraded';
type PipelineStatus = 'passing' | 'failing' | 'running' | 'queued' | 'skipped';
interface Tenant { id: string; name: string; accountId: string; region: string; rooms: number; services: number; lastDeploy: string; status: TenantStatus; }
interface RunbookDetail { severity: 'P1' | 'P2' | 'P3'; ttr: string; escalateTo: string; steps: string[]; }
interface FacilityRoom { room: string; deviceId: string; subjectId: string; status: DeviceStatus; lastSeen: string; lastParquet: string; firmware: string; certDaysLeft: number; fallAlerts7d: number; }
interface FacilityData { tenantId: string; name: string; region: string; rooms: FacilityRoom[]; }
interface PipelineStage { name: string; status: PipelineStatus; duration: string; }
interface PipelineRun { sha: string; message: string; author: string; startedAt: string; duration: string; status: PipelineStatus; stages: PipelineStage[]; }
interface ServicePipeline { serviceId: string; label: string; runs: PipelineRun[]; }
interface CostEntry { label: string; amount: number; sub?: string; }
interface ServiceCost { serviceId: string; label: string; color: string; monthly: number; breakdown: CostEntry[]; }
type ControlStatus = 'pass' | 'fail' | 'review';
type IncidentType = 'alert' | 'deploy' | 'runbook' | 'config' | 'resolved';
type ReleaseStage = 'canary' | 'partial' | 'full' | 'held';
interface AuditEvent { id: string; ts: string; tenantId: string; action: string; principal: string; resource: string; outcome: 'success' | 'denied'; severity: 'info' | 'warning' | 'critical'; }
interface KmsKey { keyId: string; alias: string; tenantId: string; rotation: boolean; nextRotation: string; daysUntil: number; status: 'active' | 'expiring'; }
interface Soc2Control { id: string; title: string; status: ControlStatus; evidence: string; lastChecked: string; }
interface IncidentEvent { id: string; ts: string; type: IncidentType; severity: 'P1' | 'P2' | 'P3' | 'info'; title: string; tenantId?: string; service?: string; actor?: string; }
interface ModelRun { ts: string; subjectId: string; latencyMs: number; inputTokens: number; outputTokens: number; cacheHit: boolean; status: 'ok' | 'error'; }
interface TenantModelConfig { tenantId: string; name: string; model: string; version: string; isPinned: boolean; monthlyTokens: number; cacheHitRate: number; p99Ms: number; }
interface ServiceRelease { service: string; label: string; currentVersion: string; pendingVersion: string | null; }
interface TenantRelease { tenantId: string; name: string; stage: ReleaseStage; versions: Record<string, string>; }

const TF_FILES: TfFile[] = ['main.tf', 'backend.tf', 'dev.tfvars', 'prod.tfvars'];

const SERVICES = [
  { id: 'ella',       tag: 'AI · Bedrock', label: 'Ella',            path: 'services/ella/',        tests: 11,   desc: 'Twice-daily Claude Sonnet narrative per subject via Bedrock — de-identified summaries stored in DynamoDB for clinical staff.', tf: true,  lambdaFn: 'ambient-dev-ella' },
  { id: 'api',        tag: 'REST API',     label: 'Nurse/Admin API', path: 'services/api/',         tests: 19,   desc: 'FastAPI + Cognito JWT with row-level facility scoping. Twelve endpoints serving staff web and mobile clients.', tf: true,  lambdaFn: 'ambient-dev-api' },
  { id: 'telemetry',  tag: 'Streaming',    label: 'Telemetry',       path: 'services/telemetry/',   tests: 15,   desc: 'Fall-alert Lambda → SNS for sub-2s staff notification; per-minute aggregates → Firehose → Parquet on S3.', tf: true,  lambdaFn: 'ambient-dev-alerts-enricher' },
  { id: 'admin-cli',  tag: 'CLI',          label: 'Admin CLI',       path: 'services/admin-cli/',   tests: 28,   desc: 'Operator CLI for device provisioning — mints tenant X.509 certs and registers rooms in DynamoDB.', tf: false, lambdaFn: null },
  { id: 'url-minter', tag: 'Upload',       label: 'URL Minter',      path: 'services/url-minter/',  tests: null, desc: 'Presigned S3 upload URLs for device Parquet batches — eliminates MQTT overhead for analytic cold-path data.', tf: true,  lambdaFn: 'ambient-dev-url-minter' },
  { id: 'athena',     tag: 'Analytics',    label: 'Athena',          path: 'services/athena/',      tests: null, desc: 'Glue table and partition projection for raw radar frames on the cold path — queryable without ETL.', tf: true,  lambdaFn: null },
  { id: 'cloudtrail',    tag: 'Audit',      label: 'CloudTrail',      path: 'services/cloudtrail/',    tests: null, desc: 'Data-event audit logging on all sensitive DynamoDB tables — every read/write attributed for HIPAA compliance.', tf: true,  lambdaFn: null },
  { id: 'iot-core',     tag: 'IoT',        label: 'IoT Core',        path: 'services/iot-core/',      tests: null, desc: 'Role alias (temp AWS creds for devices via mTLS), Device Shadow, and IoT Rules for fall-enricher and legacy Firehose paths.', tf: true,  lambdaFn: null },
  { id: 'kms',          tag: 'Security',   label: 'KMS',             path: 'services/kms/',           tests: null, desc: 'Tenant CMK with 30-day deletion window, automatic annual rotation, and scoped key policy for DynamoDB, S3, SNS, and SQS.', tf: true,  lambdaFn: null },
  { id: 'observability',tag: 'Monitoring', label: 'Observability',   path: 'services/observability/', tests: null, desc: 'CloudWatch Metric Streams to central account — scalar metrics only (Lambda, DynamoDB, Ambient/* namespace). No PHI crosses the boundary.', tf: true,  lambdaFn: null },
];

const PATHS = [
  { label: 'Hot path',       tag: '< 2s',       flow: ['Device MQTT', 'IoT Rule', 'Lambda', 'DynamoDB', 'SNS → Staff'],                            desc: 'Fall alerts. QoS 1 guaranteed delivery, sub-2-second latency budget.' },
  { label: 'Cold path',      tag: 'New',         flow: ['Device (5-min Parquet)', 'url-minter', 'Presigned URL', 'S3'],                             desc: 'Device writes Parquet batches locally and uploads directly to S3 — no MQTT for analytic data.' },
  { label: 'Cold path',      tag: 'Legacy',      flow: ['Device MQTT', 'IoT Rule', 'Firehose', 'S3 (JSON→Parquet)'],                                desc: 'Being retired. Dual-writes alongside the new path during migration.' },
  { label: 'Narrative',      tag: '12h cadence', flow: ['EventBridge cron', 'SQS fanout', 'Ella Lambda', 'Bedrock Claude', 'DynamoDB'],             desc: 'De-identified daily summaries generated per subject, surfaced in the Nurse Dashboard.' },
  { label: 'Nurse/Admin API',tag: 'REST',        flow: ['API Gateway', 'Cognito JWT', 'FastAPI Lambda', 'DynamoDB'],                                desc: 'Twelve endpoints, row-level facility scoping.' },
];

const ACCOUNTS = [
  { label: 'Tenant plane',          count: 'One per org', items: ['Fall alerts (hot)', 'Telemetry (cold)', 'Ella narratives', 'Nurse/Admin API', 'Tenant CMK (KMS)', 'CloudTrail audit'] },
  { label: 'Control plane',         count: 'One (us)',    items: ['Fleet provisioning', 'Bootstrap cert issuance', 'Tenant registry', 'Service Catalog'] },
  { label: 'Central observability', count: 'One (us)',    items: ['Scalar metrics only', 'No logs or traces', 'No PHI crosses boundary', 'TelemetryDivergence', 'Fall rate per facility'] },
];

const RUNBOOKS = [
  'API 5xx', 'Auth login failure', 'Cost spike', 'Device offline',
  'Escalation', 'Fall alert — false positive', 'Fall alert — missed',
  'IRB data request', 'Narrative broken', 'Telemetry gap',
];

// ── Feature data ──────────────────────────────────────────────────────────────

const METRIC_SERIES = {
  apiErrors:  { label: 'Lambda Errors',        unit: '/hr',  color: '#f85149', good: 'low'  as const, data: [2,1,3,0,0,1,0,2,1,0,0,1,3,2,0,1,0,0,2,1,0,0,1,2] },
  fallAlerts: { label: 'Fall Alerts',           unit: '/hr',  color: '#d29922', good: 'low'  as const, data: [3,2,4,1,2,3,2,1,2,3,4,2,1,2,3,2,1,2,3,2,1,2,3,2] },
  ellaSuc:    { label: 'Ella Success Rate',     unit: '%',    color: '#3fb950', good: 'high' as const, data: [100,100,98,100,100,100,100,98,100,100,100,100,98,100,100,100,100,98,100,100,100,100,98,100] },
  divergence: { label: 'Telemetry Divergence', unit: 'rows', color: '#8b949e', good: 'low'  as const, data: [0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0] },
  dlqDepth:   { label: 'Ella DLQ Depth',       unit: 'msgs', color: '#f85149', good: 'low'  as const, data: [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0] },
  urlsMinted: { label: 'URLs Minted',          unit: '/min', color: '#388bfd', good: 'high' as const, data: [42,45,48,41,39,44,47,50,43,46,44,42,48,51,47,43,45,48,44,46,43,47,50,44] },
};
const LAMBDA_METRICS: Record<string, { p99ms: number; errors: number; invocations: number }> = {
  ella: { p99ms: 4210, errors: 0, invocations: 2 }, api: { p99ms: 312, errors: 1, invocations: 847 },
  telemetry: { p99ms: 89, errors: 0, invocations: 1204 }, 'url-minter': { p99ms: 145, errors: 0, invocations: 2640 },
};
const TENANTS_INITIAL: Tenant[] = [
  { id: 'riverview',  name: 'Riverview Senior Living', accountId: '234567890123', region: 'us-east-1', rooms: 48, services: 10, lastDeploy: '2026-04-28', status: 'healthy' },
  { id: 'sunridge',   name: 'Sunridge Memory Care',    accountId: '345678901234', region: 'us-west-2', rooms: 32, services: 10, lastDeploy: '2026-04-22', status: 'healthy' },
  { id: 'maplewood',  name: 'Maplewood Gardens',       accountId: '456789012345', region: 'us-east-1', rooms: 24, services:  8, lastDeploy: '2026-03-15', status: 'degraded' },
  { id: 'cedarbrook', name: 'Cedarbrook Living',       accountId: '567890123456', region: 'eu-west-1', rooms: 56, services: 10, lastDeploy: '2026-04-30', status: 'healthy' },
];
const RUNBOOK_DETAILS: Record<string, RunbookDetail> = {
  'API 5xx': { severity: 'P2', ttr: '15 min', escalateTo: 'Backend on-call', steps: ['Check API Gateway → CloudWatch Logs for stack traces','Confirm Lambda health — look for OOM or timeout','Check DynamoDB throttle metrics (ConsumedWriteCapacityUnits spikes)','Verify Cognito JWT authorizer not rejecting valid tokens','If DDB throttle: confirm PAY_PER_REQUEST is set on all tables','Roll back to previous Lambda deployment if error rate > 10%','Page backend on-call if not resolved in 15 min'] },
  'Auth login failure': { severity: 'P2', ttr: '10 min', escalateTo: 'Security on-call', steps: ['Check Cognito User Pool → Sign-in activity for error codes','Confirm ALLOW_USER_SRP_AUTH is enabled on the web client','Verify CORS origins match app.ellamemory.com in API Gateway config','Test with admin-created test user via console','If token-related: check JWT expiry and refresh token rotation settings','Escalate to security on-call if unauthorized access suspected'] },
  'Cost spike': { severity: 'P3', ttr: '30 min', escalateTo: 'Infra lead', steps: ['Open Cost Explorer → filter by service (DynamoDB, Lambda, Bedrock)','Check Athena bytes-scanned-per-query — confirm 10 GB cutoff enforced','Check Ella Lambda invocation count — EventBridge rule should be twice daily only','Confirm Firehose legacy path is not re-enabled accidentally','Review S3 Glacier transition rules — data tiers after 90 days','Tag untagged resources and alert infra lead'] },
  'Device offline': { severity: 'P2', ttr: '20 min', escalateTo: 'Field ops', steps: ['Check IoT Core → Device Shadow for last-reported state','Confirm device_id in DynamoDB devices table','Ping mTLS endpoint — verify cert has not expired (1-year bootstrap)','Check last Parquet upload timestamp in S3 cold path bucket','If cert expired: reprovision via Admin CLI with new X.509 cert','If connectivity issue: escalate to field ops for physical inspection'] },
  'Escalation': { severity: 'P1', ttr: '5 min', escalateTo: 'VP Engineering', steps: ['Acknowledge the incident immediately','Page VP Engineering and security lead','Preserve all CloudTrail logs — do not modify tables','Disable affected IAM roles if unauthorized access suspected','Begin incident timeline doc in shared doc','Notify covered entity compliance officer if PHI breach suspected'] },
  'Fall alert — false positive': { severity: 'P3', ttr: '10 min', escalateTo: 'Clinical team', steps: ['Confirm alert in DynamoDB alerts table (subject_id, event_ts)','Check radar_raw Parquet data for the frame window','Review Device Shadow zone/room assignment — misassignment can cause false alerts','Pull Ella narrative for context — does it corroborate the alert?','If systematic: adjust IoT Rule SQL filter threshold in telemetry module','Document in clinical log with subject_id and timestamp for IRB review'] },
  'Fall alert — missed': { severity: 'P1', ttr: '5 min', escalateTo: 'Clinical on-call + VP Engineering', steps: ['IMMEDIATE: confirm patient wellbeing via nursing staff','Check IoT Core message logs for MQTT topic ambient/{device_id}/fall','Check fall-enricher Lambda logs — did it receive the event?','Verify SNS topic subscription for the facility is active','Check DLQ for fall-enricher — did it fail silently?','Review TelemetryDivergence metric for device health','Escalate to clinical on-call and VP Engineering immediately'] },
  'IRB data request': { severity: 'P3', ttr: '2 days', escalateTo: 'IRB coordinator', steps: ['Verify requestor identity and IRB authorization letter','Pull coded subject_id from devices table — confirm no PII in data','Run Athena query scoped to specific date range and facility','Verify data is HIPAA §164.514(c) compliant — no names, DOBs, MRNs','Export results to CloudTrail-audited S3 path','Coordinate with IRB coordinator for data transfer protocol','Log access event with timestamp and requestor ID'] },
  'Narrative broken': { severity: 'P2', ttr: '20 min', escalateTo: 'AI platform on-call', steps: ['Check Ella Lambda CloudWatch logs for Bedrock API errors','Verify Bedrock model: us.anthropic.claude-sonnet-4-5-20251001-v1:0','Check SQS fanout queue depth and DLQ depth','Confirm Athena workgroup healthy and query not timing out','Test manual invocation of ambient-dev-ella with sample payload','If Bedrock throttled: check service quotas and increase','Verify EventBridge cron rule is enabled (7am + 7pm UTC)'] },
  'Telemetry gap': { severity: 'P2', ttr: '15 min', escalateTo: 'Backend on-call', steps: ['Check TelemetryDivergence CloudWatch metric — expected: 0','Compare Athena row counts: new S3 path vs legacy Firehose path','Check url-minter Lambda — is it issuing presigned URLs? (UrlsIssued metric)','Verify device Parquet uploads arriving in S3 (raw-device/ prefix)','If new path failing: check SigV4 signing and Shadow scope check','If legacy path failing: check Firehose delivery stream status','Page backend on-call if divergence > 100 rows after 15 min'] },
};
const ELLA_NARRATIVES = [
  { subjectId: 'PILOT-2847', facility: 'Riverview · Room 112', date: '2026-05-04', amPm: 'PM', tokens: 312, text: 'No fall events recorded in the past 12 hours. Overnight movement patterns (10:45 PM – 6:12 AM) suggest consistent sleep with a brief bathroom visit at 3:17 AM — duration approximately 4 minutes, normal range. Daytime activity moderate: prolonged stationary periods at 9:20 AM and 1:45 PM consistent with seated rest. No anomalous radar signatures detected. Fall risk assessment: low.' },
  { subjectId: 'PILOT-3104', facility: 'Riverview · Room 208', date: '2026-05-04', amPm: 'PM', tokens: 287, text: 'One fall-zone proximity event at 7:33 AM — subject entered the bathroom and paused 18 seconds in a high-risk posture zone before resuming normal movement. No alert threshold crossed. Gait pattern throughout the day shows slight asymmetry consistent with prior clinical notes. Evening activity normal. Recommend clinical review of morning bathroom routine.' },
  { subjectId: 'PILOT-1922', facility: 'Sunridge · Room 44',   date: '2026-05-03', amPm: 'AM', tokens: 298, text: 'Elevated overnight movement: 6 distinct excursions detected between 11 PM and 5 AM (prior baseline: 1–2). No fall events, but increased nocturnal activity warrants nursing staff review. Daytime behavioral pattern nominal. Ella confidence in subject tracking: 97% (single occupancy confirmed via Device Shadow).' },
];
const PLAN_RESOURCES: Record<string, string[]> = {
  ella: ['aws_lambda_function.ella'], api: ['aws_lambda_function.api','aws_apigatewayv2_api.api'],
  telemetry: ['aws_lambda_function.fall_enricher'], 'url-minter': ['aws_lambda_function.url_minter'],
  athena: ['aws_athena_workgroup.main'], cloudtrail: ['aws_cloudtrail.main'],
  'iot-core': ['aws_iot_role_alias.device'], kms: ['aws_kms_key.tenant_cmk'], observability: ['aws_cloudwatch_metric_stream.main'],
};
const SEV_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  P1: { bg: 'rgba(248,81,73,0.12)',  border: 'rgba(248,81,73,0.30)',  color: '#f85149' },
  P2: { bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.30)', color: '#d29922' },
  P3: { bg: 'rgba(56,139,253,0.12)', border: 'rgba(56,139,253,0.30)', color: '#388bfd' },
};
const TST_STYLE: Record<TenantStatus, { bg: string; border: string; color: string; label: string }> = {
  healthy:      { bg: 'rgba(35,134,54,0.12)',  border: 'rgba(35,134,54,0.30)',  color: '#3fb950', label: 'healthy' },
  degraded:     { bg: 'rgba(248,81,73,0.12)',  border: 'rgba(248,81,73,0.30)',  color: '#f85149', label: 'degraded' },
  provisioning: { bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.30)', color: '#d29922', label: 'provisioning' },
};

// ── Device fleet data ─────────────────────────────────────────────────────────

const FLEET_DATA: FacilityData[] = [
  { tenantId: 'riverview', name: 'Riverview Senior Living', region: 'us-east-1', rooms: [
    { room: '112', deviceId: 'AMB-DEV-0041', subjectId: 'PILOT-2847', status: 'online',   lastSeen: '1 min ago',    lastParquet: '3 min ago',    firmware: '2.4.1', certDaysLeft: 287, fallAlerts7d: 0 },
    { room: '114', deviceId: 'AMB-DEV-0042', subjectId: 'PILOT-2831', status: 'online',   lastSeen: '2 min ago',    lastParquet: '2 min ago',    firmware: '2.4.1', certDaysLeft: 290, fallAlerts7d: 1 },
    { room: '208', deviceId: 'AMB-DEV-0043', subjectId: 'PILOT-3104', status: 'online',   lastSeen: '1 min ago',    lastParquet: '4 min ago',    firmware: '2.4.1', certDaysLeft: 271, fallAlerts7d: 0 },
    { room: '211', deviceId: 'AMB-DEV-0044', subjectId: 'PILOT-3118', status: 'degraded', lastSeen: '18 min ago',   lastParquet: '23 min ago',   firmware: '2.3.9', certDaysLeft: 156, fallAlerts7d: 2 },
    { room: '215', deviceId: 'AMB-DEV-0045', subjectId: 'PILOT-3099', status: 'online',   lastSeen: '1 min ago',    lastParquet: '5 min ago',    firmware: '2.4.1', certDaysLeft: 283, fallAlerts7d: 0 },
    { room: '301', deviceId: 'AMB-DEV-0046', subjectId: 'PILOT-2902', status: 'online',   lastSeen: '2 min ago',    lastParquet: '6 min ago',    firmware: '2.4.1', certDaysLeft: 265, fallAlerts7d: 0 },
  ]},
  { tenantId: 'sunridge', name: 'Sunridge Memory Care', region: 'us-west-2', rooms: [
    { room: '44',  deviceId: 'AMB-DEV-0091', subjectId: 'PILOT-1922', status: 'online',  lastSeen: '1 min ago',    lastParquet: '4 min ago',    firmware: '2.4.1', certDaysLeft: 301, fallAlerts7d: 0 },
    { room: '45',  deviceId: 'AMB-DEV-0092', subjectId: 'PILOT-1944', status: 'online',  lastSeen: '3 min ago',    lastParquet: '7 min ago',    firmware: '2.4.1', certDaysLeft: 298, fallAlerts7d: 0 },
    { room: '52',  deviceId: 'AMB-DEV-0093', subjectId: 'PILOT-2011', status: 'offline', lastSeen: '2h 14m ago',   lastParquet: '2h 18m ago',   firmware: '2.4.1', certDaysLeft: 288, fallAlerts7d: 0 },
    { room: '58',  deviceId: 'AMB-DEV-0094', subjectId: 'PILOT-2033', status: 'online',  lastSeen: '1 min ago',    lastParquet: '5 min ago',    firmware: '2.4.0', certDaysLeft: 24,  fallAlerts7d: 1 },
  ]},
  { tenantId: 'maplewood', name: 'Maplewood Gardens', region: 'us-east-1', rooms: [
    { room: '101', deviceId: 'AMB-DEV-0151', subjectId: 'PILOT-4401', status: 'online',  lastSeen: '2 min ago',    lastParquet: '6 min ago',    firmware: '2.3.9', certDaysLeft: 178, fallAlerts7d: 0 },
    { room: '103', deviceId: 'AMB-DEV-0152', subjectId: 'PILOT-4412', status: 'offline', lastSeen: '5h 31m ago',   lastParquet: '5h 35m ago',   firmware: '2.3.9', certDaysLeft: 166, fallAlerts7d: 0 },
    { room: '107', deviceId: 'AMB-DEV-0153', subjectId: 'PILOT-4428', status: 'online',  lastSeen: '1 min ago',    lastParquet: '3 min ago',    firmware: '2.3.9', certDaysLeft: 172, fallAlerts7d: 3 },
  ]},
  { tenantId: 'cedarbrook', name: 'Cedarbrook Living', region: 'eu-west-1', rooms: [
    { room: '201', deviceId: 'AMB-DEV-0201', subjectId: 'PILOT-5501', status: 'online', lastSeen: '1 min ago',    lastParquet: '2 min ago',    firmware: '2.4.1', certDaysLeft: 341, fallAlerts7d: 0 },
    { room: '203', deviceId: 'AMB-DEV-0202', subjectId: 'PILOT-5514', status: 'online', lastSeen: '2 min ago',    lastParquet: '4 min ago',    firmware: '2.4.1', certDaysLeft: 338, fallAlerts7d: 0 },
    { room: '205', deviceId: 'AMB-DEV-0203', subjectId: 'PILOT-5528', status: 'online', lastSeen: '1 min ago',    lastParquet: '3 min ago',    firmware: '2.4.1', certDaysLeft: 335, fallAlerts7d: 1 },
    { room: '208', deviceId: 'AMB-DEV-0204', subjectId: 'PILOT-5541', status: 'online', lastSeen: '2 min ago',    lastParquet: '5 min ago',    firmware: '2.4.1', certDaysLeft: 328, fallAlerts7d: 0 },
  ]},
];
const DEV_STYLE: Record<DeviceStatus, { border: string; dot: string; bg: string }> = {
  online:   { border: 'rgba(35,134,54,0.30)',  dot: '#3fb950', bg: 'rgba(35,134,54,0.05)' },
  degraded: { border: 'rgba(210,153,34,0.35)', dot: '#d29922', bg: 'rgba(210,153,34,0.06)' },
  offline:  { border: 'rgba(248,81,73,0.35)',  dot: '#f85149', bg: 'rgba(248,81,73,0.06)' },
};

// ── CI/CD pipeline data ───────────────────────────────────────────────────────

const PIPELINE_DATA: ServicePipeline[] = [
  { serviceId: 'ella', label: 'Ella', runs: [
    { sha: '3fa7fde', message: 'fix(ella): increase Bedrock timeout to 270s', author: 'brbradley', startedAt: '2026-05-06 09:14', duration: '2m 41s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '8s' }, { name: 'test', status: 'passing', duration: '34s' },
      { name: 'build', status: 'passing', duration: '51s' }, { name: 'plan', status: 'passing', duration: '23s' }, { name: 'deploy', status: 'passing', duration: '45s' },
    ]},
    { sha: 'a1b2c3d', message: 'feat(ella): add SQS DLQ with 3x retry', author: 'brbradley', startedAt: '2026-05-04 16:22', duration: '2m 58s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '7s' }, { name: 'test', status: 'passing', duration: '41s' },
      { name: 'build', status: 'passing', duration: '48s' }, { name: 'plan', status: 'passing', duration: '28s' }, { name: 'deploy', status: 'passing', duration: '54s' },
    ]},
    { sha: 'e9d1f2a', message: 'chore(ella): bump claude-sonnet-4-5 model id', author: 'brbradley', startedAt: '2026-04-29 11:05', duration: '1m 19s', status: 'failing', stages: [
      { name: 'lint', status: 'passing', duration: '9s' }, { name: 'test', status: 'failing', duration: '24s' },
      { name: 'build', status: 'skipped', duration: '—' }, { name: 'plan', status: 'skipped', duration: '—' }, { name: 'deploy', status: 'skipped', duration: '—' },
    ]},
  ]},
  { serviceId: 'api', label: 'Nurse/Admin API', runs: [
    { sha: '3fa7fde', message: 'feat(api): add /subjects/:id/narratives endpoint', author: 'brbradley', startedAt: '2026-05-06 09:14', duration: '3m 12s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '6s' }, { name: 'test', status: 'passing', duration: '1m 02s' },
      { name: 'build', status: 'passing', duration: '44s' }, { name: 'plan', status: 'passing', duration: '19s' }, { name: 'deploy', status: 'passing', duration: '41s' },
    ]},
    { sha: 'b7c4e1f', message: 'fix(api): scope DDB queries to facilityId', author: 'brbradley', startedAt: '2026-05-01 14:38', duration: '3m 04s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '7s' }, { name: 'test', status: 'passing', duration: '58s' },
      { name: 'build', status: 'passing', duration: '41s' }, { name: 'plan', status: 'passing', duration: '20s' }, { name: 'deploy', status: 'passing', duration: '38s' },
    ]},
  ]},
  { serviceId: 'telemetry', label: 'Telemetry', runs: [
    { sha: '3fa7fde', message: 'perf(telemetry): batch SNS publishes', author: 'brbradley', startedAt: '2026-05-06 09:14', duration: '1m 58s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '5s' }, { name: 'test', status: 'passing', duration: '44s' },
      { name: 'build', status: 'passing', duration: '22s' }, { name: 'plan', status: 'passing', duration: '14s' }, { name: 'deploy', status: 'passing', duration: '33s' },
    ]},
  ]},
  { serviceId: 'url-minter', label: 'URL Minter', runs: [
    { sha: '3fa7fde', message: 'fix(url-minter): validate Shadow scope before presign', author: 'brbradley', startedAt: '2026-05-06 09:14', duration: '1m 22s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '5s' }, { name: 'test', status: 'passing', duration: '31s' },
      { name: 'build', status: 'passing', duration: '18s' }, { name: 'plan', status: 'passing', duration: '11s' }, { name: 'deploy', status: 'passing', duration: '17s' },
    ]},
  ]},
  { serviceId: 'athena', label: 'Athena', runs: [
    { sha: 'c2e8a91', message: 'feat(athena): add UNION ALL view for new+legacy paths', author: 'brbradley', startedAt: '2026-04-21 10:00', duration: '1m 05s', status: 'passing', stages: [
      { name: 'lint', status: 'passing', duration: '4s' }, { name: 'test', status: 'skipped', duration: '—' },
      { name: 'build', status: 'passing', duration: '12s' }, { name: 'plan', status: 'passing', duration: '16s' }, { name: 'deploy', status: 'passing', duration: '33s' },
    ]},
  ]},
];
const PIPE_STYLE: Record<PipelineStatus, { bg: string; border: string; color: string; label: string }> = {
  passing: { bg: 'rgba(35,134,54,0.12)',  border: 'rgba(35,134,54,0.30)',  color: '#3fb950', label: 'passing' },
  failing: { bg: 'rgba(248,81,73,0.12)',  border: 'rgba(248,81,73,0.30)',  color: '#f85149', label: 'failing' },
  running: { bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.30)', color: '#d29922', label: 'running' },
  queued:  { bg: 'rgba(139,148,158,0.12)',border: 'rgba(139,148,158,0.30)',color: '#8b949e', label: 'queued'  },
  skipped: { bg: 'rgba(139,148,158,0.06)',border: 'rgba(139,148,158,0.15)',color: '#6e7681', label: 'skipped' },
};

// ── Cost data ─────────────────────────────────────────────────────────────────

const SERVICE_COSTS: ServiceCost[] = [
  { serviceId: 'ella',        label: 'Bedrock (Ella)',     color: '#8b5cf6', monthly: 24, breakdown: [{ label: 'Claude Sonnet — input',  amount: 6.91, sub: '2880 runs × 800 tokens' }, { label: 'Claude Sonnet — output', amount: 17.28, sub: '2880 runs × 400 tokens' }] },
  { serviceId: 'ella-lambda', label: 'Lambda — Ella',      color: '#7c22ce', monthly: 7,  breakdown: [{ label: 'Compute (GB-sec)',        amount: 6.48, sub: '388k GB-sec/month' }, { label: 'Invocations', amount: 0.06 }] },
  { serviceId: 'dynamodb',    label: 'DynamoDB',           color: '#388bfd', monthly: 12, breakdown: [{ label: 'Write capacity',          amount: 7.20, sub: 'alerts + updates tables' }, { label: 'Read capacity', amount: 4.80 }] },
  { serviceId: 's3',          label: 'S3',                 color: '#1d4ed8', monthly: 14, breakdown: [{ label: 'Storage (Parquet)',        amount: 8.10, sub: '20.7 GB/month' }, { label: 'CloudTrail logs', amount: 3.20 }, { label: 'PUT requests', amount: 2.70 }] },
  { serviceId: 'api-lambda',  label: 'Lambda — API',       color: '#0ea5e9', monthly: 4,  breakdown: [{ label: 'Compute (GB-sec)',        amount: 3.21 }, { label: 'Invocations', amount: 0.61 }] },
  { serviceId: 'telemetry-l', label: 'Lambda — Telemetry', color: '#b91c1c', monthly: 9,  breakdown: [{ label: 'Compute (GB-sec)',        amount: 8.12 }, { label: 'Invocations', amount: 0.87 }] },
  { serviceId: 'athena',      label: 'Athena',             color: '#15803d', monthly: 11, breakdown: [{ label: 'Bytes scanned',           amount: 10.50, sub: '~420 GB/month scanned' }, { label: 'Workgroup overhead', amount: 0.50 }] },
  { serviceId: 'iot',         label: 'IoT Core',           color: '#c2410c', monthly: 4,  breakdown: [{ label: 'Messages (MQTT)',         amount: 2.10 }, { label: 'Device Shadow', amount: 1.90 }] },
  { serviceId: 'cloudwatch',  label: 'CloudWatch',         color: '#4338ca', monthly: 6,  breakdown: [{ label: 'Metric Streams',          amount: 3.40 }, { label: 'Log storage', amount: 2.60 }] },
  { serviceId: 'kms',         label: 'KMS',                color: '#a16207', monthly: 3,  breakdown: [{ label: 'Key operations',          amount: 2.40 }, { label: 'Key storage', amount: 0.60 }] },
  { serviceId: 'url-lambda',  label: 'Lambda — URL Minter',color: '#0f766e', monthly: 2,  breakdown: [{ label: 'Compute (GB-sec)',        amount: 1.62 }, { label: 'Invocations', amount: 0.38 }] },
];
const COST_TREND = [74, 78, 82, 88, 93, 96, 101]; // last 7 months

// ── Security & Compliance data ────────────────────────────────────────────────

const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'a1', ts: '2026-05-06 09:41', tenantId: 'riverview',  action: 'dynamodb:GetItem',           principal: 'ambient-dev-ella',      resource: 'ambient-dev-devices',    outcome: 'success', severity: 'info' },
  { id: 'a2', ts: '2026-05-06 09:38', tenantId: 'maplewood',  action: 'iam:GetRole',                 principal: 'IAMUser/ops-admin',     resource: 'ambient-dev-ella-role',  outcome: 'success', severity: 'info' },
  { id: 'a3', ts: '2026-05-06 08:22', tenantId: 'sunridge',   action: 's3:GetObject',                principal: 'UnauthorizedEntity',    resource: 'ambient-dev-raw-device/',outcome: 'denied',  severity: 'critical' },
  { id: 'a4', ts: '2026-05-06 07:19', tenantId: 'cedarbrook', action: 'kms:Decrypt',                 principal: 'ambient-dev-api',       resource: 'alias/ambient-cmk',      outcome: 'success', severity: 'info' },
  { id: 'a5', ts: '2026-05-05 22:14', tenantId: 'riverview',  action: 'cognito-idp:AdminCreateUser', principal: 'IAMUser/brbradley',     resource: 'us-east-1_RiverviewPool',outcome: 'success', severity: 'warning' },
  { id: 'a6', ts: '2026-05-05 19:07', tenantId: 'maplewood',  action: 'lambda:InvokeFunction',       principal: 'events.amazonaws.com',  resource: 'ambient-dev-ella',       outcome: 'success', severity: 'info' },
  { id: 'a7', ts: '2026-05-05 14:55', tenantId: 'sunridge',   action: 'iam:AttachRolePolicy',        principal: 'IAMUser/brbradley',     resource: 'ambient-dev-ella-role',  outcome: 'success', severity: 'warning' },
  { id: 'a8', ts: '2026-05-04 11:23', tenantId: 'cedarbrook', action: 'cloudtrail:StopLogging',      principal: 'IAMUser/ops-admin',     resource: 'ambient-prod-trail',     outcome: 'denied',  severity: 'critical' },
];
const KMS_KEYS: KmsKey[] = [
  { keyId: 'mrk-a1b2c3d4', alias: 'ambient-cmk', tenantId: 'riverview',  rotation: true, nextRotation: '2027-05-06', daysUntil: 365, status: 'active' },
  { keyId: 'mrk-e5f6g7h8', alias: 'ambient-cmk', tenantId: 'sunridge',   rotation: true, nextRotation: '2027-04-22', daysUntil: 351, status: 'active' },
  { keyId: 'mrk-i9j0k1l2', alias: 'ambient-cmk', tenantId: 'maplewood',  rotation: true, nextRotation: '2026-06-15', daysUntil: 40,  status: 'expiring' },
  { keyId: 'mrk-m3n4o5p6', alias: 'ambient-cmk', tenantId: 'cedarbrook', rotation: true, nextRotation: '2027-04-30', daysUntil: 359, status: 'active' },
];
const SOC2_CONTROLS: Soc2Control[] = [
  { id: 'CC6.1', title: 'Logical access controls',  status: 'pass',   evidence: 'Cognito JWT + IAM row-scoping on all DynamoDB tables',          lastChecked: '2026-05-01' },
  { id: 'CC6.2', title: 'New user provisioning',    status: 'pass',   evidence: 'Admin CLI cert issuance — full CloudTrail audit trail',          lastChecked: '2026-05-01' },
  { id: 'CC6.3', title: 'Least privilege',          status: 'review', evidence: 'IAM role review pending for Maplewood tenant expansion',          lastChecked: '2026-04-28' },
  { id: 'CC7.2', title: 'System monitoring',        status: 'pass',   evidence: 'CloudWatch + central observability account (scalar only)',        lastChecked: '2026-05-01' },
  { id: 'CC8.1', title: 'Change management',        status: 'pass',   evidence: 'All deploys via GitHub Actions + Terraform plan → apply',        lastChecked: '2026-05-06' },
  { id: 'CC9.2', title: 'Risk mitigation',          status: 'pass',   evidence: 'CloudTrail data-events on all sensitive DynamoDB tables',        lastChecked: '2026-05-01' },
  { id: 'A1.2',  title: 'System availability',      status: 'pass',   evidence: 'Multi-AZ Lambda + DynamoDB PAY_PER_REQUEST across all regions',  lastChecked: '2026-05-01' },
  { id: 'PI1.4', title: 'Privacy notice',           status: 'fail',   evidence: 'HIPAA BAA pending for Maplewood tenant — not yet executed',       lastChecked: '2026-04-15' },
];

// ── Incident timeline data ────────────────────────────────────────────────────

const INCIDENT_EVENTS: IncidentEvent[] = [
  { id: 'i1',  ts: '2026-05-06 09:14', type: 'deploy',   severity: 'info', title: 'Deploy sha:3fa7fde — ella, api, telemetry, url-minter',               actor: 'brbradley' },
  { id: 'i2',  ts: '2026-05-06 08:22', type: 'alert',    severity: 'P1',   title: 'Unauthorized S3:GetObject denied — Sunridge raw-device bucket',        tenantId: 'sunridge',   service: 'cloudtrail' },
  { id: 'i3',  ts: '2026-05-06 07:33', type: 'alert',    severity: 'P3',   title: 'Fall-zone proximity event — PILOT-3104 · Riverview Room 208',          tenantId: 'riverview',  service: 'telemetry' },
  { id: 'i4',  ts: '2026-05-05 22:14', type: 'config',   severity: 'info', title: 'Cognito user provisioned — Riverview tenant',                           tenantId: 'riverview',  actor: 'brbradley' },
  { id: 'i5',  ts: '2026-05-05 19:07', type: 'alert',    severity: 'P2',   title: 'Ella DLQ received 1 message — fanout queue backpressure',              tenantId: 'riverview',  service: 'ella' },
  { id: 'i6',  ts: '2026-05-05 19:24', type: 'runbook',  severity: 'P2',   title: 'Runbook "Narrative broken" executed',                                   tenantId: 'riverview',  actor: 'brbradley' },
  { id: 'i7',  ts: '2026-05-05 19:41', type: 'resolved', severity: 'info', title: 'Ella DLQ cleared — Bedrock timeout increased to 270s',                  tenantId: 'riverview',  actor: 'brbradley' },
  { id: 'i8',  ts: '2026-05-05 14:55', type: 'config',   severity: 'info', title: 'IAM role policy updated — Ella Lambda Bedrock permissions',             tenantId: 'sunridge',   actor: 'brbradley' },
  { id: 'i9',  ts: '2026-05-04 16:22', type: 'deploy',   severity: 'info', title: 'Deploy sha:a1b2c3d — ella (SQS DLQ + 3x retry)',                        actor: 'brbradley' },
  { id: 'i10', ts: '2026-04-29 11:05', type: 'alert',    severity: 'P2',   title: 'CI/CD: ella tests failing — model ID bump broke mock',                  service: 'ella' },
  { id: 'i11', ts: '2026-04-29 11:38', type: 'resolved', severity: 'info', title: 'ella tests fixed — mock updated to claude-sonnet-4-5',                  actor: 'brbradley' },
  { id: 'i12', ts: '2026-04-28 10:00', type: 'deploy',   severity: 'info', title: 'Deploy sha:3fa7fde — Riverview tenant production promote',               tenantId: 'riverview',  actor: 'brbradley' },
];

// ── Model performance data ────────────────────────────────────────────────────

const MODEL_RUNS: ModelRun[] = [
  { ts: '2026-05-06 19:00', subjectId: 'PILOT-2847', latencyMs: 3841,  inputTokens: 812, outputTokens: 312, cacheHit: true,  status: 'ok' },
  { ts: '2026-05-06 19:00', subjectId: 'PILOT-3104', latencyMs: 4210,  inputTokens: 798, outputTokens: 287, cacheHit: false, status: 'ok' },
  { ts: '2026-05-06 19:00', subjectId: 'PILOT-2831', latencyMs: 3920,  inputTokens: 821, outputTokens: 301, cacheHit: true,  status: 'ok' },
  { ts: '2026-05-06 07:00', subjectId: 'PILOT-2847', latencyMs: 4100,  inputTokens: 809, outputTokens: 318, cacheHit: false, status: 'ok' },
  { ts: '2026-05-06 07:00', subjectId: 'PILOT-3104', latencyMs: 3760,  inputTokens: 795, outputTokens: 292, cacheHit: true,  status: 'ok' },
  { ts: '2026-05-05 19:00', subjectId: 'PILOT-1922', latencyMs: 18240, inputTokens: 834, outputTokens: 0,   cacheHit: false, status: 'error' },
  { ts: '2026-05-05 19:00', subjectId: 'PILOT-2847', latencyMs: 3990,  inputTokens: 807, outputTokens: 309, cacheHit: true,  status: 'ok' },
  { ts: '2026-05-05 07:00', subjectId: 'PILOT-2847', latencyMs: 4050,  inputTokens: 811, outputTokens: 315, cacheHit: true,  status: 'ok' },
];
const TENANT_MODEL_CONFIGS: TenantModelConfig[] = [
  { tenantId: 'riverview',  name: 'Riverview Senior Living', model: 'claude-sonnet-4-5-20251001', version: 'v1:0', isPinned: true,  monthlyTokens: 1840000, cacheHitRate: 71, p99Ms: 4210 },
  { tenantId: 'sunridge',   name: 'Sunridge Memory Care',    model: 'claude-sonnet-4-5-20251001', version: 'v1:0', isPinned: true,  monthlyTokens: 1228800, cacheHitRate: 68, p99Ms: 3980 },
  { tenantId: 'maplewood',  name: 'Maplewood Gardens',       model: 'claude-sonnet-4-5-20251001', version: 'v1:0', isPinned: false, monthlyTokens: 921600,  cacheHitRate: 64, p99Ms: 4380 },
  { tenantId: 'cedarbrook', name: 'Cedarbrook Living',       model: 'claude-sonnet-4-5-20251001', version: 'v1:0', isPinned: true,  monthlyTokens: 2150400, cacheHitRate: 73, p99Ms: 3840 },
];

// ── Release manager data ──────────────────────────────────────────────────────

const SERVICE_RELEASES: ServiceRelease[] = [
  { service: 'ella',       label: 'Ella',           currentVersion: 'v2.4.1', pendingVersion: 'v2.5.0' },
  { service: 'api',        label: 'Nurse/Admin API', currentVersion: 'v3.1.2', pendingVersion: 'v3.2.0' },
  { service: 'telemetry',  label: 'Telemetry',       currentVersion: 'v1.8.4', pendingVersion: null },
  { service: 'url-minter', label: 'URL Minter',      currentVersion: 'v1.2.1', pendingVersion: 'v1.3.0' },
];
const TENANT_RELEASES_INITIAL: TenantRelease[] = [
  { tenantId: 'riverview',  name: 'Riverview Senior Living', stage: 'canary',  versions: { ella: 'v2.5.0', api: 'v3.2.0', telemetry: 'v1.8.4', 'url-minter': 'v1.3.0' } },
  { tenantId: 'sunridge',   name: 'Sunridge Memory Care',    stage: 'partial', versions: { ella: 'v2.4.1', api: 'v3.2.0', telemetry: 'v1.8.4', 'url-minter': 'v1.3.0' } },
  { tenantId: 'maplewood',  name: 'Maplewood Gardens',       stage: 'held',    versions: { ella: 'v2.4.1', api: 'v3.1.2', telemetry: 'v1.8.4', 'url-minter': 'v1.2.1' } },
  { tenantId: 'cedarbrook', name: 'Cedarbrook Living',       stage: 'full',    versions: { ella: 'v2.5.0', api: 'v3.2.0', telemetry: 'v1.8.4', 'url-minter': 'v1.3.0' } },
];
const RELEASE_STAGE_STYLE: Record<ReleaseStage, { bg: string; border: string; color: string; label: string }> = {
  canary:  { bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.30)', color: '#d29922', label: 'canary' },
  partial: { bg: 'rgba(56,139,253,0.12)', border: 'rgba(56,139,253,0.30)', color: '#388bfd', label: 'partial' },
  full:    { bg: 'rgba(35,134,54,0.12)',  border: 'rgba(35,134,54,0.30)',  color: '#3fb950', label: 'full' },
  held:    { bg: 'rgba(248,81,73,0.12)',  border: 'rgba(248,81,73,0.30)',  color: '#f85149', label: 'held' },
};

// ── Terraform content per service ─────────────────────────────────────────────

const TF_CONTENT: Record<string, Record<TfFile, string>> = {
  ella: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-ella"
}

variable "environment"           { type = string }
variable "device_table"          { type = string }
variable "alert_table"           { type = string }
variable "telemetry_database"    { type = string }
variable "athena_workgroup"      { type = string }
variable "athena_output"         { type = string }
variable "athena_results_bucket" { type = string }
variable "kms_key_arn"           { type = string; default = "" }

resource "aws_sqs_queue" "dlq" {
  name                      = "\${local.name}-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = "alias/aws/sqs"
}

resource "aws_sqs_queue" "fanout" {
  name                       = "\${local.name}-fanout"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_dynamodb_table" "updates" {
  name         = "\${local.name}-updates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subject_id"
  range_key    = "date"

  attribute { name = "subject_id" type = "S" }
  attribute { name = "date"       type = "S" }

  ttl { attribute_name = "expires_at" enabled = true }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn != "" ? var.kms_key_arn : null
  }
}

resource "aws_lambda_function" "ella" {
  function_name = local.name
  role          = aws_iam_role.ella.arn
  runtime       = "python3.12"
  handler       = "handler.lambda_handler"
  timeout       = 270
  memory_size   = 512

  filename         = data.archive_file.ella.output_path
  source_code_hash = data.archive_file.ella.output_base64sha256

  environment {
    variables = {
      DEVICE_TABLE     = var.device_table
      ALERT_TABLE      = var.alert_table
      UPDATES_TABLE    = aws_dynamodb_table.updates.name
      ATHENA_DATABASE  = var.telemetry_database
      ATHENA_WORKGROUP = var.athena_workgroup
      ATHENA_OUTPUT    = var.athena_output
      BEDROCK_MODEL    = "us.anthropic.claude-sonnet-4-5-20251001-v1:0"
    }
  }
}

resource "aws_cloudwatch_event_rule" "ella_trigger" {
  name                = "\${local.name}-trigger"
  description         = "Trigger Ella narrative generation twice daily"
  schedule_expression = "cron(0 7,19 * * ? *)"
}

resource "aws_cloudwatch_event_target" "ella_lambda" {
  rule      = aws_cloudwatch_event_rule.ella_trigger.name
  target_id = "EllaLambda"
  arn       = aws_lambda_function.ella.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ella.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ella_trigger.arn
}

output "lambda_name"   { value = aws_lambda_function.ella.function_name }
output "updates_table" { value = aws_dynamodb_table.updates.name }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/ella/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment           = "dev"
device_table          = "ambient-dev-devices"
alert_table           = "ambient-dev-telemetry-alerts"
telemetry_database    = "ambient_dev_telemetry"
athena_workgroup      = "ambient-dev-athena"
athena_output         = "s3://ambient-dev-athena-results/queries/"
athena_results_bucket = "ambient-dev-athena-results"`,
    'prod.tfvars':
`environment           = "prod"
device_table          = "ambient-prod-devices"
alert_table           = "ambient-prod-telemetry-alerts"
telemetry_database    = "ambient_prod_telemetry"
athena_workgroup      = "ambient-prod-athena"
athena_output         = "s3://ambient-prod-athena-results/queries/"
athena_results_bucket = "ambient-prod-athena-results"
kms_key_arn           = "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"`,
  },

  api: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-api"
}

variable "environment"           { type = string }
variable "device_table"          { type = string }
variable "alert_table"           { type = string }
variable "update_table"          { type = string }
variable "ella_lambda_name"      { type = string }
variable "telemetry_database"    { type = string }
variable "athena_workgroup"      { type = string }
variable "athena_output"         { type = string }
variable "athena_results_bucket" { type = string }
variable "cors_origins"          { type = string; default = "https://app.ellamemory.com" }

resource "aws_cognito_user_pool" "pool" {
  name                     = "\${local.name}-users"
  auto_verified_attributes = ["email"]

  admin_create_user_config { allow_admin_create_user_only = true }

  password_policy {
    minimum_length    = 12
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "\${local.name}-web"
  user_pool_id = aws_cognito_user_pool.pool.id
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}

resource "aws_apigatewayv2_api" "api" {
  name          = local.name
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = [var.cors_origins]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
  }
}

resource "aws_lambda_function" "api" {
  function_name = local.name
  role          = aws_iam_role.api.arn
  runtime       = "python3.12"
  handler       = "main.handler"
  timeout       = 29
  memory_size   = 256

  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT       = var.environment
      DEVICE_TABLE      = var.device_table
      ALERT_TABLE       = var.alert_table
      UPDATE_TABLE      = var.update_table
      ELLA_LAMBDA       = var.ella_lambda_name
      COGNITO_USER_POOL = aws_cognito_user_pool.pool.id
      ATHENA_DATABASE   = var.telemetry_database
      ATHENA_WORKGROUP  = var.athena_workgroup
      ATHENA_OUTPUT     = var.athena_output
    }
  }
}

output "api_endpoint"    { value = aws_apigatewayv2_api.api.api_endpoint }
output "cognito_pool_id" { value = aws_cognito_user_pool.pool.id }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/api/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment           = "dev"
device_table          = "ambient-dev-devices"
alert_table           = "ambient-dev-telemetry-alerts"
update_table          = "ambient-dev-ella-updates"
ella_lambda_name      = "ambient-dev-ella"
telemetry_database    = "ambient_dev_telemetry"
athena_workgroup      = "ambient-dev-athena"
athena_output         = "s3://ambient-dev-athena-results/queries/"
athena_results_bucket = "ambient-dev-athena-results"
cors_origins          = "http://localhost:3000"`,
    'prod.tfvars':
`environment           = "prod"
device_table          = "ambient-prod-devices"
alert_table           = "ambient-prod-telemetry-alerts"
update_table          = "ambient-prod-ella-updates"
ella_lambda_name      = "ambient-prod-ella"
telemetry_database    = "ambient_prod_telemetry"
athena_workgroup      = "ambient-prod-athena"
athena_output         = "s3://ambient-prod-athena-results/queries/"
athena_results_bucket = "ambient-prod-athena-results"
cors_origins          = "https://app.ellamemory.com"`,
  },

  telemetry: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-telemetry"
}

variable "environment"   { type = string }
variable "device_table"  { type = string }
variable "parquet_bucket"{ type = string }

resource "aws_dynamodb_table" "alerts" {
  name         = "\${local.name}-alerts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subject_id"
  range_key    = "event_ts"

  attribute { name = "subject_id" type = "S" }
  attribute { name = "event_ts"   type = "S" }

  ttl { attribute_name = "expires_at" enabled = true }
}

resource "aws_sns_topic" "fall_alerts" {
  name              = "\${local.name}-fall-alerts"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_kinesis_firehose_delivery_stream" "telemetry" {
  name        = "\${local.name}-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = aws_iam_role.firehose.arn
    bucket_arn          = "arn:aws:s3:::\${var.parquet_bucket}"
    prefix              = "raw/date=!{timestamp:yyyy-MM-dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/"
    buffering_interval  = 300
    buffering_size      = 128

    data_format_conversion_configuration {
      input_format_configuration {
        deserializer { hive_json_ser_de {} }
      }
      output_format_configuration {
        serializer { parquet_ser_de { compression = "SNAPPY" } }
      }
      schema_configuration {
        database_name = "ambient_\${var.environment}_telemetry"
        table_name    = "radar_frames"
        role_arn      = aws_iam_role.firehose.arn
      }
    }
  }
}

resource "aws_lambda_function" "fall_enricher" {
  function_name = "\${local.name}-fall-enricher"
  role          = aws_iam_role.lambda.arn
  runtime       = "python3.12"
  handler       = "handler.lambda_handler"
  timeout       = 15
  memory_size   = 128

  environment {
    variables = {
      ALERTS_TABLE  = aws_dynamodb_table.alerts.name
      SNS_TOPIC_ARN = aws_sns_topic.fall_alerts.arn
      DEVICE_TABLE  = var.device_table
    }
  }
}

output "alerts_table"      { value = aws_dynamodb_table.alerts.name }
output "fall_alerts_topic" { value = aws_sns_topic.fall_alerts.arn }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/telemetry/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment    = "dev"
device_table   = "ambient-dev-devices"
parquet_bucket = "ambient-dev-parquet-data"`,
    'prod.tfvars':
`environment    = "prod"
device_table   = "ambient-prod-devices"
parquet_bucket = "ambient-prod-parquet-data"`,
  },

  'url-minter': {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-url-minter"
}

variable "environment"          { type = string }
variable "telemetry_bucket_name"{ type = string }

resource "aws_dynamodb_table" "devices" {
  name         = "ambient-\${var.environment}-devices"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "device_id"

  attribute { name = "device_id" type = "S" }
}

resource "aws_s3_bucket" "parquet" {
  bucket = var.telemetry_bucket_name
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "parquet" {
  bucket = aws_s3_bucket.parquet.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "parquet" {
  bucket = aws_s3_bucket.parquet.id
  rule {
    id     = "glacier-after-90"
    status = "Enabled"
    transition { days = 90; storage_class = "GLACIER" }
  }
}

resource "aws_lambda_function" "url_minter" {
  function_name = local.name
  role          = aws_iam_role.url_minter.arn
  runtime       = "python3.12"
  handler       = "handler.lambda_handler"
  timeout       = 10
  memory_size   = 128

  environment {
    variables = {
      DEVICE_TABLE = aws_dynamodb_table.devices.name
      BUCKET_NAME  = aws_s3_bucket.parquet.bucket
    }
  }
}

output "device_table_name" { value = aws_dynamodb_table.devices.name }
output "parquet_bucket"    { value = aws_s3_bucket.parquet.bucket }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/url-minter/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment           = "dev"
telemetry_bucket_name = "ambient-dev-parquet-data"`,
    'prod.tfvars':
`environment           = "prod"
telemetry_bucket_name = "ambient-prod-parquet-data"`,
  },

  athena: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-athena"
}

variable "environment"   { type = string }
variable "parquet_bucket"{ type = string }

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "results" {
  bucket = "\${local.name}-results-\${data.aws_caller_identity.current.account_id}"
}

resource "aws_athena_workgroup" "main" {
  name = local.name

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true
    result_configuration {
      output_location = "s3://\${aws_s3_bucket.results.bucket}/queries/"
      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
    bytes_scanned_cutoff_per_query = 10737418240
  }
}

resource "aws_glue_catalog_database" "telemetry" {
  name = "ambient_\${var.environment}_telemetry"
}

resource "aws_glue_catalog_table" "radar_frames" {
  name          = "radar_frames"
  database_name = aws_glue_catalog_database.telemetry.name
  table_type    = "EXTERNAL_TABLE"

  partition_keys {
    name = "date"
    type = "string"
  }

  storage_descriptor {
    location      = "s3://\${var.parquet_bucket}/raw/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
    columns { name = "device_id"   type = "string" }
    columns { name = "subject_id"  type = "string" }
    columns { name = "facility_id" type = "string" }
    columns { name = "ts"          type = "bigint" }
    columns { name = "radar_raw"   type = "binary" }
  }
}

resource "aws_lambda_function" "reconciler" {
  function_name = "\${local.name}-reconciler"
  role          = aws_iam_role.reconciler.arn
  runtime       = "python3.12"
  handler       = "handler.lambda_handler"
  timeout       = 300
  memory_size   = 256

  environment {
    variables = {
      ATHENA_DATABASE  = aws_glue_catalog_database.telemetry.name
      ATHENA_WORKGROUP = aws_athena_workgroup.main.name
      ATHENA_OUTPUT    = "s3://\${aws_s3_bucket.results.bucket}/reconciler/"
      METRIC_NAMESPACE = "Ambient/Telemetry"
    }
  }
}

resource "aws_cloudwatch_event_rule" "reconciler" {
  name                = "\${local.name}-reconciler"
  schedule_expression = "rate(15 minutes)"
}

resource "aws_cloudwatch_event_target" "reconciler" {
  rule      = aws_cloudwatch_event_rule.reconciler.name
  target_id = "ReconcilerLambda"
  arn       = aws_lambda_function.reconciler.arn
}

resource "aws_lambda_permission" "reconciler_eventbridge" {
  statement_id  = "AllowEventBridgeInvokeReconciler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reconciler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.reconciler.arn
}

output "glue_database"        { value = aws_glue_catalog_database.telemetry.name }
output "athena_workgroup"     { value = aws_athena_workgroup.main.name }
output "athena_results_bucket"{ value = aws_s3_bucket.results.bucket }
output "reconciler_function"  { value = aws_lambda_function.reconciler.function_name }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/athena/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment    = "dev"
parquet_bucket = "ambient-dev-parquet-data"`,
    'prod.tfvars':
`environment    = "prod"
parquet_bucket = "ambient-prod-parquet-data"`,
  },

  cloudtrail: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-cloudtrail"
}

variable "environment"      { type = string }
variable "alert_table_arn"  { type = string }
variable "update_table_arn" { type = string }

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "trail" {
  bucket        = "\${local.name}-logs-\${data.aws_caller_identity.current.account_id}"
  force_destroy = false
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_lifecycle_configuration" "trail" {
  bucket = aws_s3_bucket.trail.id
  rule {
    id     = "glacier-after-365"
    status = "Enabled"
    transition { days = 365; storage_class = "GLACIER" }
    expiration { days = 2557 }
  }
}

resource "aws_cloudtrail" "main" {
  name                          = local.name
  s3_bucket_name                = aws_s3_bucket.trail.id
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  include_global_service_events = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = [var.alert_table_arn, var.update_table_arn]
    }
  }
}

output "trail_arn" { value = aws_cloudtrail.main.arn }
output "trail_s3"  { value = aws_s3_bucket.trail.bucket }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/cloudtrail/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment      = "dev"
alert_table_arn  = "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/ambient-dev-telemetry-alerts"
update_table_arn = "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/ambient-dev-ella-updates"`,
    'prod.tfvars':
`environment      = "prod"
alert_table_arn  = "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/ambient-prod-telemetry-alerts"
update_table_arn = "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/ambient-prod-ella-updates"`,
  },

  'iot-core': {
    'main.tf':
`locals {
  name_prefix = "ambient-\${var.environment}"
}

variable "environment"              { type = string }
variable "fall_enricher_lambda_arn" { type = string }
variable "firehose_stream_name"     { type = string }

data "aws_iam_policy_document" "device_trust" {
  statement {
    principals { type = "Service"; identifiers = ["credentials.iot.amazonaws.com"] }
    actions    = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "device" {
  name               = "\${local.name_prefix}-iot-device-role"
  assume_role_policy = data.aws_iam_policy_document.device_trust.json
}

resource "aws_iot_role_alias" "device" {
  alias             = "\${local.name_prefix}-device-alias"
  role_arn          = aws_iam_role.device.arn
  credential_duration_seconds = 3600
}

resource "aws_iot_thing_type" "ambient_device" {
  name = "\${local.name_prefix}-ambient-device"
}

resource "aws_iot_topic_rule" "fall_enricher" {
  name        = "\${replace(local.name_prefix, "-", "_")}_fall_enricher"
  enabled     = true
  sql         = "SELECT *, topic(3) AS device_id FROM 'ambient/+/fall'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = var.fall_enricher_lambda_arn
  }

  error_action {
    cloudwatch_logs {
      log_group_name = "/aws/iot/\${local.name_prefix}-fall-enricher-errors"
      role_arn       = aws_iam_role.iot_logging.arn
    }
  }
}

resource "aws_iot_topic_rule" "telemetry_legacy" {
  name        = "\${replace(local.name_prefix, "-", "_")}_telemetry_legacy"
  enabled     = true
  sql         = "SELECT * FROM 'ambient/+/telemetry'"
  sql_version = "2016-03-23"

  firehose {
    delivery_stream_name = var.firehose_stream_name
    role_arn             = aws_iam_role.iot_firehose.arn
    batch_mode           = true
  }
}

output "role_alias_name" { value = aws_iot_role_alias.device.alias }
output "role_alias_arn"  { value = aws_iot_role_alias.device.arn }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/iot-core/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment              = "dev"
fall_enricher_lambda_arn = "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:ambient-dev-telemetry-fall-enricher"
firehose_stream_name     = "ambient-dev-telemetry-stream"`,
    'prod.tfvars':
`environment              = "prod"
fall_enricher_lambda_arn = "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:ambient-prod-telemetry-fall-enricher"
firehose_stream_name     = "ambient-prod-telemetry-stream"`,
  },

  kms: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}"
}

variable "environment"    { type = string }
variable "admin_role_arn" { type = string }

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "tenant_cmk" {
  description             = "Ambient \${var.environment} tenant CMK — SSE for DynamoDB, S3, SNS, SQS"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  multi_region            = false

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "RootFullAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::\${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid    = "AllowServicePrincipals"
        Effect = "Allow"
        Principal = {
          Service = [
            "dynamodb.amazonaws.com",
            "s3.amazonaws.com",
            "sns.amazonaws.com",
            "sqs.amazonaws.com",
          ]
        }
        Action   = ["kms:GenerateDataKey*", "kms:Decrypt", "kms:DescribeKey"]
        Resource = "*"
      },
      {
        Sid       = "AllowKeyAdmin"
        Effect    = "Allow"
        Principal = { AWS = var.admin_role_arn }
        Action    = [
          "kms:Create*", "kms:Describe*", "kms:Enable*", "kms:List*",
          "kms:Put*", "kms:Update*", "kms:Revoke*", "kms:Disable*",
          "kms:Get*", "kms:Delete*", "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion",
        ]
        Resource = "*"
      }
    ]
  })

  tags = { Environment = var.environment, HIPAA = "true", ManagedBy = "terraform" }
}

resource "aws_kms_alias" "tenant_cmk" {
  name          = "alias/\${local.name}-tenant-cmk"
  target_key_id = aws_kms_key.tenant_cmk.key_id
}

output "kms_key_arn"   { value = aws_kms_key.tenant_cmk.arn }
output "kms_key_alias" { value = aws_kms_alias.tenant_cmk.name }
output "kms_key_id"    { value = aws_kms_key.tenant_cmk.key_id }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/kms/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment    = "dev"
admin_role_arn = "arn:aws:iam::ACCOUNT_ID:role/ambient-dev-admin"`,
    'prod.tfvars':
`environment    = "prod"
admin_role_arn = "arn:aws:iam::ACCOUNT_ID:role/ambient-prod-admin"`,
  },

  observability: {
    'main.tf':
`locals {
  name = "ambient-\${var.environment}-observability"
}

variable "environment"        { type = string }
variable "central_account_id" { type = string }

resource "aws_iam_role" "metric_stream" {
  name = "\${local.name}-metric-stream-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "streams.metrics.cloudwatch.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "metric_stream" {
  role = aws_iam_role.metric_stream.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["firehose:PutRecord", "firehose:PutRecordBatch"]
      Resource = aws_kinesis_firehose_delivery_stream.metrics.arn
    }]
  })
}

resource "aws_kinesis_firehose_delivery_stream" "metrics" {
  name        = "\${local.name}-metrics"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn            = aws_iam_role.metric_stream.arn
    bucket_arn          = "arn:aws:s3:::ambient-central-metrics-\${var.central_account_id}"
    prefix              = "\${var.environment}/metrics/date=!{timestamp:yyyy-MM-dd}/"
    buffering_interval  = 60
    buffering_size      = 1
    compression_format  = "GZIP"
  }
}

resource "aws_cloudwatch_metric_stream" "main" {
  name          = "\${local.name}-stream"
  role_arn      = aws_iam_role.metric_stream.arn
  firehose_arn  = aws_kinesis_firehose_delivery_stream.metrics.arn
  output_format = "json"

  include_filter {
    namespace    = "AWS/Lambda"
    metric_names = ["Duration", "Errors", "Invocations", "Throttles"]
  }
  include_filter {
    namespace    = "AWS/DynamoDB"
    metric_names = ["ConsumedReadCapacityUnits", "ConsumedWriteCapacityUnits", "SystemErrors"]
  }
  include_filter {
    namespace    = "Ambient/Telemetry"
    metric_names = ["TelemetryDivergence", "FallAlertsEmitted", "UrlsIssued"]
  }
}

output "metric_stream_arn"  { value = aws_cloudwatch_metric_stream.main.arn }
output "firehose_stream_arn"{ value = aws_kinesis_firehose_delivery_stream.metrics.arn }`,
    'backend.tf':
`terraform {
  backend "s3" {
    key     = "services/observability/terraform.tfstate"
    encrypt = true
  }
}`,
    'dev.tfvars':
`environment        = "dev"
central_account_id = "CENTRAL_ACCOUNT_ID"`,
    'prod.tfvars':
`environment        = "prod"
central_account_id = "CENTRAL_ACCOUNT_ID"`,
  },
};

// ── IaC Guide (SnapSoft) data ─────────────────────────────────────────────────

const IAC_MODULES = [
  { name: 'iot_core',                                         aws: 'IoT Core',            desc: 'IoT Thing registry, X.509 policies, and topic prefix for all devices',                              outputs: ['iot_endpoint', 'iot_topic_prefix', 'thing_private_keys', 'thing_certificates'] },
  { name: 'kinesis_data_stream',                              aws: 'Kinesis',             desc: 'Kinesis data stream that buffers all device telemetry before Flink processing',                    outputs: ['name'] },
  { name: 'internal_s3_bucket',                               aws: 'S3',                  desc: 'Reusable private encrypted S3 bucket (used for artifacts, invalid events, parsed data)',          outputs: ['name', 'arn'] },
  { name: 'iot_rules_for_kinesis_data_stream',                aws: 'IoT Rules',           desc: 'IoT topic rule that forwards device telemetry from IoT Core to the Kinesis stream',              outputs: [] },
  { name: 'streaming_flink_app_for_s3_sink',                  aws: 'MSF + CodeBuild',     desc: 'Managed Flink app consuming Kinesis and writing Parquet to S3 for QuickSight',                    outputs: ['app_arn'] },
  { name: 'streaming_flink_app_for_timestream_influxdb_sink', aws: 'MSF + VPC',           desc: 'Managed Flink app consuming Kinesis and writing to private InfluxDB instance in VPC',            outputs: ['app_arn'] },
  { name: 'vpc',                                              aws: 'VPC',                 desc: 'VPC with public/private subnets, NAT gateway, and VPC endpoints for private AWS access',          outputs: ['vpc_id', 'public_subnet_ids', 'private_subnet_ids'] },
  { name: 'bastion_host',                                     aws: 'EC2 + SSM',           desc: 'EC2 bastion accessible via SSM for secure port-forwarding to private InfluxDB',                   outputs: ['instance_id', 'bastion_host_private_key_pem'] },
  { name: 'timestream_influx_private_db',                     aws: 'Timestream InfluxDB', desc: 'Amazon Timestream for InfluxDB instance in a private subnet — credentials in Secrets Manager',   outputs: ['timestream_influx_db_endpoint', 'db_access_token_secret_name'] },
  { name: 'quicksight_dashboards',                            aws: 'QuickSight',          desc: 'QuickSight user, S3 data manifest, and dataset wired to the Parquet output bucket',               outputs: ['quicksight_user_password'] },
  { name: 'sns',                                              aws: 'SNS',                 desc: 'SNS topic with email subscription for fall-event alert notifications',                              outputs: ['topic_arn'] },
];

const IAC_LIFECYCLE: Record<string, { label: string; color: string; borderColor: string; bg: string; steps: { note: string; cmd: string }[] }> = {
  create: {
    label: 'Create / Update',
    color: '#3fb950',
    borderColor: 'rgba(35,134,54,0.30)',
    bg: 'rgba(35,134,54,0.05)',
    steps: [
      { note: 'Set up AWS credentials — expire every ~4 hours', cmd: 'export AWS_ACCESS_KEY_ID="..."\nexport AWS_SECRET_ACCESS_KEY="..."\nexport AWS_SESSION_TOKEN="..."' },
      { note: 'Sync Python dependencies via uv', cmd: 'make sync' },
      { note: 'Navigate to target environment', cmd: 'cd ./infra/envs/dev' },
      { note: 'Initialize providers and modules', cmd: 'tofu init' },
      { note: 'Preview all changes — review carefully before applying', cmd: 'tofu plan' },
      { note: 'Apply changes — confirm with "yes"', cmd: 'tofu apply' },
      { note: 'Capture outputs: endpoints, device certs, passwords', cmd: 'tofu output' },
    ],
  },
  destroy: {
    label: 'Destroy',
    color: '#f85149',
    borderColor: 'rgba(248,81,73,0.30)',
    bg: 'rgba(248,81,73,0.05)',
    steps: [
      { note: 'Set up AWS credentials (same as creation — expire every ~4h)', cmd: 'export AWS_ACCESS_KEY_ID="..."\nexport AWS_SECRET_ACCESS_KEY="..."\nexport AWS_SESSION_TOKEN="..."' },
      { note: 'Navigate to target environment', cmd: 'cd ./infra/envs/dev' },
      { note: 'Preview teardown — verify no unexpected resource deletions', cmd: 'tofu plan -destroy' },
      { note: 'Confirm destruction with "yes" — this is irreversible', cmd: 'tofu destroy' },
    ],
  },
};

const IAC_OPS: { id: string; label: string; tag: string; color: string; steps: { text: string; cmd?: string }[] }[] = [
  {
    id: 'device',
    label: 'Register IoT Device & Send Test Events',
    tag: 'IoT Core',
    color: '#c2410c',
    steps: [
      { text: 'Deploy infrastructure first (see Create / Update above)' },
      { text: 'Install device dependencies and create certs directory', cmd: 'cd ./src/dummy_iot_device && pip install -r requirements.txt && mkdir ./certs' },
      { text: 'Download Amazon Root CA certificate', cmd: 'curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > ./certs/root-CA.crt' },
      { text: 'Navigate to environment and set device ID', cmd: 'cd ../../infra/envs/dev\nDEVICE_ID=<YOUR_DEVICE_ID>' },
      { text: 'Extract private key from tofu state', cmd: 'tofu output -json thing_private_keys | jq -r ".${DEVICE_ID}" > ../../../src/dummy_iot_device/certs/${DEVICE_ID}.private.key' },
      { text: 'Extract certificate from tofu state', cmd: 'tofu output -json thing_certificates | jq -r ".${DEVICE_ID}" > ../../../src/dummy_iot_device/certs/${DEVICE_ID}.cert.pem' },
      { text: 'Capture IoT endpoint and topic prefix from outputs', cmd: 'IOT_ENDPOINT=`tofu output -raw iot_endpoint`\nIOT_TOPIC_PREFIX=`tofu output -raw iot_topic_prefix`' },
      { text: 'Send 10 test messages to the IoT pipeline', cmd: 'cd ../../../src/dummy_iot_device\npython ./dummy_iot_pubsub_device.py \\\n  --message \'{"device":"test","data":[{"frameNumber":301,...}]}\' \\\n  --endpoint $IOT_ENDPOINT \\\n  --ca_file ./certs/root-CA.crt \\\n  --cert "./certs/${DEVICE_ID}.cert.pem" \\\n  --key "./certs/${DEVICE_ID}.private.key" \\\n  --client_id $DEVICE_ID \\\n  --topic "${IOT_TOPIC_PREFIX}/global" \\\n  --count 10' },
    ],
  },
  {
    id: 'influxdb',
    label: 'Access InfluxDB UI via SSM Port Forwarding',
    tag: 'macOS',
    color: '#0ea5e9',
    steps: [
      { text: 'Install AWS Session Manager plugin', cmd: 'brew install --cask session-manager-plugin' },
      { text: 'Add the InfluxDB endpoint to /etc/hosts (redirects to localhost during forwarding)', cmd: 'echo "127.0.0.1  <YOUR_INFLUX_ENDPOINT>" | sudo tee -a /etc/hosts' },
      { text: 'Extract the bastion host private key from tofu state', cmd: 'cd ./infra/envs/dev\ntofu output --raw bastion_host_private_key_pem > ~/bastion_host_key.pem\nchmod 600 ~/bastion_host_key.pem' },
      { text: 'Start SSM port-forwarding session to InfluxDB (port 8086)', cmd: 'aws ssm start-session \\\n  --target <BASTION_INSTANCE_ID> --region eu-north-1 \\\n  --document-name AWS-StartPortForwardingSessionToRemoteHost \\\n  --parameters \'{"host":["<INFLUX_ENDPOINT>"],"portNumber":["8086"],"localPortNumber":["8086"]}\'' },
      { text: 'Open browser — credentials are in Secrets Manager (prefix: READONLY-InfluxDB-auth-parameters-*)', cmd: 'open https://<YOUR_INFLUX_ENDPOINT>:8086/signin' },
    ],
  },
  {
    id: 'token',
    label: 'Generate InfluxDB Token for Flink App',
    tag: 'InfluxDB UI',
    color: '#8b5cf6',
    steps: [
      { text: 'Sign into the InfluxDB UI (see Access InfluxDB above)' },
      { text: 'Navigate to Load Data → API Tokens subpage' },
      { text: 'Click "Generate API Token" — grant read/write permissions on the required buckets' },
      { text: 'Copy the generated token value' },
      { text: 'In AWS Secrets Manager, find the Flink app secret and replace the <CHANGE ME> placeholder with the token' },
      { text: 'Redeploy infrastructure to pick up the new token', cmd: 'cd ./infra/envs/dev && tofu apply' },
    ],
  },
  {
    id: 'flink',
    label: 'Deploy / Redeploy Flink Applications',
    tag: 'Recommended: automated',
    color: '#d29922',
    steps: [
      { text: 'RECOMMENDED: modify Python source then run tofu apply — OpenTofu handles build + deploy', cmd: 'tofu apply' },
      { text: '─── Manual path (use only if automated deploy is unavailable) ───' },
      { text: 'Build the Flink JAR — note: mvn package must run twice (known workaround)', cmd: 'mvn clean && mvn package && mvn package' },
      { text: 'Upload the resulting .zip to the deployment-artifacts S3 bucket' },
      { text: 'In AWS Console → Kinesis Analytics → your Flink app → Configure → select new .zip → Save' },
      { text: 'Note: application_properties.json in the app directory is for local dev only — production config is injected by OpenTofu at deploy time' },
    ],
  },
  {
    id: 'alerts',
    label: 'Configure Fall Alert Email Notifications',
    tag: 'SNS',
    color: '#f85149',
    steps: [
      { text: 'Create a .tmp directory for local credential storage', cmd: 'mkdir -p .tmp' },
      { text: 'Save AWS credentials to .tmp/.env — refresh this file every ~4 hours as credentials expire', cmd: 'export AWS_ACCESS_KEY_ID="..."\nexport AWS_SECRET_ACCESS_KEY="..."\nexport AWS_SESSION_TOKEN="..."' },
      { text: 'Initialize local development environment', cmd: 'make sync tf-init' },
      { text: 'Edit infra/envs/dev/default.auto.tfvars — add the recipient email address under sns_alert_email' },
      { text: 'Plan and apply the updated configuration', cmd: 'make tf-plan tf-apply' },
      { text: 'Accept the SNS subscription confirmation email sent to the recipient' },
      { text: 'Customize alert subject and body in src/timestream_influx_db_loader/main.py' },
    ],
  },
  {
    id: 'demo',
    label: 'Run Demo Device Simulator',
    tag: 'PoC testing',
    color: '#3fb950',
    steps: [
      { text: 'Configure fall alerts first (see Configure Fall Alert Email Notifications above)' },
      { text: 'Start the demo — replays PoC sensor data in real time, injecting a fall alert every 58 seconds', cmd: 'make demo' },
    ],
  },
  {
    id: 'quicksight',
    label: 'Access QuickSight Dashboards',
    tag: 'AWS Console',
    color: '#15803d',
    steps: [
      { text: 'Open AWS Console and navigate to the QuickSight service' },
      { text: 'QuickSight account name: ambient-intelligence-dev' },
      { text: 'Retrieve the qsadmin password from tofu state', cmd: 'cd ./infra/envs/dev && make tf-show | grep quicksight_user_password' },
      { text: 'Log in as qsadmin using the retrieved password' },
    ],
  },
];

const IAC_IMPROVEMENTS = [
  { area: 'Security', items: ['Encrypt OpenTofu state files (native encryption) to protect embedded IoT X.509 certificates', 'Implement credential scanning for .pem/.key files in CI/CD pipeline', 'Do not store OpenSearch or InfluxDB credentials in Lambda environment variables', 'Make OpenSearch private and deploy it inside the VPC', 'Store QuickSight credentials securely or integrate with Cognito', 'Integrate Checkov (IaC security scanner) into CI/CD', 'Add a CI/CD pipeline if not already present'] },
  { area: 'Reliability', items: ['Enable Multi-AZ support for InfluxDB to improve availability', 'Automate IoT device provisioning at scale — eliminate manual certificate installation', 'Automate InfluxDB token management (currently requires manual tofu apply to rotate)', 'Define InfluxDB retention policies (currently infinite — unbounded storage growth)'] },
  { area: 'Cost', items: ['Reduce CloudWatch monitoring costs — especially for both Flink apps and the OpenSearch Lambda', 'Replace on-demand Kinesis pricing with provisioned capacity once client scale is predictable', 'Review and optimize resource pricing model before scaling to production'] },
  { area: 'Developer Experience', items: ['Fix hash-based build triggers to prevent unnecessary full Flink redeployments (saves 3–5 min/cycle)', 'Refactor streaming_flink_app_* modules into a shared base module (DRY up duplication)', 'Investigate whether the duplicate mvn package invocation is truly necessary', 'Extend AWS credential session duration to prevent mid-deploy expiry and errored.tfstate scenarios', 'Upgrade OpenTofu to latest stable 6.x.x once available'] },
  { area: 'Data Pipeline', items: ['Separate InfluxDB and streaming Terraform modules to allow independent provisioning and cleaner token passing', 'Investigate SNS invocation directly from InfluxDB (it supports outbound HTTP requests)', 'Improve handling of malformed IoT events in ingestion rules (non-JSON payloads currently unhandled)', 'Audit SQL sanitization in IoT Core Rules and Flink parameters for injection risk', 'Send telemetry with nanosecond timestamps when device hardware supports it', 'Activate the private per-device MQTT topic (*-poc-topic/{DEVICE_ID}) — provisioned but unused'] },
];

// ── Diagram primitives ────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, { bg: string; border: string; label: string; labelColor: string }> = {
  factory:   { bg: 'rgba(190,18,60,0.07)',   border: 'rgba(190,18,60,0.28)',   label: 'Factory / Control',  labelColor: '#be123c' },
  device:    { bg: 'rgba(55,65,81,0.10)',    border: 'rgba(55,65,81,0.35)',    label: 'Device',             labelColor: 'var(--text-2)' },
  iot:       { bg: 'rgba(194,65,12,0.07)',   border: 'rgba(194,65,12,0.28)',   label: 'IoT Core',           labelColor: '#c2410c' },
  hot:       { bg: 'rgba(185,28,28,0.07)',   border: 'rgba(185,28,28,0.28)',   label: 'Hot path',           labelColor: '#b91c1c' },
  coldnew:   { bg: 'rgba(21,128,61,0.07)',   border: 'rgba(21,128,61,0.28)',   label: 'Cold path (new)',    labelColor: '#15803d' },
  coldold:   { bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.28)','label': 'Cold path (legacy)',labelColor: 'var(--text-3)' },
  query:     { bg: 'rgba(21,128,61,0.05)',   border: 'rgba(21,128,61,0.20)',   label: 'Query layer',        labelColor: '#15803d' },
  narrative: { bg: 'rgba(126,34,206,0.07)',  border: 'rgba(126,34,206,0.28)', label: 'Narrative',          labelColor: '#7c22ce' },
  api:       { bg: 'rgba(29,78,216,0.07)',   border: 'rgba(29,78,216,0.28)',   label: 'API',                labelColor: '#1d4ed8' },
  audit:     { bg: 'rgba(161,98,7,0.07)',    border: 'rgba(161,98,7,0.28)',    label: 'Audit',              labelColor: '#a16207' },
  obs:       { bg: 'rgba(67,56,202,0.07)',   border: 'rgba(67,56,202,0.28)',   label: 'Observability',      labelColor: '#4338ca' },
};

function Node({ label, sub, type, dashed }: { label: string; sub?: string; type: string; dashed?: boolean }) {
  const s = TYPE_STYLE[type] ?? TYPE_STYLE.device;
  return (
    <div style={{
      background: s.bg,
      border: `1px ${dashed ? 'dashed' : 'solid'} ${s.border}`,
      borderRadius: 5, padding: '5px 10px',
      display: 'inline-flex', flexDirection: 'column', gap: 1, flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: s.labelColor, whiteSpace: 'nowrap', fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{sub}</span>}
    </div>
  );
}

function Arr({ dashed }: { dashed?: boolean }) {
  return <span style={{ color: 'var(--text-4)', fontSize: 13, flexShrink: 0, opacity: dashed ? 0.5 : 1 }}>{dashed ? '╌╌▶' : '→'}</span>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{children}</div>;
}

function Group({ label, type, children, note, iac, docs }: { label: string; type: string; children: React.ReactNode; note?: string; iac?: string; docs?: string }) {
  const s = TYPE_STYLE[type] ?? TYPE_STYLE.device;
  return (
    <div style={{ border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '4px 12px', background: s.bg, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: s.labelColor, fontWeight: 600 }}>{label}</span>
        {note && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.06em' }}>{note}</span>}
        {iac && (
          <span style={{ marginLeft: docs ? undefined : 'auto', fontFamily: 'var(--mono)', fontSize: 8.5, color: '#3fb950', background: 'rgba(35,134,54,0.12)', border: '1px solid rgba(35,134,54,0.25)', borderRadius: 3, padding: '1px 6px', letterSpacing: '0.06em', flexShrink: 0 }}>
            tf · {iac}
          </span>
        )}
        {docs && (
          <a href={docs} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 8.5, color: s.labelColor, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 3, padding: '1px 6px', letterSpacing: '0.06em', textDecoration: 'none', flexShrink: 0, opacity: 0.85 }}>
            setup guide ↗
          </a>
        )}
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
      {Object.entries(TYPE_STYLE).map(([key, s]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: s.bg, border: `1px solid ${s.border}` }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)', letterSpacing: '0.06em' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ArchDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Group label="Factory & Control Plane" type="factory" note="separate AWS account" docs="https://github.com/ambientintel/ambientcloud/blob/main/docs/control-plane-setup.md">
          <Row><Node label="Fleet Provisioning" sub="bootstrap cert → tenant cert" type="factory" /></Row>
          <Row><Node label="Tenant Registry" sub="DDB + CloudTrail" type="factory" /></Row>
        </Group>
        <Group label="Ambient Device" type="device" note="3 per room">
          <Row><Node label="mmWave Radar" sub="IWR6843AOP on AM62x" type="device" /></Row>
          <Row><Node label="ambientapp agent" sub="WAL + spool · 5-min Parquet" type="device" /></Row>
        </Group>
        <Group label="AWS IoT Core" type="iot" note="mTLS · X.509" iac="iot-core">
          <Row><Node label="Credentials Provider" sub="role alias → temp AWS creds" type="iot" /></Row>
          <Row><Node label="Device Shadow" sub="facility / subject / room / zone" type="iot" /></Row>
          <Row><Node label="IoT Rule: fall-enricher" sub="Basic Ingest · QoS 1" type="iot" /></Row>
          <Row><Node label="IoT Rule: telemetry" sub="legacy · QoS 0 · retiring" type="iot" dashed /></Row>
        </Group>
      </div>

      <Group label="Hot path — fall alerts" type="hot" note="< 2s latency budget" iac="telemetry">
        <Row>
          <Node label="Device" sub="MQTT QoS 1" type="device" />
          <Arr />
          <Node label="IoT Rule" sub="fall-enricher" type="iot" />
          <Arr />
          <Node label="Lambda" sub="alert enricher" type="hot" />
          <Arr />
          <Node label="DynamoDB" sub="alerts · PK: subject_date" type="hot" />
          <Arr />
          <Node label="SNS" sub="fall-alerts · filter by facilityId" type="hot" />
          <Arr />
          <Node label="Medical Staff" sub="SMS + push + web" type="hot" />
        </Row>
      </Group>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Group label="Cold path (new) — device-side Parquet" type="coldnew" iac="url-minter">
          <Row>
            <Node label="Device" sub="5-min batch · ZSTD" type="device" />
            <Arr />
            <Node label="url-minter" sub="SigV4 · Shadow scope check" type="coldnew" />
            <Arr />
            <Node label="S3" sub="raw-device/date=/facility=/" type="coldnew" />
          </Row>
        </Group>
        <Group label="Cold path (legacy) — retiring" type="coldold" iac="iot-core · telemetry">
          <Row>
            <Node label="Device" sub="MQTT QoS 0" type="device" dashed />
            <Arr dashed />
            <Node label="IoT Rule" sub="telemetry" type="iot" dashed />
            <Arr dashed />
            <Node label="Firehose" sub="5 min / 128 MB · JSON→Parquet" type="coldold" dashed />
            <Arr dashed />
            <Node label="S3" sub="raw/ prefix · retiring" type="coldold" dashed />
          </Row>
        </Group>
      </div>

      <Group label="Cold path — shared query layer" type="query" iac="athena">
        <Row>
          <Node label="S3 (new + legacy)" type="coldnew" />
          <Arr />
          <Node label="Glue Data Catalog" sub="partition projection · UNION ALL" type="query" />
          <Arr />
          <Node label="Amazon Athena" sub="10 GB scan cap per query" type="query" />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', marginLeft: 8 }}>← Ella, API, Reconciler</span>
        </Row>
        <Row>
          <Node label="Reconciler Lambda" sub="every 15 min · Athena row-count delta" type="query" />
          <Arr />
          <Node label="CloudWatch" sub="TelemetryDivergence metric" type="obs" />
        </Row>
      </Group>

      <Group label="Narrative path — Ella" type="narrative" note="12h cadence · 7am + 7pm" iac="ella">
        <Row>
          <Node label="EventBridge" sub="cron: 7am + 7pm" type="narrative" />
          <Arr />
          <Node label="Ella Lambda" sub="Athena + DDB fall counts" type="narrative" />
          <Arr />
          <Node label="SQS fanout" sub="DLQ on 3× failure" type="narrative" />
          <Arr />
          <Node label="Bedrock" sub="Claude Sonnet 4.5 · HIPAA eligible" type="narrative" />
          <Arr />
          <Node label="DynamoDB" sub="daily-updates · 90-day TTL" type="narrative" />
        </Row>
      </Group>

      <Group label="Nurse / Admin API" type="api" note="12 endpoints · row-level facility scope" iac="api">
        <Row>
          <Node label="Staff" sub="login + JWT" type="hot" />
          <Arr />
          <Node label="Cognito" sub="email + MFA · admin-create only" type="api" />
          <Arr />
          <Node label="API Gateway" sub="HTTP API · JWT authorizer" type="api" />
          <Arr />
          <Node label="FastAPI Lambda" sub="admin vs nurse roles" type="api" />
          <Arr />
          <Node label="DynamoDB" sub="alerts · updates · devices" type="api" />
        </Row>
      </Group>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Group label="Audit & Governance" type="audit" iac="cloudtrail · kms">
          <Row>
            <Node label="CloudTrail" sub="multi-region · 7-year Glacier" type="audit" />
            <Arr />
            <Node label="DDB data events" sub="alerts · updates · devices" type="audit" />
          </Row>
          <Row>
            <Node label="KMS: tenant CMK" sub="SSE-KMS · key stays in tenant acct" type="audit" />
            <Arr />
            <Node label="S3 + DynamoDB" sub="all tables encrypted" type="audit" />
          </Row>
          <Row>
            <Node label="Admin CLI" sub="PILOT-XXXX enforcement" type="audit" />
            <Arr />
            <Node label="devices DDB + Shadow" type="audit" />
          </Row>
        </Group>
        <Group label="Central Observability" type="obs" note="metrics only · no PHI" iac="observability">
          <Row>
            <Node label="Reconciler" sub="TelemetryDivergence" type="query" />
            <Arr />
            <Node label="CloudWatch Metric Stream" sub="scalar metrics · logs stay in tenant" type="obs" />
          </Row>
          <Row>
            <Node label="url-minter" sub="issuance rate" type="coldnew" />
            <Arr />
            <Node label="CloudWatch Metric Stream" type="obs" />
          </Row>
          <Row>
            <Node label="Alert Lambda" sub="fall rate per facility" type="hot" />
            <Arr />
            <Node label="CloudWatch Metric Stream" type="obs" />
          </Row>
        </Group>
      </div>

      <Legend />
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────

function ActionButton({ label, icon, status, onClick }: {
  label: string; icon: string; status: ActionStatus; onClick: () => void;
}) {
  const colors: Record<ActionStatus, { bg: string; border: string; color: string }> = {
    idle:    { bg: 'transparent',            border: '#30363d', color: '#8b949e' },
    running: { bg: 'rgba(187,128,9,0.15)',   border: '#9e6a03', color: '#d29922' },
    ok:      { bg: 'rgba(35,134,54,0.15)',   border: '#238636', color: '#3fb950' },
    error:   { bg: 'rgba(248,81,73,0.15)',   border: '#f85149', color: '#f85149' },
  };
  const c = colors[status];
  const icons: Record<ActionStatus, string> = { idle: icon, running: '◌', ok: '✓', error: '✗' };
  return (
    <button
      onClick={onClick}
      disabled={status === 'running'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 5,
        background: c.bg, border: `1px solid ${c.border}`,
        color: c.color, cursor: status === 'running' ? 'default' : 'pointer',
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace', fontSize: 11,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 11 }}>{icons[status]}</span>
      {label}
    </button>
  );
}

// ── Shared small components ───────────────────────────────────────────────────

function Sparkline({ data, color, uid, width = 120, height = 36 }: { data: number[]; color: string; uid: string; width?: number; height?: number }) {
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
  const gid = `sg${uid.replace(/[^a-z0-9]/gi, '')}`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.22} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      <path d={`M ${line} L ${width},${height} L 0,${height} Z`} fill={`url(#${gid})`} />
      <path d={`M ${line}`} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r={2.5} fill={color} />
    </svg>
  );
}

function MetricCard({ id, m }: { id: string; m: { label: string; unit: string; color: string; good: 'high' | 'low'; data: number[] } }) {
  const cur = m.data[m.data.length - 1]; const prev = m.data[m.data.length - 2];
  const delta = cur - prev;
  const isGood = delta === 0 ? true : (m.good === 'high' ? delta > 0 : delta < 0);
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>{m.label}</span>
        {delta !== 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isGood ? '#3fb950' : '#f85149', background: isGood ? 'rgba(35,134,54,0.10)' : 'rgba(248,81,73,0.10)', border: `1px solid ${isGood ? 'rgba(35,134,54,0.25)' : 'rgba(248,81,73,0.25)'}`, borderRadius: 3, padding: '1px 5px' }}>{delta > 0 ? `+${delta}` : `${delta}`}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div><span style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>{cur}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', marginLeft: 4 }}>{m.unit}</span></div>
        <Sparkline data={m.data} color={m.color} uid={id} />
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: DeviceStatus }) {
  const c = DEV_STYLE[status];
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0, boxShadow: status === 'online' ? `0 0 5px ${c.dot}` : 'none' }} />;
}

function nextReleaseStage(s: ReleaseStage): ReleaseStage | null {
  if (s === 'held' || s === 'canary') return 'partial';
  if (s === 'partial') return 'full';
  return null;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CloudPage() {
  const [tab, setTab] = useState<Tab>('services');
  const [editingSvc, setEditingSvc] = useState<(typeof SERVICES)[0] | null>(null);

  // Editor state
  const [editorSvc, setEditorSvcRaw] = useState('ella');
  const [editorFile, setEditorFile] = useState<TfFile>('main.tf');
  const [editorContent, setEditorContent] = useState<Record<string, Record<TfFile, string>>>(TF_CONTENT);
  const [testStatus,  setTestStatus]  = useState<ActionStatus>('idle');
  const [planStatus,  setPlanStatus]  = useState<ActionStatus>('idle');
  const [gitStatus,   setGitStatus]   = useState<ActionStatus>('idle');
  const [applyStatus, setApplyStatus] = useState<ActionStatus>('idle');
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Tenants
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS_INITIAL);
  const [showProvision, setShowProvision] = useState(false);
  const [provisionName, setProvisionName] = useState('');
  const [provisionAccountId, setProvisionAccountId] = useState('');
  const [provisionRegion, setProvisionRegion] = useState('us-east-1');
  const [provisionStatus, setProvisionStatus] = useState<ActionStatus>('idle');
  const [provisionLog, setProvisionLog] = useState<string[]>([]);

  // Runbooks
  const [expandedRunbook, setExpandedRunbook] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Set<number>>>({});

  // Services expand
  const [expandedSvc, setExpandedSvc] = useState<string | null>(null);

  // Pipeline
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  // Fleet
  const [fleetFilter, setFleetFilter] = useState<string>('all');

  // Costs
  const [expandedCost, setExpandedCost] = useState<string | null>(null);

  // Security & Compliance
  const [auditFilter, setAuditFilter] = useState<string>('all');

  // Incidents
  const [incidentFilter, setIncidentFilter] = useState<string>('all');

  // IaC Guide
  const [expandedIacOp, setExpandedIacOp] = useState<string | null>(null);

  // Releases
  const [tenantReleases, setTenantReleases] = useState<TenantRelease[]>(TENANT_RELEASES_INITIAL);
  const [promotingRelease, setPromotingRelease] = useState<string | null>(null);
  const [releaseLog, setReleaseLog] = useState<string[]>([]);
  const [promoteStatus, setPromoteStatus] = useState<ActionStatus>('idle');

  const setEditorSvc = (id: string) => {
    setEditorSvcRaw(id);
    setEditorFile('main.tf');
    setTestStatus('idle'); setPlanStatus('idle'); setGitStatus('idle'); setApplyStatus('idle');
    setActionLog([]);
  };

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const handlePlan = async () => {
    setPlanStatus('running');
    setActionLog([`$ terraform -chdir=services/${editorSvc}/infra plan -var-file=dev.tfvars`]);
    await sleep(600);
    setActionLog(p => [...p, `Acquiring state lock...`, ``]);
    await sleep(500);
    const resources = PLAN_RESOURCES[editorSvc] ?? [`aws_resource.${editorSvc}`];
    const lines: string[] = ['Terraform will perform the following actions:', ''];
    for (const r of resources) {
      lines.push(`  ~ ${r} will be updated in-place`);
      lines.push(`    ~ source_code_hash = "sha256:a1b2c3..." -> "sha256:e5f6g7..."`);
      lines.push(`      # (remaining attributes unchanged)`); lines.push('');
    }
    lines.push(`Plan: 0 to add, ${resources.length} to change, 0 to destroy.`);
    setActionLog(p => [...p, ...lines]);
    await sleep(600);
    setActionLog(p => [...p, ``, `✓  Plan complete · review above then apply`]);
    setPlanStatus('ok');
  };

  const handleProvision = async () => {
    if (!provisionName.trim() || !provisionAccountId.trim()) return;
    setProvisionStatus('running');
    setProvisionLog([`$ ambient-admin provision-tenant --name "${provisionName}" --account-id ${provisionAccountId} --region ${provisionRegion}`]);
    await sleep(600); setProvisionLog(p => [...p, `Verifying AWS account ${provisionAccountId}...`]);
    await sleep(800); setProvisionLog(p => [...p, `✓  Account verified`]);
    await sleep(500); setProvisionLog(p => [...p, `Issuing bootstrap X.509 certificate...`]);
    await sleep(700); setProvisionLog(p => [...p, `✓  Cert issued · serial PILOT-${provisionAccountId.slice(-4)}`]);
    await sleep(400); setProvisionLog(p => [...p, `Registering in control plane DynamoDB...`]);
    await sleep(600); setProvisionLog(p => [...p, `✓  Tenant registered`]);
    await sleep(400); setProvisionLog(p => [...p, `Deploying baseline Terraform modules (10 services)...`]);
    await sleep(1200); setProvisionLog(p => [...p, `✓  IaC applied · 47 resources created`, `✓  Tenant provisioning complete`]);
    const newId = provisionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 14);
    setTenants(prev => [...prev, { id: newId, name: provisionName, accountId: provisionAccountId, region: provisionRegion, rooms: 0, services: 10, lastDeploy: new Date().toISOString().slice(0, 10), status: 'healthy' }]);
    setProvisionStatus('ok');
  };

  const toggleStep = (runbook: string, step: number) => {
    setCheckedSteps(prev => {
      const cur = new Set(prev[runbook] ?? []);
      cur.has(step) ? cur.delete(step) : cur.add(step);
      return { ...prev, [runbook]: cur };
    });
  };

  const handlePromote = async (tenantId: string) => {
    setPromotingRelease(tenantId);
    setPromoteStatus('running');
    setReleaseLog([`$ ambient-admin release promote --tenant ${tenantId}`]);
    await sleep(500);  setReleaseLog(p => [...p, `Verifying deployment health...`]);
    await sleep(700);  setReleaseLog(p => [...p, `✓  All Lambda functions healthy`]);
    await sleep(400);  setReleaseLog(p => [...p, `✓  DynamoDB — no throttle events`]);
    await sleep(500);  setReleaseLog(p => [...p, `Running smoke tests...`]);
    await sleep(900);  setReleaseLog(p => [...p, `✓  Smoke tests passed (3/3)`]);
    await sleep(300);  setReleaseLog(p => [...p, `Updating release stage...`]);
    setTenantReleases(prev => prev.map(t => {
      if (t.tenantId !== tenantId) return t;
      const next = nextReleaseStage(t.stage);
      return next ? { ...t, stage: next } : t;
    }));
    await sleep(200);  setReleaseLog(p => [...p, `✓  Release promoted successfully`]);
    setPromoteStatus('ok');
    await sleep(2500);
    setPromotingRelease(null);
    setReleaseLog([]);
    setPromoteStatus('idle');
  };

  const handleTest = async () => {
    setTestStatus('running');
    setActionLog([`$ aws sts get-caller-identity`]);
    await sleep(900);
    setActionLog(p => [...p,
      `{`,
      `    "UserId": "AIDA4EXAMPLE7ABCDEF",`,
      `    "Account": "123456789012",`,
      `    "Arn": "arn:aws:iam::123456789012:user/ci-deployer"`,
      `}`,
    ]);
    await sleep(400);
    setActionLog(p => [...p, `✓  AWS connectivity verified · services/${editorSvc}/`]);
    setTestStatus('ok');
  };

  const handleGit = async () => {
    setGitStatus('running');
    setActionLog([`$ git add services/${editorSvc}/infra/${editorFile}`]);
    await sleep(500);
    setActionLog(p => [...p, `$ git commit -m "infra(${editorSvc}): update ${editorFile}"`]);
    await sleep(800);
    setActionLog(p => [...p,
      `[main 3a7f2c1] infra(${editorSvc}): update ${editorFile}`,
      ` 1 file changed, 2 insertions(+), 1 deletion(-)`,
    ]);
    await sleep(400);
    setActionLog(p => [...p,
      `$ git push origin main`,
      `To github.com:ambientintel/ambientcloud.git`,
      `   a1b2c3d..3a7f2c1  main -> main`,
      `✓  Pushed · ambientintel/ambientcloud`,
    ]);
    setGitStatus('ok');
  };

  const handleApply = async () => {
    setApplyStatus('running');
    setActionLog([`$ terraform -chdir=services/${editorSvc}/infra init -reconfigure ...`]);
    await sleep(1000);
    setActionLog(p => [...p,
      `Initializing the backend...`,
      `Terraform has been successfully initialized!`,
    ]);
    await sleep(500);
    setActionLog(p => [...p, `$ terraform -chdir=services/${editorSvc}/infra apply -auto-approve ...`]);
    await sleep(1300);
    setActionLog(p => [...p,
      `aws_lambda_function.${editorSvc}: Modifying...`,
      `aws_lambda_function.${editorSvc}: Modifications complete after 3s`,
      ``,
      `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`,
      `✓  IaC applied · services/${editorSvc}/ (dev)`,
    ]);
    setApplyStatus('ok');
  };

  const navItems: { key: Tab; label: string }[] = [
    { key: 'services',     label: 'Services' },
    { key: 'paths',        label: 'Data Paths' },
    { key: 'architecture', label: 'Architecture' },
    { key: 'accounts',     label: 'Account Model' },
    { key: 'runbooks',     label: 'Runbooks' },
    { key: 'editor',       label: 'IaC Editor' },
    { key: 'iac',          label: 'IaC Guide' },
    { key: 'metrics',      label: 'Metrics' },
    { key: 'tenants',      label: 'Tenants' },
    { key: 'fleet',        label: 'Device Fleet' },
    { key: 'pipeline',     label: 'CI/CD' },
    { key: 'costs',        label: 'Cost Explorer' },
    { key: 'security',     label: 'Security' },
    { key: 'incidents',    label: 'Incidents' },
    { key: 'models',       label: 'AI Models' },
    { key: 'releases',     label: 'Releases' },
  ];

  const totalTests = SERVICES.reduce((s, svc) => s + (svc.tests ?? 0), 0);
  const tfServices = SERVICES.filter(s => s.tf);
  const currentText = editorContent[editorSvc]?.[editorFile] ?? '';
  const lineCount = currentText.split('\n').length;

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

        <div className="nav-section">
          <p className="nav-label">Resources</p>
          <a
            href="https://github.com/ambientintel/ambientcloud/blob/main/docs/control-plane-setup.md"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
            style={{ textDecoration: 'none' }}
          >
            Control Plane Setup ↗
          </a>
          <a
            href="https://github.com/ambientintel/ambientcloud"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
            style={{ textDecoration: 'none' }}
          >
            ambientcloud repo ↗
          </a>
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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
                { label: 'Services',       value: SERVICES.length },
                { label: 'Tests',          value: totalTests },
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
                    {['Service', 'Type', 'Description', 'Tests', 'Infra', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map(svc => (
                    <Fragment key={svc.id}>
                      <tr style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '11px 14px' }}><a href={`https://github.com/ambientintel/ambientcloud/tree/main/${svc.path}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>{svc.label} ↗</a></td>
                        <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px' }}>{svc.tag}</span></td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 400 }}>{svc.desc}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: svc.tests ? 'var(--text)' : 'var(--text-4)', textAlign: 'center' }}>{svc.tests ?? '—'}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 13, color: svc.tf ? 'var(--accent)' : 'var(--text-4)' }}>{svc.tf ? '✓' : '—'}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {svc.id === 'ella' && <button onClick={() => setExpandedSvc(expandedSvc === 'ella' ? null : 'ella')} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(126,34,206,0.4)', color: '#a855f7', background: 'rgba(126,34,206,0.07)', cursor: 'pointer' }}>{expandedSvc === 'ella' ? 'Hide' : 'Narratives'}</button>}
                            <button onClick={() => setEditingSvc(svc)} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '3px 10px', borderRadius: 4, border: '1px solid var(--line)', color: 'var(--text-3)', background: 'transparent', cursor: 'pointer' }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                      {svc.id === 'ella' && expandedSvc === 'ella' && (
                        <tr style={{ borderBottom: '1px solid var(--line)' }}>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <div style={{ padding: '20px 24px', background: 'rgba(126,34,206,0.04)' }}>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--text-4)', marginBottom: 14 }}>Recent narratives · de-identified · HIPAA §164.514(c)</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {ELLA_NARRATIVES.map((n, i) => (
                                  <div key={i} style={{ background: 'var(--surface-1)', border: '1px solid rgba(126,34,206,0.2)', borderRadius: 8, padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#a855f7', fontWeight: 500 }}>{n.subjectId}</span>
                                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{n.facility}</span>
                                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{n.date} · {n.amPm}</span>
                                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 6px' }}>{n.tokens} tokens · claude-sonnet-4-5</span>
                                    </div>
                                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>{n.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
            <ArchDiagram />
            <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', marginTop: 16 }}>
              Source:{' '}
              <a href="https://github.com/ambientintel/ambientcloud/blob/main/docs/architecture-v4.mmd" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>architecture-v4.mmd ↗</a>
              {' '}· Dashed borders = legacy / retiring paths
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {ACCOUNTS.map(acc => (
                <div key={acc.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginBottom: 12 }}>{acc.count}</div>
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
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 12 }}>What crosses account boundaries</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px' }}>
                {([
                  ['✓ Scalar CloudWatch metrics (no strings)', 'var(--text-2)'],
                  ['✓ First-boot device provisioning (once)', 'var(--text-2)'],
                  ['✗ Logs, traces, or any PHI', '#a02020'],
                  ['✗ KMS keys (tenant CMK stays in tenant acct)', '#a02020'],
                  ['✗ Device telemetry or fall events', '#a02020'],
                  ['✗ Narrative content or API responses', '#a02020'],
                ] as [string, string][]).map(([text, color]) => (
                  <div key={text} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color }}>{text}</div>
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
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>{RUNBOOKS.length} runbooks — click any row to expand steps, check off as you go.</p>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Runbook', 'Severity', 'Est. TTR', 'Escalate to', 'Source'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RUNBOOKS.map(rb => {
                    const slug = rb.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const detail = RUNBOOK_DETAILS[rb];
                    const isOpen = expandedRunbook === rb;
                    const checked = checkedSteps[rb] ?? new Set<number>();
                    const allDone = detail && checked.size === detail.steps.length;
                    const sev = detail ? SEV_STYLE[detail.severity] : null;
                    return (
                      <Fragment key={rb}>
                        <tr onClick={() => setExpandedRunbook(isOpen ? null : rb)} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer', background: isOpen ? 'var(--surface-1)' : 'transparent' }}>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text)' }}><span style={{ marginRight: 6, fontSize: 10, color: 'var(--text-4)' }}>{isOpen ? '▲' : '▼'}</span>{rb}</td>
                          <td style={{ padding: '11px 14px' }}>{sev && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, borderRadius: 3, padding: '2px 7px' }}>{detail.severity}</span>}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{detail?.ttr ?? '—'}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{detail?.escalateTo ?? '—'}</td>
                          <td style={{ padding: '11px 14px' }}><a href={`https://github.com/ambientintel/ambientcloud/blob/main/docs/runbooks/${slug}.md`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>view ↗</a></td>
                        </tr>
                        {isOpen && detail && (
                          <tr style={{ borderBottom: '1px solid var(--line)' }}>
                            <td colSpan={5} style={{ padding: 0 }}>
                              <div style={{ padding: '18px 24px', background: 'var(--surface-1)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                  {detail.steps.map((step, si) => {
                                    const done = checked.has(si);
                                    return (
                                      <div key={si} onClick={() => toggleStep(rb, si)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '4px 0' }}>
                                        <span style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, borderRadius: 3, border: `1.5px solid ${done ? 'var(--accent)' : 'var(--text-4)'}`, background: done ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>{done ? '✓' : ''}</span>
                                        <span style={{ fontSize: 13, color: done ? 'var(--text-4)' : 'var(--text-2)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.5 }}>{si + 1}. {step}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {allDone && <button onClick={() => { setCheckedSteps(p => ({ ...p, [rb]: new Set() })); setExpandedRunbook(null); }} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 14px', borderRadius: 5, border: '1px solid #238636', background: 'rgba(35,134,54,0.12)', color: '#3fb950', cursor: 'pointer' }}>Mark resolved</button>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── IaC Editor ── */}
        {tab === 'editor' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · services/*/infra/</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>IaC Editor</h1>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              border: '1px solid #30363d',
              borderRadius: 10,
              overflow: 'hidden',
              height: 'calc(100vh - 260px)',
              minHeight: 480,
            }}>
              {/* Service list */}
              <div style={{ background: '#0d1117', borderRight: '1px solid #30363d', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  padding: '10px 12px', borderBottom: '1px solid #30363d',
                  fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.14em', color: '#6e7681',
                }}>
                  Terraform services
                </div>
                {tfServices.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => setEditorSvc(svc.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', border: 'none', borderBottom: '1px solid #21262d',
                      background: editorSvc === svc.id ? 'rgba(56,139,253,0.1)' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: editorSvc === svc.id ? '2px solid #388bfd' : '2px solid transparent',
                    }}
                  >
                    <div style={{ fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 12, color: editorSvc === svc.id ? '#e6edf3' : '#8b949e' }}>{svc.label}</div>
                    <div style={{ fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 9.5, color: '#6e7681', marginTop: 2 }}>{svc.path}</div>
                  </button>
                ))}
              </div>

              {/* Editor panel */}
              <div style={{ display: 'flex', flexDirection: 'column', background: '#0d1117', overflow: 'hidden' }}>

                {/* File tabs */}
                <div style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
                  {TF_FILES.map(f => (
                    <button
                      key={f}
                      onClick={() => setEditorFile(f)}
                      style={{
                        padding: '8px 18px',
                        fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 11.5,
                        background: editorFile === f ? '#0d1117' : 'transparent',
                        color: editorFile === f ? '#e6edf3' : '#6e7681',
                        border: 'none', borderRight: '1px solid #30363d',
                        borderTop: editorFile === f ? '1px solid #388bfd' : '1px solid transparent',
                        cursor: 'pointer',
                        marginTop: editorFile === f ? -1 : 0,
                      }}
                    >
                      {f}
                    </button>
                  ))}
                  <div style={{ marginLeft: 'auto', padding: '8px 14px', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10, color: '#6e7681', alignSelf: 'center' }}>
                    services/{editorSvc}/infra/{editorFile}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={currentText}
                  onChange={e => {
                    const val = e.target.value;
                    setEditorContent(prev => ({
                      ...prev,
                      [editorSvc]: { ...prev[editorSvc], [editorFile]: val },
                    }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const el = e.currentTarget;
                      const s = el.selectionStart;
                      const end = el.selectionEnd;
                      const next = el.value.substring(0, s) + '  ' + el.value.substring(end);
                      setEditorContent(prev => ({
                        ...prev,
                        [editorSvc]: { ...prev[editorSvc], [editorFile]: next },
                      }));
                      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
                    }
                  }}
                  spellCheck={false}
                  style={{
                    flex: 1, width: '100%',
                    background: '#0d1117', color: '#e6edf3',
                    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                    fontSize: 12.5, lineHeight: 1.65,
                    padding: '16px 20px', border: 'none', outline: 'none',
                    resize: 'none', boxSizing: 'border-box',
                    caretColor: '#e6edf3',
                  }}
                />

                {/* Status bar */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: '#161b22', borderTop: '1px solid #30363d',
                  padding: '4px 14px', flexShrink: 0, gap: 16,
                }}>
                  <span style={{ fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10, color: '#6e7681' }}>
                    {lineCount} lines
                  </span>
                  <span style={{ fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10, color: '#6e7681' }}>
                    HCL
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10, color: '#6e7681' }}>
                    Simulated · connect real AWS/GitHub credentials to execute
                  </span>
                </div>

                {/* Action bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#010409', borderTop: '1px solid #30363d',
                  padding: '10px 14px', flexShrink: 0,
                }}>
                  <ActionButton label="Test Connection" icon="⚡" status={testStatus}  onClick={handleTest}  />
                  <ActionButton label="Plan"            icon="~"  status={planStatus}  onClick={handlePlan}  />
                  <ActionButton label="Push to Git"     icon="↑"  status={gitStatus}   onClick={handleGit}   />
                  <ActionButton label="Apply IaC"       icon="▶"  status={applyStatus} onClick={handleApply} />
                  {(testStatus === 'ok' || planStatus === 'ok' || gitStatus === 'ok' || applyStatus === 'ok') && (
                    <button
                      onClick={() => { setTestStatus('idle'); setPlanStatus('idle'); setGitStatus('idle'); setApplyStatus('idle'); setActionLog([]); }}
                      style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid #30363d', color: '#6e7681', cursor: 'pointer', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10 }}
                    >
                      clear
                    </button>
                  )}
                </div>

                {/* Log panel */}
                {actionLog.length > 0 && (
                  <div style={{
                    background: '#010409', borderTop: '1px solid #21262d',
                    padding: '10px 16px', maxHeight: 160, overflowY: 'auto',
                    fontFamily: '"JetBrains Mono", Consolas, monospace',
                    fontSize: 11, lineHeight: 1.7, flexShrink: 0,
                  }}>
                    {actionLog.map((line, i) => (
                      <div key={i} style={{
                        color: line.startsWith('✓') ? '#3fb950'
                             : line.startsWith('$') ? '#79c0ff'
                             : line.startsWith('{') || line.startsWith('}') ? '#d2a8ff'
                             : '#8b949e',
                      }}>
                        {line || ' '}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Metrics ── */}
        {tab === 'metrics' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · CloudWatch · last 24h</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Live Metrics</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3fb950', display: 'inline-block', boxShadow: '0 0 6px #3fb950' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#3fb950' }}>Live</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)' }}>· 1h resolution · 24 data points</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              {Object.entries(METRIC_SERIES).map(([id, m]) => <MetricCard key={id} id={id} m={m} />)}
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Lambda functions · last hour</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>{['Function', 'Invocations', 'p99 Latency', 'Errors', 'Health'].map(h => <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {SERVICES.filter(s => s.lambdaFn).map(svc => {
                    const m = LAMBDA_METRICS[svc.id] ?? { p99ms: 0, errors: 0, invocations: 0 };
                    return (
                      <tr key={svc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent)' }}>{svc.lambdaFn}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{m.invocations.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: m.p99ms > 3000 ? '#d29922' : 'var(--text-2)' }}>{m.p99ms.toLocaleString()} ms</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: m.errors > 0 ? '#f85149' : 'var(--text-4)' }}>{m.errors}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10.5, color: m.errors === 0 ? '#3fb950' : '#f85149' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: m.errors === 0 ? '#3fb950' : '#f85149', display: 'inline-block' }} />{m.errors === 0 ? 'healthy' : 'errors'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Tenants ── */}
        {tab === 'tenants' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · control-plane</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Tenant Registry</h1>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[{ label: 'Tenants', value: tenants.length }, { label: 'Total Rooms', value: tenants.reduce((s, t) => s + t.rooms, 0) }, { label: 'Healthy', value: tenants.filter(t => t.status === 'healthy').length }, { label: 'Regions', value: new Set(tenants.map(t => t.region)).size }].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>{['Organization', 'Account ID', 'Region', 'Rooms', 'Services', 'Last Deploy', 'Status'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {tenants.map(t => { const st = TST_STYLE[t.status]; return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text)' }}>{t.name}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-3)' }}>{t.accountId}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{t.region}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>{t.rooms}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: t.services < 10 ? '#d29922' : 'var(--text-2)', textAlign: 'center' }}>{t.services}/10</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{t.lastDeploy}</td>
                      <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, background: st.bg, border: `1px solid ${st.border}`, color: st.color, borderRadius: 3, padding: '2px 8px' }}>{st.label}</span></td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
            {!showProvision ? (
              <button onClick={() => setShowProvision(true)} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, padding: '7px 16px', borderRadius: 6, border: '1px solid var(--line)', color: 'var(--accent)', background: 'var(--accent-soft)', cursor: 'pointer' }}>+ Provision new tenant</button>
            ) : (
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 16 }}>Provision new tenant</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 10, marginBottom: 14 }}>
                  {[{ label: 'Organization name', value: provisionName, set: setProvisionName, placeholder: 'Acme Senior Living' }, { label: 'AWS Account ID', value: provisionAccountId, set: setProvisionAccountId, placeholder: '123456789012' }].map(({ label, value, set, placeholder }) => (
                    <div key={label}><div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginBottom: 5 }}>{label}</div><input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} /></div>
                  ))}
                  <div><div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginBottom: 5 }}>Region</div><select value={provisionRegion} onChange={e => setProvisionRegion(e.target.value)} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text)', outline: 'none' }}><option>us-east-1</option><option>us-west-2</option><option>eu-west-1</option><option>ap-southeast-1</option></select></div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ActionButton label="Provision" icon="+" status={provisionStatus} onClick={handleProvision} />
                  {provisionStatus === 'idle' && <button onClick={() => { setShowProvision(false); setProvisionStatus('idle'); setProvisionLog([]); setProvisionName(''); setProvisionAccountId(''); }} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-4)', cursor: 'pointer' }}>cancel</button>}
                  {provisionStatus === 'ok' && <button onClick={() => { setShowProvision(false); setProvisionStatus('idle'); setProvisionLog([]); setProvisionName(''); setProvisionAccountId(''); }} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid #238636', color: '#3fb950', cursor: 'pointer' }}>done</button>}
                </div>
                {provisionLog.length > 0 && <div style={{ marginTop: 14, background: '#010409', border: '1px solid #21262d', borderRadius: 6, padding: '10px 14px', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 11, lineHeight: 1.7 }}>{provisionLog.map((line, i) => <div key={i} style={{ color: line.startsWith('✓') ? '#3fb950' : line.startsWith('$') ? '#79c0ff' : '#8b949e' }}>{line}</div>)}</div>}
              </div>
            )}
          </>
        )}

        {/* ── Device Fleet ── */}
        {tab === 'fleet' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · IoT Core · Device Shadow</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Device Fleet</h1>
            </div>
            {(() => {
              const allRooms = FLEET_DATA.flatMap(f => f.rooms);
              const online   = allRooms.filter(r => r.status === 'online').length;
              const offline  = allRooms.filter(r => r.status === 'offline').length;
              const degraded = allRooms.filter(r => r.status === 'degraded').length;
              const expiring = allRooms.filter(r => r.certDaysLeft < 30).length;
              const stats = [
                { label: 'Total Devices', value: allRooms.length, color: 'var(--text)' },
                { label: 'Online',         value: online,           color: '#3fb950' },
                { label: 'Offline',        value: offline,          color: '#f85149' },
                { label: 'Degraded',       value: degraded,         color: '#d29922' },
                { label: 'Cert < 30d',     value: expiring,         color: '#f85149' },
              ];
              const facilities = fleetFilter === 'all' ? FLEET_DATA : FLEET_DATA.filter(f => f.tenantId === fleetFilter);
              return (
                <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    {stats.map(s => (
                      <div key={s.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: s.color }}>{s.value}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                      </div>
                    ))}
                    <div style={{ marginLeft: 'auto' }}>
                      <select value={fleetFilter} onChange={e => setFleetFilter(e.target.value)} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text)', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All facilities</option>
                        {FLEET_DATA.map(f => <option key={f.tenantId} value={f.tenantId}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {facilities.map(facility => (
                      <div key={facility.tenantId}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400 }}>{facility.name}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 7px' }}>{facility.region}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{facility.rooms.length} devices shown</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                          {facility.rooms.map(room => {
                            const ds = DEV_STYLE[room.status];
                            const certColor = room.certDaysLeft < 30 ? '#f85149' : room.certDaysLeft < 90 ? '#d29922' : 'var(--text-3)';
                            return (
                              <div key={room.deviceId} style={{ background: ds.bg, border: `1px solid ${ds.border}`, borderRadius: 8, padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                                  <StatusDot status={room.status} />
                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>Room {room.room}</span>
                                  {room.fallAlerts7d > 0 && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, color: '#d29922', background: 'rgba(210,153,34,0.12)', border: '1px solid rgba(210,153,34,0.3)', borderRadius: 3, padding: '1px 5px' }}>{room.fallAlerts7d} alert{room.fallAlerts7d > 1 ? 's' : ''}</span>}
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#a855f7', marginBottom: 3 }}>{room.subjectId}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginBottom: 8 }}>{room.deviceId}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>seen</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: room.status === 'offline' ? '#f85149' : 'var(--text-3)' }}>{room.lastSeen}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>parquet</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)' }}>{room.lastParquet}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>fw</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: room.firmware === '2.4.1' ? 'var(--text-3)' : '#d29922' }}>{room.firmware}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>cert</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: certColor }}>{room.certDaysLeft}d</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ── CI/CD Pipeline ── */}
        {tab === 'pipeline' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · GitHub Actions</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>CI/CD Pipeline</h1>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Services tracked', value: PIPELINE_DATA.length },
                { label: 'Passing', value: PIPELINE_DATA.filter(p => p.runs[0]?.status === 'passing').length },
                { label: 'Failing', value: PIPELINE_DATA.filter(p => p.runs[0]?.status === 'failing').length },
                { label: 'Total runs', value: PIPELINE_DATA.reduce((s, p) => s + p.runs.length, 0) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>{['Service', 'Status', 'Last Run', 'SHA', 'Message', 'Duration'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {PIPELINE_DATA.map(pipeline => {
                    const latest = pipeline.runs[0];
                    const ps = PIPE_STYLE[latest.status];
                    const isOpen = expandedPipeline === pipeline.serviceId;
                    return (
                      <Fragment key={pipeline.serviceId}>
                        <tr onClick={() => setExpandedPipeline(isOpen ? null : pipeline.serviceId)} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer', background: isOpen ? 'var(--surface-1)' : 'transparent' }}>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}><span style={{ marginRight: 6, fontSize: 10, color: 'var(--text-4)' }}>{isOpen ? '▲' : '▼'}</span>{pipeline.label}</td>
                          <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: ps.bg, border: `1px solid ${ps.border}`, color: ps.color, borderRadius: 3, padding: '2px 8px' }}>{ps.label}</span></td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{latest.startedAt}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{latest.sha}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12.5, color: 'var(--text-2)', maxWidth: 280 }}>{latest.message}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{latest.duration}</td>
                        </tr>
                        {isOpen && (
                          <tr style={{ borderBottom: '1px solid var(--line)' }}>
                            <td colSpan={6} style={{ padding: 0 }}>
                              <div style={{ padding: '16px 20px', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {pipeline.runs.map((run, ri) => {
                                  const rps = PIPE_STYLE[run.status];
                                  const runKey = `${pipeline.serviceId}-${ri}`;
                                  const isRunOpen = expandedRun === runKey;
                                  return (
                                    <div key={ri} style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                                      <div onClick={() => setExpandedRun(isRunOpen ? null : runKey)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', background: 'var(--surface-2)' }}>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--accent)' }}>{run.sha}</span>
                                        <span style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1 }}>{run.message}</span>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{run.startedAt}</span>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{run.duration}</span>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: rps.bg, border: `1px solid ${rps.border}`, color: rps.color, borderRadius: 3, padding: '1px 7px' }}>{rps.label}</span>
                                      </div>
                                      {isRunOpen && (
                                        <div style={{ padding: '12px 14px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                          {run.stages.map((stage, si) => {
                                            const ss = PIPE_STYLE[stage.status];
                                            return (
                                              <Fragment key={si}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color, borderRadius: 4, padding: '3px 10px', whiteSpace: 'nowrap' }}>{stage.name}</span>
                                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)' }}>{stage.duration}</span>
                                                </div>
                                                {si < run.stages.length - 1 && <span style={{ color: 'var(--text-4)', fontSize: 12 }}>→</span>}
                                              </Fragment>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Cost Explorer ── */}
        {tab === 'costs' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · AWS Cost Explorer</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Cost Explorer</h1>
            </div>
            {(() => {
              const total = SERVICE_COSTS.reduce((s, c) => s + c.monthly, 0);
              const maxCost = Math.max(...SERVICE_COSTS.map(c => c.monthly));
              const tenantCount = FLEET_DATA.length;
              return (
                <>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 28px', minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 6 }}>Monthly burn · per tenant</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 42, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>${total}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>avg 48-room facility · us-east-1</div>
                    </div>
                    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 28px', minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 6 }}>All tenants · est. monthly</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 42, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>${(total * tenantCount).toLocaleString()}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>{tenantCount} tenants · weighted avg</div>
                    </div>
                    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 28px', flex: 1, minWidth: 220 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 12 }}>7-month trend</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 44 }}>
                        {COST_TREND.map((v, i) => {
                          const h = (v / Math.max(...COST_TREND)) * 44;
                          const isLast = i === COST_TREND.length - 1;
                          return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                              <div style={{ width: '100%', height: h, background: isLast ? 'var(--accent)' : 'var(--surface-2)', border: `1px solid ${isLast ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 3, transition: 'height 0.3s' }} />
                              {isLast && <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--accent)' }}>${v}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Cost breakdown by service</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>Total: <strong style={{ color: 'var(--text)' }}>${total}/mo</strong></span>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[...SERVICE_COSTS].sort((a, b) => b.monthly - a.monthly).map(svc => {
                        const pct = (svc.monthly / total * 100).toFixed(0);
                        const barW = (svc.monthly / maxCost * 100).toFixed(1);
                        const isOpen = expandedCost === svc.serviceId;
                        return (
                          <Fragment key={svc.serviceId}>
                            <div onClick={() => setExpandedCost(isOpen ? null : svc.serviceId)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                              <div style={{ width: 140, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)', flexShrink: 0 }}>{svc.label}</div>
                              <div style={{ flex: 1, position: 'relative', height: 14 }}>
                                <div style={{ position: 'absolute', top: 2, left: 0, width: `${barW}%`, height: 10, background: svc.color, borderRadius: 2, opacity: 0.75, transition: 'width 0.4s' }} />
                              </div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text)', width: 52, textAlign: 'right', flexShrink: 0 }}>${svc.monthly}</div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</div>
                              <span style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                            </div>
                            {isOpen && (
                              <div style={{ padding: '10px 16px 12px 140px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
                                {svc.breakdown.map((b, bi) => (
                                  <div key={bi} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{b.label}{b.sub && <span style={{ color: 'var(--text-4)' }}> · {b.sub}</span>}</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>${b.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ── Security & Compliance ── */}
        {tab === 'security' && (() => {
          const criticalCount = AUDIT_EVENTS.filter(e => e.severity === 'critical').length;
          const warningCount  = AUDIT_EVENTS.filter(e => e.severity === 'warning').length;
          const expiringKeys  = KMS_KEYS.filter(k => k.status === 'expiring').length;
          const failedCtrls   = SOC2_CONTROLS.filter(c => c.status === 'fail').length;
          const reviewCtrls   = SOC2_CONTROLS.filter(c => c.status === 'review').length;
          const filteredAudit = auditFilter === 'all' ? AUDIT_EVENTS : AUDIT_EVENTS.filter(e => e.outcome === auditFilter);
          const AUDIT_SEV: Record<string, { color: string; bg: string; border: string }> = {
            critical: { color: '#f85149', bg: 'rgba(248,81,73,0.10)',   border: 'rgba(248,81,73,0.28)' },
            warning:  { color: '#d29922', bg: 'rgba(210,153,34,0.10)',  border: 'rgba(210,153,34,0.28)' },
            info:     { color: '#8b949e', bg: 'rgba(139,148,158,0.10)',border: 'rgba(139,148,158,0.28)' },
          };
          const CTRL_COLOR: Record<ControlStatus, string> = { pass: '#3fb950', fail: '#f85149', review: '#d29922' };
          return (
            <>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · HIPAA · SOC 2</p>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Security & Compliance</h1>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                {[
                  { label: 'Critical events',  value: criticalCount, color: criticalCount > 0 ? '#f85149' : 'var(--text)' },
                  { label: 'Warnings',         value: warningCount,  color: warningCount > 0  ? '#d29922' : 'var(--text)' },
                  { label: 'Keys expiring',    value: expiringKeys,  color: expiringKeys > 0  ? '#d29922' : 'var(--text)' },
                  { label: 'Controls failed',  value: failedCtrls,   color: failedCtrls > 0   ? '#f85149' : 'var(--text)' },
                  { label: 'Controls review',  value: reviewCtrls,   color: reviewCtrls > 0   ? '#d29922' : 'var(--text)' },
                  { label: 'SOC 2 controls',   value: SOC2_CONTROLS.length, color: 'var(--text)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>CloudTrail audit log</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'denied', 'success'].map(f => (
                      <button key={f} onClick={() => setAuditFilter(f)} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 9px', borderRadius: 4, border: `1px solid ${auditFilter === f ? 'var(--accent)' : 'var(--line)'}`, color: auditFilter === f ? 'var(--accent)' : 'var(--text-3)', background: auditFilter === f ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer' }}>{f}</button>
                    ))}
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                      {['Time', 'Tenant', 'Action', 'Principal', 'Resource', 'Outcome'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.map(ev => {
                      const s = AUDIT_SEV[ev.severity];
                      return (
                        <tr key={ev.id} style={{ borderBottom: '1px solid var(--line)', background: ev.severity === 'critical' ? 'rgba(248,81,73,0.03)' : 'transparent' }}>
                          <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{ev.ts}</td>
                          <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{ev.tenantId}</td>
                          <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)' }}>{ev.action}</td>
                          <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>{ev.principal}</td>
                          <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>{ev.resource}</td>
                          <td style={{ padding: '9px 12px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 8px', borderRadius: 4, border: `1px solid ${s.border}`, color: s.color, background: s.bg }}>{ev.outcome}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>KMS key rotation</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                      {['Key ID', 'Tenant', 'Auto-rotation', 'Next rotation', 'Days', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {KMS_KEYS.map(k => (
                      <tr key={k.keyId} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{k.keyId}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{k.tenantId}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: 13, color: k.rotation ? '#3fb950' : '#f85149' }}>{k.rotation ? '✓' : '✗'}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{k.nextRotation}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: k.daysUntil < 60 ? '#d29922' : 'var(--text-3)' }}>{k.daysUntil}d</td>
                        <td style={{ padding: '9px 12px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 8px', borderRadius: 4, border: `1px solid ${k.status === 'active' ? 'rgba(35,134,54,0.30)' : 'rgba(210,153,34,0.30)'}`, color: k.status === 'active' ? '#3fb950' : '#d29922', background: k.status === 'active' ? 'rgba(35,134,54,0.10)' : 'rgba(210,153,34,0.10)' }}>{k.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>SOC 2 Type II controls</span>
                </div>
                {SOC2_CONTROLS.map((ctrl, i) => {
                  const cc = CTRL_COLOR[ctrl.status];
                  return (
                    <div key={ctrl.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 16px', borderBottom: i < SOC2_CONTROLS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', width: 44, flexShrink: 0, paddingTop: 2 }}>{ctrl.id}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 3 }}>{ctrl.title}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)' }}>{ctrl.evidence}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 8px', borderRadius: 4, border: `1px solid ${cc}44`, color: cc, background: `${cc}18`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ctrl.status}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>{ctrl.lastChecked}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ── Incident Timeline ── */}
        {tab === 'incidents' && (() => {
          const INC_TYPE_STYLE: Record<IncidentType, { color: string; label: string }> = {
            alert:    { color: '#f85149', label: 'alert' },
            deploy:   { color: '#388bfd', label: 'deploy' },
            runbook:  { color: '#d29922', label: 'runbook' },
            config:   { color: '#8b949e', label: 'config' },
            resolved: { color: '#3fb950', label: 'resolved' },
          };
          const INC_SEV_COLOR: Record<string, string> = { P1: '#f85149', P2: '#d29922', P3: '#388bfd', info: '#6e7681' };
          const filtered = incidentFilter === 'all' ? INCIDENT_EVENTS : INCIDENT_EVENTS.filter(e => e.type === incidentFilter);
          return (
            <>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · all tenants</p>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Incident Timeline</h1>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'P1 events', value: INCIDENT_EVENTS.filter(e => e.severity === 'P1').length, color: '#f85149' },
                  { label: 'P2 events', value: INCIDENT_EVENTS.filter(e => e.severity === 'P2').length, color: '#d29922' },
                  { label: 'Deploys',   value: INCIDENT_EVENTS.filter(e => e.type === 'deploy').length,  color: '#388bfd' },
                  { label: 'Resolved',  value: INCIDENT_EVENTS.filter(e => e.type === 'resolved').length,color: '#3fb950' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {['all', 'alert', 'deploy', 'runbook', 'resolved', 'config'].map(f => (
                  <button key={f} onClick={() => setIncidentFilter(f)} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 4, border: `1px solid ${incidentFilter === f ? 'var(--accent)' : 'var(--line)'}`, color: incidentFilter === f ? 'var(--accent)' : 'var(--text-3)', background: incidentFilter === f ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f}</button>
                ))}
              </div>
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'var(--line)' }} />
                {filtered.map(ev => {
                  const ts = INC_TYPE_STYLE[ev.type];
                  const sevColor = INC_SEV_COLOR[ev.severity];
                  return (
                    <div key={ev.id} style={{ position: 'relative', paddingBottom: 14 }}>
                      <div style={{ position: 'absolute', left: -20, top: 10, width: 10, height: 10, borderRadius: '50%', background: ts.color, border: '2px solid var(--bg)', boxShadow: `0 0 6px ${ts.color}66` }} />
                      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderLeft: `3px solid ${ts.color}`, borderRadius: 8, padding: '11px 16px', marginLeft: 8 }}>
                        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginBottom: 5 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '1px 7px', borderRadius: 3, border: `1px solid ${ts.color}44`, color: ts.color, background: `${ts.color}18`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ts.label}</span>
                          {ev.severity !== 'info' && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '1px 7px', borderRadius: 3, border: `1px solid ${sevColor}44`, color: sevColor, background: `${sevColor}18` }}>{ev.severity}</span>}
                          {ev.tenantId && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 6px' }}>{ev.tenantId}</span>}
                          {ev.service  && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 6px' }}>{ev.service}</span>}
                          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{ev.ts}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{ev.title}</div>
                        {ev.actor && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 4 }}>by {ev.actor}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ── AI Model Performance ── */}
        {tab === 'models' && (() => {
          const okRuns    = MODEL_RUNS.filter(r => r.status === 'ok');
          const avgLat    = Math.round(okRuns.reduce((s, r) => s + r.latencyMs, 0) / okRuns.length);
          const cacheHits = MODEL_RUNS.filter(r => r.cacheHit && r.status === 'ok').length;
          const cacheRate = Math.round(cacheHits / okRuns.length * 100);
          const totalIn   = MODEL_RUNS.reduce((s, r) => s + r.inputTokens, 0);
          const totalOut  = MODEL_RUNS.reduce((s, r) => s + r.outputTokens, 0);
          return (
            <>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · AWS Bedrock · Ella</p>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>AI Model Performance</h1>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                {[
                  { label: 'Avg latency (ok)',  value: `${(avgLat / 1000).toFixed(2)}s`,        color: 'var(--text)' },
                  { label: 'Cache hit rate',    value: `${cacheRate}%`,                         color: '#3fb950' },
                  { label: 'Input tokens (48h)',value: totalIn.toLocaleString(),                 color: 'var(--text)' },
                  { label: 'Output tokens',     value: totalOut.toLocaleString(),                color: 'var(--text)' },
                  { label: 'Errors (48h)',      value: MODEL_RUNS.filter(r => r.status === 'error').length, color: '#f85149' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Per-tenant Bedrock configuration</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                      {['Tenant', 'Model', 'Version', 'Monthly tokens', 'Cache hit %', 'p99 latency', 'Pinned'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TENANT_MODEL_CONFIGS.map(tc => (
                      <tr key={tc.tenantId} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-2)' }}>{tc.name}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>{tc.model}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)' }}>{tc.version}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{(tc.monthlyTokens / 1_000_000).toFixed(1)}M</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: tc.cacheHitRate >= 70 ? '#3fb950' : 'var(--text-2)' }}>{tc.cacheHitRate}%</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: tc.p99Ms > 4200 ? '#d29922' : 'var(--text-2)' }}>{(tc.p99Ms / 1000).toFixed(2)}s</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, color: tc.isPinned ? '#3fb950' : 'var(--text-4)' }}>{tc.isPinned ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Recent Bedrock invocations · Ella</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                      {['Time', 'Subject', 'Latency', 'Input tkns', 'Output tkns', 'Cache', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODEL_RUNS.map((run, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)', background: run.status === 'error' ? 'rgba(248,81,73,0.04)' : 'transparent' }}>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{run.ts}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: '#a855f7' }}>{run.subjectId}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: run.latencyMs > 10000 ? '#f85149' : run.latencyMs > 4200 ? '#d29922' : 'var(--text-2)' }}>{run.latencyMs >= 1000 ? `${(run.latencyMs / 1000).toFixed(2)}s` : `${run.latencyMs}ms`}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{run.inputTokens}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{run.outputTokens || '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: 12, color: run.cacheHit ? '#3fb950' : 'var(--text-4)' }}>{run.cacheHit ? '✓' : '—'}</td>
                        <td style={{ padding: '9px 12px' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 8px', borderRadius: 4, border: `1px solid ${run.status === 'ok' ? 'rgba(35,134,54,0.30)' : 'rgba(248,81,73,0.30)'}`, color: run.status === 'ok' ? '#3fb950' : '#f85149', background: run.status === 'ok' ? 'rgba(35,134,54,0.10)' : 'rgba(248,81,73,0.10)' }}>{run.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}

        {/* ── Release Manager ── */}
        {tab === 'releases' && (() => {
          const pendingCount = SERVICE_RELEASES.filter(s => s.pendingVersion).length;
          const canaryCount  = tenantReleases.filter(t => t.stage === 'canary').length;
          const fullCount    = tenantReleases.filter(t => t.stage === 'full').length;
          const heldCount    = tenantReleases.filter(t => t.stage === 'held').length;
          return (
            <>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · staged rollout</p>
                <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Release Manager</h1>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                {[
                  { label: 'Pending versions', value: pendingCount, color: '#388bfd' },
                  { label: 'Canary tenants',   value: canaryCount,  color: '#d29922' },
                  { label: 'Fully deployed',   value: fullCount,    color: '#3fb950' },
                  { label: 'Held tenants',     value: heldCount,    color: '#f85149' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Service versions</span>
                </div>
                <div style={{ display: 'flex' }}>
                  {SERVICE_RELEASES.map((sr, i) => (
                    <div key={sr.service} style={{ flex: 1, padding: '14px 16px', borderRight: i < SERVICE_RELEASES.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 6 }}>{sr.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)', marginBottom: sr.pendingVersion ? 5 : 0 }}>{sr.currentVersion}</div>
                      {sr.pendingVersion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#d29922' }}>→ {sr.pendingVersion}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(210,153,34,0.30)', color: '#d29922', background: 'rgba(210,153,34,0.10)' }}>pending</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: releaseLog.length > 0 ? 20 : 0 }}>
                <div style={{ padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Tenant rollout status</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>Tenant</th>
                      {SERVICE_RELEASES.map(sr => (
                        <th key={sr.service} style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{sr.label}</th>
                      ))}
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>Stage</th>
                      <th style={{ padding: '8px 12px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {tenantReleases.map(tr => {
                      const ss = RELEASE_STAGE_STYLE[tr.stage];
                      const isPromoting = promotingRelease === tr.tenantId;
                      const canPromote  = tr.stage !== 'full';
                      return (
                        <tr key={tr.tenantId} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-2)' }}>{tr.name}</td>
                          {SERVICE_RELEASES.map(sr => {
                            const ver = tr.versions[sr.service];
                            const isNew = sr.pendingVersion && ver === sr.pendingVersion;
                            return <td key={sr.service} style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: isNew ? '#3fb950' : 'var(--text-3)', textAlign: 'center' }}>{ver}</td>;
                          })}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 8px', borderRadius: 4, border: `1px solid ${ss.border}`, color: ss.color, background: ss.bg, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ss.label}</span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {canPromote && (
                              <button onClick={() => handlePromote(tr.tenantId)} disabled={promoteStatus === 'running'} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 10px', borderRadius: 4, border: '1px solid var(--line)', color: isPromoting ? 'var(--accent)' : 'var(--text-3)', background: 'transparent', cursor: promoteStatus === 'running' ? 'default' : 'pointer', opacity: promoteStatus === 'running' && !isPromoting ? 0.4 : 1 }}>{isPromoting ? 'promoting...' : 'Promote'}</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {releaseLog.length > 0 && (
                <div style={{ background: '#0d1117', border: '1px solid var(--line)', borderRadius: 8, padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12, color: '#e6edf3', lineHeight: 1.9, marginBottom: 20 }}>
                  {releaseLog.map((line, i) => <div key={i}>{line || ' '}</div>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>Stage legend</span>
                {(['canary', 'partial', 'full', 'held'] as ReleaseStage[]).map(s => {
                  const ss = RELEASE_STAGE_STYLE[s];
                  const desc: Record<ReleaseStage, string> = { canary: '1 tenant · validate first', partial: 'subset on new version', full: 'all tenants updated', held: 'frozen · dependency pending' };
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 7px', borderRadius: 3, border: `1px solid ${ss.border}`, color: ss.color, background: ss.bg }}>{ss.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{desc[s]}</span>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ── IaC Guide ── */}
        {tab === 'iac' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · snapsoft/ · OpenTofu</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>IaC Guide</h1>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Modules',             value: String(IAC_MODULES.length) },
                { label: 'Environments',         value: '1 (dev)' },
                { label: 'Prerequisites',        value: '4' },
                { label: 'Operational runbooks', value: String(IAC_OPS.length) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Pipeline Diagram */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10 }}>SnapSoft IoT Pipeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Group label="Ingestion" type="iot" note="AWS IoT Core → Kinesis Data Stream">
                  <Row>
                    <Node label="IoT Device" sub="MQTT · mTLS · X.509" type="device" />
                    <Arr />
                    <Node label="IoT Core" sub="topic rule → Kinesis" type="iot" />
                    <Arr />
                    <Node label="Kinesis Stream" sub="ambient-intelligence-poc-data-stream" type="hot" />
                  </Row>
                </Group>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Group label="Analytics Sink — QuickSight" type="coldnew" note="Flink → S3 → QuickSight">
                    <Row>
                      <Node label="Flink App" sub="quicksight_data_parser" type="coldnew" />
                      <Arr />
                      <Node label="S3" sub="quicksight-parsed-data" type="coldnew" />
                      <Arr />
                      <Node label="QuickSight" sub="ambient-intelligence-dev" type="query" />
                    </Row>
                  </Group>
                  <Group label="Time-Series Sink — InfluxDB" type="narrative" note="Flink → private VPC subnet">
                    <Row>
                      <Node label="Flink App" sub="timestream_influx_db_loader" type="narrative" />
                      <Arr />
                      <Node label="InfluxDB" sub="private subnet · SSM access" type="narrative" />
                    </Row>
                  </Group>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Group label="Fall Alerts" type="hot" note="SNS → email notification">
                    <Row>
                      <Node label="Flink App" sub="fall event detection" type="hot" />
                      <Arr />
                      <Node label="SNS" sub="fall-alerts topic" type="hot" />
                      <Arr />
                      <Node label="Email" sub="staff notification" type="hot" />
                    </Row>
                  </Group>
                  <Group label="Private Network Access" type="obs" note="VPC + EC2 Bastion">
                    <Row>
                      <Node label="VPC" sub="public + private subnets · NAT" type="obs" />
                      <Arr />
                      <Node label="Bastion EC2" sub="SSM port-forwarding" type="obs" />
                      <Arr />
                      <Node label="InfluxDB" sub="8086 · private endpoint" type="narrative" />
                    </Row>
                  </Group>
                </div>
              </div>
            </div>

            {/* Module Reference Table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10 }}>Module Reference</div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                      {['Module', 'AWS Service', 'Description', 'Key Outputs'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {IAC_MODULES.map((m, i) => (
                      <tr key={m.name} style={{ borderBottom: i < IAC_MODULES.length - 1 ? '1px solid var(--line)' : 'none' }}>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{m.name}</span></td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px' }}>{m.aws}</span></td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{m.desc}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {m.outputs.length > 0 ? m.outputs.map(o => (
                              <span key={o} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap' }}>{o}</span>
                            )) : <span style={{ fontSize: 11, color: 'var(--text-4)' }}>—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prerequisites */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10 }}>Prerequisites</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { tool: 'OpenTofu', desc: 'IaC engine — Terraform-compatible', cmd: 'brew install opentofu' },
                  { tool: 'uv', desc: 'Python package manager for Flink app deps', cmd: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
                  { tool: 'GNU Make', desc: 'Task runner — sync, plan, apply shortcuts', cmd: 'brew install make' },
                  { tool: 'Maven', desc: 'Build tool for Flink Java/Python apps', cmd: 'brew install maven' },
                ].map(({ tool, desc, cmd }) => (
                  <div key={tool} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{tool}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</span>
                    </div>
                    <div style={{ background: '#0d1117', border: '1px solid var(--line)', borderRadius: 5, padding: '7px 12px', fontFamily: 'var(--mono)', fontSize: 11.5, color: '#e6edf3' }}>{cmd}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* IaC Lifecycle */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10 }}>IaC Lifecycle</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {Object.entries(IAC_LIFECYCLE).map(([key, lc]) => (
                  <div key={key} style={{ border: `1px solid ${lc.borderColor}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', background: lc.bg, borderBottom: `1px solid ${lc.borderColor}` }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: lc.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lc.label}</span>
                    </div>
                    <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {lc.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: lc.color, background: lc.bg, border: `1px solid ${lc.borderColor}`, borderRadius: 3, padding: '2px 6px', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, lineHeight: 1.4 }}>{step.note}</div>
                            <div style={{ background: '#0d1117', border: '1px solid var(--line)', borderRadius: 4, padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: '#e6edf3', whiteSpace: 'pre', overflowX: 'auto' }}>{step.cmd}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Runbooks */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10 }}>Operational Runbooks</div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                {IAC_OPS.map((op, opIdx) => (
                  <div key={op.id} style={{ borderBottom: opIdx < IAC_OPS.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <button
                      onClick={() => setExpandedIacOp(expandedIacOp === op.id ? null : op.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: op.color, background: `${op.color}18`, border: `1px solid ${op.color}44`, borderRadius: 3, padding: '2px 7px', flexShrink: 0 }}>{op.tag}</span>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--text)' }}>{op.label}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>{op.steps.length} steps</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', marginLeft: 8 }}>{expandedIacOp === op.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedIacOp === op.id && (
                      <div style={{ padding: '4px 18px 18px', borderTop: '1px solid var(--line)', background: 'rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
                          {op.steps.map((step, si) => {
                            const isChecked = checkedSteps[op.id]?.has(si) ?? false;
                            return (
                              <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <button
                                  onClick={() => toggleStep(op.id, si)}
                                  style={{ width: 16, height: 16, flexShrink: 0, borderRadius: 3, border: `1px solid ${isChecked ? op.color : 'var(--line)'}`, background: isChecked ? `${op.color}28` : 'transparent', cursor: 'pointer', marginTop: 2 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, color: step.cmd ? 'var(--text-2)' : 'var(--text-3)', marginBottom: step.cmd ? 6 : 0, lineHeight: 1.5, textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.45 : 1 }}>{step.text}</div>
                                  {step.cmd && <div style={{ background: '#0d1117', border: '1px solid var(--line)', borderRadius: 4, padding: '7px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: '#e6edf3', overflowX: 'auto', whiteSpace: 'pre' }}>{step.cmd}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Backlog */}
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setExpandedIacOp(expandedIacOp === '__backlog' ? null : '__backlog')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: expandedIacOp === '__backlog' ? '10px 10px 0 0' : 10, cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--text)' }}>Improvement Backlog</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '2px 7px' }}>{IAC_IMPROVEMENTS.reduce((s, a) => s + a.items.length, 0)} items across {IAC_IMPROVEMENTS.length} areas</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{expandedIacOp === '__backlog' ? '▲' : '▼'}</span>
              </button>
              {expandedIacOp === '__backlog' && (
                <div style={{ border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, background: 'var(--surface-1)' }}>
                  {IAC_IMPROVEMENTS.map(({ area, items }) => (
                    <div key={area}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--text-4)', marginBottom: 10 }}>{area}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 4, flexShrink: 0 }}>◦</span>
                            <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.55 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </main>

      {editingSvc && (
        <ServiceEditor service={editingSvc} onClose={() => setEditingSvc(null)} />
      )}

    </div>
  );
}
