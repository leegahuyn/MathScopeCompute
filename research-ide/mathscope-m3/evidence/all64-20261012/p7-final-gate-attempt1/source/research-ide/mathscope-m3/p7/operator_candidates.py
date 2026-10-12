"""User-registered research hypotheses and exact finite truncation comparisons.

The supplied infinite operator/domain statements are hypotheses. Exact finite
matrix identities and numerical determinant probes may refute their proposed
finite contracts, but never prove an infinite operator, its domain, or RH.
"""
from __future__ import annotations

from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from math import comb
from pathlib import Path
import re

from flint import fmpq_mat

from . import ball_backend as balls

SCHEMA = "MathScope.M3.P7.RegisteredOperatorAudit/1"
HYPOTHESIS_KEYS = ("operatorDomain", "zeroSpectrum", "regularizedDeterminant", "trace", "duality", "positivity")


def _canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def _q(value):
    answer = balls.parse_exact_rational(value)
    if max(abs(answer.numerator).bit_length(), answer.denominator.bit_length()) > 512:
        raise balls.BallRequestError("Operator matrix input exceeds its 512-bit exact-rational budget")
    return answer


def _str(value):
    value = Fraction(value)
    return str(value.numerator) if value.denominator == 1 else str(value.numerator)+"/"+str(value.denominator)


