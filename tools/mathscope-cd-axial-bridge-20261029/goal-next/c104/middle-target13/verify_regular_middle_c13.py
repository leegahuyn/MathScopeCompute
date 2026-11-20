"""Replay the original middle target with C14 leading inputs."""

from argparse import ArgumentParser
from hashlib import sha256
import inspect
import json
from math import factorial
from pathlib import Path
import runpy
from types import SimpleNamespace


PINS = {
    "previousProgram": "1ccd94c9edd0263eab6bc30bd95a466ce67eb7efb6d9e84fa25679bbda6a2dbb",
    "chart14": "b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
    "oldChart11": "9ef9baa5136aeca25f7ef343d83d14a121e127949ec64a7cb03cc81590772efd",
}


def pin(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def replay(args):
    old = args.goal / "c101/high-middle-target/verify_regular_middle_high.py"
    pin(old, PINS["previousProgram"])
    previous = runpy.run_path(str(old))
    old_chart = args.goal / "c100/chart11/chart11.json"
    pin(old_chart, PINS["oldChart11"])
    baseline = previous["verify"](SimpleNamespace(goal=args.goal, runtime=args.runtime, chart=old_chart))
    chart = json.loads(pin(args.chart14, PINS["chart14"]))
    assert chart["pointwiseCoefficientCap"] == "2^3654*Hc^255" and chart["totalDirections"] == 680
    assert chart["atomDerivativeOrder"] == 15 and 3654 < 4096
    # The original Hc <= Renv and 2^4096 <= Renv give degree 256.
    chart_degree = 255 + 1

    original = args.goal / previous["PINS"]["recurrence"][0]
    pin(original, previous["PINS"]["recurrence"][1])
    raw = runpy.run_path(str(original))["raw_middle"]
    source = inspect.getsource(previous["extend"])
    for old_text,new in (
        ("7**12 < 2**34", "7**14 < 2**40"),
        ("11 <= order <= 12", "11 <= order <= 14"),
        ("(30,0,order),(30,0,order)", "(34,0,order),(34,0,order)"),
        ("chart_degree = 169", f"chart_degree = {chart_degree}"),
    ):
        assert source.count(old_text) == 1, old_text
        source = source.replace(old_text,new)
    namespace = {}
    exec(compile(source, str(old), "exec"), previous["extend"].__globals__, namespace)
    high = namespace["extend"](raw)

    assert factorial(14) < 2**37 and 2*(14+1)+1 <= 34 and 2*14+2 <= 34
    assert 5*factorial(14)*32**14 < 2**110 < 2**260
    assert baseline["independentActualP0"]["ordinaryEtaJetBound"] == "5*K*m!*32^m for every finite m"
    # Same logarithmic argument as C101. The dyadic divisor is absorbed
    # by Renv^257 using Renv>=2^4096, well below the source H threshold.
    assert 4098+257 < 4096*511
    # The C14 directed evaluator uses the alternative input log cap H/2^300.
    # Since H > Renv^(4096*511)/2, even 512 log(Renv) is below H/2^300.
    assert 300+10+4096 < 4096*4096*511
    assert 3*2**256 < 2**300
    rows = []
    for order in (12,13):
        bounds = high((0,1,order+1),(0,1,order+1))
        assert bounds["theta"][2] == bounds["axial"][2] == order
        assert bounds["bothMiddleSlowEnvelopeDegree"] == 2
        assert bounds["bothMiddleSlowRenvDegree"] < 512
        rows.append({"outputOrder":order,"inputLeadingOrdinaryOrder":order+1,
                     "positiveRecurrence": bounds, "conditionalOriginalLogCap":"H/2^256"})
    return {"schema":"MathScope.C104.OriginalRegularMiddleTargetC13/1",
            "status":"VERIFIED_SAME_BODY_RECURRENCE_CONDITIONAL_ORIGINAL_C14_INPUT",
            "pins": PINS, "sourceRows":baseline["sourceRows"], "domain":baseline["domain"],
            "independentPressureDatum": baseline["independentActualP0"],
            "capRows":rows,"chartDegree":chart_degree,
            "prefixDomain":"Original 0<=X<=Xb for the pure eta prefix. Higher R derivatives use the original FTC.",
            "premises":["Ordinary original C14 leading F0 and U0, their complete prefix domain, same original chart and admitted middle.",
                        "Hc<=Renv, Renv>=2^4096, and log of leading envelope <= Renv^4096 or <= H/2^300."],
            "finalJets":0, "release":"HOLD"}


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for name in ("goal","runtime","chart14","out"):
        parser.add_argument("--"+name, type=Path, required=True)
    args = parser.parse_args()
    result = replay(args)
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original middle targets C12 and C13", result["capRows"])
