#!/usr/bin/env python3
"""Independent SymPy/SNF, mpmath, and exact point-count verification.
Consumes only serialized exact data emitted by Node, never the worker code.
"""
from pathlib import Path
import sys,json,hashlib,platform
from decimal import Decimal,localcontext
root=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
sys.path.insert(0,str(root/'vendor'))
import sympy as sp
from sympy.matrices.normalforms import smith_normal_form
from sympy.polys.domains import ZZ
import mpmath as mp

checks=[]
def check(name,condition,detail=None):
    checks.append({'name':name,'pass':bool(condition),'detail':detail})
    if not condition:raise AssertionError(name)
def mat(m):
    result=sp.zeros(m['rows'],m['cols'])
    for i,j,v in m['entries']:result[i,j]+=sp.Integer(v)
    return result
fixtures=json.loads((root/'evidence/independent-fixtures.json').read_text())
for f in fixtures['complexes']:
    D=f['D'];C=f['complex'];d=[mat(x) for x in C['differentials']];R=f['retraction'];i=[mat(x) for x in R['i']];r=[mat(x) for x in R['r']];h=[mat(x) for x in R['h']]
    check(f'D={D}: SymPy exact product',d[1]*d[0]==sp.zeros(C['dims'][2],C['dims'][0]))
    for j,rank in enumerate([2*D+1,2*D]):
        S=smith_normal_form(d[j],domain=ZZ);diag=[abs(S[k,k]) for k in range(min(S.shape)) if S[k,k]!=0]
        check(f'D={D}: integral Smith normal form d{j}',diag==[1]*rank,{'rank':rank,'diagonal':list(map(str,diag))})
    for k in range(3):
        rhs=sp.zeros(C['dims'][k])
        if k>0:rhs+=d[k-1]*h[k]
        if k<2:rhs+=h[k+1]*d[k]
        check(f'D={D}: independent retract degree {k}',sp.eye(C['dims'][k])-i[k]*r[k]==rhs and r[k]*i[k]==sp.eye([1,0,1][k]))
    for F in f['frobenius']:
        p=F['p'];target=F['target'];dt=[mat(x) for x in target['differentials']];maps=[mat(x) for x in F['maps']]
        check(f'D={D}, p={p}: independent chain Frobenius',all(dt[k]*maps[k]==maps[k+1]*d[k] for k in range(2)))
        check(f'D={D}, p={p}: H2 multiplier',mat(F['transported'][2])==sp.Matrix([[p]]))

k,x,u,v,w,p=sp.symbols('k x u v w p')
for sign in [1,-1]:
    a=sp.Matrix([sign*k*x,-sign*x]);b=sp.Matrix([[-1,-k]]);h1=sp.Matrix([[0,-sign]]);h2=sp.Matrix([[-1],[0]])
    A=a.jacobian([x]);check(f'symbolic all-weight contraction sign={sign}',h1*A==sp.eye(1) and sp.simplify(A*h1+h2*b)==sp.eye(2) and b*h2==sp.eye(1))
    F1=sp.diag(p,1);At=A.subs(k,p*k);bt=b.subs(k,p*k);check(f'symbolic Frobenius sign={sign}',sp.simplify(At-F1*A)==sp.zeros(2,1) and sp.simplify(bt*F1-p*b)==sp.zeros(1,2))

psi=json.loads((root/'evidence/psi-fixture.json').read_text())
with localcontext() as ctx:
    ctx.prec=100
    ball=psi['psi']['ball'];lo=Decimal(ball['lower']['numerator'])/Decimal(ball['lower']['denominator']);hi=Decimal(ball['upper']['numerator'])/Decimal(ball['upper']['denominator']);truth=Decimal(2520).ln()
    check('Decimal100 independent log2520 enclosure',lo<=truth<=hi,{'width':str(hi-lo),'value':str(truth),'note':'Decimal oracle cross-check; the worker enclosure itself follows from exact integer interval arithmetic.'})
check('SymPy independent 64-bit primality',sp.isprime(int(fixtures['largePrime'])),{'n':fixtures['largePrime']})
for prime,N,ap in [(3,4,0),(5,8,-2),(7,8,0),(11,12,0),(13,8,6),(17,16,2)]:
    count=prime+1+sum(int(sp.legendre_symbol((xx**3-xx)%prime,prime)) for xx in range(prime))
    check(f'E/F_{prime}: independent Legendre character sum',count==N and prime+1-count==ap,{'count':count,'a_p':ap})

mp.mp.dps=100
li_truth=mp.quad(lambda t:1/mp.log(t),[2,mp.mpf('10.5')]);estimate=psi['Li2']['value']['value']
check('Li2 is tagged approximate, never an enclosure',psi['Li2']['value']['certified'] is False and psi['Li2']['error']['status']=='UNBOUNDED_APPROXIMATION',{'independentValue':str(li_truth),'estimatedValue':str(estimate),'observedAbsoluteDifference':str(abs(mp.mpf(estimate)-li_truth))})

record={'schema':'MathScope.ArithmeticIndependentValidation/1','status':'PASS','checks':checks,'methods':['SymPy exact integer Smith normal form','SymPy symbolic polynomial identities for all weights','Decimal 100-digit logarithm','SymPy primality and Legendre character sums','mpmath 100-digit quadrature'], 'environment':{'python':platform.python_version(),'sympy':sp.__version__,'mpmath':mp.__version__},'fixtureSha256':hashlib.sha256((root/'evidence/independent-fixtures.json').read_bytes()).hexdigest(),'scope':'Independent numerical checks supplement, and do not replace, exact certificates or external comparison theorems.'}
(root/'evidence/independent-validation.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print('Independent checks:',len(checks),'PASS')
