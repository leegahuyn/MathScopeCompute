"""Attach the original high early compact mean donor to all mode-one source requests."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


STAGE=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS={
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "modeOne":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "oldCompact":"688fe9703a420a7273b155411faca397169ea590c83e06310578efde40a7f2df",
    "earlyMean":"7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return raw


def main(a):
    frame=json.loads(pin("frame",a.frame))
    raw=json.loads(pin("modeOne",a.goal/"c105/forced-mode-one-high/mode-one-high-dependencies.json"))
    assert frame["pins"]["dependencies"]==PINS["modeOne"]
    compact_path=a.goal/"c104/high-compact-old/verify_high_compact_old.py"
    mean_path=a.goal/"c103/initialized-mean/verify_initialized_mean.py"
    premean_path=a.goal/STAGE/"middle-premean-whole-path/verify_premean_whole_path.py"
    pin("oldCompact",compact_path)
    pin("earlyMean",mean_path)
    pin("premean",premean_path)
    compact=runpy.run_path(str(compact_path))
    mean=runpy.run_path(str(mean_path))
    row,providers=mean["whole_recipe"](runpy.run_path(str(premean_path)))
    names=mean["NAMES"]
    queries=sorted({(names[i],(r,z,0,l)) for _,i,(r,z,l) in raw["meanDemands"]})
    ordinary=[(name,b,row(name,b)) for name,b in queries]
    moments,linear,branches=mean["compact_demand"](queries)
    grades=[]
    for name,b,f,c,g,d,axial,multiplicity in branches:
        u,v=row(f,c),row(g,d)
        minimum=Q(u["minEpsilon"])+Q(v["minEpsilon"])+axial
        band=Q(u["bandIntercept"])+Q(v["bandIntercept"])+3*axial-Q(1,2)
        assert Q(2,2**111)+Q(2**15,2**128)+band/2**32636 < (minimum-1)/2
        grades.append((name,b,f,c,g,d,axial,multiplicity,str(minimum),str(band)))
    W,integral,cutoff,inverse=providers
    used=W|linear
    high={r for r in used if sum(r[1][:3])>7 or r[1][3]>8}
    caps=frame["higherCovarianceRows"]
    assert high=={(x["component"],tuple(x["RZTL"])) for x in caps}
    assert len(high)==335 and len(used)==1213
    cutoff_order=max(map(sum,cutoff))
    assert cutoff_order<=16,cutoff_order
    geometry_code=inspect.getsource(compact["raw_chart"])
    assert geometry_code.count("assert 7 <= order <= 12")==1
    geometry_scope={}
    exec(compile(geometry_code.replace("assert 7 <= order <= 12","assert 7 <= order <= 16"),
                 str(compact_path),"exec"),compact["raw_chart"].__globals__,geometry_scope)
    geometry=geometry_scope["raw_chart"](a.goal,cutoff_order)
    assert max(geometry["coefficientLog2Ceilings"].values())<512
    norm=compact["bound_compact_profile"]
    code=inspect.getsource(norm)
    for old,new in [
        ('"max_order=10"','"max_order=11"'),("bell[-1]==115975","bell[-1]==678570"),
        ('"finite_band_geometry=40"','"finite_band_geometry=42"'),
        ("PartitionCountAtTen","PartitionCountAtEleven"),
    ]:
        assert code.count(old)==1,old
        code=code.replace(old,new)
    namespace={}
    exec(compile(code,str(compact_path),"exec"),norm.__globals__,namespace)
    profile=namespace["bound_compact_profile"](a.goal,geometry,grades,caps)
    profile["scope"]="Order eleven on the original compact support and same shifted-path half Gaussian."
    peak={key:max(map(sum,value)) for key,value in moments.items()}
    assert peak=={"P":10,"Jz":10,"Jtheta":11}
    assert min(Q(r["minEpsilon"])for _,_,r in ordinary)>Q(9,10)
    report={"schema":"MathScope.C106.HighOriginalModeOneOrdinaryMeanDonor/1",
            "status":"VERIFIED_RECURRENCE_CONDITIONAL_ON_ORIGINAL_C15_COVARIANCE",
            "pins":PINS,"ordinaryMeanRequests":len(ordinary),"primaryRoles":len(used),
            "highPrimaryRoles":len(high),"shiftedPrimitives":len(integral),"inverseRoles":len(inverse),
            "cutoff":geometry,"compactMomentMaximumZT":peak,
            "quadraticMomentProductCount":len(grades),"coefficientProfile":profile,
            "ordinaryRows":ordinary,"quadraticMomentRows":grades,
            "open":["Apply actual high mean and source coefficients to the original Forced mode-one eikonal regrouping, both Gaussian collars, and full early Signed source."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("PASS true mode-one upstream 273 ordinary rows, 335 high slots and original compact C11",
          len(grades),profile["compactChargeInHOver2Pow128"])


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","frame","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
