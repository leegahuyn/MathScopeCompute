"""Evaluate only the finite synthetic DAG with exact symbolic integration."""
import json, math
from functools import lru_cache
from pathlib import Path
import sympy as s

here=Path(__file__).resolve().parent
data=json.loads((here/'fixture-nodes.json').read_text(encoding='utf8'))
nodes=data['nodes'];xi=s.Symbol('fixture_xi',real=True)
@lru_cache(None)
def val(i):
 n=nodes[i];op=n['op'];a=n['args']
 if op=='rational':return s.Rational(int(a[0]),int(a[1]))
 if op=='coordinate':return s.Symbol(a[0],real=True)
 if op=='add':return val(a[0])+val(a[1])
 if op=='multiply':return val(a[0])*val(a[1])
 if op=='integer_power':return val(a[0])**a[1]
 if op=='definite_integral':
  body,t,lo,hi=a;v=val(t);assert v.is_Symbol
  return s.integrate(val(body),(v,val(lo),val(hi)))
 raise ValueError(f'Unsupported fixture op {op} at {i}')

out=[]
for n in range(9):
 y=s.expand(val(data['roots'][f'partial{n}']))
 expected=sum(xi**k/s.factorial(k) for k in range(1,n+1))
 assert s.expand(y-expected)==0,(n,y,expected)
 defect=s.simplify(s.diff(y,xi)-1-y)
 assert s.expand(defect+xi**n/s.factorial(n))==0,(n,defect)
 out.append({'count':n,'partial':str(y),'ODE_defect':str(defect),'defect_at_one':str(defect.subs(xi,1))})
assert out[3]['defect_at_one']=='-1/6'
result={'status':'PASS','scope':'Synthetic system only; does not evaluate actual source Picard field or prove physical convergence.', 'checks':out}
(here/'exact-partials.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print('PASS: source-generated synthetic partials 0..8 evaluated exactly; every finite ODE defect at xi=1 is nonzero.')
