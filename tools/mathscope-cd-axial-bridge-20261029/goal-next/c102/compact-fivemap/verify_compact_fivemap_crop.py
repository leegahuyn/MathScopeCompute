"""Closed derivative inventory for the original compact FiveMap input at C102."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


PINS={
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "mode-one":"fbe1aee25a11de039be7268f61264450bcd6673aca6b4eb889b135c3a946b5c0",
    "linear-crop":"43ec151882813aca8c17f0048df8a250967e9a0f90ccca069746c196683658e2",
    "compact-witness":"20399ca0d83b4565d5c9ef8189479fc80e0ac7fd808a1c63a70cabb1168dcf20",
    "five-map":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
}
NAMES=("beta","v","gamma")
K=Q(1,100000)
FLUX={
    "P":(("beta","beta",0),("v","v",0),("beta","gamma",1)),
    "Jz":(("beta","beta",0),("v","v",0),("gamma","gamma",0),("beta","gamma",1)),
    "Jtheta":(("v","gamma",0),),
}


def pin(p,k):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==PINS[k]
    return raw


def record_for(path):
    pin(path,"premean")
    old=runpy.run_path(str(path))["record"]
    src=inspect.getsource(old)
    replacement="for order in demands:"
    assert src.count(replacement)==1
    d={}
    exec(compile(src.replace(replacement,"for order in demands[name]:"),str(path),"exec"),
         old.__globals__,d)
    return d["record"]


def check_demands(rec,mode,crop):
    src=mode["originalSource"]["conservativeAdditionalActualComponentRequests"]
    direct={n:{tuple(x["RZL"]) for x in src if x["component"]==n} for n in NAMES}
    for entries in direct.values():
        assert entries=={(0,4,1),(0,5,0),(0,5,1),(0,6,0),(1,5,0)}
    compact={n:{(r,z) for r,z,l in jets if not l} for n,jets in direct.items()}
    beta_primitive={(max(0,r-1),z+1) for r,z in compact["beta"]}
    assert beta_primitive=={(0,6),(0,7)}
    moments={"P":max(z for r,z in compact["v"]),
             "Jz":max(z for r,z in compact["v"]),
             "Jtheta":max(z for r,z in compact["gamma"]|beta_primitive)}
    assert moments=={"P":6,"Jz":6,"Jtheta":7}
    temporal={n:set() for n in NAMES}
    branches=[]
    for key,through in moments.items():
        for j in range(through+1):
            for a,b,shift in FLUX[key]:
                for k in range(j+shift+1):
                    first=(0,k,0)
                    second=(0,j+shift-k,0)
                    temporal[a].add(first)
                    temporal[b].add(second)
                    branches.append((key,j,a,b,shift,first,second))
    assert all(d=={(0,k,0) for k in range(8)} for d in temporal.values())
    rows,cov,intg,cut,inv=rec({n:sorted(d) for n,d in temporal.items()})
    assert (len(cov),len(intg),len(cut),len(inv))==(180,55,18,34)
    all_rows,all_cov,all_int,all_cut,all_inv=rec({n:sorted(temporal[n]|direct[n]) for n in NAMES})
    strict={(n,d) for n,d in all_cov if sum(d[:2])>7}
    pure={(n,d) for n,d in cov if sum(d[:2])>7}
    assert strict==pure and len(strict)==28
    existing={(w,tuple(d)) for w,d in crop["crop"]["coveredViaEvenAndOddInterpolation"]}
    assert existing=={("W_rz",(0,8,l)) for l in range(4)}
    radial={(w,d) for w,d in strict if d[0]}
    assert radial=={(w,(1,z,l)) for w,z in (("W_rtheta",7),("W_rz",7),("W_rz",8)) for l in (0,2)}
    gamma=_highest_for_component(rec,"gamma")
    swirl=_highest_for_component(rec,"v")
    beta=_highest_for_component(rec,"beta")
    assert {entry for entry in radial if entry in swirl}=={("W_rtheta",(1,7,l)) for l in (0,2)}
    assert {entry for entry in radial if entry in gamma}=={("W_rz",(1,7,l)) for l in (0,2)}
    assert {entry for entry in radial if entry in beta}=={("W_rz",(1,z,l)) for z in (7,8) for l in (0,2)}
    radial_all_high={x for x in branches if x[-2][1]==7 or x[-1][1]==7}
    for key,j,a,b,shift,first,second in radial_all_high:
        assert {first[1],second[1]}=={0,7}
    # The ordinary R or L derivatives produced by the radial integration
    # by parts split only onto these order-zero partners or the weights.
    low_extra={n:[(0,0,0),(1,0,0),(0,0,1)] for n in NAMES}
    low_rows,lowcov,*_=rec(low_extra)
    assert max(sum(d[:2]) for _,d in lowcov)<=4
    for n,data in low_rows.items():
        by_dir={tuple(x["RZL"]):x for x in data}
        base=by_dir[(0,0,0)]
        for direction in ((1,0,0),(0,0,1)):
            row=by_dir[direction]
            assert Q(row["bandIntercept"])<=Q(base["bandIntercept"])
            assert Q(row["minEpsilon"])+K>=Q(base["minEpsilon"])
    remaining=strict-existing-radial
    before={(w,tuple(d)) for w,d in crop["crop"]["remainingSufficientNewTemporalCovarianceRows"]}
    before|={("W_rz",(0,10,l)) for l in (0,2)}
    added=remaining-before
    assert len(before)==10 and len(remaining)==18
    assert added=={(w,(0,9,l)) for w in ("W_rr","W_thetatheta","W_zz") for l in (0,2)}|{("W_thetaz",(0,8,l)) for l in (0,2)}
    return {"directHighMeanRequests":{n:sorted(x) for n,x in direct.items()},
            "fiveMapDirectRZRequests":{n:sorted(x) for n,x in compact.items()},
            "betaPrimitiveAngularRequests":sorted(beta_primitive),"fiveMapMomentAxialMaximum":moments,
            "compactTemporalVelocityRequests":{n:sorted(x) for n,x in temporal.items()},
            "compactCovarianceOperationCounts":[len(cov),len(intg),len(cut),len(inv)],
            "allLinearAndCompactOperationCounts":[len(all_cov),len(all_int),len(all_cut),len(all_inv)],
            "completeConservativeCovarianceRequests":sorted(all_cov),
            "highConservativeCovarianceRequests":sorted(strict),
            "reusedWrzZ8L":sorted(existing),"reducedRadialRequests":sorted(radial),
            "remainingSufficientNewCovarianceRequests":sorted(remaining),
            "outsidePreviousC101Ten":sorted(added)},rows,all_rows,branches


def _highest_for_component(rec,name):
    entries={n:[(0,7,0)] if n==name else [] for n in NAMES}
    return rec(entries)[1]


def grade(rows,all_rows,branches):
    data={n:{tuple(row["RZL"])[1]:row for row in values} for n,values in rows.items()}
    assert max(r["geometryPower"] for table in all_rows.values() for r in table)<=16
    assert max(Q(r["coefficientMass"]) for table in all_rows.values() for r in table)<2**32
    min_grade={}
    peak={}
    for key,j,a,b,dz,ra,rb in branches:
        first,second=data[a][ra[1]],data[b][rb[1]]
        # A radial integration-by-parts coefficient can add one explicit
        # epsilon^(-kappa). This reserves the loss on every branch.
        e=Q(first["minEpsilon"])+Q(second["minEpsilon"])+dz-K
        s=Q(first["bandIntercept"])+Q(second["bandIntercept"])+3*(j+dz)
        min_grade[key]=min(e,min_grade.get(key,e))
        extra=max(Q(0),s-(Q(1,2)+3*j))
        peak[key]=max(extra,peak.get(key,extra))
        assert (e-1)/2>Q(2,2**108)+Q(160,2**128)+extra/2**32636
    assert min(min_grade.values())>=2-3*K
    assert max(peak.values())<64
    strong=1-6*K
    direct_grade=[]
    for field,table in all_rows.items():
        for row in table:
            idx=tuple(row["RZL"])
            if idx not in ((0,4,1),(0,5,0),(0,5,1),(0,6,0),(1,5,0)):
                continue
            demanded=strong if idx==(0,5,0) else Q(1,2)-5*K
            margin=Q(row["minEpsilon"])-demanded
            assert margin>K and margin/2>Q(2,2**108)
            assert Q(row["bandIntercept"])<=Q(21,2)
            direct_grade.append([field,idx,str(Q(row["minEpsilon"])),str(demanded)])
    return {"rawQuadraticTerms":len(branches),
            "minimumQuadraticEpsilonByMoment":{k:str(v) for k,v in min_grade.items()},
            "maximumQuadraticBandSurplusBeforeAbsorption":{k:str(v) for k,v in peak.items()},
            "linearNativeWrzZTerm":"explicit epsilon in P/Jz pays the extra S^3 exactly as in C98",
            "conditionalInputCovarianceCoefficientLog":"H/2^108",
            "directLinearTemporalEpsilonComparison":direct_grade,
            "scope":"Uses the C97 coefficient/band structure and C98 slab. The current packet checks only typed grade absorption, not quantitative original high covariance."}


def main(a):
    m,c,w,f=[json.loads(pin(path,name)) for path,name in ((a.mode_one,"mode-one"),(a.linear_crop,"linear-crop"),
        (a.compact_witness,"compact-witness"),(a.five_map,"five-map"))]
    assert w["status"]=="VERIFIED_NONZERO_COMPACT_FIVEMAP_HAAR_W_RZ_Z10_OPERATOR"
    assert "compactInitializedFiveMapAttachment" in f
    inventory,rows,all_rows,branches=check_demands(record_for(a.premean),m,c)
    result={"schema":"MathScope.C102.CompactFiveMapCovarianceClosure/1",
            "status":"VERIFIED_COMPLETE_TYPED_COMPACT_FIVEMAP_COVARIANCE_CROP_CONDITIONAL_ABSOLUTE_GRADES",
            "pins":PINS,"derivativeInventory":inventory,"gradeAbsorption":grade(rows,all_rows,branches),
            "exactRadialReduction":"For beta_T retain original shifted Tchi FTC. In highest v_T and gamma_T terms, Haar and fixed radial weights move D_r(r^e·) onto the order-zero partner times the remaining radial weight. The coefficient a(R) of L has no torus dependence. Retain flat original endpoint terms in the formula.",
            "open":"The 18 selective original covariance norms, full finite compact mean coefficients, Signed source and energy remain separate.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print(len(inventory["highConservativeCovarianceRequests"]),
          len(inventory["remainingSufficientNewCovarianceRequests"]),result["gradeAbsorption"]["rawQuadraticTerms"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p=ArgumentParser()
    for n in ("premean","mode-one","linear-crop","compact-witness","five-map","out"):
        p.add_argument("--"+n,type=Path,required=True)
    main(p.parse_args())
