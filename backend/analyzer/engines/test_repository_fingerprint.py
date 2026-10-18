from pathlib import Path

from engines.repository_fingerprint import RepositoryFingerprintEngine


ROOT = Path(__file__).resolve().parents[2]


def test_sentinelflow_fingerprint():
    engine = RepositoryFingerprintEngine(ROOT)

    result = engine.build()

    assert result.files > 0
    assert result.directories > 0
    assert result.languages

    print("\nLanguages:", result.languages)
    print("Files:", result.files)
    print("Important files:", result.important_files)
    print("Important directories:", result.important_directories)