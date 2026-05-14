'use client';
import Link from 'next/link';
import { useState, Fragment } from 'react';
import dynamic from 'next/dynamic';

const ServiceEditor = dynamic(() => import('./ServiceEditor'), { ssr: false });

type Tab = 'services' | 'paths' | 'architecture' | 'accounts' | 'runbooks' | 'editor' | 'metrics' | 'tenants';
type TenantStatus = 'healthy' | 'degraded' | 'provisioning';
interface Tenant { id: string; name: string; accountId: string; region: string; rooms: number; services: number; lastDeploy: string; status: TenantStatus; }
interface RunbookDetail { severity: 'P1' | 'P2' | 'P3'; ttr: string; escalateTo: string; steps: string[]; }
type TfFile = 'main.tf' | 'backend.tf' | 'dev.tfvars' | 'prod.tfvars';
type ActionStatus = 'idle' | 'running' | 'ok' | 'error';

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

const METRIC_SERIES = {
  apiErrors:  { label: 'Lambda Errors',        unit: '/hr',  color: '#f85149', good: 'low'  as const, data: [2,1,3,0,0,1,0,2,1,0,0,1,3,2,0,1,0,0,2,1,0,0,1,2] },
  fallAlerts: { label: 'Fall Alerts',           unit: '/hr',  color: '#d29922', good: 'low'  as const, data: [3,2,4,1,2,3,2,1,2,3,4,2,1,2,3,2,1,2,3,2,1,2,3,2] },
  ellaSuc:    { label: 'Ella Success Rate',     unit: '%',    color: '#3fb950', good: 'high' as const, data: [100,100,98,100,100,100,100,98,100,100,100,100,98,100,100,100,100,98,100,100,100,100,98,100] },
  divergence: { label: 'Telemetry Divergence', unit: 'rows', color: '#8b949e', good: 'low'  as const, data: [0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0] },
  dlqDepth:   { label: 'Ella DLQ Depth',       unit: 'msgs', color: '#f85149', good: 'low'  as const, data: [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0] },
  urlsMinted: { label: 'URLs Minted',          unit: '/min', color: '#388bfd', good: 'high' as const, data: [42,45,48,41,39,44,47,50,43,46,44,42,48,51,47,43,45,48,44,46,43,47,50,44] },
};

const LAMBDA_METRICS: Record<string, { p99ms: number; errors: number; invocations: number }> = {
  ella:         { p99ms: 4210, errors: 0, invocations: 2 },
  api:          { p99ms: 312,  errors: 1, invocations: 847 },
  telemetry:    { p99ms: 89,   errors: 0, invocations: 1204 },
  'url-minter': { p99ms: 145,  errors: 0, invocations: 2640 },
};

const TENANTS_INITIAL: Tenant[] = [
  { id: 'riverview',  name: 'Riverview Senior Living', accountId: '234567890123', region: 'us-east-1', rooms: 48, services: 10, lastDeploy: '2026-04-28', status: 'healthy' },
  { id: 'sunridge',   name: 'Sunridge Memory Care',    accountId: '345678901234', region: 'us-west-2', rooms: 32, services: 10, lastDeploy: '2026-04-22', status: 'healthy' },
  { id: 'maplewood',  name: 'Maplewood Gardens',       accountId: '456789012345', region: 'us-east-1', rooms: 24, services:  8, lastDeploy: '2026-03-15', status: 'degraded' },
  { id: 'cedarbrook', name: 'Cedarbrook Living',       accountId: '567890123456', region: 'eu-west-1', rooms: 56, services: 10, lastDeploy: '2026-04-30', status: 'healthy' },
];

