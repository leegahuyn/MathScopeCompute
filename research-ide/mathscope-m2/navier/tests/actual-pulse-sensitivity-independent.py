#!/usr/bin/env python3
"""Independent coefficient-algebra and high-precision variation controls.

The Fraction verifier differentiates its own time-ordered polynomial series,
not the runtime's augmented matrix. No generic-control coefficient is used
as an actual N3 value. Output is stdout unless --output is explicitly given.
"""
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
from pathlib import Path
import argparse, json, subprocess

def add(x,y):
    r=dict(x)
    for k,v in y.items():
        r[k]=r.get(k,F(0))+v
        if not r[k]: del r[k]
    return r
def scale(x,c): return {k:v*c for k,v in x.items() if v*c}
def mul(x,y):
    r={}
    for (i,j),v in x.items():
        for (k,l),w in y.items(): r=add(r,{(i+k,j+l):v*w})
    return r
def power(x,n):
    r={(0,0):F(1)}
    for _ in range(n): r=mul(r,x)
    return r
def dv_integral(x): return {(i+1,j):v/F(i+1) for (i,j),v in x.items()}
def da(x): return {(i,j-1):j*v for (i,j),v in x.items() if j}

def run(fixture):
    nodes=fixture['nodes'];v_id=fixture['coordinates']['v'];a_id=fixture['coordinates']['a'];cache={};checks=[]
    one={(0,0):F(1)};a={(0,1):F(1)};v={(1,0):F(1)}
    def verify(name,condition):
        checks.append({'id':name,'pass':bool(condition)})
        if not condition: raise AssertionError(name)
    def poly(i):
        if i in cache:return cache[i]
        n=nodes[i];op=n['op'];s=n['args']
        if op=='rational': r={(0,0):F(*map(int,s))} if int(s[0]) else {}
        elif op=='coordinate':
            if i not in (v_id,a_id):raise ValueError('unbound control coordinate')
            r=v if i==v_id else a
        elif op=='add':r=add(poly(s[0]),poly(s[1]))
        elif op=='multiply':r=mul(poly(s[0]),poly(s[1]))
        elif op=='integer_power':r=power(poly(s[0]),s[1])
        elif op=='inverse':
            p=poly(s[0]);assert set(p)=={(0,0)};r={(0,0):1/p[(0,0)]}
        else:raise ValueError('Not an exact control polynomial: '+op)
        cache[i]=r;return r
    M=[[mul(a,v),add(one,a)],[v,scale(a,F(-1,2))]];initial=[add(one,a),power(a,2)]
    term=initial;total=initial
    for row in fixture['orders']:
        n=row['terms'];expected=total+[da(x) for x in total]
        for j in range(4):verify(f'noncommuting-order-{n}-component-{j}',poly(row['roots'][j])==expected[j])
        term=[dv_integral(add(mul(M[i][0],term[0]),mul(M[i][1],term[1]))) for i in range(2)]
        total=[add(total[i],term[i]) for i in range(2)]
    for i in range(2):
        for j in range(2):verify(f'actual-matrix-derivative-{i}-{j}',poly(fixture['matrixDerivative'][i][j])==da(M[i][j]))
    # Exact nilpotent solution at a moving left endpoint a/4.
    exact0=add(add(one,a),add(mul(a,v),scale(power(a,2),F(-1,4))))
    exact=[exact0,one,da(exact0),{}]
    for j in range(4):verify(f'moving-left-exact-solution-{j}',poly(fixture['moving']['values'][j])==exact[j])
    verify('moving-initial-boundary-term',poly(fixture['moving']['initial'][0])==add(one,scale(a,F(-1,4))))
    verify('moving-right-endpoint-chain-rule',poly(fixture['moving']['totalEndpointDerivative'])==add({(0,0):F(3,2)},scale(a,F(1,2))))
    def omitted_variation(*,matrix=False,datum=False):
        # Keep M and the original g fixed; omit exactly one derivative input.
        w=list(initial);s=[{},{}] if datum else [da(x) for x in initial];total=list(s)
        for _ in range(2):
            wn=[dv_integral(add(mul(M[i][0],w[0]),mul(M[i][1],w[1]))) for i in range(2)]
            sn=[dv_integral(add(add(mul(M[i][0],s[0]),mul(M[i][1],s[1])),
                {} if matrix else add(mul(da(M[i][0]),w[0]),mul(da(M[i][1]),w[1])))) for i in range(2)]
            w=wn;s=sn;total=[add(total[i],s[i]) for i in range(2)]
        return total
    verify('omitted-matrix-derivative-fails',poly(fixture['orders'][2]['roots'][2])!=omitted_variation(matrix=True)[0])
    verify('omitted-initial-derivative-fails',poly(fixture['orders'][2]['roots'][2])!=omitted_variation(datum=True)[0])
    verify('omitted-moving-left-term-fails',poly(fixture['moving']['initial'][0])!=one)
    verify('omitted-moving-right-term-fails',poly(fixture['moving']['totalEndpointDerivative'])!=add({(0,0):F(3,2)},{}))
    with localcontext() as ctx:
        ctx.prec=90
        values={v_id:D(3)/4,a_id:D(1)/2};memo={}
        def dec(i):
            if i in memo:return memo[i]
            op=nodes[i]['op'];s=nodes[i]['args']
            if op=='rational':x=D(s[0])/D(s[1])
            elif op=='coordinate':x=values[i]
            elif op=='add':x=dec(s[0])+dec(s[1])
            elif op=='multiply':x=dec(s[0])*dec(s[1])
            elif op=='inverse':x=1/dec(s[0])
            elif op=='integer_power':x=dec(s[0])**s[1]
            elif op=='exp':x=dec(s[0]).exp()
            elif op=='maximum':x=max(map(dec,s))
            else:raise ValueError('Unresolved numerical control '+op)
            memo[i]=x;return x
        exact=(D(3)/8).exp()*(1+D(3)/2*D(3)/4);previous=None
        for r in fixture['tails']:
            error=abs(exact-dec(r['value']));bound=dec(r['tail'])
            verify(f'factorial-tail-encloses-{r["terms"]}',0<error<=bound)
            if previous is not None:verify(f'factorial-tail-decreases-{r["terms"]}',bound<previous)
            previous=bound
    return {'schema':'MathScope.PulseSensitivityIndependentVerification/1','pass':all(c['pass'] for c in checks),'checks':checks,'total':len(checks),'actualSourceValuesReplaced':False,
        'method':'Independent Fraction polynomial/time-order recurrence and ordinary parameter differentiation; 90-digit Decimal exponential tail checks.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--fixture',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args()
    if args.fixture:fixture=json.loads(args.fixture.read_text())
    else:fixture=json.loads(subprocess.check_output(['node',str(Path(__file__).with_name('actual-pulse-sensitivity-fixture.mjs'))],text=True))
    result=run(fixture);body=json.dumps(result,ensure_ascii=False,indent=2)
    if args.output:args.output.write_text(body+'\n')
    print(body)
