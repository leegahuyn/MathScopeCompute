"""Expand every requested Repeat A/p Cartesian operator into exact native jet leaves."""
import argparse
from collections import defaultdict
import json
from pathlib import Path

# Dimension order has to match the original indexed dispatcher, not the
# physical output order (x,y,z,tau).
R, Z, T, Y0, Y1, THETA = range(6)
FROZEN = "ciOverEpsilon,vr0,vr1,vt0,vt1,epsilon"
SLOTS = ("R", "Z", "T", "Y0", "Y1", "theta")
COEFFICIENTS = {
    "C":"cos(theta)", "S":"sin(theta)", "I":"R^(-1)",
    "a0":"radialFast", "a1":"partial_R radialFast", "a2":"partial_R^2 radialFast",
    "vr0":"vr[0]", "vr1":"vr[1]", "vt0":"vt[0]", "vt1":"vt[1]",
    "kT":"ci / epsilon", "e":"epsilon",
}


def coeff(*factors):
    return tuple(sorted(factors))


def derivative(factors, direction):
    factor_rules = {
        R: {"I": (-1, ("I","I")), "a0":(1, ("a1",)), "a1":(1, ("a2",))},
        THETA: {"C":(-1, ("S",)), "S":(1, ("C",))},
    }.get(direction, {})
    for i, name in enumerate(factors):
        if name == "a2" and direction == R:
            raise ValueError("Unexpected fourth-order use of radialFast")
        if name in factor_rules:
            weight, tail = factor_rules[name]
            yield weight, coeff(*factors[:i], *tail, *factors[i+1:])


def step(poly, assignments):
    """One first-order vector field includes differentiation of prior coefficients."""
    result = defaultdict(int)
    for (field, orders, factors), value in poly.items():
        for direction, signed_coefficient, multiplier in assignments:
            increased = list(orders)
            increased[direction] += 1
            result[field, tuple(increased), coeff(*factors, *multiplier)] += signed_coefficient * value
            for weight, differentiated in derivative(factors, direction):
                result[field, orders, coeff(*differentiated, *multiplier)] += weight * signed_coefficient * value
    return {key:value for key,value in result.items() if value}


OPERATORS = {
    "Dx": [(R, 1, ("C",)), (Y0, 1, ("C","a0","vr0")), (Y1, 1, ("C","a0","vr1")),
           (THETA, -1, ("S","I"))],
    "Dy": [(R, 1, ("S",)), (Y0, 1, ("S","a0","vr0")), (Y1, 1, ("S","a0","vr1")),
           (THETA, 1, ("C","I"))],
    "Dz": [(Z, 1, ("e",))],
    "Dtau": [(T, 1, ()), (Y0, -1, ("kT","vt0")), (Y1, -1, ("kT","vt1"))],
}


def seed(*components):
    return {(name, (0,) * 6, coeff(*factors)): sign for name, sign, factors in components}


SEEDS = {
    "A0": seed(("Ar",1,("C",)), ("Atheta",-1,("S",))),
    "A1": seed(("Ar",1,("S",)), ("Atheta",1,("C",))),
    "A2": seed(("Az",1,())),
    "p": seed(("p",1,())),
}


def exact_tests():
    assert step(SEEDS["p"], OPERATORS["Dz"]) == {("p", (0,1,0,0,0,0), ("e",)):1}
    assert step(SEEDS["p"], OPERATORS["Dtau"]) == {
        ("p", (0,0,1,0,0,0), ()):1,
        ("p", (0,0,0,1,0,0), ("kT","vt0")):-1,
        ("p", (0,0,0,0,1,0), ("kT","vt1")):-1,
    }
    first = step(SEEDS["A0"], OPERATORS["Dx"])
    assert first["Ar", (0,0,0,0,0,0), ("I","S","S")] == 1
    assert first["Atheta", (0,0,0,0,0,0), ("C","I","S")] == 1
    x2 = step(step(SEEDS["p"], OPERATORS["Dx"]), OPERATORS["Dx"])
    assert x2["p", (0,0,0,1,0,0), ("C","C","a1","vr0")] == 1
    assert x2["p", (0,0,0,0,0,1), ("C","I","I","S")] == 2
    # Verify commutation of Cartesian first-order derivatives modulo
    # cos(theta)^2 + sin(theta)^2 = 1.  RadialFast depends only on R.
    for p in SEEDS.values():
        xy = step(step(p, OPERATORS["Dx"]), OPERATORS["Dy"])
        yx = step(step(p, OPERATORS["Dy"]), OPERATORS["Dx"])
        assert xy == yx


