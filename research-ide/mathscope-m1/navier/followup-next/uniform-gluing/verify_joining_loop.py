#!/usr/bin/env python3
"""Independent arithmetic and special-function controls for the C.1 bound.

The high-precision Bessel evaluations are diagnostics, not interval proofs.
The analytic integral inequalities are derived in JOINING_LOOP.md.
"""
import hashlib
import json
import sys
import argparse
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[2]/'arithmetic/vendor'))
import mpmath as mp


def q(x):
    return F(int(x['numerator']),int(x['denominator']))


def verify(cert):
    p={k:q(v) for k,v in cert['parameters'].items()}
    delta=p['deltaL'];P=p['absP2OverXRUpper'];pc=p['p2OverXRCaseThreshold']
    M=p['muMaxTimesXR'];d=p['d0OverXR'];target=p['varianceTargetUpper']
    # Direct checks of consequences, using the serialized witnesses and no
    # producer code. Every branch has a strict lower margin at its endpoint.
    small=d*d*M*M/18
    middle=d*d/(18*pc*pc)
    # The square-root comparison is squared exactly after checking signs.
    need=12*(1+target*P*P/(d*d))
    checks={
        'varianceSmallCase':small>target,
        'varianceMiddleCase':middle>target,
        'varianceLargeCase':M*pc>need*need,
        'rootBracketStrictlyPositive':M>0 and pc>0 and target>0,
        'wholeVarianceTargetFits':target>=3/p['aLower'],
        'densityQuotientBound':(p['absTUpper']-p['absTsUpper'])**2>=
              (24*d*M)**2*(1+M*P),
        'coneFirstGap':p['aLoopLower']>0 and
              p['aLoopLower']*(1+p['absTUpper']**2)<=2,
        'coneSecondGap':0<p['vMinusTwoLower']<=delta/2,
        'coneThirdGap':p['PcMinusVOverXRLower']>0 and
              p['PcMinusVOverXRLower']<=p['PcOverXRLower']-d-p['v']/p['XRLower'],
        'coneFourthGap':0<p['quadraticConeGapOverXR2Lower']<=
              2*p['PcMinusVOverXRLower']**2-(p['v']-2)*p['absJcOverXRUpper']**2,
        'noEntireC12Promotion':not any(cert['scope'][k] for k in
              ['sameLoopExtendedThroughEntireC12Interval','C12SlowDerivativeBoundsCertified',
               'finiteNForWholeSourceSelected','sourceC12MomentDebtBoundToPatch',
               'wholeFinalProfileConeCertified','newLeanAnalyticPremiseProof',
               'originalN305Promoted','originalN306Promoted']),
    }
    return checks


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--certificate',type=Path,default=HERE/'source-joining-loop-certificate.json')
    ap.add_argument('--output',type=Path,default=HERE/'source-joining-loop-independent.json')
    args=ap.parse_args()
    path=args.certificate
    cert=json.loads(path.read_text());checks=verify(cert)
    # Reject evidence inflation and an invalid positive cone margin.
    import copy
    mutated=copy.deepcopy(cert);mutated['scope']['finiteNForWholeSourceSelected']=True
    checks['falseFiniteNPromotionRejected']=not verify(mutated)['noEntireC12Promotion']
    mutated=copy.deepcopy(cert);mutated['parameters']['deltaL']['numerator']='0'
    checks['zeroStrictMarginRejected']=not verify(mutated)['coneSecondGap']
    mp.mp.dps=200
    controls=[]
    for zstring in ['1e-40','1e-20','0.1','0.5','1','2','20','576','1000','1e6','1e72']:
        z=mp.mpf(zstring)
        # Scaling avoids storing the immense exponentials at the largest z.
        i=mp.besseli(0,z)*mp.exp(-z)
        j=mp.besseli(0,2*z)*mp.exp(-2*z)
        ratio=j/(i*i)
        lower=z*z/18 if z<=1 else mp.mpf(1)/18
        tests={'varianceLower':ratio-1>=lower,
               'densityUpper':1/i<=12*mp.sqrt(1+z)}
        if z>=1:
            tests['largeZRatioLower']=ratio>=mp.sqrt(z)/12
            tests['I0Upper']=i<=1/mp.sqrt(z)
            tests['I0Lower']=i>=1/(12*mp.sqrt(z))
        assert all(tests.values())
        controls.append({'z':zstring,'ratioMinusOne':mp.nstr(ratio-1,35),'checks':tests})
    output={'schema':'MathScope.JoiningLoopIndependentControls/1',
            'certificateSHA256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'exactChecks':checks,'exactChecksPassed':sum(checks.values()),'exactChecksTotal':len(checks),
            'specialFunctionControls':controls,'specialFunctionControlPrecisionDecimalDigits':200,
            'specialFunctionComparisonCount':sum(len(x['checks']) for x in controls),
            'scope':'The 200-digit Bessel comparisons are diagnostics only. Analytic continuous inequalities are derived from exact integrals in JOINING_LOOP.md. No phase or source samples are promoted to a uniform proof.'}
    args.output.write_text(json.dumps(output,indent=2)+'\n')
    assert all(checks.values())
    print(json.dumps({'exactChecksPassed':sum(checks.values()),'exactChecksTotal':len(checks),
                      'specialFunctionComparisonsPassed':output['specialFunctionComparisonCount']},indent=2))


if __name__=='__main__':main()
