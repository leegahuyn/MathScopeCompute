"""Reconstruct typed Repeat indexed data at the authenticated archive EOF.

This reader does not hydrate or claim a live private source registry.
"""

import argparse
from array import array
from copy import deepcopy
from functools import cache
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


GOAL = Path("work/goal-next")
BASE = GOAL / "continuation132/hosted-44682703381"
RECEIPT = GOAL / "continuation132/active-repeat-source/active-readback.json"
DISPATCH = GOAL / "continuation134/indexed-dispatch/indexed-dispatch.json"
FORCED = BASE / "pr30-runtime-overlays/1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3.mjs"
BIND = {
    BASE / "active-n3-repeat-forced-candidate.json":
        "b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e",
    BASE / "active-n3-repeat-forced-source/original-source-functions.json":
        "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce",
    BASE / "active-n3-repeat-forced-source/original-source-export-manifest.json":
        "04351d6619a0d782ac108f231efc67ffbd35c2f88e7951f2b1b14445a8ca59a2",
    RECEIPT: "49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4",
    DISPATCH: "26be2e8531920231755b1fe9225845da35bc576144d0431372152fc7d33f2a8e",
    FORCED: "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
}
PREFIX = 22_380_596
STREAM_HASH = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
CARRIER = 17732747
LEVEL = 21435320


def dump(value):
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode()


def checked(root, path):
    content = (root / path).read_bytes()
    assert sha256(content).hexdigest() == BIND[path], path
    return content


class Archive:
    """Resolve exact archived indices and locally append data-only operands."""

    def __init__(self, stream, storage):
        self.storage = storage
        self.offsets = array("Q")
        self.added = []
        self.indexed = {}
        h = sha256()
        offset = 0
        with gzip.open(stream, "rb") as f:
            header = next(f)
            assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": PREFIX}
            h.update(header)
            for line in f:
                self.offsets.append(offset)
                offset += len(line)
                storage.write(line)
                h.update(line)
        assert len(self.offsets) == PREFIX and h.hexdigest() == STREAM_HASH

    @cache
    def record(self, index):
        if index >= PREFIX:
            return self.added[index - PREFIX]
        self.storage.seek(self.offsets[index])
        return json.loads(self.storage.readline())

    def node(self, operation, args):
        row = {"op": operation, "args": args}
        key = dump(row)
        if key not in self.indexed:
            identity = PREFIX + len(self.added)
            self.indexed[key] = identity
            self.added.append(row)
        return self.indexed[key]

    def clone(self, index, args):
        return self.node(self.record(index)["op"], args)

    def rational(self, numerator, denominator=1):
        if numerator in (0, 1, -1) and denominator == 1:
            return {0: 0, 1: 1, -1: 20}[numerator]
        return self.node("rational", [str(numerator), str(denominator)])

    def add(self, terms):
        nodes = iter(terms)
        root = next(nodes)
        for term in nodes:
            root = self.node("add", [root, term])
        return root

    @cache
    def free(self, identity):
        row = self.record(identity)
        op, args = row["op"], row["args"]
        if op == "coordinate":
            return frozenset({identity})
        if op in {"rational", "source_parameter"}:
            return frozenset()
        if op == "definite_integral":
            body, variable, lower, upper = args
            return (self.free(body) - {variable}) | self.free(lower) | self.free(upper)
        if op in {"add", "multiply", "maximum", "smooth_piecewise"}:
            children = args
        elif op in {"inverse", "integer_power", "sqrt_positive", "exp", "log_positive",
                    "ceiling", "source_step_derivative", "sine", "cosine"}:
            children = args[:1]
        elif op.endswith("_partial") and len(args) == 3:
            children = args[1]
        elif op == "actual_monotone_root":
            children = args[1:]
        elif op in {"actual_covariance_volterra", "m3_global_pulse_jet",
                    "actual_pulse_jet_volterra", "actual_pulse_sensitivity_volterra",
                    "actual_pulse_third_jet_volterra", "actual_n6_pulse_higher_jet_volterra"}:
            children = [args[2], *args[3]]
        elif op == "m3_forced_pulse_partial":
            children = [args[3], *args[4]]
        elif op in {"actual_natural_series"}:
            children = args[1:3]
        elif op in {"actual_background_even_profile", "actual_background_picard"}:
            children = args[2:4]
        elif op == "actual_quadratic_root":
            children = args[2:3]
        else:
            raise AssertionError((identity, op))
        return frozenset().union(*(self.free(child) for child in children))


def condition(graph, identity):
    node = graph.record(identity)
    assert node["op"] == "smooth_piecewise"
    return node["args"]


def closed_branch(graph, identity, triplet):
    x, lo, hi, before, inside, after = condition(graph, identity)
    assert [x, lo, hi] == triplet and before == after == 0
    return inside


def native_application(graph, identifier, values, orders):
    return graph.node("m3_coupled_expression_partial", [identifier, values, orders])


