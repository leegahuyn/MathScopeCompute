"""Finite operator contracts and an explicit non-RH spectral-zeta reference.

D e_n=n e_n on l2(N), Dom(D)={a:sum n^2|a_n|^2<infinity}, is positive
self-adjoint with compact Hilbert-Schmidt inverse. Its spectral zeta equals
zeta(s) for Re(s)>1 and extends meromorphically, but its spectrum is N, not
the nontrivial zeta zeros or their ordinates. The regularized determinant is
det_2(I-z D^-1)=prod_n (1-z/n)*exp(z/n)=exp(EulerGamma*z)/Gamma(1-z).

The audit computes finite matrices, exact characteristic polynomials, traces,
positivity, and actual normalization probes. An explicit product-tail bound
crosschecks the infinite Gamma expression. A generic RH operator stays open.
Finite fixture checks cannot establish the missing infinite operator bridges.
"""

from __future__ import annotations

from collections import Counter
from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path

from . import ball_backend as balls


SCHEMA = "MathScope.M3.P7.OperatorAudit/1"
FIXTURE_SCHEMA = "MathScope.M3.P7.FiniteOperatorFixture/1"
MAX_DIMENSION = 32
BRIDGE_IDS = (
    "OP-DENSE-SELFADJOINT-DOMAIN", "OP-COMPACT-RESOLVENT",
    "OP-ZERO-SPECTRUM-WITH-MULTIPLICITY", "OP-DET-XI-NORMALIZATION",
    "OP-TRACE-EXPLICIT-FORMULA", "OP-DUALITY-XI-REFLECTION",
    "OP-POSITIVITY-TO-RH",
)
SOURCES = [
    {"id": "DLMF-GAMMA-WEIERSTRASS", "url": "https://dlmf.nist.gov/5.8.E2",
     "use": "Weierstrass reciprocal-Gamma product fixes the regularization and the sign of EulerGamma*z."},
    {"id": "DLMF-ZETA-SERIES", "url": "https://dlmf.nist.gov/25.2.E1",
     "use": "The spectral-zeta Dirichlet series equals Riemann zeta only in its convergence half-plane before continuation."},
    {"id": "DLMF-ZETA-GAMMA-SERIES", "url": "https://dlmf.nist.gov/25.8",
     "use": "Related zeta/Gamma identities; no spectrum-zero correspondence follows from these identities."},
]


def _canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(",", ":"), allow_nan=False).encode("ascii")


def _seal(value):
    value["computationSha256"] = sha256(_canonical(value)).hexdigest()
    return value


def _qstr(value):
    value = Fraction(value)
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def _dimension(dimension):
    if type(dimension) is not int or not 2 <= dimension <= MAX_DIMENSION:
        raise balls.BallRequestError("dimension must be an integer in [2,32]")
    return dimension


def _precision_tolerance(precision_bits, tolerance):
    if type(precision_bits) is not int or not 64 <= precision_bits <= 4096:
        raise balls.BallRequestError("precisionBits must be an integer in [64,4096]")
    tolerance = balls.parse_exact_rational(tolerance)
    if not 0 < tolerance <= 1:
        raise balls.BallRequestError("tolerance must be an exact string in (0,1]")
    return tolerance


def _exact(value):
    result = balls.parse_exact_rational(value)
    if max(abs(result.numerator).bit_length(), result.denominator.bit_length()) > 512:
        raise balls.BallRequestError("finite matrix rational exceeds the 512-bit contract budget")
    return result


def _as_arb(value):
    return balls.arb_from_exact_component(_qstr(value))


def _polynomial_from_roots(roots):
    # Ascending coefficients of prod(lambda-z), with exact rational arithmetic.
    result = [Fraction(1)]
    for root in roots:
        updated = [Fraction(0)] * (len(result) + 1)
        for power, coefficient in enumerate(result):
            updated[power] += root*coefficient
            updated[power + 1] -= coefficient
        result = updated
    return result


def make_reference_fixture(dimension: int = 8) -> dict:
    """Data to be checked, not a precomputed PASS or a trusted proof token."""
    n = _dimension(dimension)
    inverse_trace = sum((Fraction(1, k) for k in range(1, n+1)), Fraction())
    square_trace = sum((Fraction(1, k*k) for k in range(1, n+1)), Fraction())
    return {
        "schema": FIXTURE_SCHEMA, "candidateId": "diagonal-integers", "dimension": n,
        "domain": "C^N", "matrix": [[str(i+1) if i == j else "0" for j in range(n)] for i in range(n)],
        "claims": {
            "spectrum": [{"value": str(k), "multiplicity": 1} for k in range(1, n+1)],
            "determinantKind": "det2", "linearCounterterm": _qstr(inverse_trace),
            "traceInverseSquare": _qstr(square_trace), "adjoint": "self", "strictlyPositive": True,
            "nontrivialZetaZerosEqualSpectrum": False, "globalRHProved": False,
        },
    }


