"""Trace the original high mode-one forcing to its typed initialized-mean rows."""

from argparse import ArgumentParser
from copy import deepcopy
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
STAGE = BAND / "first-forced-budget"
PINS = {
    "gaugeDemand": "f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "raw": "842cbd054f9bbe6dca985a2cdfc1222aa76f951cb473af1756f0213267fc9cf5",
    "initialized": "7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe",
    "premean": "0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f",
}
NAMES = ("beta","v","gamma")


def pin(name,path):
    body=path.read_bytes()
    assert sha256(body).hexdigest()==PINS[name],(name,path)
    return body


def source_dependencies(args,directions):
    path=args.goal/STAGE/"outer-weight-comparison/raw-weights/verify_raw_weights.py"
    pin("raw",path)
    mod=runpy.run_path(str(path))
    data={k:mod["load"](args.goal/BAND,k) for k in mod["FILES"]}
    profiles=data["geometry"]["conditionalCoefficientCaps"]["actualCoefficientProfiles"]
    degree=max(r+z for r,z,l in directions)
    assert degree==9
    for row in profiles.values():
        entries=row["envelopesBySlowOrder"]
        assert len(entries)==5 and entries[1:]==[entries[1]]*4
        entries.extend([entries[-1]]*(degree+1-len(entries)))
    normalized=data["primary"]["weightedQuotientLedger"]["bounds"]
    previous={(x["role"],x["components"],x["slowOrder"]):x for x in normalized}
    for base in (r for r in list(normalized) if r["slowOrder"]==7):
        role,components=base["role"],base["components"]
        for j in range(1,8):
            a,b=previous[role,components,j-1],previous[role,components,j]
            assert Q(b["constantSPower"])-Q(a["constantSPower"])==3
            assert b["totalLogPoleAfterG"]-a["totalLogPoleAfterG"]==3
        for j in range(8,12):
            extension=deepcopy(base)
            extension.update(slowOrder=j,constantSPower=str(Q(base["constantSPower"])+3*(j-7)),
                             totalLogPoleAfterG=base["totalLogPoleAfterG"]+3*(j-7))
            normalized.append(extension)

    source=inspect.getsource(mod["assemble"])
    edits=[
        ("    mean,absorption=field_inventory(data)",
         "    mean,absorption=field_inventory(data)\n    missing=set()\n    mean_demands=set()\n    primary_demands=set()"),
        ("            values=mean[c][index]",
         "            mean_demands.add((kind,c,index))\n"
         "            if index not in mean[c]:\n"
         "                missing.add((kind,c,index))\n"
         "                return Q(21,2)+3*(index[0]+index[1]),0\n"
         "            values=mean[c][index]"),
        ("\n        if role=='u':","\n        primary_demands.add((role,total_slow,transverse,base_v))\n        if role=='u':"),
        ("assert total_slow<=7","assert total_slow<=11"),
        ("scalar_budget=scalar_join(data,records,joined)","scalar_budget={}"),
        ("'rawPerDirection':records,","'meanDemands':sorted(mean_demands),'newMeanDemands':sorted(missing),\n"
         "            'primaryDemands':sorted(primary_demands),'rawPerDirection':records,"),
    ]
    for old,new in edits:
        assert source.count(old)==1,old
        source=source.replace(old,new)
    loop="for alpha in alphas:"
    assert source.count(loop)==2
    source=source.replace(loop,"for alpha in sorted(set(alphas)|set(GAUGE)) if mode==1 else alphas:")
    namespace={}
    exec(compile(source,str(path),"exec"),{**mod["assemble"].__globals__,"GAUGE":directions},namespace)
    result=namespace["assemble"](data)
    assert result["termTally"]["mode1RetainedOriginalMonomials"]==2620
    assert result["termTally"]["regroupedHighFrequencyTerms"]==360
    return result


def upstream_mean(args,data):
    recipe=args.goal/"c103/initialized-mean/verify_initialized_mean.py"
    premean=args.goal/STAGE/"middle-premean-whole-path/verify_premean_whole_path.py"
    pin("initialized",recipe)
    pin("premean",premean)
    mod=runpy.run_path(str(recipe))
    temporal,roles=mod["whole_recipe"](runpy.run_path(str(premean)))
    unique={(NAMES[c],(r,z,0,l)) for _,c,(r,z,l) in data["meanDemands"]}
    highest_slow=max(sum(d[:3]) for _,d in unique)
    highest=sorted((name,d) for name,d in unique if sum(d[:3])==highest_slow)
    assert ("beta",(0,10,0,0)) in highest
    for name,d in unique:
        temporal(name,d)
    moments,linear,products=mod["compact_demand"](unique)
    for _,_,left,d,right,e,_,_ in products:
        temporal(left,d)
        temporal(right,e)
    covariance=roles[0]|linear
    peak=max(sum(d[:3]) for _,d in covariance)
    high=sorted((name,d) for name,d in covariance if sum(d[:3])==peak)
    assert 13 <= peak <= 14, (peak,high)
    return {"highestSlowMean":highest,"distinctMeanRows":len(unique),
            "maximumMeanSlowOrder":highest_slow,"sufficientRawPrimaryOrderBeforeFurtherReduction":1+peak,
            "highestSlowPrimaryCovarianceRows":high,"primaryCovarianceRows":len(covariance),
            "preFiveMapMaximumMomentZT":{name:max(map(sum,d)) for name,d in moments.items()},
            "sufficiency":"The complete direct and compact recipes are applied to all mean components. The high rows record sufficient dependencies, including mixed derivatives before further exact integrations by parts."}


def main(a):
    demand=json.loads(pin("gaugeDemand",a.gauge))
    directions=tuple(map(tuple,demand["requests"]))
    data=source_dependencies(a,directions)
    result={"schema":"MathScope.C105.NativeModeOneHighForcingDependencies/1",
            "status":"VERIFIED_SOURCE_CENSUS_WITH_CONDITIONAL_WEIGHT_SLOPE",
            "pins":PINS,"upstream":upstream_mean(a,data),
            "meanDemands":data["meanDemands"],"newMeanDemands":data["newMeanDemands"],
            "primaryDirectDemands":data["primaryDemands"],
            "originalMonomials":data["termTally"],
            "approximateWeightSlopeOnly":data["conditionalOrderedVariation"]["1"],
            "scope":"The missing mean input bounds are never certified here. Finite high band weights extend the original majorant slopes for the census and still require actual high source estimates."}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("Native mode-one high dependencies",result["upstream"])


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","gauge","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
