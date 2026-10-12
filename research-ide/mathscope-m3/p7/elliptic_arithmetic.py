"""Exact arithmetic rank bounds with explicit height, saturation and BSD ledgers.

PARI's fresh pinned 2-descent supplies the upper bound. Independent rational
group arithmetic and certified canonical heights supply the lower bound.
Equality of these two bounds is the only route to an exact arithmetic rank.
Neither an analytic rank nor an elliptic-curve database is consulted here.
"""
from __future__ import annotations

from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from math import gcd, prod
from pathlib import Path

from flint import arb_mat, fmpz

from . import ball_backend as balls
from .elliptic_local import (as_curve, count_good_prime, point_add, point_multiply,
                             point_order_certificate, torsion_reduction_bound,
                             weierstrass_invariants, _rational_text)
from .height_certificate import canonical_height_certificate, rank_one_primitivity_certificate
from .pari_backend import run_elliptic_arithmetic, PariExecutionError
from .period_certificate import real_period_certificate

SCHEMA = "MathScope.M3.P7.EllipticArithmetic/1"
RANK_UPPER_SCHEMA = "MathScope.M3.P7.ArithmeticRankUpperCertificate/1"
_DEFAULT_POINTS = {"11a1": [["5", "5"]], "37a1": [["0", "0"]]}


def _canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def _point_json(point):
    return None if point is None else [_rational_text(value) for value in point]


def _exact_integer(value):
    rational = Fraction(value)
    if rational.denominator != 1:
        raise PariExecutionError("An integer arithmetic field was not integral")
    return rational.numerator


def _model_change(original, minimal, coordinate_change):
    u, r, s, t = map(Fraction, coordinate_change)
    if u == 0:
        raise PariExecutionError("A minimal-model coordinate change cannot have u=0")
    a1, a2, a3, a4, a6 = original.ainvs
    transformed = (
        (a1+2*s)/u,
        (a2-s*a1+3*r-s*s)/(u*u),
        (a3+r*a1+2*t)/(u**3),
        (a4-s*a3+2*r*a2-(t+r*s)*a1+3*r*r-2*s*t)/(u**4),
        (a6+r*a4+r*r*a2+r**3-t*a3-r*t*a1-t*t)/(u**6),
    )
    if transformed != minimal.ainvs:
        raise PariExecutionError("The exact minimal-model change does not reproduce the exported coefficients")
    before, after = weierstrass_invariants(original), weierstrass_invariants(minimal)
    for invariant, weight in (("c4", 4), ("c6", 6), ("Delta", 12)):
        if before[invariant] != u**weight * after[invariant]:
            raise PariExecutionError("The invariant weights fail the minimal-model coordinate change")
    return {"originalModelHash": original.model_hash, "minimalModelHash": minimal.model_hash,
            "change": [_rational_text(x) for x in (u, r, s, t)],
            "formula": "x_old=u^2*x_min+r; y_old=u^3*y_min+s*u^2*x_min+t",
            "fiveCoefficientIdentityChecked": True, "invariantWeightsChecked": True,
            "minimalityAlgorithm": "fresh pinned PARI ellminimalmodel and complete local Tate reduction",
            "generalRationalInputSupported": True}


