"""Strictly scoped finite Euler products; never a continuation backend."""
from __future__ import annotations

from fractions import Fraction

from . import ball_backend as balls
from .elliptic_local import as_curve, count_good_prime, weierstrass_invariants
from .zeta_em import integer_control, seal, source_binding


def evaluate_euler_product(data):
    if not isinstance(data, dict) or set(data)-{"function", "model", "s", "primes", "precisionBits", "tolerance"}:
        raise balls.BallRequestError("Unknown finite Euler-product input")
    family = data.get("function", "zeta")
    if family not in {"zeta", "elliptic"} or (family == "zeta" and "model" in data):
        raise balls.BallRequestError("Choose zeta or elliptic; only elliptic accepts a model")
    parsed = balls._parse_request({"operation": "zeta", "s": data.get("s", {"real": "2", "imag": "0"}),
                                  "precisionBits": data.get("precisionBits", 192),
                                  "tolerance": data.get("tolerance", "1e-30")})
    boundary = Fraction(1) if family == "zeta" else Fraction(3, 2)
    if parsed["re"][0] <= boundary:
        raise balls.BallRequestError("Finite Euler products require the entire input rectangle in Re(s)>" + str(boundary) + "; use certified analytic continuation in the critical strip")
    if any(abs(v) > 10000 for pair in (parsed["re"], parsed["im"]) for v in pair):
        raise balls.BallRequestError("Finite product coordinates exceed the declared budget")
    if any(pair[1]-pair[0] > Fraction(1, 4) for pair in (parsed["re"], parsed["im"])):
        raise balls.BallRequestError("Subdivide each Euler-product input component to width at most 1/4")
    from flint import fmpz
    primes = data.get("primes", [2, 3, 5, 7, 11, 13])
    if (not isinstance(primes, list) or not 1 <= len(primes) <= 64
            or any(type(p) is not int or not 2 <= p <= 10000 or not fmpz(p).is_prime() for p in primes)
            or primes != sorted(set(primes))):
        raise balls.BallRequestError("primes must be one to 64 distinct increasing primes no larger than 10000")
    curve = as_curve(data.get("model", "11a1")) if family == "elliptic" else None
    if curve is not None and not curve.integral:
        raise balls.BallRequestError("Use an integral Weierstrass model for finite good-reduction exploration")
    discriminant = weierstrass_invariants(curve)["Delta"] if curve else None
    local_rows, omitted = [], []
    with balls.flint_workprec(parsed["bits"]):
        s = balls.acb(balls.arb_from_exact_component(parsed["canonical"]["s"]["real"]),
                      balls.arb_from_exact_component(parsed["canonical"]["s"]["imag"]))
        value = balls.acb(1)
        for p in primes:
            if curve is not None and discriminant % p == 0:
                omitted.append({"prime": p, "reason": "The supplied integral model is singular modulo this prime; the good-only product omits its local factor.",
                                "minimalityInferred": False})
                continue
            x = balls.acb(p)**(-s)
            arithmetic = count_good_prime(curve, p) if curve is not None else None
            ap = arithmetic["a_p"] if arithmetic else None
            polynomial = [1, -1] if curve is None else [1, -ap, p]
            denominator = 1-x if curve is None else 1-ap*x+p*x*x
            if denominator.contains(0):
                raise ArithmeticError("A finite local denominator is not separated from zero at the selected precision")
            factor = 1/denominator
            value *= factor
            local_rows.append({"prime": p, "a_p": ap, "eulerPolynomial": polynomial,
                               "factor": balls.serialize_acb(factor), "exactLocalArithmetic": arithmetic})
        result = balls.serialize_acb(value, parsed["tolerance"])
    selected = {row["prime"] for row in local_rows}
    finite_missing = [p for p in range(2, max(primes)+1) if fmpz(p).is_prime() and p not in selected]
    request = {"function": family, "s": parsed["canonical"]["s"], "primes": primes,
               "precisionBits": parsed["bits"], "tolerance": parsed["canonical"]["tolerance"]}
    if curve is not None:
        request["model"] = list(map(str, curve.ainvs))
    return seal({
        "schema": "MathScope.M3.P7.FiniteEulerExploration/1", "request": request,
        "status": "FINITE_PRODUCT_EXPLORATION_ONLY", "function": "finite good-factor product for L^S(E,s)" if curve else "finite Euler product for zeta exploration",
        "value": result, "toleranceMet": result["toleranceMet"],
        "localRows": local_rows,
        "domainCertificate": {"strictHalfPlane": "Re(s)>"+str(boundary), "entireInputRectangleChecked": True,
                              "realLower": parsed["canonical"]["s"]["real"]["lower"], "criticalStripRequestRejected": True},
        "completeness": {"selectedPrimes": sorted(selected), "omittedPrimesAtOrBelowLargestRequested": finite_missing,
                         "omittedSingularModelFactors": omitted, "allPrimesGreaterThan": max(primes),
                         "remainingInfinitePrimeTail": "NOT_BOUNDED", "completeLFunction": False,
                         "goodOnlyNotation": "L^S" if curve else None},
        "errorAccounting": {"roundingAndInputPropagation": "Included in the finite-expression output ball",
                            "seriesTruncation": "NOT_APPLICABLE_TO_THIS_FINITE_PRODUCT",
                            "infinitePrimeTail": "NOT_BOUNDED; no enclosure of the infinite zeta/L-function is issued"},
        "scope": {"certifiedValueOf": "THIS_FINITE_EXPRESSION_ONLY", "certifiedInfiniteZetaValue": False,
                  "certifiedCompleteLValue": False, "analyticContinuation": False,
                  "functionalEquationForCompleteFunctionIssued": False, "universalRHProved": False, "universalBSDProved": False},
        "primarySources": [{"url": "https://dlmf.nist.gov/25.2#iv", "use": "Zeta Euler product convergence half-plane"},
                           {"url": "https://www.jmilne.org/math/Books/EC2.pdf", "use": "Good Euler factors and the Hasse-bound absolute-convergence half-plane Re(s)>3/2"}],
        "sourceSha256": source_binding("euler_product.py", "zeta_em.py", "elliptic_local.py", "ball_backend.py"),
    })
