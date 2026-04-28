// ambientsamd regulatory data — mirrors the scaffold in github.com/ambientintel/ambientsamd

export type ReqStatus = 'Draft' | 'Under Review' | 'Approved' | 'Verified';
export type RiskSeverity = 1 | 2 | 3 | 4 | 5;
export type RiskProbability = 1 | 2 | 3 | 4 | 5;
export type ControlType = 'Inherent safety' | 'Protective measure' | 'Information for safety';
export type SoupScope = 'Dev only' | 'Production';
export type SoftwareClass = 'A' | 'B' | 'C' | 'TBD';

// ── Requirements ──────────────────────────────────────────────────────────────

export interface Requirement {
  id: string;
  title: string;
  description: string;
  rationale: string;
  userNeed: string;
  riskControls: string[];
  verificationMethod: 'Unit test' | 'Integration test' | 'Inspection' | 'Analysis';
  verificationRef: string | null;
  status: ReqStatus;
}

export const REQUIREMENTS: Requirement[] = [
  {
    id: 'SRS-001',
    title: 'detect_fall shall reject non-finite feature values',
    description:
      'The detect_fall function shall raise ValueError for any feature dict containing NaN or infinite float values before executing the algorithm.',
    rationale:
      'Non-finite values indicate a corrupted or uninitialized sensor pipeline output. Passing them to the algorithm produces undefined behavior.',
    userNeed: 'UN-001',
    riskControls: ['RC-004'],
    verificationMethod: 'Unit test',
    verificationRef: 'test_detector.py::test_detect_fall_raises_on_nan_feature',
    status: 'Verified',
  },
  {
    id: 'SRS-002',
    title: 'Every FallEvent shall embed algorithm_version and model_version',
    description:
      'Each FallEvent returned by detect_fall shall contain the ambientsamd package version (__version__) and the model artifact identifier (MODEL_VERSION) used to produce the result.',
    rationale:
      'Version embedding enables audit traceability of every detection event without consulting external metadata.',
    userNeed: 'UN-002',
    riskControls: ['RC-003'],
    verificationMethod: 'Unit test',
    verificationRef: 'test_detector.py::test_package_exports_required_symbols',
    status: 'Verified',
  },
  {
    id: 'SRS-003',
    title: 'FallEvent shall be immutable after construction',
    description:
      'The FallEvent dataclass shall be frozen; any attempt to mutate a field after construction shall raise an exception.',
    rationale:
      'Immutability prevents ambientapp from accidentally altering detection results before logging or alerting.',
    userNeed: 'UN-002',
    riskControls: [],
    verificationMethod: 'Unit test',
    verificationRef: 'test_detector.py::test_fall_event_is_frozen',
    status: 'Verified',
  },
  {
    id: 'SRS-004',
    title: 'FallEvent.timestamp shall be timezone-aware',
    description:
      'The detect_fall function shall reject timezone-naive datetime arguments and FallEvent construction shall reject naive timestamps.',
    rationale:
      'Naive timestamps are ambiguous across time zones and cannot be reliably correlated with facility records.',
    userNeed: 'UN-002',
    riskControls: [],
    verificationMethod: 'Unit test',
    verificationRef: 'test_detector.py::test_fall_event_rejects_naive_timestamp',
    status: 'Verified',
  },
  {
    id: 'SRS-005',
    title: 'detect_fall shall produce no file or network I/O',
    description:
      'The algorithm layer (src/ambientsamd/) shall contain no calls to file system, socket, or HTTP APIs. Logging to the standard logging module is permitted.',
    rationale:
      'I/O in the algorithm layer creates non-determinism, side effects, and attack surface. The regulated boundary must be pure.',
    userNeed: 'UN-003',
    riskControls: ['RC-001'],
    verificationMethod: 'Inspection',
    verificationRef: null,
    status: 'Approved',
  },
  {
    id: 'SRS-006',
    title: 'Fall confidence shall be a float in [0.0, 1.0]',
    description:
      'FallEvent.confidence shall be a float in the closed interval [0.0, 1.0]. Values outside this range shall raise ValueError.',
    rationale:
      'Downstream threshold policy in ambientapp assumes a probability interpretation. Out-of-range values indicate an algorithm defect.',
    userNeed: 'UN-001',
    riskControls: [],
    verificationMethod: 'Unit test',
    verificationRef: 'test_detector.py::test_fall_event_rejects_out_of_range_confidence',
    status: 'Verified',
  },
  {
    id: 'SRS-007',
    title: 'FallEvent.input_hash shall be a stable SHA-256 digest',
    description:
      'The input_hash field shall be the SHA-256 hex digest of the JSON-serialized feature dict (keys sorted, no whitespace). The same feature dict shall always produce the same hash.',
    rationale:
      'Deterministic hashing is required for reproducible audit trails.',
    userNeed: 'UN-002',
    riskControls: [],
    verificationMethod: 'Unit test',
    verificationRef: 'test_detector.py::test_fall_event_build_is_deterministic',
    status: 'Verified',
  },
];

