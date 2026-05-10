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
  { id: 'api',        tag: 'REST API',     label: 'Nurse/Admin API', path: 'services/api/',         tests: 19,   desc: 'FastAPI + Cognito JWT with row-level facility scoping. Twelve endpoints serving staff web and mobile clients.', tf: true,  lambdaFn: 'ambient-dev-api' },
  { id: 'telemetry',  tag: 'Streaming',    label: 'Telemetry',       path: 'services/telemetry/',   tests: 15,   desc: 'Fall-alert Lambda → SNS for sub-2s staff notification; per-minute aggregates → Firehose → Parquet on S3.', tf: true,  lambdaFn: 'ambient-dev-alerts-enricher' },
  { id: 'admin-cli',  tag: 'CLI',          label: 'Admin CLI',       path: 'services/admin-cli/',   tests: 28,   desc: 'Operator CLI for device provisioning — mints tenant X.509 certs and registers rooms in DynamoDB.', tf: false, lambdaFn: null },
  { id: 'url-minter', tag: 'Upload',       label: 'URL Minter',      path: 'services/url-minter/',  tests: null, desc: 'Presigned S3 upload URLs for device Parquet batches — eliminates MQTT overhead for analytic cold-path data.', tf: true,  lambdaFn: 'ambient-dev-url-minter' },
  { id: 'athena',     tag: 'Analytics',    label: 'Athena',          path: 'services/athena/',      tests: null, desc: 'Glue table and partition projection for raw radar frames on the cold path — queryable without ETL.', tf: true,  lambdaFn: null },
  { id: 'cloudtrail',    tag: 'Audit',      label: 'CloudTrail',      path: 'services/cloudtrail/',    tests: null, desc: 'Data-event audit logging on all sensitive DynamoDB tables — every read/write attributed for HIPAA compliance.', tf: true,  lambdaFn: null },
  { id: 'iot-core',     tag: 'IoT',        label: 'IoT Core',        path: 'services/iot-core/',      tests: null, desc: 'Role alias (temp AWS creds for devices via mTLS), Device Shadow, and IoT Rules for fall-enricher and legacy Firehose paths.', tf: true,  lambdaFn: null },
  { id: 'kms',          tag: 'Security',   label: 'KMS',             path: 'services/kms/',           tests: null, desc: 'Tenant CMK with 30-day deletion window, automatic annual rotation, and scoped key policy for DynamoDB, S3, SNS, and SQS.', tf: true,  lambdaFn: null },
  { id: 'observability',tag: 'Monitoring', label: 'Observability',   path: 'services/observability/', tests: null, desc: 'CloudWatch Metric Streams to central account — scalar metrics only (Lambda, DynamoDB, Ambient/* namespace). No PHI crosses the boundary.', tf: true,  lambdaFn: null },
  { id: 'reconciler',  tag: 'Ops',        label: 'Reconciler',      path: 'services/reconciler/',   tests: 2,    desc: 'EventBridge 15-min cron compares device-path vs Firehose Athena row counts per facility — emits TelemetryDivergence metric, alarms at >0.1%.', tf: true, lambdaFn: 'ambient-dev-reconciler' },
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

const CDK_STATE: Record<string, { cfnResources: number; lastDeploy: string }> = {
  ella:          { cfnResources: 14, lastDeploy: '2h ago' },
  api:           { cfnResources: 22, lastDeploy: '2h ago' },
  telemetry:     { cfnResources: 18, lastDeploy: '3h ago' },
  'url-minter':  { cfnResources: 8,  lastDeploy: '5h ago' },
  athena:        { cfnResources: 12, lastDeploy: '5h ago' },
  cloudtrail:    { cfnResources: 6,  lastDeploy: '5h ago' },
  'iot-core':    { cfnResources: 9,  lastDeploy: '4h ago' },
  kms:           { cfnResources: 4,  lastDeploy: '6h ago' },
  observability: { cfnResources: 7,  lastDeploy: '1d ago' },
  reconciler:    { cfnResources: 5,  lastDeploy: '2h ago' },
};

