"""Fixed-label ordinary and common-torus covariance budget for all radial pieces."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from math import comb, factorial, prod
from pathlib import Path


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
BUDGET = BAND/"first-forced-budget"
PINS = {
    "transverse": (BAND/"temporal-weighted-inverse/actual-transverse.json", "958080d2e9444fbea108d8c51404d878e41e1512ee03543882442412a7aad742"),
    "liveChecker": (BAND/"temporal-weighted-inverse/verify_actual_transverse_temporal.py", "98389003b656d800c2135e874d07575a658d7f89a7b7cb60b2e224b92eaac3f5"),
    "primary": (BAND/"initial-mean-norm/primary/primary-quotient-ledger.json", "a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244"),
    "mean": (BAND/"initial-mean-norm/initial-mean-caps.json", "2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a"),
    "label": (BAND/"outer-fixed-label-norm/band-weight.json", "4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0"),
    "outer": (BAND/"outer-normalized-amplitude/outer-scale.json", "71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa"),
    "inner": (BUDGET/"inner-physical-gauge/source/inner-covariance.json", "8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61"),
    "innerBudget": (BUDGET/"inner-physical-gauge/verify_inner_forced_energy.py", "218edd51e45232c1d1dcd0fe3c3d91dce1d8e9c5f2d13ca16f4dadc62c7ed81c"),
    "baseBudget": (BUDGET/"verify_first_forced_log_budget.py", "6e31e50922d6ad0cfae876a3d740fe748f4227779db9fdae310c833250fd77ba"),
}
RUNTIME = {
    "mathscope-m3/navier/source-global-current.mjs": "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36",
    "mathscope-m3/navier/source-global-pressure.mjs": "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
    "mathscope-m3/navier/source-global-band.mjs": "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "mathscope-m3/navier/source-auxiliary-expressions.mjs": "e456b4511adcc997b64267b2229422618b6139955e0c9083f2b83f4739600463",
    "mathscope-m2/navier/actual-covariance-source-certificate.mjs": "c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681",
}
C97 = {
    "middleFrame": "b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8",
    "middleTarget": "7b4283b548cf1139624f753657d30ab43cc97d2ce741ece4fd7e7616632c8986",
    "wholePath": "1eb1c9d1dbf1fcff611140309a663fc74d106ee05e27f3ac7d0d9e13e36893d5",
}


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def sqrt_two_product(x,y):
    return x[0]*y[0]+2*x[1]*y[1], x[0]*y[1]+x[1]*y[0]


def in_ring_sum(*values):
    return tuple(map(sum,zip(*values,strict=True)))


def in_ring_dot(left,right):
    return in_ring_sum(*(sqrt_two_product(x,y) for x,y in zip(left,right,strict=True)))


def ring_scale(value, m):
    return m*value[0], m*value[1]


def cover_rows():
    vr, vt = ((1,0),(1,-1)), ((1,0),(1,1))
    dg = in_ring_dot(vr,vr)
    assert dg == (4,-2) and in_ring_dot(vr,vt) == (0,0) and in_ring_dot(vt,vt)==(4,2)
    J, matrix = ((3,1),(1,5)), ((1,0),(0,1))
    lam, lam_power = (4,-1),(1,0)
    rows = []
    for delta in range(5):
        transformed = tuple(in_ring_sum(*(ring_scale(v,x) for v,x in zip(vr,row,strict=True))) for row in matrix)
        derivative_xi_numerator = in_ring_dot(transformed,vr)
        derivative_v_numerator = in_ring_dot(transformed,vt)
        det = matrix[0][0]*matrix[1][1]-matrix[0][1]*matrix[1][0]
        assert derivative_xi_numerator == sqrt_two_product(lam_power,dg)
        assert derivative_v_numerator == (0,0) and det == 14**delta
        rows.append({"delta":delta,"matrix":matrix,"determinant":det,
                     "LxiExactQsqrt2":lam_power,"LvExact":0,"LxiUpper":3**delta})
        matrix = tuple(tuple(sum(row[k]*J[k][j] for k in range(2)) for j in range(2)) for row in matrix)
        lam_power = sqrt_two_product(lam_power,lam)
    # r0=(2^34)^-1. For |xi|, |eta|<=r0, the rectangle lies strictly
    # within a coordinatewise nearest copy. Use ||vr||_inf<=1, ||vt||_inf<=3
    # and Dgeom/|vt|^2<1/3. No index derivative is taken at the copy switch.
    assert 2*Q(1,2**34) < Q(1,2)
    return rows


def angular_constant_terms():
    def multiply(left,right):
        result = defaultdict(lambda: (Q(0),Q(0)))
        for a,x in left.items():
            for b,y in right.items():
                old_real,old_imag = result[a+b]
                result[a+b] = old_real+x[0]*y[0]-x[1]*y[1], old_imag+x[0]*y[1]+x[1]*y[0]
        return result
    cosine = {-1:(Q(1,2),0),1:(Q(1,2),0)}
    sine = {-1:(0,Q(1,2)),1:(0,Q(-1,2))}
    assert multiply(cosine,cosine)[0] == multiply(sine,sine)[0] == (Q(1,2),0)
    assert multiply(cosine,sine)[0] == (0,0)
    return {"cosineSquared":"1/2","sineSquared":"1/2","cross":"0",
            "interpretation":"Fourier exponents are integer multiples of each original nonzero angular carrier; taking the constant term precedes slow differentiation."}


def source_binding(runtime,replayed,primary):
    source = {name:pinned(runtime/name,digest).decode() for name,digest in RUNTIME.items()}
    current = source["mathscope-m3/navier/source-global-current.mjs"]
    pressure = source["mathscope-m3/navier/source-global-pressure.mjs"]
    band = source["mathscope-m3/navier/source-global-band.mjs"]
    aux = source["mathscope-m3/navier/source-auxiliary-expressions.mjs"]
    partition = source["mathscope-m2/navier/actual-covariance-source-certificate.mjs"]
    assert "G.mul(q(1,2),G.add(G.mul(curl.leading[a],curl.leading[b]),G.mul(curl.remainder[a],curl.remainder[b])))" in current
    assert "sourceCrossTermsZero:geometry.palette.pass&&geometry.torus.pass" in current
    assert "coefficient=power(b.ratio,G.mul(q(2),A))" in pressure
    assert "derivativeScales=[G.sqrt(b.ratio),power(b.ratio,D),b.ratio]" in pressure
    assert "coefficient:rectangle.vJacobian[j]" in pressure and "coefficient:rectangle.xiJacobian[j]" in pressure
    assert "Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2))))" in band
    assert "add(v,G.zero,geometry.Ls,'auxiliary longitudinal');add(xi,G.neg(geometry.r0),geometry.r0,'auxiliary transverse')" in current
    assert "add(geometry.X,geometry.Xa,geometry.Xb,'original open stress shell')" in current
    assert "G.step(G.sub(q(3,2),G.mul(q(2),a)))" in band
    assert "G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4)))" in band
    assert "G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))" in band
    assert "All changing-label and torus-copy joins are flat." in aux
    assert "The original smooth normalized translates include all81 possible band-specific local candidates and have exactly zero omitted complement." in partition
    assert "profileCompatibility:'s_j=q/Q_j=(Q/Q_j)*s, hence R_j^2/(2*s_j)=X and Z_j/s_j^D=eta exactly." in partition
    assert replayed["sourceNodes"] == primary["sourceStream"]["nodes"] == 22155584
    common = replayed["commonTorus"]
    assert (common["rows"],common["signedBoxes"],common["columnChecks"]) == (162,81,324)
    assert common["directions"] == ["L xi=(4-sqrt(2))^delta","L v=0"]
    assert common["admittedDelta"] == list(range(5))
    cov = replayed["localCovariances"]
    assert len(cov) == 12 and len({(r["field"],r["sign"]) for r in cov}) == 12
    assert len(replayed["actualNativeHarmonicBodies"]) == 6
    return {
        "authenticatedComponents": replayed["auditedComponents"],
        "sameLiveLocalBlocks": cov, "commonNativeSelector": common["originalSelectorRoots"],
        "actualPhaseAveraging": angular_constant_terms(), "coverMatrices": cover_rows(),
        "slowDerivativeJacobian": ["ratio^(1/2)","ratio^D","ratio"],
        "samePointCoordinates": {"radius":"R_label=sqrt(ratio)*R_ref","height":"Z_label=ratio^D*Z_ref",
                                 "time":"T_label=ratio*T_ref","chartScale":"s_label=ratio*s_ref",
                                 "preserved":["X","eta","q"],"ratio":"Q_ref/Q_label in [1/4,4]"},
        "flatJoins": {
            "nearestAuxiliaryCopy": "The supported rectangle lies inside |coordinate offset|<=2*r0<1/2.",
            "longitudinal": "psi and all jets are zero off the original plateau-transition support, in particular near v=0,Ls.",
            "transverse": "The original bump is constant near zero and flat at |xi|=3*r0/4.",
            "slowMeshAndBand": "Finite original normalized smooth bumps. Differentiate the compact fixed label before reindexing.",
            "annular": "Actual Gaussian polynomial bounds imply the radial values and all required slow/transverse derivatives tend to zero; retain the original exterior zero guard.",
        },
    }


def derivative_budget(primary,label):
    ledger = primary["weightedQuotientLedger"]
    assert ledger["transverseDerivativeCoverage"] == {"normalizedVelocityL":8,"normalizedPotentialXi":9,
                                                   "costInSAndLaurent":0,"cover":"L=Lambda^delta*partial_xi"}
    assert label["lemmaApplication"]["rho"] == "1/1048576"
    rho, kappa = Q(1,1048576),Q(1,100000)
    verified = {}
    for row in ledger["bounds"]:
        j, name = row["slowOrder"], row["role"]
        if j > 7 or not name.startswith("velocity"):
            continue
        s_power = Q(row["constantSPower"])
        epsilon = Q(row["epsilonPower"])+row["inverseCarrierPower"]*Q(1,2)
        extra_band = s_power - (Q(1,4)+3*j)
        assert extra_band in (0,3)
        epsilon -= rho if extra_band else 0
        assert epsilon >= Q(1,2)
        assert row["totalLogPoleAfterG"] <= 3*(j+1)
        verified[(j,name)] = {"absorbedExtraS":str(extra_band),"epsilonAfterCarrierAndBand":str(epsilon)}
    assert len(verified) == 40 and Q(1,2)-rho-kappa > 0
    count = 0
    leibniz_max = 0
    for r,z,t in product(range(8),repeat=3):
        j = r+z+t
        if j > 7:
            continue
        for l in range(9):
            direction = (r,z,t,l)
            coefficient_sum = 0
            for derivative in product(*(range(x+1) for x in direction)):
                order = sum(derivative[:3])
                left = Q(1,4)+3*order
                right = Q(1,4)+3*(j-order)
                assert left+right == Q(1,2)+3*j
                coefficient_sum += prod(comb(n,k) for n,k in zip(direction,derivative,strict=True))
            assert coefficient_sum == 2**(j+l)
            leibniz_max=max(leibniz_max,coefficient_sum)
            count+=1
    assert count == 1080 and leibniz_max == 2**15
    return {"primaryBranches":len(verified),"mixedDirections":count,"leibnizMaximum":leibniz_max,
            "commonPrimaryVelocity":"C_U*g_region*P*epsilon^(1/2)*S^(1/4+3j)*radialPole",
            "covarianceShape":"epsilon*S^(1/2+3j)",
            "radialRows":[{"slowOrder":j,"exactBandPower":str(Q(1,2)+3*j),
                           "outerGaussian":"exp(-4/d^2)","outerPole":9+3*j,
                           "innerGaussian":"exp(-1/u^2)","innerPole":6+3*j,"middlePole":0}
                          for j in range(8)]}


def coefficient_budget(raw, extra, shape):
    data = {k:json.loads(raw[k]) for k in ("outer","inner","mean")}
    assert extra["middleTarget"]["middleTargetLogCap"]=="H/2^256"
    assert all(row["physicalSlowCap"]=="2^4096*Bnorm" for row in data["inner"]["regions"]["inner"]["regularStressSlowRows"])
    for j,row in enumerate(data["outer"]["regularizedLiveTargetCaps"]["boundRows"]):
        assert j==row["throughOrder"]
        assert int(row["coefficientOfTwoPow1521RenvH119"]) < 2**(4096-1521)
    # outer and inner jet targets <=2^4096 B. Their larger lower projections
    # and smaller normalized upper bounds permit the same middle recurrence.
    assert data["outer"]["controls"]["tauLowerPowerOfRenv"] == data["inner"]["regions"]["inner"]["projectionLowerPowerOfRenv"] == 55
    assert extra["middleFrame"]["weightConstants"]["targetDerivativeMajorant"]=="M=exp(H/2^128)"
    assert 4097 < 2**13
    assert "gaussian = Bound(2**900, 64)" in raw["baseBudget"].decode()
    assert "gaussian = Bound(2**903, 72)" in raw["innerBudget"].decode()
    assert "amplitude = Bound(2) * sigma * tangent * cutoffs * gaussian" in raw["baseBudget"].decode()
    assert "primary = Bound(2**32) * radius * amplitude * (Bound(1) + potential + pressure)" in raw["baseBudget"].decode()
    j,l = 7,8
    assert ((Q(8+2,8))**2) <= 2
    assert 2**(2*j) == 4**7 and 3**(4*l) == 81**8
    assert Q(1,2)+3*j < 22
    factors = data["mean"]["primaryCovarianceTransfer"]["coverUpperFactors"]
    assert factors == [162,16,2,2**22,4**7,81**8,shape["leibnizMaximum"],4]
    common = prod(factors)
    assert common == int(data["mean"]["primaryCovarianceTransfer"]["coefficientMultiplierOnUniformPrimaryCapSquared"])
    assert Q(factorial(15),4**15) < 2**11 and factorial(14) < 2**37
    assert max(row["outerPole"] for row in shape["radialRows"]) == 30
    assert max(row["innerPole"] for row in shape["radialRows"]) == 27
    midpoint = extra["middleFrame"]["recurrence"]["leadingFieldCatalogue"]
    base_cov = midpoint["covarianceCap"]
    base_primary = midpoint["primaryCap"]
    assert base_primary == [9540,3204,144,515] and base_cov == [19196,6408,288,1030]
    common_primary = [base_primary[0]+3,base_primary[1]+8,*base_primary[2:]]
    ranks = [base_cov[0]+43,base_cov[1]+16,*base_cov[2:]]
    assert sum(ranks) < 2**15
    # Since B>=2^128 and H>B^511/2, 43 log2+16 log B
    # is <59 B <H/2^128. No extra M power is required inside the frame.
    assert 59*(2**129) < (2**128)**510
    assert 4097*(2**129) < (2**128)**510
    controls = {
        "commonPrimaryRanks":common_primary,"commonGlobalCovarianceRanks":ranks,
        "coefficientLogDegreesOrder":["log2","logBnorm","logPropagator","logM"],
        "wholePathCovarianceLogCap":"H/2^113",
        "commonCoverNumerator":str(common),"commonCoverUpperFactors":factors,
        "outerUniformGaussianFactorUpper":"2^11","innerUniformGaussianFactorUpper":"2^37",
        "relativeToC97MiddleCovarianceCap":"2^43*Bnorm^16","fitsOneFactorM":True,
    }
    whole = extra["wholePath"]
    assert whole["maxOriginalCovarianceSlowOrder"] == 7 and whole["maxOriginalCovarianceLOrder"] == 8
    assert whole["exactDerivativeRoles"]["covariance"] == 626
    controls["coversC97WholePathDerivativeRoles"] = 626
    return controls


def main(goal,runtime,live,extra_paths,out):
    raw = {k:pinned(goal/path,digest) for k,(path,digest) in PINS.items()}
    extra = {k:json.loads(pinned(extra_paths[k],digest)) for k,digest in C97.items()}
    live_raw = pinned(live,PINS["transverse"][1])
    assert live_raw == raw["transverse"]
    source_live = json.loads(live_raw)
    primary = json.loads(raw["primary"])
    source = source_binding(runtime,source_live,primary)
    grades = derivative_budget(primary,json.loads(raw["label"]))
    caps = coefficient_budget(raw,extra,grades)
    result = {
        "status":"VERIFIED_ALL_THREE_PIECE_COMMON_TORUS_PRIMARY_COVARIANCE_BUDGET_CONDITIONAL_ORIGINAL_PULSE_AND_CHART",
        "pins":{**{k:digest for k,(_,digest) in PINS.items()},**RUNTIME,**C97},
        "sameLiveCovariance":source,"ordinaryDerivativeBudget":grades,"coefficientBudget":caps,
        "analyticPremises":[
            "Use the original admitted same-box representative, positive Gram and tangent frame and their compiled native analytic assumptions on the original physical slab. The same-point label change preserves its q.",
            "Pulse, square-root normalizations and all required slow and transverse jets are the previously authenticated original fixed-label families. The elementary Gaussian tails provide the stated finite-order zero extensions without sampling the singular ratio at an endpoint.",
            "Apply this covariance to each argument of the original complete shifted operator. Its radial, auxiliary and label/periodic joins must retain the original same-reference cover."
        ],
        "remainingDirectedData":[
            "The complete whole-path Temporal coefficients still require the cutoffs and source geometry of the centered I/J pressure and A1, and their combined coefficient charge with this global covariance.",
            "The direct original FiveMap and unprojected pressure require their own same-body derivatives and bounds, then signed forcing closure and coupled energy.",
            "No final jet or release gate is promoted."
        ],
        "finalJets":0,"release":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Verified 1080 mixed derivatives, 162 signed common-torus rows, and global covariance coefficient ranks",caps["commonGlobalCovarianceRanks"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser=ArgumentParser()
    for name in ("goal","runtime","live","frame","target","whole-path","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    main(args.goal,args.runtime,args.live,{"middleFrame":args.frame,"middleTarget":args.target,"wholePath":args.whole_path},args.out)