def _local_data(minimal, receipt, coefficient_limit):
    inv = weierstrass_invariants(minimal)
    bad, rows, delta_product, conductor, tamagawa, root = {}, [], 1, 1, 1, -1
    for record in receipt["localRows"]:
        if not isinstance(record, list) or len(record) != 5 or len(record[2]) != 4:
            raise PariExecutionError("Malformed complete Tate local data")
        prime, delta_v = _exact_integer(record[0]), _exact_integer(record[1])
        conductor_v, kodaira_code, local_change, component_order = record[2]
        f, kod, cp = map(_exact_integer, (conductor_v, kodaira_code, component_order))
        sign, ap = _exact_integer(record[3]), _exact_integer(record[4])
        if (prime in bad or not fmpz(prime).is_prime() or prime < 2 or delta_v < 1
                or f < 1 or cp < 1 or sign not in (-1, 1)):
            raise PariExecutionError("Invalid complete bad-prime factor data")
        if f == 1:
            if ap not in (-1, 1) or sign != -ap or inv["c4"] % prime == 0 or kod != 4+delta_v:
                raise PariExecutionError("The multiplicative Tate branch contradicts the exact invariants")
            reduction, euler, kodaira = "split-multiplicative" if ap == 1 else "nonsplit-multiplicative", [1, -ap], "I" + str(delta_v)
        else:
            if ap != 0:
                raise PariExecutionError("An additive local Euler factor must have a_p=0")
            reduction, euler = "additive", [1]
            kodaira = {2: "II", 3: "III", 4: "IV", -1: "I0*", -2: "II*", -3: "III*", -4: "IV*"}.get(kod, "I" + str(-kod-4) + "*")
        if len(local_change) != 4:
            raise PariExecutionError("A Tate local coordinate change needs four exact values")
        row = {"prime": prime, "a_p": ap, "reduction": reduction,
               "eulerDegree": len(euler)-1, "eulerPolynomial": euler,
               "kodaira": kodaira, "pariKodairaCode": kod,
               "discriminantValuation": delta_v, "conductorExponent": f,
               "tamagawa": cp, "localRootNumber": sign,
               "minimalModelHash": minimal.model_hash,
               "TateAlgorithmExecuted": True, "status": "CERTIFIED_PINNED_CAS_LOCAL_ARITHMETIC"}
        bad[prime], delta_product = row, delta_product * prime**delta_v
        conductor, tamagawa, root = conductor * prime**f, tamagawa * cp, root * sign
        rows.append(row)
    if (delta_product != abs(inv["Delta"]) or conductor != _exact_integer(receipt["global"]["conductor"])
            or tamagawa != _exact_integer(receipt["global"]["tamagawaProduct"])
            or root != _exact_integer(receipt["global"]["rootNumber"])):
        raise PariExecutionError("Complete local factors do not reconstruct the discriminant, conductor, Tamagawa product and root number")
    good, reconstructed = {}, [0] * (coefficient_limit+1)
    reconstructed[1] = 1
    for n in range(2, coefficient_limit+1):
        remaining, factors, prime = n, [], 2
        while prime*prime <= remaining:
            exponent = 0
            while remaining % prime == 0:
                remaining //= prime
                exponent += 1
            if exponent:
                factors.append((prime, exponent))
            prime += 1
        if remaining > 1:
            factors.append((remaining, 1))
        value = 1
        for prime, exponent in factors:
            if prime in bad:
                factor = bad[prime]["a_p"]**exponent
            else:
                if prime not in good:
                    counted = count_good_prime(minimal, prime)
                    ap = int(counted["a_p"])
                    good[prime] = {"prime": prime, "a_p": ap, "reduction": "good",
                                   "eulerDegree": 2, "eulerPolynomial": [1, -ap, prime],
                                   "projectivePointCount": counted["projectivePointCount"],
                                   "minimalModelHash": minimal.model_hash,
                                   "exactPointCountVerified": True}
                ap = good[prime]["a_p"]
                previous, current = 1, ap
                for _ in range(2, exponent+1):
                    previous, current = current, ap*current-prime*previous
                factor = current
            value *= factor
        reconstructed[n] = value
    coefficients = [_exact_integer(value) for value in receipt["dirichletCoefficients"]]
    if len(coefficients) != coefficient_limit or coefficients != reconstructed[1:]:
        raise PariExecutionError("The PARI Dirichlet coefficients disagree with independent prime counts and Euler recurrences")
    return sorted(rows + list(good.values()), key=lambda row: row["prime"]), {
        "conductor": conductor, "rootNumber": root, "tamagawaProduct": tamagawa,
        "allBadFactorsCertified": True, "badPrimes": sorted(bad),
        "badPrimeCompleteness": "product p^v_p(Delta_min)=abs(Delta_min), with prime checks",
    }, {"convention": "coefficients[n-1]=a_n", "limit": coefficient_limit,
        "coefficients": coefficients, "allBadFactorsIncluded": True,
        "seriesLabel": "L(E,s)", "goodOnlyLabel": "L^S(E,s)",
        "independentGoodPrimeCountsAndRecurrenceChecked": True}


