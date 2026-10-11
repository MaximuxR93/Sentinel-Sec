from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from collections import Counter
from typing import Iterable


IGNORED_DIRECTORIES = {
    ".git",
    ".next",
    "node_modules",
    "dist",
    "build",
    "out",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "coverage",
    ".turbo",
    ".cache",
}


@dataclass
class RepositoryFingerprint:
    root: str
    files: int = 0
    directories: int = 0
    total_bytes: int = 0

    languages: list[str] = field(default_factory=list)
    extensions: dict[str, int] = field(default_factory=dict)

    important_files: list[str] = field(default_factory=list)
    important_directories: list[str] = field(default_factory=list)


class RepositoryFingerprintEngine:
    """
    Builds a deterministic fingerprint of a source repository.

    This engine does not attempt to understand the application yet.
    Its job is to establish reliable filesystem-level evidence that
    later detectors can consume.
    """

    EXTENSION_LANGUAGE_MAP = {
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".js": "JavaScript",
        ".jsx": "JavaScript",
        ".mjs": "JavaScript",
        ".cjs": "JavaScript",

        ".py": "Python",

        ".java": "Java",
        ".kt": "Kotlin",
        ".kts": "Kotlin",

        ".go": "Go",
        ".rs": "Rust",

        ".c": "C",
        ".h": "C",
        ".cpp": "C++",
        ".cc": "C++",
        ".hpp": "C++",

        ".cs": "C#",
        ".php": "PHP",
        ".rb": "Ruby",
        ".swift": "Swift",

        ".sql": "SQL",

        ".vue": "Vue",
        ".svelte": "Svelte",
    }

    IMPORTANT_FILES = {
        "package.json",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "bun.lock",
        "bun.lockb",

        "requirements.txt",
        "requirements-dev.txt",
        "pyproject.toml",
        "Pipfile",
        "Pipfile.lock",
        "poetry.lock",

        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",

        "next.config.js",
        "next.config.mjs",
        "next.config.ts",

        "vite.config.js",
        "vite.config.ts",

        "tsconfig.json",
        "jsconfig.json",

        "manage.py",
        "pom.xml",
        "build.gradle",
        "Cargo.toml",
        "go.mod",

        ".env",
        ".env.example",

        "README.md",
    }

    IMPORTANT_DIRECTORIES = {
        "src",
        "app",
        "pages",
        "api",
        "components",
        "services",
        "controllers",
        "routes",
        "models",
        "schemas",
        "middleware",
        "config",
        "lib",
        "utils",
        "tests",
        "test",
        "docs",
        "infra",
        "deploy",
        "scripts",
    }

    def __init__(self, root: str | Path):
        self.root = Path(root).resolve()

        if not self.root.exists():
            raise FileNotFoundError(
                f"Repository path does not exist: {self.root}"
            )

        if not self.root.is_dir():
            raise NotADirectoryError(
                f"Repository path is not a directory: {self.root}"
            )

    def _iter_files(self) -> Iterable[Path]:
        for path in self.root.rglob("*"):
            if not path.is_file():
                continue

            relative_parts = path.relative_to(self.root).parts

            if any(part in IGNORED_DIRECTORIES for part in relative_parts):
                continue

            yield path

    def _detect_languages(
        self,
        files: list[Path],
    ) -> tuple[list[str], dict[str, int]]:
        language_counts = Counter()
        extension_counts = Counter()

        for file in files:
            suffix = file.suffix.lower()

            if suffix:
                extension_counts[suffix] += 1

            language = self.EXTENSION_LANGUAGE_MAP.get(suffix)

            if language:
                language_counts[language] += 1

        languages = [
            language
            for language, _ in language_counts.most_common()
        ]

        return languages, dict(extension_counts)

    def _find_important_files(
        self,
        files: list[Path],
    ) -> list[str]:
        result = []

        for file in files:
            if file.name in self.IMPORTANT_FILES:
                result.append(
                    file.relative_to(self.root).as_posix()
                )

        return sorted(result)

    def _find_important_directories(self) -> list[str]:
        result = []

        for path in self.root.rglob("*"):
            if not path.is_dir():
                continue

            relative = path.relative_to(self.root)

            if any(
                part in IGNORED_DIRECTORIES
                for part in relative.parts
            ):
                continue

            if path.name in self.IMPORTANT_DIRECTORIES:
                result.append(relative.as_posix())

        return sorted(result)

    def build(self) -> RepositoryFingerprint:
        files = list(self._iter_files())

        total_bytes = 0

        for file in files:
            try:
                total_bytes += file.stat().st_size
            except OSError:
                continue

        languages, extensions = self._detect_languages(files)

        directories = set()

        for file in files:
            relative = file.relative_to(self.root)

            for parent in relative.parents:
                if str(parent) != ".":
                    directories.add(parent)

        return RepositoryFingerprint(
            root=str(self.root),
            files=len(files),
            directories=len(directories),
            total_bytes=total_bytes,
            languages=languages,
            extensions=extensions,
            important_files=self._find_important_files(files),
            important_directories=self._find_important_directories(),
        )