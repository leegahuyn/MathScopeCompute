"""Bind active indexed charts and actual frozen representatives to source images."""
import argparse
import collections
from functools import lru_cache
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sys

if not __debug__:
    raise RuntimeError("Exact source checks require Python assertions.")

p = argparse.ArgumentParser()
for key in ("reached", "registry", "helper", "closure", "representative_guards", "source", "output"):
    p.add_argument(key, type=Path)
a = p.parse_args()


def read(path, digest):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == digest, path
    return raw


read(a.helper, "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758")
sys.path.insert(0, str(a.helper.parent))
from native_reference_scopes import actual_children, native_scope_checks

d = json.loads(read(a.reached, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"))
n, bodies = dict(d["nodes"]), dict(d["sourceBodies"])
r = json.loads(read(a.registry, "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"))
closure = json.loads(read(a.closure, "ffb665bd31b95354179440012e36d31fdf9a4c31870e99ca3de498a50174782f"))
guard_raw = read(a.representative_guards, "36f6f64edfb762d97bdac1c229e74c22fd45ed4b67e1437484b6bb2dbfd4cdb1")
guard = json.loads(guard_raw)
assert guard["status"] == "PASS_SELECTED_REPRESENTATIVE_ACTIVE_GUARDS"
assert all(guard["factsAtInverse"].values()) and guard["targetInverse"] == 4588852
gates = set(closure["physicalGates"] + closure["selectorGates"] + closure["pressureGates"])
assert len(gates) == 29
base = r["base"]
expr = json.loads(base["expression"])
global_fields = json.loads(base["m3GlobalFields"])
aux_fields = json.loads(r["fieldDefinitions"])
scope = native_scope_checks(d, {"base": r, "definitions": "[[],[],[],[],[]]"}, gates,
                            extra_reference_ids=(4587636, 4587637, 4587638, 4587641, 4587642, 4587643,
                                                 4587625, 4588772, 4588773, 4588774))


def expect(i, op, av):
    assert n[i] == {"op": op, "args": av}, (i, n[i])


R, Z, T, ell = 4587636, 4587637, 4587638, 4587625
mesh = [4588772, 4588773, 4588774]
representative = [4588867, 4588872, 4588852]
active = set(gates)
for i in sorted(n):
    if i in active or any(j in active for j in actual_children(n[i]) + bodies.get(i, [])):
        active.add(i)
row_counts = collections.Counter()
seen, ratios = set(), set()
field_rows = []
for i in sorted(active):
    node, av = n[i], n[i]["args"]
    if not any(j in active for j in bodies.get(i, [])):
        continue
    if node["op"] == "m3_global_indexed_partial":
        field, kind = global_fields[av[0]], "global"
    elif node["op"] == "m3_aux_indexed_partial":
        field, kind = aux_fields[av[0]], "auxiliary"
    else:
        continue
    assert field["parameters"][:4] == [R, Z, T, ell]
    assert av[1][1:4] == [Z, T, ell]
    key = (kind, av[0])
    if key in seen:
        continue
    seen.add(key)
    for row_number, row in enumerate(field["rows"]):
        if row["localBody"] not in active:
            continue
        m = dict(zip(row["localParameters"], row["values"]))
        assert m[ell] == row["label"]["ell"]
        assert [m[x] for x in mesh] == row["label"]["grid"]
        expect(m[T], "multiply", [T, n[m[T]]["args"][1]])
        ratio = n[m[T]]["args"][1]
        radial_scale = n[m[R]]["args"][1]
        expect(m[R], "multiply", [R, radial_scale])
        expect(radial_scale, "sqrt_positive", [ratio])
        axial_scale = n[m[Z]]["args"][1]
        expect(m[Z], "multiply", [Z, axial_scale])
        axial_log = n[axial_scale]["args"][0]
        expect(axial_scale, "exp", [axial_log])
        log_ratio = n[axial_log]["args"][1]
        expect(axial_log, "multiply", [22, log_ratio])
        expect(log_ratio, "log_positive", [ratio])
        q_inverse = n[ratio]["args"][1]
        expect(ratio, "multiply", [4587628, q_inverse])
        qlabel = n[q_inverse]["args"][0]
        expect(q_inverse, "inverse", [qlabel])
        assert n[4587628]["op"] == n[qlabel]["op"] == "exp"
        label = row["label"]["ell"]
        q_exponent = n[qlabel]["args"][0]
        label_log = n[q_exponent]["args"][1]
        expect(q_exponent, "multiply", [20, label_log])
        expect(label_log, "multiply", [127, label])
        guards = row["guards"]
        assert len(guards) == 5 and guards[0] == [4587658, 3617, 28826]
        for j, coordinate in enumerate((m[R], m[Z], m[T])):
            offset, left, right = guards[j + 1]
            expect(left, "rational", ["-3", "4"])
            expect(right, "rational", ["3", "4"])
            positive, negative = n[offset]["args"]
            expect(offset, "add", [positive, negative])
            expect(negative, "multiply", [20, row["label"]["grid"][j]])
            assert n[positive]["op"] == "multiply" and len(n[positive]["args"]) == 2
            assert coordinate in n[positive]["args"]
            scale = next(x for x in n[positive]["args"] if x != coordinate)
            expect(scale, "integer_power", [label, 6])
        offset, left, right = guards[4]
        expect(left, "rational", ["-3", "4"])
        expect(right, "rational", ["3", "4"])
        neg_label = n[offset]["args"][1]
        expect(offset, "add", [4590074, neg_label])
        expect(neg_label, "multiply", [20, label])
        row_counts[kind] += 1
        ratios.add(ratio)
    field_rows.append({"kind": kind, "definition": av[0], "name": field["name"],
                       "totalRows": len(field["rows"])})

frame_classes = collections.defaultdict(list)
for frame in scope["reboundNativeFrames"]:
    m = frame["mapping"]
    changed = set(m)
    if changed == {R, Z, T}:
        actual = [m[x] for x in (R, Z, T)]
        assert actual in ([4587872, 4587876, 4587880], [4590862, 4590863, 4590864])
        frame_classes["slowRepresentativeTriples"].append(frame["call"])
    elif changed == {R}:
        frame_classes["radialOnly"].append(frame["call"])
    else:
        assert changed == {4587641, 4587642, 4587643}
        assert [m[x] for x in (4587641, 4587642, 4587643)] == representative
        frame_classes["frozenRepresentativeSubstitutions"].append(frame["call"])
assert list(map(len, (frame_classes["slowRepresentativeTriples"], frame_classes["radialOnly"],
                     frame_classes["frozenRepresentativeSubstitutions"]))) == [6, 24, 18]
for i, op, av in (
    (4587870, "multiply", [24, 4587643]), (4587871, "multiply", [4587641, 4587870]),
    (4587872, "sqrt_positive", [4587871]), (4587873, "log_positive", [4587643]),
    (4587874, "multiply", [22, 4587873]), (4587875, "exp", [4587874]),
    (4587876, "multiply", [4587642, 4587875]), (4587877, "integer_power", [4587642, 2]),
    (4587878, "multiply", [20, 4587877]), (4587879, "add", [1, 4587878]),
    (4587880, "multiply", [4587643, 4587879]),
    (4588865, "multiply", [24, 4588852]), (4590861, "multiply", [4588865, 4588867]),
    (4590862, "sqrt_positive", [4590861]), (4588868, "log_positive", [4588852]),
    (4588869, "multiply", [22, 4588868]), (4588870, "exp", [4588869]),
    (4590863, "multiply", [4588870, 4588872]),
    (4590779, "integer_power", [4588872, 2]), (4590780, "multiply", [20, 4590779]),
    (4590781, "add", [1, 4590780]), (4590864, "multiply", [4588852, 4590781]),
    (4588852, "actual_monotone_root", [2, 4588838, 4588851]),
    (4588864, "integer_power", [4588863, 2]), (4588866, "inverse", [4588865]),
    (4588867, "multiply", [4588864, 4588866]),
    (4588871, "inverse", [4588870]), (4588872, "multiply", [4588838, 4588871]),
):
    expect(i, op, av)


@lru_cache(None)
def free(i):
    node, av = n[i], n[i]["args"]
    if node["op"] == "coordinate":
        return frozenset((i,))
    if node["op"] == "definite_integral":
        return (free(av[0]) - {av[1]}) | free(av[2]) | free(av[3])
    return frozenset().union(*(free(j) for j in actual_children(node)))


frozen_dependencies = {str(i): sorted(free(i)) for i in representative}
assert all(set(values) == {ell, *mesh} for values in frozen_dependencies.values())
source_pins = {
    "source-global-current.mjs": "93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760",
    "source-global-representative.mjs": "f3fbcf74b42c59cbfdd563e0fddcba9fab5cad782a96695930e3445c50373541",
    "source-global-expressions.mjs": "89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1",
    "source-auxiliary-expressions.mjs": "e456b4511adcc997b64267b2229422618b6139955e0c9083f2b83f4739600463",
}
source = {name: read(a.source / name, pin).decode() for name, pin in source_pins.items()}
assert "guarded=this.choose(coordinate,left,right,this.zero,prior,this.zero)" in source["source-global-expressions.mjs"]
assert "value=this.choose(coordinate,left,right,this.zero,body,this.zero)" in source["source-auxiliary-expressions.mjs"]
assert "const value=this.expressionValue(row.localSystem,row.values,localOrders)" in source["source-global-expressions.mjs"]
assert "this.expressionValue(row.localSystem,row.values,localOrders)" in source["source-auxiliary-expressions.mjs"]
assert "nonemptyActiveIntersectionRequired:true" in source["source-global-representative.mjs"]
reference_s, ratio_control, radius = Fraction(3, 4), Fraction(2), Fraction(2)
reference_x = radius**2 / (2 * reference_s)
unscaled_x = radius**2 / (2 * ratio_control * reference_s)
scaled_x = ratio_control * radius**2 / (2 * ratio_control * reference_s)
assert reference_x == scaled_x and reference_x != unscaled_x
out = {
    "schema": "MathScope.Y.N4.OuterActiveIndexedImageAndRepresentativeBinding/1",
    "status": "CONDITIONAL_ACTIVE_INDEXED_IMAGE_AND_FROZEN_REPRESENTATIVE_BINDING",
    "nativeScopeCounts": scope["nativeScopeCounts"], "frameClasses": dict(frame_classes),
    "outerNativeBandOrMeshLabelRebindings": 0,
    "uniqueIndexedDefinitions": field_rows, "checkedRows": dict(row_counts), "distinctPositiveRatios": len(ratios),
    "slowMapping": "R'=sqrt(c)*R, Z'=c^(1/2-h)*Z, T'=c*T, c=Qref/Qlabel>0.",
    "invariants": ["s'=c*s in (1/2,2) from the original open band guard",
                   "X'=(sqrt(c)*R)^2/(2*c*s)=X", "eta'=Z'/s'^(1/2-h)=eta", "T'>=0"],
    "activeBox": "The first row guard preserves Xa<X<Xb. The next three guards put the mapped point inside its candidate ell^6 mesh box. The last band guard ensures the new inverse bracket. These give an active point in the same original box, under the initial admitted physical image.",
    "representativeDependencies": frozen_dependencies,
    "representativeTuple": {"X": representative[0], "eta": representative[1], "s": representative[2]},
    "representativeGuardReceiptSHA256": hashlib.sha256(guard_raw).hexdigest(),
    "representativeImage": "Both actual slow triples are exactly (sqrt(2*srep*Xrep), srep^D*etarep, srep*(1-etarep^2)). The selected roots depend only on ell and the three frozen mesh labels. The original active-box construction supplies an interior representative and unique inverse.",
    "premises": ["the initial reference input belongs to the original physical image",
                 "0<h<1/16 and the original positive integer band-label domain",
                 "the original representative active-box geometry theorem",
                 "the source native operators retain their capture-free substitution, lazy guards and fixed-label derivative meanings"],
    "sourcePins": source_pins,
    "negativeControl": {"kind": "abstract exact rational radial-map corruption",
                        "c": str(ratio_control), "R": str(radius), "s": str(reference_s),
                        "referenceX": str(reference_x), "incorrectUnscaledRadialX": str(unscaled_x),
                        "correctScaledRadialX": str(scaled_x),
                        "meaning": "The original sqrt(c) radial map is necessary for shell invariance; checking only Z/T scaling would leave this mutation undetected."},
    "scope": "Actual finite original N4 outer frames and reached indexed rows; source-image transport and frozen representative binding under stated original geometry/semantics. Native limit convergence, endpoint derivatives, runtime-generated or Forced/coupled graphs, arbitrary recursive n and final field values remain separate.",
    "release": "HOLD", "checkerSHA256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
}
with a.output.open("x", encoding="utf8", newline="\n") as report:
    json.dump(out, report, indent=2)
    report.write("\n")
print(json.dumps({"status": out["status"], "rows": dict(row_counts), "ratios": len(ratios),
                  "frameCounts": {key: len(values) for key, values in frame_classes.items()},
                  "representativeDependencies": frozen_dependencies}))