def build_harmonics(graph, candidate, dispatch, parameters):
    by_chart = {(item["key"], item["m"]): item for item in candidate["systems"]}
    allowed = set(parameters)
    reconstructed = {}
    assert graph.record(CARRIER) == {"op": "ceiling", "args": [17732746]}
    assert graph.record(17732746) == {"op": "inverse", "args": [17732745]}
    assert graph.record(17732745) == {"op": "sqrt_positive", "args": [17732744]}
    for t in candidate["templates"]:
        chart, phase = t["key"], t["phase"]
        assert dispatch["branches"][chart]["phase"] == phase
        assert graph.free(phase) <= allowed
        parts = [[] for _ in range(4)]
        for m in (1, 2, 3, 4):
            s = by_chart[chart, m]
            for field, harmonic_mode in (("positive", m), ("negative", -m)):
                z = s[field]
                assert z["m"] == harmonic_mode
                coefficient = [*z["velocity"], z["pressure"]]
                a = graph.node("multiply", [CARRIER, graph.rational(harmonic_mode)])
                argument = graph.node("multiply", [a, phase])
                cosine = graph.node("cosine", [argument])
                sine = graph.node("sine", [argument])
                original = by_chart[chart, m]["positive"]
                for j, x in enumerate(coefficient):
                    assert graph.free(x["real"]) <= allowed and graph.free(x["imaginary"]) <= allowed
                    if harmonic_mode < 0:
                        positive = [*original["velocity"], original["pressure"]][j]
                        assert positive["real"] == x["real"]
                        conjugate = graph.record(x["imaginary"])
                        assert conjugate["op"] == "multiply" and set(conjugate["args"]) == {20, positive["imaginary"]}
                    real = graph.node("multiply", [x["real"], cosine])
                    imag = graph.node("multiply", [x["imaginary"], sine])
                    parts[j].append(graph.node("add", [real, graph.node("multiply", [20, imag])]))
        reconstructed[chart] = [graph.add(terms) for terms in parts]
    assert len(reconstructed) == 10
    return reconstructed


def rebuild_own(graph, old, chart_of_sign, guard_rows, reconstruction, j, sign):
    levels = old["body"]
    for triplet in guard_rows[chart_of_sign[0, sign]][:5]:
        levels = closed_branch(graph, levels, triplet)
    selectors = []
    for difference in range(5):
        x, lo, hi, before, inset, after = condition(graph, levels)
        assert x == LEVEL and before == after
        expected_limits = (Fraction(2 * difference - 1, 2), Fraction(2 * difference + 1, 2))
        for bound, expected in zip((lo, hi), expected_limits, strict=True):
            row = graph.record(bound)
            assert row["op"] == "rational" and Fraction(*map(int, row["args"])) == expected
        chart = chart_of_sign[difference, sign]
        xi, v = guard_rows[chart][5:]
        inner = closed_branch(graph, inset, xi)
        closed_branch(graph, inner, v)
        body = reconstruction[chart][j]
        guarded_v = graph.clone(inner, [*v, 0, body, 0])
        guarded_xi = graph.clone(inset, [*xi, 0, guarded_v, 0])
        selectors.append((x, lo, hi, guarded_xi))
        levels = before
    assert levels == 0
    for x, lo, hi, inside in reversed(selectors):
        levels = graph.node("smooth_piecewise", [x, lo, hi, levels, inside, levels])
    for triplet in reversed(guard_rows[chart_of_sign[0, sign]][:5]):
        levels = graph.node("smooth_piecewise", [*triplet, 0, levels, 0])
    assert graph.free(levels) <= set(old["parameters"])
    return levels


