"""Complete noncompact Temporal mean roster for first Forced and Signed time inputs."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from itertools import product
import json
from math import factorial
from pathlib import Path
import runpy


BASE="continuation116/noncompact-temporal-t2/final"
BASE_CODE="aed42a51a096295281e54a2a2372ba8d3142617aaeafb6c26ffe500cab7a8cce"
BASE_RECEIPT="bda7cddcec3ab5e86153e12e014623b17e1191b80207fc045810e1eacff86009"
SPECIAL={("W_rz",(0,7,1,0)),("W_rz",(0,7,1,2))}


def load(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def main(args):
    path=args.work/BASE/"verify_temporal_t2.py"
    load(path,BASE_CODE)
    spec=spec_from_file_location("c116_temporal_fixed_time",path)
    base=module_from_spec(spec)
    spec.loader.exec_module(base)
    prev=json.loads(load(args.work/BASE/"temporal-t2.json",BASE_RECEIPT))
    d={}
    for key in base.PINS:
        path=base.pin(vars(args),key)
        d[key]=runpy.run_path(str(path)) if path.suffix==".py" else json.loads(path.read_bytes()) if path.suffix==".json" else path.read_text(encoding="utf-8")
    base.audit_source(d)
    directions=sorted(a for a in product(range(4),range(4),range(3),range(4))
                      if a[0]+a[1]+a[3]<=(3 if a[2]<=1 else 1))
    assert len(directions)==44 and sum(a[2]==2 for a in directions)==4
    names=base.NAMES
    requests=[(f,a) for f in names for a in directions]
    inner=base.collar(d["weightedProgram"],6,requests)
    outer=base.collar(d["weightedProgram"],9,requests)
    assert inner[1:-1]==outer[1:-1]
    direct,tables=d["c103Program"]["whole_recipe"](d["premean"])
    whole_rows=[{"field":f,"RZTL":a,**direct(f,a)} for f,a in requests]
    for old,new in zip((prev["innerRows"],prev["outerRows"],prev["wholeFixedPathRows"]),
                       (inner[0],outer[0],whole_rows),strict=True):
        indexed={(x["field"],tuple(x["RZTL"])):x for x in old}
        overlap=[x for x in new if (x["field"],x["RZTL"]) in indexed]
        assert len(overlap)==len(old)==36
        for x in overlap:
            encoded=json.loads(json.dumps(x))
            assert encoded==indexed[x["field"],x["RZTL"]]
    whole_sources=set(tables[0])
    whole_cutoff=set(tables[2])
    all_sources=whole_sources|inner[1]
    maxima=(max(sum(a[:3]) for _,a in all_sources),max(a[2] for _,a in all_sources),max(a[3] for _,a in all_sources))
    assert maxima==(7,2,6)
    assert len(whole_sources)==len(all_sources)==699 and len(inner[1])==667
    assert all(sum(a[:3])<=7 and a[3]<=8 for _,a in all_sources)
    # Isolate the new source demands of the compact FiveMap moments.
    moments,linear,quadratic=d["c103Program"]["compact_demand"](requests)
    for name,order,f,b,g,c,dz,multiplicity in quadratic:
        direct(f,b)
        direct(g,c)
    compact_sources=set(tables[0])|linear
    assert all(sum(a[:3])<=7 and a[3]<=8 for _,a in linear)
    high={key for key in compact_sources if sum(key[1][:3])>7 or key[1][3]>8}
    assert high==SPECIAL,(high,len(compact_sources))
    # The ordinary C98 product recurrence is read through C7. The two
    # actual C103 higher mixed directions happen to continue its same row.
    w=d["covariance"]["ordinaryDerivativeBudget"]
    high_rows={}
    for row in d["c103"]["additionalHighRows"]:
        key=row["component"],tuple(row["RZTL"])
        if key in high:
            a=key[1]
            j=sum(a[:3])
            assert Q(row["epsilonGrade"])==1 and Q(row["bandPower"])==Q(1,2)+3*j
            assert row["outerAndInnerPoles"]==[9+3*j,6+3*j]
            high_rows[key]=row
    assert high_rows.keys()==high
    for key in all_sources-high:
        j=sum(key[1][:3])
        row=w["radialRows"][j]
        assert Q(row["exactBandPower"])==Q(1,2)+3*j
        assert row["innerPole"]==6+3*j and row["outerPole"]==9+3*j
    mass=base.mass_bits
    rank_low=sum(d["covariance"]["coefficientBudget"]["commonGlobalCovarianceRanks"])
    rank_high=max(sum(row["logDegreeRanks"]) for row in high_rows.values())
    assert rank_low==26981 and rank_high==48463
    # Explicitly charge up to 3! on differentiated radial geom factors
    # beyond the old r<=1 profile. This includes inverse-radius factors
    # with their exact factorial and the original radialFast power law.
    radial_charge=factorial(3).bit_length()
    collar_charge=max(rank_low+mass(x["coefficientMass"])+(8+radial_charge)*x["geometryPower"]+32
                       for x in inner[0]+outer[0])
    middle_charge=max(rank_low+mass(x["coefficientMass"])+(8+radial_charge)*x["geometryPower"]+33
                      for x in whole_rows)
    assert max(collar_charge,middle_charge)<2**15
    assert max(map(sum,tables[2]))<=9  # the C102 original cutoff jet budget
    grade={f:str(min([Q(x["epsilon"]) for x in inner[0] if x["field"]==f]+
                     [Q(x["minEpsilon"]) for x in whole_rows if x["field"]==f])) for f in names}
    maximum_band={f:str(max([Q(x["band"]) for x in inner[0] if x["field"]==f]+
                            [Q(x["bandIntercept"])+3*sum(x["RZTL"][:3]) for x in whole_rows if x["field"]==f])) for f in names}
    assert ("beta",(0,1,2,0)) in requests
    report={"schema":"MathScope.C117.OriginalNoncompactTemporalMixedTimeCover/1",
            "status":"VERIFIED_132_NATIVE_DERIVATIVE_COMPOSITIONS_CONDITIONAL_SAME_ORIGINAL_ANALYTIC_INPUTS",
            "pins":{"c116Code":BASE_CODE,"c116Receipt":BASE_RECEIPT,**{key:v[2] for key,v in base.PINS.items()}},
            "requests":requests,"reproducedC116RowsPerRegion":36,
            "requiredWholePrimaryCovarianceRoles":sorted(whole_sources),
            "requiredWholeCollarUnionCovarianceRoles":sorted(all_sources),
            "compactCrossCheck":{"allCombinedSeeds":len(compact_sources),"combinedC98Seeds":len(compact_sources-high), "compactLinearSeeds":len(linear),"compactQuadraticLeibnizRows":len(quadratic),"momentDirections":{k:sorted(v) for k,v in moments.items()},
                                 "twoHigherOriginalCovarianceRows":list(high_rows.values()),"highCoefficientRank":rank_high},
            "seedMaximaSlowTimeL":maxima,
            "inner":inner[0],"outer":outer[0],"middle":whole_rows,
            "wholeCutoffDirections":sorted(whole_cutoff),
            "collarMaximumPrimitiveInputPoles":[inner[4],outer[4]],
            "common":{"conditionalLogCap":"H/2^113","epsilonByField":grade,"maximumBandByField":maximum_band,
                      "coefficientRanksInHOver2Pow128":[collar_charge,middle_charge],
                      "collarMaxPoleByField":{f:[max(x["pole"] for x in zone if x["field"]==f) for zone in (inner[0],outer[0])] for f in names},
                      "weight":"One original zeta. Direct gaussian on collars, restored by same complement inverse otherwise.",
                      "jointAssumption":"Admitted exact original C98 and observed original ordinary source regularity. Fixed shifted primitives and Fourier inverse use actual paired graph ranges."},
            "remaining":"This packet covers all conservative noncompact mean requests. The compact FiveMap packet and source residual assembly are separate.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print(f"PASS 132 noncompact rows from {len(all_sources)} C98 roles; combined compact census {len(compact_sources)} roles, exactly two C103 high seeds")


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","runtime","out"):
        p.add_argument(f"--{key}",type=Path,required=True)
    main(p.parse_args())
