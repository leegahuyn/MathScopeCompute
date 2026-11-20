from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from math import prod
from pathlib import Path
import sys


STENCIL = "whole-k-annular-initial/localized-force/original-67plus13-polynomials.json"
STENCIL_SHA = "1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7"
EXTERIOR = "c109/n8-exterior-seam/verify_nonzero_seam.py"
EXTERIOR_SHA = "00b428bd263ffde7d7f31b8cab8526bd6cf33cd69c40180c38f396d344b1efc1"
ZERO_A_COMPONENTS = {"A0", "A1", "A2"}
ACTIVE = {
    "b@0,0,0", "b@0,0,1", "b@1,0,0", "b@2,0,0",
    "p@0,0,0,0", "p@1,0,0,0", "p@0,1,0,0",
}
NORMALIZATION = {
    "b@0,0,0": "s^(A+1/2)/B",
    "b@0,0,1": "tau0*s^(A+1/2)/B",
    "b@1,0,0": "s^(A+3/2)/B",
    "b@2,0,0": "s^(A+5/2)/B",
    "p@0,0,0,0": "4A*s^(2A)/B^2",
    "p@1,0,0,0": "s^(2A+1/2)/B^2",
    "p@0,1,0,0": "s^(2A+1/2)/B^2",
}


def pinned(path, digest):
    value = path.read_bytes()
    assert sha256(value).hexdigest() == digest, path
    return value


def source_reader(workspace, goal):
    exterior_path = goal / EXTERIOR
    pinned(exterior_path, EXTERIOR_SHA)
    spec = spec_from_file_location("c109_original_exterior", exterior_path)
    parent = module_from_spec(spec)
    spec.loader.exec_module(parent)
    parent.verify_sources(workspace)
    sys.path.insert(0, str((workspace / parent.OUTER).parent))
    from outer_cutoff import I, rounded, exp_negative
    parent.I, parent.rounded, parent.exp_negative = I, rounded, exp_negative
    return parent


def derivative_tails(parent, degree, radius):
    retained, pressure = parent.absolute_remainders(degree, radius)
    return tuple(retained * prod(range(degree + 2 - j, degree + 2)) for j in range(3)), pressure


def heat_weighted_jets(parent, degree, z_upper):
    """Three enclosed weighted heat derivatives H, Z H', Z² H''."""
    I = parent.I
    remainders, pressure_error = derivative_tails(parent, degree, z_upper)
    result = []
    for derivative in range(3):
        polynomial = I.point(0)
        for k in range(max(1, derivative), degree + 1):
            falling = prod(range(k - derivative + 1, k + 1))
            magnitude = I(parent.magnitude(k, Q(0)), parent.magnitude(k, parent.H_COEFFICIENT_MAX))
            polynomial += (-1) ** k * falling * magnitude * I(0, z_upper ** k)
        assert degree % 2 == 0
        weighted = I(0, parent.SMALL_H) * (polynomial - I(0, remainders[derivative]))
        if derivative == 0:
            weighted += 1
            weighted = I(weighted.lo, min(1, weighted.hi))
        else:
            weighted = I(weighted.lo, min(0, weighted.hi)) if derivative == 1 else I(max(0, weighted.lo), weighted.hi)
        result.append(weighted)
    return (*result, parent.heat_intervals(degree, z_upper)[1], pressure_error)


def zero_by_source(label):
    field, indices = label.split("@")
    numbers = tuple(map(int, indices.split(",")))
    return field in ZERO_A_COMPONENTS or numbers[-2] > 0


def audit_formulas():
    def sum_polynomials(*terms):
        result = Counter()
        for term in terms:
            result.update(term)
        return {power: value for power, value in result.items() if value != 0}

    def multiply_polynomials(left, right):
        result = Counter()
        for (i, j), a in left.items():
            for (k, ell), b in right.items():
                result[i + k, j + ell] += a * b
        return result

    # On H(Z)=Z^k the entire radial power is s^(-(a+k)).
    # Reduction in independent formal parameters (a,k) checks all coefficients.
    a, k, one = {(1, 0): 1}, {(0, 1): 1}, {(0, 0): 1}
    total = sum_polynomials(a, k)
    second_direct = multiply_polynomials(total, sum_polynomials(total, one))
    second_written = sum_polynomials(
        multiply_polynomials(a, sum_polynomials(a, one)),
        multiply_polynomials({(1, 0): 2, (0, 0): 2}, k),
        multiply_polynomials(k, {(0, 1): 1, (0, 0): -1}),
    )
    assert second_direct == second_written
    first_direct = {power: -weight for power, weight in total.items()}
    assert first_direct == {(1, 0): -1, (0, 1): -1}
    assert first_direct != sum_polynomials(first_direct, {(0, 0): Q(1, 2)})
    # H, Z H', Z² H'' on k=0,1,2 have independent rows after factoring Z^k.
    test_rows = [(1, j, j * (j - 1)) for j in range(3)]
    assert test_rows == [(1, 0, 0), (1, 1, 0), (1, 2, 2)]
    assert prod(test_rows[i][i] for i in range(3)) == 2
    return {"formalRadialMonomialDerivativeIdentities": 2, "weightedHeatJetBasisDeterminant": 2,
            "missingInverseRadiusControlRejected": True,
            "timeChain": "tau0*d_tau(C(rho)*H(Z))=C'(rho)*H(Z)+C(rho)*Z*H'(Z)/rho",
            "pressureChain": "d_s P=B^2*s^(-2A-1)*H(Z)^2/2, d_(x_i) P=2*x_i*d_s P"}


