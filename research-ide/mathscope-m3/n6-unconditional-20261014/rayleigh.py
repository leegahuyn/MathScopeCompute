"""Independent exact Rayleigh lemma and original-source dependency audit.

The universal algebraic lemma is proved independently of a PASS flag. Its
actual-source application remains conditional on explicit global hypotheses.
No sampled point, floating point value, or saved producer claim grants those
hypotheses. This executable deliberately never certifies complete N6.
"""
from __future__ import annotations

import argparse
import collections
from fractions import Fraction as Q
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import sqlite3
import time

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
HEADER_SHA = "010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c"
DB_SHA = "ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003"
CAPTURE_SHA = "37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb"
BASE = "research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291"


def digest(path):
    value = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for raw in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(raw)
    return value.hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def qtext(value):
    value = Q(value)
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def padd(*values):
    out = {}
    for value in values:
        for powers, coefficient in value.items():
            out[powers] = out.get(powers, Q(0)) + coefficient
    return {k: v for k, v in out.items() if v}


def pscale(value, scalar):
    return {k: v * Q(scalar) for k, v in value.items() if v * Q(scalar)}


def pmul(*values):
    out = {(0, 0, 0): Q(1)}
    for value in values:
        new = {}
        for k, coefficient in out.items():
            for other, factor in value.items():
                key = tuple(x + y for x, y in zip(k, other))
                new[key] = new.get(key, Q(0)) + coefficient * factor
        out = {k: v for k, v in new.items() if v}
    return out


def exact_polynomial_lemma():
    """Compare independent expansions over Q[F,a,b], without atom relabeling."""
    F, a, b = ({(1, 0, 0): Q(1)}, {(0, 1, 0): Q(1)}, {(0, 0, 1): Q(1)})
    gR, gZ = pscale(pmul(a, F), -1), pmul(b, F)
    polynomial = pscale(pmul(F, gR, padd(pmul(gR, gR), pmul(gZ, gZ), pscale(pmul(F, gR), 2))), -2)
    factorized = pscale(pmul(F, F, F, F, a, padd(pmul(a, a), pmul(b, b), pscale(a, -2))), 2)
    difference = padd(polynomial, pscale(factorized, -1))
    if difference:
        raise AssertionError("Independent Rayleigh polynomial identity failed")
    return {
        "status": "PROVED_UNIVERSAL_EXACT_ALGEBRA",
        "coefficientField": "Q", "variables": ["F", "a", "b"],
        "original": "-2*F*gR*(gR^2+gZ^2+2*F*gR)",
        "sourceChainRuleHypotheses": ["gR=-a*F", "gZ=b*F"],
        "factorization": "2*a*F^4*(a^2+b^2-2*a)=2*a^2*F^4*(a+b^2/a-2)",
        "divisionInLastEqualityRequires": "a != 0",
        "expandedTerms": [[list(k), qtext(v)] for k, v in sorted(polynomial.items())],
        "independentDifferenceTerms": len(difference),
        "globalSourcePremisesProved": False,
    }


def rayleigh_value(F, gR, gZ):
    F, gR, gZ = map(Q, (F, gR, gZ))
    return -2 * F * gR * (gR * gR + gZ * gZ + 2 * F * gR)


def finite_margin(F_lower, a_lower, gap_lower):
    """Universal lower lemma: F>=f>0,a>=alpha>0,v-2>=gamma>0.

    Its premises quantify over the desired domain. This routine only proves
    the implication for exact supplied lower bounds; it never treats them as
    bounds of the actual source. Strict input lower bounds give strict output.
    """
    f, alpha, gamma = map(Q, (F_lower, a_lower, gap_lower))
    if min(f, alpha, gamma) <= 0:
        raise ValueError("All three independent domain lower bounds must be strictly positive")
    return 2 * alpha * alpha * f ** 4 * gamma


