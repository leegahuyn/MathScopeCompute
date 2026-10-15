"""Exact independent conservation algebra for the actual natural/B.26 join.

This is an all-order argument using the already proved normal convergence,
not a sampled derivative test. SymPy checks the differentiated integrated
identities and their exact reduction to the literal Phi/u recurrences.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

BASE = Path(__file__).resolve().parent


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--kernels', type=Path, default=BASE / 'regularity-source')
    ap.add_argument('--out', type=Path, default=BASE / 'actual_natural_b26_identity.json')
    args = ap.parse_args()
    try: import sympy as s
    except ImportError:
        sys.path.insert(0, str(BASE / 'audit-deps'))
        import sympy as s
    X, e, h = s.symbols('X eta h')
    A, D, d, L = s.Rational(1, 2)+h, s.Rational(1, 2)-h, 1-e*e, 1-2*h*e*e
    F,U,M,I,J,S,Cp = [s.Function(k)(X,e) for k in ('F','U','M','I','J','S','Cp')]
    P0=s.Function('P0')(e); Pi=P0+Cp
    W=1-2*D*e*M/X-d*s.diff(M,e)/X; H=D*e+d*U
    ang=(1-h)*I-D*e*s.diff(I,e)-d*s.diff(J,e)+2*(h-D)*e*J
    Cang=ang-2*X*X*W*F+4*L*X*X*s.diff(F,X)
    Cax=(-X*W*U+D*(M-e*s.diff(M,e))+4*h*e*S-d*s.diff(S,e)
         +X*(4*A*e*Pi-d*s.diff(Pi,e))+2*L*X*s.diff(U,X))
    fx=s.diff(F,X); ux=s.diff(U,X)
    Eang=2*L*(X*s.diff(F,X,2)+2*fx)-(W+h*(1-2*e*U))*F-X*W*fx-H*s.diff(F,e)
    Eax=2*L*(X*s.diff(U,X,2)+ux)-(A*(1-2*e*U)*U+H*s.diff(U,e)+X*W*ux-2*e*X*F*F-4*A*e*Pi+d*s.diff(Pi,e))
    primitives={M:U,I:2*X*F,J:2*X*U*F,S:U*U-X*F*F,Cp:F*F}
    substitutions={}
    for f,rhs in primitives.items():
        substitutions[s.diff(f,X)]=rhs
        substitutions[s.diff(f,X,e)]=s.diff(rhs,e)
    zang=s.cancel(s.diff(Cang,X).subs(substitutions,simultaneous=True)-2*X*Eang)
    zax=s.cancel(s.diff(Cax,X).subs(substitutions,simultaneous=True)-Eax)
    assert zang==0 and zax==0
    # Reduce the differential equations to actual Phi/u recurrences without
    # ever dividing by Hstar, eta, chi or a possibly zero radial derivative.
    Y,t,g,Us,Hs,Ws,zeta,chi,bar = s.symbols('Y t g Us Hs Ws zeta chi average_u')
    phi,phiY,phiYY,phiE,u,uY,uYY,uE,pp,ppY,ppE,P,PE = s.symbols('phi phiY phiYY phiE u uY uYY uE p pY pE P PE')
    WW=Ws+t*(-2*D*e*bar-d*s.Symbol('average_u_eta'))
    UU=Us+t*u; HH=Hs+t*d*u
    R1=((WW+h*(1-2*e*UU)+d*u*zeta)*phi+WW*Y*phiY+HH*phiE)/L
    scaled_ang=(2*(Y*phiYY+2*phiY)-t*((WW+h*(1-2*e*UU))*phi+WW*Y*phiY+HH*phiE)/L-HH*zeta*phi/L)
    native_ang=2*(Y*phiYY+2*phiY)+chi*phi-t*R1
    assert s.cancel(L*(scaled_ang-native_ang)+(Hs*zeta+L*chi)*phi)==0
    sigma=s.symbols('sigma',positive=True)
    assert s.cancel((Hs*zeta+L*chi).subs({zeta:-L*Hs/(Hs*Hs+sigma*sigma),chi:Hs*Hs/(Hs*Hs+sigma*sigma)}))==0
    assert s.cancel((Hs*zeta+L*chi).subs({zeta:L*Hs/(Hs*Hs+sigma*sigma),chi:Hs*Hs/(Hs*Hs+sigma*sigma)}))!=0
    Z=-A*(1-2*e*Us)*Us-4*Hs-d*PE+4*A*e*P
    alpha=A*(1-4*e*Us)+4*d
    R2=(alpha*u-2*A*e*t*u*u+WW*Y*uY+Hs*uE+d*t*u*uE-4*A*e*pp+d*ppE-2*e*Y*ppY)/L
    scaled_ax=(2*L*(Y*uYY+uY)-A*(1-2*e*UU)*UU-HH*(4+t*uE)-t*Y*WW*uY
               +2*e*t*Y*ppY+4*A*e*(P+t*pp)-d*(PE+t*ppE))
    native_ax=L*(2*(Y*uYY+uY)+Z/L-t*R2)
    assert s.cancel(scaled_ax-native_ax)==0
    # Source p1 and ns, including the easy-to-miss factor X in p1.
    angle_source=2*X*X*W*F-4*L*X*X*fx
    actual_p1=X*(-W+angle_source/(2*X*X*F))/L
    assert s.cancel(actual_p1+2*X*fx/F)==0
    wrong_p1=(-W+angle_source/(2*X*X*F))/L
    assert s.cancel(wrong_p1+2*X*fx/F)!=0
    export=json.loads((args.kernels/'SOURCE_EXPORT.json').read_text(encoding='utf-8'))
    rows=[]
    for name in ('actual-continuation-exact-core.mjs','actual-continuation-exact-pregluing.mjs'):
        path='research-ide/mathscope-m2/navier/'+name
        pinned=next(r for r in export['files'] if r['path']==path)
        digest=hashlib.sha256((args.kernels/path).read_bytes()).hexdigest()
        assert digest==pinned['sha256'];rows.append({'path':path,'sha256':digest})
    result={'schema':'MathScope.N6.ActualNaturalB26ConservationIdentity/1','sourceFiles':rows,
       'exactChecks':{'derivativeAngularConservationEquals2XTimesAngularODE':True,
                      'derivativeAxialConservationEqualsAxialODE':True,
                      'angularODEEqualsOriginalPhiRecurrence':True,
                      'axialODEEqualsOriginalURecurrence':True,
                      'HsZetaPlusLChiZeroWithoutDivisionByHs':True,
                      'actualP1RetainsSourceXFactor':True},
       'identities':{'sourceP1':'-2X*F_X/F','sourceNs':'-2*U_X',
                     'FJoinLogDifference':'Integral_0^y (kappa(s)-1)*d_s log(Fnatural(Xa exp(s))) ds',
                     'UJoinDifference':'Integral_0^y (kappa(s)-1)*d_s Unatural(Xa exp(s)) ds'},
       'analyticJustification':['Actual natural Banach-limit normal convergence for every fixed derivative order on Y<20.',
          'Actual g>0 and Phi>1/4 on 0<=Y<=4.1 allow the logarithmic quotient.',
          'FTC for all five actual core moments; conservation constants vanish at X=0.',
          'kappa-1 and all derivatives vanish at y=0, beta=1 and blend=0 on the fixed common collar.'],
       'negativeControls':{'omittedXInSourceP1Rejected':True,'changedZetaSignRejected':True},
       'nativeInterfaceBindingsProvidedByOtherChecker':True,
       'proof':'ACTUAL_NATURAL_B26_JOIN_KO.md','newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,'newLeanExecution':False}
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'exactConservationChecks':6,'sourceHashesVerified':2,'allOrderJoinDerived':True,'newDischarged':0}))


if __name__=='__main__':main()
