"""Attach the six C128 high TT slots of the original initialized compact mean."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path
import runpy

PINS={
 "dependency":("continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json","79d91f601780ea4bf9696927d60529f5ce11cfc868fafa1d0193ada978b37d36"),
 "prior":("continuation125/sigma-extra-mean/replay1.json","b880bac8b64973a0bb7076d0b04105f7bcb84671585aa810701c96f5a271865e"),
 "recurrence":("continuation103/initialized-mean/final/verify_initialized_mean.py","7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe"),
 "premean":("continuation97/middle-covariance/premean/final/verify_premean_whole_path.py","0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f"),
 "c98":("continuation98/covariance/final/global-primary-covariance.json","05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
 "c11":("continuation101/high-frame/high-frame.json","5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603"),
 "c11Joined":("continuation101/high-frame/joined-high.json","4ad8582a8d107446cbdab41c0fc06b7415241fb7f09e795aa0e587be07b2637d"),
 "c15":("continuation106/frame15/frame-c15.json","09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
 "c15Joined":("continuation106/frame15/joined-c15.json","98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3"),
 "compactStatic":("continuation106/high-compact-mode-one/compact-mode-one-c15.json","00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"),
 "lateStatic":("REPO/c108/mode-one-late-mean/late-mode-one-mean.json","b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41"),
 "currentWminus":("continuation127/late-swirl-covariance/pre-signed-late-swirl.json","0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9"),
 "c119":("continuation119/compact-beta-zzt2/final/verify_compact_beta_zzt2.py","11244810e77f78442ed3f77b3a8c856f7e7200e6e57b81432a09df865b036538"),
 "slow10Proof":("continuation119/signed-time-covariance/final/verify_mixed_signed_time_covariance.py","baed783739f9d4c602623d2c34b4b8dc0ecfb41d931b014e04cb2bb9677d5180"),
 "five":("continuation97/middle-five-map/after-temporal-five-map.json","3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102"),
 "sigma":("continuation108/early-sigma-c6/final/verify_sigma_c6.py","f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8"),
}

def load(a,key,form="json"):
    name,want=PINS[key]
    path=(a.goal/name.removeprefix("REPO/")) if name.startswith("REPO/") else (a.work/name)
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==want,(key,path)
    if form=="python":
        return runpy.run_path(str(path))
    return json.loads(raw) if form=="json" else raw.decode()

def moving_profile(z,t):
    """Compare iterated product differentiation and multinomial weights."""
    terms={((0,0),)*4:1}
    for axis in (0,)*z+(1,)*t:
        add=Counter()
        for key,multiplicity in terms.items():
            for j,slot in enumerate(key):
                dest=tuple(v+(i==axis) for i,v in enumerate(slot))
                add[key[:j]+(dest,)+key[j+1:]]+=multiplicity
        terms=dict(add)
    direct={}
    for zz in product(range(z+1),repeat=3):
        for tt in product(range(t+1),repeat=3):
            residual=(z-sum(zz),t-sum(tt))
            if min(residual)<0:
                continue
            word=(*zip(zz,tt),residual)
            denominator=1
            for a,b in word:
                denominator*=factorial(a)*factorial(b)
            direct[word]=factorial(z)*factorial(t)//denominator
    assert terms==direct and sum(terms.values())==4**(z+t)
    moved=terms[((z-1,t),(1,0),(0,0),(0,0))]*factorial(z-1)*factorial(t)
    assert moved==factorial(z)*factorial(t)>0
    return {"primitiveDerivativeZT":[z,t],"distinctProductsPerCopy":len(terms),
            "exactMultiplicityPerCopy":sum(terms.values()),"nonzeroMovingScaleControl":moved,
            "originalFactors":["Jtheta","moving s power","1+eta^2","axial radial primitive"]}

def main(a):
    d={k:load(a,k) for k in PINS if k not in {"recurrence","premean","c119","slow10Proof","sigma"}}
    recipe=load(a,"recurrence","python")
    premean=load(a,"premean","python")
    binding=load(a,"c119","python")["source_bind"](a.runtime)
    source=load(a,"sigma","text")
    assert '(Q(7,2) if f=="beta" else Q(1,2))+3*sum(a),0,54920)' in source
    targets=sorted((f,(*idx,0)) for f,idx in d["dependency"]["newCompactMeanSecondTimeOnly"])
    assert targets==[(f,(0,z,2,0)) for f,zs in (("beta",(4,5)),("gamma",(3,4)),("v",(3,4))) for z in zs]
    assert d["dependency"]["roots"]==[22001223,22001224,22000443]
    assert d["five"]["sourceDefinitions"]=={"Jtheta":21374531,"Jz":21374575,"P":21374489,
        "beta":21374944,"complete_gr":21374149,"gamma":21374926,"haar_gr":21374485,"v":21374922}
    assert d["five"]["radialEndpoints"]==d["dependency"]["fixedEndpoints"]==[17743711,17743713]
    assert [d["five"]["beta"][k] for k in ("integral","nativeGammaZ","wholeGammaMomentZero")]==[21374941,21374939,True]
    assert d["five"]["conditionalBounds"]["liveChart"]["sDependsOnZ"]
    assert d["five"]["fiveMapCoefficients"]["fiveZeroNumerators"]
    row,(cov,shifted,cutoff,inverse)=recipe["whole_recipe"](premean)
    # Reproduce the old high TT arithmetic through independent old targets
    # before summing their additional counterparts.
    old=[(f,tuple(x)) for f,x in d["prior"]["targets"]]
    oldrow,_=recipe["whole_recipe"](premean)
    assert [oldrow(f,x) for f,x in old]==[item["conditionalTemporal"] for item in d["prior"]["directTemporalRows"]]
    direct=[{"field":f,"RZTL":idx,"recurrenceOperand":row(f,idx)} for f,idx in targets]
    moments,linear,grams=recipe["compact_demand"](targets)
    maximum={m:max(map(sum,indices)) for m,indices in moments.items()}
    assert maximum=={"P":6,"Jz":6,"Jtheta":8}
    paired=[]
    cap_mass=Q(0)
    cap_geom=0
    for moment,order,f,b,g,c,axial,multiplicity in grams:
        u,v=row(f,b),row(g,c)
        eps=Q(u["minEpsilon"])+Q(v["minEpsilon"])+axial
        surplus=Q(u["bandIntercept"])+Q(v["bandIntercept"])+3*axial-Q(1,2)
        cap_mass=max(cap_mass,Q(u["coefficientMass"]),Q(v["coefficientMass"]))
        cap_geom=max(cap_geom,u["geometryPower"],v["geometryPower"])
        paired.append({"moment":moment,"direction":order,"left":[f,b],"right":[g,c],
                       "epsilonGrade":str(eps),"bandSurplus":str(surplus),"multiplicity":multiplicity})
    assert len(paired)==858 and cap_geom==7
    needed=cov|linear
    high={r for r in needed if sum(r[1][:3])>7 or r[1][3]>8}
    assert len(needed)==450 and len(high)==54 and max(x[3] for _,x in needed)==3
    assert len(linear)==81 and linear&high=={("W_thetaz",(0,6,2,0))}
    assert len(shifted)==129 and len(inverse)==84 and max(map(sum,cutoff))==9
    c11={r for r in high if sum(r[1][:3])<=9}
    c15=high-c11
    assert c15=={("W_rz",(0,8,2,l)) for l in (0,2)}
    assert d["c11"]["frame"]["auditedDirections"]==364 and d["c11Joined"]["backgroundOrdinaryOrder"]==12
    assert d["c11Joined"]["regularTargetOrdinaryOrder"]==11 and d["c11Joined"]["pins"]["frame"]==PINS["c11"][1]
    assert d["c15"]["matrixDirections"]==816 and d["c15"]["cutoffOrder"]==19
    assert d["c15Joined"]["pins"]["frame"]==PINS["c15"][1]
    assert d["c15Joined"]["originalBackgroundOrder"]==16 and d["c15Joined"]["regularTargetOrder"]==15
    prior_transfer=load(a,"slow10Proof","text")
    assert "Slow degree ten asks for Primary order" in prior_transfer and "twelve" in prior_transfer
    assert d["c98"]["coefficientBudget"]["wholePathCovarianceLogCap"]=="H/2^113"
    high_rows=[]
    for frame,orders,source in ((d["c11"],c11,"C101 all-RZT C11"),
         ({"primaryUniformLogRanks":d["c15"]["uniformLogRanks"]},c15,"C106 all-RZT C15")):
        for item in recipe["high_covariance_rows"](orders,frame):
            idx=item["RZTL"]
            high_rows.append({**item,"independentFrame":source,
                              "sufficientOrdinaryAuditOrderWithCurl":sum(idx[:3])+2})
    assert len(high_rows)==len(high)
    for r in high_rows:
        assert r["sufficientOrdinaryAuditOrderWithCurl"]<=(15 if r["independentFrame"].startswith("C106") else 11)
    low_rank=sum(d["c98"]["coefficientBudget"]["commonGlobalCovarianceRanks"])
    high_rank=max(sum(r["logDegreeRanks"]) for r in high_rows)
    linear_rank=max(low_rank,*(sum(r["logDegreeRanks"]) for r in high_rows
                              if (r["component"],tuple(r["RZTL"])) in linear))
    mean_rank=max(low_rank,high_rank)+256*cap_geom+cap_mass.numerator.bit_length()+64
    shape=d["compactStatic"]["coefficientProfile"]
    assert d["lateStatic"]["sameCompactProfileAsC106"]
    assert d["compactStatic"]["compactMomentMaximumZT"]=={"P":10,"Jz":10,"Jtheta":11}
    assert all(maximum[k]<=d["compactStatic"]["compactMomentMaximumZT"][k] for k in maximum)
    assert d["compactStatic"]["cutoff"]["order"]==13
    assert shape["motionOfSRetained"] and shape["compactIndependentOfL"] and shape["compactZeroOnBothSourceCollars"]
    assert [shape[k] for k in ("finiteScalarCoefficientBits","finiteScalarGeometryBPower")]==[2938,42]
    assert Q(1,128)**2+Q(4,9)<1
    finite=shape["finiteScalarCoefficientBits"]+shape["finiteScalarGeometryBPower"]+64
    for r in paired:
        assert (Q(r["epsilonGrade"])-1)/2>Q(2*mean_rank+4096,2**128)+Q(r["bandSurplus"])/2**32636
    compact_rank=max(linear_rank,mean_rank)+finite
    assert compact_rank<2**16
    # Distinguish this initialized-Primary transfer from the later
    # dynamic W^- roles in the full C127 reconstructed pressure.
    current={tuple(x["RZTL"]) for x in d["currentWminus"]["covarianceRows"] if x["allSixComponents"]}
    assert len(current)==29
    dynamic={(f,tuple(x)) for f,x in d["dependency"]["newPositiveTPreSignedCovariance"]}
    covered={(f,x) for f,x in dynamic if (*x,0) in current}
    unsupported=dynamic-covered
    assert ("rz",(0,6,1)) in unsupported
    def compact_row(field,idx):
        pure=idx[0]+idx[1]+idx[2]
        return {"field":field,"RZTL":idx,"epsilonPower":"2" if field=="beta" else "1",
                "bandPower":str((Q(7,2) if field=="beta" else Q(1,2))+3*pure),
                "logChargeHOver2Pow128":compact_rank,"pole":0,
                "compactZeroOnBothOriginalCollars":True}
    moving=[moving_profile(z,2) for z in (5,6)]
    result={
      "schema":"MathScope.C128.OriginalInitializedCompactHighTT/1",
      "status":"VERIFIED_ORIGINAL_RECURRENCE_CONDITIONAL_ALL_SIX_COMPACT_TT",
      "pins":PINS,"runtimeSourceBinding":binding,"originalSourceDefinitions":d["five"]["sourceDefinitions"],
      "fixedEndpoints":d["five"]["radialEndpoints"],"conditionalRows":[compact_row(f,x) for f,x in targets],
      "primaryCovarianceCount":len(needed),"originalPrimaryCovarianceSlots":sorted(needed),
      "highPrimaryRows":high_rows,"oneHighLinearCompactCovariance":sorted(linear&high),
      "primaryRZTLMaximumSlowL":[max(sum(r[:3]) for _,r in needed),max(r[3] for _,r in needed)],
      "momentRequests":{k:sorted(v) for k,v in moments.items()},"momentMaximumTotalZT":maximum,
      "quadraticHaarBranches":paired,"recurrenceIntermediateRows":direct,
      "shiftedPrimitiveCount":len(shifted),"inverseCount":len(inverse),"cutoffOrder":max(map(sum,cutoff)),
      "compactMovingBetaControls":moving,"staticGeometry":{"finiteBits":2938,"finiteGeometryPowers":42,"shapeOrder":11,
         "originalCutoffOrder":13,"originalWholeAngularMomentZero":True,"torusIndependent":True},
      "coefficientDebitInHOver2Pow128":{"linearPrimary":linear_rank,"directTemporal":mean_rank,"compact":compact_rank},
      "separateDynamicWminus":{"coverageReference":"C127 all-six late-swirl table, before any later new evidence",
         "newPositiveTyped":sorted(dynamic),"coveredByExistingExactTypedCaps":sorted(covered),
         "stillOutsideThisCoverage":sorted(unsupported)},
      "scope":"Original initialized compact mean only, conditional on original chart, stable same-label Primary covariance, analytic Fourier transfer, fixed radial paths and smooth compact profile. These rows do not certify the full original Signed stress or any new post-Forced covariance.",
      "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS six C128 TT slots; 450 Primary, 54 high, 2 C15; compact rank",compact_rank,
          "Wminus baseline coverage",len(covered),"/",len(dynamic))

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("work","goal","runtime","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