def _parse_fixture(fixture):
    if not isinstance(fixture, dict) or set(fixture) != {"schema", "candidateId", "dimension", "domain", "matrix", "claims"}:
        raise balls.BallRequestError("finite fixture must match the closed fixture schema")
    if fixture["schema"] != FIXTURE_SCHEMA or fixture["candidateId"] != "diagonal-integers":
        raise balls.BallRequestError("unsupported finite fixture schema or candidate")
    n = _dimension(fixture["dimension"])
    matrix = fixture["matrix"]
    if not isinstance(matrix, list) or len(matrix) != n or any(not isinstance(row, list) or len(row) != n for row in matrix):
        raise balls.BallRequestError("matrix must have dimension-by-dimension exact string entries")
    matrix = [[_exact(entry) for entry in row] for row in matrix]
    claims = fixture["claims"]
    keys = {"spectrum", "determinantKind", "linearCounterterm", "traceInverseSquare", "adjoint",
            "strictlyPositive", "nontrivialZetaZerosEqualSpectrum", "globalRHProved"}
    if not isinstance(claims, dict) or set(claims) != keys:
        raise balls.BallRequestError("finite fixture claims must match the closed contract")
    spectrum = claims["spectrum"]
    if not isinstance(spectrum, list) or len(spectrum) > n:
        raise balls.BallRequestError("spectrum must be a bounded list with explicit multiplicities")
    expanded = []
    for row in spectrum:
        if not isinstance(row, dict) or set(row) != {"value", "multiplicity"}:
            raise balls.BallRequestError("each spectral row must have exactly value and multiplicity")
        multiplicity = row["multiplicity"]
        if type(multiplicity) is not int or not 1 <= multiplicity <= n:
            raise balls.BallRequestError("multiplicity must be an integer in [1,N]")
        if len(expanded) + multiplicity > 2*n:
            raise balls.BallRequestError("claimed spectral multiplicity exceeds the finite audit budget")
        expanded.extend([_exact(row["value"])] * multiplicity)
    return n, matrix, claims, expanded, _exact(claims["linearCounterterm"]), _exact(claims["traceInverseSquare"])


