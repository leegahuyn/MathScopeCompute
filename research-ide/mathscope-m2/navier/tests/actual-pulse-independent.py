#!/usr/bin/env python3
"""Independent stdlib verification of the actual local N3 pulse construction.

The numerical comparator uses high-precision direct values, Newton inversion of
the chart, and finite differences. It does not reimplement the JS interval
Taylor algebra. Exact Fraction matrices check the projected moving-frame
identities. Rational matrix fixtures test universal identities only; they are
never passed off as finite-frequency evaluations of the enormous actual N3.
"""
from __future__ import annotations

import argparse
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[4]
NAVIER = ROOT / "research-ide/mathscope-m2/navier"
checks: list[dict] = []


def check(name: str, condition: bool, **details):
    row = {"id": name, "pass": bool(condition), **details}
    checks.append(row)
    if not condition:
        raise AssertionError(json.dumps(row, ensure_ascii=False))


def dec(x):
    if isinstance(x, F):
        return D(x.numerator) / D(x.denominator)
    if isinstance(x, float):
        return D.from_float(x)
    return D(x)


def covers(interval, value, slack=D(0)):
    return dec(interval[0]) - slack <= value <= dec(interval[1]) + slack


def node_snapshot():
    program = """
      import {ACTUAL_PULSE_BINDINGS} from './research-ide/mathscope-m2/navier/actual-pulse-source.mjs';
      import {evaluateActualMeanPatchJet,boundActualMeanPatchJets} from './research-ide/mathscope-m2/navier/actual-pulse-meanpatch.mjs';
      import {actualLeftGrowingDatum,actualMeanPatchPhaseBounds} from './research-ide/mathscope-m2/navier/actual-pulse-construction.mjs';
      const inputs=[{y:.25,eta:-1,s:.5},{y:2.5,eta:.25,s:1},{y:4.75,eta:1,s:2}];
      process.stdout.write(JSON.stringify({bindings:ACTUAL_PULSE_BINDINGS,fields:inputs.map(evaluateActualMeanPatchJet),uniform:boundActualMeanPatchJets(3),datum:actualLeftGrowingDatum({samples:32}),phase:actualMeanPatchPhaseBounds()}));
    """
    return json.loads(subprocess.check_output(["node", "--input-type=module", "-e", program], cwd=ROOT, text=True))


def independent_source_algebra(snapshot):
    bindings = snapshot["bindings"]
    for binding in [bindings["assembly"], *bindings["sourceFiles"]]:
        actual = sha256((ROOT / "research-ide" / binding["path"]).read_bytes()).hexdigest()
        check("source-sha:" + binding["path"], actual == binding["sha256"])
    assembly = json.loads((ROOT / "research-ide" / bindings["assembly"]["path"]).read_text())
    check("actual-selected-h-expression", assembly["parametersExactExpressions"]["h"] == {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}})
    check("actual-selected-lambda-expression", assembly["parametersExactExpressions"]["lambda"] == {"exp": {"product": [{"integer": -1000}, {"ref": "T"}]}})
    # Polynomial coefficients in the independent symbols (1,T,lambda,T*lambda).
    log_k_uncollected = [F(-7, 10), F(3, 2), F(-1, 2), F(0)]
    log_k_uncollected[0] += 4
    log_k_uncollected[1] -= 30000
    log_k_uncollected[2] += 8
    log_k_uncollected[3] -= 60000
    check("literal-stage-log-K-expansion", log_k_uncollected == [F(33, 10), F(-59997, 2), F(15, 2), F(-60000)])
    # sqrt(2 Xm): half log220 + 5 logC + (60021/2)T - 3.
    check("Fscale-T-coefficient", F(-59997, 2) - F(60021, 2) == -60009)
    check("Fscale-constant-coefficient", F(33, 10) + 3 == F(63, 10))
    for h in [F(0), F(1, 2**1000)]:
        for eta in [F(-1), F(-1, 4), F(0), F(1)]:
            Dpar = F(1, 2) - h
            L = 1 - 2 * h * eta**2
            check(f"nonzero-cumulative-radial-identity:{h.numerator}/{h.denominator}:{eta}", (2 * Dpar * eta**2 + 1 - eta**2) / L == 1)
    # V0=-m gives a nonzero local pressure source even though E1=0.
    for m, X in [(F(3, 2), F(7, 3)), (F(11), F(19))]:
        omega = -(m**2) / (2 * X)
        pi1_x = -omega / (2 * X)
        check(f"pressure-source-not-zero:{m}", omega < 0 and pi1_x == m**2 / (4 * X**2) and pi1_x > 0)


