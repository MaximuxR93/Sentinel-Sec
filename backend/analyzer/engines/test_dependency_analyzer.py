from __future__ import annotations

import json

from engines.dependency_analyzer import DependencyAnalyzer
from parsers.package_json import parse_package_json, parse_package_lock
from parsers.python_project import parse_requirements, parse_pyproject


def test_parse_npm_manifest(tmp_path):
    manifest = tmp_path / "package.json"

    manifest.write_text(
        json.dumps(
            {
                "dependencies": {"react": "^19.0.0"},
                "devDependencies": {"vite": "^6.0.0"},
            }
        ),
        encoding="utf-8",
    )

    result = parse_package_json(manifest)

    assert len(result) == 2
    assert result[0]["ecosystem"] == "npm"
    assert all(item["direct"] for item in result)


def test_parse_npm_lockfile(tmp_path):
    lockfile = tmp_path / "package-lock.json"

    lockfile.write_text(
        json.dumps(
            {
                "lockfileVersion": 3,
                "packages": {
                    "": {"name": "sample"},
                    "node_modules/react": {"version": "19.0.0"},
                    "node_modules/@scope/pkg": {"version": "2.1.0"},
                },
            }
        ),
        encoding="utf-8",
    )

    result = parse_package_lock(lockfile)

    assert {item["name"] for item in result} == {
        "react",
        "@scope/pkg",
    }

    assert all(item["resolved_version"] for item in result)


def test_parse_python_requirements(tmp_path):
    requirements = tmp_path / "requirements.txt"

    requirements.write_text(
        "fastapi>=0.100\n"
        "uvicorn==0.30.0\n"
        "# comment\n"
        "-r extra.txt\n",
        encoding="utf-8",
    )

    result = parse_requirements(requirements)

    assert {item["name"] for item in result} == {
        "fastapi",
        "uvicorn",
    }

    assert all(item["ecosystem"] == "pypi" for item in result)


def test_parse_pyproject(tmp_path):
    project = tmp_path / "pyproject.toml"

    project.write_text(
        "[project]\n"
        'dependencies = ["fastapi>=0.100", "pydantic>=2"]\n'
        "[project.optional-dependencies]\n"
        'dev = ["pytest>=8"]\n',
        encoding="utf-8",
    )

    result = parse_pyproject(project)

    assert {item["name"] for item in result} == {
        "fastapi",
        "pydantic",
        "pytest",
    }


def test_analyzer_collects_manifest_evidence(tmp_path):
    (tmp_path / "package.json").write_text(
        json.dumps(
            {
                "dependencies": {
                    "react": "^19.0.0",
                },
            }
        ),
        encoding="utf-8",
    )

    (tmp_path / "package-lock.json").write_text(
        json.dumps(
            {
                "lockfileVersion": 3,
                "packages": {
                    "": {"name": "sample"},
                    "node_modules/react": {
                        "version": "19.0.0",
                    },
                },
            }
        ),
        encoding="utf-8",
    )

    (tmp_path / "requirements.txt").write_text(
        "fastapi==0.115.0\n",
        encoding="utf-8",
    )

    result = DependencyAnalyzer(tmp_path).analyze()

    assert result["summary"]["total_declared"] == 2
    assert result["summary"]["npm"] == 1
    assert result["summary"]["pypi"] == 1

    react = next(
        item
        for item in result["dependencies"]
        if item["name"] == "react"
    )

    assert react["resolved_version"] == "19.0.0"
    assert react["evidence"]["path"] == "package.json"


def test_parse_npm_v1_lockfile(tmp_path):
    lockfile = tmp_path / "package-lock.json"

    lockfile.write_text(
        json.dumps(
            {
                "name": "example",
                "lockfileVersion": 1,
                "dependencies": {
                    "express": {
                        "version": "4.18.2",
                        "dependencies": {
                            "accepts": {
                                "version": "1.3.8",
                            },
                        },
                    },
                },
            }
        ),
        encoding="utf-8",
    )

    result = parse_package_lock(lockfile)

    versions = {
        (item["name"], item["resolved_version"])
        for item in result
    }

    assert ("express", "4.18.2") in versions
    assert ("accepts", "1.3.8") in versions