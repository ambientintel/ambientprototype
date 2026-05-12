'use client';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ServiceEditor = dynamic(() => import('./ServiceEditor'), { ssr: false });

type Tab = 'services' | 'paths' | 'architecture' | 'accounts' | 'runbooks' | 'editor' | 'pipeline' | 'deps' | 'health' | 'costs';
type CdkFile = 'stack.py' | 'cdk.json' | 'dev.context.json' | 'prod.context.json';
type ActionStatus = 'idle' | 'running' | 'ok' | 'error';
type RunStatus = 'success' | 'failure' | 'running' | 'queued' | 'skipped';
type HealthStatus = 'healthy' | 'degraded' | 'down';

const CDK_FILES: CdkFile[] = ['stack.py', 'cdk.json', 'dev.context.json', 'prod.context.json'];

const SERVICES = [
  { id: 'ella',       tag: 'AI · Bedrock', label: 'Ella',            path: 'services/ella/',        tests: 11,   desc: 'Twice-daily Claude Sonnet narrative per subject via Bedrock — de-identified summaries stored in DynamoDB for clinical staff.', tf: true,  lambdaFn: 'ambient-dev-ella' },
  { id: 'api',        tag: 'REST API',     label: 'Nurse/Admin API', path: 'services/api/',         tests: 32,   desc: 'FastAPI + Cognito JWT with row-level facility scoping. 16 endpoints serving staff web and mobile clients — includes alert pagination (AlertPage with limit/next_token), admin user management routes (GET /admin/users, reset/disable/enable), and CORS PATCH support.', tf: true,  lambdaFn: 'ambient-dev-api' },
  { id: 'telemetry',  tag: 'Streaming',    label: 'Telemetry',       path: 'services/telemetry/',   tests: 15,   desc: 'Fall-alert Lambda → SNS for sub-2s staff notification; per-minute aggregates → Firehose → Parquet on S3.', tf: true,  lambdaFn: 'ambient-dev-alerts-enricher' },
  { id: 'admin-cli',  tag: 'CLI',          label: 'Admin CLI',       path: 'services/admin-cli/',   tests: 71,   desc: 'Operator CLI for device provisioning — mints tenant X.509 certs, per-facility migration (promote/demote), Cognito user lifecycle (create-nurse, create-admin, list-users, reset-password, disable-user, enable-user), and SNS alert subscriptions.', tf: false, lambdaFn: null },
  { id: 'url-minter', tag: 'Upload',       label: 'URL Minter',      path: 'services/url-minter/',  tests: null, desc: 'Presigned S3 upload URLs for device Parquet batches — eliminates MQTT overhead for analytic cold-path data.', tf: true,  lambdaFn: 'ambient-dev-url-minter' },
  { id: 'athena',     tag: 'Analytics',    label: 'Athena',          path: 'services/athena/',      tests: null, desc: 'Glue table and partition projection for raw radar frames on the cold path — queryable without ETL.', tf: true,  lambdaFn: null },
  { id: 'cloudtrail',    tag: 'Audit',      label: 'CloudTrail',      path: 'services/cloudtrail/',    tests: null, desc: 'Data-event audit logging on all sensitive DynamoDB tables — every read/write attributed for HIPAA compliance.', tf: true,  lambdaFn: null },
  { id: 'iot-core',     tag: 'IoT',        label: 'IoT Core',        path: 'infra/stacks/',           tests: null, desc: 'IoT rules (fall-enricher + legacy Firehose) in TelemetryStack; role alias + device mTLS policy in UrlMinterStack. No standalone CDK stack.', tf: true,  lambdaFn: null },
  { id: 'kms',          tag: 'Security',   label: 'KMS',             path: 'infra/stacks/kms_stack.py',  tests: null, desc: 'Tenant CMK — 4 keys (data, s3, sns, sqs) with auto-rotation and RemovalPolicy.RETAIN. Scoped key policies for each consumer.', tf: true,  lambdaFn: null },
  { id: 'storage',      tag: 'Storage',    label: 'Storage',         path: 'infra/stacks/storage_stack.py', tests: null, desc: 'Four S3 buckets: Parquet data (raw frames + Firehose telemetry), Athena results (30-day expiry), IoT error DLQ, and CloudTrail audit (HIPAA 7-yr retain). All PHI-adjacent use SSE-KMS.', tf: true, lambdaFn: null },
  { id: 'data',         tag: 'Database',   label: 'Data',            path: 'infra/stacks/data_stack.py',    tests: null, desc: 'Three DynamoDB tables (PAY_PER_REQUEST + PITR): devices (facility-index GSI), alerts (subject_date PK + facility-time GSI), daily-updates (subjectId PK, 90-day TTL). All encrypted with tenant CMK.', tf: true, lambdaFn: null },
  { id: 'observability',tag: 'Monitoring', label: 'Observability',   path: 'infra/stacks/observability_stack.py', tests: null, desc: 'CloudWatch Metric Streams to central account — scalar metrics only (AmbientIntelligence/Telemetry, Lambda, ApiGateway, DynamoDB, Athena). No PHI crosses the boundary. Optional stack.', tf: true,  lambdaFn: null },
  { id: 'reconciler',  tag: 'Ops',        label: 'Reconciler',      path: 'services/reconciler/',   tests: 2,    desc: 'EventBridge 15-min cron compares device-path vs Firehose Athena row counts per facility — emits TelemetryDivergence metric, alarms at >0.1%.', tf: true, lambdaFn: 'ambient-dev-reconciler' },
  { id: 'dashboard',   tag: 'Monitoring', label: 'Dashboard',       path: 'infra/stacks/dashboard_stack.py', tests: null, desc: 'CloudWatch operator dashboard — Lambda invocations/errors/duration for all 5 functions, Ella DLQ depth, TelemetryDivergence metric, API concurrent executions.', tf: true, lambdaFn: null },
];

const PATHS = [
  { label: 'Hot path',       tag: '< 2s',       flow: ['Device MQTT', 'IoT Rule', 'Lambda', 'DynamoDB', 'SNS → Staff'],                            desc: 'Fall alerts. QoS 1 guaranteed delivery, sub-2-second latency budget.' },
  { label: 'Cold path',      tag: 'New',         flow: ['Device (5-min Parquet)', 'url-minter', 'Presigned URL', 'S3'],                             desc: 'Device writes Parquet batches locally and uploads directly to S3 — no MQTT for analytic data.' },
  { label: 'Cold path',      tag: 'Legacy',      flow: ['Device MQTT', 'IoT Rule', 'Firehose', 'S3 (JSON→Parquet)'],                                desc: 'Being retired. Dual-writes alongside the new path during migration.' },
  { label: 'Narrative',      tag: '12h cadence', flow: ['EventBridge cron', 'SQS fanout', 'Ella Lambda', 'Bedrock Claude', 'DynamoDB'],             desc: 'De-identified daily summaries generated per subject, surfaced in the Nurse Dashboard.' },
  { label: 'Nurse/Admin API',tag: 'REST',        flow: ['API Gateway', 'Cognito JWT', 'FastAPI Lambda', 'DynamoDB'],                                desc: '16 endpoints, row-level facility scoping — alert pagination (AlertPage with limit/next_token), admin user management (GET /admin/users, reset/disable/enable), CORS PATCH support.' },
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
  'Admin CLI — user provisioning failure', 'Dashboard — metric missing',
];

const CDK_STATE: Record<string, { cfnResources: number; lastDeploy: string }> = {
  kms:           { cfnResources: 4,  lastDeploy: '~3h ago' },
  storage:       { cfnResources: 5,  lastDeploy: '~3h ago' },
  data:          { cfnResources: 9,  lastDeploy: '~3h ago' },
  'url-minter':  { cfnResources: 8,  lastDeploy: '~1h ago' },
  telemetry:     { cfnResources: 22, lastDeploy: '~2h ago' },
  athena:        { cfnResources: 12, lastDeploy: '~2h ago' },
  ella:          { cfnResources: 14, lastDeploy: '~1h ago' },
  api:           { cfnResources: 22, lastDeploy: '~1h ago' },
  cloudtrail:    { cfnResources: 6,  lastDeploy: '~2h ago' },
  observability: { cfnResources: 7,  lastDeploy: '~3h ago' },
  dashboard:     { cfnResources: 3,  lastDeploy: '~1h ago' },
};

const PIPELINE: Record<string, {
  synth:  { status: RunStatus; age: string; duration: string; sha: string };
  deploy: { status: RunStatus; age: string; duration: string; sha: string };
  env: 'dev' | 'prod';
}> = {
  kms:           { synth: { status: 'success', age: '~3h ago', duration: '0m 14s', sha: '96d8019' }, deploy: { status: 'success', age: '~3h ago', duration: '0m 47s', sha: '96d8019' }, env: 'dev' },
  storage:       { synth: { status: 'success', age: '~3h ago', duration: '0m 11s', sha: '96d8019' }, deploy: { status: 'success', age: '~3h ago', duration: '0m 38s', sha: '96d8019' }, env: 'dev' },
  data:          { synth: { status: 'success', age: '~3h ago', duration: '0m 13s', sha: '96d8019' }, deploy: { status: 'success', age: '~3h ago', duration: '0m 44s', sha: '96d8019' }, env: 'dev' },
  'url-minter':  { synth: { status: 'success', age: '~1h ago', duration: '0m 18s', sha: '51d16d2' }, deploy: { status: 'success', age: '~1h ago', duration: '0m 55s', sha: '51d16d2' }, env: 'dev' },
  telemetry:     { synth: { status: 'success', age: '~2h ago', duration: '0m 31s', sha: '51e6de5' }, deploy: { status: 'success', age: '~2h ago', duration: '2m 11s', sha: '51e6de5' }, env: 'dev' },
  athena:        { synth: { status: 'success', age: '~2h ago', duration: '0m 22s', sha: '8c79e98' }, deploy: { status: 'success', age: '~2h ago', duration: '1m 44s', sha: '8c79e98' }, env: 'dev' },
  ella:          { synth: { status: 'success', age: '~1h ago', duration: '0m 29s', sha: '51e6de5' }, deploy: { status: 'success', age: '~1h ago', duration: '2m 04s', sha: '51e6de5' }, env: 'dev' },
  api:           { synth: { status: 'success', age: '~1h ago', duration: '0m 24s', sha: '51e6de5' }, deploy: { status: 'success', age: '~1h ago', duration: '1m 47s', sha: '51e6de5' }, env: 'dev' },
  cloudtrail:    { synth: { status: 'success', age: '~2h ago', duration: '0m 19s', sha: '8c79e98' }, deploy: { status: 'success', age: '~2h ago', duration: '1m 01s', sha: '8c79e98' }, env: 'dev' },
  observability: { synth: { status: 'skipped', age: '—',       duration: '—',      sha: '51d16d2' }, deploy: { status: 'skipped',  age: '—',        duration: '—',      sha: '51d16d2' }, env: 'dev' },
  dashboard:     { synth: { status: 'success', age: '~1h ago', duration: '0m 09s', sha: '6d554bf' }, deploy: { status: 'success', age: '~1h ago', duration: '0m 31s', sha: '6d554bf' }, env: 'dev' },
};

