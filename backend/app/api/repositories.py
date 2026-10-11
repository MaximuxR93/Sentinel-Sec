import subprocess

from fastapi import APIRouter, HTTPException

from app.schemas.repository import (
    RepositoryAnalyzeRequest,
    RepositoryAnalysisSummary,
    RepositoryStatsSummary,
    SecuritySummary,
)
from app.services.repository_service import repository_service


router = APIRouter(
    prefix="/api/repositories",
    tags=["Repositories"],
)


@router.post(
    "/analyze",
    response_model=RepositoryAnalysisSummary,
)
def analyze_repository(
    request: RepositoryAnalyzeRequest,
):
    try:
        result = repository_service.analyze(str(request.url))

        fingerprint = result.fingerprint or {}
        vulnerability_analysis = result.vulnerability_analysis or {}

        # Extract directory count safely.
        directories = fingerprint.get("directories", 0)

        if not isinstance(directories, int):
            directories = 0

        # Extract vulnerability scan summary.
        security_data = vulnerability_analysis.get("summary", {})

        security = SecuritySummary(
            scan_status=security_data.get(
                "scan_status",
                "not_scanned",
            ),
            total_dependencies=security_data.get(
                "total_dependencies",
                0,
            ),
            dependencies_scanned=security_data.get(
                "dependencies_scanned",
                0,
            ),
            dependencies_skipped=security_data.get(
                "dependencies_skipped",
                0,
            ),
            scan_coverage_percent=security_data.get(
                "scan_coverage_percent",
                0,
            ),
            vulnerabilities_found=security_data.get(
                "vulnerabilities_found",
                0,
            ),
            unique_advisories=security_data.get(
                "unique_advisories",
                0,
            ),
            skip_reasons=security_data.get(
                "skip_reasons",
                {},
            ),
        )

        return RepositoryAnalysisSummary(
            name=result.name,
            url=result.url,
            framework=result.framework,
            languages=result.languages,
            package_manager=result.package_manager,
            package_manager_evidence=result.package_manager_evidence,
            lockfile_found=result.lockfile_found,
            lockfile_type=result.lockfile_type,
            database=result.database,
            stats=RepositoryStatsSummary(
                files=result.files,
                directories=directories,
                api_routes=result.api_routes,
                docker=result.docker,
                github_actions=result.github_actions,
            ),
            security=security,
            analysis_status=result.analysis_status,
            analysis_errors_count=len(
                result.analysis_errors
            ),
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=408,
            detail="Repository clone timed out.",
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        # Avoid exposing internal exception details.
        raise HTTPException(
            status_code=500,
            detail="Repository analysis failed.",
        )