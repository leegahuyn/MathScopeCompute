"""Use the original shifted FTC to reduce the ordinary Temporal mean footprint."""

import argparse
from hashlib import sha256
import inspect
from itertools import product
import json
from pathlib import Path
import runpy


def pinned_file(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected
    return raw


def verify(goal, work):
    path = goal / "c105/late-grade/verify_late_grade.py"
    pins = [
        "b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc",
        "3c9cf3fbf41b554761a6cc195d183f5035b25065425473059bf25134db414e80",
        "13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a",
    ]
    old = json.loads(pinned_file(goal / "c135/radial-mean-cofactors/late-ordinary.json", pins[1]))
    ftc = json.loads(pinned_file(work / "continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json", pins[2]))
    assert old["counts"]["W"] == 280 and old["counts"]["old"] == 373
    # The synchronized originals include the two oriented endpoint traces and
    # the remaining nested pressure primitive. Only dependencies are tracked here.
    assert ftc["actualSource"] == {"potential": 22150943, "separateFiveMapPotential": 22151952,
                                  "pressureZ": 22031648, "centeredAxialSource": 22032008}
    assert "Both projected endpoint traces vanish" in ftc["proof"]
    assert ftc["lean"]["theorems"] == ["late_centered_radial_derivative", "late_centered_fast_time_cancel"]
    pinned_file(path, pins[0])
    scope = runpy.run_path(str(path))
    raw = inspect.getsource(scope["calculus"])
    start = raw.index("    def background")
    end = raw.index("    for label,output in")
    body = raw[start:end]
    suppress = "return add(primitive_part(name,a,False),cutoff_whole(name,a))"
    assert body.count(suppress) == 1
    body = body.replace(suppress, "return primitive_part(name,a,False)")
    source = """def probe(want):
    zero=NORM(10*EPS,0,0,0)
    cutoff,waveseen,oldseen,bgseen,primitive,forcing=(set() for _ in range(6))

    def W(f,a):
        waveseen.add((f,a))
        return NORM(0,0,1,0)

    def old(f,a,compact=False):
        assert not compact
        oldseen.add((f,a,compact))
        return NORM(0,0,1,0)

""" + body + r"""
    fields["weightedOrientedZ"] = lambda a:rad_weight(remainder,a,1)

    @cache
    def inverse_of(label, expr, a):
        forcing.add((label,a))
        return add(expr(a),expr(shift(a,3,2)))

    @cache
    def radial_density(a):
        return add(Zflux(a),scale(radial(gamma,a),e=EPS))

    @cache
    def radial_inverse(a):
        return inverse_of("shiftedBoundaryRadialFlux",radial_density,a)

    @cache
    def axial_remainder(a):
        return add(scale(gamma(shift(a,2)),e=EPS),
                   scale(flux("z",shift(a,1),False),e=EPS),
                   scale(gamma(shift(a,1,2)),e=3*EPS),
                   scale(p_far(a),e=EPS))

    @cache
    def remainder(a):
        pressure_time=scale(Tchi("oldBeta",shift(a,1)),e=EPS)
        return add(inverse_of("nonradialAxialRemainder",axial_remainder,a),pressure_time)

    @cache
    def potential(a):
        return add(old_temporal_psi(a),radial_inverse(a),
                   rad_weight(lambda b:Tchi("weightedOrientedZ",b),a,-1))

    for a in want:
        add(old("beta",a),scale(potential(shift(a,1)),e=EPS))
        add(old("v",a),Q0("theta",a))
        add(old("gamma",a),De(radial_inverse,a,1),remainder(a))
    return {"W":waveseen,"old":oldseen,"background":bgseen,
            "cutoffDerivativesAwayFromTransition":cutoff,"primitive":primitive,"inverseRHS":forcing}
"""
    exec(compile(source, str(path), "exec"), scope)
    targets = sorted(a for a in product(range(3), repeat=4) if sum(a) <= 2 and a[2] <= 1)
    found = scope["probe"](targets)
    assert not found["cutoffDerivativesAwayFromTransition"]
    previous = {key: {(r[0], tuple(r[1]), *r[2:]) for r in old["inputs"][key]} for key in ("W", "old")}
    assert found["W"] <= previous["W"] and found["old"] <= previous["old"]
    caps = {key: {"slow": max(sum(a[:3]) for _, a, *_ in found[key]),
                  "L": max(a[3] for _, a, *_ in found[key]),
                  "T": max(a[2] for _, a, *_ in found[key])} for key in ("W", "old")}
    return {
        "status": "VERIFIED_ORIENTED_TEMPORAL_MEAN_DEPENDENCY_REDUCTION",
        "pins": pins, "targetDirections": targets, "directionOrder": ["R","Z","T","L"],
        "counts": {key: len(roles) for key, roles in found.items()},
        "caps": caps,
        "inputs": {key: sorted(roles) for key, roles in found.items()},
        "remainingVsConservative": {key: len(previous[key]-found[key]) for key in previous},
        "outerOrientation": "-integral from R to fixed upper endpoint, with full shifted upper trace",
        "wholeRadialCorrection": "original whole term is included by the upper oriented primitive; derivatives of the collar cutoff are locally zero",
        "unresolved": "Exact derivative envelopes for all remaining donors, and the complete radial C1 source",
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("goal", "work", "out"):
        p.add_argument("--" + name, required=True, type=Path)
    a = p.parse_args()
    result = verify(a.goal, a.work)
    a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
    print(result["counts"], result["caps"])
