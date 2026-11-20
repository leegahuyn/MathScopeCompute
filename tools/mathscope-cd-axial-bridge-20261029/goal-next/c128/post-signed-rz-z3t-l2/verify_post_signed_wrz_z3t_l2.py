"""Attach the native L² companion of the original post-Signed W_rz Z³T row."""
import argparse
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy
from types import FunctionType

ORDINARY="continuation128/post-signed-rz-z3t/"
SIGMA="continuation128/sigma-high-time/sigma-high-time.json"
PRE="continuation129/late-pressure-wave-inputs/full-covariance-first.json"
PINS={
    "ordinaryCode":(ORDINARY+"verify_post_signed_wrz_z3t.py",
                    "0527a0b75e0f8e90a8927cc60c10cd634272adcba065564af387983c34822253"),
    "ordinary":(ORDINARY+"post-signed-wrz-z3t.json",
                "3a53063e6d47ff36d29fa26520ce27f07cf739fd919df1beba4f113f221ac897"),
    "highSigma":(SIGMA,"c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00"),
    "presignedAuxiliary":(PRE,"2390ae40466d65729b448152551281653b2753e237f7c2f666a0a6a4b57857cb"),
}
TARGET=(0,3,1,2)
MISSING=((0,2,1,3),(0,3,1,2),(0,3,1,3),(0,4,1,2),(1,2,1,2),(1,3,1,2))


def read(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return json.loads(raw) if path.suffix==".json" else raw


def main(a):
    inputs={key:read(a.work/rel,digest) for key,(rel,digest) in PINS.items()
            if key!="presignedAuxiliary"}
    old=inputs["ordinary"]
    assert old["RZTL"]==[0,3,1,0] and old["wholePathEpsilonGrade"]=="99999/100000"
    if not a.pre:
        return {"schema":"MathScope.C128.OriginalPostSignedWrzZ3TPair/1",
                "status":"OPEN_NEEDS_AUTHENTICATED_PRESIGNED_AUXILIARY_SUPPLEMENT",
                "ordinaryRZTL":old["RZTL"],"missingPreGaugeRZTL":MISSING,
                "finalJets":0,"release":"HOLD"}
    pre=read(a.pre,PINS["presignedAuxiliary"][1])
    assert len(pre["covarianceRows"])==19
    assert len(pre["targetGaugeDirections"])==86
    assert len(pre["meanAndCompactDependencies"]["requested"])==472
    assert set(MISSING)<={tuple(x) for x in pre["targetGaugeDirections"]}
    assert {tuple(x["RZTL"]) for x in pre["covarianceRows"]}>={TARGET,(0,3,1,0)}
    assert pre["covarianceCommonLogRankHOver2Pow128"]==357940
    module=runpy.run_path(str(a.work/PINS["ordinaryCode"][0]))
    definition=inspect.getsource(module["main"])
    for old_text,new_text in (
            ('d["pre"]=inputs["pressurePre"]','d["pre"]=presigned_auxiliary'),
            ("assert len(needed)==26","assert len(needed)==62"),
            ("max(g[3] for g in needed)==1","max(g[3] for g in needed)==3"),
            ('"degree<=5 and j<=1"','"degree<=5 and j<=3"'),
            ("OriginalPostSignedWrzZ3TOrdinary","OriginalPostSignedWrzZ3TPair"),
            ("CONDITIONAL_ACTUAL_POST_SIGNED_W_RZ_Z3T","CONDITIONAL_ACTUAL_POST_SIGNED_W_RZ_Z3T_AND_L2"),
            ('"open":"L squared companion needs independent supplementary first-wave L covariances and paired gauge inputs; the ordinary bound alone does not control the late pressure Fourier inverse."',
             '"open":"The paired W_rz Z³T source terms are attached. The complete late axial pressure still requires the other source inputs, the true shifted whole and partial paths and ordinary Fourier realization."'),
    ):
        assert definition.count(old_text)==1,old_text
        definition=definition.replace(old_text,new_text)
    env={**module["main"].__globals__,"TARGET":TARGET,"presigned_auxiliary":pre}
    local={}
    path=a.work/PINS["ordinaryCode"][0]
    exec(compile(definition,str(path),"exec"),env,local)
    pairing=FunctionType(local["main"].__code__,env)
    out=pairing(argparse.Namespace(work=a.work,goal=a.goal,
                    sigma=a.work/SIGMA,sigma_sha=PINS["highSigma"][1]))
    assert out["source"]==old["source"]
    assert len(out["nativeGaugeRows"])==62
    out["pins"]=PINS
    out["originalOrdinaryPartner"]={"RZTL":old["RZTL"],"receiptSHA256":PINS["ordinary"][1]}
    out["pairBothWholePathGrade"]="99999/100000"
    return out


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for k in ("work","goal","out"):
        p.add_argument("--"+k,type=Path,required=True)
    p.add_argument("--pre",type=Path)
    a=p.parse_args()
    report=main(a)
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print(report["status"],len(report.get("nativeGaugeRows",[])))