const RUNBOOK_DETAILS: Record<string, RunbookDetail> = {
  'API 5xx': { severity: 'P2', ttr: '15 min', escalateTo: 'Backend on-call', steps: ['Check API Gateway → CloudWatch Logs for stack traces', 'Confirm Lambda health — look for OOM or timeout', 'Check DynamoDB throttle metrics (ConsumedWriteCapacityUnits spikes)', 'Verify Cognito JWT authorizer not rejecting valid tokens', 'If DDB throttle: confirm PAY_PER_REQUEST is set on all tables', 'Roll back to previous Lambda deployment if error rate > 10%', 'Page backend on-call if not resolved in 15 min'] },
  'Auth login failure': { severity: 'P2', ttr: '10 min', escalateTo: 'Security on-call', steps: ['Check Cognito User Pool → Sign-in activity for error codes', 'Confirm ALLOW_USER_SRP_AUTH is enabled on the web client', 'Verify CORS origins match app.ellamemory.com in API Gateway config', 'Test with admin-created test user via console', 'If token-related: check JWT expiry and refresh token rotation settings', 'Escalate to security on-call if unauthorized access suspected'] },
  'Cost spike': { severity: 'P3', ttr: '30 min', escalateTo: 'Infra lead', steps: ['Open Cost Explorer → filter by service (DynamoDB, Lambda, Bedrock)', 'Check Athena bytes-scanned-per-query — confirm 10 GB cutoff enforced', 'Check Ella Lambda invocation count — EventBridge rule should be twice daily only', 'Confirm Firehose legacy path is not re-enabled accidentally', 'Review S3 Glacier transition rules — data tiers after 90 days', 'Tag untagged resources and alert infra lead'] },
  'Device offline': { severity: 'P2', ttr: '20 min', escalateTo: 'Field ops', steps: ['Check IoT Core → Device Shadow for last-reported state', 'Confirm device_id in DynamoDB devices table', 'Ping mTLS endpoint — verify cert has not expired (1-year bootstrap)', 'Check last Parquet upload timestamp in S3 cold path bucket', 'If cert expired: reprovision via Admin CLI with new X.509 cert', 'If connectivity issue: escalate to field ops for physical inspection'] },
  'Escalation': { severity: 'P1', ttr: '5 min', escalateTo: 'VP Engineering', steps: ['Acknowledge the incident immediately', 'Page VP Engineering and security lead', 'Preserve all CloudTrail logs — do not modify tables', 'Disable affected IAM roles if unauthorized access suspected', 'Begin incident timeline doc in shared doc', 'Notify covered entity compliance officer if PHI breach suspected'] },
  'Fall alert — false positive': { severity: 'P3', ttr: '10 min', escalateTo: 'Clinical team', steps: ['Confirm alert in DynamoDB alerts table (subject_id, event_ts)', 'Check radar_raw Parquet data for the frame window', 'Review Device Shadow zone/room assignment — misassignment can cause false alerts', 'Pull Ella narrative for context — does it corroborate the alert?', 'If systematic: adjust IoT Rule SQL filter threshold in telemetry module', 'Document in clinical log with subject_id and timestamp for IRB review'] },
  'Fall alert — missed': { severity: 'P1', ttr: '5 min', escalateTo: 'Clinical on-call + VP Engineering', steps: ['IMMEDIATE: confirm patient wellbeing via nursing staff', 'Check IoT Core message logs for MQTT topic ambient/{device_id}/fall', 'Check fall-enricher Lambda logs — did it receive the event?', 'Verify SNS topic subscription for the facility is active', 'Check DLQ for fall-enricher — did it fail silently?', 'Review TelemetryDivergence metric for device health', 'Escalate to clinical on-call and VP Engineering immediately'] },
  'IRB data request': { severity: 'P3', ttr: '2 days', escalateTo: 'IRB coordinator', steps: ['Verify requestor identity and IRB authorization letter', 'Pull coded subject_id from devices table — confirm no PII in data', 'Run Athena query scoped to specific date range and facility', 'Verify data is HIPAA §164.514(c) compliant — no names, DOBs, MRNs', 'Export results to CloudTrail-audited S3 path', 'Coordinate with IRB coordinator for data transfer protocol', 'Log access event with timestamp and requestor ID'] },
  'Narrative broken': { severity: 'P2', ttr: '20 min', escalateTo: 'AI platform on-call', steps: ['Check Ella Lambda CloudWatch logs for Bedrock API errors', 'Verify Bedrock model: us.anthropic.claude-sonnet-4-6', 'Check SQS fanout queue depth and DLQ depth', 'Confirm Athena workgroup healthy and query not timing out', 'Test manual invocation of ambient-dev-ella with sample payload', 'If Bedrock throttled: check service quotas and increase', 'Verify EventBridge cron rule is enabled (7am + 7pm UTC)'] },
  'Telemetry gap': { severity: 'P2', ttr: '15 min', escalateTo: 'Backend on-call', steps: ['Check TelemetryDivergence CloudWatch metric — expected: 0', 'Compare Athena row counts: new S3 path vs legacy Firehose path', 'Check url-minter Lambda — is it issuing presigned URLs? (UrlsIssued metric)', 'Verify device Parquet uploads arriving in S3 (raw-device/ prefix)', 'If new path failing: check SigV4 signing and Shadow scope check', 'If legacy path failing: check Firehose delivery stream status', 'Page backend on-call if divergence > 100 rows after 15 min'] },
};

