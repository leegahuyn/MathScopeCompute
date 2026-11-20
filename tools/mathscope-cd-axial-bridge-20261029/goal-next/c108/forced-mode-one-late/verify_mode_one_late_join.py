"""Extend the exact C107 Mode One join to the 93-direction pressure union."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import comb
from pathlib import Path
import runpy
from types import SimpleNamespace


C105=Path("c105/forced-mode-one-high")
BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
STAGE=BAND/"first-forced-budget"
PINS={
    "earlyCode":"30822610edec2f4c2aea7d0ce9b92a1980d53bab14225b9f1e1c373598e8eb9c",
    "earlyJoin":"e58b46a729dd9029a35c5e5115f3156943e1d9f8eae33c9bff8d6ee2426a81d8",
    "earlyDemands":"f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "lateDemands":"e3a2f7903bc28324bb09f436fb0ff399ab56f334ef95362c64f715ca4cbc00f8",
    "lateDependencies":"e89da4c0b6bd3ef944c823849969e75a896fd712f32dc1c60136ddc690e90eca",
    "geometryCode":"5087c7c6351028bdfe547bfbea30907f909478986f83fed930519bb473642cd9",
    "geometry":"2b37b73515aff09625b0b8e8e433a651cfaf8ad3bfd273befa3eb6485b1006d8",
    "baseGeometry":"e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291",
    "baseForcing":"dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d",
    "initialized":"7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "frameProgram":"72bc9342d6f3ec22f1923d9c05b4aa0a887d29e37d86b48d6b93c59d7e6b4ee9",
    "chart14":"b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
    "variationProgram":"bc793ae3d6e42755d227fee199322130255f9e21273888d019579db22aa89f2e",
    "earlierTransfer":"4beea5ad61c1af3ea310b0edcb3183689b9d5f29cfd40f426eaaf65d27f658a0",
    "dependencyProgram":"72d3043bb7f9c7ae805b9721c3a713cfa87a1e5ea3385371c4d677f45eb2f3fb",
    "actualMean":"b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41",
}


def pin(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(key,path)
    return raw


def read(path,key):
    return json.loads(pin(path,key))


def module(path,key):
    pin(path,key)
    return runpy.run_path(str(path))


def source_mean(goal,dep,old):
    fn=module(goal/"c103/initialized-mean/verify_initialized_mean.py","initialized")
    ops=module(goal/STAGE/"middle-premean-whole-path/verify_premean_whole_path.py","premean")
    temporal,providers=fn["whole_recipe"](ops)
    native=[(name,tuple(a)) for name,a in dep["ordinaryMeanDirections"]]
    assert len(native)==432 and all(a[2]==0 for _,a in native)
    typed={(name,a[0],a[1],a[3]):temporal(name,a) for name,a in native}
    for name,a,row in old["ordinaryRows"]:
        assert typed[name,a[0],a[1],a[3]]==row
    moments,linear,quadratic=fn["compact_demand"](native)
    for _,_,f,a,g,b,_,_ in quadratic:
        temporal(f,a)
        temporal(g,b)
    covariance,primitives,cutoffs,inverse=providers
    assert len(covariance|linear)==1499
    assert {key:max(map(sum,v)) for key,v in moments.items()}==dep["compactMomentMaximumZT"]
    assert (len(primitives),len(cutoffs),len(inverse))==tuple(dep["counts"].values())
    return typed,{"wholeCovarianceRequests":len(covariance|linear),"ordinaryMeanRows":len(typed),
             "exactOriginalCompactMomentOrders":dep["compactMomentMaximumZT"],
             "compactQuadraticBranches":len(quadratic),"largestNativeCutoffOrder":max(map(sum,cutoffs)),
             "largestOrdinaryLogPowerInGeometry":max(row["geometryPower"] for row in typed.values()),
             "largestNativeOrdinaryCoefficientMassBits":max(Q(row["coefficientMass"]).__ceil__().bit_length() for row in typed.values())}


def ordered_transfer(goal,directions,old):
    frame_path=goal/"c104/frame13/verify_selected_frame_c13.py"
    chart_path=goal/"c104/background14/chart14.json"
    pin(chart_path,"chart14")
    matrix,*_=module(frame_path,"frameProgram")["coefficient_recurrence"](
        SimpleNamespace(goal=goal,chart14=chart_path))
    led=matrix["exactDerivativeLedgers"]
    ordered=module(goal/BAND/"forced-normalized-variation/verify_weighted_forced_variation.py","variationProgram")

    def jets(name,multiplier=1):
        return [(multiplier*Q(c),u,s) for c,u,s in led[name]]

    coeffs=(jets("normalizedMode1And2MatrixInfinityNorm"),jets("BLeft",3),jets("projector",3),jets("movingBasisInfinityNorm"))
    prior={tuple(x["RZL"]):x for x in old["rows"]}
    out=[]
    for alpha in directions:
        r,z,l=alpha
        j=r+z
        state,physical=ordered["exact_coefficients"](alpha,*coeffs)
        assert [x["orderedMatrixInsertions"] for x in physical]==list(range(j+1))
        charge=[]
        for row in physical:
            charge.append(Q(row["coefficient"]).__ceil__().bit_length()+7*row["maxSourceConstantPower"]+row["propagatorPower"])
        ordered_rank=max(charge)+len(charge).bit_length()+5
        cross_rank=0
        for i,k in product(range(j+1),repeat=2):
            if i+k>j:
                continue
            x,y=led["n"][i],led["inverseNormalSquared"][k]
            assert x[2]+y[2]<=i+k
            cross_rank=max(cross_rank,Q(x[0]).__ceil__().bit_length()+Q(y[0]).__ceil__().bit_length()
                           +7*(x[1]+y[1])+comb(i+k,i).bit_length())
        cross_rank+=2*j+8
        row={"RZL":alpha,"state":state,"physicalOverP":physical,"orderedWindowCount":len(ordered["words"](alpha)),
             "orderedAndCrossLogRanks":[ordered_rank,cross_rank],
             "outerPotentialBand":str(Q(71,4)+3*j),"outerPotentialPoleAfterZeta":str(Q(21,2)+3*j)}
        if alpha in prior:
            assert all(json.loads(json.dumps(v))==prior[alpha][k] for k,v in row.items()),alpha
        out.append(row)
    return {"rows":out}


def main(args):
    goal=args.goal
    high=module(args.early_code,"earlyCode")
    guard=module(args.guard_code,"geometryCode")
    old=read(args.early_join,"earlyJoin")
    early=set(map(tuple,read(goal/C105/"forced-gauge-demand.json","earlyDemands")["requests"]))
    late=read(args.late_demands,"lateDemands")
    dep=read(args.late_dependencies,"lateDependencies")
    requests=tuple(sorted(early|set(map(tuple,late["directions"]))))
    assert len(early)==50 and len(requests)==dep["combinedGaugeDirections"]==93
    assert len(set(requests)-early)==43 and dep["primaryDirectRoleCount"]==194
    assert max(r+z for r,z,l in requests)==9 and max(l for r,z,l in requests)==6
    assert set(b for a in requests for b in product(*(range(x+1) for x in a)))==set(requests)
    # The previous routine's approximate weights are deliberately unused.
    # Its traversal is the authenticated original finite field inventory.
    inventory=module(goal/C105/"verify_mode_one_high_dependencies.py","dependencyProgram")["source_dependencies"](
        SimpleNamespace(goal=goal),requests)
    assert inventory["termTally"]["mode1RetainedOriginalMonomials"]==2620
    assert len(inventory["primaryDemands"])==194
    assert max(j for _,j,_,_ in inventory["primaryDemands"])==11
    assert max(l for _,_,l,_ in inventory["primaryDemands"])==8
    assert max(v for *_,v in inventory["primaryDemands"])==1

    def earlier_data(name,path):
        return high["read"](goal/path,name)

    geom=read(args.guard,"geometry")
    original_geom=read(goal/STAGE/"geometry/outer-forced-geometry.json","baseGeometry")
    raw=read(goal/BAND/"forced-normalized-variation/source/normalized-first-forced.json","baseForcing")
    geometry_rows,incidence=guard["pressure_geometry"](requests,original_geom,raw)
    phase=guard["native_eikonal"](original_geom,requests)
    geom_cap=max(x["maximumGeometryLogRank"] for x in geometry_rows)
    phase_cap=max(x["baselineLogRank"] for x in phase)
    assert geom_cap<=44 and phase_cap<=20
    for key,current in (("orderedGeometryRows",geometry_rows),("phaseTransportRows",phase)):
        inherited={tuple(v["RZL"]):v for v in geom[key]}
        assert all(json.loads(json.dumps(r))==inherited[a] for a,r in zip(requests,current,strict=True) if a in early)
    geom["phaseTransportRows"]=phase

    old_compact=earlier_data("compact",Path("c106/high-compact-mode-one/compact-mode-one-c15.json"))
    typed,mean_proof=source_mean(goal,dep,old_compact)
    assert {(('beta','v','gamma')[c],*a) for _,c,a in inventory["meanDemands"]}==set(typed)
    actual_mean=read(args.actual_mean,"actualMean")
    assert actual_mean["schema"]=="MathScope.C108.OriginalLateModeOneExistingFrameAttachment/1"
    assert actual_mean["pins"]["late"]==PINS["lateDependencies"]
    recorded={(name,a[0],a[1],a[3]):value for name,a,value in actual_mean["ordinaryMeanRows"]}
    assert typed==recorded
    new_coefficients=actual_mean["newHighPrimaryCoefficients"]
    assert [[x["component"],x["RZTL"]] for x in new_coefficients]==dep["newHighPrimaryDirections"]
    assert len(new_coefficients)==37
    assert actual_mean["directionCounts"]=={"mean":432,"allPrimary":1499,"highPrimary":372,"newHighPrimary":37}
    assert actual_mean["sameCompactMomentRows"]==562
    assert actual_mean["sameCompactProfileAsC106"]==old_compact["coefficientProfile"]
    variation=ordered_transfer(goal,requests,read(goal/C105/"mode-one-high-transfer.json","earlierTransfer"))
    data={"geometry":geom,"primary":earlier_data("primary",Path("c106/high-compact-mode-one/primary-quotient-c11.json")),
          "dependencies":earlier_data("dependencies",C105/"mode-one-high-dependencies.json"),
          "frame":earlier_data("frame",Path("c106/frame15/frame-c15.json")),
          "rawGrade":earlier_data("rawGrade",Path("c106/high-compact-mode-one/mode-one-raw-grades.json")),
          "variation":variation}
    led=data["primary"]["weightedQuotientLedger"]
    assert dep["highestDirectOrdinaryL"]==led["transverseDerivativeCoverage"]["normalizedVelocityL"]==8
    frame=high["primary_terms"](data["primary"],data["dependencies"])
    four=[(r,z,0,l) for r,z,l in requests]
    collar,n0=high["direct_grades"](four,data,guard["nth"],typed,frame,False)
    middle,n1=high["direct_grades"](four,data,guard["nth"],typed,frame,True)
    assert n0==n1==set(typed)
    mean_rank=actual_mean["coefficientRankThroughAllMeanRows"]["whole"]
    assert mean_rank==68834
    mean_cap={"ordinaryDirectOrCompactMaximum":mean_rank}
    collar_out,rank=high["transfer"](four,collar,data,mean_cap)
    middle_out,_=high["transfer"](four,middle,data,mean_cap,middle=True)
    for key,new in (("collars",collar_out),("middle",middle_out)):
        past={tuple(row["RZL"]):row for row in old[key]}
        for row in new:
            a=tuple(row["RZL"])
            if a in past:
                assert all(past[a][k]==json.loads(json.dumps(value)) for k,value in row.items()
                           if k!="gaugeLogRankInHOver2Pow128")
    report={"schema":"MathScope.C108.OriginalModeOnePressureUnionGaugeTransfer/1",
            "status":"VERIFIED_93_NATIVE_MODE_ONE_GAUGE_BOUNDS_CONDITIONAL_ORIGINAL_CHART_AND_PATHS",
            "pins":PINS,"directions":requests,"earlyDirections":len(early),"newDirections":43,
            "meanSource":mean_proof,"geometryRawIncidence":incidence,
            "geometryLogRanks":{"ordinary":geom_cap,"eikonalBaseline":phase_cap},
            "largestDirectPrimaryL":8,"sourceMeanAndGeometryJoinRank":rank,
            "verifiedNativePrimaryOperandRoles":inventory["primaryDemands"],
            "actualCoefficientInputs":{"newHighCovarianceRequests":dep["newHighPrimaryDirections"],
                "wholeInitializedMeanLogRankInHOver2Pow128":mean_rank,
                "sameOriginalCoefficientWeight":"432 typed mean rows use the checked temporal degree and the original compact weights with zero L and zero on both collars."},
            "collars":collar_out,"middle":middle_out,"orderedVariation":variation["rows"],
            "open":["Join the late paired Signed pressure and covariance at the original admitted paths.",
                    "Global guard memberships, coupled K1 energy and final jets."],"finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("Mode One union verified",len(requests),"37 new covariance coefficients attached",rank)


if __name__=="__main__":
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","early-code","early-join","guard-code","guard","late-demands","late-dependencies","actual-mean","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
