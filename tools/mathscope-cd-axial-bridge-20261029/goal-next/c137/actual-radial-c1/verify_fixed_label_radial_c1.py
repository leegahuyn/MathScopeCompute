"""Check the source-bound premises of the conditional Repeat radial C1 join."""

import argparse
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "live": ("goal", "c133/live-radial-trace/live-radial-trace.json",
             "70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba"),
    "reference": ("goal", "c133/live-reference/partial.json",
                  "947262a5685a7cf4ce60061e4c428c590484da10b292918a4972566bcd50bf2e"),
    "wave_t": ("goal", "c135/radial-all-tt/all-wave-tt.json",
               "0b2bc4cb556d2fcf45f2cc513f3e3fad2753bc01b256aa8226c6c5fe4037171d"),
    "wave_vv": ("goal", "c135/radial-pulse-vv/radial-pulse-vv.json",
                "21f501d7ebcb63a32871a992b15c95d31ed4abdb18240f311295e9e2032b5824"),
    "wave_Tv": ("goal", "c136/radial-pulse-time/radial-pulse-time.json",
                "3fe8a27a366c78d3d1fa8335510f425a2c3187885b9a5e6bce821ba510b3c669"),
    "hull": ("goal", "c136/radial-operator-hull/radial-operator-hull.json",
             "a9abe087f3f5f7796ab06150ec61cb7ca4f8f5ec9770e8cf0eb86c68c1e55127"),
    "ordinary_mean": ("work", "continuation137/primary-high-L-collar/primary-high-L-collar.json",
                      "297ee3bea01cd9b5eebbb8405304af43903fb08d500faa90d274f37744b7a159"),
    "ordinary_wave": ("work", "continuation137/radial-wave-ordinary/ordinary-wave-pressure.json",
                      "6b26e33b26295cda0ae53cbd7782141e933626181586e3ec227d6f086b91ab48"),
    "fast_mean": ("goal", "c136/radial-mean-N/radial-mean-N.json",
                  "36ae6be1f5a5a5f172075c0ab6915bccf8a1a5b2c220e18791d9d44d84831ce4"),
    "subtract": ("goal", "c136/radial-subtractions/radial-subtractions.json",
                 "5a180455eb9a631903da085ca0bd62218da2562e19a43c12fb1b79796c1e7636"),
    "lean": ("goal", "c136/hosted-lean.json",
             "1e43830fb2fdad9e80bb22c287c3724d2ed85dc9884440fc8ebed6ffa00ffaf0"),
    "band": ("runtime", "mathscope-m3/navier/source-global-band.mjs",
             "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "lift": ("runtime", "mathscope-m3/navier/source-initialized-angular.mjs",
             "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
}


def read(scope, path, expected):
    file = scope[path[0]] / path[1]
    raw = file.read_bytes()
    assert sha256(raw).hexdigest() == expected, file
    return json.loads(raw) if file.suffix == ".json" else raw.decode()


