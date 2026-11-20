"""Exact operand census for the two late Temporal mixed derivatives used by FiveMap."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
from itertools import product
import json
from pathlib import Path
import runpy
from types import FunctionType

p=ArgumentParser(description=__doc__)
for key in ("work","goal","out"):
    p.add_argument("--"+key,type=Path,required=True)
p.add_argument("--numeric-out",type=Path)
p.add_argument("--target",choices=("beta_ZT","v_ZT"),action="append")
a=p.parse_args()
pins={
 "physicalChart":(a.work/"continuation101/axial-budget/runtime/research-ide/mathscope-m2/navier/actual-common-band-physical-curl.mjs","60001a58480274c646856bba803b62fd234db0f9bca33b9d81421963d19b5b70"),
 "axialOps":(a.work/"continuation130/temporal-velocity-time-bound/verify_late_temporal_velocity_T.py","de1755406683d8056b86875852d14e6cd693b3c4a2a3a4a5cfbe516631e3590c"),
 "swirlOps":(a.work/"continuation127/late-temporal-swirl-T/verify_late_temporal_swirl_T.py","fd2440342a7481640df7ffacb8e3c1a617fb8ee67a0e585eaa792576f3d025bc"),
 "swirlPrior":(a.work/"continuation127/late-temporal-swirl-T/late-temporal-swirl-T.json","dabc398f8bbd002c1ab534dbd430123b2a83a65ff1ea72c1e45fbaf5b1af7d6c"),
 "axialPrior":(a.work/"continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json","13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a"),
 "fiveFrontier":(a.work/"continuation131/fivemap-velocity-time/fivemap-velocity-time.json","f91e6c15292c6970a95de7141d109e18ee5c0b57056e4a635faa6f23c9adddf7"),
 "cov129":(a.work/"continuation129/temporal-postsigned-covariance/temporal-postsigned-covariance.json","97c245a1f59d1d35af8f843e6983be14aa3a0e3e58816bbe3f1171f0d590352d"),
 "cov130":(a.work/"continuation130/postsigned-covariance-final/complete-94.json","bca0ba42238e2d50913eb6d540fa4d31d3ad4cfe44c17881bc7d8c1484d555ff"),
 "spatialGrade":(a.goal/"c105/late-grade/late-grade.json","d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef"),
 "spatialJoin":(a.goal/"c108/first-k1-energy/k1-donor-join.json","8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
 "old129":(a.work/"continuation129/temporal-old-mean/temporal-old-mean.json","d5db88769a2246d6142fe6bb8102e9e8ad873233d12181e0a6278a8c54e20bbd"),
 "old132":(a.work/"continuation132/fivemap-old-mean/fivemap-old-mean.json","1b8ddd4ce8b5006d96835b13ba892157b7fee7aef647d64306f96359abfea9bf"),
 "old131":(a.work/"continuation131/fivemap-presigned-high/old-noncompact.json","7058e55da1799344b1ed191784d88de9ee56e31a4d715a65d52ab69e4605cd01"),
}
d={}
for key,(path,h) in pins.items():
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==h,path
    d[key]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw) if path.suffix==".json" else raw.decode()

# Use the full C130 source binding including its compiled shifted FTC and
# fixed center/inverse anchor, and C127 for the native swirl equation.
base=d["axialOps"]["load"](a)
d["axialOps"]["bind"](base)
d["swirlOps"]["bind"](d["swirlOps"]["load"](a))
assert "basis=[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]]" in d["physicalChart"]
assert "actual-R-only-fast-factor" in d["physicalChart"]
assert base["fourier"]["tail"]["symbolN"]=="(sqrt(2)-1)*k0+k1"
assert base["fourier"]["tail"]["symbolL"]=="k0+(1-sqrt(2))*k1"
assert d["fiveFrontier"]["graph"]["potential"]==22151952
assert d["fiveFrontier"]["exactTemporalPressureFrontier"]["Wrz"]==22031219
assert d["swirlPrior"]["roots"]=={"actualTemporalSwirl":22150797,"centeredEtheta":22032006,"rawEtheta":22031277}
assert len(d["spatialGrade"]["premise"]["componentDirections"])==d["spatialJoin"]["sourceInputs"]["covarianceInputs"]==127
assert Q(d["spatialJoin"]["conditionalResult"]["covarianceGrade"])>Q(9,10)
assert d["cov130"]["completeCount"]==94 and d["cov130"]["stillOpen"]==[]

# For the audit substitute inert placeholders solely to get all visited
# original leaves. The numerical path below requires independently supplied
# pads, and the audit writes no value bound based on these placeholders.
formula=inspect.getsource(d["axialOps"]["selected_calculus"])
source_swirl='''        if f=="theta":
            forcing.add((f,a))
            return add(scale(v(shift(a,2)),e=EPS),
                       De(lambda q:flux("theta",q,True),a,2),
                       scale(flux("theta",shift(a,1),False),e=EPS),
                       scale(lap(v,a,is_vector=True),e=EPS))
'''
swirl_at='        assert f=="z"\n        forcing.add((f,a))'
assert formula.count(swirl_at)==1
formula=formula.replace(swirl_at,source_swirl+swirl_at)
needle='''        if a[2]:
            inverse_field(label,f,(a[0],a[1],0,a[3]))
        b=shift(a,3,2)'''
new='''        if a[2]:
            inverse_field(label,f,(a[0],a[1],0,a[3]))
        if a[1]:
            inverse_field(label,f,(a[0],a[1]-1,a[2],a[3]))
        b=shift(a,3,2)'''
assert formula.count(needle)==1
formula=formula.replace(needle,new)
begin=formula.index('    s=s[:output_start]+')
end=formula.index("    env=base.__globals__",begin)
formula=formula[:begin]+"""    s=s[:output_start]+'''    ZT=(0,1,1,0)
    ZZT=(0,2,1,0)
    if d["requested"]=="beta_ZT":
        ans=add(scale(old("beta",ZT,compact="directOnly"),m=2),
                scale(radial_direct(ZZT),e=EPS),
                scale(rad_weight(lambda a:Tchi("weightedDesiredNonfast",a),ZZT,-1),e=EPS))
    elif d["requested"]=="v_ZT":
        ans=add(scale(v(ZT),m=2),inverse_field("directSwirlNonfast",lambda a:nonfast("theta",a),ZT))
    else:
        raise ValueError(d["requested"])
    return ans, {"W":waveseen,"old":oldseen,"cutoff":cutoff,"primitive":primitive,
                 "fourier":fourier_inputs,"background":bgseen}
'''
"""+formula[end:]
insertion='''        assert (f,a) in allowed_old,(f,a,compact)
        oldseen.add((f,a))
        row=old_inputs[f,a]'''
unrestricted='''        oldseen.add((f,a))
        if d.get("censusOnly"):
            return NORM(EPS,0,1,0)
        assert (f,a) in allowed_old,(f,a,compact)
        row=old_inputs[f,a]'''
assert formula.count(insertion)==1
formula=formula.replace(insertion,unrestricted)
start='''        waveseen.add((f,a))
        if (f,a) not in availability:'''
new='''        waveseen.add((f,a))
        if d.get("censusOnly"):
            return NORM(EPS,0,1,0)
        if (f,a) not in availability:'''
assert formula.count(start)==1
formula=formula.replace(start,new)
namespace={}
exec(compile(formula,str(pins["axialOps"][0]),"exec"),d["axialOps"]["selected_calculus"].__globals__,namespace)
selected=namespace["selected_calculus"]

def cov_refs():
    spatial={(f,tuple(q)) for f,q in d["spatialGrade"]["premise"]["componentDirections"]}
    t129={(f,tuple(q)) for f,q in d["cov129"]["previouslyAttached"]}
    q129={(r["tensor"],tuple(r["RZTL"])) for r in d["cov129"]["newlyAttached"]}
    q130={(r["tensor"],tuple(r["RZTL"])) for r in d["cov130"]["newlyAttached"]}
    assert len(t129|q129|q130)==94
    return spatial,t129|q129|q130

old_refs={}
for name in ("old129","old131","old132"):
    donor=d[name]["originalDirectionTable"] if name in ("old129","old132") else d[name]
    rank=max(donor["common"]["coefficientRanksInHOver2Pow128"])
    old_refs[name]={(r["field"],tuple(r["RZTL"])):r for r in donor["middle"]}
    assert rank<2**16 and donor["inner"] and donor["outer"]
    assert set(old_refs[name])=={(r["field"],tuple(r["RZTL"])) for r in donor["inner"]}
    assert set(old_refs[name])=={(r["field"],tuple(r["RZTL"])) for r in donor["outer"]}
# Prior direct swirl proof provides its own original source donors.
prior_swirl=d["swirlOps"]["load"](a)
prior_swirl["slotBound"]=d["swirlPrior"]["weightedSourceAndTransfer"]
priorW={(f,tuple(q)) for f,q in prior_swirl["slotBound"]["usedPostSignedCovariance"]}
assert len(priorW)==16
for name,source_rows in (
    ("spatial", [dict(r,field=f,RZTL=q) for f,q,r in prior_swirl["prior"]["ordinaryMeanRows"]]),
    ("noncompactT", prior_swirl["time"]["middle"]+prior_swirl["old"]["middle"]),
    ("vTTLL", [dict(prior_swirl["vTTLL"]["directTemporal"],field="v",RZTL=[0,0,2,2])]),
):
    old_refs[name]={(r["field"],tuple(r["RZTL"])):r for r in source_rows}
assert {(f,tuple(q)) for f,q in prior_swirl["slotBound"]["usedOldMean"]}<=set().union(*(set(x) for x in old_refs.values()))
spatial,current=cov_refs()
current|=priorW
highest={("rz",(0,4,1,0)),("rz",(0,4,1,2))}
rows={}
for target in ("beta_ZT","v_ZT"):
    _,role=selected({**base,"late":{"demand":{"postSignedCovarianceOrders":[],"initialMeanOrdinaryInputOrders":[]}},
                     "actualOld":{},"availableCovariance":{},"directRank":0,"compactRank":0,
                     "censusOnly":True,"requested":target})
    n=role["W"]-(spatial|current)
    lack=role["old"]-set().union(*(set(s) for s in old_refs.values()))
    assert all((name,(r,z,0,l)) in role["fourier"] and all((name,(r,j,t,l)) in role["fourier"] for j in range(z+1)) for name,(r,z,t,l) in role["fourier"])
    rows[target]={"postSignedCovariance":sorted(role["W"]),"oldMean":sorted(role["old"]),
                  "cutoffRZT":sorted(role["cutoff"]),"originalShiftedPrimitives":sorted(role["primitive"]),
                  "pairedFourierValuesAndZTDirections":sorted(role["fourier"]),
                  "background":sorted(role["background"]),
                  "remainingCovariance":sorted(n),"remainingAfterPlannedZ4TPair":sorted(n-highest),
                  "remainingInitializedMean":sorted(lack),
                  "outsideCurrentFiveMapOldMean":sorted(role["old"]-set(old_refs["old132"])),
                  "counts":{"W":len(role["W"]),"old":len(role["old"]),"pairedFourier":len(role["fourier"]),
                            "newW":len(n),"newWAfterPlannedPair":len(n-highest),"newOld":len(lack)}}
assert highest<=set(map(lambda r:(r[0],tuple(r[1])),rows["beta_ZT"]["remainingCovariance"]))
assert not rows["v_ZT"]["originalShiftedPrimitives"]
out={"schema":"MathScope.C132.ExactMixedTemporalFiveMapOperandCensus/1",
     "status":"VERIFIED_EXACT_SOURCE_OPERAND_CENSUS_CONDITIONAL_ORIGINAL_FIXED_LABEL_REALIZATION",
     "pins":{k:h for k,(_,h) in pins.items()},
     "frozenFourierSymbols":{"N":base["fourier"]["tail"]["symbolN"],"L":base["fourier"]["tail"]["symbolL"]},
     "proof":"C130 outer translated FTC and centered inverse retain the beta ZT input as centered old beta ZT, direct axial radial-flux inverse at ZZT and remaining shifted primitive at ZZT. C127 swirl uses projected old v_ZT and the exact raw angular ZT inverse source. Downward Z/T Fourier rows are included to validate differentiation.",
     "originalRoots":{"betaPotential":22150943,"v":22150797,"EthetaCentered":22032006,"EzCentered":22032008,"pressureZ":22031648},
     "targets":rows,"norm":"OPEN until each traced donor and its source normalization is independently provided.","finalJets":0,"release":"HOLD"}
a.out.write_bytes((json.dumps(out,indent=2,sort_keys=True)+"\n").encode())
for target,r in rows.items():
    print("PASS",target,r["counts"])

# A value bound is emitted only after all rows have immutable actual donors.
if a.numeric_out is not None:
    supplemental = {
        "eightSwirlTensorRows": ("continuation132/fivemap-vzt-wave/vzt-covariance-eight.json",
                                "443b4a53c861882707c1e533a33f59c8dbd84e1f5380e33cb93d080dcdd399c4"),
        "sixAxialTensorRows": ("continuation132/fivemap-wave-coverage/six-caps.json",
                              "e012bfd8ba80a42408adb4f1b882147d12adfddb0b4b437e3c613436ae8fb6a6"),
        "WrzL2Z4T": ("continuation131/fivemap-presigned-z4t-l2/postsigned-l2.json",
                     "b59f104897dfaa5c6e83b8a6075648014b4b908495be4cd35ce3dc57236b5b0c"),
        "WrzZ4T": ("continuation131/fivemap-postsigned-z4t/fivemap-postsigned-z4t.json",
                   "8176592c2b8ef55c5901e5d368fc5bbc00a7997c4e2f81dd2f087acdebf135c6"),
    }
    grade_table={key:89999 if key in spatial else 99999 for key in spatial|current}
    added={}
    applied_pins={}
    for name,(rel,want) in supplemental.items():
        path=a.work/rel
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==want,path
        entry=json.loads(raw)
        assert entry["finalJets"]==0 and entry["release"]=="HOLD"
        checks=[entry] if "RZTL" in entry else entry["targets"]
        for row in checks:
            key=(row["tensor"].removeprefix("W^+_"),tuple(row["RZTL"]))
            assert key[0] in ("rr","rtheta","rz","thetatheta","thetaz","zz"),key
            e=Q(row["wholePathEpsilonGrade"])*100000
            assert e.denominator==1 and e>=99999,key
            if key in grade_table:
                assert grade_table[key]<=e,key
            else:
                grade_table[key]=int(e)
            added[key]=want
        applied_pins[name]=want
    targ=a.target or ("beta_ZT","v_ZT")
    for label in targ:
        needed={(k,tuple(q)) for k,q in rows[label]["postSignedCovariance"]}
        required=needed-grade_table.keys()
        if required:
            raise SystemExit(f"{label} has no independent bound for {sorted(required)}")
    old=d["old132"]["originalDirectionTable"]
    direct_rank=max(old["common"]["coefficientRanksInHOver2Pow128"])
    old_compact=d["old132"]["compactProfile"]
    compact_rank=old_compact["compactChargeInHOver2Pow128"]
    assert direct_rank==48636 and compact_rank==51313
    assert old_compact["motionOfSRetained"] and old_compact["compactIndependentOfL"] and old_compact["compactZeroOnBothSourceCollars"]
    assert 2*(Q(1,2**100)+Q(128,2**32636))<Q(1,100000)
    limits=old_refs["old132"]
    encode=base["ops"]["encode"]
    bound={}
    for label in targ:
        exactW={(k,tuple(q)) for k,q in rows[label]["postSignedCovariance"]}
        exactOld={(k,tuple(q)) for k,q in rows[label]["oldMean"]}
        assert exactOld<=limits.keys()
        result,track=selected({**base,"late":{"demand":{"postSignedCovarianceOrders":sorted(exactW),
                                                          "initialMeanOrdinaryInputOrders":sorted(exactOld)}},
                                "availableCovariance":grade_table,"actualOld":limits,
                                "directRank":direct_rank,"compactRank":compact_rank,
                                "requested":label,"censusOnly":False})
        assert track["W"]==exactW and track["old"]==exactOld
        assert max((sum(j) for j in track["cutoff"]),default=0)<=base["compact"]["cutoff"]["order"]==13
        assert all(not j[2] or (name,(j[0],j[1],0,j[3])) in track["fourier"]
                   for name,j in track["fourier"])
        m=encode(result)
        assert 2*Q(m["totalCoefficientChargeInHOver2Pow128"],2**128)<Q(1,100000)
        m["epsilonAfterFiniteCoefficientDebit"]=str(Q(m["epsilon"])-Q(1,100000))
        bound[label]={"normalizedBound":m,"covarianceSourceRows":sorted(exactW),
                      "initializedSourceRows":sorted(exactOld),"sourceCutoffRZT":sorted(track["cutoff"]),
                      "newCovarianceSourceBindings":[[f,q,added[(f,q)]] for f,q in sorted(exactW&added.keys())],
                      "pairedFourierTrace":[{"originalBranch":name,"RZTL":q,"f":encode(f),"L2f":encode(L2f)}
                                            for (name,q),(f,L2f) in sorted(track["fourier"].items())]}
    used_hashes={h for item in bound.values() for _,_,h in item["newCovarianceSourceBindings"]}
    used_pins={name:h for name,h in applied_pins.items() if h in used_hashes}
    ans={"schema":"MathScope.C132.OriginalTemporalMixedTimeForFiveMap/1",
         "status":"CONDITIONAL_ACTUAL_NATIVE_MIXED_TEMPORAL_NORM",
         "pins":{**out["pins"],**used_pins,"sameOperandCensus":sha256(a.out.read_bytes()).hexdigest()},
         "originalRoots":out["originalRoots"],"normalizedFixedLabelBounds":bound,
         "fourierMethod":"Use C110 pointwise tail on all original value, Z, T and mixed f/L2f pairs. At the fixed label ci is frozen in Z,T and the centered inverse commutes with the native radial shifts.",
         "conditions":"Original joint analytic realization in R,Z,T and native torus, fixed labels, admitted chart and cutoff traces, matching source normalization.",
         "scope":"The output supplies selected quantitative Temporal beta_ZT and/or v_ZT inputs. The fresh integrated FiveMap coefficients use them in a separate product and matrix transfer.",
         "finalJets":0,"release":"HOLD"}
    a.numeric_out.write_bytes((json.dumps(ans,indent=2,sort_keys=True)+"\n").encode())
    for label,item in bound.items():
        print("PASS conditional original norm",label,item["normalizedBound"])
