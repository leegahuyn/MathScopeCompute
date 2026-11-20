"""Extend the original both-mode covariance to the exact mixed Signed T closure."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
from math import factorial
import json
from pathlib import Path


PREV="continuation118/mode-one-signed-time/final"
SOURCE_CODE="ab13665bf50b8e9da1b8da475b09b9f82ad196751cf0b3a92aed6f6eef028501"
SOURCE_RECEIPT="d054f016d52aaba3159f82954e20ef693cb1d1d64557bed42d96cde9c9ac9965"
DEMAND="b79de2c9bd9737b6aec215c0af95af8dc56eab644383d81e77bea9859d63fce9"


def main(a):
    path=a.work/PREV/"verify_mode_one_signed_time.py"
    import runpy
    assert sha256(path.read_bytes()).hexdigest()==SOURCE_CODE
    pre=runpy.run_path(str(path))
    old=pre["read"](a.work/PREV/"mode-one-signed-time.json",SOURCE_RECEIPT)
    demand=pre["read"](a.demand,DEMAND)
    assert demand["roots"]==[22001223,22001224,22000443]
    src={k:pre["read"](getattr(a,t)/r,pin) for k,(t,r,pin) in pre["PINS"].items()}
    c118=src["gaugeCode"]
    cap={k:c118["read"](a.work,k) for k in c118["PINS"]}
    time=cap["timeProgram"]
    inputs=time["load"]({"work":a.work,"runtime":a.runtime})
    time["check_sources"](inputs)
    src["frame15"]={"primaryUniformLogRanks":inputs["frame"]["uniformLogRanks"]}
    assert inputs["frame"]["matrixDirections"]==816
    directions=tuple(map(tuple,demand["gaugeDirectionsFromCovariance"]))
    targets=sorted({(*idx,0) for _,idx in demand["allRequiredCovarianceRoles"]})
    assert len(directions)==30 and (0,4,1,0) in directions
    assert (0,3,1,0) in targets and (1,0,1,0) in targets
    add,slow,sub,subs=(c118[k] for k in ("add","slow","sub","subs"))
    axes=pre["AXES"]
    requests={ (f,add(b,off)) for f in ("beta","v","gamma") for alpha in directions
               for b in subs(alpha) for off in axes}
    requests|={(f,(*idx,0)) for f,idx in demand["secondTimeMeanRoles"]}
    requests=sorted(requests)
    assert ("beta",(0,2,2,0)) in requests
    # Preserve earlier C101 ranks wherever the previous frame has the
    # requisite ordinary order. Slow degree ten asks for Primary order
    # twelve and therefore calls the actual C106 frame instead.
    means=pre["adapt"](pre["mean_packet"],[
        ('high=d["c103Program"]["high_covariance_rows"](high_set,src["frame11"])',
         'high=d["c103Program"]["high_covariance_rows"]({k for k in high_set if sum(k[1][:3])<=9},src["frame11"])+d["c103Program"]["high_covariance_rows"]({k for k in high_set if sum(k[1][:3])==10},src["frame15"])\n    assert len(high)==len(high_set)'),
    ])
    cap["temporal"],profile,evidence=means(a,src,requests)
    compact=cap["compact"]
    cap["compact"]={**compact,"compactProfile":profile,"forcedMeanQueries":len(requests)}
    primary=pre["adapt"](c118["primary_table"],[("range(6)","range(8)")])
    grade=pre["adapt"](c118["grades"],[
        ('assert d["compact"]["forcedMeanQueries"]==120','assert d["compact"]["forcedMeanQueries"]==len(d["temporal"][region])'),
        ('assert row["pole"]<=24','assert row["pole"]<=30'),
        ('a[0]+a[1]+a[3]<=3 and a[2]<=1','a[0]+a[1]+a[3]<=5 and a[2]<=1'),
    ])
    grade.__globals__["primary_table"]=primary
    transfer=pre["adapt"](c118["transfer"],[
        ("factorial(12).bit_length()","factorial(15).bit_length()"),
        ("assert mean<2**15","assert mean<2**16"),("32+5**3","32+5**5"),
    ])
    recipe=cap["groupProgram"]["grouped_recipes"]()
    whole,_,_=grade(cap,recipe,directions,"middle")
    first={}
    for reg in ("inner","outer","middle"):
        raw,mu,pr=grade(cap,recipe,directions,reg)
        if reg!="middle":
            hull=c118["hull"]
            raw={u:(hull((g,whole[u][0])),{n:hull((v,whole[u][1][n])) for n,v in tab.items()})
                 for u,(g,tab) in raw.items()}
        result,_=transfer(time,cap,inputs,raw,directions,reg)
        first[reg]={tuple(row["RZTL"]):row for row in result}
    g_rank=max(row["prefactorLogRankHOver2Pow128"] for reg in first.values() for row in reg.values())
    assert g_rank<2**17
    for reg in first.values():
        for q,row in reg.items():
            j=slow(q)
            assert Q(row["bandAfterNativeTransfer"])<=Q(71,4)+3*j
            assert Q(row["poleAfterHalfGaussian"])<=Q(21,2)+3*j
            assert Q(row["phaseFreeGradeAfterOneDebit"])==Q(29999,20000)
    ledger=inputs["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    # Mode two uses the same original P factor and exact C94 tangency.
    # Recompute all projection, simplex and cross-product cap coefficients
    # for the new positive time directions rather than interpolating C116.
    second={}
    for alpha in directions:
        xs=time["variation"](alpha,ledger)
        vars_rank=max(x["positiveCoefficientBits"]+7*x["sourcePower"]+x["propagatorPower"]+6 for x in xs)
        rank=2*(sum(inputs["frame"]["uniformLogRanks"])+64+128+1)+32+2*sum(alpha)+185+128+vars_rank
        assert rank<2**16
        second[alpha]={"band":str(3*slow(alpha)+Q(23,2)),"poleAfterZeta":3*slow(alpha)+13,
                       "epsilon":"99999/100000","explicitCarrier":"1/(2k)","logRank":rank}
    # Full curl: D_R,D_Z,L and phase/connection terms.  One spare Mode Two
    # Gaussian absorbs its own radial pole. Geometry, affine lifts, phase,
    # Haar measurements and finite coefficient mass have a separate charge.
    finite=2**14
    assert factorial(22).bit_length()+16*512+256<finite
    covariance_rank=max(2*g_rank,3*2**16)+finite
    assert covariance_rank<2**18
    cov=[]
    for alpha in targets:
        out={}
        for reg in first:
            pairs=[]
            for b in subs(alpha):
                c=sub(alpha,b)
                for n,m in product(("Primary","Forced1"),repeat=2):
                    terms=[]
                    for name,q in ((n,b),(m,c)):
                        j=slow(q)
                        opts=[add(q,v) for v in axes]
                        assert set(opts)<=set(directions)
                        if name=="Primary":
                            terms.append((Q(1,2),Q(1,4)+3*j,Q(9,2)+3*j if reg!="middle" else 0))
                        else:
                            terms.append((Q(19999,20000),max(Q(first[reg][x]["bandAfterNativeTransfer"]) for x in opts),
                                          max(Q(first[reg][x]["poleAfterHalfGaussian"]) for x in opts)))
                    pairs.append({"orderedProduct":[n,m],"split":[b,c],
                                  "epsilon":str(sum(x[0] for x in terms)),
                                  "band":str(sum(x[1] for x in terms)),
                                  "pole":str(sum(x[2] for x in terms)),"weight":"zeta"})
            for b in subs(alpha):
                c=sub(alpha,b)
                use=[[second[add(q,v)] for v in axes] for q in (b,c)]
                p=sum(max(x["poleAfterZeta"] for x in group) for group in use) if reg!="middle" else 0
                s=sum(max(Q(x["band"]) for x in group) for group in use)
                assert p<=44
                pairs.append({"orderedProduct":["Forced2","Forced2"],"split":[b,c],"epsilon":"99999/50000",
                              "band":str(s),"pole":str(p),"weight":"zeta^2"})
            out[reg]={"pairs":pairs,"minEpsilon":str(min(Q(q["epsilon"]) for q in pairs)),
                      "maxBand":str(max(Q(q["band"]) for q in pairs)),
                      "maxPoleAfterModeTwoSpareGaussian":str(max(Q(q["pole"]) for q in pairs if q["weight"]=="zeta"))}
            assert out[reg]["minEpsilon"]=="1"
        cov.append({"RZTL":alpha,"allSixComponents":True,"regions":out})
    assert "partner:-row.m" in inputs["forced"]
    assert "waveRows=sumStateRows(G,old.waveRows,increment),covariance=exactAngularWaveCovariance" in inputs["forced"]
    t2={tuple(x["RZTL"]):x for x in cap["temporal"]["inner"] if x["field"]=="beta" and x["RZTL"][2]==2}
    assert (0,2,2,0) in t2
    ans={"schema":"MathScope.C119.OriginalFirstCycleCovarianceSignedMixedTime/1",
         "status":"VERIFIED_MIXED_SOURCE_TRANSFER_CONDITIONAL_ON_ORIGINAL_ADMITTED_ANALYTIC_PROFILES",
         "pins":{"c118Code":SOURCE_CODE,"c118Packet":SOURCE_RECEIPT,"exactMixedSignedDemand":DEMAND},
         "targetGaugeDirections":directions,"meanAndCompactDependencies":evidence,
         "modeOneGaugeMaxLogRank":g_rank,"directMeanRanks":cap["temporal"]["common"]["coefficientRanksInHOver2Pow128"],
         "compactMomentGeometryCharge":profile["compactChargeInHOver2Pow128"],
         "threeRegionModeOneGauges":{key:list(reg.values()) for key,reg in first.items()},
         "modeTwoGauges":[{"RZTL":x,**row} for x,row in second.items()],
         "covarianceRows":cov,"covarianceCommonLogRankHOver2Pow128":covariance_rank,
         "covarianceCommonLogCap":"H/2^110",
         "betaZZTT":{"inner":t2[(0,2,2,0)],
            "outer":next(x for x in cap["temporal"]["outer"] if x["field"]=="beta" and x["RZTL"]==(0,2,2,0)),
            "whole":next(x for x in cap["temporal"]["middle"] if x["field"]=="beta" and x["RZTL"]==(0,2,2,0)),
            "compact":"same admitted Jtheta_Z^3T^2 with fixed radial primitive and moving scaled coefficients"},
         "open":"Original mixed Signed numerical join and physical curl are separate from the new covariance donor; full Repeat, later corrections and final jets remain open.",
         "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(ans,indent=2,ensure_ascii=False)+"\n").encode())
    print(f"PASS original 30 gauge directions, {len(requests)} mixed mean roles, {len(targets)} covariance directions, beta_ZZTT and both-mode pairing")


if __name__=="__main__":
    from argparse import ArgumentParser
    p=ArgumentParser()
    for k in ("work","goal","runtime","demand","out"):
        p.add_argument(f"--{k}",type=Path,required=True)
    main(p.parse_args())
