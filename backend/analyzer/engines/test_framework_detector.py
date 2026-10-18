
from pathlib import Path

from engines.framework_detector import FrameworkDetector


ROOT = Path(__file__).resolve().parents[2]


def test_detects_sentinelflow_frontend():
    results = FrameworkDetector(ROOT).detect()
    names = {result.name for result in results}

    assert "Next.js" in names

    nextjs = next(result for result in results if result.name == "Next.js")
    assert nextjs.confidence > 0
    assert nextjs.evidence
    assert any("next.config.ts" in item.path for item in nextjs.evidence)


def test_evidence_is_structured():
    results = FrameworkDetector(ROOT).detect()

    for result in results:
        assert 0.0 <= result.confidence <= 1.0
        assert result.category
        assert result.evidence
        assert all(item.path for item in result.evidence)