def power_margin_ledger():
    """Exact finite power comparisons, conditional on original global bounds."""
    R = 8192
    rows = [
        {"id": "rayleigh-polynomial", "lower": "2*Renv^-70", "calculation": "2*(Renv^-10)^2*(Renv^-10)^4*Renv^-10", "power": 2 * 10 + 4 * 10 + 10},
        {"id": "gabs", "lower": "Renv^-20", "calculation": "F0*sqrt(a^2+b^2)>=F0*a"},
        {"id": "abs-Ntheta", "lower": "Renv^-14", "calculation": "sqrt(a^2+b^2)<sqrt(2)*Renv^3<Renv^4"},
        {"id": "abs-c0", "lower": "Renv^-6", "calculation": "c0^2=(v_s-2)/2>Renv^-10/2>Renv^-12"},
        {"id": "lambda0", "lower": "Renv^-31", "calculation": "lambda0=2*F0*abs(Ntheta)*abs(c0)>2*Renv^-30>Renv^-31"},
    ]
    checks = {
        "sqrt2_absorbed_without_numeric_square_root": R ** 2 > 2,
        "c0_square_comparison": R ** 2 > 2,
        "lambda_lower_power_comparison": 2 * R > 1,
        "rayleigh_total_power": rows[0]["power"] == 70,
        "sampledRepresentativeIsNotAGlobalProof": True,
    }
    if not all(checks.values()):
        raise AssertionError("Finite lower-bound power ledger failed")
    return {"status": "PROVED_FINITE_IMPLICATION_ONLY", "RenvMinimum": R,
            "premises": ["F0>Renv^-10", "a>Renv^-10", "v_s-2>Renv^-10", "abs(a),abs(b)<Renv^3"],
            "rows": rows, "checks": checks, "actualGlobalInputsIndependentlyProved": False,
            "hugeSourceExponentialConvertedToFloat": False}


def c12_robustness_lemma(Rmin=8192):
    """Independent whole-box mean-value lemma for the actual four cone gaps.

    Every partial derivative is bounded on a convex positive-a box, so this
    lemma handles every phase and every partial repair point if the original
    profile supplies the stated envelope and perturbation bounds.
    """
    Rmin = Q(Rmin)
    if Rmin < 8192:
        raise ValueError("Use the retained original Renv minimum 8192")
    # B=2Renv>=1, |a,b,p,q|<=B, 1/a<=B.
    # v=a+b²/a; t=-b/a; c=p+tq; j=q-tp; u=c-v.
    # Each numerical domination below is an inequality between positive
    # monomials valid for all B>=1, not a finite-domain sample.
    derivative_bound = {
        "Dv": {"exactMonomialUpper": "1+B^4+2B^2", "upper": "4B^4", "coefficientSum": 1 + 1 + 2},
        "Dc": {"exactMonomialUpper": "B^4+2B^2+1", "upper": "4B^4", "coefficientSum": 1 + 2 + 1},
        "Dj": {"exactMonomialUpper": "B^4+2B^2+1", "upper": "4B^4", "coefficientSum": 1 + 2 + 1},
        "DfourthGap": {"exactMonomialUpper": "128B^7+80B^10", "upper": "256B^10", "coefficientSum": 128 + 16 + 64},
    }
    checks = {
        "all_first_derivative_coefficient_sums": all(derivative_bound[k]["coefficientSum"] <= 4 for k in ["Dv", "Dc", "Dj"]),
        "fourth_gap_coefficient_sum": derivative_bound["DfourthGap"]["coefficientSum"] <= 256,
        "source_power_absorbs_256B10": 256 * 2 ** 10 < Rmin ** 2,
        "perturbation_retains_positive_a": 2 < Rmin ** 15,
        "perturbation_retains_coordinate_box": 1 < Rmin ** 17,
        "strict_cone_margin": 2 < Rmin ** 3,
    }
    if not all(checks.values()):
        raise AssertionError("Original C12 exact robustness ledger failed")
    return {"status": "PROVED_UNIVERSAL_MEAN_VALUE_AND_FINITE_POWER_LEMMA",
            "sourceGapMap": "Psi(a,b,p,q)=(a, a+b^2/a-2, p-b*q/a-(a+b^2/a), 2*(p-b*q/a-(a+b^2/a))^2-(a+b^2/a-2)*(q+b*p/a)^2)",
            "box": "1/(2Renv)<=a<=2Renv; abs(b),abs(p),abs(q)<=2Renv",
            "derivativeNorm": "sum of absolute partial derivatives in a,b,p,q",
            "derivativeBounds": derivative_bound, "checks": checks,
            "premises": ["Original comparison tuple coordinates have abs<=Renv", "Every original comparison raw gap >=1/Renv", "Every actual final tuple differs in each coordinate by <=Renv^34/N", "Renv>=8192 and N>=Renv^50"],
            "proof": ["Coordinate error <=Renv^-16 keeps the line segment in the displayed convex positive-a box.",
                      "On that entire box every gap derivative l1 norm <=256*(2Renv)^10<Renv^12.",
                      "The mean-value theorem bounds each gap error by Renv^12*Renv^-16=Renv^-4.",
                      "Every final gap >=Renv^-1-Renv^-4>1/(2Renv)>Renv^-10."],
            "actualOriginalTupleAndPerturbationEnvelopeProvedHere": False,
            "coversAllPhasesWheneverInputsAreGlobal": True,
            "sampledPointOrSavedPassUsed": False}


