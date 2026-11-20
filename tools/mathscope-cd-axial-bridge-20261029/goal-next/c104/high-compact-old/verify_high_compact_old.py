"""Check the full early Temporal and compact donor for the selected high Signed rows."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


STAGE = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
PINS = {
    "upstream": "d7d5d99aa0285e99680f90563b9e27bce8a95877265134165061a7f7745e5cc8",
    "initializedRecipe": "7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "premean": "0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
    "frame": "4552e8b0b8d6d3d850b3e7c03d579ecb5fccb9efbf10df3612a0d86f0200034c",
    "geometry": "f0fffd5c57aec9344487524e27ecefeef53ea91237269ad30b45d97109729650",
    "geometry9": "84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
    "compactProfileProgram": "32e360aa6f7449772151622bc6528681f013eba81cc39a0e7c8e70b529540554",
    "compactSource": "3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102",
}


def pin(name,path):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[name], (name,path)
    return data


def adapt(fn, changes):
    source=inspect.getsource(fn)
    for old,new in changes:
        assert source.count(old)==1,old
        source=source.replace(old,new)
    namespace={}
    exec(compile(source,inspect.getfile(fn),"exec"),fn.__globals__,namespace)
    return namespace[fn.__name__]


def raw_chart(goal,maximum):
    path=goal/STAGE/"native-mean-pressure/verify_mean_pressure_enclosure.py"
    pin("geometry",path)
    high=adapt(runpy.run_path(str(path))["implicit_and_cutoff"],[
        ("assert order == 7","assert 7 <= order <= 12"),
        ("ds[n] = 2 * sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n)",
         "ds[n] = 2 * (int(n==1) + sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n))"),
        ("factorial(7).bit_length()+8","factorial(order).bit_length()+order+1"),
    ])
    baseline=json.loads(pin("geometry9",goal/"c102/mode-one-attachment/mode-one-attachment.json"))
    assert high(9)==baseline["extendedCutoffGeometry"]
    return high(max(9,maximum))


def bound_compact_profile(goal, geometry, checks, high_rows):
    program=goal/"c102/mode-one-attachment/verify_mode_one_attachment.py"
    pin("compactProfileProgram",program)
    source=json.loads(pin("compactSource",goal/STAGE/"after-temporal-five-map/after-temporal-five-map.json"))
    norm=adapt(runpy.run_path(str(program))["compact_budget"],[
        ("assert max(g.values())<256","assert max(g.values())<512"),
        ("max_order=7","max_order=10"),
        ("bell[-1]==877","bell[-1]==115975"),
        ("x in bump)<64","x in bump)<128"),
        ("+7*(5+gs)","+max_order*(5+gs)"),
        ("finite_band_geometry=32","finite_band_geometry=40"),
        ("assert compact_charge<2**16","assert compact_charge<2**17"),
        ('"FaadiBrunoPartitionCountAtSeven"','"FaadiBrunoPartitionCountAtTen"'),
        ('"linearCompactCovarianceUsesOnlyC7":True','"linearCompactCovarianceUsesSameHighC13Source":True'),
    ])
    grade=min(Q(x[-2]) for x in checks)
    surplus=max(Q(x[-1]) for x in checks)
    d={"fiveMap":source,"crop":{"gradeAbsorption":{
        "minimumQuadraticEpsilonByMoment":{"all":str(grade)},
        "maximumQuadraticBandSurplusBeforeAbsorption":{"all":str(surplus)}}}}
    high=max(sum(row["logDegreeRanks"]) for row in high_rows)
    cap=norm(d, high, high, geometry)
    cap["scope"]="C10 scalar compact bump and normalized moment map with the original band degree; qualified by the earlier original complete covariance and live smooth chart inputs."
    cap["conditionalLogCoefficient"]="H/2^111"
    return cap


def main(args):
    upstream=json.loads(pin("upstream",args.goal/"c103/signed-high/signed-high-upstream.json"))
    frame=json.loads(pin("frame",args.frame))
    recipe=args.goal/"c103/initialized-mean/verify_initialized_mean.py"
    pin("initializedRecipe",recipe)
    p=runpy.run_path(str(recipe))
    baseline=args.goal/STAGE/"middle-premean-whole-path/verify_premean_whole_path.py"
    pin("premean",baseline)
    ops=runpy.run_path(str(baseline))
    temporal,collectors=p["whole_recipe"](ops)
    old=sorted((name,(r,z,t,0))
               for name,orders in upstream["orders"]["compactFiveMapOrders"].items()
               for r,z,t in orders)
    donor=[(name,order,temporal(name,order)) for name,order in old]
    moments,linear,branches=p["compact_demand"](old)
    assert max(map(sum,moments["Jtheta"]))==10
    covariance,integrals,cutoffs,inverse=collectors
    checks=[]
    maximum_moment_grade_cost=Q(0)
    for name,a,f,b,g,c,dz,weight in branches:
        left,right=temporal(f,b),temporal(g,c)
        grade=Q(left["minEpsilon"])+Q(right["minEpsilon"])+dz
        surplus=Q(left["bandIntercept"])+Q(right["bandIntercept"])+3*dz-Q(1,2)
        log_cost=Q(2,2**111)+Q(2**15,2**128)+surplus/2**32636
        assert log_cost<(grade-1)/2
        maximum_moment_grade_cost=max(maximum_moment_grade_cost,log_cost)
        checks.append((name,a,f,b,g,c,dz,weight,str(grade),str(surplus)))
    all_covariance=covariance|linear
    max_slow=max(sum(order[:3]) for _,order in all_covariance)
    max_L=max(order[3] for _,order in all_covariance)
    assert max_slow==12 and max_L<=16
    assert {row for row in all_covariance if sum(row[1][:3])>=12}=={
        ("W_rz",(0,12,0,0)),("W_rz",(0,12,0,2))}
    high={row for row in all_covariance if sum(row[1][:3])>7 or row[1][3]>8}
    rank=adapt(p["high_covariance_rows"],[
       ("j<=10 and l<=14","j<=12 and l<=16"),
       ("outer_cost<2**23 and inner_cost<2**54","outer_cost<2**29 and inner_cost<2**66"),
       ("cover.bit_length()+54","cover.bit_length()+66"),
       ("sum(ranks)<2**16","sum(ranks)<2**17"),
       ('"H/2^112"','"H/2^111"'),
    ])
    high_rows=rank(high,frame)
    assert {(x["component"],tuple(x["RZL"])) for x in frame["rows"]} <= {
        (f,(r,z,l)) for f,(r,z,t,l) in high if t==0}
    geometry=raw_chart(args.goal,max(map(sum,cutoffs)))
    assert max(geometry["coefficientLog2Ceilings"].values()) < 512
    coefficient=max(sum(row["logDegreeRanks"]) for row in high_rows)
    assert coefficient + 2**15 < 2**17
    assert maximum_moment_grade_cost < Q(1,2**109)
    profile=bound_compact_profile(args.goal,geometry,checks,high_rows)
    assert min(Q(row["minEpsilon"]) for _,_,row in donor) > Q(9,10)
    sizes={"directOrdinaryMean":len(donor),"primaryCovariance":len(all_covariance),
           "primaryHighCovariance":len(high_rows),"shiftedPrimitives":len(integrals),
           "cutoffOrders":len(cutoffs),"temporalInverseRoles":len(inverse),
           "compactMomentQuadraticBranches":len(checks),
           "maximumSlowCovariance":max_slow,"maximumLCovariance":max_L}
    result={"schema":"MathScope.C104.OriginalEarlyTemporalAndHighCompactFiveMapDonor/1",
            "status":"VERIFIED_DERIVATIVE_RECURRENCE_CONDITIONAL_ON_ORIGINAL_HIGH_COVARIANCE",
            "pins":PINS,"sizes":sizes,"momentMaxZT":{n:max(map(sum,b)) for n,b in moments.items()},
            "meanOrders":donor,"linearMomentCovarianceOrders":sorted(linear),
            "covarianceHighOrders":high_rows,"momentQuadraticBranches":checks,
            "cutoff":geometry,"maximumQuadraticBandAndLogCostUpper":"2^-109",
            "actualCompactProfile":profile,
            "scope":"This attaches the original direct early Temporal derivatives and compact pre-FiveMap moment inputs for the high Sigma requests. It keeps every typed mixed derivative, including radial before optional integration by parts.",
            "open":["Attach complete high original Forced covariance and local stress derivatives to the later pressure formula.",
                    "Apply these compact and direct bounds to the native high pressure coefficient with support, including its signed radial kernel."],
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS high early Temporal and compact source-moment input recurrence",sizes,result["momentMaxZT"])


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","frame","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
