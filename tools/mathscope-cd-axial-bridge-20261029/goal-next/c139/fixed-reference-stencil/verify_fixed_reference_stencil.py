#!/usr/bin/env python3
"""Verify the same-reference nearest-band and nearest-mesh stencil join."""

import argparse
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


F = Fraction
RADIUS = F(3, 4)
PINS = {
    "partition": ("runtime", "mathscope-m2/navier/actual-covariance-global-assembly.mjs",
                  "bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc"),
    "assembly": ("runtime", "mathscope-m2/navier/actual-covariance-source-certificate.mjs",
                 "c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681"),
    "current": ("runtime", "mathscope-m3/navier/source-global-current.mjs",
                "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
    "cover": ("runtime", "mathscope-m3/navier/source-global-pressure.mjs",
              "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "dispatch": ("goal", "c134/indexed-dispatch/indexed-dispatch.json",
                 "26be2e8531920231755b1fe9225845da35bc576144d0431372152fc7d33f2a8e"),
}


def read_inputs(roots):
    values = {}
    for key, (scope, name, expected) in PINS.items():
        path = roots[scope] / name
        raw = path.read_bytes()
        assert sha256(raw).hexdigest() == expected, path
        values[key] = json.loads(raw) if path.suffix == ".json" else raw.decode()
    for key, patterns in (
        ("partition", (
            "const indices=[-1,0,1]",
            "G.q(1,4),G.q(3,4),G.one,G.step",
            "const squares=bumps.map(b=>G.pow(b,2)),denominator=G.add(...squares)",
            "denominatorLower:G.q(1,4)",
        )),
        ("assembly", (
            "nearestBand=floor(G.add(bandCoordinate,q(1,2)))",
            "nearestMesh=meshCoordinates.map(x=>floor(G.add(x,q(1,2))))",
            "const ell=G.add(nearestBand,q(relativeBand)),Q=G.exp(G.neg(G.mul(ell,G.log(q(2))))),ratio=G.div(g.Q,Q)",
            "let color=mod(band.ell,9)",
            "for(const a of grid)color=G.add(G.mul(q(5),color),mod(a,5))",
        )),
        ("current", (
            "bandAxis=fixedLabelSourcePartitionFactor(G,G.sub(bandCoordinate,ell))",
            "G.pow(ell,6),x),band.meshLabels[j]",
        )),
        ("cover", (
            "i=paletteIndex(b.ell),delta=G.sub(i,baseIndex)",
            "matrix:b.matrix.value,center:label.centers[signIndex]",
            "guards=[[band.chart.X,G.parameter('Xa'),band.chart.Xb]",
        )),
    ):
        assert all(pattern in values[key] for pattern in patterns), key
    return values


def active(offset, center):
    return tuple(label for label in range(center - 1, center + 2)
                 if abs(offset - label) < RADIUS)


def color(label, grid, sign):
    number = label % 9
    for index in grid:
        number = 5 * number + index % 5
    return F(2 * number + (sign == -1) + 1, 1048576)


def stencil(reference_label, band_x, band_center, mesh, mesh_choices):
    labels = {}
    for label in active(band_x, band_center):
        grid_axes = [active(x, center) for x, center in zip(mesh[label], mesh_choices[label], strict=True)]
        for *grid, sign in product(*grid_axes, (1, -1)):
            key = (label, *grid, sign)
            labels[key] = {
                "center": color(label, grid, sign),
                "bandOffset": band_x - label,
                "meshOffsets": tuple(x - j for x, j in zip(mesh[label], grid, strict=True)),
                "referenceBandDifference": reference_label - label,
                "derivativeScales": ("(Q_ref/Q_own)^1/2", "(Q_ref/Q_own)^D", "Q_ref/Q_own"),
            }
    return labels


def verify(roots):
    data = read_inputs(roots)
    dispatch = data["dispatch"]
    assert dispatch["boxes"] == 81 and dispatch["signRows"] == 162
    assert {row["sign"] for row in dispatch["rows"]} == {1, -1}
    assert all(len(row["registeredOuterGuards"]) == 5 for row in dispatch["rows"])
    trials = 0
    for center, d in product((0, 15, -(2**256), 2**256), (F(5, 16), F(1, 2), F(11, 16))):
        x = center + d
        assert min(abs(x - (center - 1)), abs(x - (center + 2))) >= F(5, 4)
        assert active(x, center) == active(x, center + 1) == (center, center + 1)
        # Vary the original three mesh coordinates separately in the two
        # retained absolute bands. Each can be on either side of its tie.
        mesh = {j: (j + F(7,16), -j + F(9,16), j + F(1,2)) for j in (center, center + 1)}
        first = {j: (j, -j, j) for j in mesh}
        expected = stencil(center, x, center, mesh, first)
        assert len(expected) == 32
        for choice in product((0, 1), repeat=7):
            second = {j: tuple(a+c for a, c in zip(first[j], choice[1+3*k:4+3*k], strict=True))
                      for k,j in enumerate(mesh)}
            assert stencil(center, x, center + choice[0], mesh, second) == expected
            trials += 1
    # At a half-integer both nearest absolute labels really can be active.
    assert active(F(1,2), 0) == (0,1) and 0 in active(F(1,2), 1)
    assert RADIUS < F(5, 4) and F(1,4) < F(1,2) < F(3,4)
    return {
        "schema": "MathScope.C139.FixedReferenceStencilJoin/1",
        "status": "VERIFIED_FIXED_REFERENCE_STENCIL_ALGEBRA_CONDITIONAL_FIELD_TRANSFER",
        "pins": PINS, "exactTrials": trials, "originalCandidateBoxes": 81, "signedRegistryRows": 162,
        "maxPositiveSignedRowsInTrial": 32,
        "openSwitchNeighborhood": "(k+1/4,k+3/4)",
        "enteringAndDepartingDistances": "strictly greater than 5/4 throughout the neighborhood",
        "normalizer": "The same active absolute translates appear in both sums of bump squares locally.",
        "fieldTransfer": "On a fixed valid reference chart, each retained absolute band+mesh+sign has the same original operands and the same branch body. Outer guards kill entering and departing rows on an open neighborhood. Consequently derivatives of the resulting same local functions agree wherever the retained summands have those derivatives.",
        "independent": ["reference label change", "actual active indexed registration", "outer q boundary", "full K field and final jets"],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for key in ("runtime", "goal", "out"):
        p.add_argument("--"+key, type=Path, required=True)
    args = vars(p.parse_args())
    output = args.pop("out")
    result = verify(args)
    output.write_bytes((json.dumps(result, sort_keys=True, indent=2)+"\n").encode())
    print(result["status"], result["exactTrials"])
