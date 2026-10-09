#!/usr/bin/env python3
"""Independent Fraction/SymPy/mpmath checks of interval and source-prefix data."""
from pathlib import Path
from fractions import Fraction as F
import json,math,sys,hashlib
sys.set_int_max_str_digits(0)
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[2]/'arithmetic/vendor'))
import mpmath as mp
import sympy as sp

def bounds(d):return F(int(d['lo']),2**d['binaryScale']),F(int(d['hi']),2**d['binaryScale'])
def real(q):q=F(q);return mp.mpf(q.numerator)/q.denominator
def main():
    mp.mp.dps=500
    fixture=json.loads((ROOT/'interval-audit-fixtures.json').read_text());prefix=json.loads((ROOT/'axis-prefix-final.json').read_text());source=json.loads((ROOT/'source-axis-cone-refined.json').read_text())
    checks=[]
    def check(name,ok,detail=None):checks.append({'name':name,'pass':bool(ok),**({'detail':detail} if detail else {})})
    for k,case in enumerate(fixture['cases']):
        lo,hi=bounds(case['result']);kind=case['kind']
        if kind=='arithmetic':
            a,b=F(case['a']),F(case['b']);v={'add':lambda:a+b,'sub':lambda:a-b,'mul':lambda:a*b,'div':lambda:a/b}[case['operation']]()
            check(f'exact-rational-{k}',lo<=v<=hi)
        else:
            x=real(case['value'])
            if kind=='log':v=mp.log(x)
            elif kind=='exp':v=mp.exp(x)
            else:
                if x<=0:v=mp.mpf(0)
                elif x>=1:v=mp.mpf(1)
                else:
                    a=-1/x**2+1/(1-x)**2
                    v=1/(1+mp.exp(-a)) if a>=0 else mp.exp(a)/(1+mp.exp(a))
            check(f'independent-500digit-{kind}-{k}',real(lo)<=v<=real(hi))
    check('all-invalid-inputs-rejected',fixture['allRejectionsPassed'])
    # Independently differentiate the exact first radial recurrence coefficient.
    eta,P0,P2=sp.symbols('eta P0 P2');rat=lambda v:sp.Rational(F(v).numerator,F(v).denominator)
    p=prefix['sourceProfileParameters'];h,j,lam,sigma=map(rat,[p['h'],p['j0'],p['Lambda'],p['sigmaStar']])
    L=1-2*h*eta**2;D=sp.Rational(1,2)-h;A=sp.Rational(1,2)+h;d=1-eta**2;Us=4*eta+j;Hs=D*eta+d*Us;Ws=1-2*D*eta*Us-4*d
    chi=Hs**2/(Hs**2+sigma**2);Pi=P0+P2*eta**2
    Z=-A*(1-2*eta*Us)*Us-4*Hs-d*sp.diff(Pi,eta)+4*A*eta*Pi
    phi1=(-chi+(Ws+h*(1-2*eta*Us))/(lam*L))/4;u1=-Z/(2*L)
    pressure={r['order']:bounds(r['interval']) for r in prefix['analyticInput']['pressureCoefficients']}
    for m in range(3):
        actual=sp.diff(phi1,eta,m).subs(eta,0)/math.factorial(m);q=F(int(actual.p),int(actual.q));lo,hi=bounds(prefix['recurrence']['phi'][1][m]);check(f'first-phi-coefficient-eta-{m}',lo<=q<=hi)
        expr=sp.diff(u1,eta,m).subs(eta,0)/math.factorial(m);lo,hi=bounds(prefix['recurrence']['u'][1][m])
        for i,p0 in enumerate(pressure[0]):
            for k,p2 in enumerate(pressure[2]):
                actual=sp.cancel(expr.subs({P0:rat(p0),P2:rat(p2)}));q=F(int(actual.p),int(actual.q));check(f'first-u-coefficient-eta-{m}-corner-{i}-{k}',lo<=q<=hi)
    M=F(source['tails']['solutionNormUpper']);rho=F(source['selectedParameters']['coefficientRadius']);N=prefix['input']['radialDegree']
    for row in prefix['evaluations']:
        Y=F(row['Y']);k=row['radialDerivative'];m=row['etaDerivative'];n=N+1
        if Y:
            first=M*math.factorial(m)*math.comb(n+m,m)*F(math.factorial(n),math.factorial(n-k))*F(1,(m+1)**2*(n+1)**2)*rho**(-m)*(Y/20)**n/Y**k
            rest=first/(1-Y/20*F(n+1+m,n+1-k))
        else:rest=F(0)
        check(f'independent-tail-{row["Y"]}-{k}-{m}',rest==F(row['infiniteRadialTailUpper']))
    observations=json.loads((ROOT/'source-log-observations-final.json').read_text())
    check('all-final-observations-same-profile',len({x['sourceProfileHash'] for x in observations['observations']})==1)
    check('all-final-observations-same-debt-sha',len({x['sourceFiles']['uniformDebt'] for x in observations['observations']})==1)
    check('all-final-observations-exact-offsets',all('offsetExact' in v or v.get('kind')=='NEGATIVE_INFINITY' for x in observations['observations'] for v in x['logCoordinates'].values()))
    check('no-unexpected-zero-positive-fields',all(not v.get('exactZero',False) or (x['phase']=='axis' and x['coordinate']=='0' and k=='E') or (x['phase']=='activation-factor' and x['coordinate']=='0' and k=='activationFactor') for x in observations['observations'] for k,v in x['fieldIntervals'].items()))
    out={'schema':'MathScope.Navier.IndependentIntervalVerification/1','status':'PASS' if all(c['pass'] for c in checks) else 'FAIL','passed':sum(c['pass'] for c in checks),'total':len(checks),'methods':['Python Fraction containment for rational arithmetic','Independent mpmath 500 decimal digit transcendental comparisons','Independent SymPy first radial recurrence coefficients','Exact Fraction recomputation of the infinite-tail formula','Cross-datum and mathematical-zero integrity checks'],'checks':checks,'proofBoundary':'High-precision transcendental comparisons are independent numerical checks; exact series remainder arithmetic is the producer proof mechanism. Source analytic existence and generated Lean premises remain separate.'}
    (ROOT/'independent-intervals.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'status':out['status'],'passed':out['passed'],'total':out['total'],'failed':[c['name'] for c in checks if not c['pass']]}));assert out['status']=='PASS'
if __name__=='__main__':main()
