"""Bind the protected PostFive mean to its original scalar Repeat phase term."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import importlib.util
import json
from pathlib import Path

PINS = {
    "compact": "4034331b1ab4204a845d197b213e3566a7bc677aa4541f22936e2bc77b89435d",
    "initialized": "b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41",
    "late": "d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef",
    "donors": "8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59",
    "reference": "7f4db7e44f838f60e0ae27e9df8cbdd67fe6c41b154ea2dad11a810399ea079f",
    "geometry": "5087c7c6351028bdfe547bfbea30907f909478986f83fed930519bb473642cd9",
    "source-shape": "cb55ebf668f21fe7dca162576c89449aee985834369dad105592e7a288aa7a35",
    "temporal-call": "5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628",
    "five-call": "22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d",
    "temporal": "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8",
    "mean-operators": "2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76",
    "forced": "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
    "repeat": "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7",
}
STAGE = "primary-forced-join/active-n3-c5-binding"

def read(key, path):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], key
    return raw

def literals(path, key, fragments):
    source = read(key, path).decode()
    for fragment in fragments:
        assert fragment in source, (key, fragment)

def main(a):
    shape = a.runtime / "post-signed-20261023"
    navier = a.runtime / "navier"
    literals(shape/"original-post-signed-source-shape.mjs", "source-shape",
             ("meanVelocity=forced?.mean?.completeBetaVGamma",))
    literals(navier/"source-global-forced-current.mjs", "forced",
             ("completeBetaVGamma:source.mean.stages.moments.velocity",))
    literals(shape/"source-signed-actual-temporal-inverse.mjs", "temporal-call",
             ("const previous=meanVelocity", "G.add(previous[k],potential.velocity[k])"))
    literals(shape/"source-signed-actual-five-map.mjs", "five-call",
             ("previous=temporal.postTemporal.velocity",
              "updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])]))",
              "rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))",
              "increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired}",
              "realizedGamma=De(psi,1)", "globalGraphEqual(G,realizedGamma,gammaDesired"))
    literals(navier/"source-temporal-potential.mjs", "temporal",
             ("beta=G.neg(Dz(psi)),gamma=De(psi,1)", "velocity:{beta,v:deltaV,gamma}"))
    literals(navier/"source-full-mean-equations.mjs", "mean-operators",
             ("Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))",
              "Dz=x=>G.mul(epsilon,G.derivative(x,Z))", "De=(x,e)=>G.add(Dr(x)"))
    literals(shape/"source-postfive-repeat-forced.mjs", "repeat", (
        "G.add(background[j], five.velocity[name])",
        "G.expressionValue(system, initial.reference.values)",
        "C.value(shareMean(root, G.neg(A)", "waves = sharedWaveRows(G, signedWave)",
    ))
    compact = json.loads(read("compact", a.goal/STAGE/"compact-mean-increment/compact-mean.json"))
    late = json.loads(read("late", a.goal/"c105/late-grade/late-grade.json"))
    initialized = json.loads(read("initialized", a.goal/"c108/mode-one-late-mean/late-mode-one-mean.json"))
    donors = json.loads(read("donors", a.goal/"c108/first-k1-energy/k1-donor-join.json"))
    reference = json.loads(read("reference", a.reference))
    source_raw = a.source.read_bytes()
    assert sha256(source_raw).hexdigest()=="83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831"
    source = json.loads(source_raw)
    assert source["sourceNodes"]==22155584
    assert source["sourceSHA256"]=="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
    assert source["nativeSHA256"]=="e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
    nodes = {int(key):row for key,row in source["nodes"].items()}
    native = source["registry"]
    component_rows = compact["componentRows"]
    increments = [[r["sameBaselineRoot"],r["retainedMeanIncrement"],r["latestFiveIncrement"]] for r in component_rows]
    assert increments==[[21374946,22153217,22151963],[21374947,22153219,22151941],[21374948,22153221,22151945]]
    for r,n in zip(component_rows,("beta","v","gamma"),strict=True):
        definition = native["PostSignedFiveBump_"+n]
        application = nodes[r["latestFiveIncrement"]]
        assert application["op"]=="m3_coupled_expression_partial"
        assert application["args"][0]==r["latestFiveNativeSlot"]==definition["id"]
        assert definition["parameters"]==r["sourceArguments"]==application["args"][1]
        assert application["args"][2]==[0,0,0,0]
        final = nodes[r["postFiveRoot"]]
        assert final["op"]=="add"
        assert set(final["args"])=={r["retainedMeanIncrement"], r["signedFullVelocity"]}
        assert definition["body"] in nodes
        assert r["omitBaselineSubtractionDetected"]
    assert donors["pins"]["late"]==PINS["late"] and donors["pins"]["mean"]==PINS["initialized"]
    assert donors["sourceInputs"]["covarianceInputs"]==len(late["premise"]["componentDirections"])==127
    assert Q(donors["conditionalResult"]["covarianceGrade"])>Q(late["premise"]["absoluteEpsilonGrade"])
    assert late["physicalGate"]["targetOriginalATheta"]==donors["sourceInputs"]["latePotentials"]==[22150943,22151952]
    assert late["physicalGate"]["targetOriginalBTheta"]==donors["sourceInputs"]["lateDirectSwirl"]==22154876
    temporal = native["afterActualSigned162_actual_meridional_potential"]
    assert nodes[22150943]["args"]==[temporal["id"], temporal["parameters"], [0]*6]
    assert nodes[22154876]["op"]=="add" and set(nodes[22154876]["args"])=={22150797,22151941}
    assert reference["referenceMap"]["s"]=="s/ratio" and reference["referenceMap"]["Q"]=="ratio*Q"
    assert [reference["reducedEikonalCoefficients"]["Delta_"+x+" n_"+x] for x in ("R","theta","z")]==[1,1,1]

    geometry_path = a.goal/"c107/forced-mode-one-guards/verify_mode_one_guard_geometry.py"
    read("geometry", geometry_path)
    spec = importlib.util.spec_from_file_location("geometry", geometry_path)
    assert spec and spec.loader
    geometry = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(geometry)
    zero = (0,0,0)
    e = Q(1,100000)
    assert [geometry.nth(k,zero) for k in ("KNormalR","KNormalTheta","KNormalZ")]==[
        geometry.cap(b=4,k=1),geometry.cap(b=6,k=1),geometry.cap(b=4,k=1)]
    assert geometry.nth("invR",zero)==geometry.cap(b=1)
    assert geometry.nth("radialFast",zero)==geometry.cap(8,b=3,e=-e,r=1)
    late_rows = {(r["field"],tuple(r["RZTL"])):r for r in late["rawMeanCoefficientRows"]}
    selected = (
        ("A_T",(0,0,0,0)),("A_T",(0,1,0,0)),("A_T",(1,0,0,0)),("A_T",(0,0,0,1)),
        ("A_F",(0,0,0,0)),("A_F",(0,1,0,0)),("A_F",(1,0,0,0)),("B_sum",(0,0,0,0)),
    )
    late_cap = late["rawGate"]
    late_grade=Q(late_cap["grade"])
    assert late_grade==Q(22499,25000)
    band = Q(late_cap["band"])
    cap = late_cap["coefficientChargeInHOver2Pow128"]
    for key in selected:
        row = late_rows[key]
        assert Q(row["epsilon"])>=late_grade and Q(row["band"])<=band
        assert row["totalCoefficientChargeInHOver2Pow128"]<=cap
    initial = {r[0]:r[2] for r in initialized["ordinaryMeanRows"] if r[1]==[0,0,0,0]}
    assert initial.keys()=={"beta","v","gamma"}
    assert min(Q(r["minEpsilon"]) for r in initial.values())>late_grade-e
    assert max(Q(r["bandIntercept"]) for r in initial.values())<=band
    norm = initialized["coefficientRankThroughAllMeanRows"]
    assert norm["whole"]==68834 and norm["uniformGeometryRankPerFactor"]==1024
    assert cap==195678 and band==59

    # Per component, six late gamma terms and one old mean term suffice.
    # n uses at most six envelope factors and covariant gamma uses three.
    # The dyadic transport and ceiling constants, nine total products
    # and the coefficient 8 fit 2^12.
    rank = cap + (6+3)*norm["uniformGeometryRankPerFactor"] + 12
    assert (9*8*4*2*4)<2**12
    before_debit = late_grade-e-Q(1,2)
    assert Q(rank,2**128)+band/Q(2**32636) < e/2
    assert (1-Q(2,2**128))>Q(1,2)
    final = before_debit - e
    assert final == Q(19997,50000)>Q(39,100)
    result = {
        "schema":"MathScope.C122.OriginalProtectedPostFiveMeanTransport/1",
        "status":"VERIFIED_PROTECTED_SOURCE_CONDITIONAL_POSITIVE_PHASE_GRADE",
        "pins":PINS,
        "protectedSource":source["sourceSHA256"],
        "protectedNativeRegistry":source["nativeSHA256"],
        "meanComponentRoots":increments,
        "exactLatePotentials":[22150943,22151952],
        "exactLateDirectSwirl":22154876,
        "lateCovarianceDonors":127,
        "originalCylindricalCurl": ["-epsilon*d_Z(psi_T+psi_F)", "v_T+v_F",
                                  "(d_R+a*L+1/R)(psi_T+psi_F)"],
        "covered":"Value of original mean transport scalar i*m*k*(Delta dot n), with m=1 or 2",
        "capBeforeFinalDebit":{"epsilonGrade":str(before_debit),"bandDegree":str(band),
                               "coefficientRankInHOver2Pow128":rank},
        "epsilonGradeAfterFinalDebit":str(final),
        "scope":["Both own and reference labels are source-admitted in their native brackets.",
                 "The C105/C108 same-source donors and flat/radial whole-path premises hold on both labels.",
                 "S is the maximum of the two original label factors and 1. Both satisfy their original log cap.",
                 "Ordinary pointwise normalized coefficients in the original early slab.",
                 "No independent radial Gaussian assigned to this mean scalar. A separate common-wave donor can be multiplied by this scalar.",
                 "Active Repeat mean function applications, differentiated scalar bounds and the full residual need independent verification."],
        "finalJets":0,
        "release":"HOLD",
    }
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS protected original post-Five mean transport value epsilon grade", final)

if __name__ == "__main__":
    assert __debug__
    p = ArgumentParser(description=__doc__)
    for name in ("goal","runtime","source","reference","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
