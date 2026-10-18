from __future__ import annotations

import re
from pathlib import Path
from typing import Any

try:
    import tomllib  # Python 3.11+
except ImportError:
    try:
        import tomli as tomllib  # type: ignore
    except ImportError:
        class _TomlFallback:
            class TOMLDecodeError(ValueError):
                pass

            @staticmethod
            def load(file_obj) -> dict[str, Any]:
                content = file_obj.read()
                if isinstance(content, bytes):
                    content = content.decode("utf-8", errors="replace")
                return _TomlFallback.loads(content)

            @staticmethod
            def loads(content: str) -> dict[str, Any]:
                data: dict[str, Any] = {}
                current_section: dict[str, Any] = data
                for raw_line in content.splitlines():
                    line = raw_line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if line.startswith("[") and line.endswith("]"):
                        section_name = line[1:-1].strip()
                        parts = section_name.split(".")
                        target = data
                        for part in parts:
                            target = target.setdefault(part.strip(), {})
                        current_section = target
                    elif "=" in line:
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip()
                        if val.startswith("[") and val.endswith("]"):
                            raw_items = val[1:-1].split(",")
                            cleaned = []
                            for it in raw_items:
                                it_str = it.strip().strip("'\"")
                                if it_str:
                                    cleaned.append(it_str)
                            current_section[key] = cleaned
                        else:
                            current_section[key] = val.strip("'\"")
                return data

        tomllib = _TomlFallback  # type: ignore


# Basic PEP 508-style requirement parsing.
#
# Examples:
#   requests
#   requests==2.31.0
#   requests>=2.0,<3.0
#   requests[security]>=2.0
#   requests[security]==2.31.0

_REQUIREMENT_RE = re.compile(
    r"^\s*"
    r"(?P<name>[A-Za-z0-9][A-Za-z0-9._-]*)"
    r"(?P<extras>\[[^\]]+\])?"
    r"\s*"
    r"(?P<specifier>.*)"
    r"$"
)


def _normalize_name(name: str) -> str:
    """
    Normalize Python package names according to common
    PyPI normalization rules.
    """
    return re.sub(r"[-_.]+", "-", name).lower()


def _make_dependency(
    name: str,
    specifier: str,
    source: Path,
    dependency_type: str,
) -> dict[str, Any]:
    return {
        "name": _normalize_name(name),
        "ecosystem": "pypi",
        "declared_version": specifier.strip(),
        "resolved_version": None,
        "dependency_type": dependency_type,
        "direct": True,
        "evidence": {
            "path": source.as_posix(),
        },
    }


def _parse_requirement(
    requirement: str,
    source: Path,
    dependency_type: str,
    line_number: int | None = None,
) -> dict[str, Any] | None:
    """
    Parse a single Python requirement.

    Returns None for:
    - empty requirements
    - pip options
    - VCS dependencies
    - URL/direct-reference dependencies
    - local paths
    - unsupported requirement syntax
    """

    line = requirement.split("#", 1)[0].strip()

    if not line:
        return None

    # pip options
    if line.startswith("-"):
        return None

    # VCS / URL / direct references
    if line.startswith(
        (
            "git+",
            "hg+",
            "svn+",
            "bzr+",
            "http://",
            "https://",
            "file://",
        )
    ):
        return None

    # Local / relative paths
    if line.startswith((".", "/")):
        return None

    match = _REQUIREMENT_RE.match(line)

    if not match:
        return None

    name = match.group("name")
    extras = match.group("extras")
    specifier = match.group("specifier").strip()

    # Direct references:
    #
    # package @ https://example.com/package.whl
    if " @ " in specifier or specifier.startswith("@"):
        return None

    dependency = _make_dependency(
        name,
        specifier,
        source,
        dependency_type,
    )

    dependency["extras"] = (
        [
            extra.strip()
            for extra in extras[1:-1].split(",")
            if extra.strip()
        ]
        if extras
        else []
    )

    if line_number is not None:
        dependency["evidence"]["line"] = line_number

    return dependency


def parse_requirements(
    path: str | Path,
) -> list[dict[str, Any]]:
    """Parse common pip requirements lines."""

    source = Path(path)
    results: list[dict[str, Any]] = []

    try:
        try:
            # Supports UTF-8 including BOM.
            content = source.read_text(
                encoding="utf-8-sig"
            )
        except UnicodeDecodeError:
            # Fallback for UTF-16 files.
            content = source.read_text(
                encoding="utf-16"
            )

    except (
        OSError,
        UnicodeDecodeError,
    ) as exc:
        raise ValueError(
            f"Unable to read {source}: {exc}"
        ) from exc

    lines = content.splitlines()

    for line_number, raw_line in enumerate(
        lines,
        start=1,
    ):
        dependency = _parse_requirement(
            raw_line,
            source,
            "requirements",
            line_number,
        )

        if dependency is not None:
            results.append(dependency)

    return results


def parse_pyproject(
    path: str | Path,
) -> list[dict[str, Any]]:
    """
    Parse PEP 621 project dependencies and common
    Poetry dependency groups.
    """

    source = Path(path)

    try:
        with source.open("rb") as file:
            data = tomllib.load(file)

    except (
        OSError,
        tomllib.TOMLDecodeError,
    ) as exc:
        raise ValueError(
            f"Unable to parse {source}: {exc}"
        ) from exc

    results: list[dict[str, Any]] = []

    # ============================================================
    # PEP 621
    # ============================================================

    project = data.get("project", {})

    if isinstance(project, dict):

        # Standard project dependencies.
        dependencies = project.get(
            "dependencies",
            [],
        )

        if isinstance(dependencies, list):

            for requirement in dependencies:

                if not isinstance(
                    requirement,
                    str,
                ):
                    continue

                dependency = _parse_requirement(
                    requirement,
                    source,
                    "project",
                )

                if dependency is not None:
                    results.append(
                        dependency
                    )

        # Optional dependency groups.
        optional = project.get(
            "optional-dependencies",
            {},
        )

        if isinstance(optional, dict):

            for group, requirements in optional.items():

                if not isinstance(
                    requirements,
                    list,
                ):
                    continue

                for requirement in requirements:

                    if not isinstance(
                        requirement,
                        str,
                    ):
                        continue

                    dependency = _parse_requirement(
                        requirement,
                        source,
                        f"optional:{group}",
                    )

                    if dependency is not None:
                        results.append(
                            dependency
                        )

    # ============================================================
    # Poetry
    # ============================================================

    tool = data.get(
        "tool",
        {},
    )

    if not isinstance(tool, dict):
        return results

    poetry = tool.get(
        "poetry",
        {},
    )

    if not isinstance(poetry, dict):
        return results

    poetry_sections = (
        (
            "poetry",
            poetry.get(
                "dependencies",
                {},
            ),
        ),
        (
            "poetry-dev",
            poetry.get(
                "dev-dependencies",
                {},
            ),
        ),
    )

    for dependency_type, section in poetry_sections:

        if not isinstance(section, dict):
            continue

        for name, value in section.items():

            # Poetry uses "python" for the Python
            # interpreter constraint.
            if str(name).lower() == "python":
                continue

            specifier = ""

            if isinstance(value, str):
                specifier = value

            elif isinstance(value, dict):
                version = value.get("version")

                if version is not None:
                    specifier = str(version)

            if (
                not specifier
                and not isinstance(
                    value,
                    (str, dict),
                )
            ):
                continue

            dependency = _make_dependency(
                str(name),
                specifier,
                source,
                dependency_type,
            )

            results.append(
                dependency
            )

    return results