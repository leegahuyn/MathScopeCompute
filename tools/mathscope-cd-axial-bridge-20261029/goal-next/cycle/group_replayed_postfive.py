"""Project a newly exported first post-FiveMap graph in its actual node numbering."""
from argparse import ArgumentParser
from array import array
from collections import Counter
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryFile

from group_postfive_residual import (
    ANGLE, DIRECTIONS, EXPECTED_RATES, FIELDS, PALETTE_DIFFERENCE, RATIO, Recipes, Source,
)

FIELD_NAMES = [
    *(f"ActualForcedCurrent_velocity_{j}" for j in range(3)),
    "ActualForcedCurrent_angular_pressure",
    *(f"GenericSigned162_velocity_{j}" for j in range(3)),
    "GenericSigned162_angular_pressure",
]
ORIGINAL = "ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p"
CORRECTED = "CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT"


class IndexedGraph:
    def __init__(self, path, stream, manifest):
        self.stream = stream
        self.offsets = array("Q")
        digest = sha256()
        with gzip.open(path, "rb") as source:
            header = source.readline()
            digest.update(header)
            assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1",
                "node_count": manifest["node_count"]}
            for line in source:
                self.offsets.append(stream.tell())
                stream.write(line)
                digest.update(line)
        assert len(self.offsets) == manifest["node_count"]
        assert len(header) + stream.tell() == manifest["node_stream_uncompressed_bytes"]
        assert digest.hexdigest() == manifest["node_stream_sha256"]

    @cache
    def node(self, index):
        assert type(index) is int and 0 <= index < len(self.offsets)
        self.stream.seek(self.offsets[index])
        row = json.loads(self.stream.readline())
        return row["op"], row["args"]


