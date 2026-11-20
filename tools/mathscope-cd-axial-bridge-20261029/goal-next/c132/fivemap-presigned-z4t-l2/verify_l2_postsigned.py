"""Actual transverse second derivative of post-Signed W^+_rz Z^4T."""
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
    "pre":("W","continuation131/fivemap-presigned-z4t-l2/presigned-l2.json",
           "47662e7fe8cb12c9e0e6a8470e5e5bb9e4f99f4e7f1bed74cadeac5d245cd61d"),
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
    guf=need("rz",L2_Z4T)
    assert len(guf)==76 and max(sum(q[:3]) for q in guf)==6 and max(q[3] for q in guf)==3
    assert {q[:3] for q in guf}<=before.keys()|high.keys()
    assert SIGMA<={q[:3] for q in guf}
    first=data["pre"]
    assert first["covarianceCommonLogRankHOver2Pow128"]<2**19
    assert first["pins"]["sealedScheduleSources"]["originalMatrixOrder9"]=="234adcb53fc323ddbce451e2948348f9c3260d1f50cd51c6da7bcb782e0a194d"
    assert first["pins"]["sealedScheduleSources"]["presignedRequirements"]=="ae77202c65b6cc83012badc9029d77b296f12fc82160376d0ce42984542d2f76"
    exact={tuple(x) for x in first["targetGaugeDirections"]}
    assert len(exact)==102 and guf<=exact and POSITIVE_GAUGE_GAPS<=guf
    assert L2_Z4T in {tuple(r["RZTL"]) for r in first["covarianceRows"]}
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
    actual=ns["run_pairs"](a,d,native,{("rz",L2_Z4T)},high)[("rz",L2_Z4T)]
    return {"schema":"MathScope.C131.OriginalPostSignedWrzL2Z4T/1",
            "status":"CONDITIONAL_L2_Z4T_COVARIANCE_ATTACHED",
            "pins":PINS,"source":source,"tensor":"W^+_rz","RZTL":L2_Z4T,
            "actualPairedTrace":actual,"originalGaugeRows":sorted(guf),
            "pairedScope":{"L2GaugeCount":len(guf),"requiredSigmaAllCovered":True,
                "additionalPositiveTPreGauge":sorted(POSITIVE_GAUGE_GAPS),
                "originalPositiveTSigmaDirections":sorted({q[:3] for q in guf if q[2]})},
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
    print(output["status"],len(output["originalGaugeRows"]),output["pairedScope"]["additionalPositiveTPreGauge"])