def build(payload, definitions, base):
    exact_tests()
    source_fields = dict(zip(("Ar","Atheta","Az"), definitions["fields"]))
    p = source_fields["Ar"]
    source_fields["p"] = {"id":"coupled-field:32", "parameters":p["parameters"],
                          "directions":p["directions"]}
    for field in source_fields.values():
        assert field["parameters"] == p["parameters"]
        assert field["directions"] == p["directions"]
    native, ast, out = {}, [], []
    for item in payload["rows"]:
        if "normalizedOperatorOrder" not in item:
            out.append(item)
            continue
        field = item["label"].split("@", 1)[0]
        poly = SEEDS[field]
        for operator in item["normalizedOperatorOrder"]:
            poly = step(poly, OPERATORS[operator])
        terms = []
        for (leaf, orders, factors), sign in sorted(poly.items()):
            field = source_fields[leaf]
            key = leaf, orders
            if key not in native:
                if not any(orders):
                    native[key] = payload["chartRoots"][leaf]
                else:
                    native[key] = base + len(ast)
                    ast.append({"op":"m3_coupled_indexed_partial",
                                "args":[field["id"],field["parameters"],list(orders)]})
            terms.append({"integer":sign, "coefficientFactors":list(factors),
                          "nativeRoot":native[key]})
        assert terms and all(set(term["coefficientFactors"]) <= set(COEFFICIENTS) for term in terms)
        out.append({**item,"terms":terms})
    assert len(out)==67 and sum("terms" in item for item in out)==61
    return out, ast, native


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scratch", type=Path)
    opts = parser.parse_args()
    folder = opts.scratch
    def load(name):
        return json.loads((folder/name).read_bytes())
    payload = load("repeat-jet-dispatch.json")
    receipt = load("repeat-gauge-receipt.json")
    out, ast, native = build(payload, load("repeat-gauge-definitions.json"), receipt["end"])
    with (folder/"repeat-native-partials-append.jsonl").open("w", encoding="utf-8", newline="\n") as stream:
        for record in ast:
            stream.write(json.dumps(record, separators=(",", ":"))+"\n")
    with (folder/"repeat-cartesian-native-jets.json").open("w", encoding="utf-8", newline="\n") as stream:
        result = {**payload, "expectedDerivativeAppendStart":receipt["end"],
                  "indexedNativePartials":len(ast), "nativeLeafCount":len(native),
                  "degreeOrder":list(SLOTS), "coefficientDictionary":COEFFICIENTS,
                  "coefficientGeometry": {
                      "kinematics":"R=r/sqrt(Q), Z=z/Q^(1/2-h), T=tau/Q, epsilon=Q^h",
                      "frozen":"ci, epsilon, vr, vt constant for the fixed reference label",
                      "radialFast":"Depends only on R for fixed ref ell. Use original radialPrimitive derivatives rather than numerical finite differences.",
                      "axis":"R>0 on admitted R support. The smooth physical extension remains a separate obligation.",
                  },
                  "rows":out}
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(f"{len(ast)} explicit indexed derivative nodes, {len(native)} unique native leaves, "
          f"{sum(len(item.get('terms', [])) for item in out)} coefficient terms for 61 operators.")


if __name__ == "__main__":
    main()
