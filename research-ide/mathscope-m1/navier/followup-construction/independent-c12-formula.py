"""Exact-rational source (4.16) reconstruction at the computed C.12 observations.

Every binary64 datum is converted to its exact rational value.  Thus this check
tests the finite arithmetic identity independently of JS evaluation order.  It
does not give an interval bound for the field construction or quadrature itself.
"""
from fractions import Fraction as F
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
fixture_path = HERE / "source-c12-formula-fixtures.json"
fixture = json.loads(fixture_path.read_text())
checks, cases = [], []


def q(value):
    if isinstance(value, dict) and value.get("kind") == "FLOAT64":
        value = float(value["value"])
    return F(value)


for case in fixture["cases"]:
    h = q(case["parameters"]["h"])
    D, A = F(1, 2) - h, F(1, 2) + h
    wrong_defect = F(0)
    max_defect = F(0)
    witness = None
    for s in case["slices"]:
        eta = q(s["eta"])
        d, L = 1 - eta * eta, 1 - 2 * h * eta * eta
        for i, row in enumerate(s["samples"]):
            x, u, e = map(q, (row["X"], row["U"], row["E"]))
            m, _, _, ss, _ = map(q, row["postMoments"])
            dm, _, _, ds, _ = map(q, row["postMomentEta"])
            pi, dpi = q(row["Pi"]), q(row["PiEta"])
            W = 1 - (2 * D * eta * m + d * dm) / x
            # The integration-by-parts boundary term is -x W u.
            integrated_sn = -x * W * u + D * (m - eta * dm) + 4 * h * eta * ss - d * ds + x * (4 * A * eta * pi - d * dpi)
            expected = integrated_sn / x
            reported = q(row["postPs"][1]) * L * e / x
            error = abs(reported - expected)
            tolerance = F(5, 10**11) * max(F(1), abs(expected))
            max_defect = max(max_defect, error)
            checks.append({"id": f"{case['id']}:eta={s['eta']}:row={i}:original-Ns", "pass": error <= tolerance,
                           "absoluteDifference": float(error), "tolerance": float(tolerance)})
            v_expected = x / L * (2 * eta * u - (2 * D * eta * m + d * dm) / x)
            v_error = abs(q(row["V0"]) - v_expected)
            checks.append({"id": f"{case['id']}:eta={s['eta']}:row={i}:radial-velocity", "pass": v_error <= F(5, 10**11) * max(F(1), abs(v_expected)),
                           "absoluteDifference": float(v_error)})
            wrong = expected + W * u * (1 - 1 / x)
            wrong_error = abs(reported - wrong)
            if wrong_error > wrong_defect:
                wrong_defect = wrong_error
                witness = {"x": float(x), "eta": float(eta), "U": float(u), "W": float(W),
                           "Ns": float(reported), "sourceNs": float(expected), "oldNs": float(wrong)}
    checks.append({"id": case["id"] + ":negative-control-former-division", "pass": wrong_defect > F(1, 10**8),
                   "maximumAbsoluteError": float(wrong_defect), "witness": witness})
    cases.append({"id": case["id"], "maximumOriginalIdentityError": float(max_defect),
                  "maximumOldFormulaError": float(wrong_defect)})

result = {
    "schema": "MathScope.Navier.IndependentC12FormulaAudit/1",
    "source": {"paper": "01-navier-stokes.pdf", "sha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
               "pages": [28, 155], "equations": ["4.16", "B.35"]},
    "sourceHashes": {**fixture["sourceHashes"], fixture_path.name: hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
                     Path(__file__).name: hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
    "counts": {"passed": sum(c["pass"] for c in checks), "failed": sum(not c["pass"] for c in checks), "total": len(checks)},
    "cases": cases, "checks": checks,
    "scope": "Source finite-moment identities reconstructed using exact Fraction arithmetic on saved binary64 observations. No continuum, derivative approximation, quadrature or interval-Newton claim.",
    "fullProfileCertified": False,
}
result["status"] = "PASS" if result["counts"]["failed"] == 0 and checks else "FAIL"
(HERE / "c12-source-formula-independent.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({"status": result["status"], "counts": result["counts"], "cases": cases}, indent=2))
raise SystemExit(0 if result["status"] == "PASS" else 1)
