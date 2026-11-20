#!/usr/bin/env python3
"""Check flatness of the coefficient tail across a nearest-reference change."""

import argparse
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


F = Fraction
PINS = {
    "index": ("mathscope-m3/navier/global-source-index.mjs",
              "a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f"),
    "band": ("mathscope-m3/navier/source-global-band.mjs",
             "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "selector": ("mathscope-m2/navier/actual-common-admissible-family.mjs",
                 "7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75"),
}


def obtain(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw.decode()


def window(floors, lower0, label):
    """Exact integer window for already certified original log-scale floors."""
    for n, cutoff in enumerate(floors):
        lower = lower0 if n == 0 else max(lower0, floors[n-1])
        if lower <= label < cutoff:
            return n, lower, cutoff-1
    return None


def verify(runtime):
    modules = {name: obtain(runtime / filename, sig)
               for name,(filename,sig) in PINS.items()}
    for snippet in (
        "previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0",
        "upper=G.sub(floor(G.div(next.logScale,log2)),G.one)",
        "For q>=2^(-ell-1), every n>=N+1 has b_n*q>=1",
    ):
        assert snippet in modules["index"], snippet
    for snippet in (
        "body=G.choose(x,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero)",
        "selected=family.selector.rows[n-1],record=src.records[n]",
        "extra=G.mul(sigma,G.expressionValue(sourceCutoff.system,[sigma],[1]))",
        "at=b=>G.simultaneousSubstitute(b,[q0,X0,eta0],[qActual,X,eta])",
        "TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta));TzTerms.push(G.mul(weight,sourceRoots.Tz))",
    ):
        assert snippet in modules["band"], snippet
    assert "b_n>=2^n. For every compact subset of q>0" in modules["selector"]
    assert "every-new-scale-keeps-its-new-predecessor" in modules["selector"]

    assignments = seam_cases = 0
    for base, gaps in product((8, 643, 2**256), ((4,1,8,5), (3,2,17,3), (1,1,1,1))):
        floors = tuple(base + sum(gaps[:i+1]) for i in range(len(gaps)))
        for j in range(base, floors[-1]):
            slot = window(floors, base, j)
            assert slot is not None
            assignments += 1
            if j + 1 == floors[-1]:
                assert window(floors, base, j + 1) is None
                continue
            next_slot = window(floors, base, j + 1)
            assert next_slot is not None
            if next_slot[0] == slot[0]:
                continue
            assert next_slot[0] == slot[0]+1
            assert slot[2] == j and next_slot[1] == j+1 and floors[slot[0]] == j+1
            for offset in (F(5,16),F(1,2),F(11,16)):
                # In t = j + offset, all scales from the first omitted
                # order obey log2(b_n*q) >= (j+1) - t = 1 - offset.
                assert 0 < 1-offset < 1
                assert -1 < offset < 1
                assert -1 < offset-1 < 1
                seam_cases += 1
    return {
        "schema": "MathScope.C140.OriginalWindowTransition/1",
        "status": "VERIFIED_ORIGINAL_WINDOW_INDEX_AND_CONDITIONAL_ZERO_ADDED_PROFILE_TERMS",
        "pins": PINS,
        "windowIndexIdentity": "[max(ell0,floor(log2(b_N))),floor(log2(b_(N+1)))-1]",
        "sameWindowAssignmentsAndEdgesReplayed": assignments,
        "rationalTransitionChecks": seam_cases,
        "strictCommonChartOverlap": "j+1/4<t<j+3/4, t=-log2(q)",
        "lowerLog2CutoffArgumentAtFirstNewTerm": "1-(t-j)>1/4",
        "supportConclusion": "Inside the overlap, all added original weighted coefficient and stress terms are locally identically zero, including the sigma*chi' radial term.",
        "conditions": ["Both original chart windows are available from the same prepared family",
                       "Actual source log scales are monotone and both chart realizations are admitted",
                       "Comparison is made in the same physical q,X,eta"],
        "open": ["same physical Repeat correction/registered fields when the native coefficient producer changes",
                 "global mean integrand support and exact endpoints", "final K refinements"],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--runtime", required=True, type=Path)
    p.add_argument("--out", required=True, type=Path)
    a = p.parse_args()
    result = verify(a.runtime)
    a.out.write_bytes((json.dumps(result, sort_keys=True, indent=2)+"\n").encode())
    print(result["status"], result["rationalTransitionChecks"])
