"""Read the pinned hosted JSONL and its registry without using a runtime AST evaluator."""
import argparse
from collections import defaultdict
import gzip
from hashlib import sha256
import json
from pathlib import Path


STREAM_PIN = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
REGISTRY_PIN = "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"
COUNT = 22_380_596
R, Z, T, ELL, Y1, Y2 = 17732748, 17732749, 17732750, 17732737, 17745430, 17745431
LOWER, UPPER, CHI = 17743711, 17743713, 17743734
X, XA, XB = 17732770, 3617, 28826
RAW_PAIRS = {
    "current pressure": (17754191, 17754192, 17754190, 17753980),
    "initialized pressure": (19570813, 19570814, 19570812, 19570776),
    "Signed pressure Z-partial": (22031615, 22031616, 22031614, 22031522),
    "Temporal potential": (22150838, 22150839, 22150837, 22150801),
    "FiveMap unshifted radial gauge": (22151950, 22151951, 22151949, 22151946),
    "updated pressure": (22153431, 22153433, 22153430, 22152359),
}
EXPRESSION_BODIES = {
    1324: ("GenericSignedAfterForced162_complete_gr", 22031251, [ELL, R, Z, T, Y1, Y2]),
    1329: ("afterActualSigned162_actual_meridional_potential", 22150942, [ELL, R, Z, T, Y1, Y2]),
    1332: ("ActualSignedAfterTemporalUpdatedPressure_P", 22151513, [ELL, Z, T]),
    1333: ("ActualSignedAfterTemporalUpdatedPressure_Jtheta", 22151576, [ELL, Z, T]),
    1334: ("ActualSignedAfterTemporalUpdatedPressure_Jz", 22151635, [ELL, Z, T]),
    1336: ("PostSignedFiveBump_gamma", 22151944, [ELL, R, Z, T]),
}
ANCHORS = {
    X, XA, XB, LOWER, UPPER, CHI, R, Z, T, ELL, Y1, Y2, 24, 0, 1, 20, 17732766,
    17732768, 17732767, 17732769, 17743712, 17743701, 117047, 117075,
    22031529, 22031531, 22031613, 22031648, 22032008, 22150943, 22150941, 22151953, 22151954,
    22151955, 22151956, 22151948, 22151626, 22151634, 22151514, 22151577, 22151636,
}
for case in RAW_PAIRS.values():
    ANCHORS.update(case)
ANCHORS.update(body for _, body, _ in EXPRESSION_BODIES.values())


def stream(path, selected):
    digest = sha256()
    records = {}
    selected = selected | {0, 1, X, COUNT - 1}
    with gzip.open(path, "rb") as source:
        header = source.readline()
        assert json.loads(header)["node_count"] == COUNT
        digest.update(header)
        total_bytes = len(header)
        for identity, raw in enumerate(source):
            digest.update(raw)
            total_bytes += len(raw)
            if identity in selected:
                records[identity] = json.loads(raw)
    assert (identity + 1, total_bytes) == (COUNT, 1_036_106_095), (identity + 1, total_bytes)
    assert digest.hexdigest() == STREAM_PIN
    assert set(records) == selected
    return records


def record(nodes, i, operation, operands):
    assert nodes[i] == {"op": operation, "args": operands}, (i, nodes.get(i))


def assert_pair(nodes, spec):
    left, whole, body, variable = spec
    assert left != whole and body != variable and variable not in (R, Z, T, ELL, Y1, Y2)
    record(nodes, left, "definite_integral", [body, variable, LOWER, R])
    record(nodes, whole, "definite_integral", [body, variable, LOWER, UPPER])


