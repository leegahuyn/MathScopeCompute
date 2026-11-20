"""Exact ordinary R,Z,L grade replay for the original whole-path temporal mean."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path


BAND = Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS = {
    "directions": (BAND/"temporal-weighted-inverse/first-forced-covariance/mean-direction.json",
                   "65c7c4dedd18a6dcc25ed5d8a4e5b274d0a3911b923f737d7df21dd50c76e42d"),
    "pressure": (BAND/"signed-polynomial-shell/initial-temporal/initial-temporal.json",
                 "8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460"),
    "caps": (BAND/"initial-mean-norm/initial-mean-caps.json",
             "2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a"),
    "gauge": (BAND/"first-forced-budget/outer-physical-gauge/source/forced-gauge-spatial.json",
              "b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59"),
    "physical": (BAND/"first-forced-budget/outer-physical-gauge/outer-forced-energy-slice.json",
                 "a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd"),
    "lean": (BAND/"first-forced-budget/outer-physical-gauge/lean-github/receipt.json",
             "0cb7cfef4f66265cf0022131e17a5da4eb4360d76c4e565b83929d56c079113e"),
    "modeOne": (BAND/"first-forced-budget/principal-mode-cancellation/mode-one/mode1-linear-cancellation.json",
                "02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364"),
    "modeTwo": (BAND/"first-forced-budget/principal-mode-cancellation/mode-two/mode-two-tangency.json",
                "f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a"),
}
RUNTIME_PINS = {
    "source-global-current.mjs": "93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760",
    "source-global-pressure.mjs": "fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d",
    "source-temporal-potential.mjs": "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8",
    "source-pressure.mjs": "fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f",
}
RATE_DENOMINATOR = 100000


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def add(*rows):
    result = Counter()
    for row in rows:
        result.update(row)
    return dict(result)


def scale(terms, coefficient=1, eps=0, band=0, geometry=0):
    return {(s+band, e+eps, g+geometry): c*coefficient for (s,e,g), c in terms.items()}


def shifted(a, axis, order=1):
    result = list(a)
    result[axis] += order
    return tuple(result)


def record(demands):
    inputs, integrals, cutoffs, inverse_sources = set(), set(), set(), set()

    def radius_product(name, order, exponent=1):
        # All nonzero ordinary derivatives of R and of R^-1 have one fixed geometry charge.
        r, z, l = order
        return add(*(scale(norm(name, (r-k,z,l)), comb(r,k), geometry=1)
                     for k in range(r+1) if exponent == -1 or k <= 1))

    @cache
    def integral(name, order, whole):
        # Differentiate in slow R only, so the moving left endpoint survives.
        # The globally periodic azimuthal lift shifts by phi(r)-phi(R).
        integrals.add((name, order, whole))
        r,z,l = order
        if r == 0:
            return scale(norm(name, order), geometry=1)
        carrier = [scale(integral(name, (r-1-k,z,l+1), whole),
                         comb(r-1,k), eps=-1, geometry=1) for k in range(r)]
        if not whole:
            carrier.append(norm(name, (r-1,z,l)))
        return add(*carrier)

    def chi_whole(name, order, chi_r=0):
        r,z,l = order
        terms = []
        for j in range(r+1):
            for k in range(z+1):
                actual_cutoff_deriv = (j+chi_r,k)
                cutoffs.add(actual_cutoff_deriv)
                terms.append(scale(integral(name,(r-j,z-k,l),True),
                                   comb(r,j)*comb(z,k),geometry=int(actual_cutoff_deriv!=(0,0))))
        return add(*terms)

    def t0(name, order):
        return add(integral(name,order,False), chi_whole(name,order))

    @cache
    def norm(name, order):
        r,z,l = order
        if name.startswith("W_"):
            inputs.add((name, order))
            return {(Q(1,2)+3*(r+z), RATE_DENOMINATOR, 0):Q(1)}
        if name == "pressure_integrand":
            return add(radius_product("W_rr",order,-1),
                       scale(norm("W_rz", shifted(order,1)),eps=RATE_DENOMINATOR),
                       radius_product("W_thetatheta",order,-1))
        if name == "pZ":
            # Project rho P and the background stress away only on the original temporal inverse.
            # Integral of D_r W_rr is its fixed-endpoint difference under the original lift.
            return add(norm("W_rr",shifted(order,1)), t0("pressure_integrand",shifted(order,1)))
        if name in ("Etheta","Ez"):
            radial,axial,e = ("W_rtheta","W_thetaz",2) if name=="Etheta" else ("W_rz","W_zz",1)
            result = [
                norm(radial,shifted(order,0)),
                radius_product(radial,order,-1),
                scale(norm(axial,shifted(order,1)),eps=RATE_DENOMINATOR),
                *(scale(norm(radial,(r-k,z,l+1)),comb(r,k),eps=-1,geometry=1) for k in range(r+1)),
            ]
            result[1] = scale(result[1],e)
            if name == "Ez":
                result.append(scale(norm("pZ",order),eps=RATE_DENOMINATOR))
            return add(*result)
        if name in ("v","gammaDesired"):
            source = "Etheta" if name=="v" else "Ez"
            inverse_sources.update(((source,order),(source,shifted(order,2,2))))
            return scale(add(scale(norm(source,order),Q(85,6)),
                             scale(norm(source,shifted(order,2,2)),Q(85,216))),48,band=1)
        if name == "RgammaDesired":
            return radius_product("gammaDesired",order)
        if name == "T0_RgammaDesired":
            return t0("RgammaDesired",order)
        if name == "A1numerator":
            return chi_whole("RgammaDesired",order,chi_r=1)
        if name == "gamma":
            return add(norm("gammaDesired",order),radius_product("A1numerator",order,-1))
        assert name == "beta"
        return scale(radius_product("T0_RgammaDesired",shifted(order,1),-1),eps=RATE_DENOMINATOR)

    components = {}
    for name in ("beta","v","gamma"):
        rows = []
        for order in demands:
            result = norm(name,order)
            rows.append({"RZL": order, "bandIntercept": str(max(s for s,_,_ in result)-3*(order[0]+order[1])),
                         "minEpsilon": str(Q(min(e for _,e,_ in result),RATE_DENOMINATOR)),
                         "geometryPower": max(g for _,_,g in result),
                         "coefficientMass": str(sum(result.values()))})
        components[name] = rows
    return components, inputs, integrals, cutoffs, inverse_sources


def physical_margin(physical, lean, max_debit):
    assert lean["conclusion"] == "success" and lean["run"] == 44641150504
    assert lean["theorems"] == ["forced_physical_gauge_log_normalization", "outer_forced_reserved_gauge_log_margin"]
    gate = physical["firstStagePotentialSlice"]
    native = Q(gate["commonOriginalNativeEpsilonGrade"])-max_debit
    gain, normalization_cost, one_loss = map(Q, (gate["inverseCarrierGain"], gate["stageOneNormalizationCost"],
                                                   gate["coefficientAndBandEpsilonBudget"]))
    assert native == Q(49997,50000) and (gain, normalization_cost, one_loss) == (Q(1,2),Q(1,10),Q(1,RATE_DENOMINATOR))
    grade = native+gain-normalization_cost-one_loss
    assert grade == Q(139993,100000)
    # q<=2 tau0 and s>=1/2 give Q<=4 tau0. H=-h log tau0 and log2<=H/2^128.
    relative_epsilon_log = 1-Q(2,2**128)
    assert relative_epsilon_log > Q(1,2)
    assert grade*relative_epsilon_log > Q(1,2)
    assert Q(2,2**108) < one_loss
    # log(K) <= -H/2, log(Xb)<=2H/2^128, log2<=H/2^128.
    relative_margin = Q(1,2)+Q(1,10)-Q(40,2**128)
    assert relative_margin > 0 and 40-2*36 == -32
    return {
        "rawGradeAfterSingleAffineMeanDebit": str(native),
        "weightedPhysicalGradeAfterCoefficientAndBandDebit": str(grade),
        "epsilonLogLowerOverH": str(relative_epsilon_log),
        "sameCoefficientReserve": str(one_loss),
        "strictAmplitudeLogMarginOverH": str(relative_margin),
        "conditionalMiddlePotentialSliceUpper": "exp(-H/2)",
        "conditionalMiddleEnergyRatioStrictUpper": "2^-32",
        "existingParametricLeanRun": lean["run"],
        "premise": "The middle raw coefficients use at most one mean operand in any monomial, retain the full admitted coefficient log and band cap, and the FiveMap increment and unprojected source satisfy their separate bounds.",
    }


def main(goal,runtime,out):
    reads = {k:json.loads(pinned(goal/path,digest)) for k,(path,digest) in PINS.items()}
    files = {name:pinned(runtime/name,digest).decode() for name,digest in RUNTIME_PINS.items()}
    m = files["source-global-current.mjs"]
    assert "global-radial-envelope-fixed-in-slow-calculus" in m
    assert "P=scalar(g.integrate(gr),'P')" in m and "fullOriginalStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz]" in m
    n = files["source-global-pressure.mjs"]
    assert "P=current.mean.P" in n and "f=G.sub(gr,G.mul(rho,P))" in n
    assert "fixed-reference-radial-primitive" in n
    assert "pZ=G.sub(G.sub(slowZIntegrals.left,G.mul(G.derivative(chi,Z),integrals.whole)),G.mul(chi,slowZIntegrals.whole))" in n
    potential = files["source-temporal-potential.mjs"]
    assert "gammaDesired,cutoffRemainder" in potential
    assert "physicalIdentity:'Delta gamma=gamma_d-A1(gamma_d); Delta beta=-epsilon*partial_Z T1(gamma_d).'" in potential
    assert "cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)" in potential
    assert "shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)" in files["source-pressure.mjs"]
    assert reads["pressure"]["pressureZFormula"].startswith("I_Z-chi*J_Z-chi_Z*J")
    assert reads["modeOne"]["status"] == "VERIFIED_ORIGINAL_FULL_MODE_ONE_LINEAR_AND_CONSERVATIVE_GROUPS"
    assert len(reads["modeOne"]["chartRows"]) == 10
    assert reads["modeTwo"]["status"] == "VERIFIED_ORIGINAL_MODE_TWO_CARRIER_AND_CONDITIONAL_WEIGHTED_GAIN"
    assert reads["modeTwo"]["scalarCount"] == 60
    old_orders = set(map(tuple,reads["directions"]["meanNativeSourceDemand"]["commonOrdersForBetaVAndGamma"]))
    assert len(old_orders) == 43
    extra = tuple(reads["gauge"]["pureL2MeanClosure"]["onlyNewMeanDirection"])
    assert extra == (0,0,3)
    requests = sorted(old_orders|{extra})
    rows,inputs,integrals,cutoffs,inverse_sources = record(requests)
    summary = {name: {
        "maxBandIntercept": str(max(Q(row["bandIntercept"]) for row in source)),
        "minEpsilon": str(min(Q(row["minEpsilon"]) for row in source)),
        "maxGeometryPower": max(row["geometryPower"] for row in source),
        "maxCoefficientMass": str(max(Q(row["coefficientMass"]) for row in source)),
    } for name,source in rows.items()}
    original = reads["caps"]["globalTemporalMajorants"]
    epsilon_debits = {}
    for name in rows:
        epsilon_debits[name] = Q(original[name]["epsilonPower"])-Q(summary[name]["minEpsilon"])
        assert Q(summary[name]["maxBandIntercept"]) <= Q(original[name]["bandPowerBefore3s"]), (name,summary)
        assert int(summary[name]["maxGeometryPower"]) < 64
        assert Q(summary[name]["maxCoefficientMass"]) < 2**32
    assert epsilon_debits == {"beta":Q(0),"v":Q(0),"gamma":Q(5,RATE_DENOMINATOR)}
    worst_gamma = [row["RZL"] for row in rows["gamma"] if row["minEpsilon"] == summary["gamma"]["minEpsilon"]]
    assert worst_gamma == [(5,0,0)]
    margin = physical_margin(reads["physical"],reads["lean"],max(epsilon_debits.values()))
    max_slow = max(r+z for _,(r,z,_) in inputs)
    max_l = max(l for _,(_,_,l) in inputs)
    assert max_slow <= 7 and max_l <= 8
    assert max(sum(v) for v in cutoffs) <= 7 and factorial(15) < 2**41
    result = {
        "status":"VERIFIED_WHOLE_PATH_TEMPORAL_MEAN_GRADE_CONDITIONAL_GLOBAL_PRIMARY_AND_GEOMETRY",
        "pins":{**{k:digest for k,(_,digest) in PINS.items()},**RUNTIME_PINS},
        "exactDerivativeRoles":{"covariance":len(inputs),"shiftedPrimitive":len(integrals),"inverseForcing":len(inverse_sources)},
        "maxOriginalCovarianceSlowOrder":max_slow,"maxOriginalCovarianceLOrder":max_l,
        "cutoffOrders":sorted(cutoffs),"demands":requests,"components": summary,
        "extraEpsilonDebitsRelativeToOuter":{key:str(value) for key,value in epsilon_debits.items()},
        "worstGammaOrdinaryDirection":worst_gamma,
        "conditionalLoweredPhysicalGradeForAffineMeanDependence":margin["weightedPhysicalGradeAfterCoefficientAndBandDebit"],
        "conditionalPhysicalEnergyComparison":margin,
        "fullRows":rows,
        "closedScope":"Retains chi, chi_R, chi_Z, and the original A1. The original auxiliary-zero-mode pressure defect and background stress are removed only under the same temporal Fourier zero-mode projection.",
        "analyticPremises":[
            "Original whole radial arguments, including those crossed by the integral, are admitted for this fixed reference and native periodic lift. The full covariance is flat zero at both fixed radial endpoints.",
            "The whole three-piece Primary covariance caps hold uniformly with global derivative inputs W0*epsilon*S^(1/2+3(r+z)). Use their attached local Gaussian asymptotics and no pole in this middle whole-path ledger.",
            "All required reciprocal-radius, radius, chi, interval length and normalized a_ref derivative magnitudes are bounded by the supplied fixed geometry base. a_ref retains epsilon^(-1/100000).",
            "The direct original FiveMap increment and original unprojected pressure remain separate.",
        ],
        "finalJets":0,"release":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print(summary)
    print("Covariance, shifted primitives and inverse-source roles:",len(inputs),len(integrals),len(inverse_sources))


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser=ArgumentParser()
    for name in ("goal","runtime","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    main(args.goal,args.runtime,args.out)
