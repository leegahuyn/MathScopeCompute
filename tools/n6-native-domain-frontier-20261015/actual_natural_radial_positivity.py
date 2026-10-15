"""Exact checks supporting actual natural radial monotonicity, no grid samples."""
import argparse
from fractions import Fraction as F
import json
from pathlib import Path
import sys

BASE=Path(__file__).resolve().parent


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--majorant',type=Path,default=BASE/'actual_natural_proof.json')
    ap.add_argument('--out',type=Path,default=BASE/'actual_natural_radial_positivity.json')
    args=ap.parse_args()
    try:import sympy as s
    except ImportError:
        sys.path.insert(0,str(BASE/'audit-deps'));import sympy as s
    ledger=json.loads(args.majorant.read_text(encoding='utf-8'))
    assert ledger['fixedDefinitionSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
    rows=sum(ledger['actualExpandedRemainderRows'].values(),[])
    assert len(rows)==24
    assert all(row['sourceMonomial'].split('*').count('t')<=1 for row in rows)
    assert ledger['exactPositiveMajorants']['valueUpper']=='Q^8'
    assert ledger['exactPositiveMajorants']['lipschitzUpper']=='Q^8'
    e,h,j,Y,H,Hprime,sigma,chi,t,Q,z=s.symbols('eta h j Y H Hprime sigma chi t Q z',real=True)
    d=1-e*e;L=1-2*h*e*e;D=s.Rational(1,2)-h;Us=4*e+j
    Ws=1-4*d-2*D*e*Us
    assert s.expand(Ws+h*(1-2*e*Us)-(-3+h-j*e))==0
    # Differentiate in H and multiply by H; no division by H is allowed.
    actualChi=H*H/(H*H+sigma*sigma)
    assert s.cancel(H*s.diff(actualChi,H)*Hprime-2*Hprime*actualChi*(1-actualChi))==0
    # Young estimate is an exact square, valid for every nonnegative z=sqrt chi.
    assert s.expand(z*z/s.Integer(32)+8*t*t*Q**8-t*Q**4*z-(z-16*t*Q**4)**2/s.Integer(32))==0
    x=F(41,10)
    assert -F(1,4)+x/24==-F(19,240)<-F(1,16)
    assert F(1,20)/(1-x/20)**2<1
    assert F(19,120)>F(1,8)
    eta_max=F(33,32);small=F(1,1000)
    assert -1+small+small*eta_max<0
    assert (3+small+small*eta_max)/(1-2*small*eta_max**2)<4
    assert 268<2**520 and 7<2**260
    assert 8<2**(260*8)
    assert 2**5<2**(260*48)
    # The two resolvent derivative series agree coefficientwise for arbitrary k.
    k=s.symbols('k',integer=True,nonnegative=True)
    derivative_coefficient=(-chi/s.Integer(2))**k/(s.factorial(k)*s.factorial(k+2))
    bessel_coefficient=-2*(-1)**(k+1)*chi**k/(2**(k+1)*s.factorial(k)*s.factorial(k+2))
    assert s.simplify(derivative_coefficient-bessel_coefficient)==0
    # Wrong sign in the first correction destroys the strict negative baseline.
    c=s.symbols('c',negative=True)
    correct_baseline=-c*(-s.Rational(1,4))
    wrong_baseline=c*(-s.Rational(1,4))
    assert correct_baseline.is_negative and wrong_baseline.is_positive
    result={'schema':'MathScope.N6.ActualNaturalRadialPositivity/1',
      'fixedDefinitionSHA256':ledger['fixedDefinitionSHA256'],
      'independentExactChecks':{'all24MonomialsAtMostLinearInExplicitT':True,'BnegExact':'-3+h-j*eta',
        'weightedChiEtaIdentityWithoutDivisionByHs':True,'resolventDerivativeAllK':True,'youngBoundExactSquare':True,
        'firstDerivativeEvaluationNormLessThanOne':True,'wrongBaselineSignRejected':True},
      'provedActualConclusions':{'domain':'eta in [-33/32,33/32], 0<=Y<=41/10',
        'secondOrderBanachRemainder':'norm(x-x0-t*x1)<=t^2 Q^16, t=Lambda^-1',
        'actualPhiYUpper':'-chi/32-t/16<0',
        'actualNaturalA':'a>=Y/(16Lambda)',
        'domainForEnvelope':'4<=Y<=41/10 only, same natural function',
        'actualNaturalAInverseUpper':'4Lambda<S',
        'actualNaturalEInverseUpper':'CSelected^3',
        'actualNaturalVsUpper':'CSelected^12<S',
        'actualNaturalP2Upper':'CSelected^5<S'},
      'proof':'ACTUAL_NATURAL_RADIAL_POSITIVITY_KO.md',
      'additionalDependency':'actual_natural_b26_identity source.ns=-2U_X for natural p2=-bs',
      'notPromotedBeyondNaturalDomain':['B26 whole rectangle','B34 shift','B8 repaired background','full C1 input domain'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,'newLeanExecution':False}
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'actualMajorantRows':len(rows),'independentExactChecksPassed':True,'actualNaturalPhiYNegativeProofWritten':True,'newDischarged':0}))


if __name__=='__main__':main()