def _torsion(minimal, receipt):
    data = receipt["torsionTuple"]
    if not isinstance(data, list) or len(data) != 3 or len(data[1]) != len(data[2]):
        raise PariExecutionError("Invalid torsion group receipt")
    order, invariants = _exact_integer(data[0]), [_exact_integer(value) for value in data[1]]
    if order < 1 or order > 256 or prod(invariants) != order or any(value < 2 for value in invariants):
        raise PariExecutionError("Invalid bounded torsion order/invariant factors")
    generators = [point_multiply(minimal, 1, point) for point in data[2]]
    orders = [point_order_certificate(minimal, point, value) for point, value in zip(generators, invariants)]
    subgroup = set()
    for exponents in product(*(range(value) for value in invariants)):
        point = None
        for generator, exponent in zip(generators, exponents):
            point = point_add(minimal, point, point_multiply(minimal, exponent, generator))
        subgroup.add(None if point is None else tuple(_point_json(point)))
    if len(subgroup) != order:
        raise PariExecutionError("The purported torsion invariant factors are not independent")
    delta = weierstrass_invariants(minimal)["Delta"]
    primes = [p for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31) if delta % p != 0][:4]
    if len(primes) < 2:
        raise ValueError("No two good primes fit the independent torsion-reduction budget")
    upper = torsion_reduction_bound(minimal, primes)
    if upper["orderDivides"] % order:
        raise PariExecutionError("The exact torsion subgroup contradicts the independent reduction bound")
    exact = upper["orderDivides"] == order
    return {"status": "PROVED_ENTIRE_RATIONAL_TORSION" if exact else "SUBGROUP_AND_REDUCTION_BOUND",
            "order": order if exact else None, "subgroupOrder": order,
            "invariantFactors": invariants, "generators": [_point_json(point) for point in generators],
            "generatorOrderCertificates": orders, "independentSubgroupEnumerationCount": len(subgroup),
            "reductionBound": upper, "exactOrderProved": exact,
            "pariFullTorsionAlgorithmAlsoExecuted": True,
            "modelHash": minimal.model_hash}


def complete_local_certificate(model, coefficient_limit=128):
    """Complete minimal/Tate/Euler data, without rank or height dependencies.

    Analytic continuation only needs this arithmetic normalization. A failed
    or difficult descent, a height budget, and an unknown saturation index
    must not prevent a supported complete L-function from being evaluated.
    """
    original = as_curve(model)
    receipt = run_elliptic_arithmetic(original, coefficient_limit=coefficient_limit,
                                      perform_descent=False)
    minimal = as_curve(receipt["minimalModel"])
    model_change = _model_change(original, minimal, receipt["coordinateChange"])
    local_rows, global_data, coefficients = _local_data(minimal, receipt, coefficient_limit)
    result = {"schema": "MathScope.M3.P7.CompleteLocalCertificate/1",
              "model": {"label": original.label, "ainvs": [_rational_text(x) for x in original.ainvs],
                        "hash": original.model_hash, "minimalAinvs": receipt["minimalModel"], "minimalHash": minimal.model_hash},
              "minimalModelCertificate": model_change, "global": global_data,
              "localRows": local_rows, "dirichletCoefficients": coefficients, "pariReceipt": receipt,
              "scope": {"descentExecuted": False, "heightComputed": False,
                        "completeLocalFactorsComputed": True, "arithmeticRankClaimed": False,
                        "universalBSDProved": False, "formalLeanProofIssued": False}}
    result["computationSha256"] = sha256(_canonical(result)).hexdigest()
    return result


def _arb(record):
    low, high = map(balls.dyadic_to_fraction, (record["lower"], record["upper"]))
    return balls.arb_from_exact_component({"lower": _rational_text(low), "upper": _rational_text(high)})