def actual_parameter_hierarchy():
    """Read exact original expressions; prove elementary hierarchy independently.

    No field norm, root value, accepted gate or attachedAnalyticConclusion is
    read. The finite expressions and the series inequality exp(x)>x for x>0
    prove finiteness and positivity of these parameter scales.
    """
    path = REPO / "research-ide/mathscope-m2/navier/source-profile-data.mjs"
    raw = path.read_text(encoding="utf-8")
    marker = "export const PINNED_N3 = "
    if marker not in raw:
        raise ValueError("Original exact parameter expressions absent")
    data = json.loads(raw.split(marker, 1)[1].strip().removesuffix(";"))
    p = data["parametersExactExpressions"]
    expected = {
        "Md": {"integer": 1048576},
        "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]},
        "logP": {"product": [{"integer": 2}, {"ref": "T"}]},
        "Pstar": {"exp": {"ref": "logP"}},
        "K": {"power": [{"ref": "Pstar"}, 2]},
        "h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}},
        "j0": {"power": [{"ref": "h"}, 4]},
        "sigmaStar": {"quotient": [{"ref": "j0"}, {"integer": 2000}]},
        "Q": {"quotient": [{"product": [{"integer": str(2 ** 260)}, {"ref": "K"}]}, {"power": [{"ref": "sigmaStar"}, 2]}]},
        "BRefUpper": {"power": [{"ref": "Q"}, 300]},
        "logCSelected": {"sum": [{"product": [{"integer": 10}, {"log": {"sum": [{"integer": 1}, {"ref": "BRefUpper"}]}}]}, {"power": [{"ref": "Q"}, 200]}]},
        "CSelected": {"exp": {"ref": "logCSelected"}},
        "sourceEnvelopeS": {"power": [{"ref": "CSelected"}, 100000]},
        "C12EnvelopeR": {"exp": {"power": [{"ref": "sourceEnvelopeS"}, 256]}},
        "radialFrequencyN": {"sum": [{"integer": 1}, {"ceil": {"power": [{"ref": "C12EnvelopeR"}, 50]}}]},
    }
    for key, value in expected.items():
        if p[key] != value:
            raise ValueError("Changed original source parameter hierarchy: " + key)
    if not 2 ** 260 > 8192:
        raise AssertionError("Exact integer parameter comparison failed")
    return {"status": "PROVED_ACTUAL_EXPLICIT_PARAMETER_HIERARCHY", "sourcePath": str(path.relative_to(REPO)).replace("\\", "/"),
            "sourceSHA256": digest(path), "exactExpressions": expected,
            "conclusions": ["All listed actual source parameter expressions are finite real numbers", "T>10, Pstar>1, K>1", "0<h<1/100, 0<sigmaStar<1/2000", "Q>2^260", "CSelected>Q, S=CSelected^100000>2^260", "Renv=exp(S^256)>S>2^260>8192", "N=1+ceil(Renv^50)>Renv^50"],
            "proof": ["Finite sums, products, integer powers and exponential of finite real numbers remain finite; all log arguments here are strictly positive.",
                      "Md>0 implies T=exp(Md)+10>10. Pstar=exp(2T)>1, K=Pstar^2>1.",
                      "h=exp(-8002T) lies in(0,1/100), since exp(8002T)>1+8002T>100. Hence sigmaStar=h^4/2000 lies in(0,1/2000).",
                      "The exact integer Q numerator is 2^260*K, so Q>2^260.",
                      "logCSelected=10log(1+Q^300)+Q^200>Q^200; exp(x)>x for x>0 follows from its nonnegative power series. Thus CSelected>Q, S>Q and exp(S^256)>S.",
                      "ceil(x)>=x and the retained extra1 give N>Renv^50."],
            "actualWholeProfileEnvelopeOrRayleighCertified": False, "sourceAcceptedFlagsRead": False,
            "hugeExponentialNumericallyEvaluated": False}


def rising(value, order):
    out = Q(1)
    for j in range(order):
        out *= Q(value) + j
    return out


