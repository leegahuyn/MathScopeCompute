"""Transfer the original pure-T Sigma input through the phase-free Signed gauge."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

PINS = {
    "sigma": "d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f",
    "core": "e8ab0b3aad45d6f995346a20ead2ed412b0fc63fcf9c7ac0a3ed5753bb212b35",
    "cutoff": "449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a",
    "frame": "09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "joined": "98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3",
    "kernel": "15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2",
    "inverse": "df6f10cda4c77b0b679ded7eb254979e528d133239b2da1ce0904479585d2116",
}


def pin(path, want):
    body=path.read_bytes()
    assert sha256(body).hexdigest()==want,(path,want)
    return body


def obj(path, key):
    return json.loads(pin(path, PINS[key]))


def transfer(a):
    src=obj(a.goal/"c108/early-sigma-c6/early-sigma-c6.json","sigma")
    core=obj(a.goal/"c103/signed-high/signed-high.json","core")
    cuts=obj(a.goal/"c107/post-signed-gauge/signed-gauge-cutoffs.json","cutoff")
    frame=obj(a.goal/"c106/frame15/frame-c15.json","frame")
    joined=obj(a.goal/"c106/frame15/joined-c15.json","joined")
    value=src["commonBound"]
    derivative=json.loads(pin(a.sigma_t,a.sigma_t_sha))
    assert derivative["status"]=="ORIGINAL_PURE_SIGMA_T_ATTACHED_CONDITIONAL_WEIGHTED_ENVELOPE"
    assert derivative["actualNativeSigma"]==src["SigmaApplications"]==[22001223,22001224]
    assert frame["matrixDirections"]==816
    assert joined["originalBackgroundOrder"]==16 and joined["regularTargetOrder"]==15
    assert all(len(frame["catalogue"][s])>=2 for s in ("gram","tangent","squareRootWeight"))
    assert cuts["cutoffOrdinaryRanks"][1]>0
    assert all(cuts["GaussianReciprocal"][side][1]["extraPole"]==3 for side in ("inner","outer"))
    m2=a.runtime/"research-ide/mathscope-m2/navier"
    m3=a.runtime/"research-ide/mathscope-m3/navier"
    inverse=pin(m2/"actual-physical-residual-algebra.mjs",PINS["inverse"]).decode()
    kernel=pin(m3/"generic-signed-source-kernel.mjs",PINS["kernel"]).decode()
    for expression in ("rhs=Sigma.map(x=>G.div(x,epsilon))",
                       "deltaAmplitude=dSigma.map((x,j)=>G.div(x,G.mul(G.q(2),a[j])))"):
        assert expression in inverse
    for expression in ("G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x",
                       "weighted=amplitude.map(x=>G.mul(slowCutoff,x))",
                       "rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared)))",
                       "normal:f.frame.n,potential"):
        assert expression in kernel
    c0,c1=[next(x for x in core["transfer"]["requests"] if x["RZ"]==q) for q in ([0,0],[0,1])]
    assert Q(c0["bandPower"])==Q(1,4) and Q(c1["bandPower"])==Q(9,4)
    # The all-RZT C106 catalogue supplies the same first-order positive
    # Gram, regular weight and tangent ranks. Reserve another S^3 for the
    # fixed label partition and charge both factors finitely.
    core0=sum(c0["logRanks"])
    core1=sum(c1["logRanks"])
    assert core0<=core1<2**10
    finite_rank=2**14
    direct=derivative["absoluteBound"]
    assert direct["epsilon"]==value["epsilon"]=="1" and direct["gaussian"]==value["retainedGaussian"]=="zeta"
    # Four Leibniz paths: T hits Sigma, the normalized tensor, the
    # reciprocal Gaussian or the slow partition. Transverse and pulse
    # cutoffs have zero native T derivative at fixed reference labels.
    paths = [
        ("Sigma",Q(direct["band"])+Q(1,4),direct["collarPole"],direct["logCoefficientUnitsHOver2Pow128"]+finite_rank),
        ("normalized inverse, tangent and normal",Q(value["band"])+Q(9,4),value["pole"],value["coefficientInHOver2Pow128"]+finite_rank),
        ("reciprocal half Gaussian",Q(value["band"])+Q(1,4),value["pole"]+3,value["coefficientInHOver2Pow128"]+finite_rank),
        ("fixed label partition",Q(value["band"])+Q(13,4),value["pole"],value["coefficientInHOver2Pow128"]+finite_rank),
    ]
    b,p,rank=max(x[1] for x in paths),max(x[2] for x in paths),max(x[3] for x in paths)+2
    assert (b,p)==(Q(275,4),51) and Q(rank,2**128)+b/2**32636<Q(1,2**107)
    return {
        "schema":"MathScope.C118.OriginalSignedPhaseFreeGaugeTime/1",
        "status":"CONDITIONAL_NATIVE_PURE_T_GAUGE_ONLY",
        "pins":{**PINS,"sigmaT":a.sigma_t_sha},
        "originalSigma":src["SigmaApplications"],
        "nativeInverse":"delta a=diag(1/(2*a_j))*H^-1*Sigma/epsilon; remains linear in the signed target",
        "nominalSlowCoreRanks":[core0,core1],
        "explicitOriginalScale":"sqrt(epsilon)/(epsilon*k)<=1 and T-constant; k=ceil(epsilon^-1/2)",
        "cutoffTimeSupport":"Fixed v,xi,psi,chi and label; the four-factor slow cutoff moves with the original band and T mesh offsets.",
        "actualTimeLeibnizPaths":[[label,str(b),p,c] for label,b,p,c in paths],
        "pureTimeGauge":{"gaussian":"sqrt(zeta)","epsilon":"1","band":str(b),"collarPole":p,
                         "middlePole":0,"logCoefficient":"H/2^107"},
        "claimBoundary":"The physical full curl and Repeat time source need the higher mixed Signed gauge, including R,T and Z,T. Those are separate open source obligations.",
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for arg in ("goal","runtime","sigma-t","out"):
        p.add_argument("--"+arg,type=Path,required=True)
    p.add_argument("--sigma-t-sha",required=True)
    a=p.parse_args()
    w=transfer(a)
    a.out.write_bytes((json.dumps(w,indent=2)+"\n").encode())
    print("PASS conditional native Signed pure-T phase-free gauge",w["pureTimeGauge"])
