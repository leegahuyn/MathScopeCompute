"""Bind the 25 fourth common-selector clauses to the original hosted graph."""
from argparse import ArgumentParser
from contextlib import ExitStack
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "higher-ftc"))
from bind_higher_normalized_pressure_ftc import bind_order, polynomial, verify_prefix
from compare_higher_ftc_exact_bodies import Compare, Difference, Export, Rebuilt, SOURCE


PINS = {
    "prefix": "758275f4cd1b23d38babfc91a3be3f961e073271a077db58523edbc22532c4b8",
    "rebuilt": "908cf614b88e1bd6c5f5ab9c49977d66fed82b57bbfcf60bc93cfc0c92606caa",
    "history": "e1c782cbb6ea5670e618e41833a4d7f640d6ed50d02d6c4f73607e1b52f4790f",
    "upper": "d1a32576780f3c10956d03aaca6f51a5cd408a1ae5558e31e04384bbccab33bd",
    "threshold": "1a5ce5577bd4c5d47975b89a1de4433eb37a46068ba388459d2821f8ddd0c69a",
    "stage": "0c7285a274b3442eca8cf2127c3d279f8a09ec0db48f5d444006f23d324b3cd8",
}
KINDS = {
    "normalizedPressureN4": "normalized-pressure",
    "velocityPhysicalN4": "velocity-potential-physical",
    "pressureStressPhysicalN4": "pressure-stress-physical",
    "weightedStressQuotientN4": "higher-stress-quotient-by-zeta",
    "weightedStressDirectN4": "higher-stress-direct-zeta",
}


def read_pinned(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], key
    return json.loads(raw)


def required_log(graph, clause):
    root = clause["bound"]
    op, args = graph.node(clause["requiredLog"])
    assert op == "multiply" and len(args) == 2
    [inverse] = [j for j in args if graph.node(j)[0] == "inverse"]
    [denominator] = graph.node(inverse)[1]
    assert polynomial(graph.node, denominator) == {1: Fraction(4)}
    [num] = [j for j in args if j != inverse]
    op, terms = graph.node(num)
    assert op == "add" and len(terms) == 2
    [ln2_term] = [j for j in terms if graph.node(j) != ("log_positive", [root])]
    op, leaves = graph.node(ln2_term)
    assert op == "multiply" and len(leaves) == 2
    assert {tuple(graph.node(j)[1]) for j in leaves} == {("4", "1"), (24,)}
    assert ("log_positive", [24]) in [graph.node(j) for j in leaves]
    assert graph.node(24) == ("rational", ["2", "1"])


class Historical:
    def __init__(self, packet, original, shared, *, root=None):
        self.nodes = {r["id"]: (r["node"]["op"], r["node"]["args"]) for r in packet["trace"]["nodes"]}
        self.base = original.base
        self.shared = shared
        self.original = original
        self.literal = 0
        retained = self.nodes
        if root is not None:
            retained = {}
            todo = [root]
            while todo:
                i = todo.pop()
                if i in retained:
                    continue
                op, args = self.nodes[i]
                retained[i] = op, args
                if op not in {"rational", "source_parameter", "definite_integral"}:
                    todo.extend(args[:1] if op == "integer_power" else args)
        for i, node in retained.items():
            if i < shared:
                assert node == original.node(i), i
                self.literal += 1
        boundaries = [x for x in packet["trace"]["nonArithmeticBoundaries"] if x["id"] in retained]
        assert {x["id"] for x in boundaries} == {239, 257, 275}
        for x in boundaries:
            assert x["id"] < shared and original.node(x["id"]) == ("definite_integral", x["node"]["args"])

    def node(self, i):
        if i < self.shared:
            return self.original.node(i)
        return self.nodes[i]


