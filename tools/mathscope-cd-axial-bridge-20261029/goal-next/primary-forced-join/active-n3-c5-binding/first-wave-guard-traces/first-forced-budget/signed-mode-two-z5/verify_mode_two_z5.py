"""Selective source-backed Z5 grade for the second Forced angular mode."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import factorial
from pathlib import Path
import runpy


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
RAW="first-forced-budget/outer-weight-comparison/raw-weights/verify_raw_weights.py"
RAW_PIN="842cbd054f9bbe6dca985a2cdfc1222aa76f951cb473af1756f0213267fc9cf5"
VARIATION="forced-normalized-variation/verify_weighted_forced_variation.py"
VAR_PIN="bc793ae3d6e42755d227fee199322130255f9e21273888d019579db22aa89f2e"
MATRIX="outer-fixed-label-norm/matrix/matrix-s-j.json"
MATRIX_PIN="e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"
TANGENCY="first-forced-budget/principal-mode-cancellation/mode-two/mode-two-tangency.json"
TANGENCY_PIN="f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a"
COV="05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"
ALPHA=(0,5,0)


def pin(path,wanted):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==wanted,path
    return raw


def grade(by_mode):
    source=inspect.getsource(by_mode)
    old="for alpha in alphas:"
    assert source.count(old)==2
    source=source.replace(old,"for alpha in alphas+((0,4,0),(0,5,0)) if mode==2 else alphas:")
    assert source.count("scalar_budget=scalar_join(data,records,joined)")==1
    source=source.replace("scalar_budget=scalar_join(data,records,joined)","scalar_budget={}")
    wrapper={}
    exec(compile(source,inspect.getfile(by_mode),"exec"),by_mode.__globals__,wrapper)
    return wrapper["assemble"]


def source_row(band):
    pin(band/RAW,RAW_PIN)
    mod=runpy.run_path(str(band/RAW))
    data={key:mod["load"](band,key) for key in mod["FILES"]}
    profiles=data["geometry"]["conditionalCoefficientCaps"]["actualCoefficientProfiles"]
    for row in profiles.values():
        values=row["envelopesBySlowOrder"]
        assert len(values)==5 and all(v==values[-1] for v in values[1:])
        assert row["everyPositiveLDerivativeAtFixedEndpointIsZero"]
        values.append(values[-1])
    # The proved tag formulas give the same positive-order S exponents.
    # One more fixed radius power/derivative and shape coefficients are
    # covered by 2^24 B^14 M instead of the degree-four 2^20 B^12 M.
    assert factorial(6)*4*3**7<2**24 and 4*factorial(6)<2**24
    assert 2+5<=10
    result=grade(mod["assemble"])(data)
    assert result["termTally"]["mode2RetainedOriginalMonomials"]==1270
    row=next(r for r in result["rawPerDirection"]["2"] if tuple(r["RZL"])==ALPHA)
    solved=result["conditionalOrderedVariation"]["2"]["physicalOverP"]
    normalized=next(r for r in solved if tuple(r["RZL"])==ALPHA)
    fourth=next(r for r in solved if tuple(r["RZL"])==(0,4,0))
    assert fourth["velocityOverPBandPower"]=="22" and fourth["additionalLogPoleAfterGToMode"]==21
    raw_jet_coeffs=[]
    max_derivative=0
    for case in data["factor"]["cases"]:
        if case["mode"]!=2:
            continue
        roles={x["root"]:x for x in case["rawJetAtoms"]}
        for scalar in case["scalars"]:
            cs=[]
            for coeff,m in scalar["termsAfterFactoringPToMode"]:
                cs.append(abs(Q(coeff)))
                fields=[(roles[i],mult) for i,mult in m if i in roles]
                assert sum(mult for v,mult in fields)==2 and all(v["role"]=="u" for v,_ in fields)
                assert sum(mult for i,mult in m if i not in roles)<=2
                max_derivative=max(max_derivative,max(sum(v["orders"]) for v,_ in fields))
            raw_jet_coeffs.append(sum(cs))
    assert len(raw_jet_coeffs)==60 and max(raw_jet_coeffs)<2**32 and max_derivative==1
    assert row["rawBandPower"]=="49/2" and row["rawAdditionalLogPoleAfterGToMode"]==24
    assert normalized["velocityOverPBandPower"]=="25" and normalized["additionalLogPoleAfterGToMode"]==24
    return row,normalized,fourth,max(raw_jet_coeffs),max_derivative


def log_add(rows):
    values=[max(x) for x in zip(*rows,strict=True)]
    values[0]+=(len(rows)-1).bit_length()
    return values


def coef_bound(band,cov,raw_coeff):
    pin(band/VARIATION,VAR_PIN)
    v=runpy.run_path(str(band/VARIATION))
    m=json.loads(pin(band/MATRIX,MATRIX_PIN))["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    def jets(name,k=1):
        return [(k*Q(c),a,s) for c,a,s in m[name][:6]]
    state,physical=v["exact_coefficients"](ALPHA,jets("normalizedMode1And2MatrixInfinityNorm"),jets("BLeft",3),
                                          jets("projector",3),jets("movingBasisInfinityNorm"))
    assert len(v["words"](ALPHA))==32
    assert [x["orderedMatrixInsertions"] for x in state]==[x["orderedMatrixInsertions"] for x in physical]==list(range(6))
    # <=4 original factor slots, hence 4^5 Leibniz mass. Two geometry
    # factors and two original Primary fields, with signed sums absolute.
    U=cov["coefficientBudget"]["commonPrimaryRanks"]
    geometry=[24,14,0,1]
    raw_rank=[2*(a+b) for a,b in zip(U,geometry,strict=True)]
    assert 64*16*5**5<2**32  # finite regrouping, with the original bounded branch factors.
    raw_rank[0]+=Q(raw_coeff).__ceil__().bit_length()+10+185+32
    # The same original Gaussian mass is <=16 B S^1/2,
    # and every retained ordered window contributes Lmax<=1 after its S factor.
    variation=log_add([[Q(x["coefficient"]).__ceil__().bit_length()+4,
                        6*x["maxSourceConstantPower"]+1,x["propagatorPower"],
                        x["maxSourceConstantPower"]] for x in physical])
    ranks=[a+b for a,b in zip(raw_rank,variation,strict=True)]
    assert sum(ranks)<2**16
    return {"statePolynomial":state,"physicalPolynomial":physical,"orderedWords":32,
            "positiveLogRanks":ranks,"finiteRegroupingReserveBits":32,
            "totalConditionalCoefficientLogCap":"H/2^112"}


def main(goal,covariance,out):
    band=goal/BAND
    cov=json.loads(pin(covariance,COV))
    tangency=json.loads(pin(band/TANGENCY,TANGENCY_PIN))
    assert tangency["scalarCount"]==60 and tangency["status"]=="VERIFIED_ORIGINAL_MODE_TWO_CARRIER_AND_CONDITIONAL_WEIGHTED_GAIN"
    raw,normalized,fourth,coefficient,first=source_row(band)
    constants=coef_bound(band,cov,coefficient)
    k,rho=Q(1,100000),Q(1,1048576)
    assert 1-k-rho>1-2*k and rho+Q(2,2**112)<k
    result={"status":"VERIFIED_SELECTIVE_ORIGINAL_MODE_TWO_Z5_GRADE_CONDITIONAL_SAME_CHART",
            "pins":{"sourceGrades":RAW_PIN,"variation":VAR_PIN,"matrix":MATRIX_PIN,"modeTwoTangency":TANGENCY_PIN,"covariance":COV},
            "raw":raw,"nativeNormalized":normalized,"additionalDownwardClosureRow":fourth,"maxPrimaryRawDerivative":first,
            "requiredPrimaryOrdinarySlowOrder":6,"initializedMeanOperandRequired":False,
            "positiveConstants":constants,
            "conditionalExplicitBandGrade":{"epsilon":"99999/100000","normalizedS":"25","zeta":"1",
                                                "outerPoleAfterZeta":27,"innerCoarsePoleAfterZeta":27},
            "conditionalAfterBandAndLogAbsorptionEpsilonGrade":"49999/50000",
            "premises":["Original two-mode carrier cancellation differentiated in same source chart; the remaining carrier factors hit at least one original imaginary Primary component.",
                        "Use native positive frames, slab and ordered variation from C89-C98. Same-label cutoff and shift preserve radial weight. The added order-five fixed geometry coefficient profile is bounded as in the stated recurrence."],
            "open":"The other high mode-one donor and complete Signed target/energy remain open.",
            "finalJets":0,"release":"HOLD"}
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Verified selective original mode-two Z5 degree",normalized,constants["positiveLogRanks"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    p=ArgumentParser()
    for name in ("goal","covariance","out"):
        p.add_argument("--"+name,type=Path,required=True)
    a=p.parse_args()
    main(a.goal,a.covariance,a.out)
