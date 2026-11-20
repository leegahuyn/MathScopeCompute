"""Use the exact source quotient recurrence for the original direct high forcing roles."""

from argparse import ArgumentParser
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy
from types import SimpleNamespace


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS={
    "quotientProgram":"f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74",
    "quotientExisting":"a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244",
    "frameProgram":"72bc9342d6f3ec22f1923d9c05b4aa0a887d29e37d86b48d6b93c59d7e6b4ee9",
    "chart14":"b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
    "dependencies":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "joinedC14":"8e1974d3a62ffddb7cd9690a6b46588da9d5a9fd736b9db2365951555a490e7d",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return raw


def main(a):
    folder=a.goal/BAND/"initial-mean-norm/primary"
    original=folder/"verify_primary_quotient.py"
    pin("quotientProgram",original)
    low=json.loads(pin("quotientExisting",folder/"primary-quotient-ledger.json"))["weightedQuotientLedger"]
    demand=json.loads(pin("dependencies",a.goal/"c105/forced-mode-one-high/mode-one-high-dependencies.json"))["primaryDirectDemands"]
    chart_path=a.goal/"c104/background14/chart14.json"
    frame_program=a.goal/"c104/frame13/verify_selected_frame_c13.py"
    pin("chart14",chart_path)
    pin("frameProgram",frame_program)
    joined=json.loads(pin("joinedC14",a.goal/"c104/frame13/joined-c13.json"))
    assert joined["backgroundOrder"]==14 and joined["regularTargetOrder"]==13
    frame=runpy.run_path(str(frame_program))
    matrix,_,_,cuts,_,ranks=frame["coefficient_recurrence"](SimpleNamespace(goal=a.goal,chart14=chart_path))
    assert cuts["maximumOrdinaryOrder"]==17
    matrix["exactDerivativeLedgers"]={k:v[:13] for k,v in matrix["exactDerivativeLedgers"].items()}
    program=runpy.run_path(str(original))
    caps=program["caps"]
    source=inspect.getsource(caps)
    edits=[("len(values)==9","len(values)==13",1),("range(9)","range(13)",6),
           ("g=[Q(0)]*9","g=[Q(0)]*13",1),
           ("top=8","top=12",1),("==10","==14",1),("if j<=7:","if j<=11:",1),
           ("=='velocityRealOverP')==8","=='velocityRealOverP')==12",1)]
    for old,new,count in edits:
        assert source.count(old)==count,(old,source.count(old))
        source=source.replace(old,new)
    ns={}
    exec(compile(source,str(original),"exec"),caps.__globals__,ns)
    scale={"scaleRows":[{"sqrtW":f"{8*j+1}/4","tangentOverP":str(2*j),
                         "normalizedPulseDerivatives":str(2*j)} for j in range(13)]}
    weight=ns["caps"]({"matrix":{"sharpBandDegreeAudit":matrix},"scale":scale,
                       "band":{"scaleTransfer":[{"boundFieldOrderAvailable":14}]}})
    keys={(x["role"],x["components"],x["slowOrder"]) for x in low["bounds"]}
    recovered=[x for x in weight["bounds"] if (x["role"],x["components"],x["slowOrder"]) in keys]
    assert recovered==low["bounds"]
    assert weight["flatRadialGaussianDerivativeChecks"][:9]==low["flatRadialGaussianDerivativeChecks"]
    assert max(j for _,j,l,v in demand)==11 and max(l for _,j,l,v in demand)==3 and max(v for _,j,l,v in demand)==1
    assert all(j+(role=="u" and bool(v))<=12 for role,j,l,v in demand)
    weight["matrixAndWeightClosure"]="Actual C104 same-label C13 regular target, C14 background, C13 matrix and C17 cutoff. Their norm transfer stays conditional on the original admissible charts and positivity."
    result={"schema":"MathScope.C106.OriginalPrimaryNormalizedQuotientC11/1",
            "status":"VERIFIED_SAME_SOURCE_WEIGHT_RECURRENCE_CONDITIONAL_ADMITTED_GEOMETRY",
            "pins":PINS,"sourceRawRoleCount":len(demand),"weightedQuotientLedger":weight,
            "commonOrdinaryCoefficientLogRanks":ranks,
            "open":["Native high b/epsilon, phase, and complementary guard geometry as separate source operands."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original normalized Primary quotient through velocity order eleven; 110 direct raw forcing roles")


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
