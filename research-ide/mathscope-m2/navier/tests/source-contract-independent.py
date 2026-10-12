"""Independent Fraction polynomial products and Decimal C-infinity cutoff values."""
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
from math import factorial
import json
import sys

data=json.load(sys.stdin);checks=[]
def check(name,value):
    checks.append({'id':name,'pass':bool(value)})
    if not value: raise AssertionError(name)
def dec(x):
    r=F(x);return D(r.numerator)/D(r.denominator)
def add(a,b):return (a[0]+b[0],a[1]+b[1])
def neg(a):return (-a[1],-a[0])
def mul(a,b):
    p=[x*y for x in a for y in b];return (min(p),max(p))
def scale(a,s):return mul(a,(s,s))
def convolution(a,b,n):
    value=(F(0),F(0))
    for j in range(n+1):value=add(value,mul(a[j],b[n-j]))
    return value

for item in data['sums']:
    a=item['activity'];lo=F(a['domain']['log2qMin']);hi=F(a['domain']['log2qMax']);last=a['log2a'][-1]
    check('exact-compact-active-prefix',a['activePositiveOrders']==[i+1 for i,k in enumerate(a['log2a']) if k+lo<0] and a['prefixComplete']==(last+lo>=0))
    if a['prefixComplete']:
        check('all-later-doubling-support-proof',last+lo>=0 and all(k>=a['log2a'][i-1]+1 for i,k in enumerate(a['log2a']) if i>0))
    else:check('prefix-exhaustion-not-a-total-sum',item['localSum'] is None)
    with localcontext() as ctx:
        ctx.prec=100
        sums=[[D(0),D(0)] for _ in range(3)]
        for row in item['summands']:
            offset=D(a['log2a'][row['order']-1])+dec(item['query']['log2q'])
            if offset<=-1:chi=D(1)
            elif offset>=0:chi=D(0)
            else:
                arg=(offset*D(2).ln()).exp();x=2*arg-1
                chi=1/(1+(1/(1-x)-1/x).exp())
            b=row['cutoff']['interval'];check('independent-100-digit-C-infinity-cutoff',D.from_float(float(b[0]))<=chi<=D.from_float(float(b[1])))
            for k,value in enumerate(row['value']):
                sums[k][0]+=chi*dec(value[0]);sums[k][1]+=chi*dec(value[1])
        for k,(lo_sum,hi_sum) in enumerate(sums):
            lo_out,hi_out=item['finiteCutoffPrefixValue'][k]
            check('independent-cutoff-potential-sum',D.from_float(float(lo_out))<=lo_sum and D.from_float(float(hi_out))>=hi_sum)

for tail in data['tails']:
    inp=tail['inputJet'];m=inp['derivativeOrder']
    # Taylor-coefficient polynomial multiplication, independently of the JS
    # raw-derivative binomial loop. Complex real/imag parts are separate.
    psi=[tuple(F(x)/factorial(n) for x in row) for n,row in enumerate(inp['psiDerivatives'])]
    one_minus=[neg(row) for row in psi];one_minus[0]=add(one_minus[0],(F(1),F(1)))
    psi_prime=[scale(psi[n+1],F(n+1)) for n in range(m+1)]
    for component in range(3):
        for part in ('re','im'):
            f=[tuple(F(x)/factorial(n) for x in row[component][part]) for n,row in enumerate(inp['forcingDerivatives'])]
            t=[tuple(F(x)/factorial(n) for x in row[component][part]) for n,row in enumerate(inp['amplitudeDerivatives'])]
            for n in range(m+1):
                actual=scale(add(convolution(one_minus,f,n),convolution(psi_prime,t,n)),F(factorial(n)))
                displayed=tail['rows'][n]['residual'][component][part]
                check('independent-exact-polynomial-tail-derivative',F(displayed[0])<=actual[0] and F(displayed[1])>=actual[1])
print(json.dumps({'schema':'MathScope.IndependentConditionalSourceOperators/1','arithmetic':'Exact Python Fraction polynomial products and prefix comparisons; 100-digit Decimal cutoff reference','checks':checks,'total':len(checks),'pass':all(x['pass'] for x in checks)},separators=(',',':')))
