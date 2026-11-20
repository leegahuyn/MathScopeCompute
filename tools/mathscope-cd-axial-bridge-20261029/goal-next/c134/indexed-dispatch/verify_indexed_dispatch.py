"""Match the live Repeat modes to the protected fixed-label indexed layout."""

import argparse
from collections import defaultdict
from fractions import Fraction
import gzip
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


def read_pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw


def hash_stream(path):
    with path.open("rb") as data:
        result = sha256()
        for block in iter(lambda: data.read(1 << 20), b""):
            result.update(block)
        return result.hexdigest()


def coefficient_row(state):
    return [*state["velocity"], state["pressure"]]


def row_map(row):
    return {key: row[key] for key in ("values", "guards", "label", "coefficient", "derivativeMaps")}


def verify(a):
    exported = a.artifact / "active-n3-repeat-forced-source"
    paths = {
        "candidate": (a.artifact / "active-n3-repeat-forced-candidate.json",
                      "b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e"),
        "registry": (exported / "original-source-functions.json",
                     "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"),
        "manifest": (exported / "original-source-export-manifest.json",
                     "04351d6619a0d782ac108f231efc67ffbd35c2f88e7951f2b1b14445a8ca59a2"),
        "readback": (a.readback, "49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4"),
    }
    data = {name: json.loads(read_pinned(*pin)) for name, pin in paths.items()}
    graph = exported / "original-source-nodes.jsonl.gz"
    graph_pin = "225df16f70bdd0770768a92074d6c5f9dd9430f8040709c1dfbbdf3b6adefbc9"
    assert hash_stream(graph) == graph_pin
    candidate, manifest, full = (data[k] for k in ("candidate", "manifest", "readback"))
    assert full["status"] == "VERIFIED_ACTUAL_ACTIVE_N3_REPEAT_APPEND_AND_GUARD_INTERIOR_STAGE_TWO_OPEN"
    assert full["stream"]["sha256"] == manifest["node_stream_sha256"]
    assert full["stream"]["nodes"] == manifest["node_count"] == 22380596
    assert full["manifestSHA256"] == paths["manifest"][1]
    assert full["candidateSHA256"] == paths["candidate"][1]
    assert full["registrySHA256"] == paths["registry"][1]
    native = json.loads(data["registry"]["definitions"])
    source_pins = {
        "source-global-forced-current.mjs": "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
        "source-global-pressure.mjs": "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
        "source-harmonic-assembly.mjs": "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
    }
    forced, pressure, harmonic = [read_pinned(a.original / name, digest).decode()
                                   for name, digest in source_pins.items()]
    for snippet in ("G.choose(levelDifference,G.q(2*j-1,2),G.q(2*j+1,2),out,values[j],out)",
                    "G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T)",
                    "kind==='velocity'?A:kind==='residual'?G.add(G.mul(G.q(2),A),G.q(1,2)):G.mul(G.q(2),A)",
                    "referenceBody=G.mul(power(ratio,exponent),G.expressionValue(ownSystem,referenceValues))",
                    "const b=pressure.cover.bands[row.relativeBand+1]",
                    "localSystem:systems[sign.sourceLocalRow].system"):
        assert snippet in forced, snippet
    for snippet in ("baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)",
                    "delta=G.sub(i,baseIndex),matrix=exactCommonTorusMatrix(G,delta)",
                    "integerRange:{minimum:0,maximum:4",
                    "allCrossLabelProductsVanish"):
        assert snippet in pressure, snippet
    for snippet in ("G.mul(input.k,G.q(m),input.phase)",
                    "G.sub(G.mul(x.real,G.cosine(argument)),G.mul(x.imaginary,G.sine(argument)))"):
        assert snippet in harmonic, snippet
    ksigns = (1, -1)
    expected = {f"{d}:{s}" for d, s in product(range(5), ksigns)}
    tmap = {row["key"]: row for row in candidate["templates"]}
    assert len(tmap) == len(candidate["templates"]) == 10 and set(tmap) == expected
    assert all(key == f'{row["difference"]}:{row["sign"]}' for key, row in tmap.items())
    inverse = {(row["key"], row["m"]): row for row in candidate["systems"]}
    assert len(inverse) == len(candidate["systems"]) == 40
    assert set(inverse) == set(product(expected, range(1, 5)))
    native_inverses = {row["id"]: row for row in native[3]}
    need = set()
    own = {}
    for key in sorted(tmap):
        entry = tmap[key]
        phase = entry["phase"]
        need.add(phase)
        modes = []
        for m in range(1, 5):
            row = inverse[key, m]
            sid = row["system"]
            assert 20 <= sid < 60
            bound = native_inverses[sid]
            assert bound["name"] == f"ActualPostFiveRepeatForced_{key}_m{m}"
            assert bound["directions"] == [17732748, 17732749, 17732750, 17745430, 17745431]
            assert row["positive"]["m"] == m and row["negative"]["m"] == -m
            pos, neg = map(coefficient_row, (row["positive"], row["negative"]))
            for positive, negative in zip(pos, neg):
                assert positive["real"] == negative["real"]
                assert positive["imaginary"] != negative["imaginary"]
                need.update((positive["real"], positive["imaginary"], negative["imaginary"]))
            modes.append({"m": m, "inverse": sid, "positiveCoefficients": pos,
                          "negativeImaginary": [coefficient["imaginary"] for coefficient in neg]})
        own[key] = {"difference": entry["difference"], "sign": entry["sign"], "phase": phase, "modes": modes}
    assert {m["inverse"] for t in own.values() for m in t["modes"]} == set(range(20, 60))
    ids = [f"coupled-field:{i}" for i in (*range(9, 13), *range(16, 20))]
    assert [f["field"] for f in candidate["fields"]] == ids
    registered = {f["id"]: f for f in native[1]}
    assert len(registered) == 29
    baseline_field = registered[ids[0]]
    baseline = [row_map(row) for row in baseline_field["rows"]]
    assert all([row_map(row) for row in registered[f]["rows"]] == baseline for f in ids)
    expected_parameters = [17732748, 17732749, 17732750, 17732737, 17745430, 17745431, 17732752]
    assert baseline_field["parameters"] == expected_parameters
    assert baseline_field["directions"] == [v for i, v in enumerate(expected_parameters) if i != 3]
    obs = defaultdict(set)
    delta_by_band = defaultdict(set)
    row_plans = []
    for row_index, row in enumerate(baseline):
        operands, label, guards = row["values"], row["label"], row["guards"]
        s = label["sign"]
        assert s in ksigns and s not in obs[label["key"]] and label["countBoxOnce"]
        obs[label["key"]].add(s)
        relative, *mesh = map(int, label["key"].split(":"))
        assert relative in (-1, 0, 1) and len(mesh) == 3 and all(m in (-1, 0, 1) for m in mesh)
        delta = label["fixedDifference"]
        assert 0 < delta < 22155584
        need.add(delta)
        delta_by_band[relative].add(delta)
        assert operands[:10] == [*expected_parameters[:3], label["ell"], *label["grid"],
                                  *expected_parameters[3:6]]
        assert operands[14:] == [expected_parameters[6], delta]
        assert row["coefficient"] == 1 and len(guards) == 5 and guards[0] == [17732770, 3617, 28826]
        assert row["derivativeMaps"] == [[{"parameter": v, "coefficient": 1}] for v in (0, 1, 2, 8, 9, 14)]
        choices = [f"{d}:{s}" for d in range(5)]
        assert all(own[key]["sign"] == s for key in choices)
        row_plans.append({"row": row_index, "box": label["key"], "sign": s,
                          "selectorRoot": delta, "fixedArguments": operands,
                          "registeredOuterGuards": guards, "choicesByIntegerDelta": choices})
    assert len(row_plans) == 162 and len(obs) == 81
    assert all(s == set(ksigns) for s in obs.values())
    assert all(len(roots) == 1 for roots in delta_by_band.values())
    assert len(set.union(*delta_by_band.values())) == 3
    nodes = {}
    with gzip.open(graph, "rb") as data_stream:
        assert json.loads(data_stream.readline())["node_count"] == manifest["node_count"]
        for ind, line in enumerate(data_stream):
            if ind in need:
                nodes[ind] = json.loads(line)
                if len(nodes) == len(need):
                    break
    assert set(nodes) == need
    for root in set.union(*delta_by_band.values()):
        assert nodes[root]["op"] == "add", nodes[root]
    for entry in own.values():
        for mode in entry["modes"]:
            for positive, negative in zip(mode["positiveCoefficients"], mode["negativeImaginary"]):
                node = nodes[negative]
                assert node["op"] == "multiply" and set(node["args"]) == {20, positive["imaginary"]}, node
    def selector(value):
        picked = [d for d in range(5) if Fraction(2*d-1, 2) < value < Fraction(2*d+1, 2)]
        assert len(picked) <= 1
        return picked[0] if picked else None
    assert [selector(Fraction(d)) for d in range(5)] == list(range(5))
    assert selector(Fraction(-1)) is None and selector(Fraction(5)) is None
    assert all(selector(Fraction(2*d+1, 2)) is None for d in range(-1, 5))
    return {
        "status": "VERIFIED_REPEAT_MODE_TO_PROTECTED_DISPATCH_LAYOUT_ONLY",
        "inputs": {**{k: pin[1] for k, pin in paths.items()}, "compressedGraph": graph_pin, **source_pins},
        "registryBeforeAndAfter": 29, "liveRepeatIndexedFields": 0,
        "protectedLayoutFields": ids, "boxes": 81, "signRows": len(row_plans),
        "proposedAngularIncrementOutputs": ["u_r", "u_theta", "u_z", "p"],
        "proposedRowInstallations": 4*len(row_plans), "modeInverseSystems": len(inverse),
        "conjugateScalarRows": len(inverse)*4,
        "symbolicPaletteRootsByRelativeBand": {str(b): sorted(r)[0] for b, r in delta_by_band.items()},
        "selectedTemplate": "actual sign and delta=i(ell_own)-i(ell_ref-2), never relativeBand",
        "reconstruction": "sum m=1..4 of 2*(real*cos(k*m*phase)-imag*sin(k*m*phase))",
        "referenceToOwn": ["sqrt(b)*R", "b^D*Z", "b*T"],
        "normalizedOwnIncrementToReference": {"velocity": "b^A", "pressure": "b^(2*A)"},
        "strictGuardPolicy": "candidate dispatch interior only; endpoint glue and derivatives are separate",
        "branches": own, "rows": row_plans,
        "open": ["materialize new native indexed fields", "fixed-label smoothness and all-domain admission",
                 "whole actual K2 state, conservative residual, energy and final independent refinements"],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ("artifact", "readback", "original", "out"):
        parser.add_argument(f"--{option}", required=True, type=Path)
    args = parser.parse_args()
    result = verify(args)
    args.out.write_bytes((json.dumps(result, sort_keys=True, indent=2) + "\n").encode())
    print(f'{result["status"]}: {result["signRows"]} existing rows, {result["modeInverseSystems"]} modes, '
          f'{result["conjugateScalarRows"]} exact scalar conjugates, no new indexed fields')
