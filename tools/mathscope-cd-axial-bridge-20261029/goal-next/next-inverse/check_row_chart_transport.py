"""Bind the exact row-to-reference PDE scaling to the original native chart."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "flat"))
from bind_forced_cutoffs import Archive, GRAPH_SHA, REGISTRY_SHA, PRODUCER_COMMIT, git_blob, pinned_json


def bind_fixed_coordinates(g, fields, palette):
    ell, base_index, log_tg, log_two, h_plus_one = 622791, 635056, 623015, 127, 135988
    fixed = {
        9: ("source_parameter", ["h"]),
        19: ("rational", ["1", "2"]),
        20: ("rational", ["-1", "1"]),
        22: ("add", [19, 21]),
        21: ("multiply", [9, 20]),
        23: ("add", [9, 19]),
        24: ("rational", ["2", "1"]),
        127: ("log_positive", [24]),
        135988: ("add", [1, 9]),
        622792: ("multiply", [log_two, ell]),
        622793: ("multiply", [20, 622792]),
        622794: ("exp", [622793]),
        622796: ("log_positive", [622794]),
        622797: ("multiply", [9, 622796]),
        622798: ("exp", [622797]),
        623015: ("log_positive", [300172]),
        623016: ("inverse", [623015]),
        623021: ("multiply", [623015, 623020]),
        623022: ("exp", [623021]),
        623023: ("multiply", [h_plus_one, 622796]),
        623024: ("exp", [623023]),
        623025: ("multiply", [623022, 623024]),
        624041: ("log_positive", [624040]),
        624049: ("sqrt_positive", [622794]),
        624050: ("multiply", [622802, 624049]),
        624057: ("multiply", [623020, 624041]),
        624058: ("exp", [624057]),
        624059: ("log_positive", [624050]),
        624060: ("multiply", [624048, 624059]),
        624061: ("exp", [624060]),
        625150: ("inverse", [624050]),
        625151: ("multiply", [624049, 625150]),
        625152: ("multiply", [624048, 625151]),
        625153: ("multiply", [624061, 625152]),
        625154: ("multiply", [624058, 625153]),
        635046: ("add", [190, ell]),
        635057: ("multiply", [624041, base_index]),
        635058: ("exp", [635057]),
        635059: ("multiply", [624061, 635058]),
        635060: ("multiply", [625153, 635058]),
        635061: ("multiply", [log_tg, base_index]),
        635062: ("exp", [635061]),
        635063: ("multiply", [623024, 635062]),
        3675259: ("multiply", [20, 3675253]),
        3675260: ("add", [ell, 3675259]),
        3675261: ("multiply", [log_two, 3675260]),
        3675262: ("exp", [3675261]),
        3675263: ("sqrt_positive", [3675262]),
        3675266: ("log_positive", [3675262]),
        3675267: ("multiply", [22, 3675266]),
        3675268: ("exp", [3675267]),
        3822571: ("multiply", [622802, 3675263]),
        3822572: ("multiply", [622803, 3675268]),
        3822573: ("multiply", [622804, 3675262]),
        5294: ("multiply", [23, 24]),
        3674923: ("add", [19, 5294]),
        3822574: ("multiply", [3674923, 3675266]),
        3822575: ("exp", [3822574]),
    }
    assert all(g.node(index) == expected for index, expected in fixed.items())
    assert g.node(190) == ("rational", ["-2", "1"])

    def index_at(index, band):
        neg_ceiling = g.op(index, "multiply")
        assert neg_ceiling[0] == 20
        neg_arg, = g.op(neg_ceiling[1], "ceiling")
        scalar, factors = g.factors((neg_arg, 1))
        assert scalar == -1 and factors.pop(log_tg) == -1 and len(factors) == 1
        numerator, = factors
        assert factors[numerator] == 1
        summands = g.op(numerator, "add")
        assert len(summands) == 2
        logarithm = [index for index in g.explicit_reach(summands)
            if g.node(index) == ("log_positive", [band])]
        assert len(logarithm) == 1
        log_band = logarithm[0]
        parts = [g.factors((x, 1)) for x in summands]
        assert (-2, {log_band: 1}) in parts
        assert g.factors((h_plus_one, 1), (band, 1), (log_two, 1)) in parts, (index, band, parts)

    index_at(623020, ell)
    index_at(base_index, 635046)
    bands = {}
    for row, known in zip(fields[9]["rows"], palette["rows"], strict=True):
        label = row["label"]
        values = row["values"]
        assert [label["key"], label["sign"], label["ell"]] == [known["key"], known["sign"], known["ell"]]
        assert [values[3], values[7], values[-1]] == [known["ell"], ell, known["difference"]]
        assert values[8:10] == [635044, 635045]
        d = values[-1]
        left, right = g.op(d, "add")
        if g.node(left) == ("multiply", [20, base_index]):
            left, right = right, left
        assert g.node(right) == ("multiply", [20, base_index])
        index_at(left, label["ell"])
        pair = (left, d)
        assert bands.setdefault(label["ell"], pair) == pair
    assert len(bands) == 3
    assert {635060, 635063, 622798} <= g.explicit_reach([4420035, 4420037, 4420039])
    return {"fixedNodeShapeChecks": len(fixed), "rowCount": len(fields[9]["rows"]),
        "bands": [{"label": band, "index": index, "indexDifference": d} for band, (index, d) in bands.items()]}


def exponents():
    half, one, h = (Fraction(1, 2), 0), (1, 0), (0, 1)
    A, D = (Fraction(1, 2), 1), (Fraction(1, 2), -1)

    def add(*values):
        return tuple(sum(entries) for entries in zip(*values, strict=True))

    velocity, pressure, dr, dz, dtheta, time, laplacian = A, add(A, A), half, add(D, h), half, add(one, h), add(half, half)
    assert dr == dz == dtheta and laplacian == one
    target = add(pressure, half)
    terms = {"velocityTime": add(velocity, time), "radialTransport": add(velocity, velocity, dr),
        "axialTransport": add(velocity, velocity, dz), "angularConnection": add(velocity, velocity, dtheta),
        "vectorViscosity": add(velocity, h, laplacian), "pressureGradient": add(pressure, dr)}
    assert all(value == target for value in terms.values())
    return {name: [str(x) for x in value] for name, value in terms.items()}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("repo", "graph", "registry", "palette", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    assert __debug__
    registry = pinned_json(args.registry, REGISTRY_SHA)
    palette = json.loads(args.palette.read_bytes())
    assert palette["fullSourceGraphSHA256"] == GRAPH_SHA and palette["registrySHA256"] == REGISTRY_SHA
    fields = json.loads(registry["definitions"])[1]
    source_code = {
        "research-ide/mathscope-m3/navier/source-initialized-angular.mjs": (
            "radialFast:G.div(radialFast,G.pow(Lambda,levelDifference))",
            "ci:G.div(ci,G.pow(Tg,levelDifference))",
        ),
        "research-ide/mathscope-m3/navier/source-global-pressure.mjs": (
            "radialFast=G.derivative(radialPrimitive,R)",
            "ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))",
        ),
        "research-ide/mathscope-m3/navier/source-harmonic-assembly.mjs": (
            "Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))",
            "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))",
            "Dz=x=>G.mul(epsilon,G.derivative(x,Z))",
        ),
    }
    pins = {}
    for path, patterns in source_code.items():
        blob = git_blob(args.repo, PRODUCER_COMMIT, path)
        assert all(pattern.encode() in blob for pattern in patterns), path
        pins[path] = sha256(blob).hexdigest()
    with TemporaryFile() as stream:
        g = Archive(args.graph, stream)
        bindings = bind_fixed_coordinates(g, fields, palette)
    result = {
        "schema": "MathScope.M3.OriginalRowChartConservativeScaling/1",
        "graphSHA256": GRAPH_SHA, "registrySHA256": REGISTRY_SHA, "sourceBlobs": pins,
        "bindings": bindings,
        "scalingExponentsOfRhoInBasisOneAndH": exponents(),
        "samePhysicalRadiusAfterChartChange": "sqrt(Q_label)*R_label=sqrt(Q_ref)*R_ref",
        "commonTorusRadialScale": "a_ref=sqrt(rho)*(a_label/Lambda^delta) evaluated in the label chart",
        "commonTorusTimeScale": "ci_ref=rho^(1+h)*(ci_label/Tg^delta)",
        "assumptions": ["fixed active row and valid original slow chart", "ordinary derivatives at the point",
            "same source fields and pressure", "cross-row derivative products vanish on the original disjoint supports"],
        "seamExtension": "OPEN",
        "actualCorrectedSecondForcingVerified": False,
    }
    args.out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{bindings['fixedNodeShapeChecks']} exact source nodes and {bindings['rowCount']} original row maps checked")


if __name__ == "__main__":
    main()
