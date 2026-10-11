export interface RepositoryStatsSummary {
  files: number;
  directories: number;
  api_routes: number;
  docker: boolean;
  github_actions: boolean;
}

export interface SecuritySummary {
  scan_status: string;
  total_dependencies: number;
  dependencies_scanned: number;
  dependencies_skipped: number;
  scan_coverage_percent: number;
  vulnerabilities_found: number;
  unique_advisories: number;
  skip_reasons: Record<string, number>;
}

export interface VulnerabilityDetail {
  id: string;
  summary: string;
  details?: string;
  package: string;
  ecosystem: string;
  severity?: string;
  affected_versions?: string;
  fixed_version?: string;
}

export interface DependencyDetail {
  name: string;
  version?: string;
  ecosystem: string;
  type: string; // 'production' | 'development' | 'direct' | 'lockfile'
  vulnerabilities?: VulnerabilityDetail[];
}

export interface FrameworkEvidence {
  type: string;
  path: string;
  reason: string;
}

export interface FrameworkResult {
  name: string;
  category: string;
  confidence: number;
  evidence: FrameworkEvidence[];
}

export interface LanguageStat {
  name: string;
  files: number;
  percentage: number;
}

export interface RepositoryAnalysisSummary {
  name: string;
  url: string;
  framework: string | null;
  framework_category?: string;
  framework_confidence?: number;
  framework_evidence?: FrameworkEvidence[];
  languages: string[];
  language_stats?: LanguageStat[];
  package_manager: string | null;
  package_manager_evidence: string | null;
  lockfile_found: boolean;
  lockfile_type: string | null;
  database: string | null;
  stats: RepositoryStatsSummary;
  security: SecuritySummary;
  dependencies?: DependencyDetail[];
  vulnerabilities?: VulnerabilityDetail[];
  analysis_status: string;
  analysis_errors_count: number;
  timestamp?: string;
}