def validate_finite_fixture(fixture: dict, *, precision_bits: int = 192, tolerance: str = "1e-35") -> dict:
    """Check the actual finite reference compression, not just its labels.

    Exact diagonal spectral data proves the finite identities. Floating ball
    probes crosscheck implementation and reject altered normalization; overlap
    alone is not treated as a proof of an identity.
    """
    tolerance_value = _precision_tolerance(precision_bits, tolerance)
    n, matrix, claims, expanded, counterterm, claimed_trace2 = _parse_fixture(fixture)
    diagonal = [matrix[k][k] for k in range(n)]
    is_diagonal = all(matrix[i][j] == 0 for i in range(n) for j in range(n) if i != j)
    reference_match = is_diagonal and diagonal == list(map(Fraction, range(1, n+1)))
    hermitian = all(matrix[i][j] == matrix[j][i] for i in range(n) for j in range(n))
    invertible = is_diagonal and all(diagonal)
    checks = {
        "finiteDomainMatches": fixture["domain"] == "C^N",
        "referenceCompressionMatches": reference_match,
        "matrixHermitianAndAdjointClaim": hermitian and claims["adjoint"] == "self",
        "strictPositivity": is_diagonal and all(value > 0 for value in diagonal) and claims["strictlyPositive"] is True,
        "invertible": invertible,
        "spectrumAndMultiplicityMatchMatrix": is_diagonal and Counter(expanded) == Counter(diagonal),
        "characteristicPolynomialMatches": is_diagonal and _polynomial_from_roots(expanded) == _polynomial_from_roots(diagonal),
        "regularizationKind": claims["determinantKind"] == "det2",
        "noUnsupportedSpectrumOrRHClaim": claims["nontrivialZetaZerosEqualSpectrum"] is False and claims["globalRHProved"] is False,
    }
    trace1 = sum((1/value for value in diagonal), Fraction()) if invertible else None
    trace2 = sum((1/(value*value) for value in diagonal), Fraction()) if invertible else None
    checks["linearCountertermEqualsTraceInverse"] = trace1 is not None and counterterm == trace1
    checks["traceInverseSquareMatches"] = trace2 is not None and claimed_trace2 == trace2
    probes = []
    if invertible:
        with balls.flint_workprec(precision_bits):
            for point in (Fraction(1, 4), Fraction(-1, 3)):
                z = _as_arb(point)
                unregularized = balls.arb(1)
                for eigenvalue in diagonal:
                    unregularized *= 1 - z/_as_arb(eigenvalue)
                expected = unregularized * (z*_as_arb(trace1)).exp()
                supplied = unregularized * (z*_as_arb(counterterm)).exp()
                difference = supplied - expected
                probes.append({
                    "z": _qstr(point), "computedDet2": balls.serialize_arb(expected, tolerance_value),
                    "claimedNormalizationValue": balls.serialize_arb(supplied, tolerance_value),
                    "difference": balls.serialize_arb(difference),
                    "normalizationMismatchNumericallySeparated": not difference.contains(0),
                })
            # For real diagonal D, <u,Dv>=<Du,v> holds term by term. Show an
            # exact rational check, in addition to matrix-transpose equality.
            u = [Fraction(k+1, n+1) for k in range(n)]
            v = [Fraction((-1)**k, k+1) for k in range(n)]
            left = sum((u[k]*diagonal[k]*v[k] for k in range(n)), Fraction())
            right = sum((diagonal[k]*u[k]*v[k] for k in range(n)), Fraction())
    else:
        left = right = None
    checks["finiteAdjointDualityWitness"] = left is not None and left == right and hermitian
    probes_resolved = bool(probes) and all(row["computedDet2"]["toleranceMet"] and row["claimedNormalizationValue"]["toleranceMet"] for row in probes)
    exact_pass = all(checks.values())
    return {
        "schema": "MathScope.M3.P7.FiniteOperatorValidation/1",
        "status": "FINITE_CONTRACT_VALID" if exact_pass else "FINITE_CONTRACT_REJECTED",
        "pass": exact_pass, "checks": checks, "dimension": n,
        "actualDiagonal": [_qstr(value) for value in diagonal],
        "actualCharacteristicPolynomialAscending": [_qstr(value) for value in _polynomial_from_roots(diagonal)] if is_diagonal else None,
        "actualTraceInverse": _qstr(trace1) if trace1 is not None else None,
        "actualTraceInverseSquare": _qstr(trace2) if trace2 is not None else None,
        "actualMinimumEigenvalue": _qstr(min(diagonal)) if is_diagonal else None,
        "adjointDualityWitness": {"left": _qstr(left) if left is not None else None, "right": _qstr(right) if right is not None else None},
        "determinantProbes": probes, "numericalProbeToleranceMet": probes_resolved,
        "exactContractsIndependentOfBallWidth": True,
        "infiniteOperatorProofFromFiniteTests": False, "globalRHProved": False,
    }


