"""Bind every original fixed Forced path and its actual mean-source arguments."""

from argparse import ArgumentParser
from collections import Counter
import gzip
from hashlib import sha256
import json
from pathlib import Path


STREAM = "1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3"
REGISTRY = "bec2f66a8ed9fa4c7c9c8dc137e1b69fca234192d92fa841a724b5db23e2b50a"
FIRST = "e0e466e8bdf8d65f06e82da38631ad5f4c5c7f12f3d073ac1bbe104a0ddf4b38"
SUPPORTED = "14cee96f2b9f0d47114041c9dd2989da0cc7a4012521f350a5961248a3a352a5"
COUNT = 4197115


def pinned(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return json.loads(raw)


def read_graph(path, rows):
    slow = {622802: 1, 622803: 2, 622804: 4}
    w_slots = {row["path"]["w"] for row in rows}
    flags = bytearray(COUNT)
    retained = {}
    reference = set(range(3675253, 3675285))
    constants = {1, 20, 22, 127, 281, 3622, 300172, 622751, 622767,
                 622791, 623025, 623026, 623067, 624017, 635044, 635045}
    selected = reference | constants | w_slots
    for row in rows:
        path_record = row["path"]
        for root in (*path_record["Hw"], path_record["pulse"]):
            selected.update(range(root - 22, root + 12))
        for component in row["components"]:
            selected.update((component["mapped"], component["formalPathSource"]))
    source = sha256()
    with gzip.open(path, "rb") as stream:
        header = stream.readline()
        source.update(header)
        assert json.loads(header)["node_count"] == COUNT
        for i, raw in enumerate(stream):
            source.update(raw)
            node = json.loads(raw)
            op, args = node["op"], node["args"]
            if i in selected:
                retained[i] = (op, args)
            if op == "coordinate":
                flags[i] = slow.get(i, 0) | (8 if i in w_slots else 0)
            elif op in {"rational", "source_parameter"}:
                continue
            elif op in {"multiply", "add", "inverse", "log_positive", "exp",
                        "sqrt_positive", "integer_power", "ceiling"}:
                dependencies = args[:1] if op == "integer_power" else args
                for child in dependencies:
                    assert 0 <= child < i, (i, child)
                    flags[i] |= flags[child]
            else:
                flags[i] = 16
    assert i + 1 == COUNT and source.hexdigest() == STREAM
    return retained, flags


def verify(graph, first, supported):
    rows = pinned(first, FIRST)["rows"]
    pinned(supported, SUPPORTED)
    definitions = json.loads(pinned(graph / "original-source-functions.json", REGISTRY)["definitions"])[0]
    native = {row["id"]: row for row in definitions}
    nodes, flags = read_graph(graph / "original-source-nodes.jsonl.gz", rows)

    def expect(i, op, args):
        assert nodes[i] == (op, args), (i, nodes[i])

    def other(i, op, operand):
        actual, args = nodes[i]
        assert actual == op and len(args) == 2 and args.count(operand) == 1, (i, actual, args)
        return next(a for a in args if a != operand)

    def copies_of(i, atom):
        if i == atom:
            return 1
        op, args = nodes[i]
        if op == "integer_power":
            assert args[0] == atom and args[1] > 0
            return args[1]
        assert op == "multiply"
        return sum(copies_of(child, atom) for child in args)

    anchors = {
        3675259: ("multiply", [20, 3675253]),
        3675260: ("add", [622791, 3675259]),
        3675261: ("multiply", [127, 3675260]),
        3675262: ("exp", [3675261]),
        3675263: ("sqrt_positive", [3675262]),
        3675264: ("inverse", [3675263]),
        3675265: ("multiply", [622802, 3675264]),
        3675266: ("log_positive", [3675262]),
        3675267: ("multiply", [22, 3675266]),
        3675268: ("exp", [3675267]),
        3675269: ("inverse", [3675268]),
        3675270: ("multiply", [622803, 3675269]),
        3675271: ("inverse", [3675262]),
        3675272: ("multiply", [622804, 3675271]),
        3675277: ("multiply", [281, 3675266]),
        3675278: ("exp", [3675277]),
        623067: ("add", [20, 3622]),
        1: ("rational", ["1", "1"]),
        20: ("rational", ["-1", "1"]),
    }
    for i, (op, args) in anchors.items():
        expect(i, op, args)

    mean_actuals = [3675265, 3675270, 3675272, 3675253, 635044, 635045]
    for i in range(3):
        name = f"coupled-expression:{i}"
        app = 3675279 + 2 * i
        expect(app, "m3_coupled_expression_partial", [name, mean_actuals, [0] * 6])
        expect(app + 1, "multiply", [3675278, app])
        assert native[name]["body"] == 3675273 + i
        assert native[name]["parameters"] == [622802, 622803, 622804, 622791, 635044, 635045]

    seen = set()
    counts = Counter()
    path_receipts = []
    for row in rows:
        path = row["path"]
        y0, y1 = path["Y"]
        h0, h1 = path["Hw"]
        w, v, ci, Tg, d = (path[key] for key in ("w", "pulse", "ci", "Tg", "levelDifference"))
        vt0, vt1 = path["vt"]
        assert (y0, y1, vt0, vt1, ci, Tg) == (635044, 635045, 623067, 1, 623025, 300172)
        assert nodes[w][0] == "coordinate"
        assert flags[v] == 0 and flags[h0] == flags[h1] == 8
        advance = other(h1, "add", y1)
        assert other(other(h0, "add", y0), "multiply", vt0) == advance
        op, args = nodes[advance]
        assert op == "multiply"
        [difference] = [i for i in args if nodes[i][0] == "add"]
        minus_v = other(difference, "add", w)
        assert Counter(nodes[minus_v][1]) == Counter((20, v)) and nodes[minus_v][0] == "multiply"
        scale = other(advance, "multiply", difference)
        if d == 0:
            assert scale == ci
        else:
            inverse = other(scale, "multiply", ci)
            op, [denominator] = nodes[inverse]
            assert op == "inverse" and copies_of(denominator, Tg) == d
        assert flags[scale] == 0
        assert (row["key"], row["mode"]) not in seen
        seen.add((row["key"], row["mode"]))
        assert len(row["components"]) == 6
        for component in row["components"]:
            system, wrapper = component["system"], component["inverseWrapper"]
            assert native[system]["body"] == component["supported"]
            formals = native[system]["parameters"]
            assert formals == component["sourceFormals"]
            actual = [dict(zip((y0, y1), (h0, h1))).get(i, i) for i in formals]
            assert actual == component["sourceActuals"]
            expect(component["mapped"], "m3_coupled_expression_partial", [system, actual, [0] * len(actual)])
            assert native[wrapper]["body"] == component["mapped"]
            params = native[wrapper]["parameters"]
            expect(component["formalPathSource"], "m3_coupled_expression_partial", [wrapper, params, [0] * len(params)])
            counts[d] += 1
        path_receipts.append({"chart": row["key"], "mode": row["mode"], "difference": d,
                              "pulse": v, "w": w, "Hw": [h0, h1], "scale": scale})
    assert seen == {(f"{d}:{sign}", m) for d in range(5) for sign in (-1,1) for m in (1,2)}
    assert counts == Counter({d: 24 for d in range(5)})
    return {
        "status": "VERIFIED_OLDER_ACTUAL_PATH_AND_WRAPPERS",
        "graphNodes": COUNT, "sourceSHA256": STREAM, "registrySHA256": REGISTRY,
        "exactPathFormula": "Hw = Y + (ci/Tg^delta)*(w-v)*vt",
        "componentCount": sum(counts.values()), "paths": path_receipts,
        "fixedSlowCoordinates": ["R", "Z", "T"],
        "meanNativeRoots": [3675280, 3675282, 3675284],
        "meanReferenceArguments": mean_actuals,
        "scope": "Older original Forced graph. The source-scale formulas and actual native wrappers are exact for all paths. The weighted class and identity with the newer live join remain open.",
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("graph", "first", "supported", "out"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    result = verify(args.graph, args.first, args.supported)
    args.out.write_bytes((json.dumps(result, indent=2) + "\n").encode())
    print("PASS exact path scale, fixed coordinates and 120 actual wrappers for all five differences")


if __name__ == "__main__":
    main()
