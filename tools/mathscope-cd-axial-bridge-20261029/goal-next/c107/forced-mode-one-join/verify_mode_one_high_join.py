"""Join full native Mode One forcing bounds to the original phase-free gauge."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import comb
from pathlib import Path
import runpy


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
STAGE=BAND/"first-forced-budget"
C105=Path("c105/forced-mode-one-high")
C106=Path("c106/high-compact-mode-one")
KAPPA=Q(1,100000)
ZERO=(0,0,0,0)
R=(1,0,0,0)
Z=(0,1,0,0)
T=(0,0,1,0)
L=(0,0,0,1)
PINS={
    "geometry":"2b37b73515aff09625b0b8e8e433a651cfaf8ad3bfd273befa3eb6485b1006d8",
    "geometryCode":"5087c7c6351028bdfe547bfbea30907f909478986f83fed930519bb473642cd9",
    "demand":"f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "dependencies":"9cec4ad5ae9860a47d4d448cf2d3b0cdce3de697d77d42a805f51711cf20a028",
    "variation":"4beea5ad61c1af3ea310b0edcb3183689b9d5f29cfd40f426eaaf65d27f658a0",
    "joined":"98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3",
    "compact":"00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884",
    "primary":"595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8",
    "rawGrade":"6b720ec53272ee59d1576ed374dedcf9267bbdfc41c2ad122d0e7e24face8298",
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "radial":"789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc",
    "cancel":"02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364",
    "middle":"b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8",
    "middleTarget":"82a8f02074be1f1e0d4fa21d897c7a59adb96a9f77174f82530169fc94b81cd3",
    "c7Covariance":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
}


def pin(file,key):
    raw=file.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(key,file)
    return raw


def read(file,key):
    return json.loads(pin(file,key))


def add(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def subtract(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))


def suborders(a):
    return product(*(range(x+1) for x in a))


def choose(a,b):
    return comb(a[0],b[0])*comb(a[1],b[1])*comb(a[2],b[2])*comb(a[3],b[3])


def slow(a):
    return sum(a[:3])


def rzl(a):
    assert not a[2]
    return (*a[:2],a[3])


# A grade is (largest S power, lowest epsilon power, largest additional pole).
# These are independent upper bounds for a fixed direction, applied together.
def hull(bounds):
    bounds=[x for x in bounds if x is not None]
    if bounds:
        return (max(x[0] for x in bounds),min(x[1] for x in bounds),max(x[2] for x in bounds))
    return None


def add_grade(a,b):
    if a is not None and b is not None:
        return add(a,b)
    return None


def encoded(grade):
    return [str(grade[0]),str(grade[1]),grade[2]]


def mean_and_coefficient_budget(data):
    cut=data["compact"]["cutoff"]
    assert max(cut["coefficientLog2Ceilings"].values())<512
    assert cut["RenvDegreeOfChiAndRhoMixedJets"]<=16
    assert data["compact"]["coefficientProfile"]["compactIndependentOfL"]
    assert data["compact"]["coefficientProfile"]["compactZeroOnBothSourceCollars"]
    f=data["frame"]
    low=sum(data["c7Covariance"]["coefficientBudget"]["commonGlobalCovarianceRanks"])
    high=max(sum(row["logDegreeRanks"]) for row in f["higherCovarianceRows"])
    assert len(f["higherCovarianceRows"])==335 and low<2**16 and high<2**17
    assert f["upstreamPrimaryCount"]==1213
    typed={(name,a[0],a[1],a[3]):value for name,a,value in data["compact"]["ordinaryRows"] if not a[2]}
    need={(('beta','v','gamma')[c],*a) for _,c,a in data["dependencies"]["meanDemands"]}
    assert len(typed)==273 and set(typed)==need
    ranks={}
    # One high differentiated radius, inverse, path length, cutoff, or
    # shifted L coefficient costs <= 2^512 Bnorm^32. The inherited
    # fixed radius in every whole primitive lies inside the original cover.
    # For chi the checked 2^326 Renv^n budget is already much smaller.
    assert cut["coefficientLog2Ceilings"]["chiCoefficient"]==326
    temporal_geometry_log_rank=512+32
    compact_rank=data["compact"]["coefficientProfile"]["compactChargeInHOver2Pow128"]
    for key,row in typed.items():
        coefficient=Q(row["coefficientMass"]).__ceil__().bit_length()
        direct=max(low,high)+temporal_geometry_log_rank*row["geometryPower"]+coefficient
        ranks[key]=max(direct,compact_rank)+int(not key[-1])
        assert ranks[key]<2**18
    return typed,ranks,{"oldGlobalCovariance":low,"selectedHighCovariance":high,
       "perGeometryFactor":temporal_geometry_log_rank,"compact":compact_rank,
       "ordinaryDirectOrCompactMaximum":max(ranks.values())}


def primary_terms(receipt,dependencies):
    led=receipt["weightedQuotientLedger"]
    assert led["firstPulseDerivativeCoverage"]["addsBandOrLogLoss"] is False
    assert led["transverseDerivativeCoverage"]["costInSAndLaurent"]==0
    assert led["transverseDerivativeCoverage"]["normalizedVelocityL"]>=8
    table={}
    for tag,prefix in (("U","velocity"),("Uo","velocityImaginary"),
                       ("P","pressureOverP")):
        for j in range(12):
            vals=[(Q(row["constantSPower"]),Q(row["epsilonPower"])+Q(row["inverseCarrierPower"],2),
                   row["totalLogPoleAfterG"]) for row in led["bounds"]
                  if row["role"].startswith(prefix) and row["slowOrder"]==j]
            table[tag,j]=hull(vals)
            assert table[tag,j] is not None,(tag,j)
    assert len(dependencies["primaryDirectDemands"])==110
    assert max(r[1] for r in dependencies["primaryDirectDemands"])==11
    return table


def grouped_recipes():
    def field(name, a=ZERO):
        return (name,a)

    def factors(*names):
        return tuple(field(name) if isinstance(name,str) else name for name in names)

    def tagged_gradient(name):
        return [factors(field(name,R)),factors("radialFast",field(name,L)),factors("epsilon",field(name,Z))]

    # Exact C94 identities replace the real homogeneous principal block,
    # including the registered principal tail, by zero, and remove
    # M div_phi U by full cylindrical curl-divergence. K absorbs the
    # unweighted radial background gradients G_R and (RF)_R and the
    # corresponding connection coefficients. Other native terms remain.
    return {
      "imaginaryHomogeneous":[factors("Uo"),factors("normalizedPulseRate","Uo"),
                             factors("K","Uo"),factors("epsK2Norm","Uo")],
      "ordinaryPressure":tagged_gradient("P"),
      "eikonal":[factors("carrier","phaseBaseline","U")]+[
          factors(n,d,"U") for n,d in (("KNormalR","Db"),("KNormalTheta","Dv"),("KNormalZ","Dg"))],
      "singleCarrierViscosity":[factors("epsilon",n,"U") for n in
          ("KNormalRRadial","KNormalZAxial")]+[
          factors("epsilon","KNormalR",field("U",R)),
          factors("epsilon","KNormalR","radialFast",field("U",L)),
          factors("epsilon","epsilon","KNormalZ",field("U",Z)),
          factors("epsilon","invR","KNormalR","U"),
          factors("epsilon","invR2","KCarrierP","U")],
      "meanTransportAndDivergence":[factors("Mb",field("U",R)),
          factors("Mb","radialFast",field("U",L)),factors("epsilon","Mg",field("U",Z)),
          factors("invR","Mb","U"),factors("invR","Dv","U")]+[
          # The three mean gradients are retained, except the unweighted
          # background theta and axial radial gradients already in K.
          factors(*(term+(field("U"),))) for name in ("Db","Dv","Dg") for term in tagged_gradient(name)]+[
          factors(field("b",R),"U"),factors("epsilon",field("RF",Z),"U"),
          factors("epsilon",field("G",Z),"U")],
      "ordinaryTimeAndViscosity":[factors("epsilon",field("U",T)),
          factors("epsilon",field("U",add(R,R))),
          factors("epsilon","radialFast",field("U",add(R,L))),
          factors("epsilon","radialFastR",field("U",L)),
          factors("epsilon","radialFast","radialFast",field("U",add(L,L))),
          factors("epsilon","epsilon","epsilon",field("U",add(Z,Z))),
          factors("epsilon","invR",field("U",R)),
          factors("epsilon","invR","radialFast",field("U",L)),
          factors("epsilon","invR2","U")],
    }


def direct_grades(directions,data,geometry_function,typed,frame_fields,using_compact):
    eps_floor=Q(data["rawGrade"]["safeRawGrade"])
    assert eps_floor==1-6*KAPPA
    baseline={tuple(x["RZL"]):x["baselineGeometry"] for x in data["geometry"]["phaseTransportRows"]}
    used_means=set()

    def mean(tag,a):
        names={"Db":"beta","Dv":"v","Dg":"gamma"}
        base=(names[tag],*rzl(a))
        used_means.add(base)
        row=typed[base]
        direct=(Q(row["bandIntercept"])+3*slow(a),Q(row["minEpsilon"]),0)
        if not using_compact or a[3]:
            return direct
        compact=(Q(7 if tag=="Db" else 1,2)+3*slow(a),Q(2 if tag=="Db" else 1),0)
        return hull((direct,compact))

    @cache
    def atom(tag,a):
        if tag in ("U","Uo","P"):
            return frame_fields[tag,slow(a)]
        if tag in ("Db","Dv","Dg"):
            return mean(tag,a)
        if tag in ("Mb","Mg"):
            return hull((atom("b" if tag=="Mb" else "G",a),atom("Db" if tag=="Mb" else "Dg",a)))
        if tag in ("b","RF","G","K"):
            if a[3]:
                return None
            assert slow(a)<= (10 if tag=="b" else 14)
            return (0,Q(tag=="b"),0)
        if tag=="epsK2Norm":
            # ε*k² <= 4, and the native normal has at most one S at each
            # positive slow derivative. The two factors cost <=min(j,2).
            return None if a[3] else (min(slow(a),2),Q(0),0)
        if tag=="carrier":
            return None if a!=ZERO else (0,Q(-1,2),0)
        if tag=="phaseBaseline":
            terms=baseline[rzl(a)]
            return hull((Q(s),Q(e),0) for _,_,_,_,s,e,_,_ in terms)
        geometry=geometry_function(tag,rzl(a))
        return hull((Q(s),e-Q(k,2),0) for _,_,_,s,e,k,_ in geometry)

    @cache
    def derivative(factors,a):
        if not factors:
            return (0,Q(0),0) if a==ZERO else None
        tag,shift=factors[0]
        return hull(add_grade(atom(tag,add(b,shift)),derivative(factors[1:],subtract(a,b)))
                    for b in suborders(a))

    recipes=grouped_recipes()
    result={}
    for a in directions:
        groups={key:hull(derivative(term,a) for term in recipe) for key,recipe in recipes.items()}
        all_groups=hull(groups.values())
        assert all_groups[1]>=eps_floor,(a,all_groups,groups)
        assert all_groups[0]<=Q(67,4)+3*slow(a) and all_groups[2]<=9+3*slow(a),(a,all_groups)
        result[a]=(all_groups,groups)
    return result,used_means


def transfer(directions, raw, data, mean_ranks, middle=False):
    inherited={tuple(row["RZL"]):row for row in data["variation"]["rows"]}
    raw_eps=Q(data["rawGrade"]["safeRawGrade"])
    P=max(sum(data["primary"]["commonOrdinaryCoefficientLogRanks"]),sum(data["frame"]["uniformLogRanks"]))
    ordinary_field_rank=P+32
    # Term weights: one Primary factor, at most one complete mean factor,
    # the source geometry products (including multiplicities), both signs,
    # one stable pulse cutoff and all finite Leibniz crossings.
    assert 64*16*8**11<2**44
    geometry_charge=44+20+128
    raw_log_rank=ordinary_field_rank+mean_ranks["ordinaryDirectOrCompactMaximum"]+geometry_charge
    assert raw_log_rank<2**17 # Stronger than H/2^100 for the C105 exact variation.
    out=[]
    for a in directions:
        n=slow(a)
        grade,groups=raw[a]
        gauge_s=max(raw[b][0][0]+2*(n-slow(b))+1 for b in suborders(a) if b[3]==a[3])
        gauge_p=max(raw[b][0][2] for b in suborders(a) if b[3]==a[3])
        old=inherited[rzl(a)]
        assert gauge_s<=Q(old["outerPotentialBand"]) and gauge_p+Q(3,2)<=Q(old["outerPotentialPoleAfterZeta"])
        worst_rank=raw_log_rank+sum(old["orderedAndCrossLogRanks"])+8
        if middle:
            # On the original middle overlap ζ^-1<2^185. Retain sqrt ζ
            # when writing the pole-free estimate by paying this coefficient.
            worst_rank+=185
        assert worst_rank<2**17
        assert Q(2*worst_rank,2**128)+Q(2*gauge_s,2**32636)<KAPPA
        before=raw_eps+Q(1,2)
        after=before-KAPPA
        assert after==Q(149993,100000)
        out.append({"RZL":rzl(a),"sourceGroups":{k:encoded(v) for k,v in groups.items()},
                    "rawGrade":encoded(grade),"nativeBandSPower":str(gauge_s),
                    "nativePoleAfterG":gauge_p,"gaugePoleAfterSqrtZeta":str(0 if middle else gauge_p+Q(3,2)),
                    "gaugeEpsilonBeforeLogDebit":str(before),"gaugeEpsilonAfterOneDebit":str(after),
                    "gaugeLogRankInHOver2Pow128":worst_rank,"gaugeCoefficientCap":"H/2^111",
                    "originalInverseCarrier":"1/k <= sqrt(epsilon)",
                    "orderedWindows":old["orderedWindowCount"]})
    return out,{"ordinaryPrimary":ordinary_field_rank,"geometry":geometry_charge,"raw":raw_log_rank}


def main(args):
    goal=args.goal
    paths={"geometry":args.geometry,"demand":goal/C105/"forced-gauge-demand.json",
           "dependencies":goal/C105/"mode-one-high-dependencies.json","variation":goal/C105/"mode-one-high-transfer.json",
           "joined":goal/"c106/frame15/joined-c15.json","compact":goal/C106/"compact-mode-one-c15.json",
           "primary":goal/C106/"primary-quotient-c11.json","rawGrade":goal/C106/"mode-one-raw-grades.json",
           "frame":goal/"c106/frame15/frame-c15.json","radial":goal/"c106/radial-b10/radial-b-c10.json",
           "cancel":goal/STAGE/"principal-mode-cancellation/mode-one/mode1-linear-cancellation.json",
           "middle":goal/STAGE/"middle-covariance/frame/middle-frame-budget.json",
           "middleTarget":goal/"c106/middle-target15/regular-middle-c15.json",
           "c7Covariance":goal/STAGE/"global-covariance-join/global-primary-covariance.json"}
    data={key:read(path,key) for key,path in paths.items()}
    assert pin(args.c94_replay,"cancel")==paths["cancel"].read_bytes()
    pin(args.geometry_code,"geometryCode")
    geometry=runpy.run_path(str(args.geometry_code))["nth"]
    source=data["joined"]
    assert len(data["cancel"]["chartRows"])==10 and data["cancel"]["status"]=="VERIFIED_ORIGINAL_FULL_MODE_ONE_LINEAR_AND_CONSERVATIVE_GROUPS"
    assert source["originalBackgroundOrder"]==16 and source["regularTargetOrder"]==15
    for key,dig in (("compact","compact"),("primary_c11","primary"),("frame","frame"),("radial","radial"),("raw_grade","rawGrade")):
        assert source["pins"][key]==PINS[dig]
    assert data["geometry"]["sourceNodeCount"]==22155584
    assert data["geometry"]["gaussianRows"]["partialRadiusRecipe"]["maximumOrder"]>=11
    assert data["geometry"]["actualGeometryLogRankMaxima"]=={"originalMonomials":44,"transportBaseline":20}
    assert data["radial"]["ordinaryDerivativeOrder"]==10 and data["radial"]["originalLiveSlabThresholdComparison"]==-1
    requested=data["demand"]["requests"]
    assert len(requested)==50 and requested==data["geometry"]["directions"]
    directions=[(r,z,0,l) for r,z,l in requested]
    assert set(b for a in directions for b in suborders(a))==set(directions)
    typed,ranks,mean_ranks=mean_and_coefficient_budget(data)
    field=primary_terms(data["primary"],data["dependencies"])
    collar,needed_c=direct_grades(directions,data,geometry,typed,field,False)
    middle,needed_m=direct_grades(directions,data,geometry,typed,field,True)
    assert needed_c==needed_m and needed_c<=set(typed)
    mid_guard=data["middle"]["middleCrossGuardAndConditionalEnergy"]
    mid_target=data["middleTarget"]
    assert mid_target["domain"]==mid_guard["middleDefinedOnSourceGuard"]
    assert mid_target["capRows"][-1]["outputOrder"]==15
    assert mid_target["capRows"][-1]["conditionalOriginalLogCap"]=="H/2^256"
    assert source["pins"]["middle"]==PINS["middleTarget"]
    assert mid_guard["inverseTwoEndpointZetaBound"]=="2^185"
    assert 185*Q(842,1215)>128
    collar_rows,joined_ranks=transfer(directions,collar,data,mean_ranks)
    middle_rows,_=transfer(directions,middle,data,mean_ranks,middle=True)
    result={"schema":"MathScope.C107.OriginalModeOneHighPhaseFreeGaugeJoin/1",
            "status":"VERIFIED_QUANTITATIVE_ORIGINAL_MODE_ONE_BOUND_CONDITIONAL_ADMITTED_CHART_AND_PATHS",
            "pins":PINS,"directionCount":len(directions),"pairedPressureCases":2970,
            "meanRowsAvailable":len(typed),"meanRowsUsedByConservativeRegrouping":len(needed_c),
            "primaryRoleCount":110,"primaryMaxSlowOrder":11,"radialBackgroundOrder":10,
            "collars":collar_rows,"middle":middle_rows,"coefficientLogRanks":{"mean":mean_ranks,"source":joined_ranks},
            "middleTarget":{"actualRootSlots":[row["activeSlot"] for row in mid_target["sourceRows"]],
                            "ordinaryOrder":15,"logCap":"H/2^256","sameRadialGuard":mid_target["domain"],
                            "quotientBoundUsedBeforeSqrtZetaConversion":"The same positive normalized frame recurrence with the native smooth middle C15 target and no factored single-endpoint Gaussian."},
            "commonBandClaim":"Original native phase-free A_1/P, after retaining the physical cutoff, phase-free inverse carrier, and same-chart transport.",
            "sourceBranchRules":["At any failed native guard the source contributes zero before a cutoff, reciprocal or pulse evaluation. The analytic estimates apply on admitted chart interiors and inward traces with the original flat cutoff.",
                                 "No derivative of a piece-selection indicator is taken. Derivatives are of the same full source before region restriction.",
                                 "The whole fixed shifted paths, stable positive frame and normalized inverse, and original qBig/64 <= q < qBig/16 slab are retained.",
                                 "The middle uses the original positive same-box regular target and ζ^-1<=2^185. The compact FiveMap terms vanish on both original collars and under positive L."],
            "open":["Combine both high modes in the original paired pressure and covariance, then propagate the early/late Signed stages and K1.",
                    "Global chart-seam membership, stage energy, final jets."],"finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS Mode One joined",len(directions),"raw log rank",joined_ranks["raw"],"largest band",
          max(Q(x["nativeBandSPower"]) for x in collar_rows),"max collar pole",
          max(Q(x["gaugePoleAfterSqrtZeta"]) for x in collar_rows))


if __name__=="__main__":
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","geometry","geometry-code","c94-replay","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