const PIPELINE: Record<string, {
  synth:  { status: RunStatus; age: string; duration: string; sha: string };
  deploy: { status: RunStatus; age: string; duration: string; sha: string };
  env: 'dev' | 'prod';
}> = {
  ella:          { synth: { status: 'success', age: '2h ago', duration: '0m 29s', sha: '3a7f2c1' }, deploy: { status: 'success', age: '2h ago', duration: '2m 04s', sha: '3a7f2c1' }, env: 'prod' },
  api:           { synth: { status: 'success', age: '2h ago', duration: '0m 24s', sha: '3a7f2c1' }, deploy: { status: 'success', age: '2h ago', duration: '1m 47s', sha: '3a7f2c1' }, env: 'prod' },
  telemetry:     { synth: { status: 'success', age: '3h ago', duration: '0m 31s', sha: 'c91e340' }, deploy: { status: 'success', age: '3h ago', duration: '2m 11s', sha: 'c91e340' }, env: 'prod' },
  'url-minter':  { synth: { status: 'success', age: '5h ago', duration: '0m 18s', sha: 'b7d1055' }, deploy: { status: 'success', age: '5h ago', duration: '0m 55s', sha: 'b7d1055' }, env: 'prod' },
  athena:        { synth: { status: 'success', age: '5h ago', duration: '0m 22s', sha: 'b7d1055' }, deploy: { status: 'success', age: '5h ago', duration: '1m 44s', sha: 'b7d1055' }, env: 'prod' },
  cloudtrail:    { synth: { status: 'success', age: '5h ago', duration: '0m 19s', sha: 'b7d1055' }, deploy: { status: 'success', age: '5h ago', duration: '1m 01s', sha: 'b7d1055' }, env: 'prod' },
  'iot-core':    { synth: { status: 'failure', age: '4h ago', duration: '0m 27s', sha: 'a4c891f' }, deploy: { status: 'skipped', age: '4h ago', duration: '—',      sha: 'a4c891f' }, env: 'dev' },
  kms:           { synth: { status: 'success', age: '6h ago', duration: '0m 14s', sha: '9f02abc' }, deploy: { status: 'success', age: '6h ago', duration: '0m 47s', sha: '9f02abc' }, env: 'prod' },
  observability: { synth: { status: 'running', age: 'now',    duration: '—',      sha: 'f91c234' }, deploy: { status: 'queued',  age: '—',       duration: '—',      sha: 'f91c234' }, env: 'dev' },
  reconciler:    { synth: { status: 'success', age: '2h ago', duration: '0m 17s', sha: '3a7f2c1' }, deploy: { status: 'success', age: '2h ago', duration: '0m 44s', sha: '3a7f2c1' }, env: 'prod' },
};

const HEALTH: Record<string, {
  status: HealthStatus;
  issue?: string;
  lambda?: { invocations: number; errors: number; p50: string; p99: string; throttles: number };
  ddb?: { reads: number; writes: number; throttles: number };
  lastSeen: string;
}> = {
  ella:          { status: 'healthy',  lambda: { invocations: 48,   errors: 0,  p50: '4.2s',  p99: '12.1s', throttles: 0 }, ddb: { reads: 144,   writes: 48,   throttles: 0 }, lastSeen: '2m ago' },
  api:           { status: 'healthy',  lambda: { invocations: 1247, errors: 3,  p50: '89ms',  p99: '420ms', throttles: 0 }, ddb: { reads: 3741,  writes: 89,   throttles: 0 }, lastSeen: '<1m ago' },
  telemetry:     { status: 'healthy',  lambda: { invocations: 8821, errors: 12, p50: '18ms',  p99: '94ms',  throttles: 0 }, ddb: { reads: 26463, writes: 8833, throttles: 0 }, lastSeen: '<1m ago' },
  'url-minter':  { status: 'healthy',  lambda: { invocations: 312,  errors: 0,  p50: '44ms',  p99: '210ms', throttles: 0 }, ddb: { reads: 936,   writes: 312,  throttles: 0 }, lastSeen: '1m ago' },
  athena:        { status: 'healthy',  lastSeen: '8m ago' },
  cloudtrail:    { status: 'healthy',  lastSeen: 'always-on' },
  'iot-core':    { status: 'degraded', issue: 'IoT rule missing — fall-enricher not routing (apply failed)', lastSeen: 'n/a' },
  kms:           { status: 'healthy',  lastSeen: 'passive' },
  observability: { status: 'degraded', issue: 'Metric stream pending deploy', lastSeen: 'pending' },
  reconciler:    { status: 'healthy',  lambda: { invocations: 96, errors: 0, p50: '3.1s', p99: '8.4s', throttles: 0 }, lastSeen: '2m ago' },
};