def audit_original_output_polynomials(stencil):
    short = {
        "x": "x", "y": "y", "b@0,0,0": "b", "b@0,0,1": "bt", "b@1,0,0": "bs", "b@2,0,0": "bss",
        "p@0,0,0,0": "p", "p@1,0,0,0": "px", "p@0,1,0,0": "py",
    }
    variables = stencil["variables"]
    unit = "C@0,0,0"
    zero = set(variables) - set(short) - {unit}

    def reduce_source(terms):
        result = Counter()
        for term in terms:
            names = [(variables[index], power) for index, power in term["powers"]]
            if any(name in zero and power for name, power in names):
                continue
            monomial = tuple(sorted(short[name] for name, power in names if name != unit for _ in range(power)))
            result[monomial] += Q(term["coefficient"])
        return {powers: value for powers, value in result.items() if value}

    def polynomial(*terms):
        return {tuple(sorted(names.split())): Q(coefficient) for coefficient, names in terms}

    velocity = [polynomial((-1, "y b")), polynomial((1, "x b")), {}]
    gradient = [
        [polynomial((-2, "x y bs")), polynomial((-1, "b"), (-2, "y y bs")), {}],
        [polynomial((1, "b"), (2, "x x bs")), polynomial((2, "x y bs")), {}], [{}, {}, {}],
    ]
    force = [
        polynomial((1, "y bt"), (-1, "x b b"), (8, "y bs"), (4, "x x y bss"), (4, "y y y bss"), (1, "px")),
        polynomial((-1, "x bt"), (-1, "y b b"), (-8, "x bs"), (-4, "x x x bss"), (-4, "x y y bss"), (1, "py")),
        {},
    ]
    outputs = stencil["outputs"]
    assert list(map(reduce_source, outputs["velocity"])) == velocity
    assert [list(map(reduce_source, row)) for row in outputs["velocity_gradient"]] == gradient
    assert reduce_source(outputs["localized_pressure"]) == polynomial((1, "p"))
    assert list(map(reduce_source, outputs["force"])) == force
    assert force[0][("bt", "y")] == 1 and force[1][("bt", "x")] == -1
    return {"velocity": 3, "gradient": 9, "pressure": 1, "force": 3,
            "cutoffAlreadyAppliedToExteriorJetInputs": True, "physicalTimeIsMinusTau": True}


def patch_readouts(parent, labels, y, rho, bits, radial_unit):
    I = parent.I
    temperature, weighted_first, weighted_second, pressure, _ = heat_weighted_jets(parent, 8, 4 * rho[1] / (110 * y[0]))
    C, _, minus_Cprime = parent.transition(*rho, bits)
    a = I(1, 1 + parent.SMALL_H)  # A + 1/2, exactly.
    inverse_rho = I(1 / rho[1], 1 / rho[0])
    pressure_gradient = C * temperature.square()
    active = {
        "b@0,0,0": C * temperature,
        "b@0,0,1": -minus_Cprime * temperature + C * weighted_first * inverse_rho,
        "b@1,0,0": -C * (a * temperature + weighted_first),
        "b@2,0,0": C * (a * (a + 1) * temperature + 2 * (a + 1) * weighted_first + weighted_second),
        "p@0,0,0,0": -C * pressure,
        "p@1,0,0,0": pressure_gradient * radial_unit[0],
        "p@0,1,0,0": pressure_gradient * radial_unit[1],
    }
    return {label: I.point(0) if zero_by_source(label) else parent.rounded(active[label], bits) for label in labels}


