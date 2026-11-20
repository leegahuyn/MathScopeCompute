"""Check exact matched finite Fourier cutoffs at an adjacent reference seam."""

import argparse
from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re


GOAL = Path("work/goal-next")
RUNTIME = GOAL / "continuation66/stage2/runtime-exact/research-ide/mathscope-m3"
FOURIER = RUNTIME / "navier/source-auxiliary-fourier.mjs"
POST_SIGNED = RUNTIME / "post-signed-20261023/source-signed-actual-temporal-inverse.mjs"
PINS = {
    FOURIER: "59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e",
    POST_SIGNED: "5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628",
    RUNTIME / "navier/source-global-temporal.mjs":
        "16c13ea7a6ba49f78514e1c2a94e29499086e3b11c463e07f6513b8e31f32f1b",
    RUNTIME / "navier/source-temporal-potential.mjs":
        "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8",
    RUNTIME / "navier/source-global-band.mjs":
        "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    RUNTIME / "navier/source-global-pressure.mjs":
        "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
    GOAL / "continuation139/reference-seam/MANIFEST.json":
        "d24fc1768cde07c7d18da014f2e2b6175c36d3323417661fdabfa2971856ad6c",
    GOAL / "continuation140/stress-support/MANIFEST.json":
        "e0442ca7e008c2879b5318e64db3247c939f7290d504a12f432577ad350f1e12",
}
ZERO = (0, 0)
J = ((3, 1), (1, 5))
ADJUGATE = ((5, -1), (-1, 3))
IDENTITY = ((1, 0), (0, 1))
DECK_ORDER = 14
PHI_14 = (1, -1, 1, -1, 1, -1, 1)


@dataclass(frozen=True)
class Quadratic:
    """Represent rational + radical * sqrt(2), exactly."""

    rational: Fraction
    radical: Fraction

    def __mul__(self, other):
        return Quadratic(
            self.rational * other.rational + 2 * self.radical * other.radical,
            self.rational * other.radical + self.radical * other.rational,
        )

    def scale(self, integer):
        return Quadratic(integer * self.rational, integer * self.radical)

    def inverse(self):
        norm = self.rational ** 2 - 2 * self.radical ** 2
        assert norm != 0
        return Quadratic(self.rational / norm, -self.radical / norm)


ONE = Quadratic(Fraction(1), Fraction(0))
TG = Quadratic(Fraction(4), Fraction(1))


def action(matrix, mode):
    x, y = mode
    return tuple(row[0] * x + row[1] * y for row in matrix)


def square_box(radius):
    return {
        (x, y)
        for x in range(-radius, radius + 1)
        for y in range(-radius, radius + 1)
        if (x, y) != ZERO
    }


def canonical_half(mode):
    sign = 1 if mode > ZERO else -1
    return tuple(sign * coordinate for coordinate in mode), sign


