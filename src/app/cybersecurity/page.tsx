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
  'Plan':     { bg: '#EEF2FF', color: '#4338CA' },
  'Build':    { bg: '#ECFDF5', color: '#047857' },
  'Deploy':   { bg: '#FFFBEB', color: '#B45309' },
  'Validate': { bg: '#FEF2F2', color: '#DC2626' },
};

const PIPELINE_PHASES = [
  { label: 'Plan',     ids: ['arch-review', 'iam-zerotrust'] },
  { label: 'Build',    ids: ['security-alerts', 'etl-pipeline', 'state-backend'] },
  { label: 'Deploy',   ids: ['gitops-cicd', 'env-deploy'] },
  { label: 'Validate', ids: ['e2e-validation'] },
];

// ── localStorage keys ──────────────────────────────────────────────────────────

const LS_KEY       = 'ambient-cyber-checklist-v1';
const LS_FREEZE_KEY = 'ambient-cyber-frozen-v1';

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'arch-review', phase: '01', title: 'Architecture Review', status: 'done', tag: 'Plan', time: '~1 day',
    summary: 'Event-driven AWS Security Hub alerting pipeline designed and approved. Three-module Terraform architecture: security-alerts (EventBridge → Lambda → Secrets Manager), ETL (Glue + PySpark radar merge), and deploy-role (OIDC trust). Serverless-only — no EC2, no ECS, no NAT gateways.',
    sections: [
      {
        heading: 'Pipeline components',
        table: {
          cols: ['Component', 'AWS Service', 'Purpose'],
          rows: [
            ['Event router',    'Amazon EventBridge',       'Filter Security Hub findings: FAILED + ACTIVE + CRITICAL/HIGH + NEW workflow status'],
            ['Compute',         'AWS Lambda (Python 3.12)', 'Secret retrieval + payload transform + Google Chat delivery + write-back'],
            ['Secret store',    'AWS Secrets Manager',      'Zero-knowledge webhook URL — value stored manually in Console, never in Git'],
            ['Access control',  'IAM (OIDC + least-priv)',  'GitHubActions-Terraform-Role + Lambda execution role, PHI bucket explicitly denied'],
            ['CSPM source',     'AWS Security Hub',         'Aggregates AWS Config compliance findings; BatchUpdateFindings API for write-back'],
            ['Data processing', 'AWS Glue + PySpark',       'Radar data synchronization: radar_A2/B2/C2 → unified Parquet, sorted by timestamp'],
            ['State backend',   'Amazon S3 (native lock)',  'Terraform remote state with use_lockfile = true (Terraform v1.10+, no DynamoDB needed)'],
          ],
        },
      },
      {
        heading: 'Security finding lifecycle',
        table: {
          cols: ['Stage', 'Actor', 'Action', 'Latency'],
          rows: [
            ['Detection',    'AWS Config',     'Evaluate resource compliance against managed rules',                      '~5–15 min'],
            ['Ingestion',    'Security Hub',   'Import finding from AWS Config; assign severity label',                  'Seconds'],
            ['Routing',      'EventBridge',    'Match rule: FAILED + ACTIVE + CRITICAL/HIGH + Workflow=NEW',             '< 1 s'],
            ['Processing',   'Lambda',         'Fetch webhook secret + format Google Chat card + POST to webhook',       '~2–3 s'],
            ['Notification', 'Google Chat',    'Card delivered to security channel',                                     '< 1 s'],
            ['Deduplication','Security Hub',   'BatchUpdateFindings sets Workflow.Status = NOTIFIED — no re-fire',       'Atomic'],
          ],
        },
      },
      {
        heading: 'Architecture artifacts',
        artifacts: [
          { file: 'README.md',                              role: 'Authoritative system overview — pipeline design, architecture components, OIDC pattern, ETL logic, and bootstrap instructions.' },
          { file: 'modules/security-alerts/main.tf',        role: 'EventBridge rule + Lambda + Secrets Manager + IAM execution role — the complete alerting pipeline.' },
          { file: 'modules/ETL/main.tf',                    role: 'Glue IAM role + S3 policy + script upload + Glue job definition for radar data synchronization.' },
          { file: 'modules/deploy-role/main.tf',            role: 'GitHubActions-Terraform-Role with OIDC trust policy and ambientcyber-terraform-deploy inline policy.' },
        ],
      },
      {
        warnings: [
          'Alert fatigue: without the Workflow.Status = NEW filter in the EventBridge event pattern, every re-import of the same finding re-fires the Lambda. The BatchUpdateFindings write-back (NEW → NOTIFIED) is the deduplication mechanism — never remove it.',
          'The ~15-minute detection latency is the AWS Config evaluation cadence, not a Lambda or EventBridge issue. Periodic Config rules evaluate every 15 minutes by default. Change-triggered rules evaluate faster but are not available for all security controls.',
        ],
      },
    ],
  },
  {
    id: 'iam-zerotrust', phase: '02', title: 'IAM & Zero-Trust', status: 'done', tag: 'Plan', time: '~2 hrs',
    summary: 'Two IAM roles implementing least privilege. GitHubActions-Terraform-Role uses OIDC (no stored AWS keys) gated to ambientintel/ambientcyber main branch. Lambda execution role granted only CloudWatch Logs write, Secrets Manager read for one specific secret, and Security Hub BatchUpdateFindings. PHI S3 bucket explicitly denied in all roles.',
    sections: [
      {
        heading: 'OIDC trust verification',
        commands: [
          { label: 'verify OIDC provider exists', code: 'aws iam list-open-id-connect-providers \\\n  --query "OpenIDConnectProviderList[*].Arn"\n# Expected: contains arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com' },
          { label: 'inspect GitHubActions-Terraform-Role trust policy', code: 'aws iam get-role \\\n  --role-name GitHubActions-Terraform-Role \\\n  --query "Role.AssumeRolePolicyDocument"\n# Verify: Condition StringLike on\n# token.actions.githubusercontent.com:sub =\n#   "repo:ambientintel/ambientcyber:ref:refs/heads/main"' },
          { label: 'verify Lambda execution role permissions', code: 'aws iam get-role-policy \\\n  --role-name securityhub_to_gchat_role_dev \\\n  --policy-name lambda_secrets_read_policy_dev\n# Expected: secretsmanager:GetSecretValue on specific ARN\n# + securityhub:BatchUpdateFindings on *\n# + CloudWatch Logs via AWSLambdaBasicExecutionRole attachment' },
        ],
      },
      {
        heading: 'Deploy role inline policy — ambientcyber-terraform-deploy',
        table: {
          cols: ['Resource pattern', 'Actions granted', 'Scope'],
          rows: [
            ['S3 state bucket',                       's3:GetObject, PutObject, DeleteObject, ListBucket',                                            'Terraform state read/write'],
            ['Lambda SecurityHub-To-GoogleChat-*',    'lambda:CreateFunction, UpdateFunctionCode, GetFunction, PublishLayerVersion, CreateAlias',     'Security alerts Lambda lifecycle'],
            ['EventBridge sh-findings-to-gchat-*',    'events:PutRule, PutTargets, DescribeRule, ListTargetsByRule',                                  'EventBridge rule management'],
            ['Secret google_chat_webhook_url_*',      'secretsmanager:CreateSecret, DeleteSecret, DescribeSecret, TagResource',                      'Secrets Manager container CRUD (not GetSecretValue)'],
            ['Glue job radar-timeline-merge',         'glue:CreateJob, UpdateJob, GetJob, DeleteJob, StartJobRun',                                   'ETL job lifecycle'],
            ['IAM securityhub_to_gchat_role_*, radar-data-glue-etl-role', 'iam:CreateRole, AttachRolePolicy, PutRolePolicy, GetRole, PassRole',       'Lambda + Glue execution role management'],
            ['PHI S3 bucket (explicit Deny)',         's3:* — overrides all grants',                                                                  'Prevents any PHI data access from CI/CD'],
          ],
        },
      },
      {
        heading: 'Lambda execution policy',
        table: {
          cols: ['Service', 'Actions', 'Resource'],
          rows: [
            ['CloudWatch Logs',  'CreateLogGroup, CreateLogStream, PutLogEvents',   'arn:aws:logs:*:*:* (via AWSLambdaBasicExecutionRole managed policy)'],
            ['Secrets Manager',  'GetSecretValue',                                  'arn of google_chat_webhook_url_{env} only — exact ARN, not wildcard'],
            ['Security Hub',     'BatchUpdateFindings',                             '* — AWS does not support resource-level scoping for this API (documented AWS constraint)'],
          ],
        },
      },
      {
        heading: 'Zero-trust checklist',
        checklist: [
          'IAM OIDC provider for token.actions.githubusercontent.com exists in account',
          'Trust condition uses StringLike (not StringEquals) on :sub claim with exact repo + branch path',
          'No wildcard resource grants — all Terraform-managed resources scoped to ambientcyber name patterns',
          'PHI S3 bucket explicit Deny statement present — confirmed via get-role-policy output',
          'Lambda execution role does NOT have AmazonSecurityHubFullAccess — inline policy only with BatchUpdateFindings',
          'No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY stored in GitHub Actions secrets',
        ],
      },
      {
        warnings: [
          'securityhub:BatchUpdateFindings cannot be scoped to a specific finding ARN — Resource: "*" is an AWS API constraint, not a least-privilege gap. This is documented behavior and acceptable given the narrow action scope.',
          'The OIDC :sub condition must use StringLike for wildcard matching (e.g., to allow PRs from feature branches for plan-only jobs). For the apply job, always restrict to :ref:refs/heads/main. A common mistake is using StringEquals with a wildcard — AWS condition keys do not treat wildcards the same way in all operators.',
        ],
      },
    ],
  },
  {
    id: 'security-alerts', phase: '03', title: 'Security Alerts Module', status: 'done', tag: 'Build', time: '~1 day',
    summary: 'modules/security-alerts/ provisions the complete EventBridge → Lambda → Secrets Manager pipeline. Lambda is Python 3.12, packaged automatically by Terraform\'s archive_file data source from the src/ directory. EventBridge event pattern is the narrowest filter that captures all actionable findings: source + detail-type + FAILED + ACTIVE + CRITICAL/HIGH + NEW.',
    sections: [
      {
        heading: 'EventBridge event pattern',
        commands: [
          { label: 'event filter (strict CSPM scope)', code: '{\n  "source": ["aws.securityhub"],\n  "detail-type": ["Security Hub Findings - Imported"],\n  "detail": {\n    "findings": {\n      "Compliance": { "Status": ["FAILED"] },\n      "RecordState": ["ACTIVE"],\n      "Severity": { "Label": ["CRITICAL", "HIGH"] },\n      "Workflow": { "Status": ["NEW"] }\n    }\n  }\n}' },
        ],
      },
      {
        heading: 'Lambda operation sequence',
        table: {
          cols: ['Step', 'Operation', 'AWS API / Method', 'Notes'],
          rows: [
            ['1', 'Secret retrieval',  'secretsmanager:GetSecretValue',  'Runtime fetch — webhook URL never in code, env vars, or Terraform state'],
            ['2', 'Payload parse',     '—',                              'Extract: Title, Description, Severity.Label, AwsAccountId, Region, Resources[0].Id'],
            ['3', 'Card format',       '—',                              'Google Chat card with color-coded severity: CRITICAL=RED, HIGH=ORANGE'],
            ['4', 'HTTP delivery',     'urllib / requests POST',         'POST to Google Chat Space webhook URL retrieved in step 1'],
            ['5', 'Write-back',        'securityhub:BatchUpdateFindings','Sets Workflow.Status = NOTIFIED — prevents duplicate alerts on next import event'],
          ],
        },
      },
      {
        heading: 'Deploy and verify',
        commands: [
          { label: 'init + plan', code: 'cd environments/dev\nterraform init\nterraform plan \\\n  -var="aws_region=us-east-1" \\\n  -var="environment=dev"\n# Review: Lambda + EventBridge rule + Secrets Manager secret + IAM roles' },
          { label: 'apply', code: 'cd environments/dev\nterraform apply -auto-approve \\\n  -var="aws_region=us-east-1" \\\n  -var="environment=dev"' },
          { label: 'verify Lambda deployed', code: 'aws lambda get-function \\\n  --function-name SecurityHub-To-GoogleChat-dev \\\n  --query "{Runtime:Configuration.Runtime,Timeout:Configuration.Timeout,State:Configuration.State}"\n# Expected: Runtime=python3.12, Timeout=15, State=Active' },
          { label: 'verify EventBridge rule enabled', code: 'aws events describe-rule \\\n  --name sh-findings-to-gchat-dev \\\n  --query "{State:State,EventPattern:EventPattern}"\n# Expected: State=ENABLED, EventPattern matches security-alerts filter' },
          { label: 'verify Secrets Manager container', code: 'aws secretsmanager describe-secret \\\n  --secret-id google_chat_webhook_url_dev \\\n  --query "{Name:Name,ARN:ARN}"\n# Value must be set manually in Console (see warnings)' },
        ],
      },
      {
        heading: 'Source artifacts',
        artifacts: [
          { file: 'modules/security-alerts/main.tf',           role: 'Terraform: archive_file packaging, IAM roles, Secrets Manager container, Lambda function, EventBridge rule + target, invoke permission.' },
          { file: 'modules/security-alerts/src/lambda_function.py', role: 'Python 3.12 handler: GetSecretValue → parse finding JSON → format Google Chat card → POST webhook → BatchUpdateFindings write-back.' },
          { file: 'modules/security-alerts/variables.tf',      role: 'Input variables: aws_region, environment — consumed by resource names and Lambda environment variables.' },
        ],
      },
      {
        warnings: [
          'The Secrets Manager secret container is provisioned by Terraform, but the webhook URL value MUST be set manually in the AWS Console after apply. Navigate to Secrets Manager → google_chat_webhook_url_dev → Store a new secret value (plaintext). Terraform does not store credentials — this is the intentional zero-knowledge design.',
          'Lambda timeout is 15 seconds. If the Google Chat webhook is slow or the write-back call stalls, the Lambda may timeout before completing. Monitor CloudWatch for Duration > 14000ms log entries. If this occurs consistently, increase the timeout in modules/security-alerts/main.tf.',
        ],
      },
    ],
  },
  {
    id: 'etl-pipeline', phase: '04', title: 'ETL Pipeline Module', status: 'done', tag: 'Build', time: '~1 day',
    summary: 'modules/ETL/ provisions a Glue PySpark job that synchronizes three radar sensor streams. Source: radar_A2, radar_B2, radar_C2 Parquet files in S3. Output: unified single-partition Parquet sorted by timestamp with SensorSource provenance column. Deployed in us-east-2 against bucket ambient-test-parquet-files-741448953538-us-east-2-an.',
    sections: [
      {
        heading: 'ETL pipeline logic',
        table: {
          cols: ['Stage', 'PySpark operation', 'Output'],
          rows: [
            ['Ingestion',     'spark.read.parquet(s3://…/radar_A2), radar_B2, radar_C2',           '3 DataFrames'],
            ['Normalization', 'df.withColumn("timestamp", col("timestamp").cast(DoubleType()))',   'Uniform timestamp type (float64)'],
            ['Provenance',    'df.withColumn("SensorSource", lit("radar_A2")) × 3',                'SensorSource column added per stream'],
            ['Union',         'df_A.union(df_B).union(df_C)',                                      'Single merged DataFrame'],
            ['Sort',          'df.orderBy("timestamp")',                                            'Chronologically ordered records'],
            ['Output',        'df.coalesce(1).write.parquet(s3://…/merged/)',                      'Single-partition Parquet file'],
          ],
        },
      },
      {
        heading: 'Glue job management',
        commands: [
          { label: 'apply ETL module (via environments/dev)', code: 'cd environments/dev\nterraform apply -auto-approve \\\n  -var="aws_region=us-east-1" \\\n  -var="environment=dev"\n# ETL module deploys to us-east-2 (hardcoded in modules/ETL/main.tf)' },
          { label: 'trigger Glue job manually', code: 'aws glue start-job-run \\\n  --job-name radar-timeline-merge \\\n  --region us-east-2\n# Returns: JobRunId' },
          { label: 'check job run status', code: 'aws glue get-job-runs \\\n  --job-name radar-timeline-merge \\\n  --region us-east-2 \\\n  --max-results 5 \\\n  --query "JobRuns[*].{RunId:Id,Status:JobRunState,Started:StartedOn}"\n# Expected: JobRunState=SUCCEEDED for latest run' },
          { label: 'verify merged Parquet output', code: 'aws s3 ls \\\n  s3://ambient-test-parquet-files-741448953538-us-east-2-an/merged/ \\\n  --region us-east-2\n# Expected: single .parquet file with recent timestamp' },
        ],
      },
      {
        heading: 'Source artifacts',
        artifacts: [
          { file: 'modules/ETL/main.tf',               role: 'Terraform: Glue IAM execution role + AWSGlueServiceRole attachment + S3 access policy + script S3 upload + Glue job definition.' },
          { file: 'modules/ETL/src/glue_etl_radar.py', role: 'PySpark ETL: read radar_A2/B2/C2 → cast timestamp → add SensorSource → union → orderBy → coalesce(1) → write Parquet.' },
        ],
      },
      {
        warnings: [
          'The ETL module deploys to us-east-2 with a hardcoded bucket name (ambient-test-parquet-files-741448953538-us-east-2-an). The bucket name embeds the AWS account ID and region. If the account or region changes, update locals.bucket_name in modules/ETL/main.tf before running terraform apply.',
          'coalesce(1) forces a single output partition. This is efficient for small radar datasets but becomes a bottleneck at scale. Monitor the merged Parquet file size — if it consistently exceeds ~200 MB, switch to repartition(N) in the PySpark script to avoid shuffle bottlenecks.',
        ],
      },
    ],
  },
  {
    id: 'state-backend', phase: '05', title: 'Terraform State Backend', status: 'done', tag: 'Build', time: '~2 hrs',
    summary: 'Terraform remote state stored in S3 with use_lockfile = true — Terraform v1.10+ native state locking. No DynamoDB lock table needed. Versioning enabled on state bucket for point-in-time rollback. The deploy role (GitHubActions-Terraform-Role) pre-existed in AWS and was adopted into Terraform state via import blocks in environments/dev/imports.tf.',
    sections: [
      {
        heading: 'Backend configuration',
        commands: [
          { label: 'environments/dev/backend.tf', code: 'terraform {\n  backend "s3" {\n    bucket       = "<your-state-bucket>"\n    key          = "terraform/dev/terraform.tfstate"\n    region       = "us-east-1"\n    use_lockfile = true   # Terraform v1.10+ — no DynamoDB table\n  }\n}' },
          { label: 'list all state resources', code: 'cd environments/dev\nterraform state list\n# Expected:\n# module.deploy_role.aws_iam_role.terraform\n# module.deploy_role.aws_iam_role_policy.terraform_deploy\n# module.security_alerts.aws_iam_role.iam_for_lambda\n# module.security_alerts.aws_lambda_function.securityhub_alerts\n# module.security_alerts.aws_cloudwatch_event_rule.sh_rule\n# module.security_alerts.aws_secretsmanager_secret.google_chat_webhook\n# module.ETL.aws_iam_role.glue_job_role\n# module.ETL.aws_glue_job.radar_synchronization_job\n# ... (and supporting IAM / S3 resources)' },
          { label: 'show deploy role state (import verification)', code: 'cd environments/dev\nterraform state show module.deploy_role.aws_iam_role.terraform\n# Confirms import succeeded — role attributes match AWS Console' },
        ],
      },
      {
        heading: 'State isolation',
        table: {
          cols: ['Scope', 'State bucket key', 'Lock mechanism'],
          rows: [
            ['environments/dev (all modules)',  'terraform/dev/terraform.tfstate',         'use_lockfile = true (S3 native, Terraform v1.10+)'],
            ['modules/deploy-role (standalone)', 'terraform/deploy-role/terraform.tfstate', 'use_lockfile = true (if using separate workspace)'],
          ],
        },
      },
      {
        heading: 'State management checklist',
        checklist: [
          'S3 state bucket created with versioning enabled — supports point-in-time rollback',
          'State bucket has server-side encryption enabled (SSE-S3 or SSE-KMS)',
          'use_lockfile = true set in all backend.tf files (requires Terraform >= 1.10 in CI/CD)',
          'Deploy role imported via imports.tf — terraform state list shows module.deploy_role resources',
          'No DynamoDB lock table provisioned — native S3 locking eliminates the dependency',
          'State bucket is NOT in the PHI deny list in the deploy role (required for CI/CD writes)',
        ],
      },
      {
        heading: 'Import blocks (environments/dev/imports.tf)',
        artifacts: [
          { file: 'environments/dev/imports.tf', role: 'One-time import blocks for GitHubActions-Terraform-Role and ambientcyber-terraform-deploy inline policy. Safe to leave in place — subsequent applies no-op the import once state is aligned.' },
        ],
        warnings: [
          'use_lockfile requires Terraform v1.10 or later. The GitHub Actions workflow must pin the Terraform version to >=1.10 in the setup-terraform action step. Downgrading will fail silently on the lock mechanism — state corruption is possible under concurrent runs.',
          'The deploy role was pre-existing before Terraform adoption. If terraform destroy runs in environments/dev/, the import blocks will attempt to recreate the role — but any manual trust policy edits made in the Console after import will be lost. Always manage the role exclusively via Terraform from this point forward.',
        ],
      },
    ],
  },
  {
    id: 'gitops-cicd', phase: '06', title: 'GitOps CI/CD', status: 'done', tag: 'Deploy', time: '~1 day',
    summary: 'GitHub Actions OIDC pipeline: no AWS access keys stored anywhere. The OIDC trust relationship verifies the GitHub identity token — only repo:ambientintel/ambientcyber:ref:refs/heads/main can assume the deploy role. Plan runs on every PR (non-blocking); Apply runs on push to main after plan succeeds.',
    sections: [
      {
        heading: 'Workflow job matrix',
        table: {
          cols: ['Job', 'Trigger', 'What it does'],
          rows: [
            ['terraform-plan',  'Pull request',              'terraform init → terraform plan; posts plan diff to PR summary as a job annotation. Non-blocking — informs reviewers.'],
            ['terraform-apply', 'Push to main (needs plan)', 'terraform init → terraform apply -auto-approve; confirms OIDC token exchange with AWS before proceeding.'],
          ],
        },
      },
      {
        heading: 'Required repository settings',
        table: {
          cols: ['Setting', 'Value', 'Where to set'],
          rows: [
            ['AWS_ACCOUNT_ID',      '741448953538',                                                           'Actions → Variables'],
            ['AWS_REGION',          'us-east-1',                                                              'Actions → Variables'],
            ['AWS_DEPLOY_ROLE_ARN', 'arn:aws:iam::741448953538:role/GitHubActions-Terraform-Role',            'Actions → Variables'],
            ['ENVIRONMENT',         'dev',                                                                     'Actions → Variables'],
          ],
        },
      },
      {
        heading: 'Verify CI/CD pipeline',
        commands: [
          { label: 'check OIDC provider in account', code: 'aws iam list-open-id-connect-providers \\\n  --query "OpenIDConnectProviderList[*].Arn" \\\n  --output text\n# Expected: contains token.actions.githubusercontent.com' },
          { label: 'list recent workflow runs', code: 'gh run list \\\n  --repo ambientintel/ambientcyber \\\n  --limit 10\n# Shows status of plan + apply runs' },
          { label: 'view latest apply run logs', code: 'gh run view \\\n  --repo ambientintel/ambientcyber \\\n  $(gh run list --repo ambientintel/ambientcyber --json databaseId --jq ".[0].databaseId") \\\n  --log' },
          { label: 'manually trigger workflow (plan only)', code: 'gh workflow run terraform.yml \\\n  --repo ambientintel/ambientcyber \\\n  --ref main' },
        ],
      },
      {
        heading: 'Workflow source',
        artifacts: [
          { file: '.github/workflows/terraform.yml', role: 'OIDC-authenticated GitHub Actions workflow: plan on PR + apply on push to main. Pins Terraform version for use_lockfile compatibility.' },
        ],
      },
      {
        warnings: [
          'Never store AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in GitHub Actions secrets. If these keys exist anywhere in the repo (secrets, env vars, workflow files), rotate them immediately in the AWS Console and audit CloudTrail for unauthorized usage during the exposure window.',
          'The OIDC trust condition must use StringLike, not StringEquals, if you need the plan job to run from feature branch PRs (the :sub value for a PR from a fork differs from the main branch path). For apply, always pin to :ref:refs/heads/main. Verify the condition by inspecting the trust policy after any changes.',
        ],
      },
    ],
  },
  {
    id: 'env-deploy', phase: '07', title: 'Environment Deployment', status: 'done', tag: 'Deploy', time: '~2 hrs',
    summary: 'environments/dev/ is the root Terraform workspace that wires all three modules: deploy-role, security-alerts, and ETL. A single terraform apply from this directory provisions the complete pipeline. The deploy role was adopted into state via import blocks — no manual IAM changes needed after first apply.',
    sections: [
      {
        heading: 'Full deployment sequence',
        commands: [
          { label: 'clone and authenticate', code: 'git clone https://github.com/ambientintel/ambientcyber\ncd ambientcyber\n\n# Authenticate to AWS (SSO or environment vars)\naws sso login  # or: export AWS_PROFILE=ambient\naws sts get-caller-identity\n# Expected: Account=741448953538' },
          { label: 'init + plan (environments/dev)', code: 'cd environments/dev\nterraform init\n\nterraform plan \\\n  -var="aws_region=us-east-1" \\\n  -var="environment=dev"\n\n# Review all planned resources before applying' },
          { label: 'apply', code: 'cd environments/dev\nterraform apply -auto-approve \\\n  -var="aws_region=us-east-1" \\\n  -var="environment=dev"\n\n# Deploys:\n# - module.deploy_role      (GitHubActions-Terraform-Role)\n# - module.security_alerts  (EventBridge + Lambda + Secrets Manager)\n# - module.ETL              (Glue job in us-east-2)' },
          { label: 'verify all resources post-apply', code: '# Lambda\naws lambda list-functions \\\n  --query "Functions[?starts_with(FunctionName,\'SecurityHub\')].[FunctionName,Runtime,State]"\n\n# EventBridge rule\naws events list-rules \\\n  --query "Rules[?starts_with(Name,\'sh-findings\')].[Name,State]"\n\n# Secrets Manager\naws secretsmanager list-secrets \\\n  --query "SecretList[?starts_with(Name,\'google_chat\')].[Name,ARN]"\n\n# Glue (us-east-2)\naws glue get-job --job-name radar-timeline-merge --region us-east-2 \\\n  --query "Job.{Name:Name,State:JobMode,Workers:NumberOfWorkers}"' },
        ],
      },
      {
        heading: 'Provisioned resource inventory',
        table: {
          cols: ['Resource type', 'Name (dev)', 'Module'],
          rows: [
            ['aws_iam_role',               'GitHubActions-Terraform-Role',         'deploy-role (imported)'],
            ['aws_iam_role_policy',        'ambientcyber-terraform-deploy',         'deploy-role (imported)'],
            ['aws_iam_role',               'securityhub_to_gchat_role_dev',         'security-alerts'],
            ['aws_lambda_function',        'SecurityHub-To-GoogleChat-dev',         'security-alerts'],
            ['aws_cloudwatch_event_rule',  'sh-findings-to-gchat-dev',              'security-alerts'],
            ['aws_secretsmanager_secret',  'google_chat_webhook_url_dev',           'security-alerts'],
            ['aws_lambda_permission',      'AllowExecutionFromCloudWatch',          'security-alerts'],
            ['aws_iam_role',               'radar-data-glue-etl-role',              'ETL'],
            ['aws_glue_job',               'radar-timeline-merge',                  'ETL'],
            ['aws_s3_object',              'scripts/glue_etl_radar.py',             'ETL'],
          ],
        },
      },
      {
        heading: 'Environment files',
        artifacts: [
          { file: 'environments/dev/main.tf',      role: 'Root module: wires deploy-role, security-alerts, and ETL submodules with shared aws_region and environment variables.' },
          { file: 'environments/dev/imports.tf',   role: 'Import blocks for GitHubActions-Terraform-Role and ambientcyber-terraform-deploy. Safe to leave after import — subsequent applies no-op.' },
          { file: 'environments/dev/backend.tf',   role: 'S3 remote state with use_lockfile = true. Update bucket name for your account before first init.' },
        ],
      },
      {
        warnings: [
          'terraform apply in environments/dev/ also triggers module.ETL which deploys to us-east-2 (hardcoded in modules/ETL/main.tf). The root provider uses us-east-1 but the ETL module overrides the region. Ensure the AWS credentials have permissions in both regions.',
          'The deploy role trust policy allows only the main branch. If you need to test infrastructure from a feature branch, add a temporary condition to the trust policy — or use a separate test role. Never loosen the main-branch restriction in the production deploy role.',
        ],
      },
    ],
  },
  {
    id: 'e2e-validation', phase: '08', title: 'End-to-End Validation', status: 'pending', tag: 'Validate', time: '~30 min',
    summary: 'Live end-to-end test: create an EC2 Security Group with port 22 open to 0.0.0.0/0. AWS Config evaluates → Security Hub ingests → EventBridge routes → Lambda fires → Google Chat card received. Verify Workflow.Status = NOTIFIED in Security Hub. Delete the test SG immediately after verification.',
    sections: [
      {
        heading: 'Expected finding timeline',
        table: {
          cols: ['Checkpoint', 'Expected time', 'How to verify'],
          rows: [
            ['SG created (port 22 open)',       't = 0',          'aws ec2 describe-security-groups by GroupId'],
            ['AWS Config evaluates resource',   't + 5–15 min',   'aws configservice get-compliance-details-by-resource'],
            ['Security Hub imports finding',    't + ~15 min',    'aws securityhub get-findings (Compliance.Status=FAILED, Workflow.Status=NEW)'],
            ['EventBridge routes to Lambda',    't + ~15 min',    'CloudWatch Lambda logs (/aws/lambda/SecurityHub-To-GoogleChat-dev)'],
            ['Google Chat card delivered',      't + ~15–16 min', 'Visual: card appears in security channel'],
            ['Finding status = NOTIFIED',       't + ~15–16 min', 'aws securityhub get-findings (Workflow.Status=NOTIFIED)'],
          ],
        },
      },
      {
        heading: 'Test procedure',
        commands: [
          { label: '1. create test security group', code: 'SG_ID=$(aws ec2 create-security-group \\\n  --group-name test-port22-AUDIT \\\n  --description "Audit validation test — delete after verification" \\\n  --query GroupId \\\n  --output text)\necho "Created: $SG_ID"' },
          { label: '2. open port 22 (triggers Config evaluation)', code: 'aws ec2 authorize-security-group-ingress \\\n  --group-id $SG_ID \\\n  --protocol tcp \\\n  --port 22 \\\n  --cidr 0.0.0.0/0\n# AWS Config will flag this within ~5–15 minutes' },
          { label: '3. watch for NEW finding (poll every 2 min)', code: 'aws securityhub get-findings \\\n  --filters \'{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],"WorkflowStatus":[{"Value":"NEW","Comparison":"EQUALS"}],"SeverityLabel":[{"Value":"HIGH","Comparison":"EQUALS"},{"Value":"CRITICAL","Comparison":"EQUALS"}]}\' \\\n  --query \'Findings[0].{Title:Title,Severity:Severity.Label,Workflow:Workflow.Status,Resource:Resources[0].Id}\'\n# Expected: finding with Title containing "Restrict SSH"' },
          { label: '4. check Lambda executed successfully', code: 'aws logs tail \\\n  /aws/lambda/SecurityHub-To-GoogleChat-dev \\\n  --since 30m\n# Look for: successful HTTP 200 to Google Chat + BatchUpdateFindings call' },
          { label: '5. verify write-back (NOTIFIED)', code: 'aws securityhub get-findings \\\n  --filters \'{"WorkflowStatus":[{"Value":"NOTIFIED","Comparison":"EQUALS"}]}\' \\\n  --query \'Findings[:3].{Title:Title,Workflow:Workflow.Status,Updated:UpdatedAt}\'\n# Expected: finding with Status=NOTIFIED and recent UpdatedAt' },
          { label: '6. CLEANUP — delete test SG', code: 'aws ec2 delete-security-group --group-id $SG_ID\necho "Test SG deleted: $SG_ID"\n# Confirm deletion\naws ec2 describe-security-groups \\\n  --group-ids $SG_ID 2>&1 | grep "InvalidGroup"' },
        ],
      },
      {
        heading: 'Troubleshooting',
        table: {
          cols: ['Symptom', 'Likely cause', 'Fix'],
          rows: [
            ['No finding after 30 min',         'Security Hub not enabled in target region, or Config not recording',             'aws securityhub describe-hub; aws configservice describe-configuration-recorders'],
            ['Finding exists but Lambda not fired', 'EventBridge rule disabled or wrong region', 'aws events describe-rule --name sh-findings-to-gchat-dev → check State=ENABLED'],
            ['Lambda fired but no Google Chat card', 'Webhook URL not set in Secrets Manager',    'Console → Secrets Manager → google_chat_webhook_url_dev → store plaintext URL'],
            ['Card received but finding stays NEW', 'BatchUpdateFindings IAM error',              'aws logs tail Lambda logs — look for AccessDeniedException on securityhub:BatchUpdateFindings'],
          ],
        },
      },
      {
        warnings: [
          'The test SG (test-port22-AUDIT) MUST be deleted immediately after validation. An open port 22 Security Group left in the account will generate repeated Security Hub findings and may trigger additional Lambda executions. Run the cleanup command (step 6) before closing the terminal session.',
          'AWS Config evaluation cadence is ~5–15 minutes for change-triggered rules and up to every 24 hours for periodic rules. The "Restricted SSH" control is typically change-triggered, so findings should appear within 15 minutes. If no alert appears after 30 minutes, check Config recorder status first.',
        ],
      },
    ],
  },
];

