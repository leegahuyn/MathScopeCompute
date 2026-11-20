"""Check finite original collar dependencies for the exposed live second T."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

PINS = {
    "frontier": ("work", "continuation134/live-wave-tt/frontier.json", "291c0d4dd3fdba7e920c0ee19b1f93bf00a6bba03663504373843b2c6ed80870"),
    "signedTrace": ("work", "continuation125/sigma-rzt-zzt/verify_sigma_rzt_zzt.py", "12966c42c9ffba95b8696f48be5b7718b8bd56d3f33be1a8507882e0726fb8ec"),
    "modeOneRecipe": ("work", "continuation107/forced-mode-one-join/final/verify_mode_one_high_join.py", "30822610edec2f4c2aea7d0ce9b92a1980d53bab14225b9f1e1c373598e8eb9c"),
    "localOperator": ("work", "continuation119/signed-local-mixed-time/verify_signed_local_mixed_time.py", "dce5393a0f38d57a538f5b1be7e8d417b5c2649367093baa6d7916b2dcd3a8c8"),
    "local": ("work", "continuation107/higher-stress-c6/final/higher-stress-c6.json", "97c679cc958b0e05f9d2feb19b52efd29c12e54b41fc034c08268e81b1633b12"),
    "frame": ("work", "continuation106/frame15/frame-c15.json", "09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
    "primary": ("work", "continuation106/high-compact-mode-one/primary-quotient-c11.json", "595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8"),
    "meanCollar": ("work", "continuation116/noncompact-temporal-t2/final/verify_temporal_t2.py", "aed42a51a096295281e54a2a2372ba8d3142617aaeafb6c26ffe500cab7a8cce"),
    "meanAlgebra": ("work", "continuation102/signed-weighted-mean/final/verify_signed_weighted_initial_mean.py", "e04b53553c683588dafc94d0e93744f39f9483fa376f8ab1a3557d4e6e477f87"),
    "inverse": ("work", "continuation110/k1-analytic-seams/final/directional-inverse-seams.json", "0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "rawFirstForced": ("work", "continuation115/k2-radial-time-analytic/final/verify_first_forced_t_transfer.py", "eaaeba91d9a62e83be10dd494943f36fd6e52616d6f187b094e1b3370b85b06a"),
    "oldFirstForced": ("work", "continuation115/k2-radial-time-analytic/final/first-forced-t-transfer.json", "aa0068461cdfeda7a8ac77700a60a2695c811db8a79a5e9bd854f43e7f37b05a"),
    "signedFast": ("work", "continuation120/signed-pulse-time/signed-fast-pulse.json", "9d58464ea8182764e9354867105ebd9cb8454ddf53d6a70b359fe488849f0b35"),
    "signedInverse": ("runtime", "mathscope-m2/navier/actual-physical-residual-algebra.mjs", "df6f10cda4c77b0b679ded7eb254979e528d133239b2da1ce0904479585d2116"),
    "signedStress": ("runtime", "mathscope-m3/navier/source-signed-stress.mjs", "c0882d323cfb6f23fac966bf9fe86810a569ab5bde5ea2b020d062e6029b1dbd"),
    "liveTrace": ("work", "continuation133/live-radial-trace/live-radial-trace.json", "70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba"),
    "forcedSystem": ("runtime", "mathscope-m3/navier/source-forced-pulse.mjs", "866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9"),
    "forcedCurl": ("runtime", "mathscope-m3/navier/source-mapped-forced-curl.mjs", "3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
}
OFFSETS = ((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))


def load(roots, label):
    root, rel, expected = PINS[label]
    name = roots[root]/rel
    raw = name.read_bytes()
    actual = sha256(raw).hexdigest()
    assert actual == expected, (label, actual, expected)
    if name.suffix == ".py":
        return runpy.run_path(str(name))
    return json.loads(raw) if name.suffix == ".json" else raw.decode()


def down(a):
    return product(*(range(j+1) for j in a))


def plus(a,b):
    return tuple(i+j for i,j in zip(a,b,strict=True))


def envelope(roles):
    orders = list(roles)
    assert orders
    return {"count":len(orders),"slow":max(sum(j[:3]) for j in orders),
            "T":max(j[2] for j in orders),"L":max(j[3] for j in orders)}


def local_operator(mod):
    t, add, mul, scale, derivative, euler = (
        mod[n] for n in ("term","add","mul","scale","derivative","euler"))
    J = t("J:")
    E, E2, E3 = euler(J), euler(euler(J)), euler(euler(euler(J)))
    az = t("aZ")
    radial = lambda p: add(mul(t("e"),p),mul(t("X",multiple=2),derivative(p,"X")))
    tt = add(mul(t("aT"),E),mul(t("a","a"),E2))
    rtt = radial(tt)
    ztt = add(mul(t("aZT"),E),mul(add(t("aT","b"),scale(2,mul(t("a"),az))),E2),
              mul(t("a","a","b"),E3),mul(t("aT","c"),derivative(E,"eta")),
              mul(t("a","a","c"),derivative(E2,"eta")))
    # Compute T(T(Z())) independently. T acts on b as aZ and on c as -D*a*c.
    def chart_T(p):
        pieces = []
        rules = {"a":t("aT"),"aT":t("aTT"),"b":az,"aZ":t("aZT"),
                 "c":t("D","a","c",multiple=-1)}
        for word, coefficient in p.items():
            for i, atom in enumerate(word):
                outside = t(*word[:i], *word[i+1:], multiple=coefficient)
                if atom.startswith("J:"):
                    pieces.append(mul(outside,mul(t("a"),euler(t(atom)))))
                elif atom in {"q","X","eta"}:
                    factors = {"q":t("a","q"),"X":t("a","X",multiple=-1),
                               "eta":t("D","a","eta",multiple=-1)}
                    pieces.append(mul(outside,factors[atom]))
                elif atom in rules:
                    pieces.append(mul(outside,rules[atom]))
        return add(*pieces)
    # Each term linear in J contains its own prefactor s^(-alpha).
    # euler(t(J jet)) handles that prefactor once per original monomial.
    z = add(mul(t("b"),E),mul(t("c"),derivative(J,"eta")))
    assert ztt == chart_T(chart_T(z))
    assert rtt == chart_T(chart_T(radial(J)))
    assert ztt != add(ztt,scale(-1,mul(t("aZT"),E)))
    return {"TT":len(tt),"RTT":len(rtt),"ZTT":len(ztt),"maximumLocalJet":3}


def verify(roots):
    source = {k:load(roots,k) for k in PINS}
    front = source["frontier"]
    assert front["originalSigmaApplications"] == [22001223,22001224]
    live = source["liveTrace"]
    witness = live["coreTimeWitness"]
    assert witness["exactCoefficient"] == "-epsilon" and not witness["presentInSubtraction"]
    assert witness["presentInRawAndSupported"]
    assert witness["protectedNativeBody"] == front["activeCapsule"]["body"] == 22004387
    assert witness["activeCapsule"] == front["activeCapsule"]["id"]
    assert witness["actualTApplication"] == 22161393
    assert live["guard"]["X"] == "R^2/(2*s(Z,T))" and live["guard"]["triple"] == [17732770,3617,28826]
    targets = {tuple(j) for j in front["signedSigmaTargets"]}
    assert targets == {(0,0,2),(0,1,2)}
    nearby = targets | {(1,0,2)}
    c125 = source["signedTrace"]
    ops = c125["pinned"](roots["goal"])["arithmetic"]
    paths = {}
    W = set()
    mean = set()
    local = set()
    for a in sorted(nearby):
        for region in ("inner","outer"):
            r = c125["trace"](ops,a,region)
            paths[(a,region)] = r
            assert not r["cutoffAndDensity"]
            assert all(x[0] not in {"rho","Jtheta","Jz","P"} for x in r["pressureAndSignedPrimitives"])
            for name, b in r["covariance"]:
                W.add((name,b))
                for f in c125["PAIRS"][name]:
                    mean.update((f,(*i,0)) for i in down(b))
            local.update(r["localStress"])
    coverage = {tuple(k["RZT"]) for k in source["local"]["weightedLocalFlux"]["coveredExactDirections"]}
    assert all(sum(j)<=3 for j in local)
    assert all(tuple(j) in coverage or j[2]>0 for j in local)
    assert source["local"]["source"]["positive"]["fullHaarResiduals"] == [21999622,22000445]
    assert source["local"]["weightedLocalFlux"]["sameDisjointNarrowCollars"] == {
        "inner":"0<u<=1/128","outer":"0<d<=1/32"}

    # Covariance Haar retains paired velocity factors. An overcover for every
    # polarization is ordinary R, Z and transverse differentiation of its gauge.
    force = {plus((*b,0),o) for _,a in W for b in down(a) for o in OFFSETS}
    force.update(plus((*b,0),o) for a in nearby for b in down(a) for o in OFFSETS)
    recipes = source["modeOneRecipe"]["grouped_recipes"]()
    mode_one_grouping = {name:len(terms) for name,terms in recipes.items()}
    assert all(any(name in {"U","Uo","P"} for name,_ in row)
               for terms in recipes.values() for row in terms)
    check_raw = source["rawFirstForced"]
    raw_source = check_raw["load"]({"work":roots["work"],"runtime":roots["runtime"]/"mathscope-m3/navier"})
    check_raw["check_sources"](raw_source)
    direct = set()
    mean_map = {"Db":"beta","Dv":"v","Dg":"gamma"}
    for a in force:
        for b in down(a):
            for terms in recipes.values():
                for term in terms:
                    for name,o in term:
                        j=plus(b,o)
                        if name in {"U","Uo","P"}:
                            direct.add((name,j))
                        if name in mean_map:
                            mean.add((mean_map[name],j))
    # Retain a deliberately conservative raw quadratic mode-two allowance.
    # Before Volterra its velocities use one physical gradient, reconstructed
    # from R, Z and L, and the same Native Primary source.
    second = {("U_modeTwo",plus(b,o)) for a in force for b in down(a) for o in OFFSETS}
    direct.update(second)

    work = source["meanAlgebra"]
    _, donor_cov, inverse, prim, _ = source["meanCollar"]["collar"](work,6,sorted(mean))
    # Primary covariance is an original phase-free paired velocity product.
    # Both operands can receive the entire RZTL derivative.
    direct.update(("U_Covariance",j) for _,j in donor_cov)
    ledger = source["primary"]["weightedQuotientLedger"]
    highs = envelope({j for _,j in direct})
    assert highs["slow"] <= 11 and highs["L"] <= ledger["transverseDerivativeCoverage"]["normalizedVelocityL"]
    assert ledger["firstPulseDerivativeCoverage"]["normalizedAmplitudePotentialVelocity"]
    support = source["frame"]
    assert support["matrixDirections"] == 816 and support["cutoffOrder"] == 19
    assert "|n|^2>0 and k!=0" in source["forcedSystem"]
    assert "(1-psi)*f+psi_prime*t" in source["forcedSystem"]
    assert "A_m=i*n(Y) cross (psi(v(Y))*t_m(v(Y),basepoint))/(k*m*|n(Y)|^2)" in source["forcedCurl"]
    assert "normalRow,velocity),cdot(G,n,forcing)" in source["forcedSystem"]
    assert "G.div(x,G.mul(G.q(2),a[j]))" in source["signedInverse"]
    assert "squareRootWeights,epsilon,target:target.Sigma" in source["signedStress"]
    assert "deltaA,b.cutoffs.chi,b.cutoffs.psi,t" in source["signedStress"]
    assert "G.mul(k,f.frame.nSquared)" in source["signedStress"]
    fixed = source["oldFirstForced"]["nativeConditions"]
    assert {"v","xi","Ls","H_w","P"} <= set(fixed["fixedAtNativeT"])
    assert fixed["noEndpointTerms"]
    assert source["oldFirstForced"]["radial"]["logSqrtZetaT"] == "-a/(t1*u^3)+4*a/d^3"
    assert source["signedFast"]["protectedRadialImaginaryCoefficient"] == 22001995
    assert source["inverse"]["tail"]["uniformPointwiseFourierTail"] == "<25*K^(-1/2)*(||f||_2+||L^2 f||_2/36)"
    assert ("rtheta",(0,0,2)) in W

    # Gaussian bookkeeping in half powers accompanies the analytic proof.
    weights = {"primaryWave":Q(1,2),"primaryHaarCovariance":Q(1),
               "primarySignedDenominatorInverse":Q(-1,2),"originalLocalStress":Q(1)}
    weights["initializedNoncompactMean"] = weights["primaryHaarCovariance"]
    weights["firstForcedModeOne"] = min(weights["primaryWave"],
        weights["primaryWave"]+weights["initializedNoncompactMean"])
    weights["firstForcedModeTwo"] = 2*weights["primaryWave"]
    weights["firstForcedHaarCovariance"] = 2*min(weights["firstForcedModeOne"],weights["firstForcedModeTwo"])
    weights["signedTarget"] = min(weights["originalLocalStress"],
        weights["firstForcedHaarCovariance"],2*weights["initializedNoncompactMean"])
    weights["signedWave"] = weights["signedTarget"]+weights["primarySignedDenominatorInverse"]
    assert weights["signedWave"] == Q(1,2)
    return {
        "schema":"MathScope.C134.OriginalRadialWaveSecondTimeGaussians/1",
        "status":"CONDITIONAL_FIXED_LABEL_ORIGINAL_RADIAL_WAVE_TT_TRACE",
        "scope":"Actual W1 radial imaginary TT at both radial faces and listed original Sigma collar roles",
        "activeRoots":{"coupledExpression":"coupled-expression:1363",
                       "protectedBody":22004387,"exposedFirstTime":22161393,
                       "radialFaces":[3617,28826],"liveShellCoordinate":17732770},
        "localOperators":local_operator(source["localOperator"]),
        "rawFirstForcedAudit":{"modeOneRowsByOriginalGroup":mode_one_grouping,
            "eachModeOneRowContainsPrimaryWaveOrPressure":True,
            "modeTwoRawOriginalScalars":60,"modeTwoRawOriginalMonomials":1270,
            "modeTwoChecksBeforeVolterraAndAngularCutoff":True},
        "gaussianPowers":{k:str(v) for k,v in weights.items()},
        "jointLimitConditions":["original admitted same-label C11/C15 chart/frame with positive normalized amplitude and Gram",
            "finite original closed-pulse Volterra realization with positive normal and fixed native time parameters",
            "actual normalized Haar and original centered directional Fourier inverse realization",
            "original flat cutoff support, local stress identities, fixed radial endpoints and retained phase geometry"],
        "uniformEpsilonClaim":False,
        "fullSupportedRepeatC1Claim":False,
        "release":"HOLD",
        "originalLiveSigmaTargets":sorted(targets),
        "optionalOneRadialDirectionalTarget":(1,0,2),
        "collarDependentRows":[{"RZT":a,"region":region,**paths[(a,region)]}
                               for a,region in sorted(paths)],
        "preSignedCovarianceRows":sorted(W),
        "forceRZTL":sorted(force),
        "initializedMeanRows":sorted(mean),
        "initializedMeanPrimaryCovariance":sorted(donor_cov),
        "oldMeanInverseRoles":sorted(inverse),
        "oldMeanShortPrimitiveRoles":sorted(prim),
        "primaryRows":sorted(direct),
        "primaryDirectionEnvelope":highs,
    }


if __name__ == "__main__":
    p=ArgumentParser()
    for field in ("work","goal","runtime","output"):
        p.add_argument("--"+field,type=Path,required=True)
    a=vars(p.parse_args())
    receipt = verify(a)
    receipt["pins"] = PINS
    a["output"].write_text(json.dumps(receipt,indent=2,sort_keys=True)+"\n",encoding="utf-8")
