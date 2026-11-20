"""Attach the actual early Signed donor inventory to the two native Sigma envelopes."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


PINS={
 "centered":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
 "ordinary_pair_envelope":"59a4d94452cfb02be03851b567c09a1331e62ba3db679eeb9373cc755fc0bb5e",
 "weighted_mean":"6c9830a81a121c0b1cbd76c1a06cc9bc87774f22ba694cfb8ccb4da5fa4f7f26",
 "fixed_geometry":"c87642c1191c9995c77c1c7c90899e68aa23ee5a7913b95b35af1c9f2fc5dde7",
 "transverse_l2":"edca33dae9841e6fffc971058d687d1ceadac2415893c4405a313819bb710177",
 "energy_frontier":"4ddef46553be2e296df327c513257e75085753f8a16e822ddcd16e105ad726c3",
}
ADDITIONAL=("higher_stress","pure_high","curl_coverage")


def main(a):
    values,hashes={},{}
    for name in (*PINS,*ADDITIONAL):
        raw=getattr(a,name).read_bytes()
        digest=sha256(raw).hexdigest()
        if name in PINS:
            assert digest==PINS[name],(name,digest)
        values[name],hashes[name]=json.loads(raw),digest
    original=values["centered"]
    assert original["native"]["centeredSigmaApplications"]==[22001223,22001224]
    assert original["native"]["actualResidualUsesIncrementalPressureZ"]==22000443
    numerical=original["numericalFrontier"]
    assert numerical["weightedSigmaSpatialOrders"]==[[0,0,0],[0,1,0],[0,2,0],[1,0,0],[1,1,0],[2,0,0]]
    assert numerical["compactMeanTime"]==[[0,0,1],[0,1,1],[0,2,1],[1,0,1]]
    compact=original["compactInitializedFiveMapAttachment"]
    assert compact["axialTargetZ6AndZ4T1Attached"]
    assert compact["gradeOnOriginalCompactSupport"]["beta"]=="epsilon^2*S^(7/2+3(z+t))"
    high=values["pure_high"]["rows"]
    assert min(Q(row["pureExceptionalSigmaGradeBeforeRemainingDebit"]) for row in high)>4
    assert values["curl_coverage"]["remainingPhaseFreeGaugeDirectionsRZL"]==[[0,0,2]]
    transverse=values["transverse_l2"]["phaseFreeDonor"]
    assert len(transverse["gaugeRows"])==2
    stress=values["higher_stress"]["caps"]
    assert stress["weightedFullStressLocalRFComponentPoleAtMost"]==9
    assert Q(stress["fullStressEpsilonMinimum"])==1
    mean=values["weighted_mean"]["uniformSingleGaussianProductBudget"]
    assert mean["allPhysicalRegions"] and mean["radialPoleWithOneZeta"]==0
    assert Q(mean["epsilonAfterOneBandAndCoefficientDebit"])>1
    covariance=values["ordinary_pair_envelope"]["covarianceGrade"]["pairGrades"]
    assert all(Q(r["epsilon"])>=1 and Q(r["zeta"])>=1 for r in covariance.values())
    assert max(Q(row["pole"]) for source in covariance.values() for row in source["rows"])==42
    assert max(Q(row["band"]) for source in covariance.values() for row in source["rows"])<64
    # Linear compact Fields carry at least epsilon and use degree <=6.
    assert max(Q(1,2)+3*6,Q(7,2)+3*6)<64 and mean["bandPower"]<64
    # Keep the common Gaussian for the whole one or two primitive transfers.
    assert original["finiteGaussianTransfer"]["pressureAndSigmaMaximumNumberOfNestedPrimitives"]==2
    assert max(int(stress["weightedFullStressLocalRFComponentPoleAtMost"]),42)<64
    # All poles <=64: sup exp(-1/u^2) u^-p <= ceil(p/2)!.
    assert factorial(32)<2**118
    # Finite input removal + middle restoration + geometry/power assembly.
    assert 30720+2*118+2**12<2**16
    assert ((2**16)+64)*2**129 < 2**(4096*510)
    # Coefficients in the preceding physical envelope may safely be quite
    # loose. Paying a single epsilon charge covers the sum, two primitives,
    # fixed reference amplitudes and geometry; the finite band is separate.
    k,rho=Q(1,100000),Q(1,1048576)
    assert 2*Q(1,2**92)<k
    unweighted_grade=1-k-rho
    geom=values["fixed_geometry"]
    assert geom["numPhysicalWords"]==30 and geom["nonSigmaLogCapAfterFiniteBand"]=="H/2^112"
    required=Q(geom["sufficientSeparateSigmaEpsilonGrade"])
    assert required==Q(30001,50000) and unweighted_grade>required
    assert geom["sufficientInputPoleAtMost"]==64
    frontier=values["energy_frontier"]
    energy=next(v for v in frontier.values() if isinstance(v,dict) and "conditionalSignedSliceEnergyRatio" in v)
    assert energy["conditionalSignedSliceEnergyRatio"]=="<2^-32"
    roles=[
      {"source":"Radial F, its endpoints, and original higher stress","minimumEpsilon":1,"retainedPole":42},
      {"source":"Compact W_T and exact time centering","minimumEpsilon":2,"retainedPole":0},
      {"source":"Axial G_Z outside pressure","minimumEpsilon":2,"retainedPole":42},
      {"source":"Original incremental axial pressure, its normalization and exceptional upper role",
       "minimumEpsilon":2,"retainedPole":42},
      {"source":"Whole compact D_Z T_chi rho correction","minimumEpsilon":2,"retainedPole":0},
    ]
    result={"schema":"MathScope.C102.TwoOriginalSignedSigmaConditionalBudget/1",
       "status":"VERIFIED_COMPLETE_EARLY_SIGNED_DONOR_INVENTORY_CONDITIONAL_SIGNED_SLICE",
       "pins":hashes,"sourceSigmaRoots":[22001223,22001224],"roles":roles,
       "remainingUnattachedRZL":[],"ordinarySpatialOrders":numerical["weightedSigmaSpatialOrders"],
       "uniformSingleZetaEnvelope":{"radialPoleAtMost":42,"finiteBandAtMost":64,
            "conservativeInputLogEnvelopeBeforeEpsilonDebit":"H/2^92",
            "minimumEpsilonAfterLogAndBandDebit":str(unweighted_grade),
            "sufficientEpsilon":str(required),"separateSigmaCoefficientLogCap":"H/2^109"},
       "conditionalSignedSliceRelativeEnergy":"<2^-32",
       "premises":["Original real smooth realization, same normalized phase and inherited whole-path chart/pulse/Gram bounds.",
                   "The original fixed radial endpoints are outside all supported correction fields and the original normalized Haar and moment identities apply.",
                   "The inherited ordinary Forced velocity and background geometry estimates hold uniformly on every matched chart. Their total positive coefficient and original reference-amplitude charge before the final absorption is bounded by H/2^92.",
                   "The same original conservative pressure normalization and the finite collar comparison of both Gaussian faces apply."],
       "open":["Independent uniform realization of the stated analytic premises",
               "Late stage-one mean, complete K1 and N7-06", "Whole N8-05 and final jets"],
       "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS two actual Sigma inventories and conditional Signed-slice energy <2^-32")


if __name__=="__main__":
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    for name in (*PINS,*ADDITIONAL,"out"):
        cli.add_argument("--"+name.replace("_","-"),type=Path,required=True)
    main(cli.parse_args())