def preimage(mode):
    numerator = action(ADJUGATE, mode)
    if any(coordinate % DECK_ORDER for coordinate in numerator):
        return None
    return tuple(coordinate // DECK_ORDER for coordinate in numerator)


def deck_average_numerator_remainder(mode):
    """Reduce the exact deck character sum modulo the 14th cyclotomic polynomial."""
    phase_numerator = 5 * mode[0] - mode[1]
    polynomial = [0] * DECK_ORDER
    for lift in range(DECK_ORDER):
        polynomial[(phase_numerator * lift) % DECK_ORDER] += 1
    for degree in range(DECK_ORDER - 1, len(PHI_14) - 2, -1):
        leading = polynomial[degree]
        for offset, coefficient in enumerate(PHI_14):
            polynomial[degree - len(PHI_14) + 1 + offset] -= leading * coefficient
    return tuple(polynomial[: len(PHI_14) - 1])


def denominator(mode):
    x, y = mode
    return Quadratic(Fraction(y - x), Fraction(x))


def check_term(matrix, eigenvalue, b_mode):
    a_mode = action(matrix, b_mode)
    canonical_a, parity = canonical_half(a_mode)
    assert denominator(a_mode) == eigenvalue * denominator(b_mode)
    assert denominator(canonical_a) == denominator(a_mode).scale(parity)
    a_inverse = denominator(canonical_a).inverse()
    b_inverse = denominator(b_mode).inverse()
    assert a_inverse * denominator(canonical_a) == ONE
    assert b_inverse * denominator(b_mode) == ONE
    # (C,S) are independent formal channels. Strip their common exact factor 2/(2*pi).
    for cosine, sine in ((1, 0), (0, 1)):
        canonical_a_term = (
            a_inverse.scale(cosine),
            a_inverse.scale(-parity * sine),
        )
        pullback_b_term = (
            b_inverse.scale(parity * cosine),
            b_inverse.scale(-sine),
        )
        assert pullback_b_term == tuple(eigenvalue * term for term in canonical_a_term)
    return parity


def exact_cutoffs(cap, live_radius):
    boxes = {radius: square_box(radius) for radius in range(1, cap + 1)}
    a_effective = {
        radius: {b_mode for mode in box if (b_mode := preimage(mode)) is not None}
        for radius, box in boxes.items()
    }
    pairs = []
    for ka, a_box in boxes.items():
        for kb, b_box in boxes.items():
            matched_b = {mode for mode in b_box if action(J, mode) in a_box}
            assert matched_b == a_effective[ka] & b_box
            matched_a = {action(J, mode) for mode in matched_b}
            assert len(matched_a) == len(matched_b)
            assert all(tuple(-x for x in mode) in matched_a for mode in matched_a)
            pairs.append({
                "Ka": ka,
                "Kb": kb,
                "fullBRetained": matched_b == b_box,
                "allAOnImageRetained": matched_b == a_effective[ka],
                "unfilteredEqualityForAllSources": a_effective[ka] == b_box,
                "matchedConjugatePairs": len(matched_b) // 2,
            })
    assert not any(row["unfilteredEqualityForAllSources"] for row in pairs)
    assert [(row["Ka"], row["Kb"]) for row in pairs if row["fullBRetained"]] == [(6, 1), (7, 1), (8, 1)]
    assert all(row["matchedConjugatePairs"] > 0 for row in pairs if row["Ka"] >= 3)
    live = next(row for row in pairs if row["Ka"] == row["Kb"] == live_radius)
    assert live["matchedConjugatePairs"] == 0
    # Any Ka that reaches this corner necessarily admits the outside-box mode.
    for kb in boxes:
        assert max(map(abs, action(J, (kb, kb)))) == 6 * kb
        assert max(map(abs, action(J, (kb + 1, 0)))) <= 6 * kb
    return {
        "dZeroUnfilteredPairs": [[radius, radius] for radius in boxes],
        "dOnePairs": pairs,
        "dOneKb1Images": [
            [mode, action(J, mode)] for mode in sorted(boxes[1]) if mode > ZERO
        ],
        "dOneK6K1AOtherBModePreimages": sorted(a_effective[6] - boxes[1]),
        "dOneKEffective": [
            {
                "Ka": radius,
                "nonzeroModes": len(modes),
                "smallestKbCoveringAll": max((max(map(abs, mode)) for mode in modes), default=0),
            }
            for radius, modes in a_effective.items()
        ],
        "live": live,
    }


def source_controls(root):
    for path, expected in PINS.items():
        assert hashlib.sha256((root / path).read_bytes()).hexdigest() == expected, path
    header = (root / FOURIER).read_text(encoding="utf-8")
    post_signed = (root / POST_SIGNED).read_text(encoding="utf-8")
    cap = int(re.search(r"MAX_FINITE_CUTOFF=(\d+)", header)[1])
    live = int(re.search(r"finiteAuxiliaryInverse\(G,\{body,Y,cutoff:(\d+),", post_signed)[1])
    assert (cap, live) == (8, 1)
    return cap, live


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    cap, live = source_controls(args.root)
    assert action(J, (5, -1)) == (DECK_ORDER, 0)
    assert all(any((entry * lift) % DECK_ORDER for entry in (5, -1)) for lift in range(1, DECK_ORDER))
    for axis in ((1, 0), (0, 1)):
        assert action(ADJUGATE, action(J, axis)) == tuple(DECK_ORDER * x for x in axis)
    modes = square_box(cap)
    for mode in modes | {ZERO}:
        pulled = preimage(mode)
        if pulled is not None:
            assert action(J, pulled) == mode
        expected = (DECK_ORDER if pulled is not None else 0, 0, 0, 0, 0, 0)
        assert deck_average_numerator_remainder(mode) == expected
    half_lattice = sorted(mode for mode in modes if mode > ZERO)
    reversals = {}
    for d, (matrix, eigenvalue) in enumerate(((IDENTITY, ONE), (J, TG))):
        case_reversals = [mode for mode in half_lattice if check_term(matrix, eigenvalue, mode) == -1]
        reversals[d] = len(case_reversals)
        if d == 1:
            assert (1, -4) in case_reversals
        else:
            assert not case_reversals
    # Store affine power grades as (constant term, coefficient of h).
    velocity = (Fraction(1, 2), Fraction(1))
    correction_source = (2 * velocity[0] + Fraction(1, 2), 2 * velocity[1])
    temporal_factor = (Fraction(1), Fraction(1))
    assert tuple(x - y for x, y in zip(correction_source, temporal_factor, strict=True)) == velocity
    result = {
        "status": {
            "integerAndQuadraticChecks": "VERIFIED",
            "matchingActualFourierTermsOnOverlap": "CONDITIONAL_ON_CENTERED_SOURCE_TRANSPORT",
            "actualUnseenCoefficientsNumericallyEnclosed": False,
            "wholeN8Complete": False,
            "release": "HOLD",
        },
        "maximumRuntimeDiagnosticCutoff": cap,
        "livePostSignedCutoff": live,
        "exactDeckCharacterChecks": len(modes) + 1,
        "exactQuadraticTermChecks": 4 * len(half_lattice),
        "canonicalHalfLatticeSignReversals": reversals,
        "lambdaGrades": {
            "centeredResidual": list(map(str, correction_source)),
            "temporalFactor": list(map(str, temporal_factor)),
            "scaledInverseVelocity": list(map(str, velocity)),
        },
        "cutoffs": exact_cutoffs(cap, live),
    }
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
