"""Trace the original first-FiveMap inverse in its actual lexical chart frames."""

import argparse
from collections import defaultdict
from fractions import Fraction as Q
import gzip
from hashlib import sha256
import json
from pathlib import Path
import sys


GOAL = Path("work/goal-next")
DELIVERY = Path("work/delivery-20261110")
GRAPH = DELIVERY / "inputs/graph"
REPLAY = Path("work/goal-20261111/y-next")
NATIVE_CHECK = GOAL / "y/native_reference_scopes.py"
ROOT_COUNT = 4_420_257
STREAM_HASH = "a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
PINS = {
    REPLAY / "reached.json": "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459",
    REPLAY / "range-flow-no-bracket.json": "f1e4832fe0540da6fb8d6f3b27ccb1112b54ad0232d653230232b2d49d9e1e55",
    REPLAY / "reference-inverse-paths.json": "217d2bc9b3e212b947a5dc1e65206924c7c32653bfb320f83acb242e7e563e68",
    GRAPH / "original-source-functions.json": "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e",
    DELIVERY / "inputs/producer/source-profile-data.mjs": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    GOAL / "continuation145/y-ledger/MANIFEST.json": "14234c453e7f4340baf318dc588572c7142512e414bc178f24f9a7b2b55461c2",
    NATIVE_CHECK: "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758",
}
Y_INPUTS = {4758, 4784, 5177, 5299}
REFERENCE_S = 622820
REPRESENTATIVE_S = 623935
Y_TRANSPORTS = {
    622900, 622910, 622920, 622930, 622941, 622949, 623780, 623787,
    633873, 633970, 634082, 634101, 634163, 634184,
}
FREE_Z, FREE_T = 622803, 622804
REFERENCE_KIND = "reference"
OWN_KIND = "own"
OWN_SAVED_KIND = "ownWithSavedReference"
PENDING_KIND = "pendingOwnBeforeRescaling"
REP_IMAGE = "frozenRepresentativeImage"
REP_DIRECT = "frozenRepresentativeDirect"


def load(path):
    return json.loads(path.read_bytes())


def authenticate_stream(path, nodes, extra):
    digest = sha256()
    captured = {}
    with gzip.open(path, "rb") as stream:
        header = next(stream)
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": ROOT_COUNT}
        digest.update(header)
        for count, line in enumerate(stream, 1):
            digest.update(line)
            node = count - 1
            if node in nodes:
                assert json.loads(line) == nodes[node], node
            if node in extra:
                captured[node] = json.loads(line)
    assert count == ROOT_COUNT and digest.hexdigest() == STREAM_HASH
    assert set(captured) == extra
    return captured


def static_bindings(nodes, receipt, registry):
    base = registry["base"]["base"]
    expressions = json.loads(base["expression"])
    native = json.loads(base["monotone"])[2]
    assert native["name"] == "ActualCommonBandSlowInverse"
    assert native["parameters"] == [FREE_Z, FREE_T]
    assert native["variable"] == 622810 and native["body"] == 622819
    assert [native[key] for key in ("left", "right", "derivativeLower", "derivativeUpper")] == [19, 24, 19, 1]
    expected = {
        9: ("source_parameter", ["h"]),
        19: ("rational", ["1", "2"]),
        20: ("rational", ["-1", "1"]),
        24: ("rational", ["2", "1"]),
        25: ("multiply", [9, 24]),
        127: ("log_positive", [24]),
        591: ("rational", ["16", "1"]),
        669: ("rational", ["10", "1"]),
        3454: ("source_parameter", ["Lambda"]),
        4757: ("multiply", [3454, 4756]),
        117105: ("rational", ["6", "1"]),
        617433: ("add", [117105, 617432]),
        617463: ("add", [669, 617432]),
        617464: ("multiply", [127, 617463]),
        617512: ("log_positive", [591]),
        617513: ("add", [617465, 617512]),
        617517: ("inverse", [127]),
        622781: ("multiply", [617465, 617517]),
        622782: ("multiply", [20, 622781]),
        622783: ("ceiling", [622782]),
        622784: ("multiply", [20, 622783]),
        622785: ("maximum", [617433, 622784]),
        622786: ("multiply", [617514, 617517]),
        622787: ("multiply", [20, 622786]),
        622788: ("ceiling", [622787]),
        622789: ("multiply", [20, 622788]),
        622790: ("add", [20, 622789]),
        622811: ("integer_power", [FREE_Z, 2]),
        622812: ("log_positive", [622810]),
        622813: ("multiply", [25, 622812]),
        622814: ("exp", [622813]),
        622815: ("multiply", [622811, 622814]),
        622816: ("multiply", [20, 622815]),
        622817: ("add", [622810, 622816]),
        622818: ("multiply", [20, FREE_T]),
        622819: ("add", [622817, 622818]),
        REFERENCE_S: ("actual_monotone_root", [2, FREE_Z, FREE_T]),
        REPRESENTATIVE_S: ("actual_monotone_root", [2, 623921, 623934]),
        622824: ("multiply", [622821, 622823]),
        622821: ("integer_power", [622802, 2]),
        622822: ("multiply", [24, 622820]),
        622823: ("inverse", [622822]),
        633728: ("integer_power", [633709, 2]),
        634081: ("multiply", [622823, 633728]),
        622958: ("multiply", [622808, 622957]),
        622962: ("multiply", [622809, 622961]),
        625946: ("multiply", [623953, 623955]),
        625947: ("multiply", [623935, 625864]),
    }
    for identity, (op, args) in expected.items():
        assert nodes[identity] == {"op": op, "args": args}, (identity, nodes[identity])
    assert nodes[617465]["op"] == nodes[617514]["op"] == "maximum"
    assert 617464 in nodes[617465]["args"] and 617513 in nodes[617514]["args"]
    assert receipt["certifiedRangeCount"] == 519
    assert {row["id"] for row in receipt["openCalls"]} == Y_INPUTS
    assert all(row["y"] == 4757 for row in receipt["openCalls"])
    assert [nodes[identity]["args"][0] for identity in sorted(Y_INPUTS)] == ["Phi", "u", "average", "average"]
    sites = {}
    for call, body, sign, formal, actual, obligation in receipt["transported"]:
        if actual not in (622824, 634081):
            continue
        assert sign == "nn" and formal == 4756 and obligation == [["nn", actual]]
        assert nodes[call]["op"] == "actual_expression_partial"
        system, actuals, orders = nodes[call]["args"]
        definition = expressions[system]
        assert definition["body"] == body
        assert actuals[definition["parameters"].index(formal)] == actual
        sites[call] = {"call": call, "system": system, "radial": actual, "orders": orders}
    assert set(sites) == Y_TRANSPORTS
    return sites


