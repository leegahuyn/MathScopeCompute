"""Extend the original on-domain middle target to C15."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import runpy
from types import SimpleNamespace


PINS={
    "previousProgram":"4f59d24a8ddd4abb62a25d8ad330bc07fbe513329dc7ece4e572e42c9fe538dd",
    "previousChart":"b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
    "chart16":"ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c",
    "directedLeading":"bc5d210c3a2d0dddebe316492e385574e36540188dc2599442351c8d0ec76da7",
}


def pin(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def main(a):
    path=a.goal/"c104/middle-target13/verify_regular_middle_c13.py"
    code=pin(path,PINS["previousProgram"]).decode()
    old=runpy.run_path(str(path))
    baseline=old["replay"](SimpleNamespace(goal=a.goal,runtime=a.runtime,chart14=a.goal/"c104/background14/chart14.json"))
    assert baseline["capRows"][-1]["positiveRecurrence"]["bothMiddleSlowRenvDegree"]==339
    chart=json.loads(pin(a.chart,PINS["chart16"]))
    leading=json.loads(pin(a.leading,PINS["directedLeading"]))
    assert chart["pointwiseCoefficientCap"]=="2^4803*Hc^323" and chart["totalDirections"]==969
    assert chart["atomDerivativeOrder"]==17
    for old_text,new in [
        (PINS["previousChart"],PINS["chart16"]),
        ('"2^3654*Hc^255"','"2^4803*Hc^323"'),
        ('== 680','== 969'),('== 15 and 3654 < 4096','== 17 and 4803 < 8192'),
        ('chart_degree = 255 + 1','chart_degree = 323 + 2'),
        ('7**14 < 2**40','7**16 < 2**46'),('11 <= order <= 14','11 <= order <= 16'),
        ('(34,0,order),(34,0,order)','(38,0,order),(38,0,order)'),
        ('factorial(14) < 2**37 and 2*(14+1)+1 <= 34 and 2*14+2 <= 34',
         'factorial(16) < 2**45 and 2*(16+1)+1 <= 38 and 2*16+2 <= 38'),
        ('5*factorial(14)*32**14 < 2**110','5*factorial(16)*32**16 < 2**130'),
        ('for order in (12,13):','for order in (14,15):'),
    ]:
        assert code.count(old_text)==1,old_text
        code=code.replace(old_text,new)
    scope={"__name__":"c106_prerequisite"}
    exec(compile(code,str(path),"exec"),scope,scope)
    result=scope["replay"](SimpleNamespace(goal=a.goal,runtime=a.runtime,chart14=a.chart))
    maximum=result["capRows"][-1]
    assert maximum["inputLeadingOrdinaryOrder"]==16==1+maximum["outputOrder"]
    assert maximum["positiveRecurrence"]["bothMiddleSlowRenvDegree"]==416
    assert "H/2^300" in json.dumps(leading) and "leadingLogCapSign" in leading
    assert leading["leadingLogCapSign"]==-1
    assert 416*2**301 < 2**(4096*510)
    result.update(schema="MathScope.C106.OriginalRegularMiddleTargetC15/1",
                  status="VERIFIED_SAME_BODY_C15_REDUCTION_WITH_DIRECTED_C16_LEADING_LOG_CAP",
                  pins=PINS, directedLeadingLogCap="H/2^300",
                  premises=["Same original chart, admitted middle and whole pure eta prefix.",
                            "Common ordinary smooth original C16 leading F0 and U0.",
                            "Hc<=Renv and Renv>=2^4096."])
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS native middle target C15, log H/2^256, Renv degree",maximum["positiveRecurrence"]["bothMiddleSlowRenvDegree"])


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","runtime","chart","leading","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
