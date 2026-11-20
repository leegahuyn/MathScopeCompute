"""Attach the actual pure-Z5 phase-free Forced inputs to the highest Signed pressure role."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


PINS={
 "mode_one":"84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e",
 "mode_two":"f45cfa6ef06091a25e3a75222187773fdca7efb2008d2bd078a3b0a9d9b6671a",
 "pressure":"59a4d94452cfb02be03851b567c09a1331e62ba3db679eeb9373cc755fc0bb5e",
 "exact_flux":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
}


def record(path,pin):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==pin,path
    return json.loads(raw)


def main(a):
    src={name:record(getattr(a,name),pin) for name,pin in PINS.items()}
    flux=src["exact_flux"]
    assert flux["native"]["centeredSigmaApplications"]==[22001223,22001224]
    assert [0,4,0] in flux["numericalFrontier"]["forcedCovarianceSupremumOrders"]["rz"]
    proof=src["pressure"]["centeredPressure"]
    assert proof["nestedFubiniChecks"]==54 and proof["endpointRetainingRadialIbPChecks"]==9
    assert proof["kernelContinuousAtR"]
    assert proof["pureAxialDiagnosticCoefficientWithoutCommonSignsAndEpsilon"]=="3/67603900"
    assert src["pressure"]["remainingPureAxialPotentialOrder"]==["C_theta",0,5,0]
    donor=src["mode_one"]["forcedDonor"]
    one=next(row for row in donor["modeOnePureZGaugeRows"] if row["RZL"]==[0,5,0])
    phase=one["phaseFreeGaugeOverP"]
    assert Q(phase["epsilonAfterOneDebitRetainingDisplayedBand"])==Q(74999,50000)
    assert one["wholeCoefficientLogCap"]=="H/2^111"
    two=src["mode_two"]
    assert two["nativeNormalized"]["RZL"]==[0,5,0] and not two["initializedMeanOperandRequired"]
    assert two["conditionalAfterBandAndLogAbsorptionEpsilonGrade"]=="49999/50000"
    C2=two["conditionalExplicitBandGrade"]
    assert Q(C2["zeta"])==1 and C2["outerPoleAfterZeta"]<=27 and C2["innerCoarsePoleAfterZeta"]<=27
    k=Q(1,100000)
    high_p=[Q(phase["epsilonAfterOneDebitRetainingDisplayedBand"]),
            Q(two["conditionalAfterBandAndLogAbsorptionEpsilonGrade"])+Q(1,2)]
    assert high_p[0]==high_p[1]==Q(3,2)-2*k
    # The high imaginary radial curl carries varpi = epsilon*d_Z C_theta.
    # The surviving high pressure primitive has two explicit epsilon factors.
    # Every matching lower velocity factor has grade at least 1/2.
    rows=[]
    for i in range(2):
        carry=2+1+Q(1,2)+high_p[i]
        zeta=Q(phase["zeta"])+Q(1,2) if i==0 else Q(C2["zeta"])*2
        poles=[Q(phase["outerPoleAfterZeta"]),Q(phase["innerPoleAfterZeta"])] if i==0 else [Q(C2["outerPoleAfterZeta"]),Q(C2["innerCoarsePoleAfterZeta"])]
        assert zeta>=1 and carry==5-2*k and carry-k>4
        assert max(poles)+15<=42
        rows.append({"mode":i+1,"phaseFreePotentialGrade":str(high_p[i]),
                     "lowerMatchingVelocityGrade":"1/2","imaginaryRadialCurlZGrade":1,
                     "twoProjectedPressureFactorsGrade":2,"pureExceptionalSigmaGradeBeforeRemainingDebit":str(carry),
                     "minimumZetaPower":str(zeta),"sufficientPressureIntegrandPole":42})
    out={"schema":"MathScope.C102.SignedExceptionalPureZ5NativeDonor/1",
         "status":"VERIFIED_ORIGINAL_MODE_ONE_AND_TWO_PURE_HIGH_DONORS_CONDITIONAL_COMMON_CHART",
         "pins":PINS,"nativeAxialSigma":22001224,
         "rows":rows,"noGenericPureZ5Cancellation":proof["pureAxialDiagnosticCoefficientWithoutCommonSignsAndEpsilon"],
         "scope":"This estimates the exceptional centered double-pressure role. It keeps original weights, "
                 "the original matched phase/Haar pairs and their lower ordinary envelope, and original shifted chart hypotheses.",
         "next":"Attach the remaining ordinary covariance and Temporal products, compact moment and nonSigma multiplier to the two whole Signed targets.",
         "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print("PASS both original pure-Z5 donors in the exceptional native Signed pressure role; epsilon grade",str(5-2*k))


if __name__=="__main__":
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    for key in (*PINS,"out"):
        cli.add_argument("--"+key.replace("_","-"),type=Path,required=True)
    main(cli.parse_args())