const COSTS = [
  { id: 'ella',          label: 'Ella',          monthly: 1284, budget: 1500, trend: [920,  1050, 1140, 1210, 1284], driver: 'Bedrock Claude Sonnet' },
  { id: 'api',           label: 'Nurse/Admin API',monthly: 342,  budget: 600,  trend: [240,  280,  310,  325,  342],  driver: 'Lambda + DDB' },
  { id: 'telemetry',     label: 'Telemetry',     monthly: 891,  budget: 1000, trend: [720,  790,  830,  860,  891],  driver: 'Firehose + S3' },
  { id: 'url-minter',    label: 'URL Minter',    monthly: 78,   budget: 200,  trend: [60,   65,   68,   72,   78],   driver: 'S3 + Lambda' },
  { id: 'athena',        label: 'Athena',        monthly: 224,  budget: 400,  trend: [180,  195,  205,  218,  224],  driver: 'Athena scans' },
  { id: 'cloudtrail',    label: 'CloudTrail',    monthly: 43,   budget: 100,  trend: [38,   40,   41,   42,   43],   driver: 'S3 storage' },
  { id: 'iot-core',      label: 'IoT Core',      monthly: 156,  budget: 300,  trend: [120,  130,  140,  148,  156],  driver: 'IoT messaging' },
  { id: 'kms',           label: 'KMS',           monthly: 12,   budget: 50,   trend: [8,    9,    10,   11,   12],   driver: 'API calls' },
  { id: 'observability', label: 'Observability', monthly: 67,   budget: 150,  trend: [50,   55,   59,   63,   67],   driver: 'Firehose egress' },
  { id: 'reconciler',    label: 'Reconciler',    monthly: 8,    budget: 50,   trend: [0,    0,    0,    4,    8],    driver: 'Athena queries' },
];

const DEP_NODES: Array<{ id: string; label: string; wave: number; deps: string[]; outputs: string[] }> = [
  { id: 'kms',           label: 'KMS',          wave: 0, deps: [],                                             outputs: ['kms_key_arn', 'kms_key_alias'] },
  { id: 'url-minter',    label: 'URL Minter',   wave: 0, deps: [],                                             outputs: ['device_table_name', 'parquet_bucket'] },
  { id: 'athena',        label: 'Athena',       wave: 0, deps: [],                                             outputs: ['glue_database', 'athena_workgroup', 'athena_results_bucket'] },
  { id: 'observability', label: 'Observability',wave: 0, deps: [],                                             outputs: ['metric_stream_arn', 'firehose_stream_arn'] },
  { id: 'telemetry',     label: 'Telemetry',    wave: 1, deps: ['url-minter'],                                 outputs: ['alerts_table', 'fall_alerts_topic'] },
  { id: 'iot-core',      label: 'IoT Core',     wave: 2, deps: ['telemetry'],                                  outputs: ['role_alias_name', 'role_alias_arn'] },
  { id: 'ella',          label: 'Ella',         wave: 2, deps: ['url-minter', 'athena', 'telemetry'],          outputs: ['lambda_name', 'updates_table'] },
  { id: 'api',           label: 'API',          wave: 3, deps: ['url-minter', 'athena', 'telemetry', 'ella'],  outputs: ['api_endpoint', 'cognito_pool_id'] },
  { id: 'cloudtrail',    label: 'CloudTrail',   wave: 3, deps: ['telemetry', 'ella'],                          outputs: ['trail_arn', 'trail_s3'] },
  { id: 'reconciler',   label: 'Reconciler',   wave: 2, deps: ['athena', 'telemetry'],                         outputs: ['divergence_pct', 'facilities_checked'] },
];

// ── CDK stack content per service ────────────────────────────────────────────