const HEALTH: Record<string, {
  status: HealthStatus;
  issue?: string;
  lambda?: { invocations: number; errors: number; p50: string; p99: string; throttles: number };
  ddb?: { reads: number; writes: number; throttles: number };
  lastSeen: string;
}> = {
  kms:           { status: 'healthy',  lastSeen: 'passive' },
  storage:       { status: 'healthy',  lastSeen: 'passive' },
  data:          { status: 'healthy',  ddb: { reads: 5132, writes: 450, throttles: 0 }, lastSeen: '<1m ago' },
  'url-minter':  { status: 'healthy',  lambda: { invocations: 312,  errors: 0,  p50: '44ms',  p99: '210ms', throttles: 0 }, ddb: { reads: 936,   writes: 312,  throttles: 0 }, lastSeen: '1m ago' },
  telemetry:     { status: 'healthy',  lambda: { invocations: 8821, errors: 12, p50: '18ms',  p99: '94ms',  throttles: 0 }, ddb: { reads: 26463, writes: 8833, throttles: 0 }, lastSeen: '<1m ago' },
  athena:        { status: 'healthy',  lastSeen: '8m ago' },
  ella:          { status: 'healthy',  lambda: { invocations: 48,   errors: 0,  p50: '4.2s',  p99: '12.1s', throttles: 0 }, ddb: { reads: 144,   writes: 48,   throttles: 0 }, lastSeen: '2m ago' },
  api:           { status: 'healthy',  lambda: { invocations: 1842, errors: 3,  p50: '89ms',  p99: '380ms', throttles: 0 }, ddb: { reads: 3741,  writes: 89,   throttles: 0 }, lastSeen: '<1m ago' },
  cloudtrail:    { status: 'healthy',  lastSeen: 'always-on' },
  observability: { status: 'degraded', issue: 'Optional stack — observability_account context not configured', lastSeen: 'pending' },
  dashboard:     { status: 'healthy',  lastSeen: 'passive' },
};

const COSTS = [
  { id: 'kms',           label: 'KMS',           monthly: 12,   budget: 50,   trend: [8,    9,    10,   11,   12],   driver: 'API calls' },
  { id: 'storage',       label: 'Storage (S3)',  monthly: 124,  budget: 300,  trend: [80,   95,   108,  118,  124],  driver: 'S3 + lifecycle' },
  { id: 'data',          label: 'Data (DDB)',    monthly: 89,   budget: 200,  trend: [62,   71,   79,   85,   89],   driver: 'DynamoDB reads/writes' },
  { id: 'url-minter',    label: 'URL Minter',    monthly: 78,   budget: 200,  trend: [60,   65,   68,   72,   78],   driver: 'S3 + Lambda' },
  { id: 'telemetry',     label: 'Telemetry',     monthly: 891,  budget: 1000, trend: [720,  790,  830,  860,  891],  driver: 'Firehose + S3' },
  { id: 'athena',        label: 'Athena',        monthly: 224,  budget: 400,  trend: [180,  195,  205,  218,  224],  driver: 'Athena scans' },
  { id: 'ella',          label: 'Ella',          monthly: 1284, budget: 1500, trend: [920,  1050, 1140, 1210, 1284], driver: 'Bedrock Claude Sonnet' },
  { id: 'api',           label: 'Nurse/Admin API',monthly: 342, budget: 600,  trend: [240,  280,  310,  325,  342],  driver: 'Lambda + DDB' },
  { id: 'cloudtrail',    label: 'CloudTrail',    monthly: 43,   budget: 100,  trend: [38,   40,   41,   42,   43],   driver: 'S3 storage' },
  { id: 'iot-core',      label: 'IoT Core',      monthly: 156,  budget: 300,  trend: [120,  130,  140,  148,  156],  driver: 'IoT messaging' },
  { id: 'observability', label: 'Observability', monthly: 67,   budget: 150,  trend: [50,   55,   59,   63,   67],   driver: 'Firehose egress' },
];

const DEP_NODES: Array<{ id: string; label: string; wave: number; deps: string[]; outputs: string[] }> = [
  { id: 'kms',           label: 'KMS',          wave: 0, deps: [],                                          outputs: ['data_key_arn', 's3_key_arn', 'sns_key_arn', 'sqs_key_arn'] },
  { id: 'storage',       label: 'Storage',      wave: 0, deps: ['kms'],                                     outputs: ['parquet_bucket', 'athena_results_bucket', 'cloudtrail_bucket', 'iot_errors_bucket'] },
  { id: 'data',          label: 'Data',         wave: 1, deps: ['kms'],                                     outputs: ['devices_table', 'alerts_table', 'updates_table'] },
  { id: 'url-minter',    label: 'URL Minter',   wave: 2, deps: ['kms', 'storage', 'data'],                  outputs: ['upload_url_fn', 'device_role_alias'] },
  { id: 'telemetry',     label: 'Telemetry',    wave: 2, deps: ['kms', 'storage', 'data'],                  outputs: ['alerts_sns_topic', 'fall_enricher_fn', 'telemetry_divergence_alarm'] },
  { id: 'athena',        label: 'Athena',       wave: 2, deps: ['kms', 'storage'],                          outputs: ['glue_database', 'athena_workgroup'] },
  { id: 'ella',          label: 'Ella',         wave: 2, deps: ['data', 'athena', 'storage'],               outputs: ['ella_fn', 'updates_table_ref'] },
  { id: 'api',           label: 'API',          wave: 3, deps: ['data', 'ella', 'athena', 'storage'],       outputs: ['api_endpoint', 'cognito_pool_id'] },
  { id: 'cloudtrail',    label: 'CloudTrail',   wave: 3, deps: ['data', 'storage'],                         outputs: ['trail_arn', 'trail_s3'] },
  { id: 'observability', label: 'Observability',wave: 4, deps: [],                                          outputs: ['metric_stream_arn', 'firehose_stream_arn'] },
  { id: 'dashboard',     label: 'Dashboard',    wave: 4, deps: [],                                          outputs: ['operator_dashboard'] },
];

// ── CDK stack content per service ────────────────────────────────────────────