const ELLA_NARRATIVES = [
  { subjectId: 'MOCAREV-2847', facility: 'Riverview · Room 112', date: '2026-05-04', amPm: 'PM', tokens: 312, text: 'No fall events recorded in the past 12 hours. Overnight movement patterns (10:45 PM – 6:12 AM) suggest consistent sleep with a brief bathroom visit at 3:17 AM — duration approximately 4 minutes, normal range. Daytime activity moderate: prolonged stationary periods at 9:20 AM and 1:45 PM consistent with seated rest. No anomalous radar signatures detected. Fall risk assessment: low.' },
  { subjectId: 'MOCAREV-3104', facility: 'Riverview · Room 208', date: '2026-05-04', amPm: 'PM', tokens: 287, text: 'One fall-zone proximity event at 7:33 AM — subject entered the bathroom and paused 18 seconds in a high-risk posture zone before resuming normal movement. No alert threshold crossed. Gait pattern throughout the day shows slight asymmetry consistent with prior clinical notes. Evening activity normal. Recommend clinical review of morning bathroom routine.' },
  { subjectId: 'MOCAREV-1922', facility: 'Sunridge · Room 44',   date: '2026-05-03', amPm: 'AM', tokens: 298, text: 'Elevated overnight movement: 6 distinct excursions detected between 11 PM and 5 AM (prior baseline: 1–2). No fall events, but increased nocturnal activity warrants nursing staff review. Daytime behavioral pattern nominal. Ella confidence in subject tracking: 97% (single occupancy confirmed via Device Shadow).' },
];

