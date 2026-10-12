"""Central L-values with explicit infinite tails for the two P7 curves.

This evaluates the Mellin continuation supplied by the modularity theorem,
not the divergent central Dirichlet series.  Exact local arithmetic supplies
the conductor, root number, and coefficients.  Analytic tails and the FLINT
finite-computation enclosure are recorded separately.  The theorem dependencies
are mathematical inputs, not new kernel-checked proofs.  See ELLIPTIC_ANALYTIC_KO.md.
"""

from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path

from . import ball_backend as balls
from .elliptic_local import as_curve, dirichlet_coefficients, semistable_minimal_certificate
from .normalization import elliptic_normalization_ledger


SCHEMA = "MathScope.M3.P7.EllipticCentralCertificate/1"
MAX_COEFFICIENT_LIMIT = 2048
MAX_PRECISION_BITS = 4096
SUPPORTED_MODELS = ("11a1", "37a1")

THEOREM_DEPENDENCIES = {
    "semistable-modularity": {
        "source": "A. Wiles, Modular elliptic curves and Fermat's Last Theorem, Theorem 0.4 (1995)",
        "url": "https://annals.math.princeton.edu/1995/141-3/p01",
        "use": "The supported semistable curves have a weight-two modular L-function.",
        "proofExecuted": False,
    },
    "mellin-continuation": {
        "source": "Weight-two newform Mellin transform and functional equation; central sums documented by SageMath",
        "url": "https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/lseries_ell.html",
        "use": "Lambda(s)=integral_1^infinity f(it/sqrt(N))*(t^(s-1)+w*t^(1-s)) dt.",
        "proofExecuted": False,
    },
    "hasse-euler-bound": {
        "source": "Hasse bound and good/multiplicative Euler recurrences; elementary divisor pairing",
        "url": "https://www.jmilne.org/math/Books/EC2.pdf",
        "use": "|a_n|<=d(n)*sqrt(n)<=2*n for every positive n, including all bad factors.",
        "proofExecuted": False,
    },
    "ball-special-functions": {
        "source": "python-flint 0.9.0 arb exp, expint, and directed endpoint interface",
        "url": "https://python-flint.readthedocs.io/en/latest/arb.html",
        "use": "Outward enclosures; E1(x)=x.expint(1)=Gamma(0,x) for x>0.",
        "proofExecuted": False,
    },
}


