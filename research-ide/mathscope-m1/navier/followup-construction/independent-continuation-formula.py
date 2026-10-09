"""Independent reconstruction of (4.16) from stored fields and five moment jets.

This deliberately does not import or translate the JS integratedState helper.
It uses the source identity after integrating Sn on PDF page 28.  The historical
v50-followup fixture is expected to reveal the -WU/X transcription error.
Use --expect-bug only for that preserved negative-control fixture; ordinary mode
exits nonzero unless every reported Ns agrees with the original identity.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def floats(value):
    if isinstance(value, dict):
        if value.get("kind") == "FLOAT64":
            return float(value["value"])
        return {k: floats(v) for k, v in value.items()}
    if isinstance(value, list):
        return [floats(x) for x in value]
    return value


def audit(path: Path) -> dict:
    doc = floats(json.loads(path.read_text()))
    examples = doc.get("examples", [{"id": "supplied-result", "result": doc}])
    checks = []
    for example in examples:
        result = example.get("result", {})
        if not result.get("slices") or "h" not in result.get("parameters", {}):
            continue
        h = result["parameters"]["h"]
        D, A = 0.5 - h, 0.5 + h
        for s in result["slices"]:
            eta = s["eta"]
            for i, row in enumerate(s.get("samples", [])):
                x, u, e = row["X"], row["U"], row["E"]
                m, _, _, ss, _ = row["moments"]
                dm = row["momentEtaJets"][0][1]
                ds = row["momentEtaJets"][3][1]
                pi, dpi = row["etaJets"]["Pi"][:2]
                d, L = 1 - eta * eta, 1 - 2 * h * eta * eta
                W = 1 - (2 * D * eta * m + d * dm) / x
                moment_term = (D * (m - eta * dm) + 4 * h * eta * ss - d * ds) / x
                pressure_term = 4 * A * eta * pi - d * dpi
                expected = -W * u + moment_term + pressure_term
                wrong = -W * u / x + moment_term + pressure_term
                reported = row["ps"][1] * L * e / x
                scale = max(1.0, abs(expected), abs(reported))
                tolerance = 5e-11 * scale
                diff = reported - expected
                checks.append({
                    "id": f"{example['id']}:eta={eta}:sample={i}",
                    "x": x, "eta": eta, "reportedNs": reported,
                    "expectedSourceNs": expected,
                    "incorrectWholeNumeratorDividedByX": wrong,
                    "expectedTranscriptionDefect": W * u * (1 - 1 / x),
                    "observedDefect": diff, "tolerance": tolerance,
                    "pass": abs(diff) <= tolerance,
                    "matchesHistoricalError": abs(reported - wrong) <= tolerance,
                })
    failed = [x for x in checks if not x["pass"]]
    detected = bool(failed) and all(x["matchesHistoricalError"] for x in checks)
    return {
        "schema": "MathScope.Navier.IndependentContinuationFormulaAudit/1",
        "status": "PASS" if checks and not failed else "FAIL",
        "source": {
            "paper": "01-navier-stokes.pdf",
            "sha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
            "pages": [28, 155], "equations": ["4.16", "B.35"],
            "formula": "Ns = -W*U + (D*(M-eta*M_eta)+4*h*eta*S-d*S_eta)/X + 4*A*eta*Pi-d*Pi_eta",
            "integralDerivation": "integral_0^X Sn = -X*W*U + D*(M-eta*M_eta)+4*h*eta*S-d*S_eta + X*(4*A*eta*Pi-d*Pi_eta)",
        },
        "fixture": {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()},
        "counts": {"passed": len(checks) - len(failed), "failed": len(failed), "total": len(checks)},
        "historicalWrongDivisionDetected": detected,
        "maximumAbsoluteDefect": max((abs(x["observedDefect"]) for x in checks), default=None),
        "largestCounterexamples": sorted(failed, key=lambda x: abs(x["observedDefect"]), reverse=True)[:8],
        "checks": checks,
        "scope": "Independent algebra at the stored finite profile; this does not certify the original infinite profile or continuity between stored samples.",
        "fullProfileCertified": False,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--fixture", type=Path)
    p.add_argument("--output", type=Path)
    p.add_argument("--expect-bug", action="store_true")
    a = p.parse_args()
    if a.fixture is None:
        a.fixture = (HERE / "history" / "ns-wu-scaling-v1" if a.expect_bug else HERE) / "continuation-loop-examples.json"
    if a.output is None:
        a.output = HERE / ("continuation-historical-formula-failure.json" if a.expect_bug else "continuation-source-formula-independent.json")
    report = audit(a.fixture)
    report["checkerSha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    report["expectedHistoricalFailure"] = a.expect_bug
    a.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ["status", "counts", "historicalWrongDivisionDetected", "maximumAbsoluteDefect"]}))
    return 0 if (report["historicalWrongDivisionDetected"] if a.expect_bug else report["status"] == "PASS") else 1


if __name__ == "__main__":
    raise SystemExit(main())
