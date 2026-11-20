"""Replay original late mean recurrence for the ordinary cofactor directions."""

import argparse
from hashlib import sha256
import inspect
from itertools import product
import json
from pathlib import Path
import runpy


def read(path, pin):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == pin, path
    return raw


def footprint(goal):
    recurrence = goal / "c105/late-grade/verify_late_grade.py"
    recurrence_sha = "b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc"
    read(recurrence, recurrence_sha)
    original = runpy.run_path(str(recurrence))
    code = inspect.getsource(original["calculus"])
    head = code.index("    def background")
    tail = code.index("    for label,output in")
    source = """def probe(wanted):
    cutoff, waveseen, oldseen, bgseen, primitive, forcing = (set() for _ in range(6))
    zero = NORM(10*EPS, 0, 0, 0)

    def W(f,a):
        waveseen.add((f,a))
        return NORM(0,0,1,0)

    def old(f,a,compact=False):
        oldseen.add((f,a,compact))
        return NORM(0,0,1,0)

""" + code[head:tail] + """    for f in ("beta","v","gamma"):
        for a in wanted:
            late(f,a)
    return {"W":waveseen,"old":oldseen,"background":bgseen,
            "cutoff":cutoff,"primitive":primitive,"inverseRHS":forcing}
"""
    scope = dict(original)
    exec(compile(source, str(recurrence), "exec"), scope)
    allowed = sorted(a for a in product(range(3), repeat=4) if sum(a) <= 2 and a[2] <= 1)
    assert len(allowed) == 14
    found = scope["probe"](allowed)
    counts = {key: len(rows) for key, rows in found.items()}
    assert all(not compact for _, _, compact in found["old"])
    assert all(0 <= sum(a) < 14 for _, a in found["W"])
    assert any(a[2] == 2 for _, a, _ in found["old"])

    # All selected W+ atoms are from the original recurrence. These ranks
    # describe its conservative dependency set, without a bound on any atom.
    caps = {
        "slow": max(sum(x[:3]) for _, x in found["W"]),
        "T": max(x[2] for _, x in found["W"]),
        "L": max(x[3] for _, x in found["W"]),
    }
    return {
        "status": "VERIFIED_DEPENDENCY_PROJECTION_LATE_ORDINARY_MEAN_CONSERVATIVE_ONLY",
        "sourceRecurrenceSHA256": recurrence_sha,
        "targetDirectionsWithoutN": allowed,
        "directionOrder": ["R", "Z", "T", "L"],
        "explicitNoFinalTT": True,
        "ordinaryCofactorOutputCount": 3*len(allowed),
        "counts": counts,
        "conservativePostSignedOrders": caps,
        "inputs": {key: sorted(rows) for key, rows in found.items()},
        "retainedOriginalSources": [
            "centered original nonfast swirl and axial inverses, with L² Fourier partners",
            "the original two-ended shifted primitive and its cutoff derivatives",
            "original fast pressure beta correction and initial centered potential",
        ],
        "open": ["N-direction differentiated source", "estimated envelopes of new source atoms",
                 "ledger of all four flat subtraction derivatives", "whole actual radial C1"],
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--goal", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    a = p.parse_args()
    result = footprint(a.goal)
    a.out.write_bytes((json.dumps(result, indent=2, sort_keys=True) + "\n").encode())
    print(result["counts"], result["conservativePostSignedOrders"])
