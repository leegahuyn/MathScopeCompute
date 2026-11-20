"""Verify closed-eta chart injection and endpoint independence in the native graph."""
import argparse
from fractions import Fraction as Q
import gzip
from hashlib import sha256
import json
from pathlib import Path


STREAM_PIN = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
REGISTRY_PIN = "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"
PROJECTION_PIN = "797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7"
RUNTIME_PIN = "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"
HISTORICAL_PIN = "fe2d9af725a2fd4d7fdbbcb9eb2a9f242fe5160775589351f36d03964a4076d1"
COUNT = 22_380_596
X, ETA, LO, HI = 4756, 2, 28814, 28824
R, Z, T, SV, ROOT, NATIVE_X, NATIVE_ETA = 17732748, 17732749, 17732750, 17732756, 17732766, 17732770, 17732775
PAIRS = ((117057, 117055, LO, X), (117066, 117064, X, HI), (117075, 117073, LO, HI))


def require(nodes, identity, op, args):
    assert nodes[identity] == {"op": op, "args": args}, (identity, nodes.get(identity))


def pinned(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return data


def endpoint_ancestors(nodes, top):
    pending = [top]
    visited = set()
    constants = set()
    while pending:
        index = pending.pop()
        if index in visited:
            continue
        visited.add(index)
        expression = nodes[index]
        op, args = expression["op"], expression["args"]
        if op == "source_parameter":
            constants.add(args[0])
        elif op in {"add", "multiply"}:
            pending.extend(args)
        elif op in {"inverse", "sqrt_positive", "exp", "log_positive", "integer_power"}:
            pending.append(args[0])
        else:
            assert op == "rational", (index, op)
    return visited, sorted(constants)


def exact_cases():
    # h=1/32 is a rational witness within the symbolic source's admissible h interval.
    # With s=a^32 the quantities s^(2h) and s^D are exactly a^2 and a^15.
    h = Q(1, 32)
    D = Q(1, 2) - h
    assert 2 * h + 2 * D == 1 and 8 * h < Q(1, 2)
    cases = []
    for a in (Q(63, 64), Q(1), Q(65, 64)):
        s = a**32
        assert Q(1, 2) < s < 2
        for eta in (Q(-1), Q(-3, 4), Q(0), Q(3, 4), Q(1), Q(5, 4)):
            Z_value, T_value = a**15 * eta, s * (1 - eta**2)
            assert s - Z_value**2 * a**2 - T_value == 0
            assert (T_value >= 0) == (abs(eta) <= 1)
            assert (T_value == 0) == (abs(eta) == 1)
            root_slope = 1 - 2*h*eta**2
            eta_time_slope = -D*eta/(s*root_slope)
            if abs(eta) == 1:
                assert eta * eta_time_slope < 0
            cases.append({"s": str(s), "eta": str(eta), "TSign": (T_value > 0) - (T_value < 0),
                          "rootSlope": str(root_slope), "sourceEtaGuardSatisfied": abs(eta) <= 1})
    return cases


def audit(artifact, projection, runtime, historical):
    runtime = pinned(runtime, RUNTIME_PIN)
    for token in (b"derivativeLower:q(1,2),derivativeUpper:G.one",
                  b"closedEtaOneSided:true", b"Z=s^D*eta,T=s*(1-eta^2)",
                  b"qActual=G.mul(Q,s)", b"eta=G.div(Z,power(s,D))"):
        assert token in runtime
    registry = json.loads(pinned(artifact / "original-source-functions.json", REGISTRY_PIN))
    base = registry["base"]["base"]
    root_system = json.loads(base["monotone"])[2]
    assert (root_system["name"], root_system["variable"], root_system["parameters"],
            root_system["body"], root_system["left"], root_system["right"],
            root_system["derivativeLower"], root_system["derivativeUpper"], root_system["numericOracle"]) == (
        "ActualCommonBandSlowInverse", SV, [Z, T], 17732765, 19, 24, 19, 1, False)
    expressions = json.loads(base["expression"])
    original = json.loads(pinned(historical, HISTORICAL_PIN))
    assert (original["sourceStressFunction"], original["sourceStressBody"],
            original["formals"], original["density"]) == (672, 117069, [X, ETA], 117047)
    active_stress = [index for index, entry in enumerate(expressions)
                     if entry["name"] == "ActualAllFiniteOrderOneStress_z"]
    assert active_stress == [32011]
    active_stress, = active_stress
    stress = expressions[active_stress]
    assert (stress["body"], stress["parameters"], stress["derivativeLimits"]) == (117069, [X, ETA], [128, 128])
    assert (expressions[672]["name"], expressions[672]["body"]) == ("ActualCompactSlowCoefficient_493", 2141319)
    density_definitions = {i for i, item in enumerate(expressions)
                           if item["body"] == 117047 and item["parameters"] == [X, ETA]}
    assert len(density_definitions) == 1
    density_id, = density_definitions
    proj = dict(json.loads(pinned(projection, PROJECTION_PIN))["nodes"])
    low_parent, low_constants = endpoint_ancestors(proj, LO)
    high_parent, high_constants = endpoint_ancestors(proj, HI)
    anchors = {1, 9, 19, 20, 21, 22, 24, 25, 117045, 117047, 117069, 17732740,
               R, Z, T, *range(SV, 17732777), *low_parent, *high_parent}
    for whole, variable, _, _ in PAIRS:
        anchors.update((whole, variable, whole - 1))
    nodes = {}
    digest = sha256()
    with gzip.open(artifact / "original-source-nodes.jsonl.gz", "rb") as source:
        header = source.readline()
        assert json.loads(header)["node_count"] == COUNT
        digest.update(header)
        for identity, line in enumerate(source):
            digest.update(line)
            if identity in anchors:
                nodes[identity] = json.loads(line)
    assert identity + 1 == COUNT and digest.hexdigest() == STREAM_PIN and set(nodes) == anchors
    assert all(nodes[i] == proj[i] for i in nodes.keys() & proj.keys())
    require(nodes, 9, "source_parameter", ["h"])
    require(nodes, 19, "rational", ["1", "2"])
    require(nodes, 20, "rational", ["-1", "1"])
    require(nodes, 21, "multiply", [9, 20])
    require(nodes, 22, "add", [19, 21])
    require(nodes, 24, "rational", ["2", "1"])
    # The original chart equation is s - Z^2*s^(2h) - T = 0.
    for identity, op, args in [
        (25, "multiply", [9, 24]), (17732757, "integer_power", [Z, 2]),
        (17732758, "log_positive", [SV]), (17732759, "multiply", [25, 17732758]),
        (17732760, "exp", [17732759]), (17732761, "multiply", [17732757, 17732760]),
        (17732762, "multiply", [20, 17732761]), (17732763, "add", [SV, 17732762]),
        (17732764, "multiply", [20, T]), (17732765, "add", [17732763, 17732764]),
        (ROOT, "actual_monotone_root", [2, Z, T]), (17732767, "integer_power", [R, 2]),
        (17732768, "multiply", [24, ROOT]), (17732769, "inverse", [17732768]),
        (NATIVE_X, "multiply", [17732767, 17732769]), (17732771, "log_positive", [ROOT]),
        (17732772, "multiply", [22, 17732771]), (17732773, "exp", [17732772]),
        (17732774, "inverse", [17732773]), (NATIVE_ETA, "multiply", [Z, 17732774]),
        (17732776, "multiply", [17732740, ROOT]),
    ]:
        require(nodes, identity, op, args)
    require(nodes, 117047, "smooth_piecewise", [X, LO, HI, 0, 117045, 0])
    for integral, variable, left, right in PAIRS:
        require(nodes, integral, "definite_integral", [integral - 1, variable, left, right])
        require(nodes, integral - 1, "actual_expression_partial", [density_id, [variable, ETA], [0, 0]])
        assert nodes[variable]["op"] == "coordinate" and variable not in (X, ETA)
    assert ETA not in (low_parent | high_parent) and X not in (low_parent | high_parent)
    return {
        "pinnedRecords": COUNT, "pinnedSource": STREAM_PIN, "pinnedRegistry": REGISTRY_PIN,
        "nativeChartRoots": [ROOT, NATIVE_X, NATIVE_ETA, 17732776],
        "historicalStressFunction": 672, "activeHostedStressFunction": active_stress,
        "rawEntry672InActiveRegistry": expressions[672]["name"], "stressSharedBody": 117069,
        "densityFunction": density_id, "densityBody": 117047,
        "fixedEndpointAncestors": [[len(low_parent), low_constants], [len(high_parent), high_constants]],
        "parameterDomain": "0<h<1/16, admitted s in [1/2,2], physical T>=0 and eta recovered as Z/s^D",
        "slopeBound": "For v,s in [1/2,2], 2h*(s/v)^(1-2h)*eta^2<=8h<1/2",
        "physicalEtaBoundary": "eta^2=1-T/s; at T=0 with s>0, d_T eta=-D eta/(s(1-2h eta^2)) points inward",
        "originalFormalBinders": [list(x) for x in PAIRS],
        "exactRationalWitnesses": exact_cases(), "release": "HOLD",
        "scope": "The chart relation, exact binders and cutoff endpoints only; existence of actual joint density jets is separate.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("artifact", "projection", "runtime", "historical", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    result = audit(args.artifact, args.projection, args.runtime, args.historical)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n", encoding="utf-8", newline="\n")
