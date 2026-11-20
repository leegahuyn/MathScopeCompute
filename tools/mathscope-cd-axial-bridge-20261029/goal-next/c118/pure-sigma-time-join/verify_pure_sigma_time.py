"""Join the actual early Signed pure-T inputs in the original weighted flux routine."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path
import runpy

PINS = {
    "arithmetic":"f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8",
    "nativeSigma":"d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f",
    "compactMean":"3ec640563531208b18f019167174e7c39db1c744e937f834d313eeefafd86e14",
    "noncompactMean":"75dae2662614f581f41ac7db09fe41dc01a0fed81cf7e0853f1fcfc3be5e4126",
    "modeTwo":"188d2db5d5b9b860bb4826d4d2da056ea93ac0273ec870f00a36adf20f484e7a",
    "localStress":"3ec60e03a9ae128ed546bc67256692ed2241e76be3261b8618761264ebcb9dd5",
}
MEAN_PAIRS = {
    "rr":("beta","beta"), "rtheta":("beta","v"), "rz":("beta","gamma"),
    "thetatheta":("v","v"), "thetaz":("v","gamma"), "zz":("gamma","gamma"),
}
REGIONS = ("inner", "outer", "middle")


def pin(key, path):
    blob = path.read_bytes()
    assert sha256(blob).hexdigest() == PINS[key], (key,path)
    return blob


def wave_seed(ops, mode_two):
    q = ops["Bound"]
    two = {tuple(row["RZTL"]): row for row in mode_two["covarianceRowsAllSixTensorComponents"]}
    assert mode_two["linearModeTwoSigmaT"]["nativeSigmaRoots"] == [22001223,22001224]
    mixed = [(0,z,t) for z,t in product(range(3),range(2))]
    rows = {}
    for a in mixed:
        j = sum(a)
        row = two[(*a,0)]
        assert Q(row["epsilon"]) == Q(99999,50000)
        # Mode one uses the original coherent Primary+Forced coefficient.
        # The curl lowers the gauge epsilon grade by at most 1/2+1/100000.
        # It costs at most one slow order (3 band powers and 3 poles).
        amplitude = {"Primary": (Q(1,2), Q(1,4), Q(9,2)),
                     "Forced1": (Q(99994,100000), Q(83,4), Q(27,2))}
        same_one = list(product(amplitude,repeat=2))
        eps0, band0, pole0 = [], [], []
        for f,g in same_one:
            f0,f1,f2 = amplitude[f]
            g0,g1,g2 = amplitude[g]
            eps0.append(f0+g0)
            band0.append(f1+g1+3*j)
            pole0.append(f2+g2+3*j)
        e = min(*eps0,Q(row["epsilon"]))
        s = max(*band0,Q(row["band"]))
        p = max(*pole0,Q(row["poleAfterZetaSquared"]))
        assert e == 1 and p == int(p)
        assert (162*5*2**j*4**j).bit_length()<128
        for name in MEAN_PAIRS:
            rows[name,a] = q(e*ops["E"],s,int(p),2**19)
    return rows


def initialized_quadratics(ops, noncompact):
    splits = ops["splits"]
    rows = {tag:{(q["field"],tuple(q["RZTL"])): q for q in noncompact[tag]} for tag in REGIONS}
    assert all(len(row)==132 for row in rows.values())
    chart = {}
    for a in ((0,z,t) for z,t in product(range(3),range(2))):
        for name,(f,g) in MEAN_PAIRS.items():
            chart[name,(*a,0)] = [(f,(*b,0),g,(*c,0),weight) for b,c,weight in splits(a)]
    collars = {}
    for region in ("inner","outer"):
        products = {}
        for (name,a), group in chart.items():
            cap = []
            for f,b,g,c,k in group:
                left,right=rows[region][f,b],rows[region][g,c]
                p=left["pole"]+right["pole"]
                # One spare Gaussian absorbs the finite pole uniformly on
                # the collar; charge factorial(ceil(p/2)) and opposite end.
                assert (factorial((p+1)//2).bit_length()+64)<256
                cap.append((Q(left["epsilon"])+Q(right["epsilon"]),Q(left["band"])+Q(right["band"])))
            products[name,a[:3]] = {"epsilon":str(min(e for e,_ in cap)), "band":str(max(s for _,s in cap))}
        collars[region] = (None,products,2**17)
    return chart,collars


def verify_attached_gauges(mode, covariance_roles):
    # All six vector products reduce to the same sufficient gauge shapes.
    needed=set()
    for _,(r,z,t) in covariance_roles:
        for j in range(z+1):
            for u in range(t+1):
                b=(r,j,u,0)
                needed.update({b,(r+1,j,u,0),(r,j+1,u,0),(r,j,u,1)})
    for region in REGIONS:
        report=mode["threeRegionGauges"][region]
        table={tuple(row["RZTL"]): row for row in report["rows"]}
        assert needed<=table.keys(), (region,sorted(needed-table.keys()))
        for a in needed:
            row=table[a]
            j=sum(a[:3])
            assert Q(row["phaseFreeGradeAfterOneDebit"])>=Q(29999,20000)
            assert Q(row["bandAfterNativeTransfer"])<=Q(71,4)+3*j
            assert Q(row["poleAfterHalfGaussian"])<=(0 if region=="middle" else Q(21,2)+3*j)
            assert row["prefactorLogRankHOver2Pow128"]<2**17
    covariance={tuple(row["RZTL"]):row for row in mode["covarianceRows"]}
    expected_products={("Primary","Primary"),("Primary","Forced1"),("Forced1","Primary"),
                       ("Forced1","Forced1"),("Forced2","Forced2")}
    assert mode["covarianceLogRankWithFiniteGeometryAndSpareGaussian"] < 2**19
    for _, a in covariance_roles:
        row=covariance[(*a,0)]
        assert row["allSixComponents"]
        for kind in REGIONS:
            case=row["regions"][kind]
            assert {tuple(x["orderedProduct"]) for x in case["pairs"]}==expected_products
            assert Q(case["minEpsilon"])>=1
            assert Q(case["maxBand"])<=Q(83,2)+3*sum(a)
            assert Q(case["maxPoleAfterCommonZeta"])<=32+3*sum(a)
    return sorted(needed)


def main(a):
    root=a.goal
    old=root/"c108/early-sigma-c6"
    pin("arithmetic",old/"verify_sigma_c6.py")
    ops=runpy.run_path(str(old/"verify_sigma_c6.py"))
    source=json.loads(pin("nativeSigma",old/"early-sigma-c6.json"))
    assert source["SigmaApplications"]==[22001223,22001224] and source["incrementalPressureZ"]==22000443
    assert source["normalizedCutoffRoot"]==17743734 and source["normalizedBumpRoot"]==17743730
    assert source["fixedRadialEndpoints"]==[17743711,17743713]
    compact=json.loads(pin("compactMean",root/"c116/mean-time-operands/mean-time-operands.json"))
    noncompact=json.loads(pin("noncompactMean",root/"c117/noncompact-temporal-mixed/noncompact-temporal-mixed.json"))
    mode_two=json.loads(pin("modeTwo",root/"c116/mode-two-signed-time/mode-two-signed-time.json"))
    local=json.loads(pin("localStress",root/"c117/signed-local-stress-time/signed-local-time-stress.json"))
    assert local["sourceResiduals"]==[21999622,22000445]
    assert local["conditionalCap"]=={"epsilon":"1","gaussian":"zeta","innerPole":3,"outerPole":6,
                                    "middlePole":0,"logCoefficient":"H/2^254"}
    assert compact["compactConditionalGaussianLogCharge"]<54920
    assert noncompact["common"]["conditionalLogCap"]=="H/2^113"
    old_rows={(f,tuple(direction)): row for f,direction,row in compact["temporalMeanRows"]}
    waves=wave_seed(ops,mode_two)
    mean_branches,collars=initialized_quadratics(ops,noncompact)
    request=(0,0,1)
    orders={"weightedSigmaSpatialOrders":[list(request)],"localWeightedRadialFlux":[list(request)]}
    results={}
    cov=set()
    for region in REGIONS:
        rows, trace=ops["arithmetic"]({},orders,old_rows,mean_branches,collars,waves,region)
        assert [r["field"] for r in rows]==["theta","z"]
        assert [(r["RZT"],r["epsilon"]) for r in rows]==[(request,"1")]*2
        cov.update(trace["covariance"])
        if region == "middle":
            assert {("v",(0,0,2)),("gamma",(0,0,2)),("beta",(0,1,2))} <= set(trace["compactMean"])
        else:
            assert not any(x[0]=="rho" for x in trace["cutoffAndDensity"])
        assert trace["localStress"]==[request]
        results[region]={"rows":rows,"typedSourceTrace":trace}
    assert ("rz",(0,2,1)) in cov
    all_rows=[r for region in results.values() for r in region["rows"]]
    status="CONDITIONAL_RANGE_REDUCTION_AWAITING_COMPLETE_MODE_ONE_DONOR"
    phase_free=None
    if a.mode_one is not None:
        blob=a.mode_one.read_bytes()
        assert a.mode_one_sha==sha256(blob).hexdigest()
        mode=json.loads(blob)
        phase_free=verify_attached_gauges(mode,cov)
        status="ORIGINAL_PURE_SIGMA_T_ATTACHED_CONDITIONAL_WEIGHTED_ENVELOPE"
    return {
        "schema":"MathScope.C118.OriginalEarlyPureSigmaTime/1","status":status,
        "pins":{**PINS,"modeOne":a.mode_one_sha},
        "actualNativeSigma":source["SigmaApplications"],"actualIncrementalPressureZ":source["incrementalPressureZ"],
        "coherentModeOneProducts":[["Primary","Primary"],["Primary","Forced1"],["Forced1","Primary"],["Forced1","Forced1"]],
        "separateModeTwoProduct":["Forced2","Forced2"],"actualPhasePair":"opposite harmonics, phases cancel before ordinary T differentiation",
        "actualShiftedMomentEndpoints":source["fixedRadialEndpoints"],"physicalDirections":results,
        "exactCovarianceRoles":sorted(cov),"attachedModeOneGaugeDirections":phase_free,
        "absoluteBound":{"epsilon":"1","gaussian":"zeta","band":str(max(Q(r["band"]) for r in all_rows)),
                         "collarPole":max(r["pole"] for r in all_rows),
                         "logCoefficientUnitsHOver2Pow128":max(r["coefficientInHOver2Pow128"] for r in all_rows)},
        "open":["Higher mixed Sigma T directions for live Signed velocity and its full weighted gauge.",
                "Active Repeat ordinary guard traces and the complete subsequent correction cycle."],
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    p.add_argument("--goal",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--mode-one",type=Path)
    p.add_argument("--mode-one-sha")
    a=p.parse_args()
    result=main(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],len(result["exactCovarianceRoles"]),result["absoluteBound"])
