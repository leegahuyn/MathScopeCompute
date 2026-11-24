"""Reconstruct the Repeat Forced gauge on pinned original chart dispatch."""
import argparse
from collections import Counter
from fractions import Fraction
from hashlib import sha256
import gzip
import json
from pathlib import Path

PINS = {
    "active-n3-repeat-forced-candidate.json": "b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e",
    "active-repeat-indexed-append.jsonl": "622c11be9a484374a504bda29ec9d1216a4641c130333305b339de506b7fbcaa",
    "active-repeat-indexed-definitions.json": "9ea1a0768973c3f57761d7131291000743a0d7a1dc82b46b3fa7fa11da9af6be",
    "first-correction-spatial-ingress.json": "51ea8406017b3276744e6e36cb67aa24770e60b97fa81b672f94238597067b60",
    "active-n3-repeat-forced-source/original-source-functions.json": "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce",
}
PREFIX_SHA = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
REQUEST_SHA = "93e87aaf51e5c2a9cd87d04e32af3d281c081446a7e42fd3d4bce448ee335c0c"
BASE = 22380596
LEVEL = 21435320
CARRIER = 17732747
OUTER = [[17735160,17735192,120836], [17735266,17735192,120836],
         [17735231,17735192,120836], [17735196,17735192,120836],
         [17732770,3617,28826]]
Q = 17732740
A = 23
ZERO, NEG = 0, 20


def load(root, name):
    content = (root / name).read_bytes()
    assert sha256(content).hexdigest() == PINS[name], name
    return content


