"""Match charged phase-free wave pairs to the original late mean covariance premise."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from math import factorial
import json
from pathlib import Path


PINS={
    "demand":"e3a2f7903bc28324bb09f436fb0ff399ab56f334ef95362c64f715ca4cbc00f8",
    "geometry":"449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a",
    "modeOne":"6b720ec53272ee59d1576ed374dedcf9267bbdfc41c2ad122d0e7e24face8298",
    "modeTwo":"c892d8878e0607117077f08c41b6d8d79f3e8729dc85bf79f35e346daf9cfa9e",
    "modeTwoLate":"0cf2a4587f2d5c82eaeadb3a0ff0f694961c29b4fd2f047cff509af7a50f5449",
    "late":"d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef",
    "primary":"595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return json.loads(raw)


def main(a):
    data=pin("demand",a.demand)
    geometry=pin("geometry",a.geometry)
    root=a.goal
    primary=pin("primary",root/"c106/high-compact-mode-one/primary-quotient-c11.json")
    one=pin("modeOne",root/"c106/high-compact-mode-one/mode-one-raw-grades.json")
    two=pin("modeTwo",root/"c105/forced-mode-two-high/forced-mode-two-high.json")
    two_late=pin("modeTwoLate",a.mode_two_late)
    late=pin("late",root/"c105/late-grade/late-grade.json")
    late_cases={(n,tuple(d)) for n,d in late["premise"]["componentDirections"]}
    assert late_cases=={(row["covariance"],(r,z,0,l))
                        for row in data["covarianceRows"] for r,z,l in [row["RZL"]]}
    directions={tuple(x) for x in data["directions"]}
    assert len(directions)==79 and len(late_cases)==127
    assert all((i,j,k) in directions for r,z,l in directions
               for i in range(r+1) for j in range(z+1) for k in range(l+1))
    assert {tuple(row["RZL"]) for row in geometry["rows"]}==directions
    # All high Forced mode-two directions also have their verified stage-one
    # indicator. Some late gauge directions are new transverse ranks and
    # must be attached independently even for the earlier waves.
    available_two={tuple(row["RZL"]) for row in two["conditionalGaugeRows"]}
    missing=sorted(directions-available_two)
    assert len(missing)==43
    assert {tuple(row["RZL"]) for row in two_late["conditionalGaugeRows"]}==directions

    half=Q(1,2)
    sigma_grade=Q(24,25)
    kappa=Q(1,100000)
    grades={"Primary":half,
            "ForcedModeOne":Q(one["conditionalPhaseFreeGaugeGrade"])-half,
            "ForcedModeTwo":Q(two["conditionallyAbsorbedEpsilonGrade"]),
            "Signed":sigma_grade-half}
    weights=primary["weightedQuotientLedger"]["bounds"]
    carrier=lambda row: Q(row["epsilonPower"])+Q(row["inverseCarrierPower"],2)
    assert min(carrier(row) for row in weights if row["role"].startswith("velocity"))==half
    assert kappa<half  # covers the radial-fast branch in place of the carrier.

    # Both original radial faces retain a half Gaussian. At pole p choose
    # m=ceil(p/2) and e^x>=x^m/m!, with x=1/(2 distance^2).
    # The extra distance^(2m-p) is at most one. The other face only
    # improves this envelope on each source collar.
    pole=128+max(row["reciprocalGaussianPoleIncrement"] for row in geometry["rows"])
    assert pole==146
    m=(pole+1)//2
    gaussian_bits=(2**m*factorial(m)).bit_length()
    assert gaussian_bits < 2**9

    # Charge each source factor its declared coefficient log and all its
    # finite band factors. These uniform debits precede the paired sum.
    # The 2^15-bit reserve includes both Gaussian faces, original middle
    # normalization, original fixed-label transport and common factors.
    upper_single_log=Q(1,2**92)+Q(1,2**110)+Q(2**15,2**128)+Q(192,2**32636)
    assert 2*upper_single_log<kappa  # The directed slab has H/(-log epsilon)<=2.
    paid={name:rate-kappa for name,rate in grades.items()}
    least=min(paid.values())
    assert least==Q(45999,100000)
    common_rate=2*least
    assert common_rate==Q(45999,50000)>Q(late["premise"]["absoluteEpsilonGrade"])
    # Absolute finite sums use 162 original indexed rows, three possible
    # contributions per harmonic amplitude, the real/conjugate pairing
    # and all the exact Leibniz weights over the late R,Z,L variables.
    max_weight=max(2**sum(row["RZL"]) for row in data["covarianceRows"])
    finite_sum_bits=(162*3**2*2*max_weight).bit_length()
    assert Q(finite_sum_bits,2**128)<Q(1,2**100)
    result={"schema":"MathScope.C107.ConditionalLateCovarianceFromSignedAndOriginalWaveGauges/1",
            "status":"VERIFIED_EXACT_RATE_AND_FACTOR_ARITHMETIC_CONDITIONAL_NATIVE_HIGH_WAVE_AND_SIGMA",
            "pins":PINS,"lateCovarianceRows":len(late_cases),"gaugeDirections":len(directions),
            "nativeSigmaSufficientInput":{"minimumEpsilonGrade":str(sigma_grade),"coefficientLogOverH":"2^-92",
                                          "radialWeight":"zeta","separatePoleAtMost":128,"totalBandAtMost":128},
            "requiredPhaseFreeWaveBounds":"Complete original Primary and both Forced wave factors on the C107 79 directions, including any new transverse rows, with the weighted half Gaussian, fixed original carrier/frame, cutoffs, coefficient logs and whole same-label torus paths.",
            "maxNormalizedSignedPoleAfterReciprocal":pole,"halfGaussianAbsorptionBits":gaussian_bits,
            "conditionalWaveRatesAfterDebit":{name:str(x) for name,x in paid.items()},
            "conditionalCovarianceGrade":str(common_rate),"conditionalCovarianceBand":0,
            "conditionalCovarianceCoefficientLogOverH":"2^-100",
            "addedInCurrentModeTwoGaugeSheet":missing,
            "modeTwoC107GaugeDirectionsCompleteConditionally":True,
            "scope":"Conditional on finite real wave-factor suprema and the same original normalized Haar pair identification. Tested rates use absolute products and give no lower bound on any native covariance or final energy.",
            "open":["Pay the actual high original Sigma and any omitted transverse/geometry wave factors on the full paths.",
                    "Attach this conditional covariance comparison to the original full map, seams and coupled energy."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS conditional original late covariance grade",common_rate,
          "additional transverse/slow ModeTwo rows",len(missing))


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","demand","geometry","out"):
        p.add_argument("--"+name,type=Path,required=True)
    p.add_argument("--mode-two-late",type=Path,required=True)
    main(p.parse_args())
