"""Verify a zero strip around the original common-torus nearest-copy seams."""

import argparse
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "family": ("runtime", "mathscope-m2/navier/actual-common-admissible-family.mjs",
               "7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75"),
    "pressure": ("runtime", "mathscope-m3/navier/source-global-pressure.mjs",
                 "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "band": ("runtime", "mathscope-m3/navier/source-global-band.mjs",
             "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "dispatch": ("goal", "c134/indexed-dispatch/indexed-dispatch.json",
                 "26be2e8531920231755b1fe9225845da35bc576144d0431372152fc7d33f2a8e"),
}


def dot(left, right):
    # Exact arithmetic in Q(sqrt(2)).
    products = [(a*c+2*b*d, a*d+b*c) for (a,b),(c,d) in zip(left,right,strict=True)]
    return tuple(map(sum, zip(*products, strict=True)))


def verify(roots):
    inputs = {}
    for key,(scope,leaf,fingerprint) in PINS.items():
        path = roots[scope] / leaf
        raw = path.read_bytes()
        assert sha256(raw).hexdigest() == fingerprint, path
        inputs[key] = json.loads(raw) if path.suffix == ".json" else raw.decode()
    assert "r0=q(1,1n<<34n)" in inputs["family"]
    assert "Ls=G.div(G.mul(q(2),r0),ci)" in inputs["band"]
    assert "rectangleBasis:[[G.one,G.sub(G.one,G.sqrt(q(2)))],[G.sub(G.sqrt(q(2)),G.one),G.one]]" in inputs["band"]
    assert "Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2))))" in inputs["band"]
    for literal in (
        "copy=mappedY.map((x,j)=>floor(G.add(G.sub(x,center[j]),G.q(1,2))))",
        "offset=mappedY.map((x,j)=>G.sub(G.sub(x,center[j]),copy[j]))",
        "xi=G.div(dot(G,vr,offset),Dgeom),eta=G.div(dot(G,vt,offset),Dgeom),v=G.div(G.add(eta,r0),ci)",
    ):
        assert literal in inputs["pressure"], literal
    layout = inputs["dispatch"]
    assert layout["signRows"] == 162 and layout["boxes"] == 81
    assert all(len(row["fixedArguments"]) == 16 and len(row["registeredOuterGuards"]) == 5
               for row in layout["rows"])
    assert layout["registryBeforeAndAfter"] == 29 and layout["liveRepeatIndexedFields"] == 0
    v_r, v_t = ((1,0),(1,-1)), ((-1,1),(1,0))
    assert dot(v_r,v_t) == (0,0)
    assert dot(v_r,v_r) == dot(v_t,v_t) == (4,-2)
    r0 = Q(1, 2**34)
    cover_bound = 2*r0
    switch_distance = Q(1,2)
    strip = Q(1,4)
    assert cover_bound == Q(1,2**33) < switch_distance-strip
    return {
        "schema": "MathScope.C138.OriginalNearestCopyRadialCorner/1",
        "status": "CONDITIONAL_FIXED_LABEL_NEAREST_COPY_ZERO_STRIP",
        "pins": PINS, "existingSignRows": layout["signRows"],
        "r0": str(r0), "strictSupportOffsetInfinityBound": str(cover_bound),
        "copySwitchOffset": str(switch_distance), "twoSidedOpenStripRadius": str(strip),
        "argument": [
            "0<v<2*r0/ci with ci>0 gives |eta_aux|<r0, and the original transverse guard gives |xi|<r0",
            "The exact orthogonal basis gives offset=xi*v_r+eta_aux*v_t and each basis component has absolute value at most one",
            "Both nearest copies near |offset_j|=1/2 have offset coordinate magnitude >1/4, so at least one actual fast guard selects zero on a neighborhood",
        ],
        "conditions": [
            "The original fixed label, matrix power, sign and center are retained",
            "Own and reference slow-chart evaluations used by the outer guards are admitted",
            "The original outer guard and local rectangle are the ones from the pinned row layout",
        ],
        "simultaneousRadialAndNearestCopyAtThisLabel": "CONDITIONAL_IDENTICALLY_ZERO",
        "allPhysicalLabelChanges": "OPEN", "newIndexedRegistration": "OPEN",
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("goal", "runtime", "out"):
        p.add_argument("--"+name, required=True, type=Path)
    args = vars(p.parse_args())
    output = args.pop("out")
    result = verify(args)
    output.write_bytes((json.dumps(result, indent=2, sort_keys=True)+"\n").encode())
    print(result["status"])
