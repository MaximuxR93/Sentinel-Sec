
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class FrameworkEvidence:
    type: str
    path: str
    reason: str


@dataclass
class FrameworkResult:
    name: str
    category: str
    confidence: float
    evidence: list[FrameworkEvidence] = field(default_factory=list)
    contradictions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class FrameworkDetector:
    """
    Detect application frameworks using repository manifests,
    configuration files, and conventional project structure.

    Confidence is a heuristic evidence score, not a probability.
    """

    MANIFESTS = {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "Pipfile",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "Cargo.toml",
        "go.mod",
    }

    IGNORE_DIRS = {
        ".git", ".next", "node_modules", "dist", "build",
        "out", ".venv", "venv", "__pycache__", ".pytest_cache",
    }

    # Framework dependency -> display name, category
    JS_FRAMEWORKS = {
        "next": ("Next.js", "fullstack"),
        "react": ("React", "frontend"),
        "vite": ("Vite", "build-tool"),
        "express": ("Express", "backend"),
        "fastify": ("Fastify", "backend"),
        "@nestjs/core": ("NestJS", "backend"),
        "@angular/core": ("Angular", "frontend"),
        "vue": ("Vue", "frontend"),
        "svelte": ("Svelte", "frontend"),
        "nuxt": ("Nuxt", "fullstack"),
        "astro": ("Astro", "frontend"),
        "gatsby": ("Gatsby", "frontend"),
        "electron": ("Electron", "desktop"),
    }

    PYTHON_FRAMEWORKS = {
        "fastapi": ("FastAPI", "backend"),
        "django": ("Django", "backend"),
        "flask": ("Flask", "backend"),
        "starlette": ("Starlette", "backend"),
        "streamlit": ("Streamlit", "frontend"),
        "gradio": ("Gradio", "frontend"),
        "dash": ("Dash", "frontend"),
    }

    def __init__(self, root: str | Path):
        self.root = Path(root).resolve()
        if not self.root.is_dir():
            raise NotADirectoryError(f"Invalid repository directory: {self.root}")

    def _iter_files(self):
        for path in self.root.rglob("*"):
            if not path.is_file():
                continue
            relative = path.relative_to(self.root)
            if any(part in self.IGNORE_DIRS for part in relative.parts):
                continue
            yield path

    def _relative(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            return {}

    @staticmethod
    def _read_text(path: Path) -> str:
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return ""

    def _find_files(self) -> list[Path]:
        return list(self._iter_files())

    def _detect(self, files: list[Path]) -> list[FrameworkResult]:
        evidence: dict[str, list[FrameworkEvidence]] = {}
        categories: dict[str, str] = {}
        contradictions: dict[str, list[str]] = {}

        def add(name: str, category: str, kind: str, path: Path, reason: str):
            evidence.setdefault(name, []).append(
                FrameworkEvidence(kind, self._relative(path), reason)
            )
            categories[name] = category

        for path in files:
            filename = path.name.lower()

            if filename == "package.json":
                data = self._read_json(path)
                deps = {}

                for key in ("dependencies", "devDependencies", "peerDependencies"):
                    value = data.get(key, {})
                    if isinstance(value, dict):
                        deps.update(value)

                for package, (name, category) in self.JS_FRAMEWORKS.items():
                    if package in deps:
                        add(
                            name, category, "dependency", path,
                            f"package.json declares {package}"
                        )

                # Detect when the repository itself is a framework.
                if path.parent == self.root:
                    package_name = str(data.get("name", "")).strip().lower()

                    if package_name in self.JS_FRAMEWORKS:
                        name, category = self.JS_FRAMEWORKS[package_name]
                        add(
                            name,
                            category,
                            "package_identity",
                            path,
                            f"Root package.json identifies this repository as {name}"
                        )

                scripts = data.get("scripts", {})
                if isinstance(scripts, dict):
                    script_text = " ".join(
                        str(value) for value in scripts.values()
                    ).lower()
                    if "next dev" in script_text and "Next.js" not in evidence:
                        add(
                            "Next.js", "fullstack", "script", path,
                            "package script invokes next dev"
                        )

            elif filename in {"requirements.txt", "pyproject.toml", "pipfile"}:
                content = self._read_text(path).lower()

                for package, (name, category) in self.PYTHON_FRAMEWORKS.items():
                    # Match common dependency declaration forms.
                    import re
                    pattern = rf"(?m)^\\s*{re.escape(package)}\\s*(?:[<>=!~\\[]|$)"
                    if re.search(pattern, content):
                        add(
                            name, category, "dependency", path,
                            f"{filename} declares {package}"
                        )

            elif filename == "manage.py":
                add(
                    "Django", "backend", "entrypoint", path,
                    "Django manage.py entrypoint detected"
                )

            elif filename in {"pom.xml", "build.gradle", "build.gradle.kts"}:
                content = self._read_text(path).lower()
                if "spring-boot" in content or "springboot" in content:
                    add(
                        "Spring Boot", "backend", "build-config", path,
                        "Spring Boot dependency or plugin detected"
                    )

            elif filename == "cargo.toml":
                content = self._read_text(path).lower()
                if "actix-web" in content:
                    add(
                        "Actix Web", "backend", "dependency", path,
                        "Cargo.toml declares actix-web"
                    )
                if "axum" in content:
                    add(
                        "Axum", "backend", "dependency", path,
                        "Cargo.toml declares axum"
                    )

            elif filename == "go.mod":
                content = self._read_text(path).lower()
                if "github.com/gin-gonic/gin" in content:
                    add("Gin", "backend", "dependency", path, "go.mod declares Gin")
                if "github.com/labstack/echo" in content:
                    add("Echo", "backend", "dependency", path, "go.mod declares Echo")

        # Structural evidence, kept separate from dependency evidence.
        file_names = {path.name.lower() for path in files}
        dir_names = {
            part.lower()
            for path in files
            for part in path.relative_to(self.root).parts[:-1]
        }

        for path in files:
            if path.name in {"next.config.js", "next.config.mjs", "next.config.ts"}:
                add(
                    "Next.js", "fullstack", "configuration", path,
                    "Next.js configuration file detected"
                )
            if path.name in {"vite.config.js", "vite.config.ts", "vite.config.mjs"}:
                add(
                    "Vite", "build-tool", "configuration", path,
                    "Vite configuration file detected"
                )
            if path.name in {"angular.json"}:
                add(
                    "Angular", "frontend", "configuration", path,
                    "Angular workspace configuration detected"
                )
            if path.name in {"nuxt.config.js", "nuxt.config.ts"}:
                add(
                    "Nuxt", "fullstack", "configuration", path,
                    "Nuxt configuration file detected"
                )
            if path.name in {"astro.config.mjs", "astro.config.ts"}:
                add(
                    "Astro", "frontend", "configuration", path,
                    "Astro configuration file detected"
                )

        results = []
        for name, items in sorted(evidence.items()):
            unique = {
                (item.type, item.path, item.reason): item
                for item in items
            }
            items = list(unique.values())

            # Heuristic score: independent evidence types increase confidence.
            types = {item.type for item in items}
            score = min(1.0, 0.45 + 0.25 * (len(types) - 1))
            if len(items) >= 3:
                score = max(score, 0.95)

            conflicts = []
            if name == "Next.js" and "Vite" in evidence:
                conflicts.append(
                    "Vite configuration/dependency also detected; "
                    "the repository may contain multiple applications."
                )
            if name == "React" and "Vue" in evidence:
                conflicts.append(
                    "Vue and React both detected; inspect app boundaries."
                )

            results.append(
                FrameworkResult(
                    name=name,
                    category=categories[name],
                    confidence=round(score, 2),
                    evidence=sorted(items, key=lambda item: (item.path, item.type)),
                    contradictions=conflicts,
                )
            )

        return results

    def detect(self) -> list[FrameworkResult]:
        return self._detect(self._find_files())