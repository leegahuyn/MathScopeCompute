#!/usr/bin/env python3
"""Independent non-quadrature proof of the actual Md=1 outer cone failure.

Uses ODE barriers, bounded positive reference primitives, and only the
remaining exact axial segment of the A.21 pressure integral. No continuous
quadrature routine or pressure-tail upper envelope is imported.
"""
from pathlib import Path
from fractions import Fraction as F
from math import factorial
import hashlib
import json

HERE=Path(__file__).resolve().parent


def rec(x):
    x=F(x)
    return {'numerator':str(x.numerator),'denominator':str(x.denominator),'approximate':float(x)}


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    source_path=HERE.parent/'source-coherence/uniform-source-debt-final.json'
    source=json.loads(source_path.read_text())
    axis_path=source_path.parent/source['sourceFiles']['axisCertificate']['file']
    axis=json.loads(axis_path.read_text())
    par=axis['sourcePressureCertificate']['parametersExact']
    assert F(par['Md'])==1 and F(par['logP'])==14
    assert sha(axis_path)==source['sourceFiles']['axisCertificate']['sha256']
    h=F(par['h']);eta=F(3,4);d=1-eta*eta
    D=F(1,2)-h;A=F(1,2)+h;L=1-2*h*eta*eta
    f=1/(1+eta*eta);Jprime=2*eta/(1+eta*eta)
    Ceta=-h*(1-8*eta*eta)+(D+4*d)*eta*Jprime
    a0=4*L-1
    Qideal=(F(3,5)*a0+Ceta)/F(8,5)
    c0=-h+D*eta*Jprime
    c1=2*h*eta*eta+d*eta*Jprime
    # Elementary bounds for e from a positive finite Taylor sum and its
    # geometric remainder. They imply 1<sqrt(e)<2 and e>sqrt(e).
    elo=sum(F(1,factorial(k)) for k in range(9))
    ehi=elo+F(1,factorial(9))/(1-F(1,10))
    axial_factor=1-F(1,2**11)
    E2lower=f*f*2**26
    # All dropped terms have a nonpositive sign.  The bars denote reference
    # primitives; their S combination equals the matched source S exactly.
    Nupper=(F(9,2)+27*h)/E2lower-(2*A*eta+d*Jprime)*axial_factor
    bswlower=2*16*eta*(-Nupper)/3
    firstupper=2-bswlower
    pc_p1_upper=1-bswlower/2
    pc_xr_upper=F(2,3)*pc_p1_upper
    checks={
      'sourceAxisAndPressureUseSameH':str(h)==axis['selectedParameters']['h']==axis['sourcePressureCertificate']['parameterHExact'],
      'strictParameterDomain':0<h<F(1,1000) and 0<L<1 and d>0 and A>0,
      'elementaryEBounds':2<elo<ehi<4,
      'idealQBetweenOneAndThree':1<Qideal<3,
      'firstTransitionLowerBarrier':a0>1 and Ceta>1,
      'firstTransitionUpperBarrier':a0<3 and Ceta<3,
      'axialSourceLowerBarrier':c0>F(1,3) and c1>0,
      'axialSourceUpperBarrier':c0+4*c1<3,
      'positiveCurrentEnergyLower':E2lower>0,
      'remainingAxialPressureMassPositive':axial_factor>0,
      'actualNsOverE2BelowMinusOne':Nupper<-1,
      'bsTimesWAboveEight':bswlower>8,
      'aMinusBsWBelowMinusSix':firstupper<-6,
      'necessaryPcConditionFails':pc_p1_upper<0 and pc_xr_upper<0,
    }
    result={
      'schema':'MathScope.OuterCounterexampleIndependentBarrier/1',
      'status':'CERTIFIED_ACTUAL_Md1_CONE_FAILURE' if all(checks.values()) else 'FAILED',
      'sourceSHA256':sha(source_path),'axisSHA256':sha(axis_path),
      'parameters':{k:par[k] for k in ['Md','logP','h','lambda','co']},
      'witness':{'eta':'3/4','localAxialY':'sqrt(e)-1','globalLogXOverXR':'sqrt(e)',
                 'a':'2','k':'2','kPrime':'-32/sqrt(e)'},
      'method':'Exact rational ODE barriers and positive partial tail integrals; no quadrature and no tail truncation.',
      'bounds':{k:rec(v) for k,v in {
          'eLower':elo,'eUpper':ehi,'Qideal':Qideal,'Ceta':Ceta,
          'axialSourceLower':c0,'axialSourceUpper':c0+4*c1,
          'currentE2Lower':E2lower,'remainingAxialMassFactorLower':axial_factor,
          'NsOverE2Upper':Nupper,'bsTimesWLower':bswlower,
          'aMinusBsWUpper':firstupper,'PcOverP1Upper':pc_p1_upper,'PcOverXRUpper':pc_xr_upper}.items()},
      'analyticFacts':[
          'sigma(1/2)=1/2 and sigmaPrime(1/2)=8 exactly.',
          'Ideal Q is in (1,3). In the first transition Qprime+(1+l)Q=(4L-1)l+Ceta with l>=0; barriers 1 and 3 apply.',
          'In the axial transition Qprime+Q=c0+c1*k, 0<=k<=4. Thus 1/3<Q<=3.',
          'Reference primitives obey 0<=kbar<=4 and 0<=kSquaredBar<=16, hence |W|<=3. Their S combination equals the matched source S; individual E2 or U2 primitives are not asserted separately matched.',
          'E2=f2*exp(28-2/5-(sqrt(e)-1))>f2*2^26, because sqrt(e)-1<1 and e>2.',
          'The remaining exact axial stage has length e+11-sqrt(e)>11. Its positive pressure mass factor exceeds 1-2^-11.',
          'At positive eta all later unedited A.21 pressure derivative contributions are nonnegative, since 0<=theta<=1; pressure-neutral future corrections may be omitted before their support.',
          'Ns/E2 <= (9/2+27h)/E2lower -(2A*eta+d*Jprime)*(1-2^-11), after dropping only nonpositive terms.',
          'Since |kPrime|>16 and Q<=3, bs*w>8. With a=2 and p_s,1>0, Pc=p_s,1*(1-bs*w/a)<0 for every positive XR.'
      ],
      'checks':checks,'passed':sum(checks.values()),'total':len(checks),
      'scope':{'actualCurrentOuterCandidateFailsNecessaryRelaxedCone':True,
          'merelyFailedSufficientCondition':False,'increasingXRCannotRepair':True,
          'currentDatumSupportsOriginalGlobalC12Route':False,
          'previousLocalJoiningCertificatesInvalidated':False,
          'paperExistentialChoiceRefuted':False,'generalNavierStokesClaim':False,
          'newLeanTheorem':False,'sourceOrAcceptanceSnapshotChanged':False},
      'sourcePaperSHA256':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
      'sourcePages':['129: A.2/A.5-A.7','133-135: A.21-A.26','155: B.35'],
      'derivationFile':'OUTER_CANDIDATE_FAILURE.md'}
    (HERE/'outer-counterexample-independent.json').write_text(json.dumps(result,indent=2)+'\n')
    assert all(checks.values())
    print(json.dumps({'status':result['status'],'passed':result['passed'],'total':result['total'],
              'bounds':{k:result['bounds'][k]['approximate'] for k in
                 ['NsOverE2Upper','bsTimesWLower','aMinusBsWUpper','PcOverXRUpper']}},indent=2))


if __name__=='__main__':main()
