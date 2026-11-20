"""Join protected PostFive mean derivatives to the original background eikonal."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

PINS={
    "background":"d4ed6a8f3e73edd6db2bdf068d6e3a037f27a1c8ad0e284e75da814e3ce44d8b",
    "mean":"5e5a5a4585aad76fbba3a5c0d2b290fb00d208ce058c5308094a805c5e6dec23",
    "reference":"7f4db7e44f838f60e0ae27e9df8cbdd67fe6c41b154ea2dad11a810399ea079f",
    "existingValue":"12aae9ad5d4faaee53643e8178065221010d0b132d5f0eda49bb50158967acf9",
}

def read(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw)

def main(a):
    bg=read(a.background,"background")
    mean=read(a.mean,"mean")
    reference=read(a.reference,"reference")
    prior=read(a.existing_value,"existingValue")
    assert bg["protectedSourceSHA256"]==mean["protectedSourceSHA256"]==prior["protectedStream"]
    assert mean["sourceRoots"]=={"initialized":[21374946,21374947,21374948],
        "temporalPotential":22150943,"fivePotential":22151952,"directSwirl":22154876}
    assert mean["pins"]["reference"]==PINS["reference"]
    assert mean["ownReferenceRadialSplit"].startswith("D_r^own Delta_own = ratio^(-A)*(ratio^(-1/2)*partial_R Delta_reference + a_own*L Delta_reference)")
    assert reference["referenceMap"]=={"R":"R/sqrt(ratio)","Z":"Z/ratio^D","T":"T/ratio","Q":"ratio*Q","s":"s/ratio"}
    assert bg["nativeCoordinates"]["L_of_n_and_pure_background_eikonal"]==0
    assert Q(prior["combined"]["epsilonGrade"])==Q(39993,100000)
    assert bg["normalFirstOrdinaryCaps"]==["2 Bnorm^6 S exp(H/2^128)","Bnorm^7 when alpha=R; zero when alpha=Z",
                                         "2 epsilon Bnorm^6 S exp(H/2^128)"]
    # Q_ref=ratio*Q_own and epsilon_ref=ratio^h*epsilon_own.
    # The axial derivative transfers the exponent -D-h=-1/2.
    D,h=(Q(1,2),-1),(Q(0),1)
    assert tuple(-u-v for u,v in zip(D,h,strict=True))==(Q(-1,2),0)
    # Product rule, verified with independent indexed placeholders.
    for op in ("D_r","D_z"):
        components=("R","theta","z")
        products=[("Delta."+k,"n."+k) for k in components]
        differentiated=Counter(tuple(sorted((*product[:j],op+":"+factor,*product[j+1:])))
                               for product in products for j,factor in enumerate(product))
        expected=Counter(tuple(sorted((op+":Delta."+k,"n."+k))) for k in components)
        expected.update(tuple(sorted(("Delta."+k,op+":n."+k))) for k in components)
        assert differentiated==expected and sum(differentiated.values())==6
    # With the same Y tuple, even a reference-constant radial partial
    # can have nonzero L. The exact split therefore retains a_own.
    sample_ratio=Q(4)
    reference_partial,auxiliary_slope=Q(0),Q(1)
    a_own,a_ref=Q(5),Q(4)
    assert reference_partial/2+a_own*auxiliary_slope!=(reference_partial+a_ref*auxiliary_slope)/2
    assert sample_ratio==4

    e=Q(1,100000)
    grade={k:Q(v) for k,v in mean["componentUniformGrades"].items()}
    assert grade["value"]==Q(22499,25000)
    assert grade["Dr"]==Q(17999,20000) and grade["Dz"]==Q(47499,25000)
    assert grade["R"]==grade["Dr"] and grade["L"]==grade["Z"]
    assert grade["Dz"]==grade["Z"]+1 and Q(mean["bandDegree"])==59
    assert e==Q(mean["epsilonDebit"])
    # Every component of n is at most B^4 on the protected cone.
    # The worst derivative has 2 B^7 S M, with one axial epsilon.
    # There are three components, and the carrier contributes at most 4.
    coefficient=3*4*(1+2)
    rank=7+1+(coefficient-1).bit_length()
    assert coefficient==36 and rank==14
    assert Q(rank,2**128)+Q(1,2**32636)<e/2
    assert e*Q(2**(128*511),4)>1
    cases={}
    for physical,donor,normal_eps in (("D_r","Dr",0),("D_z","Dz",1)):
        phase_rows={
            "derivativeHitsMean":grade[donor]-Q(1,2),
            "derivativeHitsNormal":grade["value"]+normal_eps-Q(1,2),
        }
        scalar=min(phase_rows.values())-e
        base=Q(bg["normalizedPhysicalEpsilonGrades"][physical])
        complete=min(scalar,base)-e
        cases[physical]={
            "exponentsBeforeFinalProductDebit":{k:str(v) for k,v in phase_rows.items()},
            "background":str(base),"meanIncrement":str(scalar),"wholeEikonal":str(complete),
        }
    assert cases["D_r"]["meanIncrement"]=="19997/50000" and cases["D_r"]["wholeEikonal"]=="39993/100000"
    assert cases["D_z"]["meanIncrement"]=="27999/20000" and cases["D_z"]["wholeEikonal"]=="69997/50000"
    result={
        "schema":"MathScope.C124.OriginalProtectedRepeatWholeEikonalPhysicalFirstDerivative/1",
        "status":"VERIFIED_PROTECTED_PRODUCT_RULE_CONDITIONAL_WHOLE_EIKONAL_FIRST_DERIVATIVES",
        "pins":PINS,"protectedStream":prior["protectedStream"],"charts":prior["charts"],
        "formula":"E=mk(b n_R+epsilon v(omega_T-G omega_Z)+Delta_own dot n), m=1,2",
        "normalizedSpatialGrades":cases,
        "epsilonDebits":{"normalAndCarrierFiniteProducts":str(e),"finalFiniteSum":str(e)},
        "normalProductExtraBandDegree":1,"bandDegreeBeforeEarlierMeanCoefficientDebit":60,
        "normalProductCoefficientRankInHOver2Pow128":rank,
        "radialTransport":mean["ownReferenceRadialSplit"],
        "axialTransport":"D_z^own Delta_own = ratio^(-A-1/2) D_z^reference Delta_reference with fixed ratio.",
        "physicalUnits":"The derivatives of this normalized scalar with respect to physical r,z retain Q_own^(-1/2).",
        "scope":["Original early slab with jointly admitted own and reference brackets.",
                 "Both exact first derivative paths use the same original profile, cone and protected mean donors.",
                 "The scalar estimate is prior to multiplication by a restored harmonic or differentiated wave.",
                 "Active Repeat applications, radial seams and the complete residual need separate independent evidence."],
        "finalJets":0,"release":"HOLD",
    }
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS protected mean product and whole eikonal derivatives",
          cases["D_r"]["wholeEikonal"],cases["D_z"]["wholeEikonal"])

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("background","mean","reference","existing-value","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