def _text(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 4096 or "\x00" in value:
        raise balls.BallRequestError("Every registered hypothesis needs bounded nonempty text")
    return value


def _matrix(value, size):
    if not isinstance(value, list) or len(value) != size or any(not isinstance(row, list) or len(row) != size for row in value):
        raise balls.BallRequestError("A finite matrix must have the declared square shape")
    return [[_q(entry) for entry in row] for row in value]


def _flint_matrix(matrix):
    return fmpq_mat([[balls.fmpq(value.numerator, value.denominator) for value in row] for row in matrix])


def _expand(rows, size):
    if not isinstance(rows, list) or len(rows) > size+4:
        raise balls.BallRequestError("A bounded zero/spectrum list is required")
    values = []
    for row in rows:
        if not isinstance(row, dict) or set(row) != {"value", "multiplicity"}:
            raise balls.BallRequestError("Spectrum/zero entries need value and multiplicity")
        multiplicity = row["multiplicity"]
        if type(multiplicity) is not int or not 1 <= multiplicity <= size+4:
            raise balls.BallRequestError("Invalid finite zero multiplicity")
        values.extend([_q(row["value"])] * multiplicity)
        if len(values) > 2*size+8:
            raise balls.BallRequestError("Finite multiplicities exceed their budget")
    return values


def _polynomial(zeros):
    result = [Fraction(1)]
    for zero in zeros:
        updated = [Fraction(0)]*(len(result)+1)
        for i, coefficient in enumerate(result):
            updated[i] -= zero*coefficient
            updated[i+1] += coefficient
        result = updated
    return result


def _reflected(coefficients, center):
    result = [Fraction(0)]*len(coefficients)
    for i, coefficient in enumerate(coefficients):
        for j in range(i+1):
            result[j] += coefficient*comb(i, j)*(2*center)**(i-j)*(-1)**j
    return result


def _evaluate_polynomial(coefficients, point):
    value = balls.arb(0)
    for coefficient in reversed(coefficients):
        value = value*point + balls.arb(balls.fmpq(coefficient.numerator, coefficient.denominator))
    return value


def validate_truncation(value, *, precision_bits=192, tolerance="1e-35"):
    keys = {"id", "dimension", "domain", "matrix", "spectrum", "determinant", "trace", "functionalEquation", "positivityMatrix"}
    if not isinstance(value, dict) or set(value) != keys:
        raise balls.BallRequestError("A registered truncation must match the complete finite schema")
    _text(value["id"])
    size = value["dimension"]
    if type(size) is not int or not 2 <= size <= 16:
        raise balls.BallRequestError("Registered truncation dimension must be an integer in [2,16]")
    matrix, positivity = _matrix(value["matrix"], size), _matrix(value["positivityMatrix"], size)
    spectrum = _expand(value["spectrum"], size)
    determinant, trace, reflection = value["determinant"], value["trace"], value["functionalEquation"]
    if not isinstance(determinant, dict) or set(determinant) != {"kind", "zeros", "poles", "extraTrivialZeroFactors", "constantExponent", "linearExponent"}:
        raise balls.BallRequestError("Determinant data needs zero, pole, trivial-factor and both exponential normalization fields")
    zeros = _expand(determinant["zeros"], size)
    poles = _expand(determinant["poles"], size)
    extras = _expand(determinant["extraTrivialZeroFactors"], size)
    constant, linear = _q(determinant["constantExponent"]), _q(determinant["linearExponent"])
    if not isinstance(trace, dict) or set(trace) != {"inverse", "inverseSquare"}:
        raise balls.BallRequestError("Both finite trace claims are required")
    claimed_trace1, claimed_trace2 = _q(trace["inverse"]), _q(trace["inverseSquare"])
    if not isinstance(reflection, dict) or set(reflection) != {"center", "sign"} or type(reflection["sign"]) is not int or reflection["sign"] not in (-1, 1):
        raise balls.BallRequestError("A finite functional equation needs an exact center and sign +/-1")
    center, sign = _q(reflection["center"]), reflection["sign"]
    actual = _flint_matrix(matrix)
    characteristic = [Fraction(str(coefficient)) for coefficient in actual.charpoly()]
    invertible = characteristic[0] != 0
    polynomial = [coefficient/characteristic[0] for coefficient in characteristic] if invertible else None
    inverse = actual.inv() if invertible else None
    actual_trace1 = sum((Fraction(str(inverse[i, i])) for i in range(size)), Fraction()) if invertible else None
    square_inverse = inverse*inverse if invertible else None
    actual_trace2 = sum((Fraction(str(square_inverse[i, i])) for i in range(size)), Fraction()) if invertible else None
    hermitian = all(matrix[i][j] == matrix[j][i] for i in range(size) for j in range(size))
    positivity_symmetric = all(positivity[i][j] == positivity[j][i] for i in range(size) for j in range(size))
    minors = [Fraction(str(_flint_matrix([row[:n] for row in positivity[:n]]).det())) for n in range(1, size+1)]
    checks = {
        "finiteDomain": value["domain"] == "C^N",
        "selfAdjointFiniteMatrix": hermitian, "invertible": invertible,
        "spectrumIncludingMultiplicity": _polynomial(spectrum) == characteristic,
        "allDeterminantZerosIncludingMultiplicity": _polynomial(zeros) == characteristic,
        "determinantIsEntire": not poles,
        "regularizedDeterminantKind": determinant["kind"] == "det2(I-z*D^-1)",
        "trivialZeroFactorsMatchEntireDet2Convention": not extras,
        "constantExponentialNormalization": constant == 0,
        "linearExponentialNormalization": invertible and linear == actual_trace1,
        "traceInverse": invertible and claimed_trace1 == actual_trace1,
        "traceInverseSquare": invertible and claimed_trace2 == actual_trace2,
        "positiveSuppliedQuadraticForm": positivity_symmetric and all(value > 0 for value in minors),
        "functionalEquationPolynomialAndExponential": invertible and actual_trace1 == 0 and _reflected(polynomial, center) == [sign*x for x in polynomial],
    }
    probes = []
    if invertible:
        with balls.flint_workprec(precision_bits):
            def supplied(point):
                poly = _evaluate_polynomial(polynomial, point)
                for zero in extras:
                    if zero == 0:
                        return balls.arb("nan")
                    poly *= 1-point/balls.arb(balls.fmpq(zero.numerator, zero.denominator))
                for pole in poles:
                    if pole == 0:
                        return balls.arb("nan")
                    poly /= 1-point/balls.arb(balls.fmpq(pole.numerator, pole.denominator))
                return poly*(balls.arb(balls.fmpq(constant.numerator, constant.denominator)) + point*balls.arb(balls.fmpq(linear.numerator, linear.denominator))).exp()
            for rational in (Fraction(1, 4), Fraction(-1, 3)):
                point = balls.arb(balls.fmpq(rational.numerator, rational.denominator))
                reference = _evaluate_polynomial(polynomial, point)*(point*balls.arb(balls.fmpq(actual_trace1.numerator, actual_trace1.denominator))).exp()
                given = supplied(point)
                reflected = supplied(2*balls.arb(balls.fmpq(center.numerator, center.denominator))-point)
                difference, fe_difference = given-reference, reflected-sign*given
                probes.append({"point": _str(rational), "referenceDet2": balls.serialize_arb(reference, tolerance),
                               "suppliedDeterminant": balls.serialize_arb(given, tolerance),
                               "normalizationDifference": balls.serialize_arb(difference),
                               "normalizationDifferenceExcludesZero": bool(difference.is_finite() and not difference.contains(0)),
                               "functionalEquationResidual": balls.serialize_arb(fe_difference),
                               "functionalEquationResidualExcludesZero": bool(fe_difference.is_finite() and not fe_difference.contains(0))})
    return {"id": value["id"], "dimension": size, "pass": all(checks.values()),
            "status": "FINITE_CONTRACT_VALID" if all(checks.values()) else "FINITE_CONTRACT_REJECTED",
            "checks": checks, "failedChecks": [key for key, ok in checks.items() if not ok],
            "characteristicPolynomialAscending": [_str(x) for x in characteristic],
            "normalizedDeterminantPolynomialAscending": None if polynomial is None else [_str(x) for x in polynomial],
            "actualTraceInverse": None if actual_trace1 is None else _str(actual_trace1),
            "actualTraceInverseSquare": None if actual_trace2 is None else _str(actual_trace2),
            "positiveQuadraticFormLeadingMinors": [_str(x) for x in minors],
            "determinantProbes": probes,
            "infiniteOperatorOrRHProved": False,
            "positivityMeaning": "the supplied finite quadratic form is positive; this is not positivity of an unbounded infinite operator or an RH bridge"}


def _negative_controls(truncation, bits, tolerance):
    changes = [
        ("missing-zero", "determinant.zeros", lambda v: v["determinant"]["zeros"].pop()),
        ("wrong-trivial-zero-factor", "determinant.extraTrivialZeroFactors", lambda v: v["determinant"].update(extraTrivialZeroFactors=[{"value": "-2", "multiplicity": 1}])),
        ("extra-pole", "determinant.poles", lambda v: v["determinant"].update(poles=[{"value": "-3", "multiplicity": 1}])),
        ("constant-exponential-normalization", "determinant.constantExponent", lambda v: v["determinant"].update(constantExponent="1")),
        ("linear-exponential-normalization", "determinant.linearExponent", lambda v: v["determinant"].update(linearExponent=_str(_q(v["determinant"]["linearExponent"])+1))),
        ("multiplicity", "determinant.zeros[0].multiplicity", lambda v: v["determinant"]["zeros"][0].update(multiplicity=v["determinant"]["zeros"][0]["multiplicity"]+1)),
        ("functional-equation-sign", "functionalEquation.sign", lambda v: v["functionalEquation"].update(sign=-v["functionalEquation"]["sign"])),
        ("wrong-finite-domain", "domain", lambda v: v.update(domain="all l2 sequences")),
        ("negative-quadratic-form", "positivityMatrix[0][0]", lambda v: v["positivityMatrix"][0].__setitem__(0, "-1")),
        ("trace-mismatch", "trace.inverseSquare", lambda v: v["trace"].update(inverseSquare=_str(_q(v["trace"]["inverseSquare"])+1))),
    ]
    result = []
    for identifier, path, mutate in changes:
        altered = deepcopy(truncation)
        mutate(altered)
        check = validate_truncation(altered, precision_bits=bits, tolerance=tolerance)
        result.append({"id": identifier, "changedField": path, "rejected": not check["pass"],
                       "counterexample": altered, "validation": check})
    return result


def reference_registration():
    """An explicit user-editable research registration, never a Riemann operator."""
    truncations = []
    for size in (4, 6):
        diagonal = [(-1 if i % 2 == 0 else 1)*(i//2+1) for i in range(size)]
        spectrum = [{"value": str(value), "multiplicity": 1} for value in diagonal]
        truncations.append({"id": "symmetric-cutoff-"+str(size), "dimension": size, "domain": "C^N",
            "matrix": [[str(diagonal[i]) if i == j else "0" for j in range(size)] for i in range(size)],
            "spectrum": spectrum,
            "determinant": {"kind": "det2(I-z*D^-1)", "zeros": deepcopy(spectrum), "poles": [],
                            "extraTrivialZeroFactors": [], "constantExponent": "0", "linearExponent": "0"},
            "trace": {"inverse": "0", "inverseSquare": _str(sum((Fraction(1, value*value) for value in diagonal), Fraction()))},
            "functionalEquation": {"center": "0", "sign": 1},
            "positivityMatrix": [["1" if i == j else "0" for j in range(size)] for i in range(size)]})
    return {"id": "symmetric-integer-research", "operator": "D e_(k,+)=k e_(k,+), D e_(k,-)=-k e_(k,-)",
            "hilbertSpace": "l2(N x {+,-}, C)",
            "hypotheses": {
                "operatorDomain": "Dom(D) consists of sequences with sum k^2(|a_(k,+)|^2+|a_(k,-)|^2)<infinity; its adjoint domain is the same.",
                "zeroSpectrum": "The zeros of the det2 candidate are the signed integer spectrum with multiplicity. They are not asserted to be Riemann zeros.",
                "regularizedDeterminant": "Use det2(I-z D^-1), normalized by F(0)=1 and F'(0)=0, with no extra trivial-zero factor.",
                "trace": "The inverse-square trace is the sum of squared reciprocal eigenvalues; finite cutoffs need separate tails.",
                "duality": "The paired signed spectrum proposes F(z)=F(-z). A relation to xi requires a further unproved bridge.",
                "positivity": "The supplied identity quadratic form is positive; it does not identify any Riemann Weil-positivity form."},
            "truncations": truncations}


def audit_registered_operator(request):
    allowed = {"candidate", "registration", "precisionBits", "tolerance"}
    if not isinstance(request, dict) or set(request)-allowed or request.get("candidate") != "registered":
        raise balls.BallRequestError("Use candidate=registered with the closed registration request")
    registration = request.get("registration")
    if not isinstance(registration, dict) or set(registration) != {"id", "operator", "hilbertSpace", "hypotheses", "truncations"}:
        raise balls.BallRequestError("Registration needs id, operator, Hilbert space, all six hypotheses and truncations")
    if not isinstance(registration["id"], str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,63}", registration["id"]):
        raise balls.BallRequestError("Invalid bounded registration ID")
    _text(registration["operator"])
    _text(registration["hilbertSpace"])
    hypotheses = registration["hypotheses"]
    if not isinstance(hypotheses, dict) or set(hypotheses) != set(HYPOTHESIS_KEYS):
        raise balls.BallRequestError("All operator/domain, zero-spectrum, determinant, trace, duality and positivity hypotheses must be recorded")
    for statement in hypotheses.values():
        _text(statement)
    truncations = registration["truncations"]
    if not isinstance(truncations, list) or not 2 <= len(truncations) <= 4:
        raise balls.BallRequestError("Compare between two and four explicit truncations")
    if any(not isinstance(row, dict) or not isinstance(row.get("id"), str) for row in truncations):
        raise balls.BallRequestError("Every truncation must be an object with a text ID")
    if len({row["id"] for row in truncations}) != len(truncations):
        raise balls.BallRequestError("Truncation IDs must be distinct")
    bits = request.get("precisionBits", 192)
    if type(bits) is not int or not 64 <= bits <= 4096:
        raise balls.BallRequestError("precisionBits must be an integer in [64,4096]")
    tolerance = request.get("tolerance", "1e-35")
    if not 0 < balls.parse_exact_rational(tolerance) <= 1:
        raise balls.BallRequestError("tolerance must be a positive exact rational string at most one")
    validations = [validate_truncation(row, precision_bits=bits, tolerance=tolerance) for row in truncations]
    comparisons = []
    for a, b in zip(truncations, truncations[1:]):
        n, m = a["dimension"], b["dimension"]
        compatible = n < m and all(_q(a["matrix"][i][j]) == _q(b["matrix"][i][j]) for i in range(n) for j in range(n))
        comparisons.append({"from": a["id"], "to": b["id"], "dimensions": [n, m],
                            "exactCompressionCompatibility": compatible,
                            "spectraIncludingMultiplicity": [a["spectrum"], b["spectrum"]],
                            "poleData": [a["determinant"]["poles"], b["determinant"]["poles"]],
                            "infiniteLimitEstablished": False})
    # A mutation of an already invalid object is not a successful negative
    # control: the original defect could be the only reason for rejection.
    # Keep such a registration reviewable without issuing a vacuous PASS.
    negative_baseline_valid = validations[0]["pass"]
    negatives = _negative_controls(truncations[0], bits, tolerance) if negative_baseline_valid else []
    finite_pass = all(row["pass"] for row in validations) and all(row["exactCompressionCompatibility"] for row in comparisons)
    result = {
        "schema": SCHEMA, "request": deepcopy(request), "registration": deepcopy(registration),
        "status": "FINITE_COMPARISONS_PASSED_RESEARCH_OPEN" if finite_pass else "FINITE_COUNTEREXAMPLES_FOUND_RESEARCH_OPEN",
        "finiteContractsPass": finite_pass, "researchStatus": "RESEARCH_OPEN",
        "registeredHypotheses": [{"id": registration["id"]+":"+key, "kind": "USER_HYPOTHESIS",
                                   "statement": hypotheses[key], "infiniteClaimProved": False} for key in HYPOTHESIS_KEYS],
        "truncationValidations": validations, "truncationComparisons": comparisons,
        "negativeControls": negatives,
        "negativeControlBaseline": {"id": truncations[0]["id"], "valid": negative_baseline_valid,
                                    "status": "EXECUTED_FROM_VALID_BASELINE" if negative_baseline_valid else "NOT_EXECUTED_BASELINE_REJECTED"},
        "negativeControlsAllRejected": bool(negatives) and all(row["rejected"] for row in negatives),
        "finitePassMeaning": "Only the supplied exact finite matrices and their determinant/trace/reflection contracts passed. Domain, limit, zero correspondence and RH are independent research obligations.",
        "scope": {"userOperatorAndDomainRegistration": True,
                  "globalOperatorExistenceProved": False, "globalDomainVerified": False,
                  "zeroSpectrumCorrespondenceProved": False, "globalRHProved": False,
                  "finitePassCanPromoteGlobalClaim": False, "formalLeanProofIssued": False},
        "sourceSha256": {name: sha256((Path(__file__).parent/name).read_bytes()).hexdigest()
                         for name in ("operator_candidates.py", "operator_registry.py", "ball_backend.py")},
    }
    result["computationSha256"] = sha256(_canonical(result)).hexdigest()
    return result