def _height_basis(minimal, candidates, upper, iterations, precision_bits):
    basis, diagonal, all_heights, mixed, determinants = [], [], [], {}, []
    seen = set()
    for candidate in candidates:
        point = point_multiply(minimal, 1, candidate)
        key = tuple(_point_json(point)) if point is not None else None
        if key is None or key in seen or len(basis) >= min(upper, 3):
            continue
        seen.add(key)
        height = canonical_height_certificate(minimal, point, iterations=iterations, precision_bits=precision_bits)
        all_heights.append(height)
        if not height["positiveHeightCertified"]:
            continue
        candidate_mixed = []
        for other in basis:
            added = point_add(minimal, point, other)
            add_height = canonical_height_certificate(minimal, added, iterations=iterations, precision_bits=precision_bits)
            candidate_mixed.append(add_height)
        with balls.flint_workprec(precision_bits):
            values = [_arb(item["heightCremona"]) for item in diagonal+[height]]
            size = len(values)
            gram = [[None] * size for _ in range(size)]
            for i in range(size):
                gram[i][i] = values[i]
                for j in range(i):
                    sum_height = candidate_mixed[j] if i == size-1 else mixed[i, j]
                    gram[i][j] = gram[j][i] = (_arb(sum_height["heightCremona"])-values[i]-values[j])/2
            determinant = arb_mat(gram).det()
            independent = bool(determinant > 0)
            det_record = balls.serialize_arb(determinant)
            gram_record = [[balls.serialize_arb(value) for value in row] for row in gram]
        if independent:
            index = len(basis)
            for j, item in enumerate(candidate_mixed):
                mixed[index, j] = item
            basis.append(point)
            diagonal.append(height)
            determinants.append({"size": len(basis), "gramMatrix": gram_record,
                                 "determinant": det_record, "strictlyPositive": True})
    return {"basisPoints": [_point_json(point) for point in basis],
            "rankLowerBound": len(basis), "heightCertificates": diagonal,
            "otherHeightAttempts": [item for item in all_heights if item not in diagonal],
            "sumHeightCertificates": [{"indices": list(key), "certificate": value} for key, value in mixed.items()],
            "positivePrincipalGramDeterminants": determinants,
            "independenceProof": "Canonical height is a positive semidefinite quadratic form, zero exactly on torsion. A strictly positive Gram determinant proves independence modulo torsion.",
            "normalization": "Cremona height; each diagonal is twice the Silverman canonical height",
            "independentBasisSizeBudget": 3,
            "subgroupRegulator": determinants[-1]["determinant"] if determinants else None}


