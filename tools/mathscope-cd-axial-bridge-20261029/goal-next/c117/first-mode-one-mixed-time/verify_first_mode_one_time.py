"""Bound the actual first Forced mode one at the low mixed time directions."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path
import runpy


PINS={
 "timeProgram":("continuation115/k2-radial-time-analytic/final/verify_first_forced_t_transfer.py","eaaeba91d9a62e83be10dd494943f36fd6e52616d6f187b094e1b3370b85b06a"),
 "temporal":("continuation117/noncompact-temporal-mixed/final/noncompact-temporal-mixed.json","75dae2662614f581f41ac7db09fe41dc01a0fed81cf7e0853f1fcfc3be5e4126"),
 "compact":("continuation116/mean-time-operands/mean-time-operands.json","3ec640563531208b18f019167174e7c39db1c744e937f834d313eeefafd86e14"),
 "primary":("continuation106/high-compact-mode-one/primary-quotient-c11.json","595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8"),
 "radial":("continuation106/radial-b10/final/radial-b-c10.json","789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc"),
 "groupProgram":("continuation107/forced-mode-one-join/final/verify_mode_one_high_join.py","30822610edec2f4c2aea7d0ce9b92a1980d53bab14225b9f1e1c373598e8eb9c"),
 "groupJoin":("continuation107/forced-mode-one-join/final/mode-one-high-join.json","e58b46a729dd9029a35c5e5115f3156943e1d9f8eae33c9bff8d6ee2426a81d8"),
}
ZERO=(0,0,0,0)
KAPPA=Q(1,100000)


def read(work,key):
    rel,pin=PINS[key]
    path=work/rel
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==pin,(key,path)
    return runpy.run_path(str(path)) if path.suffix==".py" else json.loads(raw)


def add(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def slow(a):
    return sum(a[:3])


def sub(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))


def subs(a):
    return product(*(range(x+1) for x in a))


def hull(rows):
    rows=[row for row in rows if row is not None]
    if rows:
        return max(row[0] for row in rows),min(row[1] for row in rows),max(row[2] for row in rows)


def encoded(row):
    return [str(x) for x in row]


def primary_table(d):
    p=d["primary"]["weightedQuotientLedger"]
    assert p["slowAxes"]==["R","Z","T"]
    assert p["firstPulseDerivativeCoverage"]["normalizedAmplitudePotentialVelocity"]
    assert not p["firstPulseDerivativeCoverage"]["addsBandOrLogLoss"]
    assert p["transverseDerivativeCoverage"]["normalizedVelocityL"]>=8
    out={}
    for name,prefix in (("U","velocity"),("Uo","velocityImaginary"),("P","pressureOverP")):
        for j in range(6):
            out[name,j]=hull((Q(r["constantSPower"]),Q(r["epsilonPower"])+Q(r["inverseCarrierPower"],2),
                               Q(3,2)+r["totalLogPoleAfterG"])
                             for r in p["bounds"] if r["role"].startswith(prefix) and r["slowOrder"]==j)
            assert out[name,j] is not None
    return out


def coefficient_geom(tag,a):
    r,z,t,l=a
    j=r+z+t
    if tag in ("epsilon","normalizedPulseRate","carrier","KCarrierP"):
        if a!=ZERO:
            return None
        return (0,{"epsilon":1,"normalizedPulseRate":0,"carrier":-Q(1,2),"KCarrierP":-Q(1,2)}[tag],0)
    if l:
        return None
    if tag in ("invR","invR2","radialFast","radialFastR","KNormalTheta"):
        if z or t:
            return None
        e=-KAPPA if tag.startswith("radialFast") else -Q(1,2) if tag=="KNormalTheta" else 0
        return (0,e,0)
    if tag in ("b","RF","G","K"):
        return (0,int(tag=="b"),0)
    if tag=="phaseBaseline":
        # b*n_r + epsilon*w*(omega_T - G*omega_Z).  The whole initialized
        # increment n dot Delta is a different term in the source recipe.
        return (j+1,1,0)
    if tag=="epsK2Norm":
        return (min(j,2),0,0)
    if tag in ("KNormalR","KNormalZ"):
        return (int(j>0),-Q(1,2),0)
    if tag in ("KNormalRRadial","KNormalZAxial"):
        return (1,int(tag=="KNormalZAxial")-Q(1,2),0)
    raise AssertionError((tag,a))


def grades(d,recipes,directions,region):
    native=d["temporal"][region]
    direct={(r["field"],tuple(r["RZTL"])):r for r in native}
    compact_profile=d["compact"]["compactProfile"]
    assert compact_profile["compactIndependentOfL"] and compact_profile["motionOfSRetained"]
    assert d["compact"]["forcedMeanQueries"]==120
    used_mean=set()
    used_primary=set()
    fields=primary_table(d)

    @cache
    def atom(tag,a):
        j=slow(a)
        if tag in ("U","Uo","P"):
            used_primary.add((tag,a))
            return fields[tag,j]
        if tag in ("Db","Dv","Dg"):
            name={"Db":"beta","Dv":"v","Dg":"gamma"}[tag]
            used_mean.add((name,a))
            row=direct[name,a]
            if region=="middle":
                v=(Q(row["bandIntercept"])+3*j,Q(row["minEpsilon"]),0)
            else:
                # The positive full zeta in the noncompact mean estimate
                # pays its separate finite pole before multiplying by the
                # retained single Primary half Gaussian.
                assert row["pole"]<=24
                v=(Q(row["band"]),Q(row["epsilon"]),0)
            if not a[3]:
                v=hull((v,(Q(7 if name=="beta" else 1,2)+3*j,2 if name=="beta" else 1,0)))
            return v
        if tag in ("Mb","Mg"):
            return hull((atom("b" if tag=="Mb" else "G",a),atom("Db" if tag=="Mb" else "Dg",a)))
        return coefficient_geom(tag,a)

    @cache
    def differentiate(factors,a):
        if not factors:
            return (0,Q(0),0) if a==ZERO else None
        term,offset=factors[0]
        rows=[]
        for b in subs(a):
            x=atom(term,add(b,offset))
            y=differentiate(factors[1:],sub(a,b))
            if x is not None and y is not None:
                rows.append(add(x,y))
        return hull(rows)

    outputs={}
    for a in directions:
        result={n:hull(differentiate(term,a) for term in terms) for n,terms in recipes.items()}
        grade=hull(result.values())
        assert grade[1]>=1-4*KAPPA,(region,a,grade,result)
        outputs[a]=(grade,result)
    assert all(a[0]+a[1]+a[3]<=3 and a[2]<=1 for _,a in used_mean)
    return outputs,used_mean,used_primary


def transfer(base,d,inputs,raw,directions,region):
    ledger=inputs["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    primary=max(sum(inputs["frame"]["uniformLogRanks"]),sum(d["primary"]["commonOrdinaryCoefficientLogRanks"]))
    compact=d["compact"]["compactConditionalGaussianLogCharge"]
    assert compact==28591
    mean=max(compact,*d["temporal"]["common"]["coefficientRanksInHOver2Pow128"])+1+factorial(12).bit_length()
    assert mean<2**15
    geometries=8192
    # At most five raw factors, hence at most 5^3 derivative allocations
    # through the selected order. Every source-only geometric leaf fits a
    # coarse log rank 512 by the C106 actual field and original C107 limits.
    # The generous allowance also includes lower raw expansions and all cuts.
    assert 5*512+32+5**3<geometries
    raw_rank=primary+mean+geometries
    base_s=max(row[0][0]-3*slow(a) for a,row in raw.items())
    output=[]
    for a in directions:
        variants=base["variation"](a,ledger)
        order_rank=max(r["positiveCoefficientBits"]+7*r["sourcePower"]+r["propagatorPower"]+6 for r in variants)
        charge=raw_rank+order_rank+(185 if region=="middle" else 0)
        assert charge<2**17
        pole=max(raw[b][0][2] for b in subs(a) if b[3]==a[3])
        s=base_s+3*slow(a)+1  # original Mode One pulse mass Ls
        assert 2*Q(charge,2**128)+2*s/2**32636<KAPPA
        output.append({"RZTL":a,"rawGroupWeights":{n:encoded(r) for n,r in raw[a][1].items()},
                       "rawCommon":encoded(raw[a][0]),"bandAfterNativeTransfer":str(s),
                       "poleAfterHalfGaussian":str(0 if region=="middle" else pole),
                       "prefactorLogRankHOver2Pow128":charge,
                       "phaseFreeGradeAfterOneDebit":"29999/20000",
                       "orderedVariation":variants})
    return output,{"primary":primary,"meanIncludingPoleAbsorption":mean,"geometryAllocation":geometries,"raw":raw_rank}


def main(args):
    d={k:read(args.work,k) for k in PINS}
    base=d["timeProgram"]
    inputs=base["load"]({"work":args.work,"runtime":args.runtime})
    base["check_sources"](inputs)
    assert d["groupJoin"]["pins"]["cancel"]==base["PINS"]["one"][2]
    assert d["radial"]["ordinaryDerivativeOrder"]==10
    assert inputs["join"]["originalBackgroundOrder"]==16
    assert len(d["temporal"]["requests"])==132
    assert d["temporal"]["compactCrossCheck"]["allCombinedSeeds"]==759
    recipe=d["groupProgram"]["grouped_recipes"]()
    assert ("epsilon",(0,0,0,0)) in recipe["ordinaryTimeAndViscosity"][0]
    assert ("U",(0,0,1,0)) in recipe["ordinaryTimeAndViscosity"][0]
    directions=sorted(a for a in product(range(3),range(3),range(2),range(3)) if a[0]+a[1]+a[3]<=2)
    out={}
    whole,whole_mean,whole_primary=grades(d,recipe,directions,"middle")
    for region in ("inner","outer","middle"):
        raw,mean,primary=grades(d,recipe,directions,region)
        assert mean==whole_mean and primary==whole_primary
        if region!="middle":
            # The stronger short-primitive estimate applies on the narrow
            # collar. Use the whole fixed-path mean estimate on the rest of
            # the wider Primary collar and keep that same Primary weight.
            raw={a:(hull((g,whole[a][0])),
                    {n:hull((r,whole[a][1][n])) for n,r in groups.items()})
                 for a,(g,groups) in raw.items()}
        assert ("U",(0,0,2,0)) in primary
        assert max(slow(a) for _,a in primary)==5
        rows,ranks=transfer(base,d,inputs,raw,directions,region)
        out[region]={"rows":rows,"meanOperands":sorted(mean),"primaryOperands":sorted(primary),
                     "coefficientRanks":ranks,"phaseFreeCommonEpsilon":"29999/20000"}
    for region in out.values():
        assert len(region["rows"])==20
    assert 1-4*KAPPA+Q(1,2)-KAPPA==Q(29999,20000)
    report={"schema":"MathScope.C118.OriginalFirstForcedModeOneMixedTimeWeightedGauge/1",
            "status":"ACTUAL_C94_GROUPED_TIME_TRANSFER_CONDITIONAL_SAME_ORIGINAL_PROFILES",
            "pins":{key:value[1] for key,value in PINS.items()},
            "protectedDirections":directions,
            "source":"Retained actual ten mode-one native systems, 60 grouped raw scalars, original full-cylinder conservative cancellation, matching twenty four-axis directions.",
            "sourcePhase":"At fixed native v, (-epsilon partial_T) exp(i m k phi) = i m epsilon k v (p F_T + p_z G_T) exp(i m k phi) with original D_t pulse contribution separate.",
            "ordinaryTime":"The differentiated already-grouped zero-carrier source keeps epsilon times the actual Primary U_TT, supplied by original C106 RZT table.",
            "physicalGauge":"Phase-free original A_1/P with the same positive P_T=0, original inverse carrier, sqrt(zeta) and finite collar pole. Reconstruction in the protected physical term applies the separately retained epsilon-weighted phase.",
            "regions":out,
            "maximumWeightedBand":str(max(Q(row["bandAfterNativeTransfer"]) for area in out.values() for row in area["rows"])),
            "maximumWeightedPole":str(max(Q(row["poleAfterHalfGaussian"]) for area in out.values() for row in area["rows"])),
            "maximumCoefficientRank":max(row["prefactorLogRankHOver2Pow128"] for area in out.values() for row in area["rows"]),
            "radialCoverage":"Wide original Primary collars u<=1/4 or d<=1/4 use the stronger narrow short-path mean estimate where available and the admitted whole fixed-path estimate elsewhere. The middle u,d>1/4 uses the original middle target and zeta inverse bound.",
            "conditionalLogCapBeforeDebit":"H/2^111",
            "conditionalPhaseFreeEpsilonAfterDebit":"29999/20000",
            "open":"Whole Signed time, higher protected wave directions, coupled Repeat closure, later corrections and final jets.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print("PASS 20 actual C94 Mode One mixed-time transfer rows in each original region")


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","runtime","out"):
        p.add_argument(f"--{key}",type=Path,required=True)
    main(p.parse_args())