// ── Static data ────────────────────────────────────────────────────────────────

const STACK_SPECS = [
  { label: 'Region',    value: 'us-east-1 / us-east-2',  sub: 'Security alerts · ETL pipeline' },
  { label: 'Runtime',   value: 'Python 3.12',              sub: 'Lambda + PySpark (Glue)' },
  { label: 'IaC',       value: 'Terraform v1.10+',         sub: 'S3 native locking · no DynamoDB' },
  { label: 'Auth',      value: 'GitHub OIDC',              sub: 'No stored AWS keys · main-branch gated' },
  { label: 'Standard',  value: 'Zero-trust / Least-priv',  sub: 'PHI bucket denied · scoped resource ARNs' },
];

const CHECKLIST_ITEMS = [
  'Security Hub enabled in the target AWS account and region',
  'AWS Config active and recording in the same region as Security Hub',
  'S3 state bucket created with versioning enabled and SSE',
  'IAM OIDC provider for token.actions.githubusercontent.com configured in account',
  'GitHubActions-Terraform-Role deployed with strict main-branch OIDC trust condition',
  'PHI S3 bucket explicit Deny statement confirmed in ambientcyber-terraform-deploy policy',
  'Deploy role least-privilege verified — no admin or wildcard service grants outside scoped patterns',
  'Lambda execution role: only CloudWatch Logs + GetSecretValue (scoped ARN) + BatchUpdateFindings',
  'modules/security-alerts/ — all Terraform resources provisioned and in state',
  'Lambda SecurityHub-To-GoogleChat-dev deployed (Python 3.12, timeout 15s, State=Active)',
  'EventBridge rule sh-findings-to-gchat-dev ENABLED with correct event pattern',
  'EventBridge → Lambda invoke permission set (AllowExecutionFromCloudWatch)',
  'Secrets Manager secret google_chat_webhook_url_dev created (container only)',
  'Google Chat webhook URL stored as plaintext in Secrets Manager (manual Console step)',
  'modules/ETL/ — Glue job radar-timeline-merge deployed in us-east-2',
  'ETL PySpark script uploaded to S3 at scripts/glue_etl_radar.py',
  'Glue job execution verified — merged Parquet written to S3 /merged/',
  'GitHub Actions terraform-plan job validated on a test PR (plan output visible in PR summary)',
  'GitHub Actions terraform-apply job validated on push to main (apply logs clean)',
  'Live test: port 22 SG finding appeared in Security Hub within 15 minutes of creation',
  'Google Chat alert card received with correct Title, Severity, AccountId, and ResourceId',
  'Security Hub finding write-back verified — Workflow.Status = NOTIFIED after Lambda execution',
  'Test SG (test-port22-AUDIT) deleted — no open port 22 resources remain in account',
];