const CDK_CONTENT: Record<string, Record<CdkFile, string>> = {

  ella: {
    'stack.py':
`from aws_cdk import Stack, Duration, RemovalPolicy
from constructs import Construct
from ambient_constructs.ambient_lambda import AmbientLambda
from aws_cdk import aws_events as events, aws_events_targets as targets
from aws_cdk import aws_sqs as sqs, aws_lambda_event_sources as sources
from aws_cdk import aws_iam as iam

ELLA_CRONS = ["cron(0 11 * * ? *)", "cron(0 23 * * ? *)"]

class EllaStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 sqs_key, alerts_table, updates_table,
                 env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        dlq = sqs.Queue(self, "EllaDlq",
            queue_name=f"ambient-{env}-ella-dlq",
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=sqs_key)
        queue = sqs.Queue(self, "EllaQueue",
            queue_name=f"ambient-{env}-ella",
            dead_letter_queue=sqs.DeadLetterQueue(
                queue=dlq, max_receive_count=3),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=sqs_key)

        fn = AmbientLambda(self, "EllaFn",
            function_name=f"ambient-{env}-ella",
            handler="handler.lambda_handler",
            source_path="../services/ella/src",
            timeout=Duration.seconds(900),
            memory_size=1024,
            environment={
                "BEDROCK_MODEL_ID":
                    "anthropic.claude-sonnet-4-5-20250929-v1:0",
                "UPDATES_TABLE": updates_table.table_name,
                "ALERTS_TABLE":  alerts_table.table_name,
            })

        fn.function.add_event_source(
            sources.SqsEventSource(queue, batch_size=1))
        fn.function.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            resources=[f"arn:aws:bedrock:{self.region}::foundation-model/"
                       "anthropic.claude-sonnet-4-5-20250929-v1:0"]))
        updates_table.grant_write_data(fn.function)
        alerts_table.grant_read_data(fn.function)

        facility_ids = self.node.try_get_context("facility_ids").split(",")
        for fac in facility_ids:
            for i, expr in enumerate(ELLA_CRONS):
                events.Rule(self, f"EllaCron{fac}{i}",
                    schedule=events.Schedule.expression(expr),
                    targets=[targets.SqsQueue(queue,
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
`from aws_cdk import Stack, Duration, RemovalPolicy
from constructs import Construct
from ambient_constructs.ambient_lambda import AmbientLambda
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_apigatewayv2_authorizers as authorizers

class ApiStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 data_key, alerts_table, updates_table,
                 devices_table, env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        pool = cognito.UserPool(self, "Pool",
            user_pool_name=f"ambient-{env}-users",
            sign_in_aliases=cognito.SignInAliases(email=True),
            mfa=cognito.Mfa.REQUIRED,
            mfa_second_factor=cognito.MfaSecondFactor(otp=True, sms=False),
            password_policy=cognito.PasswordPolicy(
                min_length=12, require_uppercase=True,
                require_symbols=True, require_digits=True),
            self_sign_up_enabled=False,
            account_recovery=cognito.AccountRecovery.NONE,
            removal_policy=RemovalPolicy.RETAIN)

        pool.add_custom_attribute("role",
            cognito.StringAttribute(mutable=True))
        pool.add_custom_attribute("facilityIds",
            cognito.StringAttribute(mutable=True))

        client = pool.add_client("WebClient",
            auth_flows=cognito.AuthFlow(user_srp=True),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(implicit_code_grant=True)))

        fn = AmbientLambda(self, "ApiFn",
            function_name=f"ambient-{env}-api",
            handler="main.handler",
            source_path="../services/api/src",
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "COGNITO_USER_POOL_ID": pool.user_pool_id,
                "ALERTS_TABLE":         alerts_table.table_name,
                "UPDATES_TABLE":        updates_table.table_name,
                "DEVICES_TABLE":        devices_table.table_name,
            })

        for t in [alerts_table, updates_table, devices_table]:
            t.grant_read_write_data(fn.function)

        http_api = apigw.HttpApi(self, "HttpApi",
            api_name=f"ambient-{env}-api",
            cors_preflight=apigw.CorsPreflightOptions(
                allow_origins=["https://ellamemory.com"],
                allow_methods=[apigw.CorsHttpMethod.ANY],
                allow_headers=["Authorization", "Content-Type"]))

        jwt_auth = authorizers.HttpJwtAuthorizer(
            "CognitoAuth",
            f"https://cognito-idp.{self.region}.amazonaws.com/{pool.user_pool_id}",
            jwt_audience=[client.user_pool_client_id])

        integration = integrations.HttpLambdaIntegration(
            "ApiIntegration", fn.function)
        http_api.add_routes(path="/{proxy+}", methods=[apigw.HttpMethod.ANY],
            integration=integration, authorizer=jwt_auth)
        http_api.add_routes(path="/health", methods=[apigw.HttpMethod.GET],
            integration=integration)`,
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
`from aws_cdk import Stack, Duration, RemovalPolicy
from constructs import Construct
from ambient_constructs.ambient_lambda import AmbientLambda
from aws_cdk import aws_sns as sns, aws_iam as iam
from aws_cdk import aws_glue as glue
from aws_cdk import aws_iot as iot, aws_cloudwatch as cw
from aws_cdk import aws_kinesisfirehose as firehose

class TelemetryStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 data_key, s3_key, sns_key, parquet_bucket,
                 alerts_table, devices_table, env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        topic = sns.Topic(self, "FallAlerts",
            topic_name=f"ambient-{env}-fall-alerts",
            master_key=sns_key)

        fn = AmbientLambda(self, "AlertsFn",
            function_name=f"ambient-{env}-alerts-enricher",
            handler="handler.lambda_handler",
            source_path="../services/telemetry/src",
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "ALERTS_TABLE":     alerts_table.table_name,
                "FALL_ALERTS_TOPIC": topic.topic_arn,
            })
        alerts_table.grant_read_write_data(fn.function)
        topic.grant_publish(fn.function)

        iot_error_role = iam.Role(self, "IotErrorRole",
            assumed_by=iam.ServicePrincipal("iot.amazonaws.com"))
        parquet_bucket.grant_put(iot_error_role)

        iot.CfnTopicRule(self, "FallEnricherRule",
            rule_name=f"ambient_{env}_fall_enricher",
            topic_rule_payload=iot.CfnTopicRule.TopicRulePayloadProperty(
                sql="SELECT * FROM '$aws/rules/fall_enricher'",
                actions=[iot.CfnTopicRule.ActionProperty(
                    lambda_=iot.CfnTopicRule.LambdaActionProperty(
                        function_arn=fn.function.function_arn))]))

        db = glue.CfnDatabase(self, "TelemetryDb",
            catalog_id=self.account,
            database_input=glue.CfnDatabase.DatabaseInputProperty(
                name=f"ambient_{env}_telemetry"))

        glue.CfnTable(self, "AggTable",
            catalog_id=self.account,
            database_name=db.ref,
            table_input=glue.CfnTable.TableInputProperty(
                name="telemetry_aggregates",
                partition_keys=[
                    {"Name": "facility", "Type": "string"},
                    {"Name": "window_hour", "Type": "string"}],
                storage_descriptor=glue.CfnTable.StorageDescriptorProperty(
                    location=f"s3://{parquet_bucket.bucket_name}/telemetry/",
                    input_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                    output_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                    serde_info=glue.CfnTable.SerdeInfoProperty(
                        serialization_library="org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"))))

        cw.Alarm(self, "DivergenceAlarm",
            metric=cw.Metric(
                namespace="AmbientIntelligence/Telemetry",
                metric_name="TelemetryDivergence",
                statistic="Average", period=Duration.minutes(15)),
            threshold=0.001, evaluation_periods=3,
            alarm_description="Telemetry path divergence > 0.1%")`,
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
`from aws_cdk import Stack, Duration
from constructs import Construct
from ambient_constructs.ambient_lambda import AmbientLambda
from aws_cdk import aws_iam as iam, aws_iot as iot
from aws_cdk import aws_lambda as lambda_

class UrlMinterStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 data_key, devices_table, parquet_bucket,
                 env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        fn = AmbientLambda(self, "UrlMinterFn",
            function_name=f"ambient-{env}-url-minter",
            handler="handler.lambda_handler",
            source_path="../services/url-minter/src",
            timeout=Duration.seconds(10),
            memory_size=256,
            environment={
                "DEVICES_TABLE":  devices_table.table_name,
                "PARQUET_BUCKET": parquet_bucket.bucket_name,
            })

        fn.function.add_function_url(
            auth_type=lambda_.FunctionUrlAuthType.AWS_IAM,
            cors=lambda_.FunctionUrlCorsOptions(
                allowed_origins=["*"],
                allowed_methods=[lambda_.HttpMethod.POST]))

        devices_table.grant_read_data(fn.function)
        parquet_bucket.grant_put(fn.function)

        device_upload_role = iam.Role(self, "DeviceUploadRole",
            role_name=f"ambient-{env}-device-upload",
            assumed_by=iam.ServicePrincipal("credentials.iot.amazonaws.com"))

        role_alias = iot.CfnRoleAlias(self, "DeviceRoleAlias",
            role_alias=f"ambient-{env}-device-alias",
            role_arn=device_upload_role.role_arn,
            credential_duration_seconds=3600)

        iot.CfnPolicy(self, "DeviceIotPolicy",
            policy_name=f"ambient-{env}-device-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {"Effect": "Allow",
                     "Action": "iot:AssumeRoleWithCertificate",
                     "Resource": role_alias.attr_role_alias_arn},
                    {"Effect": "Allow",
                     "Action": "iot:Connect",
                     "Resource": f"arn:aws:iot:{self.region}:{self.account}:"
                                 "client/\${iot:ClientId}"},
                    {"Effect": "Allow",
                     "Action": "iot:Publish",
                     "Resource": f"arn:aws:iot:{self.region}:{self.account}:"
                                 "topic/$aws/rules/*"},
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
`from aws_cdk import Stack, RemovalPolicy
from constructs import Construct
from aws_cdk import aws_glue as glue, aws_athena as athena, aws_s3 as s3

class AthenaStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 s3_key, parquet_bucket, env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        athena_results = s3.Bucket(self, "AthenaResults",
            bucket_name=f"ambient-{env}-athena-results",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_key,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True)

        db = glue.CfnDatabase(self, "FramesDb",
            catalog_id=self.account,
            database_input=glue.CfnDatabase.DatabaseInputProperty(
                name=f"ambient_{env}_raw"))

        glue.CfnTable(self, "FramesTable",
            catalog_id=self.account,
            database_name=db.ref,
            table_input=glue.CfnTable.TableInputProperty(
                name="frames",
                partition_keys=[
                    {"Name": "date",     "Type": "string"},
                    {"Name": "facility", "Type": "string"},
                    {"Name": "subject",  "Type": "string"}],
                storage_descriptor=glue.CfnTable.StorageDescriptorProperty(
                    location=f"s3://{parquet_bucket.bucket_name}/raw-device/",
                    input_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                    output_format="org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                    serde_info=glue.CfnTable.SerdeInfoProperty(
                        serialization_library="org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"),
                    columns=[
                        {"Name": "frame_number",    "Type": "bigint"},
                        {"Name": "captured_at",     "Type": "timestamp"},
                        {"Name": "height_data",     "Type": "float"},
                        {"Name": "points_detected", "Type": "int"},
                        {"Name": "radar_temp_c",    "Type": "float"}]),
                parameters={
                    "projection.enabled":         "true",
                    "projection.date.type":        "date",
                    "projection.date.format":      "yyyy-MM-dd",
                    "projection.date.range":       "2025-01-01,NOW",
                    "projection.facility.type":    "injected",
                    "projection.subject.type":     "injected",
                    "storage.location.template":
                        f"s3://{parquet_bucket.bucket_name}/raw-device/"
                        "date=\${date}/facility=\${facility}/subject=\${subject}/"}))

        athena.CfnWorkGroup(self, "Workgroup",
            name=f"ambient-{env}-analytics",
            work_group_configuration=athena.CfnWorkGroup.WorkGroupConfigurationProperty(
                result_configuration=athena.CfnWorkGroup.ResultConfigurationProperty(
                    output_location=f"s3://{athena_results.bucket_name}/queries/",
                    encryption_configuration=athena.CfnWorkGroup.EncryptionConfigurationProperty(
                        encryption_option="SSE_KMS",
                        kms_key=s3_key.key_arn)),
                bytes_scanned_cutoff_per_query=10_737_418_240,
                enforce_work_group_configuration=True))`,
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
`from aws_cdk import Stack, RemovalPolicy
from constructs import Construct
from aws_cdk import aws_cloudtrail as cloudtrail
from aws_cdk import aws_iam as iam

class CloudTrailStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 s3_key, cloudtrail_bucket,
                 alerts_table, updates_table, parquet_bucket,
                 env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        trail_name = f"ambient-{env}-audit"

        for stmt in [
            iam.PolicyStatement(
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[cloudtrail_bucket.bucket_arn]),
            iam.PolicyStatement(
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{cloudtrail_bucket.bucket_arn}/AWSLogs/{self.account}/*"],
                conditions={"StringEquals": {
                    "s3:x-amz-acl": "bucket-owner-full-control",
                    "aws:SourceArn": f"arn:aws:cloudtrail:{self.region}:{self.account}:trail/{trail_name}"}}),
        ]:
            cloudtrail_bucket.add_to_resource_policy(stmt)

        trail = cloudtrail.Trail(self, "AuditTrail",
            trail_name=trail_name,
            bucket=cloudtrail_bucket,
            encryption_key=s3_key,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            send_to_cloud_watch_logs=False)

        for table in [alerts_table, updates_table]:
            trail.add_dynamo_db_event_selector(
                [table],
                include_management_events=False,
                data_value=cloudtrail.DataResourceType.DYNAMODB_TABLE)

        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(
                bucket=parquet_bucket, object_prefix="raw/")],
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
`from aws_cdk import Stack
from constructs import Construct
from aws_cdk import aws_iot as iot, aws_iam as iam

class IotCoreStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 alerts_fn, env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        credentials_role = iam.Role(self, "CredentialsRole",
            role_name=f"ambient-{env}-iot-credentials",
            assumed_by=iam.ServicePrincipal("credentials.iot.amazonaws.com"))

        role_alias = iot.CfnRoleAlias(self, "DeviceRoleAlias",
            role_alias=f"ambient-{env}-device-alias",
            role_arn=credentials_role.role_arn,
            credential_duration_seconds=3600)

        iot.CfnPolicy(self, "DevicePolicy",
            policy_name=f"ambient-{env}-device-policy",
            policy_document={
                "Version": "2012-10-17",
                "Statement": [
                    {"Effect": "Allow",
                     "Action": "iot:AssumeRoleWithCertificate",
                     "Resource": role_alias.attr_role_alias_arn},
                    {"Effect": "Allow",
                     "Action": "iot:Connect",
                     "Resource": f"arn:aws:iot:{self.region}:{self.account}:"
                                 "client/\${iot:ClientId}"},
                    {"Effect": "Allow",
                     "Action": "iot:Publish",
                     "Resource": f"arn:aws:iot:{self.region}:{self.account}:"
                                 "topic/$aws/rules/*"},
                ]})

        alerts_fn.add_permission("IotInvoke",
            principal=iam.ServicePrincipal("iot.amazonaws.com"),
            source_arn=f"arn:aws:iot:{self.region}:{self.account}:rule/*")

        iot.CfnTopicRule(self, "FallEnricherRule",
            rule_name=f"ambient_{env}_fall_enricher",
            topic_rule_payload=iot.CfnTopicRule.TopicRulePayloadProperty(
                sql="SELECT *, topic() as mqtt_topic FROM '$aws/rules/fall_enricher'",
                actions=[iot.CfnTopicRule.ActionProperty(
                    lambda_=iot.CfnTopicRule.LambdaActionProperty(
                        function_arn=alerts_fn.function_arn))],
                rule_disabled=False))`,
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
`from aws_cdk import Stack, RemovalPolicy, Duration
from constructs import Construct
from aws_cdk import aws_kms as kms

class KmsStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 env: str, tenant_id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        common_props = dict(
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            pending_window=Duration.days(30))

        self.data_key = kms.Key(self, "DataKey",
            description=f"Ambient {env} DynamoDB CMK — tenant {tenant_id}",
            alias=f"alias/ambient/{tenant_id}/data",
            **common_props)

        self.s3_key = kms.Key(self, "S3Key",
            description=f"Ambient {env} S3 CMK — tenant {tenant_id}",
            alias=f"alias/ambient/{tenant_id}/s3",
            **common_props)

        self.sns_key = kms.Key(self, "SnsKey",
            description=f"Ambient {env} SNS CMK — tenant {tenant_id}",
            alias=f"alias/ambient/{tenant_id}/sns",
            **common_props)

        self.sqs_key = kms.Key(self, "SqsKey",
            description=f"Ambient {env} SQS CMK — tenant {tenant_id}",
            alias=f"alias/ambient/{tenant_id}/sqs",
            **common_props)`,
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
`from aws_cdk import Stack, CfnOutput
from constructs import Construct
from aws_cdk import aws_cloudwatch as cw, aws_iam as iam
from aws_cdk import aws_kinesisfirehose as firehose

METRIC_NAMESPACES = [
    "AWS/Lambda", "AWS/DynamoDB", "AWS/IoT",
    "AmbientIntelligence/Telemetry", "AmbientIntelligence/API",
]

class ObservabilityStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 env: str, observability_account: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        stream_role = iam.Role(self, "MetricStreamRole",
            assumed_by=iam.ServicePrincipal(
                "streams.metrics.cloudwatch.amazonaws.com"))

        stream_name   = f"ambient-{env}-metrics"
        stream_arn    = (f"arn:aws:firehose:{self.region}:{self.account}:"
                         f"deliverystream/{stream_name}")

        stream_role.add_to_policy(iam.PolicyStatement(
            actions=["firehose:PutRecord", "firehose:PutRecordBatch"],
            resources=[stream_arn]))

        firehose.CfnDeliveryStream(self, "MetricsFirehose",
            delivery_stream_name=stream_name,
            delivery_stream_type="DirectPut",
            s3_destination_configuration={
                "bucketArn":  f"arn:aws:s3:::ambient-central-metrics-{observability_account}",
                "roleArn":    stream_role.role_arn,
                "prefix":     f"{env}/metrics/date=!{{timestamp:yyyy-MM-dd}}/",
                "bufferingHints": {"intervalInSeconds": 60, "sizeInMBs": 1},
                "compressionFormat": "GZIP",
            })

        metric_stream = cw.CfnMetricStream(self, "MetricStream",
            name=f"ambient-{env}-stream",
            role_arn=stream_role.role_arn,
            firehose_arn=stream_arn,
            output_format="json",
            include_filters=[
                cw.CfnMetricStream.MetricStreamFilterProperty(namespace=ns)
                for ns in METRIC_NAMESPACES])

        CfnOutput(self, "MetricStreamArn",
            value=metric_stream.attr_arn,
            export_name=f"ambient-{env}-metric-stream-arn")

        CfnOutput(self, "TrustPolicyNote",
            value=f"Grant {self.account} put access on central metrics bucket",
            description="Manual step: add bucket policy in observability account")`,
    'cdk.json':
`{
  "app": "python3 app.py",
  "context": {
    "environment": "dev",
    "tenant_id": "PILOT-TENANT-001",
    "enable_observability": "false",
    "observability_account": "CENTRAL_ACCOUNT_ID"
  }
}`,
    'dev.context.json':
`{
  "environment": "dev",
  "tenant_id": "PILOT-TENANT-001",
  "enable_observability": "false",
  "observability_account": "CENTRAL_ACCOUNT_ID",
  "account": "DEV_ACCOUNT_ID",
  "region": "us-east-1"
}`,
    'prod.context.json':
`{
  "environment": "prod",
  "tenant_id": "PILOT-TENANT-001",
  "enable_observability": "true",
  "observability_account": "CENTRAL_ACCOUNT_ID",
  "account": "PROD_ACCOUNT_ID",
  "region": "us-east-1"
}`,
  },

  reconciler: {
    'stack.py':
`from aws_cdk import Stack, Duration
from constructs import Construct
from ambient_constructs.ambient_lambda import AmbientLambda
from aws_cdk import aws_events as events, aws_events_targets as targets
from aws_cdk import aws_cloudwatch as cw, aws_iam as iam

class ReconcilerStack(Stack):
    def __init__(self, scope: Construct, id: str, *,
                 parquet_bucket, env: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        fn = AmbientLambda(self, "ReconcilerFn",
            function_name=f"ambient-{env}-reconciler",
            handler="handler.lambda_handler",
            source_path="../services/reconciler/src",
            timeout=Duration.seconds(300),
            memory_size=256,
            environment={
                "TELEMETRY_DATABASE": f"ambient_{env}_telemetry",
                "RAW_DATABASE":       f"ambient_{env}_raw",
                "ATHENA_WORKGROUP":   f"ambient-{env}-analytics",
                "ATHENA_OUTPUT":
                    f"s3://{parquet_bucket.bucket_name}/reconciler-results/",
                "METRIC_NAMESPACE":   "AmbientIntelligence/Telemetry",
            })

        for actions, resources in [
            (["athena:StartQueryExecution",
              "athena:GetQueryExecution",
              "athena:GetQueryResults"], ["*"]),
            (["glue:GetTable", "glue:GetPartitions"], ["*"]),
            (["cloudwatch:PutMetricData"], ["*"]),
        ]:
            fn.function.add_to_role_policy(
                iam.PolicyStatement(actions=actions, resources=resources))
        parquet_bucket.grant_read_write(fn.function)

        events.Rule(self, "ReconcilerCron",
            schedule=events.Schedule.rate(Duration.minutes(15)),
            targets=[targets.LambdaFunction(fn.function)])

        cw.Alarm(self, "DivergenceAlarm",
            metric=cw.Metric(
                namespace="AmbientIntelligence/Telemetry",
                metric_name="TelemetryDivergence",
                statistic="Average",
                period=Duration.minutes(15)),
            threshold=0.001,
            evaluation_periods=3,
            alarm_name=f"ambient-{env}-telemetry-divergence",
            alarm_description="Telemetry path divergence > 0.1%")`,
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
              const waves = [0, 1, 2, 3];
              return (
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '24px', marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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
