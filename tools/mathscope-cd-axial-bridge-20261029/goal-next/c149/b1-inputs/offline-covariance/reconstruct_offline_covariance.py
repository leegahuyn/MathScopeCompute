"""Append exact archive-derived Repeat covariance data after C147's EOF."""

import argparse
from collections import Counter
from copy import deepcopy
from functools import cache
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


GOAL = Path("work/goal-next")
BASE = GOAL / "continuation132/hosted-44682703381"
RECOVERY = GOAL / "continuation146/failed-registration-44698543085"
CODE = RECOVERY / "reconstruct_offline_indexed_append.py"
WAVES = GOAL / "continuation132/active-repeat-source/protected-wave-bodies.json"
MANIFEST = RECOVERY / "OFFLINE_APPEND_MANIFEST.json"
INPUT_PINS = {
    WAVES: "2d326dee551a7c4b83908aab1244fcbd9916d398fa3d77af17eb73698106256b",
    MANIFEST: "33ad2855d826d27687fe78bb07e518731e8198795b8d21f6237ed5255587c91a",
}
PAIRS = {"rr": (0, 0), "rtheta": (0, 1), "rz": (0, 2),
         "thetatheta": (1, 1), "thetaz": (1, 2), "zz": (2, 2)}
MODES_OLD = (1, -1, 2, -2)
MODES_REPEAT = (1, -1, 2, -2, 3, -3, 4, -4)
THETA = 17732752