def assemble(graph, registry, candidate, dispatch, guard_rows):
    expressions, fields, *_ = json.loads(registry["definitions"])
    by_name = {row["name"]: row for row in expressions}
    by_id = {row["id"]: row for row in expressions}
    copied_dispatch = lambda item: {k: item[k] for k in ("values", "guards", "derivativeMaps", "coefficient", "label")}
    field_choices = fields[9:13]
    old = field_choices[0]
    for field in field_choices + fields[16:20]:
        assert list(map(copied_dispatch, field["rows"])) == list(map(copied_dispatch, old["rows"]))
    first_expr = by_id[old["rows"][0]["localSystem"]]
    parameter_slots = first_expr["parameters"]
    assert len(parameter_slots) == 16 and parameter_slots[-1] == LEVEL
    assert all(graph.record(x)["op"] == "coordinate" for x in parameter_slots)
    result = build_harmonics(graph, candidate, dispatch, parameter_slots)
    chart_of_sign = {(row["difference"], row["sign"]): row["key"] for row in candidate["templates"]}
    extra_expressions, extra_fields, roots = [], [], []

    def expression(pattern, name, body):
        new = {**pattern, "id": "coupled-expression:" + str(len(expressions) + len(extra_expressions)),
               "name": name, "body": body}
        extra_expressions.append(new)
        return new

    for j, field in enumerate(field_choices):
        new_name = f"ActualPostFiveRepeatIncrementVelocity_{j}" if j < 3 else "ActualPostFiveRepeatIncrementPressure"
        systems = {}
        for sign_index, sign in enumerate((1, -1)):
            reference = by_name[f'{field["name"]}_reference_{sign_index}']
            own = by_name[f'{field["name"]}_own_{sign_index}']
            assert reference["parameters"] == own["parameters"] == parameter_slots
            old_rows = [r for r in field["rows"] if r["label"]["sign"] == sign]
            assert all(r["localSystem"] == reference["id"] for r in old_rows)
            fresh_own = expression(own, f"{new_name}_own_{sign_index}",
                                   rebuild_own(graph, own, chart_of_sign, guard_rows, result, j, sign))
            node = graph.record(reference["body"])
            assert node["op"] == "multiply" and len(node["args"]) == 2
            scale, old_apply = node["args"]
            if graph.record(old_apply)["op"] != "m3_coupled_expression_partial":
                scale, old_apply = old_apply, scale
            application = graph.record(old_apply)
            assert application["op"] == "m3_coupled_expression_partial"
            fn, values, orders = application["args"]
            assert fn == own["id"] and values[3:] == parameter_slots[3:] and not any(orders)
            mapped_own = native_application(graph, fresh_own["id"], values, orders)
            fresh_ref = graph.node("multiply", [scale, mapped_own])
            assert graph.free(fresh_ref) <= set(parameter_slots)
            systems[sign] = expression(reference, f"{new_name}_reference_{sign_index}", fresh_ref)

        fresh_rows = []
        for row in field["rows"]:
            local = systems[row["label"]["sign"]]
            fresh = {**row, "localSystem": local["id"], "localBody": local["body"]}
            fresh_rows.append(fresh)
            every_argument = [*row["values"], row["coefficient"], *[x for triplet in row["guards"] for x in triplet]]
            for argument in every_argument:
                assert graph.free(argument) <= set(field["parameters"])
            for terms in row["derivativeMaps"]:
                assert all(graph.free(term["coefficient"]).isdisjoint(field["directions"]) for term in terms)
        assert len(fresh_rows) == 162
        identifier = f"coupled-field:{len(fields) + len(extra_fields)}"
        added = {**deepcopy(field), "id": identifier, "name": new_name, "rows": fresh_rows}
        extra_fields.append(added)
        root = graph.node("m3_coupled_indexed_partial",
                          [identifier, field["parameters"], [0] * len(field["directions"])])
        roots.append({"id": identifier, "name": new_name, "root": root})
    assert len(extra_expressions) == 16 and len(extra_fields) == 4
    return extra_expressions, extra_fields, roots


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--artifact", type=Path, help="An extracted compatible C132-format source archive")
    parser.add_argument("--out", type=Path, required=True)
    opts = parser.parse_args()
    root = opts.root
    source = opts.artifact or (root / BASE)
    stream = source / "active-n3-repeat-forced-source"
    orig_candidate = checked(root, BASE / "active-n3-repeat-forced-candidate.json")
    orig_reg = checked(root, BASE / "active-n3-repeat-forced-source/original-source-functions.json")
    orig_manifest = checked(root, BASE / "active-n3-repeat-forced-source/original-source-export-manifest.json")
    candidate = json.loads((source / "active-n3-repeat-forced-candidate.json").read_bytes())
    native_bytes = (stream / "original-source-functions.json").read_bytes()
    assert native_bytes == orig_reg
    manifest = json.loads((stream / "original-source-export-manifest.json").read_bytes())
    pinned = json.loads(orig_manifest)
    for key in ("node_count", "node_stream_sha256", "node_stream_uncompressed_bytes", "definitions_sha256"):
        assert manifest[key] == pinned[key]
    reference = json.loads(orig_candidate)
    assert candidate["templates"] == reference["templates"] and candidate["systems"] == reference["systems"]
    assert candidate["fields"] == reference["fields"]
    checked(root, FORCED)
    receipt, dispatch = (json.loads(checked(root, item)) for item in (RECEIPT, DISPATCH))
    guard_rows = receipt["mechanics"]["guardTriplesByChart"]
    sys.setrecursionlimit(20000)
    with TemporaryFile() as backing:
        graph = Archive(stream / "original-source-nodes.jsonl.gz", backing)
        expressions, fields, roots = assemble(graph, json.loads(native_bytes), candidate, dispatch, guard_rows)
        suffix = b"".join(dump(node) for node in graph.added)
        definitions = dump({"expressions": expressions, "fields": fields})
        result = {
            "status": "EXACT_ARCHIVE_DERIVED_OFFLINE_INDEXED_DATA_ONLY",
            "originalNodeCount": PREFIX, "originalStreamSHA256": STREAM_HASH,
            "firstAppendNode": PREFIX, "endExclusive": PREFIX + len(graph.added),
            "appendedNodeSHA256": sha256(suffix).hexdigest(),
            "appendedDefinitionSHA256": sha256(definitions).hexdigest(),
            "newExpressions": len(expressions), "newFields": len(fields), "newTypedRows": 648,
            "roots": roots, "actualLiveRegistration": False, "nativeHydrationPerformed": False,
            "finalJets": 0, "release": "HOLD",
        }
    opts.out.mkdir(parents=True, exist_ok=True)
    (opts.out / "offline-append.jsonl").write_bytes(suffix)
    (opts.out / "offline-definitions.json").write_bytes(definitions)
    (opts.out / "offline-report.json").write_bytes(dump(result))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
