"""Trace the ordinary phase-free Signed/reference inputs of the original late covariance."""

from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy


PINS={
    "late":"1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b",
    "curl":"9b020d976334c29c851c28cfb718c9fea3aab6fbf34436f5d845efd191a20c11",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return raw


def main(a):
    late=json.loads(pin("late",a.goal/"c103/late-mean/late-mean-inventory.json"))
    path=a.goal/"c102/signed-curl-coverage/verify_signed_curl_coverage.py"
    pin("curl",path)
    scope=runpy.run_path(str(path))
    add, axes, curl, real=(scope[n] for n in ("add","COMPONENTS","CURL","REAL"))
    data=late["demand"]
    required,rows,cases=set(),[],0
    for name,(r,z,t,l) in data["postSignedCovarianceOrders"]:
        assert t==0
        left,right=axes[name]
        local=set()
        for i,j,k in product(range(r+1),range(z+1),range(l+1)):
            for left_options,right_options in ((real,real),(curl[left],curl[right])):
                for u,v in product(left_options,right_options):
                    local.add(add(u,(i,j,k)))
                    local.add(add(v,(r-i,z-j,l-k)))
                    cases+=1
        rows.append({"covariance":name,"RZL":[r,z,l],"potentialDirections":sorted(local)})
        required.update(local)
    # Later auxiliary L derivatives hit only the non-Sigma gauge factors.
    slow_closure={(i,j) for r,z,l in required for i in range(r+1) for j in range(z+1)}
    assert slow_closure==set(map(tuple,data["sufficientPreviousSignedSigmaDirectionsRZ"]))
    assert max(l for _,_,l in required)==6
    result={"schema":"MathScope.C107.SignedPostCovariancePhaseFreeCurlDemand/1",
            "status":"VERIFIED_SUFFICIENT_ORIGINAL_PAIRED_DERIVATIVE_CENSUS",
            "pins":PINS,"directions":sorted(required),"covarianceRows":rows,
            "covarianceCount":len(rows),"pairedCases":cases,"sigmaSlowDirections":sorted(slow_closure),
            "maximumGaugeL":max(l for _,_,l in required),
            "remaining":"Pay original radial/fast cutoff, moving core, and both Sigma coefficient bounds over the common source paths.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("Original late curl: covariance rows",len(rows),"paired cases",cases,"phase-free potential directions",len(required))


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","out"):
        p.add_argument("--"+name, type=Path, required=True)
    main(p.parse_args())