def weights(derivative):
    """Solve the finite-difference moment conditions with exact rationals."""
    if derivative == 0:
        return [(0, F(1))]
    xs = list(range(-3, 4))
    a = [[F(x**power) for x in xs] + [F(factorial(power) if power == derivative else 0)] for power in range(7)]
    for c in range(7):
        pivot = next(r for r in range(c, 7) if a[r][c])
        a[c], a[pivot] = a[pivot], a[c]
        d = a[c][c]
        a[c] = [x / d for x in a[c]]
        for r in range(7):
            if r != c:
                f = a[r][c]
                a[r] = [x - f * y for x, y in zip(a[r], a[c])]
    w = [a[i][-1] for i in range(7)]
    for power in range(7):
        check(f"difference-moment:{derivative}:{power}", sum(c * F(x**power) for x, c in zip(xs, w)) == (factorial(power) if power == derivative else 0))
    return [(x, c) for x, c in zip(xs, w) if c]


def direct_field(rho, Z, Tchart, h, lam):
    """Invert T=s-Z²s^(2h) directly; do not calculate any Taylor jet."""
    s = Tchart + Z * Z
    for _ in range(8):
        two_h_log_s = 2 * h * s.ln()
        s_two_h = two_h_log_s.exp()
        residual = s - Z * Z * s_two_h - Tchart
        ds = residual / (1 - 2 * h * Z * Z * s_two_h / s)
        s -= ds
        if abs(ds) < D("1e-380"):
            break
    else:
        raise AssertionError("Independent chart Newton solve did not converge.")
    value = ((-2 - 2 * lam) * rho.ln() + (lam - h) * s.ln()).exp() / (1 + Z * Z * ((-1 + 2 * h) * s.ln()).exp())
    return value, rho * value


def independent_finite_difference(snapshot):
    stencil = {n: weights(n) for n in range(4)}
    step = D("1e-30")
    errors = []
    for case, field in enumerate(snapshot["fields"]):
        y, eta, s = (dec(field["input"][name]) for name in ["y", "eta", "s"])
        # A positive endpoint in the certified arithmetic parameter box tests
        # h/lambda propagation. It is not advertised as a replacement N3 datum.
        h = dec(field["parameterEnclosures"]["h"][1])
        lam = dec(field["parameterEnclosures"]["lambda"][1])
        rho = (s * y.exp()).sqrt()
        Z = eta * ((D(".5") - h) * s.ln()).exp()
        Tc = s * (1 - eta * eta)

        @lru_cache(maxsize=None)
        def value(offset):
            return direct_field(rho + offset[0] * step, Z + offset[1] * step, Tc + offset[2] * step, h, lam)

        for row in field["jets"]:
            alpha = row["multiIndex"]
            totals = [D(0), D(0)]
            for terms in product(*(stencil[n] for n in alpha)):
                offset = tuple(t[0] for t in terms)
                coeff = dec(terms[0][1] * terms[1][1] * terms[2][1])
                f, v = value(offset)
                totals[0] += coeff * f
                totals[1] += coeff * v
            totals = [x / step ** sum(alpha) for x in totals]
            for name, number in zip(["normalizedFInterval", "normalizedVInterval"], totals):
                interval = row[name]
                # The central-stencil truncation is O(step^4) or smaller for
                # these analytic functions. No slack is needed at binary64
                # interval resolution: the computed value itself must lie in it.
                check(f"independent-chart-difference:{case}:{alpha}:{name}", covers(interval, number), value=str(number)[:30])
                errors.append(float(abs(number - (dec(interval[0]) + dec(interval[1])) / 2)))
            radial = -D((-1) ** alpha[0] * factorial(alpha[0])) / rho ** (alpha[0] + 1) if not alpha[1] and not alpha[2] else D(0)
            check(f"independent-radial-derivative:{case}:{alpha}", covers(row["normalizedRadialInterval"], radial))
            check(f"identically-zero-axial-field:{case}:{alpha}", row["GInterval"] == [0, 0])
        expected_F = ((-1 - h) * s.ln() - (1 + lam) * y).exp() / (1 + eta * eta)
        check(f"independent-profile-to-chart-value:{case}", covers(field["normalizedValues"]["FOverFscale"], expected_F))
        wrong_E_scaling = ((-1 - h) * s.ln() - (D(".5") + lam) * y).exp() / (1 + eta * eta)
        check(f"negative-E-in-place-of-F:{case}", not covers(field["normalizedValues"]["FOverFscale"], wrong_E_scaling))
        check(f"full-Q-fixed-coordinate-contract:{case}", field["coordinateFrame"] == "BAND_CHART_Q_FIXED" and field["restoredQuantitiesArePhysicalCartesian"] is False)
    return {"method": "400-digit Decimal direct chart Newton inversion plus exact-weight seven-point mixed finite differences", "derivativeOrder": 3, "cases": len(snapshot["fields"]), "step": str(step), "maximumDisplayedIntervalMidpointDistance": max(errors), "parameterBoxPointNotSubstituteProfile": True, "formalIntervalProofReplaced": False}