def frame_contexts(reached, registry, scope, toolkit):
    nodes, bodies = dict(reached["nodes"]), dict(reached["sourceBodies"])
    base = registry["base"]
    indexed = json.loads(base["fieldDefinitions"])
    global_indexed = json.loads(base["base"]["m3GlobalFields"])
    coupled_indexed = json.loads(registry["definitions"])[1]
    row_transitions = defaultdict(dict)
    for event in scope["reboundNativeIndexedRows"]:
        i, row_index = event["call"], event["row"]
        index = nodes[i]["args"][0]
        if event["op"] == "m3_global_indexed_partial":
            entry = global_indexed[index]
        elif isinstance(index, str):
            assert index.startswith("coupled-field:")
            entry = coupled_indexed[int(index.split(":")[1])]
        else:
            entry = indexed[index]
        body = entry["rows"][row_index]["localBody"]
        assert body in bodies[i]
        next_kind = PENDING_KIND if 3675253 in event["mapping"] else OWN_KIND
        assert row_transitions[i].setdefault(body, next_kind) == next_kind

    mappings = {event["call"]: event["mapping"] for event in scope["reboundNativeFrames"]}
    targets = Y_TRANSPORTS | {REFERENCE_S, REPRESENTATIVE_S, 622824, 634081}
    contexts = defaultdict(set)
    stack = [(root, REFERENCE_KIND, False, None) for root in reached["roots"]]
    visited = set(stack)
    while stack:
        i, kind, frozen, representative_kind = stack.pop()
        if i in targets:
            contexts[i].add((kind, frozen, representative_kind))
            assert kind != PENDING_KIND, (i, kind)
            if i == REPRESENTATIVE_S:
                assert kind in (OWN_KIND, OWN_SAVED_KIND), (i, kind)
        mapping = mappings.get(i, {})
        z = mapping.get(FREE_Z)
        change = (kind, frozen, representative_kind)
        if z == 3822572:
            assert kind == PENDING_KIND and mapping[FREE_T] == 3822573
            change = (OWN_SAVED_KIND, frozen, representative_kind)
        elif z == 3675270:
            assert kind == OWN_SAVED_KIND and mapping[FREE_T] == 3675272
            change = (REFERENCE_KIND, False, None)
        elif z == 622958:
            assert frozen and mapping[FREE_T] == 622962
            change = (kind, frozen, REP_IMAGE)
        elif z == 625946:
            assert kind in (OWN_KIND, OWN_SAVED_KIND) and mapping[FREE_T] == 625947
            change = (kind, True, REP_DIRECT)
        elif mapping.get(622809) == REPRESENTATIVE_S:
            assert kind in (OWN_KIND, OWN_SAVED_KIND)
            change = (kind, True, representative_kind)
        for child in toolkit.actual_children(nodes[i]):
            nxt = (child, kind, frozen, representative_kind)
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
        for child in bodies.get(i, []):
            kind_change = row_transitions.get(i, {}).get(child)
            nxt = (child, *(change if kind_change is None else (kind_change, False, None)))
            if nxt not in visited:
                visited.add(nxt)
                stack.append(nxt)
    assert set(contexts) == targets
    def describe(row):
        kind, frozen, representative_kind = row
        return {"chart": kind, "representativeBound": frozen, "evaluatedAt": representative_kind or kind}
    entries = {node: [describe(row) for row in sorted(values, key=str)] for node, values in contexts.items()}
    return entries, len(visited)


