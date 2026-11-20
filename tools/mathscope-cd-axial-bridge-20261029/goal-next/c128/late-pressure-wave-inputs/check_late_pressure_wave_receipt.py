"""Cross-check the original pressure wave frontier and the genuine pre-Signed replay."""
from argparse import ArgumentParser
from types import SimpleNamespace
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

p=ArgumentParser(description=__doc__)
for name in ("work","goal","runtime","first","second","requirements","schedule","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()

pins={
 "frontier":(a.work,"continuation126/late-wrz-mixed-frontier/late-wrz-mixed-frontier.json","5db77c948687ee351a42ce0ac027513d6986c04e9a14b40b3ae181cf7c652f19"),
 "pressure":(a.work,"continuation128/pressure-presigned/pressure-covariance.json","51e3a1190c574723990a28ad9af2f477d01bf2e1a6789122243f612115497a85"),
 "swirl":(a.work,"continuation127/late-swirl-covariance/pre-signed-late-swirl.json","0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9"),
 "spatialOne":(a.goal,"c108/forced-mode-one-late/mode-one-late-join.json","3a6c22308f6b76804b05bce58548b6b928e09cb8f6d4fdd1f8a93cc5f176912b"),
 "spatialTwo":(a.goal,"c107/post-signed-gauge/forced-mode-two-late-directions.json","0cf2a4587f2d5c82eaeadb3a0ff0f694961c29b4fd2f047cff509af7a50f5449"),
 "protectedCurl":(a.goal,"c119/signed-curl-mixed-t/signed-mixed-curl.json","2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a"),
 "cutoff":(a.goal,"c107/post-signed-gauge/signed-gauge-cutoffs.json","449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a"),
 "cutoffProgram":(a.goal,"c107/post-signed-gauge/verify_signed_gauge_cutoffs.py","831da007a6df9a67a891daad090d2f400e2730dde65332aa4b59f2fd70efb367"),
 "frame":(a.goal,"c106/frame15/frame-c15.json","09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
 "requirements":(a.requirements.parent,a.requirements.name,"a47c34f51785dc4cb36a11dc02b39819dd7d17eadbe667c5ce4cb5ee31bdb3ee"),
 "replay":(a.first.parent,a.first.name,"2390ae40466d65729b448152551281653b2753e237f7c2f666a0a6a4b57857cb"),
}

def verified(root,name,digest):
    path=root/name
    data=path.read_bytes()
    assert sha256(data).hexdigest()==digest,path
    if path.suffix==".py":
        return runpy.run_path(str(path))
    return json.loads(data)

s={k:verified(*v) for k,v in pins.items()}
assert a.first.read_bytes()==a.second.read_bytes()
target=(0,3,1,2)
ordinary=(0,3,1,0)
region_names=("inner","outer","middle")
qplus=lambda b,d:tuple(r+s for r,s in zip(b,d,strict=True))
axes=((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))

def directions(case):
    return {qplus(b,d) for b in product(*(range(t+1) for t in case)) for d in axes}

def tables(receipt):
    first={name:{tuple(r["RZTL"]):r for r in receipt["threeRegionModeOneGauges"][name]} for name in region_names}
    second={tuple(r["RZTL"]):r for r in receipt["modeTwoGauges"]}
    covariance={tuple(r["RZTL"]):r for r in receipt["covarianceRows"]}
    expected=set(map(tuple,receipt["targetGaugeDirections"]))
    assert all(set(tab)==expected for tab in first.values()) and set(second)==expected
    return expected,first,second,covariance

c128,*_,c128cov=tables(s["pressure"])
c127,*_,c127cov=tables(s["swirl"])
new,m1,m2,new_cov=tables(s["replay"])
original={tuple(r["targetRZTL"]):r for r in s["frontier"]["pointwiseRequests"]}
for a0,n in ((ordinary,26),(target,62)):
    original_a=original[a0]
    union=set(map(tuple,original_a["radialSignedGaugeDirections"]+original_a["axialSignedGaugeDirections"]))
    assert len(union)==n and union==directions(a0)
assert ordinary in c128cov and ordinary in c127cov and target not in c128cov and target not in c127cov
need=directions(target)
assert directions(ordinary)<=c128&c127
assert (len(need&c128),len(need&c127),len(need-(c128|c127)))==(36,46,12)
assert new==c128|need==set(map(tuple,s["requirements"]["gaugeDirections"]))
assert set(new_cov)==set(c128cov)|{target}

gaps=need-(c128|c127)
pure={q for q in gaps if q[2]==0}
mixed=gaps-pure
lift=lambda row:(row[0],row[1],0,row[2])
one=s["spatialOne"]
two=s["spatialTwo"]
assert pure<=set(map(lift,one["directions"]))
for rows in (one["collars"],one["middle"],two["conditionalGaugeRows"]):
    assert pure<={lift(r["RZL"]) for r in rows}
assert mixed=={(0,2,1,3),(0,3,1,2),(0,3,1,3),(0,4,1,2),(1,2,1,2),(1,3,1,2)}
assert all(need<=t.keys() for t in (*m1.values(),m2))

sigma=original[target]["newPositiveTSigmaDirections"]
assert list(map(tuple,sigma))==[(0,3,1),(0,4,1),(1,2,1),(1,3,1)]
assert s["frontier"]["originalGraph"]["WplusRz"]==22031219
assert s["frontier"]["originalGraph"]["beforeSignedRz"]==21728334
assert s["frontier"]["originalGraph"]["targetApplications"]==[22001223,22001224]
assert "no xi remaining in B" in s["protectedCurl"]["transverseReduction"]
assert "Sigma transverse-independent" in s["frontier"]["fixedChartTransverseReduction"]
slow=max(sum(q[:3]) for q in need)
l=max(q[3] for q in need)
assert (slow,l)==(5,3) and l==original[target]["maximumOriginalTransverseChiOrder"]
cut=s["cutoffProgram"]
cut["source"](SimpleNamespace(goal=a.goal,runtime=a.runtime))
slows,chis,log_s=cut["cutoff_series"](SimpleNamespace(goal=a.goal),6)
rad=cut["reciprocal_gaussians"](slow,log_s)
assert [r.__ceil__().bit_length() for r in slows[:slow+1]]==s["cutoff"]["cutoffOrdinaryRanks"][:slow+1]
assert [r.__ceil__().bit_length() for r in chis[:l+1]]==s["cutoff"]["transverseRanks"][:l+1]
assert {r:s["cutoff"]["GaussianReciprocal"][r][:slow+1] for r in rad}==rad
frame=s["frame"]
assert frame["matrixDirections"]==816 and frame["cutoffOrder"]==19
assert len(frame["catalogue"]["gramInverse"])==4 and len(frame["catalogue"]["tangent"])>=slow+1
assert len(frame["catalogue"]["squareRootWeight"])>=slow+1

def cap(rows,names):
    ep,bd,po,rk=names
    return {"epsilon":str(min(Q(r[ep]) for r in rows)),"band":str(max(Q(r[bd]) for r in rows)),
            "pole":str(max(Q(r[po]) for r in rows)),"logRankHOver2Pow128":max(r[rk] for r in rows)}

new1={region:cap([m1[region][q] for q in mixed],
               ("phaseFreeGradeAfterOneDebit","bandAfterNativeTransfer","poleAfterHalfGaussian","prefactorLogRankHOver2Pow128"))
      for region in region_names}
new2=cap([m2[q] for q in mixed],("epsilon","band","poleAfterZeta","logRank"))
assert new1["inner"]==new1["outer"]=={"epsilon":"29999/20000","band":"131/4","pole":"51/2","logRankHOver2Pow128":170209}
assert new1["middle"]==dict(new1["inner"],pole="0",logRankHOver2Pow128=170394)
assert new2=={"epsilon":"99999/100000","band":"53/2","pole":"28","logRankHOver2Pow128":57791}
assert all(m2[q]["explicitCarrier"]=="1/(2k)" for q in mixed)
item=new_cov[target]
assert item["allSixComponents"]
whole={}
for name in region_names:
    row=item["regions"][name]
    assert len(row["pairs"])==120
    assert (row["minEpsilon"],row["maxBand"],row["maxPoleAfterModeTwoSpareGaussian"])==("1","107/2","0" if name=="middle" else "39")
    whole[name]={"epsilon":row["minEpsilon"],"band":row["maxBand"],"pole":row["maxPoleAfterModeTwoSpareGaussian"],
                 "orderedProducts":len(row["pairs"]),"retainedGaussian":"zeta"}
assert s["replay"]["covarianceCommonLogRankHOver2Pow128"]==357940
assert s["replay"]["modeOneGaugeMaxLogRank"]==170778
assert s["replay"]["finalJets"]==0 and s["replay"]["release"]=="HOLD"

result={"schema":"MathScope.C129.OriginalLatePressurePreSignedL2Z3T/1",
        "status":"VERIFIED_EXACT_ARITHMETIC_CONDITIONAL_ON_ORIGINAL_ADMITTED_ANALYTIC_PROFILES",
        "pins":{k:digest for k,(_,_,digest) in pins.items()},
        "scheduleSHA256":sha256(a.schedule.read_bytes()).hexdigest(),
        "targetRZTL":target,
        "originalWplusRz":22031219,
        "preSignedRz":21728334,
        "gaugeDirectionsRequired":sorted(need),
        "ordinaryWplusGaugeCoverage":{"directions":26,"C127":26,"C128":26},
        "L2GaugeCoverageBeforeReplay":{"directions":62,"C127":46,"C128":36,"union":50,
                                      "spatialAlreadyBound":sorted(pure),"positiveTNew":sorted(mixed)},
        "newPositiveTModeOne":new1,"newPositiveTModeTwo":dict(new2,explicitCarrier="1/(2k)",retainedGaussian="zeta"),
        "actualPreSignedAllSixCovariances":whole,
        "commonCovarianceLogRankHOver2Pow128":357940,
        "highestPrimaryOrdinaryAndL":[13,7],
        "originalCutoffOrdinaryDepth":12,
        "compactMomentDegrees":{"P":9,"Jz":9,"Jtheta":10},
        "signedStaticGeometry":{"ordinaryDepth":slow,"transverseChiDepth":l,"geometryCoefficientsReplayed":True,
                                "protectedTransverseReduction":s["frontier"]["fixedChartTransverseReduction"],
                                "additionalSigmaRZT":sigma,"SigmaLDerivatives":0},
        "premises":"The original admitted fixed-label chart, native radial paths, smooth guard traces and analytic profiles from the C128 recurrence. The protected Signed static transfer uses original flat endpoints.",
        "open":"This receipt supplies the complete pre-Signed wave and covariance donor for the separate post-Signed pair computation. It proves no full Repeat, final jets, release or active source closure.",
        "finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
print("PASS pinned native wave frontier, six positive-T gauge additions, all-six pre-Signed covariance, and exact Signed cutoff static geometry")