def dump(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def node(op, args):
    return {"op": op, "args": args}


class Graph:
    def __init__(self, records, append):
        self.records = records
        self.base = BASE + len(append)
        self.append = []
        self.seen = {}
        self.records.update(enumerate(append, BASE))

    def add(self, op, *args):
        if op in {"add", "multiply"} and len(args) > 2:
            return self.add(op, self.add(op, *args[:-1]), args[-1])
        item = node(op, list(args))
        key = json.dumps(item, separators=(",", ":"))
        if key not in self.seen:
            i = self.base + len(self.append)
            self.append.append(item)
            self.seen[key] = i
            self.records[i] = item
        return self.seen[key]

    def choose(self, root):
        record = self.records[root]
        assert record["op"] == "smooth_piecewise"
        return record["args"]

    def zero_guard(self, root, guards):
        a, b, c, before, inside, after = self.choose(root)
        assert [a, b, c] == guards and before == after == ZERO
        return inside

    def q(self, n, d=1):
        return self.add("rational", str(n), str(d))


def collect_prefix(path, wanted):
    digest = sha256()
    records = {}
    ordered = sorted(wanted)
    index = cursor = 0
    leftover = b""
    with gzip.open(path, "rb") as stream:
        header = next(stream)
        assert json.loads(header) == {"schema":"MathScope.M3.FullNodesJSONL/1","node_count":BASE}
        digest.update(header)
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
            lines = (leftover + block).split(b"\n")
            leftover = lines.pop()
            while cursor < len(ordered) and ordered[cursor] < index + len(lines):
                identity = ordered[cursor]
                records[identity] = json.loads(lines[identity - index])
                cursor += 1
            index += len(lines)
    assert not leftover and index == BASE and digest.hexdigest() == PREFIX_SHA
    assert wanted <= set(records)
    return records


def attest_gauge(graph, expressions, chart, mode, component, coeff, formals):
    normalized = {}
    for part, raw_part, sign in [("real", "imaginary", -1), ("imaginary", "real", 1)]:
        item = coeff[part]
        assert item["sign"] == sign
        expected = f"ActualPostFiveRepeatCurl_{chart}_m{mode}_{raw_part}_{component}"
        definition = expressions[item["system"]]
        assert definition["name"] == expected and definition["body"] == item["rawBody"]
        assert definition["parameters"] == item["actualArguments"]
        assert set(item["actualArguments"]) <= formals
        ref = item["id"]
        assert graph.records[ref] == node("m3_coupled_expression_partial",
            [item["system"], item["actualArguments"], [0] * len(item["actualArguments"])])
        normalized[part] = graph.add("multiply", NEG, ref) if sign < 0 else ref
    return normalized


def harmonics(graph, archive, expressions, formals):
    systems = {(row["key"], row["m"]): row for row in archive["systems"]}
    assert len(systems) == len(archive["systems"]) == 40
    assert graph.records[CARRIER] == node("ceiling", [17732746])
    assert graph.records[17732746] == node("inverse", [17732745])
    assert graph.records[17732745] == node("sqrt_positive", [17732744])
    result = {}
    bindings = []
    for chart in archive["templates"]:
        key, phase = chart["key"], chart["phase"]
        assert key == f'{chart["difference"]}:{chart["sign"]}'
        terms = [[], [], []]
        for mode in range(1, 5):
            sys = systems[key, mode]
            angle = graph.add("multiply", graph.q(mode), CARRIER, phase)
            cosine = graph.add("cosine", angle)
            sine = graph.add("sine", angle)
            assert len(sys["mappedPotentialCoefficients"]) == 3
            for j, raw in enumerate(sys["mappedPotentialCoefficients"]):
                z = attest_gauge(graph, expressions, key, mode, j, raw, formals)
                real = graph.add("multiply", z["real"], cosine)
                imaginary = graph.add("multiply", NEG, z["imaginary"], sine)
                terms[j].append(graph.add("multiply", graph.q(2), graph.add("add", real, imaginary)))
                bindings.append({"chart":key, "mode":mode, "phase":phase, "component":j, **z})
        result[key] = [graph.add("add", *row) for row in terms]
    assert len(bindings) == 120
    return result, bindings


def transplant(graph, root, sign, component, reconstructed):
    for triple in OUTER:
        root = graph.zero_guard(root, triple)
    guards = []
    for difference in range(5):
        level, lower, upper, before, inside, after = graph.choose(root)
        assert level == LEVEL and before == after
        for endpoint, numerator in [(lower, 2*difference-1), (upper, 2*difference+1)]:
            rational = graph.records[endpoint]
            assert rational["op"] == "rational"
            assert Fraction(*map(int, rational["args"])) == Fraction(numerator, 2)
        xi = graph.choose(inside)[:3]
        pulse_root = graph.zero_guard(inside, xi)
        pulse = graph.choose(pulse_root)[:3]
        graph.zero_guard(pulse_root, pulse)
        body = reconstructed[f"{difference}:{sign}"][component]
        body = graph.add("smooth_piecewise", *pulse, ZERO, body, ZERO)
        body = graph.add("smooth_piecewise", *xi, ZERO, body, ZERO)
        guards.append((lower, upper, body))
        root = before
    assert root == ZERO
    for lower, upper, body in reversed(guards):
        root = graph.add("smooth_piecewise", LEVEL, lower, upper, root, body, root)
    for triple in reversed(OUTER):
        root = graph.add("smooth_piecewise", *triple, ZERO, root, ZERO)
    return root


def gauges(graph, raw_registry, attached, wave, waves):
    assert len(attached["expressions"]) == 16 and len(attached["fields"]) == 4
    by_id = {row["id"]: row for row in attached["expressions"]}
    by_name = {row["name"]: row for row in attached["expressions"]}
    old = attached["fields"][-1]
    assert old["id"] == "coupled-field:32" and len(old["rows"]) == 162
    pressure_root = 22382359
    assert graph.records[pressure_root] == node("m3_coupled_indexed_partial",
        [old["id"], old["parameters"], [0] * len(old["directions"])])
    def dispatch(field):
        return [{k:row[k] for k in ("values", "derivativeMaps", "coefficient", "guards", "label")}
                for row in field["rows"]]
    for other in attached["fields"][:-1]:
        assert dispatch(other) == dispatch(old)
    exprs, fields, roots = [], [], []
    def expr(old_expr, name, body):
        identity = f'coupled-expression:{len(raw_registry[0])+len(attached["expressions"])+len(exprs)}'
        value = {**old_expr, "id":identity, "name":name, "body":body}
        assert value["sourceAuthenticated"] is False
        exprs.append(value)
        return value
    for component in range(3):
        name = f"ActualPostFiveRepeatIncrementGauge_{component}"
        per_sign = {}
        for n, sign in enumerate((1, -1)):
            proto_own = by_name[f'{old["name"]}_own_{n}']
            proto_ref = by_name[f'{old["name"]}_reference_{n}']
            assert by_id[proto_ref["id"]] == proto_ref
            old_product = graph.records[proto_ref["body"]]
            assert old_product["op"] == "multiply"
            (ref,) = [idx for idx in old_product["args"]
                      if graph.records[idx]["op"] == "m3_coupled_expression_partial"]
            system, args, orders = graph.records[ref]["args"]
            assert system == proto_own["id"] and not any(orders)
            assert args == wave["referenceArguments"]
            assert wave["A"] == A and wave["Q"] == Q
            own = expr(proto_own, f"{name}_own_{n}",
                       transplant(graph, proto_own["body"], sign, component, waves))
            application = graph.add("m3_coupled_expression_partial", own["id"], args, orders)
            per_sign[sign] = expr(proto_ref, f"{name}_reference_{n}",
                                  graph.add("multiply", wave["potentialScale"], application))
        identity = f'coupled-field:{len(raw_registry[1])+len(attached["fields"])+len(fields)}'
        rows = [{**row, "localSystem":per_sign[row["label"]["sign"]]["id"],
                 "localBody":per_sign[row["label"]["sign"]]["body"]} for row in old["rows"]]
        field = {**old, "id":identity, "name":name, "rows":rows}
        assert dispatch(field) == dispatch(old)
        fields.append(field)
        roots.append(graph.add("m3_coupled_indexed_partial", identity,
                               field["parameters"], [0]*len(field["directions"])))
    return exprs, fields, roots, pressure_root


def make_dispatch(request, gauge, pressure, fields):
    directions = fields[0]["directions"]
    assert directions == [17732748,17732749,17732750,17745430,17745431,17732752]
    assert request["coordinates"]["A_and_p"] == ["x","y","z","tau"]
    assert request["coordinates"]["b_and_C"] == ["s","z","tau"]
    labels = request["requested_field_jets"]
    assert len(labels) == len(set(labels)) == 67
    assert Counter(k.split("@")[0] for k in labels) == {"A0":19,"A1":19,"A2":19,"p":4,"b":6}
    root_map = {"A0":"cos(theta)*Ar-sin(theta)*Atheta",
                "A1":"sin(theta)*Ar+cos(theta)*Atheta", "A2":"Az", "p":"p"}
    rows = []
    for label in labels:
        field, suffix = label.split("@")
        alpha = list(map(int, suffix.split(",")))
        if field == "b":
            rows.append({"label":label, "status":"OPEN_EXACT_DIRECT_SWIRL_OWNER"})
            continue
        assert len(alpha) == 4
        exponent = Fraction(1,2) if field != "p" else Fraction(0)
        exponent -= Fraction(sum(alpha[:3]), 2) + alpha[3]
        rows.append({"label":label, "chartBase":root_map[field],
                     "normalizedOperatorOrder":[op for op, n in zip(("Dx","Dy","Dz","Dtau"), alpha)
                                                for _ in range(n)],
                     "QExponent":{"constant":str(exponent), "multipleOfA":-1 if field != "p" else -2},
                     "status":"CONDITIONAL_REPEAT_FORCED_TERM_ONLY"})
    assert len([row for row in rows if "normalizedOperatorOrder" in row]) == 61
    return {"chartRoots":{"Ar":gauge[0], "Atheta":gauge[1], "Az":gauge[2], "p":pressure},
            "physicalScaleRoot":Q, "AExponentRoot":A, "epsilonRoot":17732744,
            "nativeDirections":dict(zip(("R","Z","T","Y0","Y1","theta"),directions)),
            "operators":{"Dr":"dR+a*(vr[0]*dY0+vr[1]*dY1)",
                         "Dx":"cos(theta)*Dr-sin(theta)/R*dtheta",
                         "Dy":"sin(theta)*Dr+cos(theta)/R*dtheta",
                         "Dz":"epsilon*dZ",
                         "Dtau":"dT-(ci/epsilon)*(vt[0]*dY0+vt[1]*dY1)"},
            "geometryOwner":"Original full physical common-torus geometry with the reference cell fixed",
            "operatorSemantics":"Apply listed operators successively to the full chart expression, using product and chain rules from the second application onward. Coefficients are inside subsequent differentiation.",
            "scope":"R>0 smooth fixed-label region for the Repeat Forced contribution. Actual closed-cell admissibility, seam and axis extension, native derivative enclosures, canonical completed field and frozen stage-cutoff derivatives are open.",
            "finalJetsVerified":0, "rows":rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact", type=Path)
    parser.add_argument("request", type=Path)
    parser.add_argument("output", type=Path)
    opts = parser.parse_args()
    art = opts.artifact
    candidate = json.loads(load(art, "active-n3-repeat-forced-candidate.json"))
    assert candidate["postRepeatNodeCount"] == BASE
    attached = json.loads(load(art, "active-repeat-indexed-definitions.json"))
    append = [json.loads(row) for row in load(art, "active-repeat-indexed-append.jsonl").splitlines()]
    wave = json.loads(load(art, "first-correction-spatial-ingress.json"))["wave"]
    registry_path = "active-n3-repeat-forced-source/original-source-functions.json"
    registry = json.loads(json.loads(load(art, registry_path))["definitions"])
    expressions = {row["id"]: row for row in registry[0]}
    request = opts.request.read_bytes()
    assert sha256(request).hexdigest() == REQUEST_SHA
    params = set(attached["expressions"][0]["parameters"])
    selected = {0,19,20,23,50,604,656,29003,2127265,17732744,17732745,17732746,CARRIER,
                21728204,wave["potentialScale"], *wave["referenceArguments"], Q}
    for row in candidate["systems"]:
        for component in row["mappedPotentialCoefficients"]:
            for key in ("real","imaginary"):
                identity = component[key]["id"]
                selected.update(range(identity-16, identity+1))
    selected.update(row["phase"] for row in candidate["templates"])
    root = art / "active-n3-repeat-forced-source/original-source-nodes.jsonl.gz"
    graph = Graph(collect_prefix(root, selected), append)
    assert graph.records[wave["potentialScale"]]["op"] == "exp"
    assert graph.records[NEG] == node("rational", ["-1","1"])
    assert graph.base == 22382360
    scalar, binding = harmonics(graph, candidate, expressions, params)
    defs, fields, gauge, pressure = gauges(graph, registry, attached, wave, scalar)
    dispatch = make_dispatch(json.loads(request), gauge, pressure, fields)
    out = opts.output
    out.mkdir(parents=True, exist_ok=True)
    with (out/"repeat-gauge-append.jsonl").open("w", encoding="utf-8", newline="\n") as stream:
        for record in graph.append:
            stream.write(json.dumps(record, separators=(",", ":"))+"\n")
    dump(out/"repeat-gauge-definitions.json", {"expressions":defs,"fields":fields})
    dump(out/"repeat-jet-dispatch.json", dispatch)
    dump(out/"repeat-gauge-receipt.json",
         {"prefixSHA256":PREFIX_SHA, "inputPins":PINS, "expectedAppendStart":graph.base,
          "appendNodes":len(graph.append), "end":graph.base+len(graph.append),
          "chartModePairs":40, "signedCoefficientBindings":binding,
          "gaugeRoots":gauge, "pressureRoot":pressure, "rowsPerField":162,
          "firstGaugeExactReferenceScale":wave["potentialScale"],
          "originalNativeRegistryMutated":False, "nativeRegistrationRun":False,
          "closedCellEnclosures":False, "finalJetsVerified":0})
    print("Verified 240 pinned gauge coefficient applications, 3 x 162 dispatch rows, "
          f"{len(graph.append)} append nodes and 61 conditional original-label operators.")


if __name__ == "__main__":
    main()