const CHECKLIST_DONE = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);

const OPEN_DECISIONS = [
  'Multi-channel alerting — current: Google Chat only. PagerDuty/OpsGenie integration for on-call escalation not yet wired; SNS fan-out would enable multiple destinations.',
  'Multi-region finding aggregation — EventBridge rules are per-region. If Security Hub multi-region aggregation is enabled, a single rule in the aggregation region may be sufficient.',
  'Glue job scheduling — currently triggered manually or ad hoc. EventBridge schedule (e.g., nightly) not yet configured for radar-timeline-merge.',
  'CRITICAL vs HIGH severity routing — current: both routed identically. Separate Lambda or SNS topic for CRITICAL-only escalation (pager, SMS) not yet implemented.',
];

// ── Page component ─────────────────────────────────────────────────────────────

export default function CybersecurityPage() {
  const [active, setActive]       = useState('arch-review');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [checked, setChecked]     = useState<Set<number>>(new Set(CHECKLIST_DONE));
  const [filterTag, setFilterTag] = useState('All');
  const [pipelineLive, setPipelineLive]   = useState(false);
  const [liveDate, setLiveDate]           = useState<string | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
      const fz = localStorage.getItem(LS_FREEZE_KEY);
      if (fz) { const p = JSON.parse(fz); setPipelineLive(true); setLiveDate(p.date); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    try { localStorage.setItem(LS_KEY, JSON.stringify([...checked])); } catch { /* ignore */ }
  }, [checked]);

  function toggleChecked(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
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

  const TAGS = ['All', 'Plan', 'Build', 'Deploy', 'Validate'];
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

  function toggleLive() {
    if (!ready && !pipelineLive) return;
    setPipelineLive(f => {
      const next = !f;
      if (next) {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setLiveDate(date);
        try { localStorage.setItem(LS_FREEZE_KEY, JSON.stringify({ frozen: true, date })); } catch { /* ignore */ }
      } else {
        setLiveDate(null);
        try { localStorage.removeItem(LS_FREEZE_KEY); } catch { /* ignore */ }
      }
      return next;
    });
  }

  const accentColor = '#DC2626';
  const accentBg    = '#FEF2F2';
  const accentBorder = '#FECACA';

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      .pl-ready {
        background: ${accentColor};
        border: 1.5px solid transparent;
      }
      .pl-ready .pl-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .pl-ready .pl-sub   { color: rgba(255,255,255,0.82); }
      .pl-live {
        background: #059669;
        border: 1.5px solid transparent;
      }
      .pl-live .pl-title { color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.18); }
      .pl-live .pl-sub   { color: rgba(255,255,255,0.82); }
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
          <Link href="/cybersecurity" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '4px 6px', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 14, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Ambient <em style={{ color: '#DC2626' }}>Cyber</em>
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
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #B91C1C, #D97706)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 2px', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', cursor: 'pointer', border: filterTag === tag ? `1.5px solid ${accentColor}` : '1px solid #E5E7EB', background: filterTag === tag ? accentBg : '#FFFFFF', color: filterTag === tag ? accentColor : '#6B7280', transition: 'all 0.12s' }}>
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
                    <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: isActive ? accentBg : 'transparent', border: isActive ? `1px solid ${accentBorder}` : '1px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', marginBottom: 1 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: isActive ? accentColor : '#9CA3AF', minWidth: 16, flexShrink: 0 }}>{s.phase}</span>
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
            <a href="https://github.com/ambientintel/ambientcyber" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#6B7280', textDecoration: 'none', letterSpacing: '0.04em' }}>ambientintel/ambientcyber</a>
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 7 }}>Ambient Intelligence · Cybersecurity</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, color: '#111827' }}>
              AWS <em style={{ fontStyle: 'italic', color: '#DC2626' }}>Security</em>
            </h1>
            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: 13.5, maxWidth: 520, lineHeight: 1.6 }}>
              Event-driven Security Hub alerting pipeline with zero-trust GitOps. Architecture → IAM → Build → Deploy → Validate.
            </p>
          </div>
          <a href="https://github.com/ambientintel/ambientcyber" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, fontFamily: 'var(--mono)', color: '#374151', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity={0.6}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            ambientintel/ambientcyber
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
                        <button onClick={() => setActive(id)} title={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 7, border: isActive ? `1.5px solid ${accentColor}` : `1px solid ${sc.border}`, background: isActive ? accentBg : sc.bg, cursor: 'pointer', transition: 'all 0.12s', minWidth: 44 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: isActive ? accentColor : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{s.phase}</span>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pipeline Active milestone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 24, height: 1, background: pipelineLive ? 'linear-gradient(90deg,#E5E7EB,#059669)' : ready ? `linear-gradient(90deg,#E5E7EB,${accentColor})` : '#E5E7EB' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l4 4-4 4" stroke={pipelineLive ? '#059669' : ready ? accentColor : '#D1D5DB'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: pipelineLive ? '#059669' : ready ? accentColor : '#9CA3AF' }}>
                  {pipelineLive ? 'Live ✓' : 'Goal'}
                </div>
                <button
                  onClick={toggleLive}
                  className={pipelineLive ? 'pl-live' : ready ? 'pl-ready' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 16px', borderRadius: 9,
                    cursor: ready || pipelineLive ? 'pointer' : 'default',
                    ...(!(pipelineLive || ready) && { background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }),
                    transition: 'all 0.25s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    {pipelineLive || ready ? (
                      <>
                        <circle cx="8" cy="8" r="6.5" stroke={pipelineLive ? '#059669' : accentColor} strokeWidth="1.5"/>
                        <path d="M5 8.5L7 10.5L11 6" stroke={pipelineLive ? '#059669' : accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </>
                    ) : (
                      <>
                        <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                        <path d="M8 5v3.5M8 10.5v.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span className="pl-title" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: pipelineLive ? '#059669' : ready ? accentColor : '#9CA3AF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {pipelineLive ? 'Pipeline Active ✓' : 'Pipeline Active'}
                    </span>
                    <span className="pl-sub" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: pipelineLive ? '#059669' : ready ? accentColor : '#9CA3AF' }}>
                      {pipelineLive ? (liveDate ? `Live ${liveDate}` : 'Alerts flowing') : ready ? 'Ready — click to mark live' : `${Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)}% complete`}
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
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: accentColor, background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 4, padding: '2px 8px' }}>STEP {step.phase}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: tagStyle.bg, color: tagStyle.color }}>{step.tag}</span>
                      {step.time && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontFamily: 'var(--mono)', background: '#F8FAFC', color: '#6B7280', border: '1px solid #E5E7EB' }}>⏱ {step.time}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setFocusMode(f => !f)} title="Focus mode — show commands only" style={{ padding: '4px 10px', borderRadius: 6, border: focusMode ? `1.5px solid ${accentColor}` : '1px solid #E5E7EB', background: focusMode ? accentBg : '#FFFFFF', color: focusMode ? accentColor : '#6B7280', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s' }}>
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
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: isOpen ? accentColor : '#D1D5DB', flexShrink: 0, transition: 'background 0.15s' }} />
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
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 13px', background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: accentColor, flexShrink: 0, marginTop: 2 }}>▸</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: '#991B1B', marginBottom: 2 }}>{a.file}</div>
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
                              <span style={{ color: accentColor, fontSize: 12, flexShrink: 0, marginTop: 1 }}>◆</span>
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
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>Pipeline Checklist</div>
                <button onClick={() => setChecked(new Set(CHECKLIST_DONE))} style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>reset</button>
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
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #B91C1C, #D97706)', width: `${(doneCount / CHECKLIST_ITEMS.length) * 100}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Open decisions */}
            <div style={{ padding: '14px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: 10 }}>Open Decisions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OPEN_DECISIONS.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 8 }}>
                    <span style={{ color: '#D97706', fontSize: 11, flexShrink: 0, marginTop: 1 }}>◇</span>
                    <span style={{ fontSize: 11.5, color: '#78350F', lineHeight: 1.5 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
