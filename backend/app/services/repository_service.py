
"""Repository cloning and analysis orchestration for SentinelFlow."""

import json
import os
import shutil
import subprocess
import sys
import uuid
from dataclasses import asdict, is_dataclass
from enum import Enum
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from app.core.config import settings
from app.schemas.repository import RepositoryMetadata

# The analyzer package is a sibling of the backend directory.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ANALYZER_ROOT = PROJECT_ROOT / "analyzer"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if str(ANALYZER_ROOT) not in sys.path:
    sys.path.insert(0, str(ANALYZER_ROOT))

from engines.dependency_analyzer import DependencyAnalyzer
from engines.framework_detector import FrameworkDetector
from engines.repository_fingerprint import RepositoryFingerprintEngine
from engines.vulnerability_scanner import VulnerabilityScanner


class RepositoryService:
    """Clone a repository into a workspace and run static analyzers."""

    CLONE_TIMEOUT_SECONDS = 120

    IGNORED_DIRS = {
        ".git",
        "node_modules",
        ".next",
        "dist",
        "build",
        ".venv",
        "venv",
        "__pycache__",
        ".turbo",
        "coverage",
    }

    def __init__(self) -> None:
        self.workspace = Path(settings.workspace_dir).resolve()
        self.workspace.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _repository_name(url: str) -> str:
        """Return a safe display name derived from a repository URL."""
        parsed = urlparse(url)
        name = parsed.path.rstrip("/").split("/")[-1]

        if name.endswith(".git"):
            name = name[:-4]

        safe_name = "".join(
            char
            for char in name
            if char.isalnum() or char in ("-", "_", ".")
        ).strip(".")

        return safe_name or "repository"

    def _clone_repository(self, url: str, destination: Path) -> None:
        """Clone without checking out submodules or executing repository code."""
        parsed = urlparse(url)

        if parsed.scheme not in {"https", "http", "ssh", "git"}:
            raise ValueError("Unsupported repository URL scheme.")

        if not parsed.hostname:
            raise ValueError("Repository URL must include a hostname.")

        result = subprocess.run(
            [
                "git",
                "-c",
                "protocol.file.allow=never",
                "clone",
                "--depth",
                "1",
                "--no-recurse-submodules",
                "--",
                url,
                str(destination),
            ],
            capture_output=True,
            text=True,
            timeout=self.CLONE_TIMEOUT_SECONDS,
            check=False,
        )

        if result.returncode != 0:
            message = (
                result.stderr.strip()
                or "Git returned a non-zero exit code."
            )
            raise RuntimeError(
                f"Failed to clone repository: {message[-2000:]}"
            )

    @classmethod
    def _serialize_result(cls, result: Any) -> Any:
        """
        Recursively convert analyzer results into JSON-compatible values.

        Handles dataclasses, lists, tuples, dictionaries, enums, Paths,
        and Pydantic models. This prevents dataclass lists from becoming
        Python repr strings in the API response.
        """
        if result is None or isinstance(
            result, (str, int, float, bool)
        ):
            return result

        if isinstance(result, Enum):
            return result.value

        if isinstance(result, Path):
            return str(result)

        if is_dataclass(result) and not isinstance(result, type):
            return cls._serialize_result(asdict(result))

        if hasattr(result, "model_dump"):
            return cls._serialize_result(
                result.model_dump(mode="json")
            )

        if isinstance(result, dict):
            return {
                str(key): cls._serialize_result(value)
                for key, value in result.items()
            }

        if isinstance(result, (list, tuple, set)):
            return [
                cls._serialize_result(item)
                for item in result
            ]

        if hasattr(result, "__dict__"):
            return cls._serialize_result(
                {
                    key: value
                    for key, value in vars(result).items()
                    if not key.startswith("_")
                }
            )

        return str(result)

    @staticmethod
    def _extract_framework(result: Any) -> str | None:
        """Extract the primary framework from structured detector output."""
        if isinstance(result, str):
            return result or None

        if isinstance(result, list):
            # Prefer Next.js when both Next.js and React are detected.
            preferred = ("Next.js", "Next", "React")

            for preferred_name in preferred:
                for item in result:
                    name = RepositoryService._extract_framework(item)
                    if name and name.lower() == preferred_name.lower():
                        return name

            for item in result:
                name = RepositoryService._extract_framework(item)
                if name:
                    return name

            return None

        if not isinstance(result, dict):
            return None

        # Check direct framework fields.
        for key in ("framework", "primary_framework", "name"):
            value = result.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        # Handle wrapped detector responses, e.g. {"result": [...]}.
        for key in ("result", "frameworks", "detections", "items"):
            value = result.get(key)
            if isinstance(value, (dict, list)):
                name = RepositoryService._extract_framework(value)
                if name:
                    return name

        return None

    @staticmethod
    def _extract_languages(
        fingerprint: dict[str, Any],
    ) -> list[str]:
        """Normalize language data from the fingerprint engine."""
        languages = fingerprint.get("languages", [])

        if isinstance(languages, dict):
            return sorted(
                str(name)
                for name, count in languages.items()
                if count
            )

        if isinstance(languages, list):
            names = []

            for item in languages:
                if isinstance(item, str):
                    names.append(item)
                elif isinstance(item, dict) and item.get("name"):
                    names.append(str(item["name"]))

            return sorted(set(names))

        return []

    @classmethod
    def _walk_files(cls, repository_path: Path):
        """Walk repository files while pruning generated directories."""
        for current, directories, filenames in os.walk(repository_path):
            directories[:] = [
                directory
                for directory in directories
                if directory not in cls.IGNORED_DIRS
            ]

            current_path = Path(current)

            for filename in filenames:
                yield current_path / filename

    @classmethod
    def _count_files(cls, repository_path: Path) -> int:
        """Count files while excluding generated and dependency folders."""
        return sum(1 for _ in cls._walk_files(repository_path))

    @staticmethod
    def _read_json_file(file_path: Path) -> dict[str, Any]:
        """Read a JSON file safely."""
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
        except (
            OSError,
            UnicodeDecodeError,
            json.JSONDecodeError,
        ):
            return {}

    @classmethod
    def _find_package_manifests(
        cls,
        repository_path: Path,
    ) -> list[Path]:
        """Find package.json files in the repository."""
        return [
            path
            for path in cls._walk_files(repository_path)
            if path.name == "package.json"
        ]


    @classmethod
    def _detect_package_manager_details(
        cls,
        repository_path: Path,
    ) -> dict[str, str | bool | None]:
        """Detect package manager and retain the evidence used."""
        lockfile_managers = (
            ("pnpm-lock.yaml", "pnpm"),
            ("yarn.lock", "yarn"),
            ("package-lock.json", "npm"),
            ("bun.lock", "bun"),
            ("bun.lockb", "bun"),
            ("poetry.lock", "poetry"),
        )

        # Prefer root lockfiles.
        for filename, manager in lockfile_managers:
            if (repository_path / filename).is_file():
                return {
                    "package_manager": manager,
                    "package_manager_evidence": "lockfile_detected",
                    "lockfile_found": True,
                    "lockfile_type": filename,
                }

        # Then inspect nested project lockfiles.
        for path in cls._walk_files(repository_path):
            for filename, manager in lockfile_managers:
                if path.name == filename:
                    return {
                        "package_manager": manager,
                        "package_manager_evidence": "lockfile_detected",
                        "lockfile_found": True,
                        "lockfile_type": filename,
                    }

        # Detect Python package managers from manifests.
        python_markers = (
            ("Pipfile", "pipenv"),
            ("pyproject.toml", "pip"),
            ("requirements.txt", "pip"),
        )

        for path in cls._walk_files(repository_path):
            for filename, manager in python_markers:
                if path.name == filename:
                    return {
                        "package_manager": manager,
                        "package_manager_evidence": "manifest_inferred",
                        "lockfile_found": False,
                        "lockfile_type": None,
                    }

        # Detect Maven and Cargo from their manifests.
        for path in cls._walk_files(repository_path):
            if path.name == "pom.xml":
                return {
                    "package_manager": "maven",
                    "package_manager_evidence": "manifest_inferred",
                    "lockfile_found": False,
                    "lockfile_type": None,
                }

            if path.name == "Cargo.toml":
                return {
                    "package_manager": "cargo",
                    "package_manager_evidence": "manifest_inferred",
                    "lockfile_found": False,
                    "lockfile_type": None,
                }

        # Infer npm from package.json when no supported lockfile exists.
        if cls._find_package_manifests(repository_path):
            return {
                "package_manager": "npm",
                "package_manager_evidence": "manifest_inferred",
                "lockfile_found": False,
                "lockfile_type": None,
            }

        return {
            "package_manager": None,
            "package_manager_evidence": None,
            "lockfile_found": False,
            "lockfile_type": None,
        }

    @classmethod
    def _detect_package_manager(
        cls,
        repository_path: Path,
    ) -> str | None:
        """Return only the detected package manager."""
        details = cls._detect_package_manager_details(repository_path)
        return details["package_manager"]

    @classmethod
    def _detect_database(
        cls,
        repository_path: Path,
    ) -> str | None:
        """
        Infer database/client technology from package manifests.

        This is dependency-based detection, not proof of an active database.
        """
        signatures = (
            ("mongoose", "MongoDB"),
            ("mongodb", "MongoDB"),
            ("pg", "PostgreSQL"),
            ("postgres", "PostgreSQL"),
            ("mysql", "MySQL"),
            ("mysql2", "MySQL"),
            ("redis", "Redis"),
            ("@prisma/client", "Prisma"),
            ("prisma", "Prisma"),
            ("drizzle-orm", "Drizzle"),
        )

        for manifest in cls._find_package_manifests(repository_path):
            package = cls._read_json_file(manifest)

            dependencies = {}
            dependencies.update(
                package.get("dependencies", {})
                if isinstance(package.get("dependencies"), dict)
                else {}
            )
            dependencies.update(
                package.get("devDependencies", {})
                if isinstance(package.get("devDependencies"), dict)
                else {}
            )

            for dependency, technology in signatures:
                if dependency in dependencies:
                    return technology

        # Check common Python database dependencies.
        python_signatures = (
            ("pymongo", "MongoDB"),
            ("motor", "MongoDB"),
            ("psycopg", "PostgreSQL"),
            ("psycopg2", "PostgreSQL"),
            ("asyncpg", "PostgreSQL"),
            ("mysql-connector-python", "MySQL"),
            ("redis", "Redis"),
            ("sqlalchemy", "SQLAlchemy"),
        )

        for path in cls._walk_files(repository_path):
            if path.name not in {
                "requirements.txt",
                "pyproject.toml",
                "Pipfile",
            }:
                continue

            try:
                content = path.read_text(
                    encoding="utf-8",
                    errors="ignore",
                ).lower()
            except OSError:
                continue

            for dependency, technology in python_signatures:
                if dependency.lower() in content:
                    return technology

        return None

    @classmethod
    def _count_api_routes(
        cls,
        repository_path: Path,
    ) -> int:
        """Count Next.js App Router route files."""
        route_names = {
            "route.ts",
            "route.js",
            "route.tsx",
            "route.jsx",
        }

        return sum(
            1
            for path in cls._walk_files(repository_path)
            if path.name in route_names
        )

    @staticmethod
    def _detect_infrastructure(
        repository_path: Path,
    ) -> tuple[bool, bool]:
        """Detect basic Docker and GitHub Actions configuration."""
        docker = (
            any(repository_path.glob("Dockerfile*"))
            or any(repository_path.glob("docker-compose*.y*"))
            or any(repository_path.glob("compose.y*"))
        )

        github_actions = (
            repository_path / ".github" / "workflows"
        ).is_dir()

        return docker, github_actions

    @staticmethod
    def _detect_languages(
        repository_path: Path,
    ) -> list[str]:
        """Fallback language detection based on file extensions."""
        extension_languages = {
            ".py": "Python",
            ".js": "JavaScript",
            ".jsx": "JavaScript",
            ".mjs": "JavaScript",
            ".cjs": "JavaScript",
            ".ts": "TypeScript",
            ".tsx": "TypeScript",
            ".java": "Java",
            ".go": "Go",
            ".rs": "Rust",
            ".cs": "C#",
            ".cpp": "C++",
            ".c": "C",
            ".php": "PHP",
            ".rb": "Ruby",
            ".swift": "Swift",
            ".kt": "Kotlin",
        }

        found = {
            extension_languages[path.suffix.lower()]
            for path in RepositoryService._walk_files(repository_path)
            if path.suffix.lower() in extension_languages
        }

        return sorted(found)

    def analyze(self, url: str) -> RepositoryMetadata:
        """Clone and analyze a repository, preserving partial results."""
        repository_name = self._repository_name(url)

        # Unique scan directories prevent concurrent scans and collisions.
        scan_id = uuid.uuid4().hex
        destination = (
            self.workspace / f"{repository_name}-{scan_id}"
        ).resolve()

        if self.workspace not in destination.parents:
            raise ValueError(
                "Invalid repository workspace destination."
            )

        self._clone_repository(url, destination)

        analysis_errors: list[dict[str, str]] = []
        analysis_status = "completed"

        files = self._count_files(destination)

        package_manager_details = (
            self._detect_package_manager_details(destination)
        )

        package_manager = package_manager_details["package_manager"]
        package_manager_evidence = (
            package_manager_details["package_manager_evidence"]
        )
        lockfile_found = package_manager_details["lockfile_found"]
        lockfile_type = package_manager_details["lockfile_type"]

        database = self._detect_database(destination)
        package_manager = package_manager_details["package_manager"]
        database = self._detect_database(destination)
        api_routes = self._count_api_routes(destination)
        docker, github_actions = self._detect_infrastructure(
            destination
        )

        fingerprint: dict[str, Any] = {}
        framework_analysis: dict[str, Any] = {}
        dependency_analysis: dict[str, Any] = {}
        vulnerability_analysis: dict[str, Any] = {}

        def run_engine(name: str, operation):
            nonlocal analysis_status

            try:
                return operation()
            except Exception as exc:
                analysis_status = "partial"
                analysis_errors.append(
                    {
                        "engine": name,
                        "error": (
                            f"{type(exc).__name__}: {exc}"
                        )[:1000],
                    }
                )
                return None

        # Repository fingerprint.
        fingerprint_result = run_engine(
            "repository_fingerprint",
            lambda: RepositoryFingerprintEngine(
                destination
            ).build(),
        )

        if fingerprint_result is not None:
            serialized = self._serialize_result(
                fingerprint_result
            )
            fingerprint = (
                serialized
                if isinstance(serialized, dict)
                else {"result": serialized}
            )

        # Framework detection.
        framework_result = run_engine(
            "framework_detector",
            lambda: FrameworkDetector(destination).detect(),
        )

        if framework_result is not None:
            serialized_framework = self._serialize_result(
                framework_result
            )

            # Preserve a consistent wrapper while keeping the actual
            # detector output as structured JSON, not a repr string.
            framework_analysis = {
                "result": serialized_framework
            }

        # Dependency analysis.
        dependency_result = run_engine(
            "dependency_analyzer",
            lambda: DependencyAnalyzer(destination).analyze(),
        )

        if dependency_result is not None:
            serialized_dependencies = self._serialize_result(
                dependency_result
            )
            dependency_analysis = (
                serialized_dependencies
                if isinstance(serialized_dependencies, dict)
                else {"result": serialized_dependencies}
            )

        # Vulnerability scan, based on dependency analysis.
        if dependency_analysis:
            vulnerability_result = run_engine(
                "vulnerability_scanner",
                lambda: VulnerabilityScanner().scan(
                    dependency_analysis
                ),
            )

            if vulnerability_result is not None:
                serialized_vulnerabilities = (
                    self._serialize_result(vulnerability_result)
                )
                vulnerability_analysis = (
                    serialized_vulnerabilities
                    if isinstance(
                        serialized_vulnerabilities,
                        dict,
                    )
                    else {
                        "result": serialized_vulnerabilities
                    }
                )

        languages = (
            self._extract_languages(fingerprint)
            or self._detect_languages(destination)
        )

        framework = self._extract_framework(
            framework_analysis
        )

        # The cloned repository is retained for this workflow.
        # Add a retention/cleanup policy before exposing this publicly.
        return RepositoryMetadata(
            name=repository_name,
            url=url,
            framework=framework,
            languages=languages,
            package_manager=package_manager,
            package_manager_evidence=package_manager_evidence,
            lockfile_found=lockfile_found,
            lockfile_type=lockfile_type,
            database=database,
            files=files,
            api_routes=api_routes,
            docker=docker,
            github_actions=github_actions,
            fingerprint=fingerprint,
            framework_analysis=framework_analysis,
            dependency_analysis=dependency_analysis,
            vulnerability_analysis=vulnerability_analysis,
            analysis_status=analysis_status,
            analysis_errors=analysis_errors,

        )


repository_service = RepositoryService()
