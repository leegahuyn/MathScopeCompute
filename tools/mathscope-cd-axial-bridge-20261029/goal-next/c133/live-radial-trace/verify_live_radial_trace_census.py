"""Read the authenticated active Repeat suffix and identify its literal radial trace demands."""
from argparse import ArgumentParser
from collections import Counter,defaultdict
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
import runpy
from types import SimpleNamespace

p=ArgumentParser(description=__doc__)
for name in ("work","goal","out"):
    p.add_argument("--"+name,required=True,type=Path)
a=p.parse_args()
w=a.work
g=a.goal
P="continuation132/active-repeat-source/"
H="continuation132/hosted-44682703381/"
old="continuation70/hosted-44582875351/first-correction-spatial-source/"
pins={
 "priorManifest":(w/old/"original-source-export-manifest.json","8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"),
 "active":(w/P/"active-readback.json","49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4"),
 "pulse":(w/P/"active-pulse.json","66ef428eac20fb51f5aa5f4a26b2e197e3580c1d1b42bf6cc0521cfe40c7c1e7"),
 "nonradial":(w/P/"active-nonradial.json","86ec5d2ed89cb1b2038d1be5b3afcaeb6233feb6901bd2db16970578cb7d2cf6"),
 "candidate":(w/H/"active-n3-repeat-forced-candidate.json","b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e"),
 "export":(w/H/"active-n3-repeat-forced-export.json","4c8085b90e4fbe017a03ccb5a897eec8b6e4539f096e72950066af27e77b3e7a"),
 "originalShell":(w/"continuation112/j2-slow-radial/radial-shell-minimum.json","03b909f35bb21785ac4216caf9065bd2d50c600c7109df5c8d2bacd5c20bea8e"),
 "nativeAlgebra":(g/"first-force-repair/verify_repaired_first_force.py","260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75"),
 "C130temporal":(w/"continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json","13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a"),
 "C133five":(w/"continuation133/fivemap-velocity-time-bound/fivemap-first-time.json","a6f277d09c5c287f32e4175008076cfd453fd94b988b4aa8440eb284d3146072"),
 "repeat":(w/"continuation66/stage2/runtime-exact/research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs","4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
}
data={}
for key,(path,h) in pins.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==h,path
    data[key]=json.loads(raw) if path.suffix==".json" else raw.decode()
active=data["active"]
assert active["terminalRun"]["run"]==44682703381
assert active["terminalRun"]["commit"]=="287ca9eeaf2ab61f8405949c40e490af915cc1b0"
assert active["mechanics"]["sourceScalars"]==240
assert data["pulse"]["sourceStreamSHA256"]==data["nonradial"]["streamSHA256"]==active["stream"]["sha256"]
assert active["candidateSHA256"]==pins["candidate"][1]
candidate=data["candidate"]
prefix=active["stream"]["protectedPrefixNodes"]
assert candidate["preRepeatNodeCount"]==prefix==22155584
assert candidate["postRepeatNodeCount"]==active["stream"]["nodes"]==22380596
assert data["priorManifest"]["node_stream_sha256"]==active["stream"]["protectedPrefixCompleteHash"]
geometry=data["originalShell"]["geometry"]
assert (geometry["s"],geometry["X"],geometry["RZT"],geometry["shellThresholds"])==(17732766,17732770,[17732748,17732749,17732750],[3617,28826])
assert geometry["slowInverseDefinition"]["parameters"]==geometry["RZT"][1:]
assert all(x in data["repeat"] for x in ("first-forced-remaining-source","first-forced-cutoff-derivative",
                                           "primary-cutoff-derivative","signed-cutoff-derivative",
                                           "guardGlobalLocalBody(G, current.geometry, current.local.slowCutoff, rectangular, { auxiliary: false })"))

# Use the previously authenticated same-prefix byte offset. The manifest
# headers have equal byte length. Only the independently hashed suffix is
# interpreted here. The inherited prefix proof is the pinned live receipt.
directory=w/H/"active-n3-repeat-forced-source"
header=lambda n:(json.dumps({"schema":"MathScope.M3.FullNodesJSONL/1","node_count":n},separators=(",",":"))+"\n").encode()
assert len(header(prefix))==len(header(candidate["postRepeatNodeCount"]))
with gzip.open(directory/"original-source-nodes.jsonl.gz","rb") as f:
    assert f.readline()==header(candidate["postRepeatNodeCount"])
    f.seek(data["priorManifest"]["node_stream_uncompressed_bytes"])
    suffix=f.read()
assert len(suffix)==active["stream"]["uncompressedBytes"]-data["priorManifest"]["node_stream_uncompressed_bytes"]
suffix_pin=sha256(suffix).hexdigest()
assert suffix_pin==active["stream"]["appendRecordsSHA256"]
records=[json.loads(row) for row in suffix.splitlines()]
assert len(records)==225012
raw=(directory/"original-source-functions.json").read_bytes()
assert sha256(raw).hexdigest()==active["registrySHA256"]
defs={r["id"]:r for r in json.loads(json.loads(raw)["definitions"])[0]}
names={r["name"]:r for r in defs.values()}
parts=("real","imaginary")
R,Z,T=geometry["RZT"]
Y=(17745430,17745431)
eps=17732744

def node(i):
    a=records[i-prefix]
    return a["op"],a["args"]

def guards(root,interior):
    triples=[]
    layers=[]
    n=root
    for _ in range(7):
        op,args=node(n)
        assert op=="smooth_piecewise"
        x,lo,hi,z0,b,z1=args
        assert z0==z1==0 and b<n
        layers.append(n)
        triples.append([x,lo,hi])
        n=b
    assert n==interior
    assert triples[4]==[17732770,3617,28826]
    return layers,triples

def ord_wave(owner,args,q,which):
    r=defs[owner]
    assert len(args)==len(q)==len(r["parameters"])
    assert tuple(r["parameters"][:4])==(17732737,R,Z,T)
    assert all(v>=0 for v in q)
    assert all(k==0 or v in (R,Z,T,*Y) for v,k in zip(r["parameters"],q))
    return tuple(q[r["parameters"].index(x)] for x in (R,Z,T,*Y))

wave_slots={}
res={}
family_counts=Counter()
raw_classes=Counter()
t_orders=[]
pressure_applications=set()
actual_t_example=None
actual_shell_example=None
for template in candidate["templates"]:
    key=template["key"]
    declared=set(template["rawSupport"]["waveSystems"])
    assert len(declared)==16
    wave={}
    for m,j,part in ((m,j,part) for m in (1,2) for j in range(4) for part in parts):
        capsule=names[f"PostFiveRepeatWave_{key}_{m}_{j}_{part}"]
        assert capsule["body"]<prefix and capsule["id"] in declared
        wave[capsule["id"]]=(m,j,part)
    assert set(wave)==declared
    observed=set()

    @cache
    def uses(i):
        if i==0:
            return frozenset(),frozenset()
        if i<prefix:
            return frozenset(((0,0),)),frozenset()
        op,args=node(i)
        if op=="m3_coupled_expression_partial":
            name,actuals,orders=args
            if name not in wave:
                assert defs[name]["name"].startswith("PostFiveRepeatMeanVelocity_"),defs[name]["name"]
                return frozenset(((0,0),)),frozenset()
            m,j,part=wave[name]
            vector=ord_wave(name,actuals,orders,j)
            return frozenset(((int(j<3),int(j==3)),)),frozenset(((name,i,tuple(orders),vector),))
        assert op in ("add","multiply"),(key,i,op)
        hits=frozenset().union(*(uses(q)[1] for q in args))
        factors=[uses(q)[0] for q in args]
        if op=="add":
            return frozenset().union(*factors),hits
        current={(0,0)}
        for factor in factors:
            current={(x+a0,y+b0) for x,y in current for a0,b0 in factor}
        return frozenset(current),hits

    for row in template["rows"]:
        m=row["m"]
        for item in row["terms"]:
            family_counts[item["family"]]+=1
        for k,part in ((k,part) for k in range(3) for part in parts):
            raw_id=row["raw"][k][part]
            supported=row["supported"][k][part]
            guarded=row["guarded"][k][part]
            layers,triples=guards(guarded,supported)
            assert triples==active["mechanics"]["guardTriplesByChart"][key]
            degrees,hits=uses(raw_id)
            expected={(1,0),(0,1),(2,0)} if m<=2 else {(2,0)}
            assert degrees==expected,(key,m,k,part,raw_id,degrees)
            raw_classes[(m,tuple(sorted(degrees)))]+=1
            observed.update(hits)
            if key=="0:1" and m==1 and k==0 and part=="imaginary":
                actual_shell_example={"selectedGuard":layers[4],"orderedGuardRoots":layers,
                                      "radialTest":triples[4],"insideSupported":supported,
                                      "outsideBoth":0,"raw":raw_id,"guarded":guarded,
                                      "subtraction":row["subtraction"][k][part]}
                main_owner=next(n for n,slot in wave.items() if slot==(1,0,"imaginary"))
                matches=[j for n,j,_,q in hits if n==main_owner and q==(0,0,1,0,0)]
                assert len(matches)==1
                actual_t_example=(matches[0],main_owner)
    metadata={(r["system"],tuple(r["orders"])) for r in template["rawSupport"]["waveJets"]}
    assert {(n,q) for n,_,q,_ in observed}==metadata
    result={}
    for m in (1,2):
        subset=[(owner,i,q,b) for owner,i,q,b in observed if wave[owner][0]==m]
        pressure=[x for x in subset if wave[x[0]][1]==3]
        velocity=[x for x in subset if wave[x[0]][1]<3]
        assert all(not b[2] for _,_,_,b in pressure)
        result[str(m)]={"pressureOrders":sorted({b for _,_,_,b in pressure}),
                        "velocityOrders":sorted({b for _,_,_,b in velocity}),
                        "typedNativePressureCases":len(pressure),"typedNativeVelocityCases":len(velocity)}
        t_orders.extend((key,owner,i) for owner,i,_,q in velocity if q[2])
        pressure_applications.update(i for _,i,_,_ in pressure)
    res[key]=result

assert len(pressure_applications)==200 and len(t_orders)==120
assert family_counts=={"first-forced-remaining-source":20,"first-forced-cutoff-derivative":20,
                       "primary-cutoff-derivative":10,"signed-cutoff-derivative":10}
assert all(n==60 for n in raw_classes.values()) and len(raw_classes)==4
marker,owner=actual_t_example
def atomized_node(i):
    if i<prefix:
        if i in (0,1,20):
            return "rational",[str({0:0,1:1,20:-1}[i]),"1"]
        return "analytic",[]
    return node(i)
exact=runpy.run_path(str(pins["nativeAlgebra"][0]))["Exact"](SimpleNamespace(node=atomized_node))
def marker_coefficient(i):
    terms=exact.of(i)
    selected={}
    for monomial,value in terms.items():
        power=dict(monomial).get(marker,0)
        assert power<=1
        if power:
            selected[tuple((q,d) for q,d in monomial if q!=marker)]=value
    return selected
want=exact.neg(exact.of(eps))
assert marker_coefficient(actual_shell_example["raw"])==marker_coefficient(actual_shell_example["insideSupported"])==want
assert marker_coefficient(actual_shell_example["subtraction"])=={}
assert defs[owner]["body"]==data["originalShell"]["originalTraceWitness"]["protectedWaveBody"]==22004387
assert data["C130temporal"]["actualSource"]["potential"]==22150943
assert data["C133five"]["accumulatedAndInitializedRoots"]["postMinusInitialized"]==[22153217,22153219,22153221]
assert data["nonradial"]["radialOrdinaryExtension"]=="OPEN"

out={"schema":"MathScope.C133.LiveOriginalRepeatRadialTraceCensus/1",
     "status":"VERIFIED_ACTIVE_RADIAL_GUARD_AND_EXACT_RAW_TRACE_DEMANDS",
     "pins":{k:h for k,(_,h) in pins.items()},
     "source":{"run":44682703381,"commit":active["terminalRun"]["commit"],
               "liveStream":active["stream"]["sha256"],"appendSHA256":suffix_pin,
               "nativeRegistry":active["registrySHA256"],"appendRecordsRead":len(records),
               "weightedSpoolPrefixByteOffset":data["priorManifest"]["node_stream_uncompressed_bytes"]},
     "guard":{"triple":[17732770,3617,28826],"zeroBasedLayer":4,
              "X":"R^2/(2*s(Z,T))","s":17732766,"RZT":geometry["RZT"],
              "innerRadiusLimit":"sqrt(2*s*Xa)","outerRadiusLimit":"sqrt(2*s*Xb)",
              "selectedInteriorDerivativeXR":"R/s>0","bothEndpointBranches":0,
              "openShellBody":actual_shell_example},
     "tenCharts":res,
     "rawHomogeneity":[{"m":m,"velocityAndPressureDegree":b,"realScalarCount":n}
                      for (m,b),n in sorted(raw_classes.items())],
     "rawPressureUses":len(pressure_applications),"ordinaryTimeWaveUses":len(t_orders),
     "coreTimeWitness":{"activeCapsule":owner,"actualTApplication":marker,"protectedNativeBody":22004387,
                        "exactCoefficient":"-epsilon","epsilonNode":eps,
                        "presentInRawAndSupported":True,"presentInSubtraction":False},
     "subtractionFamilies":family_counts,
     "requiredSufficientShellTrace":"At fixed admitted label, each retained actual grouped derivative must tend to zero jointly in the open shell with compact tangential/pulse arguments. Cofactors may spend finite radial pole powers. Gaussian flatness pays any finite pole. Ordinary T of the supported source includes -epsilon times this same native wave T twice after differentiation, unless the complete original grouped cancellation removes it.",
     "sourceBoundsNotImplied":"The packaged C130/C133 normalized mean estimates control coefficients after source attachment. They do not establish the separate Gaussian joint trace of the wave partial or the unprojected first-forcing subtraction.",
     "radialAnalyticExtension":"OPEN_PENDING_SAME_SOURCE_GAUSSIAN_TRACE_ATTACHMENT",
     "stageTwoComplete":False,"finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+"\n").encode())
print("PASS 240 live radial guard identities, raw degree classes, 200 pressure and 120 T operand calls. Actual time application",marker)
