#!/usr/bin/env python3
"""Independent SymPy polynomial reconstruction; imports no production JS code."""
from pathlib import Path
from fractions import Fraction
import json,hashlib,time,sys
_vendor=Path(__file__).resolve().parents[3]/'arithmetic/vendor'
if _vendor.is_dir(): sys.path.insert(0,str(_vendor))
import sympy as s

ROOT=Path(__file__).resolve().parent
Y,E=s.symbols('Y eta')
def P(x):return s.Poly(x,Y,E,domain=s.QQ)
def rows(a):
    return s.Poly.from_dict({(n,m):s.Rational(*float(v).as_integer_ratio()) for n,row in enumerate(a) for m,v in enumerate(row) if v},(Y,E),domain=s.QQ)
def packed(a):return s.Poly.from_dict({(v['y'],v['eta']):s.Rational(v['value']) for v in a},(Y,E),domain=s.QQ)
def main():
    start=time.time();p=ROOT/'core-audit.json';r=json.loads(p.read_text());raw=r['rawArrays'];h=s.Rational(r['input']['hExact']);lam=s.Rational(r['input']['LambdaExact']);X=P(Y/lam);eta=P(E);one=P(1)
    F,U,Pi0=rows(raw['fRows']),rows(raw['uRows']),rows([raw['piRow']]);A=s.Rational(1,2)+h;D=s.Rational(1,2)-h;d=1-eta**2;L=1-2*h*eta**2
    ix=lambda v:v.integrate(Y)/lam;dx=lambda v:lam*v.diff(Y);de=lambda v:v.diff(E)
    M=ix(U);H=2*X*F;I=ix(H);J=ix(U*H);S=ix(U**2-X*F**2);Cp=ix(F**2);Pi=Pi0+Cp
    nw=X-2*D*eta*M-d*de(M);nv=2*eta*X*U-2*D*eta*M-d*de(M);hc=D*eta+d*U
    rq=-nw*H+(1-h)*I-D*eta*de(I)-d*de(J)+2*(h-D)*eta*J
    rn=-nw*U+D*(M-eta*de(M))+4*h*eta*S-d*de(S)+X*(4*A*eta*Pi-d*de(Pi))
    hs=-2*(nw*(F+X*dx(F))+X*h*(1-2*eta*U)*F+X*hc*de(F))
    sn=-nw*dx(U)-A*(1-2*eta*U)*U-hc*de(U)-d*de(Pi)+4*A*eta*Pi+2*eta*X*dx(Pi)
    at=rq+4*L*X**2*dx(F);az=rn+2*L*X*dx(U)
    expected={'F':F,'U':U,'Pi0':Pi0,'Pi':Pi,'M':M,'H':H,'I':I,'J':J,'S':S,'Cp':Cp,'L':L,'nw':nw,'nv':nv,'radialRegularity':nv.exquo(P(Y)),'rq':rq,'rn':rn,'hSq':hs,'Sn':sn,'angularStressNumerator':at,'axialStressNumerator':az}
    checks=[]
    for k,v in expected.items():checks.append({'id':'field_'+k,'passed':packed(r['fields'][k])==v})
    identities={'pressure':dx(Pi)-F**2,'divergence':dx(nv)-(2*A*eta*U-d*de(U)+2*eta*X*dx(U)),'angular':dx(rq)-hs,'axial':dx(rn)-sn,'M':dx(M)-U,'I':dx(I)-H,'J':dx(J)-U*H,'S':dx(S)-(U**2-X*F**2),'Cp':dx(Cp)-F**2}
    for k,v in identities.items():checks.append({'id':'identity_'+k,'passed':v.is_zero})
    for k,v in [('angular',at),('axial',az)]:
        x=v.eval({Y:4,E:0});checks.append({'id':k+'_stress_nonzero_at_actual_point','passed':x!=0})
        out=next(a for a in r['stressEntries'] if a['id']==k+'StressNumerator');checks.append({'id':k+'_exact_numerator_value','passed':x==s.Rational(out['atY4Eta0'])})
    W=nw.exquo(X);wrong=rn+nw*U-W*U
    checks.append({'id':'wrong_WU_division_detected','passed':not (dx(wrong)-sn).is_zero})
    checks.append({'id':'missing_pressure_increment_detected','passed':not (dx(Pi0)-F**2).is_zero})
    # Separate symbolic A.7 ideal formulas supplied to the cone check.
    x,eta0,h0,K,P0,P1=s.symbols('x eta h K P0 P1',positive=True)
    A0=s.Rational(1,2)+h0;D0=s.Rational(1,2)-h0;dd=1-eta0**2;c=4*eta0;kk=-2*eta0/(1+eta0**2)
    HH=s.sqrt(2*x)*K*x**s.Rational(1,10);ii=s.Rational(5,8)*x*HH;jj=c*ii;mm=c*x;energy=s.Rational(5,12)*K**2*x**s.Rational(6,5);ss=c**2*x-energy;cc=s.Rational(5,2)*K**2*x**s.Rational(1,5)
    ieta=kk*ii;jeta=4*ii+c*ieta;meta=4*x;seta=8*c*x-2*kk*energy;cpeta=2*kk*cc;ww=1-2*D0*eta0*c-dd*4
    qq=-ww+((1-h0)*ii-D0*eta0*ieta-dd*jeta+2*(h0-D0)*eta0*jj)/(x*HH)
    nn=-ww*c+(D0*(mm-eta0*meta)+4*h0*eta0*ss-dd*seta)/x+4*A0*eta0*(P0+cc)-dd*(P1+cpeta)
    qq_expected=s.Rational(9,8)-s.Rational(5,8)*h0+2*h0*eta0**2+s.Rational(5,4)*eta0**2*(D0+4*dd)/(1+eta0**2)
    nn_expected=eta0*(-20+32*(1+h0)*eta0**2)+4*A0*eta0*P0-dd*P1+K**2*x**s.Rational(1,5)*eta0*(5+s.Rational(25,3)*h0+s.Rational(25,3)*dd/(1+eta0**2))
    checks.append({'id':'ideal_Qs_symbolic_formula','passed':s.factor(qq-qq_expected)==0})
    checks.append({'id':'ideal_Ns_symbolic_formula','passed':s.factor(nn-nn_expected)==0})
    result={'schema':'MathScope.Navier.IndependentCoreAlgebra/1','method':'SymPy QQ bivariate polynomials from exact IEEE754 as_integer_ratio; separately derived symbolic ideal formulas','sourceInputSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'passed':sum(a['passed'] for a in checks),'total':len(checks),'allPassed':all(a['passed'] for a in checks),'checks':checks,'seconds':time.time()-start,'scope':'Exact finite-array algebra and source ideal formulas; not the infinite analytic premise bundle.'}
    (ROOT/'core-independent.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['passed','total','allPassed','seconds']},indent=2));assert result['allPassed']
if __name__=='__main__':main()
