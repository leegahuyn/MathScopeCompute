"""Authenticate the original export's two axial native formal lists and exact binders."""
import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path


GRAPH_SHA = "a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
REGISTRY_SHA = "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e"
X, ETA, LEFT, RIGHT, RAW, DENSITY, STRESS = 4756, 2, 28814, 28824, 117045, 117047, 117069


def digest(b):
    return hashlib.sha256(b).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("graph", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    registry_bytes = (args.graph / "original-source-functions.json").read_bytes()
    assert digest(registry_bytes) == REGISTRY_SHA
    defs = json.loads(json.loads(registry_bytes)["base"]["base"]["expression"])
    assert defs[1]["parameters"] == defs[672]["parameters"] == [X, ETA]
    assert defs[1]["body"] == DENSITY and defs[672]["body"] == STRESS
    assert defs[672]["name"] == "ActualAllFiniteOrderOneStress_z"
    cases = [
        (117057, 117056, 117055, LEFT, X),
        (117066, 117065, 117064, X, RIGHT),
        (117075, 117074, 117073, LEFT, RIGHT),
    ]
    required = {ETA, 20, X, LEFT, RIGHT, RAW, DENSITY, STRESS}
    required |= {k for case in cases for k in case[:3]}
    h, nodes, direct, count = hashlib.sha256(), {}, [], 0
    with gzip.open(args.graph / "original-source-nodes.jsonl.gz", "rb") as stream:
        header = stream.readline()
        h.update(header)
        for i, line in enumerate(stream):
            h.update(line)
            if i in required:
                nodes[i] = json.loads(line)
            if b'"actual_expression_partial"' in line and b'[672,' in line:
                obj = json.loads(line)
                if obj["op"] == "actual_expression_partial" and obj["args"][0] == 672:
                    direct.append((i, obj["args"][1], obj["args"][2]))
            count += 1
    assert h.hexdigest() == GRAPH_SHA and count == json.loads(header)["node_count"] == 4420257
    assert nodes[DENSITY] == {"op": "smooth_piecewise", "args": [X, LEFT, RIGHT, 0, RAW, 0]}
    assert nodes[STRESS] == {"op": "smooth_piecewise", "args": [X, LEFT, RIGHT, 0, 117059, 0]}
    assert nodes[ETA]["op"] == nodes[X]["op"] == "coordinate"
    for integral, integrand, binder, lo, hi in cases:
        assert nodes[integral] == {"op": "definite_integral", "args": [integrand, binder, lo, hi]}
        assert nodes[integrand] == {"op": "actual_expression_partial", "args": [1, [binder, ETA], [0, 0]]}
        assert nodes[binder]["op"] == "coordinate" and binder not in (X, ETA)
    assert len(direct) == 157
    endpoint = [r for r in direct if r[1][0] in (0, LEFT, RIGHT)]
    assert len(endpoint) == 24 and all(r[1][0] == LEFT for r in endpoint)
    assert nodes[20] == {"op": "rational", "args": ["-1", "1"]}
    literal_physical_corner = [r for r in endpoint if r[1][1] == 20]
    assert sorted(r[2] for r in literal_physical_corner) == [
        [0,0], [0,1], [0,2], [1,0], [1,1], [2,0],
    ]
    argument_roots = {arg for _, values, _ in direct for arg in values}
    maximum_argument = max(argument_roots)
    with gzip.open(args.graph / "original-source-nodes.jsonl.gz", "rb") as stream:
        stream.readline()
        for i, line in enumerate(stream):
            if i in argument_roots:
                nodes[i] = json.loads(line)
            if i == maximum_argument:
                break
    assert argument_roots <= nodes.keys()
    temporary_operands = [
        i for i, values, _ in direct
        if any(nodes[v]["op"] == "coordinate"
               and nodes[v]["args"][0].startswith("capture_free_argument$")
               for v in values)
    ]
    endpoint_with_temporary = [i for i, _, _ in endpoint if i in temporary_operands]
    requested_jets = Counter(",".join(map(str, order)) for _, _, order in direct)
    out = {
        "schema": "MathScope.OrderOneAxialExportLexicalBinding/1",
        "graphSHA256": GRAPH_SHA,
        "registrySHA256": REGISTRY_SHA,
        "streamNodes": count,
        "formals": [X, ETA],
        "density": DENSITY,
        "sourceStressFunction": 672,
        "sourceStressBody": STRESS,
        "literalIntegrals": [
            {"integral": i, "integrand": f, "binder": v, "actualArguments": [v, ETA],
             "endpoints": [lo, hi]}
            for i, f, v, lo, hi in cases
        ],
        "directExport672Requests": len(direct),
        "directRequestsByJet": dict(sorted(requested_jets.items())),
        "literalEndpointRequests": endpoint,
        "literalPhysicalCornerRequests": literal_physical_corner,
        "directRequestsWithCaptureFreeTemporaryOperands": temporary_operands,
        "literalEndpointRequestsWithCaptureFreeTemporaryOperands": endpoint_with_temporary,
        "etaNode20": nodes[20],
        "externalCallDomainsClaimed": False,
        "scope": "Authenticates literal original formals and actual binders. External direct calls are an independent census.",
    }
    args.output.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: {count} pinned nodes, two formal lists, three exact binders and {len(direct)} separate direct requests.")


if __name__ == "__main__":
    main()

