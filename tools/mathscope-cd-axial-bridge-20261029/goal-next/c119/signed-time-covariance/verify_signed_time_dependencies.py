"""Read the exact mixed target dependencies of the original Signed time curl."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy


PINS={
 "c108Code":("continuation108/early-sigma-c6/final/verify_sigma_c6.py","f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8"),
 "c108":("continuation108/early-sigma-c6/final/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
 "c118Pure":("continuation118/pure-sigma-time-join/pure-sigma-time.json","b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796"),
}
PAIRS={"rr":("beta","beta"),"rtheta":("beta","v"),"rz":("beta","gamma"),
       "thetatheta":("v","v"),"thetaz":("v","gamma"),"zz":("gamma","gamma")}
REGIONS=("inner","outer","middle")
REQ=((0,0,1),(1,0,1),(0,1,1))


def read(path,expected):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==expected,(path,expected)
    return runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw)


def audit_curl(runtime):
    program=runtime/"generic-signed-source-kernel.mjs"
    raw=program.read_bytes()
    digest="15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2"
    assert sha256(raw).hexdigest()==digest
    source=raw.decode()
    assert "normal:f.frame.n,potential" in source
    assert "rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared)))" in source
    root=runtime.parent.parent/"mathscope-m2"/"navier"
    curl_sha="4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2"
    target_sha="4ffa1f1608b12b54efa36b2f7e185c48fe1522c943206f2223b2c60299b70a00"
    bridge_sha="8d828a5be966766e0e59fbf5d3c9cd8a5f8ab5a188d7a2a58a43e35f6c6f7c51"
    code=[]
    for path,pin in [(root/"actual-full-curl.mjs",curl_sha),(root/"actual-common-physical-jet-kernel.mjs",target_sha),
                      (runtime/"original-generic-signed-bridge.mjs",bridge_sha)]:
        data=path.read_bytes()
        assert sha256(data).hexdigest()==pin,path
        code.append(data.decode())
    curl,target,bridge=code
    assert "fullCurl:exactCylindricalHarmonicCurl" in bridge
    assert "G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi))" in curl
    assert "Dz=x=>G.mul(epsilon,G.derivative(x,Z))" in curl
    assert "[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))]" in curl
    assert "['R','Z','T','Xrep','etaRep','sRep']" in target
    assert "allAuxiliaryCoordinatesExcluded:true" in target
    # Independent symbol-routing for the ordinary part of a cylindrical curl.
    # Slots 0,1,2 refer to r,theta,z on the potential.
    active=[((1,"ZT",-1),),((0,"ZT",1),(2,"RT",-1),(2,"LT",-1)),((1,"RT",1),(1,"LT",1),(1,"T",1))]
    assert {order for row in active for _,order,_ in row}=={"T","RT","ZT","LT"}
    # Witness for the separate necessity of radial and axial mixed terms
    # in the unconstrained tangent compatible linear curl map.
    n=(1,1,1)
    u=(1,-1,0)
    assert sum(x*y for x,y in zip(n,u))==0
    A=(1,1,-2)
    assert A==(n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0])
    assert A[1] and A[0] and A[2]
    return {"phaseFreeOrdinaryCurlRouting":active,"slowSigmaLT":0,
       "necessarySourceTargetOrders":["T","RT","ZT"],
       "separatePhase":"-epsilon*phi_T multiplies original full curl and retains epsilon*k.",
       "symbolicNonzeroMixedControl":{"n":n,"tangentU":u,"normalCrossU":A},
       "signedKernelSHA256":digest,"actualCurlSHA256":curl_sha,
       "actualSlowTargetContractSHA256":target_sha,"actualBridgeSHA256":bridge_sha}


def build_trace(ops,target,index):
    # Unrestricted placeholders expose exact dependency identities only.
    # Their arbitrary unit values are never emitted as numerical evidence.
    full=list(product(range(4),range(5),range(3)))
    w={(name,a):ops["Bound"](ops["E"],0,0,0) for a in full for name in PAIRS}
    compact={(f,(*a,0)):{"minEpsilon":"1","bandIntercept":"1/2"} for f in ("beta","v","gamma") for a in full}
    pairs={(name,(*a,0)):[(f,(*b,0),g,(*c,0),k) for b,c,k in ops["splits"](a)]
           for name,(f,g) in PAIRS.items() for a in full}
    collar={reg:(None,{(n,a):{"epsilon":"2","band":"1"} for n in PAIRS for a in full},0)
            for reg in ("inner","outer")}
    _,trace=ops["arithmetic"]({},{"weightedSigmaSpatialOrders":[list(target)],"localWeightedRadialFlux":[list(b) for b in product(*(range(u+1) for u in target))]},compact,pairs,collar,w,index)
    return trace


def main(args):
    d={k:read(args.work/rel,pin) for k,(rel,pin) in PINS.items()}
    assert d["c108"]["SigmaApplications"]==[22001223,22001224]
    assert d["c108"]["incrementalPressureZ"]==22000443
    ops=d["c108Code"]
    traces={str(a):{key:build_trace(ops,a,key) for key in REGIONS} for a in REQ}
    old=set((f,tuple(a)) for f,a in d["c118Pure"]["exactCovarianceRoles"])
    old_rt=set((f,tuple(a)) for tr in traces[str(REQ[0])].values() for f,a in tr["covariance"])
    assert old_rt==old and len(old)==22
    combined={(f,tuple(a)) for tr in traces.values() for reg in tr.values() for f,a in reg["covariance"]}
    extra=combined-old
    assert ("rz",(0,3,1)) in extra
    assert ("rtheta",(1,0,1)) in extra and ("rz",(1,0,1)) in extra
    t2={(f,tuple(a)) for tr in traces.values() for reg in tr.values() for f,a in reg["compactMean"] if a[2]>=2}
    assert ("beta",(0,2,2)) in t2
    gauge={(a[0]+b[0],a[1]+b[1],a[2],b[2]) for _,idx in combined
           for a in product(*(range(u+1) for u in idx))
           for b in ((0,0,0),(1,0,0),(0,1,0),(0,0,1))}
    assert (0,4,1,0) in gauge
    report={"schema":"MathScope.C119.OriginalMixedSignedTimeDependencies/1",
            "status":"VERIFIED_ACTUAL_PRESSURE_CENTERING_DEPENDENCY_WITHOUT_NUMERICAL_CAPS",
            "pins":{k:v[1] for k,v in PINS.items()},"roots":[22001223,22001224,22000443],
            "fixedEndpoints":d["c108"]["fixedRadialEndpoints"],"physicalCurl":audit_curl(args.runtime),
            "exactSigmaRequests":REQ,"originalSourceTraces":traces,
            "allRequiredCovarianceRoles":sorted(combined),"higherCovarianceBeyondPureT":sorted(extra),
            "secondTimeMeanRoles":sorted(t2),"gaugeDirectionsFromCovariance":sorted(gauge),
            "open":"Require attached ordinary source caps for all new covariance and the mixed signed target before claiming the physical Signed time velocity.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("PASS original Sigma T,RT,ZT dependencies",len(combined),len(extra),len(gauge))


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","runtime","out"):
        p.add_argument(f"--{k}",type=Path,required=True)
    main(p.parse_args())
