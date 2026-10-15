"""Independent source algebra and exact absorptions for literal B26 E/a positivity."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

BASE=Path(__file__).resolve().parent


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--kernels',type=Path,default=BASE/'regularity-source')
    ap.add_argument('--natural',type=Path,default=BASE/'actual_natural_radial_positivity.json')
    ap.add_argument('--binding',type=Path)
    ap.add_argument('--out',type=Path,default=BASE/'actual_b26_radial_positivity.json')
    args=ap.parse_args()
    try:import sympy as s
    except ImportError:
        sys.path.insert(0,str(BASE/'audit-deps'));import sympy as s
    natural=json.loads(args.natural.read_text(encoding='utf-8'))
    assert natural['fixedDefinitionSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
    assert natural['provedActualConclusions']['actualPhiYUpper']=='-chi/32-t/16<0'
    e,h,j,t,f,fe,q,qe,zeta,chi,Lam,z,Q=s.symbols('eta h j t f feta q qeta zeta chi Lambda z Q')
    D=s.Rational(1,2)-h;d=1-e*e;L=1-2*h*e*e;Us=4*e+j;Hs=D*e+d*Us
    Ws=1-4*d-2*D*e*Us;Bneg=-3+h-j*e
    C0=(1-h)-4*d+2*(h-D)*e*Us
    assert s.expand(C0-(2*Ws-Bneg))==0
    Feta_over_g=fe+zeta*f/t
    actual=(1-h)*f-D*e*Feta_over_g-d*((4+t*qe)*f+(Us+t*q)*Feta_over_g)+2*(h-D)*e*(Us+t*q)*f
    expected=(C0+L*chi/t)*f-Hs*fe-d*q*zeta*f+t*(-d*qe*f-d*q*fe+2*(h-D)*e*q*f)
    assert s.cancel(t*(actual-expected)+f*(Hs*zeta+L*chi))==0
    assert s.expand((-Ws+C0/s.Integer(2))-(-Bneg/s.Integer(2)))==0
    assert s.expand(Lam*z*z/s.Integer(16)+4*Q**8/Lam-Q**4*z-Lam/s.Integer(16)*(z-8*Q**4/Lam)**2)==0
    # Losing the order-one q*zeta term is an algebraically different source.
    wrong=expected+d*q*zeta*f
    assert s.cancel(t*(actual-wrong)+f*(Hs*zeta+L*chi))!=0
    assert 400+2**15<2**16
    assert 200+2+1+1<2**260
    assert 4*222<2**260
    assert 2048+164<4096 and 512+40<1024
    export=json.loads((args.kernels/'SOURCE_EXPORT.json').read_text(encoding='utf-8'))
    path='research-ide/mathscope-m2/navier/actual-continuation-exact-pregluing.mjs'
    pinned=next(r for r in export['files'] if r['path']==path)
    digest=hashlib.sha256((args.kernels/path).read_bytes()).hexdigest();assert digest==pinned['sha256']
    binding_checked=False
    if args.binding:
        binding=json.loads(args.binding.read_text(encoding='utf-8'))
        assert binding['schema']=='MathScope.N6.ActualNaturalB26SourceBinding/1'
        assert binding['sourceSHA256']==digest and binding['sourceBytesUnchanged']
        assert all(binding['checks'].values()) and binding['diagnosticOverlap']>0
        binding_checked=True
    result={'schema':'MathScope.N6.ActualB26RadialPositivity/1','sourcePath':path,'sourceSHA256':digest,
      'independentExactChecks':{'sourceAngularDensityDecompositionModuloExactZetaRelation':True,
        'C0Equals2WsMinusBneg':True,'baselineMinusBnegOver2':True,'youngAbsorptionExactSquare':True,
        'omittedActualQZetaTermRejected':True,'allIntegerAbsorptionsPass':True},
      'actualReferenceSource':{'domain':'all X>0, eta in [-33/32,33/32]',
        'QsLower':'1/2','P1Lower':'X/2','QsUpper':'Q^65'},
      'actualB26':{'domain':'Xa<=X<=110, eta in [-33/32,33/32]',
        'aLower':'2t1/Lambda','aInverseUpper':'CSelected^122<S',
        'ELower':'positive','EInverseUpper':'CSelected^3','aUpper':'CSelected'},
      'originalProducerBindingExecuted':binding_checked,'naturalMonotonicityDependency':natural['schema'],
      'proof':'ACTUAL_B26_RADIAL_POSITIVITY_KO.md',
      'remainingWholeLoopGates':['Actual B26 p2/vs envelope','B34/B8 actual completed-field domains and envelopes','Two actual C1 endpoint collars'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,'newLeanExecution':False}
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'exactSourceDecompositionChecks':4,'sourceHashVerified':True,'originalProducerBindingExecuted':binding_checked,'newDischarged':0}))


if __name__=='__main__':main()
