"""Read the active N3 first harmonic from the genuine mode-two export."""

from argparse import ArgumentParser
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


WITNESS = "246a425524981185734cd741a2ef9eb3ed297adf6f3dcbcd83db2abfd68f718a"
ACTIVE_CHECKER = "6ecffe610f01b2f4a60922efc644d50bf2203619b98379e968ad7280c827b4f1"
PARTS = ("real", "imaginary")


def need(condition, message):
    if not condition:
        raise ValueError(message)


def load_active(path):
    need(sha256(path.read_bytes()).hexdigest() == ACTIVE_CHECKER, "active checker bytes")
    spec = importlib.util.spec_from_file_location("active_mode_two", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def exact_node(graph, ids, op, args, message):
    matches = [i for i in ids if graph.node(i) == (op, args)]
    need(len(matches) == 1, f"{message}: {matches}")
    return matches[0]


def recover_pressure(graph, a, mode_two, formal, output, end):
    n = list(map(a.of, mode_two["normal"]["value"]))
    nprime = list(map(a.of, mode_two["normal"]["derivative"]))
    K = [[a.of(i) for i in row] for row in mode_two["K"]]
    nr = [a.sub(a.dot(n, [K[i][j] for i in range(3)]), nprime[j]) for j in range(3)]
    scale = a.inv(a.mul(a.of(mode_two["k"]), a.dot(n, n)))
    expected = {}
    for out_part, source_part, sign in (("real", "imaginary", -1), ("imaginary", "real", 1)):
        expected[out_part] = a.mul(
            a.scalar(sign), scale, a.add(a.dot(nr, [a.of(z[source_part]) for z in output]),
                                        a.dot(n, [a.of(z[source_part]) for z in formal])),
        )
    results = {}
    for root in range(max(x for pair in output for x in pair.values()) + 1, end):
        if graph.node(root)[0] not in {"add", "multiply"}:
            continue
        expression = a.of(root)
        for part, want in expected.items():
            if part not in results and expression == want:
                results[part] = root
        if set(results) == set(PARTS):
            break
    need(set(results) == set(PARTS), "both native mode-one pressure roots")
    return results


def bind_mode_one(old, active, graph, registry, cover, two, boundary):
    a = old.Exact(graph)
    key = two["key"]
    delta, sign = map(int, key.split(":"))
    mode_one, = [s for s in registry.pulses if s["name"] == f"ActualOriginalForced_{key}_m1"]
    mode_two = registry.pulses[two["system"]]
    need(mode_one["variable"] == mode_two["variable"] == two["path"]["w"], "same native pulse variable")
    need(mode_one["directions"] == mode_two["directions"] and mode_one["length"] == mode_two["length"] == two["length"],
         "same native pulse directions and length")
    need(mode_one["left"] == 0 and mode_one["initial"] == [old.ZERO] * 3
         and mode_one["finitePartialSumIsExactSolution"] is False, "mode-one zero-data Volterra system")
    path_map = old.bind_path(graph, a, two["path"], mode_one, key)
    end = min(c["mapped"] for c in two["components"])
    indices = range(mode_one["variable"], end)
    nodes_by_expression = {}
    for i in indices:
        op, args = graph.node(i)
        if op == "m3_coupled_expression_partial" and not any(args[2]):
            nodes_by_expression.setdefault(args[0], []).append(i)
    by_name = {d["name"]: d for d in registry.expressions
               if d["name"].startswith(("ActualWholeNonzeroSource_", "OriginalPrimaryPrincipalFlat_"))}
    components = []
    formal = [{} for _ in range(3)]
    params = [mode_one["variable"], *mode_one["parameters"]]
    carrier = a.mul(a.of(two["k"]), a.of(two["phase"]))
    native_sources = {part: graph.reach(z[part] for z in mode_one["forcing"]) for part in PARTS}
    for j in range(3):
        own = registry.names[f"ActualInitializedAngularOwnLabel_0_{j}"]
        application = cover["application"][j]
        need(own["id"] == application["ownSystem"], "same physically verified central own-label body")
        body = old.own_case(graph, own, delta, two["path"]["pulse"], two["length"])
        terms = list(old.harmonic_terms(graph, body))
        for part, trig, trig_sign in (("real", "cosine", 1), ("imaginary", "sine", -1)):
            raw, = [root for kind, angle, root, sign_factor in terms
                    if kind == trig and sign_factor == trig_sign and a.of(angle) == carrier]
            original = by_name[f"ActualWholeNonzeroSource_{key}_1_{j}_{part}"]
            supported = original["body"]
            need(raw < boundary and supported < boundary, "whole original inputs precede native inverse")
            primary = 0
            if part == "real":
                primary_definition = by_name[f"OriginalPrimaryPrincipalFlat_{delta}_{sign}_{j}"]
                primary = exact_node(
                    graph, graph.reach([supported]), "m3_coupled_expression_partial",
                    [primary_definition["id"], primary_definition["parameters"],
                     [0] * len(primary_definition["parameters"])], "original principal cutoff call",
                )
            need(old.additive(graph, supported) == a.sub(old.additive(graph, raw), old.additive(graph, primary)),
                 f"{key} {j}.{part} whole raw minus primary")
            actuals = [path_map.get(i, i) for i in original["parameters"]]
            mapped = exact_node(graph, nodes_by_expression[original["id"]], "m3_coupled_expression_partial",
                                [original["id"], actuals, [0] * len(actuals)], "source H_w substitution")
            wrapped, = [d for d in registry.expressions if d["name"] == f"CoupledForced_source_{j}_{part}"
                        and d["parameters"] == params and d["body"] == mapped]
            root = exact_node(graph, nodes_by_expression[wrapped["id"]], "m3_coupled_expression_partial",
                              [wrapped["id"], params, [0] * len(params)], "source wrapper and native parameters")
            need(root in native_sources[part], "entire mapped original source enters the projected inverse")
            formal[j][part] = root
            component = {"j": j, "part": part, "raw": raw, "primary": primary, "supported": supported,
                         "sourceDefinition": original["id"], "mapped": mapped, "formalPathSource": root}
            component["primaryCutoff"] = old.primary_operand(graph, registry, dict(two, m=1), component)
            components.append(component)
    outputs = [
        {part: exact_node(graph, indices, "m3_forced_pulse_partial",
                          [mode_one["id"], part, j, mode_one["variable"], mode_one["parameters"],
                           [0] * len(mode_one["directions"])], "native mode-one velocity") for part in PARTS}
        for j in range(3)
    ]
    pressure = recover_pressure(graph, a, two, formal, outputs, end)
    row = dict(two, m=1, output=outputs, pressure=pressure, projectedSource=mode_one["forcing"])
    forcing = old.bind_inverse(graph, a, row, mode_one, formal)
    wrong = [z.copy() for z in formal]
    wrong[0]["real"], wrong[1]["real"] = wrong[1]["real"], wrong[0]["real"]
    try:
        old.bind_inverse(graph, a, row, mode_one, wrong)
    except ValueError as exc:
        need("-P f component" in str(exc), f"wrong negative control rejection: {exc}")
    else:
        raise ValueError("swapped mode-one input accepted")
    old.Exact.of.cache_clear()
    old.additive.cache_clear()
    graph.node.cache_clear()
    return {"key": key, "system": mode_one["id"], "modeTwoSystem": mode_two["id"], "components": components,
            "projectedSource": forcing, "nativeVelocity": outputs, "nativePressure": pressure,
            "nativeMatrix": mode_one["matrix"], "swappedSourceRejected": True}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("bundle", "active-checker", "legacy-checker", "support", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    active = load_active(args.active_checker)
    old = active.previous_checker(args.legacy_checker)
    support = json.loads(active.pinned(args.support, active.SUPPORT))
    raw = json.loads(active.pinned(args.bundle / "original-active-mode-two-witness.json", WITNESS))
    manifest = raw["snapshot"]
    registry = old.Registry(args.bundle / "original-source-functions.json", manifest)
    with TemporaryFile() as backing:
        graph, edges = active.read_graph(old, args.bundle / "original-source-nodes.jsonl.gz", backing, manifest)
        cover = active.verify_cover(old, graph, raw, support)
        need([r["key"] for r in raw["rows"]] == ["0:1", "1:1"], "selected original positive keys")
        rows = [bind_mode_one(old, active, graph, registry, cover, two, raw["initializedNodeCount"])
                for two in raw["rows"]]
    receipt = {"status": "VERIFIED_ACTIVE_N3_MODE_ONE_SOURCE_AND_NATIVE_INVERSE_OPERANDS",
               "inputSHA256": WITNESS, "nodeCount": manifest["node_count"], "typedEdges": edges,
               "rows": rows, "wholeCoverSeal": False, "modeOneDerivativeClass": "OPEN",
               "numericalJetIntervals": "0/67", "release": "HOLD"}
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        output.write(json.dumps(receipt, indent=2) + "\n")
    print(receipt["status"], receipt["nodeCount"], receipt["typedEdges"])


if __name__ == "__main__":
    main()
