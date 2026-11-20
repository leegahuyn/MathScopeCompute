"""Replay the original eight post-Signed wave covariances selected by Temporal v_ZT."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
from runpy import run_path

PINS={
    "census":("continuation132/temporal-mixed-fivemap/mixed-temporal-census.json","4052d6384b05fef0415ac6e067e0d9db03fe03946fd320bd43110e804a736e69"),
    "base":("continuation129/temporal-postsigned-covariance/verify_temporal_postsigned_covariance.py","f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e"),
    "merge":("continuation130/postsigned-covariance-final/verify_temporal_postsigned_covariance_complete.py","5e4d8d21f827eb8646b8fc2c0ac221c0766924cc3dff97973cf9f0a1f9cc0d05"),
    "pre":("continuation131/fivemap-presigned-high/fivemap-presigned-high.json","6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663"),
    "preExtra":("continuation129/temporal-presigned-extra/full-covariance-first.json","797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac"),
    "supplement":("continuation129/temporal-presigned-extra/temporal-presigned-supplement.json","de68d445e83834814bbc45351979d3839243d746bb4edd546cb624ecdb3d43e0"),
    "l9":("continuation129/temporal-presigned-extra/original-primary-l9.json","12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb"),
    "sigmaR2ZT":("continuation130/sigma-rrzt/join.json","00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3"),
    "matrix9":("continuation131/fivemap-presigned-high/matrix-order9.json","234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d"),
}
TARGETS=({("rtheta",(0,1,1,l)) for l in range(4)}
         |{("rtheta",(1,1,1,l)) for l in (0,2)}
         |{("thetaz",(0,2,1,l)) for l in (0,2)})


def read(root):
    data={}
    for k,(rel,digest) in PINS.items():
        path=root/rel
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==digest,path
        data[k]=run_path(str(path)) if path.suffix==".py" else json.loads(raw)
    return data


def main(a):
    evidence=read(a.work)
    old_census=evidence["census"]
    assert old_census["originalRoots"]=={
        "betaPotential":22150943,"v":22150797,"EthetaCentered":22032006,
        "EzCentered":22032008,"pressureZ":22031648}
    request=old_census["targets"]["v_ZT"]
    assert { (f,tuple(j)) for f,j in request["remainingCovariance"]}==TARGETS
    assert TARGETS<={ (f,tuple(j)) for f,j in request["postSignedCovariance"]}
    assert evidence["supplement"]["pins"]["full"]==PINS["preExtra"][1]
    assert evidence["supplement"]["pins"]["protectedPrimaryL9"]==PINS["l9"][1]
    assert len(evidence["l9"]["sourceRows"])==6
    assert evidence["pre"]["pins"]["sealedScheduleSources"]["originalMatrixOrder9"]==PINS["matrix9"][1]
    matrix=evidence["matrix9"]
    assert (matrix["allRZTMatrixAuditCount"],matrix["oldC89ExactPrefixRows"],matrix["maximumSuppliedOrder"])==(816,9,9)
    b=evidence["base"]
    adapter=evidence["merge"]
    d=b["load"](a)
    native=d["base"]
    d["native"]=native["load"](a.work,a.goal)
    source=native["bound_sources"](d["native"])
    lower,higher=b["late_sigma"](native,d)
    sig=evidence["sigmaR2ZT"]
    assert sig["pins"]["l9"]==PINS["l9"][1] and sig["pins"]["supplement"]==PINS["supplement"][1]
    assert sig["pins"]["additionalPreSigned"]==PINS["preExtra"][1]
    higher[adapter["SIGMA"]]=adapter["attach_sigma"](sig)
    combined,_,_=b["merge_wave_tables"](d)
    combined,_=adapter["merge"](combined,evidence["preExtra"],b["REGIONS"])
    combined,valid_gauges=adapter["merge"](combined,evidence["pre"],b["REGIONS"])
    d["native"]["pre"]=combined
    d["adapt"]=d["ordinaryAdapter"]["adapt"]
    support={}
    for f,j in TARGETS:
        needs=b["curl_needs"](f,j)
        fluxes={q[:3] for q in needs}
        assert needs<=valid_gauges,(f,j,needs-valid_gauges)
        assert fluxes<=lower.keys()|higher.keys(),(f,j,fluxes-lower.keys()-higher.keys())
        support[f,j]=(sorted(needs),sorted(q for q in fluxes if q[2]))
    assert {len(gauges) for gauges,_ in support.values()}=={14,20,24,34,44,48,56}
    paired=adapter["pair_adapter"](b)(a,d,native,TARGETS,higher)
    assert paired.keys()==TARGETS
    return {"schema":"MathScope.C132.OriginalPostSignedCovarianceForVZT/1",
            "status":"CONDITIONAL_EIGHT_ORIGINAL_POSTSIGNED_COVARIANCE_ROWS",
            "pins":PINS,"source":source,"bodyRoots":old_census["originalRoots"],
            "targets":[{"tensor":f,"RZTL":j,"wholePathEpsilonGrade":"99999/100000",
                        "originalGaugeDirections":support[f,j][0],"originalPositiveTSigmaDirections":support[f,j][1],
                        "conditionalPairBudget":paired[f,j]} for f,j in sorted(TARGETS)],
            "scope":"Original fixed-label native frames, ordinary Fourier realization and smooth chart/support premises. The eight rows are the additional original post-Signed tensors used by selected Temporal v_ZT.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    output=main(a)
    a.out.write_bytes((json.dumps(output,indent=2)+"\n").encode())
    print(output["status"],len(output["targets"]))