class ReplayedSource(Source):
    def __init__(self, graph, registry):
        self.graph = graph
        exprs, self.fields, _, self.forced, _ = json.loads(registry["definitions"])
        self.expressions = {row["id"]: row for row in exprs}
        self.recipe = Recipes()
        self.phases, self.reference_calls, self.atoms = {}, {}, {}
        assert [self.fields[index]["name"] for index in FIELDS] == FIELD_NAMES
        assert self.literal(0) == 0 and self.literal(1) == 1

    def node(self, index):
        return self.graph.node(index)

    def replayed_chart(self, labels):
        assert self.node(RATIO) == ("exp", [3675261])
        assert self.node(3675261) == ("multiply", [127, 3675260])
        assert self.node(127) == ("log_positive", [24]) and self.literal(24) == 2
        assert self.node(3675260) == ("add", [622791, 3675259])
        assert self.node(3675259) == ("multiply", [20, 3675253]) and self.literal(20) == -1
        assert self.node(3675263) == ("sqrt_positive", [RATIO])
        assert self.node(3675268) == ("exp", [3675267])
        assert self.node(3675267) == ("multiply", [22, 3675266])
        assert self.node(3675266) == ("log_positive", [RATIO])
        assert self.node(22) == ("add", [19, 21]) and self.node(21) == ("multiply", [9, 20])
        assert self.literal(19) == Fraction(1, 2) and self.node(9) == ("source_parameter", ["h"])
        wrappers = [x for x in self.expressions.values()
                    if x["name"].startswith("ActualForcedCurrent_angular_residual_")
                    and "_reference_" in x["name"]]
        assert len(wrappers) == 6
        coordinate_values, residual_scale = None, None
        for wrapper in wrappers:
            op, factors = self.node(wrapper["body"])
            assert op == "multiply" and len(factors) == 2
            scale, = [root for root in factors if self.node(root)[0] == "exp"]
            mapped, = [root for root in factors if self.node(root)[0] == "m3_coupled_expression_partial"]
            _, (own, values, orders) = self.node(mapped)
            assert self.expressions[own]["parameters"] == wrapper["parameters"]
            assert values[3:] == wrapper["parameters"][3:] and not any(orders)
            if coordinate_values is None:
                coordinate_values, residual_scale = values[:3], scale
            assert coordinate_values == values[:3] and residual_scale == scale
        _, (scale_arg,) = self.node(residual_scale)
        tag, operands = self.node(scale_arg)
        assert tag == "multiply" and 3675266 in operands
        exponent, = set(operands) - {3675266}
        assert self.node(exponent)[0] == "add" and set(self.node(exponent)[1]) == {19, 5294}
        assert self.node(5294) == ("multiply", [23, 24]) and self.node(23) == ("add", [9, 19])
        rescale = [3675263, 3675268, RATIO]
        for value, coord, scale in zip(coordinate_values, DIRECTIONS, rescale):
            assert self.node(value) == ("multiply", [coord, scale])
        phases = {}
        for binding in self.reference_calls.values():
            definition = self.expressions[binding["ownSystem"]]
            suffix = definition["name"].rsplit("_own_", 1)[1]
            assert suffix in ("0", "1") and binding["values"][:3] == coordinate_values
            sign = 1 if suffix == "0" else -1
            for d in range(5):
                phase, = self.selected_phases(definition["body"], EXPECTED_RATES[sign], d)
                assert phases.setdefault((sign, d), phase) == phase
        assert len(phases) == len(set(phases.values())) == 10
        assert all(row["values"][-1] == row["label"]["fixedDifference"] for row in labels)
        forced = {}
        for row in self.forced:
            case, mode = row["name"].split("_m")
            d, sign = case.removeprefix("ActualOriginalForced_").split(":")
            d, sign, mode = map(int, (d, sign, mode))
            assert (sign, d) in phases and mode in (1, 2)
            assert row["directions"] == list(DIRECTIONS[:-1])
            assert row["left"] == 0 and row["initial"] == [{"real": 0, "imaginary": 0}] * 3
            forced[d, sign, mode] = {"system": row["id"], "length": row["length"], "variable": row["variable"]}
        assert len(forced) == 20
        return {
            "levelDifferenceCoordinate": PALETTE_DIFFERENCE,
            "phaseCases": [{"sign": sign, "difference": d, "ownPhase": phase}
                for (sign, d), phase in sorted(phases.items())],
            "ratio": RATIO, "ownCoordinates": coordinate_values,
            "referenceCoordinates": list(DIRECTIONS[:3]),
            "ownToReferenceDivisors": rescale, "referenceResidualMultiplier": residual_scale,
            "referenceResidualMultiplierExponent": exponent,
            "earlierForcedReferenceResidualRoots": [x["body"] for x in wrappers],
            "firstPositiveForcedSystems": list(forced.values()),
        }


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--graph", required=True, type=Path)
    parser.add_argument("--expect-commit", required=True)
    parser.add_argument("--calibrate-original", action="store_true")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    assert __debug__
    manifest = json.loads((args.graph / "original-source-export-manifest.json").read_bytes())
    assert manifest["executing_commit"] == args.expect_commit
    assert manifest["scope"] == (ORIGINAL if args.calibrate_original else CORRECTED)
    assert manifest["function_registry_capture_kind"] == "EXTENDED_COUPLED_FACADE"
    assert manifest["final_all_cycle_A_b_p"] is False and manifest["actual_final_67_jets_certified"] == 0
    roots = manifest["original_root_ids"]
    assert len(roots) == len(set(roots)) == 11
    data = (args.graph / "original-source-functions.json").read_bytes()
    assert sha256(data).hexdigest() == manifest["definitions_sha256"]
    with TemporaryFile() as stream:
        graph = IndexedGraph(args.graph / "original-source-nodes.jsonl.gz", stream, manifest)
        source = ReplayedSource(graph, json.loads(data))
        rows, fields = source.row_programs()
        chart = source.replayed_chart(rows)
        groups = source.groups(tuple(roots[5:8]))
        assert all(ANGLE not in source.free(root) for root in chart["ownToReferenceDivisors"])
        assert len(source.atoms) == 100
        statistics = [dict(Counter(len(x["indexedPartialFactors"]) for x in r["fullWavePolynomial"]))
            for r in groups]
        result = {
            "schema": "MathScope.M3.ReplayedPostFiveHarmonicProjection/1",
            "scope": manifest["scope"], "sourceCommit": manifest["executing_commit"],
            "graphSHA256": manifest["node_stream_sha256"], "registrySHA256": manifest["definitions_sha256"],
            "graphNodes": manifest["node_count"], "physicalVelocity": roots[:3],
            "physicalPressure": roots[3], "physicalDivergence": roots[4],
            "sourcePhases": source.phases, "forcingChart": chart, "referenceCalls": source.reference_calls,
            "rows": rows, "fields": fields, "indexedAtoms": source.atoms,
            "coefficientRecipes": source.recipe.nodes, "residual": groups, "termCounts": statistics,
            "retainsCrossRowProducts": True, "completeSupportedForcingInput": False,
        }
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n",
        encoding="utf-8", newline="\n")
    print(json.dumps({"rows": len(rows), "indexedAtoms": len(source.atoms),
        "termCounts": statistics, "scope": result["scope"]}))


if __name__ == "__main__":
    main()
