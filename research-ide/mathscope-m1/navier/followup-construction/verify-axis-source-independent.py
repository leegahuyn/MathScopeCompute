"""Independent exact scalar/interval checks of the A.21 axis certificate.

This script reads the generated record and uses Python Fraction arithmetic,
Bernstein polynomial ranges, positive-series bounds and an independently summed
tail majorant. It does not invoke the JS interval or norm routines to check their
answers. The analytic correspondence to the source theorems remains explicitly
outside these finite executable checks.

Use --generate to run the public JS API once and preserve its complete result.
Subsequent invocations verify the preserved record without executing that API.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction as F
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import subprocess
import sys

if hasattr(sys, "set_int_max_str_digits"):
    sys.set_int_max_str_digits(0)

ROOT = Path(__file__).resolve().parent
CERTIFICATE = ROOT / "axis-source-default-certificate.json"
REPORT = ROOT / "axis-source-independent-validation.json"
PIN = "7bff5106ded0223d0e7ff14d4431a240de160bdcc6be17c1072189206312495d"


def digest(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def generate_certificate():
    script = """
import {certifyAxisSource,axisSourceExampleInput} from './axis-source-certificate.mjs';
import {makeBudget} from '../numerics.mjs';
const r=certifyAxisSource(axisSourceExampleInput(),makeBudget({maxOperations:20000000,maxMilliseconds:60000,maxPoints:2048}));
process.stdout.write(JSON.stringify(r,null,2));
if(r.status!=='VERIFIED_LOCAL_BOUND_CERTIFICATE')process.exitCode=1;
"""
    proc = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT,
                          text=True, capture_output=True, timeout=90)
    if proc.returncode:
        raise RuntimeError(f"JS source-axis generation failed ({proc.returncode}): {proc.stdout[:1000]} {proc.stderr[:1000]}")
    json.loads(proc.stdout)
    CERTIFICATE.write_text(proc.stdout + "\n")


def interval(record):
    return F(record["lower"]), F(record["upper"])


def add(a, b):
    return a[0] + b[0], a[1] + b[1]


def neg(a):
    return -a[1], -a[0]


def sub(a, b):
    return add(a, neg(b))


def mul(a, b):
    v = [x*y for x in a for y in b]
    return min(v), max(v)


def sq(a):
    return (F(0) if a[0] <= 0 <= a[1] else min(a[0]**2, a[1]**2), max(a[0]**2, a[1]**2))


def scale(a, k):
    return mul(a, (k, k))


def intersect(a, b):
    result = max(a[0], b[0]), min(a[1], b[1])
    assert result[0] <= result[1]
    return result


def poly_add(a, b):
    n = max(len(a), len(b))
    return [(a[i] if i < len(a) else F(0))+(b[i] if i < len(b) else F(0)) for i in range(n)]


def poly_mul(a, b):
    out = [F(0)]*(len(a)+len(b)-1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            out[i+j] += x*y
    return out


def poly_scale(a, k):
    return [x*k for x in a]


def bernstein_range(coefficients, left, right):
    """Power coefficients -> Bernstein coefficients on [left,right]."""
    n = len(coefficients)-1
    translated = [sum(coefficients[k]*comb(k, j)*left**(k-j)*(right-left)**j
                      for k in range(j, n+1)) for j in range(n+1)]
    b = [sum(translated[k]*F(comb(i, k), comb(n, k)) for k in range(i+1))
         for i in range(n+1)]
    return min(b), max(b)


def pressure_ranges(source, eta):
    """Re-derive the real enclosures directly from the positive-mixture contract."""
    lo, hi = F(source["totalMassLower"]), F(source["totalMassUpper"])
    inner = F(source["innerThetaOneMassLower"])
    tail = F(source["mixedThetaSuffix"]["upper"])
    f = add((F(1), F(1)), sq(eta))
    f2 = 1/f[1]**2, 1/f[0]**2
    f3 = 1/f[1]**3, 1/f[0]**3
    simple_p = -hi, -lo*f2[0]
    refined_p = -(hi*f2[1]+tail*(1-f2[0])), -lo*f2[0]
    derivative_integral = inner*f3[0], hi/f[0]
    simple_d = mul(scale(eta, F(4)), derivative_integral)
    main_d = mul(scale(eta, F(4)), mul((lo, hi), f3))
    error = 4*max(abs(eta[0]), abs(eta[1]))*tail/f[0]
    return intersect(simple_p, refined_p), intersect(simple_d, add(main_d, (-error, error)))


def exact_tail_term(M, rho, Y, n, radial, eta_order):
    return (M*factorial(eta_order)/rho**eta_order / (eta_order+1)**2
            * comb(n+eta_order, eta_order)*F(factorial(n), factorial(n-radial))
            * Y**(n-radial) / (20**n*(n+1)**2))


def tighter_tail_upper(M, rho, Y, degree, radial, eta_order):
    if Y == 0:
        return F(0)
    # Sum thirteen actual terms first. Bound only the remaining infinite tail;
    # this is a distinct and tighter path than the JS first/(1-q) evaluation.
    first = degree+1
    stop = first+13
    total = sum(exact_tail_term(M, rho, Y, n, radial, eta_order) for n in range(first, stop))
    ratio = Y/F(20)*F(stop+1+eta_order, stop+1-radial)
    assert 0 <= ratio < 1
    return total+exact_tail_term(M, rho, Y, stop, radial, eta_order)/(1-ratio)


def verify(record):
    checks = []

    def check(name, value, detail=None):
        checks.append({"name": name, "pass": bool(value), **({"detail": detail} if detail is not None else {})})

    source = record["sourcePressureCertificate"]
    p = {k: F(v) for k, v in source["parametersExact"].items()}
    manifest = json.loads((ROOT / "axis-source-derivation.json").read_text())
    check("frozen rational source SHA", digest(ROOT / "axis-certificates.mjs") == PIN)
    check("derived source SHA", digest(ROOT / "axis-source-certificate.mjs") == manifest["derivedSha256"])
    check("A21 outer source SHA", digest(ROOT / "outer.mjs") == source["sources"]["outerSourceSha256"])
    check("explicit theorem-reference boundary", record["proofBoundary"]["formalPass"] is False
          and record["derivedFrom"]["rationalDefaultScalarLeanAuditAppliesToThisInstance"] is False)
    check("source exact h binding", F(record["selectedParameters"]["h"]) == p["h"]
          == F(record["pressureAxisBinding"]["axisHExact"]) == F(source["parameterHExact"]))
    check("no repaired-field, old-jet, global or complete Lean upgrade",
          all(record["gates"][k] is False for k in ["completedOuterPressureLinked", "existingFiniteJetLinked", "globalWitness", "fullCertificateKernelChecked", "fullOriginalParameterOrder"]))

    traces = {F(t["argument"]): t for t in source["exponentialAudit"]}
    for x, trace in traces.items():
        output = interval(trace["enclosure"])
        if x < 0:
            positive = interval(traces[-x]["enclosure"])
            valid = output[0] <= 1/positive[1] <= 1/positive[0] <= output[1]
        else:
            N, k = trace["termsThrough"], trace["rangeReductionPowerOfTwo"]
            small = x/2**k
            partial = sum(small**n/factorial(n) for n in range(N+1))
            first = small**(N+1)/factorial(N+1)
            ratio = small/(N+2)
            tail = first/(1-ratio)
            valid = (0 <= small <= F(1, 8) and ratio < 1
                     and F(trace["smallPartialSum"]) == partial
                     and F(trace["firstOmittedTerm"]) == first
                     and F(trace["tailUpper"]) == tail)
            enclosure = interval(trace["smallEnclosure"])
            valid = valid and enclosure[0] <= partial and enclosure[1] >= partial+tail
            for step in trace["squaringEnclosures"]:
                new = interval(step)
                valid = valid and 0 <= new[0] <= enclosure[0]**2 and new[1] >= enclosure[1]**2
                enclosure = new
            valid = valid and len(trace["squaringEnclosures"]) == k and enclosure == output
        check("exact exponential enclosure "+str(x), valid)

    exp_p = interval(traces[2*p["logP"]]["enclosure"])
    exp_initial = interval(traces[F(1, 5)]["enclosure"])
    exp_end = interval(traces[F(-2, 5)]["enclosure"])
    rho_o = p["co"]*p["h"]
    shape_hi = F(5, 2)*exp_initial[1]+exp_end[1]/(2*(1-rho_o)**2)
    check("both infinite ends mass upper from exact exp enclosures", F(source["totalMassUpper"]) == shape_hi*exp_p[1])
    check("exact theta-one prefix mass enclosure", F(source["innerThetaOneMassLower"]) == F(5, 2)*exp_p[0]
          and F(source["innerThetaOneMassUpper"]) == F(5, 2)*exp_p[1])
    check("source pressure size required by this axis branch", F(source["innerThetaOneMassLower"]) >= 4)
    k = source["mixedThetaSuffix"]["rationalDecayBits"]
    check("finite nonzero mixed-theta decay bound", 0 < k <= 512 and k <= 13/p["lambda"]
          and F(source["mixedThetaSuffix"]["upper"]) == exp_p[1]/(2*(1-rho_o)**2*2**k))
    q = source["scheduleExistence"]
    q_before, q_p = interval(q["terminalQBeforeWait"]), interval(q["terminalQp"])
    check("terminal waiting interval has positive lower separation", q_before[0] > q_p[1] > q_p[0] > 0)
    check("terminal waiting interval finite upper via log x <= x-1", F(q["wait"]["finiteUpper"]) == (q_before[1]/q_p[0]-1)/(1-p["h"]))

    h, j = F(record["selectedParameters"]["h"]), F(record["selectedParameters"]["j0"])
    A = F(1, 2)+h
    H = [j, F(9, 2)-h, -j, F(-4)]
    U = [j, F(4)]
    Z_geom = poly_add(poly_scale(poly_mul([F(1), -2*j, F(-8)], U), -A), poly_scale(H, F(-4)))
    cells = sorted(record["cutoff"]["cells"], key=lambda c: F(c["eta"]["lower"]))
    check("cutoff cells cover the whole real interval without gaps", F(cells[0]["eta"]["lower"]) == -1
          and F(cells[-1]["eta"]["upper"]) == 1
          and all(F(a["eta"]["upper"]) == F(b["eta"]["lower"]) for a, b in zip(cells, cells[1:])))
    delta, margin = F(record["cutoff"]["delta"]), F(record["cutoff"]["positiveH2Margin"])
    for i, cell in enumerate(cells):
        e = interval(cell["eta"])
        h2 = sq(bernstein_range(H, *e))
        pressure, derivative = pressure_ranges(source, e)
        geometric = bernstein_range(Z_geom, *e)
        d = sub((F(1), F(1)), sq(e))
        z_bound = add(sub(geometric, mul(d, derivative)), scale(mul(e, pressure), 4*A))
        if cell["reason"] == "abs(Z)>delta":
            valid = z_bound[0] > delta or z_bound[1] < -delta
        else:
            valid = h2[0] >= margin > 0
        check(f"Bernstein/mixture cutoff cell {i+1}", valid,
              {"eta": [str(x) for x in e], "branch": cell["reason"]})
    sigma = F(record["selectedParameters"]["sigmaStar"])
    check("sigma provides the strict low-Z cutoff margin", sigma > 0 and sigma**2 <= margin/400)

    tube = record["complexInput"]
    qdev = F(tube["denominatorPerturbation"])
    qlo = F(tube["denominatorLowerBounds"]["H(z)^2+sigma^2"])
    check("complex H divisor is separated on the full tube", qlo == sigma**2-qdev and qlo > 0 and qdev <= sigma**2/4)
    c = record["sourcePressureOnCoefficientTube"]
    radius, W, mass = F(c["tubeRadius"]), F(c["realWindow"]), F(source["totalMassUpper"])
    denominator = 1-radius**2
    check("source pressure holomorphic majorants on the exact axis tube",
          c["tubeRadius"] == tube["outerTubeRadius"] and radius < F(1, 2)
          and F(c["pressureAbsUpper"]) == mass/denominator**2
          and F(c["pressureDerivativeAbsUpper"]) == 4*(W+radius)*mass/denominator**3)
    check("unchanged complex pressure majorant is conservative", 0 < F(tube["denominatorLowerBounds"]["1+z^2"]) <= denominator)
    ratio, loss = F(tube["radiusRatio"]), F(tube["radiusLoss"])
    check("all-eta Cauchy weight sum", 0 < ratio < 1 and loss == (1+ratio)/(1-ratio)**3)

    # Keep the integer extraction explicit to avoid any binary64 conversion.
    B = int(record["controlled"]["remainderBound"])
    L = int(record["controlled"]["remainderLipschitz"])
    lam = int(record["selectedParameters"]["Lambda"])
    multiplier = record["selectedParameters"]["lambdaMultiplier"]
    check("computed Lambda meets actual Controlled thresholds", lam == multiplier*max(1+B+L, 100*B) and B > 0 and L >= 0)
    displacement, lipschitz = F(B, 2*lam), F(L, 2*lam)
    check("exact self-map and Lipschitz certificates", displacement == F(record["bounds"]["selfMapDisplacementUpper"]["exact"])
          and lipschitz == F(record["bounds"]["contractionLipschitzUpper"]["exact"]) and displacement <= 1 and lipschitz < 1)
    error = displacement/(1-F(41, 200))
    lower = F(305719, 1152000)-error
    check("uniform positivity uses a whole-interval scalar lower bound", error == F(record["bounds"]["uniformPhiError"]["exact"])
          and lower == F(record["bounds"]["uniformPhiPositiveLower"]["exact"]) and lower > F(1, 4))
    check("normalization leaves an exact positive exponential margin", int(record["selectedParameters"]["logC"])
          == lam*int(record["bounds"]["phaseRealPartUpper"])+1)

    M, rho = F(record["tails"]["solutionNormUpper"]), F(record["selectedParameters"]["coefficientRadius"])
    for i, row in enumerate(record["tails"]["rows"]):
        Y, N = F(row["Y"]), row["truncationDegree"]
        check(f"exact radius rescaling row {i}", F(row["X"]) == Y/lam)
        ordinary = tighter_tail_upper(M, rho, Y, N, 0, 0)
        mixed = row["mixedDerivative"]
        differentiated = tighter_tail_upper(M, rho, Y, N, mixed["radial"], mixed["eta"])
        check(f"independently summed infinite tails row {i}", 0 <= ordinary <= F(row["phiTailUpper"])
              and 0 <= differentiated <= F(mixed["upper"]))
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate", action="store_true")
    args = parser.parse_args()
    if args.generate:
        generate_certificate()
    record = json.loads(CERTIFICATE.read_text())
    if record.get("status") != "VERIFIED_LOCAL_BOUND_CERTIFICATE":
        raise RuntimeError("A successful source-axis certificate is required for independent inspection")
    checks = verify(record)
    # Negative controls alter only the preserved record in memory. No original
    # theorem, source module or frozen certificate is modified.
    negative = []
    for name, modify in [
        ("false global upgrade", lambda r: r["gates"].__setitem__("globalWitness", True)),
        ("forged mass bound", lambda r: r["sourcePressureCertificate"].__setitem__("totalMassUpper", "1")),
        ("changed exact h", lambda r: r["selectedParameters"].__setitem__("h", "1/100000000")),
        ("zero infinite tail", lambda r: r["tails"]["rows"][-1].__setitem__("phiTailUpper", "0")),
    ]:
        edited = json.loads(json.dumps(record))
        modify(edited)
        try:
            failed = [c["name"] for c in verify(edited) if not c["pass"]]
            rejected = bool(failed)
        except (AssertionError, ValueError, ZeroDivisionError) as error:
            rejected, failed = True, [type(error).__name__]
        negative.append({"name": name, "pass": rejected, "rejectionChecks": failed})
    passed = sum(c["pass"] for c in checks)
    passed_negative = sum(c["pass"] for c in negative)
    report = {"schema": "MathScope.SourceAxisIndependentValidation/1",
              "checkedAt": datetime.now(timezone.utc).isoformat(),
              "status": "PASS" if passed == len(checks) and passed_negative == len(negative) else "FAIL",
              "checks": checks, "passed": passed, "total": len(checks),
              "negativeControls": negative, "negativePassed": passed_negative, "negativeTotal": len(negative),
              "certificate": {"path": str(CERTIFICATE), "sha256": digest(CERTIFICATE), "bytes": CERTIFICATE.stat().st_size},
              "sourceFiles": [{"path": name, "sha256": digest(ROOT/name)} for name in ["axis-source-certificate.mjs", "axis-source-derivation.json", "derive-axis-source.py", "axis-certificates.mjs", "pressure-analytic.mjs", "outer.mjs", "../numerics.mjs", "verify-axis-source-independent.py"]],
              "method": "Python Fraction arithmetic, Bernstein polynomial ranges, exact exponential enclosure inequalities, and a separately summed infinite-tail majorant",
              "scope": "Finite executable arithmetic and input-adapter checks. These do not constitute a Lean proof of every generated analytic premise, an equality with repaired E or a complete Navier-Stokes witness.",
              "workingDirectory": str(ROOT.parent.parent),
              "commands": ["python3 navier/followup-construction/verify-axis-source-independent.py --generate", "python3 navier/followup-construction/verify-axis-source-independent.py"]}
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps({"status": report["status"], "passed": passed, "total": len(checks),
                      "negativePassed": passed_negative, "negativeTotal": len(negative),
                      "failed": [c["name"] for c in checks if not c["pass"]], "report": str(REPORT)}))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
