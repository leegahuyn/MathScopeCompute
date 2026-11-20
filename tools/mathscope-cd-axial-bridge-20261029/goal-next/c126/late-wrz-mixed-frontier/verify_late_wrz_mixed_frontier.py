"""Bind the original mixed Z3T pressure covariance to its Signed derivative frontier."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys

PINS={
 "curl":"2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a",
 "late":"1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b",
 "currentSigma":"ec610109784540efae884f7ddcb5a5c8da354cbd9e94c0c7aee8dd2790b65f0a",
 "manifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
 "registry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
 "reader":"2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb",
 "cache":"909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f",
 "algebra":"260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75",
}

def read(path,key,as_json=True):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if as_json else raw

def graph(a,curl,late):
    stage=a.goal/"primary-forced-join/active-n3-c5-binding"
    sources = {"reader":stage/"spatial-readback/source_stream.py",
               "cache":stage/"live-wave-gauge/signed/source_cache.py",
               "algebra":a.goal/"first-force-repair/verify_repaired_first_force.py"}
    for key,path in sources.items():
        read(path,key,False)
    sys.path[:0]=[str(x.parent) for x in sources.values()]
    import source_stream as stream
    import source_cache
    from verify_repaired_first_force import Exact
    manifest=read(a.artifact/stream.MANIFEST,"manifest")
    native=stream.Native(a.artifact,manifest)
    assert native.pin==PINS["registry"]==curl["registrySHA256"]
    g=source_cache.load(stream,a.artifact,manifest,22153782,a.cache)
    g.node=lambda i:(g.record(i)["op"],g.record(i)["args"])
    try:
        assert g.verify==late["source"]["graph"] and g.verify["sha256"]==curl["sourceStreamSHA256"]
        e=Exact(g)
        assert g.args(22031219,"add")==[21728334,22031063]
        common=[17732748,17732749,17732750,17732737,17745430,17745431]
        for root,field,idx,orders in (
            (21728334,"ActualForcedCurrent_W_rz",5,[0]*5),
            (22031063,"GenericSigned162_covariance_delta_rz",22,[0]*5),
            (22031241,"GenericSigned162_covariance_delta_rz",22,[0,1,0,0,0]),
        ):
            assert g.args(root,"m3_coupled_indexed_partial")==["coupled-field:"+str(idx),common,orders]
            assert native.fields[idx]["name"]==field and len(native.fields[idx]["rows"])==162
        assert g.args(22031242,"add")==[21728503,22031241]
        assert g.args(22031243,"add")==[21375018,22031242]
        assert g.args(22031244,"multiply")==[17732744,22031243]
        assert g.args(22031245,"multiply")==[20,22031244]
        assert g.args(22031251,"add")[-1]==22031250 and g.args(22031249,"add")[0]==22031245
        assert late["source"]["signedPressureZ"]==22031648
        assert g.args(22031615,"definite_integral")==[22031614,22031522,17743711,17732748]
        assert g.args(22031616,"definite_integral")==[22031614,22031522,17743711,17743713]
        sys_id,args,derivative=g.args(22031613,"m3_coupled_expression_partial")
        assert sys_id=="coupled-expression:1324" and derivative==[0,0,1,0,0,0]
        assert args[1]==22031522 and args[2:4]==common[1:3]
        assert 22031613 in g.args(22031614,"add")
        quotient=native.expressions[1324]
        assert quotient["parameters"]==[17732737,17732748,17732749,17732750,17745430,17745431]
        stack=[quotient["body"]];seen=set();shifted_cov=[]
        while stack:
            i=stack.pop()
            if i in seen:
                continue
            seen.add(i)
            op,args=g.node(i)
            if op in ("add","multiply"):
                stack.extend(args)
            if op=="m3_coupled_indexed_partial" and args[0]=="coupled-field:22":
                shifted_cov.append([i,*args])
        assert any(row[-1]==[0,1,0,0,0] and row[2]==common for row in shifted_cov)

        target=[22001223,22001224]
        for j,i in enumerate(target):
            assert g.args(i,"m3_coupled_expression_partial")==[
                "coupled-expression:"+str(1276+j),[17732737,17732748,17732749,17732750],[0]*4]
        definitions=[]
        for d in curl["originalDefinitions"]:
            if not d["name"].endswith("_1"):
                continue
            index=int(d["id"].split(":")[1])
            assert native.expressions[index]["body"]==d["body"]
            assert 17733037 not in d["coordinateSupportAfterRemovingOnlyChi"]
            actual=e.of(d["body"])
            counts=[sum(i in dict(m) for m in actual) for i in target]
            assert counts==[204,204]
            assert all(sum(dict(m).get(i,0) for i in target)==1 for m in actual)
            definitions.append({"definition":d["id"],"body":d["body"],"SigmaTargetOperandCounts":counts})
        assert [r["definition"] for r in definitions]==["coupled-expression:1279","coupled-expression:1282"]

        positive=next(row for row in curl["cases"] if row["chart"]=="0:1")
        anchors={r["component"]:r for r in positive["actualSignedAddends"] if r["part"]=="imaginary"}
        assert anchors[0]["exactSignedAddend"]==22001995 and anchors[2]["exactSignedAddend"]==22002894
        ordinary={r["direction"]:r["originalNode"] for r in positive["ordinaryMixedRequests"] if r["potentialComponent"]==1}
        assert ordinary=={"R":22002888,"Z":22001992,"xi":22002889}
        def guard_leaves(i):
            op,vals=g.node(i)
            if op=="smooth_piecewise":
                return set().union(*(guard_leaves(j) for j in vals[3:]))
            return {i} if i else set()
        assert 22004528 in guard_leaves(native.expressions[1308]["body"])
        original_pair=e.of(22004528)
        signed_ss=e.mul(e.of(22001995),e.of(22002894))
        assert len(signed_ss)==5 and all(original_pair.get(m)==2*c for m,c in signed_ss.items())
        marked=[(list(m),str(original_pair[m])) for m in signed_ss if {22001992,22002888}<={i for i,_ in m}]
        assert len(marked)==1 and marked[0][1]=="-1/2"
        assert any({22001992,22002889}<={i for i,_ in m} for m in signed_ss)
        return {"stream":g.verify["sha256"],"registry":native.pin,"WplusRz":22031219,
                "beforeSignedRz":21728334,"signedDeltaRz":22031063,"signedDeltaField":22,"rowCount":162,
                "pressureDensityNegativeEpsilonTimesZPath":[22031241,22031242,22031243,22031244,22031245],
                "pressureZ":22031648,"pressureShiftedIntegrals":[22031615,22031616],"fixedEndpoints":[17743711,17743713],
                "covarianceShiftedNativeApplications":sorted(shifted_cov),"sampleChart":"0:1",
                "sampleGuardedRzDeltaLeaf":22004528,"signedImaginaryPolarPairNodes":[22001995,22002894],
                "signedAzimuthalGaugeFirstPartialRoots":ordinary,"exactSignedOrdinaryCrossMonomial":marked[0],
                "targetApplications":target,"gaugeBodies":definitions}
    finally:
        g.__exit__(None,None,None)

def directions(curr):
    known={(0,0,1),(1,0,1),(0,1,1)} | {tuple(x) for x in curr["targetsRZT"]}
    assert curr["nativeSigmaRoots"]==[22001223,22001224]
    rows=[]
    for lmax in (0,2):
        use_r,use_z=set(),set()
        for z,t,l in product(range(4),range(2),range(lmax+1)):
            # RR real pair has no curl shift. II uses exact radial and axial branches.
            use_r.add((0,z,t,l))
            use_z.add((0,z,t,l))
            use_r.add((0,z+1,t,l))
            use_z.update(((1,z,t,l),(0,z,t,l+1)))
        out=use_r|use_z
        slow={x[:3] for x in out}
        needed=sorted(x for x in slow-known if x[2])
        expected=[(0,3,1),(0,4,1),(1,2,1),(1,3,1)]
        assert needed==expected
        assert max(x[3] for x in use_r)==lmax and max(x[3] for x in use_z)==lmax+1
        rows.append({"targetRZTL":[0,3,1,lmax],"radialSignedGaugeDirections":sorted(use_r),
                     "axialSignedGaugeDirections":sorted(use_z),"positiveTSigmaDirections":sorted(x for x in slow if x[2]),
                     "newPositiveTSigmaDirections":needed,"maximumOriginalTransverseChiOrder":lmax+1,
                     "maxTargetLOrder":0})
    return rows

def controls():
    # In a whole angular pair with C_theta=chi*f, the II product is
    # -epsilon*chi*f_Z*(chi*f_R+a*Lchi*f+chi*f/R)/2.
    # The individual component profiles can be chosen tangent to n=(2,3,5).
    n=(Q(2),Q(3),Q(5)); tangent=(0,Q(1),-Q(3,5))
    assert sum(x*y for x,y in zip(n,tangent,strict=True))==0
    f0={(1,0,0):Q(1),(0,4,1):Q(1,24)}
    f1={(0,1,0):Q(1),(1,3,1):Q(1,6)}
    def diff(p,i):
        return {k[:i]+(k[i]-1,)+k[i+1:]:v*k[i] for k,v in p.items() if k[i]}
    def mul(p,q):
        out=Counter()
        for a,v in p.items():
            for b,w in q.items():
                out[tuple(x+y for x,y in zip(a,b,strict=True))]+=v*w
        return out
    result=[]
    for f in (f0,f1):
        d=mul(diff(f,1),diff(f,0))
        for i in (1,1,1,2):
            d=diff(d,i)
        val=-d.get((0,0,0),0)/2
        assert val==Q(-1,2)
        assert diff(diff(diff(diff(f,1),1),1),2).get((0,0,0),0)==0
        result.append(str(val))
    # At a smooth local control xi=0 with chi=1+xi, Lxi=1:
    # L^2(chi^2)=2. A nonzero compact smooth chi^2 cannot be globally affine.
    return {"testPolynomialsInCenteredRZT":[["R+T*Z^4/24","-1/2"],["Z+R*T*Z^3/6","-1/2"]],
            "ordinaryUnitEpsilonValues":result,"matchingL2ControlUnitEpsilonValues":["-1","-1"],
            "exactTangentVector":[str(x) for x in tangent],"actualSourceCounterexample":False}

def main(a):
    curl=read(a.goal/"c119/signed-curl-mixed-t/signed-mixed-curl.json","curl")
    late=read(a.goal/"c103/late-mean/late-mean-inventory.json","late")
    current=read(a.sigma,"currentSigma")
    report={"schema":"MathScope.C126.OriginalLateWrzMixedFrontier/1",
            "status":"VERIFIED_PROTECTED_SOURCE_AND_EXACT_DEPENDENCY_CENSUS",
            "pins":PINS,"originalGraph":graph(a,curl,late),"pointwiseRequests":directions(current),
            "fixedChartTransverseReduction":"C=chi(xi) B; L^j C=(Lxi)^j chi^(j)(xi) B; L v=0, B and Sigma transverse-independent; no division.",
            "pressurePathReduction":{"firstMandatoryHighPureDirections":[[0,3,1],[0,4,1]],
                "conditionalShiftableRadialDirections":[[1,2,1],[1,3,1]],
                "scope":"Within each shifted radial primitive only. Shift in the integration variable with A d_r h = d_r(Ah)-(d_r A)h. The original reference-to-own palette mismatch adds (a_local-a_shift)Lh; keep center and both end terms. This does not bound pointwise W or remove a pure axial derivative.",
                "fourierL2IsNotTorusHaarZero":True},"negativeControls":controls(),
            "fullQuantitativeBound":"OPEN","finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("PASS protected W+rz and pressure path, four new pointwise Sigma directions, transverse chi through three")

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("goal","artifact","cache","sigma","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
