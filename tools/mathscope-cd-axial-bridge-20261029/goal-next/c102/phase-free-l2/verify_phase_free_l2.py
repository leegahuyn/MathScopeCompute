"""Attach the original pure L² phase-free gauge used by the Signed Haar reduction."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
B=BAND/"first-forced-budget"
K=Q(1,100000)
REF={
    "gauge":(B/"outer-physical-gauge/source/forced-gauge-spatial.json","b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59"),
    "variations":(BAND/"forced-normalized-variation/weighted-variation.json","c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37"),
    "variationProgram":(BAND/"forced-normalized-variation/verify_weighted_forced_variation.py","bc793ae3d6e42755d227fee199322130255f9e21273888d019579db22aa89f2e"),
    "raw":(B/"outer-weight-comparison/raw-weights/raw-weight-degrees-final.json","836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0"),
    "cancel1":(B/"principal-mode-cancellation/mode-one/mode1-linear-cancellation.json","02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
    "cancel2":(B/"principal-mode-cancellation/mode-two/mode-two-tangency.json","f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a"),
    "matrix":(BAND/"outer-fixed-label-norm/matrix/matrix-s-j.json","e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "inner":(B/"inner-physical-gauge/inner-forced-energy-slice.json","eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8"),
    "outer":(B/"outer-physical-gauge/outer-forced-energy-slice.json","a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd"),
    "middle":(B/"middle-covariance/frame/middle-frame-budget.json","b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8"),
}
EXT={
    "signedDonor":"59a4d94452cfb02be03851b567c09a1331e62ba3db679eeb9373cc755fc0bb5e",
    "c7":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "c101Joined":"4ad8582a8d107446cbdab41c0fc06b7415241fb7f09e795aa0e587be07b2637d",
    "c101Frame":"5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603",
    "c102ModeOne":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
}


def pin(p,wanted):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==wanted,p
    return raw


def read(p,wanted):
    return json.loads(pin(p,wanted))


def replay_mean(premean,c7,attachment,gauge):
    pin(premean,EXT["premean"])
    r=runpy.run_path(str(premean))["record"]
    source=inspect.getsource(r)
    assert source.count("for order in demands:")==1
    ns={}
    exec(compile(source.replace("for order in demands:","for order in demands[name]:"),str(premean),"exec"),
         r.__globals__,ns)
    names=("beta","v","gamma")
    orders={(r,z,l) for r,z in ((0,0),(1,0),(0,1)) for l in range(3)}|{(0,0,3)}
    mean,cov,integral,cut,inv=ns["record"]({n:sorted(orders) for n in names})
    assert max(sum(a[:2]) for _,a in cov)<=4
    assert max(a[2] for _,a in cov)<=6
    assert max(sum(a) for a in cut)<=3
    assert c7["ordinaryDerivativeBudget"]["mixedDirections"]==1080
    assert gauge["pureL2MeanClosure"]["onlyNewMeanDirection"]==[0,0,3]
    pure=min(Q(r["minEpsilon"]) for table in mean.values() for r in table if not any(r["RZL"][:2]))
    grad=min(Q(r["minEpsilon"]) for table in mean.values() for r in table)
    assert pure==1-K and grad>=1-2*K
    assert max(Q(r["bandIntercept"]) for table in mean.values() for r in table)==Q(21,2)
    assert max(r["geometryPower"] for table in mean.values() for r in table)<=16
    assert max(Q(r["coefficientMass"]) for table in mean.values() for r in table)<2**32
    compact=attachment["compactFiveMap"]
    assert compact["compactIndependentOfL"] and compact["compactZeroOnBothSourceCollars"]
    charge=max(sum(c7["coefficientBudget"]["commonGlobalCovarianceRanks"])+256,
               compact["compactChargeInHOver2Pow128"])+1
    assert charge<2**16
    return {"dirs":sorted(orders),"meanRows":mean,"covariance":sorted(cov),
            "counts":[len(cov),len(integral),len(cut),len(inv)],
            "pureTransverseMeanEpsilon":str(pure),"gradientMeanEpsilon":str(grad),
            "coefficientChargeHOver2Pow128":charge,
            "compact":"FiveMap vanishes if L hits it. The zero-L factor and first R,Z derivatives remain in terms of the Leibniz expansion where both L hit Primary. Those factors are attached by C102."}


def variation(goal,d,mean):
    plus=d["gauge"]["pureL2NativeForcedExtension"]
    assert plus["newDirection"]==[0,0,2]
    assert d["gauge"]["liveForcedGauge"]["originalDerivativeOfPhaseInLIsZero"]
    assert d["cancel1"]["postCancellationConditionalGrades"]["commonPostCancellationConditionalEpsilonDegree"]=="99999/100000"
    assert all(Q(r["noncarrierLowerGrade"])>=1-K and Q(r["retainedCarrierLowerGrade"])>=1-K
               for chart in d["cancel2"]["chartRows"] for r in chart["rows"])
    assert d["joined"]["pins"]["frame"]==EXT["c101Frame"]
    assert d["joined"]["regularTargetOrdinaryOrder"]==11
    assert d["inner"]["conditionalPhysicalEnergyComparison"]["logModes"]["1"]["wholeLogChargeOverHUpper"]=="2^-108"
    assert d["middle"]["middleCrossGuardAndConditionalEnergy"]["inverseTwoEndpointZetaBound"]=="2^185"
    directions={tuple(row) for row in d["raw"]["directions"]}
    assert {(0,0,1),(1,0,1),(0,1,1)}<=directions and (0,0,2) not in directions
    V=runpy.run_path(str(goal/REF["variationProgram"][0]))
    led=d["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    def low(key,rank=1):
        c,a,s=led[key][0]
        assert s==0
        return [(rank*Q(c),a,s)]
    inputs=low("normalizedMode1And2MatrixInfinityNorm"),low("BLeft",3),low("projector",3),low("movingBasisInfinityNorm")
    alpha=(0,0,2)
    state,physical=V["exact_coefficients"](alpha,*inputs)
    earlier=next(row for row in d["variations"]["rows"] if row["RZL"]==[0,0,1])
    assert len(V["words"](alpha))==1 and len(state)==len(physical)==1
    assert state==earlier["statePolynomial"] and physical==earlier["physicalOverPPolynomial"]
    [entry]=physical
    assert entry["orderedMatrixInsertions"]==0 and entry["remainingOrderedWindowPower"]==0
    assert d["variations"]["massBounds"]["mode1"]=="Lmax*S"
    assert d["variations"]["massBounds"]["mode2"]=="3*sqrt(Lmax/gL)*S^(1/2)"
    P=sum(d["frame"]["primaryUniformLogRanks"])
    geometry=6*(40+20)+32+185+128
    other=entry["propagatorPower"]+7*entry["maxSourceConstantPower"]+Q(entry["coefficient"]).__ceil__().bit_length()+64
    b=[]
    for m in (1,2):
        row=plus["byMode"][str(m)]
        shift=1 if m==1 else Q(1,2)
        assert Q(row["rawBandPower"])+shift==Q(row["nativeVelocityOverPBandPower"])
        pole=Q(row["additionalPoleAfterGToMode"])+Q(3*m,2)
        common=P*(m if m==2 else 1)+geometry+other
        if m==1:
            common+=mean["coefficientChargeHOver2Pow128"]
        assert common<2**16
        assert Q(row["rawEpsilonGradeBeforeBand"])==1-K
        assert 2*Q(1,2**112)+Q(row["nativeVelocityOverPBandPower"])/2**32636<K
        b.append({"mode":m,"RZL":alpha,"nativeNormalizedVelocityEpsilon":str(1-K),
                  "phaseFreeGaugeEpsilon":str(Q(3,2)-K),
                  "phaseFreeGaugeEpsilonAfterOneDebit":str(Q(3,2)-2*K),
                  "ordinaryBandPower":row["nativeVelocityOverPBandPower"],
                  "bothCollarPoleAfterZeta":str(pole),"middlePole":0,"zetaPower":str(Q(m,2)),
                  "coefficientChargeHOver2Pow128":common,"coefficientLogCap":"H/2^112"})
    assert [x["bothCollarPoleAfterZeta"] for x in b]==["21/2","12"]
    return {"zeroInsertionState":state,"zeroInsertionVelocity":physical,"gaugeRows":b}


def main(a):
    d={k:read(a.goal/path,h) for k,(path,h) in REF.items() if k!="variationProgram"}
    pin(a.goal/REF["variationProgram"][0],REF["variationProgram"][1])
    d.update({k:read(getattr(a,arg),EXT[ext]) for k,arg,ext in (
        ("signedDonor","signed_donor","signedDonor"),("c7","c7","c7"),
        ("joined","c101_joined","c101Joined"),("frame","c101_frame","c101Frame"),
        ("attached","c102_mode_one","c102ModeOne"))})
    assert d["signedDonor"]["remainingPureAxialPotentialOrder"]
    mean=replay_mean(a.premean,d["c7"],d["attached"],d["gauge"])
    wire=variation(a.goal,d,mean)
    result={"schema":"MathScope.C103.OriginalPhaseFreeTransverseDonor/1",
            "status":"VERIFIED_ORIGINAL_PURE_L2_MODE_ONE_AND_TWO_PHASE_FREE_GAUGE_ON_ADMITTED_CHARTS",
            "pins":{**EXT,**{k:h for k,(_,h) in REF.items()}},
            "wholePathInitializedMean":mean,"phaseFreeDonor":wire,
            "HaarMove":"Normalized whole torus L integration by parts sends a*L(C_high) times U_low to -a*C_high times L(U_low), coefficient a independent of the torus. The actual phase, theta vectors and pulse v are fixed under L.",
            "lowerCurlDirections":[[0,0,1],[1,0,1],[0,1,1],[0,0,2]],
            "scope":"Keep actual source covers, guards and all positive chart/pulse/mass hypotheses. In the middle pulse chart the finite inverse Gaussian lemma is applied pointwise. This closes the selected lower-factor phase-free gauge needed for the periodic Haar derivative move only.",
            "release":"HOLD","finalJets":0}
    a.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print(mean["counts"],[x["coefficientChargeHOver2Pow128"] for x in wire["gaugeRows"]])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p=ArgumentParser()
    for n in ("goal","signed-donor","c7","c101-joined","c101-frame","c102-mode-one","premean","out"):
        p.add_argument("--"+n,type=Path,required=True)
    main(p.parse_args())
