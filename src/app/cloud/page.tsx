'use client';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ServiceEditor = dynamic(() => import('./ServiceEditor'), { ssr: false });

type Tab = 'services' | 'paths' | 'architecture' | 'accounts' | 'runbooks' | 'editor';
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
  { id: 'cloudtrail', tag: 'Audit',        label: 'CloudTrail',      path: 'services/cloudtrail/',  tests: null, desc: 'Data-event audit logging on all sensitive DynamoDB tables — every read/write attributed for HIPAA compliance.', tf: true,  lambdaFn: null },
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

output "glue_database"        { value = aws_glue_catalog_database.telemetry.name }
output "athena_workgroup"     { value = aws_athena_workgroup.main.name }
output "athena_results_bucket"{ value = aws_s3_bucket.results.bucket }`,
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

function Group({ label, type, children, note }: { label: string; type: string; children: React.ReactNode; note?: string }) {
  const s = TYPE_STYLE[type] ?? TYPE_STYLE.device;
  return (
    <div style={{ border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '4px 12px', background: s.bg, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: s.labelColor, fontWeight: 600 }}>{label}</span>
        {note && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.06em' }}>{note}</span>}
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
        <Group label="AWS IoT Core" type="iot" note="mTLS · X.509">
          <Row><Node label="Credentials Provider" sub="role alias → temp AWS creds" type="iot" /></Row>
          <Row><Node label="Device Shadow" sub="facility / subject / room / zone" type="iot" /></Row>
          <Row><Node label="IoT Rule: fall-enricher" sub="Basic Ingest · QoS 1" type="iot" /></Row>
          <Row><Node label="IoT Rule: telemetry" sub="legacy · QoS 0 · retiring" type="iot" dashed /></Row>
        </Group>
      </div>

      <Group label="Hot path — fall alerts" type="hot" note="< 2s latency budget">
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
        <Group label="Cold path (new) — device-side Parquet" type="coldnew">
          <Row>
            <Node label="Device" sub="5-min batch · ZSTD" type="device" />
            <Arr />
            <Node label="url-minter" sub="SigV4 · Shadow scope check" type="coldnew" />
            <Arr />
            <Node label="S3" sub="raw-device/date=/facility=/" type="coldnew" />
          </Row>
        </Group>
        <Group label="Cold path (legacy) — retiring" type="coldold">
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

      <Group label="Cold path — shared query layer" type="query">
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

      <Group label="Narrative path — Ella" type="narrative" note="12h cadence · 7am + 7pm">
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

      <Group label="Nurse / Admin API" type="api" note="12 endpoints · row-level facility scope">
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
        <Group label="Audit & Governance" type="audit">
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
        <Group label="Central Observability" type="obs" note="metrics only · no PHI">
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
  const [editorFile, setEditorFile] = useState<TfFile>('main.tf');
  const [editorContent, setEditorContent] = useState<Record<string, Record<TfFile, string>>>(TF_CONTENT);
  const [testStatus,  setTestStatus]  = useState<ActionStatus>('idle');
  const [gitStatus,   setGitStatus]   = useState<ActionStatus>('idle');
  const [applyStatus, setApplyStatus] = useState<ActionStatus>('idle');
  const [actionLog, setActionLog] = useState<string[]>([]);

  const setEditorSvc = (id: string) => {
    setEditorSvcRaw(id);
    setEditorFile('main.tf');
    setTestStatus('idle');
    setGitStatus('idle');
    setApplyStatus('idle');
    setActionLog([]);
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
                  <ActionButton label="Push to Git"     icon="↑"  status={gitStatus}   onClick={handleGit}   />
                  <ActionButton label="Apply IaC"       icon="▶"  status={applyStatus} onClick={handleApply} />
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
