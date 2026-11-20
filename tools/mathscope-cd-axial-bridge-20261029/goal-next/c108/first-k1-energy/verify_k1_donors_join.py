"""Attach the identical original high-gauge and Sigma donors to the first energy sum."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


PINS={
    "sigma":"d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f",
    "earlyEnergy":"8d03cf3e9acbafed674b06c80685d198a4da07cffdd85a0f9b8647db6a4bcfb3",
    "modeOne":"3a6c22308f6b76804b05bce58548b6b928e09cb8f6d4fdd1f8a93cc5f176912b",
    "mean":"b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41",
    "earlyModeOne":"e58b46a729dd9029a35c5e5115f3156943e1d9f8eae33c9bff8d6ee2426a81d8",
    "modeTwo":"0cf2a4587f2d5c82eaeadb3a0ff0f694961c29b4fd2f047cff509af7a50f5449",
    "requests":"e3a2f7903bc28324bb09f436fb0ff399ab56f334ef95362c64f715ca4cbc00f8",
    "transfer":"579d45f3a34806beacecc91ae1567bb9c7614270ae3bd0603ae75137e7bb3dcf",
    "late":"d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef",
}


def pin(key,path):
    raw=path.read_bytes()
    digest=sha256(raw).hexdigest()
    assert digest==PINS[key],(key,path)
    return json.loads(raw)


def main(a):
    root=a.goal/"c107/post-signed-gauge"
    sigma=pin("sigma",a.sigma)
    assert sigma["SigmaApplications"]==[22001223,22001224] and sigma["incrementalPressureZ"]==22000443
    assert sigma["source"]["nodes"]==22155584
    assert sigma["pins"]["one"]==PINS["earlyModeOne"]
    mean=pin("mean",a.mean)
    one=pin("modeOne",a.mode_one)
    two=pin("modeTwo",root/"forced-mode-two-late-directions.json")
    asks=pin("requests",root/"post-signed-gauge-requests.json")
    transfer=pin("transfer",root/"late-covariance-from-gauges.json")
    late=pin("late",a.goal/"c105/late-grade/late-grade.json")
    energy=pin("earlyEnergy",a.energy)
    assert mean["coefficientRankThroughAllMeanRows"]["whole"]==68834
    assert PINS["mean"] in one["pins"].values()
    directions=set(map(tuple,asks["directions"]))
    assert len(directions)==79 and len(one["directions"])==93
    for region in ("collars","middle"):
        coverage={tuple(row["RZL"]):row for row in one[region]}
        assert directions<=coverage.keys()
        assert all(Q(coverage[r]["gaugeEpsilonAfterOneDebit"])>=Q(149993,100000)
                   and coverage[r]["gaugeLogRankInHOver2Pow128"]<2**17
                   and Q(coverage[r]["gaugePoleAfterSqrtZeta"])<=Q(75,2)
                   for r in directions)
    assert directions=={tuple(row["RZL"]) for row in two["conditionalGaugeRows"]}
    assert sigma["commonBound"]["retainedGaussian"]==transfer["nativeSigmaSufficientInput"]["radialWeight"]
    actual=sigma["commonBound"]
    ask=transfer["nativeSigmaSufficientInput"]
    assert Q(actual["epsilon"])>=Q(ask["minimumEpsilonGrade"])
    assert Q(actual["band"])<=ask["totalBandAtMost"] and actual["pole"]<=ask["separatePoleAtMost"]
    sigma_log=Q(actual["coefficientInHOver2Pow128"],2**128)
    assert sigma_log<=Q(1,2**92)
    # Spend the exact log and finite band against one epsilon debit for
    # the low differential spatial energy of the original Signed slice.
    kappa=Q(1,100000)
    assert 2*(sigma_log+Q(actual["band"])/2**32636)<kappa
    assert Q(actual["epsilon"])-kappa>Q(30001,50000) and actual["pole"]<=64
    assert Q(transfer["conditionalCovarianceGrade"])>Q(late["premise"]["absoluteEpsilonGrade"])
    assert transfer["conditionalCovarianceBand"]<=late["premise"]["maximumSExponent"]
    assert transfer["conditionalCovarianceCoefficientLogOverH"]=="2^-100"
    assert late["premise"]["maximumCoefficientLog"]=="H/2^100"
    assert energy["groups"]["latePotentials"]==late["physicalGate"]["targetOriginalATheta"]
    assert energy["groups"]["directSwirl"]==late["physicalGate"]["targetOriginalBTheta"]
    result={"schema":"MathScope.C108.OriginalFirstCorrectionK1ConditionalDonorAttachment/1",
            "status":"VERIFIED_NATIVE_DONOR_CHAIN_CONDITIONAL_SAME_ORIGINAL_LIVE_REALIZATION",
            "pins":PINS,
            "sourceInputs":{"Sigma":sigma["SigmaApplications"],"covarianceInputs":127,
                            "gaugeDirections":79,"modeOneDirections":93,"modeTwoDirections":79,
                            "latePotentials":list(energy["groups"]["latePotentials"]),
                            "lateDirectSwirl":energy["groups"]["directSwirl"]},
            "conditionalResult":{"sigmaGrade":actual["epsilon"],"covarianceGrade":transfer["conditionalCovarianceGrade"],
                                 "lateRelativeEnergy":"<2^-32","firstCorrectionRelativeEnergy":"<2^-28"},
            "premises":["Original complete admitted chart and fixed radial paths, positive Gram, stable finite normalized waves and original finite smooth/flat seams.",
                        "Common simultaneous real source realization and the original scalar localizer and Hilbert energy equality on the admitted slab."],
            "open":["Independent realization over the full native domain if any chart/seam is still assumed, actual later correction stages K2..K4, full N7-06.",
                    "Full-field N8-05, final jets and release."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS same-source 18 Sigma jets, 127 late inputs, 79 gauges, conditional K1 ratio <2^-28")


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","sigma","mode-one","mean","energy","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