def read(path):
    return json.loads(path.read_bytes())


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def load_prior(root):
    for p, pin in INPUT_PINS.items():
        assert digest(root / p) == pin, p
    manifest = read(root / MANIFEST)
    for rel in (
        "reconstruct_offline_indexed_append.py",
        "offline-replay2/offline-append.jsonl",
        "offline-replay2/offline-definitions.json",
        "offline-replay2/offline-report.json",
    ):
        assert digest(root / RECOVERY / rel) == manifest["SHA256"][rel], rel
    spec = importlib.util.spec_from_file_location("offline_repeat_archive_core", root / CODE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    installed = root / RECOVERY / "offline-replay2"
    report = read(installed / "offline-report.json")
    assert report["originalNodeCount"] == module.PREFIX and report["endExclusive"] == 22382590
    assert not report["actualLiveRegistration"]
    lines = (installed / "offline-append.jsonl").read_bytes().splitlines()
    previous_append = [json.loads(line) for line in lines]
    assert len(previous_append) == report["endExclusive"] - module.PREFIX
    registry_append = read(installed / "offline-definitions.json")
    assert len(registry_append["fields"]) == 4 and len(registry_append["expressions"]) == 16
    return module, previous_append, registry_append


def neg(graph, root):
    return 0 if root == 0 else graph.node("multiply", [20, root])


def times(graph, x, y):
    return 0 if x == 0 or y == 0 else graph.node("multiply", [x, y])


def signed_old_and_repeat(graph, core, registry, candidate, old_wave_proof, allowed):
    names = {entry["name"]: entry for entry in registry[0]}
    old_charts = {entry["chart"]: dict(entry["reportedOwnersAndVerifiedProtectedBodyRoots"])
                  for entry in old_wave_proof["charts"]}
    inverse_rows = {(row["key"], row["m"]): row for row in candidate["systems"]}
    assert len(inverse_rows) == 40
    inputs = {}
    for t in candidate["templates"]:
        chart = t["key"]
        proof = old_charts[chart]
        assert set(proof) == set(t["rawSupport"]["waveSystems"]) and len(proof) == 16
        old, repeat, binding = {}, {}, []
        for m in (1, 2):
            old_positive = []
            for j in range(4):
                pair = []
                d_pair = []
                for part in ("real", "imaginary"):
                    d = names[f"PostFiveRepeatWave_{chart}_{m}_{j}_{part}"]
                    assert proof[d["id"]] == d["body"]
                    assert graph.free(d["body"]) <= set(d["parameters"]) <= allowed
                    d_pair.append([d["id"], d["body"]])
                    if j < 3:
                        pair.append(core.native_application(graph, d["id"], d["parameters"], [0] * len(d["parameters"])))
                binding.append({"mode": m, "component": j, "ownersAndBodies": d_pair})
                if j < 3:
                    old_positive.append(tuple(pair))
            old[m] = old_positive
            old[-m] = [(re, neg(graph, im)) for re, im in old_positive]
        for m in (1, 2, 3, 4):
            node = inverse_rows[chart, m]
            assert node["positive"]["m"] == m and node["negative"]["m"] == -m
            repeat[m] = [(z["real"], z["imaginary"]) for z in node["positive"]["velocity"]]
            repeat[-m] = [(z["real"], z["imaginary"]) for z in node["negative"]["velocity"]]
            for (re, im), (nre, nim) in zip(repeat[m], repeat[-m], strict=True):
                assert re == nre and graph.free(re) <= allowed and graph.free(im) <= allowed
                assert graph.free(nim) <= allowed
                assert nim == 0 if im == 0 else (
                    graph.record(nim)["op"] == "multiply" and set(graph.record(nim)["args"]) == {20, im}
                )
        inputs[chart] = (old, repeat, binding)
    return inputs


def combine(*terms):
    result = Counter()
    for term in terms:
        result.update(term)
    return Counter({key: value for key, value in result.items() if value})


def multiply(left, right):
    result = Counter()
    for a, n in left.items():
        for b, m in right.items():
            result[tuple(sorted(a + b))] += n * m
    return Counter({key: value for key, value in result.items() if value})


def scalar_times(integer, poly):
    return Counter({k: integer * n for k, n in poly.items() if n and integer})


def make_delta_body(graph, old, repeat, i, j):
    def real_product(a, b):
        re = times(graph, a[0], b[0])
        im = times(graph, a[1], b[1])
        return graph.add([re, neg(graph, im)])
    new_old = [real_product(repeat[m][i], old[-m][j]) for m in MODES_OLD]
    old_new = [real_product(old[m][i], repeat[-m][j]) for m in MODES_OLD]
    new_new = [real_product(repeat[m][i], repeat[-m][j]) for m in MODES_REPEAT]
    return graph.add([*new_old, *old_new, *new_new]), {"oldNew": old_new, "newOld": new_old, "newNew": new_new}


def check_delta_polynomial(graph, old, repeat, body, i, j):
    # Work in the degree-two ring over the actual positive coefficient IDs.
    # Archived negative modes were checked against these exact coefficients.
    atoms = {node for rows in (old, repeat) for m, coeff in rows.items() if m > 0
             for pair in coeff for node in pair if node != 0}
    at = lambda n: Counter({(n,): 1}) if n != 0 else Counter()
    @cache
    def to_poly(node):
        if node in atoms:
            return at(node)
        row = graph.record(node)
        op, args = row["op"], row["args"]
        if op == "rational":
            n, d = map(int, args)
            assert d == 1
            return Counter({(): n}) if n else Counter()
        if op == "add":
            return combine(*(to_poly(child) for child in args))
        if op == "multiply":
            return multiply(*(to_poly(child) for child in args))
        raise AssertionError((node, op))

    # This calculation never reads the append terms. Independently expand
    # W(O+U) and W(O) using positive modes only and conjugate real products.
    expected = Counter()
    for m in (1, 2, 3, 4):
        matched_old = old.get(m, [(0, 0)] * 3)
        for coordinate in (0, 1):
            oi, oj = (at(matched_old[k][coordinate]) for k in (i, j))
            ui, uj = (at(repeat[m][k][coordinate]) for k in (i, j))
            total = multiply(combine(oi, ui), combine(oj, uj))
            previous = multiply(oi, oj)
            expected = combine(expected, scalar_times(2, total), scalar_times(-2, previous))
    assert expected and to_poly(body) == expected
    return len(expected)


def assemble_covariance(graph, core, registry, registry_append, candidate, guards, wave_proof):
    old_expr, old_fields = registry[0], registry[1]
    e_by_name = {e["name"]: e for e in old_expr}
    copied = lambda r: {k: r[k] for k in ("values", "guards", "derivativeMaps", "coefficient", "label")}
    angular_dispatch = [copied(r) for r in registry_append["fields"][0]["rows"]]
    cov_dispatch = [{**r, "values": r["values"][:14] + r["values"][15:],
                     "derivativeMaps": r["derivativeMaps"][:5]} for r in angular_dispatch]
    baseline = old_fields[3]
    params = baseline["rows"][0]["localParameters"]
    assert len(params) == 15 and THETA not in params
    assert baseline["parameters"] == [c for c in registry_append["fields"][0]["parameters"] if c != THETA]
    assert baseline["directions"] == [c for c in registry_append["fields"][0]["directions"] if c != THETA]
    for previous_covariance in old_fields[3:9] + old_fields[20:26]:
        assert [copied(r) for r in previous_covariance["rows"]] == cov_dispatch
        assert previous_covariance["parameters"] == baseline["parameters"]
        assert previous_covariance["directions"] == baseline["directions"]

    inputs = signed_old_and_repeat(graph, core, registry, candidate, wave_proof, set(params))
    reconstruction, term_evidence = {}, {}
    for chart, (old, repeat, binding) in inputs.items():
        bodies, audit = [], {}
        for name, (i, j) in PAIRS.items():
            root, terms = make_delta_body(graph, old, repeat, i, j)
            monomials = check_delta_polynomial(graph, old, repeat, root, i, j)
            assert graph.free(root) <= set(params)
            bodies.append(root)
            audit[name] = {"localBody": root, "terms": terms, "polynomialMonomials": monomials}
        reconstruction[chart] = bodies
        term_evidence[chart] = {"protectedOldBindings": binding, "components": audit}

    chart_of_sign = {(row["difference"], row["sign"]): row["key"] for row in candidate["templates"]}
    expressions, fields, delta_roots = [], [], {}
    by_definition_size = len(old_expr) + len(registry_append["expressions"])
    by_field_size = len(old_fields) + len(registry_append["fields"])
    def expression(pattern, name, body):
        new = {**pattern, "id": f"coupled-expression:{by_definition_size + len(expressions)}",
               "name": name, "body": body}
        expressions.append(new)
        return new

    for j, (name, field) in enumerate(zip(PAIRS, old_fields[3:9], strict=True)):
        assert field["name"] == f"ActualForcedCurrent_W_{name}"
        new_name = f"ActualPostFiveRepeatCovarianceDelta_{name}"
        systems = {}
        for sign_index, sign in enumerate((1, -1)):
            own = e_by_name[f'{field["name"]}_own_{sign_index}']
            reference = e_by_name[f'{field["name"]}_reference_{sign_index}']
            assert own["parameters"] == reference["parameters"] == params
            assert {r["localSystem"] for r in field["rows"] if r["label"]["sign"] == sign} == {reference["id"]}
            rebuilt = core.rebuild_own(graph, own, chart_of_sign, guards, reconstruction, j, sign)
            new_own = expression(own, f"{new_name}_own_{sign_index}", rebuilt)
            rnode = graph.record(reference["body"])
            assert rnode["op"] == "multiply"
            scale, old_apply = rnode["args"]
            if graph.record(old_apply)["op"] != "m3_coupled_expression_partial":
                scale, old_apply = old_apply, scale
            application = graph.record(old_apply)
            assert application["op"] == "m3_coupled_expression_partial"
            fn, values, orders = application["args"]
            assert fn == own["id"] and values[3:] == params[3:] and not any(orders)
            scaled = graph.node("multiply", [scale, core.native_application(graph, new_own["id"], values, orders)])
            assert graph.free(scaled) <= set(params)
            systems[sign] = expression(reference, f"{new_name}_reference_{sign_index}", scaled)
        rows = []
        for row in field["rows"]:
            local = systems[row["label"]["sign"]]
            rows.append({**row, "localSystem": local["id"], "localBody": local["body"]})
            assert row["localParameters"] == params
            arguments = [*row["values"], row["coefficient"], *[x for guard in row["guards"] for x in guard]]
            assert all(graph.free(x) <= set(field["parameters"]) for x in arguments)
            assert all(graph.free(d["coefficient"]).isdisjoint(field["directions"])
                       for maps in row["derivativeMaps"] for d in maps)
        assert len(rows) == 162
        identifier = f"coupled-field:{by_field_size + len(fields)}"
        fresh = {**deepcopy(field), "id": identifier, "name": new_name, "rows": rows}
        fields.append(fresh)
        root = graph.node("m3_coupled_indexed_partial",
                          [identifier, field["parameters"], [0] * len(field["directions"])])
        delta_roots[name] = root
    assert len(expressions) == 24 and len(fields) == 6
    return expressions, fields, delta_roots, term_evidence


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--artifact", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    core, prior_nodes, prior_registry = load_prior(args.root)
    archive = args.artifact or (args.root / BASE)
    stream = archive / "active-n3-repeat-forced-source"
    native_rel = "original-source-functions.json"
    candidate_rel = "active-n3-repeat-forced-candidate.json"
    assert (archive / candidate_rel).read_bytes() == core.checked(args.root, BASE / candidate_rel)
    assert (stream / native_rel).read_bytes() == core.checked(args.root, BASE / "active-n3-repeat-forced-source" / native_rel)
    registry = json.loads(read(stream / native_rel)["definitions"])
    candidate = read(archive / candidate_rel)
    authenticated_receipt = json.loads(core.checked(args.root, core.RECEIPT))
    start = core.PREFIX + len(prior_nodes)
    sys.setrecursionlimit(20000)
    with TemporaryFile() as backing:
        graph = core.Archive(stream / "original-source-nodes.jsonl.gz", backing)
        graph.added.extend(prior_nodes)
        graph.indexed.update({core.dump(row): core.PREFIX + i for i, row in enumerate(prior_nodes)})
        expressions, fields, roots, terms = assemble_covariance(
            graph, core, registry, prior_registry, candidate, authenticated_receipt["mechanics"]["guardTriplesByChart"],
            read(args.root / WAVES),
        )
        assert graph.added[: len(prior_nodes)] == prior_nodes
        suffix = b"".join(core.dump(row) for row in graph.added[len(prior_nodes):])
        definitions = core.dump({"expressions": expressions, "fields": fields})
        evidence = core.dump(terms)
        report = {
            "status": "EXACT_ARCHIVE_DERIVED_OFFLINE_REPEAT_COVARIANCE_ONLY",
            "firstAppendNode": start, "endExclusive": core.PREFIX + len(graph.added),
            "covarianceDeltaRoots": roots, "newExpressionRecords": len(expressions),
            "newTypedFields": [f["id"] for f in fields],
            "typedRows": sum(len(f["rows"]) for f in fields),
            "independentCovarianceRingIdentities": len(terms) * len(PAIRS),
            "appendSHA256": sha256(suffix).hexdigest(),
            "definitionsSHA256": sha256(definitions).hexdigest(),
            "termEvidenceSHA256": sha256(evidence).hexdigest(),
            "originalNativeStreamSHA256": core.STREAM_HASH,
            "newLiveNativeRegistration": False, "projectionWholeFieldRequiresOriginalSupport": True,
            "actualShiftedMeanPressureRecomputed": False, "finalJets": 0, "release": "HOLD",
        }
    args.out.mkdir(parents=True, exist_ok=True)
    for name, data in (
        ("offline-append.jsonl", suffix), ("offline-definitions.json", definitions),
        ("harmonic-terms.json", evidence), ("offline-report.json", core.dump(report)),
    ):
        (args.out / name).write_bytes(data)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