def evaluate_elliptic_arithmetic(data):
    allowed = {"model", "coefficientLimit", "knownPoints", "precisionBits", "heightIterations"}
    if not isinstance(data, dict) or "model" not in data or set(data)-allowed:
        raise ValueError("Elliptic arithmetic requires model and only supported exact controls")
    original = as_curve(data["model"])
    limit, bits, iterations = data.get("coefficientLimit", 64), data.get("precisionBits", 192), data.get("heightIterations", 7)
    if type(bits) is not int or not 64 <= bits <= 4096 or type(iterations) is not int or not 0 <= iterations <= 10:
        raise ValueError("Invalid precisionBits or heightIterations for the arithmetic certificate")
    known = data.get("knownPoints", _DEFAULT_POINTS.get(original.label, []))
    receipt = run_elliptic_arithmetic(original, known_points=known, coefficient_limit=limit)
    minimal = as_curve(receipt["minimalModel"])
    model_change = _model_change(original, minimal, receipt["coordinateChange"])
    u, r, s, t = map(Fraction, receipt["coordinateChange"])
    transformed = []
    for point in known:
        x, y = point_multiply(original, 1, point)
        mapped = ((x-r)/(u*u), (y-s*(x-r)-t)/(u**3))
        point_multiply(minimal, 1, mapped)
        transformed.append(_point_json(mapped))
    if transformed != receipt["knownPointsOnMinimalModel"]:
        raise PariExecutionError("A transformed known point disagrees with the exact coordinate change")
    local_rows, global_data, coefficients = _local_data(minimal, receipt, limit)
    torsion = _torsion(minimal, receipt)
    rlow, upper, cassels = map(_exact_integer, receipt["rankTuple"][:3])
    two_torsion = sum(_exact_integer(value) % 2 == 0 for value in receipt["torsionTuple"][1])
    selmer = len(receipt["twoCovers"])
    if not (0 <= rlow <= upper <= 64 and 0 <= two_torsion <= 2 and cassels >= 0 and cassels % 2 == 0
            and upper == selmer-two_torsion-cassels):
        raise PariExecutionError("The unconditional Selmer/Cassels arithmetic rank identity fails")
    rank_upper = {"schema": RANK_UPPER_SCHEMA, "status": "CERTIFIED_ARITHMETIC_UPPER",
                  "modelHash": minimal.model_hash, "originalModelHash": original.model_hash,
                  "upperBound": upper, "twoSelmerRank": selmer, "rationalTwoTorsionRank": two_torsion,
                  "casselsPairingRank": cassels, "identity": "upperBound=twoSelmerRank-rationalTwoTorsionRank-casselsPairingRank",
                  "method": "fresh pinned PARI/GP 2-descent and Cassels pairing",
                  "backend": receipt["backend"], "exactTwoCovers": receipt["twoCovers"],
                  "coverMapChecks": receipt["coverMapChecks"],
                  "pariReceiptSHA256": receipt["computationSha256"],
                  "executionScriptSHA256": receipt["execution"]["scriptSHA256"],
                  "executionStdoutSHA256": receipt["execution"]["stdoutSHA256"],
                  "freshProcessExecuted": True, "databaseLookupUsed": False,
                  "analyticRankUsed": False, "BSDOrParityConjectureAssumed": False,
                  "formalLeanProofIssued": False}
    rank_upper["certificateSHA256"] = sha256(_canonical(rank_upper)).hexdigest()
    candidates = transformed + receipt["rankTuple"][3]
    height_data = _height_basis(minimal, candidates, upper, iterations, bits)
    lower = height_data["rankLowerBound"]
    if lower > upper:
        raise PariExecutionError("The independent height lower bound exceeds the descent upper bound")
    exact_rank = lower if lower == upper else None
    saturation = {"status": "UNKNOWN", "proved": False, "basis": height_data["basisPoints"],
                  "finitePrimeBoundMistakenForFullSaturation": False}
    if exact_rank == 0:
        saturation.update({"status": "PROVED_EMPTY_FREE_BASIS", "proved": True,
                           "reason": "independent lower zero and arithmetic descent upper zero"})
    elif exact_rank == 1 and torsion["exactOrderProved"] and torsion["order"] == 1:
        try:
            witness = rank_one_primitivity_certificate(minimal, height_data["basisPoints"][0],
                                                       iterations=iterations, precision_bits=bits)
            saturation.update({"status": "PROVED_FULL_RANK_ONE_BASIS" if witness["primitivityProved"] else "UNRESOLVED_HEIGHT_EXCLUSION",
                               "proved": witness["primitivityProved"], "primitivityCertificate": witness,
                               "sameModelRankUpperSHA256": rank_upper["certificateSHA256"],
                               "sameModelTrivialTorsion": True,
                               "proof": "A rank-one torsion-free Mordell-Weil group is infinite cyclic; excluding every proper integer divisor proves that this independent point is a generator."})
        except ValueError as exc:
            saturation.update({"status": "UNRESOLVED_RESOURCE_OR_HEIGHT_BOUND", "reason": str(exc)})
    with balls.flint_workprec(bits):
        regulator_value = balls.serialize_arb(balls.arb(1)) if exact_rank == 0 else height_data["subgroupRegulator"]
    regulator = {"status": "CERTIFIED_FULL_REGULATOR" if saturation["proved"] else "SUBGROUP_REGULATOR_ONLY",
                 "value": regulator_value, "basisSaturated": saturation["proved"],
                 "emptyRankZeroDeterminant": 1 if exact_rank == 0 else None,
                 "normalization": "det of Cremona canonical-height pairing; rank one is heightCremona(P)",
                 "unknownIndexEffect": None if saturation["proved"] else "subgroup regulator=index^2 times the full regulator"}
    period = real_period_certificate(minimal, precision_bits=bits)
    point_evidence = {"basisPoints": height_data["basisPoints"], "independentHeightLowerBound": lower,
                      "firstFiveMultiples": []}
    if height_data["basisPoints"]:
        point_evidence["firstFiveMultiples"] = [{"scalar": n, "point": _point_json(point_multiply(minimal, n, height_data["basisPoints"][0]))} for n in range(1, 6)]
    source_names = ("elliptic_arithmetic.py", "pari_backend.py", "elliptic_local.py",
                    "height_certificate.py", "period_certificate.py", "ball_backend.py")
    result = {
        "schema": SCHEMA,
        "request": {"model": [_rational_text(x) for x in original.ainvs], "coefficientLimit": limit,
                    "knownPoints": [_point_json(point_multiply(original, 1, point)) for point in known],
                    "precisionBits": bits, "heightIterations": iterations},
        "model": {"label": original.label, "ainvs": [_rational_text(x) for x in original.ainvs],
                  "hash": original.model_hash, "minimalAinvs": receipt["minimalModel"], "minimalHash": minimal.model_hash},
        "minimalModelCertificate": model_change, "global": global_data,
        "localRows": local_rows, "dirichletCoefficients": coefficients,
        "arithmeticRank": {"lowerBound": lower, "upperBound": upper, "exactRank": exact_rank,
                           "descentPerformed": True, "selmerBoundComputed": True,
                           "rankUpperCertificate": rank_upper,
                           "pariLowerBoundSeparatelyReported": rlow,
                           "independentLowerBoundMethod": "exact rational points and positive certified height Gram determinant",
                           "analyticRankWasNotUsed": True},
        "rationalTorsion": torsion, "pointEvidence": point_evidence,
        "canonicalHeight": height_data, "saturation": saturation, "regulator": regulator,
        "realPeriod": period,
        "sha": {"status": "UNKNOWN", "order": None,
                "casselsPairingEvenRank": cassels,
                "twoSelmerInformation": "C=T+rank+dim_F2 Sha[2]; this does not by itself determine the full Sha order",
                "finitenessAssumed": False},
        "bsdLedger": {"rankEqualityWithAnalyticRank": "NOT_EVALUATED_IN_THIS_ARITHMETIC_REQUEST",
                      "refinedLeadingTerm": "UNKNOWN_WITHOUT_INDEPENDENT_SHA_INFORMATION",
                      "ManinConstant": {"status": "NOT_REQUIRED_FOR_THE_DIRECT_PERIOD_INTEGRAL", "assumedValue": None},
                      "realPeriodNormalization": "full real Neron period of the global minimal model",
                      "universalBSDProved": False},
        "completedFunctionConvention": {"formula": "Lambda(E,s)=N_E^(s/2)*(2*pi)^(-s)*Gamma(s)*L(E,s)",
                                        "center": 1, "allBadFactorsIncluded": True,
                                        "analyticContinuationEvaluatedHere": False},
        "pariReceipt": receipt,
        "sourceSha256": {name: sha256((Path(__file__).parent/name).read_bytes()).hexdigest() for name in source_names},
        "scope": {"generalMinimalModelAndTateAlgorithmsExecuted": True,
                  "arithmeticRankUpperBoundComputed": True,
                  "arithmeticRankEqualityProved": exact_rank is not None,
                  "saturationProved": saturation["proved"], "realPeriodComputed": True,
                  "shaComputed": False, "universalRHProved": False, "universalBSDProved": False,
                  "formalLeanProofIssued": False, "allP7CriteriaComplete": False},
    }
    result["computationSha256"] = sha256(_canonical(result)).hexdigest()
    return result


def replay_elliptic_arithmetic(record):
    if not isinstance(record, dict) or record.get("schema") != SCHEMA:
        raise ValueError("Unsupported elliptic arithmetic certificate")
    request = record.get("request")
    fresh = evaluate_elliptic_arithmetic(request)
    if _canonical(fresh) != _canonical(record):
        raise ValueError("The arithmetic certificate differs from fresh descent, exact witness and interval computation")
    return {"status": "MATCH", "recomputed": True,
            "computationSha256": fresh["computationSha256"],
            "arithmeticRankUpperCertificateSHA256": fresh["arithmeticRank"]["rankUpperCertificate"]["certificateSHA256"]}