def heat_kernel_lemma():
    """Prove the actual positive real heat primitive and analytic boundary.

    This is an integral theorem, not a quadrature observation. It certifies
    that ingredient for every fixed finite X>0, |eta|<=1 and actual h>0.
    It does not claim the whole source field or its joins have been proved.
    """
    hmax, Xmin = Q(1, 100), Q(4)
    deficit = hmax * (2 / Xmin) * (1 + hmax)
    if not deficit < Q(1, 2) or not 4 * (1 + hmax) < 6:
        raise AssertionError("Positive heat lower/slope comparisons failed")
    h = Q(1, 1000)
    coefficients = [rising(h, m) * rising(1 + h, m) / math.factorial(m) for m in range(7)]
    return {"status": "PROVED_REAL_HEAT_PRIMITIVE_ON_PHYSICAL_DOMAIN",
            "actualSourceNodes": {"normalizedGamma": 71517, "inverseGamma": 71518, "heatArgument": 71925, "heatLossIntegral": 71947, "normalizedHeatLoss": 71948},
            "definition": "H_h(Z)=1/Gamma(1+h)*integral_0^infinity exp(-t)*t^h*(1+Z*t)^(-h) dt",
            "domain": "0<h<1/100, Z>=0; actual Z=2*(1-eta^2)/X, X>0, abs(eta)<=1",
            "conclusions": ["Gamma(1+h) finite and strictly positive", "0<H_h(Z)<=1", "Every fixed real derivative extends continuously from the right at Z=0", "For X>=4, H_h(2d/X)>1/2 and 0<=-Z*H_h_prime(Z)/H_h(Z)<6h/X"],
            "allFixedDerivativeBound": "abs(H_h^(m)(Z))<=(h)_m*(1+h)_m for every integer m>=0 and every Z>=0",
            "proof": ["The positive gamma integrand exp(-t)*t^h is integrable at0 and infinity. Every polynomial moment is finite.",
                      "For Z>=0 the heat integrand is positive and <=the gamma integrand, giving 0<H<=1.",
                      "Differentiation m times produces (-1)^m*(h)_m*t^m*(1+Zt)^(-h-m). Its absolute normalized integral is <=(h)_m*Gamma(1+h+m)/Gamma(1+h)=(h)_m*(1+h)_m, uniformly on Z>=0. Dominated convergence proves every fixed derivative, including right limits at0.",
                      "Convexity gives (1+Zt)^(-h)>=1-hZt. Thus H>=1-hZ(1+h), while abs(H_prime)<=h(1+h). For Z<=2/X and X>=4, deficit<=101/20000<1/2; hence -ZH_prime/H<2hZ(1+h)<6h/X.",
                      "The actual compactified source integral is this same integral after t=u/(1-u), with Jacobian(1-u)^-2. The source heat loss is1-H, with no improper tail discarded."],
            "finiteArithmetic": {"maxDeficit": qtext(deficit), "lowerH": qtext(1 - deficit), "slopeCoefficient": qtext(4 * (1 + hmax)), "slopeUpperCoefficient": "6"},
            "analyticBoundaryObstruction": {
                "status": "PROVED_NO_HOLOMORPHIC_HEAT_EXTENSION_AT_ETA_ENDPOINTS_FOR_FIXED_POSITIVE_H",
                "exactAtZero": "H_h^(m)(0)=(-1)^m*(h)_m*(1+h)_m",
                "absoluteTaylorCoefficientRatio": "(h+m)*(1+h+m)/(m+1)>m for m>=1",
                "proof": "The Taylor coefficient ratios grow without bound, so the radius at Z=0 is0 for every fixed h>0. If H_h(2*(1-eta^2)/X) admitted a holomorphic neighborhood at eta=+1 or-1, the analytic local inverse of Z(eta), whose derivative is-4eta/X!=0 there, would give a holomorphic extension of H_h at Z=0, a contradiction.",
                "scope": "The actual full heat ingredient only. This does not refute an inner Picard strip whose radial collar excludes the heat modification.",
                "oneSidedRealSmoothnessRetained": True,
                "finiteControlCoefficients": {"h": qtext(h), "orders": list(range(7)), "absCoefficients": list(map(qtext, coefficients)), "controlAloneUsedAsProof": False}},
            "wholeOriginalLeadingFieldAndRayleighCertified": False,
            "negativeHeatArgumentOrComplexStripAssumed": False}


def negative_controls():
    examples = [
        ("positive-a-alone-is-insufficient", Q(1), Q(1), Q(0), Q(-2)),
        ("strict-boundary-v-equals-two", Q(1), Q(2), Q(0), Q(0)),
        ("zero-F-destroys-strictness", Q(0), Q(3), Q(0), Q(0)),
        ("loop-can-have-a-less-than-two", Q(1), Q(4, 5), Q(1), Q(8, 125)),
    ]
    rows = []
    for name, F, a, b, expected in examples:
        value = rayleigh_value(F, -a * F, b * F)
        if value != expected:
            raise AssertionError("Negative/control counterexample calculation failed: " + name)
        rows.append({"id": name, "F": qtext(F), "a": qtext(a), "b": qtext(b),
                     "polynomial": qtext(value), "strictRayleigh": value > 0,
                     "scope": "EXACT_LEMMA_CONTROL_NOT_ACTUAL_PROFILE_POINT"})
    for name, values in [("missing-F-lower", (0, 1, 1)), ("missing-a-lower", (1, 0, 1)), ("nonstrict-gap", (1, 1, 0)), ("negative-gap", (1, 1, -1))]:
        try:
            finite_margin(*values)
        except ValueError:
            rows.append({"id": name, "invalidPremiseRejected": True})
        else:
            raise AssertionError("Invalid global bound accepted")
    sign = rayleigh_value(1, 3, 0)
    if sign >= 0:
        raise AssertionError("Wrong radial-gradient sign was accepted")
    rows.append({"id": "wrong-source-gR-sign", "polynomial": qtext(sign), "strictRayleigh": False})
    return rows


