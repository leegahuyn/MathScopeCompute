"""Original first-cycle mode one TZZ covariance with all same-mode products."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import inspect
import json
from math import factorial
from pathlib import Path
import runpy


BASE="continuation118/first-mode-one-mixed-time/final"
PREMEAN="continuation116/noncompact-temporal-t2/final"
PINS={
 "gaugeCode":("work",f"{BASE}/verify_first_mode_one_time.py","4ea99992d9fa6965c7d6aaaf0f23904315bffbbd427527d86772d08bfce3db75"),
 "gaugeReceipt":("work",f"{BASE}/first-mode-one-time.json","989a5ad9ba91bf75c4d1ec77cd8fa6afe5875ee8e9cb9b7663714761ad45f26c"),
 "meanCode":("work",f"{PREMEAN}/verify_temporal_t2.py","aed42a51a096295281e54a2a2372ba8d3142617aaeafb6c26ffe500cab7a8cce"),
 "frame11":("goal","c101/high-frame/high-frame.json","5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603"),
 "modeTwo":("work","continuation116/mode-two-signed-time/final/mode-two-signed-time.json","188d2db5d5b9b860bb4826d4d2da056ea93ac0273ec870f00a36adf20f484e7a"),
 "modeTwoCode":("work","continuation116/mode-two-signed-time/final/verify_mode_two_signed_time.py","930312db95615587a14536029a82abef39d266e4828c79e35c3d9025674c29df"),
 "compactCode":("goal","c102/mode-one-attachment/verify_mode_one_attachment.py","32e360aa6f7449772151622bc6528681f013eba81cc39a0e7c8e70b529540554"),
 "cutoffs":("goal","c102/mode-one-attachment/mode-one-attachment.json","84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e"),
 "fiveMap":("goal","primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget/after-temporal-five-map/after-temporal-five-map.json","3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102"),
}
ZERO=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
L=(0,0,0,1)
AXES=(ZERO,R,Z,L)


def read(path,sha):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==sha,(path,sha)
    if path.suffix==".py":
        return runpy.run_path(str(path))
    return json.loads(raw)


def adapt(fn, replacements):
    code=inspect.getsource(fn)
    for a,b in replacements:
        assert code.count(a)==1,a
        code=code.replace(a,b)
    scope={}
    exec(compile(code,inspect.getfile(fn),"exec"),fn.__globals__,scope)
    return scope[fn.__name__]


def mean_packet(a,src,requests):
    base=src["meanCode"]
    d={}
    for name in base["PINS"]:
        p=base["pin"](vars(a),name)
        d[name]=runpy.run_path(str(p)) if p.suffix==".py" else json.loads(p.read_bytes()) if p.suffix==".json" else p.read_text(encoding="utf-8")
    base["audit_source"](d)
    inner=base["collar"](d["weightedProgram"],6,requests)
    outer=base["collar"](d["weightedProgram"],9,requests)
    direct,tables=d["c103Program"]["whole_recipe"](d["premean"])
    whole=[{"field":m,"RZTL":j,**direct(m,j)} for m,j in requests]
    dn=set(tables[0])|inner[1]|outer[1]
    moments,linear,quadratic=d["c103Program"]["compact_demand"](requests)
    rows=[]
    for name,j,f,b,g,c,dz,w in quadratic:
        x,y=direct(f,b),direct(g,c)
        grade=Q(x["minEpsilon"])+Q(y["minEpsilon"])+dz
        band=Q(x["bandIntercept"])+Q(y["bandIntercept"])+3*dz-Q(1,2)
        rows.append((name,grade,band,w))
    cov=dn|set(tables[0])|linear
    is_high=lambda key:sum(key[1][:3])>7 or key[1][3]>8
    high_set={key for key in cov if is_high(key)}
    old={(row["component"],tuple(row["RZTL"])):row for row in d["c103"]["additionalHighRows"]}
    high=d["c103Program"]["high_covariance_rows"](high_set,src["frame11"])
    new=[]
    for row in high:
        key=row["component"],tuple(row["RZTL"])
        if key in old:
            assert json.loads(json.dumps(row))==old[key],key
        else:
            new.append(row)
    assert not any(is_high(x) for x in linear)
    assert max(map(sum,tables[2]))<=src["cutoffs"]["extendedCutoffGeometry"]["order"]
    low_rank=sum(d["covariance"]["coefficientBudget"]["commonGlobalCovarianceRanks"])
    high_rank=max(sum(row["logDegreeRanks"]) for row in high)
    assert high_rank<2**16 and low_rank==26981
    compact=src["compactCode"]["compact_budget"]({"fiveMap":src["fiveMap"],"crop":{"gradeAbsorption":{
        "minimumQuadraticEpsilonByMoment":{m:str(min(x[1] for x in rows if x[0]==m)) for m in moments},
        "maximumQuadraticBandSurplusBeforeAbsorption":{m:str(max(x[2] for x in rows if x[0]==m)) for m in moments},
    }}},low_rank,high_rank,src["cutoffs"]["extendedCutoffGeometry"])
    assert compact["compactChargeInHOver2Pow128"]==28589 and compact["motionOfSRetained"]
    direct_rank=max((sum(row["logDegreeRanks"]) for row in high
               if (row["component"],row["RZTL"]) in dn),default=low_rank)
    mass=base["mass_bits"]
    rank_inner=max(direct_rank+mass(r["coefficientMass"])+11*r["geometryPower"]+32 for r in inner[0]+outer[0])
    rank_whole=max(direct_rank+mass(r["coefficientMass"])+11*r["geometryPower"]+33 for r in whole)
    assert max(rank_inner,rank_whole)<2**16
    evidence={"requested":requests,"directSeeds":len(dn),"combinedSeeds":len(cov),
              "compactMomentOrders":{m:sorted(vals) for m,vals in moments.items()},
              "compactQuadraticBranches":len(rows),"exactHighSeeds":high,"newHighSeeds":new}
    return {"inner":inner[0],"outer":outer[0],"middle":whole,
            "common":{"coefficientRanksInHOver2Pow128":[rank_inner,rank_whole]}},compact,evidence


def main(a):
    src={k:read(getattr(a,t)/r,pin) for k,(t,r,pin) in PINS.items()}
    c118=src["gaugeCode"]
    base={k:c118["read"](a.work,k) for k in c118["PINS"]}
    time=base["timeProgram"]
    inputs=time["load"]({"work":a.work,"runtime":a.runtime})
    time["check_sources"](inputs)
    assert base["groupJoin"]["pins"]["cancel"]==time["PINS"]["one"][2]
    targets={(0,z,t,0) for z,t in product(range(3),range(2))}
    close={c118["add"](f,z) for f in targets for z in AXES}
    old=set(map(tuple,src["gaugeReceipt"]["protectedDirections"]))
    directions=sorted(old|close)
    assert len(directions)==26 and set(directions)-old=={(1,2,t,0) for t in (0,1)}|{(0,3,t,0) for t in (0,1)}|{(0,2,t,1) for t in (0,1)}
    req=sorted({(f,c118["add"](b,off)) for f in ("beta","v","gamma") for al in directions
                for b in c118["subs"](al) for off in AXES})
    base["temporal"],profile,evidence=mean_packet(a,src,req)
    compact=base["compact"]
    assert compact["forcedMeanQueries"]==120
    base["compact"]={**compact,"compactProfile":profile,"forcedMeanQueries":len(req)}
    expand_primary=adapt(c118["primary_table"],[("for j in range(6):","for j in range(7):")])
    grade=adapt(c118["grades"],[
       ('assert d["compact"]["forcedMeanQueries"]==120','assert d["compact"]["forcedMeanQueries"]==len(d["temporal"][region])'),
       ('assert row["pole"]<=24','assert row["pole"]<=27'),
       ('a[0]+a[1]+a[3]<=3 and a[2]<=1','a[0]+a[1]+a[3]<=4 and a[2]<=1')])
    grade.__globals__["primary_table"]=expand_primary
    transfer=adapt(c118["transfer"],[("factorial(12).bit_length()","factorial(14).bit_length()"),
       ("assert mean<2**15","assert mean<2**16"),("32+5**3","32+5**4")])
    recipe=base["groupProgram"]["grouped_recipes"]()
    regions={}
    worst={}
    whole,_,_=grade(base,recipe,directions,"middle")
    for key in ("inner","outer","middle"):
        raw,mean,primary=grade(base,recipe,directions,key)
        if key!="middle":
            hull=c118["hull"]
            raw={a:(hull((g,whole[a][0])),{n:hull((r,whole[a][1][n])) for n,r in groups.items()})
                 for a,(g,groups) in raw.items()}
        observed,ranks=transfer(time,base,inputs,raw,directions,key)
        regions[key]={"rows":observed,"meanRoles":len(mean),"primaryRoles":len(primary),"rank":ranks}
        worst[key]={tuple(row["RZTL"]):row for row in observed}
    max_rank=max(row["prefactorLogRankHOver2Pow128"] for region in regions.values() for row in region["rows"])
    assert max_rank<2**17
    for region in regions.values():
        for row in region["rows"]:
            j=c118["slow"](row["RZTL"])
            assert Q(row["phaseFreeGradeAfterOneDebit"])==Q(29999,20000)
            assert Q(row["bandAfterNativeTransfer"])<=Q(71,4)+3*j
            assert Q(row["poleAfterHalfGaussian"])<=Q(21,2)+3*j
    # Allocate positive constants to normal, radius, affine lift, cover and
    # whole finite Haar pairing. This also pays the 21! spare Mode Two
    # Gaussian cost, while the larger paired amplitude terms remain.
    finite_rank=2**14
    assert factorial(21).bit_length()+16*512+256<finite_rank
    assert "2*Q(1,2**112)+Q(1,2**112)" in inspect.getsource(src["modeTwoCode"]["curl_and_covariance_table"])
    covariance_rank=max(2*max_rank,3*2**16)+finite_rank
    assert covariance_rank<2**18
    harmonic=inputs["forced"]
    assert "waveRows=sumStateRows(G,old.waveRows,increment),covariance=exactAngularWaveCovariance" in harmonic
    assert "partner:-row.m" in harmonic
    two={tuple(row["RZTL"]):row for row in src["modeTwo"]["covarianceRowsAllSixTensorComponents"]}
    assert targets<=set(two)
    cov_rows=[]
    for alpha in sorted(targets):
        even={}
        for key in ("inner","outer","middle"):
            gf=worst[key]
            products=[]
            for b in c118["subs"](alpha):
                c=c118["sub"](alpha,b)
                for first,second in (("Primary","Primary"),("Primary","Forced1"),("Forced1","Primary"),("Forced1","Forced1")):
                    factors=[]
                    for name,arg in ((first,b),(second,c)):
                        j=c118["slow"](arg)
                        if name=="Primary":
                            factors.append((Q(1,2),Q(1,4)+3*j,
                                            Q(6 if key=="inner" else 9,2)+3*j if key!="middle" else 0))
                        else:
                            opts=[gf[c118["add"](arg,z)] for z in AXES]
                            factors.append((Q(19999,20000),max(Q(x["bandAfterNativeTransfer"]) for x in opts),
                                            max(Q(x["poleAfterHalfGaussian"]) for x in opts)))
                    products.append({"orderedProduct":[first,second],"split":[b,c],
                        "epsilon":str(sum(x[0] for x in factors)),
                        "band":str(sum(x[1] for x in factors)),
                        "pole":str(sum(x[2] for x in factors)),"weight":"zeta"})
            original=two[alpha]
            products.append({"orderedProduct":["Forced2","Forced2"],"epsilon":original["epsilon"],
                             "band":str(original["band"]),"pole":str(original["poleAfterZetaSquared"] if key!="middle" else 0),
                             "weight":"zeta^2"})
            even[key]={"pairs":products,"minEpsilon":str(min(Q(x["epsilon"]) for x in products)),
                       "maxBand":str(max(Q(x["band"]) for x in products)),
                       "maxPoleAfterCommonZeta":str(max(Q(x["pole"]) for x in products)),
                       "maxPoleAfterModeTwoSpareGaussian":str(max(Q(x["pole"]) for x in products if x["weight"]=="zeta"))}
            assert Q(even[key]["minEpsilon"])==1
        cov_rows.append({"RZTL":alpha,"allSixComponents":True,"regions":even})
    report={"schema":"MathScope.C118.FirstModeOneSignedTimeTZZCovariance/1",
       "status":"C94_GROUPED_TZZ_AND_ORIGINAL_PAIRED_HAAR_CONDITIONAL_SOURCE_MEAN_FRAME",
       "pins":{k:v[2] for k,v in PINS.items()},"gaugeDirections":directions,"newMeanOperands":evidence,
       "threeRegionGauges":regions,"covarianceRows":cov_rows,
       "gaugeLogRankMaximum":max_rank,"covarianceLogRankWithFiniteGeometryAndSpareGaussian":covariance_rank,
       "covarianceLogCap":"H/2^110",
       "physicalTime":"Protected physical source keeps -epsilon*partial_T and the associated epsilon*k phase factor while exact pair products cancel the common phase.",
       "scope":"All six original Haar components in the exact selected Z^jT^t closure. Retain Primary×Primary, both oriented Primary×Forced1 products, Forced1², and separate Forced2². Complete Signed and Repeat time closure remain open.",
       "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print(f"PASS 26 gauge directions, {len(req)} mean roles, {len(evidence['newHighSeeds'])} new high Primary donors and full TZZ harmonic covariance")


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","runtime","out"):
        p.add_argument(f"--{k}",type=Path,required=True)
    main(p.parse_args())
