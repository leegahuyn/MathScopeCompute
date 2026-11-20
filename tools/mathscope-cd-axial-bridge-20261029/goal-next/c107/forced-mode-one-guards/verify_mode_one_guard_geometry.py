"""Replay high original Forced geometry on the inner and outer admitted charts."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import inspect
from itertools import product
import json
from math import comb, factorial
from pathlib import Path
import runpy
import struct


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
STAGE = BAND / "first-forced-budget"
PINS = {
    "demand": "f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "geometry": "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291",
    "geometryProgram": "7bd56fcac3a23b33d10c6ba1cfe0a56004846ba76d5cd883f4bdd8104c0605b1",
    "cancel": "02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364",
    "geometryRaw": "842cbd054f9bbe6dca985a2cdfc1222aa76f951cb473af1756f0213267fc9cf5",
    "gauge": "b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59",
    "inner": "eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8",
    "innerFactor": "8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61",
    "innerC15": "5e15f58956e40d31904dcd2522f050bc6f72d614a07fc26de664b71ec513e6be",
    "outerC15": "89488720477dca34e5e98f2304a26c0722be72df6bc17278e62790f2cf609c93",
    "backgroundC14": "95155cca443e1a62c0cbc6234a24ba7f8180bac15003e70c46d035309b96c18b",
    "radialBC10": "789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc",
    "primaryC11": "595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8",
    "frameC15": "09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "quotientProgram": "f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74",
    "factorProgram": "1d46d8cd3bb6f5874231f9f1ac8133452eea26730f64f502bf47c075a08c4683",
    "sourceCacheMeta": "da2fa0a74d87c85b608046563330bcdb93b89c9f51174bfd495eacd0f108f244",
}
ZERO = (0, 0, 0)
KAPPA = Q(1, 100000)
CARRIER = {"KNormalR", "KNormalTheta", "KNormalZ"}


def pin(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], (key,path)
    return raw


def read(path, key):
    return json.loads(pin(path,key))


def suborders(a):
    return product(*(range(i+1) for i in a))


def delta(a,b):
    return tuple(i-j for i,j in zip(a,b,strict=True))


def choose(a,b):
    return comb(a[0],b[0])*comb(a[1],b[1])*comb(a[2],b[2])


# Positive ordinary coefficient |c| B^b M_FG^f M_b^m S^s eps^e k^k S^(-rho_g*r).
def cap(c=1,b=0,f=0,m=0,s=0,e=0,k=0,r=0):
    return Counter({(b,f,m,s,Q(e),k,r):Q(c)})


def scale(p,c):
    return Counter({a:c*n for a,n in p.items()})


def mul(p,q):
    out = Counter()
    for a,c in p.items():
        for b,d in q.items():
            out[tuple(i+j for i,j in zip(a,b,strict=True))] += c*d
    return out


def encoded(poly):
    return [[str(c),*map(str,a)] for a,c in sorted(poly.items()) if c]


def compact_rank(poly):
    if not poly:
        return 0
    finite = sum(poly.values()).__ceil__().bit_length()
    return finite+max(sum(key[:3]) for key in poly)


@cache
def nth(tag,a):
    r,z,l=a
    j=r+z
    if l:
        return Counter()
    frozen = {"epsilon":cap(e=1),"timeFast":cap(s=-1),"vr1":cap(),"vt0":cap(),
              "meanReferenceInvSqrt":cap(4),"meanReferenceInvAxial":cap(4),
              "meanReferenceVelocityFactor":cap(4),"KCarrierP":cap(b=5,k=1),
              "normalizedPulseRate":cap(5,b=6,f=1)}
    if tag in frozen:
        return frozen[tag] if a==ZERO else Counter()
    if tag in ("invR","invR2","twiceInvR2","KNormalTheta","twiceKNormalTheta"):
        if z:
            return Counter()
        power = 2 if "R2" in tag else 1
        c = factorial(r) if power==1 else factorial(r+1)
        double = 2 if tag.startswith("twice") else 1
        normal = int("Normal" in tag)
        return cap(double*c,b=power+r+5*normal,k=normal)
    if tag in ("radialFast","radialFastR"):
        if z:
            return Counter()
        # a is proportional to R^(d_r-1); a_R is proportional to R^(d_r-2).
        # Each falling factor at the jth stage is bounded by 2*j.
        shifted = int(tag=="radialFastR")
        return cap(2**(r+3+shifted)*factorial(r),b=r+3+shifted,e=-KAPPA,r=1)
    if tag in ("KNormalR","twiceKNormalR","KNormalZ","twiceKNormalZ"):
        double=2 if tag.startswith("twice") else 1
        axial=int(tag.endswith("Z"))
        # Use the original cone for n itself. The positive slow derivative
        # spends the retained w <= Lmax*S and one shifted derivative of F/G.
        return cap(double,b=4,k=1) if not j else cap(2*double,b=6,f=1,s=1,e=axial,k=1)
    if tag in ("KNormalRRadial","KNormalZAxial"):
        return cap(2,b=6,f=1,s=1,e=int(tag=="KNormalZAxial"),k=1)
    if tag in ("KNormalRY0","KNormalRY1"):
        # From the original fixed palette and affine source bound v_Y <= 6^5*S.
        return cap(2*6**5,b=5,f=1,s=1,k=1)
    assert tag=="KPhaseTime",tag
    return cap(2,b=5,f=1,k=1)+cap(2,b=6,f=1,s=1,e=1,k=1)


@cache
def differentiate(tags, a):
    if not tags:
        return cap() if a==ZERO else Counter()
    coeffs = Counter()
    for b in suborders(a):
        coeffs.update(scale(mul(nth(tags[0],b),differentiate(tags[1:],delta(a,b))),choose(a,b)))
    return coeffs


def pressure_geometry(directions, geometry, raw):
    charts = {x["chart"]:x for x in geometry["chartRows"] if x["mode"]==1}
    assert len(charts)==10 and all(len(x["matchedOpaqueFactors"])==22 for x in charts.values())
    signatures = Counter()
    phaseterms = 0
    retained = 0
    paired_mean = 0
    geometry_factor_count = Counter()
    scalar_rows = []
    all_tags=set()
    for case in raw["cases"]:
        if case["mode"]!=1:
            continue
        mapped = charts[case["chart"]]
        assert mapped["sourceSystem"]==case["system"] and mapped["fixedEndpoint"]==case["nativePulseVariable"]
        tags = {int(i):tag for i,tag in mapped["matchedOpaqueFactors"].items()}
        all_tags.update(tags.values())
        source_fields = {x["root"]:x for x in case["rawJetAtoms"]}
        for scalar in case["scalars"]:
            local = Counter()
            for c,factors in scalar["termsAfterFactoringPToMode"]:
                kinds = tuple(sorted(tag for i,m in factors if i in tags for tag in [tags[i]]*m))
                means = [source_fields[i] for i,m in factors if i not in tags and source_fields[i]["role"]=="mean"]
                assert len({*kinds})<=4 and len(means)<=1
                geometry_factor_count[len(kinds)] += 1
                if "KPhaseTime" in kinds or (means and CARRIER.intersection(kinds)):
                    phaseterms += 1
                    continue
                if any(dict(zip((17732748,17732749,17732750,17732737,17745430,17745431),
                                    m["orders"],strict=True))[17745431] for m in means):
                    paired_mean += 1
                    continue
                retained += 1
                local[kinds] += abs(Q(c))
                signatures[kinds] += 1
            scalar_rows.append(local)
    assert len(scalar_rows)==60 and phaseterms==360 and retained==2620
    assert phaseterms+retained+paired_mean==3080
    assert len(all_tags)==21
    assert dict(geometry_factor_count)=={0:40,1:390,2:1230,3:1060,4:300,5:60}
    old = geometry["conditionalCoefficientCaps"]["actualCoefficientProfiles"]
    for tag in all_tags:
        for r,z in product(range(5),repeat=2):
            if r+z>4:
                continue
            allowed={tuple(map(Q,x)) for x in old[tag]["envelopesBySlowOrder"][r+z]}
            assert all(key[3:] in allowed for key in nth(tag,(r,z,0))), (tag,r,z)

    @cache
    def bound_signatures(tags,a):
        # b lands on native geometry and the remainder stays on the field factors.
        terms = Counter()
        for b in suborders(a):
            terms.update(scale(differentiate(tags,b),choose(a,b)))
        return terms

    rows = []
    for a in directions:
        polys = []
        for scalar in scalar_rows:
            poly = Counter()
            for tags,c in scalar.items():
                poly.update(scale(bound_signatures(tags,a),c))
            polys.append(poly)
        rows.append({"RZL":a, "scalarCount":len(polys),
                     "maximumGeometryLogRank":max(map(compact_rank,polys)),
                     "retainedGeometryBands":sorted({key[3] for p in polys for key in p}),
                     "maximumAbsGeometryProductCoefficient":str(max(map(lambda p:sum(p.values()),polys)))})
    return rows, {"matchedCharts":len(charts),"retainedOriginalMonomials":retained,
                  "reassociatedCarrierMonomials":phaseterms,"pairedMeanHaarBeforeLMonomials":paired_mean,
                  "distinctOriginalModeOneGeometryTags":len(all_tags),
                  "originalLowerDegreeGradeProfilesReplayed":True,
                  "modeOneRawGeometryFactorMultiplicities":dict(sorted(geometry_factor_count.items())),
                  "geometryProductSignatures":[[k,v] for k,v in sorted(signatures.items())]}


def native_eikonal(geometry,directions):
    e = geometry["eikonalAndMeanTransport"]
    assert e["eikonalAfterOwnChartTransport"].endswith("b*n_r+epsilon*w*(omega_T-G*omega_Z)+n dot Delta.")
    assert len(e["exactSourceChecks"])==10
    assert e["retainedConservativeTerm"].startswith("i*k*(n dot U)*mean remains")
    rows=[]
    for a in directions:
        if a[2]:
            rows.append({"RZL":a,"baselineGeometry":[],"baselineLogRank":0})
            continue
        # b is available only as b/eps. Use the actual transported product,
        # leaving one eps and paying the native k outside this polynomial.
        ng = Counter()
        nrg = Counter()
        for b in suborders(a):
            n = nth("KNormalR",b)
            assert all(key[5]==1 for key in n)
            neutral = Counter({tuple((*key[:5],0,key[6])):c for key,c in n.items()})
            nrg.update(scale(mul(neutral,cap(m=1,e=1)),choose(a,b)))
            ng.update(scale(cap(2,b=6,f=2,s=1,e=1),choose(a,b)))
        poly=nrg+ng+cap(2,b=6,f=1,s=1,e=1)
        assert all(k[4]==1 and k[5]==0 and k[3]<=1 for k in poly)
        rows.append({"RZL":a,"baselineGeometry":encoded(poly),"baselineLogRank":compact_rank(poly)})
    return rows


def old_cutoff(goal, prior):
    path = goal/BAND/"initial-mean-norm/primary/verify_primary_quotient.py"
    pin(path,"quotientProgram")
    f = runpy.run_path(str(path))["cutoff_constants"]
    source = inspect.getsource(f)
    assert source.count("maximum=9")==1
    scope = {}
    exec(compile(source.replace("maximum=9","maximum=19"),str(path),"exec"),f.__globals__,scope)
    expanded = scope[f.__name__]()
    assert expanded["maximumOrdinaryOrder"]==19
    for role,values in prior.items():
        if isinstance(values,list):
            assert expanded[role][:len(values)]==values,role
    return {"maxOrder":19,"integerParts":{name:[int(x).bit_length() for x in seq] for name,seq in expanded.items()
            if isinstance(seq,list) and all(isinstance(x,(int,str)) for x in seq)}}


def gaussian(a,pole,n):
    coeffs=[Q(1)]
    result=[]
    for j in range(n+1):
        absolute=sum(abs(c)*Q(1,16)**i for i,c in enumerate(coeffs))
        result.append({"order":j,"gaussianPolynomial":[str(v) for v in coeffs],
                       "absoluteOnQuarter":str(absolute),"poleWithoutBase":3*j})
        following=[Q(0)]*(len(coeffs)+1)
        for i,c in enumerate(coeffs):
            following[i]+=2*a*c
            following[i+1]+=(2*i-pole-3*j)*c
        coeffs=following
    return result


def physical_gaussian(directions, native):
    inner=gaussian(Q(1,2),Q(0),12)
    inner_upper=gaussian(Q(1,2),Q(3,2),12)
    outer=gaussian(Q(2),Q(3,2),12)
    for name,series in (("inner",inner),("outer",outer)):
        assert native[name][:13]==[{"order":row["order"],"additionalPole":row["poleWithoutBase"],
                                  "polynomialCapOnQuarter":row["absoluteOnQuarter"]} for row in series]
    # The original chart majorant works for the coordinate profile itself
    # (multiplier one). At j>=1 use (j-1)! X^-j, and for u only an extra
    # t1^-1. The integer factor is absorbed by two powers of Renv.
    max_order=12
    assert 4803+factorial(max_order).bit_length()<8192
    local_power=323+max_order+1+2
    bells=[1]
    for k in range(max_order):
        bells.append(sum(comb(k,i)*bells[i] for i in range(k+1)))
    assert bells[-1]==4213597
    coeff_bits=max(Q(row["absoluteOnQuarter"]).__ceil__().bit_length() for series in (inner_upper,outer) for row in series)
    assert coeff_bits+bells[-1].bit_length()<4096
    assert local_power*max_order+1<4096
    assert all(sum(a[:2])+2<=max_order for a in directions)
    return {"profiles":{"nativeInner":inner,"innerUpper":inner_upper,"outer":outer},
            "partialRadiusRecipe":{"maximumOrder":max_order,"XInverseUpper":"Renv",
              "innerT1InverseUpper":"Renv","mixedUDerivativeAndDDerivativeUpperRenvPower":local_power,
              "largestCompositionPowerIncludingIntegerReserve":local_power*max_order+1,
              "finitePartitionCountAtHighestOrder":bells[-1],"singleGaussianDerivativeCoefficientBits":coeff_bits,
              "allChartSpacetimeGaussianDerivativesOfOrderJ":"Bnorm times the same Gaussian and distance^(-3j)",
              "positiveLDerivativesVanish":True}}


def native_palette(cache_path, source_stream):
    meta=read(cache_path/"cache.json","sourceCacheMeta")
    assert meta["verify"]==source_stream and source_stream["nodes"]==22155584
    # The full original geometry replay authenticates these same cache bytes.
    # Keep the actual dependency rows for the analytic falling-factor bounds.
    expected={
        474:("rational",["4","1"]), 24:("rational",["2","1"]),
        3622:("sqrt_positive",[24]), 14220487:("add",[474,3622]),
        17734041:("add",[474,17733067]), 17733067:("multiply",[20,3622]),
        17732741:("integer_power",[17732737,2]), 17732743:("multiply",[9,17732742]),
        17732744:("exp",[17732743]), 17732745:("sqrt_positive",[17732744]),
        17732746:("inverse",[17732745]), 17732747:("ceiling",[17732746]),
        17733012:("multiply",[127,17733011]), 17733011:("multiply",[156007,17732737]),
        17733013:("log_positive",[17732737]), 17733014:("multiply",[24,17733013]),
        17733015:("multiply",[20,17733014]), 17733016:("add",[17733012,17733015]),
        17733017:("log_positive",[14220487]), 17733018:("inverse",[17733017]),
        17733019:("multiply",[17733016,17733018]), 17733020:("multiply",[20,17733019]),
        17733021:("ceiling",[17733020]), 17733022:("multiply",[20,17733021]),
        17733023:("multiply",[17733017,17733022]), 17733024:("exp",[17733023]),
        17733025:("multiply",[156007,17732742]), 17733026:("exp",[17733025]),
        17733027:("multiply",[17733024,17733026]), 156007:("add",[1,9]),
        17734042:("log_positive",[17734041]), 17734043:("multiply",[17733018,17734042]),
        17734044:("rational",["1","100000"]), 17734045:("multiply",[156007,17734043]),
        17734046:("multiply",[9,17734044]), 17734047:("multiply",[20,17734046]),
        17734048:("add",[17734045,17734047]), 17734049:("multiply",[24,17734048]),
        17734050:("sqrt_positive",[17732740]), 17734058:("multiply",[17733022,17734042]),
        17734059:("exp",[17734058]), 17734060:("log_positive",[17734051]),
        17734061:("multiply",[17734049,17734060]), 17734062:("exp",[17734061]),
        17735151:("inverse",[17734051]), 17735152:("multiply",[17734050,17735151]),
        17735153:("multiply",[17734049,17735152]), 17735154:("multiply",[17734062,17735153]),
        17735155:("multiply",[17734059,17735154]),
    }
    with (cache_path/"offsets.bin").open("rb") as index, (cache_path/"records.jsonl").open("rb") as stream:
        for i,(op,args) in expected.items():
            index.seek(8*i)
            stream.seek(struct.unpack("<Q",index.read(8))[0])
            assert json.loads(stream.readline())=={"op":op,"args":args},i
    assert 14**2>2*9**2 and 2*2**2<3**2 and 2*(1+Q(1,64))<3
    return {"checkedOriginalNodes":list(expected),
            "palette":"Tg=4+sqrt(2) in (1,6), Lambda=4-sqrt(2), Lambda^2>Tg>Lambda",
            "fixedTimeFactor":"ci=Tg^(-ceil(log_Tg(S*Q^(1+h))))*Q^(1+h) in (1/(Tg*S),1/S]",
            "nativeDy":"Dgeom=4-2*sqrt(2)>1 and |vt0|<1, so |v_Yi|<=6^5*S on all five source levels",
            "radialFast":"dr=2*((1+h)*log(Lambda)/log(Tg)-h/100000) in (1,3); a is dr*R^(dr-1) times the frozen ci^rho_g*epsilon^(-1/100000), with Lambda^(-delta) on the common lift",
            "carrier":"epsilon=Q^h, k=ceil(1/sqrt(epsilon)) in [1/sqrt(epsilon),2/sqrt(epsilon)]"}


def main(args):
    goal=args.goal
    demand=read(goal/"c105/forced-mode-one-high/forced-gauge-demand.json","demand")
    directions=tuple(map(tuple,demand["requests"]))
    assert len(directions)==50 and demand["pairedCases"]==2970
    assert demand["highestSlow"]==[[0,9,0],[1,8,0]]
    geometry_path=goal/STAGE/"geometry/outer-forced-geometry.json"
    geometry=read(geometry_path,"geometry")
    assert args.geometry_replay.read_bytes()==geometry_path.read_bytes()
    pin(goal/STAGE/"geometry/verify_geometry.py","geometryProgram")
    palette=native_palette(args.source_cache,geometry["sourceStream"])
    cancel=read(goal/STAGE/"principal-mode-cancellation/mode-one/mode1-linear-cancellation.json","cancel")
    assert cancel["postCancellationConditionalGrades"]["commonPostCancellationConditionalEpsilonDegree"]=="99999/100000"
    raw_path=goal/STAGE/"outer-weight-comparison/raw-weights/verify_raw_weights.py"
    pin(raw_path,"geometryRaw")
    raw=runpy.run_path(str(raw_path))
    source=raw["load"](goal/BAND,"factor")
    before=raw["load"](goal/BAND,"primary")
    shapes,incidence=pressure_geometry(directions,geometry,source)
    eikonal=native_eikonal(geometry,directions)

    gauge=read(goal/STAGE/"outer-physical-gauge/source/forced-gauge-spatial.json","gauge")
    provenance=gauge["liveForcedGauge"]
    own=[x for x in provenance["charts"] if x["mode"]==1]
    assert len(own)==10 and all(len(x["cutoffGuards"])==7 for x in own)
    assert all(x["pulse"]==source["normalizedPrimaryByChart"][x["chart"]]["unpulledPulseEndpoint"] for x in own)
    assert all(source["normalizedPrimaryByChart"][x["chart"]]["L_v"]==0 for x in own)
    factor=pin(goal/BAND/"forced-normalized-variation/source/verify_forced_source_factor.py","factorProgram").decode()
    assert "frame.free(graph, v).isdisjoint({frame.R, frame.Z, frame.T})" in factor
    assert "frame.free(graph, xi).isdisjoint({frame.R, frame.Z, frame.T})" in factor
    for row in own:
        assert row["cutoffGuards"][4][1:]==[3617,28826]
        assert row["cutoffGuards"][-1]==[row["pulse"],0,17733029]
    gates={x["chart"]:x["cutoffGuards"] for x in own}

    inner=read(goal/STAGE/"inner-physical-gauge/inner-forced-energy-slice.json","inner")
    inner_factor=read(goal/STAGE/"inner-physical-gauge/source/inner-covariance.json","innerFactor")
    assert inner["sourceInnerTargetSHA256"]==PINS["innerFactor"]
    assert inner_factor["bindings"]["historicalRegularInnerRoots"]==[119712,119713]
    inc=read(args.inner_c15,"innerC15")
    out=read(args.outer_c15,"outerC15")
    assert inc["originalRegularInnerBodies"]==[119712,119713] and out["actualRegularOuterBodies"]==[119567,119694]
    assert inc["outputDerivativeOrder"]==out["outputDerivativeOrder"]==15
    b=read(args.radial_b,"radialBC10")
    bg=read(args.background,"backgroundC14")
    assert b["ordinaryDerivativeOrder"]==10 and b["originalLiveSlabThresholdComparison"]==-1
    assert bg["derivativeOrder"]==14 and bg["comparison"]["sign"]==-1 and "F/G" in bg["use"]
    assert b["normalizedB"].startswith("b/epsilon=")
    p=read(args.primary,"primaryC11")
    f=read(args.frame,"frameC15")
    assert f["cutoffOrder"]==19 and f["matrixDirections"]==816
    assert max(row["slowOrder"] for row in p["weightedQuotientLedger"]["bounds"] if row["role"].startswith("velocity"))==11
    cut=old_cutoff(goal,before["weightedQuotientLedger"]["cutoffDerivativeConstants"])
    # On either collar, |opposite Gaussian log / 2| < 1 from width > 2,
    # t1 < 1/128, u <= 1/4, and d <= 1/4. e < 3 < 4.
    assert Q(2)/(2-Q(1,512))**2<1
    assert Q(1)/(2-Q(1,4))**2/2<1
    assert inc["chart"]["pointwiseCoefficientCap"]=="2^4803*Hc^323"
    assert inc["chart"]["originalBnormFloor"]=="Bnorm>=Renv^4096"
    gauss=physical_gaussian(directions,f["gaussians"])
    result={"schema":"MathScope.C107.ModeOneHighOriginalCollarGeometry/1",
            "status":"VERIFIED_ORIGINAL_GEOMETRY_AND_CONDITIONAL_BOTH_COLLAR_TRANSFER",
            "pins":PINS,"sourceNodeCount":22155584,"directionCount":len(directions),
            "actualFixedPalette":palette,
            "geometryCoordinates":["R","Z","L"],"directions":directions,"pairedPressureCases":2970,
            "nativeGuardTriples":gates,"incidence":incidence,"orderedGeometryRows":shapes,
            "phaseTransportRows":eikonal,"cutoffCoefficientBitLengths":cut,"gaussianRows":gauss,
            "cutoffChain":{"mesh":"mesh arguments ell^6*(R,Z,T) minus fixed original grid indices; each hit costs S^3",
              "longitudinal":"psi(v) is fixed under ordinary R,Z,L and vanishes on neighborhoods of original pulse endpoints",
              "transverse":"xi_R=xi_Z=0 and Lxi=Lambda^delta; derivatives use the original flat bump and retained fixed dilation",
              "fixedBandAndReferenceRatios":"epsilon=Q^h and Qref/Qown are fixed for each original labeled arm",
              "radiusGuard":"keep the exact two original radius endpoints, and apply one-sided vanishing only to terms with the proved Gaussian factor"},
            "gaussianComparisons":{"source":"zeta=exp(-1/u^2-4/d^2), d=log(Xb/Xa)-t1*u",
              "innerUpper":"exp(-1/(2*u^2))*u^-3/2 <= 4*sqrt(zeta)*u^-3/2",
              "outer":"exp(-2/d^2)*d^-3/2 <= 4*sqrt(zeta)*d^-3/2",
              "domain":"0<u<=1/4 or 0<d<=1/4 on original admitted positive charts"},
            "actualGeometryLogRankMaxima":{"originalMonomials":max(x["maximumGeometryLogRank"] for x in shapes),
              "transportBaseline":max(x["baselineLogRank"] for x in eikonal)},
            "geometryNeeds":{"physicalFGOrder":11,"bOverEpsilonOrder":10,"fixedOriginalCutoffOrder":19},
            "remaining":["Join selected geometry to the complete raw mode-one field/mean, existing ordered variation, and covariance pressure rows.",
                         "Original global guard seams and coupled stage energy."],
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS geometry, 50 ordinary RZL with native guard and coefficient incidence",result["actualGeometryLogRankMaxima"])


if __name__=="__main__":
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    for name in ("goal","geometry-replay","source-cache","inner-c15","outer-c15","radial-b","background","primary","frame","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