class EllipticAnalyticError(ValueError):
    """Unsupported scope or malformed certificate; never a partial proof."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code

    def as_dict(self) -> dict:
        return {"code": self.code, "message": str(self)}


def _canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(",", ":"), allow_nan=False).encode("ascii")


def _digest(value) -> str:
    return sha256(_canonical(value)).hexdigest()


def _source_manifest() -> dict:
    here = Path(__file__).resolve().parent
    return {name: sha256((here / name).read_bytes()).hexdigest()
            for name in ("elliptic_analytic.py", "elliptic_local.py", "ball_backend.py", "normalization.py")}


def _request(model, precision_bits, coefficient_limit, tolerance):
    curve = as_curve(model)
    if curve.label not in SUPPORTED_MODELS:
        raise EllipticAnalyticError("UNSUPPORTED_ANALYTIC_MODEL", "Only the exact 11a1 and 37a1 coefficient models are certified")
    if type(precision_bits) is not int or not 32 <= precision_bits <= MAX_PRECISION_BITS:
        raise EllipticAnalyticError("INVALID_PRECISION", "precision_bits must be an integer in [32,4096]")
    if type(coefficient_limit) is not int or not 1 <= coefficient_limit <= MAX_COEFFICIENT_LIMIT:
        raise EllipticAnalyticError("INVALID_COEFFICIENT_LIMIT", "coefficient_limit must be an integer in [1,2048]")
    tolerance_value = balls.parse_exact_rational(tolerance)
    if not 0 < tolerance_value <= 1:
        raise EllipticAnalyticError("INVALID_TOLERANCE", "tolerance must be an exact string with value in (0,1]")
    canonical_tolerance = (str(tolerance_value.numerator) if tolerance_value.denominator == 1
                           else f"{tolerance_value.numerator}/{tolerance_value.denominator}")
    return curve, tolerance_value, {
        "model": curve.label, "precisionBits": precision_bits,
        "coefficientLimit": coefficient_limit, "tolerance": canonical_tolerance,
    }


def _tail_balls(c, root_number: int, cutoff: int):
    """Positive rigorous majorants; E1(x)<=exp(-x)/x is used only at x>0.

    For n>cutoff, |a_n|<=2n and 1/n<=1/(cutoff+1).  Summing the
    resulting geometric series gives the two bounds below.  Keep the zero
    parity factors exact so an analytic zero is not inferred from a tiny ball.
    """
    q = (-c).exp()
    geometric = q ** (cutoff + 1) / (1 - q)
    lambda_tail = 2 * abs(1 + root_number) * geometric / c
    derivative_tail = 2 * abs(1 - root_number) * geometric / (c*c*(cutoff + 1))
    if not (c > 0 and q > 0 and q < 1 and lambda_tail >= 0 and derivative_tail >= 0):
        raise ArithmeticError("Mellin tail positivity preconditions failed")
    return lambda_tail, derivative_tail


def _with_tail(finite_ball, tail_bound):
    # upper() is an exact dyadic directed bound. arb(0, radius) rounds its
    # magnitude outward; no float or display decimal is accepted as a radius.
    return finite_ball + balls.arb(0, tail_bound.upper())


def _analytic_rank(values: dict, root_number: int) -> dict:
    exact_zero = root_number == -1
    value_excludes_zero = not values["L"]["containsZero"]
    derivative_excludes_zero = not values["LPrime"]["containsZero"]
    if value_excludes_zero:
        rank, reason = 0, "The certified L(E,1) interval excludes zero."
    elif exact_zero and derivative_excludes_zero:
        rank, reason = 1, "The functional equation forces L(E,1)=0 exactly and the certified L'(E,1) interval excludes zero."
    else:
        rank, reason = None, "The computed intervals do not establish an exact analytic rank."
    return {
        "status": "CERTIFIED_WITH_THEOREM_DEPENDENCIES" if rank is not None else "INCONCLUSIVE",
        "exactRank": rank, "centralValueExactZero": exact_zero,
        "centralValueExcludesZero": value_excludes_zero,
        "firstDerivativeExcludesZero": derivative_excludes_zero,
        "rootNumber": root_number, "paritySource": "Lambda(s)=w*Lambda(2-s)",
        "reason": reason, "modularSymbolsExecuted": False,
        "arithmeticRankEqualityClaimed": False, "bsdLeadingTermClaimed": False,
    }


def elliptic_central_certificate(
    model, *, precision_bits: int = 192, coefficient_limit: int = 128, tolerance: str = "1e-40",
) -> dict:
    """Enclose L(1), L'(1), Lambda(1), Lambda'(1) and certify rank when possible.

    Insufficient cutoff/precision is allowed but reported by toleranceMet=False.
    A rank claim depends on actual zero exclusion, independently of that width
    request.  An inconclusive interval never becomes a database-derived rank.
    """
    curve, tolerance_value, request = _request(model, precision_bits, coefficient_limit, tolerance)
    local = semistable_minimal_certificate(curve)
    if not (local["minimalAtEveryPrime"] and local["allBadFactorsCertified"]):
        raise EllipticAnalyticError("UNCERTIFIED_LOCAL_DATA", "Complete minimal semistable local data are required")
    conductor, root_number = local["conductor"], local["globalRootNumber"]
    if type(conductor) is not int or conductor < 1 or type(root_number) is not int or root_number not in (-1, 1):
        raise EllipticAnalyticError("UNCERTIFIED_LOCAL_DATA", "Invalid conductor or functional-equation sign")
    coefficient_data = dirichlet_coefficients(curve, coefficient_limit)
    if (not coefficient_data["completeBadFactorsIncluded"] or coefficient_data["omittedPrimes"]
            or coefficient_data["function"] != "L(E,s)"):
        raise EllipticAnalyticError("INCOMPLETE_L_SERIES", "An incomplete L^S series cannot certify the complete L-function")
    coefficients = tuple(map(int, coefficient_data["coefficients"]))
    if len(coefficients) != coefficient_limit or coefficients[0] != 1:
        raise ArithmeticError("Coefficient indexing contract failed")
    # This finite check is a consistency guard, not the proof for all omitted n.
    if any(abs(a_n) > 2*n for n, a_n in enumerate(coefficients, 1)):
        raise ArithmeticError("A computed coefficient contradicts the Hasse-Euler majorant")

    with balls.flint_workprec(precision_bits):
        arb = balls.arb
        c = 2 * arb.pi() / arb(conductor).sqrt()
        sum_value, sum_derivative = arb(0), arb(0)
        for n, a_n in enumerate(coefficients, 1):
            if not a_n:
                continue
            x = c*n
            if 1 + root_number:
                sum_value += a_n * (-x).exp() / x
            if 1 - root_number:
                sum_derivative += a_n * x.expint(1) / x
        finite_lambda = (1 + root_number)*sum_value
        finite_lambda_prime = (1 - root_number)*sum_derivative
        tail_lambda, tail_lambda_prime = _tail_balls(c, root_number, coefficient_limit)
        completed_value = _with_tail(finite_lambda, tail_lambda)
        completed_derivative = _with_tail(finite_lambda_prime, tail_lambda_prime)
        # Lambda(s)=c^(-s)*Gamma(s)*L(s); psi(1)=-EulerGamma.
        conversion = c.log() + arb.const_euler()
        l_value = c*completed_value
        l_derivative = c*(completed_derivative + conversion*completed_value)
        finite_l = c*finite_lambda
        finite_l_prime = c*(finite_lambda_prime + conversion*finite_lambda)
        tail_l = c*tail_lambda
        tail_l_prime = c*(tail_lambda_prime + abs(conversion)*tail_lambda)
        value_balls = {"L": l_value, "LPrime": l_derivative,
                       "Lambda": completed_value, "LambdaPrime": completed_derivative}
        if not all(value.is_finite() for value in value_balls.values()):
            raise EllipticAnalyticError("NONFINITE_BACKEND_RESULT", "Finite analytic enclosures were not obtained")
        values = {name: balls.serialize_arb(value, tolerance_value) for name, value in value_balls.items()}
        finite_sums = {name: balls.serialize_arb(value) for name, value in {
            "L": finite_l, "LPrime": finite_l_prime,
            "Lambda": finite_lambda, "LambdaPrime": finite_lambda_prime,
        }.items()}
        tails = {name: balls.serialize_arb(value.upper()) for name, value in {
            "L": tail_l, "LPrime": tail_l_prime,
            "Lambda": tail_lambda, "LambdaPrime": tail_lambda_prime,
        }.items()}
        constants = {"c": balls.serialize_arb(c), "logCPlusEulerGamma": balls.serialize_arb(conversion)}

    record = {
        "schema": SCHEMA, "request": request, "center": "1", "derivativeOrders": [0, 1],
        "model": {"label": curve.label, "ainvs": [str(a) for a in curve.ainvs], "hash": curve.model_hash},
        "normalization": {
            "L": "L(E,s)=sum_(n>=1) a_n*n^(-s), arithmetic center s=1",
            "Lambda": "Lambda(E,s)=N^(s/2)*(2*pi)^(-s)*Gamma(s)*L(E,s)=c^(-s)*Gamma(s)*L(E,s)",
            "functionalEquation": "Lambda(E,s)=w*Lambda(E,2-s)",
            "LPrimeConversion": "L'(E,1)=c*(Lambda'(E,1)+(log(c)+EulerGamma)*Lambda(E,1))",
            "c": "2*pi/sqrt(N)", "conductor": conductor, "rootNumber": root_number,
        },
        "normalizationLedger": elliptic_normalization_ledger(
            {"real": "1", "imag": "0"}, conductor=conductor, root_number=root_number),
        "constants": constants, "localCertificate": local, "coefficientData": coefficient_data,
        "coefficientDataSha256": _digest(coefficient_data),
        "method": {
            "name": "central-split-Mellin-exponential-and-E1",
            "LambdaCentral": "(1+w)*sum_(n>=1) a_n*exp(-c*n)/(c*n)",
            "LambdaPrimeCentral": "(1-w)*sum_(n>=1) a_n*E1(c*n)/(c*n)",
            "E1": "E1(x)=integral_x^infinity exp(-t)/t dt=Gamma(0,x), x>0",
            "coefficientMajorant": "|a_n|<=d(n)*sqrt(n)<=2*n for all n>=1",
            "tailLambda": "2*abs(1+w)/c * q^(K+1)/(1-q)",
            "tailLambdaPrime": "2*abs(1-w)/(c^2*(K+1)) * q^(K+1)/(1-q)",
            "q": "exp(-c)", "K": coefficient_limit,
            "exactParity": {"LambdaCentralZero": root_number == -1, "LambdaPrimeCentralZero": root_number == 1},
        },
        "errorBudget": {
            "finiteSumBalls": finite_sums, "analyticTailUpperBounds": tails,
            "tailUpperBoundsAreExactOutwardDyadics": True,
            "separatelyRecordedAnalyticTail": True,
            "finiteSumEnclosureIncludes": "Input conversion, finite arithmetic, and internal special-function rounding/truncation together",
            "internalRoundingAndSpecialFunctionTruncationSeparated": False,
            "tailAddition": "Each completed finite sum receives the symmetric interval [-tail.upper(),+tail.upper()] before conversion to L.",
            "infiniteTailTermsIndividuallyComputed": False,
        },
        "values": values, "toleranceMet": all(value["toleranceMet"] for value in values.values()),
        "analyticRank": _analytic_rank(values, root_number),
        "backend": {"pythonFlint": balls.BACKEND_VERSION, "FLINT": balls.FLINT_VERSION, "workingPrecisionBits": precision_bits},
        "sourceSha256": _source_manifest(), "theoremDependencies": deepcopy(THEOREM_DEPENDENCIES),
        "scope": {
            "supportedExactModels": list(SUPPORTED_MODELS), "centralAnalyticValuesCertified": True,
            "explicitInfiniteTailBound": True, "generalComplexArgumentEvaluation": False,
            "finiteDisplacementTaylorRemainder": False, "modularSymbolsExecuted": False,
            "modularityProofExecuted": False, "leanProofExecuted": False,
            "arithmeticRankUpperBoundComputed": False, "arithmeticRankEqualityClaimed": False,
            "periodRegulatorShaComputed": False, "bsdLeadingTermClaimed": False,
            "allP7CriteriaComplete": False, "universalRHProved": False, "universalBSDProved": False,
            "evidenceKind": "ball-enclosure-with-explicit-tail-and-standard-theorem-dependencies",
        },
    }
    record["computationSha256"] = _digest(record)
    return record


def replay_elliptic_central_certificate(record: dict) -> dict:
    """Recompute from source; a rehashed modified result is still rejected.

    Hashes identify a record; they are not proof authority.  Compare the entire
    canonical JSON including sources, coefficients, tails, rank and scope.
    """
    if not isinstance(record, dict) or record.get("schema") != SCHEMA:
        raise EllipticAnalyticError("INVALID_CERTIFICATE", "Unsupported elliptic central certificate schema")
    request = record.get("request")
    expected_keys = {"model", "precisionBits", "coefficientLimit", "tolerance"}
    if not isinstance(request, dict) or set(request) != expected_keys:
        raise EllipticAnalyticError("INVALID_CERTIFICATE", "Certificate request fields do not match the closed schema")
    fresh = elliptic_central_certificate(
        request["model"], precision_bits=request["precisionBits"],
        coefficient_limit=request["coefficientLimit"], tolerance=request["tolerance"],
    )
    try:
        identical = _canonical(fresh) == _canonical(record)
    except (TypeError, ValueError, OverflowError) as exc:
        raise EllipticAnalyticError("INVALID_CERTIFICATE", "Certificate is not canonical JSON data") from exc
    if not identical:
        raise EllipticAnalyticError("REPLAY_MISMATCH", "Fresh source-bound computation differs from the supplied certificate")
    return {"valid": True, "freshComputationMatches": True, "schema": SCHEMA,
            "computationSha256": fresh["computationSha256"], "analyticRank": fresh["analyticRank"],
            "toleranceMet": fresh["toleranceMet"]}
