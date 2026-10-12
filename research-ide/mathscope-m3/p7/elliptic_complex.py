"""General complex elliptic L continuation from complete local arithmetic.

The value is a split Mellin sum of incomplete Gamma functions. An explicit
Hasse--Euler majorant encloses every omitted coefficient. No central-value
table, analytic rank, or incomplete good-only Euler product is substituted.
"""
from __future__ import annotations

from fractions import Fraction
from math import ceil, factorial

from . import ball_backend as balls
from .elliptic_arithmetic import complete_local_certificate
from .elliptic_local import as_curve
from .normalization import elliptic_normalization_ledger
from .zeta_em import exact_point, integer_control, rational_arb, seal, source_binding, with_absolute_error


def _coefficient_tail(c, cutoff, sigma):
    """An explicit majorant for both terms of the omitted split Mellin sum.

For t>=1, |t^(s-1)+w*t^(1-s)| <= 2*t^m, m=ceil(|Re(s)-1|).
sum_(n>K) 2*n*exp(-cnt) <= 2*(K+1)*exp(-c*(K+1)*t)/(1-exp(-c))^2.
The resulting integer-order Gamma integral is a finite exponential polynomial.
"""
    m = ceil(abs(sigma-Fraction(1)))
    q = (-c).exp()
    x = c*(cutoff+1)
    if not (c > 0 and q > 0 and q < 1):
        raise ArithmeticError("Positive Mellin-tail constants were not separated at this precision")
    polynomial = sum((x**j/factorial(j) for j in range(m+1)), balls.arb(0))
    integral = factorial(m)*(-x).exp()*polynomial/x**(m+1)
    bound = 4*(cutoff+1)*integral/(1-q)**2
    return bound, {"polynomialDegree": m, "c": balls.serialize_arb(c), "q": balls.serialize_arb(q),
                   "x": balls.serialize_arb(x), "integerGammaIntegral": balls.serialize_arb(integral),
                   "formula": "4*(K+1)/(1-exp(-c))^2 * m!*exp(-x)*sum_(j=0)^m x^j/j! / x^(m+1), x=c*(K+1), m=ceil(|Re(s)-1|)",
                   "coefficientMajorant": "|a_n|<=d(n)*sqrt(n)<=2*n for all n>=1",
                   "fittedToResidual": False}


