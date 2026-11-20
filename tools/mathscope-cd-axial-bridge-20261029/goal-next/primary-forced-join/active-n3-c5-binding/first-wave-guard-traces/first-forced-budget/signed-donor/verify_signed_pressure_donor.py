"""Replay the centered post-Forced pressure kernel and finite donor grades."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


B=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS={
    "pressure":(B/"weighted-haar-shell/pressure/pressure-shell.json","22ff14cbd3c6df110159eb33d1cd6c938ecfdc08242d917a22a200bfb2075797"),
    "covariance":(B/"weighted-haar-shell/covariance/covariance-shell.json","87ee4c05499ed8cdc1b22c490eb9eebb26375e04063559245ead711eaf8be970"),
    "one":(B/"first-forced-budget/principal-mode-cancellation/mode-one/mode1-linear-cancellation.json","02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
    "two":(B/"first-forced-budget/principal-mode-cancellation/mode-two/mode-two-tangency.json","f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a"),
    "weights":(B/"first-forced-budget/outer-weight-comparison/raw-weights/raw-weight-degrees-final.json","836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0"),
}
FRONTIER="4ddef46553be2e296df327c513257e75085753f8a16e822ddcd16e105ad726c3"
PRESSURE_SOURCE="source-updated-mean-pressure.mjs"
PRESSURE_PIN="6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07"


def pin(path,h):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==h,path
    return data


def add(a,b):
    return [(a[i] if i<len(a) else 0)+(b[i] if i<len(b) else 0) for i in range(max(len(a),len(b)))]


def scale(a,c):
    return [x*c for x in a]


def mul(a,b):
    x=[Q(0)]*(len(a)+len(b)-1)
    for i,q in enumerate(a):
        for j,r in enumerate(b):
            x[i+j]+=q*r
    return x


def pow_poly(a,j):
    result=[Q(1)]
    for _ in range(j):
        result=mul(a,result)
    return result


def d(a):
    return [i*x for i,x in enumerate(a) if i] or [Q(0)]


def val(a,x):
    return sum(q*x**j for j,q in enumerate(a))


def prim(a,left):
    p=[Q(0)]+[Q(q)/(j+1) for j,q in enumerate(a)]
    p[0]=-val(p,left)
    return p


def integrate(a,left,right):
    return val(prim(a,left),right)


def kernels(a,r,b,chi,Phi):
    const=integrate([0]+Phi,a,r)-chi*integrate([0]+Phi,a,b)
    right=[-chi*b*b/2-const,0,chi/2]
    return add(right,[r*r/2,0,Q(-1,2)]),right


def exact_kernel_controls():
    fubini,ibp=0,0
    for a,r,b,chi in ((1,2,4,0),(1,Q(5,2),4,Q(2,5)),(Q(1,2),Q(13,4),Q(9,2),1)):
        a,r,b,chi=map(Q,(a,r,b,chi))
        for rho in ([1],[0,1],[0,1,0,1]):
            Phi=prim(rho,a)
            Phi=scale(Phi,1/val(Phi,b))
            assert val(Phi,a)==0 and val(Phi,b)==1
            K0,K1=kernels(a,r,b,chi,Phi)
            assert val(K0,r)==val(K1,r) and d(K0)==[0,chi-1] and d(K1)==[0,chi]
            for j in range(6):
                f=[0]*j+[1]
                p=add(prim(f,a),scale(Phi,-integrate(f,a,b)))
                old=integrate([0]+p,a,r)-chi*integrate([0]+p,a,b)
                new=integrate(mul(K0,f),a,r)+integrate(mul(K1,f),r,b)
                assert old==new
                fubini+=1
            lo,high=[2,1,-1],[4,-2,3,1]
            P0,P1=mul(K0,lo),mul(K1,lo)
            old=integrate(mul(P0,d(high)),a,r)+integrate(mul(P1,d(high)),r,b)
            hi_low=val(mul(P1,high),b)-val(mul(P0,high),a)
            assert old==hi_low-integrate(mul(d(P0),high),a,r)-integrate(mul(d(P1),high),r,b)
            ibp+=1
    assert (fubini,ibp)==(54,9)
    # Diagnostic f supported on [1,2], chi=0 and normalized rho supported to the right.
    f=[0]+mul(pow_poly([-1,1],6),pow_poly([2,-1],6))
    coefficient=integrate(mul([2,0,Q(-1,2)],mul(f,add(d(f),f[1:]))),Q(1),Q(2))
    assert coefficient>0
    return {
        "nestedFubiniChecks":fubini,"endpointRetainingRadialIbPChecks":ibp,
        "actualCenteredPressureAfterHaar":"pbar=I(f)-I(rho)*J(f), f=Haar(gr), since J(rho)=1",
        "twoPrimitiveKernel":"K_R(u)=(R^2-u^2)*1(u<R)/2 - chi(R)*(beta^2-u^2)/2 - [I(r I(rho))(R)-chi(R) J(r I(rho))]",
        "kernelContinuousAtR":True,"kernelDerivative":"(chi(R)-1(u<R))*u",
        "mixedRemoval":"Move radial or auxiliary derivative off Ctheta,Z4 onto the lower factor/kernel; fixed radial endpoints retained and periodic auxiliary faces cancel.",
        "pureAxialDiagnostic":"Set Ctheta=f(R)*(1+Z^5/120), no auxiliary variable. The divergence-free gauge curl has a nonzero pure-Z5 highest nested pressure coefficient at Z=0,R=2. This is a control on the proposed inference, not an assertion about the exact original potential.",
        "pureAxialDiagnosticCoefficientWithoutCommonSignsAndEpsilon":str(coefficient),
    }


def covariance_grades(x):
    one=x["one"]["postCancellationUniformWeights"]["rows"]
    assert {Q(r["nativeVelocityOverPBandPower"])-3*r["slowRZ"] for r in one}=={Q(71,4)}
    assert {r["nativeVelocityPoleAfterG"]-3*r["slowRZ"] for r in one}=={9}
    two=x["weights"]["conditionalOrderedVariation"]["2"]
    assert Q(two["rawUniformBandInterceptAtSlope3"])+Q(1,2)==10 and two["rawUniformPoleInterceptAtSlope3"]==9
    assert x["two"]["conditionalWeightedComparison"]["explicitEpsilonAfterC93Charge"]=="49999/50000"
    k,rho=Q(1,100000),Q(1,1048576)
    assert Q(1,2)-k-rho>0
    # (epsilon, zeta, band, outer pole base) before slow slope 3j.
    p=(Q(1,2),Q(1,2),Q(1,4),Q(9,2))
    f=(1-6*k,Q(1,2),Q(71,4),Q(27,2))
    g=(1-2*k,Q(1),Q(10),Q(15))
    pairs={"PP":(p,p),"PF1":(p,f),"F1F1":(f,f),"F2F2":(g,g)}
    rows={}
    for name,(a,b) in pairs.items():
        slope=[]
        for j in range(5):
            grades={(a[2]+3*i+b[2]+3*(j-i),a[3]+3*i+b[3]+3*(j-i)) for i in range(j+1)}
            assert len(grades)==1
            band,pole=grades.pop()
            assert band<64 and pole<=42
            slope.append({"slowOrder":j,"band":str(band),"pole":str(pole)})
        rows[name]={"epsilon":str(a[0]+b[0]),"zeta":str(a[1]+b[1]),"rows":slope}
        assert a[1]+b[1]>=1
    assert min(Q(x["epsilon"]) for n,x in rows.items() if n!="PP")==Q(3,2)-6*k
    return {"pairGrades":rows,
            "condition":"Retain the same live phase-free velocity envelopes at each checked ordinary derivative. Forced curl adds one derivative or L with explicit inverse carrier. For S^3 use the existing epsilon^(-rho) debit. Higher pure Z5 of the Forced gauge is an input, not a C4 consequence."}


def main(goal,source,frontier_path,out):
    sources={k:json.loads(pin(goal/path,digest)) for k,(path,digest) in PINS.items()}
    rt=pin(source,PRESSURE_PIN).decode()
    for text in ("P=scalar(G,whole(haarGr)", "source=G.sub(gr,G.mul(rho,P))",
                 "value=G.sub(integrals.left,G.mul(chi,integrals.whole))"):
        assert text in rt
    frontier=json.loads(pin(frontier_path,FRONTIER))
    assert frontier["originalSignedFrontier"]["nativePostForcedHaarRoots"]==[21999624,22000447]
    demand=sorted(tuple(a+b for a,b in zip((0,5,0),d,strict=True)) for d in ((1,0,0),(0,1,0),(0,0,1)))
    assert demand==[(0,5,1),(0,6,0),(1,5,0)]
    result={
        "status":"VERIFIED_CENTERED_SIGNED_PRESSURE_AND_CONDITIONAL_PHASE_FREE_DONOR_GRADES",
        "pins":{**{k:v[1] for k,v in PINS.items()},"frontier":FRONTIER,PRESSURE_SOURCE:PRESSURE_PIN},
        "centeredPressure":exact_kernel_controls(),"covarianceGrade":covariance_grades(sources),
        "remainingPureAxialPotentialOrder":["C_theta",0,5,0],
        "possibleNewModeOneOrderSixInitializedMeanDirectionsRZL":demand,
        "sourceOrderPremise":"Original normalized Forced Z5 needs Primary ordinary velocity through seven, already in its order range. Mode one requires separate higher mean/input bounds; mode two has no mean. Higher source coefficient budgets and original regularity still require attachment.",
        "separateCompactPressureBranch":"Original middle beta_F,Z5 from epsilon^3 beta_F,ZZ after three further Z derivatives of Haar pressure requires J_theta(afterTemporal),Z6. It is independent of the exceptional Forced covariance donor.",
        "finalJets":0,"release":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Verified 54 centered pressure identities, nine radial IBP controls, and the nonzero generic pure-Z5 donor.")


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser=ArgumentParser()
    for name in ("goal","source","frontier","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    main(args.goal,args.source,args.frontier,args.out)
