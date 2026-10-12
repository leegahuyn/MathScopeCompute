"""Canonical-height intervals from an exact duplication-map error bound.

For the homogeneous degree-four duplication polynomials F,G, exact integer
Bezout identities A_u F+B_u G=D*u^7 and A_v F+B_v G=D*v^7 imply that
gcd(F(u,v),G(u,v)) divides D for primitive integer (u,v).  If H=max(|u|,|v|),
the coefficient norms K of the cofactors give max(|F|,|G|)>=D*H^4/K.
After cancelling the gcd, H(2P)>=H(P)^4/K.  The coefficient norms of F,G
give the upper inequality.  Thus |h_x(2P)-4*h_x(P)|<=log(C), with the
explicit integer C returned here.  Telescoping the resulting geometric
series bounds the limit by log(C)/(3*4^n), independently of observed error.

The limit is the Cremona height used by PARI's ellheight; Silverman's
normalization is one half of it.  This is an exact polynomial derivation
and outward FLINT interval computation, not a newly executed Lean proof.
"""

from __future__ import annotations

from fractions import Fraction
from hashlib import sha256
import json
from math import gcd, isqrt, lcm
from pathlib import Path

from . import ball_backend as balls
from .elliptic_local import as_curve, point_multiply, weierstrass_invariants, _integer_text


SCHEMA = "MathScope.M3.P7.CanonicalHeightCertificate/1"
MAX_ITERATIONS = 10
MAX_COORDINATE_BITS = 2_000_000
PRIMITIVITY_SCHEMA = "MathScope.M3.P7.RankOnePrimitivityCertificate/1"
MAX_ENUMERATION_HEIGHT = 32


def _canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("ascii")


def _qstr(value):
    value = Fraction(value)
    return (_integer_text(value.numerator) if value.denominator == 1
            else _integer_text(value.numerator) + "/" + _integer_text(value.denominator))


def _convolve(a, b):
    out = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            out[i+j] += x*y
    return out


def _solve_two(matrix):
    """Exact two-column solve for the constant and degree-seven monomials."""
    rows = [[Fraction(x) for x in row] + [Fraction(i == 0), Fraction(i == 7)]
            for i, row in enumerate(matrix)]
    for col in range(8):
        pivot = next((i for i in range(col, 8) if rows[i][col]), None)
        if pivot is None:
            raise ArithmeticError("The duplication polynomials have a common projective zero")
        rows[col], rows[pivot] = rows[pivot], rows[col]
        lead = rows[col][col]
        rows[col] = [x/lead for x in rows[col]]
        for i in range(8):
            if i != col and rows[i][col]:
                scale = rows[i][col]
                rows[i] = [x-scale*y for x, y in zip(rows[i], rows[col])]
    return [row[8] for row in rows], [row[9] for row in rows]