def evaluate_elliptic_complex(data):
    if not isinstance(data, dict) or set(data)-{"model", "s", "precisionBits", "coefficientLimit", "tolerance"}:
        raise balls.BallRequestError("Unknown complex elliptic continuation input")
    curve = as_curve(data.get("model", "11a1"))
    point = exact_point(data.get("s", {"real": "1", "imag": "3"}), maximum=64)
    if abs(point[0]) > 16:
        raise balls.BallRequestError("This bounded complex Mellin implementation requires |Re(s)|<=16")
    bits = integer_control(data, "precisionBits", 192, 64, 4096)
    cutoff = integer_control(data, "coefficientLimit", 128, 1, 256)
    tolerance = balls.parse_exact_rational(data.get("tolerance", "1e-25"))
    if not 0 < tolerance <= 1:
        raise balls.BallRequestError("tolerance must be an exact rational string in (0,1]")
    local = complete_local_certificate(curve, coefficient_limit=cutoff)
    global_data, coefficients = local["global"], local["dirichletCoefficients"]
    N, w = global_data["conductor"], global_data["rootNumber"]
    if not global_data["allBadFactorsCertified"] or not coefficients["allBadFactorsIncluded"] or coefficients["seriesLabel"] != "L(E,s)":
        raise ValueError("An incomplete L^S series cannot supply a completed Mellin continuation")
    values = coefficients["coefficients"]
    if len(values) != cutoff or values[0] != 1 or any(abs(value) > 2*n for n, value in enumerate(values, 1)):
        raise ArithmeticError("The independently reconstructed coefficients fail the Mellin majorant contract")
    s_json = dict(zip(("real", "imag"), map(balls._fraction_string, point)))
    normalization = elliptic_normalization_ledger(s_json, conductor=N, root_number=w)
    with balls.flint_workprec(bits):
        acb, arb = balls.acb, balls.arb
        s = acb(rational_arb(point[0]), rational_arb(point[1]))
        c = 2*arb.pi()/arb(N).sqrt()
        finite, reflected_finite, terms = acb(0), acb(0), []
        for n, coefficient in enumerate(values, 1):
            if not coefficient:
                continue
            x = acb(c*n)
            first = x.gamma_upper(s)*x**(-s)
            second = x.gamma_upper(2-s)*x**(s-2)
            term = coefficient*(first+w*second)
            finite += term
            reflected_finite += coefficient*(second+w*first)
            terms.append({"n": n, "a_n": coefficient, "completedTerm": balls.serialize_acb(term)})
        # At the arithmetic center with odd sign both terms are identical.
        # This is an exact functional-equation implication, not zero detection.
        central_odd = point == (Fraction(1), Fraction(0)) and w == -1
        if central_odd:
            finite = reflected_finite = acb(0)
            tail, tail_details = arb(0), {"formula": "exact factor 1+w=0 at s=1", "coefficientMajorant": "not needed for the exact parity zero", "fittedToResidual": False}
        else:
            tail, tail_details = _coefficient_tail(c, cutoff, point[0])
        completed = with_absolute_error(finite, tail)
        reflected = with_absolute_error(reflected_finite, tail)
        conversion = acb(c)**s*s.rgamma()
        L = conversion*completed
        if not all(value.is_finite() for value in (completed, reflected, L, conversion)):
            raise ArithmeticError("The selected complex Mellin controls did not yield finite balls")
        output = {"Lambda": balls.serialize_acb(completed, tolerance), "L": balls.serialize_acb(L, tolerance)}
        result = {
            "schema": "MathScope.M3.P7.EllipticComplexContinuation/1",
            "request": {"model": list(map(str, curve.ainvs)), "s": s_json, "precisionBits": bits,
                        "coefficientLimit": cutoff, "tolerance": balls._fraction_string(tolerance)},
            "status": "CERTIFIED_COMPLEX_MELLIN_ENCLOSURE", "model": local["model"],
            "values": output, "value": output["L"], "toleranceMet": all(value["toleranceMet"] for value in output.values()),
            "global": global_data, "localRows": local["localRows"], "minimalModelCertificate": local["minimalModelCertificate"],
            "coefficientData": coefficients, "localArithmeticReceipt": local["pariReceipt"],
            "normalization": normalization, "normalizationLedger": normalization,
            "method": {"splitMellin": "Lambda(s)=integral_1^infinity sum_(n>=1) a_n*exp(-c*n*t)*(t^(s-1)+w*t^(1-s)) dt",
                       "finiteSum": "sum_(n=1)^K a_n*[Gamma(s,c*n)/(c*n)^s+w*Gamma(2-s,c*n)/(c*n)^(2-s)]",
                       "finiteTerms": terms, "exactCentralParityZero": central_odd,
                       "analyticRankOrDatabaseValueUsed": False, "finiteEulerProductUsed": False},
            "errorAccounting": {
                "finiteSumBall": balls.serialize_acb(finite),
                "finiteArithmeticEnclosure": {"realRadius": balls.serialize_arb(finite.real.rad()), "imagRadius": balls.serialize_arb(finite.imag.rad()),
                                               "includes": "Outward arithmetic and internal incomplete-Gamma/power rounding and truncation together"},
                "coefficientSeriesTailUpper": balls.serialize_arb(tail.upper()), "tailCertificate": tail_details,
                "completeInfiniteTailIncluded": True, "internalSpecialFunctionErrorSplit": False,
                "separateErrorSplitBackendForZeta": "p7.zeta_em", "numericResidualUsedAsTail": False},
            "functionalEquationCheck": {"reflectedS": {"real": balls._fraction_string(2-point[0]), "imag": balls._fraction_string(-point[1])},
                                        "reflectedLambda": balls.serialize_acb(reflected),
                                        "residual": balls.serialize_acb(completed-w*reflected),
                                        "meaning": "Algebraic consistency of the same split-Mellin construction; not an independent verification of modularity or conductor"},
            "scope": {"generalComplexArgumentEvaluation": True, "completeLocalFactorsUsed": True,
                      "entireCompletedFunctionWithTheoremDependencies": True, "analyticRankCertifiedByThisRequest": False,
                      "universalBSDProved": False, "universalRHProved": False, "formalLeanProofIssued": False},
            "theoremDependencies": [
                {"id": "modularity-over-Q", "statement": "Every elliptic curve over Q is modular", "source": "Breuil, Conrad, Diamond, Taylor, JAMS 14 (2001), 843-939", "url": "https://math.stanford.edu/~rltaylor/", "proofExecuted": False},
                {"id": "weight-two-Mellin", "statement": "Complete weight-two modular L-function Mellin continuation and functional equation", "url": "https://www.jmilne.org/math/Books/EC2.pdf", "proofExecuted": False},
                {"id": "Hasse-Euler-majorant", "statement": "Complete local coefficient recurrence implies |a_n|<=d(n)*sqrt(n)<=2n", "url": "https://www.jmilne.org/math/Books/EC2.pdf", "proofExecuted": False},
            ],
            "primarySources": [{"url": "https://python-flint.readthedocs.io/en/latest/acb.html", "use": "Upper incomplete Gamma and complex outward balls"}],
            "sourceSha256": source_binding("elliptic_complex.py", "normalization.py", "zeta_em.py", "elliptic_arithmetic.py", "pari_backend.py", "elliptic_local.py", "ball_backend.py"),
        }
    return seal(result)
