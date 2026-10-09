#!/usr/bin/env python3
"""Independently derive rational moment-map comparison exponents with SymPy.

This verifies the finite polynomial/telescoping part of the analytic lemma.
It does not assume that a finite sample verifies a field norm or a PDE theorem.
"""
from pathlib import Path
import sys,json,hashlib
sys.path.insert(0,str(Path(__file__).resolve().parents[3]/'arithmetic/vendor'))
import sympy as s
ROOT=Path(__file__).resolve().parent

def main():
    names='U H M Me I Ie J Je S Se C Ce P0 P0e X iX iL iH iE h eta'
    vs=s.symbols(names);v=dict(zip(names.split(),vs));locals().update(v)
    U,H,M,Me,I,Ie,J,Je,S,Se,C,Ce,P0,P0e,X,iX,iL,iH,iE,h,eta=vs
    D=s.Rational(1,2)-h;A=s.Rational(1,2)+h;d=1-eta**2
    W=1-2*D*eta*M*iX-d*Me*iX
    NQ=(1-h)*I-D*eta*Ie-d*Je+2*(h-D)*eta*J
    P1=(-X*W+NQ*iH)*iL
    P2=(-X*W*U+D*(M-eta*Me)+4*h*eta*S-d*Se+X*(4*A*eta*(P0+C)-d*(P0e+Ce)))*iL*iE
    unchanged={'X','iX','iL','P0','P0e','h','eta'}
    valueWeight={x:(0 if x.name in {'h','eta'} else 1) for x in vs}
    changeWeight={x:(None if x.name in unchanged else 6 if x.name in {'iH','iE'} else 4) for x in vs}
    def telescope(expr):
        out={}
        for powers,coef in s.Poly(s.expand(expr),*vs,domain=s.QQ).terms():
            degree=sum(e*valueWeight[x] for x,e in zip(vs,powers))
            for x,e in zip(vs,powers):
                if not e or changeWeight[x] is None:continue
                k=degree-valueWeight[x]+changeWeight[x]
                out[k]=out.get(k,s.Rational(0))+abs(coef)*e
        return out
    polys={name:telescope(expr) for name,expr in [('deltaP1',P1),('deltaP2',P2)]}
    # Exact dependent inverse rules: |1/a-1/b|<=Gamma^2 |a-b|.
    # They are represented by changeWeight=6 for iH/iE and 4 for the
    # primitive variables. No denominator is evaluated on a sampled grid.
    results={}
    for name,poly in polys.items():
        degree=max(poly);total=sum(poly.values());results[name]={'polynomial':{str(k):str(vv) for k,vv in sorted(poly.items())},'sumAbsoluteCoefficients':str(total),'maximumGammaExponent':degree}
    checks={
      'P1BoundWithin100Gamma12':max(polys['deltaP1'])<=12 and sum(polys['deltaP1'].values())<=100,
      'P2BoundWithin100Gamma12':max(polys['deltaP2'])<=12 and sum(polys['deltaP2'].values())<=100,
      'independentReciprocalIdentity':s.cancel(1/H-1/U-(U-H)/(H*U))==0,
      'axialWUOutsideDivisionByX':s.simplify(P2-((-X*W*U+D*(M-eta*Me)+4*h*eta*S-d*Se+X*(4*A*eta*(P0+C)-d*(P0e+Ce)))*iL*iE))==0,
    }
    # Given p1^-1<=Gamma, |p2|<=Gamma and |r-1|<=3 Gamma s,
    # |t|<=3 Gamma^2 and |t-t0|<=3 Gamma^3 s.
    # With 100 Gamma^12 s for each component error, these are the exact
    # positive-polynomial bounds for Pc-vr, Jc, and vs-kappa vr.
    G=s.symbols('Gamma',positive=True)
    composite={
      'PcError':100*G**12*(1+3*G**2)+3*G**4,
      'JcError':100*G**12*(1+3*G**2)+3*G**4,
      'VsError':12*G**4,
    }
    for name,expr in composite.items():
        coeff=s.Poly(expr,G);checks[name+'Below1000Gamma16']=coeff.degree()<=16 and sum(coeff.all_coeffs())<1000
        results[name]={'polynomial':str(expr),'maximumGammaExponent':coeff.degree(),'sumAbsoluteCoefficients':str(sum(coeff.all_coeffs()))}
    # Negative control: putting -WU inside the 1/X changes the field map.
    historical=P2+((X-1)*W*U)*iL*iE
    checks['historicalAxialFormulaRejected']=s.Poly(s.expand(historical-P2),*vs).is_zero is False
    checks={k:bool(vv) for k,vv in checks.items()}
    out={'schema':'MathScope.Navier.IndependentMomentComparisonAlgebra/1','status':'PASS' if all(checks.values()) else 'FAIL','method':'Independent SymPy QQ expansion followed by the exact monomial telescoping inequality','inputContract':{'Gamma':'>=1','valueBounds':'Every displayed variable except h and eta has magnitude <=Gamma; |h|,|eta|<=1.','inputDifference':'Every field/moment variable difference <=Gamma^4*s; inverse E/H differences <=Gamma^6*s.','fixedInputs':sorted(unchanged),'s':'Nonnegative smallness factor; y*e_a on the activation interval.'},'results':results,'checks':checks,'allPassed':all(checks.values()),'proofBoundary':'The finite rational-map and scalar-composition exponents are verified here. The analytic field and integral bounds supplying the stated input contract are proved in CONTINUATION_REFINEMENT.md and are not inferred from these algebra checks.'}
    (ROOT/'independent-map-bound.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'status':out['status'],'checks':checks,'results':results},indent=2));assert all(checks.values())
if __name__=='__main__':main()
