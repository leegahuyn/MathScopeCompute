#!/usr/bin/env python3
"""Independent checks of the new C2 root and finite joining contribution."""
import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[2]/'arithmetic/vendor'))
import mpmath as mp


def q(v):
    return F(v['exact']) if 'exact' in v else F(int(v['numerator']),int(v['denominator']))


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def verify(source,binding,matrix,slow,frequency):
    U2=[q(v) for v in source['uniformDebt']['UEta2AbsoluteUpper']]
    E2=[q(v) for v in source['uniformDebt']['EEta2AbsoluteUpper']]
    betaU=max(sum(abs(q(a))*v for a,v in zip(row,U2)) for row in matrix['exactPreconditionerU'])
    betaE=max(sum(abs(q(a))*v for a,v in zip(row,E2)) for row in matrix['exactPreconditionerE'])
    d=binding['etaSecondDerivativeBounds'];old=binding['etaDerivativeBounds'];r=binding['exactBounds']
    u2,e2=q(d['uEta2Upper']),q(d['eEta2Upper'])
    u1,e1=q(old['uEtaUpper']),q(old['eEtaUpper'])
    ru,re=q(r['uRadius']),q(r['eRadius'])
    BU=q(matrix['nonlinearBounds']['preconditionedUQuadraticNorm'])
    BE=q(matrix['nonlinearBounds']['preconditionedEQuadraticNorm'])
    eps=q(frequency['perturbationTolerance']);K=q(frequency['residualSensitivity']['maximum'])
    incoming=q(frequency['incomingMomentTolerance']);local=q(frequency['localGeneratedErrorBound'])
    bits=frequency['finiteFrequency']['dyadicSafetyExponent']
    checks={
      'preconditionedEta2UOutward':q(d['preconditionedDebtUEta2'])>=betaU,
      'preconditionedEta2EOutward':q(d['preconditionedDebtEEta2'])>=betaE,
      'differentiatedLinearRootBound':u2*(1-q(matrix['inverseResidualNormU']))>=betaU,
      'differentiatedQuadraticRootBound':e2*(1-q(r['eContraction']))>=betaE+2*BU*(u1*u1+ru*u2)+2*BE*e1*e1,
      'exactSymbolicFrequencyIncludesSafetyExponent':F(frequency['finiteFrequency']['exponentExact'])==q(slow['loopDerivativeCommonExponential'])+bits,
      'strictResidualTolerance':K*(incoming+local)<eps,
      'nonzeroIncomingTolerance':incoming>0,
      'positiveRobustConeMargins':all(q(frequency['robustConeBounds'][k])>0 for k in
            ['aLower','vMinusTwoLower','PcMinusVOverXRLower','quadraticGapOverXR2Lower']),
      'noIncomingValueInjected':frequency['incomingAssumptionStatus'].startswith('OPEN:') and 'incomingMomentValue' not in frequency,
      'noFullSourcePromotion':not any(frequency['scope'][k] for k in
            ['incomingMomentBoundProved','sameLoopOnWholeOriginalI','globalC12FiniteNSelected','sourceWideConeProved','actualSourceC2PatchRestored','originalN305Promoted','originalN306Promoted']),
      'noGlobalSlowBoundPromotion':not any(slow['scope'][k] for k in
            ['wholeOriginalIntervalSlowBounds','incomingC12MomentDiscrepancyCertified','globalFiniteNSelected','actualC2SourcePatchRestored','sourceWideC12ConeCertified','originalN305Promoted','originalN306Promoted']),
    }
    return checks


def main():
    source_path=HERE.parent/'source-coherence/uniform-source-debt-final.json'
    bp=HERE/'source-final-bound-moment-inclusion.json'
    sp=HERE/'source-final-joining-slow-bounds.json'
    fp=HERE/'source-final-joining-frequency.json'
    source,b,slow,f=[json.loads(p.read_text()) for p in [source_path,bp,sp,fp]]
    matrix=json.loads((HERE/'uniform-moment-certificate.json').read_text())['results'][0]
    checks=verify(source,b,matrix,slow,f)
    for name,v in slow['inputs'].items():
        checks['pinnedInput_'+name]=sha(HERE.parent/v['file'])==v['sha256']
    checks['sourceBinding']=b['sourceSHA256']==sha(source_path)
    for name,expected in f['inputs'].items():
        checks['frequencyPin_'+name]=sha(HERE/name)==expected
    import copy
    bad=copy.deepcopy(b);bad['etaSecondDerivativeBounds']['eEta2Upper']['numerator']='0'
    checks['zeroSecondDerivativeBoundRejected']=not verify(source,bad,matrix,slow,f)['differentiatedQuadraticRootBound']
    bad=copy.deepcopy(f);bad['scope']['globalC12FiniteNSelected']=True
    checks['falseGlobalFrequencyPromotionRejected']=not verify(source,b,matrix,slow,bad)['noFullSourcePromotion']
    bad=copy.deepcopy(f);bad['finiteFrequency']['exponentExact']=str(F(bad['finiteFrequency']['exponentExact'])-1)
    checks['missingFrequencySafetyTermRejected']=not verify(source,b,matrix,slow,bad)['exactSymbolicFrequencyIncludesSafetyExponent']
    # Independent high-precision differentiation of the actual step function.
    # These controls diagnose formula mistakes; whole-cell enclosures remain
    # the continuous proof, not the finite points below.
    mp.mp.dps=100
    smooth=json.loads((HERE/'smooth-derivative-certificate.json').read_text())
    sigma=lambda t:mp.exp(-1/(t*t))/(mp.exp(-1/(t*t))+mp.exp(-1/((1-t)*(1-t))))
    points=['0.00048828125','0.01','0.1','0.25','0.4','0.49','0.5','0.51','0.6','0.75','0.9','0.99','0.99951171875']
    controls=[]
    for value in points:
        t=mp.mpf(value)
        for order in [1,2,3]:
            observed=mp.diff(sigma,t,order)
            bound=q(smooth['bounds']['sigma'+str(order)])
            passed=abs(observed)<=mp.mpf(bound.numerator)/bound.denominator
            assert passed
            controls.append({'t':value,'order':order,'value':mp.nstr(observed,30),'withinCertifiedGlobalBound':passed})
    result={'schema':'MathScope.JoiningSlowIndependentControls/1',
      'sourceSHA256':sha(source_path),'bindingSHA256':sha(bp),'slowSHA256':sha(sp),'frequencySHA256':sha(fp),
      'checks':checks,'passed':sum(checks.values()),'total':len(checks),
      'stepDerivativeDiagnosticPrecisionDigits':100,'stepDerivativeDiagnosticCount':len(controls),
      'stepDerivativeDiagnostics':controls,
      'scope':'Independent exact C2 implicit-root inequalities, source pins, local-frequency tolerance and rejected mutations. High-precision derivative points are diagnostics only. The analytic source-bound and slow-loop calculus derivations are not a new Lean kernel proof.'}
    (HERE/'source-final-joining-slow-independent.json').write_text(json.dumps(result,indent=2)+'\n')
    assert all(checks.values())
    print(json.dumps({'passed':result['passed'],'total':result['total'],'stepDerivativeDiagnostics':len(controls)},indent=2))


if __name__=='__main__':main()
