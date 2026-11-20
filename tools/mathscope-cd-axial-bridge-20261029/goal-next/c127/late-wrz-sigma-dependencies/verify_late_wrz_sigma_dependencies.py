"""Reproduce the next four exact original Signed Sigma operand censuses."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path

PINS={
    "C125recurrence":"12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec",
    "C125dependencies":"569745cf430a3db4698606771aa4cd670271d308def13ba508e2007f068d3c8b",
    "C126frontier":"5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19",
}

def pin(path,key,as_json=True):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if as_json else raw

def main(a):
    old=pin(a.c125_dependencies,"C125dependencies")
    frontier=pin(a.frontier,"C126frontier")
    pin(a.c125_recurrence,"C125recurrence",False)
    # Enlarge only the size of the artificial readback bank.
    template=pin(a.c125_recurrence,"C125recurrence",False).decode()
    bank="directions = tuple(product(range(4),range(7),range(3)))"
    assert template.count(bank)==1
    augmented=template.replace(bank,"directions = tuple(product(range(4),range(9),range(3)))")
    assert augmented.replace("directions = tuple(product(range(4),range(9),range(3)))",bank)==template
    original={"__name__":"c125_native_recurrence","__file__":str(a.c125_recurrence)}
    exec(compile(augmented,str(a.c125_recurrence),"exec"),original)
    compiled=original["pinned"](a.goal)
    ops=compiled["arithmetic"]
    trace=original["trace"]
    roles=original["roles"]
    regions=original["REGIONS"]
    targets=tuple(map(tuple,frontier["pointwiseRequests"][0]["newPositiveTSigmaDirections"]))
    assert targets==((0,3,1),(0,4,1),(1,2,1),(1,3,1))
    assert [list(x) for x in targets]==frontier["pointwiseRequests"][1]["newPositiveTSigmaDirections"]
    assert old["roots"]==[22001223,22001224,22000443]
    assert old["fixedEndpoints"]==frontier["originalGraph"]["fixedEndpoints"]==[17743711,17743713]
    prior_targets=tuple(map(tuple,old["priorSigmaRequests"]+old["newSigmaRequests"]))
    prior={str(x):{r:trace(ops,x,r) for r in regions} for x in prior_targets}
    new={str(x):{r:trace(ops,x,r) for r in regions} for x in targets}
    old_cov=roles(prior,"covariance")
    assert old_cov=={(f,tuple(x)) for f,x in old["allRequiredCovarianceRoles"]} and len(old_cov)==48
    cov=roles(new,"covariance")
    new_cov=cov-old_cov
    active_t={x for x in new_cov if x[1][2]}
    all_cov=old_cov|cov
    assert ("rz",(0,6,1)) in active_t
    spatial=compiled["spatial"]
    covered_spatial={(f,tuple(x)) for row in spatial["regions"].values() for f,x in row["trace"]["covariance"]}
    zero_t_spatial={(f,x) for f,x in new_cov if x[2]==0}
    compact_old=roles(prior,"compactMean")
    compact=roles(new,"compactMean")-compact_old
    compact_tt={(f,x) for f,x in compact if x[2]>=2}
    assert ("beta",(0,5,2)) in compact_tt
    local=lambda traces:{tuple(x) for rows in traces.values() for row in rows.values() for x in row["localStress"]}
    first=next(x for x in targets if x==(0,4,1))
    needed_for_first=roles({str(first):new[str(first)]},"covariance")
    assert ("rz",(0,6,1)) in needed_for_first
    old_directions={tuple(x) for x in old["gaugeDirectionsFromCovariance"]}
    wave_directions={(a[0]+b[0],a[1]+b[1],a[2],b[2])
                     for _,i in all_cov for a in product(*(range(u+1) for u in i))
                     for b in ((0,0,0),(1,0,0),(0,1,0),(0,0,1))}
    assert old_directions<=wave_directions
    report={"schema":"MathScope.C127.OriginalLateWrzAdditionalSignedSigmaDependencies/1",
      "status":"VERIFIED_EXACT_NATIVE_DEPENDENCY_CENSUS_NEW_BOUNDS_OPEN",
      "pins":PINS,"roots":old["roots"],"fixedEndpoints":old["fixedEndpoints"],"targetRZT":targets,
      "priorCovarianceCount":len(old_cov),"completeCovarianceCount":len(all_cov),
      "newPreSignedCovariance":sorted(new_cov),"newPositiveTPreSignedCovariance":sorted(active_t),
      "newZeroTAlreadyAttachedToC108":sorted(zero_t_spatial&covered_spatial),
      "newZeroTOutsideC108":sorted(zero_t_spatial-covered_spatial),
      "newCompactMeanAllOrders":sorted(compact),"newCompactMeanSecondTimeOnly":sorted(compact_tt),
      "newLocalStressDirections":sorted(local(new)-local(prior)),
      "newPreSignedGaugeDirections":sorted(wave_directions-old_directions),
      "perTarget":{"Z3T":sorted(roles({str(targets[0]):new[str(targets[0])]},"covariance")-old_cov),
                   "Z4T":sorted(needed_for_first-old_cov),
                   "RZ2T":sorted(roles({str(targets[2]):new[str(targets[2])]},"covariance")-old_cov),
                   "RZ3T":sorted(roles({str(targets[3]):new[str(targets[3])]},"covariance")-old_cov)},
      "scope":"Pointwise four native target directions using the original conservative three-region trace. The two R-mixed target requests may move inside the separately proved shifted inner pressure integral formula, with product and endpoint obligations. No placeholder bound is credited as a measurement.",
      "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("PASS original covariance requests",len(old_cov),len(new_cov),"new positive T",len(active_t),
          "compact TT",len(compact_tt),"new local",len(local(new)-local(prior)))

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for key in ("goal","c125-dependencies","c125-recurrence","frontier","out"):
        p.add_argument("--"+key,type=Path,required=True)
    main(p.parse_args())
