"""Original post-Signed W^+_rz Z^4T and auxiliary coverage on the native torus."""
import argparse
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

PINS={
    "base":("W","continuation129/temporal-postsigned-covariance/verify_temporal_postsigned_covariance.py",
            "f5e9c04c043ff9cde04c45245f6278a147951a67471026e1155c4d80395c0c7e"),
    "pre":("W","continuation131/fivemap-presigned-high/fivemap-presigned-high.json",
           "6e1ad88c52194da61728f1985e2c0502b0008d62b4cc17543fa99089f8a2c663"),
    "preAux":("W","continuation129/temporal-presigned-extra/full-covariance-first.json",
              "797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac"),
    "preStaticOne":("G","c108/forced-mode-one-late/mode-one-late-join.json",
                    "3a6c22308f6b76804b05bce58548b6b928e09cb8f6d4fdd1f8a93cc5f176912b"),
    "preStaticTwo":("G","c107/post-signed-gauge/forced-mode-two-late-directions.json",
                    "0cf2a4587f2d5c82eaeadb3a0ff0f694961c29b4fd2f047cff509af7a50f5449"),
    "sigma":("W","continuation131/high-sigma-join/join.json",
             "0018ec189d12d57e0d621b8e4dc4da9c67b2bfad3a57e9e09b9b28e969042297"),
}
Z4T=(0,4,1,0)
L2_Z4T=(0,4,1,2)
SIGMA={(0,5,1),(1,4,1)}
POSITIVE_GAUGE_GAPS={(0,4,1,3),(0,5,1,2),(1,4,1,2)}


def read(a):
    table={}
    for key,(root,name,want) in PINS.items():
        path=(a.work if root=="W" else a.goal)/name
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==want,path
        table[key]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw)
    return table


def sigma_cap(source):
    assert source["nativeSigmaRoots"]==[22001223,22001224]
    assert source["actualIncrementalPressureZ"]==22000443
    assert source["sourceEndpoints"]==[17743711,17743713]
    assert {tuple(x) for x in source["targetsRZT"]}==SIGMA
    row=source["common"]
    assert row["epsilon"]=="1" and row["gaussian"]=="zeta"
    band,pole,rank=Q(row["band"]),row["pole"],row["logCoefficientUnitsHOver2Pow128"]
    assert (band,pole,rank)==(Q(131,2),45,1048870)
    return {g:(band,pole,rank) for g in SIGMA}


def main(a):
    data=read(a)
    b=data["base"]
    d=b["load"](a)
    native=d["base"]
    d["native"]=native["load"](a.work,a.goal)
    source=native["bound_sources"](d["native"])
    before,high=b["late_sigma"](native,d)
    high.update(sigma_cap(data["sigma"]))
    need=b["curl_needs"]
    guf=need("rz",Z4T)
    l2f=need("rz",L2_Z4T)
    assert len(guf)==32 and len(l2f)==76
    assert max(sum(x[:3]) for x in guf)==max(sum(x[:3]) for x in l2f)==6
    assert max(x[3] for x in guf)==1 and max(x[3] for x in l2f)==3
    assert {x[:3] for x in l2f}<=before.keys()|high.keys()
    assert SIGMA<={x[:3] for x in guf}
    first=data["pre"]
    assert first["covarianceCommonLogRankHOver2Pow128"]==358642
    assert first["pins"]["sealedScheduleSources"]["originalMatrixOrder9"]=="234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d"
    exact={tuple(x) for x in first["targetGaugeDirections"]}
    assert guf<=exact
    old_pre,old_dirs,_=b["merge_wave_tables"](d)
    auxiliary=data["preAux"]
    pre=old_dirs|exact|{tuple(x) for x in auxiliary["targetGaugeDirections"]}
    assert len(l2f-pre)==6
    one={(r,z,0,l) for r,z,l in data["preStaticOne"]["directions"]}
    two={(r,z,0,l) for r,z,l in (q["RZL"] for q in data["preStaticTwo"]["conditionalGaugeRows"])}
    gap=l2f-pre-one.intersection(two)
    assert gap==POSITIVE_GAUGE_GAPS
    d["native"]["pre"]=first
    d["adapt"]=d["ordinaryAdapter"]["adapt"]
    replay=b["run_pairs"]
    source_text=__import__("inspect").getsource(replay)
    for old,new in (('reciprocal_gaussians\"](5,log_s)','reciprocal_gaussians\"](6,log_s)'),
                    ('[side][:6]','[side][:7]'),
                    ('for x in slow[:6]]==cutoff["cutoffOrdinaryRanks"][:6]',
                     'for x in slow[:7]]==cutoff["cutoffOrdinaryRanks"][:7]'),
                    ('degree<=5 and j<=4','degree<=6 and j<=4')):
        assert source_text.count(old)==1,old
        source_text=source_text.replace(old,new)
    env=replay.__globals__
    ns={}
    exec(compile(source_text,__import__("inspect").getfile(replay),"exec"),env,ns)
    actual=ns["run_pairs"](a,d,native,{("rz",Z4T)},high)[("rz",Z4T)]
    return {"schema":"MathScope.C131.OriginalPostSignedWrzZ4T/1",
            "status":"CONDITIONAL_ORDINARY_Z4T_COVARIANCE_ATTACHED",
            "pins":PINS,"source":source,"tensor":"W^+_rz","RZTL":Z4T,
            "actualPairedTrace":actual,"originalGaugeRows":sorted(guf),
            "pairedScope":{"L2RZTL":L2_Z4T,"L2GaugeCount":len(l2f),
                "requiredSigmaAllCovered":True,"uncoveredPositiveTPreGauge":sorted(gap),
                "purelyStaticGaugeAlreadyVerified":sorted((l2f-pre)-gap)},
            "wholePathEpsilonGrade":"99999/100000",
            "conditions":"Original complete fixed-label native frames and regular lifts, first-wave source profiles, genuine Signed/Forced and Primary conjugation, and ordinary Fourier and flat support premises.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    output=main(a)
    a.out.write_bytes((json.dumps(output,indent=2)+"\n").encode())
    print(output["status"],len(output["originalGaugeRows"]),output["pairedScope"]["uncoveredPositiveTPreGauge"])
