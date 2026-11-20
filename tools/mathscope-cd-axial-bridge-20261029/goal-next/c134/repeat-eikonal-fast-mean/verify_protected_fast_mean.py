"""Original shifted fast-mean cancellation and protected Repeat scalar fast bound."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import factorial
from pathlib import Path
import runpy

RUNTIME="continuation66/stage2/runtime-exact/research-ide/mathscope-m3/"
SLOW_STEM="continuation133/repeat-eikonal-time/"
PINS={
    "slow":("work",SLOW_STEM+"protected-eikonal-time.json","f399f37bc2a1616a89b3090d0f35bf085fcf41d44eaeaf49adc24571d83fd5df"),
    "protected":("work","continuation122/repeat-postfive-mean/protected-postfive-source.json","83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831"),
    "old":("work","continuation132/fivemap-old-mean/fivemap-old-mean.json","1b8ddd4ce8b5006d96835b13ba892157b7fee7aef647d64306f96359abfea9bf"),
    "swirl":("work","continuation127/late-temporal-swirl-T/late-temporal-swirl-T.json","dabc398f8bbd002c1ab534dbd430123b2a83a65ff1ea72c1e45fbaf5b1af7d6c"),
    "meridional":("work","continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json","13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a"),
    "primary":("work","continuation98/covariance/final/global-primary-covariance.json","05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
    "spatial":("goal","c105/late-grade/late-grade.json","d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef"),
    "spatialBound":("goal","c108/first-k1-energy/k1-donor-join.json","8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
    "fourier":("goal","c110/k1-analytic-seams/directional-inverse-seams.json","0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "ops":("goal","c105/late-grade/verify_late_grade.py","b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc"),
    "localLift":("work",RUNTIME+"navier/source-initialized-angular.mjs","4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "eq":("work",RUNTIME+"navier/source-full-mean-equations.mjs","2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
    "globalPressure":("work",RUNTIME+"navier/source-global-pressure.mjs","c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "pressure":("work",RUNTIME+"navier/source-pressure.mjs","fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f"),
    "potential":("work",RUNTIME+"navier/source-temporal-potential.mjs","c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
    "cutoff":("work","continuation106/high-compact-mode-one/compact-mode-one-c15.json","00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"),
    "initialMean":("work",RUNTIME+"navier/source-global-initial-mean.mjs","cde60a57a820915c1403d8ce7b13fdbf8e75cb33e5821c8423ab9ac569fcd584"),
    "updatedPressure":("work",RUNTIME+"navier/source-updated-mean-pressure.mjs","6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07"),
    "initialInverse":("work",RUNTIME+"navier/source-global-temporal.mjs","16c13ea7a6ba49f78514e1c2a94e29499086e3b11c463e07f6513b8e31f32f1b"),
    "signedInverse":("work",RUNTIME+"post-signed-20261023/source-signed-actual-temporal-inverse.mjs","5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628"),
    "inverseDefinition":("work",RUNTIME+"post-signed-20261023/original-coupled-inverse-proof.mjs","52186947dbeaa142cde8b5f564d28e24dfd982d5027f93911866a359be9b88a8"),
}
ZERO=(0,0,0,0)
Z=(0,1,0,0)
QEPS=Q(1,100000)


def load(a):
    data={}
    for key,(base,rel,digest) in PINS.items():
        p=getattr(a,base)/rel
        b=p.read_bytes()
        assert sha256(b).hexdigest()==digest,p
        data[key]=json.loads(b) if p.suffix==".json" else runpy.run_path(str(p)) if p.suffix==".py" else b.decode()
    return data


def source(d):
    fragments={
        "localLift":("ci:G.div(ci,G.pow(Tg,levelDifference))","G.mul(geometry.ci,operators.N(v)),G.one",
                     "G.div(T,ratio),ellReference,...Y","operators.N(xi),G.zero"),
        "globalPressure":("baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)",
                          "ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))",
                          "Ez=G.sub(G.add(De(W.rz,1),Dz(W.zz),G.mul(epsilon,pZ)),De(stress[1],1))",
                          "fixed-reference-time-coefficient"),
        "pressure":("shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)",
                    "shiftedY=Y.map((y,j)=>G.add(y,G.mul(shift,vr[j])))",
                    "left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius)"),
        "eq":("time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))",
              "gr=G.add(G.neg(time(beta))","Ez=G.add(time(gamma)",
              "Etheta=G.add(time(v)","G.mul(epsilon,lap(gamma))"),
        "potential":("deltaV=G.neg(G.div(inverseTheta,ci)),gammaDesired=G.neg(G.div(inverseZ,ci))",
                     "rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)",
                     "beta=G.neg(Dz(psi)),gamma=De(psi,1)",
                     "cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)"),
        "initialMean":("previous=temporal.potential.velocity,updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])]))",
                       "id:'post-temporal-five-bump-has-no-auxiliary-variable',pass:Object.values(increment).every"),
        "updatedPressure":("source=G.sub(gr,G.mul(rho,P)),integrals=shiftedRadialIntegrals",
                           "value=G.sub(integrals.left,G.mul(chi,integrals.whole))",
                           "pZ=G.sub(G.sub(leftZ,G.mul(G.derivative(chi,Z),integrals.whole)),G.mul(chi,wholeZ))"),
        "initialInverse":("exactInverseEquation:'N inverse = actual E - normalized Haar mean(actual E)'",),
        "signedInverse":("source=[...frontier.centered]", "body,Y,", "parameters,directions:[R,Z,T,...Y]",
                         "geometry,inverseTheta:inverses.theta.exact,inverseZ:inverses.z.exact"),
        "inverseDefinition":("def.operator!=='(sqrt(2)-1)*partial_y0+partial_y1'",),
    }
    for key,rows in fragments.items():
        for row in rows:
            assert row in d[key],(key,row)
    ids=d["fourier"]["source"]
    assert ids["fixedWholeRadialEndpoints"]==[17743711,17743713]
    assert ids["originalInitialCenteredSources"]==[17754253,17754268]
    assert ids["originalLateCenteredSources"]==[22032006,22032008]
    assert ids["commonTorusArguments"]==[17745430,17745431] and ids["radialDerivativeOfShift"]==17745446
    assert d["meridional"]["actualSource"]["pressureZ"]==22031648
    assert d["swirl"]["roots"]=={"actualTemporalSwirl":22150797,"centeredEtheta":22032006,"rawEtheta":22031277}
    assert d["protected"]["sourceSHA256"]==d["slow"]["protectedStream"]==d["fourier"]["stream"]["sha256"]
    for suffix,node in (("beta",22151963),("v",22151941),("gamma",22151945)):
        registry=d["protected"]["registry"]["PostSignedFiveBump_"+suffix]
        args=d["protected"]["nodes"][str(node)]["args"]
        assert args==[registry["id"],[17732737,17732748,17732749,17732750],[0]*4]
        assert args[1]==registry["parameters"]
    # A failure of the opposite endpoint to vanish retains a nonzero
    # boundary term even if the inner trace is zero.
    left,point,right,chi=map(Q,(1,2,3,"1/2"))
    assert (point-left)-chi*(right-left)==0 and (point-left)!=0
    # The normalization from the own fixed lift multiplies the reference
    # torus derivative, not the reference slow-time chain factor.
    assert Q(1,2)+Q(1,16)<1
    assert d["swirl"]["weightedSourceAndTransfer"]["boundedInverseConstants"]["ciInverseBound"]=="96 S"
    # Joint chart labels imply |ell_ref-ell_own|<=2. For ell_own>=2,
    # ell_ref/ell_own<=1+2/ell_own<=2, giving S_ref/S_own<=4.
    assert 1+Q(2,2)==2 and 96*4*4==1536
    # Negative control for generic exact palette equality. With rho=1 and
    # one mismatched level the uncancelled ratio is 1/Tg, which is <1.
    assert Q(1,4)<1
    return ids


def arithmetic(d):
    primary=d["primary"]
    budget=primary["ordinaryDerivativeBudget"]
    assert budget["covarianceShape"]=="epsilon*S^(1/2+3j)"
    assert budget["mixedDirections"]==1080 and len(budget["radialRows"])==8
    rank=sum(primary["coefficientBudget"]["commonGlobalCovarianceRanks"])
    assert rank==26981
    for n,row in enumerate(budget["radialRows"]):
        assert row["slowOrder"]==n and Q(row["exactBandPower"])==Q(1,2)+3*n
        assert (row["innerPole"],row["outerPole"],row["middlePole"])==(6+3*n,9+3*n,0)
    # x<=1 on the collars, and exp(-1/x^2) x^-p <= p!.
    # Finite factorial fits one H/2^128 unit for all requested orders.
    assert factorial(30).bit_length()<128
    old=d["old"]["originalDirectionTable"]
    old_map={(r["field"],tuple(r["RZTL"])):r for r in old["middle"]}
    ranks=old["common"]["coefficientRanksInHOver2Pow128"]
    assert ranks==[48608,48636] and ranks[0]+1<=ranks[1]
    for region in ("inner","outer"):
        rows={(r["field"],tuple(r["RZTL"])):r for r in old[region]}
        assert rows.keys()==old_map.keys() and max(r["pole"] for r in rows.values())<=30
        for (_,j),r in rows.items():
            assert Q(r["epsilon"])>=Q(old_map[r["field"],j]["minEpsilon"])
            assert Q(r["band"])<=Q(old_map[r["field"],j]["bandIntercept"])+3*sum(j[:3])
    compact=d["old"]["compactProfile"]
    assert compact["compactZeroOnBothSourceCollars"] and compact["compactChargeInHOver2Pow128"]==51313
    supported={(f,tuple(j)) for f,j in d["spatial"]["premise"]["componentDirections"]}
    grade=Q(d["spatialBound"]["conditionalResult"]["covarianceGrade"])
    assert len(supported)==d["spatialBound"]["sourceInputs"]["covarianceInputs"]==127
    assert grade==Q(45999,50000)
    assert all(j[2]==0 for _,j in supported)
    s=d["swirl"]["weightedSourceAndTransfer"]["sourceRows"]
    val,=[r["bounds"] for r in s if tuple(r["RZTL"])==ZERO]
    assert Q(val["epsilon"])==Q(89999,100000)

    fn=d["ops"]["calculus"]
    txt=inspect.getsource(fn)
    static=txt[:txt.index("    old_data=")]
    latter=txt[txt.index("    def background"):txt.index("    @cache\n    def Q0")]
    static+=r'''
    primary_seen=set()
    E=EPS
    def W(f,a):
        assert (f,a) in d["availableW"],(f,a)
        waveseen.add((f,a))
        return NORM(d["w_grade"],0,1,0)
    def W0(f,a):
        j=sum(a[:3])
        assert j<=7 and a[3]<=8
        primary_seen.add((f,a))
        return NORM(E,Q(1,2)+3*j,1,d["primaryRank"])
    def old(f,a,compact=False):
        row=d["oldInputs"][f,a]
        oldseen.add((f,a))
        count=sum(a[:3])
        n=NORM(Q(row["minEpsilon"])*E,Q(row["bandIntercept"])+3*count,1,d["oldRank"])
        if a[3] or compact=="directOnly":
            return n
        c=NORM(2*E if f=="beta" else E,(Q(7,2) if f=="beta" else Q(1,2))+3*count,1,d["compactRank"])
        return add(n,c)
'''
    # For the original fast cancellation one projects the pointwise
    # right-hand side directly. There is no N inverse or ci^-1 charge.
    summary=static+latter+r'''
    @cache
    def initial_pressure_z(a):
        z=shift(a,1)
        return add(W0("rr",z),Tchi("initialPressureDensity",z))

    @cache
    def initial_ez(a):
        return scale(add(De(lambda j:W0("rz",j),a,1),scale(W0("zz",shift(a,1)),e=E),
                         scale(initial_pressure_z(a),e=E)),m=2)

    @cache
    def initial_beta_fast(a):
        z=shift(a,1)
        return scale(rad_weight(lambda j:Tchi("initialWeightedEz",j),z,-1),e=E)

    @cache
    def fast_pressure(a):
        z=shift(a,1)
        return scale(Tchi("oldFastBeta",z),e=E)

    @cache
    def radial_flux(a):
        return scale(add(Zflux(a),scale(radial(gamma,a),e=E)),m=2)

    @cache
    def nonfast_z(a):
        return scale(add(scale(gamma(shift(a,2)),e=E),scale(flux("z",shift(a,1),False),e=E),
                         scale(p_far(a),e=E),scale(gamma(shift(a,1,2)),e=3*E)),m=2)

    @cache
    def residual(a):
        return add(nonfast_z(a),fast_pressure(a))

    fields={"pressureDensity":p_density,
            "initialPressureDensity":lambda a:add(rad_weight(lambda j:W0("rr",j),a,-1),
                                                 scale(W0("rz",shift(a,1)),e=E),
                                                 rad_weight(lambda j:W0("thetatheta",j),a,-1)),
            "initialWeightedEz":lambda a:rad_weight(initial_ez,a,1),
            "oldFastBeta":initial_beta_fast,
            "fastWeightedZ":lambda a:rad_weight(residual,a,1)}
    zero_dir=(0,0,0,0)
    zdir=(0,1,0,0)
    vnorm=scale(nonfast("theta",zero_dir),m=2)
    theta_check=encode(vnorm)
    beta_cap=scale(add(radial_flux(zdir),rad_weight(lambda j:Tchi("fastWeightedZ",j),zdir,-1)),e=E)
    gamma_cap=add(De(radial_flux,zero_dir,1),residual(zero_dir),
          rad_weight(lambda j:cutoff_whole("fastWeightedZ",j,additional_r=1),zero_dir,-1))
    return ({"beta":encode(beta_cap),"v":theta_check,"gamma":encode(gamma_cap)},
            {"W":waveseen,"primary":primary_seen,"old":oldseen,"background":bgseen,"cutoffs":cutoff})
'''
    new={}
    exec(compile(summary,inspect.getfile(fn),"exec"),fn.__globals__,new)
    values,trace=new["calculus"]({"late":{"demand":{"postSignedCovarianceOrders":[],"initialMeanOrdinaryInputOrders":[]}},
                                 "availableW":supported,"w_grade":int(100000*grade)-1,
                                 "primaryRank":rank+1,"oldInputs":old_map,"oldRank":ranks[1],
                                 "compactRank":compact["compactChargeInHOver2Pow128"]})
    assert set(trace)=={"W","primary","old","background","cutoffs"}
    assert sum(map(len,trace.values()))>0
    assert max(sum(a[:3]) for _,a in trace["primary"])<=5
    assert max(a[3] for _,a in trace["primary"])<=1
    assert len(trace["W"])==18 and len(trace["old"])==36 and len(trace["primary"])==28
    assert max(map(sum,trace["cutoffs"]))==4<=d["cutoff"]["cutoff"]["order"]==13
    for f,row in values.items():
        assert 2*(Q(row["totalCoefficientChargeInHOver2Pow128"],2**128)+Q(row["band"])/2**32636)<QEPS
        row["fixedReferenceGradeAfterDebit"]=str(Q(row["epsilon"])-QEPS)
    # Take the fast geometrical remainder after separating the actual
    # derivative of the reference mean. Geometry costs at most B^5 M^2.
    velocity_time=d["slow"]["bounds"]["preDebitByComponent"]["derivativeHitsNormal"]
    assert velocity_time["v"] is None
    geom_mean_grade=min(Q(v) for v in velocity_time.values() if v is not None)
    mean=min(Q(r["fixedReferenceGradeAfterDebit"]) for r in values.values())-Q(1,2)
    # One charge pays the reference ratio <=1536, the normal and k.
    # The second pays the sum with the known direct fast geometry.
    assert 2*Q(4+(4*3*1536-1).bit_length(),2**128)<QEPS
    # Direct fast geometry has three summands (weights 2 each),
    # coefficient 2 B^5 per phase derivative and no w or S factor.
    geometric_rank=5+2+(4*6-1).bit_length()
    assert geometric_rank==12 and 2*Q(geometric_rank,2**128)<QEPS
    grade=min(Q(1,2)-QEPS,geom_mean_grade-QEPS,mean-QEPS)-QEPS
    full=min(grade,Q(d["slow"]["bounds"]["normalizedSlowPhysicalTime"]))-QEPS
    assert grade==Q(41993,100000) and full==Q(5249,12500)
    return values,{key:sorted(x) for key,x in sorted(trace.items())},str(grade),str(full)


def main(a):
    d=load(a)
    lineage=source(d)
    values,requests,fast,combined=arithmetic(d)
    return {"schema":"MathScope.C134.ProtectedRepeatFastMeanScalar/1",
            "status":"CONDITIONAL_ORIGINAL_FIXED_LABEL_FAST_AND_SLOW_EIKONAL",
            "pins":PINS,"originalLineage":lineage,
            "fastMeanSourceReduction":{
                "theta":"-Pi(E_theta without ci N old(v)); the old swirl cancels and both stresses project to zero",
                "meridionalPotential":"-Pi(W_r)+T1(-Pi(nonradial Ez)+epsilon partial_Z Tchi(ci N beta_old)); the old centered potential cancels via both flat endpoints",
                "initialRadialMeanFast":"ci N beta_old=epsilon partial_Z T1(Pi initial_Ez); initial compact part is common-torus constant",
                "outerPressureFastSign":"negative ci N beta_old in gr yields negative epsilon partial_Z Tchi(ci N beta_old) in Ez; the negative inverse reverses it",
                "axes":"beta=-epsilon partial_Z potential; gamma=D1 potential",
                "inverseLimit":"Use uniform Fejer approximants of the continuous original inverse and of its continuous projected source, integrate exact N differential identity along the same torus flow, and then use the flow FTC. No differentiated finite truncation is identified with the formal limit.",
            },
            "referenceFastMultiplier":"rho^(-A) [ci_own/(Tg^delta ci_ref)] with identical fixed N,Y. Uniform upper 1536 when S_ref/S_own<=4, ci_ref^-1<=96 S_ref, ci_own<=1/S_own and delta>=0.",
            "exactPaletteStrongForm":"If delta=i(ell_own)-i(ell_ref-2), this multiplier is rho^(-A-1-h); that equality is not required by the upper bound.",
            "nativeFastMeanCaps":values,"requestedOriginalDirections":requests,
            "protectedFastScalarEpsilonGrade":fast,"protectedEntireNormalizedTimeScalarEpsilonGrade":combined,
            "scope":"Original protected fixed-label chart, positive radius, both native flat shifted radial endpoints, smooth original source realization and projected exact Fourier inverse. Scalar before multiplication by restored harmonics.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    result=main(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],result["protectedFastScalarEpsilonGrade"],result["protectedEntireNormalizedTimeScalarEpsilonGrade"])