def matrix(rows):
    return [[F(x) for x in row] for row in rows]


def transpose(a):
    return [list(x) for x in zip(*a)]


def matmul(a, b):
    return [[sum(x * y for x, y in zip(row, column)) for column in zip(*b)] for row in a]


def plus(a, b):
    return [[x + y for x, y in zip(ar, br)] for ar, br in zip(a, b)]


def scale(a, f):
    return [[f * x for x in row] for row in a]


def independent_frame_identities():
    eye = matrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]])
    eye2 = matrix([[1, 0], [0, 1]])
    F0, sqrt_lambda, sr, root = F(7, 3), F(2, 5), F(3, 4), F(5, 4)
    c0 = -sqrt_lambda
    J = matrix([[1, 1], [c0 * root, -c0 * root]])
    Ji = matrix([[F(1, 2), 1 / (2 * c0 * root)], [F(1, 2), -1 / (2 * c0 * root)]])
    Kshear = matrix([[0, -2 * F0, 0], [-2 * sqrt_lambda**2 * F0, 0, 0], [0, 0, 0]])
    Uref = matrix([[1, 0], [0, -1], [sr, 0]])
    Bref = matmul(Uref, J)
    Lref = matmul(Ji, matrix([[1, 0, 0], [0, -1, 0]]))
    nr = matrix([[sr], [0], [-1]])
    projection = plus(eye, scale(matmul(nr, transpose(nr)), -1 / (1 + sr**2)))
    Aref = scale(matmul(projection, Kshear), -1)
    eig = 2 * F0 * sqrt_lambda / root
    check("exact-instantaneous-reference-diagonalization", matmul(matmul(Lref, Aref), Bref) == matrix([[eig, 0], [0, -eig]]))
    check("exact-reference-frame-left-inverse", matmul(Lref, Bref) == eye2)
    check("exact-reference-normal-tangent", matmul(transpose(nr), Bref) == matrix([[0, 0]]))
    wrong_K = matrix([[0, -2 * F0, 0], [2 * sqrt_lambda**2 * F0, 0, 0], [0, 0, 0]])
    check("negative-shear-sign-reverses-reference-growth", matmul(matmul(Lref, scale(matmul(projection, wrong_K), -1)), Bref) != matrix([[eig, 0], [0, -eig]]))
    # An exact rational nonzero angular normal and nonzero axial normal
    # derivative test the universal phase/frame identity without freezing n'.
    n = matrix([[F(3, 4)], [F(3, 5)], [F(-4, 5)]])
    np = matrix([[F(1, 7)], [0], [F(-3, 13)]])
    sa = n[0][0]  # tangential length is exactly one in this identity fixture.
    ka = [n[1][0], n[2][0]]
    na = [ka[1], -ka[0]]
    tangential_length_prime = sum(n[i][0] * np[i][0] for i in [1, 2])
    kap = [np[i + 1][0] - ka[i] * tangential_length_prime for i in [0, 1]]
    nap = [kap[1], -kap[0]]
    sap = np[0][0] - sa * tangential_length_prime
    U = matrix([[1, 0], [-sa * ka[0], na[0]], [-sa * ka[1], na[1]]])
    Up = matrix([[0, 0], [-sap * ka[0] - sa * kap[0], nap[0]], [-sap * ka[1] - sa * kap[1], nap[1]]])
    srprime = F(2, 9)
    Jp = matrix([[0, 0], [c0 * sr * srprime / root, -c0 * sr * srprime / root]])
    B = matmul(U, J)
    Bp = plus(matmul(Up, J), matmul(U, Jp))
    left = matmul(Ji, matrix([[1, 0, 0], [0, *na]]))
    n2 = sum(x[0] ** 2 for x in n)
    P = plus(eye, scale(matmul(n, transpose(n)), -1 / n2))
    Awithout = scale(matmul(P, Kshear), -1)
    A = plus(Awithout, scale(matmul(n, transpose(np)), -1 / n2))
    check("exact-actual-moving-frame-left-inverse", matmul(left, B) == eye2)
    check("exact-actual-moving-frame-normal-constraint", matmul(transpose(n), B) == matrix([[0, 0]]))
    check("exact-derivative-of-normal-constraint", plus(matmul(transpose(np), B), matmul(transpose(n), Bp)) == matrix([[0, 0]]))
    check("exact-moving-normal-projected-invariance", matmul(transpose(n), plus(matmul(A, B), scale(Bp, -1))) == matrix([[0, 0]]))
    omitted = matmul(transpose(n), plus(matmul(Awithout, B), scale(Bp, -1)))
    check("negative-omitted-moving-normal-term", omitted != matrix([[0, 0]]), exactResidual=[[str(x) for x in row] for row in omitted])
    check("negative-omitted-frame-derivative", matmul(transpose(n), matmul(A, B)) != matrix([[0, 0]]))


