from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DEPENDENCY_SECTIONS = {
    "dependencies": "production",
    "devDependencies": "development",
    "optionalDependencies": "optional",
    "peerDependencies": "peer",
}


def parse_package_json(
    path: str | Path,
) -> list[dict[str, Any]]:
    """Extract dependency declarations from an npm package.json manifest."""
    manifest = Path(path)

    try:
        data = json.loads(
            manifest.read_text(encoding="utf-8")
        )
    except (
        OSError,
        UnicodeDecodeError,
        json.JSONDecodeError,
    ) as exc:
        raise ValueError(
            f"Unable to parse {manifest}: {exc}"
        ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            f"Expected a JSON object in {manifest}"
        )

    results: list[dict[str, Any]] = []

    for section, dependency_type in DEPENDENCY_SECTIONS.items():
        dependencies = data.get(section, {})

        if not isinstance(dependencies, dict):
            continue

        for package_name, version in sorted(
            dependencies.items()
        ):
            if not isinstance(package_name, str):
                continue

            if not package_name:
                continue

            if not isinstance(version, str):
                continue

            if not version:
                continue

            results.append(
                {
                    "name": package_name,
                    "ecosystem": "npm",
                    "declared_version": version,
                    "resolved_version": None,
                    "dependency_type": dependency_type,
                    "direct": True,
                    "evidence": {
                        "path": manifest.as_posix(),
                        "section": section,
                    },
                }
            )

    return results


def parse_package_lock(
    path: str | Path,
) -> list[dict[str, Any]]:
    """
    Extract resolved npm package versions from package-lock.json.

    Supports npm lockfile versions 1, 2, and 3.

    For lockfile v2/v3, npm installation paths are preserved
    in evidence["package_path"] so the dependency analyzer
    can distinguish root dependencies from nested dependencies.
    """
    lockfile = Path(path)

    try:
        data = json.loads(
            lockfile.read_text(encoding="utf-8")
        )
    except (
        OSError,
        UnicodeDecodeError,
        json.JSONDecodeError,
    ) as exc:
        raise ValueError(
            f"Unable to parse {lockfile}: {exc}"
        ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            f"Expected a JSON object in {lockfile}"
        )

    lockfile_version = data.get("lockfileVersion")

    if lockfile_version not in (1, 2, 3):
        raise ValueError(
            "Unsupported npm lockfile version: "
            f"{lockfile_version!r}"
        )

    results: list[dict[str, Any]] = []

    def add_package(
        name: str,
        details: dict[str, Any],
        package_path: str,
    ) -> None:
        """Add one resolved package from the lockfile."""
        version = details.get("version")

        if not isinstance(version, str):
            return

        if not version:
            return

        results.append(
            {
                "name": name,
                "ecosystem": "npm",
                "declared_version": None,
                "resolved_version": version,
                "dependency_type": "lockfile",
                "direct": False,
                "evidence": {
                    # Physical lockfile containing the record.
                    "path": lockfile.as_posix(),

                    # Actual npm installation path.
                    "package_path": package_path,
                },
            }
        )

    # ============================================================
    # npm package-lock v2 / v3
    # ============================================================

    packages = data.get("packages")

    if isinstance(packages, dict):
        for package_path, details in sorted(
            packages.items()
        ):
            if not isinstance(package_path, str):
                continue

            if not isinstance(details, dict):
                continue

            marker = "node_modules/"

            if marker not in package_path:
                continue

            # Everything after the LAST node_modules/ represents
            # the installed package name.
            #
            # Examples:
            #
            # node_modules/react
            # -> react
            #
            # node_modules/@tanstack/react-query
            # -> @tanstack/react-query
            #
            # node_modules/foo/node_modules/bar
            # -> bar

            name = package_path.rsplit(
                marker,
                1,
            )[-1]

            if not name:
                continue

            add_package(
                name=name,
                details=details,
                package_path=package_path,
            )

    # ============================================================
    # npm package-lock v1
    # ============================================================

    elif isinstance(data.get("dependencies"), dict):

        def walk_dependencies(
            dependencies: dict[str, Any],
            parent_path: str = "",
        ) -> None:
            for name, details in sorted(
                dependencies.items()
            ):
                if not isinstance(name, str):
                    continue

                if not isinstance(details, dict):
                    continue

                if parent_path:
                    package_path = (
                        f"{parent_path}/node_modules/{name}"
                    )
                else:
                    package_path = (
                        f"node_modules/{name}"
                    )

                add_package(
                    name=name,
                    details=details,
                    package_path=package_path,
                )

                nested = details.get("dependencies")

                if isinstance(nested, dict):
                    walk_dependencies(
                        nested,
                        package_path,
                    )

        walk_dependencies(
            data["dependencies"]
        )

    else:
        raise ValueError(
            "npm lockfile contains neither a packages "
            "nor dependencies object"
        )

    return results