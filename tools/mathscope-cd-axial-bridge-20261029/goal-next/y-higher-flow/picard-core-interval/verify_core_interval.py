"""Check the retained C90 source operands and exact interval arithmetic."""

import gzip
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


SOURCE = "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
REGISTRY = "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"
PROFILE = "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152"
C89 = "e328c3e06763a28c0c5ee77e7e78625239dc26e2cec62f17190b66c1a39424ba"
C47 = "616008ecc34a358b5be24faf57484551c3102db09e92bdb1699c025e36118901"
C54_JSON = "b5ee46e2cdf6007b121ba469deb4e4a52ee6a4f5c913d34fc0b48e40c35785fb"
C54_DOC = "16562ca42c89ab5a598a036522ee80169399f9d652651822efcd349faa2067b1"


def pinned(path, expected):
    contents = path.read_bytes()
    assert sha256(contents).hexdigest() == expected, path
    return contents


def authenticate_stream(archive, live, nodes):
    entire = sha256()
    prefix = sha256(b"[")
    prefix_size = live["originalPrefixNodes"]
    assert prefix_size == 117676
    with gzip.open(archive / "original-source-nodes.jsonl.gz", "rb") as stream:
        header = next(stream)
        assert json.loads(header)["node_count"] == 7358162
        entire.update(header)
        for index, row in enumerate(stream):
            entire.update(row)
            if index < prefix_size:
                if index:
                    prefix.update(b",")
                prefix.update(row.rstrip(b"\r\n"))
                if index in nodes:
                    assert json.loads(row) == nodes[index], index
    prefix.update(b"]")
    assert index + 1 == 7358162 and entire.hexdigest() == SOURCE
    assert prefix.hexdigest() == live["originalPrefixSHA256"]


def check_profile(profile):
    def integer(k):
        return {"integer": k}

    def ref(k):
        return {"ref": k}

    assert profile == {
        "Md": integer(1048576),
        "T": {"sum": [{"exp": ref("Md")}, integer(10)]},
        "h": {"exp": {"product": [integer(-8002), ref("T")]}},
        "j0": {"power": [ref("h"), 4]},
        "sigmaStar": {"quotient": [ref("j0"), integer(2000)]},
        "rho": {"quotient": [{"power": [ref("sigmaStar"), 2]}, integer(65536)]},
        "logP": {"product": [integer(2), ref("T")]},
        "Pstar": {"exp": ref("logP")},
        "K": {"power": [ref("Pstar"), 2]},
        "Q": {"quotient": [{"product": [integer(str(2**260)), ref("K")]},
                           {"power": [ref("sigmaStar"), 2]}]},
        "Lambda": {"power": [ref("Q"), 64]},
        "Xa": {"quotient": [integer(4), ref("Lambda")]},
    }


def coeff(value):
    return {(): Fraction(value)} if value else {}


def atom(key):
    return {((key, 1),): Fraction(1)}


def prod(left, right):
    result = {}
    for lm, lv in left.items():
        for rm, rv in right.items():
            monomial = dict(lm)
            for variable, exponent in rm:
                monomial[variable] = monomial.get(variable, 0) + exponent
            key = tuple(sorted((v, n) for v, n in monomial.items() if n))
            result[key] = result.get(key, Fraction(0)) + lv * rv
    return {key: value for key, value in result.items() if value}


def inv(poly):
    if len(poly) != 1:
        return atom("inverse:" + repr(sorted(poly.items())))
    (monomial, value), = poly.items()
    return {tuple((key, -power) for key, power in monomial): 1 / value}


def add(left, right):
    result = dict(left)
    for term, value in right.items():
        result[term] = result.get(term, Fraction(0)) + value
    return {key: value for key, value in result.items() if value}


def polynomial(nodes, opaque):
    @cache
    def evaluate(index):
        if index in opaque:
            return opaque[index]
        name, args = nodes[index]["op"], nodes[index]["args"]
        if name == "rational":
            return coeff(Fraction(*map(int, args)))
        if name == "source_parameter":
            return atom(args[0])
        if name == "inverse":
            return inv(evaluate(args[0]))
        if name == "integer_power":
            base, n = args
            result = coeff(1)
            for _ in range(abs(n)):
                result = prod(result, evaluate(base))
            return inv(result) if n < 0 else result
        result = coeff(1 if name == "multiply" else 0)
        assert name in {"add", "multiply"}, (index, name, args)
        operation = prod if name == "multiply" else add
        for node in args:
            result = operation(result, evaluate(node))
        return result

    return evaluate