def historical_fingerprint(graph, root, shared):
    digests = {}
    todo = [(root, False)]
    while todo:
        i, ready = todo.pop()
        if i in digests:
            continue
        if i < shared:
            token = ["literal-source-prefix", i]
        else:
            op, args = graph.node(i)
            if op in {"rational", "source_parameter"}:
                token = [op, *args]
            else:
                if op == "integer_power":
                    children, attributes = args[:1], args[1:]
                else:
                    assert op in {"add", "multiply", "maximum", "inverse", "exp", "log_positive", "sqrt_positive", "ceiling"}, (i, op)
                    children, attributes = args, []
                assert all(0 <= j < i for j in children)
                if not ready:
                    todo.append((i, True))
                    todo.extend((j, False) for j in children if j not in digests)
                    continue
                operands = [digests[j] for j in children]
                if op in {"add", "multiply", "maximum"}:
                    operands.sort()
                token = [op, attributes, operands]
        digests[i] = sha256(json.dumps(token, separators=(",", ":")).encode()).hexdigest()
    return digests[root], len(digests)


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ("original", "prefix", "rebuilt", "history", "upper", "threshold", "stage", "out"):
        parser.add_argument("--"+key, required=True, type=Path)
    args = parser.parse_args()
    sys.setrecursionlimit(6000)
    prefix = read_pinned(args.prefix, "prefix")
    history = read_pinned(args.history, "history")
    upper = read_pinned(args.upper, "upper")
    threshold = read_pinned(args.threshold, "threshold")
    stage = read_pinned(args.stage, "stage")
    assert prefix["sourceCommit"] == history["sourceCommit"] == upper["sourceCommit"] == SOURCE
    with ExitStack() as stack:
        graph = Export(args.original, stack)
        assert graph.manifest["node_stream_sha256"] == "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
        literal = verify_prefix(graph, prefix)
        a13 = stage["data"]["diagnostics"]["originalA13Audit"]
        assert stage["originalSameProcess"] and stage["data"]["sourceAuthenticated"]
        assert a13["pass"] and a13["representedIntegralBoundsProved"]
        assert a13["sourceClosure"]["complete"] and a13["sourceClosure"]["nodeCount"] == 77
        for record in a13["sourceClosure"]["nodes"]:
            i, node = record["id"], record["node"]
            assert i < prefix["nodeCount"] and graph.node(i) == (node["op"], node["args"]), i
        rebuilt = Rebuilt(args.rebuilt, prefix)
        assert rebuilt.digest == PINS["rebuilt"]
        assert len(rebuilt.rows) == 1 and rebuilt.rows[0]["n"] == 4
        data, = rebuilt.rows
        row = graph.selector["rows"][3]
        assert row["order"] == 4 and set(data["bounds"]) == set(data["required"]) == set(KINDS.values())
        assert len(row["constraints"]) == 25 and row["smallBand"] == 0
        assert row["sourceCoefficientRoots"] == upper["sourceCoefficientRoots"][-1]
        assert graph.node(row["scale"]) == ("exp", [row["logScale"]])
        assert graph.node(row["previousLogScale"]) == ("maximum", graph.node(graph.selector["rows"][2]["logScale"])[1])
        assert row["previousLogScale"] == graph.selector["rows"][2]["logScale"]
        assert graph.node(row["growth"])[0] == "add" and row["previousLogScale"] in graph.node(row["growth"])[1]
        [log2] = [i for i in graph.node(row["growth"])[1] if i != row["previousLogScale"]]
        assert graph.node(log2) == ("log_positive", [24])
        compare = Compare(graph, rebuilt, prefix["nodeCount"])
        source_only = Compare(graph, graph, 0)
        assert set(source_only.flatten(0, row["logScale"], "maximum")) == {
            *source_only.flatten(0, row["historicalLogScale"], "maximum"),
            row["growth"], row["smallBand"], *(c["requiredLog"] for c in row["constraints"]),
        } or set(graph.node(row["logScale"])[1]) == {
            row["historicalLogScale"], row["growth"], row["smallBand"], *(c["requiredLog"] for c in row["constraints"]),
        }
        checked = []
        for name, kind in KINDS.items():
            clauses = [c for c in row["constraints"] if c["kind"] == kind]
            assert [c["derivativeOrder"] for c in clauses] == list(range(5))
            final = clauses[-1]
            for key, rebuilt_map in (("bound", "bounds"), ("requiredLog", "required")):
                compare.context = (4, kind, key)
                compare.compare(final[key], data[rebuilt_map][kind])
            top = set(source_only.flatten(0, final["bound"], "maximum"))
            for c in clauses:
                required_log(graph, c)
                assert set(source_only.flatten(0, c["bound"], "maximum")) <= top, (kind, c)
            checked.append({"kind": kind, "originalBound": final["bound"], "originalRequiredLog": final["requiredLog"],
                            "upperRequiredLog": upper["trace"]["roots"][name], "lowerOrders": [0,1,2,3]})
            print("PASS original N4", kind, flush=True)
        source_norm_nodes = {x["id"]:(x["node"]["op"],x["node"]["args"]) for x in upper["trace"]["nodes"]}
        pressure = bind_order(graph, upper["pressure"][0], source_norm_nodes.__getitem__, prefix)
        assert pressure["actualUniqueFaces"] == 60 and pressure["exactWeightedTermMatches"] == 35
        historical = Historical(history, graph, prefix["nodeCount"])
        assert history["originalCanonicalRow"]["order"] == 4
        hroot = history["originalCanonicalRow"]["logScale"]
        assert hroot == history["trace"]["roots"]["historicalLogC4"]
        left = historical_fingerprint(graph, row["historicalLogScale"], prefix["nodeCount"])
        right = historical_fingerprint(historical, hroot, prefix["nodeCount"])
        assert left == right, (left, right)
        source_ell = graph.selector["commonEllMinimum"]
        archival_ell = threshold["trace"]["roots"]["ellMinimum"]
        threshold_prefix = 118574
        archival = Historical(threshold, graph, threshold_prefix, root=archival_ell)
        live_threshold = historical_fingerprint(graph, source_ell, threshold_prefix)
        old_threshold = historical_fingerprint(archival, archival_ell, threshold_prefix)
        assert live_threshold == old_threshold, (live_threshold, old_threshold)
        negative = []
        for lhs, rhs in ((checked[0]["originalBound"], 1), (checked[3]["originalBound"], data["bounds"][checked[4]["kind"]])):
            try:
                compare.compare(lhs, rhs)
            except Difference as e:
                negative.append(e.reason)
            else:
                raise AssertionError("altered actual N4 clause accepted")
        result = {"schema":"MathScope.N7.OriginalFourthSelectorBindings/1", "sourceCommit":SOURCE,
                  "sourceGraphSHA256":graph.manifest["node_stream_sha256"], "inputSHA256":PINS,
                  "literalPrefix":literal, "originalCommonRow":{"growth":row["growth"],"logScale":row["logScale"],
                    "scale":row["scale"],"previousLogScale":row["previousLogScale"],"smallBand":row["smallBand"]},
                  "historical":{"actual":row["historicalLogScale"],"independent":hroot,
                    "literalReachableRecords":historical.literal,"merkleSHA256":left[0],"arithmeticReachable":left[1]},
                  "threshold":{"actual":source_ell,"archival":archival_ell,"merkleSHA256":live_threshold[0],
                    "arithmeticReachable":live_threshold[1],"literalReachableRecords":archival.literal},
                  "importedA13BoundaryProof":{"authenticatedSameProcessStageSHA256":PINS["stage"],
                    "originalCompleteClosureNodesCompared":77,"integralRoots":[239,257,275]},
                  "diagonalAndLower":checked, "normalizedPressureFaces":pressure,
                  "normalizations":dict(compare.normalizations),
                  "negativeControls":negative, "release":"HOLD"}
    raw = (json.dumps(result, indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print("PASS historical c4, five original fourth diagonal inequalities and all 20 lower comparisons", sha256(raw).hexdigest())


if __name__ == "__main__":
    main()