def main(artifact):
    registry = (artifact / "original-source-functions.json").read_bytes()
    assert sha256(registry).hexdigest() == REGISTRY_PIN
    registry = json.loads(registry)
    expressions, indexed, *_ = json.loads(registry["definitions"])
    assert registry["counts"] == [2269, 29, 2, 60, 0]
    for index, (name, body, parameters) in EXPRESSION_BODIES.items():
        entry = expressions[index]
        assert (entry["id"], entry["name"], entry["body"], entry["parameters"]) == (
            f"coupled-expression:{index}", name, body, parameters)
    guard_count = 0
    chart_families = defaultdict(int)
    for i, field in enumerate(indexed):
        assert field["id"] == f"coupled-field:{i}"
        assert field["parameters"][:6] == [R, Z, T, ELL, Y1, Y2]
        assert len(field["rows"]) == 162
        labels = defaultdict(set)
        for row in field["rows"]:
            assert len(row["guards"]) == 5
            assert row["guards"][0] == [X, XA, XB]
            assert row["values"][:3] == [R, Z, T]
            local = expressions[int(row["localSystem"].split(":")[1])]
            assert local["body"] == row["localBody"]
            labels[row["label"]["key"]].add(row["label"]["sign"])
            guard_count += 1
        assert len(labels) == 81 and all(signs == {-1, 1} for signs in labels.values())
        chart_families[field["name"]] = len(labels)
    assert guard_count == 4698

    nodes = stream(artifact / "original-source-nodes.jsonl.gz", ANCHORS)
    record(nodes, XA, "source_parameter", ["Xa"])
    record(nodes, LOWER, "sqrt_positive", [XA])
    record(nodes, UPPER, "multiply", [24, 17743712])
    record(nodes, 24, "rational", ["2", "1"])
    record(nodes, 17743712, "sqrt_positive", [XB])
    record(nodes, 17732766, "actual_monotone_root", [2, Z, T])
    record(nodes, 17732768, "multiply", [24, 17732766])
    record(nodes, 17732767, "integer_power", [R, 2])
    record(nodes, 17732769, "inverse", [17732768])
    record(nodes, X, "multiply", [17732767, 17732769])
    record(nodes, CHI, "source_step_derivative", [17743701, 0])
    record(nodes, 117047, "smooth_piecewise", [4756, 28814, 28824, 0, 117045, 0])
    record(nodes, 22031613, "m3_coupled_expression_partial",
           ["coupled-expression:1324", [ELL, 22031522, Z, T, 22031529, 22031531],
            [0, 0, 1, 0, 0, 0]])
    record(nodes, 22031614, "add", [22031608, 22031613])
    for spec in RAW_PAIRS.values():
        assert_pair(nodes, spec)

    record(nodes, 22150943, "m3_coupled_expression_partial",
           ["coupled-expression:1329", [ELL, R, Z, T, Y1, Y2], [0, 0, 0, 0, 0, 0]])
    record(nodes, 22151948, "m3_coupled_expression_partial",
           ["coupled-expression:1336", [ELL, 22151946, Z, T], [0, 0, 0, 0]])
    record(nodes, 22151953, "multiply", [CHI, 22151951])
    record(nodes, 22151954, "multiply", [20, 22151953])
    record(nodes, 22151955, "add", [22151950, 22151954])
    for body, integrand, variable in [
        (22151513, 22151512, 22151511), (22151576, 22151575, 22151517),
        (22151626, 22151625, 22151580),
    ]:
        record(nodes, body, "definite_integral", [integrand, variable, LOWER, UPPER])

    changed = dict(nodes)
    changed[22151951] = {"op": "definite_integral",
                        "args": [22151949, 22151946, LOWER, R]}
    try:
        assert_pair(changed, RAW_PAIRS["FiveMap unshifted radial gauge"])
    except AssertionError:
        rejected_bad_upper = True
    else:
        raise AssertionError("A moving whole upper bound passed")
    return {
        "sourceRecords": COUNT, "sourceSHA256": STREAM_PIN, "registrySHA256": REGISTRY_PIN,
        "fixedRadialEndpoints": [LOWER, UPPER], "radialCutoff": CHI, "shellGuard": [X, XA, XB],
        "nativeSignedRows": guard_count, "nativeGuardedFields": dict(chart_families),
        "pairsInNativeAST": {name: list(values) for name, values in RAW_PAIRS.items()},
        "nativeWholeMomentDefinitions": list(EXPRESSION_BODIES),
        "rawCensusLocations": {str(i): nodes[i] for i in
                               [22031615, 22031616, 22150838, 22150839, 22151950, 22151951]},
        "wrongUpperRejected": rejected_bad_upper,
        "scope": "Native AST endpoints, binder and row guards; analytic vanishing of every unguarded input is separate.",
    }


if __name__ == "__main__":
    CLI = argparse.ArgumentParser(description=__doc__)
    CLI.add_argument("artifact", type=Path)
    CLI.add_argument("output", type=Path)
    args = CLI.parse_args()
    result = main(args.artifact)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n", encoding="utf-8", newline="\n")
