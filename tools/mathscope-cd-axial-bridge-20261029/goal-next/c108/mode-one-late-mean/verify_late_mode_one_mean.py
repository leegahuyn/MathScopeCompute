"""Attach actual Primary and initialized-mean coefficients to the union of mode-one demands."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


STAGE=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS={
    "late":"e89da4c0b6bd3ef944c823849969e75a896fd712f32dc1c60136ddc690e90eca",
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "oldCompact":"00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884",
    "compactProgram":"655b0713311f1144068a2a2b4b6835b517901e30fc9ce45fd1e603bc2e9db8af",
    "earlyMean":"7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "premean":"0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return raw


def main(a):
    root=a.goal
    late=json.loads(pin("late",root/"c107/post-signed-gauge/mode-one-late-dependencies.json"))
    frame=json.loads(pin("frame",root/"c106/frame15/frame-c15.json"))
    old=json.loads(pin("oldCompact",root/"c106/high-compact-mode-one/compact-mode-one-c15.json"))
    early=root/"c103/initialized-mean/verify_initialized_mean.py"
    premean=root/STAGE/"middle-premean-whole-path/verify_premean_whole_path.py"
    compact_program=root/"c106/high-compact-mode-one/verify_compact_mode_one_c15.py"
    pin("earlyMean",early)
    pin("premean",premean)
    pin("compactProgram",compact_program)
    initialized=runpy.run_path(str(early))
    row,(W,integ,cutoff,inverse)=initialized["whole_recipe"](runpy.run_path(str(premean)))
    query=[(m,tuple(x)) for m,x in late["ordinaryMeanDirections"]]
    direct=[(m,x,row(m,x)) for m,x in query]
    moments,linear,products=initialized["compact_demand"](query)
    grades=[]
    for k,d,f,x,g,y,eps,mu in products:
        a1,a2=row(f,x),row(g,y)
        grade=Q(a1["minEpsilon"])+Q(a2["minEpsilon"])+eps
        band=Q(a1["bandIntercept"])+Q(a2["bandIntercept"])+3*eps-Q(1,2)
        assert Q(2,2**111)+Q(2**15,2**128)+band/2**32636<(grade-1)/2
        grades.append((k,d,f,x,g,y,eps,mu,str(grade),str(band)))
    assert json.loads(json.dumps(grades))==old["quadraticMomentRows"]
    assert max(map(sum,cutoff))<=old["cutoff"]["order"]
    all_cov=W|linear
    high={x for x in all_cov if sum(x[1][:3])>7 or x[1][3]>8}
    old_high={(r["component"],tuple(r["RZTL"])) for r in frame["higherCovarianceRows"]}
    new=high-old_high
    assert new=={(m,tuple(d)) for m,d in late["newHighPrimaryDirections"]} and len(new)==37
    fn=initialized["high_covariance_rows"]
    code=inspect.getsource(fn)
    for old_text,new_text in [
        ("j<=10 and l<=14","j<=14 and l<=18"),
        ("outer_cost<2**23 and inner_cost<2**54","outer_cost<2**44 and inner_cost<2**88"),
        ("cover.bit_length()+54","cover.bit_length()+88"),
        ("sum(ranks)<2**16","sum(ranks)<2**17"),
        ('"H/2^112"','"H/2^111"'),
    ]:
        assert code.count(old_text)==1,old_text
        code=code.replace(old_text,new_text)
    scope={}
    exec(compile(code,str(early),"exec"),fn.__globals__,scope)
    attached=scope["high_covariance_rows"](high,{"primaryUniformLogRanks":frame["uniformLogRanks"]})
    assert [r for r in json.loads(json.dumps(attached))
            if (r["component"],tuple(r["RZTL"])) in old_high]==frame["higherCovarianceRows"]
    assert (len(direct),len(all_cov),len(high),len(attached))==(432,1499,372,372)
    grades_by_name={name:str(min(Q(r["minEpsilon"]) for n,_,r in direct if n==name))
                    for name in initialized["NAMES"]}
    assert min(map(Q,grades_by_name.values()))>Q(9,10)
    maximum_covariance_rank=max(sum(r["logDegreeRanks"]) for r in attached)
    geometry_bits=max(old["cutoff"]["coefficientLog2Ceilings"].values())
    assert geometry_bits<512
    maximum_geometry_exponent=max(r["geometryPower"] for _,_,r in direct)
    maximum_direct_mass_rank=max(Q(r["coefficientMass"]).__ceil__().bit_length() for _,_,r in direct)
    # Common original radial weights use a single Bnorm rank per charge.
    # The original normalized cutoffs use at most 512 integer bits plus
    # the radial scale. Pay a common 1024-bit charge per geometry slot.
    direct_charge=maximum_covariance_rank+1024*maximum_geometry_exponent+maximum_direct_mass_rank
    compact_charge=old["coefficientProfile"]["compactChargeInHOver2Pow128"]
    whole_mean_charge=max(direct_charge,compact_charge)+1
    assert whole_mean_charge<90000
    result={"schema":"MathScope.C108.OriginalLateModeOneExistingFrameAttachment/1",
            "status":"VERIFIED_SOURCE_RECIPE_CONDITIONAL_C106_NATIVE_CHARTS",
            "pins":PINS,"ordinaryMeanRows":direct,"directionCounts":{"mean":432,"allPrimary":1499,"highPrimary":372,"newHighPrimary":37},
            "newHighPrimaryCoefficients":[r for r in attached if (r["component"],tuple(r["RZTL"])) in new],
            "sameCompactProfileAsC106":old["coefficientProfile"],"sameCompactMomentRows":len(grades),
            "compactMomentMaximumZT":{m:max(map(sum,ds)) for m,ds in moments.items()},
            "minimumSourceEpsilonGrades":grades_by_name,
            "coefficientRankThroughAllMeanRows":{"nativeCovariance":maximum_covariance_rank,
              "ordinaryGeometryExponent":maximum_geometry_exponent,"ordinaryCoefficientMass":maximum_direct_mass_rank,
              "uniformGeometryRankPerFactor":1024,"direct":direct_charge,"compact":compact_charge,
              "whole":whole_mean_charge,"logNormUnit":"H/2^128"},
            "sourceShiftedPrimitiveCount":len(integ),"cutoffDirectionCount":len(cutoff),"originalInverseRoleCount":len(inverse),
            "scope":"Same source cutoffs and Primary frame; new directions introduce no new pure slow maximum. Input common normalized waves and same full admitted shifted paths remain the source conditions.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS 37 new high Primary roles, no new compact moment derivative",
          "minimum component grades",grades_by_name,"whole coefficient rank",whole_mean_charge)


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