const CDK_CONTENT: Record<string, Record<CdkFile, string>> = {

  ella: {
    'stack.py':
`# infra/stacks/ella_stack.py
from aws_cdk import Stack, Duration, RemovalPolicy
from aws_cdk import aws_iam as iam, aws_lambda as lambda_
from aws_cdk import aws_lambda_event_sources as event_sources
from aws_cdk import aws_sqs as sqs
from aws_cdk import aws_events as events, aws_events_targets as targets
from aws_cdk import aws_logs as logs
from constructs import Construct
from config.constants import (
    PYTHON_RUNTIME, TIMEOUT_ELLA, MEMORY_ELLA,
    BEDROCK_MODEL_CURRENT, ELLA_CRON_EXPRESSIONS,
    ELLA_VISIBILITY_TIMEOUT_SECONDS, ELLA_DLQ_RETENTION_DAYS,
)

class EllaStack(Stack):
    def __init__(self, scope, id, *, kms_stack, data_stack,
                 athena_stack, storage_stack,
                 facility_ids=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"
        facility_ids = facility_ids or ["FAC-PILOT-001"]

        self.fanout_dlq = sqs.Queue(self, "FanoutDlq",
            queue_name=f"{pfx}-ella-dlq",
            retention_period=Duration.days(ELLA_DLQ_RETENTION_DAYS))

        self.fanout_queue = sqs.Queue(self, "FanoutQueue",
            queue_name=f"{pfx}-ella-fanout",
            visibility_timeout=Duration.seconds(ELLA_VISIBILITY_TIMEOUT_SECONDS),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=kms_stack.sqs_key,
            dead_letter_queue=sqs.DeadLetterQueue(
                queue=self.fanout_dlq, max_receive_count=3))

        ella_role = iam.Role(self, "EllaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole")])
        data_stack.daily_updates_table.grant_write_data(ella_role)
        data_stack.alerts_table.grant_read_data(ella_role)
        kms_stack.data_key.grant_decrypt(ella_role)
        kms_stack.sqs_key.grant_decrypt(ella_role)
        ella_role.add_to_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=[f"arn:aws:bedrock:{self.region}::foundation-model/"
                       + BEDROCK_MODEL_CURRENT]))
        ella_role.add_to_policy(iam.PolicyStatement(
            actions=["athena:StartQueryExecution",
                     "athena:GetQueryExecution",
                     "athena:GetQueryResults"],
            resources=["*"]))
        storage_stack.athena_results_bucket.grant_read_write(ella_role)

        self.ella_lambda = lambda_.Function(self, "EllaFn",
            function_name=f"{pfx}-ella",
            runtime=PYTHON_RUNTIME, handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("../services/ella/src"),
            timeout=TIMEOUT_ELLA, memory_size=MEMORY_ELLA, role=ella_role,
            environment={
                "BEDROCK_MODEL_ID":   BEDROCK_MODEL_CURRENT,
                "UPDATES_TABLE":      data_stack.daily_updates_table.table_name,
                "ALERTS_TABLE":       data_stack.alerts_table.table_name,
                "ATHENA_WORKGROUP":   athena_stack.workgroup_name,
                "ATHENA_OUTPUT":      storage_stack.athena_results_bucket.bucket_name,
                "TELEMETRY_DATABASE": f"ambient_{env}_telemetry",
                "RAW_DATABASE":       f"ambient_{env}_raw",
            })
        self.ella_lambda.add_event_source(
            event_sources.SqsEventSource(self.fanout_queue, batch_size=1))

        # ELLA_CRON_EXPRESSIONS = ["cron(0 12 * * ? *)", "cron(0 0 * * ? *)"]
        # 12:00 UTC = 07:00 CT  |  00:00 UTC = 19:00 CT
        for fac in facility_ids:
            for i, expr in enumerate(ELLA_CRON_EXPRESSIONS):
                events.Rule(self, f"EllaCron{fac.replace('-','')}{i}",
                    schedule=events.Schedule.expression(expr),
                    targets=[targets.SqsQueue(self.fanout_queue,
                        message=events.RuleTargetInput.from_object(
                            {"facility_id": fac}))])`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "watch": {
    "include": ["**"],
    "exclude": ["README.md", "cdk*.json", "**/__pycache__/**", ".venv/**"]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001",
    "facility_ids": "FAC-PILOT-001",
    "enable_observability": "false"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1",
  "enable_observability": "false"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001,FAC-PILOT-002",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1",
  "enable_observability": "true"
}`,
  },

  api: {
    'stack.py':
`# infra/stacks/api_stack.py
from aws_cdk import Stack, Duration, RemovalPolicy
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_apigatewayv2_authorizers as authorizers
from aws_cdk import aws_iam as iam, aws_lambda as lambda_, aws_logs as logs
from constructs import Construct
from config.constants import PYTHON_RUNTIME, TIMEOUT_API, MEMORY_API

class ApiStack(Stack):
    def __init__(self, scope, id, *, kms_stack, data_stack, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"

        self.user_pool = cognito.UserPool(self, "Pool",
            user_pool_name=f"{pfx}-users",
            sign_in_aliases=cognito.SignInAliases(email=True),
            mfa=cognito.Mfa.OPTIONAL if env == "dev" else cognito.Mfa.REQUIRED,
            mfa_second_factor=cognito.MfaSecondFactor(otp=True, sms=False),
            password_policy=cognito.PasswordPolicy(
                min_length=12, require_uppercase=True,
                require_symbols=True, require_digits=True),
            self_sign_up_enabled=False,
            account_recovery=cognito.AccountRecovery.NONE,
            removal_policy=RemovalPolicy.RETAIN)

        # custom:role and custom:facilityIds carried in JWT claims
        self.user_pool.add_custom_attribute("role",
            cognito.StringAttribute(mutable=True))
        self.user_pool.add_custom_attribute("facilityIds",
            cognito.StringAttribute(mutable=True))

        client = self.user_pool.add_client("WebClient",
            auth_flows=cognito.AuthFlow(user_srp=True))

        api_role = iam.Role(self, "ApiRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole")])
        for t in [data_stack.alerts_table,
                  data_stack.daily_updates_table,
                  data_stack.devices_table]:
            t.grant_read_write_data(api_role)
        kms_stack.data_key.grant_decrypt(api_role)

        self.api_lambda = lambda_.Function(self, "ApiFn",
            function_name=f"{pfx}-api",
            runtime=PYTHON_RUNTIME, handler="main.handler",
            code=lambda_.Code.from_asset("../services/api",
                bundling=lambda_.BundlingOptions(
                    image=lambda_.Runtime.PYTHON_3_12.bundling_image,
                    command=["bash","-c",
                        "pip install -r requirements.txt -t /asset-output && "
                        "cp -r src/* /asset-output"])),
            timeout=TIMEOUT_API, memory_size=MEMORY_API, role=api_role,
            environment={
                "COGNITO_USER_POOL_ID": self.user_pool.user_pool_id,
                "ALERTS_TABLE":  data_stack.alerts_table.table_name,
                "UPDATES_TABLE": data_stack.daily_updates_table.table_name,
                "DEVICES_TABLE": data_stack.devices_table.table_name,
            })

        self.http_api = apigw.HttpApi(self, "HttpApi",
            api_name=f"{pfx}-api",
            cors_preflight=apigw.CorsPreflightOptions(
                allow_origins=["https://ellamemory.com"],
                allow_methods=[apigw.CorsHttpMethod.ANY],
                allow_headers=["Authorization", "Content-Type"]))

        jwt_auth = authorizers.HttpJwtAuthorizer(
            "CognitoAuth",
            f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool.user_pool_id}",
            jwt_audience=[client.user_pool_client_id])

        integration = integrations.HttpLambdaIntegration(
            "ApiIntegration", self.api_lambda)
        self.http_api.add_routes(path="/{proxy+}",
            methods=[apigw.HttpMethod.ANY],
            integration=integration, authorizer=jwt_auth)
        self.http_api.add_routes(path="/health",
            methods=[apigw.HttpMethod.GET], integration=integration)`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001",
    "facility_ids": "FAC-PILOT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001,FAC-PILOT-002",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  telemetry: {
    'stack.py':
`# infra/stacks/telemetry_stack.py  (hot path + Firehose legacy + reconciler)
from aws_cdk import Stack, Duration, RemovalPolicy
from aws_cdk import aws_sns as sns, aws_iam as iam, aws_lambda as lambda_
from aws_cdk import aws_iot as iot, aws_kinesisfirehose as firehose
from aws_cdk import aws_glue as glue, aws_logs as logs
from aws_cdk import aws_events as events, aws_events_targets as targets
from aws_cdk import aws_cloudwatch as cloudwatch
from constructs import Construct
from config.constants import (PYTHON_RUNTIME, TIMEOUT_ALERT, MEMORY_ALERT,
    TIMEOUT_RECONCILER, MEMORY_RECONCILER, FALL_ALERT_SQL, TELEMETRY_SQL)

