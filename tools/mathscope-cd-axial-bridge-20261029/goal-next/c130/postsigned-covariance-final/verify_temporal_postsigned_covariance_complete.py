"""Close the remaining original post-Signed covariance requests against fresh input receipts."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy
from types import FunctionType

PATH="continuation129/temporal-postsigned-covariance/"
PINS={
    "base":(PATH+"verify_temporal_postsigned_covariance.py",
            "f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e"),
    "coverage":(PATH+"temporal-postsigned-covariance.json",
                "97c245a1f59d1d35af8f843e6983be14aa3a0e3e58816bbe3f1171f0d590352d"),
    "supplement":("continuation129/temporal-presigned-extra/temporal-presigned-supplement.json",
                   "de68d445e83834814bbc45351979d3839243d746bb4edd546cb624ecdb3d43e0"),
    "nativeL9":("continuation129/temporal-presigned-extra/original-primary-l9.json",
                 "12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb"),
}
SIGMA=(2,1,1)


def read(path,digest):
    content=path.read_bytes()
    assert sha256(content).hexdigest()==digest,path
    return json.loads(content) if path.suffix==".json" else content


def merge(old,extra,regions):
    result={
        "covarianceRows":extra["covarianceRows"],
        "covarianceCommonLogRankHOver2Pow128":max(old["covarianceCommonLogRankHOver2Pow128"],
                                                extra["covarianceCommonLogRankHOver2Pow128"]),
        "threeRegionModeOneGauges":{},
    }
    for region in regions:
        rows={tuple(row["RZTL"]):row for row in old["threeRegionModeOneGauges"][region]}
        rows.update({tuple(row["RZTL"]):row for row in extra["threeRegionModeOneGauges"][region]})
        result["threeRegionModeOneGauges"][region]=list(rows.values())
    rows={tuple(row["RZTL"]):row for row in old["modeTwoGauges"]}
    rows.update({tuple(row["RZTL"]):row for row in extra["modeTwoGauges"]})
    result["modeTwoGauges"]=list(rows.values())
    assert result["covarianceCommonLogRankHOver2Pow128"]<2**19
    return result,set(rows)


def attach_sigma(doc):
    assert doc["nativeSigmaRoots"]==[22001223,22001224]
    assert doc["actualIncrementalPressureZ"]==22000443
    assert doc["sourceEndpoints"]==[17743711,17743713]
    assert doc["targetsRZT"]==[list(SIGMA)]
    cap=doc["common"]
    assert Q(cap["epsilon"])>=1 and cap["gaussian"]=="zeta"
    s,p,c=Q(cap["band"]),cap["pole"],cap["logCoefficientUnitsHOver2Pow128"]
    assert s<=Q(137,2) and p<=54 and c<2**20
    return (s,p,c)


def pair_adapter(module):
    fn=module["run_pairs"]
    text=inspect.getsource(fn)
    for old,new in (
        ('for x in chi[:5]]==cutoff["transverseRanks"][:5]',
         'for x in chi[:6]]==cutoff["transverseRanks"][:6]'),
        ('"degree<=5 and j<=4"','"degree<=5 and j<=5"'),
    ):
        # The first is a source-string operand inside run_pairs.
        assert text.count(old)==1,old
        text=text.replace(old,new)
    results={}
    env=fn.__globals__
    exec(compile(text,inspect.getfile(fn),"exec"),env,results)
    return FunctionType(results["run_pairs"].__code__,env)


def main(a):
    paths={name:a.work/rel for name,(rel,_) in PINS.items()}
    evidence={name:read(paths[name],digest) for name,(_,digest) in PINS.items()}
    coverage=evidence["coverage"]
    open_rows={(row["tensor"],tuple(row["RZTL"])) for row in coverage["stillOpen"]}
    open_sigma={(row["tensor"],tuple(row["RZTL"])) for row in coverage["stillOpen"] if row["missingSigmaRZT"]}
    assert len(open_rows)==8 and len(open_sigma)==2
    if not a.pre:
        assert not any((a.pre_sha,a.sigma,a.sigma_sha))
        return {"schema":"MathScope.C130.OriginalTemporalPostSignedCovarianceComplete/1",
                "status":"OPEN_WAITING_FOR_ACTUAL_SUPPLEMENTAL_WAVE_CAPS",
                "openRows":sorted(open_rows),"finalJets":0,"release":"HOLD"}
    assert a.pre_sha=="797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac"
    assert evidence["supplement"]["pins"]["full"]==a.pre_sha
    assert evidence["supplement"]["pins"]["protectedPrimaryL9"]==PINS["nativeL9"][1]
    assert len(evidence["nativeL9"]["sourceRows"])==6
    supplement=read(a.pre,a.pre_sha)
    module=runpy.run_path(str(paths["base"]))
    d=module["load"](a)
    original=d["base"]
    d["native"]=original["load"](a.work,a.goal)
    source=original["bound_sources"](d["native"])
    assert source==coverage["source"]
    d["adapt"]=d["ordinaryAdapter"]["adapt"]
    old_sigma,higher=module["late_sigma"](original,d)
    established,_,_=module["merge_wave_tables"](d)
    d["native"]["pre"],gauge=merge(established,supplement,module["REGIONS"])
    for row in coverage["stillOpen"]:
        assert {tuple(q) for q in row["missingPreWaveGaugeRZTL"]}<=gauge
    if a.sigma:
        assert a.sigma_sha=="00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3"
        actual_sigma=read(a.sigma,a.sigma_sha)
        assert actual_sigma["pins"]["l9"]==PINS["nativeL9"][1]
        assert actual_sigma["pins"]["supplement"]==PINS["supplement"][1]
        assert actual_sigma["pins"]["additionalPreSigned"]==a.pre_sha
        higher[SIGMA]=attach_sigma(actual_sigma)
        targets=open_rows
        status="CONDITIONAL_ALL_94_ORIGINAL_POST_SIGNED_COVARIANCE_ROWS"
    else:
        assert not a.sigma_sha
        targets=open_rows-open_sigma
        status="CONDITIONAL_92_OF_94_ORIGINAL_POST_SIGNED_COVARIANCE_ROWS"
    for tensor,idx in targets:
        needs=module["curl_needs"](tensor,idx)
        assert needs<=gauge
        assert {q[:3] for q in needs}<=(old_sigma.keys()|higher.keys())
    paired=pair_adapter(module)(a,d,original,targets,higher)
    assert len(paired)==len(targets)
    return {"schema":"MathScope.C130.OriginalTemporalPostSignedCovarianceComplete/1",
            "status":status,"pins":{**PINS,"auxiliaryPre":a.pre_sha,"additionalSigma":a.sigma_sha},
            "source":source,"alreadyAttached":86,"completeCount":86+len(targets),
            "newlyAttached":[{"tensor":f,"RZTL":j,"wholePathEpsilonGrade":"99999/100000",
                              "conditionalPairBudget":paired[f,j]} for f,j in sorted(targets)],
            "stillOpen":sorted(open_rows-targets),
            "scope":"Completes only the paired covariance terms under the original admitted analytic source premises. The independent cutoff, shifted pressure, old mean, native A_T and subsequent FiveMap stitches remain relevant.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","out"):
        p.add_argument("--"+k,type=Path,required=True)
    for k in ("pre","sigma"):
        p.add_argument("--"+k,type=Path)
        p.add_argument("--"+k+"-sha")
    a=p.parse_args()
    output=main(a)
    a.out.write_bytes((json.dumps(output,indent=2)+"\n").encode())
    print(output["status"],len(output.get("newlyAttached",[])))
