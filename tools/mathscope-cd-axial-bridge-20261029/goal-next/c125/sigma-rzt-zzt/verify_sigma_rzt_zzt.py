"""Trace native Signed Sigma_RZT and Sigma_ZZT without assuming their bounds."""
import argparse
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

TARGETS = ((1,1,1),(0,2,1))
REGIONS = ("inner","outer","middle")
PAIRS = {"rr":("beta","beta"),"rtheta":("beta","v"),"rz":("beta","gamma"),
         "thetatheta":("v","v"),"thetaz":("v","gamma"),"zz":("gamma","gamma")}
FIELDS = ("beta","v","gamma")
PINS = {
    "arithmetic": ("c108/early-sigma-c6/verify_sigma_c6.py",
                   "f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8"),
    "spatial": ("c108/early-sigma-c6/early-sigma-c6.json",
                "d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "oldDemand": ("c119/signed-time-covariance/signed-time-dependencies.json",
                  "b79de2c9bd9737b6aec215c0af95af8dc56eab644383d81e77bea9859d63fce9"),
    "oldCovariance": ("c119/signed-time-covariance/mixed-signed-time-covariance.json",
                      "18b36ba6fceb10cc448f24361dd6c8e7a2a0e3f3c69dabee966102418f508f7f"),
}


def pinned(goal):
    """Load only the exact existing Signed recurrence and its evidence."""
    result = {}
    for name, (rel, digest) in PINS.items():
        path = goal/rel
        raw = path.read_bytes()
        assert sha256(raw).hexdigest() == digest, path
        result[name] = runpy.run_path(str(path)) if path.suffix == ".py" else json.loads(raw)
    return result


def trace(ops, a, region):
    # Placeholder norm scalars expose the original signed conservative
    # dependency graph. No placeholder bound is part of the output evidence.
    directions = tuple(product(range(4),range(7),range(3)))
    wave = {(name,j):ops["Bound"](ops["E"],0,0,0) for j in directions for name in PAIRS}
    mean = {(f,(*j,0)):{"minEpsilon":"1","bandIntercept":"1/2"} for j in directions for f in FIELDS}
    pairs = {(name,(*j,0)):[(f,(*b,0),g,(*c,0),k) for b,c,k in ops["splits"](j)]
             for name,(f,g) in PAIRS.items() for j in directions}
    collar = {name:(None,{(f,j):{"epsilon":"2","band":"1"} for f in PAIRS for j in directions},0)
              for name in ("inner","outer")}
    roots = {"weightedSigmaSpatialOrders":[list(a)],
             "localWeightedRadialFlux":[list(j) for j in product(*(range(i+1) for i in a))]}
    _, deps = ops["arithmetic"]({},roots,mean,pairs,collar,wave,region)
    return deps


def roles(roots, family):
    return {(f,tuple(a)) for regions in roots.values() for row in regions.values()
            for f,a in row[family]}


def main(goal):
    d = pinned(goal)
    ops, old = d["arithmetic"], d["oldDemand"]
    spatial = d["spatial"]
    assert old["roots"] == [*spatial["SigmaApplications"],spatial["incrementalPressureZ"]] == [
        22001223,22001224,22000443]
    assert old["fixedEndpoints"] == spatial["fixedRadialEndpoints"] == [17743711,17743713]
    prior_targets = tuple(map(tuple,old["exactSigmaRequests"]))
    prior = {str(a):{r:trace(ops,a,r) for r in REGIONS} for a in prior_targets}
    cov0 = roles(prior,"covariance")
    assert cov0 == {(f,tuple(j)) for f,j in old["allRequiredCovarianceRoles"]}
    new = {str(a):{r:trace(ops,a,r) for r in REGIONS} for a in TARGETS}
    cov = roles(new,"covariance")
    delta = cov-cov0
    assert len(cov0) == 35 and len(delta) == 13 and ("rz",(0,4,1)) in delta
    all_cov = cov0|cov
    covered_spatial = {(f,tuple(j)) for row in spatial["regions"].values()
                       for f,j in row["trace"]["covariance"]}
    old_bounds = {tuple(x["RZTL"]) for x in d["oldCovariance"]["covarianceRows"]
                  if x["allSixComponents"]}
    active_t_missing = {(f,a) for f,a in cov if a[2] and (*a,0) not in old_bounds}
    assert active_t_missing == {("rz",(0,4,1)),("rtheta",(1,1,1)),("rz",(1,1,1))}
    assert {(f,a) for f,a in delta if a[2] == 0} <= covered_spatial
    tt0 = {(f,a) for f,a in roles(prior,"compactMean") if a[2] >= 2}
    tt = {(f,a) for f,a in roles(new,"compactMean") if a[2] >= 2}
    assert tt-tt0 == {("beta",(0,3,2)),("v",(0,2,2)),("gamma",(0,2,2))}
    directions = {(a[0]+b[0],a[1]+b[1],a[2],b[2])
                  for _,i in all_cov for a in product(*(range(u+1) for u in i))
                  for b in ((0,0,0),(1,0,0),(0,1,0),(0,0,1))}
    old_directions = {tuple(a) for a in old["gaugeDirectionsFromCovariance"]}
    assert len(old_directions) == 30 and old_directions <= directions
    assert (0,5,1,0) in directions-old_directions
    local = sorted({tuple(a) for regions in new.values() for row in regions.values()
                    for a in row["localStress"]})
    assert local == [(0,1,1),(0,2,1),(1,1,1)]
    return {
        "schema":"MathScope.C125.OriginalSignedSigmaRZTZZTDependencyCensus/1",
        "status":"VERIFIED_ORIGINAL_OPERATOR_DEPENDENCIES_OPEN_NEW_NATIVE_BOUNDS",
        "pins":PINS,"roots":old["roots"],"fixedEndpoints":old["fixedEndpoints"],
        "priorSigmaRequests":prior_targets,"newSigmaRequests":TARGETS,
        "allRequiredCovarianceRoles":sorted(all_cov),
        "newTypedCovarianceRoles":sorted(delta),
        "positiveTNotCoveredByExistingAllSixRows":sorted(active_t_missing),
        "zeroTAddedTypesCoveredByC108":sorted((f,a) for f,a in delta if a[2]==0),
        "secondTimeMeanRoles":sorted(tt0|tt),"newSecondTimeMeanRoles":sorted(tt-tt0),
        "gaugeDirectionsFromCovariance":sorted(directions),
        "newGaugeDirectionsFromCovariance":sorted(directions-old_directions),
        "localStressRequests":local,"newSourceTraces":new,
        "scope":"Dependency census of actual incremental pressure, fixed shifted moments and two Signed kernels. The produced table contains no assumed or measured numerical cap for the new analytic inputs.",
        "finalJets":0,"release":"HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--goal",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args = parser.parse_args()
    report = main(args.goal)
    args.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("PASS actual Sigma_RZT/ZZT recurrence",
          len(report["allRequiredCovarianceRoles"]),len(report["newGaugeDirectionsFromCovariance"]))