def verify(scope):
    data = {key: read(scope, spec, pin) for key, (*spec, pin) in PINS.items()}
    guard = data["live"]["guard"]
    assert guard["triple"] == [17732770, 3617, 28826]
    assert guard["s"] == 17732766 and guard["X"] == "R^2/(2*s(Z,T))"
    assert guard["bothEndpointBranches"] == guard["openShellBody"]["outsideBoth"] == 0
    assert guard["RZT"] == [17732748, 17732749, 17732750]
    assert "F(s/b; Z/b^D, T/b)=F(s;Z,T)/b" == data["reference"]["chartScaleIdentity"]["exact"]
    for literal in (
        "chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)",
        "left:q(1,2),right:q(2),derivativeLower:q(1,2)",
        "X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D))",
        "phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))",
        "phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))",
    ):
        assert literal in data["band"], literal
    for literal in (
        "source-lift-transverse-time-derivative-zero',operators.N(xi),G.zero",
        "source-lift-longitudinal-radial-derivative-zero',operators.L(v),G.zero",
        "source-lift-normalized-pulse-time-one',G.mul(geometry.ci,operators.N(v)),G.one",
    ):
        assert literal in data["lift"], literal
    hull = data["hull"]
    assert hull["waveDerivativesByN"] == {"0": 28, "1": 9, "2": 1}
    assert sum(row["realScalarCount"] for row in data["live"]["rawHomogeneity"]) == 240
    wave = data["ordinary_wave"]
    assert wave["status"] == "VERIFIED_ACTIVE_SOURCE_ROUTES_AND_CONDITIONAL_ORDINARY_GAUSSIAN_TRACES"
    ordinary_wave = {(0,0,0,0)} | {tuple(a[:4]) for a in hull["waveFirstDerivativeHull"]
                                  if a[4] == 0 and a[2] < 2}
    ordinary_pressure = {(0,0,0,0)} | {tuple(a[:4]) for a in hull["pressureFirstDerivativeHull"]
                                      if a[4] == 0}
    assert {tuple(a) for a in wave["supportedOrdinaryWaveRZTL"]} == ordinary_wave
    assert {tuple(a) for a in wave["supportedOrdinaryPressureRZTL"]} == ordinary_pressure
    assert tuple(map(len, (ordinary_wave, ordinary_pressure))) == (28,14)
    assert len(wave["sigmaRZTRows"]) == 25
    assert len(wave["conservativePhaseFreeGaugeRZTL"]) == 55
    assert len(data["wave_t"]["rows"]) == 120
    assert data["wave_Tv"]["nativeWaveOwners"] == 120
    assert data["wave_Tv"]["status"] == "CONDITIONAL_ORIGINAL_FIXED_LABEL_MIXED_PULSE_TIME_WAVE_TRACE"
    mean = data["ordinary_mean"]["ordinaryCofactorJoin"]
    assert mean["status"] == "CONDITIONAL_ORIGINAL_ORDINARY_MEAN_COFACTOR_BOTH_RADIAL_COLLARS"
    assert mean["ordinaryCofactorDirections"] == 42
    assert len(data["fast_mean"]["positiveNTargetsPerVelocityComponent"]) * 3 == 18
    assert data["fast_mean"]["fullSupportedRepeatC1Claim"] is False
    counts = data["subtract"]["nonliteralZeroScalarFamilyCounts"]
    assert sorted(counts.values()) == [30,30,120,120]
    lean = data["lean"]
    assert lean["databaseId"] == 44700362074 and lean["conclusion"] == "success"
    return {
        "schema": "MathScope.C137.ActualFixedLabelRadialC1/1",
        "status": "CONDITIONAL_ACTUAL_240_FIXED_LABEL_RADIAL_C1",
        "pins": PINS,
        "actualRadialGuard": guard["triple"],
        "actualMovingRadialFaces": [guard["innerRadiusLimit"], guard["outerRadiusLimit"]],
        "supportedScalars": 240, "radialFaces": 2, "originalAnchoredCharts": 10,
        "fixedLabelCommonTorusPower": "Original common directions L,N span the torus chart; N is normalized v on the retained lift",
        "derivativeFootprint": {
            "ordinaryWavePlusValue": len(ordinary_wave), "ordinaryPressurePlusValue": len(ordinary_pressure),
            "waveTT": len(data["wave_t"]["rows"]), "waveTN": True, "waveN2": True,
            "meanOrdinaryPerComponent": 14, "meanPositiveNPerComponent": 6,
            "subtractionScalarsAllFourFamilies": sum(counts.values()),
        },
        "boundaryGeometry": {
            "sDependsOnlyOn": ["Z","T"], "F_sLower": "1/2",
            "s_T": "1/F_s", "s_Z": "2*Z*s^(2*h)/F_s",
            "X_R": "R/s", "X_Z": "-X*s_Z/s", "X_T": "-X*s_T/s",
            "bothPositiveFaces": True, "ordinaryReferencePreservesXAndEta": True,
        },
        "jointPremises": [
            "Both original fixed own and reference charts are strictly admitted, with positive radius, scale and frame",
            "The other original radial-neighborhood guards are strict at the face under consideration",
            "Original finite source profiles, positive denominators, Haar, fixed-endpoint radial integrals, Fourier inversion and closed-pulse realizations",
            "Constants and frozen arguments remain fixed on an admitted local compact chart",
        ],
        "proof": [
            "Uniform local Gaussian times finite pole for value and all first derivatives of each supported raw-minus-subtraction scalar",
            "Inward logarithmic shell coordinate is bounded by a constant times ambient distance",
            "Use Gaussian quadratic and quotient bounds and literal zero at either endpoint and outside; derivative is continuous and zero through the radial interface",
        ],
        "leanRun": lean["databaseId"], "fullWholeField": "OPEN",
        "simultaneousNonradialFaces": "OPEN", "uniformEpsilonClaim": False,
        "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("work", "goal", "runtime", "out"):
        p.add_argument("--" + name, required=True, type=Path)
    a = p.parse_args()
    options = vars(a)
    result = verify(options)
    a.out.write_bytes((json.dumps(result, sort_keys=True, indent=2)+"\n").encode())
    print(result["status"])
