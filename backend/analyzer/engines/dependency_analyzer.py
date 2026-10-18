from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any

from parsers.package_json import (
    parse_package_json,
    parse_package_lock,
)

from parsers.python_project import (
    parse_pyproject,
    parse_requirements,
)


IGNORED_DIRECTORIES = {
    ".git",
    ".github",
    ".next",
    ".venv",
    "venv",
    "env",
    "node_modules",
    "__pycache__",
    "dist",
    "build",
    "coverage",
}


LOCKFILE_NAMES = {
    "package-lock.json": "npm",
    "npm-shrinkwrap.json": "npm",
    "pnpm-lock.yaml": "npm",
    "yarn.lock": "npm",
    "poetry.lock": "pypi",
    "uv.lock": "pypi",
    "Pipfile.lock": "pypi",
}


class DependencyAnalyzer:
    """
    Analyze dependency declarations and lockfile evidence.

    The analyzer keeps declared dependencies separate from lockfile
    packages and resolves exact versions only when the lockfile
    provides sufficient evidence.
    """

    def __init__(self, repo_path: str | Path):
        self.repo_path = Path(repo_path)

    # ============================================================
    # PUBLIC API
    # ============================================================

    def analyze(self) -> dict[str, Any]:
        """Analyze dependency manifests and lockfiles."""

        declarations: list[dict[str, Any]] = []
        locked_packages: list[dict[str, Any]] = []
        errors: list[dict[str, str]] = []

        manifest_paths: list[str] = []
        lockfile_paths: list[str] = []

        # --------------------------------------------------------
        # Discover dependency files
        # --------------------------------------------------------

        for path in self._iter_files():
            filename = path.name

            if filename == "package.json":
                manifest_paths.append(
                    path.as_posix()
                )

            elif filename in {
                "requirements.txt",
                "pyproject.toml",
            }:
                manifest_paths.append(
                    path.as_posix()
                )

            elif filename in LOCKFILE_NAMES:
                lockfile_paths.append(
                    path.as_posix()
                )

        # --------------------------------------------------------
        # Parse manifests
        # --------------------------------------------------------

        for manifest in manifest_paths:
            path = Path(manifest)

            try:
                parsed_items: list[dict[str, Any]] = []
                if path.name == "package.json":
                    parsed_items = parse_package_json(path)
                elif path.name == "requirements.txt":
                    parsed_items = parse_requirements(path)
                elif path.name == "pyproject.toml":
                    parsed_items = parse_pyproject(path)

                for item in parsed_items:
                    if "evidence" in item and isinstance(item["evidence"], dict):
                        ev_path = item["evidence"].get("path")
                        if ev_path:
                            try:
                                item["evidence"]["path"] = Path(ev_path).relative_to(self.repo_path).as_posix()
                            except (ValueError, TypeError):
                                pass
                declarations.extend(parsed_items)

            except Exception as exc:
                errors.append(
                    {
                        "stage": "manifest_parse",
                        "path": manifest,
                        "error": str(exc),
                    }
                )

        # --------------------------------------------------------
        # Parse lockfiles
        # --------------------------------------------------------

        for lockfile in lockfile_paths:
            path = Path(lockfile)
            ecosystem = LOCKFILE_NAMES.get(path.name)

            try:
                if (
                    ecosystem == "npm"
                    and path.name in {
                        "package-lock.json",
                        "npm-shrinkwrap.json",
                    }
                ):
                    locked_packages.extend(
                        parse_package_lock(path)
                    )

                # Python lockfile parsing is not implemented yet.
                elif ecosystem == "pypi":
                    continue

            except Exception as exc:
                errors.append(
                    {
                        "stage": "lockfile_parse",
                        "path": lockfile,
                        "error": str(exc),
                    }
                )

        # --------------------------------------------------------
        # Resolve declarations against lockfiles
        # --------------------------------------------------------

        resolved_dependencies = (
            self._resolve_dependencies(
                declarations,
                locked_packages,
            )
        )

        # --------------------------------------------------------
        # Deduplicate dependencies
        # --------------------------------------------------------

        dependencies = (
            self._deduplicate_dependencies(
                resolved_dependencies
            )
        )

        # --------------------------------------------------------
        # Statistics
        # --------------------------------------------------------

        resolved_count = sum(
            1
            for dependency in dependencies
            if dependency.get("resolved_version")
        )

        unresolved_count = (
            len(dependencies) - resolved_count
        )

        ecosystems = sorted(
            {
                str(item.get("ecosystem"))
                for item in dependencies
                if item.get("ecosystem")
            }
        )

        package_managers = sorted(
            {
                self._package_manager_for_ecosystem(
                    item.get("ecosystem")
                )
                for item in dependencies
                if self._package_manager_for_ecosystem(
                    item.get("ecosystem")
                )
            }
        )

        ecosystem_counts: dict[str, int] = defaultdict(int)
        for item in declarations:
            eco = item.get("ecosystem")
            if eco:
                ecosystem_counts[eco] += 1

        summary = {
            "total_declared": len(declarations),
            "total_dependencies": len(dependencies),
            "resolved_dependencies": resolved_count,
            "unresolved_dependencies": unresolved_count,
            "ecosystems": ecosystems,
            "package_managers": package_managers,
            **ecosystem_counts,
        }

        return {
            "summary": summary,
            "total_dependencies": len(dependencies),
            "resolved_dependencies": resolved_count,
            "unresolved_dependencies": unresolved_count,
            "ecosystems": ecosystems,
            "package_managers": package_managers,
            "dependencies": dependencies,
            "lockfile_packages": locked_packages,
            "manifest_files": sorted(manifest_paths),
            "lockfiles": sorted(lockfile_paths),
            "errors": errors,
        }

    # ============================================================
    # FILE DISCOVERY
    # ============================================================

    def _iter_files(self):
        """Yield repository files while skipping generated directories."""

        if not self.repo_path.exists():
            return

        for path in self.repo_path.rglob("*"):
            if not path.is_file():
                continue

            try:
                relative_parts = path.relative_to(
                    self.repo_path
                ).parts
            except ValueError:
                continue

            if any(
                part in IGNORED_DIRECTORIES
                for part in relative_parts
            ):
                continue

            yield path

    # ============================================================
    # DEPENDENCY RESOLUTION
    # ============================================================

    def _resolve_dependencies(
        self,
        declarations: list[dict[str, Any]],
        locked: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Resolve declared dependencies against lockfile evidence.

        npm direct dependencies are matched against:

            node_modules/<package>

        using evidence["package_path"].
        """

        lock_index: dict[
            tuple[str, str],
            list[dict[str, Any]],
        ] = defaultdict(list)

        for item in locked:
            ecosystem = str(
                item.get("ecosystem", "")
            ).lower()

            name = item.get("name")

            if not ecosystem:
                continue

            if not isinstance(name, str) or not name:
                continue

            lock_index[
                (
                    ecosystem,
                    name.lower(),
                )
            ].append(item)

        resolved: list[dict[str, Any]] = []

        for declaration in declarations:
            item = dict(declaration)

            ecosystem = str(
                item.get("ecosystem", "")
            ).lower()

            name = item.get("name")

            if not isinstance(name, str) or not name:
                resolved.append(item)
                continue

            candidates = lock_index.get(
                (
                    ecosystem,
                    name.lower(),
                ),
                [],
            )

            resolved_version: str | None = None

            # ----------------------------------------------------
            # npm
            # ----------------------------------------------------

            if ecosystem == "npm":
                resolved_version = (
                    self._find_npm_root_version(
                        declaration=item,
                        locked=candidates,
                    )
                )

                # Safe fallback when exactly one version exists.
                if resolved_version is None:
                    resolved_version = (
                        self._find_unique_version(
                            candidates
                        )
                    )

            # ----------------------------------------------------
            # PyPI
            # ----------------------------------------------------

            elif ecosystem == "pypi":
                resolved_version = (
                    self._find_unique_version(
                        candidates
                    )
                )

            if resolved_version:
                item["resolved_version"] = (
                    resolved_version
                )

                item["resolution"] = {
                    "source": "lockfile",
                    "confidence": "exact",
                }

            else:
                item["resolved_version"] = None

                item["resolution"] = {
                    "source": None,
                    "confidence": "unresolved",
                }

            resolved.append(item)

        return resolved

    # ============================================================
    # NPM ROOT VERSION RESOLUTION
    # ============================================================

    @staticmethod
    def _find_npm_root_version(
        declaration: dict[str, Any],
        locked: list[dict[str, Any]],
    ) -> str | None:
        """
        Resolve an npm dependency against the root package-lock
        installation path.

        Examples:

            node_modules/react
            node_modules/next
            node_modules/@tanstack/react-query
        """

        name = declaration.get("name")

        if not isinstance(name, str) or not name:
            return None

        expected_path = (
            f"node_modules/{name}"
        )

        candidates: list[
            dict[str, Any]
        ] = []

        for item in locked:
            if str(
                item.get("ecosystem", "")
            ).lower() != "npm":
                continue

            if str(
                item.get("name", "")
            ).lower() != name.lower():
                continue

            evidence = item.get(
                "evidence",
                {},
            )

            if not isinstance(evidence, dict):
                continue

            package_path = str(
                evidence.get(
                    "package_path",
                    "",
                )
            ).replace(
                "\\",
                "/",
            ).strip("/")

            if package_path == expected_path:
                candidates.append(item)

        if len(candidates) != 1:
            return None

        resolved_version = candidates[0].get(
            "resolved_version"
        )

        if (
            isinstance(
                resolved_version,
                str,
            )
            and resolved_version
        ):
            return resolved_version

        return None

    # ============================================================
    # UNIQUE VERSION
    # ============================================================

    @staticmethod
    def _find_unique_version(
        candidates: list[dict[str, Any]],
    ) -> str | None:
        """Return a version only when exactly one exists."""

        versions = {
            str(item.get("resolved_version"))
            for item in candidates
            if item.get("resolved_version")
        }

        if len(versions) == 1:
            return next(iter(versions))

        return None

    # ============================================================
    # DEDUPLICATION
    # ============================================================

    @staticmethod
    def _deduplicate_dependencies(
        dependencies: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Deduplicate dependency declarations without losing
        resolution information.
        """

        unique: dict[
            tuple[str, str, str, str],
            dict[str, Any],
        ] = {}

        for dependency in dependencies:
            name = str(
                dependency.get(
                    "name",
                    "",
                )
            )

            ecosystem = str(
                dependency.get(
                    "ecosystem",
                    "",
                )
            ).lower()

            declared_version = str(
                dependency.get(
                    "declared_version",
                    "",
                )
            )

            evidence = dependency.get(
                "evidence",
                {},
            )

            if isinstance(evidence, dict):
                path = str(
                    evidence.get(
                        "path",
                        "",
                    )
                )
            else:
                path = ""

            key = (
                ecosystem,
                name.lower(),
                declared_version,
                path,
            )

            existing = unique.get(key)

            if existing is None:
                unique[key] = dependency
                continue

            if (
                not existing.get(
                    "resolved_version"
                )
                and dependency.get(
                    "resolved_version"
                )
            ):
                existing["resolved_version"] = (
                    dependency[
                        "resolved_version"
                    ]
                )

                existing["resolution"] = (
                    dependency.get(
                        "resolution",
                        existing.get(
                            "resolution"
                        ),
                    )
                )

        return list(
            unique.values()
        )

    # ============================================================
    # PACKAGE MANAGER
    # ============================================================

    @staticmethod
    def _package_manager_for_ecosystem(
        ecosystem: Any,
    ) -> str | None:
        """Map dependency ecosystem to its package manager."""

        ecosystem = str(
            ecosystem or ""
        ).lower()

        if ecosystem == "npm":
            return "npm"

        if ecosystem == "pypi":
            return "pip"

        return None