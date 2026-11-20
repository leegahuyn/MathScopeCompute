"""Exact source receipt replay for the first-correction join."""
import argparse
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


STREAM = "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
C108 = "continuation108/first-k1-energy"
G67 = "final67/energy-1013-sharp/correction-budget"
ANGULAR = f"{G67}/spatial-gauge/active-n3-localized-gram/actual"
ACTIVE = "primary-forced-join/active-n3-c5-binding"
FORCED = f"{ACTIVE}/first-wave-guard-traces/first-forced-budget"
SOURCES = {
    "energy": ("work", f"{C108}/first-k1-energy.json", "8d03cf3e9acbafed674b06c80685d198a4da07cffdd85a0f9b8647db6a4bcfb3"),
    "donors": ("work", f"{C108}/k1-donor-join.json", "8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
    "domain": ("work", "continuation109/k1-domain-audit/final/fixed-n3-domain.json", "df338897da4078df56cf8632d4f10a605bdfa16e02a1a331381e389bf5dc8738"),
    "inverse": ("work", "continuation110/k1-analytic-seams/final/directional-inverse-seams.json", "0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "paths": ("work", "continuation110/k1-path-compacts/final/k1-path-compacts.json", "32004b3c7de4b1ac526852301c180db649601785e578f3074f8ee3eae72657f0"),
    "radial": ("work", "continuation112/k1-leaf-joins/final/radial-leaf-joins.json", "9e058d9812861a8026841079c2dd1185991b1c67644ec1dafb9132163075e851"),
    "leafGraph": ("work", "continuation112/k1-leaf-joins/final/original-leaf-graph.json", "7b5f5aa4d54351c79defa881b236eb52e6374faccbf465018a8099af63191cd4"),
    "radialPartition": ("goal", "final67/n7-n8-target-directed/weighted-target-high.json", "75b0bb821dc1a486ced5d88176faffe63645d73534366f11bd1708d39377e25f"),
    "mode": ("goal", f"{ANGULAR}/actual-mode-operands-final.json", "dfc5401fc6561138e3a17fc05d2e38626b2694d96a1848e0008c9e821b958b40"),
    "modeCode": ("goal", f"{ANGULAR}/check_actual_mode_operands.py", "fa3ff4b78a465c7fb0a5652be608f8dce188735dc7093d4484e132e47d5249d4"),
    "oldCross": ("goal", f"{G67}/spatial-gauge/active-n3-angular-cross/angular-cross-final.json", "f2ce47b2822ee0ae07fb907fa62479d96e310ea10048f6ac449785732b479c02"),
    "hilbert": ("goal", f"{G67}/README.md", "1ebf1083670830f4ffec9fff12ca11c4531751bfa1faa02ca99b8d51a67bb659"),
    "gauge": ("goal", f"{ACTIVE}/live-wave-gauge/admitted-uncut-gauge.json", "e02d4c200e6c0950a3fa65fbee063b9f838ecbb34613edbfea536b09f6024263"),
    "forceSeams": ("work", "continuation82/forced-seams/forced-seams-final.json", "888b8575fb5f02c9fac90e37cc757261b2bb7eaf8fea62d1a6ca6b4c544532b1"),
    "inner": ("goal", f"{FORCED}/inner-physical-gauge/inner-forced-energy-slice.json", "eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8"),
    "middle": ("goal", f"{FORCED}/middle-covariance/frame/middle-frame-budget.json", "b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8"),
    "outer": ("goal", f"{FORCED}/outer-physical-gauge/outer-forced-energy-slice.json", "a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd"),
    "earlyModeOne": ("work", "continuation107/forced-mode-one-join/final/mode-one-high-join.json", "e58b46a729dd9029a35c5e5115f3156943e1d9f8eae33c9bff8d6ee2426a81d8"),
    "signedEnergy": ("goal", "c102/signed-sigma/signed-sigma.json", "c68fe265e3eecc53fd91963eb175d529da6cafda7775c6d5aaf09dee406b97da"),
    "sigma": ("work", "continuation108/early-sigma-c6/final/early-sigma-c6.json", "d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "signedGauge": ("goal", "c107/post-signed-gauge/signed-gauge-cutoffs.json", "449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a"),
    "primary": ("work", "continuation98/covariance/final/global-primary-covariance.json", "05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
    "forceSource": ("runtime", "research-ide/mathscope-m3/navier/source-global-forced-current.mjs", "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "initSource": ("runtime", "research-ide/mathscope-m3/navier/source-initialized-angular.mjs", "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "angularSource": ("runtime", "research-ide/mathscope-m3/navier/source-global-angular.mjs", "eb4e4ae44e9bb84713f89d36d1d7ae33cf1b072638d0a8e67e2a90f38d411010"),
    "current": ("runtime", "research-ide/mathscope-m3/navier/source-global-current.mjs", "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
}


def load_sources(roots):
    sources = {}
    for key, (root, relative, digest) in SOURCES.items():
        path = roots[root] / relative
        data = path.read_bytes()
        assert sha256(data).hexdigest() == digest, (key, path)
        sources[key] = json.loads(data) if path.suffix == ".json" else data.decode("utf-8")
    return sources


def has_field(data, key, value):
    if isinstance(data, dict):
        return data.get(key) == value or any(has_field(v, key, value) for v in data.values())
    if isinstance(data, list):
        return any(has_field(v, key, value) for v in data)
    return False


def check_mode_and_envelope(s):
    energy, donors = s["energy"], s["donors"]
    mode, gauge = s["mode"], s["gauge"]
    groups = energy["groups"]
    assert groups == {"forcedModes": [1, 2], "signedMode": 1,
                      "latePotentials": [22150943, 22151952], "directSwirl": 22154876}
    assert donors["pins"]["earlyEnergy"] == SOURCES["energy"][2]
    assert donors["pins"]["sigma"] == SOURCES["sigma"][2]
    assert donors["pins"]["earlyModeOne"] == SOURCES["earlyModeOne"][2]
    assert donors["sourceInputs"]["latePotentials"] == groups["latePotentials"]
    assert donors["sourceInputs"]["lateDirectSwirl"] == groups["directSwirl"]
    assert donors["conditionalResult"]["lateRelativeEnergy"] == "<2^-32"
    assert mode["liveOperands"]["source"]["sha256"] == STREAM
    assert mode["liveOperands"]["A"] == [22154865, 22154869, 22154867]
    assert mode["liveOperands"]["U"] == [22154871, 22154873, 22154875]
    assert "independent of physical theta" in mode["liveOperands"]["mean"]
    assert "a_1 original coordinate-free threshold" in mode["originalLocalization"]["firstStageGate"]
    assert "grad(T) cross A_n" in mode["originalLocalization"]["product"]
    assert "r^2" in mode["originalLocalization"]["physicalTheta"]
    assert "endpoint velocity" in s["hilbert"] and "weighted space-time" in s["hilbert"]
    assert gauge["nativeGaugeDifferenceRoots"] == [22154926, 22154928, 22154930]
    assert gauge["uncutDifferencesOnOpenBranches"] == [0, 0, 0]
    assert gauge["originalGuardedRows"] == 162 and gauge["signedTemplates"] == 10
    rows = mode["liveOperands"]["verifiedAngularCases"]
    assert len(rows) == 30 and set(Counter(row["key"] for row in rows).values()) == {3}
    assert {tuple(row["relativeModes"]) for row in rows} == {(1, 2)}
    cross = s["oldCross"]
    assert cross["source"]["sha256"] == STREAM and cross["source"]["nodeCount"] == 22155584
    assert {str(row["slope"]) for row in rows} == set(cross["source"]["nonzeroIntegerCarrierNodes"])
    assert cross["verifiedActualDifferentFields"]["signedIsSeparate"] == [22030757, 22030808, 22030859]
    for winding in cross["source"]["nonzeroIntegerCarrierNodes"].values():
        assert "rounding" in winding and "fallback" in winding
    assert has_field(s["inner"], "conditionalInnerEnergyRatioStrictUpper", "2^-32")
    assert has_field(s["middle"], "conditionalMiddleEnergyRatioStrictUpper", "2^-32")
    assert has_field(s["outer"], "conditionalOriginalLocalForceEnergyRatio",
                     "J_outer(first Forced two-mode velocity with original first-stage cutoff)^2 / S_R < 2^-32")
    assert has_field(s["middle"], "disjointIntegrationPartition", [
        "0<log(X/Xa)<=t1/4", "log(X/Xa)>t1/4 and log(Xb/X)>1/4", "0<log(Xb/X)<=1/4"])
    assert s["signedEnergy"]["conditionalSignedSliceRelativeEnergy"] == "<2^-32"
    partition = s["radialPartition"]["geometryChecks"]
    assert all(partition[key] is True for key in ("XaLessThan1", "XbGreaterThanExp2", "t1LessThanOneOver128"))
    assert (1 + Q(1, 128)) / 4 < 2  # below the directed lower bound on log(Xb/Xa)
    upper_sqrt3 = Q(7, 4)
    assert upper_sqrt3 ** 2 > 3
    upper = ((upper_sqrt3 + 1) ** 2 + 1)  # a direct bound, useful as a control
    sharpened = 5 + 2 * upper_sqrt3  # expand first, retaining the exact square 3
    unit = Q(1, 2**32)
    assert sharpened == Q(17, 2) < upper
    assert sharpened * unit < 10 * unit < Q(1, 2**28) < Q(1, 2**26)
    return {"sourceLateZeroModeRoots": groups["latePotentials"] + [groups["directSwirl"]],
            "exactPhysicalCarrierRoots": sorted(int(key) for key in cross["source"]["nonzeroIntegerCarrierNodes"]),
            "sameChartAngularCases": len(rows), "sameOriginalGuardRows": gauge["originalGuardedRows"],
            "localizedField": "curl(T*A)+T*B=T*U+grad(T) cross A",
            "forcedPartitionRelativeUpper": "3*2^-32",
            "angularSum": "At each time, full-circle zero/nonzero orthogonality. At a fixed endpoint and for the dissipation integral, exact Pythagoras. With a time supremum, only the upper inequality is used.",
            "relativeEnergyStrictUpper": "17*2^-33", "relativeEnergyUpperFraction": str(sharpened * unit)}


def exact_gaussian_controls():
    result = {}
    # Taylor envelopes are checked through the largest recorded finite pole.
    # The next Taylor term bounds d^(-p-1) exp(-c/d^2), so the trace
    # is even o(d), sufficient for the zero-extension derivative test.
    for name, decay in (("inner", Q(1, 2)), ("outer", Q(2))):
        entries = []
        for pole in range(147):
            m = (pole + 1) // 2 + 1
            assert 2*m - pole >= 2
            entries.append((pole, m, 2*m-pole, str(factorial(m)/decay**m)))
        assert len(entries) == 147
        result[name] = {"minimumExtraPower": min(entry[2] for entry in entries),
                        "verifiedPoleOrder": [0, 146], "gaussianCoefficient": str(decay)}
    assert 1 - Q(1, 2) == Q(1, 2)
    assert Q(1, 4) - Q(1, 2) == Q(-1, 4)
    # The same nonzero Fourier mode taken twice is a cross-term counterexample.
    assert (1+1)**2 != 1**2+1**2
    # Disjoint positive slice energies peak at different times.
    kinetic_wave, kinetic_late = [1, 0], [0, 1]
    assert max(a+b for a, b in zip(kinetic_wave, kinetic_late)) < max(kinetic_wave)+max(kinetic_late)
    # In 2pi-periodic angular units, f_N=N^-2 sin(N*y0) tends to zero,
    # but its second L derivative has the fixed coefficient -1.
    for n in (2, 10, 100):
        assert -n*n*Q(1, n*n) == -1
    return result


def check_native_paths(s):
    domain, path, radial = s["domain"], s["paths"], s["radial"]
    assert domain["actualRows"]["guardedRows"] == 162
    assert domain["actualRows"]["distinctSlowMeshMaps"] == 27
    assert domain["fixedSlab"]["firstOmittedScaleTimesQ"] == ["1", "4"]
    assert path["sameLiveSHA256"] == radial["source"]["liveSHA256"] == STREAM
    assert path["pins"]["inverse"] == SOURCES["inverse"][2] and path["pins"]["domain"] == SOURCES["domain"][2]
    assert radial["pins"]["K"] == SOURCES["paths"][2]
    geometry = path["pathGeometry"]
    assert geometry["referenceS"] == ["1/2", "47/31"] and Q(47, 31) < 2
    assert geometry["liveEtaSquaredAtMost"] == "32/63" and Q(32, 63) < Q(9, 16)
    assert geometry["upperReferenceFaceIntersectsActualK"] is False
    assert geometry["wholeRadialPathXOverOriginal"] == "[31*Xa/94,4*Xb]"
    assert all(name in radial["joinConclusions"] for name in (
        "N0Xa", "N0Internal", "N0Xv", "N0Xb", "positiveXaThroughXkeep",
        "positiveXkeep", "positiveXcut", "positiveASquared", "positiveBumpEndpoints",
        "positiveXplus", "positiveXb"))
    assert radial["source"]["commonLiteralRadialPrefixRecords"] == 123870
    assert radial["source"]["separateRadialASTControls"] == 80
    assert radial["pins"]["graph"] == SOURCES["leafGraph"][2]
    positive = s["leafGraph"]["positiveOrders"]
    assert [(row["order"], row["picard"]["system"], row["raw"]["Pi"], row["globalRoots"]["Pi"])
            for row in positive] == [(1, 0, 50557, 117675), (2, 3, 120235, 120551), (3, 5, 123331, 123642)]
    assert all(row["picard"]["axisDatum"] == [0]*6 for row in positive)
    assert path["derivedPositiveBounds"]["normalSquares"].startswith("|n|^2,n_theta^2+n_z^2 >=")
    assert path["derivedPositiveBounds"]["P"].endswith("on every active closed pulse")
    assert path["derivedPositiveBounds"]["GramDeterminant"].startswith("abs(det H)>=D0/Smax>0")
    demand = s["inverse"]["actualDemand"]
    assert demand["earlyInverseForcingRoles"] == 173 and demand["lateNonfastForcingRoles"] == 25
    assert len(demand["pairedLateDerivativeRows"]) == 13
    for component, alpha, alpha_l2 in demand["pairedLateDerivativeRows"]:
        assert component in ("theta", "z") and alpha_l2 == alpha[:3] + [alpha[3]+2]
    inverse_source = s["inverse"]["source"]
    assert inverse_source["originalInitialCenteredSources"] == [17754253, 17754268]
    assert inverse_source["originalLateCenteredSources"] == [22032006, 22032008]
    assert inverse_source["commonTorusArguments"] == [17745430, 17745431]
    assert inverse_source["fixedWholeRadialEndpoints"] == [17743711, 17743713]
    assert demand["lateCovarianceInputRows"] == 127 and demand["lateShiftedPrimitiveRows"] == 90
    trace = path["actualGaussianTraceInputs"]
    assert trace["initialCovarianceRolesLow"] + trace["initialCovarianceRolesHigh"] == 1030
    assert trace["initialMeanOrdinaryRoles"] == 223
    assert trace["maxSignedGaugePoleBeforeAbsorbingGaussian"] == 146
    return {"sourcePositiveGuardRows": domain["actualRows"]["guardedRows"],
            "sourceDistinctSlowMaps": domain["actualRows"]["distinctSlowMeshMaps"],
            "qOverTau0UpperOnK": "47/31", "oneSidedQUpperFaceNeededOnK": False,
            "radialLeafJoinClasses": len(radial["joinConclusions"]),
            "firstOmittedCoefficientScaleTimesQAtLeast": 1,
            "earlyForcingRoles": demand["earlyInverseForcingRoles"],
            "lateNonfastForcingRoles": demand["lateNonfastForcingRoles"],
            "pairedLateDerivativeRows": len(demand["pairedLateDerivativeRows"]),
            "shiftedPrimitiveRows": demand["lateShiftedPrimitiveRows"],
            "actualCovarianceRowsBeforeAfterSigned": [1030, 127],
            "actualOrdinaryMeanRows": 223,
            "actualCenteredInverseRootsBeforeAfterSigned": [[17754253, 17754268], [22032006, 22032008]],
            "actualBackgroundPressureRawAndGlobalByOrder": [[row["raw"]["Pi"], row["globalRoots"]["Pi"]] for row in positive]}


def check_seam_products(s):
    force = s["forceSeams"]
    assert force["originalStreamSHA256"] == STREAM
    assert len(force["cases"]) == 20 and {c["mode"] for c in force["cases"]} == {1, 2}
    assert {c["supportedScalarCount"] for c in force["cases"]} == {6}
    assert force["counts"]["nativeProjectedComponentsInExactWholePullbackIdeal"] == 120
    assert "preserves xi" in force["transverseCollar"]
    assert "original-integer-lift-pulse-at-Hw-is-w" in s["initSource"]
    assert "original-integer-lift-transverse-fixed" in s["initSource"]
    assert "G.simultaneousSubstitute(lift.v,Y,Hw)" in s["initSource"]
    assert "bandAxis.value,...meshAxes.map(x=>x.value)" in s["current"]
    assert "original open stress shell" in s["current"]
    assert "[0,Ls/5]" in force["pulseCollars"] and "[4Ls/5,Ls]" in force["pulseCollars"]
    assert "Its longitudinal transitions lie inside the pulse box" in s["forceSource"]
    assert "supportCoefficients=[...old.waveRows.flatMap(row=>[...row.velocity,row.pressure])" in s["forceSource"]
    assert "...old.primaryFlatResidual.flatMap(row=>row.value)" in s["forceSource"]
    assert "uncut=family.t.map(x=>G.mul(current.local.slowCutoff.body,G.sqrt(epsilon)," in s["initSource"]
    assert "localMap(G.mul(G.q(1,2),dpsi,x))" in s["initSource"]
    assert "weighted=amplitude.map(x=>G.mul(slowCutoff.body,x))" in s["current"]
    assert "imaginary=dot(G,row,amplitude)" in s["angularSource"]
    sigma = s["sigma"]["commonBound"]
    assert sigma["retainedGaussian"] == "zeta" and sigma["pole"] == 48
    assert s["donors"]["sourceInputs"]["Sigma"] == [22001223, 22001224]
    signed = s["signedGauge"]
    assert len(signed["rows"]) == 79
    for collar in ("inner", "outer"):
        assert [row["extraPole"] for row in signed["GaussianReciprocal"][collar]] == list(range(0, 19, 3))
    return {"forcedZeroDataPulseSystems": 20, "forcedSourceIdealScalars": 120,
            "forcedSlowSourceInputs": ["physical Primary velocity", "linear Primary pressure",
                                       "principal psi derivative with original slow product"],
            "signedSigmaRoots": [22001223, 22001224], "signedGaugeDirections": 79,
            "signedResidualGaussianAfterInverseSqrt": "zeta^(1/2)",
            "checkedGaussianControls": exact_gaussian_controls()}


def main():
    parser = argparse.ArgumentParser()
    for name in ("work", "goal", "runtime", "out"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args()
    s = load_sources(vars(args))
    report = {
        "schema": "MathScope.C113.FirstK1ClosedPathAndAngularEnergyJoin/1",
        "status": "VERIFIED_SOURCE_AND_ANALYTIC_TRACE_IMPLICATION_CONDITIONAL_ORIGINAL_PROFILE_FOUNDATIONS",
        "pins": {key: digest for key, (_, _, digest) in SOURCES.items()},
        "sourceStreamSHA256": STREAM,
        "energy": check_mode_and_envelope(s),
        "nativePaths": check_native_paths(s),
        "seamProducts": check_seam_products(s),
        "residualAnalyticPremises": [
            "Original natural/core and positive-order Picard/datum, C12 concentration and actual continuous B8/I1/I2 roots on the exact C112 operands. This packet replays their implications and does not reprove those foundational profile theorems.",
            "Use the actual finite same-body profile estimates and ordinary source realizations from the C108 donors and C110 paired graph norms. C113 does not independently derive the original analytic estimates from solver output alone.",
            "The donor inequalities are for fixed admitted K1, with original common scalar localization. No globally canonical a1 plateau, later cycles, or off-K extension is inferred."
        ],
        "negativeControls": [
            "A flat Sigma and a flat denominator alone do not ensure a flat quotient. Sigma=zeta^(1/4), a=zeta^(1/2) gives zeta^(-1/4).",
            "The two wave groups can share a physical Fourier mode. A same-mode doubling makes the gradient-plus-velocity square quadruple.",
            "Pointwise instantaneous Pythagoras generally gives a strict inequality after separate time suprema.",
            "Convergence of f alone gives no convergence in the paired graph norm. For f_N=N^-2 sin(N*y0) in angular units, the L^2f_N oscillations have unit amplitude.",
            "An equal radial pressure derivative permits a nonzero additive eta-dependent constant. These three source Picard systems retain true common zero axis data."
        ],
        "firstCorrectionWhole": "CONDITIONAL", "N706": "OPEN", "N805": "OPEN",
        "finalJets": 0, "release": "HOLD"
    }
    args.out.write_bytes((json.dumps(report, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(f"PASS: {len(SOURCES)} pinned inputs, 162 native guards, 120 exact Forced support scalars")
    print("PASS: C108 input allocations strengthened to J(K1)^2/S_R < 17*2^-33 under the stated native premises")


if __name__ == "__main__":
    main()