def _reference_checks(n, precision_bits, tolerance):
    tolerance_value = balls.parse_exact_rational(tolerance)
    with balls.flint_workprec(precision_bits):
        arb, acb = balls.arb, balls.acb
        trace2 = sum((Fraction(1, k*k) for k in range(1, n+1)), Fraction())
        trace_interval = _as_arb(trace2) + _as_arb(Fraction(1, n+1)).union(_as_arb(Fraction(1, n)))
        zeta2 = arb(2).zeta()
        trace_crosscheck = trace_interval.contains(zeta2)
        determinant_rows = []
        for point in (Fraction(1, 4), Fraction(-1, 4)):
            z, radius = _as_arb(point), abs(point)
            finite = arb(1)
            for k in range(1, n+1):
                term = z/k
                finite *= (1-term)*term.exp()
            infinite = (arb.const_euler()*z).exp() * (1-z).rgamma()
            # For |z|=r<1, sum_(n>N) sum_(k>=2) r^k/(k*n^k)
            # <= r^2/[2*N*(1-r/(N+1))], using sum_(n>N) n^-2 <= 1/N.
            log_tail = radius**2 / (2*n*(1-radius/Fraction(n+1)))
            predicted = finite * arb(0, _as_arb(log_tail).upper()).exp()
            determinant_rows.append({
                "z": _qstr(point), "finiteDet2": balls.serialize_arb(finite, tolerance_value),
                "gammaReferenceDet2": balls.serialize_arb(infinite, tolerance_value),
                "omittedLogProductAbsoluteBound": _qstr(log_tail),
                "finitePlusProductTail": balls.serialize_arb(predicted),
                "referenceContainedInProductTailBand": predicted.contains(infinite),
            })
        # D has eigenvalue 2. The reciprocal-Gamma determinant vanishes there,
        # while xi(1/2+2i) does not, so even a critical-ordinate reading fails.
        eigenvalue = arb(2)
        determinant_at_two = (arb.const_euler()*eigenvalue).exp() * (1-eigenvalue).rgamma()
        s = acb(arb(1)/2, arb(2))
        xi = s*(s-1)*(acb(arb.pi())**(-s/2))*(s/2).gamma()*s.zeta()/2
        negative_witness = determinant_at_two.is_zero() and not xi.contains(0) and zeta2 > 0
        return {
            "traceInverseSquare": {
                "formula": "Tr(D^-2)=zeta(2)", "finiteTraceExact": _qstr(trace2),
                "tailInterval": {"lower": _qstr(Fraction(1, n+1)), "upper": _qstr(Fraction(1, n))},
                "tailJustification": "Integral comparison for the decreasing function t^-2, without fitted residuals",
                "finitePlusTail": balls.serialize_arb(trace_interval), "zeta2": balls.serialize_arb(zeta2, tolerance_value),
                "referenceContainedInTailBand": trace_crosscheck,
            },
            "det2": {
                "formula": "det2(I-z*D^-1)=exp(EulerGamma*z)/Gamma(1-z)",
                "normalizationAtZero": "det2(0)=1 and det2'(0)=0",
                "logTaylorSeries": "log(det2(I-z*D^-1))=-sum_(k>=2) zeta(k)*z^k/k for |z|<1",
                "zeroSet": "positive integers, each with multiplicity one",
                "productTailFormula": "r^2/(2*N*(1-r/(N+1))) bounds omitted log-product for |z|<=r<1",
                "tailIndependentOfObservedGammaResidual": True, "probes": determinant_rows,
            },
            "spectralZetaDoesNotDetermineNontrivialZeroSpectrum": {
                "witnessEigenvalue": "2", "det2AtEigenvalue": balls.serialize_arb(determinant_at_two),
                "zetaAtTwo": balls.serialize_arb(zeta2, tolerance_value),
                "xiAtHalfPlusTwoI": balls.serialize_acb(xi, tolerance_value),
                "xiExcludesZero": not xi.contains(0), "negativeControlPass": bool(negative_witness),
                "interpretation": "A positive self-adjoint operator can have spectral zeta equal to Riemann zeta while its eigenvalues are neither nontrivial zeta zeros nor their ordinates.",
            },
            "crosschecksPass": bool(trace_crosscheck and negative_witness and all(row["referenceContainedInProductTailBand"] for row in determinant_rows)),
            "numericalToleranceMet": bool(balls.serialize_arb(zeta2, tolerance_value)["toleranceMet"]
                and balls.serialize_acb(xi, tolerance_value)["toleranceMet"]
                and all(row["finiteDet2"]["toleranceMet"] and row["gammaReferenceDet2"]["toleranceMet"] for row in determinant_rows)),
        }


def _negative_controls(fixture, precision_bits, tolerance):
    controls = []
    mutations = {
        "altered-linear-normalization": lambda f: f["claims"].update(linearCounterterm="0"),
        "altered-multiplicity": lambda f: f["claims"]["spectrum"][0].update(multiplicity=2),
        "missing-determinant-zero": lambda f: f["claims"]["spectrum"].pop(0),
        "wrong-inverse-square-trace": lambda f: f["claims"].update(traceInverseSquare="0"),
        "negative-eigenvalue-positivity": lambda f: f["matrix"][0].__setitem__(0, "-1"),
        "broken-adjoint": lambda f: f["matrix"][0].__setitem__(1, "1"),
        "wrong-domain": lambda f: f.update(domain="all l2 sequences"),
        "false-RH-promotion": lambda f: f["claims"].update(globalRHProved=True),
        "false-zero-spectrum-promotion": lambda f: f["claims"].update(nontrivialZetaZerosEqualSpectrum=True),
    }
    for name, mutate in mutations.items():
        altered = deepcopy(fixture)
        mutate(altered)
        validation = validate_finite_fixture(altered, precision_bits=precision_bits, tolerance=tolerance)
        controls.append({"id": name, "rejected": not validation["pass"],
                         "failedChecks": [key for key, passed in validation["checks"].items() if not passed],
                         "normalizationDifferenceExcludesZero": any(row["normalizationMismatchNumericallySeparated"] for row in validation["determinantProbes"])})
    return controls


