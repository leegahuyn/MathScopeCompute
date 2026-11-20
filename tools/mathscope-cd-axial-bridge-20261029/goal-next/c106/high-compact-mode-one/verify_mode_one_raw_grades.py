"""Carry the exact stage-one cancellation grade through the C106 mean directions."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


STAGE=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS={
    "compact":"00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884",
    "dependencies":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "transfer":"4beea5ad61c1af3ea310b0edcb3183689b9d5f29cfd40f426eaaf65d27f658a0",
    "cancel":"02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return json.loads(raw)


def main(a):
    compact=pin("compact",a.compact)
    root=a.goal/"c105/forced-mode-one-high"
    dependencies=pin("dependencies",root/"mode-one-high-dependencies.json")
    transfer=pin("transfer",root/"mode-one-high-transfer.json")
    cancel=pin("cancel",a.goal/STAGE/"principal-mode-cancellation/mode-one/mode1-linear-cancellation.json")
    names=("beta","v","gamma")
    kappa=Q(1,100000)
    native={(name,(r,z,l)):Q(row["minEpsilon"])
            for name,(r,z,t,l),row in compact["ordinaryRows"] if not t}
    assert len(native)==273
    grouped=defaultdict(list)
    for role,c,a0 in dependencies["meanDemands"]:
        a0=tuple(a0)
        name=names[c]
        rank=native[name,a0]
        # Compact L derivatives vanish. The native compact beta has two
        # explicit epsilon powers and the other two components have one.
        if not a0[2]:
            rank=min(rank,2 if name=="beta" else 1)
        grouped[role].append(rank)
    assert set(grouped)=={"mean","increment"}
    mean=min(grouped["mean"])
    increment=min(grouped["increment"])
    old=cancel["postCancellationConditionalGrades"]
    assert old["commonPostCancellationConditionalEpsilonDegree"]==str(1-kappa)
    u=Q(old["directFieldEpsilonGradesWithCarrierBound"]["realU"])
    ui=Q(old["directFieldEpsilonGradesWithCarrierBound"]["imaginaryU"])
    pressure=Q(old["directFieldEpsilonGradesWithCarrierBound"]["pressure"])
    grades={"imaginaryHomogeneousAmplitude":ui,
            "regularPressureGradient":pressure-kappa,
            "groupedCarrierEikonal":increment+u-Q(1,2),
            "singleCarrierViscousPhaseAndConnection":1-Q(1,2)+u-kappa,
            "originalMeanGradientAndDivergence":mean+u-kappa,
            "ordinaryTimeAndViscosity":1+u-2*kappa}
    contingent_grade=min(grades.values())
    assert contingent_grade>=1-6*kappa
    # Independently record a sufficient coefficient allocation. For the
    # actual high forcing the original geometric factors remain explicit.
    raw_cost=Q(2,2**111)+Q(1,2**112)+Q(2**16,2**128)
    assert raw_cost< Q(1,2**100)
    for row in transfer["rows"]:
        rank=sum(row["orderedAndCrossLogRanks"])
        band=Q(row["outerPotentialBand"])
        assert Q(1,2**100)+Q(rank,2**128)+band/2**32636<kappa
    raw_grade=1-6*kappa
    gauge_grade=raw_grade+Q(1,2)-kappa
    result={"schema":"MathScope.C106.ModeOneEpsilonGradeFromActualMeanInventory/1",
            "status":"VERIFIED_RATIONAL_GRADE_TRANSFER_CONDITIONAL_ON_SOURCE_FIELD_WEIGHTS",
            "pins":PINS,"ordinaryMeanGrade":str(mean),"eikonalIncrementGrade":str(increment),
            "groupGrades":{name:str(value) for name,value in grades.items()},
            "safeRawGrade":str(raw_grade),"conditionalPhaseFreeGaugeGrade":str(gauge_grade),
            "requiredInputs":["Actual high Primary normalized velocity and pressure bounds in the raw differentiated source roles.",
                              "Original same-chart b/epsilon, RF/G, phase and geometric factor bounds with uniform simultaneous coefficient log allocation and original Gaussian handoff.",
                              "Original C94 regrouping in the full source, and unchanged endpoint support and live torus chart."],
            "open":["Prove the remaining original high normalized raw field bounds and attach both radial collars in the actual Signed source."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS inherited cancellation grade with newly attached mean grades",mean,increment,contingent_grade,gauge_grade)


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","compact","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
