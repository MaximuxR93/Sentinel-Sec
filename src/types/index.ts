export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type FindingStatus = 'open' | 'accepted_risk' | 'fixed' | 'reopened';

export type SecurityEngineType = 'sast' | 'sca' | 'secrets' | 'infrastructure' | 'auth_flow';

export type ScanProfile = 'quick' | 'standard' | 'deep';

export type ScanStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';

export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface ScanStage {
  id: string;
  name: string;
  label: string;
  status: StageStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  message?: string;
}

export interface FindingEvidence {
  id: string;
  type: 'advisory' | 'code_snippet' | 'regex_match' | 'config_line';
  filePath: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
  source?: string;
  advisoryId?: string;
  advisoryUrl?: string;
  description?: string;
}

export interface SecurityFinding {
  id: string;
  scanId: string;
  repositoryId: string;
  ruleId: string;
  title: string;
  description: string;
  category: 'dependency' | 'code_injection' | 'hardcoded_secret' | 'insecure_config' | 'auth_bypass';
  severity: Severity;
  confidence: 'low' | 'medium' | 'high';
  engine: SecurityEngineType;
  status: FindingStatus;
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  component?: {
    name: string;
    ecosystem?: 'npm' | 'pypi' | 'cargo' | 'golang';
    version?: string;
    fixedVersion?: string;
  };
  evidence: FindingEvidence[];
  remediation: {
    summary: string;
    kind: 'upgrade_dependency' | 'code_patch' | 'rotate_secret' | 'config_update';
    proposedDiff?: string;
    suggestedAt?: string;
    validationStatus?: 'unvalidated' | 'passed' | 'failed';
  };
  cvssScore?: number;
  cwe?: string;
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  lastCommitSha: string;
  languages: { name: string; percentage: number }[];
  frameworks: { name: string; confidence: number; evidence: string }[];
  manifests: string[];
  totalDependencies: number;
  scannedDependencies: number;
  skippedDependencies: number;
  coveragePercent: number;
  openFindingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastScanStatus: ScanStatus;
  lastScanDate: string;
  stars?: number;
  forks?: number;
}

export interface ScanJob {
  id: string;
  repositoryId: string;
  repositoryName: string;
  repositoryUrl: string;
  branch: string;
  commitSha: string;
  profile: ScanProfile;
  status: ScanStatus;
  progressPercent: number;
  currentStage: string;
  stages: ScanStage[];
  startedAt: string;
  completedAt?: string;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  coverage: {
    totalDependencies: number;
    scannedDependencies: number;
    skippedDependencies: number;
    coveragePercent: number;
    skipReasons: Record<string, number>;
  };
  logs: string[];
}

export interface GraphNode {
  id: string;
  type: 'public_entry' | 'api_route' | 'frontend_component' | 'backend_handler' | 'auth_middleware' | 'database' | 'dependency' | 'finding' | 'infrastructure';
  label: string;
  sublabel?: string;
  severity?: Severity;
  confidence: 'low' | 'medium' | 'high';
  x: number;
  y: number;
  evidenceIds: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'CALLS' | 'IMPORTS' | 'AUTHENTICATES' | 'READS_FROM' | 'WRITES_TO' | 'DEPENDS_ON' | 'EXPOSES' | 'ASSOCIATED_WITH';
  confidence: 'low' | 'medium' | 'high';
  isVulnerablePath?: boolean;
}

export interface ArchitectureGraph {
  schemaVersion: number;
  repositoryId: string;
  scanId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RemediationProposal {
  id: string;
  findingId: string;
  findingTitle: string;
  filePath: string;
  targetBranch: string;
  explanation: string;
  diff: string;
  impactAnalysis: string;
  requiredChecks: string[];
  validationStatus: 'pending' | 'running' | 'passed' | 'failed';
  prUrl?: string;
}

// SentinelAI Incident Triage Contracts
export interface Incident {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  status: 'new' | 'investigating' | 'escalated' | 'resolved' | 'dismissed';
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
  version: number; // For If-Match header
  source: string;
  indicators: string[];
  confidence: number;
}

export interface IncidentTraceStep {
  stepId: string;
  timestamp: string;
  action: string;
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: 'success' | 'failure' | 'waiting_analyst';
  notes?: string;
}

export interface GuardrailEvent {
  id: string;
  timestamp: string;
  ruleName: string;
  actionTaken: 'blocked' | 'redacted' | 'flagged';
  target: string;
  reason: string;
  threatLevel: Severity;
}

export interface MemoryItem {
  id: string;
  key: string;
  type: 'incident_pattern' | 'cve_advisory' | 'trusted_domain' | 'analyst_override';
  content: string;
  lastUpdated: string;
  score: number;
}

export interface EvalMetric {
  id: string;
  dataset: string;
  accuracy: number;
  precision: number;
  recall: number;
  falsePositiveRate: number;
  sampleCount: number;
  lastRun: string;
}

export interface SystemMetrics {
  totalScans: number;
  activeScans: number;
  totalVulnerabilitiesIdentified: number;
  vulnerabilitiesRemediated: number;
  avgScanDurationSec: number;
  osvApiCacheHitRate: number;
  agentEscalationRate: number;
  meanTimeToTriageMin: number;
}
