"""Extend the native post-Signed covariance using only independently attached inputs."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

PINS={
    "frontier":("W","continuation129/temporal-velocity-time/frontier.json","d1ee3fa60dc761433c04659ccc73cce9292dc9955560b42f7d424831502b1332"),
    "base":("W","continuation125/post-signed-theta-z-zt/verify_post_signed_theta_z_mixed.py","f62da0739e54918858a7dacd2f29fd25276a2fc215f7213030d6087e375b9e85"),
    "postHigh":("W","continuation128/post-signed-rz-z3t-l2/post-signed-wrz-z3t-l2.json","a120c9485ad1baef7f5b64bbb3573dd93bac76381c8eda155e7e24058dd9e092"),
    "postSwirl":("W","continuation127/late-swirl-complete/complete-covariance.json","c555b0f627542dadc8674967bc4b3064541297a43e65c09e9d175221347d210f"),
    "prePressure":("W","continuation129/late-pressure-wave-inputs/full-covariance-first.json","2390ae40466d65729b448152551281653b2753e237f7c2f666a0a6a4b57857cb"),
    "preSwirl":("W","continuation127/late-swirl-covariance/pre-signed-late-swirl.json","0efb18ed928286bb7a21683dffcc6a6979f5e6008de19f78c52ecf19bca7efe9"),
    "sigmaHigh":("W","continuation128/sigma-high-time/sigma-high-time.json","c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00"),
    "sigmaRRT":("W","continuation127/sigma-rrt/join.json","e59a7141b801536964f6991ff99a38112e4a997cd29a3a25fe3807566fdfec3c"),
    "spatial":("G","c105/late-grade/late-grade.json","d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef"),
    "spatialJoin":("G","c108/first-k1-energy/k1-donor-join.json","8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
    "preStaticOne":("G","c108/forced-mode-one-late/mode-one-late-join.json","3a6c22308f6b76804b05bce58548b6b928e09cb8f6d4fdd1f8a93cc5f176912b"),
    "preStaticTwo":("G","c107/post-signed-gauge/forced-mode-two-late-directions.json","0cf2a4587f2d5c82eaeadb3a0ff0f694961c29b4fd2f047cff509af7a50f5449"),
    "ordinaryAdapter":("W","continuation128/post-signed-rz-z3t/verify_post_signed_wrz_z3t.py","0527a0b75e0f8e90a8927cc60c10cd634272adcba065564af387983c34822253"),
}
ZERO=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
L=(0,0,0,1)
CURL_OFFSETS={"r":(ZERO,Z),"theta":(ZERO,R,Z,L),"z":(ZERO,R,L)}
COMPONENTS={"rr":("r","r"),"rtheta":("r","theta"),"rz":("r","z"),
            "thetatheta":("theta","theta"),"thetaz":("theta","z"),"zz":("z","z")}
REGIONS=("inner","outer","middle")


def load(a):
    d={}
    for key,(root,rel,digest) in PINS.items():
        path=(a.goal if root=="G" else a.work)/rel
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==digest,path
        d[key]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw)
    return d


def roles(rows):
    return {(f,tuple(a)) for f,a in rows}


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def down(a):
    return product(*(range(j+1) for j in a))


def curl_needs(f,a):
    return {plus(p,j) for p in down(a) for q in COMPONENTS[f] for j in CURL_OFFSETS[q]}


def merge_wave_tables(d):
    # The two actual first-wave replays share source/native normalizations.
    # Preserve their numerical gauge rows instead of treating derivative
    # membership alone as a bound.
    pressure,swirl=d["prePressure"],d["preSwirl"]
    assert len(pressure["covarianceRows"])==19 and len(swirl["covarianceRows"])==29
    assert pressure["covarianceCommonLogRankHOver2Pow128"]==357940
    assert swirl["covarianceCommonLogRankHOver2Pow128"]==258240
    gauges={tuple(a) for v in (pressure,swirl) for a in v["targetGaugeDirections"]}
    assert len(gauges)==96
    out={}
    provenance={}
    for area in (*REGIONS,"modeTwo"):
        table={}
        for owner,rec in (("pressure",pressure),("swirl",swirl)):
            if area=="modeTwo":
                rows=rec["modeTwoGauges"]
                field="logRank"
            else:
                rows=rec["threeRegionModeOneGauges"][area]
                field="prefactorLogRankHOver2Pow128"
            for row in rows:
                idx=tuple(row["RZTL"])
                if idx not in table or row[field]<table[idx][field]:
                    table[idx]=row
                    provenance[area,idx]=owner
        assert table.keys()==gauges
        out[area]=list(table.values())
    return {
        "covarianceRows":pressure["covarianceRows"],
        "covarianceCommonLogRankHOver2Pow128":357940,
        "threeRegionModeOneGauges":{r:out[r] for r in REGIONS},
        "modeTwoGauges":out["modeTwo"],
    },gauges,provenance


def late_sigma(base,d):
    prior=base["sigma_hulls"](d["native"])
    higher={}
    for rec,target in ((d["sigmaHigh"],{(0,3,1),(0,4,1),(1,2,1),(1,3,1)}),
                       (d["sigmaRRT"],{(2,0,1)})):
        assert rec["nativeSigmaRoots"]==[22001223,22001224]
        assert rec["actualIncrementalPressureZ"]==22000443
        assert rec["sourceEndpoints"]==[17743711,17743713]
        assert {tuple(x) for x in rec["targetsRZT"]}==target
        cap=rec["common"]
        assert Q(cap["epsilon"])>=1 and cap["gaussian"]=="zeta"
        band,pole,rank=Q(cap["band"]),cap["pole"],cap["logCoefficientUnitsHOver2Pow128"]
        assert band<=Q(137,2) and pole<=54 and rank<2**20
        higher.update({j:(band,pole,rank) for j in target})
    return prior,higher


def run_pairs(a,d,base,targets,sigma_high):
    out={}
    groups={}
    for f,p in targets:
        groups.setdefault(f,set()).add(p)
    adapt=d["adapt"]
    # Same gauge arithmetic and exact directional reciprocal Gaussian
    # recurrence as in the C128 covariance, through ordinary order five.
    gauge_apply=adapt(base["signed_gauge_caps"],[
        ("sigma=sigma_hulls(d)","sigma={**sigma_hulls(d),**higher}"),
        ('reciprocal_gaussians"](3,log_s)','reciprocal_gaussians"](5,log_s)'),
        ("[side][:4]","[side][:6]"),
        ('for x in slow[:4]]==cutoff["cutoffOrdinaryRanks"][:4]',
         'for x in slow[:6]]==cutoff["cutoffOrdinaryRanks"][:6]'),
        ('for x in chi[:4]]==cutoff["transverseRanks"][:4]',
         'for x in chi[:5]]==cutoff["transverseRanks"][:5]'),
        ("degree<=3 and j<=3","degree<=5 and j<=4"),
    ],higher=sigma_high)
    for f,indices in sorted(groups.items()):
        indices=tuple(sorted(indices))
        dirs={p for j in indices for p in down(j)}
        deps={(part,p):sorted({plus(b,off) for b in down(p)
                               for off in CURL_OFFSETS[component]})
              for p in dirs for part,component in enumerate(COMPONENTS[f],1)}
        gauges,sig=gauge_apply(d["native"],a.goal,deps)
        pair=adapt(base["pair_bound"],[
            # Existing pre-covariance target summaries are unnecessary
            # because the full authentic curls are recomputed from gauge legs.
            ("assert set(TARGETS)<=left.keys()","assert len(left)>=18"),
            ('d["pre"]["covarianceCommonLogRankHOver2Pow128"]<2**18',
             'd["pre"]["covarianceCommonLogRankHOver2Pow128"]<2**19'),
            ('table[q]["prefactorLogRankHOver2Pow128"]<2**17',
             'table[q]["prefactorLogRankHOver2Pow128"]<2**18'),
            ("+1<96 and p<=60","+1<112 and p<=72"),
            ("(2**60*factorial(60)).bit_length()<512","(2**72*factorial(72)).bit_length()<1024"),
            ("2**22+512","2**22+1024"),
            ("Q(192,2**32636)","Q(224,2**32636)"),
            ('"unnormalizedBandBeforeDebit":"192","collarPoleBeforeGaussianAbsorption":120',
             '"unnormalizedBandBeforeDebit":"224","collarPoleBeforeGaussianAbsorption":144'),
        ],TARGETS=indices)
        caps=pair(d["native"],deps,gauges)
        for j in indices:
            out[f,j]=caps[str(j)]
    assert out.keys()==targets
    return out


def main(a):
    d=load(a)
    base=d["base"]
    d["native"]=base["load"](a.work,a.goal)
    src=base["bound_sources"](d["native"])
    d["adapt"]=d["ordinaryAdapter"]["adapt"]
    asks=roles(d["frontier"]["combinedPostSignedCovariance"])
    spatial=roles(d["spatial"]["premise"]["componentDirections"])
    assert len(spatial)==d["spatialJoin"]["sourceInputs"]["covarianceInputs"]==127
    assert d["postHigh"]["pairBothWholePathGrade"]=="99999/100000"
    known_wrz={("rz",tuple(d["postHigh"]["RZTL"])),
               ("rz",tuple(d["postHigh"]["originalOrdinaryPartner"]["RZTL"]))}
    prior=asks&(spatial|roles(d["postSwirl"]["requiredCovariance"])|known_wrz)
    assert len(asks)==94 and len(prior)==49
    old_cap,new_cap=late_sigma(base,d)
    pre,pre_gauge,where=merge_wave_tables(d)
    d["native"]["pre"]=pre
    missing={}
    supported=set()
    one={(r,z,0,l) for r,z,l in d["preStaticOne"]["directions"]}
    two={(r,z,0,l) for r,z,l in (item["RZL"] for item in d["preStaticTwo"]["conditionalGaugeRows"])}
    static=one&two
    assert len(static)==79
    for f,j in asks-prior:
        g=curl_needs(f,j)
        sigma={a[:3] for a in g}-(old_cap.keys()|new_cap.keys())
        wave=g-pre_gauge-static
        if sigma or wave:
            missing[f,j]=(sigma,wave)
        else:
            assert g<=pre_gauge
            supported.add((f,j))
    assert len(supported)==37 and len(missing)==8
    sigma_gap={q for s,_ in missing.values() for q in s}
    wave_gap={q for _,p in missing.values() for q in p}
    assert sigma_gap=={(2,1,1)} and len(wave_gap)==9,(sigma_gap,wave_gap)
    assert sum(bool(s) for s,_ in missing.values())==2
    actual=run_pairs(a,d,base,supported,new_cap)
    all_gauge={q for f,j in supported for q in curl_needs(f,j)}
    counts={r:{name:sum(where[r,q]==name for q in all_gauge) for name in ("pressure","swirl")}
            for r in (*REGIONS,"modeTwo")}
    return {"schema":"MathScope.C129.OriginalTemporalVelocityPostSignedCovarianceCoverage/1",
            "status":"CONDITIONAL_86_OF_94_ORIGINAL_POST_SIGNED_ROWS_ATTACHED",
            "source":src,"pins":PINS,
            "candidateCount":len(asks),"previouslyAttached":sorted(prior),
            "newlyAttached":[{"tensor":f,"RZTL":j,"wholePathEpsilonGrade":"99999/100000",
                              "gaugeDirections":sorted(curl_needs(f,j)),
                              "conditionalPairBudget":actual[f,j]} for f,j in sorted(supported)],
            "firstWaveSourceCounts":counts,
            "stillOpen":[{"tensor":f,"RZTL":j,"missingSigmaRZT":sorted(s),"missingPreWaveGaugeRZTL":sorted(w)}
                          for (f,j),(s,w) in sorted(missing.items())],
            "sigmaGap":sorted(sigma_gap),"preWaveGaugeGap":sorted(wave_gap),
            "scope":"Only W+ covariance input attachment on the same original admitted native axis/torus domains, with flat joins, smooth native source realization and positive frame assumptions. The original conservative candidate still needs eight covariance rows and independent old-mean/cutoff/shifted-pressure attachments. No final acceptance is promoted.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","out"):
        p.add_argument("--"+k,type=Path,required=True)
    a=p.parse_args()
    result=main(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],len(result["newlyAttached"]),"new")