class TelemetryStack(Stack):
    def __init__(self, scope, id, *,
                 kms_stack, storage_stack, data_stack, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"

        # ── Hot path: SNS fall-alerts topic ───────────────────────────────────
        self.fall_alerts_topic = sns.Topic(self, "FallAlerts",
            topic_name=f"{pfx}-fall-alerts",
            master_key=kms_stack.sns_key)

        # ── Alert enrichment Lambda ────────────────────────────────────────────
        alerts_role = iam.Role(self, "AlertsRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole")])
        data_stack.alerts_table.grant_write_data(alerts_role)
        self.fall_alerts_topic.grant_publish(alerts_role)
        kms_stack.sns_key.grant_encrypt_decrypt(alerts_role)

        self.alerts_lambda = lambda_.Function(self, "AlertsLambda",
            function_name=f"{pfx}-alerts-enricher",
            runtime=PYTHON_RUNTIME, handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("../services/telemetry/alerts-lambda/src"),
            timeout=TIMEOUT_ALERT, memory_size=MEMORY_ALERT, role=alerts_role,
            environment={
                "DEVICE_TABLE": data_stack.devices_table.table_name,
                "ALERT_TABLE":  data_stack.alerts_table.table_name,
                "SNS_TOPIC_ARN": self.fall_alerts_topic.topic_arn,
            })
        self.alerts_lambda.add_permission("AllowIoT",
            action="lambda:InvokeFunction",
            principal=iam.ServicePrincipal("iot.amazonaws.com"))

        # IoT error sink
        iot_error_role = iam.Role(self, "IotErrorRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"))
        storage_stack.iot_errors_bucket.grant_put(iot_error_role)

        # IoT Rule: Basic Ingest fall alerts → Lambda (no MQTT fee)
        # FALL_ALERT_SQL = "SELECT *, topic(4) AS deviceId
        #   FROM '$aws/rules/fall-enricher/ambient/v1/alerts/fall/+'"
        self.fall_alert_rule = iot.CfnTopicRule(self, "FallAlertRule",
            rule_name=f"{pfx.replace('-','_')}_fall_alerts",
            topic_rule_payload=iot.CfnTopicRule.TopicRulePayloadProperty(
                sql=FALL_ALERT_SQL, aws_iot_sql_version="2016-03-23",
                actions=[iot.CfnTopicRule.ActionProperty(
                    lambda_=iot.CfnTopicRule.LambdaActionProperty(
                        function_arn=self.alerts_lambda.function_arn))],
                error_action=iot.CfnTopicRule.ActionProperty(
                    s3=iot.CfnTopicRule.S3ActionProperty(
                        bucket_name=storage_stack.iot_errors_bucket.bucket_name,
                        key="fall-alerts/\${timestamp()}-\${newuuid()}",
                        role_arn=iot_error_role.role_arn))))

        # ── Glue table for Firehose telemetry aggregates ───────────────────────
        db_name = f"ambient_{env}_telemetry"
        self.telemetry_glue_db = glue.CfnDatabase(self, "TelemetryDb",
            catalog_id=self.account,
            database_input=glue.CfnDatabase.DatabaseInputProperty(name=db_name))

        _cols = [("deviceId","string"),("zone","string"),
                 ("windowStart","timestamp"),("windowEnd","timestamp"),
                 ("frameCount","int"),("points_sum","bigint"),
                 ("points_mean","double"),("points_max","int"),
                 ("height_max","double"),("height_mean","double"),
                 ("height_min","double"),("standing_sec","int"),
                 ("sitting_sec","int"),("lying_sec","int"),
                 ("floor_sec","int"),("unknown_sec","int")]

        self.telemetry_glue_table = glue.CfnTable(self, "TelemetryAggregates",
            catalog_id=self.account, database_name=db_name,
            table_input=glue.CfnTable.TableInputProperty(
                name="aggregates", table_type="EXTERNAL_TABLE",
                parameters={
                    "classification": "parquet", "parquet.compression": "ZSTD",
                    "projection.enabled": "true",
                    "projection.date.type": "date",
                    "projection.date.format": "yyyy-MM-dd",
                    "projection.date.range": "2026-01-01,NOW",
                    "projection.facility.type": "injected",
                    "projection.subject.type": "injected",
                    "projection.device.type": "injected",
                    "storage.location.template":
                        f"s3://{storage_stack.parquet_bucket.bucket_name}/telemetry/"
                        "date=\${date}/facility=\${facility}/subject=\${subject}/device=\${device}/"},
                partition_keys=[
                    glue.CfnTable.ColumnProperty(name="date",     type="string"),
                    glue.CfnTable.ColumnProperty(name="facility", type="string"),
                    glue.CfnTable.ColumnProperty(name="subject",  type="string"),
                    glue.CfnTable.ColumnProperty(name="device",   type="string")],
                storage_descriptor=glue.CfnTable.StorageDescriptorProperty(
                    location=f"s3://{storage_stack.parquet_bucket.bucket_name}/telemetry/",
                    input_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                    output_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                    serde_info=glue.CfnTable.SerdeInfoProperty(
                        serialization_library="org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"),
                    columns=[glue.CfnTable.ColumnProperty(name=n, type=t) for n, t in _cols])))
        self.telemetry_glue_table.add_dependency(self.telemetry_glue_db)

        # ── Firehose: legacy cold path (JQ dynamic partitioning, Parquet/ZSTD) ─
        firehose_role = iam.Role(self, "FirehoseRole",
            assumed_by=iam.ServicePrincipal("firehose.amazonaws.com"))
        storage_stack.parquet_bucket.grant_read_write(firehose_role)
        kms_stack.s3_key.grant_encrypt_decrypt(firehose_role)
        firehose_role.add_to_policy(iam.PolicyStatement(
            actions=["glue:GetTable","glue:GetTableVersion","glue:GetTableVersions"],
            resources=["*"]))

        firehose_name = f"{pfx}-telemetry"
        self.telemetry_firehose = firehose.CfnDeliveryStream(
            self, "TelemetryFirehose",
            delivery_stream_name=firehose_name,
            delivery_stream_type="DirectPut",
            extended_s3_destination_configuration=firehose.CfnDeliveryStream
                .ExtendedS3DestinationConfigurationProperty(
                role_arn=firehose_role.role_arn,
                bucket_arn=storage_stack.parquet_bucket.bucket_arn,
                prefix=(
                    "telemetry/"
                    "date=!{partitionKeyFromQuery:date}/"
                    "facility=!{partitionKeyFromQuery:facility}/"
                    "subject=!{partitionKeyFromQuery:subject}/"
                    "device=!{partitionKeyFromQuery:device}/"),
                buffering_hints=firehose.CfnDeliveryStream.BufferingHintsProperty(
                    size_in_m_bs=64, interval_in_seconds=300),
                dynamic_partitioning_configuration=firehose.CfnDeliveryStream
                    .DynamicPartitioningConfigurationProperty(enabled=True),
                processing_configuration=firehose.CfnDeliveryStream
                    .ProcessingConfigurationProperty(enabled=True, processors=[
                        firehose.CfnDeliveryStream.ProcessorProperty(
                            type="MetadataExtraction", parameters=[
                                firehose.CfnDeliveryStream.ProcessorParameterProperty(
                                    parameter_name="MetadataExtractionQuery",
                                    parameter_value="{date:.windowStart|.[0:10],"
                                        "facility:.facilityId,subject:.subjectId,device:.deviceId}"),
                                firehose.CfnDeliveryStream.ProcessorParameterProperty(
                                    parameter_name="JsonParsingEngine",
                                    parameter_value="JQ-1.6")])]),
                data_format_conversion_configuration=firehose.CfnDeliveryStream
                    .DataFormatConversionConfigurationProperty(
                    enabled=True,
                    input_format_configuration=firehose.CfnDeliveryStream
                        .InputFormatConfigurationProperty(
                        deserializer=firehose.CfnDeliveryStream.DeserializerProperty(
                            open_x_json_ser_de=firehose.CfnDeliveryStream.OpenXJsonSerDeProperty())),
                    output_format_configuration=firehose.CfnDeliveryStream
                        .OutputFormatConfigurationProperty(
                        serializer=firehose.CfnDeliveryStream.SerializerProperty(
                            parquet_ser_de=firehose.CfnDeliveryStream.ParquetSerDeProperty(
                                compression="SNAPPY"))),
                    schema_configuration=firehose.CfnDeliveryStream
                        .SchemaConfigurationProperty(
                        role_arn=firehose_role.role_arn, catalog_id=self.account,
                        database_name=db_name, table_name="aggregates",
                        region=self.region, version_id="LATEST"))))
        # Firehose validates Glue permissions at creation time — explicit dep avoids race
        self.telemetry_firehose.node.add_dependency(firehose_role)

        # IoT Rule: legacy cold path MQTT → Firehose (retiring)
        iot_firehose_role = iam.Role(self, "IotFirehoseRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"))
        iot_firehose_role.add_to_policy(iam.PolicyStatement(
            actions=["firehose:PutRecord","firehose:PutRecordBatch"],
            resources=[f"arn:aws:firehose:{self.region}:{self.account}:deliverystream/{firehose_name}"]))

        self.telemetry_rule = iot.CfnTopicRule(self, "TelemetryRule",
            rule_name=f"{pfx.replace('-','_')}_telemetry",
            topic_rule_payload=iot.CfnTopicRule.TopicRulePayloadProperty(
                sql=TELEMETRY_SQL, aws_iot_sql_version="2016-03-23",
                actions=[iot.CfnTopicRule.ActionProperty(
                    firehose=iot.CfnTopicRule.FirehoseActionProperty(
                        delivery_stream_name=firehose_name,
                        role_arn=iot_firehose_role.role_arn,
                        separator="\n"))],
                error_action=iot.CfnTopicRule.ActionProperty(
                    s3=iot.CfnTopicRule.S3ActionProperty(
                        bucket_name=storage_stack.iot_errors_bucket.bucket_name,
                        key="telemetry/\${timestamp()}-\${newuuid()}",
                        role_arn=iot_error_role.role_arn))))

        # ── Reconciler Lambda (embedded in this stack) ─────────────────────────
        # See services/reconciler/src/handler.py
        reconciler_role = iam.Role(self, "ReconcilerRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole")])
        reconciler_role.add_to_policy(iam.PolicyStatement(
            actions=["athena:StartQueryExecution","athena:GetQueryExecution",
                     "athena:GetQueryResults","athena:StopQueryExecution"], resources=["*"]))
        reconciler_role.add_to_policy(iam.PolicyStatement(
            actions=["glue:GetTable","glue:GetDatabase","glue:GetPartitions"],
            resources=["*"]))
        storage_stack.athena_results_bucket.grant_read_write(reconciler_role)
        kms_stack.s3_key.grant_decrypt(reconciler_role)
        reconciler_role.add_to_policy(iam.PolicyStatement(
            actions=["cloudwatch:PutMetricData"], resources=["*"]))

        self.reconciler_lambda = lambda_.Function(self, "Reconciler",
            function_name=f"{pfx}-reconciler",
            runtime=PYTHON_RUNTIME, handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("../services/reconciler/src"),
            timeout=TIMEOUT_RECONCILER, memory_size=MEMORY_RECONCILER,
            role=reconciler_role,
            environment={
                "TELEMETRY_DATABASE": db_name,
                "RAW_DATABASE":       f"ambient_{env}_raw",
                "ATHENA_WORKGROUP":   f"{pfx}-analytics",
                "ATHENA_OUTPUT":      f"s3://{storage_stack.athena_results_bucket.bucket_name}/queries/",
                "METRIC_NAMESPACE":   "AmbientIntelligence/Telemetry",
            })

        reconciler_schedule = events.Rule(self, "ReconcilerSchedule",
            rule_name=f"{pfx}-reconciler-15min",
            schedule=events.Schedule.rate(Duration.minutes(15)))
        reconciler_schedule.add_target(targets.LambdaFunction(self.reconciler_lambda))

        # Alarm: divergence > 0.1% (metric is 0-100 scale, threshold=0.1 = 0.1%)
        self.divergence_alarm = cloudwatch.Alarm(self, "DivergenceAlarm",
            alarm_name=f"{pfx}-telemetry-divergence",
            alarm_description="TelemetryDivergence > 0.1% — check dual-write migration",
            metric=cloudwatch.Metric(
                namespace="AmbientIntelligence/Telemetry",
                metric_name="TelemetryDivergence",
                statistic="Maximum",              # catch any bad window
                period=Duration.minutes(15)),
            threshold=0.1,                        # 0.1 = 0.1% (metric is pct-scale)
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING)`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001",
    "facility_ids": "FAC-PILOT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001,FAC-PILOT-002",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  'url-minter': {
    'stack.py':
`# infra/stacks/url_minter_stack.py
from aws_cdk import Stack, Duration, RemovalPolicy
from aws_cdk import aws_iam as iam, aws_lambda as lambda_
from aws_cdk import aws_iot as iot, aws_logs as logs
from constructs import Construct
from config.constants import (PYTHON_RUNTIME, TIMEOUT_URL_MINTER, MEMORY_URL_MINTER,
    URL_TTL_SECONDS, MAX_FILE_BYTES, MIN_FILE_BYTES, TELEMETRY_MAX_BYTES, TELEMETRY_URL_LIMIT)

class UrlMinterStack(Stack):
    def __init__(self, scope, id, *, kms_stack, storage_stack,
                 data_stack, tenant_id, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"

        lambda_role = iam.Role(self, "UrlMinterRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole")])
        data_stack.devices_table.grant_read_data(lambda_role)
        kms_stack.data_key.grant_decrypt(lambda_role)
        storage_stack.parquet_bucket.grant_put(lambda_role)
        kms_stack.s3_key.grant_encrypt(lambda_role)
        # Validate Thing identity via Device Shadow desired state (§6.2)
        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["iot:GetThingShadow"],
            resources=[f"arn:aws:iot:{self.region}:{self.account}:thing/*"]))
        # Per-device issuance rate metrics
        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["cloudwatch:PutMetricData"], resources=["*"]))

        self.url_minter_lambda = lambda_.Function(self, "UrlMinterFn",
            function_name=f"{pfx}-url-minter",
            runtime=PYTHON_RUNTIME, handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("../services/url-minter/src"),
            timeout=TIMEOUT_URL_MINTER, memory_size=MEMORY_URL_MINTER,
            role=lambda_role,
            environment={
                "PARQUET_BUCKET":      storage_stack.parquet_bucket.bucket_name,
                "DEVICE_TABLE":        data_stack.devices_table.table_name,
                "URL_TTL_SECONDS":     URL_TTL_SECONDS,
                "MAX_FILE_BYTES":      MAX_FILE_BYTES,
                "MIN_FILE_BYTES":      MIN_FILE_BYTES,
                "TELEMETRY_KMS_KEY_ID": kms_stack.s3_key.key_arn,
                "TELEMETRY_URL_LIMIT":  TELEMETRY_URL_LIMIT,
                "TELEMETRY_MAX_BYTES":  TELEMETRY_MAX_BYTES,
            })

        # Function URL — AWS_IAM; devices authenticate via SigV4 from IoT cred provider
        self.function_url = self.url_minter_lambda.add_function_url(
            auth_type=lambda_.FunctionUrlAuthType.AWS_IAM,
            cors=lambda_.FunctionUrlCorsOptions(
                allowed_origins=["*"],
                allowed_methods=[lambda_.HttpMethod.POST]))

        # Device IAM role (assumed via IoT Credentials Provider + role alias)
        self.device_upload_role = iam.Role(self, "DeviceUploadRole",
            role_name=f"{pfx}-device-upload",
            assumed_by=iam.ServicePrincipal("credentials.iot.amazonaws.com"),
            max_session_duration=Duration.hours(1))
        self.device_upload_role.add_to_policy(iam.PolicyStatement(
            actions=["lambda:InvokeFunctionUrl"],
            resources=[self.url_minter_lambda.function_arn]))

        # IoT ThingType required when Things have >3 searchable attributes
        self.device_thing_type = iot.CfnThingType(self, "DeviceThingType",
            thing_type_name=f"{pfx}-device",
            thing_type_properties=iot.CfnThingType.ThingTypePropertiesProperty(
                thing_type_description="Ambient Intelligence radar sensor node",
                searchable_attributes=["facilityId", "subjectId", "roomId"]))

        self.iot_role_alias = iot.CfnRoleAlias(self, "DeviceUploadAlias",
            role_alias=f"{pfx}-device-upload",
            role_arn=self.device_upload_role.role_arn,
            credential_duration_seconds=3600)

        self.device_iot_policy = iot.CfnPolicy(self, "DevicePolicy",
            policy_name=f"{pfx}-device-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {"Effect": "Allow",
                     "Action": "iot:AssumeRoleWithCertificate",
                     "Resource": self.iot_role_alias.attr_role_alias_arn},
                    {"Effect": "Allow",
                     "Action": "iot:Connect",
                     "Resource": f"arn:aws:iot:{self.region}:{self.account}:client"
                                 "/\${iot:Connection.Thing.ThingName}"},
                    # Fall alerts on Basic Ingest topic (no MQTT messaging fee)
                    {"Effect": "Allow",
                     "Action": "iot:Publish",
                     "Resource": f"arn:aws:iot:{self.region}:{self.account}:topic"
                                 "/ambient/v1/alerts/fall/\${iot:Connection.Thing.ThingName}"},
                ]})`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  athena: {
    'stack.py':
`# infra/stacks/athena_stack.py
from aws_cdk import Stack
from aws_cdk import aws_glue as glue, aws_athena as athena
from constructs import Construct
from config.constants import ATHENA_SCAN_LIMIT_BYTES

