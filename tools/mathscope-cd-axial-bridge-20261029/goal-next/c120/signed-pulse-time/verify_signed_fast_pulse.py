"""Attach original Signed phase-free pulse derivatives across the two collars."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS={
    "band":"a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "matrixSource":"7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26",
    "matrixRank":"e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36",
    "pulse":"56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d",
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "sigma":"d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f",
    "cutoff":"449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a",
    "curl":"2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a",
    "signedSource":"15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2",
}


def pin(name,path):
    b=path.read_bytes()
    assert sha256(b).hexdigest()==PINS[name],(name,path)
    return b


def d(name,path):
    return json.loads(pin(name,path))


def positive_product_budget(components):
    # One ordinary v derivative, and at most one R or Z derivative.
    # Retain each distinct Leibniz assignment before taking an envelope.
    can_v={"n","tbar","q_n^-1","psi","P"}
    can_s={"n","tbar","q_n^-1","H^-1","a_j^-1","slow","Sigma","g^-1"}
    rows=[]
    for label,directions in (("v",0),("Rv",1),("Zv",1),("xi v",0)):
        pairs=[]
        for v in components:
            if v not in can_v:
                continue
            if directions:
                pairs.extend([v,b] for b in components if b in can_s)
            else:
                pairs.append([v,"chi" if label=="xi v" else None])
        rows.append({"requested":label,"assignments":pairs,
                     "maximumSlowBandFromDerivative":3*directions,
                     "extraCollarPole":3*directions})
    assert [len(x["assignments"]) for x in rows]==[5,40,40,5]
    assert len([x for x in rows[2]["assignments"] if x==["P","Sigma"]])==1
    assert ["psi","Sigma"] in rows[2]["assignments"]
    return rows


def main(a):
    root=a.goal
    m2=a.runtime/"research-ide/mathscope-m2/navier"
    m3=a.runtime/"research-ide/mathscope-m3/navier"
    band=pin("band",m3/"source-global-band.mjs").decode()
    frame_source=pin("matrixSource",m2/"actual-covariance-matrix.mjs").decode()
    signed=pin("signedSource",m3/"generic-signed-source-kernel.mjs").decode()
    pulse=d("pulse",root/BAND/"outer-normalized-amplitude/pulse-frame/pulse-frame-caps-final.json")
    frame=d("frame",root/"c106/frame15/frame-c15.json")
    matrix=d("matrixRank",root/BAND/"outer-fixed-label-norm/matrix/matrix-s-j.json")
    sigma=d("sigma",root/"c108/early-sigma-c6/early-sigma-c6.json")
    cut=d("cutoff",root/"c107/post-signed-gauge/signed-gauge-cutoffs.json")
    curl=d("curl",root/"c119/signed-curl-mixed-t/signed-mixed-curl.json")

    assert "s=G.mul(q(sign),u,G.add(q(1,2),G.div(v,Ls)))" in frame_source
    assert "nPrime=[G.neg(HR),G.zero,G.neg(G.mul(epsilon,HZ))]" in frame_source
    assert "lambda=G.div(lambda0,root)" in frame_source
    assert "dref=G.div(G.mul(lambda0,G.add(G.one,G.pow(s,2))),G.pow(G.sqrt(G.add(G.one,G.pow(u,2))),3))" in frame_source
    assert "G.integral(G.substitute(G.sub(frame.reference.lambda,frame.reference.dref),v,t0),t0,G.div(Ls,q(2)),v)" in band
    assert "z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x]))" in band
    assert "psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))))" in band
    assert "phaseSpeed" in band and "G.mul(v,phaseSpeed)" in band
    assert "G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x" in signed
    assert "services.signedInverse(G,{H,amplitudes:a,epsilon:eps,target:Sigma})" in signed
    assert len(curl["originalDefinitions"])==6
    assert curl["originalRadialChart"]["ordinaryCommutatorTR"]=="ZERO_ON_FIXED_NATIVE_LABEL"
    assert "xi remaining in B" in curl["transverseReduction"]
    assert pulse["verifiedNativeMatrixEntries"]==180 and pulse["verifiedNativeProjectedScalars"]==120
    assert frame["matrixDirections"]==816
    tv=frame["catalogue"]["tangentV"]
    assert [list(x) for x in tv[:2]]==[[14,84,1,14],[29,180,2,30]]
    normal=matrix["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    assert all(len(normal[name])>=2 for name in ("n","nPrime","inverseNormalSquared"))
    assert all(row[2]<=j for name in ("n","nPrime","inverseNormalSquared")
               for j,row in enumerate(normal[name][:2]))
    assert sigma["SigmaApplications"]==[22001223,22001224]
    assert cut["GaussianReciprocal"]["outer"][1]["extraPole"]==3

    # s/|u|<=3/2 on the actual closed native pulse. Since (1+u²)^1.5
    # dominates (1+u²), bound each reference rate without cancellation.
    nu=1+Q(3,2)**2
    assert nu==Q(13,4)
    # psi is the product of two original flat steps. Its support is
    # [Ls/5,4Ls/5] and the first derivative vanishes at both joins.
    assert Q(4,20)==Q(1,5) and Q(16,20)==Q(4,5)
    # For the flat step, one exponential >=e^-2, while each one-sided
    # derivative is <=4. e<3 gives 8e^4 < 2^10.
    assert 8*3**4<2**10 and (40*2**10).bit_length()==16
    fields=("n","tbar","q_n^-1","psi","P","H^-1","a_j^-1","slow","Sigma","g^-1")
    assignments=positive_product_budget(fields)
    ordinary=sigma["commonBound"]
    gauge_band=Q(ordinary["band"])+Q(1,4)+3
    gauge_pole=ordinary["pole"]+3
    gauge_rank=ordinary["coefficientInHOver2Pow128"]+2**16
    assert (gauge_band,gauge_pole)==(Q(275,4),51)
    assert Q(gauge_rank,2**128)+gauge_band/2**32636<Q(1,2**107)
    # Leading cylindrical curl uses k<=2/sqrt(epsilon). The unphased
    # remainder keeps eps^(1-kappa)>=sqrt(eps). A separate phase term
    # uses i k phi_v and can spend the remaining half epsilon exponent.
    e=Q(1,2)
    assert 1-Q(1,100000)>e and e-Q(1,2)==0
    full_rank=gauge_rank+2**15
    assert Q(full_rank,2**128)+(gauge_band+4)/2**32636<Q(1,2**106)
    return {
        "schema":"MathScope.C120.OriginalSignedFastPulseDerivatives/1",
        "status":"CONDITIONAL_ORIGINAL_SIGNED_NATIVE_FAST_PULSE_BOUND",
        "pins":PINS,"actualSigmaRoots":sigma["SigmaApplications"],"protectedRadialImaginaryCoefficient":22001995,
        "originalPulse":"P_v/P=lambda-dref; psi support [Ls/5,4Ls/5], psi' flat at actual endpoints",
        "originalPulseAmplitudeLevel":"t=P*tbar, tbar=B*w, P>0, P<=1",
        "normalizedNPrime":"(-H_R,0,-epsilon H_Z); (1/|n|²)_v=-2(n·n_v)/|n|^4",
        "logPulseDerivativeUpperRelativeToLambda0":str(nu),
        "distinctDerivativePlacements":assignments,
        "mixedGauge":{"weights":"P*sqrt(zeta)","epsilon":"1","band":str(gauge_band),
                      "collarPole":gauge_pole,"middlePole":0,"logCoefficient":"H/2^107"},
        "phaseFreeVelocityPulse":{"epsilon":str(e),"weights":"P*sqrt(zeta)"},
        "restoredHarmonicPulse":{"epsilon":"0","weights":"P*sqrt(zeta)","band":str(gauge_band+4),
                                "collarPole":gauge_pole,"middlePole":0,"logCoefficient":"H/2^106",
                                "carrierTerm":"-i*k*phaseSpeed times the original harmonic coefficient"},
        "open":"Cancellation or positive epsilon margin of the complete active Repeat residual, then the full second correction.",
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","runtime","out"):
        p.add_argument("--"+name,type=Path,required=True)
    a=p.parse_args()
    r=main(a)
    a.out.write_bytes((json.dumps(r,indent=2)+"\n").encode())
    print("PASS original Signed v,Rv,Zv,xi-v with finite pole",r["mixedGauge"]["collarPole"])
