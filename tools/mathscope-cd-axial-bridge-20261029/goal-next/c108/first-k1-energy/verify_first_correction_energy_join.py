"""Bind the three native first-correction energy pieces and replay their common allowance."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys


BASE=Path("primary-forced-join/active-n3-c5-binding")
FORCED=BASE/"first-wave-guard-traces/first-forced-budget"
PINS={
    "ingress":"20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f",
    "registry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "manifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "stream":"faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96",
    "reader":"2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb",
    "cache":"909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f",
    "assembly":"ca387b2c61daf45fbd0473f5fa297aae0442b2349272a8ae959f2af5082c401f",
    "summation":"67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450",
    "oldModeOperands":"dfc5401fc6561138e3a17fc05d2e38626b2694d96a1848e0008c9e821b958b40",
    "forcedInner":"eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8",
    "forcedMiddle":"b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8",
    "forcedOuter":"a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd",
    "signed":"c68fe265e3eecc53fd91963eb175d529da6cafda7775c6d5aaf09dee406b97da",
    "late":"d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef",
}


def pin(name,path):
    content=path.read_bytes()
    assert sha256(content).hexdigest()==PINS[name],(name,path)
    return content


def source(a):
    code=pin("assembly",a.goal/BASE/"spatial-stage1/stage1_spatial_ingress.mjs").decode()
    summation=pin("summation",a.goal/"final67/correction-jet-composition/pinned-source/source-final-summation.mjs").decode()
    for part in ("template.forced.map(({m, mapped})",
                 "positive.push({m: 1, real: [G.zero, G.zero, G.zero]",
                 "imaginary: signedRow.potential.map(root => G.mul(G.q(1, 2), fixed(root)))",
                 "const A = wave.indexed.map(({root}, j) => j === 1 ? G.add(root, ...meanPotentials) : root)",
                 "const directSwirl = G.add(...azimuthalSwirls)",
                 "assert.equal(guarded.zeroBeforeSingularBodyEvaluation, true)"):
        assert part in code
    for part in ("potential=row.A.map(v=>G.mul(c,v)),directB=row.B.map(v=>G.mul(c,v))",
                 "velocity=vadd(G,curl(G,potential,xyz),directB),commutator=cross(G,dc,row.A)",
                 "decomposed=vadd(G,row.velocity.map(v=>G.mul(c,v)),commutator)"):
        assert part in summation

    ingress=json.loads(pin("ingress",a.artifact.parent/"first-correction-spatial-ingress.json"))
    manifest=json.loads(pin("manifest",a.artifact/"original-source-export-manifest.json"))
    reader=a.goal/BASE/"spatial-readback/source_stream.py"
    cache=a.goal/BASE/"live-wave-gauge/signed/source_cache.py"
    pin("reader",reader)
    pin("cache",cache)
    sys.path[:0]=[str(reader.parent),str(cache.parent)]
    import source_stream
    import source_cache
    registry=source_stream.Native(a.artifact,manifest)
    assert registry.pin==PINS["registry"]
    g=source_cache.load(source_stream,a.artifact,manifest,22153782,a.cache)
    try:
        assert g.verify["sha256"]==PINS["stream"] and g.verify["nodes"]==22155584
        wave=ingress["wave"]
        template={row["key"]:row for row in wave["perTemplate"]}
        assert len(template)==10 and Counter(row["sign"] for row in template.values())=={-1:5,1:5}
        assert wave["sameExistingForceAndSignedRowMaps"]==162
        for row in template.values():
            positive=row["potential"]
            assert [x["m"] for x in positive]==[1,2,1]
            assert positive[2]["real"]==[0,0,0]
            assert all(len(x["real"])==len(x["imaginary"])==3 for x in positive)
        wave_A=[row["root"] for row in wave["indexed"]]
        assert wave_A==[22154865,22154866,22154867]
        assert g.args(22154868,"add")==[22150943,22154866]
        assert g.args(22154869,"add")==[22151952,22154868]
        assert g.args(22154876,"add")==[22150797,22151941]
        assert ingress["input"]["meanPotentials"]==[22150943,22151952]
        assert ingress["input"]["azimuthalSwirls"]==[22150797,22151941]
        assert ingress["normalizedRoots"]["A"]==[22154865,22154869,22154867]
    finally:
        g.__exit__(None,None,None)
    return ingress


def energy(a,ingress):
    path=a.goal/"final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-localized-gram/actual/actual-mode-operands-final.json"
    old=json.loads(pin("oldModeOperands",path))
    assert old["liveOperands"]["A"]==ingress["normalizedRoots"]["A"]
    assert old["liveOperands"]["U"]==ingress["normalizedRoots"]["U"]
    assert old["liveOperands"]["sameOuterRowsPerComponent"]==162
    data={}
    for name,relative in (("forcedInner","inner-physical-gauge/inner-forced-energy-slice.json"),
                         ("forcedMiddle","middle-covariance/frame/middle-frame-budget.json"),
                         ("forcedOuter","outer-physical-gauge/outer-forced-energy-slice.json")):
        data[name]=json.loads(pin(name,a.goal/FORCED/relative))
    assert data["forcedInner"]["conditionalPhysicalEnergyComparison"]["conditionalInnerEnergyRatioStrictUpper"]=="2^-32"
    assert data["forcedMiddle"]["middleCrossGuardAndConditionalEnergy"]["conditionalMiddleEnergyRatioStrictUpper"]=="2^-32"
    assert data["forcedMiddle"]["middleCrossGuardAndConditionalEnergy"]["conditionalThreePieceEnergyRatioStrictUpper"]=="2^-30"
    assert "S_R < 2^-32" in data["forcedOuter"]["firstStagePotentialSlice"]["conditionalOriginalLocalForceEnergyRatio"]
    signed=json.loads(pin("signed",a.goal/"c102/signed-sigma/signed-sigma.json"))
    late=json.loads(pin("late",a.goal/"c105/late-grade/late-grade.json"))
    assert signed["conditionalSignedSliceRelativeEnergy"]=="<2^-32"
    assert late["physicalGate"]["conditionalLateSliceEnergyRatioUpper"]=="<2^-32"
    assert late["physicalGate"]["targetOriginalATheta"]==ingress["input"]["meanPotentials"]
    assert late["physicalGate"]["targetOriginalBTheta"]==ingress["input"]["directSwirl"]
    assert Q(3,2**32)<Q(1,2**30)
    assert (Q(1,2**15)+2*Q(1,2**16))**2==Q(1,2**28)<Q(1,2**26)
    return {"threeSourceNormAllocations":{"forced":"2^-30","signed":"2^-32","late":"2^-32"},
            "strictFirstStageEnergyRatioUpper":"2^-28","allocatedFirstStageThreshold":"2^-26",
            "productRule":"Every piece uses the same original scalar localization T=C*kappa_1 before curl and the same norm; the term grad(T) cross A remains.",
            "scope":"Conditional simultaneous same-field bounds on the full admitted paths and all original guards/seams. This certifies only the first stage, not the later stages or a release decision."}


def main(a):
    ingress=source(a)
    result={"schema":"MathScope.C108.OriginalFirstCorrectionSourceEnergyJoin/1",
            "status":"VERIFIED_ORIGINAL_ADDITIVE_BINDING_CONDITIONAL_COMMON_ENERGY_NORMS",
            "pins":PINS,"nativeNodeCount":22155584,
            "groups":{"forcedModes":[1,2],"signedMode":1,"latePotentials":[22150943,22151952],"directSwirl":22154876},
            "energy":energy(a,ingress),"firstCorrectionWhole":"CONDITIONAL",
            "open":["Independent complete live same-field bounds, actual seam and label transport if not present in the analytic donors.",
                    "Stages two through four and full N7-06, all N8 comparisons and final jets."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS exact source first correction composition and common conditional energy 2^-28")


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","artifact","cache","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
