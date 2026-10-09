#!/usr/bin/env python3
"""Bind the exact continuous map to the source-specific all-eta debt bounds.

The supplied source bound is produced from the actual A.21 certificate and the
exact function-defined B.22/B.26 continuation. It is not a caller debt input or
an identification with the old Float64 arrays. This file computes a smaller
verified root ball and its radial shear bounds using exact Fraction arithmetic.
"""
import argparse
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I,power
from ideal_reference_bounds import source_constants
from verify_uniform_certificate import finite_check,box,q

HERE=Path(__file__).resolve().parent


def rec(x):
    x=F(x)
    return {'numerator':str(x.numerator),'denominator':str(x.denominator),'approximate':float(x)}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source',type=Path,default=HERE.parent/'source-coherence/uniform-source-debt.json')
    ap.add_argument('--output',type=Path,default=HERE/'source-bound-moment-inclusion.json')
    args=ap.parse_args()
    mp=HERE/'uniform-moment-certificate.json';sp=args.source
    cert=json.loads(mp.read_text())['results'][0];source=json.loads(sp.read_text())
    assert all(finite_check(cert).values())
    assert source['sourceFiles']['uniformMomentMap']['sha256']==hashlib.sha256(mp.read_bytes()).hexdigest()
    assert source['status']=='ANALYTIC_BOUND_CHAIN_PASSED'
    raw_u=[q(v) for v in source['uniformDebt']['UAbsoluteUpper']]
    raw_e=[q(v) for v in source['uniformDebt']['EAbsoluteUpper']]
    pre_u=[sum(abs(q(r))*v for r,v in zip(row,raw_u)) for row in cert['exactPreconditionerU']]
    pre_e=[sum(abs(q(r))*v for r,v in zip(row,raw_e)) for row in cert['exactPreconditionerE']]
    bu,be=max(pre_u),max(pre_e)
    zu,ze=q(cert['inverseResidualNormU']),q(cert['inverseResidualNormE'])
    BU=q(cert['nonlinearBounds']['preconditionedUQuadraticNorm'])
    BE=q(cert['nonlinearBounds']['preconditionedEQuadraticNorm'])
    ru=F(101,100)*bu/(1-zu)
    re=F(101,100)*(be+BU*ru*ru)/(1-ze)
    image_u=bu+zu*ru
    image_e=be+BU*ru*ru+ze*re+BE*re*re
    contraction=ze+2*BE*re
    derivative_bounds=None
    second_derivative_bounds=None
    if 'UEtaAbsoluteUpper' in source['uniformDebt'] and 'EEtaAbsoluteUpper' in source['uniformDebt']:
        raw_u1=[q(v) for v in source['uniformDebt']['UEtaAbsoluteUpper']]
        raw_e1=[q(v) for v in source['uniformDebt']['EEtaAbsoluteUpper']]
        beta_u1=max(sum(abs(q(r))*v for r,v in zip(row,raw_u1)) for row in cert['exactPreconditionerU'])
        beta_e1=max(sum(abs(q(r))*v for r,v in zip(row,raw_e1)) for row in cert['exactPreconditionerE'])
        u1=beta_u1/(1-zu)
        e1=(beta_e1+2*BU*ru*u1)/(1-contraction)
        derivative_bounds={k:rec(v) for k,v in {'preconditionedDebtUEta':beta_u1,'preconditionedDebtEEta':beta_e1,'uEtaUpper':u1,'eEtaUpper':e1}.items()}
        if 'UEta2AbsoluteUpper' in source['uniformDebt'] and 'EEta2AbsoluteUpper' in source['uniformDebt']:
            def exact(v):
                if 'numerator' in v:
                    value=q(v)
                    assert 'exact' not in v or value==F(v['exact'])
                    return value
                return F(v['exact'])
            raw_u2=[exact(v) for v in source['uniformDebt']['UEta2AbsoluteUpper']]
            raw_e2=[exact(v) for v in source['uniformDebt']['EEta2AbsoluteUpper']]
            def upper(v):
                scale=1<<320
                return F(-((-v.numerator*scale)//v.denominator),scale)
            beta_u2=upper(max(sum(abs(q(r))*v for r,v in zip(row,raw_u2)) for row in cert['exactPreconditionerU']))
            beta_e2=upper(max(sum(abs(q(r))*v for r,v in zip(row,raw_e2)) for row in cert['exactPreconditionerE']))
            u2=upper(beta_u2/(1-zu))
            e2=upper((beta_e2+2*BU*(u1*u1+ru*u2)+2*BE*e1*e1)/(1-contraction))
            second_derivative_bounds={k:rec(v) for k,v in {'preconditionedDebtUEta2':beta_u2,'preconditionedDebtEEta2':beta_e2,'uEta2Upper':u2,'eEta2Upper':e2}.items()}
    bmax=q(cert['radialBounds']['bumpSupremum'])
    bpmax=q(cert['radialBounds']['normalizedBumpDerivativeSupremum'])
    supports=[[q(v) for v in s] for s in cert['geometry']['supports']]
    min_base=min(power(I(l,r),F(1,10)).lower() for l,r in supports[2:])
    lower_e=min_base-re*bmax
    delta_a=max(2*re*(r*bpmax/(r-l)+F(1,10)*bmax)/lower_e for l,r in supports[2:])
    bs_bound=max(2*r*ru*bpmax/(r-l)/power(I(l,r),F(1,10)).lower() for l,r in supports[:2])
    axis_path=sp.parent/source['sourceFiles']['axisCertificate']['file']
    ideal=source_constants(axis_path)
    bs_allowed=q(ideal['bounds']['B36AllowedBs'])
    checks={'sameSourceAxisCertificate':source['sourceFiles']['axisCertificate']['sha256']==hashlib.sha256(axis_path.read_bytes()).hexdigest(),
            'UReportedBoundIndependentlyReproduced':pre_u==[q(v) for v in source['uniformDebt']['preconditionedUUpper']],
            'EReportedBoundIndependentlyReproduced':pre_e==[q(v) for v in source['uniformDebt']['preconditionedEUpper']],
            'UBallStrictInclusion':image_u<ru,'EBallStrictInclusion':image_e<re,'EContraction':contraction<1,
            'AngularFieldPositiveOnAllCorrectionSupports':lower_e>0,
            'B36AngularShearTolerance':delta_a<=F(1,10),'B36AxialShearTolerance':bs_bound<=bs_allowed}
    output={'schema':'MathScope.SourceDebtMomentBinding/1',
            'status':'SOURCE_DEBT_BOUND_AND_RADIAL_TOLERANCES_PASSED' if all(checks.values()) else 'MOMENT_INCLUSION_PASSED_WITH_REMAINING_RADIAL_TOLERANCE',
            'sourceSHA256':hashlib.sha256(sp.read_bytes()).hexdigest(),'uniformMapSHA256':hashlib.sha256(mp.read_bytes()).hexdigest(),
            'sourceProfile':source['singleSourceProfile'],
            'exactBounds':{k:rec(v) for k,v in {'preconditionedU':bu,'preconditionedE':be,'uRadius':ru,'eRadius':re,'uImage':image_u,'eImage':image_e,'eContraction':contraction,'normalizedEPositiveLower':lower_e,'absoluteAngularShearDeviation':delta_a,'absoluteAxialShearBound':bs_bound,'B36AllowedBs':bs_allowed}.items()},
            'checks':checks,'idealReferenceBounds':ideal,
            'etaDerivativeBounds':derivative_bounds,
            'scope':{'continuousB8MapCertified':True,'sourceC0AnalyticBoundsBoundToMap':True,'wholeEtaC0SmallRootEnclosure':all(checks[k] for k in ['sameSourceAxisCertificate','UBallStrictInclusion','EBallStrictInclusion','EContraction']),
                     'sourceAnalyticPremiseBundleKernelChecked':False,'uniformSourceEtaDerivativeBoundsSupplied':derivative_bounds is not None,
                     'B36QsAndNsToleranceCertified':False,'B34AndRestorationConeCertified':False,'wholeFinalProfileConeCertified':False,
                     'oldV54Float64ArraysCertified':False,'originalCriterionN305Promoted':False,'originalCriterionN306Promoted':False}}
    if second_derivative_bounds is not None:
        output['etaSecondDerivativeBounds']=second_derivative_bounds
        output['etaSecondDerivativeBoundArithmetic']='Positive exact Fraction formulas rounded upward to 320-bit dyadics after each bound.'
        output['scope']['uniformSourceEtaSecondDerivativeBoundsSupplied']=True
    args.output.write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps({'status':output['status'],'bounds':{k:v['approximate'] for k,v in output['exactBounds'].items()},'checks':checks},indent=2))


if __name__=='__main__':main()
