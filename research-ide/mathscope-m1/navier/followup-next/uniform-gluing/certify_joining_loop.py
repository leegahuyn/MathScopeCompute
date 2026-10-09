#!/usr/bin/env python3
"""Quantitative C.1 loop on the actual certified joining rectangle.

This does not extend the loop through uncertified radial regions or select a
frequency for C.12. It proves all-phase cone margins for one explicit choice
of the C.1 constants, using exact scalar bounds for the same analytic profile.
"""
import argparse
import hashlib
import json
from fractions import Fraction as F
from math import isqrt
from pathlib import Path

from verify_uniform_certificate import q

HERE = Path(__file__).resolve().parent


def rec(x):
    x = F(x)
    return {"numerator": str(x.numerator), "denominator": str(x.denominator),
            "approximate": float(x)}


def sqrt_upper(x):
    """An integer upper bound, compared to x by exact integer arithmetic."""
    x = F(x)
    n = isqrt(x.numerator // x.denominator)
    return F(n if n*n == x else n+1)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(source_path, binding_path, rectangle_path):
    source = json.loads(source_path.read_text())
    binding = json.loads(binding_path.read_text())
    rectangle = json.loads(rectangle_path.read_text())
    assert rectangle['sourceSHA256'] == sha(source_path)
    assert rectangle['momentBindingSHA256'] == sha(binding_path)
    assert binding['sourceSHA256'] == sha(source_path)
    assert rectangle['allScalarChecksPassed']
    assert rectangle['domain'] == {'logx': ['-8', '-5'], 'eta': ['-1', '1']}
    b = rectangle['bounds']
    ideal = binding['idealReferenceBounds']['bounds']
    h = F(source['singleSourceProfile']['h'])
    logC = F(source['singleSourceProfile']['logC'])

    # All dimensionless residuals are divided by XR. Only a proved lower
    # bound on this actual XR is used; its huge real value is never evaluated.
    xr_lower = F(1 << 128)
    amin, amax, tsmax = F(7, 10), F(9, 10), F(1, 10**9)
    pcmin, p1max, p2max = F(1, 10000), F(10), F(200000000)
    # x >= exp(-8) > 3^-8, x <= 1, L in [1-2h,1].
    actual_pcmin = q(b['GPositiveLower']) / (3**8)
    actual_p1max = (F(63, 16)+F(3, 4)*h+q(b['QsError']))/(1-2*h)
    actual_p2max = (q(ideal['Nmax'])+q(b['NsError']))/q(b['EPositiveLower'])/(1-2*h)
    dbar = pcmin/4
    target = 3/amin
    pcrit = dbar/(100*(1+target))
    s = 24*(1+target*p2max*p2max/(dbar*dbar))
    mumax = s*s/pcrit
    zmax = mumax*p2max
    density_sqrt = sqrt_upper(1+zmax)
    tmax = tsmax+24*dbar*mumax*density_sqrt
    jmax = p2max+p1max*tmax
    g0 = pcmin/2
    delta = min(F(1, 2), g0*g0/(4*jmax*jmax))
    v = 2+delta/2
    rho_lower = v-q(b['vUpper'])
    aloop = 2/(1+tmax*tmax)
    pgap = pcmin-dbar-v/xr_lower
    qgap = 2*pgap*pgap-delta*jmax*jmax/2

    # Three exhaustive p-cases prove the same strict root bracket.  The
    # elementary Bessel bounds used here are derived in JOINING_LOOP.md.
    small_z = dbar*dbar*mumax*mumax/18
    middle_z = dbar*dbar/(18*pcrit*pcrit)
    large_z = dbar*dbar/(p2max*p2max)*(s/12-1)
    checks = {
        'sameSourceAndRectangle': True,
        'actualRadialScaleAtLeastTwoTo128': logC > 0 and 10*(logC+14) > 128,
        'allEtaAndWholeJoiningRectangle': rectangle['scope']['wholeJoiningRectangleAndAllEta'],
        'aBound': q(b['aLower']) >= amin and q(b['aUpper']) <= amax,
        'originalRatioBound': q(b['axialShearUpper'])/q(b['aLower']) <= tsmax,
        'normalizedPcLower': actual_pcmin >= pcmin,
        'normalizedP1Upper': actual_p1max <= p1max,
        'normalizedP2Upper': actual_p2max <= p2max,
        'd0StrictlyBelowHalfPcMinusTwo': 2*dbar < pcmin-2/xr_lower,
        'smallZUniformVarianceBracket': small_z > target,
        'middleZUniformVarianceBracket': middle_z > target,
        'largeZUniformVarianceBracket': large_z > target and s*s >= 1,
        'rootTargetWithinBracket': rho_lower > 0 and v < 3,
        'cutoffIdenticallyOneOnRectangle': q(b['vUpper']) <= 2+delta/8,
        'strictDeltaRange': 0 < delta < 1,
        'loopShearStrictlyPositive': aloop > 0,
        'vStrictlyAboveTwo': delta/2 > 0,
        'normalizedPcMinusVStrictlyPositive': pgap >= g0,
        'normalizedQuadraticConeGapStrictlyPositive': qgap >= g0*g0,
    }
    params = {k: rec(x) for k,x in {
        'XRLower': xr_lower, 'aLower': amin, 'aUpper': amax,
        'absTsUpper': tsmax, 'PcOverXRLower': pcmin,
        'absP1OverXRUpper': p1max, 'absP2OverXRUpper': p2max,
        'd0OverXR': dbar, 'varianceTargetUpper': target,
        'p2OverXRCaseThreshold': pcrit, 'muMaxTimesXR': mumax,
        'absMuP2Upper': zmax, 'absTUpper': tmax, 'absJcOverXRUpper': jmax,
        'deltaL': delta, 'v': v, 'aLoopLower': aloop,
        'vMinusTwoLower': delta/2, 'PcMinusVOverXRLower': pgap,
        'quadraticConeGapOverXR2Lower': qgap,
    }.items()}
    return {
        'schema': 'MathScope.QuantitativeJoiningLoop/1',
        'status': 'ALL_PHASE_JOINING_RECTANGLE_LOOP_CONE' if all(checks.values()) else 'FAILED',
        'sourceSHA256': sha(source_path), 'bindingSHA256': sha(binding_path),
        'rectangleSHA256': sha(rectangle_path),
        'domain': {'logx': ['-8','-5'], 'eta': ['-1','1'], 'phase': 'R/Z'},
        'parameterScaling': {'d0': 'XR * d0OverXR', 'muMax': 'muMaxTimesXR / XR',
                             'p': 'ps,2 / XR', 'variance': 'dbar^2/p^2 * (I0(2*mubar*p)/I0(mubar*p)^2-1)'},
        'parameters': params,
        'strictVarianceBracketCases': {k:rec(x) for k,x in {
            'absMuPBelowOne': small_z, 'absMuPAtLeastOneAndAbsPBelowThreshold': middle_z,
            'absPAtLeastThreshold': large_z}.items()},
        'checks': checks, 'allScalarChecksPassed': all(checks.values()),
        'exactMean': {'method': 'Use dphi/dtheta=a(1+t^2)/(2*pi*v), E_theta[t]=ts and a(1+ts^2+V)=v.',
                      'meanALoop': 'a', 'meanMinusBLoop': '-bs', 'sampledMeanUsed': False},
        'primitiveValueBounds': {'AAbsoluteUpper': '2', 'BAbsoluteUpperOverE': '1',
                                 'C12ForEveryIntegerNAtLeastFour': ['abs(EN/E-1) <= 4/N', 'abs(UN-U)/E <= 1/N']},
        'scope': {'sameAnalyticSourceOnWholeJoiningRectangle': True, 'allPhaseConeMarginsComputed': all(checks.values()),
                  'sameLoopExtendedThroughEntireC12Interval': False,
                  'C12SlowDerivativeBoundsCertified': False, 'finiteNForWholeSourceSelected': False,
                  'sourceC12MomentDebtBoundToPatch': False, 'wholeFinalProfileConeCertified': False,
                  'newLeanAnalyticPremiseProof': False, 'originalN305Promoted': False, 'originalN306Promoted': False},
        'remainingInput': ['One relaxed-cone profile on the entire I with admissible radial collars.',
                           'Uniform positive margins and finite absolute p_s bounds for that same I.',
                           'Quantitative slow radial and eta derivatives of the same loop, using the base profile through eta order two.',
                           'C12 value and moment error constants on I through the actual reserved source patch.',
                           'A single frequency satisfying those inequalities plus the source-lambda correction-map radii.'],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', type=Path, default=HERE.parent/'source-coherence/uniform-source-debt-small-j.json')
    ap.add_argument('--binding', type=Path, default=HERE/'source-bound-moment-inclusion.json')
    ap.add_argument('--rectangle', type=Path, default=HERE/'source-joining-rectangle-certificate.json')
    ap.add_argument('--output', type=Path, default=HERE/'source-joining-loop-certificate.json')
    args = ap.parse_args()
    result = build(args.source,args.binding,args.rectangle)
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'], 'checks':result['checks'],
                      'bounds':{k:result['parameters'][k]['approximate'] for k in
                                ['muMaxTimesXR','absMuP2Upper','absTUpper','deltaL','aLoopLower','PcMinusVOverXRLower','quadraticConeGapOverXR2Lower']}},indent=2))
    assert result['allScalarChecksPassed']


if __name__ == '__main__':
    main()