def main(args):
    raw = pinned(args.goal / STENCIL, STENCIL_SHA)
    stencil = json.loads(raw)
    parent = source_reader(args.workspace, args.goal)
    labels = [label for label in stencil["variables"] if "@" in label and not label.startswith("C@")]
    assert len(labels) == len(set(labels)) == 67
    assert {label for label in labels if not zero_by_source(label)} == ACTIVE
    assert set(NORMALIZATION) == ACTIVE
    counts = Counter(label.split("@")[0] for label in labels)
    assert sum(counts[field] for field in ZERO_A_COMPONENTS) == 57
    assert parent.source_geometry()["physicalExterior"] == "X/Xb>2"

    I = parent.I
    chosen_angle = Q(3, 5), Q(4, 5)
    assert sum(x * x for x in chosen_angle) == 1
    upper = parent.RHO_SEAM[-1]
    sample = {(bits, name): patch_readouts(parent, labels, (Q(6), Q(6)), (rho, rho), bits, chosen_angle)
              for bits in (72, 144) for name, rho in zip(("lower", "seam", "upper"), parent.RHO_SEAM, strict=True)}
    whole_regions = {
        name: patch_readouts(parent, labels, parent.Y_RANGE, rho, 144, (I(-1, 1), I(-1, 1)))
        for name, rho in zip(("lower", "upper"), zip(parent.RHO_SEAM, parent.RHO_SEAM[1:]), strict=True)
    }
    for name in ("lower", "seam", "upper"):
        coarse, fine = sample[72, name], sample[144, name]
        for label in labels:
            assert coarse[label].lo <= fine[label].lo <= fine[label].hi <= coarse[label].hi
    coarse_upper, fine_upper = sample[72, "upper"], sample[144, "upper"]
    strict_upper = [label for label in sorted(ACTIVE)
                    if coarse_upper[label].hi - coarse_upper[label].lo > fine_upper[label].hi - fine_upper[label].lo]
    assert len(strict_upper) == len(ACTIVE)
    point = sample[144, "upper"]
    signs = dict(zip(sorted(ACTIVE), (1, -1, -1, 1, -1, 1, 1), strict=True))
    assert all((point[label] * sign).lo > 0 for label, sign in signs.items())
    assert (point["b@0,0,1"]).hi < 0 and (-point["b@0,0,1"]).lo > 0

    coeff = {}
    for degree in (4, 8):
        (e0, e1, e2), ep = derivative_tails(parent, degree, parent.MAX_ARG)
        coeff[degree] = dict(zip(sorted(ACTIVE), (e0, 108 * e0 + 3 * e1, 2 * e0 + e1,
                                                 6 * e0 + 6 * e1 + e2, ep, ep, ep), strict=True))
    assert all(coeff[4][label] > 100000 * coeff[8][label] for label in ACTIVE)
    report = {
        "schema": "MathScope.C113.OriginalExteriorLocal67JetPacket/1",
        "stencilSHA256": STENCIL_SHA, "originalExteriorProgramSHA256": EXTERIOR_SHA,
        "status": "VERIFIED_ON_ORIGINAL_EXTERIOR_IDENTIFICATION_ONLY",
        "symbolicDerivativeAudit": audit_formulas(), "normalizationMultipliers": NORMALIZATION,
        "originalStencilOutputIdentities": audit_original_output_polynomials(stencil),
        "exactZeroLocalLabels": [label for label in labels if zero_by_source(label)],
        "nonzeroUpperPointLabels": sorted(ACTIVE),
        "precisionWidthDecreaseAtUpperPoint": strict_upper,
        "fixedPhysicalPoint": {"rSquaredOverTau0Xb": "6", "zOverZ0": "5/16", "xOverR": "3/5", "yOverR": "4/5"},
        "pointEnclosures": {f"{bits}/{name}": {key: value.encoded() for key, value in values.items()}
                            for (bits, name), values in sample.items()},
        "uniformWholePatchEnclosures": {name: {key: value.encoded() for key, value in values.items()}
                                        for name, values in whole_regions.items()},
        "coefficientTailsDivideByOriginalPositiveH": {str(degree): {key: str(value) for key, value in pairs.items()}
                                                      for degree, pairs in coeff.items()},
        "localJetEnclosures": 67, "wholeFinalJets": 0, "wholeKLastResolvedTau": None, "release": "HOLD",
    }
    with args.out.open("xb") as output:
        output.write((json.dumps(report, indent=2) + "\n").encode())
    print("PASS 67 original exterior jet enclosures, 60 literal zeros, seven signed active outputs")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for field in ("workspace", "goal", "out"):
        parser.add_argument("--" + field, required=True, type=Path)
    main(parser.parse_args())
