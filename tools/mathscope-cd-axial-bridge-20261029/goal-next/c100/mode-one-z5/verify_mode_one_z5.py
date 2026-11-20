"""Selective original mode-one axial Z4/Z5 source, variation and donor audit."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import factorial
from pathlib import Path
import runpy


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
BUDGET=BAND/"first-forced-budget"
REFS={
    "raw":(BUDGET/"outer-weight-comparison/raw-weights/verify_raw_weights.py","842cbd054f9bbe6dca985a2cdfc1222aa76f951cb473af1756f0213267fc9cf5"),
    "variation":(BAND/"forced-normalized-variation/verify_weighted_forced_variation.py","bc793ae3d6e42755d227fee199322130255f9e21273888d019579db22aa89f2e"),
    "matrix":(BAND/"outer-fixed-label-norm/matrix/matrix-s-j.json","e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "c94":(BUDGET/"principal-mode-cancellation/mode-one/mode1-linear-cancellation.json","02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
}
OVERRIDES={
    "covariance":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "precedingWholeMean":"1eb1c9d1dbf1fcff611140309a663fc74d106ee05e27f3ac7d0d9e13e36893d5",
    "precedingNativeMean":"3212a321563d65e5d7972cb7ab0c97f03f1ee0917276542a7a45074912fe34ff",
    "signedPressure":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
}
NEW=((0,4,0),(0,5,0))
NAMES=("beta","v","gamma")
K=Q(1,100000)


def pin(p,wanted):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==wanted,p
    return raw


def specialize(fn,changes):
    code=inspect.getsource(fn)
    for before,after,n in changes:
        assert code.count(before)==n,(before,code.count(before),n)
        code=code.replace(before,after)
    specialized={}
    exec(compile(code,inspect.getfile(fn),"exec"),fn.__globals__,specialized)
    return specialized[fn.__name__]


def proof_source_rows(goal,old_mean):
    band=goal/BAND
    mod=runpy.run_path(str(goal/REFS["raw"][0]))
    data={k:mod["load"](band,k) for k in mod["FILES"]}
    for profile in data["geometry"]["conditionalCoefficientCaps"]["actualCoefficientProfiles"].values():
        v=profile["envelopesBySlowOrder"]
        assert len(v)==5 and all(row==v[-1] for row in v[1:])
        assert profile["everyPositiveLDerivativeAtFixedEndpointIsZero"]
        v.append(v[-1])
    # Fixed geometry exponent slope is unchanged by a fifth positive slow
    # derivative. The old F/G C10 handles the phi and radial coefficients.
    assert 2+5<10 and factorial(6)*4*3**7<2**24
    fn=specialize(mod["assemble"],[
        ("    mean,absorption=field_inventory(data)",
         "    mean,absorption=field_inventory(data)\n    missing=set()",1),
        ("            values=mean[c][index]",
         "            if index not in mean[c]:\n"
         "                missing.add((kind,c,index))\n"
         "                return Q(21,2)+3*(index[0]+index[1]),0\n"
         "            values=mean[c][index]",1),
        ("for alpha in alphas:","for alpha in alphas+((0,4,0),(0,5,0)) if mode==1 else alphas:",2),
        ("scalar_budget=scalar_join(data,records,joined)","scalar_budget={}",1),
        ("'rawPerDirection':records,","'additionalMeanRequests':sorted(missing),'rawPerDirection':records,",1),
    ])
    result=fn(data)
    assert result["termTally"]["mode1RetainedOriginalMonomials"]==2620
    assert result["termTally"]["meanY1MonomialsRepresentedByPairedL"]==100
    assert result["termTally"]["regroupedHighFrequencyTerms"]==360
    prior={tuple(row) for row in old_mean["demands"]}
    novel=[{"kind":kind,"component":NAMES[c],"RZL":list(index),"degree":sum(index)}
           for kind,c,index in result["additionalMeanRequests"] if index not in prior]
    high={
        (kind,NAMES[c],tuple(index))
        for kind,c,index in result["additionalMeanRequests"] if sum(index)>=6
    }
    assert {order for _,_,order in high}=={(0,5,1),(0,6,0),(1,5,0)}
    assert {kind for kind,_,_ in high}=={"mean"}
    assert max(row["degree"] for row in novel if row["kind"]=="increment")==5
    assert len(novel)==18 and len(high)==9
    # Original monomial constants are retained before C94's regrouping.
    batches=[]
    meancount=Counter()
    maximum_geometry=0
    for case in data["factor"]["cases"]:
        if case["mode"]!=1:
            continue
        roles={x["root"]:x for x in case["rawJetAtoms"]}
        for scalar in case["scalars"]:
            numerator=Q(0)
            for coeff,m in scalar["termsAfterFactoringPToMode"]:
                numerator+=abs(Q(coeff))
                mean_multiplicity=sum(n for i,n in m if i in roles and roles[i]["role"]=="mean")
                primary_multiplicity=sum(n for i,n in m if i in roles and roles[i]["role"]!="mean")
                assert mean_multiplicity<=1 and primary_multiplicity==1
                maximum_geometry=max(maximum_geometry,sum(n for i,n in m if i not in roles))
                meancount[mean_multiplicity]+=1
            batches.append(numerator)
    assert len(batches)==60 and max(batches)<2**32 and maximum_geometry<=8
    first_result=result["conditionalOrderedVariation"]["1"]
    folded=[r for r in first_result["physicalOverP"] if tuple(r["RZL"]) in NEW]
    assert [r["velocityOverPBandPower"] for r in folded]==["119/4","131/4"]
    assert [r["additionalLogPoleAfterGToMode"] for r in folded]==[21,24]
    ratio=Q(data["radial"]["poleAlgebra"]["oppositeGaussianRatioAtMost"])
    assert ratio==1/(1-Q(1,128)**2/(2*Q(7,4)**2))==Q(100352,100351)
    return {
        "nativeSourceMonomialTally":result["termTally"],
        "originalMeanMultiplicity":dict(sorted(meancount.items())),
        "maximumOriginalGeometryMultiplicity":maximum_geometry,
        "maxOriginalAbsoluteRationalCoefficientSum":str(max(batches)),
        "conservativeAdditionalActualComponentRequests":novel,
        "degreeSixRequests":sorted([{"group":k,"component":n,"RZL":i} for k,n,i in high],key=lambda x:(x["component"],x["RZL"])),
        "additionalRawNativeRows":[x for x in result["rawPerDirection"]["1"] if tuple(x["RZL"]) in NEW],
        "assumedNewMeanBand":"S^(21/2+3*(R+Z))",
        "assumedUniformLogCapForEachNewMeanCoefficient":"H/2^112",
        "sameChartOuterGaussianConversionConstant":str(ratio),
    }


def c94_group_profile(c94,primary):
    old=c94["postCancellationUniformWeights"]
    rows=primary["weightedQuotientLedger"]["bounds"]
    U=[]
    P=[]
    for j in range(8):
        u=[r for r in rows if r["slowOrder"]==j and r["role"].startswith("velocity")]
        [p]=[r for r in rows if r["slowOrder"]==j and r["role"]=="pressureOverP"]
        U.append((max(Q(r["constantSPower"]) for r in u),max(r["totalLogPoleAfterG"] for r in u)))
        P.append((Q(p["constantSPower"]),p["totalLogPoleAfterG"]))
    assert U==[(Q(13,4)+3*j,3+3*j) for j in range(8)]
    # Same original regrouped C94 mode-one operators and all old direction rows.
    result=[]
    for j in range(6):
        groups={
            "imaginaryHomogeneousAmplitude":U[j],
            "ordinaryTimeAndViscosity":U[j+2],
            "regularPressureGradient":P[j+1],
            "originalMeanGradientAndDivergence":(Q(21,2)+U[0][0]+3*(j+1),U[j+1][1]),
            "singleCarrierViscosityAndConnection":U[j+1],
            "groupedEikonal":(Q(21,2)+U[j][0],U[j][1]),
        }
        band=max(x[0] for x in groups.values())
        pole=max(x[1] for x in groups.values())
        assert band==Q(67,4)+3*j and pole==9+3*j
        for r in old["rows"]:
            if r["slowRZ"]==j:
                assert Q(r["rawBandPower"])==band and r["rawPoleAfterG"]==pole
        result.append({"Z":j,"groups":{k:[str(s),p] for k,(s,p) in groups.items()},
                       "rawBand":str(band),"poleAfterG":pole,
                       "normalizedBandAfterTimeMass":str(band+1)})
    return result


def coefficient_variation(goal,matrix,source,groups,cov):
    v=runpy.run_path(str(goal/REFS["variation"][0]))
    ledger=matrix["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    def jets(name,factor=1):
        return [(factor*Q(c),a,s) for c,a,s in ledger[name][:6]]
    inputs=(jets("normalizedMode1And2MatrixInfinityNorm"),jets("BLeft",3),
            jets("projector",3),jets("movingBasisInfinityNorm"))
    rows=[]
    for alpha in NEW:
        j=alpha[1]
        state,physical=v["exact_coefficients"](alpha,*inputs)
        assert [r["orderedMatrixInsertions"] for r in physical]==list(range(j+1))
        assert len(v["words"](alpha))==2**j
        parts=[]
        for k in range(j+1):
            source_degree=Q(groups[k]["rawBand"])
            # Remaining ordered factors consume at most S^(2(j-k)).
            parts.append(source_degree+2*(j-k)+1)
        assert max(parts)==Q(groups[j]["normalizedBandAfterTimeMass"])
        max_ordered=sum(max(per) for per in zip(*[[Q(x["coefficient"]).__ceil__().bit_length(),
                       6*x["maxSourceConstantPower"],x["propagatorPower"],x["maxSourceConstantPower"]] for x in physical],strict=True))
        max_ordered+=len(physical).bit_length()
        C_U=sum(cov["coefficientBudget"]["commonPrimaryRanks"])
        C_raw=Q(source["maxOriginalAbsoluteRationalCoefficientSum"]).__ceil__().bit_length()
        # Relative H/2^128 charges. Reuse the checked raw geometry count and
        # allow one extra baseline/omega multiplier from C93 regrouping. One common
        # Primary and one complete mean supply the raw fields. The middle
        # guard incurs e^128<2^185. Include the mode-one S mass with the
        # conservative factor 16 B and the remaining Lmax<=1.
        geometry_factors=source["maximumOriginalGeometryMultiplicity"]+1
        geom_charge=geometry_factors*(24+14+1)
        assert 64*16*(geometry_factors+2)**5<2**32
        raw_finite=2**10+C_raw+185+32+5
        mean_charge=2**16
        whole=geom_charge+raw_finite+mean_charge+C_U+max_ordered
        assert whole<2**17
        zeta_pole=Q(groups[j]["poleAfterG"])+Q(3,2)
        assert zeta_pole<=27
        rows.append({"RZL":alpha,"statePolynomial":state,"physicalOverPPolynomial":physical,
                     "orderedWords":2**j,"possibleBandPowersByUnspentSourceDerivative":[str(x) for x in parts],
                     "finalBandPower":str(max(parts)),"additionalPoleAfterG":groups[j]["poleAfterG"],
                     "physicalZetaExponent":"1/2","outerPoleAfterZeta":str(zeta_pole),
                     "conservativeInnerPoleCapAfterZeta":27,
                     "logChargeInHOver2Pow128":whole,"totalConditionalCoefficientLogCap":"H/2^111"})
    assert [r["finalBandPower"] for r in rows]==["119/4","131/4"]
    return rows


def epsilon_transfer():
    strong=1-6*K
    grade6=Q(1,2)-5*K
    assert grade6+Q(1,2)-K==strong
    assert 2*Q(1,2**111)+Q(1,1048576)<K
    # A weaker derivative-only donor retains the exact explicit pressure
    # routing, so no extra epsilon is claimed for the low-K1 source terms.
    high_potential=Q(1,2)
    high_radial_curl=high_potential+1
    signed_nested_pressure=high_radial_curl+Q(1,2)+2
    assert signed_nested_pressure==4
    return {
        "originalLowGradeFromC98":str(strong),
        "sufficientNewEikonalDegreeFiveMeanEpsilonGrade":str(strong),
        "sufficientNewGradientDegreeSixMeanEpsilonGrade":str(grade6),
        "sufficientNewGradientDegreeFiveAndSixMeanEpsilonGrade":str(grade6),
        "strongModeOneZ4Z5NormalizedGrade":str(strong),
        "optionalStrongGradeAfterBandAndCoefficientDebt":str(strong-K),
        "additionalMiddleProtection":"The exceptional high Signed pressure contribution can use the explicit subsequent gains. If new mean jets merely have epsilon^0, the high normalized forcing has a conservative epsilon^0 grade, high Ctheta,Z5 retains epsilon^1/2 from k^-1, high imaginary U_r adds epsilon, its lower Primary partner has epsilon^1/2, and nested Signed pressure has epsilon^2.",
        "optionalExceptionalPressureChainEpsilonGradeBeforeFurtherLoss":str(signed_nested_pressure),
        "inputNecessity":"Even the weaker route requires actual new derivative coefficient bounds; no mean jet is filled syntactically by its lower neighbors.",
    }


def main(goal,cov,old_mean,native_mean,pressure,out):
    for path,h in REFS.values():
        pin(goal/path,h)
    v=[json.loads(pin(p,OVERRIDES[k])) for k,p in zip(OVERRIDES,(cov,old_mean,native_mean,pressure),strict=True)]
    c7,temporal,mean,signed=v
    source=proof_source_rows(goal,temporal)
    c94=json.loads((goal/REFS["c94"][0]).read_bytes())
    matrix=json.loads((goal/REFS["matrix"][0]).read_bytes())
    prime=runpy.run_path(str(goal/REFS["raw"][0]))
    primary=prime["load"](goal/BAND,"primary")
    groups=c94_group_profile(c94,primary)
    variation=coefficient_variation(goal,matrix,source,groups,c7)
    eps=epsilon_transfer()
    assert mean["extendedMean"]["fiveMapDefectZOrders"]=={"P":4,"Jtheta":5,"Jz":4}
    assert "numericalFrontier" in signed
    result={
       "status":"VERIFIED_MODE_ONE_AXIAL_Z4_Z5_SOURCE_AND_CONDITIONAL_PROJECTED_VARIATION",
       "pins":{**{k:v[1] for k,v in REFS.items()},**OVERRIDES},"originalSource":source,
       "regroupedSourceGrades":groups,"regularProjectedOrderedVariation":variation,"epsilonGrades":eps,
       "separateOutstandingInput":"Prove same-body higher initialized mean for the listed additional ordinary jet directions. The first transfer still needs real C10 background, original same-chart projection, shifted path and frozen positive frame. The direct compact FiveMap derivative may increase the required moment order.",
       "scope":"The verified positive coefficient and source-degree comparison never substitutes assumed high mean values into an original node. No complete actual Signed source or stage energy is promoted.",
       "finalJets":0,"release":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Verified two selective axial projected rows and original mean demand.",len(source["conservativeAdditionalActualComponentRequests"]))


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    p=ArgumentParser()
    for name in ("goal","covariance","old-mean","native-mean","signed-pressure","out"):
        p.add_argument("--"+name,type=Path,required=True)
    a=p.parse_args()
    main(a.goal,a.covariance,a.old_mean,a.native_mean,a.signed_pressure,a.out)
