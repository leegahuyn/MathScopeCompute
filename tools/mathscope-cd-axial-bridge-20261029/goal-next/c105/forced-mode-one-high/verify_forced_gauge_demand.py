"""Enumerate the early Forced gauge requests of the C103 high Signed path."""

from argparse import ArgumentParser
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


PINS = {
    "pressure": "d7d5d99aa0285e99680f90563b9e27bce8a95877265134165061a7f7745e5cc8",
    "pairing": "9b020d976334c29c851c28cfb718c9fea3aab6fbf34436f5d845efd191a20c11",
}


def pin(key,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],path
    return raw


def main(a):
    upstream=json.loads(pin("pressure",a.goal/"c103/signed-high/signed-high-upstream.json"))
    path=a.goal/"c102/signed-curl-coverage/verify_signed_curl_coverage.py"
    pin("pairing",path)
    original=runpy.run_path(str(path))["pair_demand"]
    source=inspect.getsource(original)
    first,last=source.index("                                for k in (0,1):"),source.index("                                local.update(pot)")
    # Keep the exact original paired derivatives. For a sufficient sup
    # estimate no C2-specific IBP is presumed to extend to C6.
    source=source[:first]+source[last:]
    scope={}
    exec(compile(source,str(path),"exec"),original.__globals__,scope)
    rows,required,cases=scope["pair_demand"](upstream["orders"]["forcedCovarianceSupremumOrders"],set())
    top=[order for order in required if sum(order[:2])==max(sum(d[:2]) for d in required)]
    assert (0,9,0) in top
    result={"schema":"MathScope.C105.EarlyForcedPhaseFreeGaugeHighDemand/1",
            "status":"VERIFIED_PAIRED_CURL_DEMAND_CONDITIONAL_NO_HIGH_IBP",
            "pins":PINS,"requests":required,"highestSlow":top,"pairedCases":cases,"roles":rows,
            "scope":"A sufficient inventory before any further exact radial/Haar integrations by parts."}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("Exact Forced curl census",len(rows),cases,len(required),"top slow",top)


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    parser.add_argument("--goal",required=True,type=Path)
    parser.add_argument("--out",required=True,type=Path)
    main(parser.parse_args())
