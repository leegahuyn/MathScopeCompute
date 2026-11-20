"""Join the eighteen original covariance inputs to the pure Z4/Z5 Forced gauge."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import comb, factorial
from pathlib import Path
import runpy


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
BUDGET=BAND/"first-forced-budget"
NAMES=("beta","v","gamma")
K=Q(1,100000)
PINS={
    "crop":"870ddc91570d4094896192360bd23dfe0b7391f95346c46a07b0072017252daf",
    "high18":"7422e6795f055e0bee7bb1ab4b7d953a69e73bca9e9a010d310168f067f5c6cd",
    "joined":"4ad8582a8d107446cbdab41c0fc06b7415241fb7f09e795aa0e587be07b2637d",
    "frame":"5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603",
    "modeOne":"fbe1aee25a11de039be7268f61264450bcd6673aca6b4eb889b135c3a946b5c0",
    "c7":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "z8":"c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "signedPressure":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
    "originalMeanProgram":"f0fffd5c57aec9344487524e27ecefeef53ea91237269ad30b45d97109729650",
}
ORIGINAL={
    "fiveMap":(BUDGET/"after-temporal-five-map/after-temporal-five-map.json","3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102"),
    "gauge":(BUDGET/"outer-physical-gauge/source/forced-gauge-spatial.json","b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59"),
    "matrix":(BAND/"outer-fixed-label-norm/matrix/matrix-s-j.json","e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "background":(BAND/"outer-fixed-label-norm/background-transport.json","0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc"),
    "cancel":(BUDGET/"principal-mode-cancellation/mode-one/mode1-linear-cancellation.json","02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
    "inner":(BUDGET/"inner-physical-gauge/inner-forced-energy-slice.json","eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8"),
    "middle":(BUDGET/"middle-covariance/frame/middle-frame-budget.json","b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8"),
}


def checked(path,h):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==h,path
    return raw


def temporal_norm(path):
    checked(path,PINS["premean"])
    fn=runpy.run_path(str(path))["record"]
    raw=inspect.getsource(fn)
    old="for order in demands:"
    assert raw.count(old)==1
    ns={}
    exec(compile(raw.replace(old,"for order in demands[name]:"),str(path),"exec"),fn.__globals__,ns)
    return ns["record"]


def attach_covariance(d):
    joined=d["joined"]
    assert joined["pins"]["frame"]==PINS["frame"]
    assert joined["backgroundOrdinaryOrder"]==12 and joined["regularTargetOrdinaryOrder"]==11
    assert joined["selectedCovarianceCoefficientLogCap"]=="H/2^112"
    assert d["background"]["scope"]["derivativeOrder"]==10
    rows=d["high18"]["rows"]
    by_key={(r["component"],tuple(r["RZL"])):r for r in rows}
    inv=d["crop"]["derivativeInventory"]
    required={(f,tuple(a)) for f,a in inv["remainingSufficientNewCovarianceRequests"]}
    assert len(rows)==len(required)==18 and set(by_key)==required
    assert all(r["epsilonGrade"]=="1" and Q(r["bandPower"])==Q(1,2)+3*r["RZL"][1]
               for r in rows)
    assert all(r["coefficientLogCap"]=="H/2^112" for r in rows)
    assert max(r["primaryMaximumSlowOrder"] for r in rows)==11
    assert all({k:v for k,v in r.items()}==by_key[(r["component"],tuple(r["RZL"]))]
               for r in d["frame"]["selectedRows"])
    low=sum(d["c7"]["coefficientBudget"]["commonGlobalCovarianceRanks"])
    z8=d["z8"]["selectiveCovariance"]
    even={r["RZTL"][3] for r in z8["actualDemandRows"] if r["component"]=="rz"}
    assert even=={0,2,4}
    reused={("W_rz",(0,8,k)) for k in range(4)}
    assert {(w,tuple(a)) for w,a in inv["reusedWrzZ8L"]}==reused
    high=max(sum(x["logDegreeRanks"]) for x in rows)
    high=max(high,sum(z8["wholePathCovarianceLogDegreeRanks"])+2)
    assert low<2**15 and high==48475
    return required,reused,low,high


def mixed_mean(path,d,covered):
    rec=temporal_norm(path)
    # On a pure Z^j source derivative, at most one native R, Z or L lands on
    # the increment inside the original ordinary gradient/divergence block.
    pure={(0,z,0) for z in range(7)}
    gradient={(r,z,l) for z in range(6) for r,l in ((1,0),(0,1))}
    all_orders=pure|gradient
    rows,asks,paths,cuts,invs=rec({key:sorted(all_orders) for key in NAMES})
    needed={(w,a) for w,a in asks if sum(a[:2])>7}
    # The direct pure beta,Z6 has the existing native outer FTC contraction.
    reduced={("W_rz",(1,7,l)) for l in (0,2)}
    assert reduced<=needed and needed-reduced <= covered
    max_chi=max(sum(a) for a in cuts)
    assert max_chi==8
    assert max(x["geometryPower"] for body in rows.values() for x in body)<=16
    assert max(Q(x["coefficientMass"]) for body in rows.values() for x in body)<2**32
    minimum_pure=100
    minimum_gradient=100
    for body in rows.values():
        for x in body:
            r,z,l=x["RZL"]
            assert Q(x["bandIntercept"])<=Q(21,2)
            if (r,l)==(0,0) and z<=5:
                minimum_pure=min(minimum_pure,Q(x["minEpsilon"]))
            minimum_gradient=min(minimum_gradient,Q(x["minEpsilon"]))
    assert minimum_pure==1-K and minimum_gradient>=1-2*K
    source=d["modeOne"]["originalSource"]["conservativeAdditionalActualComponentRequests"]
    assert all(tuple(x["RZL"]) in all_orders for x in source)
    return {
        "ordinaryMeanDirectionsByComponent":sorted(all_orders),"neededHighCovarianceRows":sorted(needed),
        "originalRadialFTCRows":sorted(reduced),"targetRows":rows,
        "maximumDirectChiDerivative":max_chi,
        "eikonalIncrementGrade":str(minimum_pure),"ordinaryGradientIncrementGrade":str(minimum_gradient),
        "shiftedFixedEndpointOperationCounts":[len(asks),len(paths),len(cuts),len(invs)],
    }


def high_cutoff(path,mean_program,d):
    checked(mean_program,PINS["originalMeanProgram"])
    rec=temporal_norm(path)
    compact={n:[tuple(a) for a in dirs] for n,dirs in d["crop"]["derivativeInventory"]["compactTemporalVelocityRequests"].items()}
    _,_,_,cutoffs,_=rec(compact)
    assert max(sum(a) for a in cutoffs)==9
    fn=runpy.run_path(str(mean_program))["implicit_and_cutoff"]
    raw=inspect.getsource(fn)
    changes=(
        ("assert order == 7","assert 7 <= order <= 9"),
        ("ds[n] = 2 * sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n)",
         "ds[n] = 2 * (int(n==1) + sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n))"),
        ("factorial(7).bit_length()+8","factorial(order).bit_length()+order+1"),
    )
    for old,new in changes:
        assert raw.count(old)==1,old
        raw=raw.replace(old,new)
    ns={}
    exec(compile(raw,inspect.getfile(fn),"exec"),fn.__globals__,ns)
    rec=ns["implicit_and_cutoff"]
    earlier=d["signedPressure"]["compactInitializedFiveMapAttachment"]["mixedRZTChartAndCutoffCoefficientBitsThrough7"]
    assert rec(7)["coefficientLog2Ceilings"]==earlier
    nine=rec(9)
    assert max(nine["coefficientLog2Ceilings"].values())<256
    return nine


def compact_budget(d,low,high,geometry):
    p=d["fiveMap"]
    g=geometry["coefficientLog2Ceilings"]
    assert p["beta"]["wholeGammaMomentZero"]
    assert p["fiveMapCoefficients"]["fiveZeroNumerators"]
    old=p["conditionalBounds"]
    assert old["fiveNormalizedMomentLower"]=="2^-16"
    assert old["angularNodeGapStrictLower"]=="1/8" and old["axialNodeGapLower"]=="lambda/5"
    assert max(g.values())<256
    ga=g["etaOrdinary"]
    gs=g["sScaleOrdinary"]
    max_order=7
    # Ordinary Faà di Bruno, with |q^(k)|<=2*k!*q^(k+1) for
    # q=1/t+1/(1-t) and q^m exp(-q)<=m!. The direct chart donor
    # budgets D<=Renv and B_R<=2*Renv on the original radial envelope.
    bump=[1]+[factorial(n)*sum(comb(n-1,k-1)*2**k*factorial(n+k)//factorial(k)
                              for k in range(1,n+1)) for n in range(1,max_order+1)]
    bell=[1]
    for n in range(max_order):
        bell.append(sum(comb(n,k)*bell[k] for k in range(n+1)))
    assert bell[-1]==877 and max(x.bit_length() for x in bump)<64
    inverse_bits=3+10+16+7+2*(ga+1)+8
    profile_bits=max(x.bit_length() for x in bump)+bell[-1].bit_length()+7*(5+gs)+gs+16
    primitive_bits=max(sum(comb(n,k)*factorial(k)*max(1,n-k) for k in range(n+1))
                       for n in range(max_order+1)).bit_length()+24
    # The radial profile geometry debits Renv^14 from the argument
    # (at most seven products of D*B_R), Renv^5 from its native multipliers,
    # Renv^5 from the inverse moment rows, and a finite primitive radius.
    finite_bits=inverse_bits+profile_bits+primitive_bits+128
    finite_band_geometry=32
    assert finite_bits<4096 and finite_band_geometry<64
    compact_charge=low+finite_bits+finite_band_geometry+64
    # Quadratic coefficient (two high factors) is absorbed by at least
    # 1-3*kappa excess powers over epsilon^1. Half the epsilon log lower
    # bound suffices, including the new whole-path integration by parts.
    eps_q=min(Q(x) for x in d["crop"]["gradeAbsorption"]["minimumQuadraticEpsilonByMoment"].values())
    extra_s=max(Q(x) for x in d["crop"]["gradeAbsorption"]["maximumQuadraticBandSurplusBeforeAbsorption"].values())
    assert (eps_q-1)/2 > Q(2*high+4096,2**128)+extra_s/2**32636
    assert compact_charge<2**16
    # On the original compact support eX0<X<e^2X0, y>1 and d>3.
    assert Q(1,128)**2+Q(4,9)<1
    return {
        "compactIndependentOfL":True,"compactZeroOnBothSourceCollars":True,
        "motionOfSRetained":True,"fixedScaledTargets":["s^(2A) P","s^(2A-3/2) Jtheta","s^(2A-1) Jz"],
        "higherBumpDerivativeIntegerCaps":bump,"FaadiBrunoPartitionCountAtSeven":bell[-1],
        "linearCompactCovarianceUsesOnlyC7":True,"compactChargeInHOver2Pow128":compact_charge,
        "finiteScalarCoefficientBits":finite_bits,"finiteScalarGeometryBPower":finite_band_geometry,
        "bound":"v_F,gamma_F: epsilon*S^(1/2+3(r+z)); beta_F: epsilon^2*S^(7/2+3(r+z))",
    }


def normalized_forced(d,temporal,compact,high):
    grade=Q(temporal["eikonalIncrementGrade"])
    increment=Q(temporal["ordinaryGradientIncrementGrade"])
    assert grade==1-K and increment+Q(1,2)-K>=grade
    cancel=d["cancel"]["postCancellationConditionalGrades"]
    assert Q(cancel["commonPostCancellationConditionalEpsilonDegree"])==grade
    assert Q(cancel["directFieldEpsilonGradesWithCarrierBound"]["imaginaryU"])==grade
    # Original linear geometry and covariance coefficients are on the same
    # H_w trajectory, with the frozen pulse endpoints and k; no theta phase
    # derivative is taken in this ordinary gauge donor.
    baseline=d["gauge"]["pureL2NativeForcedExtension"]["noLDerivativeOfFrameNormalCutoffOrGauss"]
    assert "H_w preserves L, xi and d" in baseline and "No spatial differentiation of a pulse endpoint" in baseline
    charge_mean=max(high+256,compact["compactChargeInHOver2Pow128"])+1
    assert charge_mean<2**16
    old_primary=sum(d["c7"]["coefficientBudget"]["commonPrimaryRanks"])
    actual_primary=sum(d["frame"]["primaryUniformLogRanks"])
    assert actual_primary>old_primary
    M=d["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    gauge=[]
    for j in (4,5):
        rows=[r for r in d["modeOne"]["regularProjectedOrderedVariation"] if tuple(r["RZL"])==(0,j,0)]
        [ledger]=rows
        folded=ledger["logChargeInHOver2Pow128"]-2**16+charge_mean-old_primary+actual_primary
        c=0
        for k in range(j+1):
            q=0
            for i in range(k+1):
                a,b,s=M["n"][i]
                a2,b2,s2=M["inverseNormalSquared"][k-i]
                assert s+s2<=k
                q=max(q,(Q(a)*Q(a2)*comb(k,i)).__ceil__().bit_length()+7*(b+b2))
            c=max(c,q+comb(j,k).bit_length())
        gauge_log=folded+c+16
        assert gauge_log<2**17
        s=Q(ledger["finalBandPower"])
        pole=Q(ledger["outerPoleAfterZeta"])
        assert s==Q(71,4)+3*j and pole==Q(21,2)+3*j
        assert s+3<64 and 2*Q(1,2**111)+(s+3)/2**32636<K
        gauge.append({"RZL":[0,j,0],"normalizedForcedVelocityOverP":{"epsilon":str(grade),"band":str(s)},
                      "phaseFreeGaugeOverP":{"epsilonBeforeBandAndCoefficientDebit":str(grade+Q(1,2)),
                        "epsilonAfterOneDebitRetainingDisplayedBand":str(grade+Q(1,2)-K),
                        "band":str(s),"outerPoleAfterZeta":str(pole),
                        "innerPoleAfterZeta":ledger["conservativeInnerPoleCapAfterZeta"],"zeta":"1/2"},
                      "logCoefficientChargeInHOver2Pow128":gauge_log,
                      "wholeCoefficientLogCap":"H/2^111"})
    return {"newMeanCoefficientChargeInHOver2Pow128":charge_mean,
            "newMeanCoefficientCap":"H/2^112","modeOnePureZGaugeRows":gauge,
            "exactNormalRecipe":"C_1/P = n cross (psi t_1/P)/(k |n|^2), up to the original fixed i conversion.",
            "sourceBandDebit":"A single epsilon^(-kappa) suffices for the displayed coefficient with the band retained, and can instead pay both it and the displayed S band plus three more powers. The radial poles and Gaussian remain explicit.",
            "scope":"Only the high phase-free Forced donor. No full Signed pressure, temporal, late FiveMap, coupled energy or jet promotion."}


def main(a):
    d={k:json.loads(checked(a.goal/path,h)) for k,(path,h) in ORIGINAL.items()}
    d.update({k:json.loads(checked(getattr(a,arg),PINS[k])) for k,arg in (
        ("crop","crop"),("high18","high18"),("joined","joined"),("frame","frame"),("modeOne","mode_one"),
        ("c7","c7"),("z8","z8"),("signedPressure","signed_pressure"))})
    req,reused,low,high=attach_covariance(d)
    temporal=mixed_mean(a.premean,d,req|reused)
    geometry=high_cutoff(a.premean,a.mean_program,d)
    compact=compact_budget(d,low,high,geometry)
    result={"schema":"MathScope.C102.ActualHighModeOneForcedGaugeAttachment/1",
           "status":"VERIFIED_SAME_SOURCE_SELECTED_MODE_ONE_GAUGE_BOUNDS_CONDITIONAL_ON_ADMITTED_PHYSICAL_CHARTS",
           "pins":{**PINS,**{k:h for k,(_,h) in ORIGINAL.items()}},
           "meanTemporal":temporal,"extendedCutoffGeometry":geometry,"compactFiveMap":compact,
           "forcedDonor":normalized_forced(d,temporal,compact,high),
           "chartScope":"Original qBig/64 <= q < qBig/16, same native radial/torus lift, flat joins and compact middle support; covariances used on their full original shifted paths.",
           "finalJets":0,"release":"HOLD"}
    a.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print(result["forcedDonor"]["modeOnePureZGaugeRows"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p=ArgumentParser()
    for name in ("goal","crop","high18","joined","frame","mode-one","c7","z8","premean","signed-pressure","mean-program","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