def main(paths):
    (live_path, archive, c89_path, analytic, scope, scope_doc, output) = map(Path, paths)
    live_bytes = live_path.read_bytes()
    live = json.loads(live_bytes)
    assert live["schema"] == "MathScope.C90.OriginalNativeCoreOperands/1"
    assert live["originalSystemsBound"] and live["parameterExpressionSHA256"] == PROFILE
    assert live["profile"] == "same-profile-2026-10-10.3"
    check_profile(live["profileScalars"])
    prior = json.loads(pinned(c89_path, C89))
    assert prior["sourceStreamSHA256"] == SOURCE and prior["registrySHA256"] == REGISTRY
    pinned(analytic, C47)
    pinned(scope, C54_JSON)
    pinned(scope_doc, C54_DOC)
    raw_registry = pinned(archive / "original-source-functions.json", REGISTRY)
    assert live["registrySHA256"] == REGISTRY
    systems = json.loads(json.loads(raw_registry)["base"]["picard"])
    assert len(systems) == 10
    nodes = dict(live["nodes"])
    assert len(nodes) == len(live["nodes"])
    authenticate_stream(archive, live, nodes)
    p = live["ids"]

    def expr(index):
        return nodes[index]["op"], nodes[index]["args"]

    def exact(index, op, args):
        assert expr(index) == (op, args), (index, expr(index), op, args)

    assert p["zero"] == 0 and p["one"] == 1
    exact(0, "rational", ["0", "1"])
    exact(1, "rational", ["1", "1"])
    for key, param in [("h","h"), ("j","j0"), ("Lambda","Lambda"), ("Xa","Xa")]:
        exact(p[key], "source_parameter", [param])
    assert p["leadingAxisU"] == p["j"]
    exact(p["a"], "sqrt_positive", [p["aSquared"]])
    assert systems[1]["radialDomain"] == [0, p["a"]]
    assert systems[1]["tail"]["sourceBound"] == p["C"]
    assert systems[1]["tail"]["solutionStrip"] == systems[1]["tail"]["loss"] == p["s"]
    prior_aux = next(row for row in prior["sourceSystems"] if row["system"] == 1)
    assert (p["aSquared"], p["C"], p["s"]) == (prior_aux["aSquared"], prior_aux["C"], prior_aux["solutionStrip"])
    native = polynomial(nodes, {})
    h, j, lam = atom("h"), atom("j0"), atom("Lambda")
    A = add(coeff(Fraction(1, 2)), h)
    assert native(p["A"]) == A
    assert native(p["aSquared"]) == prod(coeff(7), inv(lam))
    assert native(p["s"]) == prod(coeff(Fraction(1, 2**21)), prod(atom("rho"), inv(atom("Q"))))
    expected_axis = prod(coeff(4), prod(A, j))
    assert native(p["axisExpected"]) == expected_axis
    b = 2**20
    assert native(p["scale"]) == coeff(b)
    a, C, s = atom("a"), atom("C"), atom("s")
    geometry = polynomial(nodes, {p["a"]:a, p["C"]:C, p["s"]:s})
    numerator = prod(a, prod(j, prod(s, s)))
    cp = add(coeff(1), C)
    denominator = prod(coeff(b), prod(add(coeff(1), a), prod(cp, prod(cp, cp))))
    xi = prod(numerator, inv(denominator))
    x = prod(xi, xi)
    assert geometry(p["xi"]) == xi
    assert geometry(p["X"]) == x
    assert geometry(p["Y"]) == prod(lam, x)
    assert geometry(p["normalize"]) == prod(j, x)

    assert [(r["kind"],r["system"]) for r in live["rows"]] == [("raw",0),("auxiliary",1)]
    for r in live["rows"]:
        i = r["system"]
        system = systems[i]
        assert r["formalU"] == (28835,117627)[i]
        exact(r["formalU"], "actual_background_even_profile", [i,1,4756,2,0,0])
        assert r["first"] == r["firstForcing"] == system["forcing"][1] == 0
        assert r["f5"] == system["forcing"][5] == (26744,117624)[i]
        assert r["A0Row"] == system["A0"][1] == [0]*5 + [1]
        assert r["A1Row"] == system["A1"][1] == [0]*6
        assert r["diagonal"] == system["diagonal"] == [0,0,2,0,3,1]
        assert (r["xiFormal"], r["etaFormal"]) == (system["xi"], system["eta"])
        assert r["domain"] == system["radialDomain"]
        assert r["sourceInductionCore"] == [0,p["Xa"]]
        assert all(not entry or row >= 4 and col < 4
                   for row, entries in enumerate(system["A1"])
                   for col, entry in enumerate(entries))
        assert native(r["f5Axis"]) == expected_axis
        assert native(r["sourceAxisSlope"]) == prod(A,j)
        exact(r["application"], "actual_background_even_profile", [i,1,p["X"],0,0,0])
        radial_op, radial_args = expr(r["pointRadial"])
        assert radial_op == "actual_background_picard" and radial_args[:2] == [i,1]
        assert radial_args[3:] == [0,0]
        exact(radial_args[2], "sqrt_positive", [p["X"]])
        for target, layer in zip([r["firstRadialVelocity"],r["second"]],r["layers"], strict=True):
            (root, head), (integral, integral_body) = layer
            assert root == target and head["op"] == "multiply"
            assert sorted(head["args"]) == sorted([system["xi"], integral])
            assert integral_body["op"] == "definite_integral"
            assert integral_body["args"][2:] == [0,1]

    # Exact comparisons after eliminating the source scales using positivity,
    # 0<j,s<1, C/(1+C)^3<1, and C^3/(1+C)^3<1.
    assert Fraction(7, b*b) < 4                  # X < 4/Lambda
    assert Fraction(1,b) < Fraction(1,4)        # Xi < a/4 for Cauchy
    r_bound = Fraction(3,b)
    assert r_bound < Fraction(1,2)              # 1/(1-r) < 2
    cauchy_error = Fraction(1, 9*b)
    tail_error = Fraction(2*3**3, b)
    error = cauchy_error + tail_error
    assert error == Fraction(487, 9*b) and error < Fraction(55,b)
    # From T>10 and exp(1)>2: 0<h<2^(-20).
    assert 8002*10 > 20
    lo = Fraction(1,2) - Fraction(55,b)
    hi = Fraction(1,2) + Fraction(56,b)
    assert lo < Fraction(1,2)-error and Fraction(1,2)+Fraction(1,b)+error < hi
    assert lo > 0

    result = {
        "schema": "MathScope.C90.OriginalNativeN1CoreValueInterval/1",
        "sourceOperandStatus": "VERIFIED",
        "ordinaryIntervalStatus": "CONDITIONAL_ORIGINAL_C47_COEFFICIENT_DOMAIN_AND_C54_CORE_REALIZATION",
        "sourceStreamSHA256": SOURCE, "sourceNodesChecked": 7358162,
        "sourceRegistrySHA256": REGISTRY, "profileSHA256": PROFILE,
        "coreOperandsSHA256": sha256(live_bytes).hexdigest(),
        "dependencySHA256": {"C47Analysis": C47, "C54Source": C54_JSON, "C54Analysis": C54_DOC, "C89Source": C89},
        "system": 0, "component": 1, "originalEvenProfile": 28835,
        "originalForcing": 26744, "auxiliaryForcing": 117624,
        "sourceAxisForcing": "4*A*j0", "profile": live["profile"],
        "application": live["rows"][0]["application"],
        "actualCoreInput": {"X":p["X"], "eta":0, "Y":p["Y"], "Xa":p["Xa"], "aPositive":p["a"],
                            "scaleDenominator":b, "coordinate":"X=xi^2", "admitted":"0<X<Xa, eta=0"},
        "positiveNormalization": "j0*X",
        "normalizedEnclosure": [str(lo), str(hi)],
        "normalizedErrorAroundA": str(error),
        "termsGenerated": 2, "termsUsedForEnclosure": 2, "largeSourceIndexKEnumerated": False,
        "globalJetRowsPromoted": 0, "allNativeYRowsPromoted": False,
    }
    with output.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print("VERIFIED 7,358,162 original source nodes and the two N1 native systems")
    print("VERIFIED exact axis forcing 4*A*j0 and the nonzero source-native chart input")
    print(f"CONDITIONAL normalized ordinary interval [{lo}, {hi}], using two terms")


if __name__ == "__main__":
    main(sys.argv[1:])
