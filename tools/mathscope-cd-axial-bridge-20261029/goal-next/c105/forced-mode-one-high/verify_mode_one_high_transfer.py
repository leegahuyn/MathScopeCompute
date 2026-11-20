"""Bound the original high projected mode-one transfer with an explicit donor premise."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import comb
from pathlib import Path
import runpy
from types import SimpleNamespace


STAGE = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS = {
    "dependencies":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "directions":"f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "frameProgram":"72bc9342d6f3ec22f1923d9c05b4aa0a887d29e37d86b48d6b93c59d7e6b4ee9",
    "chart14":"b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
    "variation":"bc793ae3d6e42755d227fee199322130255f9e21273888d019579db22aa89f2e",
}


def pin(name,path):
    body=path.read_bytes()
    assert sha256(body).hexdigest()==PINS[name],(name,path)
    return body


def main(a):
    dependencies=json.loads(pin("dependencies",a.dependencies))
    requests=json.loads(pin("directions",a.directions))["requests"]
    assert dependencies["pins"]["gaugeDemand"]==PINS["directions"] and len(requests)==50
    frame_path=a.goal/"c104/frame13/verify_selected_frame_c13.py"
    chart_path=a.goal/"c104/background14/chart14.json"
    pin("frameProgram",frame_path)
    pin("chart14",chart_path)
    frame=runpy.run_path(str(frame_path))
    matrix,*_=frame["coefficient_recurrence"](SimpleNamespace(goal=a.goal,chart14=chart_path))
    ledger=matrix["exactDerivativeLedgers"]
    variation=a.goal/STAGE.parent/"forced-normalized-variation/verify_weighted_forced_variation.py"
    pin("variation",variation)
    ordered=runpy.run_path(str(variation))

    def jets(name,multiplier=1):
        return [(multiplier*Q(c),u,s) for c,u,s in ledger[name]]

    coefficients=(jets("normalizedMode1And2MatrixInfinityNorm"),jets("BLeft",3),
                  jets("projector",3),jets("movingBasisInfinityNorm"))
    folded={tuple(row["RZL"]):row for row in dependencies["approximateWeightSlopeOnly"]["physicalOverP"]}
    kappa=Q(1,100000)
    rows=[]
    for r,z,l in requests:
        order=(r,z,l)
        slow=r+z
        state,physical=ordered["exact_coefficients"](order,*coefficients)
        assert [x["orderedMatrixInsertions"] for x in physical]==list(range(slow+1))
        charge=[]
        for row in physical:
            power=row["maxSourceConstantPower"]
            charge.append(Q(row["coefficient"]).__ceil__().bit_length()
                          +7*power+row["propagatorPower"])
        ordered_rank=max(charge)+len(charge).bit_length()+5  # Original normalized S mass.
        cross_rank=0
        for i,j in product(range(slow+1),repeat=2):
            if i+j>slow:
                continue
            x,y=ledger["n"][i],ledger["inverseNormalSquared"][j]
            assert x[2]+y[2]<=i+j
            cross_rank=max(cross_rank,Q(x[0]).__ceil__().bit_length()
                           +Q(y[0]).__ceil__().bit_length()+7*(x[1]+y[1])
                           +comb(i+j,i).bit_length())
        cross_rank+=2*slow+8  # Outer Leibniz multiplicities and signed cartesian entries.
        band=Q(folded[order]["velocityOverPBandPower"])
        pole=Q(folded[order]["additionalLogPoleAfterGToMode"])
        assert band<=Q(71,4)+3*slow and pole<=9+3*slow
        # The complete input forcing log is a premise. No raw donor is
        # inferred merely from its filled-in directional majorant slope.
        log_cost=Q(1,2**100)+Q(ordered_rank+cross_rank,2**128)
        assert log_cost<Q(1,2**99)
        assert log_cost+band/2**32636<kappa
        rows.append({"RZL":order,"state":state,"physicalOverP":physical,
                     "orderedWindowCount":len(ordered["words"](order)),
                     "orderedAndCrossLogRanks":[ordered_rank,cross_rank],
                     "outerPotentialBand":str(band),
                     "outerPotentialPoleAfterZeta":str(pole+Q(3,2)),
                     "outerPotentialEpsilonAfterDebit":str(Q(3,2)-2*kappa)})
    assert max(Q(row["outerPotentialPoleAfterZeta"]) for row in rows)==Q(75,2)
    result={"schema":"MathScope.C105.ModeOneHighProjectedVariation/1",
            "status":"VERIFIED_ORIGINAL_OPERATOR_RECURRENCE_CONDITIONAL_RAW_DONORS",
            "pins":PINS,"rows":rows,
            "premises":["All actual complete raw mode-one source derivatives in the enumerated directions have log coefficient <=H/2^100 and grade >=epsilon^(1-kappa) in the original projected normalization.",
                        "The raw derivatives retain the recorded outer source poles, Gaussian, fixed endpoint and same-label stable pulse assumptions.",
                        "The original fixed carrier gives k^-1<=sqrt(epsilon), and log(Bnorm), log(Wprop), log(M) <=H/2^128."],
            "open":["Actual original high raw mean/eikonal and direct forcing estimates, and inner/outer guard attachments.",
                    "Complete paired covariance and the full Signed and late stage-one energy."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS 50 original projected mode-one ordered sequences and cross-product coefficient bounds",
          max(sum(row["orderedAndCrossLogRanks"]) for row in rows))


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","dependencies","directions","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
