'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';


// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState('ok');
      setTimeout(() => setState('idle'), 1600);
    } catch { setState('err'); setTimeout(() => setState('idle'), 1600); }
  }
  return (
    <button onClick={copy} title="Copy to clipboard" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, border: state === 'ok' ? '1px solid #34D399' : '1px solid rgba(255,255,255,0.14)', background: state === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)', color: state === 'ok' ? '#34D399' : '#94A3B8', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em' }}>
      {state === 'ok'
        ? <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
        : <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v6.5A1.5 1.5 0 002.5 12H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>Copy</>}
    </button>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type StepStatus = 'done' | 'pending' | 'blocked' | 'warning';
interface Step { id: string; phase: string; title: string; status: StepStatus; tag: string; time?: string; summary: string; sections: Section[]; }
interface Section { heading?: string; body?: string; commands?: Cmd[]; artifacts?: Artifact[]; warnings?: string[]; table?: { cols: string[]; rows: string[][] }; checklist?: string[]; }
interface Cmd { label?: string; code: string; }
interface Artifact { file: string; role: string; size?: string; }

const SC: Record<StepStatus, { label: string; bg: string; border: string; color: string; dot: string }> = {
  done:    { label: 'Complete',  bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', dot: '#059669' },
  pending: { label: 'Pending',   bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', dot: '#D97706' },
  blocked: { label: 'Blocked',   bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', dot: '#DC2626' },
  warning: { label: 'Attention', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', dot: '#EA580C' },
};

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  'Architect': { bg: '#EEF2FF', color: '#4338CA' },
  'Infra':     { bg: '#ECFDF5', color: '#047857' },
  'Deploy':    { bg: '#FFFBEB', color: '#B45309' },
  'Validate':  { bg: '#FAF5FF', color: '#6D28D9' },
};

const PIPELINE_PHASES = [
  { label: 'Architect', ids: ['arch-review', 'irb-gov', 'iac-scaffold'] },
  { label: 'Infra',     ids: ['core-infra', 'data-plane', 'iot-core'] },
  { label: 'Deploy',    ids: ['hot-path', 'cold-path', 'narrative', 'api-auth'] },
  { label: 'Validate',  ids: ['integration-tests', 'prod-signoff'] },
];

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'arch-review', phase: '01', title: 'Architecture Review', status: 'done', tag: 'Architect', time: '~1 day',
    summary: 'AWS architecture v4 reviewed and approved. Five data paths: fall-alert hot path, device-side Parquet cold path, legacy Firehose cold path (retiring), 12h narrative, and nurse/admin API. Account-per-tenant isolation model confirmed.',
    sections: [
      {
        heading: 'Five data paths',
        table: {
          cols: ['Path', 'Transport', 'Latency budget', 'Status'],
          rows: [
            ['Fall alerts (hot)',       'MQTT QoS 1 → IoT Rule → Lambda → DDB + SNS',        '< 2 s end-to-end',   'Active'],
            ['Telemetry — new (cold)',  'Device Parquet → presigned PUT → S3',                 '5-min batch',        'Active / dual-write'],
            ['Telemetry — legacy (cold)', 'MQTT QoS 0 → IoT Rule → Firehose → S3',           '5-min buffer',       'Retiring'],
            ['Narrative (12h)',         'EventBridge → SQS → Ella Lambda → Bedrock',          'Best-effort, ~30 s', 'Active'],
            ['Nurse / Admin API',       'API GW → JWT → FastAPI Lambda → DDB/Athena',         'Web request',        'Active'],
          ],
        },
      },
      {
        heading: 'Service inventory',
        table: {
          cols: ['Service', 'Directory', 'Runtime', 'Tests'],
          rows: [
            ['admin-cli',   'services/admin-cli/', 'Python 3.12 (CLI)',   '28 pass'],
            ['api',         'services/api/',        'FastAPI + Lambda',    '19 pass'],
            ['athena',      'services/athena/',     'Terraform only',     'n/a'],
            ['cloudtrail',  'services/cloudtrail/', 'Terraform only',     'n/a'],
            ['ella',        'services/ella/',       'Python 3.12 Lambda', '11 pass'],
            ['telemetry',   'services/telemetry/',  'Python 3.12 Lambda', '15 pass'],
            ['url-minter',  'services/url-minter/', 'Python 3.12 Lambda', 'n/a'],
          ],
        },
      },
      {
        heading: 'Architecture documents',
        artifacts: [
          { file: 'docs/architecture-v4.md', role: 'Authoritative architecture v4 — five paths, account-per-tenant, dual-write state, KMS, Sonnet 4.5.' },
          { file: 'docs/architecture-v4.mmd', role: 'Canonical Mermaid diagram. Render at https://mermaid.live.' },
          { file: 'docs/tenancy.md', role: 'Multi-tenant account-per-tenant isolation model. One AWS account per organization.' },
          { file: 'docs/device-cloud-contract.md', role: 'Authoritative device ↔ cloud wire format, v0.2. IRB framing, research data handling.' },
        ],
      },
      {
        warnings: [
          'The legacy Firehose cold path remains active during dual-write migration. Do not decommission it until all facilities promote to parquet_only and the reconciler shows zero divergence for 7 consecutive days.',
          'Central observability receives CloudWatch scalar metrics only — no logs, no traces, no string-valued metric dimensions that could carry subject identifiers. Verify this before enabling any new metric stream.',
        ],
      },
    ],
  },
  {
    id: 'irb-gov', phase: '02', title: 'IRB & Governance', status: 'done', tag: 'Architect', time: '~1 day',
    summary: 'Research pilot under IRB-approved protocol. Coded data per HIPAA §164.514(c) — no names, DOBs, MRNs, or demographic detail at any point. Subject ID format PILOT-NNNN enforced by admin-cli and prompt rules.',
    sections: [
      {
        heading: 'Data model rules',
        table: {
          cols: ['Field', 'Rule', 'Enforcement'],
          rows: [
            ['Subject identifier', 'PILOT-NNNN format only (e.g. PILOT-0042)', 'admin-cli provisioning guard + prompt rule'],
            ['Facility identifier', 'Opaque UUID — no building name or address', 'Data model; API never returns facility names'],
            ['Names', 'Never stored in DDB, S3, or Shadows', 'admin-cli forbidden-attribute guard'],
            ['DOB / age', 'Never stored anywhere in the pipeline', 'admin-cli + Ella system prompt guard'],
            ['MRN / clinical ID', 'Explicitly forbidden', 'admin-cli + Layer 2 PII grep in self-review'],
            ['Demographic detail', 'Not collected in this system', 'IRB scope constraint'],
          ],
        },
      },
      {
        heading: 'Three-layer PII grep (self-review v1.2)',
        body: 'Every PR must pass the three-layer grep before merge. Layer 1: field-name fragments. Layer 2: clinical terminology. Layer 3: name-shaped values. Run these before opening a PR.',
        commands: [
          { label: 'Layer 1 — field name fragments', code: '# Checks for banned field names across the whole repo\ngrep -rn --include="*.py" --include="*.tf" --include="*.tofu" \\\n  -e "patient_id" -e "patientId" -e "first_name" -e "last_name" \\\n  -e "date_of_birth" -e "dob" -e "mrn" -e "/patients/" .\n# Expected: zero matches' },
          { label: 'Layer 2 — clinical terminology', code: '# Clinical terms that should never appear in code or data schemas\ngrep -rn --include="*.py" --include="*.tf" --include="*.tofu" \\\n  -e "diagnosis" -e "medication" -e "treatment" -e "clinical_note" .\n# Expected: zero matches' },
          { label: 'Layer 3 — name-shaped values in tests', code: '# Test fixtures must use coded identifiers, not real-looking names\ngrep -rn --include="*.py" \\\n  -e "Alice" -e "Bob" -e "Smith" -e "Jones" \\\n  -e "PAT-" -e "patient-" .\n# Whitelist tokens: TEST, MINTER, DATA, DEVICE (common false positives)' },
        ],
      },
      {
        heading: 'IRB governance artifacts',
        artifacts: [
          { file: 'docs/self-review/SELF_REVIEW.md', role: 'PR self-review worksheet v1.2 — three-layer PII grep + Terraform validate + authz check.' },
          { file: 'services/admin-cli/src/ambientcloud_admin/provisioning.py', role: 'admin-cli provisioning logic with PILOT-NNNN format enforcement and forbidden-attribute guard.' },
        ],
      },
      {
        warnings: [
          'The self-review worksheet Layer 2 grep caught every IRB violation in the initial PR merge train. Without it, at least one PR would have merged with patientId still present. Run it every time.',
          'Ella Lambda system prompt includes explicit forbidden-attribute instructions. Before upgrading the Bedrock model (e.g., Sonnet 4.5 → 4.6), re-evaluate the system prompt against the new model to confirm de-identification behavior is preserved.',
        ],
      },
    ],
  },
  {
    id: 'iac-scaffold', phase: '03', title: 'IaC Scaffold', status: 'done', tag: 'Architect', time: '~1 day',
    summary: 'Terraform 1.14+ per-service infra/ directories. .terraform.lock.hcl committed. terraform fmt enforced. Per-service pyproject.toml for Python packaging.',
    sections: [
      {
        heading: 'Repository structure',
        commands: [
          { label: 'clone and inspect top-level layout', code: 'git clone https://github.com/ambientintel/ambientcloud\ncd ambientcloud\n\n# Service layout: each service has its own infra/, src/, tests/\nls services/\n# → admin-cli/  api/  athena/  cloudtrail/  ella/  telemetry/  url-minter/\n\n# Each service: infra/ for Terraform, src/ for Python, tests/ for pytest\nls services/api/\n# → infra/  src/  tests/  pyproject.toml  requirements.txt  README.md' },
          { label: 'validate Terraform across all services', code: '# Run from repo root — validates all infra/ directories\nfor svc in services/*/infra; do\n  echo "→ $svc"\n  (cd "$svc" && terraform init -backend=false -no-color > /dev/null && terraform validate)\ndone\n# Expected: all succeed with "Success! The configuration is valid."' },
        ],
      },
      {
        heading: 'Terraform conventions',
        checklist: [
          'Every infra/ directory has a .terraform.lock.hcl committed — no drifted provider versions',
          'terraform fmt applied to all .tf and .tofu files before every commit',
          'Variable blocks use type constraints (string, number, bool) — not bare type = string syntax',
          'S3 lifecycle rules include filter {} block — provider will error without it in future versions',
          'CloudTrail uses advanced_event_selector blocks only — never mix with legacy event_selector',
          'All resources tagged with tenant, environment, and path for cost allocation',
          'No hardcoded account IDs or region strings — use data.aws_caller_identity and var.aws_region',
        ],
      },
      {
        heading: 'Terraform state',
        body: 'Terraform state is currently local (no remote backend configured). The target state is S3 + DynamoDB lock per service. This must be set up before any CI/CD automation.',
        commands: [
          { label: 'configure remote state backend (per service)', code: '# Add to services/<svc>/infra/main.tf:\nterraform {\n  backend "s3" {\n    bucket         = var.tf_state_bucket\n    key            = "ambientcloud/<service>/terraform.tfstate"\n    region         = "us-east-1"\n    dynamodb_table = "ambient-tf-lock"\n    encrypt        = true\n  }\n}\n\n# Initialize with remote state:\nterraform init \\\n  -backend-config="bucket=<your-tf-state-bucket>"' },
        ],
        artifacts: [
          { file: 'services/api/infra/main.tf', role: 'FastAPI Lambda + API Gateway + Cognito Terraform — reference for all service infra patterns.' },
          { file: 'services/ella/infra/main.tf', role: 'Ella Lambda + EventBridge + SQS Terraform — EventBridge cron + fanout pattern.' },
        ],
        warnings: [
          'Running terraform apply with local state across multiple engineers will cause state conflicts. Set up the S3 remote backend before adding a second engineer to infra work.',
          'services/cloudtrail/infra/main.tf originally had both event_selector and advanced_event_selector on the same aws_cloudtrail resource — mutually exclusive per provider. Fixed to use three advanced_event_selector blocks only. Verify this if rebasing from old branches.',
        ],
      },
    ],
  },
  {
    id: 'core-infra', phase: '04', title: 'Core Infra — VPC / IAM / KMS', status: 'done', tag: 'Infra', time: '~2 hrs',
    summary: 'VPC with private subnets and endpoints for S3, KMS, Secrets Manager, and DynamoDB. Tenant customer-managed CMK for at-rest encryption. IAM roles per service with least-privilege policies.',
    sections: [
      {
        heading: 'Apply core infrastructure',
        commands: [
          { label: 'authenticate to AWS', code: 'aws sso login\n# or: export AWS_PROFILE=ambient\n\n# Verify caller identity\naws sts get-caller-identity\n# Expected: {"Account": "<tenant-account-id>", "Arn": "arn:aws:iam::..."}' },
          { label: 'create tenant KMS CMK', code: '# KMS key for at-rest encryption of all S3 + DynamoDB\naws kms create-key \\\n  --description "ambient-<tenant>-cmk" \\\n  --key-policy file://infra/kms-policy.json \\\n  --region us-east-1\n\n# Tag it for cost allocation\naws kms create-alias \\\n  --alias-name alias/ambient-<tenant>-cmk \\\n  --target-key-id <key-id>\n\naws kms tag-resource \\\n  --key-id <key-id> \\\n  --tags TagKey=tenant,TagValue=<tenant> TagKey=environment,TagValue=prod' },
          { label: 'apply VPC module (snapsoft/ infra)', code: 'cd snapsoft/infra\ntofu init\ntofu plan -out=plan.tfplan\ntofu apply plan.tfplan\n\n# Verify VPC endpoints created:\naws ec2 describe-vpc-endpoints \\\n  --filters "Name=vpc-id,Values=<vpc-id>" \\\n  --query "VpcEndpoints[].ServiceName"' },
        ],
      },
      {
        heading: 'VPC endpoint requirements',
        table: {
          cols: ['AWS Service', 'Endpoint type', 'Why required'],
          rows: [
            ['S3',             'Gateway',   'Device Parquet uploads + Lambda reads — no internet traversal'],
            ['KMS',            'Interface', 'SSE-KMS encryption/decryption for S3 and DynamoDB'],
            ['Secrets Manager','Interface', 'Lambda reads for DB credentials and API secrets'],
            ['DynamoDB',       'Gateway',   'Lambda reads/writes without public routing'],
            ['IoT Core',       'n/a',       'Devices use mTLS to the AWS IoT endpoint directly — no VPC endpoint needed'],
          ],
        },
      },
      {
        heading: 'Encryption at rest',
        checklist: [
          'Tenant CMK created and alias set to alias/ambient-<tenant>-cmk',
          'CMK key policy restricts usage to the tenant account — no cross-account key grants',
          'All S3 buckets created with ServerSideEncryptionConfiguration using the CMK',
          'All DynamoDB tables created with SSESpecification using the CMK',
          'Secrets Manager secrets using KMS CMK (not AWS managed key)',
          'CloudTrail log bucket encrypted with CMK',
          'All resources tagged: tenant, environment, path',
        ],
      },
      {
        warnings: [
          'Do NOT use the AWS-managed KMS key (aws/s3, aws/dynamodb) for any tenant data. The tenant CMK is the audit-defensible choice for HIPAA workloads — it ensures key material never leaves the tenant account and all key usage appears in CloudTrail.',
          'KMS key deletion has a mandatory 7–30 day waiting period. Never schedule CMK deletion unless the tenant is fully decommissioned and all data has been purged per the retention policy.',
        ],
      },
    ],
  },
  {
    id: 'data-plane', phase: '05', title: 'Data Plane — S3 / DDB / Athena', status: 'done', tag: 'Infra', time: '~2 hrs',
    summary: 'S3 bucket for device Parquet + legacy Firehose data. Three DynamoDB tables: devices, alerts, daily-updates. Glue Data Catalog with partition projection and telemetry union view.',
    sections: [
      {
        heading: 'DynamoDB table schemas',
        table: {
          cols: ['Table', 'PK', 'GSIs', 'Purpose'],
          rows: [
            ['ambient-<tenant>-devices',       'deviceId (S)',         'facilityId-GSI, subjectId-GSI',          'Device registry — Thing name, subject, facility, cert status'],
            ['ambient-<tenant>-alerts',        'subject_date (S)',     'facility-time-GSI, eventId-GSI',         'Fall event audit log — enriched alert with facility scoping'],
            ['ambient-<tenant>-daily-updates', 'subjectId (S)',        'facilityId-GSI',                        'Ella narrative output — 90-day TTL, per-subject latest summary'],
          ],
        },
      },
      {
        heading: 'Apply data plane Terraform',
        commands: [
          { label: 'deploy Athena + Glue table', code: 'cd services/athena/infra\nterraform init\nterraform plan -out=plan.tfplan\nterraform apply plan.tfplan\n\n# Verify Glue tables created:\naws glue get-tables \\\n  --database-name ambient_<tenant> \\\n  --query "TableList[].Name"\n# Expected: ["telemetry_device", "telemetry_firehose"]' },
          { label: 'verify Athena view (dual-write)', code: '# The "telemetry" view UNIONs both tables during migration\naws athena start-query-execution \\\n  --query-string "SELECT COUNT(*) FROM ambient_<tenant>.telemetry LIMIT 1" \\\n  --work-group ambient-dev-analytics \\\n  --result-configuration OutputLocation=s3://ambient-<tenant>-athena-results/\n\n# Poll for result:\naws athena get-query-results \\\n  --query-execution-id <execution-id>' },
          { label: 'S3 lifecycle policy', code: '# 30-day → Standard-IA → 90-day → Glacier Deep Archive\naws s3api put-bucket-lifecycle-configuration \\\n  --bucket ambient-<tenant>-parquet \\\n  --lifecycle-configuration file://infra/lifecycle.json\n\n# Verify:\naws s3api get-bucket-lifecycle-configuration \\\n  --bucket ambient-<tenant>-parquet' },
        ],
      },
      {
        heading: 'CloudTrail data events',
        commands: [
          { label: 'deploy CloudTrail Terraform', code: 'cd services/cloudtrail/infra\nterraform init\nterraform apply\n\n# Verify data events configured on sensitive tables:\naws cloudtrail get-event-selectors \\\n  --trail-name ambient-<tenant>-trail\n# Must include: DDB tables (devices, alerts, daily-updates) + S3 bucket' },
        ],
        artifacts: [
          { file: 'services/athena/infra/main.tf', role: 'Glue database + two tables (telemetry_device, telemetry_firehose) + partition projection. No crawler.' },
          { file: 'services/cloudtrail/infra/main.tf', role: 'CloudTrail with advanced_event_selector on DDB data events and S3 data events. 7-year Glacier retention.' },
        ],
        warnings: [
          'Athena uses partition projection — there is no Glue crawler and no EventBridge partition registration. The partition keys (date, facility, subject, device) must exactly match what the device writes to the S3 key path. If the device Parquet key format changes, update the Glue table partition projection immediately.',
          'DynamoDB TTL (90 days) on daily-updates is set at the table level but TTL attribute must be called expires_at on each item. Ella Lambda must write this field on every put — verify in integration tests.',
        ],
      },
    ],
  },
  {
    id: 'iot-core', phase: '06', title: 'IoT Core & Provisioning', status: 'done', tag: 'Infra', time: '~2 hrs',
    summary: 'Fleet provisioning with factory bootstrap cert → tenant X.509 cert lifecycle. Basic Ingest on fall alert topic. IoT Credentials Provider for device AWS API access. admin-cli for operator provisioning.',
    sections: [
      {
        heading: 'Fleet provisioning flow',
        body: 'Devices come off the line with a factory bootstrap cert signed by our root CA. At first boot: (1) device hits the control-plane fleet provisioning endpoint, (2) control plane assumes a cross-account role into the tenant account, (3) mints a tenant-specific X.509 cert via AWS IoT fleet provisioning, (4) device receives tenant cert and deletes bootstrap cert. From that point the device talks only to the tenant IoT endpoint.',
        commands: [
          { label: 'provision a new device via admin-cli', code: '# Requires: AMBIENT_* env vars pointing to the tenant account\npip install -e services/admin-cli\n\nambientcloud-admin provision \\\n  --device-id DEV-0001 \\\n  --facility-id <facility-uuid> \\\n  --subject-id PILOT-0042\n\n# Verifies: PILOT-NNNN format, no PII fields, registers in DDB + IoT' },
          { label: 'verify device Thing and certificate', code: 'aws iot describe-thing \\\n  --thing-name DEV-0001 \\\n  --region us-east-1\n\n# Should show: thingArn, thingName, attributes (facilityId, subjectId)\n\naws iot list-thing-principals \\\n  --thing-name DEV-0001\n# Should show: exactly one active certificate ARN' },
          { label: 'decommission a device', code: 'ambientcloud-admin decommission \\\n  --device-id DEV-0001\n\n# Revokes cert in IoT Core + marks registry entry as retired\n# A decommissioned device cannot rejoin the fleet' },
        ],
      },
      {
        heading: 'IoT Rules configuration',
        table: {
          cols: ['Rule name', 'Topic filter', 'Action', 'Notes'],
          rows: [
            ['fall-enricher',     '$aws/rules/fall-enricher/ambient/v1/alerts/fall/+', 'Lambda invoke (alert enricher)',    'Basic Ingest — no MQTT messaging fee. QoS 1 for at-least-once delivery.'],
            ['telemetry-legacy',  'ambient/v1/telemetry/+',                             'Kinesis Firehose',                  'Legacy path — retiring. Still active during dual-write migration.'],
          ],
        },
      },
      {
        heading: 'IoT Credentials Provider',
        commands: [
          { label: 'verify credentials provider config', code: '# Devices use IoT Core Credentials Provider to get short-lived AWS creds\n# Used for: url-minter calls + S3 PUT for Parquet uploads\n\naws iot describe-role-alias \\\n  --role-alias ambient-device-role \\\n  --region us-east-1\n\n# credentialDurationSeconds: should be 3600 (1 hour max)\n# roleArn: should grant s3:PutObject on raw-device prefix + url-minter invoke' },
        ],
        artifacts: [
          { file: 'services/admin-cli/src/ambientcloud_admin/provisioning.py', role: 'Provisioning logic: PILOT-NNNN enforcement, DDB registration, IoT cert lifecycle.' },
          { file: 'services/admin-cli/rooms.example.yaml', role: 'Example facility+room config for batch provisioning via admin-cli.' },
        ],
        warnings: [
          'Never delete or revoke a device certificate without first running `ambientcloud-admin decommission`. Direct certificate revocation via the IoT console leaves the DDB registry in an inconsistent state and may cause orphan Things.',
          'The control-plane cross-account role is scoped to IoT fleet provisioning only. If the role permissions are broadened (e.g., to allow DDB access), the blast radius of a compromised bootstrap cert expands significantly. Review any changes to the cross-account role policy.',
        ],
      },
    ],
  },
  {
    id: 'hot-path', phase: '07', title: 'Hot Path — Fall Alert Lambda', status: 'done', tag: 'Deploy', time: '~1 hr',
    summary: 'Fall alert enricher Lambda deployed. MQTT QoS 1 → IoT Basic Ingest → Lambda → DynamoDB alerts table + SNS fan-out to staff subscriptions. Sub-2s end-to-end latency verified.',
    sections: [
      {
        heading: 'Deploy fall alert Lambda',
        commands: [
          { label: 'deploy telemetry service (Lambda + SNS)', code: 'cd services/telemetry\n\n# Build the deployment package\nzip -r function.zip src/\n\n# Apply Terraform (SNS topic, IoT Rule, Lambda, IAM)\ncd infra\nterraform init\nterraform apply\n\n# Deploy Lambda code\naws lambda update-function-code \\\n  --function-name ambient-dev-fall-enricher \\\n  --zip-file fileb://../function.zip \\\n  --region us-east-1' },
          { label: 'verify IoT Rule and Lambda trigger', code: '# Confirm IoT Rule is active\naws iot get-topic-rule \\\n  --rule-name fall-enricher\n# ruleDisabled: false, actions[0].lambda.functionArn: <lambda-arn>\n\n# Confirm Lambda function exists\naws lambda get-function \\\n  --function-name ambient-dev-fall-enricher\n# State: Active, Runtime: python3.12' },
          { label: 'inject a synthetic fall event to test end-to-end', code: '# Publish directly to the Rules Engine via Basic Ingest\naws iot-data publish \\\n  --topic "\\$aws/rules/fall-enricher/ambient/v1/alerts/fall/test-001" \\\n  --payload \'{"deviceId":"DEV-0001","eventId":"test-001","ts_utc":"2026-05-07T12:00:00Z","confidence":0.92}\' \\\n  --qos 1 \\\n  --region us-east-1\n\n# Verify DDB write:\naws dynamodb get-item \\\n  --table-name ambient-<tenant>-alerts \\\n  --key \'{"subject_date":{"S":"PILOT-0042_2026-05-07"}}\'  ' },
        ],
      },
      {
        heading: 'SNS subscription verification',
        table: {
          cols: ['Subscription type', 'Filter attribute', 'Verification step'],
          rows: [
            ['SMS',         'facilityId = <uuid>', 'Confirm staff number receives test SMS after synthetic event'],
            ['Mobile push', 'facilityId = <uuid>', 'Confirm push token receives notification via SNS → APNs/FCM'],
            ['Web (nurse)', 'facilityId = <uuid>', 'Confirm dashboard alert list updates within 2s of DDB write'],
          ],
        },
      },
      {
        artifacts: [
          { file: 'services/telemetry/src/', role: 'Fall alert enricher Lambda — DDB lookup, alert write, SNS publish with facility filter attribute.' },
          { file: 'services/telemetry/infra/main.tf', role: 'IoT Rule (Basic Ingest), Lambda, SNS topic, IAM role.' },
        ],
        warnings: [
          'Basic Ingest requires the topic to start with $aws/rules/<ruleName>/. If the device firmware publishes to a different topic, the Rules Engine will not match it and no MQTT messaging fee will be charged — but the alert will also never fire. Verify topic format against the device-cloud contract.',
          'The hot path must remain on MQTT QoS 1 even after the cold path migrates to device-side Parquet. S3 PUT is the wrong transport for a 2-second SLA — do not route fall alerts through the Parquet/url-minter path.',
        ],
      },
    ],
  },
  {
    id: 'cold-path', phase: '08', title: 'Cold Path — URL Minter + Parquet', status: 'pending', tag: 'Deploy', time: '~2 hrs',
    summary: 'url-minter Lambda deployed. Devices obtain presigned S3 PUT URLs for 5-min Parquet batches. Dual-write reconciler running — both Firehose and device-Parquet paths active. Migration proceeds per-facility.',
    sections: [
      {
        heading: 'Deploy url-minter Lambda',
        commands: [
          { label: 'deploy url-minter', code: 'cd services/url-minter\nzip -r function.zip src/\n\ncd infra\nterraform init\nterraform apply\n\naws lambda update-function-code \\\n  --function-name ambient-dev-url-minter \\\n  --zip-file fileb://../function.zip\n\n# Verify:\naws lambda get-function-configuration \\\n  --function-name ambient-dev-url-minter\n# Handler: src/url_minter.handler, Timeout: 10, Memory: 128' },
          { label: 'test presigned URL issuance', code: '# url-minter validates SigV4 identity + shadow desired state before issuing URL\n# Simulate a device POST:\ncurl -X POST \\\n  https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/upload-url \\\n  -H "Authorization: Bearer <device-sigv4-token>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"deviceId":"DEV-0001","sha256":"<hex>","s3Key":"raw-device/date=2026-05-07/facility=<uuid>/subject=PILOT-0042/device=DEV-0001/batch-001.parquet","contentType":"application/octet-stream"}\'\n# Expected: {"url": "https://s3.amazonaws.com/ambient-<tenant>-parquet/...", "expiresIn": 300}' },
        ],
      },
      {
        heading: 'Dual-write migration commands',
        body: 'Each device has a telemetry_mode Shadow field: mqtt_only, dual, or parquet_only. Migration proceeds per-facility. Never flip a facility if the reconciler shows divergence.',
        commands: [
          { label: 'check current telemetry mode for a device', code: 'ambientcloud-admin telemetry mode DEV-0001\n# → dual' },
          { label: 'check reconciler divergence before migrating', code: 'ambientcloud-admin telemetry divergence <facility-uuid>\n# Must show 0.0% divergence over last 24h before proceeding\n# If non-zero: investigate before flipping — check CloudWatch TelemetryDivergence metric' },
          { label: 'bulk-migrate a facility to parquet_only', code: '# Refuses if reconciler flagged divergence in last 24h\nambientcloud-admin telemetry migrate <facility-uuid>\n\n# After migration: verify in CloudWatch\naws cloudwatch get-metric-statistics \\\n  --namespace Ambient/Telemetry \\\n  --metric-name TelemetryDivergence \\\n  --dimensions Name=facilityId,Value=<facility-uuid> \\\n  --start-time $(date -u -d "1 hour ago" +%Y-%m-%dT%H:%M:%SZ) \\\n  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \\\n  --period 300 --statistics Maximum' },
        ],
        artifacts: [
          { file: 'docs/device-parquet-sink.md', role: 'Device-side Parquet cold path spec — WAL design, presigned URL flow, dual-write migration, promotion criteria.' },
          { file: 'services/url-minter/src/', role: 'url-minter Lambda — SigV4 validation, Shadow desired state check, presigned URL issuance with KMS key scope.' },
        ],
        warnings: [
          'The url-minter validates that the requested S3 key\'s facility and subject match the device\'s Shadow desired state. If a device is re-assigned to a new subject, update the Shadow BEFORE the device starts batching — otherwise all Parquet uploads will be rejected.',
          'Device WAL spool is capped at 500 MB (~5 days offline tolerance). If a device is offline for more than 5 days and comes back online, it will start dropping the oldest WAL segments. Monitor the url-minter issuance rate in central observability for gaps.',
        ],
      },
    ],
  },
  {
    id: 'narrative', phase: '09', title: 'Narrative Path — Ella + Bedrock', status: 'pending', tag: 'Deploy', time: '~1 hr',
    summary: 'EventBridge cron fires at 07:00 and 19:00 → SQS fanout → Ella Lambda → Bedrock Claude Sonnet 4.5 → DynamoDB daily-updates. Produces de-identified 12h activity summaries for clinical staff.',
    sections: [
      {
        heading: 'Deploy Ella narrative service',
        commands: [
          { label: 'deploy Ella Lambda + EventBridge + SQS', code: 'cd services/ella\nzip -r function.zip src/\n\ncd infra\nterraform init\nterraform apply\n\naws lambda update-function-code \\\n  --function-name ambient-dev-ella \\\n  --zip-file fileb://../function.zip\n\n# Verify EventBridge rule created:\naws events list-rules \\\n  --event-bus-name default \\\n  --name-prefix ambient-ella\n# Should show two rules: ella-0700 and ella-1900' },
          { label: 'trigger a test narrative for one subject', code: '# Direct Lambda invoke for a single subject (bypasses SQS fanout)\naws lambda invoke \\\n  --function-name ambient-dev-ella \\\n  --payload \'{"subjectId":"PILOT-0042","facilityId":"<uuid>","window_hours":12}\' \\\n  --cli-binary-format raw-in-base64-out \\\n  /tmp/ella-response.json\n\ncat /tmp/ella-response.json\n# Expected: {"statusCode": 200, "narrative": "...", "subject": "PILOT-0042"}\n# Narrative must NOT contain names, DOBs, MRNs, or demographic detail' },
        ],
      },
      {
        heading: 'Bedrock model configuration',
        table: {
          cols: ['Parameter', 'Value', 'Notes'],
          rows: [
            ['Model ID',         'anthropic.claude-sonnet-4-5-20250929-v1:0', 'Current production model — HIPAA-eligible on Bedrock'],
            ['Region',           'us-east-1',                                  'Must match tenant account region — no cross-region Bedrock calls'],
            ['Max tokens',       '1024',                                        'Sufficient for 12h summary — increase to 2048 if summaries truncate'],
            ['Temperature',      '0.3',                                         'Low temp for clinical consistency — not creative generation'],
            ['System prompt',    'services/ella/src/system_prompt.txt',        'De-identification instructions + forbidden-attribute guard'],
            ['Upgrade path',     'claude-sonnet-4-6 (pending eval)',            'Available on Bedrock; needs de-id prompt evaluation before flip'],
          ],
        },
      },
      {
        heading: 'SQS DLQ and error handling',
        commands: [
          { label: 'check DLQ for failed narratives', code: '# SQS DLQ captures Ella failures after 3 retries\naws sqs get-queue-attributes \\\n  --queue-url https://sqs.us-east-1.amazonaws.com/<acct>/ambient-ella-dlq \\\n  --attribute-names ApproximateNumberOfMessages\n\n# Drain the DLQ to inspect failed messages:\naws sqs receive-message \\\n  --queue-url https://sqs.us-east-1.amazonaws.com/<acct>/ambient-ella-dlq \\\n  --max-number-of-messages 10' },
        ],
        artifacts: [
          { file: 'services/ella/src/', role: 'Ella Lambda — Athena query for 12h aggregates, DDB fall event count, Bedrock invoke, DDB write with 90-day TTL.' },
          { file: 'services/ella/infra/main.tf', role: 'EventBridge cron × 2, scheduling Lambda, SQS fanout queue, DLQ, Ella Lambda, IAM role.' },
        ],
        warnings: [
          'Before upgrading the Bedrock model from Sonnet 4.5 to Sonnet 4.6, run at least 20 test narratives against known Athena data and verify the de-id system prompt produces clean output — no subject names, no facility names, no clinical identifiers. Document the evaluation as a PR comment before merging the model ID change.',
          'Ella reads from the Athena telemetry view, which UNIONs both cold paths during dual-write. After all facilities are promoted to parquet_only, the view collapses to telemetry_device. No Ella code changes are needed — but verify Ella narratives remain consistent before and after the view transition.',
        ],
      },
    ],
  },
  {
    id: 'api-auth', phase: '10', title: 'API & Auth — FastAPI + Cognito', status: 'pending', tag: 'Deploy', time: '~2 hrs',
    summary: 'FastAPI Lambda behind API Gateway HTTP API with Cognito JWT authorizer. Twelve endpoints with row-level facility scoping. Users provisioned by admin-cli only — no self-signup.',
    sections: [
      {
        heading: 'Deploy API service',
        commands: [
          { label: 'deploy API Lambda + API Gateway + Cognito', code: 'cd services/api\n\n# Install Python deps into package dir\npip install -r requirements.txt -t package/\ncp -r src/ambient_api package/\ncd package && zip -r ../function.zip . && cd ..\n\ncd infra\nterraform init\nterraform apply\n\naws lambda update-function-code \\\n  --function-name ambient-dev-api \\\n  --zip-file fileb://../function.zip' },
          { label: 'provision the first admin user', code: '# Admin-create only — no self-signup\nambientcloud-admin user create \\\n  --email admin@facility.org \\\n  --role admin \\\n  --facility-id <facility-uuid>\n\n# Verify Cognito attributes:\naws cognito-idp admin-get-user \\\n  --user-pool-id <pool-id> \\\n  --username admin@facility.org\n# custom:role: admin, custom:facilityIds: <facility-uuid>' },
          { label: 'smoke-test key API endpoints', code: '# Get JWT via Cognito\nTOKEN=$(aws cognito-idp initiate-auth \\\n  --auth-flow USER_PASSWORD_AUTH \\\n  --auth-parameters USERNAME=admin@facility.org,PASSWORD=<pass> \\\n  --client-id <client-id> \\\n  --query "AuthenticationResult.IdToken" --output text)\n\n# List subjects (facility-scoped)\ncurl -H "Authorization: Bearer $TOKEN" \\\n  https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/subjects\n\n# List recent alerts\ncurl -H "Authorization: Bearer $TOKEN" \\\n  https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/alerts?limit=10' },
        ],
      },
      {
        heading: 'API endpoint inventory',
        table: {
          cols: ['Endpoint', 'Scope', 'Notes'],
          rows: [
            ['GET /alerts',              'facilityIds claim',  'Paginated alert list — latest first'],
            ['GET /alerts/{eventId}',    'facilityIds claim',  'Alert detail with enrichment'],
            ['GET /daily-updates',       'facilityIds claim',  'Latest Ella narratives per subject'],
            ['GET /daily-updates/{id}',  'facilityIds claim',  'Single narrative + metadata'],
            ['GET /devices',             'facilityIds claim',  'Device roster — status, last seen'],
            ['GET /subjects',            'facilityIds claim',  'Subject list — coded IDs only, no demographic data'],
            ['GET /subjects/{id}',       'facilityIds claim',  'Subject detail + activity summary'],
            ['POST /subjects/{id}/narrative', 'facilityIds claim', 'On-demand Ella invoke for one subject'],
            ['POST /facilities',         'admin only',        'Create facility'],
            ['POST /users',              'admin only',        'Provision nurse or admin user'],
            ['PATCH /users/{id}',        'admin only',        'Update role or facilityIds claim'],
            ['POST /devices/provision',  'admin only',        'Provision device + register in IoT + DDB'],
          ],
        },
      },
      {
        heading: 'Row-level facility scoping',
        body: 'Every database read includes WHERE facilityId IN :caller_facility_ids applied in the application layer. This is data-model enforcement — not IAM-level scoping. The custom:facilityIds Cognito claim is extracted from the JWT and applied on every handler.',
        warnings: [
          'The initial API tests used a module-level boto3.resource patch with a single shared MagicMock for all three DDB tables. This caused test_subject_detail_cross_facility_denied to silently pass despite a real authz bug. Always use Table.side_effect factory for independent mocks per table in pytest.',
          'There is a known TODO in services/api/src/ambient_api/app.py get_activity: SQL escape uses manual string substitution rather than Athena prepared statements. Before adding user-controlled filter parameters to this endpoint, replace with ExecutionParameters. See the inline TODO and test_activity_escapes_single_quotes.',
        ],
      },
    ],
  },
  {
    id: 'integration-tests', phase: '11', title: 'Integration Tests', status: 'pending', tag: 'Validate', time: '~1 hr',
    summary: 'End-to-end test harness with FakeDevice drives the full stack against real AWS. 73 tests passing across 4 services. Requires AMBIENT_* env vars to run.',
    sections: [
      {
        heading: 'Run integration tests',
        commands: [
          { label: 'set required environment variables', code: '# Integration tests require real AWS credentials and tenant account vars\nexport AMBIENT_ACCOUNT_ID=<tenant-account-id>\nexport AMBIENT_REGION=us-east-1\nexport AMBIENT_IOT_ENDPOINT=$(aws iot describe-endpoint \\\n  --endpoint-type iot:Data-ATS --query endpointAddress --output text)\nexport AMBIENT_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod\nexport AMBIENT_USER_POOL_ID=<pool-id>\nexport AMBIENT_S3_BUCKET=ambient-<tenant>-parquet' },
          { label: 'run full integration test suite', code: 'cd /path/to/ambientcloud\npip install -e ".[test]"\n\n# Full suite (skips integration tests without AMBIENT_* vars)\npytest -v\n\n# Integration only:\npytest -v -m integration tests/integration/\n\n# Expected output:\n# tests/integration/test_end_to_end.py ... 73 passed\n# All services: admin-cli 28 pass, api 19 pass, ella 11 pass, telemetry 15 pass' },
          { label: 'run end-to-end with FakeDevice', code: '# FakeDevice simulates a full device lifecycle:\n# provision → connect → publish fall alert → upload Parquet → verify narrative\npytest -v tests/integration/test_end_to_end.py -k "test_full_device_lifecycle"\n\n# Confirm all five data paths exercised:\n# ✓ fall alert → DDB + SNS\n# ✓ Parquet upload via url-minter\n# ✓ Athena query (via API /subjects/{id})\n# ✓ Ella narrative triggered\n# ✓ API returns subject detail with narrative' },
        ],
      },
      {
        heading: 'Test coverage by service',
        table: {
          cols: ['Service', 'Tests', 'Key scenarios covered'],
          rows: [
            ['admin-cli',  '28 pass', 'Provisioning format validation, cert lifecycle, decommission, forbidden-attribute guard'],
            ['api',        '19 pass', 'Facility scoping, cross-facility auth denial, alert pagination, subject detail, on-demand narrative'],
            ['ella',       '11 pass', 'Athena query construction, Bedrock invoke, de-id system prompt adherence, DLQ retry'],
            ['telemetry',  '15 pass', 'Fall event enrichment, DDB write, SNS publish with facility filter, synthetic event injection'],
          ],
        },
      },
      {
        heading: 'CI/CD target (not yet wired)',
        commands: [
          { label: 'target GitHub Actions workflow structure', code: '# .github/workflows/ci.yml (target state — not yet created)\n# on: push: branches: [main]\n# jobs:\n#   test:\n#     - run: pytest -v (unit tests, no AMBIENT_* vars)\n#   validate-infra:\n#     - run: terraform fmt -check + terraform validate per service\n#   integration: (requires OIDC secrets)\n#     - if: branch == main\n#     - run: pytest -v -m integration tests/integration/' },
        ],
        warnings: [
          'Integration tests hit real AWS — they create and delete real resources in the tenant account. Run only against a non-production tenant account or a dedicated test tenant. Never run against the production tenant.',
          'The integration test conftest.py provisions a test FakeDevice and cleans it up after the session. If a test run is interrupted, orphan Things and certs may be left in IoT Core. Run `ambientcloud-admin cleanup-test-devices` to purge them.',
        ],
      },
    ],
  },
  {
    id: 'prod-signoff', phase: '12', title: 'Production Sign-Off', status: 'pending', tag: 'Validate', time: 'reference',
    summary: 'All seven services deployed and verified. CloudTrail audit active. Runbooks dry-run complete. Production Freeze marks the system ready for the IRB pilot cohort.',
    sections: [
      {
        heading: 'Production readiness checklist',
        checklist: [
          'All 7 services deployed and Lambda functions in Active state',
          '73/73 integration tests passing against the production tenant',
          'CloudTrail data events enabled on devices, alerts, and daily-updates DDB tables',
          'CloudTrail data events enabled on ambient-<tenant>-parquet S3 bucket',
          'CloudTrail retention: 7-year Glacier Deep Archive per HIPAA §164.316(b)(2)(i)',
          'All DynamoDB tables using SSE-KMS with tenant CMK',
          'All S3 buckets using SSE-KMS with tenant CMK',
          'VPC endpoints active: S3, KMS, Secrets Manager, DynamoDB',
          'SNS subscriptions verified for all active facility staff',
          'Cognito MFA enabled for all admin and nurse users',
          'Break-glass role documented and tested — CloudTrail event verified on assumption',
          'Central observability metric streams flowing to ops account (no PII in metric dimensions)',
          'Dual-write reconciler Lambda running — TelemetryDivergence alarm configured',
          'At least one facility promoted to parquet_only and reconciler shows zero divergence',
          'Ella narratives verified de-identified on 20+ test subjects',
          'API cross-facility denial test passed in integration suite',
          'Runbooks dry-run: device-offline, fall-alert-missed, api-5xx, cost-spike',
          'IRB data request runbook reviewed with PI / medical lead',
        ],
      },
      {
        heading: 'Commit production sign-off',
        commands: [
          { label: 'tag the production release', code: '# Tag the exact commit deployed to production\ngit tag -a v1.0.0-prod \\\n  -m "Production release — IRB pilot cohort. All 7 services deployed, 73 tests passing."\ngit push origin v1.0.0-prod\n\n# Record in deployment-status.md\ncat >> docs/deployment-status.md << EOF\n\n## Production Release\n- Date: $(date -u +%Y-%m-%d)\n- Tag: v1.0.0-prod\n- Tenant: <tenant-id>\n- Services: all 7 deployed\n- Tests: 73/73 passing\n- IRB protocol: active\nEOF\ngit commit -am "docs: record production release v1.0.0-prod"\ngit push' },
        ],
        artifacts: [
          { file: 'docs/deployment-status.md', role: 'Service inventory, merge history, and production release record.' },
          { file: 'docs/runbooks/', role: '11 incident-response runbooks — API 5xx, auth, cost spike, device offline, escalation, false/missed fall alerts, IRB data request, narrative broken, telemetry gap.' },
        ],
        warnings: [
          'Production Freeze does not mean code freeze — it means all services are running and the IRB pilot cohort can begin. Feature work and bug fixes continue on main. Only emergency infra changes require the full sign-off checklist.',
          'The first 30 days of the pilot are the highest-risk period. Run the device-offline and fall-alert-missed runbooks weekly to confirm the full alert chain is healthy before the pilot formal start date.',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const STACK_SPECS = [
  { label: 'Region',    value: 'us-east-1',       sub: 'AWS · single-region pilot' },
  { label: 'Runtime',   value: 'Python 3.12',      sub: 'Lambda + FastAPI + boto3' },
  { label: 'IaC',       value: 'Terraform 1.14+',  sub: 'OpenTofu for snapsoft modules' },
  { label: 'AI Model',  value: 'Sonnet 4.5',        sub: 'Bedrock · HIPAA-eligible' },
  { label: 'Standard',  value: 'HIPAA §164.514(c)', sub: 'Coded data · IRB protocol' },
];

const CHECKLIST_ITEMS = [
  'Architecture v4 reviewed and approved',
  'IRB protocol documented — no PII in any data path',
  'Subject ID format PILOT-NNNN enforced by admin-cli',
  'Three-layer PII grep passing on all service PRs',
  'Tenant KMS CMK provisioned and aliased',
  'VPC endpoints active: S3, KMS, Secrets Manager, DynamoDB',
  'All DynamoDB tables using SSE-KMS with tenant CMK',
  'All S3 buckets using SSE-KMS with tenant CMK',
  'CloudTrail data events on devices/alerts/daily-updates tables',
  'CloudTrail data events on Parquet S3 bucket',
  'IoT fleet provisioning configured and tested',
  'admin-cli provisioning: PILOT-NNNN format enforced',
  'Fall alert Lambda deployed — synthetic event test passed',
  'SNS subscriptions verified for all facility staff',
  'url-minter Lambda deployed — presigned URL test passed',
  'Dual-write reconciler running — TelemetryDivergence alarm set',
  'At least one facility promoted to parquet_only',
  'Ella Lambda deployed — narrative de-id verified (20+ subjects)',
  'FastAPI Lambda deployed — 12 endpoints smoke-tested',
  'Cognito MFA enabled for all users',
  'Integration tests: 73/73 passing',
  'Production runbooks dry-run complete',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

const OPEN_DECISIONS = [
  'Sonnet 4.6 upgrade — evaluate against de-id system prompt before flipping the model ID in Ella',
  'Multi-region per tenant — currently single-region us-east-1; tenants with residency requirements force this decision',
  'Cross-tenant de-identified research aggregation — separate research account with Glue Data Catalog sharing is the likely pattern',
  'Firehose retirement timeline — 90 days post-migration from parquet_only promotion is tentative, not contractually nailed down',
  'WAL fsync cadence on OSD62x-PM — 5s default; may need 1s depending on flash wear budget',
];

// ── Page component ─────────────────────────────────────────────────────────────

const LS_KEY        = 'ambient-cloud-checklist-v1';
const LS_FREEZE_KEY = 'ambient-cloud-frozen-v1';

export default function CloudEngineeringPage() {
  const [active, setActive]       = useState('arch-review');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [checked, setChecked]     = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag] = useState('All');
  const [prodFrozen, setProdFrozen]   = useState(false);
  const [frozenDate, setFrozenDate]   = useState<string | null>(null);
  const isMounted = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setProdFrozen(true); setFrozenDate(p.date); }
    } catch { /* ignore */ }
    fetch('/api/eng/state').then(r => r.json()).then((all) => {
      const d = all['cloud'];
      if (!d) return;
      if (Array.isArray(d.checked)) { setChecked(new Set(d.checked)); try { localStorage.setItem(LS_KEY, JSON.stringify(d.checked)); } catch { /* ignore */ } }
      if (typeof d.frozen === 'string') { setProdFrozen(true); setFrozenDate(d.frozen); try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date: d.frozen })); } catch { /* ignore */ } }
      else if (d.frozen === null) { setProdFrozen(false); setFrozenDate(null); try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ } }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/eng/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'cloud', checked: [...checked], frozen: prodFrozen ? frozenDate : null }),
      }).catch(() => {});
    }, 800);
  }, [checked, prodFrozen, frozenDate]);

  function toggleChecked(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const navigate = useCallback((dir: 1 | -1) => {
    setActive(prev => {
      const idx = STEPS.findIndex(s => s.id === prev);
      const next = idx + dir;
      return next >= 0 && next < STEPS.length ? STEPS[next].id : prev;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'j') navigate(1);
      if (e.key === 'k') navigate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  function toggleSection(key: string) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }
  function expandAll()  { setCollapsed({}); }
  function collapseAll() {
    const all: Record<string, boolean> = {};
    step.sections.forEach((_, i) => { all[`${active}-${i}`] = true; });
    setCollapsed(prev => ({ ...prev, ...all }));
  }

  const TAGS = ['All', 'Architect', 'Infra', 'Deploy', 'Validate'];
  const visibleSteps = filterTag === 'All' ? STEPS : STEPS.filter(s => s.tag === filterTag);
  void visibleSteps;
  const step = STEPS.find(s => s.id === active)!;
  const stepIdx = STEPS.findIndex(s => s.id === active);
  const doneCount = checked.size;
  const ready = doneCount === CHECKLIST_ITEMS.length;
  const warnCounts: Record<string, number> = {};
  STEPS.forEach(s => {
    warnCounts[s.id] = s.sections.reduce((n, sec) => n + (sec.warnings?.length ?? 0), 0);
  });

  function isSectionOpen(key: string) {
    return focusMode ? true : collapsed[key] !== true;
  }

  function toggleFreeze() {
    if (!ready && !prodFrozen) return;
    setProdFrozen(f => {
      const next = !f;
      if (next) {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setFrozenDate(date);
        try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date })); } catch { /* ignore */ }
      } else {
        setFrozenDate(null);
        try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ }
      }
      return next;
    });
  }

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes pfFlow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes pfGlow {
        0%, 100% { box-shadow: 0 0 0 2px rgba(5,150,105,0.18), 0 2px 8px rgba(5,150,105,0.10); }
        50%       { box-shadow: 0 0 0 5px rgba(5,150,105,0.28), 0 4px 24px rgba(5,150,105,0.20); }
      }
      .pf-ready {
        background: linear-gradient(-45deg, #4338CA, #2563EB, #047857, #10B981, #4338CA);
        background-size: 300% 300%;
        animation: pfFlow 3s ease infinite;
        border: 1.5px solid transparent;
      }
      .pf-ready .pf-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .pf-ready .pf-sub   { color: rgba(255,255,255,0.82); }
      .pf-frozen {
        background: linear-gradient(-45deg, #047857, #059669, #10B981, #34D399, #059669, #047857);
        background-size: 300% 300%;
        animation: pfFlow 4s ease infinite, pfGlow 2.5s ease-in-out infinite;
        border: 1.5px solid transparent;
      }
      .pf-frozen .pf-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .pf-frozen .pf-sub   { color: rgba(255,255,255,0.82); }
    `}} />
    <div className="app" style={{ background: '#F1F3F6', minHeight: '100vh', position: 'relative' }}>

      {/* ── Sidebar ── */}
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid rgba(0,0,0,0.08)', padding: '22px 14px 28px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <Link href="/engineering" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '3px 6px' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6L7.5 10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#9CA3AF' }}>Engineering</span>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '4px 6px', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#6B7280' }}>Cloud</em>
              </span>
            </div>
          </Link>

          {/* Progress bar */}
          <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Progress</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{doneCount}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #047857, #4338CA)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? '1.5px solid #4338CA' : '1px solid #E5E7EB', background: filterTag === tag ? '#EEF2FF' : '#FFFFFF', color: filterTag === tag ? '#4338CA' : '#6B7280', transition: 'all 0.12s' }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PIPELINE_PHASES.map(phase => {
            const phaseSteps = phase.ids
              .map(id => STEPS.find(s => s.id === id)!)
              .filter(s => filterTag === 'All' || s.tag === filterTag);
            if (phaseSteps.length === 0) return null;
            return (
              <div key={phase.label}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', padding: '0 8px', marginBottom: 5 }}>{phase.label}</div>
                {phaseSteps.map(s => {
                  const sc = SC[s.status];
                  const isActive = active === s.id;
                  const warns = warnCounts[s.id] ?? 0;
                  return (
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? '#EEF2FF' : 'transparent', border: isActive ? '1px solid #C7D2FE' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? '#4338CA' : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? '#111827' : '#374151', fontWeight: isActive ? 500 : 400, lineHeight: 1.3 }}>{s.title}</span>
                      {warns > 0 && (
                        <span title={`${warns} warning${warns > 1 ? 's' : ''}`} style={{ fontSize: 9, background: '#FEF9C3', color: '#A16207', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--mono)', flexShrink: 0 }}>⚠{warns}</span>
                      )}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
            <a href="https://github.com/ambientintel/ambientcloud" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientcloud</a>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['j','k'] as const).map(k => (
              <kbd key={k} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, background: '#F9FAFB', border: '1px solid #E5E7EB', fontFamily: 'var(--mono)', fontSize: 11, color: '#6B7280', boxShadow: '0 1px 0 #D1D5DB' }}>{k}</kbd>
            ))}
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>navigate steps</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ padding: '24px 36px 60px', maxWidth: 1200, width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 22, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · Cloud Engineering</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              AWS <em style={{ fontStyle: 'italic', color: '#6B7280' }}>Backend</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 520, lineHeight: 1.6 }}>
              Step-by-step AWS deployment runbook for the fall-detection platform. Architecture → Infrastructure → Services → Production.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientcloud" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientcloud
          </a>
        </div>

        {/* Pipeline strip */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content' }}>
            {PIPELINE_PHASES.map((phase, pi) => (
              <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: pi === 0 ? '0 24px 0 0' : '0 24px', borderRight: '1px solid #E5E7EB' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>{phase.label}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {phase.ids.map((id, si) => {
                    const s = STEPS.find(x => x.id === id)!;
                    const sc = SC[s.status];
                    const isActive = active === id;
                    return (
                      <span key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        {si > 0 && <span style={{ display: 'inline-block', width: 12, height: 1, background: '#E5E7EB', margin: '0 -2px', alignSelf: 'center' }} />}
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? '1.5px solid #4338CA' : `1px solid ${sc.border}`, background: isActive ? '#EEF2FF' : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? '#4338CA' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Production Freeze milestone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 24, height: 1, background: prodFrozen ? 'linear-gradient(90deg,#E5E7EB,#059669)' : ready ? 'linear-gradient(90deg,#E5E7EB,#4338CA)' : '#E5E7EB' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l4 4-4 4" stroke={prodFrozen ? '#059669' : ready ? '#4338CA' : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: prodFrozen ? '#059669' : ready ? '#4338CA' : '#9CA3AF' }}>
                  {prodFrozen ? 'Live ✓' : 'Goal'}
                </div>
                <button
                  onClick={toggleFreeze}
                  className={prodFrozen ? 'pf-frozen' : ready ? 'pf-ready' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 16px', borderRadius: 9,
                    cursor: ready || prodFrozen ? 'pointer' : 'default',
                    ...(!(prodFrozen || ready) && { background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }),
                    transition: 'all 0.25s',
                  }}
                >
                  <svg className="pf-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                    {prodFrozen || ready ? (
                      <>
                        <circle cx="8" cy="8" r="6.5" stroke={prodFrozen ? '#059669' : '#4338CA'} strokeWidth="1.5"/>
                        <path d="M5 8.5L7 10.5L11 6" stroke={prodFrozen ? '#059669' : '#4338CA'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </>
                    ) : (
                      <>
                        <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                        <path d="M8 5v3.5M8 10.5v.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span className="pf-title" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: prodFrozen ? '#059669' : ready ? '#4338CA' : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {prodFrozen ? 'Production Live ✓' : 'Production Freeze'}
                    </span>
                    <span className="pf-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: prodFrozen ? '#059669' : ready ? '#4338CA' : '#9CA3AF' }}>
                      {prodFrozen ? (frozenDate ? `Live ${frozenDate}` : 'IRB pilot active') : ready ? 'Ready — click to go live' : `${Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}% complete`}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stack spec row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 22 }}>
          {STACK_SPECS.map(spec => (
            <div key={spec.label} style={{ padding: '13px 15px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 4 }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 3 }}>{spec.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{spec.sub}</div>
            </div>
          ))}
        </div>

        {/* Main two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 22, alignItems: 'start' }}>

          {/* Step detail */}
          <div>
            {/* Step header */}
            {(() => {
              const sc = SC[step.status];
              const tagStyle = TAG_STYLE[step.tag] || { bg: '#F3F4F6', color: '#374151' };
              return (
                <div style={{ padding: '20px 24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#4338CA', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? '1.5px solid #4338CA' : '1px solid #E5E7EB', background: focusMode ? '#EEF2FF' : '#FFFFFF', color: focusMode ? '#4338CA' : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h2M9 6h2M6 1v2M6 9v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                        {focusMode ? 'Focus ON' : 'Focus'}
                      </button>
                      <button onClick={expandAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Expand all</button>
                      <button onClick={collapseAll} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Collapse all</button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sc.label}</span>
                      </div>
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26, margin: '0 0 8px', color: '#111827', letterSpacing: '-0.01em' }}>{step.title}</h2>
                  <p style={{ margin: 0, color: '#4B5563', fontSize: 13.5, lineHeight: 1.65 }}>{step.summary}</p>
                </div>
              );
            })()}

            {/* Sections */}
            {step.sections.map((sec, si) => {
              const key = `${step.id}-${si}`;
              const isOpen = isSectionOpen(key);
              const hasContent = !!(sec.commands?.length || sec.artifacts?.length || sec.warnings?.length || sec.table || sec.checklist);
              const hasOnlyBody = !hasContent && !!sec.body;
              if (focusMode && hasOnlyBody) return null;

              return (
                <div key={key} style={{ marginBottom: 10, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  {sec.heading && (
                    <button onClick={() => toggleSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: isOpen ? '#FAFBFC' : '#FFFFFF', cursor: 'pointer', border: 0, borderBottom: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none', textAlign: 'left' }}>
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? '#4338CA' : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
                      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>{sec.heading}</span>
                      <span style={{ color: '#9CA3AF', fontSize: 13, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>▾</span>
                    </button>
                  )}
                  {isOpen && (
                    <div style={{ padding: '16px 18px 18px' }}>
                      {!focusMode && sec.body && <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: 13.5, lineHeight: 1.7 }}>{sec.body}</p>}

                      {sec.commands?.map((cmd, ci) => (
                        <div key={ci} style={{ marginBottom: 12 }}>
                          {cmd.label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>$ {cmd.label}</div>}
                          <div style={{ position: 'relative', background: '#1E2433', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '14px 48px 14px 18px' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{cmd.code}</pre>
                            <CopyBtn code={cmd.code} />
                          </div>
                        </div>
                      ))}

                      {sec.artifacts && sec.artifacts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7 }}>Artifacts</div>
                          {sec.artifacts.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4338CA', flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#3730A3', marginBottom: 2 }}>{a.file}</div>
                                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{a.role}</div>
                              </div>
                              {a.size && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{a.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.table && (
                        <div style={{ marginTop: 14, borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC' }}>
                                {sec.table.cols.map((col, ci) => (
                                  <th key={ci} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, ri) => (
                                <tr key={ri} style={{ borderBottom: ri < sec.table!.rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                  {row.map((cell, ci) => (
                                    <td key={ci} style={{ padding: '9px 13px', color: ci === 0 ? '#1E293B' : '#4B5563', fontFamily: ci === 0 ? 'var(--mono)' : 'inherit', fontSize: ci === 0 ? 12 : 13, lineHeight: 1.55, verticalAlign: 'top' }}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {!focusMode && sec.checklist && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {sec.checklist.map((item, ii) => (
                            <div key={ii} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 7 }}>
                              <span style={{ color: '#4338CA', fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
                              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.55 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.warnings?.map((w, wi) => (
                        <div key={wi} style={{ display: 'flex', gap: 10, padding: '10px 13px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, marginTop: 9 }}>
                          <span style={{ color: '#D97706', fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠</span>
                          <p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Prev / Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {stepIdx > 0
                ? <button onClick={() => setActive(STEPS[stepIdx - 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    ← <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>k</kbd> {STEPS[stepIdx - 1].title}
                  </button>
                : <div />}
              {stepIdx < STEPS.length - 1
                ? <button onClick={() => setActive(STEPS[stepIdx + 1].id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF', color: '#374151', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {STEPS[stepIdx + 1].title} <kbd style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#9CA3AF', background: 'none', border: 0, padding: 0 }}>j</kbd> →
                  </button>
                : <div />}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ position: 'sticky', top: 24 }}>

            {/* Interactive checklist */}
            <div style={{ padding: '16px 16px 14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Production Checklist</div>
                <button onClick={() => { setChecked(new Set(CHECKLIST_DONE)); try { localStorage.setItem(LS_KEY, JSON.stringify([...CHECKLIST_DONE])); } catch { /* ignore */ } }} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checked.has(i);
                  return (
                    <button key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: done ? 'none' : '1.5px solid #D1D5DB', background: done ? '#059669' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 11.5, color: done ? '#374151' : '#9CA3AF', lineHeight: 1.45, textDecoration: done ? 'line-through' : 'none', textDecorationColor: '#D1D5DB' }}>{item}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 11, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Complete</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#059669', fontWeight: 600 }}>{Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#E5E7EB' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #047857, #4338CA)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#D97706', marginBottom: 11 }}>Open Decisions</div>
              {OPEN_DECISIONS.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#D97706', opacity: 0.7, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