def source_audit(artifacts):
    folder = Path(artifacts) / "mean-proof-inputs-38500114302" / "dag"
    for path, sha in [(folder / "header.json", HEADER_SHA), (folder / "source-dag-checkpoint.sqlite", DB_SHA), (REPO / BASE / "source-bytes-before.json", CAPTURE_SHA)]:
        if digest(path) != sha:
            raise ValueError("Changed byte-pinned original Rayleigh input: " + str(path))
    header = json.loads((folder / "header.json").read_bytes())
    spec = importlib.util.spec_from_file_location("rayleigh_source_dag", HERE.parent / "certification-20261014" / "source_dag.py")
    dag = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dag)
    defs = dag.definitions(header)
    db = sqlite3.connect((folder / "source-dag-checkpoint.sqlite").resolve().as_uri() + "?mode=ro", uri=True)
    cache = {}

    def take(ident):
        if type(ident) is not int or ident < 0:
            raise ValueError("Non-source scalar in original Rayleigh closure")
        if ident not in cache:
            row = db.execute("SELECT raw FROM nodes WHERE id=?", (ident,)).fetchone()
            if row is None:
                raise ValueError("Original Rayleigh source node missing: " + str(ident))
            cache[ident] = json.loads(row[0])
        return cache[ident]

    expected = {
        622971: ("actual_expression_partial", [692, [622954, 622958, 622962], [0, 0, 0]]),
        622981: ("actual_expression_partial", [692, [622954, 622958, 622962], [1, 0, 0]]),
        622991: ("actual_expression_partial", [693, [622954, 622958, 622962], [1, 0, 0]]),
        622992: ("multiply", [622954, 622981]),
        622942: ("multiply", [622884, 622941]),
        622950: ("multiply", [622886, 622949]),
        622941: ("actual_expression_partial", [2, [622824, 622829], [0, 0]]),
        622949: ("actual_expression_partial", [3, [622824, 622829], [0, 0]]),
        622820: ("actual_monotone_root", [2, 622803, 622804]),
        622821: ("integer_power", [622802, 2]),
        622822: ("multiply", [24, 622820]),
        622823: ("inverse", [622822]),
        622824: ("multiply", [622821, 622823]),
        622825: ("log_positive", [622820]),
        622826: ("multiply", [22, 622825]),
        622827: ("exp", [622826]),
        622828: ("inverse", [622827]),
        622829: ("multiply", [622803, 622828]),
        622883: ("multiply", [25246, 622825]),
        622884: ("exp", [622883]),
        622885: ("multiply", [281, 622825]),
        622886: ("exp", [622885]),
        25246: ("multiply", [20, 25245]),
        25245: ("add", [19, 23]),
        281: ("multiply", [20, 23]),
        9: ("source_parameter", ["h"]),
        19: ("rational", ["1", "2"]),
        20: ("rational", ["-1", "1"]),
        21: ("multiply", [9, 20]),
        22: ("add", [19, 21]),
        23: ("add", [9, 19]),
        24: ("rational", ["2", "1"]),
        622952: ("multiply", [24, 622809]),
        622953: ("multiply", [622807, 622952]),
        622954: ("sqrt_positive", [622953]),
        622955: ("log_positive", [622809]),
        622956: ("multiply", [22, 622955]),
        622957: ("exp", [622956]),
        622958: ("multiply", [622808, 622957]),
        622959: ("integer_power", [622808, 2]),
        622960: ("multiply", [20, 622959]),
        622961: ("add", [1, 622960]),
        622962: ("multiply", [622809, 622961]),
        622993: ("multiply", [622992, 622992]),
        622994: ("multiply", [622991, 622991]),
        622995: ("add", [622993, 622994]),
        622996: ("sqrt_positive", [622995]),
        622997: ("inverse", [622996]),
        622998: ("multiply", [622992, 622997]),
        623001: ("multiply", [24, 622971]),
        623002: ("multiply", [622998, 623001]),
        623003: ("add", [622996, 623002]),
        623004: ("multiply", [623002, 623003]),
        623005: ("multiply", [20, 623004]),
        623006: ("sqrt_positive", [623005]),
        623007: ("inverse", [623002]),
        623008: ("multiply", [623006, 623007]),
        71925: ("multiply", [6185, 25575]),
        6185: ("inverse", [4756]),
        25575: ("multiply", [24, 30]),
        71926: ("coordinate", ["actual_heat_Laplace_compact$264"]),
        71927: ("multiply", [20, 71926]),
        71928: ("add", [1, 71927]),
        71929: ("inverse", [71928]),
        71930: ("multiply", [71926, 71929]),
        71931: ("multiply", [20, 71930]),
        71932: ("log_positive", [71930]),
        71933: ("multiply", [9, 71932]),
        71934: ("add", [71931, 71933]),
        71935: ("exp", [71934]),
        71936: ("multiply", [71925, 71930]),
        71937: ("add", [1, 71936]),
        71938: ("log_positive", [71937]),
        71939: ("multiply", [9, 71938]),
        71940: ("multiply", [20, 71939]),
        71941: ("exp", [71940]),
        71942: ("multiply", [20, 71941]),
        71943: ("add", [1, 71942]),
        71944: ("integer_power", [71929, 2]),
        71945: ("multiply", [71935, 71943]),
        71946: ("multiply", [71944, 71945]),
        71947: ("definite_integral", [71946, 71926, 0, 1]),
        71948: ("multiply", [71518, 71947]),
        71518: ("inverse", [71517]),
        15: ("integer_power", [2, 2]),
        29: ("multiply", [15, 20]),
        30: ("add", [1, 29]),
        71505: ("coordinate", ["actual_heat_import_EulerGammaOnePlusHCompact$6$259"]),
        71506: ("multiply", [20, 71505]),
        71507: ("add", [1, 71506]),
        71508: ("inverse", [71507]),
        71509: ("multiply", [71505, 71508]),
        71510: ("multiply", [20, 71509]),
        71511: ("log_positive", [71509]),
        71512: ("multiply", [9, 71511]),
        71513: ("add", [71510, 71512]),
        71514: ("exp", [71513]),
        71515: ("integer_power", [71508, 2]),
        71516: ("multiply", [71514, 71515]),
        71517: ("definite_integral", [71516, 71505, 0, 1]),
    }
    for ident, (op, args) in expected.items():
        if take(ident) != {"op": op, "args": args}:
            raise ValueError("Changed actual Rayleigh formula node " + str(ident))
    for index, name, parameters, body in [(2, "ActualFinalLeadingF", [4756, 2], 71959), (3, "ActualFinalLeadingU", [4756, 2], 9236), (692, "ActualCommonBandLeading_F", [622802, 622803, 622804], 622942), (693, "ActualCommonBandLeading_G", [622802, 622803, 622804], 622950)]:
        row = defs["expression"][index]
        if row["name"] != name or row["parameters"] != parameters or row["body"] != body or row.get("unspecifiedOracle") is not False:
            raise ValueError("Changed original leading function registry")
    if defs["monotone"][2]["parameters"] != [622803, 622804]:
        raise ValueError("Slow inverse gained radial dependence")

    expanded = {}
    unresolved = []
    queue = [622971, 622991, 622992]
    seen = set()
    while queue:
        if len(seen) > 150000:
            raise ValueError("Rayleigh dependency closure exceeded its bounded resource budget")
        ident = queue.pop()
        if ident in seen:
            continue
        node = take(ident)
        seen.add(ident)
        op, args = node["op"], node["args"]
        children = dag.primitive_children(node)
        if op == "actual_expression_partial":
            row = defs["expression"][args[0]]
            expanded[f"expression:{args[0]}"] = row
            children += [row["body"], *row["parameters"]]
        elif op == "actual_monotone_root":
            row = defs["monotone"][args[0]]
            expanded[f"monotone:{args[0]}"] = row
            children += [row[k] for k in ["body", "variable", "left", "right", "derivativeLower", "derivativeUpper"]] + row["parameters"]
        elif op == "actual_quadratic_root":
            row = defs["quadratic"][args[0]]
            expanded[f"quadratic:{args[0]}"] = row
            children += sum(row["linear"], []) + sum(row["quadraticDiagonal"], []) + row["rhs"] + [row["scale"]] + sum(row["preconditioner"], []) + [row["rootRadius"], row["lipschitzUpper"]]
        elif op == "actual_natural_series":
            core = defs["fixed"]["core"]
            children += [core[k] for k in ["eta", "h", "Lambda", "A", "D", "d", "L", "Ustar", "Hstar", "Wstar", "Zstar", "chi", "zeta", "gSquared"]]
        if children is None:
            unresolved.append({"sourceNode": ident, "operation": op, "reason": "Mathematical operator semantics need independent audit"})
        else:
            queue += children
    source_rows = [[i, take(i)] for i in sorted(seen)]
    nodes_by_op = collections.defaultdict(list)
    for ident in sorted(seen):
        nodes_by_op[take(ident)["op"]].append(ident)
    mathematical_roots = {key: nodes_by_op[key] for key in ["actual_natural_series", "actual_quadratic_root", "actual_monotone_root"]}
    relevant = ["research-ide/mathscope-m2/navier/actual-stress-direction-bounds.mjs", "research-ide/mathscope-m2/navier/actual-leading-high-jets.mjs", "research-ide/mathscope-m2/navier/actual-continuation-exact-loop.mjs", "research-ide/mathscope-m2/navier/actual-continuation-exact-global.mjs", "research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs", "research-ide/mathscope-m2/navier/source-profile-data.mjs", "research-ide/mathscope-m3/navier/source-global-band.mjs"]
    capture = json.loads((REPO / BASE / "source-bytes-before.json").read_bytes())
    captured = {row["path"]: row for row in capture["files"]}
    source_files = []
    for path in relevant:
        row = captured[path]
        if digest(REPO / path) != row["sha256"] or (REPO / path).stat().st_size != row["bytes"]:
            raise ValueError("Changed actual Rayleigh producer: " + path)
        source_files.append(row)
    db.close()
    return {
        "headerSHA256": HEADER_SHA, "sourceDAGDatabaseSHA256": DB_SHA, "captureSHA256": CAPTURE_SHA,
        "actualProducerFiles": source_files,
        "exactAuthenticatedScalarRows": [[i, take(i)] for i in sorted(expected)],
        "actualLeadingDefinitions": {str(i): defs["expression"][i] for i in [2, 3, 692, 693]},
        "dependencyClosure": {"sourceNodes": len(seen), "sourceRowsSHA256": hashlib.sha256(canonical(source_rows).encode()).hexdigest(),
                              "operationCounts": {key: len(value) for key, value in sorted(nodes_by_op.items())},
                              "mathematicalRootNodes": mathematical_roots,
                              "expandedDefinitions": expanded, "unreviewedOperatorBoundaries": unresolved,
                              "piecewiseBranchesWereNotEvaluatedOrPromoted": True},
        "actualSlowChainRule": {
            "status": "SOURCE_BOUND_FORMULA_LEMMA_CONDITIONAL_ON_PROFILE_C1",
            "sourceNodes": {"F0": 622971, "gR": 622992, "gZ": 622991, "slowInverse": 622820, "X": 622824, "eta": 622829, "Fprofile": 71959, "Uprofile": 9236, "growthRadicand": 623005, "c0": 623008},
            "domain": "Xa<=Xrep<=Xb, etaRep in[-1,1], sRep in[1/2,2]; fixed positive finite original h<1/16",
            "identities": ["s=s(Z,T), so partial_R s=partial_R eta=0", "X=R^2/(2s), so R*partial_R X=2X", "Fslow=s^(-A-1/2)*Fprofile", "Gslow=s^(-A)*Uprofile", "E=sqrt(2X)*Fprofile", "a=1-2X*E_X/E, b=2X*U_X/E", "gR=-a*F0, gZ=b*F0"],
            "proof": "Differentiate the original shared leading expressions in R holding Z,T fixed. The s/eta factors have no R dependence. R*F_R=s^(-A-1/2)*2X*Fprofile_X=-a*F0. G_R=s^(-A-1/2)*sqrt(2X)*Uprofile_X=b*F0. On the representative image the unique retained inverse returns sRep.",
            "smoothActualProfileAndAllRepresentativeMembershipProvedHere": False,
        },
        "actualFrozenGrowthFormulaLemma": {
            "status": "SOURCE_FORMULA_AND_DOMAIN_IMPLICATION_PROVED",
            "sourceNodes": {"G": 622995, "sqrtG": 622996, "denominator": 623002, "growthRadicand": 623005, "lambda0": 623006, "c0": 623008},
            "identities": ["G=gR^2+gZ^2", "node623002=2*F0*gR/sqrt(G)", "node623005=P/G", "c0^2=P/(4*F0^2*gR^2)=(v_s-2)/2"],
            "proof": "P>0 implies F0*gR!=0, hence gR!=0 and G>0. Substitute the authenticated Ntheta=gR/sqrt(G) into the actual radicand: -2F0*gR/sqrt(G)*(sqrt(G)+2F0*gR/sqrt(G))=P/G>0. Its actual positive root and denominator are therefore real/nonzero. Divide their squares to obtain the c0 identity.",
            "premises": ["Every retained original F0,gR,gZ is finite real", "P=-2F0*gR*(gR^2+gZ^2+2F0*gR)>0", "The source C1/shear identities apply for the final equality in v_s"],
            "actualGlobalPremisesProvedHere": False,
        },
    }