class AthenaStack(Stack):
    def __init__(self, scope, id, *, kms_stack, storage_stack, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"
        parquet_bkt = storage_stack.parquet_bucket.bucket_name
        results_bkt = storage_stack.athena_results_bucket.bucket_name

        self.raw_db_name   = f"ambient_{env}_raw"
        self.workgroup_name = f"{pfx}-analytics"

        self.raw_db = glue.CfnDatabase(self, "RawDb",
            catalog_id=self.account,
            database_input=glue.CfnDatabase.DatabaseInputProperty(
                name=self.raw_db_name))

        # Partition scheme: raw/date=/facility=/subject=/device=
        # "injected" partitions enforce WHERE facility=X in every query
        self.frames_table = glue.CfnTable(self, "FramesTable",
            catalog_id=self.account,
            database_name=self.raw_db_name,
            table_input=glue.CfnTable.TableInputProperty(
                name="frames", table_type="EXTERNAL_TABLE",
                parameters={
                    "parquet.compression": "ZSTD", "classification": "parquet",
                    "projection.enabled": "true",
                    "projection.date.type": "date",
                    "projection.date.format": "yyyy-MM-dd",
                    "projection.date.range": "2026-01-01,NOW",
                    "projection.facility.type": "injected",
                    "projection.subject.type":  "injected",
                    "projection.device.type":   "injected",
                    "storage.location.template":
                        f"s3://{parquet_bkt}/raw/"
                        "date=\${date}/facility=\${facility}/subject=\${subject}/device=\${device}/"},
                partition_keys=[
                    glue.CfnTable.ColumnProperty(name="date",     type="string"),
                    glue.CfnTable.ColumnProperty(name="facility", type="string"),
                    glue.CfnTable.ColumnProperty(name="subject",  type="string"),
                    glue.CfnTable.ColumnProperty(name="device",   type="string")],
                storage_descriptor=glue.CfnTable.StorageDescriptorProperty(
                    location=f"s3://{parquet_bkt}/raw/",
                    input_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                    output_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                    serde_info=glue.CfnTable.SerdeInfoProperty(
                        serialization_library="org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"),
                    # Columns from device-cloud-contract.md §7
                    columns=[
                        glue.CfnTable.ColumnProperty(name="frame_number",    type="bigint"),
                        glue.CfnTable.ColumnProperty(name="captured_at",     type="timestamp"),
                        glue.CfnTable.ColumnProperty(name="height_data",     type="array<array<double>>",
                            comment="list of [x,y,z] meters"),
                        glue.CfnTable.ColumnProperty(name="points_detected", type="int"),
                        glue.CfnTable.ColumnProperty(name="radar_temp_c",    type="float",
                            comment="nullable"),
                    ])))
        self.frames_table.add_dependency(self.raw_db)

        # 10 GB per-query scan cap, KMS-encrypted results, CloudWatch metrics enabled
        self.workgroup = athena.CfnWorkGroup(self, "Workgroup",
            name=self.workgroup_name, state="ENABLED",
            work_group_configuration=athena.CfnWorkGroup.WorkGroupConfigurationProperty(
                enforce_work_group_configuration=True,
                publish_cloud_watch_metrics_enabled=True,
                bytes_scanned_cutoff_per_query=ATHENA_SCAN_LIMIT_BYTES,
                result_configuration=athena.CfnWorkGroup.ResultConfigurationProperty(
                    output_location=f"s3://{results_bkt}/queries/",
                    encryption_configuration=athena.CfnWorkGroup.EncryptionConfigurationProperty(
                        encryption_option="SSE_KMS",
                        kms_key=kms_stack.s3_key.key_arn))))

        self.athena_output_location = f"s3://{results_bkt}/queries/"`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  cloudtrail: {
    'stack.py':
`# infra/stacks/cloudtrail_stack.py
from aws_cdk import Stack, RemovalPolicy
from aws_cdk import aws_cloudtrail as cloudtrail, aws_iam as iam
from constructs import Construct

class CloudTrailStack(Stack):
    def __init__(self, scope, id, *, kms_stack, storage_stack,
                 data_stack, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"
        trail_name = f"{pfx}-audit"

        # CloudTrail L2 doesn't auto-add the bucket policy for a pre-existing bucket
        for stmt in [
            iam.PolicyStatement(
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[storage_stack.cloudtrail_bucket.bucket_arn]),
            iam.PolicyStatement(
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{storage_stack.cloudtrail_bucket.bucket_arn}/AWSLogs/{self.account}/*"],
                conditions={"StringEquals": {
                    "s3:x-amz-acl": "bucket-owner-full-control",
                    "aws:SourceArn": f"arn:aws:cloudtrail:{self.region}:{self.account}:trail/{trail_name}"}}),
        ]:
            storage_stack.cloudtrail_bucket.add_to_resource_policy(stmt)

        trail = cloudtrail.Trail(self, "AuditTrail",
            trail_name=trail_name,
            bucket=storage_stack.cloudtrail_bucket,
            encryption_key=kms_stack.s3_key,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            send_to_cloud_watch_logs=False)

        # DDB data events on all sensitive tables
        for table in [data_stack.alerts_table, data_stack.daily_updates_table,
                      data_stack.devices_table]:
            trail.add_dynamo_db_event_selector(
                [table],
                include_management_events=False,
                data_value=cloudtrail.DataResourceType.DYNAMODB_TABLE)

        # S3 READ_ONLY data events on the parquet bucket (raw/ prefix only)
        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(
                bucket=storage_stack.parquet_bucket, object_prefix="raw/")],
            include_management_events=False,
            read_write_type=cloudtrail.ReadWriteType.READ_ONLY)`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  'iot-core': {
    'stack.py':
`# IoT Core components are split across two CDK stacks:
#   infra/stacks/telemetry_stack.py  — IoT Rules (fall-enricher + legacy telemetry)
#   infra/stacks/url_minter_stack.py — Role alias + device IoT policy

# ── IoT Rules (from TelemetryStack) ──────────────────────────────────────────
# FALL_ALERT_SQL:
#   "SELECT *, topic(4) AS deviceId
#    FROM '$aws/rules/fall-enricher/ambient/v1/alerts/fall/+'"
#
# Basic Ingest prefix ($aws/rules/) means IoT Core does NOT charge per-message.
# The fall alert topic is:  ambient/v1/alerts/fall/<ThingName>
# This rule republishes to Lambda with no messaging fee.

self.fall_alert_rule = iot.CfnTopicRule(self, "FallAlertRule",
    rule_name=f"{pfx.replace('-','_')}_fall_alerts",
    topic_rule_payload=iot.CfnTopicRule.TopicRulePayloadProperty(
        sql=FALL_ALERT_SQL, aws_iot_sql_version="2016-03-23",
        actions=[iot.CfnTopicRule.ActionProperty(
            lambda_=iot.CfnTopicRule.LambdaActionProperty(
                function_arn=self.alerts_lambda.function_arn))],
        error_action=iot.CfnTopicRule.ActionProperty(
            s3=iot.CfnTopicRule.S3ActionProperty(
                bucket_name=storage_stack.iot_errors_bucket.bucket_name,
                key="fall-alerts/\${timestamp()}-\${newuuid()}",
                role_arn=iot_error_role.role_arn))))

# TELEMETRY_SQL (legacy cold path, retiring):
#   "SELECT *, clientid() AS deviceId FROM 'ambient/v1/telemetry/+'"
#   facilityId/subjectId come from device payload — aws_iot::things() is not valid IoT SQL

self.telemetry_rule = iot.CfnTopicRule(self, "TelemetryRule", ...)

# ── Device policy + role alias (from UrlMinterStack) ─────────────────────────
# Devices authenticate via SigV4: IoT Credentials Provider → role alias
# → DeviceUploadRole → lambda:InvokeFunctionUrl on url-minter

# Connect: scoped to the device's own ThingName (not just any clientId)
{"Effect": "Allow", "Action": "iot:Connect",
 "Resource": "arn:aws:iot:REGION:ACCOUNT:client/\${iot:Connection.Thing.ThingName}"}

# Publish: only to the device's own fall-alert topic (Basic Ingest)
{"Effect": "Allow", "Action": "iot:Publish",
 "Resource": "arn:aws:iot:REGION:ACCOUNT:topic"
             "/ambient/v1/alerts/fall/\${iot:Connection.Thing.ThingName}"}`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  kms: {
    'stack.py':
`# infra/stacks/kms_stack.py
# One key per data domain — revoking/rotating one key doesn't affect others.
# All keys: RETAIN on deletion (audit records are research data).
from aws_cdk import Stack, RemovalPolicy
from aws_cdk import aws_kms as kms
from constructs import Construct

class KmsStack(Stack):
    def __init__(self, scope, id, *, tenant_id, **kwargs):
        super().__init__(scope, id, **kwargs)

        def _key(logical_id, desc, domain):
            return kms.Key(self, logical_id,
                description=desc,
                enable_key_rotation=True,        # annual auto-rotation
                removal_policy=RemovalPolicy.RETAIN,
                alias=f"alias/ambient/{tenant_id}/{domain}")

        # DynamoDB: devices, alerts, daily-updates
        self.data_key = _key("DataKey",
            f"DynamoDB CMK for tenant {tenant_id}", "data")

        # S3: parquet, athena-results, cloudtrail
        self.s3_key  = _key("S3Key",
            f"S3 CMK for tenant {tenant_id}", "s3")

        # SNS: fall-alerts topic
        self.sns_key = _key("SnsKey",
            f"SNS CMK for tenant {tenant_id}", "sns")

        # SQS: ella-fanout + ella-dlq
        self.sqs_key = _key("SqsKey",
            f"SQS CMK for tenant {tenant_id}", "sqs")`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  observability: {
    'stack.py':
`# infra/stacks/observability_stack.py
# Scalar metrics ONLY — no logs, no traces, no string dimensions that could
# carry a subject identifier.  Compliance line: SREs see fleet health without
# reading any subject's data.
from aws_cdk import Stack, CfnOutput
from aws_cdk import aws_cloudwatch as cloudwatch, aws_iam as iam
from constructs import Construct

class ObservabilityStack(Stack):
    def __init__(self, scope, id, *,
                 observability_account,
                 observability_firehose_arn="",   # from CDK context
                 **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"

        stream_role = iam.Role(self, "MetricStreamRole",
            role_name=f"{pfx}-metric-stream",
            assumed_by=iam.ServicePrincipal(
                "streams.metrics.cloudwatch.amazonaws.com"))

        destination_arn = (
            observability_firehose_arn or
            f"arn:aws:firehose:{self.region}:{observability_account}"
            ":deliverystream/ambient-tenant-ingest")

        stream_role.add_to_policy(iam.PolicyStatement(
            actions=["firehose:PutRecord","firehose:PutRecordBatch"],
            resources=[destination_arn]))

        # Named namespaces only — no wildcard (avoids accidentally forwarding new metrics)
        self.metric_stream = cloudwatch.CfnMetricStream(self, "MetricStream",
            name=f"{pfx}-metric-stream",
            role_arn=stream_role.role_arn,
            firehose_arn=destination_arn,
            output_format="json",
            include_filters=[
                cloudwatch.CfnMetricStream.MetricStreamFilterProperty(
                    namespace=ns)
                for ns in [
                    "AmbientIntelligence/Telemetry",  # TelemetryDivergence, path counts
                    "AWS/Lambda",                      # error rates for ambient-* functions
                    "AWS/ApiGateway",                  # 4xx/5xx for the nurse API
                    "AWS/DynamoDB",                    # throttling events
                    "AWS/Athena",                      # scan bytes, query latency
                ]])

        # Firehose has no resource-based policies. Tenant-side IAM grant above is sufficient.
        # Deploy ObservabilityCentralStack once in the obs account to create the stream.
        CfnOutput(self, "ObsSetupNote",
            value=(f"Deploy ObservabilityCentralStack in account {observability_account} once "
                   f"(--context deploy_obs_central=true), then pass its FirehoseArn output "
                   f"as --context observability_firehose_arn=<arn> to this deploy."),
            description="One-time setup — see infra/stacks/observability_central_stack.py")

# ── ObservabilityCentralStack ─────────────────────────────────────────────────
# infra/stacks/observability_central_stack.py
# Deploy ONCE into the central observability account:
#   cdk deploy Ambient-obs-ObsCentral --context deploy_obs_central=true
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_iam as iam, aws_kinesisfirehose as firehose, aws_s3 as s3

class ObservabilityCentralStack(Stack):
    def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)

        self.metrics_bucket = s3.Bucket(self, "MetricsBucket",
            bucket_name=f"ambient-obs-metrics-{self.account}",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True, removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[s3.LifecycleRule(id="expire", expiration=Duration.days(90))])

        firehose_role = iam.Role(self, "FirehoseRole",
            role_name="ambient-obs-firehose-delivery",
            assumed_by=iam.ServicePrincipal("firehose.amazonaws.com"))
        self.metrics_bucket.grant_read_write(firehose_role)

        self.ingest_stream = firehose.CfnDeliveryStream(self, "IngestStream",
            delivery_stream_name="ambient-tenant-ingest",
            delivery_stream_type="DirectPut",
            s3_destination_configuration=firehose.CfnDeliveryStream
                .S3DestinationConfigurationProperty(
                bucket_arn=self.metrics_bucket.bucket_arn,
                role_arn=firehose_role.role_arn,
                prefix="metrics/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/",
                error_output_prefix="errors/",
                buffering_hints=firehose.CfnDeliveryStream.BufferingHintsProperty(
                    interval_in_seconds=300, size_in_m_bs=128),
                compression_format="GZIP"))
        self.ingest_stream.node.add_dependency(firehose_role)

        CfnOutput(self, "FirehoseArn",      # → pass as observability_firehose_arn context
            value=self.ingest_stream.attr_arn,
            export_name="ambient-obs-ingest-firehose-arn")
        CfnOutput(self, "MetricsBucketName",
            value=self.metrics_bucket.bucket_name)`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001",
    "observability_account": "CENTRAL_ACCOUNT_ID"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "observability_account": "CENTRAL_ACCOUNT_ID",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "observability_account": "CENTRAL_ACCOUNT_ID",
  "observability_firehose_arn": "arn:aws:firehose:us-east-1:CENTRAL_ACCOUNT_ID:deliverystream/ambient-tenant-ingest",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  storage: {
    'stack.py':
`# infra/stacks/storage_stack.py
from aws_cdk import Stack, Duration, RemovalPolicy
from aws_cdk import aws_s3 as s3
from constructs import Construct
from config.constants import S3_IA_DAYS, S3_GLACIER_DAYS, HIPAA_RETENTION_DAYS
from stacks.kms_stack import KmsStack

class StorageStack(Stack):
    def __init__(self, scope, id, *, kms_stack: KmsStack, tenant_id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        slug = tenant_id.lower().replace("-", "")
        acct = self.account

        self.access_logs_bucket = s3.Bucket(self, "AccessLogs",
            bucket_name=f"ambient-{slug}-access-logs-{acct}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[s3.LifecycleRule(id="expire", expiration=Duration.days(90))])

        self.parquet_bucket = s3.Bucket(self, "Parquet",
            bucket_name=f"ambient-{slug}-parquet-{acct}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_stack.s3_key, bucket_key_enabled=True,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN,
            server_access_logs_bucket=self.access_logs_bucket,
            server_access_logs_prefix="parquet/",
            lifecycle_rules=[
                s3.LifecycleRule(id="tier-raw", prefix="raw/",
                    transitions=[
                        s3.Transition(storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                                      transition_after=Duration.days(S3_IA_DAYS)),
                        s3.Transition(storage_class=s3.StorageClass.GLACIER,
                                      transition_after=Duration.days(S3_GLACIER_DAYS))]),
                s3.LifecycleRule(id="tier-telemetry", prefix="telemetry/",
                    transitions=[
                        s3.Transition(storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                                      transition_after=Duration.days(S3_IA_DAYS)),
                        s3.Transition(storage_class=s3.StorageClass.GLACIER,
                                      transition_after=Duration.days(S3_GLACIER_DAYS))])])

        self.athena_results_bucket = s3.Bucket(self, "AthenaResults",
            bucket_name=f"ambient-{slug}-athena-results-{acct}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_stack.s3_key, bucket_key_enabled=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(id="expire-results", prefix="queries/",
                    expiration=Duration.days(30))])

        self.iot_errors_bucket = s3.Bucket(self, "IotErrors",
            bucket_name=f"ambient-{slug}-iot-errors-{acct}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[s3.LifecycleRule(id="expire", expiration=Duration.days(30))])

        # CloudTrail audit — HIPAA 7-year retain
        self.cloudtrail_bucket = s3.Bucket(self, "CloudTrail",
            bucket_name=f"ambient-{slug}-cloudtrail-{acct}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_stack.s3_key, bucket_key_enabled=True,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(id="tier-and-retain",
                    transitions=[
                        s3.Transition(storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                                      transition_after=Duration.days(30)),
                        s3.Transition(storage_class=s3.StorageClass.GLACIER,
                                      transition_after=Duration.days(90))],
                    expiration=Duration.days(HIPAA_RETENTION_DAYS),
                    noncurrent_version_expiration=s3.NoncurrentVersionExpiration(
                        noncurrent_days=90))])`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  data: {
    'stack.py':
`# infra/stacks/data_stack.py
from aws_cdk import Stack
from aws_cdk import aws_dynamodb as dynamodb
from constructs import Construct
from ambient_constructs.ambient_table import AmbientTable
from stacks.kms_stack import KmsStack

class DataStack(Stack):
    def __init__(self, scope, id, *, kms_stack: KmsStack, **kwargs):
        super().__init__(scope, id, **kwargs)
        env = id.split("-")[1]; pfx = f"ambient-{env}"

        # Device registry — queried by url-minter, telemetry Lambda, API
        self.devices_table = AmbientTable(self, "Devices",
            table_name=f"{pfx}-devices",
            partition_key=dynamodb.Attribute(
                name="deviceId", type=dynamodb.AttributeType.STRING),
            encryption_key=kms_stack.data_key).table
        self.devices_table.add_global_secondary_index(
            index_name="facility-index",
            partition_key=dynamodb.Attribute(
                name="facilityId", type=dynamodb.AttributeType.STRING))

        # Alerts — telemetry Lambda writes; API + Ella read
        self.alerts_table = AmbientTable(self, "Alerts",
            table_name=f"{pfx}-alerts",
            partition_key=dynamodb.Attribute(
                name="subject_date", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(
                name="detectedAt", type=dynamodb.AttributeType.STRING),
            encryption_key=kms_stack.data_key).table
        self.alerts_table.add_global_secondary_index(
            index_name="facility-time",
            partition_key=dynamodb.Attribute(
                name="facilityId", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(
                name="detectedAt", type=dynamodb.AttributeType.STRING))
        self.alerts_table.add_global_secondary_index(
            index_name="eventId-index",
            partition_key=dynamodb.Attribute(
                name="eventId", type=dynamodb.AttributeType.STRING))

        # Daily updates / Ella narratives — 90-day TTL
        self.daily_updates_table = AmbientTable(self, "Updates",
            table_name=f"{pfx}-daily-updates",
            partition_key=dynamodb.Attribute(
                name="subjectId", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(
                name="generatedAt", type=dynamodb.AttributeType.STRING),
            encryption_key=kms_stack.data_key,
            ttl_attribute="ttl").table
        self.daily_updates_table.add_global_secondary_index(
            index_name="facility-time",
            partition_key=dynamodb.Attribute(
                name="facilityId", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(
                name="generatedAt", type=dynamodb.AttributeType.STRING))

# ambient_constructs/ambient_table.py  (L3 construct)
# AmbientTable = PAY_PER_REQUEST + PITR + KMS + RemovalPolicy.RETAIN
# All three tables use the same CMK (kms_stack.data_key)`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  reconciler: {
    'stack.py':
`# services/reconciler/src/handler.py  (Lambda embedded in TelemetryStack)
# infra/stacks/telemetry_stack.py — ReconcilerLambda section
#
# Queries both Athena cold paths for the trailing 1h, computes per-facility
# divergence percentage, emits 3 CW metrics per facility per invocation.
import boto3, os, time
from datetime import datetime, timezone, timedelta

athena     = boto3.client("athena")
cloudwatch = boto3.client("cloudwatch")

WORKGROUP  = os.environ["ATHENA_WORKGROUP"]
OUTPUT     = os.environ["ATHENA_OUTPUT"]
NAMESPACE  = os.environ["METRIC_NAMESPACE"]
TEL_DB     = os.environ["TELEMETRY_DATABASE"]
RAW_DB     = os.environ["RAW_DATABASE"]

DEVICE_SQL = """
    SELECT facility, subject, date_trunc('hour', window_start) AS window_hour,
           SUM(frame_count) AS record_count
    FROM {db}.aggregates
    WHERE date >= '{since_date}'
    GROUP BY 1,2,3
"""

FIREHOSE_SQL = """
    SELECT facility, subject, date_trunc('hour', from_iso8601_timestamp(window_start)) AS window_hour,
           COUNT(*) AS record_count
    FROM {db}.aggregates
    WHERE date = '{since_date}'
    GROUP BY 1,2,3
"""

def _run(sql):
    qid = athena.start_query_execution(
        QueryString=sql,
        WorkGroup=WORKGROUP,
        ResultConfiguration={"OutputLocation": OUTPUT})["QueryExecutionId"]
    while True:
        state = athena.get_query_execution(QueryExecutionId=qid)[
            "QueryExecution"]["Status"]["State"]
        if state == "SUCCEEDED": break
        if state in ("FAILED","CANCELLED"):
            raise RuntimeError(f"Query {qid} {state}")
        time.sleep(2)
    rows, paginator = [], athena.get_paginator("get_query_results")
    for page in paginator.paginate(QueryExecutionId=qid):
        rows.extend(page["ResultSet"]["Rows"])
    headers = [c["VarCharValue"] for c in rows[0]["Data"]]
    return [dict(zip(headers, [c.get("VarCharValue","") for c in r["Data"]]))
            for r in rows[1:]]

def lambda_handler(event, context):
    since = (datetime.now(timezone.utc) - timedelta(hours=1)).date().isoformat()
    device_rows   = {(r["facility"],r["subject"],r["window_hour"]):
                     int(r["record_count"]) for r in _run(DEVICE_SQL.format(db=TEL_DB, since_date=since))}
    firehose_rows = {(r["facility"],r["subject"],r["window_hour"]):
                     int(r["record_count"]) for r in _run(FIREHOSE_SQL.format(db=RAW_DB, since_date=since))}

    all_keys     = set(device_rows) | set(firehose_rows)
    by_facility  = {}
    for fac, subj, hour in all_keys:
        d = device_rows.get((fac,subj,hour), 0)
        f = firehose_rows.get((fac,subj,hour), 0)
        e = by_facility.setdefault(fac, {"device":0,"firehose":0})
        e["device"]   += d;  e["firehose"] += f

    metrics, fac_divergence = [], {}
    for fac, counts in by_facility.items():
        total = counts["device"] + counts["firehose"]
        pct   = abs(counts["device"] - counts["firehose"]) / total * 100 if total else 0
        fac_divergence[fac] = {**counts, "divergence_pct": round(pct, 4)}
        metrics += [
            {"MetricName":"TelemetryDivergence","Value":pct,"Unit":"Percent",
             "Dimensions":[{"Name":"FacilityId","Value":fac}]},
            {"MetricName":"DevicePathRecords","Value":counts["device"],"Unit":"Count",
             "Dimensions":[{"Name":"FacilityId","Value":fac}]},
            {"MetricName":"FirehosePathRecords","Value":counts["firehose"],"Unit":"Count",
             "Dimensions":[{"Name":"FacilityId","Value":fac}]},
        ]
    for i in range(0, len(metrics), 20):
        cloudwatch.put_metric_data(Namespace=NAMESPACE, MetricData=metrics[i:i+20])

    return {"facilities_checked": len(by_facility), "facility_divergence": fac_divergence}`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001",
    "facility_ids": "FAC-PILOT-001"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "facility_ids": "FAC-PILOT-001,FAC-PILOT-002",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },
};
// ── Shared UI primitives ──────────────────────────────────────────────────────

function Sparkline({ data, color = 'var(--accent)', width = 72, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / range) * (height - 6) + 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

function RunPill({ status, age, duration }: { status: RunStatus; age: string; duration: string }) {
  const map: Record<RunStatus, { bg: string; color: string; label: string }> = {
    success: { bg: 'rgba(35,134,54,0.15)',   color: '#3fb950', label: '✓' },
    failure: { bg: 'rgba(248,81,73,0.15)',   color: '#f85149', label: '✗' },
    running: { bg: 'rgba(187,128,9,0.15)',   color: '#d29922', label: '◌' },
    queued:  { bg: 'rgba(139,148,158,0.15)', color: '#8b949e', label: '○' },
    skipped: { bg: 'rgba(139,148,158,0.10)', color: '#6e7681', label: '—' },
  };
  const m = map[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: m.bg, color: m.color, border: `1px solid ${m.color}40`, borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
        {m.label} {status}
      </span>
      {age !== '—' && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#6e7681' }}>{age}</span>}
      {duration !== '—' && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#6e7681' }}>{duration}</span>}
    </div>
  );
}

function Metric({ label, value, sub, alert }: { label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: alert ? '#f85149' : 'var(--text)' }}>{value}</span>
      {sub && <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>{sub}</span>}
    </div>
  );
}

function diffTfvars(devText: string, prodText: string): Array<{ key: string; dev: string | null; prod: string | null; changed: boolean }> {
  const parse = (text: string) => {
    const map: Record<string, string> = {};
    text.split('\n').forEach(line => {
      const m = line.match(/^\s*"(\w+)"\s*:\s*"?([^"#\n,]*)"?,?\s*$/);
      if (m) map[m[1].trim()] = m[2].trim();
    });
    return map;
  };
  const dev = parse(devText);
  const prod = parse(prodText);
  const keys = Array.from(new Set([...Object.keys(dev), ...Object.keys(prod)])).sort();
  return keys.map(key => ({
    key,
    dev: dev[key] ?? null,
    prod: prod[key] ?? null,
    changed: dev[key] !== prod[key],
  }));
}

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
            cdk · {iac}
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
        <Group label="Factory & Control Plane" type="factory" note="separate AWS account">
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
            <Node label="Device" sub="5-min batch · SNAPPY" type="device" />
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

      <Group label="Nurse / Admin API" type="api" note="16 endpoints · row-level facility scope" iac="api">
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CloudPage() {
  const [tab, setTab] = useState<Tab>('services');
  const [editingSvc, setEditingSvc] = useState<(typeof SERVICES)[0] | null>(null);

  // Editor state
  const [editorSvc, setEditorSvcRaw] = useState('ella');
  const [editorFile, setEditorFile] = useState<CdkFile>('stack.py');
  const [editorContent, setEditorContent] = useState<Record<string, Record<CdkFile, string>>>(CDK_CONTENT);
  const [testStatus,  setTestStatus]  = useState<ActionStatus>('idle');
  const [gitStatus,   setGitStatus]   = useState<ActionStatus>('idle');
  const [applyStatus, setApplyStatus] = useState<ActionStatus>('idle');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [diffMode, setDiffMode] = useState(false);

  const setEditorSvc = (id: string) => {
    setEditorSvcRaw(id);
    setEditorFile('stack.py');
    setTestStatus('idle');
    setGitStatus('idle');
    setApplyStatus('idle');
    setActionLog([]);
    setDiffMode(false);
  };

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

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
    setActionLog([`$ git add infra/stacks/${editorSvc}_stack.py`]);
    await sleep(500);
    setActionLog(p => [...p, `$ git commit -m "cdk(${editorSvc}): update stack"`]);
    await sleep(800);
    setActionLog(p => [...p,
      `[main 3a7f2c1] cdk(${editorSvc}): update stack`,
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
    setActionLog([`$ cd infra && cdk synth Ambient-dev-${editorSvc} ...`]);
    await sleep(1000);
    setActionLog(p => [...p,
      `Synthesizing CDK app...`,
      `Supply a stack id (--app) to select specific stacks`,
      `Successfully synthesized to infra/cdk.out/`,
    ]);
    await sleep(500);
    setActionLog(p => [...p, `$ cdk deploy Ambient-dev-${editorSvc} --require-approval never ...`]);
    await sleep(1300);
    setActionLog(p => [...p,
      `Ambient-dev-${editorSvc}: deploying...`,
      `Ambient-dev-${editorSvc}: creating CloudFormation changeset...`,
      ``,
      `Ambient-dev-${editorSvc}: Stack ARN: arn:aws:cloudformation:us-east-1:123456789012:stack/Ambient-dev-${editorSvc}/...`,
      `✓  CDK deployed · Ambient-dev-${editorSvc} (dev)`,
    ]);
    setApplyStatus('ok');
  };

  const cloudNav: { key: Tab; label: string }[] = [
    { key: 'services',     label: 'Services' },
    { key: 'paths',        label: 'Data Paths' },
    { key: 'architecture', label: 'Architecture' },
    { key: 'deps',         label: 'Dependencies' },
    { key: 'accounts',     label: 'Account Model' },
    { key: 'runbooks',     label: 'Runbooks' },
  ];
  const opsNav: { key: Tab; label: string }[] = [
    { key: 'pipeline', label: 'CI/CD Pipeline' },
    { key: 'health',   label: 'Service Health' },
    { key: 'costs',    label: 'Cost Breakdown' },
    { key: 'editor',   label: 'IaC Editor' },
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
          {cloudNav.map(item => (
            <button key={item.key} className={`nav-item${tab === item.key ? ' active' : ''}`} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <p className="nav-label">Operations</p>
          {opsNav.map(item => (
            <button key={item.key} className={`nav-item${tab === item.key ? ' active' : ''}`} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <p className="nav-label">Resources</p>
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text-2)' }}>v4 · 2026-05-10</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Data handling</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>IRB-approved · HIPAA §164.514(c) coded data · No names, DOBs, or MRNs</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {['AWS CDK v2', 'Python 3.12', 'FastAPI', 'AWS Bedrock'].map(tag => (
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
                { label: 'With CDK infra', value: SERVICES.filter(s => s.tf).length },
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
                    {['Service', 'Type', 'Description', 'Tests', 'Infra', 'State', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map(svc => (
                    <tr key={svc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <a href={`https://github.com/ambientintel/ambientcloud/tree/main/${svc.path}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>{svc.label} ↗</a>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px' }}>{svc.tag}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 400 }}>{svc.desc}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: svc.tests ? 'var(--text)' : 'var(--text-4)', textAlign: 'center' }}>{svc.tests ?? '—'}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 13, color: svc.tf ? 'var(--accent)' : 'var(--text-4)' }}>{svc.tf ? '✓' : '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {svc.tf && CDK_STATE[svc.id] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{CDK_STATE[svc.id].cfnResources} res</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)' }}>{CDK_STATE[svc.id].lastDeploy}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setEditingSvc(svc)}
                          style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '3px 10px', borderRadius: 4, border: '1px solid var(--line)', color: 'var(--text-3)', background: 'transparent', cursor: 'pointer' }}
                        >Edit</button>
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

        {/* ── CI/CD Pipeline ── */}
        {tab === 'pipeline' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · .github/workflows/</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>CI/CD Pipeline</h1>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Passing',  value: Object.values(PIPELINE).filter(p => p.deploy.status === 'success').length, color: '#3fb950' },
                { label: 'Failed',   value: Object.values(PIPELINE).filter(p => p.synth.status === 'failure' || p.deploy.status === 'failure').length, color: '#f85149' },
                { label: 'Running',  value: Object.values(PIPELINE).filter(p => p.synth.status === 'running' || p.deploy.status === 'running').length, color: '#d29922' },
                { label: 'Services', value: Object.keys(PIPELINE).length, color: 'var(--text)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Service', 'Env', 'Synth', 'Deploy', 'SHA'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.filter(s => s.tf).map(svc => {
                    const p = PIPELINE[svc.id];
                    if (!p) return null;
                    return (
                      <tr key={svc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>{svc.label}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', marginTop: 2 }}>{svc.path}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: p.env === 'prod' ? '#d29922' : 'var(--text-3)', background: p.env === 'prod' ? 'rgba(210,153,34,0.1)' : 'var(--surface-2)', border: `1px solid ${p.env === 'prod' ? 'rgba(210,153,34,0.3)' : 'var(--line)'}`, borderRadius: 4, padding: '2px 7px' }}>{p.env}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}><RunPill status={p.synth.status} age={p.synth.age} duration={p.synth.duration} /></td>
                        <td style={{ padding: '12px 14px' }}><RunPill status={p.deploy.status} age={p.deploy.age} duration={p.deploy.duration} /></td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{p.synth.sha}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Dependencies ── */}
        {tab === 'deps' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · infra/app.py</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Dependency Graph</h1>
            </div>
            {/* Wave visualization */}
            {(() => {
              const waves = [0, 1, 2, 3, 4];
              return (
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '24px', marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                    {waves.map(w => {
                      const nodes = DEP_NODES.filter(n => n.wave === w);
                      return (
                        <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 4 }}>Wave {w} {w === 0 ? '· parallel' : ''}</div>
                          {nodes.map(node => {
                            const st = CDK_STATE[node.id];
                            const health = HEALTH[node.id];
                            const healthColor = health?.status === 'healthy' ? '#3fb950' : health?.status === 'degraded' ? '#d29922' : '#f85149';
                            return (
                              <div key={node.id} style={{ background: 'var(--surface-2)', border: `1px solid var(--line)`, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${healthColor}` }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{node.label}</div>
                                {node.deps.length > 0 && (
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', marginBottom: 4 }}>
                                    ← {node.deps.join(', ')}
                                  </div>
                                )}
                                {st && <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)' }}>{st.cfnResources} res · {st.lastDeploy}</div>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                    {[['#3fb950', 'Healthy'], ['#d29922', 'Degraded'], ['#f85149', 'Down']].map(([c, l]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 3, height: 14, background: c, borderRadius: 2, display: 'inline-block' }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Detailed table */}
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Service', 'Wave', 'Depends on', 'Outputs'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEP_NODES.map(node => (
                    <tr key={node.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>{node.label}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>{node.wave}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {node.deps.length === 0
                          ? <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>—</span>
                          : <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {node.deps.map(d => <span key={d} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 6px' }}>{d}</span>)}
                            </div>
                        }
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {node.outputs.map(o => <span key={o} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#79c0ff', background: 'rgba(56,139,253,0.08)', border: '1px solid rgba(56,139,253,0.2)', borderRadius: 4, padding: '2px 6px' }}>{o}</span>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Service Health ── */}
        {tab === 'health' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · CloudWatch · last 1h</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Service Health</h1>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Healthy',  value: Object.values(HEALTH).filter(h => h.status === 'healthy').length,  color: '#3fb950' },
                { label: 'Degraded', value: Object.values(HEALTH).filter(h => h.status === 'degraded').length, color: '#d29922' },
                { label: 'Down',     value: Object.values(HEALTH).filter(h => h.status === 'down').length,     color: '#f85149' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {SERVICES.map(svc => {
                const h = HEALTH[svc.id];
                if (!h) return null;
                const statusColor = h.status === 'healthy' ? '#3fb950' : h.status === 'degraded' ? '#d29922' : '#f85149';
                return (
                  <div key={svc.id} style={{ background: 'var(--surface-1)', border: `1px solid var(--line)`, borderRadius: 10, overflow: 'hidden', borderTop: `3px solid ${statusColor}` }}>
                    <div style={{ padding: '14px 16px', borderBottom: h.lambda ? '1px solid var(--line)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{svc.label}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: statusColor, background: `${statusColor}20`, border: `1px solid ${statusColor}40`, borderRadius: 4, padding: '1px 7px' }}>{h.status}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)' }}>last seen {h.lastSeen}</span>
                      </div>
                      {h.issue && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: '#f85149', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 4, padding: '5px 9px' }}>{h.issue}</div>}
                    </div>
                    {h.lambda && (
                      <div style={{ padding: '12px 16px', borderBottom: h.ddb ? '1px solid var(--line)' : undefined }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 10 }}>Lambda</div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          <Metric label="Invocations" value={h.lambda.invocations.toLocaleString()} />
                          <Metric label="Errors" value={h.lambda.errors} alert={h.lambda.errors > 0} />
                          <Metric label="p50" value={h.lambda.p50} />
                          <Metric label="p99" value={h.lambda.p99} alert={h.lambda.p99.includes('s') && parseFloat(h.lambda.p99) > 5} />
                          <Metric label="Throttles" value={h.lambda.throttles} alert={h.lambda.throttles > 0} />
                        </div>
                      </div>
                    )}
                    {h.ddb && (
                      <div style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 10 }}>DynamoDB</div>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          <Metric label="Reads" value={h.ddb.reads.toLocaleString()} />
                          <Metric label="Writes" value={h.ddb.writes.toLocaleString()} />
                          <Metric label="Throttles" value={h.ddb.throttles} alert={h.ddb.throttles > 0} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Cost Breakdown ── */}
        {tab === 'costs' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', margin: '0 0 6px' }}>ambientcloud · AWS Cost Explorer · MTD</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.02em' }}>Cost Breakdown</h1>
            </div>
            {(() => {
              const total = COSTS.reduce((s, c) => s + c.monthly, 0);
              const totalBudget = COSTS.reduce((s, c) => s + c.budget, 0);
              return (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'MTD Spend',   value: `$${total.toLocaleString()}`,      color: 'var(--text)' },
                    { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, color: 'var(--text-2)' },
                    { label: '% Used',       value: `${Math.round(total / totalBudget * 100)}%`, color: total / totalBudget > 0.8 ? '#f85149' : total / totalBudget > 0.6 ? '#d29922' : '#3fb950' },
                    { label: 'Services',     value: COSTS.length, color: 'var(--text)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color }}>{value}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Service', 'MTD', 'Budget', 'Usage', 'Trend (5 mo)', 'Top Driver'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COSTS.sort((a, b) => b.monthly - a.monthly).map(c => {
                    const pct = c.monthly / c.budget;
                    const pctColor = pct > 0.85 ? '#f85149' : pct > 0.65 ? '#d29922' : '#3fb950';
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>{c.label}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>${c.monthly.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>${c.budget.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', minWidth: 130 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(pct * 100, 100)}%`, height: '100%', background: pctColor, borderRadius: 3, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: pctColor, minWidth: 32 }}>{Math.round(pct * 100)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}><Sparkline data={c.trend} color={pctColor} /></td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{c.driver}</td>
                      </tr>
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
                  CDK stacks
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
                  {CDK_FILES.map(f => (
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
                  {(editorFile === 'dev.context.json' || editorFile === 'prod.context.json') && (
                    <button
                      onClick={() => setDiffMode(d => !d)}
                      style={{
                        marginLeft: 8, alignSelf: 'center', padding: '3px 10px', borderRadius: 4,
                        background: diffMode ? 'rgba(56,139,253,0.15)' : 'transparent',
                        border: `1px solid ${diffMode ? '#388bfd' : '#30363d'}`,
                        color: diffMode ? '#79c0ff' : '#6e7681', cursor: 'pointer',
                        fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10,
                      }}
                    >
                      Diff dev/prod
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', padding: '8px 14px', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 10, color: '#6e7681', alignSelf: 'center' }}>
                    infra/stacks/{editorSvc}_stack.py
                  </div>
                </div>

                {/* Textarea or Diff view */}
                {diffMode && (editorFile === 'dev.context.json' || editorFile === 'prod.context.json') ? (
                  <div style={{ flex: 1, overflowY: 'auto', background: '#0d1117' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 11.5 }}>
                      <thead>
                        <tr style={{ background: '#161b22', borderBottom: '1px solid #30363d', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '8px 16px', textAlign: 'left', color: '#6e7681', fontWeight: 500, width: '30%' }}>key</th>
                          <th style={{ padding: '8px 16px', textAlign: 'left', color: '#3fb950', fontWeight: 500, width: '35%' }}>dev</th>
                          <th style={{ padding: '8px 16px', textAlign: 'left', color: '#d29922', fontWeight: 500, width: '35%' }}>prod</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffTfvars(
                          editorContent[editorSvc]?.['dev.context.json'] ?? '',
                          editorContent[editorSvc]?.['prod.context.json'] ?? '',
                        ).map(row => (
                          <tr key={row.key} style={{ borderBottom: '1px solid #21262d', background: row.changed ? 'rgba(210,153,34,0.06)' : 'transparent' }}>
                            <td style={{ padding: '7px 16px', color: '#e6edf3' }}>{row.key}</td>
                            <td style={{ padding: '7px 16px', color: row.changed ? '#3fb950' : '#8b949e' }}>{row.dev ?? <span style={{ color: '#6e7681', fontStyle: 'italic' }}>—</span>}</td>
                            <td style={{ padding: '7px 16px', color: row.changed ? '#d29922' : '#8b949e' }}>{row.prod ?? <span style={{ color: '#6e7681', fontStyle: 'italic' }}>—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
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
                )}

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
                    Python
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
                  <ActionButton label="Push to Git"     icon="↑"  status={gitStatus}   onClick={handleGit}   />
                  <ActionButton label="CDK Deploy"       icon="▶"  status={applyStatus} onClick={handleApply} />
                  {(testStatus === 'ok' || gitStatus === 'ok' || applyStatus === 'ok') && (
                    <button
                      onClick={() => { setTestStatus('idle'); setGitStatus('idle'); setApplyStatus('idle'); setActionLog([]); }}
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

      </main>

      {editingSvc && (
        <ServiceEditor service={editingSvc} onClose={() => setEditingSvc(null)} />
      )}

    </div>
  );
}