def duplication_bound(model):
    """Return integer duplication polynomials and independently checked identities."""
    inv = weierstrass_invariants(model)
    f = [-inv["b8"], -2*inv["b6"], -inv["b4"], Fraction(0), Fraction(1)]
    g = [inv["b6"], 2*inv["b4"], inv["b2"], Fraction(4), Fraction(0)]
    denominator = lcm(*(value.denominator for value in f+g))
    f = [int(value*denominator) for value in f]
    g = [int(value*denominator) for value in g]
    common = gcd(*(abs(value) for value in f+g))
    f, g = [value//common for value in f], [value//common for value in g]
    matrix = [[(f[degree-shift] if 0 <= degree-shift < 5 else 0)
               for shift in range(4)] +
              [(g[degree-shift] if 0 <= degree-shift < 5 else 0)
               for shift in range(4)] for degree in range(8)]
    v_solution, u_solution = _solve_two(matrix)
    d = lcm(*(value.denominator for value in v_solution+u_solution))
    v = [int(value*d) for value in v_solution]
    u = [int(value*d) for value in u_solution]
    for vector, degree in [(v, 0), (u, 7)]:
        left = [x+y for x, y in zip(_convolve(vector[:4], f), _convolve(vector[4:], g))]
        if left != [d if i == degree else 0 for i in range(8)]:
            raise ArithmeticError("The exact duplication Bezout identity failed")
    k_u, k_v = sum(map(abs, u)), sum(map(abs, v))
    c = max(1, sum(map(abs, f)), sum(map(abs, g)), k_u, k_v)
    return {"F": f, "G": g, "D": d, "uCofactors": u, "vCofactors": v,
            "uCoefficientNorm": k_u, "vCoefficientNorm": k_v, "heightBoundConstant": c}


def verify_duplication_bound(model, witness):
    """Reconstruct the complete witness; resealing altered coefficients is insufficient."""
    return isinstance(witness, dict) and witness == duplication_bound(model)


def _homogeneous(coefficients, u, v):
    return sum(coefficient*u**i*v**(4-i) for i, coefficient in enumerate(coefficients))


def duplicate_x(model, x, *, bound=None):
    """Exact projective x-coordinate; None denotes the point at infinity."""
    proof = duplication_bound(model) if bound is None else bound
    u, v = (1, 0) if x is None else (Fraction(x).numerator, Fraction(x).denominator)
    a, b = _homogeneous(proof["F"], u, v), _homogeneous(proof["G"], u, v)
    if a == 0 and b == 0:
        raise ArithmeticError("Invalid common zero in the duplication map")
    return None if b == 0 else Fraction(a, b)


def canonical_height_certificate(model, point, *, iterations=8, precision_bits=192):
    """Enclose both height normalizations with an explicit infinite-limit tail."""
    if type(iterations) is not int or not 0 <= iterations <= MAX_ITERATIONS:
        raise ValueError("iterations must be an integer in [0,10]")
    if type(precision_bits) is not int or not 64 <= precision_bits <= 4096:
        raise ValueError("precision_bits must be an integer in [64,4096]")
    curve = as_curve(model)
    checked_point = point_multiply(curve, 1, point)
    proof = duplication_bound(curve)
    x = None if checked_point is None else checked_point[0]
    steps = []
    for index in range(iterations+1):
        u, v = (1, 0) if x is None else (x.numerator, x.denominator)
        if max(abs(u).bit_length(), v.bit_length()) > MAX_COORDINATE_BITS:
            raise ValueError("Exact duplication coordinate budget exceeded")
        steps.append({"iteration": index, "x": None if x is None else _qstr(x),
                      "primitiveHeight": _integer_text(max(abs(u), abs(v)))})
        if index < iterations:
            if 4*max(abs(u).bit_length(), v.bit_length()) + proof["heightBoundConstant"].bit_length() > MAX_COORDINATE_BITS:
                raise ValueError("Next exact duplication would exceed the coordinate budget")
            x = duplicate_x(curve, x, bound=proof)
    h_integer = 1 if x is None else max(abs(x.numerator), x.denominator)
    with balls.flint_workprec(precision_bits):
        scale = 4**iterations
        finite = balls.arb(h_integer).log()/scale
        tail = balls.arb(proof["heightBoundConstant"]).log()/(3*scale)
        height = finite + balls.arb(0, tail.upper())
        if checked_point is None:
            height = balls.arb(0)
        positive = bool(height > 0)
        finite_record = balls.serialize_arb(finite)
        tail_record = balls.serialize_arb(tail.upper())
        value_record = balls.serialize_arb(height)
        silverman_record = balls.serialize_arb(height/2)
    encoded_proof = {key: [_integer_text(x) for x in value] if isinstance(value, list) else _integer_text(value)
                     for key, value in proof.items()}
    here = Path(__file__).resolve().parent
    result = {
        "schema": SCHEMA,
        "request": {"model": [_qstr(a) for a in curve.ainvs],
                    "point": None if checked_point is None else [_qstr(x) for x in checked_point],
                    "iterations": iterations, "precisionBits": precision_bits},
        "modelHash": curve.model_hash, "duplicationBound": encoded_proof,
        "proofRules": {
            "coefficientOrder": "ascending powers of u, with homogeneous degree four in (u,v)",
            "bezoutIdentities": ["A_u*F+B_u*G=D*u^7", "A_v*F+B_v*G=D*v^7"],
            "cofactorOrder": "first four coefficients multiply F; last four multiply G; each is homogeneous degree three",
            "exactIdentitiesChecked": True,
            "primitiveCommonDivisorBound": "gcd(F(u,v),G(u,v)) divides D because gcd(u,v)=1",
            "heightDifference": "abs(h_x(2P)-4*h_x(P)) <= log(heightBoundConstant)",
            "tail": "abs(limit_(m->infinity)4^(-m)*h_x(2^m P)-4^(-n)*h_x(2^n P)) <= log(C)/(3*4^n)",
        },
        "iterates": steps,
        "finiteApproximation": finite_record, "infiniteLimitTailUpperBound": tail_record,
        "heightCremona": value_record, "heightSilverman": silverman_record,
        "normalization": {"heightCremona": "lim_(n->infinity)4^(-n)*h_x(2^n P)",
                          "heightSilverman": "heightCremona/2",
                          "rankOneSubgroupRegulator": "heightCremona; equals the full Mordell-Weil regulator only with a saturated basis"},
        "positiveHeightCertified": positive, "arithmeticRankLowerBound": 1 if positive else 0,
        "backend": {"pythonFlint": balls.BACKEND_VERSION, "FLINT": balls.FLINT_VERSION,
                    "precisionBits": precision_bits},
        "sourceSha256": {name: sha256((here/name).read_bytes()).hexdigest()
                         for name in ("height_certificate.py", "elliptic_local.py", "ball_backend.py")},
        "scope": {"exactPolynomialWitnessChecked": True, "explicitInfiniteTail": True,
                  "saturationProved": False, "arithmeticRankUpperBoundComputed": False,
                  "universalBSDProved": False, "formalLeanProofIssued": False},
    }
    result["computationSha256"] = sha256(_canonical(result)).hexdigest()
    return result


def replay_canonical_height_certificate(record):
    if not isinstance(record, dict) or record.get("schema") != SCHEMA:
        raise ValueError("Unsupported canonical height certificate")
    request = record.get("request")
    if not isinstance(request, dict) or set(request) != {"model", "point", "iterations", "precisionBits"}:
        raise ValueError("Invalid canonical height request")
    fresh = canonical_height_certificate(request["model"], request["point"],
                                         iterations=request["iterations"], precision_bits=request["precisionBits"])
    if _canonical(fresh) != _canonical(record):
        raise ValueError("The canonical height certificate differs from fresh exact computation")
    return {"status": "MATCH", "computationSha256": fresh["computationSha256"],
            "recomputed": True, "formalLeanProofIssued": False}


def _dyadic(value):
    return Fraction(int(value["mantissa"])) * Fraction(2) ** int(value["exponent"])


def rational_points_of_x_height_at_most(model, bound):
    """Enumerate every affine rational point with reduced H(x)<=bound.

    For x=u/v, v>0, gcd(u,v)=1, both |u| and v are bounded. Solving the
    quadratic equation in y is exact: a nonnegative rational is a rational
    square precisely when its reduced numerator and denominator are squares.
    """
    if type(bound) is not int or not 1 <= bound <= MAX_ENUMERATION_HEIGHT:
        raise ValueError("The exhaustive x-height bound must lie in [1,32]")
    curve = as_curve(model)
    a1, a2, a3, a4, a6 = curve.ainvs
    points, x_count = [], 0
    for v in range(1, bound+1):
        for u in range(-bound, bound+1):
            if gcd(u, v) != 1:
                continue
            x_count += 1
            x = Fraction(u, v)
            linear = a1*x + a3
            radicand = linear**2 + 4*(x**3 + a2*x**2 + a4*x + a6)
            if radicand < 0:
                continue
            numerator, denominator = isqrt(radicand.numerator), isqrt(radicand.denominator)
            if numerator**2 != radicand.numerator or denominator**2 != radicand.denominator:
                continue
            square_root = Fraction(numerator, denominator)
            for y in sorted({(-linear-square_root)/2, (-linear+square_root)/2}):
                point_multiply(curve, 1, (x, y))
                points.append((x, y))
    return {"bound": bound, "reducedXCoordinatesChecked": x_count,
            "affinePoints": [[_qstr(x), _qstr(y)] for x, y in points],
            "allRationalYRootsIncluded": True,
            "infinity": "excluded from the divisor search because a positive-height P cannot be a multiple of O"}


def rank_one_primitivity_certificate(model, point, *, iterations=7, precision_bits=192):
    """Prove P is not mQ for any rational Q and integer |m|>=2.

    The separately cited canonical-height quadraticity theorem is essential:
    the duplication-tail computation by itself does not prove homogeneity for
    every integer m. A full rank-one Mordell-Weil basis additionally requires
    a same-model rank-one upper certificate and trivial rational torsion.
    Those global rank hypotheses are not silently supplied here.
    """
    curve = as_curve(model)
    height = canonical_height_certificate(curve, point, iterations=iterations,
                                          precision_bits=precision_bits)
    if not height["positiveHeightCertified"]:
        raise ValueError("The selected point needs a strictly positive certified canonical height")
    p_upper = _dyadic(height["heightCremona"]["upper"])
    threshold = p_upper/4
    constant = int(height["duplicationBound"]["heightBoundConstant"])
    with balls.flint_workprec(precision_bits):
        exponent = balls.arb(balls.fmpq(threshold.numerator, threshold.denominator)) + balls.arb(constant).log()/3
        maximum_h = exponent.exp()
        maximum_record = balls.serialize_arb(maximum_h)
        exponent_record = balls.serialize_arb(exponent)
    outward_upper = _dyadic(maximum_record["upper"])
    h_bound = outward_upper.numerator // outward_upper.denominator
    if not 1 <= h_bound <= MAX_ENUMERATION_HEIGHT:
        raise ValueError("The proven exhaustive divisor search exceeds its x-height budget")
    enumeration = rational_points_of_x_height_at_most(curve, h_bound)
    point_heights = []
    for rational_point in enumeration["affinePoints"]:
        candidate = canonical_height_certificate(curve, rational_point, iterations=iterations,
                                                  precision_bits=precision_bits)
        lower = _dyadic(candidate["heightCremona"]["lower"])
        point_heights.append({"point": rational_point, "heightCertificate": candidate,
                              "lowerStrictlyExceedsDivisorThreshold": lower > threshold})
    primitive = all(row["lowerStrictlyExceedsDivisorThreshold"] for row in point_heights)
    result = {
        "schema": PRIMITIVITY_SCHEMA, "modelHash": curve.model_hash,
        "request": height["request"], "pointHeight": height,
        "divisorHeightUpper": _qstr(threshold),
        "logarithmicNaiveHeightUpper": exponent_record,
        "naiveHeightUpper": maximum_record, "enumeration": enumeration,
        "pointHeights": point_heights,
        "primitivityProved": primitive,
        "proof": {
            "hypotheticalDivisor": "P=mQ, Q in E(Q), integer |m|>=2",
            "quadraticity": "heightCremona(mQ)=m^2*heightCremona(Q)",
            "heightComparison": "h_x(Q)<=heightCremona(Q)+log(C)/3",
            "integerHeightBound": "H_x(Q)<=exp(upper(heightCremona(P))/4+log(C)/3); take the floor of an outward upper endpoint",
            "exhaustion": "Enumerate all coprime (u,v), 1<=v<=Hmax and |u|<=Hmax, and both rational y roots",
            "strictExclusion": "Every enumerated rational point has certified lower height > upper(height(P))/4",
            "canonicalHeightQuadraticityDependency": {
                "source": "J. S. Milne, Elliptic Curves, second edition, IV.4, Proposition 4.9 and Lemma 4.11; canonical height is a quadratic form",
                "url": "https://www.jmilne.org/math/Books/EC2.pdf",
                "normalization": "The h_x duplication limit here is twice Silverman's canonical height, and has the same quadraticity law",
                "provedByThisFiniteComputation": False,
            },
        },
        "scope": {"allIntegerDivisorsExcluded": primitive,
                  "fullRankOneSaturation": False,
                  "fullBasisStillRequires": ["same-model arithmetic rank exactly one", "trivial rational torsion"],
                  "finitePrimeSaturationHeuristicUsed": False,
                  "formalLeanProofIssued": False, "universalBSDProved": False},
        "sourceSha256": height["sourceSha256"],
    }
    result["computationSha256"] = sha256(_canonical(result)).hexdigest()
    return result


def replay_rank_one_primitivity_certificate(record):
    if not isinstance(record, dict) or record.get("schema") != PRIMITIVITY_SCHEMA:
        raise ValueError("Unsupported primitivity certificate")
    request = record.get("request")
    if not isinstance(request, dict) or set(request) != {"model", "point", "iterations", "precisionBits"}:
        raise ValueError("Invalid primitivity request")
    fresh = rank_one_primitivity_certificate(request["model"], request["point"],
                                            iterations=request["iterations"], precision_bits=request["precisionBits"])
    if _canonical(fresh) != _canonical(record):
        raise ValueError("The primitivity certificate differs from fresh exhaustive computation")
    return {"status": "MATCH", "computationSha256": fresh["computationSha256"],
            "recomputed": True, "primitivityProved": fresh["primitivityProved"]}
