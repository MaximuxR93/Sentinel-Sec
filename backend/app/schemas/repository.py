from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class RepositoryAnalyzeRequest(BaseModel):
    url: HttpUrl


class RepositoryMetadata(BaseModel):
    """Full internal repository analysis result."""

    name: str
    url: str
    framework: str | None = None
    languages: list[str] = Field(default_factory=list)
    package_manager: str | None = None
    package_manager_evidence: str | None = None
    lockfile_found: bool = False
    lockfile_type: str | None = None
    database: str | None = None
    files: int = 0
    api_routes: int = 0
    docker: bool = False
    github_actions: bool = False
    fingerprint: dict[str, Any] = Field(default_factory=dict)
    framework_analysis: dict[str, Any] = Field(default_factory=dict)
    dependency_analysis: dict[str, Any] = Field(default_factory=dict)
    vulnerability_analysis: dict[str, Any] = Field(default_factory=dict)
    analysis_status: str = "completed"
    analysis_errors: list[dict[str, str]] = Field(default_factory=list)


class RepositoryStatsSummary(BaseModel):
    """Compact repository statistics for the API response."""

    files: int = 0
    directories: int = 0
    api_routes: int = 0
    docker: bool = False
    github_actions: bool = False


class SecuritySummary(BaseModel):
    """Compact vulnerability scan summary."""

    scan_status: str = "not_scanned"
    total_dependencies: int = 0
    dependencies_scanned: int = 0
    dependencies_skipped: int = 0
    scan_coverage_percent: float = 0
    vulnerabilities_found: int = 0
    unique_advisories: int = 0
    skip_reasons: dict[str, int] = Field(default_factory=dict)


class RepositoryAnalysisSummary(BaseModel):
    """Clean, frontend-friendly repository analysis response."""

    name: str
    url: str
    framework: str | None = None
    languages: list[str] = Field(default_factory=list)
    package_manager: str | None = None
    package_manager_evidence: str | None = None
    lockfile_found: bool = False
    lockfile_type: str | None = None
    database: str | None = None
    stats: RepositoryStatsSummary
    security: SecuritySummary
    analysis_status: str = "completed"
    analysis_errors_count: int = 0