def audit_operator(request: dict | None = None) -> dict:
    """Audit a bounded reference or report an unresolved RH research candidate."""
    request = {} if request is None else request
    keys = {"candidate", "dimension", "precisionBits", "tolerance"}
    if not isinstance(request, dict) or set(request) - keys:
        raise balls.BallRequestError("operator audit request contains unsupported fields")
    candidate = request.get("candidate", "diagonal-integers")
    if candidate not in ("diagonal-integers", "rh-research-open"):
        raise balls.BallRequestError("unsupported operator candidate ID")
    n = _dimension(request.get("dimension", 8))
    precision_bits = request.get("precisionBits", 192)
    tolerance = _qstr(_precision_tolerance(precision_bits, request.get("tolerance", "1e-35")))
    unresolved = [{"id": bridge, "status": "UNRESOLVED", "proofExecuted": False} for bridge in BRIDGE_IDS]
    result = {
        "schema": SCHEMA, "request": {"candidate": candidate, "dimension": n, "precisionBits": precision_bits, "tolerance": tolerance},
        "status": "RESEARCH_OPEN", "pass": False, "researchStatus": "RESEARCH_OPEN",
        "primarySources": deepcopy(SOURCES), "unresolvedRHBridges": unresolved,
        "scope": {
            "finiteFixturesCanPromoteInfiniteClaims": False, "spectralZetaIdentityImpliesZeroSpectrum": False,
            "referenceIsRiemannZeroOperator": False, "globalRHProved": False, "universalBSDProved": False,
            "allP7CriteriaComplete": False, "formalKernelProof": False,
        },
    }
    if candidate == "diagonal-integers":
        fixture = make_reference_fixture(n)
        validation = validate_finite_fixture(fixture, precision_bits=precision_bits, tolerance=tolerance)
        crosschecks = _reference_checks(n, precision_bits, tolerance)
        negatives = _negative_controls(fixture, precision_bits, tolerance)
        passed = validation["pass"] and crosschecks["crosschecksPass"] and all(row["rejected"] for row in negatives)
        tolerance_met = validation["numericalProbeToleranceMet"] and crosschecks["numericalToleranceMet"]
        result.update({
            "status": "REFERENCE_CONTRACT_AUDITED" if passed and tolerance_met else "REFERENCE_CHECK_UNRESOLVED",
            "pass": bool(passed and tolerance_met), "toleranceMet": bool(tolerance_met),
            "passMeaning": "Bounded reference contract and negative controls passed; the RH research bridges remain open.",
            "reference": {
                "hilbertSpace": "l2(N,C)", "action": "D e_n=n e_n",
                "operatorDomain": "{a in l2: sum_(n>=1) n^2*|a_n|^2 < infinity}",
                "formDomain": "{a in l2: sum_(n>=1) n*|a_n|^2 < infinity}",
                "adjointDomain": "same as operatorDomain; D*=D",
                "domainJustification": "Finite-support sequences are dense; testing the adjoint against each e_n forces (n*a_n) in l2, giving exactly the displayed domain.",
                "positivity": "<a,D a>=sum n*|a_n|^2 >= ||a||^2 for a in Dom(D)",
                "compactResolvent": "The diagonal inverse has entries 1/n tending to zero.",
                "inverseSchattenClass": "Hilbert-Schmidt since sum 1/n^2 converges; not trace class since sum 1/n diverges",
                "spectrum": "N, each eigenvalue simple", "spectralZeta": "Tr(D^-s)=sum n^-s=zeta(s), Re(s)>1",
                "duality": "Hermitian adjoint and conjugation duality hold; xi(s)=xi(1-s) is not an operator spectral correspondence.",
                "analyticReferenceProofGrade": "explicit elementary diagonal-operator derivation plus cited Gamma product; not a formal kernel proof",
            },
            "fixture": fixture, "finiteValidation": validation, "analyticReferenceChecks": crosschecks,
            "negativeControls": negatives,
        })
    else:
        result["candidateDefinition"] = {
            "operator": None, "domain": None, "selfAdjointExtension": None,
            "note": "No RH candidate operator has been supplied or constructed; these are proof obligations, not satisfied assumptions.",
        }
        result["toleranceMet"] = None
    here = Path(__file__).resolve().parent
    result["sourceSha256"] = {name: sha256((here/name).read_bytes()).hexdigest() for name in ("operator_registry.py", "ball_backend.py")}
    return _seal(result)