def independent_log_envelope(snapshot):
    datum = snapshot["datum"]
    delta = dec(datum["frozenConeChoice"]["inverseUStarEnclosure"][1])
    den = (1 + delta * delta) ** D("1.5")
    for index, row in enumerate(datum["rows"]):
        a = dec(row["sOverU"])
        exact = ((a + (a * a + delta * delta).sqrt()) / (1 + (1 + delta * delta).sqrt())).ln() - ((a - 1) * delta * delta + (a**3 - 1) / 3) / den
        check(f"independent-source-reference-log:{index}", covers(row["normalizedLogPInterval"], exact))
        upper = -(a - 1)**2 / (2 * den)
        check(f"independent-source-gaussian-coefficient:{index}", covers(row["normalizedGaussianUpperInterval"], upper))
        check(f"source-reference-under-gaussian:{index}", exact <= upper)
    check("exact-left-datum-not-midpoint-seed", datum["initial"]["frameCoordinates"] == ["P(0)", "0"] and datum["initial"]["midpointUnitSeedUsed"] is False)
    check("actual-amplitude-not-reference-label", datum["observationKind"] == "NORMALIZED_REFERENCE_LOG_ENVELOPE" and datum["actualAmplitudePointValuesEvaluated"] is False)


def independent_exponent_and_barrier(snapshot):
    M = 2**50
    for item in snapshot["phase"]["checks"]:
        if "terms" in item:
            top = item["upperPower"]
            check("exact-independent-absorption:" + item["id"], sum(t["coefficient"] * M**t["power"] for t in item["terms"]) < M**top and all(t["power"] <= top for t in item["terms"]))
    for S in [M**200, M**201]:
        E = F(M**64, S)
        radius = F(M**68, S)
        min_eigenvalue = F(1, M**3)
        check("exact-inward-riccati-boundary:" + str(len(str(S))), radius < F(1, 4) and -2 * min_eigenvalue * radius + E * (1 + radius)**2 < 0)
        check("exact-source-collar-tail:" + str(len(str(S))), M**67 - F(S, 25 * M**4) <= -F(S, 50 * M**4))
    check("negative-insufficient-local-band", F(M**68, M**67) >= F(1, 4))
    check("negative-missing-spectral-gap", F(M**64, M**200) * (1 + F(M**68, M**200))**2 > 0)
    L = 8002
    check("independent-actual-epsilon-polynomial", 32 + 128 * L - 9 * L**2 < 0 and 64 - 9 * L < 0)
    check("global-source-certificate-remains-false", snapshot["phase"]["globalPhaseCertified"] is False and snapshot["phase"]["threshold"]["qStarGlobalCertified"] is False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    snapshot = node_snapshot()
    with localcontext() as ctx:
        ctx.prec = 400
        independent_source_algebra(snapshot)
        numeric = independent_finite_difference(snapshot)
        independent_frame_identities()
        independent_log_envelope(snapshot)
        independent_exponent_and_barrier(snapshot)
    files = [NAVIER / f for f in ["actual-pulse-source.mjs", "actual-pulse-meanpatch.mjs", "actual-pulse-construction.mjs", "tests/actual-pulse.test.mjs", "tests/actual-pulse-independent.py", "research/ACTUAL_MEAN_PATCH_PULSE.md"]]
    receipt = {"schema": "MathScope.ActualPulseIndependentChecks/1", "profileId": snapshot["bindings"]["profileId"], "sourceAssemblySHA256": snapshot["bindings"]["assembly"]["sha256"], "pass": all(c["pass"] for c in checks), "checkCount": len(checks), "numericMethod": numeric, "files": [{"path": str(p.relative_to(ROOT)), "sha256": sha256(p.read_bytes()).hexdigest()} for p in files], "checks": checks, "scope": {"actualMeanPatchOnly": True, "numericalValuesCheckedAgainstIndependentMethod": True, "genericMatrixFixturesAreNotActualN3PulseSamples": True, "matrixIdentitiesUseExactFractionArithmetic": True, "writtenUniformMajorantsStillRequireMathematicalReview": True, "globalN504Certified": False, "globalN505Certified": False, "globalN506Certified": False}}
    if args.output:
        args.output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pass": receipt["pass"], "checkCount": receipt["checkCount"], "numericMethod": numeric, "output": str(args.output) if args.output else None}, ensure_ascii=False))


if __name__ == "__main__":
    main()
