"""Bound the exact C10 source trace before evaluating nested exponentials."""

from argparse import ArgumentParser
from dataclasses import dataclass
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


BAND = "primary-forced-join/active-n3-c5-binding/first-wave-guard-traces"
TARGET = "whole-k-annular-wrz-norm"
SOURCE_PINS = {
    "active": (TARGET+"/numerical/leading-active-c10-trace.json",
               "891994bbcb30be98cfb6749a5e09eb6f4a2cfbb437d9e26dcf94b894fbe4e5c4"),
    "exterior": (TARGET+"/numerical/leading-outer-c10/leading-outer-c10.json",
                 "a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb"),
    "targetRecipe": (TARGET+"/target-numerical/evaluate_target_middle.mjs",
                     "ec4f3703f3bd40bf91cc6369ab0451868c74d56be249f21acb8cf477358f7606"),
    "band": (BAND+"/first-forced-budget/geometry/outer-forced-geometry.json",
             "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
}
PROFILE_PIN = "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a"
BINDING_PIN = "4e08b2bbcf5ba20387a631e05e1eae15a857a3be56372c1106fde810d1797515"


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


@dataclass(frozen=True, order=True)
class Cap:
    # level 0: C^power; level 1: R^(power/2^128); level 2: exp(R^power).
    level: int
    power: int

    def raised(self, exponent):
        assert exponent >= 0
        if self.level == 2 and exponent > 1:
            return Cap(2, self.power + exponent.bit_length())
        return Cap(self.level, self.power * exponent)


ONE = Cap(0, 0)
R_DENOMINATOR = 2**128


@dataclass(frozen=True)
class Signed:
    # None is an undetermined sign; for a proved nonzero value also retain 1/|value|.
    sign: int | None
    upper: Cap
    inv_upper: Cap | None


PARAMETER_C_POWERS = {
    "BOuter": 1, "CSelected": 1, "K": 1, "Lambda": 1, "Md": 1, "Pstar": 1,
    "Q": 1, "T": 1, "Tsh": 1, "X0I1": 30, "X0I2": 30, "XR": 30, "h": 1,
    "lambda": 1, "logP": 1, "loopD0": 100001, "loopMuMax": 1200000,
    "muMoment": 1, "rho": 1, "sigmaStar": 1, "sourceEnvelopeS": 100000, "t1": 120,
}
SPECIAL = {
    "radialFrequencyN": Signed(1, Cap(1, 51*R_DENOMINATOR), ONE),
    "loopDelta": Signed(1, ONE, Cap(1, 1)),
}
KNOWN_ABOVE_ONE = {"XR", "Lambda", "CSelected"}


def product_cap(terms):
    if not terms:
        return ONE
    assert len(terms) < 2**32
    level = max(t.level for t in terms)
    dominant = [t for t in terms if t.level == level]
    if level == 2:
        return max(dominant).raised(len(terms))
    return Cap(level, sum(t.power for t in dominant) + (len(terms)-len(dominant)))


def sum_cap(terms):
    assert len(terms) < 2**32
    largest = max(terms, default=ONE)
    return Cap(largest.level, largest.power + 1)


def evaluated_exponential(magnitude):
    if magnitude.level == 0:
        # C^128 > 2^128, so this comparison entails exp(C^power) <= R^(2^-128).
        assert magnitude.power + 128 <= 25_600_000, magnitude
        return Cap(1, 1)
    assert magnitude.level == 1, magnitude
    return Cap(2, (magnitude.power+R_DENOMINATOR-1)//R_DENOMINATOR)


def trace_caps(data):
    result = {}
    exps = []
    inverse_nodes = []
    node_inputs = {}
    for node_row in data["trace"]["nodes"]:
        i, node = node_row["id"], node_row["node"]
        op, args = node["op"], node["args"]
        if op == "rational":
            value = Fraction(int(args[0]), int(args[1]))
            assert max(abs(value.numerator).bit_length(), value.denominator.bit_length()) < 2_600_000
            if value in (0, -1, 1):
                row = Signed(int(value), ONE, ONE if value else None)
            else:
                row = Signed(1 if value > 0 else -1, Cap(0, 1), Cap(0, 1))
        elif op == "source_parameter":
            name = args[0]
            if name in SPECIAL:
                row = SPECIAL[name]
            else:
                cap = Cap(0, PARAMETER_C_POWERS[name])
                row = Signed(1, cap, ONE if name in KNOWN_ABOVE_ONE else cap)
        elif op == "add":
            active = [result[t] for t in args if result[t].sign != 0]
            signs = {t.sign for t in active}
            if not active:
                row = Signed(0, ONE, None)
            else:
                sign = next(iter(signs)) if len(signs) == 1 else None
                inverses = [t.inv_upper for t in active if t.inv_upper is not None]
                row = Signed(sign, sum_cap([t.upper for t in active]),
                             min(inverses) if sign in (-1, 1) and inverses else None)
        elif op == "multiply":
            active = [result[t] for t in args]
            if any(t.sign == 0 for t in active):
                row = Signed(0, ONE, None)
            else:
                sign = None if any(t.sign is None for t in active) else (-1)**sum(t.sign == -1 for t in active)
                inverses = [t.inv_upper for t in active]
                row = Signed(sign, product_cap([t.upper for t in active]),
                             product_cap(inverses) if all(t is not None for t in inverses) else None)
        elif op == "integer_power":
            datum, n = result[args[0]], args[1]
            if n < 0:
                assert datum.inv_upper is not None, (i, args, datum)
                inverse_nodes.append(i)
                datum = Signed(datum.sign, datum.inv_upper, datum.upper)
                n = -n
            if n == 0:
                row = Signed(1, ONE, ONE)
            elif datum.sign == 0:
                row = datum
            else:
                row = Signed(1 if n % 2 == 0 and datum.inv_upper is not None else datum.sign,
                             datum.upper.raised(n), datum.inv_upper.raised(n) if datum.inv_upper is not None else None)
        elif op == "inverse":
            datum = result[args[0]]
            assert datum.inv_upper is not None, (i, args, datum)
            inverse_nodes.append(i)
            row = Signed(datum.sign, datum.inv_upper, datum.upper)
        elif op == "exp":
            datum = result[args[0]]
            if i == 33:
                # 13/lambda + 60 BOuter + T + 2 < Q^3 <= log C.
                assert args == [32] and node_inputs[32] == ["add", [29, 31]]
                assert node_inputs[29] == ["multiply", [27, 28]]
                assert node_inputs[31] == ["add", [26, 30]]
                assert node_inputs[27] == ["rational", ["13", "1"]]
                assert node_inputs[28] == ["inverse", [10]]
                assert node_inputs[10] == ["source_parameter", ["lambda"]]
                assert node_inputs[26] == ["multiply", [24, 25]]
                assert node_inputs[24] == ["rational", ["60", "1"]]
                assert node_inputs[25] == ["source_parameter", ["BOuter"]]
                assert node_inputs[30] == ["add", [22, 23]]
                assert node_inputs[22] == ["source_parameter", ["T"]]
                assert node_inputs[23] == ["rational", ["2", "1"]]
                cap = Cap(0, 1)
            else:
                cap = evaluated_exponential(datum.upper)
            exps.append({"root": i, "arg": args[0], "sign": datum.sign,
                         "argCap": vars(datum.upper), "exponentialTwoSidedMagnitudeCap": vars(cap)})
            row = Signed(1, ONE if datum.sign in (-1, 0) else cap,
                         ONE if datum.sign in (0, 1) else cap)
        elif op == "sqrt_positive":
            datum = result[args[0]]
            assert datum.sign == 1 or datum.sign == 0, (i, args, datum)
            row = datum
        elif op == "log_positive":
            datum = result[args[0]]
            assert node_inputs[args[0]][0] == "source_parameter"
            assert node_inputs[args[0]][1][0] in KNOWN_ABOVE_ONE
            assert datum.sign == 1 and datum.inv_upper == ONE and datum.upper.level == 0
            row = Signed(1, Cap(0, 2), None)  # log(C^k)<=C^2, k<C.
        else:
            raise AssertionError((i, op))
        node_inputs[i] = [op, args]
        result[i] = row
    assert all(value.upper.power < 2**10000 for value in result.values())
    # Every C power in this audit is below R^(2^-128), which also absorbs the
    # finite arities. Every R power produced by this audit is below exp(R).
    return result, exps, inverse_nodes


def raw_middle(F, U):
    # (Renv degree, high derivative envelope degree, available ordinary order).
    def add(*rows):
        return (1+max(row[0] for row in rows), max(row[1] for row in rows), min(row[2] for row in rows))
    def product(*rows):
        assert len(rows) <= 7 and 7**10 < 2**32
        return (1+sum(row[0] for row in rows), sum(row[1] for row in rows), min(row[2] for row in rows))
    def derivative(row):
        return row[0], row[1], row[2]-1
    def prefix(row):
        return row[0]+2, row[1], row[2]
    assert F[2] == U[2] == 10
    fixed, X, invX, invSqrt, invL, P0 = ((1,0,10),(2,0,10),(24,0,10),(24,0,10),(1,0,10),(32,0,10))
    M = prefix(U)
    I = prefix(product(fixed, X, F))
    J = prefix(product(fixed, X, U, F))
    S = prefix(add(product(U,U), product(X,F,F)))
    Cp = prefix(product(F,F))
    Pi = add(P0, Cp)
    W = add(fixed, product(invX, add(product(fixed, M),product(fixed,derivative(M)))))
    theta = add(product(F,X,W,invL),
                product(fixed,invX,invL,add(I,product(fixed,derivative(I)),
                                           product(fixed,derivative(J)),product(fixed,J))),
                product(fixed,X,derivative(F)))
    axial = add(product(invL,invSqrt,add(product(X,W,U),M,product(fixed,derivative(M)),
                                       product(fixed,S),product(fixed,derivative(S)),
                                       product(X,add(product(fixed,Pi),product(fixed,derivative(Pi)))))),
                product(fixed,X,derivative(U),invSqrt))
    assert theta[2] == axial[2] == 9
    assert theta[1] == axial[1] == 2
    chart_degree = 122  # 45*2^1521 * max(2,Lambda,R)^119 <= R^122.
    return {"theta": theta, "axial": axial, "chartDegree": chart_degree,
            "bothMiddleSlowRenvDegree": max(theta[0], axial[0])+chart_degree,
            "bothMiddleSlowEnvelopeDegree": 2}


def main(goal, profile, binding, out):
    sources = {key: pinned(goal/path, digest) for key, (path, digest) in SOURCE_PINS.items()}
    data = json.loads(sources["active"])
    exterior = json.loads(sources["exterior"])
    covariance = json.loads(pinned(binding, BINDING_PIN))
    profile_source = pinned(profile, PROFILE_PIN).decode()
    profile_data = json.JSONDecoder().raw_decode(profile_source.split("PINNED_N3 = ", 1)[1])[0]
    assert data["sourceProfile"] == exterior["source"]["parameterExpressionSHA256"] == profile_data["parameterExpressionSHA256"]
    assert data["sourceProfile"] == "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152"
    p = profile_data["parametersExactExpressions"]
    assert p["lambda"] == {"exp": {"product": [{"integer": -1000}, {"ref": "T"}]}}
    assert p["h"] == {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}}
    assert p["BOuter"] == {"product": [{"integer": 1000}, {"ref": "T"}]}
    assert p["sourceEnvelopeS"] == {"power": [{"ref": "CSelected"}, 100000]}
    assert p["C12EnvelopeR"] == {"exp": {"power": [{"ref": "sourceEnvelopeS"}, 256]}}
    assert p["loopDelta"] == {"exp": {"product": [{"integer": -1}, {"power": [{"ref": "sourceEnvelopeS"}, 16]}]}}
    assert p["loopD0"] == {"quotient": [{"integer": 1}, {"product": [{"integer": 8}, {"ref": "sourceEnvelopeS"}]}]}
    assert p["loopMuMax"] == {"power": [{"ref": "sourceEnvelopeS"}, 12]}
    assert p["radialFrequencyN"] == {"sum": [{"integer": 1}, {"ceil": {"power": [{"ref": "C12EnvelopeR"}, 50]}}]}
    assert p["logCSelected"]["sum"][1] == {"power": [{"ref": "Q"}, 200]}
    assert int(p["Q"]["quotient"][0]["product"][0]["integer"]) >= 2**260
    assert p["Q"]["quotient"][1] == {"power": [{"ref": "sigmaStar"}, 2]}
    assert p["sigmaStar"] == {"quotient": [{"ref": "j0"}, {"integer": 2000}]}
    assert p["j0"] == {"power": [{"ref": "h"}, 4]}
    assert p["Xa"] == {"quotient": [{"integer": 4}, {"ref": "Lambda"}]}
    assert "H=-h*log(tau0) > h*Bnorm^512/2 > Bnorm^511/2." in sources["band"].decode()
    assert exterior["normalizedMaximum"] == "2^(-65343)" and len(exterior["physicalRows"]) == 7*66
    assert len(covariance["bindings"]["historicalMiddleComparisonToActiveT0"]) == 2
    assert all(row["literalMatch"] for row in covariance["bindings"]["historicalMiddleComparisonToActiveT0"])
    assert "const prefix = f => jet((r, e) => r ? f(r-1, e) : N.mul(Xb, f(0, e)))" in sources["targetRecipe"].decode()
    assert "factori" in sources["targetRecipe"].decode()
    assert data["requested"] == {"radialOrder": 10, "etaOrder": 10}
    root_ids = data["trace"]["roots"]
    values, exps, inverses = trace_caps(data)
    max_cap = max(values[i].upper for i in root_ids.values())
    assert max_cap.level == 2
    target = raw_middle((0,1,10), (0,1,10))
    log_power = max_cap.power + 2
    assert target["bothMiddleSlowRenvDegree"] < 2**16
    pencil = 4096*511
    assert log_power + 256 + 1 < pencil
    result = {"status": "VERIFIED_MIDDLE_TARGET_SOURCE_LOG_CAP_CONDITIONAL_SAME_BODY_AND_ANALYTIC_JETS",
              "sourceTraceSHA256": SOURCE_PINS["active"][1], "arithmeticNodes": len(values),
              "inputPins": {**{key: pair[1] for key, pair in SOURCE_PINS.items()},
                            "originalSourceProfile": PROFILE_PIN, "middleSameBody": BINDING_PIN},
              "magnitudeSemantics": ["CSelected^power", "Renv^(power/2^128)", "exp(Renv^power)"],
              "exponentials": exps, "positiveOrNonzeroInverseOperands": inverses,
              "sourceRootCaps": {name: vars(values[i].upper) for name, i in root_ids.items()},
              "targetBounds": target, "middleSlowLogRenvPower": log_power,
              "basisForBandDebit": "H=h*ell*log(2) > Bnorm^511/2 >= Renv^(4096*511)/2",
              "middleTargetLogCap": "H/2^256", "finalJets": 0, "release": "HOLD"}
    out.write_text(json.dumps(result, indent=2)+"\n", encoding="utf8", newline="\n")
    print("Verified", len(values), "source arithmetic records; log target < Renv^"+str(log_power))


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser = ArgumentParser()
    parser.add_argument("--goal", required=True, type=Path)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--binding", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    main(args.goal, args.profile, args.binding, args.out)