// ── Hazards & Risk Controls ───────────────────────────────────────────────────

export interface Hazard {
  id: string;
  hazard: string;
  hazardousSituation: string;
  harm: string;
  severity: RiskSeverity | null;
  probability: RiskProbability | null;
  controls: string[];
  notes: string;
}

export interface RiskControl {
  id: string;
  hazardIds: string[];
  description: string;
  type: ControlType;
  implementationRef: string;
  verificationMethod: string;
  residualRisk: string;
}

export const HAZARDS: Hazard[] = [
  {
    id: 'H-001',
    hazard: 'False negative — missed fall',
    hazardousSituation: 'Resident falls; algorithm does not detect',
    harm: 'Delayed emergency response; injury or death',
    severity: 4,
    probability: null,
    controls: ['RC-001'],
    notes: 'Primary hazard for fall detection',
  },
  {
    id: 'H-002',
    hazard: 'False positive — spurious fall alert',
    hazardousSituation: 'Algorithm fires on non-fall motion',
    harm: 'Care staff distracted; alert fatigue reduces response to real falls',
    severity: 3,
    probability: null,
    controls: ['RC-002'],
    notes: '',
  },
  {
    id: 'H-003',
    hazard: 'Algorithm version mismatch',
    hazardousSituation: 'Wrong model loaded at runtime',
    harm: 'Incorrect detection behavior; undetected regression',
    severity: 3,
    probability: null,
    controls: ['RC-003'],
    notes: '',
  },
  {
    id: 'H-004',
    hazard: 'Corrupted input features',
    hazardousSituation: 'NaN or Inf values passed to algorithm',
    harm: 'Undefined algorithm output; silent failure',
    severity: 3,
    probability: null,
    controls: ['RC-004'],
    notes: 'Partially mitigated by _validate_features()',
  },
];

export const RISK_CONTROLS: RiskControl[] = [
  {
    id: 'RC-001',
    hazardIds: ['H-001'],
    description: 'TODO: define sensitivity / specificity threshold and alert escalation policy',
    type: 'Information for safety',
    implementationRef: 'TODO',
    verificationMethod: 'TODO',
    residualRisk: 'TODO',
  },
  {
    id: 'RC-002',
    hazardIds: ['H-002'],
    description: 'TODO: define specificity floor and nuisance-alert rate limit',
    type: 'Inherent safety',
    implementationRef: 'TODO',
    verificationMethod: 'TODO',
    residualRisk: 'TODO',
  },
  {
    id: 'RC-003',
    hazardIds: ['H-003'],
    description: 'Embed algorithm_version and model_version in every FallEvent output',
    type: 'Inherent safety',
    implementationRef: 'src/ambientsamd/types.py — FallEvent fields',
    verificationMethod: 'SRS-002 verification test',
    residualRisk: 'TODO',
  },
  {
    id: 'RC-004',
    hazardIds: ['H-004'],
    description: 'Validate all feature values for finiteness before passing to algorithm',
    type: 'Protective measure',
    implementationRef: 'src/ambientsamd/detector.py::_validate_features',
    verificationMethod: 'test_detector.py::test_detect_fall_raises_on_nan_feature',
    residualRisk: 'TODO',
  },
];

// ── SOUP ──────────────────────────────────────────────────────────────────────

export interface SoupEntry {
  name: string;
  version: string;
  purpose: string;
  license: string;
  anomalyReviewDate: string | null;
  assessor: string | null;
  scope: SoupScope;
}

