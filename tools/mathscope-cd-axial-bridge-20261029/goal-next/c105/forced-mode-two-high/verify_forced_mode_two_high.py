"""Recompute actual mode-two forcing and gauge grades on the high pressure inventory."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
from itertools import product
import json
from math import comb, factorial, prod
from pathlib import Path
import runpy


BAND = "primary-forced-join/active-n3-c5-binding/first-wave-guard-traces"
EARLIER = "first-forced-budget/signed-mode-two-z5"
PINS = {
    "previous": "f45cfa6ef06091a25e3a75222187773fdca7efb2008d2bd078a3b0a9d9b6671a",
    "matrixSource": "2542d8c356906d8cd1f2b5dc3e0bc3c96a79894744d6dd5c5c4971fcaeebb6c9",
    "primarySource": "f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74",
    "frame": "4552e8b0b8d6d3d850b3e7c03d579ecb5fccb9efbf10df3612a0d86f0200034c",
    "signed": "d7d5d99aa0285e99680f90563b9e27bce8a95877265134165061a7f7745e5cc8",
    "previousVerifier": "6eb6f27e942ec3d583eb67f7bb4387f43c15f24854cfef0f02bc1e84b7b6d283",
    "demand": "f24b678dd43fb5b92e7bca105a51f9e0741a38dad5a6f2210e0f0b8b3ae10cbb",
    "gauge": "b8d5be0df034731fb0a14849058416bc3f15d476d6e9b8b1fe196678894a6a59",
    "factorSource": "1d46d8cd3bb6f5874231f9f1ac8133452eea26730f64f502bf47c075a08c4683",
}


def pin(path, wanted):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == wanted, path
    return data


def adapt(fn, changes):
    text = inspect.getsource(fn)
    for old, new, count in changes:
        assert text.count(old) == count, old
        text = text.replace(old, new)
    scope = {}
    exec(compile(text, inspect.getfile(fn), "exec"), fn.__globals__, scope)
    return scope[fn.__name__]


def suborders(alpha):
    return product(*(range(a + 1) for a in alpha))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b, strict=True))


def subtract(a, b):
    return tuple(x - y for x, y in zip(a, b, strict=True))


def signed_directions(upstream, demand):
    pressure = upstream["orders"]["forcedCovarianceSupremumOrders"]
    by_row = {name: set(map(tuple, rows)) for name, rows in pressure.items()}
    assert set(by_row) == {"rr", "rz", "rtheta", "thetatheta", "thetaz", "zz"}
    all_cov = set().union(*by_row.values())
    assert (0, 8, 0) in by_row["rz"] and max(map(sum, all_cov)) == 8
    offsets = ((0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1))
    generic = set(add(alpha, beta) for alpha in all_cov for beta in offsets)
    demanded = set(map(tuple,demand["requests"]))
    assert len(demanded) == 50 and demanded <= generic
    assert demand["highestSlow"] == [[0,9,0],[1,8,0]] and demand["pairedCases"] == 2970
    assert demand["pins"]["pressure"] == PINS["signed"]
    assert max(map(sum, demanded)) == 9 and (0, 9, 0) in demanded
    assert set(beta for a in demanded for beta in suborders(a)) == demanded
    return by_row, tuple(sorted(demanded))


def matrix_and_primary(band, primary, old_matrix, frame):
    matrix_path = band / "outer-fixed-label-norm/matrix/verify_matrix_s_j.py"
    pin(matrix_path, PINS["matrixSource"])
    old = old_matrix["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    fn = runpy.run_path(str(matrix_path))["verify_degrees"]
    fn.__globals__["ORDER"] = 11
    new = adapt(fn, [("assert tested==165", "assert tested==364", 1)])(
        {"scaleRows": [{"order": j, "normalizedPulseDerivatives": str(2*j),
                        "tangentOverP": str(2*j)} for j in range(12)]})
    ledgers = new["exactDerivativeLedgers"]
    assert all(rows[:9] == old[name] for name, rows in ledgers.items())
    assert frame["frame"]["auditedDirections"] == 560 and frame["cutoff"]["order"] == 17
    assert frame["frame"]["gramWeightSquareRootBandAtThirteen"] == ["51/2", "53/2", "105/4"]
    primary_path = band / "initial-mean-norm/primary/verify_primary_quotient.py"
    program = pin(primary_path, PINS["primarySource"]).decode()
    for literal in ("assert amplitude==amp_prime==[3*j+Q(1,4) for j in range(9)]",
                    "assert potential==potential_prime==amplitude",
                    "row('velocityImaginarySlowZOverP','r,theta',j,potential[j+1],Q(3,2),1,3)",
                    "row('velocityImaginarySlowROverP','theta,z',j,potential[j+1],Q(1,2),1,3)"):
        assert literal in program
    # The original exact Leibniz recurrences extend using the frame's C13
    # polynomial orders. Recover the same linear band slopes first.
    transfer = [0] + [row["tangentOverPBandPower"] for row in new["sourceTargetBandTransfer"]]
    gram, weight, root = [], [], []
    for j in range(12):
        gram.append(max(transfer[i] + transfer[j-i] - Q(1, 2) for i in range(j+1)))
        weight.append(max([Q(1, 2)] + [Q(1, 2)+gram[k]+weight[j-k] for k in range(1,j+1)]))
        root.append(weight[0]/2 if not j else max([weight[j]] + [root[k]+root[j-k] for k in range(1,j)])-Q(1,4))
        assert root[-1] == 2*j + Q(1,4)
        assert max(root[i] + transfer[k] + 3*(j-i-k) for i in range(j+1) for k in range(j-i+1)) == 3*j + Q(1,4)
        assert max(Q(3*(j-k)) + k + Q(1,4) for k in range(j+1)) == 3*j + Q(1,4)
    rows = primary["weightedQuotientLedger"]["bounds"]
    templates = [row for row in rows if row["slowOrder"] == 7 and row["role"].startswith("velocity")]
    assert len(templates) == 5
    for row in templates:
        i = 3 if "Slow" in row["role"] else 0
        for j in range(8):
            prior, = [x for x in rows if (x["role"],x["slowOrder"]) == (row["role"],j)]
            assert Q(prior["constantSPower"]) == 3*j + i + Q(1,4)
            assert prior["totalLogPoleAfterG"] == 3*j + i
        for j in range(8,11):
            rows.append({**row, "slowOrder": j, "constantSPower": str(3*j+i+Q(1,4)),
                         "totalLogPoleAfterG": 3*j+i})
    return ledgers


def geometry_profiles(data):
    profiles = data["geometry"]["conditionalCoefficientCaps"]["actualCoefficientProfiles"]
    mode_tags = set()
    raw_coeff = Q(0)
    scalar_count, max_ordinary = 0, 0
    for case in data["factor"]["cases"]:
        if case["mode"] != 2:
            continue
        tags = next(r["matchedOpaqueFactors"] for r in data["geometry"]["chartRows"]
                    if (r["chart"],r["mode"]) == (case["chart"],2))
        roles = {row["root"]:row for row in case["rawJetAtoms"]}
        for scalar in case["scalars"]:
            scalar_count += 1
            coeff = Q(0)
            for c, monomial in scalar["termsAfterFactoringPToMode"]:
                coeff += abs(Q(c))
                fields = [(roles[i],m) for i,m in monomial if i in roles]
                geom = [(tags[str(i)],m) for i,m in monomial if i not in roles]
                assert sum(m for _,m in fields) == 2 and all(x["role"] == "u" for x,_ in fields)
                assert sum(m for _,m in geom) <= 2
                mode_tags.update(x for x,_ in geom)
                max_ordinary = max(max_ordinary, *(sum(x["orders"]) for x,_ in fields))
            raw_coeff = max(raw_coeff, coeff)
    assert scalar_count == 60 and max_ordinary == 1 and raw_coeff < 2**32
    assert mode_tags == {"epsilon","invR","radialFast","twiceKNormalR","twiceKNormalTheta","twiceKNormalZ","vr1"}
    for row in profiles.values():
        values = row["envelopesBySlowOrder"]
        assert len(values) == 5 and all(v == values[-1] for v in values[1:])
        assert row["everyPositiveLDerivativeAtFixedEndpointIsZero"]
        values.extend([values[-1]]*5)
    return sorted(mode_tags), raw_coeff


def grade_source(previous, mod, data, directions):
    # The original mode-one inventory stays at its original domain. Extend
    # only the source mode which has exactly two Primary factors and no mean.
    baseline = tuple(map(tuple,data["radial"]["radialJetDemand"]["forcingAndMatrixDirections"]))
    mod["assemble"].__globals__["selected_mode_two_directions"] = tuple(sorted(set(baseline)|set(directions)))
    wrapped = adapt(mod["assemble"], [
        ("for alpha in alphas:", "for alpha in selected_mode_two_directions if mode==2 else alphas:", 2),
        ("assert total_slow<=7 and transverse<=8 and base_v<=1", "assert total_slow<=10 and transverse<=8 and base_v<=1", 1),
        ("scalar_budget=scalar_join(data,records,joined)", "scalar_budget={}", 1),
    ])
    result = wrapped(data)
    assert result["termTally"]["mode2RetainedOriginalMonomials"] == 1270
    raw = {tuple(x["RZL"]):x for x in result["rawPerDirection"]["2"]}
    native = {tuple(x["RZL"]):x for x in result["conditionalOrderedVariation"]["2"]["physicalOverP"]}
    for old in (previous["raw"],previous["nativeNormalized"],previous["additionalDownwardClosureRow"]):
        key = tuple(old["RZL"])
        assert json.loads(json.dumps(raw[key] if "rawBandPower" in old else native[key])) == old
    return raw, native


def total_ranks(rows):
    ranks = [max(v) for v in zip(*rows,strict=True)]
    ranks[0] += (len(rows)-1).bit_length()
    return ranks


def coefficient_rows(band, earlier, frame, matrix, raw_coeff, native, directions):
    variation_path = band / earlier["VARIATION"]
    pin(variation_path,earlier["VAR_PIN"])
    v = runpy.run_path(str(variation_path))
    def jets(name, scale=1):
        return [(scale*Q(c),a,s) for c,a,s in matrix[name]]
    operator = [jets("normalizedMode1And2MatrixInfinityNorm"),jets("BLeft",3),
                jets("projector",3),jets("movingBasisInfinityNorm")]
    # Only inverse radius, radialFast, doubled normals, epsilon and vr1
    # occur. With B= Bnorm, M an admitted F/G bound and A=B^6 M,
    # use 2^64 B^128 M for each of these one-factor high geometry bounds.
    # A positive K n_r or K n_z derivative differentiates the original
    # n formulas once more in F,G; its pulse variable is fixed and <=Lmax*S.
    # The negative ci^rho in radialFast remains separate in its epsilon grade.
    assert 4*factorial(10) < 2**64 and 4*3**10 < 2**64 and 9+4 < 128
    geometry = [64,128,0,1]
    primary = frame["primaryUniformLogRanks"]
    assert primary == [19911,5183,234,830]
    base_rank = [2*(a+b) for a,b in zip(primary,geometry,strict=True)]
    raw_coefficient_bits = raw_coeff.__ceil__().bit_length()
    velocity_ranks = {}
    variation = {}
    for a in directions:
        state, physical = v["exact_coefficients"](a,*operator)
        high = sum(a[:2])
        assert [x["orderedMatrixInsertions"] for x in state] == list(range(high+1))
        assert [x["orderedMatrixInsertions"] for x in physical] == list(range(high+1))
        ordered = total_ranks([[Q(x["coefficient"]).__ceil__().bit_length()+4,
                                6*x["maxSourceConstantPower"]+1,x["propagatorPower"],
                                x["maxSourceConstantPower"]] for x in physical])
        rank = base_rank.copy()
        rank[0] += raw_coefficient_bits+2*sum(a)+185+32
        velocity_ranks[a] = [x+y for x,y in zip(rank,ordered,strict=True)]
        variation[a] = {"state":state,"physical":physical,"orderedWords":len(v["words"](a))}
    inv = jets("inverseNormalSquared")
    normals = jets("n")
    all_rows = []
    for a in directions:
        band_power, pole, coeff_sum, exponent, split_count = Q(0), 0, Q(0), 0, 0
        charged = []
        for b in suborders((a[0],a[1],0)):
            nc, na, ns = normals[sum(b)]
            left = subtract(a,b)
            for c in suborders((left[0],left[1],0)):
                ic, ia, ix = inv[sum(c)]
                beta = subtract(left,c)
                slot = native[beta]
                band_power = max(band_power,ns+ix+Q(slot["velocityOverPBandPower"]))
                pole = max(pole,slot["additionalLogPoleAfterGToMode"])
                coeff_sum += 2*nc*ic*prod(comb(x,y)*comb(x-y,z) for x,y,z in zip(a,b,c,strict=True))
                exponent = max(exponent,na+ia)
                charged.append(velocity_ranks[beta])
                split_count += 2
        assert band_power == Q(native[a]["velocityOverPBandPower"])
        assert pole == native[a]["additionalLogPoleAfterGToMode"]
        assert split_count == 2*prod(comb(x+2,2) for x in a[:2])
        ranks = [max(x) for x in zip(*charged,strict=True)]
        ranks[0] += coeff_sum.__ceil__().bit_length()+4
        ranks[1] += 6*exponent
        ranks[3] += exponent
        assert sum(ranks) < 2**16
        all_rows.append({"RZL":a,"orderedVariation":variation[a],"nativeVelocityLogRanks":velocity_ranks[a],
                         "gaugeAfterCarrierFactorRemoved":{"epsilonPower":"99999/100000","zetaPower":1,
                           "bandPower":str(band_power),"poleAfterG2":pole,"outerPoleAfterZeta":pole+3,
                           "conservativeInnerPoleAfterZeta":pole+3,"inverseCarrierFactor":"1/(2*k)",
                           "phaseFreeCrossProductLeibnizTermsPerComponent":split_count,
                           "positiveCrossCoefficientSum":str(coeff_sum),"normalAndInverseExponent":exponent,
                           "positiveLogRanks":ranks,"logCap":"H/2^112"}})
    return all_rows


def main(args):
    band = args.goal / BAND
    previous = json.loads(pin(band/EARLIER/"mode-two-z5.json",PINS["previous"]))
    frame = json.loads(pin(args.frame,PINS["frame"]))
    signed = json.loads(pin(args.signed,PINS["signed"]))
    demand = json.loads(pin(args.demand,PINS["demand"]))
    by_cov, directions = signed_directions(signed,demand)
    gauge = json.loads(pin(band/"first-forced-budget/outer-physical-gauge/source/forced-gauge-spatial.json",PINS["gauge"]))
    assert gauge["status"] == "VERIFIED_ACTUAL_FORCED_GAUGE_SLOTS_AND_CONDITIONAL_L2_CLOSURE"
    live = gauge["liveForcedGauge"]["charts"]
    assert len(live) == 20
    assert sum(len(row["components"]) for row in live if row["mode"] == 2)==60
    previous_source = band/EARLIER/"verify_mode_two_z5.py"
    pin(previous_source,PINS["previousVerifier"])
    earlier = runpy.run_path(str(previous_source))
    raw_path = band/earlier["RAW"]
    pin(raw_path,earlier["RAW_PIN"])
    mod = runpy.run_path(str(raw_path))
    data = {key:mod["load"](band,key) for key in mod["FILES"]}
    factor_path = band/"forced-normalized-variation/source/verify_forced_source_factor.py"
    factor_code = pin(factor_path,PINS["factorSource"]).decode()
    assert "frame.free(graph, v).isdisjoint({frame.R, frame.Z, frame.T})" in factor_code
    chart_factors = data["factor"]["normalizedPrimaryByChart"]
    assert len(chart_factors)==10 and all(x["L_v"]==0 for x in chart_factors.values())
    assert all(row["pulse"]==chart_factors[row["chart"]]["unpulledPulseEndpoint"] for row in live)
    edition = json.loads(pin(band/earlier["MATRIX"],earlier["MATRIX_PIN"]))
    matrix = matrix_and_primary(band,data["primary"],edition,frame)
    tags, coeff = geometry_profiles(data)
    raw, native = grade_source(previous,mod,data,directions)
    gauge_rows = coefficient_rows(band,earlier,frame,matrix,coeff,native,directions)
    highest = [x for x in gauge_rows if sum(x["RZL"])==9 and not x["RZL"][2]]
    assert [x["RZL"] for x in highest]==[(0,9,0),(1,8,0)]
    assert all((x["gaugeAfterCarrierFactorRemoved"]["bandPower"],x["gaugeAfterCarrierFactorRemoved"]["outerPoleAfterZeta"]) == ("37",39) for x in highest)
    k,rho = Q(1,100000),Q(1,1048576)
    assert Q(2*37,2**32636) < rho and rho+Q(2,2**112)<k and 1-k-rho>1-2*k
    result = {"schema":"MathScope.C105.ForcedModeTwoHighSignedPressureGauge/1",
              "status":"VERIFIED_ORIGINAL_MODE_TWO_HIGH_GRADE_AND_COEFFICIENTS_CONDITIONAL_SAME_CHART",
              "pins": {**PINS,"rawGradeVerifier":earlier["RAW_PIN"],"variation":earlier["VAR_PIN"],"oldMatrix":earlier["MATRIX_PIN"]},
              "directions":directions,"pairedCaseCount":demand["pairedCases"],
              "pressureRoles":{name:sorted(orders) for name,orders in by_cov.items()},
              "sourceMonomialCount":1270,"sourceScalarCount":60,"geometryTags":tags,
              "rawMaxRationalCoefficientSum":str(coeff),"requiredOrdinaryPrimaryVelocityOrder":10,
              "requiredOrdinaryPrimaryPotentialOrder":11,"initializedMeanOperandRequired":False,
              "exactC99Z4AndZ5Replay":True,"raw":[raw[a] for a in directions],
              "native":[native[a] for a in directions],"conditionalGaugeRows":gauge_rows,
              "conditionallyAbsorbedEpsilonGrade":"49999/50000",
              "bandAbsorptionPremises":{"HOverMinusLogEpsilonUpper":2,"logSOverHUpper":"2^-32636"},
              "premises":["Original differentiable mode-two tangency gain and two Primary factors in the same admitted fixed-label chart.",
                          "Original positive normalized frame, stable pulse and common transverse derivative L. The source psi at fixed pulse and fixed label is bounded by one and is fixed in ordinary R, Z and L.",
                          "Original radial envelope g squared, zeta conversion, positive F/G cap, and C104 Primary coefficient ranks on the admitted slabs."],
              "open":["High mode one and full retained pressure/covariance on both Signed rows.","Global guard seams, complete K1 and final jets."],
              "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("Mode-two native and gauge coefficients verified",len(directions),
          native[(0,9,0)],"max log rank",max(sum(x["gaugeAfterCarrierFactorRemoved"]["positiveLogRanks"]) for x in gauge_rows))


if __name__ == "__main__":
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    for name in ("goal", "frame", "signed", "demand", "out"):
        parser.add_argument("--"+name, type=Path, required=True)
    main(parser.parse_args())
