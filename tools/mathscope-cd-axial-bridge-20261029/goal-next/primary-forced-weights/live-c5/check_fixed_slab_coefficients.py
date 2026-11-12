"""Bound the finite coefficient powers under the fixed-slab scalar premise."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "degrees": "f6ecf8b9c0f82c15c9aa42b9f80ab28f9c83dff1d9542a58d602a6c0e621a2e7",
    "slab": "f1b9e256210f8f62c9b44366a842c8fe13e72363ff3dbc03d717752da46e8195",
    "fixed": "9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c",
    "scale_program": "34f45caa70455663b06f9c5116aa490ef59d58fc17e00a6b618918e35b78a338",
}


def read_pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def tower_parts(value):
    height = 0
    while set(value) == {"exp"}:
        value = value["exp"]
        height += 1
    assert set(value) == {"rational"}
    return height, Fraction(value["rational"])


def main():
    parser = ArgumentParser(description=__doc__)
    for name in PINS:
        parser.add_argument("--" + name.replace("_", "-"), type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    degrees, slab, fixed = (
        json.loads(read_pinned(getattr(args, name), PINS[name]))
        for name in ("degrees", "slab", "fixed")
    )
    scale = read_pinned(args.scale_program, PINS["scale_program"])
    assert b"ell=native(617432);" in scale and b"const S=pow(add(ell,q(17)),2)" in scale
    assert slab["candidate"] == "T[10]" and slab["towerRecurrence"] == "T[n+1]=exp(T[n])"
    base = int(slab["T0"])
    height, rational = tower_parts(fixed["hostedOriginal"]["617432"]["upper"])
    assert base == 2**30 and 0 < rational < base and height <= 6
    assert base > max(17, 24)

    rows = {}
    for name, count in (("amplitude", 7), ("potential", 7), ("curlRemainder", 6), ("pressure", 5)):
        items = degrees["degrees"][name][:count]
        assert len(items) == count
        assert all(0 < item["power"] and 0 < item["pole"] for item in items)
        rows[name] = [
            {**item, "conditionalCoefficientUpper": {"exp": {"integerMultipleOfT9": 2 * item["power"]}}}
            for item in items
        ]
    max_power = max(item["power"] for items in rows.values() for item in items)
    assert max_power == 2514 and base > 4 * max_power
    result = {
        "schema": "MathScope.Forced.FixedSlabConditionalCoefficientPowers/1",
        "status": "CONDITIONAL_FIXED_SLAB_SCALAR_ARITHMETIC",
        "inputSHA256": PINS,
        "T0": base,
        "towerRecurrence": slab["towerRecurrence"],
        "sourceScale": "(ellMinimum+17)^2",
        "scaleProof": "ellMinimum<T6. For x=T6, x+17<2x and 4x^2<x^3/6<=exp(x). Thus S<T7<K.",
        "coefficientProof": "If the fixed-slab estimate holds with K=T10, (K*S)^p<K^(2*p)=exp(2*p*T9).",
        "uniformProof": "T9>4*p gives 2*p*T9<T9^2/2<=exp(T9)=T10. Hence every displayed coefficient is below T11.",
        "uniformCoefficientUpper": "T[11]",
        "rows": rows,
        "scope": "Coefficient factors only. Original epsilon, sqrt(zeta), P(v) and delta_star powers are unchanged. Original global K, the fixed-slab mixed-jet argument and active-family attachment remain open.",
        "finalJets": "0/67",
        "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(result, indent=2) + "\n").encode())
    print(f"PASS {sum(map(len, rows.values()))} conditional fixed-slab coefficient bounds")


if __name__ == "__main__":
    main()