export const SOUP: SoupEntry[] = [
  {
    name: 'CPython',
    version: '>=3.11',
    purpose: 'Runtime — hashlib, json, math, logging, dataclasses, datetime',
    license: 'PSF-2.0',
    anomalyReviewDate: null,
    assessor: null,
    scope: 'Production',
  },
  {
    name: 'pytest',
    version: '8.3.5',
    purpose: 'Verification test runner',
    license: 'MIT',
    anomalyReviewDate: null,
    assessor: null,
    scope: 'Dev only',
  },
  {
    name: 'pytest-cov',
    version: '6.1.0',
    purpose: 'Coverage reporting for verification',
    license: 'MIT',
    anomalyReviewDate: null,
    assessor: null,
    scope: 'Dev only',
  },
  {
    name: 'mypy',
    version: '1.13.0',
    purpose: 'Static type checking',
    license: 'MIT',
    anomalyReviewDate: null,
    assessor: null,
    scope: 'Dev only',
  },
  {
    name: 'ruff',
    version: '0.9.10',
    purpose: 'Linter and formatter',
    license: 'MIT',
    anomalyReviewDate: null,
    assessor: null,
    scope: 'Dev only',
  },
  {
    name: 'cyclonedx-bom',
    version: '5.1.1',
    purpose: 'SBOM generation in CI',
    license: 'Apache-2.0',
    anomalyReviewDate: null,
    assessor: null,
    scope: 'Dev only',
  },
];

// ── Verification ──────────────────────────────────────────────────────────────

export interface VerificationTest {
  id: string;
  description: string;
  linkedReqs: string[];
  result: 'Pass' | 'Fail' | 'Not run';
  coverage: number | null;
  ciRun: string | null;
}

export const VERIFICATION_TESTS: VerificationTest[] = [
  { id: 'test_package_exports_required_symbols', description: 'Public API surface exports detect_fall, FallEvent, __version__, MODEL_VERSION', linkedReqs: ['SRS-002'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_version_is_pep440_string', description: '__version__ is a non-empty string', linkedReqs: ['SRS-002'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_fall_event_build_computes_input_hash', description: 'FallEvent.build embeds a 64-char SHA-256 input_hash', linkedReqs: ['SRS-007'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_fall_event_build_is_deterministic', description: 'Same features always produce the same input_hash', linkedReqs: ['SRS-007'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_fall_event_rejects_naive_timestamp', description: 'FallEvent rejects timezone-naive timestamps', linkedReqs: ['SRS-004'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_fall_event_rejects_out_of_range_confidence', description: 'FallEvent rejects confidence outside [0, 1]', linkedReqs: ['SRS-006'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_fall_event_is_frozen', description: 'FallEvent fields cannot be mutated after construction', linkedReqs: ['SRS-003'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_detect_fall_raises_on_nan_feature', description: 'detect_fall raises ValueError for NaN feature values', linkedReqs: ['SRS-001'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_detect_fall_raises_on_inf_feature', description: 'detect_fall raises ValueError for Inf feature values', linkedReqs: ['SRS-001'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_detect_fall_raises_not_implemented', description: 'detect_fall stub raises NotImplementedError for valid inputs', linkedReqs: ['SRS-001'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
  { id: 'test_detect_fall_rejects_naive_timestamp', description: 'detect_fall raises for timezone-naive timestamp argument', linkedReqs: ['SRS-004'], result: 'Pass', coverage: 100, ciRun: 'b901636' },
];

// ── Releases ──────────────────────────────────────────────────────────────────

export type ReleaseStatus = 'Draft' | 'Approved' | 'Released';

export interface Release {
  version: string;
  date: string;
  algorithmVersion: string;
  modelVersion: string;
  status: ReleaseStatus;
  testsPass: boolean;
  coverage: number;
  sbom: boolean;
  approvedBy: string[];
  notes: string;
}

export const RELEASES: Release[] = [
  {
    version: 'v0.1.0',
    date: '2026-04-28',
    algorithmVersion: '0.1.0',
    modelVersion: 'unset',
    status: 'Draft',
    testsPass: true,
    coverage: 100,
    sbom: false,
    approvedBy: [],
    notes: 'Initial scaffold — API contract fixed, implementation pending. NotImplementedError stub.',
  },
];

// ── Software metadata ─────────────────────────────────────────────────────────

export const SAMD_META = {
  packageName: 'ambientsamd',
  repo: 'https://github.com/ambientintel/ambientsamd',
  safetyClass: 'TBD' as SoftwareClass,
  regulatoryStatus: 'Pre-submission — QMS not yet stood up',
  standards: ['IEC 62304', 'ISO 14971', 'FDA Premarket Cybersecurity Guidance (2023)'],
};
