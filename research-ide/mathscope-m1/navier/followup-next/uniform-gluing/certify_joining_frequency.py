#!/usr/bin/env python3
"""Choose a finite symbolic frequency for the verified joining contribution.

The incoming moment tolerance is explicit and remains unproved for a whole
global C.12 construction. This program never replaces it with zero.
"""
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I,exp_negative,power
from certify_joining_slow_bounds import q,rec,up

HERE=Path(__file__).resolve().parent


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    lp=HERE/'source-final-joining-loop-certificate.json'
    sp=HERE/'source-final-joining-slow-bounds.json'
    bp=HERE/'source-final-bound-moment-inclusion.json'
    rp=HERE/'source-final-joining-rectangle-certificate.json'
    l,s,b,r=[json.loads(p.read_text()) for p in [lp,sp,bp,rp]]
    assert s['inputs']['loop']['sha256']==sha(lp)
    assert s['inputs']['binding']['sha256']==sha(bp)
    assert s['inputs']['rectangle']['sha256']==sha(rp)
    p={k:q(v) for k,v in l['parameters'].items()}
    f={k:q(v) for k,v in s['fieldDerivativeBounds'].items()}
    rb={k:q(v) for k,v in r['bounds'].items()}
    eps=F(1,2**2048);al=p['aLoopLower'];B=F(3,2)
    dv=eps+(2*B*eps+eps*eps)/(al-eps)+B*B*eps/(al*(al-eps))
    dt=eps/(al-eps)+B*eps/(al*(al-eps))
    tnew=p['absTUpper']+dt
    dpc=eps*(1+tnew)+p['absP2OverXRUpper']*dt
    dj=eps*(1+tnew)+p['absP1OverXRUpper']*dt
    pg=p['PcMinusVOverXRLower']-dpc-dv/p['XRLower']
    jnew=p['absJcOverXRUpper']+dj
    qgap=2*pg*pg-(p['v']-2+dv)*jnew*jnew
    xmin=exp_negative(I(8)).lower();xmax=exp_negative(I(5)).upper()
    h=F(b['sourceProfile']['h']);D=F(1,2)-h;A=F(1,2)+h;Lmin=1-2*h
    E=rb['EPositiveLower'];W=3+rb['WError'];U=f['U']
    Q=F(63,16)+F(3,4)*h+rb['QsError']
    N=q(b['idealReferenceBounds']['bounds']['Nmax'])+rb['NsError']
    # If every absolute field and cumulative moment error through eta order
    # one is <=z<=1, these constants bound the residual perturbations.
    cw=up((2*D+1)/xmin)
    cq=up(cw+2*((1-h)+D+1+2*abs(h-D))/(xmin*power(I(2*xmin),F(1,2)).lower()*E)+2*(Q+W)/E)
    cn=up(W+(U+1)*cw+(2*D+4*h+1)/xmin+4*A+1)
    cp1=up(xmax*cq/Lmin)
    cp2=up(xmax/Lmin*(2*cn/E+2*N/E**2))
    sensitivity=max(F(1),cp1,cp2)
    constants=[q(v) for x in s['C12FieldErrorCoefficients'].values() for v in x]
    constants += [q(v) for x in s['C12MomentIncrementErrorCoefficients'].values() for v in x]
    constants += [q(v) for v in s['C12ShearErrorCoefficients'].values()]
    H=max(constants)
    ratio=4*H*sensitivity/eps
    ceiling=-(-ratio.numerator//ratio.denominator)
    bits=max(4,ceiling.bit_length()+2)
    localFactor=F(1,2**bits)
    incoming=eps/(2*sensitivity)
    local=H*localFactor
    zbound=incoming+local
    logN=q(s['loopDerivativeCommonExponential'])+bits
    checks={
       'sourceAndDerivativeHashesMatch':True,
       'perturbedAngularShearPositive':al>eps,
       'perturbedVStrictlyAboveTwo':p['v']-2>dv,
       'perturbedPcMinusVStrictlyPositive':pg>0,
       'perturbedQuadraticConeGapPositive':qgap>0,
       'localFrequencyExponentPositive':logN>4,
       'integerDyadicTailBoundValid':F(2**bits)>ratio,
       'localGeneratedMomentAndFieldErrorFits':local<eps/(4*sensitivity),
       'incomingToleranceStrictlyPositive':incoming>0,
       'totalPerturbationFitsLipschitzRegime':zbound<1 and zbound<E/2,
       'residualPerturbationWithinConeTolerance':sensitivity*zbound<eps,
       'shearPerturbationWithinConeTolerance':H*localFactor<eps,
    }
    result={
       'schema':'MathScope.JoiningFrequencyContribution/1',
       'status':'FINITE_JOINING_FREQUENCY_WITH_EXPLICIT_INCOMING_TOLERANCE' if all(checks.values()) else 'FAILED',
       'inputs':{p.name:sha(p) for p in [lp,sp,bp,rp]},
       'domain':l['domain'],
       'perturbationTolerance':rec(eps),
       'robustConeBounds':{k:rec(v) for k,v in {
           'aLower':al-eps,'vMinusTwoLower':p['v']-2-dv,
           'PcMinusVOverXRLower':pg,'quadraticGapOverXR2Lower':qgap,
           'vErrorUpper':dv,'tErrorUpper':dt}.items()},
       'residualSensitivity':{k:rec(v) for k,v in {
           'W':cw,'Qs':cq,'Ns':cn,'p1OverXR':cp1,'p2OverXR':cp2,'maximum':sensitivity}.items()},
       'finiteFrequency':{'kind':'CEIL_EXP_EXACT_RATIONAL','exponentExact':str(logN),
             'definition':'N_local=ceil(exp(exponentExact)); every larger integer also satisfies the joining estimates.',
             'integerMaterialized':False,'reason':'The integer is finite but too large to expand. Phase remains an independent circle coordinate for verification.',
             'dyadicSafetyExponent':bits,'allInequalitiesUseExactExponent':True},
       'localGeneratedErrorBound':rec(local),
       'incomingMomentTolerance':rec(incoming),
       'incomingMomentOrder':['M','I','J','S','Cp'],
       'incomingDerivativeOrders':[0,1],
       'incomingMomentUnits':'The original B.35 hats: M/XR, I/XR^(3/2), J/XR^(3/2), S/XR, Cp.',
       'incomingAssumptionStatus':'OPEN: each true accumulated C.12 moment error and its eta derivative at x=exp(-8) must satisfy this tolerance. It has not been assigned a value or set to zero.',
       'meaning':'The actual joining loop has a verified robust cone. The chosen finite frequency makes this rectangle\'s field, shear, and generated moment contribution fit its tolerance. A cone assertion for the modulated field additionally requires the recorded incoming bound and a compatible global loop.',
       'checks':checks,'allScalarChecksPassed':all(checks.values()),
       'scope':{'actualJoiningContributionFrequencySelected':True,'allPhaseRobustConeToleranceVerified':True,
             'incomingMomentBoundProved':False,'sameLoopOnWholeOriginalI':False,
             'globalC12FiniteNSelected':False,'sourceWideConeProved':False,
             'actualSourceC2PatchRestored':False,'originalN305Promoted':False,'originalN306Promoted':False}}
    (HERE/'source-final-joining-frequency.json').write_text(json.dumps(result,indent=2)+'\n')
    assert all(checks.values())
    print(json.dumps({'status':result['status'],'checks':checks,
          'dyadicSafetyExponent':bits,'logNScientific':rec(logN)['scientificDisplay'],
          'incomingTolerance':rec(incoming)['scientificDisplay']},indent=2))


if __name__=='__main__':main()
