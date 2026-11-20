"""Trace the original new post-Signed Mode One requests before high guard attachment."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import runpy


PINS={
    "sourceProgram":"72d3043bb7f9c7ae805b9721c3a713cfa87a1e5ea3385371c4d677f45eb2f3fb",
    "earlier":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "earlyDirections":"f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "lateDirections":"e3a2f7903bc28324bb09f436fb0ff399ab56f334ef95362c64f715ca4cbc00f8",
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
}


def pin(name,path):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[name],(name,path)
    return data


def main(a):
    folder=a.goal/"c105/forced-mode-one-high"
    program=folder/"verify_mode_one_high_dependencies.py"
    pin("sourceProgram",program)
    earlier=json.loads(pin("earlier",folder/"mode-one-high-dependencies.json"))
    early=json.loads(pin("earlyDirections",folder/"forced-gauge-demand.json"))
    late=json.loads(pin("lateDirections",a.demand))
    frame=json.loads(pin("frame",a.goal/"c106/frame15/frame-c15.json"))
    requests=set(map(tuple,early["requests"]))|set(map(tuple,late["directions"]))
    assert len(requests)==93
    code=runpy.run_path(str(program))
    grades=code["source_dependencies"](a,tuple(sorted(requests)))
    assert grades["termTally"]==earlier["originalMonomials"]
    as_keys=lambda values: {(kind,c,tuple(d)) for kind,c,d in values}
    old=as_keys(earlier["meanDemands"])
    new=as_keys(grades["meanDemands"])
    assert old<=new
    main_recipe=a.goal/"c103/initialized-mean/verify_initialized_mean.py"
    premean=a.goal/code["STAGE"]/"middle-premean-whole-path/verify_premean_whole_path.py"
    code["pin"]("initialized",main_recipe)
    code["pin"]("premean",premean)
    sub=runpy.run_path(str(main_recipe))
    temporal,roles=sub["whole_recipe"](runpy.run_path(str(premean)))
    names=code["NAMES"]
    ordinary=sorted({(names[c],(r,z,0,l)) for _,c,(r,z,l) in new})
    for name,d in ordinary:
        temporal(name,d)
    moments,linear,products=sub["compact_demand"](ordinary)
    for _,_,f,d,g,e,_,_ in products:
        temporal(f,d)
        temporal(g,e)
    W,primitives,cutoff,inverse=roles
    needed=W|linear
    # C106 previously evaluated the source coefficient formula at a
    # subset of these directions. Track the newly missing rows explicitly.
    high={row for row in needed if sum(row[1][:3])>7 or row[1][3]>8}
    old_high={(x["component"],tuple(x["RZTL"])) for x in frame["higherCovarianceRows"]}
    assert old_high<=high
    result={"schema":"MathScope.C107.OriginalModeOneLaterAuxiliaryDependencies/1",
            "status":"VERIFIED_SOURCE_DEPENDENCY_CENSUS_WITH_CONDITIONAL_WEIGHT_SLOPES",
            "pins":PINS,"combinedGaugeDirections":len(requests),
            "newMeanOperandRoles":sorted(new-old),"ordinaryMeanRows":len(ordinary),
            "primaryCovarianceRows":len(needed),"newHighPrimaryDirections":sorted(high-old_high),
            "maximumPrimarySlowOrder":max(sum(d[:3]) for _,d in needed),
            "maximumPrimaryLOrder":max(d[3] for _,d in needed),
            "compactMomentMaximumZT":{name:max(map(sum,orders)) for name,orders in moments.items()},
            "ordinaryMeanDirections":ordinary,"primaryDirectRoleCount":len(grades["primaryDemands"]),
            "highestDirectOrdinaryL":max(l for _,_,l,_ in grades["primaryDemands"]),
            "counts":{"shiftedPrimitives":len(primitives),"cutoffRows":len(cutoff),"inverseRows":len(inverse)},
            "open":"Attach the newly listed actual coefficients and the complete source guards before promoting the late covariance.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS exact mode-one denominator and raw roles",len(ordinary),len(needed),len(high-old_high),
          "max orders",result["maximumPrimarySlowOrder"],result["maximumPrimaryLOrder"])


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","demand","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
