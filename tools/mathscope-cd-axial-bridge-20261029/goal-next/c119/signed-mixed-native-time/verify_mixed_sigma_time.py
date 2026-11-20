"""Attach the exact RT and ZT extensions to the original Signed flux recurrence."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path
import runpy

PINS = {
    "pureProgram": "c12b0335b0a82ecec20bb95a7e58711c22f41454639757aaf51103f9534d5284",
    "pureSigma": "b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796",
    "pureGauge": "c484371659b9b10fea0808449e4ae6dbade3782cb1d0a79852a81056b8aa4bdd",
    "local": "8a6d9bd9fa6c1717380c6255aa45736a67cf42df8b63996fe22b74e27c451804",
    "covariance": "18b36ba6fceb10cc448f24361dd6c8e7a2a0e3f3c69dabee966102418f508f7f",
    "priorCompact": "360b18bef09ba1afd09b160b342e70f38474c876b19a00a73fe0eb3169b9f650",
}
REGIONS = ("inner","outer","middle")
TARGETS = ((1,0,1),(0,1,1))
PRODUCTS = {("Primary","Primary"),("Primary","Forced1"),("Forced1","Primary"),
            ("Forced1","Forced1"),("Forced2","Forced2")}


def read(path, sha):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==sha,(path,sha)
    return raw


def data(path, sha):
    return json.loads(read(path,sha))


def wave_bounds(ops,cov,region):
    rows={}
    assert cov["covarianceCommonLogRankHOver2Pow128"]<2**19
    for item in cov["covarianceRows"]:
        a=tuple(item["RZTL"])
        assert a[-1]==0 and item["allSixComponents"]
        r=item["regions"][region]
        assert {tuple(p["orderedProduct"]) for p in r["pairs"]}==PRODUCTS
        e,s,p=Q(r["minEpsilon"]),Q(r["maxBand"]),Q(r["maxPoleAfterModeTwoSpareGaussian"])
        assert e>=1 and s<=Q(83,2)+3*sum(a)
        assert p<=27+3*sum(a) and p.denominator==1
        for name in six_components():
            rows[name,a[:3]]=ops["Bound"](e*ops["E"],s,int(p),2**19)
    return rows


def six_components():
    return ("rr","rtheta","rz","thetatheta","thetaz","zz")


def mean_products(ops,simple,noncompact):
    pairs=simple["MEAN_PAIRS"]
    templates={}
    outer={}
    for r,z,t in product(range(2),range(4),range(2)):
        if r+z>3:
            continue
        a=(r,z,t)
        for name,(f,g) in pairs.items():
            templates[name,(*a,0)]=[(f,(*b,0),g,(*c,0),w) for b,c,w in ops["splits"](a)]
    for region in ("inner","outer"):
        table={(r["field"],tuple(r["RZTL"])):r for r in noncompact[region]}
        values={}
        for (name,a),patterns in templates.items():
            weights=[]
            for f,b,g,c,_ in patterns:
                x,y=table[f,b],table[g,c]
                assert factorial((x["pole"]+y["pole"]+1)//2).bit_length()+64<256
                weights.append((Q(x["epsilon"])+Q(y["epsilon"]),Q(x["band"])+Q(y["band"])))
            values[name,a[:3]]={"epsilon":str(min(e for e,_ in weights)),
                                "band":str(max(b for _,b in weights))}
        outer[region]=(None,values,2**17)
    return templates,outer


def main(a):
    base=a.goal/"c118/pure-sigma-time-join"
    prog=base/"verify_pure_sigma_time.py"
    read(prog,PINS["pureProgram"])
    simple=runpy.run_path(str(prog))
    ops_path=a.goal/"c108/early-sigma-c6/verify_sigma_c6.py"
    simple["pin"]("arithmetic",ops_path)
    ops=runpy.run_path(str(ops_path))
    pure=data(base/"pure-sigma-time.json",PINS["pureSigma"])
    gauge=data(base/"signed-pure-time-gauge.json",PINS["pureGauge"])
    compact=data(a.goal/"c116/mean-time-operands/mean-time-operands.json",simple["PINS"]["compactMean"])
    noncompact=data(a.goal/"c117/noncompact-temporal-mixed/noncompact-temporal-mixed.json",simple["PINS"]["noncompactMean"])
    local=data(a.local,PINS["local"])
    assert local["originalResiduals"]==[21999622,22000445]
    assert set(map(tuple,local["conditionalCap"]["directions"]))==set(TARGETS)
    assert (local["conditionalCap"]["innerPole"],local["conditionalCap"]["outerPole"])==(6,9)
    cov=data(a.covariance,PINS["covariance"])
    assert len(cov["targetGaugeDirections"])==30
    assert pure["actualNativeSigma"]==gauge["originalSigma"]==[22001223,22001224]
    assert gauge["pureTimeGauge"]["logCoefficient"]=="H/2^107"
    beta=cov["betaZZTT"]["whole"]
    assert beta["RZTL"]==[0,2,2,0] and Q(beta["minEpsilon"])>=Q(199997,100000)

    # The compact linear role must be separately bound. Its ordinary
    # pre-FiveMap donor alone would leave the signed pressure term open.
    beta_compact=data(a.compact_beta,a.compact_beta_sha)
    assert beta_compact["schema"] == "MathScope.C119.OriginalCompactFiveMapBetaZZTTForSignedPressure/1"
    compact_bound=beta_compact["bound"]
    assert compact_bound["oneGaussianLogChargeInHOver2Pow128"] < 54920
    assert (compact_bound["conditionalEpsilonGrade"],compact_bound["bandPower"],compact_bound["weight"])==("2","31/2","zeta")
    assert beta_compact["ordinaryInput"]["bothCollarsExactlyZero"]
    assert beta_compact["ordinaryInput"]["RZTL"] == [0,2,2,0]

    prior=data(a.goal/"c104/high-compact-old/high-compact-old.json",PINS["priorCompact"])
    assert prior["actualCompactProfile"]["compactZeroOnBothSourceCollars"]
    assert prior["actualCompactProfile"]["conditionalLogCoefficient"]=="H/2^111"
    mean={(n,tuple(j)):item for n,j,item in prior["meanOrders"]}
    for n,j,item in compact["temporalMeanRows"]:
        assert mean.get((n,tuple(j)),item)==item
        mean[n,tuple(j)]=item
    mean["beta",(0,2,2,0)]={k:v for k,v in beta.items() if k not in ("RZTL","field")}
    quadratics,collars=mean_products(ops,simple,noncompact)
    new_cov=set()
    rows={}
    requests={"weightedSigmaSpatialOrders":[list(x) for x in TARGETS],
              "localWeightedRadialFlux":[[0,0,1],*[list(x) for x in TARGETS]]}
    for region in REGIONS:
        values,trace=ops["arithmetic"]({},requests,mean,quadratics,collars,wave_bounds(ops,cov,region),region)
        assert len(values)==4 and all(Q(x["epsilon"])>=1 for x in values)
        assert set(trace["localStress"])=={(0,0,1),*TARGETS}
        if region=="middle":
            assert ("beta",(0,2,2)) in trace["compactMean"]
        else:
            assert not any(n=="rho" for n,_ in trace["cutoffAndDensity"])
        rows[region]={"bounds":values,"sourceTrace":trace}
        new_cov.update(trace["covariance"])

    pure_cov={(name,tuple(j)) for name,j in pure["exactCovarianceRoles"]}
    assert ("rz",(0,3,1)) in new_cov
    assert len(pure_cov|new_cov)==35 and len((pure_cov|new_cov)-pure_cov)==13
    values=[row for region in rows.values() for row in region["bounds"]]
    bands=max(Q(x["band"]) for x in values)
    pole=max(x["pole"] for x in values)
    rank=max(x["coefficientInHOver2Pow128"] for x in values)
    assert bands<=Q(131,2) and pole<=48 and rank<2**20
    return {"schema":"MathScope.C119.OriginalSignedMixedSigmaTime/1",
            "status":"CONDITIONAL_ORIGINAL_MIXED_SIGMA_TIME",
            "pins":{**PINS,"independentCompactBeta":a.compact_beta_sha},
            "nativeSigmaRoots":pure["actualNativeSigma"],"actualIncrementalPressureZ":pure["actualIncrementalPressureZ"],
            "sourceEndpoints":pure["actualShiftedMomentEndpoints"],
            "exactOriginalCovarianceAll35":sorted(pure_cov|new_cov),
            "newCovarianceBeyondPureTime":sorted(new_cov-pure_cov),
            "mixedRZT":TARGETS,"threeRegions":rows,
            "mixedCommon":{"band":str(bands),"epsilon":"1","gaussian":"zeta",
                           "collarPole":pole,"logCoefficientUnitsHOver2Pow128":rank},
            "open":"The remaining second-correction guarded residual, full native construction and final jets.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for flag in ("goal","local","covariance","compact-beta","out"):
        p.add_argument("--"+flag,type=Path,required=True)
    p.add_argument("--compact-beta-sha",required=True)
    a=p.parse_args()
    result=main(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original mixed RT/ZT Sigma T, covariance 35",result["mixedCommon"])