const PLAN_RESOURCES: Record<string, string[]> = {
  ella:          ['aws_lambda_function.ella'],
  api:           ['aws_lambda_function.api', 'aws_apigatewayv2_api.api'],
  telemetry:     ['aws_lambda_function.fall_enricher'],
  'url-minter':  ['aws_lambda_function.url_minter'],
  athena:        ['aws_athena_workgroup.main'],
  cloudtrail:    ['aws_cloudtrail.main'],
  'iot-core':    ['aws_iot_role_alias.device'],
  kms:           ['aws_kms_key.tenant_cmk'],
  observability: ['aws_cloudwatch_metric_stream.main'],
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
      BEDROCK_MODEL    = "us.anthropic.claude-sonnet-4-6"
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
          <Node label="Bedrock" sub="Claude Sonnet 4 · HIPAA eligible" type="narrative" />
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
            <Node label="Admin CLI" sub="MOCAREV-XXXX enforcement" type="audit" />
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

// ── Sparkline + MetricCard ────────────────────────────────────────────────────

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
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
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
        <div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>{cur}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-4)', marginLeft: 4 }}>{m.unit}</span>
        </div>
        <Sparkline data={m.data} color={m.color} uid={id} />
      </div>
    </div>
  );
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

  // Tenant registry
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

  const setEditorSvc = (id: string) => {
    setEditorSvcRaw(id);
    setEditorFile('main.tf');
    setTestStatus('idle');
    setPlanStatus('idle');
    setGitStatus('idle');
    setApplyStatus('idle');
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
      lines.push(`      # (remaining attributes unchanged)`);
      lines.push('');
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
    await sleep(600);
    setProvisionLog(p => [...p, `Verifying AWS account ${provisionAccountId}...`]);
    await sleep(800);
    setProvisionLog(p => [...p, `✓  Account verified`]);
    await sleep(500);
    setProvisionLog(p => [...p, `Issuing bootstrap X.509 certificate...`]);
    await sleep(700);
    setProvisionLog(p => [...p, `✓  Cert issued · serial MOCAREV-${provisionAccountId.slice(-4)}`]);
    await sleep(400);
    setProvisionLog(p => [...p, `Registering in control plane DynamoDB...`]);
    await sleep(600);
    setProvisionLog(p => [...p, `✓  Tenant registered`]);
    await sleep(400);
    setProvisionLog(p => [...p, `Deploying baseline Terraform modules (10 services)...`]);
    await sleep(1200);
    setProvisionLog(p => [...p, `✓  IaC applied · 47 resources created`, `✓  Tenant provisioning complete`]);
    const newId = provisionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 14);
    setTenants(prev => [...prev, {
      id: newId, name: provisionName, accountId: provisionAccountId,
      region: provisionRegion, rooms: 0, services: 10,
      lastDeploy: new Date().toISOString().slice(0, 10), status: 'healthy',
    }]);
    setProvisionStatus('ok');
  };

  const toggleStep = (runbook: string, step: number) => {
    setCheckedSteps(prev => {
      const cur = new Set(prev[runbook] ?? []);
      cur.has(step) ? cur.delete(step) : cur.add(step);
      return { ...prev, [runbook]: cur };
    });
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
    { key: 'metrics',      label: 'Metrics' },
    { key: 'tenants',      label: 'Tenants' },
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
                        <td style={{ padding: '11px 14px' }}>
                          <a href={`https://github.com/ambientintel/ambientcloud/tree/main/${svc.path}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>{svc.label} ↗</a>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 7px' }}>{svc.tag}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 400 }}>{svc.desc}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: svc.tests ? 'var(--text)' : 'var(--text-4)', textAlign: 'center' }}>{svc.tests ?? '—'}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 13, color: svc.tf ? 'var(--accent)' : 'var(--text-4)' }}>{svc.tf ? '✓' : '—'}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {svc.id === 'ella' && (
                              <button onClick={() => setExpandedSvc(expandedSvc === 'ella' ? null : 'ella')} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(126,34,206,0.4)', color: '#a855f7', background: 'rgba(126,34,206,0.07)', cursor: 'pointer' }}>
                                {expandedSvc === 'ella' ? 'Hide' : 'Narratives'}
                              </button>
                            )}
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
                                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-4)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 6px' }}>{n.tokens} tokens · claude-sonnet-4</span>
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
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
              {RUNBOOKS.length} runbooks — click any row to expand steps, check off as you go.
            </p>
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
                  {RUNBOOKS.map((rb) => {
                    const slug = rb.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const detail = RUNBOOK_DETAILS[rb];
                    const isOpen = expandedRunbook === rb;
                    const checked = checkedSteps[rb] ?? new Set<number>();
                    const allDone = detail && checked.size === detail.steps.length;
                    const sev = detail ? SEV_STYLE[detail.severity] : null;
                    return (
                      <Fragment key={rb}>
                        <tr onClick={() => setExpandedRunbook(isOpen ? null : rb)} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer', background: isOpen ? 'var(--surface-1)' : 'transparent' }}>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text)' }}>
                            <span style={{ marginRight: 6, fontSize: 10, color: 'var(--text-4)' }}>{isOpen ? '▲' : '▼'}</span>{rb}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            {sev && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, borderRadius: 3, padding: '2px 7px' }}>{detail.severity}</span>}
                          </td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{detail?.ttr ?? '—'}</td>
                          <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{detail?.escalateTo ?? '—'}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <a href={`https://github.com/ambientintel/ambientcloud/blob/main/docs/runbooks/${slug}.md`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>view ↗</a>
                          </td>
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
                                {allDone && (
                                  <button onClick={() => { setCheckedSteps(p => ({ ...p, [rb]: new Set() })); setExpandedRunbook(null); }} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 14px', borderRadius: 5, border: '1px solid #238636', background: 'rgba(35,134,54,0.12)', color: '#3fb950', cursor: 'pointer' }}>Mark resolved</button>
                                )}
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
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Function', 'Invocations', 'p99 Latency', 'Errors', 'Health'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.filter(s => s.lambdaFn).map(svc => {
                    const m = LAMBDA_METRICS[svc.id] ?? { p99ms: 0, errors: 0, invocations: 0 };
                    return (
                      <tr key={svc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent)' }}>{svc.lambdaFn}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{m.invocations.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: m.p99ms > 3000 ? '#d29922' : 'var(--text-2)' }}>{m.p99ms.toLocaleString()} ms</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: m.errors > 0 ? '#f85149' : 'var(--text-4)' }}>{m.errors}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10.5, color: m.errors === 0 ? '#3fb950' : '#f85149' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.errors === 0 ? '#3fb950' : '#f85149', display: 'inline-block' }} />
                            {m.errors === 0 ? 'healthy' : 'errors'}
                          </span>
                        </td>
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
              {[
                { label: 'Tenants', value: tenants.length },
                { label: 'Total Rooms', value: tenants.reduce((s, t) => s + t.rooms, 0) },
                { label: 'Healthy', value: tenants.filter(t => t.status === 'healthy').length },
                { label: 'Regions', value: new Set(tenants.map(t => t.region)).size },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    {['Organization', 'Account ID', 'Region', 'Rooms', 'Services', 'Last Deploy', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const st = TST_STYLE[t.status];
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text)' }}>{t.name}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-3)' }}>{t.accountId}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{t.region}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>{t.rooms}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: t.services < 10 ? '#d29922' : 'var(--text-2)', textAlign: 'center' }}>{t.services}/10</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{t.lastDeploy}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, background: st.bg, border: `1px solid ${st.border}`, color: st.color, borderRadius: 3, padding: '2px 8px' }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!showProvision ? (
              <button onClick={() => setShowProvision(true)} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, padding: '7px 16px', borderRadius: 6, border: '1px solid var(--line)', color: 'var(--accent)', background: 'var(--accent-soft)', cursor: 'pointer' }}>+ Provision new tenant</button>
            ) : (
              <div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 16 }}>Provision new tenant</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Organization name', value: provisionName, set: setProvisionName, placeholder: 'Acme Senior Living' },
                    { label: 'AWS Account ID',    value: provisionAccountId, set: setProvisionAccountId, placeholder: '123456789012' },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginBottom: 5 }}>{label}</div>
                      <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-4)', marginBottom: 5 }}>Region</div>
                    <select value={provisionRegion} onChange={e => setProvisionRegion(e.target.value)} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text)', outline: 'none' }}>
                      <option>us-east-1</option>
                      <option>us-west-2</option>
                      <option>eu-west-1</option>
                      <option>ap-southeast-1</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ActionButton label="Provision" icon="+" status={provisionStatus} onClick={handleProvision} />
                  {provisionStatus === 'idle' && (
                    <button onClick={() => { setShowProvision(false); setProvisionStatus('idle'); setProvisionLog([]); setProvisionName(''); setProvisionAccountId(''); }} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-4)', cursor: 'pointer' }}>cancel</button>
                  )}
                  {provisionStatus === 'ok' && (
                    <button onClick={() => { setShowProvision(false); setProvisionStatus('idle'); setProvisionLog([]); setProvisionName(''); setProvisionAccountId(''); }} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid #238636', color: '#3fb950', cursor: 'pointer' }}>done</button>
                  )}
                </div>
                {provisionLog.length > 0 && (
                  <div style={{ marginTop: 14, background: '#010409', border: '1px solid #21262d', borderRadius: 6, padding: '10px 14px', fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 11, lineHeight: 1.7 }}>
                    {provisionLog.map((line, i) => (
                      <div key={i} style={{ color: line.startsWith('✓') ? '#3fb950' : line.startsWith('$') ? '#79c0ff' : '#8b949e' }}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {editingSvc && (
        <ServiceEditor service={editingSvc} onClose={() => setEditingSvc(null)} />
      )}

    </div>
  );
}