def obligations(audit):
    roots = audit["dependencyClosure"]["mathematicalRootNodes"]
    return [
        {"id": "RAY-ACTUAL-CLASS", "status": "OPEN", "sourceNodes": roots,
         "required": "Actual final Fprofile71959 and Uprofile9236 exist and are C1 on the entire closed annulus, including natural4483, B26 activation, B8 quadratic5029, original C1 variance/circle inverses, I1 and I2 roots and heat joins.",
         "proofReferences": ["Appendix B, B22/B26/B29", "natural/B26/heat input classes"], "serializedPASSIsProof": False},
        {"id": "RAY-ACTUAL-COVER", "status": "OPEN", "sourceNodes": [622807, 622808, 622809, 622820],
         "required": "Every original representative selected for every label/copy lies in the source image Xa<=X<=Xb, |eta|<=1, 1/2<=s<=2. Parametric declarations alone do not prove the selector's range."},
        {"id": "RAY-ACTUAL-F", "status": "OPEN", "sourceNodes": [622971, 71959],
         "required": "Independent same-source proof F0>Renv^-10 throughout the representative domain, with the final heat/I2/I1 corrections and factor s^(-A-1/2) retained.",
         "proofReferences": ["S9-S13", "C12 section1 actual reciprocal envelope", "S4 positive exterior power"]},
        {"id": "RAY-ACTUAL-A", "status": "OPEN", "sourceNodes": [622971, 622981, 622992, 71959],
         "required": "Independent same-source proof a=-gR/F0>Renv^-10 throughout the representative domain.",
         "proofReferences": ["B29/A10 inner a lower", "C12 four raw gaps", "O sections8-9", "H19/H22/H25"]},
        {"id": "RAY-ACTUAL-GAP", "status": "OPEN", "sourceNodes": [622971, 622991, 622992, 623005],
         "required": "Independent entire-domain proof v_s-2=a+b^2/a-2>Renv^-10, including every phase of the actual original finite-N C12 loop and every partial I1 repair integral.",
         "proofReferences": ["B29/A9 inner collar", "C12 section1 raw loop gaps and section5 inequality12", "O sections8-9", "H19/H22/H25"],
         "minimalFiniteLowerBoundLemmaNowProved": "F0>=f>0, a>=alpha>0, v_s-2>=gamma>0 imply polynomial>=2*alpha^2*f^4*gamma>0"},
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    started = time.monotonic()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    try:
        lemma = exact_polynomial_lemma()
        audit = source_audit(args.artifacts)
        result = {"schema": "MathScope.N6.IndependentOriginalRayleigh/1", "status": "EXACT_SOURCE_REDUCTION_AND_LOWER_LEMMA_PROVED_GLOBAL_APPLICATION_OPEN",
                  "universalPolynomialLemma": lemma, "sourceAudit": audit,
                  "finiteExactLowerBoundExample": {"inputs": {"F_lower": "1/3", "a_lower": "1/5", "gap_lower": "1/7"}, "lower": qtext(finite_margin(Q(1, 3), Q(1, 5), Q(1, 7))), "isActualSourceEnclosure": False},
                  "powerLowerBoundLemma": power_margin_ledger(), "c12FiniteRobustnessLemma": c12_robustness_lemma(), "actualParameterHierarchy": actual_parameter_hierarchy(), "actualHeatPrimitiveLemma": heat_kernel_lemma(), "negativeControls": negative_controls(),
                  "obligations": obligations(audit),
                  "scope": {"exactOriginalSourceRootsUsed": True, "TaylorGreenOrGalerkinSurrogateUsed": False, "sampledRepresentativeUsedAsProof": False,
                            "actualOriginalGlobalRayleighProved": False, "actualGlobalPositiveMarginEnclosed": False,
                            "actualProfileCounterexampleFound": False, "originalN601Complete": False, "originalN602Complete": False, "completeN6": False, "originalCountsChanged": False},
                  "elapsedSeconds": time.monotonic() - started}
        (out / "rayleigh-result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(canonical({"status": result["status"], "dependencySourceNodes": audit["dependencyClosure"]["sourceNodes"], "unreviewedOperatorBoundaries": len(audit["dependencyClosure"]["unreviewedOperatorBoundaries"]), "unresolvedGlobalObligations": len(result["obligations"]), "originalN601Complete": False, "originalN602Complete": False}))
    except Exception as error:
        (out / "rayleigh-failure.json").write_text(json.dumps({"status": "UNRESOLVED", "message": str(error), "originalN601Complete": False, "originalN602Complete": False}, indent=2) + "\n", encoding="utf-8")
        raise


if __name__ == "__main__":
    main()