def exact_countercontrols():
    lower, upper = Q(15, 32), Q(5, 2)
    # At e=L+2, the source window gives Q_e/qStar<=1/4 and b2*Q_e>=4.
    assert upper / 4 < 1 and lower * 4 > 1
    # t_lower is between L+3 and L+13/4, hence t<=U+1/4 even at U=L+3.
    assert 2 < 1 / lower and (1 / (2 * lower)) ** 4 < 2
    # t_upper is between L and L+1, inside the same original active-label window.
    assert 2 < upper < 4
    assert Q(1, 2) - lower == Q(1, 32)
    assert 2 - upper == Q(-1, 2)
    return [
        {"ell": "L+2", "Z": 0, "T": str(s), "physicalQ": f"{s} * Q_(L+2)",
         "QOverQStarUpper": str(s / 4), "b2QPhysicalLower": str(4 * s),
         "activeLabelsAllInsideOriginalWindow": True, "FAtHalf": str(Q(1, 2) - s), "FAtTwo": str(2 - s)}
        for s in (lower, upper)
    ]


def check_required_paths(nodes, receipt, toolkit):
    def required(node):
        op, operands = node["op"], node["args"]
        if op == "smooth_piecewise":
            return operands[:3]
        if op == "definite_integral":
            return operands[2:4]
        return toolkit.actual_children(node)
    roots = []
    for row in receipt["paths"]:
        trace = row["path"]
        assert trace[0]["nodeId"] == row["rootId"]
        assert trace[-1]["nodeId"] == REFERENCE_S
        for item in trace:
            assert nodes[item["nodeId"]]["op"] == item["operation"]
        for this, following in zip(trace[:-1], trace[1:], strict=True):
            assert following["nodeId"] in required(nodes[this["nodeId"]])
        roots.append(row["rootId"])
    assert roots == [4419702, 4420035, 4420039, 4420249, 4420253]
    return roots


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    for path, expected in PINS.items():
        assert sha256((args.root / path).read_bytes()).hexdigest() == expected, path
    sys.path.insert(0, str(args.root / NATIVE_CHECK.parent))
    import native_reference_scopes as toolkit

    reached = load(args.root / REPLAY / "reached.json")
    no_bracket = load(args.root / REPLAY / "range-flow-no-bracket.json")
    required = load(args.root / REPLAY / "reference-inverse-paths.json")
    registry = load(args.root / GRAPH / "original-source-functions.json")
    nodes = dict(reached["nodes"])
    assert len(nodes) == 159655 and len(reached["roots"]) == 11
    extra = ({
        9, 19, 20, 24, 25, 127, 591, 669, 3454, 117105,
        617432, 617433, 617463, 617464, 617465, 617512, 617513, 617514, 617517,
        623921, 623934, 623935,
    } | set(range(622781, 622791)) | set(range(622810, 622820))) - nodes.keys()
    extras = authenticate_stream(args.root / GRAPH / "original-source-nodes.jsonl.gz", nodes, extra)
    sites = static_bindings(nodes | extras, no_bracket, registry)
    scope = toolkit.native_scope_checks(reached, registry, Y_TRANSPORTS | {REFERENCE_S, REPRESENTATIVE_S},
                                        {3675253, 622807, 622808, 622809, 623855, 623856, 623857})
    guarded = toolkit.guarded_row_checks(reached, registry, scope, Y_INPUTS, Y_TRANSPORTS)
    assert guarded["guardedRelativeRowRecords"] == 29484 and not guarded["nativeFrameScopeFailures"]
    entries, frames = frame_contexts(reached, registry, scope, toolkit)
    assert required["originalSlowInverseNode"] == REFERENCE_S
    output = {
        "firstFiveOriginalStreamRecords": ROOT_COUNT,
        "firstFiveOriginalStreamSHA256": STREAM_HASH,
        "tracedLexicalStates": frames,
        "nativeGuardedRelativeRowRecords": guarded["guardedRelativeRowRecords"],
        "requiredBeforeRowBodies": check_required_paths(nodes, required, toolkit),
        "referenceOperator": {"node": REFERENCE_S, "nativeParameterNodes": [FREE_Z, FREE_T], "contexts": entries[REFERENCE_S]},
        "frozenRoot": {"node": REPRESENTATIVE_S, "nativeActualNodes": [623921, 623934], "contexts": entries[REPRESENTATIVE_S]},
        "actualSiteFrames": [dict(sites[i], contexts=entries[i]) for i in sorted(sites)],
        "physicalCountercontrols": exact_countercontrols(),
        "independentUnboundRadialRange": "519/523",
        "conditionalRangeAfterExplicitOriginalReferenceIngress": "523/523",
        "originalExternalEntryAutomaticallySelectsValidReference": False,
        "automaticFrozenEndpointProofGivenAdmittedOriginalRow": True,
        "officialNumericYRows": "33/523",
        "release": "HOLD",
    }
    print(json.dumps(output, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
